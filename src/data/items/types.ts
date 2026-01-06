import { Stats } from '@/types';

export interface ArmorTypeInfo {
    name: string;
    classes: string[];
}

export interface WeaponTypeInfo {
    name: string;
    classes: string[];
    damageType: 'physical' | 'magical';
    ranged: boolean;
    range?: number;
}

export interface ItemTemplate {
    name: string;
    category: 'weapon' | 'armor' | 'accessory' | 'potion' | 'material';
    slot?: 'helmet' | 'chest' | 'legs' | 'boots' | 'gloves' | 'weapon' | 'offhand' | 'ring' | 'necklace' | 'earring';
    weaponType?: string;
    armorType?: 'heavy' | 'medium' | 'light';
    symbol: string; // CHANGED: now a string ID from IconMap
    description?: string;
    stackable?: boolean;
    value?: number;
    baseStats?: Partial<Stats>; // Changed to Partial to fix lints
}

export interface RarityInfo {
    name: string;
    color: string;
    multiplier: number;
    weight: number;
}
