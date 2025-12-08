import { useState, useCallback } from 'react';
import { generateDungeon } from "@/engine/systems/DungeonGenerator";
import { TILE, MAP_WIDTH, MAP_HEIGHT } from "@/data/constants"; 
import { generateNPCs } from "@/engine/systems/NPCSystem";

export function useDungeon() {
  const [dungeon, setDungeon] = useState({
    map: [], entities: [], enemies: [], items: [], chests: [], 
    torches: [], npcs: [], stairs: null, stairsUp: null,
    visible: [], explored: [], level: 1, bossDefeated: false
  });

  const calculateFOV = useCallback((playerX, playerY, currentMap) => {
    // Crear matrices vacías si no existen o resetearlas
    const visible = Array(MAP_HEIGHT).fill().map(() => Array(MAP_WIDTH).fill(false));
    const explored = currentMap.explored || Array(MAP_HEIGHT).fill().map(() => Array(MAP_WIDTH).fill(false));
    
    // Aumentamos la densidad de rayos para que no queden huecos negros en las puertas
    // Cambiamos el paso del ángulo de 2 a 1 (o incluso 0.5 si se viera mal)
    for (let angle = 0; angle < 360; angle += 1) { 
      const rad = angle * Math.PI / 180;
      const dx = Math.cos(rad), dy = Math.sin(rad);
      let x = playerX + 0.5, y = playerY + 0.5;
      
      for (let i = 0; i < 7; i++) { // Aumentamos un poco el radio de visión también
        const tx = Math.floor(x), ty = Math.floor(y);
        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) break;
        
        visible[ty][tx] = true;
        explored[ty][tx] = true;
        
        const tile = currentMap.map[ty][tx];

        // --- CAMBIO CLAVE AQUÍ ---
        // La luz se detiene si choca con una PARED (0) o una PUERTA CERRADA (3)
        // La puerta ABIERTA (5) dejará pasar la luz
        if (tile === TILE.WALL || tile === TILE.DOOR) break;
        
        x += dx; y += dy;
      }
    }
    return { visible, explored };
  }, []);

  // ... (El resto del archivo generateLevel y demás se mantiene IGUAL) ...

  const generateLevel = useCallback((level, playerLevel, savedData = null) => {
    if (savedData) {
      setDungeon(savedData);
      return savedData;
    }

    const newDungeon = generateDungeon(MAP_WIDTH, MAP_HEIGHT, level, playerLevel);
    
    const npcs = generateNPCs(level, newDungeon.rooms, newDungeon.map, [0, newDungeon.rooms.length - 1]);
    
    const cleanChests = (newDungeon.chests || []).filter(c => !npcs.some(n => n.x === c.x && n.y === c.y));

    const initialState = {
      ...newDungeon,
      chests: cleanChests,
      npcs,
      visible: Array(MAP_HEIGHT).fill().map(() => Array(MAP_WIDTH).fill(false)),
      explored: Array(MAP_HEIGHT).fill().map(() => Array(MAP_WIDTH).fill(false)),
      level,
      bossDefeated: false,
    };

    setDungeon(initialState);
    return initialState;
  }, []);

  const updateMapFOV = useCallback((playerX, playerY) => {
    setDungeon(prev => {
      const { visible, explored } = calculateFOV(playerX, playerY, prev);
      return { ...prev, visible, explored };
    });
  }, [calculateFOV]);

  return {
    dungeon,
    setDungeon,
    generateLevel,
    updateMapFOV
  };
}