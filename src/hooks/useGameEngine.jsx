import { useState, useCallback, useEffect, useRef } from 'react';
import { usePlayer } from './usePlayer';
import { useDungeon } from './useDungeon';
import { useInventory } from './useInventory';
import { useTurnSystem } from './useTurnSystem';
import { soundManager } from '@/components/game/systems/SoundSystem';

// --- IMPORTACIONES DE DATOS ---
import { TILE, ENTITY } from '@/data/constants';
import { ENEMY_STATS } from '@/data/enemies';
import { SKILLS } from '@/data/skills'; 

// --- IMPORTACIONES DE SISTEMAS ---
import { MATERIAL_TYPES, generateMaterialDrop, generateBossDrop, craftItem, upgradeItem } from '@/components/game/systems/CraftingSystem';
import { useItem as useItemLogic, equipItem as equipItemLogic, unequipItem as unequipItemLogic, calculatePlayerStats } from '@/components/game/systems/ItemSystem';
import { useQuickSlot as processQuickSlot, assignToQuickSlot } from '@/components/game/ui/QuickSlots';
import { canUseSkill, learnSkill, upgradeSkill, evolveClass, calculateBuffBonuses, useSkill, getSkillEffectiveStats } from '../components/game/systems/SkillSystem';
import { QUESTS } from '@/components/game/systems/NPCSystem';
import { saveGame as saveSystem, loadGame as loadSystem } from '@/components/game/systems/SaveSystem';
import { EffectsManager } from '../components/game/systems/EffectSystem'; // <--- IMPORTADO AHORA QUE EXISTE


const LOG_LENGTH = 50;

