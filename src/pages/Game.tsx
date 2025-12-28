import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { GiTreeGrowth, GiScrollQuill } from 'react-icons/gi';
import { toGrid, toScreen } from '@/utils/isometric';

import GameBoard from "@/components/game/GameBoard";
import PlayerStats from '@/components/ui/PlayerStats';
import MessageLog from '@/components/ui/MessageLog';
import MiniMap from '@/components/game/MiniMap';
import QuickSlots from '@/components/ui/QuickSlots';
import SkillBar from '@/components/ui/SkillBar';
import CharacterSelect from '@/components/ui/CharacterSelect';
import GameOverlays from '@/components/overlays/GameOverlays';

import PauseMenu from '@/components/ui/PauseMenu';

import { hasSaveGame, deleteSave } from '@/engine/systems/SaveSystem';

import { useGame } from '@/context/GameContext';
import { useInputHandler } from '@/hooks/useInputHandler';
import { useAssetLoader } from '@/hooks/useAssetLoader';
import VirtualCursor from '@/components/ui/VirtualCursor';

export default function Game() {
    const { gameState, gameStarted, gameOver, messages, stats, playerInfo, uiState, actions } = useGame();

    const [inventoryOpen, setInventoryOpen] = useState(false);
    const [craftingOpen, setCraftingOpen] = useState(false);
    const [skillTreeOpen, setSkillTreeOpen] = useState(false);
    const [activeNPC, setActiveNPC] = useState<any>(null);
    const [pauseMenuOpen, setPauseMenuOpen] = useState(false);
    const [mapExpanded, setMapExpanded] = useState(false);

    const modals = { inventoryOpen, setInventoryOpen, craftingOpen, setCraftingOpen, skillTreeOpen, setSkillTreeOpen, activeNPC, setActiveNPC, pauseMenuOpen, setPauseMenuOpen, mapExpanded, setMapExpanded };

    const [tempName, setTempName] = useState("Héroe");

    useEffect(() => {
        if (gameState && activeNPC && gameState.player) {
            const dist = Math.abs(activeNPC.x - gameState.player.x) + Math.abs(activeNPC.y - gameState.player.y);
            if (dist > 1) setActiveNPC(null);
        }
    }, [gameState, activeNPC]);

    useInputHandler({
        gameStarted,
        gameOver,
        uiState,
        actions,
        gameState,
        modals: modals as any
    });

    const { loading: assetsLoading, progress: assetProgress } = useAssetLoader();

    const [hoveredTarget, setHoveredTarget] = useState<any>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!gameState?.player || !gameState.map) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Player is centered
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const deltaX = mouseX - centerX;
        const deltaY = mouseY - centerY;

        // Screen-space targeting (Select closest enemy to cursor)
        const TILE_SIZE = 96; // Approximate hit radius
        let minDist = Infinity;
        let bestTarget = null;

        gameState.enemies.forEach((enemy: any) => {
            // Calculate relative position of enemy to player (who is at center)
            // We can use toScreen with relative grid coords
            const relX = enemy.x - gameState.player.x;
            const relY = enemy.y - gameState.player.y;

            // Convert to screen delta
            // toScreen returns {x, y} which is iso offset from center
            const screenPos = toScreen(relX, relY);

            // Distance from mouse cursor (which is deltaX, deltaY from center)
            const dist = Math.hypot(screenPos.x - deltaX, screenPos.y - deltaY);

            if (dist < TILE_SIZE * 0.8 && dist < minDist) {
                minDist = dist;
                bestTarget = enemy;
            }
        });

        setHoveredTarget(bestTarget);
    };

    const handleMouseClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!gameState?.player || !gameState.map || inventoryOpen || craftingOpen || skillTreeOpen || activeNPC) return;

        // If hovering an enemy, attack it
        if (hoveredTarget && actions.performAttack) {
            // Find by ID instead of reference to avoid stale object issues
            const idx = gameState.enemies.findIndex((e: any) => e.id === hoveredTarget.id);
            if (idx !== -1) {
                const target = gameState.enemies[idx];
                const player = gameState.player;
                const dist = Math.max(Math.abs(target.x - player.x), Math.abs(target.y - player.y));

                // Allow attack if adjacent (distance <= 1.5 to cover diagonals)
                // TODO: Get weapon range? For now assume melee 1.5
                if (dist <= 1.5) {
                    actions.performAttack(target, idx);
                } else {
                    actions.addMessage("¡Está demasiado lejos!", 'warning');
                    if (actions.effectsManager && actions.effectsManager.current) {
                        actions.effectsManager.current.addText(player.x, player.y, "Range?", '#94a3b8');
                    }
                }
            }
        }
    };

    if (!gameStarted) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                <CharacterSelect
                    playerName={tempName}
                    onNameChange={setTempName}
                    onSelect={(appearanceKey: string, appearanceData: any) => {
                        actions.setPlayerName(tempName);
                        actions.setSelectedAppearance(appearanceKey);
                        actions.setPlayerClass(appearanceData.class);
                        actions.setGameStarted(true);
                        actions.initGame(1);
                    }}
                />
            </div>
        );
    }

    if (assetsLoading) {
        return (
            <div className="flex flex-col items-center justify-center w-screen h-screen bg-black text-slate-200">
                <div className="mb-4 text-2xl font-bold">Cargando Recursos...</div>
                <div className="w-64 h-2 overflow-hidden rounded-full bg-slate-800">
                    <motion.div
                        className="h-full bg-blue-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${assetProgress}%` }}
                    />
                </div>
            </div>
        );
    }

    if (!gameState || !gameState.player || !gameState.map || gameState.map.length === 0) {
        return (
            <div className="flex items-center justify-center w-screen h-screen bg-black text-white">
                <div className="text-xl animate-pulse">Generando Mazmorra...</div>
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
            <div
                className="relative w-screen h-screen overflow-hidden bg-black"
                onClick={handleMouseClick}
                onMouseMove={handleMouseMove}
            >

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative pointer-events-auto">
                        <GameBoard gameState={gameState} viewportWidth={24} viewportHeight={15} hoveredTarget={hoveredTarget} />

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

                {/* TOP LEFT: Player Stats */}
                <div className="absolute top-4 left-4 z-20 w-64 pointer-events-none">
                    {/* Remove background/border here, let components handle it or minimze styling */}
                    <div className="pointer-events-auto">
                        <PlayerStats player={gameState?.player} dungeonLevel={gameState?.level} />
                    </div>
                </div>

                {/* TOP RIGHT: Minimap & System Buttons */}
                <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 pointer-events-none">
                    <div className="pointer-events-auto">
                        <MiniMap gameState={gameState} expanded={mapExpanded} onExpandChange={setMapExpanded} />
                        {/* System buttons moved to Pause Menu */}
                    </div>
                </div>

                {/* BOTTOM LEFT: Message Log */}
                <div className="absolute bottom-4 left-4 z-20 w-[400px] pointer-events-none">
                    <div className="h-40 overflow-hidden pointer-events-auto">
                        <MessageLog messages={messages} />
                    </div>
                </div>

                {/* BOTTOM CENTER: Skills & QuickSlots (Horizontal) */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-end gap-4 pointer-events-none">
                    <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-xl flex items-center gap-4 pointer-events-auto px-6">
                        <SkillBar disabled={inventoryOpen || gameOver} />
                        <div className="w-px h-8 bg-slate-700/50"></div>
                        <QuickSlots quickSlots={uiState.quickSlots} onUseSlot={actions.useQuickSlot} disabled={inventoryOpen || gameOver} inventory={gameState?.inventory} />
                    </div>
                </div>
            </div>

            <PauseMenu
                isOpen={pauseMenuOpen}
                onResume={() => setPauseMenuOpen(false)}
                onOpenInventory={() => { setPauseMenuOpen(false); setInventoryOpen(true); }}
                onOpenSkills={() => { setPauseMenuOpen(false); setSkillTreeOpen(true); }}
                onOpenQuests={() => { /* Placeholder for future Quest UI */ actions.addMessage("Sistema de misiones no implementado aún", 'info'); }}
                onOpenMap={() => { setPauseMenuOpen(false); setMapExpanded(true); }}
                onSave={() => { actions.saveGame(); setPauseMenuOpen(false); }}
                onLoad={() => { actions.loadGame(); setPauseMenuOpen(false); }}
                onExit={() => { window.location.reload(); }} // Simple restart for now
            />

            <GameOverlays gameState={gameState} uiState={uiState} actions={actions} modals={modals as any} playerInfo={playerInfo} stats={stats} gameOver={gameOver} onRestart={actions.restart} />
            <VirtualCursor isActive={!gameStarted || inventoryOpen || craftingOpen || skillTreeOpen || !!activeNPC || pauseMenuOpen} />
        </div>
    );
}
