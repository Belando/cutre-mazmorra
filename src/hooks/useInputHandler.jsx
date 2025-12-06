import { useEffect, useRef } from 'react';
import { QUICK_SLOT_HOTKEYS } from "@/components/ui/QuickSlots";
import { getUnlockedSkills } from "@/engine/systems/SkillSystem";

// Tiempo entre acciones (velocidad de movimiento/acción)
const INPUT_COOLDOWN = 160; 

export function useInputHandler({ 
  gameStarted, 
  gameOver, 
  uiState, 
  actions, 
  gameState, 
  modals 
}) {
  const { inventoryOpen, craftingOpen, skillTreeOpen, activeNPC, setInventoryOpen, setCraftingOpen, setSkillTreeOpen, setActiveNPC } = modals;
  
  // Referencia al tiempo de la última acción
  const lastActionTime = useRef(0);
  
  // Referencia para mantener el estado de las teclas pulsadas (Set para evitar duplicados)
  const pressedKeys = useRef(new Set());

  // --- 1. GESTIÓN DE EVENTOS (TECLADO) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignorar input si el juego no corre
      if (!gameStarted || gameOver) return;

      const key = e.key.toLowerCase();
      
      // Añadimos tecla al set (para el bucle de movimiento)
      pressedKeys.current.add(key);

      // -- ACCIONES DE INTERFAZ (Instantáneas, sin cooldown de movimiento) --
      if (key === 'i') { setInventoryOpen(p => !p); return; }
      if (key === 'c') { setCraftingOpen(p => !p); return; }
      if (key === 't') { setSkillTreeOpen(p => !p); return; }
      
      if (e.key === 'Escape') {
        setInventoryOpen(false); setCraftingOpen(false); setSkillTreeOpen(false);
        setActiveNPC(null);
        if (uiState.rangedMode) actions.setRangedMode(false);
        return;
      }

      // Si hay menús, bloqueamos el resto
      if (inventoryOpen || craftingOpen || skillTreeOpen || activeNPC) return;

      // -- ACCIONES DE UN SOLO DISPARO (Interactuar, Skills, Guardar) --
      // Estas se ejecutan al pulsar, pero respetan el cooldown global para no "spamear"
      const now = Date.now();
      if (now - lastActionTime.current < INPUT_COOLDOWN) return;

      let actionTaken = false;

      switch (e.key) {
        case ' ': 
          actions.wait(); actionTaken = true; break;
        case 'Enter': 
          actions.descend(e.shiftKey); actionTaken = true; break;
        case 'g': case 'G': 
          actions.saveGame(); actionTaken = true; break;
        case 'e': case 'E': {
            const result = actions.interact(); 
            if (result?.type === 'npc') {
                setActiveNPC(result.data);
                return; 
            }
            if (result?.type === 'chest') actionTaken = true;
            break;
        }
      }

      // Habilidades (1-6)
      if (e.key >= '1' && e.key <= '6' && !e.code.startsWith('Numpad')) {
        const index = parseInt(e.key) - 1;
        if (gameState?.player?.skills) {
            const unlocked = getUnlockedSkills(gameState.player.level, gameState.player.skills.learned);
            if (unlocked[index]) {
                actions.setSelectedSkill(uiState.selectedSkill === unlocked[index].id ? null : unlocked[index].id);
                // Seleccionar skill no consume turno/cooldown
            }
        }
      }
      
      // Slots Rápidos (Q, R) y fallback E
      if ((QUICK_SLOT_HOTKEYS.includes(key) && key !== 'e') || (key === 'e' && !actionTaken)) { 
        const idx = QUICK_SLOT_HOTKEYS.indexOf(key);
        if (idx !== -1) {
            actions.useQuickSlot(idx);
            actionTaken = true;
        }
      }

      if (actionTaken) lastActionTime.current = now;
    };

    const handleKeyUp = (e) => {
      pressedKeys.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, gameOver, uiState, gameState, modals, actions]);


  // --- 2. BUCLE DE MOVIMIENTO (POLLING LOOP) ---
  // Esto permite diagonales suaves al comprobar el estado combinado de teclas
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const moveInterval = setInterval(() => {
      // Si hay menús abiertos, no mover
      if (inventoryOpen || craftingOpen || skillTreeOpen || activeNPC) return;

      const now = Date.now();
      // Respetar cooldown global
      if (now - lastActionTime.current < INPUT_COOLDOWN) return;

      const keys = pressedKeys.current;
      if (keys.size === 0) return;

      let dx = 0;
      let dy = 0;

      // Calcular vector de movimiento basado en TODAS las teclas pulsadas
      if (keys.has('w') || keys.has('arrowup')) dy -= 1;
      if (keys.has('s') || keys.has('arrowdown')) dy += 1;
      if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
      if (keys.has('d') || keys.has('arrowright')) dx += 1;

      // Soporte Numpad / Teclas Nav (Diagonales directas)
      if (keys.has('home') || keys.has('7')) { dx = -1; dy = -1; }
      if (keys.has('pageup') || keys.has('9')) { dx = 1; dy = -1; }
      if (keys.has('end') || keys.has('1')) { dx = -1; dy = 1; }
      if (keys.has('pagedown') || keys.has('3')) { dx = 1; dy = 1; }

      // Ejecutar movimiento si hay dirección
      if (dx !== 0 || dy !== 0) {
        actions.move(Math.sign(dx), Math.sign(dy));
        lastActionTime.current = now;
      }

    }, 50); // Comprobamos cada 50ms (aprox 20fps de input check)

    return () => clearInterval(moveInterval);
  }, [gameStarted, gameOver, modals, actions, inventoryOpen, craftingOpen, skillTreeOpen, activeNPC]);
}