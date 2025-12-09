import { useState, useCallback, useEffect } from 'react';
import { usePlayer } from './usePlayer';
import { useDungeon } from './useDungeon';
import { useInventory } from './useInventory';
import { useTurnSystem } from './useTurnSystem';
import { soundManager } from "@/engine/systems/SoundSystem";
import { useGameEffects } from "@/hooks/useGameEffects";
import { useCombatLogic } from '@/hooks/useCombatLogic';
import { useGameActions } from '@/hooks/useGameActions';

export function useGameEngine() {
  const { player, setPlayer, initPlayer, updatePlayer, gainExp, regenerate: regenPlayer } = usePlayer();
  const { dungeon, setDungeon, generateLevel, updateMapFOV } = useDungeon();
  
  // AÑADIR reorderInventory
  const { 
    inventory, setInventory, equipment, setEquipment, materials, setMaterials, 
    quickSlots, setQuickSlots, initInventory, addItem, addMaterial, resetInventory,
    reorderInventory // <--- AQUÍ
  } = useInventory();
  
  const { processTurn } = useTurnSystem();
  const { messages, setMessages, addMessage, effectsManager, showFloatingText } = useGameEffects();
  
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [stats, setStats] = useState({ maxLevel: 1, kills: 0, gold: 0, playerLevel: 1 });
  const [activeQuests, setActiveQuests] = useState([]);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [questProgress, setQuestProgress] = useState({});
  const [selectedAppearance, setSelectedAppearance] = useState(null);
  const [playerClass, setPlayerClass] = useState('warrior');
  const [playerName, setPlayerName] = useState('');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [rangedMode, setRangedMode] = useState(false);
  const [rangedTargets, setRangedTargets] = useState([]);

  const executeTurn = useCallback((currentPlayerState = player, enemiesOverride = null) => {
    regenPlayer();
    const dungeonState = enemiesOverride ? { ...dungeon, enemies: enemiesOverride } : dungeon;
    processTurn({
      dungeon: dungeonState, setDungeon, player: currentPlayerState, setPlayer,
      addMessage, setGameOver, showFloatingText
    });
    updateMapFOV(currentPlayerState.x, currentPlayerState.y);
  }, [dungeon, player, regenPlayer, processTurn, updateMapFOV, addMessage, setPlayer, setDungeon, showFloatingText]);

  const { handleEnemyDeath, executeSkillAction } = useCombatLogic({
    dungeon, setDungeon, player, updatePlayer, gainExp, setStats, 
    addMessage, addItem, effectsManager, executeTurn, setSelectedSkill
  });

  const initGame = useCallback((level = 1, existingPlayer = null) => {
    if (!existingPlayer && !player) initPlayer(null, playerClass, playerName);
    else if (existingPlayer) setPlayer({ ...existingPlayer, x: 0, y: 0 });

    const pLevel = existingPlayer?.level || 1; 
    const newDungeon = generateLevel(level, pLevel);
    updatePlayer({ x: newDungeon.playerStart.x, y: newDungeon.playerStart.y, floor: level });
    updateMapFOV(newDungeon.playerStart.x, newDungeon.playerStart.y);

    if (level === 1 && !existingPlayer) addMessage(`¡Bienvenido, ${playerName || 'Héroe'}!`, 'info');
    else addMessage(`Piso ${level}`, 'info');
  }, [playerClass, playerName, generateLevel, initPlayer, updatePlayer, updateMapFOV, addMessage, player]);

  // --- ACTIONS CONTEXT ---
  const actionsContext = {
    player, setPlayer, updatePlayer, gainExp,
    dungeon, setDungeon,
    inventory, setInventory, addItem,
    equipment, setEquipment,
    materials, setMaterials, addMaterial,
    quickSlots, setQuickSlots,
    resetInventory,
    reorderInventory, // <--- PASAR AL CONTEXTO
    stats, setStats,
    activeQuests, setActiveQuests,
    completedQuests, setCompletedQuests,
    questProgress, setQuestProgress,
    initGame, executeTurn, addMessage, showFloatingText, effectsManager,
    setGameStarted, setGameOver, setPlayerName, setSelectedSkill, setRangedMode, setRangedTargets, setMessages, updateMapFOV,
    playerName, selectedAppearance, setSelectedAppearance, setPlayerClass,
    handleEnemyDeath, executeSkillAction, selectedSkill
  };

  const actions = useGameActions(actionsContext);

  useEffect(() => { if (gameStarted && !player) initGame(1); }, [gameStarted, player, initGame]);

  useEffect(() => {
    if (player && player.level > 1 && gameStarted) {
        soundManager.play('levelUp');
        effectsManager.current.addSparkles(player.x, player.y, '#ffff00');
        addMessage(`¡Nivel ${player.level} alcanzado!`, 'levelup');
    }
  }, [player?.level]);

  const gameState = {
    player, map: dungeon.map, enemies: dungeon.enemies, items: dungeon.items, chests: dungeon.chests,
    torches: dungeon.torches, npcs: dungeon.npcs, stairs: dungeon.stairs, stairsUp: dungeon.stairsUp,
    visible: dungeon.visible, explored: dungeon.explored, level: dungeon.level, bossDefeated: dungeon.bossDefeated,
    inventory, equipment, questProgress, materials, effectsManager: effectsManager.current
  };

  return {
    gameState, gameStarted, gameOver, messages, stats,
    playerInfo: { name: playerName, class: playerClass, appearance: selectedAppearance },
    uiState: { activeQuests, completedQuests, questProgress, materials, quickSlots, selectedSkill, rangedMode, rangedTargets },
    actions
  };
}