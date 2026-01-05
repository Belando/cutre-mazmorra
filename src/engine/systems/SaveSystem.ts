import LZString from 'lz-string';
import { GameState, Stats, QuickSlotData } from '@/types';
import { generateDungeon } from './DungeonGenerator';
import { MAP_WIDTH, MAP_HEIGHT } from '@/data/constants';

const SAVE_KEY = 'dungeon_crawler_save';

const CURRENT_VERSION = 3; // Bump version for Seed/Delta support

export interface MapDelta {
    x: number;
    y: number;
    v: number;
}

export interface SaveData {
    version: number;
    timestamp: number;
    gameState: Partial<GameState>;
    stats: Stats;
    activeQuests: string[];
    completedQuests: string[];
    questProgress: Record<string, any>;
    materials: Record<string, number>;
    quickSlots: (QuickSlotData | null)[];
    // New fields
    seed?: number;
    mapDeltas?: MapDelta[];
}

const MIGRATIONS: Record<number, (data: any) => any> = {
    // Migration from v1 to v2
    1: (data: any) => {
        console.log("Migrating save v1 -> v2: Ensuring quickSlots and materials exist");
        if (!data.quickSlots) data.quickSlots = new Array(4).fill(null);
        if (!data.materials) data.materials = {};
        // Add other defaults here
        return data;
    },
    // Migration v2 -> v3
    2: (data: any) => {
        console.log("Migrating save v2 -> v3: Moving map data to dynamic structure (if possible)");
        // V2 has full map data. We can keep it or try to reverse-engineer seed?
        // Impossible to reverse-engineer seed.
        // So for V2 saves, we stick with full map (legacy mode).
        // Ensure seed is undefined so loader knows to use legacy map.
        return data;
    }
};

function migrateSave(data: any): SaveData {
    let currentVer = data.version || 0; // 0 if missing

    while (currentVer < CURRENT_VERSION) {
        if (MIGRATIONS[currentVer]) {
            try {
                data = MIGRATIONS[currentVer](data);
                currentVer++;
                data.version = currentVer; // Update version after success
            } catch (e) {
                console.error(`Migration failed at version ${currentVer}`, e);
                break; // Stop to prevent further corruption
            }
        } else {
            // No migration defined? Just bump it or assume it's fine?
            // Safer to bump and hope, or break. 
            // We'll bump to avoid infinite loop.
            currentVer++;
            data.version = currentVer;
        }
    }
    return data as SaveData;
}

function sanitizeSaveData(data: any): SaveData {
    // Emergency Fallbacks for critical data structures
    if (!data.gameState) data.gameState = {};
    if (!data.quickSlots || !Array.isArray(data.quickSlots)) data.quickSlots = new Array(4).fill(null);
    if (!data.materials) data.materials = {};
    if (!data.questProgress) data.questProgress = {};
    if (!data.activeQuests || !Array.isArray(data.activeQuests)) data.activeQuests = [];
    if (!data.completedQuests || !Array.isArray(data.completedQuests)) data.completedQuests = [];

    // Ensure stats exist to prevent "Cannot read property of undefined"
    if (!data.stats) {
        data.stats = {
            hp: 10, maxHp: 10, attack: 1, defense: 0,
            level: 1, exp: 0, nextLevelExp: 100,
            kills: 0, turn: 0
        };
    }

    return data as SaveData;
}

