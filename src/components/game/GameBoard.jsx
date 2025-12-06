import React, { useEffect, useRef } from 'react';
import { TILE } from '@/data/constants';
import { getThemeForFloor, drawAmbientOverlay } from './DungeonThemes';
import { isLargeEnemy, getEnemySize } from '@/engine/systems/LargeEnemies';
import { PLAYER_APPEARANCES } from '@/components/ui/CharacterSelect';

// --- IMPORTACIONES DEL RENDERER ---
import { adjustBrightness } from '@/renderer/utils';
import { drawEnvironmentSprite } from '@/renderer/environment';
import { drawEnemy, drawLargeEnemy } from '@/renderer/enemies';
import { drawNPC } from '@/renderer/npcs';
import { drawPlayer } from '@/renderer/player';

const TILE_SIZE = 32;

// Colores dinámicos
function getTileColors(floor) {
  const theme = getThemeForFloor(floor);
  return {
    [TILE.WALL]: theme.wall,
    [TILE.FLOOR]: theme.floor,
    [TILE.STAIRS]: theme.floor,
    [TILE.DOOR]: theme.wall,
  };
}

// --- FUNCIÓN DE ILUMINACIÓN (Corregida y movida fuera) ---
const renderLighting = (ctx, width, height, state, offsetX, offsetY) => {
  // 1. Limpiar y llenar de oscuridad
  ctx.clearRect(0, 0, width, height);
  
  // Color de la oscuridad (0.95 = muy oscuro, 0.0 = transparente)
  ctx.fillStyle = 'rgba(5, 5, 10, 0.95)'; 
  ctx.fillRect(0, 0, width, height);
  
  // 2. Cambiar modo a "Recortar" (destination-out borra la oscuridad)
  ctx.globalCompositeOperation = 'destination-out';

  // Función auxiliar para dibujar luz
  const drawLight = (x, y, radius, intensity = 1) => {
     const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
     gradient.addColorStop(0, `rgba(0, 0, 0, ${intensity})`); 
     gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
     
     ctx.fillStyle = gradient;
     ctx.beginPath();
     ctx.arc(x, y, radius, 0, Math.PI * 2);
     ctx.fill();
  };

  

  // Desestructuramos el estado aquí
  const { player, torches, items } = state;

  // --- LUZ DEL JUGADOR ---
  // Cálculo: (Posición Mundo * 32) - (Cámara) + (Mitad Tile para centrar)
  const px = (player.x * TILE_SIZE) - (offsetX * TILE_SIZE) + TILE_SIZE/2;
  const py = (player.y * TILE_SIZE) - (offsetY * TILE_SIZE) + TILE_SIZE/2;
  
  drawLight(px, py, 180, 1);

  // --- LUZ DE ANTORCHAS ---
  const time = Date.now() / 150; 
  
  torches.forEach(torch => {
      const tx = (torch.x * TILE_SIZE) - (offsetX * TILE_SIZE) + TILE_SIZE/2;
      const ty = (torch.y * TILE_SIZE) - (offsetY * TILE_SIZE) + TILE_SIZE/2;
      
      // Solo dibujar si está cerca de la pantalla
      if (tx > -100 && tx < width + 100 && ty > -100 && ty < height + 100) {
          const flicker = (Math.sin(time + torch.x * 10) + 1) / 2 * 0.1; 
          drawLight(tx, ty, 140 + flicker * 40, 0.9);
      }
  });

  // --- LUZ DE ITEMS MÁGICOS ---
  items.forEach(item => {
     if (['rare', 'epic', 'legendary'].includes(item.rarity) || item.category === 'potion') {
        const ix = (item.x * TILE_SIZE) - (offsetX * TILE_SIZE) + TILE_SIZE/2;
        const iy = (item.y * TILE_SIZE) - (offsetY * TILE_SIZE) + TILE_SIZE/2;
        drawLight(ix, iy, 60, 0.6);
     }
  });

  // 3. Restaurar modo normal
  ctx.globalCompositeOperation = 'source-over';
};


