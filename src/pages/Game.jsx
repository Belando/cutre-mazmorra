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
      <div className="max-w-7xl mx-auto h-[calc(100vh-16px)] flex gap-2">
        
        <div className="flex flex-col w-20 gap-2">
          <SkillBar disabled={inventoryOpen || gameOver} />
          <QuickSlots quickSlots={uiState.quickSlots} onUseSlot={actions.useQuickSlot} disabled={inventoryOpen || gameOver} inventory={gameState?.inventory} />
        </div>

        <div className="flex flex-col flex-1 min-w-0 gap-4 overflow-hidden">
          
          {/* BARRA DE TIEMPO (Solo visible si el juego corre) */}
          {gameStarted && !gameOver && (
             <div className="w-full max-w-[400px] mx-auto -mb-2 z-10 relative">
                <TurnTimer duration={TURN_DURATION} trigger={turnTrigger} />
             </div>
          )}

          <div className="relative flex items-center justify-center p-1 border bg-black/50 rounded-xl border-slate-800">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <GameBoard gameState={gameState} viewportWidth={19} viewportHeight={13} />
              </motion.div>
              </motion.div>
              
              {isInteractable && (
                <div className="absolute z-10 transform -translate-x-1/2 -translate-y-16 top-1/2 left-1/2 animate-bounce">
                  <div className="bg-slate-900/90 text-yellow-400 px-3 py-1.5 rounded-full text-xs font-bold border border-yellow-500/50 shadow-lg flex items-center gap-2">
                    <span className="w-5 h-5 bg-yellow-500 text-black rounded flex items-center justify-center text-[10px]">E</span>
                    Interactuar
                  </div>
                </div>
              )}
          </div>
          <div className="h-52 w-full max-w-[744px] mx-auto flex-shrink-0">
            <MessageLog messages={messages} />
          </div>
        </div>

        <div className="flex flex-col w-48 gap-2">
          <PlayerStats player={gameState?.player} dungeonLevel={gameState?.level} onOpenInventory={() => setInventoryOpen(true)} inventoryCount={gameState?.inventory?.length} appearance={playerInfo.appearance} playerClass={playerInfo.class} />
          <MiniMap gameState={gameState} />
          
          <div className="flex flex-col gap-1 mt-2">
            <Button onClick={() => setSkillTreeOpen(true)} className="h-8 text-xs border bg-purple-900/80 hover:bg-purple-800 border-purple-700/50 flex items-center justify-center gap-2">
              <GiTreeGrowth className="w-4 h-4" /> Habilidades [T]
            </Button>
            <Button onClick={actions.saveGame} className="h-8 text-xs border bg-slate-800 hover:bg-slate-700 border-slate-600 flex items-center justify-center gap-2">
              <GiScrollQuill className="w-4 h-4" /> Guardar [G]
            </Button>
          </div>
        </div>
      </div>

      <GameOverlays gameState={gameState} uiState={uiState} actions={actions} modals={modals} playerInfo={playerInfo} stats={stats} gameOver={gameOver} onRestart={actions.restart} />
    </div>
  );
}