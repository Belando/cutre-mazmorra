// src/renderer/lighting.js
import { TILE } from "@/data/constants";

const TILE_SIZE = 32;

// --- CACHÉ DE LUCES (PRE-RENDER) ---
const lightCache = {};

function getLightSprite(key, colorStart, colorEnd, size = 256, isSoft = false) {
  if (lightCache[key]) return lightCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  
  if (isSoft) {
      // SPRITE PARA VISIÓN (Agujero suave)
      gradient.addColorStop(0, 'rgba(0, 0, 0, 1)'); 
      gradient.addColorStop(0.5, 'rgba(0, 0, 0, 1)'); 
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else {
      // SPRITE PARA ANTORCHA (Glow suave y grande)
      // Ajustamos los stops para que el centro sea brillante y se difumine mucho
      gradient.addColorStop(0, colorStart); // Centro intenso
      gradient.addColorStop(0.1, colorStart); 
      gradient.addColorStop(0.4, colorStart.replace(/[\d.]+\)$/, '0.3)')); // Medio suave
      gradient.addColorStop(1, colorEnd || 'rgba(0,0,0,0)'); // Final transparente
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  lightCache[key] = canvas;
  return canvas;
}

const SPRITE_HOLE = 'hole_sprite';
const SPRITE_TORCH = 'torch_sprite';
const SPRITE_REVEAL = 'reveal_sprite';

function initSprites() {
    if (!lightCache[SPRITE_HOLE]) {
        getLightSprite(SPRITE_HOLE, 'rgba(0, 0, 0, 1)', 'rgba(0, 0, 0, 0)', 256, true);
    }
    if (!lightCache[SPRITE_TORCH]) {
        // Volvemos a un color cálido y suave, pero con buena opacidad para el Hard-Light
        getLightSprite(SPRITE_TORCH, 'rgba(255, 180, 100, 0.9)', 'rgba(0, 0, 0, 0)');
    }
    if (!lightCache[SPRITE_REVEAL]) {
        getLightSprite(SPRITE_REVEAL, 'rgba(0,0,0,1)', 'rgba(0,0,0,0)', 64, true);
    }
}

export const renderLighting = (ctx, width, height, state, offsetX, offsetY) => {
  initSprites(); 

  // Fondo oscuro base
  const DARKNESS_COLOR = "rgba(10, 10, 15, 0.95)"; 

  // 1. LLENAR TODO DE OSCURIDAD
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = DARKNESS_COLOR;
  ctx.fillRect(0, 0, width, height);

  const { player, torches, items } = state;
  const time = Date.now() / 150;

  // --- PASADA 1: RECORTAR NIEBLA (VISIBILIDAD) ---
  ctx.globalCompositeOperation = "destination-out";

  const startMapX = Math.floor(offsetX);
  const startMapY = Math.floor(offsetY);
  const tilesX = Math.ceil(width / TILE_SIZE) + 2;
  const tilesY = Math.ceil(height / TILE_SIZE) + 2;

  const revealSprite = lightCache[SPRITE_REVEAL];
  const revealSize = 60; 
  const offsetReveal = revealSize / 2;

  // Dibujamos la visión del jugador (lo que ve actualmente)
  for (let y = -1; y < tilesY; y++) {
    for (let x = -1; x < tilesX; x++) {
      const mapX = startMapX + x;
      const mapY = startMapY + y;

      if (state.map[mapY]?.[mapX]) {
        if (state.visible[mapY]?.[mapX]) {
            const screenX = Math.floor(mapX * TILE_SIZE - offsetX * TILE_SIZE);
            const screenY = Math.floor(mapY * TILE_SIZE - offsetY * TILE_SIZE);
            
            ctx.drawImage(revealSprite, screenX + TILE_SIZE/2 - offsetReveal, screenY + TILE_SIZE/2 - offsetReveal, revealSize, revealSize);
        }
      }
    }
  }

  // Agujero extra limpio sobre el jugador
  const drawSprite = (spriteKey, x, y, radius) => {
      const sprite = lightCache[spriteKey];
      if (!sprite) return;
      const size = radius * 2;
      ctx.drawImage(sprite, x - radius, y - radius, size, size);
  };

  const px = player.x * TILE_SIZE - offsetX * TILE_SIZE + TILE_SIZE / 2;
  const py = player.y * TILE_SIZE - offsetY * TILE_SIZE + TILE_SIZE / 2;
  drawSprite(SPRITE_HOLE, px, py, 150); 

  // --- PASADA 2: LUCES SUAVES (ANTORCHAS) ---
  // Aquí volvemos a la lógica original de dibujar circulos grandes
  // pero usaremos el recorte final para que no se salgan.
  
  ctx.globalCompositeOperation = "lighter"; // O "screen" si quieres menos intensidad

  torches.forEach((torch) => {
    // Si la antorcha no es visible, no la dibujamos
    if (!state.visible[torch.y]?.[torch.x]) return;

    // Calcular posición en pantalla
    const tx = torch.x * TILE_SIZE - offsetX * TILE_SIZE + TILE_SIZE / 2;
    const ty = torch.y * TILE_SIZE - offsetY * TILE_SIZE + TILE_SIZE / 2;

    // Solo dibujar si está en pantalla
    if (tx > -200 && tx < width + 200 && ty > -200 && ty < height + 200) {
      const flicker = ((Math.sin(time + torch.x * 10) + 1) / 2) * 0.1;
      
      // DIBUJAR UN SOLO CÍRCULO GRANDE Y SUAVE (Como en la foto 2)
      // Ajusta el radio (280) para hacer la luz más grande o pequeña
      drawSprite(SPRITE_TORCH, tx, ty, 280 + flicker * 30);
    }
  });
  
  // Resetear alpha
  ctx.globalAlpha = 1.0;

  // Items (Brillo suave)
  items.forEach((item) => {
    if (!state.visible[item.y]?.[item.x]) return;
    const ix = item.x * TILE_SIZE - offsetX * TILE_SIZE + TILE_SIZE / 2;
    const iy = item.y * TILE_SIZE - offsetY * TILE_SIZE + TILE_SIZE / 2;

    if (ix > -80 && ix < width + 80 && iy > -80 && iy < height + 80) {
        let color = null; let radius = 50;
        if (item.category === "potion") color = "rgba(255, 80, 80, 0.5)";
        else if (item.rarity === "rare") { color = "rgba(80, 120, 255, 0.5)"; radius = 60; }
        else if (item.rarity === "epic") { color = "rgba(200, 80, 255, 0.6)"; radius = 80; }
        else if (item.rarity === "legendary") { color = "rgba(255, 220, 50, 0.7)"; radius = 100; }
        if (color) {
            const g = ctx.createRadialGradient(ix, iy, 0, ix, iy, radius);
            g.addColorStop(0, color); g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ix, iy, radius, 0, Math.PI * 2); ctx.fill();
        }
    }
  });

  // =========================================================
  // --- PASO 3: LA TIJERA (LIMPIEZA DEL VACÍO) ---
  // =========================================================
  // Aquí es donde ocurre la magia. Borramos cualquier píxel de luz
  // que haya caído fuera del mapa (zona negra).
  
  ctx.globalCompositeOperation = "destination-out"; // Modo Borrador

  for (let y = -1; y < tilesY; y++) {
    for (let x = -1; x < tilesX; x++) {
      const mapX = startMapX + x;
      const mapY = startMapY + y;

      // Verificamos si esta coordenada NO existe en el mapa (es vacío/negro)
      const row = state.map[mapY];
      // Si la fila no existe o la celda es undefined, es vacío.
      // IMPORTANTE: NO usamos state.map[y][x] === 0 (pared), porque la luz SÍ debe dar en la pared.
      // Solo borramos si estamos fuera de los límites del array.
      const isVoid = !row || row[mapX] === undefined;

      if (isVoid) {
        const screenX = Math.floor(mapX * TILE_SIZE - offsetX * TILE_SIZE);
        const screenY = Math.floor(mapY * TILE_SIZE - offsetY * TILE_SIZE);

        // Borramos un cuadrado negro perfecto.
        // El +1 y -1 es para solapar un poquito y evitar líneas finas.
        ctx.fillRect(screenX - 1, screenY - 1, TILE_SIZE + 2, TILE_SIZE + 2);
      }
    }
  }
  
  ctx.globalCompositeOperation = "source-over";
};