import { BOSS_CONSTANTS } from './BossConstants';

// Draw large enemy sprite (2x2 boss)
export function drawLargeBossSprite(
    ctx: CanvasRenderingContext2D,
    spriteName: string,
    x: number,
    y: number,
    tileSize: number,
    frame: number = 0
): void {
    const s = tileSize * 2; // Double size

    switch (spriteName) {
        case "ancient_dragon":
            drawAncientDragonLarge(ctx, x, y, s, frame);
            break;
        case "demon_lord":
            drawDemonLordLarge(ctx, x, y, s, frame);
            break;
        case "golem_king":
            drawGolemKingLarge(ctx, x, y, s, frame);
            break;
        default:
            // Fallback
            ctx.fillStyle = "#ef4444";
            ctx.fillRect(x, y, s, s);
    }
}

function drawAncientDragonLarge(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, frame: number): void {
    const s = size;

    // Wing animation
    const wingFlap = Math.sin(frame * 0.1) * 0.05;

    // Body
    // Body
    ctx.fillStyle = BOSS_CONSTANTS.DRAGON.COLOR_BODY;
    ctx.beginPath();
    ctx.ellipse(
        x + s * BOSS_CONSTANTS.DRAGON.BODY_X,
        y + s * BOSS_CONSTANTS.DRAGON.BODY_Y,
        s * BOSS_CONSTANTS.DRAGON.BODY_RX,
        s * BOSS_CONSTANTS.DRAGON.BODY_RY,
        0, 0, Math.PI * 2
    );
    ctx.fill();

    // Neck
    ctx.fillStyle = "#b45309";
    ctx.beginPath();
    ctx.moveTo(x + s * 0.35, y + s * 0.4);
    ctx.quadraticCurveTo(x + s * 0.2, y + s * 0.25, x + s * 0.3, y + s * 0.15);
    ctx.lineTo(x + s * 0.45, y + s * 0.2);
    ctx.quadraticCurveTo(x + s * 0.35, y + s * 0.3, x + s * 0.4, y + s * 0.4);
    ctx.fill();

    // Head
    // Head
    ctx.fillStyle = BOSS_CONSTANTS.DRAGON.COLOR_HEAD;
    ctx.beginPath();
    ctx.ellipse(
        x + s * BOSS_CONSTANTS.DRAGON.HEAD_X,
        y + s * BOSS_CONSTANTS.DRAGON.HEAD_Y,
        s * BOSS_CONSTANTS.DRAGON.HEAD_RX,
        s * BOSS_CONSTANTS.DRAGON.HEAD_RY,
        -0.3,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Horns
    ctx.fillStyle = "#78350f";
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(x + s * (0.2 + i * 0.05), y + s * 0.08);
        ctx.lineTo(x + s * (0.22 + i * 0.05), y + s * (-0.02 + i * 0.01));
        ctx.lineTo(x + s * (0.26 + i * 0.05), y + s * 0.06);
        ctx.fill();
    }

    // Eyes (glowing)
    ctx.fillStyle = "#ef4444";
    ctx.shadowColor = "#ef4444";
    ctx.shadowBlur = 10;
    ctx.fillRect(x + s * 0.22, y + s * 0.1, s * 0.04, s * 0.03);
    ctx.fillRect(x + s * 0.3, y + s * 0.09, s * 0.04, s * 0.03);
    ctx.shadowBlur = 0;

    // Wings
    ctx.fillStyle = "#b45309";
    // Left wing
    ctx.beginPath();
    ctx.moveTo(x + s * 0.3, y + s * 0.45);
    ctx.quadraticCurveTo(
        x - s * 0.1,
        y + s * (0.15 + wingFlap),
        x + s * 0.05,
        y + s * 0.4
    );
    ctx.quadraticCurveTo(
        x - s * 0.05,
        y + s * (0.25 + wingFlap),
        x + s * 0.15,
        y + s * 0.45
    );
    ctx.quadraticCurveTo(
        x + s * 0.0,
        y + s * (0.35 + wingFlap),
        x + s * 0.25,
        y + s * 0.5
    );
    ctx.fill();
    // Right wing
    ctx.beginPath();
    ctx.moveTo(x + s * 0.7, y + s * 0.45);
    ctx.quadraticCurveTo(
        x + s * 1.1,
        y + s * (0.15 - wingFlap),
        x + s * 0.95,
        y + s * 0.4
    );
    ctx.quadraticCurveTo(
        x + s * 1.05,
        y + s * (0.25 - wingFlap),
        x + s * 0.85,
        y + s * 0.45
    );
    ctx.quadraticCurveTo(
        x + s * 1.0,
        y + s * (0.35 - wingFlap),
        x + s * 0.75,
        y + s * 0.5
    );
    ctx.fill();

    // Tail
    ctx.fillStyle = "#92400e";
    ctx.beginPath();
    ctx.moveTo(x + s * 0.7, y + s * 0.6);
    ctx.quadraticCurveTo(x + s * 0.95, y + s * 0.7, x + s * 0.9, y + s * 0.85);
    ctx.lineTo(x + s * 0.85, y + s * 0.82);
    ctx.quadraticCurveTo(x + s * 0.88, y + s * 0.68, x + s * 0.65, y + s * 0.58);
    ctx.fill();

    // Tail spikes
    ctx.fillStyle = "#78350f";
    ctx.beginPath();
    ctx.moveTo(x + s * 0.88, y + s * 0.84);
    ctx.lineTo(x + s * 0.95, y + s * 0.9);
    ctx.lineTo(x + s * 0.85, y + s * 0.88);
    ctx.fill();

    // Legs
    ctx.fillStyle = "#b45309";
    ctx.fillRect(x + s * 0.3, y + s * 0.7, s * 0.1, s * 0.2);
    ctx.fillRect(x + s * 0.55, y + s * 0.7, s * 0.1, s * 0.2);

    // Claws
    ctx.fillStyle = "#1c1917";
    ctx.fillRect(x + s * 0.28, y + s * 0.88, s * 0.14, s * 0.05);
    ctx.fillRect(x + s * 0.53, y + s * 0.88, s * 0.14, s * 0.05);

    // Fire breath glow
    if (frame % 60 < 30) {
        ctx.fillStyle = "rgba(251, 146, 60, 0.4)";
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.ellipse(
            x + s * 0.15,
            y + s * 0.18,
            s * 0.08,
            s * 0.04,
            -0.5,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function drawDemonLordLarge(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, frame: number): void {
    const s = size;

    // Body
    // Body
    ctx.fillStyle = BOSS_CONSTANTS.DEMON.COLOR_BODY;
    ctx.fillRect(
        x + s * BOSS_CONSTANTS.DEMON.BODY_X,
        y + s * BOSS_CONSTANTS.DEMON.BODY_Y,
        s * BOSS_CONSTANTS.DEMON.BODY_W,
        s * BOSS_CONSTANTS.DEMON.BODY_H
    );

    // Head
    // Head
    ctx.fillStyle = BOSS_CONSTANTS.DEMON.COLOR_HEAD;
    ctx.beginPath();
    ctx.arc(
        x + s * BOSS_CONSTANTS.DEMON.HEAD_X,
        y + s * BOSS_CONSTANTS.DEMON.HEAD_Y,
        s * BOSS_CONSTANTS.DEMON.HEAD_R,
        0, Math.PI * 2
    );
    ctx.fill();

    // Horns (large, curved)
    ctx.fillStyle = "#1c1917";
    ctx.beginPath();
    ctx.moveTo(x + s * 0.32, y + s * 0.2);
    ctx.quadraticCurveTo(x + s * 0.15, y + s * 0.0, x + s * 0.1, y + s * 0.15);
    ctx.lineTo(x + s * 0.18, y + s * 0.18);
    ctx.quadraticCurveTo(x + s * 0.22, y + s * 0.08, x + s * 0.36, y + s * 0.22);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + s * 0.68, y + s * 0.2);
    ctx.quadraticCurveTo(x + s * 0.85, y + s * 0.0, x + s * 0.9, y + s * 0.15);
    ctx.lineTo(x + s * 0.82, y + s * 0.18);
    ctx.quadraticCurveTo(x + s * 0.78, y + s * 0.08, x + s * 0.64, y + s * 0.22);
    ctx.fill();

    // Glowing eyes
    ctx.fillStyle = "#fbbf24";
    ctx.shadowColor = "#fbbf24";
    ctx.shadowBlur = 12;
    ctx.fillRect(x + s * 0.4, y + s * 0.24, s * 0.07, s * 0.06);
    ctx.fillRect(x + s * 0.53, y + s * 0.24, s * 0.07, s * 0.06);
    ctx.shadowBlur = 0;

    // Wings (demonic)
    ctx.fillStyle = "#450a0a";
    // Left wing
    ctx.beginPath();
    ctx.moveTo(x + s * 0.25, y + s * 0.4);
    ctx.lineTo(x - s * 0.1, y + s * 0.1);
    ctx.lineTo(x + s * 0.0, y + s * 0.25);
    ctx.lineTo(x - s * 0.05, y + s * 0.35);
    ctx.lineTo(x + s * 0.1, y + s * 0.45);
    ctx.lineTo(x + s * 0.05, y + s * 0.55);
    ctx.lineTo(x + s * 0.2, y + s * 0.5);
    ctx.fill();
    // Right wing
    ctx.beginPath();
    ctx.moveTo(x + s * 0.75, y + s * 0.4);
    ctx.lineTo(x + s * 1.1, y + s * 0.1);
    ctx.lineTo(x + s * 1.0, y + s * 0.25);
    ctx.lineTo(x + s * 1.05, y + s * 0.35);
    ctx.lineTo(x + s * 0.9, y + s * 0.45);
    ctx.lineTo(x + s * 0.95, y + s * 0.55);
    ctx.lineTo(x + s * 0.8, y + s * 0.5);
    ctx.fill();

    // Flame aura
    if (frame % 10 < 5) {
        ctx.fillStyle = "rgba(239, 68, 68, 0.3)";
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(x + s * 0.5, y + s * 0.5, s * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Legs
    ctx.fillStyle = "#991b1b";
    ctx.fillRect(x + s * 0.3, y + s * 0.75, s * 0.12, s * 0.18);
    ctx.fillRect(x + s * 0.58, y + s * 0.75, s * 0.12, s * 0.18);

    // Hooves
    ctx.fillStyle = "#1c1917";
    ctx.fillRect(x + s * 0.28, y + s * 0.9, s * 0.16, s * 0.06);
    ctx.fillRect(x + s * 0.56, y + s * 0.9, s * 0.16, s * 0.06);
}

function drawGolemKingLarge(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, _frame: number): void {
    const s = size;

    // Body (massive)
    // Body (massive)
    ctx.fillStyle = BOSS_CONSTANTS.GOLEM.COLOR_ROCKS;
    ctx.fillRect(x + s * 0.2, y + s * 0.35, s * 0.6, s * 0.5);

    // Head
    // Head
    ctx.fillStyle = BOSS_CONSTANTS.GOLEM.COLOR_BODY;
    ctx.beginPath();
    ctx.arc(x + s * 0.5, y + s * 0.28, s * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Crown
    ctx.fillStyle = BOSS_CONSTANTS.GOLEM.COLOR_CROWN;
    ctx.beginPath();
    ctx.moveTo(x + s * 0.3, y + s * 0.15);
    ctx.lineTo(x + s * 0.35, y + s * 0.02);
    ctx.lineTo(x + s * 0.42, y + s * 0.1);
    ctx.lineTo(x + s * 0.5, y + s * 0.0);
    ctx.lineTo(x + s * 0.58, y + s * 0.1);
    ctx.lineTo(x + s * 0.65, y + s * 0.02);
    ctx.lineTo(x + s * 0.7, y + s * 0.15);
    ctx.closePath();
    ctx.fill();

    // Gem in crown
    ctx.fillStyle = BOSS_CONSTANTS.GOLEM.COLOR_GEM;
    ctx.shadowColor = BOSS_CONSTANTS.GOLEM.COLOR_GEM;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x + s * 0.5, y + s * 0.08, s * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Glowing eyes
    ctx.fillStyle = BOSS_CONSTANTS.GOLEM.COLOR_EYES;
    ctx.shadowColor = BOSS_CONSTANTS.GOLEM.COLOR_EYES;
    ctx.shadowBlur = 12;
    ctx.fillRect(x + s * 0.38, y + s * 0.24, s * 0.08, s * 0.08);
    ctx.fillRect(x + s * 0.54, y + s * 0.24, s * 0.08, s * 0.08);
    ctx.shadowBlur = 0;

    // Rune lines on body
    ctx.strokeStyle = BOSS_CONSTANTS.GOLEM.COLOR_RUNES;
    ctx.shadowColor = BOSS_CONSTANTS.GOLEM.COLOR_RUNES;
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + s * 0.35, y + s * 0.45);
    ctx.lineTo(x + s * 0.5, y + s * 0.55);
    ctx.lineTo(x + s * 0.65, y + s * 0.45);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + s * 0.5, y + s * 0.55);
    ctx.lineTo(x + s * 0.5, y + s * 0.75);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Arms (massive)
    ctx.fillStyle = "#57534e";
    ctx.fillRect(x + s * 0.02, y + s * 0.38, s * 0.2, s * 0.18);
    ctx.fillRect(x + s * 0.78, y + s * 0.38, s * 0.2, s * 0.18);

    // Fists
    ctx.fillStyle = "#44403c";
    ctx.beginPath();
    ctx.arc(x + s * 0.05, y + s * 0.56, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + s * 0.95, y + s * 0.56, s * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = "#44403c";
    ctx.fillRect(x + s * 0.25, y + s * 0.8, s * 0.18, s * 0.15);
    ctx.fillRect(x + s * 0.57, y + s * 0.8, s * 0.18, s * 0.15);
}
