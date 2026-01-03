import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import { GiUpgrade, GiStarMedal, GiPowerLightning } from 'react-icons/gi';
import { Button } from './button';
import { getClassSkills, canEvolve, getEvolutionOptions, getSkillEffectiveStats } from '@/engine/systems/SkillSystem';
import { SKILLS, SKILL_TREES, SKILL_COLORS } from '@/data/skills';

interface SkillTreeProps {
    isOpen: boolean;
    onClose: () => void;
    playerClass: string;
    playerLevel: number;
    learnedSkills?: string[];
    skillLevels?: Record<string, number>;
    skillPoints?: number;
    evolvedClass?: string | null;
    onEvolve: (evoClass: string) => void;
    onLearnSkill: (skillId: string) => void;
    onUpgradeSkill: (skillId: string) => void;
}

export default function SkillTree({
    isOpen, onClose, playerClass, playerLevel,
    learnedSkills = [], skillLevels = {}, skillPoints = 0,
    evolvedClass = null, onEvolve, onLearnSkill, onUpgradeSkill,
}: SkillTreeProps) {
    const [selectedSkill, setSelectedSkill] = useState<any>(null);
    const [showEvolution, setShowEvolution] = useState(false);

    if (!isOpen) return null;

    const treeInfo = (SKILL_TREES as any)[evolvedClass || playerClass] || SKILL_TREES.warrior;
    const TreeIcon = treeInfo.icon;

    const classSkills = getClassSkills(playerClass, evolvedClass);
    const canEvolveNow = canEvolve(playerLevel, { evolvedClass } as any);
    const evolutionOptions = getEvolutionOptions(playerClass);

    const skillsByLevel: Record<string, any[]> = {};
    classSkills.forEach(skill => {
        const lvl = skill.unlockLevel;
        if (!skillsByLevel[lvl]) skillsByLevel[lvl] = [];
        skillsByLevel[lvl].push(skill);
    });
    const sortedLevels = Object.keys(skillsByLevel).sort((a, b) => parseInt(a) - parseInt(b));

    const renderSkillIcon = (skill: any, fontSizeClass = "text-2xl") => {
        const SkillIcon = skill.icon;
        const defaultColor = (SKILL_COLORS as any)[skill.id] || (SKILL_TREES as any)[skill.tree]?.color || '#ffffff';

        if (skill.id === 'warrior_bash') {
            return (
                <span className={`${fontSizeClass} text-white drop-shadow-[0_0_4px_rgba(220,38,38,1)] filter`}>
                    <SkillIcon />
                </span>
            );
        }

        if (skill.id === 'warrior_shield_slam') {
            return (
                <div className="relative inline-block" style={{ width: '1em', height: '1em', fontSize: fontSizeClass.replace('text-', '') }}>
                    <span className="absolute inset-0 text-white pointer-events-none" style={{ filter: 'brightness(0) invert(1)' }}>
                        <SkillIcon />
                    </span>
                    <span className="absolute inset-0 z-10" style={{ color: defaultColor }}>
                        <SkillIcon />
                    </span>
                </div>
            );
        }

        return (
            <span className={fontSizeClass} style={{ color: defaultColor }}>
                <SkillIcon />
            </span>
        );
    };

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
                className="bg-[#0f172a] rounded-xl border-2 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl relative"
                style={{ borderColor: treeInfo.color }}
                onClick={e => e.stopPropagation()}
            >
                {/* Background Decoration (Constellation/Noise) */}
                <div className="absolute inset-0 opacity-10 bg-[url('/noise.png')] pointer-events-none"></div>
                <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${treeInfo.color}20, transparent 40%)` }}></div>

                {/* HEADER */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-900/90 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center text-4xl shadow-[0_0_15px_rgba(0,0,0,0.5)] w-20 h-20 rounded-full border-4 bg-slate-800"
                            style={{ borderColor: treeInfo.color }}>
                            <TreeIcon className="text-white drop-shadow-md" style={{ color: treeInfo.color }} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black font-fantasy uppercase tracking-wider drop-shadow-sm" style={{ color: treeInfo.color }}>
                                {evolvedClass ? (SKILL_TREES as any)[evolvedClass].name : treeInfo.name}
                            </h2>
                            <p className="text-sm text-slate-400 font-fantasy tracking-widest opacity-80 uppercase">Constelación de Habilidades</p>

                            <div className="flex items-center gap-4 mt-2">
                                <span className="px-3 py-1 bg-slate-950/50 rounded text-xs text-slate-400 border border-slate-700">
                                    Nivel {playerLevel}
                                </span>
                                <span className="px-3 py-1 bg-amber-950/30 rounded text-xs text-amber-400 border border-amber-500/30 flex items-center gap-2 font-bold">
                                    <GiPowerLightning className="w-4 h-4" />
                                    {skillPoints} Puntos Disponibles
                                </span>
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-500 hover:text-white hover:bg-white/10 rounded-full w-12 h-12">
                        <X className="w-8 h-8" />
                    </Button>
                </div>

                {canEvolveNow && !evolvedClass && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 border-b bg-gradient-to-r from-amber-900/50 via-purple-900/50 to-amber-900/50 border-amber-700/30"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20 animate-pulse">
                                    <GiStarMedal className="w-6 h-6 text-amber-400" />
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
                                <GiUpgrade className="w-4 h-4 mr-2" />
                                Evolucionar
                            </Button>
                        </div>
                    </motion.div>
                )}

                <AnimatePresence>
                    {showEvolution && (
                        <motion.div className="absolute inset-0 z-10 flex items-center justify-center p-6 bg-black/95">
                            <motion.div className="w-full max-w-lg p-6 border bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl border-amber-500/30">
                                <div className="mb-6 text-center">
                                    <h3 className="text-2xl font-bold text-amber-400">¡Elige tu Destino!</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {evolutionOptions.map(evoClass => {
                                        const evoInfo = (SKILL_TREES as any)[evoClass];
                                        const EvoIcon = evoInfo.icon;
                                        return (
                                            <motion.button
                                                key={evoClass}
                                                onClick={() => { onEvolve(evoClass); setShowEvolution(false); }}
                                                className="p-5 text-left transition-all border-2 rounded-xl"
                                                style={{ borderColor: evoInfo.color, background: `linear-gradient(135deg, ${evoInfo.color}20 0%, transparent 70%)` }}
                                            >
                                                <div className="mb-3 text-4xl text-white"><EvoIcon /></div>
                                                <div className="text-lg font-bold" style={{ color: evoInfo.color }}>{evoInfo.name}</div>
                                                <p className="mt-2 text-sm text-slate-400">{evoInfo.description}</p>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                                <Button variant="ghost" className="w-full mt-5 text-slate-400" onClick={() => setShowEvolution(false)}>Decidir más tarde</Button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${isUnlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-500'
                                            }`}>
                                            Nivel {level}
                                        </div>
                                        {tierIndex < sortedLevels.length - 1 && (
                                            <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-3 pl-4">
                                        {skills.map((skill, skillIndex) => {
                                            const isLearned = learnedSkills.includes(skill.id);
                                            const canLearn = !isLearned && skill.unlockLevel <= playerLevel;
                                            const currentLevel = skillLevels[skill.id] || 1;
                                            const canUpgrade = isLearned && currentLevel < (skill.maxLevel || 5) && skillPoints > 0;

                                            const isEvolutionSkill = !['warrior', 'mage', 'rogue'].includes(skill.tree);
                                            const skillTreeInfo = (SKILL_TREES as any)[skill.tree];
                                            const BadgeIcon = skillTreeInfo?.icon;

                                            return (
                                                <motion.button
                                                    key={skill.id}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: tierIndex * 0.1 + skillIndex * 0.05 }}
                                                    onClick={() => setSelectedSkill(selectedSkill?.id === skill.id ? null : skill)}
                                                    className={`relative p-3 rounded-xl border-2 text-left transition-all min-w-[140px] ${isLearned
                                                        ? 'bg-emerald-900/30 border-emerald-500/60'
                                                        : canLearn
                                                            ? 'bg-amber-900/20 border-amber-500/50 hover:border-amber-400'
                                                            : 'bg-slate-800/30 border-slate-700/50 opacity-50'
                                                        } ${selectedSkill?.id === skill.id ? 'ring-2 ring-white/30' : ''}`}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        {renderSkillIcon(skill, "text-2xl")}

                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-medium text-white truncate">{skill.name}</div>
                                                            {isLearned && (
                                                                <div className="flex items-center gap-1 mt-1">
                                                                    {Array.from({ length: skill.maxLevel || 5 }).map((_, i) => (
                                                                        <div key={i} className={`w-2 h-2 rounded-full ${i < currentLevel ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {isEvolutionSkill && BadgeIcon && (
                                                        <div
                                                            className="absolute flex items-center justify-center w-5 h-5 rounded-full -top-1 -left-1"
                                                            style={{ backgroundColor: skillTreeInfo?.color || '#666' }}
                                                        >
                                                            <span className="text-[10px] text-white flex"><BadgeIcon /></span>
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
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

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
                                        <div className="flex items-center justify-center w-14 h-14 rounded-xl"
                                            style={{ backgroundColor: (SKILL_TREES as any)[selectedSkill.tree]?.color + '25' }}>
                                            {renderSkillIcon(selectedSkill, "text-3xl")}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{selectedSkill.name}</h3>
                                            {(() => {
                                                const currentLvl = skillLevels[selectedSkill.id] || 1;
                                                const { cooldown, manaCost } = getSkillEffectiveStats(selectedSkill, currentLvl);
                                                return (
                                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                                        <span className="text-blue-300">⏱️ {cooldown} turnos</span>
                                                        {manaCost > 0 && <span className="text-cyan-400">💧 {manaCost} MP</span>}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedSkill(null)} className="text-slate-400">
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>

                                <p className="p-3 mb-4 text-sm rounded-lg text-slate-300 bg-slate-900/50">
                                    {selectedSkill.description}
                                </p>

                                <div className="flex gap-3 mt-4">
                                    {!learnedSkills.includes(selectedSkill.id) && (
                                        <Button
                                            className={`${selectedSkill.unlockLevel <= playerLevel ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                                            disabled={selectedSkill.unlockLevel > playerLevel}
                                            onClick={() => { onLearnSkill(selectedSkill.id); setSelectedSkill(null); }}
                                        >
                                            {selectedSkill.unlockLevel > playerLevel ? `Bloqueado (Nivel ${selectedSkill.unlockLevel})` : '✅ Aprender'}
                                        </Button>
                                    )}
                                    {learnedSkills.includes(selectedSkill.id) && (
                                        <Button
                                            className={`${skillPoints > 0 && (skillLevels[selectedSkill.id] || 1) < (selectedSkill.maxLevel || 5) ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                                            disabled={skillPoints <= 0 || (skillLevels[selectedSkill.id] || 1) >= (selectedSkill.maxLevel || 5)}
                                            onClick={() => onUpgradeSkill(selectedSkill.id)}
                                        >
                                            <GiUpgrade className="w-4 h-4 mr-2" />
                                            Mejorar
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
