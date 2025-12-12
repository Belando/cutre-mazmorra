import { ITEM_TEMPLATES, WEAPON_TYPES, ARMOR_TYPES, RARITY_CONFIG } from '@/data/items';

// --- NUEVO: SISTEMA DE PREFIJOS (AFIJOS) ---
const PREFIXES = {
  // Armas (Ofensivos)
  sharp: { name: "Afilado/a", type: ['weapon'], stat: "attack", mult: 1.2 },
  deadly: { name: "Mortal", type: ['weapon'], stat: "critChance", add: 5 },
  heavy: { name: "Pesado/a", type: ['weapon'], stat: "attack", mult: 1.3, speed: -1 }, // Pega duro, quizás lento (futuro)
  mystic: { name: "Místico/a", type: ['weapon'], stat: "magicAttack", mult: 1.25 },
  accurate: { name: "Preciso/a", type: ['weapon'], stat: "critChance", add: 3 },

  // Armaduras/Escudos (Defensivos)
  sturdy: { name: "Robusto/a", type: ['armor', 'offhand'], stat: "defense", mult: 1.2 },
  reinforced: { name: "Reforzado/a", type: ['armor', 'offhand'], stat: "maxHp", mult: 1.2 },
  warded: { name: "Protegido/a", type: ['armor', 'offhand'], stat: "magicDefense", mult: 1.25 },
  agile: { name: "Ágil", type: ['armor', 'boots'], stat: "evasion", add: 5 },

  // Accesorios/Universal
  shining: { name: "Brillante", type: ['accessory'], stat: "magicAttack", add: 2 },
  lucky: { name: "Afortunado/a", type: ['accessory', 'ring'], stat: "critChance", add: 2 },
  vital: { name: "Vital", type: ['accessory', 'necklace'], stat: "maxHp", add: 15 },
};

// --- GENERACIÓN DE OBJETOS ---

// Determinar el nivel del objeto (escalado de 5 en 5: 1, 5, 10, 15...)
function getItemLevelTier(dungeonLevel) {
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

// Función auxiliar para aplicar un prefijo
function applyPrefix(itemData, rarity) {
  // Solo items Raros o superiores tienen prefijos
  if (!['rare', 'epic', 'legendary'].includes(rarity)) return itemData;
  
  // 40% de probabilidad en Raro, 70% en Épico, 100% en Legendario
  const chance = rarity === 'legendary' ? 1.0 : (rarity === 'epic' ? 0.7 : 0.4);
  if (Math.random() > chance) return itemData;

  // Filtrar prefijos válidos para esta categoría/slot
  const validPrefixes = Object.entries(PREFIXES).filter(([_, p]) => {
    // Si es arma, busca tipos 'weapon'
    if (itemData.category === 'weapon' && p.type.includes('weapon')) return true;
    // Si es armadura
    if (itemData.category === 'armor' && p.type.includes('armor')) return true;
    // Si es accesorio
    if (itemData.category === 'accessory' && p.type.includes('accessory')) return true;
    // Comprobación específica por slot (ej. botas)
    if (itemData.slot && p.type.includes(itemData.slot)) return true;
    
    return false;
  });

  if (validPrefixes.length === 0) return itemData;

  // Seleccionar uno aleatorio
  const [key, prefix] = validPrefixes[Math.floor(Math.random() * validPrefixes.length)];

  // Aplicar cambios
  // 1. Nombre: "Espada Afilada" (Ajuste de género básico o neutro)
  // Para simplificar en español, añadimos el adjetivo al final.
  const suffixName = prefix.name.split('/')[0]; // Tomamos la forma masculina/neutra por defecto
  itemData.name = `${itemData.name} ${suffixName}`;
  
  // 2. Stats
  if (!itemData.stats) itemData.stats = {};
  
  if (prefix.mult) {
    const currentVal = itemData.stats[prefix.stat] || 0;
    // Si la stat no existía (ej. Magic Atk en una espada física), le damos un valor base pequeño antes de multiplicar
    const base = currentVal > 0 ? currentVal : 2; 
    itemData.stats[prefix.stat] = Math.floor(base * prefix.mult);
  }
  
  if (prefix.add) {
    itemData.stats[prefix.stat] = (itemData.stats[prefix.stat] || 0) + prefix.add;
  }

  // Marcar que tiene prefijo (útil para tooltips futuros)
  itemData.prefix = key;

  return itemData;
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

  // --- CÁLCULO DE ESTADÍSTICAS BASE ---
  const levelMult = 1 + (itemLevel - 1) * 0.2;
  const finalMult = levelMult * rarityInfo.multiplier;

  const finalStats = {};
  if (template.baseStats) {
    for (const [key, val] of Object.entries(template.baseStats)) {
      finalStats[key] = Math.max(val > 0 ? 1 : 0, Math.floor(val * finalMult));
    }
  }

  // Construcción inicial del objeto
  let item = {
    id: `${templateKey}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    templateKey,
    name: `${template.name}`, // Nombre base, la rareza se indicará por color
    levelRequirement: itemLevel,
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
    value: Math.floor(10 * finalMult)
  };

  // --- APLICAR PREFIJOS ---
  item = applyPrefix(item, rarityKey);

  return item;
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
    critChance: (player.baseCrit || 5) + (player.equipCrit || 0),
    evasion: (player.baseEvasion || 0) + (player.equipEvasion || 0),
  };
}

// Funciones auxiliares de equipo
function addStatsToPlayer(player, item) {
  const p = { ...player };
  if (item.stats) {
    if (item.stats.attack) p.equipAttack = (p.equipAttack || 0) + item.stats.attack;
    if (item.stats.magicAttack) p.equipMagicAttack = (p.equipMagicAttack || 0) + item.stats.magicAttack;
    if (item.stats.defense) p.equipDefense = (p.equipDefense || 0) + item.stats.defense;
    if (item.stats.magicDefense) p.equipMagicDefense = (p.equipMagicDefense || 0) + item.stats.magicDefense;
    if (item.stats.critChance) p.equipCrit = (p.equipCrit || 0) + item.stats.critChance;
    if (item.stats.evasion) p.equipEvasion = (p.equipEvasion || 0) + item.stats.evasion;
    
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
    if (item.stats.critChance) p.equipCrit = (p.equipCrit || 0) - item.stats.critChance;
    if (item.stats.evasion) p.equipEvasion = (p.equipEvasion || 0) - item.stats.evasion;
    
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

// --- EXPORTAR FUNCIONES DE INVENTARIO ---

export function equipItem(inventory, index, equipment, player) {
  const item = inventory[index];
  if (!item || !item.slot) return { success: false, message: 'No equipable' };
  
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
  
  // Si es apilable, buscamos el MISMO tipo y rareza
  if (item.stackable) {
    const existingIndex = inventory.findIndex(i => 
        i.templateKey === item.templateKey && 
        i.rarity === item.rarity &&
        i.name === item.name // Importante por si tiene prefijos distintos
    );
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
    if (map[y]?.[x] === 1) { 
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