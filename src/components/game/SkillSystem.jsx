// Enhanced Skill System with Class Evolution

export const BASE_CLASSES = ['warrior', 'mage', 'rogue'];

export const CLASS_EVOLUTIONS = {
  warrior: ['knight', 'berserker'],
  mage: ['arcane', 'druid'],
  rogue: ['assassin', 'archer'],
};

export const SKILL_TREES = {
  // Base classes
  warrior: { name: 'Guerrero', color: '#ef4444', icon: '⚔️', description: 'Maestro del combate cuerpo a cuerpo' },
  mage: { name: 'Mago', color: '#3b82f6', icon: '✨', description: 'Dominador de las artes arcanas' },
  rogue: { name: 'Pícaro', color: '#22c55e', icon: '🗡️', description: 'Asesino sigiloso y letal' },
  // Evolved classes
  knight: { name: 'Caballero', color: '#64748b', icon: '🛡️', description: 'Defensor imparable con armadura pesada', evolvesFrom: 'warrior' },
  berserker: { name: 'Berserker', color: '#dc2626', icon: '🪓', description: 'Furia desatada, daño brutal', evolvesFrom: 'warrior' },
  arcane: { name: 'Arcano', color: '#8b5cf6', icon: '🔮', description: 'Maestro de la magia destructiva', evolvesFrom: 'mage' },
  druid: { name: 'Druida', color: '#22c55e', icon: '🌿', description: 'Curador y protector de la naturaleza', evolvesFrom: 'mage' },
  assassin: { name: 'Asesino', color: '#1e1e1e', icon: '☠️', description: 'Muerte silenciosa desde las sombras', evolvesFrom: 'rogue' },
  archer: { name: 'Arquero', color: '#f59e0b', icon: '🏹', description: 'Maestro del combate a distancia', evolvesFrom: 'rogue' },
};

