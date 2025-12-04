// Sistema Táctico de IA Enemiga
// =============================

import { hasLineOfSight } from './CombatSystem'; 
// NOTA: Cambiamos la importación para usar CombatSystem en lugar de RangedCombat
// para unificar la lógica en un solo lugar.

// Tipos de comportamiento
export const AI_BEHAVIORS = {
  AGGRESSIVE: 'aggressive',  // Siempre carga hacia el jugador
  CAUTIOUS: 'cautious',      // Mantiene distancia, usa rango si puede
  PACK: 'pack',              // Intenta flanquear con aliados
  AMBUSH: 'ambush',          // Espera hasta que el jugador esté cerca
  BOSS: 'boss',              // Patrones especiales de jefe
};

// Asignar comportamiento según tipo de enemigo
export function getEnemyBehavior(enemyType) {
  const behaviors = {
    2: AI_BEHAVIORS.PACK,        // Rata - Enjambre
    3: AI_BEHAVIORS.CAUTIOUS,    // Murciélago - Mantiene distancia
    4: AI_BEHAVIORS.AGGRESSIVE,  // Goblin
    5: AI_BEHAVIORS.AGGRESSIVE,  // Esqueleto
    6: AI_BEHAVIORS.AGGRESSIVE,  // Orco
    7: AI_BEHAVIORS.AMBUSH,      // Araña - Espera
    8: AI_BEHAVIORS.AGGRESSIVE,  // Zombi
    9: AI_BEHAVIORS.AGGRESSIVE,  // Trol
    10: AI_BEHAVIORS.CAUTIOUS,   // Espectro
    11: AI_BEHAVIORS.AGGRESSIVE, // Demonio
    12: AI_BEHAVIORS.BOSS,       // Dragón
    13: AI_BEHAVIORS.PACK,       // Slime
    14: AI_BEHAVIORS.PACK,       // Lobo - Flanquea
    15: AI_BEHAVIORS.CAUTIOUS,   // Cultista - Rango
    16: AI_BEHAVIORS.AGGRESSIVE, // Gólem
    17: AI_BEHAVIORS.CAUTIOUS,   // Vampiro
    18: AI_BEHAVIORS.AMBUSH,     // Mímico
    // Jefes
    100: AI_BEHAVIORS.BOSS,
    101: AI_BEHAVIORS.BOSS,
    102: AI_BEHAVIORS.BOSS,
    103: AI_BEHAVIORS.BOSS,
    104: AI_BEHAVIORS.BOSS,
    105: AI_BEHAVIORS.BOSS,
    106: AI_BEHAVIORS.BOSS,
    107: AI_BEHAVIORS.BOSS,
    108: AI_BEHAVIORS.BOSS,
  };
  return behaviors[enemyType] || AI_BEHAVIORS.AGGRESSIVE;
}

// Información de ataques a distancia enemigos
const ENEMY_RANGED_INFO = {
  3: { range: 4, type: 'sonic', name: 'Chillido', preferMelee: false },
  7: { range: 4, type: 'poison', name: 'Telaraña', preferMelee: true },     // Prefiere melee si puede
  10: { range: 5, type: 'magic', name: 'Rayo Espectral', preferMelee: false }, 
  11: { range: 5, type: 'fire', name: 'Bola de Fuego', preferMelee: true },  
  12: { range: 6, type: 'fire', name: 'Aliento de Fuego', preferMelee: true }, 
  15: { range: 6, type: 'dark', name: 'Rayo Oscuro', preferMelee: false },   
  17: { range: 5, type: 'dark', name: 'Drenar Vida', preferMelee: false },   
  104: { range: 7, type: 'ice', name: 'Rayo de Hielo', preferMelee: false }, 
  105: { range: 6, type: 'fire', name: 'Infierno', preferMelee: true },     
  106: { range: 8, type: 'fire', name: 'Llamarada', preferMelee: true },    
  107: { range: 5, type: 'dark', name: 'Drenar Almas', preferMelee: false }, 
};

// Comprobar si el enemigo tiene ataque a distancia
export function isRangedEnemy(enemyType) {
  return !!ENEMY_RANGED_INFO[enemyType];
}

// Obtener info de rango
export function getEnemyRangedInfo(enemyType) {
  return ENEMY_RANGED_INFO[enemyType] || null;
}

