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
}

export function useInputHandler({
    gameStarted,
    gameOver,
    uiState,
    actions,
    gameState,
    modals,
    onAction
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

            // 2. Handle Actions (Movement & Buttons)
            if (now - lastActionTime.current >= INPUT_COOLDOWN) {
                let actionTaken = false;

                // --- MOVEMENT ---
                let dx = 0;
                let dy = 0;

                // Keyboard
                const keys = keyboardKeys.current;
                if (keys.size > 0) {
                    if (keys.has('w') || keys.has('arrowup')) dy -= 1;
                    if (keys.has('s') || keys.has('arrowdown')) dy += 1;
                    if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
                    if (keys.has('d') || keys.has('arrowright')) dx += 1;

                    if (keys.has('home')) { dx = -1; dy = -1; }
                    if (keys.has('pageup')) { dx = 1; dy = -1; }
                    if (keys.has('end')) { dx = -1; dy = 1; }
                    if (keys.has('pagedown')) { dx = 1; dy = 1; }
                }

                // Gamepad
                if (padState) {
                    const padMove = getMovement();
                    if (padMove.dx !== 0 || padMove.dy !== 0) {
                        dx = padMove.dx;
                        dy = padMove.dy;
                    }
                }

                if (dx !== 0 || dy !== 0) {
                    actions.move(Math.sign(dx), Math.sign(dy));
                    actionTaken = true;
                }

                // --- GAMEPAD BUTTON ACTIONS (Simulating keyboard shortcuts) ---
                if (padState && !actionTaken) {
                    // A -> Interact (E) or Descend (Enter)
                    // Priority: Stairs > Interact
                    if (isPressing('buttonA')) {
                        // GameState structure: { player, stairs, stairsUp, ... }
                        // It does NOT contain 'dungeon' object, but spreads its props.
                        const { player, stairs, stairsUp } = gameState;

                        const onStairsDown = stairs && player && player.x === stairs.x && player.y === stairs.y;
                        const onStairsUp = stairsUp && player && player.x === stairsUp.x && player.y === stairsUp.y;

                        if (onStairsDown) {
                            actions.descend(false);
                            actionTaken = true;
                        } else if (onStairsUp) {
                            actions.descend(true);
                            actionTaken = true;
                        } else {
                            // Try interaction if not on stairs
                            const result = actions.interact();
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

                    // Start -> Pause/Menu
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
    }, [gameStarted, gameOver, modals, actions, onAction, keyboardKeys, pollGamepad, isPressing, getMovement]); // Added necessary deps
}

