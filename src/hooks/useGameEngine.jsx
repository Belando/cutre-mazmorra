import { useState, useCallback, useEffect } from 'react';
import { generateDungeon, TILE, ENTITY, ENEMY_STATS, scaleEnemyStats } from '@/components/game/DungeonGenerator';
import { addToInventory, useItem, equipItem, unequipItem, calculatePlayerStats } from '@/components/game/ItemSystem';
import { useQuickSlot as processQuickSlot, assignToQuickSlot } from '@/components/game/QuickSlots';
import { generateNPCs, QUESTS } from '@/components/game/NPCSystem';
import { processEnemyTurn, calculateEnemyDamage, getEnemyRangedInfo } from '@/components/game/EnemyAI';
import { generateMaterialDrop, generateBossDrop, MATERIAL_TYPES, craftItem, upgradeItem } from '@/components/game/CraftingSystem';
import { initializeSkills, useSkill, canUseSkill, updateCooldowns, updateBuffs, calculateBuffBonuses, getLearnableSkills, learnSkill, upgradeSkill, evolveClass, SKILLS } from '@/components/game/SkillSystem';
import { saveGame as saveSystem, loadGame as loadSystem } from '@/components/game/SaveSystem';

const MAP_WIDTH = 50;
const MAP_HEIGHT = 35;
const LOG_LENGTH = 50; // Limitar historial de mensajes

