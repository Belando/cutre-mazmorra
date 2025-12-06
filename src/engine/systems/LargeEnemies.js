// Large enemy definitions and rendering
import { LARGE_ENEMIES } from '@/data/enemies';
// Enemies that occupy multiple tiles

// Check if enemy is large
export function isLargeEnemy(enemyType) {
  return LARGE_ENEMIES[enemyType] !== undefined;
}

// Get enemy size info
export function getEnemySize(enemyType) {
  return LARGE_ENEMIES[enemyType] || { width: 1, height: 1, scale: 1 };
}

// Draw large enemy sprite (2x2 boss)
export function drawLargeBossSprite(ctx, spriteName, x, y, tileSize, frame = 0) {
  const s = tileSize * 2; // Double size
  
  switch (spriteName) {
    case 'ancient_dragon':
      drawAncientDragonLarge(ctx, x, y, s, frame);
      break;
    case 'demon_lord':
      drawDemonLordLarge(ctx, x, y, s, frame);
      break;
    case 'golem_king':
      drawGolemKingLarge(ctx, x, y, s, frame);
      break;
    default:
      // Fallback
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x, y, s, s);
  }
}

function drawAncientDragonLarge(ctx, x, y, size, frame) {
  const s = size;
  
  // Wing animation
  const wingFlap = Math.sin(frame * 0.1) * 0.05;
  
  // Body
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.ellipse(x + s*0.5, y + s*0.55, s*0.35, s*0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Neck
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.moveTo(x + s*0.35, y + s*0.4);
  ctx.quadraticCurveTo(x + s*0.2, y + s*0.25, x + s*0.3, y + s*0.15);
  ctx.lineTo(x + s*0.45, y + s*0.2);
  ctx.quadraticCurveTo(x + s*0.35, y + s*0.3, x + s*0.4, y + s*0.4);
  ctx.fill();
  
  // Head
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.ellipse(x + s*0.28, y + s*0.12, s*0.12, s*0.08, -0.3, 0, Math.PI * 2);
  ctx.fill();
  
  // Horns
  ctx.fillStyle = '#78350f';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x + s*(0.2 + i*0.05), y + s*0.08);
    ctx.lineTo(x + s*(0.22 + i*0.05), y + s*(-0.02 + i*0.01));
    ctx.lineTo(x + s*(0.26 + i*0.05), y + s*0.06);
    ctx.fill();
  }
  
  // Eyes (glowing)
  ctx.fillStyle = '#ef4444';
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 10;
  ctx.fillRect(x + s*0.22, y + s*0.1, s*0.04, s*0.03);
  ctx.fillRect(x + s*0.3, y + s*0.09, s*0.04, s*0.03);
  ctx.shadowBlur = 0;
  
  // Wings
  ctx.fillStyle = '#b45309';
  // Left wing
  ctx.beginPath();
  ctx.moveTo(x + s*0.3, y + s*0.45);
  ctx.quadraticCurveTo(x - s*0.1, y + s*(0.15 + wingFlap), x + s*0.05, y + s*0.4);
  ctx.quadraticCurveTo(x - s*0.05, y + s*(0.25 + wingFlap), x + s*0.15, y + s*0.45);
  ctx.quadraticCurveTo(x + s*0.0, y + s*(0.35 + wingFlap), x + s*0.25, y + s*0.5);
  ctx.fill();
  // Right wing
  ctx.beginPath();
  ctx.moveTo(x + s*0.7, y + s*0.45);
  ctx.quadraticCurveTo(x + s*1.1, y + s*(0.15 - wingFlap), x + s*0.95, y + s*0.4);
  ctx.quadraticCurveTo(x + s*1.05, y + s*(0.25 - wingFlap), x + s*0.85, y + s*0.45);
  ctx.quadraticCurveTo(x + s*1.0, y + s*(0.35 - wingFlap), x + s*0.75, y + s*0.5);
  ctx.fill();
  
  // Tail
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.moveTo(x + s*0.7, y + s*0.6);
  ctx.quadraticCurveTo(x + s*0.95, y + s*0.7, x + s*0.9, y + s*0.85);
  ctx.lineTo(x + s*0.85, y + s*0.82);
  ctx.quadraticCurveTo(x + s*0.88, y + s*0.68, x + s*0.65, y + s*0.58);
  ctx.fill();
  
  // Tail spikes
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.moveTo(x + s*0.88, y + s*0.84);
  ctx.lineTo(x + s*0.95, y + s*0.9);
  ctx.lineTo(x + s*0.85, y + s*0.88);
  ctx.fill();
  
  // Legs
  ctx.fillStyle = '#b45309';
  ctx.fillRect(x + s*0.3, y + s*0.7, s*0.1, s*0.2);
  ctx.fillRect(x + s*0.55, y + s*0.7, s*0.1, s*0.2);
  
  // Claws
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(x + s*0.28, y + s*0.88, s*0.14, s*0.05);
  ctx.fillRect(x + s*0.53, y + s*0.88, s*0.14, s*0.05);
  
  // Fire breath glow
  if (frame % 60 < 30) {
    ctx.fillStyle = 'rgba(251, 146, 60, 0.4)';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.ellipse(x + s*0.15, y + s*0.18, s*0.08, s*0.04, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function drawDemonLordLarge(ctx, x, y, size, frame) {
  const s = size;
  
  // Body
  ctx.fillStyle = '#7f1d1d';
  ctx.fillRect(x + s*0.25, y + s*0.35, s*0.5, s*0.45);
  
  // Head
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(x + s*0.5, y + s*0.28, s*0.18, 0, Math.PI * 2);
  ctx.fill();
  
  // Horns (large, curved)
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.moveTo(x + s*0.32, y + s*0.2);
  ctx.quadraticCurveTo(x + s*0.15, y + s*0.0, x + s*0.1, y + s*0.15);
  ctx.lineTo(x + s*0.18, y + s*0.18);
  ctx.quadraticCurveTo(x + s*0.22, y + s*0.08, x + s*0.36, y + s*0.22);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + s*0.68, y + s*0.2);
  ctx.quadraticCurveTo(x + s*0.85, y + s*0.0, x + s*0.9, y + s*0.15);
  ctx.lineTo(x + s*0.82, y + s*0.18);
  ctx.quadraticCurveTo(x + s*0.78, y + s*0.08, x + s*0.64, y + s*0.22);
  ctx.fill();
  
  // Glowing eyes
  ctx.fillStyle = '#fbbf24';
  ctx.shadowColor = '#fbbf24';
  ctx.shadowBlur = 12;
  ctx.fillRect(x + s*0.4, y + s*0.24, s*0.07, s*0.06);
  ctx.fillRect(x + s*0.53, y + s*0.24, s*0.07, s*0.06);
  ctx.shadowBlur = 0;
  
  // Wings (demonic)
  ctx.fillStyle = '#450a0a';
  // Left wing
  ctx.beginPath();
  ctx.moveTo(x + s*0.25, y + s*0.4);
  ctx.lineTo(x - s*0.1, y + s*0.1);
  ctx.lineTo(x + s*0.0, y + s*0.25);
  ctx.lineTo(x - s*0.05, y + s*0.35);
  ctx.lineTo(x + s*0.1, y + s*0.45);
  ctx.lineTo(x + s*0.05, y + s*0.55);
  ctx.lineTo(x + s*0.2, y + s*0.5);
  ctx.fill();
  // Right wing
  ctx.beginPath();
  ctx.moveTo(x + s*0.75, y + s*0.4);
  ctx.lineTo(x + s*1.1, y + s*0.1);
  ctx.lineTo(x + s*1.0, y + s*0.25);
  ctx.lineTo(x + s*1.05, y + s*0.35);
  ctx.lineTo(x + s*0.9, y + s*0.45);
  ctx.lineTo(x + s*0.95, y + s*0.55);
  ctx.lineTo(x + s*0.8, y + s*0.5);
  ctx.fill();
  
  // Flame aura
  if (frame % 10 < 5) {
    ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(x + s*0.5, y + s*0.5, s*0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  
  // Legs
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(x + s*0.3, y + s*0.75, s*0.12, s*0.18);
  ctx.fillRect(x + s*0.58, y + s*0.75, s*0.12, s*0.18);
  
  // Hooves
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(x + s*0.28, y + s*0.9, s*0.16, s*0.06);
  ctx.fillRect(x + s*0.56, y + s*0.9, s*0.16, s*0.06);
}

function drawGolemKingLarge(ctx, x, y, size, frame) {
  const s = size;
  
  // Body (massive)
  ctx.fillStyle = '#44403c';
  ctx.fillRect(x + s*0.2, y + s*0.35, s*0.6, s*0.5);
  
  // Head
  ctx.fillStyle = '#57534e';
  ctx.beginPath();
  ctx.arc(x + s*0.5, y + s*0.28, s*0.2, 0, Math.PI * 2);
  ctx.fill();
  
  // Crown
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.moveTo(x + s*0.3, y + s*0.15);
  ctx.lineTo(x + s*0.35, y + s*0.02);
  ctx.lineTo(x + s*0.42, y + s*0.1);
  ctx.lineTo(x + s*0.5, y + s*0.0);
  ctx.lineTo(x + s*0.58, y + s*0.1);
  ctx.lineTo(x + s*0.65, y + s*0.02);
  ctx.lineTo(x + s*0.7, y + s*0.15);
  ctx.closePath();
  ctx.fill();
  
  // Gem in crown
  ctx.fillStyle = '#dc2626';
  ctx.shadowColor = '#dc2626';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(x + s*0.5, y + s*0.08, s*0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // Glowing eyes
  ctx.fillStyle = '#22d3ee';
  ctx.shadowColor = '#22d3ee';
  ctx.shadowBlur = 12;
  ctx.fillRect(x + s*0.38, y + s*0.24, s*0.08, s*0.08);
  ctx.fillRect(x + s*0.54, y + s*0.24, s*0.08, s*0.08);
  ctx.shadowBlur = 0;
  
  // Rune lines on body
  ctx.strokeStyle = '#22d3ee';
  ctx.shadowColor = '#22d3ee';
  ctx.shadowBlur = 6;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + s*0.35, y + s*0.45);
  ctx.lineTo(x + s*0.5, y + s*0.55);
  ctx.lineTo(x + s*0.65, y + s*0.45);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + s*0.5, y + s*0.55);
  ctx.lineTo(x + s*0.5, y + s*0.75);
  ctx.stroke();
  ctx.shadowBlur = 0;
  
  // Arms (massive)
  ctx.fillStyle = '#57534e';
  ctx.fillRect(x + s*0.02, y + s*0.38, s*0.2, s*0.18);
  ctx.fillRect(x + s*0.78, y + s*0.38, s*0.2, s*0.18);
  
  // Fists
  ctx.fillStyle = '#44403c';
  ctx.beginPath();
  ctx.arc(x + s*0.05, y + s*0.56, s*0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + s*0.95, y + s*0.56, s*0.1, 0, Math.PI * 2);
  ctx.fill();
  
  // Legs
  ctx.fillStyle = '#44403c';
  ctx.fillRect(x + s*0.25, y + s*0.8, s*0.18, s*0.15);
  ctx.fillRect(x + s*0.57, y + s*0.8, s*0.18, s*0.15);
}

// NPC Sprites
export const NPC_SPRITES = {
  merchant: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Robe
      ctx.fillStyle = '#854d0e';
      ctx.beginPath();
      ctx.moveTo(x + s*0.5, y + s*0.25);
      ctx.lineTo(x + s*0.8, y + s*0.9);
      ctx.lineTo(x + s*0.2, y + s*0.9);
      ctx.closePath();
      ctx.fill();
      // Face
      ctx.fillStyle = '#d4a574';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.28, s*0.14, 0, Math.PI * 2);
      ctx.fill();
      // Beard
      ctx.fillStyle = '#78716c';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.38, s*0.1, s*0.08, 0, 0, Math.PI);
      ctx.fill();
      // Hat
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.2, s*0.12, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x + s*0.3, y + s*0.18, s*0.4, s*0.06);
      // Gold coin indicator
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(x + s*0.7, y + s*0.7, s*0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  quest_elder: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Robe
      ctx.fillStyle = '#1e3a5f';
      ctx.beginPath();
      ctx.moveTo(x + s*0.5, y + s*0.25);
      ctx.lineTo(x + s*0.75, y + s*0.9);
      ctx.lineTo(x + s*0.25, y + s*0.9);
      ctx.closePath();
      ctx.fill();
      // Face
      ctx.fillStyle = '#fcd5b8';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.28, s*0.14, 0, Math.PI * 2);
      ctx.fill();
      // Long white beard
      ctx.fillStyle = '#e5e5e5';
      ctx.beginPath();
      ctx.moveTo(x + s*0.35, y + s*0.35);
      ctx.quadraticCurveTo(x + s*0.5, y + s*0.7, x + s*0.65, y + s*0.35);
      ctx.fill();
      // Hood
      ctx.fillStyle = '#1e40af';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.22, s*0.16, Math.PI, Math.PI * 2);
      ctx.fill();
      // Staff
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + s*0.72, y + s*0.15, s*0.05, s*0.7);
      ctx.fillStyle = '#60a5fa';
      ctx.shadowColor = '#60a5fa';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(x + s*0.745, y + s*0.15, s*0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  },
  sage: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Mystical robe
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.moveTo(x + s*0.5, y + s*0.2);
      ctx.lineTo(x + s*0.8, y + s*0.9);
      ctx.lineTo(x + s*0.2, y + s*0.9);
      ctx.closePath();
      ctx.fill();
      // Glowing symbols
      ctx.strokeStyle = '#a855f7';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 6;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.55, s*0.12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      // Face (ethereal)
      ctx.fillStyle = '#c4b5fd';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.28, s*0.12, 0, Math.PI * 2);
      ctx.fill();
      // Eyes (glowing)
      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 8;
      ctx.fillRect(x + s*0.42, y + s*0.25, s*0.06, s*0.04);
      ctx.fillRect(x + s*0.52, y + s*0.25, s*0.06, s*0.04);
      ctx.shadowBlur = 0;
    }
  },
};

// Draw NPC sprite
export function drawNPCSprite(ctx, npcType, x, y, size) {
  if (NPC_SPRITES[npcType]) {
    NPC_SPRITES[npcType].draw(ctx, x, y, size);
  }
}