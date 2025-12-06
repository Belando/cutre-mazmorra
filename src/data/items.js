export const ARMOR_TYPES = {
  heavy: { name: 'Pesada', classes: ['warrior'] },
  medium: { name: 'Cuero', classes: ['rogue'] },
  light: { name: 'Túnica', classes: ['mage'] },
  universal: { name: 'Universal', classes: ['warrior', 'mage', 'rogue'] },
};

export const WEAPON_TYPES = {
  sword: { name: 'Espada', classes: ['warrior'], ranged: false },
  axe: { name: 'Hacha', classes: ['warrior'], ranged: false },
  dagger: { name: 'Daga', classes: ['rogue'], ranged: false },
  bow: { name: 'Arco', classes: ['rogue'], ranged: true, range: 6 },
  staff: { name: 'Bastón', classes: ['mage'], ranged: true, range: 5 },
  wand: { name: 'Varita', classes: ['mage'], ranged: true, range: 4 },
  // Offhands
  shield: { name: 'Escudo', classes: ['warrior'], ranged: false },
  tome: { name: 'Tomo', classes: ['mage'], ranged: false },
  quiver: { name: 'Carcaj', classes: ['rogue'], ranged: false },
};

export const ITEM_TEMPLATES = {
  // --- CONSUMIBLES ---
  health_potion: { name: 'Poción de Vida', category: 'potion', symbol: '🍷', description: 'Restaura vida.', stackable: true, baseStats: { health: 25 } },
  mana_potion: { name: 'Poción de Maná', category: 'potion', symbol: '🧪', description: 'Restaura maná.', stackable: true, baseStats: { mana: 20 } },
  strength_elixir: { name: 'Elixir de Fuerza', category: 'potion', symbol: '💪', description: '+Ataque permanente.', stackable: true, baseStats: { attackBoost: 1 }, rarityMultipliers: { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 6 } },
  bread: { name: 'Pan', category: 'food', symbol: '🍞', description: 'Comida básica.', stackable: true, baseStats: { health: 10 } },
  gold: { name: 'Oro', category: 'currency', symbol: '🪙', description: 'Monedas.', stackable: true, baseValue: 10, rarityMultipliers: { common: 1, uncommon: 2, rare: 5, epic: 10, legendary: 25 } },

  // --- ARMAS PRINCIPALES ---
  sword: { name: 'Espada', category: 'weapon', slot: 'weapon', weaponType: 'sword', symbol: '⚔️', baseStats: { attack: 5 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 } },
  axe: { name: 'Hacha', category: 'weapon', slot: 'weapon', weaponType: 'axe', symbol: '🪓', baseStats: { attack: 6 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 } },
  dagger: { name: 'Daga', category: 'weapon', slot: 'weapon', weaponType: 'dagger', symbol: '🗡️', baseStats: { attack: 3, critChance: 10 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 } },
  bow: { name: 'Arco', category: 'weapon', slot: 'weapon', weaponType: 'bow', symbol: '🏹', baseStats: { attack: 4, range: 6 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 } },
  staff: { name: 'Bastón', category: 'weapon', slot: 'weapon', weaponType: 'staff', symbol: '🪄', baseStats: { attack: 3, magicPower: 6 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 } },
  
  // --- MANO SECUNDARIA ---
  shield: {
    name: 'Escudo', category: 'weapon', slot: 'offhand', weaponType: 'shield', symbol: '🛡️',
    baseStats: { defense: 4, blockChance: 5 },
    rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 },
    nameVariants: { common: ['Escudo de Madera'], uncommon: ['Escudo de Hierro'], rare: ['Escudo Torre'], epic: ['Aegis'], legendary: ['Muro Divino'] }
  },
  tome: {
    name: 'Tomo', category: 'weapon', slot: 'offhand', weaponType: 'tome', symbol: '📖',
    baseStats: { magicPower: 4, maxMp: 10 },
    rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 },
    nameVariants: { common: ['Libro Viejo'], uncommon: ['Grimorio'], rare: ['Códice Arcano'], epic: ['Libro de Sombras'], legendary: ['Omninomicón'] }
  },
  quiver: {
    name: 'Carcaj', category: 'weapon', slot: 'offhand', weaponType: 'quiver', symbol: '🎒',
    baseStats: { attack: 2, critChance: 5 },
    rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 },
    nameVariants: { common: ['Carcaj de Cuero'], uncommon: ['Carcaj de Caza'], rare: ['Carcaj Élfico'], epic: ['Carcaj Infinito'], legendary: ['Carcaj Solar'] }
  },

  // --- ARMADURAS ESPECÍFICAS POR CLASE ---
  
  // GUERRERO (Pesada)
  heavy_helmet: { name: 'Yelmo', category: 'armor', slot: 'helmet', armorType: 'heavy', symbol: '🪖', baseStats: { defense: 3 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  heavy_chest: { name: 'Coraza', category: 'armor', slot: 'chest', armorType: 'heavy', symbol: '🛡️', baseStats: { defense: 6, maxHp: 10 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  heavy_legs: { name: 'Grebas', category: 'armor', slot: 'legs', armorType: 'heavy', symbol: '🦵', baseStats: { defense: 4 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  heavy_boots: { name: 'Botas de Placas', category: 'armor', slot: 'boots', armorType: 'heavy', symbol: '🥾', baseStats: { defense: 3 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  heavy_gloves: { name: 'Guanteletes', category: 'armor', slot: 'gloves', armorType: 'heavy', symbol: '🧤', baseStats: { defense: 2, attack: 1 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },

  // PÍCARO (Media/Cuero)
  leather_helmet: { name: 'Capucha', category: 'armor', slot: 'helmet', armorType: 'medium', symbol: '👤', baseStats: { defense: 2, evasion: 2 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  leather_chest: { name: 'Jubón', category: 'armor', slot: 'chest', armorType: 'medium', symbol: '🧥', baseStats: { defense: 4, evasion: 3 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  leather_legs: { name: 'Pantalones', category: 'armor', slot: 'legs', armorType: 'medium', symbol: '🦵', baseStats: { defense: 3, evasion: 2 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  leather_boots: { name: 'Botas de Cuero', category: 'armor', slot: 'boots', armorType: 'medium', symbol: '🥾', baseStats: { defense: 2, evasion: 3 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  leather_gloves: { name: 'Guantes de Cuero', category: 'armor', slot: 'gloves', armorType: 'medium', symbol: '🧤', baseStats: { defense: 1, critChance: 2 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },

  // MAGO (Ligera/Tela)
  light_helmet: { name: 'Sombrero', category: 'armor', slot: 'helmet', armorType: 'light', symbol: '🎩', baseStats: { defense: 1, magicPower: 3 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  light_chest: { name: 'Túnica', category: 'armor', slot: 'chest', armorType: 'light', symbol: '👘', baseStats: { defense: 2, magicPower: 6, maxMp: 10 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  light_legs: { name: 'Faldas', category: 'armor', slot: 'legs', armorType: 'light', symbol: '🦵', baseStats: { defense: 1, magicPower: 4 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  light_boots: { name: 'Zapatos', category: 'armor', slot: 'boots', armorType: 'light', symbol: '👞', baseStats: { defense: 1, magicPower: 2 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  light_gloves: { name: 'Vendas', category: 'armor', slot: 'gloves', armorType: 'light', symbol: '🧤', baseStats: { defense: 1, magicPower: 2 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },

  // ACCESORIOS (Universal)
  ring: { name: 'Anillo', category: 'accessory', slot: 'ring', symbol: '💍', baseStats: { attack: 1 }, rarityMultipliers: { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 } },
  necklace: { name: 'Collar', category: 'accessory', slot: 'necklace', symbol: '🧿', baseStats: { maxHp: 10 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  earring: { name: 'Pendiente', category: 'accessory', slot: 'earring', symbol: '✨', baseStats: { evasion: 2 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 } },
};