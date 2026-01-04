import { calculatePlayerStats } from './ItemSystem';
import { calculateBuffBonuses } from './SkillSystem';
import { getWeaponRange, calculateEquipmentStats } from './EquipmentSystem';
// IMPORTAMOS las utilidades centralizadas
import {
  getDistance,
  hasLineOfSight,
  getProjectilePath
} from '@/engine/core/utils';
import { ENTITY } from '@/data/constants';
import { Entity, Stats, Buff, Player, Enemy, EquipmentState, AttackResult } from '@/types';

// --- COMBATE DEL JUGADOR ---

/**
 * Filters enemies to find those within range and line of sight.
 * @param player The player entity acting as the source
 * @param enemies List of potential targets
 * @param map Terrain map for Line of Sight checks
 * @param equipment Current equipment to determine weapon range
 */
export function getRangedTargets(player: Player, enemies: Enemy[], map: number[][], equipment: EquipmentState): Enemy[] {
  const range = getWeaponRange(equipment);
  if (range === 0) return [];

  return enemies.filter(enemy => {
    const dist = getDistance(player, enemy);
    return dist <= range && dist > 0 && hasLineOfSight(map, player.x, player.y, enemy.x, enemy.y);
  }).sort((a, b) => getDistance(player, a) - getDistance(player, b));
}

// AttackResult imported from @/types

/**
 * Executes a ranged attack against a specific target.
 * Calculates hit chance, damage, and crit chance based on stats and distance.
 * @param player The attacker
 * @param target The victim
 * @param equipment Equipment for range calculations
 * @param playerStats Aggregated player stats
 * @param map Map for LoS verification
 */
