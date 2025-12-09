import { canAssignToQuickSlot } from "./ItemSystem";

// Crafting and Upgrade System
export const MATERIAL_TYPES = {
  iron_ore: { name: 'Mineral de Hierro', symbol: '⛏️', color: '#71717a', rarity: 'common' },
  gold_ore: { name: 'Mineral de Oro', symbol: '◎', color: '#fbbf24', rarity: 'uncommon' },
  crystal: { name: 'Cristal Mágico', symbol: '◇', color: '#a855f7', rarity: 'rare' },
  dragon_scale: { name: 'Escama de Dragón', symbol: '◆', color: '#f59e0b', rarity: 'epic' },
  essence: { name: 'Esencia Oscura', symbol: '✧', color: '#dc2626', rarity: 'rare' },
  leather: { name: 'Cuero', symbol: '▢', color: '#92400e', rarity: 'common' },
  cloth: { name: 'Tela Encantada', symbol: '▣', color: '#6366f1', rarity: 'uncommon' },
};

export const RECIPES = {
  // Weapons
  steel_sword: {
    name: 'Espada de Acero',
    category: 'weapon',
    slot: 'weapon',
    symbol: '†',
    materials: { iron_ore: 3, leather: 1 },
    result: { attack: 6 },
    rarity: 'uncommon',
  },
  crystal_blade: {
    name: 'Hoja de Cristal',
    category: 'weapon',
    slot: 'weapon',
    symbol: '†',
    materials: { iron_ore: 2, crystal: 2 },
    result: { attack: 10 },
    rarity: 'rare',
  },
  dragon_sword: {
    name: 'Espada Dracónica',
    category: 'weapon',
    slot: 'weapon',
    symbol: '†',
    materials: { iron_ore: 3, dragon_scale: 2, crystal: 1 },
    result: { attack: 15 },
    rarity: 'epic',
  },
  
  // Armor
  reinforced_armor: {
    name: 'Armadura Reforzada',
    category: 'armor',
    slot: 'armor',
    symbol: '🛡',
    materials: { iron_ore: 4, leather: 2 },
    result: { defense: 5, maxHp: 15 },
    rarity: 'uncommon',
  },
  mystic_robe: {
    name: 'Túnica Mística',
    category: 'armor',
    slot: 'armor',
    symbol: '🛡',
    materials: { cloth: 3, crystal: 2 },
    result: { defense: 3, maxHp: 25 },
    rarity: 'rare',
  },
  dragon_armor: {
    name: 'Armadura de Dragón',
    category: 'armor',
    slot: 'armor',
    symbol: '🛡',
    materials: { iron_ore: 3, dragon_scale: 3, leather: 2 },
    result: { defense: 10, maxHp: 30 },
    rarity: 'epic',
  },
  
  // Accessories
  power_ring: {
    name: 'Anillo de Poder',
    category: 'accessory',
    slot: 'accessory',
    symbol: '◯',
    materials: { gold_ore: 2, crystal: 1 },
    result: { attack: 4, defense: 2 },
    rarity: 'rare',
  },
  life_amulet: {
    name: 'Amuleto de Vida',
    category: 'accessory',
    slot: 'accessory',
    symbol: '◈',
    materials: { gold_ore: 2, essence: 2 },
    result: { maxHp: 40, defense: 3 },
    rarity: 'rare',
  },
  
  // Potions
  greater_health: {
    name: 'Poción de Vida Mayor',
    category: 'potion',
    symbol: '♥',
    materials: { essence: 1 },
    result: { health: 50 },
    rarity: 'rare',
    stackable: true,
  },
  
  // Arrows/Projectiles for ranged combat
  fire_arrows: {
    name: 'Flechas de Fuego',
    category: 'ammo',
    symbol: '→',
    materials: { iron_ore: 1, essence: 1 },
    result: { damage: 8, quantity: 5 },
    rarity: 'uncommon',
    stackable: true,
  },
  ice_arrows: {
    name: 'Flechas de Hielo',
    category: 'ammo',
    symbol: '→',
    materials: { iron_ore: 1, crystal: 1 },
    result: { damage: 6, slow: 2, quantity: 5 },
    rarity: 'uncommon',
    stackable: true,
  },
};

// Upgrade costs by level
export const UPGRADE_COSTS = {
  1: { gold: 50, materials: { iron_ore: 2 } },
  2: { gold: 100, materials: { iron_ore: 3, gold_ore: 1 } },
  3: { gold: 200, materials: { iron_ore: 4, gold_ore: 2, crystal: 1 } },
  4: { gold: 400, materials: { gold_ore: 3, crystal: 2, essence: 1 } },
  5: { gold: 800, materials: { crystal: 3, essence: 2, dragon_scale: 1 } },
};

// --- Helper para crear items de material ---
export function getMaterialItem(type, count = 1) {
  const mat = MATERIAL_TYPES[type];
  if (!mat) return null;
  
  return {
    id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    templateKey: type,
    name: mat.name,
    category: 'material',
    quantity: count,
    rarity: mat.rarity,
    symbol: mat.symbol,
    description: `Material de artesanía.`,
    stackable: true,
  };
}

// MODIFICADO: Agregada protección contra inventory null/undefined/object
export function canCraft(recipe, inventory) {
  // 1. Protección de seguridad
  if (!inventory || !Array.isArray(inventory)) {
    return false; // Si no hay inventario válido, no se puede craftear
  }

  for (const [matKey, count] of Object.entries(recipe.materials)) {
    // Buscamos items con templateKey igual al material
    const item = inventory.find(i => i.templateKey === matKey);
    const available = item ? item.quantity : 0;
    if (available < count) return false;
  }
  return true;
}

