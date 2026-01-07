import { useState, useEffect } from 'react';

export type InputMethod = 'keyboard' | 'gamepad';

export function useInputMethod() {
    const [inputMethod, setInputMethod] = useState<InputMethod>('keyboard');

    useEffect(() => {
        const handleKeyDown = () => setInputMethod('keyboard');
        const handleMouseDown = () => setInputMethod('keyboard');
        const handleGamepadInput = () => setInputMethod('gamepad');

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('mousedown', handleMouseDown);

        // Polling for gamepad activity or using the newer 'gamepadconnected' event isn't enough for *activity*.
        // We often just rely on the Gamepad API polling in the main loop, but here we want a global listener.
        // A simple way is to listen for "gamepadconnected" to switch to gamepad initially, 
        // but to detect active usage we might need to hook into the existing input system 
        // OR just rely on the fact that if you touch the keyboard it switches back.
        // For now, let's expose a method to manually set it from useInputHandler if needed, 
        // or just rely on 'keydown' to switch TO keyboard, and maybe assume gamepad if a gamepad button is pressed?
        // Standard DOM 'gamepadconnected' doesn't fire on button press.
        // We'll dispatch a custom event from useGamepadControls if we want to be fancy, 
        // OR we can just listen to 'gamepadconnected' as a hint.

        window.addEventListener('gamepadconnected', handleGamepadInput);

        // Custom event approach: If useGamepadControls detects input, it could dispatch 'gamepad-active'
        const handleCustomGamepad = () => setInputMethod('gamepad');
        window.addEventListener('gamepad-interaction', handleCustomGamepad);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('gamepadconnected', handleGamepadInput);
            window.removeEventListener('gamepad-interaction', handleCustomGamepad);
        };
    }, []);

    return inputMethod;
}
