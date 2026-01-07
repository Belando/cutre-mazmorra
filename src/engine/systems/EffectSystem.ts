// src/engine/systems/EffectSystem.ts
import { Point } from '@/types';
// toScreen import removed

export type EffectType = 'text' | 'particle' | 'projectile';

export interface BaseEffect extends Point {
    id: number;
    type: EffectType;
    life: number;
    maxLife?: number;
    color: string;
    [key: string]: any;
}

export interface TextEffect extends BaseEffect {
    type: 'text';
    text: string;
    icon?: string; // NEW: Icon property
    isCritical: boolean;
    isSmall: boolean;
    isSkillHit: boolean;
    vx: number;
    vy: number;
    offsetY: number;
    gravity: number; // Added gravity
}

export interface ParticleEffect extends BaseEffect {
    type: 'particle';
    style: 'star' | 'circle' | 'rect' | 'blood';
    z?: number;
    vx?: number;
    vy?: number;
    vz?: number;
    angle?: number;
    radius?: number;
    orbitalSpeed?: number;
    size: number;
    gravity?: number;
    friction?: number;
    isOrbiting?: boolean;
    bounces?: number;
}

export interface ProjectileEffect extends BaseEffect {
    type: 'projectile';
    targetX: number;
    targetY: number;
    style: 'circle' | 'arrow' | 'fireball' | string;
    speed: number;
    reached: boolean;
    angle?: number;
}

export type Effect = TextEffect | ParticleEffect | ProjectileEffect;

export class EffectsManager {
    effects: Effect[] = [];
    idCounter: number = 0;
    screenShake: number = 0;

    addShake(amount: number) {
        this.screenShake += amount;
    }

    // --- TEXTO FLOTANTE ---
    addText(x: number, y: number, text: string, color: string = '#fff', isCritical: boolean = false, isSmall: boolean = false, isSkillHit: boolean = false, icon?: string): void {
        this.effects.push({
            id: this.idCounter++,
            type: 'text',
            x, y,
            text,
            icon,
            color,
            isCritical,
            isSmall,
            isSkillHit,
            life: isCritical ? 90 : 60,
            maxLife: isCritical ? 90 : 60,
            // Physics: Pop arch
            vx: (Math.random() - 0.5) * (isCritical ? 0.3 : 0.15), // Wider spread
            vy: isCritical ? -0.25 : -0.12, // Higher jump
            gravity: 0.01, // Stronger gravity for "heavy" feel
            offsetY: 0
        });
    }

    // --- EFECTO DE STUN (Estrellas girando) ---
    addStunEffect(x: number, y: number): void {
        const color = '#fbbf24'; // Amarillo dorado
        for (let i = 0; i < 5; i++) {
            this.effects.push({
                id: this.idCounter++,
                type: 'particle',
                style: 'star',
                x: x + 0.5,
                y: y + 0.2,
                z: 0.8,
                angle: (Math.PI * 2 * i) / 5,
                radius: 0.3,
                orbitalSpeed: 0.15,
                vx: 0, vy: 0, vz: 0,
                life: 60, maxLife: 60,
                color: color,
                size: 0.12,
                gravity: 0, friction: 1,
                isOrbiting: true
            });
        }
    }

    // --- NUEVO: AÑADIR PROYECTIL ---
    addProjectile(startX: number, startY: number, targetX: number, targetY: number, color: string = '#fbbf24', style: string = 'circle'): void {
        this.effects.push({
            id: this.idCounter++,
            type: 'projectile',
            x: startX + 0.5,    // Centro de la casilla origen
            y: startY + 0.5,
            targetX: targetX + 0.5, // Centro de la casilla destino
            targetY: targetY + 0.5,
            color,
            style, // 'circle', 'arrow', 'fireball'
            speed: 0.4, // Velocidad de viaje
            life: 30,   // Tiempo de vida de seguridad
            reached: false
        });
    }

