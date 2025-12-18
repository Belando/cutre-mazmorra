import { describe, it, expect, vi } from 'vitest';
import {
  calculateMeleeDamage,
  evaluateTacticalPosition,
  calculatePlayerHit,
  applyClassBonus,
} from './CombatSystem';
import { Entity, Stats } from '@/types';

// Mock getWeaponRange
// Since we are mocking modules, we might need to adjust types if strict checks fail,
// but module mocks are mostly runtime.
vi.mock('./EquipmentSystem', () => ({
  getWeaponRange: () => 1,
  calculateEquipmentStats: () => ({ defense: 5 })
}));

// Mock SoundSystem
vi.mock('./SoundSystem', () => ({
  soundManager: { play: vi.fn() }
}));

// Mock utils
vi.mock('@/engine/core/utils', () => ({
  getDistance: () => 1,
  isInRange: () => true,
  hasLineOfSight: () => true,
  getProjectilePath: () => []
}));

describe('CombatSystem', () => {

  describe('calculateMeleeDamage', () => {
    it('should calculate base damage correctly', () => {
      const attacker: Entity = { x: 0, y: 0, type: 'test', stats: { attack: 10 } as Stats };
      const defender: Entity = { x: 0, y: 0, type: 'test', stats: { defense: 2 } as Stats };

      const result = calculateMeleeDamage(attacker, defender, attacker.stats!);

      // Base: 10 - 2 = 8. Variance: -1 to 1. Range: 7 to 9.
      expect(result.damage).toBeGreaterThanOrEqual(7);
      expect(result.damage).toBeLessThanOrEqual(13); // Crit (9 * 1.5 = 13.5)
    });

    it('should minimum damage be 1', () => {
      const attacker: Entity = { x: 0, y: 0, type: 'test', stats: { attack: 1 } as Stats };
      const defender: Entity = { x: 0, y: 0, type: 'test', stats: { defense: 100 } as Stats };

      const result = calculateMeleeDamage(attacker, defender, attacker.stats!);
      expect(result.damage).toBeGreaterThanOrEqual(1);
    });
  });

  describe('calculatePlayerHit', () => {
    it('should calculate damage based on player stats', () => {
      const player: Entity = {
        x: 0, y: 0, type: 'player',
        baseAttack: 10,
        baseCrit: 0,
        skills: { cooldowns: {}, active: {}, buffs: [] },
        class: 'warrior'
      };
      const enemy: Entity = { x: 0, y: 0, type: 'enemy', stats: { defense: 0 } as Stats };

      const result = calculatePlayerHit(player, enemy);
      // Attack 10. Variance [0, 1, 2]. Range 10-12.
      expect(result.damage).toBeGreaterThanOrEqual(10);
      expect(result.damage).toBeLessThanOrEqual(18); // Max Crit potential
      expect(result.type).toBe('physical');
    });

    it('should use magic attack for mages', () => {
      const player: Entity = {
        x: 0, y: 0, type: 'player',
        baseAttack: 5,
        baseMagicAttack: 20,
        class: 'mage',
        skills: { cooldowns: {}, active: {}, buffs: [] }
      };
      const enemy: Entity = { x: 0, y: 0, type: 'enemy', stats: { defense: 0 } as Stats };

      const result = calculatePlayerHit(player, enemy);

      expect(result.type).toBe('magical');
      expect(result.damage).toBeGreaterThanOrEqual(20);
    });
  });

  describe('evaluateTacticalPosition', () => {
    it('should return score based on walls and enemies', () => {
      const map: number[][] = [
        [0, 0, 0],
        [0, 1, 0], // Center is safe
        [0, 0, 0]
      ];
      // Enemies far away
      const enemies: Entity[] = [];
      const score = evaluateTacticalPosition(1, 1, enemies, map);

      // Walls: (0,1), (1,0), (1,2), (2,1) are checked.
      // Logic: if map val is 0, it's a wall.
      expect(score).toBe(-30);
    });
  });

  describe('applyClassBonus', () => {
    it('should apply warrior melee bonus', () => {
      const dmg = 100;
      const res = applyClassBonus(dmg, 'warrior', 'melee');
      // 15% bonus of 100 -> 115.
      expect(res).toBeGreaterThanOrEqual(114);
      expect(res).toBeLessThanOrEqual(115);
    });

    it('should apply rogue backstab bonus', () => {
      const dmg = 100;
      const res = applyClassBonus(dmg, 'rogue', 'melee', true); // isVulnerable
      // 30% bonus -> 130
      expect(res).toBeCloseTo(130, 0);
    });
  });

});
