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
    initGame, executeTurn, addMessage, showFloatingText, effectsManager,
    setGameStarted, setGameOver, setPlayerName, setSelectedSkill, setRangedMode, setRangedTargets, setMessages, updateMapFOV,
    playerName, selectedAppearance, setSelectedAppearance, setPlayerClass,
    handleEnemyDeath, 
    reorderInventory,
    executeSkillAction: coreExecuteSkillAction, 
    selectedSkill,
    spatialHash 
  } = context;

  const performAttack = (enemy, enemyIdx) => {
      const currentBuffs = player.skills?.buffs || [];
      const newBuffs = currentBuffs.filter(b => !b.invisible && !b.breaksOnAction);
      
      updatePlayer({ 
          lastAttackTime: Date.now(),
          lastAttackDir: { x: enemy.x - player.x, y: enemy.y - player.y },
          lastSkillId: null,
          skills: { ...player.skills, buffs: newBuffs }
      });

      const { damage, isCrit } = calculatePlayerHit(player, enemy);
      
      soundManager.play(isCrit ? 'critical' : 'attack');
      if (effectsManager.current) {
          effectsManager.current.addBlood(enemy.x, enemy.y);
          effectsManager.current.addText(enemy.x, enemy.y, damage, isCrit ? '#ef4444' : '#fff', isCrit);
          effectsManager.current.addShake(isCrit ? 10 : 3);
      }

      const nextEnemies = [...dungeon.enemies];
      nextEnemies[enemyIdx] = { ...enemy, hp: enemy.hp - damage };
      
      addMessage(`Golpeas a ${ENEMY_STATS[enemy.type].name}: ${damage}`, 'player_damage');
      
      if (nextEnemies[enemyIdx].hp <= 0) {
          soundManager.play('kill');
          if (effectsManager.current) {
              effectsManager.current.addExplosion(enemy.x, enemy.y, '#52525b'); 
          }
          return handleEnemyDeath(enemyIdx); 
      }
      
      return nextEnemies;
  };

  const actions = {
    // Exportamos executeTurn para el sistema de Auto-Turno
    executeTurn, 

    executeSkillAction: (skillId, targetEnemy = null) => {
        const skill = SKILLS[skillId];
        if (!skill) return false;

        if (skill.type === 'ranged' && !targetEnemy) {
            let bestTarget = null;
            let minDist = Infinity;

            dungeon.enemies.forEach(e => {
                const dist = Math.abs(e.x - player.x) + Math.abs(e.y - player.y);
                if (
                    dist <= (skill.range || 5) && 
                    dungeon.visible[e.y]?.[e.x] &&
                    hasLineOfSight(dungeon.map, player.x, player.y, e.x, e.y) 
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
                soundManager.play('error'); // Sonido
                if (effectsManager.current) {
                    effectsManager.current.addText(player.x, player.y, "?", '#94a3b8');
                }
                return false;
            }
        }

        return coreExecuteSkillAction(skillId, targetEnemy);
    },

    move: (dx, dy) => {
        const nx = player.x + dx;
        const ny = player.y + dy;
        
        // 1. CHEQUEO DE LÍMITES Y MUROS
        if (nx < 0 || nx >= dungeon.map[0].length || ny < 0 || ny >= dungeon.map.length) return;
        const targetTile = dungeon.map[ny][nx];
        if (targetTile === TILE.WALL) return;

        // 2. CHEQUEO DE BARRILES (Cobertura destructible)
        // IMPORTANTE: Asegúrate de que en constants.js tienes TILE.BARREL = 10
        if (targetTile === TILE.BARREL) {
            addMessage("Rompes el barril en pedazos.", 'info');
            soundManager.play('hit'); // <--- AQUÍ SUENA EL GOLPE
            
            // Opcional: Drop sorpresa (10% probabilidad)
            if (Math.random() < 0.1) {
                 addMessage("¡Había algo oculto!", 'pickup');
                 updatePlayer({ gold: (player.gold || 0) + 5 });
            }

            // Destruir: Barril -> Suelo
            const newMap = [...dungeon.map];
            newMap[ny] = [...newMap[ny]];
            newMap[ny][nx] = TILE.FLOOR;
            setDungeon(prev => ({ ...prev, map: newMap }));
            
            // Consume turno pero NO mueve al jugador
            executeTurn(player);
            return;
        }

        // 2b. CHEQUEO DE BARRIL EXPLOSIVO
        if (targetTile === TILE.BARREL_EXPLOSIVE) {
            addMessage("¡BOOM! El barril explota.", 'damage');
            soundManager.play('critical'); // O un sonido de explosión si tienes
            
            // Efecto visual de sacudida
            if (effectsManager.current) effectsManager.current.addShake(10);

            // Calcular Área de Explosión (3x3 alrededor del barril)
            const explosionRadius = 1; 
            const targets = [];
            
            for (let dy = -explosionRadius; dy <= explosionRadius; dy++) {
                for (let dx = -explosionRadius; dx <= explosionRadius; dx++) {
                    const ex = nx + dx;
                    const ey = ny + dy;
                    
                    // Efecto visual (Fuego/Humo)
                    if (effectsManager.current) {
                        effectsManager.current.addText(ex, ey, "BOOM", "#ef4444");
                        // Aquí podrías añadir partículas de fuego si tu sistema lo permite
                    }

                    // 1. Dañar Jugador si está cerca
                    if (player.x === ex && player.y === ey) {
                        const dmg = 15;
                        updatePlayer({ hp: Math.max(0, player.hp - dmg) });
                        addMessage(`La explosión te quita ${dmg} HP.`, 'damage');
                    }

                    // 2. Dañar Enemigos
                    const enemyIdx = dungeon.enemies.findIndex(e => e.x === ex && e.y === ey);
                    if (enemyIdx !== -1) {
                        const enemy = dungeon.enemies[enemyIdx];
                        const dmg = 20 + Math.floor(Math.random() * 10); // Daño alto
                        
                        // Aplicar daño al enemigo directamente
                        // (Necesitarás una función auxiliar o hacerlo manualmente aquí)
                        // Esto es una simplificación de lo que hace combatSystem
                        const newEnemies = [...dungeon.enemies];
                        newEnemies[enemyIdx] = { ...enemy, hp: enemy.hp - dmg };
                        
                        addMessage(`${enemy.name || 'Enemigo'} recibe ${dmg} de daño explosivo!`, 'info');
                        
                        if (newEnemies[enemyIdx].hp <= 0) {
                            // Manejo de muerte simple
                            newEnemies.splice(enemyIdx, 1);
                            addMessage(`${enemy.name || 'Enemigo'} explota en pedazos.`, 'kill');
                        }
                        
                        // Actualizar estado de enemigos (esto requiere acceso a setDungeon o similar)
                        setDungeon(prev => ({ ...prev, enemies: newEnemies }));
                    }
                }
            }

            // Destruir el barril -> Suelo chamuscado (o suelo normal)
            const newMap = [...dungeon.map];
            newMap[ny] = [...newMap[ny]];
            newMap[ny][nx] = TILE.FLOOR; // O un nuevo TILE.SCORCHED_GROUND
            setDungeon(prev => ({ ...prev, map: newMap }));
            
            executeTurn(player);
            return;
        }

        // 3. CHEQUEO DE PUERTAS
        if (targetTile === TILE.DOOR) {
            const newMap = [...dungeon.map];
            newMap[ny] = [...newMap[ny]];
            newMap[ny][nx] = TILE.DOOR_OPEN;
            setDungeon(prev => ({ ...prev, map: newMap }));
            soundManager.play('door'); 
            addMessage("Abres la puerta.", 'info');
            updateMapFOV(player.x, player.y);
            return; 
        }
        
        // 4. CHEQUEO DE ENTIDADES (Enemigos, NPCs, Cofres)
        const entitiesAtTarget = spatialHash.get(nx, ny);

        // A. Bloqueos pasivos
        if (entitiesAtTarget.some(e => e.type === 'chest')) {
            addMessage("Un cofre bloquea el camino (Usa 'E')", 'info');
            soundManager.play('error');
            return;
        }
        if (entitiesAtTarget.some(e => e.type === 'npc')) {
            addMessage("Un NPC bloquea el camino (Usa 'E')", 'info');
            soundManager.play('error');
            return;
        }

        const entitiesLeft = spatialHash.get(nx - 1, ny);
        
        // Si hay un herrero a la izquierda, estamos chocando con su forja
        // NOTA: Asegúrate de que 'blacksmith' coincida con el e.type o e.subtype que usas para generar al NPC
        if (entitiesLeft.some(e => e.type === 'blacksmith' || e.type === 100)) { // (100 o el ID que use tu herrero)
             addMessage("La forja está hirviendo, mejor no tocarla.", 'warning');
             soundManager.play('error');
             // Empujoncito visual (opcional)
             if (effectsManager.current) effectsManager.current.addShake(2);
             return;
        }

        // B. Combate (Enemigos)
        const enemyRef = entitiesAtTarget.find(e => e.type === 'enemy');
        if (enemyRef) {
            const enemyIdx = dungeon.enemies.findIndex(e => e.x === nx && e.y === ny);
            if (enemyIdx !== -1) {
                const enemy = dungeon.enemies[enemyIdx];
                
                // Intentar usar skill melee si está seleccionada
                if (selectedSkill && SKILLS[selectedSkill] && SKILLS[selectedSkill].type === 'melee') {
                    if (canUseSkill(selectedSkill, player.skills.cooldowns)) {
                        const success = actions.executeSkillAction(selectedSkill, enemy);
                        if (success) return; 
                    }
                }
                
                // Ataque básico
                const nextEnemiesState = performAttack(enemy, enemyIdx);
                // performAttack ya llama a soundManager.play('attack') o 'critical'
                executeTurn(player, nextEnemiesState);
                return; 
            }
        }
        
        // --- MOVIMIENTO VÁLIDO ---
        
        // 5. EFECTOS DE TERRENO (Se aplican al entrar en la casilla)
        let moveMessage = null;
        let damageTaken = 0;

        // A) TRAMPAS
        if (targetTile === TILE.TRAP) {
            addMessage("¡CLACK! ¡Has pisado una trampa!", 'damage');
            soundManager.play('critical'); // Sonido fuerte de daño
            damageTaken = Math.floor(player.maxHp * 0.15) + 2;
            
            if (effectsManager.current) {
                effectsManager.current.addBlood(nx, ny);
                effectsManager.current.addText(nx, ny, `-${damageTaken}`, '#dc2626', true);
                effectsManager.current.addShake(5);
            }

            // Revelar la trampa
            const newMap = [...dungeon.map];
            newMap[ny] = [...newMap[ny]];
            newMap[ny][nx] = TILE.TRAP_TRIGGERED;
            setDungeon(prev => ({ ...prev, map: newMap }));
        }
        
        // B) AGUA / LODO
        if (targetTile === TILE.WATER) {
            soundManager.playNoise(0.2, 0.3, 800); // Sonido chapoteo
            if (Math.random() > 0.8) moveMessage = "Chapoteas en el agua.";
        }
        else if (targetTile === TILE.MUD) {
            soundManager.playNoise(0.3, 0.3, 200); 
            if (Math.random() > 0.8) moveMessage = "El lodo te frena.";
        }
        else {
            // Suelo normal
            soundManager.play('step');
        }

        // 6. EJECUTAR MOVIMIENTO FÍSICO
        spatialHash.move(player.x, player.y, nx, ny, { ...player, type: 'player' });
        
        const updates = { x: nx, y: ny, lastMoveTime: Date.now() };
        
        // Aplicar daño si hubo trampa
        if (damageTaken > 0) {
            updates.hp = player.hp - damageTaken;
            if (updates.hp <= 0) {
                setGameOver(true);
                addMessage("Moriste por una trampa...", 'death');
                soundManager.play('gameOver');
            }
        }
        
        updatePlayer(updates);
        if (moveMessage) addMessage(moveMessage, 'info');
        
        // Recoger items del suelo
        const itemRef = entitiesAtTarget.find(e => e.type === 'item');
        if (itemRef) {
             const itemIdx = dungeon.items.findIndex(i => i.x === nx && i.y === ny);
             if (itemIdx !== -1) {
                const item = dungeon.items[itemIdx];
                if (item.category === 'currency') {
                    soundManager.play('pickup');
                    updatePlayer({ gold: (player.gold || 0) + item.value, ...updates });
                    addMessage(`+${item.value} Oro`, 'pickup');
                    if (effectsManager.current) effectsManager.current.addText(nx, ny, `+${item.value}`, '#fbbf24');
                    const newItems = [...dungeon.items];
                    newItems.splice(itemIdx, 1);
                    setDungeon(prev => ({ ...prev, items: newItems }));
                } else {
                    const success = addItem(item);
                    if (success) {
                        soundManager.play('pickup');
                        addMessage(`Recogiste: ${item.name}`, 'pickup');
                        const newItems = [...dungeon.items];
                        newItems.splice(itemIdx, 1);
                        setDungeon(prev => ({ ...prev, items: newItems }));
                    } else {
                        addMessage("Inventario lleno", 'info');
                    }
                }
             }
        }

        executeTurn({ ...player, ...updates });
    },

    interact: () => {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of dirs) {
            const tx = player.x + dx;
            const ty = player.y + dy;

            // --- OPTIMIZACIÓN SPATIAL HASH ---
            const entities = spatialHash.get(tx, ty);

            // 1. Interactuar con Cofre
            const chestRef = entities.find(e => e.type === 'chest');
            if (chestRef) {
                // Buscamos el cofre real en el array para modificar su estado
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
                            
                            let floatText = "ITEM";
                            if (typeof item.symbol === 'string') floatText = item.symbol;
                            else if (item.category === 'weapon') floatText = "⚔️";
                            else if (item.category === 'armor') floatText = "🛡️";
                            else if (item.category === 'potion') floatText = "♥";
                            
                            if (effectsManager.current) effectsManager.current.addText(tx, ty, floatText, '#fff');
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
            }

            // 2. Interactuar con NPC
            const npcRef = entities.find(e => e.type === 'npc');
            if (npcRef) {
                soundManager.play('speech'); 
                return { type: 'npc', data: npcRef.ref };
            }
        }
        addMessage("No hay nada aquí para interactuar.", 'info');
        return null;
    },

    descend: (goUp) => {
        if (goUp && dungeon.stairsUp && player.x === dungeon.stairsUp.x && player.y === dungeon.stairsUp.y) {
            if (dungeon.level > 1) {
                soundManager.play('stairs');
                initGame(dungeon.level - 1, player);
            }
            else addMessage("No puedes salir aún", 'info');
        } else if (!goUp && player.x === dungeon.stairs.x && player.y === dungeon.stairs.y) {
            if (dungeon.enemies.some(e => e.isBoss)) addMessage("¡Mata al jefe primero!", 'info');
            else {
                soundManager.play('stairs');
                initGame(dungeon.level + 1, player);
            }
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
            setPlayer({ ...player });
            res.effects.forEach(m => addMessage(m, 'heal'));
            if(showFloatingText) showFloatingText(player.x, player.y, "Used", '#fff');
            soundManager.play('heal');
        } else {
            addMessage(res.message, 'info');
        }
    },
    
    // --- FUNCIÓN DE GUARDADO CORREGIDA ---
    saveGame: () => {
        saveSystem(
            { 
                player, 
                inventory, 
                equipment, 
                ...dungeon // SPREAD DUNGEON TO SAVE MAP, ENEMIES, ETC.
            }, 
            stats, 
            activeQuests, 
            completedQuests, 
            context.questProgress, 
            materials, 
            quickSlots
        );
        addMessage("Juego guardado", 'info');
    },
    
    // --- FUNCIÓN QUE FALTABA (Y OTRAS) ---
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

        setInventory([]);
        setEquipment({ 
            weapon: null, offhand: null, helmet: null, chest: null, 
            legs: null, boots: null, gloves: null, ring: null, 
            earring: null, necklace: null 
        });
        setMaterials({});
        setQuickSlots([null, null, null]);

        setStats({ maxLevel: 1, kills: 0, gold: 0, playerLevel: 1 });

        setActiveQuests([]);
        setCompletedQuests([]);
        if (context.setQuestProgress) context.setQuestProgress({});
    },
    reorderInventory,
    
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
        const newInv = [...inventory];
        const res = craftItem(key, newInv); 
        if(res.success) {
            setInventory(newInv);
            addMessage(res.message, 'pickup');
            soundManager.play('equip');
        } else addMessage(res.message, 'info');
    },

    upgradeItem: (slot) => {
        const newEq = { ...equipment };
        const item = newEq[slot];
        if(!item) return;
        
        const newInv = [...inventory];
        const res = upgradeItem(item, newInv, player.gold); 
        
        if(res.success) {
            setInventory(newInv); 
            setEquipment(newEq); 
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