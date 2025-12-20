import { TILE } from '@/data/constants';
import { GameState, Item } from '@/types';
import { NPCS, NPC_TYPES, NpcTemplate, NpcType } from '@/data/npcs';
import { QUESTS, Quest, QuestTargetType } from '@/data/quests';

export { NPC_TYPES, NPCS };
export type { NpcTemplate, NpcType };

// Quest definitions managed in src/data/quests.ts
export { QUESTS };
export type { Quest };

// Get available quests for a floor
export function getAvailableQuests(floor: number, completedQuests: string[] = [], activeQuests: string[] = []): Quest[] {
    const available: Quest[] = [];

    Object.values(QUESTS).forEach(quest => {
        // Skip completed or active quests
        if (completedQuests.includes(quest.id)) return;
        if (activeQuests.includes(quest.id)) return;

        // Check requirements
        if (quest.requires && !completedQuests.includes(quest.requires)) return;

        if (quest.type === 'main') {
            // Main quests available when requirements met
            if (!quest.requires || completedQuests.includes(quest.requires)) {
                available.push(quest);
            }
        } else if (quest.type === 'side') {
            // Side quests available based on floor
            if (quest.id === 'kill_rats' && floor >= 1) available.push(quest);
            if (quest.id === 'kill_skeletons' && floor >= 2) available.push(quest);
            if (quest.id === 'clear_spiders' && floor >= 3) available.push(quest);
            if (quest.id === 'undead_purge' && floor >= 3) available.push(quest);
            if (quest.id === 'demon_hunt' && floor >= 6) available.push(quest);
            if (quest.id === 'beast_slayer' && floor >= 4) available.push(quest);
            if (quest.id === 'gather_iron' && floor >= 1) available.push(quest);
            if (quest.id === 'gather_crystals' && floor >= 4) available.push(quest);
            if (quest.id === 'explore_deep' && floor >= 2) available.push(quest);
            if (quest.id === 'slay_goblin_king' && floor >= 1) available.push(quest);
            if (quest.id === 'crafting_master' && floor >= 2) available.push(quest);
            if (quest.id === 'treasure_hunter' && floor >= 1) available.push(quest);
        }
    });

    return available;
}

export interface QuestProgressResult {
    complete: boolean;
    progress: number | string;
    target?: number | string;
    type?: QuestTargetType;
}

// Check quest progress
export function checkQuestProgress(quest: Quest, gameState: GameState): QuestProgressResult {
    if (!quest) return { complete: false, progress: 0 };

    const progress = gameState.questProgress?.[quest.id] || 0;

    switch (quest.targetType) {
        case 'kill':
            return {
                complete: typeof progress === 'number' && progress >= (quest.targetCount || 0),
                progress: progress,
                target: quest.targetCount,
                type: 'kill',
            };

        case 'multi_kill':
            const multiProgress = gameState.questProgress?.[quest.id] || {};
            let allComplete = true;
            let progressStr = '';
            quest.targets?.forEach(t => {
                const count = multiProgress[t.target] || 0;
                if (count < t.count) allComplete = false;
                progressStr += `${count}/${t.count} `;
            });
            return {
                complete: allComplete,
                progress: progressStr.trim(),
                target: quest.targets?.map(t => t.count).join('/') || '',
                type: 'multi_kill',
            };

        case 'collect':
            const materials = gameState.materials || {};
            const collected = materials[quest.target as string] || 0;
            return {
                complete: collected >= (quest.targetCount || 0),
                progress: collected,
                target: quest.targetCount,
                type: 'collect',
            };

        case 'floor':
            const currentFloor = gameState.level || 1;
            return {
                complete: currentFloor >= (quest.target as number),
                progress: currentFloor,
                target: quest.target as number,
                type: 'floor',
            };

        case 'boss':
            const bossKilled = gameState.questProgress?.[quest.id] || 0;
            return {
                complete: typeof bossKilled === 'number' && bossKilled >= 1,
                progress: bossKilled,
                target: 1,
                type: 'boss',
            };

        case 'craft':
            const crafted = gameState.questProgress?.[quest.id] || 0;
            return {
                complete: typeof crafted === 'number' && crafted >= (quest.targetCount || 0),
                progress: crafted,
                target: quest.targetCount,
                type: 'craft',
            };

        case 'gold':
            const totalGold = gameState.player?.gold || 0;
            return {
                complete: totalGold >= (quest.target as number),
                progress: totalGold,
                target: quest.target as number,
                type: 'gold',
            };

        default:
            return { complete: false, progress: 0 };
    }
}

