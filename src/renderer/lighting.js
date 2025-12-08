// src/renderer/lighting.js
const TILE_SIZE = 32;

// --- CACHÉ DE LUCES (PRE-RENDER) ---
const lightCache = {};

// Función para generar una "pegatina" de luz en memoria
// Añadimos parámetro 'isSoft' para hacer luces más suaves y amplias
function getLightSprite(key, colorStart, colorEnd, size = 256, isSoft = false) {
  if (lightCache[key]) return lightCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, colorStart);
  
  // TRUCO: Si es suave, añadimos una parada intermedia para extender el centro claro
  if (isSoft) {
      // Mantiene la transparencia (luz) más lejos del centro
      gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.4)'); 
  }

  if (colorEnd) {
      gradient.addColorStop(1, colorEnd);
  } else {
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  lightCache[key] = canvas;
  return canvas;
}

const SPRITE_HOLE = 'hole_sprite';
const SPRITE_TORCH = 'torch_sprite';

function initSprites() {
    if (!lightCache[SPRITE_HOLE]) {
        // Agujero de visión: Usamos modo "soft" (true) para tener más rango visual
        getLightSprite(SPRITE_HOLE, 'rgba(0, 0, 0, 1)', 'rgba(0, 0, 0, 0)', 256, true);
    }
    if (!lightCache[SPRITE_TORCH]) {
        getLightSprite(SPRITE_TORCH, 'rgba(255, 140, 50, 0.25)', 'rgba(0, 0, 0, 0)');
    }
}

