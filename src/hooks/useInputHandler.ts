import { useEffect, useRef } from 'react';
import { getUnlockedSkills } from "@/engine/systems/SkillSystem";
import { SKILLS } from '@/data/skills';
import { GameActions } from './useGameActions';
import { GameState, Entity, NPC } from '@/types';
import { useKeyboardControls } from './useKeyboardControls';
import { useGamepadControls } from './useGamepadControls';
import { InputIntent } from '@/engine/input/InputTypes';
import { resolveIntents } from '@/engine/input/InputMapping';

const INPUT_COOLDOWN = 160;

export interface InputHandlerModals {
    inventoryOpen: boolean;
    craftingOpen: boolean;
    skillTreeOpen: boolean;
    activeNPC: NPC | null;
    pauseMenuOpen: boolean;
    chatOpen: boolean;
    mapExpanded: boolean;
    grimoireOpen: boolean;
    setInventoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setCraftingOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setSkillTreeOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setActiveNPC: React.Dispatch<React.SetStateAction<NPC | null>>;
    setPauseMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setMapExpanded: React.Dispatch<React.SetStateAction<boolean>>;
    setGrimoireOpen: React.Dispatch<React.SetStateAction<boolean>>;
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
    const { inventoryOpen, craftingOpen, skillTreeOpen, activeNPC, pauseMenuOpen, chatOpen, mapExpanded, grimoireOpen, setInventoryOpen, setCraftingOpen, setSkillTreeOpen, setActiveNPC, setPauseMenuOpen, setChatOpen, setMapExpanded, setGrimoireOpen } = modals;

    const lastActionTime = useRef(0);
    const lastIntentTime = useRef(0);

    const { pressedKeys: keyboardKeys } = useKeyboardControls();
    const { pollGamepad, getCurrentState } = useGamepadControls();

    const lastChatCloseTime = useRef(0);

    // Track when chat closes to prevent immediate re-opening (bounce)
    useEffect(() => {
        if (!chatOpen) {
            lastChatCloseTime.current = Date.now();
        }
    }, [chatOpen]);

