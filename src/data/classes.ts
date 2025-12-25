import { PlayerClass } from '@/types/enums';

export interface ClassConfig {
    id: PlayerClass;
    name: string;
    description: string;
    baseStats: {
        hp: number;
        mp: number;
        attack: number;
        defense: number;
        magicAttack: number;
        magicDefense: number;
        critChance: number;
        evasion: number;
    };
    growthRates: {
        hp: number;
        mp: number;
        attack: number;
        defense: number;
        magicAttack: number;
        magicDefense: number;
    };
    combatBonuses: {
        meleeDamage?: number;
        rangedDamage?: number;
        magicDamage?: number;
        backstab?: number;
        crit?: number;
        evasion?: number;
        armor?: number;
    };
    startingSkills: string[];
}

export const CLASS_CONFIG: Record<PlayerClass, ClassConfig> = {
    [PlayerClass.WARRIOR]: {
        id: PlayerClass.WARRIOR,
        name: 'Guerrero',
        description: 'Maestro del combate cuerpo a cuerpo y la defensa.',
        baseStats: {
            hp: 120, mp: 30,
            attack: 12, defense: 10,
            magicAttack: 2, magicDefense: 4,
            critChance: 5, evasion: 5
        },
        growthRates: {
            hp: 20, mp: 5,
            attack: 2, defense: 2,
            magicAttack: 0, magicDefense: 1
        },
        combatBonuses: {
            meleeDamage: 0.15,
            armor: 0.10
        },
        startingSkills: ['power_strike', 'shield_bash']
    },
    [PlayerClass.MAGE]: {
        id: PlayerClass.MAGE,
        name: 'Mago',
        description: 'Poderoso hechicero que domina los elementos.',
        baseStats: {
            hp: 70, mp: 100,
            attack: 3, defense: 3,
            magicAttack: 15, magicDefense: 10,
            critChance: 5, evasion: 5
        },
        growthRates: {
            hp: 10, mp: 15,
            attack: 0, defense: 1,
            magicAttack: 3, magicDefense: 2
        },
        combatBonuses: {
            magicDamage: 0.25,
            rangedDamage: 0.10
        },
        startingSkills: ['heal', 'fireball']
    },
    [PlayerClass.ROGUE]: {
        id: PlayerClass.ROGUE,
        name: 'Pícaro',
        description: 'Experto en sigilo, velocidad y golpes críticos.',
        baseStats: {
            hp: 85, mp: 50,
            attack: 10, defense: 5,
            magicAttack: 4, magicDefense: 5,
            critChance: 15, evasion: 15
        },
        growthRates: {
            hp: 12, mp: 8,
            attack: 2, defense: 1,
            magicAttack: 1, magicDefense: 1
        },
        combatBonuses: {
            crit: 0.15,
            evasion: 0.10,
            backstab: 0.30
        },
        startingSkills: ['backstab', 'smoke_bomb']
    }
};
