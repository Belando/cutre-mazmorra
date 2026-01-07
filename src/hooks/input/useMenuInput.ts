import { InputIntent } from '@/engine/input/InputTypes';
import { InputHandlerModals } from '../useInputHandler';
import { GameActions } from '../useGameActions';
import { Entity } from '@/types';

export function useMenuInput(
    modals: InputHandlerModals,
    uiState: { rangedMode: boolean },
    actions: GameActions
) {
    const {
        inventoryOpen, skillTreeOpen, activeNPC, chatOpen, grimoireOpen, pauseMenuOpen, mapExpanded,
        setInventoryOpen, setSkillTreeOpen, setActiveNPC, setPauseMenuOpen, setChatOpen, setCraftingOpen, setGrimoireOpen
    } = modals;

    const handleMenuInput = (intents: Set<InputIntent>, lastChatCloseTime: number): boolean => {
        const now = Date.now();

        if (intents.has(InputIntent.CLOSE_UI)) {
            if (chatOpen) setChatOpen(false);
            else if (activeNPC) setActiveNPC(null);
            else if (skillTreeOpen) setSkillTreeOpen(false);
            else if (modals.craftingOpen) setCraftingOpen(false);
            else if (inventoryOpen) setInventoryOpen(false);
            else if (grimoireOpen) setGrimoireOpen(false);
            else if (pauseMenuOpen) setPauseMenuOpen(false);
            else if (mapExpanded) modals.setMapExpanded(false);
            else if (uiState.rangedMode) actions.setRangedMode(false);
            else setPauseMenuOpen(true);
            return true;
        }

        if (intents.has(InputIntent.TOGGLE_INVENTORY)) {
            if (!activeNPC && !skillTreeOpen && !chatOpen) {
                setInventoryOpen(p => !p);
                return true;
            }
        }

        if (intents.has(InputIntent.TOGGLE_SKILLS)) {
            if (!activeNPC && !inventoryOpen && !chatOpen) {
                setSkillTreeOpen(p => !p);
                return true;
            }
        }

        if (intents.has(InputIntent.TOGGLE_PAUSE)) {
            if (!chatOpen) {
                setPauseMenuOpen(p => !p);
                return true;
            }
        }

        if (intents.has(InputIntent.TOGGLE_CHAT)) {
            if (!chatOpen && now - lastChatCloseTime > 200) {
                setChatOpen(true);
                return true;
            }
        }

        return false;
    };

    return { handleMenuInput };
}
