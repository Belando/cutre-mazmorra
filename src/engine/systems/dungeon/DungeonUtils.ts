
import { ENTITY, TILE } from '@/data/constants';
import { ENEMY_STATS, EnemyStats } from '@/data/enemies';
import { Stats, Point } from '@/types';

export interface Room {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface WallSegment {
    axis: 'x' | 'y';
    start: number;
    end: number;
    fixed: number;
}

export function getBossForLevel(level: number): number {
    const bosses = [
        ENTITY.BOSS_GOBLIN_KING,
        ENTITY.BOSS_SKELETON_LORD,
        ENTITY.BOSS_ORC_WARLORD,
        ENTITY.BOSS_SPIDER_QUEEN,
        ENTITY.BOSS_LICH,
        ENTITY.BOSS_DEMON_LORD,
        ENTITY.BOSS_ANCIENT_DRAGON,
    ];
    return bosses[Math.min(level - 1, bosses.length - 1)];
}

export function getEnemiesForLevel(level: number): number[] {
    const available: number[] = [];
    for (const [entityId, stats] of Object.entries(ENEMY_STATS)) {
        const s = stats as EnemyStats;
        if (!s.isBoss && s.minLevel <= level) {
            // Optional: Cap low level enemies so they stop spawning at high levels
            if (level > s.minLevel + 4 && Math.random() < 0.8) continue; // 80% chance to skip weak mobs
            available.push(parseInt(entityId));
        }
    }
    return available;
}

export function scaleEnemyStats(baseStats: Stats, playerLevel: number, dungeonLevel: number): Stats {
    const scaleFactor = 1 + (playerLevel * 0.08) + (dungeonLevel * 0.05);
    const hp = baseStats.hp || 10;
    const scaledHp = Math.floor(hp * scaleFactor);

    return {
        ...baseStats,
        hp: scaledHp,
        maxHp: scaledHp,
        attack: Math.floor((baseStats.attack || 5) * scaleFactor),
        defense: Math.floor((baseStats.defense || 0) * (1 + playerLevel * 0.03)),
        exp: Math.floor((baseStats.exp || 10) * (1 + playerLevel * 0.05)),
    };
}

export function smoothMap(map: number[][], passes: number) {
    const height = map.length;
    const width = map[0].length;

    for (let p = 0; p < passes; p++) {
        const newMap = map.map(row => [...row]);
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let walls = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (map[y + dy][x + dx] === TILE.WALL) walls++;
                    }
                }

                if (walls > 4) newMap[y][x] = TILE.WALL;
                else if (walls < 4) newMap[y][x] = TILE.FLOOR;
            }
        }
        for (let y = 0; y < height; y++) map[y] = newMap[y];
    }
}

export function findNearestFloor(map: number[][], startX: number, startY: number): Point | null {
    const q: Point[] = [{ x: startX, y: startY }];
    const visited = new Set<string>();
    visited.add(`${startX},${startY}`);

    while (q.length > 0) {
        if (q.length > 500) break;

        const curr = q.shift()!;
        if (map[curr.y]?.[curr.x] === TILE.FLOOR) return curr;

        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of dirs) {
            const nx = curr.x + dx;
            const ny = curr.y + dy;
            if (ny >= 0 && ny < map.length && nx >= 0 && nx < map[0].length && !visited.has(`${nx},${ny}`)) {
                visited.add(`${nx},${ny}`);
                q.push({ x: nx, y: ny });
            }
        }
    }
    return null;
}
