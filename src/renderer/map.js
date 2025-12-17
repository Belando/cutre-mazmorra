import { TILE } from "@/data/constants";
import { getThemeForFloor } from "@/components/game/DungeonThemes";

import { drawEnvironmentSprite } from "./environment";

const TILE_SIZE = 64; // Explicitly matching the new global SIZE (or we could import SIZE, but this file had TILE_SIZE 32 before)
// Actually, let's import SIZE to be safe, or just trust the caller passes TILE_SIZE implicitly via scaling?
// The global constant changed to 64. 
// In drawMap below, it uses TILE_SIZE const defined here.
// I should update this local const or import it.
// Let's import it to be correct 
import { SIZE } from "@/data/constants";

// Helper for high-res floors
function drawHighResFloor(ctx, x, y, size, color, mapX, mapY) {
  // Base background
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);

  // Pattern: Stone Slabs (Baldosas de piedra) with irregularities
  ctx.lineWidth = 2; 
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  
  const seed = (mapX * 17 + mapY * 23) % 100;
  
  // 2x2 grid of sub-tiles for detail
  const subSize = size / 2;
  
  for(let i=0; i<2; i++) {
      for(let j=0; j<2; j++) {
          const sx = x + i * subSize;
          const sy = y + j * subSize;
          
          // Slight color variation
          const subSeed = (seed + i*7 + j*13) % 100;
          if (subSeed > 70) {
             ctx.fillStyle = "rgba(0,0,0,0.05)";
             ctx.fillRect(sx, sy, subSize, subSize);
          } else if (subSeed < 20) {
             ctx.fillStyle = "rgba(255,255,255,0.03)";
             ctx.fillRect(sx, sy, subSize, subSize);
          }
          
          // Border
          ctx.strokeRect(sx, sy, subSize, subSize);
          
          // High density noise (grain)
          for(let k=0; k<3; k++) {
              const nx = sx + Math.random() * subSize;
              const ny = sy + Math.random() * subSize;
              const nw = 2 + Math.random() * 2;
              
              ctx.fillStyle = "rgba(0,0,0,0.1)";
              ctx.fillRect(nx, ny, nw, nw);
          }
      }
  }
}

// Helper for high-res walls
function drawHighResWall(ctx, x, y, size, color, theme, mapX, mapY) {
    // 1. Base Wall (Gradient for height look)
    const grad = ctx.createLinearGradient(x, y, x, y + size);
    grad.addColorStop(0, theme.wallDetail); // Top is lighter/base color
    grad.addColorStop(1, theme.wall);       // Bottom is darker/shadowed
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, size, size);
    
    // 2. 3D Bevel (Top Edge Highlight)
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(x, y, size, 4); 
    
    // 3. Brick Pattern (4 rows)
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    const rowHeight = size / 4; 
    
    for(let i=0; i<4; i++) {
        const rowY = y + i * rowHeight;
        // Horizontal mortar lines
        ctx.fillRect(x, rowY, size, 2);
        
        // Vertical mortar lines (staggered)
        const offset = (i % 2 === 0) ? 0 : size / 2;
        ctx.fillRect(x + offset, rowY, 2, rowHeight);
        ctx.fillRect(x + offset + size/2, rowY, 2, rowHeight);
    }
    
    // 4. Shadow at base
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x, y + size - 6, size, 6);
}

function getTileColors(floor) {
  const theme = getThemeForFloor(floor);
  return {
    [TILE.WALL]: theme.wall,
    [TILE.FLOOR]: theme.floor,
    [TILE.STAIRS]: theme.floor,
    [TILE.DOOR]: theme.wall,      
    [TILE.DOOR_OPEN]: theme.floor,
    [TILE.STAIRS_UP]: theme.floor,
  };
}

