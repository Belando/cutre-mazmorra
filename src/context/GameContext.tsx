import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useGameEngine } from '@/hooks/useGameEngine';

// Define return type of the engine
type GameEngineReturn = ReturnType<typeof useGameEngine>;

// Split into State and Dispatch
// actions is the Dispatch part
type GameDispatchContextType = GameEngineReturn['actions'];
// The rest is the State part
type GameStateContextType = Omit<GameEngineReturn, 'actions'>;

const GameStateContext = createContext<GameStateContextType | null>(null);
const GameDispatchContext = createContext<GameDispatchContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
    const gameEngine = useGameEngine();

    const { actions, ...gameState } = gameEngine;

    return (
        <GameDispatchContext.Provider value={actions}>
            <GameStateContext.Provider value={gameState}>
                {children}
            </GameStateContext.Provider>
        </GameDispatchContext.Provider>
    );
}

export function useGameState() {
    const context = useContext(GameStateContext);
    if (!context) {
        throw new Error('useGameState debe usarse dentro de un GameProvider');
    }
    return context;
}

export function useGameDispatch() {
    const context = useContext(GameDispatchContext);
    if (!context) {
        throw new Error('useGameDispatch debe usarse dentro de un GameProvider');
    }
    return context;
}

// Hook de compatibilidad para código existente
export function useGame() {
    const state = useGameState();
    const dispatch = useGameDispatch();

    // Reconstruimos el objeto original para no romper componentes antiguos.
    // Nota: Esto provocará re-renderizados si state O dispatch cambian.
    return useMemo(() => ({
        ...state,
        actions: dispatch
    }), [state, dispatch]);
}
