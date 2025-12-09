import { ITEM_TEMPLATES, WEAPON_TYPES, ARMOR_TYPES, RARITY_CONFIG } from '@/data/items';

// --- GENERACIÓN DE OBJETOS ---

// Determinar el nivel del objeto (escalado de 5 en 5: 1, 5, 10, 15...)
function getItemLevelTier(dungeonLevel) {
  // Si estamos en nivel 1-4 -> Item Nivel 1
  // Nivel 5-9 -> Item Nivel 5
  // etc.
  return Math.max(1, Math.floor(dungeonLevel / 5) * 5);
}

function generateRarity() {
  const totalWeight = Object.values(RARITY_CONFIG).reduce((sum, r) => sum + r.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const [key, config] of Object.entries(RARITY_CONFIG)) {
    random -= config.weight;
    if (random <= 0) return key;
  }
  return 'common';
}

export function generateItem(dungeonLevel, forceType = null) {
  const rarityKey = generateRarity();
  const rarityInfo = RARITY_CONFIG[rarityKey];
  const itemLevel = getItemLevelTier(dungeonLevel);
  
  // Selección de plantilla
  let templateKey = forceType;
  if (!templateKey) {
    const keys = Object.keys(ITEM_TEMPLATES);
    templateKey = keys[Math.floor(Math.random() * keys.length)];
  }
  const template = ITEM_TEMPLATES[templateKey];
  if (!template) return null;

  // --- CÁLCULO DE ESTADÍSTICAS ---
  // Fórmula: Base * Multiplicador de Nivel * Multiplicador de Rareza
  // Multiplicador Nivel: 1 + (Nivel - 1) * 0.2 (20% mejora por nivel de item)
  const levelMult = 1 + (itemLevel - 1) * 0.2;
  const finalMult = levelMult * rarityInfo.multiplier;

  const finalStats = {};
  if (template.baseStats) {
    for (const [key, val] of Object.entries(template.baseStats)) {
      // Redondeamos hacia abajo, mínimo 1 si el base era > 0
      finalStats[key] = Math.max(val > 0 ? 1 : 0, Math.floor(val * finalMult));
    }
  }

  // --- CONSTRUCCIÓN DEL OBJETO ---
  return {
    id: `${templateKey}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    templateKey,
    name: `${template.name} ${rarityInfo.name !== 'Común' ? rarityInfo.name : ''}`, // Ej: Espada Rara
    levelRequirement: itemLevel, // REQUISITO DE NIVEL
    rarity: rarityKey,
    category: template.category,
    symbol: template.symbol,
    description: template.description || `Nivel ${itemLevel} - ${rarityInfo.name}`,
    stats: finalStats,
    slot: template.slot,
    weaponType: template.weaponType,
    armorType: template.armorType,
    stackable: template.stackable || false,
    quantity: 1,
    value: Math.floor(10 * finalMult) // Precio de venta
  };
}

// --- GESTIÓN DE INVENTARIO Y EQUIPO ---

// Comprobar restricciones de CLASE y NIVEL
export function canClassEquip(item, playerClass, playerLevel) {
  if (!item) return false;
  
  // 1. Restricción de Nivel
  if (item.levelRequirement && playerLevel < item.levelRequirement) return false;

  // 2. Restricción de Clase (Armas)
  if (item.weaponType) {
    const typeInfo = WEAPON_TYPES[item.weaponType];
    if (typeInfo && !typeInfo.classes.includes(playerClass)) return false;
  }

  // 3. Restricción de Clase (Armaduras)
  if (item.armorType) {
    const typeInfo = ARMOR_TYPES[item.armorType];
    if (typeInfo && !typeInfo.classes.includes(playerClass)) return false;
  }

  return true;
}

// Cálculo de Stats Totales (Base + Equipo)
export function calculatePlayerStats(player) {
  return {
    attack: (player.baseAttack || 0) + (player.equipAttack || 0),
    magicAttack: (player.baseMagicAttack || 0) + (player.equipMagicAttack || 0),
    defense: (player.baseDefense || 0) + (player.equipDefense || 0),
    magicDefense: (player.baseMagicDefense || 0) + (player.equipMagicDefense || 0),
    maxHp: player.maxHp,
    maxMp: player.maxMp,
  };
}

// Funciones auxiliares de equipo (modificadas para los nuevos stats)
function addStatsToPlayer(player, item) {
  const p = { ...player };
  if (item.stats) {
    if (item.stats.attack) p.equipAttack = (p.equipAttack || 0) + item.stats.attack;
    if (item.stats.magicAttack) p.equipMagicAttack = (p.equipMagicAttack || 0) + item.stats.magicAttack;
    if (item.stats.defense) p.equipDefense = (p.equipDefense || 0) + item.stats.defense;
    if (item.stats.magicDefense) p.equipMagicDefense = (p.equipMagicDefense || 0) + item.stats.magicDefense;
    
    if (item.stats.maxHp) { 
      p.equipMaxHp = (p.equipMaxHp || 0) + item.stats.maxHp; 
      p.maxHp = (p.maxHp || 0) + item.stats.maxHp; 
      p.hp += item.stats.maxHp; 
    }
    if (item.stats.maxMp) {
      p.equipMaxMp = (p.equipMaxMp || 0) + item.stats.maxMp;
      p.maxMp = (p.maxMp || 0) + item.stats.maxMp;
    }
  }
  return p;
}

function removeStatsFromPlayer(player, item) {
  const p = { ...player };
  if (item.stats) {
    if (item.stats.attack) p.equipAttack = (p.equipAttack || 0) - item.stats.attack;
    if (item.stats.magicAttack) p.equipMagicAttack = (p.equipMagicAttack || 0) - item.stats.magicAttack;
    if (item.stats.defense) p.equipDefense = (p.equipDefense || 0) - item.stats.defense;
    if (item.stats.magicDefense) p.equipMagicDefense = (p.equipMagicDefense || 0) - item.stats.magicDefense;
    
    if (item.stats.maxHp) { 
      p.equipMaxHp = (p.equipMaxHp || 0) - item.stats.maxHp; 
      p.maxHp = (p.maxHp || 0) - item.stats.maxHp; 
      p.hp = Math.min(p.hp, p.maxHp); 
    }
    if (item.stats.maxMp) {
      p.equipMaxMp = (p.equipMaxMp || 0) - item.stats.maxMp;
      p.maxMp = (p.maxMp || 0) - item.stats.maxMp;
      p.mp = Math.min(p.mp || 0, p.maxMp);
    }
  }
  return p;
}

// --- RE-EXPORTAR FUNCIONES DE INVENTARIO (Necesarias para otros ficheros) ---
export function equipItem(inventory, index, equipment, player) {
  const item = inventory[index];
  if (!item || !item.slot) return { success: false, message: 'No equipable' };
  
  // Validar usando player.level
  if (!canClassEquip(item, player.class, player.level)) {
      if (item.levelRequirement && player.level < item.levelRequirement) {
          return { success: false, message: `Requiere Nivel ${item.levelRequirement}` };
      }
      return { success: false, message: 'Clase incorrecta' };
  }
  
  const newInventory = [...inventory];
  const newEquipment = { ...equipment };
  let newPlayer = { ...player };
  const slot = item.slot;
  const [itemToEquip] = newInventory.splice(index, 1);
  
  if (newEquipment[slot]) {
    const oldItem = newEquipment[slot];
    newPlayer = removeStatsFromPlayer(newPlayer, oldItem);
    newInventory.push(oldItem);
  }
  newEquipment[slot] = itemToEquip;
  newPlayer = addStatsToPlayer(newPlayer, itemToEquip);
  
  return { success: true, message: `Equipado: ${itemToEquip.name}`, newInventory, newEquipment, newPlayer };
}

export function unequipItem(equipment, slot, inventory, player, maxSlots = 64) {
  const item = equipment[slot];
  if (!item) return { success: false, message: 'Nada' };
  if (inventory.length >= maxSlots) return { success: false, message: 'Lleno' };
  
  const newEquipment = { ...equipment };
  const newInventory = [...inventory];
  let newPlayer = { ...player };
  
  newPlayer = removeStatsFromPlayer(newPlayer, item);
  newInventory.push(item);
  newEquipment[slot] = null;
  
  return { success: true, message: `Desequipado`, newInventory, newEquipment, newPlayer };
}

export function addToInventory(inventory, item, maxSlots = 64) {
  if (!item) return { success: false, reason: 'Error' };
  if (item.stackable) {
    const existingIndex = inventory.findIndex(i => i.templateKey === item.templateKey && i.rarity === item.rarity);
    if (existingIndex !== -1) {
      inventory[existingIndex].quantity = (inventory[existingIndex].quantity || 1) + (item.quantity || 1);
      return { success: true, stacked: true };
    }
  }
  if (inventory.length >= maxSlots) return { success: false, reason: 'Lleno' };
  inventory.push({ ...item });
  return { success: true, stacked: false };
}

export function useItem(inventory, index, player) {
    const item = inventory[index];
    if (!item) return { success: false, message: 'Error' };
    
    // Lógica básica de pociones
    const result = { success: true, effects: [] };
    if (item.category === 'potion') {
        if (item.stats?.health) {
            const heal = Math.min(item.stats.health, player.maxHp - player.hp);
            player.hp += heal;
            result.effects.push(`+${heal} HP`);
        }
        if (item.stats?.mana) {
            const mana = Math.min(item.stats.mana, player.maxMp - player.mp);
            player.mp += mana;
            result.effects.push(`+${mana} MP`);
        }
    }
    
    if (item.quantity > 1) inventory[index].quantity--;
    else inventory.splice(index, 1);
    
    return result;
}

export function canAssignToQuickSlot(item) {
    return item && ['potion', 'food'].includes(item.category);
}

// Re-exportamos generateLevelItems para DungeonGenerator
export function generateLevelItems(dungeonLevel, rooms, map, excludeRoomIndices = []) {
  const items = [];
  const itemCount = 2 + Math.floor(Math.random() * 3);
  let placed = 0;
  let attempts = 0;
  while (placed < itemCount && attempts < 50) {
    attempts++;
    const room = rooms[Math.floor(Math.random() * rooms.length)];
    const x = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
    const y = room.y + 1 + Math.floor(Math.random() * (room.height - 2));
    if (map[y]?.[x] === 1) { // Suelo
        const item = generateItem(dungeonLevel);
        if (item) {
            item.x = x; item.y = y;
            items.push(item);
            placed++;
        }
    }
  }
  return items;
}