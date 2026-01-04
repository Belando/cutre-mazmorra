import { TILE } from '@/data/constants';
import { Room } from './DungeonUtils';
import { SeededRandom } from '@/utils/random';

export function generateRooms(width: number, height: number, level: number, rng?: SeededRandom): { rooms: Room[], map: number[][] } {
    const map: number[][] = Array(height).fill(null).map(() => Array(width).fill(TILE.WALL));
    const rooms: Room[] = [];

    // Actually better to just replicate the logic:
    // Math.floor(Math.random() * N) => rng.int(0, N-1)

    const randomVal = (maxExclusive: number) => rng ? rng.int(0, maxExclusive - 1) : Math.floor(Math.random() * maxExclusive);

    // Phase A: Organic Halls
    const hallCount = 3 + randomVal(2);
    for (let i = 0; i < hallCount; i++) {
        const roomWidth = 10 + randomVal(8);
        const roomHeight = 10 + randomVal(8);
        const x = 2 + randomVal(width - roomWidth - 4);
        const y = 2 + randomVal(height - roomHeight - 4);

        const newRoom = { x, y, width: roomWidth, height: roomHeight };
        rooms.push(newRoom);

        for (let ry = y; ry < y + roomHeight; ry++) {
            for (let rx = x; rx < x + roomWidth; rx++) {
                map[ry][rx] = TILE.FLOOR;
            }
        }
    }

    // Phase B: Structured Rooms
    const standardRoomCount = 8 + level + randomVal(4);
    let placedStandard = 0;
    let attempts = 0;

    while (placedStandard < standardRoomCount && attempts < 200) {
        attempts++;
        const roomWidth = 5 + randomVal(6);
        const roomHeight = 5 + randomVal(6);
        const x = 2 + randomVal(width - roomWidth - 4);
        const y = 2 + randomVal(height - roomHeight - 4);

        let overlap = false;
        for (const r of rooms) {
            if (
                x < r.x + r.width + 2 &&
                x + roomWidth + 2 > r.x &&
                y < r.y + r.height + 2 &&
                y + roomHeight + 2 > r.y
            ) {
                overlap = true;
                break;
            }
        }

        if (!overlap) {
            const newRoom = { x, y, width: roomWidth, height: roomHeight };
            rooms.push(newRoom);

            for (let ry = y; ry < y + roomHeight; ry++) {
                for (let rx = x; rx < x + roomWidth; rx++) {
                    map[ry][rx] = TILE.FLOOR;
                }
            }
            placedStandard++;
        }
    }

    return { rooms, map };
}
