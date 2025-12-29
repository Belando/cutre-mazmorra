import { TILE, TILE_WIDTH, TILE_HEIGHT } from "@/data/constants";
import { getThemeForFloor, DungeonTheme } from "@/components/game/DungeonThemes";
import { drawEnvironmentSprite } from "./environment";
import { GameState } from "@/types";
import { toScreen } from "@/utils/isometric";

// Helper to draw an isometric tile (diamond)
function drawIsoTile(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    ctx.fillStyle = color;
    // Sealing gaps: Stroke with the same color to cover sub-pixel anti-aliasing artifacts
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
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

    // Add some noise/texture based on coordinates
    const seed = (mapX * 17 + mapY * 23) % 100;
    if (seed > 80) {
        ctx.fillStyle = "rgba(0,0,0,0.1)"; // Shadowy detail
        ctx.beginPath();
        ctx.moveTo(x, y + TILE_HEIGHT * 0.2);
        ctx.lineTo(x + TILE_WIDTH * 0.1, y + TILE_HEIGHT * 0.5);
        ctx.lineTo(x, y + TILE_HEIGHT * 0.8);
        ctx.lineTo(x - TILE_WIDTH * 0.1, y + TILE_HEIGHT * 0.5);
        ctx.fill();
    }
}

function drawHighResIsoWall(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, theme: DungeonTheme, _mapX: number, _mapY: number) {
    // Wall height factor
    const WALL_HEIGHT = TILE_HEIGHT * 1.5;

    // Top face (diamond) - The "roof" of the wall
    const topY = y - WALL_HEIGHT;
    drawIsoTile(ctx, x, topY, theme.wallDetail);

    // Right face (Darker)
    const rightColor = adjustBrightness(color, -40);
    ctx.fillStyle = rightColor;
    ctx.strokeStyle = rightColor; // Self-stroke for seams
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, topY + TILE_HEIGHT);
    ctx.lineTo(x + TILE_WIDTH / 2, topY + TILE_HEIGHT / 2);
    ctx.lineTo(x + TILE_WIDTH / 2, topY + TILE_HEIGHT / 2 + WALL_HEIGHT);
    ctx.lineTo(x, topY + TILE_HEIGHT + WALL_HEIGHT);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Left face (Base Color)
    ctx.fillStyle = color;
    ctx.strokeStyle = color; // Self-stroke for seams
    ctx.beginPath();
    ctx.moveTo(x, topY + TILE_HEIGHT);
    ctx.lineTo(x - TILE_WIDTH / 2, topY + TILE_HEIGHT / 2);
    ctx.lineTo(x - TILE_WIDTH / 2, topY + TILE_HEIGHT / 2 + WALL_HEIGHT);
    ctx.lineTo(x, topY + TILE_HEIGHT + WALL_HEIGHT);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Corner Highlight - subtle
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, topY); // Top corner
    ctx.lineTo(x, topY + TILE_HEIGHT + WALL_HEIGHT); // Vertical edge
    ctx.stroke();
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

    // Clear canvas completely to prevent "dragging/ghosting" of previous frames
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw background (opaque) to ensure no trails
    ctx.fillStyle = "#050505"; // Deep black/grey base
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Optional: Draw fog overlay if needed, but base must be solid
    if (theme.fogColor) {
        ctx.fillStyle = theme.fogColor;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const cameraScreen = toScreen(offsetX, offsetY);

    // Render range with padding
    const padding = 2;
    const rangeX = Math.ceil(viewportWidth / 2) + padding;
    const rangeY = Math.ceil(viewportHeight / 2) + padding;

    const startX = Math.max(0, Math.floor(offsetX - rangeX));
    const endX = Math.min(map[0].length, Math.ceil(offsetX + rangeX + 4));
    const startY = Math.max(0, Math.floor(offsetY - rangeY));
    const endY = Math.min(map.length, Math.ceil(offsetY + rangeY + 4));

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            // Check visibility/exploration
            const isExplored = explored[y]?.[x];
            // Fix: visible is boolean[][] in types, not Point[]
            const isVisible = visible[y]?.[x];

            if (isExplored) {
                const tile = map[y][x];

                // Dim colors if explored but not currently visible (Fog of War)
                const baseWallColor = isVisible ? theme.wall : adjustBrightness(theme.wall, -50);
                const baseFloorColor = isVisible ? theme.floor : adjustBrightness(theme.floor, -50);

                // Project to screen space
                const isoPos = toScreen(x, y);
                const screenX = centerX + (isoPos.x - cameraScreen.x);
                const screenY = centerY + (isoPos.y - cameraScreen.y);

                if (tile === TILE.WALL) {
                    drawHighResIsoWall(ctx, screenX, screenY, baseWallColor, theme, x, y);

                    // Decorations (only visible tiles)
                    if (isVisible) {
                        const wallSeed = (x * 11 + y * 17) % 100;
                        if (wallSeed < (level <= 4 ? 8 : 3)) {
                            drawEnvironmentSprite(ctx, "cobweb", screenX, screenY - TILE_HEIGHT, TILE_WIDTH);
                        }
                    }
                } else {
                    drawHighResIsoFloor(ctx, screenX, screenY, baseFloorColor, x, y);

                    // Tile-specific objects (Stairs, Doors)
                    if (tile === TILE.STAIRS) {
                        drawEnvironmentSprite(ctx, 'stairs', screenX, screenY, TILE_WIDTH);
                    }
                    else if (tile === TILE.DOOR || tile === TILE.DOOR_OPEN) {
                        const type = (tile === TILE.DOOR_OPEN) ? 'door_open' : 'door_closed';
                        drawEnvironmentSprite(ctx, type, screenX, screenY - TILE_HEIGHT * 0.5, TILE_WIDTH);
                    }

                    // Floor Decorations
                    const occupiedTiles = [TILE.DOOR, TILE.DOOR_OPEN, TILE.STAIRS, TILE.STAIRS_UP] as number[];
                    if (isVisible && !occupiedTiles.includes(tile)) {
                        const seed = (x * 7 + y * 13) % 100;
                        if (seed < 8 && level <= 4) {
                            const decos = ["bones", "rubble", "crack", "bloodstain"];
                            const decoType = decos[seed % decos.length];
                            drawEnvironmentSprite(ctx, decoType, screenX, screenY, TILE_WIDTH);
                        }
                    }
                }
            }
        }
    }

    // Ambient Overlay Effects (if defined in theme)
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

