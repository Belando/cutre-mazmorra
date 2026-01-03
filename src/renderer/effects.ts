import { Effect, TextEffect, ParticleEffect, ProjectileEffect } from '@/engine/systems/EffectSystem';
import { toScreen } from '@/utils/isometric';

export function drawEffects(
    ctx: CanvasRenderingContext2D,
    effects: Effect[],
    offsetX: number,
    offsetY: number,
    tileSize: number,
    halfW: number,
    halfH: number
): void {
    ctx.save();

    const particles: ParticleEffect[] = [];
    const texts: TextEffect[] = [];
    const projectiles: ProjectileEffect[] = [];

    // Separar por tipo para dibujar en orden
    effects.forEach(e => {
        if (e.type === 'text') texts.push(e as TextEffect);
        else if (e.type === 'projectile') projectiles.push(e as ProjectileEffect);
        else particles.push(e as ParticleEffect);
    });

    // 1. DIBUJAR PROYECTILES (Debajo de partículas y texto)
    projectiles.forEach(p => {
        const { x: isoX, y: isoY } = toScreen(p.x - offsetX, p.y - offsetY);
        const screenX = isoX + halfW;
        const screenY = isoY + halfH;
        const size = tileSize * 0.3; // Tamaño del proyectil

        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(screenX, screenY);

        if (p.style === 'arrow') {
            ctx.rotate(p.angle || 0);
            ctx.beginPath();
            // Forma de flecha simple
            ctx.moveTo(size / 2, 0);
            ctx.lineTo(-size / 2, -size / 4);
            ctx.lineTo(-size / 2, size / 4);
            ctx.fill();
        } else {
            // Bola de energía/fuego
            ctx.beginPath();
            ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
            ctx.fill();
            // Cola/Estela simple
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(-size / 2, 0, size / 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    });

    // 2. DIBUJAR PARTÍCULAS
    particles.forEach(effect => {
        const zOffset = effect.z || 0;

        let finalX = effect.x;
        let finalY = effect.y;

        if (effect.isOrbiting) {
            finalX = effect.x + Math.cos(effect.angle || 0) * (effect.radius || 0);
            finalY = effect.y + Math.sin(effect.angle || 0) * (effect.radius || 0) * 0.3;
        }

        const { x: isoX, y: isoY } = toScreen(finalX - offsetX, finalY - offsetY);
        const screenX = isoX + halfW;
        // zOffset is height (up), in iso projection Y goes down, so up is -Y.
        // But we usually just subtract Z from Y for height illusion.
        // Also need to consider TILE_HEIGHT scaling? toScreen handles map projection.
        // Z is pure vertical offset.
        const screenY = isoY + halfH - (zOffset * tileSize);

        if (zOffset > 0.1 && !effect.isOrbiting) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            const shadowY = isoY + halfH; // Shadow is at ground level
            const shadowSize = effect.size * tileSize * (1 - zOffset * 0.5);
            if (shadowSize > 0) ctx.fillRect(screenX, shadowY, shadowSize, shadowSize * 0.5);
        }

        const alpha = Math.min(1, effect.life / (effect.isOrbiting ? 10 : 30));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = effect.color;

        const size = effect.size * tileSize;

        if (effect.style === 'rect') {
            ctx.fillRect(screenX - size / 2, screenY - size / 2, size, size);
        } else if (effect.style === 'circle') {
            ctx.beginPath(); ctx.arc(screenX, screenY, size, 0, Math.PI * 2); ctx.fill();
        } else if (effect.style === 'star') {
            ctx.save();
            ctx.translate(screenX, screenY);
            if (effect.isOrbiting) ctx.rotate((effect.angle || 0) * 2);
            ctx.fillRect(-size / 2, -size / 6, size, size / 3);
            ctx.fillRect(-size / 6, -size / 2, size / 3, size);
            ctx.restore();
        }
    });

    // 3. DIBUJAR TEXTOS (Siempre encima)
    texts.forEach(effect => {
        const { x: isoX, y: isoY } = toScreen(effect.x - offsetX, effect.y - offsetY);
        const screenX = isoX + halfW;
        const screenY = isoY + halfH + (effect.offsetY * tileSize);

        // Fade out al final
        const alpha = Math.min(1, effect.life / 20);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = effect.color;

        let fontSize = 14;
        if (effect.isCritical) fontSize = 24;
        else if (effect.isSkillHit) fontSize = 18;
        else if (effect.isSmall) fontSize = 10;

        ctx.font = `bold ${fontSize}px monospace`;
        ctx.textAlign = 'center';

        ctx.lineWidth = effect.isCritical || effect.isSkillHit ? 4 : 2;
        ctx.strokeStyle = 'black';
        ctx.strokeText(effect.text, screenX, screenY);
        ctx.fillText(effect.text, screenX, screenY);
    });

    ctx.restore();
}
