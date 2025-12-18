import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { GiTreeGrowth, GiScrollQuill } from 'react-icons/gi';

// --- RUTAS DE COMPONENTES ---
import GameBoard from "@/components/game/GameBoard";
import PlayerStats from '@/components/ui/PlayerStats';
import MessageLog from '@/components/ui/MessageLog';
import MiniMap from '@/components/game/MiniMap';
import QuickSlots from '../components/ui/QuickSlots';
import SkillBar from '@/components/ui/SkillBar';
import CharacterSelect from '@/components/ui/CharacterSelect';
import GameOverlays from '@/components/overlays/GameOverlays';
import TurnTimer from '@/components/ui/TurnTimer'; // Asegúrate de tener este componente creado
import { hasSaveGame, deleteSave } from '@/engine/systems/SaveSystem';

// --- HOOKS ---
import { useGame } from '@/context/GameContext';
import { useInputHandler } from '@/hooks/useInputHandler';
import { useAutoTurn } from '@/hooks/useAutoTurn'; // El hook corregido
import { useAssetLoader } from '@/hooks/useAssetLoader';

export default function Game() {
  const { gameState, gameStarted, gameOver, messages, stats, playerInfo, uiState, actions } = useGame();
  
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [craftingOpen, setCraftingOpen] = useState(false);
  const [skillTreeOpen, setSkillTreeOpen] = useState(false);
  const [activeNPC, setActiveNPC] = useState(null);

  // Estado para reiniciar la animación de la barra (cambia cada turno)
  const [turnTrigger, setTurnTrigger] = useState(0);
  const TURN_DURATION = 1500; 

  const modals = { inventoryOpen, setInventoryOpen, craftingOpen, setCraftingOpen, skillTreeOpen, setSkillTreeOpen, activeNPC, setActiveNPC };

  // --- CALLBACK VISUAL ---
  // Esta función se llama cuando el turno pasa automáticamente
  const triggerVisualUpdate = () => {
    setTurnTrigger(Date.now());
  };

  // --- HOOK DE AUTO-TURNO (CORREGIDO) ---
  const { resetTimer } = useAutoTurn(
    actions, 
    gameStarted, 
    gameOver, 
    modals, 
    TURN_DURATION, 
    triggerVisualUpdate // Se llama cuando el tiempo se agota
  );

  // --- ACCIÓN MANUAL ---
  // Se llama cuando el jugador pulsa una tecla
  const handleAction = () => {
    resetTimer();        // Reinicia el reloj lógico (para que no salte doble turno)
    triggerVisualUpdate(); // Reinicia la animación visual inmediatamente
  };

  useEffect(() => {
    if (gameState && activeNPC && gameState.player) {
      const dist = Math.abs(activeNPC.x - gameState.player.x) + Math.abs(activeNPC.y - gameState.player.y);
      if (dist > 1) setActiveNPC(null);
    }
  }, [gameState, activeNPC]);

  // Input Handler conectado al sistema de turnos
  useInputHandler({ 
    gameStarted, 
    gameOver, 
    uiState, 
    actions, 
    gameState, 
    modals,
    onAction: handleAction // <--- IMPORTANTE: Conecta el input con el reloj
  });

  // --- ASSET LOADER ---
  const { loading: assetsLoading, progress: assetProgress } = useAssetLoader();

  if (!gameStarted) {
    const hasSave = hasSaveGame();
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <CharacterSelect onSelect={actions.selectCharacter} playerName={playerInfo.name} onNameChange={actions.setPlayerName} />
          {hasSave && <div className="flex gap-2"><Button onClick={actions.loadGame} className="bg-emerald-700">Cargar</Button><Button onClick={() => { deleteSave(); window.location.reload(); }} variant="outline" className="text-red-400 border-red-800">Borrar</Button></div>}
        </div>
      </div>
    );
  }

  // PANTALLA DE CARGA DE ASSETS
  if (assetsLoading) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen text-white bg-slate-950">
           <div className="w-16 h-16 mb-4 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
           <h2 className="text-xl font-bold animate-pulse">Cargando Sprites... {assetProgress}%</h2>
        </div>
     );
  }

  if (!gameState || !gameState.player || !gameState.map || gameState.map.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-slate-950">
        <div className="w-16 h-16 mb-4 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        <h2 className="text-xl font-bold animate-pulse">Generando mazmorra...</h2>
      </div>
    );
  }

  const isInteractable = gameState && !activeNPC && gameState.player && (
    gameState.npcs?.some(n => Math.abs(n.x-gameState.player.x)+Math.abs(n.y-gameState.player.y)<=1) || 
    gameState.chests?.some(c => Math.abs(c.x-gameState.player.x)+Math.abs(c.y-gameState.player.y)<=1 && !c.isOpen)
  );
  
  return (
    <div className="min-h-screen p-2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="relative w-screen h-screen overflow-hidden bg-black">
        
        {/* Layer 0: Game Board (Full Screen) */}
        <div className="absolute inset-0 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
              <GameBoard gameState={gameState} viewportWidth={24} viewportHeight={15} />
               
               {/* Floating Interact Prompt (Attached to GameBoard center usually, but here fixed overlay for simplicity or logic inside GameBoard?) 
                   Actually keeping it here relative to GameBoard container might be tricky if GameBoard is fixed.
                   Let's keep the isInteractable prompt in the center for now, or move it to a UI layer.
               */}
               {isInteractable && (
                <div className="absolute z-30 transform -translate-x-1/2 -translate-y-16 top-1/2 left-1/2 animate-bounce pointer-events-none">
                  <div className="bg-slate-900/90 text-yellow-400 px-3 py-1.5 rounded-full text-xs font-bold border border-yellow-500/50 shadow-lg flex items-center gap-2">
                    <span className="w-5 h-5 bg-yellow-500 text-black rounded flex items-center justify-center text-[10px]">E</span>
                    Interactuar
                  </div>
                </div>
              )}
            </motion.div>
        </div>

        {/* Layer 1: HUD Overlays */}
        
        {/* Top Left: Skills & QuickSlots */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
           <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-xl flex flex-col gap-2 w-fit">
              <SkillBar disabled={inventoryOpen || gameOver} />
              <QuickSlots quickSlots={uiState.quickSlots} onUseSlot={actions.useQuickSlot} disabled={inventoryOpen || gameOver} inventory={gameState?.inventory} />
           </div>
        </div>

        {/* Top Right: Stats, MiniMap, Buttons */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 w-56">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-xl flex flex-col gap-2">
               <PlayerStats player={gameState?.player} dungeonLevel={gameState?.level} onOpenInventory={() => setInventoryOpen(true)} inventoryCount={gameState?.inventory?.length} appearance={playerInfo.appearance} playerClass={playerInfo.class} />
               <MiniMap gameState={gameState} />
               
               <div className="flex flex-col gap-1 mt-1">
                <Button onClick={() => setSkillTreeOpen(true)} className="h-8 text-xs border bg-purple-900/60 hover:bg-purple-800/80 border-purple-500/30 flex items-center justify-center gap-2">
                  <GiTreeGrowth className="w-4 h-4" /> Habilidades [T]
                </Button>
                <Button onClick={actions.saveGame} className="h-8 text-xs border bg-slate-800/60 hover:bg-slate-700/80 border-slate-600/30 flex items-center justify-center gap-2">
                  <GiScrollQuill className="w-4 h-4" /> Guardar [G]
                </Button>
              </div>
            </div>
        </div>

        {/* Bottom Center: Logs & Timer */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[600px] max-w-[90vw] flex flex-col gap-2 z-20 pointer-events-none">
            {gameStarted && !gameOver && (
              <div className="w-full max-w-[400px] mx-auto pointer-events-auto">
                 <TurnTimer duration={TURN_DURATION} trigger={turnTrigger} />
              </div>
            )}
            <div className="h-40 bg-slate-950/80 p-3 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-2xl overflow-hidden pointer-events-auto">
               <MessageLog messages={messages} />
            </div>
        </div>
      </div>

      <GameOverlays gameState={gameState} uiState={uiState} actions={actions} modals={modals} playerInfo={playerInfo} stats={stats} gameOver={gameOver} onRestart={actions.restart} />
    </div>
  );
}