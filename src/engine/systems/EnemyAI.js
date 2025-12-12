// src/engine/systems/EnemyAI.js
import { findPath } from '@/engine/core/pathfinding';
import { ENEMY_RANGED_INFO } from '@/data/enemies';
// IMPORTANTE: Ahora importamos desde utils, no de CombatSystem
import { hasLineOfSight } from '@/engine/core/utils'; 
import { TILE } from '@/data/constants';

// Tipos de comportamiento
export const AI_BEHAVIORS = {
  AGGRESSIVE: 'aggressive',
  CAUTIOUS: 'cautious',
  PACK: 'pack',
  AMBUSH: 'ambush',
  BOSS: 'boss',
};

// Asignar comportamiento según tipo de enemigo
export function getEnemyBehavior(enemyType) {
  if (enemyType >= 100) return AI_BEHAVIORS.BOSS;
  
  const behaviors = {
    2: AI_BEHAVIORS.PACK,        // Rata
    3: AI_BEHAVIORS.CAUTIOUS,    // Murciélago
    7: AI_BEHAVIORS.AMBUSH,      // Araña
    10: AI_BEHAVIORS.CAUTIOUS,   // Espectro
    13: AI_BEHAVIORS.PACK,       // Slime
    14: AI_BEHAVIORS.PACK,       // Lobo
    15: AI_BEHAVIORS.CAUTIOUS,   // Cultista
    17: AI_BEHAVIORS.CAUTIOUS,   // Vampiro
    18: AI_BEHAVIORS.AMBUSH,     // Mímico
  };
  
  return behaviors[enemyType] || AI_BEHAVIORS.AGGRESSIVE;
}

export function isRangedEnemy(enemyType) {
  return !!ENEMY_RANGED_INFO[enemyType];
}

export function getEnemyRangedInfo(enemyType) {
  return ENEMY_RANGED_INFO[enemyType] || null;
}

export function getEnemyRange(enemyType) {
    return ENEMY_RANGED_INFO[enemyType]?.range || 1;
}

// --- FUNCIONES DE MOVIMIENTO (OPTIMIZADAS CON SPATIAL HASH) ---

// Comprueba si una casilla está libre de obstáculos
function isTileFree(x, y, map, spatialHash) {
  // 1. Límites del mapa
  if (y < 0 || y >= map.length || x < 0 || x >= map[0].length) return false;

  // 2. Obstáculos estáticos (Muros/Puertas Cerradas)
  const tile = map[y][x];
  const isWalkable = tile === TILE.FLOOR || tile === TILE.STAIRS || tile === TILE.STAIRS_UP || tile === TILE.DOOR_OPEN;
  
  if (!isWalkable) return false;
  
  // 3. Entidades dinámicas (Consulta O(1) al Hash)
  // isBlocked devuelve true si hay Player, Enemy, Chest o NPC
  if (spatialHash.isBlocked(x, y)) return false;
  
  return true;
}

