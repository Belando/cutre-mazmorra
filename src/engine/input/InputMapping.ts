import { InputIntent } from './InputTypes';

// Default Keyboard Bindings
export const KEYBOARD_MAP: Record<string, InputIntent> = {
    'w': InputIntent.MOVE_UP,
    'arrowup': InputIntent.MOVE_UP,
    's': InputIntent.MOVE_DOWN,
    'arrowdown': InputIntent.MOVE_DOWN,
    'a': InputIntent.MOVE_LEFT,
    'arrowleft': InputIntent.MOVE_LEFT,
    'd': InputIntent.MOVE_RIGHT,
    'arrowright': InputIntent.MOVE_RIGHT,

    'home': InputIntent.MOVE_UP_LEFT,
    'pageup': InputIntent.MOVE_UP_RIGHT,
    'end': InputIntent.MOVE_DOWN_LEFT,
    'pagedown': InputIntent.MOVE_DOWN_RIGHT,

    'e': InputIntent.INTERACT,
    'enter': InputIntent.TOGGLE_CHAT,
    ' ': InputIntent.ATTACK,

    'q': InputIntent.QUICK_SLOT_1,
    // 'e' is used for interact, so we might need to resolve conflict or change quick slot 2 default
    // For now keeping 'e' as INTERACT priority in handler, but mapping here too
    'r': InputIntent.QUICK_SLOT_3,

    'i': InputIntent.TOGGLE_INVENTORY,
    't': InputIntent.TOGGLE_SKILLS,
    'escape': InputIntent.CLOSE_UI,

    'g': InputIntent.SAVE_GAME
};

// Default Gamepad Bindings (Abstracted names from useGamepadControls)
export const GAMEPAD_MAP: Record<string, InputIntent> = {
    'dpadUp': InputIntent.MOVE_UP,
    'dpadDown': InputIntent.MOVE_DOWN,
    'dpadLeft': InputIntent.MOVE_LEFT,
    'dpadRight': InputIntent.MOVE_RIGHT,

    'buttonA': InputIntent.INTERACT, // Or Confirm/Descend context
    'buttonB': InputIntent.CLOSE_UI,
    'buttonX': InputIntent.ATTACK,
    'buttonY': InputIntent.TOGGLE_INVENTORY,

    'start': InputIntent.TOGGLE_PAUSE,
    'select': InputIntent.TOGGLE_SKILLS,
};

export function resolveIntents(
    pressedKeys: Set<string>,
    gamepadState: any
): Set<InputIntent> {
    const intents = new Set<InputIntent>();

    // 1. Resolve Keyboard
    pressedKeys.forEach(key => {
        const intent = KEYBOARD_MAP[key.toLowerCase()];
        if (intent) intents.add(intent);

        // Handle numeric Quick Slots specially if needed or satisfy with generic map
        if (key === '1') intents.add(InputIntent.QUICK_SLOT_1); // Fallback logic example
    });

    // 2. Resolve Gamepad
    if (gamepadState) {
        Object.entries(gamepadState).forEach(([btn, pressed]) => {
            if (pressed) {
                const intent = GAMEPAD_MAP[btn];
                if (intent) intents.add(intent);
            }
        });

        // Analog Stick to D-Pad Intents conversion could go here
        // But useGamepadControls already handles stick->dx/dy. 
        // We might want to keep that helper or move it here. 
        // For now, let's trust the 'stick' movement is separate or map it to intents.
    }

    return intents;
}
