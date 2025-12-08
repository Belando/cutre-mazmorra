import { calculatePlayerStats } from './ItemSystem';
import { calculateBuffBonuses } from './SkillSystem';
import { getWeaponRange, calculateEquipmentStats } from './EquipmentSystem';
import { TILE } from '@/data/constants';

// --- UTILIDADES BÁSICAS Y VISIÓN ---

// Calcular distancia Manhattan (movimiento en cuadrícula)
export function getDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Calcular distancia Euclidiana (real, para radios de visión/rango preciso)
export function getEuclideanDistance(a, b) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

// Comprobar si el objetivo está dentro del rango
export function isInRange(attacker, target, range) {
  return getDistance(attacker, target) <= range;
}

// Comprobar línea de visión (Algoritmo Bresenham)
// Retorna false si hay una pared (0) en el camino
// Comprobar línea de visión (Algoritmo Bresenham Mejorado)
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
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
    
    // Si alcanzamos el destino, paramos (para permitir atacar a alguien QUE ESTÁ en una puerta)
    if (x === x2 && y === y2) break; 
    
    const tile = map[y]?.[x];
    
    // BLOQUEO: Si es Muro (0) o Puerta Cerrada (3)
    // TILE.WALL = 0, TILE.DOOR = 3
    if (tile === TILE.WALL || tile === TILE.DOOR) return false; 
  }
  return true;
}

// Obtener la trayectoria del proyectil (útil para animaciones)
// (Traído de RangedCombat.jsx)
export function getProjectilePath(x1, y1, x2, y2, map, maxRange = 8) {
  const path = [];
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  
  let x = x1;
  let y = y1;
  let distance = 0;
  
  while (distance < maxRange) {
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
    
    distance++;
    if (x === x1 && y === y1) continue;
    if (map[y]?.[x] === 0) break; // Choca con pared
    
    path.push({ x, y, distance });
    if (x === x2 && y === y2) break; // Llega al objetivo
  }
  return path;
}

// --- COMBATE DEL JUGADOR ---

// Obtener enemigos válidos para atacar a distancia
export function getRangedTargets(player, enemies, map, equipment) {
  const range = getWeaponRange(equipment);
  if (range === 0) return []; 
  
  return enemies.filter(enemy => {
    const dist = getDistance(player, enemy);
    return dist <= range && dist > 0 && hasLineOfSight(map, player.x, player.y, enemy.x, enemy.y);
  }).sort((a, b) => getDistance(player, a) - getDistance(player, b));
}

// Ejecutar ataque a distancia
export function executeRangedAttack(player, target, equipment, playerStats, map) {
  const range = getWeaponRange(equipment);
  const dist = getDistance(player, target);
  
  if (dist > range) return { success: false, message: '¡Fuera de rango!' };
  if (!hasLineOfSight(map, player.x, player.y, target.x, target.y)) return { success: false, message: '¡Sin visión!' };
  
  // Penalización por distancia
  const rangePenalty = Math.max(0, (dist - 2) * 0.05); 
  const baseDamage = playerStats.attack;
  
  const damage = Math.max(1, Math.floor(baseDamage * (1 - rangePenalty) - (target.defense || 0)));
  
  const critChance = (playerStats.critChance || 5) / 100;
  const isCrit = Math.random() < critChance;
  const finalDamage = isCrit ? Math.floor(damage * 1.5) : damage;
  
  return {
    success: true,
    hit: true,
    damage: finalDamage,
    isCrit,
    message: isCrit ? `¡CRÍTICO! Disparo inflige ${finalDamage}!` : `Disparo inflige ${finalDamage} daño.`,
    path: getProjectilePath(player.x, player.y, target.x, target.y, map)
  };
}

// Calcular daño cuerpo a cuerpo
export function calculateMeleeDamage(attacker, defender, attackerStats) {
  const baseDamage = attackerStats.attack || attacker.attack || 5;
  const defense = defender.defense || 0;
  
  const variance = Math.floor(Math.random() * 3) - 1; 
  const damage = Math.max(1, baseDamage - defense + variance);
  
  const critChance = (attackerStats.critChance || 5) / 100;
  const isCrit = Math.random() < critChance;
  
  return {
    damage: isCrit ? Math.floor(damage * 1.5) : damage,
    isCrit,
  };
}

export function calculatePlayerHit(player, targetEnemy) {
  // 1. Obtener stats base + equipo
  const stats = calculatePlayerStats(player);
  
  // 2. Aplicar buffs activos
  const buffs = calculateBuffBonuses(player.skills?.buffs || [], stats);
  
  // 3. Stats finales
  const attack = stats.attack + buffs.attackBonus;
  const critChance = (stats.critChance || 5) + (buffs.critChance || 0); // Asumiendo que añades critChance
  
  // 4. Cálculo de daño
  const defense = targetEnemy.defense || 0;
  const variance = Math.floor(Math.random() * 3); // Variación 0-2
  let damage = Math.max(1, attack - defense + variance);
  
  // 5. Crítico
  const isCrit = Math.random() * 100 < critChance;
  if (isCrit) {
    damage = Math.floor(damage * 1.5);
  }
  
  return { damage, isCrit };
}

