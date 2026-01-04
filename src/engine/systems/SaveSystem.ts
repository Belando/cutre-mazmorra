import LZString from 'lz-string';
import { GameState, Stats, QuickSlotData } from '@/types';

const SAVE_KEY = 'dungeon_crawler_save';

const CURRENT_VERSION = 2;

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
    // Future migrations:
    // 2: (data) => { ... }
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

export function saveGame(
    gameState: GameState,
    stats: Stats,
    activeQuests: string[],
    completedQuests: string[],
    questProgress: Record<string, any>,
    materials: Record<string, number>,
    quickSlots: (QuickSlotData | null)[]
): { success: boolean; message: string } {
    const saveData: SaveData = {
        version: CURRENT_VERSION, // Use constant
        timestamp: Date.now(),
        gameState: {
            player: gameState.player,
            inventory: gameState.inventory,
            equipment: gameState.equipment,
            level: gameState.level,
            bossDefeated: gameState.bossDefeated,
            stairs: gameState.stairs,
            stairsUp: gameState.stairsUp,
            map: gameState.map,
            explored: gameState.explored,
            enemies: gameState.enemies,
            items: gameState.items,
            chests: gameState.chests,
            npcs: gameState.npcs,
            torches: gameState.torches,
        },
        stats,
        activeQuests,
        completedQuests,
        questProgress,
        materials,
        quickSlots,
    };

    try {
        const stringData = JSON.stringify(saveData);
        const compressed = LZString.compressToUTF16(stringData);
        localStorage.setItem(SAVE_KEY, compressed);
        console.log(`Partida guardada (v${CURRENT_VERSION}). Tamaño: ${(compressed.length / 1024).toFixed(2)} KB`);
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
