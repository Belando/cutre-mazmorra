import { useEffect, useRef } from 'react';
// Rutas corregidas
import { QUICK_SLOT_HOTKEYS } from '@/components/game/ui/QuickSlots';
import { getUnlockedSkills } from '@/components/game/systems/SkillSystem';

// Tiempo mínimo entre acciones en milisegundos
// 150ms es un buen equilibrio: se siente ágil pero evita errores por "doble pulsación"
const INPUT_COOLDOWN = 150; 

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
  
  // Usamos useRef para mantener el valor entre renderizados sin provocar re-renders
  const lastActionTime = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Ignorar si el juego no corre o terminó
      if (!gameStarted || gameOver) return;

      const now = Date.now();
      const key = e.key.toLowerCase();

      // --- Gestión de Menús (Sin Cooldown) ---
      // Permitimos abrir/cerrar menús instantáneamente para que la UI se sienta responsiva
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

      // --- COOLDOWN CHECK ---
      // Si ha pasado menos tiempo del permitido desde la última acción, ignoramos
      if (now - lastActionTime.current < INPUT_COOLDOWN) {
        return;
      }

      // Variable para saber si la tecla pulsada cuenta como "acción" (para aplicar cooldown)
      let actionTaken = false;

      // --- Movimiento y Acciones Básicas ---
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': 
          actions.move(0, -1); 
          actionTaken = true; 
          break;
        case 'ArrowDown': case 's': case 'S': 
          actions.move(0, 1); 
          actionTaken = true; 
          break;
        case 'ArrowLeft': case 'a': case 'A': 
          actions.move(-1, 0); 
          actionTaken = true; 
          break;
        case 'ArrowRight': case 'd': case 'D': 
          actions.move(1, 0); 
          actionTaken = true; 
          break;
        case ' ': 
          actions.wait(); 
          actionTaken = true; 
          break; // Esperar turno
        case 'Enter': 
          actions.descend(e.shiftKey); 
          actionTaken = true; 
          break;
        case 'g': case 'G': 
          actions.saveGame(); 
          // Guardar no necesariamente necesita cooldown de movimiento, pero previene spam
          actionTaken = true; 
          break;
        
        // Interactuar (NPCs y Cofres)
        case 'e': case 'E': {
            const result = actions.interact(); 
            if (result?.type === 'npc') {
                setActiveNPC(result.data);
                return; // Abrir diálogo no consume cooldown de movimiento, detenemos aquí
            }
            if (result?.type === 'chest') {
                actionTaken = true; // Abrir cofre sí es una acción física
            }
            break;
        }
      }

      // --- Selección de Habilidades (1-6) ---
      // Seleccionar habilidad no consume turno, pero evitamos spam visual
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
      // Nota: E ya se usa para interactuar arriba.
      // Usar una poción SÍ debería tener cooldown para evitar gastar 2 seguidas por error.
      if (QUICK_SLOT_HOTKEYS.includes(key) && key !== 'e') { 
        // Excluimos 'e' aquí porque ya se maneja en el switch de interacción
        const idx = QUICK_SLOT_HOTKEYS.indexOf(key);
        actions.useQuickSlot(idx);
        actionTaken = true;
      } else if (key === 'e' && !actionTaken) {
         // Fallback para 'E' si no hubo interacción (usar objeto rápido)
         const idx = QUICK_SLOT_HOTKEYS.indexOf('e');
         actions.useQuickSlot(idx);
         actionTaken = true;
      }

      // Si se realizó una acción válida, actualizamos el tiempo
      if (actionTaken) {
        lastActionTime.current = now;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver, uiState, gameState, modals, actions]);
}