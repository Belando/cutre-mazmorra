import React from 'react';
import { motion } from 'framer-motion';
import GameBoard from "@/components/game/GameBoard";
import { InteractionPrompt } from "@/components/ui/InteractionPrompt";

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
    activeNPC,
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

                    <InteractionPrompt gameState={gameState} />
                </motion.div>
            </div>
        </div>
    );
}
