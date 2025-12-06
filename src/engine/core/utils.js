import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function adjustBrightness(hex, amount) {
  if (!hex || typeof hex !== "string") return "#000000";
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amount));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// Algoritmo de Bresenham para Línea de Visión (Copiado aquí para uso general)
export function hasLineOfSight(map, x1, y1, x2, y2) {
  // Asegurar coordenadas enteras
  let x0 = Math.floor(x1);
  let y0 = Math.floor(y1);
  const xEnd = Math.floor(x2);
  const yEnd = Math.floor(y2);

  const dx = Math.abs(xEnd - x0);
  const dy = Math.abs(yEnd - y0);
  const sx = x0 < xEnd ? 1 : -1;
  const sy = y0 < yEnd ? 1 : -1;
  let err = dx - dy;

  while (x0 !== xEnd || y0 !== yEnd) {
    // Si encontramos un muro (0) y no es el punto de inicio ni final
    if (map[y0]?.[x0] === 0) {
      if (
        (x0 !== Math.floor(x1) || y0 !== Math.floor(y1)) &&
        (x0 !== xEnd || y0 !== yEnd)
      ) {
        return false;
      }
    }

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
  return true;
}
