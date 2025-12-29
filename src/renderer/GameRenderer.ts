import { GameState } from "@/types";
import { drawMap, getCameraTarget, lerpCamera } from "./map";
import { getThemeForFloor, drawAmbientOverlay } from "@/components/game/DungeonThemes";
import { renderLighting } from "./lighting";
import { drawEnvironmentSprite } from "./environment";
import { drawItemSprite } from "@/engine/entities/ItemSprites";
import { drawEnemy, drawLargeEnemy } from "./enemies";
import { drawNPC } from "./npcs";
import { drawPlayer } from "./player";
import { isLargeEnemy, getEnemySize } from "@/engine/systems/LargeEnemies";
import { toScreen } from "@/utils/isometric";
import { SIZE, TILE_HEIGHT } from "@/data/constants";

export class GameRenderer {
    private staticCanvas: HTMLCanvasElement | null = null;
    private dynamicCanvas: HTMLCanvasElement | null = null;
    private lightingCanvas: HTMLCanvasElement | null = null;

    private frame: number = 0;
    private cameraPos = { x: 0, y: 0, initialized: false };

    // Caching state for static layer optimization
    private lastStaticRender = {
        cameraX: -999,
        cameraY: -999,
        mapRef: null as any,
        visibleRef: null as any,
        exploredRef: null as any,
        level: -1
    };

    constructor() { }

    public setCanvases(
        staticCanvas: HTMLCanvasElement,
        dynamicCanvas: HTMLCanvasElement,
        lightingCanvas: HTMLCanvasElement
    ) {
        this.staticCanvas = staticCanvas;
        this.dynamicCanvas = dynamicCanvas;
        this.lightingCanvas = lightingCanvas;
    }

