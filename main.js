import * as THREE from 'three';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; // Not needed
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
// --- Import 3D noise capability ---
import { createNoise2D, createNoise3D } from 'simplex-noise'; // <-- Import createNoise3D

// --- Constants ---
const CHUNK_SIZE = 16; // Size of a chunk (blocks wide/deep)
const CHUNK_HEIGHT = 64; // Explicit chunk height for 3D generation
const RENDER_DISTANCE = 4; // Chunks to load around the player (4 means 9x9 chunks)
const TEXTURE_SIZE = 16; // Small texture size for pixelated look
// --- Add new block types ---
const BLOCK_TYPES = {
    AIR: 'air',
    DIRT: 'dirt',
    GRASS: 'grass',
    STONE: 'stone',
    LOG: 'log',
    LEAF: 'leaf',
    PLANKS: 'planks',
    SAND: 'sand',
    SANDSTONE: 'sandstone',
    CACTUS: 'cactus',
    WATER: 'water', // Added water
    SNOW: 'snow',   // Added snow
};
const PLAYER_HEIGHT = 1.7;
const GRAVITY = 0.01;
const JUMP_FORCE = 0.15;
const MOVE_SPEED = 0.1;
const INTERACTION_DISTANCE = 5;
const WATER_LEVEL = -2; // World Y level for water surface

// --- Procedural Texture Generation (Simplified for brevity) ---
// (Keep the existing generateTexture function)
function generateTexture(size, color, noiseAmount = 0.1) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    context.fillStyle = color;
    context.fillRect(0, 0, size, size);
    // Basic noise (same as before)
    const imageData = context.getImageData(0, 0, size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 255 * noiseAmount;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    context.putImageData(imageData, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
}

// --- Textures ---
const dirtTexture = generateTexture(TEXTURE_SIZE, '#8B4513');
const grassTopTexture = generateTexture(TEXTURE_SIZE, '#228B22', 0.05);
const grassSideTexture = generateTexture(TEXTURE_SIZE, '#A0522D');
const stoneTexture = generateTexture(TEXTURE_SIZE, '#808080', 0.15);
const logTexture = generateTexture(TEXTURE_SIZE, '#654321', 0.08);
const leafTexture = generateTexture(TEXTURE_SIZE, '#006400', 0.2);
const plankTexture = generateTexture(TEXTURE_SIZE, '#DEB887', 0.03);
// --- Add new textures ---
const sandTexture = generateTexture(TEXTURE_SIZE, '#F4A460', 0.08);
const sandstoneTexture = generateTexture(TEXTURE_SIZE, '#C19A6B', 0.1);
const cactusTopTexture = generateTexture(TEXTURE_SIZE, '#008000', 0.02);
const cactusSideTexture = generateTexture(TEXTURE_SIZE, '#556B2F', 0.05);
const waterTexture = generateTexture(TEXTURE_SIZE, 'rgba(64, 164, 223, 0.8)', 0.03); // Semi-transparent blue
const snowTexture = generateTexture(TEXTURE_SIZE, '#FFFAFA', 0.02); // White snow

// --- Add lines to plank texture (keep as is) ---
const plankCanvas = plankTexture.image;
const plankCtx = plankCanvas.getContext('2d');
plankCtx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
plankCtx.lineWidth = Math.max(1, Math.floor(TEXTURE_SIZE / 8));
for (let i = 0; i <= TEXTURE_SIZE; i += Math.floor(TEXTURE_SIZE / 4)) {
    plankCtx.beginPath();
    plankCtx.moveTo(i, 0);
    plankCtx.lineTo(i, TEXTURE_SIZE);
    plankCtx.stroke();
}
plankTexture.needsUpdate = true;

// --- Add pattern to cactus side texture ---
const cactusCanvas = cactusSideTexture.image;
const cactusCtx = cactusCanvas.getContext('2d');
cactusCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
cactusCtx.lineWidth = Math.max(1, Math.floor(TEXTURE_SIZE / 10));
cactusCtx.beginPath(); // Simple 'V' shapes
cactusCtx.moveTo(TEXTURE_SIZE / 2, TEXTURE_SIZE * 0.1);
cactusCtx.lineTo(TEXTURE_SIZE * 0.3, TEXTURE_SIZE * 0.4);
cactusCtx.moveTo(TEXTURE_SIZE / 2, TEXTURE_SIZE * 0.1);
cactusCtx.lineTo(TEXTURE_SIZE * 0.7, TEXTURE_SIZE * 0.4);
cactusCtx.moveTo(TEXTURE_SIZE / 2, TEXTURE_SIZE * 0.5);
cactusCtx.lineTo(TEXTURE_SIZE * 0.3, TEXTURE_SIZE * 0.8);
cactusCtx.moveTo(TEXTURE_SIZE / 2, TEXTURE_SIZE * 0.5);
cactusCtx.lineTo(TEXTURE_SIZE * 0.7, TEXTURE_SIZE * 0.8);
cactusCtx.stroke();
cactusSideTexture.needsUpdate = true;


// --- Materials ---
const materials = {
    [BLOCK_TYPES.DIRT]: new THREE.MeshStandardMaterial({ map: dirtTexture }),
    [BLOCK_TYPES.STONE]: new THREE.MeshStandardMaterial({ map: stoneTexture }),
    [BLOCK_TYPES.LOG]: new THREE.MeshStandardMaterial({ map: logTexture }),
    [BLOCK_TYPES.LEAF]: new THREE.MeshStandardMaterial({ map: leafTexture, transparent: true, alphaTest: 0.1 }),
    [BLOCK_TYPES.PLANKS]: new THREE.MeshStandardMaterial({ map: plankTexture }),
    [BLOCK_TYPES.SAND]: new THREE.MeshStandardMaterial({ map: sandTexture }),
    [BLOCK_TYPES.SANDSTONE]: new THREE.MeshStandardMaterial({ map: sandstoneTexture }),
    [BLOCK_TYPES.SNOW]: new THREE.MeshStandardMaterial({ map: snowTexture }),
    // --- Water material needs transparency ---
    [BLOCK_TYPES.WATER]: new THREE.MeshStandardMaterial({
        map: waterTexture,
        transparent: true,
        opacity: 0.8, // Make it see-through
        side: THREE.DoubleSide // Render front and back faces
    }),
    [BLOCK_TYPES.GRASS]: [ // Order: +x, -x, +y (top), -y (bottom), +z, -z
        new THREE.MeshStandardMaterial({ map: grassSideTexture }),
        new THREE.MeshStandardMaterial({ map: grassSideTexture }),
        new THREE.MeshStandardMaterial({ map: grassTopTexture }),
        new THREE.MeshStandardMaterial({ map: dirtTexture }), // Bottom is dirt
        new THREE.MeshStandardMaterial({ map: grassSideTexture }),
        new THREE.MeshStandardMaterial({ map: grassSideTexture })
    ],
    [BLOCK_TYPES.CACTUS]: [ // Order: +x, -x, +y (top), -y (bottom), +z, -z
        new THREE.MeshStandardMaterial({ map: cactusSideTexture }),
        new THREE.MeshStandardMaterial({ map: cactusSideTexture }),
        new THREE.MeshStandardMaterial({ map: cactusTopTexture }), // Top
        new THREE.MeshStandardMaterial({ map: cactusTopTexture }), // Bottom (same as top for cactus)
        new THREE.MeshStandardMaterial({ map: cactusSideTexture }),
        new THREE.MeshStandardMaterial({ map: cactusSideTexture })
    ]
};

// --- Geometry (create once and reuse) ---
const blockGeometry = new THREE.BoxGeometry(1, 1, 1);

// --- Noise Setup ---
const seed = Math.random(); // Use a seed for consistency if needed
const noise3D = createNoise3D(() => seed + 1); // For terrain density
const elevationNoise = createNoise2D(() => seed + 2); // Base large scale elevation
const temperatureNoise = createNoise2D(() => seed + 3); // For biome determination
const humidityNoise = createNoise2D(() => seed + 4); // For biome determination

// Noise Parameters (Tweak these heavily!)
const terrainFrequency = 0.03; // How detailed the 3D noise is
const terrainAmplitude = 20;  // Max height variation from 3D noise contribution
const elevationFrequency = 0.008; // Larger scale features
const elevationAmplitude = 30; // Overall height differences
const biomeFrequency = 0.005;   // Very large scale for biomes
const baseLevel = 0;        // Base Y level around which terrain forms

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, RENDER_DISTANCE * CHUNK_SIZE * 0.5, RENDER_DISTANCE * CHUNK_SIZE);

