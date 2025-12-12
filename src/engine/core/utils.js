import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { TILE } from "@/data/constants";

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

// --- UTILIDADES GEOMÉTRICAS ---

// Calcular distancia Manhattan (movimiento en cuadrícula)
export function getDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Calcular distancia Euclidiana (real, para radios de visión/rango preciso)
export function getEuclideanDistance(a, b) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

// Comprobar si el objetivo está dentro del rango
export function isInRange(attacker, target, range) {
  return getDistance(attacker, target) <= range;
}

// Algoritmo de Bresenham para Línea de Visión
export function hasLineOfSight(map, x1, y1, x2, y2) {
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
    // Verificamos límites del mapa para evitar crash
    if (!map[y0] || map[y0][x0] === undefined) return false;

    const tile = map[y0][x0];
    
    // Si encontramos un obstáculo y no es el punto de inicio
    if (tile === TILE.WALL || tile === TILE.DOOR) {
      if (x0 !== Math.floor(x1) || y0 !== Math.floor(y1)) {
        return false; // Bloqueado
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

// Obtener la trayectoria del proyectil
export function getProjectilePath(x1, y1, x2, y2, map, maxRange = 8) {
  const path = [];
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  
  let x = x1;
  let y = y1;
  let distance = 0;
  
  while (distance < maxRange) {
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
    
    distance++;
    if (x === x1 && y === y1) continue;
    
    // Verificación de seguridad de límites
    if (!map[y] || map[y][x] === undefined || map[y][x] === TILE.WALL) break;
    
    path.push({ x, y, distance });
    if (x === x2 && y === y2) break;
  }
  return path;
}