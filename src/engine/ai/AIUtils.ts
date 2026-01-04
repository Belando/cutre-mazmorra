import { Entity, Player, Enemy, Point, ISpatialHash } from '@/types';
import { TILE, ENTITY } from '@/data/constants';
import { findPath } from '@/engine/core/pathfinding';
import { AI_CONFIG } from '@/data/ai';

// --- FUNCIONES DE MOVIMIENTO (OPTIMIZADAS CON SPATIAL HASH) ---

// Comprueba si una casilla está libre de obstáculos
export function isTileFree(x: number, y: number, map: number[][], spatialHash: ISpatialHash): boolean {
    if (!map || !map[0]) return false;
    // 1. Límites del mapa
    if (y < 0 || y >= map.length || x < 0 || x >= map[0].length) return false;

    // 2. Obstáculos estáticos (Muros/Puertas Cerradas)
    const tile = map[y][x];
    const isWalkable = tile === TILE.FLOOR || tile === TILE.STAIRS || tile === TILE.STAIRS_UP || tile === TILE.DOOR_OPEN;

    if (!isWalkable) return false;

    // 3. Entidades dinámicas (Consulta O(1) al Hash)
    // isBlocked devuelve true si hay Player, Enemy, Chest o NPC
    if (spatialHash && spatialHash.isBlocked(x, y)) return false;

    return true;
}

// Calcular posición de flanqueo
export function getFlankingPosition(player: Player, allies: Enemy[], map: number[][], spatialHash: ISpatialHash): Point | null {
    const directions = [
        { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
        { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
        { dx: 1, dy: 1 }, { dx: -1, dy: 1 },
        { dx: 1, dy: -1 }, { dx: -1, dy: -1 },
    ];

    // Posiciones ocupadas por aliados (para no intentar ir donde ya hay uno)
    const occupiedPositions = new Set(allies.map(a => `${a.x},${a.y}`));

    for (const dir of directions) {
        const pos = { x: player.x + dir.dx, y: player.y + dir.dy };

        if (isTileFree(pos.x, pos.y, map, spatialHash) && !occupiedPositions.has(`${pos.x},${pos.y}`)) {
            // Es posición de flanqueo si está opuesta a otro aliado
            const isFlank = allies.some(ally => {
                const dx = Math.sign(player.x - ally.x);
                const dy = Math.sign(player.y - ally.y);
                return dir.dx === -dx || dir.dy === -dy;
            });
            if (isFlank) return pos;
        }
    }
    return null;
}

// Moverse lejos del objetivo (Huida/Cautela)
export function moveAway(enemy: Entity, player: Entity, map: number[][], spatialHash: ISpatialHash): Point | null {
    const dx = Math.sign(enemy.x - player.x);
    const dy = Math.sign(enemy.y - player.y);

    const moves = [
        { x: enemy.x + dx, y: enemy.y },
        { x: enemy.x, y: enemy.y + dy },
        { x: enemy.x + dx, y: enemy.y + dy },
    ];

    for (const move of moves) {
        if (isTileFree(move.x, move.y, map, spatialHash)) return move;
    }
    return null;
}

// Movimiento lateral (Strafe)
export function getLateralMove(enemy: Entity, player: Entity, map: number[][], spatialHash: ISpatialHash): Point | null {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;

    const lateralMoves = [
        { x: enemy.x - dy, y: enemy.y + dx },
        { x: enemy.x + dy, y: enemy.y - dx },
    ];

    if (Math.random() < 0.5) lateralMoves.reverse();

    for (const move of lateralMoves) {
        if (isTileFree(move.x, move.y, map, spatialHash)) return move;
    }
    return null;
}

// Movimiento aleatorio (cuando no te ven)
export function moveRandomly(enemy: Entity, map: number[][], spatialHash: ISpatialHash, player: Entity): Point | null {
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    const randomDir = dirs[Math.floor(Math.random() * dirs.length)];
    const target = { x: enemy.x + randomDir[0], y: enemy.y + randomDir[1] };

    // Evitar pisar al jugador explícitamente si es invisible
    if (target.x === player.x && target.y === player.y) return null;

    if (isTileFree(target.x, target.y, map, spatialHash)) {
        return target;
    }
    return null;
}

// Mover hacia el objetivo usando lógica Híbrida (A* o Directa)
export function moveToward(enemy: Entity, targetX: number, targetY: number, map: number[][], spatialHash: ISpatialHash): Point | null {
    const dist = Math.abs(enemy.x - targetX) + Math.abs(enemy.y - targetY);

    // OPTIMIZACIÓN 1: INTELIGENTE (Solo si está cerca)
    if (dist <= AI_CONFIG.PATHFINDING_LIMIT) {
        const nextStep = findPath(enemy.x, enemy.y, targetX, targetY, map);

        if (nextStep) {
            // 1a. CAMINO LIBRE
            if (isTileFree(nextStep.x, nextStep.y, map, spatialHash)) {
                return nextStep;
            }

            // 1b. FLOCKING
            const neighbors = [
                { x: enemy.x + 1, y: enemy.y },
                { x: enemy.x - 1, y: enemy.y },
                { x: enemy.x, y: enemy.y + 1 },
                { x: enemy.x, y: enemy.y - 1 }
            ];

            const validMoves = neighbors.filter(pos => isTileFree(pos.x, pos.y, map, spatialHash));

            if (validMoves.length > 0) {
                validMoves.sort((a, b) => {
                    const distA = Math.abs(a.x - targetX) + Math.abs(a.y - targetY);
                    const distB = Math.abs(b.x - targetX) + Math.abs(b.y - targetY);
                    return distA - distB;
                });
                return validMoves[0];
            }
        }
    }

    // OPTIMIZACIÓN 2: TONTA
    const dx = Math.sign(targetX - enemy.x);
    const dy = Math.sign(targetY - enemy.y);

    const simpleMoves: Point[] = [];
    if (Math.abs(targetX - enemy.x) > Math.abs(targetY - enemy.y)) {
        if (dx !== 0) simpleMoves.push({ x: enemy.x + dx, y: enemy.y });
        if (dy !== 0) simpleMoves.push({ x: enemy.x, y: enemy.y + dy });
    } else {
        if (dy !== 0) simpleMoves.push({ x: enemy.x, y: enemy.y + dy });
        if (dx !== 0) simpleMoves.push({ x: enemy.x + dx, y: enemy.y });
    }

    for (const move of simpleMoves) {
        if (isTileFree(move.x, move.y, map, spatialHash)) {
            return move;
        }
    }

    return null;
}
