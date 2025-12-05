// Sistema de Inteligencia Artificial para Enemigos
import { findPath } from '@/lib/pathfinding';
import { ENEMY_RANGED_INFO } from '@/data/enemies';
import { hasLineOfSight } from './CombatSystem'; 

// Tipos de comportamiento
export const AI_BEHAVIORS = {
  AGGRESSIVE: 'aggressive',  // Carga hacia el jugador
  CAUTIOUS: 'cautious',      // Mantiene distancia
  PACK: 'pack',              // Flanquea con aliados
  AMBUSH: 'ambush',          // Espera emboscada
  BOSS: 'boss',              // Patrón de jefe
};

// Asignar comportamiento según tipo de enemigo
export function getEnemyBehavior(enemyType) {
  // Jefes tienen ID >= 100
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

// --- FUNCIONES DE MOVIMIENTO ---

// Comprueba si una casilla está libre de obstáculos
function isTileFree(x, y, map, enemies, chests) {
  // Debe ser suelo (1) o escaleras (2)
  if (map[y]?.[x] !== 1 && map[y]?.[x] !== 2) return false;
  
  // No puede haber otro enemigo (excepto uno mismo, que se filtra fuera antes de llamar)
  if (enemies.some(e => e.x === x && e.y === y)) return false;

  // No puede haber un cofre
  if (chests && chests.some(c => c.x === x && c.y === y)) return false;
  
  return true;
}

// Calcular posición de flanqueo
function getFlankingPosition(player, allies, enemy, map, chests) {
    const directions = [
      { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
      { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
      { dx: 1, dy: 1 }, { dx: -1, dy: 1 },
      { dx: 1, dy: -1 }, { dx: -1, dy: -1 },
    ];
    
    // Posiciones ocupadas por aliados
    const occupiedPositions = new Set(allies.map(a => `${a.x},${a.y}`));
    
    for (const dir of directions) {
      const pos = { x: player.x + dir.dx, y: player.y + dir.dy };
      
      // Usamos isTileFree (sin pasar enemies porque ya filtramos occupiedPositions, pero pasamos chests)
      if (isTileFree(pos.x, pos.y, map, [], chests) && !occupiedPositions.has(`${pos.x},${pos.y}`)) {
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
function moveAway(enemy, player, map, enemies, chests) {
    const dx = Math.sign(enemy.x - player.x);
    const dy = Math.sign(enemy.y - player.y);
    
    // Intentar moverse en dirección opuesta
    const moves = [
      { x: enemy.x + dx, y: enemy.y },
      { x: enemy.x, y: enemy.y + dy },
      { x: enemy.x + dx, y: enemy.y + dy },
    ];
    
    for (const move of moves) {
      const otherEnemies = enemies.filter(e => e !== enemy);
      if (isTileFree(move.x, move.y, map, otherEnemies, chests)) return move;
    }
    return null;
}
  
// Movimiento lateral (Strafe)
function getLateralMove(enemy, player, map, enemies, chests) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    
    // Direcciones perpendiculares
    const lateralMoves = [
      { x: enemy.x - dy, y: enemy.y + dx },
      { x: enemy.x + dy, y: enemy.y - dx },
    ];
    
    if (Math.random() < 0.5) lateralMoves.reverse();
    
    for (const move of lateralMoves) {
      const otherEnemies = enemies.filter(e => e !== enemy);
      if (isTileFree(move.x, move.y, map, otherEnemies, chests)) return move;
    }
    return null;
}

// Mover hacia el objetivo usando A*
function moveToward(enemy, targetX, targetY, map, enemies, player, chests) {
  // Intentar encontrar el camino inteligente primero
  const nextStep = findPath(enemy.x, enemy.y, targetX, targetY, map);

  // Si A* encuentra un camino válido
  if (nextStep) {
    // Importante: A* evita paredes, pero no sabe si hay otro enemigo o un cofre bloqueando AHORA mismo.
    const otherEnemies = enemies.filter(e => e !== enemy);
    
    // Verificamos colisión dinámica
    if (isTileFree(nextStep.x, nextStep.y, map, otherEnemies, chests)) {
      // Evitar pisar al jugador (para no superponerse antes de atacar)
      if (nextStep.x !== player.x || nextStep.y !== player.y) {
        return nextStep;
      }
    }
  }

  // FALLBACK (Plan B): Si el camino óptimo está bloqueado por otro enemigo,
  // usamos la lógica simple antigua para intentar acercarnos o rodear.
  const dx = Math.sign(targetX - enemy.x);
  const dy = Math.sign(targetY - enemy.y);
  
  const moves = [];
  if (dx !== 0) moves.push({ x: enemy.x + dx, y: enemy.y });
  if (dy !== 0) moves.push({ x: enemy.x, y: enemy.y + dy });
  // Opcional: Probar diagonales o laterales si el directo falla
  if (dx === 0) { moves.push({ x: enemy.x + 1, y: enemy.y }); moves.push({ x: enemy.x - 1, y: enemy.y }); }
  if (dy === 0) { moves.push({ x: enemy.x, y: enemy.y + 1 }); moves.push({ x: enemy.x, y: enemy.y - 1 }); }
  
  for (const move of moves) {
    const otherEnemies = enemies.filter(e => e !== enemy);
    // Verificar que no sea el jugador y esté libre
    if ((move.x !== player.x || move.y !== player.y) && 
        isTileFree(move.x, move.y, map, otherEnemies, chests)) {
      return move;
    }
  }

  return null; // No se puede mover
}

// PROCESO PRINCIPAL: Turno del Enemigo
export function processEnemyTurn(enemy, player, enemies, map, visible, log, chests) {
  // 1. Estados alterados
  if (enemy.stunned > 0) {
    enemy.stunned--;
    return { action: 'stunned' };
  }
  
  if (enemy.slowed > 0) {
    enemy.slowedTurn = !enemy.slowedTurn; // Actúa turnos alternos
    enemy.slowed--;
    if (enemy.slowedTurn) return { action: 'slowed' };
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
  
  // Si jugador invisible, perder objetivo
  const isPlayerInvisible = player.skills?.buffs?.some(b => b.invisible);
  if (isPlayerInvisible && dist > 2) return { action: 'lost_target' };
  
  // Ataque cuerpo a cuerpo
  if (dist === 1) return { action: 'melee_attack' };
  
  // Ataque a distancia
  const rangedInfo = getEnemyRangedInfo(enemy.type);
  if (rangedInfo && dist <= rangedInfo.range && dist > 1) {
    if (hasLineOfSight(map, enemy.x, enemy.y, player.x, player.y)) {
      // Si prefiere melee, solo dispara a veces o si está lejos
      const shouldShoot = !rangedInfo.preferMelee || Math.random() < 0.3 || dist > 3;
      if (shouldShoot) return { action: 'ranged_attack', range: rangedInfo.range };
    }
  }
  
  // 3. Movimiento
  let newPos = null;
  
  // Comportamientos
  switch (behavior) {
    case AI_BEHAVIORS.AGGRESSIVE:
      if (canSee || dist <= 10) {
        newPos = moveToward(enemy, player.x, player.y, map, enemies, player, chests);
      }
      break;
      
    case AI_BEHAVIORS.CAUTIOUS:
        const ranged = getEnemyRangedInfo(enemy.type);
        const optimalRange = ranged ? Math.floor(ranged.range * 0.7) : 4;
        
        if (dist <= 2) {
            newPos = moveAway(enemy, player, map, enemies, chests); 
        } else if (dist < optimalRange && canSee) {
            if (Math.random() < 0.6) newPos = moveAway(enemy, player, map, enemies, chests);
        } else if (dist > optimalRange + 2 && canSee) {
            newPos = moveToward(enemy, player.x, player.y, map, enemies, player, chests); 
        } else if (canSee && Math.random() < 0.2) {
            const lateralMove = getLateralMove(enemy, player, map, enemies, chests); 
            if (lateralMove) newPos = lateralMove;
        }
        break;
      
    case AI_BEHAVIORS.PACK:
        if (canSee || dist <= 8) {
            const allies = enemies.filter(e => 
              e !== enemy && 
              getEnemyBehavior(e.type) === AI_BEHAVIORS.PACK &&
              Math.abs(e.x - player.x) + Math.abs(e.y - player.y) <= 6
            );
            
            if (allies.length > 0) {
              const flankPos = getFlankingPosition(player, allies, enemy, map, chests);
              if (flankPos) {
                newPos = moveToward(enemy, flankPos.x, flankPos.y, map, enemies, player, chests);
              } else {
                newPos = moveToward(enemy, player.x, player.y, map, enemies, player, chests);
              }
            } else {
              newPos = moveToward(enemy, player.x, player.y, map, enemies, player, chests);
            }
        }
        break;
      
    case AI_BEHAVIORS.AMBUSH:
        if (dist <= 3) {
            newPos = moveToward(enemy, player.x, player.y, map, enemies, player, chests);
        }
        break;
      
    case AI_BEHAVIORS.BOSS:
        if (canSee || dist <= 12) {
            if (dist <= 2 && Math.random() < 0.3) {
              newPos = moveAway(enemy, player, map, enemies, chests);
            } else {
              newPos = moveToward(enemy, player.x, player.y, map, enemies, player, chests);
            }
        }
        break;
  }
  
  if (newPos) {
    enemy.x = newPos.x;
    enemy.y = newPos.y;
    return { action: 'move', x: newPos.x, y: newPos.y };
  }
  
  return { action: 'wait' };
}

// Calcular daño recibido por el jugador
export function calculateEnemyDamage(enemy, player, playerStats, playerBuffs) {
  let baseDamage = enemy.attack - playerStats.defense + Math.floor(Math.random() * 3);
  
  // Evasión
  const evasionBonus = playerBuffs.reduce((sum, b) => sum + (b.evasion || 0), 0);
  if (evasionBonus > 0 && Math.random() < evasionBonus * 0.5) {
    return { damage: 0, evaded: true };
  }
  
  // Escudos / Absorción
  const absorbPercent = playerBuffs.reduce((sum, b) => sum + (b.absorb || 0), 0);
  if (absorbPercent > 0) {
    baseDamage = Math.floor(baseDamage * (1 - absorbPercent));
  }
  
  // Marcado
  if (enemy.marked) {
    baseDamage = Math.floor(baseDamage * 0.75);
  }
  
  return { damage: Math.max(1, baseDamage), evaded: false };
}