import { getDistance, hasLineOfSight as utilsHasLineOfSight } from '@/engine/core/utils';
import { Player, Enemy } from '@/types';

/**
 * Wrapper for checking line of sight between two points.
 * @param map The game map
 * @param x1 Start X
 * @param y1 Start Y
 * @param x2 End X
 * @param y2 End Y
 */
export function hasLineOfSight(map: number[][], x1: number, y1: number, x2: number, y2: number): boolean {
    return utilsHasLineOfSight(map, x1, y1, x2, y2);
}

/**
 * Filters enemies to find those within range and line of sight.
 * @param player The player entity acting as the source
 * @param enemies List of potential targets
 * @param map Terrain map for Line of Sight checks
 * @param range Weapon range
 */
export function getRangedTargets(player: Player, enemies: Enemy[], map: number[][], range: number): Enemy[] {
    if (range === 0) return [];

    return enemies.filter(enemy => {
        const dist = getDistance(player, enemy);
        return dist <= range && dist > 0 && utilsHasLineOfSight(map, player.x, player.y, enemy.x, enemy.y);
    }).sort((a, b) => getDistance(player, a) - getDistance(player, b));
}
