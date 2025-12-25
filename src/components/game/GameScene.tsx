import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import { GameState } from '@/types';
import { DungeonMap3D } from './3d/DungeonMap3D';
import * as THREE from 'three';
import { Model as TorchModel } from './3d/TorchModel';

interface GameSceneProps {
    gameState: GameState;
}

export function GameScene({ gameState }: GameSceneProps) {
    const playerRef = useRef<THREE.Group>(null);
    const controlsRef = useRef<any>(null);

    // Camera follow logic
    useFrame((_state, delta) => {
        if (playerRef.current && controlsRef.current) {
            const { x, z } = playerRef.current.position;
            const target = controlsRef.current.target;

            // Suavizado del movimiento de la cámara (Lerp)
            const speed = 5;
            target.x += (x - target.x) * delta * speed;
            target.z += (z - target.z) * delta * speed;

            controlsRef.current.update();
        }
    });

    // Validar datos antes de renderizar
    if (!gameState || !gameState.player) return null;

    const playerX = gameState.player.x;
    const playerY = gameState.player.y;

    return (
        <>
            <PerspectiveCamera makeDefault position={[playerX, 10, playerY + 8]} fov={50} />
            <OrbitControls
                ref={controlsRef}
                target={[playerX, 0, playerY]}
                enableDamping
                dampingFactor={0.1}
                maxPolarAngle={Math.PI / 2.5} // Evitar ir bajo el suelo
                minDistance={5}
                maxDistance={20}
            />

            {/* 3️⃣ Asegurar iluminación mínima (Ambient + Directional) */}
            <ambientLight intensity={0.7} />
            <directionalLight
                position={[5, 10, 5]}
                intensity={1.0}
                castShadow
                shadow-mapSize={[1024, 1024]} // Mayor resolución de sombra
                shadow-bias={-0.0001} // Evitar Shadow Acne (la rejilla extraña)
            />

            {/* Luz del jugador (Antorcha) - Movida al grupo del Jugador */}

            <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />

            <DungeonMap3D
                map={gameState.map}
                visible={gameState.visible}
                explored={gameState.explored}
            />



            {/* Jugador (Cubo Azul) */}
            <group ref={playerRef} position={[playerX, 0, playerY]}>
                <mesh position={[0, 0.75, 0]} castShadow>
                    <boxGeometry args={[0.6, 1.5, 0.6]} />
                    <meshStandardMaterial color="#3b82f6" emissive="#1d4ed8" emissiveIntensity={0.5} />
                </mesh>

                {/* Antorcha eliminada del jugador */}
            </group>

            {/* Enemigos (Cubos Rojos) */}
            {gameState.enemies.map((enemy, i) => {
                // Solo renderizar si es visible
                if (gameState.visible[enemy.y]?.[enemy.x]) {
                    return (
                        <mesh key={`enemy-${i}`} position={[enemy.x, 0.5, enemy.y]} castShadow>
                            <boxGeometry args={[0.7, 0.7, 0.7]} />
                            <meshStandardMaterial color="#ef4444" />
                        </mesh>
                    );
                }
                return null;
            })}

            <fog attach="fog" args={['#1a1a2e', 5, 25]} />
        </>
    );
}
