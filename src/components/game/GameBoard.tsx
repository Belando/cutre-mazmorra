import { useEffect, useRef } from 'react';
import { SIZE } from '@/data/constants';
import { animationSystem } from '@/engine/systems/AnimationSystem';
import { GameState } from '@/types';
import { GameRenderer } from '@/renderer/GameRenderer';
import { soundManager } from '@/engine/systems/SoundSystem';

interface GameBoardProps {
    gameState: GameState;
    viewportWidth?: number;
    viewportHeight?: number;
    hoveredTarget?: any;
}

export default function GameBoard({ gameState, viewportWidth = 21, viewportHeight = 15, hoveredTarget }: GameBoardProps) {
    const staticCanvasRef = useRef<HTMLCanvasElement>(null);
    const dynamicCanvasRef = useRef<HTMLCanvasElement>(null);
    const lightingCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Instantiate Renderer once
    const rendererRef = useRef<GameRenderer>(new GameRenderer());

    const lastTimeRef = useRef(0);
    const animationFrameId = useRef<number | null>(null);
    const gameStateRef = useRef(gameState);

    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // Setup Canvases on mount
    useEffect(() => {
        if (staticCanvasRef.current && dynamicCanvasRef.current && lightingCanvasRef.current) {
            rendererRef.current.setCanvases(
                staticCanvasRef.current,
                dynamicCanvasRef.current,
                lightingCanvasRef.current
            );
        }
    }, []);

    const renderGameLoop = (timestamp: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = timestamp;
        const dt = timestamp - lastTimeRef.current;
        lastTimeRef.current = timestamp;

        if (gameStateRef.current.player && animationSystem) {
            const allEntities = [gameStateRef.current.player, ...gameStateRef.current.enemies];
            animationSystem.update(dt, allEntities);
        }

        // Delegate to Renderer
        const currentState = gameStateRef.current;
        if (currentState.player) {
            // Update 3D Audio Listener
            soundManager.updateListenerPosition(currentState.player.x, currentState.player.y);

            rendererRef.current.render(
                currentState,
                viewportWidth,
                viewportHeight,
                dt,
                hoveredTarget,
                currentState.effectsManager
            );
        }

        // Handle Screen Shake (CSS Based)
        if (currentState.effectsManager && containerRef.current) {
            const shake = currentState.effectsManager.screenShake || 0;
            if (shake > 0) {
                const dx = (Math.random() - 0.5) * shake;
                const dy = (Math.random() - 0.5) * shake;
                containerRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
            } else {
                containerRef.current.style.transform = 'none';
            }
        }

        animationFrameId.current = requestAnimationFrame(renderGameLoop);
    };

    useEffect(() => {
        animationFrameId.current = requestAnimationFrame(renderGameLoop);
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [viewportWidth, viewportHeight]);

    return (
        <div ref={containerRef}
            className="relative overflow-hidden border rounded-lg shadow-2xl border-slate-700/50"
            style={{ width: viewportWidth * SIZE, height: viewportHeight * SIZE }}>

            <canvas
                ref={staticCanvasRef}
                width={viewportWidth * SIZE}
                height={viewportHeight * SIZE}
                className="absolute top-0 left-0 z-0"
            />

            <canvas
                ref={dynamicCanvasRef}
                width={viewportWidth * SIZE}
                height={viewportHeight * SIZE}
                className="absolute top-0 left-0 z-10"
            />

            <canvas
                ref={lightingCanvasRef}
                width={viewportWidth * SIZE}
                height={viewportHeight * SIZE}
                className="absolute top-0 left-0 z-20 pointer-events-none mix-blend-soft-light"
            />
        </div>
    );
}