export default function GameBoard({ gameState, viewportWidth = 21, viewportHeight = 15 }) {
  const staticCanvasRef = useRef(null);
  const dynamicCanvasRef = useRef(null);
  const lightingCanvasRef = useRef(null);
  const containerRef = useRef(null);

  const cameraPos = useRef({ x: 0, y: 0, initialized: false });
  const frameRef = useRef(0);
  const animationFrameId = useRef(null);
  const gameStateRef = useRef(gameState);
  const viewStateRef = useRef({ x: -1, y: -1, level: -1 });

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // --- CAPA ESTÁTICA ---
  const drawStaticLayer = (ctx, state, offsetX, offsetY) => {
    const { map, visible, explored, level } = state;
    const TILE_COLORS = getTileColors(level);
    const theme = getThemeForFloor(level);

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Cálculos para suavidad (Sub-pixel)
    const startMapX = Math.floor(offsetX);
    const startMapY = Math.floor(offsetY);
    const fineShiftX = (offsetX - startMapX) * TILE_SIZE;
    const fineShiftY = (offsetY - startMapY) * TILE_SIZE;

    for (let y = 0; y <= viewportHeight; y++) {
      for (let x = 0; x <= viewportWidth; x++) {
        const mapX = x + startMapX;
        const mapY = y + startMapY;
        const screenX = Math.floor(x * TILE_SIZE - fineShiftX);
        const screenY = Math.floor(y * TILE_SIZE - fineShiftY);
        
        if (mapX >= 0 && mapX < map[0].length && mapY >= 0 && mapY < map.length) {
          const isVisible = visible[mapY]?.[mapX];
          const isExplored = explored[mapY]?.[mapX];
          
          if (isExplored || isVisible) {
            const tile = map[mapY][mapX];
            
            // Tile Base
            ctx.fillStyle = isVisible ? TILE_COLORS[tile] : adjustBrightness(TILE_COLORS[tile], -60);
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            
            // Detalles
            if (tile === TILE.WALL) {
              ctx.fillStyle = isVisible ? theme.wallDetail : adjustBrightness(theme.wallDetail, -40);
              ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
              
              if (isVisible) {
                ctx.fillStyle = theme.wall;
                ctx.fillRect(screenX + 4, screenY + 6, TILE_SIZE - 10, 2);
                const wallSeed = (mapX * 11 + mapY * 17) % 100;
                if (wallSeed < (level <= 4 ? 8 : 3)) {
                  drawEnvironmentSprite(ctx, 'cobweb', screenX, screenY, TILE_SIZE);
                }
                if (theme.lavaGlow && wallSeed >= 90) {
                   ctx.strokeStyle = '#ef4444';
                   ctx.lineWidth = 1;
                   ctx.beginPath();
                   ctx.moveTo(screenX + TILE_SIZE*0.3, screenY + TILE_SIZE*0.2);
                   ctx.lineTo(screenX + TILE_SIZE*0.5, screenY + TILE_SIZE*0.5);
                   ctx.stroke();
                }
              }
            } else if (tile === TILE.STAIRS) {
                ctx.fillStyle = '#8b2a3a';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 18px monospace';
                ctx.fillText('▼', screenX + TILE_SIZE/2, screenY + TILE_SIZE/2);
            } else if (tile === TILE.FLOOR && isVisible) {
              ctx.fillStyle = theme.floorDetail;
              if ((mapX + mapY) % 2 === 0) ctx.fillRect(screenX + 10, screenY + 10, 4, 4);
              const seed = (mapX * 7 + mapY * 13) % 100;
              if (level <= 4) {
                if (seed < 5) drawEnvironmentSprite(ctx, 'bones', screenX, screenY, TILE_SIZE);
                else if (seed < 9) drawEnvironmentSprite(ctx, 'rubble', screenX, screenY, TILE_SIZE);
                else if (seed < 13) drawEnvironmentSprite(ctx, 'bloodstain', screenX, screenY, TILE_SIZE);
                else if (seed < 18) drawEnvironmentSprite(ctx, 'crack', screenX, screenY, TILE_SIZE);
                else if (seed < 22) drawEnvironmentSprite(ctx, 'mushroom', screenX, screenY, TILE_SIZE);
              } else {
                if (seed < 10) { 
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
                    ctx.beginPath(); ctx.ellipse(screenX+16, screenY+20, 10, 5, 0, 0, Math.PI*2); ctx.fill();
                } else if (seed < 15) drawEnvironmentSprite(ctx, 'rubble', screenX, screenY, TILE_SIZE);
              }
            }
          }
        }
      }
    }
  };

// --- FUNCIÓN DE DIBUJADO DE CAPA DINÁMICA (Entidades, VFX, Cámara, Shake) ---
  const renderDynamicLayer = () => {
    const canvas = dynamicCanvasRef.current;
    const staticCanvas = staticCanvasRef.current;
    
    // Verificación de seguridad
    if (!canvas || !staticCanvas || !gameStateRef.current) return;
    
    const ctx = canvas.getContext('2d');
    const currentState = gameStateRef.current;
    
    // Desestructuración del estado
    const { map, enemies, player, items, visible, torches = [], chests = [], level = 1, npcs = [], effectsManager } = currentState;
    
    frameRef.current++;
    
    // --- 1. CÁMARA SUAVE (Lerp) ---
    const halfViewW = Math.floor(viewportWidth / 2);
    const halfViewH = Math.floor(viewportHeight / 2);
    
    let targetX = player.x - halfViewW;
    let targetY = player.y - halfViewH;
    
    // Clamping (Mantener cámara dentro del mapa)
    if (map && map.length > 0) {
      targetX = Math.max(0, Math.min(targetX, map[0].length - viewportWidth));
      targetY = Math.max(0, Math.min(targetY, map.length - viewportHeight));
    }

    // Inicialización inmediata para evitar barrido al cargar
    if (!cameraPos.current.initialized) {
        cameraPos.current.x = targetX;
        cameraPos.current.y = targetY;
        cameraPos.current.initialized = true;
    }

    // Interpolación (Suavizado del movimiento)
    cameraPos.current.x += (targetX - cameraPos.current.x) * 0.1;
    cameraPos.current.y += (targetY - cameraPos.current.y) * 0.1;

    const offsetX = cameraPos.current.x;
    const offsetY = cameraPos.current.y;

    // --- 2. ACTUALIZACIÓN DE CAPA ESTÁTICA ---
    // Siempre redibujamos static para el scroll fino (parallax/suavidad)
    // Esto es necesario porque con cámara suave, el "grid" visual se mueve píxel a píxel
    const staticCtx = staticCanvas.getContext('2d');
    drawStaticLayer(staticCtx, currentState, offsetX, offsetY);
    
    // Guardamos estado de vista por si acaso necesitamos optimizar luego
    viewStateRef.current = { x: offsetX, y: offsetY, level, playerX: player.x, playerY: player.y };

    // --- 3. APLICAR SCREEN SHAKE (Game Feel) ---
    // NOTA: Esto mueve el DIV contenedor entero mediante CSS transform
    // Es mucho más eficiente que mover todos los objetos del canvas uno por uno
    if (effectsManager && containerRef.current) {
        const shake = effectsManager.screenShake;
        if (shake > 0) {
            // Generar desplazamiento aleatorio basado en la intensidad
            const dx = (Math.random() - 0.5) * shake;
            const dy = (Math.random() - 0.5) * shake;
            containerRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
        } else {
            // Resetear posición si no hay temblor
            containerRef.current.style.transform = 'none';
        }
    }

    // --- 4. RENDER ILUMINACIÓN ---
    if (lightingCanvasRef.current) {
        const lightCtx = lightingCanvasRef.current.getContext('2d');
        // Asegurar tamaño correcto del canvas de luz
        if (lightingCanvasRef.current.width !== canvas.width) {
            lightingCanvasRef.current.width = canvas.width;
            lightingCanvasRef.current.height = canvas.height;
        }
        // Llamada a la función externa renderLighting con los parámetros corregidos
        renderLighting(lightCtx, canvas.width, canvas.height, currentState, offsetX, offsetY);
    }

    // --- 5. RENDER DINÁMICO (Entidades) ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Objetos (Torches)
    torches?.forEach(torch => {
      const sx = (torch.x * TILE_SIZE) - (offsetX * TILE_SIZE);
      const sy = (torch.y * TILE_SIZE) - (offsetY * TILE_SIZE);
      if (visible[torch.y]?.[torch.x] && isOnScreen(sx, sy, canvas)) {
        drawEnvironmentSprite(ctx, 'wallTorch', sx, sy, TILE_SIZE, frameRef.current);
      }
    });
    
    // Cofres
    chests?.forEach(chest => {
      const sx = (chest.x * TILE_SIZE) - (offsetX * TILE_SIZE);
      const sy = (chest.y * TILE_SIZE) - (offsetY * TILE_SIZE);
      if (visible[chest.y]?.[chest.x] && isOnScreen(sx, sy, canvas)) {
        drawEnvironmentSprite(ctx, 'chest', sx, sy, TILE_SIZE, chest.isOpen, chest.rarity);
      }
    });
    
    // Items
    items?.forEach(item => {
      const sx = (item.x * TILE_SIZE) - (offsetX * TILE_SIZE);
      const sy = (item.y * TILE_SIZE) - (offsetY * TILE_SIZE);
      if (visible[item.y]?.[item.x] && isOnScreen(sx, sy, canvas)) {
        if (item.category === 'currency') {
          drawEnvironmentSprite(ctx, 'goldPile', sx, sy, TILE_SIZE);
        } else {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(item.symbol, sx + TILE_SIZE/2, sy + TILE_SIZE/2);
        }
      }
    });
    
    // Enemigos
    enemies.forEach(enemy => {
      const sx = (enemy.x * TILE_SIZE) - (offsetX * TILE_SIZE);
      const sy = (enemy.y * TILE_SIZE) - (offsetY * TILE_SIZE);
      
      if (visible[enemy.y]?.[enemy.x]) {
        if (sx > -TILE_SIZE*2 && sx < canvas.width && sy > -TILE_SIZE*2 && sy < canvas.height) {
            if (isLargeEnemy(enemy.type)) {
                drawLargeEnemy(ctx, enemy.type, sx, sy, TILE_SIZE * 2, frameRef.current);
                drawHealthBar(ctx, sx, sy, TILE_SIZE * 2, enemy.hp, enemy.maxHp);
            } else {
                const sizeInfo = getEnemySize(enemy.type);
                const scale = sizeInfo.scale || 1;
                const drawSize = TILE_SIZE * scale;
                const offsetDraw = (drawSize - TILE_SIZE) / 2;
                
                drawEnemy(ctx, enemy.type, sx - offsetDraw, sy - offsetDraw, drawSize, frameRef.current);
                drawHealthBar(ctx, sx - offsetDraw, sy - offsetDraw, drawSize, enemy.hp, enemy.maxHp);
            }
        }
      }
    });
    
    // Jugador (con Glow)
    const psx = (player.x * TILE_SIZE) - (offsetX * TILE_SIZE);
    const psy = (player.y * TILE_SIZE) - (offsetY * TILE_SIZE);
    
    const glowSize = TILE_SIZE * 2 + Math.sin(frameRef.current * 0.1) * 5;
    const gradient = ctx.createRadialGradient(
      psx + TILE_SIZE/2, psy + TILE_SIZE/2, 0,
      psx + TILE_SIZE/2, psy + TILE_SIZE/2, glowSize
    );
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(psx - TILE_SIZE*1.5, psy - TILE_SIZE*1.5, TILE_SIZE * 4, TILE_SIZE * 4);

    drawPlayer(ctx, psx, psy, TILE_SIZE, player.appearance, player.class, frameRef.current);
    
    // NPCs
    npcs?.forEach(npc => {
        const sx = (npc.x * TILE_SIZE) - (offsetX * TILE_SIZE);
        const sy = (npc.y * TILE_SIZE) - (offsetY * TILE_SIZE);
        if (visible[npc.y]?.[npc.x] && isOnScreen(sx, sy, canvas)) {
            drawNPC(ctx, npc.type, sx, sy, TILE_SIZE);
        }
    });
    
    // Ambient Overlay (Fog/Lava)
    const theme = getThemeForFloor(level);
    if (theme.lavaGlow || theme.embers) {
      drawAmbientOverlay(ctx, canvas.width, canvas.height, level, frameRef.current);
    }

    // Efectos (Sangre, Texto, Partículas)
    if (effectsManager) {
        effectsManager.update();
        // Usamos offsetX/offsetY de la cámara para que las partículas se muevan con el mundo
        effectsManager.draw(ctx, offsetX, offsetY, TILE_SIZE);
    }
    
    // Siguiente frame
    animationFrameId.current = requestAnimationFrame(renderDynamicLayer);
  };

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(renderDynamicLayer);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [viewportWidth, viewportHeight]);

  return (
    <div ref={containerRef} 
      className="relative overflow-hidden border rounded-lg shadow-2xl border-slate-700/50" 
      style={{ width: viewportWidth * TILE_SIZE, height: viewportHeight * TILE_SIZE }}>
      
      {/* Capa Estática */}
      <canvas
        ref={staticCanvasRef}
        width={viewportWidth * TILE_SIZE}
        height={viewportHeight * TILE_SIZE}
        className="absolute top-0 left-0 z-0"
      />
      
      {/* Capa Dinámica */}
      <canvas
        ref={dynamicCanvasRef}
        width={viewportWidth * TILE_SIZE}
        height={viewportHeight * TILE_SIZE}
        className="absolute top-0 left-0 z-10"
      />
      
      {/* Capa Iluminación */}
      <canvas
        ref={lightingCanvasRef}
        width={viewportWidth * TILE_SIZE}
        height={viewportHeight * TILE_SIZE}
        className="absolute top-0 left-0 z-20 pointer-events-none mix-blend-multiply"
      />
    </div>
  );
}

// --- Helpers ---
function isOnScreen(x, y, canvas) {
    return x >= -TILE_SIZE && x < canvas.width && y >= -TILE_SIZE && y < canvas.height;
}

function drawHealthBar(ctx, x, y, width, hp, maxHp) {
    const percent = Math.max(0, Math.min(1, hp / maxHp));
    const barW = width - 4;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x + 2, y - 6, barW, 4);
    ctx.fillStyle = percent > 0.5 ? '#4ade80' : percent > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(x + 2, y - 6, barW * percent, 4);
}