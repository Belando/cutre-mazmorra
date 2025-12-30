import { TILE, TILE_WIDTH, TILE_HEIGHT } from "@/data/constants";
import { getThemeForFloor, DungeonTheme } from "@/components/game/DungeonThemes";
import { drawEnvironmentSprite } from "./environment";
import { GameState } from "@/types";
import { toScreen } from "@/utils/isometric";
import { spriteManager } from "@/engine/core/SpriteManager";

// Helper to tint and draw an image
// We use a cached offscreen canvas pattern or just simple composite operations if performance allows.
// For now, explicit composite operation per tile is expensive but valid for prototype.
// Optimization: Check if we can cache tinted sprites?
// Given the number of tiles, caching might be memory heavy.
// Let's stick to globalCompositeOperation for now. It might cause frame drops on low end.
// BETTER: Draw the sprite, then draw a semi-transparent colored tile over it using "multiply" or "overlay" blending.

function drawTintedSprite(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string
) {
    // Draw Sprite
    ctx.drawImage(img, x, y, w, h);

    // Tint
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = color;
    // We need to mask the fill to the sprite shape.
    // This is hard without offscreen canvas per draw.
    // Approximations:
    // 1. Just draw a diamond shape over it (works for floor).
    // 2. For walls, it's complex.

    // Alternative: Don't tint with multiply. Just colored overlay.
    // Or, use the sprite as gray and the theme provides the color.

    // Let's try drawing with "source-atop" on an offscreen canvas? no too slow.
    // Let's just draw the standard sprite for now and maybe apply a simple overlay if needed.
    // Actually, converting the theme colors to a "tint" for a gray sprite is best.

    // For this task, let's try to just draw the sprite. If the user wants specific colors per level,
    // we might lose that feature or need to implement proper tinting.
    // Given the request "sprites for walls and soils", usually implies a specific look.
    // I will try to respect the theme by drawing a colored overlay with "soft-light" or "overlay" if supported,
    // or just low opacity "source-over".

    ctx.globalCompositeOperation = "source-atop"; // This only works if we layer it properly, difficult in single canvas.

    // REVERT TO SIMPLE: Draw Sprite. Then Draw Diamond Overlay with low opacity to hint theme.
    ctx.globalCompositeOperation = "source-over"; // Reset
}

function drawSpriteIsoFloor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
    const img = spriteManager.get('floor');
    if (img) {
        ctx.drawImage(img, x, y, w, h);

        // Apply subtle theme tint
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.3; // Tint strength
        ctx.globalCompositeOperation = "overlay"; // Blending mode

        // Draw diamond mask manually for the tint
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h / 2);
        ctx.lineTo(x + w / 2, y + h);
        ctx.lineTo(x, y + h / 2);
        ctx.fill();

        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1.0;
    } else {
        // Fallback
        drawIsoTile(ctx, x, y, color);
    }
}

function drawSpriteIsoWall(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
    const img = spriteManager.get('wall');
    if (img) {
        // Wall sprites usually need to be anchored at the bottom.
        // Our sprite is 96x144 (approx). 
        // Targeted tile is 96x48 (floor).
        // Wall should stick up. 
        // Let's assume the sprite covers the floor diamond + verticality.
        // If we draw it at (x, y - offset), we need to calculate offset.
        // The sprite likely includes the top face.

        // Heuristic: scale width to w. Scale height proportionally? 
        // Original: 96x144. Aspect 0.66.
        // Render target w = 96.
        // New H = 144. 
        // Shift Y up by (144 - 48) = 96?
        // Let's try drawing it so the bottom aligns with tile bottom.

        const aspect = img.height / img.width;
        const drawH = w * aspect;
        const drawY = y - (drawH - h); // Align bottoms

        ctx.drawImage(img, x, drawY, w, drawH);

        // Tinting (simplified, just a rect overlay is pointless for complex shape)
        // Let's skip tinting for walls for now to preserve texture quality, 
        // OR standard tinting.

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.2;
        ctx.globalCompositeOperation = "overlay";
        ctx.fillRect(x, drawY, w, drawH);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1.0;

    } else {
        // Fallback to procedural
        const theme = { wallDetail: color } as any; // Hack fallback
        drawHighResIsoWall(ctx, x, y, color, theme);
    }
}

