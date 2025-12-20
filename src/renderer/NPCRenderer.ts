// NPC Sprites
export const NPC_SPRITES: Record<string, { draw: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => void }> = {
    merchant: {
        draw: (ctx, x, y, size) => {
            const s = size;
            // Robe
            ctx.fillStyle = "#854d0e";
            ctx.beginPath();
            ctx.moveTo(x + s * 0.5, y + s * 0.25);
            ctx.lineTo(x + s * 0.8, y + s * 0.9);
            ctx.lineTo(x + s * 0.2, y + s * 0.9);
            ctx.closePath();
            ctx.fill();
            // Face
            ctx.fillStyle = "#d4a574";
            ctx.beginPath();
            ctx.arc(x + s * 0.5, y + s * 0.28, s * 0.14, 0, Math.PI * 2);
            ctx.fill();
            // Beard
            ctx.fillStyle = "#78716c";
            ctx.beginPath();
            ctx.ellipse(x + s * 0.5, y + s * 0.38, s * 0.1, s * 0.08, 0, 0, Math.PI);
            ctx.fill();
            // Hat
            ctx.fillStyle = "#92400e";
            ctx.beginPath();
            ctx.arc(x + s * 0.5, y + s * 0.2, s * 0.12, Math.PI, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(x + s * 0.3, y + s * 0.18, s * 0.4, s * 0.06);
            // Gold coin indicator
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath();
            ctx.arc(x + s * 0.7, y + s * 0.7, s * 0.08, 0, Math.PI * 2);
            ctx.fill();
        },
    },
    quest_elder: {
        draw: (ctx, x, y, size) => {
            const s = size;
            // Robe
            ctx.fillStyle = "#1e3a5f";
            ctx.beginPath();
            ctx.moveTo(x + s * 0.5, y + s * 0.25);
            ctx.lineTo(x + s * 0.75, y + s * 0.9);
            ctx.lineTo(x + s * 0.25, y + s * 0.9);
            ctx.closePath();
            ctx.fill();
            // Face
            ctx.fillStyle = "#fcd5b8";
            ctx.beginPath();
            ctx.arc(x + s * 0.5, y + s * 0.28, s * 0.14, 0, Math.PI * 2);
            ctx.fill();
            // Long white beard
            ctx.fillStyle = "#e5e5e5";
            ctx.beginPath();
            ctx.moveTo(x + s * 0.35, y + s * 0.35);
            ctx.quadraticCurveTo(
                x + s * 0.5,
                y + s * 0.7,
                x + s * 0.65,
                y + s * 0.35
            );
            ctx.fill();
            // Hood
            ctx.fillStyle = "#1e40af";
            ctx.beginPath();
            ctx.arc(x + s * 0.5, y + s * 0.22, s * 0.16, Math.PI, Math.PI * 2);
            ctx.fill();
            // Staff
            ctx.fillStyle = "#78350f";
            ctx.fillRect(x + s * 0.72, y + s * 0.15, s * 0.05, s * 0.7);
            ctx.fillStyle = "#60a5fa";
            ctx.shadowColor = "#60a5fa";
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(x + s * 0.745, y + s * 0.15, s * 0.06, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        },
    },
    sage: {
        draw: (ctx, x, y, size) => {
            const s = size;
            // Mystical robe
            ctx.fillStyle = "#581c87";
            ctx.beginPath();
            ctx.moveTo(x + s * 0.5, y + s * 0.2);
            ctx.lineTo(x + s * 0.8, y + s * 0.9);
            ctx.lineTo(x + s * 0.2, y + s * 0.9);
            ctx.closePath();
            ctx.fill();
            // Glowing symbols
            ctx.strokeStyle = "#a855f7";
            ctx.shadowColor = "#a855f7";
            ctx.shadowBlur = 6;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x + s * 0.5, y + s * 0.55, s * 0.12, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
            // Face (ethereal)
            ctx.fillStyle = "#c4b5fd";
            ctx.beginPath();
            ctx.arc(x + s * 0.5, y + s * 0.28, s * 0.12, 0, Math.PI * 2);
            ctx.fill();
            // Eyes (glowing)
            ctx.fillStyle = "#a855f7";
            ctx.shadowColor = "#a855f7";
            ctx.shadowBlur = 8;
            ctx.fillRect(x + s * 0.42, y + s * 0.25, s * 0.06, s * 0.04);
            ctx.fillRect(x + s * 0.52, y + s * 0.25, s * 0.06, s * 0.04);
            ctx.shadowBlur = 0;
        },
    },
};

// Draw NPC sprite
export function drawNPCSprite(ctx: CanvasRenderingContext2D, npcType: string, x: number, y: number, size: number): void {
    if (NPC_SPRITES[npcType]) {
        NPC_SPRITES[npcType].draw(ctx, x, y, size);
    }
}