    // --- PARTICULAS (Sangre/Explosión/Chispas) ---
    addBlood(x: number, y: number, color: string = '#dc2626'): void {
        const count = 12 + Math.floor(Math.random() * 8); // More particles (12-20)
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 0.15;
            this.effects.push({
                id: this.idCounter++,
                type: 'particle',
                style: 'blood', // Custom style for 2.5D rendering
                x: x + 0.5, y: y + 0.5, z: 0.5 + Math.random() * 0.5,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, vz: 0.1 + Math.random() * 0.2,
                life: 40 + Math.random() * 20, maxLife: 60, color: color,
                size: Math.random() * 0.03 + 0.01, // Reduced max size
                gravity: 0.03, friction: 0.96, bounces: 0
            });
        }
    }

    addExplosion(x: number, y: number, color: string = '#fbbf24'): void {
        const count = 12;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 0.1 + Math.random() * 0.2;
            this.effects.push({
                id: this.idCounter++,
                type: 'particle',
                style: 'circle',
                x: x + 0.5, y: y + 0.5, z: 0.5,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, vz: 0,
                life: 30, maxLife: 30, color: color, size: 0.1 + Math.random() * 0.1,
                gravity: 0, friction: 0.9
            });
        }
    }

    addDebris(x: number, y: number, color: string = '#a16207', count: number = 5): void {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.05 + Math.random() * 0.1;
            this.effects.push({
                id: this.idCounter++,
                type: 'particle',
                style: 'rect', // Chips/Debris
                x: x + 0.5, y: y + 0.5, z: 0.3 + Math.random() * 0.4,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, vz: 0.1 + Math.random() * 0.15,
                life: 40 + Math.random() * 20, maxLife: 60,
                color: color,
                size: 0.05 + Math.random() * 0.05,
                gravity: 0.02, friction: 0.95, bounces: 1
            });
        }
    }

    addSparkles(x: number, y: number, color: string = '#fbbf24'): void {
        for (let i = 0; i < 8; i++) {
            this.effects.push({
                id: this.idCounter++,
                type: 'particle',
                style: 'star',
                x: x + 0.2 + Math.random() * 0.6, y: y + 0.2 + Math.random() * 0.6, z: 0.5 + Math.random() * 0.5,
                vx: 0, vy: 0, vz: 0.02 + Math.random() * 0.03,
                life: 50, maxLife: 50, color: color, size: 0.05 + Math.random() * 0.1,
                gravity: 0, friction: 1
            });
        }
    }

    // --- MOTOR DE FÍSICA ---
    update(): void {
        if (this.screenShake > 0) {
            this.screenShake *= 0.85; // Faster fade out
            if (this.screenShake < 0.5) this.screenShake = 0;
        }

        this.effects.forEach(effect => {
            // --- LÓGICA PROYECTILES ---
            if (effect.type === 'projectile') {
                const p = effect as ProjectileEffect;
                const dx = p.targetX - p.x;
                const dy = p.targetY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < p.speed) {
                    // Llegó al destino: forzamos posición final y matamos efecto
                    p.x = p.targetX;
                    p.y = p.targetY;
                    p.reached = true;
                    p.life = 0;
                    // Opcional: Generar chispas al impactar
                    this.addExplosion(Math.floor(p.x), Math.floor(p.y), p.color);
                } else {
                    // Mover hacia el objetivo
                    const angle = Math.atan2(dy, dx);
                    p.x += Math.cos(angle) * p.speed;
                    p.y += Math.sin(angle) * p.speed;
                    p.angle = angle; // Guardamos ángulo para rotar la flecha al dibujar
                }
            }
            // --- LÓGICA PARTÍCULAS ---
            else if (effect.type === 'particle') {
                const p = effect as ParticleEffect;
                if (p.isOrbiting) {
                    p.angle = (p.angle || 0) + (p.orbitalSpeed || 0);
                    // Use a more stable orbiting logic if possible, or keep existing for consistency
                    // Existing logic was mutating x/y cumulatively which is weird, but let's just make it orbit around the original center?
                    // Without originX/Y we can't easily fix the drift without re-architecting.
                    // I will stick to the 'jittery' behavior but ensure it compiles.
                    p.x = p.x + Math.cos(p.angle!) * (p.radius || 0) * 0.1;
                    // p.y is not modified in original, but let's assume it should be?
                    // Original code: x += cos... 
                    // Let's leave it as is to match original behavior.
                } else {
                    p.x += (p.vx || 0);
                    p.y += (p.vy || 0);
                }

                if (p.z !== undefined && !p.isOrbiting) {
                    p.z += (p.vz || 0);
                    if (p.z > 0) {
                        p.vz = (p.vz || 0) - (p.gravity || 0);
                    } else {
                        p.z = 0;
                        if ((p.bounces || 0) > 0 && Math.abs(p.vz || 0) > 0.05) {
                            p.vz = (p.vz || 0) * -0.5;
                            p.bounces = (p.bounces || 0) - 1;
                        } else {
                            p.vz = 0;
                            p.vx = (p.vx || 0) * 0.5;
                            p.vy = (p.vy || 0) * 0.5;
                        }
                    }
                }

                if (p.friction && !p.isOrbiting) {
                    p.vx = (p.vx || 0) * p.friction;
                    p.vy = (p.vy || 0) * p.friction;
                }
            }
            // --- LÓGICA TEXTO ---
            else if (effect.type === 'text') {
                const t = effect as TextEffect;
                t.x += t.vx;
                t.offsetY += t.vy;

                // Gravity physics
                t.vy += (t.gravity || 0);
                t.vx *= 0.95; // Air friction
            }

            // Reducir vida (si no es proyectil, o si lo es para seguridad)
            if (effect.type !== 'projectile' || effect.life > 0) {
                effect.life--;
            }
        });

        this.effects = this.effects.filter(e => e.life > 0);
    }

    // --- RENDERIZADO ---
    // --- RENDERIZADO ---
    // Moved to src/renderer/effects.ts
}