export function getEnemyRange(enemyType) {
  return ENEMY_RANGED_INFO[enemyType]?.range || 1;
}

// Calcular posición de flanqueo
function getFlankingPosition(player, allies, enemy, map) {
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
    // Si es suelo (1) y no está ocupado
    if (map[pos.y]?.[pos.x] === 1 && !occupiedPositions.has(`${pos.x},${pos.y}`)) {
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

// Mover enemigo hacia objetivo (Algoritmo simple)
function moveToward(enemy, targetX, targetY, map, enemies, player) {
  const dx = Math.sign(targetX - enemy.x);
  const dy = Math.sign(targetY - enemy.y);
  
  const moves = [];
  if (dx !== 0) moves.push({ x: enemy.x + dx, y: enemy.y, priority: 1 });
  if (dy !== 0) moves.push({ x: enemy.x, y: enemy.y + dy, priority: 1 });
  // Diagonal
  if (dx !== 0 && dy !== 0) moves.push({ x: enemy.x + dx, y: enemy.y + dy, priority: 2 });
  
  // Ordenar por prioridad (recto primero, diagonal después)
  moves.sort((a, b) => a.priority - b.priority);
  
  for (const move of moves) {
    // No pisar al jugador
    if (move.x === player.x && move.y === player.y) continue;
    
    // Suelo válido (1 = suelo, 2 = escaleras)
    if (map[move.y]?.[move.x] !== 1 && map[move.y]?.[move.x] !== 2) continue;
    
    // No pisar otro enemigo
    const occupied = enemies.some(e => e.x === move.x && e.y === move.y && e !== enemy);
    if (occupied) continue;
    
    return move;
  }
  return null;
}

// Mover lejos del jugador (Huida/Cautela)
function moveAway(enemy, player, map, enemies) {
  const dx = Math.sign(enemy.x - player.x);
  const dy = Math.sign(enemy.y - player.y);
  
  const moves = [
    { x: enemy.x + dx, y: enemy.y },
    { x: enemy.x, y: enemy.y + dy },
    { x: enemy.x + dx, y: enemy.y + dy },
  ];
  
  for (const move of moves) {
    if (map[move.y]?.[move.x] !== 1) continue;
    const occupied = enemies.some(e => e.x === move.x && e.y === move.y && e !== enemy);
    if (occupied) continue;
    return move;
  }
  return null;
}

// Movimiento lateral (Strafe)
function getLateralMove(enemy, player, map, enemies) {
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  
  // Direcciones perpendiculares
  const lateralMoves = [
    { x: enemy.x - dy, y: enemy.y + dx },
    { x: enemy.x + dy, y: enemy.y - dx },
  ];
  
  if (Math.random() < 0.5) lateralMoves.reverse();
  
  for (const move of lateralMoves) {
    if (map[move.y]?.[move.x] !== 1) continue;
    const occupied = enemies.some(e => e.x === move.x && e.y === move.y && e !== enemy);
    if (occupied) continue;
    if (move.x === player.x && move.y === player.y) continue;
    return move;
  }
  return null;
}

// PROCESO PRINCIPAL: Turno del Enemigo
export function processEnemyTurn(enemy, player, enemies, map, visible, addMessage) {
  // Estados alterados
  if (enemy.stunned > 0) {
    enemy.stunned--;
    return { action: 'stunned' };
  }
  
  if (enemy.slowed > 0) {
    enemy.slowedTurn = !enemy.slowedTurn;
    enemy.slowed--;
    if (enemy.slowedTurn) return { action: 'slowed' }; // Pierde turno por lentitud
  }
  
  if (enemy.poisoned > 0) {
    const poisonDmg = enemy.poisonDamage || 3;
    enemy.hp -= poisonDmg;
    enemy.poisoned--;
    if (enemy.hp <= 0) {
      return { action: 'died_poison', damage: poisonDmg };
    }
  }
  
  const behavior = getEnemyBehavior(enemy.type);
  const dist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
  const canSee = visible[enemy.y]?.[enemy.x];
  
  // Si el jugador es invisible
  const playerBuffs = player.skills?.buffs || [];
  const isPlayerInvisible = playerBuffs.some(b => b.invisible);
  if (isPlayerInvisible && dist > 2) {
    return { action: 'lost_target' };
  }
  
  // Ataque cuerpo a cuerpo
  if (dist === 1) {
    return { action: 'melee_attack' };
  }
  
  // Decisión de ataque a distancia
  const rangedInfo = getEnemyRangedInfo(enemy.type);
  if (rangedInfo && dist <= rangedInfo.range && dist > 1) {
    if (hasLineOfSight(map, enemy.x, enemy.y, player.x, player.y)) {
      // Si prefiere melee, solo dispara si está lejos o con poca vida
      if (rangedInfo.preferMelee) {
        const hpPercent = enemy.hp / enemy.maxHp;
        const shouldUseRanged = dist >= 4 || hpPercent < 0.3 || Math.random() < 0.25;
        if (!shouldUseRanged) {
          // Intentar acercarse
          const newPos = moveToward(enemy, player.x, player.y, map, enemies, player);
          if (newPos) {
            enemy.x = newPos.x;
            enemy.y = newPos.y;
            return { action: 'move', x: newPos.x, y: newPos.y };
          }
        }
      }
      return { action: 'ranged_attack', range: rangedInfo.range };
    }
  }
  
  // Movimiento según comportamiento
  let newPos = null;
  
  switch (behavior) {
    case AI_BEHAVIORS.AGGRESSIVE:
      if (canSee || dist <= 10) {
        newPos = moveToward(enemy, player.x, player.y, map, enemies, player);
      }
      break;
      
    case AI_BEHAVIORS.CAUTIOUS:
      const ranged = getEnemyRangedInfo(enemy.type);
      const optimalRange = ranged ? Math.floor(ranged.range * 0.7) : 4;
      
      if (dist <= 2) {
        newPos = moveAway(enemy, player, map, enemies); // Demasiado cerca, huir
      } else if (dist < optimalRange && canSee) {
        if (Math.random() < 0.6) newPos = moveAway(enemy, player, map, enemies);
      } else if (dist > optimalRange + 2 && canSee) {
        newPos = moveToward(enemy, player.x, player.y, map, enemies, player); // Acercarse a rango
      } else if (canSee && Math.random() < 0.2) {
        const lateralMove = getLateralMove(enemy, player, map, enemies); // Reposicionar
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
          const flankPos = getFlankingPosition(player, allies, enemy, map);
          if (flankPos) {
            newPos = moveToward(enemy, flankPos.x, flankPos.y, map, enemies, player);
          } else {
            newPos = moveToward(enemy, player.x, player.y, map, enemies, player);
          }
        } else {
          newPos = moveToward(enemy, player.x, player.y, map, enemies, player);
        }
      }
      break;
      
    case AI_BEHAVIORS.AMBUSH:
      if (dist <= 3) {
        // Jugador muy cerca, ¡atacar!
        newPos = moveToward(enemy, player.x, player.y, map, enemies, player);
      }
      break;
      
    case AI_BEHAVIORS.BOSS:
      if (canSee || dist <= 12) {
        if (dist <= 2 && Math.random() < 0.3) {
          // A veces se aleja para usar habilidades
          newPos = moveAway(enemy, player, map, enemies);
        } else {
          newPos = moveToward(enemy, player.x, player.y, map, enemies, player);
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

// Calcular daño que recibe el jugador
export function calculateEnemyDamage(enemy, player, playerStats, playerBuffs) {
  let baseDamage = enemy.attack - playerStats.defense + Math.floor(Math.random() * 3);
  
  // Comprobar evasión
  const evasionBonus = playerBuffs.reduce((sum, b) => sum + (b.evasion || 0), 0);
  if (evasionBonus > 0 && Math.random() < evasionBonus * 0.5) {
    return { damage: 0, evaded: true };
  }
  
  // Comprobar absorción (escudos)
  const absorbPercent = playerBuffs.reduce((sum, b) => sum + (b.absorb || 0), 0);
  if (absorbPercent > 0) {
    baseDamage = Math.floor(baseDamage * (1 - absorbPercent));
  }
  
  // Si el enemigo está marcado (debuff)
  if (enemy.marked) {
    baseDamage = Math.floor(baseDamage * 0.75);
  }
  
  return { damage: Math.max(1, baseDamage), evaded: false };
}