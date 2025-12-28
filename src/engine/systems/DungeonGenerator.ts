// Generador procedimental de mazmorras para roguelike
import { generateLevelItems } from './ItemSystem';
import { TILE, ENTITY } from '@/data/constants';
import { ENEMY_STATS, EnemyStats } from '@/data/enemies';
import { Entity, SpriteComponent, Stats, Point, Item, Chest, Enemy } from '@/types';
import { getSpriteForEnemy } from '@/data/sprites';

// Tipos locales
export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WallSegment {
  axis: 'x' | 'y';
  start: number;
  end: number;
  fixed: number;
}

// Obtener el jefe correspondiente al nivel
function getBossForLevel(level: number): number {
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
function getEnemiesForLevel(level: number): number[] {
  const available: number[] = [];
  for (const [entityId, stats] of Object.entries(ENEMY_STATS)) {
    const s = stats as EnemyStats;
    if (!s.isBoss && s.minLevel <= level) {
      available.push(parseInt(entityId));
    }
  }
  return available;
}

// Helper para configurar el sprite según el tipo de enemigo
// Sprite logic moved to src/data/sprites.ts

/**
 * Scales enemy stats based on current difficulty curve.
 * @param baseStats The base stats from the enemy template
 * @param playerLevel Current player level
 * @param dungeonLevel Current dungeon floor depth
 */
export function scaleEnemyStats(baseStats: Stats, playerLevel: number, dungeonLevel: number): Stats {
  const scaleFactor = 1 + (playerLevel * 0.08) + (dungeonLevel * 0.05);
  const hp = baseStats.hp || 10;
  const scaledHp = Math.floor(hp * scaleFactor);

  return {
    ...baseStats,
    hp: scaledHp,
    maxHp: scaledHp,
    attack: Math.floor((baseStats.attack || 5) * scaleFactor),
    defense: Math.floor((baseStats.defense || 0) * (1 + playerLevel * 0.03)),
    exp: Math.floor((baseStats.exp || 10) * (1 + playerLevel * 0.05)),
  };
}

export interface DungeonResult {
  map: number[][];
  entities: number[][];
  enemies: Entity[];
  rooms: Room[];
  playerStart: Point;
  stairs: Point;
  stairsUp: Point | null;
  items: Item[];
  chests: Chest[];
  torches: Point[];
}

/**
 * Generates a complete dungeon layout including map, entities, and items.
 * Uses a BSP-like room generation algorithm with corridor connections.
 * @param width Map width
 * @param height Map height
 * @param level Difficulty/Floor level
 * @param playerLevel Current player level for scaling
 */
/**
 * Generates a complete dungeon layout including map, entities, and items.
 * Uses a BSP-like room generation algorithm with corridor connections.
 * @param width Map width
 * @param height Map height
 * @param level Difficulty/Floor level
 * @param playerLevel Current player level for scaling
 */
export function generateDungeon(width: number, height: number, level: number, playerLevel = 1): DungeonResult {
  const map: number[][] = Array(height).fill(null).map(() => Array(width).fill(TILE.WALL));
  const entitiesGrid: number[][] = Array(height).fill(null).map(() => Array(width).fill(ENTITY.NONE));
  const rooms: Room[] = [];

  // Increase room count logic slightly for larger map
  // Rooms are generated in two phases now: Halls and Structured Rooms

  // 1. Generate Rooms (Hybrid Approach)

  // Phase A: Organic Halls (Large, allow overlaps for clumps)
  // These create the "organic" chaotic centers of the dungeon
  const hallCount = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < hallCount; i++) {
    const roomWidth = 10 + Math.floor(Math.random() * 8);
    const roomHeight = 10 + Math.floor(Math.random() * 8);
    const x = 2 + Math.floor(Math.random() * (width - roomWidth - 4));
    const y = 2 + Math.floor(Math.random() * (height - roomHeight - 4));

    const newRoom = { x, y, width: roomWidth, height: roomHeight };
    rooms.push(newRoom);

    // Carve instantly
    for (let ry = y; ry < y + roomHeight; ry++) {
      for (let rx = x; rx < x + roomWidth; rx++) {
        map[ry][rx] = TILE.FLOOR;
      }
    }
  }

  // Phase B: Structured Rooms (Standard, try strict non-overlap)
  // These provide the "ordered" feel and guarantee door spots
  const standardRoomCount = 8 + level + Math.floor(Math.random() * 4);
  let placedStandard = 0;
  let attempts = 0;

  while (placedStandard < standardRoomCount && attempts < 200) {
    attempts++;
    const roomWidth = 5 + Math.floor(Math.random() * 6); // 5-10
    const roomHeight = 5 + Math.floor(Math.random() * 6); // 5-10
    const x = 2 + Math.floor(Math.random() * (width - roomWidth - 4));
    const y = 2 + Math.floor(Math.random() * (height - roomHeight - 4));

    // Check overlap with EXISTING rooms (including Halls)
    // We want a buffer of 1 wall between structured rooms to ensure corridors/doors
    let overlap = false;
    for (const r of rooms) {
      // Check collision with 2 tile buffer for distinctness
      if (
        x < r.x + r.width + 2 &&
        x + roomWidth + 2 > r.x &&
        y < r.y + r.height + 2 &&
        y + roomHeight + 2 > r.y
      ) {
        overlap = true;
        break;
      }
    }

    if (!overlap) {
      const newRoom = { x, y, width: roomWidth, height: roomHeight };
      rooms.push(newRoom);

      // Carve
      for (let ry = y; ry < y + roomHeight; ry++) {
        for (let rx = x; rx < x + roomWidth; rx++) {
          map[ry][rx] = TILE.FLOOR;
        }
      }
      placedStandard++;
    }
  }

  // 2. Connect rooms with corridors
  // Since rooms might overlap, we still connect them to ensure reachability.
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

  // 3. Smooth Map (Organic Look)
  // Cellular Automata smoothing rules
  // Run a few passes to erode sharp corners and walls
  smoothMap(map, 2);

  // 4. Place Doors (Sparse)
  placeDoors(map, rooms);

  // 5. Ensure Connectivity (Flood Fill + Tunneling)
  // This guarantees that all rooms are accessible even if the random corridors failed.
  // We repeat this process until the whole dungeon is a single connected component.
  let connected = false;
  let connectionAttempts = 0;

  while (!connected && connectionAttempts < 10) {
    connectionAttempts++;
    const startNode = rooms[0];
    const startX = Math.floor(startNode.x + startNode.width / 2);
    const startY = Math.floor(startNode.y + startNode.height / 2);

    // Safety: Ensure start is floor (might be walled by smoothing)
    if (map[startY][startX] === TILE.WALL) map[startY][startX] = TILE.FLOOR;

    const visited = new Set<string>();
    const q: Point[] = [{ x: startX, y: startY }];
    visited.add(`${startX},${startY}`);

    // BFS to find all reachable tiles from Room 0
    while (q.length > 0) {
      const { x, y } = q.shift()!;
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const key = `${nx},${ny}`;
          if (!visited.has(key) && (map[ny][nx] === TILE.FLOOR || map[ny][nx] === TILE.DOOR)) {
            visited.add(key);
            q.push({ x: nx, y: ny });
          }
        }
      }
    }

    // Check if any room center is NOT visited
    let unconnectedRoom: Room | null = null;

    // We start checking from index 1 since 0 is start
    for (let i = 1; i < rooms.length; i++) {
      const r = rooms[i];
      const cx = Math.floor(r.x + r.width / 2);
      const cy = Math.floor(r.y + r.height / 2);

      // Ensure center is floor for consistency
      if (map[cy][cx] === TILE.WALL) map[cy][cx] = TILE.FLOOR;

      if (!visited.has(`${cx},${cy}`)) {
        unconnectedRoom = r;
        break;
      }
    }

    if (!unconnectedRoom) {
      connected = true; // All rooms connected!
    } else {
      // Find the closest CONNECTED room to this disconnected one
      let bestDist = Infinity;
      let bestCandidate: Room | null = null;

      const curCx = Math.floor(unconnectedRoom.x + unconnectedRoom.width / 2);
      const curCy = Math.floor(unconnectedRoom.y + unconnectedRoom.height / 2);

      for (const r of rooms) {
        const cx = Math.floor(r.x + r.width / 2);
        const cy = Math.floor(r.y + r.height / 2);
        // Must be a room that IS visited
        if (visited.has(`${cx},${cy}`)) {
          const d = Math.abs(cx - curCx) + Math.abs(cy - curCy);
          if (d < bestDist) {
            bestDist = d;
            bestCandidate = r;
          }
        }
      }

      if (bestCandidate) {
        // Dig a tunnel from the connected room to the disconnected one
        const targetCx = Math.floor(bestCandidate.x + bestCandidate.width / 2);
        const targetCy = Math.floor(bestCandidate.y + bestCandidate.height / 2);

        // Force carve to guarantee connection
        if (Math.random() > 0.5) {
          carveHorizontalCorridor(map, curCx, targetCx, curCy);
          carveVerticalCorridor(map, curCy, targetCy, targetCx);
        } else {
          carveVerticalCorridor(map, curCy, targetCy, curCx);
          carveHorizontalCorridor(map, curCx, targetCx, targetCy);
        }
      } else {
        // Should impossible if Room 0 is visited. 
        // Means NO rooms are visited? (Start point error?)
        // Just break loop to avoid infinite freeze.
        connected = true;
      }
    }
  }

  // 6. Player Start (First room center - adjusted if wall due to smoothing)
  const firstRoom = rooms[0];
  let playerX = Math.floor(firstRoom.x + firstRoom.width / 2);
  let playerY = Math.floor(firstRoom.y + firstRoom.height / 2);
  // Find nearest floor if smoothing made it a wall
  if (map[playerY][playerX] !== TILE.FLOOR) {
    const neighbor = findNearestFloor(map, playerX, playerY);
    if (neighbor) { playerX = neighbor.x; playerY = neighbor.y; }
  }

  // 7. Stairs Up
  let stairsUp: Point | null = null;
  if (level > 1) {
    // Try to place near player but not on top
    let upX = playerX + 1;
    let upY = playerY + 1;
    if (map[upY]?.[upX] === TILE.FLOOR) {
      map[upY][upX] = TILE.STAIRS_UP;
      stairsUp = { x: upX, y: upY };
    }
  }

  // 8. Stairs Down (Last room)
  const lastRoom = rooms[rooms.length - 1];
  let stairsX = Math.floor(lastRoom.x + lastRoom.width / 2);
  let stairsY = Math.floor(lastRoom.y + lastRoom.height / 2);
  if (map[stairsY][stairsX] !== TILE.FLOOR) {
    const neighbor = findNearestFloor(map, stairsX, stairsY);
    if (neighbor) { stairsX = neighbor.x; stairsY = neighbor.y; }
  }
  map[stairsY][stairsX] = TILE.STAIRS;

  // 9. Generate Enemies
  const enemyTypes = getEnemiesForLevel(level);
  const enemyCount = 8 + level * 2 + Math.floor(Math.random() * 5); // More enemies for larger map
  const lastRoomIndex = rooms.length - 1;
  placeEntities(map, entitiesGrid, rooms, enemyTypes, enemyCount, [0, lastRoomIndex]);

  // 10. Place Boss
  const bossType = getBossForLevel(level);
  placeBoss(map, entitiesGrid, stairsX, stairsY, bossType);

  // 11. Loot
  const generatedItems = generateLevelItems(level, rooms, map, [0]);
  const chests: Chest[] = [];
  const items: Item[] = [];

  generatedItems.forEach((item: Item) => {
    if (item.category === 'currency') items.push(item);
    else {
      chests.push({
        x: item.x ?? 0,
        y: item.y ?? 0,
        item: item,
        rarity: item.rarity,
        isOpen: false,
      });
    }
  });

  // 12. Torches
  const torches: Point[] = [];
  // Scan map for walls adjacent to floor to place torches naturally
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (map[y][x] === TILE.WALL) {
        // Check if valid wall for torch (e.g. above a floor tile)
        if (map[y + 1][x] === TILE.FLOOR && Math.random() < 0.05) {
          torches.push({ x, y: y });
        }
      }
    }
  }

  // 13. Compile Enemies List
  const enemies: Entity[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const entity = entitiesGrid[y][x];
      if (entity >= 2) {
        const baseStats = ENEMY_STATS[entity];
        if (baseStats) {
          const scaled = scaleEnemyStats(baseStats as unknown as Stats, playerLevel, level);
          const sprite: SpriteComponent | undefined = getSpriteForEnemy(entity) || undefined;
          enemies.push({
            id: `enemy-${x}-${y}-${level}`,
            name: (baseStats as any).name || 'Enemigo',
            level: level,
            x, y,
            type: entity,
            hp: scaled.hp || 10,
            maxHp: scaled.maxHp || 10,
            mp: scaled.mp || 0,
            maxMp: scaled.maxMp || 0,
            stats: scaled,
            isBoss: (baseStats as any).isBoss || false,
            stunned: 0,
            slowed: 0,
            sprite
          } as Enemy);
        }
      }
    }
  }

  return {
    map,
    entities: entitiesGrid,
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

function smoothMap(map: number[][], passes: number) {
  const height = map.length;
  const width = map[0].length;

  for (let p = 0; p < passes; p++) {
    const newMap = map.map(row => [...row]);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let walls = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (map[y + dy][x + dx] === TILE.WALL) walls++;
          }
        }

        // Rules for "organic" feel
        // If mostly walls (> 4 neighbors), become wall.
        // If mostly open (< 4 neighbors), become floor.
        // But preserve connectivity? Standard CA is:
        // if walls >= 5 -> WALL, else FLOOR (4-5 rule)
        if (walls > 4) newMap[y][x] = TILE.WALL;
        else if (walls < 4) newMap[y][x] = TILE.FLOOR;
      }
    }
    // Copy back
    for (let y = 0; y < height; y++) map[y] = newMap[y];
  }
}

