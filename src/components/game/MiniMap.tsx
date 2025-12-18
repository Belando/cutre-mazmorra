import React, { useEffect, useRef, useState } from 'react';
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
}

export default function MiniMap({ gameState, floorHistory = [] }: MiniMapProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [viewingFloor, setViewingFloor] = useState<number | null>(null);
    const expandedCanvasRef = useRef<HTMLCanvasElement>(null);

    const currentFloor = gameState?.level || 1;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !gameState) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { map, player, explored, stairs, stairsUp } = gameState;
        const scale = 3;

        canvas.width = map[0].length * scale;
        canvas.height = map.length * scale;

        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[0].length; x++) {
                if (explored[y]?.[x]) {
                    const tile = map[y][x];

                    if (tile === TILE.WALL) {
                        ctx.fillStyle = '#1a1a2e';
                    } else if (tile === TILE.DOOR) {
                        ctx.fillStyle = '#d97706';
                    } else if (tile === TILE.DOOR_OPEN) {
                        ctx.fillStyle = '#4b5563';
                    } else {
                        ctx.fillStyle = '#2a2a4e';
                    }

                    ctx.fillRect(x * scale, y * scale, scale, scale);
                }
            }
        }

        if (stairs && explored[stairs.y]?.[stairs.x]) {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(stairs.x * scale, stairs.y * scale, scale, scale);
        }

        if (stairsUp && explored[stairsUp.y]?.[stairsUp.x]) {
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(stairsUp.x * scale, stairsUp.y * scale, scale, scale);
        }

        if (gameState.npcs) {
            gameState.npcs.forEach(npc => {
                if (explored[npc.y]?.[npc.x]) {
                    ctx.fillStyle = '#fbbf24';
                    ctx.fillRect(npc.x * scale, npc.y * scale, scale, scale);
                }
            });
        }

        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(player.x * scale - 1, player.y * scale - 1, scale + 2, scale + 2);

    }, [gameState]);

    useEffect(() => {
        if (!expanded || !expandedCanvasRef.current) return;

        const canvas = expandedCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const floorData = viewingFloor !== null ? floorHistory[viewingFloor - 1] : gameState;
        if (!floorData) return;

        const { map, explored, stairs, player } = floorData;
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

        if (viewingFloor === null || viewingFloor === currentFloor) {
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
                className="p-2 transition-colors border cursor-pointer bg-slate-900/80 backdrop-blur-sm rounded-xl border-slate-700/50 hover:border-slate-600/50"
                onClick={() => { setExpanded(true); setViewingFloor(null); }}
            >
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                        <GiTreasureMap className="w-4 h-4 text-amber-500" />
                        <span className="text-[10px] text-slate-400 font-bold">Piso {currentFloor}</span>
                    </div>
                    <span className="text-[8px] text-slate-600">Click: Mapa</span>
                </div>
                <canvas ref={canvasRef} className="w-full border rounded border-slate-700/50 bg-black" style={{ imageRendering: 'pixelated' }} />
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
                        onClick={() => setExpanded(false)}
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
                                <Button variant="ghost" size="icon" onClick={() => setExpanded(false)} className="text-slate-400 hover:text-white">
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
