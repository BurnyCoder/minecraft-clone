import { useState, useEffect } from 'react';

function actionByKey(key: string) {
    const keyActionMap: { [key: string]: string } = {
        KeyW: 'moveForward',
        KeyS: 'moveBackward',
        KeyA: 'moveLeft',
        KeyD: 'moveRight',
        Space: 'jump',
        Digit1: 'dirt',
        Digit2: 'grass',
        Digit3: 'glass',
        Digit4: 'wood',
        Digit5: 'log',
    };
    return keyActionMap[key];
}

export const useKeyboard = () => {
    const [actions, setActions] = useState({
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
        jump: false,
        dirt: false,
        grass: false,
        glass: false,
        wood: false,
        log: false,
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const action = actionByKey(e.code);
            if (action) {
                setActions((prev) => {
                    if (prev[action as keyof typeof prev]) return prev;
                    return { ...prev, [action]: true };
                });
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const action = actionByKey(e.code);
            if (action) {
                setActions((prev) => {
                    if (!prev[action as keyof typeof prev]) return prev;
                    return { ...prev, [action]: false };
                });
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    return actions;
};
