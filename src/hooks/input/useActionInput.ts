import { InputIntent } from '@/engine/input/InputTypes';
import { GameActions } from '../useGameActions';
import { GameState, NPC, Entity } from '@/types';
import { getUnlockedSkills } from "@/engine/systems/SkillSystem";
import { SKILLS } from '@/data/skills';

export function useActionInput(
    actions: GameActions,
    gameState: GameState,
    uiState: { selectedSkill: string | null },
    setActiveNPC: (npc: NPC | null) => void,
    onAction?: () => void
) {
    const handleActionInput = (
        intents: Set<InputIntent>,
        keyboardKeys: Set<string>
    ): boolean => {

        // --- INTERACT ---
        if (intents.has(InputIntent.INTERACT)) {
            const result = actions.interact();
            if (result?.type === 'npc') {
                setActiveNPC(result.data);
                return true;
            } else if (result?.type === 'chest') {
                return true;
            }
        }

        // --- DESCEND ---
        if (intents.has(InputIntent.DESCEND)) {
            actions.descend(false);
            return true;
        }

        // --- ATTACK (Base / Skill) ---
        if (intents.has(InputIntent.ATTACK)) {
            if (uiState.selectedSkill) {
                const skill = SKILLS[uiState.selectedSkill];
                if (skill && skill.type !== 'melee') {
                    const success = actions.executeSkillAction(uiState.selectedSkill);
                    if (success) return true;
                }
            }
        }

        // --- QUICK SLOTS ---
        if (intents.has(InputIntent.QUICK_SLOT_1)) { actions.useQuickSlot(0); return true; }
        if (intents.has(InputIntent.QUICK_SLOT_2)) { actions.useQuickSlot(1); return true; }
        if (intents.has(InputIntent.QUICK_SLOT_3)) { actions.useQuickSlot(2); return true; }

        // --- NUMERIC SKILL SELECTION (1-6) ---
        // This toggles selection, it doesn't consume a turn usually, BUT might be considered an "input action"
        // In the original code, this returned true (actionTaken), which triggers cooldown.
        let selectionChanged = false;

        keyboardKeys.forEach((key: string) => {
            if (key >= '1' && key <= '6') {
                const index = parseInt(key) - 1;
                if (gameState?.player?.skills && gameState?.player?.level !== undefined) {
                    const unlocked = getUnlockedSkills(gameState.player.level, gameState.player.skills.learned);
                    if (unlocked[index]) {
                        actions.setSelectedSkill(uiState.selectedSkill === unlocked[index].id ? null : unlocked[index].id);
                        selectionChanged = true;
                    }
                }
            }
        });

        if (selectionChanged) return true;

        return false;
    };

    return { handleActionInput };
}
