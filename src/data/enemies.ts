import { ENTITY } from './constants';
import { ENEMY_IDS } from './ids';
import { EntityTag, DamageType } from '@/types';

export type EnemyType = number;
export type LargeEnemyType = number;

export interface EnemyAttack {
    type: 'melee' | 'ranged' | 'magic';
    range: number;
    name: string;
    damageMult?: number; // Default 1.0
    element?: DamageType | string; // Use enum but allow string fallback
    color?: string;
    chance?: number; // 0-1, default 1
    effect?: {
        type: 'stun' | 'slow' | 'poison' | 'burn' | 'bleed' | 'drain';
        duration: number;
        value?: number;
        chance: number;
    };
}

export interface EnemyStats {
    id: string;
    name: string;
    hp: number;
    attack: number;
    defense: number;
    exp: number;
    symbol: string;
    color: string;
    minLevel: number;
    renderKey: string;
    isBoss?: boolean;
    tags?: EntityTag[]; // Type safe tags
    aiBehavior?: string;
    attacks?: EnemyAttack[];
    resistances?: Record<string, number>;
}

export interface LargeEnemyConfig {
    width: number;
    height: number;
    scale?: number;
    name: string;
}

export const ENEMY_STATS: Record<number, EnemyStats> = {
    [ENTITY.ENEMY_RAT]: { id: ENEMY_IDS.RAT, name: 'Rata', hp: 6, attack: 2, defense: 0, exp: 3, symbol: 'r', color: '#a1a1aa', minLevel: 1, renderKey: 'rat', aiBehavior: 'aggressive', tags: [EntityTag.BEAST] },
    [ENTITY.ENEMY_BAT]: {
        id: ENEMY_IDS.BAT,
        name: 'Murciélago', hp: 8, attack: 3, defense: 0, exp: 4, symbol: 'b', color: '#71717a', minLevel: 1, renderKey: 'bat', aiBehavior: 'aggressive', tags: [EntityTag.BEAST, EntityTag.FLYING],
        attacks: [{ type: 'ranged', range: 4, name: 'Chillido', color: '#a855f7', chance: 0.3 }]
    },
    [ENTITY.ENEMY_GOBLIN]: { id: ENEMY_IDS.GOBLIN, name: 'Goblin', hp: 12, attack: 4, defense: 1, exp: 6, symbol: 'g', color: '#4ade80', minLevel: 1, renderKey: 'goblin', aiBehavior: 'pack', tags: [EntityTag.HUMANOID, EntityTag.GOBLIN] },
    [ENTITY.ENEMY_SLIME]: { id: ENEMY_IDS.SLIME, name: 'Slime', hp: 10, attack: 2, defense: 1, exp: 4, symbol: '○', color: '#22d3ee', minLevel: 1, renderKey: 'slime', aiBehavior: 'aggressive', tags: [EntityTag.AMORPHOUS] },
    [ENTITY.ENEMY_SKELETON]: { id: ENEMY_IDS.SKELETON, name: 'Esqueleto', hp: 15, attack: 5, defense: 2, exp: 8, symbol: 's', color: '#e5e5e5', minLevel: 2, renderKey: 'skeleton', aiBehavior: 'aggressive', tags: [EntityTag.UNDEAD, EntityTag.SKELETON] },
    [ENTITY.ENEMY_ORC]: { id: ENEMY_IDS.ORC, name: 'Orco', hp: 22, attack: 6, defense: 3, exp: 12, symbol: 'o', color: '#f97316', minLevel: 2, renderKey: 'orc', aiBehavior: 'aggressive', tags: [EntityTag.HUMANOID, EntityTag.ORC] },
    [ENTITY.ENEMY_WOLF]: { id: ENEMY_IDS.WOLF, name: 'Lobo Salvaje', hp: 16, attack: 7, defense: 2, exp: 10, symbol: 'w', color: '#78716c', minLevel: 2, renderKey: 'wolf', aiBehavior: 'aggressive', tags: [EntityTag.BEAST] },
    [ENTITY.ENEMY_SPIDER]: {
        id: ENEMY_IDS.SPIDER, name: 'Araña Gigante', hp: 18, attack: 7, defense: 2, exp: 10, symbol: 'S', color: '#7c3aed', minLevel: 3, renderKey: 'spider', aiBehavior: 'ambush', tags: [EntityTag.BEAST, EntityTag.INSECT],
        attacks: [
            { type: 'ranged', range: 4, name: 'Telaraña', color: '#ffffff', effect: { type: 'slow', duration: 3, chance: 1, value: 3 } },
            { type: 'melee', range: 1, name: 'Mordisco', element: DamageType.POISON, effect: { type: 'poison', duration: 3, chance: 0.3, value: 3 } }
        ]
    },
    [ENTITY.ENEMY_ZOMBIE]: { id: ENEMY_IDS.ZOMBIE, name: 'Zombi', hp: 30, attack: 6, defense: 4, exp: 14, symbol: 'z', color: '#65a30d', minLevel: 3, renderKey: 'zombie', aiBehavior: 'aggressive', tags: [EntityTag.UNDEAD] },
    [ENTITY.ENEMY_CULTIST]: {
        id: ENEMY_IDS.CULTIST, name: 'Cultista', hp: 20, attack: 9, defense: 2, exp: 15, symbol: 'c', color: '#be123c', minLevel: 3, renderKey: 'cultist', aiBehavior: 'cautious', tags: [EntityTag.HUMANOID, EntityTag.MAGIC],
        attacks: [{ type: 'magic', range: 6, name: 'Rayo Oscuro', color: '#a855f7', element: DamageType.DARK, damageMult: 0.8 }]
    },
    [ENTITY.ENEMY_TROLL]: { id: ENEMY_IDS.TROLL, name: 'Trol', hp: 40, attack: 9, defense: 5, exp: 22, symbol: 'T', color: '#a855f7', minLevel: 4, renderKey: 'troll', aiBehavior: 'aggressive', tags: [EntityTag.HUMANOID, EntityTag.GIANT] },
    [ENTITY.ENEMY_GOLEM]: { id: ENEMY_IDS.GOLEM, name: 'Gólem', hp: 50, attack: 8, defense: 8, exp: 28, symbol: 'G', color: '#78716c', minLevel: 4, renderKey: 'golem', aiBehavior: 'aggressive', tags: [EntityTag.CONSTRUCT] },
    [ENTITY.ENEMY_WRAITH]: {
        id: ENEMY_IDS.WRAITH, name: 'Espectro', hp: 35, attack: 11, defense: 3, exp: 25, symbol: 'W', color: '#6366f1', minLevel: 5, renderKey: 'wraith', aiBehavior: 'cautious', tags: [EntityTag.UNDEAD, EntityTag.SPIRIT, EntityTag.FLYING],
        attacks: [{ type: 'magic', range: 5, name: 'Rayo Espectral', color: '#6366f1', element: DamageType.VOID }]
    },
    [ENTITY.ENEMY_VAMPIRE]: {
        id: ENEMY_IDS.VAMPIRE, name: 'Vampiro', hp: 45, attack: 12, defense: 4, exp: 32, symbol: 'V', color: '#7f1d1d', minLevel: 5, renderKey: 'vampire', aiBehavior: 'aggressive', tags: [EntityTag.UNDEAD, EntityTag.VAMPIRE],
        attacks: [{ type: 'magic', range: 5, name: 'Drenar Vida', color: '#991b1b', effect: { type: 'drain', duration: 0, chance: 1 } }]
    },
    [ENTITY.ENEMY_MIMIC]: { id: ENEMY_IDS.MIMIC, name: 'Mimico', hp: 38, attack: 14, defense: 5, exp: 35, symbol: 'M', color: '#92400e', minLevel: 5, renderKey: 'mimic', aiBehavior: 'aggressive', tags: [EntityTag.CONSTRUCT, EntityTag.TRAP] },
    [ENTITY.ENEMY_MAGE]: {
        id: ENEMY_IDS.MAGE, name: 'Mago Esqueleto', hp: 25, attack: 10, defense: 1, exp: 20, symbol: 'L', color: '#6366f1', minLevel: 6, renderKey: 'skeleton_mage', aiBehavior: 'cautious', tags: [EntityTag.UNDEAD, EntityTag.SKELETON, EntityTag.MAGIC],
        attacks: [{ type: 'magic', range: 6, name: 'Bola de Fuego', color: '#ef4444', element: DamageType.FIRE, effect: { type: 'burn', duration: 4, chance: 0.4 } }]
    },
    [ENTITY.ENEMY_DEMON]: {
        id: ENEMY_IDS.DEMON, name: 'Demonio', hp: 55, attack: 13, defense: 6, exp: 35, symbol: 'D', color: '#ef4444', minLevel: 6, renderKey: 'demon', aiBehavior: 'aggressive', tags: [EntityTag.DEMON],
        attacks: [{ type: 'magic', range: 5, name: 'Bola de Fuego', color: '#ef4444', element: DamageType.FIRE, effect: { type: 'burn', duration: 4, chance: 0.4 } }]
    },
    [ENTITY.ENEMY_DRAGON]: {
        id: ENEMY_IDS.DRAGON, name: 'Dragón Joven', hp: 70, attack: 15, defense: 8, exp: 50, symbol: 'd', color: '#f59e0b', minLevel: 7, renderKey: 'dragon', aiBehavior: 'aggressive', tags: [EntityTag.DRAGON, EntityTag.FLYING],
        attacks: [{ type: 'magic', range: 6, name: 'Aliento de Fuego', color: '#f59e0b', element: DamageType.FIRE, effect: { type: 'burn', duration: 4, chance: 0.4 } }]
    },

    // Nuevas Variantes (New Content)
    [ENTITY.ENEMY_GHOST]: {
        id: ENEMY_IDS.GHOST, name: 'Fantasma', hp: 22, attack: 8, defense: 1, exp: 18, symbol: 'ø', color: '#e0f2fe', minLevel: 3, renderKey: 'wraith', aiBehavior: 'flee', tags: [EntityTag.UNDEAD, EntityTag.SPIRIT, EntityTag.FLYING],
        resistances: { [DamageType.PHYSICAL]: 0.5, [DamageType.POISON]: 0 }
    },
    [ENTITY.ENEMY_GIANT_RAT]: {
        id: ENEMY_IDS.GIANT_RAT, name: 'Rata Gigante', hp: 15, attack: 5, defense: 1, exp: 8, symbol: 'R', color: '#52525b', minLevel: 2, renderKey: 'rat', aiBehavior: 'aggressive', tags: [EntityTag.BEAST]
    },
    [ENTITY.ENEMY_VETERAN_ORC]: {
        id: ENEMY_IDS.VETERAN_ORC, name: 'Orco Veterano', hp: 45, attack: 10, defense: 5, exp: 25, symbol: 'O', color: '#c2410c', minLevel: 4, renderKey: 'orc', aiBehavior: 'aggressive', tags: [EntityTag.HUMANOID, EntityTag.ORC]
    },
    [ENTITY.ENEMY_ELITE_SKELETON]: {
        id: ENEMY_IDS.ELITE_SKELETON, name: 'Guardia Esqueleto', hp: 35, attack: 9, defense: 4, exp: 20, symbol: 'S', color: '#d4d4d8', minLevel: 3, renderKey: 'skeleton', aiBehavior: 'pack', tags: [EntityTag.UNDEAD, EntityTag.SKELETON]
    },

    // Jefes
    [ENTITY.BOSS_GOBLIN_KING]: { id: ENEMY_IDS.BOSS_GOBLIN_KING, name: 'Rey Goblin', hp: 60, attack: 8, defense: 4, exp: 50, symbol: 'G', color: '#22c55e', isBoss: true, minLevel: 1, renderKey: 'goblin_king', aiBehavior: 'boss', tags: [EntityTag.HUMANOID, EntityTag.GOBLIN, EntityTag.BOSS] },
    [ENTITY.BOSS_SKELETON_LORD]: { id: ENEMY_IDS.BOSS_SKELETON_LORD, name: 'Señor Esqueleto', hp: 80, attack: 10, defense: 5, exp: 70, symbol: 'L', color: '#fafafa', isBoss: true, minLevel: 2, renderKey: 'skeleton_lord', aiBehavior: 'boss', tags: [EntityTag.UNDEAD, EntityTag.SKELETON, EntityTag.BOSS] },
    [ENTITY.BOSS_ORC_WARLORD]: { id: ENEMY_IDS.BOSS_ORC_WARLORD, name: 'Señor de la Guerra Orco', hp: 100, attack: 12, defense: 6, exp: 90, symbol: 'O', color: '#ea580c', isBoss: true, minLevel: 3, renderKey: 'orc_warlord', aiBehavior: 'boss', tags: [EntityTag.HUMANOID, EntityTag.ORC, EntityTag.BOSS] },
    [ENTITY.BOSS_SPIDER_QUEEN]: { id: ENEMY_IDS.BOSS_SPIDER_QUEEN, name: 'Reina Araña', hp: 90, attack: 14, defense: 5, exp: 100, symbol: 'Q', color: '#9333ea', isBoss: true, minLevel: 4, renderKey: 'spider_queen', aiBehavior: 'boss', tags: [EntityTag.BEAST, EntityTag.INSECT, EntityTag.BOSS] },
    [ENTITY.BOSS_GOLEM_KING]: { id: ENEMY_IDS.BOSS_GOLEM_KING, name: 'Rey Gólem', hp: 140, attack: 14, defense: 12, exp: 120, symbol: 'K', color: '#57534e', isBoss: true, minLevel: 4, renderKey: 'golem_king', aiBehavior: 'boss', tags: [EntityTag.CONSTRUCT, EntityTag.GIANT, EntityTag.BOSS] },
    [ENTITY.BOSS_LICH]: {
        id: ENEMY_IDS.BOSS_LICH, name: 'Liche', hp: 120, attack: 16, defense: 7, exp: 130, symbol: 'L', color: '#06b6d4', isBoss: true, minLevel: 5, renderKey: 'lich', aiBehavior: 'boss', tags: [EntityTag.UNDEAD, EntityTag.MAGIC, EntityTag.BOSS],
        attacks: [{ type: 'magic', range: 7, name: 'Rayo de Hielo', color: '#06b6d4', element: DamageType.ICE }]
    },
    [ENTITY.BOSS_VAMPIRE_LORD]: {
        id: ENEMY_IDS.BOSS_VAMPIRE_LORD, name: 'Señor Vampiro', hp: 130, attack: 17, defense: 6, exp: 145, symbol: 'V', color: '#991b1b', isBoss: true, minLevel: 5, renderKey: 'vampire_lord', aiBehavior: 'boss', tags: [EntityTag.UNDEAD, EntityTag.VAMPIRE, EntityTag.BOSS],
        attacks: [{ type: 'magic', range: 5, name: 'Drenar Almas', color: '#991b1b', effect: { type: 'drain', duration: 0, chance: 1 } }]
    },
    [ENTITY.BOSS_DEMON_LORD]: {
        id: ENEMY_IDS.BOSS_DEMON_LORD, name: 'Señor Demonio', hp: 150, attack: 18, defense: 8, exp: 160, symbol: 'D', color: '#dc2626', isBoss: true, minLevel: 6, renderKey: 'demon_lord', aiBehavior: 'boss', tags: [EntityTag.DEMON, EntityTag.BOSS],
        attacks: [{ type: 'magic', range: 6, name: 'Infierno', color: '#ef4444', element: DamageType.FIRE, effect: { type: 'burn', duration: 4, chance: 0.5 } }]
    },
    [ENTITY.BOSS_ANCIENT_DRAGON]: {
        id: ENEMY_IDS.BOSS_ANCIENT_DRAGON, name: 'Dragón Ancestral', hp: 200, attack: 22, defense: 10, exp: 250, symbol: 'D', color: '#fbbf24', isBoss: true, minLevel: 7, renderKey: 'ancient_dragon', aiBehavior: 'boss', tags: [EntityTag.DRAGON, EntityTag.FLYING, EntityTag.BOSS],
        attacks: [{ type: 'magic', range: 8, name: 'Llamarada', color: '#fbbf24', element: DamageType.FIRE, effect: { type: 'burn', duration: 4, chance: 0.5 } }]
    },
};

export const LARGE_ENEMIES: Record<number, LargeEnemyConfig> = {
    [ENTITY.BOSS_ANCIENT_DRAGON]: { width: 2, height: 2, name: 'ancient_dragon' },
    [ENTITY.BOSS_DEMON_LORD]: { width: 2, height: 2, name: 'demon_lord' },
    [ENTITY.BOSS_GOLEM_KING]: { width: 2, height: 2, name: 'golem_king' },
    [ENTITY.ENEMY_TROLL]: { width: 1, height: 1, scale: 1.3, name: 'troll' },
    [ENTITY.ENEMY_DRAGON]: { width: 1, height: 1, scale: 1.2, name: 'dragon' },
    [ENTITY.ENEMY_GOLEM]: { width: 1, height: 1, scale: 1.2, name: 'golem' },
    [ENTITY.ENEMY_GIANT_RAT]: { width: 1, height: 1, scale: 1.3, name: 'rat' }, // Big rat
    [ENTITY.ENEMY_VETERAN_ORC]: { width: 1, height: 1, scale: 1.1, name: 'orc' }, // Slightly bigger
};
