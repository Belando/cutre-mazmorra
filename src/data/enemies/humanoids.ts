import { ENTITY } from '../constants';
import { ENEMY_IDS } from '../ids';
import { EntityTag, DamageType } from '@/types';
import { EnemyStats } from './types';

export const HUMANOID_STATS: Record<number, EnemyStats> = {
    [ENTITY.ENEMY_GOBLIN]: { id: ENEMY_IDS.GOBLIN, name: 'Goblin', hp: 12, attack: 4, defense: 1, exp: 6, symbol: 'g', color: '#4ade80', minLevel: 1, renderKey: 'goblin', aiBehavior: 'pack', tags: [EntityTag.HUMANOID, EntityTag.GOBLIN] },
    [ENTITY.ENEMY_ORC]: { id: ENEMY_IDS.ORC, name: 'Orco', hp: 22, attack: 6, defense: 3, exp: 12, symbol: 'o', color: '#f97316', minLevel: 2, renderKey: 'orc', aiBehavior: 'aggressive', tags: [EntityTag.HUMANOID, EntityTag.ORC] },
    [ENTITY.ENEMY_CULTIST]: {
        id: ENEMY_IDS.CULTIST, name: 'Cultista', hp: 20, attack: 9, defense: 2, exp: 15, symbol: 'c', color: '#be123c', minLevel: 3, renderKey: 'cultist', aiBehavior: 'cautious', tags: [EntityTag.HUMANOID, EntityTag.MAGIC],
        attacks: [{ type: 'magic', range: 6, name: 'Rayo Oscuro', color: '#a855f7', element: DamageType.DARK, damageMult: 0.8 }]
    },
    [ENTITY.ENEMY_TROLL]: { id: ENEMY_IDS.TROLL, name: 'Trol', hp: 40, attack: 9, defense: 5, exp: 22, symbol: 'T', color: '#a855f7', minLevel: 4, renderKey: 'troll', aiBehavior: 'aggressive', tags: [EntityTag.HUMANOID, EntityTag.GIANT] },
    [ENTITY.ENEMY_VETERAN_ORC]: {
        id: ENEMY_IDS.VETERAN_ORC, name: 'Orco Veterano', hp: 45, attack: 10, defense: 5, exp: 25, symbol: 'O', color: '#c2410c', minLevel: 4, renderKey: 'orc', aiBehavior: 'aggressive', tags: [EntityTag.HUMANOID, EntityTag.ORC]
    },
};
