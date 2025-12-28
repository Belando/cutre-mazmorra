import { spriteManager } from '@/engine/core/SpriteManager';
import { TILE_HEIGHT } from '@/data/constants';

// Helper to draw the shadow used by items
function drawIsoShadow(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    const s = size;
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    // Center is x + s/2, y + s*0.85
    ctx.ellipse(x + s * 0.5, y + s * 0.85, s * 0.3, s * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
}

export const ENV_SPRITES: Record<string, { draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, ...args: any[]) => void }> = {
    torch: {
        draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, frame: number = 0) => {
            const s = size;
            ctx.fillStyle = '#78350f';
            ctx.fillRect(x + s * 0.4, y + s * 0.5, s * 0.2, s * 0.35);
            ctx.fillStyle = '#a16207';
            ctx.fillRect(x + s * 0.35, y + s * 0.4, s * 0.3, s * 0.15);
            const flicker = Math.sin(frame * 0.3) * 0.05;
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.moveTo(x + s * 0.5, y + s * 0.1 + flicker * s);
            ctx.quadraticCurveTo(x + s * 0.65, y + s * 0.25, x + s * 0.6, y + s * 0.4);
            ctx.lineTo(x + s * 0.4, y + s * 0.4);
            ctx.quadraticCurveTo(x + s * 0.35, y + s * 0.25, x + s * 0.5, y + s * 0.1 + flicker * s);
            ctx.fill();
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.moveTo(x + s * 0.5, y + s * 0.18);
            ctx.quadraticCurveTo(x + s * 0.58, y + s * 0.28, x + s * 0.55, y + s * 0.38);
            ctx.lineTo(x + s * 0.45, y + s * 0.38);
            ctx.quadraticCurveTo(x + s * 0.42, y + s * 0.28, x + s * 0.5, y + s * 0.18);
            ctx.fill();
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 8;
            ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
            ctx.beginPath();
            ctx.arc(x + s * 0.5, y + s * 0.3, s * 0.25, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    },
    door_closed: {
        draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
            const img = spriteManager.get('door_closed');
            if (img) {
                const newSize = size * 1.25;
                const offset = (size - newSize) / 2;
                ctx.drawImage(img, x + offset, y + offset, newSize, newSize);
            } else {
                ctx.fillStyle = '#451a03';
                ctx.fillRect(x + size * 0.1, y + size * 0.1, size * 0.8, size * 0.8);
            }
        }
    },
    door_open: {
        draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
            const img = spriteManager.get('door_open');
            if (img) {
                const newSize = size * 1.25;
                const offset = (size - newSize) / 2;
                ctx.drawImage(img, x + offset, y + offset, newSize, newSize);
            } else {
                ctx.fillStyle = '#271c19';
                ctx.fillRect(x + size * 0.1, y + size * 0.1, size * 0.1, size * 0.8);
            }
        }
    },
    chest: {
        draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, isOpen: boolean = false, rarity: string = 'common') => {
            const s = size;
            const rarityColors: Record<string, string> = {
                common: '#fbbf24',
                uncommon: '#22c55e',
                rare: '#3b82f6',
                epic: '#a855f7',
                legendary: '#fbbf24'
            };
            const lockColor = rarityColors[rarity] || rarityColors.common;

            const c = {
                outline: '#271c19', woodDark: '#451a03', woodMid: '#78350f',
                woodLight: '#92400e', metalDark: '#334155', metalLight: '#94a3b8',
                lock: lockColor, gold: '#f59e0b', goldShine: '#fcd34d', void: '#0f172a'
            };

            if (isOpen) {
                const imgOpen = spriteManager.get('chest_open');
                if (imgOpen) {
                    const scale = 1.4;
                    const w = size * scale;
                    const h = size * scale;
                    const offsetX = (size - w) / 2;
                    const offsetY = (size - h) / 1.5;
                    ctx.drawImage(imgOpen, x + offsetX, y + offsetY, w, h);
                    return;
                }
                ctx.fillStyle = c.outline;
                ctx.fillRect(x + s * 0.15, y + s * 0.1, s * 0.7, s * 0.35);
                ctx.fillStyle = c.woodDark;
                ctx.fillRect(x + s * 0.18, y + s * 0.12, s * 0.64, s * 0.3);
                ctx.fillStyle = c.metalDark;
                ctx.fillRect(x + s * 0.25, y + s * 0.1, s * 0.1, s * 0.35);
                ctx.fillRect(x + s * 0.65, y + s * 0.1, s * 0.1, s * 0.35);
                ctx.fillStyle = c.void;
                ctx.fillRect(x + s * 0.15, y + s * 0.4, s * 0.7, s * 0.35);
                ctx.fillStyle = c.gold;
                ctx.beginPath();
                ctx.ellipse(x + s * 0.5, y + s * 0.6, s * 0.25, s * 0.15, 0, Math.PI, 0);
                ctx.fill();
                ctx.fillStyle = c.goldShine;
                ctx.fillRect(x + s * 0.4, y + s * 0.55, s * 0.05, s * 0.05);
                ctx.fillRect(x + s * 0.55, y + s * 0.6, s * 0.05, s * 0.05);
                ctx.fillStyle = c.outline;
                ctx.fillRect(x + s * 0.15, y + s * 0.5, s * 0.7, s * 0.35);
                ctx.fillStyle = c.woodMid;
                ctx.fillRect(x + s * 0.18, y + s * 0.53, s * 0.64, s * 0.29);
                ctx.fillStyle = c.metalDark;
                ctx.fillRect(x + s * 0.25, y + s * 0.5, s * 0.1, s * 0.35);
                ctx.fillRect(x + s * 0.65, y + s * 0.5, s * 0.1, s * 0.35);
            } else {
                const imgClosed = spriteManager.get('chest_closed');
                if (imgClosed) {
                    const scale = 1.4;
                    const w = size * scale;
                    const h = size * scale;
                    const offsetX = (size - w) / 2;
                    const offsetY = (size - h) / 1.5;
                    ctx.drawImage(imgClosed, x + offsetX, y + offsetY, w, h);
                    return;
                }

                if (rarity !== 'common') {
                    ctx.shadowColor = lockColor;
                    ctx.shadowBlur = 10;
                }

                drawIsoShadow(ctx, x, y, size);

                ctx.fillStyle = c.outline;
                ctx.fillRect(x + s * 0.15, y + s * 0.35, s * 0.7, s * 0.5);
                ctx.fillStyle = c.woodMid;
                ctx.fillRect(x + s * 0.18, y + s * 0.38, s * 0.64, s * 0.44);
                ctx.fillStyle = c.woodLight;
                ctx.fillRect(x + s * 0.18, y + s * 0.3, s * 0.64, s * 0.15);
                ctx.fillStyle = c.outline;
                ctx.fillRect(x + s * 0.15, y + s * 0.45, s * 0.7, s * 0.05);
                ctx.fillStyle = c.metalDark;
                ctx.fillRect(x + s * 0.22, y + s * 0.3, s * 0.1, s * 0.55);
                ctx.fillRect(x + s * 0.68, y + s * 0.3, s * 0.1, s * 0.55);
                ctx.fillStyle = c.metalLight;
                ctx.fillRect(x + s * 0.22, y + s * 0.3, s * 0.02, s * 0.55);
                ctx.fillRect(x + s * 0.68, y + s * 0.3, s * 0.02, s * 0.55);
                ctx.fillStyle = c.metalDark;
                ctx.fillRect(x + s * 0.42, y + s * 0.42, s * 0.16, s * 0.16);
                ctx.fillStyle = c.lock;
                ctx.fillRect(x + s * 0.44, y + s * 0.44, s * 0.12, s * 0.12);

                if (rarity !== 'common') {
                    ctx.shadowBlur = 0;
                }
            }
        }
    },
    goldPile: {
        draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
            const s = size;
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.ellipse(x + s * 0.5, y + s * 0.75, s * 0.35, s * 0.12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.ellipse(x + s * 0.45, y + s * 0.65, s * 0.25, s * 0.1, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.ellipse(x + s * 0.55, y + s * 0.6, s * 0.2, s * 0.08, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fcd34d';
            ctx.beginPath();
            ctx.ellipse(x + s * 0.5, y + s * 0.52, s * 0.12, s * 0.05, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x + s * 0.6, y + s * 0.5, s * 0.03, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    stairs: {
        draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
            const s = size;
            // Draw pseudo-3d stairs for iso
            // Just draw flat rects stacking up?

            ctx.fillStyle = '#292524';
            // Base rect
            ctx.fillRect(x + s * 0.05, y + s * 0.05, s * 0.9, s * 0.9);

            const steps = 5;
            const stepH = (s * 0.8) / steps;

            for (let i = 0; i < steps; i++) {
                // For ISO, steps should go "up" visually.
                // In 2D, they just went y + offset.
                // In Iso, if "up" means North-East / North-West?
                // Usually stairs go up/down a level.
                // Let's keep the pseudo-3d look but maybe align it better.

                const sy = y + s * 0.1 + (i * stepH);
                ctx.fillStyle = '#57534e';
                ctx.fillRect(x + s * 0.1, sy, s * 0.8, stepH * 0.6);
                ctx.fillStyle = '#44403c';
                ctx.fillRect(x + s * 0.1, sy + stepH * 0.6, s * 0.8, stepH * 0.4);
            }
        }
    },
    wallTorch: {
        draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, frame: number = 0) => {
            const s = size;
            // Wall torches typically offset higher
            const drawY = y - s * 0.3;

            ctx.fillStyle = '#44403c';
            ctx.fillRect(x + s * 0.45, drawY + s * 0.5, s * 0.1, s * 0.3);
            const flicker = Math.sin(frame * 0.5) * s * 0.05;
            const gradient = ctx.createRadialGradient(x + s * 0.5, drawY + s * 0.4, 0, x + s * 0.5, drawY + s * 0.4, s * 0.6);
            gradient.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
            gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath(); ctx.arc(x + s * 0.5, drawY + s * 0.4, s * 0.6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.ellipse(x + s * 0.5, drawY + s * 0.4, s * 0.15, s * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.ellipse(x + s * 0.5 + flicker * 0.5, drawY + s * 0.38, s * 0.1, s * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fef3c7';
            ctx.beginPath();
            ctx.arc(x + s * 0.5 + flicker, drawY + s * 0.35, s * 0.06, 0, Math.PI * 2);
            ctx.fill();
        }
    },
    bones: {
        draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
            const img = spriteManager.get('bones');
            if (img) {
                ctx.drawImage(img, x, y, size, size);
                return;
            }
            const s = size;
            ctx.fillStyle = '#e5e5e5';
            ctx.beginPath();
            ctx.arc(x + s * 0.5, y + s * 0.5, s * 0.12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(x + s * 0.44, y + s * 0.58, s * 0.12, s * 0.08);
            ctx.strokeStyle = '#d4d4d4';
            ctx.lineWidth = s * 0.05;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x + s * 0.35, y + s * 0.65);
            ctx.lineTo(x + s * 0.65, y + s * 0.35);
            ctx.moveTo(x + s * 0.65, y + s * 0.65);
            ctx.lineTo(x + s * 0.35, y + s * 0.35);
            ctx.stroke();
        }
    },
    barrel: {
        draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
            const s = size;
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.ellipse(x + s * 0.5, y + s * 0.75, s * 0.3, s * 0.1, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(x + s * 0.2, y + s * 0.25, s * 0.6, s * 0.5);
            ctx.fillStyle = '#92400e';
            ctx.beginPath();
            ctx.ellipse(x + s * 0.5, y + s * 0.25, s * 0.3, s * 0.1, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#71717a';
            ctx.fillRect(x + s * 0.18, y + s * 0.32, s * 0.64, s * 0.04);
            ctx.fillRect(x + s * 0.18, y + s * 0.55, s * 0.64, s * 0.04);
        }
    },
    pillar: {
        draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
            const s = size;
            ctx.fillStyle = '#44403c';
            ctx.fillRect(x + s * 0.2, y + s * 0.8, s * 0.6, s * 0.15);
            ctx.fillStyle = '#57534e';
            ctx.fillRect(x + s * 0.28, y + s * 0.15, s * 0.44, s * 0.65);
            ctx.fillStyle = '#44403c';
            ctx.fillRect(x + s * 0.2, y + s * 0.08, s * 0.6, s * 0.12);
            ctx.fillStyle = '#3f3f46';
            ctx.fillRect(x + s * 0.32, y + s * 0.2, s * 0.08, s * 0.55);
            ctx.fillRect(x + s * 0.6, y + s * 0.2, s * 0.08, s * 0.55);
        }
    },
    crack: {
        draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
            const img = spriteManager.get('crack');
            if (img) {
                ctx.globalAlpha = 0.8;
                ctx.drawImage(img, x, y, size, size);
                ctx.globalAlpha = 1.0;
                return;
            }
            const s = size;
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x + s * 0.3, y + s * 0.2);
            ctx.lineTo(x + s * 0.4, y + s * 0.35);
            ctx.lineTo(x + s * 0.35, y + s * 0.5);
            ctx.lineTo(x + s * 0.5, y + s * 0.65);
            ctx.stroke();
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + s * 0.4, y + s * 0.35);
            ctx.lineTo(x + s * 0.55, y + s * 0.3);
            ctx.stroke();
        }
    },
    rubble: {
        draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
            const img = spriteManager.get('rubble');
            if (img) {
                ctx.drawImage(img, x, y, size, size);
                return;
            }
            const s = size;
            ctx.fillStyle = '#57534e';
            ctx.beginPath();
            ctx.moveTo(x + s * 0.3, y + s * 0.7);
            ctx.lineTo(x + s * 0.35, y + s * 0.6);
            ctx.lineTo(x + s * 0.45, y + s * 0.62);
            ctx.lineTo(x + s * 0.48, y + s * 0.75);
            ctx.fill();
            ctx.fillStyle = '#44403c';
            ctx.beginPath();
            ctx.moveTo(x + s * 0.6, y + s * 0.8);
            ctx.lineTo(x + s * 0.55, y + s * 0.65);
            ctx.lineTo(x + s * 0.7, y + s * 0.6);
            ctx.lineTo(x + s * 0.75, y + s * 0.75);
            ctx.fill();
            ctx.fillStyle = '#292524';
            ctx.fillRect(x + s * 0.5, y + s * 0.7, s * 0.05, s * 0.05);
            ctx.fillRect(x + s * 0.4, y + s * 0.75, s * 0.03, s * 0.03);
        }
    },
    bloodstain: {
        draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
            const img = spriteManager.get('bloodstain');
            if (img) {
                ctx.globalAlpha = 0.8;
                ctx.drawImage(img, x, y, size, size);
                ctx.globalAlpha = 1.0;
                return;
            }
            const s = size;
            ctx.fillStyle = 'rgba(136, 19, 55, 0.7)';
            ctx.beginPath();
            ctx.ellipse(x + s * 0.5, y + s * 0.5, s * 0.25, s * 0.15, Math.random(), 0, Math.PI * 2);
            ctx.fill();
            for (let i = 0; i < 3; i++) {
                const dx = (Math.random() - 0.5) * s * 0.4;
                const dy = (Math.random() - 0.5) * s * 0.3;
                ctx.beginPath();
                ctx.arc(x + s * 0.5 + dx, y + s * 0.5 + dy, s * 0.03 + Math.random() * s * 0.04, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    },
    cobweb: {
        draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
            const s = size;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(x + s * 0.3, y + s * 0.1, x + s * 0.6, y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(x + s * 0.1, y + s * 0.3, x, y + s * 0.6);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + s * 0.4, y + s * 0.4);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + s * 0.15, y + s * 0.05);
            ctx.quadraticCurveTo(x + s * 0.2, y + s * 0.2, x + s * 0.05, y + s * 0.15);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + s * 0.3, y + s * 0.1);
            ctx.quadraticCurveTo(x + s * 0.25, y + s * 0.25, x + s * 0.1, y + s * 0.3);
            ctx.stroke();
        }
    },
    waterPool: {
        draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, frame: number = 0) => {
            const s = size;
            const ripple = Math.sin(frame * 0.1) * 0.02;
            ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
            ctx.beginPath();
            ctx.ellipse(x + s * 0.5, y + s * 0.6, s * 0.35 + ripple * s, s * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(147, 197, 253, 0.5)';
            ctx.beginPath();
            ctx.ellipse(x + s * 0.4, y + s * 0.55, s * 0.1, s * 0.05, -0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

export function drawEnvironmentSprite(ctx: CanvasRenderingContext2D, type: string, isoX: number, isoY: number, size: number, ...args: any[]) {
    // Calculate bounding box position
    const drawX = isoX - size / 2;
    const drawY = isoY + TILE_HEIGHT / 2 - size * 0.85;

    if (ENV_SPRITES[type]) {
        ENV_SPRITES[type].draw(ctx, drawX, drawY, size, ...args);
    }
}
