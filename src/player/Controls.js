import * as THREE from 'three';
import { BlockType } from '../world/Block.js';

export class Controls {
    constructor(camera, domElement, player) {
        this.camera = camera;
        this.domElement = domElement;
        this.player = player;
        
        this.isLocked = false;
        this.keys = {};
        
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.PI_2 = Math.PI / 2;
        
        this.raycaster = new THREE.Raycaster();
        this.selectedBlock = null;
        this.blockDistance = 5;
        
        this.init();
    }

    init() {
        this.domElement.addEventListener('click', () => {
            this.domElement.requestPointerLock();
        });

        document.addEventListener('pointerlockchange', () => {
            this.isLocked = document.pointerLockElement === this.domElement;
        });

        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        
        document.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    onMouseMove(event) {
        if (!this.isLocked) return;

        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        this.euler.setFromQuaternion(this.camera.quaternion);
        this.euler.y -= movementX * 0.002;
        this.euler.x -= movementY * 0.002;
        this.euler.x = Math.max(-this.PI_2, Math.min(this.PI_2, this.euler.x));
        this.camera.quaternion.setFromEuler(this.euler);
    }

    onKeyDown(event) {
        this.keys[event.code] = true;
    }

    onKeyUp(event) {
        this.keys[event.code] = false;
    }

    onMouseDown(event) {
        if (!this.isLocked) return;

        event.preventDefault();
        
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersection = this.player.world.raycast(this.raycaster);
        
        if (intersection) {
            if (event.button === 0) {
                this.player.world.setBlockAt(
                    intersection.blockPosition.x,
                    intersection.blockPosition.y,
                    intersection.blockPosition.z,
                    BlockType.AIR
                );
            } else if (event.button === 2) {
                const placePos = intersection.blockPosition.clone().add(intersection.face.normal);
                
                this.player.world.setBlockAt(
                    Math.floor(placePos.x),
                    Math.floor(placePos.y),
                    Math.floor(placePos.z),
                    BlockType.STONE
                );
            }
        }
    }

    update() {
        if (!this.isLocked) return;

        const direction = new THREE.Vector3();
        const right = new THREE.Vector3();
        const forward = new THREE.Vector3();
        
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

        if (this.keys['KeyW']) direction.add(forward);
        if (this.keys['KeyS']) direction.sub(forward);
        if (this.keys['KeyA']) direction.sub(right);
        if (this.keys['KeyD']) direction.add(right);
        
        if (direction.length() > 0) {
            direction.normalize();
            this.player.move(direction);
        }
        
        if (this.keys['Space']) {
            this.player.jump();
        }
    }
}