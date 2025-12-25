// Generador procedimental de mazmorras usando Binary Space Partitioning (BSP)
import { generateLevelItems } from './ItemSystem';
import { TILE, ENTITY } from '@/data/constants';
import { ENEMY_STATS, EnemyStats } from '@/data/enemies';
import { Entity, Stats, Point, Item, Chest, Enemy } from '@/types';
import { getSpriteForEnemy } from '@/data/sprites';

// Tipos locales
export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
}



// Configuración BSP
const MIN_LEAF_SIZE = 8; // Tamaño mínimo para dividir un nodo (más pequeño)
const MAX_LEAF_SIZE = 22; // Tamaño máximo
const ROOM_PADDING = 1; // Espacio entre habitación y borde del nodo

class BSPNode {
  x: number;
  y: number;
  width: number;
  height: number;
  leftChild: BSPNode | null = null;
  rightChild: BSPNode | null = null;
  room: Room | null = null;
  halls: Room[] = []; // Usamos Room para representar rectángulos de pasillo

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  // Divide el nodo en dos hijos
  split(): boolean {
    if (this.leftChild || this.rightChild) return false; // Ya dividido

    // Determinar dirección de corte
    // Si es muy ancho, cortar verticalmente. Si es muy alto, horizontalmente.
    let splitH = Math.random() > 0.5;
    if (this.width > this.height && this.width / this.height >= 1.25) splitH = false;
    else if (this.height > this.width && this.height / this.width >= 1.25) splitH = true;

    const max = (splitH ? this.height : this.width) - MIN_LEAF_SIZE;
    if (max <= MIN_LEAF_SIZE) return false; // Muy pequeño para dividir

    // Split un poco más aleatorio, no siempre centrado
    // Rango del 30% al 70%
    const splitMin = MIN_LEAF_SIZE;
    const splitMax = (splitH ? this.height : this.width) - MIN_LEAF_SIZE;

    // Asegurar que hay espacio
    if (splitMax <= splitMin) return false;

    // Generar split
    const splitPos = Math.floor(Math.random() * (splitMax - splitMin + 1)) + splitMin;

    if (splitH) {
      // Corte Horizontal
      this.leftChild = new BSPNode(this.x, this.y, this.width, splitPos);
      this.rightChild = new BSPNode(this.x, this.y + splitPos, this.width, this.height - splitPos);
    } else {
      // Corte Vertical
      this.leftChild = new BSPNode(this.x, this.y, splitPos, this.height);
      this.rightChild = new BSPNode(this.x + splitPos, this.y, this.width - splitPos, this.height);
    }

    return true;
  }

  // Crear habitaciones en las hojas
  createRooms() {
    if (this.leftChild || this.rightChild) {
      this.leftChild?.createRooms();
      this.rightChild?.createRooms();
    } else {
      // Es una hoja: crear habitación
      // Permitir habitaciones más variadas, no siempre llenando el espacio
      const minSize = 4;
      // Ancho: entre minSize y (width - padding)
      const maxWidth = this.width - ROOM_PADDING * 2;
      const maxHeight = this.height - ROOM_PADDING * 2;

      // Variación aleatoria del tamaño (50% a 90% del espacio disponible, a veces 100%)
      const widthFactor = 0.5 + Math.random() * 0.5;
      const heightFactor = 0.5 + Math.random() * 0.5;

      const roomWidth = Math.max(minSize, Math.floor(maxWidth * widthFactor));
      const roomHeight = Math.max(minSize, Math.floor(maxHeight * heightFactor));

      // Posicionamiento aleatorio dentro del nodo (respetando padding)
      // Espacio libre horizontal = this.width - roomWidth - padding*2
      const freeX = Math.max(0, this.width - roomWidth - ROOM_PADDING * 2);
      const freeY = Math.max(0, this.height - roomHeight - ROOM_PADDING * 2);

      const offsetX = Math.floor(Math.random() * (freeX + 1)) + ROOM_PADDING;
      const offsetY = Math.floor(Math.random() * (freeY + 1)) + ROOM_PADDING;

      const roomX = this.x + offsetX;
      const roomY = this.y + offsetY;

      this.room = { x: roomX, y: roomY, width: roomWidth, height: roomHeight };
    }
  }

