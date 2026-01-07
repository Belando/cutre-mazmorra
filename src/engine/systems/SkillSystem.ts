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
        return { success: false, message: 'EVOLUTION_INVALID' };
    }

    skills.evolvedClass = newClass;

    // Learn first evolution skill
    const evolutionSkills = Object.values(SKILLS).filter(s => s.tree === newClass && s.unlockLevel === 10);
    evolutionSkills.forEach(s => {
        if (!skills.learned.includes(s.id)) {
            skills.learned.push(s.id);
        }
    });

    return { success: true, message: `EVOLVED:${SKILL_TREES[newClass].name}` };
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
    if (!skill) return { success: false, message: 'SKILL_NOT_FOUND' };
    if (!skills.learned.includes(skillId)) return { success: false, message: 'SKILL_NOT_LEARNED' };
    if (skills.skillPoints <= 0) return { success: false, message: 'NO_SKILL_POINTS' };
    const currentLevel = skills.skillLevels?.[skillId] || 1;
    if (currentLevel >= (skill.maxLevel || 5)) return { success: false, message: 'MAX_LEVEL_REACHED' };
    skills.skillPoints--;
    skills.skillLevels = skills.skillLevels || {};
    skills.skillLevels[skillId] = currentLevel + 1;
    return { success: true, message: `SKILL_IMPROVED:${skill.name}:${currentLevel + 1}` };
}

// Get unlocked skills
export function getUnlockedSkills(playerLevel: number, learnedSkills: string[]): Skill[] {
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
        return { success: true, message: `LEARNED:${SKILLS[skillId].name}` };
    }
    return { success: false, message: 'ALREADY_LEARNED' };
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
// --- REFACTORED SKILL EXECUTION HELPER FUNCTIONS ---

function executeSelfSkill(skill: Skill, player: Entity, playerStats: Stats, level: number): SkillActionResult {
    const result: SkillActionResult = { success: true, message: '', damages: [], effects: [] };
    const effect = skill.effect(player, null, playerStats, level);
    result.message = effect.message;
    if (effect.heal && player.hp !== undefined && player.maxHp !== undefined) {
        result.heal = Math.min(effect.heal, player.maxHp - player.hp);
    }
    if (effect.buff) result.buff = effect.buff;
    return result;
}

function executeMeleeSkill(skill: Skill, player: Entity, target: Entity | null, playerStats: Stats, level: number): SkillActionResult {
    if (!target) return { success: false, message: 'NO_TARGET' };

    // Validate range for melee (typically 1 or weapon range, but simple check here)
    const dist = Math.abs(target.x - player.x) + Math.abs(target.y - player.y);
    if (dist > (skill.range || 1)) return { success: false, message: 'TOO_FAR' };

    const result: SkillActionResult = { success: true, message: '', damages: [], effects: [] };
    const effect = skill.effect(player, target, playerStats, level);
    result.message = effect.message;
    result.damages?.push({
        target,
        damage: effect.damage,
        stun: effect.stun,
        slow: effect.slow,
        poison: (effect as any).poison,
        mark: effect.mark,
        isCritical: effect.isCritical
    });
    if (effect.heal) result.heal = effect.heal;
    return result;
}

function executeAoeSkill(skill: Skill, player: Entity, enemies: Entity[], playerStats: Stats, level: number): SkillActionResult {
    // Simple adjacent AoE
    const adjacent = enemies.filter(e => Math.abs(e.x - player.x) <= 1 && Math.abs(e.y - player.y) <= 1);
    if (adjacent.length === 0) return { success: false, message: 'NO_ENEMIES_NEAR' };

    const result: SkillActionResult = { success: true, message: '', damages: [], effects: [] };
    const effect = skill.effect(player, adjacent, playerStats, level);
    result.message = effect.message;
    adjacent.forEach(enemy => {
        result.damages?.push({ target: enemy, damage: effect.damage, stun: effect.stun });
    });
    return result;
}

function executeRangedSkill(skill: Skill, player: Entity, target: Entity | null, playerStats: Stats, level: number, map: number[][]): SkillActionResult {
    if (!target) return { success: false, message: '¡Sin objetivo!' };

    const dist = Math.abs(target.x - player.x) + Math.abs(target.y - player.y);

    if (map && !hasLineOfSight(map, player.x, player.y, target.x, target.y)) {
        return { success: false, message: 'NO_LOS' };
    }
    if (skill.range && dist > skill.range) return { success: false, message: 'TOO_FAR' };

    const result: SkillActionResult = { success: true, message: '', damages: [], effects: [] };
    const effect = skill.effect(player, target, playerStats, level);
    result.message = effect.message;
    result.damages?.push({ target, damage: effect.damage, slow: effect.slow, bleed: effect.bleed });
    return result;
}

function executeUltimateSkill(skill: Skill, player: Entity, enemies: Entity[], visible: boolean[][], playerStats: Stats, level: number): SkillActionResult {
    const visibleEnemies = enemies.filter(e => visible[e.y]?.[e.x]);
    if (visibleEnemies.length === 0) return { success: false, message: 'NO_VISIBLE_ENEMIES' };

    const result: SkillActionResult = { success: true, message: '', damages: [], effects: [] };
    const effect = skill.effect(player, visibleEnemies, playerStats, level);
    result.message = effect.message;
    visibleEnemies.forEach(enemy => {
        result.damages?.push({ target: enemy, damage: effect.damage });
    });
    return result;
}

// --- ACTUALIZADO: useSkill usa stats calculados ---
export function useSkill(skillId: string, player: Entity, playerStats: Stats, target: Entity | null, enemies: Entity[], visible: boolean[][], map: number[][]): SkillActionResult {
    const skill = SKILLS[skillId];
    if (!skill) return { success: false, message: 'Habilidad desconocida' };

    const skillLevel = (player as Player).skills?.skillLevels?.[skillId] || 1;
    const { cooldown } = getSkillEffectiveStats(skill, skillLevel);

    let result: SkillActionResult = { success: false, message: 'FAILURE' };

    switch (skill.type) {
        case 'self':
            result = executeSelfSkill(skill, player, playerStats, skillLevel);
            break;
        case 'melee':
            result = executeMeleeSkill(skill, player, target, playerStats, skillLevel);
            break;
        case 'aoe':
            result = executeAoeSkill(skill, player, enemies, playerStats, skillLevel);
            break;
        case 'ranged':
            result = executeRangedSkill(skill, player, target, playerStats, skillLevel, map);
            break;
        case 'ultimate':
            result = executeUltimateSkill(skill, player, enemies, visible, playerStats, skillLevel);
            break;
        default:
            result = { success: false, message: 'Tipo de habilidad no soportado' };
    }

    // APLICAMOS EL COOLDOWN CALCULADO SI HUBO ÉXITO
    if (result.success) {
        result.cooldown = cooldown;
    }
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

        // Systemic Tags from Buffs (e.g. 'Wet' buff gives 'WET' tag)
        // This logic needs to be handled where tags are aggregated, usually in getEntityTags.
        // For now, we leave this purely for stats.
    });

    return { attackBonus, defenseBonus, magicAttackBonus, critChance, isInvisible, evasionBonus, absorbPercent };
}
