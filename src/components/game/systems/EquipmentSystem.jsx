// Extended Equipment System with class restrictions and more slots

export const EQUIPMENT_SLOTS = {
  weapon: { name: 'Arma', icon: '⚔️' },
  offhand: { name: 'Mano Izq.', icon: '🛡️' },
  helmet: { name: 'Casco', icon: '🪖' },
  chest: { name: 'Pecho', icon: '👕' },
  legs: { name: 'Piernas', icon: '👖' },
  boots: { name: 'Botas', icon: '👢' },
  gloves: { name: 'Guantes', icon: '🧤' },
  ring: { name: 'Anillo', icon: '💍' },
  earring: { name: 'Pendiente', icon: '✨' },
  necklace: { name: 'Collar', icon: '📿' },
};

// Armor types and class restrictions
export const ARMOR_TYPES = {
  heavy: { name: 'Pesada', classes: ['warrior'], color: '#71717a' },
  medium: { name: 'Cuero', classes: ['rogue'], color: '#92400e' },
  light: { name: 'Túnica', classes: ['mage'], color: '#7c3aed' },
  universal: { name: 'Universal', classes: ['warrior', 'mage', 'rogue'], color: '#3b82f6' },
};

// Weapon types and class restrictions
export const WEAPON_TYPES = {
  sword: { name: 'Espada', classes: ['warrior'], slot: 'weapon', ranged: false, icon: '⚔️' },
  axe: { name: 'Hacha', classes: ['warrior'], slot: 'weapon', ranged: false, icon: '🪓' },
  mace: { name: 'Maza', classes: ['warrior'], slot: 'weapon', ranged: false, icon: '🔨' },
  dagger: { name: 'Daga', classes: ['rogue'], slot: 'weapon', ranged: false, icon: '🗡️' },
  bow: { name: 'Arco', classes: ['rogue'], slot: 'weapon', ranged: true, range: 6, icon: '🏹' },
  crossbow: { name: 'Ballesta', classes: ['rogue', 'warrior'], slot: 'weapon', ranged: true, range: 5, icon: '🎯' },
  staff: { name: 'Bastón', classes: ['mage'], slot: 'weapon', ranged: true, range: 5, icon: '🪄' },
  wand: { name: 'Varita', classes: ['mage'], slot: 'weapon', ranged: true, range: 4, icon: '✨' },
  shield: { name: 'Escudo', classes: ['warrior'], slot: 'offhand', ranged: false, icon: '🛡️' },
  tome: { name: 'Tomo', classes: ['mage'], slot: 'offhand', ranged: false, icon: '📖' },
  quiver: { name: 'Carcaj', classes: ['rogue'], slot: 'offhand', ranged: false, icon: '🏹' },
};

// Check if a class can equip an item
export function canEquipItem(item, playerClass) {
  if (!item) return false;
  
  // Check weapon type restrictions
  if (item.weaponType && WEAPON_TYPES[item.weaponType]) {
    return WEAPON_TYPES[item.weaponType].classes.includes(playerClass);
  }
  
  // Check armor type restrictions
  if (item.armorType && ARMOR_TYPES[item.armorType]) {
    return ARMOR_TYPES[item.armorType].classes.includes(playerClass);
  }
  
  // Universal items (accessories)
  if (item.slot === 'ring' || item.slot === 'earring' || item.slot === 'necklace') {
    return true;
  }
  
  // Default: check if universal
  return item.armorType === 'universal' || !item.armorType;
}

// Get weapon range (0 = melee)
export function getWeaponRange(equipment) {
  const weapon = equipment?.weapon;
  if (!weapon || !weapon.weaponType) return 0;
  
  const weaponInfo = WEAPON_TYPES[weapon.weaponType];
  return weaponInfo?.ranged ? (weaponInfo.range || 4) : 0;
}

// Check if weapon is ranged
export function isRangedWeapon(equipment) {
  return getWeaponRange(equipment) > 0;
}

// Calculate all equipment bonuses
export function calculateEquipmentStats(equipment) {
  const stats = {
    attack: 0,
    defense: 0,
    maxHp: 0,
    evasion: 0,
    critChance: 0,
    magicPower: 0,
    range: 0,
  };
  
  Object.values(equipment || {}).forEach(item => {
    if (item?.stats) {
      if (item.stats.attack) stats.attack += item.stats.attack;
      if (item.stats.defense) stats.defense += item.stats.defense;
      if (item.stats.maxHp) stats.maxHp += item.stats.maxHp;
      if (item.stats.evasion) stats.evasion += item.stats.evasion;
      if (item.stats.critChance) stats.critChance += item.stats.critChance;
      if (item.stats.magicPower) stats.magicPower += item.stats.magicPower;
    }
  });
  
  // Add weapon range
  stats.range = getWeaponRange(equipment);
  
  return stats;
}

