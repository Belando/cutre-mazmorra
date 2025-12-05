// Enhanced Skill System with Class Evolution
import { BASE_CLASSES, CLASS_EVOLUTIONS, SKILL_TREES, SKILLS } from '@/data/skills';

// Actualizamos initializeSkills para que no se rompa nada
export function initializeSkills(playerClass = 'warrior') {
  const startingSkills = {
    warrior: ['power_strike', 'shield_bash'],
    mage: ['heal', 'fireball'],
    rogue: ['backstab', 'smoke_bomb'],
  };
  
  return {
    class: playerClass,
    evolvedClass: null,
    learned: [...(startingSkills[playerClass] || ['power_strike', 'heal'])],
    skillLevels: {}, 
    skillPoints: 0,
    cooldowns: {},
    buffs: [],
  };
}

// Check if player can evolve
export function canEvolve(playerLevel, skills) {
  return playerLevel >= 10 && !skills.evolvedClass;
}

// Get evolution options for base class
export function getEvolutionOptions(baseClass) {
  return CLASS_EVOLUTIONS[baseClass] || [];
}

// Evolve player class
export function evolveClass(skills, newClass) {
  const baseClass = skills.class;
  if (!CLASS_EVOLUTIONS[baseClass]?.includes(newClass)) {
    return { success: false, message: 'Evolución no válida' };
  }
  
  skills.evolvedClass = newClass;
  
  // Learn first evolution skill
  const evolutionSkills = Object.values(SKILLS).filter(s => s.tree === newClass && s.unlockLevel === 10);
  evolutionSkills.forEach(s => {
    if (!skills.learned.includes(s.id)) {
      skills.learned.push(s.id);
    }
  });
  
  return { success: true, message: `¡Evolucionaste a ${SKILL_TREES[newClass].name}!` };
}

// Get all skills for a class (including base class if evolved)
export function getClassSkills(playerClass, evolvedClass = null) {
  const trees = [playerClass];
  if (evolvedClass) trees.push(evolvedClass);
  return Object.values(SKILLS).filter(skill => trees.includes(skill.tree));
}

// Get skill level
export function getSkillLevel(skills, skillId) {
  return skills.skillLevels?.[skillId] || 1;
}

// Upgrade skill with skill points
export function upgradeSkill(skills, skillId) {
  const skill = SKILLS[skillId];
  if (!skill) return { success: false, message: 'Habilidad no encontrada' };
  if (!skills.learned.includes(skillId)) return { success: false, message: 'Habilidad no aprendida' };
  if (skills.skillPoints <= 0) return { success: false, message: 'Sin puntos de habilidad' };
  const currentLevel = skills.skillLevels?.[skillId] || 1;
  if (currentLevel >= (skill.maxLevel || 5)) return { success: false, message: 'Nivel máximo alcanzado' };
  skills.skillPoints--;
  skills.skillLevels = skills.skillLevels || {};
  skills.skillLevels[skillId] = currentLevel + 1;
  return { success: true, message: `${skill.name} subió a nivel ${currentLevel + 1}!` };
}

// Get unlocked skills
export function getUnlockedSkills(playerLevel, learnedSkills, playerClass = null) {
  return learnedSkills
    .filter(skillId => SKILLS[skillId] && SKILLS[skillId].unlockLevel <= playerLevel)
    .map(skillId => SKILLS[skillId]);
}

// Get skills that can be learned at level up
export function getLearnableSkills(playerLevel, playerClass, learnedSkills, evolvedClass = null) {
  const trees = [playerClass];
  if (evolvedClass) trees.push(evolvedClass);
  
  return Object.values(SKILLS).filter(skill => 
    skill.unlockLevel === playerLevel &&
    trees.includes(skill.tree) &&
    !learnedSkills.includes(skill.id)
  );
}

// Check if skill can be used
export function canUseSkill(skillId, cooldowns) {
  return !cooldowns[skillId] || cooldowns[skillId] <= 0;
}

