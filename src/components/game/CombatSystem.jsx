// Enhanced Combat System with ranged attacks and class abilities

import { getWeaponRange, isRangedWeapon, calculateEquipmentStats } from './EquipmentSystem';

// Calculate if target is in range
export function isInRange(attacker, target, range) {
  const distance = Math.abs(attacker.x - target.x) + Math.abs(attacker.y - target.y);
  return distance <= range;
}

// Get Manhattan distance
export function getDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Check line of sight for ranged attacks
export function hasLineOfSight(map, x1, y1, x2, y2) {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  
  let x = x1;
  let y = y1;
  
  while (x !== x2 || y !== y2) {
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
    
    // Skip start and end positions
    if ((x === x1 && y === y1) || (x === x2 && y === y2)) continue;
    
    // Check for walls (0 = wall)
    if (map[y]?.[x] === 0) return false;
  }
  
  return true;
}

// Get valid ranged targets
export function getRangedTargets(player, enemies, map, equipment) {
  const range = getWeaponRange(equipment);
  if (range === 0) return [];
  
  return enemies.filter(enemy => {
    const dist = getDistance(player, enemy);
    return dist <= range && dist > 0 && hasLineOfSight(map, player.x, player.y, enemy.x, enemy.y);
  });
}

// Execute ranged attack
export function executeRangedAttack(player, target, equipment, playerStats, map) {
  const range = getWeaponRange(equipment);
  const dist = getDistance(player, target);
  
  if (dist > range) {
    return { success: false, message: '¡Objetivo fuera de rango!' };
  }
  
  if (!hasLineOfSight(map, player.x, player.y, target.x, target.y)) {
    return { success: false, message: '¡Sin línea de visión!' };
  }
  
  // Calculate damage with range penalty
  const rangePenalty = Math.max(0, (dist - 2) * 0.05); // 5% less damage per tile after 2
  const baseDamage = playerStats.attack;
  const damage = Math.max(1, Math.floor(baseDamage * (1 - rangePenalty) - (target.defense || 0)));
  
  // Critical hit chance
  const critChance = (playerStats.critChance || 5) / 100;
  const isCrit = Math.random() < critChance;
  const finalDamage = isCrit ? Math.floor(damage * 1.5) : damage;
  
  return {
    success: true,
    hit: true,
    damage: finalDamage,
    isCrit,
    message: isCrit 
      ? `¡CRÍTICO! Disparo inflige ${finalDamage} de daño!` 
      : `Disparo inflige ${finalDamage} de daño.`,
  };
}

// Calculate melee damage
export function calculateMeleeDamage(attacker, defender, attackerStats) {
  const baseDamage = attackerStats.attack || attacker.attack || 5;
  const defense = defender.defense || 0;
  const variance = Math.floor(Math.random() * 4) - 1; // -1 to +3
  
  const damage = Math.max(1, baseDamage - defense + variance);
  
  // Critical hit
  const critChance = (attackerStats.critChance || 5) / 100;
  const isCrit = Math.random() < critChance;
  
  return {
    damage: isCrit ? Math.floor(damage * 1.5) : damage,
    isCrit,
  };
}

// Enemy ranged attack types
export const ENEMY_RANGED_TYPES = {
  // Spellcasters
  15: { range: 5, type: 'magic', color: '#a855f7' }, // Cultist
  10: { range: 6, type: 'magic', color: '#6366f1' }, // Wraith
  104: { range: 7, type: 'magic', color: '#06b6d4' }, // Lich
  
  // Ranged attackers
  7: { range: 4, type: 'poison', color: '#22c55e' }, // Spider (web/poison)
  11: { range: 5, type: 'fire', color: '#ef4444' }, // Demon
  12: { range: 6, type: 'fire', color: '#f59e0b' }, // Dragon
  106: { range: 8, type: 'fire', color: '#fbbf24' }, // Ancient Dragon
  105: { range: 6, type: 'dark', color: '#7f1d1d' }, // Demon Lord
};

// Check if enemy has ranged attack
export function isEnemyRanged(enemyType) {
  return !!ENEMY_RANGED_TYPES[enemyType];
}

// Get enemy attack range
export function getEnemyAttackRange(enemyType) {
  return ENEMY_RANGED_TYPES[enemyType]?.range || 1;
}

// Process enemy ranged attack
export function processEnemyRangedAttack(enemy, player, map) {
  const rangedInfo = ENEMY_RANGED_TYPES[enemy.type];
  if (!rangedInfo) return null;
  
  const dist = getDistance(enemy, player);
  if (dist > rangedInfo.range || dist < 2) return null;
  
  if (!hasLineOfSight(map, enemy.x, enemy.y, player.x, player.y)) return null;
  
  // Ranged attack damage (slightly lower than melee)
  const damage = Math.floor(enemy.attack * 0.8);
  
  return {
    type: 'ranged',
    attackType: rangedInfo.type,
    damage,
    color: rangedInfo.color,
  };
}

// Class-specific combat bonuses
export const CLASS_COMBAT_BONUSES = {
  warrior: {
    meleeDamageBonus: 0.15, // +15% melee damage
    armorBonus: 0.10, // +10% defense from armor
    blockChance: 0.10, // 10% chance to block
  },
  mage: {
    magicDamageBonus: 0.25, // +25% magic/skill damage
    rangedBonus: 0.10, // +10% ranged damage
    manaRegen: 1, // Not used yet but for future
  },
  rogue: {
    critBonus: 0.15, // +15% crit chance
    evasionBonus: 0.10, // +10% evasion
    backstabBonus: 0.30, // +30% damage from behind (stunned enemies)
  },
};

// Apply class bonuses to damage
export function applyClassBonus(damage, playerClass, attackType, isEnemyVulnerable = false) {
  const bonuses = CLASS_COMBAT_BONUSES[playerClass];
  if (!bonuses) return damage;
  
  let multiplier = 1;
  
  if (attackType === 'melee' && bonuses.meleeDamageBonus) {
    multiplier += bonuses.meleeDamageBonus;
  }
  if (attackType === 'ranged' && bonuses.rangedBonus) {
    multiplier += bonuses.rangedBonus;
  }
  if (attackType === 'magic' && bonuses.magicDamageBonus) {
    multiplier += bonuses.magicDamageBonus;
  }
  if (isEnemyVulnerable && bonuses.backstabBonus) {
    multiplier += bonuses.backstabBonus;
  }
  
  return Math.floor(damage * multiplier);
}

// Calculate effective defense with class bonuses
export function calculateEffectiveDefense(baseDefense, playerClass, equipment) {
  const bonuses = CLASS_COMBAT_BONUSES[playerClass];
  let defense = baseDefense;
  
  if (bonuses?.armorBonus && equipment) {
    const equipStats = calculateEquipmentStats(equipment);
    defense += Math.floor(equipStats.defense * bonuses.armorBonus);
  }
  
  return defense;
}