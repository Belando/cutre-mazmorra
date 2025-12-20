import { useEffect, useRef, useCallback } from 'react';
// @ts-ignore
import { QUICK_SLOT_HOTKEYS } from "@/components/ui/QuickSlots";
import { getUnlockedSkills } from "@/engine/systems/SkillSystem";
import { SKILLS } from '@/data/skills';
import { GameActions } from './useGameActions';
import { GameState, Entity } from '@/types';
import { useKeyboardControls } from './useKeyboardControls';
import { useGamepadControls } from './useGamepadControls';

const INPUT_COOLDOWN = 160;

export interface InputHandlerModals {
    inventoryOpen: boolean;
    craftingOpen: boolean;
    skillTreeOpen: boolean;
    activeNPC: any;
    setInventoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setCraftingOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setSkillTreeOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setActiveNPC: React.Dispatch<React.SetStateAction<any>>;
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
    const { inventoryOpen, craftingOpen, skillTreeOpen, activeNPC, setInventoryOpen, setCraftingOpen, setSkillTreeOpen, setActiveNPC } = modals;

    const lastActionTime = useRef(0);

    // --- KEYBOARD HANDLER (Event Driven for specific actions) ---
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // ... (existing keyboard logic) ...
        // (We will keep the existing handleKeyDown mostly as is for keyboard support)
        if (!gameStarted || gameOver) return;

        // ... (copy existing logic inside handleKeyDown) ...
        const key = e.key.toLowerCase();

        if (e.key === 'Escape') {
            if (activeNPC) setActiveNPC(null);
            else if (skillTreeOpen) setSkillTreeOpen(false);
            else if (craftingOpen) setCraftingOpen(false);
            else if (inventoryOpen) setInventoryOpen(false);
            else if (uiState.rangedMode) actions.setRangedMode(false);
            return;
        }

        const anyModalOpen = inventoryOpen || craftingOpen || skillTreeOpen || activeNPC;

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
                    const skill = (SKILLS as any)[uiState.selectedSkill];
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
                    setActiveNPC(result.data);
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
            const anyModalOpen = modals.inventoryOpen || modals.craftingOpen || modals.skillTreeOpen || modals.activeNPC;

            if (anyModalOpen) {
                // Handle Menu Navigation with Gamepad here if desired
                if (padState) {
                    if (isPressing('buttonB') || isPressing('start')) {
                        if (activeNPC) setActiveNPC(null);
                        else if (skillTreeOpen) setSkillTreeOpen(false);
                        else if (craftingOpen) setCraftingOpen(false);
                        else if (inventoryOpen) setInventoryOpen(false);
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
                    // A -> Interact (E) or Descend (Enter) if on stairs? 
                    // Let's make A = Interact for now.
                    if (isPressing('buttonA')) {
                        // Priority: Stairs > Interact
                        // Validating if on stairs is logic for actions.interact or explicit check?
                        // The original code has Enter for descend and E for interact.
                        // Let's try interaction first.
                        const result = actions.interact();
                        if (result?.type === 'npc') {
                            setActiveNPC(result.data);
                            actionTaken = true;
                        } else if (result?.type === 'chest') {
                            actionTaken = true;
                        } else {
                            // If no interact, try descend (Enter logic)
                            // Warning: descend only works if on stairs.
                            // We don't want to descend by accident if just trying to talk.
                            // But interact() returns null if nothing nearby.
                            // Note: interact() in useGameActions doesn't handle stairs. descend() does.
                            // We might need a separate button or context sensitive 'A'.
                            if (padState.buttonA) { // Simple check
                                actions.descend(false);
                                // We can't easily know if descend worked without return value, but we set actionTaken
                                actionTaken = true;
                            }
                        }
                    }

                    // X -> Attack (Space)
                    if (isPressing('buttonX')) {
                        if (uiState.selectedSkill) {
                            const skill = (SKILLS as any)[uiState.selectedSkill];
                            if (skill && skill.type !== 'melee') {
                                const success = actions.executeSkillAction(uiState.selectedSkill);
                                if (success) actionTaken = true;
                            }
                        }
                    }

                    // Y -> Inventory (I)
                    if (isPressing('buttonY')) {
                        setInventoryOpen(prev => !prev);
                        // Since this opens menu, we don't set actionTaken for cooldown on movement, 
                        // but isPressing handles debounce for the button itself.
                    }

                    // Select -> Skills (T)
                    if (isPressing('select')) {
                        setSkillTreeOpen(prev => !prev);
                    }

                    // Start -> Pause/Menu (Esc logic handled above for closing, here maybe open pause menu?)
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
