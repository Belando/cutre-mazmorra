import { useState, useCallback, useEffect } from 'react';
import { generateDungeon, TILE, ENTITY, ENEMY_STATS, scaleEnemyStats } from '@/components/game/DungeonGenerator';
import { 
  addToInventory, useItem, equipItem, unequipItem, calculatePlayerStats 
} from '@/components/game/ItemSystem';
import { 
  useQuickSlot as processQuickSlot, assignToQuickSlot 
} from '@/components/game/QuickSlots';
import { generateNPCs, QUESTS } from '@/components/game/NPCSystem';
import { processEnemyTurn, calculateEnemyDamage, getEnemyRangedInfo } from '@/components/game/EnemyAI';
import { generateMaterialDrop, generateBossDrop, MATERIAL_TYPES, craftItem, upgradeItem } from '@/components/game/CraftingSystem';
import { 
  initializeSkills, useSkill, canUseSkill, updateCooldowns, updateBuffs, 
  calculateBuffBonuses, getLearnableSkills, learnSkill, upgradeSkill, evolveClass, SKILLS 
} from '@/components/game/SkillSystem';
import { saveGame as saveSystem, loadGame as loadSystem } from '@/components/game/SaveSystem';

const MAP_WIDTH = 50;
const MAP_HEIGHT = 35;

