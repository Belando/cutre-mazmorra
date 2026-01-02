// Generador procedimental de mazmorras para roguelike
import { generateLevelItems } from './ItemSystem';
import { TILE, ENTITY } from '@/data/constants';
import { Entity, Point, Item, Chest, RenderMap, RenderTile } from '@/types';
import { GAME_CONFIG } from '@/data/config';
import { ENEMY_STATS } from '@/data/enemies';

// Modules
import { Room, getBossForLevel, getEnemiesForLevel, smoothMap, findNearestFloor } from './dungeon/DungeonUtils';
import { generateRooms } from './dungeon/RoomGeneration';
import { connectRooms, ensureConnectivity, placeDoors } from './dungeon/Connectivity';
import { placeEntities, placeBoss, createEnemiesFromGrid } from './dungeon/EntityPlacement';

export interface DungeonResult {
  map: number[][];
  renderMap: RenderMap;
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

export function generateDungeon(width: number, height: number, level: number, playerLevel = 1): DungeonResult {

  // 1. Generate Rooms & Initial Map
  const { rooms, map } = generateRooms(width, height, level);
  const entitiesGrid: number[][] = Array(height).fill(null).map(() => Array(width).fill(ENTITY.NONE));

  // 2. Connect Rooms
  connectRooms(map, rooms);

  // 3. Smooth Map
  smoothMap(map, 2);

  // 4. Place Doors
  placeDoors(map, rooms);

  // 5. Ensure Connectivity
  ensureConnectivity(map, rooms);

  // 6. Player Start (First room center)
  const firstRoom = rooms[0];
  let playerX = Math.floor(firstRoom.x + firstRoom.width / 2);
  let playerY = Math.floor(firstRoom.y + firstRoom.height / 2);

  if (map[playerY][playerX] !== TILE.FLOOR) {
    const neighbor = findNearestFloor(map, playerX, playerY);
    if (neighbor) { playerX = neighbor.x; playerY = neighbor.y; }
  }

  // 7. Stairs Up
  let stairsUp: Point | null = null;
  if (level > 1) {
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

  // 9. Generate Enemies and Boss
  const enemyTypes = getEnemiesForLevel(level);
  const enemyCount = 8 + level * 2 + Math.floor(Math.random() * 5);
  const lastRoomIndex = rooms.length - 1;
  const entityCount = placeEntities(map, entitiesGrid, rooms, enemyTypes, enemyCount, [0, lastRoomIndex]);
  // Use entityCount or void it
  void entityCount;

  const bossType = getBossForLevel(level);
  placeBoss(map, entitiesGrid, stairsX, stairsY, bossType);

  // 9.5 Place Resources (Rocks, Plants)
  // More rocks in deeper levels? Plants in early levels?
  const resourceTypes = [ENTITY.ROCK, ENTITY.PLANT]; // Maybe add mushrooms later
  placeEntities(map, entitiesGrid, rooms, resourceTypes, 10 + level * 2, [0, lastRoomIndex]);

  // 10. Loot
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

  // 11. Torches
  const torches: Point[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (map[y][x] === TILE.WALL) {
        if (map[y + 1][x] === TILE.FLOOR && Math.random() < 0.05) {
          torches.push({ x, y: y });
        }
      }
    }
  }

  // 12. Create Enemy Objects
  const enemies = createEnemiesFromGrid(entitiesGrid, level, playerLevel);

  // 13. Generate Render Map (Pre-calculate visual variants)
  const renderMap: RenderMap = Array(height).fill(null).map((_, y) =>
    Array(width).fill(null).map((_, x) => {
      // Simple noise simulation for prototype
      const noise = Math.sin(x * 0.1) + Math.cos(y * 0.1) + Math.sin((x + y) * 0.05); // Same as map.ts calc
      let variant = 0;

      // Logic copied from map.ts to pre-calculate
      if (noise > GAME_CONFIG.MAP.NOISE.LUSH_THRESHOLD) variant = 3; // Lush
      else if (noise > GAME_CONFIG.MAP.NOISE.FLOWERS_THRESHOLD) variant = 1; // Flowers
      else if (noise < GAME_CONFIG.MAP.NOISE.SPARSE_THRESHOLD) variant = 2; // Sparse
      else variant = 0; // Plain

      return {
        variant,
        noise,
        rotation: Math.floor(Math.random() * 4) * 90
      } as RenderTile;
    })
  );

  return {
    map,
    renderMap,
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

export { TILE, ENTITY, ENEMY_STATS };