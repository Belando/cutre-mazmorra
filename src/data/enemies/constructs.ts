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
        id: ENEMY_IDS.DEMON, name: 'Demonio', hp: 55, attack: 13, defense: 6, exp: 35, symbol: 'D', color: '#ef4444', minLevel: 6, renderKey: 'demon', aiBehavior: 'aggressive', tags: [EntityTag.DEMON],
        attacks: [{ type: 'magic', range: 5, name: 'Bola de Fuego', color: '#ef4444', element: DamageType.FIRE, effect: { type: 'burn', duration: 4, chance: 0.4 } }]
    },
    [ENTITY.ENEMY_DRAGON]: {
        id: ENEMY_IDS.DRAGON, name: 'Dragón Joven', hp: 70, attack: 15, defense: 8, exp: 50, symbol: 'd', color: '#f59e0b', minLevel: 7, renderKey: 'dragon', aiBehavior: 'aggressive', tags: [EntityTag.DRAGON, EntityTag.FLYING],
        attacks: [{ type: 'magic', range: 6, name: 'Aliento de Fuego', color: '#f59e0b', element: DamageType.FIRE, effect: { type: 'burn', duration: 4, chance: 0.4 } }]
    },
};
