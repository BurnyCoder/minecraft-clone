import * as THREE from 'three';
import { Block, BlockType } from './Block.js';

export class Chunk {
    static SIZE = 16;
    static HEIGHT = 64;

    constructor(x, z, scene, world) {
        this.x = x;
        this.z = z;
        this.scene = scene;
        this.world = world;
        this.blocks = new Uint8Array(Chunk.SIZE * Chunk.HEIGHT * Chunk.SIZE);
        this.mesh = null;
        this.needsUpdate = true;
    }

    setBlock(x, y, z, type) {
        if (x < 0 || x >= Chunk.SIZE || y < 0 || y >= Chunk.HEIGHT || z < 0 || z >= Chunk.SIZE) {
            return false;
        }
        
        const index = this.getIndex(x, y, z);
        this.blocks[index] = type;
        this.needsUpdate = true;
        
        return true;
    }

    getBlock(x, y, z) {
        if (x < 0 || x >= Chunk.SIZE || y < 0 || y >= Chunk.HEIGHT || z < 0 || z >= Chunk.SIZE) {
            return BlockType.AIR;
        }
        return this.blocks[this.getIndex(x, y, z)];
    }

    getIndex(x, y, z) {
        return x + z * Chunk.SIZE + y * Chunk.SIZE * Chunk.SIZE;
    }

    shouldDrawFace(x, y, z, nx, ny, nz) {
        const neighborX = x + nx;
        const neighborY = y + ny;
        const neighborZ = z + nz;
        
        if (neighborX < 0 || neighborX >= Chunk.SIZE || 
            neighborZ < 0 || neighborZ >= Chunk.SIZE) {
            const worldX = this.x * Chunk.SIZE + neighborX;
            const worldZ = this.z * Chunk.SIZE + neighborZ;
            return this.world.getBlockAt(worldX, neighborY, worldZ) === BlockType.AIR;
        }
        
        if (neighborY < 0 || neighborY >= Chunk.HEIGHT) {
            return true;
        }
        
        return this.getBlock(neighborX, neighborY, neighborZ) === BlockType.AIR;
    }

    buildMesh() {
        if (!this.needsUpdate) return;
        
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.scene.remove(this.mesh);
        }

        const positions = [];
        const normals = [];
        const colors = [];
        const indices = [];
        let vertexCount = 0;

        const faceData = [
            { normal: [1, 0, 0], vertices: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },  // Right
            { normal: [-1, 0, 0], vertices: [[0, 0, 1], [0, 1, 1], [0, 1, 0], [0, 0, 0]] }, // Left
            { normal: [0, 1, 0], vertices: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]] },  // Top
            { normal: [0, -1, 0], vertices: [[0, 0, 1], [0, 0, 0], [1, 0, 0], [1, 0, 1]] }, // Bottom
            { normal: [0, 0, 1], vertices: [[1, 0, 1], [1, 1, 1], [0, 1, 1], [0, 0, 1]] },  // Front
            { normal: [0, 0, -1], vertices: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]] }  // Back
        ];

        for (let x = 0; x < Chunk.SIZE; x++) {
            for (let y = 0; y < Chunk.HEIGHT; y++) {
                for (let z = 0; z < Chunk.SIZE; z++) {
                    const block = this.getBlock(x, y, z);
                    if (block === BlockType.AIR) continue;

                    const blockColor = this.getBlockColor(block);

                    for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
                        const face = faceData[faceIndex];
                        const [nx, ny, nz] = face.normal;
                        
                        if (!this.shouldDrawFace(x, y, z, nx, ny, nz)) continue;

                        const baseVertex = vertexCount;
                        
                        for (const vertex of face.vertices) {
                            positions.push(x + vertex[0], y + vertex[1], z + vertex[2]);
                            normals.push(...face.normal);
                            colors.push(...blockColor);
                        }

                        indices.push(
                            baseVertex, baseVertex + 1, baseVertex + 2,
                            baseVertex, baseVertex + 2, baseVertex + 3
                        );

                        vertexCount += 4;
                    }
                }
            }
        }

        if (positions.length === 0) {
            this.needsUpdate = false;
            return;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);

        const material = new THREE.MeshLambertMaterial({ 
            vertexColors: true,
            side: THREE.FrontSide
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(this.x * Chunk.SIZE, 0, this.z * Chunk.SIZE);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.matrixAutoUpdate = false;
        this.mesh.updateMatrix();
        
        this.scene.add(this.mesh);
        this.needsUpdate = false;
    }

    getBlockColor(type) {
        switch(type) {
            case BlockType.GRASS: return [0.1, 0.8, 0.2];
            case BlockType.DIRT: return [0.4, 0.26, 0.13];
            case BlockType.STONE: return [0.5, 0.5, 0.5];
            case BlockType.WOOD: return [0.55, 0.27, 0.07];
            case BlockType.LEAVES: return [0.13, 0.55, 0.13];
            case BlockType.SAND: return [0.93, 0.79, 0.69];
            case BlockType.WATER: return [0.0, 0.41, 0.58];
            default: return [1, 1, 1];
        }
    }

    generate() {
        for (let x = 0; x < Chunk.SIZE; x++) {
            for (let z = 0; z < Chunk.SIZE; z++) {
                const worldX = this.x * Chunk.SIZE + x;
                const worldZ = this.z * Chunk.SIZE + z;
                
                const height = Math.floor(
                    20 + 
                    Math.sin(worldX * 0.1) * 5 + 
                    Math.cos(worldZ * 0.1) * 5
                );
                
                for (let y = 0; y < height && y < Chunk.HEIGHT; y++) {
                    let type = BlockType.STONE;
                    
                    if (y === height - 1) {
                        type = BlockType.GRASS;
                    } else if (y > height - 4) {
                        type = BlockType.DIRT;
                    }
                    
                    const index = this.getIndex(x, y, z);
                    this.blocks[index] = type;
                }
            }
        }
        this.buildMesh();
    }

    dispose() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.scene.remove(this.mesh);
        }
    }
}