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

export function useGameEngine() {
  // --- ESTADOS ---
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  
  // Progreso y Persistencia
  const [stats, setStats] = useState({ maxLevel: 1, kills: 0, gold: 0, playerLevel: 1 });
  const [activeQuests, setActiveQuests] = useState([]);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [questProgress, setQuestProgress] = useState({});
  const [materials, setMaterials] = useState({});
  const [quickSlots, setQuickSlots] = useState([null, null, null]);
  
  // Jugador
  const [playerName, setPlayerName] = useState('');
  const [selectedAppearance, setSelectedAppearance] = useState(null);
  const [playerClass, setPlayerClass] = useState('warrior');
  
  // UI Combate
  const [rangedMode, setRangedMode] = useState(false);
  const [rangedTargets, setRangedTargets] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);

  // --- HELPERS ---
  const addMessage = useCallback((text, type = 'info') => {
    setMessages(prev => [...prev.slice(-50), { text, type }]);
  }, []);

  // Función auxiliar para modificar estado de forma inmutable y segura
  const updateState = (updaterFn) => {
    setGameState(prev => {
      const newState = JSON.parse(JSON.stringify(prev));
      updaterFn(newState);
      return newState;
    });
  };

  // --- LÓGICA DEL JUEGO ---
  
  // Inicializar o reiniciar nivel
  const initGame = useCallback((level = 1, existingPlayer = null, existingInventory = null, existingEquipment = null) => {
    const dungeon = generateDungeon(MAP_WIDTH, MAP_HEIGHT, level);
    
    // Configurar jugador
    const classAttributes = {
      warrior: { strength: 10, dexterity: 5, intelligence: 3 },
      mage: { strength: 3, dexterity: 5, intelligence: 10 },
      rogue: { strength: 5, dexterity: 10, intelligence: 3 },
    };
    
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
    const cleanChests = (dungeon.chests || []).filter(c => !npcs.some(n => n.x === c.x && n.y === c.y));
    
    // Generar Enemigos escalados
    const enemies = [];
    const pLevel = existingPlayer?.level || 1;
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

    // Calcular FOV inicial
    calculateFOV(newState);
    setGameState(newState);
    
    if (level === 1 && !existingPlayer) addMessage(`¡Bienvenido, ${player.name}!`, 'info');
    else addMessage(`Piso ${level}`, 'info');
  }, [addMessage, playerName, questProgress, selectedAppearance, playerClass, materials]);

  // Cálculo de Campo de Visión
  const calculateFOV = (state) => {
    const { player, map, visible, explored } = state;
    for (let y = 0; y < MAP_HEIGHT; y++) for (let x = 0; x < MAP_WIDTH; x++) visible[y][x] = false;
    
    for (let angle = 0; angle < 360; angle += 2) {
      const rad = angle * Math.PI / 180;
      const dx = Math.cos(rad), dy = Math.sin(rad);
      let x = player.x + 0.5, y = player.y + 0.5;
      
      for (let i = 0; i < 6; i++) { // Radio 6
        const tx = Math.floor(x), ty = Math.floor(y);
        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) break;
        visible[ty][tx] = true;
        explored[ty][tx] = true;
        if (map[ty][tx] === TILE.WALL) break;
        x += dx; y += dy;
      }
    }
  };

  // Turno del Enemigo
  const runEnemyTurn = (state) => {
    const { enemies, player, map, visible, chests } = state;
    const playerStats = calculatePlayerStats(player);

    enemies.forEach(enemy => {
      const action = processEnemyTurn(enemy, player, enemies, map, visible, addMessage, chests);
      if (action.action.includes('attack')) {
        const isRanged = action.action === 'ranged_attack';
        const dmgResult = calculateEnemyDamage(
           isRanged ? {...enemy, attack: Math.floor(enemy.attack * 0.7)} : enemy, 
           player, playerStats, player.skills?.buffs || []
        );

        if (dmgResult.evaded) addMessage(`¡Esquivaste a ${ENEMY_STATS[enemy.type].name}!`, 'info');
        else {
          state.player.hp -= dmgResult.damage;
          addMessage(`${ENEMY_STATS[enemy.type].name} te hace ${dmgResult.damage} daño`, 'enemy_damage');
        }
      }
    });
  };

  // Fin del turno del jugador
  const endTurn = (state) => {
    state.player.mp = Math.min((state.player.mp || 0) + 1, state.player.maxMp || 30);
    if (state.player.skills) {
        state.player.skills.cooldowns = updateCooldowns(state.player.skills.cooldowns || {});
        state.player.skills.buffs = updateBuffs(state.player.skills.buffs || []);
    }
    runEnemyTurn(state);
    calculateFOV(state);
    if (state.player.hp <= 0) {
        setGameOver(true);
        addMessage('Has muerto...', 'death');
    }
  };

  // Acciones del Jugador
  const actions = {
    move: (dx, dy) => {
      if (!gameState || gameOver) return;
      updateState(state => {
        const { player, map, enemies } = state;
        const nx = player.x + dx, ny = player.y + dy;
        
        if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT || map[ny][nx] === TILE.WALL) return;
        if (state.chests.some(c => c.x === nx && c.y === ny)) {
            addMessage("Cofre bloqueando (Usa E)", 'info'); return;
        }

        const enemyIdx = enemies.findIndex(e => e.x === nx && e.y === ny);
        if (enemyIdx !== -1) {
            // Combate
            const enemy = enemies[enemyIdx];
            const stats = calculatePlayerStats(player);
            const buffs = calculateBuffBonuses(player.skills?.buffs || [], stats);
            const dmg = Math.max(1, (stats.attack + buffs.attackBonus) - enemy.defense + Math.floor(Math.random()*4));
            
            enemy.hp -= dmg;
            addMessage(`Golpeas a ${ENEMY_STATS[enemy.type].name} por ${dmg}`, 'player_damage');
            
            if (enemy.hp <= 0) {
                enemies.splice(enemyIdx, 1);
                player.exp += ENEMY_STATS[enemy.type].exp;
                addMessage(`${ENEMY_STATS[enemy.type].name} muerto!`, 'death');
                // Drops
                const drops = enemy.isBoss ? generateBossDrop(enemy.type, state.level) : generateMaterialDrop(enemy.type, state.level);
                drops.forEach(d => {
                    state.materials[d.type] = (state.materials[d.type] || 0) + d.count;
                    addMessage(`Botín: ${d.count} ${MATERIAL_TYPES[d.type]?.name || d.type}`, 'pickup');
                });
                // Quest logic (simplified)
                if (enemy.isBoss) { 
                    state.bossDefeated = true; 
                    addMessage("Jefe derrotado!", 'levelup');
                }
                // Check level up
                if (player.exp >= player.level * 25) {
                    player.level++; player.exp = 0;
                    player.maxHp += 10; player.hp = player.maxHp;
                    player.skills.skillPoints = (player.skills.skillPoints || 0) + 1;
                    addMessage(`¡Nivel ${player.level}!`, 'levelup');
                }
            }
        } else if (!state.npcs.some(n => n.x === nx && n.y === ny)) {
            // Movimiento libre
            player.x = nx; player.y = ny;
            // Recoger items del suelo
            const itemIdx = state.items.findIndex(i => i.x === nx && i.y === ny);
            if (itemIdx !== -1) {
                const item = state.items[itemIdx];
                if (item.category === 'currency') {
                    player.gold += item.value;
                    addMessage(`+${item.value} Oro`, 'pickup');
                } else {
                    addToInventory(state.inventory, item);
                    addMessage(`Recogido: ${item.name}`, 'pickup');
                }
                state.items.splice(itemIdx, 1);
            }
        } else {
            addMessage("NPC bloquea el paso", 'info');
            return; 
        }
        endTurn(state);
      });
    },
    interact: () => {
        if (!gameState) return;
        let result = { type: 'none' };
        
        // Interactuar NPC
        const npc = gameState.npcs?.find(n => Math.abs(n.x - gameState.player.x) + Math.abs(n.y - gameState.player.y) <= 1);
        if (npc) {
            addMessage(`Hablas con ${npc.name}`, 'info');
            return { type: 'npc', data: npc };
        }
        
        // Interactuar Cofre
        updateState(state => {
            const chestIdx = state.chests?.findIndex(c => Math.abs(c.x - state.player.x) + Math.abs(c.y - state.player.y) <= 1 && !c.opened);
            if (chestIdx !== -1 && chestIdx !== undefined) {
                const chest = state.chests[chestIdx];
                chest.opened = true;
                const res = addToInventory(state.inventory, chest.item);
                if (res.success) addMessage(`Cofre: ${chest.item.name}`, 'pickup');
                else {
                    chest.item.x = chest.x; chest.item.y = chest.y;
                    state.items.push(chest.item);
                    addMessage('Inv. lleno, item al suelo', 'info');
                }
                result = { type: 'chest' };
            } else {
               addMessage("Nada que interactuar", 'info');
            }
        });
        return result;
    },
    wait: () => {
        if (!gameState || gameOver) return;
        updateState(state => {
             if (selectedSkill && SKILLS[selectedSkill]) {
                 // Lógica simplificada de habilidad
                 const skill = SKILLS[selectedSkill];
                 if (['self', 'aoe', 'ultimate'].includes(skill.type)) {
                     // Ejecutar skill (lógica completa en SkillSystem)
                     // Por brevedad, asumimos uso exitoso si cooldown ok
                     if (canUseSkill(selectedSkill, state.player.skills.cooldowns)) {
                         state.player.skills.cooldowns[selectedSkill] = skill.cooldown;
                         addMessage(`Usaste ${skill.name}`, 'player_damage');
                     } else {
                         addMessage("Habilidad en espera", 'info');
                         return; // No pasar turno
                     }
                 }
             } else {
                 addMessage('Esperas...', 'info');
             }
             endTurn(state);
        });
    },
    descend: (goUp) => {
        if (!gameState) return;
        const { player, stairs, stairsUp, level, inventory, equipment } = gameState;
        if (goUp && stairsUp && player.x === stairsUp.x && player.y === stairsUp.y) {
             if (level > 1) initGame(level - 1, player, inventory, equipment);
             else addMessage('No puedes salir aún', 'info');
        } else if (!goUp && player.x === stairs.x && player.y === stairs.y) {
             initGame(level + 1, player, inventory, equipment);
        } else {
             addMessage('No hay escaleras', 'info');
        }
    },
    // Wrappers simples para otras acciones
    useItem: (i) => updateState(s => { useItem(s.inventory, i, s.player); addMessage("Item usado", 'heal'); }),
    equipItem: (i) => updateState(s => { equipItem(s.inventory, i, s.equipment, s.player); }),
    unequipItem: (s) => updateState(st => { unequipItem(st.equipment, s, st.inventory, st.player); }),
    dropItem: (i) => updateState(s => { 
        const item = s.inventory[i]; 
        item.x = s.player.x; item.y = s.player.y; 
        s.items.push(item); s.inventory.splice(i, 1); 
    }),
    // ... (Resto de acciones de crafting/compra se implementan igual con updateState)
    buyItem: (item) => updateState(s => { if(s.player.gold >= item.price) { s.player.gold -= item.price; addToInventory(s.inventory, item); addMessage("Comprado", 'pickup'); } }),
    sellItem: (i, p) => updateState(s => { s.inventory.splice(i,1); s.player.gold += p; addMessage("Vendido", 'pickup'); }),
    acceptQuest: (q) => { if(!activeQuests.includes(q.id)) setActiveQuests(p => [...p, q.id]); },
    completeQuest: (q) => { 
        if(activeQuests.includes(q.id)) {
            setActiveQuests(p => p.filter(id => id !== q.id));
            updateState(s => { s.player.gold += q.reward.gold || 0; s.player.exp += q.reward.exp || 0; });
            addMessage("Misión completada", 'levelup');
        }
    },
    craftItem: (key) => updateState(s => { if(craftItem(key, materials, s.inventory).success) addMessage("Creado", 'pickup'); }),
    upgradeItem: (slot) => updateState(s => { if(upgradeItem(s.equipment[slot], materials, s.player.gold).success) addMessage("Mejorado", 'levelup'); }),
    learnSkill: (id) => updateState(s => { if(learnSkill(s.player.skills, id).success) addMessage("Aprendido", 'levelup'); }),
    upgradeSkill: (id) => updateState(s => { if(upgradeSkill(s.player.skills, id).success) addMessage("Mejorado", 'levelup'); }),
    evolveClass: (cls) => updateState(s => { if(evolveClass(s.player.skills, cls).success) addMessage("Evolucionado", 'levelup'); }),
    
    // Setters directos
    setPlayerName, setSelectedSkill, setRangedMode, setRangedTargets,
    assignQuickSlot: (i, id) => setQuickSlots(p => assignToQuickSlot(p, i, id)),
    useQuickSlot: (i) => updateState(s => { useItem(s.inventory, processQuickSlot(quickSlots, i, s.inventory).itemIndex, s.player); }),
    selectCharacter: (key, app) => { setPlayerName(playerName || 'Héroe'); setSelectedAppearance(key); setPlayerClass(app.class); setGameStarted(true); },
    saveGame: () => { saveSystem(gameState, stats, activeQuests, completedQuests, questProgress, materials, quickSlots); addMessage("Guardado", 'info'); },
    loadGame: () => { const d = loadSystem(); if(d) { setGameState(d.gameState); setStats(d.stats); setGameStarted(true); } },
    restart: () => { setGameStarted(false); setGameState(null); setGameOver(false); }
  };

  useEffect(() => { if (gameStarted && !gameState) initGame(1); }, [gameStarted, gameState, initGame]);

  return { gameState, gameStarted, gameOver, messages, stats, playerInfo: { name: playerName, class: playerClass, appearance: selectedAppearance }, uiState: { activeQuests, completedQuests, questProgress, materials, quickSlots, selectedSkill, rangedMode, rangedTargets }, actions };
}