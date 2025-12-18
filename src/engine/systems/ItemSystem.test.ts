import { describe, it, expect, vi } from 'vitest';
import {
  generateItem,
  canClassEquip,
  calculatePlayerStats,
  equipItem
} from './ItemSystem';
import { Item, Entity, Stats } from '@/types';
import { ItemTemplate, WeaponTypeInfo, ArmorTypeInfo, RarityInfo } from '@/data/items';

// Mock dependencies
vi.mock('@/data/items', () => ({
  ITEM_TEMPLATES: {
    sword: { category: 'weapon', slot: 'weapon', name: 'Sword', baseStats: { attack: 5 }, weaponType: 'sword' }
  } as Record<string, ItemTemplate>,
  WEAPON_TYPES: {
    sword: { name: 'Sword', classes: ['warrior'], damageType: 'physical', ranged: false }
  } as Record<string, WeaponTypeInfo>,
  ARMOR_TYPES: {} as Record<string, ArmorTypeInfo>,
  RARITY_CONFIG: {
    common: { weight: 100, multiplier: 1, name: "Common", color: '#fff' }
  } as Record<string, RarityInfo>
}));

describe('ItemSystem', () => {

  describe('generateItem', () => {
    it('should generate an item with correct structure', () => {
      const item = generateItem(1, 'sword');
      expect(item).toBeDefined();
      if (!item) return;
      expect(item.name).toContain('Sword');
      expect(item.stats?.attack).toBeGreaterThan(0);
      expect(item.rarity).toBe('common');
    });
  });

  describe('canClassEquip', () => {
    const sword: Item = {
      id: '1',
      name: 'Sword',
      category: 'weapon',
      rarity: 'common',
      weaponType: 'sword'
    };

    it('should allow warrior to equip sword', () => {
      expect(canClassEquip(sword, 'warrior', 1)).toBe(true);
    });

    it('should prevent mage from equipping sword', () => {
      expect(canClassEquip(sword, 'mage', 1)).toBe(false);
    });

    it('should check level requirements', () => {
      const highLvlSword = { ...sword, levelRequirement: 10 };
      expect(canClassEquip(highLvlSword, 'warrior', 5)).toBe(false);
      expect(canClassEquip(highLvlSword, 'warrior', 10)).toBe(true);
    });
  });

  describe('calculatePlayerStats', () => {
    it('should sum base and equipment stats', () => {
      const player: Entity = {
        x: 0, y: 0, type: 'player',
        baseAttack: 10,
        equipAttack: 5,
        maxHp: 100
      };
      const stats = calculatePlayerStats(player);
      expect(stats.attack).toBe(15);
      expect(stats.maxHp).toBe(100);
    });
  });

  describe('equipItem', () => {
    it('should equip valid item and update stats', () => {
      const inventory: Item[] = [
        { id: '1', slot: 'weapon', stats: { attack: 10 }, name: 'Super Sword', weaponType: 'sword', category: 'weapon', rarity: 'common' }
      ];
      const equipment = { weapon: null };
      const player: Entity = { x: 0, y: 0, type: 'player', class: 'warrior', level: 1, baseAttack: 5 };

      const res = equipItem(inventory, 0, equipment, player);

      expect(res.success).toBe(true);
      expect(res.newEquipment.weapon.name).toBe('Super Sword');
      expect(res.newPlayer?.equipAttack).toBe(10);
      expect(res.newInventory?.length).toBe(0);
    });
  });

});
