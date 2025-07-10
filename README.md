# Minecraft Clone

A browser-based Minecraft clone built with Three.js, featuring voxel-based terrain, block manipulation, and optimized rendering.

## Features

- **Voxel-based world**: Chunk-based terrain system with procedural generation
- **First-person controls**: WASD movement with mouse look
- **Block interaction**: Break blocks (left click) and place blocks (right click)
- **Optimized rendering**: Face culling, frustum culling, and merged geometry for performance
- **Physics**: Gravity, jumping, and collision detection

## Demo

Click on the game window to capture mouse control. Press ESC to release.

### Controls

- **WASD** - Move around
- **Space** - Jump
- **Mouse** - Look around
- **Left Click** - Break block
- **Right Click** - Place block

## Installation

1. Clone the repository:
```bash
git clone https://github.com/BurnyCoder/minecraft-clone.git
cd minecraft-clone
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open http://localhost:3000 in your browser

## Build

To build for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Technical Details

### Architecture

- **Rendering**: Three.js for 3D graphics
- **World Generation**: Chunk-based system (16x64x16 blocks per chunk)
- **Optimization**: 
  - Face culling (only render visible faces)
  - Frustum culling (only render chunks in view)
  - Merged geometry (one mesh per chunk)
  - Dynamic chunk loading/unloading

### Performance

The game is optimized to run smoothly by:
- Rendering only visible block faces
- Using a single mesh per chunk instead of individual block meshes
- Implementing view frustum culling
- Limiting render distance to 3 chunks
- Reduced world height to 64 blocks

## Future Improvements

- [ ] Different block types with textures
- [ ] Inventory system
- [ ] Day/night cycle
- [ ] Biomes
- [ ] Multiplayer support
- [ ] Save/load functionality
- [ ] More complex terrain generation
- [ ] Water physics
- [ ] Crafting system

## License

MIT