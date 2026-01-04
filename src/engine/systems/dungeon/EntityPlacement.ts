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
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]];
    for (const [dx, dy] of dirs) {
        if (map[stairsY + dy]?.[stairsX + dx] === TILE.FLOOR) {
            entities[stairsY + dy][stairsX + dx] = bossType;
            return;
        }
    }
    entities[stairsY][stairsX] = bossType;
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
