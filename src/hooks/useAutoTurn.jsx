import { useEffect, useRef, useCallback } from 'react';

export function useAutoTurn(actions, gameStarted, gameOver, modals, turnDuration, onAutoTurn) {
  // 1. Guardamos todo lo que el juego necesita en una referencia mutable.
  // Esto permite que el intervalo lea siempre la versión "fresca" de las acciones y el estado
  // sin necesidad de reiniciarse constantemente.
  const dependencies = useRef({ actions, modals, gameStarted, gameOver, onAutoTurn });

  useEffect(() => {
    dependencies.current = { actions, modals, gameStarted, gameOver, onAutoTurn };
  }, [actions, modals, gameStarted, gameOver, onAutoTurn]);

  const timerId = useRef(null);

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
      // LEEMOS DESDE LA REFERENCIA (El truco mágico para evitar bugs)
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