export const SKILLS = {
  // ============ WARRIOR BASE SKILLS ============
  power_strike: {
    id: 'power_strike',
    name: 'Golpe Poderoso',
    description: 'Inflige 150% + (25% x nivel) de daño',
    icon: '⚔️',
    cooldown: 3,
    type: 'melee',
    tree: 'warrior',
    unlockLevel: 1,
    maxLevel: 5,
    effect: (player, target, playerStats, skillLevel = 1) => {
      const multiplier = 1.5 + (skillLevel * 0.25);
      const damage = Math.floor(playerStats.attack * multiplier);
      return { damage, message: `¡Golpe Poderoso Nv.${skillLevel} inflige ${damage}!` };
    }
  },
  shield_bash: {
    id: 'shield_bash',
    name: 'Golpe de Escudo',
    description: 'Aturde 2 turnos e inflige 75% daño',
    icon: '🛡️',
    cooldown: 5,
    type: 'melee',
    tree: 'warrior',
    unlockLevel: 1,
    maxLevel: 5,
    effect: (player, target, playerStats, skillLevel = 1) => {
      const damage = Math.floor(playerStats.attack * (0.75 + skillLevel * 0.1));
      return { damage, stun: 2 + Math.floor(skillLevel / 3), message: `¡Golpe de Escudo aturde e inflige ${damage}!` };
    }
  },
  whirlwind: {
    id: 'whirlwind',
    name: 'Torbellino',
    description: 'Ataca a todos los enemigos adyacentes',
    icon: '🌀',
    cooldown: 6,
    manaCost: 8,
    type: 'aoe',
    tree: 'warrior',
    unlockLevel: 3,
    maxLevel: 5,
    effect: (player, targets, playerStats, skillLevel = 1) => {
      const damage = Math.floor(playerStats.attack * (1 + skillLevel * 0.15));
      return { damage, hitAll: true, message: `¡Torbellino golpea a todos por ${damage}!` };
    }
  },
  war_cry: {
    id: 'war_cry',
    name: 'Grito de Guerra',
    description: '+50% ataque y defensa por 5 turnos',
    icon: '📯',
    cooldown: 10,
    type: 'self',
    tree: 'warrior',
    unlockLevel: 5,
    maxLevel: 3,
    effect: (player, target, playerStats, skillLevel = 1) => {
      const bonus = 0.5 + skillLevel * 0.1;
      return { 
        buff: { attack: bonus, defense: bonus, duration: 5 + skillLevel }, 
        message: `¡Grito de Guerra Nv.${skillLevel}!` 
      };
    }
  },

  // ============ KNIGHT EVOLUTION SKILLS ============
  iron_fortress: {
    id: 'iron_fortress',
    name: 'Fortaleza de Hierro',
    description: 'Reduce daño 70% por 4 turnos',
    icon: '🏰',
    cooldown: 15,
    type: 'self',
    tree: 'knight',
    unlockLevel: 10,
    maxLevel: 5,
    effect: (player, target, playerStats, skillLevel = 1) => {
      return { 
        buff: { damageReduction: 0.7 + skillLevel * 0.05, duration: 4 + skillLevel }, 
        message: '¡Fortaleza de Hierro activada!' 
      };
    }
  },
  holy_strike: {
    id: 'holy_strike',
    name: 'Golpe Sagrado',
    description: '200% daño + cura 30% del daño',
    icon: '✝️',
    cooldown: 6,
    type: 'melee',
    tree: 'knight',
    unlockLevel: 12,
    maxLevel: 5,
    effect: (player, target, playerStats, skillLevel = 1) => {
      const damage = Math.floor(playerStats.attack * (2 + skillLevel * 0.2));
      const heal = Math.floor(damage * 0.3);
      return { damage, heal, message: `¡Golpe Sagrado! ${damage} daño, +${heal} HP!` };
    }
  },

  // ============ BERSERKER EVOLUTION SKILLS ============
  blood_rage: {
    id: 'blood_rage',
    name: 'Furia Sangrienta',
    description: '+100% daño, -30% defensa por 6 turnos',
    icon: '🩸',
    cooldown: 12,
    type: 'self',
    tree: 'berserker',
    unlockLevel: 10,
    maxLevel: 5,
    effect: (player, target, playerStats, skillLevel = 1) => {
      return { 
        buff: { attack: 1 + skillLevel * 0.2, defense: -0.3, duration: 6 + skillLevel }, 
        message: '¡FURIA SANGRIENTA!' 
      };
    }
  },
  execute: {
    id: 'execute',
    name: 'Ejecución',
    description: '500% daño a enemigos bajo 30% vida',
    icon: '💀',
    cooldown: 8,
    type: 'melee',
    tree: 'berserker',
    unlockLevel: 12,
    maxLevel: 5,
    effect: (player, target, playerStats, skillLevel = 1) => {
      const isLowHp = target.hp / target.maxHp < (0.3 + skillLevel * 0.05);
      const multiplier = isLowHp ? (5 + skillLevel) : 1.5;
      const damage = Math.floor(playerStats.attack * multiplier);
      return { damage, message: isLowHp ? `¡EJECUCIÓN! ${damage}!` : `Ejecución: ${damage}` };
    }
  },

  // ============ MAGE BASE SKILLS ============
  heal: {
    id: 'heal',
    name: 'Curación',
    description: 'Restaura 30% + (5% x nivel) de vida máxima',
    icon: '💚',
    cooldown: 7,
    type: 'self',
    tree: 'mage',
    unlockLevel: 1,
    maxLevel: 5,
    effect: (player, target, playerStats, skillLevel = 1) => {
      const healPercent = 0.30 + skillLevel * 0.05;
      const healAmount = Math.floor(player.maxHp * healPercent);
      return { heal: healAmount, message: `¡Curación Nv.${skillLevel}: +${healAmount} HP!` };
    }
  },
  fireball: {
    id: 'fireball',
    name: 'Bola de Fuego',
    description: '175% daño mágico a distancia (rango 6)',
    icon: '🔥',
    cooldown: 4,
    manaCost: 8,
    type: 'ranged',
    range: 6,
    tree: 'mage',
    unlockLevel: 1,
    maxLevel: 5,
    effect: (player, target, playerStats, skillLevel = 1) => {
      const damage = Math.floor(playerStats.attack * (1.75 + skillLevel * 0.25));
      return { damage, message: `¡Bola de Fuego Nv.${skillLevel}: ${damage}!` };
    }
  },
  ice_shard: {
    id: 'ice_shard',
    name: 'Fragmento de Hielo',
    description: '125% daño + ralentiza',
    icon: '❄️',
    cooldown: 4,
    manaCost: 6,
    type: 'ranged',
    range: 5,
    tree: 'mage',
    unlockLevel: 3,
    maxLevel: 5,
    effect: (player, target, playerStats, skillLevel = 1) => {
      const damage = Math.floor(playerStats.attack * (1.25 + skillLevel * 0.15));
      return { damage, slow: 3 + skillLevel, message: `¡Fragmento de Hielo: ${damage}!` };
    }
  },
  arcane_shield: {
    id: 'arcane_shield',
    name: 'Escudo Arcano',
    description: 'Absorbe 50% del daño',
    icon: '🔮',
    cooldown: 12,
    type: 'self',
    tree: 'mage',
    unlockLevel: 5,
    maxLevel: 3,
    effect: (player, target, playerStats, skillLevel = 1) => {
      return { 
        buff: { absorb: 0.5 + skillLevel * 0.1, duration: 4 + skillLevel }, 
        message: '¡Escudo Arcano!' 
      };
    }
  },

  // ============ ARCANE EVOLUTION SKILLS ============
  meteor: {
    id: 'meteor',
    name: 'Meteoro',
    description: 'Destrucción masiva en área',
    icon: '☄️',
    cooldown: 15,
    manaCost: 25,
    type: 'ultimate',
    tree: 'arcane',
    unlockLevel: 10,
    maxLevel: 5,
    effect: (player, targets, playerStats, skillLevel = 1) => {
      const damage = Math.floor(playerStats.attack * (2.5 + skillLevel * 0.3));
      return { damage, hitAllVisible: true, message: `¡METEORO! ${damage} a todos!` };
    }
  },
  arcane_mastery: {
    id: 'arcane_mastery',
    name: 'Maestría Arcana',
    description: 'Reduce enfriamiento de habilidades',
    icon: '📖',
    cooldown: 20,
    type: 'self',
    tree: 'arcane',
    unlockLevel: 12,
    maxLevel: 3,
    effect: (player, target, playerStats, skillLevel = 1) => {
      return { 
        buff: { cooldownReduction: 0.3 + skillLevel * 0.1, duration: 8 }, 
        message: '¡Maestría Arcana activa!' 
      };
    }
  },

  // ============ DRUID EVOLUTION SKILLS ============
  rejuvenation: {
    id: 'rejuvenation',
    name: 'Rejuvenecimiento',
    description: 'Cura 10% HP por turno durante 5 turnos',
    icon: '🌸',
    cooldown: 12,
    type: 'self',
    tree: 'druid',
    unlockLevel: 10,
    maxLevel: 5,
    effect: (player, target, playerStats, skillLevel = 1) => {
      const healPerTurn = Math.floor(player.maxHp * (0.1 + skillLevel * 0.02));
      return { 
        buff: { regen: healPerTurn, duration: 5 + skillLevel }, 
        message: `¡Rejuvenecimiento! +${healPerTurn}/turno!` 
      };
    }
  },
  natures_wrath: {
    id: 'natures_wrath',
    name: 'Ira de la Naturaleza',
    description: 'Raíces atrapan y dañan enemigos',
    icon: '🌿',
    cooldown: 8,
    manaCost: 15,
    type: 'aoe',
    tree: 'druid',
    unlockLevel: 12,
    maxLevel: 5,
    effect: (player, targets, playerStats, skillLevel = 1) => {
      const damage = Math.floor(playerStats.attack * (1.2 + skillLevel * 0.2));
      return { damage, hitAll: true, stun: 1, message: `¡Ira de la Naturaleza! ${damage} a todos!` };
    }
  },

  // ============ ROGUE BASE SKILLS ============
  backstab: {
    id: 'backstab',
    name: 'Puñalada Trasera',
    description: '250% daño a enemigos aturdidos/lentos',
    icon: '🗡️',
    cooldown: 4,
    type: 'melee',
    tree: 'rogue',
    unlockLevel: 1,
    maxLevel: 5,
    effect: (player, target, playerStats, skillLevel = 1) => {
      const isVulnerable = target.stunned > 0 || target.slowed > 0;
      const multiplier = isVulnerable ? (2.5 + skillLevel * 0.3) : 1.2;
      const damage = Math.floor(playerStats.attack * multiplier);
      return { damage, message: isVulnerable ? `¡Crítico! ${damage}!` : `Puñalada: ${damage}` };
    }
  },
  smoke_bomb: {
    id: 'smoke_bomb',
    name: 'Bomba de Humo',
    description: 'Invisibilidad por 3 turnos',
    icon: '💨',
    cooldown: 10,
    type: 'self',
    tree: 'rogue',
    unlockLevel: 1,
    maxLevel: 3,
    effect: (player, target, playerStats, skillLevel = 1) => {
      return { 
        buff: { invisible: true, duration: 3 + skillLevel }, 
        message: '¡Desapareces!' 
      };
    }
  },
  throwing_knife: {
    id: 'throwing_knife',
    name: 'Cuchillo Arrojadizo',
    description: 'Daño a distancia + sangrado',
    icon: '🔪',
    cooldown: 3,
    manaCost: 4,
    type: 'ranged',
    range: 4,
    tree: 'rogue',
    unlockLevel: 3,
    maxLevel: 5,
    effect: (player, target, playerStats, skillLevel = 1) => {
      const damage = Math.floor(playerStats.attack * (1 + skillLevel * 0.1));
      return { damage, bleed: { damage: Math.floor(damage * 0.2), duration: 3 }, message: `¡Cuchillo! ${damage} + sangrado!` };
    }
  },
  quick_step: {
    id: 'quick_step',
    name: 'Paso Rápido',
    description: '+100% evasión por 3 turnos',
    icon: '💫',
    cooldown: 8,
    type: 'self',
    tree: 'rogue',
    unlockLevel: 5,
    maxLevel: 3,
    effect: (player, target, playerStats, skillLevel = 1) => {
      return { 
        buff: { evasion: 1 + skillLevel * 0.2, duration: 3 + skillLevel }, 
        message: '¡Evasión máxima!' 
      };
    }
  },

  // ============ ASSASSIN EVOLUTION SKILLS ============
  death_mark: {
    id: 'death_mark',
    name: 'Marca de Muerte',
    description: 'Todo daño al objetivo x2',
    icon: '💀',
    cooldown: 15,
    type: 'melee',
    tree: 'assassin',
    unlockLevel: 10,
    maxLevel: 3,
    effect: (player, target, playerStats, skillLevel = 1) => {
      const damage = Math.floor(playerStats.attack * 0.5);
      return { 
        damage,
        mark: { multiplier: 2 + skillLevel * 0.5, duration: 5 + skillLevel },
        message: '¡Marca de Muerte!' 
      };
    }
  },
  shadow_step: {
    id: 'shadow_step',
    name: 'Paso Sombrío',
    description: 'Teletransporte + 200% daño',
    icon: '👤',
    cooldown: 10,
    type: 'melee',
    tree: 'assassin',
    unlockLevel: 12,
    maxLevel: 5,
    effect: (player, target, playerStats, skillLevel = 1) => {
      const damage = Math.floor(playerStats.attack * (2 + skillLevel * 0.3));
      return { damage, teleportBehind: true, message: `¡Paso Sombrío! ${damage}!` };
    }
  },

  // ============ ARCHER EVOLUTION SKILLS ============
  multishot: {
    id: 'multishot',
    name: 'Disparo Múltiple',
    description: 'Dispara a 3 enemigos a la vez',
    icon: '🏹',
    cooldown: 6,
    manaCost: 10,
    type: 'ranged',
    range: 7,
    tree: 'archer',
    unlockLevel: 10,
    maxLevel: 5,
    effect: (player, target, playerStats, skillLevel = 1) => {
      const damage = Math.floor(playerStats.attack * (1 + skillLevel * 0.15));
      return { damage, multiTarget: 3 + Math.floor(skillLevel / 2), message: `¡Disparo Múltiple! ${damage} x3!` };
    }
  },
  rain_of_arrows: {
    id: 'rain_of_arrows',
    name: 'Lluvia de Flechas',
    description: 'Daño masivo en área',
    icon: '🎯',
    cooldown: 12,
    manaCost: 20,
    type: 'ultimate',
    tree: 'archer',
    unlockLevel: 12,
    maxLevel: 5,
    effect: (player, targets, playerStats, skillLevel = 1) => {
      const damage = Math.floor(playerStats.attack * (1.5 + skillLevel * 0.2));
      return { damage, hitAllVisible: true, message: `¡Lluvia de Flechas! ${damage} a todos!` };
    }
  },
};

// Initialize player skills based on class
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
    skillLevels: {}, // Track individual skill levels
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

// Use a skill
export function useSkill(skillId, player, playerStats, target, enemies, visible) {
  const skill = SKILLS[skillId];
  if (!skill) return { success: false, message: 'Habilidad desconocida' };
  
  const skillLevel = player.skills?.skillLevels?.[skillId] || 1;
  
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
  
  result.cooldown = skill.cooldown;
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