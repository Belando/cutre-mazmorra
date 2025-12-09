import {
  // Consumibles
  GiHealthPotion, GiManaFlask,
  // Armas
  GiBroadsword, GiBattleAxe, GiDaggers, GiLongbow, GiWizardStaff, GiFairyWand,
  // Offhands
  GiRoundShield, GiSpellBook, GiQuiver,
  // Heavy Armor (Placas)
  GiClosedBarbute, GiBreastplate, GiLegArmor, GiArmoredBoot, GiGauntlet,
  // Medium Armor (Cuero)
  GiHood, GiLeatherArmor, GiTrousers, GiLeatherBoot, GiLeatherGloves,
  // Light Armor (Tela)
  GiPointyHat, GiRobe, GiSkirt, GiBoots, GiGloves,
  // Accesorios
  GiRing, GiNecklace, GiEarrings
} from 'react-icons/gi';

export const ARMOR_TYPES = {
  heavy: { name: 'Placas', classes: ['warrior', 'knight', 'berserker'] },
  medium: { name: 'Cuero', classes: ['rogue', 'assassin', 'archer'] },
  light: { name: 'Tela', classes: ['mage', 'arcane', 'druid'] },
};

export const WEAPON_TYPES = {
  // Guerrero
  sword: { name: 'Espada', classes: ['warrior', 'knight', 'berserker'], damageType: 'physical', ranged: false },
  axe: { name: 'Hacha', classes: ['warrior', 'knight', 'berserker'], damageType: 'physical', ranged: false },
  shield: { name: 'Escudo', classes: ['warrior', 'knight', 'berserker'], damageType: 'physical', ranged: false },
  
  // Pícaro
  dagger: { name: 'Daga', classes: ['rogue', 'assassin'], damageType: 'physical', ranged: false },
  bow: { name: 'Arco', classes: ['rogue', 'archer'], damageType: 'physical', ranged: true, range: 6 },
  quiver: { name: 'Carcaj', classes: ['rogue', 'archer', 'assassin'], damageType: 'physical', ranged: false },
  
  // Mago
  staff: { name: 'Bastón', classes: ['mage', 'arcane', 'druid'], damageType: 'magical', ranged: true, range: 5 },
  wand: { name: 'Varita', classes: ['mage', 'arcane', 'druid'], damageType: 'magical', ranged: true, range: 4 },
  tome: { name: 'Tomo', classes: ['mage', 'arcane', 'druid'], damageType: 'magical', ranged: false },
};

