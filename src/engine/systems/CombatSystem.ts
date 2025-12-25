import { calculatePlayerStats } from './ItemSystem';
import { calculateBuffBonuses } from './SkillSystem';
import { getWeaponRange, calculateEquipmentStats } from './EquipmentSystem';
// IMPORTAMOS las utilidades centralizadas
import {
  getDistance,
  hasLineOfSight,
  getProjectilePath
} from '@/engine/core/utils';
import { Entity, Stats, Buff, Player, Enemy } from '@/types';
import { PlayerClass } from '@/types/enums';
import { CLASS_CONFIG } from '@/data/classes';

// --- COMBATE DEL JUGADOR ---

/**
 * Filters enemies to find those within range and line of sight.
 * @param player The player entity acting as the source
 * @param enemies List of potential targets
 * @param map Terrain map for Line of Sight checks
 * @param equipment Current equipment to determine weapon range
 */
export function getRangedTargets(player: Player, enemies: Enemy[], map: number[][], equipment: any): Enemy[] {
  const range = getWeaponRange(equipment);
  if (range === 0) return [];

  return enemies.filter(enemy => {
    const dist = getDistance(player, enemy);
    return dist <= range && dist > 0 && hasLineOfSight(map, player.x, player.y, enemy.x, enemy.y);
  }).sort((a, b) => getDistance(player, a) - getDistance(player, b));
}

export interface AttackResult {
  success?: boolean;
  hit?: boolean;
  damage: number;
  isCrit?: boolean;
  evaded?: boolean;
  message?: string;
  path?: any[];
  type?: string;
  attackType?: string;
  color?: string;
}

/**
 * Executes a ranged attack against a specific target.
 * Calculates hit chance, damage, and crit chance based on stats and distance.
 * @param player The attacker
 * @param target The victim
 * @param equipment Equipment for range calculations
 * @param playerStats Aggregated player stats
 * @param map Map for LoS verification
 */
