import React, { useRef, useEffect } from 'react';
import { drawPlayer } from '@/renderer/player'; // Importamos el renderizador central
import { PLAYER_APPEARANCES } from '@/components/ui/CharacterSelect';

export default function PlayerSprite({ size = 32, appearance = null, playerClass = null }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Limpiar canvas
    ctx.clearRect(0, 0, size, size);
    
    // Resolver la apariencia (puede venir como string 'warrior' o como objeto)
    let appData = appearance;
    if (typeof appearance === 'string') {
        appData = PLAYER_APPEARANCES[appearance];
    }
    
    // Fallback por si acaso
    if (!appData) {
         appData = { colors: { tunic: '#3b82f6', hair: '#8b5a2b', skin: '#fcd5b8' }, class: 'warrior' };
    }

    const cls = playerClass || appData.class || 'warrior';

    // Usar la función de dibujado compartida (Frame 0 para estático, o podrías animarlo)
    drawPlayer(ctx, 0, 0, size, appData, cls, 0);
    
  }, [size, appearance, playerClass]);
  
  return <canvas ref={canvasRef} width={size} height={size} />;
}