    public render(
        state: GameState,
        viewportWidth: number,
        viewportHeight: number,
        _dt: number,
        hoveredTarget: any,
        effectsManager?: any
    ) {
        if (!this.staticCanvas || !this.dynamicCanvas || !this.lightingCanvas || !state.player) return;

        this.frame++;
        const { player, map, enemies, items, visible, explored, torches = [], chests = [], level = 1, npcs = [] } = state;

        // --- CAMERA UPDATE ---
        const target = getCameraTarget(player);
        if (!this.cameraPos.initialized) {
            this.cameraPos.x = target.x;
            this.cameraPos.y = target.y;
            this.cameraPos.initialized = true;
        }
        const newPos = lerpCamera(this.cameraPos, target, 0.1);
        this.cameraPos.x = newPos.x;
        this.cameraPos.y = newPos.y;
        const offsetX = this.cameraPos.x;
        const offsetY = this.cameraPos.y;

        // --- STATIC LAYER (Map) ---
        const cameraMoved = Math.abs(offsetX - this.lastStaticRender.cameraX) > 0.005 ||
            Math.abs(offsetY - this.lastStaticRender.cameraY) > 0.005;
        const mapChanged = map !== this.lastStaticRender.mapRef;
        const fovChanged = visible !== this.lastStaticRender.visibleRef || explored !== this.lastStaticRender.exploredRef;
        const levelChanged = level !== this.lastStaticRender.level;

        if (cameraMoved || mapChanged || fovChanged || levelChanged) {
            const staticCtx = this.staticCanvas.getContext('2d');
            if (staticCtx) {
                drawMap(staticCtx, state, offsetX, offsetY, viewportWidth, viewportHeight);
            }
            this.lastStaticRender = {
                cameraX: offsetX, cameraY: offsetY,
                mapRef: map, visibleRef: visible, exploredRef: explored,
                level: level
            };
        }

        // --- DYNAMIC LAYER (Entities) ---
        const ctx = this.dynamicCanvas.getContext('2d');
        if (ctx) {
            const canvasW = this.dynamicCanvas.width;
            const canvasH = this.dynamicCanvas.height;
            const halfW = canvasW / 2;
            const halfH = canvasH / 2;

            ctx.clearRect(0, 0, canvasW, canvasH);

            const cameraScreen = toScreen(offsetX, offsetY);
            const getScreenPos = (gx: number, gy: number) => {
                const { x, y } = toScreen(gx, gy);
                return {
                    x: x - cameraScreen.x + halfW,
                    y: y - cameraScreen.y + halfH,
                    isoY: y
                };
            };
            const isOnCam = (sx: number, sy: number) => {
                const margin = SIZE * 4;
                return sx >= -margin && sx < canvasW + margin && sy >= -margin && sy < canvasH + margin;
            };

            const renderList: { y: number, sortY: number, draw: () => void }[] = [];

            // 1. Torches
            torches.forEach(torch => {
                if (explored[torch.y]?.[torch.x]) {
                    const { x: sx, y: sy, isoY } = getScreenPos(torch.x, torch.y);
                    if (isOnCam(sx, sy)) {
                        renderList.push({
                            y: torch.y, sortY: isoY,
                            draw: () => drawEnvironmentSprite(ctx, 'wallTorch', sx, sy, SIZE, this.frame)
                        });
                    }
                }
            });

            // 2. Chests
            chests.forEach(chest => {
                if (visible[chest.y]?.[chest.x]) {
                    const { x: sx, y: sy, isoY } = getScreenPos(chest.x, chest.y);
                    if (isOnCam(sx, sy)) {
                        renderList.push({
                            y: chest.y, sortY: isoY,
                            draw: () => drawEnvironmentSprite(ctx, 'chest', sx, sy, SIZE, chest.isOpen, chest.rarity)
                        });
                    }
                }
            });

            // 3. Items
            items.forEach(item => {
                if (item.x === undefined || item.y === undefined) return;
                if (visible[item.y]?.[item.x]) {
                    const { x: sx, y: sy, isoY } = getScreenPos(item.x, item.y);
                    if (isOnCam(sx, sy)) {
                        renderList.push({
                            y: item.y, sortY: isoY + 1,
                            draw: () => {
                                if (item.category === 'currency') drawEnvironmentSprite(ctx, 'goldPile', sx, sy, SIZE);
                                else drawItemSprite(ctx, item, sx - SIZE / 2, sy + TILE_HEIGHT / 2 - SIZE * 0.85, SIZE);
                            }
                        });
                    }
                }
            });

            // 4. Enemies
            enemies.forEach(enemy => {
                if (visible[enemy.y]?.[enemy.x]) {
                    const { x: sx, y: sy, isoY } = getScreenPos(enemy.x, enemy.y);
                    if (isOnCam(sx, sy)) {
                        renderList.push({
                            y: enemy.y, sortY: isoY + 2,
                            draw: () => {
                                if (isLargeEnemy(String(enemy.type))) {
                                    drawLargeEnemy(ctx, String(enemy.type), sx, sy, SIZE * 2, this.frame, (enemy.stunned ?? 0) > 0, enemy.lastAttackTime || 0);
                                    this.drawHealthBar(ctx, sx - SIZE, sy - SIZE * 2, SIZE * 2, enemy.hp, enemy.maxHp);
                                } else {
                                    const sizeInfo = getEnemySize(String(enemy.type));
                                    const drawSize = SIZE * (sizeInfo.scale || 1);
                                    drawEnemy(ctx, String(enemy.type), sx, sy, drawSize, this.frame,
                                        (enemy.stunned ?? 0) > 0, enemy.lastAttackTime || 0, enemy.lastAttackDir || { x: 0, y: 0 },
                                        enemy.lastMoveTime || 0, enemy.sprite, hoveredTarget === enemy);
                                    this.drawHealthBar(ctx, sx - drawSize / 2, sy - drawSize * 1.2, drawSize, enemy.hp, enemy.maxHp);
                                }
                            }
                        });
                    }
                }
            });

            // 5. Player
            const isInvisible = player.skills.buffs.some(b => b.invisible) || false;
            const { x: psx, y: psy, isoY: pIsoY } = getScreenPos(player.x, player.y);
            renderList.push({
                y: player.y, sortY: pIsoY + 3,
                draw: () => {
                    if (!isInvisible) {
                        const glowSize = SIZE * 2 + Math.sin(this.frame * 0.1) * 5;
                        const gradient = ctx.createRadialGradient(psx, psy + TILE_HEIGHT / 2, 0, psx, psy + TILE_HEIGHT / 2, glowSize);
                        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
                        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
                        ctx.fillStyle = gradient;
                        ctx.fillRect(psx - glowSize, psy + TILE_HEIGHT / 2 - glowSize, glowSize * 2, glowSize * 2);
                    }
                    drawPlayer(ctx, psx, psy, SIZE, player.appearance, player.class, this.frame,
                        player.lastAttackTime || 0, player.lastAttackDir || { x: 0, y: 0 },
                        player.lastSkillTime || 0, player.lastSkillId || null, isInvisible, player.lastMoveTime || 0,
                        player.sprite);
                }
            });

            // 6. NPCs
            npcs.forEach(npc => {
                if (visible[npc.y]?.[npc.x]) {
                    const { x: sx, y: sy, isoY } = getScreenPos(npc.x, npc.y);
                    if (isOnCam(sx, sy)) {
                        renderList.push({
                            y: npc.y, sortY: isoY + 2,
                            draw: () => drawNPC(ctx, npc.type, sx, sy, SIZE, this.frame)
                        });
                    }
                }
            });

            // Sort & Draw (Painter's Algorithm)
            renderList.sort((a, b) => a.sortY - b.sortY);
            renderList.forEach(item => item.draw());

            // Ambient Effects
            const theme = getThemeForFloor(level);
            if (theme.lavaGlow || theme.embers) {
                drawAmbientOverlay(ctx, canvasW, canvasH, level, this.frame);
            }

            // Effects Manager (Particle System)
            if (effectsManager) {
                const manager = (effectsManager as any).current || effectsManager;
                if (typeof manager.update === 'function') manager.update();
                if (typeof manager.draw === 'function') manager.draw(ctx, offsetX, offsetY, SIZE, halfW, halfH);
            }
        }

        // --- LIGHTING LAYER ---
        const lightCtx = this.lightingCanvas.getContext('2d');
        if (lightCtx) {
            if (this.lightingCanvas.width !== this.dynamicCanvas.width) {
                this.lightingCanvas.width = this.dynamicCanvas.width;
                this.lightingCanvas.height = this.dynamicCanvas.height;
            }
            renderLighting(lightCtx, this.lightingCanvas.width, this.lightingCanvas.height, state, offsetX, offsetY);
        }
    }

    private drawHealthBar(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, hp: number, maxHp: number) {
        const percent = Math.max(0, Math.min(1, hp / maxHp));
        const barW = width - 4;
        ctx.fillStyle = '#1a1a2e'; ctx.fillRect(x + 2, y - 6, barW, 4);
        ctx.fillStyle = percent > 0.5 ? '#4ade80' : percent > 0.25 ? '#eab308' : '#ef4444';
        ctx.fillRect(x + 2, y - 6, barW * percent, 4);
    }
}
