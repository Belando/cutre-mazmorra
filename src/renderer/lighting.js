// src/renderer/lighting.js
const TILE_SIZE = 32;

export const renderLighting = (ctx, width, height, state, offsetX, offsetY) => {
  // 1. Limpiar y llenar de oscuridad
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(5, 5, 10, 0.95)";
  ctx.fillRect(0, 0, width, height);

  ctx.globalCompositeOperation = "destination-out";

  const { player, torches, items } = state;

  // Helper interno para dibujar luz
  const drawLight = (x, y, radius, intensity = 1) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(0, 0, 0, ${intensity})`);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  // Luz del Jugador
  const px = player.x * TILE_SIZE - offsetX * TILE_SIZE + TILE_SIZE / 2;
  const py = player.y * TILE_SIZE - offsetY * TILE_SIZE + TILE_SIZE / 2;
  drawLight(px, py, 180, 1);

  // Luz de Antorchas
  const time = Date.now() / 150;
  torches.forEach((torch) => {
    const tx = torch.x * TILE_SIZE - offsetX * TILE_SIZE + TILE_SIZE / 2;
    const ty = torch.y * TILE_SIZE - offsetY * TILE_SIZE + TILE_SIZE / 2;
    // Culling simple
    if (tx > -100 && tx < width + 100 && ty > -100 && ty < height + 100) {
      const flicker = ((Math.sin(time + torch.x * 10) + 1) / 2) * 0.1;
      drawLight(tx, ty, 140 + flicker * 40, 0.9);
    }
  });

  // Luz de Items Raros
  items.forEach((item) => {
    if (
      ["rare", "epic", "legendary"].includes(item.rarity) ||
      item.category === "potion"
    ) {
      const ix = item.x * TILE_SIZE - offsetX * TILE_SIZE + TILE_SIZE / 2;
      const iy = item.y * TILE_SIZE - offsetY * TILE_SIZE + TILE_SIZE / 2;
      drawLight(ix, iy, 60, 0.6);
    }
  });

  ctx.globalCompositeOperation = "source-over";
};
