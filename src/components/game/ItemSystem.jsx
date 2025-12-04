import { Sword, Shield, CircleDot, Heart } from 'lucide-react';

// Equipment slot definitions (extended)
export const EQUIPMENT_SLOTS = {
  weapon: { icon: Sword, name: 'Arma Principal' },
  offhand: { icon: Shield, name: 'Arma Secundaria' },
  helmet: { icon: Shield, name: 'Yelmo' },
  chest: { icon: Shield, name: 'Armadura' },
  legs: { icon: Shield, name: 'Grebas' },
  boots: { icon: Shield, name: 'Botas' },
  gloves: { icon: Shield, name: 'Guanteletes' },
  ring: { icon: CircleDot, name: 'Anillo' },
  earring: { icon: CircleDot, name: 'Pendiente' },
  necklace: { icon: CircleDot, name: 'Amuleto' },
};

// Slot icons for equipment panel - Medieval Fantasy style
export const SLOT_ICONS = {
  weapon: '⚔️',
  offhand: '🛡️',
  helmet: '⛑️',
  chest: '🎽',
  legs: '👖',
  boots: '👢',
  gloves: '🧤',
  ring: '💍',
  earring: '✨',
  necklace: '📿',
};

// Item category icons - Medieval style
export const ITEM_ICONS = {
  // Weapons
  sword: '†',
  axe: '⚒',
  mace: '♱',
  dagger: '⚔',
  bow: '⌒',
  crossbow: '⊥',
  staff: '⚚',
  wand: '✦',
  
  // Armor
  heavy_armor: '⛨',
  leather_armor: '◊',
  robe: '∴',
  
  // Potions
  health_potion: '♥',
  mana_potion: '◆',
  strength_potion: '↑',
  defense_potion: '⛨',
  speed_potion: '»',
  
  // Consumables
  scroll: '≡',
  food: '●',
  elixir: '◈',
  
  // Currency
  gold: '●',
  
  // Materials
  ore: '◇',
  gem: '◆',
  essence: '✧',
};

// Attribute requirements by rarity
export const RARITY_REQUIREMENTS = {
  common: { strength: 0, dexterity: 0, intelligence: 0 },
  uncommon: { strength: 5, dexterity: 5, intelligence: 5 },
  rare: { strength: 12, dexterity: 12, intelligence: 12 },
  epic: { strength: 20, dexterity: 20, intelligence: 20 },
  legendary: { strength: 30, dexterity: 30, intelligence: 30 },
};

// Get required attribute for item type
export function getItemRequiredAttribute(item) {
  if (!item) return null;
  
  // Weapons
  if (item.weaponType) {
    if (['sword', 'axe', 'mace'].includes(item.weaponType)) return 'strength';
    if (['dagger', 'bow', 'crossbow'].includes(item.weaponType)) return 'dexterity';
    if (['staff', 'wand'].includes(item.weaponType)) return 'intelligence';
  }
  
  // Armor
  if (item.armorType) {
    if (item.armorType === 'heavy') return 'strength';
    if (item.armorType === 'medium') return 'dexterity';
    if (item.armorType === 'light') return 'intelligence';
  }
  
  return null; // Universal items don't require specific attribute
}

// Check if player meets attribute requirements
export function meetsAttributeRequirements(item, player) {
  if (!item || !item.rarity) return true;
  
  const requirements = RARITY_REQUIREMENTS[item.rarity] || RARITY_REQUIREMENTS.common;
  const requiredAttr = getItemRequiredAttribute(item);
  
  if (!requiredAttr) return true; // No specific requirement
  
  const playerAttr = player[requiredAttr] || 0;
  return playerAttr >= requirements[requiredAttr];
}

// Get missing attribute info for item
export function getMissingRequirement(item, player) {
  if (!item || !item.rarity) return null;
  
  const requirements = RARITY_REQUIREMENTS[item.rarity] || RARITY_REQUIREMENTS.common;
  const requiredAttr = getItemRequiredAttribute(item);
  
  if (!requiredAttr) return null;
  
  const playerAttr = player[requiredAttr] || 0;
  const required = requirements[requiredAttr];
  
  if (playerAttr >= required) return null;
  
  const attrNames = { strength: 'Fuerza', dexterity: 'Destreza', intelligence: 'Inteligencia' };
  return { attribute: attrNames[requiredAttr], required, current: playerAttr };
}

// Item rarities with weights (higher = more common)
const RARITY_WEIGHTS = {
  common: 50,
  uncommon: 30,
  rare: 15,
  epic: 4,
  legendary: 1,
};

// Armor type definitions for class restrictions
export const ARMOR_TYPES = {
  heavy: { name: 'Pesada', classes: ['warrior'] },
  medium: { name: 'Cuero', classes: ['rogue'] },
  light: { name: 'Túnica', classes: ['mage'] },
  universal: { name: 'Universal', classes: ['warrior', 'mage', 'rogue'] },
};

