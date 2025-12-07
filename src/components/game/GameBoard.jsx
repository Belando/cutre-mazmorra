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
    // Calcular objetivo
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

    // 2. CAPA ESTÁTICA (Mapa - Lógica extraída a map.js)
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

    // -- OBJETOS DEL ENTORNO (Antorchas, Cofres, Items) --
    // Renderizamos solo si están visibles y en pantalla
    
    // Antorchas
    torches.forEach(torch => {
      const sx = (torch.x * SIZE) - (offsetX * SIZE);
      const sy = (torch.y * SIZE) - (offsetY * SIZE);
      
      // CAMBIO AQUÍ: Usamos 'explored' en lugar de 'visible'
      // Esto permite que la antorcha se siga viendo si te alejas
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
          // Fallback simple para items o dibujar sprite específico si existiera
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(item.symbol, sx + SIZE/2, sy + SIZE/2);
        }
      }
    });
    
    // -- ENEMIGOS --
    enemies.forEach(enemy => {
      const sx = (enemy.x * SIZE) - (offsetX * SIZE);
      const sy = (enemy.y * SIZE) - (offsetY * SIZE);
      
      // Solo dibujar si está visible (Fog of War) y en pantalla
      if (visible[enemy.y]?.[enemy.x]) {
        // Margen amplio para bosses grandes
        if (sx > -SIZE*2 && sx < dynamicCanvas.width && sy > -SIZE*2 && sy < dynamicCanvas.height) {
            if (isLargeEnemy(enemy.type)) {
                drawLargeEnemy(ctx, enemy.type, sx, sy, SIZE * 2, frameRef.current);
                drawHealthBar(ctx, sx, sy, SIZE * 2, enemy.hp, enemy.maxHp);
            } else {
                const sizeInfo = getEnemySize(enemy.type);
                const scale = sizeInfo.scale || 1;
                const drawSize = SIZE * scale;
                const offsetDraw = (drawSize - SIZE) / 2;
                
                drawEnemy(ctx, enemy.type, sx - offsetDraw, sy - offsetDraw, drawSize, frameRef.current);
                drawHealthBar(ctx, sx - offsetDraw, sy - offsetDraw, drawSize, enemy.hp, enemy.maxHp);
            }
        }
      }
    });
    
    // -- JUGADOR --
    const psx = (player.x * SIZE) - (offsetX * SIZE);
    const psy = (player.y * SIZE) - (offsetY * SIZE);
    
    // Glow del jugador
    const glowSize = SIZE * 2 + Math.sin(frameRef.current * 0.1) * 5;
    const gradient = ctx.createRadialGradient(
      psx + SIZE/2, psy + SIZE/2, 0,
      psx + SIZE/2, psy + SIZE/2, glowSize
    );
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(psx - SIZE*1.5, psy - SIZE*1.5, SIZE * 4, SIZE * 4);

    drawPlayer(ctx, psx, psy, SIZE, player.appearance, player.class, frameRef.current, player.lastAttackTime || 0, player.lastAttackDir || { x: 0, y: 0 });
    
    // -- NPCS --
    npcs.forEach(npc => {
        const sx = (npc.x * SIZE) - (offsetX * SIZE);
        const sy = (npc.y * SIZE) - (offsetY * SIZE);
        if (visible[npc.y]?.[npc.x] && isOnScreen(sx, sy, dynamicCanvas.width, dynamicCanvas.height)) {
            drawNPC(ctx, npc.type, sx, sy, SIZE);
        }
    });
    
    // -- AMBIENT OVERLAY (Niebla, Ascuas) --
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
    // Asegurar tamaño correcto si cambia la ventana
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
        className="absolute top-0 left-0 z-20 pointer-events-none mix-blend-multiply"
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