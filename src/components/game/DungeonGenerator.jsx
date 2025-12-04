// Generador procedimental de mazmorras para roguelike
import { generateLevelItems } from './ItemSystem';

// Definición de tipos de casilla (Tiles)
const TILE = {
  WALL: 0,      // Pared
  FLOOR: 1,     // Suelo
  STAIRS: 2,    // Escaleras bajada
  DOOR: 3,      // Puerta (si se implementa visualmente)
  STAIRS_UP: 4, // Escaleras subida
};

// Identificadores de Entidades
const ENTITY = {
  NONE: 0,
  PLAYER: 1,
  // Enemigos básicos
  ENEMY_RAT: 2,
  ENEMY_BAT: 3,
  ENEMY_GOBLIN: 4,
  ENEMY_SKELETON: 5,
  ENEMY_ORC: 6,
  ENEMY_SPIDER: 7,
  ENEMY_ZOMBIE: 8,
  ENEMY_TROLL: 9,
  ENEMY_WRAITH: 10,
  ENEMY_DEMON: 11,
  ENEMY_DRAGON: 12,
  // Nuevos enemigos
  ENEMY_SLIME: 13,
  ENEMY_WOLF: 14,
  ENEMY_CULTIST: 15,
  ENEMY_GOLEM: 16,
  ENEMY_VAMPIRE: 17,
  ENEMY_MIMIC: 18,
  // Jefes (Bosses)
  BOSS_GOBLIN_KING: 100,
  BOSS_SKELETON_LORD: 101,
  BOSS_ORC_WARLORD: 102,
  BOSS_SPIDER_QUEEN: 103,
  BOSS_LICH: 104,
  BOSS_DEMON_LORD: 105,
  BOSS_ANCIENT_DRAGON: 106,
  // Jefes Nuevos
  BOSS_VAMPIRE_LORD: 107,
  BOSS_GOLEM_KING: 108,
};