export function useGameEngine() {
  // --- ESTADO PRINCIPAL ---
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  
  // --- ESTADO DE PROGRESO ---
  const [stats, setStats] = useState({ maxLevel: 1, kills: 0, gold: 0, playerLevel: 1 });
  const [activeQuests, setActiveQuests] = useState([]);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [questProgress, setQuestProgress] = useState({});
  const [materials, setMaterials] = useState({});
  const [quickSlots, setQuickSlots] = useState([null, null, null]);
  
  // --- JUGADOR Y UI ---
  const [playerName, setPlayerName] = useState('');
  const [selectedAppearance, setSelectedAppearance] = useState(null);
  const [playerClass, setPlayerClass] = useState('warrior');
  const [rangedMode, setRangedMode] = useState(false);
  const [rangedTargets, setRangedTargets] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);

  const addMessage = useCallback((text, type = 'info') => {
    setMessages(prev => [...prev.slice(-50), { text, type }]);
  }, []);

  // --- INICIALIZAR ---
  const initGame = useCallback((level = 1, existingPlayer = null, existingInventory = null, existingEquipment = null) => {
    const dungeon = generateDungeon(MAP_WIDTH, MAP_HEIGHT, level);
    
    const classAttributes = {
      warrior: { strength: 10, dexterity: 5, intelligence: 3 },
      mage: { strength: 3, dexterity: 5, intelligence: 10 },
      rogue: { strength: 5, dexterity: 10, intelligence: 3 },
    };
    const baseAttrs = classAttributes[playerClass] || classAttributes.warrior;
    
    const player = existingPlayer || {
      x: dungeon.playerStart.x,
      y: dungeon.playerStart.y,
      hp: 50, maxHp: 50, mp: 30, maxMp: 30,
      attack: 8, baseAttack: 8, defense: 3, baseDefense: 3,
      equipAttack: 0, equipDefense: 0, equipMaxHp: 0,
      exp: 0, level: 1, gold: 0,
      name: playerName || 'Héroe',
      floor: level,
      appearance: selectedAppearance,
      class: playerClass,
      ...baseAttrs,
      skills: initializeSkills(playerClass)
    };
    
    if (existingPlayer) {
      player.x = dungeon.playerStart.x;
      player.y = dungeon.playerStart.y;
      player.floor = level;
    }
    
    const npcs = generateNPCs(level, dungeon.rooms, dungeon.map, [0, dungeon.rooms.length - 1]);
    const inventory = existingInventory || [];
    const equipment = existingEquipment || {
      weapon: null, offhand: null, helmet: null, chest: null, legs: null, 
      boots: null, gloves: null, ring: null, earring: null, necklace: null,
    };
    
    const enemies = [];
    const playerLvl = existingPlayer?.level || 1;
    
    for (let y = 0; y < dungeon.entities.length; y++) {
      for (let x = 0; x < dungeon.entities[0].length; x++) {
        const entity = dungeon.entities[y][x];
        if (entity >= ENTITY.ENEMY_RAT) {
          const baseStats = ENEMY_STATS[entity];
          if (baseStats) {
            const scaledStats = scaleEnemyStats(baseStats, playerLvl, level);
            enemies.push({
              x, y,
              type: entity,
              ...scaledStats,
              isBoss: baseStats.isBoss || false,
              stunned: 0,
            });
          }
        }
      }
    }

    const visible = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(false));
    const explored = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(false));

    const newState = {
      map: dungeon.map,
      entities: dungeon.entities,
      enemies,
      items: dungeon.items || [],
      chests: dungeon.chests || [],
      torches: dungeon.torches || [],
      npcs,
      player,
      inventory,
      equipment,
      visible,
      explored,
      stairs: dungeon.stairs,
      stairsUp: dungeon.stairsUp,
      level,
      bossDefeated: false,
      questProgress,
      materials,
    };

    updateVisibilityState(newState);
    setGameState(newState);
    
    if (level === 1 && !existingPlayer) {
      addMessage(`¡Bienvenido, ${player.name}! La mazmorra te espera...`, 'info');
    } else {
      addMessage(`Has llegado al piso ${level}.`, 'info');
    }
  }, [addMessage, playerName, questProgress, selectedAppearance, playerClass, materials]);

  const updateVisibilityState = (state) => {
    const { player, map, visible, explored } = state;
    const radius = 6;

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) visible[y][x] = false;
    }

    for (let angle = 0; angle < 360; angle += 2) {
      const rad = angle * Math.PI / 180;
      const dx = Math.cos(rad);
      const dy = Math.sin(rad);
      let x = player.x + 0.5;
      let y = player.y + 0.5;

      for (let i = 0; i < radius; i++) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);

        if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) break;

        visible[tileY][tileX] = true;
        explored[tileY][tileX] = true;

        if (map[tileY][tileX] === TILE.WALL) break;
        x += dx;
        y += dy;
      }
    }
  };

  const updateVisibility = (state) => {
    updateVisibilityState(state);
  };

  const checkLevelUp = (player) => {
    const expNeeded = player.level * 25;
    if (player.exp >= expNeeded) {
        player.level++;
        player.exp -= expNeeded;
        player.maxHp += 10; player.hp = player.maxHp;
        player.maxMp += 5; player.mp = player.maxMp;
        player.baseAttack += 2;
        player.baseDefense += 1;
        
        player.skills.skillPoints = (player.skills.skillPoints || 0) + 1;
        
        addMessage(`¡NIVEL ALCANZADO! Ahora eres nivel ${player.level}`, 'levelup');
        
        const learnable = getLearnableSkills(player.level, player.class, player.skills.learned, player.skills.evolvedClass);
        learnable.forEach(skill => {
            player.skills.learned.push(skill.id);
            player.skills.skillLevels[skill.id] = 1;
            addMessage(`¡Nueva habilidad aprendida: ${skill.name}!`, 'levelup');
        });

        if (player.level === 10 && !player.skills.evolvedClass) {
            addMessage('¡Evolución de clase disponible! (Pulsa T)', 'levelup');
        }
    }
  };

  const updateQuestProgress = (type, target, amount = 1) => {
    activeQuests.forEach(qId => {
        const quest = QUESTS[qId];
        if (!quest) return;
        
        if (quest.targetType === type) {
            if (type === 'kill' || type === 'boss') {
                 setQuestProgress(prev => {
                    const current = prev[qId];
                    if (typeof current === 'object') return prev; 
                    return { ...prev, [qId]: (prev[qId] || 0) + amount };
                 });
            }
        }
    });
  };

  const handleEnemyDeath = (state, enemyIndex) => {
    const enemy = state.enemies[enemyIndex];
    const stats = ENEMY_STATS[enemy.type];
    
    state.enemies.splice(enemyIndex, 1);
    state.player.exp += stats.exp;
    setStats(s => ({ ...s, kills: s.kills + 1 }));
    addMessage(`¡${stats.name} derrotado! +${stats.exp} XP`, 'death');

    const drops = enemy.isBoss ? generateBossDrop(enemy.type, state.level) : generateMaterialDrop(enemy.type, state.level);
    drops.forEach(drop => {
        state.materials[drop.type] = (state.materials[drop.type] || 0) + drop.count;
        addMessage(`Recogido: ${drop.count} ${MATERIAL_TYPES[drop.type]?.name || drop.type}`, 'pickup');
    });

    if (enemy.isBoss) {
        state.bossDefeated = true;
        addMessage('🎉 ¡JEFE ELIMINADO! El camino está libre.', 'levelup');
        updateQuestProgress('boss', enemy.type, 1);
    } else {
        updateQuestProgress('kill', enemy.type, 1);
    }

    checkLevelUp(state.player);
  };

  const moveEnemies = useCallback((state) => {
    const { enemies, player, map, visible } = state;
    const playerStats = calculatePlayerStats(player);

    enemies.forEach(enemy => {
      const action = processEnemyTurn(enemy, player, enemies, map, visible, addMessage);
      
      if (action.action === 'melee_attack' || action.action === 'ranged_attack') {
        const enemyStats = ENEMY_STATS[enemy.type];
        let dmgResult;
        
        if (action.action === 'ranged_attack') {
           const baseDmg = Math.floor(enemy.attack * 0.7);
           dmgResult = calculateEnemyDamage({...enemy, attack: baseDmg}, player, playerStats, player.skills?.buffs || []);
        } else {
           dmgResult = calculateEnemyDamage(enemy, player, playerStats, player.skills?.buffs || []);
        }

        if (dmgResult.evaded) {
          addMessage(`¡Has esquivado el ataque de ${enemyStats.name}!`, 'info');
        } else {
          state.player.hp -= dmgResult.damage;
          const attackName = action.action === 'ranged_attack' ? (getEnemyRangedInfo(enemy.type)?.name || 'ataque') : 'te golpea';
          addMessage(`${enemyStats.name} ${attackName} infligiendo ${dmgResult.damage} de daño`, 'enemy_damage');
        }
      }
    });
  }, [addMessage]);

  const endPlayerTurn = (state) => {
    state.player.mp = Math.min((state.player.mp || 0) + 1, state.player.maxMp || 30);
    
    if (state.player.skills) {
        state.player.skills.cooldowns = updateCooldowns(state.player.skills.cooldowns || {});
        state.player.skills.buffs = updateBuffs(state.player.skills.buffs || []);
    }

    moveEnemies(state);
    updateVisibility(state);

    if (state.player.hp <= 0) {
        setGameOver(true);
        addMessage('Has caído en combate...', 'death');
    }
  };

  const handlePlayerAttack = (state, enemyIndex) => {
    const { player, enemies } = state;
    const enemy = enemies[enemyIndex];
    const enemyStats = ENEMY_STATS[enemy.type];
    const playerStats = calculatePlayerStats(player);
    const buffBonuses = calculateBuffBonuses(player.skills?.buffs || [], playerStats);
    const totalAttack = playerStats.attack + buffBonuses.attackBonus;

    let skillUsed = false;
    
    if (selectedSkill && canUseSkill(selectedSkill, player.skills?.cooldowns || {})) {
        const skill = SKILLS[selectedSkill];
        if (skill && skill.type === 'melee') {
            const result = useSkill(selectedSkill, player, { ...playerStats, attack: totalAttack }, enemy, enemies, state.visible);
            if (result.success) {
                player.skills.cooldowns[selectedSkill] = result.cooldown;
                result.damages.forEach(d => {
                    d.target.hp -= d.damage;
                    if (d.stun) d.target.stunned = d.stun;
                });
                addMessage(result.message, 'player_damage');
                setSelectedSkill(null);
                skillUsed = true;
            }
        }
    } 
    
    if (!skillUsed && enemy.hp > 0) {
        const damage = Math.max(1, totalAttack - enemy.defense + Math.floor(Math.random() * 4));
        enemy.hp -= damage;
        addMessage(`¡Golpeas a ${enemyStats.name} por ${damage} de daño!`, 'player_damage');
    }

    if (enemy.hp <= 0) {
        handleEnemyDeath(state, enemyIndex);
    }
  };

  const checkInteractions = (state, x, y) => {
    const chest = state.chests.find(c => c.x === x && c.y === y && !c.opened);
    if (chest) {
        chest.opened = true;
        const result = addToInventory(state.inventory, chest.item);
        if (result.success) {
            addMessage(`¡Cofre abierto! Obtienes: ${chest.item.name}`, 'pickup');
        } else {
            chest.item.x = x; chest.item.y = y;
            state.items.push(chest.item);
            addMessage('Inventario lleno. El objeto cae al suelo.', 'info');
        }
    }

    const itemIdx = state.items.findIndex(i => i.x === x && i.y === y);
    if (itemIdx !== -1) {
        const item = state.items[itemIdx];
        if (item.category === 'currency') {
            state.player.gold += item.value;
            setStats(s => ({ ...s, gold: s.gold + item.value }));
            addMessage(`+${item.value} Oro`, 'pickup');
            state.items.splice(itemIdx, 1);
        } else {
            const result = addToInventory(state.inventory, item);
            if (result.success) {
                addMessage(`Recogido: ${item.name}`, 'pickup');
                state.items.splice(itemIdx, 1);
            } else {
                addMessage('Inventario lleno, no puedes recoger eso.', 'info');
            }
        }
    }
  };

  const handleMove = useCallback((dx, dy) => {
    if (!gameState || gameOver) return;

    setGameState(prevState => {
      const state = JSON.parse(JSON.stringify(prevState));
      const { player, map, enemies } = state;
      
      const newX = player.x + dx;
      const newY = player.y + dy;

      if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) return prevState;
      if (map[newY][newX] === TILE.WALL) return prevState;

      const enemyIndex = enemies.findIndex(e => e.x === newX && e.y === newY);
      if (enemyIndex !== -1) {
        handlePlayerAttack(state, enemyIndex);
      } else {
        const npc = state.npcs?.find(n => n.x === newX && n.y === newY);
        if (!npc) {
          player.x = newX;
          player.y = newY;
          
          checkInteractions(state, newX, newY);
          
          if (state.stairs && newX === state.stairs.x && newY === state.stairs.y) {
             const bossAlive = state.enemies.some(e => e.isBoss);
             if (bossAlive) addMessage('⚠️ ¡El Jefe protege las escaleras!', 'info');
             else addMessage('Pulsa ENTER para bajar.', 'info');
          }
          if (state.stairsUp && newX === state.stairsUp.x && newY === state.stairsUp.y) {
             addMessage('Pulsa SHIFT+ENTER para subir.', 'info');
          }

        } else {
          addMessage(`Hablas con ${npc.name}.`, 'info');
          return prevState; 
        }
      }
      
      endPlayerTurn(state);
      return state;
    });
  }, [gameState, gameOver, addMessage, selectedSkill, moveEnemies]);

  const actions = {
    move: handleMove,
    wait: () => {
        if (!gameState || gameOver) return;
        
        if (selectedSkill) {
            const skill = SKILLS[selectedSkill];
            if (skill && ['self', 'aoe', 'ultimate'].includes(skill.type)) {
                setGameState(prev => {
                    const state = JSON.parse(JSON.stringify(prev));
                    
                    if (!canUseSkill(selectedSkill, state.player.skills.cooldowns || {})) {
                        addMessage("¡Habilidad en enfriamiento!", 'info');
                        return prev;
                    }
                    if (skill.manaCost && (state.player.mp || 0) < skill.manaCost) {
                        addMessage("¡No tienes suficiente maná!", 'info');
                        return prev;
                    }

                    const playerStats = calculatePlayerStats(state.player);
                    const buffBonuses = calculateBuffBonuses(state.player.skills.buffs || [], playerStats);
                    const effectiveStats = { 
                        ...playerStats, 
                        attack: playerStats.attack + buffBonuses.attackBonus 
                    };

                    const result = useSkill(selectedSkill, state.player, effectiveStats, null, state.enemies, state.visible);

                    if (result.success) {
                        if (!state.player.skills.cooldowns) state.player.skills.cooldowns = {};
                        state.player.skills.cooldowns[selectedSkill] = result.cooldown;
                        if (skill.manaCost) state.player.mp -= skill.manaCost;

                        if (result.heal) {
                            state.player.hp = Math.min(state.player.hp + result.heal, state.player.maxHp);
                        }
                        
                        if (result.buff) {
                            if (!state.player.skills.buffs) state.player.skills.buffs = [];
                            state.player.skills.buffs.push(result.buff);
                        }

                        if (result.damages) {
                            result.damages.forEach(d => {
                                d.target.hp -= d.damage;
                                if (d.stun) d.target.stunned = d.stun;
                                if (d.slow) d.target.slowed = d.slow;
                            });
                        }

                        addMessage(result.message, 'player_damage');
                        setSelectedSkill(null);

                        for (let i = state.enemies.length - 1; i >= 0; i--) {
                            if (state.enemies[i].hp <= 0) {
                                handleEnemyDeath(state, i);
                            }
                        }

                        endPlayerTurn(state);
                        return state;
                    } else {
                        addMessage(result.message, 'info');
                        return prev;
                    }
                });
                return;
            }
        }

        setGameState(prev => {
            const state = JSON.parse(JSON.stringify(prev));
            addMessage('Esperas un momento...', 'info');
            endPlayerTurn(state);
            return state;
        });
    },
    descend: (goUp = false) => {
        if (!gameState) return;
        const { player, stairs, stairsUp, level, inventory, equipment, enemies } = gameState;
        
        if (goUp && stairsUp && player.x === stairsUp.x && player.y === stairsUp.y) {
             if (level > 1) {
                 initGame(level - 1, player, inventory, equipment);
             } else {
                 addMessage('No puedes salir de la mazmorra aún.', 'info');
             }
             return;
        }

        if (player.x === stairs.x && player.y === stairs.y) {
            if (enemies.some(e => e.isBoss)) {
                addMessage('¡Debes derrotar al jefe de piso primero!', 'info');
                return;
            }
            setStats(s => ({ ...s, maxLevel: Math.max(s.maxLevel, level + 1) }));
            initGame(level + 1, player, inventory, equipment);
        } else {
            addMessage('No hay escaleras aquí.', 'info');
        }
    },
    useItem: (index) => {
        setGameState(prev => {
            const state = JSON.parse(JSON.stringify(prev));
            const result = useItem(state.inventory, index, state.player);
            if (result.success) {
                result.effects.forEach(msg => addMessage(msg, 'heal'));
            } else {
                addMessage(result.message, 'info');
            }
            return state;
        });
    },
    equipItem: (index) => {
        setGameState(prev => {
            const state = JSON.parse(JSON.stringify(prev));
            const result = equipItem(state.inventory, index, state.equipment, state.player);
            addMessage(result.message, result.success ? 'pickup' : 'info');
            return state;
        });
    },
    unequipItem: (slot) => {
        setGameState(prev => {
            const state = JSON.parse(JSON.stringify(prev));
            const result = unequipItem(state.equipment, slot, state.inventory, state.player);
            addMessage(result.message, 'info');
            return state;
        });
    },
    dropItem: (index) => {
        setGameState(prev => {
            const state = JSON.parse(JSON.stringify(prev));
            const item = state.inventory[index];
            if (item) {
                item.x = state.player.x; item.y = state.player.y;
                state.items.push(item);
                state.inventory.splice(index, 1);
                addMessage(`Has soltado: ${item.name}`, 'info');
            }
            return state;
        });
    },
    // --- ACCIONES DE COMERCIO Y MISIONES NUEVAS ---
    buyItem: (item) => {
        setGameState(prev => {
            const state = JSON.parse(JSON.stringify(prev));
            if (state.player.gold >= item.price) {
                const res = addToInventory(state.inventory, { ...item, id: `${item.id}_${Date.now()}` });
                if (res.success) {
                    state.player.gold -= item.price;
                    addMessage(`Comprado: ${item.name}`, 'pickup');
                } else {
                    addMessage("Inventario lleno", 'info');
                }
            } else {
                addMessage("No tienes suficiente oro", 'info');
            }
            return state;
        });
    },
    sellItem: (index, price) => {
        setGameState(prev => {
            const state = JSON.parse(JSON.stringify(prev));
            const item = state.inventory[index];
            if (item) {
                state.inventory.splice(index, 1);
                state.player.gold += price;
                addMessage(`Vendido: ${item.name} por ${price} oro`, 'pickup');
            }
            return state;
        });
    },
    acceptQuest: (quest) => {
        if (!activeQuests.includes(quest.id) && !completedQuests.includes(quest.id)) {
            setActiveQuests(prev => [...prev, quest.id]);
            addMessage(`Misión aceptada: ${quest.name}`, 'levelup');
        }
    },
    completeQuest: (quest) => {
        if (activeQuests.includes(quest.id)) {
            // Eliminar de activas, mover a completadas
            setActiveQuests(prev => prev.filter(q => q !== quest.id));
            setCompletedQuests(prev => [...prev, quest.id]);
            
            // Otorgar recompensas
            setGameState(prev => {
                const state = JSON.parse(JSON.stringify(prev));
                if (quest.reward.gold) {
                    state.player.gold += quest.reward.gold;
                    addMessage(`Recompensa: ${quest.reward.gold} oro`, 'pickup');
                }
                if (quest.reward.exp) {
                    state.player.exp += quest.reward.exp;
                    addMessage(`Recompensa: ${quest.reward.exp} XP`, 'levelup');
                }
                if (quest.reward.item) {
                    addToInventory(state.inventory, { ...quest.reward.item, id: `reward_${Date.now()}` });
                    addMessage(`Recompensa: ${quest.reward.item.name}`, 'pickup');
                }
                
                checkLevelUp(state.player);
                addMessage(`¡Misión completada: ${quest.name}!`, 'levelup');
                return state;
            });
        }
    },
    // ----------------------------------------------
    saveGame: () => {
        if (gameState) {
            const result = saveSystem(gameState, stats, activeQuests, completedQuests, questProgress, materials, quickSlots);
            addMessage(result.message, result.success ? 'levelup' : 'info');
        }
    },
    loadGame: () => {
        const data = loadSystem();
        if (data && data.gameState) {
            setPlayerName(data.gameState.player.name);
            setSelectedAppearance(data.gameState.player.appearance);
            setPlayerClass(data.gameState.player.class);
            setStats(data.stats);
            setActiveQuests(data.activeQuests || []);
            setCompletedQuests(data.completedQuests || []);
            setQuestProgress(data.questProgress || {});
            setMaterials(data.materials || {});
            setQuickSlots(data.quickSlots || [null, null, null]);
            initGame(data.gameState.level, data.gameState.player, data.gameState.inventory, data.gameState.equipment);
            setGameStarted(true);
            addMessage('Partida cargada correctamente.', 'levelup');
        } else {
            addMessage('No se encontró ninguna partida guardada.', 'info');
        }
    },
    restart: () => {
        setGameOver(false);
        setMessages([]);
        setGameStarted(false);
        setGameState(null);
    },
    selectCharacter: (appearanceKey, appearance) => {
        const name = (playerName && playerName.trim()) ? playerName.trim() : (appearance.name || 'Héroe');
        setPlayerName(name);
        setSelectedAppearance(appearanceKey);
        setPlayerClass(appearance.class);
        setGameStarted(true);
    },
    setPlayerName,
    setSelectedSkill,
    setRangedMode,
    setRangedTargets,
    assignQuickSlot: (idx, itemId) => setQuickSlots(prev => assignToQuickSlot(prev, idx, itemId)),
    useQuickSlot: (idx) => {
        if (!gameState) return;
        const res = processQuickSlot(quickSlots, idx, gameState.inventory, gameState.player);
        if (res.clearSlot) {
            setQuickSlots(prev => { const n = [...prev]; n[idx] = null; return n; });
        } else if (res.success) {
            actions.useItem(res.itemIndex);
        } else {
            addMessage(res.message, 'info');
        }
    },
    craftItem: (recipeKey) => {
        const res = craftItem(recipeKey, materials, gameState.inventory);
        if (res.success) {
            setMaterials({...materials});
            setGameState(prev => ({...prev}));
            addMessage(res.message, 'pickup');
        } else {
            addMessage(res.message, 'info');
        }
    },
    upgradeItem: (slot) => {
        const item = gameState.equipment[slot];
        if (!item) return;
        const res = upgradeItem(item, materials, gameState.player.gold);
        if (res.success) {
            setMaterials({...materials});
            setGameState(prev => {
                const s = JSON.parse(JSON.stringify(prev));
                s.player.gold -= res.goldCost;
                return s;
            });
            addMessage(res.message, 'levelup');
        } else {
            addMessage(res.message, 'info');
        }
    },
    learnSkill: (skillId) => {
        setGameState(prev => {
            const s = JSON.parse(JSON.stringify(prev));
            const res = learnSkill(s.player.skills, skillId);
            if (res.success) addMessage(res.message, 'levelup');
            return s;
        });
    },
    upgradeSkill: (skillId) => {
        setGameState(prev => {
            const s = JSON.parse(JSON.stringify(prev));
            const res = upgradeSkill(s.player.skills, skillId);
            if (res.success) addMessage(res.message, 'levelup');
            return s;
        });
    },
    evolveClass: (newClass) => {
        setGameState(prev => {
            const s = JSON.parse(JSON.stringify(prev));
            const res = evolveClass(s.player.skills, newClass);
            if (res.success) {
                addMessage(res.message, 'levelup');
            }
            return s;
        });
    }
  };

  useEffect(() => {
    if (gameStarted && !gameState) {
        initGame(1);
    }
  }, [gameStarted, gameState, initGame]);

  return {
    gameState,
    gameStarted,
    gameOver,
    messages,
    stats,
    playerInfo: { 
      name: playerName, 
      class: playerClass, 
      appearance: selectedAppearance 
    },
    uiState: {
      activeQuests,
      completedQuests,
      questProgress,
      materials,
      quickSlots,
      selectedSkill,
      rangedMode,
      rangedTargets
    },
    actions
  };
}