import { Item } from '@/types';

export const NPC_TYPES = {
    MERCHANT: 'merchant',
    QUEST_GIVER: 'quest_giver',
    SAGE: 'sage',
    BLACKSMITH: 'blacksmith',
} as const;

export type NpcType = typeof NPC_TYPES[keyof typeof NPC_TYPES];

export interface NpcDialog {
    greeting: string;
    noGold?: string;
    thanks?: string;
    farewell: string;
    questActive?: string;
    questComplete?: string;
    lore?: string;
}

export interface NpcTemplate {
    name: string;
    type: NpcType;
    symbol: string;
    color: string;
    dialogue: NpcDialog;
    inventory?: Item[];
}

export const NPCS: Record<string, NpcTemplate> = {
    merchant: {
        name: 'Garrick el Proveedor',
        type: NPC_TYPES.MERCHANT,
        symbol: '$',
        color: '#fbbf24',
        dialogue: {
            greeting: '¡Saludos, viajero! Tengo mercancías de tierras lejanas.',
            noGold: 'Me temo que tus bolsillos están demasiado ligeros para eso.',
            thanks: '¡Un placer hacer negocios contigo!',
            farewell: 'Que el oro guíe tu camino.',
        },
        inventory: [
            { id: 'health_potion', name: 'Poción de Vida', price: 25, stats: { health: 30 }, category: 'potion', rarity: 'uncommon' },
            { id: 'strength_elixir', name: 'Elixir de Fuerza', price: 50, stats: { attackBoost: 2 }, category: 'potion', rarity: 'rare' },
            { id: 'iron_sword', name: 'Espada de Hierro', price: 80, stats: { attack: 5 }, category: 'weapon', slot: 'weapon', weaponType: 'sword', rarity: 'uncommon' },
            { id: 'chain_mail', name: 'Cota de Malla', price: 100, stats: { defense: 4, maxHp: 10 }, category: 'armor', slot: 'chest', armorType: 'heavy', rarity: 'uncommon' },
            { id: 'lucky_ring', name: 'Anillo de la Suerte', price: 150, stats: { attack: 2, defense: 2 }, category: 'accessory', slot: 'ring', rarity: 'rare' },
        ],
    },
    quest_elder: {
        name: 'Eldric el Sabio',
        type: NPC_TYPES.QUEST_GIVER,
        symbol: '?',
        color: '#60a5fa',
        dialogue: {
            greeting: 'Ah, un alma valiente... La oscuridad avanza y necesito ayuda.',
            questActive: 'Aún no has completado lo que te pedí. Ten cuidado.',
            questComplete: '¡Magnífico! Sabía que podía confiar en ti.',
            farewell: 'Que la luz ilumine tus pasos en la mazmorra.',
        },
    },
    sage: {
        name: 'Valerius el Arcano',
        type: NPC_TYPES.SAGE,
        symbol: '✦',
        color: '#a855f7',
        dialogue: {
            greeting: 'Las líneas ley convergen en este lugar maldito...',
            lore: 'El Dragón Ancestral duerme bajo nosotros, pero su sueño es inquieto.',
            farewell: 'El conocimiento es la única arma que no se desafila.',
        },
    },
    blacksmith: {
        name: 'Brokk Martillo-Negro',
        type: NPC_TYPES.BLACKSMITH,
        symbol: '⚒',
        color: '#f97316',
        dialogue: {
            greeting: '¡El acero nunca miente! ¿Vienes a mejorar tu equipo?',
            farewell: 'Mantén tu hoja afilada y tu escudo en alto.',
        }
    },
};
