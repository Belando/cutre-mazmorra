import { useEffect, useRef, useCallback } from 'react';
import { GameActionsContext } from './useGameActions';

export interface AutoTurnModals {
    inventoryOpen: boolean;
    craftingOpen: boolean;
    activeNPC: any;
    skillTreeOpen: boolean;
}

export interface UseAutoTurnResult {
    resetTimer: () => void;
}

export function useAutoTurn(
    actions: GameActionsContext,
    gameStarted: boolean,
    gameOver: boolean,
    modals: AutoTurnModals,
    turnDuration: number,
    onAutoTurn?: () => void
): UseAutoTurnResult {
    // 1. Guardamos todo lo que el juego necesita en una referencia mutable.
    const dependencies = useRef({ actions, modals, gameStarted, gameOver, onAutoTurn });

    useEffect(() => {
        dependencies.current = { actions, modals, gameStarted, gameOver, onAutoTurn };
    }, [actions, modals, gameStarted, gameOver, onAutoTurn]);

    const timerId = useRef<NodeJS.Timeout | null>(null);

    // Función interna para limpiar el reloj
    const stopTimer = () => {
        if (timerId.current) clearInterval(timerId.current);
        timerId.current = null;
    };

    // Función para iniciar el reloj
    const startTimer = useCallback(() => {
        stopTimer();

        // Iniciamos el intervalo
        timerId.current = setInterval(() => {
            // LEEMOS DESDE LA REFERENCIA
            const { actions, modals, gameStarted, gameOver, onAutoTurn } = dependencies.current;

            // Validaciones de pausa
            if (!gameStarted || gameOver) return;
            if (modals.inventoryOpen || modals.craftingOpen || modals.activeNPC || modals.skillTreeOpen) return;

            // EJECUTAMOS EL TURNO
            if (actions && actions.executeTurn) {
                actions.executeTurn(); // Mueve enemigos
                if (onAutoTurn) onAutoTurn(); // Reinicia la barra visual
            }
        }, turnDuration);
    }, [turnDuration]);

    // Efecto principal: Arranca o para el reloj según el estado del juego
    useEffect(() => {
        if (gameStarted && !gameOver) {
            startTimer();
        } else {
            stopTimer();
        }
        return stopTimer; // Limpieza al desmontar
    }, [gameStarted, gameOver, startTimer]);

    // Exponemos esta función para que el input del jugador pueda reiniciar la cuenta atrás
    const resetTimer = useCallback(() => {
        startTimer();
    }, [startTimer]);

    return { resetTimer };
}
