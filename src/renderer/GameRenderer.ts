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
import { getSpriteConfig } from "@/data/spriteConfig";

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

        this.staticCtx = staticCanvas.getContext('2d', { alpha: false });
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
        const { player } = state;

        // --- VISUAL INTERPOLATION (Smoothing) ---
        this.updateVisuals(player, state.enemies || []);

        // --- CAMERA UPDATE ---
        const { offsetX, offsetY } = this.updateCamera(state, effectsManager);

        // --- RENDER LAYERS ---
        this.renderStaticLayer(state, offsetX, offsetY, viewportWidth, viewportHeight);
        this.renderDynamicLayer(state, offsetX, offsetY, viewportWidth, viewportHeight, effectsManager);
        this.renderLightingLayer(state, offsetX, offsetY);
    }

    private updateVisuals(player: any, enemies: any[]) {
        const LERP_SPEED = 0.2;

        // Player
        if (!this.playerVisual.initialized) {
            this.playerVisual.x = player.x;
            this.playerVisual.y = player.y;
            this.playerVisual.initialized = true;
        } else {
            this.playerVisual.x += (player.x - this.playerVisual.x) * LERP_SPEED;
            this.playerVisual.y += (player.y - this.playerVisual.y) * LERP_SPEED;
        }

        // Enemies
        const activeEnemyIds = new Set<string | number>();
        enemies.forEach(enemy => {
            const id = enemy.id;
            activeEnemyIds.add(id);
            let visual = this.enemyVisuals.get(id);
            if (!visual) {
                visual = { x: enemy.x, y: enemy.y };
                this.enemyVisuals.set(id, visual);
            } else {
                const ENEMY_LERP = 0.1;
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
    }

    private updateCamera(state: GameState, effectsManager?: any) {
        // Use visual position for camera target to follow smoothly
        const target = { x: this.playerVisual.x, y: this.playerVisual.y };
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
        return { offsetX, offsetY };
    }

    private renderStaticLayer(state: GameState, offsetX: number, offsetY: number, viewportWidth: number, viewportHeight: number) {
        const { map, visible, explored, level = 1 } = state;
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
    }

    private renderDynamicLayer(state: GameState, offsetX: number, offsetY: number, viewportWidth: number, viewportHeight: number, effectsManager?: any) {
        const ctx = this.dynamicCtx;
        if (!ctx || !this.dynamicCanvas) return;

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

        // 0. WALLS
        drawMap(ctx, state, offsetX, offsetY, viewportWidth, viewportHeight, renderList, 'wall');

        // Populate Render List
        this.addTorches(renderList, state, getScreenPos, isOnCam);
        this.addEnvironmentObjects(renderList, state, getScreenPos, isOnCam);
        this.addChests(renderList, state, getScreenPos, isOnCam);
        this.addCorpses(renderList, state, getScreenPos, isOnCam);
        this.addItems(renderList, state, getScreenPos, isOnCam);
        this.addEnemies(renderList, state, getScreenPos, isOnCam);
        this.addPlayer(renderList, state, getScreenPos); // Player always checked
        this.addNPCs(renderList, state, getScreenPos, isOnCam);

        // Occlusion Check
        this.applyOcclusion(renderList, getScreenPos);

        // Sort & Execute
        renderList.sort((a, b) => a.sortY - b.sortY);

        for (const item of renderList) {
            if (item.draw) item.draw();
            else this.executeCommand(ctx, item, state.level || 1);
        }

        // Ambient Effects
        const theme = getThemeForFloor(state.level || 1);
        if (theme.lavaGlow || theme.embers) {
            drawAmbientOverlay(ctx, canvasW, canvasH, state.level || 1, this.frame);
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

    private addTorches(renderList: RenderItem[], state: GameState, getScreenPos: any, isOnCam: any) {
        const { torches = [], explored, map } = state;
        const config = getSpriteConfig("torch");

        torches.forEach(torch => {
            if (explored[torch.y]?.[torch.x]) {
                const { x: sx, y: sy, isoY } = getScreenPos(torch.x, torch.y);
                if (isOnCam(sx, sy)) {
                    const isRightEmpty = map[torch.y]?.[torch.x + 1] !== 0;
                    renderList.push({
                        sortY: isoY + config.zOffset,
                        type: 'sprite',
                        texture: 'wallTorch',
                        x: sx, y: sy, w: SIZE, frame: this.frame,
                        flipX: isRightEmpty
                    });
                }
            }
        });
    }

    private addEnvironmentObjects(renderList: RenderItem[], state: GameState, getScreenPos: any, isOnCam: any) {
        if (!state.entities) return;
        const { visible } = state;

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
                        const config = getSpriteConfig(drawType);
                        renderList.push({
                            sortY: isoY + config.zOffset,
                            type: 'sprite',
                            texture: drawType,
                            x: sx, y: sy, w: SIZE,
                            frame: x + y
                        });
                    }
                }
            });
        });
    }

    private addChests(renderList: RenderItem[], state: GameState, getScreenPos: any, isOnCam: any) {
        const { chests = [], visible } = state;
        const config = getSpriteConfig("chest");

        chests.forEach(chest => {
            if (visible[chest.y]?.[chest.x]) {
                const { x: sx, y: sy, isoY } = getScreenPos(chest.x, chest.y);
                if (isOnCam(sx, sy)) {
                    renderList.push({
                        sortY: isoY + config.zOffset,
                        type: 'sprite',
                        texture: 'chest',
                        x: sx, y: sy, w: SIZE,
                        isOpen: chest.isOpen, rarity: chest.rarity
                    });
                }
            }
        });
    }

    private addCorpses(renderList: RenderItem[], state: GameState, getScreenPos: any, isOnCam: any) {
        const { corpses = [], visible } = state;
        const config = getSpriteConfig("corpse");

        corpses.forEach(corpse => {
            const { x, y, type, rotation } = corpse;
            if (!visible[y]?.[x]) return;

            const { x: sx, y: sy, isoY } = getScreenPos(x, y);
            if (isOnCam(sx, sy)) {
                renderList.push({
                    sortY: isoY + config.zOffset,
                    type: 'corpse',
                    x: sx, y: sy, w: SIZE,
                    texture: String(type),
                    rotation: rotation
                });
            }
        });
    }

    private addItems(renderList: RenderItem[], state: GameState, getScreenPos: any, isOnCam: any) {
        const { items = [], visible } = state;
        const config = getSpriteConfig("item");

        items.forEach(item => {
            if (item.x === undefined || item.y === undefined) return;
            if (visible[item.y]?.[item.x]) {
                const { x: sx, y: sy, isoY } = getScreenPos(item.x, item.y);
                if (isOnCam(sx, sy)) {
                    if (item.category === 'currency') {
                        renderList.push({
                            sortY: isoY + config.zOffset,
                            type: 'sprite',
                            texture: 'goldPile',
                            x: sx, y: sy, w: SIZE
                        });
                    } else {
                        renderList.push({
                            sortY: isoY + config.zOffset,
                            type: 'item',
                            item: item,
                            x: sx, y: sy, w: SIZE
                        });
                    }
                }
            }
        });
    }

    private addEnemies(renderList: RenderItem[], state: GameState, getScreenPos: any, isOnCam: any) {
        const { enemies = [], visible } = state;
        const config = getSpriteConfig("enemy");

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
                        sortY: isoY + config.zOffset,
                        type: 'enemy',
                        x: sx, y: sy, w: SIZE,
                        enemyType: enemy.type,
                        stunned: (enemy.stunned ?? 0) > 0,
                        lastAttackTime: enemy.lastAttackTime || 0,
                        lastAttackDir: enemy.lastAttackDir,
                        lastMoveTime: enemy.lastMoveTime,
                        spriteComp: enemy.sprite,
                        isLarge: isLarge,
                        health: enemy.hp, maxHealth: enemy.maxHp
                    });
                }
            }
        });
    }

    private addPlayer(renderList: RenderItem[], state: GameState, getScreenPos: any) {
        if (!state.player) return;
        const { player } = state;
        const config = getSpriteConfig("player");

        const isInvisible = player.skills.buffs.some(b => b.invisible) || false;
        const { x: psx, y: psy, isoY: pIsoY } = getScreenPos(this.playerVisual.x, this.playerVisual.y);

        renderList.push({
            sortY: pIsoY + config.zOffset,
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
    }

    private addNPCs(renderList: RenderItem[], state: GameState, getScreenPos: any, isOnCam: any) {
        const { npcs = [], visible } = state;
        const config = getSpriteConfig("npc");

        npcs.forEach(npc => {
            if (visible[npc.y]?.[npc.x]) {
                const { x: sx, y: sy, isoY } = getScreenPos(npc.x, npc.y);
                if (isOnCam(sx, sy)) {
                    renderList.push({
                        sortY: isoY + config.zOffset,
                        type: 'npc',
                        npc: npc,
                        x: sx, y: sy, w: SIZE
                    });
                }
            }
        });
    }

    private applyOcclusion(renderList: RenderItem[], getScreenPos: any) {
        const { x: psx, y: psy } = getScreenPos(this.playerVisual.x, this.playerVisual.y);
        const pIsoY = (this.playerVisual.x + this.playerVisual.y) * TILE_HEIGHT / 2;

        renderList.forEach(item => {
            if (item.type === 'wall' && item.color) {
                if (item.sortY > pIsoY + 0.1) {
                    const dx = Math.abs(item.x! - psx);
                    const dy = Math.abs(item.y! - psy);
                    if (dx < SIZE * 0.8 && dy < SIZE * 1.5) {
                        item.opacity = 0.4;
                    }
                }
            }
        });
    }

    // ... (previous code)

    private executeCommand(ctx: CanvasRenderingContext2D, cmd: RenderItem, level: number) {
        const prevAlpha = ctx.globalAlpha;
        if (cmd.opacity !== undefined) {
            ctx.globalAlpha = cmd.opacity;
        }

        const strategy = this.renderStrategies[cmd.type];
        if (strategy) {
            strategy.call(this, ctx, cmd, level);
        }

        if (cmd.opacity !== undefined) {
            ctx.globalAlpha = prevAlpha;
        }
    }

    private renderStrategies: Record<string, (ctx: CanvasRenderingContext2D, cmd: RenderItem, level: number) => void> = {
        'sprite': this.renderSprite,
        'enemy': this.renderEnemy,
        'wall': this.renderWall,
        'corpse': this.renderCorpse,
        'item': this.renderItem,
        'player': this.renderPlayer,
        'npc': this.renderNPC
    };

    private renderSprite(ctx: CanvasRenderingContext2D, cmd: RenderItem) {
        if (cmd.texture && cmd.x !== undefined && cmd.y !== undefined && cmd.w !== undefined) {
            if (cmd.isOpen !== undefined) { // CHEST
                drawEnvironmentSprite(ctx, 'chest', cmd.x, cmd.y, cmd.w, cmd.isOpen, cmd.rarity);
            } else {
                drawEnvironmentSprite(ctx, cmd.texture, cmd.x, cmd.y, cmd.w, cmd.frame);
            }
        }
    }

    private renderEnemy(ctx: CanvasRenderingContext2D, cmd: RenderItem) {
        if (cmd.enemyType === undefined || cmd.x === undefined || cmd.y === undefined || cmd.w === undefined) return;

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

    private renderWall(ctx: CanvasRenderingContext2D, cmd: RenderItem, level: number) {
        if (cmd.x !== undefined && cmd.y !== undefined && cmd.w !== undefined && cmd.h !== undefined && cmd.color) {
            drawSpriteIsoWall(ctx, cmd.x, cmd.y, cmd.w, cmd.h, cmd.color, level);
        }
    }

    private renderCorpse(ctx: CanvasRenderingContext2D, cmd: RenderItem) {
        if (cmd.x !== undefined && cmd.y !== undefined && cmd.w !== undefined && cmd.texture !== undefined && cmd.rotation !== undefined) {
            const config = getSpriteConfig("corpse");
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

    private renderItem(ctx: CanvasRenderingContext2D, cmd: RenderItem) {
        if (cmd.item && cmd.x !== undefined && cmd.y !== undefined && cmd.w !== undefined) {
            drawItemSprite(ctx, cmd.item, cmd.x - cmd.w / 2, cmd.y + TILE_HEIGHT / 2 - cmd.w * 0.85, cmd.w);
        }
    }

    private renderPlayer(ctx: CanvasRenderingContext2D, cmd: RenderItem) {
        if (cmd.x !== undefined && cmd.y !== undefined && cmd.w !== undefined && cmd.appearance && cmd.playerClass) {
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
                cmd.spriteComp);
        }
    }

    private renderNPC(ctx: CanvasRenderingContext2D, cmd: RenderItem) {
        if (cmd.npc && cmd.x !== undefined && cmd.y !== undefined && cmd.w !== undefined) {
            drawNPC(ctx, cmd.npc, cmd.x, cmd.y, cmd.w, this.frame);
        }
    }

    private renderLightingLayer(state: GameState, offsetX: number, offsetY: number) {
        if (this.lightingCtx && this.lightingCanvas && this.dynamicCanvas) {
            if (this.lightingCanvas.width !== this.dynamicCanvas.width) {
                this.lightingCanvas.width = this.dynamicCanvas.width;
                this.lightingCanvas.height = this.dynamicCanvas.height;
            }
            renderLighting(this.lightingCtx, this.lightingCanvas.width, this.lightingCanvas.height, state, offsetX, offsetY);
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