// Estadísticas base de los enemigos
const ENEMY_STATS = {
  // Enemigos básicos - aparecen en diferentes niveles
  [ENTITY.ENEMY_RAT]: { name: 'Rata', hp: 6, attack: 2, defense: 0, exp: 3, symbol: 'r', color: '#a1a1aa', minLevel: 1 },
  [ENTITY.ENEMY_BAT]: { name: 'Murciélago', hp: 8, attack: 3, defense: 0, exp: 4, symbol: 'b', color: '#71717a', minLevel: 1 },
  [ENTITY.ENEMY_GOBLIN]: { name: 'Goblin', hp: 12, attack: 4, defense: 1, exp: 6, symbol: 'g', color: '#4ade80', minLevel: 1 },
  [ENTITY.ENEMY_SLIME]: { name: 'Slime', hp: 10, attack: 2, defense: 1, exp: 4, symbol: '○', color: '#22d3ee', minLevel: 1 },
  [ENTITY.ENEMY_SKELETON]: { name: 'Esqueleto', hp: 15, attack: 5, defense: 2, exp: 8, symbol: 's', color: '#e5e5e5', minLevel: 2 },
  [ENTITY.ENEMY_ORC]: { name: 'Orco', hp: 22, attack: 6, defense: 3, exp: 12, symbol: 'o', color: '#f97316', minLevel: 2 },
  [ENTITY.ENEMY_WOLF]: { name: 'Lobo Salvaje', hp: 16, attack: 7, defense: 2, exp: 10, symbol: 'w', color: '#78716c', minLevel: 2 },
  [ENTITY.ENEMY_SPIDER]: { name: 'Araña Gigante', hp: 18, attack: 7, defense: 2, exp: 10, symbol: 'S', color: '#7c3aed', minLevel: 3 },
  [ENTITY.ENEMY_ZOMBIE]: { name: 'Zombi', hp: 30, attack: 6, defense: 4, exp: 14, symbol: 'z', color: '#65a30d', minLevel: 3 },
  [ENTITY.ENEMY_CULTIST]: { name: 'Cultista', hp: 20, attack: 9, defense: 2, exp: 15, symbol: 'c', color: '#be123c', minLevel: 3 },
  [ENTITY.ENEMY_TROLL]: { name: 'Trol', hp: 40, attack: 9, defense: 5, exp: 22, symbol: 'T', color: '#a855f7', minLevel: 4 },
  [ENTITY.ENEMY_GOLEM]: { name: 'Gólem', hp: 50, attack: 8, defense: 8, exp: 28, symbol: 'G', color: '#78716c', minLevel: 4 },
  [ENTITY.ENEMY_WRAITH]: { name: 'Espectro', hp: 35, attack: 11, defense: 3, exp: 25, symbol: 'W', color: '#6366f1', minLevel: 5 },
  [ENTITY.ENEMY_VAMPIRE]: { name: 'Vampiro', hp: 45, attack: 12, defense: 4, exp: 32, symbol: 'V', color: '#7f1d1d', minLevel: 5 },
  [ENTITY.ENEMY_MIMIC]: { name: 'Mimico', hp: 38, attack: 14, defense: 5, exp: 35, symbol: 'M', color: '#92400e', minLevel: 5 },
  [ENTITY.ENEMY_DEMON]: { name: 'Demonio', hp: 55, attack: 13, defense: 6, exp: 35, symbol: 'D', color: '#ef4444', minLevel: 6 },
  [ENTITY.ENEMY_DRAGON]: { name: 'Dragón Joven', hp: 70, attack: 15, defense: 8, exp: 50, symbol: 'd', color: '#f59e0b', minLevel: 7 },
  
  // Jefes - uno por piso
  [ENTITY.BOSS_GOBLIN_KING]: { name: 'Rey Goblin', hp: 60, attack: 8, defense: 4, exp: 50, symbol: 'G', color: '#22c55e', isBoss: true, minLevel: 1 },
  [ENTITY.BOSS_SKELETON_LORD]: { name: 'Señor Esqueleto', hp: 80, attack: 10, defense: 5, exp: 70, symbol: 'L', color: '#fafafa', isBoss: true, minLevel: 2 },
  [ENTITY.BOSS_ORC_WARLORD]: { name: 'Señor de la Guerra Orco', hp: 100, attack: 12, defense: 6, exp: 90, symbol: 'O', color: '#ea580c', isBoss: true, minLevel: 3 },
  [ENTITY.BOSS_SPIDER_QUEEN]: { name: 'Reina Araña', hp: 90, attack: 14, defense: 5, exp: 100, symbol: 'Q', color: '#9333ea', isBoss: true, minLevel: 4 },
  [ENTITY.BOSS_GOLEM_KING]: { name: 'Rey Gólem', hp: 140, attack: 14, defense: 12, exp: 120, symbol: 'K', color: '#57534e', isBoss: true, minLevel: 4 },
  [ENTITY.BOSS_LICH]: { name: 'Liche', hp: 120, attack: 16, defense: 7, exp: 130, symbol: 'L', color: '#06b6d4', isBoss: true, minLevel: 5 },
  [ENTITY.BOSS_VAMPIRE_LORD]: { name: 'Señor Vampiro', hp: 130, attack: 17, defense: 6, exp: 145, symbol: 'V', color: '#991b1b', isBoss: true, minLevel: 5 },
  [ENTITY.BOSS_DEMON_LORD]: { name: 'Señor Demonio', hp: 150, attack: 18, defense: 8, exp: 160, symbol: 'D', color: '#dc2626', isBoss: true, minLevel: 6 },
  [ENTITY.BOSS_ANCIENT_DRAGON]: { name: 'Dragón Ancestral', hp: 200, attack: 22, defense: 10, exp: 250, symbol: 'D', color: '#fbbf24', isBoss: true, minLevel: 7 },
};

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
function scaleEnemyStats(baseStats, playerLevel, dungeonLevel) {
  const scaleFactor = 1 + (playerLevel * 0.08) + (dungeonLevel * 0.05);
  const scaledHp = Math.floor(baseStats.hp * scaleFactor);
  
  return {
    ...baseStats,
    hp: scaledHp,
    maxHp: scaledHp, // <--- Esta es la corrección clave
    attack: Math.floor(baseStats.attack * scaleFactor),
    defense: Math.floor(baseStats.defense * (1 + playerLevel * 0.03)),
    exp: Math.floor(baseStats.exp * (1 + playerLevel * 0.05)),
  };
}

