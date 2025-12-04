// Ranged Combat and Tactical System

// Check line of sight between two points
export function hasLineOfSight(map, x1, y1, x2, y2) {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  
  let x = x1;
  let y = y1;
  
  while (x !== x2 || y !== y2) {
    // Check if current tile blocks sight
    if (map[y]?.[x] === 0) { // WALL
      return false;
    }
    
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  
  return true;
}

// Get tiles in a line for projectile path
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
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
    
    distance++;
    
    if (x === x1 && y === y1) continue;
    
    // Stop at walls
    if (map[y]?.[x] === 0) break;
    
    path.push({ x, y, distance });
    
    if (x === x2 && y === y2) break;
  }
  
  return path;
}

// Get valid ranged attack targets
export function getRangedTargets(player, enemies, map, range = 6) {
  const targets = [];
  
  enemies.forEach(enemy => {
    const dist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
    const euclidDist = Math.sqrt(Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2));
    
    if (euclidDist <= range && hasLineOfSight(map, player.x, player.y, enemy.x, enemy.y)) {
      targets.push({
        ...enemy,
        distance: dist,
        euclidDistance: euclidDist,
      });
    }
  });
  
  return targets.sort((a, b) => a.distance - b.distance);
}

// Execute ranged attack
export function executeRangedAttack(player, target, ammo, map) {
  if (!ammo || ammo.quantity <= 0) {
    return { success: false, message: 'Sin munición' };
  }
  
  const distance = Math.sqrt(Math.pow(target.x - player.x, 2) + Math.pow(target.y - player.y, 2));
  
  if (distance > 8) {
    return { success: false, message: 'Fuera de alcance' };
  }
  
  if (!hasLineOfSight(map, player.x, player.y, target.x, target.y)) {
    return { success: false, message: 'Sin línea de visión' };
  }
  
  // Calculate damage with distance penalty
  const baseDamage = ammo.stats?.damage || 5;
  const distancePenalty = Math.max(0, (distance - 3) * 0.1);
  const damage = Math.max(1, Math.floor(baseDamage * (1 - distancePenalty)));
  
  // Accuracy based on distance
  const hitChance = Math.max(0.5, 1 - (distance * 0.05));
  const hit = Math.random() < hitChance;
  
  // Consume ammo
  ammo.quantity--;
  
  if (!hit) {
    return { 
      success: true, 
      hit: false, 
      message: '¡Fallaste el disparo!',
      path: getProjectilePath(player.x, player.y, target.x, target.y, map),
    };
  }
  
  const effects = [];
  if (ammo.stats?.slow) {
    effects.push({ type: 'slow', duration: ammo.stats.slow });
  }
  
  return {
    success: true,
    hit: true,
    damage,
    effects,
    message: `¡Impacto! ${damage} de daño a distancia.`,
    path: getProjectilePath(player.x, player.y, target.x, target.y, map),
  };
}

// Tactical positioning evaluation
export function evaluateTacticalPosition(x, y, enemies, map) {
  let score = 0;
  
  // Check adjacent walls (cover)
  const adjacent = [[0,1],[0,-1],[1,0],[-1,0]];
  let wallCount = 0;
  let floorCount = 0;
  
  adjacent.forEach(([dx, dy]) => {
    if (map[y + dy]?.[x + dx] === 0) wallCount++;
    if (map[y + dy]?.[x + dx] === 1) floorCount++;
  });
  
  // Partial cover is good
  if (wallCount === 1 || wallCount === 2) score += 20;
  // Being cornered is bad
  if (wallCount >= 3) score -= 30;
  
  // Distance from enemies
  enemies.forEach(enemy => {
    const dist = Math.abs(enemy.x - x) + Math.abs(enemy.y - y);
    if (dist <= 1) score -= 50; // Too close
    else if (dist <= 3) score -= 10;
    else if (dist <= 6) score += 10; // Good ranged distance
    else score += 5;
  });
  
  // Escape routes
  score += floorCount * 5;
  
  return {
    x, y,
    score,
    cover: wallCount,
    escapeRoutes: floorCount,
    nearbyEnemies: enemies.filter(e => Math.abs(e.x - x) + Math.abs(e.y - y) <= 2).length,
  };
}

// Get best tactical positions nearby
export function findTacticalPositions(player, enemies, map, radius = 3) {
  const positions = [];
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = player.x + dx;
      const y = player.y + dy;
      
      if (map[y]?.[x] === 1 && !enemies.some(e => e.x === x && e.y === y)) {
        const eval_ = evaluateTacticalPosition(x, y, enemies, map);
        positions.push(eval_);
      }
    }
  }
  
  return positions.sort((a, b) => b.score - a.score).slice(0, 5);
}

// Enemy ranged behavior
export function enemyCanShoot(enemy, player, map, range = 5) {
  const dist = Math.sqrt(Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2));
  
  return dist <= range && dist > 1 && hasLineOfSight(map, enemy.x, enemy.y, player.x, player.y);
}

// Ranged enemy types
export const RANGED_ENEMIES = [15, 17]; // Cultist, Vampire can shoot

export function isRangedEnemy(enemyType) {
  return RANGED_ENEMIES.includes(enemyType);
}