// NPC System - Merchants and Quest Givers

export const NPC_TYPES = {
  MERCHANT: 'merchant',
  QUEST_GIVER: 'quest_giver',
  SAGE: 'sage',
};

export const NPCS = {
  merchant: {
    name: 'Buhonero Errante',
    type: NPC_TYPES.MERCHANT,
    symbol: '$',
    color: '#fbbf24',
    dialogue: {
      greeting: '¡Bienvenido, aventurero! Tengo mercancía especial...',
      noGold: 'No tienes suficiente oro para eso.',
      thanks: '¡Gracias por tu compra! Vuelve pronto.',
      farewell: '¡Buena suerte en tu aventura!',
    },
    inventory: [
      { id: 'health_potion', name: 'Poción de Vida', price: 25, stats: { health: 30 }, category: 'potion', symbol: '♥', rarity: 'uncommon' },
      { id: 'strength_elixir', name: 'Elixir de Fuerza', price: 50, stats: { attackBoost: 2 }, category: 'potion', symbol: '⚡', rarity: 'rare' },
      { id: 'iron_sword', name: 'Espada de Hierro', price: 80, stats: { attack: 5 }, category: 'weapon', slot: 'weapon', symbol: '†', rarity: 'uncommon' },
      { id: 'chain_mail', name: 'Cota de Malla', price: 100, stats: { defense: 4, maxHp: 10 }, category: 'armor', slot: 'armor', symbol: '🛡', rarity: 'uncommon' },
      { id: 'lucky_ring', name: 'Anillo de la Suerte', price: 150, stats: { attack: 2, defense: 2 }, category: 'armor', slot: 'accessory', symbol: '◯', rarity: 'rare' },
    ],
  },
  quest_elder: {
    name: 'Anciano Sabio',
    type: NPC_TYPES.QUEST_GIVER,
    symbol: '?',
    color: '#60a5fa',
    dialogue: {
      greeting: 'Ah, un alma valiente... Tengo una tarea para ti.',
      questActive: 'Aún no has completado mi encargo.',
      questComplete: '¡Excelente! Has demostrado tu valía.',
      farewell: 'Que la luz guíe tu camino.',
    },
  },
  sage: {
    name: 'Ermitaño Místico',
    type: NPC_TYPES.SAGE,
    symbol: '✦',
    color: '#a855f7',
    dialogue: {
      greeting: 'Las sombras hablan de un mal antiguo en las profundidades...',
      lore: 'El Dragón Ancestral fue sellado hace eones. Pero el sello se debilita...',
      farewell: 'Recuerda: la oscuridad teme a quienes no la temen.',
    },
  },
};

