// Generador de Spritesheets básicos para pruebas
// Crea DataURLs que pueden ser cargados por SpriteManager

export function createPlaceholderSprite(color: string, width = 96, height = 128): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Tira 1: Abajo (Row 0)
    // Tira 2: Izquierda (Row 1)
    // Tira 3: Derecha (Row 2)
    // Tira 4: Arriba (Row 3)

    const frameW = width / 3; // 32
    const frameH = height / 4; // 32

    const directions = ['down', 'left', 'right', 'up'];

    // Dibujar frames
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
            const x = col * frameW;
            const y = row * frameH;

            // Fondo
            ctx.fillStyle = color;
            ctx.fillRect(x + 4, y + 4, frameW - 8, frameH - 8);

            // Ojos / Cara para ver dirección
            ctx.fillStyle = 'white';

            const dir = directions[row];
            if (dir === 'down') {
                ctx.fillRect(x + 10, y + 10, 4, 4);
                ctx.fillRect(x + 18, y + 10, 4, 4);
            } else if (dir === 'up') {
                // Nada, espalda
            } else if (dir === 'left') {
                ctx.fillRect(x + 8, y + 10, 4, 4);
            } else if (dir === 'right') {
                ctx.fillRect(x + 20, y + 10, 4, 4);
            }

            // "Animación" (patas moviéndose)
            if (col === 1) { // Frame del medio (idle/paso)
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(x + 10, y + 24, 12, 4);
            } else {
                // Patas
                ctx.fillStyle = 'black';
                if (col === 0) ctx.fillRect(x + 8, y + 28, 6, 4);
                if (col === 2) ctx.fillRect(x + 18, y + 28, 6, 4);
            }
        }
    }

    return canvas.toDataURL();
}

export const ASSETS = {
    PLAYER: 'player_sheet',
    SKELETON: 'skeleton_sheet'
};

export function loadPlaceholders(spriteManager: any) {
    const playerUrl = createPlaceholderSprite('#3b82f6'); // Blue
    const skeletonUrl = createPlaceholderSprite('#ef4444'); // Red

    spriteManager.load(ASSETS.PLAYER, playerUrl);
    spriteManager.load(ASSETS.SKELETON, skeletonUrl);
}
