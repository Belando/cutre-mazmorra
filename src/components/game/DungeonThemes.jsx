// Dungeon visual themes based on floor level

export const DUNGEON_THEMES = {
  // Floors 1-2: Stone Dungeon
  stone: {
    name: 'Mazmorra de Piedra',
    wall: '#1a1a2e',
    wallDetail: '#252545',
    floor: '#16213e',
    floorDetail: '#1a1a35',
    ambient: 'rgba(100, 120, 180, 0.1)',
    fogColor: 'rgba(20, 30, 60, 0.3)',
  },
  // Floors 3-4: Crypt
  crypt: {
    name: 'Cripta Antigua',
    wall: '#1f1f1f',
    wallDetail: '#2a2a2a',
    floor: '#171717',
    floorDetail: '#1c1c1c',
    ambient: 'rgba(80, 80, 100, 0.15)',
    fogColor: 'rgba(40, 40, 50, 0.4)',
  },
  // Floors 5-6: Volcanic Caves
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
  // Floor 7+: Inferno / Dragon's Lair
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

// Get theme for a specific floor
export function getThemeForFloor(floor) {
  if (floor <= 2) return DUNGEON_THEMES.stone;
  if (floor <= 4) return DUNGEON_THEMES.crypt;
  if (floor <= 6) return DUNGEON_THEMES.volcanic;
  return DUNGEON_THEMES.inferno;
}

// Get tile colors based on theme
export function getThemeTileColors(floor) {
  const theme = getThemeForFloor(floor);
  return {
    0: theme.wall,    // WALL
    1: theme.floor,   // FLOOR
    2: theme.floor,   // STAIRS
    3: theme.wall,    // DOOR
  };
}

// Draw themed wall with details
export function drawThemedWall(ctx, x, y, size, floor, isVisible) {
  const theme = getThemeForFloor(floor);
  const s = size;
  
  // Base wall
  ctx.fillStyle = isVisible ? theme.wall : adjustBrightness(theme.wall, -40);
  ctx.fillRect(x, y, s, s);
  
  // Wall detail
  ctx.fillStyle = isVisible ? theme.wallDetail : adjustBrightness(theme.wallDetail, -40);
  ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
  
  if (isVisible) {
    // Brick pattern
    ctx.fillStyle = theme.wall;
    ctx.fillRect(x + 4, y + 6, s - 10, 2);
    ctx.fillRect(x + 4, y + 14, s - 10, 2);
    ctx.fillRect(x + s/2 - 1, y + 2, 2, 5);
    ctx.fillRect(x + s/2 - 1, y + 15, 2, 5);
    
    // Volcanic/Inferno cracks with glow
    if (theme.lavaGlow && Math.random() < 0.15) {
      ctx.strokeStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 4;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + s*0.3, y + s*0.2);
      ctx.lineTo(x + s*0.5, y + s*0.5);
      ctx.lineTo(x + s*0.4, y + s*0.8);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }
}

// Draw themed floor with details
export function drawThemedFloor(ctx, x, y, size, floor, isVisible, seed) {
  const theme = getThemeForFloor(floor);
  const s = size;
  
  // Base floor
  ctx.fillStyle = isVisible ? theme.floor : adjustBrightness(theme.floor, -40);
  ctx.fillRect(x, y, s, s);
  
  if (isVisible) {
    // Floor texture
    ctx.fillStyle = theme.floorDetail;
    if (seed % 2 === 0) {
      ctx.fillRect(x + 10, y + 10, 4, 4);
    }
    
    // Volcanic lava pools
    if (theme.lavaGlow && seed % 20 < 2) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.6, s*0.3, s*0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    
    // Embers in inferno
    if (theme.embers && seed % 30 < 3) {
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 4;
      for (let i = 0; i < 3; i++) {
        const ex = x + s*(0.2 + (seed * i) % 60 / 100);
        const ey = y + s*(0.3 + (seed * i * 2) % 50 / 100);
        ctx.beginPath();
        ctx.arc(ex, ey, 1 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
  }
}

// Draw ambient effect overlay
export function drawAmbientOverlay(ctx, canvasWidth, canvasHeight, floor, frame) {
  const theme = getThemeForFloor(floor);
  
  // Ambient glow
  ctx.fillStyle = theme.ambient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // Fog effect
  if (theme.fogColor) {
    const gradient = ctx.createRadialGradient(
      canvasWidth/2, canvasHeight/2, 0,
      canvasWidth/2, canvasHeight/2, canvasWidth * 0.6
    );
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, theme.fogColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }
  
  // Floating embers for volcanic/inferno
  if (theme.embers) {
    ctx.fillStyle = '#f59e0b';
    for (let i = 0; i < 8; i++) {
      const x = (frame * (i + 1) * 0.5 + i * 100) % canvasWidth;
      const y = canvasHeight - ((frame * (i + 1) * 0.3 + i * 50) % canvasHeight);
      const size = 1 + (i % 2);
      ctx.globalAlpha = 0.4 + (Math.sin(frame * 0.1 + i) * 0.3);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

function adjustBrightness(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}