// --- Camera ---
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, RENDER_DISTANCE * CHUNK_SIZE * 1.5); // Increased far plane a bit
camera.position.set(CHUNK_SIZE / 2, baseLevel + elevationAmplitude + terrainAmplitude + 10, CHUNK_SIZE / 2); // Start higher

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: false }); // Keep pixelated look
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Controls --- (Keep PointerLockControls setup as is)
const controls = new PointerLockControls(camera, document.body);
const instructions = document.getElementById('instructions');
document.body.addEventListener('click', () => { controls.lock(); });
controls.addEventListener('lock', () => { if(instructions) instructions.style.display = 'none'; });
controls.addEventListener('unlock', () => { if(instructions) instructions.style.display = 'block'; });
scene.add(controls.object);

// --- Lighting --- (Keep lighting setup as is)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
directionalLight.position.set(CHUNK_SIZE * 0.5, 100, CHUNK_SIZE * 0.5); // Position light higher
directionalLight.castShadow = false;
scene.add(directionalLight);

// --- Chunk Management --- (Keep chunk map setup as is)
const chunks = new Map();
let currentChunkX = Infinity;
let currentChunkZ = Infinity;

function getChunkKey(cx, cz) {
    return `${cx},${cz}`;
}

// --- Player State & Input --- (Keep player state, keys, selected block UI as is)
const keys = { w: false, a: false, s: false, d: false, space: false };
let playerVelocityY = 0;
let onGround = false;
let selectedBlockType = BLOCK_TYPES.PLANKS;

