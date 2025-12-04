import { Sword, Shield, CircleDot, Heart, Book, Ghost, Footprints } from 'lucide-react';

// Equipment slot definitions (extended)
export const EQUIPMENT_SLOTS = {
  weapon: { icon: Sword, name: 'Arma Principal' },
  offhand: { icon: Shield, name: 'Mano Izq.' },
  helmet: { icon: Ghost, name: 'Yelmo' },
  chest: { icon: Shield, name: 'Armadura' },
  legs: { icon: '∏', name: 'Pantalones' },
  boots: { icon: Footprints, name: 'Botas' },
  gloves: { icon: '✋', name: 'Guantes' },
  ring: { icon: CircleDot, name: 'Anillo' },
  earring: { icon: CircleDot, name: 'Pendiente' },
  necklace: { icon: CircleDot, name: 'Amuleto' },
};

export const SLOT_ICONS = {
  weapon: '⚔️', offhand: '🛡️', helmet: '⛑️', chest: '🎽',
  legs: '👖', boots: '👢', gloves: '🧤', ring: '💍',
  earring: '✨', necklace: '📿',
};

export const ITEM_ICONS = {
  // ... (iconos existentes)
  shield: '🛡️', tome: '📖', quiver: '🏹',
};

// ... (Mantener RARITY_REQUIREMENTS, getItemRequiredAttribute, meetsAttributeRequirements, getMissingRequirement sin cambios) ...
export const RARITY_REQUIREMENTS = {
  common: { strength: 0, dexterity: 0, intelligence: 0 },
  uncommon: { strength: 5, dexterity: 5, intelligence: 5 },
  rare: { strength: 12, dexterity: 12, intelligence: 12 },
  epic: { strength: 20, dexterity: 20, intelligence: 20 },
  legendary: { strength: 30, dexterity: 30, intelligence: 30 },
};

export function getItemRequiredAttribute(item) {
  if (!item) return null;
  if (item.weaponType) {
    if (['sword', 'axe', 'mace', 'shield'].includes(item.weaponType)) return 'strength';
    if (['dagger', 'bow', 'crossbow', 'quiver'].includes(item.weaponType)) return 'dexterity';
    if (['staff', 'wand', 'tome'].includes(item.weaponType)) return 'intelligence';
  }
  if (item.armorType) {
    if (item.armorType === 'heavy') return 'strength';
    if (item.armorType === 'medium') return 'dexterity';
    if (item.armorType === 'light') return 'intelligence';
  }
  return null;
}

export function meetsAttributeRequirements(item, player) {
  if (!item || !item.rarity) return true;
  const requirements = RARITY_REQUIREMENTS[item.rarity] || RARITY_REQUIREMENTS.common;
  const requiredAttr = getItemRequiredAttribute(item);
  if (!requiredAttr) return true;
  const playerAttr = player[requiredAttr] || 0;
  return playerAttr >= requirements[requiredAttr];
}

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
// ...

const RARITY_WEIGHTS = { common: 50, uncommon: 30, rare: 15, epic: 4, legendary: 1 };

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

export function canClassEquip(item, playerClass, player = null) {
  if (!item) return false;
  if (item.weaponType && WEAPON_TYPES[item.weaponType]) {
    if (!WEAPON_TYPES[item.weaponType].classes.includes(playerClass)) return false;
  }
  if (item.armorType && ARMOR_TYPES[item.armorType]) {
    if (!ARMOR_TYPES[item.armorType].classes.includes(playerClass)) return false;
  }
  if (player && !meetsAttributeRequirements(item, player)) return false;
  return true;
}

