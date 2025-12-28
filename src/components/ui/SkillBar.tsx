import React from 'react';
import { canUseSkill, getUnlockedSkills } from '@/engine/systems/SkillSystem';
import { SKILLS, SKILL_COLORS, SKILL_TREES } from '@/data/skills';
import { cn } from '@/engine/core/utils';
// @ts-ignore - GameContext might not be typed yet
import { useGame } from '@/context/GameContext';

interface SkillBarProps {
    disabled?: boolean;
}

export default function SkillBar({ disabled }: SkillBarProps) {
    const { gameState, uiState, actions } = useGame();
    const { player } = gameState;
    const { selectedSkill } = uiState;

    if (!player || !player.skills) return null;

    const learnedSkillIds = player.skills.learned || [];
    const cooldowns = player.skills.cooldowns || {};
    const unlockedSkills = getUnlockedSkills(player.level, learnedSkillIds);

    return (
        <div className="flex gap-2 items-center">
            {/* Horizontal Layout */}
            <div className="flex gap-2">
                {unlockedSkills.map((skill, index) => {
                    const isOnCooldown = !canUseSkill(skill.id, cooldowns);
                    const cooldownLeft = cooldowns[skill.id] || 0;
                    const isSelected = selectedSkill === skill.id;
                    const SkillIcon = skill.icon;
                    const iconColor = (SKILL_COLORS as any)[skill.id] || (SKILL_TREES as any)[skill.tree]?.color || '#ffffff';

                    return (
                        <button
                            key={skill.id}
                            onClick={() => actions.setSelectedSkill(isSelected ? null : skill.id)}
                            disabled={disabled || isOnCooldown}
                            className={cn(
                                "relative w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all",
                                isSelected
                                    ? "border-yellow-400 bg-yellow-400/20 shadow-lg shadow-yellow-400/30"
                                    : "border-slate-600 bg-slate-800/50 hover:border-slate-500",
                                isOnCooldown && "opacity-50 cursor-not-allowed",
                                !isOnCooldown && !disabled && "hover:scale-105"
                            )}
                            title={`${skill.name}: ${skill.description}`}
                            style={!isSelected ? { borderColor: `${iconColor}60` } : {}}
                        >
                            <SkillIcon className="text-2xl" style={{ color: iconColor }} />
                            {isOnCooldown && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60">
                                    <span className="text-xs font-bold text-white">{cooldownLeft}</span>
                                </div>
                            )}
                            <span className="absolute -top-2 -left-2 w-5 h-5 bg-slate-700/90 rounded-full text-[10px] text-white flex items-center justify-center font-bold border border-slate-600 shadow-sm">
                                {index + 1}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Description removed as per user request */}
        </div>
    );
}