// Quest definitions with better tracking
export const QUESTS = {
  // Main story quests
  main_1: {
    id: 'main_1',
    name: 'El Despertar',
    type: 'main',
    description: 'Desciende al piso 3 y derrota al Señor de la Guerra Orco.',
    target: 'BOSS_ORC_WARLORD',
    targetType: 'boss',
    floor: 3,
    reward: { gold: 150, exp: 100 },
    nextQuest: 'main_2',
  },
  main_2: {
    id: 'main_2',
    name: 'El Sello Debilitado',
    type: 'main',
    description: 'Derrota al Liche en el piso 5 para obtener el Fragmento del Sello.',
    target: 'BOSS_LICH',
    targetType: 'boss',
    floor: 5,
    reward: { gold: 250, exp: 180, item: { name: 'Fragmento del Sello', symbol: '✧', rarity: 'legendary' } },
    nextQuest: 'main_3',
    requires: 'main_1',
  },
  main_3: {
    id: 'main_3',
    name: 'La Batalla Final',
    type: 'main',
    description: 'Enfrenta al Dragón Ancestral en las profundidades.',
    target: 'BOSS_ANCIENT_DRAGON',
    targetType: 'boss',
    floor: 7,
    reward: { gold: 500, exp: 350 },
    requires: 'main_2',
  },
  
  // Side quests - Kill type
  kill_rats: {
    id: 'kill_rats',
    name: 'Plaga de Ratas',
    type: 'side',
    description: 'Elimina 5 ratas para el Anciano.',
    target: 'ENEMY_RAT',
    targetType: 'kill',
    targetCount: 5,
    reward: { gold: 30, exp: 20 },
  },
  kill_skeletons: {
    id: 'kill_skeletons',
    name: 'Huesos Inquietos',
    type: 'side',
    description: 'Destruye 4 esqueletos.',
    target: 'ENEMY_SKELETON',
    targetType: 'kill',
    targetCount: 4,
    reward: { gold: 50, exp: 35 },
  },
  clear_spiders: {
    id: 'clear_spiders',
    name: 'Nido de Arañas',
    type: 'side',
    description: 'Elimina 5 arañas gigantes.',
    target: 'ENEMY_SPIDER',
    targetType: 'kill',
    targetCount: 5,
    reward: { gold: 60, exp: 40 },
  },
  undead_purge: {
    id: 'undead_purge',
    name: 'Purga de No-Muertos',
    type: 'side',
    description: 'Destruye 3 zombis y 3 esqueletos.',
    targets: [
      { target: 'ENEMY_ZOMBIE', count: 3 },
      { target: 'ENEMY_SKELETON', count: 3 },
    ],
    targetType: 'multi_kill',
    reward: { gold: 80, exp: 60 },
  },
  demon_hunt: {
    id: 'demon_hunt',
    name: 'Cazador de Demonios',
    type: 'side',
    description: 'Elimina 2 demonios.',
    target: 'ENEMY_DEMON',
    targetType: 'kill',
    targetCount: 2,
    reward: { gold: 150, exp: 100 },
  },
  beast_slayer: {
    id: 'beast_slayer',
    name: 'Matador de Bestias',
    type: 'side',
    description: 'Elimina 3 lobos y 2 troles.',
    targets: [
      { target: 'ENEMY_WOLF', count: 3 },
      { target: 'ENEMY_TROLL', count: 2 },
    ],
    targetType: 'multi_kill',
    reward: { gold: 120, exp: 80 },
  },
  crafting_master: {
    id: 'crafting_master',
    name: 'Maestro Artesano',
    type: 'side',
    description: 'Crea 3 items de rareza rara o superior.',
    targetType: 'craft',
    targetCount: 3,
    reward: { gold: 200, exp: 120 },
  },
  treasure_hunter: {
    id: 'treasure_hunter',
    name: 'Cazador de Tesoros',
    type: 'side',
    description: 'Acumula 500 de oro.',
    targetType: 'gold',
    target: 500,
    reward: { exp: 150 },
  },
  
  // Collection quests
  gather_iron: {
    id: 'gather_iron',
    name: 'Suministros de Hierro',
    type: 'side',
    description: 'Recolecta 5 minerales de hierro.',
    target: 'iron_ore',
    targetType: 'collect',
    targetCount: 5,
    reward: { gold: 40, exp: 25 },
  },
  gather_crystals: {
    id: 'gather_crystals',
    name: 'Cristales Mágicos',
    type: 'side',
    description: 'Recolecta 3 cristales mágicos.',
    target: 'crystal',
    targetType: 'collect',
    targetCount: 3,
    reward: { gold: 100, exp: 50 },
  },
  
  // Exploration quests
  explore_deep: {
    id: 'explore_deep',
    name: 'Explorador Profundo',
    type: 'side',
    description: 'Desciende hasta el piso 5.',
    target: 5,
    targetType: 'floor',
    reward: { gold: 120, exp: 80 },
  },
  
  // Boss hunting
  slay_goblin_king: {
    id: 'slay_goblin_king',
    name: 'Regicidio Goblin',
    type: 'side',
    description: 'Derrota al Rey Goblin.',
    target: 'BOSS_GOBLIN_KING',
    targetType: 'boss',
    floor: 1,
    reward: { gold: 75, exp: 50 },
  },
};

// Get available quests for a floor
export function getAvailableQuests(floor, completedQuests = [], activeQuests = []) {
  const available = [];
  
  Object.values(QUESTS).forEach(quest => {
    // Skip completed or active quests
    if (completedQuests.includes(quest.id)) return;
    if (activeQuests.includes(quest.id)) return;
    
    // Check requirements
    if (quest.requires && !completedQuests.includes(quest.requires)) return;
    
    if (quest.type === 'main') {
      // Main quests available when requirements met
      if (!quest.requires || completedQuests.includes(quest.requires)) {
        available.push(quest);
      }
    } else if (quest.type === 'side') {
      // Side quests available based on floor
      if (quest.id === 'kill_rats' && floor >= 1) available.push(quest);
      if (quest.id === 'kill_skeletons' && floor >= 2) available.push(quest);
      if (quest.id === 'clear_spiders' && floor >= 3) available.push(quest);
      if (quest.id === 'undead_purge' && floor >= 3) available.push(quest);
      if (quest.id === 'demon_hunt' && floor >= 6) available.push(quest);
      if (quest.id === 'beast_slayer' && floor >= 4) available.push(quest);
      if (quest.id === 'gather_iron' && floor >= 1) available.push(quest);
      if (quest.id === 'gather_crystals' && floor >= 4) available.push(quest);
      if (quest.id === 'explore_deep' && floor >= 2) available.push(quest);
      if (quest.id === 'slay_goblin_king' && floor >= 1) available.push(quest);
      if (quest.id === 'crafting_master' && floor >= 2) available.push(quest);
      if (quest.id === 'treasure_hunter' && floor >= 1) available.push(quest);
    }
  });
  
  return available;
}

