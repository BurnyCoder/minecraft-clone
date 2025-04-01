import * as THREE from 'three';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; // Remove OrbitControls
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'; // Add PointerLockControls
import { createNoise2D } from 'simplex-noise'; // Import noise function

// --- Procedural Texture Generation ---
function generateTexture(size, color, noiseAmount = 0.1) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');

    // Base color
    context.fillStyle = color;
    context.fillRect(0, 0, size, size);

    // Add noise
    const imageData = context.getImageData(0, 0, size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 255 * noiseAmount;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));     // Red
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // Green
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // Blue
        // Alpha remains 255
    }
    context.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true; // Ensure texture updates
    // Make textures pixelated like Minecraft
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
}

const textureSize = 16; // Small texture size for pixelated look

const dirtTexture = generateTexture(textureSize, '#8B4513'); // Saddle Brown
const grassTopTexture = generateTexture(textureSize, '#228B22', 0.05); // Forest Green (less noise)
const grassSideTexture = generateTexture(textureSize, '#A0522D'); // Sienna (side dirt look)
const stoneTexture = generateTexture(textureSize, '#808080', 0.15); // Gray (more noise)
const logTexture = generateTexture(textureSize, '#654321', 0.08); // Dark Brown (wood log)
const leafTexture = generateTexture(textureSize, '#006400', 0.2);  // Dark Green (leaves)

// --- Materials ---
const dirtMaterial = new THREE.MeshStandardMaterial({ map: dirtTexture });
const stoneMaterial = new THREE.MeshStandardMaterial({ map: stoneTexture });
const logMaterial = new THREE.MeshStandardMaterial({ map: logTexture });
const leafMaterial = new THREE.MeshStandardMaterial({ map: leafTexture, transparent: true, opacity: 0.9 }); // Make leaves slightly transparent

// Grass needs different materials for top, bottom (dirt), and sides
const grassMaterials = [
    new THREE.MeshStandardMaterial({ map: grassSideTexture }), // right face (+x)
    new THREE.MeshStandardMaterial({ map: grassSideTexture }), // left face (-x)
    new THREE.MeshStandardMaterial({ map: grassTopTexture }),  // top face (+y)
    new THREE.MeshStandardMaterial({ map: dirtTexture }),     // bottom face (-y)
    new THREE.MeshStandardMaterial({ map: grassSideTexture }), // front face (+z)
    new THREE.MeshStandardMaterial({ map: grassSideTexture })  // back face (-z)
];

// --- Geometry (create once and reuse) ---
const blockGeometry = new THREE.BoxGeometry(1, 1, 1);

// Store block type info
const blockTypes = { DIRT: 'dirt', GRASS: 'grass', STONE: 'stone', LOG: 'log', LEAF: 'leaf' };

// --- Noise Setup ---
const noise2D = createNoise2D(); // Create a 2D noise function
const noiseFrequency = 0.05; // Controls the scale of terrain features (smaller = larger features)
const noiseAmplitude = 5; // Controls the max height variation
const baseLevel = -5; // Lowest level for stone generation

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
scene.add(controls.object);

// Keyboard state
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false // Add spacebar state
};

// --- Player Physics Variables ---
const playerHeight = 1.7; // Approximate player height
const gravity = 0.01;
const jumpForce = 0.15; 
let playerVelocityY = 0;
let onGround = false;

// --- Block Selection State ---
let selectedBlockType = blockTypes.STONE; // Start with stone selected

// --- Raycasting Setup ---
const raycaster = new THREE.Raycaster();
const interactionDistance = 5; // Max distance to interact with blocks

