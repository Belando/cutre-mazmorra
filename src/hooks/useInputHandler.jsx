import { useEffect, useRef } from 'react';
import { QUICK_SLOT_HOTKEYS } from "@/components/ui/QuickSlots";
import { getUnlockedSkills } from "@/engine/systems/SkillSystem";
import { SKILLS } from '@/data/skills'; 

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
  
  const lastActionTime = useRef(0);
  const pressedKeys = useRef(new Set());

  // --- 1. GESTIÓN DE EVENTOS (TECLADO) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStarted || gameOver) return;

      const key = e.key.toLowerCase();
      pressedKeys.current.add(key);

      // -- ACCIONES DE INTERFAZ --
      if (key === 'i') { setInventoryOpen(p => !p); return; }
      // ELIMINADO: if (key === 'c') { setCraftingOpen(p => !p); return; }
      if (key === 't') { setSkillTreeOpen(p => !p); return; }
      
      if (e.key === 'Escape') {
        setInventoryOpen(false); setCraftingOpen(false); setSkillTreeOpen(false);
        setActiveNPC(null);
        if (uiState.rangedMode) actions.setRangedMode(false);
        return;
      }

      if (inventoryOpen || craftingOpen || skillTreeOpen || activeNPC) return;

      // ... resto del código igual ...
      const now = Date.now();
      if (now - lastActionTime.current < INPUT_COOLDOWN) return;

      let actionTaken = false;

      switch (e.key) {
        case ' ': 
          if (uiState.selectedSkill) {
             const skill = SKILLS[uiState.selectedSkill];
             if (skill && skill.type !== 'melee') {
                 actions.executeSkillAction(uiState.selectedSkill);
                 actionTaken = true;
             }
          }
          break;
          
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

      if (e.key >= '1' && e.key <= '6' && !e.code.startsWith('Numpad')) {
        const index = parseInt(e.key) - 1;
        if (gameState?.player?.skills) {
            const unlocked = getUnlockedSkills(gameState.player.level, gameState.player.skills.learned);
            if (unlocked[index]) {
                actions.setSelectedSkill(uiState.selectedSkill === unlocked[index].id ? null : unlocked[index].id);
            }
        }
      }
      
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

  // --- 2. BUCLE DE MOVIMIENTO (Sin cambios) ---
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const moveInterval = setInterval(() => {
      if (inventoryOpen || craftingOpen || skillTreeOpen || activeNPC) return;

      const now = Date.now();
      if (now - lastActionTime.current < INPUT_COOLDOWN) return;

      const keys = pressedKeys.current;
      if (keys.size === 0) return;

      let dx = 0;
      let dy = 0;

      if (keys.has('w') || keys.has('arrowup')) dy -= 1;
      if (keys.has('s') || keys.has('arrowdown')) dy += 1;
      if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
      if (keys.has('d') || keys.has('arrowright')) dx += 1;

      if (keys.has('home')) { dx = -1; dy = -1; }
      if (keys.has('pageup')) { dx = 1; dy = -1; }
      if (keys.has('end')) { dx = -1; dy = 1; }
      if (keys.has('pagedown')) { dx = 1; dy = 1; }

      if (dx !== 0 || dy !== 0) {
        actions.move(Math.sign(dx), Math.sign(dy));
        lastActionTime.current = now;
      }

    }, 50);

    return () => clearInterval(moveInterval);
  }, [gameStarted, gameOver, modals, actions, inventoryOpen, craftingOpen, skillTreeOpen, activeNPC]);
}