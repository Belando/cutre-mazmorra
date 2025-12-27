import { useEffect, useRef, useCallback } from 'react';
import { QUICK_SLOT_HOTKEYS } from "@/components/ui/QuickSlots";
import { getUnlockedSkills } from "@/engine/systems/SkillSystem";
import { SKILLS, Skill } from '@/data/skills';
import { GameActions } from './useGameActions';
import { GameState, Entity, NPC } from '@/types';
import { useKeyboardControls } from './useKeyboardControls';
import { useGamepadControls } from './useGamepadControls';

const INPUT_COOLDOWN = 160;

export interface InputHandlerModals {
    inventoryOpen: boolean;
    craftingOpen: boolean;
    skillTreeOpen: boolean;
    activeNPC: NPC | null;
    mainMenuOpen: boolean;
    setInventoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setCraftingOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setSkillTreeOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setActiveNPC: React.Dispatch<React.SetStateAction<NPC | null>>;
    setMainMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface InputHandlerParams {
    gameStarted: boolean;
    gameOver: boolean;
    uiState: {
        selectedSkill: string | null;
        rangedMode: boolean;
        rangedTargets: Entity[];
    };
    actions: GameActions;
    gameState: GameState;
    modals: InputHandlerModals;
    onAction?: () => void;
    cameraAngleRef?: React.RefObject<number>;
}

export function useInputHandler({
    gameStarted,
    gameOver,
    uiState,
    actions,
    gameState,
    modals,
    onAction,
    cameraAngleRef
}: InputHandlerParams) {
    const { inventoryOpen, craftingOpen, skillTreeOpen, activeNPC, mainMenuOpen, setInventoryOpen, setCraftingOpen, setSkillTreeOpen, setActiveNPC, setMainMenuOpen } = modals;

    const lastActionTime = useRef(0);

    // --- KEYBOARD HANDLER (Event Driven for specific actions) ---
    const handleKeyDown = useCallback((e: KeyboardEvent) => {

        if (!gameStarted || gameOver) return;


        const key = e.key.toLowerCase();

        if (e.key === 'Escape') {
            if (activeNPC) setActiveNPC(null);
            else if (skillTreeOpen) setSkillTreeOpen(false);
            else if (craftingOpen) setCraftingOpen(false);
            else if (inventoryOpen) setInventoryOpen(false);
            else if (mainMenuOpen) setMainMenuOpen(false); // Close menu if open
            else if (uiState.rangedMode) actions.setRangedMode(false);
            else setMainMenuOpen(true); // Open menu if nothing else is open
            return;
        }

        const anyModalOpen = inventoryOpen || craftingOpen || skillTreeOpen || activeNPC || mainMenuOpen;

        if (key === 'i') {
            if (!anyModalOpen || inventoryOpen) setInventoryOpen(p => !p);
            return;
        }
        if (key === 't') {
            if (!anyModalOpen || skillTreeOpen) setSkillTreeOpen(p => !p);
            return;
        }

        if (anyModalOpen) return;

        const now = Date.now();
        if (now - lastActionTime.current < INPUT_COOLDOWN) return;

        let actionTaken = false;

        switch (e.key) {
            case ' ':
                if (uiState.selectedSkill) {
                    const skill = SKILLS[uiState.selectedSkill];
                    if (skill && skill.type !== 'melee') {
                        const success = actions.executeSkillAction(uiState.selectedSkill);
                        if (success) actionTaken = true;
                    }
                }
                break;

            case 'Enter':
                actions.descend(e.shiftKey);
                actionTaken = true;
                break;
            case 'g': case 'G':
                actions.saveGame();
                actionTaken = true;
                break;
            case 'e': case 'E': {
                const result = actions.interact();
                if (result?.type === 'npc') {
                    setActiveNPC(result.data as NPC);
                    return;
                }
                if (result?.type === 'chest') actionTaken = true;
                break;
            }
        }

        if (e.key >= '1' && e.key <= '6' && !e.code.startsWith('Numpad')) {
            const index = parseInt(e.key) - 1;
            if (gameState?.player?.skills && gameState?.player?.level !== undefined) {
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

        if (actionTaken) {
            lastActionTime.current = now;
            if (onAction) onAction();
        }

    }, [gameStarted, gameOver, uiState, actions, gameState, modals, onAction]);

    // --- MOUSE CLICK ATTACK ---
    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            if (!gameStarted || gameOver || !uiState.selectedSkill) return;
            const anyModalOpen = modals.inventoryOpen || modals.craftingOpen || modals.skillTreeOpen || modals.activeNPC || modals.mainMenuOpen;
            if (anyModalOpen) return;

            // Left Click (0)
            if (e.button === 0) {
                const target = e.target as HTMLElement;
                // Ignore clicks on interactive elements
                if (target.closest('button, a, input, textarea, select, [role="button"]')) return;

                const skill = SKILLS[uiState.selectedSkill];
                if (skill) {
                    const success = actions.executeSkillAction(uiState.selectedSkill);
                    if (success && onAction) onAction();
                }
            }
        };

        window.addEventListener('mousedown', handleMouseDown);
        return () => window.removeEventListener('mousedown', handleMouseDown);
    }, [gameStarted, gameOver, uiState.selectedSkill, modals, actions, onAction]);

    const { pressedKeys: keyboardKeys } = useKeyboardControls(handleKeyDown);
    const { pollGamepad, isPressing, getMovement } = useGamepadControls();

