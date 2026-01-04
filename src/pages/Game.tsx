import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toScreen } from '@/utils/isometric';
import { Enemy, NPC, Chest } from '@/types';
import { ENTITY } from '@/data/constants';

import CharacterSelect from '@/components/ui/CharacterSelect';
import GameOverlays from '@/components/overlays/GameOverlays';
import PauseMenu from '@/components/ui/PauseMenu';
import VirtualCursor from '@/components/ui/VirtualCursor';

// New Components
import GameWorld from '@/components/game/GameWorld';
import GameHUD from '@/components/game/GameHUD';

// Hooks & Systems
import { useGame } from '@/context/GameContext';
import { useInputHandler } from '@/hooks/useInputHandler';
import { useAssetLoader } from '@/hooks/useAssetLoader';
import { useGameUI } from '@/hooks/useGameUI';

export default function Game() {
    const { gameState, gameStarted, gameOver, messages, stats, playerInfo, uiState, actions } = useGame();

    // UI State Machine
    const ui = useGameUI();

    // Temp Local State (Character Creation)
    const [tempName, setTempName] = useState("Héroe");
    const [hoveredTarget, setHoveredTarget] = useState<Enemy | null>(null);

    // Sync Active NPC with Game State
    useEffect(() => {
        if (gameState && ui.activeNPC && gameState.player) {
            const dist = Math.abs(ui.activeNPC.x - gameState.player.x) + Math.abs(ui.activeNPC.y - gameState.player.y);
            if (dist > 1) ui.closeAll();
        }
    }, [gameState, ui.activeNPC, ui]);

    // Input Handler Integration - Adapter for new useGameUI interface
    const modalsAdapter = {
        inventoryOpen: ui.currentState === 'INVENTORY',
        craftingOpen: ui.currentState === 'CRAFTING',
        skillTreeOpen: ui.currentState === 'SKILLS',
        activeNPC: ui.activeNPC,
        pauseMenuOpen: ui.currentState === 'PAUSE_MENU',
        mapExpanded: ui.currentState === 'MAP_EXPANDED',

        setInventoryOpen: (val: boolean | ((p: boolean) => boolean)) => {
            if (typeof val === 'function') ui.toggleInventory();
            else val ? ui.openInventory() : ui.closeAll();
        },
        setCraftingOpen: (val: boolean | ((p: boolean) => boolean)) => {
            val ? ui.openCrafting() : ui.closeAll();
        },
        setSkillTreeOpen: (val: boolean | ((p: boolean) => boolean)) => {
            if (typeof val === 'function') ui.toggleSkills();
            else val ? ui.openSkills() : ui.closeAll();
        },
        setActiveNPC: (val: any) => {
            if (val) ui.startDialog(val);
            else ui.closeAll();
        },
        setPauseMenuOpen: (val: boolean | ((p: boolean) => boolean)) => {
            if (typeof val === 'function') ui.togglePause();
            else val ? ui.openPauseMenu() : ui.closeAll();
        },
        setMapExpanded: (val: boolean | ((p: boolean) => boolean)) => {
            if (typeof val === 'function') ui.toggleMap();
            else val ? ui.openMap() : ui.closeAll();
        }
    };

    useInputHandler({
        gameStarted,
        gameOver,
        uiState,
        actions,
        gameState,
        modals: modalsAdapter as any // Type assertion until strictly typed
    });

    const { loading: assetsLoading, progress: assetProgress } = useAssetLoader();

    // Mouse Logic (Targeting)
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

        const TILE_SIZE = 96;
        let minDist = Infinity;
        let bestTarget = null;

        gameState.enemies.forEach((enemy: Enemy) => {
            if (!gameState.player) return;
            const relX = enemy.x - gameState.player.x;
            const relY = enemy.y - gameState.player.y;
            const screenPos = toScreen(relX, relY);
            const dist = Math.hypot(screenPos.x - deltaX, screenPos.y - deltaY);

            if (dist < TILE_SIZE * 0.8 && dist < minDist) {
                minDist = dist;
                bestTarget = enemy;
            }
        });
        setHoveredTarget(bestTarget);
    };

    const handleMouseClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!gameState?.player || !gameState.map || ui.isModalOpen) return;

        if (hoveredTarget) {
            const idx = gameState.enemies.findIndex((e: Enemy) => e.id === hoveredTarget.id);
            if (idx !== -1 && gameState.player) {
                const target = gameState.enemies[idx];

                // 1. Skill Execution (Prioritize Selected Skill)
                // Fallback to Basic Attack if skill is on Cooldown
                if (uiState.selectedSkill) {
                    const cooldowns = gameState.player.skills?.cooldowns || {};
                    const isOnCd = (cooldowns[uiState.selectedSkill] || 0) > 0;

                    if (!isOnCd) {
                        // Range/Mana checks are handled inside executeSkillAction -> useSkill
                        actions.executeSkillAction(uiState.selectedSkill, target);
                        return;
                    }
                    // If on CD, continue to Basic Attack below...
                }

                // 2. Basic Attack (Melee)
                const player = gameState.player;
                const dist = Math.max(Math.abs(target.x - player.x), Math.abs(target.y - player.y));

                if (dist <= 1.5) {
                    actions.performAttack(target, idx);
                } else {
                    actions.addMessage("¡Está demasiado lejos!", 'warning');
                }
            }
        }
    };

    // Render Logic
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

    const isInteractable = gameState && !ui.activeNPC && gameState.player && (
        gameState.npcs?.some((n: NPC) => gameState.player && (Math.abs(n.x - gameState.player.x) + Math.abs(n.y - gameState.player.y) <= 1)) ||
        gameState.chests?.some((c: Chest) => gameState.player && (Math.abs(c.x - gameState.player.x) + Math.abs(c.y - gameState.player.y) <= 1 && !c.isOpen)) ||
        // Check for adjacent interactable entities (Resources)
        (() => {
            if (!gameState.entities || !gameState.player) return false;
            const { x, y } = gameState.player;
            const adjacentCoords = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            return adjacentCoords.some(([dx, dy]) => {
                const tx = x + dx;
                const ty = y + dy;
                if (ty >= 0 && ty < gameState.entities.length && tx >= 0 && tx < gameState.entities[0].length) {
                    const id = gameState.entities[ty][tx];
                    return id === ENTITY.TREE || id === ENTITY.ROCK || id === ENTITY.PLANT;
                }
                return false;
            });
        })()
    );

    return (
        <div className="min-h-screen p-2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* 1. Game World (Canvas & Interaction Layer) */}
            <GameWorld
                gameState={gameState}
                hoveredTarget={hoveredTarget}
                onMouseMove={handleMouseMove}
                onClick={handleMouseClick}
                activeNPC={ui.activeNPC}
                isInteractable={!!isInteractable}
            />

            {/* 2. HUD (Stats, Minimap, Logs, Skills) */}
            <GameHUD
                gameState={gameState}
                uiState={uiState}
                actions={actions}
                messages={messages}
                mapExpanded={ui.currentState === 'MAP_EXPANDED'}
                onExpandMap={(expanded) => expanded ? ui.openMap() : ui.closeAll()}
                isInputDisabled={ui.isModalOpen || gameOver}
            />

            {/* 3. Menus & Overlays */}
            <PauseMenu
                isOpen={ui.currentState === 'PAUSE_MENU'}
                onResume={ui.closeAll}
                onOpenInventory={ui.openInventory}
                onOpenSkills={ui.openSkills}
                onOpenQuests={() => { actions.addMessage("Sistema de misiones no implementado aún", 'info'); }}
                onOpenMap={ui.openMap}
                onSave={() => { actions.saveGame(); ui.closeAll(); }}
                onLoad={() => { actions.loadGame(); ui.closeAll(); }}
                onExit={() => { window.location.reload(); }}
            />

            {/* 4. Global Overlays (Inventory, Crafting, GameOver, etc.) */}
            {/* Note: GameOverlays uses 'modals' prop internally. We pass our adapter. */}
            <GameOverlays
                gameState={gameState}
                uiState={uiState}
                actions={actions}
                modals={modalsAdapter as any}
                playerInfo={playerInfo}
                stats={stats}
                gameOver={gameOver}
                onRestart={actions.restart}
            />

            <VirtualCursor isActive={!gameStarted || ui.isModalOpen} />
        </div>
    );
}
