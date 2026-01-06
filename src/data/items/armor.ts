import { ItemTemplate } from './types';

export const ARMOR_TEMPLATES: Record<string, ItemTemplate> = {
    // Heavy (Guerrero)
    heavy_helmet: { name: 'Yelmo de Placas', category: 'armor', slot: 'helmet', armorType: 'heavy', symbol: 'GiClosedBarbute', baseStats: { defense: 2 } },
    heavy_chest: { name: 'Coraza de Placas', category: 'armor', slot: 'chest', armorType: 'heavy', symbol: 'GiBreastplate', baseStats: { defense: 4, maxHp: 10 } },
    heavy_legs: { name: 'Grebas de Placas', category: 'armor', slot: 'legs', armorType: 'heavy', symbol: 'GiLegArmor', baseStats: { defense: 3 } },
    heavy_boots: { name: 'Botas de Placas', category: 'armor', slot: 'boots', armorType: 'heavy', symbol: 'GiMetalBoot', baseStats: { defense: 2 } },
    heavy_gloves: { name: 'Guanteletes', category: 'armor', slot: 'gloves', armorType: 'heavy', symbol: 'GiGauntlet', baseStats: { defense: 1, attack: 1 } },

    // Medium (Pícaro)
    leather_helmet: { name: 'Capucha', category: 'armor', slot: 'helmet', armorType: 'medium', symbol: 'GiHood', baseStats: { defense: 1, magicDefense: 1 } },
    leather_chest: { name: 'Jubón', category: 'armor', slot: 'chest', armorType: 'medium', symbol: 'GiLeatherArmor', baseStats: { defense: 2, magicDefense: 2 } },
    leather_legs: { name: 'Pantalones', category: 'armor', slot: 'legs', armorType: 'medium', symbol: 'GiTrousers', baseStats: { defense: 2, magicDefense: 1 } },
    leather_boots: { name: 'Botas de Cuero', category: 'armor', slot: 'boots', armorType: 'medium', symbol: 'GiLeatherBoot', baseStats: { defense: 1, evasion: 2 } },
    leather_gloves: { name: 'Guantes de Cuero', category: 'armor', slot: 'gloves', armorType: 'medium', symbol: 'GiBracers', baseStats: { defense: 1, critChance: 1 } },

    // Light (Mago)
    light_helmet: { name: 'Sombrero', category: 'armor', slot: 'helmet', armorType: 'light', symbol: 'GiPointyHat', baseStats: { magicDefense: 3, maxMp: 5 } },
    light_chest: { name: 'Túnica', category: 'armor', slot: 'chest', armorType: 'light', symbol: 'GiRobe', baseStats: { magicDefense: 5, maxMp: 15 } },
    light_legs: { name: 'Faldas', category: 'armor', slot: 'legs', armorType: 'light', symbol: 'GiSkirt', baseStats: { magicDefense: 3, maxMp: 5 } },
    light_boots: { name: 'Zapatos', category: 'armor', slot: 'boots', armorType: 'light', symbol: 'GiBoots', baseStats: { magicDefense: 2 } },
    light_gloves: { name: 'Vendas', category: 'armor', slot: 'gloves', armorType: 'light', symbol: 'GiGloves', baseStats: { magicDefense: 1, magicAttack: 1 } },

    // Accesorios
    ring: { name: 'Anillo', category: 'accessory', slot: 'ring', symbol: 'GiRing', baseStats: { attack: 1, magicAttack: 1 } },
    necklace: { name: 'Collar', category: 'accessory', slot: 'necklace', symbol: 'GiNecklace', baseStats: { maxHp: 10, maxMp: 10 } },
    earring: { name: 'Pendiente', category: 'accessory', slot: 'earring', symbol: 'GiEarrings', baseStats: { evasion: 2, critChance: 2 } },
};
