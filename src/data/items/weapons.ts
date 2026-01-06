import { ItemTemplate } from './types';

export const WEAPON_TEMPLATES: Record<string, ItemTemplate> = {
    sword: { name: 'Espada', category: 'weapon', slot: 'weapon', weaponType: 'sword', symbol: 'GiBroadsword', baseStats: { attack: 4 } },
    axe: { name: 'Hacha', category: 'weapon', slot: 'weapon', weaponType: 'axe', symbol: 'GiBattleAxe', baseStats: { attack: 5, attackSpeed: -1 } },
    dagger: { name: 'Daga', category: 'weapon', slot: 'weapon', weaponType: 'dagger', symbol: 'GiDaggers', baseStats: { attack: 2, critChance: 10 } },
    bow: { name: 'Arco', category: 'weapon', slot: 'weapon', weaponType: 'bow', symbol: 'GiPocketBow', baseStats: { attack: 3 } },
    staff: { name: 'Bastón', category: 'weapon', slot: 'weapon', weaponType: 'staff', symbol: 'GiWizardStaff', baseStats: { magicAttack: 5 } },
    wand: { name: 'Varita', category: 'weapon', slot: 'weapon', weaponType: 'wand', symbol: 'GiFairyWand', baseStats: { magicAttack: 3 } },

    // Nuevas
    mace: { name: 'Maza', category: 'weapon', slot: 'weapon', weaponType: 'mace', symbol: 'GiWarPick', baseStats: { attack: 4, hitChance: 5 } },
    great_sword: { name: 'Espadón', category: 'weapon', slot: 'weapon', weaponType: 'sword', symbol: 'GiBroadsword', baseStats: { attack: 7, attackSpeed: -2 } },
    spear: { name: 'Lanza', category: 'weapon', slot: 'weapon', weaponType: 'spear', symbol: 'GiSpear', baseStats: { attack: 4, range: 2 } },

    // Offhands
    shield: { name: 'Escudo', category: 'weapon', slot: 'offhand', weaponType: 'shield', symbol: 'GiRoundShield', baseStats: { defense: 3, blockChance: 5 } },
    tome: { name: 'Tomo', category: 'weapon', slot: 'offhand', weaponType: 'tome', symbol: 'GiSpellBook', baseStats: { magicAttack: 2, maxMp: 10 } },
    quiver: { name: 'Carcaj', category: 'weapon', slot: 'offhand', weaponType: 'quiver', symbol: 'GiQuiver', baseStats: { attack: 1, critChance: 3 } },
    magic_orb: { name: 'Orbe Mágico', category: 'weapon', slot: 'offhand', weaponType: 'tome', symbol: 'GiCrystalBall', baseStats: { magicAttack: 4, maxMp: 20 } },
};
