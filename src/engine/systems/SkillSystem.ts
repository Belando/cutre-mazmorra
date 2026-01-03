// Enhanced Skill System with Class Evolution
import { CLASS_EVOLUTIONS, SKILL_TREES, SKILLS, Skill } from '@/data/skills';
import { hasLineOfSight } from '@/engine/core/utils';
import { Entity, Stats, SkillState, Buff, Player } from '@/types';

// Initialize skills state
export function initializeSkills(playerClass: string = 'warrior'): SkillState {
    const startingSkills: Record<string, string[]> = {
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
export function canEvolve(playerLevel: number, skills: SkillState): boolean {
    return playerLevel >= 10 && !skills.evolvedClass;
}

// Get evolution options for base class
export function getEvolutionOptions(baseClass: string): string[] {
    return CLASS_EVOLUTIONS[baseClass] || [];
}

export interface SkillActionResult {
    success: boolean;
    message: string;
    damages?: any[];
    effects?: any[];
    heal?: number;
    buff?: Buff;
    cooldown?: number;
}

export interface LearnSkillResult {
    success: boolean;
    message: string;
}

// Evolve player class
export function evolveClass(skills: SkillState, newClass: string): LearnSkillResult {
    const baseClass = skills.class || 'warrior';
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
export function getClassSkills(playerClass: string, evolvedClass: string | null = null): Skill[] {
    const trees = [playerClass];
    if (evolvedClass) trees.push(evolvedClass);
    return Object.values(SKILLS).filter(skill => trees.includes(skill.tree));
}

// Get skill level
export function getSkillLevel(skills: SkillState, skillId: string): number {
    return skills.skillLevels?.[skillId] || 1;
}

// Upgrade skill with skill points
export function upgradeSkill(skills: SkillState, skillId: string): LearnSkillResult {
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
export function getUnlockedSkills(playerLevel: number, learnedSkills: string[], playerClass: string | null = null): Skill[] {
    return learnedSkills
        .filter(skillId => SKILLS[skillId] && SKILLS[skillId].unlockLevel <= playerLevel)
        .map(skillId => SKILLS[skillId]);
}

// Get skills that can be learned at level up
export function getLearnableSkills(playerLevel: number, playerClass: string, learnedSkills: string[], evolvedClass: string | null = null): Skill[] {
    const trees = [playerClass];
    if (evolvedClass) trees.push(evolvedClass);

    return Object.values(SKILLS).filter(skill =>
        skill.unlockLevel === playerLevel &&
        trees.includes(skill.tree) &&
        !learnedSkills.includes(skill.id)
    );
}

// Check if skill can be used
export function canUseSkill(skillId: string, cooldowns: Record<string, number>): boolean {
    return !cooldowns[skillId] || cooldowns[skillId] <= 0;
}

// Learn new skill
export function learnSkill(skills: SkillState, skillId: string): LearnSkillResult {
    if (!skills.learned.includes(skillId) && SKILLS[skillId]) {
        skills.learned.push(skillId);
        skills.skillLevels = skills.skillLevels || {};
        skills.skillLevels[skillId] = 1;
        return { success: true, message: `¡Aprendiste ${SKILLS[skillId].name}!` };
    }
    return { success: false, message: 'Habilidad ya aprendida o inválida' };
}

// Calculate effective stats (cooldown reduction based on level)
export function getSkillEffectiveStats(skill: Skill, level: number): { cooldown: number, manaCost: number } {
    if (!skill) return { cooldown: 0, manaCost: 0 };

    // 1. Enfriamiento: Se reduce 1 turno cada 3 niveles (ej. lv1->0 red, lv4->1 red)
    // Se puede personalizar en cada skill con la propiedad 'cooldownScale' (aunque no definida en Skill interface, asumimos default 3)
    const scaleFactor = 3;
    const reduction = Math.floor((level - 1) / scaleFactor);
    const cooldown = Math.max(1, (skill.cooldown || 0) - reduction);

    // 2. Maná: Por ahora fijo, pero aquí podríamos hacer que suba con el nivel
    const manaCost = skill.manaCost || 0;

    return { cooldown, manaCost };
}

// --- ACTUALIZADO: useSkill usa stats calculados ---
export function useSkill(skillId: string, player: Entity, playerStats: Stats, target: Entity | null, enemies: Entity[], visible: boolean[][], map: number[][]): SkillActionResult {
    const skill = SKILLS[skillId];
    if (!skill) return { success: false, message: 'Habilidad desconocida' };

    const skillLevel = (player as Player).skills?.skillLevels?.[skillId] || 1;
    const { cooldown } = getSkillEffectiveStats(skill, skillLevel);

    const result: SkillActionResult = {
        success: true,
        damages: [],
        effects: [],
        message: '',
    };

    if (skill.type === 'self') {
        const effect = skill.effect(player, null, playerStats, skillLevel);
        result.message = effect.message;
        if (effect.heal && player.hp !== undefined && player.maxHp !== undefined) result.heal = Math.min(effect.heal, player.maxHp - player.hp);
        if (effect.buff) result.buff = effect.buff;
    } else if (skill.type === 'melee') {
        if (!target) return { success: false, message: '¡Sin objetivo!' };
        const effect = skill.effect(player, target, playerStats, skillLevel);
        result.message = effect.message;
        result.damages?.push({ target, damage: effect.damage, stun: effect.stun, slow: effect.slow, poison: (effect as any).poison, mark: effect.mark, isCrit: effect.isCrit });
        if (effect.heal) result.heal = effect.heal;
    } else if (skill.type === 'aoe') {
        const adjacent = enemies.filter(e => Math.abs(e.x - player.x) <= 1 && Math.abs(e.y - player.y) <= 1);
        if (adjacent.length === 0) return { success: false, message: '¡Sin enemigos cerca!' };
        const effect = skill.effect(player, adjacent, playerStats, skillLevel);
        result.message = effect.message;
        adjacent.forEach(enemy => result.damages?.push({ target: enemy, damage: effect.damage, stun: effect.stun }));
    } else if (skill.type === 'ranged') {
        if (!target) return { success: false, message: '¡Sin objetivo!' };
        const dist = Math.abs(target.x - player.x) + Math.abs(target.y - player.y);
        // --- NUEVO: VALIDACIÓN DE LÍNEA DE VISIÓN ---
        if (map && !hasLineOfSight(map, player.x, player.y, target.x, target.y)) {
            return { success: false, message: '¡Sin línea de visión!' };
        }
        if (skill.range && dist > skill.range) return { success: false, message: '¡Muy lejos!' };
        const effect = skill.effect(player, target, playerStats, skillLevel);
        result.message = effect.message;
        result.damages?.push({ target, damage: effect.damage, slow: effect.slow, bleed: effect.bleed });
    } else if (skill.type === 'ultimate') {
        const visibleEnemies = enemies.filter(e => visible[e.y]?.[e.x]);
        if (visibleEnemies.length === 0) return { success: false, message: '¡Sin enemigos visibles!' };
        const effect = skill.effect(player, visibleEnemies, playerStats, skillLevel);
        result.message = effect.message;
        visibleEnemies.forEach(enemy => result.damages?.push({ target: enemy, damage: effect.damage }));
    }

    // APLICAMOS EL COOLDOWN CALCULADO
    result.cooldown = cooldown;
    return result;
}

// Update cooldowns
export function updateCooldowns(cooldowns: Record<string, number>): Record<string, number> {
    const updated = { ...cooldowns };
    for (const skillId in updated) {
        if (updated[skillId] > 0) updated[skillId]--;
    }
    return updated;
}

// Update buffs
export function updateBuffs(buffs: Buff[]): Buff[] {
    return buffs.map(buff => ({ ...buff, duration: (buff.duration || 1) - 1 })).filter(buff => (buff.duration || 0) > 0);
}

export interface BuffBonuses {
    attackBonus: number;
    defenseBonus: number;
    magicAttackBonus: number;
    critChance: number;
    isInvisible: boolean;
    evasionBonus: number;
    absorbPercent: number;
}

// Calculate buff bonuses
export function calculateBuffBonuses(buffs: Buff[], playerStats: Stats): BuffBonuses {
    let attackBonus = 0, defenseBonus = 0, magicAttackBonus = 0, critChance = 0, isInvisible = false, evasionBonus = 0, absorbPercent = 0;

    buffs.forEach(buff => {
        if (buff.stats?.attack) attackBonus += Math.floor((playerStats.attack || 0) * buff.stats.attack);
        if ((buff as any).attack) attackBonus += Math.floor((playerStats.attack || 0) * (buff as any).attack); // Legacy support logic

        if (buff.stats?.defense) defenseBonus += Math.floor((playerStats.defense || 0) * buff.stats.defense);
        if ((buff as any).defense) defenseBonus += Math.floor((playerStats.defense || 0) * (buff as any).defense);

        if (buff.stats?.magicAttack) magicAttackBonus += Math.floor((playerStats.magicAttack || 0) * buff.stats.magicAttack);
        if (buff.stats?.critChance) critChance += buff.stats.critChance;

        if (buff.invisible) isInvisible = true;
        if (buff.evasion) evasionBonus += buff.evasion;
        if ((buff as any).absorb) absorbPercent += (buff as any).absorb;
    });

    return { attackBonus, defenseBonus, magicAttackBonus, critChance, isInvisible, evasionBonus, absorbPercent };
}
