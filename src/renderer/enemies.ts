import { spriteManager } from '@/engine/core/SpriteManager';
import { ENEMY_STATS } from '@/data/enemies';
import { TILE_HEIGHT } from '@/data/constants';

export const drawShadow = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const s = size;
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    // Isometric shadow (2:1 ratio generally, but keeping it flat looks good)
    // x, y is the top-left of the sizing box
    // Center is x + s/2, y + s*0.85
    ctx.ellipse(x + s * 0.5, y + s * 0.85, s * 0.3, s * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawWeapon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, type: string, progress: number, angle: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const thrust = Math.sin(progress * Math.PI) * (size * 0.5);
    ctx.translate(thrust, 0);

    if (type === 'sword') {
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(0, -size * 0.05, size * 0.4, size * 0.1);
        ctx.beginPath();
        ctx.moveTo(size * 0.4, -size * 0.05);
        ctx.lineTo(size * 0.5, 0);
        ctx.lineTo(size * 0.4, size * 0.05);
        ctx.fill();
    } else if (type === 'axe') {
        ctx.fillStyle = "#78350f";
        ctx.fillRect(0, -size * 0.03, size * 0.4, size * 0.06);
        ctx.fillStyle = "#94a3b8";
        ctx.beginPath();
        ctx.arc(size * 0.35, 0, size * 0.2, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
    }
    ctx.restore();
}

export const SPRITES: Record<string, { draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, frame: number, isAttacking: boolean, attackProgress: number, attackDir: { x: number, y: number }, lastMoveTime?: number) => void }> = {
    rat: {
        draw: (ctx, x, y, size, frame, isAttacking, attackProgress, attackDir) => {
            const s = size;
            const angle = Math.atan2(attackDir.y, attackDir.x);
            const lungeDist = isAttacking ? Math.sin(attackProgress * Math.PI) * (s * 0.4) : 0;
            const xAnim = x + (isAttacking ? Math.cos(angle) * lungeDist : 0);
            const yAnim = y + (isAttacking ? Math.sin(angle) * lungeDist : 0) + (!isAttacking ? Math.abs(Math.sin(frame * 0.2)) * s * 0.05 : 0);
            const grad = ctx.createRadialGradient(xAnim + s * 0.5, yAnim + s * 0.5, 0, xAnim + s * 0.5, yAnim + s * 0.5, s * 0.3);
            grad.addColorStop(0, "#a8a29e"); grad.addColorStop(1, "#57534e");
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.ellipse(xAnim + s * 0.5, yAnim + s * 0.5, s * 0.25, s * 0.15, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = "#d6d3d1"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xAnim + s * 0.25, yAnim + s * 0.5);
            const tailWag = Math.sin(frame * 0.3) * 0.1;
            ctx.quadraticCurveTo(xAnim, yAnim + s * 0.4, xAnim - s * 0.1, yAnim + s * 0.3 + tailWag * s); ctx.stroke();
            ctx.fillStyle = "#a8a29e"; ctx.beginPath(); ctx.arc(xAnim + s * 0.75, yAnim + s * 0.5, s * 0.1, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = isAttacking ? "#ef4444" : "#000"; ctx.beginPath(); ctx.arc(xAnim + s * 0.78, yAnim + s * 0.48, s * 0.03, 0, Math.PI * 2); ctx.fill();
        },
    },
    bat: {
        draw: (ctx, x, y, size, frame, isAttacking, attackProgress, attackDir) => {
            const s = size;
            const angle = Math.atan2(attackDir.y, attackDir.x);
            const hover = Math.sin(frame * 0.15) * (s * 0.1);
            const diveDist = isAttacking ? Math.sin(attackProgress * Math.PI) * (s * 0.5) : 0;
            const xAnim = x + (isAttacking ? Math.cos(angle) * diveDist : 0);
            const yAnim = y + hover + (isAttacking ? Math.sin(angle) * diveDist : 0);
            ctx.fillStyle = "#101011ff";
            const wingY = Math.sin(frame * (isAttacking ? 1.5 : 0.2)) * (s * 0.15);
            ctx.beginPath(); ctx.moveTo(xAnim + s * 0.5, yAnim + s * 0.5);
            ctx.quadraticCurveTo(xAnim + s * 0.1, yAnim + s * 0.2 + wingY, xAnim, yAnim + s * 0.4);
            ctx.lineTo(xAnim + s * 0.4, yAnim + s * 0.6); ctx.moveTo(xAnim + s * 0.5, yAnim + s * 0.5);
            ctx.quadraticCurveTo(xAnim + s * 0.9, yAnim + s * 0.2 + wingY, xAnim + s, yAnim + s * 0.4);
            ctx.lineTo(xAnim + s * 0.6, yAnim + s * 0.6); ctx.fill();
            ctx.beginPath(); ctx.arc(xAnim + s * 0.5, yAnim + s * 0.5, s * 0.12, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#ef4444"; ctx.fillRect(xAnim + s * 0.45, yAnim + s * 0.48, s * 0.04, s * 0.04); ctx.fillRect(xAnim + s * 0.51, yAnim + s * 0.48, s * 0.04, s * 0.04);
        },
    },
    slime: {
        draw: (ctx, x, y, size, frame, isAttacking, attackProgress, attackDir) => {
            const s = size; const angle = Math.atan2(attackDir.y, attackDir.x);
            let centerX = x + s * 0.5; let centerY = y + s * 0.7;
            let stretchX = 1; let stretchY = 1;
            if (isAttacking) { const lunge = Math.sin(attackProgress * Math.PI); centerX += Math.cos(angle) * lunge * s * 0.3; centerY += Math.sin(angle) * lunge * s * 0.3; stretchX = 1 + lunge * 0.2; stretchY = 1 + lunge * 0.2; }
            else { const pulse = Math.sin(frame * 0.15); stretchX = 1 + pulse * 0.1; stretchY = 1 - pulse * 0.1; }
            const gradient = ctx.createRadialGradient(centerX, centerY - s * 0.2, 0, centerX, centerY, s * 0.4);
            gradient.addColorStop(0, "rgba(103, 232, 249, 0.9)"); gradient.addColorStop(1, "rgba(8, 145, 178, 0.6)");
            ctx.save(); ctx.translate(centerX, centerY); ctx.scale(stretchX, stretchY);
            ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(0, 0, s * 0.35, Math.PI, 0); ctx.bezierCurveTo(s * 0.35, s * 0.2, -s * 0.35, s * 0.2, -s * 0.35, 0); ctx.fill();
            ctx.strokeStyle = "rgba(165, 243, 252, 0.5)"; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = "#0e7490"; ctx.beginPath(); const eyeDX = Math.cos(angle) * s * 0.1; const eyeDY = Math.sin(angle) * s * 0.1; ctx.arc(-s * 0.1 + eyeDX, -s * 0.1 + eyeDY, s * 0.05, 0, Math.PI * 2); ctx.arc(s * 0.1 + eyeDX, -s * 0.1 + eyeDY, s * 0.05, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        },
    },
    goblin: {
        draw: (ctx, x, y, size, frame, isAttacking, attackProgress, attackDir, lastMoveTime) => {
            const s = size * 0.85; const offsetX = (size - s) / 2; const offsetY = (size - s); const gx = x + offsetX; const gy = y + offsetY;
            const now = Date.now(); const isMoving = lastMoveTime ? (now - lastMoveTime) < 300 : false;
            const walkCycle = isMoving ? Math.sin(now * 0.015) : 0; const bodyBob = isMoving ? Math.abs(walkCycle) * s * 0.05 : Math.sin(frame * 0.05) * s * 0.02;
            const armSwing = isMoving ? Math.sin(now * 0.015) * 0.2 : 0; const leftLegLift = isMoving && walkCycle > 0 ? walkCycle * s * 0.15 : 0; const rightLegLift = isMoving && walkCycle < 0 ? -walkCycle * s * 0.15 : 0;
            const yAnim = gy - bodyBob; ctx.fillStyle = "#14532d"; ctx.fillRect(gx + s * 0.35, yAnim + s * 0.75 - leftLegLift, s * 0.12, s * 0.25); ctx.fillRect(gx + s * 0.53, yAnim + s * 0.75 - rightLegLift, s * 0.12, s * 0.25);
            ctx.fillStyle = "#78350f"; ctx.beginPath(); ctx.moveTo(gx + s * 0.3, yAnim + s * 0.45); ctx.lineTo(gx + s * 0.7, yAnim + s * 0.45); ctx.lineTo(gx + s * 0.75, yAnim + s * 0.75); ctx.lineTo(gx + s * 0.25, yAnim + s * 0.75); ctx.fill();
            ctx.fillStyle = "#a16207"; ctx.fillRect(gx + s * 0.3, yAnim + s * 0.65, s * 0.4, s * 0.05);
            ctx.save(); ctx.translate(gx + s * 0.3, yAnim + s * 0.5); ctx.rotate((Math.PI / 2) - armSwing); ctx.fillStyle = "#4ade80"; ctx.beginPath(); ctx.moveTo(0, -s * 0.05); ctx.lineTo(s * 0.25, 0); ctx.lineTo(0, s * 0.05); ctx.fill();
            ctx.beginPath(); ctx.arc(s * 0.25, 0, s * 0.06, 0, Math.PI * 2); ctx.fill(); ctx.restore();
            ctx.save(); ctx.translate(gx + s * 0.7, yAnim + s * 0.5); let armRot = (Math.PI / 2) + armSwing;
            if (isAttacking) { const angle = Math.atan2(attackDir.y, attackDir.x); const stab = Math.sin(attackProgress * Math.PI); armRot = angle; const thrustDist = stab * s * 0.3; ctx.translate(Math.cos(angle) * thrustDist, Math.sin(angle) * thrustDist); }
            ctx.rotate(armRot); ctx.fillStyle = "#4ade80"; ctx.beginPath(); ctx.moveTo(0, -s * 0.05); ctx.lineTo(s * 0.25, 0); ctx.lineTo(0, s * 0.05); ctx.fill();
            ctx.beginPath(); ctx.arc(s * 0.25, 0, s * 0.07, 0, Math.PI * 2); ctx.fill(); ctx.translate(s * 0.25, 0); ctx.fillStyle = '#9ca3af'; ctx.beginPath(); ctx.moveTo(0, -s * 0.04); ctx.lineTo(s * 0.3, 0); ctx.lineTo(0, s * 0.04); ctx.fill();
            ctx.fillStyle = '#d1d5db'; ctx.beginPath(); ctx.moveTo(0, -s * 0.01); ctx.lineTo(s * 0.25, 0); ctx.lineTo(0, s * 0.01); ctx.fill(); ctx.fillStyle = '#4b5563'; ctx.fillRect(-s * 0.08, -s * 0.03, s * 0.08, s * 0.06); ctx.fillStyle = '#374151'; ctx.fillRect(0, -s * 0.06, s * 0.03, s * 0.12); ctx.restore();
            ctx.fillStyle = "#4ade80"; ctx.beginPath(); ctx.arc(gx + s * 0.5, yAnim + s * 0.35, s * 0.18, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#22c55e"; ctx.beginPath(); ctx.moveTo(gx + s * 0.5, yAnim + s * 0.35); ctx.lineTo(gx + s * 0.45, yAnim + s * 0.42); ctx.lineTo(gx + s * 0.55, yAnim + s * 0.4); ctx.fill();
            ctx.beginPath(); ctx.moveTo(gx + s * 0.35, yAnim + s * 0.35); ctx.lineTo(gx + s * 0.1, yAnim + s * 0.25); ctx.lineTo(gx + s * 0.35, yAnim + s * 0.3); ctx.moveTo(gx + s * 0.65, yAnim + s * 0.35); ctx.lineTo(gx + s * 0.9, yAnim + s * 0.25); ctx.lineTo(gx + s * 0.65, yAnim + s * 0.3); ctx.fill();
            ctx.fillStyle = "#facc15"; ctx.beginPath(); ctx.arc(gx + s * 0.42, yAnim + s * 0.32, s * 0.035, 0, Math.PI * 2); ctx.arc(gx + s * 0.58, yAnim + s * 0.32, s * 0.035, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#000"; ctx.fillRect(gx + s * 0.41, yAnim + s * 0.31, s * 0.02, s * 0.02); ctx.fillRect(gx + s * 0.57, yAnim + s * 0.31, s * 0.02, s * 0.02);
        },
    },
    skeleton: {
        draw: (ctx, x, y, size, frame, isAttacking, attackProgress, attackDir) => {
            const s = size; const rattle = Math.sin(frame * 0.2) * (s * 0.02);
            ctx.fillStyle = "#e5e5e5"; ctx.beginPath(); ctx.arc(x + s * 0.5 + rattle, y + s * 0.3, s * 0.18, 0, Math.PI * 2); ctx.fill();
            const jawOpen = isAttacking ? Math.sin(attackProgress * Math.PI * 4) * s * 0.05 : 0; ctx.fillRect(x + s * 0.4 + rattle, y + s * 0.42 + jawOpen, s * 0.2, s * 0.08);
            ctx.fillStyle = "#171717"; ctx.beginPath(); ctx.arc(x + s * 0.45 + rattle, y + s * 0.3, s * 0.05, 0, Math.PI * 2); ctx.arc(x + s * 0.55 + rattle, y + s * 0.3, s * 0.05, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = "#e5e5e5"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + s * 0.5 + rattle, y + s * 0.5); ctx.lineTo(x + s * 0.5 + rattle, y + s * 0.8); ctx.moveTo(x + s * 0.35 + rattle, y + s * 0.55); ctx.lineTo(x + s * 0.65 + rattle, y + s * 0.55); ctx.stroke();
            const angle = Math.atan2(attackDir.y, attackDir.x); drawWeapon(ctx, x + s * 0.5 + rattle, y + s * 0.5, s, 'sword', isAttacking ? attackProgress : 0, angle);
        },
    },
    ghost: {
        draw: (ctx, x, y, size, frame, isAttacking, attackProgress, attackDir) => {
            const s = size; const angle = Math.atan2(attackDir.y, attackDir.x); const float = Math.sin(frame * 0.1) * (s * 0.1); const lunge = isAttacking ? Math.sin(attackProgress * Math.PI) * (s * 0.4) : 0;
            const xAnim = x + (isAttacking ? Math.cos(angle) * lunge : 0); const yAnim = y + float + (isAttacking ? Math.sin(angle) * lunge : 0);
            const grad = ctx.createLinearGradient(xAnim, yAnim, xAnim, yAnim + s); grad.addColorStop(0, "rgba(255, 255, 255, 0.9)"); grad.addColorStop(1, "rgba(255, 255, 255, 0.0)"); ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(xAnim + s * 0.5, yAnim + s * 0.4, s * 0.3, Math.PI, 0); ctx.lineTo(xAnim + s * 0.8, yAnim + s * 0.8);
            for (let i = 0; i <= s * 0.6; i += 5) { ctx.lineTo(xAnim + s * 0.8 - i, yAnim + s * 0.8 + Math.sin(i * 0.1 + frame * 0.2) * 5); }
            ctx.lineTo(xAnim + s * 0.2, yAnim + s * 0.4); ctx.fill(); ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(xAnim + s * 0.4, yAnim + s * 0.35, s * 0.04, 0, Math.PI * 2); ctx.arc(xAnim + s * 0.6, yAnim + s * 0.35, s * 0.04, 0, Math.PI * 2); ctx.fill();
            if (isAttacking) { ctx.beginPath(); ctx.ellipse(xAnim + s * 0.5, yAnim + s * 0.5, s * 0.05, s * 0.08, 0, 0, Math.PI * 2); ctx.fill(); }
            ctx.shadowColor = "#a5f3fc"; ctx.shadowBlur = 10; ctx.strokeStyle = "rgba(165, 243, 252, 0.5)"; ctx.lineWidth = 2; ctx.stroke(); ctx.shadowBlur = 0;
        },
    },
    orc: {
        draw: (ctx, x, y, size, frame, isAttacking, attackProgress, attackDir) => {
            const s = size; const yAnim = y + Math.abs(Math.sin(frame * 0.1)) * 2;
            ctx.fillStyle = "#365314"; ctx.fillRect(x + s * 0.25, yAnim + s * 0.35, s * 0.5, s * 0.4);
            ctx.fillStyle = "#4d7c0f"; ctx.beginPath(); ctx.arc(x + s * 0.5, yAnim + s * 0.25, s * 0.22, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#fef9c3"; ctx.beginPath(); ctx.moveTo(x + s * 0.35, yAnim + s * 0.35); ctx.lineTo(x + s * 0.35, yAnim + s * 0.15); ctx.lineTo(x + s * 0.42, yAnim + s * 0.35); ctx.fill();
            ctx.beginPath(); ctx.moveTo(x + s * 0.65, yAnim + s * 0.35); ctx.lineTo(x + s * 0.65, yAnim + s * 0.15); ctx.lineTo(x + s * 0.58, yAnim + s * 0.35); ctx.fill();
            ctx.fillStyle = "#ef4444"; ctx.fillRect(x + s * 0.35, yAnim + s * 0.22, s * 0.08, s * 0.04); ctx.fillRect(x + s * 0.57, yAnim + s * 0.22, s * 0.08, s * 0.04);
            const angle = Math.atan2(attackDir.y, attackDir.x); drawWeapon(ctx, x + s * 0.5, yAnim + s * 0.4, s, 'axe', isAttacking ? attackProgress : 0, angle);
        },
    },
    generic: {
        draw: (ctx, x, y, size, frame, isAttacking, attackProgress, attackDir) => {
            const s = size; const pulse = Math.sin(frame * 0.1) * s * 0.05; const angle = Math.atan2(attackDir.y, attackDir.x);
            const lunge = isAttacking ? Math.sin(attackProgress * Math.PI) * s * 0.3 : 0; const xAnim = x + Math.cos(angle) * lunge; const yAnim = y + Math.sin(angle) * lunge;
            ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(xAnim + s * 0.5, yAnim + s * 0.5, s * 0.35 + pulse, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#fff"; ctx.fillRect(xAnim + s * 0.35, yAnim + s * 0.4, s * 0.1, s * 0.1); ctx.fillRect(xAnim + s * 0.55, yAnim + s * 0.4, s * 0.1, s * 0.1);
        },
    },
    goblin_king: {
        draw: (ctx, x, y, size, frame, isAttacking, attackProgress, attackDir, lastMoveTime) => {
            // Reuse goblin logic but bigger and with crown
            const s = size * 0.85; const offsetX = (size - s) / 2; const offsetY = (size - s); const gx = x + offsetX; const gy = y + offsetY;
            const now = Date.now(); const isMoving = lastMoveTime ? (now - lastMoveTime) < 300 : false;
            const walkCycle = isMoving ? Math.sin(now * 0.015) : 0; const bodyBob = isMoving ? Math.abs(walkCycle) * s * 0.05 : Math.sin(frame * 0.05) * s * 0.02;
            const yAnim = gy - bodyBob;

            // Body (Darker Green)
            ctx.fillStyle = "#15803d"; ctx.fillRect(gx + s * 0.35, yAnim + s * 0.75, s * 0.12, s * 0.25); ctx.fillRect(gx + s * 0.53, yAnim + s * 0.75, s * 0.12, s * 0.25);
            ctx.fillStyle = "#451a03"; ctx.beginPath(); ctx.moveTo(gx + s * 0.3, yAnim + s * 0.45); ctx.lineTo(gx + s * 0.7, yAnim + s * 0.45); ctx.lineTo(gx + s * 0.75, yAnim + s * 0.75); ctx.lineTo(gx + s * 0.25, yAnim + s * 0.75); ctx.fill();
            // Cape (Red)
            ctx.fillStyle = "#b91c1c"; ctx.fillRect(gx + s * 0.3, yAnim + s * 0.45, s * 0.4, s * 0.3);

            // Head (Bigger)
            ctx.fillStyle = "#22c55e"; ctx.beginPath(); ctx.arc(gx + s * 0.5, yAnim + s * 0.35, s * 0.22, 0, Math.PI * 2); ctx.fill();
            // Crown (Gold)
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath();
            ctx.moveTo(gx + s * 0.3, yAnim + s * 0.2);
            ctx.lineTo(gx + s * 0.3, yAnim + s * 0.1); ctx.lineTo(gx + s * 0.4, yAnim + s * 0.2);
            ctx.lineTo(gx + s * 0.5, yAnim + s * 0.05);
            ctx.lineTo(gx + s * 0.6, yAnim + s * 0.2); ctx.lineTo(gx + s * 0.7, yAnim + s * 0.1);
            ctx.lineTo(gx + s * 0.7, yAnim + s * 0.2);
            ctx.fill();

            // Eyes (Red for Boss)
            ctx.fillStyle = "#dc2626"; ctx.beginPath(); ctx.arc(gx + s * 0.42, yAnim + s * 0.32, s * 0.04, 0, Math.PI * 2); ctx.arc(gx + s * 0.58, yAnim + s * 0.32, s * 0.04, 0, Math.PI * 2); ctx.fill();

            // Staff/Scepter
            ctx.save(); ctx.translate(gx + s * 0.75, yAnim + s * 0.5);
            if (isAttacking) {
                const angle = Math.atan2(attackDir.y, attackDir.x);
                ctx.rotate(angle);
            } else {
                ctx.rotate(-0.2);
            }
            ctx.fillStyle = "#78350f"; ctx.fillRect(-s * 0.05, -s * 0.4, s * 0.1, s * 0.8);
            ctx.fillStyle = "#f59e0b"; ctx.beginPath(); ctx.arc(0, -s * 0.45, s * 0.1, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    }
};

export function drawEnemy(
    ctx: CanvasRenderingContext2D,
    type: string,
    isoX: number,
    isoY: number,
    size: number,
    frame: number = 0,
    isStunned: boolean = false,
    lastAttackTime: number = 0,
    lastAttackDir: { x: number, y: number } = { x: 0, y: 0 },
    lastMoveTime: number = 0,
    sprite: any = null,
    isHovered: boolean = false // Added hover param
) {
    const now = Date.now();
    const ATTACK_DURATION = 300;
    const timeSinceAttack = now - lastAttackTime;
    const isAttacking = timeSinceAttack < ATTACK_DURATION;
    const progress = isAttacking ? timeSinceAttack / ATTACK_DURATION : 0;
    const dir = lastAttackDir;

    // Convert Iso Top coordinate to Sprite Box Top-Left
    const drawX = isoX - size / 2;
    const drawY = isoY + TILE_HEIGHT / 2 - size * 0.85;

    // HOVER EFFECT
    if (isHovered) {
        ctx.save();
        ctx.translate(isoX, isoY + TILE_HEIGHT / 2 - size * 0.4); // Center around base
        ctx.scale(1, 0.5); // Isometric squash
        const glowSize = size * 0.8;
        const gad = ctx.createRadialGradient(0, 0, glowSize * 0.2, 0, 0, glowSize);
        gad.addColorStop(0, 'rgba(255, 200, 0, 0.6)'); // Yellow center
        gad.addColorStop(0.5, 'rgba(255, 160, 0, 0.4)'); // Orange mid
        gad.addColorStop(1, 'rgba(255, 160, 0, 0)'); // Fade out
        ctx.fillStyle = gad;
        ctx.beginPath();
        ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    // Draw Sprite
    if (sprite) { // Assuming 'sprite' here is the 'spriteConfig' from the instruction
        const spriteConfig = sprite; // Rename for clarity based on instruction
        const lastDir = lastAttackDir; // Assuming lastAttackDir is the 'lastDir' from the instruction

        // Calculate frame
        // const now = performance.now(); // 'now' is already defined above
        // if (now - lastFrameTime > spriteConfig.frameDuration) { // lastFrameTime is not defined
        // Frame logic handled in main loop or here if needed, 
        // but strictly `frame` is passed in. 
        // We rely on the pre-calculated frame index if possible, 
        // but `drawEnemy` receives `frame` (global counter).
        // Let's use the standard iso sprite logic:
        // }

        // We need to determine Animation State based on lastAttackDir if we want directional
        // But for now, let's just draw the current frame from the config.

        // Determine Direction
        let dirSuffix = '_down';
        if (Math.abs(lastDir.x) > Math.abs(lastDir.y)) {
            if (lastDir.x > 0) dirSuffix = '_right';
            else dirSuffix = '_left';
        } else if (Math.abs(lastDir.y) > Math.abs(lastDir.x)) {
            if (lastDir.y > 0) dirSuffix = '_down';
            else dirSuffix = '_up';
        }

        // Select Animation State
        /* 
           Simple state machine for animation names:
           - Attack: 'attack_down', 'attack_left', etc.
           - Move: 'walk_down', 'walk_left', etc.
           - Idle: 'idle_down' (if we had it, fallback to walk Frame 0)
        */
        const actionPrefix = isAttacking ? 'attack' : 'walk';
        const animName = `${actionPrefix}${dirSuffix}`;

        // Fallback to walk if attack anim missing
        const frames = spriteConfig.anims[animName] || spriteConfig.anims[`walk${dirSuffix}`] || spriteConfig.anims['walk_down'] || [0];

        let flip = false;
        // Auto-flip logic if we are reusing frames (e.g. Left reuses Right)
        if (dirSuffix === '_left' && spriteConfig.flipLeft) {
            flip = true;
        }

        const frameIndex = Math.floor(frame / 15) % frames.length;
        const frameId = frames[frameIndex];

        const cols = spriteConfig.cols || 1;
        const row = Math.floor(frameId / cols);
        const col = frameId % cols;

        const fw = spriteConfig.frameSize.x;
        const fh = spriteConfig.frameSize.y;

        // Assuming spriteManager is globally available or imported
        // This line needs to be adapted based on actual spriteManager implementation
        // For now, using the original `spriteManager.get` and assuming `sprite.texture`
        const img = spriteManager.get(spriteConfig.texture); // Changed from getTexture to get

        if (img) {
            ctx.save();
            // Force standard blending
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1.0;

            if (flip) {
                // Flip around the sprite center
                ctx.translate(drawX + size / 2, drawY); // Use drawX, drawY for sprite box top-left
                ctx.scale(-1, 1);
                ctx.translate(-(drawX + size / 2), -drawY);
            }

            // Adjust source rect
            ctx.drawImage(img,
                col * fw, row * fh, fw, fh,
                drawX, drawY, size, size // Reverted to original draw parameters
            );
            ctx.restore();
            return;
        }
    }

    let enemyType = String(type || 'generic').toLowerCase();

    // Auto-map numeric IDs to render keys
    const id = parseInt(enemyType);
    if (!isNaN(id) && ENEMY_STATS[id]) {
        enemyType = ENEMY_STATS[id].renderKey;
    }

    const renderer = SPRITES[enemyType] || SPRITES.generic;

    ctx.save();
    if (isStunned) ctx.filter = 'grayscale(100%) brightness(1.2)';
    renderer.draw(ctx, drawX, drawY, size, frame, isAttacking, progress, dir, lastMoveTime);
    ctx.restore();
}

export function drawLargeEnemy(
    ctx: CanvasRenderingContext2D,
    type: string,
    isoX: number,
    isoY: number,
    size: number,
    frame: number = 0,
    isStunned: boolean = false,
    lastAttackTime: number = 0
) {
    const now = Date.now();
    const ATTACK_DURATION = 500;
    const timeSinceAttack = now - lastAttackTime;
    const isAttacking = timeSinceAttack < ATTACK_DURATION;
    const progress = isAttacking ? timeSinceAttack / ATTACK_DURATION : 0;

    // Convert Iso Top coordinate to Sprite Box Top-Left
    const drawX = isoX - size / 2;
    const drawY = isoY + TILE_HEIGHT / 2 - size * 0.85;

    ctx.save();
    if (isStunned) ctx.filter = 'grayscale(100%) brightness(1.2)';

    let enemyType = String(type || 'generic').toLowerCase();

    const id = parseInt(enemyType);
    if (!isNaN(id) && ENEMY_STATS[id]) {
        enemyType = ENEMY_STATS[id].renderKey;
    }

    const renderer = SPRITES[enemyType] || SPRITES.generic;

    if (isAttacking) {
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 15;
    }

    renderer.draw(ctx, drawX, drawY, size, frame, isAttacking, progress, { x: 0, y: 1 }, 0);

    ctx.restore();
}