function findNearestFloor(map: number[][], startX: number, startY: number): Point | null {
  const q: Point[] = [{ x: startX, y: startY }];
  const visited = new Set<string>();
  visited.add(`${startX},${startY}`);

  // BFS search
  while (q.length > 0) {
    // Simple optimization to avoid infinite loops in worst case
    if (q.length > 500) break;

    const curr = q.shift()!;
    if (map[curr.y]?.[curr.x] === TILE.FLOOR) return curr;

    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (const [dx, dy] of dirs) {
      const nx = curr.x + dx;
      const ny = curr.y + dy;
      if (ny >= 0 && ny < map.length && nx >= 0 && nx < map[0].length && !visited.has(`${nx},${ny}`)) {
        visited.add(`${nx},${ny}`);
        q.push({ x: nx, y: ny });
      }
    }
  }
  return null;
}

function placeBoss(map: number[][], entities: number[][], stairsX: number, stairsY: number, bossType: number) {
  // Attempt to place boss near stairs but on valid floor
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]];
  for (const [dx, dy] of dirs) {
    if (map[stairsY + dy]?.[stairsX + dx] === TILE.FLOOR) {
      entities[stairsY + dy][stairsX + dx] = bossType;
      return;
    }
  }
  // Fallback on stairs (will be covered) or force
  entities[stairsY][stairsX] = bossType;
}