// Calcular posición de flanqueo
function getFlankingPosition(player, allies, enemy, map, spatialHash) {
    const directions = [
      { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
      { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
      { dx: 1, dy: 1 }, { dx: -1, dy: 1 },
      { dx: 1, dy: -1 }, { dx: -1, dy: -1 },
    ];
    
    // Posiciones ocupadas por aliados (para no intentar ir donde ya hay uno)
    // Aunque spatialHash ya bloquea, esto ayuda a la lógica de "flanqueo"
    const occupiedPositions = new Set(allies.map(a => `${a.x},${a.y}`));
    
    for (const dir of directions) {
      const pos = { x: player.x + dir.dx, y: player.y + dir.dy };
      
      // Usamos isTileFree con el hash
      if (isTileFree(pos.x, pos.y, map, spatialHash) && !occupiedPositions.has(`${pos.x},${pos.y}`)) {
        // Es posición de flanqueo si está opuesta a otro aliado
        const isFlank = allies.some(ally => {
          const dx = Math.sign(player.x - ally.x);
          const dy = Math.sign(player.y - ally.y);
          return dir.dx === -dx || dir.dy === -dy;
        });
        if (isFlank) return pos;
      }
    }
    return null;
}

// Moverse lejos del objetivo (Huida/Cautela)
function moveAway(enemy, player, map, spatialHash) {
    const dx = Math.sign(enemy.x - player.x);
    const dy = Math.sign(enemy.y - player.y);
    
    // Intentar moverse en dirección opuesta
    const moves = [
      { x: enemy.x + dx, y: enemy.y },
      { x: enemy.x, y: enemy.y + dy },
      { x: enemy.x + dx, y: enemy.y + dy },
    ];
    
    for (const move of moves) {
      if (isTileFree(move.x, move.y, map, spatialHash)) return move;
    }
    return null;
}
  
// Movimiento lateral (Strafe)
function getLateralMove(enemy, player, map, spatialHash) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    
    // Direcciones perpendiculares
    const lateralMoves = [
      { x: enemy.x - dy, y: enemy.y + dx },
      { x: enemy.x + dy, y: enemy.y - dx },
    ];
    
    if (Math.random() < 0.5) lateralMoves.reverse();
    
    for (const move of lateralMoves) {
      if (isTileFree(move.x, move.y, map, spatialHash)) return move;
    }
    return null;
}

// Movimiento aleatorio (cuando no te ven)
function moveRandomly(enemy, map, spatialHash, player) {
    const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
    const randomDir = dirs[Math.floor(Math.random() * dirs.length)];
    const target = { x: enemy.x + randomDir[0], y: enemy.y + randomDir[1] };
    
    // Evitar pisar al jugador explícitamente si es invisible
    if (target.x === player.x && target.y === player.y) return null;

    if (isTileFree(target.x, target.y, map, spatialHash)) {
        return target;
    }
    return null;
}

// Mover hacia el objetivo usando A* y SpatialHash
function moveToward(enemy, targetX, targetY, map, spatialHash, player) {
  // 1. Intentar encontrar el camino ideal con A*
  const nextStep = findPath(enemy.x, enemy.y, targetX, targetY, map);

  // Si A* encuentra un camino (basado en muros)
  if (nextStep) {
    // 1a. CAMINO LIBRE: Verificamos entidades con el Hash
    if (isTileFree(nextStep.x, nextStep.y, map, spatialHash)) {
      return nextStep;
    }
    
    // 1b. FLOCKING: Si el paso óptimo está bloqueado por otra entidad, buscar adyacente
    const neighbors = [
      { x: enemy.x + 1, y: enemy.y },
      { x: enemy.x - 1, y: enemy.y },
      { x: enemy.x, y: enemy.y + 1 },
      { x: enemy.x, y: enemy.y - 1 }
    ];

    const validMoves = neighbors.filter(pos => isTileFree(pos.x, pos.y, map, spatialHash));

    if (validMoves.length > 0) {
      // Ordenamos las opciones por distancia al objetivo
      validMoves.sort((a, b) => {
        const distA = Math.abs(a.x - targetX) + Math.abs(a.y - targetY);
        const distB = Math.abs(b.x - targetX) + Math.abs(b.y - targetY);
        return distA - distB;
      });
      return validMoves[0];
    }
  }

  // 2. FALLBACK: Movimiento directo si A* falla
  const dx = Math.sign(targetX - enemy.x);
  const dy = Math.sign(targetY - enemy.y);
  
  const simpleMoves = [];
  if (dx !== 0) simpleMoves.push({ x: enemy.x + dx, y: enemy.y });
  if (dy !== 0) simpleMoves.push({ x: enemy.x, y: enemy.y + dy });
  
  for (const move of simpleMoves) {
    if (isTileFree(move.x, move.y, map, spatialHash)) {
      return move;
    }
  }

  return null; // No se puede mover
}

// PROCESO PRINCIPAL: Turno del Enemigo
// Ahora recibe spatialHash en lugar de las listas sueltas
export function processEnemyTurn(enemy, player, enemies, map, visible, log, spatialHash) {
  // 1. Estados alterados
  if (enemy.stunned > 0) {
    enemy.stunned--;
    enemy.lastAction = 'stunned';
    return { action: 'stunned' };
  }
  
  if (enemy.slowed > 0) {
    enemy.slowedTurn = !enemy.slowedTurn;
    enemy.slowed--;
    if (enemy.slowedTurn) {
        enemy.lastAction = 'slowed';
        return { action: 'slowed' };
    }
  }
  
  if (enemy.poisoned > 0) {
    const poisonDmg = enemy.poisonDamage || 3;
    enemy.hp -= poisonDmg;
    enemy.poisoned--;
    if (enemy.hp <= 0) return { action: 'died_poison', damage: poisonDmg };
  }
  
  // 2. Comportamiento
  const behavior = getEnemyBehavior(enemy.type);
  const dist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
  const canSee = visible[enemy.y]?.[enemy.x];
  
  const isPlayerInvisible = player.skills?.buffs?.some(b => b.invisible);
  
  if (isPlayerInvisible) {
      const newPos = moveRandomly(enemy, map, spatialHash, player);
      if (newPos) {
          // ACTUALIZAR HASH AL MOVER
          spatialHash.move(enemy.x, enemy.y, newPos.x, newPos.y, { ...enemy, type: 'enemy' });
          enemy.x = newPos.x;
          enemy.y = newPos.y;
          enemy.lastMoveTime = Date.now(); 
          return { action: 'wander', x: newPos.x, y: newPos.y };
      }
      return { action: 'wait_confused' };
  }
  
  // Ataque cuerpo a cuerpo
  if (dist === 1) return { action: 'melee_attack' };
  
  // Ataque a distancia
  const rangedInfo = getEnemyRangedInfo(enemy.type);
  if (rangedInfo && dist <= rangedInfo.range && dist > 1) {
    if (hasLineOfSight(map, enemy.x, enemy.y, player.x, player.y)) {
      const shouldShoot = !rangedInfo.preferMelee || Math.random() < 0.3 || dist > 3;
      if (shouldShoot) return { action: 'ranged_attack', range: rangedInfo.range };
    }
  }
  
  // 3. Movimiento Estándar
  let newPos = null;
  
  switch (behavior) {
    case AI_BEHAVIORS.AGGRESSIVE:
      if (canSee || dist <= 10) {
        newPos = moveToward(enemy, player.x, player.y, map, spatialHash, player);
      }
      break;
      
    case AI_BEHAVIORS.CAUTIOUS:
        const ranged = getEnemyRangedInfo(enemy.type);
        const optimalRange = ranged ? Math.floor(ranged.range * 0.7) : 4;
        
        if (dist <= 2) {
            newPos = moveAway(enemy, player, map, spatialHash); 
        } else if (dist < optimalRange && canSee) {
            if (Math.random() < 0.6) newPos = moveAway(enemy, player, map, spatialHash);
        } else if (dist > optimalRange + 2 && canSee) {
            newPos = moveToward(enemy, player.x, player.y, map, spatialHash, player); 
        } else if (canSee && Math.random() < 0.2) {
            const lateralMove = getLateralMove(enemy, player, map, spatialHash); 
            if (lateralMove) newPos = lateralMove;
        }
        break;
      
    case AI_BEHAVIORS.PACK:
        if (canSee || dist <= 8) {
            // Aquí seguimos usando el array 'enemies' para encontrar aliados, 
            // pero el movimiento usará el hash
            const allies = enemies.filter(e => 
              e !== enemy && 
              getEnemyBehavior(e.type) === AI_BEHAVIORS.PACK &&
              Math.abs(e.x - player.x) + Math.abs(e.y - player.y) <= 6
            );
            
            if (allies.length > 0) {
              const flankPos = getFlankingPosition(player, allies, enemy, map, spatialHash);
              if (flankPos) {
                newPos = moveToward(enemy, flankPos.x, flankPos.y, map, spatialHash, player);
              } else {
                newPos = moveToward(enemy, player.x, player.y, map, spatialHash, player);
              }
            } else {
              newPos = moveToward(enemy, player.x, player.y, map, spatialHash, player);
            }
        }
        break;
      
    case AI_BEHAVIORS.AMBUSH:
        if (dist <= 3) {
            newPos = moveToward(enemy, player.x, player.y, map, spatialHash, player);
        }
        break;
      
    case AI_BEHAVIORS.BOSS:
        if (canSee || dist <= 12) {
            if (dist <= 2 && Math.random() < 0.3) {
              newPos = moveAway(enemy, player, map, spatialHash);
            } else {
              newPos = moveToward(enemy, player.x, player.y, map, spatialHash, player);
            }
        }
        break;
  }
  
  if (newPos) {
    // ACTUALIZAR HASH AL MOVER
    spatialHash.move(enemy.x, enemy.y, newPos.x, newPos.y, { ...enemy, type: 'enemy' });
    
    enemy.x = newPos.x;
    enemy.y = newPos.y;
    enemy.lastMoveTime = Date.now(); 
    return { action: 'move', x: newPos.x, y: newPos.y };
  }
  
  return { action: 'wait' };
}

// (La función calculateEnemyDamage se mantiene igual, no necesita cambios)
export function calculateEnemyDamage(enemy, player, playerStats, playerBuffs) {
  let baseDamage = enemy.attack - playerStats.defense + Math.floor(Math.random() * 3);
  
  const evasionBonus = playerBuffs.reduce((sum, b) => sum + (b.evasion || 0), 0);
  if (evasionBonus > 0 && Math.random() < evasionBonus * 0.5) {
    return { damage: 0, evaded: true };
  }
  
  const absorbPercent = playerBuffs.reduce((sum, b) => sum + (b.absorb || 0), 0);
  if (absorbPercent > 0) {
    baseDamage = Math.floor(baseDamage * (1 - absorbPercent));
  }
  
  if (enemy.marked) {
    baseDamage = Math.floor(baseDamage * 0.75);
  }
  
  return { damage: Math.max(1, baseDamage), evaded: false };
}