// --- Add new block types to selection ---
document.addEventListener('keydown', (event) => {
    if (!controls.isLocked) return;
    switch (event.code) {
        case 'KeyW': keys.w = true; break;
        case 'KeyA': keys.a = true; break;
        case 'KeyS': keys.s = true; break;
        case 'KeyD': keys.d = true; break;
        case 'Space': if (onGround) { playerVelocityY = JUMP_FORCE; onGround = false; } break;
        case 'Digit1': selectedBlockType = BLOCK_TYPES.STONE; updateSelectedBlockUI(); break;
        case 'Digit2': selectedBlockType = BLOCK_TYPES.DIRT; updateSelectedBlockUI(); break;
        case 'Digit3': selectedBlockType = BLOCK_TYPES.GRASS; updateSelectedBlockUI(); break;
        case 'Digit4': selectedBlockType = BLOCK_TYPES.LOG; updateSelectedBlockUI(); break;
        case 'Digit5': selectedBlockType = BLOCK_TYPES.LEAF; updateSelectedBlockUI(); break;
        case 'Digit6': selectedBlockType = BLOCK_TYPES.PLANKS; updateSelectedBlockUI(); break;
        case 'Digit7': selectedBlockType = BLOCK_TYPES.SAND; updateSelectedBlockUI(); break; // Added
        case 'Digit8': selectedBlockType = BLOCK_TYPES.CACTUS; updateSelectedBlockUI(); break; // Added
        case 'Digit9': selectedBlockType = BLOCK_TYPES.SNOW; updateSelectedBlockUI(); break; // Added
        // Add more digits if needed for sandstone, water etc. or implement better selection
    }
});
document.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW': keys.w = false; break;
        case 'KeyA': keys.a = false; break;
        case 'KeyS': keys.s = false; break;
        case 'KeyD': keys.d = false; break;
        case 'Space': keys.space = false; break;
    }
});

function updateSelectedBlockUI() {
    const selectedBlockElement = document.getElementById('selected-block-ui'); // Needs corresponding HTML element
    if (selectedBlockElement) {
        selectedBlockElement.textContent = `Selected: ${selectedBlockType.charAt(0).toUpperCase() + selectedBlockType.slice(1)}`;
    }
    console.log("Selected:", selectedBlockType);
}

// --- Raycasting Setup --- (Keep raycaster setup as is)
const interactionRaycaster = new THREE.Raycaster();
const groundCheckRaycaster = new THREE.Raycaster();
const downVector = new THREE.Vector3(0, -1, 0);
interactionRaycaster.far = INTERACTION_DISTANCE;
groundCheckRaycaster.far = PLAYER_HEIGHT + 0.2;

// --- Helper for Block Placement --- (Keep worldObjects array as is)
const worldObjects = [];

// --- Biome Definition ---
const BIOMES = {
    PLAINS: 'plains',
    FOREST: 'forest',
    DESERT: 'desert',
    MOUNTAINS: 'mountains',
    OCEAN: 'ocean',
    SNOWY: 'snowy'
};

function getBiome(temp, humid) {
    if (temp < -0.3) return BIOMES.SNOWY;
    if (temp > 0.5 && humid < -0.2) return BIOMES.DESERT;
    if (temp > 0.4 && humid > 0.3) return BIOMES.FOREST; // Warmer, wetter forests
    if (temp > 0.0 && humid > 0.0) return BIOMES.FOREST; // General Forest
    if (temp > -0.1) return BIOMES.PLAINS; // Temperate plains
    // Default to mountains or plains if conditions are odd
    if (temp < -0.1) return BIOMES.MOUNTAINS;
    return BIOMES.PLAINS;
}

// --- !!! World Generation Functions (Major Changes) !!! ---

