import { useState, useCallback } from 'react';
import { generateDungeon, DungeonResult } from "@/engine/systems/DungeonGenerator";
import { generateHome } from "@/engine/systems/HomeGenerator";
import { TILE, MAP_WIDTH, MAP_HEIGHT } from "@/data/constants";
import { generateNPCs } from "@/engine/systems/NPCSystem";
import { Point, NPC, Chest } from '@/types';

export interface DungeonState extends DungeonResult {
    npcs: NPC[];
    visible: boolean[][];
    explored: boolean[][];
    level: number;
    bossDefeated: boolean;
    stairs: Point;
    stairsUp: Point | null;
    chests: Chest[];
    location?: 'home' | 'dungeon';
}

export interface UseDungeonResult {
    dungeon: DungeonState;
    setDungeon: React.Dispatch<React.SetStateAction<DungeonState>>;
    generateLevel: (level: number, playerLevel: number, savedData?: DungeonState | null) => DungeonState | null;
    updateMapFOV: (playerX: number, playerY: number) => void;
}

export function useDungeon(): UseDungeonResult {
    const [dungeon, setDungeon] = useState<DungeonState>({
        map: [],
        renderMap: [],
        rooms: [],
        entities: [],
        enemies: [],
        items: [],
        chests: [],
        torches: [],
        npcs: [],
        playerStart: { x: 0, y: 0 },
        stairs: { x: 0, y: 0 },
        stairsUp: null,
        visible: [],
        explored: [],
        level: 1,
        bossDefeated: false
    });

    const calculateFOV = useCallback((playerX: number, playerY: number, currentMap: DungeonState) => {
        const visible = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(false));
        const explored = currentMap.explored && currentMap.explored.length > 0
            ? currentMap.explored
            : Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(false));

        if (!currentMap.map || currentMap.map.length === 0) return { visible, explored };

        for (let angle = 0; angle < 360; angle += 1) {
            const rad = angle * Math.PI / 180;
            const dx = Math.cos(rad), dy = Math.sin(rad);
            let x = playerX + 0.5, y = playerY + 0.5;

            for (let i = 0; i < 7; i++) {
                const tx = Math.floor(x), ty = Math.floor(y);
                if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) break;

                visible[ty][tx] = true;
                explored[ty][tx] = true;

                const tile = currentMap.map[ty][tx];

                if (tile === TILE.WALL || tile === TILE.DOOR) break;

                x += dx; y += dy;
            }
        }
        return { visible, explored };
    }, []);

    const generateLevel = useCallback((level: number, playerLevel: number, savedData: DungeonState | null = null) => {
        if (savedData) {
            setDungeon(savedData);
            return savedData;
        }

        let newDungeon;
        let npcs: NPC[] = [];

        if (level === 0) {
            // Generate Home
            const home = generateHome();
            // Adapt HomeResult to DungeonResult parts
            newDungeon = {
                ...home,
                rooms: [], // Home has no rooms array usually
                enemies: [], // No enemies at home
                items: [],
                entities: home.entities,
                stairs: { x: home.stairs.x, y: home.stairs.y }, // Ensure property exists
                stairsUp: null
            };
            npcs = home.npcs;
        } else {
            // Generate Dungeon
            console.log("Generating Dungeon Level", level);
            try {
                newDungeon = generateDungeon(MAP_WIDTH, MAP_HEIGHT, level, playerLevel);
                if (!newDungeon || !newDungeon.rooms || !newDungeon.map) {
                    console.error("Dungeon Generation Failed!", newDungeon);
                    return null;
                }
                console.log("Dungeon generated, generating NPCs...");
                npcs = generateNPCs(level, newDungeon.rooms, newDungeon.map, [0, newDungeon.rooms.length - 1], newDungeon.enemies || []) as unknown as NPC[];
                console.log("NPCs generated:", npcs.length);
            } catch (e) {
                console.error("Error generating dungeon or NPCs:", e);
                return null;
            }
        }

        const cleanChests = (newDungeon.chests || []).filter(c => !npcs.some(n => n.x === c.x && n.y === c.y));

        // Initial Visibility
        // If Home (level 0), map is fully visible/explored initially? Usually yes.
        const isHome = level === 0;
        const initialVisible = isHome
            ? Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(true))
            : Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(false));

        const initialExplored = isHome
            ? Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(true))
            : Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(false));

        const initialState: DungeonState = {
            ...newDungeon,
            chests: cleanChests,
            npcs,
            visible: initialVisible,
            explored: initialExplored,
            level,
            bossDefeated: false,
            // Fallbacks for missing generated props
            rooms: newDungeon.rooms || [],
            enemies: newDungeon.enemies || [],
            stairs: newDungeon.stairs || { x: 0, y: 0 },
            stairsUp: newDungeon.stairsUp || null,
            location: isHome ? 'home' : 'dungeon'
        };

        setDungeon(initialState);
        return initialState;
    }, []);

    const updateMapFOV = useCallback((playerX: number, playerY: number) => {
        setDungeon(prev => {
            // If at Home (Level 0), don't update FOV, everything remains visible
            if (prev.level === 0) return prev;

            const { visible, explored } = calculateFOV(playerX, playerY, prev);
            return { ...prev, visible, explored };
        });
    }, [calculateFOV]);

    return {
        dungeon,
        setDungeon,
        generateLevel,
        updateMapFOV
    };
}
