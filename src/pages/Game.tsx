import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
// Icons removed as they are no longer used in this file
// import { GiTreeGrowth, GiScrollQuill } from 'react-icons/gi';

// import GameBoard from "@/components/game/GameBoard";
import Game3DViewer from "@/components/game/Game3DViewer";
import PlayerStats from '@/components/ui/PlayerStats';
import MessageLog from '@/components/ui/MessageLog';
import MiniMap from '@/components/game/MiniMap';
import QuickSlots from '@/components/ui/QuickSlots';
import SkillBar from '@/components/ui/SkillBar';
import CharacterSelect from '@/components/ui/CharacterSelect';
import GameOverlays from '@/components/overlays/GameOverlays';
import TurnTimer from '@/components/ui/TurnTimer';
import MainMenu from '@/components/ui/MainMenu';
import { hasSaveGame, deleteSave } from '@/engine/systems/SaveSystem';

import { useGame } from '@/context/GameContext';
import { useInputHandler } from '@/hooks/useInputHandler';
import { useAutoTurn } from '@/hooks/useAutoTurn';
import { useAssetLoader } from '@/hooks/useAssetLoader';
import VirtualCursor from '@/components/ui/VirtualCursor';

export default function Game() {
    const { gameState, gameStarted, gameOver, messages, stats, playerInfo, uiState, actions } = useGame();

    const [inventoryOpen, setInventoryOpen] = useState(false);
    const [craftingOpen, setCraftingOpen] = useState(false);
    const [skillTreeOpen, setSkillTreeOpen] = useState(false);
    const [mainMenuOpen, setMainMenuOpen] = useState(false);
    const [activeNPC, setActiveNPC] = useState<any>(null);

    const [turnTrigger, setTurnTrigger] = useState(0);
    const TURN_DURATION = 1500;

    const modals = { inventoryOpen, setInventoryOpen, craftingOpen, setCraftingOpen, skillTreeOpen, setSkillTreeOpen, activeNPC, setActiveNPC, mainMenuOpen, setMainMenuOpen };

    const triggerVisualUpdate = () => {
        setTurnTrigger(Date.now());
    };

    const { resetTimer } = useAutoTurn(
        actions,
        gameStarted,
        gameOver,
        modals as any,
        TURN_DURATION,
        triggerVisualUpdate
    );

    const handleAction = () => {
        resetTimer();
        triggerVisualUpdate();
    };

    useEffect(() => {
        if (gameState && activeNPC && gameState.player) {
            const dist = Math.abs(activeNPC.x - gameState.player.x) + Math.abs(activeNPC.y - gameState.player.y);
            if (dist > 1) setActiveNPC(null);
        }
    }, [gameState, activeNPC]);

    const cameraAngleRef = useRef(0);

    useInputHandler({
        gameStarted,
        gameOver,
        uiState,
        actions,
        gameState,
        modals: modals as any,
        onAction: handleAction,
        cameraAngleRef
    });

    const { loading: assetsLoading, progress: assetProgress } = useAssetLoader();

    if (!gameStarted) {
        const hasSave = hasSaveGame();
        return (
            <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <CharacterSelect onSelect={actions.selectCharacter} playerName={playerInfo.name} onNameChange={actions.setPlayerName} />
                    {hasSave && (
                        <div className="flex gap-2">
                            <Button onClick={actions.loadGame} className="bg-emerald-700">Cargar</Button>
                            <Button onClick={() => { deleteSave(); window.location.reload(); }} variant="outline" className="text-red-400 border-red-800">Borrar</Button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

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

    const player = gameState?.player;
    const isInteractable = gameState && !activeNPC && player && (
        gameState.npcs?.some((n: any) => Math.abs(n.x - player.x) + Math.abs(n.y - player.y) <= 1) ||
        gameState.chests?.some((c: any) => Math.abs(c.x - player.x) + Math.abs(c.y - player.y) <= 1 && !c.isOpen)
    );

    return (
        <div className="min-h-screen p-2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="relative w-screen h-screen overflow-hidden bg-black">

                <div className="absolute inset-0 z-0">
                    <Game3DViewer gameState={gameState} cameraAngleRef={cameraAngleRef} />
                </div>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
                        {isInteractable && (
                            <div className="absolute transform -translate-x-1/2 -translate-y-16 top-1/2 left-1/2 animate-bounce">
                                <div className="bg-slate-900/90 text-yellow-400 px-3 py-1.5 rounded-full text-xs font-bold border border-yellow-500/50 shadow-lg flex items-center gap-2">
                                    <span className="w-5 h-5 bg-yellow-500 text-black rounded flex items-center justify-center text-[10px]">E</span>
                                    Interactuar
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>

                <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 w-60">
                    <PlayerStats player={gameState?.player} />
                </div>

                <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 w-80">
                    <MiniMap gameState={gameState} />
                </div>

                <div className="absolute bottom-4 left-4 w-[400px] max-w-[30vw] flex flex-col gap-2 z-20 pointer-events-none">
                    <div className="h-40 overflow-hidden pointer-events-auto">
                        <MessageLog messages={messages} />
                    </div>
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
                    {gameStarted && !gameOver && (
                        <div className="w-full max-w-[400px] mx-auto pointer-events-auto mb-2">
                            <TurnTimer duration={TURN_DURATION} trigger={turnTrigger} />
                        </div>
                    )}

                    <div className="flex flex-row gap-4 items-end">
                        <SkillBar disabled={inventoryOpen || gameOver} />
                        <QuickSlots quickSlots={uiState.quickSlots} onUseSlot={actions.useQuickSlot} disabled={inventoryOpen || gameOver} inventory={gameState?.inventory} />
                    </div>
                </div>
            </div>

            <MainMenu
                isOpen={mainMenuOpen}
                onClose={() => setMainMenuOpen(false)}
                onOpenInventory={() => setInventoryOpen(true)}
                onOpenSkills={() => setSkillTreeOpen(true)}
                onSave={actions.saveGame}
                onQuit={() => window.location.reload()}
            />

            <GameOverlays gameState={gameState} uiState={uiState} actions={actions} modals={modals as any} playerInfo={playerInfo} stats={stats} gameOver={gameOver} onRestart={actions.restart} />
            <VirtualCursor isActive={!gameStarted || inventoryOpen || craftingOpen || skillTreeOpen || !!activeNPC || mainMenuOpen} />
        </div>
    );
}
