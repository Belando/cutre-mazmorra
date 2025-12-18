import LZString from 'lz-string';
import { GameState, Stats, Item } from '@/types';

const SAVE_KEY = 'dungeon_crawler_save';

export interface SaveData {
    version: number;
    timestamp: number;
    gameState: Partial<GameState>; // Store core props
    stats: Stats;
    activeQuests: string[];
    completedQuests: string[];
    questProgress: Record<string, any>;
    materials: Record<string, number>;
    quickSlots: (Item | null)[];
}

export function saveGame(
    gameState: GameState,
    stats: Stats,
    activeQuests: string[],
    completedQuests: string[],
    questProgress: Record<string, any>,
    materials: Record<string, number>,
    quickSlots: (Item | null)[]
): { success: boolean; message: string } {

    // Construimos el objeto completo para que al cargar el mundo sea idéntico
    const saveData: SaveData = {
        version: 1,
        timestamp: Date.now(),
        gameState: {
            player: gameState.player,
            inventory: gameState.inventory,
            equipment: gameState.equipment,
            level: gameState.level,
            bossDefeated: gameState.bossDefeated,

            // --- CRÍTICO: Persistencia del entorno ---
            // Sin esto, al cargar apareces en el vacío o en un mapa nuevo
            map: gameState.map,
            explored: gameState.explored, // Para recordar qué has visto
            enemies: gameState.enemies,   // Para que los enemigos muertos sigan muertos
            items: gameState.items,       // Para que los items recogidos no reaparezcan
            chests: gameState.chests,
            npcs: gameState.npcs,
            stairs: gameState.stairs,
            stairsUp: gameState.stairsUp,
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
        // Compresión: Reduce el tamaño del string en un ~80-90%
        const compressed = LZString.compressToUTF16(stringData);

        localStorage.setItem(SAVE_KEY, compressed);
        console.log(`Partida guardada. Tamaño comprimido: ${(compressed.length / 1024).toFixed(2)} KB`);
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

        // 1. Intentar descomprimir
        let stringData = LZString.decompressFromUTF16(compressed);

        // 2. Fallback: Si devuelve null, quizás es un save antiguo sin comprimir
        if (!stringData) {
            stringData = compressed;
        }

        // Validación básica para evitar crashes si el save está corrupto
        if (!stringData || !stringData.startsWith('{')) return null;

        const saveData = JSON.parse(stringData) as SaveData;
        return saveData;
    } catch (e) {
        console.error('Error loading game:', e);
        return null;
    }
}

export function hasSaveGame(): boolean {
    try {
        return !!localStorage.getItem(SAVE_KEY);
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