export function craftItem(recipeKey, inventory) {
  // 1. Protección de seguridad
  if (!inventory || !Array.isArray(inventory)) {
    return { success: false, message: 'Error: Inventario no cargado' };
  }

  const recipe = RECIPES[recipeKey];
  if (!recipe) return { success: false, message: 'Receta no encontrada' };
  
  if (!canCraft(recipe, inventory)) {
    return { success: false, message: 'Materiales insuficientes' };
  }
  
  // Consumir materiales
  for (const [matKey, count] of Object.entries(recipe.materials)) {
    const itemIndex = inventory.findIndex(i => i.templateKey === matKey);
    if (itemIndex !== -1) {
      inventory[itemIndex].quantity -= count;
      if (inventory[itemIndex].quantity <= 0) {
        inventory.splice(itemIndex, 1);
      }
    }
  }
  
  // Crear item resultante
  const item = {
    id: `${recipeKey}_${Date.now()}`,
    templateKey: recipeKey,
    name: recipe.name,
    category: recipe.category,
    symbol: recipe.symbol,
    rarity: recipe.rarity,
    stackable: recipe.stackable || false,
    quantity: recipe.result.quantity || 1,
    stats: { ...recipe.result }, // Copia segura de stats
    upgradeLevel: 0,
  };
  
  if (recipe.slot) item.slot = recipe.slot;
  
  // Añadir al inventario
  inventory.push(item);
  
  return { success: true, message: `¡Creaste ${recipe.name}!`, item };
}

// MODIFICADO: Upgrade consume del inventario
export function upgradeItem(item, inventory, gold) {
  if (!item) return { success: false, message: 'No hay item' };
  if (item.category === 'potion' || item.category === 'ammo' || item.category === 'material') {
    return { success: false, message: 'No se puede mejorar este item' };
  }
  
  const currentLevel = item.upgradeLevel || 0;
  if (currentLevel >= 5) {
    return { success: false, message: 'Nivel máximo alcanzado' };
  }
  
  const cost = UPGRADE_COSTS[currentLevel + 1];
  if (!cost) return { success: false, message: 'Error de mejora' };
  
  // Check gold
  if (gold < cost.gold) {
    return { success: false, message: `Necesitas ${cost.gold} oro` };
  }
  
  // Check materials (en inventario)
  for (const [matKey, count] of Object.entries(cost.materials)) {
    const matItem = inventory.find(i => i.templateKey === matKey);
    const available = matItem ? matItem.quantity : 0;
    
    if (available < count) {
      const matName = MATERIAL_TYPES[matKey]?.name || matKey;
      return { success: false, message: `Necesitas ${count} ${matName}` };
    }
  }
  
  // Consume resources
  for (const [matKey, count] of Object.entries(cost.materials)) {
    const itemIndex = inventory.findIndex(i => i.templateKey === matKey);
    if (itemIndex !== -1) {
      inventory[itemIndex].quantity -= count;
      if (inventory[itemIndex].quantity <= 0) {
        inventory.splice(itemIndex, 1);
      }
    }
  }
  
  // Upgrade item
  item.upgradeLevel = currentLevel + 1;
  // Añadir sufijo solo si no lo tiene
  if (!item.name.includes('+')) {
      item.name = `${item.name} +${item.upgradeLevel}`;
  } else {
      item.name = item.name.replace(/\+\d+$/, `+${item.upgradeLevel}`);
  }
  
  // Increase stats by 15% per level
  if (item.stats) {
    for (const stat of Object.keys(item.stats)) {
      if (typeof item.stats[stat] === 'number' && stat !== 'quantity') {
        item.stats[stat] = Math.floor(item.stats[stat] * 1.15);
      }
    }
  }
  
  return { 
    success: true, 
    message: `¡${item.name} mejorado!`,
    goldCost: cost.gold,
  };
}

// MODIFICADO: Genera items reales
export function generateMaterialDrop(enemyType, dungeonLevel) {
  const drops = [];
  const dropChance = 0.3 + (dungeonLevel * 0.05);
  
  if (Math.random() > dropChance) return drops;
  
  if (Math.random() < 0.5) drops.push(getMaterialItem('iron_ore', 1 + Math.floor(Math.random() * 2)));
  if (Math.random() < 0.3) drops.push(getMaterialItem('leather', 1));
  
  if (dungeonLevel >= 2 && Math.random() < 0.25) drops.push(getMaterialItem('gold_ore', 1));
  if (dungeonLevel >= 3 && Math.random() < 0.2) drops.push(getMaterialItem('cloth', 1));
  
  if (dungeonLevel >= 4 && Math.random() < 0.15) drops.push(getMaterialItem('crystal', 1));
  if (dungeonLevel >= 5 && Math.random() < 0.1) drops.push(getMaterialItem('essence', 1));
  
  if (dungeonLevel >= 6 && Math.random() < 0.08) drops.push(getMaterialItem('dragon_scale', 1));
  
  return drops;
}

// MODIFICADO: Genera items reales
export function generateBossDrop(bossType, dungeonLevel) {
  const drops = [
    getMaterialItem('gold_ore', 2 + Math.floor(dungeonLevel / 2))
  ];
  
  if (dungeonLevel >= 3) drops.push(getMaterialItem('crystal', 1 + Math.floor(dungeonLevel / 3)));
  if (dungeonLevel >= 5) drops.push(getMaterialItem('essence', 1));
  if (dungeonLevel >= 6) drops.push(getMaterialItem('dragon_scale', 1 + Math.floor((dungeonLevel - 5) / 2)));
  
  return drops.filter(d => d !== null);
}