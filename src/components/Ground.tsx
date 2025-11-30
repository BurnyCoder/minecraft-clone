import { usePlane } from '@react-three/cannon';
import { useStore } from '../hooks/useStore';

export const Ground = () => {
    const [ref] = usePlane(() => ({
        rotation: [-Math.PI / 2, 0, 0],
        position: [0, -0.5, 0],
    }));

    const addCube = useStore((state) => state.addCube);

    // We'll load textures later, for now just a color or placeholder
    // But to follow the plan, I should probably setup textures.
    // Let's just use a color for now to get it working, then add textures.

    return (
        <mesh
            ref={ref as any}
            onClick={(e) => {
                e.stopPropagation();
                const [x, y, z] = Object.values(e.point).map(val => Math.ceil(val));
                addCube(x, y, z);
            }}
        >
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color="green" />
        </mesh>
    );
};