export function useGameEngine() {
  // --- SUB-HOOKS ---
  const { player, setPlayer, initPlayer, updatePlayer, gainExp, regenerate: regenPlayer } = usePlayer();
  const { dungeon, setDungeon, generateLevel, updateMapFOV } = useDungeon();
  const { inventory, setInventory, equipment, setEquipment, materials, setMaterials, quickSlots, setQuickSlots, initInventory, addItem, addMaterial } = useInventory();
  const { processTurn } = useTurnSystem();

  // --- ESTADOS GLOBALES UI ---
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [messages, setMessages] = useState([]);
  
  // --- EFECTOS VISUALES ---
  const effectsManager = useRef(new EffectsManager());

  // Helper para añadir daño visual fácilmente
  const showFloatingText = useCallback((x, y, text, color) => {
    effectsManager.current.addText(x, y, text, color);
  }, []);
  
  // Progreso
  const [stats, setStats] = useState({ maxLevel: 1, kills: 0, gold: 0, playerLevel: 1 });
  const [activeQuests, setActiveQuests] = useState([]);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [questProgress, setQuestProgress] = useState({});
  
  // UI States
  const [selectedAppearance, setSelectedAppearance] = useState(null);
  const [playerClass, setPlayerClass] = useState('warrior');
  const [playerName, setPlayerName] = useState('');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [rangedMode, setRangedMode] = useState(false);
  const [rangedTargets, setRangedTargets] = useState([]);

  // --- MENSAJES ---
  const addMessage = useCallback((text, type = 'info') => {
    setMessages(prev => [...prev, { text, type }].slice(-LOG_LENGTH));
  }, []);

  // --- GAME LOOP / INICIALIZACIÓN ---
  const initGame = useCallback((level = 1, existingPlayer = null) => {
    if (!existingPlayer && !player) {
      initPlayer(null, playerClass, playerName);
    } else if (existingPlayer) {
      setPlayer({ ...existingPlayer, x: 0, y: 0 });
    }

    const pLevel = existingPlayer?.level || 1; 
    const newDungeon = generateLevel(level, pLevel);
    
    updatePlayer({ x: newDungeon.playerStart.x, y: newDungeon.playerStart.y, floor: level });
    updateMapFOV(newDungeon.playerStart.x, newDungeon.playerStart.y);

    if (level === 1 && !existingPlayer) addMessage(`¡Bienvenido, ${playerName || 'Héroe'}!`, 'info');
    else addMessage(`Piso ${level}`, 'info');

  }, [playerClass, playerName, generateLevel, initPlayer, updatePlayer, updateMapFOV, addMessage, player]);

  // --- LOGICA DE TURNO ---
  const executeTurn = useCallback((currentPlayerState = player, enemiesOverride = null) => {
    // 1. Regenerar Jugador
    regenPlayer();
    
    // 2. Construir estado del dungeon actualizado (si hay override, usamos esa lista de enemigos)
    const dungeonState = enemiesOverride ? { ...dungeon, enemies: enemiesOverride } : dungeon;

    // 3. Procesar Enemigos
    processTurn({
      dungeon: dungeonState, 
      setDungeon,
      player: currentPlayerState,
      setPlayer,
      addMessage,
      setGameOver,
      showFloatingText // <--- PASAR LA FUNCIÓN AL SISTEMA DE TURNOS
    });
    
    // 4. Actualizar FOV
    updateMapFOV(currentPlayerState.x, currentPlayerState.y);

  }, [dungeon, player, regenPlayer, processTurn, updateMapFOV, addMessage, setPlayer, setDungeon, showFloatingText]);

  // --- COMBATE ---
  const handleEnemyDeath = (enemyIdx) => {
    const enemy = dungeon.enemies[enemyIdx];
    if (!enemy) return dungeon.enemies; // Retornar lista actual si falla

    const info = ENEMY_STATS[enemy.type];
    
    // Eliminar enemigo y obtener la nueva lista
    const newEnemies = [...dungeon.enemies];
    newEnemies.splice(enemyIdx, 1);
    
    // Actualizar estado (para renderizado futuro)
    setDungeon(prev => ({ ...prev, enemies: newEnemies }));
    
    gainExp(info.exp);
    addMessage(`${info.name} derrotado! +${info.exp} XP`, 'death');
    
    const drops = enemy.isBoss ? generateBossDrop(enemy.type, dungeon.level) : generateMaterialDrop(enemy.type, dungeon.level);
    drops.forEach(d => {
      addMaterial(d.type, d.count);
      addMessage(`Botín: ${d.count} ${MATERIAL_TYPES[d.type]?.name}`, 'pickup');
    });

    if(enemy.isBoss) {
      setDungeon(prev => ({ ...prev, bossDefeated: true }));
      addMessage("¡Jefe de piso eliminado!", 'levelup');
    }
    
    setStats(prev => ({ ...prev, kills: prev.kills + 1 }));
    // Al ganar XP, comprobamos si subimos de nivel comparando con el estado anterior
    const prevLevel = player.level;
    gainExp(info.exp);
    
    return newEnemies;
  };

  // --- ACCIONES ---
  const actions = {
    move: (dx, dy) => {
    const nx = player.x + dx;
    const ny = player.y + dy;
    
    // Colisiones Mapa
    if (nx < 0 || nx >= dungeon.map[0].length || ny < 0 || ny >= dungeon.map.length || dungeon.map[ny][nx] === TILE.WALL) return;
    
    // Colisión Cofres
    if (dungeon.chests.some(c => c.x === nx && c.y === ny)) {
        addMessage("Un cofre bloquea el camino (Usa 'E')", 'info');
        return;
    }
    
    // --- COLISIÓN ENEMIGOS (COMBATE) ---
    const enemyIdx = dungeon.enemies.findIndex(e => e.x === nx && e.y === ny);
    if (enemyIdx !== -1) {
        const enemy = dungeon.enemies[enemyIdx];

        // 1. NUEVA LÓGICA: Verificar si hay habilidad Melee seleccionada
        if (selectedSkill && SKILLS[selectedSkill]) {
            const skill = SKILLS[selectedSkill];
            if (skill.type === 'melee') {
                // Verificar cooldown
                if (canUseSkill(selectedSkill, player.skills.cooldowns)) {
                    // Usar la función centralizada de ejecución de skills
                    const success = executeSkillAction(selectedSkill, enemy);
                    if (success) return; // Si funcionó, terminamos aquí (no hacemos ataque básico)
                } else {
                    addMessage("¡Habilidad en enfriamiento!", 'info');
                    return; // No atacamos si fallamos el CD (opcional, o podrías dejar pasar el básico)
                }
            }
        }

        const pStats = calculatePlayerStats(player);
        const buffs = calculateBuffBonuses(player.skills.buffs, pStats);
        
        // Cálculo de daño
        const dmg = Math.max(1, (pStats.attack + buffs.attackBonus) - enemy.defense + Math.floor(Math.random()*3));
        const isCrit = dmg > pStats.attack * 1.5; // Definimos criterio de crítico

        // 1. Sonido
        soundManager.play(isCrit ? 'critical' : 'attack'); // (Opcional: sonido distinto si tienes uno)

        // 2. Sangre (Visual)
        effectsManager.current.addBlood(nx, ny);

        // 3. Texto de Daño (Visual) - REEMPLAZADO
        effectsManager.current.addText(
            nx, 
            ny, 
            dmg, 
            isCrit ? '#ef4444' : '#fff', // Rojo vivo si es crit, blanco si no
            isCrit // Pasamos el flag para que el texto salte más
        );
        
        // Actualizamos HP localmente
        const newEnemies = [...dungeon.enemies];
        newEnemies[enemyIdx].hp -= dmg;
        setDungeon(prev => ({ ...prev, enemies: newEnemies }));
        
        addMessage(`Atacas a ${ENEMY_STATS[enemy.type].name}: ${dmg} daño`, 'player_damage');
        
        // Lógica de Muerte
        if (newEnemies[enemyIdx].hp <= 0) {
            soundManager.play('kill');
            // Explosión de polvo al morir
            effectsManager.current.addExplosion(nx, ny, '#52525b'); 
            
            const aliveEnemies = handleEnemyDeath(enemyIdx);
            executeTurn(player, aliveEnemies);
        } else {
            // Si vive, turno normal
            executeTurn(player);
        }
        return;
    }
    
    // Colisión NPC
    if (dungeon.npcs.some(n => n.x === nx && n.y === ny)) {
        addMessage("Un NPC bloquea el camino", 'info');
        return;
    }
    
    // --- MOVIMIENTO EXITOSO ---
    const nextPlayerState = { ...player, x: nx, y: ny };
    updatePlayer({ x: nx, y: ny });
    
    // --- RECOGER ITEMS ---
    const itemIdx = dungeon.items.findIndex(i => i.x === nx && i.y === ny);
    if (itemIdx !== -1) {
        const item = dungeon.items[itemIdx];
        
        if (item.category === 'currency') {
            soundManager.play('pickup');
            updatePlayer({ gold: player.gold + item.value });
            addMessage(`+${item.value} Oro`, 'pickup');
            
            // Texto flotante de Oro - REEMPLAZADO
            effectsManager.current.addText(nx, ny, `+${item.value}`, '#fbbf24');
            
        } else {
            soundManager.play('pickup');
            // Brillitos al recoger equipo/pociones
            effectsManager.current.addSparkles(nx, ny);
            
            addItem(item);
            addMessage(`Recogiste: ${item.name}`, 'pickup');
        }
        
        const newItems = [...dungeon.items];
        newItems.splice(itemIdx, 1);
        setDungeon(prev => ({ ...prev, items: newItems }));
    }
    
    executeTurn(nextPlayerState);
},
// --- NUEVAS ACCIONES PARA NPC Y MISIONES ---
    buyItem: (item) => {
      if (player.gold >= item.price) {
        // Usamos addItem del hook useInventory que ya tienes importado
        const success = addItem(item); 
        if (success) {
           updatePlayer({ gold: player.gold - item.price });
           addMessage(`Comprado: ${item.name}`, 'pickup');
           soundManager.play('pickup');
        } else {
           addMessage("Inventario lleno", 'info');
        }
      } else {
        addMessage("Oro insuficiente", 'info');
      }
    },
    
    sellItem: (index, price) => {
      const newInv = [...inventory];
      const item = newInv[index];
      if (!item) return;
      
      newInv.splice(index, 1);
      setInventory(newInv);
      updatePlayer({ gold: player.gold + price });
      addMessage(`Vendido: ${item.name} (+${price} oro)`, 'pickup');
      soundManager.play('pickup');
    },

    acceptQuest: (quest) => {
      if (!activeQuests.includes(quest.id) && !completedQuests.includes(quest.id)) {
        setActiveQuests(prev => [...prev, quest.id]);
        addMessage(`Misión aceptada: ${quest.name}`, 'info');
        soundManager.play('buff'); 
      }
    },

    completeQuest: (quest) => {
      // Dar recompensas
      let rewardText = "";
      
      if (quest.reward) {
        if (quest.reward.gold) {
           updatePlayer({ gold: player.gold + quest.reward.gold });
           rewardText += ` +${quest.reward.gold} Oro`;
        }
        if (quest.reward.exp) {
           gainExp(quest.reward.exp);
           rewardText += ` +${quest.reward.exp} XP`;
        }
        if (quest.reward.item) {
           addItem(quest.reward.item);
           rewardText += ` +${quest.reward.item.name}`;
        }
      }

      // Actualizar listas de misiones
      setActiveQuests(prev => prev.filter(q => q !== quest.id));
      setCompletedQuests(prev => [...prev, quest.id]);
      
      addMessage(`¡Misión completada!${rewardText}`, 'levelup');
      soundManager.play('levelUp');
    },
    interact: () => {
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];

      for (const [dx, dy] of dirs) {
        const tx = player.x + dx;
        const ty = player.y + dy;

        // --- INTERACCIÓN CON COFRES ---
        const chestIdx = dungeon.chests.findIndex(c => c.x === tx && c.y === ty);

        if (chestIdx !== -1) {
          const chest = dungeon.chests[chestIdx];

          if (chest.isOpen) {
            addMessage("Este cofre ya está vacío.", 'info');
            return null;
          }

          soundManager.play('chest'); 
          effectsManager.current.addSparkles(tx, ty, '#fbbf24');

          const item = chest.item;
          
          // Preparar actualizaciones
          let newItems = [...dungeon.items];
          
          if (item) {
            // Intentamos cogerlo
            const added = addItem(item);
            
            if (added) {
                addMessage(`Encontraste: ${item.name}`, 'pickup');
                effectsManager.current.addText(tx, ty, item.symbol || 'ITEM', '#fff');
            } else {
                // CORRECCIÓN: Si no cabe, cae al suelo
                addMessage("Inventario lleno. El objeto cayó al suelo.", 'info');
                // Añadir al suelo en la posición del cofre
                newItems.push({ ...item, x: tx, y: ty });
            }
          } else {
            addMessage("El cofre estaba vacío...", 'info');
          }

          // ACTUALIZAR ESTADO (Abrir cofre Y actualizar items de suelo si corresponde)
          setDungeon(prev => ({
            ...prev,
            items: newItems, // Lista de items actualizada (puede tener el nuevo o no)
            chests: prev.chests.map((c, i) => 
              i === chestIdx ? { ...c, isOpen: true } : c
            )
          }));
          
          return { type: 'chest' };
        }

        // --- INTERACCIÓN CON NPC ---
        const npc = dungeon.npcs.find(n => n.x === tx && n.y === ty);
        
        if (npc) {
          soundManager.play('speech');
          addMessage(`Hablando con ${npc.name}...`, 'info');
          return { type: 'npc', data: npc };
        }
      }

      addMessage("No hay nada aquí para interactuar.", 'info');
      return null;
    },

    wait: () => {
    if (selectedSkill && SKILLS[selectedSkill]) {
        const skill = SKILLS[selectedSkill];
        
        // Verificamos tipo de skill
        if (['self', 'aoe', 'ultimate', 'ranged'].includes(skill.type)) {
            
            // Verificamos Cooldown
            if (canUseSkill(selectedSkill, player.skills.cooldowns)) {
                
                // LÓGICA ESPECÍFICA PARA RANGED (Auto-aim al más cercano)
                let targetEnemy = null;
                if (skill.type === 'ranged') {
                    // Buscar enemigos visibles dentro de rango
                    const targets = dungeon.enemies.filter(e => {
                        const dist = Math.abs(e.x - player.x) + Math.abs(e.y - player.y);
                        return dist <= skill.range && dungeon.visible[e.y]?.[e.x];
                    }).sort((a, b) => {
                        // Ordenar por distancia
                        const distA = Math.abs(a.x - player.x) + Math.abs(a.y - player.y);
                        const distB = Math.abs(b.x - player.x) + Math.abs(b.y - player.y);
                        return distA - distB;
                    });

                    if (targets.length > 0) {
                        targetEnemy = targets[0]; // Seleccionar el más cercano
                    } else {
                        addMessage("No hay enemigos en rango", 'info');
                        return;
                    }
                }

                // Usamos la función executeSkillAction que ya gestiona todo
                // Nota: para 'self'/'aoe', targetEnemy será null, lo cual es correcto
                const success = executeSkillAction(selectedSkill, targetEnemy);
                
                // Si tuvo éxito, terminamos el turno (wait)
                if (success) return; 

            } else {
                addMessage("Habilidad no lista", 'info');
                return;
            }
        }
    }
},

    descend: (goUp) => {
      if (goUp && dungeon.stairsUp && player.x === dungeon.stairsUp.x && player.y === dungeon.stairsUp.y) {
        if (dungeon.level > 1) initGame(dungeon.level - 1, player);
        else addMessage("No puedes salir aún", 'info');
      } else if (!goUp && player.x === dungeon.stairs.x && player.y === dungeon.stairs.y) {
        if (dungeon.enemies.some(e => e.isBoss)) addMessage("¡Mata al jefe primero!", 'info');
        else initGame(dungeon.level + 1, player);
      } else {
        addMessage("No hay escaleras aquí", 'info');
      }
    },

    useItem: (index) => {
      const newInv = [...inventory];
      const res = useItemLogic(newInv, index, player);
      if (res.success) {
        setInventory(newInv);
        setPlayer({ ...player }); 
        res.effects.forEach(m => addMessage(m, 'heal'));
        showFloatingText(player.x, player.y, "Used", '#fff');
      } else {
        addMessage(res.message, 'info');
      }
    },
    
    saveGame: () => {
      saveSystem({ player, inventory, equipment, level: dungeon.level, bossDefeated: dungeon.bossDefeated }, stats, activeQuests, completedQuests, questProgress, materials, quickSlots);
      addMessage("Juego guardado", 'info');
    },
    
    selectCharacter: (k, a) => { soundManager.play('start_adventure'); setPlayerName(playerName || 'Héroe'); setSelectedAppearance(k); setPlayerClass(a.class); setGameStarted(true); },
    setPlayerName, setSelectedSkill, setRangedMode, setRangedTargets, 
    
    restart: () => { 
      setGameStarted(false); 
      setGameOver(false); 
      setPlayer(null); // Resetear jugador
      setMessages([]);
    },
    
    equipItem: (idx) => {
        // Llamamos a la lógica pura, pasándole el estado actual
        const res = equipItemLogic(inventory, idx, equipment, player);
        
        if(res.success) {
            // Actualizamos los tres estados con los nuevos objetos devueltos
            setInventory(res.newInventory); 
            setEquipment(res.newEquipment); 
            setPlayer(res.newPlayer);
            
            addMessage(res.message, 'pickup');
        } else {
            addMessage(res.message, 'info');
        }
    },

    unequipItem: (slot) => {
        const res = unequipItemLogic(equipment, slot, inventory, player);
        
        if(res.success) {
          soundManager.play('equip');
            setInventory(res.newInventory); 
            setEquipment(res.newEquipment); 
            setPlayer(res.newPlayer);
            
            addMessage(res.message, 'info');
        } else {
            addMessage(res.message, 'info');
        }
    },
    dropItem: (idx) => {
        const newInv = [...inventory];
        const item = newInv[idx];
        newInv.splice(idx, 1);
        setInventory(newInv);
        setDungeon(prev => ({ ...prev, items: [...prev.items, { ...item, x: player.x, y: player.y }] }));
        addMessage(`Soltaste ${item.name}`, 'info');
    },
    craftItem: (key) => {
        const newMats = { ...materials };
        const newInv = [...inventory];
        const res = craftItem(key, newMats, newInv);
        if(res.success) {
            setMaterials(newMats); setInventory(newInv);
            addMessage(res.message, 'pickup');
        } else addMessage(res.message, 'info');
    },
    upgradeItem: (slot) => {
        const newEq = { ...equipment };
        const item = newEq[slot];
        if(!item) return;
        const newMats = { ...materials };
        const res = upgradeItem(item, newMats, player.gold);
        if(res.success) {
            setMaterials(newMats); setEquipment(newEq); 
            updatePlayer({ gold: player.gold - res.goldCost });
            addMessage(res.message, 'levelup');
        } else addMessage(res.message, 'info');
    },
    assignQuickSlot: (idx, itemId) => setQuickSlots(prev => assignToQuickSlot(prev, idx, itemId)),
    useQuickSlot: (idx) => {
        const newInv = [...inventory];
        const res = processQuickSlot(quickSlots, idx, newInv);
        if (res.success) {
            const useRes = useItemLogic(newInv, res.itemIndex, player);
            if (useRes.success) {
                setInventory(newInv); setPlayer({...player});
                addMessage("Objeto rápido usado", 'heal');
            }
        }
    },
    learnSkill: (id) => {
        const newSkills = JSON.parse(JSON.stringify(player.skills));
        const res = learnSkill(newSkills, id);
        if(res.success) {
            updatePlayer({ skills: newSkills });
            addMessage("Habilidad aprendida", 'levelup');
        }
    },
    upgradeSkill: (id) => {
        const newSkills = JSON.parse(JSON.stringify(player.skills));
        const res = upgradeSkill(newSkills, id);
        if(res.success) {
            updatePlayer({ skills: newSkills });
            addMessage("Habilidad mejorada", 'levelup');
        }
    },
    evolveClass: (cls) => {
        const newSkills = JSON.parse(JSON.stringify(player.skills));
        const res = evolveClass(newSkills, cls);
        if(res.success) {
            updatePlayer({ skills: newSkills });
            addMessage("Clase evolucionada!", 'levelup');
        }
    },
    loadGame: () => {
        const d = loadSystem();
        if(d) {
            const { gameState: savedGS, stats: sStats, activeQuests: sAQ, completedQuests: sCQ, questProgress: sQP, materials: sMat, quickSlots: sQS } = d;
            setPlayer(savedGS.player);
            setDungeon({
                ...savedGS, 
                visible: Array(35).fill().map(() => Array(50).fill(false)),
                explored: Array(35).fill().map(() => Array(50).fill(false)), 
            });
            setInventory(savedGS.inventory);
            setEquipment(savedGS.equipment);
            setStats(sStats); setActiveQuests(sAQ); setCompletedQuests(sCQ); setQuestProgress(sQP); setMaterials(sMat); setQuickSlots(sQS);
            setGameStarted(true);
            addMessage("Juego cargado", 'info');
            updateMapFOV(savedGS.player.x, savedGS.player.y);
        }
    }
  };

  useEffect(() => {
    if (gameStarted && !player) {
      initGame(1);
    }
  }, [gameStarted, player, initGame]);

  // Detectar subida de nivel para efectos
  useEffect(() => {
    if (player && player.level > 1 && gameStarted) {
        soundManager.play('levelUp');
        effectsManager.current.addSparkles(player.x, player.y, '#ffff00');
        addMessage(`¡Nivel ${player.level} alcanzado!`, 'levelup');
    }
  }, [player?.level]); // Se dispara solo cuando cambia el nivel

  // Construir gameState para la UI
  const gameState = {
    player,
    map: dungeon.map,
    enemies: dungeon.enemies,
    items: dungeon.items,
    chests: dungeon.chests,
    torches: dungeon.torches,
    npcs: dungeon.npcs,
    stairs: dungeon.stairs,
    stairsUp: dungeon.stairsUp,
    visible: dungeon.visible,
    explored: dungeon.explored,
    level: dungeon.level,
    bossDefeated: dungeon.bossDefeated,
    inventory,
    equipment,
    questProgress,
    materials,
    effectsManager: effectsManager.current // <--- EXPORTADO
  };

  // --- LÓGICA CENTRAL DE EJECUCIÓN DE HABILIDADES ---
  const executeSkillAction = (skillId, targetEnemy = null) => {
    const skill = SKILLS[skillId];
    if (!skill) return false;

    // Obtener nivel y stats efectivos
    const level = player.skills?.skillLevels?.[skillId] || 1;
    const { manaCost } = getSkillEffectiveStats(skill, level);

    // 1. CHEQUEO DE MANÁ
    if (manaCost > 0 && player.mp < manaCost) {
        addMessage(`¡Falta Maná! (Req: ${manaCost})`, 'info');
        effectsManager.current.addText(player.x, player.y, "No MP", '#94a3b8');
        return false;
    }

    // 1. Calcular stats efectivos (con buffs)
    const pStats = calculatePlayerStats(player);
    const buffBonuses = calculateBuffBonuses(player.skills.buffs || [], pStats);
    const effectiveStats = {
        ...pStats,
        attack: pStats.attack + buffBonuses.attackBonus,
        defense: pStats.defense + buffBonuses.defenseBonus
    };

    // 2. Ejecutar habilidad
    const res = useSkill(skillId, player, effectiveStats, targetEnemy, dungeon.enemies, dungeon.visible);

    if (res.success) {
        soundManager.play('magic');

        // Coste de Maná
        if(skill.manaCost) updatePlayer({ mp: player.mp - skill.manaCost });

        // Cooldowns
        const newCooldowns = { ...player.skills.cooldowns, [skillId]: res.cooldown };
        updatePlayer({ skills: { ...player.skills, cooldowns: newCooldowns } });

        // Efectos Personales (Heal/Buff)
        if (res.heal) {
            updatePlayer({ hp: Math.min(player.maxHp, player.hp + res.heal) });
            effectsManager.current.addText(player.x, player.y, `+${res.heal}`, '#4ade80');
            effectsManager.current.addSparkles(player.x, player.y, '#4ade80');
        }
        if (res.buff) {
            const newBuffs = [...(player.skills.buffs || []), res.buff];
            updatePlayer({ skills: { ...player.skills, buffs: newBuffs } });
            effectsManager.current.addSparkles(player.x, player.y, '#fbbf24');
            effectsManager.current.addText(player.x, player.y, 'BUFF', '#fbbf24');
        }

        // Efectos de Daño (Melee, Ranged, AoE)
        let currentEnemiesList = [...dungeon.enemies];
        if (res.damages && res.damages.length > 0) {
            res.damages.forEach(dmgInfo => {
                const idx = currentEnemiesList.indexOf(dmgInfo.target);
                if (idx !== -1) {
                    const enemy = currentEnemiesList[idx];
                    
                    // Daño y Efectos
                    enemy.hp -= dmgInfo.damage;
                    effectsManager.current.addExplosion(enemy.x, enemy.y, '#a855f7');
                    effectsManager.current.addText(enemy.x, enemy.y, dmgInfo.damage, '#a855f7', true);
                    
                    if (dmgInfo.stun) enemy.stunned = dmgInfo.stun;
                    if (dmgInfo.slow) enemy.slowed = dmgInfo.slow;

                    // Muerte
                    if (enemy.hp <= 0) {
                        currentEnemiesList = handleEnemyDeath(idx);
                        soundManager.play('kill');
                        effectsManager.current.addExplosion(enemy.x, enemy.y, '#52525b');
                    }
                }
            });
        }

        addMessage(res.message, 'player_damage');
        setSelectedSkill(null); // Deseleccionar tras uso
        executeTurn(player, currentEnemiesList); // Pasar turno
        return true;
    } else {
        addMessage(res.message, 'info');
        return false;
    }
  };

  return {
    gameState,
    gameStarted,
    gameOver,
    messages,
    stats,
    playerInfo: { name: playerName, class: playerClass, appearance: selectedAppearance },
    uiState: { activeQuests, completedQuests, questProgress, materials, quickSlots, selectedSkill, rangedMode, rangedTargets },
    actions
  };
}