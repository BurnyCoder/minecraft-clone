import { useEffect, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { useKeyboard } from '../hooks/useKeyboard';
import { images } from '../images/textures';

export const TextureSelector = () => {
    const [visible, setVisible] = useState(false);
    const activeTexture = useStore((state) => state.texture);
    const setTexture = useStore((state) => state.setTexture);
    const { dirt, grass, glass, wood, log } = useKeyboard();

    useEffect(() => {
        const textures = { dirt, grass, glass, wood, log };
        const pressedTexture = Object.entries(textures).find(([, v]) => v);
        if (pressedTexture) {
            setTexture(pressedTexture[0]);
        }
    }, [setTexture, dirt, grass, glass, wood, log]);

    useEffect(() => {
        const visibilityTimeout = setTimeout(() => {
            setVisible(false);
        }, 2000);
        setVisible(true);
        return () => {
            clearTimeout(visibilityTimeout);
        };
    }, [activeTexture]);

    return visible ? (
        <div className='absolute centered texture-selector'>
            {Object.entries(images).map(([k, src]) => {
                return (
                    <div key={k} className={`${k === activeTexture ? 'active' : ''} texture-img`}>
                        <img src={src.image.src} alt={k} className="texture-icon" />
                    </div>
                );
            })}
        </div>
    ) : null;
};
