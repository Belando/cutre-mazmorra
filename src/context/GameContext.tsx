import React, { createContext, useContext, ReactNode } from 'react';
import { useGameEngine } from '@/hooks/useGameEngine';

const GameContext = createContext<ReturnType<typeof useGameEngine> | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
    const gameEngine = useGameEngine();

    return (
        <GameContext.Provider value={gameEngine}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame debe usarse dentro de un GameProvider');
    }
    return context;
}
