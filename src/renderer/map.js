// src/renderer/map.js
import { TILE } from "@/data/constants";
import { getThemeForFloor } from "@/components/game/DungeonThemes";
import { adjustBrightness } from "@/engine/core/utils";
import { drawEnvironmentSprite } from "./environment";

const TILE_SIZE = 32;

/**
 * Obtiene la paleta de colores para los tiles según el nivel
 */
function getTileColors(floor) {
  const theme = getThemeForFloor(floor);
  return {
    [TILE.WALL]: theme.wall,
    [TILE.FLOOR]: theme.floor,
    [TILE.STAIRS]: theme.floor,
    [TILE.DOOR]: theme.wall,
    [TILE.STAIRS_UP]: theme.floor,
  };
}

/**
 * Renderiza la capa estática del mapa (Muros, Suelo, Decoración estática)
 * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
 * @param {Object} state - Estado del juego (map, visible, explored, level)
 * @param {number} offsetX - Posición X de la cámara (en tiles)
 * @param {number} offsetY - Posición Y de la cámara (en tiles)
 * @param {number} viewportWidth - Ancho del viewport en tiles
 * @param {number} viewportHeight - Alto del viewport en tiles
 */
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

  // Fondo base para evitar huecos vacíos
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Cálculos para suavidad (Sub-pixel rendering)
  // startMapX/Y es el índice del tile superior izquierdo
  const startMapX = Math.floor(offsetX);
  const startMapY = Math.floor(offsetY);

  // fineShift es el desplazamiento fino en píxeles para el movimiento suave
  const fineShiftX = (offsetX - startMapX) * TILE_SIZE;
  const fineShiftY = (offsetY - startMapY) * TILE_SIZE;

  // Iteramos con +1 margen para dibujar tiles parcialmente visibles en los bordes
  for (let y = 0; y <= viewportHeight + 1; y++) {
    for (let x = 0; x <= viewportWidth + 1; x++) {
      const mapX = x + startMapX;
      const mapY = y + startMapY;

      // Coordenadas en pantalla
      const screenX = Math.floor(x * TILE_SIZE - fineShiftX);
      const screenY = Math.floor(y * TILE_SIZE - fineShiftY);

      // Verificar límites del mapa
      if (mapX >= 0 && mapX < map[0].length && mapY >= 0 && mapY < map.length) {
        const isVisible = visible[mapY]?.[mapX];
        const isExplored = explored[mapY]?.[mapX];

        if (isExplored || isVisible) {
          const tile = map[mapY][mapX];

          // 1. Dibujar Tile Base
          // Si no es visible ahora mismo (pero está explorado), lo oscurecemos
          ctx.fillStyle = isVisible
            ? TILE_COLORS[tile]
            : adjustBrightness(TILE_COLORS[tile], -60);
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

          // 2. Detalles Específicos
          if (tile === TILE.WALL) {
            // Relieve del muro
            ctx.fillStyle = isVisible
              ? theme.wallDetail
              : adjustBrightness(theme.wallDetail, -40);
            ctx.fillRect(
              screenX + 2,
              screenY + 2,
              TILE_SIZE - 4,
              TILE_SIZE - 4
            );

            if (isVisible) {
              // Sombra/Detalle inferior
              ctx.fillStyle = theme.wall;
              ctx.fillRect(screenX + 4, screenY + 6, TILE_SIZE - 10, 2);

              // Semilla determinista para decoración (basada en posición)
              const wallSeed = (mapX * 11 + mapY * 17) % 100;

              // Telarañas
              if (wallSeed < (level <= 4 ? 8 : 3)) {
                drawEnvironmentSprite(
                  ctx,
                  "cobweb",
                  screenX,
                  screenY,
                  TILE_SIZE
                );
              }

              // Brillo de lava en muros (si el tema lo tiene)
              if (theme.lavaGlow && wallSeed >= 90) {
                ctx.strokeStyle = "#ef4444";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(
                  screenX + TILE_SIZE * 0.3,
                  screenY + TILE_SIZE * 0.2
                );
                ctx.lineTo(
                  screenX + TILE_SIZE * 0.5,
                  screenY + TILE_SIZE * 0.5
                );
                ctx.stroke();
              }
            }
          } else if (tile === TILE.STAIRS) {
            ctx.fillStyle = "#8b2a3a";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "bold 18px monospace";
            ctx.fillText("▼", screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
          } else if (tile === TILE.STAIRS_UP) {
            ctx.fillStyle = "#4ade80";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = "bold 18px monospace";
            ctx.fillText("▲", screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
          } else if (tile === TILE.FLOOR && isVisible) {
            // Detalles del suelo
            ctx.fillStyle = theme.floorDetail;
            if ((mapX + mapY) % 2 === 0)
              ctx.fillRect(screenX + 10, screenY + 10, 4, 4);

            const seed = (mapX * 7 + mapY * 13) % 100;

            // Decoración de suelo según nivel
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
              // else if (seed < 22) drawEnvironmentSprite(ctx, 'mushroom', screenX, screenY, TILE_SIZE);
            } else {
              // Niveles profundos
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
        }
      }
    }
  }
}

// --- UTILIDADES DE CÁMARA (Paso 2.3) ---

/**
 * Calcula el objetivo de la cámara centrado en el jugador pero limitado por los bordes del mapa.
 */
export function getCameraTarget(player, map, viewportWidth, viewportHeight) {
  const halfViewW = Math.floor(viewportWidth / 2);
  const halfViewH = Math.floor(viewportHeight / 2);

  let targetX = player.x - halfViewW;
  let targetY = player.y - halfViewH;

  // Clamping (Mantener cámara dentro de los límites del mapa)
  if (map && map.length > 0) {
    targetX = Math.max(0, Math.min(targetX, map[0].length - viewportWidth));
    targetY = Math.max(0, Math.min(targetY, map.length - viewportHeight));
  }

  return { x: targetX, y: targetY };
}

/**
 * Interpola suavemente la posición actual de la cámara hacia el objetivo.
 * @param {Object} current - {x, y} actual
 * @param {Object} target - {x, y} objetivo
 * @param {number} speed - Velocidad de interpolación (0.1 por defecto)
 */
export function lerpCamera(current, target, speed = 0.1) {
  // Si la diferencia es muy pequeña, saltamos al objetivo para evitar micro-movimientos infinitos
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
