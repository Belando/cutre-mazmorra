// src/renderer/lighting.js
const TILE_SIZE = 32;

export const renderLighting = (ctx, width, height, state, offsetX, offsetY) => {
  // 1. FONDO DE OSCURIDAD
  ctx.clearRect(0, 0, width, height);

  // Niebla con opacidad 0.85 para que lo explorado se vea oscuro pero visible
  ctx.fillStyle = "rgba(5, 5, 15, 0.85)";
  ctx.fillRect(0, 0, width, height);

  const { player, torches, items } = state;
  const time = Date.now() / 150;

  // --- PASADA 1: VISIBILIDAD (Recortar agujeros en la oscuridad) ---
  // Esto revela el mapa debajo. Se aplica a todo lo que emite luz para ver el suelo.
  ctx.globalCompositeOperation = "destination-out";

  const drawVisibilityHole = (x, y, radius) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, "rgba(0, 0, 0, 1)"); // Totalmente transparente (visible)
    gradient.addColorStop(0.8, "rgba(0, 0, 0, 0.5)"); // Transición
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)"); // Opaco (oscuro)
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  // Luz del Jugador
  const px = player.x * TILE_SIZE - offsetX * TILE_SIZE + TILE_SIZE / 2;
  const py = player.y * TILE_SIZE - offsetY * TILE_SIZE + TILE_SIZE / 2;
  drawVisibilityHole(px, py, 180);

  // Luz de Antorchas (Agujero de visión)
  torches.forEach((torch) => {
    const tx = torch.x * TILE_SIZE - offsetX * TILE_SIZE + TILE_SIZE / 2;
    const ty = torch.y * TILE_SIZE - offsetY * TILE_SIZE + TILE_SIZE / 2;

    // Culling
    if (tx > -100 && tx < width + 100 && ty > -100 && ty < height + 100) {
      const flicker = ((Math.sin(time + torch.x * 10) + 1) / 2) * 0.1;
      // Radio aumentado a 180 para iluminar bien la sala
      drawVisibilityHole(tx, ty, 110 + flicker * 20);
    }
  });

  // Visión de Items Raros
  items.forEach((item) => {
    if (
      ["rare", "epic", "legendary"].includes(item.rarity) ||
      item.category === "potion"
    ) {
      const ix = item.x * TILE_SIZE - offsetX * TILE_SIZE + TILE_SIZE / 2;
      const iy = item.y * TILE_SIZE - offsetY * TILE_SIZE + TILE_SIZE / 2;
      drawVisibilityHole(ix, iy, 50);
    }
  });

  // --- PASADA 2: AMBIENTE (Colorear la luz) ---
  // Esto añade el "glow" de color. SOLO se dibuja si el jugador VE la fuente de luz.
  ctx.globalCompositeOperation = "lighter";

  const drawColoredGlow = (x, y, radius, colorStart, colorEnd) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  // Brillo de Antorchas
  torches.forEach((torch) => {
    // IMPORTANTE: Si el jugador no ve la antorcha ahora mismo, no dibujamos el brillo de color.
    // Esto evita ver manchas naranjas a través de las paredes en zonas exploradas pero oscuras.
    //if (!state.visible[torch.y]?.[torch.x]) return;

    const tx = torch.x * TILE_SIZE - offsetX * TILE_SIZE + TILE_SIZE / 2;
    const ty = torch.y * TILE_SIZE - offsetY * TILE_SIZE + TILE_SIZE / 2;

    if (tx > -100 && tx < width + 100 && ty > -100 && ty < height + 100) {
      const flicker = ((Math.sin(time + torch.x * 10) + 1) / 2) * 0.1;

      // Brillo naranja cálido
      drawColoredGlow(
        tx,
        ty,
        190 + flicker * 40,
        "rgba(255, 140, 50, 0.25)",
        "rgba(0, 0, 0, 0)"
      );
    }
  });

  // Brillo de Items
  items.forEach((item) => {
    // Igual para los items: si no lo ves, no brilla
    if (!state.visible[item.y]?.[item.x]) return;

    const ix = item.x * TILE_SIZE - offsetX * TILE_SIZE + TILE_SIZE / 2;
    const iy = item.y * TILE_SIZE - offsetY * TILE_SIZE + TILE_SIZE / 2;

    if (ix > -50 && ix < width + 50 && iy > -50 && iy < height + 50) {
      if (item.category === "potion") {
        drawColoredGlow(ix, iy, 40, "rgba(255, 50, 50, 0.3)", "rgba(0,0,0,0)");
      } else if (item.rarity === "rare") {
        drawColoredGlow(ix, iy, 50, "rgba(50, 100, 255, 0.3)", "rgba(0,0,0,0)");
      } else if (item.rarity === "epic") {
        drawColoredGlow(ix, iy, 60, "rgba(180, 50, 255, 0.4)", "rgba(0,0,0,0)");
      } else if (item.rarity === "legendary") {
        drawColoredGlow(ix, iy, 70, "rgba(255, 200, 50, 0.5)", "rgba(0,0,0,0)");
      }
    }
  });

  // --- PASO FINAL: CORRECCIÓN DE FUGA DE LUZ INTELIGENTE ---
  // Oscurecemos tiles no visibles, PERO respetamos si están iluminados por una antorcha cercana.

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(5, 5, 15, 0.85)"; // Mismo color de la niebla base

  // Calculamos el rango en tiles del radio de luz (110px / 32px ≈ 3.5 tiles)
  const LIGHT_RADIUS_TILES = 3.5;

  const startMapX = Math.floor(offsetX);
  const startMapY = Math.floor(offsetY);
  const tilesX = Math.ceil(width / TILE_SIZE) + 2;
  const tilesY = Math.ceil(height / TILE_SIZE) + 2;

  for (let y = -1; y < tilesY; y++) {
    for (let x = -1; x < tilesX; x++) {
      const mapX = startMapX + x;
      const mapY = startMapY + y;

      if (state.map[mapY]?.[mapX]) {
        const isVisible = state.visible[mapY]?.[mapX];

        // Si el jugador lo ve, no lo tapamos.
        if (isVisible) continue;

        // Si NO lo ve, comprobamos si hay una antorcha cerca que lo ilumine.
        let isLitByTorch = false;

        // Optimización: Solo buscamos si la tile está "explorada" (para no calcular luz en zonas desconocidas)
        // O si quieres ver luz a través de muros desconocidos, quita el check de explored.
        if (state.explored[mapY]?.[mapX]) {
          for (const torch of torches) {
            // Distancia euclidiana simple
            const dist = Math.sqrt(
              Math.pow(mapX - torch.x, 2) + Math.pow(mapY - torch.y, 2)
            );
            if (dist < LIGHT_RADIUS_TILES) {
              isLitByTorch = true;
              break;
            }
          }
        }

        // LA NUEVA CONDICIÓN:
        // Solo dibujamos el parche negro si NO es visible Y NO está iluminado por una antorcha.
        if (!isLitByTorch) {
          const screenX = mapX * TILE_SIZE - offsetX * TILE_SIZE;
          const screenY = mapY * TILE_SIZE - offsetY * TILE_SIZE;

          // Dibujar parche oscuro
          ctx.fillRect(
            Math.floor(screenX),
            Math.floor(screenY),
            TILE_SIZE + 1,
            TILE_SIZE + 1
          );
        }
      }
    }
  }

  ctx.globalCompositeOperation = "source-over";
};