    // Loop de Juego Principal (Input Polling)
    useEffect(() => {
        if (!gameStarted || gameOver) return;

        let animationFrameId: number;

        const gameLoop = () => {
            const now = Date.now();

            // 1. Gather all Inputs (Keyboard + Gamepad)
            const padState = pollGamepad();
            const currentIntents = resolveIntents(keyboardKeys.current, padState);

            // 2. Global Toggles (Debounced) - UI Menus
            if (now - lastIntentTime.current > 200) {
                if (currentIntents.has(InputIntent.CLOSE_UI)) {
                    lastIntentTime.current = now;
                    if (chatOpen) setChatOpen(false);
                    else if (activeNPC) setActiveNPC(null);
                    else if (skillTreeOpen) setSkillTreeOpen(false);
                    else if (craftingOpen) setCraftingOpen(false);
                    else if (inventoryOpen) setInventoryOpen(false);
                    else if (grimoireOpen) setGrimoireOpen(false);
                    else if (pauseMenuOpen) setPauseMenuOpen(false);
                    else if (modals.mapExpanded) modals.setMapExpanded(false);
                    else if (uiState.rangedMode) actions.setRangedMode(false);
                    else setPauseMenuOpen(true);
                } else if (currentIntents.has(InputIntent.TOGGLE_INVENTORY)) {
                    lastIntentTime.current = now;
                    if (!activeNPC && !skillTreeOpen && !chatOpen) setInventoryOpen(p => !p);
                } else if (currentIntents.has(InputIntent.TOGGLE_SKILLS)) {
                    lastIntentTime.current = now;
                    if (!activeNPC && !inventoryOpen && !chatOpen) setSkillTreeOpen(p => !p);
                } else if (currentIntents.has(InputIntent.TOGGLE_PAUSE)) {
                    lastIntentTime.current = now;
                    if (!chatOpen) setPauseMenuOpen(p => !p);
                } else if (currentIntents.has(InputIntent.TOGGLE_CHAT)) {
                    lastIntentTime.current = now;
                    if (!chatOpen && now - lastChatCloseTime.current > 200) {
                        setChatOpen(true);
                    }
                }
            } // <--- ESTA LLAVE FALTABA

            // 3. Game Actions (Blocked by UI)
            const anyModalOpen = inventoryOpen || craftingOpen || skillTreeOpen || activeNPC || pauseMenuOpen || modals.mapExpanded || chatOpen || grimoireOpen;

            if (!anyModalOpen && now - lastActionTime.current >= INPUT_COOLDOWN) {
                let actionTaken = false;
                let dx = 0;
                let dy = 0;

                // --- MOVEMENT ---
                if (currentIntents.has(InputIntent.MOVE_UP)) dy -= 1;
                if (currentIntents.has(InputIntent.MOVE_DOWN)) dy += 1;
                if (currentIntents.has(InputIntent.MOVE_LEFT)) dx -= 1;
                if (currentIntents.has(InputIntent.MOVE_RIGHT)) dx += 1;

                if (currentIntents.has(InputIntent.MOVE_UP_LEFT)) { dx = -1; dy = -1; }
                if (currentIntents.has(InputIntent.MOVE_UP_RIGHT)) { dx = 1; dy = -1; }
                if (currentIntents.has(InputIntent.MOVE_DOWN_LEFT)) { dx = -1; dy = 1; }
                if (currentIntents.has(InputIntent.MOVE_DOWN_RIGHT)) { dx = 1; dy = 1; }

                if (dx !== 0 || dy !== 0) {
                    const gridDx = dx + dy;
                    const gridDy = dy - dx;
                    actions.move(Math.sign(gridDx), Math.sign(gridDy));
                    actionTaken = true;
                }

                // --- ACTIONS ---
                if (!actionTaken) {
                    if (currentIntents.has(InputIntent.INTERACT)) {
                        const result = actions.interact();
                        if (result?.type === 'npc') {
                            setActiveNPC(result.data);
                            actionTaken = true;
                        } else if (result?.type === 'chest') {
                            actionTaken = true;
                        }
                    } else if (currentIntents.has(InputIntent.DESCEND)) {
                        actions.descend(false);
                        actionTaken = true;
                    } else if (currentIntents.has(InputIntent.ATTACK)) {
                        if (uiState.selectedSkill) {
                            const skill = SKILLS[uiState.selectedSkill];
                            if (skill && skill.type !== 'melee') {
                                const success = actions.executeSkillAction(uiState.selectedSkill);
                                if (success) actionTaken = true;
                            }
                        }
                    }

                    // --- QUICK SLOTS ---
                    if (currentIntents.has(InputIntent.QUICK_SLOT_1)) { actions.useQuickSlot(0); actionTaken = true; }
                    if (currentIntents.has(InputIntent.QUICK_SLOT_2)) { actions.useQuickSlot(1); actionTaken = true; }
                    if (currentIntents.has(InputIntent.QUICK_SLOT_3)) { actions.useQuickSlot(2); actionTaken = true; }

                    // Legacy Numeric keys 1-6
                    keyboardKeys.current.forEach((key: string) => {
                        if (key >= '1' && key <= '6') {
                            const index = parseInt(key) - 1;
                            if (gameState?.player?.skills && gameState?.player?.level !== undefined) {
                                const unlocked = getUnlockedSkills(gameState.player.level, gameState.player.skills.learned);
                                if (unlocked[index]) {
                                    actions.setSelectedSkill(uiState.selectedSkill === unlocked[index].id ? null : unlocked[index].id);
                                    actionTaken = true;
                                }
                            }
                        }
                    });
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
    }, [
        gameStarted,
        gameOver,
        modals,
        actions,
        onAction,
        keyboardKeys,
        pollGamepad,
        getCurrentState
    ]);
}