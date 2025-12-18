import { calculatePlayerStats } from './ItemSystem';
import { calculateBuffBonuses } from './SkillSystem';
import { getWeaponRange, calculateEquipmentStats } from './EquipmentSystem';
// IMPORTAMOS las utilidades centralizadas
import {
  getDistance,
  isInRange,
  hasLineOfSight,
  getProjectilePath
} from '@/engine/core/utils';
import { Entity, Stats, Buff } from '@/types';

// --- COMBATE DEL JUGADOR ---

// Obtener enemigos válidos para atacar a distancia
export function getRangedTargets(player: Entity, enemies: Entity[], map: number[][], equipment: any): Entity[] {
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

// Ejecutar ataque a distancia
export function executeRangedAttack(player: Entity, target: Entity, equipment: any, playerStats: Stats, map: number[][]): AttackResult {
  const range = getWeaponRange(equipment);
  const dist = getDistance(player, target);

  if (dist > range) return { success: false, damage: 0, message: '¡Fuera de rango!' };
  if (!hasLineOfSight(map, player.x, player.y, target.x, target.y)) return { success: false, damage: 0, message: '¡Sin visión!' };

  // Penalización por distancia
  const rangePenalty = Math.max(0, (dist - 2) * 0.05);

  let attackPower = playerStats.attack || 0;
  if (player.class && ['mage', 'arcane', 'druid'].includes(player.class)) {
    attackPower = playerStats.magicAttack || 0;
  }

  const baseDamage = attackPower;
  const defense = target.defense || 0;
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
export function calculateMeleeDamage(attacker: Entity, defender: Entity, attackerStats: Stats): { damage: number, isCrit: boolean } {
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

// NUEVO: Calcular daño del jugador al golpear
export function calculatePlayerHit(player: Entity, targetEnemy: Entity): { damage: number, isCrit: boolean, type: string } {
  const stats = calculatePlayerStats(player);
  const buffs = calculateBuffBonuses(player.skills?.buffs || [], stats);

  let attackPower = (stats.attack || 0) + (buffs.attackBonus || 0);
  let damageType = 'physical';

  if (player.class && ['mage', 'arcane', 'druid'].includes(player.class)) {
    attackPower = (stats.magicAttack || 0) + (buffs.magicAttackBonus || 0);
    damageType = 'magical';
  }

  const critChance = (stats.critChance || 5) + (buffs.critChance || 0);
  const enemyDef = targetEnemy.defense || 0;

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

  const enemyAtk = enemy.attack || 0;
  const damage = Math.floor(enemyAtk * 0.8);
  return { type: 'ranged', attackType: info.type, damage, color: info.color };
}

export function calculateEnemyDamage(enemy: Entity, player: Entity, playerStats: Stats, playerBuffs: Buff[]): AttackResult {
  const physDef = playerStats.defense || 0;
  const magicDef = playerStats.magicDefense || 0;

  const isMagicEnemy = [10, 11, 12, 15, 104, 105].includes(Number(enemy.type));
  const defense = isMagicEnemy ? magicDef : physDef;

  const enemyAtk = enemy.attack || 0;
  let baseDamage = Math.max(1, enemyAtk - defense);
  baseDamage += Math.floor(Math.random() * 3);

  const evasionBonus = playerBuffs.reduce((sum, b) => sum + (b.evasion || 0), 0);
  if (evasionBonus > 0 && Math.random() < evasionBonus * 0.5) {
    return { damage: 0, evaded: true };
  }

  const absorbPercent = playerBuffs.reduce((sum, b) => sum + ((b as any).absorb || 0), 0);
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

export function calculateEffectiveDefense(baseDef: number, playerClass: string, equipment: any): number {
  const bonuses = CLASS_COMBAT_BONUSES[playerClass];
  let defense = baseDef;

  if (bonuses?.armorBonus && equipment) {
    const eqStats = calculateEquipmentStats(equipment);
    defense += Math.floor((eqStats.defense || 0) * bonuses.armorBonus);
  }

  return defense;
}