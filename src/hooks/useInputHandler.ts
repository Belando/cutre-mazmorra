import { useEffect, useRef } from 'react';
// @ts-ignore
import { QUICK_SLOT_HOTKEYS } from "@/components/ui/QuickSlots";
import { getUnlockedSkills } from "@/engine/systems/SkillSystem";
import { SKILLS } from '@/data/skills';
import { GameActions } from './useGameActions';
import { GameState, Entity } from '@/types';

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
    const pressedKeys = useRef(new Set<string>());

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!gameStarted || gameOver) return;

            const key = e.key.toLowerCase();
            pressedKeys.current.add(key);

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
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            pressedKeys.current.delete(e.key.toLowerCase());
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameStarted, gameOver, uiState, gameState, modals, actions, onAction, inventoryOpen, craftingOpen, skillTreeOpen, activeNPC, setInventoryOpen, setCraftingOpen, setSkillTreeOpen, setActiveNPC]);

    useEffect(() => {
        if (!gameStarted || gameOver) return;

        let animationFrameId: number;

        const gameLoop = () => {
            if (modals.inventoryOpen || modals.craftingOpen || modals.skillTreeOpen || modals.activeNPC) {
                animationFrameId = requestAnimationFrame(gameLoop);
                return;
            }

            const now = Date.now();
            if (now - lastActionTime.current >= INPUT_COOLDOWN) {
                const keys = pressedKeys.current;
                if (keys.size > 0) {
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
                        if (onAction) onAction();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(gameLoop);
        };

        animationFrameId = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [gameStarted, gameOver, modals, actions, onAction]);
}
