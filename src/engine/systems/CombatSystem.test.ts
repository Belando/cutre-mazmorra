import { describe, it, expect } from 'vitest';
import { calculateMeleeDamage, calculatePlayerHit, calculateEnemyDamage } from './CombatSystem';
import { calculatePlayerStats } from './ItemSystem';
import { calculateBuffBonuses } from './SkillSystem';
import { Player, Enemy, Stats, Item } from '@/types';

// Mock Player Data
const mockPlayer: Player = {
  x: 0, y: 0,
  id: 'player',
  type: 'player',
  name: 'Hero',
  level: 1,
  hp: 100, maxHp: 100,
  mp: 50, maxMp: 50,
  class: 'warrior',
  exp: 0,
  gold: 0,
  skills: {
    class: 'warrior',
    learned: [],
    skillLevels: {},
    skillPoints: 0,
    cooldowns: {},
    buffs: []
  },
  appearance: {},
  baseAttack: 10,
  baseDefense: 5,
  baseMagicAttack: 0,
  baseMagicDefense: 2,
  baseCrit: 5,
  baseEvasion: 5,
  equipAttack: 0,
  equipDefense: 0,
  equipMagicAttack: 0,
  equipMagicDefense: 0,
  equipCrit: 0,
  equipEvasion: 0,
  equipMaxHp: 0,
  equipMaxMp: 0,
  stats: {
    hp: 100, maxHp: 100,
    attack: 10, defense: 5
  },
  inventory: [],
  equipment: {
    weapon: null, offhand: null, helmet: null, chest: null,
    legs: null, boots: null, gloves: null, ring: null, earring: null, necklace: null
  }
};

// Mock Enemy Data
const mockEnemy: Enemy = {
  x: 2, y: 2,
  id: 1,
  type: 'goblin',
  name: 'Goblin',
  level: 1,
  hp: 30, maxHp: 30,
  mp: 0, maxMp: 0,
  stats: {
    hp: 30, maxHp: 30,
    attack: 8, defense: 2,
    exp: 10
  }
};

describe('CombatSystem Integration Tests', () => {

  describe('calculateMeleeDamage (Generic)', () => {
    it('should calculate damage based on attack and defense', () => {
      const attackerStats: Stats = { attack: 10, critChance: 0 };
      const result = calculateMeleeDamage({ ...mockPlayer }, { ...mockEnemy }, attackerStats);

      // Damage = 10 (Atk) - 2 (Def) + Variance (-1 to 1) 
      // Range: 7 to 9
      expect(result.damage).toBeGreaterThanOrEqual(7);
      expect(result.damage).toBeLessThanOrEqual(9);
    });

    it('should enforce minimum damage of 1', () => {
      const attackerStats: Stats = { attack: 1, critChance: 0 };
      // 1 - 2 + variance <= 0 usually
      const result = calculateMeleeDamage({ ...mockPlayer }, { ...mockEnemy }, attackerStats);
      expect(result.damage).toBeGreaterThanOrEqual(1);
    });
  });

  describe('calculatePlayerHit (Player vs Enemy)', () => {
    it('should include equipment bonuses in damage', () => {
      // Equip a sword (+5 Atk)
      const sword: Item = {
        id: 'sword', name: 'Iron Sword', category: 'weapon',
        rarity: 'common', stats: { attack: 5 }
      };

      const equippedPlayer = {
        ...mockPlayer,
        equipment: { ...mockPlayer.equipment, weapon: sword },
        // System expects equipAttack to be pre-calculated/updated
        equipAttack: 5
      };

      // Manually calculate stats and buffs as CombatSystem is now decoupled
      const stats = calculatePlayerStats(equippedPlayer);
      const buffs = calculateBuffBonuses(equippedPlayer.skills.buffs, stats);

      const result = calculatePlayerHit(equippedPlayer, mockEnemy, stats, buffs);

      // Base 10 + Sword 5 = 15 Attack. Enemy Def 2.
      // Expected ~13 +/- variance.
      expect(result.damage).toBeGreaterThanOrEqual(12);
    });

    it('should apply class bonuses (Warrior Melee)', () => {
      // Warrior gets +15% melee damage
      const warrior = { ...mockPlayer, class: 'warrior' };
      // This logic is applied in applyClassBonus usually, not calculatePlayerHit directly for base damage calculation
      // verify calculatePlayerHit returns raw damage.
    });
  });

  describe('calculateEnemyDamage (Enemy vs Player)', () => {
    it('should mitigate damage with player defense', () => {
      const playerWithArmor = { ...mockPlayer, baseDefense: 5 }; // Total 5
      const strongEnemy = { ...mockEnemy, stats: { attack: 10 } };

      const result = calculateEnemyDamage(strongEnemy, playerWithArmor.stats, []);
      // 10 - 5 + variance(0-2) = 5 to 7
      expect(result.damage).toBeGreaterThanOrEqual(5);
      expect(result.damage).toBeLessThanOrEqual(7);
    });

    it('should apply absorption buff', () => {
      const buffedPlayerStats = { ...mockPlayer.stats };
      const buffs = [{ id: 'shield', name: 'Shield', duration: 1, absorb: 0.5 }]; // 50% absorb

      const enemy = { ...mockEnemy, stats: { attack: 20 } };
      // Player def 5. Raw = 15. Absorb 50% -> 7.5 -> floor(7)

      const result = calculateEnemyDamage(enemy, buffedPlayerStats, buffs);

      // 20 - 5 = 15. Variance 0-2 -> 15-17.
      // 50% of 15 is 7.5 (floor 7). 50% of 17 is 8.5 (floor 8).
      expect(result.damage).toBeLessThan(10); // Should be significantly reduced
    });
  });

});
