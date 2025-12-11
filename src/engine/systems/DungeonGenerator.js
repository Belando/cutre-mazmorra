// Generador procedimental de mazmorras para roguelike
import { generateLevelItems } from './ItemSystem';
import { TILE, ENTITY } from '@/data/constants';
import { ENEMY_STATS } from '@/data/enemies';

// Obtener el jefe correspondiente al nivel
function getBossForLevel(level) {
  const bosses = [
    ENTITY.BOSS_GOBLIN_KING,
    ENTITY.BOSS_SKELETON_LORD,
    ENTITY.BOSS_ORC_WARLORD,
    ENTITY.BOSS_SPIDER_QUEEN,
    ENTITY.BOSS_LICH,
    ENTITY.BOSS_DEMON_LORD,
    ENTITY.BOSS_ANCIENT_DRAGON,
  ];
  return bosses[Math.min(level - 1, bosses.length - 1)];
}

// Obtener enemigos disponibles para un nivel específico
function getEnemiesForLevel(level) {
  const available = [];
  for (const [entityId, stats] of Object.entries(ENEMY_STATS)) {
    if (!stats.isBoss && stats.minLevel <= level) {
      available.push(parseInt(entityId));
    }
  }
  return available;
}

// Escalar estadísticas de enemigos según nivel del jugador y mazmorra (Curva de Dificultad)
export function scaleEnemyStats(baseStats, playerLevel, dungeonLevel) {
  const scaleFactor = 1 + (playerLevel * 0.08) + (dungeonLevel * 0.05);
  const scaledHp = Math.floor(baseStats.hp * scaleFactor);
  
  return {
    ...baseStats,
    hp: scaledHp,
    maxHp: scaledHp,
    attack: Math.floor(baseStats.attack * scaleFactor),
    defense: Math.floor(baseStats.defense * (1 + playerLevel * 0.03)),
    exp: Math.floor(baseStats.exp * (1 + playerLevel * 0.05)),
  };
}

