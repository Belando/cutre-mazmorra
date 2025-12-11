import { AnimatePresence } from 'framer-motion';
import InventoryPanel from '@/components/ui/InventoryPanel';
import NPCDialog from './NPCDialog'; 
import CraftingPanel from '@/components/ui/CraftingPanel';
import SkillTree from '@/components/ui/SkillTree';
import GameOver from './GameOver'; 

export default function GameOverlays({ 
  gameState, 
  uiState, 
  actions, 
  modals, 
  playerInfo,
  stats,
  gameOver,
  onRestart 
}) {
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
            player={gameState.player}
            onUseItem={actions.useItem}
            onEquipItem={actions.equipItem}
            onUnequipItem={actions.unequipItem}
            onDropItem={actions.dropItem}
            onAssignQuickSlot={actions.assignQuickSlot}
            quickSlots={uiState.quickSlots}
            onReorder={actions.reorderInventory}
          />
        )}
        
        {/* Diálogo estándar para NPCs normales */}
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
            questProgress={uiState.questProgress}
            gameState={gameState}
            inventory={gameState.inventory}
          />
        )}

        {/* Panel de Artesanía rediseñado */}
        {showCrafting && (
          <CraftingPanel
            isOpen={showCrafting}
            onClose={closeCrafting}
            materials={uiState.materials}
            inventory={gameState.inventory}
            equipment={gameState.equipment}
            gold={gameState.player.gold}
            onCraft={actions.craftItem}
            onUpgrade={actions.upgradeItem}
            npc={activeNPC} // <--- NUEVO: Pasamos el NPC herrero
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