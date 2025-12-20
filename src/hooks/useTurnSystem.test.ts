
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTurnSystem } from './useTurnSystem';
import * as EnemyAI from '../engine/systems/EnemyAI';
import * as CombatSystem from '../engine/systems/CombatSystem';

// Mock dependencies
vi.mock('../engine/systems/EnemyAI', () => ({
    processEnemyTurn: vi.fn(),
    AI_BEHAVIORS: {}
}));

vi.mock('../engine/systems/CombatSystem', () => ({
    calculateEnemyDamage: vi.fn(),
    calculatePlayerStats: vi.fn(),
}));

vi.mock('../engine/systems/ItemSystem', () => ({
    calculatePlayerStats: vi.fn(),
}));

vi.mock('../engine/systems/SoundSystem', () => ({
    soundManager: { play: vi.fn() }
}));

describe('useTurnSystem', () => {
    const mockSetDungeon = vi.fn();
    const mockSetPlayer = vi.fn();
    const mockAddMessage = vi.fn();
    const mockSetGameOver = vi.fn();
    const mockSpatialHash = { rebuild: vi.fn(), updatePlayer: vi.fn() };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should process enemy turns and calculate damage', () => {
        const { result } = renderHook(() => useTurnSystem());

        const player = { x: 5, y: 5, hp: 100, maxHp: 100 };
        const enemy = { x: 6, y: 6, hp: 10, type: 1, id: 'e1' };
        const dungeon = {
            enemies: [enemy],
            map: [],
            visible: []
        };

        // Mock Enemy Logic
        (EnemyAI.processEnemyTurn as any).mockReturnValue({ action: 'melee_attack' });
        (CombatSystem.calculateEnemyDamage as any).mockReturnValue({ damage: 5, evaded: false });

        act(() => {
            result.current.processTurn({
                dungeon: dungeon as any,
                setDungeon: mockSetDungeon,
                player: player as any,
                setPlayer: mockSetPlayer,
                addMessage: mockAddMessage,
                setGameOver: mockSetGameOver,
                spatialHash: mockSpatialHash as any
            });
        });

        // Check if EnemyAI was called
        expect(EnemyAI.processEnemyTurn).toHaveBeenCalled();

        // Check if CombatSystem was called (This confirms the fix works at runtime)
        expect(CombatSystem.calculateEnemyDamage).toHaveBeenCalled();

        // Check if damage was applied
        expect(mockAddMessage).toHaveBeenCalledWith(expect.stringContaining('5 HP'), 'enemy_damage');
    });
});
