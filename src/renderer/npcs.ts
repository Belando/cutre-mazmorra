import { soundManager } from "@/engine/systems/SoundSystem";
import { spriteManager } from "@/engine/core/SpriteManager";
import { TILE_HEIGHT } from '@/data/constants';

// Reusing the shadow logic concept, but keeping it local to avoid circular deps if any
const drawIsoShadow = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    const s = size;
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    // Center is x + s/2, y + s*0.85
    ctx.ellipse(x + s * 0.5, y + s * 0.85, s * 0.3, s * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
};

export const NPC_SPRITES: Record<string, { draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, frame: number) => void }> = {
    merchant: {
        // Merchant is handled by generic sprite drawer now, or we can add specific logic here if needed.
        // For now, leaving it empty to fall through to generic sprite drawer in drawNPC,
        // OR defining a simple opacity/visual fix if needed.
        draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, frame: number) => {
            // Placeholder to satisfy type, though drawNPC prefers spriteManager.
            // If we return, drawNPC continues? No, drawNPC checks if spriteKey exists in NPC_SPRITES.
            // Actually drawNPC checks spriteManager FIRST.
            // If spriteManager has 'merchant', it uses that.
            // So this entry in NPC_SPRITES is ignored for 'merchant' if assets.ts has it.
            // But valid JS object cannot have duplicate keys.
        },
    },

    quest_elder: {
        draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, frame: number) => {
            const s = size;
            const breath = Math.sin(frame * 0.04) * s * 0.01;

            ctx.fillStyle = "#1e3a5f";
            ctx.beginPath();
            ctx.moveTo(x + s * 0.5, y + s * 0.25 + breath);
            ctx.lineTo(x + s * 0.75, y + s * 0.9);
            ctx.lineTo(x + s * 0.25, y + s * 0.9);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = "#fbbf24";
            ctx.fillRect(x + s * 0.48, y + s * 0.4 + breath, s * 0.04, s * 0.5);

            ctx.fillStyle = "#fcd5b8";
            ctx.beginPath();
            ctx.arc(x + s * 0.5, y + s * 0.28 + breath, s * 0.14, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#e5e5e5";
            ctx.beginPath();
            ctx.moveTo(x + s * 0.35, y + s * 0.35 + breath);
            ctx.quadraticCurveTo(x + s * 0.5, y + s * 0.7 + breath, x + s * 0.65, y + s * 0.35 + breath);
            ctx.fill();

            ctx.fillStyle = "#1e40af";
            ctx.beginPath();
            ctx.arc(x + s * 0.5, y + s * 0.22 + breath, s * 0.16, Math.PI, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#78350f";
            ctx.fillRect(x + s * 0.72, y + s * 0.15, s * 0.05, s * 0.75);

            const glow = 6 + Math.sin(frame * 0.1) * 3;
            ctx.fillStyle = "#60a5fa";
            ctx.shadowColor = "#60a5fa";
            ctx.shadowBlur = glow;
            ctx.beginPath();
            ctx.arc(x + s * 0.745, y + s * 0.15, s * 0.07, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        },
    },

    sage: {
        draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, frame: number) => {
            const s = size;
            const hover = Math.sin(frame * 0.08) * s * 0.05;
            const yAnim = y + hover;

            ctx.fillStyle = "#581c87";
            ctx.beginPath();
            ctx.moveTo(x + s * 0.5, yAnim + s * 0.2);
            ctx.lineTo(x + s * 0.8, yAnim + s * 0.9);
            ctx.lineTo(x + s * 0.2, yAnim + s * 0.9);
            ctx.closePath();
            ctx.fill();

            ctx.save();
            ctx.translate(x + s * 0.5, yAnim + s * 0.55);
            ctx.rotate(frame * 0.05);
            ctx.strokeStyle = "#d8b4fe";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, -s * 0.1);
            ctx.lineTo(s * 0.09, s * 0.05);
            ctx.lineTo(-s * 0.09, s * 0.05);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = "#c4b5fd";
            ctx.beginPath();
            ctx.arc(x + s * 0.5, yAnim + s * 0.28, s * 0.12, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#a855f7";
            ctx.fillRect(x + s * 0.42, yAnim + s * 0.25, s * 0.06, s * 0.04);
            ctx.fillRect(x + s * 0.52, yAnim + s * 0.25, s * 0.06, s * 0.04);

            const bookX = x + s * 0.85;
            const bookY = yAnim + s * 0.3 + Math.cos(frame * 0.1) * s * 0.05;

            ctx.fillStyle = "#451a03";
            ctx.fillRect(bookX, bookY, s * 0.25, s * 0.3);
            ctx.fillStyle = "#fefce8";
            ctx.fillRect(bookX + 2, bookY + 2, s * 0.2, s * 0.25);

            ctx.fillStyle = "#a855f7";
            ctx.fillRect(bookX + 4, bookY + 6, s * 0.15, 1);
            ctx.fillRect(bookX + 4, bookY + 10, s * 0.10, 1);
        },
    },

    // Old blacksmith removed

};

