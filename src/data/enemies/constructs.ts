import { ENTITY } from '../constants';
import { ENEMY_IDS } from '../ids';
import { EntityTag, DamageType } from '@/types';
import { EnemyStats } from './types';

export const CONSTRUCT_STATS: Record<number, EnemyStats> = {
    [ENTITY.ENEMY_SLIME]: { id: ENEMY_IDS.SLIME, name: 'Slime', hp: 10, attack: 2, defense: 1, exp: 4, symbol: '○', color: '#22d3ee', minLevel: 1, renderKey: 'slime', aiBehavior: 'aggressive', tags: [EntityTag.AMORPHOUS] },
    [ENTITY.ENEMY_GOLEM]: { id: ENEMY_IDS.GOLEM, name: 'Gólem', hp: 50, attack: 8, defense: 8, exp: 28, symbol: 'G', color: '#78716c', minLevel: 4, renderKey: 'golem', aiBehavior: 'aggressive', tags: [EntityTag.CONSTRUCT] },
    [ENTITY.ENEMY_MIMIC]: { id: ENEMY_IDS.MIMIC, name: 'Mimico', hp: 38, attack: 14, defense: 5, exp: 35, symbol: 'M', color: '#92400e', minLevel: 5, renderKey: 'mimic', aiBehavior: 'aggressive', tags: [EntityTag.CONSTRUCT, EntityTag.TRAP] },
};

export const DEMON_STATS: Record<number, EnemyStats> = {
    [ENTITY.ENEMY_DEMON]: {
        id: ENEMY_IDS.DEMON,
        name: 'Lesser Demon',
        hp: 120,
        attack: 25,
        defense: 8,
        exp: 60,
        symbol: 'D',
        color: '#ff0000',
        minLevel: 6,
        renderKey: 'demon', // Placeholder
        tags: [EntityTag.DEMON, EntityTag.FIRE],
        damageType: DamageType.MAGICAL,
        aiBehavior: 'aggressive',
        attacks: [
            { type: 'melee', range: 1, name: 'Claw', damageMult: 1.0 },
            { type: 'magic', range: 3, name: 'Fireball', element: DamageType.FIRE, damageMult: 1.2 }
        ],
        resistances: { 'fire': 1.0, 'poison': 0.5 }
    },
    [ENTITY.ENEMY_DRAGON]: {
        id: ENEMY_IDS.DRAGON, name: 'Dragón Joven', hp: 70, attack: 15, defense: 8, exp: 50, symbol: 'd', color: '#f59e0b', minLevel: 7, renderKey: 'dragon', aiBehavior: 'aggressive', tags: [EntityTag.DRAGON, EntityTag.FLYING],
        damageType: DamageType.MAGICAL,
        attacks: [{ type: 'melee', range: 1, name: 'Mordisco', damageMult: 1.2 }, { type: 'magic', range: 4, name: 'Aliento de Fuego', color: '#f59e0b', element: DamageType.FIRE }]
    },
};
