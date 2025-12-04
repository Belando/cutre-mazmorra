import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

// Componentes del Juego
import GameBoard from '@/components/game/GameBoard';
import PlayerStats from '@/components/game/PlayerStats';
import MessageLog from '@/components/game/MessageLog';
import GameOver from '@/components/game/GameOver';
import MiniMap from '@/components/game/MiniMap';
import InventoryPanel from '@/components/game/InventoryPanel';
import QuickSlots, { QUICK_SLOT_HOTKEYS } from '@/components/game/QuickSlots';
import SkillBar from '@/components/game/SkillBar';
import NPCDialog from '@/components/game/NPCDialog';
import CharacterSelect from '@/components/game/CharacterSelect';
import CraftingPanel from '@/components/game/CraftingPanel';
import SkillTree from '@/components/game/SkillTree';

// Custom Hook con la lógica
import { useGameEngine } from '@/hooks/useGameEngine';
import { getWeaponRange } from '@/components/game/EquipmentSystem';
import { hasSaveGame, deleteSave } from '@/components/game/SaveSystem';

export default function Game() {
  // Extraemos estado y acciones del motor
  const { 
    gameState, gameStarted, gameOver, messages, stats, playerInfo, uiState, actions 
  } = useGameEngine();

  // Estados locales de UI (ventanas abiertas)
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [craftingOpen, setCraftingOpen] = useState(false);
  const [skillTreeOpen, setSkillTreeOpen] = useState(false);
  const [activeNPC, setActiveNPC] = useState(null);

  // Detectar NPC cercano automáticamente
  useEffect(() => {
    if (gameState && !activeNPC) {
      const npc = gameState.npcs?.find(n => 
        Math.abs(n.x - gameState.player.x) + Math.abs(n.y - gameState.player.y) <= 1
      );
      if (npc) setActiveNPC(npc);
    } else if (gameState && activeNPC) {
      const dist = Math.abs(activeNPC.x - gameState.player.x) + Math.abs(activeNPC.y - gameState.player.y);
      if (dist > 1) setActiveNPC(null);
    }
  }, [gameState, activeNPC]);

  // Manejo de teclado simplificado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStarted || gameOver) return;

      // Teclas de UI
      if (e.key.toLowerCase() === 'i') { setInventoryOpen(p => !p); return; }
      if (e.key.toLowerCase() === 'c') { setCraftingOpen(p => !p); return; }
      if (e.key.toLowerCase() === 't') { setSkillTreeOpen(p => !p); return; }
      if (e.key === 'Escape') {
        setInventoryOpen(false); setCraftingOpen(false); setSkillTreeOpen(false);
        actions.setRangedMode(false);
        return;
      }

      if (inventoryOpen || craftingOpen || skillTreeOpen) return;

      // Movimiento
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': actions.move(0, -1); break;
        case 'ArrowDown': case 's': case 'S': actions.move(0, 1); break;
        case 'ArrowLeft': case 'a': case 'A': actions.move(-1, 0); break;
        case 'ArrowRight': case 'd': case 'D': actions.move(1, 0); break;
        case ' ': actions.wait(); break;
        case 'Enter': actions.descend(); break;
        case 'g': case 'G': actions.saveGame(); break;
      }

      // Habilidades y QuickSlots
      if (e.key >= '1' && e.key <= '6') {
        // ... lógica para seleccionar skill por índice ...
        // (Puedes implementar un helper en actions si lo necesitas)
      }
      
      if (QUICK_SLOT_HOTKEYS.includes(e.key.toLowerCase())) {
        const idx = QUICK_SLOT_HOTKEYS.indexOf(e.key.toLowerCase());
        actions.useQuickSlot(idx);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver, inventoryOpen, craftingOpen, skillTreeOpen, actions]);

  // --- RENDERIZADO: PANTALLA DE SELECCIÓN ---
  if (!gameStarted) {
    const hasSave = hasSaveGame();
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <CharacterSelect 
            onSelect={actions.selectCharacter}
            playerName={playerInfo.name}
            onNameChange={actions.setPlayerName}
          />
          {hasSave && (
            <div className="flex gap-2">
              <Button onClick={actions.loadGame} className="bg-emerald-700 hover:bg-emerald-600">
                📂 Cargar Partida
              </Button>
              <Button onClick={() => { deleteSave(); window.location.reload(); }} variant="outline" className="text-red-400 border-red-800">
                🗑 Borrar
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- RENDERIZADO: JUEGO PRINCIPAL ---
  return (
    <div className="min-h-screen p-2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto h-[calc(100vh-16px)]">
        <div className="flex h-full gap-2">
          {/* BARRA IZQUIERDA */}
          <div className="flex flex-col flex-shrink-0 w-20 gap-2">
            <SkillBar 
              skills={gameState?.player?.skills}
              playerLevel={gameState?.player?.level || 1}
              cooldowns={gameState?.player?.skills?.cooldowns}
              selectedSkill={uiState.selectedSkill}
              onSelectSkill={actions.setSelectedSkill}
              disabled={inventoryOpen || gameOver}
            />
            <QuickSlots
              quickSlots={uiState.quickSlots}
              onUseSlot={(idx) => actions.useQuickSlot(idx)}
              disabled={inventoryOpen || gameOver}
              inventory={gameState?.inventory}
            />
          </div>
          
          {/* ÁREA CENTRAL (JUEGO) */}
          <div className="flex flex-col flex-1 min-w-0 gap-2 overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center">
              <GameBoard gameState={gameState} viewportWidth={23} viewportHeight={15} />
            </motion.div>
            <div className="h-28 w-full max-w-[744px] mx-auto">
              <MessageLog messages={messages} />
            </div>
          </div>
          
          {/* BARRA DERECHA */}
          <div className="flex flex-col flex-shrink-0 w-48 gap-2">
            <PlayerStats 
              player={gameState?.player} 
              dungeonLevel={gameState?.level}
              onOpenInventory={() => setInventoryOpen(true)}
              inventoryCount={gameState?.inventory?.length || 0}
              appearance={playerInfo.appearance}
              playerClass={playerInfo.class}
            />
            <MiniMap gameState={gameState} />
            <div className="flex flex-col gap-1">
              <Button onClick={() => setCraftingOpen(true)} className="h-6 text-[10px] bg-amber-800/80">⚒ Artesanía [C]</Button>
              <Button onClick={() => setSkillTreeOpen(true)} className="h-6 text-[10px] bg-purple-900/80">✦ Habilidades [T]</Button>
              <Button onClick={actions.saveGame} className="h-6 text-[10px] bg-slate-800/80">💾 Guardar [G]</Button>
            </div>
          </div>
        </div>
      </div>

      {/* MODALES Y PANELES */}
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
          />
        )}
        {activeNPC && (
          <NPCDialog
            npc={activeNPC}
            player={gameState.player}
            onClose={() => setActiveNPC(null)}
            // ... pasar handlers de NPC si se implementan en useGameEngine ...
          />
        )}
        {craftingOpen && (
          <CraftingPanel
            isOpen={craftingOpen}
            onClose={() => setCraftingOpen(false)}
            materials={uiState.materials}
            inventory={gameState.inventory}
            equipment={gameState.equipment}
            gold={gameState.player.gold}
            // ... pasar handlers de crafting ...
          />
        )}
        {skillTreeOpen && (
            <SkillTree 
                isOpen={skillTreeOpen}
                onClose={() => setSkillTreeOpen(false)}
                // ... pasar props de skills ...
            />
        )}
      </AnimatePresence>

      {gameOver && <GameOver stats={stats} onRestart={actions.restart} />}
    </div>
  );
}