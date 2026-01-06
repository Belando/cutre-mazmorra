import { BEAST_STATS } from './beasts';
import { HUMANOID_STATS } from './humanoids';
import { UNDEAD_STATS } from './undead';
import { CONSTRUCT_STATS, DEMON_STATS } from './constructs';
import { BOSS_STATS } from './bosses';
import { EnemyStats } from './types';

export * from './types';
export * from './large_enemies';

export const ENEMY_STATS: Record<number, EnemyStats> = {
    ...BEAST_STATS,
    ...HUMANOID_STATS,
    ...UNDEAD_STATS,
    ...CONSTRUCT_STATS,
    ...DEMON_STATS,
    ...BOSS_STATS,
};
