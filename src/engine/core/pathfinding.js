// Calcula la distancia estimada (heurística Manhattan)
function heuristic(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Reconstruye el camino para saber cuál es el siguiente paso inmediato
function reconstructPath(node) {
  const path = [];
  let current = node;
  while (current.parent) {
    path.push({ x: current.x, y: current.y });
    current = current.parent;
  }
  // El camino viene del final al inicio, lo invertimos y devolvemos el primer paso
  return path.reverse()[0] || null;
}

export function findPath(startX, startY, targetX, targetY, map) {
  // Inicialización de conjuntos
  const openSet = [];
  const closedSet = new Set();

  // Nodo inicial
  const startNode = {
    x: startX,
    y: startY,
    g: 0, // Coste real desde el inicio
    f: 0, // Coste total estimado
    parent: null,
  };

  startNode.f = heuristic(startNode, { x: targetX, y: targetY });
  openSet.push(startNode);

  // Límite de seguridad para evitar cuelgues en mapas muy grandes
  let iterations = 0;
  const maxIterations = 1000;

  while (openSet.length > 0) {
    iterations++;
    if (iterations > maxIterations) return null;

    // 1. Obtener el nodo con menor coste F
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift();

    // 2. ¿Hemos llegado?
    if (current.x === targetX && current.y === targetY) {
      return reconstructPath(current);
    }

    closedSet.add(`${current.x},${current.y}`);

    // 3. Explorar vecinos (Arriba, Abajo, Izquierda, Derecha)
    const neighbors = [
      { x: current.x, y: current.y - 1 },
      { x: current.x, y: current.y + 1 },
      { x: current.x - 1, y: current.y },
      { x: current.x + 1, y: current.y },
    ];

    for (const neighborPos of neighbors) {
      // Ignorar si ya evaluado
      if (closedSet.has(`${neighborPos.x},${neighborPos.y}`)) continue;

      // Verificar límites del mapa
      if (
        neighborPos.y < 0 ||
        neighborPos.y >= map.length ||
        neighborPos.x < 0 ||
        neighborPos.x >= map[0].length
      )
        continue;

      // Verificar si es un muro (Asumimos 0 = WALL según tus constantes)
      const isWall = map[neighborPos.y][neighborPos.x] === 0;

      // Permitimos que el destino sea un muro (para atacar al jugador si está en una puerta),
      // pero el camino intermedio debe ser libre.
      if (isWall && (neighborPos.x !== targetX || neighborPos.y !== targetY))
        continue;

      const gScore = current.g + 1;

      // Comprobar si ya encontramos un camino mejor a este vecino
      const existingNode = openSet.find(
        (n) => n.x === neighborPos.x && n.y === neighborPos.y
      );

      if (!existingNode) {
        const newNode = {
          x: neighborPos.x,
          y: neighborPos.y,
          g: gScore,
          f: gScore + heuristic(neighborPos, { x: targetX, y: targetY }),
          parent: current,
        };
        openSet.push(newNode);
      } else if (gScore < existingNode.g) {
        // Actualizar camino si este es más rápido
        existingNode.g = gScore;
        existingNode.f =
          gScore + heuristic(neighborPos, { x: targetX, y: targetY });
        existingNode.parent = current;
      }
    }
  }

  return null; // No se encontró camino
}
