import { useEffect, useRef, useState } from 'react';
import { TILE } from '@/data/constants';
import {
    GiTreasureMap,
    GiMeeple,
    GiChest,
    GiStairs,
    GiDoor,
    GiConversation,
    GiDeathSkull
} from 'react-icons/gi';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { GameState } from '@/types';

interface MiniMapProps {
    gameState: GameState;
    floorHistory?: GameState[];
    expanded: boolean;
    onExpandChange: (expanded: boolean) => void;
}

export default function MiniMap({ gameState, floorHistory = [], expanded, onExpandChange }: MiniMapProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [viewingFloor, setViewingFloor] = useState<number | null>(null);
    const expandedCanvasRef = useRef<HTMLCanvasElement>(null);

    const currentFloor = gameState?.level || 1;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !gameState) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { map, player, explored, stairs, stairsUp, npcs } = gameState;
        if (!map || !map.length || !map[0] || !player) return;

        // RADAR CONFIG
        const scale = 10; // Zoom level (increased slightly)
        const radarSize = 160; // Canvas size (increased)
        const radius = 9; // Tiles radius to draw

        canvas.width = radarSize;
        canvas.height = radarSize;

        // Clear and Background
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, radarSize, radarSize);

        // Save context for transform
        ctx.save();

        // Center the view on the canvas
        ctx.translate(radarSize / 2, radarSize / 2);

        // Offset by player position (inverted) to correct world space
        ctx.translate(-player.x * scale - scale / 2, -player.y * scale - scale / 2);

        // Draw Map Tiles in Range
        const startX = Math.max(0, player.x - radius - 2);
        const endX = Math.min(map[0].length, player.x + radius + 2);
        const startY = Math.max(0, player.y - radius - 2);
        const endY = Math.min(map.length, player.y + radius + 2);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (explored[y]?.[x]) {
                    const tile = map[y][x];

                    if (tile === TILE.WALL) {
                        ctx.fillStyle = '#2a2a4e';
                    } else if (tile === TILE.DOOR) {
                        ctx.fillStyle = '#d97706';
                    } else if (tile === TILE.DOOR_OPEN) {
                        ctx.fillStyle = '#4b5563';
                    } else {
                        ctx.fillStyle = '#1a1a2e'; // Floor
                    }
                    ctx.fillRect(x * scale, y * scale, scale, scale);
                } else {
                    // Unexplored but in range (optional: fog?)
                }
            }
        }

        // Helper to draw marker
        const drawMarker = (x: number, y: number, color: string, size: number = scale) => {
            if (explored[y]?.[x]) {
                ctx.fillStyle = color;
                // Draw circle marker
                ctx.beginPath();
                ctx.arc(x * scale + scale / 2, y * scale + scale / 2, size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        // Draw Stairs
        if (stairs) drawMarker(stairs.x, stairs.y, '#ef4444', scale * 1.2); // Down (Red)
        if (stairsUp) drawMarker(stairsUp.x, stairsUp.y, '#22c55e', scale * 1.2); // Up (Green)

        // Draw Chests (if available in gameState, assuming implied via map or separate list)
        // Checks removed due to lint error (TILE.CHEST undefined). 
        // Ideally should iterate over gameState.items or similar if chests are items.

        // Draw NPCs
        if (npcs) {
            npcs.forEach(npc => {
                // Only if explored? Or maybe radar detects movement? 
                // Usually only if explored or visible. Let's stick to explored logic for now.
                if (explored[npc.y]?.[npc.x]) {
                    const isHostile = npc.type !== 'merchant' && npc.type !== 'quest_giver';
                    drawMarker(npc.x, npc.y, isHostile ? '#dc2626' : '#fbbf24', scale);
                }
            });
        }

        // Restore context
        ctx.restore();

        // Draw Player (Center)
        // Since we translated everything relative to player, player is at (0,0) of the translated space
        // which corresponds to center of canvas.
        // Let's draw it explicitly in screen space to be sure it's on top.
        ctx.fillStyle = '#3b82f6';
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(radarSize / 2, radarSize / 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Player directional arrow (optional, if we had direction)

    }, [gameState]); // Removed other dependencies for cleaner re-render logic

    // Keep expanded logic below...
    useEffect(() => {
        if (!expanded || !expandedCanvasRef.current) return;

        const canvas = expandedCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const floorData = viewingFloor !== null ? floorHistory[viewingFloor - 1] : gameState;
        if (!floorData) return;

        const { map, explored, stairs, player } = floorData;
        if (!map || !map.length || !map[0]) return;

        const scale = 6;

        canvas.width = map[0].length * scale;
        canvas.height = map.length * scale;

        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[0].length; x++) {
                if (explored[y]?.[x]) {
                    const tile = map[y][x];
                    ctx.fillStyle = tile === TILE.WALL ? '#1e293b' : '#334155';
                    ctx.fillRect(x * scale, y * scale, scale, scale);

                    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
                    ctx.strokeRect(x * scale, y * scale, scale, scale);
                }
            }
        }

        if (stairs && explored[stairs.y]?.[stairs.x]) {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(stairs.x * scale, stairs.y * scale, scale, scale);
        }

        if ((viewingFloor === null || viewingFloor === currentFloor) && floorData.npcs) {
            floorData.npcs.forEach(npc => {
                if (explored[npc.y]?.[npc.x]) {
                    ctx.fillStyle = '#fbbf24';
                    ctx.fillRect(npc.x * scale, npc.y * scale, scale, scale);
                }
            });
        }

        if ((viewingFloor === null || viewingFloor === currentFloor) && player) {
            ctx.fillStyle = '#3b82f6';
            ctx.shadowColor = '#3b82f6';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(player.x * scale + scale / 2, player.y * scale + scale / 2, scale / 2 + 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

    }, [expanded, viewingFloor, gameState, floorHistory, currentFloor]);

    return (
        <>
            <div
                className="relative cursor-pointer transition-transform hover:scale-105 active:scale-95 group"
                onClick={() => { onExpandChange(true); setViewingFloor(null); }}
            >
                {/* COMPASS FRAME */}
                <div className="w-40 h-40 rounded-full border-4 border-[#2a2a3e] bg-[#0a0a0f] shadow-[0_0_25px_rgba(0,0,0,0.8)] overflow-hidden relative">
                    <canvas ref={canvasRef} className="w-full h-full opacity-90" style={{ imageRendering: 'pixelated' }} />

                    {/* Compass Overlay/Gloss */}
                    <div className="absolute inset-0 rounded-full border border-white/10 shadow-[inset_0_0_30px_rgba(0,0,0,0.9)] pointer-events-none"></div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-amber-500/50 z-10"></div>
                </div>

                {/* Floor Indicator Badge */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#1a1a2e] border border-[#3a3a5e] px-2 py-0.5 rounded-full shadow-lg z-20">
                    <div className="flex items-center gap-1">
                        <GiTreasureMap className="w-3 h-3 text-amber-500" />
                        <span className="text-[10px] font-bold text-slate-300 font-mono">Piso {currentFloor}</span>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
                        onClick={() => onExpandChange(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-slate-900 rounded-2xl border border-slate-700 p-4 max-w-2xl w-full max-h-[85vh] flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-900/20 rounded-lg">
                                        <GiTreasureMap className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white leading-none">Mapa de la Mazmorra</h2>
                                        <p className="text-xs text-slate-500 mt-1">Piso {viewingFloor || currentFloor}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => onExpandChange(false)} className="text-slate-400 hover:text-white">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            {currentFloor > 1 && (
                                <div className="flex items-center justify-center gap-2 mb-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={(viewingFloor || currentFloor) <= 1}
                                        onClick={() => setViewingFloor(prev => Math.max(1, (prev || currentFloor) - 1))}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <span className="text-sm font-mono text-slate-400 px-2">Piso {viewingFloor || currentFloor}</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={(viewingFloor || currentFloor) >= currentFloor}
                                        onClick={() => setViewingFloor(prev => Math.min(currentFloor, (prev || currentFloor) + 1))}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}

                            <div className="flex-1 flex justify-center overflow-auto bg-black/50 rounded-lg border border-slate-800 p-4 min-h-0">
                                <canvas
                                    ref={expandedCanvasRef}
                                    className="shadow-2xl"
                                    style={{ imageRendering: 'pixelated', maxWidth: '100%', objectFit: 'contain' }}
                                />
                            </div>

                            <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800">
                                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 p-2 rounded">
                                    <GiMeeple className="w-4 h-4 text-blue-500" /> <span>Tú</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 p-2 rounded">
                                    <GiStairs className="w-4 h-4 text-red-500" /> <span>Salida</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 p-2 rounded">
                                    <GiConversation className="w-4 h-4 text-yellow-500" /> <span>NPC</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 p-2 rounded">
                                    <GiChest className="w-4 h-4 text-purple-400" /> <span>Cofre</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 p-2 rounded">
                                    <GiDoor className="w-4 h-4 text-amber-700" /> <span>Puerta</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 p-2 rounded">
                                    <GiDeathSkull className="w-4 h-4 text-gray-500" /> <span>Peligro</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
