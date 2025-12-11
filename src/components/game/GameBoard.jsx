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

export default function GameBoard({ gameState, viewportWidth = 21, viewportHeight = 15 }) {
  const staticCanvasRef = useRef(null);
  const dynamicCanvasRef = useRef(null);
  const lightingCanvasRef = useRef(null);
  const containerRef = useRef(null);

  // Estado mutable para la cámara y el loop
  const cameraPos = useRef({ x: 0, y: 0, initialized: false });
  const frameRef = useRef(0);
  const animationFrameId = useRef(null);
  const gameStateRef = useRef(gameState);

  // Mantener la referencia del estado actualizada sin provocar re-renders del componente
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

// --- BUCLE PRINCIPAL DE RENDERIZADO ---
  const renderGameLoop = () => {
    const staticCanvas = staticCanvasRef.current;
    const dynamicCanvas = dynamicCanvasRef.current;
    const lightingCanvas = lightingCanvasRef.current;
    
    // Verificación de seguridad
    if (!staticCanvas || !dynamicCanvas || !lightingCanvas || !gameStateRef.current) {
        animationFrameId.current = requestAnimationFrame(renderGameLoop);
        return;
    }
    
    const currentState = gameStateRef.current;
    const { 
        map, enemies, player, items, visible, torches = [], 
        chests = [], level = 1, npcs = [], effectsManager 
    } = currentState;
    
    frameRef.current++;
    
    // 1. CÁMARA (Lógica extraída a map.js)
    const target = getCameraTarget(player, map, viewportWidth, viewportHeight);
    
    // Inicialización inmediata para evitar barrido al cargar nivel
    if (!cameraPos.current.initialized) {
        cameraPos.current.x = target.x;
        cameraPos.current.y = target.y;
        cameraPos.current.initialized = true;
    }

    // Interpolación suave (Lerp)
    const newPos = lerpCamera(cameraPos.current, target, 0.1);
    cameraPos.current = newPos;

    const offsetX = newPos.x;
    const offsetY = newPos.y;

    // 2. CAPA ESTÁTICA (Mapa)
    // Redibujamos siempre para el scroll suave (sub-pixel precision)
    const staticCtx = staticCanvas.getContext('2d');
    drawMap(staticCtx, currentState, offsetX, offsetY, viewportWidth, viewportHeight);

    // 3. CAPA DINÁMICA (Entidades)
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
    
    // Antorchas de pared
    torches.forEach(torch => {
      const sx = (torch.x * SIZE) - (offsetX * SIZE);
      const sy = (torch.y * SIZE) - (offsetY * SIZE);
      
      if (currentState.explored[torch.y]?.[torch.x] && isOnScreen(sx, sy, dynamicCanvas.width, dynamicCanvas.height)) {
        drawEnvironmentSprite(ctx, 'wallTorch', sx, sy, SIZE, frameRef.current);
      }
    });
    
    // Cofres
    chests.forEach(chest => {
      const sx = (chest.x * SIZE) - (offsetX * SIZE);
      const sy = (chest.y * SIZE) - (offsetY * SIZE);
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
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(item.symbol, sx + SIZE/2, sy + SIZE/2);
        }
      }
    });
    
    // B) LISTA UNIFICADA DE ENTIDADES (Jugador, Enemigos, NPCs)
    // Se ordenarán por Y para corregir la profundidad
    const renderList = [];

    // 1. Agregar Enemigos Visibles a la lista
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
                    
                    // --- CAMBIO: PASAMOS lastAttackDir ---
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
                        enemy.lastMoveTime || 0
                    );
                    // -------------------------------------
                    
                    drawHealthBar(ctx, sx - offsetDraw, sy - offsetDraw, drawSize, enemy.hp, enemy.maxHp);
                }
            }
          }
        });
      }
    });
    
    // 2. Agregar Jugador a la lista
    const isInvisible = player.skills?.buffs?.some(b => b.invisible) || false;
    renderList.push({
        y: player.y,
        type: 'player',
        draw: () => {
            const psx = (player.x * SIZE) - (offsetX * SIZE);
            const psy = (player.y * SIZE) - (offsetY * SIZE);

            // Glow del jugador (solo si NO es invisible)
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
                player.lastSkillTime || 0, player.lastSkillId || null, isInvisible, player.lastMoveTime || 0);
        }
    });

    // 3. Agregar NPCs Visibles a la lista
    npcs.forEach(npc => {
        if (visible[npc.y]?.[npc.x]) {
            renderList.push({
                y: npc.y,
                type: 'npc',
                draw: () => {
                    const sx = (npc.x * SIZE) - (offsetX * SIZE);
                    const sy = (npc.y * SIZE) - (offsetY * SIZE);
                    if (isOnScreen(sx, sy, dynamicCanvas.width, dynamicCanvas.height)) {
                        // --- CAMBIO AQUÍ: Añadimos frameRef.current al final ---
                        drawNPC(ctx, npc.type, sx, sy, SIZE, frameRef.current);
                    }
                }
            });
        }
    });

    // C) ORDENAR Y DIBUJAR
    // Ordenar de menor Y (fondo) a mayor Y (frente)
    renderList.sort((a, b) => a.y - b.y);

    // Ejecutar el dibujo en orden
    renderList.forEach(entity => entity.draw());
    
    // -- AMBIENT OVERLAY (Niebla, Ascuas) - Encima de todo --
    const theme = getThemeForFloor(level);
    if (theme.lavaGlow || theme.embers) {
      drawAmbientOverlay(ctx, dynamicCanvas.width, dynamicCanvas.height, level, frameRef.current);
    }

    // -- EFECTOS (Partículas, Textos flotantes) --
    if (effectsManager) {
        effectsManager.update();
        effectsManager.draw(ctx, offsetX, offsetY, SIZE);
    }

    // 4. CAPA ILUMINACIÓN (Lógica extraída a lighting.js)
    const lightCtx = lightingCanvas.getContext('2d');
    if (lightingCanvas.width !== dynamicCanvas.width) {
        lightingCanvas.width = dynamicCanvas.width;
        lightingCanvas.height = dynamicCanvas.height;
    }
    renderLighting(lightCtx, lightingCanvas.width, lightingCanvas.height, currentState, offsetX, offsetY);
    
    // Loop
    animationFrameId.current = requestAnimationFrame(renderGameLoop);
  };

  // Iniciar loop
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
      
      {/* Capa Estática (Mapa) */}
      <canvas
        ref={staticCanvasRef}
        width={viewportWidth * SIZE}
        height={viewportHeight * SIZE}
        className="absolute top-0 left-0 z-0"
      />
      
      {/* Capa Dinámica (Entidades) */}
      <canvas
        ref={dynamicCanvasRef}
        width={viewportWidth * SIZE}
        height={viewportHeight * SIZE}
        className="absolute top-0 left-0 z-10"
      />
      
      {/* Capa Iluminación (Multiply Blend) */}
      <canvas
        ref={lightingCanvasRef}
        width={viewportWidth * SIZE}
        height={viewportHeight * SIZE}
        className="absolute top-0 left-0 z-20 pointer-events-none mix-blend-soft-light"
      />
    </div>
  );
}

// --- Helpers Locales ---

function isOnScreen(x, y, width, height) {
    return x >= -SIZE && x < width && y >= -SIZE && y < height;
}

function drawHealthBar(ctx, x, y, width, hp, maxHp) {
    const percent = Math.max(0, Math.min(1, hp / maxHp));
    const barW = width - 4;
    
    // Fondo barra
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x + 2, y - 6, barW, 4);
    
    // Vida actual
    ctx.fillStyle = percent > 0.5 ? '#4ade80' : percent > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(x + 2, y - 6, barW * percent, 4);
}