// Generate equipment based on type and rarity
export function generateEquipment(type, slot, rarity, dungeonLevel) {
  const rarityMultipliers = {
    common: 1,
    uncommon: 1.5,
    rare: 2,
    epic: 3,
    legendary: 5,
  };
  
  const mult = rarityMultipliers[rarity] || 1;
  const levelBonus = Math.floor(dungeonLevel / 2);
  
  const baseStats = {
    weapon: { attack: 3 + levelBonus },
    offhand: { defense: 2 + levelBonus, attack: 1 },
    helmet: { defense: 2 + levelBonus, maxHp: 5 },
    chest: { defense: 4 + levelBonus, maxHp: 10 },
    legs: { defense: 3 + levelBonus, maxHp: 5 },
    boots: { defense: 1 + levelBonus, evasion: 2 },
    gloves: { defense: 1 + levelBonus, attack: 1 },
    ring: { attack: 1, defense: 1, critChance: 2 },
    earring: { magicPower: 2, maxHp: 5 },
    necklace: { maxHp: 10, defense: 1 },
  };
  
  const stats = {};
  const base = baseStats[slot] || {};
  
  Object.entries(base).forEach(([stat, value]) => {
    stats[stat] = Math.floor(value * mult);
  });
  
  return { stats, rarity };
}

// Armor piece templates by type
export const ARMOR_TEMPLATES = {
  heavy: {
    helmet: ['Yelmo de Hierro', 'Yelmo de Acero', 'Yelmo de Placas', 'Corona de Guerra'],
    chest: ['Coraza de Hierro', 'Peto de Acero', 'Armadura de Placas', 'Aegis del Campeón'],
    legs: ['Grebas de Hierro', 'Musleras de Acero', 'Piernas de Placas', 'Guardias de Titán'],
    boots: ['Botas de Hierro', 'Escarpes de Acero', 'Pisadas de Gigante', 'Botas del Coloso'],
    gloves: ['Guanteletes de Hierro', 'Manoplas de Acero', 'Puños de Guerra', 'Garras de Dragón'],
  },
  medium: {
    helmet: ['Capucha de Cuero', 'Máscara del Ladrón', 'Casco Tachonado', 'Velo de Sombras'],
    chest: ['Jubón de Cuero', 'Chaleco Tachonado', 'Armadura de Cazador', 'Piel de Serpiente'],
    legs: ['Pantalones de Cuero', 'Calzas Reforzadas', 'Piernas de Explorador', 'Sombras Tejidas'],
    boots: ['Botas de Cuero', 'Botas Silenciosas', 'Pisadas del Viento', 'Pasos Fantasma'],
    gloves: ['Guantes de Cuero', 'Manos Ágiles', 'Garras del Asesino', 'Toque Mortal'],
  },
  light: {
    helmet: ['Capucha de Tela', 'Diadema Arcana', 'Corona Mística', 'Tiara del Sabio'],
    chest: ['Túnica Simple', 'Túnica Encantada', 'Vestiduras Arcanas', 'Manto del Archimago'],
    legs: ['Pantalones de Tela', 'Faldón Místico', 'Piernas Encantadas', 'Envolturas Astrales'],
    boots: ['Sandalias', 'Botas de Tela', 'Pisadas Etéreas', 'Levitadores'],
    gloves: ['Guantes de Tela', 'Manos del Conjurador', 'Dedos de Fuego', 'Toque Elemental'],
  },
};

// Weapon templates by type
export const WEAPON_TEMPLATES = {
  sword: {
    common: ['Espada Oxidada', 'Espada de Hierro', 'Espada Corta'],
    uncommon: ['Espada de Acero', 'Hoja del Caballero', 'Espada Larga'],
    rare: ['Espada Rúnica', 'Hoja Brillante', 'Espada de Fuego'],
    epic: ['Espada Demoníaca', 'Colmillo de Dragón', 'Rompe-almas'],
    legendary: ['Excalibur', 'Mata-dioses', 'Filo Eterno'],
  },
  bow: {
    common: ['Arco Corto', 'Arco de Caza', 'Arco Simple'],
    uncommon: ['Arco Largo', 'Arco Compuesto', 'Arco de Guerra'],
    rare: ['Arco Élfico', 'Silbido del Viento', 'Arco de Hielo'],
    epic: ['Cazador de Estrellas', 'Muerte Silenciosa', 'Arco Solar'],
    legendary: ['Arco de Artemisa', 'Lluvia de Estrellas', 'Fin de los Días'],
  },
  staff: {
    common: ['Bastón de Madera', 'Vara de Aprendiz', 'Bastón Simple'],
    uncommon: ['Bastón de Roble', 'Vara Encantada', 'Cetro Menor'],
    rare: ['Bastón de Cristal', 'Vara de Fuego', 'Cetro de Hielo'],
    epic: ['Bastón Arcano', 'Vara del Vacío', 'Cetro de Tormentas'],
    legendary: ['Bastón del Archimago', 'Vara de los Dioses', 'Cetro Infinito'],
  },
  dagger: {
    common: ['Cuchillo', 'Daga Oxidada', 'Puñal Simple'],
    uncommon: ['Daga de Acero', 'Cuchilla Afilada', 'Puñal de Hueso'],
    rare: ['Daga de Sombras', 'Hoja Envenenada', 'Filo Silencioso'],
    epic: ['Daga del Asesino', 'Beso de la Muerte', 'Colmillo Nocturno'],
    legendary: ['Daga del Vacío', 'Último Suspiro', 'Sombra Eterna'],
  },
};