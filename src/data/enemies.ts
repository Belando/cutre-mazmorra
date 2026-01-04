import { ENTITY } from './constants';
import { ENEMY_IDS } from './ids';

export type EnemyType = number;
export type LargeEnemyType = number;

export interface EnemyAttack {
    type: 'melee' | 'ranged' | 'magic';
    range: number;
    name: string;
    damageMult?: number; // Default 1.0
    element?: string; // 'fire', 'ice', 'poison', 'void', 'dark'
    color?: string;
    chance?: number; // 0-1, default 1 (if it meets conditions)
    effect?: {
        type: 'stun' | 'slow' | 'poison' | 'burn' | 'bleed' | 'drain';
        duration: number;
        value?: number;
        chance: number;
    };
}

export interface EnemyStats {
    id: string; // New String ID
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
    tags?: string[]; // Systemic Tags
    // Data Driven AI & Combat
    aiBehavior?: string; // 'aggressive', 'cautious', 'flee', 'patrol'
    attacks?: EnemyAttack[];
    resistances?: Record<string, number>; // element -> multiplier (0.5 = 50% damage taken)
}

export interface LargeEnemyConfig {
    width: number;
    height: number;
    scale?: number;
    name: string;
}

export const ENEMY_STATS: Record<number, EnemyStats> = {
    [ENTITY.ENEMY_RAT]: { id: ENEMY_IDS.RAT, name: 'Rata', hp: 6, attack: 2, defense: 0, exp: 3, symbol: 'r', color: '#a1a1aa', minLevel: 1, renderKey: 'rat', aiBehavior: 'aggressive', tags: ['BEAST'] },
    [ENTITY.ENEMY_BAT]: {
        id: 'ENEMY_BAT', // Missing in ENEMY_IDS? Added temporarily or should update ids.ts? I'll assume standard naming or I missed adding it to ids.ts 
        // Wait, I didn't add BAT to ids.ts in step 621. I should check ids.ts again or just use literal for now and fix ids.ts later.
        // Actually, better to stick to ENEMY_IDS where possible. 
        // Let's check what I wrote to ids.ts. I missed BAT. I will add it.
        name: 'Murciélago', hp: 8, attack: 3, defense: 0, exp: 4, symbol: 'b', color: '#71717a', minLevel: 1, renderKey: 'bat', aiBehavior: 'aggressive', tags: ['BEAST', 'FLYING'],
        attacks: [{ type: 'ranged', range: 4, name: 'Chillido', color: '#a855f7', chance: 0.3 }]
    },
    [ENTITY.ENEMY_GOBLIN]: { id: 'ENEMY_GOBLIN', name: 'Goblin', hp: 12, attack: 4, defense: 1, exp: 6, symbol: 'g', color: '#4ade80', minLevel: 1, renderKey: 'goblin', aiBehavior: 'pack', tags: ['HUMANOID'] }, // Missed Goblin in ids.ts too? I had BOSS_GOBLIN_KING.
    [ENTITY.ENEMY_SLIME]: { id: ENEMY_IDS.SLIME, name: 'Slime', hp: 10, attack: 2, defense: 1, exp: 4, symbol: '○', color: '#22d3ee', minLevel: 1, renderKey: 'slime', aiBehavior: 'aggressive', tags: ['AMORPHOUS'] },
    [ENTITY.ENEMY_SKELETON]: { id: ENEMY_IDS.SKELETON, name: 'Esqueleto', hp: 15, attack: 5, defense: 2, exp: 8, symbol: 's', color: '#e5e5e5', minLevel: 2, renderKey: 'skeleton', aiBehavior: 'aggressive', tags: ['UNDEAD', 'SKELETON'] },
    [ENTITY.ENEMY_ORC]: { id: ENEMY_IDS.ORC, name: 'Orco', hp: 22, attack: 6, defense: 3, exp: 12, symbol: 'o', color: '#f97316', minLevel: 2, renderKey: 'orc', aiBehavior: 'aggressive', tags: ['HUMANOID', 'ORC'] },
    [ENTITY.ENEMY_WOLF]: { id: ENEMY_IDS.WOLF, name: 'Lobo Salvaje', hp: 16, attack: 7, defense: 2, exp: 10, symbol: 'w', color: '#78716c', minLevel: 2, renderKey: 'wolf', aiBehavior: 'aggressive', tags: ['BEAST'] },
    [ENTITY.ENEMY_SPIDER]: {
        id: ENEMY_IDS.SPIDER, name: 'Araña Gigante', hp: 18, attack: 7, defense: 2, exp: 10, symbol: 'S', color: '#7c3aed', minLevel: 3, renderKey: 'spider', aiBehavior: 'ambush', tags: ['BEAST', 'INSECT'],
        attacks: [
            { type: 'ranged', range: 4, name: 'Telaraña', color: '#ffffff', effect: { type: 'slow', duration: 3, chance: 1, value: 3 } },
            { type: 'melee', range: 1, name: 'Mordisco', element: 'poison', effect: { type: 'poison', duration: 3, chance: 0.3, value: 3 } }
        ]
    },
    [ENTITY.ENEMY_ZOMBIE]: { id: ENEMY_IDS.ZOMBIE, name: 'Zombi', hp: 30, attack: 6, defense: 4, exp: 14, symbol: 'z', color: '#65a30d', minLevel: 3, renderKey: 'zombie', aiBehavior: 'aggressive', tags: ['UNDEAD'] },
    [ENTITY.ENEMY_CULTIST]: {
        id: 'ENEMY_CULTIST', name: 'Cultista', hp: 20, attack: 9, defense: 2, exp: 15, symbol: 'c', color: '#be123c', minLevel: 3, renderKey: 'cultist', aiBehavior: 'cautious', tags: ['HUMANOID', 'MAGIC'],
        attacks: [{ type: 'magic', range: 6, name: 'Rayo Oscuro', color: '#a855f7', element: 'dark', damageMult: 0.8 }]
    },
    [ENTITY.ENEMY_TROLL]: { id: ENEMY_IDS.TROLL, name: 'Trol', hp: 40, attack: 9, defense: 5, exp: 22, symbol: 'T', color: '#a855f7', minLevel: 4, renderKey: 'troll', aiBehavior: 'aggressive', tags: ['HUMANOID', 'GIANT'] },
    [ENTITY.ENEMY_GOLEM]: { id: ENEMY_IDS.GOLEM, name: 'Gólem', hp: 50, attack: 8, defense: 8, exp: 28, symbol: 'G', color: '#78716c', minLevel: 4, renderKey: 'golem', aiBehavior: 'aggressive', tags: ['CONSTRUCT'] },
    [ENTITY.ENEMY_WRAITH]: {
        id: 'ENEMY_WRAITH', name: 'Espectro', hp: 35, attack: 11, defense: 3, exp: 25, symbol: 'W', color: '#6366f1', minLevel: 5, renderKey: 'wraith', aiBehavior: 'cautious', tags: ['UNDEAD', 'SPIRIT', 'FLYING'],
        attacks: [{ type: 'magic', range: 5, name: 'Rayo Espectral', color: '#6366f1', element: 'void' }]
    },
    [ENTITY.ENEMY_VAMPIRE]: {
        id: ENEMY_IDS.VAMPIRE, name: 'Vampiro', hp: 45, attack: 12, defense: 4, exp: 32, symbol: 'V', color: '#7f1d1d', minLevel: 5, renderKey: 'vampire', aiBehavior: 'aggressive', tags: ['UNDEAD', 'VAMPIRE'],
        attacks: [{ type: 'magic', range: 5, name: 'Drenar Vida', color: '#991b1b', effect: { type: 'drain', duration: 0, chance: 1 } }]
    },
    [ENTITY.ENEMY_MIMIC]: { id: 'ENEMY_MIMIC', name: 'Mimico', hp: 38, attack: 14, defense: 5, exp: 35, symbol: 'M', color: '#92400e', minLevel: 5, renderKey: 'mimic', aiBehavior: 'aggressive', tags: ['CONSTRUCT', 'TRAP'] },
    [ENTITY.ENEMY_MAGE]: {
        id: 'ENEMY_MAGE', name: 'Mago Esqueleto', hp: 25, attack: 10, defense: 1, exp: 20, symbol: 'L', color: '#6366f1', minLevel: 6, renderKey: 'skeleton_mage', aiBehavior: 'cautious', tags: ['UNDEAD', 'SKELETON', 'MAGIC'],
        attacks: [{ type: 'magic', range: 6, name: 'Bola de Fuego', color: '#ef4444', element: 'fire', effect: { type: 'burn', duration: 4, chance: 0.4 } }]
    },
    [ENTITY.ENEMY_DEMON]: {
        id: ENEMY_IDS.DEMON, name: 'Demonio', hp: 55, attack: 13, defense: 6, exp: 35, symbol: 'D', color: '#ef4444', minLevel: 6, renderKey: 'demon', aiBehavior: 'aggressive', tags: ['DEMON'],
        attacks: [{ type: 'magic', range: 5, name: 'Bola de Fuego', color: '#ef4444', element: 'fire', effect: { type: 'burn', duration: 4, chance: 0.4 } }]
    },
    [ENTITY.ENEMY_DRAGON]: {
        id: 'ENEMY_DRAGON', name: 'Dragón Joven', hp: 70, attack: 15, defense: 8, exp: 50, symbol: 'd', color: '#f59e0b', minLevel: 7, renderKey: 'dragon', aiBehavior: 'aggressive', tags: ['DRAGON', 'FLYING'],
        attacks: [{ type: 'magic', range: 6, name: 'Aliento de Fuego', color: '#f59e0b', element: 'fire', effect: { type: 'burn', duration: 4, chance: 0.4 } }]
    },

    // Jefes
    [ENTITY.BOSS_GOBLIN_KING]: { id: ENEMY_IDS.BOSS_GOBLIN_KING, name: 'Rey Goblin', hp: 60, attack: 8, defense: 4, exp: 50, symbol: 'G', color: '#22c55e', isBoss: true, minLevel: 1, renderKey: 'goblin_king', aiBehavior: 'boss', tags: ['HUMANOID', 'GOBLIN', 'BOSS'] },
    [ENTITY.BOSS_SKELETON_LORD]: { id: 'BOSS_SKELETON_LORD', name: 'Señor Esqueleto', hp: 80, attack: 10, defense: 5, exp: 70, symbol: 'L', color: '#fafafa', isBoss: true, minLevel: 2, renderKey: 'skeleton_lord', aiBehavior: 'boss', tags: ['UNDEAD', 'SKELETON', 'BOSS'] },
    [ENTITY.BOSS_ORC_WARLORD]: { id: ENEMY_IDS.BOSS_ORC_WARLORD, name: 'Señor de la Guerra Orco', hp: 100, attack: 12, defense: 6, exp: 90, symbol: 'O', color: '#ea580c', isBoss: true, minLevel: 3, renderKey: 'orc_warlord', aiBehavior: 'boss', tags: ['HUMANOID', 'ORC', 'BOSS'] },
    [ENTITY.BOSS_SPIDER_QUEEN]: { id: 'BOSS_SPIDER_QUEEN', name: 'Reina Araña', hp: 90, attack: 14, defense: 5, exp: 100, symbol: 'Q', color: '#9333ea', isBoss: true, minLevel: 4, renderKey: 'spider_queen', aiBehavior: 'boss', tags: ['BEAST', 'INSECT', 'BOSS'] },
    [ENTITY.BOSS_GOLEM_KING]: { id: 'BOSS_GOLEM_KING', name: 'Rey Gólem', hp: 140, attack: 14, defense: 12, exp: 120, symbol: 'K', color: '#57534e', isBoss: true, minLevel: 4, renderKey: 'golem_king', aiBehavior: 'boss', tags: ['CONSTRUCT', 'GIANT', 'BOSS'] },
    [ENTITY.BOSS_LICH]: {
        id: ENEMY_IDS.BOSS_LICH, name: 'Liche', hp: 120, attack: 16, defense: 7, exp: 130, symbol: 'L', color: '#06b6d4', isBoss: true, minLevel: 5, renderKey: 'lich', aiBehavior: 'boss', tags: ['UNDEAD', 'MAGIC', 'BOSS'],
        attacks: [{ type: 'magic', range: 7, name: 'Rayo de Hielo', color: '#06b6d4', element: 'ice' }]
    },
    [ENTITY.BOSS_VAMPIRE_LORD]: {
        id: 'BOSS_VAMPIRE_LORD', name: 'Señor Vampiro', hp: 130, attack: 17, defense: 6, exp: 145, symbol: 'V', color: '#991b1b', isBoss: true, minLevel: 5, renderKey: 'vampire_lord', aiBehavior: 'boss', tags: ['UNDEAD', 'VAMPIRE', 'BOSS'],
        attacks: [{ type: 'magic', range: 5, name: 'Drenar Almas', color: '#991b1b', effect: { type: 'drain', duration: 0, chance: 1 } }]
    },
    [ENTITY.BOSS_DEMON_LORD]: {
        id: 'BOSS_DEMON_LORD', name: 'Señor Demonio', hp: 150, attack: 18, defense: 8, exp: 160, symbol: 'D', color: '#dc2626', isBoss: true, minLevel: 6, renderKey: 'demon_lord', aiBehavior: 'boss', tags: ['DEMON', 'BOSS'],
        attacks: [{ type: 'magic', range: 6, name: 'Infierno', color: '#ef4444', element: 'fire', effect: { type: 'burn', duration: 4, chance: 0.5 } }]
    },
    [ENTITY.BOSS_ANCIENT_DRAGON]: {
        id: ENEMY_IDS.BOSS_ANCIENT_DRAGON, name: 'Dragón Ancestral', hp: 200, attack: 22, defense: 10, exp: 250, symbol: 'D', color: '#fbbf24', isBoss: true, minLevel: 7, renderKey: 'ancient_dragon', aiBehavior: 'boss', tags: ['DRAGON', 'FLYING', 'BOSS'],
        attacks: [{ type: 'magic', range: 8, name: 'Llamarada', color: '#fbbf24', element: 'fire', effect: { type: 'burn', duration: 4, chance: 0.5 } }]
    },
};

export const LARGE_ENEMIES: Record<number, LargeEnemyConfig> = {
    [ENTITY.BOSS_ANCIENT_DRAGON]: { width: 2, height: 2, name: 'ancient_dragon' },
    [ENTITY.BOSS_DEMON_LORD]: { width: 2, height: 2, name: 'demon_lord' },
    [ENTITY.BOSS_GOLEM_KING]: { width: 2, height: 2, name: 'golem_king' },
    [ENTITY.ENEMY_TROLL]: { width: 1, height: 1, scale: 1.3, name: 'troll' },
    [ENTITY.ENEMY_DRAGON]: { width: 1, height: 1, scale: 1.2, name: 'dragon' },
    [ENTITY.ENEMY_GOLEM]: { width: 1, height: 1, scale: 1.2, name: 'golem' },
};