// Función principal de generación de mazmorra
function generateDungeon(width, height, level, playerLevel = 1) {
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
  
  // 3. Colocar al Jugador (Primera habitación)
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
  
  // 4. Colocar escaleras de bajada (Última habitación)
  const lastRoom = rooms[rooms.length - 1];
  const stairsX = Math.floor(lastRoom.x + lastRoom.width / 2);
  const stairsY = Math.floor(lastRoom.y + lastRoom.height / 2);
  map[stairsY][stairsX] = TILE.STAIRS;
  
  // 5. Generar Enemigos
  const enemyTypes = getEnemiesForLevel(level);
  const enemyCount = 4 + level * 2 + Math.floor(Math.random() * 3);
  const lastRoomIndex = rooms.length - 1;
  placeEntities(map, entities, rooms, enemyTypes, enemyCount, [0, lastRoomIndex]);
  
  // 6. Colocar Jefe (En la habitación de salida)
  const bossType = getBossForLevel(level);
  const bossRoom = rooms[lastRoomIndex];
  const bossX = Math.floor(bossRoom.x + bossRoom.width / 2);
  const bossY = Math.floor(bossRoom.y + bossRoom.height / 2);
  
  // Ajustar posición del jefe para no bloquear escaleras directamente
  const bossOffsetX = bossX !== stairsX ? 0 : (bossX > bossRoom.x + 1 ? -1 : 1);
  const bossOffsetY = bossY !== stairsY ? 0 : (bossY > bossRoom.y + 1 ? -1 : 1);
  entities[bossY + bossOffsetY][bossX + bossOffsetX] = bossType;
  
  // 7. Generar Botín (Items y Cofres)
  const generatedItems = generateLevelItems(level, rooms, map, [0]);
  const chests = [];
  const items = []; // Items sueltos como oro
  
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
  
  // 8. Colocar decoración (Antorchas)
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
        // Probabilidad de antorcha en pared
        if (map[pos.y][pos.x] === TILE.WALL && Math.random() > 0.3) {
          const adjacentToFloor = [
            [pos.x - 1, pos.y], [pos.x + 1, pos.y],
            [pos.x, pos.y - 1], [pos.x, pos.y + 1]
          ].some(([ax, ay]) => map[ay]?.[ax] === TILE.FLOOR);
          
          if (adjacentToFloor) {
            torches.push({ x: pos.x, y: pos.y });
          }
        }
      }
    });
  });
  
  return { 
    map, 
    entities, 
    rooms, 
    playerStart: { x: playerX, y: playerY }, 
    stairs: { x: stairsX, y: stairsY }, 
    stairsUp, 
    items, 
    chests, 
    torches 
  };
}

// Funciones auxiliares para excavar pasillos
function carveHorizontalCorridor(map, x1, x2, y) {
  const start = Math.min(x1, x2);
  const end = Math.max(x1, x2);
  for (let x = start; x <= end; x++) {
    if (y > 0 && y < map.length - 1) {
      map[y][x] = TILE.FLOOR;
    }
  }
}

function carveVerticalCorridor(map, y1, y2, x) {
  const start = Math.min(y1, y2);
  const end = Math.max(y1, y2);
  for (let y = start; y <= end; y++) {
    if (x > 0 && x < map[0].length - 1) {
      map[y][x] = TILE.FLOOR;
    }
  }
}

// Colocar entidades aleatoriamente evitando ciertas habitaciones
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

export { generateDungeon, TILE, ENTITY, ENEMY_STATS, scaleEnemyStats };