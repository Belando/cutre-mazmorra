import React, { useRef, useEffect } from 'react';
import { drawPlayer } from '@/renderer/player';
import { PLAYER_APPEARANCES } from '@/components/ui/CharacterSelect';

interface PlayerSpriteProps {
    size?: number;
    appearance?: any;
    playerClass?: string | null;
}

export default function PlayerSprite({ size = 32, appearance = null, playerClass = null }: PlayerSpriteProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, size, size);

        let appData = appearance;
        if (typeof appearance === 'string') {
            appData = (PLAYER_APPEARANCES as any)[appearance];
        }

        if (!appData) {
            appData = { colors: { tunic: '#3b82f6', hair: '#8b5a2b', skin: '#fcd5b8' }, class: 'warrior' };
        }

        const cls = playerClass || appData.class || 'warrior';

        drawPlayer(ctx, 0, 0, size, appData, cls, 0);

    }, [size, appearance, playerClass]);

    return <canvas ref={canvasRef} width={size} height={size} />;
}
