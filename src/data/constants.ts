export const MAP_WIDTH = 80;
export const MAP_HEIGHT = 60;

export const TILE = {
    WALL: 0,
    FLOOR: 1,
    STAIRS: 2,
    DOOR: 3,
    STAIRS_UP: 4,
    DOOR_OPEN: 5,
    FLOOR_GRASS: 6,
    FLOOR_DIRT: 7,
} as const;

export const ENTITY = {
    NONE: 0,
    PLAYER: 1,
    // Enemigos básicos
    ENEMY_RAT: 2,
    ENEMY_BAT: 3,
    ENEMY_GOBLIN: 4,
    ENEMY_SKELETON: 5,
    ENEMY_ORC: 6,
    ENEMY_SPIDER: 7,
    ENEMY_ZOMBIE: 8,
    ENEMY_TROLL: 9,
    ENEMY_WRAITH: 10,
    ENEMY_DEMON: 11,
    ENEMY_DRAGON: 12,
    // Nuevos enemigos
    ENEMY_SLIME: 13,
    ENEMY_WOLF: 14,
    ENEMY_CULTIST: 15,
    ENEMY_GOLEM: 16,
    ENEMY_VAMPIRE: 17,
    ENEMY_MIMIC: 18,
    ENEMY_MAGE: 19, // New
    // Jefes (Bosses)
    BOSS_GOBLIN_KING: 100,
    BOSS_SKELETON_LORD: 101,
    BOSS_ORC_WARLORD: 102,
    BOSS_SPIDER_QUEEN: 103,
    BOSS_LICH: 104,
    BOSS_DEMON_LORD: 105,
    BOSS_ANCIENT_DRAGON: 106,
    // Jefes Nuevos
    BOSS_VAMPIRE_LORD: 107,
    BOSS_GOLEM_KING: 108,
    // Home Base Entities
    TREE: 200,
    ROCK: 201,
    WORKBENCH: 202,
    DUNGEON_GATE: 203,
    PLANT: 204,
    DUNGEON_GATE_TRIGGER: 205,
    CRATE: 206,
    BARREL: 207,
    SPIKES: 208,
    BLOCKER: 299,
} as const;

// Tipos de NPC (traído de NPCSystem.jsx)
export const NPC_TYPES = {
    MERCHANT: "merchant",
    QUEST_GIVER: "quest_giver",
    SAGE: "sage",
    BLACKSMITH: "blacksmith", // NUEVO TIPO
} as const;

export const SIZE = 96;
export const TILE_WIDTH = 96;
export const TILE_HEIGHT = 48; // Standard 2:1 isometric ratio

