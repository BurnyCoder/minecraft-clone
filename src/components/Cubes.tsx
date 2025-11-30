import { useStore } from '../hooks/useStore';
import { useBox } from '@react-three/cannon';
import { useState } from 'react';
import { images } from '../images/textures';

const Cube = ({ position, texture, addCube, removeCube }: {
    position: [number, number, number],
    texture: string,
    addCube: (x: number, y: number, z: number) => void,
    removeCube: (x: number, y: number, z: number) => void
}) => {
    const [ref] = useBox(() => ({
        type: 'Static',
        position,
    }));

    const [isHovered, setIsHovered] = useState(false);

    if (texture === 'grass') {
        return (
            <mesh
                ref={ref as any}
                onPointerMove={(e) => {
                    e.stopPropagation();
                    setIsHovered(true);
                }}
                onPointerOut={(e) => {
                    e.stopPropagation();
                    setIsHovered(false);
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    const clickedFace = Math.floor(e.faceIndex! / 2);
                    const { x, y, z } = ref.current!.position;

                    if (e.altKey) {
                        removeCube(x, y, z);
                        return;
                    }

                    if (clickedFace === 0) { addCube(x + 1, y, z); return; }
                    if (clickedFace === 1) { addCube(x - 1, y, z); return; }
                    if (clickedFace === 2) { addCube(x, y + 1, z); return; }
                    if (clickedFace === 3) { addCube(x, y - 1, z); return; }
                    if (clickedFace === 4) { addCube(x, y, z + 1); return; }
                    if (clickedFace === 5) { addCube(x, y, z - 1); return; }
                }}
            >
                <boxGeometry />
                {[
                    images.grassSide, // Right
                    images.grassSide, // Left
                    images.grassTop,  // Top
                    images.grassBottom, // Bottom
                    images.grassSide, // Front
                    images.grassSide  // Back
                ].map((map, index) => (
                    <meshStandardMaterial
                        key={index}
                        attach={`material-${index}`}
                        map={map}
                        color={isHovered ? 'grey' : 'white'}
                    />
                ))}
            </mesh>
        );
    }

    const activeTexture = images[texture as keyof typeof images];

    return (
        <mesh
            ref={ref as any}
            onPointerMove={(e) => {
                e.stopPropagation();
                setIsHovered(true);
            }}
            onPointerOut={(e) => {
                e.stopPropagation();
                setIsHovered(false);
            }}
            onClick={(e) => {
                e.stopPropagation();
                const clickedFace = Math.floor(e.faceIndex! / 2);
                const { x, y, z } = ref.current!.position;

                if (e.altKey) {
                    removeCube(x, y, z);
                    return;
                }

                if (clickedFace === 0) {
                    addCube(x + 1, y, z);
                    return;
                }
                if (clickedFace === 1) {
                    addCube(x - 1, y, z);
                    return;
                }
                if (clickedFace === 2) {
                    addCube(x, y + 1, z);
                    return;
                }
                if (clickedFace === 3) {
                    addCube(x, y - 1, z);
                    return;
                }
                if (clickedFace === 4) {
                    addCube(x, y, z + 1);
                    return;
                }
                if (clickedFace === 5) {
                    addCube(x, y, z - 1);
                    return;
                }
            }}
        >
            <boxGeometry />
            <meshStandardMaterial
                map={activeTexture}
                color={isHovered ? 'grey' : 'white'}
                transparent={texture === 'glass'}
                opacity={texture === 'glass' ? 0.6 : 1}
            />
        </mesh>
    );
};

export const Cubes = () => {
    const cubes = useStore((state) => state.cubes);
    const addCube = useStore((state) => state.addCube);
    const removeCube = useStore((state) => state.removeCube);

    return cubes.map((cube) => (
        <Cube key={cube.key} position={cube.pos} texture={cube.texture} addCube={addCube} removeCube={removeCube} />
    ));
};