// Weapon type definitions for class restrictions  
export const WEAPON_TYPES = {
  sword: { name: 'Espada', classes: ['warrior'], ranged: false },
  axe: { name: 'Hacha', classes: ['warrior'], ranged: false },
  mace: { name: 'Maza', classes: ['warrior'], ranged: false },
  dagger: { name: 'Daga', classes: ['rogue'], ranged: false },
  bow: { name: 'Arco', classes: ['rogue'], ranged: true, range: 6 },
  crossbow: { name: 'Ballesta', classes: ['rogue', 'warrior'], ranged: true, range: 5 },
  staff: { name: 'Bastón', classes: ['mage'], ranged: true, range: 5 },
  wand: { name: 'Varita', classes: ['mage'], ranged: true, range: 4 },
};

// Check if class can equip item (includes attribute check)
export function canClassEquip(item, playerClass, player = null) {
  if (!item) return false;
  
  // Check weapon restrictions
  if (item.weaponType && WEAPON_TYPES[item.weaponType]) {
    if (!WEAPON_TYPES[item.weaponType].classes.includes(playerClass)) {
      return false;
    }
  }
  
  // Check armor restrictions
  if (item.armorType && ARMOR_TYPES[item.armorType]) {
    if (!ARMOR_TYPES[item.armorType].classes.includes(playerClass)) {
      return false;
    }
  }
  
  // Check attribute requirements if player provided
  if (player && !meetsAttributeRequirements(item, player)) {
    return false;
  }
  
  return true;
}

