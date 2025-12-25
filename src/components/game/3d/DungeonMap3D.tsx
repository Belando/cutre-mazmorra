import { useMemo } from 'react';
import { Instance, Instances } from '@react-three/drei';
import { GameState } from '@/types';
import { TILE } from '@/data/constants';

interface DungeonMap3DProps {
    map: number[][];
    visible: boolean[][];
    explored: boolean[][];
}

export function DungeonMap3D({ map, visible, explored }: DungeonMap3DProps) {
    // Aplanamos el mapa para renderizarlo eficientemente
    const tiles = useMemo(() => {
        const t: { x: number; y: number; type: number; isVisible: boolean; isExplored: boolean }[] = [];
        map.forEach((row, y) => {
            row.forEach((cell, x) => {
                const isExplored = explored[y]?.[x];
                if (isExplored) {
                    t.push({
                        x,
                        y,
                        type: cell,
                        isVisible: !!visible[y]?.[x],
                        isExplored: !!isExplored
                    });
                }
            });
        });
        return t;
    }, [map, visible, explored]);

    return (
        <group>
            {/* Suelo Base (Instanciadp) */}
            <Instances range={1000} castShadow receiveShadow>
                <boxGeometry args={[1, 0.2, 1]} />
                <meshStandardMaterial color="#334155" />

                {tiles.map((tile, i) => (
                    tile.type !== TILE.WALL ? (
                        <Instance
                            key={`floor-${i}`}
                            position={[tile.x, -0.1, tile.y]}
                            color={tile.isVisible ? "#475569" : "#1e293b"}
                        />
                    ) : null
                ))}
            </Instances>

            {/* Paredes (Instanciadas) */}
            <Instances range={1000} castShadow receiveShadow>
                <boxGeometry args={[1, 2, 1]} />
                <meshStandardMaterial color="#64748b" />

                {tiles.map((tile, i) => (
                    tile.type === TILE.WALL ? (
                        <Instance
                            key={`wall-${i}`}
                            position={[tile.x, 1, tile.y]}
                            color={tile.isVisible ? "#94a3b8" : "#334155"}
                        />
                    ) : null
                ))}
            </Instances>
        </group>
    );
}