export function saveGame(
    gameState: GameState,
    stats: Stats,
    activeQuests: string[],
    completedQuests: string[],
    questProgress: Record<string, any>,
    materials: Record<string, number>,
    quickSlots: (QuickSlotData | null)[],
): { success: boolean; message: string } {

    // DELTA COMPRESSION LOGIC
    let mapDeltas: MapDelta[] = [];
    let saveMap: number[][] | undefined = gameState.map;

    // Only try delta compression if we have a seed and level
    if (gameState.seed !== undefined && gameState.level !== undefined && gameState.location !== 'home') {
        try {
            // 1. Regenerate base map
            // Note: We need dimensions. Constant? Or stored?
            // Assuming constants for now as dimension changes strictly break saves anyway.
            const generated = generateDungeon(MAP_WIDTH, MAP_HEIGHT, gameState.level, 1, gameState.seed);
            const baseMap = generated.map;

            // 2. Diff
            const currentMap = gameState.map;
            for (let y = 0; y < currentMap.length; y++) {
                for (let x = 0; x < currentMap[0].length; x++) {
                    if (currentMap[y][x] !== baseMap[y][x]) {
                        mapDeltas.push({ x, y, v: currentMap[y][x] });
                    }
                }
            }

            // 3. If successful diffing, drop the full map
            saveMap = undefined;
            console.log(`Delta compression active: ${mapDeltas.length} changes found. Dropping full map.`);
        } catch (e) {
            console.warn("Failed to generate delta map, falling back to full map save", e);
            saveMap = gameState.map; // Fallback
            mapDeltas = [];
        }
    }

    const saveData: SaveData = {
        version: CURRENT_VERSION,
        timestamp: Date.now(),
        gameState: {
            // Core Identity
            player: gameState.player,
            level: gameState.level,
            seed: gameState.seed,
            location: gameState.location,

            // Arrays & Objects
            inventory: gameState.inventory,
            equipment: gameState.equipment,

            // World State
            bossDefeated: gameState.bossDefeated,
            stairs: gameState.stairs,
            stairsUp: gameState.stairsUp,

            // Map Data (Potentially excluded)
            map: saveMap,

            // Large Arrays (Could be RLE compressed too, but keeping simple for now)
            explored: gameState.explored,

            // Dynamic Entities
            enemies: gameState.enemies,
            items: gameState.items,
            chests: gameState.chests,
            npcs: gameState.npcs, // NPCs are dynamic?
            torches: gameState.torches,
        },
        stats,
        activeQuests,
        completedQuests,
        questProgress,
        materials,
        quickSlots,
        seed: gameState.seed,
        mapDeltas: mapDeltas
    };

    try {
        const stringData = JSON.stringify(saveData);
        const compressed = LZString.compressToUTF16(stringData);
        localStorage.setItem(SAVE_KEY, compressed);

        const sizeKB = (compressed.length * 2 / 1024).toFixed(2); // UTF16 = 2 bytes per char
        console.log(`Partida guardada (v${CURRENT_VERSION}). Tamaño: ${sizeKB} KB. Deltas: ${mapDeltas.length}`);

        return { success: true, message: '¡Partida guardada!' };
    } catch (e) {
        console.error('Error saving game:', e);
        return { success: false, message: 'Error: Espacio insuficiente' };
    }
}

export function loadGame(): SaveData | null {
    try {
        const compressed = localStorage.getItem(SAVE_KEY);
        if (!compressed) return null;

        let stringData = LZString.decompressFromUTF16(compressed);
        if (!stringData) stringData = compressed;

        if (!stringData || !stringData.startsWith('{')) return null;

        let saveData = JSON.parse(stringData);

        // MIGRATE
        saveData = migrateSave(saveData);

        // SANITIZE (Ensure structural integrity)
        saveData = sanitizeSaveData(saveData);

        // RESTORE MAP FROM SEED + DELTAS (If applicable)
        const gs = saveData.gameState;
        if (!gs.map && saveData.seed !== undefined && gs.level !== undefined) {
            console.log(`Reconstructing map from seed: ${saveData.seed}`);
            try {
                const generated = generateDungeon(MAP_WIDTH, MAP_HEIGHT, gs.level, 1, saveData.seed);
                gs.map = generated.map;

                // Apply Deltas
                if (saveData.mapDeltas && saveData.mapDeltas.length > 0) {
                    console.log(`Applying ${saveData.mapDeltas.length} map deltas...`);
                    saveData.mapDeltas.forEach((d: MapDelta) => {
                        if (gs.map && gs.map[d.y] && gs.map[d.y][d.x] !== undefined) {
                            gs.map[d.y][d.x] = d.v;
                        }
                    });
                }
            } catch (e) {
                console.error("Critical error reconstructing map from seed:", e);
                // We might have a broken save here if we can't reconstruct.
            }
        }

        return saveData as SaveData;
    } catch (e) {
        console.error('Error loading game:', e);
        return null;
    }
}

export function hasSaveGame(): boolean {
    try {
        const item = localStorage.getItem(SAVE_KEY);
        return !!item;
    } catch (e) {
        return false;
    }
}

export function deleteSave(): { success: boolean } {
    try {
        localStorage.removeItem(SAVE_KEY);
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

export function formatSaveDate(timestamp: number): string {
    if (!timestamp) return 'Fecha desconocida';
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
