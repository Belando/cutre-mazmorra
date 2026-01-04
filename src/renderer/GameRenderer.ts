import { GameState, RenderItem } from "@/types";
import { drawMap, lerpCamera, drawSpriteIsoWall } from "./map";
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

    // Visual Smoothing State
    private playerVisual = { x: 0, y: 0, initialized: false };
    private enemyVisuals = new Map<string | number, { x: number, y: number }>();

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
        _hoveredTarget: any,
        effectsManager?: any
    ) {
        if (!this.staticCanvas || !this.dynamicCanvas || !this.lightingCanvas || !state.player) return;

        this.frame++;
        const { player, map, enemies, corpses = [], items, visible, explored, torches = [], chests = [], level = 1, npcs = [] } = state;

        // --- VISUAL INTERPOLATION (Smoothing) ---
        const LERP_SPEED = 0.2; // 20% per frame = fast but smooth

        // 1. Player Smoothing
        if (!this.playerVisual.initialized) {
            this.playerVisual.x = player.x;
            this.playerVisual.y = player.y;
            this.playerVisual.initialized = true;
        } else {
            this.playerVisual.x += (player.x - this.playerVisual.x) * LERP_SPEED;
            this.playerVisual.y += (player.y - this.playerVisual.y) * LERP_SPEED;
        }

        // --- CAMERA UPDATE ---
        // Use visual position for camera target to follow smoothly
        const target = { x: this.playerVisual.x, y: this.playerVisual.y }; // Was getCameraTarget(player)
        if (!this.cameraPos.initialized) {
            this.cameraPos.x = target.x;
            this.cameraPos.y = target.y;
            this.cameraPos.initialized = true;
        }
        const newPos = lerpCamera(this.cameraPos, target, 0.1);
        this.cameraPos.x = newPos.x;
        this.cameraPos.y = newPos.y;

        let offsetX = this.cameraPos.x;
        let offsetY = this.cameraPos.y;

        if (effectsManager) {
            const manager = (effectsManager as any).current || effectsManager;
            if (manager.screenShake > 0) {
                offsetX += (Math.random() - 0.5) * (manager.screenShake * 0.1);
                offsetY += (Math.random() - 0.5) * (manager.screenShake * 0.1);
            }
        }

        // --- STATIC LAYER (Map) ---
        const cameraMoved = Math.abs(offsetX - this.lastStaticRender.cameraX) > 0.005 ||
            Math.abs(offsetY - this.lastStaticRender.cameraY) > 0.005;
        const mapChanged = map !== this.lastStaticRender.mapRef;
        const fovChanged = visible !== this.lastStaticRender.visibleRef || explored !== this.lastStaticRender.exploredRef;
        const levelChanged = level !== this.lastStaticRender.level;

        if (cameraMoved || mapChanged || fovChanged || levelChanged) {
            if (this.staticCtx) {
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

            const renderList: RenderItem[] = []; // Uses the new interface

            // 0. WALLS (Dynamic Sorting)
            // drawMap pushes 'wall' or 'sprite' commands now
            drawMap(ctx, state, offsetX, offsetY, viewportWidth, viewportHeight, renderList, 'wall');

            // 1. Torches
            torches.forEach(torch => {
                if (explored[torch.y]?.[torch.x]) {
                    const { x: sx, y: sy, isoY } = getScreenPos(torch.x, torch.y);
                    if (isOnCam(sx, sy)) {
                        // Determine orientation based on empty space
                        const isRightEmpty = map[torch.y]?.[torch.x + 1] !== 0; // If not wall (0)

                        // Flip if valid right face exposed
                        const flipX = isRightEmpty;

                        renderList.push({
                            sortY: isoY + 1.6, // Higher than walls (1.5) to render in front
                            type: 'sprite',
                            texture: 'wallTorch',
                            x: sx, y: sy, w: SIZE, frame: this.frame,
                            flipX: flipX
                        });
                    }
                }
            });

            // 1.5 Static Entities
            if (state.entities) {
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
                            else if (entityType === ENTITY.CRATE) drawType = 'crate';
                            else if (entityType === ENTITY.BARREL) drawType = 'barrel';
                            else if (entityType === ENTITY.SPIKES) drawType = 'spikes';

                            if (drawType) {
                                let zOffset = 1.5;
                                if (drawType === 'dungeon_gate') zOffset = 2.0;
                                else if (drawType === 'spikes') zOffset = 0.1;

                                renderList.push({
                                    sortY: isoY + zOffset,
                                    type: 'sprite',
                                    texture: drawType,
                                    x: sx, y: sy, w: SIZE,
                                    // Hack: pass x/y coords in 'h' or 'frame' if needed for seed? 
                                    // drawEnvironmentSprite uses x/y for standard variants. 
                                    // We can pass them in the payload.
                                    frame: x + y * 1000 // Using frame as seed carrier? No, frame is animation. 
                                    // We'll update executeCommand to handle extra args if needed.
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
                            sortY: isoY + 0.5,
                            type: 'sprite',
                            texture: 'chest',
                            x: sx, y: sy, w: SIZE,
                            isOpen: chest.isOpen, rarity: chest.rarity
                        });
                    }
                }
            });

            // 2.5 CORPSES
            corpses.forEach(corpse => {
                const { x, y, type, rotation } = corpse;
                if (!visible[y]?.[x]) return;

                const { x: sx, y: sy, isoY } = getScreenPos(x, y);
                if (isOnCam(sx, sy)) {
                    renderList.push({
                        sortY: isoY + 0.1,
                        type: 'corpse',
                        x: sx, y: sy, w: SIZE,
                        texture: String(type),
                        rotation: rotation
                    });
                }
            });

            // 3. Items
            items.forEach(item => {
                if (item.x === undefined || item.y === undefined) return;
                if (visible[item.y]?.[item.x]) {
                    const { x: sx, y: sy, isoY } = getScreenPos(item.x, item.y);
                    if (isOnCam(sx, sy)) {
                        if (item.category === 'currency') {
                            renderList.push({
                                sortY: isoY + 1,
                                type: 'sprite',
                                texture: 'goldPile',
                                x: sx, y: sy, w: SIZE
                            });
                        } else {
                            // ItemSprite requires the Item object
                            renderList.push({
                                sortY: isoY + 1,
                                type: 'item',
                                item: item,
                                x: sx, y: sy, w: SIZE
                            });
                        }
                    }
                }
            });

            // 4. Enemies
            // Update Enemy Visuals
            const activeEnemyIds = new Set<string | number>();
            enemies.forEach(enemy => {
                const id = enemy.id;
                activeEnemyIds.add(id);
                let visual = this.enemyVisuals.get(id);
                if (!visual) {
                    visual = { x: enemy.x, y: enemy.y };
                    this.enemyVisuals.set(id, visual);
                } else {
                    const ENEMY_LERP = 0.1; // Slower than player (0.2) to emphasize movement
                    visual.x += (enemy.x - visual.x) * ENEMY_LERP;
                    visual.y += (enemy.y - visual.y) * ENEMY_LERP;
                }
            });
            // Cleanup dead enemies
            for (const id of this.enemyVisuals.keys()) {
                if (!activeEnemyIds.has(id)) {
                    this.enemyVisuals.delete(id);
                }
            }

            enemies.forEach(enemy => {
                if (visible[enemy.y]?.[enemy.x]) {
                    const visualPos = this.enemyVisuals.get(enemy.id);
                    const { x: sx, y: sy, isoY } = getScreenPos(
                        visualPos ? visualPos.x : enemy.x,
                        visualPos ? visualPos.y : enemy.y
                    );
                    if (isOnCam(sx, sy)) {
                        const isLarge = isLargeEnemy(String(enemy.type));
                        renderList.push({
                            sortY: isoY + 2,
                            type: 'enemy',
                            x: sx, y: sy, w: SIZE,
                            enemyType: enemy.type,
                            stunned: (enemy.stunned ?? 0) > 0,
                            lastAttackTime: enemy.lastAttackTime || 0,
                            lastAttackDir: enemy.lastAttackDir,
                            lastMoveTime: enemy.lastMoveTime,
                            spriteComp: enemy.sprite,
                            isLarge: isLarge,
                            health: enemy.hp, maxHealth: enemy.maxHp // For healthbar
                        });
                    }
                }
            });

            // 5. Player
            const isInvisible = player.skills.buffs.some(b => b.invisible) || false;
            // Use visual position for rendering
            const { x: psx, y: psy, isoY: pIsoY } = getScreenPos(this.playerVisual.x, this.playerVisual.y);
            renderList.push({
                sortY: pIsoY + 3,
                type: 'player',
                x: psx, y: psy, w: SIZE,
                appearance: player.appearance,
                playerClass: player.class,
                frame: this.frame,
                lastAttackTime: player.lastAttackTime,
                lastMoveTime: player.lastMoveTime,
                lastAttackDir: player.lastAttackDir,
                lastSkillTime: player.lastSkillTime,
                lastSkillId: player.lastSkillId,
                isInvisible: isInvisible,
                spriteComp: player.sprite
            });

            // 6. NPCs
            npcs.forEach(npc => {
                if (visible[npc.y]?.[npc.x]) {
                    const { x: sx, y: sy, isoY } = getScreenPos(npc.x, npc.y);
                    if (isOnCam(sx, sy)) {
                        renderList.push({
                            sortY: isoY + 2,
                            type: 'npc',
                            npc: npc,
                            x: sx, y: sy, w: SIZE
                        });
                    }
                }
            });

            // Sort & Execute using Static/Switch
            renderList.sort((a, b) => a.sortY - b.sortY);

            for (const item of renderList) {
                if (item.draw) {
                    item.draw();
                } else {
                    this.executeCommand(ctx, item);
                }
            }

            // Ambient Effects
            const theme = getThemeForFloor(level);
            if (theme.lavaGlow || theme.embers) {
                drawAmbientOverlay(ctx, canvasW, canvasH, level, this.frame);
            }

            // Effects Manager
            if (effectsManager) {
                const manager = (effectsManager as any).current || effectsManager;
                if (typeof manager.update === 'function') manager.update();
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

    private executeCommand(ctx: CanvasRenderingContext2D, cmd: RenderItem) {
        if (cmd.type === 'sprite') {
            if (cmd.texture && cmd.x !== undefined && cmd.y !== undefined && cmd.w !== undefined) {
                // handle special variants for Environment
                if (cmd.isOpen !== undefined) { // CHEST
                    drawEnvironmentSprite(ctx, 'chest', cmd.x, cmd.y, cmd.w, cmd.isOpen, cmd.rarity);
                } else {
                    drawEnvironmentSprite(ctx, cmd.texture, cmd.x, cmd.y, cmd.w, cmd.frame); // frame can be seed or animation
                }
            }
        }
        else if (cmd.type === 'enemy') {
            if (cmd.enemyType !== undefined && cmd.x !== undefined && cmd.y !== undefined && cmd.w !== undefined) {
                if (cmd.isLarge) {
                    drawLargeEnemy(ctx, String(cmd.enemyType), cmd.x, cmd.y, cmd.w * 2, this.frame, !!cmd.stunned, cmd.lastAttackTime || 0);
                    if (cmd.health !== undefined && cmd.maxHealth) {
                        this.drawHealthBar(ctx, cmd.x - cmd.w, cmd.y - cmd.w * 2, cmd.w * 2, cmd.health, cmd.maxHealth);
                    }
                } else {
                    const sizeInfo = getEnemySize(String(cmd.enemyType));
                    const drawSize = cmd.w * (sizeInfo.scale || 1);
                    drawEnemy(ctx, String(cmd.enemyType), cmd.x, cmd.y, drawSize, this.frame,
                        !!cmd.stunned, cmd.lastAttackTime || 0, cmd.lastAttackDir || { x: 0, y: 0 },
                        cmd.lastMoveTime || 0, cmd.spriteComp, false);
                    if (cmd.health !== undefined && cmd.maxHealth) {
                        this.drawHealthBar(ctx, cmd.x - drawSize / 2, cmd.y - drawSize * 1.2, drawSize, cmd.health, cmd.maxHealth);
                    }
                }
            }
        }
        else if (cmd.type === 'wall') {
            if (cmd.x !== undefined && cmd.y !== undefined && cmd.w !== undefined && cmd.h !== undefined && cmd.color) {
                drawSpriteIsoWall(ctx, cmd.x, cmd.y, cmd.w, cmd.h, cmd.color, this.lastStaticRender.level ?? 1);
            }
        }
        else if (cmd.type === 'corpse') {
            if (cmd.x !== undefined && cmd.y !== undefined && cmd.w !== undefined && cmd.texture !== undefined && cmd.rotation !== undefined) {
                ctx.save();
                ctx.translate(cmd.x, cmd.y + TILE_HEIGHT / 2);
                ctx.scale(1, 0.4);
                ctx.rotate((cmd.rotation * Math.PI) / 180);
                ctx.filter = 'brightness(0.5) sepia(1) hue-rotate(-50deg) saturate(3)';
                ctx.globalAlpha = 0.8;
                drawEnemy(ctx, String(cmd.texture), 0, 0, SIZE, 0, false, 0, { x: 0, y: 0 }, 0, undefined, false);
                ctx.restore();
            }
        }
        else if (cmd.type === 'item') {
            if (cmd.item && cmd.x !== undefined && cmd.y !== undefined && cmd.w !== undefined) {
                drawItemSprite(ctx, cmd.item, cmd.x - cmd.w / 2, cmd.y + TILE_HEIGHT / 2 - cmd.w * 0.85, cmd.w);
            }
        }
        else if (cmd.type === 'player') {
            if (cmd.x !== undefined && cmd.y !== undefined && cmd.w !== undefined && cmd.appearance && cmd.playerClass) {
                // Glow effect
                if (!cmd.isInvisible) {
                    const glowSize = SIZE * 2 + Math.sin(this.frame * 0.1) * 5;
                    const gradient = ctx.createRadialGradient(cmd.x, cmd.y + TILE_HEIGHT / 2, 0, cmd.x, cmd.y + TILE_HEIGHT / 2, glowSize);
                    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
                    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(cmd.x - glowSize, cmd.y + TILE_HEIGHT / 2 - glowSize, glowSize * 2, glowSize * 2);
                }
                const PLAYER_SIZE = SIZE * 0.866;
                drawPlayer(ctx, cmd.x, cmd.y, PLAYER_SIZE, cmd.appearance, cmd.playerClass, this.frame,
                    cmd.lastAttackTime || 0, cmd.lastAttackDir || { x: 0, y: 0 },
                    cmd.lastSkillTime || 0, cmd.lastSkillId || null, !!cmd.isInvisible, cmd.lastMoveTime || 0,
                    cmd.spriteComp); // spriteComp might be undefined if not set in cmd
            }
        }
        else if (cmd.type === 'npc') {
            if (cmd.npc && cmd.x !== undefined && cmd.y !== undefined && cmd.w !== undefined) {
                drawNPC(ctx, cmd.npc, cmd.x, cmd.y, cmd.w, this.frame);
            }
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
