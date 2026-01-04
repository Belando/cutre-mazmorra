import { GameState, RenderItem } from "@/types";
import { drawMap, getCameraTarget, lerpCamera, drawSpriteIsoWall } from "./map";
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
        _hoveredTarget: any,
        effectsManager?: any
    ) {
        if (!this.staticCanvas || !this.dynamicCanvas || !this.lightingCanvas || !state.player) return;

        this.frame++;
        const { player, map, enemies, corpses = [], items, visible, explored, torches = [], chests = [], level = 1, npcs = [] } = state;

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
                        type: 'custom',
                        // type: 'enemy', // REPLACED
                        draw: () => {
                            ctx.save();
                            ctx.translate(sx, sy + TILE_HEIGHT / 2);
                            ctx.scale(1, 0.4);
                            ctx.rotate((rotation * Math.PI) / 180);
                            ctx.filter = 'brightness(0.5) sepia(1) hue-rotate(-50deg) saturate(3)';
                            ctx.globalAlpha = 0.8;
                            drawEnemy(ctx, String(type), 0, 0, SIZE, 0, false, 0, { x: 0, y: 0 }, 0, undefined, false);
                            ctx.restore();
                        }
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
                                type: 'custom', // drawItemSprite is complex
                                draw: () => drawItemSprite(ctx, item, sx - SIZE / 2, sy + TILE_HEIGHT / 2 - SIZE * 0.85, SIZE)
                            });
                        }
                    }
                }
            });

            // 4. Enemies
            enemies.forEach(enemy => {
                if (visible[enemy.y]?.[enemy.x]) {
                    const { x: sx, y: sy, isoY } = getScreenPos(enemy.x, enemy.y);
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
            const { x: psx, y: psy, isoY: pIsoY } = getScreenPos(player.x, player.y);
            renderList.push({
                sortY: pIsoY + 3,
                // type: 'player', // Using custom for now
                x: psx, y: psy,
                appearance: player.appearance,
                playerClass: player.class,
                frame: this.frame,
                lastAttackTime: player.lastAttackTime,
                lastMoveTime: player.lastMoveTime,
                // Passing invisible state via color/alpha logic? 
                // Creating 'PLAYER' handler 
                // We need to pass all these props.
                // Using 'custom' for player to avoid moving `drawPlayer` huge signature logic right now
                // Wait, player is CRITICAL. Let's try to optimize it. 
                // Actually, just pushing 1 closure for player is fine. 100 closures for walls is the problem.
                // I will use custom for player to be safe.
                type: 'custom',
                draw: () => {
                    if (!isInvisible) {
                        const glowSize = SIZE * 2 + Math.sin(this.frame * 0.1) * 5;
                        const gradient = ctx.createRadialGradient(psx, psy + TILE_HEIGHT / 2, 0, psx, psy + TILE_HEIGHT / 2, glowSize);
                        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
                        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
                        ctx.fillStyle = gradient;
                        ctx.fillRect(psx - glowSize, psy + TILE_HEIGHT / 2 - glowSize, glowSize * 2, glowSize * 2);
                    }
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
                            sortY: isoY + 2,
                            type: 'custom',
                            draw: () => drawNPC(ctx, npc, sx, sy, SIZE, this.frame)
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
    }


    private drawHealthBar(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, hp: number, maxHp: number) {
        const percent = Math.max(0, Math.min(1, hp / maxHp));
        const barW = width - 4;
        ctx.fillStyle = '#1a1a2e'; ctx.fillRect(x + 2, y - 6, barW, 4);
        ctx.fillStyle = percent > 0.5 ? '#4ade80' : percent > 0.25 ? '#eab308' : '#ef4444';
        ctx.fillRect(x + 2, y - 6, barW * percent, 4);
    }
}
