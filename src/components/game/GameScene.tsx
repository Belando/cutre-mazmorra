import { useRef, RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import { GameState } from '@/types';
import { DungeonMap3D } from './3d/DungeonMap3D';
import * as THREE from 'three';
import { Model as TorchModel } from './3d/TorchModel';

interface GameSceneProps {
    gameState: GameState;
    cameraAngleRef?: RefObject<number>;
}

export function GameScene({ gameState, cameraAngleRef }: GameSceneProps) {
    const playerRef = useRef<THREE.Group>(null);
    const controlsRef = useRef<any>(null);

    // Camera follow logic
    useFrame((state, delta) => {
        if (playerRef.current && controlsRef.current) {
            const { x, z } = playerRef.current.position;
            const target = controlsRef.current.target;
            const camera = state.camera;

            // Desired target position (smoothly interpolate ONLY the target to avoid jitter)
            // But we need to move the camera by the SAME amount the target moves
            // otherwise the camera pivots.

            const prevTargetX = target.x;
            const prevTargetZ = target.z;

            // Lerp target to player position
            const speed = 5;
            const lerpFactor = speed * delta;

            // We calculate the delta required to reach player
            // But doing it directly on target allows OrbitControls to handle rotation
            target.x += (x - target.x) * lerpFactor;
            target.z += (z - target.z) * lerpFactor;

            // Calculate how much the target moved this frame
            const moveX = target.x - prevTargetX;
            const moveZ = target.z - prevTargetZ;

            // Apply SAME movement to camera position to keep relative offset constant
            camera.position.x += moveX;
            camera.position.z += moveZ;

            controlsRef.current.update();

            // Update camera angle for relative movement
            // We use getAzimuthalAngle() which returns angle in radians
            if (cameraAngleRef) {
                // @ts-ignore - controlsRef.current might be generic
                if (typeof controlsRef.current.getAzimuthalAngle === 'function') {
                    // @ts-ignore
                    (cameraAngleRef as any).current = controlsRef.current.getAzimuthalAngle();
                }
            }
        }
    });

    // Validar datos antes de renderizar
    if (!gameState || !gameState.player) return null;

    const playerX = gameState.player.x;
    const playerY = gameState.player.y;

    // Use Memo to set initial camera position ONLY ONCE when the component mounts (or player first appears)
    // This prevents the camera from snapping back to default offset on every render
    const initialPos = useRef({ x: playerX, y: playerY });

    return (
        <>
            <PerspectiveCamera makeDefault position={[initialPos.current.x, 10, initialPos.current.y + 8]} fov={50} />
            <OrbitControls
                ref={controlsRef}
                target={[initialPos.current.x, 0, initialPos.current.y]}
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
                intensity={0.8}
                castShadow
                shadow-mapSize={[1024, 1024]}
                shadow-camera-left={-20}
                shadow-camera-right={20}
                shadow-camera-top={20}
                shadow-camera-bottom={-20}
                shadow-bias={-0.0005}
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
