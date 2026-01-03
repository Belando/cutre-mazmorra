import { GameState, RenderItem } from "@/types";
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
import { SIZE, TILE_HEIGHT, ENTITY } from "@/data/constants";
import { drawEffects } from "./effects";

export class GameRenderer {
    private staticCanvas: HTMLCanvasElement | null = null;
    private dynamicCanvas: HTMLCanvasElement | null = null;
    private lightingCanvas: HTMLCanvasElement | null = null;

    private staticCtx: CanvasRenderingContext2D | null = null;
    private dynamicCtx: CanvasRenderingContext2D | null = null;
    private lightingCtx: CanvasRenderingContext2D | null = null;

    private frame: number = 0;
    private cameraPos = { x: 0, y: 0, initialized: false };

    // Caching state for static layer optimization
    private lastStaticRender = {
        cameraX: -999,
        cameraY: -999,
        mapRef: null as number[][] | null,
        visibleRef: null as boolean[][] | null,
        exploredRef: null as boolean[][] | null,
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

        this.staticCtx = staticCanvas.getContext('2d', { alpha: false }); // Alpha false for optimization if background is opaque
        this.dynamicCtx = dynamicCanvas.getContext('2d');
        this.lightingCtx = lightingCanvas.getContext('2d');
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
            if (this.staticCtx) {
                // Clear and Draw FLOOR Only
                // drawMap(this.staticCtx, state, offsetX, offsetY, viewportWidth, viewportHeight, undefined, 'floor');
                drawMap(this.staticCtx, state, offsetX, offsetY, viewportWidth, viewportHeight, undefined, 'floor');
            }
            this.lastStaticRender = {
                cameraX: offsetX, cameraY: offsetY,
                mapRef: map, visibleRef: visible, exploredRef: explored,
                level: level
            };
        }

        // --- DYNAMIC LAYER (Entities) ---
        const ctx = this.dynamicCtx;
        if (ctx) {
            const canvasW = this.dynamicCanvas.width;
            const canvasH = this.dynamicCanvas.height;
            const halfW = canvasW / 2;
            const halfH = canvasH / 2;

            ctx.clearRect(0, 0, canvasW, canvasH);
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            ctx.filter = 'none';
            ctx.shadowBlur = 0;

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

            const renderList: RenderItem[] = [];

            // 0. WALLS (Dynamic Sorting)
            // drawMap will PUSH draw calls to renderList instead of executed immediate.
            drawMap(ctx, state, offsetX, offsetY, viewportWidth, viewportHeight, renderList, 'wall');

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

            // 1.5 Static Entities (Trees, Rocks, Gate, Workbench) from Grid
            // Iterate visible range to avoid scanning whole map?
            // We can iterate the 'state.entities' using the same bounds as map drawing or visible checking
            if (state.entities) {
                // Optimization: Iterate over visible bounds only?
                // But visible bounds logic is in map drawing.
                // We can reuse 'visible' grid keys?
                // Let's iterate over visible tiles.
                state.entities.forEach((row, y) => {
                    if (!visible[y]) return;
                    row.forEach((entityType, x) => {
                        if (entityType === ENTITY.NONE || !visible[y][x]) return;

                        const { x: sx, y: sy, isoY } = getScreenPos(x, y);
                        if (isOnCam(sx, sy)) {
                            let drawType = '';
                            if (entityType === ENTITY.TREE) drawType = 'tree';
                            else if (entityType === ENTITY.ROCK) drawType = 'rock';
                            else if (entityType === ENTITY.PLANT) drawType = 'plant';
                            else if (entityType === ENTITY.DUNGEON_GATE) drawType = 'dungeon_gate';
                            // else if (entityType === ENTITY.WORKBENCH) drawType = 'workbench'; // Disabled to remove artifact

                            if (drawType) {
                                // Customized Z-sorting
                                let zOffset = 1.5;
                                if (drawType === 'dungeon_gate') {
                                    // User Request: "Don't let gate cove player"
                                    // BUT: "Don't let wall cover gate".
                                    // Conflict? Player is Y=3 approx. Gate is Y=0.
                                    // Wall is Y=0.
                                    // Gate needs to be TOP of Wall (Y=0).
                                    // Player (Y=3) needs to be TOP of Gate.
                                    // So: Wall(SortY=?) < Gate(SortY=?) < Player(SortY=?)
                                    // Wall SortY is isoY + 1.5.
                                    // Gate is at Y=0. IsoY is 0.
                                    // We need Gate > Wall. So zOffset > 1.5.
                                    // Let's try zOffset = 2.0.
                                    // Player at Y=3 will have SortY ~ 3*TILE_H... much higher.
                                    // So Gate = 2.0 should be safe.
                                    // CAREFUL: Previous logic was -100 to force BEHIND player.
                                    // But -100 puts it BEHIND Wall (1.5).
                                    // We want: Wall < Gate < Player.
                                    zOffset = 2.0;
                                }

                                renderList.push({
                                    y: y, sortY: isoY + zOffset,
                                    draw: () => drawEnvironmentSprite(ctx, drawType, sx, sy, SIZE, x, y)
                                });
                            }
                        }
                    });
                });
            }

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
                    // User Request: Reduce player size to 75% -> Then increase 10% -> Then increase 5% (0.825 * 1.05 = 0.866)
                    const PLAYER_SIZE = SIZE * 0.866;
                    drawPlayer(ctx, psx, psy, PLAYER_SIZE, player.appearance, player.class, this.frame,
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
                            draw: () => drawNPC(ctx, npc, sx, sy, SIZE, this.frame)
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
                // Use decoupled renderer
                if (manager.effects) {
                    drawEffects(ctx, manager.effects, offsetX, offsetY, SIZE, halfW, halfH);
                }
            }
        }

        // --- LIGHTING LAYER ---
        const lightCtx = this.lightingCtx;
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
