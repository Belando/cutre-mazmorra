import { GameState, RenderItem, IEffectsManager } from "@/types";
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
import { SIZE, TILE_HEIGHT, ENTITY, TILE, TILE_WIDTH } from "@/data/constants";
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

    // Object Pooling
    private renderPool: RenderItem[] = [];
    private poolIndex: number = 0;

    private getRenderItem(): RenderItem {
        if (this.poolIndex >= this.renderPool.length) {
            this.renderPool.push({ sortY: 0, type: 'custom' }); // Initialize with dummy
        }
        const item = this.renderPool[this.poolIndex++];
        this.resetRenderItem(item);
        return item;
    }

    private resetRenderItem(item: RenderItem) {
        // Resetting all optional fields to undefined or default
        item.x = undefined; item.y = undefined; item.w = undefined; item.h = undefined;
        item.color = undefined; item.texture = undefined; item.frame = undefined;
        item.health = undefined; item.maxHealth = undefined; item.flipX = undefined;
        item.appearance = undefined; item.playerClass = undefined;
        item.enemyType = undefined; item.stunned = undefined;
        item.lastAttackTime = undefined; item.lastMoveTime = undefined; item.lastAttackDir = undefined;
        item.spriteComp = undefined; item.isLarge = undefined;
        item.isOpen = undefined; item.rarity = undefined; item.item = undefined;
        item.npc = undefined; item.rotation = undefined;
        item.lastSkillTime = undefined; item.lastSkillId = undefined;
        item.isInvisible = undefined; item.opacity = undefined;
        item.draw = undefined;
    }

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
        effectsManager?: IEffectsManager
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
                const ENEMY_LERP = 0.05;
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

    private updateCamera(_state: GameState, effectsManager?: any) {
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
                // Increased visual multiplier for noticeable shake
                offsetX += (Math.random() - 0.5) * (manager.screenShake * 0.5);
                offsetY += (Math.random() - 0.5) * (manager.screenShake * 0.5);
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
        this.poolIndex = 0;

        // 0. WALLS
        this.addWallsAndDoors(renderList, state, offsetX, offsetY, viewportWidth, viewportHeight, getScreenPos, isOnCam);

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
                    const item = this.getRenderItem();
                    item.sortY = isoY + config.zOffset;
                    item.type = 'sprite';
                    item.texture = 'wallTorch';
                    item.x = sx; item.y = sy; item.w = SIZE; item.frame = this.frame;
                    item.flipX = isRightEmpty;
                    renderList.push(item);
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
                        const item = this.getRenderItem();
                        item.sortY = isoY + config.zOffset;
                        item.type = 'sprite';
                        item.texture = drawType;
                        item.x = sx; item.y = sy; item.w = SIZE;
                        item.frame = x + y;
                        renderList.push(item);
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
                    const item = this.getRenderItem();
                    item.sortY = isoY + config.zOffset;
                    item.type = 'sprite';
                    item.texture = 'chest';
                    item.x = sx; item.y = sy; item.w = SIZE;
                    item.isOpen = chest.isOpen;
                    item.rarity = chest.rarity;
                    renderList.push(item);
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
                const item = this.getRenderItem();
                item.sortY = isoY + config.zOffset;
                item.type = 'corpse';
                item.x = sx; item.y = sy; item.w = SIZE;
                item.texture = String(type);
                item.rotation = rotation;
                renderList.push(item);
            }
        });
    }

    private addItems(renderList: RenderItem[], state: GameState, getScreenPos: any, isOnCam: any) {
        const { items = [], visible } = state;
        const config = getSpriteConfig("item");

        items.forEach(itemInfo => {
            if (itemInfo.x === undefined || itemInfo.y === undefined) return;
            if (visible[itemInfo.y]?.[itemInfo.x]) {
                const { x: sx, y: sy, isoY } = getScreenPos(itemInfo.x, itemInfo.y);
                if (isOnCam(sx, sy)) {
                    const item = this.getRenderItem();
                    item.sortY = isoY + config.zOffset;
                    item.x = sx; item.y = sy; item.w = SIZE;

                    if (itemInfo.category === 'currency') {
                        item.type = 'sprite';
                        item.texture = 'goldPile';
                    } else {
                        item.type = 'item';
                        item.item = itemInfo;
                    }
                    renderList.push(item);
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
                    const item = this.getRenderItem();
                    item.sortY = isoY + config.zOffset;
                    item.type = 'enemy';
                    item.x = sx; item.y = sy; item.w = SIZE;
                    item.enemyType = enemy.type;
                    item.stunned = (enemy.stunned ?? 0) > 0;
                    item.lastAttackTime = enemy.lastAttackTime || 0;
                    item.lastAttackDir = enemy.lastAttackDir;
                    item.lastMoveTime = enemy.lastMoveTime;
                    item.spriteComp = enemy.sprite;
                    item.isLarge = isLarge;
                    item.health = enemy.hp; item.maxHealth = enemy.maxHp;
                    renderList.push(item);
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

        const item = this.getRenderItem();
        item.sortY = pIsoY + config.zOffset;
        item.type = 'player';
        item.x = psx; item.y = psy; item.w = SIZE;
        item.appearance = player.appearance;
        item.playerClass = player.class;
        item.frame = this.frame;
        item.lastAttackTime = player.lastAttackTime;
        item.lastMoveTime = player.lastMoveTime;
        item.lastAttackDir = player.lastAttackDir;
        item.lastSkillTime = player.lastSkillTime;
        item.lastSkillId = player.lastSkillId;
        item.isInvisible = isInvisible;
        item.spriteComp = player.sprite;
        renderList.push(item);
    }

    private addNPCs(renderList: RenderItem[], state: GameState, getScreenPos: any, isOnCam: any) {
        const { npcs = [], visible } = state;
        const config = getSpriteConfig("npc");

        npcs.forEach(npc => {
            if (visible[npc.y]?.[npc.x]) {
                const { x: sx, y: sy, isoY } = getScreenPos(npc.x, npc.y);
                if (isOnCam(sx, sy)) {
                    const item = this.getRenderItem();
                    item.sortY = isoY + config.zOffset;
                    item.type = 'npc';
                    item.npc = npc;
                    item.x = sx; item.y = sy; item.w = SIZE;
                    renderList.push(item);
                }
            }
        });
    }

    private addWallsAndDoors(renderList: RenderItem[], state: GameState, offsetX: number, offsetY: number, viewportWidth: number, viewportHeight: number, getScreenPos: any, isOnCam: any) {
        const { map, visible, explored, level, location } = state;
        const theme = getThemeForFloor(level || 1);
        const isHome = location === 'home';

        const padding = 2;
        const rangeX = Math.ceil(viewportWidth / 2) + padding;
        const rangeY = Math.ceil(viewportHeight / 2) + padding;

        let startX = Math.floor(offsetX - rangeX);
        let endX = Math.ceil(offsetX + rangeX + 4);
        let startY = Math.floor(offsetY - rangeY);
        let endY = Math.ceil(offsetY + rangeY + 4);

        if (!isHome) {
            startX = Math.max(0, startX);
            endX = Math.min(map[0].length, endX);
            startY = Math.max(0, startY);
            endY = Math.min(map.length, endY);
        } else {
            // Home override similar to map.ts
            startX = -60; endX = 100; startY = -60; endY = 100;
        }

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (!map[y] || map[y][x] === undefined) continue;

                let isExplored = explored[y]?.[x];
                let isVisible = visible[y]?.[x];

                if (isHome) { isExplored = true; isVisible = true; }

                if (isExplored) {
                    const tile = map[y][x];
                    const { x: sx, y: sy, isoY } = getScreenPos(x, y);

                    if (!isOnCam(sx, sy)) continue; // Optimization

                    if (tile === TILE.WALL) {
                        const baseWallColor = isVisible ? theme.wall : this.adjustBrightness(theme.wall, -50);

                        const item = this.getRenderItem();
                        item.sortY = isoY + 1.5;
                        item.type = 'wall';
                        item.x = sx - TILE_WIDTH / 2; // Fix alignment
                        item.y = sy; item.w = TILE_WIDTH; item.h = TILE_HEIGHT;
                        item.color = baseWallColor;
                        item.texture = 'wall';
                        renderList.push(item);

                    } else if (tile === TILE.DOOR || tile === TILE.DOOR_OPEN) {
                        const type = (tile === TILE.DOOR_OPEN) ? 'door_open' : 'door_closed';
                        const item = this.getRenderItem();
                        item.sortY = isoY + 1.1;
                        item.type = 'sprite';
                        item.texture = type;
                        item.x = sx; item.y = sy - TILE_HEIGHT * 0.5; item.w = TILE_WIDTH;
                        item.frame = 0; // Default frame
                        renderList.push(item);
                    } else if (tile === TILE.STAIRS) {
                        const item = this.getRenderItem();
                        item.sortY = isoY + 0.1; // Slightly above floor
                        item.type = 'sprite';
                        item.texture = 'stairs';
                        item.x = sx; item.y = sy; item.w = TILE_WIDTH;
                        renderList.push(item);
                    }
                }
            }
        }
    }

    private adjustBrightness(hex: string, amount: number) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, Math.min(255, (num >> 16) + amount));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
        const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
        return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
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
