// Generador procedimental de mazmorras para roguelike
import { generateLevelItems } from './ItemSystem';
import { TILE, ENTITY } from '@/data/constants';
import { ENEMY_STATS } from '@/data/enemies';

const PREFABS = {
  SHRINE: [
    [99, 99, 99, 99, 99],
    [99,  1,  1,  1, 99],
    [99,  1, 'W',  1, 99], // Fuente en el centro
    [99,  1,  1,  1, 99],
    [99, 99,  3, 99, 99]  // 3 = Puerta
  ],
  OUTPOST: [
    ['B',  1, 'B'],
    [ 1, 'T',  1], // Trampa oculta entre barriles
    ['B',  1, 'B']
  ],
  TREASURE_CORNER: [
    [99, 99, 99, 99],
    [99, 'C',  1, 99], // Cofre protegido
    [99,  1, 'T', 99], // Trampa en la entrada
    [99, 99, 99, 99]
  ]
};

// --- LÓGICA DE CUEVAS (Autómatas Celulares) ---

function generateCaveMap(width, height) {
  // 1. Llenar mapa con ruido aleatorio (45% muros)
  let map = Array(height).fill(null).map(() => Array(width).fill(0));
  for(let y=0; y<height; y++) {
      for(let x=0; x<width; x++) {
          // Bordes siempre muro
          if(x===0 || x===width-1 || y===0 || y===height-1) map[y][x] = TILE.WALL;
          else map[y][x] = Math.random() < 0.45 ? TILE.WALL : TILE.FLOOR;
      }
  }

  // 2. Suavizar (Simulación) - 5 iteraciones
  for(let i=0; i<5; i++) {
      map = doSimulationStep(map);
  }

  return map;
}

function doSimulationStep(oldMap) {
  const height = oldMap.length;
  const width = oldMap[0].length;
  const newMap = Array(height).fill(null).map(() => Array(width).fill(0));

  for(let y=0; y<height; y++) {
      for(let x=0; x<width; x++) {
          if(x===0 || x===width-1 || y===0 || y===height-1) {
              newMap[y][x] = TILE.WALL;
          } else {
              const neighbors = countWallNeighbors(oldMap, x, y);
              // Reglas clásicas de cuevas:
              // Si tienes mas de 4 vecinos muro, te vuelves muro. Si no, suelo.
              if(neighbors > 4) newMap[y][x] = TILE.WALL;
              else if(neighbors < 4) newMap[y][x] = TILE.FLOOR;
              else newMap[y][x] = oldMap[y][x]; // Mantener estado
          }
      }
  }
  return newMap;
}

function countWallNeighbors(map, x, y) {
  let count = 0;
  for(let i=-1; i<=1; i++) {
      for(let j=-1; j<=1; j++) {
          if(i===0 && j===0) continue;
          const nx = x+i;
          const ny = y+j;
          // Fuera del mapa cuenta como muro
          if(nx<0 || ny<0 || nx>=map[0].length || ny>=map.length) count++;
          else if(map[ny][nx] === TILE.WALL) count++;
      }
  }
  return count;
}

