import * as THREE from 'three';
import { Chunk } from './Chunk.js';
import { BlockType } from './Block.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.chunks = new Map();
        this.renderDistance = 3;
        this.frustum = new THREE.Frustum();
        this.cameraMatrix = new THREE.Matrix4();
        
        this.generateInitialChunks();
    }

    generateInitialChunks() {
        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                this.loadChunk(x, z);
            }
        }
    }

    loadChunk(chunkX, chunkZ) {
        const key = `${chunkX},${chunkZ}`;
        if (this.chunks.has(key)) return;
        
        const chunk = new Chunk(chunkX, chunkZ, this.scene, this);
        chunk.generate();
        this.chunks.set(key, chunk);
    }

    getBlockAt(worldX, worldY, worldZ) {
        const chunkX = Math.floor(worldX / Chunk.SIZE);
        const chunkZ = Math.floor(worldZ / Chunk.SIZE);
        const chunk = this.chunks.get(`${chunkX},${chunkZ}`);
        
        if (!chunk) return BlockType.AIR;
        
        const localX = worldX - chunkX * Chunk.SIZE;
        const localZ = worldZ - chunkZ * Chunk.SIZE;
        
        return chunk.getBlock(localX, worldY, localZ);
    }

    setBlockAt(worldX, worldY, worldZ, type) {
        const chunkX = Math.floor(worldX / Chunk.SIZE);
        const chunkZ = Math.floor(worldZ / Chunk.SIZE);
        const chunk = this.chunks.get(`${chunkX},${chunkZ}`);
        
        if (!chunk) return false;
        
        const localX = worldX - chunkX * Chunk.SIZE;
        const localZ = worldZ - chunkZ * Chunk.SIZE;
        
        const result = chunk.setBlock(localX, worldY, localZ, type);
        if (result) {
            chunk.buildMesh();
            
            if (localX === 0) {
                const neighborChunk = this.chunks.get(`${chunkX - 1},${chunkZ}`);
                if (neighborChunk) {
                    neighborChunk.needsUpdate = true;
                    neighborChunk.buildMesh();
                }
            } else if (localX === Chunk.SIZE - 1) {
                const neighborChunk = this.chunks.get(`${chunkX + 1},${chunkZ}`);
                if (neighborChunk) {
                    neighborChunk.needsUpdate = true;
                    neighborChunk.buildMesh();
                }
            }
            
            if (localZ === 0) {
                const neighborChunk = this.chunks.get(`${chunkX},${chunkZ - 1}`);
                if (neighborChunk) {
                    neighborChunk.needsUpdate = true;
                    neighborChunk.buildMesh();
                }
            } else if (localZ === Chunk.SIZE - 1) {
                const neighborChunk = this.chunks.get(`${chunkX},${chunkZ + 1}`);
                if (neighborChunk) {
                    neighborChunk.needsUpdate = true;
                    neighborChunk.buildMesh();
                }
            }
        }
        
        return result;
    }

    updateChunkVisibility(camera) {
        this.cameraMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        this.frustum.setFromProjectionMatrix(this.cameraMatrix);
        
        this.chunks.forEach(chunk => {
            if (!chunk.mesh) return;
            
            const chunkBounds = new THREE.Box3(
                new THREE.Vector3(
                    chunk.x * Chunk.SIZE,
                    0,
                    chunk.z * Chunk.SIZE
                ),
                new THREE.Vector3(
                    (chunk.x + 1) * Chunk.SIZE,
                    Chunk.HEIGHT,
                    (chunk.z + 1) * Chunk.SIZE
                )
            );
            
            chunk.mesh.visible = this.frustum.intersectsBox(chunkBounds);
        });
    }

    updateChunks(playerPosition) {
        const playerChunkX = Math.floor(playerPosition.x / Chunk.SIZE);
        const playerChunkZ = Math.floor(playerPosition.z / Chunk.SIZE);
        
        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                this.loadChunk(playerChunkX + x, playerChunkZ + z);
            }
        }
        
        const chunksToRemove = [];
        this.chunks.forEach((chunk, key) => {
            const distance = Math.max(
                Math.abs(chunk.x - playerChunkX),
                Math.abs(chunk.z - playerChunkZ)
            );
            
            if (distance > this.renderDistance + 1) {
                chunksToRemove.push(key);
            }
        });
        
        chunksToRemove.forEach(key => {
            const chunk = this.chunks.get(key);
            chunk.dispose();
            this.chunks.delete(key);
        });
    }

    raycast(raycaster) {
        const meshes = [];
        this.chunks.forEach(chunk => {
            if (chunk.mesh && chunk.mesh.visible) {
                meshes.push(chunk.mesh);
            }
        });
        
        const intersects = raycaster.intersectObjects(meshes);
        if (intersects.length === 0) return null;
        
        const intersection = intersects[0];
        const point = intersection.point.clone().add(intersection.face.normal.clone().multiplyScalar(-0.5));
        
        return {
            point: intersection.point,
            face: intersection.face,
            object: intersection.object,
            blockPosition: new THREE.Vector3(
                Math.floor(point.x),
                Math.floor(point.y),
                Math.floor(point.z)
            )
        };
    }
}