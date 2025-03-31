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
camera.position.set(0, 1, 5); // Adjust starting position slightly for ground level view
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
    d: false
};

document.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyW': keys.w = true; break;
        case 'KeyA': keys.a = true; break;
        case 'KeyS': keys.s = true; break;
        case 'KeyD': keys.d = true; break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW': keys.w = false; break;
        case 'KeyA': keys.a = false; break;
        case 'KeyS': keys.s = false; break;
        case 'KeyD': keys.d = false; break;
    }
});

// 5. Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// 6. Ground Plane
const groundGeometry = new THREE.PlaneGeometry(50, 50); // Width, Height
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22, side: THREE.DoubleSide }); // Forest green
const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
groundPlane.rotation.x = -Math.PI / 2; // Rotate it to be horizontal
groundPlane.position.y = -0.5; // Position it slightly below the center
scene.add(groundPlane);

// 7. Simple Cube (like a block)
const cubeGeometry = new THREE.BoxGeometry(1, 1, 1); // Width, Height, Depth
const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 }); // Saddle brown
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.set(0, 0, 0);
scene.add(cube);

// Movement variables
const moveSpeed = 0.1;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// 8. Animation Loop
function animate(time) { // Add time for potential physics later
    requestAnimationFrame(animate);

    // Only move if pointer is locked
    if (controls.isLocked === true) {
        // Reset velocity based on current direction
        velocity.x = 0.0;
        velocity.z = 0.0;

        // Get movement direction based on key presses
        direction.z = Number(keys.w) - Number(keys.s);
        direction.x = Number(keys.d) - Number(keys.a);
        direction.normalize(); // Ensure consistent speed in all directions

        // Move forward/backward
        if (keys.w || keys.s) {
            velocity.z = direction.z;
            controls.moveForward(velocity.z * moveSpeed);
        }
        // Move left/right
        if (keys.a || keys.d) {
            velocity.x = direction.x;
            controls.moveRight(velocity.x * moveSpeed);
        }

        // Optional: Add simple gravity or collision detection here later
    }

    // controls.update(); // Not needed for PointerLockControls movement logic

    renderer.render(scene, camera);
}

animate(); 