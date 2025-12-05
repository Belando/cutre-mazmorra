import React, { useEffect, useRef } from 'react';
import { TILE } from '@/data/constants';
import { getThemeForFloor, drawAmbientOverlay } from './DungeonThemes'; // En la misma carpeta (world)
import { isLargeEnemy, getEnemySize } from '../systems/LargeEnemies'; // <-- CORREGIDO: ../systems/
import { PLAYER_APPEARANCES } from '../panels/CharacterSelect'; // <-- CORREGIDO: ../panels/

// --- IMPORTACIONES DEL RENDERER ---
import { adjustBrightness } from '@/renderer/utils';
import { drawEnvironmentSprite } from '@/renderer/environment';
import { drawEnemy, drawLargeEnemy } from '@/renderer/enemies';
import { drawNPC } from '@/renderer/npcs';
import { drawPlayer } from '@/renderer/player';

const TILE_SIZE = 32;

// Colores dinámicos (esto es lógica de vista, está bien aquí)
function getTileColors(floor) {
  const theme = getThemeForFloor(floor);
  return {
    [TILE.WALL]: theme.wall,
    [TILE.FLOOR]: theme.floor,
    [TILE.STAIRS]: theme.floor,
    [TILE.DOOR]: theme.wall,
  };
}

export default function GameBoard({ gameState, viewportWidth = 21, viewportHeight = 15 }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;
    
    const ctx = canvas.getContext('2d');
    const { map, enemies, player, items, visible, explored, torches = [], chests = [], level = 1 } = gameState;
    
    // Increment frame
    frameRef.current++;
    
    const TILE_COLORS = getTileColors(level);
    const theme = getThemeForFloor(level);
    
    // Viewport calculation
    const halfViewW = Math.floor(viewportWidth / 2);
    const halfViewH = Math.floor(viewportHeight / 2);
    
    let offsetX = player.x - halfViewW;
    let offsetY = player.y - halfViewH;
    
    // Clamp
    offsetX = Math.max(0, Math.min(offsetX, map[0].length - viewportWidth));
    offsetY = Math.max(0, Math.min(offsetY, map.length - viewportHeight));
    
    // Clear
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 1. DRAW MAP TILES
    for (let y = 0; y < viewportHeight; y++) {
      for (let x = 0; x < viewportWidth; x++) {
        const mapX = x + offsetX;
        const mapY = y + offsetY;
        
        if (mapX >= 0 && mapX < map[0].length && mapY >= 0 && mapY < map.length) {
          const isVisible = visible[mapY]?.[mapX];
          const isExplored = explored[mapY]?.[mapX];
          
          if (isExplored || isVisible) {
            const tile = map[mapY][mapX];
            const screenX = x * TILE_SIZE;
            const screenY = y * TILE_SIZE;
            
            // Base tile
            ctx.fillStyle = isVisible ? TILE_COLORS[tile] : adjustBrightness(TILE_COLORS[tile], -60);
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            
            // Details
            if (tile === TILE.WALL) {
              ctx.fillStyle = isVisible ? theme.wallDetail : adjustBrightness(theme.wallDetail, -40);
              ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
              
              if (isVisible) {
                // Bricks logic (simplificado)
                ctx.fillStyle = theme.wall;
                ctx.fillRect(screenX + 4, screenY + 6, TILE_SIZE - 10, 2);
                
                // Decorations
                const wallSeed = (mapX * 11 + mapY * 17) % 100;
                if (wallSeed < (level <= 4 ? 8 : 3)) {
                  drawEnvironmentSprite(ctx, 'cobweb', screenX, screenY, TILE_SIZE);
                }
                
                // Lava cracks
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
              if (isVisible) {
                drawEnvironmentSprite(ctx, 'stairs', screenX, screenY, TILE_SIZE);
              } else {
                ctx.fillStyle = '#8b2a3a';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 18px monospace';
                ctx.fillText('▼', screenX + TILE_SIZE/2, screenY + TILE_SIZE/2);
              }
            } else if (tile === TILE.FLOOR && isVisible) {
              // Floor decorations
              ctx.fillStyle = theme.floorDetail;
              if ((mapX + mapY) % 2 === 0) ctx.fillRect(screenX + 10, screenY + 10, 4, 4);

              const seed = (mapX * 7 + mapY * 13) % 100;
              
              if (level <= 4) {
                if (seed < 5) drawEnvironmentSprite(ctx, 'bones', screenX, screenY, TILE_SIZE);
                else if (seed < 9) drawEnvironmentSprite(ctx, 'rubble', screenX, screenY, TILE_SIZE);
                else if (seed < 13) drawEnvironmentSprite(ctx, 'bloodstain', screenX, screenY, TILE_SIZE);
                else if (seed < 18) drawEnvironmentSprite(ctx, 'crack', screenX, screenY, TILE_SIZE);
                else if (seed < 22) drawEnvironmentSprite(ctx, 'mushroom', screenX, screenY, TILE_SIZE);
                else if (seed < 25) drawEnvironmentSprite(ctx, 'waterPool', screenX, screenY, TILE_SIZE, frameRef.current);
              } else {
                // Volcanic decorations
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
    
    // 2. DRAW PROPS
    torches?.forEach(torch => {
      const sx = (torch.x - offsetX) * TILE_SIZE;
      const sy = (torch.y - offsetY) * TILE_SIZE;
      if (visible[torch.y]?.[torch.x] && isOnScreen(sx, sy, canvas)) {
        drawEnvironmentSprite(ctx, 'wallTorch', sx, sy, TILE_SIZE, frameRef.current);
      }
    });
    
    chests?.forEach(chest => {
      const sx = (chest.x - offsetX) * TILE_SIZE;
      const sy = (chest.y - offsetY) * TILE_SIZE;
      if (visible[chest.y]?.[chest.x] && isOnScreen(sx, sy, canvas)) {
        drawEnvironmentSprite(ctx, 'chest', sx, sy, TILE_SIZE, chest.opened, chest.rarity);
      }
    });
    
    items?.forEach(item => {
      const sx = (item.x - offsetX) * TILE_SIZE;
      const sy = (item.y - offsetY) * TILE_SIZE;
      if (visible[item.y]?.[item.x] && isOnScreen(sx, sy, canvas)) {
        if (item.category === 'currency') {
          drawEnvironmentSprite(ctx, 'goldPile', sx, sy, TILE_SIZE);
        } else {
          // Item text fallback or sprite
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(item.symbol, sx + TILE_SIZE/2, sy + TILE_SIZE/2);
        }
      }
    });
    
    // 3. DRAW ENEMIES
    enemies.forEach(enemy => {
      const sx = (enemy.x - offsetX) * TILE_SIZE;
      const sy = (enemy.y - offsetY) * TILE_SIZE;
      
      if (visible[enemy.y]?.[enemy.x]) {
        if (sx > -TILE_SIZE*2 && sx < canvas.width && sy > -TILE_SIZE*2 && sy < canvas.height) {
            
            if (isLargeEnemy(enemy.type)) {
                drawLargeEnemy(ctx, enemy.type, sx - TILE_SIZE/2, sy - TILE_SIZE/2, TILE_SIZE * 2, frameRef.current);
                drawHealthBar(ctx, sx - TILE_SIZE/2, sy - TILE_SIZE/2, TILE_SIZE * 2, enemy.hp, enemy.maxHp);
            } else {
                const sizeInfo = getEnemySize(enemy.type);
                const scale = sizeInfo.scale || 1;
                const drawSize = TILE_SIZE * scale;
                const offset = (drawSize - TILE_SIZE) / 2;
                
                drawEnemy(ctx, enemy.type, sx - offset, sy - offset, drawSize, frameRef.current);
                drawHealthBar(ctx, sx - offset, sy - offset, drawSize, enemy.hp, enemy.maxHp);
            }
        }
      }
    });
    
    // 4. DRAW PLAYER
    const psx = (player.x - offsetX) * TILE_SIZE;
    const psy = (player.y - offsetY) * TILE_SIZE;
    
    // Player glow
    const gradient = ctx.createRadialGradient(
      psx + TILE_SIZE/2, psy + TILE_SIZE/2, 0,
      psx + TILE_SIZE/2, psy + TILE_SIZE/2, TILE_SIZE
    );
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(psx - TILE_SIZE/2, psy - TILE_SIZE/2, TILE_SIZE * 2, TILE_SIZE * 2);

    drawPlayer(ctx, psx, psy, TILE_SIZE, player.appearance, player.class);
    
    // 5. DRAW NPCs
    gameState.npcs?.forEach(npc => {
        const sx = (npc.x - offsetX) * TILE_SIZE;
        const sy = (npc.y - offsetY) * TILE_SIZE;
        if (visible[npc.y]?.[npc.x] && isOnScreen(sx, sy, canvas)) {
            drawNPC(ctx, npc.type, sx, sy, TILE_SIZE);
        }
    });
    
    // Ambient Effects
    if (theme.lavaGlow || theme.embers) {
      drawAmbientOverlay(ctx, canvas.width, canvas.height, level, frameRef.current);
    }
    
  }, [gameState, viewportWidth, viewportHeight]);
  
  return (
    <canvas
      ref={canvasRef}
      width={viewportWidth * TILE_SIZE}
      height={viewportHeight * TILE_SIZE}
      className="border rounded-lg shadow-2xl border-slate-700/50"
    />
  );
}

// Helpers que SÍ se quedan porque son lógica de UI/Canvas genérica y pequeña
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