// --- COMBATE ENEMIGO ---

export const ENEMY_RANGED_TYPES = {
  15: { range: 5, type: 'magic', color: '#a855f7' }, // Cultista
  10: { range: 6, type: 'magic', color: '#6366f1' }, // Espectro
  104: { range: 7, type: 'magic', color: '#06b6d4' }, // Liche
  7: { range: 4, type: 'poison', color: '#22c55e' }, // Araña
  11: { range: 5, type: 'fire', color: '#ef4444' }, // Demonio
  12: { range: 6, type: 'fire', color: '#f59e0b' }, // Dragón
  106: { range: 8, type: 'fire', color: '#fbbf24' }, // Dragón Ancestral
  105: { range: 6, type: 'dark', color: '#7f1d1d' }, // Señor Demonio
};

export function isEnemyRanged(enemyType) { return !!ENEMY_RANGED_TYPES[enemyType]; }
export function getEnemyAttackRange(enemyType) { return ENEMY_RANGED_TYPES[enemyType]?.range || 1; }

export function processEnemyRangedAttack(enemy, player, map) {
  const info = ENEMY_RANGED_TYPES[enemy.type];
  if (!info) return null;
  
  const dist = getDistance(enemy, player);
  if (dist > info.range || dist < 2) return null;
  if (!hasLineOfSight(map, enemy.x, enemy.y, player.x, player.y)) return null;
  
  const damage = Math.floor(enemy.attack * 0.8);
  return { type: 'ranged', attackType: info.type, damage, color: info.color };
}

// --- SISTEMA TÁCTICO (Traído de RangedCombat) ---

// Evaluar qué tan buena es una posición para cubrirse
export function evaluateTacticalPosition(x, y, enemies, map) {
  let score = 0;
  
  // 1. Cobertura (paredes adyacentes)
  const adj = [[0,1],[0,-1],[1,0],[-1,0]];
  let walls = 0;
  adj.forEach(([dx, dy]) => { if (map[y+dy]?.[x+dx] === 0) walls++; });
  
  if (walls === 1 || walls === 2) score += 20; // Buena cobertura parcial
  if (walls >= 3) score -= 30; // Arrinconado (peligroso)
  
  // 2. Distancia a enemigos (preferimos rango medio)
  enemies.forEach(e => {
      const d = Math.abs(e.x - x) + Math.abs(e.y - y);
      if (d <= 1) score -= 50; // Muy cerca, peligro
      else if (d <= 3) score -= 10;
      else if (d <= 6) score += 10; // Rango ideal
  });
  
  return score;
}

// Encontrar las mejores posiciones tácticas cercanas
export function findTacticalPositions(entity, enemies, map, radius = 3) {
  const positions = [];
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = entity.x + dx;
      const y = entity.y + dy;
      
      // Si es suelo transitable y no hay enemigos
      if (map[y]?.[x] === 1 && !enemies.some(e => e.x === x && e.y === y)) {
        const score = evaluateTacticalPosition(x, y, enemies, map);
        positions.push({ x, y, score });
      }
    }
  }
  
  // Devolver las 5 mejores posiciones
  return positions.sort((a, b) => b.score - a.score).slice(0, 5);
}

// --- BONIFICACIONES DE CLASE ---

export const CLASS_COMBAT_BONUSES = {
  warrior: { meleeDamageBonus: 0.15, armorBonus: 0.10 },
  mage: { magicDamageBonus: 0.25, rangedBonus: 0.10 },
  rogue: { critBonus: 0.15, evasionBonus: 0.10, backstabBonus: 0.30 },
};

export function applyClassBonus(damage, playerClass, attackType, isVulnerable = false) {
  const bonuses = CLASS_COMBAT_BONUSES[playerClass];
  if (!bonuses) return damage;
  
  let mult = 1;
  if (attackType === 'melee' && bonuses.meleeDamageBonus) mult += bonuses.meleeDamageBonus;
  if (attackType === 'ranged' && bonuses.rangedBonus) mult += bonuses.rangedBonus;
  if (attackType === 'magic' && bonuses.magicDamageBonus) mult += bonuses.magicDamageBonus;
  if (isVulnerable && bonuses.backstabBonus) mult += bonuses.backstabBonus;
  
  return Math.floor(damage * mult);
}

export function calculateEffectiveDefense(baseDef, playerClass, equipment) {
  const bonuses = CLASS_COMBAT_BONUSES[playerClass];
  let defense = baseDef;
  
  if (bonuses?.armorBonus && equipment) {
    const eqStats = calculateEquipmentStats(equipment);
    defense += Math.floor(eqStats.defense * bonuses.armorBonus);
  }
  
  return defense;
}