// Función principal de generación de mazmorra
export function generateDungeon(width, height, level, playerLevel = 1) {
  const map = Array(height).fill(null).map(() => Array(width).fill(TILE.WALL));
  const entities = Array(height).fill(null).map(() => Array(width).fill(ENTITY.NONE));
  const rooms = [];
  
  // Número de habitaciones aumenta ligeramente con el nivel
  const roomCount = 6 + Math.floor(Math.random() * 4) + level;
  
  // 1. Generar Habitaciones
  for (let i = 0; i < roomCount * 3; i++) {
    if (rooms.length >= roomCount) break;
    
    const roomWidth = 4 + Math.floor(Math.random() * 6);
    const roomHeight = 4 + Math.floor(Math.random() * 5);
    const x = 1 + Math.floor(Math.random() * (width - roomWidth - 2));
    const y = 1 + Math.floor(Math.random() * (height - roomHeight - 2));
    
    // Comprobar superposición (overlap)
    let overlaps = false;
    for (const room of rooms) {
      if (x < room.x + room.width + 1 && x + roomWidth + 1 > room.x &&
          y < room.y + room.height + 1 && y + roomHeight + 1 > room.y) {
        overlaps = true;
        break;
      }
    }
    
    if (!overlaps) {
      rooms.push({ x, y, width: roomWidth, height: roomHeight });
      
      // "Excavar" la habitación
      for (let ry = y; ry < y + roomHeight; ry++) {
        for (let rx = x; rx < x + roomWidth; rx++) {
          map[ry][rx] = TILE.FLOOR;
        }
      }
    }
  }
  
  // 2. Conectar habitaciones con pasillos
  for (let i = 1; i < rooms.length; i++) {
    const prev = rooms[i - 1];
    const curr = rooms[i];
    
    const prevCenterX = Math.floor(prev.x + prev.width / 2);
    const prevCenterY = Math.floor(prev.y + prev.height / 2);
    const currCenterX = Math.floor(curr.x + curr.width / 2);
    const currCenterY = Math.floor(curr.y + curr.height / 2);
    
    // Aleatoriamente elegir Horizontal-Vertical o Vertical-Horizontal
    if (Math.random() > 0.5) {
      carveHorizontalCorridor(map, prevCenterX, currCenterX, prevCenterY);
      carveVerticalCorridor(map, prevCenterY, currCenterY, currCenterX);
    } else {
      carveVerticalCorridor(map, prevCenterY, currCenterY, prevCenterX);
      carveHorizontalCorridor(map, prevCenterX, currCenterX, currCenterY);
    }
  }

  // 3. (NUEVO) COLOCAR PUERTAS
  // Detectamos entradas a habitaciones y colocamos puertas
  placeDoors(map, rooms);
  
  // 4. Colocar al Jugador (Primera habitación)
  const firstRoom = rooms[0];
  const playerX = Math.floor(firstRoom.x + firstRoom.width / 2);
  const playerY = Math.floor(firstRoom.y + firstRoom.height / 2);
  
  // Colocar escaleras de subida (solo si nivel > 1)
  let stairsUp = null;
  if (level > 1) {
    const upX = firstRoom.x + 1;
    const upY = firstRoom.y + 1;
    map[upY][upX] = TILE.STAIRS_UP;
    stairsUp = { x: upX, y: upY };
  }
  
  // 5. Colocar escaleras de bajada (Última habitación)
  const lastRoom = rooms[rooms.length - 1];
  const stairsX = Math.floor(lastRoom.x + lastRoom.width / 2);
  const stairsY = Math.floor(lastRoom.y + lastRoom.height / 2);
  map[stairsY][stairsX] = TILE.STAIRS;
  
  // 6. Generar Enemigos (En la matriz)
  const enemyTypes = getEnemiesForLevel(level);
  const enemyCount = 4 + level * 2 + Math.floor(Math.random() * 3);
  const lastRoomIndex = rooms.length - 1;
  placeEntities(map, entities, rooms, enemyTypes, enemyCount, [0, lastRoomIndex]);
  
  // 7. Colocar Jefe (En la habitación de salida)
  const bossType = getBossForLevel(level);
  const bossRoom = rooms[lastRoomIndex];
  const bossX = Math.floor(bossRoom.x + bossRoom.width / 2);
  const bossY = Math.floor(bossRoom.y + bossRoom.height / 2);
  
  const bossOffsetX = bossX !== stairsX ? 0 : (bossX > bossRoom.x + 1 ? -1 : 1);
  const bossOffsetY = bossY !== stairsY ? 0 : (bossY > bossRoom.y + 1 ? -1 : 1);
  entities[bossY + bossOffsetY][bossX + bossOffsetX] = bossType;
  
  // 8. Generar Botín
  const generatedItems = generateLevelItems(level, rooms, map, [0]);
  const chests = [];
  const items = [];
  
  generatedItems.forEach(item => {
    if (item.category === 'currency') {
      items.push(item);
    } else {
      chests.push({
        x: item.x,
        y: item.y,
        item: item,
        rarity: item.rarity,
        opened: false,
      });
    }
  });
  
  // 9. Colocar decoración (Antorchas)
  const torches = [];
  rooms.forEach(room => {
    const torchPositions = [
      { x: room.x - 1, y: room.y + Math.floor(room.height / 2) },
      { x: room.x + room.width, y: room.y + Math.floor(room.height / 2) },
      { x: room.x + Math.floor(room.width / 2), y: room.y - 1 },
      { x: room.x + Math.floor(room.width / 2), y: room.y + room.height },
    ];
    
    torchPositions.forEach(pos => {
      if (pos.x >= 0 && pos.x < map[0].length && pos.y >= 0 && pos.y < map.length) {
        if (map[pos.y][pos.x] === TILE.WALL && Math.random() > 0.3) {
          const adjacentToFloor = [
            [pos.x - 1, pos.y], [pos.x + 1, pos.y],
            [pos.x, pos.y - 1], [pos.x, pos.y + 1]
          ].some(([ax, ay]) => map[ay]?.[ax] === TILE.FLOOR);
          if (adjacentToFloor) torches.push({ x: pos.x, y: pos.y });
        }
      }
    });
  });

  // 10. Compilar lista de enemigos para el estado del juego
  const enemies = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const entity = entities[y][x];
      // Si es un enemigo (ID >= 2)
      if (entity >= 2) {
        const baseStats = ENEMY_STATS[entity];
        if (baseStats) {
          const scaled = scaleEnemyStats(baseStats, playerLevel, level);
          enemies.push({ 
            x, y, 
            type: entity, 
            ...scaled, 
            isBoss: baseStats.isBoss || false, 
            stunned: 0,
            slowed: 0,
            poisoned: 0 
          });
        }
      }
    }
  }
  
  return { 
    map, 
    entities, 
    enemies, 
    rooms, 
    playerStart: { x: playerX, y: playerY }, 
    stairs: { x: stairsX, y: stairsY }, 
    stairsUp, 
    items, 
    chests, 
    torches 
  };
}

// Funciones auxiliares
function carveHorizontalCorridor(map, x1, x2, y) {
  const start = Math.min(x1, x2);
  const end = Math.max(x1, x2);
  for (let x = start; x <= end; x++) {
    if (y > 0 && y < map.length - 1) map[y][x] = TILE.FLOOR;
  }
}

