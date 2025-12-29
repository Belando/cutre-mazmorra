import { useState, useCallback } from 'react';
import { NPC } from '@/types';

export type GameUIState =
    | 'PLAYING'
    | 'INVENTORY'
    | 'CRAFTING'
    | 'SKILLS'
    | 'PAUSE_MENU'
    | 'MAP_EXPANDED'
    | 'NPC_DIALOG';

export interface GameUIContext {
    currentState: GameUIState;
    activeNPC: NPC | null;
    isModalOpen: boolean;

    // Actions
    openInventory: () => void;
    openCrafting: () => void;
    openSkills: () => void;
    openPauseMenu: () => void;
    openMap: () => void;
    startDialog: (npc: NPC) => void;
    closeAll: () => void;
    toggleInventory: () => void;
    toggleSkills: () => void;
    togglePause: () => void;
    toggleMap: () => void;
}

export function useGameUI() {
    const [currentState, setCurrentState] = useState<GameUIState>('PLAYING');
    const [activeNPC, setActiveNPC] = useState<NPC | null>(null);

    const isModalOpen = currentState !== 'PLAYING';

    const closeAll = useCallback(() => {
        setCurrentState('PLAYING');
        setActiveNPC(null);
    }, []);

    const openInventory = useCallback(() => setCurrentState('INVENTORY'), []);
    const openCrafting = useCallback(() => setCurrentState('CRAFTING'), []);
    const openSkills = useCallback(() => setCurrentState('SKILLS'), []);
    const openPauseMenu = useCallback(() => setCurrentState('PAUSE_MENU'), []);
    const openMap = useCallback(() => setCurrentState('MAP_EXPANDED'), []);

    const startDialog = useCallback((npc: NPC) => {
        setActiveNPC(npc);
        setCurrentState('NPC_DIALOG');
    }, []);

    // Toggles logic
    const toggleInventory = useCallback(() => {
        setCurrentState(prev => prev === 'INVENTORY' ? 'PLAYING' : 'INVENTORY');
    }, []);

    const toggleSkills = useCallback(() => {
        setCurrentState(prev => prev === 'SKILLS' ? 'PLAYING' : 'SKILLS');
    }, []);

    const togglePause = useCallback(() => {
        setCurrentState(prev => prev === 'PAUSE_MENU' ? 'PLAYING' : 'PAUSE_MENU');
    }, []);

    const toggleMap = useCallback(() => {
        setCurrentState(prev => prev === 'MAP_EXPANDED' ? 'PLAYING' : 'MAP_EXPANDED');
    }, []);

    return {
        currentState,
        activeNPC,
        isModalOpen,
        openInventory,
        openCrafting,
        openSkills,
        openPauseMenu,
        openMap,
        startDialog,
        closeAll,
        toggleInventory,
        toggleSkills,
        togglePause,
        toggleMap
    };
}
