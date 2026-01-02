import { TILE, ENTITY } from '@/data/constants';
import { Entity, Point, NPC, RenderMap, RenderTile, Item, Chest } from '@/types';
import { NPC_TYPES } from '@/data/constants';

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

    // 4. Place Dungeon Gate (North)
    const gateX = centerX;
    const gateY = centerY - 8;
    // Clearing area for gate
    // Clearing area for gate
    map[gateY][gateX] = TILE.FLOOR_DIRT;
    entities[gateY][gateX] = ENTITY.DUNGEON_GATE;

    // Place invisible blockers for 2x2 collision
    // Gate is at (gateX, gateY). We block (gateX+1, gateY), (gateX, gateY+1), (gateX+1, gateY+1)
    if (gateX + 1 < HOME_WIDTH) entities[gateY][gateX + 1] = ENTITY.BLOCKER;
    if (gateY + 1 < HOME_HEIGHT) entities[gateY + 1][gateX] = ENTITY.BLOCKER;
    if (gateX + 1 < HOME_WIDTH && gateY + 1 < HOME_HEIGHT) entities[gateY + 1][gateX + 1] = ENTITY.BLOCKER;

    // 5. Place Workbench (Near Center) - REMOVED to avoid artifact overlap with Blacksmith
    // const benchX = centerX + 3;
    // const benchY = centerY;
    // entities[benchY][benchX] = ENTITY.WORKBENCH;

    // 6. Resources (Trees & Rocks)

    // Random placement but avoiding center house area
    // clusters using simple noise-like heuristic
    for (let y = 1; y < HOME_HEIGHT - 1; y++) {
        for (let x = 1; x < HOME_WIDTH - 1; x++) {
            // Check if far enough from center house
            const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            if (dist > 8) {
                // Simple cellular/noise simulation for clustering
                // Use a combination of sin/cos for deterministic "noise" or just random clumps
                const noise = Math.sin(x * 0.5) * Math.cos(y * 0.5) + Math.sin((x + y) * 0.2);

                // Trees in positive noise areas
                if (noise > 0.5) {
                    if (Math.random() < 0.6) entities[y][x] = ENTITY.TREE;
                    else if (Math.random() < 0.2) entities[y][x] = ENTITY.PLANT; // Some undergrowth
                }
                // Rocks in negative noise areas
                else if (noise < -0.6) {
                    if (Math.random() < 0.4) entities[y][x] = ENTITY.ROCK;
                }
                // Plants in transition areas
                else if (noise > -0.2 && noise < 0.2) {
                    if (Math.random() < 0.15) entities[y][x] = ENTITY.PLANT;
                }
                // Scattered random
                else if (Math.random() < 0.02) {
                    const r = Math.random();
                    if (r < 0.4) entities[y][x] = ENTITY.TREE;
                    else if (r < 0.7) entities[y][x] = ENTITY.ROCK;
                    else entities[y][x] = ENTITY.PLANT;
                }
            }
        }
    }

    // 7. NPCs (Merchant, Blacksmith)
    const npcs: NPC[] = [
        {
            id: 'merchant_home',
            type: NPC_TYPES.MERCHANT,
            name: "Garrick",
            level: 1,
            hp: 100, maxHp: 100, mp: 0, maxMp: 0,
            stats: {},
            x: centerX - 3,
            y: centerY + 2
        },
        {
            id: 'blacksmith_home',
            type: NPC_TYPES.BLACKSMITH,
            name: "Brokk",
            level: 1,
            hp: 100, maxHp: 100, mp: 0, maxMp: 0,
            stats: {},
            x: centerX + 3,
            y: centerY + 2
        }
    ];

    // Player Start
    const playerStart = { x: centerX, y: centerY };

    // Generate Render Map for Home
    const renderMap: RenderMap = Array(HOME_HEIGHT).fill(null).map((_, y) =>
        Array(HOME_WIDTH).fill(null).map((_, x) => {
            // Simpler noise for home (mostly lush)
            const noise = Math.sin(x * 0.1) + Math.cos(y * 0.1);
            let variant = 0;
            if (noise > 0.5) variant = 3; // Lush
            else if (noise < -0.5) variant = 0; // Plain
            else variant = 1; // Flowers

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
        torches: [], // Maybe add some later
        location: 'home',
        stairs: { x: gateX, y: gateY }, // Gate acts as stairs?
        stairsUp: null
    };
}