function placePrefabs(map, entities, items, level) {
    // Intentar colocar 2 o 3 prefabs por nivel
    const attempts = 100;
    const prefabsToPlace = Object.values(PREFABS); // Usar lista de prefabs

    for(let i=0; i<2; i++) { // Intentar poner 2 estructuras
        let placed = false;
        let attempt = 0;
        
        // Elegir prefab aleatorio
        const prefab = prefabsToPlace[Math.floor(Math.random() * prefabsToPlace.length)];
        const pH = prefab.length;
        const pW = prefab[0].length;

        while(!placed && attempt < attempts) {
            attempt++;
            // Posición aleatoria
            const x = Math.floor(Math.random() * (map[0].length - pW - 2)) + 1;
            const y = Math.floor(Math.random() * (map.length - pH - 2)) + 1;

            // Chequear si cabe (No queremos romper muros importantes o bloquear pasillos estrechos)
            // Para simplificar: Solo colocamos si la zona es mayoritariamente suelo
            let canFit = true;
            for(let py=0; py<pH; py++) {
                for(let px=0; px<pW; px++) {
                    if (map[y+py][x+px] === TILE.WALL && prefab[py][px] !== 99) {
                       // Si el prefab quiere poner suelo donde hay muro, permitimos "excavar" 
                       // pero con cuidado. Por ahora, simple:
                    }
                }
            }

            // Estampar
            if(canFit) {
                for(let py=0; py<pH; py++) {
                    for(let px=0; px<pW; px++) {
                        const cell = prefab[py][px];
                        const targetX = x+px;
                        const targetY = y+py;

                        if (cell === 99) map[targetY][targetX] = TILE.WALL;
                        else if (cell === 1) map[targetY][targetX] = TILE.FLOOR;
                        else if (cell === 3) map[targetY][targetX] = TILE.DOOR;
                        else if (cell === 'W') map[targetY][targetX] = TILE.WATER;
                        else if (cell === 'T') map[targetY][targetX] = TILE.TRAP;
                        else if (cell === 'B') map[targetY][targetX] = TILE.BARREL;
                        else if (cell === 'C') {
                            map[targetY][targetX] = TILE.FLOOR;
                            // Añadir cofre manualmente a la lista de items especial
                            // (Simplificación: lo marcamos como suelo y spawnearíamos cofre aquí)
                            // Para hacerlo bien, deberíamos añadirlo a la lista de cofres, 
                            // pero por ahora dejémoslo como suelo visual.
                        }
                    }
                }
                placed = true;
            }
        }
    }
}

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

function addTerrainFeatures(map, rooms, level) {
  rooms.forEach(room => {
    // Bajamos la probabilidad general de 40% a 30%
    if (Math.random() > 0.7) {
      const type = Math.random();
      
      // A) CHARCO DE AGUA / LODO (50% de las veces que hay terreno especial)
      if (type > 0.5) {
        const liquid = level > 4 ? TILE.MUD : TILE.WATER;
        const cx = Math.floor(room.x + room.width / 2);
        const cy = Math.floor(room.y + room.height / 2);
        
        [{x:0,y:0}, {x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}].forEach(offset => {
            const tx = cx + offset.x;
            const ty = cy + offset.y;
            if (map[ty]?.[tx] === TILE.FLOOR) map[ty][tx] = liquid;
        });
      }
      
      // B) TRAMPAS (Ahora más raras: type > 0.35 en vez de 0.2)
      // Esto reduce significativamente su aparición frente a los escombros
      else if (type > 0.35) {
         // Reducimos cantidad: Ahora solo 1 o 2 trampas máx (antes eran hasta 3)
         const numTraps = Math.floor(Math.random() * 2) + 1;
         
         for(let i=0; i<numTraps; i++) {
             const tx = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
             const ty = room.y + 1 + Math.floor(Math.random() * (room.height - 2));
             if (map[ty]?.[tx] === TILE.FLOOR) {
                 map[ty][tx] = TILE.TRAP;
             }
         }
      }
      
      // C) ESCOMBROS (El resto de probabilidades)
      else {
         const tx = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
         const ty = room.y + 1 + Math.floor(Math.random() * (room.height - 2));
         if (map[ty]?.[tx] === TILE.FLOOR) {
             map[ty][tx] = TILE.RUBBLE;
         }
      }
      
      
    }
  });
}

// Funciones auxiliares
function carveHorizontalCorridor(map, x1, x2, y) {
  const start = Math.min(x1, x2);
  const end = Math.max(x1, x2);
  for (let x = start; x <= end; x++) {
    if (y > 0 && y < map.length - 1) map[y][x] = TILE.FLOOR;
  }
}

