import { TILE } from '@/data/constants';
import { Room, WallSegment } from './DungeonUtils';
import { Point } from '@/types';
import { SeededRandom } from '@/utils/random';

export function carveHorizontalCorridor(map: number[][], x1: number, x2: number, y: number) {
    const start = Math.min(x1, x2);
    const end = Math.max(x1, x2);
    for (let x = start; x <= end; x++) {
        if (y > 0 && y < map.length - 1) map[y][x] = TILE.FLOOR;
    }
}

export function carveVerticalCorridor(map: number[][], y1: number, y2: number, x: number) {
    const start = Math.min(y1, y2);
    const end = Math.max(y1, y2);
    for (let y = start; y <= end; y++) {
        if (x > 0 && x < map[0].length - 1) map[y][x] = TILE.FLOOR;
    }
}

export function connectRooms(map: number[][], rooms: Room[], rng?: SeededRandom) {
    for (let i = 1; i < rooms.length; i++) {
        const prev = rooms[i - 1];
        const curr = rooms[i];

        const prevCenterX = Math.floor(prev.x + prev.width / 2);
        const prevCenterY = Math.floor(prev.y + prev.height / 2);
        const currCenterX = Math.floor(curr.x + curr.width / 2);
        const currCenterY = Math.floor(curr.y + curr.height / 2);

        if ((rng ? rng.next() : Math.random()) > 0.5) {
            carveHorizontalCorridor(map, prevCenterX, currCenterX, prevCenterY);
            carveVerticalCorridor(map, prevCenterY, currCenterY, currCenterX);
        } else {
            carveVerticalCorridor(map, prevCenterY, currCenterY, prevCenterX);
            carveHorizontalCorridor(map, prevCenterX, currCenterX, currCenterY);
        }
    }
}

export function ensureConnectivity(map: number[][], rooms: Room[], rng?: SeededRandom) {
    const width = map[0].length;
    const height = map.length;
    let connected = false;
    let connectionAttempts = 0;

    while (!connected && connectionAttempts < 10) {
        connectionAttempts++;
        const startNode = rooms[0];
        const startX = Math.floor(startNode.x + startNode.width / 2);
        const startY = Math.floor(startNode.y + startNode.height / 2);

        if (map[startY][startX] === TILE.WALL) map[startY][startX] = TILE.FLOOR;

        const visited = new Set<string>();
        const q: Point[] = [{ x: startX, y: startY }];
        visited.add(`${startX},${startY}`);

        while (q.length > 0) {
            const { x, y } = q.shift()!;
            const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            for (const [dx, dy] of dirs) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const key = `${nx},${ny}`;
                    if (!visited.has(key) && (map[ny][nx] === TILE.FLOOR || map[ny][nx] === TILE.DOOR)) {
                        visited.add(key);
                        q.push({ x: nx, y: ny });
                    }
                }
            }
        }

        let unconnectedRoom: Room | null = null;
        for (let i = 1; i < rooms.length; i++) {
            const r = rooms[i];
            const cx = Math.floor(r.x + r.width / 2);
            const cy = Math.floor(r.y + r.height / 2);

            if (map[cy][cx] === TILE.WALL) map[cy][cx] = TILE.FLOOR;

            if (!visited.has(`${cx},${cy}`)) {
                unconnectedRoom = r;
                break;
            }
        }

        if (!unconnectedRoom) {
            connected = true;
        } else {
            let bestDist = Infinity;
            let bestCandidate: Room | null = null;

            const curCx = Math.floor(unconnectedRoom.x + unconnectedRoom.width / 2);
            const curCy = Math.floor(unconnectedRoom.y + unconnectedRoom.height / 2);

            for (const r of rooms) {
                const cx = Math.floor(r.x + r.width / 2);
                const cy = Math.floor(r.y + r.height / 2);
                if (visited.has(`${cx},${cy}`)) {
                    const d = Math.abs(cx - curCx) + Math.abs(cy - curCy);
                    if (d < bestDist) {
                        bestDist = d;
                        bestCandidate = r;
                    }
                }
            }

            if (bestCandidate) {
                const targetCx = Math.floor(bestCandidate.x + bestCandidate.width / 2);
                const targetCy = Math.floor(bestCandidate.y + bestCandidate.height / 2);

                if ((rng ? rng.next() : Math.random()) > 0.5) {
                    carveHorizontalCorridor(map, curCx, targetCx, curCy);
                    carveVerticalCorridor(map, curCy, targetCy, targetCx);
                } else {
                    carveVerticalCorridor(map, curCy, targetCy, curCx);
                    carveHorizontalCorridor(map, curCx, targetCx, targetCy);
                }
            } else {
                connected = true;
            }
        }
    }
}

export function placeDoors(map: number[][], rooms: Room[], rng?: SeededRandom) {
    // Determine sort or shuffle
    // If RNG provided, use it to shuffle. Otherwise default.
    // However, JS sort is not random. We need to shuffle then iterate.
    // Original: [...rooms].sort(() => Math.random() - 0.5)

    let shuffledRooms = [...rooms];
    if (rng) {
        shuffledRooms = rng.shuffle(shuffledRooms);
    } else {
        shuffledRooms.sort(() => Math.random() - 0.5);
    }

    shuffledRooms.forEach(room => {
        const walls: WallSegment[] = [
            { axis: 'x', start: room.x, end: room.x + room.width, fixed: room.y - 1 },
            { axis: 'x', start: room.x, end: room.x + room.width, fixed: room.y + room.height },
            { axis: 'y', start: room.y, end: room.y + room.height, fixed: room.x - 1 },
            { axis: 'y', start: room.y, end: room.y + room.height, fixed: room.x + room.width }
        ];

        walls.forEach(wall => {
            const candidates: Point[] = [];

            for (let i = wall.start; i < wall.end; i++) {
                const x = wall.axis === 'x' ? i : wall.fixed;
                const y = wall.axis === 'x' ? wall.fixed : i;

                if (y < 1 || y >= map.length - 1 || x < 1 || x >= map[0].length - 1) continue;

                if (map[y][x] === TILE.FLOOR) {
                    const left = map[y][x - 1];
                    const right = map[y][x + 1];
                    const top = map[y - 1][x];
                    const bottom = map[y + 1][x];

                    const validHorizontal = (top === TILE.WALL && bottom === TILE.WALL);
                    const validVertical = (left === TILE.WALL && right === TILE.WALL);

                    if (validHorizontal || validVertical) {
                        candidates.push({ x, y });
                    }
                }
            }

            if (candidates.length > 0) {
                if (candidates.length > 3) return;

                const best = candidates[Math.floor(candidates.length / 2)];
                let nearbyDoor = false;

                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;

                        const checkY = best.y + dy;
                        const checkX = best.x + dx;

                        if (map[checkY]?.[checkX] === TILE.DOOR) {
                            nearbyDoor = true;
                        }
                    }
                }

                if (!nearbyDoor && (rng ? rng.next() : Math.random()) < 0.8) {
                    map[best.y][best.x] = TILE.DOOR;
                }
            }
        });
    });
}
