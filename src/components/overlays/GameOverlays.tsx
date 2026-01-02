import React from 'react';
import { AnimatePresence } from 'framer-motion';
import InventoryPanel from '@/components/ui/InventoryPanel';
import NPCDialog from './NPCDialog';
import CraftingPanel from '@/components/ui/CraftingPanel';
import SkillTree from '@/components/ui/SkillTree';
import GameOver from './GameOver';
import VictoryScreen from './VictoryScreen';
import { GameState, Item } from '@/types';

interface GameOverlaysProps {
    gameState: GameState;
    uiState: any;
    actions: any;
    modals: {
        inventoryOpen: boolean;
        setInventoryOpen: (v: boolean) => void;
        craftingOpen: boolean;
        setCraftingOpen: (v: boolean) => void;
        skillTreeOpen: boolean;
        setSkillTreeOpen: (v: boolean) => void;
        activeNPC: any;
        setActiveNPC: (v: any) => void;
    };
    playerInfo: any;
    stats: any;
    gameOver: boolean;
    gameWon?: boolean;
    onRestart: () => void;
}

export default function GameOverlays({
    gameState,
    uiState,
    actions,
    modals,
    playerInfo,
    stats,
    gameOver,
    gameWon = false,
    onRestart
}: GameOverlaysProps) {
    const { inventoryOpen, setInventoryOpen, craftingOpen, setCraftingOpen, skillTreeOpen, setSkillTreeOpen, activeNPC, setActiveNPC } = modals;

    const showCrafting = craftingOpen || (activeNPC && activeNPC.type === 'blacksmith');

    const closeCrafting = () => {
        setCraftingOpen(false);
        if (activeNPC && activeNPC.type === 'blacksmith') {
            setActiveNPC(null);
        }
    };

    return (
        <>
            <AnimatePresence>
                {inventoryOpen && (
                    <InventoryPanel
                        isOpen={inventoryOpen}
                        onClose={() => setInventoryOpen(false)}
                        inventory={gameState.inventory}
                        equipment={gameState.equipment as unknown as Record<string, Item | null>}
                        player={gameState.player!}
                        onUseItem={actions.useItem}
                        onEquipItem={actions.equipItem}
                        onUnequipItem={actions.unequipItem}
                        onDropItem={actions.dropItem}
                        onAssignQuickSlot={actions.assignToQuickSlot}
                        onReorder={actions.reorderInventory}
                        materials={gameState.materials}
                    />
                )}

                {activeNPC && activeNPC.type !== 'blacksmith' && (
                    <NPCDialog
                        npc={activeNPC}
                        player={gameState.player}
                        onClose={() => setActiveNPC(null)}
                        onBuy={actions.buyItem}
                        onSell={actions.sellItem}
                        onAcceptQuest={actions.acceptQuest}
                        onCompleteQuest={actions.completeQuest}
                        activeQuests={uiState.activeQuests}
                        completedQuests={uiState.completedQuests}
                        gameState={gameState}
                        inventory={gameState.inventory}
                    />
                )}

                {showCrafting && (
                    <CraftingPanel
                        isOpen={showCrafting}
                        onClose={closeCrafting}
                        inventory={gameState.inventory}
                        equipment={gameState.equipment as unknown as Record<string, Item | null>}
                        gold={gameState.player?.gold || 0}
                        onCraft={actions.craftItem}
                        onUpgrade={actions.upgradeItem}
                        npc={activeNPC}
                    />
                )}

                {skillTreeOpen && (
                    <SkillTree
                        isOpen={skillTreeOpen}
                        onClose={() => setSkillTreeOpen(false)}
                        playerClass={playerInfo.class}
                        playerLevel={gameState.player?.level || 1}
                        learnedSkills={gameState.player?.skills.learned || []}
                        skillLevels={gameState.player?.skills.skillLevels || {}}
                        skillPoints={gameState.player?.skills.skillPoints || 0}
                        evolvedClass={gameState.player?.skills.evolvedClass}
                        onLearnSkill={actions.learnSkill}
                        onUpgradeSkill={actions.upgradeSkill}
                        onEvolve={actions.evolveClass}
                    />
                )}
            </AnimatePresence>

            {gameOver && <GameOver stats={stats} onRestart={onRestart} />}
            {gameWon && <VictoryScreen stats={stats} onRestart={onRestart} />}
        </>
    );
}
