import { TILE, ENTITY } from '@/data/constants';
import { ENEMY_STATS } from '@/data/enemies';
import { SKILLS } from '@/data/skills';
import { soundManager } from "@/engine/systems/SoundSystem";

// --- CORRECCIÓN DE IMPORTACIONES ---
import { 
  calculatePlayerStats, 
  useItem as useItemLogic, 
  equipItem as equipItemLogic, 
  unequipItem as unequipItemLogic 
} from '@/engine/systems/ItemSystem';

import { 
  learnSkill, 
  upgradeSkill, 
  evolveClass, 
  canUseSkill, 
  calculateBuffBonuses 
} from '@/engine/systems/SkillSystem';
// -----------------------------------

import { craftItem, upgradeItem } from '@/engine/systems/CraftingSystem';
import { useQuickSlot as processQuickSlot, assignToQuickSlot } from '@/components/ui/QuickSlots';
import { saveGame as saveSystem, loadGame as loadSystem } from '@/engine/systems/SaveSystem';

export function useGameActions(context) {
  const {
    player, setPlayer, updatePlayer, gainExp,
    dungeon, setDungeon,
    inventory, setInventory, addItem,
    equipment, setEquipment,
    materials, setMaterials, addMaterial,
    quickSlots, setQuickSlots,
    stats, setStats,
    activeQuests, setActiveQuests,
    completedQuests, setCompletedQuests,
    questProgress, setQuestProgress,
    // Funciones del Engine/Effects
    initGame, executeTurn, addMessage, showFloatingText, effectsManager,
    // UI State Setters
    setGameStarted, setGameOver, setPlayerName, setSelectedSkill, setRangedMode, setRangedTargets, setMessages, updateMapFOV,
    playerName, selectedAppearance, setSelectedAppearance, setPlayerClass,
    // Combat Logic
    handleEnemyDeath, executeSkillAction,
    selectedSkill
  } = context;

  // --- DEFINICIÓN DE ACCIONES ---
  const actions = {
    move: (dx, dy) => {
        const nx = player.x + dx;
        const ny = player.y + dy;
        
        // 1. Límites y Muros
        if (nx < 0 || nx >= dungeon.map[0].length || ny < 0 || ny >= dungeon.map.length || dungeon.map[ny][nx] === TILE.WALL) return;
        
        // 2. Cofres
        if (dungeon.chests.some(c => c.x === nx && c.y === ny)) {
            addMessage("Un cofre bloquea el camino (Usa 'E')", 'info');
            return;
        }
        
        // 3. --- COLISIÓN ENEMIGOS ---
        const enemyIdx = dungeon.enemies.findIndex(e => e.x === nx && e.y === ny);
        if (enemyIdx !== -1) {
            const enemy = dungeon.enemies[enemyIdx];

            // Prioridad a Habilidad Melee seleccionada
            if (selectedSkill && SKILLS[selectedSkill]) {
                const skill = SKILLS[selectedSkill];
                if (skill.type === 'melee') {
                    if (canUseSkill(selectedSkill, player.skills.cooldowns)) {
                        const success = executeSkillAction(selectedSkill, enemy);
                        if (success) return; 
                    } else {
                        addMessage("¡Habilidad en enfriamiento!", 'info');
                        return; 
                    }
                }
            }

            // A. CÁLCULO DE DAÑO
            const pStats = calculatePlayerStats(player);
            const buffs = calculateBuffBonuses(player.skills.buffs, pStats);
            const dmg = Math.max(1, (pStats.attack + buffs.attackBonus) - enemy.defense + Math.floor(Math.random()*3));
            const isCrit = dmg > pStats.attack * 1.5;

            // B. EFECTOS (Visual + Audio)
            soundManager.play(isCrit ? 'critical' : 'attack');
            effectsManager.current.addBlood(nx, ny);
            effectsManager.current.addText(nx, ny, dmg, isCrit ? '#ef4444' : '#fff', isCrit);
            
            // Screen Shake (Temblor) 
            const shakeAmount = isCrit ? 10 : 5; 
            effectsManager.current.addShake(shakeAmount);

            // C. APLICAR DAÑO (Estado)
            const newEnemies = [...dungeon.enemies];
            newEnemies[enemyIdx].hp -= dmg;
            setDungeon(prev => ({ ...prev, enemies: newEnemies }));
            
            addMessage(`Atacas a ${ENEMY_STATS[enemy.type].name}: ${dmg} daño`, 'player_damage');
            
            // D. VERIFICAR MUERTE
            if (newEnemies[enemyIdx].hp <= 0) {
                soundManager.play('kill');
                effectsManager.current.addExplosion(nx, ny, '#52525b'); 
                const aliveEnemies = handleEnemyDeath(enemyIdx);
                executeTurn(player, aliveEnemies);
            } else {
                executeTurn(player);
            }
            return;
        }
        
        // 4. NPCs
        if (dungeon.npcs.some(n => n.x === nx && n.y === ny)) {
            addMessage("Un NPC bloquea el camino", 'info');
            return;
        }
        
        // 5. Movimiento Exitoso
        const nextPlayerState = { ...player, x: nx, y: ny };
        updatePlayer({ x: nx, y: ny });
        
        // 6. Items
        const itemIdx = dungeon.items.findIndex(i => i.x === nx && i.y === ny);
        if (itemIdx !== -1) {
            const item = dungeon.items[itemIdx];
            if (item.category === 'currency') {
                soundManager.play('pickup');
                updatePlayer({ gold: player.gold + item.value });
                addMessage(`+${item.value} Oro`, 'pickup');
                effectsManager.current.addText(nx, ny, `+${item.value}`, '#fbbf24');
            } else {
                soundManager.play('pickup');
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
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of dirs) {
            const tx = player.x + dx;
            const ty = player.y + dy;

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
                let newItems = [...dungeon.items];
                if (item) {
                    const added = addItem(item);
                    if (added) {
                        addMessage(`Encontraste: ${item.name}`, 'pickup');
                        effectsManager.current.addText(tx, ty, item.symbol || 'ITEM', '#fff');
                    } else {
                        addMessage("Inventario lleno. El objeto cayó al suelo.", 'info');
                        newItems.push({ ...item, x: tx, y: ty });
                    }
                } else {
                    addMessage("El cofre estaba vacío...", 'info');
                }
                setDungeon(prev => ({
                    ...prev,
                    items: newItems,
                    chests: prev.chests.map((c, i) => i === chestIdx ? { ...c, isOpen: true } : c)
                }));
                return { type: 'chest' };
            }

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
            if (['self', 'aoe', 'ultimate', 'ranged'].includes(skill.type)) {
                if (canUseSkill(selectedSkill, player.skills.cooldowns)) {
                    let targetEnemy = null;
                    if (skill.type === 'ranged') {
                        const targets = dungeon.enemies.filter(e => {
                            const dist = Math.abs(e.x - player.x) + Math.abs(e.y - player.y);
                            return dist <= skill.range && dungeon.visible[e.y]?.[e.x];
                        }).sort((a, b) => {
                            const distA = Math.abs(a.x - player.x) + Math.abs(a.y - player.y);
                            const distB = Math.abs(b.x - player.x) + Math.abs(b.y - player.y);
                            return distA - distB;
                        });
                        if (targets.length > 0) targetEnemy = targets[0];
                        else {
                            addMessage("No hay enemigos en rango", 'info');
                            return;
                        }
                    }
                    const success = executeSkillAction(selectedSkill, targetEnemy);
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
            showFloatingText(player.x, player.y, "Used", '#fff');
        } else {
            addMessage(res.message, 'info');
        }
    },
    
    saveGame: () => {
        saveSystem({ player, inventory, equipment, level: dungeon.level, bossDefeated: dungeon.bossDefeated }, stats, activeQuests, completedQuests, questProgress, materials, quickSlots);
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
    },

    setPlayerName, setSelectedSkill, setRangedMode, setRangedTargets
  };

  return actions;
}