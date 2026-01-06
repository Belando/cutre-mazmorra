import { ENTITY } from '../constants';
import { ENEMY_IDS } from '../ids';
import { EntityTag, DamageType } from '@/types';
import { EnemyStats } from './types';

export const BEAST_STATS: Record<number, EnemyStats> = {
    [ENTITY.ENEMY_RAT]: { id: ENEMY_IDS.RAT, name: 'Rata', hp: 6, attack: 2, defense: 0, exp: 3, symbol: 'r', color: '#a1a1aa', minLevel: 1, renderKey: 'rat', aiBehavior: 'aggressive', tags: [EntityTag.BEAST] },
    [ENTITY.ENEMY_BAT]: {
        id: ENEMY_IDS.BAT,
        name: 'Murciélago', hp: 8, attack: 3, defense: 0, exp: 4, symbol: 'b', color: '#71717a', minLevel: 1, renderKey: 'bat', aiBehavior: 'aggressive', tags: [EntityTag.BEAST, EntityTag.FLYING],
        attacks: [{ type: 'ranged', range: 4, name: 'Chillido', color: '#a855f7', chance: 0.3 }]
    },
    [ENTITY.ENEMY_WOLF]: { id: ENEMY_IDS.WOLF, name: 'Lobo Salvaje', hp: 16, attack: 7, defense: 2, exp: 10, symbol: 'w', color: '#78716c', minLevel: 2, renderKey: 'wolf', aiBehavior: 'aggressive', tags: [EntityTag.BEAST] },
    [ENTITY.ENEMY_SPIDER]: {
        id: ENEMY_IDS.SPIDER, name: 'Araña Gigante', hp: 18, attack: 7, defense: 2, exp: 10, symbol: 'S', color: '#7c3aed', minLevel: 3, renderKey: 'spider', aiBehavior: 'ambush', tags: [EntityTag.BEAST, EntityTag.INSECT],
        attacks: [
            { type: 'ranged', range: 4, name: 'Telaraña', color: '#ffffff', effect: { type: 'slow', duration: 3, chance: 1, value: 3 } },
            { type: 'melee', range: 1, name: 'Mordisco', element: DamageType.POISON, effect: { type: 'poison', duration: 3, chance: 0.3, value: 3 } }
        ]
    },
    [ENTITY.ENEMY_GIANT_RAT]: {
        id: ENEMY_IDS.GIANT_RAT, name: 'Rata Gigante', hp: 15, attack: 5, defense: 1, exp: 8, symbol: 'R', color: '#52525b', minLevel: 2, renderKey: 'rat', aiBehavior: 'aggressive', tags: [EntityTag.BEAST]
    },
};
