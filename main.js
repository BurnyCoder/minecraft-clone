import * as THREE from 'three';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; // Remove OrbitControls
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'; // Add PointerLockControls

// Get the instruction element
const instructions = document.getElementById('instructions');

// 1. Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue background

// 2. Camera
const camera = new THREE.PerspectiveCamera(
    75, // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near clipping plane
    1000 // Far clipping plane
);
camera.position.set(0, 10, 5); // Start higher up
// camera.lookAt(0, 0, 0); // PointerLockControls handles looking

// 3. Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 4. Controls - Replace OrbitControls with PointerLockControls
const controls = new PointerLockControls(camera, document.body);

// Add event listener to lock pointer on click
document.body.addEventListener('click', () => {
    controls.lock();
});

controls.addEventListener('lock', () => {
    instructions.style.display = 'none';
});

controls.addEventListener('unlock', () => {
    instructions.style.display = 'block';
});

// Add controls object to the scene so it can be updated
scene.add(controls.getObject());

// Keyboard state
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false // Add spacebar state
};

document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyW': keys.w = true; break;
        case 'KeyA': keys.a = true; break;
        case 'KeyS': keys.s = true; break;
        case 'KeyD': keys.d = true; break;
        case 'Space': keys.space = true; break; // Handle spacebar down
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW': keys.w = false; break;
        case 'KeyA': keys.a = false; break;
        case 'KeyS': keys.s = false; break;
        case 'KeyD': keys.d = false; break;
        case 'Space': keys.space = false; break; // Handle spacebar up
    }
});

// 5. Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// 6. Ground Plane - REMOVE OLD PLANE
// const groundGeometry = new THREE.PlaneGeometry(50, 50); 
// const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22, side: THREE.DoubleSide }); 
// const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
// groundPlane.rotation.x = -Math.PI / 2; 
// groundPlane.position.y = -0.5; 
// scene.add(groundPlane);

// --- Block Management ---
const blocks = []; // Array to hold all interactive blocks

// Function to add a block at a specific position
function addBlock(x, y, z) {
    // Reuse geometry and material for efficiency later
    const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
    // Change default color to green for ground
    const blockMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 }); // Forest green
    const block = new THREE.Mesh(blockGeometry, blockMaterial);
    // Blocks are centered at (x, y, z)
    block.position.set(x, y, z);
    scene.add(block);
    blocks.push(block); // Add to our list
}

// --- Generate Ground Blocks ---
const groundSize = 20; // e.g., 20x20 grid
const groundLevel = -1;
for (let x = -groundSize / 2; x < groundSize / 2; x++) {
    for (let z = -groundSize / 2; z < groundSize / 2; z++) {
        addBlock(x, groundLevel, z);
    }
}

// 7. Initial Block(s)
// Remove the old single cube creation (already done)
addBlock(0, 0, 0); // Add an initial block on top of the new ground

// Movement variables
const moveSpeed = 0.1;
// Remove old velocity/direction, physics handles Y velocity now
// const velocity = new THREE.Vector3(); 
// const direction = new THREE.Vector3();

// --- Player Physics Variables ---
const playerHeight = 1.7; // Approximate player height
const gravity = 0.01;
const jumpForce = 0.15; 
let playerVelocityY = 0;
let onGround = false;

// --- Raycasting Setup ---
const raycaster = new THREE.Raycaster();
const interactionDistance = 5; // Max distance to interact with blocks