// Base item templates
const ITEM_TEMPLATES = {
  // Potions - Healing
  health_potion: {
    name: 'Poción de Vida',
    category: 'potion',
    symbol: '♥',
    description: 'Restaura vida al consumirla.',
    stackable: true,
    baseStats: { health: 25 },
    rarityMultipliers: {
      common: 1,
      uncommon: 1.5,
      rare: 2,
      epic: 3,
      legendary: 5,
    },
  },
  mana_potion: {
    name: 'Poción de Maná',
    category: 'potion',
    symbol: '◆',
    description: 'Restaura maná al consumirla.',
    stackable: true,
    baseStats: { mana: 20 },
    rarityMultipliers: {
      common: 1,
      uncommon: 1.5,
      rare: 2,
      epic: 3,
      legendary: 5,
    },
  },
  
  // Potions - Permanent buffs
  strength_elixir: {
    name: 'Elixir de Fuerza',
    category: 'potion',
    symbol: '↑',
    description: 'Aumenta permanentemente el ataque.',
    stackable: true,
    baseStats: { attackBoost: 1 },
    rarityMultipliers: {
      common: 1,
      uncommon: 2,
      rare: 3,
      epic: 4,
      legendary: 6,
    },
  },
  vitality_tonic: {
    name: 'Tónico de Vitalidad',
    category: 'potion',
    symbol: '❤',
    description: 'Aumenta permanentemente la vida máxima.',
    stackable: true,
    baseStats: { maxHpBoost: 5 },
    rarityMultipliers: {
      common: 1,
      uncommon: 2,
      rare: 3,
      epic: 4,
      legendary: 5,
    },
  },
  defense_elixir: {
    name: 'Elixir de Hierro',
    category: 'potion',
    symbol: '⛨',
    description: 'Aumenta permanentemente la defensa.',
    stackable: true,
    baseStats: { defenseBoost: 1 },
    rarityMultipliers: {
      common: 1,
      uncommon: 2,
      rare: 3,
      epic: 4,
      legendary: 5,
    },
  },
  mana_elixir: {
    name: 'Elixir Arcano',
    category: 'potion',
    symbol: '✧',
    description: 'Aumenta permanentemente el maná máximo.',
    stackable: true,
    baseStats: { maxMpBoost: 5 },
    rarityMultipliers: {
      common: 1,
      uncommon: 2,
      rare: 3,
      epic: 4,
      legendary: 5,
    },
  },
  
  // Potions - Temporary buffs
  rage_potion: {
    name: 'Poción de Furia',
    category: 'potion',
    symbol: '⚡',
    description: '+50% daño durante 10 turnos.',
    stackable: true,
    baseStats: { tempAttack: 50, duration: 10 },
    rarityMultipliers: { common: 1, uncommon: 1.2, rare: 1.5, epic: 2, legendary: 3 },
  },
  stone_skin_potion: {
    name: 'Poción Piel de Piedra',
    category: 'potion',
    symbol: '⛨',
    description: '+50% defensa durante 10 turnos.',
    stackable: true,
    baseStats: { tempDefense: 50, duration: 10 },
    rarityMultipliers: { common: 1, uncommon: 1.2, rare: 1.5, epic: 2, legendary: 3 },
  },
  haste_potion: {
    name: 'Poción de Celeridad',
    category: 'potion',
    symbol: '»',
    description: 'Doble acción durante 5 turnos.',
    stackable: true,
    baseStats: { haste: true, duration: 5 },
    rarityMultipliers: { common: 1, uncommon: 1, rare: 1, epic: 1, legendary: 1 },
  },
  
  // Scrolls
  scroll_fireball: {
    name: 'Pergamino de Bola de Fuego',
    category: 'scroll',
    symbol: '≡',
    description: 'Causa 40 daño a todos los enemigos visibles.',
    stackable: true,
    baseStats: { aoeDamage: 40 },
    rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 },
  },
  scroll_teleport: {
    name: 'Pergamino de Escape',
    category: 'scroll',
    symbol: '≡',
    description: 'Teletransporta a las escaleras.',
    stackable: true,
    baseStats: { teleport: true },
    rarityMultipliers: { common: 1, uncommon: 1, rare: 1, epic: 1, legendary: 1 },
  },
  scroll_identify: {
    name: 'Pergamino de Revelación',
    category: 'scroll',
    symbol: '≡',
    description: 'Revela todo el mapa del piso.',
    stackable: true,
    baseStats: { reveal: true },
    rarityMultipliers: { common: 1, uncommon: 1, rare: 1, epic: 1, legendary: 1 },
  },
  
  // Food
  bread: {
    name: 'Pan de Viaje',
    category: 'food',
    symbol: '●',
    description: 'Restaura un poco de vida.',
    stackable: true,
    baseStats: { health: 10 },
    rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 },
  },
  meat: {
    name: 'Carne Asada',
    category: 'food',
    symbol: '●',
    description: 'Restaura vida y maná.',
    stackable: true,
    baseStats: { health: 15, mana: 10 },
    rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 },
  },
  
  // Weapons - Warrior
  sword: {
    name: 'Espada',
    category: 'weapon',
    slot: 'weapon',
    weaponType: 'sword',
    symbol: '†',
    description: 'Una hoja afilada para cortar enemigos.',
    stackable: false,
    baseStats: { attack: 4 },
    rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 },
    nameVariants: {
      common: ['Espada Oxidada', 'Espada de Hierro', 'Espada Corta'],
      uncommon: ['Espada de Acero', 'Hoja del Caballero', 'Espada Larga'],
      rare: ['Espada Rúnica', 'Hoja Brillante', 'Espada de Fuego'],
      epic: ['Matademonios', 'Colmillo de Dragón', 'Rompe-almas'],
      legendary: ['Excalibur', 'Mata-dioses', 'Filo Eterno'],
    },
  },
  axe: {
    name: 'Hacha',
    category: 'weapon',
    slot: 'weapon',
    weaponType: 'axe',
    symbol: '⚒',
    description: 'Un arma pesada que causa daño masivo.',
    stackable: false,
    baseStats: { attack: 5 },
    rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 },
    nameVariants: {
      common: ['Hacha de Mano', 'Hacha de Leñador', 'Hachuela'],
      uncommon: ['Hacha de Batalla', 'Hacha de Guerra', 'Hacha de Acero'],
      rare: ['Hacha Berserker', 'Hacha de Escarcha', 'Hacha del Trueno'],
      epic: ['Rompe Cráneos', 'Hacha del Destino', 'Segadora de Gigantes'],
      legendary: ['Ragnarok', 'Fin del Mundo', 'Furia de Titán'],
    },
  },
  // Weapons - Rogue
  dagger: {
    name: 'Daga',
    category: 'weapon',
    slot: 'weapon',
    weaponType: 'dagger',
    symbol: '⚔',
    description: 'Un arma rápida para golpes veloces.',
    stackable: false,
    baseStats: { attack: 3, critChance: 5 },
    rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 },
    nameVariants: {
      common: ['Navaja', 'Daga Oxidada', 'Cuchillo'],
      uncommon: ['Daga de Acero', 'Hoja del Asesino', 'Cuchilla Curva'],
      rare: ['Daga de Sombras', 'Hoja Venenosa', 'Susurro Nocturno'],
      epic: ['Beso de la Muerte', 'Roba-almas', 'Filo Fantasma'],
      legendary: ['Perdición Divina', 'Colmillo del Vacío', 'Punta Eterna'],
    },
  },
  bow: {
    name: 'Arco',
    category: 'weapon',
    slot: 'weapon',
    weaponType: 'bow',
    symbol: '⌒',
    description: 'Ataque a distancia con alto rango.',
    stackable: false,
    baseStats: { attack: 3, range: 6 },
    rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 },
    nameVariants: {
      common: ['Arco Corto', 'Arco de Caza', 'Arco Simple'],
      uncommon: ['Arco Largo', 'Arco Compuesto', 'Arco de Guerra'],
      rare: ['Arco Élfico', 'Silbido del Viento', 'Arco de Hielo'],
      epic: ['Cazador de Estrellas', 'Muerte Silenciosa', 'Arco Solar'],
      legendary: ['Arco de Artemisa', 'Lluvia de Estrellas', 'Fin de los Días'],
    },
  },
  // Weapons - Mage
  staff: {
    name: 'Bastón',
    category: 'weapon',
    slot: 'weapon',
    weaponType: 'staff',
    symbol: '⚚',
    description: 'Canaliza poder mágico a distancia.',
    stackable: false,
    baseStats: { attack: 3, magicPower: 5 },
    rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 },
    nameVariants: {
      common: ['Bastón de Madera', 'Vara de Aprendiz', 'Bastón Simple'],
      uncommon: ['Bastón de Roble', 'Vara Encantada', 'Cetro Menor'],
      rare: ['Bastón de Cristal', 'Vara de Fuego', 'Cetro de Hielo'],
      epic: ['Bastón Arcano', 'Vara del Vacío', 'Cetro de Tormentas'],
      legendary: ['Bastón del Archimago', 'Vara de los Dioses', 'Cetro Infinito'],
    },
  },
  wand: {
    name: 'Varita',
    category: 'weapon',
    slot: 'weapon',
    weaponType: 'wand',
    symbol: '✦',
    description: 'Varita mágica de rango medio.',
    stackable: false,
    baseStats: { attack: 2, magicPower: 8 },
    rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 },
    nameVariants: {
      common: ['Varita de Sauce', 'Varita Simple', 'Vara Pequeña'],
      uncommon: ['Varita de Cristal', 'Varita Encantada', 'Rama Mágica'],
      rare: ['Varita de Fuego', 'Varita Glacial', 'Varita Rúnica'],
      epic: ['Varita del Caos', 'Puntero Astral', 'Guía de Almas'],
      legendary: ['Varita de Merlín', 'Núcleo del Vacío', 'Chispa Divina'],
    },
  },
  
  // Armor - Heavy (Warrior)
  heavy_chest: {
    name: 'Coraza',
    category: 'armor',
    slot: 'chest',
    armorType: 'heavy',
    symbol: '⛨',
    description: 'Armadura pesada de metal.',
    stackable: false,
    baseStats: { defense: 5, maxHp: 10 },
    rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 },
    nameVariants: {
      common: ['Coraza de Hierro', 'Peto Oxidado', 'Armadura Simple'],
      uncommon: ['Cota de Malla', 'Armadura de Escamas', 'Peto Reforzado'],
      rare: ['Armadura de Mithril', 'Placas Encantadas', 'Armadura Guardian'],
      epic: ['Escamas de Dragón', 'Piel Demoníaca', 'Placas Celestiales'],
      legendary: ['Aegis Inmortal', 'Abrazo Divino', 'Guardián Eterno'],
    },
  },
  // Armor - Medium (Rogue)
  leather_chest: {
    name: 'Jubón de Cuero',
    category: 'armor',
    slot: 'chest',
    armorType: 'medium',
    symbol: '◊',
    description: 'Armadura ligera de cuero.',
    stackable: false,
    baseStats: { defense: 3, evasion: 5 },
    rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 },
    nameVariants: {
      common: ['Jubón de Cuero', 'Chaleco Remendado', 'Ropa de Cazador'],
      uncommon: ['Cuero Tachonado', 'Armadura de Explorador', 'Piel Curtida'],
      rare: ['Cuero Élfico', 'Sombras Tejidas', 'Piel de Serpiente'],
      epic: ['Manto del Asesino', 'Vestidura Nocturna', 'Piel del Vacío'],
      legendary: ['Sombra Viviente', 'Silencio Eterno', 'Segunda Piel'],
    },
  },
  // Armor - Light (Mage)
  robe: {
    name: 'Túnica',
    category: 'armor',
    slot: 'chest',
    armorType: 'light',
    symbol: '∴',
    description: 'Túnica mágica que aumenta poder.',
    stackable: false,
    baseStats: { defense: 1, magicPower: 5, maxHp: 5 },
    rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 },
    nameVariants: {
      common: ['Túnica Simple', 'Ropa de Aprendiz', 'Vestidura Básica'],
      uncommon: ['Túnica Encantada', 'Vestidura Arcana', 'Ropa de Mago'],
      rare: ['Túnica de Seda', 'Vestidura Rúnica', 'Manto Místico'],
      epic: ['Vestidura del Vacío', 'Túnica de Estrellas', 'Manto Cósmico'],
      legendary: ['Túnica del Archimago', 'Vestidura Divina', 'Manto Infinito'],
    },
  },
  // Helmet
  helmet: {
    name: 'Casco',
    category: 'armor',
    slot: 'helmet',
    armorType: 'universal',
    symbol: '⛑',
    description: 'Protección para la cabeza.',
    stackable: false,
    baseStats: { defense: 2, maxHp: 5 },
    rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 },
    nameVariants: {
      common: ['Casco de Cuero', 'Capucha', 'Yelmo Simple'],
      uncommon: ['Casco de Acero', 'Yelmo de Batalla', 'Diadema'],
      rare: ['Yelmo Rúnico', 'Corona Mística', 'Casco Encantado'],
      epic: ['Yelmo de Dragón', 'Corona de Sombras', 'Casco del Campeón'],
      legendary: ['Corona del Rey', 'Yelmo Divino', 'Casco Legendario'],
    },
  },
  // Boots
  boots: {
    name: 'Botas',
    category: 'armor',
    slot: 'boots',
    armorType: 'universal',
    symbol: '⋀',
    description: 'Calzado protector.',
    stackable: false,
    baseStats: { defense: 1, evasion: 3 },
    rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 },
    nameVariants: {
      common: ['Botas de Cuero', 'Sandalias', 'Zapatos Simples'],
      uncommon: ['Botas de Viaje', 'Pisadas Seguras', 'Botas Reforzadas'],
      rare: ['Botas del Viento', 'Pisadas Silenciosas', 'Botas Élficas'],
      epic: ['Botas de Sombra', 'Pisadas de Gigante', 'Botas Voladoras'],
      legendary: ['Botas de Hermes', 'Pisadas Divinas', 'Zancadas Eternas'],
    },
  },
  // Gloves
  gloves: {
    name: 'Guantes',
    category: 'armor',
    slot: 'gloves',
    armorType: 'universal',
    symbol: '✋',
    description: 'Protección para las manos.',
    stackable: false,
    baseStats: { defense: 1, attack: 1 },
    rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 },
    nameVariants: {
      common: ['Guantes de Cuero', 'Vendas', 'Mitones'],
      uncommon: ['Guanteletes', 'Guantes de Combate', 'Manoplas'],
      rare: ['Guantes Rúnicos', 'Manos de Poder', 'Guantes Encantados'],
      epic: ['Garras de Dragón', 'Puños de Hierro', 'Guantes del Vacío'],
      legendary: ['Manos de Dios', 'Puños Eternos', 'Toque Divino'],
    },
  },
  // Legs
  legs: {
    name: 'Pantalones',
    category: 'armor',
    slot: 'legs',
    armorType: 'universal',
    symbol: '∏',
    description: 'Protección para las piernas.',
    stackable: false,
    baseStats: { defense: 2, maxHp: 3 },
    rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 },
    nameVariants: {
      common: ['Pantalones de Tela', 'Calzas Simples', 'Pierneras'],
      uncommon: ['Pantalones Reforzados', 'Grebas', 'Protectores'],
      rare: ['Piernas Encantadas', 'Pantalones Rúnicos', 'Grebas de Acero'],
      epic: ['Piernas de Dragón', 'Pantalones del Vacío', 'Grebas Celestiales'],
      legendary: ['Piernas de Titán', 'Pantalones Divinos', 'Grebas Eternas'],
    },
  },
  
  // Accessories - Ring
  ring: {
    name: 'Anillo',
    category: 'accessory',
    slot: 'ring',
    symbol: '○',
    description: 'Anillo mágico con bonificaciones.',
    stackable: false,
    baseStats: { attack: 1, critChance: 3 },
    rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 },
    nameVariants: {
      common: ['Anillo de Cobre', 'Banda Simple', 'Anillo de Hierro'],
      uncommon: ['Anillo de Plata', 'Anillo con Gema', 'Banda del Guerrero'],
      rare: ['Anillo Encantado', 'Anillo Rúnico', 'Banda de Poder'],
      epic: ['Ojo del Dragón', 'Anillo de Almas', 'Banda Demoníaca'],
      legendary: ['Anillo del Poder', 'Círculo Eterno', 'Sello Divino'],
    },
  },
  // Accessories - Necklace
  necklace: {
    name: 'Collar',
    category: 'accessory',
    slot: 'necklace',
    symbol: '◎',
    description: 'Collar protector con propiedades mágicas.',
    stackable: false,
    baseStats: { maxHp: 10, defense: 1 },
    rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 },
    nameVariants: {
      common: ['Amuleto de Madera', 'Colgante de Hueso', 'Collar Simple'],
      uncommon: ['Amuleto de Plata', 'Colgante de Cristal', 'Collar de la Suerte'],
      rare: ['Amuleto Místico', 'Talismán Brillante', 'Colgante Rúnico'],
      epic: ['Corazón de Dragón', 'Gema del Alma', 'Cristal del Vacío'],
      legendary: ['Corazón de la Eternidad', 'Lágrima de Dios', 'Núcleo Cósmico'],
    },
  },
  // Accessories - Earring
  earring: {
    name: 'Pendiente',
    category: 'accessory',
    slot: 'earring',
    symbol: '◇',
    description: 'Pendiente mágico.',
    stackable: false,
    baseStats: { magicPower: 3, evasion: 2 },
    rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 },
    nameVariants: {
      common: ['Pendiente de Cobre', 'Aro Simple', 'Pendiente de Hueso'],
      uncommon: ['Pendiente de Plata', 'Aro con Gema', 'Pendiente de Perla'],
      rare: ['Pendiente Encantado', 'Aro Rúnico', 'Pendiente Mágico'],
      epic: ['Pendiente del Dragón', 'Aro de Almas', 'Pendiente del Vacío'],
      legendary: ['Pendiente Divino', 'Aro de Eternidad', 'Pendiente Celestial'],
    },
  },
  
  // Gold
  gold: {
    name: 'Oro',
    category: 'currency',
    symbol: '●',
    description: 'Monedas relucientes.',
    stackable: true,
    baseValue: 10,
    rarityMultipliers: {
      common: 1,
      uncommon: 2,
      rare: 5,
      epic: 10,
      legendary: 25,
    },
  },
};