  getRoom(): Room | null {
    if (this.room) return this.room;

    // Si no es hoja, obtener habitación de un hijo (preferiblemente izquierda)
    // para tener un punto de conexión
    const lRoom = this.leftChild?.getRoom();
    const rRoom = this.rightChild?.getRoom();

    if (lRoom && rRoom) return Math.random() > 0.5 ? lRoom : rRoom;
    return lRoom || rRoom || null;
  }
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
 * Uses BSP (Binary Space Partitioning) for uniform distribution.
 */
export function generateDungeon(width: number, height: number, level: number, playerLevel = 1): DungeonResult {
  const map: number[][] = Array(height).fill(null).map(() => Array(width).fill(TILE.WALL));
  const entitiesGrid: number[][] = Array(height).fill(null).map(() => Array(width).fill(ENTITY.NONE));

  // 1. Inicializar BSP
  const root = new BSPNode(0, 0, width, height);
  const nodes: BSPNode[] = [root];

  // 2. Hacer divisiones recursivas
  // Iteramos para dividir los nodos que sigan en la lista
  let didSplit = true;
  while (didSplit) {
    didSplit = false;
    // Recorremos los nodos. Como vamos añadiendo al array, es mejor iterar sobre una copia o usar índices
    // Para simplificar, simplemente iteramos sobre todas las hojas actuales
    const leaves = getLeaves(root);
    for (const leaf of leaves) {
      if (leaf.width > MAX_LEAF_SIZE || leaf.height > MAX_LEAF_SIZE || Math.random() > 0.25) {
        if (leaf.split()) {
          nodes.push(leaf.leftChild!);
          nodes.push(leaf.rightChild!);
          didSplit = true;
        }
      }
    }
  }

  // 3. Crear Habitaciones
  root.createRooms();

  // 4. Dibujar Habitaciones en Mapa
  const leaves = getLeaves(root);
  const rooms: Room[] = [];
  leaves.forEach(leaf => {
    if (leaf.room) {
      rooms.push(leaf.room);
      for (let y = leaf.room.y; y < leaf.room.y + leaf.room.height; y++) {
        for (let x = leaf.room.x; x < leaf.room.x + leaf.room.width; x++) {
          if (y >= 0 && y < height && x >= 0 && x < width) {
            map[y][x] = TILE.FLOOR;
          }
        }
      }
    }
  });

  // 5. Conectar Habitaciones (Corredores)
  // Recorremos el árbol post-order (hijos antes que padres) para conectar
  createCorridors(root, map);

  // 6. Colocar Puertas
  placeDoors(map, rooms);

  // 7. Configurar Puntos Clave
  // Ordenar habitaciones por distancia al centro o simplemente usar la primera/última generada
  const startRoom = rooms[0];
  const endRoom = rooms[rooms.length - 1];

  const playerStart = {
    x: Math.floor(startRoom.x + startRoom.width / 2),
    y: Math.floor(startRoom.y + startRoom.height / 2)
  };

  const stairs = {
    x: Math.floor(endRoom.x + endRoom.width / 2),
    y: Math.floor(endRoom.y + endRoom.height / 2)
  };
  map[stairs.y][stairs.x] = TILE.STAIRS;

  let stairsUp: Point | null = null;
  if (level > 1) {
    const upX = startRoom.x + 1;
    const upY = startRoom.y + 1;
    map[upY][upX] = TILE.STAIRS_UP;
    stairsUp = { x: upX, y: upY };
  }

  // 8. Enemigos
  const enemyTypes = getEnemiesForLevel(level);
  const enemyCount = 5 + level * 2 + Math.floor(Math.random() * 4);
  const enemies: Entity[] = []; // Se poblará después
  // Usamos la misma lógica de "placeEntities" en la grid
  placeEntities(map, entitiesGrid, rooms, enemyTypes, enemyCount, [0, rooms.length - 1]);

  // 9. Jefe
  const bossType = getBossForLevel(level);
  if (bossType) {
    // Intentar colocar cerca de la escalera
    const bossX = stairs.x + (Math.random() > 0.5 ? 2 : -2);
    const bossY = stairs.y;
    if (isValidSpot(map, entitiesGrid, bossX, bossY)) {
      entitiesGrid[bossY][bossX] = bossType;
    } else {
      // Fallback: usar placeEntities para 1 jefe en la última sala
      placeEntities(map, entitiesGrid, [endRoom], [bossType], 1, []);
    }
  }

  // 10. Items
  const generatedItems = generateLevelItems(level, rooms, map, [0]);
  const chests: Chest[] = [];
  const items: Item[] = [];

  generatedItems.forEach((item: Item) => {
    if (item.category === 'currency') {
      items.push(item);
    } else {
      chests.push({
        x: item.x ?? 0,
        y: item.y ?? 0,
        item: item,
        rarity: item.rarity,
        isOpen: false,
      });
    }
  });

  // 11. Antorchas
  const torches: Point[] = [];
  rooms.forEach(room => {
    // Paredes candidatas
    const walls = [
      { x: room.x + Math.floor(room.width / 2), y: room.y - 1 }, // Norte
      { x: room.x + Math.floor(room.width / 2), y: room.y + room.height }, // Sur
      { x: room.x - 1, y: room.y + Math.floor(room.height / 2) }, // Oeste
      { x: room.x + room.width, y: room.y + Math.floor(room.height / 2) }, // Este
    ];
    walls.forEach(w => {
      if (map[w.y]?.[w.x] === TILE.WALL && Math.random() > 0.4) {
        torches.push(w);
      }
    });
  });

  // 12. Compilar Enemigos (Objects)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const entity = entitiesGrid[y][x];
      if (entity >= 2) {
        const baseStats = ENEMY_STATS[entity] as any;
        if (baseStats) {
          const scaled = scaleEnemyStats(baseStats, playerLevel, level);
          const sprite = getSpriteForEnemy(entity) || undefined;
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
    playerStart,
    stairs,
    stairsUp,
    items,
    chests,
    torches
  };
}

// Helpers BSP
function getLeaves(node: BSPNode): BSPNode[] {
  if (!node.leftChild && !node.rightChild) return [node];
  const leaves: BSPNode[] = [];
  if (node.leftChild) leaves.push(...getLeaves(node.leftChild));
  if (node.rightChild) leaves.push(...getLeaves(node.rightChild));
  return leaves;
}

function createCorridors(node: BSPNode, map: number[][]) {
  if (node.leftChild && node.rightChild) {
    createCorridors(node.leftChild, map);
    createCorridors(node.rightChild, map);

    // Conectar los dos hijos (sus rooms más cercanas)
    const lRoom = node.leftChild.getRoom();
    const rRoom = node.rightChild.getRoom();

    if (lRoom && rRoom) {
      const x1 = Math.floor(lRoom.x + lRoom.width / 2);
      const y1 = Math.floor(lRoom.y + lRoom.height / 2);
      const x2 = Math.floor(rRoom.x + rRoom.width / 2);
      const y2 = Math.floor(rRoom.y + rRoom.height / 2);

      // Dibujar pasillo "en L"
      if (Math.random() > 0.5) {
        carveHorizontalCorridor(map, x1, x2, y1);
        carveVerticalCorridor(map, y1, y2, x2);
      } else {
        carveVerticalCorridor(map, y1, y2, x1);
        carveHorizontalCorridor(map, x1, x2, y2);
      }
    }
  }
}

// Helpers de Dibujo
function carveHorizontalCorridor(map: number[][], x1: number, x2: number, y: number) {
  const start = Math.min(x1, x2);
  const end = Math.max(x1, x2);
  for (let x = start; x <= end; x++) {
    if (y > 0 && y < map.length - 1) map[y][x] = TILE.FLOOR; // TILE.FLOOR
  }
}

function carveVerticalCorridor(map: number[][], y1: number, y2: number, x: number) {
  const start = Math.min(y1, y2);
  const end = Math.max(y1, y2);
  for (let y = start; y <= end; y++) {
    if (x > 0 && x < map[0].length - 1) map[y][x] = TILE.FLOOR; // TILE.FLOOR
  }
}

function isValidSpot(map: number[][], entities: number[][], x: number, y: number): boolean {
  if (y < 0 || y >= map.length || x < 0 || x >= map[0].length) return false;
  return map[y][x] === TILE.FLOOR && entities[y][x] === ENTITY.NONE;
}

// Reutilizamos PlaceDoors (con lógica original mejorada si es posible)
function placeDoors(map: number[][], rooms: Room[]) {
  // Versión simplificada que busca conexiones pasillo-habitación
  rooms.forEach(room => {
    // Escanear perímetro
    checkWallForDoor(map, room.x + Math.floor(room.width / 2), room.y - 1); // Norte
    checkWallForDoor(map, room.x + Math.floor(room.width / 2), room.y + room.height); // Sur
    checkWallForDoor(map, room.x - 1, room.y + Math.floor(room.height / 2)); // Oeste
    checkWallForDoor(map, room.x + room.width, room.y + Math.floor(room.height / 2)); // Este
  });
}

function checkWallForDoor(map: number[][], x: number, y: number) {
  if (y < 1 || y >= map.length - 1 || x < 1 || x >= map[0].length - 1) return;

  // Si es suelo, ya está abierto, revisamos "sandwiches"
  if (map[y][x] === TILE.FLOOR) {
    // Horizontal sandwich: Wall | Room | Wall
    // Pasillo vertical entrando
    const left = map[y][x - 1];
    const right = map[y][x + 1];
    const top = map[y - 1][x];
    const bottom = map[y + 1][x];

    // Si estamos en un pasillo estrecho entrando a una sala
    if (left === TILE.WALL && right === TILE.WALL && (top === TILE.FLOOR && bottom === TILE.FLOOR)) {
      if (!hasNearbyDoor(map, x, y)) map[y][x] = TILE.DOOR;
    }
    else if (top === TILE.WALL && bottom === TILE.WALL && (left === TILE.FLOOR && right === TILE.FLOOR)) {
      if (!hasNearbyDoor(map, x, y)) map[y][x] = TILE.DOOR;
    }
  }
}



function hasNearbyDoor(map: number[][], x: number, y: number, radius = 4): boolean {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (ny >= 0 && ny < map.length && nx >= 0 && nx < map[0].length) {
        if (map[ny][nx] === TILE.DOOR) return true;
      }
    }
  }
  return false;
}

function placeEntities(map: number[][], entities: number[][], rooms: Room[], types: number[], count: number, excludeRoomIndices: number[]) {
  let placed = 0;
  let attempts = 0;
  while (placed < count && attempts < 200) {
    attempts++;
    const roomIndex = Math.floor(Math.random() * rooms.length);
    if (excludeRoomIndices.includes(roomIndex)) continue;
    const room = rooms[roomIndex];
    const x = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
    const y = room.y + 1 + Math.floor(Math.random() * (room.height - 2));

    if (isValidSpot(map, entities, x, y)) {
      entities[y][x] = types[Math.floor(Math.random() * types.length)];
      placed++;
    }
  }
}

export { TILE, ENTITY, ENEMY_STATS };