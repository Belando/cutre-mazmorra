import { DamageType } from '@/types';

export interface ClassBonus {
    meleeDamageBonus?: number;
    armorBonus?: number;
    magicDamageBonus?: number;
    rangedBonus?: number;
    critBonus?: number;
    evasionBonus?: number;
    backstabBonus?: number;
}

export interface ClassConfig {
    id: string;
    name: string;
    isMagicUser?: boolean;
    bonuses?: ClassBonus;
}

export const CLASS_CONFIG: Record<string, ClassConfig> = {
    warrior: {
        id: 'warrior',
        name: 'Warrior',
        isMagicUser: false,
        bonuses: { meleeDamageBonus: 0.15, armorBonus: 0.10 }
    },
    mage: {
        id: 'mage',
        name: 'Mage',
        isMagicUser: true,
        bonuses: { magicDamageBonus: 0.25, rangedBonus: 0.10 }
    },
    rogue: {
        id: 'rogue',
        name: 'Rogue',
        isMagicUser: false,
        bonuses: { critBonus: 0.15, evasionBonus: 0.10, backstabBonus: 0.30 }
    },
    // Future classes
    arcane: {
        id: 'arcane',
        name: 'Arcane',
        isMagicUser: true
    },
    druid: {
        id: 'druid',
        name: 'Druid',
        isMagicUser: true
    }
};
