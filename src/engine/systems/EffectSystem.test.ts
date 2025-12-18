import { describe, it, expect, beforeEach } from 'vitest';
import { EffectsManager } from './EffectSystem';

describe('EffectsManager', () => {
    let effectsManager: EffectsManager;

    beforeEach(() => {
        effectsManager = new EffectsManager();
    });

    it('should initialize with no effects', () => {
        expect(effectsManager.effects).toHaveLength(0);
        expect(effectsManager.screenShake).toBe(0);
    });

    it('should add text effect', () => {
        effectsManager.addText(10, 10, 'Test', '#fff');
        expect(effectsManager.effects).toHaveLength(1);
        const effect = effectsManager.effects[0];
        if (effect.type === 'text') {
            expect(effect.text).toBe('Test');
            expect(effect.life).toBe(60);
        } else {
            throw new Error('Effect type mismatch');
        }
    });

    it('should add critical text effect', () => {
        effectsManager.addText(10, 10, 'Crit', '#f00', true);
        const effect = effectsManager.effects[0];
        if (effect.type === 'text') {
            expect(effect.isCritical).toBe(true);
            expect(effect.life).toBe(90);
        }
    });

    it('should add projectile', () => {
        effectsManager.addProjectile(0, 0, 10, 10);
        expect(effectsManager.effects).toHaveLength(1);
        const effect = effectsManager.effects[0];
        expect(effect.type).toBe('projectile');
    });

    it('should move projectile towards target on update', () => {
        effectsManager.addProjectile(0, 0, 10, 0, '#fff', 'arrow');
        const effect = effectsManager.effects[0];
        if (effect.type !== 'projectile') throw new Error('Not a projectile');

        // Initial x is 0.5 (center of 0,0)
        const initialX = effect.x;

        effectsManager.update();

        expect(effect.x).toBeGreaterThan(initialX);
        expect(effect.reached).toBe(false);
    });

    it('should remove expired effects', () => {
        effectsManager.addText(0, 0, 'Fade', '#fff');
        const effect = effectsManager.effects[0];
        effect.life = 1;

        effectsManager.update(); // life becomes 0 and filtered out

        expect(effectsManager.effects).toHaveLength(0);
    });

    it('should handle screen shake', () => {
        effectsManager.addShake(10);
        expect(effectsManager.screenShake).toBe(10);

        effectsManager.update();
        expect(effectsManager.screenShake).toBeLessThan(10);
        // 10 * 0.9 = 9
        expect(effectsManager.screenShake).toBe(9);
    });
});