document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyW': keys.w = true; break;
        case 'KeyA': keys.a = true; break;
        case 'KeyS': keys.s = true; break;
        case 'KeyD': keys.d = true; break;
        case 'Space': keys.space = true; break;
        // Block selection keys
        case 'Digit1': 
            selectedBlockType = blockTypes.STONE;
            console.log("Selected: Stone"); // Feedback
            updateSelectedBlockUI(); // Update UI (will add function later)
            break;
        case 'Digit2': 
            selectedBlockType = blockTypes.DIRT;
            console.log("Selected: Dirt"); // Feedback
            updateSelectedBlockUI();
            break;
        case 'Digit3': 
            selectedBlockType = blockTypes.GRASS;
            console.log("Selected: Grass"); // Feedback
            updateSelectedBlockUI();
            break;
        case 'Digit4': 
            selectedBlockType = blockTypes.LOG;
            console.log("Selected: Log"); // Feedback
            updateSelectedBlockUI();
            break;
        case 'Digit5': 
            selectedBlockType = blockTypes.LEAF;
            console.log("Selected: Leaf"); // Feedback
            updateSelectedBlockUI();
            break;
    }
});

// Add the keyup listener back
document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW': keys.w = false; break;
        case 'KeyA': keys.a = false; break;
        case 'KeyS': keys.s = false; break;
        case 'KeyD': keys.d = false; break;
        case 'Space': keys.space = false; break; // Handle spacebar up
    }
});

// Need to add the updateSelectedBlockUI function later
function updateSelectedBlockUI() {
    const selectedBlockElement = document.getElementById('selected-block-ui');
    if (selectedBlockElement) {
        selectedBlockElement.textContent = `Selected: ${selectedBlockType.charAt(0).toUpperCase() + selectedBlockType.slice(1)}`;
    }
}

// 5. Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// --- Block Management ---
const blocks = []; // Array to hold all interactive blocks

// Function to add a block at a specific position with a specific type
function addBlock(x, y, z, blockType = blockTypes.STONE) { // Default to placing stone
    let material;
    switch(blockType) {
        case blockTypes.GRASS:
            material = grassMaterials; // Use the array of materials for grass
            break;
        case blockTypes.DIRT:
            material = dirtMaterial;
            break;
        case blockTypes.LOG:
            material = logMaterial;
            break;
        case blockTypes.LEAF:
            material = leafMaterial;
            break;
        case blockTypes.STONE:
        default:
            material = stoneMaterial;
            break;
    }

    // Use the pre-defined geometry and the selected material(s)
    const block = new THREE.Mesh(blockGeometry, material);
    // Store type for potential future logic (e.g., different breaking sounds/times)
    block.userData.blockType = blockType; 
    
    // Blocks are centered at (x, y, z)
    block.position.set(x, y, z);
    scene.add(block);
    blocks.push(block); // Add to our list
}

// --- Generate Ground Blocks (Procedural Terrain) ---
const worldSize = 32; // Increase world size slightly? (e.g., 32x32)
for (let x = -worldSize / 2; x < worldSize / 2; x++) {
    for (let z = -worldSize / 2; z < worldSize / 2; z++) {
        // Calculate noise value for this x, z coordinate
        const noiseVal = noise2D(x * noiseFrequency, z * noiseFrequency);

        // Map noise value (-1 to 1) to height variation around baseLevel
        // Add 1 to noiseVal to make it 0-2 range, then multiply by amplitude
        const heightVariation = (noiseVal + 1) / 2 * noiseAmplitude;
        const topY = Math.floor(baseLevel + heightVariation);

        // Generate column from baseLevel up to topY
        for (let y = baseLevel; y <= topY; y++) {
            let blockType;
            if (y === topY) {
                blockType = blockTypes.GRASS; // Top layer is grass
            } else if (y >= topY - 2) {
                blockType = blockTypes.DIRT; // Layer(s) below grass is dirt
            } else {
                blockType = blockTypes.STONE; // Everything else below is stone
            }
            // Add block (adjust position by 0.5 for center)
            const blockX = x + 0.5;
            const blockY = y + 0.5;
            const blockZ = z + 0.5;
            addBlock(blockX, blockY, blockZ, blockType);

            // --- Tree Generation --- 
            // If this is the top grass block and random chance passes
            if (blockType === blockTypes.GRASS && Math.random() < 0.01) { // 1% chance for a tree
                const trunkHeight = Math.floor(Math.random() * 3) + 4; // 4-6 blocks high
                // Generate Trunk
                for (let ty = 1; ty <= trunkHeight; ty++) {
                    addBlock(blockX, blockY + ty, blockZ, blockTypes.LOG);
                }
                // Generate Leaves (Simple Canopy)
                const leafStartY = blockY + trunkHeight - 1; // Start leaves below the top log
                const leafSize = 2; // Radius of leaves around trunk top
                for (let lx = -leafSize; lx <= leafSize; lx++) {
                    for (let ly = 0; ly <= leafSize; ly++) { // Height of leaves
                        for (let lz = -leafSize; lz <= leafSize; lz++) {
                            // Simple square/cube shape, avoiding the very center/corners sometimes
                            if (lx === 0 && lz === 0 && ly < leafSize) continue; // Space for trunk top
                            if (Math.abs(lx) === leafSize && Math.abs(lz) === leafSize && ly === 0) continue; // Trim corners slightly
                             addBlock(blockX + lx, leafStartY + ly, blockZ + lz, blockTypes.LEAF);
                        }
                    }
                }
                // Add top layer of leaves
                const topLeafY = leafStartY + leafSize + 1; // One level above current canopy top
                for (let lx = -1; lx <= 1; lx++) {
                    for (let lz = -1; lz <= 1; lz++) {
                        // Skip corners for a more rounded look
                        if (Math.abs(lx) === 1 && Math.abs(lz) === 1) continue;
                        addBlock(blockX + lx, topLeafY, blockZ + lz, blockTypes.LEAF);
                    }
                }
            }
            // --- End Tree Generation ---
        }
    }
}

