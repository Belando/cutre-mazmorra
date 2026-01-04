export interface DungeonTheme {
    name: string;
    wall: string;
    wallDetail: string;
    floor: string;
    floorDetail: string;
    ambient: string;
    fogColor?: string;
    lavaGlow?: boolean;
    embers?: boolean;
}

export const DUNGEON_THEMES: Record<string, DungeonTheme> = {
    stone: {
        name: 'Mazmorra de Piedra',
        wall: '#1a1a2e',
        wallDetail: '#252545',
        floor: '#16213e',
        floorDetail: '#1a1a35',
        ambient: 'rgba(100, 120, 180, 0.1)',
        fogColor: 'rgba(20, 30, 60, 0.3)',
    },
    cave: {
        name: 'Cavernas Oscuras',
        wall: '#3b2f2f', // Brownish
        wallDetail: '#4e3e3e',
        floor: '#2e2626',
        floorDetail: '#3d3232',
        ambient: 'rgba(20, 15, 10, 0.4)', // Dark/Dim
        fogColor: 'rgba(25, 20, 15, 0.6)',
        lavaGlow: false,
    },
    crypt: {
        name: 'Cripta Maldita',
        wall: '#1f2923', // Dark Greenish Grey
        wallDetail: '#2a3830',
        floor: '#17201a',
        floorDetail: '#1c2620',
        ambient: 'rgba(10, 40, 20, 0.3)', // Greenish
        fogColor: 'rgba(5, 30, 10, 0.5)',
        embers: true, // Green spirits?
    },
    lava: {
        name: 'Profundidades de Magma',
        wall: '#2d1b1b', // Reddish/Obsidian
        wallDetail: '#3d2b2b',
        floor: '#1a1010', // Dark Ash
        floorDetail: '#2a1a1a',
        ambient: 'rgba(60, 10, 5, 0.2)', // Red glow
        fogColor: 'rgba(40, 5, 0, 0.4)',
        lavaGlow: true,
        embers: true, // Fire embers
    }
};

export function getThemeForFloor(floor: number): DungeonTheme {
    if (floor <= 3) return DUNGEON_THEMES.stone;
    if (floor <= 6) return DUNGEON_THEMES.cave;
    if (floor <= 9) return DUNGEON_THEMES.crypt;
    return DUNGEON_THEMES.lava;
}

export function getThemeTileColors(floor: number) {
    const theme = getThemeForFloor(floor);
    return {
        0: theme.wall,    // WALL
        1: theme.floor,   // FLOOR
        2: theme.floor,   // STAIRS
        3: theme.wall,    // DOOR
    };
}

export function drawThemedWall(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, floor: number, isVisible: boolean) {
    const theme = getThemeForFloor(floor);
    const s = size;

    ctx.fillStyle = isVisible ? theme.wall : adjustBrightness(theme.wall, -60);
    ctx.fillRect(x, y, s, s);

    if (isVisible) {
        ctx.fillStyle = theme.wallDetail;
        ctx.fillRect(x + 2, y + 2, s - 4, s / 2 - 3);
        ctx.fillRect(x + 2, y + s / 2 + 1, s / 2 - 3, s / 2 - 3);
        ctx.fillRect(x + s / 2 + 1, y + s / 2 + 1, s / 2 - 3, s / 2 - 3);

        if ((x + y) % 7 === 0) {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + s * 0.2, y + s * 0.2);
            ctx.lineTo(x + s * 0.4, y + s * 0.4);
            ctx.stroke();
        }
    } else {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x, y, s, s);
    }
}

export function drawThemedFloor(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, floor: number, isVisible: boolean, seed: number) {
    const theme = getThemeForFloor(floor);
    const s = size;

    ctx.fillStyle = isVisible ? theme.floor : adjustBrightness(theme.floor, -60);
    ctx.fillRect(x, y, s, s);

    if (isVisible) {
        ctx.fillStyle = theme.floorDetail;
        if (seed % 3 === 0) {
            ctx.fillRect(x + s * 0.3, y + s * 0.3, 2, 2);
        }
        if (seed % 5 === 0) {
            ctx.fillRect(x + s * 0.7, y + s * 0.6, 3, 3);
        }

        // Lava Cracks?
        if (theme.lavaGlow && seed % 13 === 0) {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(x + s * 0.4, y + s * 0.4, 4, 1);
        }
    }
}

export function drawAmbientOverlay(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, floor: number, frame: number) {
    const theme = getThemeForFloor(floor);

    ctx.fillStyle = theme.ambient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    if (theme.fogColor) {
        const gradient = ctx.createRadialGradient(
            canvasWidth / 2, canvasHeight / 2, 0,
            canvasWidth / 2, canvasHeight / 2, canvasWidth * 0.7
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, theme.fogColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    if (floor <= 3) {
        // Dungeon Dust
        ctx.fillStyle = 'rgba(200, 200, 200, 0.15)';
        for (let i = 0; i < 20; i++) {
            const x = (i * 83 + frame * 0.2 + Math.sin(frame * 0.01 + i) * 20) % canvasWidth;
            const y = (i * 47 + frame * 0.1 + Math.cos(frame * 0.01 + i) * 20) % canvasHeight;
            const size = (i % 3) + 1;
            ctx.fillRect(x, y, size, size);
        }
    } else if (floor <= 6) {
        // Cave Dripping/Bats? Just heavy shadow particles
        ctx.fillStyle = 'rgba(10, 10, 10, 0.3)';
        // ctx.fill(); // Removed erroneous fill
        for (let i = 0; i < 15; i++) {
            // Falling debris
            const x = (i * 97 + Math.sin(frame * 0.01 + i) * 10) % canvasWidth;
            const y = (frame * (1 + (i % 2)) + i * 50) % canvasHeight;
            ctx.fillRect(x, y, 2, 2);
        }
    } else if (floor <= 9) {
        // Crypt Spirits (Green)
        if (theme.embers) {
            ctx.fillStyle = '#4ade80'; // Green
            for (let i = 0; i < 15; i++) {
                const x = (frame * (i * 0.2 + 0.5) + i * 100) % canvasWidth;
                const y = canvasHeight - ((frame * (i * 0.3 + 0.5) + i * 50) % canvasHeight);
                const size = 1 + (i % 2);
                ctx.globalAlpha = 0.3 + (Math.sin(frame * 0.05 + i) * 0.2);
                ctx.beginPath();
                ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }
    } else {
        // Lava / Magma (Red)
        if (theme.embers) {
            // Rising sparks
            ctx.fillStyle = '#fb923c'; // Orange-Red
            for (let i = 0; i < 25; i++) {
                // Rising faster than spirits
                const x = (Math.sin(frame * 0.02 + i) * 50 + i * 80) % canvasWidth;
                // Move UP
                const y = canvasHeight - ((frame * (1.5 + (i % 3) * 0.5) + i * 30) % canvasHeight);

                const size = (i % 2) + 1;
                ctx.globalAlpha = 0.4 + (Math.sin(frame * 0.1 + i) * 0.3);

                ctx.fillRect(x, y, size, size);
            }
            ctx.globalAlpha = 1;
        }
    }
}

function adjustBrightness(hex: string, amount: number) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}
