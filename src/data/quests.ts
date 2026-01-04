import { Item } from '@/types';
import { ENEMY_IDS } from './ids';

export interface QuestReward {
    gold?: number;
    exp?: number;
    item?: Partial<Item>; // Often simplified item
}

export type QuestTargetType = 'kill' | 'multi_kill' | 'collect' | 'floor' | 'boss' | 'craft' | 'gold';

export interface MultiTarget {
    target: string;
    count: number;
}

export interface Quest {
    id: string;
    name: string;
    type: 'main' | 'side';
    description: string;
    targetType: QuestTargetType;
    target?: string | number; // ID or amount
    targetCount?: number;
    targets?: MultiTarget[]; // For multi_kill
    floor?: number;
    reward: QuestReward;
    nextQuest?: string;
    requires?: string;
}

// Quest definitions with better tracking
export const QUESTS: Record<string, Quest> = {
    // Main story quests
    main_1: {
        id: 'main_1',
        name: 'El Despertar',
        type: 'main',
        description: 'Desciende al piso 3 y derrota al Señor de la Guerra Orco.',
        target: ENEMY_IDS.BOSS_ORC_WARLORD,
        targetType: 'boss',
        floor: 3,
        reward: { gold: 150, exp: 100 },
        nextQuest: 'main_2',
    },
    main_2: {
        id: 'main_2',
        name: 'El Sello Debilitado',
        type: 'main',
        description: 'Derrota al Liche en el piso 5 para obtener el Fragmento del Sello.',
        target: ENEMY_IDS.BOSS_LICH,
        targetType: 'boss',
        floor: 5,
        reward: { gold: 250, exp: 180, item: { name: 'Fragmento del Sello', symbol: '✧', rarity: 'legendary' } },
        nextQuest: 'main_3',
        requires: 'main_1',
    },
    main_3: {
        id: 'main_3',
        name: 'La Batalla Final',
        type: 'main',
        description: 'Enfrenta al Dragón Ancestral en las profundidades.',
        target: ENEMY_IDS.BOSS_ANCIENT_DRAGON,
        targetType: 'boss',
        floor: 7,
        reward: { gold: 500, exp: 350 },
        requires: 'main_2',
    },

    // Side quests - Kill type
    kill_rats: {
        id: 'kill_rats',
        name: 'Plaga de Ratas',
        type: 'side',
        description: 'Elimina 5 ratas para el Anciano.',
        target: ENEMY_IDS.RAT,
        targetType: 'kill',
        targetCount: 5,
        reward: { gold: 30, exp: 20 },
    },
    kill_skeletons: {
        id: 'kill_skeletons',
        name: 'Huesos Inquietos',
        type: 'side',
        description: 'Destruye 4 esqueletos.',
        target: ENEMY_IDS.SKELETON,
        targetType: 'kill',
        targetCount: 4,
        reward: { gold: 50, exp: 35 },
    },
    clear_spiders: {
        id: 'clear_spiders',
        name: 'Nido de Arañas',
        type: 'side',
        description: 'Elimina 5 arañas gigantes.',
        target: ENEMY_IDS.SPIDER,
        targetType: 'kill',
        targetCount: 5,
        reward: { gold: 60, exp: 40 },
    },
    undead_purge: {
        id: 'undead_purge',
        name: 'Purga de No-Muertos',
        type: 'side',
        description: 'Destruye 3 zombis y 3 esqueletos.',
        targetType: 'multi_kill',
        targets: [
            { target: ENEMY_IDS.ZOMBIE, count: 3 },
            { target: ENEMY_IDS.SKELETON, count: 3 },
        ],
        reward: { gold: 80, exp: 60 },
    },
    demon_hunt: {
        id: 'demon_hunt',
        name: 'Cazador de Demonios',
        type: 'side',
        description: 'Elimina 2 demonios.',
        target: ENEMY_IDS.DEMON,
        targetType: 'kill',
        targetCount: 2,
        reward: { gold: 150, exp: 100 },
    },
    beast_slayer: {
        id: 'beast_slayer',
        name: 'Matador de Bestias',
        type: 'side',
        description: 'Elimina 3 lobos y 2 troles.',
        targetType: 'multi_kill',
        targets: [
            { target: ENEMY_IDS.WOLF, count: 3 },
            { target: ENEMY_IDS.TROLL, count: 2 },
        ],
        reward: { gold: 120, exp: 80 },
    },
    crafting_master: {
        id: 'crafting_master',
        name: 'Maestro Artesano',
        type: 'side',
        description: 'Crea 3 items de rareza rara o superior.',
        targetType: 'craft',
        targetCount: 3,
        reward: { gold: 200, exp: 120 },
    },
    treasure_hunter: {
        id: 'treasure_hunter',
        name: 'Cazador de Tesoros',
        type: 'side',
        description: 'Acumula 500 de oro.',
        targetType: 'gold',
        target: 500,
        reward: { exp: 150 },
    },

    // Collection quests
    gather_iron: {
        id: 'gather_iron',
        name: 'Suministros de Hierro',
        type: 'side',
        description: 'Recolecta 5 minerales de hierro.',
        target: 'iron_ore',
        targetType: 'collect',
        targetCount: 5,
        reward: { gold: 40, exp: 25 },
    },
    gather_crystals: {
        id: 'gather_crystals',
        name: 'Cristales Mágicos',
        type: 'side',
        description: 'Recolecta 3 cristales mágicos.',
        target: 'crystal',
        targetType: 'collect',
        targetCount: 3,
        reward: { gold: 100, exp: 50 },
    },

    // Exploration quests
    explore_deep: {
        id: 'explore_deep',
        name: 'Explorador Profundo',
        type: 'side',
        description: 'Desciende hasta el piso 5.',
        target: 5,
        targetType: 'floor',
        reward: { gold: 120, exp: 80 },
    },

    // Boss hunting
    slay_goblin_king: {
        id: 'slay_goblin_king',
        name: 'Regicidio Goblin',
        type: 'side',
        description: 'Derrota al Rey Goblin.',
        target: ENEMY_IDS.BOSS_GOBLIN_KING,
        targetType: 'boss',
        floor: 1,
        reward: { gold: 75, exp: 50 },
    },
};