// --- Mouse Click Listener ---
window.addEventListener('mousedown', (event) => {
    // Only interact if pointer is locked
    if (!controls.isLocked) return;

    // Raycast from camera center (since pointer is locked)
    raycaster.setFromCamera({ x: 0, y: 0 }, camera); // { x: 0, y: 0 } corresponds to the center of the screen

    const intersects = raycaster.intersectObjects(blocks); // Check only against blocks in our list

    if (intersects.length > 0) {
        const intersection = intersects[0];

        // Check distance
        if (intersection.distance < interactionDistance) {

            if (event.button === 0) { // Left click - Break block
                const objectToRemove = intersection.object;
                scene.remove(objectToRemove);
                // Remove from blocks array
                const index = blocks.indexOf(objectToRemove);
                if (index > -1) {
                    blocks.splice(index, 1);
                }
                // Optional: Dispose geometry/material if no longer needed
                // if (objectToRemove.geometry) objectToRemove.geometry.dispose();
                // if (objectToRemove.material) objectToRemove.material.dispose();

            } else if (event.button === 2) { // Right click - Place block (Minecraft-style)
                // The block we hit
                const targetBlock = intersection.object;
                // The normal vector pointing away from the face we hit
                const faceNormal = intersection.face.normal;

                // Calculate the center position for the new block
                // Start with the center of the block we hit...
                const newBlockPos = new THREE.Vector3().copy(targetBlock.position);
                // ...and add the face normal vector (moves 1 unit along the axis perpendicular to the face)
                newBlockPos.add(faceNormal);

                // --- Collision Check: Prevent placing block inside player --- 
                const playerPos = new THREE.Vector3();
                controls.getObject().getWorldPosition(playerPos);

                // Calculate voxel center coords for player's feet and head 
                // Need to floor playerPos and add 0.5 to get the center of the voxel the player is in
                const playerFeetVoxelCenter = playerPos.clone().floor().addScalar(0.5);
                // Approximate head voxel center (one block above feet)
                const playerHeadVoxelCenter = playerPos.clone().setY(playerPos.y + 1).floor().addScalar(0.5); 

                // Check if the new block's position is too close (essentially the same voxel) to the player's feet or head
                const tolerance = 0.1; // Use a small tolerance for floating point comparisons
                if (newBlockPos.distanceTo(playerFeetVoxelCenter) < tolerance || 
                    newBlockPos.distanceTo(playerHeadVoxelCenter) < tolerance) {
                    // console.log("Cannot place block inside player.");
                    return; // Exit without placing the block
                }
                // --- End Collision Check ---

                // If collision check passes, add the block
                // console.log(`Placing block at: ${newBlockPos.x}, ${newBlockPos.y}, ${newBlockPos.z}`);
                addBlock(newBlockPos.x, newBlockPos.y, newBlockPos.z);
            }
        }
    }
});

// 8. Animation Loop
const clock = new THREE.Clock(); // Need clock for delta time
const groundCheckRaycaster = new THREE.Raycaster(); // Separate raycaster for ground check
const downVector = new THREE.Vector3(0, -1, 0);

function animate(time) { 
    requestAnimationFrame(animate);
    const delta = clock.getDelta(); // Get time difference for frame-rate independent physics/movement

    // --- Horizontal Movement (WASD) --- 
    if (controls.isLocked === true) {
        const moveDirection = new THREE.Vector3(); // Temp vector for movement direction
        moveDirection.z = Number(keys.w) - Number(keys.s);
        moveDirection.x = Number(keys.d) - Number(keys.a);
        moveDirection.normalize(); // Ensure consistent speed regardless of direction

        // Adjust speed based on delta time
        const actualMoveSpeed = moveSpeed * delta * 60; // Multiply by 60 for baseline speed

        if (keys.w || keys.s) {
            controls.moveForward(moveDirection.z * actualMoveSpeed);
        }
        if (keys.a || keys.d) {
            controls.moveRight(moveDirection.x * actualMoveSpeed);
        }

        // --- Vertical Movement (Gravity and Jumping) --- 
        const playerPosition = controls.getObject().position;

        // Raycast down from player center to check for ground
        groundCheckRaycaster.set(playerPosition, downVector);
        const groundIntersects = groundCheckRaycaster.intersectObjects(blocks);

        const onSolidGround = groundIntersects.length > 0 && groundIntersects[0].distance < playerHeight;

        if (onSolidGround) {
            // Player is on the ground
            if (playerVelocityY < 0) { // Only stop if falling or still
                 playerVelocityY = 0;
            }
            onGround = true;

            // Snap player to be exactly playerHeight above the ground block
            const groundY = groundIntersects[0].point.y;
            // Small offset to prevent slight sinking
            const targetY = groundY + playerHeight ; // Adjust to stand on top
            // Apply correction smoothly or instantly
            playerPosition.y = targetY; 


            // Handle Jump
            if (keys.space) {
                playerVelocityY = jumpForce;
                onGround = false;
            }

        } else {
            // Player is in the air
            onGround = false;
            playerVelocityY -= gravity * delta * 60; // Apply gravity (adjust by delta)
        }

        // Apply vertical velocity
        // Scale by delta and baseline (60) for consistency with horizontal movement and gravity
        playerPosition.y += playerVelocityY * delta * 60;

        // Prevent falling through the world (optional safety net)
        if (playerPosition.y < -50) {
            playerPosition.set(0, 10, 5); // Reset position
            playerVelocityY = 0;
        }
    }

    renderer.render(scene, camera);
}

animate(); 