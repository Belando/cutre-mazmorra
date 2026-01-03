import { TILE, ENTITY } from '@/data/constants';
import { Point, NPC, RenderMap, RenderTile, Item, Chest } from '@/types';

const HOME_WIDTH = 30;
const HOME_HEIGHT = 30;

export interface HomeResult {
    map: number[][];
    entities: number[][];
    playerStart: Point;
    npcs: NPC[];
    items: Item[];
    chests: Chest[];
    torches: Point[];
    location: 'home';
    stairs: Point;
    stairsUp: Point | null;
    renderMap: RenderMap;
}

export function generateHome(): HomeResult {
    // 1. Initialize Map (Grass)
    const map: number[][] = Array(HOME_HEIGHT).fill(null).map(() => Array(HOME_WIDTH).fill(TILE.FLOOR_GRASS));
    const entities: number[][] = Array(HOME_HEIGHT).fill(null).map(() => Array(HOME_WIDTH).fill(ENTITY.NONE));

    const centerX = Math.floor(HOME_WIDTH / 2);
    const centerY = Math.floor(HOME_HEIGHT / 2);

    // 2. Create House Area (Dirt Floor) in Center
    for (let y = centerY - 5; y <= centerY + 5; y++) {
        for (let x = centerX - 5; x <= centerX + 5; x++) {
            map[y][x] = TILE.FLOOR_DIRT;
        }
    }

    // 3. Walls around the Home Map (Boundaries)
    for (let y = 0; y < HOME_HEIGHT; y++) {
        for (let x = 0; x < HOME_WIDTH; x++) {
            if (x === 0 || x === HOME_WIDTH - 1 || y === 0 || y === HOME_HEIGHT - 1) {
                map[y][x] = TILE.WALL;
            }
        }
    }

    // 4. Place Dungeon Gate (Logical at Y=0 - Wall Gap)
    const gateX = centerX;
    const gateY = 0; // Moved back to wall as requested

    // Clear path to gate and BEHIND gate (so wall doesn't show through arch)
    map[0][gateX] = TILE.FLOOR_DIRT; // Remove wall behind gate (Left side)
    if (gateX + 1 < HOME_WIDTH) map[0][gateX + 1] = TILE.FLOOR_DIRT; // Remove wall behind gate (Right side - User requested)

    map[1][gateX] = TILE.FLOOR_DIRT;
    map[2][gateX] = TILE.FLOOR_DIRT;
    map[3][gateX] = TILE.FLOOR_DIRT; // Carpet continues

    // Dungeon Gate (Visual)
    entities[gateY][gateX] = ENTITY.DUNGEON_GATE;

    // Dungeon Gate (Extra Logic Trigger for wide entrance)
    if (gateX + 1 < HOME_WIDTH) {
        entities[gateY][gateX + 1] = ENTITY.DUNGEON_GATE_TRIGGER;
    }

    // Gate is at (gateX, gateY). 
    // We already placed the Trigger at gateX+1, so we don't need a generic Blocker.
    // The Trigger itself will act as the interaction point.
    // Collision logic for entities depends on SpatialHash.isBlocked.
    // If 'dungeon_gate' is not in the blocking list, we might need to add it, 
    // OR if we want it walkable but interactive, we leave it.
    // Assuming we want to enter by walking INTO it or interact FROM adjacent.
    // Original gate was solid?

    // For now, removing the overwrite.
    // We DO NOT block Y+1 (Y=3) to allow access.

    // 5. Place Workbench (Near Center) - REMOVED to avoid artifact overlap with Blacksmith
    // const benchX = centerX + 3;
    // const benchY = centerY;
    // entities[benchY][benchX] = ENTITY.WORKBENCH;

    // 6. Resources (Trees & Rocks)

    // Random placement but avoiding center house area
    // clusters using simple noise-like heuristic
    // 7. NPCs (Removed per user request)
    const npcs: NPC[] = [];

    // 6. Resources (Trees & Rocks)
    // Random placement but avoiding center house area
    // Increase margin to 2 to avoid overlapping walls (at 0 and WIDTH-1)
    for (let y = 2; y < HOME_HEIGHT - 2; y++) {
        for (let x = 2; x < HOME_WIDTH - 2; x++) {
            // Check if far enough from center house
            const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

            // NEW: Exclude Gate Approach (Safety Zone)
            const distGate = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - 3, 2));

            if (dist > 8 && distGate > 4) {
                const noise = Math.sin(x * 0.5) * Math.cos(y * 0.5) + Math.sin((x + y) * 0.2);

                if (noise > 0.5) {
                    if (Math.random() < 0.6) entities[y][x] = ENTITY.TREE;
                    else if (Math.random() < 0.2) entities[y][x] = ENTITY.PLANT;
                }
                else if (noise < -0.6) {
                    if (Math.random() < 0.4) entities[y][x] = ENTITY.ROCK;
                }
                else if (noise > -0.2 && noise < 0.2) {
                    if (Math.random() < 0.15) entities[y][x] = ENTITY.PLANT;
                }
                else if (Math.random() < 0.02) {
                    const r = Math.random();
                    if (r < 0.4) entities[y][x] = ENTITY.TREE;
                    else if (r < 0.7) entities[y][x] = ENTITY.ROCK;
                    else entities[y][x] = ENTITY.PLANT;
                }
            }
        }
    }

    // Player Start
    const playerStart = { x: centerX, y: centerY };

    // Generate Render Map for Home
    const renderMap: RenderMap = Array(HOME_HEIGHT).fill(null).map((_, y) =>
        Array(HOME_WIDTH).fill(null).map((_, x) => {
            const noise = Math.sin(x * 0.1) + Math.cos(y * 0.1);
            let variant = 0;
            if (noise > 0.5) variant = 3;
            else if (noise < -0.5) variant = 0;
            else variant = 1;

            return {
                variant,
                noise,
                rotation: 0
            } as RenderTile;
        })
    );

    return {
        map,
        renderMap,
        entities,
        playerStart,
        npcs,
        items: [],
        chests: [],
        torches: [],
        location: 'home',
        stairs: { x: gateX, y: gateY },
        stairsUp: null
    };
}
