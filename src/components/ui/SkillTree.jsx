import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Star, Zap, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { getClassSkills, getSkillLevel, canEvolve, getEvolutionOptions, getSkillEffectiveStats } from '@/engine/systems/SkillSystem';
import { SKILLS, SKILL_TREES, CLASS_EVOLUTIONS } from '@/data/skills';

export default function SkillTree({ 
  isOpen, 
  onClose, 
  playerClass, 
  playerLevel,
  learnedSkills = [],
  skillLevels = {},
  skillPoints = 0,
  evolvedClass = null,
  onEvolve,
  onLearnSkill,  
  onUpgradeSkill,
}) {
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showEvolution, setShowEvolution] = useState(false);
  
  if (!isOpen) return null;
  
  const treeInfo = SKILL_TREES[evolvedClass || playerClass] || SKILL_TREES.warrior;
  // const baseTreeInfo = SKILL_TREES[playerClass] || SKILL_TREES.warrior; // (Variable no usada, se puede quitar o dejar)
  
  // Get skills for current class (and evolved if applicable)
  const classSkills = getClassSkills(playerClass, evolvedClass);
  const canEvolveNow = canEvolve(playerLevel, { evolvedClass });
  const evolutionOptions = getEvolutionOptions(playerClass);
  
  // Group skills by unlock level for cascade display
  const skillsByLevel = {};
  classSkills.forEach(skill => {
    const lvl = skill.unlockLevel;
    if (!skillsByLevel[lvl]) skillsByLevel[lvl] = [];
    skillsByLevel[lvl].push(skill);
  });
  const sortedLevels = Object.keys(skillsByLevel).sort((a, b) => parseInt(a) - parseInt(b));
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border w-full max-w-3xl max-h-[90vh] overflow-hidden"
        style={{ borderColor: treeInfo.color + '50' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-4 border-b"
          style={{ 
            borderColor: treeInfo.color + '30',
            background: `linear-gradient(135deg, ${treeInfo.color}15 0%, transparent 50%)`
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="flex items-center justify-center text-3xl shadow-lg w-14 h-14 rounded-xl"
              style={{ 
                backgroundColor: treeInfo.color + '25',
                boxShadow: `0 0 20px ${treeInfo.color}30`
              }}
            >
              {treeInfo.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: treeInfo.color }}>
                {evolvedClass ? SKILL_TREES[evolvedClass].name : treeInfo.name}
              </h2>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-400">Nivel {playerLevel}</span>
                <span className="flex items-center gap-1 font-medium text-amber-400">
                  <Zap className="w-4 h-4" />
                  {skillPoints} puntos
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Evolution Banner */}
        {canEvolveNow && !evolvedClass && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border-b bg-gradient-to-r from-amber-900/50 via-purple-900/50 to-amber-900/50 border-amber-700/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20 animate-pulse">
                  <Star className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <span className="text-lg font-bold text-amber-200">¡Evolución disponible!</span>
                  <p className="text-sm text-amber-300/60">Elige tu especialización</p>
                </div>
              </div>
              <Button 
                className="shadow-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500"
                onClick={() => setShowEvolution(true)}
              >
                <Star className="w-4 h-4 mr-2" />
                Evolucionar
              </Button>
            </div>
          </motion.div>
        )}
        
        {/* Evolution Modal */}
        <AnimatePresence>
          {showEvolution && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center p-6 bg-black/95"
            >
              <motion.div
                initial={{ scale: 0.8, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 30 }}
                className="w-full max-w-lg p-6 border bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl border-amber-500/30"
              >
                <div className="mb-6 text-center">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 rounded-full bg-amber-500/20">
                    <Star className="w-10 h-10 text-amber-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-amber-400">¡Elige tu Destino!</h3>
                  <p className="mt-1 text-slate-400">Esta decisión es permanente</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {evolutionOptions.map(evoClass => {
                    const evoInfo = SKILL_TREES[evoClass];
                    return (
                      <motion.button
                        key={evoClass}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          onEvolve(evoClass);
                          setShowEvolution(false);
                        }}
                        className="p-5 text-left transition-all border-2 rounded-xl"
                        style={{ 
                          borderColor: evoInfo.color,
                          background: `linear-gradient(135deg, ${evoInfo.color}20 0%, transparent 70%)`
                        }}
                      >
                        <div className="mb-3 text-4xl">{evoInfo.icon}</div>
                        <div className="text-lg font-bold" style={{ color: evoInfo.color }}>
                          {evoInfo.name}
                        </div>
                        <p className="mt-2 text-sm text-slate-400">
                          {evoInfo.description}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
                <Button
                  variant="ghost"
                  className="w-full mt-5 text-slate-400"
                  onClick={() => setShowEvolution(false)}
                >
                  Decidir más tarde
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Skills Cascade Display */}
        <div className="p-4 overflow-y-auto max-h-[55vh]">
          <div className="space-y-4">
            {sortedLevels.map((level, tierIndex) => {
              const skills = skillsByLevel[level];
              const isUnlocked = parseInt(level) <= playerLevel;
              
              return (
                <motion.div 
                  key={level}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: tierIndex * 0.1 }}
                  className="relative"
                >
                  {/* Level Header */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isUnlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-500'
                    }`}>
                      Nivel {level}
                    </div>
                    {tierIndex < sortedLevels.length - 1 && (
                      <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
                    )}
                  </div>
                  
                  {/* Skills Row */}
                  <div className="flex flex-wrap gap-3 pl-4">
                    {skills.map((skill, skillIndex) => {
                      const isLearned = learnedSkills.includes(skill.id);
                      const canLearn = !isLearned && skill.unlockLevel <= playerLevel;
                      const currentLevel = skillLevels[skill.id] || 1;
                      const canUpgrade = isLearned && currentLevel < (skill.maxLevel || 5) && skillPoints > 0;
                      const isEvolutionSkill = !['warrior', 'mage', 'rogue'].includes(skill.tree);
                      const skillTreeInfo = SKILL_TREES[skill.tree];
                      
                      return (
                        <motion.button
                          key={skill.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: tierIndex * 0.1 + skillIndex * 0.05 }}
                          onClick={() => setSelectedSkill(selectedSkill?.id === skill.id ? null : skill)}
                          className={`relative p-3 rounded-xl border-2 text-left transition-all min-w-[140px] ${
                            isLearned 
                              ? 'bg-emerald-900/30 border-emerald-500/60' 
                              : canLearn
                                ? 'bg-amber-900/20 border-amber-500/50 hover:border-amber-400'
                                : 'bg-slate-800/30 border-slate-700/50 opacity-50'
                          } ${selectedSkill?.id === skill.id ? 'ring-2 ring-white/30' : ''}`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-2xl">{skill.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">
                                {skill.name}
                              </div>
                              {isLearned && (
                                <div className="flex items-center gap-1 mt-1">
                                  {Array.from({ length: skill.maxLevel || 5 }).map((_, i) => (
                                    <div 
                                      key={i}
                                      className={`w-2 h-2 rounded-full ${
                                        i < currentLevel ? 'bg-emerald-400' : 'bg-slate-600'
                                      }`}
                                    />
                                  ))}
                                </div>
                              )}
                              {!isLearned && (
                                <div className="text-[10px] text-slate-500 mt-1">
                                  {skill.type === 'melee' && 'Cuerpo a cuerpo'}
                                  {skill.type === 'ranged' && 'A distancia'}
                                  {skill.type === 'self' && 'Personal'}
                                  {skill.type === 'aoe' && 'En área'}
                                  {skill.type === 'ultimate' && 'Definitiva'}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Badges */}
                          {isEvolutionSkill && (
                            <div 
                              className="absolute flex items-center justify-center w-5 h-5 rounded-full -top-1 -left-1"
                              style={{ backgroundColor: skillTreeInfo?.color || '#666' }}
                            >
                              <span className="text-[10px]">{skillTreeInfo?.icon}</span>
                            </div>
                          )}
                          {canUpgrade && (
                            <div className="absolute flex items-center justify-center w-5 h-5 rounded-full -top-1 -right-1 bg-amber-500 animate-pulse">
                              <Zap className="w-3 h-3 text-black" />
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                  
                  {/* Connector line */}
                  {tierIndex < sortedLevels.length - 1 && (
                    <div className="absolute left-6 top-full w-0.5 h-4 bg-gradient-to-b from-slate-600 to-transparent" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* Selected Skill Details (ACTUALIZADO) */}
        <AnimatePresence>
          {selectedSkill && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-700"
            >
              <div className="p-4 bg-slate-800/70">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="flex items-center justify-center text-3xl w-14 h-14 rounded-xl"
                      style={{ backgroundColor: SKILL_TREES[selectedSkill.tree]?.color + '25' }}
                    >
                      {selectedSkill.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{selectedSkill.name}</h3>
                      {/* --- AQUÍ CALCULAMOS LOS VALORES REALES --- */}
                      {(() => {
                        const currentLvl = skillLevels[selectedSkill.id] || 1;
                        const { cooldown, manaCost } = getSkillEffectiveStats(selectedSkill, currentLvl);
                        return (
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="px-2 py-0.5 rounded bg-slate-700">
                              {selectedSkill.type === 'melee' && '⚔️ Cuerpo a cuerpo'}
                              {selectedSkill.type === 'ranged' && '🏹 A distancia'}
                              {selectedSkill.type === 'self' && '✨ Personal'}
                              {selectedSkill.type === 'aoe' && '💥 Área'}
                              {selectedSkill.type === 'ultimate' && '⚡ Definitiva'}
                            </span>
                            <span className="text-blue-300">⏱️ {cooldown} turnos</span>
                            {manaCost > 0 && <span className="text-cyan-400">💧 {manaCost} MP</span>}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSkill(null)}
                    className="text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <p className="p-3 mb-4 text-sm rounded-lg text-slate-300 bg-slate-900/50">
                  {selectedSkill.description}
                </p>
                
                <div className="flex gap-3 mt-4">
                  {/* CASO 1: No tienes la habilidad -> Botón APRENDER */}
                  {!learnedSkills.includes(selectedSkill.id) && (
                    <Button
                      className={`
                        ${selectedSkill.unlockLevel <= playerLevel 
                          ? 'bg-emerald-600 hover:bg-emerald-500' 
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
                      `}
                      disabled={selectedSkill.unlockLevel > playerLevel}
                      onClick={() => {
                        onLearnSkill(selectedSkill.id);
                        setSelectedSkill(null);
                      }}
                    >
                      {selectedSkill.unlockLevel > playerLevel 
                        ? `Bloqueado (Nivel ${selectedSkill.unlockLevel})` 
                        : '✅ Aprender'}
                    </Button>
                  )}

                  {/* CASO 2: Ya tienes la habilidad -> Botón MEJORAR (Siempre visible) */}
                  {learnedSkills.includes(selectedSkill.id) && (
                    <Button
                      className={`
                        ${skillPoints > 0 && (skillLevels[selectedSkill.id] || 1) < (selectedSkill.maxLevel || 5)
                          ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20' 
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'}
                      `}
                      disabled={skillPoints <= 0 || (skillLevels[selectedSkill.id] || 1) >= (selectedSkill.maxLevel || 5)}
                      onClick={() => onUpgradeSkill(selectedSkill.id)}
                    >
                      <Zap className={`w-4 h-4 mr-2 ${skillPoints > 0 ? 'text-yellow-300' : 'text-slate-600'}`} />
                      
                      {/* Texto que te explica la situación */}
                      {(skillLevels[selectedSkill.id] || 1) >= (selectedSkill.maxLevel || 5) 
                        ? 'Nivel Máximo Alcanzado' 
                        : skillPoints <= 0 
                          ? 'Necesitas Puntos de Habilidad' 
                          : `Mejorar al Nivel ${(skillLevels[selectedSkill.id] || 1) + 1}`}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Footer */}
        <div className="p-3 text-xs text-center border-t border-slate-800 text-slate-500 bg-slate-950/50">
          Ganas 1 punto de habilidad al subir de nivel • Pulsa [T] para cerrar
        </div>
      </motion.div>
    </motion.div>
  );
}