export enum InputIntent {
    // Movement
    MOVE_UP = 'MOVE_UP',
    MOVE_DOWN = 'MOVE_DOWN',
    MOVE_LEFT = 'MOVE_LEFT',
    MOVE_RIGHT = 'MOVE_RIGHT',
    MOVE_UP_LEFT = 'MOVE_UP_LEFT',
    MOVE_UP_RIGHT = 'MOVE_UP_RIGHT',
    MOVE_DOWN_LEFT = 'MOVE_DOWN_LEFT',
    MOVE_DOWN_RIGHT = 'MOVE_DOWN_RIGHT',

    // Actions
    INTERACT = 'INTERACT', // Generic interact (Talk, Chest)
    DESCEND = 'DESCEND',   // Stairs
    ATTACK = 'ATTACK',     // Use selected skill/attack

    // Quick Slots
    QUICK_SLOT_1 = 'QUICK_SLOT_1',
    QUICK_SLOT_2 = 'QUICK_SLOT_2',
    QUICK_SLOT_3 = 'QUICK_SLOT_3',

    // UI Toggles
    TOGGLE_INVENTORY = 'TOGGLE_INVENTORY',
    TOGGLE_SKILLS = 'TOGGLE_SKILLS',
    TOGGLE_PAUSE = 'TOGGLE_PAUSE',
    CLOSE_UI = 'CLOSE_UI', // Escape/Back generic

    // UI Navigation (future proofing)
    CONFIRM = 'CONFIRM',
    CANCEL = 'CANCEL',

    // Debug / Misc
    SAVE_GAME = 'SAVE_GAME'
}

export interface InputState {
    activeIntents: Set<InputIntent>;
    cursor: { x: number, y: number }; // For mouse aiming if needed
}
