import { describe, it, expect, vi } from 'vitest';
import { initializeSkills, canUseSkill, learnSkill, upgradeSkill, useSkill, getSkillEffectiveStats } from './SkillSystem';
import { SKILLS } from '@/data/skills';
import { Entity } from '@/types';

// Mock utils
vi.mock('@/engine/core/utils', () => ({
    hasLineOfSight: () => true
}));

const mockPlayer: Entity = {
    x: 5, y: 5,
    type: 'player',
    id: 'p1',
    level: 5,
    stats: {
        attack: 10,
        defense: 5,
        magicAttack: 20
    },
    skills: initializeSkills('mage'),
    hp: 100,
    maxHp: 100
};

describe('SkillSystem', () => {
    it('should initialize skills correctly', () => {
        const skills = initializeSkills('mage');
        expect(skills.class).toBe('mage');
        expect(skills.learned).toContain('fireball');
        expect(skills.skillLevels['fireball']).toBeUndefined(); // Starts at level 1 implied, or undefined in record means 1?
        // Logic says getSkillLevel returns levels[id] || 1.
    });

    it('should calculate effective stats (cooldown reduction)', () => {
        const skill = SKILLS['fireball'];
        // Level 1: cooldown should be max(1, 4 - 0) = 4
        // (4 - floor(0/3)) = 4
        expect(getSkillEffectiveStats(skill, 1).cooldown).toBe(4);

        // Level 4: cooldown should be max(1, 4 - floor(3/3)) = 3
        expect(getSkillEffectiveStats(skill, 4).cooldown).toBe(3);
    });

    it('should use skill and return correct damage', () => {
        const target: Entity = { x: 5, y: 10, type: 'enemy', id: 'e1' };

        // Fireball: 175% MagicAttack. MagAtk=20 => 35 damage.
        const result = useSkill(
            'fireball',
            mockPlayer,
            mockPlayer.stats!,
            target,
            [],
            [],
            []
        );

        expect(result.success).toBe(true);
        expect(result.damages).toHaveLength(1);
        expect(result.damages![0].damage).toBe(40);
    });

    it('should learn a new skill', () => {
        const skills = initializeSkills('mage');
        // 'ice_shard' is mage skill, unlock level 3.
        // learnSkill checks logic? No, learnSkill just adds it if valid.
        // validation is usually done by UI before calling learn.

        const res = learnSkill(skills, 'ice_shard');
        expect(res.success).toBe(true);
        expect(skills.learned).toContain('ice_shard');
        expect(skills.skillLevels['ice_shard']).toBe(1);
    });

    it('should upgrade a skill', () => {
        const skills = initializeSkills('mage');
        skills.skillPoints = 1;

        const res = upgradeSkill(skills, 'fireball');
        expect(res.success).toBe(true);
        expect(skills.skillLevels['fireball']).toBe(2);
        expect(skills.skillPoints).toBe(0);
    });

    it('should fail upgrade if no points', () => {
        const skills = initializeSkills('mage');
        skills.skillPoints = 0;

        const res = upgradeSkill(skills, 'fireball');
        expect(res.success).toBe(false);
    });
});