// Funciones auxiliares
function carveHorizontalCorridor(map: number[][], x1: number, x2: number, y: number) {
  const start = Math.min(x1, x2);
  const end = Math.max(x1, x2);
  for (let x = start; x <= end; x++) {
    if (y > 0 && y < map.length - 1) map[y][x] = TILE.FLOOR;
  }
}

function carveVerticalCorridor(map: number[][], y1: number, y2: number, x: number) {
  const start = Math.min(y1, y2);
  const end = Math.max(y1, y2);
  for (let y = start; y <= end; y++) {
    if (x > 0 && x < map[0].length - 1) map[y][x] = TILE.FLOOR;
  }
}

/**
 * Scans room walls to place doors intelligently.
 * Avoids placing doors in corners, adjacent to other doors, or in wide openings.
 */
function placeDoors(map: number[][], rooms: Room[]) {
  // Barajamos las habitaciones para que el orden no siempre sea el mismo
  const shuffledRooms = [...rooms].sort(() => Math.random() - 0.5);

  shuffledRooms.forEach(room => {
    // Definimos los 4 muros de la habitación para escanearlos
    const walls: WallSegment[] = [
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
      const candidates: Point[] = [];

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

        // Si la zona está despejada, colocamos la puerta con ALTA probabilidad (80%)
        // De lo contrario, dejamos el hueco como pasaje abierto.
        if (!nearbyDoor && Math.random() < 0.8) {
          map[best.y][best.x] = TILE.DOOR;
        }
      }
    });
  });
}

function placeEntities(map: number[][], entities: number[][], rooms: Room[], types: number[], count: number, excludeRoomIndices: number[]) {
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