// Helper to draw an isometric tile (diamond) - Keeping as fallback
function drawIsoTile(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + TILE_WIDTH / 2, y);
    ctx.lineTo(x + TILE_WIDTH, y + TILE_HEIGHT / 2);
    ctx.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT);
    ctx.lineTo(x, y + TILE_HEIGHT / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

// Keeping procedural fallback for safety
function drawHighResIsoWall(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, theme: DungeonTheme) {
    const WALL_HEIGHT = TILE_HEIGHT * 1.5;
    const topY = y - WALL_HEIGHT;
    drawIsoTile(ctx, x, topY, theme.wallDetail);

    // ... [Rest of procedural code omitted for brevity as we prioritize sprites]
    // Re-implementing simplified procedural render just in case sprite fails
    const rightColor = adjustBrightness(color, -40);
    ctx.fillStyle = rightColor;
    ctx.beginPath();
    ctx.moveTo(x + TILE_WIDTH, topY + TILE_HEIGHT / 2); // Right corner
    ctx.lineTo(x + TILE_WIDTH, topY + TILE_HEIGHT / 2 + WALL_HEIGHT);
    ctx.lineTo(x + TILE_WIDTH / 2, topY + TILE_HEIGHT + WALL_HEIGHT); // Bottom corner
    ctx.lineTo(x + TILE_WIDTH / 2, topY + TILE_HEIGHT / 2); // Center
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, topY + TILE_HEIGHT / 2); // Left corner
    ctx.lineTo(x, topY + TILE_HEIGHT / 2 + WALL_HEIGHT);
    ctx.lineTo(x + TILE_WIDTH / 2, topY + TILE_HEIGHT + WALL_HEIGHT); // Bottom corner
    ctx.lineTo(x + TILE_WIDTH / 2, topY + TILE_HEIGHT / 2); // Center
    ctx.fill();

    // Highlight
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath(); ctx.moveTo(x + TILE_WIDTH / 2, topY + TILE_HEIGHT / 2); ctx.lineTo(x + TILE_WIDTH / 2, topY + TILE_HEIGHT + WALL_HEIGHT); ctx.stroke();
}

function adjustBrightness(hex: string, amount: number) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

