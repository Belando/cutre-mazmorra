
import React from 'react';
import { Button } from '@/components/ui/button';
import { GiLockedChest } from 'react-icons/gi';
import { ENEMY_STATS } from '@/data/enemies';
import { GameState } from '@/types';
import { IoClose } from 'react-icons/io5';

interface GrimoireProps {
    isOpen: boolean;
    onClose: () => void;
    gameState: GameState;
}

export default function Grimoire({ isOpen, onClose, gameState }: GrimoireProps) {
    if (!isOpen) return null;

    const { player } = gameState;
    const bestiary = player?.bestiary || {};

    // Filter out special/generic entities if needed, or iterate all
    const enemies = Object.values(ENEMY_STATS).filter(e => e.id !== 'unknown'); // Basic filtering

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-md">
            <div className="w-[800px] h-[600px] relative flex flex-col">

                {/* HEADER */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
                    <h2 className="text-3xl font-fantasy tracking-widest text-amber-500 uppercase drop-shadow-md">
                        Grimorio de Monstruos
                    </h2>
                    <Button onClick={onClose} variant="ghost" className="text-slate-400 hover:text-white p-2">
                        <IoClose className="w-8 h-8" />
                    </Button>
                </div>

                {/* CONTENT GRID */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {enemies.map((enemy) => {
                        const stats = bestiary[enemy.id];
                        const isDiscovered = stats && stats.kills > 0;

                        return (
                            <div key={enemy.id} className={`p-4 rounded-lg border flex items-center gap-4 transition-all ${isDiscovered ? 'bg-slate-900/80 border-slate-700 hover:border-amber-500/50' : 'bg-slate-950 border-slate-900 grayscale opacity-60'}`}>
                                {/* ICON / PORTRAIT */}
                                <div className={`w-16 h-16 rounded flex items-center justify-center text-3xl shrink-0 ${isDiscovered ? 'bg-slate-800' : 'bg-black'}`} style={{ color: isDiscovered ? enemy.color : '#555' }}>
                                    {isDiscovered ? (enemy.symbol || '?') : '?'}
                                </div>

                                {/* INFO */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h3 className={`font-bold uppercase tracking-wider truncate ${isDiscovered ? 'text-slate-200' : 'text-slate-600'}`}>
                                            {isDiscovered ? enemy.name : 'Desconocido'}
                                        </h3>
                                        {isDiscovered && (
                                            <span className="text-amber-500 text-xs font-mono bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/50">
                                                Lv.{enemy.exp ? Math.floor(enemy.exp / 10) + 1 : 1}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-2 text-xs text-slate-400 font-mono flex items-center gap-4">
                                        <div className="flex items-center gap-1">
                                            <span className="text-slate-600">Muertes:</span>
                                            <span className={isDiscovered ? 'text-emerald-400' : 'text-slate-700'}>
                                                {isDiscovered ? stats.kills : 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