// --- ACTUALIZADO: useSkill usa stats calculados ---
export function useSkill(skillId, player, playerStats, target, enemies, visible) {
  const skill = SKILLS[skillId];
  if (!skill) return { success: false, message: 'Habilidad desconocida' };
  
  const skillLevel = player.skills?.skillLevels?.[skillId] || 1;
  
  // USAMOS LA FUNCIÓN DE ESCALADO
  const { cooldown } = getSkillEffectiveStats(skill, skillLevel);
  
  const result = {
    success: true,
    damages: [],
    effects: [],
    message: '',
  };
  
  if (skill.type === 'self') {
    const effect = skill.effect(player, null, playerStats, skillLevel);
    result.message = effect.message;
    if (effect.heal) result.heal = Math.min(effect.heal, player.maxHp - player.hp);
    if (effect.buff) result.buff = effect.buff;
  } else if (skill.type === 'melee') {
    if (!target) return { success: false, message: '¡Sin objetivo!' };
    const effect = skill.effect(player, target, playerStats, skillLevel);
    result.message = effect.message;
    result.damages.push({ target, damage: effect.damage, stun: effect.stun, slow: effect.slow, poison: effect.poison, mark: effect.mark });
    if (effect.heal) result.heal = effect.heal;
  } else if (skill.type === 'aoe') {
    const adjacent = enemies.filter(e => Math.abs(e.x - player.x) <= 1 && Math.abs(e.y - player.y) <= 1);
    if (adjacent.length === 0) return { success: false, message: '¡Sin enemigos cerca!' };
    const effect = skill.effect(player, adjacent, playerStats, skillLevel);
    result.message = effect.message;
    adjacent.forEach(enemy => result.damages.push({ target: enemy, damage: effect.damage, stun: effect.stun }));
  } else if (skill.type === 'ranged') {
    if (!target) return { success: false, message: '¡Sin objetivo!' };
    const dist = Math.abs(target.x - player.x) + Math.abs(target.y - player.y);
    if (dist > skill.range) return { success: false, message: '¡Muy lejos!' };
    const effect = skill.effect(player, target, playerStats, skillLevel);
    result.message = effect.message;
    result.damages.push({ target, damage: effect.damage, slow: effect.slow, bleed: effect.bleed });
  } else if (skill.type === 'ultimate') {
    const visibleEnemies = enemies.filter(e => visible[e.y]?.[e.x]);
    if (visibleEnemies.length === 0) return { success: false, message: '¡Sin enemigos visibles!' };
    const effect = skill.effect(player, visibleEnemies, playerStats, skillLevel);
    result.message = effect.message;
    visibleEnemies.forEach(enemy => result.damages.push({ target: enemy, damage: effect.damage }));
  }
  
  // APLICAMOS EL COOLDOWN CALCULADO
  result.cooldown = cooldown;
  return result;
}

// Update cooldowns
export function updateCooldowns(cooldowns) {
  const updated = { ...cooldowns };
  for (const skillId in updated) {
    if (updated[skillId] > 0) updated[skillId]--;
  }
  return updated;
}

// Update buffs
export function updateBuffs(buffs) {
  return buffs.map(buff => ({ ...buff, duration: buff.duration - 1 })).filter(buff => buff.duration > 0);
}

// Calculate buff bonuses
export function calculateBuffBonuses(buffs, playerStats) {
  let attackBonus = 0, defenseBonus = 0, isInvisible = false, evasionBonus = 0, absorbPercent = 0;
  
  buffs.forEach(buff => {
    if (buff.attack) attackBonus += Math.floor(playerStats.attack * buff.attack);
    if (buff.defense) defenseBonus += Math.floor(playerStats.defense * buff.defense);
    if (buff.invisible) isInvisible = true;
    if (buff.evasion) evasionBonus += buff.evasion;
    if (buff.absorb) absorbPercent += buff.absorb;
  });
  
  return { attackBonus, defenseBonus, isInvisible, evasionBonus, absorbPercent };
}

// Learn new skill
export function learnSkill(skills, skillId) {
  if (!skills.learned.includes(skillId) && SKILLS[skillId]) {
    skills.learned.push(skillId);
    skills.skillLevels = skills.skillLevels || {};
    skills.skillLevels[skillId] = 1;
    return { success: true, message: `¡Aprendiste ${SKILLS[skillId].name}!` };
  }
  return { success: false, message: 'Habilidad ya aprendida o inválida' };
}

// --- NUEVO: Calcular estadísticas efectivas según el nivel ---
export function getSkillEffectiveStats(skill, level) {
  if (!skill) return { cooldown: 0, manaCost: 0 };

  // 1. Enfriamiento: Se reduce 1 turno cada 3 niveles (ej. lv1->0 red, lv4->1 red)
  // Se puede personalizar en cada skill con la propiedad 'cooldownScale'
  const scaleFactor = skill.cooldownScale || 3; 
  const reduction = Math.floor((level - 1) / scaleFactor);
  const cooldown = Math.max(1, (skill.cooldown || 0) - reduction);

  // 2. Maná: Por ahora fijo, pero aquí podríamos hacer que suba con el nivel
  const manaCost = skill.manaCost || 0;

  return { cooldown, manaCost };
}