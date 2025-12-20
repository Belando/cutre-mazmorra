// src/engine/core/pathfinding.ts
interface Point {
    x: number;
    y: number;
}

interface PathNode extends Point {
    g: number;
    f: number;
    parent: PathNode | null;
}

// Calcula la distancia estimada (heurística Manhattan)
function heuristic(a: Point | PathNode, b: Point): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Reconstruye el camino para saber cuál es el siguiente paso inmediato
function reconstructPath(node: PathNode): Point | null {
    const path: Point[] = [];
    let current: PathNode | null = node;
    while (current.parent) {
        path.push({ x: current.x, y: current.y });
        current = current.parent;
    }
    // El camino viene del final al inicio, lo invertimos y devolvemos el primer paso
    const inverted = path.reverse();
    return inverted.length > 0 ? inverted[0] : null;
}

import { BinaryHeap } from './BinaryHeap';

export function findPath(startX: number, startY: number, targetX: number, targetY: number, map: number[][]): Point | null {
    // Inicialización de conjuntos
    const openSet = new BinaryHeap<PathNode>();
    const openSetNodes = new Map<string, PathNode>(); // Para búsqueda rápida en openSet
    const closedSet = new Set<string>();

    // Nodo inicial
    const startNode: PathNode = {
        x: startX,
        y: startY,
        g: 0,
        f: 0,
        parent: null,
    };

    startNode.f = heuristic(startNode, { x: targetX, y: targetY });
    openSet.push(startNode);
    openSetNodes.set(`${startX},${startY}`, startNode);

    // Límite de seguridad
    let iterations = 0;
    const maxIterations = 2000; // Increased limit for better pathing

    while (openSet.size() > 0) {
        iterations++;
        if (iterations > maxIterations) return null;

        // 1. Obtener el nodo con menor coste F (O(1) pop, O(logN) rebalance)
        const current = openSet.pop();

        if (!current) break;

        const currentKey = `${current.x},${current.y}`;
        openSetNodes.delete(currentKey); // Ya no está en openSet

        // 2. ¿Hemos llegado?
        if (current.x === targetX && current.y === targetY) {
            return reconstructPath(current);
        }

        closedSet.add(currentKey);

        // 3. Explorar vecinos (Arriba, Abajo, Izquierda, Derecha)
        const neighbors = [
            { x: current.x, y: current.y - 1 },
            { x: current.x, y: current.y + 1 },
            { x: current.x - 1, y: current.y },
            { x: current.x + 1, y: current.y },
        ];

        for (const neighborPos of neighbors) {
            const neighborKey = `${neighborPos.x},${neighborPos.y}`;

            // Ignorar si ya evaluado
            if (closedSet.has(neighborKey)) continue;

            // Verificar límites del mapa
            if (
                neighborPos.y < 0 ||
                neighborPos.y >= map.length ||
                neighborPos.x < 0 ||
                neighborPos.x >= map[0].length
            )
                continue;

            // Verificar si es un muro
            const isWall = map[neighborPos.y][neighborPos.x] === 0;

            if (isWall && (neighborPos.x !== targetX || neighborPos.y !== targetY))
                continue;

            const gScore = current.g + 1;

            // Comprobar si ya está en openSet
            const existingNode = openSetNodes.get(neighborKey);

            if (!existingNode) {
                const newNode: PathNode = {
                    x: neighborPos.x,
                    y: neighborPos.y,
                    g: gScore,
                    f: gScore + heuristic(neighborPos, { x: targetX, y: targetY }),
                    parent: current,
                };
                openSet.push(newNode);
                openSetNodes.set(neighborKey, newNode);
            } else if (gScore < existingNode.g) {
                // Actualizar camino si este es más rápido
                existingNode.g = gScore;
                existingNode.f = gScore + heuristic(neighborPos, { x: targetX, y: targetY });
                existingNode.parent = current;

                // IMPORTANTE: Reordenar el heap porque 'f' cambió
                // Usamos rescoreElement pero necesitamos la implementación específica
                // Si BinaryHeap.rescoreElement asume que sabemos índice...
                // Nuestra implementación actual de rescoreElement busca por índice con indexOf, lo cual es O(N).
                // Una optimización real requeriría que el nodo sepa su índice en el heap. 
                // Pero indexOf es mejor que sort() completo.
                openSet.rescoreElement(existingNode);
            }
        }
    }

    return null; // No se encontró camino
}