// Templates BASE (Se escalarán según nivel y rareza)
export const ITEM_TEMPLATES = {
  // --- CONSUMIBLES ---
  health_potion: { name: 'Poción de Vida', category: 'potion', symbol: GiHealthPotion, description: 'Restaura vida.', stackable: true, baseStats: { health: 50 } },
  mana_potion: { name: 'Poción de Maná', category: 'potion', symbol: GiManaFlask, description: 'Restaura maná.', stackable: true, baseStats: { mana: 30 } },
  
  // --- ARMAS (Stats base para Nivel 1 Común) ---
  sword: { name: 'Espada', category: 'weapon', slot: 'weapon', weaponType: 'sword', symbol: GiBroadsword, baseStats: { attack: 4 } },
  axe: { name: 'Hacha', category: 'weapon', slot: 'weapon', weaponType: 'axe', symbol: GiBattleAxe, baseStats: { attack: 5, attackSpeed: -1 } }, 
  dagger: { name: 'Daga', category: 'weapon', slot: 'weapon', weaponType: 'dagger', symbol: GiDaggers, baseStats: { attack: 2, critChance: 10 } },
  bow: { name: 'Arco', category: 'weapon', slot: 'weapon', weaponType: 'bow', symbol: GiLongbow, baseStats: { attack: 3 } },
  staff: { name: 'Bastón', category: 'weapon', slot: 'weapon', weaponType: 'staff', symbol: GiWizardStaff, baseStats: { magicAttack: 5 } },
  wand: { name: 'Varita', category: 'weapon', slot: 'weapon', weaponType: 'wand', symbol: GiFairyWand, baseStats: { magicAttack: 3 } },

  // --- OFFHANDS ---
  shield: { name: 'Escudo', category: 'weapon', slot: 'offhand', weaponType: 'shield', symbol: GiRoundShield, baseStats: { defense: 3, blockChance: 5 } },
  tome: { name: 'Tomo', category: 'weapon', slot: 'offhand', weaponType: 'tome', symbol: GiSpellBook, baseStats: { magicAttack: 2, maxMp: 10 } },
  quiver: { name: 'Carcaj', category: 'weapon', slot: 'offhand', weaponType: 'quiver', symbol: GiQuiver, baseStats: { attack: 1, critChance: 3 } },

  // --- ARMADURAS (Stats base para Nivel 1 Común) ---
  // Heavy (Guerrero)
  heavy_helmet: { name: 'Yelmo de Placas', category: 'armor', slot: 'helmet', armorType: 'heavy', symbol: GiClosedBarbute, baseStats: { defense: 2 } },
  heavy_chest: { name: 'Coraza de Placas', category: 'armor', slot: 'chest', armorType: 'heavy', symbol: GiBreastplate, baseStats: { defense: 4, maxHp: 10 } },
  heavy_legs: { name: 'Grebas de Placas', category: 'armor', slot: 'legs', armorType: 'heavy', symbol: GiLegArmor, baseStats: { defense: 3 } },
  heavy_boots: { name: 'Botas de Placas', category: 'armor', slot: 'boots', armorType: 'heavy', symbol: GiArmoredBoot, baseStats: { defense: 2 } },
  heavy_gloves: { name: 'Guanteletes', category: 'armor', slot: 'gloves', armorType: 'heavy', symbol: GiGauntlet, baseStats: { defense: 1, attack: 1 } },

  // Medium (Pícaro)
  leather_helmet: { name: 'Capucha', category: 'armor', slot: 'helmet', armorType: 'medium', symbol: GiHood, baseStats: { defense: 1, magicDefense: 1 } },
  leather_chest: { name: 'Jubón', category: 'armor', slot: 'chest', armorType: 'medium', symbol: GiLeatherArmor, baseStats: { defense: 2, magicDefense: 2 } },
  leather_legs: { name: 'Pantalones', category: 'armor', slot: 'legs', armorType: 'medium', symbol: GiTrousers, baseStats: { defense: 2, magicDefense: 1 } },
  leather_boots: { name: 'Botas de Cuero', category: 'armor', slot: 'boots', armorType: 'medium', symbol: GiLeatherBoot, baseStats: { defense: 1, evasion: 2 } },
  leather_gloves: { name: 'Guantes de Cuero', category: 'armor', slot: 'gloves', armorType: 'medium', symbol: GiLeatherGloves, baseStats: { defense: 1, critChance: 1 } },

  // Light (Mago)
  light_helmet: { name: 'Sombrero', category: 'armor', slot: 'helmet', armorType: 'light', symbol: GiPointyHat, baseStats: { magicDefense: 3, maxMp: 5 } },
  light_chest: { name: 'Túnica', category: 'armor', slot: 'chest', armorType: 'light', symbol: GiRobe, baseStats: { magicDefense: 5, maxMp: 15 } },
  light_legs: { name: 'Faldas', category: 'armor', slot: 'legs', armorType: 'light', symbol: GiSkirt, baseStats: { magicDefense: 3, maxMp: 5 } },
  light_boots: { name: 'Zapatos', category: 'armor', slot: 'boots', armorType: 'light', symbol: GiBoots, baseStats: { magicDefense: 2 } },
  light_gloves: { name: 'Vendas', category: 'armor', slot: 'gloves', armorType: 'light', symbol: GiGloves, baseStats: { magicDefense: 1, magicAttack: 1 } },

  // --- ACCESORIOS (Universal) ---
  ring: { name: 'Anillo', category: 'accessory', slot: 'ring', symbol: GiRing, baseStats: { attack: 1, magicAttack: 1 } },
  necklace: { name: 'Collar', category: 'accessory', slot: 'necklace', symbol: GiNecklace, baseStats: { maxHp: 10, maxMp: 10 } },
  earring: { name: 'Pendiente', category: 'accessory', slot: 'earring', symbol: GiEarrings, baseStats: { evasion: 2, critChance: 2 } },
};

// Rarezas y Multiplicadores de Stats
export const RARITY_CONFIG = {
  common: { name: 'Común', color: '#a1a1aa', multiplier: 1, weight: 50 },     // Blanco
  uncommon: { name: 'Poco Común', color: '#4ade80', multiplier: 1.3, weight: 30 }, // Verde
  rare: { name: 'Raro', color: '#3b82f6', multiplier: 1.6, weight: 15 },      // Azul
  epic: { name: 'Épico', color: '#a855f7', multiplier: 2.0, weight: 4 },      // Morado
  legendary: { name: 'Legendario', color: '#f59e0b', multiplier: 3.0, weight: 1 } // Naranja
};