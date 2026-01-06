import { ENTITY } from '../constants';
import { LargeEnemyConfig } from './types';

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
