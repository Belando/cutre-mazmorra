import { useEffect, useRef } from 'react';
import { GameActions } from './useGameActions';
import { GameState, Entity, NPC } from '@/types';
import { useKeyboardControls } from './useKeyboardControls';
import { useGamepadControls } from './useGamepadControls';
import { resolveIntents } from '@/engine/input/InputMapping';

// Sub-hooks
import { useMenuInput } from './input/useMenuInput';
import { useMovementInput } from './input/useMovementInput';
import { useActionInput } from './input/useActionInput';

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

    // --- STATE REFS ---
    const lastActionTime = useRef(0);
    const lastIntentTime = useRef(0);
    const lastChatCloseTime = useRef(0);

    // --- CONTROLS ---
    const { pressedKeys: keyboardKeys } = useKeyboardControls();
    const { pollGamepad, getCurrentState } = useGamepadControls();

    // --- SUB-HOOKS ---
    const { handleMenuInput } = useMenuInput(modals, uiState, actions);
    const { handleMovementInput } = useMovementInput(actions);
    const { handleActionInput } = useActionInput(actions, gameState, uiState, modals.setActiveNPC, onAction);

    // Track when chat closes to prevent immediate re-opening (bounce)
    useEffect(() => {
        if (!modals.chatOpen) {
            lastChatCloseTime.current = Date.now();
        }
    }, [modals.chatOpen]);

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
                if (handleMenuInput(currentIntents, lastChatCloseTime.current)) {
                    lastIntentTime.current = now;
                }
            }

            // 3. Game Actions (Blocked by UI)
            const anyModalOpen =
                modals.inventoryOpen ||
                modals.craftingOpen ||
                modals.skillTreeOpen ||
                modals.activeNPC ||
                modals.pauseMenuOpen ||
                modals.mapExpanded ||
                modals.chatOpen ||
                modals.grimoireOpen;

            if (!anyModalOpen && now - lastActionTime.current >= INPUT_COOLDOWN) {
                let actionTaken = false;

                // Priority 1: Movement
                if (handleMovementInput(currentIntents)) {
                    actionTaken = true;
                }

                // Priority 2: Actions (if no movement)
                if (!actionTaken) {
                    if (handleActionInput(currentIntents, keyboardKeys.current)) {
                        actionTaken = true;
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
    }, [
        gameStarted,
        gameOver,
        modals,
        actions,
        onAction,
        keyboardKeys,
        pollGamepad,
        getCurrentState,
        handleMenuInput,
        handleMovementInput,
        handleActionInput,
        uiState // Dependency for actions that rely on UI state
    ]);
}