// Helper to determine row based on direction (assuming standard: 0:Down, 1:Left, 2:Right, 3:Up)
const getDirRow = (dx: number, dy: number): number => {
    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? 2 : 1; // Right : Left
    } else {
        return dy > 0 ? 0 : 3; // Down : Up (screen y goes down)
    }
    return 0; // Default Down
};

export function drawNPC(ctx: CanvasRenderingContext2D, npc: any, isoX: number, isoY: number, size: number, frame: number = 0) {
    // Calculate bounding box position
    const drawX = isoX - size / 2;
    const drawY = isoY + TILE_HEIGHT / 2 - size * 0.85;

    // Draw Shadow
    drawIsoShadow(ctx, drawX, drawY, size);

    const npcType = npc.type || npc;

    // --- 1. SPECIAL: BLACKSMITH (Composite) ---
    if (npcType === 'blacksmith') {
        // SCALE CONFIG
        const anvilScale = 1.3;
        const workerScale = 3.0;

        // 1. Draw Static Anvil
        const anvilImg = spriteManager.get('anvil');
        const anvilSize = size * anvilScale;

        // Anvil Position: Center of tile, slightly lower
        const anvilX = drawX - (anvilSize - size) / 2;
        const anvilY = drawY - (anvilSize - size) + size * 0.5; // Push down more

        if (anvilImg) {
            ctx.drawImage(anvilImg as HTMLImageElement, anvilX, anvilY, anvilSize, anvilSize);
        }

        // 2. Draw Animated Worker
        const workerImg = spriteManager.get('blacksmith_worker');
        if (workerImg) {
            const img = workerImg as HTMLImageElement;
            const cols = 4;
            const rows = 1;
            const frameWidth = img.width / cols;
            const frameHeight = img.height / rows;
            const speed = 24;
            const safeFrame = Math.floor(frame / speed) % cols;

            // Worker Position
            const workerSize = size * workerScale;
            // Center horizontally rel to tile, then offset
            const workerX = drawX - (workerSize - size) / 2 + size * 0.1;
            // Fix floating: Move DOWN significantly.
            // Using size * 0.7 pushes him down further (was 0.6)
            const workerY = drawY - (workerSize - size) + size * 0.7;

            ctx.drawImage(img,
                safeFrame * frameWidth, 0, frameWidth, frameHeight,
                workerX, workerY, workerSize, workerSize
            );
        }
        return;
    }

    // --- 2. SPECIAL: MERCHANT (1x4 Sheet Correction) ---
    if (npcType === 'merchant') {
        const img = spriteManager.get('merchant');
        if (img) {
            const image = img as HTMLImageElement;
            const cols = 4; // Force 4 columns
            const rows = 1; // Force 1 row
            const frameWidth = image.width / cols;
            const frameHeight = image.height / rows;
            const speed = 24;
            const safeFrame = Math.floor(frame / speed) % cols;

            // SCALED UP MERCHANT: 2.0x (Previously 1.5x)
            const drawSize = size * 2.0;
            const offsetX = (size - drawSize) / 2;
            // Tune Y offset for larger size
            const adjustedOffsetY = (size - drawSize) + (size * 0.5);

            ctx.drawImage(image,
                safeFrame * frameWidth, 0, frameWidth, frameHeight,
                drawX + offsetX, drawY + adjustedOffsetY, drawSize, drawSize
            );
            return;
        }
    }

    // --- 3. GENERIC SPRITE FALLBACK (Elder, Sage, etc.) ---
    const spriteKey = npcType === "quest_giver" ? "quest_elder" :
        npcType === "sage" ? "sage" :
            npcType; // default to type name

    const img = spriteManager.get(spriteKey);
    if (img) {
        const image = img as HTMLImageElement;
        const cols = 4;
        const rows = 1;
        const frameWidth = image.width / cols;
        const frameHeight = image.height / rows;
        const speed = 24;
        const safeFrame = Math.floor(frame / speed) % cols;

        const drawSize = size * 1.5;
        const offsetX = (size - drawSize) / 2;
        const adjustedOffsetY = (size - drawSize) + (size * 0.35);

        ctx.drawImage(image,
            safeFrame * frameWidth, 0, frameWidth, frameHeight,
            drawX + offsetX, drawY + adjustedOffsetY, drawSize, drawSize
        );
        return;
    }

    // --- 4. PROCEDURAL FALLBACKS (If any left in NPC_SPRITES) ---
    if (NPC_SPRITES[npcType]) {
        NPC_SPRITES[npcType].draw(ctx, drawX, drawY, size, frame);
        return;
    }

    // --- 5. FINAL ERROR FALLBACK ---
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(drawX + size / 2, drawY + size / 2, size / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.stroke();
}
