import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

// Componentes
import GameBoard from '@/components/game/GameBoard';
import PlayerStats from '@/components/game/PlayerStats';
import MessageLog from '@/components/game/MessageLog';
import MiniMap from '@/components/game/MiniMap';
import QuickSlots from '@/components/game/QuickSlots';
import SkillBar from '@/components/game/SkillBar';
import CharacterSelect from '@/components/game/CharacterSelect';
import GameOverlays from '@/components/game/GameOverlays'; // Nuevo componente combinado

// Hooks
import { useGameEngine } from '@/hooks/useGameEngine';
import { useInputHandler } from '@/hooks/useInputHandler'; // Nuevo hook
import { hasSaveGame, deleteSave } from '@/components/game/SaveSystem';

export default function Game() {
  // 1. Inicializar el motor del juego (Lógica central)
  const { 
    gameState, gameStarted, gameOver, messages, stats, playerInfo, uiState, actions 
  } = useGameEngine();

  // 2. Estado local para la visibilidad de menús (UI)
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [craftingOpen, setCraftingOpen] = useState(false);
  const [skillTreeOpen, setSkillTreeOpen] = useState(false);
  const [activeNPC, setActiveNPC] = useState(null);

  // Agrupamos los estados de modales para pasarlos fácilmente
  const modals = {
    inventoryOpen, setInventoryOpen,
    craftingOpen, setCraftingOpen,
    skillTreeOpen, setSkillTreeOpen,
    activeNPC, setActiveNPC
  };

  // 3. Efecto: Cerrar diálogo de NPC si el jugador se aleja
  useEffect(() => {
    if (gameState && activeNPC) {
      const dist = Math.abs(activeNPC.x - gameState.player.x) + Math.abs(activeNPC.y - gameState.player.y);
      if (dist > 1) setActiveNPC(null);
    }
  }, [gameState, activeNPC]);

  // 4. Inicializar el manejador de teclado (Input)
  useInputHandler({ gameStarted, gameOver, uiState, actions, gameState, modals });

  // --- PANTALLA: SELECCIÓN DE PERSONAJE ---
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
              <Button onClick={actions.loadGame} className="bg-emerald-700 hover:bg-emerald-600">📂 Cargar</Button>
              <Button onClick={() => { deleteSave(); window.location.reload(); }} variant="outline" className="text-red-400 border-red-800 hover:bg-red-900/20">🗑 Borrar</Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Check de proximidad para aviso visual
  const isInteractableNear = gameState && !activeNPC && (
    gameState.npcs?.some(n => Math.abs(n.x - gameState.player.x) + Math.abs(n.y - gameState.player.y) <= 1) || 
    gameState.chests?.some(c => Math.abs(c.x - gameState.player.x) + Math.abs(c.y - gameState.player.y) <= 1 && !c.opened)
  );

  // --- PANTALLA: JUEGO PRINCIPAL ---
  return (
    <div className="min-h-screen p-2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto h-[calc(100vh-16px)] flex gap-2">
        
        {/* COLUMNA IZQUIERDA: Habilidades y Accesos */}
        <div className="flex flex-col flex-shrink-0 w-20 gap-2">
          <SkillBar 
            skills={gameState?.player?.skills}
            playerLevel={gameState?.player?.level || 1}
            cooldowns={gameState?.player?.skills?.cooldowns}
            selectedSkill={uiState.selectedSkill}
            onSelectSkill={actions.setSelectedSkill}
            disabled={inventoryOpen || gameOver}
            playerClass={playerInfo.class}
          />
          <QuickSlots
            quickSlots={uiState.quickSlots}
            onUseSlot={(idx) => actions.useQuickSlot(idx)}
            disabled={inventoryOpen || gameOver}
            inventory={gameState?.inventory}
          />
        </div>
        
        {/* COLUMNA CENTRAL: Tablero y Log */}
        <div className="flex flex-col flex-1 min-w-0 gap-4 overflow-hidden">
          <div className="relative flex items-center justify-center">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <GameBoard gameState={gameState} viewportWidth={23} viewportHeight={15} />
              </motion.div>
              {/* Aviso Flotante */}
              {isInteractableNear && (
                  <div className="absolute z-10 transform -translate-x-1/2 -translate-y-12 pointer-events-none top-1/2 left-1/2">
                      <motion.div 
                          initial={{ scale: 0, y: 10 }} animate={{ scale: 1, y: 0 }}
                          className="bg-slate-900/90 text-yellow-400 px-3 py-1.5 rounded-full text-xs font-bold border border-yellow-500/50 shadow-lg flex items-center gap-1 backdrop-blur-sm"
                      >
                          <span className="w-4 h-4 flex items-center justify-center bg-slate-700 rounded text-[9px] border border-slate-500">E</span>
                          <span>Interactuar</span>
                      </motion.div>
                  </div>
              )}
          </div>
          <div className="h-28 w-full max-w-[744px] mx-auto flex-shrink-0">
            <MessageLog messages={messages} />
          </div>
        </div>
        
        {/* COLUMNA DERECHA: Stats y Menús */}
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
            <Button onClick={() => setCraftingOpen(true)} className="h-6 text-[10px] bg-amber-800/80 hover:bg-amber-700 border border-amber-700/50">⚒ Artesanía [C]</Button>
            <Button onClick={() => setSkillTreeOpen(true)} className="h-6 text-[10px] bg-purple-900/80 hover:bg-purple-800 border border-purple-700/50">✦ Habilidades [T]</Button>
            <Button onClick={actions.saveGame} className="h-6 text-[10px] bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50">💾 Guardar [G]</Button>
            <div className="text-[8px] text-slate-600 text-center mt-1">WASD: Mover | E: Interactuar | ESPACIO: Esperar</div>
          </div>
        </div>
      </div>

      {/* CAPA DE MODALES */}
      <GameOverlays 
        gameState={gameState}
        uiState={uiState}
        actions={actions}
        modals={modals}
        playerInfo={playerInfo}
        stats={stats}
        gameOver={gameOver}
        onRestart={actions.restart}
      />
    </div>
  );
}