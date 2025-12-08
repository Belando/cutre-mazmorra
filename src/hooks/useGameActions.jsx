import { TILE } from '@/data/constants';
import { ENEMY_STATS } from '@/data/enemies';
import { SKILLS } from '@/data/skills';
import { soundManager } from "@/engine/systems/SoundSystem";
import { calculatePlayerHit } from '@/engine/systems/CombatSystem';
import { craftItem, upgradeItem } from '@/engine/systems/CraftingSystem';
import { useQuickSlot as processQuickSlot, assignToQuickSlot } from '@/components/ui/QuickSlots';
import { saveGame as saveSystem, loadGame as loadSystem } from '@/engine/systems/SaveSystem';
import { hasLineOfSight } from '@/engine/core/utils';

import { 
  useItem as useItemLogic, 
  equipItem as equipItemLogic, 
  unequipItem as unequipItemLogic 
} from '@/engine/systems/ItemSystem';

import { 
  learnSkill, 
  upgradeSkill, 
  evolveClass, 
  canUseSkill
} from '@/engine/systems/SkillSystem';

export function useGameActions(context) {
  const {
    player, setPlayer, updatePlayer, gainExp,
    dungeon, setDungeon,
    inventory, setInventory, addItem,
    equipment, setEquipment,
    materials, setMaterials, 
    quickSlots, setQuickSlots,
    stats, setStats,
    activeQuests, setActiveQuests,
    completedQuests, setCompletedQuests,
    // Funciones del Engine/Effects
    initGame, executeTurn, addMessage, showFloatingText, effectsManager,
    // UI State Setters
    setGameStarted, setGameOver, setPlayerName, setSelectedSkill, setRangedMode, setRangedTargets, setMessages, updateMapFOV,
    playerName, selectedAppearance, setSelectedAppearance, setPlayerClass,
    // Combat Logic (Importamos handleEnemyDeath y executeSkillAction del contexto)
    handleEnemyDeath, 
    executeSkillAction: coreExecuteSkillAction, // Renombramos aquí para usarlo internamente
    selectedSkill
  } = context;

  // --- SUB-ACCIONES (Helpers privados) ---
  
  const performAttack = (enemy, enemyIdx) => {
      // 1. REGISTRAR DATOS DEL JUGADOR (Animación y buffs)
      const currentBuffs = player.skills?.buffs || [];
      const newBuffs = currentBuffs.filter(b => !b.invisible && !b.breaksOnAction);
      
      updatePlayer({ 
          lastAttackTime: Date.now(),
          lastAttackDir: { x: enemy.x - player.x, y: enemy.y - player.y },
          lastSkillId: null,
          skills: { ...player.skills, buffs: newBuffs }
      });

      // 2. CÁLCULO DE DAÑO
      const { damage, isCrit } = calculatePlayerHit(player, enemy);
      
      // 3. EFECTOS VISUALES Y SONOROS
      soundManager.play(isCrit ? 'critical' : 'attack');
      if (effectsManager.current) {
          effectsManager.current.addBlood(enemy.x, enemy.y);
          effectsManager.current.addText(enemy.x, enemy.y, damage, isCrit ? '#ef4444' : '#fff', isCrit);
          effectsManager.current.addShake(isCrit ? 10 : 3);
      }

      // 4. LÓGICA DE ESTADO (CRÍTICO: No actualizar estado aquí si el enemigo muere)
      // Trabajamos sobre una copia limpia para calcular el resultado final del turno
      const nextEnemies = [...dungeon.enemies];
      nextEnemies[enemyIdx] = { ...enemy, hp: enemy.hp - damage };
      
      addMessage(`Golpeas a ${ENEMY_STATS[enemy.type].name}: ${damage}`, 'player_damage');
      
      // 5. MUERTE O ACTUALIZACIÓN
      if (nextEnemies[enemyIdx].hp <= 0) {
          soundManager.play('kill');
          if (effectsManager.current) {
              effectsManager.current.addExplosion(enemy.x, enemy.y, '#52525b'); 
          }
          // Delegamos en handleEnemyDeath la actualización final del array
          return handleEnemyDeath(enemyIdx); 
      }
      
      // Si no muere, devolvemos el array modificado para que executeTurn lo procese
      return nextEnemies;
  };

  // --- ACCIONES PÚBLICAS ---

  const actions = {
    // Wrapper inteligente para habilidades con auto-apuntado
    executeSkillAction: (skillId, targetEnemy = null) => {
        const skill = SKILLS[skillId];
        if (!skill) return false;

        // LÓGICA DE AUTO-APUNTADO PARA RANGO
        if (skill.type === 'ranged' && !targetEnemy) {
            let bestTarget = null;
            let minDist = Infinity;

            // Buscar enemigo visible más cercano
            dungeon.enemies.forEach(e => {
                const dist = Math.abs(e.x - player.x) + Math.abs(e.y - player.y);
                
                // CAMBIO: Verificar rango, visibilidad FOV Y línea de tiro real (puertas)
                if (
                    dist <= (skill.range || 5) && 
                    dungeon.visible[e.y]?.[e.x] &&
                    hasLineOfSight(dungeon.map, player.x, player.y, e.x, e.y) // <--- VALIDACIÓN EXTRA
                ) {
                    if (dist < minDist) {
                        minDist = dist;
                        bestTarget = e;
                    }
                }
            });

            if (bestTarget) {
                targetEnemy = bestTarget;
            } else {
                addMessage("¡No hay enemigos en rango!", 'info');
                if (effectsManager.current) {
                    effectsManager.current.addText(player.x, player.y, "?", '#94a3b8');
                }
                return false;
            }
        }

        // Llamar a la lógica original
        return coreExecuteSkillAction(skillId, targetEnemy);
    },

    move: (dx, dy) => {
        const nx = player.x + dx;
        const ny = player.y + dy;
        
        // 1. Límites y Muros
        if (nx < 0 || nx >= dungeon.map[0].length || ny < 0 || ny >= dungeon.map.length) return;
        
        const targetTile = dungeon.map[ny][nx];
        
        if (targetTile === TILE.WALL) return;

        // --- NUEVO: ABRIR PUERTAS AL CHOCAR ---
        if (targetTile === TILE.DOOR) {
            const newMap = [...dungeon.map];
            newMap[ny] = [...newMap[ny]];
            newMap[ny][nx] = TILE.DOOR_OPEN;
            
            setDungeon(prev => ({ ...prev, map: newMap }));
            soundManager.play('step'); // O un sonido de puerta si añades uno
            addMessage("Abres la puerta.", 'info');
            // Al abrir puerta, actualizamos visión para ver lo que hay detrás
            updateMapFOV(player.x, player.y);
            return; // Gastamos el turno abriendo, no nos movemos
        }
        
        // 2. Objetos bloqueantes
        if (dungeon.chests.some(c => c.x === nx && c.y === ny)) {
            addMessage("Un cofre bloquea el camino (Usa 'E')", 'info');
            return;
        }
        if (dungeon.npcs.some(n => n.x === nx && n.y === ny)) {
            addMessage("Un NPC bloquea el camino (Usa 'E')", 'info');
            return;
        }
        
        // 3. COMBATE (Colisión Enemigos)
        const enemyIdx = dungeon.enemies.findIndex(e => e.x === nx && e.y === ny);
        if (enemyIdx !== -1) {
            const enemy = dungeon.enemies[enemyIdx];

            // Prioridad a Habilidad Melee seleccionada
            if (selectedSkill && SKILLS[selectedSkill]) {
                const skill = SKILLS[selectedSkill];
                if (skill.type === 'melee') {
                    if (canUseSkill(selectedSkill, player.skills.cooldowns)) {
                        // Usamos el wrapper de la acción, no el core directo
                        const success = actions.executeSkillAction(selectedSkill, enemy);
                        if (success) return; 
                    } else {
                        addMessage("¡Habilidad en enfriamiento!", 'info');
                        return; 
                    }
                }
            }

            // Ataque normal
            // Obtenemos el estado resultante de los enemigos (con daño aplicado o enemigo eliminado)
            const nextEnemiesState = performAttack(enemy, enemyIdx);
            
            // Pasamos el turno enviando el NUEVO estado de enemigos para que la IA reaccione a la realidad
            executeTurn(player, nextEnemiesState);
            return;
        }
        
        // 4. Movimiento Exitoso
        updatePlayer({ x: nx, y: ny });
        
        // 5. Recoger Items (Auto-pickup simplificado)
        const itemIdx = dungeon.items.findIndex(i => i.x === nx && i.y === ny);
        if (itemIdx !== -1) {
            const item = dungeon.items[itemIdx];
            // ... (Lógica de items se mantiene igual)
            if (item.category === 'currency') {
                soundManager.play('pickup');
                updatePlayer({ gold: player.gold + item.value });
                addMessage(`+${item.value} Oro`, 'pickup');
                if (effectsManager.current) effectsManager.current.addText(nx, ny, `+${item.value}`, '#fbbf24');
                
                const newItems = [...dungeon.items];
                newItems.splice(itemIdx, 1);
                setDungeon(prev => ({ ...prev, items: newItems }));
            } else {
                const success = addItem(item);
                if (success) {
                    soundManager.play('pickup');
                    if (effectsManager.current) effectsManager.current.addSparkles(nx, ny);
                    addMessage(`Recogiste: ${item.name}`, 'pickup');
                    
                    const newItems = [...dungeon.items];
                    newItems.splice(itemIdx, 1);
                    setDungeon(prev => ({ ...prev, items: newItems }));
                } else {
                    addMessage("Inventario lleno", 'info');
                }
            }
        }
        
        // Finalizar turno de movimiento
        executeTurn({ ...player, x: nx, y: ny });
    },

    interact: () => {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of dirs) {
            const tx = player.x + dx;
            const ty = player.y + dy;

            // Cofres
            const chestIdx = dungeon.chests.findIndex(c => c.x === tx && c.y === ty);
            if (chestIdx !== -1) {
                const chest = dungeon.chests[chestIdx];
                if (chest.isOpen) {
                    addMessage("Este cofre ya está vacío.", 'info');
                    return null;
                }
                soundManager.play('chest'); 
                if (effectsManager.current) effectsManager.current.addSparkles(tx, ty, '#fbbf24');
                const item = chest.item;
                
                if (item) {
                    const added = addItem(item);
                    if (added) {
                        addMessage(`Encontraste: ${item.name}`, 'pickup');
                        if (effectsManager.current) effectsManager.current.addText(tx, ty, item.symbol || 'ITEM', '#fff');
                        setDungeon(prev => ({
                            ...prev,
                            chests: prev.chests.map((c, i) => i === chestIdx ? { ...c, isOpen: true } : c)
                        }));
                    } else {
                        addMessage("Inventario lleno.", 'info');
                        return null;
                    }
                } else {
                    addMessage("El cofre estaba vacío...", 'info');
                    setDungeon(prev => ({
                        ...prev,
                        chests: prev.chests.map((c, i) => i === chestIdx ? { ...c, isOpen: true } : c)
                    }));
                }
                return { type: 'chest' };
            }

            // NPCs
            const npc = dungeon.npcs.find(n => n.x === tx && n.y === ty);
            if (npc) {
                soundManager.play('speech'); // Asumiendo que existe, si no, quitar
                return { type: 'npc', data: npc };
            }
        }
        addMessage("No hay nada aquí para interactuar.", 'info');
        return null;
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

    buyItem: (item) => {
        if (player.gold >= item.price) {
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
        setActiveQuests(prev => prev.filter(q => q !== quest.id));
        setCompletedQuests(prev => [...prev, quest.id]);
        addMessage(`¡Misión completada!${rewardText}`, 'levelup');
        soundManager.play('levelUp');
    },

    useItem: (index) => {
        const newInv = [...inventory];
        const res = useItemLogic(newInv, index, player);
        if (res.success) {
            setInventory(newInv);
            setPlayer({ ...player }); // Forzar refresco UI
            res.effects.forEach(m => addMessage(m, 'heal'));
            if(showFloatingText) showFloatingText(player.x, player.y, "Used", '#fff');
            soundManager.play('heal');
        } else {
            addMessage(res.message, 'info');
        }
    },
    
    saveGame: () => {
        saveSystem({ player, inventory, equipment, level: dungeon.level, bossDefeated: dungeon.bossDefeated }, stats, activeQuests, completedQuests, context.questProgress, materials, quickSlots);
        addMessage("Juego guardado", 'info');
    },
    
    selectCharacter: (k, a) => { 
        soundManager.play('start_adventure'); 
        setPlayerName(playerName || 'Héroe'); 
        setSelectedAppearance(k); 
        setPlayerClass(a.class); 
        setGameStarted(true); 
    },
    
    restart: () => { 
        setGameStarted(false); 
        setGameOver(false); 
        setPlayer(null);
        setMessages([]);
    },
    
    equipItem: (idx) => {
        const res = equipItemLogic(inventory, idx, equipment, player);
        if(res.success) {
            setInventory(res.newInventory); 
            setEquipment(res.newEquipment); 
            setPlayer(res.newPlayer);
            addMessage(res.message, 'pickup');
            soundManager.play('equip');
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
            soundManager.play('equip');
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
            soundManager.play('levelUp');
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
                soundManager.play('heal');
            }
        }
    },

    learnSkill: (id) => {
        const newSkills = JSON.parse(JSON.stringify(player.skills));
        const res = learnSkill(newSkills, id);
        if(res.success) {
            updatePlayer({ skills: newSkills });
            addMessage("Habilidad aprendida", 'levelup');
            soundManager.play('levelUp');
        }
    },

    upgradeSkill: (id) => {
        const newSkills = JSON.parse(JSON.stringify(player.skills));
        const res = upgradeSkill(newSkills, id);
        if(res.success) {
            updatePlayer({ skills: newSkills });
            addMessage("Habilidad mejorada", 'levelup');
            soundManager.play('levelUp');
        }
    },

    evolveClass: (cls) => {
        const newSkills = JSON.parse(JSON.stringify(player.skills));
        const res = evolveClass(newSkills, cls);
        if(res.success) {
            updatePlayer({ skills: newSkills });
            addMessage("¡Clase evolucionada!", 'levelup');
            soundManager.play('start_adventure'); 
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
                explored: savedGS.explored || Array(35).fill().map(() => Array(50).fill(false)), 
            });
            setInventory(savedGS.inventory);
            setEquipment(savedGS.equipment);
            setStats(sStats); setActiveQuests(sAQ); setCompletedQuests(sCQ); 
            // setQuestProgress no estaba en el destructuring original, asumimos que viene del context
            if(context.setQuestProgress) context.setQuestProgress(sQP); 
            setMaterials(sMat); setQuickSlots(sQS);
            setGameStarted(true);
            addMessage("Juego cargado", 'info');
            updateMapFOV(savedGS.player.x, savedGS.player.y);
        }
    },

    setPlayerName, setSelectedSkill, setRangedMode, setRangedTargets
  };

  return actions;
}