// Generate a random rarity based on dungeon level
export function generateRarity(dungeonLevel) {
  // Adjust weights based on dungeon level
  const adjustedWeights = { ...RARITY_WEIGHTS };
  
  // Higher levels have better loot
  if (dungeonLevel >= 3) {
    adjustedWeights.uncommon += 10;
    adjustedWeights.rare += 5;
  }
  if (dungeonLevel >= 5) {
    adjustedWeights.rare += 10;
    adjustedWeights.epic += 3;
  }
  if (dungeonLevel >= 7) {
    adjustedWeights.epic += 5;
    adjustedWeights.legendary += 1;
  }
  if (dungeonLevel >= 10) {
    adjustedWeights.legendary += 2;
  }
  
  const totalWeight = Object.values(adjustedWeights).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (const [rarity, weight] of Object.entries(adjustedWeights)) {
    random -= weight;
    if (random <= 0) return rarity;
  }
  
  return 'common';
}

// Generate a random item
export function generateItem(dungeonLevel, forceType = null) {
  const rarity = generateRarity(dungeonLevel);
  
  // Select item type
  let itemTypes;
  if (forceType) {
    itemTypes = [forceType];
  } else {
    // Weight item types - more consumables
    itemTypes = [
      'health_potion', 'health_potion', 'health_potion',
      'mana_potion', 'mana_potion',
      'strength_elixir',
      'vitality_tonic',
      'defense_elixir',
      'bread', 'meat',
      'gold', 'gold', 'gold', 'gold',
      'sword', 'axe', 'dagger',
      'heavy_chest', 'leather_chest', 'robe',
      'ring', 'necklace',
    ];
    
    // Add more equipment at higher levels
    if (dungeonLevel >= 3) {
      itemTypes.push('sword', 'heavy_chest', 'ring', 'rage_potion', 'stone_skin_potion');
    }
    if (dungeonLevel >= 5) {
      itemTypes.push('axe', 'dagger', 'necklace', 'scroll_fireball', 'mana_elixir');
    }
    if (dungeonLevel >= 7) {
      itemTypes.push('bow', 'staff', 'scroll_teleport', 'haste_potion');
    }
  }
  
  const templateKey = itemTypes[Math.floor(Math.random() * itemTypes.length)];
  const template = ITEM_TEMPLATES[templateKey];
  
  if (!template) return null;
  
  // Build the item
  const item = {
    id: `${templateKey}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    templateKey,
    rarity,
    symbol: template.symbol,
    category: template.category,
    description: template.description,
    stackable: template.stackable,
    quantity: 1,
  };
  
  // Set name
  if (template.nameVariants) {
    const variants = template.nameVariants[rarity];
    item.name = variants[Math.floor(Math.random() * variants.length)];
  } else {
    const rarityPrefix = rarity === 'common' ? '' : rarity.charAt(0).toUpperCase() + rarity.slice(1) + ' ';
    item.name = rarityPrefix + template.name;
  }
  
  // Set slot for equipment
  if (template.slot) {
    item.slot = template.slot;
  }
  
  // Copy weapon/armor type
  if (template.weaponType) item.weaponType = template.weaponType;
  if (template.armorType) item.armorType = template.armorType;
  
  // Calculate stats
  if (template.baseStats) {
    const multiplier = template.rarityMultipliers[rarity] || 1;
    item.stats = {};
    
    for (const [stat, value] of Object.entries(template.baseStats)) {
      if (typeof value === 'boolean') {
        item.stats[stat] = value;
      } else {
        item.stats[stat] = Math.floor(value * multiplier);
      }
    }
  }
  
  // Special handling for gold
  if (template.category === 'currency') {
    const multiplier = template.rarityMultipliers[rarity] || 1;
    item.value = Math.floor(template.baseValue * multiplier * (0.8 + Math.random() * 0.4));
  }
  
  return item;
}

// Generate items for a dungeon level (reduced chest count)
export function generateLevelItems(dungeonLevel, rooms, map, excludeRoomIndices = []) {
  const items = [];
  // Reduced: 2-4 items per level instead of 4-7
  const itemCount = 2 + Math.floor(dungeonLevel / 3) + Math.floor(Math.random() * 2);
  
  let placed = 0;
  let attempts = 0;
  
  while (placed < itemCount && attempts < 100) {
    attempts++;
    
    const roomIndex = Math.floor(Math.random() * rooms.length);
    if (excludeRoomIndices.includes(roomIndex)) continue;
    
    const room = rooms[roomIndex];
    const x = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
    const y = room.y + 1 + Math.floor(Math.random() * (room.height - 2));
    
    // Check if tile is floor and not occupied
    if (map[y]?.[x] === 1) { // TILE.FLOOR
      const occupied = items.some(i => i.x === x && i.y === y);
      if (!occupied) {
        const item = generateItem(dungeonLevel);
        if (item) {
          item.x = x;
          item.y = y;
          items.push(item);
          placed++;
        }
      }
    }
  }
  
  return items;
}

// Add item to inventory
export function addToInventory(inventory, item, maxSlots = 20) {
  if (!item) return { success: false, reason: 'Item inválido' };
  
  // Check for stackable items
  if (item.stackable) {
    const existingIndex = inventory.findIndex(
      i => i.templateKey === item.templateKey && i.rarity === item.rarity
    );
    
    if (existingIndex !== -1) {
      inventory[existingIndex].quantity += item.quantity || 1;
      return { success: true, stacked: true };
    }
  }
  
  // Check inventory space
  if (inventory.length >= maxSlots) {
    return { success: false, reason: 'Inventario lleno!' };
  }
  
  inventory.push({ ...item });
  return { success: true, stacked: false };
}

// Use a consumable item
export function useItem(inventory, index, player) {
  const item = inventory[index];
  if (!item) return { success: false, message: 'Item no encontrado' };
  
  // Check if consumable
  if (!['potion', 'scroll', 'food'].includes(item.category)) {
    return { success: false, message: 'No se puede usar este objeto' };
  }
  
  const result = { success: true, effects: [] };
  
  if (item.stats) {
    // Healing effects
    if (item.stats.health) {
      const healed = Math.min(item.stats.health, player.maxHp - player.hp);
      player.hp += healed;
      result.effects.push(`+${healed} Vida`);
    }
    
    // Mana restoration
    if (item.stats.mana) {
      const restored = Math.min(item.stats.mana, (player.maxMp || 30) - (player.mp || 0));
      player.mp = (player.mp || 0) + restored;
      result.effects.push(`+${restored} Maná`);
    }
    
    // Permanent boosts
    if (item.stats.attackBoost) {
      player.baseAttack = (player.baseAttack || player.attack) + item.stats.attackBoost;
      result.effects.push(`+${item.stats.attackBoost} Ataque permanente`);
    }
    if (item.stats.defenseBoost) {
      player.baseDefense = (player.baseDefense || player.defense) + item.stats.defenseBoost;
      result.effects.push(`+${item.stats.defenseBoost} Defensa permanente`);
    }
    if (item.stats.maxHpBoost) {
      player.maxHp += item.stats.maxHpBoost;
      player.hp += item.stats.maxHpBoost;
      result.effects.push(`+${item.stats.maxHpBoost} Vida Máxima permanente`);
    }
    if (item.stats.maxMpBoost) {
      player.maxMp = (player.maxMp || 30) + item.stats.maxMpBoost;
      player.mp = (player.mp || 0) + item.stats.maxMpBoost;
      result.effects.push(`+${item.stats.maxMpBoost} Maná Máximo permanente`);
    }
    
    // Temporary buffs - add to player buffs array
    if (item.stats.tempAttack) {
      player.skills = player.skills || { buffs: [] };
      player.skills.buffs = player.skills.buffs || [];
      player.skills.buffs.push({
        type: 'attack',
        value: item.stats.tempAttack,
        duration: item.stats.duration || 10,
        name: 'Furia'
      });
      result.effects.push(`+${item.stats.tempAttack}% Daño (${item.stats.duration} turnos)`);
    }
    if (item.stats.tempDefense) {
      player.skills = player.skills || { buffs: [] };
      player.skills.buffs = player.skills.buffs || [];
      player.skills.buffs.push({
        type: 'defense',
        value: item.stats.tempDefense,
        duration: item.stats.duration || 10,
        name: 'Piel de Piedra'
      });
      result.effects.push(`+${item.stats.tempDefense}% Defensa (${item.stats.duration} turnos)`);
    }
    if (item.stats.haste) {
      player.skills = player.skills || { buffs: [] };
      player.skills.buffs = player.skills.buffs || [];
      player.skills.buffs.push({
        type: 'haste',
        value: true,
        duration: item.stats.duration || 5,
        name: 'Celeridad'
      });
      result.effects.push(`Doble acción (${item.stats.duration} turnos)`);
    }
    
    // Scrolls
    if (item.stats.aoeDamage) {
      result.aoeDamage = item.stats.aoeDamage;
      result.effects.push(`Bola de Fuego: ${item.stats.aoeDamage} daño a todos`);
    }
    if (item.stats.teleport) {
      result.teleport = true;
      result.effects.push('Teletransportado a las escaleras');
    }
    if (item.stats.reveal) {
      result.reveal = true;
      result.effects.push('Mapa revelado');
    }
  }
  
  // Remove or decrement item
  if (item.quantity > 1) {
    inventory[index].quantity--;
  } else {
    inventory.splice(index, 1);
  }
  
  return result;
}

// Equip an item
export function equipItem(inventory, index, equipment, player) {
  const item = inventory[index];
  if (!item || !item.slot) {
    return { success: false, message: 'No se puede equipar este objeto' };
  }
  
  // Check class restrictions
  if (!canClassEquip(item, player.class, null)) {
    return { success: false, message: `Tu clase no puede equipar ${item.name}` };
  }
  
  // Check attribute requirements
  const missing = getMissingRequirement(item, player);
  if (missing) {
    return { success: false, message: `Necesitas ${missing.required} ${missing.attribute} (tienes ${missing.current})` };
  }
  
  const slot = item.slot;
  
  // Unequip current item in slot if any
  if (equipment[slot]) {
    const unequipResult = unequipItem(equipment, slot, inventory, player);
    if (!unequipResult.success) {
      return unequipResult;
    }
  }
  
  // Remove from inventory
  inventory.splice(index, 1);
  
  // Add to equipment
  equipment[slot] = item;
  
  // Apply stats
  if (item.stats) {
    if (item.stats.attack) player.equipAttack = (player.equipAttack || 0) + item.stats.attack;
    if (item.stats.defense) player.equipDefense = (player.equipDefense || 0) + item.stats.defense;
    if (item.stats.maxHp) {
      player.equipMaxHp = (player.equipMaxHp || 0) + item.stats.maxHp;
      player.maxHp += item.stats.maxHp;
    }
    if (item.stats.evasion) player.equipEvasion = (player.equipEvasion || 0) + item.stats.evasion;
    if (item.stats.critChance) player.equipCrit = (player.equipCrit || 0) + item.stats.critChance;
    if (item.stats.magicPower) player.equipMagic = (player.equipMagic || 0) + item.stats.magicPower;
  }
  
  return { success: true, message: `Equipado: ${item.name}` };
}

// Unequip an item
export function unequipItem(equipment, slot, inventory, player, maxSlots = 20) {
  const item = equipment[slot];
  if (!item) {
    return { success: false, message: 'Nada equipado en este slot' };
  }
  
  // Check inventory space
  if (inventory.length >= maxSlots) {
    return { success: false, message: '¡Inventario lleno!' };
  }
  
  // Remove stats
  if (item.stats) {
    if (item.stats.attack) player.equipAttack = (player.equipAttack || 0) - item.stats.attack;
    if (item.stats.defense) player.equipDefense = (player.equipDefense || 0) - item.stats.defense;
    if (item.stats.maxHp) {
      player.equipMaxHp = (player.equipMaxHp || 0) - item.stats.maxHp;
      player.maxHp -= item.stats.maxHp;
      player.hp = Math.min(player.hp, player.maxHp);
    }
    if (item.stats.evasion) player.equipEvasion = (player.equipEvasion || 0) - item.stats.evasion;
    if (item.stats.critChance) player.equipCrit = (player.equipCrit || 0) - item.stats.critChance;
    if (item.stats.magicPower) player.equipMagic = (player.equipMagic || 0) - item.stats.magicPower;
  }
  
  // Add to inventory
  inventory.push(item);
  
  // Remove from equipment
  equipment[slot] = null;
  
  return { success: true, message: `Desequipado: ${item.name}` };
}

// Calculate total player stats with equipment
export function calculatePlayerStats(player) {
  return {
    attack: (player.baseAttack || player.attack || 8) + (player.equipAttack || 0),
    defense: (player.baseDefense || player.defense || 3) + (player.equipDefense || 0),
    maxHp: player.maxHp,
  };
}

// Check if item can be assigned to quick slot
export function canAssignToQuickSlot(item) {
  return item && ['potion', 'scroll', 'food'].includes(item.category);
}