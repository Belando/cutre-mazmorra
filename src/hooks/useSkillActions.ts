import { soundManager } from "@/engine/systems/SoundSystem";
import {
    learnSkill as learnSkillLogic,
    upgradeSkill as upgradeSkillLogic,
    evolveClass as evolveClassLogic
} from '@/engine/systems/SkillSystem';
import { Player } from '@/types';

export interface SkillActionsContext {
    player: Player;
    updatePlayer: (updates: Partial<Player>) => void;
    addMessage: (msg: string, type?: string) => void;
}

export function useSkillActions(context: SkillActionsContext) {
    const { player, updatePlayer, addMessage } = context;

    const learnSkill = (id: string) => {
        if (!player.skills) return;
        const newSkills = JSON.parse(JSON.stringify(player.skills));
        const res = learnSkillLogic(newSkills, id);
        if (res.success) {
            updatePlayer({ skills: newSkills });
            addMessage("Habilidad aprendida", 'levelup');
            soundManager.play('levelUp');
        }
    };

    const upgradeSkill = (id: string) => {
        if (!player.skills) return;
        const newSkills = JSON.parse(JSON.stringify(player.skills));
        const res = upgradeSkillLogic(newSkills, id);
        if (res.success) {
            updatePlayer({ skills: newSkills });
            addMessage("Habilidad mejorada", 'levelup');
            soundManager.play('levelUp');
        }
    };

    const evolveClass = (cls: string) => {
        if (!player.skills) return;
        const newSkills = JSON.parse(JSON.stringify(player.skills));
        const res = evolveClassLogic(newSkills, cls);
        if (res.success) {
            updatePlayer({ skills: newSkills });
            addMessage("¡Clase evolucionada!", 'levelup');
            soundManager.play('start_adventure');
        }
    };

    return {
        learnSkill,
        upgradeSkill,
        evolveClass
    };
}