// Check quest progress
export function checkQuestProgress(quest, gameState) {
  if (!quest) return { complete: false, progress: 0 };
  
  const progress = gameState.questProgress?.[quest.id] || 0;
  
  switch (quest.targetType) {
    case 'kill':
      return {
        complete: progress >= quest.targetCount,
        progress,
        target: quest.targetCount,
        type: 'kill',
      };
    
    case 'multi_kill':
      // For multi-target quests, progress is stored as object
      const multiProgress = gameState.questProgress?.[quest.id] || {};
      let allComplete = true;
      let progressStr = '';
      quest.targets.forEach(t => {
        const count = multiProgress[t.target] || 0;
        if (count < t.count) allComplete = false;
        progressStr += `${count}/${t.count} `;
      });
      return {
        complete: allComplete,
        progress: progressStr.trim(),
        target: quest.targets.map(t => t.count).join('/'),
        type: 'multi_kill',
      };
    
    case 'collect':
      const materials = gameState.materials || {};
      const collected = materials[quest.target] || 0;
      return {
        complete: collected >= quest.targetCount,
        progress: collected,
        target: quest.targetCount,
        type: 'collect',
      };
    
    case 'floor':
      const currentFloor = gameState.level || 1;
      return {
        complete: currentFloor >= quest.target,
        progress: currentFloor,
        target: quest.target,
        type: 'floor',
      };
    
    case 'boss':
      // Boss kills tracked separately
      const bossKilled = gameState.questProgress?.[quest.id] || 0;
      return {
        complete: bossKilled >= 1,
        progress: bossKilled,
        target: 1,
        type: 'boss',
      };
    
    case 'craft':
      const crafted = gameState.questProgress?.[quest.id] || 0;
      return {
        complete: crafted >= quest.targetCount,
        progress: crafted,
        target: quest.targetCount,
        type: 'craft',
      };
    
    case 'gold':
      const totalGold = gameState.player?.gold || 0;
      return {
        complete: totalGold >= quest.target,
        progress: totalGold,
        target: quest.target,
        type: 'gold',
      };
    
    default:
      return { complete: false, progress: 0 };
  }
}

// Generar NPCS
export function generateNPCs(floor, rooms, map, excludeRoomIndices = [], enemies = []) {
  const npcs = [];
  
  // Merchant (aparece cada 2 pisos)
  if (floor % 2 === 1 && rooms.length > 2) {
    const merchantRoom = rooms.find((r, i) => !excludeRoomIndices.includes(i) && i !== 0);
    if (merchantRoom) {
      const x = merchantRoom.x + Math.floor(merchantRoom.width / 2);
      const y = merchantRoom.y + Math.floor(merchantRoom.height / 2);
      
      // VERIFICACIÓN DE COLISIÓN CON ENEMIGOS
      const isOccupiedByEnemy = enemies.some(e => e.x === x && e.y === y);
      
      if (map[y]?.[x] === 1 && !isOccupiedByEnemy) {
        npcs.push({
          ...NPCS.merchant,
          x, y,
          id: 'merchant_' + floor,
        });
      }
    }
  }
  
  // Quest giver (pisos 1, 3, 5)
  if ([1, 3, 5].includes(floor) && rooms.length > 3) {
    const questRoom = rooms.find((r, i) => !excludeRoomIndices.includes(i) && i !== 0 && i !== rooms.length - 1);
    if (questRoom) {
      const x = questRoom.x + 1;
      const y = questRoom.y + 1;
      
      const isOccupiedByEnemy = enemies.some(e => e.x === x && e.y === y);

      if (map[y]?.[x] === 1 && !isOccupiedByEnemy) {
        npcs.push({
          ...NPCS.quest_elder,
          x, y,
          id: 'quest_elder_' + floor,
        });
      }
    }
  }
  
  // Sage (pisos 1, 6)
  if ([1, 6].includes(floor) && rooms.length > 2) {
    const sageRoom = rooms[1];
    if (sageRoom) {
      const x = sageRoom.x + sageRoom.width - 2;
      const y = sageRoom.y + 1;
      
      const isOccupiedByEnemy = enemies.some(e => e.x === x && e.y === y);

      if (map[y]?.[x] === 1 && !isOccupiedByEnemy) {
        npcs.push({
          ...NPCS.sage,
          x, y,
          id: 'sage_' + floor,
        });
      }
    }
  }
  
  return npcs;
}