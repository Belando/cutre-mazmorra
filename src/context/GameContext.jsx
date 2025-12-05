import React, { createContext, useContext } from 'react';
import { useGameEngine } from '@/hooks/useGameEngine';

// Creamos el contexto
const GameContext = createContext(null);

// Proveedor del contexto (lo pondremos en App.jsx)
export function GameProvider({ children }) {
  // Aquí instanciamos el motor del juego UNA sola vez
  const gameEngine = useGameEngine();

  return (
    <GameContext.Provider value={gameEngine}>
      {children}
    </GameContext.Provider>
  );
}

// Hook personalizado para que los componentes accedan a los datos
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame debe usarse dentro de un GameProvider');
  }
  return context;
}