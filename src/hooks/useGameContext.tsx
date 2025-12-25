import { useMemo } from 'react';
import { GameActionsContext } from '@/hooks/useGameActions';
import { Player, Item, EquipmentState, QuickSlotData } from '@/types';
import { DungeonState } from './useDungeon';

// This hook purely organizes the actions context to unclutter the main engine hook
export function useGameContext(
    player: Player | null,
    dungeon: DungeonState,
    inventory: Item[],
    equipment: EquipmentState,
    materials: Record<string, number>,
    quickSlots: (QuickSlotData | null)[],
    stats: any, // Game stats (kills, etc.)
    activeQuests: string[],
    completedQuests: string[],
    questProgress: Record<string, any>,
    setters: any, // Keeping as any for now due to complexity of prop drilling
    methods: any,
    extraState: any,
    spatialHash: any
): GameActionsContext {

    const {
        setPlayer, updatePlayer, gainExp,
        setDungeon,
        setInventory, addItem,
        setEquipment,
        setQuickSlots,
        resetInventory,
        reorderInventory,
        setStats,
        setActiveQuests,
        setCompletedQuests,
        setQuestProgress,
        setGameStarted, setGameOver, setPlayerName, setSelectedSkill, setRangedMode, setRangedTargets, setMessages, updateMapFOV, setGameWon,
        setSelectedAppearance, setPlayerClass,
        setMaterials
    } = setters;

    const {
        initGame, executeTurn, addMessage, showFloatingText, effectsManager,
        handleEnemyDeath, executeSkillAction
    } = methods;

    const {
        playerName, selectedAppearance, playerClass, selectedSkill, rangedMode, rangedTargets
    } = extraState;

    return useMemo((): GameActionsContext => ({
        player: player as Player, setPlayer, updatePlayer, gainExp,
        dungeon, setDungeon,
        inventory, setInventory, addItem,
        equipment, setEquipment,
        quickSlots, setQuickSlots,
        resetInventory,
        reorderInventory,
        stats, setStats,
        activeQuests, setActiveQuests,
        completedQuests, setCompletedQuests,
        questProgress, setQuestProgress,
        initGame, executeTurn, addMessage, showFloatingText, effectsManager,
        setGameStarted, setGameOver, setPlayerName, setSelectedSkill, setRangedMode, setRangedTargets, setMessages, updateMapFOV,
        playerName, selectedAppearance, setSelectedAppearance, setPlayerClass, playerClass,
        handleEnemyDeath, executeSkillAction, selectedSkill, rangedMode, rangedTargets,
        spatialHash,
        setGameWon, materials, setMaterials
    }), [
        player, dungeon, inventory, equipment, materials, quickSlots, stats, activeQuests, completedQuests, questProgress,
        initGame, executeTurn, addMessage, showFloatingText,
        setGameStarted, setGameOver, setPlayerName, setSelectedSkill, setRangedMode, setRangedTargets, setMessages, updateMapFOV,
        playerName, selectedAppearance, setPlayerClass,
        handleEnemyDeath, executeSkillAction, selectedSkill,
        spatialHash
    ]);
}