export const renderLighting = (ctx, width, height, state, offsetX, offsetY) => {
  initSprites(); 

  // 1. FONDO DE OSCURIDAD
  ctx.clearRect(0, 0, width, height);
  // Reduje ligeramente la opacidad base de 0.85 a 0.82 para que sea menos claustrofóbico
  ctx.fillStyle = "rgba(5, 5, 15, 0.82)"; 
  ctx.fillRect(0, 0, width, height);

  const { player, torches, items } = state;
  const time = Date.now() / 150;

  // --- PASADA 1: VISIBILIDAD ---
  ctx.globalCompositeOperation = "destination-out";

  const drawSprite = (spriteKey, x, y, radius) => {
      const sprite = lightCache[spriteKey];
      if (!sprite) return;
      const size = radius * 2;
      ctx.drawImage(sprite, x - radius, y - radius, size, size);
  };

  // Luz del Jugador (AUMENTADA de 180 a 230)
  const px = player.x * TILE_SIZE - offsetX * TILE_SIZE + TILE_SIZE / 2;
  const py = player.y * TILE_SIZE - offsetY * TILE_SIZE + TILE_SIZE / 2;
  drawSprite(SPRITE_HOLE, px, py, 230); // <--- Radio aumentado

  // Luz de Antorchas
  torches.forEach((torch) => {
    // ... (El resto de la función sigue exactamente igual que antes) ...
    const tx = torch.x * TILE_SIZE - offsetX * TILE_SIZE + TILE_SIZE / 2;
    const ty = torch.y * TILE_SIZE - offsetY * TILE_SIZE + TILE_SIZE / 2;

    if (tx > -200 && tx < width + 200 && ty > -200 && ty < height + 200) {
      const flicker = ((Math.sin(time + torch.x * 10) + 1) / 2) * 0.1;
      drawSprite(SPRITE_HOLE, tx, ty, 110 + flicker * 20);
    }
  });

  // Visión de Items Raros (Más pequeños)
  items.forEach((item) => {
    if (["rare", "epic", "legendary"].includes(item.rarity) || item.category === "potion") {
      const ix = item.x * TILE_SIZE - offsetX * TILE_SIZE + TILE_SIZE / 2;
      const iy = item.y * TILE_SIZE - offsetY * TILE_SIZE + TILE_SIZE / 2;
      drawSprite(SPRITE_HOLE, ix, iy, 50);
    }
  });

  // --- PASADA 2: AMBIENTE (Colorear la luz) ---
  ctx.globalCompositeOperation = "lighter";

  // Brillo de Antorchas (Usamos sprite 'torch' naranja)
  torches.forEach((torch) => {
    const tx = torch.x * TILE_SIZE - offsetX * TILE_SIZE + TILE_SIZE / 2;
    const ty = torch.y * TILE_SIZE - offsetY * TILE_SIZE + TILE_SIZE / 2;

    if (tx > -200 && tx < width + 200 && ty > -200 && ty < height + 200) {
      const flicker = ((Math.sin(time + torch.x * 10) + 1) / 2) * 0.1;
      drawSprite(SPRITE_TORCH, tx, ty, 190 + flicker * 40);
    }
  });

  // Brillo de Items (Para estos seguimos usando gradiente dinámico porque hay muchos colores distintos)
  // Optimización: Solo dibujarlos si están en pantalla estricta
  items.forEach((item) => {
    if (!state.visible[item.y]?.[item.x]) return;

    const ix = item.x * TILE_SIZE - offsetX * TILE_SIZE + TILE_SIZE / 2;
    const iy = item.y * TILE_SIZE - offsetY * TILE_SIZE + TILE_SIZE / 2;

    if (ix > -50 && ix < width + 50 && iy > -50 && iy < height + 50) {
        let colorStart = null;
        let radius = 40;

        if (item.category === "potion") {
            colorStart = "rgba(255, 50, 50, 0.3)";
        } else if (item.rarity === "rare") {
            colorStart = "rgba(50, 100, 255, 0.3)"; radius = 50;
        } else if (item.rarity === "epic") {
            colorStart = "rgba(180, 50, 255, 0.4)"; radius = 60;
        } else if (item.rarity === "legendary") {
            colorStart = "rgba(255, 200, 50, 0.5)"; radius = 70;
        }

        if (colorStart) {
            // Aquí SÍ usamos gradiente dinámico porque cachear todos los colores sería memoria extra
            // y hay pocos items raros en pantalla.
            const gradient = ctx.createRadialGradient(ix, iy, 0, ix, iy, radius);
            gradient.addColorStop(0, colorStart);
            gradient.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(ix, iy, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
  });

  // --- PASO FINAL: CORRECCIÓN DE FUGA DE LUZ ---
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(5, 5, 15, 0.85)";

  const startMapX = Math.floor(offsetX);
  const startMapY = Math.floor(offsetY);
  const tilesX = Math.ceil(width / TILE_SIZE) + 1;
  const tilesY = Math.ceil(height / TILE_SIZE) + 1;
  const LIGHT_RADIUS_TILES = 4; // Un poco más generoso para evitar parpadeos en bordes

  // Iteramos solo lo que se ve en pantalla
  for (let y = -1; y < tilesY; y++) {
    for (let x = -1; x < tilesX; x++) {
      const mapX = startMapX + x;
      const mapY = startMapY + y;

      if (state.map[mapY]?.[mapX]) {
        // Si el jugador lo ve, no lo tapamos.
        if (state.visible[mapY]?.[mapX]) continue;

        // Si NO lo ve, comprobamos si está iluminado por una antorcha cercana.
        // Optimización: Solo comprobar antorchas si la celda está explorada.
        let isLitByTorch = false;
        if (state.explored[mapY]?.[mapX]) {
             // Comprobación rápida de distancia Manhattan primero (más barata)
             for (const torch of torches) {
                 const dx = Math.abs(mapX - torch.x);
                 const dy = Math.abs(mapY - torch.y);
                 if (dx < LIGHT_RADIUS_TILES && dy < LIGHT_RADIUS_TILES) {
                     // Comprobación euclidiana precisa
                     if (dx*dx + dy*dy < LIGHT_RADIUS_TILES*LIGHT_RADIUS_TILES) {
                         isLitByTorch = true;
                         break;
                     }
                 }
             }
        }

        if (!isLitByTorch) {
          const screenX = Math.floor(mapX * TILE_SIZE - offsetX * TILE_SIZE);
          const screenY = Math.floor(mapY * TILE_SIZE - offsetY * TILE_SIZE);
          // Tapamos con un cuadro negro para borrar la "fuga" del gradiente
          ctx.fillRect(screenX, screenY, TILE_SIZE + 1, TILE_SIZE + 1);
        }
      }
    }
  }
};