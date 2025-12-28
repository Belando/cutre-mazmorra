import { TILE, TILE_WIDTH, TILE_HEIGHT } from "@/data/constants";
import { getThemeForFloor, DungeonTheme } from "@/components/game/DungeonThemes";
import { drawEnvironmentSprite } from "./environment";
import { GameState } from "@/types";
import { toScreen } from "@/utils/isometric";

// Helper to draw an isometric tile (diamond)
function drawIsoTile(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1; // Small overlap to fix grid gaps
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
    ctx.lineTo(x, y + TILE_HEIGHT);
    ctx.lineTo(x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function drawHighResIsoFloor(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, mapX: number, mapY: number) {
    drawIsoTile(ctx, x, y, color);

    // Add some noise/texture
    const seed = (mapX * 17 + mapY * 23) % 100;
    if (seed > 80) {
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.beginPath();
        ctx.moveTo(x, y + TILE_HEIGHT * 0.2);
        ctx.lineTo(x + TILE_WIDTH * 0.1, y + TILE_HEIGHT * 0.5);
        ctx.lineTo(x, y + TILE_HEIGHT * 0.8);
        ctx.lineTo(x - TILE_WIDTH * 0.1, y + TILE_HEIGHT * 0.5);
        ctx.fill();
    }
}

function drawHighResIsoWall(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, theme: DungeonTheme, _mapX: number, _mapY: number) {
    // Wall height
    const WALL_HEIGHT = TILE_HEIGHT * 1.5;

    // Top face (diamond) - The "roof" of the wall
    const topY = y - WALL_HEIGHT;
    drawIsoTile(ctx, x, topY, theme.wallDetail);

    // Right face
    ctx.fillStyle = adjustBrightness(color, -20);
    ctx.beginPath();
    ctx.moveTo(x, topY + TILE_HEIGHT);
    ctx.lineTo(x + TILE_WIDTH / 2, topY + TILE_HEIGHT / 2);
    ctx.lineTo(x + TILE_WIDTH / 2, topY + TILE_HEIGHT / 2 + WALL_HEIGHT);
    ctx.lineTo(x, topY + TILE_HEIGHT + WALL_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Left face
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, topY + TILE_HEIGHT);
    ctx.lineTo(x - TILE_WIDTH / 2, topY + TILE_HEIGHT / 2);
    ctx.lineTo(x - TILE_WIDTH / 2, topY + TILE_HEIGHT / 2 + WALL_HEIGHT);
    ctx.lineTo(x, topY + TILE_HEIGHT + WALL_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Highlights
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath();
    ctx.moveTo(x - TILE_WIDTH / 2, topY + TILE_HEIGHT / 2);
    ctx.lineTo(x, topY);
    ctx.lineTo(x, topY + 4);
    ctx.lineTo(x - TILE_WIDTH / 2, topY + TILE_HEIGHT / 2 + 4);
    ctx.fill();
}

function adjustBrightness(hex: string, amount: number) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

function getTileColors(floor: number) {
    const theme = getThemeForFloor(floor);
    return {
        [TILE.WALL]: theme.wall,
        [TILE.FLOOR]: theme.floor,
        [TILE.STAIRS]: theme.floor,
        [TILE.DOOR]: theme.wall,
        [TILE.DOOR_OPEN]: theme.floor,
        [TILE.STAIRS_UP]: theme.floor,
    };
}

export function drawMap(
    ctx: CanvasRenderingContext2D,
    state: GameState,
    offsetX: number, // Camera grid X
    offsetY: number, // Camera grid Y
    viewportWidth: number, // In grid units
    viewportHeight: number
) {
    const { map, explored, level } = state;
    const TILE_COLORS = getTileColors(level);
    const theme = getThemeForFloor(level);

    // Clear canvas
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;

    // Camera offset in pixels (center the camera on the screen)
    const cameraScreen = toScreen(offsetX, offsetY);

    // Render range (add padding to avoid pop-in)
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

            if (isExplored) {
                const tile = map[y][x];
                const baseColor = TILE_COLORS[tile] || theme.floor;

                // Project to screen space
                const isoPos = toScreen(x, y);
                const screenX = centerX + (isoPos.x - cameraScreen.x);
                const screenY = centerY + (isoPos.y - cameraScreen.y);

                if (tile === TILE.WALL) {
                    drawHighResIsoWall(ctx, screenX, screenY, baseColor, theme, x, y);

                    // Decorations
                    const wallSeed = (x * 11 + y * 17) % 100;
                    if (wallSeed < (level <= 4 ? 8 : 3)) {
                        // Cobwebs (adjust y for wall height)
                        drawEnvironmentSprite(ctx, "cobweb", screenX, screenY - TILE_HEIGHT, TILE_WIDTH);
                    }
                } else {
                    drawHighResIsoFloor(ctx, screenX, screenY, baseColor, x, y);

                    if (tile === TILE.STAIRS) {
                        drawEnvironmentSprite(ctx, 'stairs', screenX, screenY, TILE_WIDTH);
                    }
                    else if (tile === TILE.DOOR || tile === TILE.DOOR_OPEN) {
                        const type = (tile === TILE.DOOR_OPEN) ? 'door_open' : 'door_closed';
                        drawEnvironmentSprite(ctx, type, screenX, screenY - TILE_HEIGHT * 0.5, TILE_WIDTH);
                    }

                    const isOccupied =
                        tile === TILE.DOOR ||
                        tile === TILE.DOOR_OPEN ||
                        tile === TILE.STAIRS ||
                        tile === TILE.STAIRS_UP ||
                        state.chests?.some(c => c.x === x && c.y === y);

                    if (!isOccupied) {
                        const seed = (x * 7 + y * 13) % 100;
                        if (level <= 4) {
                            if (seed < 5) drawEnvironmentSprite(ctx, "bones", screenX, screenY, TILE_WIDTH);
                            else if (seed < 9) drawEnvironmentSprite(ctx, "rubble", screenX, screenY, TILE_WIDTH);
                            else if (seed < 13) drawEnvironmentSprite(ctx, "bloodstain", screenX, screenY, TILE_WIDTH);
                            else if (seed < 18) drawEnvironmentSprite(ctx, "crack", screenX, screenY, TILE_WIDTH);
                        }
                    }
                }
            }
        }
    }
}

export function getCameraTarget(player: { x: number, y: number }, map: number[][], viewportWidth: number, viewportHeight: number) {
    // In isometric, we just want to track the player directly
    // The "viewport" logic for clamping can stay grid-based for simplicity

    // Simple clamping
    return {
        x: player.x,
        y: player.y
    };

    // Note: Advanced clamping would require converting map bounds to iso and checking against screen size
    // For now, keeping the camera centered on player is safest for iso
}

export function lerpCamera(current: { x: number, y: number }, target: { x: number, y: number }, speed = 0.1) {
    if (
        Math.abs(target.x - current.x) < 0.01 &&
        Math.abs(target.y - current.y) < 0.01
    ) {
        return target;
    }

    return {
        x: current.x + (target.x - current.x) * speed,
        y: current.y + (target.y - current.y) * speed,
    };
}
