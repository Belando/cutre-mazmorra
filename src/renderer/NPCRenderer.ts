import { spriteManager } from '@/engine/core/SpriteManager';
import { TILE_HEIGHT } from '@/data/constants';

// NPC Sprites Configuration
// Maps npcType (from data/npcs.ts) to texture key and config
export const NPC_SPRITES: Record<string, { texture: string, frameSize: { x: number, y: number }, cols: number }> = {
    merchant: { texture: 'merchant', frameSize: { x: 256, y: 256 }, cols: 4 },
    quest_elder: { texture: 'quest_elder', frameSize: { x: 256, y: 256 }, cols: 4 },
    sage: { texture: 'sage', frameSize: { x: 256, y: 256 }, cols: 4 },
    blacksmith: { texture: 'blacksmith', frameSize: { x: 256, y: 256 }, cols: 4 },
};

// Draw NPC sprite
export function drawNPCSprite(ctx: CanvasRenderingContext2D, npcType: string, isoX: number, isoY: number, size: number): void {
    const config = NPC_SPRITES[npcType];

    // Draw Shadow
    drawShadow(ctx, isoX, isoY, size);

    if (config) {
        const img = spriteManager.get(config.texture);
        if (img) {
            // Convert Iso Top coordinate to Sprite Box Top-Left
            // Same logic as enemies
            const drawX = isoX - size / 2;
            const drawY = isoY + TILE_HEIGHT / 2 - size * 0.85;

            // Simple animation loop (Idle/Walk)
            const now = Date.now();
            const frameIndex = Math.floor(now / 150) % 4; // 4 frames animation loop

            // Assume "Idle" is usually the first row (Down) or we create a simple loop
            // Sheets are: Row 0=Down, 1=Left, 2=Right, 3=Up
            // We'll use "Down" (Row 0) as default idle for now, since they face the camera usually.
            // If we want them to face a direction, we'd need that info.
            // Standard Isometric RPG NPCs usually face Down-Left or Down-Right. 
            // Our sheets are: 0: Down, 1: Left, 2: Right, 3: Up.
            // Let's use Row 0 (Down) as default.

            const row = 0;
            const col = frameIndex;

            const fw = config.frameSize.x;
            const fh = config.frameSize.y;

            ctx.save();
            ctx.drawImage(img,
                col * fw, row * fh, fw, fh,
                drawX, drawY, size, size
            );
            ctx.restore();
            return;
        }
    }

    // Fallback if no sprite (shouldn't happen with correct assets)
    // ... [Previous procedural drawing fallback removed for brevity/cleanup]
}

const drawShadow = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const s = size;
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(x, y + TILE_HEIGHT / 2, s * 0.3, s * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
}