// --- PLANTILLAS DE OBJETOS EXPANDIDAS ---
const ITEM_TEMPLATES = {
  // --- CONSUMIBLES (Sin cambios) ---
  health_potion: { name: 'Poción de Vida', category: 'potion', symbol: '♥', description: 'Restaura vida.', stackable: true, baseStats: { health: 25 } },
  mana_potion: { name: 'Poción de Maná', category: 'potion', symbol: '◆', description: 'Restaura maná.', stackable: true, baseStats: { mana: 20 } },
  strength_elixir: { name: 'Elixir de Fuerza', category: 'potion', symbol: '↑', description: '+Ataque permanente.', stackable: true, baseStats: { attackBoost: 1 }, rarityMultipliers: { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 6 } },
  bread: { name: 'Pan', category: 'food', symbol: '●', description: 'Comida básica.', stackable: true, baseStats: { health: 10 } },
  gold: { name: 'Oro', category: 'currency', symbol: '●', description: 'Monedas.', stackable: true, baseValue: 10, rarityMultipliers: { common: 1, uncommon: 2, rare: 5, epic: 10, legendary: 25 } },

  // --- ARMAS PRINCIPALES ---
  sword: { name: 'Espada', category: 'weapon', slot: 'weapon', weaponType: 'sword', symbol: '†', baseStats: { attack: 5 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 } },
  axe: { name: 'Hacha', category: 'weapon', slot: 'weapon', weaponType: 'axe', symbol: '⚒', baseStats: { attack: 6 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 } },
  dagger: { name: 'Daga', category: 'weapon', slot: 'weapon', weaponType: 'dagger', symbol: '⚔', baseStats: { attack: 3, critChance: 10 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 } },
  bow: { name: 'Arco', category: 'weapon', slot: 'weapon', weaponType: 'bow', symbol: '⌒', baseStats: { attack: 4, range: 6 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 } },
  staff: { name: 'Bastón', category: 'weapon', slot: 'weapon', weaponType: 'staff', symbol: '⚚', baseStats: { attack: 3, magicPower: 6 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 } },
  
  // --- MANO SECUNDARIA (NUEVO) ---
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
    name: 'Carcaj', category: 'weapon', slot: 'offhand', weaponType: 'quiver', symbol: '🏹',
    baseStats: { attack: 2, critChance: 5 },
    rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 },
    nameVariants: { common: ['Carcaj de Cuero'], uncommon: ['Carcaj de Caza'], rare: ['Carcaj Élfico'], epic: ['Carcaj Infinito'], legendary: ['Carcaj Solar'] }
  },

  // --- ARMADURAS ESPECÍFICAS POR CLASE ---
  
  // GUERRERO (Pesada)
  heavy_helmet: { name: 'Yelmo', category: 'armor', slot: 'helmet', armorType: 'heavy', symbol: '⛑', baseStats: { defense: 3 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  heavy_chest: { name: 'Coraza', category: 'armor', slot: 'chest', armorType: 'heavy', symbol: '⛨', baseStats: { defense: 6, maxHp: 10 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  heavy_legs: { name: 'Grebas', category: 'armor', slot: 'legs', armorType: 'heavy', symbol: '∏', baseStats: { defense: 4 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  heavy_boots: { name: 'Botas de Placas', category: 'armor', slot: 'boots', armorType: 'heavy', symbol: '👢', baseStats: { defense: 3 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  heavy_gloves: { name: 'Guanteletes', category: 'armor', slot: 'gloves', armorType: 'heavy', symbol: '🧤', baseStats: { defense: 2, attack: 1 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },

  // PÍCARO (Media/Cuero)
  leather_helmet: { name: 'Capucha', category: 'armor', slot: 'helmet', armorType: 'medium', symbol: '⛑', baseStats: { defense: 2, evasion: 2 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  leather_chest: { name: 'Jubón', category: 'armor', slot: 'chest', armorType: 'medium', symbol: '◊', baseStats: { defense: 4, evasion: 3 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  leather_legs: { name: 'Pantalones', category: 'armor', slot: 'legs', armorType: 'medium', symbol: '∏', baseStats: { defense: 3, evasion: 2 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  leather_boots: { name: 'Botas de Cuero', category: 'armor', slot: 'boots', armorType: 'medium', symbol: '👢', baseStats: { defense: 2, evasion: 3 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  leather_gloves: { name: 'Guantes de Cuero', category: 'armor', slot: 'gloves', armorType: 'medium', symbol: '🧤', baseStats: { defense: 1, critChance: 2 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },

  // MAGO (Ligera/Tela)
  light_helmet: { name: 'Sombrero', category: 'armor', slot: 'helmet', armorType: 'light', symbol: '⛑', baseStats: { defense: 1, magicPower: 3 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  light_chest: { name: 'Túnica', category: 'armor', slot: 'chest', armorType: 'light', symbol: '∴', baseStats: { defense: 2, magicPower: 6, maxMp: 10 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  light_legs: { name: 'Faldas', category: 'armor', slot: 'legs', armorType: 'light', symbol: '∏', baseStats: { defense: 1, magicPower: 4 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  light_boots: { name: 'Zapatos', category: 'armor', slot: 'boots', armorType: 'light', symbol: '👢', baseStats: { defense: 1, magicPower: 2 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  light_gloves: { name: 'Vendas', category: 'armor', slot: 'gloves', armorType: 'light', symbol: '🧤', baseStats: { defense: 1, magicPower: 2 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },

  // ACCESORIOS (Universal)
  ring: { name: 'Anillo', category: 'accessory', slot: 'ring', symbol: '○', baseStats: { attack: 1 }, rarityMultipliers: { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 } },
  necklace: { name: 'Collar', category: 'accessory', slot: 'necklace', symbol: '◎', baseStats: { maxHp: 10 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 4 } },
  earring: { name: 'Pendiente', category: 'accessory', slot: 'earring', symbol: '◇', baseStats: { evasion: 2 }, rarityMultipliers: { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 } },
};

export function generateRarity(dungeonLevel) {
  const adjustedWeights = { ...RARITY_WEIGHTS };
  if (dungeonLevel >= 3) { adjustedWeights.uncommon += 10; adjustedWeights.rare += 5; }
  if (dungeonLevel >= 5) { adjustedWeights.rare += 10; adjustedWeights.epic += 3; }
  if (dungeonLevel >= 7) { adjustedWeights.epic += 5; adjustedWeights.legendary += 1; }
  const totalWeight = Object.values(adjustedWeights).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (const [rarity, weight] of Object.entries(adjustedWeights)) {
    random -= weight;
    if (random <= 0) return rarity;
  }
  return 'common';
}

export function generateItem(dungeonLevel, forceType = null) {
  const rarity = generateRarity(dungeonLevel);
  
  let itemTypes;
  if (forceType) {
    itemTypes = [forceType];
  } else {
    // Lista base de objetos
    itemTypes = [
      'health_potion', 'mana_potion', 'bread', 'gold', 'gold',
      'sword', 'dagger', 'staff',
      'leather_chest', 'heavy_chest', 'light_chest',
      'leather_boots', 'heavy_boots', 'light_boots',
    ];
    
    // Niveles superiores añaden variedad
    if (dungeonLevel >= 2) {
        itemTypes.push('axe', 'bow', 'wand', 'ring', 'shield', 'heavy_helmet', 'leather_helmet');
    }
    if (dungeonLevel >= 4) {
        itemTypes.push('necklace', 'earring', 'tome', 'quiver', 'heavy_gloves', 'leather_gloves', 'light_gloves');
        itemTypes.push('heavy_legs', 'leather_legs', 'light_legs');
    }
    if (dungeonLevel >= 6) {
        itemTypes.push('strength_elixir', 'mana_elixir', 'defense_elixir');
    }
  }
  
  const templateKey = itemTypes[Math.floor(Math.random() * itemTypes.length)];
  const template = ITEM_TEMPLATES[templateKey];
  
  if (!template) return null;
  
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
  
  if (template.nameVariants && template.nameVariants[rarity]) {
      // Variantes específicas por rareza si existen
      const variants = template.nameVariants[rarity];
      item.name = variants[Math.floor(Math.random() * variants.length)];
  } else {
      // Nombre genérico con prefijo
      const rarityPrefix = rarity === 'common' ? '' : rarity.charAt(0).toUpperCase() + rarity.slice(1) + ' ';
      item.name = rarityPrefix + template.name;
  }
  
  if (template.slot) item.slot = template.slot;
  if (template.weaponType) item.weaponType = template.weaponType;
  if (template.armorType) item.armorType = template.armorType;
  
  if (template.baseStats) {
    const multiplier = template.rarityMultipliers?.[rarity] || 1;
    item.stats = {};
    for (const [stat, value] of Object.entries(template.baseStats)) {
      item.stats[stat] = typeof value === 'number' ? Math.floor(value * multiplier) : value;
    }
  }
  
  if (template.category === 'currency') {
    const multiplier = template.rarityMultipliers?.[rarity] || 1;
    item.value = Math.floor(template.baseValue * multiplier * (0.8 + Math.random() * 0.4));
  }
  
  return item;
}

// ... (Mantener generateLevelItems, addToInventory, useItem, equipItem, unequipItem, calculatePlayerStats, canAssignToQuickSlot sin cambios) ...
export function generateLevelItems(dungeonLevel, rooms, map, excludeRoomIndices = []) {
  const items = [];
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
    if (map[y]?.[x] === 1) {
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

export function addToInventory(inventory, item, maxSlots = 20) {
  if (!item) return { success: false, reason: 'Item inválido' };
  if (item.stackable) {
    const existingIndex = inventory.findIndex(i => i.templateKey === item.templateKey && i.rarity === item.rarity);
    if (existingIndex !== -1) {
      inventory[existingIndex].quantity += item.quantity || 1;
      return { success: true, stacked: true };
    }
  }
  if (inventory.length >= maxSlots) return { success: false, reason: 'Inventario lleno!' };
  inventory.push({ ...item });
  return { success: true, stacked: false };
}

export function useItem(inventory, index, player) {
  const item = inventory[index];
  if (!item) return { success: false, message: 'Item no encontrado' };
  if (!['potion', 'scroll', 'food'].includes(item.category)) return { success: false, message: 'No se puede usar' };
  
  const result = { success: true, effects: [] };
  if (item.stats) {
    if (item.stats.health) {
      const healed = Math.min(item.stats.health, player.maxHp - player.hp);
      player.hp += healed;
      result.effects.push(`+${healed} Vida`);
    }
    if (item.stats.mana) {
      const restored = Math.min(item.stats.mana, (player.maxMp || 30) - (player.mp || 0));
      player.mp = (player.mp || 0) + restored;
      result.effects.push(`+${restored} Maná`);
    }
    if (item.stats.attackBoost) {
        player.baseAttack = (player.baseAttack || 8) + item.stats.attackBoost;
        result.effects.push(`+${item.stats.attackBoost} ATK Perm.`);
    }
  }
  if (item.quantity > 1) inventory[index].quantity--;
  else inventory.splice(index, 1);
  return result;
}

export function equipItem(inventory, index, equipment, player) {
  const item = inventory[index];
  if (!item || !item.slot) return { success: false, message: 'No equipable' };
  if (!canClassEquip(item, player.class, null)) return { success: false, message: 'Clase incorrecta' };
  const missing = getMissingRequirement(item, player);
  if (missing) return { success: false, message: `Falta ${missing.required} ${missing.attribute}` };
  
  const slot = item.slot;
  if (equipment[slot]) unequipItem(equipment, slot, inventory, player);
  inventory.splice(index, 1);
  equipment[slot] = item;
  if (item.stats) {
    if (item.stats.attack) player.equipAttack = (player.equipAttack || 0) + item.stats.attack;
    if (item.stats.defense) player.equipDefense = (player.equipDefense || 0) + item.stats.defense;
    if (item.stats.maxHp) { player.equipMaxHp = (player.equipMaxHp || 0) + item.stats.maxHp; player.maxHp += item.stats.maxHp; }
    if (item.stats.magicPower) player.equipMagic = (player.equipMagic || 0) + item.stats.magicPower;
  }
  return { success: true, message: `Equipado: ${item.name}` };
}

export function unequipItem(equipment, slot, inventory, player, maxSlots = 20) {
  const item = equipment[slot];
  if (!item) return { success: false, message: 'Nada que desequipar' };
  if (inventory.length >= maxSlots) return { success: false, message: 'Inventario lleno' };
  
  if (item.stats) {
    if (item.stats.attack) player.equipAttack = (player.equipAttack || 0) - item.stats.attack;
    if (item.stats.defense) player.equipDefense = (player.equipDefense || 0) - item.stats.defense;
    if (item.stats.maxHp) { player.equipMaxHp = (player.equipMaxHp || 0) - item.stats.maxHp; player.maxHp -= item.stats.maxHp; player.hp = Math.min(player.hp, player.maxHp); }
    if (item.stats.magicPower) player.equipMagic = (player.equipMagic || 0) - item.stats.magicPower;
  }
  inventory.push(item);
  equipment[slot] = null;
  return { success: true, message: `Desequipado: ${item.name}` };
}

export function calculatePlayerStats(player) {
  return {
    attack: (player.baseAttack || 8) + (player.equipAttack || 0),
    defense: (player.baseDefense || 3) + (player.equipDefense || 0),
    maxHp: player.maxHp,
  };
}

export function canAssignToQuickSlot(item) {
  return item && ['potion', 'scroll', 'food'].includes(item.category);
}