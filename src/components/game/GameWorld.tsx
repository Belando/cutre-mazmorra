import React from 'react';
import { motion } from 'framer-motion';
import GameBoard from "@/components/game/GameBoard";

interface GameWorldProps {
    gameState: any;
    hoveredTarget: any;
    onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
    onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
    activeNPC: any;
    isInteractable?: boolean;
}

export default function GameWorld({
    gameState,
    hoveredTarget,
    onMouseMove,
    onClick,
    isInteractable
}: GameWorldProps) {

    return (
        <div
            className="relative w-screen h-screen overflow-hidden bg-black"
            onClick={onClick}
            onMouseMove={onMouseMove}
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
        </div>
    );
}
