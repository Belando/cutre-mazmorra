import { useMemo } from 'react';
import { Instance, Instances } from '@react-three/drei';
import { GameState } from '@/types';
import { TILE } from '@/data/constants';
import { useTexture } from '@react-three/drei';
import { FLOOR_TEXTURE, WALL_TEXTURE } from '@/data/textures';
import * as THREE from 'three';
import { Model as WallModel } from './WallModel'; // Reactivado con escala ajustada
import { Model as TorchModel } from './TorchModel';
import { Model as FloorModel } from './FloorModel';

interface DungeonMap3DProps {
    map: number[][];
    visible: boolean[][];
    explored: boolean[][];
}

export function DungeonMap3D({ map, visible, explored }: DungeonMap3DProps) {
    // Cargar texturas
    const floorTex = useTexture(FLOOR_TEXTURE);
    const wallTex = useTexture(WALL_TEXTURE);

    // Configurar repetición
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
    // Pixel art style filtering
    floorTex.magFilter = THREE.NearestFilter;
    floorTex.minFilter = THREE.NearestFilter;
    wallTex.magFilter = THREE.NearestFilter;
    wallTex.minFilter = THREE.NearestFilter;

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


            {/* Suelo Base (Reemplazado por FloorModel) */}
            {/*
            <Instances range={1000} castShadow receiveShadow>
                <boxGeometry args={[1, 0.2, 1]} />
                <meshStandardMaterial map={floorTex} color="#64748b" />

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
            */}

            {/* Suelo Nuevo (Floor GLB) */}
            {tiles.map((tile, i) => {
                if (tile.type === TILE.WALL) return null; // El suelo no se dibuja donde hay pared (las paredes suelen ocupar todo)

                // Solo dibujar suelo si es visible (optimización básica) o explorado
                if (!tile.isExplored) return null;

                return (
                    <FloorModel
                        key={`floor-${i}`}
                        position={[tile.x, 0, tile.y]} // Ajustar altura si es necesario
                        rotation={[0, (tile.x + tile.y) % 2 === 0 ? 0 : Math.PI / 2, 0]} // Rotación aleatoria para variedad
                        visible={tile.isVisible} // Podríamos oscurecerlo si no es visible en lugar de ocultarlo, pero por ahora lo dejamos así
                    />
                );
            })}



            {/* Paredes (Instanciadas) - DESACTIVADAS para probar el modelo escalado
            <Instances range={1000} castShadow receiveShadow>
                <boxGeometry args={[1, 2, 1]} />
                <meshStandardMaterial map={wallTex} color="#94a3b8" />

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
            */}

            {/* Paredes (Modelos GLB individuales escalados) */}
            {tiles.map((tile, i) => {
                if (tile.type !== TILE.WALL) return null;

                // Lógica aleatoria determinista para poner antorchas (aprox 15%)
                // Usamos x/y como semilla para que sea consistente
                const pseudoRandom = Math.sin(tile.x * 12.9898 + tile.y * 78.233) * 43758.5453;
                const hasTorch = (pseudoRandom - Math.floor(pseudoRandom)) > 0.85;

                let torchProps = null;

                if (hasTorch && tile.isVisible) {
                    // Buscar una pared libre para pegar la antorcha
                    // Prioridad: Sur, Norte, Este, Oeste
                    if (map[tile.y + 1]?.[tile.x] !== TILE.WALL) {
                        torchProps = { position: [0, 1, 0.55], rotation: [0, 0, 0] }; // Sur
                    } else if (map[tile.y - 1]?.[tile.x] !== TILE.WALL) {
                        torchProps = { position: [0, 1, -0.55], rotation: [0, Math.PI, 0] }; // Norte
                    } else if (map[tile.y]?.[tile.x + 1] !== TILE.WALL) {
                        torchProps = { position: [0.55, 1, 0], rotation: [0, -Math.PI / 2, 0] }; // Este
                    } else if (map[tile.y]?.[tile.x - 1] !== TILE.WALL) {
                        torchProps = { position: [-0.55, 1, 0], rotation: [0, Math.PI / 2, 0] }; // Oeste
                    }
                }

                return (
                    <group key={`wall-group-${i}`} position={[tile.x, 0, tile.y]}>
                        <WallModel
                            scale={[1, 1, 1]}
                            rotation={[0, (tile.x + tile.y) % 2 === 0 ? 0 : Math.PI, 0]}
                        />
                        {torchProps && (
                            <TorchModel
                                position={torchProps.position}
                                rotation={torchProps.rotation}
                                scale={[2, 2, 2]} // Escala ajustada visualmente
                            />
                        )}
                    </group>
                );
            })}
        </group>
    );
}
