import { create } from 'zustand';
import { nanoid } from 'nanoid';

type Cube = {
    key: string;
    pos: [number, number, number];
    texture: string;
};

type State = {
    texture: string;
    cubes: Cube[];
    addCube: (x: number, y: number, z: number) => void;
    removeCube: (x: number, y: number, z: number) => void;
    setTexture: (texture: string) => void;
    saveWorld: () => void;
    resetWorld: () => void;
};

export const useStore = create<State>((set) => ({
    texture: 'dirt',
    cubes: [
        {
            key: nanoid(),
            pos: [1, 0, 1],
            texture: 'dirt',
        },
        {
            key: nanoid(),
            pos: [2, 0, 1],
            texture: 'wood',
        },
    ],
    addCube: (x, y, z) => {
        set((prev) => ({
            cubes: [
                ...prev.cubes,
                {
                    key: nanoid(),
                    pos: [x, y, z],
                    texture: prev.texture,
                },
            ],
        }));
    },
    removeCube: (x, y, z) => {
        set((prev) => ({
            cubes: prev.cubes.filter((cube) => {
                const [cx, cy, cz] = cube.pos;
                return cx !== x || cy !== y || cz !== z;
            }),
        }));
    },
    setTexture: (texture) => {
        set(() => ({
            texture,
        }));
    },
    saveWorld: () => { },
    resetWorld: () => { },
}));
