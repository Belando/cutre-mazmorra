import React from 'react';
import { canUseSkill, getUnlockedSkills } from '@/engine/systems/SkillSystem';
import { SKILLS, SKILL_COLORS, SKILL_TREES } from '@/data/skills'; // Importamos colores y árboles
import { cn } from '@/engine/core/utils';
import { useGame } from '@/context/GameContext';

export default function SkillBar({ disabled }) {
  const { gameState, uiState, actions } = useGame();
  const { player } = gameState;
  const { selectedSkill } = uiState;
  
  if (!player || !player.skills) return null;

  const learnedSkillIds = player.skills.learned || [];
  const cooldowns = player.skills.cooldowns || {};
  const unlockedSkills = getUnlockedSkills(player.level, learnedSkillIds);
  
  return (
    <div className="w-20 p-2 border rounded-lg bg-slate-900/80 backdrop-blur-sm border-slate-700/50">
      <div className="text-[10px] text-slate-400 font-medium mb-2 text-center">HABILIDADES</div>
      
      <div className="flex flex-col gap-1.5">
        {unlockedSkills.map((skill, index) => {
          const isOnCooldown = !canUseSkill(skill.id, cooldowns);
          const cooldownLeft = cooldowns[skill.id] || 0;
          const isSelected = selectedSkill === skill.id;
          const SkillIcon = skill.icon;
          
          // Lógica de color: Color específico > Color de clase > Blanco por defecto
          const iconColor = SKILL_COLORS[skill.id] || SKILL_TREES[skill.tree]?.color || '#ffffff';
          
          return (
            <button
              key={skill.id}
              onClick={() => actions.setSelectedSkill(isSelected ? null : skill.id)}
              disabled={disabled || isOnCooldown}
              className={cn(
                "relative w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all mx-auto",
                isSelected 
                  ? "border-yellow-400 bg-yellow-400/20 shadow-lg shadow-yellow-400/30" 
                  : "border-slate-600 bg-slate-800/50 hover:border-slate-500",
                isOnCooldown && "opacity-50 cursor-not-allowed",
                !isOnCooldown && !disabled && "hover:scale-105"
              )}
              title={`${skill.name}: ${skill.description}`}
              // Opcional: Si quieres que el borde también tenga un toque del color de la habilidad cuando no está seleccionado
              style={!isSelected ? { borderColor: `${iconColor}60` } : {}}
            >
              {/* Renderizamos el icono con el color dinámico */}
              <SkillIcon className="text-xl" style={{ color: iconColor }} />
              
              {isOnCooldown && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60">
                  <span className="text-xs font-bold text-white">{cooldownLeft}</span>
                </div>
              )}
              
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-slate-700 rounded text-[9px] text-slate-300 flex items-center justify-center">
                {index + 1}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Info de habilidad seleccionada */}
      {selectedSkill && SKILLS[selectedSkill] && (
        <div className="mt-2 p-1.5 bg-slate-800/50 rounded text-center">
          <div className="text-xs font-medium text-white">
            {SKILLS[selectedSkill].name}
          </div>
          <p className="text-[10px] text-yellow-400 mt-0.5">
            {SKILLS[selectedSkill].type === 'self' || SKILLS[selectedSkill].type === 'aoe' || SKILLS[selectedSkill].type === 'ultimate'
              ? 'ESPACIO para usar'
              : SKILLS[selectedSkill].type === 'ranged'
              ? `Rango ${SKILLS[selectedSkill].range || 5} - ESPACIO`
              : 'Muévete hacia enemigo'}
          </p>
        </div>
      )}
    </div>
  );
}