export function drawMap(
  ctx,
  state,
  offsetX,
  offsetY,
  viewportWidth,
  viewportHeight
) {
  const { map, visible, explored, level } = state;
  const TILE_COLORS = getTileColors(level);
  const theme = getThemeForFloor(level);

  // Background
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Enable Smoothing for static map elements
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Use imported SIZE
  const tileSize = SIZE;

  const startMapX = Math.floor(offsetX);
  const startMapY = Math.floor(offsetY);
  const fineShiftX = (offsetX - startMapX) * tileSize;
  const fineShiftY = (offsetY - startMapY) * tileSize;

  for (let y = 0; y <= viewportHeight + 1; y++) {
    for (let x = 0; x <= viewportWidth + 1; x++) {
      const mapX = x + startMapX;
      const mapY = y + startMapY;

      const screenX = Math.floor(x * tileSize - fineShiftX);
      const screenY = Math.floor(y * tileSize - fineShiftY);

      if (mapX >= 0 && mapX < map[0].length && mapY >= 0 && mapY < map.length) {
        const isExplored = explored[mapY]?.[mapX];
        
        if (isExplored) {
          const tile = map[mapY][mapX];
          const baseColor = TILE_COLORS[tile];

          if (tile === TILE.WALL) {
            drawHighResWall(ctx, screenX, screenY, tileSize, baseColor, theme, mapX, mapY);

            // Wall Details (Randomized)
            const wallSeed = (mapX * 11 + mapY * 17) % 100;
            
            // Cracks or Moss
            if (wallSeed < 15) {
                 ctx.fillStyle = "rgba(0,0,0,0.2)";
                 ctx.beginPath();
                 ctx.moveTo(screenX + tileSize*0.3, screenY + tileSize*0.2);
                 ctx.lineTo(screenX + tileSize*0.4, screenY + tileSize*0.4);
                 ctx.lineTo(screenX + tileSize*0.35, screenY + tileSize*0.6);
                 ctx.stroke();
            }

            if (wallSeed < (level <= 4 ? 8 : 3)) {
              drawEnvironmentSprite(ctx, "cobweb", screenX, screenY, tileSize);
            }
            if (theme.lavaGlow && wallSeed >= 90) {
              ctx.strokeStyle = "#ef4444";
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(screenX + tileSize * 0.3, screenY + tileSize * 0.2);
              ctx.lineTo(screenX + tileSize * 0.5, screenY + tileSize * 0.5);
              ctx.stroke();
            }

          } else {
             // Floor base (including doors/stairs backgrounds)
             drawHighResFloor(ctx, screenX, screenY, tileSize, baseColor, mapX, mapY);

             if (tile === TILE.STAIRS) {
                drawEnvironmentSprite(ctx, 'stairs', screenX, screenY, tileSize);
             }
             else if (tile === TILE.DOOR || tile === TILE.DOOR_OPEN) {
                  const type = (tile === TILE.DOOR_OPEN) ? 'door_open' : 'door_closed';
                  drawEnvironmentSprite(ctx, type, screenX, screenY, tileSize);
             }
             
             // Decor (Only on empty floor)
             const isOccupied = 
                tile === TILE.DOOR || 
                tile === TILE.DOOR_OPEN || 
                tile === TILE.STAIRS || 
                tile === TILE.STAIRS_UP ||
                state.chests?.some(c => c.x === mapX && c.y === mapY);

             if (!isOccupied) {
               const seed = (mapX * 7 + mapY * 13) % 100;
               if (level <= 4) {
                 if (seed < 5) drawEnvironmentSprite(ctx, "bones", screenX, screenY, tileSize);
                 else if (seed < 9) drawEnvironmentSprite(ctx, "rubble", screenX, screenY, tileSize);
                 else if (seed < 13) drawEnvironmentSprite(ctx, "bloodstain", screenX, screenY, tileSize);
                 else if (seed < 18) drawEnvironmentSprite(ctx, "crack", screenX, screenY, tileSize);
               }
             }
          }
        }
      }
    }
  }
}

// Helper utils
export function getCameraTarget(player, map, viewportWidth, viewportHeight) {
  const halfViewW = Math.floor(viewportWidth / 2);
  const halfViewH = Math.floor(viewportHeight / 2);

  let targetX = player.x - halfViewW;
  let targetY = player.y - halfViewH;

  if (map && map.length > 0) {
    targetX = Math.max(0, Math.min(targetX, map[0].length - viewportWidth));
    targetY = Math.max(0, Math.min(targetY, map.length - viewportHeight));
  }

  return { x: targetX, y: targetY };
}

export function lerpCamera(current, target, speed = 0.1) {
  if (
    Math.abs(target.x - current.x) < 0.01 &&
    Math.abs(target.y - current.y) < 0.01
  ) {
    return target;
  }

  return {
    x: current.x + (target.x - current.x) * speed,
    y: current.y + (target.y - current.y) * speed,
  };
}