// --- FUNCIÓN AUXILIAR PARA COLOCAR PUERTAS (MEJORADA) ---
function placeDoors(map, rooms) {
  // Barajamos las habitaciones para que el orden no siempre sea el mismo
  const shuffledRooms = [...rooms].sort(() => Math.random() - 0.5);

  shuffledRooms.forEach(room => {
    // Definimos los 4 muros de la habitación para escanearlos
    const walls = [
      // Arriba (Horizontal)
      { axis: 'x', start: room.x, end: room.x + room.width, fixed: room.y - 1 }, 
      // Abajo (Horizontal)
      { axis: 'x', start: room.x, end: room.x + room.width, fixed: room.y + room.height }, 
      // Izquierda (Vertical)
      { axis: 'y', start: room.y, end: room.y + room.height, fixed: room.x - 1 }, 
      // Derecha (Vertical)
      { axis: 'y', start: room.y, end: room.y + room.height, fixed: room.x + room.width } 
    ];

    walls.forEach(wall => {
      const candidates = [];

      // 1. ESCANEAR: Buscar todos los huecos posibles en esta pared
      for (let i = wall.start; i < wall.end; i++) {
        const x = wall.axis === 'x' ? i : wall.fixed;
        const y = wall.axis === 'x' ? wall.fixed : i;

        // Límites del mapa
        if (y < 1 || y >= map.length - 1 || x < 1 || x >= map[0].length - 1) continue;

        // Solo analizamos si hay SUELO (un hueco en la pared)
        if (map[y][x] === TILE.FLOOR) {
          const left = map[y][x - 1];
          const right = map[y][x + 1];
          const top = map[y - 1][x];
          const bottom = map[y + 1][x];

          // VALIDACIÓN ESTRICTA DE "SANDWICH"
          // La puerta debe estar atrapada entre dos muros en su eje contrario.
          // Horizontal: Muros Arriba y Abajo.
          // Vertical: Muros Izquierda y Derecha.
          
          const validHorizontal = (top === TILE.WALL && bottom === TILE.WALL); // Pasillo horizontal
          const validVertical = (left === TILE.WALL && right === TILE.WALL);   // Pasillo vertical

          if (validHorizontal || validVertical) {
            candidates.push({ x, y });
          }
        }
      }

      // 2. DECIDIR: Procesar los candidatos encontrados en esta pared
      if (candidates.length > 0) {
        
        // REGLA A: Si el hueco es muy grande (más de 3 casillas), es una "habitacion abierta".
        // NO poner puerta para evitar puertas absurdas en mitad de la nada.
        if (candidates.length > 3) return;

        // REGLA B: Elegir el candidato central.
        // Si el pasillo tiene 2 de ancho, esto elige uno y evita la puerta doble.
        const best = candidates[Math.floor(candidates.length / 2)];

        // REGLA C: ZONA DE RESPETO (Checkeo de vecindario 3x3)
        // Asegurar que no hay NINGUNA otra puerta pegada a esta posición.
        let nearbyDoor = false;
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue; // Saltamos la propia casilla
                
                const checkY = best.y + dy;
                const checkX = best.x + dx;
                
                if (map[checkY]?.[checkX] === TILE.DOOR) {
                    nearbyDoor = true;
                }
            }
        }

        // Si la zona está despejada, colocamos la puerta
        if (!nearbyDoor) {
            map[best.y][best.x] = TILE.DOOR;
        }
      }
    });
  });
}

function carveVerticalCorridor(map, y1, y2, x) {
  const start = Math.min(y1, y2);
  const end = Math.max(y1, y2);
  for (let y = start; y <= end; y++) {
    if (x > 0 && x < map[0].length - 1) map[y][x] = TILE.FLOOR;
  }
}

function placeEntities(map, entities, rooms, types, count, excludeRoomIndices) {
  let placed = 0;
  let attempts = 0;
  while (placed < count && attempts < 100) {
    attempts++;
    const roomIndex = Math.floor(Math.random() * rooms.length);
    if (excludeRoomIndices.includes(roomIndex)) continue;
    const room = rooms[roomIndex];
    const x = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
    const y = room.y + 1 + Math.floor(Math.random() * (room.height - 2));
    if (map[y][x] === TILE.FLOOR && entities[y][x] === ENTITY.NONE) {
      entities[y][x] = types[Math.floor(Math.random() * types.length)];
      placed++;
    }
  }
}

export { TILE, ENTITY, ENEMY_STATS };