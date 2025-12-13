import { TILE } from "@/data/constants";
import { getThemeForFloor } from "@/components/game/DungeonThemes";
import { drawEnvironmentSprite } from "./environment";

const TILE_SIZE = 32;

// Función para texturizar tiles con ruido procedimental (sin cambios)
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

// --- ACTUALIZADO: Mapeo de colores para nuevos terrenos ---
function getTileColors(floor) {
  const theme = getThemeForFloor(floor);
  return {
    [TILE.WALL]: theme.wall,
    [TILE.FLOOR]: theme.floor,
    [TILE.STAIRS]: theme.floor,
    [TILE.DOOR]: theme.wall,      
    [TILE.DOOR_OPEN]: theme.floor,
    [TILE.STAIRS_UP]: theme.floor,
    // Nuevos Terrenos
    [TILE.WATER]: '#1e3a8a',          // Azul oscuro profundo
    [TILE.MUD]: '#3f2e18',            // Marrón oscuro fangoso
    [TILE.TRAP]: theme.floor,         // Camuflaje (mismo color que el suelo)
    [TILE.TRAP_TRIGGERED]: '#500724', // Fondo rojizo/sangre
    [TILE.RUBBLE]: theme.floor,       // Base de suelo (los escombros van encima)
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

  // Fondo negro general
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
        const isExplored = explored[mapY]?.[mapX];
        
        if (isExplored) {
          const tile = map[mapY][mapX];

          // 1. DIBUJAR BASE DEL TILE
          // Usamos fallback a suelo por si acaso
          const baseColor = TILE_COLORS[tile] || TILE_COLORS[TILE.FLOOR];
          
          drawTexturedTile(
            ctx,
            screenX,
            screenY,
            TILE_SIZE,
            baseColor,
            mapX,
            mapY
          );

          // 2. DETALLES ESPECÍFICOS POR TIPO
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

            // Detalles extra (Telarañas, grietas)
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
          } 
          else if (tile === TILE.FLOOR) {
            // Detalles del suelo estándar
            ctx.fillStyle = theme.floorDetail;
            if ((mapX + mapY) % 2 === 0)
              ctx.fillRect(screenX + 10, screenY + 10, 4, 4);

            // Decoración aleatoria (Sangre, escombros pequeños)
            const seed = (mapX * 7 + mapY * 13) % 100;
            if (level <= 4) {
              if (seed < 5) drawEnvironmentSprite(ctx, "bones", screenX, screenY, TILE_SIZE);
              else if (seed < 9) drawEnvironmentSprite(ctx, "rubble", screenX, screenY, TILE_SIZE);
              else if (seed < 13) drawEnvironmentSprite(ctx, "bloodstain", screenX, screenY, TILE_SIZE);
              else if (seed < 18) drawEnvironmentSprite(ctx, "crack", screenX, screenY, TILE_SIZE);
            }
          }
          
          // --- NUEVOS TERRENOS ---
          else if (tile === TILE.WATER) {
             // Efecto de agua (ondas animadas simples)
             ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
             // Usamos el tiempo para animar las ondas
             // Ondas simples animadas
             if ((Date.now() / 500 + mapX) % 2 > 1) {
                 ctx.fillRect(screenX + 4, screenY + 12, TILE_SIZE - 8, 2);
             }
          }
         else if (tile === TILE.MUD) {
             ctx.fillStyle = 'rgba(0,0,0,0.3)';
             ctx.fillRect(screenX + 6, screenY + 6, 4, 4);
             ctx.fillRect(screenX + 22, screenY + 20, 6, 6);
          }
          else if (tile === TILE.TRAP_TRIGGERED) {
             // 1. DIBUJAR EL FOSO (Agujero oscuro)
             ctx.fillStyle = '#171717'; // Casi negro
             // Margen de 2px a cada lado
             ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);

             // Sombra interior borde superior para profundidad
             ctx.fillStyle = '#09090b'; // Negro más profundo
             ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, 5);

             // 2. DIBUJAR MÁS PINCHOS (Ahora 5, más apretados)
             ctx.fillStyle = '#d4d4d8'; // Gris metal claro (Zinc)

             const numSpikes = 5; // ¡Más pinchos!
             const spikeW = 4;    // Más estrechos para que quepan
             const baseH = 17;    // Altura base máxima

             // Cálculo para distribuir el espacio
             // Espacio útil dentro del foso (32 - 4 margen izq/der - 2 margen extra interno = 26)
             const availableWidth = TILE_SIZE - 6;
             const totalSpikeWidth = numSpikes * spikeW;
             const remainingSpace = availableWidth - totalSpikeWidth;
             // Espacio entre pinchos (evitamos división por cero si solo fuera 1)
             const gap = numSpikes > 1 ? remainingSpace / (numSpikes - 1) : 0;

             const startX = screenX + 3; // Empezar con un pequeño margen interno
             const baseY = screenY + TILE_SIZE - 3; // Base del agujero

             for(let i=0; i < numSpikes; i++) {
                 // Usamos una semilla basada en la posición para que la variación sea fija por casilla
                 const seed = (mapX * 11 + mapY * 17 + i * 23);
                 // Variación de altura (entre 0 y 4 px más bajos)
                 const heightVariation = seed % 5; 
                 const currentSpikeH = baseH - heightVariation;

                 const sx = startX + (i * (spikeW + gap));

                 // Dibujar cuerpo del pincho
                 ctx.beginPath();
                 ctx.moveTo(sx, baseY); // Base izq
                 ctx.lineTo(sx + spikeW/2, baseY - currentSpikeH); // Punta
                 ctx.lineTo(sx + spikeW, baseY); // Base der
                 ctx.fill();

                 // Brillo en el lado izquierdo (para dar volumen 3D)
                 ctx.fillStyle = '#ffffff';
                 ctx.globalAlpha = 0.4; // Un poco más de brillo
                 ctx.beginPath();
                 ctx.moveTo(sx, baseY);
                 ctx.lineTo(sx + spikeW/2, baseY - currentSpikeH);
                 ctx.lineTo(sx + spikeW/2, baseY);
                 ctx.fill();
                 ctx.globalAlpha = 1.0;
                 ctx.fillStyle = '#d4d4d8'; // Restaurar color base

                 // Manchas de sangre (más probables en el centro)
                 if (seed % 10 > 5) {
                      ctx.fillStyle = '#b91c1c'; // Rojo sangre más oscuro
                      ctx.globalAlpha = 0.8;
                      // Mancha cerca de la punta
                      ctx.fillRect(sx + spikeW/2 - 1, baseY - currentSpikeH + 3, 2, 3);
                      ctx.globalAlpha = 1.0;
                 }
             }
          }
          else if (tile === TILE.RUBBLE) {
             // Dibujamos una roca
             drawEnvironmentSprite(ctx, "rubble", screenX, screenY, TILE_SIZE);
          }

          // --- OBJETOS INTERACTIVOS ---
          else if (tile === TILE.DOOR) {
              // 1. Marco de Piedra
              ctx.fillStyle = '#1c1917'; 
              ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
              
              // 2. Cuerpo de la Puerta
              const pad = 4;
              ctx.fillStyle = '#2c1203ff'; 
              ctx.fillRect(screenX + pad, screenY + 2, TILE_SIZE - pad*2, TILE_SIZE - 4);
              
              // 3. Textura
              ctx.fillStyle = 'rgba(0,0,0,0.3)';
              ctx.fillRect(screenX + 12, screenY + 2, 1, TILE_SIZE - 4);
              ctx.fillRect(screenX + 20, screenY + 2, 1, TILE_SIZE - 4);

              // 4. Hierro
              ctx.fillStyle = '#3c3c41ff'; 
              ctx.fillRect(screenX + pad, screenY + 6, TILE_SIZE - pad*2, 3);
              ctx.fillRect(screenX + pad, screenY + 22, TILE_SIZE - pad*2, 3);
              
              // Remaches
              ctx.fillStyle = '#a1a1aa';
              ctx.fillRect(screenX + 6, screenY + 7, 2, 2);
              ctx.fillRect(screenX + 24, screenY + 7, 2, 2);
              ctx.fillRect(screenX + 6, screenY + 23, 2, 2);
              ctx.fillRect(screenX + 24, screenY + 23, 2, 2);

              // 5. Aldaba
              ctx.strokeStyle = '#79797aff'; 
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.arc(screenX + 24, screenY + 16, 1, 0, Math.PI * 2);
              ctx.stroke();
              
              ctx.fillStyle = 'rgba(0,0,0,0.5)';
              ctx.fillRect(screenX + pad, screenY + TILE_SIZE - 2, TILE_SIZE - pad*2, 2);
          } 
          else if (tile === TILE.DOOR_OPEN) {
              ctx.fillStyle = 'rgba(0,0,0,0.2)';
              ctx.fillRect(screenX + 4, screenY, TILE_SIZE - 8, TILE_SIZE);

              ctx.fillStyle = '#44403c'; 
              ctx.fillRect(screenX, screenY, 5, TILE_SIZE);
              ctx.fillStyle = '#292524';
              ctx.fillRect(screenX, screenY + 10, 5, 1);
              ctx.fillRect(screenX, screenY + 22, 5, 1);

              ctx.fillStyle = '#44403c';
              ctx.fillRect(screenX + TILE_SIZE - 5, screenY, 5, TILE_SIZE);
              ctx.fillStyle = '#292524';
              ctx.fillRect(screenX + TILE_SIZE - 5, screenY + 10, 5, 1);
              ctx.fillRect(screenX + TILE_SIZE - 5, screenY + 22, 5, 1);

              ctx.fillStyle = '#292524';
              ctx.fillRect(screenX, screenY, TILE_SIZE, 3); 

              ctx.fillStyle = '#1b0e01ff'; 
              ctx.fillRect(screenX + 5, screenY + 2, 3, TILE_SIZE - 4); 
          }

          else if (tile === TILE.BARREL_EXPLOSIVE) {
             // 1. Barril Rojo
             ctx.fillStyle = '#7f1d1d'; // Rojo oscuro
             // Dibujamos forma de barril (reutilizamos lógica o simplificamos)
             const padding = 6;
             ctx.beginPath();
             ctx.ellipse(screenX + TILE_SIZE/2, screenY + TILE_SIZE/2, TILE_SIZE/2 - padding + 2, TILE_SIZE/2 - padding, 0, 0, Math.PI*2);
             ctx.fill();
             
             // 2. Aros metálicos
             ctx.fillStyle = '#1c1917';
             ctx.fillRect(screenX + 6, screenY + 8, TILE_SIZE - 12, 2);
             ctx.fillRect(screenX + 6, screenY + 22, TILE_SIZE - 12, 2);

             // 3. Símbolo "!" o Calavera
             ctx.fillStyle = '#fca5a5'; // Rojo claro
             ctx.font = 'bold 16px monospace';
             ctx.textAlign = 'center';
             ctx.fillText('!', screenX + TILE_SIZE/2, screenY + 21);
          }

          // Escaleras
          if (tile === TILE.STAIRS) {
            drawEnvironmentSprite(ctx, 'stairs', screenX, screenY, TILE_SIZE);
          } 
          if (tile === TILE.STAIRS_UP) {
             // Escalera subida (simple, color verdoso o iluminado)
             drawEnvironmentSprite(ctx, 'stairs', screenX, screenY, TILE_SIZE);
             ctx.fillStyle = "rgba(100, 255, 100, 0.2)"; // Tinte verde para indicar subida
             ctx.fillRect(screenX + 4, screenY + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          }
        }
      }
    }
  }
}

// --- UTILIDADES DE CÁMARA (Sin cambios) ---

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