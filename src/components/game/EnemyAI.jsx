// Tactical Enemy AI System

import { hasLineOfSight } from './RangedCombat';

// Enemy behavior types
export const AI_BEHAVIORS = {
  AGGRESSIVE: 'aggressive',  // Always charges player
  CAUTIOUS: 'cautious',      // Keeps distance, uses ranged if possible
  PACK: 'pack',              // Tries to flank with allies
  AMBUSH: 'ambush',          // Waits until player is close
  BOSS: 'boss',              // Special boss patterns
};

// Assign AI behavior based on enemy type
export function getEnemyBehavior(enemyType) {
  const behaviors = {
    2: AI_BEHAVIORS.PACK,        // Rat - swarm
    3: AI_BEHAVIORS.CAUTIOUS,    // Bat - keeps distance
    4: AI_BEHAVIORS.AGGRESSIVE,  // Goblin
    5: AI_BEHAVIORS.AGGRESSIVE,  // Skeleton
    6: AI_BEHAVIORS.AGGRESSIVE,  // Orc
    7: AI_BEHAVIORS.AMBUSH,      // Spider - waits
    8: AI_BEHAVIORS.AGGRESSIVE,  // Zombie - slow but direct
    9: AI_BEHAVIORS.AGGRESSIVE,  // Troll
    10: AI_BEHAVIORS.CAUTIOUS,   // Wraith - phases
    11: AI_BEHAVIORS.AGGRESSIVE, // Demon
    12: AI_BEHAVIORS.BOSS,       // Dragon
    13: AI_BEHAVIORS.PACK,       // Slime
    14: AI_BEHAVIORS.PACK,       // Wolf - flanks
    15: AI_BEHAVIORS.CAUTIOUS,   // Cultist - ranged
    16: AI_BEHAVIORS.AGGRESSIVE, // Golem
    17: AI_BEHAVIORS.CAUTIOUS,   // Vampire - ranged
    18: AI_BEHAVIORS.AMBUSH,     // Mimic - waits
    // Bosses
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

// Ranged enemy types with attack info
const ENEMY_RANGED_INFO = {
  3: { range: 4, type: 'sonic', name: 'Chillido', preferMelee: false },      // Bat
  7: { range: 4, type: 'poison', name: 'Telaraña', preferMelee: true },     // Spider - prefers melee
  10: { range: 5, type: 'magic', name: 'Rayo Espectral', preferMelee: false }, // Wraith  
  11: { range: 5, type: 'fire', name: 'Bola de Fuego', preferMelee: true },  // Demon - stronger melee
  12: { range: 6, type: 'fire', name: 'Aliento de Fuego', preferMelee: true }, // Dragon - devastating melee
  15: { range: 6, type: 'dark', name: 'Rayo Oscuro', preferMelee: false },   // Cultist - pure caster
  17: { range: 5, type: 'dark', name: 'Drenar Vida', preferMelee: false },   // Vampire
  104: { range: 7, type: 'ice', name: 'Rayo de Hielo', preferMelee: false }, // Lich - pure caster
  105: { range: 6, type: 'fire', name: 'Infierno', preferMelee: true },     // Demon Lord - both
  106: { range: 8, type: 'fire', name: 'Llamarada', preferMelee: true },    // Ancient Dragon
  107: { range: 5, type: 'dark', name: 'Drenar Almas', preferMelee: false }, // Vampire Lord
};

// Enemy melee power multiplier (higher = prefers melee)
const ENEMY_MELEE_POWER = {
  7: 1.5,   // Spider - strong melee
  11: 1.4,  // Demon
  12: 1.8,  // Dragon - very strong melee
  105: 1.6, // Demon Lord
  106: 2.0, // Ancient Dragon - devastating melee
};

// Check if enemy can attack at range
export function isRangedEnemy(enemyType) {
  return !!ENEMY_RANGED_INFO[enemyType];
}

// Get enemy ranged attack info
export function getEnemyRangedInfo(enemyType) {
  return ENEMY_RANGED_INFO[enemyType] || null;
}

// Get enemy ranged attack range
export function getEnemyRange(enemyType) {
  return ENEMY_RANGED_INFO[enemyType]?.range || 1;
}

// Calculate flanking position relative to player
function getFlankingPosition(player, allies, enemy, map) {
  const directions = [
    { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
    { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
    { dx: 1, dy: 1 }, { dx: -1, dy: 1 },
    { dx: 1, dy: -1 }, { dx: -1, dy: -1 },
  ];
  
  // Find positions around player not occupied by allies
  const occupiedPositions = new Set(allies.map(a => `${a.x},${a.y}`));
  
  for (const dir of directions) {
    const pos = { x: player.x + dir.dx, y: player.y + dir.dy };
    if (map[pos.y]?.[pos.x] === 1 && !occupiedPositions.has(`${pos.x},${pos.y}`)) {
      // Check if this position is reachable and flanks (opposite of another ally)
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

// Move enemy toward a target position
function moveToward(enemy, targetX, targetY, map, enemies, player) {
  const dx = Math.sign(targetX - enemy.x);
  const dy = Math.sign(targetY - enemy.y);
  
  const moves = [];
  if (dx !== 0) moves.push({ x: enemy.x + dx, y: enemy.y, priority: 1 });
  if (dy !== 0) moves.push({ x: enemy.x, y: enemy.y + dy, priority: 1 });
  // Diagonal
  if (dx !== 0 && dy !== 0) moves.push({ x: enemy.x + dx, y: enemy.y + dy, priority: 2 });
  
  // Sort by priority
  moves.sort((a, b) => a.priority - b.priority);
  
  for (const move of moves) {
    // Don't step on player
    if (move.x === player.x && move.y === player.y) continue;
    
    // Check valid floor
    if (map[move.y]?.[move.x] !== 1 && map[move.y]?.[move.x] !== 2) continue;
    
    // Check not occupied by another enemy
    const occupied = enemies.some(e => e.x === move.x && e.y === move.y && e !== enemy);
    if (occupied) continue;
    
    return move;
  }
  return null;
}

// Move enemy away from player (for cautious enemies)
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

// Move laterally (strafe) to reposition
function getLateralMove(enemy, player, map, enemies) {
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  
  // Perpendicular directions
  const lateralMoves = [
    { x: enemy.x - dy, y: enemy.y + dx },
    { x: enemy.x + dy, y: enemy.y - dx },
  ];
  
  // Shuffle for randomness
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

// Process enemy turn with tactical AI
export function processEnemyTurn(enemy, player, enemies, map, visible, addMessage) {
  // Handle status effects
  if (enemy.stunned > 0) {
    enemy.stunned--;
    return { action: 'stunned' };
  }
  
  // Slowed enemies only move every other turn
  if (enemy.slowed > 0) {
    enemy.slowedTurn = !enemy.slowedTurn;
    enemy.slowed--;
    if (enemy.slowedTurn) return { action: 'slowed' };
  }
  
  // Poison damage
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
  
  // Check if player is invisible
  const playerBuffs = player.skills?.buffs || [];
  const isPlayerInvisible = playerBuffs.some(b => b.invisible);
  if (isPlayerInvisible && dist > 2) {
    return { action: 'lost_target' };
  }
  
  // Can attack player?
  if (dist === 1) {
    return { action: 'melee_attack' };
  }
  
  // Ranged attack decision - smart AI
  const rangedInfo = getEnemyRangedInfo(enemy.type);
  if (rangedInfo && dist <= rangedInfo.range && dist > 1) {
    if (hasLineOfSight(map, enemy.x, enemy.y, player.x, player.y)) {
      // Check if enemy prefers melee - if so, only use ranged when far or low HP
      if (rangedInfo.preferMelee) {
        const hpPercent = enemy.hp / enemy.maxHp;
        const shouldUseRanged = dist >= 4 || hpPercent < 0.3 || Math.random() < 0.25;
        if (!shouldUseRanged) {
          // Prefer to close distance for melee
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
  
  // Movement based on behavior
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
        // Too close, definitely back away
        newPos = moveAway(enemy, player, map, enemies);
      } else if (dist < optimalRange && canSee) {
        // Slightly too close, maybe back up
        if (Math.random() < 0.6) {
          newPos = moveAway(enemy, player, map, enemies);
        }
      } else if (dist > optimalRange + 2 && canSee) {
        // Too far, get closer
        newPos = moveToward(enemy, player.x, player.y, map, enemies, player);
      } else if (canSee && Math.random() < 0.2) {
        // Occasionally reposition
        const lateralMove = getLateralMove(enemy, player, map, enemies);
        if (lateralMove) newPos = lateralMove;
      }
      break;
      
    case AI_BEHAVIORS.PACK:
      if (canSee || dist <= 8) {
        // Try to flank
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
        // Player is close, attack!
        newPos = moveToward(enemy, player.x, player.y, map, enemies, player);
      }
      // Otherwise stay still
      break;
      
    case AI_BEHAVIORS.BOSS:
      // Bosses have special patterns
      if (canSee || dist <= 12) {
        if (dist <= 2 && Math.random() < 0.3) {
          // Sometimes back up to use abilities
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

// Calculate enemy damage with modifiers
export function calculateEnemyDamage(enemy, player, playerStats, playerBuffs) {
  let baseDamage = enemy.attack - playerStats.defense + Math.floor(Math.random() * 3);
  
  // Check player evasion buff
  const evasionBonus = playerBuffs.reduce((sum, b) => sum + (b.evasion || 0), 0);
  if (evasionBonus > 0 && Math.random() < evasionBonus * 0.5) {
    return { damage: 0, evaded: true };
  }
  
  // Check absorption buff
  const absorbPercent = playerBuffs.reduce((sum, b) => sum + (b.absorb || 0), 0);
  if (absorbPercent > 0) {
    baseDamage = Math.floor(baseDamage * (1 - absorbPercent));
  }
  
  // Check if enemy is marked
  if (enemy.marked) {
    // Marked enemies deal less damage too
    baseDamage = Math.floor(baseDamage * 0.75);
  }
  
  return { damage: Math.max(1, baseDamage), evaded: false };
}