export function useGameEngine() {
  // --- ESTADOS DEL JUEGO ---
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  
  // Progreso y Datos Persistentes
  const [stats, setStats] = useState({ maxLevel: 1, kills: 0, gold: 0, playerLevel: 1 });
  const [activeQuests, setActiveQuests] = useState([]);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [questProgress, setQuestProgress] = useState({});
  const [materials, setMaterials] = useState({});
  const [quickSlots, setQuickSlots] = useState([null, null, null]);
  
  // Datos del Jugador
  const [playerName, setPlayerName] = useState('');
  const [selectedAppearance, setSelectedAppearance] = useState(null);
  const [playerClass, setPlayerClass] = useState('warrior');
  
  // UI de Combate
  const [rangedMode, setRangedMode] = useState(false);
  const [rangedTargets, setRangedTargets] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);

  // --- SISTEMA DE MENSAJES ---
  const addMessage = useCallback((text, type = 'info') => {
    setMessages(prev => [...prev, { text, type }].slice(-LOG_LENGTH));
  }, []);

  // Función auxiliar para actualizar estado de forma segura
  const updateState = (fn) => {
    setGameState(prev => {
      if (!prev) return null;
      const newState = JSON.parse(JSON.stringify(prev));
      fn(newState);
      return newState;
    });
  };

  // --- INICIALIZACIÓN ---
  const initGame = useCallback((level = 1, existingPlayer = null, existingInventory = null, existingEquipment = null) => {
    const dungeon = generateDungeon(MAP_WIDTH, MAP_HEIGHT, level);
    
    const classAttributes = {
      warrior: { strength: 10, dexterity: 5, intelligence: 3 },
      mage: { strength: 3, dexterity: 5, intelligence: 10 },
      rogue: { strength: 5, dexterity: 10, intelligence: 3 },
    };
    
    // Configurar jugador inicial
    const player = existingPlayer || {
      x: dungeon.playerStart.x, y: dungeon.playerStart.y,
      hp: 50, maxHp: 50, mp: 30, maxMp: 30,
      attack: 8, baseAttack: 8, defense: 3, baseDefense: 3,
      equipAttack: 0, equipDefense: 0, equipMaxHp: 0,
      exp: 0, level: 1, gold: 0,
      name: playerName || 'Héroe',
      floor: level,
      appearance: selectedAppearance,
      class: playerClass,
      ...(classAttributes[playerClass] || classAttributes.warrior),
      skills: initializeSkills(playerClass)
    };
    
    if (existingPlayer) {
      player.x = dungeon.playerStart.x;
      player.y = dungeon.playerStart.y;
      player.floor = level;
    }
    
    const npcs = generateNPCs(level, dungeon.rooms, dungeon.map, [0, dungeon.rooms.length - 1]);
    // Filtrar cofres para que no aparezcan debajo de NPCs
    const cleanChests = (dungeon.chests || []).filter(c => !npcs.some(n => n.x === c.x && n.y === c.y));
    
    const enemies = [];
    const pLevel = existingPlayer?.level || 1;
    
    // Generar enemigos desde la matriz del dungeon
    for (let y = 0; y < dungeon.entities.length; y++) {
      for (let x = 0; x < dungeon.entities[0].length; x++) {
        const entity = dungeon.entities[y][x];
        if (entity >= ENTITY.ENEMY_RAT) {
          const baseStats = ENEMY_STATS[entity];
          if (baseStats) {
            const scaled = scaleEnemyStats(baseStats, pLevel, level);
            enemies.push({ x, y, type: entity, ...scaled, isBoss: baseStats.isBoss || false, stunned: 0 });
          }
        }
      }
    }

    const newState = {
      map: dungeon.map,
      entities: dungeon.entities,
      enemies,
      items: dungeon.items || [],
      chests: cleanChests,
      torches: dungeon.torches || [],
      npcs,
      player,
      inventory: existingInventory || [],
      equipment: existingEquipment || { weapon: null, offhand: null, helmet: null, chest: null, legs: null, boots: null, gloves: null, ring: null, earring: null, necklace: null },
      visible: Array(MAP_HEIGHT).fill().map(() => Array(MAP_WIDTH).fill(false)),
      explored: Array(MAP_HEIGHT).fill().map(() => Array(MAP_WIDTH).fill(false)),
      stairs: dungeon.stairs,
      stairsUp: dungeon.stairsUp,
      level,
      bossDefeated: false,
      questProgress,
      materials,
    };

    calculateFOV(newState);
    setGameState(newState);
    
    if (level === 1 && !existingPlayer) addMessage(`¡Bienvenido, ${player.name}!`, 'info');
    else addMessage(`Piso ${level}`, 'info');
  }, [addMessage, playerName, questProgress, selectedAppearance, playerClass, materials]);

  // --- SISTEMAS INTERNOS ---
  
  const calculateFOV = (state) => {
    const { player, map, visible, explored } = state;
    for (let y = 0; y < MAP_HEIGHT; y++) for (let x = 0; x < MAP_WIDTH; x++) visible[y][x] = false;
    
    for (let angle = 0; angle < 360; angle += 2) {
      const rad = angle * Math.PI / 180;
      const dx = Math.cos(rad), dy = Math.sin(rad);
      let x = player.x + 0.5, y = player.y + 0.5;
      
      for (let i = 0; i < 6; i++) { // Radio de visión
        const tx = Math.floor(x), ty = Math.floor(y);
        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) break;
        visible[ty][tx] = true;
        explored[ty][tx] = true;
        if (map[ty][tx] === TILE.WALL) break;
        x += dx; y += dy;
      }
    }
  };

  const handleEnemyDeath = (state, idx) => {
    const enemy = state.enemies[idx];
    const info = ENEMY_STATS[enemy.type];
    state.enemies.splice(idx, 1);
    
    // Recompensas
    state.player.exp += info.exp;
    addMessage(`${info.name} derrotado! +${info.exp} XP`, 'death');
    
    // Botín
    const drops = enemy.isBoss ? generateBossDrop(enemy.type, state.level) : generateMaterialDrop(enemy.type, state.level);
    drops.forEach(d => {
        state.materials[d.type] = (state.materials[d.type] || 0) + d.count;
        addMessage(`Botín: ${d.count} ${MATERIAL_TYPES[d.type]?.name}`, 'pickup');
    });
    
    // Misiones y Logros
    if(enemy.isBoss) {
        state.bossDefeated = true;
        addMessage("¡Jefe de piso eliminado!", 'levelup');
        updateQuestProgress('boss', enemy.type);
    } else {
        updateQuestProgress('kill', enemy.type);
    }
    
    // Subida de nivel
    if (state.player.exp >= state.player.level * 25) {
        state.player.level++;
        state.player.exp = 0;
        state.player.maxHp += 10;
        state.player.hp = state.player.maxHp;
        state.player.skills.skillPoints = (state.player.skills.skillPoints || 0) + 1;
        addMessage(`¡Nivel ${state.player.level} alcanzado!`, 'levelup');
    }
  };

  const endTurn = (state) => {
    // Regeneración
    state.player.mp = Math.min((state.player.mp || 0) + 1, state.player.maxMp || 30);
    
    // Cooldowns y Buffs
    if(state.player.skills) {
        state.player.skills.cooldowns = updateCooldowns(state.player.skills.cooldowns);
        state.player.skills.buffs = updateBuffs(state.player.skills.buffs);
    }
    
    // IA Enemiga (Pasamos chests para evitar colisiones)
    const pStats = calculatePlayerStats(state.player);
    state.enemies.forEach(enemy => {
        const action = processEnemyTurn(enemy, state.player, state.enemies, state.map, state.visible, addMessage, state.chests);
        
        if(action.action.includes('attack')) {
            const isRanged = action.action === 'ranged_attack';
            const dmg = calculateEnemyDamage(
                isRanged ? {...enemy, attack: Math.floor(enemy.attack * 0.7)} : enemy,
                state.player, pStats, state.player.skills.buffs
            );
            
            if(dmg.evaded) addMessage(`Esquivaste a ${ENEMY_STATS[enemy.type].name}`, 'info');
            else {
                state.player.hp -= dmg.damage;
                addMessage(`${ENEMY_STATS[enemy.type].name} te golpea: -${dmg.damage} HP`, 'enemy_damage');
            }
        }
    });
    
    calculateFOV(state);
    
    if(state.player.hp <= 0) {
        setGameOver(true);
        addMessage("Has muerto...", 'death');
    }
  };

  const updateQuestProgress = (type, target) => {
     activeQuests.forEach(qid => {
         const q = QUESTS[qid];
         if(q && q.targetType === type) {
             setQuestProgress(p => ({ ...p, [qid]: (p[qid] || 0) + 1 }));
         }
     });
  };

  // --- ACCIONES PÚBLICAS ---
  const actions = {
    move: (dx, dy) => updateState(state => {
        const { player, map } = state;
        const nx = player.x + dx;
        const ny = player.y + dy;
        
        // Colisiones básicas
        if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT || map[ny][nx] === TILE.WALL) return;
        
        // Colisión con Cofres (No atravesables)
        if (state.chests.some(c => c.x === nx && c.y === ny)) {
            addMessage("Un cofre bloquea el camino (Usa 'E')", 'info');
            return;
        }
        
        // Colisión con Enemigos (Combate)
        const enemyIdx = state.enemies.findIndex(e => e.x === nx && e.y === ny);
        if (enemyIdx !== -1) {
            const enemy = state.enemies[enemyIdx];
            const pStats = calculatePlayerStats(player);
            const buffs = calculateBuffBonuses(player.skills.buffs, pStats);
            const dmg = Math.max(1, (pStats.attack + buffs.attackBonus) - enemy.defense + Math.floor(Math.random()*3));
            
            enemy.hp -= dmg;
            addMessage(`Atacas a ${ENEMY_STATS[enemy.type].name}: ${dmg} daño`, 'player_damage');
            
            if (enemy.hp <= 0) handleEnemyDeath(state, enemyIdx);
            endTurn(state);
            return;
        }
        
        // Colisión con NPC (Bloqueo)
        if (state.npcs.some(n => n.x === nx && n.y === ny)) {
            addMessage("Un NPC bloquea el camino", 'info');
            return;
        }
        
        // Movimiento libre
        player.x = nx;
        player.y = ny;
        
        // Recoger items del suelo
        const itemIdx = state.items.findIndex(i => i.x === nx && i.y === ny);
        if (itemIdx !== -1) {
            const item = state.items[itemIdx];
            if (item.category === 'currency') {
                player.gold += item.value;
                addMessage(`+${item.value} Oro`, 'pickup');
            } else {
                addToInventory(state.inventory, item);
                addMessage(`Recogiste: ${item.name}`, 'pickup');
            }
            state.items.splice(itemIdx, 1);
        }
        
        endTurn(state);
    }),

    // Acción de Interacción (Tecla E)
    interact: () => {
        if (!gameState) return { type: 'none' };
        
        // 1. Prioridad NPC
        const npc = gameState.npcs.find(n => Math.abs(n.x - gameState.player.x) + Math.abs(n.y - gameState.player.y) <= 1);
        if (npc) {
            addMessage(`Hablas con ${npc.name}`, 'info');
            return { type: 'npc', data: npc };
        }
        
        // 2. Cofres
        let resultType = 'none';
        updateState(state => {
            const chestIdx = state.chests.findIndex(c => Math.abs(c.x - state.player.x) + Math.abs(c.y - state.player.y) <= 1 && !c.opened);
            if (chestIdx !== -1) {
                const chest = state.chests[chestIdx];
                chest.opened = true;
                const res = addToInventory(state.inventory, chest.item);
                if (res.success) addMessage(`Abriste cofre: ${chest.item.name}`, 'pickup');
                else {
                    // Inventario lleno, tirar al suelo
                    chest.item.x = chest.x; chest.item.y = chest.y;
                    state.items.push(chest.item);
                    addMessage("Inventario lleno, item al suelo", 'info');
                }
                resultType = 'chest';
            } else {
                // Si no hay nada cerca
                // No ponemos mensaje de error aquí para no spamear si el usuario quería usar la 'E' para otra cosa (aunque ahora E es solo interactuar)
            }
        });
        
        if (resultType === 'none' && !npc) addMessage("No hay nada aquí", 'info');
        return { type: resultType };
    },

    wait: () => updateState(state => {
        // Lógica de habilidad (si hay seleccionada)
        if (selectedSkill && SKILLS[selectedSkill]) {
            const skill = SKILLS[selectedSkill];
            if (['self', 'aoe', 'ultimate'].includes(skill.type)) {
                 if(canUseSkill(selectedSkill, state.player.skills.cooldowns)) {
                     // Usar habilidad
                     state.player.skills.cooldowns[selectedSkill] = skill.cooldown;
                     if(skill.manaCost) state.player.mp -= skill.manaCost;
                     // (Simplificado: la lógica real de efecto de skill iría aquí)
                     addMessage(`Usaste ${skill.name}`, 'player_damage');
                     setSelectedSkill(null);
                 } else {
                     addMessage("Habilidad no lista", 'info');
                     return; // No pasar turno
                 }
            }
        } else {
            addMessage("Esperas...", 'info');
        }
        endTurn(state);
    }),
    
    descend: (goUp) => {
        const { player, stairs, stairsUp, level, inventory, equipment, enemies } = gameState;
        if (goUp && stairsUp && player.x === stairsUp.x && player.y === stairsUp.y) {
            if (level > 1) initGame(level - 1, player, inventory, equipment);
            else addMessage("No puedes salir aún", 'info');
        } else if (!goUp && player.x === stairs.x && player.y === stairs.y) {
            if (enemies.some(e => e.isBoss)) addMessage("¡Mata al jefe primero!", 'info');
            else initGame(level + 1, player, inventory, equipment);
        } else {
            addMessage("No hay escaleras aquí", 'info');
        }
    },

    // Wrappers simples
    useItem: (i) => updateState(s => { 
        const r = useItem(s.inventory, i, s.player); 
        if(r.success) r.effects.forEach(m => addMessage(m, 'heal'));
        else addMessage(r.message, 'info');
    }),
    equipItem: (i) => updateState(s => {
        const r = equipItem(s.inventory, i, s.equipment, s.player);
        addMessage(r.message, r.success ? 'pickup' : 'info');
    }),
    unequipItem: (slot) => updateState(s => {
        const r = unequipItem(s.equipment, slot, s.inventory, s.player);
        addMessage(r.message, 'info');
    }),
    dropItem: (i) => updateState(s => {
        const item = s.inventory[i];
        item.x = s.player.x; item.y = s.player.y;
        s.items.push(item); s.inventory.splice(i, 1);
        addMessage(`Soltaste ${item.name}`, 'info');
    }),
    // ... Resto de acciones (buy, sell, craft...) se mantienen igual, asegúrate de usar updateState
    buyItem: (item) => updateState(s => { 
        if(s.player.gold >= item.price) { 
             const r = addToInventory(s.inventory, {...item, id: Date.now()});
             if(r.success) { s.player.gold -= item.price; addMessage(`Comprado: ${item.name}`, 'pickup'); }
             else addMessage("Inventario lleno", 'info');
        } else addMessage("Oro insuficiente", 'info');
    }),
    sellItem: (i, p) => updateState(s => {
        const item = s.inventory[i]; s.inventory.splice(i, 1); s.player.gold += p;
        addMessage(`Vendiste ${item.name} por ${p}`, 'pickup');
    }),
    acceptQuest: (q) => { if(!activeQuests.includes(q.id)) setActiveQuests(p => [...p, q.id]); },
    completeQuest: (q) => {
        if(activeQuests.includes(q.id)) {
            setActiveQuests(p => p.filter(x => x !== q.id));
            setCompletedQuests(p => [...p, q.id]);
            updateState(s => {
                if(q.reward.gold) s.player.gold += q.reward.gold;
                if(q.reward.exp) s.player.exp += q.reward.exp;
                if(q.reward.item) addToInventory(s.inventory, {...q.reward.item, id: Date.now()});
                addMessage(`Misión completada: ${q.name}`, 'levelup');
                checkLevelUp(s.player);
            });
        }
    },
    craftItem: (key) => updateState(s => {
        const r = craftItem(key, materials, s.inventory);
        if(r.success) { setMaterials({...materials}); addMessage(r.message, 'pickup'); }
        else addMessage(r.message, 'info');
    }),
    upgradeItem: (slot) => updateState(s => {
        const item = s.equipment[slot]; if(!item) return;
        const r = upgradeItem(item, materials, s.player.gold);
        if(r.success) { setMaterials({...materials}); s.player.gold -= r.goldCost; addMessage(r.message, 'levelup'); }
        else addMessage(r.message, 'info');
    }),
    learnSkill: (id) => updateState(s => { if(learnSkill(s.player.skills, id).success) addMessage("Habilidad aprendida", 'levelup'); }),
    upgradeSkill: (id) => updateState(s => { if(upgradeSkill(s.player.skills, id).success) addMessage("Habilidad mejorada", 'levelup'); }),
    evolveClass: (c) => updateState(s => { if(evolveClass(s.player.skills, c).success) addMessage("Clase evolucionada!", 'levelup'); }),

    // Setters directos
    setPlayerName, setSelectedSkill, setRangedMode, setRangedTargets,
    assignQuickSlot: (i, id) => setQuickSlots(p => assignToQuickSlot(p, i, id)),
    useQuickSlot: (i) => updateState(s => {
        const r = processQuickSlot(quickSlots, i, s.inventory);
        if(r.success) { useItem(s.inventory, r.itemIndex, s.player); addMessage("Objeto rápido usado", 'heal'); }
        else addMessage(r.message, 'info');
    }),
    selectCharacter: (k, a) => { setPlayerName(playerName || 'Héroe'); setSelectedAppearance(k); setPlayerClass(a.class); setGameStarted(true); },
    saveGame: () => { saveSystem(gameState, stats, activeQuests, completedQuests, questProgress, materials, quickSlots); addMessage("Juego guardado", 'info'); },
    loadGame: () => { const d = loadSystem(); if(d) { setGameState(d.gameState); setStats(d.stats); setGameStarted(true); addMessage("Juego cargado", 'info'); } },
    restart: () => { setGameStarted(false); setGameState(null); setGameOver(false); }
  };

  useEffect(() => { if (gameStarted && !gameState) initGame(1); }, [gameStarted, gameState, initGame]);

  return { gameState, gameStarted, gameOver, messages, stats, playerInfo: { name: playerName, class: playerClass, appearance: selectedAppearance }, uiState: { activeQuests, completedQuests, questProgress, materials, quickSlots, selectedSkill, rangedMode, rangedTargets }, actions };
}