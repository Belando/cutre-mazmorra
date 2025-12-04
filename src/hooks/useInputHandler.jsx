import { useEffect } from 'react';
import { QUICK_SLOT_HOTKEYS } from '@/components/game/QuickSlots';
import { getUnlockedSkills } from '@/components/game/SkillSystem';

// Hook personalizado para manejar la entrada del teclado
export function useInputHandler({ 
  gameStarted, 
  gameOver, 
  uiState, 
  actions, 
  gameState, 
  modals 
}) {
  const { inventoryOpen, craftingOpen, skillTreeOpen, activeNPC, setInventoryOpen, setCraftingOpen, setSkillTreeOpen, setActiveNPC } = modals;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStarted || gameOver) return;

      const key = e.key.toLowerCase();

      // --- Gestión de Menús ---
      if (key === 'i') { setInventoryOpen(p => !p); return; }
      if (key === 'c') { setCraftingOpen(p => !p); return; }
      if (key === 't') { setSkillTreeOpen(p => !p); return; }
      
      // Cerrar todo con Escape
      if (e.key === 'Escape') {
        setInventoryOpen(false); 
        setCraftingOpen(false); 
        setSkillTreeOpen(false);
        setActiveNPC(null);
        if (uiState.rangedMode) actions.setRangedMode(false);
        return;
      }

      // Si hay menús abiertos, bloquear movimiento
      if (inventoryOpen || craftingOpen || skillTreeOpen || activeNPC) return;

      // --- Movimiento y Acciones Básicas ---
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': actions.move(0, -1); break;
        case 'ArrowDown': case 's': case 'S': actions.move(0, 1); break;
        case 'ArrowLeft': case 'a': case 'A': actions.move(-1, 0); break;
        case 'ArrowRight': case 'd': case 'D': actions.move(1, 0); break;
        case ' ': actions.wait(); break;
        case 'Enter': actions.descend(e.shiftKey); break;
        case 'g': case 'G': actions.saveGame(); break;
        
        // Interactuar (NPCs y Cofres)
        case 'e': case 'E': {
            const result = actions.interact(); 
            if (result?.type === 'npc') {
                setActiveNPC(result.data);
                return; // Detener propagación para no usar slot rápido
            }
            if (result?.type === 'chest') return;
            break;
        }
      }

      // --- Selección de Habilidades (1-6) ---
      if (e.key >= '1' && e.key <= '6') {
        const index = parseInt(e.key) - 1;
        if (gameState?.player?.skills) {
            const unlocked = getUnlockedSkills(gameState.player.level, gameState.player.skills.learned);
            if (unlocked[index]) {
                const skillId = unlocked[index].id;
                actions.setSelectedSkill(uiState.selectedSkill === skillId ? null : skillId);
            }
        }
      }
      
      // --- Slots Rápidos (Q, R) ---
      // Nota: E ya se usa para interactuar, así que solo chequeamos si NO se interactuó
      if (QUICK_SLOT_HOTKEYS.includes(key)) {
        const idx = QUICK_SLOT_HOTKEYS.indexOf(key);
        actions.useQuickSlot(idx);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver, uiState, gameState, modals, actions]);
}