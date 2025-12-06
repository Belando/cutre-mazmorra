import { ITEM_TEMPLATES, WEAPON_TYPES, ARMOR_TYPES, RARITY_REQUIREMENTS, RARITY_WEIGHT} from '@/data/items';

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
  
  // Validaciones
  if (!canClassEquip(item, player.class, null)) return { success: false, message: 'Clase incorrecta' };
  const missing = getMissingRequirement(item, player);
  if (missing) return { success: false, message: `Falta ${missing.required} ${missing.attribute}` };
  
  // 1. CLONAR ESTADOS (Para no mutar los originales)
  const newInventory = [...inventory];
  const newEquipment = { ...equipment };
  let newPlayer = { ...player };
  
  const slot = item.slot;
  
  // 2. Extraer el item que queremos equipar del inventario
  // Usamos splice para sacarlo y obtenerlo
  const [itemToEquip] = newInventory.splice(index, 1);
  
  // 3. Manejar intercambio si ya hay algo equipado
  if (newEquipment[slot]) {
    const oldItem = newEquipment[slot];
    // Quitamos los stats del item viejo
    newPlayer = removeStatsFromPlayer(newPlayer, oldItem);
    // Devolvemos el item viejo al inventario
    newInventory.push(oldItem);
  }
  
  // 4. Equipar el nuevo item
  newEquipment[slot] = itemToEquip;
  
  // 5. Aplicar stats del nuevo item
  newPlayer = addStatsToPlayer(newPlayer, itemToEquip);
  
  // 6. Devolver los nuevos estados
  return { 
    success: true, 
    message: `Equipado: ${itemToEquip.name}`,
    newInventory,
    newEquipment,
    newPlayer
  };
}

export function unequipItem(equipment, slot, inventory, player, maxSlots = 20) {
  const item = equipment[slot];
  if (!item) return { success: false, message: 'Nada que desequipar' };
  if (inventory.length >= maxSlots) return { success: false, message: 'Inventario lleno' };
  
  // 1. Clonar estados
  const newEquipment = { ...equipment };
  const newInventory = [...inventory];
  let newPlayer = { ...player };
  
  // 2. Quitar stats
  newPlayer = removeStatsFromPlayer(newPlayer, item);
  
  // 3. Mover item al inventario y limpiar slot
  newInventory.push(item);
  newEquipment[slot] = null;
  
  return { 
    success: true, 
    message: `Desequipado: ${item.name}`,
    newInventory,
    newEquipment,
    newPlayer
  };
}

function addStatsToPlayer(player, item) {
  const p = { ...player };
  if (item.stats) {
    if (item.stats.attack) p.equipAttack = (p.equipAttack || 0) + item.stats.attack;
    if (item.stats.defense) p.equipDefense = (p.equipDefense || 0) + item.stats.defense;
    if (item.stats.maxHp) { 
      p.equipMaxHp = (p.equipMaxHp || 0) + item.stats.maxHp; 
      p.maxHp = (p.maxHp || 0) + item.stats.maxHp; 
      // Al equipar vida extra, curamos esa cantidad para que se note
      p.hp += item.stats.maxHp; 
    }
    if (item.stats.magicPower) p.equipMagic = (p.equipMagic || 0) + item.stats.magicPower;
  }
  return p;
}

function removeStatsFromPlayer(player, item) {
  const p = { ...player };
  if (item.stats) {
    if (item.stats.attack) p.equipAttack = (p.equipAttack || 0) - item.stats.attack;
    if (item.stats.defense) p.equipDefense = (p.equipDefense || 0) - item.stats.defense;
    if (item.stats.maxHp) { 
      p.equipMaxHp = (p.equipMaxHp || 0) - item.stats.maxHp; 
      p.maxHp = (p.maxHp || 0) - item.stats.maxHp; 
      // Si la vida actual es mayor que la nueva máxima, la recortamos
      p.hp = Math.min(p.hp, p.maxHp); 
    }
    if (item.stats.magicPower) p.equipMagic = (p.equipMagic || 0) - item.stats.magicPower;
  }
  return p;
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