function carveVerticalCorridor(map, y1, y2, x) {
  const start = Math.min(y1, y2);
  const end = Math.max(y1, y2);
  for (let y = start; y <= end; y++) {
    if (x > 0 && x < map[0].length - 1) map[y][x] = TILE.FLOOR;
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

// src/engine/systems/DungeonGenerator.js

// ... (Imports y funciones anteriores se mantienen) ...

export function generateDungeon(width, height, level, playerLevel = 1) {
  let map = [];
  const entities = Array(height).fill(null).map(() => Array(width).fill(ENTITY.NONE));
  let rooms = [];
  
  // DECISIÓN: ¿CUEVA O HABITACIONES?
  // Nivel 3, 6, 9... son cuevas (Bestias)
  const isCave = (level % 3 === 0);

  if (isCave) {
      // --- GENERACIÓN TIPO CUEVA ---
      map = generateCaveMap(width, height);
      // Las cuevas no tienen "habitaciones" definidas, así que creamos 
      // regiones virtuales para spawnear enemigos.
      // Un truco simple: dividir el mapa en cuadrantes para simular "rooms"
      const cols = 4; const rows = 4;
      const cw = Math.floor(width/cols); const ch = Math.floor(height/rows);
      for(let r=0; r<rows; r++) {
          for(let c=0; c<cols; c++) {
              rooms.push({ x: c*cw, y: r*ch, width: cw, height: ch });
          }
      }
  } else {
      // --- GENERACIÓN CLÁSICA (HABITACIONES) ---
      map = Array(height).fill(null).map(() => Array(width).fill(TILE.WALL));
      
      const roomCount = 6 + Math.floor(Math.random() * 4) + level;
      for (let i = 0; i < roomCount * 3; i++) {
        if (rooms.length >= roomCount) break;
        const roomWidth = 4 + Math.floor(Math.random() * 6);
        const roomHeight = 4 + Math.floor(Math.random() * 5);
        const x = 1 + Math.floor(Math.random() * (width - roomWidth - 2));
        const y = 1 + Math.floor(Math.random() * (height - roomHeight - 2));
        
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
          for (let ry = y; ry < y + roomHeight; ry++) {
            for (let rx = x; rx < x + roomWidth; rx++) {
              map[ry][rx] = TILE.FLOOR;
            }
          }
        }
      }
      // Conectar habitaciones
      for (let i = 1; i < rooms.length; i++) {
        const prev = rooms[i - 1];
        const curr = rooms[i];
        const prevCenterX = Math.floor(prev.x + prev.width / 2);
        const prevCenterY = Math.floor(prev.y + prev.height / 2);
        const currCenterX = Math.floor(curr.x + curr.width / 2);
        const currCenterY = Math.floor(curr.y + curr.height / 2);
        if (Math.random() > 0.5) {
          carveHorizontalCorridor(map, prevCenterX, currCenterX, prevCenterY);
          carveVerticalCorridor(map, prevCenterY, currCenterY, currCenterX);
        } else {
          carveVerticalCorridor(map, prevCenterY, currCenterY, prevCenterX);
          carveHorizontalCorridor(map, prevCenterX, currCenterX, currCenterY);
        }
      }
      // Puertas solo en mazmorras construidas
      placeDoors(map, rooms);
  }

  // --- CARACTERÍSTICAS COMUNES ---

  // 1. Prefabs (Estructuras) - ¡NUEVO!
  // Intentamos colocar estructuras especiales antes de decorar
  placePrefabs(map, entities, [], level);

  // 2. Terreno Interactivo (Agua, trampas, etc.)
  addTerrainFeatures(map, rooms, level);

  // 3. Encontrar puntos libres seguros para inicio/fin
  // En cuevas es más difícil, así que buscamos puntos aleatorios que sean SUELO
  function findRandomFloor() {
      let limit = 1000;
      while(limit > 0) {
          const rx = Math.floor(Math.random() * width);
          const ry = Math.floor(Math.random() * height);
          if(map[ry][rx] === TILE.FLOOR) return {x: rx, y: ry};
          limit--;
      }
      return {x: 1, y: 1}; // Fallback
  }

  // Inicio Jugador
  let startPos;
  if(isCave) startPos = findRandomFloor();
  else startPos = { x: Math.floor(rooms[0].x + rooms[0].width/2), y: Math.floor(rooms[0].y + rooms[0].height/2) };
  
  const playerX = startPos.x; 
  const playerY = startPos.y;
  map[playerY][playerX] = TILE.FLOOR; // Asegurar suelo

  // Escaleras Subida
  let stairsUp = null;
  if (level > 1) {
    // Buscar punto adyacente o usar lógica anterior
    const ux = playerX + (playerX < width-2 ? 1 : -1);
    map[playerY][ux] = TILE.STAIRS_UP;
    stairsUp = { x: ux, y: playerY };
  }
  
  // Escaleras Bajada (Lo más lejos posible en cuevas, o última sala en rooms)
  let stairsPos;
  if(isCave) stairsPos = findRandomFloor(); // Idealmente buscar lejano, simplificado por ahora
  else {
      const lastRoom = rooms[rooms.length - 1];
      stairsPos = { x: Math.floor(lastRoom.x + lastRoom.width/2), y: Math.floor(lastRoom.y + lastRoom.height/2) };
  }
  map[stairsPos.y][stairsPos.x] = TILE.STAIRS;
  
  // 4. Enemigos
  const enemyTypes = getEnemiesForLevel(level);
  const enemyCount = 4 + level * 2 + Math.floor(Math.random() * 3);
  // Pasamos rooms aunque sea cueva (son cuadrantes virtuales) para distribuir mejor
  placeEntities(map, entities, rooms, enemyTypes, enemyCount, []); 
  
  // Jefe
  const bossType = getBossForLevel(level);
  // Buscar sitio cerca de la salida
  let bossX = stairsPos.x + (Math.random()>0.5?1:-1);
  let bossY = stairsPos.y + (Math.random()>0.5?1:-1);
  if (map[bossY]?.[bossX] !== TILE.FLOOR) { bossX = stairsPos.x; bossY = stairsPos.y; } // Fallback encima escalera si no hay sitio
  entities[bossY][bossX] = bossType;

  // 5. Botín
  const generatedItems = generateLevelItems(level, rooms, map, []);
  const chests = [];
  const items = [];
  
  generatedItems.forEach(item => {
    // Asegurar que no caiga en muro o barril
    if (map[item.y][item.x] === TILE.WALL || map[item.y][item.x] === TILE.BARREL) return;
    
    if (item.category === 'currency') items.push(item);
    else chests.push({ x: item.x, y: item.y, item: item, rarity: item.rarity, opened: false });
  });

  // 6. Antorchas
  const torches = [];
  // Lógica simple de antorchas: Poner en muros adyacentes a suelo
  for(let y=1; y<height-1; y++) {
      for(let x=1; x<width-1; x++) {
          if(map[y][x] === TILE.WALL && Math.random() > 0.95) { // 5% prob en cualquier muro
             const hasFloor = [map[y+1][x], map[y-1][x], map[y][x+1], map[y][x-1]].includes(TILE.FLOOR);
             if(hasFloor) torches.push({x, y});
          }
      }
  }

  // 7. Compilar Enemigos
  const enemies = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const entity = entities[y][x];
      if (entity >= 2) {
        const baseStats = ENEMY_STATS[entity];
        if (baseStats) {
          const scaled = scaleEnemyStats(baseStats, playerLevel, level);
          enemies.push({ x, y, type: entity, ...scaled, isBoss: baseStats.isBoss || false, stunned: 0, slowed: 0, poisoned: 0 });
        }
      }
    }
  }
  
  return { 
    map, entities, enemies, rooms, 
    playerStart: { x: playerX, y: playerY }, 
    stairs: stairsPos, 
    stairsUp, items, chests, torches 
  };
}

// --- ACTUALIZACIÓN CRÍTICA AQUÍ ---
function placeEntities(map, entities, rooms, types, count, excludeRoomIndices) {
  let placed = 0;
  let attempts = 0;
  
  // Permitimos spawn en Suelo, Agua, Lodo y Trampas
  // IMPORTANTE: NO permitimos TILE.RUBBLE (escombros) porque bloquean
  const validSpawnTiles = [TILE.FLOOR, TILE.WATER, TILE.MUD, TILE.TRAP];

  while (placed < count && attempts < 100) {
    attempts++;
    const roomIndex = Math.floor(Math.random() * rooms.length);
    if (excludeRoomIndices.includes(roomIndex)) continue;
    const room = rooms[roomIndex];
    const x = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
    const y = room.y + 1 + Math.floor(Math.random() * (room.height - 2));
    
    // Verificación actualizada
    if (validSpawnTiles.includes(map[y][x]) && entities[y][x] === ENTITY.NONE) {
      entities[y][x] = types[Math.floor(Math.random() * types.length)];
      placed++;
    }
  }
}

export { TILE, ENTITY, ENEMY_STATS };