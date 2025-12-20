import { useEffect, useRef } from 'react';

export function useKeyboardControls(onKeyDown?: (e: KeyboardEvent) => void) {
    const pressedKeys = useRef(new Set<string>());
    const onKeyDownRef = useRef(onKeyDown);

    useEffect(() => {
        onKeyDownRef.current = onKeyDown;
    }, [onKeyDown]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            pressedKeys.current.add(e.key.toLowerCase());
            if (onKeyDownRef.current) {
                onKeyDownRef.current(e);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            pressedKeys.current.delete(e.key.toLowerCase());
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    return { pressedKeys };
}
