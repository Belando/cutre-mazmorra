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
  // ============ WARRIOR BASE SKILLS (Coste bajo: 3-8 MP) ============
  power_strike: {
    id: 'power_strike',
    name: 'Golpe Poderoso',
    description: 'Inflige 150% + (25% x nivel) de daño',
    icon: '⚔️',
    cooldown: 3,
    manaCost: 3, // NUEVO: Coste bajo
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
    manaCost: 4, // NUEVO: Coste bajo
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
    manaCost: 8, // Mantenido (es AoE, un poco más caro)
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
    manaCost: 5, // NUEVO
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

  // ============ KNIGHT SKILLS (Coste bajo-medio: 5-6 MP) ============
  iron_fortress: {
    id: 'iron_fortress',
    name: 'Fortaleza de Hierro',
    description: 'Reduce daño 70% por 4 turnos',
    icon: '🏰',
    cooldown: 15,
    manaCost: 6, // NUEVO
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
    manaCost: 5, // NUEVO
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

  // ============ BERSERKER SKILLS (Coste bajo-medio: 5-6 MP) ============
  blood_rage: {
    id: 'blood_rage',
    name: 'Furia Sangrienta',
    description: '+100% daño, -30% defensa por 6 turnos',
    icon: '🩸',
    cooldown: 12,
    manaCost: 6, // NUEVO
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
    manaCost: 5, // NUEVO
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

  // ============ MAGE SKILLS (Coste alto: 6-25 MP) ============
  heal: {
    id: 'heal',
    name: 'Curación',
    description: 'Restaura 30% + (5% x nivel) de vida máxima',
    icon: '💚',
    cooldown: 7,
    manaCost: 8, // NUEVO: Coste medio-alto
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
    manaCost: 10, // NUEVO
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

  // ============ ARCANE/DRUID SKILLS (Coste muy alto) ============
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
    manaCost: 15, // NUEVO
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
  rejuvenation: {
    id: 'rejuvenation',
    name: 'Rejuvenecimiento',
    description: 'Cura 10% HP por turno durante 5 turnos',
    icon: '🌸',
    cooldown: 12,
    manaCost: 12, // NUEVO
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

  // ============ ROGUE SKILLS (Coste medio: 4-8 MP) ============
  backstab: {
    id: 'backstab',
    name: 'Puñalada Trasera',
    description: '250% daño a enemigos aturdidos/lentos',
    icon: '🗡️',
    cooldown: 4,
    manaCost: 5, // NUEVO
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
    manaCost: 8, // NUEVO
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
    manaCost: 6, // NUEVO
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

  // ============ ASSASSIN/ARCHER SKILLS (Coste medio-alto) ============
  death_mark: {
    id: 'death_mark',
    name: 'Marca de Muerte',
    description: 'Todo daño al objetivo x2',
    icon: '💀',
    cooldown: 15,
    manaCost: 8, // NUEVO
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
    manaCost: 8, // NUEVO
    type: 'melee',
    tree: 'assassin',
    unlockLevel: 12,
    maxLevel: 5,
    effect: (player, target, playerStats, skillLevel = 1) => {
      const damage = Math.floor(playerStats.attack * (2 + skillLevel * 0.3));
      return { damage, teleportBehind: true, message: `¡Paso Sombrío! ${damage}!` };
    }
  },
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