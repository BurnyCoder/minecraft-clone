import * as THREE from 'three';
import { BlockType } from '../world/Block.js';

export class Player {
    constructor(camera, world) {
        this.camera = camera;
        this.world = world;
        
        this.position = new THREE.Vector3(0, 30, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        
        this.moveSpeed = 0.1;
        this.jumpSpeed = 0.15;
        this.gravity = 0.008;
        
        this.width = 0.8;
        this.height = 1.8;
        
        this.isJumping = false;
        this.canJump = false;
        
        this.camera.position.copy(this.position);
    }

    update() {
        this.velocity.y -= this.gravity;
        
        this.velocity.x *= 0.8;
        this.velocity.z *= 0.8;
        
        if (Math.abs(this.velocity.x) < 0.001) this.velocity.x = 0;
        if (Math.abs(this.velocity.z) < 0.001) this.velocity.z = 0;
        
        const nextPosition = this.position.clone().add(this.velocity);
        
        if (this.checkCollision(nextPosition.x, this.position.y, this.position.z)) {
            this.velocity.x = 0;
        } else {
            this.position.x = nextPosition.x;
        }
        
        if (this.checkCollision(this.position.x, this.position.y, nextPosition.z)) {
            this.velocity.z = 0;
        } else {
            this.position.z = nextPosition.z;
        }
        
        if (this.checkCollision(this.position.x, nextPosition.y, this.position.z)) {
            if (this.velocity.y < 0) {
                this.canJump = true;
                this.isJumping = false;
            }
            this.velocity.y = 0;
        } else {
            this.position.y = nextPosition.y;
            this.canJump = false;
        }
        
        this.camera.position.copy(this.position);
    }

    move(direction) {
        this.velocity.add(direction.multiplyScalar(this.moveSpeed));
    }

    jump() {
        if (this.canJump && !this.isJumping) {
            this.velocity.y = this.jumpSpeed;
            this.isJumping = true;
            this.canJump = false;
        }
    }

    checkCollision(x, y, z) {
        const margin = 0.1;
        const playerMinX = x - this.width / 2 + margin;
        const playerMaxX = x + this.width / 2 - margin;
        const playerMinY = y - this.height / 2;
        const playerMaxY = y + this.height / 2;
        const playerMinZ = z - this.width / 2 + margin;
        const playerMaxZ = z + this.width / 2 - margin;
        
        const minBlockX = Math.floor(playerMinX);
        const maxBlockX = Math.floor(playerMaxX);
        const minBlockY = Math.floor(playerMinY);
        const maxBlockY = Math.floor(playerMaxY);
        const minBlockZ = Math.floor(playerMinZ);
        const maxBlockZ = Math.floor(playerMaxZ);
        
        for (let bx = minBlockX; bx <= maxBlockX; bx++) {
            for (let by = minBlockY; by <= maxBlockY; by++) {
                for (let bz = minBlockZ; bz <= maxBlockZ; bz++) {
                    const block = this.world.getBlockAt(bx, by, bz);
                    if (block !== BlockType.AIR) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }

    getPosition() {
        return this.position.clone();
    }
}