    // --- GAME LOOP (Movement & Gamepad Polling) ---
    useEffect(() => {
        if (!gameStarted || gameOver) return;

        let animationFrameId: number;

        const gameLoop = () => {
            const now = Date.now();

            // 1. Poll Gamepad State
            const padState = pollGamepad();
            const anyModalOpen = modals.inventoryOpen || modals.craftingOpen || modals.skillTreeOpen || modals.activeNPC || modals.mainMenuOpen;

            if (anyModalOpen) {
                // ... (Modal interaction logic remains)
                // Handle Menu Navigation with Gamepad here if desired
                if (padState) {
                    if (isPressing('buttonB') || isPressing('start')) {
                        if (activeNPC) setActiveNPC(null);
                        else if (skillTreeOpen) setSkillTreeOpen(false);

                        else if (inventoryOpen) setInventoryOpen(false);
                        else if (mainMenuOpen) setMainMenuOpen(false);
                        else setMainMenuOpen(true); // Start button toggles menu
                    }
                }
                animationFrameId = requestAnimationFrame(gameLoop);
                return;
            }

            // --- CONTINUOUS INPUT POLLING (Fluid Movement) ---
            let dx = 0;
            let dy = 0;

            // Keyboard
            const keys = keyboardKeys.current;
            if (keys.size > 0) {
                if (keys.has('w') || keys.has('arrowup')) dy -= 1;
                if (keys.has('s') || keys.has('arrowdown')) dy += 1;
                if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
                if (keys.has('d') || keys.has('arrowright')) dx += 1;
            }

            // Gamepad
            if (padState) {
                const padMove = getMovement();
                if (padMove.dx !== 0 || padMove.dy !== 0) {
                    dx = padMove.dx; // Usually float -1 to 1
                    dy = padMove.dy;
                }
            }

            // Normalize vector if needed (gamepad does this often, keyboard needs it)
            if (dx !== 0 || dy !== 0) {
                // If using keyboard (binary 0/1), normalize diagonals
                if (Math.abs(dx) === 1 && Math.abs(dy) === 1) {
                    const len = Math.sqrt(dx * dx + dy * dy);
                    dx /= len;
                    dy /= len;
                }

                // Rotate movement vector based on Camera Angle
                if (cameraAngleRef && cameraAngleRef.current !== undefined) {
                    const angle = -cameraAngleRef.current;
                    const sin = Math.sin(angle);
                    const cos = Math.cos(angle);

                    // Rotate: x' = x cos - y sin, y' = x sin + y cos
                    // Note: Our "y" is actually Z in 3D. 
                    // Input: dx is Left/Right, dy is Forward/Back (Up/Down keys).
                    // Forward (-dy) means moving into the screen (-Z).

                    // Let's standardise:
                    // dx = 1 (Right)
                    // dy = 1 (Down/Back)

                    const rotatedDx = dx * cos - dy * sin;
                    const rotatedDy = dx * sin + dy * cos;

                    dx = rotatedDx;
                    dy = rotatedDy;
                }

                // Call fluid move action every frame
                // We pass delta time approx (1/60) or measure it properly
                // For now, let's assume the action handler manages dt or we pass a simple "input vector"
                if (actions.moveFluid) {
                    actions.moveFluid(dx, dy);
                }
            } else {
                if (actions.moveFluid) {
                    actions.moveFluid(0, 0); // Stop
                }
            }

            // --- DISCRETE ACTIONS (Buttons) ---
            if (now - lastActionTime.current >= INPUT_COOLDOWN) {
                let actionTaken = false;

                // --- GAMEPAD BUTTON ACTIONS (Simulating keyboard shortcuts) ---
                if (padState) {
                    // A -> Interact (E) or Descend (Enter)
                    // Priority: Stairs > Interact
                    if (isPressing('buttonA')) {
                        const { player, stairs, stairsUp } = gameState;
                        // Check distance instead of exact integer match for stairs
                        const distTo = (p: any, t: any) => Math.sqrt((p.x - t.x) ** 2 + (p.y - t.y) ** 2);
                        const INTERACT_DIST = 1.0;

                        const onStairsDown = stairs && player && distTo(player, stairs) < INTERACT_DIST;
                        const onStairsUp = stairsUp && player && distTo(player, stairsUp) < INTERACT_DIST;

                        if (onStairsDown) {
                            actions.descend(false);
                            actionTaken = true;
                        } else if (onStairsUp) {
                            actions.descend(true);
                            actionTaken = true;
                        } else {
                            // Try interaction
                            const result = actions.interact(); // interact needs update for distance too
                            if (result) {
                                if (result.type === 'npc') {
                                    setActiveNPC(result.data as NPC);
                                }
                                actionTaken = true;
                            }
                        }
                    }

                    // X -> Attack (Space)
                    if (isPressing('buttonX')) {
                        if (uiState.selectedSkill) {
                            // ... skill logic
                            const skill = SKILLS[uiState.selectedSkill];
                            if (skill && skill.type !== 'melee') {
                                const success = actions.executeSkillAction(uiState.selectedSkill);
                                if (success) actionTaken = true;
                            }
                        }
                    }

                    // Y -> Inventory (I)
                    if (isPressing('buttonY')) {
                        setInventoryOpen(prev => !prev);
                    }

                    // Select -> Skills (T)
                    if (isPressing('select')) {
                        setSkillTreeOpen(prev => !prev);
                    }
                }

                if (actionTaken) {
                    lastActionTime.current = now;
                    if (onAction) onAction();
                }
            }

            animationFrameId = requestAnimationFrame(gameLoop);
        };

        animationFrameId = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [gameStarted, gameOver, modals, actions, onAction, keyboardKeys, pollGamepad, isPressing, getMovement]);
}

