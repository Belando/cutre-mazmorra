import { useMemo } from 'react';
import { GameActionsContext } from '@/hooks/useGameActions';
import { Player, GameState } from '@/types';

// This hook purely organizes the actions context to unclutter the main engine hook
export function useGameContext(
    player: Player | null,
    dungeon: any,
    inventory: any,
    equipment: any,
    materials: any,
    quickSlots: any,
    stats: any,
    activeQuests: string[],
    completedQuests: string[],
    questProgress: any,
    setters: any, // We'll type this properly or pass individual functions
    methods: any,
    extraState: any,
    spatialHash: any
): GameActionsContext {

    const {
        setPlayer, updatePlayer, gainExp,
        setDungeon,
        setInventory, addItem,
        setEquipment,
        setMaterials,
        setQuickSlots,
        resetInventory,
        reorderInventory,
        setStats,
        setActiveQuests,
        setCompletedQuests,
        setQuestProgress,
        setGameStarted, setGameOver, setPlayerName, setSelectedSkill, setRangedMode, setRangedTargets, setMessages, updateMapFOV, setGameWon,
        setSelectedAppearance, setPlayerClass
    } = setters;

    const {
        initGame, addMessage, showFloatingText, effectsManager,
        handleEnemyDeath, executeSkillAction, performAttack
    } = methods;

    const {
        playerName, selectedAppearance, playerClass, selectedSkill, rangedMode, rangedTargets
    } = extraState;

    // Helper for legacy material system (kept for HUD compatibility)
    const addMaterial = (type: string, amount: number) => {
        if (setMaterials) {
            setMaterials((prev: any) => ({
                ...prev,
                [type]: (prev[type] || 0) + amount
            }));
        }
    };

    return useMemo((): GameActionsContext => ({
        player, setPlayer, updatePlayer, gainExp,
        dungeon, setDungeon,
        inventory, setInventory, addItem,
        equipment, setEquipment,
        materials, setMaterials,
        quickSlots, setQuickSlots,
        resetInventory,
        reorderInventory,
        stats, setStats,
        activeQuests, setActiveQuests,
        completedQuests, setCompletedQuests,
        questProgress, setQuestProgress,
        initGame, addMessage, showFloatingText, effectsManager,
        handleEnemyDeath, executeSkillAction, performAttack, // Add performAttack
        addMaterial, // Exposed helper
        setGameStarted, setGameOver, setPlayerName, setSelectedSkill, setRangedMode, setRangedTargets, setMessages, updateMapFOV, setGameWon,
        playerName, selectedAppearance, setSelectedAppearance, setPlayerClass,
        selectedSkill,
        spatialHash
    }), [
        player, dungeon, inventory, equipment, materials, quickSlots, stats, activeQuests, completedQuests, questProgress,
        initGame, addMessage, showFloatingText,
        setGameStarted, setGameOver, setPlayerName, setSelectedSkill, setRangedMode, setRangedTargets, setMessages, updateMapFOV,
        playerName, selectedAppearance, setPlayerClass,
        handleEnemyDeath, executeSkillAction, selectedSkill,
        spatialHash
    ]);
}