function generateChunkData(chunkX, chunkZ) {
    const blocks = new Map(); // Map<string, BLOCK_TYPES> key: "x,y,z"
    const startWorldX = chunkX * CHUNK_SIZE;
    const startWorldZ = chunkZ * CHUNK_SIZE;

    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = startWorldX + x;
            const worldZ = startWorldZ + z;

            // 1. Determine Biome
            const temp = temperatureNoise(worldX * biomeFrequency, worldZ * biomeFrequency);
            const humid = humidityNoise(worldX * biomeFrequency, worldZ * biomeFrequency);
            const biome = getBiome(temp, humid);

            // 2. Calculate Base Elevation from 2D Noise
            const baseElevationVal = elevationNoise(worldX * elevationFrequency, worldZ * elevationFrequency);
            // Modulate elevation by biome (e.g., mountains higher, oceans lower)
            let biomeElevationOffset = 0;
            if (biome === BIOMES.MOUNTAINS || biome === BIOMES.SNOWY) biomeElevationOffset = 15;
            if (biome === BIOMES.OCEAN) biomeElevationOffset = -25; // Make oceans deeper
            const surfaceBaseHeight = baseLevel + (baseElevationVal + 1) / 2 * elevationAmplitude + biomeElevationOffset;

            // 3. Iterate through Y, using 3D Noise for Density
            // Iterate wider Y range to allow caves below "base" and overhangs above
            for (let y = -CHUNK_HEIGHT / 2; y < CHUNK_HEIGHT; y++) { // Adjust Y range as needed
                 const worldY = y; // Use absolute Y for noise

                // Calculate 3D noise density
                const densityNoiseVal = noise3D(worldX * terrainFrequency, worldY * terrainFrequency * 1.5, worldZ * terrainFrequency); // Stretch Y noise slightly?

                // Combine density noise with base elevation influence
                // Higher density below surfaceBaseHeight, lower density above. Sharp cutoff makes cliffs. Gradual makes slopes.
                const heightInfluence = (surfaceBaseHeight - worldY) * 0.2; // Blocks more likely below surface height
                const density = densityNoiseVal * terrainAmplitude + heightInfluence;

                 // Density threshold - higher means less likely to be solid
                let threshold = -2; // Base threshold, allows some floating islands/overhangs

                 // Ensure solid ground below a certain depth and less likely above base surface
                 if (worldY < baseLevel - 10) threshold = -100; // Force solid deep down
                 if (worldY > surfaceBaseHeight + 5) threshold = 15; // Less likely to generate high up artifacts

                // Determine if block is solid or air based on density
                if (density > threshold) {
                    // --- Block is Solid ---
                    let blockType = BLOCK_TYPES.STONE; // Default underground

                    // Check block above (within the map generation context, not final mesh)
                    const abovePosKey = `${x},${y + 1},${z}`;
                    const isAirAbove = !blocks.has(abovePosKey) || blocks.get(abovePosKey) === BLOCK_TYPES.AIR; // Crude check, assumes top-down generation somewhat

                    // --- Biome-Specific Block Types ---
                    if (isAirAbove && worldY >= WATER_LEVEL -1) { // Place surface blocks only above water
                        // Surface Block Logic
                        switch (biome) {
                            case BIOMES.DESERT:
                                blockType = BLOCK_TYPES.SAND;
                                break;
                            case BIOMES.SNOWY:
                                blockType = BLOCK_TYPES.SNOW; // Snow surface
                                break;
                            case BIOMES.MOUNTAINS:
                                blockType = BLOCK_TYPES.STONE; // Stone surface
                                break;
                            case BIOMES.FOREST:
                            case BIOMES.PLAINS:
                            default:
                                blockType = BLOCK_TYPES.GRASS;
                                break;
                        }
                         // Special case: if surface is just below water level, make it sand/dirt
                        if(worldY <= WATER_LEVEL) {
                             blockType = (biome === BIOMES.DESERT) ? BLOCK_TYPES.SAND : BLOCK_TYPES.DIRT;
                        }

                    } else {
                        // Underground Block Logic
                        switch (biome) {
                            case BIOMES.DESERT:
                                // Sandstone layer below sand
                                if (worldY > surfaceBaseHeight - 5) blockType = BLOCK_TYPES.SANDSTONE;
                                else blockType = BLOCK_TYPES.STONE;
                                break;
                            case BIOMES.SNOWY:
                                // Dirt/Stone mix below snow
                                if (worldY > surfaceBaseHeight - 3) blockType = BLOCK_TYPES.DIRT;
                                else blockType = BLOCK_TYPES.STONE;
                                break;
                            case BIOMES.MOUNTAINS:
                                blockType = BLOCK_TYPES.STONE; // Mostly stone
                                break;
                             case BIOMES.FOREST:
                            case BIOMES.PLAINS:
                            default:
                                // Dirt layer below grass
                                if (worldY > surfaceBaseHeight - 4) blockType = BLOCK_TYPES.DIRT;
                                else blockType = BLOCK_TYPES.STONE;
                                break;
                        }
                    }
                    blocks.set(`${x},${y},${z}`, blockType);

                } else if (worldY <= WATER_LEVEL) {
                     // --- Block is Air, but below water level ---
                     // Check if it's enclosed air (cave) or open water
                     // Simple check: if density is only slightly below threshold, maybe make it water
                     if (density > threshold - 3) { // Small buffer zone near surface can become water
                         // More robust check would involve neighbours, but this is simpler
                         blocks.set(`${x},${y},${z}`, BLOCK_TYPES.WATER);
                     } else {
                          blocks.set(`${x},${y},${z}`, BLOCK_TYPES.AIR); // Deep caves remain air
                     }
                } else {
                    // --- Block is Air and above water level ---
                    blocks.set(`${x},${y},${z}`, BLOCK_TYPES.AIR);
                }
            } // End Y loop
        } // End Z loop
    } // End X loop

    // --- Second Pass for Features (Trees, Cacti, etc.) ---
    // This pass ensures features are placed *after* the main terrain is defined.
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = startWorldX + x;
            const worldZ = startWorldZ + z;

            // Find the highest solid block (surface) at this XZ to place features on
            let topY = -CHUNK_HEIGHT; // Start low
            let surfaceBlockType = BLOCK_TYPES.AIR;
            for (let y = CHUNK_HEIGHT - 1; y >= -CHUNK_HEIGHT / 2; y--) {
                const blockKey = `${x},${y},${z}`;
                if (blocks.has(blockKey) && blocks.get(blockKey) !== BLOCK_TYPES.AIR && blocks.get(blockKey) !== BLOCK_TYPES.WATER && blocks.get(blockKey) !== BLOCK_TYPES.LEAF) {
                    topY = y;
                    surfaceBlockType = blocks.get(blockKey);
                    break; // Found the surface
                }
            }

            if (topY > WATER_LEVEL) { // Only place features above water
                const temp = temperatureNoise(worldX * biomeFrequency, worldZ * biomeFrequency);
                const humid = humidityNoise(worldX * biomeFrequency, worldZ * biomeFrequency);
                const biome = getBiome(temp, humid);

                // Tree Generation (Forests/Plains)
                if ((biome === BIOMES.FOREST || biome === BIOMES.PLAINS) && surfaceBlockType === BLOCK_TYPES.GRASS && Math.random() < 0.015) { // Slightly higher chance in forests?
                    const trunkHeight = Math.floor(Math.random() * (biome === BIOMES.FOREST ? 4 : 2)) + (biome === BIOMES.FOREST ? 5 : 3); // Taller trees in forest
                    // Trunk
                    for (let ty = 1; ty <= trunkHeight; ty++) {
                         if(topY + ty < CHUNK_HEIGHT) blocks.set(`${x},${topY + ty},${z}`, BLOCK_TYPES.LOG);
                    }
                    // Leaves (More rounded shape)
                    const leafRadius = biome === BIOMES.FOREST ? 3 : 2;
                    const leafCenterY = topY + trunkHeight;
                    for (let ly = -leafRadius + 1; ly <= leafRadius; ly++) {
                        for (let lx = -leafRadius; lx <= leafRadius; lx++) {
                            for (let lz = -leafRadius; lz <= leafRadius; lz++) {
                                const distSq = lx * lx + ly * ly + lz * lz;
                                if (distSq < leafRadius * leafRadius * 0.8 + Math.random() * leafRadius) { // Add randomness
                                    const leafX = x + lx;
                                    const leafY = leafCenterY + ly;
                                    const leafZ = z + lz;
                                    // Check bounds and if the spot is currently air
                                    if (leafX >= 0 && leafX < CHUNK_SIZE && leafZ >= 0 && leafZ < CHUNK_SIZE && leafY < CHUNK_HEIGHT) {
                                        const key = `${leafX},${leafY},${leafZ}`;
                                        if (!blocks.has(key) || blocks.get(key) === BLOCK_TYPES.AIR) {
                                            blocks.set(key, BLOCK_TYPES.LEAF);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                // Cactus Generation (Deserts)
                else if (biome === BIOMES.DESERT && surfaceBlockType === BLOCK_TYPES.SAND && Math.random() < 0.01) {
                    const cactusHeight = Math.floor(Math.random() * 3) + 2; // 2 to 4 blocks high
                    for (let cy = 1; cy <= cactusHeight; cy++) {
                        if(topY + cy < CHUNK_HEIGHT) blocks.set(`${x},${topY + cy},${z}`, BLOCK_TYPES.CACTUS);
                    }
                }
            }
        }
    }

    return blocks;
}


// --- Creates the InstancedMeshes for a chunk ---
// Minor change: Cull hidden faces (basic implementation)
function createChunkMesh(chunkX, chunkZ, chunkData) {
    const chunkGroup = new THREE.Group();
    chunkGroup.position.set(chunkX * CHUNK_SIZE, 0, chunkZ * CHUNK_SIZE);
    scene.add(chunkGroup);
    worldObjects.push(chunkGroup); // Add chunk group to raycast targets

    const instances = {}; // { [blockType]: { material: Material | Material[], positions: Vector3[] } }

    // --- Helper function to check if a neighbor block is opaque ---
    // This is a simplified check within the *same* chunk's data
    const isNeighborSolid = (x, y, z) => {
        const key = `${x},${y},${z}`;
        if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE || y < -CHUNK_HEIGHT/2 || y >= CHUNK_HEIGHT) {
            return false; // Assume neighbors outside chunk bounds are air for simplicity (can be improved)
        }
        const type = chunkData.get(key);
        // Consider air and transparent blocks (leaves, water) as non-solid for culling
        return type && type !== BLOCK_TYPES.AIR && type !== BLOCK_TYPES.LEAF && type !== BLOCK_TYPES.WATER;
    };

    // Group positions by block type
    for (const [posKey, blockType] of chunkData.entries()) {
        if (blockType === BLOCK_TYPES.AIR) continue;

        const [x, y, z] = posKey.split(',').map(Number);

        // --- Basic Face Culling ---
        // Check neighbors: If a neighbor is solid/opaque, don't add this block instance
        // (This is a very basic culling - only removes fully hidden blocks)
        // A better approach involves custom geometry generation per chunk
        // to build only the visible faces. This InstancedMesh approach makes
        // true face culling harder without significant geometry work.
        // Let's stick to adding all non-air blocks for now, as culling
        // hidden *instances* entirely is complex with shared InstancedMesh.
        /*
        if (isNeighborSolid(x + 1, y, z) && isNeighborSolid(x - 1, y, z) &&
            isNeighborSolid(x, y + 1, z) && isNeighborSolid(x, y - 1, z) &&
            isNeighborSolid(x, y, z + 1) && isNeighborSolid(x, y, z - 1)) {
            continue; // Block is completely surrounded, skip it (basic optimization)
        }
        */
        // --- END CULLING (Disabled for now) ---


        const position = new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5); // Center block

        if (!instances[blockType]) {
            instances[blockType] = {
                material: materials[blockType], // Material or array of materials
                positions: [],
            };
        }
        instances[blockType].positions.push(position);
    }

    const instancedMeshes = new Map(); // Map<string, THREE.InstancedMesh>
    const dummy = new THREE.Object3D();

    // Create InstancedMesh for each block type
    for (const blockType in instances) {
        const data = instances[blockType];
        if (!data.material || data.positions.length === 0) continue;

        // Handle potential array of materials (like grass)
        const material = Array.isArray(data.material) ? data.material : data.material;

        const instancedMesh = new THREE.InstancedMesh(blockGeometry, material, data.positions.length);
        instancedMesh.userData.blockType = blockType;
        instancedMesh.userData.isChunkMesh = true;
        instancedMesh.userData.chunkKey = getChunkKey(chunkX, chunkZ);
        instancedMesh.castShadow = false; // Can disable shadows per mesh type if needed
        instancedMesh.receiveShadow = false;

        // --- Optimize water rendering slightly ---
        if(blockType === BLOCK_TYPES.WATER) {
            instancedMesh.renderOrder = 1; // Render water after opaque objects
        }


        let instanceIndex = 0;
        for (const pos of data.positions) {
            dummy.position.copy(pos);
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(instanceIndex++, dummy.matrix);
        }
        instancedMesh.instanceMatrix.needsUpdate = true;
        chunkGroup.add(instancedMesh);
        instancedMeshes.set(blockType, instancedMesh);
    }

    return { group: chunkGroup, instancedMeshes: instancedMeshes };
}


// --- Chunk Loading/Unloading Logic --- (Keep updateChunks function mostly as is)
// Make sure disposal logic remains correct (don't dispose shared geometry/materials)
function updateChunks() {
    const playerPos = controls.getObject().position;
    const playerChunkX = Math.floor(playerPos.x / CHUNK_SIZE);
    const playerChunkZ = Math.floor(playerPos.z / CHUNK_SIZE);

    if (playerChunkX === currentChunkX && playerChunkZ === currentChunkZ) {
        return; // No change
    }

    console.time("Chunk Update"); // Time the update process

    const previousChunkX = currentChunkX;
    const previousChunkZ = currentChunkZ;
    currentChunkX = playerChunkX;
    currentChunkZ = playerChunkZ;

    const chunksToRemove = new Set(chunks.keys()); // Existing chunks marked for potential removal
    const chunksToLoad = []; // Store coords of chunks to load

    // Identify chunks to load/keep
    for (let cx = currentChunkX - RENDER_DISTANCE; cx <= currentChunkX + RENDER_DISTANCE; cx++) {
        for (let cz = currentChunkZ - RENDER_DISTANCE; cz <= currentChunkZ + RENDER_DISTANCE; cz++) {
            const key = getChunkKey(cx, cz);
            if (chunks.has(key)) {
                chunksToRemove.delete(key); // Keep this chunk
            } else {
                 chunksToLoad.push({cx, cz, key}); // Mark for loading
            }
        }
    }

     // Unload chunks progressively (optional, can improve perceived performance)
    let unloadedCount = 0;
    chunksToRemove.forEach(key => {
         // Limit unloading per frame if needed: if (unloadedCount++ > 2) return;
        console.log(`Unloading chunk: ${key}`);
        const chunkInfo = chunks.get(key);
        if (chunkInfo) {
            scene.remove(chunkInfo.group);
            const index = worldObjects.indexOf(chunkInfo.group);
            if (index > -1) worldObjects.splice(index, 1);
            chunkInfo.instancedMeshes.forEach(mesh => {
                mesh.dispose(); // Dispose the InstancedMesh object itself
            });
            chunkInfo.group.clear();
        }
        chunks.delete(key);
    });

    // Load new chunks progressively
    let loadedCount = 0;
    chunksToLoad.forEach(chunkCoord => {
        // Limit loading per frame: if (loadedCount++ > 2) return; // Load max 2 chunks per frame
        if (!chunks.has(chunkCoord.key)) { // Double check it wasn't loaded somehow
             console.log(`Loading chunk: ${chunkCoord.key}`);
             console.time(`Generate ${chunkCoord.key}`);
             const chunkData = generateChunkData(chunkCoord.cx, chunkCoord.cz);
             console.timeEnd(`Generate ${chunkCoord.key}`);

             console.time(`Mesh ${chunkCoord.key}`);
             const chunkMeshInfo = createChunkMesh(chunkCoord.cx, chunkCoord.cz, chunkData);
             console.timeEnd(`Mesh ${chunkCoord.key}`);

             chunks.set(chunkCoord.key, chunkMeshInfo);
        }
     });

    console.timeEnd("Chunk Update");
    console.log("Loaded chunks:", chunks.size);
}


// --- Block Interaction --- (Keep mousedown listener mostly as is)
// Ensure interaction logic correctly handles world vs local coords for instanced meshes
window.addEventListener('mousedown', (event) => {
    if (!controls.isLocked) return;

    interactionRaycaster.setFromCamera({ x: 0, y: 0 }, camera); // Center of screen
    const intersects = interactionRaycaster.intersectObjects(worldObjects, true);

    if (intersects.length > 0) {
        const intersection = intersects[0];
        const obj = intersection.object;

        // --- Breaking Blocks ---
        if (event.button === 0) { // Left click
            if (obj.userData.isChunkMesh && intersection.instanceId !== undefined) {
                const mesh = obj;
                const instanceId = intersection.instanceId;

                 // --- Check if block is already broken (scaled to zero) ---
                 const checkMatrix = new THREE.Matrix4();
                 mesh.getMatrixAt(instanceId, checkMatrix);
                 const checkScale = new THREE.Vector3();
                 checkMatrix.decompose(new THREE.Vector3(), new THREE.Quaternion(), checkScale);
                 if (checkScale.x === 0 && checkScale.y === 0 && checkScale.z === 0) {
                      console.log(`Instance ${instanceId} already broken.`);
                      return; // Don't try to break it again
                 }
                 // --- End check ---

                const matrix = new THREE.Matrix4();
                mesh.getMatrixAt(instanceId, matrix);
                matrix.scale(new THREE.Vector3(0, 0, 0)); // Scale to zero
                mesh.setMatrixAt(instanceId, matrix);
                mesh.instanceMatrix.needsUpdate = true;
                console.log(`Hid instance ${instanceId} in chunk ${mesh.userData.chunkKey}`);

                // TODO: Update underlying chunk data if persistence is needed
            }
             else if (!obj.userData.isChunkMesh && obj.userData.isPlacedBlock) {
                scene.remove(obj);
                const index = worldObjects.indexOf(obj);
                if (index > -1) worldObjects.splice(index, 1);
                // Optional: Dispose geometry/material if not shared AND if it's the last instance
                 // obj.geometry.dispose(); // Shared, so don't dispose
                 // obj.material.dispose(); // Shared, so don't dispose
                console.log("Removed placed block");
            }
        }
        // --- Placing Blocks ---
        else if (event.button === 2) { // Right click
            if (!intersection.face) return;

            const faceNormal = intersection.face.normal;
            let placePosition = new THREE.Vector3();
            let hitPositionWorld = new THREE.Vector3(); // Need world position for collision check

            if (obj.userData.isChunkMesh && intersection.instanceId !== undefined) {
                const hitMatrix = new THREE.Matrix4();
                obj.getMatrixAt(intersection.instanceId, hitMatrix);
                const hitPositionLocal = new THREE.Vector3().setFromMatrixPosition(hitMatrix);
                const chunkGroup = obj.parent;
                hitPositionWorld.copy(hitPositionLocal).applyMatrix4(chunkGroup.matrixWorld); // Get world position
                placePosition.copy(hitPositionWorld).add(faceNormal);
             } else if (!obj.userData.isChunkMesh && obj.userData.isPlacedBlock && obj.position) { // A previously placed block
                hitPositionWorld.copy(obj.position); // World position is just the mesh position
                placePosition.copy(obj.position).add(faceNormal);
            } else {
                 console.warn("Cannot determine placement position from intersected object.", obj);
                return;
            }

            // Round to nearest block center
            placePosition.floor().addScalar(0.5);

            // --- Collision Check: Prevent placing block inside player ---
            const playerPos = controls.getObject().position;
            const playerBox = new THREE.Box3(
                 new THREE.Vector3(playerPos.x - 0.4, playerPos.y - PLAYER_HEIGHT + 0.1, playerPos.z - 0.4),
                 new THREE.Vector3(playerPos.x + 0.4, playerPos.y + 0.1, playerPos.z + 0.4)
            );
             const placeBlockBox = new THREE.Box3(
                 placePosition.clone().subScalar(0.5),
                 placePosition.clone().addScalar(0.5)
             );

            if (playerBox.intersectsBox(placeBlockBox)) {
                console.log("Cannot place block inside player.");
                return;
            }

            // --- Add the new block as an INDIVIDUAL MESH ---
            const blockMaterial = Array.isArray(materials[selectedBlockType])
                ? materials[selectedBlockType] // Use array for grass/cactus
                : materials[selectedBlockType]; // Use shared material otherwise

             // Handle potential edge case where material doesn't exist
             if (!blockMaterial) {
                  console.error(`Material not found for selected block type: ${selectedBlockType}`);
                  return;
             }

            const newBlock = new THREE.Mesh(blockGeometry, blockMaterial);
            newBlock.position.copy(placePosition);
            newBlock.userData.blockType = selectedBlockType;
            newBlock.userData.isPlacedBlock = true; // Mark as manually placed
            scene.add(newBlock);
            worldObjects.push(newBlock);
            console.log(`Placed ${selectedBlockType} block at ${placePosition.x}, ${placePosition.y}, ${placePosition.z}`);
        }
    }
});

// --- Animation Loop --- (Keep animate function mostly as is)
// Add check for water physics (basic sinking)
const clock = new THREE.Clock();
let fpsLastUpdateTime = 0;
let frameCount = 0;
const fpsDisplayElement = document.getElementById('fps-display'); // Needs HTML element

function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.1); // Clamp delta to prevent physics glitches
    const elapsedTime = clock.getElapsedTime();

    // --- FPS Calculation --- (keep as is)
    frameCount++;
    if (elapsedTime - fpsLastUpdateTime >= 1.0) {
        const fps = Math.round(frameCount / (elapsedTime - fpsLastUpdateTime));
        if(fpsDisplayElement) fpsDisplayElement.textContent = `FPS: ${fps}`;
        frameCount = 0;
        fpsLastUpdateTime = elapsedTime;
    }


    // --- Update Chunks ---
    updateChunks(); // Load/unload chunks based on player position

    // --- Player Movement & Physics ---
    if (controls.isLocked) {
        const moveSpeedActual = MOVE_SPEED * delta * 60; // Frame-rate independent speed
        const playerObject = controls.getObject();
        const playerPosition = playerObject.position;

        // --- Check if player is in water ---
        // Simple check: is player feet level below water level?
        let isInWater = playerPosition.y - PLAYER_HEIGHT < WATER_LEVEL;
        // Could refine with raycast or block check at player feet

        // Horizontal movement (slower in water)
        const currentMoveSpeed = isInWater ? moveSpeedActual * 0.5 : moveSpeedActual;
        if (keys.w) playerObject.translateZ(-currentMoveSpeed);
        if (keys.s) playerObject.translateZ(currentMoveSpeed);
        if (keys.a) playerObject.translateX(-currentMoveSpeed);
        if (keys.d) playerObject.translateX(currentMoveSpeed);

        // Vertical movement (Gravity/Buoyancy)
        const currentGravity = isInWater ? GRAVITY * 0.5 : GRAVITY; // Less gravity effect in water
        const currentJumpForce = isInWater ? JUMP_FORCE * 0.8 : JUMP_FORCE; // Weaker jump in water

         // Apply damping/drag in water
         if(isInWater) {
              playerVelocityY *= 0.9; // Damp vertical speed
         }

        // Apply gravity
        playerVelocityY -= currentGravity * delta * 60;

        // Jump logic (allow jumping from water surface too)
        if (keys.space && (onGround || isInWater)) { // Can jump if on ground OR in water
             playerVelocityY = currentJumpForce;
             onGround = false; // Leave ground state when jumping
        }
        keys.space = false; // Consume jump input immediately

        // Check for ground collision
        groundCheckRaycaster.set(playerPosition, downVector);
        const groundIntersects = groundCheckRaycaster.intersectObjects(worldObjects, true);
        let onSolidGround = false;
        let groundY = -Infinity;

        if (groundIntersects.length > 0) {
             const hit = groundIntersects[0];
             // Check if hit object is solid ground (not water)
             const hitBlockType = hit.object.userData?.blockType;
             const isHitSolid = hitBlockType !== BLOCK_TYPES.WATER; // Add other non-solid types if needed

             if (isHitSolid && hit.distance <= PLAYER_HEIGHT + 0.05) { // Small buffer
                  onSolidGround = true;
                  groundY = hit.point.y;
             }
        }

        if (onSolidGround) {
            // Snap to ground if falling onto it or moving downwards slightly
            if (playerVelocityY <= 0) {
                playerVelocityY = 0;
                playerPosition.y = groundY + PLAYER_HEIGHT;
                onGround = true;
            }
        } else {
             onGround = false; // Not on solid ground
             // If not on ground, but feet are below water level, simulate buoyancy/bobbing
             if (isInWater && playerVelocityY < 0.05) { // Apply slight upward force if sinking slowly or still
                 playerVelocityY += GRAVITY * 0.8 * delta * 60; // Counteract some gravity
             }
        }

        // Apply vertical velocity
        playerPosition.y += playerVelocityY * delta * 60;

        // Prevent falling through world (safety net) - adjust lower bound
        if (playerPosition.y < -CHUNK_HEIGHT) {
            console.warn("Player fell out of world, resetting position.");
            playerPosition.set(currentChunkX * CHUNK_SIZE + CHUNK_SIZE / 2, baseLevel + elevationAmplitude + terrainAmplitude + 5, currentChunkZ * CHUNK_SIZE + CHUNK_SIZE / 2);
            playerVelocityY = 0;
            onGround = false;
        }
    }

    // --- Render ---
    renderer.render(scene, camera);
}

// --- Initial Setup ---
updateSelectedBlockUI();
// Force initial load by setting current chunk to invalid coords before first update
currentChunkX = Infinity;
currentChunkZ = Infinity;
console.log("Performing initial chunk load...");
updateChunks(); // Perform initial chunk load based on camera start

console.log("Starting animation loop...");
animate();

// Handle window resize (Keep as is)
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});