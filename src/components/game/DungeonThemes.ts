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
    crypt: {
        name: 'Cripta Antigua',
        wall: '#1f1f1f',
        wallDetail: '#2a2a2a',
        floor: '#171717',
        floorDetail: '#1c1c1c',
        ambient: 'rgba(80, 80, 100, 0.15)',
        fogColor: 'rgba(40, 40, 50, 0.4)',
    },
    volcanic: {
        name: 'Cavernas Volcánicas',
        wall: '#2d1810',
        wallDetail: '#3d2015',
        floor: '#1a0f0a',
        floorDetail: '#251510',
        ambient: 'rgba(255, 80, 20, 0.15)',
        fogColor: 'rgba(60, 20, 10, 0.3)',
        lavaGlow: true,
    },
    inferno: {
        name: 'Infierno',
        wall: '#1a0505',
        wallDetail: '#2d0a0a',
        floor: '#0d0202',
        floorDetail: '#150505',
        ambient: 'rgba(255, 50, 0, 0.2)',
        fogColor: 'rgba(80, 10, 0, 0.4)',
        lavaGlow: true,
        embers: true,
    },
};

export function getThemeForFloor(floor: number): DungeonTheme {
    if (floor <= 2) return DUNGEON_THEMES.stone;
    if (floor <= 4) return DUNGEON_THEMES.crypt;
    if (floor <= 6) return DUNGEON_THEMES.volcanic;
    return DUNGEON_THEMES.inferno;
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

    if (floor <= 2) {
        ctx.fillStyle = 'rgba(200, 200, 200, 0.15)';
        for (let i = 0; i < 20; i++) {
            const x = (i * 83 + frame * 0.2 + Math.sin(frame * 0.01 + i) * 20) % canvasWidth;
            const y = (i * 47 + frame * 0.1 + Math.cos(frame * 0.01 + i) * 20) % canvasHeight;
            const size = (i % 3) + 1;
            ctx.fillRect(x, y, size, size);
        }
    } else if (floor <= 4) {
        ctx.fillStyle = 'rgba(100, 255, 150, 0.1)';
        for (let i = 0; i < 15; i++) {
            const x = (i * 123 + Math.sin(frame * 0.02 + i) * 50) % canvasWidth;
            const y = (canvasHeight - (frame * 0.5 + i * 30) % canvasHeight);
            ctx.beginPath();
            ctx.arc(x, y, 2 + (i % 2), 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (theme.embers) {
        ctx.fillStyle = '#f59e0b';
        for (let i = 0; i < 12; i++) {
            const x = (frame * (i * 0.2 + 0.5) + i * 100) % canvasWidth;
            const y = canvasHeight - ((frame * (i * 0.3 + 0.5) + i * 50) % canvasHeight);
            const size = 1 + (i % 2);
            ctx.globalAlpha = 0.6 + (Math.sin(frame * 0.1 + i) * 0.4);
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}

function adjustBrightness(hex: string, amount: number) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}
