import { ArmorTypeInfo, WeaponTypeInfo, RarityInfo } from './types';

export const ARMOR_TYPES: Record<string, ArmorTypeInfo> = {
    heavy: { name: 'Placas', classes: ['warrior', 'knight', 'berserker'] },
    medium: { name: 'Cuero', classes: ['rogue', 'assassin', 'archer'] },
    light: { name: 'Tela', classes: ['mage', 'arcane', 'druid'] },
};

export const WEAPON_TYPES: Record<string, WeaponTypeInfo> = {
    // Guerrero
    sword: { name: 'Espada', classes: ['warrior', 'knight', 'berserker'], damageType: 'physical', ranged: false },
    axe: { name: 'Hacha', classes: ['warrior', 'knight', 'berserker'], damageType: 'physical', ranged: false },
    shield: { name: 'Escudo', classes: ['warrior', 'knight', 'berserker'], damageType: 'physical', ranged: false },
    mace: { name: 'Maza', classes: ['warrior', 'knight', 'berserker'], damageType: 'physical', ranged: false },
    spear: { name: 'Lanza', classes: ['warrior', 'knight', 'berserker'], damageType: 'physical', ranged: false }, // Should range be 2?

    // Pícaro
    dagger: { name: 'Daga', classes: ['rogue', 'assassin'], damageType: 'physical', ranged: false },
    bow: { name: 'Arco', classes: ['rogue', 'archer'], damageType: 'physical', ranged: true, range: 6 },
    quiver: { name: 'Carcaj', classes: ['rogue', 'archer', 'assassin'], damageType: 'physical', ranged: false },

    // Mago
    staff: { name: 'Bastón', classes: ['mage', 'arcane', 'druid'], damageType: 'magical', ranged: true, range: 5 },
    wand: { name: 'Varita', classes: ['mage', 'arcane', 'druid'], damageType: 'magical', ranged: true, range: 4 },
    tome: { name: 'Tomo', classes: ['mage', 'arcane', 'druid'], damageType: 'magical', ranged: false },
};

export const RARITY_CONFIG: Record<string, RarityInfo> = {
    common: { name: 'Común', color: '#a1a1aa', multiplier: 1, weight: 50 },     // Blanco
    uncommon: { name: 'Poco Común', color: '#4ade80', multiplier: 1.3, weight: 30 }, // Verde
    rare: { name: 'Raro', color: '#3b82f6', multiplier: 1.6, weight: 15 },      // Azul
    epic: { name: 'Épico', color: '#a855f7', multiplier: 2.0, weight: 4 },      // Morado
    legendary: { name: 'Legendario', color: '#f59e0b', multiplier: 3.0, weight: 1 } // Naranja
};
