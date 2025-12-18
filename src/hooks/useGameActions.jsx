import { useMovementActions } from './useMovementActions';
import { useInteractionActions } from './useInteractionActions';
import { useCombatActions } from './useCombatActions';

import { soundManager } from "@/engine/systems/SoundSystem";
import { craftItem, upgradeItem } from '@/engine/systems/CraftingSystem';
import { useQuickSlot as processQuickSlot, assignToQuickSlot } from '@/components/ui/QuickSlots';
import { saveGame as saveSystem, loadGame as loadSystem } from '@/engine/systems/SaveSystem';

import { 
  useItem as useItemLogic, 
  equipItem as equipItemLogic, 
  unequipItem as unequipItemLogic 
} from '@/engine/systems/ItemSystem';

import { 
  learnSkill, 
  upgradeSkill, 
  evolveClass
} from '@/engine/systems/SkillSystem';

export function useGameActions(context) {
  // Destructuramos lo necesario para Inventory/Meta aquí, ya que el resto se pasa a los sub-hooks
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
    executeSkillAction: coreExecuteSkillAction, // El original de useCombatLogic
    selectedSkill,
    spatialHash 
  } = context;

  // 1. COMBAT ACTIONS
  const { performAttack, executeSkillAction } = useCombatActions(context);

  // 2. MOVEMENT ACTIONS
  // Necesita executeSkillAction para el "click-to-attack" y performAttack
  const { move, descend } = useMovementActions(context, executeSkillAction, performAttack, executeTurn);

  // 3. INTERACTION ACTIONS
  const { interact, buyItem, sellItem, acceptQuest, completeQuest } = useInteractionActions(context);

  const actions = {
    executeTurn, 
    executeSkillAction, // Exposed wrapped version
    move,
    descend,
    interact,
    buyItem,
    sellItem,
    acceptQuest,
    completeQuest,

    // --- INVENTORY & META ACTIONS (Kept here for now) ---

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
    
    saveGame: () => {
        const gameStateToSave = {
            player,
            inventory,
            equipment,
            ...dungeon 
        };
        saveSystem(gameStateToSave, stats, activeQuests, completedQuests, context.questProgress, materials, quickSlots);
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