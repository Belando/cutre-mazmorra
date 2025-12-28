import { SIZE, TILE_HEIGHT, TILE_WIDTH } from "@/data/constants";
import { GameState } from "@/types";
import { toScreen } from '@/utils/isometric';

const lightCache: Record<string, HTMLCanvasElement> = {};

function getLightSprite(key: string, _colorStart: string, _colorEnd: string, size = 256, isSoft = false) {
    if (lightCache[key]) return lightCache[key];

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);

    if (isSoft) {
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
        gradient.addColorStop(0.1, 'rgba(255, 200, 50, 0.8)');
        gradient.addColorStop(0.4, 'rgba(255, 100, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    lightCache[key] = canvas;
    return canvas;
}

const SPRITE_HOLE = 'hole_sprite';
const SPRITE_TORCH = 'torch_sprite';
const SPRITE_REVEAL = 'reveal_sprite';

function initSprites() {
    if (!lightCache[SPRITE_HOLE]) {
        getLightSprite(SPRITE_HOLE, 'rgba(0, 0, 0, 1)', 'rgba(0, 0, 0, 0)', 256, true);
    }
    if (!lightCache[SPRITE_TORCH]) {
        getLightSprite(SPRITE_TORCH, 'rgba(255, 180, 100, 0.9)', 'rgba(0, 0, 0, 0)');
    }
    if (!lightCache[SPRITE_REVEAL]) {
        getLightSprite(SPRITE_REVEAL, 'rgba(0,0,0,1)', 'rgba(0,0,0,0)', 128, true);
    }
}

export const renderLighting = (ctx: CanvasRenderingContext2D, width: number, height: number, state: GameState, cameraGridX: number, cameraGridY: number) => {
    initSprites();

    const DARKNESS_COLOR = "rgba(10, 10, 15, 0.95)";

    const cameraScreen = toScreen(cameraGridX, cameraGridY);

    // Fill the screen with darkness
    ctx.fillStyle = DARKNESS_COLOR;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "destination-out";

    const revealSprite = lightCache[SPRITE_REVEAL];
    // Slightly larger reveal radius for iso to cover gaps
    const revealSize = SIZE * 2.0;
    const offsetReveal = revealSize / 2;

    // Only iterate visible tiles to "cut out" the fog
    // Optimization: iterate only within view bounds? 
    // For now, iterate all visible tiles in state.
    // Note: This matches the previous logic roughly, but directly to screen.

    const rows = state.map.length;
    const cols = state.map[0].length;

    // Viewport bounds in grid roughly
    // optimization: calculate visible range based on cameraGridX/Y

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (state.visible[y]?.[x]) {
                const { x: sx, y: sy } = toScreen(x, y);
                // Center of tile
                const cx = sx;
                const cy = sy + TILE_HEIGHT / 2;

                ctx.drawImage(revealSprite,
                    cx - offsetReveal + width / 2 - cameraScreen.x,
                    cy - offsetReveal + height / 2 - cameraScreen.y,
                    revealSize, revealSize
                );
            }
        }
    }

    // Draw player hole (always visible around player)
    {
        const { x: px, y: py } = toScreen(state.player.x, state.player.y);
        const cx = px;
        const cy = py + TILE_HEIGHT / 2;
        const playerRevealSize = SIZE * 6;
        ctx.drawImage(lightCache[SPRITE_HOLE],
            cx - playerRevealSize / 2 + width / 2 - cameraScreen.x,
            cy - playerRevealSize / 2 + height / 2 - cameraScreen.y,
            playerRevealSize, playerRevealSize
        );
    }

    ctx.globalCompositeOperation = "lighter";

    const { torches, items } = state;
    const time = Date.now() / 150;

    const drawLight = (spriteKey: string, x: number, y: number, radius: number) => {
        const sprite = lightCache[spriteKey];
        if (!sprite) return;
        const size = radius * 2;
        ctx.drawImage(sprite,
            x - radius + width / 2 - cameraScreen.x,
            y - radius + height / 2 - cameraScreen.y,
            size, size
        );
    };

    torches.forEach((torch: any) => {
        // Only draw if visible (or if close enough?)
        if (!state.visible[torch.y]?.[torch.x]) return;

        const { x: tx, y: ty } = toScreen(torch.x, torch.y);
        const cx = tx;
        const cy = ty + TILE_HEIGHT / 2;

        const flicker = ((Math.sin(time + torch.x * 10) + 1) / 2) * 0.1;
        // Wall torches might need height adjustment (y - 30?)
        // But the light is usually spherical.
        drawLight(SPRITE_TORCH, cx, cy - 30, 280 + flicker * 30);
    });

    items.forEach((item: any) => {
        if (!state.visible[item.y]?.[item.x]) return;

        const { x: ix, y: iy } = toScreen(item.x, item.y);
        const cx = ix;
        const cy = iy + TILE_HEIGHT / 2;

        let color = null; let radius = 50;
        if (item.category === "potion") color = "rgba(255, 80, 80, 0.5)";
        else if (item.rarity === "rare") { color = "rgba(80, 120, 255, 0.5)"; radius = 60; }
        else if (item.rarity === "epic") { color = "rgba(200, 80, 255, 0.6)"; radius = 80; }
        else if (item.rarity === "legendary") { color = "rgba(255, 220, 50, 0.7)"; radius = 100; }

        if (color) {
            const screenX = cx + width / 2 - cameraScreen.x;
            const screenY = cy + height / 2 - cameraScreen.y;

            const g = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, radius);
            g.addColorStop(0, color); g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(screenX, screenY, radius, 0, Math.PI * 2); ctx.fill();
        }
    });

    ctx.globalCompositeOperation = "source-over";
};
