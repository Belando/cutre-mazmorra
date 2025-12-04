// Sistema de Combate: Daño, Rango y Visión
// ==========================================

import { getWeaponRange, calculateEquipmentStats } from './EquipmentSystem';

// Calcular si el objetivo está dentro del rango
export function isInRange(attacker, target, range) {
  const distance = Math.abs(attacker.x - target.x) + Math.abs(attacker.y - target.y);
  return distance <= range;
}

// Obtener distancia Manhattan (movimiento en cuadrícula)
export function getDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Comprobar línea de visión (Algoritmo Bresenham simplificado)
// Retorna false si hay una pared (0) en el camino
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
    
    // Saltar posiciones de inicio y fin (no nos bloqueamos a nosotros mismos ni al objetivo)
    if ((x === x1 && y === y1) || (x === x2 && y === y2)) continue;
    
    // 0 = Pared
    if (map[y]?.[x] === 0) return false;
  }
  
  return true;
}

// Obtener objetivos válidos para ataque a distancia
export function getRangedTargets(player, enemies, map, equipment) {
  const range = getWeaponRange(equipment);
  if (range === 0) return []; // Es un arma cuerpo a cuerpo
  
  return enemies.filter(enemy => {
    const dist = getDistance(player, enemy);
    return dist <= range && dist > 0 && hasLineOfSight(map, player.x, player.y, enemy.x, enemy.y);
  });
}

// Ejecutar ataque a distancia del jugador
export function executeRangedAttack(player, target, equipment, playerStats, map) {
  const range = getWeaponRange(equipment);
  const dist = getDistance(player, target);
  
  if (dist > range) {
    return { success: false, message: '¡Objetivo fuera de rango!' };
  }
  
  if (!hasLineOfSight(map, player.x, player.y, target.x, target.y)) {
    return { success: false, message: '¡Sin línea de visión!' };
  }
  
  // Calcular daño con penalización por distancia
  // 5% menos de daño por cada casilla más allá de 2
  const rangePenalty = Math.max(0, (dist - 2) * 0.05); 
  const baseDamage = playerStats.attack;
  
  // Fórmula de daño final
  const damage = Math.max(1, Math.floor(baseDamage * (1 - rangePenalty) - (target.defense || 0)));
  
  // Probabilidad de crítico
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

// Calcular daño cuerpo a cuerpo (Melee)
export function calculateMeleeDamage(attacker, defender, attackerStats) {
  const baseDamage = attackerStats.attack || attacker.attack || 5;
  const defense = defender.defense || 0;
  
  // Variación aleatoria de daño (-1 a +3)
  const variance = Math.floor(Math.random() * 4) - 1; 
  
  const damage = Math.max(1, baseDamage - defense + variance);
  
  // Crítico
  const critChance = (attackerStats.critChance || 5) / 100;
  const isCrit = Math.random() < critChance;
  
  return {
    damage: isCrit ? Math.floor(damage * 1.5) : damage,
    isCrit,
  };
}

// Tipos de ataques a distancia enemigos
export const ENEMY_RANGED_TYPES = {
  // Magos
  15: { range: 5, type: 'magic', color: '#a855f7' }, // Cultista
  10: { range: 6, type: 'magic', color: '#6366f1' }, // Espectro
  104: { range: 7, type: 'magic', color: '#06b6d4' }, // Liche
  
  // Físicos / Elementales
  7: { range: 4, type: 'poison', color: '#22c55e' }, // Araña (Veneno)
  11: { range: 5, type: 'fire', color: '#ef4444' }, // Demonio
  12: { range: 6, type: 'fire', color: '#f59e0b' }, // Dragón
  106: { range: 8, type: 'fire', color: '#fbbf24' }, // Dragón Ancestral
  105: { range: 6, type: 'dark', color: '#7f1d1d' }, // Señor Demonio
};

// Utilidades para IA enemiga
export function isEnemyRanged(enemyType) {
  return !!ENEMY_RANGED_TYPES[enemyType];
}

export function getEnemyAttackRange(enemyType) {
  return ENEMY_RANGED_TYPES[enemyType]?.range || 1;
}

// Procesar ataque a distancia de un enemigo hacia el jugador
export function processEnemyRangedAttack(enemy, player, map) {
  const rangedInfo = ENEMY_RANGED_TYPES[enemy.type];
  if (!rangedInfo) return null;
  
  const dist = getDistance(enemy, player);
  // Si está muy lejos o muy cerca (melee), no dispara
  if (dist > rangedInfo.range || dist < 2) return null;
  
  if (!hasLineOfSight(map, enemy.x, enemy.y, player.x, player.y)) return null;
  
  // El daño a distancia suele ser un 80% del ataque base
  const damage = Math.floor(enemy.attack * 0.8);
  
  return {
    type: 'ranged',
    attackType: rangedInfo.type,
    damage,
    color: rangedInfo.color,
  };
}

// Bonificaciones de combate por Clase
export const CLASS_COMBAT_BONUSES = {
  warrior: {
    meleeDamageBonus: 0.15, // +15% daño melee
    armorBonus: 0.10,       // +10% defensa de armadura
    blockChance: 0.10,      // 10% probabilidad de bloqueo (futuro)
  },
  mage: {
    magicDamageBonus: 0.25, // +25% daño mágico
    rangedBonus: 0.10,      // +10% daño distancia
    manaRegen: 1, 
  },
  rogue: {
    critBonus: 0.15,        // +15% probabilidad crítico
    evasionBonus: 0.10,     // +10% evasión
    backstabBonus: 0.30,    // +30% daño por la espalda (o a aturdidos)
  },
};

// Aplicar bonos de clase al daño final
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

// Calcular defensa efectiva con bonos
export function calculateEffectiveDefense(baseDefense, playerClass, equipment) {
  const bonuses = CLASS_COMBAT_BONUSES[playerClass];
  let defense = baseDefense;
  
  if (bonuses?.armorBonus && equipment) {
    const equipStats = calculateEquipmentStats(equipment);
    defense += Math.floor(equipStats.defense * bonuses.armorBonus);
  }
  
  return defense;
}