interface Room {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface NpcEntity extends NpcTemplate {
    x: number;
    y: number;
    id: string;
}

// --- LÓGICA DE GENERACIÓN DE NPCs (ACTUALIZADA Y ESTRICTA) ---
export function generateNPCs(floor: number, rooms: Room[], map: number[][], excludeRoomIndices: number[] = [], enemies: { x: number, y: number }[] = []): NpcEntity[] {
    const npcs: NpcEntity[] = [];

    // Helper: Comprobar si la habitación tiene una puerta (TILE.DOOR = 3)
    const roomHasDoor = (room: Room) => {
        // Revisar perímetro superior e inferior
        for (let x = room.x; x < room.x + room.width; x++) {
            if (map[room.y - 1]?.[x] === TILE.DOOR || map[room.y + room.height]?.[x] === TILE.DOOR) return true;
        }
        // Revisar perímetro lateral
        for (let y = room.y; y < room.y + room.height; y++) {
            if (map[y]?.[room.x - 1] === TILE.DOOR || map[y]?.[room.x + room.width] === TILE.DOOR) return true;
        }
        return false;
    };

    // Helper: Comprobar si hay algún enemigo DENTRO de la habitación
    const roomHasEnemies = (room: Room) => {
        return enemies.some(e =>
            e.x >= room.x && e.x < room.x + room.width &&
            e.y >= room.y && e.y < room.y + room.height
        );
    };

    // Helper: Comprobar si hay otro NPC en la habitación (para que estén separados)
    const roomHasNPC = (room: Room) => {
        return npcs.some(n =>
            n.x >= room.x && n.x < room.x + room.width &&
            n.y >= room.y && n.y < room.y + room.height
        );
    };

    // Función para colocar un NPC buscando en la lista de habitaciones candidatas
    const placeNPC = (npcTemplate: NpcTemplate, candidateRooms: Room[], idPrefix: string) => {
        for (const room of candidateRooms) {

            // REGLA 1: La habitación debe tener puerta (estar cerrada)
            if (!roomHasDoor(room)) continue;

            // REGLA 2: No puede haber enemigos en la habitación
            if (roomHasEnemies(room)) continue;

            // REGLA 3: No puede haber otro NPC en la habitación
            if (roomHasNPC(room)) continue;

            // Si pasa los filtros, colocamos el NPC en el centro
            const x = room.x + Math.floor(room.width / 2);
            const y = room.y + Math.floor(room.height / 2);

            // VERIFICACIÓN EXTRA PARA HERRERO (Necesita 2 casillas: x y x+1)
            if (npcTemplate.type === NPC_TYPES.BLACKSMITH) {
                if (map[y]?.[x] === TILE.FLOOR && map[y]?.[x + 1] === TILE.FLOOR) {
                    npcs.push({ ...npcTemplate, x, y, id: `${idPrefix}_${floor}` });
                    return true;
                }
            }
            // NPC NORMAL (1 casilla)
            else if (map[y]?.[x] === TILE.FLOOR) {
                npcs.push({ ...npcTemplate, x, y, id: `${idPrefix}_${floor}` });
                return true;
            }
        }
        return false; // No se encontró sitio válido
    };

    // 1. Merchant (Pisos Impares)
    if (floor % 2 === 1) {
        // Candidatos: Todas menos la inicial
        const candidates = rooms.filter((r, i) => !excludeRoomIndices.includes(i) && i !== 0);
        placeNPC(NPCS.merchant, candidates, 'merchant');
    }

    // 2. Quest Giver (Pisos 1, 3, 5)
    if ([1, 3, 5].includes(floor)) {
        const candidates = rooms.filter((r, i) => !excludeRoomIndices.includes(i) && i !== 0);
        placeNPC(NPCS.quest_elder, candidates, 'quest_elder');
    }

    // 3. Sage (Pisos 1, 6)
    if ([1, 6].includes(floor)) {
        // Preferencia inicial: habitaciones tempranas (ej. índice 1) pero flexibles
        const candidates = rooms.filter((r, i) => !excludeRoomIndices.includes(i) && i !== 0);
        // Ordenamos para dar preferencia a la habitación 1 si es posible, sino cualquiera
        candidates.sort((a, b) => (a === rooms[1] ? -1 : 1));

        placeNPC(NPCS.sage, candidates, 'sage');
    }

    // 4. Herrero (Piso 1 y Pisos Pares)
    if (floor === 1 || floor % 2 === 0) {
        // Candidatos: Preferiblemente habitaciones más profundas (i > 1) para variar
        const candidates = rooms.filter((r, i) => !excludeRoomIndices.includes(i) && i !== 0);
        // Ordenamos para intentar ponerlo en habitaciones finales si es posible
        candidates.sort((a, b) => rooms.indexOf(b) - rooms.indexOf(a));

        placeNPC(NPCS.blacksmith, candidates, 'blacksmith');
    }

    return npcs;
}
