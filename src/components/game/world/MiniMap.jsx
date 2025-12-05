import React, { useEffect, useRef, useState } from 'react';
import { TILE } from '../systems/DungeonGenerator'; // <-- CORREGIDO: ../systems/
import { Map, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function MiniMap({ gameState, floorHistory = [] }) {
  const canvasRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [viewingFloor, setViewingFloor] = useState(null);
  const expandedCanvasRef = useRef(null);
  
  const currentFloor = gameState?.level || 1;
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;
    
    const ctx = canvas.getContext('2d');
    const { map, player, explored, stairs } = gameState;
    const scale = 3;
    
    canvas.width = map[0].length * scale;
    canvas.height = map.length * scale;
    
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[0].length; x++) {
        if (explored[y]?.[x]) {
          const tile = map[y][x];
          ctx.fillStyle = tile === TILE.WALL ? '#1a1a2e' : '#2a2a4e';
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
    
    // Stairs
    if (explored[stairs.y]?.[stairs.x]) {
      ctx.fillStyle = '#e94560';
      ctx.fillRect(stairs.x * scale, stairs.y * scale, scale, scale);
    }
    
    // NPCs
    if (gameState.npcs) {
      gameState.npcs.forEach(npc => {
        if (explored[npc.y]?.[npc.x]) {
          ctx.fillStyle = '#fbbf24'; // Gold for NPCs
          ctx.fillRect(npc.x * scale, npc.y * scale, scale, scale);
        }
      });
    }
    
    // Player
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(player.x * scale - 1, player.y * scale - 1, scale + 2, scale + 2);
    
  }, [gameState]);
  
  // Draw expanded map
  useEffect(() => {
    if (!expanded || !expandedCanvasRef.current) return;
    
    const canvas = expandedCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Use current floor or viewed floor from history
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
          
          // Add subtle grid
          ctx.strokeStyle = 'rgba(255,255,255,0.05)';
          ctx.strokeRect(x * scale, y * scale, scale, scale);
        }
      }
    }
    
    // Stairs
    if (explored[stairs.y]?.[stairs.x]) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(stairs.x * scale, stairs.y * scale, scale, scale);
    }
    
    // NPCs (only on current floor view)
    if ((viewingFloor === null || viewingFloor === currentFloor) && floorData.npcs) {
      floorData.npcs.forEach(npc => {
        if (explored[npc.y]?.[npc.x]) {
          ctx.fillStyle = '#fbbf24'; // Gold for NPCs
          ctx.fillRect(npc.x * scale, npc.y * scale, scale, scale);
        }
      });
    }
    
    // Player (only on current floor)
    if (viewingFloor === null || viewingFloor === currentFloor) {
      ctx.fillStyle = '#3b82f6';
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(player.x * scale + scale/2, player.y * scale + scale/2, scale/2 + 2, 0, Math.PI * 2);
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
            <Map className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] text-slate-500">Piso {currentFloor}</span>
          </div>
          <span className="text-[8px] text-slate-600">Click: expandir</span>
        </div>
        <canvas ref={canvasRef} className="w-full border rounded border-slate-700/50" style={{ imageRendering: 'pixelated' }} />
      </div>
      
      {/* Expanded Map Modal */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 rounded-2xl border border-slate-700 p-4 max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Map className="w-5 h-5 text-slate-400" />
                  <h2 className="text-lg font-bold text-white">
                    Mapa - Piso {viewingFloor || currentFloor}
                  </h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setExpanded(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Floor navigation */}
              {currentFloor > 1 && (
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(viewingFloor || currentFloor) <= 1}
                    onClick={() => setViewingFloor(prev => Math.max(1, (prev || currentFloor) - 1))}
                    className="text-xs h-7"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex gap-1">
                    {Array.from({ length: currentFloor }, (_, i) => i + 1).map(floor => (
                      <button
                        key={floor}
                        onClick={() => setViewingFloor(floor === currentFloor ? null : floor)}
                        className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
                          (viewingFloor || currentFloor) === floor
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {floor}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(viewingFloor || currentFloor) >= currentFloor}
                    onClick={() => setViewingFloor(prev => Math.min(currentFloor, (prev || currentFloor) + 1))}
                    className="text-xs h-7"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              <div className="flex justify-center overflow-auto max-h-[60vh]">
                <canvas 
                  ref={expandedCanvasRef} 
                  className="border rounded border-slate-700" 
                  style={{ imageRendering: 'pixelated', maxWidth: '100%', height: 'auto' }} 
                />
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-slate-400">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span>Jugador</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500" />
                  <span>Escaleras</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500" />
                  <span>NPCs</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-slate-600" />
                  <span>Explorado</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}