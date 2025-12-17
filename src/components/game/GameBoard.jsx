import React, { useEffect, useRef } from 'react';
import { SIZE } from '@/data/constants'; 
import { getThemeForFloor, drawAmbientOverlay } from './DungeonThemes';
import { isLargeEnemy, getEnemySize } from '@/engine/systems/LargeEnemies';
import { drawMap, getCameraTarget, lerpCamera } from '@/renderer/map';
import { renderLighting } from '@/renderer/lighting';
import { drawEnvironmentSprite } from '@/renderer/environment';
import { drawEnemy, drawLargeEnemy } from '@/renderer/enemies';
import { drawNPC } from '@/renderer/npcs';
import { drawPlayer } from '@/renderer/player';
import { animationSystem } from '@/engine/systems/AnimationSystem';

export default function GameBoard({ gameState, viewportWidth = 21, viewportHeight = 15 }) {
  const staticCanvasRef = useRef(null);
  const dynamicCanvasRef = useRef(null);
  const lightingCanvasRef = useRef(null);
  const containerRef = useRef(null);

  // Estado mutable para la cámara y el loop
  const cameraPos = useRef({ x: 0, y: 0, initialized: false });
  const frameRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animationFrameId = useRef(null);
  const gameStateRef = useRef(gameState);

  // Referencia para recordar el último estado dibujado en la capa estática
  const lastStaticRender = useRef({
    cameraX: -999,
    cameraY: -999,
    mapRef: null,
    visibleRef: null,
    exploredRef: null,
    level: -1
  });

  // Mantener la referencia del estado actualizada
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // --- BUCLE PRINCIPAL DE RENDERIZADO ---
  const renderGameLoop = (timestamp) => {
    const staticCanvas = staticCanvasRef.current;
    const dynamicCanvas = dynamicCanvasRef.current;
    const lightingCanvas = lightingCanvasRef.current;
    
    // Verificación de seguridad
    if (!staticCanvas || !dynamicCanvas || !lightingCanvas || !gameStateRef.current) {
        animationFrameId.current = requestAnimationFrame(renderGameLoop);
        return;
    }

    // 0. CALCULAR DELTA TIME
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const dt = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;
    
    // UPDATE ANIMATIONS
    if (gameStateRef.current.player && animationSystem) {
         const allEntities = [gameStateRef.current.player, ...gameStateRef.current.enemies];
         animationSystem.update(dt, allEntities);
    }
    
    const currentState = gameStateRef.current;
    const { 
        map, enemies, player, items, visible, explored, torches = [], 
        chests = [], level = 1, npcs = [], effectsManager 
    } = currentState;
    
    frameRef.current++;
    
    // 1. CÁMARA
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

    // --- OPTIMIZACIÓN 1: RENDERIZADO CONDICIONAL DE CAPA ESTÁTICA ---
    // Comprobamos si algo relevante ha cambiado
    const cameraMoved = Math.abs(offsetX - lastStaticRender.current.cameraX) > 0.005 || 
                        Math.abs(offsetY - lastStaticRender.current.cameraY) > 0.005;
    
    const mapChanged = map !== lastStaticRender.current.mapRef;
    const fovChanged = visible !== lastStaticRender.current.visibleRef || explored !== lastStaticRender.current.exploredRef;
    const levelChanged = level !== lastStaticRender.current.level;

    if (cameraMoved || mapChanged || fovChanged || levelChanged) {
        const staticCtx = staticCanvas.getContext('2d');
        // Solo dibujamos el mapa si es necesario
        drawMap(staticCtx, currentState, offsetX, offsetY, viewportWidth, viewportHeight);
        
        // Actualizamos la referencia
        lastStaticRender.current = {
            cameraX: offsetX,
            cameraY: offsetY,
            mapRef: map,
            visibleRef: visible,
            exploredRef: explored,
            level: level
        };
    }

    // 3. CAPA DINÁMICA (Entidades) - Se redibuja SIEMPRE (60fps)
    const ctx = dynamicCanvas.getContext('2d');
    ctx.clearRect(0, 0, dynamicCanvas.width, dynamicCanvas.height);
    
    // -- SCREEN SHAKE --
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

    // A) OBJETOS DE SUELO (Siempre debajo de las entidades vivas)
    // Usamos el estado explorado para dibujar solo lo que el jugador conoce
    
    // Antorchas de pared
    torches.forEach(torch => {
      const sx = (torch.x * SIZE) - (offsetX * SIZE);
      const sy = (torch.y * SIZE) - (offsetY * SIZE);
      
      if (explored[torch.y]?.[torch.x] && isOnScreen(sx, sy, dynamicCanvas.width, dynamicCanvas.height)) {
        drawEnvironmentSprite(ctx, 'wallTorch', sx, sy, SIZE, frameRef.current);
      }
    });
    
    // Cofres
    chests.forEach(chest => {
      const sx = (chest.x * SIZE) - (offsetX * SIZE);
      const sy = (chest.y * SIZE) - (offsetY * SIZE);
      // Los cofres solo se ven si están en visible, no solo explorado (opcional, decisión de diseño)
      if (visible[chest.y]?.[chest.x] && isOnScreen(sx, sy, dynamicCanvas.width, dynamicCanvas.height)) {
        drawEnvironmentSprite(ctx, 'chest', sx, sy, SIZE, chest.isOpen, chest.rarity);
      }
    });
    
    // Items (Suelo)
    items.forEach(item => {
      const sx = (item.x * SIZE) - (offsetX * SIZE);
      const sy = (item.y * SIZE) - (offsetY * SIZE);
      if (visible[item.y]?.[item.x] && isOnScreen(sx, sy, dynamicCanvas.width, dynamicCanvas.height)) {
        if (item.category === 'currency') {
          drawEnvironmentSprite(ctx, 'goldPile', sx, sy, SIZE);
        } else {
          // Glow simple para items
          ctx.shadowColor = 'white';
          ctx.shadowBlur = 5;
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(item.symbol, sx + SIZE/2, sy + SIZE/2);
          ctx.shadowBlur = 0;
        }
      }
    });
    
    // B) LISTA UNIFICADA DE ENTIDADES (Jugador, Enemigos, NPCs)
    const renderList = [];

    // 1. Agregar Enemigos Visibles
    enemies.forEach(enemy => {
      if (visible[enemy.y]?.[enemy.x]) {
        renderList.push({
          y: enemy.y,
          type: 'enemy',
          draw: () => {
            const sx = (enemy.x * SIZE) - (offsetX * SIZE);
            const sy = (enemy.y * SIZE) - (offsetY * SIZE);
            
            if (isOnScreen(sx, sy, dynamicCanvas.width, dynamicCanvas.height)) {
                const isStunnedVisual = enemy.stunned > 0 || enemy.lastAction === 'stunned';

                if (isLargeEnemy(enemy.type)) {
                    drawLargeEnemy(ctx, enemy.type, sx, sy, SIZE * 2, frameRef.current, isStunnedVisual, enemy.lastAttackTime || 0);
                    drawHealthBar(ctx, sx, sy, SIZE * 2, enemy.hp, enemy.maxHp);
                } else {
                    const sizeInfo = getEnemySize(enemy.type);
                    const scale = sizeInfo.scale || 1;
                    const drawSize = SIZE * scale;
                    const offsetDraw = (drawSize - SIZE) / 2;
                    
                    drawEnemy(
                        ctx, 
                        enemy.type, 
                        sx - offsetDraw, 
                        sy - offsetDraw, 
                        drawSize, 
                        frameRef.current, 
                        isStunnedVisual, 
                        enemy.lastAttackTime || 0,
                        enemy.lastAttackDir || { x: 0, y: 0 },
                        enemy.lastMoveTime || 0,
                        enemy.sprite
                    );
                    
                    drawHealthBar(ctx, sx - offsetDraw, sy - offsetDraw, drawSize, enemy.hp, enemy.maxHp);
                }
            }
          }
        });
      }
    });
    
    // 2. Agregar Jugador
    const isInvisible = player.skills?.buffs?.some(b => b.invisible) || false;
    renderList.push({
        y: player.y,
        type: 'player',
        draw: () => {
            const psx = (player.x * SIZE) - (offsetX * SIZE);
            const psy = (player.y * SIZE) - (offsetY * SIZE);

            if (!isInvisible) {
                const glowSize = SIZE * 2 + Math.sin(frameRef.current * 0.1) * 5;
                const gradient = ctx.createRadialGradient(
                psx + SIZE/2, psy + SIZE/2, 0,
                psx + SIZE/2, psy + SIZE/2, glowSize
                );
                gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
                gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(psx - SIZE*1.5, psy - SIZE*1.5, SIZE * 4, SIZE * 4);
            }

            drawPlayer(ctx, psx, psy, SIZE, player.appearance, player.class, frameRef.current, 
                player.lastAttackTime || 0, player.lastAttackDir || { x: 0, y: 0 }, 
                player.lastSkillTime || 0, player.lastSkillId || null, isInvisible, player.lastMoveTime || 0,
                player.sprite
            );
        }
    });

    // 3. Agregar NPCs
    npcs.forEach(npc => {
        if (visible[npc.y]?.[npc.x]) {
            renderList.push({
                y: npc.y,
                type: 'npc',
                draw: () => {
                    const sx = (npc.x * SIZE) - (offsetX * SIZE);
                    const sy = (npc.y * SIZE) - (offsetY * SIZE);
                    if (isOnScreen(sx, sy, dynamicCanvas.width, dynamicCanvas.height)) {
                        drawNPC(ctx, npc.type, sx, sy, SIZE, frameRef.current);
                    }
                }
            });
        }
    });

    // C) ORDENAR Y DIBUJAR (Z-Index basado en Y)
    renderList.sort((a, b) => a.y - b.y);
    renderList.forEach(entity => entity.draw());
    
    // -- AMBIENT OVERLAY --
    const theme = getThemeForFloor(level);
    if (theme.lavaGlow || theme.embers) {
      drawAmbientOverlay(ctx, dynamicCanvas.width, dynamicCanvas.height, level, frameRef.current);
    }

    // -- EFECTOS --
    if (effectsManager) {
        effectsManager.update();
        effectsManager.draw(ctx, offsetX, offsetY, SIZE);
    }

    // 4. CAPA ILUMINACIÓN
    const lightCtx = lightingCanvas.getContext('2d');
    if (lightingCanvas.width !== dynamicCanvas.width) {
        lightingCanvas.width = dynamicCanvas.width;
        lightingCanvas.height = dynamicCanvas.height;
    }
    renderLighting(lightCtx, lightingCanvas.width, lightingCanvas.height, currentState, offsetX, offsetY);
    
    // Loop
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

function isOnScreen(x, y, width, height) {
    return x >= -SIZE && x < width && y >= -SIZE && y < height;
}

function drawHealthBar(ctx, x, y, width, hp, maxHp) {
    const percent = Math.max(0, Math.min(1, hp / maxHp));
    const barW = width - 4;
    
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x + 2, y - 6, barW, 4);
    
    ctx.fillStyle = percent > 0.5 ? '#4ade80' : percent > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(x + 2, y - 6, barW * percent, 4);
}