// 7. Initial Block(s)
// addBlock(0 + 0.5, 0 + 0.5, 0 + 0.5, blockTypes.STONE); // Remove the initial floating block

// Movement variables
const moveSpeed = 0.1;

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
                controls.object.getWorldPosition(playerPos);

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

                // If collision check passes, add the block using the currently selected type
                // console.log(`Placing block at: ${newBlockPos.x}, ${newBlockPos.y}, ${newBlockPos.z}`);
                addBlock(newBlockPos.x, newBlockPos.y, newBlockPos.z, selectedBlockType);
            }
        }
    }
});

// 8. Animation Loop
const clock = new THREE.Clock(); // Need clock for delta time
const groundCheckRaycaster = new THREE.Raycaster(); // Separate raycaster for ground check
const downVector = new THREE.Vector3(0, -1, 0);

function animate() { 
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
        const playerPosition = controls.object.position;
        let snappedToGround = false; // Flag to track if we snapped this frame

        // 1. Apply gravity to velocity *first*
        playerVelocityY -= gravity * delta * 60; 

        // 2. Raycast down from player center to check for ground
        groundCheckRaycaster.set(playerPosition, downVector);
        const groundIntersects = groundCheckRaycaster.intersectObjects(blocks);
        // Reduced buffer slightly
        const onSolidGround = groundIntersects.length > 0 && groundIntersects[0].distance < playerHeight + 0.05; 

        // 3. Handle ground state and jumping
        if (onSolidGround) {
            // Handle Jump FIRST
            if (keys.space) {
                 // Apply jump force and leave ground state
                playerVelocityY = jumpForce;
                onGround = false;
                snappedToGround = false; // We are jumping, not snapping
            } else {
                 // Not jumping, so truly on ground
                 const groundY = groundIntersects[0].point.y;
                 const targetY = groundY + playerHeight;
                 // Reset velocity and snap position
                 playerVelocityY = 0;
                 onGround = true;
                 playerPosition.y = targetY; // Snap to ground ONLY if not jumping
                 snappedToGround = true; // We snapped this frame
            }

        } else {
            // 4. Player is in the air
            onGround = false;
            snappedToGround = false;
        }

        // 5. Apply vertical velocity *unless* we snapped to ground this frame
        if (!snappedToGround) {
            const verticalDelta = playerVelocityY * delta * 60;
            playerPosition.y += verticalDelta;
        }

         // --- Debug Logging (Removed) --- 

        // Prevent falling through the world (optional safety net)
        if (playerPosition.y < -50) {
            controls.object.position.set(0, 10, 5);
            playerVelocityY = 0;
        }
    }

    renderer.render(scene, camera);
}

animate(); 

// Initialize the selected block UI on load
updateSelectedBlockUI(); 