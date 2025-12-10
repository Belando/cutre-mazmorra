import { TILE } from "@/data/constants";
import { getThemeForFloor } from "@/components/game/DungeonThemes";

import { drawEnvironmentSprite } from "./environment";

const TILE_SIZE = 32;

// ... (Mantén tu función drawTexturedTile y getTileColors igual que antes) ...
function drawTexturedTile(ctx, screenX, screenY, size, color, mapX, mapY) {
  // 1. Dibujar base sólida
  ctx.fillStyle = color;
  ctx.fillRect(screenX, screenY, size, size);

  // 2. Generar ruido procedimental
  const seed = Math.sin(mapX * 12.9898 + mapY * 78.233) * 43758.5453;
  const rand = (offset) => {
    const val = Math.sin(seed + offset) * 10000;
    return val - Math.floor(val);
  };

  // Dibujar 4 "granos" de textura por tile
  for (let i = 0; i < 4; i++) {
    const px = Math.floor(rand(i) * size);
    const py = Math.floor(rand(i + 10) * size);
    const w = Math.floor(rand(i + 20) * 2) + 1;
    const h = Math.floor(rand(i + 30) * 2) + 1;

    const isHighlight = rand(i + 50) > 0.6;
    const opacity = 0.05 + rand(i + 40) * 0.1;

    ctx.fillStyle = isHighlight
      ? `rgba(255, 255, 255, ${opacity * 0.5})`
      : `rgba(0, 0, 0, ${opacity})`;

    ctx.fillRect(screenX + px, screenY + py, w, h);
  }
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

  // Fondo negro
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const startMapX = Math.floor(offsetX);
  const startMapY = Math.floor(offsetY);
  const fineShiftX = (offsetX - startMapX) * TILE_SIZE;
  const fineShiftY = (offsetY - startMapY) * TILE_SIZE;

  for (let y = 0; y <= viewportHeight + 1; y++) {
    for (let x = 0; x <= viewportWidth + 1; x++) {
      const mapX = x + startMapX;
      const mapY = y + startMapY;

      const screenX = Math.floor(x * TILE_SIZE - fineShiftX);
      const screenY = Math.floor(y * TILE_SIZE - fineShiftY);

      if (mapX >= 0 && mapX < map[0].length && mapY >= 0 && mapY < map.length) {
        // Necesitamos saber si es visible para los detalles extra (opcional),
        // pero lo CRÍTICO es usar isExplored para dibujar la base.
        const isExplored = explored[mapY]?.[mapX];
        const isVisibleByPlayer = visible[mapY]?.[mapX];

        if (isExplored) {
          const tile = map[mapY][mapX];

          // CORRECCIÓN: Usamos SIEMPRE el color normal.
          // lighting.js pondrá una capa negra semitransparente encima si no es visible.
          // lighting.js quitará esa capa si hay luz (antorcha).
          const baseColor = TILE_COLORS[tile];

          drawTexturedTile(
            ctx,
            screenX,
            screenY,
            TILE_SIZE,
            baseColor,
            mapX,
            mapY
          );

          if (tile === TILE.WALL) {
            // Relieve normal
            ctx.fillStyle = theme.wallDetail;

            // Bordes irregulares
            const seed = mapX * 3 + mapY * 7;
            const v1 = seed % 3;
            const v2 = (seed * 2) % 3;

            ctx.beginPath();
            ctx.moveTo(screenX + 2, screenY + 2 + v1);
            ctx.lineTo(screenX + TILE_SIZE - 2, screenY + 2 + v2);
            ctx.lineTo(screenX + TILE_SIZE - 2 - v1, screenY + TILE_SIZE - 2);
            ctx.lineTo(screenX + 2 + v2, screenY + TILE_SIZE - 2);
            ctx.fill();

            // Sombra inferior del muro
            ctx.fillStyle = theme.wall;
            ctx.fillRect(screenX + 4, screenY + 6 + v1, TILE_SIZE - 10, 2);

            // Detalles extra (Telarañas, etc.)
            // Puedes decidir dibujarlos siempre o solo si isVisibleByPlayer
            // Dibujarlos siempre queda mejor para el efecto de luz ambiental
            const wallSeed = (mapX * 11 + mapY * 17) % 100;
            if (wallSeed < (level <= 4 ? 8 : 3)) {
              drawEnvironmentSprite(ctx, "cobweb", screenX, screenY, TILE_SIZE);
            }
            if (theme.lavaGlow && wallSeed >= 90) {
              ctx.strokeStyle = "#ef4444";
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(screenX + TILE_SIZE * 0.3, screenY + TILE_SIZE * 0.2);
              ctx.lineTo(screenX + TILE_SIZE * 0.5, screenY + TILE_SIZE * 0.5);
              ctx.stroke();
            }
          } else if (tile === TILE.FLOOR) {
            // Detalles del suelo
            ctx.fillStyle = theme.floorDetail;
            if ((mapX + mapY) % 2 === 0)
              ctx.fillRect(screenX + 10, screenY + 10, 4, 4);

            // Decoración (Sangre, escombros, etc)
            // Dibujamos siempre para que se vean si la luz de la antorcha les da
            const seed = (mapX * 7 + mapY * 13) % 100;
            if (level <= 4) {
              if (seed < 5)
                drawEnvironmentSprite(
                  ctx,
                  "bones",
                  screenX,
                  screenY,
                  TILE_SIZE
                );
              else if (seed < 9)
                drawEnvironmentSprite(
                  ctx,
                  "rubble",
                  screenX,
                  screenY,
                  TILE_SIZE
                );
              else if (seed < 13)
                drawEnvironmentSprite(
                  ctx,
                  "bloodstain",
                  screenX,
                  screenY,
                  TILE_SIZE
                );
              else if (seed < 18)
                drawEnvironmentSprite(
                  ctx,
                  "crack",
                  screenX,
                  screenY,
                  TILE_SIZE
                );
            } else {
              if (seed < 10) {
                ctx.fillStyle = "rgba(239, 68, 68, 0.5)";
                ctx.beginPath();
                ctx.ellipse(
                  screenX + 16,
                  screenY + 20,
                  10,
                  5,
                  0,
                  0,
                  Math.PI * 2
                );
                ctx.fill();
              } else if (seed < 15)
                drawEnvironmentSprite(
                  ctx,
                  "rubble",
                  screenX,
                  screenY,
                  TILE_SIZE
                );
            }
          }

          // --- DIBUJO DE PUERTAS ---
          if (tile === TILE.DOOR) {
              // 1. Marco de Piedra (Fondo oscuro)
              ctx.fillStyle = '#1c1917'; // Piedra oscura
              ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
              
              // 2. Cuerpo de la Puerta (Madera vieja)
              const pad = 4; // Grosor del marco
              ctx.fillStyle = '#2c1203ff'; // Madera oscura
              ctx.fillRect(screenX + pad, screenY + 2, TILE_SIZE - pad*2, TILE_SIZE - 4);
              
              // 3. Textura: Tablones verticales
              ctx.fillStyle = 'rgba(0,0,0,0.3)';
              ctx.fillRect(screenX + 12, screenY + 2, 1, TILE_SIZE - 4); // Línea separación 1
              ctx.fillRect(screenX + 20, screenY + 2, 1, TILE_SIZE - 4); // Línea separación 2

              // 4. Refuerzos de Hierro (Bandas horizontales)
              ctx.fillStyle = '#3c3c41ff'; // Metal gris
              ctx.fillRect(screenX + pad, screenY + 6, TILE_SIZE - pad*2, 3);  // Banda superior
              ctx.fillRect(screenX + pad, screenY + 22, TILE_SIZE - pad*2, 3); // Banda inferior
              
              // Remaches (Brillos)
              ctx.fillStyle = '#a1a1aa';
              ctx.fillRect(screenX + 6, screenY + 7, 2, 2);
              ctx.fillRect(screenX + 24, screenY + 7, 2, 2);
              ctx.fillRect(screenX + 6, screenY + 23, 2, 2);
              ctx.fillRect(screenX + 24, screenY + 23, 2, 2);

              // 5. Aldaba / Pomo (Anilla)
              ctx.strokeStyle = '#79797aff'; // Plata vieja
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.arc(screenX + 24, screenY + 16, 1, 0, Math.PI * 2); // Anilla
              ctx.stroke();
              
              // Sombra de contacto en el suelo
              ctx.fillStyle = 'rgba(0,0,0,0.5)';
              ctx.fillRect(screenX + pad, screenY + TILE_SIZE - 2, TILE_SIZE - pad*2, 2);
          } 
          else if (tile === TILE.DOOR_OPEN) {
              // 1. Sombra del umbral (Paso oscuro)
              ctx.fillStyle = 'rgba(0,0,0,0.2)';
              ctx.fillRect(screenX + 4, screenY, TILE_SIZE - 8, TILE_SIZE);

              // 2. Marco de Piedra (Jambas laterales con bloques)
              ctx.fillStyle = '#44403c'; // Piedra gris
              
              // Jamba Izquierda
              ctx.fillRect(screenX, screenY, 5, TILE_SIZE);
              // Cortes de bloques
              ctx.fillStyle = '#292524';
              ctx.fillRect(screenX, screenY + 10, 5, 1);
              ctx.fillRect(screenX, screenY + 22, 5, 1);

              // Jamba Derecha
              ctx.fillStyle = '#44403c';
              ctx.fillRect(screenX + TILE_SIZE - 5, screenY, 5, TILE_SIZE);
              // Cortes de bloques
              ctx.fillStyle = '#292524';
              ctx.fillRect(screenX + TILE_SIZE - 5, screenY + 10, 5, 1);
              ctx.fillRect(screenX + TILE_SIZE - 5, screenY + 22, 5, 1);

              // 3. Dintel superior (Arco simple)
              ctx.fillStyle = '#292524';
              ctx.fillRect(screenX, screenY, TILE_SIZE, 3); // Borde superior oscuro

              // 4. Hoja de la puerta abierta (Vista de canto)
              // Simulamos que la puerta está abierta hacia adentro a la izquierda
              ctx.fillStyle = '#1b0e01ff'; // Madera muy oscura en sombra
              ctx.fillRect(screenX + 5, screenY + 2, 3, TILE_SIZE - 4); 
          }

          // Escaleras
          if (tile === TILE.STAIRS) {
            drawEnvironmentSprite(ctx, 'stairs', screenX, screenY, TILE_SIZE);
          } 
        }
      }
    }
  }
}

// --- UTILIDADES DE CÁMARA ---

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