import { useRef } from 'react';

// Umbral para considerar que el joystick se ha movido
const DEADZONE = 0.2;
const REPEAT_DELAY = 150; // ms entre acciones mantenidas

export interface GamepadState {
    dpadUp: boolean;
    dpadDown: boolean;
    dpadLeft: boolean;
    dpadRight: boolean;
    buttonA: boolean; // Interact / Confirm
    buttonB: boolean; // Cancel / Back
    buttonX: boolean; // Attack / Ability 1
    buttonY: boolean; // Inventory / Ability 2
    start: boolean;   // Menu
    select: boolean;  // Map / Skills
    l1: boolean;      // Next Target / Prev Tab
    r1: boolean;      // Prev Target / Next Tab
}

const DEFAULT_STATE: GamepadState = {
    dpadUp: false, dpadDown: false, dpadLeft: false, dpadRight: false,
    buttonA: false, buttonB: false, buttonX: false, buttonY: false,
    start: false, select: false, l1: false, r1: false
};

export function useGamepadControls() {
    const currentState = useRef<GamepadState>({ ...DEFAULT_STATE });

    // Para evitar "rebotes" o repeticiones muy rápidas en menús
    const lastButtonPress = useRef<Record<string, number>>({});

    const pollGamepad = () => {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gamepad = gamepads[0]; // Usamos el primer mando conectado

        if (!gamepad) {
            return null;
        }

        const newState: GamepadState = { ...DEFAULT_STATE };
        const buttons = gamepad.buttons;
        const axes = gamepad.axes;

        // --- AXES (Joysticks) ---
        // Axis 0: Left Stick X (-1 Left, 1 Right)
        // Axis 1: Left Stick Y (-1 Up, 1 Down)

        if (axes[1] < -DEADZONE) newState.dpadUp = true;
        if (axes[1] > DEADZONE) newState.dpadDown = true;
        if (axes[0] < -DEADZONE) newState.dpadLeft = true;
        if (axes[0] > DEADZONE) newState.dpadRight = true;

        // --- DPAD (Depende del mando, a veces son Axes, a veces Buttons 12-15) ---
        // Standard mapping: 12=Up, 13=Down, 14=Left, 15=Right
        if (buttons[12]?.pressed) newState.dpadUp = true;
        if (buttons[13]?.pressed) newState.dpadDown = true;
        if (buttons[14]?.pressed) newState.dpadLeft = true;
        if (buttons[15]?.pressed) newState.dpadRight = true;

        // --- BUTTONS ---
        // 0=A, 1=B, 2=X, 3=Y
        if (buttons[0]?.pressed) newState.buttonA = true;
        if (buttons[1]?.pressed) newState.buttonB = true;
        if (buttons[2]?.pressed) newState.buttonX = true;
        if (buttons[3]?.pressed) newState.buttonY = true;

        // 9=Start, 8=Select
        if (buttons[9]?.pressed) newState.start = true;
        if (buttons[8]?.pressed) newState.select = true;

        // 4=L1, 5=R1
        if (buttons[4]?.pressed) newState.l1 = true;
        if (buttons[5]?.pressed) newState.r1 = true;

        if (newState.dpadUp || newState.dpadDown || newState.dpadLeft || newState.dpadRight ||
            newState.buttonA || newState.buttonB || newState.buttonX || newState.buttonY ||
            newState.start || newState.select || newState.l1 || newState.r1 ||
            Math.abs(axes[0]) > DEADZONE || Math.abs(axes[1]) > DEADZONE
        ) {
            // Dispatch custom event for UI prompts
            window.dispatchEvent(new Event('gamepad-interaction'));
        }

        currentState.current = newState;
        return newState;
    };

    // Helper para verificar si un botón "acaba de ser presionado" (para menús)
    // Retorna true solo la primera vez o cada X ms si se mantiene
    const isPressing = (key: keyof GamepadState): boolean => {
        if (!currentState.current[key]) {
            lastButtonPress.current[key] = 0;
            return false;
        }

        const now = Date.now();
        const lastTime = lastButtonPress.current[key] || 0;

        if (now - lastTime > REPEAT_DELAY) {
            lastButtonPress.current[key] = now;
            return true;
        }

        return false;
    };

    // Para movimiento (no necesita debounce estricto, pero sí control en el game loop)
    const getMovement = () => {
        let dx = 0;
        let dy = 0;
        if (currentState.current.dpadUp) dy -= 1;
        if (currentState.current.dpadDown) dy += 1;
        if (currentState.current.dpadLeft) dx -= 1;
        if (currentState.current.dpadRight) dx += 1;

        // Also add Left Stick here? Actually Game logic uses keyboard style input mostly.
        const axes = navigator.getGamepads ? navigator.getGamepads()[0]?.axes : null;
        if (axes) {
            if (Math.abs(axes[0]) > DEADZONE) dx += axes[0];
            if (Math.abs(axes[1]) > DEADZONE) dy += axes[1];
        }

        return { dx, dy };
    };

    const getRightStick = () => {
        const gamepad = navigator.getGamepads ? navigator.getGamepads()[0] : null;
        if (!gamepad) return { x: 0, y: 0 };
        const x = gamepad.axes[2] || 0;
        const y = gamepad.axes[3] || 0;
        return {
            x: Math.abs(x) > DEADZONE ? x : 0,
            y: Math.abs(y) > DEADZONE ? y : 0
        };
    };

    return {
        pollGamepad,
        isPressing,
        getMovement,
        getRightStick,
        getCurrentState: () => currentState.current
    };
}
