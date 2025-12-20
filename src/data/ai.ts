export const AI_CONFIG = {
    ACTIVATION_DISTANCE: 25, // Enemies beyond this range sleep
    PATHFINDING_LIMIT: 12,   // Pathfinding uses simple movement beyond this range
    BOSS_ACTIVATION_DISTANCE: 40,
    FLANKING_RANGE: 8,       // Distance to check for allies in pack behavior
    AMBUSH_RANGE: 4,
} as const;

export const AI_BEHAVIORS = {
    AGGRESSIVE: 'aggressive',
    CAUTIOUS: 'cautious',
    PACK: 'pack',
    AMBUSH: 'ambush',
    BOSS: 'boss',
} as const;

export type AIBehavior = typeof AI_BEHAVIORS[keyof typeof AI_BEHAVIORS];
