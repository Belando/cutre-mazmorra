export interface SpriteConfig {
    zOffset: number;
    scale?: number;
    anchorY?: number; // Optional visual offset
    type?: string;
    hasShadow?: boolean;
}

export const SPRITE_CONFIG: Record<string, SpriteConfig> = {
    // Entities
    'dungeon_gate': { zOffset: 2.0 },
    'tree': { zOffset: 1.5 },
    'rock': { zOffset: 1.5 },
    'plant': { zOffset: 1.5 },
    'crate': { zOffset: 1.5 },
    'barrel': { zOffset: 1.5 },
    'spikes': { zOffset: 0.1 },

    // Dynamic
    'torch': { zOffset: 1.6 },
    'chest': { zOffset: 0.5 },
    'corpse': { zOffset: 0.1 },
    'item': { zOffset: 1.0 },
    'enemy': { zOffset: 2.0 },
    'npc': { zOffset: 2.0 }, // Same as enemy/standard entity
    'player': { zOffset: 3.0 }, // Always on top of floor inhabitants
    'wall': { zOffset: 1.5 }, // Walls slightly above floor level logic
};

export const getSpriteConfig = (type: string): SpriteConfig => {
    return SPRITE_CONFIG[type] || { zOffset: 1.0 };
};
