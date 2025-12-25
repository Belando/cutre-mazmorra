import { Canvas } from '@react-three/fiber';
import { GameScene } from './GameScene';
import { GameState } from '@/types';
import * as THREE from 'three';

interface Game3DViewerProps {
    gameState: GameState;
}

export default function Game3DViewer({ gameState }: Game3DViewerProps) {
    return (
        <div className="w-full h-full relative" style={{ minHeight: '600px' }}>
            <Canvas
                shadows
                dpr={[1, 2]}
                gl={{
                    antialias: true,
                    // 6️⃣ Configuración del renderer (MUY RECOMENDADO)
                    outputColorSpace: THREE.SRGBColorSpace,
                    toneMapping: THREE.ACESFilmicToneMapping,
                    toneMappingExposure: 1.0
                }}
                camera={{ position: [0, 10, 10], fov: 50 }}
            >
                <color attach="background" args={['#1a1a2e']} />
                <GameScene gameState={gameState} />
            </Canvas>
        </div>
    );
}
