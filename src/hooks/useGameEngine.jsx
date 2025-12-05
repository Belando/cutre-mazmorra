import { useState, useCallback, useEffect } from 'react';
import { usePlayer } from './usePlayer';
import { useDungeon } from './useDungeon';
import { useInventory } from './useInventory';
import { useTurnSystem } from './useTurnSystem';

// --- IMPORTACIONES DE DATOS ---
import { TILE, ENTITY } from '@/data/constants';
import { ENEMY_STATS } from '@/data/enemies';
import { SKILLS } from '@/data/skills'; 

// --- IMPORTACIONES DE SISTEMAS ---
import { MATERIAL_TYPES, generateMaterialDrop, generateBossDrop, craftItem, upgradeItem } from '@/components/game/systems/CraftingSystem';
import { useItem as useItemLogic, equipItem as equipItemLogic, unequipItem as unequipItemLogic, calculatePlayerStats } from '@/components/game/systems/ItemSystem';
import { useQuickSlot as processQuickSlot, assignToQuickSlot } from '@/components/game/ui/QuickSlots';
import { canUseSkill, learnSkill, upgradeSkill, evolveClass, calculateBuffBonuses, useSkill } from '@/components/game/systems/SkillSystem';
import { QUESTS } from '@/components/game/systems/NPCSystem';
import { saveGame as saveSystem, loadGame as loadSystem } from '@/components/game/systems/SaveSystem';

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
  // CORRECCIÓN: Ahora acepta 'enemiesOverride' para manejar muertes en el mismo turno
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
      setGameOver
    });
    
    // 4. Actualizar FOV
    updateMapFOV(currentPlayerState.x, currentPlayerState.y);

  }, [dungeon, player, regenPlayer, processTurn, updateMapFOV, addMessage, setPlayer, setDungeon]);

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
    
    // CORRECCIÓN: Devolvemos la lista nueva para usarla inmediatamente en executeTurn
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
      
      // Colisión Enemigos (Combate)
      const enemyIdx = dungeon.enemies.findIndex(e => e.x === nx && e.y === ny);
      if (enemyIdx !== -1) {
        const enemy = dungeon.enemies[enemyIdx];
        const pStats = calculatePlayerStats(player);
        const buffs = calculateBuffBonuses(player.skills.buffs, pStats);
        const dmg = Math.max(1, (pStats.attack + buffs.attackBonus) - enemy.defense + Math.floor(Math.random()*3));
        
        // Actualizamos HP localmente para comprobar muerte
        const newEnemies = [...dungeon.enemies];
        newEnemies[enemyIdx].hp -= dmg;
        setDungeon(prev => ({ ...prev, enemies: newEnemies }));
        
        addMessage(`Atacas a ${ENEMY_STATS[enemy.type].name}: ${dmg} daño`, 'player_damage');
        
        if (newEnemies[enemyIdx].hp <= 0) {
            // Si muere, obtenemos la lista limpia y la pasamos al turno
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
      
      // Movimiento Exitoso
      const nextPlayerState = { ...player, x: nx, y: ny };
      updatePlayer({ x: nx, y: ny });
      
      // Recoger items
      const itemIdx = dungeon.items.findIndex(i => i.x === nx && i.y === ny);
      if (itemIdx !== -1) {
        const item = dungeon.items[itemIdx];
        if (item.category === 'currency') {
          updatePlayer({ gold: player.gold + item.value });
          addMessage(`+${item.value} Oro`, 'pickup');
        } else {
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
      const npc = dungeon.npcs.find(n => Math.abs(n.x - player.x) + Math.abs(n.y - player.y) <= 1);
      if (npc) {
        addMessage(`Hablas con ${npc.name}`, 'info');
        return { type: 'npc', data: npc };
      }
      
      const chestIdx = dungeon.chests.findIndex(c => Math.abs(c.x - player.x) + Math.abs(c.y - player.y) <= 1 && !c.opened);
      if (chestIdx !== -1) {
        const newChests = [...dungeon.chests];
        const chest = newChests[chestIdx];
        chest.opened = true;
        setDungeon(prev => ({ ...prev, chests: newChests }));
        
        const res = addItem(chest.item);
        if (res) addMessage(`Abriste cofre: ${chest.item.name}`, 'pickup');
        else {
          const droppedItem = { ...chest.item, x: chest.x, y: chest.y };
          setDungeon(prev => ({ ...prev, items: [...prev.items, droppedItem] }));
          addMessage("Inventario lleno, item al suelo", 'info');
        }
        return { type: 'chest' };
      }
      
      addMessage("No hay nada aquí", 'info');
      return { type: 'none' };
    },

    wait: () => {
      if (selectedSkill && SKILLS[selectedSkill]) {
         const skill = SKILLS[selectedSkill];
         if (['self', 'aoe', 'ultimate'].includes(skill.type)) {
             if (canUseSkill(selectedSkill, player.skills.cooldowns)) {
                 const pStats = calculatePlayerStats(player);
                 const res = useSkill(selectedSkill, player, pStats, null, dungeon.enemies, dungeon.visible);
                 
                 if (res.success) {
                     if(skill.manaCost) updatePlayer({ mp: player.mp - skill.manaCost });
                     const newCooldowns = { ...player.skills.cooldowns, [selectedSkill]: res.cooldown };
                     updatePlayer({ skills: { ...player.skills, cooldowns: newCooldowns } });
                     
                     if (res.heal) updatePlayer({ hp: Math.min(player.maxHp, player.hp + res.heal) });
                     if (res.buff) {
                         const newBuffs = [...(player.skills.buffs || []), res.buff];
                         updatePlayer({ skills: { ...player.skills, buffs: newBuffs } });
                     }
                     
                     if (res.damages && res.damages.length > 0) {
                         const newEnemies = [...dungeon.enemies];
                         // Usar la lista local para controlar muertes en AOE
                         let currentEnemiesList = newEnemies;
                         
                         res.damages.forEach(dmgInfo => {
                             const idx = currentEnemiesList.indexOf(dmgInfo.target);
                             if (idx !== -1) {
                                 const enemy = currentEnemiesList[idx];
                                 enemy.hp -= dmgInfo.damage;
                                 if (dmgInfo.stun) enemy.stunned = dmgInfo.stun;
                                 
                                 if (enemy.hp <= 0) {
                                     // Si muere por skill, también lo quitamos para el turno
                                     currentEnemiesList = handleEnemyDeath(idx);
                                 }
                             }
                         });
                         // Pasamos la lista resultante al turno
                         executeTurn(player, currentEnemiesList);
                     } else {
                         executeTurn(player);
                     }
                     
                     addMessage(res.message, 'player_damage');
                     setSelectedSkill(null);
                     return; // Salimos, ya ejecutamos turno
                 } else {
                     addMessage(res.message, 'info');
                     return;
                 }
             } else {
                 addMessage("Habilidad no lista", 'info');
                 return;
             }
         }
      } else {
         addMessage("Esperas...", 'info');
      }
      executeTurn(player);
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
        const newInv = [...inventory];
        const newEq = { ...equipment };
        const res = equipItemLogic(newInv, idx, newEq, player);
        if(res.success) {
            setInventory(newInv); setEquipment(newEq); setPlayer({...player});
            addMessage(res.message, 'pickup');
        } else addMessage(res.message, 'info');
    },
    unequipItem: (slot) => {
        const newInv = [...inventory];
        const newEq = { ...equipment };
        const res = unequipItemLogic(newEq, slot, newInv, player);
        if(res.success) {
            setInventory(newInv); setEquipment(newEq); setPlayer({...player});
            addMessage(res.message, 'info');
        } else addMessage(res.message, 'info');
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
    materials
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