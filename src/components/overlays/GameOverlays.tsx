import React from 'react';
import { AnimatePresence } from 'framer-motion';
import InventoryPanel from '@/components/ui/InventoryPanel';
import NPCDialog from './NPCDialog';
import CraftingPanel from '@/components/ui/CraftingPanel';
import SkillTree from '@/components/ui/SkillTree';
import GameOver from './GameOver';
import { GameState } from '@/types';

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
                        equipment={gameState.equipment}
                        player={gameState.player as any}
                        onUseItem={actions.useItem}
                        onEquipItem={actions.equipItem}
                        onUnequipItem={actions.unequipItem}
                        onDropItem={actions.dropItem}
                        onAssignQuickSlot={actions.assignToQuickSlot}
                        onReorder={actions.reorderInventory}
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
                        equipment={gameState.equipment}
                        gold={gameState.player.gold}
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
                        playerLevel={gameState.player.level}
                        learnedSkills={gameState.player.skills.learned}
                        skillLevels={gameState.player.skills.skillLevels}
                        skillPoints={gameState.player.skills.skillPoints}
                        evolvedClass={gameState.player.skills.evolvedClass}
                        onLearnSkill={actions.learnSkill}
                        onUpgradeSkill={actions.upgradeSkill}
                        onEvolve={actions.evolveClass}
                    />
                )}
            </AnimatePresence>

            {gameOver && <GameOver stats={stats} onRestart={onRestart} />}
        </>
    );
}
