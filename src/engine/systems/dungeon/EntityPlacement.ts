import { ENTITY, TILE } from '@/data/constants';
import { ENEMY_STATS } from '@/data/enemies';
import { SpriteComponent, Stats, Enemy } from '@/types';
import { Room, scaleEnemyStats } from './DungeonUtils';
import { getSpriteForEnemy } from '@/data/sprites';
import { SeededRandom } from '@/utils/random';

export function placeEntities(map: number[][], entities: number[][], rooms: Room[], types: number[], count: number, excludeRoomIndices: number[], rng?: SeededRandom) {
    let placed = 0;
    let attempts = 0;
    const randomVal = (maxExclusive: number) => rng ? rng.int(0, maxExclusive - 1) : Math.floor(Math.random() * maxExclusive);

    while (placed < count && attempts < 100) {
        attempts++;
        const roomIndex = randomVal(rooms.length);
        if (excludeRoomIndices.includes(roomIndex)) continue;

        const room = rooms[roomIndex];
        const x = room.x + 1 + randomVal(room.width - 2);
        const y = room.y + 1 + randomVal(room.height - 2);

        if (map[y][x] === TILE.FLOOR && entities[y][x] === ENTITY.NONE) {
            // Types needs random pick
            const typeIndex = randomVal(types.length);
            entities[y][x] = types[typeIndex];
            placed++;
        }
    }
}

export function placeBoss(map: number[][], entities: number[][], stairsX: number, stairsY: number, bossType: number) {
    // BFS to find nearest valid floor tile that isn't the stairs itself
    const q: { x: number, y: number }[] = [{ x: stairsX, y: stairsY }];
    const visited = new Set<string>();
    visited.add(`${stairsX},${stairsY}`);

    // We want to avoid placing ON the stairs if possible, so we start checking neighbors immediately
    // If the queue pops the start node, we skip placing there unless it's the only option (fallback at end)

    let attempts = 0;

    while (q.length > 0 && attempts < 50) {
        const curr = q.shift()!;
        attempts++;

        // Valid spot check: Floor, No Entity, Not Stairs (optional, but good)
        // We know stairs are at stairsX, stairsY.
        const isStairs = curr.x === stairsX && curr.y === stairsY;

        if (!isStairs && map[curr.y]?.[curr.x] === TILE.FLOOR && entities[curr.y]?.[curr.x] === ENTITY.NONE) {
            entities[curr.y][curr.x] = bossType;
            return; // Placed!
        }

        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]];
        // Randomize dirs to avoid bias
        dirs.sort(() => Math.random() - 0.5);

        for (const [dx, dy] of dirs) {
            const nx = curr.x + dx;
            const ny = curr.y + dy;
            if (ny >= 0 && ny < map.length && nx >= 0 && nx < map[0].length && !visited.has(`${nx},${ny}`)) {
                // Only traverse floors or open doors? traverse everything to find nearest floor?
                // Traverse only floor-ish to avoid jumping walls
                if (map[ny][nx] !== TILE.WALL) {
                    visited.add(`${nx},${ny}`);
                    q.push({ x: nx, y: ny });
                }
            }
        }
    }

    // Fallback: Force on stairs if absolutely nowhere else found (rare)
    entities[stairsY][stairsX] = bossType;
    console.warn("Failed to place boss in open spot, placing on stairs.");
}

export function createEnemiesFromGrid(entitiesGrid: number[][], level: number, playerLevel: number): Enemy[] {
    const enemies: Enemy[] = [];
    const height = entitiesGrid.length;
    const width = entitiesGrid[0].length;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const entity = entitiesGrid[y][x];
            if (entity >= 2) {
                const baseStats = ENEMY_STATS[entity];
                if (baseStats) {
                    const scaled = scaleEnemyStats(baseStats as unknown as Stats, playerLevel, level);
                    const sprite: SpriteComponent | undefined = getSpriteForEnemy(entity) || undefined;
                    enemies.push({
                        id: `enemy-${x}-${y}-${level}`,
                        name: (baseStats as any).name || 'Enemigo',
                        level: level,
                        x, y,
                        type: entity,
                        hp: scaled.hp || 10,
                        maxHp: scaled.maxHp || 10,
                        mp: scaled.mp || 0,
                        maxMp: scaled.maxMp || 0,
                        stats: scaled,
                        isBoss: (baseStats as any).isBoss || false,
                        stunned: 0,
                        slowed: 0,
                        sprite
                    } as Enemy);
                }
            }
        }
    }
    return enemies;
}
