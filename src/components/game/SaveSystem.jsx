// Save/Load system for the roguelike game

const SAVE_KEY = 'dungeon_crawler_save';

export function saveGame(gameState, stats, activeQuests, completedQuests, questProgress, materials, quickSlots) {
  const saveData = {
    version: 1,
    timestamp: Date.now(),
    gameState: {
      player: gameState.player,
      inventory: gameState.inventory,
      equipment: gameState.equipment,
      level: gameState.level,
      bossDefeated: gameState.bossDefeated,
    },
    stats,
    activeQuests,
    completedQuests,
    questProgress,
    materials,
    quickSlots,
  };
  
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    return { success: true, message: '¡Partida guardada!' };
  } catch (e) {
    console.error('Error saving game:', e);
    return { success: false, message: 'Error al guardar' };
  }
}

export function loadGame() {
  try {
    const data = localStorage.getItem(SAVE_KEY);
    if (!data) return null;
    
    const saveData = JSON.parse(data);
    return saveData;
  } catch (e) {
    console.error('Error loading game:', e);
    return null;
  }
}

export function hasSaveGame() {
  try {
    return !!localStorage.getItem(SAVE_KEY);
  } catch (e) {
    return false;
  }
}

export function deleteSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export function formatSaveDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}