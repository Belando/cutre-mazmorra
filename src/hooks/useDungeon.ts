import { useState, useCallback } from 'react';
import { generateDungeon, DungeonResult, Room } from "@/engine/systems/DungeonGenerator";
import { TILE, MAP_WIDTH, MAP_HEIGHT } from "@/data/constants";
import { generateNPCs } from "@/engine/systems/NPCSystem";
import { Entity, Item, Point, NPC, Chest } from '@/types';

export interface DungeonState extends DungeonResult {
    npcs: NPC[];
    visible: boolean[][];
    explored: boolean[][];
    level: number;
    bossDefeated: boolean;
    stairs: Point;
    stairsUp: Point | null;
    chests: Chest[];
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
        // Crear matrices vacías si no existen o resetearlas
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

        const newDungeon = generateDungeon(MAP_WIDTH, MAP_HEIGHT, level, playerLevel);

        if (!newDungeon || !newDungeon.rooms || !newDungeon.map) {
            console.error("Dungeon Generation Failed!", newDungeon);
            return null;
        }

        // CORRECCIÓN: Pasamos newDungeon.enemies como último argumento
        const npcs = generateNPCs(level, newDungeon.rooms, newDungeon.map, [0, newDungeon.rooms.length - 1], newDungeon.enemies || []) as unknown as NPC[];

        const cleanChests = (newDungeon.chests || []).filter(c => !npcs.some(n => n.x === c.x && n.y === c.y));

        // Ensure we match DungeonResult and DungeonState
        const initialState: DungeonState = {
            ...newDungeon,
            chests: cleanChests,
            npcs,
            visible: Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(false)),
            explored: Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(false)),
            level,
            bossDefeated: false,
        };

        setDungeon(initialState);
        return initialState;
    }, []);

    const updateMapFOV = useCallback((playerX: number, playerY: number) => {
        setDungeon(prev => {
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
