import { describe, it, expect, vi } from 'vitest';
import { generateDungeon, TILE } from './DungeonGenerator';

// Mock dependencies
vi.mock('./ItemSystem', () => ({
    generateLevelItems: () => []
}));

vi.mock('@/data/constants', () => ({
    TILE: {
        WALL: 0,
        FLOOR: 1,
        DOOR: 2,
        STAIRS: 3,
        STAIRS_UP: 4,
        DOOR_OPEN: 5
    },
    ENTITY: {
        NONE: 0,
        ENEMY_RAT: 2,
        BOSS_GOBLIN_KING: 100
    }
}));

vi.mock('@/data/enemies', () => ({
    ENEMY_STATS: {
        2: { hp: 10, isBoss: false, minLevel: 1 },
        100: { hp: 100, isBoss: true, minLevel: 1 }
    }
}));

describe('DungeonGenerator', () => {

    it('should generate a dungeon with correct dimensions', () => {
        const width = 50;
        const height = 50;
        const level = 1;
        const result = generateDungeon(width, height, level);

        expect(result.map.length).toBe(height);
        expect(result.map[0].length).toBe(width);
        expect(result.entities.length).toBe(height);
    });

    it('should contain a player start position', () => {
        const result = generateDungeon(50, 50, 1);
        expect(result.playerStart).toBeDefined();
        expect(result.playerStart.x).toBeGreaterThan(0);
        expect(result.playerStart.y).toBeGreaterThan(0);
        // Player start should be on a floor
        expect(result.map[result.playerStart.y][result.playerStart.x]).toBe(1); // TILE.FLOOR
    });

    it('should contain stairs down', () => {
        const result = generateDungeon(50, 50, 1);
        expect(result.stairs).toBeDefined();
        expect(result.map[result.stairs.y][result.stairs.x]).toBe(3); // TILE.STAIRS
    });

    it('should place enemies', () => {
        const result = generateDungeon(50, 50, 1);
        expect(result.enemies.length).toBeGreaterThan(0);
        // Enemies should have valid positions
        result.enemies.forEach(enemy => {
            expect(enemy.x).toBeGreaterThan(0);
            expect(enemy.y).toBeGreaterThan(0);
            expect(enemy.type).toBeDefined();
        });
    });

    it('should generate rooms connected by corridors', () => {
        // Harder to test strictly without pathfinding, 
        // but we can ensure we have multiple rooms and they are carved out.
        const result = generateDungeon(50, 50, 1);
        expect(result.rooms.length).toBeGreaterThan(3); // Should have at least a few rooms

        // Check that room centers are floors
        result.rooms.forEach(room => {
            const cx = Math.floor(room.x + room.width / 2);
            const cy = Math.floor(room.y + room.height / 2);
            expect(result.map[cy][cx]).toBeDefined();
            // Note: Center usually floor but could be entity/stairs, but definitely not NULL
            expect(result.map[cy][cx]).toBeGreaterThanOrEqual(1); // Not WALL (0)
        });
    });

});
