import { SIZE } from "@/data/constants";
import { GameState } from "@/types";

const TILE_SIZE = SIZE;

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
        getLightSprite(SPRITE_REVEAL, 'rgba(0,0,0,1)', 'rgba(0,0,0,0)', 64, true);
    }
}

let fogCanvas: HTMLCanvasElement | null = null;
let lastPlayerGridPos = { x: -1, y: -1 };
let lastMapLevel = -1;

function updateFogCache(state: GameState) {
    const mapWidth = state.map[0].length * TILE_SIZE;
    const mapHeight = state.map.length * TILE_SIZE;

    if (!fogCanvas || state.level !== lastMapLevel) {
        fogCanvas = document.createElement('canvas');
        fogCanvas.width = mapWidth;
        fogCanvas.height = mapHeight;
        lastMapLevel = state.level;
    }

    const ctx = fogCanvas.getContext('2d');
    if (!ctx) return;

    const DARKNESS_COLOR = "rgba(10, 10, 15, 0.95)";

    ctx.clearRect(0, 0, mapWidth, mapHeight);
    ctx.fillStyle = DARKNESS_COLOR;
    ctx.fillRect(0, 0, mapWidth, mapHeight);

    ctx.globalCompositeOperation = "destination-out";

    const revealSprite = lightCache[SPRITE_REVEAL];
    const revealSize = TILE_SIZE * 2.5;
    const offsetReveal = revealSize / 2;

    for (let y = 0; y < state.map.length; y++) {
        for (let x = 0; x < state.map[0].length; x++) {
            if (state.visible[y]?.[x]) {
                const screenX = x * TILE_SIZE;
                const screenY = y * TILE_SIZE;
                ctx.drawImage(revealSprite, screenX + TILE_SIZE / 2 - offsetReveal, screenY + TILE_SIZE / 2 - offsetReveal, revealSize, revealSize);
            }
        }
    }

    const drawHole = (spriteKey: string, x: number, y: number, radius: number) => {
        const sprite = lightCache[spriteKey];
        if (!sprite) return;
        const size = radius * 2;
        ctx.drawImage(sprite, x - radius, y - radius, size, size);
    };

    const px = state.player.x * TILE_SIZE + TILE_SIZE / 2;
    const py = state.player.y * TILE_SIZE + TILE_SIZE / 2;
    drawHole(SPRITE_HOLE, px, py, 5 * TILE_SIZE);

    ctx.globalCompositeOperation = "source-over";
}

export const renderLighting = (ctx: CanvasRenderingContext2D, width: number, height: number, state: GameState, offsetX: number, offsetY: number) => {
    initSprites();

    const currentPlayerGridX = Math.floor(state.player.x);
    const currentPlayerGridY = Math.floor(state.player.y);

    const needsUpdate =
        !fogCanvas ||
        currentPlayerGridX !== lastPlayerGridPos.x ||
        currentPlayerGridY !== lastPlayerGridPos.y ||
        state.level !== lastMapLevel;

    if (needsUpdate) {
        updateFogCache(state);
        lastPlayerGridPos = { x: currentPlayerGridX, y: currentPlayerGridY };
    }

    ctx.clearRect(0, 0, width, height);
    if (fogCanvas) {
        ctx.drawImage(fogCanvas, -offsetX * TILE_SIZE, -offsetY * TILE_SIZE);
    }

    const { torches, items } = state;
    const time = Date.now() / 150;

    ctx.globalCompositeOperation = "lighter";

    const drawLight = (spriteKey: string, x: number, y: number, radius: number) => {
        const sprite = lightCache[spriteKey];
        if (!sprite) return;
        const size = radius * 2;
        ctx.drawImage(sprite, x - radius, y - radius, size, size);
    };

    torches.forEach((torch: any) => {
        if (!state.visible[torch.y]?.[torch.x]) return;

        const tx = torch.x * TILE_SIZE - offsetX * TILE_SIZE + TILE_SIZE / 2;
        const ty = torch.y * TILE_SIZE - offsetY * TILE_SIZE + TILE_SIZE / 2;

        if (tx > -200 && tx < width + 200 && ty > -200 && ty < height + 200) {
            const flicker = ((Math.sin(time + torch.x * 10) + 1) / 2) * 0.1;
            drawLight(SPRITE_TORCH, tx, ty, 280 + flicker * 30);
        }
    });

    items.forEach((item: any) => {
        if (!state.visible[item.y]?.[item.x]) return;
        const ix = item.x * TILE_SIZE - offsetX * TILE_SIZE + TILE_SIZE / 2;
        const iy = item.y * TILE_SIZE - offsetY * TILE_SIZE + TILE_SIZE / 2;

        if (ix > -80 && ix < width + 80 && iy > -80 && iy < height + 80) {
            let color = null; let radius = 50;
            if (item.category === "potion") color = "rgba(255, 80, 80, 0.5)";
            else if (item.rarity === "rare") { color = "rgba(80, 120, 255, 0.5)"; radius = 60; }
            else if (item.rarity === "epic") { color = "rgba(200, 80, 255, 0.6)"; radius = 80; }
            else if (item.rarity === "legendary") { color = "rgba(255, 220, 50, 0.7)"; radius = 100; }

            if (color) {
                const g = ctx.createRadialGradient(ix, iy, 0, ix, iy, radius);
                g.addColorStop(0, color); g.addColorStop(1, "rgba(0,0,0,0)");
                ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ix, iy, radius, 0, Math.PI * 2); ctx.fill();
            }
        }
    });

    ctx.globalCompositeOperation = "source-over";

    ctx.globalCompositeOperation = "destination-out";

    const startMapX = Math.floor(offsetX);
    const startMapY = Math.floor(offsetY);
    const tilesX = Math.ceil(width / TILE_SIZE) + 2;
    const tilesY = Math.ceil(height / TILE_SIZE) + 2;

    for (let y = -1; y < tilesY; y++) {
        for (let x = -1; x < tilesX; x++) {
            const mapX = startMapX + x;
            const mapY = startMapY + y;

            const row = state.map[mapY];
            const isVoid = !row || row[mapX] === undefined;

            if (isVoid) {
                const screenX = Math.floor(mapX * TILE_SIZE - offsetX * TILE_SIZE);
                const screenY = Math.floor(mapY * TILE_SIZE - offsetY * TILE_SIZE);
                ctx.fillRect(screenX - 1, screenY - 1, TILE_SIZE + 2, TILE_SIZE + 2);
            }
        }
    }

    ctx.globalCompositeOperation = "source-over";
};
