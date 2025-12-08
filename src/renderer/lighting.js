// src/renderer/lighting.js
const TILE_SIZE = 32;

// --- CACHÉ DE LUCES (PRE-RENDER) ---
const lightCache = {};

// Generador de sprites de luz/sombra
function getLightSprite(key, colorStart, colorEnd, size = 256, isSoft = false) {
  if (lightCache[key]) return lightCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  
  if (isSoft) {
      // SPRITE PARA RECORTAR NIEBLA (Suave)
      gradient.addColorStop(0, 'rgba(0, 0, 0, 1)'); 
      gradient.addColorStop(0.5, 'rgba(0, 0, 0, 1)'); 
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  } else {
      // SPRITE PARA BRILLO DE COLOR (Glow)
      gradient.addColorStop(0, colorStart);
      gradient.addColorStop(0.2, colorStart.replace(/[\d.]+\)$/, '0.5)')); 
      gradient.addColorStop(1, colorEnd || 'rgba(0,0,0,0)');
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  lightCache[key] = canvas;
  return canvas;
}

const SPRITE_HOLE = 'hole_sprite';
const SPRITE_TORCH = 'torch_sprite';
const SPRITE_REVEAL = 'reveal_sprite'; // <--- NUEVO SPRITE PEQUEÑO

function initSprites() {
    if (!lightCache[SPRITE_HOLE]) {
        getLightSprite(SPRITE_HOLE, 'rgba(0, 0, 0, 1)', 'rgba(0, 0, 0, 0)', 256, true);
    }
    if (!lightCache[SPRITE_TORCH]) {
        // Luz cálida y brillante para antorchas
        getLightSprite(SPRITE_TORCH, 'rgba(255, 200, 120, 0.6)', 'rgba(0, 0, 0, 0)');
    }
    if (!lightCache[SPRITE_REVEAL]) {
        // NUEVO: Sprite pequeño para "estampar" cada casilla visible individualmente.
        // Usamos un tamaño de 64px (2 tiles) para que se solapen suavemente.
        getLightSprite(SPRITE_REVEAL, 'rgba(0,0,0,1)', 'rgba(0,0,0,0)', 64, true);
    }
}

export const renderLighting = (ctx, width, height, state, offsetX, offsetY) => {
  initSprites(); 

  const DARKNESS_COLOR = "rgba(5, 5, 15, 0.60)"; // Niebla base suave (60%)

  // 1. LLENAR TODO DE OSCURIDAD
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = DARKNESS_COLOR;
  ctx.fillRect(0, 0, width, height);

  const { player, torches, items } = state;
  const time = Date.now() / 150;

  // --- PASADA 1: RECORTAR NIEBLA (VISIBILIDAD ORGÁNICA) ---
  ctx.globalCompositeOperation = "destination-out";

  const startMapX = Math.floor(offsetX);
  const startMapY = Math.floor(offsetY);
  const tilesX = Math.ceil(width / TILE_SIZE) + 1;
  const tilesY = Math.ceil(height / TILE_SIZE) + 1;

  // NUEVA LÓGICA: En lugar de dibujar rectángulos negros donde NO ves,
  // dibujamos círculos transparentes donde SÍ ves.
  // Esto crea bordes redondeados naturales y respeta paredes/puertas automáticamente.
  
  const revealSprite = lightCache[SPRITE_REVEAL];
  const revealSize = 60; // Un poco menos de 2 tiles para un solapamiento suave
  const offsetReveal = revealSize / 2;

  for (let y = -1; y < tilesY; y++) {
    for (let x = -1; x < tilesX; x++) {
      const mapX = startMapX + x;
      const mapY = startMapY + y;

      if (state.map[mapY]?.[mapX]) {
        // Si la casilla es VISIBLE (según el algoritmo de FOV que ya arreglamos)
        if (state.visible[mapY]?.[mapX]) {
            const screenX = Math.floor(mapX * TILE_SIZE - offsetX * TILE_SIZE);
            const screenY = Math.floor(mapY * TILE_SIZE - offsetY * TILE_SIZE);
            
            // Estampamos el círculo de visión en el centro del tile
            ctx.drawImage(
                revealSprite, 
                screenX + TILE_SIZE/2 - offsetReveal, 
                screenY + TILE_SIZE/2 - offsetReveal, 
                revealSize, 
                revealSize
            );
        }
      }
    }
  }

  // --- PASADA 1.5: LUCES PRINCIPALES (Suma claridad extra) ---
  // Mantenemos esto para que el jugador y antorchas tengan un núcleo central más limpio
  
  const drawSprite = (spriteKey, x, y, radius) => {
      const sprite = lightCache[spriteKey];
      if (!sprite) return;
      const size = radius * 2;
      ctx.drawImage(sprite, x - radius, y - radius, size, size);
  };

  // Luz Jugador (Solo el centro muy brillante)
  const px = player.x * TILE_SIZE - offsetX * TILE_SIZE + TILE_SIZE / 2;
  const py = player.y * TILE_SIZE - offsetY * TILE_SIZE + TILE_SIZE / 2;
  drawSprite(SPRITE_HOLE, px, py, 150); // Radio reducido porque el tile-reveal hace el resto

  // Luz Antorchas (Para asegurar que el fuego mismo se vea nítido)
  torches.forEach((torch) => {
    // IMPORTANTE: Solo dibujamos el "agujero" extra si la antorcha es visible
    if (!state.visible[torch.y]?.[torch.x]) return;

    const tx = torch.x * TILE_SIZE - offsetX * TILE_SIZE + TILE_SIZE / 2;
    const ty = torch.y * TILE_SIZE - offsetY * TILE_SIZE + TILE_SIZE / 2;
    if (tx > -200 && tx < width + 200 && ty > -200 && ty < height + 200) {
      const flicker = ((Math.sin(time + torch.x * 10) + 1) / 2) * 0.1;
      drawSprite(SPRITE_HOLE, tx, ty, 80 + flicker * 10);
    }
  });

  // --- PASADA 2: AMBIENTE (COLOR) ---
  ctx.globalCompositeOperation = "lighter";

  // Antorchas (Glow Dorado)
  torches.forEach((torch) => {
    if (!state.visible[torch.y]?.[torch.x]) return; // Respetar paredes

    const tx = torch.x * TILE_SIZE - offsetX * TILE_SIZE + TILE_SIZE / 2;
    const ty = torch.y * TILE_SIZE - offsetY * TILE_SIZE + TILE_SIZE / 2;

    if (tx > -200 && tx < width + 200 && ty > -200 && ty < height + 200) {
      const flicker = ((Math.sin(time + torch.x * 10) + 1) / 2) * 0.1;
      drawSprite(SPRITE_TORCH, tx, ty, 200 + flicker * 30);
    }
  });

  // Items
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
  
  ctx.globalCompositeOperation = "source-over";
};