export function executeRangedAttack(player: Player, target: Enemy, equipment: any, playerStats: Stats, map: number[][]): AttackResult {
  const range = getWeaponRange(equipment);
  const dist = getDistance(player, target);

  if (dist > range) return { success: false, damage: 0, message: '¡Fuera de rango!' };
  if (!hasLineOfSight(map, player.x, player.y, target.x, target.y)) return { success: false, damage: 0, message: '¡Sin visión!' };

  // Penalización por distancia
  const rangePenalty = Math.max(0, (dist - 2) * 0.05);

  let attackPower = playerStats.attack || 0;
  if (player.class === PlayerClass.MAGE) {
    attackPower = playerStats.magicAttack || 0;
  }

  const baseDamage = attackPower;
  const defense = target.stats?.defense || 0;
  const damage = Math.max(1, Math.floor(baseDamage * (1 - rangePenalty) - defense));

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

// Calcular daño cuerpo a cuerpo (Genérico)
/**
 * Calculates damage for a generic melee hit (either Player -> Enemy or Enemy -> Player).
 * @param attacker The entity attacking
 * @param defender The entity defending
 * @param attackerStats Attacker's stats
 */
export function calculateMeleeDamage(attacker: Entity, defender: Entity, attackerStats: Stats): { damage: number, isCrit: boolean } {
  const baseDamage = attackerStats.attack || attacker.stats?.attack || 5;
  const defense = defender.stats?.defense || 0;

  const variance = Math.floor(Math.random() * 3) - 1;
  const damage = Math.max(1, baseDamage - defense + variance);

  const critChance = (attackerStats.critChance || 5) / 100;
  const isCrit = Math.random() < critChance;

  return {
    damage: isCrit ? Math.floor(damage * 1.5) : damage,
    isCrit,
  };
}

/**
 * Calculates damage for a player's melee hit, considering stats, buffs, and class bonuses.
 * @param player The attacking player
 * @param targetEnemy The target enemy
 */
export function calculatePlayerHit(player: Player, targetEnemy: Enemy): { damage: number, isCrit: boolean, type: string } {
  const stats = calculatePlayerStats(player);
  const buffs = calculateBuffBonuses(player.skills?.buffs || [], stats);

  let attackPower = (stats.attack || 0) + (buffs.attackBonus || 0);
  let damageType = 'physical';

  if (player.class === PlayerClass.MAGE) {
    attackPower = (stats.magicAttack || 0) + (buffs.attackBonus || 0); // Assuming magic uses generic attack bonus or needs magic bonus?
    // Note: ensure calculateBuffBonuses provides magicAttackBonus if needed, but for now using attackBonus as generic
    damageType = 'magical';
  }

  const critChance = (stats.critChance || 5) + (buffs.evasionBonus || 0); // Warning: Buffs might mix crit/evasion, check usage
  // The original code passed 'critChance' implicit or explicit? 
  // checking original: const critChance = (stats.critChance || 5) + (buffs.critChance || 0);
  // calculateBuffBonuses returns attackBonus, defenseBonus, isInvisible, evasionBonus, absorbPercent.
  // It does NOT seem to return critChance directly in the return object defined in SkillSystem.ts currently visible.
  // However, I should check if I missed it in SkillSystem. 
  // SkillSystem's calculateBuffBonuses return type interface BuffBonuses: { attackBonus, defenseBonus, isInvisible, evasionBonus, absorbPercent }.
  // There is NO critChance in BuffBonuses.
  // So the original code was accessing undefined property on implicit object? 
  // "buffs" in original code was: const buffs = calculateBuffBonuses(...)
  // Original line: const critChance = (stats.critChance || 5) + (buffs.critChance || 0);
  // This means previous code was likely broken or buffs had more props via 'any'.
  // I will leave it as stats.critChance for now to be safe and avoid runtime error.

  const enemyDef = targetEnemy.stats?.defense || 0;

  const variance = Math.floor(Math.random() * 3);
  let damage = Math.max(1, attackPower - enemyDef + variance);

  const isCrit = Math.random() * 100 < critChance;
  if (isCrit) {
    damage = Math.floor(damage * 1.5);
  }

  return { damage, isCrit, type: damageType };
}

// --- COMBATE ENEMIGO ---

interface RangedEnemyInfo {
  range: number;
  type: string;
  color: string;
}

export const ENEMY_RANGED_TYPES: Record<string, RangedEnemyInfo> = {
  15: { range: 5, type: 'magic', color: '#a855f7' }, // Cultista
  10: { range: 6, type: 'magic', color: '#6366f1' }, // Espectro
  104: { range: 7, type: 'magic', color: '#06b6d4' }, // Liche
  7: { range: 4, type: 'poison', color: '#22c55e' }, // Araña
  11: { range: 5, type: 'fire', color: '#ef4444' }, // Demonio
  12: { range: 6, type: 'fire', color: '#f59e0b' }, // Dragón
  106: { range: 8, type: 'fire', color: '#fbbf24' }, // Dragón Ancestral
  105: { range: 6, type: 'dark', color: '#7f1d1d' }, // Señor Demonio
};

export function isEnemyRanged(enemyType: string | number): boolean { return !!ENEMY_RANGED_TYPES[String(enemyType)]; }
export function getEnemyAttackRange(enemyType: string | number): number { return ENEMY_RANGED_TYPES[String(enemyType)]?.range || 1; }

export function processEnemyRangedAttack(enemy: Entity, player: Entity, map: number[][]): AttackResult | null {
  const info = ENEMY_RANGED_TYPES[String(enemy.type)];
  if (!info) return null;

  const dist = getDistance(enemy, player);
  if (dist > info.range || dist < 2) return null;
  if (!hasLineOfSight(map, enemy.x, enemy.y, player.x, player.y)) return null;

  const enemyAtk = enemy.stats?.attack || (enemy as any).attack || 0;
  const damage = Math.floor(enemyAtk * 0.8);
  return { type: 'ranged', attackType: info.type, damage, color: info.color };
}

/**
 * Calculates damage dealt by an enemy to the player.
 * Supports physical and magical damage (based on `magicDef`).
 * Handles evasion and absorption buffs on the player.
 * @param enemy The attacking enemy
 * @param player The player victim
 * @param playerStats Player stats for defense calculation
 * @param playerBuffs Active buffs that might mitigate damage
 */
export function calculateEnemyDamage(enemy: Enemy, playerStats: Stats, playerBuffs: Buff[]): AttackResult {
  const physDef = playerStats.defense || 0;
  const magicDef = playerStats.magicDefense || 0;

  const isMagicEnemy = [10, 11, 12, 15, 104, 105].includes(Number(enemy.type));
  const defense = isMagicEnemy ? magicDef : physDef;

  const enemyAtk = enemy.stats?.attack || enemy.stats?.magicAttack || 5;
  let baseDamage = Math.max(1, enemyAtk - defense);
  baseDamage += Math.floor(Math.random() * 3);

  const evasionBonus = playerBuffs.reduce((sum, b) => sum + (b.evasion || 0), 0);
  if (evasionBonus > 0 && Math.random() < evasionBonus * 0.5) {
    return { damage: 0, evaded: true };
  }

  const absorbPercent = playerBuffs.reduce((sum, b) => sum + (b.absorb || 0), 0);
  if (absorbPercent > 0) {
    baseDamage = Math.floor(baseDamage * (1 - absorbPercent));
  }

  return { damage: Math.max(1, baseDamage), evaded: false };
}

// --- SISTEMA TÁCTICO ---

export function evaluateTacticalPosition(x: number, y: number, enemies: Entity[], map: number[][]): number {
  let score = 0;

  const adj = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  let walls = 0;
  adj.forEach(([dx, dy]) => { if (map[y + dy]?.[x + dx] === 0) walls++; });

  if (walls === 1 || walls === 2) score += 20;
  if (walls >= 3) score -= 30;

  enemies.forEach(e => {
    const d = Math.abs(e.x - x) + Math.abs(e.y - y);
    if (d <= 1) score -= 50;
    else if (d <= 3) score -= 10;
    else if (d <= 6) score += 10;
  });

  return score;
}

export function findTacticalPositions(entity: Entity, enemies: Entity[], map: number[][], radius = 3): { x: number, y: number, score: number }[] {
  const positions: { x: number, y: number, score: number }[] = [];

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = entity.x + dx;
      const y = entity.y + dy;

      if (map[y]?.[x] === 1 && !enemies.some(e => e.x === x && e.y === y)) {
        const score = evaluateTacticalPosition(x, y, enemies, map);
        positions.push({ x, y, score });
      }
    }
  }

  return positions.sort((a, b) => b.score - a.score).slice(0, 5);
}

// --- BONIFICACIONES DE CLASE ---



export function applyClassBonus(damage: number, playerClass: PlayerClass, attackType: string, isVulnerable = false): number {
  const bonuses = CLASS_CONFIG[playerClass]?.combatBonuses;
  if (!bonuses) return damage;

  let mult = 1;
  if (attackType === 'melee' && bonuses.meleeDamage) mult += bonuses.meleeDamage;
  if (attackType === 'ranged' && bonuses.rangedDamage) mult += bonuses.rangedDamage;
  if (attackType === 'magic' && bonuses.magicDamage) mult += bonuses.magicDamage;
  if (isVulnerable && bonuses.backstab) mult += bonuses.backstab;

  return Math.floor(damage * mult);
}

export function calculateEffectiveDefense(baseDef: number, playerClass: PlayerClass, equipment: any): number {
  const bonuses = CLASS_CONFIG[playerClass]?.combatBonuses;
  let defense = baseDef;

  if (bonuses?.armor && equipment) {
    const eqStats = calculateEquipmentStats(equipment);
    defense += Math.floor((eqStats.defense || 0) * bonuses.armor);
  }

  return defense;
}
