import { useState, useCallback } from 'react';
import { generateDungeon, TILE } from '@/components/game/systems/DungeonGenerator';
import { generateNPCs } from '@/components/game/systems/NPCSystem';

const MAP_WIDTH = 50;
const MAP_HEIGHT = 35;

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
    
    for (let angle = 0; angle < 360; angle += 2) {
      const rad = angle * Math.PI / 180;
      const dx = Math.cos(rad), dy = Math.sin(rad);
      let x = playerX + 0.5, y = playerY + 0.5;
      
      for (let i = 0; i < 6; i++) { // Radio de visión
        const tx = Math.floor(x), ty = Math.floor(y);
        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) break;
        visible[ty][tx] = true;
        explored[ty][tx] = true;
        if (currentMap.map[ty][tx] === TILE.WALL) break;
        x += dx; y += dy;
      }
    }
    return { visible, explored };
  }, []);

  const generateLevel = useCallback((level, playerLevel, savedData = null) => {
    if (savedData) {
      setDungeon(savedData);
      return savedData;
    }

    const newDungeon = generateDungeon(MAP_WIDTH, MAP_HEIGHT, level, playerLevel);
    
    // Generar NPCs
    const npcs = generateNPCs(level, newDungeon.rooms, newDungeon.map, [0, newDungeon.rooms.length - 1]);
    
    // Limpiar cofres que coincidan con NPCs
    const cleanChests = (newDungeon.chests || []).filter(c => !npcs.some(n => n.x === c.x && n.y === c.y));

    // Generar enemigos (ya viene en newDungeon pero lo extraemos para state)
    // Extraer enemigos de la matriz de entidades para tenerlos en un array manejable
    const enemiesList = [];
    // (La lógica de extracción ya la hace generateDungeon y la devuelve en .enemies, la usamos directo)

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