export function executeRangedAttack(player: Player, target: Enemy, equipment: EquipmentState, playerStats: Stats, map: number[][]): AttackResult {
  const range = getWeaponRange(equipment);
  const dist = getDistance(player, target);

  if (dist > range) return { success: false, hit: false, damage: 0, isCritical: false, isKill: false, evaded: false, message: 'OUT_OF_RANGE' };
  if (!hasLineOfSight(map, player.x, player.y, target.x, target.y)) return { success: false, hit: false, damage: 0, isCritical: false, isKill: false, evaded: false, message: 'NO_LOS' };

  // Penalización por distancia
  const rangePenalty = Math.max(0, (dist - 2) * 0.05);

  let attackPower = playerStats.attack || 0;
  if (player.class && ['mage', 'arcane', 'druid'].includes(player.class)) {
    attackPower = playerStats.magicAttack || 0;
  }

  const baseDamage = attackPower;
  const defense = target.stats?.defense || 0;
  const damage = Math.max(1, Math.floor(baseDamage * (1 - rangePenalty) - defense));

  const critChance = (playerStats.critChance || 5) / 100;
  const isCritical = Math.random() < critChance;
  const finalDamage = isCritical ? Math.floor(damage * 1.5) : damage;

  return {
    success: true,
    hit: true,
    damage: finalDamage,
    isCritical: isCritical,
    isKill: false,
    evaded: false,
    message: isCritical ? 'CRITICAL_HIT' : 'HIT',
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
export function calculateMeleeDamage(attacker: Entity, defender: Entity, attackerStats: Stats): { damage: number, isCritical: boolean } {
  const baseDamage = attackerStats.attack || attacker.stats?.attack || 5;
  const defense = defender.stats?.defense || 0;

  const variance = Math.floor(Math.random() * 3) - 1;
  const damage = Math.max(1, baseDamage - defense + variance);

  const critChance = (attackerStats.critChance || 5) / 100;
  const isCritical = Math.random() < critChance;

  return {
    damage: isCritical ? Math.floor(damage * 1.5) : damage,
    isCritical,
  };
}

/**
 * Calculates damage for a player's melee hit, considering stats, buffs, and class bonuses.
 * @param player The attacking player
 * @param targetEnemy The target enemy
 */
export function calculatePlayerHit(player: Player, targetEnemy: Enemy): { damage: number, isCritical: boolean, type: string } {
  const stats = calculatePlayerStats(player);
  const buffs = calculateBuffBonuses(player.skills?.buffs || [], stats);

  let attackPower = (stats.attack || 0) + (buffs.attackBonus || 0);
  let damageType = 'physical';

  if (player.class && ['mage', 'arcane', 'druid'].includes(player.class)) {
    attackPower = (stats.magicAttack || 0) + (buffs.magicAttackBonus || 0);
    damageType = 'magical';
  }

  const critChance = ((stats.critChance || 5) + (buffs.critChance || 0)) / 100;
  const enemyDef = targetEnemy.stats?.defense || 0;

  const variance = Math.floor(Math.random() * 3);
  let damage = Math.max(1, attackPower - enemyDef + variance);

  const isCritical = Math.random() < critChance;
  if (isCritical) {
    damage = Math.floor(damage * 1.5);
  }

  return { damage, isCritical, type: damageType };
}

// --- COMBATE ENEMIGO ---

interface RangedEnemyInfo {
  range: number;
  type: string;
  color: string;
}

export const ENEMY_RANGED_TYPES: Record<string, RangedEnemyInfo> = {
  [ENTITY.ENEMY_CULTIST]: { range: 5, type: 'magic', color: '#a855f7' }, // Cultista
  [ENTITY.ENEMY_WRAITH]: { range: 6, type: 'magic', color: '#6366f1' }, // Espectro
  [ENTITY.BOSS_LICH]: { range: 7, type: 'magic', color: '#06b6d4' }, // Liche
  [ENTITY.ENEMY_SPIDER]: { range: 4, type: 'poison', color: '#22c55e' }, // Araña
  [ENTITY.ENEMY_DEMON]: { range: 5, type: 'fire', color: '#ef4444' }, // Demonio
  [ENTITY.ENEMY_DRAGON]: { range: 6, type: 'fire', color: '#f59e0b' }, // Dragón
  [ENTITY.BOSS_ANCIENT_DRAGON]: { range: 8, type: 'fire', color: '#fbbf24' }, // Dragón Ancestral
  [ENTITY.BOSS_DEMON_LORD]: { range: 6, type: 'dark', color: '#7f1d1d' }, // Señor Demonio
};

export function isEnemyRanged(enemyType: string | number): boolean { return !!ENEMY_RANGED_TYPES[String(enemyType)]; }
export function getEnemyAttackRange(enemyType: string | number): number { return ENEMY_RANGED_TYPES[String(enemyType)]?.range || 1; }

export function processEnemyRangedAttack(enemy: Entity, player: Entity, map: number[][]): AttackResult | null {
  const info = ENEMY_RANGED_TYPES[String(enemy.type)];
  if (!info) return null;

  const dist = getDistance(enemy, player);
  if (dist > info.range || dist < 2) return null;
  if (!hasLineOfSight(map, enemy.x, enemy.y, player.x, player.y)) return null;

  const enemyAtk = enemy.stats?.attack || 0;
  const damage = Math.floor(enemyAtk * 0.8);
  return {
    type: 'ranged',
    attackType: info.type,
    damage,
    color: info.color,
    success: true,
    hit: true,
    isCritical: false,
    isKill: false,
    evaded: false
  };
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

  const isMagicEnemy = ([
    ENTITY.ENEMY_WRAITH,
    ENTITY.ENEMY_DEMON,
    ENTITY.ENEMY_DRAGON,
    ENTITY.ENEMY_CULTIST,
    ENTITY.BOSS_LICH,
    ENTITY.BOSS_DEMON_LORD
  ] as number[]).includes(Number(enemy.type));
  const defense = isMagicEnemy ? magicDef : physDef;

  const enemyAtk = enemy.stats?.attack || enemy.stats?.magicAttack || 5;
  let baseDamage = Math.max(1, enemyAtk - defense);
  baseDamage += Math.floor(Math.random() * 3);

  const evasionBonus = playerBuffs.reduce((sum, b) => sum + (b.evasion || 0), 0);
  if (evasionBonus > 0 && Math.random() < evasionBonus * 0.5) {
    return {
      success: true,
      hit: false,
      damage: 0,
      isCritical: false,
      isKill: false,
      evaded: true
    };
  }

  const absorbPercent = playerBuffs.reduce((sum, b) => sum + (b.absorb || 0), 0);
  if (absorbPercent > 0) {
    baseDamage = Math.floor(baseDamage * (1 - absorbPercent));
  }

  return {
    success: true,
    hit: true,
    damage: Math.max(1, baseDamage),
    isCritical: false,
    isKill: false,
    evaded: false
  };
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

interface ClassBonus {
  meleeDamageBonus?: number;
  armorBonus?: number;
  magicDamageBonus?: number;
  rangedBonus?: number;
  critBonus?: number;
  evasionBonus?: number;
  backstabBonus?: number;
}

export const CLASS_COMBAT_BONUSES: Record<string, ClassBonus> = {
  warrior: { meleeDamageBonus: 0.15, armorBonus: 0.10 },
  mage: { magicDamageBonus: 0.25, rangedBonus: 0.10 },
  rogue: { critBonus: 0.15, evasionBonus: 0.10, backstabBonus: 0.30 },
};

export function applyClassBonus(damage: number, playerClass: string, attackType: string, isVulnerable = false): number {
  const bonuses = CLASS_COMBAT_BONUSES[playerClass];
  if (!bonuses) return damage;

  let mult = 1;
  if (attackType === 'melee' && bonuses.meleeDamageBonus) mult += bonuses.meleeDamageBonus;
  if (attackType === 'ranged' && bonuses.rangedBonus) mult += bonuses.rangedBonus;
  if (attackType === 'magic' && bonuses.magicDamageBonus) mult += bonuses.magicDamageBonus;
  if (isVulnerable && bonuses.backstabBonus) mult += bonuses.backstabBonus;

  return Math.floor(damage * mult);
}

export function calculateEffectiveDefense(baseDef: number, playerClass: string, equipment: EquipmentState): number {
  const bonuses = CLASS_COMBAT_BONUSES[playerClass];
  let defense = baseDef;

  if (bonuses?.armorBonus && equipment) {
    const eqStats = calculateEquipmentStats(equipment);
    defense += Math.floor((eqStats.defense || 0) * bonuses.armorBonus);
  }

  return defense;
}