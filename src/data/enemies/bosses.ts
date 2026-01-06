import { ENTITY } from '../constants';
import { ENEMY_IDS } from '../ids';
import { EntityTag, DamageType } from '@/types';
import { EnemyStats } from './types';

export const BOSS_STATS: Record<number, EnemyStats> = {
    [ENTITY.BOSS_GOBLIN_KING]: { id: ENEMY_IDS.BOSS_GOBLIN_KING, name: 'Rey Goblin', hp: 60, attack: 8, defense: 4, exp: 50, symbol: 'G', color: '#22c55e', isBoss: true, minLevel: 1, renderKey: 'goblin_king', aiBehavior: 'boss', tags: [EntityTag.HUMANOID, EntityTag.GOBLIN, EntityTag.BOSS] },
    [ENTITY.BOSS_SKELETON_LORD]: { id: ENEMY_IDS.BOSS_SKELETON_LORD, name: 'Señor Esqueleto', hp: 80, attack: 10, defense: 5, exp: 70, symbol: 'L', color: '#fafafa', isBoss: true, minLevel: 2, renderKey: 'skeleton_lord', aiBehavior: 'boss', tags: [EntityTag.UNDEAD, EntityTag.SKELETON, EntityTag.BOSS] },
    [ENTITY.BOSS_ORC_WARLORD]: { id: ENEMY_IDS.BOSS_ORC_WARLORD, name: 'Señor de la Guerra Orco', hp: 100, attack: 12, defense: 6, exp: 90, symbol: 'O', color: '#ea580c', isBoss: true, minLevel: 3, renderKey: 'orc_warlord', aiBehavior: 'boss', tags: [EntityTag.HUMANOID, EntityTag.ORC, EntityTag.BOSS] },
    [ENTITY.BOSS_SPIDER_QUEEN]: { id: ENEMY_IDS.BOSS_SPIDER_QUEEN, name: 'Reina Araña', hp: 90, attack: 14, defense: 5, exp: 100, symbol: 'Q', color: '#9333ea', isBoss: true, minLevel: 4, renderKey: 'spider_queen', aiBehavior: 'boss', tags: [EntityTag.BEAST, EntityTag.INSECT, EntityTag.BOSS] },
    [ENTITY.BOSS_GOLEM_KING]: { id: ENEMY_IDS.BOSS_GOLEM_KING, name: 'Rey Gólem', hp: 140, attack: 14, defense: 12, exp: 120, symbol: 'K', color: '#57534e', isBoss: true, minLevel: 4, renderKey: 'golem_king', aiBehavior: 'boss', tags: [EntityTag.CONSTRUCT, EntityTag.GIANT, EntityTag.BOSS] },
    [ENTITY.BOSS_LICH]: {

        id: 'lich_king',
        name: 'The Lich King',
        hp: 800,
        attack: 35,
        defense: 12,
        exp: 2000,
        symbol: 'L',
        color: '#9933ff',
        minLevel: 10,
        renderKey: 'lich',
        isBoss: true,
        tags: [EntityTag.UNDEAD, EntityTag.MAGIC, EntityTag.BOSS],
        damageType: DamageType.MAGICAL,
        aiBehavior: 'boss_caster',
        attacks: [
            { type: 'magic', range: 6, name: 'Death Coil', element: DamageType.DARK, damageMult: 1.5 },
            { type: 'magic', range: 8, name: 'Frost Nova', element: DamageType.ICE, damageMult: 1.2, effect: { type: 'slow', duration: 3, chance: 0.5 } }
        ],
        resistances: { 'physical': 0.5, 'dark': 1.0, 'poison': 1.0, 'ice': 0.8 }
    },
    [ENTITY.BOSS_VAMPIRE_LORD]: {
        id: ENEMY_IDS.BOSS_VAMPIRE_LORD, name: 'Señor Vampiro', hp: 130, attack: 17, defense: 6, exp: 145, symbol: 'V', color: '#991b1b', isBoss: true, minLevel: 5, renderKey: 'vampire_lord', aiBehavior: 'boss', tags: [EntityTag.UNDEAD, EntityTag.VAMPIRE, EntityTag.BOSS],
        attacks: [{ type: 'magic', range: 5, name: 'Drenar Almas', color: '#991b1b', effect: { type: 'drain', duration: 0, chance: 1 } }]
    },
    [ENTITY.BOSS_DEMON_LORD]: {

        id: 'demon_lord',
        name: 'Balor, Lord of Fire',
        hp: 1200,
        attack: 50,
        defense: 15,
        exp: 3000,
        symbol: 'B',
        color: '#ff3300',
        minLevel: 15,
        renderKey: 'demon_lord',
        isBoss: true,
        tags: [EntityTag.DEMON, EntityTag.FIRE, EntityTag.BOSS, EntityTag.GIANT],
        damageType: DamageType.MAGICAL,
        aiBehavior: 'boss_aggressive',
        attacks: [
            { type: 'melee', range: 2, name: 'Flaming Whip', element: DamageType.FIRE, damageMult: 1.2 },
            { type: 'magic', range: 6, name: 'Hellfire', element: DamageType.FIRE, damageMult: 1.8, effect: { type: 'burn', duration: 3, chance: 0.8 } }
        ],
        resistances: { 'fire': 1.0, 'ice': -0.5, 'physical': 0.3 }
    },
    [ENTITY.BOSS_ANCIENT_DRAGON]: {
        id: ENEMY_IDS.BOSS_ANCIENT_DRAGON, name: 'Dragón Ancestral', hp: 200, attack: 22, defense: 10, exp: 250, symbol: 'D', color: '#fbbf24', isBoss: true, minLevel: 7, renderKey: 'ancient_dragon', aiBehavior: 'boss', tags: [EntityTag.DRAGON, EntityTag.FLYING, EntityTag.BOSS],
        attacks: [{ type: 'magic', range: 8, name: 'Llamarada', color: '#fbbf24', element: DamageType.FIRE, effect: { type: 'burn', duration: 4, chance: 0.5 } }]
    },
};
