import * as THREE from 'three';

export const BlockType = {
    AIR: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
    WOOD: 4,
    LEAVES: 5,
    SAND: 6,
    WATER: 7
};

export class Block {
    static materials = {};
    static geometry = null;

    static initMaterials() {
        const textureLoader = new THREE.TextureLoader();
        
        this.materials[BlockType.GRASS] = [
            new THREE.MeshLambertMaterial({ color: 0x7CFC00 }), // right
            new THREE.MeshLambertMaterial({ color: 0x7CFC00 }), // left
            new THREE.MeshLambertMaterial({ color: 0x00FF00 }), // top
            new THREE.MeshLambertMaterial({ color: 0x8B4513 }), // bottom
            new THREE.MeshLambertMaterial({ color: 0x7CFC00 }), // front
            new THREE.MeshLambertMaterial({ color: 0x7CFC00 })  // back
        ];

        this.materials[BlockType.DIRT] = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        this.materials[BlockType.STONE] = new THREE.MeshLambertMaterial({ color: 0x808080 });
        this.materials[BlockType.WOOD] = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        this.materials[BlockType.LEAVES] = new THREE.MeshLambertMaterial({ 
            color: 0x228B22,
            transparent: true,
            opacity: 0.8
        });
        this.materials[BlockType.SAND] = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        this.materials[BlockType.WATER] = new THREE.MeshLambertMaterial({ 
            color: 0x006994,
            transparent: true,
            opacity: 0.6
        });
    }

    static initGeometry() {
        this.geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    static createMesh(type, position) {
        if (!this.geometry) this.initGeometry();
        if (Object.keys(this.materials).length === 0) this.initMaterials();

        if (type === BlockType.AIR) return null;

        const material = this.materials[type];
        const mesh = new THREE.Mesh(this.geometry, material);
        mesh.position.copy(position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { type };
        
        return mesh;
    }
}