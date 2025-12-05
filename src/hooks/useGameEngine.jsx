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
import { canUseSkill, learnSkill, upgradeSkill, evolveClass, calculateBuffBonuses, useSkill } from '../components/game/systems/SkillSystem';
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

    interact: () => {
    // Buscamos en las 4 direcciones adyacentes al jugador
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];

    for (const [dx, dy] of dirs) {
        const tx = player.x + dx;
        const ty = player.y + dy;

        // --- 1. INTERACCIÓN CON COFRES ---
        const chestIdx = dungeon.chests.findIndex(c => c.x === tx && c.y === ty);

        if (chestIdx !== -1) {
            const chest = dungeon.chests[chestIdx];

            // A) Si el cofre YA está abierto, no hacemos nada o avisamos
            if (chest.isOpen) {
                addMessage("Este cofre ya está vacío.", 'info');
                return;
            }

            // B) Abrir cofre (Lógica visual y sonora)
            soundManager.play('chest'); 
            effectsManager.current.addSparkles(tx, ty, '#fbbf24');

            // C) Lógica de Loot (Tu lógica original)
            const isGold = Math.random() > 0.3;

            if (isGold) {
                const goldAmount = 15 + Math.floor(Math.random() * 50);
                updatePlayer({ gold: player.gold + goldAmount });
                addMessage(`Cofre abierto: +${goldAmount} Oro`, 'pickup');
                effectsManager.current.addText(tx, ty, `+${goldAmount}`, '#fbbf24');
            } else {
                const potion = {
                    id: Date.now(),
                    name: 'Poción de Vida',
                    type: 'potion',
                    effect: 'heal',
                    value: 30,
                    icon: 'potion_red',
                    description: 'Recupera 30 HP'
                };
                addItem(potion);
                addMessage(`Encontraste: ${potion.name}`, 'pickup');
                effectsManager.current.addText(tx, ty, 'ITEM!', '#fff');
            }

            // D) ACTUALIZAR EL ESTADO DEL COFRE (Sin borrarlo)
            // Creamos una copia del array de cofres y modificamos solo el que tocamos
            setDungeon(prev => ({
                ...prev,
                chests: prev.chests.map((c, i) => 
                    i === chestIdx ? { ...c, isOpen: true } : c
                )
            }));

            // Nota: En tu componente de Renderizado (Map/Grid), asegúrate de pintar 
            // el sprite de 'cofre abierto' si c.isOpen es true.
            
            return; // Terminamos la interacción
        }

        // --- 2. INTERACCIÓN CON NPC ---
        const npc = dungeon.npcs.find(n => n.x === tx && n.y === ty);
        
        if (npc) {
            // Reproducir sonido opcional
            soundManager.play('speech'); // O el sonido que prefieras

            // A) Mostrar mensaje inicial (opcional)
            addMessage(`Hablando con ${npc.name}...`, 'info');

            // B) ABRIR LA UI DEL DIÁLOGO
            // Asumo que tienes un estado para controlar qué NPC se muestra y si el modal está abierto
            // Ejemplo:
            setCurrentNpc(npc);      // Guardamos con QUIÉN hablamos
            setIsDialogActive(true); // Abrimos la ventana/modal
            
            return;
        }
    }

    // Si no encontró nada alrededor
    addMessage("No hay nada aquí para interactuar.", 'info');
},

    wait: () => {
    if (selectedSkill && SKILLS[selectedSkill]) {
        const skill = SKILLS[selectedSkill];
        
        // Verificamos tipo de skill
        if (['self', 'aoe', 'ultimate'].includes(skill.type)) {
            
            // Verificamos Cooldown
            if (canUseSkill(selectedSkill, player.skills.cooldowns)) {
                const pStats = calculatePlayerStats(player);
                const res = useSkill(selectedSkill, player, pStats, null, dungeon.enemies, dungeon.visible);
                
                if (res.success) {
                    soundManager.play('magic'); // Sonido base

                    // 1. Coste de Maná
                    if(skill.manaCost) {
                        updatePlayer({ mp: player.mp - skill.manaCost });
                    }

                    // 2. Actualizar Cooldowns
                    const newCooldowns = { ...player.skills.cooldowns, [selectedSkill]: res.cooldown };
                    updatePlayer({ skills: { ...player.skills, cooldowns: newCooldowns } });
                    
                    // 3. Efectos de Curación (Self)
                    if (res.heal) {
                        updatePlayer({ hp: Math.min(player.maxHp, player.hp + res.heal) });
                        // Texto verde flotante
                        effectsManager.current.addText(player.x, player.y, `+${res.heal}`, '#4ade80');
                        // Brillitos verdes
                        effectsManager.current.addSparkles(player.x, player.y, '#4ade80');
                    }

                    // 4. Efectos de Buff (Self)
                    if (res.buff) {
                        const newBuffs = [...(player.skills.buffs || []), res.buff];
                        updatePlayer({ skills: { ...player.skills, buffs: newBuffs } });
                        // Brillitos dorados para indicar Buff
                        effectsManager.current.addSparkles(player.x, player.y, '#fbbf24');
                        effectsManager.current.addText(player.x, player.y, 'BUFF', '#fbbf24');
                    }

                    // 5. Visuales de Área (Explosiones)
                    // Hacemos esto antes del cálculo de daño para que el efecto visual salga primero
                    if (res.damages) {
                        res.damages.forEach(d => {
                            // Explosión mágica púrpura en cada objetivo
                            effectsManager.current.addExplosion(d.target.x, d.target.y, '#a855f7');
                        });
                    }
                    
                    // 6. Aplicación de Daño y Lógica de Muerte
                    if (res.damages && res.damages.length > 0) {
                        const newEnemies = [...dungeon.enemies];
                        let currentEnemiesList = newEnemies;
                        
                        res.damages.forEach(dmgInfo => {
                            const idx = currentEnemiesList.indexOf(dmgInfo.target);
                            
                            if (idx !== -1) {
                                const enemy = currentEnemiesList[idx];
                                enemy.hp -= dmgInfo.damage;

                                // --- NUEVOS EFECTOS AQUÍ ---
                                // 1. Sangre al recibir daño
                                effectsManager.current.addBlood(enemy.x, enemy.y);
                                
                                // 2. Texto de daño (usando el nuevo sistema de críticos)
                                // Asumimos que dmgInfo.isCritical viene del useSkill, si no, es false
                                effectsManager.current.addText(
                                    enemy.x, 
                                    enemy.y, 
                                    dmgInfo.damage, 
                                    '#a855f7', // Color morado mágico
                                    dmgInfo.isCritical || false 
                                );
                                
                                if (dmgInfo.stun) enemy.stunned = dmgInfo.stun;
                                
                                // Muerte del enemigo
                                if (enemy.hp <= 0) {
                                    currentEnemiesList = handleEnemyDeath(idx);
                                }
                            }
                        });

                        // Ejecutamos turno pasando la lista actualizada de enemigos
                        executeTurn(player, currentEnemiesList);

                    } else {
                        // Si fue solo buff/heal sin daño, ejecutamos turno normal
                        executeTurn(player);
                    }
                    
                    addMessage(res.message, 'player_damage');
                    setSelectedSkill(null);
                    return; // Fin del turno
                    
                } else {
                    // Fallo o requerimientos no cumplidos (mensaje de info)
                    addMessage(res.message, 'info');
                    return;
                }
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
    
    selectCharacter: (k, a) => { setPlayerName(playerName || 'Héroe'); setSelectedAppearance(k); setPlayerClass(a.class); setGameStarted(true); },
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