export function drawMap(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    offsetX: number,
    offsetY: number,
    viewportWidth: number,
    viewportHeight: number
) {
    const { map, explored, visible, level } = state;
    const theme = getThemeForFloor(level);

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (theme.fogColor) {
        ctx.fillStyle = theme.fogColor;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const cameraScreen = toScreen(offsetX, offsetY);

    const padding = 2;
    const rangeX = Math.ceil(viewportWidth / 2) + padding;
    const rangeY = Math.ceil(viewportHeight / 2) + padding;

    const startX = Math.max(0, Math.floor(offsetX - rangeX));
    const endX = Math.min(map[0].length, Math.ceil(offsetX + rangeX + 4));
    const startY = Math.max(0, Math.floor(offsetY - rangeY));
    const endY = Math.min(map.length, Math.ceil(offsetY + rangeY + 4));

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const isExplored = explored[y]?.[x];
            const isVisible = visible[y]?.[x];

            if (isExplored) {
                const tile = map[y][x];

                // Color calc
                const baseWallColor = isVisible ? theme.wall : adjustBrightness(theme.wall, -50);
                const baseFloorColor = isVisible ? theme.floor : adjustBrightness(theme.floor, -50);

                const isoPos = toScreen(x, y);
                // Adjust screen position to top-left of the bounding box for sprites?
                // toScreen returns "Top-Center" of the diamond usually? 
                // Let's check `toScreen` implementation in `isometric.ts`?
                // Assuming toScreen returns coordinates of (x,y) in ISO space.
                // Usually for drawing, we center around it.
                // The procedural code used `x - nothing` so toScreen returns top-left of bounding box?
                // procedural `drawIsoTile`: `moveTo(x, y)`. `lineTo(x+W/2, y+H/2)`.
                // So `x,y` passed to drawIsoTile is the Top-Center or Top-Left?
                // "moveTo(x, y); lineTo(x + TILE_WIDTH / 2..." implies `x,y` is Top-Center (if x is horizontal center?)
                // NO. `x, y` is the START point.
                // Diamond Top is (x + TILE_WIDTH/2, y) in standard drawing?
                // IN `drawIsoTile`: `moveTo(x, y)` -> No, `moveTo(x + TILE_WIDTH / 2, y)`!
                // Wait, previous code:
                /*
                function drawIsoTile(ctx, x, y, color) {
                   ctx.moveTo(x, y);
                   ctx.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
                   ...
                }
                */
                // That implied (x,y) was Top-Center? OR Left-Center?
                // Let's re-read the previous `drawIsoTile` I viewed in Step 297.
                /*
                function drawIsoTile(ctx, x, y, color) {
                     ctx.moveTo(x, y);
                     ctx.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
                     ctx.lineTo(x, y + TILE_HEIGHT);
                     ctx.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
                */
                // This means (x,y) IS THE TOP CORNER.
                // And it draws right to x + W/2, down to x, left to x - W/2.
                // So the DIAMOND is centered horizontally on X.
                // It extends X - W/2 to X + W/2.
                // And Y to Y + H.

                // So if I draw a sprite, `x` is the center X of the tile. `y` is the top Y.
                // Sprite drawing (drawImage) usually takes Top-Left corner.
                // So sprite X = screenX - TILE_WIDTH / 2.
                // Sprite Y = screenY.

                const screenX = centerX + (isoPos.x - cameraScreen.x);
                const screenY = centerY + (isoPos.y - cameraScreen.y);

                if (tile === TILE.WALL) {
                    // Draw Wall Sprite
                    // For Sprite, we convert bounds.
                    // drawSpriteIsoWall expects CenterX, TopY.
                    // Wait, helper `drawSpriteIsoWall` uses `drawY = y - ...`
                    // I will pass screenX - TILE_WIDTH/2 as LEFT coordinate to ease things?
                    // Let's standardize: helpers take bounding box Left, Top.

                    const drawX = screenX - TILE_WIDTH / 2;
                    const drawY = screenY; // Top of the tile

                    drawSpriteIsoWall(ctx, drawX, drawY, TILE_WIDTH, TILE_HEIGHT, baseWallColor);

                    // Decorations
                    if (isVisible) {
                        const wallSeed = (x * 11 + y * 17) % 100;
                        if (wallSeed < (level <= 4 ? 8 : 3)) {
                            drawEnvironmentSprite(ctx, "cobweb", screenX, screenY - TILE_HEIGHT, TILE_WIDTH);
                        }
                    }

                } else {
                    // Draw Floor Sprite
                    const drawX = screenX - TILE_WIDTH / 2;
                    const drawY = screenY;

                    drawSpriteIsoFloor(ctx, drawX, drawY, TILE_WIDTH, TILE_HEIGHT, baseFloorColor);

                    if (tile === TILE.STAIRS) {
                        drawEnvironmentSprite(ctx, 'stairs', screenX, screenY, TILE_WIDTH);
                    }
                    else if (tile === TILE.DOOR || tile === TILE.DOOR_OPEN) {
                        const type = (tile === TILE.DOOR_OPEN) ? 'door_open' : 'door_closed';
                        drawEnvironmentSprite(ctx, type, screenX, screenY - TILE_HEIGHT * 0.5, TILE_WIDTH);
                    }

                    const occupiedTiles = [TILE.DOOR, TILE.DOOR_OPEN, TILE.STAIRS, TILE.STAIRS_UP] as number[];
                    if (isVisible && !occupiedTiles.includes(tile)) {
                        const seed = (x * 7 + y * 13) % 100;
                        if (seed < 8 && level <= 4) {
                            drawEnvironmentSprite(ctx, "rubble", screenX, screenY, TILE_WIDTH);
                        }
                    }
                }
            }
        }
    }

    if (theme.lavaGlow) {
        ctx.fillStyle = "rgba(255, 100, 0, 0.05)";
        ctx.globalCompositeOperation = "screen";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.globalCompositeOperation = "source-over";
    }
}

export function getCameraTarget(player: { x: number, y: number }) {
    return { x: player.x, y: player.y };
}

export function lerpCamera(current: { x: number, y: number }, target: { x: number, y: number }, speed = 0.1) {
    if (Math.abs(target.x - current.x) < 0.01 && Math.abs(target.y - current.y) < 0.01) {
        return target;
    }
    return {
        x: current.x + (target.x - current.x) * speed,
        y: current.y + (target.y - current.y) * speed,
    };
}

