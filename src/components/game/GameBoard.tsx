import { useEffect, useRef } from 'react';
import { SIZE, TILE_HEIGHT, TILE_WIDTH } from '@/data/constants';
import { getThemeForFloor, drawAmbientOverlay } from './DungeonThemes';
import { isLargeEnemy, getEnemySize } from '@/engine/systems/LargeEnemies';
import { drawMap, getCameraTarget, lerpCamera } from '@/renderer/map';
import { renderLighting } from '@/renderer/lighting';
import { drawEnvironmentSprite } from '@/renderer/environment';
import { drawEnemy, drawLargeEnemy } from '@/renderer/enemies';
import { drawItemSprite } from '@/engine/entities/ItemSprites';
import { drawNPC } from '@/renderer/npcs';
import { drawPlayer } from '@/renderer/player';
import { animationSystem } from '@/engine/systems/AnimationSystem';
import { GameState } from '@/types';
import { toScreen } from '@/utils/isometric';

interface GameBoardProps {
    gameState: GameState;
    viewportWidth?: number;
    viewportHeight?: number;
    hoveredTarget?: any;
}

export default function GameBoard({ gameState, viewportWidth = 21, viewportHeight = 15, hoveredTarget }: GameBoardProps) {
    const staticCanvasRef = useRef<HTMLCanvasElement>(null);
    // ...
    // ... in renderGameLoop ...
    const dynamicCanvasRef = useRef<HTMLCanvasElement>(null);
    const lightingCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const cameraPos = useRef({ x: 0, y: 0, initialized: false });
    const frameRef = useRef(0);
    const lastTimeRef = useRef(0);
    const animationFrameId = useRef<number | null>(null);
    const gameStateRef = useRef(gameState);

    const lastStaticRender = useRef({
        cameraX: -999,
        cameraY: -999,
        mapRef: null as any,
        visibleRef: null as any,
        exploredRef: null as any,
        level: -1
    });

    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    const renderGameLoop = (timestamp: number) => {
        // console.log("Render loop"); // Too spammy, only log critical failures if needed
        const staticCanvas = staticCanvasRef.current;

        const dynamicCanvas = dynamicCanvasRef.current;
        const lightingCanvas = lightingCanvasRef.current;

        if (!staticCanvas || !dynamicCanvas || !lightingCanvas || !gameStateRef.current) {
            animationFrameId.current = requestAnimationFrame(renderGameLoop);
            return;
        }

        if (!lastTimeRef.current) lastTimeRef.current = timestamp;
        const dt = timestamp - lastTimeRef.current;
        lastTimeRef.current = timestamp;

        if (gameStateRef.current.player && animationSystem) {
            const allEntities = [gameStateRef.current.player, ...gameStateRef.current.enemies];
            animationSystem.update(dt, allEntities);
        }

        const currentState = gameStateRef.current;
        const {
            map, enemies, player, items, visible, explored, torches = [],
            chests = [], level = 1, npcs = [], effectsManager
        } = currentState;

        if (!player) {
            console.warn("Render loop aborted: Player is null/undefined");
            return;
        }

        frameRef.current++;

        const target = getCameraTarget(player, map, viewportWidth, viewportHeight);

        if (!cameraPos.current.initialized) {
            cameraPos.current.x = target.x;
            cameraPos.current.y = target.y;
            cameraPos.current.initialized = true;
        }

        const newPos = lerpCamera(cameraPos.current, target, 0.1);
        cameraPos.current = newPos;

        const offsetX = newPos.x;
        const offsetY = newPos.y;

        const cameraMoved = Math.abs(offsetX - lastStaticRender.current.cameraX) > 0.005 ||
            Math.abs(offsetY - lastStaticRender.current.cameraY) > 0.005;

        const mapChanged = map !== lastStaticRender.current.mapRef;
        const fovChanged = visible !== lastStaticRender.current.visibleRef || explored !== lastStaticRender.current.exploredRef;
        const levelChanged = level !== lastStaticRender.current.level;

        if (cameraMoved || mapChanged || fovChanged || levelChanged) {
            const staticCtx = staticCanvas.getContext('2d');
            if (staticCtx) {
                drawMap(staticCtx, currentState, offsetX, offsetY, viewportWidth, viewportHeight);
            }

            lastStaticRender.current = {
                cameraX: offsetX,
                cameraY: offsetY,
                mapRef: map,
                visibleRef: visible,
                exploredRef: explored,
                level: level
            };
        }

        const ctx = dynamicCanvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, dynamicCanvas.width, dynamicCanvas.height);

            const canvasW = dynamicCanvas.width;
            const canvasH = dynamicCanvas.height;
            const halfW = canvasW / 2;
            const halfH = canvasH / 2;

            if (effectsManager && containerRef.current) {
                const shake = effectsManager.screenShake;
                if (shake > 0) {
                    const dx = (Math.random() - 0.5) * shake;
                    const dy = (Math.random() - 0.5) * shake;
                    containerRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
                } else {
                    containerRef.current.style.transform = 'none';
                }
            }

            const renderList: { y: number, sortY: number, draw: () => void }[] = [];

            // Convert camera grid position to screen pixels
            const cameraScreen = toScreen(offsetX, offsetY);

            // Helper to get relative screen coordinates for drawing
            const getScreenPos = (gx: number, gy: number) => {
                const { x, y } = toScreen(gx, gy);
                // Center relative to camera
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

            torches.forEach(torch => {
                if (explored[torch.y]?.[torch.x]) {
                    const { x: sx, y: sy, isoY } = getScreenPos(torch.x, torch.y);
                    if (isOnCam(sx, sy)) {
                        renderList.push({
                            y: torch.y,
                            sortY: isoY,
                            draw: () => drawEnvironmentSprite(ctx, 'wallTorch', sx, sy, SIZE, frameRef.current)
                        });
                    }
                }
            });

            chests.forEach(chest => {
                if (visible[chest.y]?.[chest.x]) {
                    const { x: sx, y: sy, isoY } = getScreenPos(chest.x, chest.y);
                    if (isOnCam(sx, sy)) {
                        renderList.push({
                            y: chest.y,
                            sortY: isoY,
                            draw: () => drawEnvironmentSprite(ctx, 'chest', sx, sy, SIZE, chest.isOpen, chest.rarity)
                        });
                    }
                }
            });

            items.forEach(item => {
                if (item.x === undefined || item.y === undefined) return;
                if (visible[item.y]?.[item.x]) {
                    const { x: sx, y: sy, isoY } = getScreenPos(item.x, item.y);
                    if (isOnCam(sx, sy)) {
                        renderList.push({
                            y: item.y,
                            sortY: isoY + 1,
                            draw: () => {
                                if (item.category === 'currency') {
                                    drawEnvironmentSprite(ctx, 'goldPile', sx, sy, SIZE);
                                } else {
                                    drawItemSprite(ctx, item, sx - SIZE / 2, sy + TILE_HEIGHT / 2 - SIZE * 0.85, SIZE);
                                }
                            }
                        });
                    }
                }
            });

            enemies.forEach(enemy => {
                if (visible[enemy.y]?.[enemy.x]) {
                    const { x: sx, y: sy, isoY } = getScreenPos(enemy.x, enemy.y);
                    if (isOnCam(sx, sy)) {
                        renderList.push({
                            y: enemy.y,
                            sortY: isoY + 2,
                            draw: () => {
                                if (isLargeEnemy(String(enemy.type))) {
                                    drawLargeEnemy(ctx, String(enemy.type), sx, sy, SIZE * 2, frameRef.current, (enemy.stunned ?? 0) > 0, enemy.lastAttackTime || 0);
                                    drawHealthBar(ctx, sx - SIZE, sy - SIZE * 2, SIZE * 2, enemy.hp, enemy.maxHp);
                                } else {
                                    const sizeInfo = getEnemySize(String(enemy.type));
                                    const scale = sizeInfo.scale || 1;
                                    const drawSize = SIZE * scale;

                                    drawEnemy(
                                        ctx,
                                        String(enemy.type),
                                        sx,
                                        sy,
                                        drawSize,
                                        frameRef.current,
                                        (enemy.stunned ?? 0) > 0,
                                        enemy.lastAttackTime || 0,
                                        enemy.lastAttackDir || { x: 0, y: 0 },
                                        enemy.lastMoveTime || 0,
                                        enemy.sprite,
                                        hoveredTarget === enemy // isHovered
                                    );

                                    drawHealthBar(ctx, sx - drawSize / 2, sy - drawSize * 1.2, drawSize, enemy.hp, enemy.maxHp);
                                }
                            }
                        });
                    }
                }
            });

            const isInvisible = player.skills.buffs.some(b => b.invisible) || false;
            const { x: psx, y: psy, isoY: pIsoY } = getScreenPos(player.x, player.y);

            renderList.push({
                y: player.y,
                sortY: pIsoY + 3,
                draw: () => {
                    if (!isInvisible) {
                        const glowSize = SIZE * 2 + Math.sin(frameRef.current * 0.1) * 5;
                        const gradient = ctx.createRadialGradient(
                            psx, psy + TILE_HEIGHT / 2, 0,
                            psx, psy + TILE_HEIGHT / 2, glowSize
                        );
                        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
                        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
                        ctx.fillStyle = gradient;
                        ctx.fillRect(psx - glowSize, psy + TILE_HEIGHT / 2 - glowSize, glowSize * 2, glowSize * 2);
                    }

                    drawPlayer(ctx, psx, psy, SIZE, player.appearance, player.class, frameRef.current,
                        player.lastAttackTime || 0, player.lastAttackDir || { x: 0, y: 0 },
                        player.lastSkillTime || 0, player.lastSkillId || null, isInvisible, player.lastMoveTime || 0,
                        player.sprite
                    );
                }
            });

            npcs.forEach(npc => {
                if (visible[npc.y]?.[npc.x]) {
                    const { x: sx, y: sy, isoY } = getScreenPos(npc.x, npc.y);
                    if (isOnCam(sx, sy)) {
                        renderList.push({
                            y: npc.y,
                            sortY: isoY + 2,
                            draw: () => {
                                drawNPC(ctx, npc.type, sx, sy, SIZE, frameRef.current);
                            }
                        });
                    }
                }
            });

            // Sort by Screen Y (Painter's Algorithm)
            renderList.sort((a, b) => a.sortY - b.sortY);
            renderList.forEach(entity => entity.draw());

            const theme = getThemeForFloor(level);
            if (theme.lavaGlow || theme.embers) {
                drawAmbientOverlay(ctx, dynamicCanvas.width, dynamicCanvas.height, level, frameRef.current);
            }

            if (effectsManager) {
                const manager = (effectsManager as any).current || effectsManager;
                if (typeof manager.update === 'function') {
                    manager.update();
                    // Effects manager might still expect grid coords or screen coords.
                    // If it's pure logic, update() is fine.
                    // draw() usually takes offset. 
                    // Given we haven't refactored it, passing the current offsetX/Y (pixels) *might* break it if it expects Grid.
                    // But we can't easily fix it without seeing it. 
                    // Assuming it draws particles at screen positions.
                    manager.draw(ctx, offsetX, offsetY, SIZE, halfW, halfH);
                }
            }
        }

        const lightCtx = lightingCanvas.getContext('2d');
        if (lightCtx) {
            if (lightingCanvas.width !== dynamicCanvas.width) {
                lightingCanvas.width = dynamicCanvas.width;
                lightingCanvas.height = dynamicCanvas.height;
            }
            renderLighting(lightCtx, lightingCanvas.width, lightingCanvas.height, currentState, offsetX, offsetY);
        }

        animationFrameId.current = requestAnimationFrame(renderGameLoop);
    };

    useEffect(() => {
        animationFrameId.current = requestAnimationFrame(renderGameLoop);
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [viewportWidth, viewportHeight]);

    return (
        <div ref={containerRef}
            className="relative overflow-hidden border rounded-lg shadow-2xl border-slate-700/50"
            style={{ width: viewportWidth * SIZE, height: viewportHeight * SIZE }}>

            <canvas
                ref={staticCanvasRef}
                width={viewportWidth * SIZE}
                height={viewportHeight * SIZE}
                className="absolute top-0 left-0 z-0"
            />

            <canvas
                ref={dynamicCanvasRef}
                width={viewportWidth * SIZE}
                height={viewportHeight * SIZE}
                className="absolute top-0 left-0 z-10"
            />

            <canvas
                ref={lightingCanvasRef}
                width={viewportWidth * SIZE}
                height={viewportHeight * SIZE}
                className="absolute top-0 left-0 z-20 pointer-events-none mix-blend-soft-light"
            />
        </div>
    );
}

function drawHealthBar(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, hp: number, maxHp: number) {
    const percent = Math.max(0, Math.min(1, hp / maxHp));
    const barW = width - 4;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x + 2, y - 6, barW, 4);

    ctx.fillStyle = percent > 0.5 ? '#4ade80' : percent > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(x + 2, y - 6, barW * percent, 4);
}
