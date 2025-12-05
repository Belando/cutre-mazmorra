import { ENEMY_STATS } from '@/data/enemies';

// Normal enemies and bosses drawing logic
const SPRITES = {
  rat: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Body - brown furry
      ctx.fillStyle = '#78716c';
      ctx.beginPath();
      ctx.ellipse(x + s*0.45, y + s*0.55, s*0.28, s*0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.fillStyle = '#a8a29e';
      ctx.beginPath();
      ctx.ellipse(x + s*0.72, y + s*0.52, s*0.14, s*0.12, 0.2, 0, Math.PI * 2);
      ctx.fill();
      // Ears
      ctx.fillStyle = '#fecaca';
      ctx.beginPath();
      ctx.arc(x + s*0.78, y + s*0.42, s*0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.68, y + s*0.42, s*0.05, 0, Math.PI * 2);
      ctx.fill();
      // Eye
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(x + s*0.76, y + s*0.5, s*0.03, 0, Math.PI * 2);
      ctx.fill();
      // Nose
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(x + s*0.84, y + s*0.54, s*0.025, 0, Math.PI * 2);
      ctx.fill();
      // Tail
      ctx.strokeStyle = '#a8a29e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + s*0.18, y + s*0.55);
      ctx.quadraticCurveTo(x + s*0.05, y + s*0.5, x + s*0.08, y + s*0.7);
      ctx.stroke();
      // Legs
      ctx.fillStyle = '#78716c';
      ctx.fillRect(x + s*0.3, y + s*0.68, s*0.08, s*0.12);
      ctx.fillRect(x + s*0.55, y + s*0.68, s*0.08, s*0.12);
    }
  },
  bat: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Wings spread
      ctx.fillStyle = '#27272a';
      // Left wing
      ctx.beginPath();
      ctx.moveTo(x + s*0.38, y + s*0.5);
      ctx.quadraticCurveTo(x + s*0.15, y + s*0.25, x + s*0.05, y + s*0.35);
      ctx.quadraticCurveTo(x + s*0.1, y + s*0.45, x + s*0.15, y + s*0.55);
      ctx.quadraticCurveTo(x + s*0.25, y + s*0.5, x + s*0.38, y + s*0.55);
      ctx.fill();
      // Right wing
      ctx.beginPath();
      ctx.moveTo(x + s*0.62, y + s*0.5);
      ctx.quadraticCurveTo(x + s*0.85, y + s*0.25, x + s*0.95, y + s*0.35);
      ctx.quadraticCurveTo(x + s*0.9, y + s*0.45, x + s*0.85, y + s*0.55);
      ctx.quadraticCurveTo(x + s*0.75, y + s*0.5, x + s*0.62, y + s*0.55);
      ctx.fill();
      // Body
      ctx.fillStyle = '#3f3f46';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.52, s*0.14, s*0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.fillStyle = '#52525b';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.38, s*0.1, 0, Math.PI * 2);
      ctx.fill();
      // Ears
      ctx.fillStyle = '#3f3f46';
      ctx.beginPath();
      ctx.moveTo(x + s*0.4, y + s*0.35);
      ctx.lineTo(x + s*0.35, y + s*0.2);
      ctx.lineTo(x + s*0.45, y + s*0.32);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.6, y + s*0.35);
      ctx.lineTo(x + s*0.65, y + s*0.2);
      ctx.lineTo(x + s*0.55, y + s*0.32);
      ctx.fill();
      // Eyes - red glowing
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(x + s*0.44, y + s*0.36, s*0.03, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.56, y + s*0.36, s*0.03, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  },
  skeleton: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Skull
      ctx.fillStyle = '#f5f5f4';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.22, s*0.16, 0, Math.PI * 2);
      ctx.fill();
      // Eye sockets
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.ellipse(x + s*0.42, y + s*0.2, s*0.05, s*0.06, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + s*0.58, y + s*0.2, s*0.05, s*0.06, 0, 0, Math.PI * 2);
      ctx.fill();
      // Nose hole
      ctx.beginPath();
      ctx.moveTo(x + s*0.5, y + s*0.26);
      ctx.lineTo(x + s*0.46, y + s*0.3);
      ctx.lineTo(x + s*0.54, y + s*0.3);
      ctx.closePath();
      ctx.fill();
      // Teeth
      ctx.fillStyle = '#f5f5f4';
      ctx.fillRect(x + s*0.4, y + s*0.32, s*0.2, s*0.06);
      ctx.fillStyle = '#1c1917';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(x + s*0.42 + i*s*0.045, y + s*0.33, s*0.02, s*0.04);
      }
      // Spine and ribs
      ctx.fillStyle = '#e7e5e4';
      ctx.fillRect(x + s*0.47, y + s*0.38, s*0.06, s*0.32);
      // Ribs
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + s*0.47, y + s*0.42 + i*s*0.1);
        ctx.quadraticCurveTo(x + s*0.3, y + s*0.44 + i*s*0.1, x + s*0.28, y + s*0.48 + i*s*0.1);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#e7e5e4';
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + s*0.53, y + s*0.42 + i*s*0.1);
        ctx.quadraticCurveTo(x + s*0.7, y + s*0.44 + i*s*0.1, x + s*0.72, y + s*0.48 + i*s*0.1);
        ctx.stroke();
      }
      // Pelvis
      ctx.fillStyle = '#e7e5e4';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.72, s*0.14, s*0.06, 0, 0, Math.PI * 2);
      ctx.fill();
      // Legs
      ctx.fillRect(x + s*0.38, y + s*0.75, s*0.05, s*0.18);
      ctx.fillRect(x + s*0.57, y + s*0.75, s*0.05, s*0.18);
      // Arms
      ctx.fillRect(x + s*0.25, y + s*0.42, s*0.05, s*0.22);
      ctx.fillRect(x + s*0.7, y + s*0.42, s*0.05, s*0.22);
    }
  },
  spider: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Abdomen - big and hairy
      ctx.fillStyle = '#3b0764';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.6, s*0.22, s*0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      // Fur texture
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.arc(x + s*0.45, y + s*0.55, s*0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.55, y + s*0.58, s*0.05, 0, Math.PI * 2);
      ctx.fill();
      // Cephalothorax
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.38, s*0.14, s*0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      // Eyes - multiple red eyes
      ctx.fillStyle = '#dc2626';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.arc(x + s*0.44, y + s*0.34, s*0.025, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.56, y + s*0.34, s*0.025, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.48, y + s*0.32, s*0.02, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.52, y + s*0.32, s*0.02, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Fangs
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(x + s*0.46, y + s*0.42);
      ctx.lineTo(x + s*0.44, y + s*0.5);
      ctx.lineTo(x + s*0.48, y + s*0.44);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.54, y + s*0.42);
      ctx.lineTo(x + s*0.56, y + s*0.5);
      ctx.lineTo(x + s*0.52, y + s*0.44);
      ctx.fill();
      // Legs - 8 articulated legs
      ctx.strokeStyle = '#581c87';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const yOffset = i * s * 0.06;
        // Left legs
        ctx.beginPath();
        ctx.moveTo(x + s*0.36, y + s*0.4 + yOffset);
        ctx.lineTo(x + s*0.15, y + s*0.25 + yOffset);
        ctx.lineTo(x + s*0.05, y + s*0.35 + yOffset);
        ctx.stroke();
        // Right legs
        ctx.beginPath();
        ctx.moveTo(x + s*0.64, y + s*0.4 + yOffset);
        ctx.lineTo(x + s*0.85, y + s*0.25 + yOffset);
        ctx.lineTo(x + s*0.95, y + s*0.35 + yOffset);
        ctx.stroke();
      }
    }
  },
  zombie: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Tattered clothes
      ctx.fillStyle = '#52525b';
      ctx.fillRect(x + s*0.28, y + s*0.38, s*0.44, s*0.38);
      // Tears in clothes
      ctx.fillStyle = '#3b0764';
      ctx.fillRect(x + s*0.32, y + s*0.5, s*0.08, s*0.12);
      ctx.fillRect(x + s*0.6, y + s*0.45, s*0.06, s*0.1);
      // Green rotting skin
      ctx.fillStyle = '#4d7c0f';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.26, s*0.18, 0, Math.PI * 2);
      ctx.fill();
      // Decayed patches
      ctx.fillStyle = '#365314';
      ctx.beginPath();
      ctx.arc(x + s*0.58, y + s*0.22, s*0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.42, y + s*0.3, s*0.04, 0, Math.PI * 2);
      ctx.fill();
      // Eyes - one normal, one droopy
      ctx.fillStyle = '#fef9c3';
      ctx.fillRect(x + s*0.38, y + s*0.22, s*0.09, s*0.07);
      ctx.fillRect(x + s*0.53, y + s*0.24, s*0.09, s*0.06);
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(x + s*0.4, y + s*0.24, s*0.04, s*0.04);
      ctx.fillRect(x + s*0.56, y + s*0.25, s*0.04, s*0.04);
      // Mouth - groaning
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(x + s*0.42, y + s*0.34, s*0.16, s*0.04);
      // Arms reaching forward
      ctx.fillStyle = '#4d7c0f';
      ctx.save();
      ctx.translate(x + s*0.25, y + s*0.45);
      ctx.rotate(-0.5);
      ctx.fillRect(0, 0, s*0.28, s*0.08);
      ctx.restore();
      ctx.save();
      ctx.translate(x + s*0.72, y + s*0.42);
      ctx.rotate(0.3);
      ctx.fillRect(-s*0.05, 0, s*0.28, s*0.08);
      ctx.restore();
      // Legs
      ctx.fillStyle = '#52525b';
      ctx.fillRect(x + s*0.32, y + s*0.74, s*0.12, s*0.18);
      ctx.fillRect(x + s*0.56, y + s*0.74, s*0.12, s*0.18);
    }
  },
  wraith: {
    draw: (ctx, x, y, size) => {
      const s = size;
      const gradient = ctx.createLinearGradient(x, y, x, y + s);
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.9)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.1)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(x + s*0.5, y + s*0.1);
      ctx.quadraticCurveTo(x + s*0.8, y + s*0.3, x + s*0.75, y + s*0.9);
      ctx.lineTo(x + s*0.25, y + s*0.9);
      ctx.quadraticCurveTo(x + s*0.2, y + s*0.3, x + s*0.5, y + s*0.1);
      ctx.fill();
      ctx.fillStyle = '#c7d2fe';
      ctx.shadowColor = '#c7d2fe';
      ctx.shadowBlur = 8;
      ctx.fillRect(x + s*0.35, y + s*0.25, s*0.08, s*0.06);
      ctx.fillRect(x + s*0.57, y + s*0.25, s*0.08, s*0.06);
      ctx.shadowBlur = 0;
    }
  },
  dragon: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#b45309';
      ctx.fillRect(x + s*0.3, y + s*0.4, s*0.4, s*0.35);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(x + s*0.55, y + s*0.32, s*0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(x + s*0.45, y + s*0.2);
      ctx.lineTo(x + s*0.35, y + s*0.05);
      ctx.lineTo(x + s*0.5, y + s*0.15);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.65, y + s*0.2);
      ctx.lineTo(x + s*0.75, y + s*0.05);
      ctx.lineTo(x + s*0.6, y + s*0.15);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 4;
      ctx.fillRect(x + s*0.48, y + s*0.28, s*0.06, s*0.05);
      ctx.fillRect(x + s*0.58, y + s*0.28, s*0.06, s*0.05);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.moveTo(x + s*0.2, y + s*0.45);
      ctx.lineTo(x - s*0.05, y + s*0.25);
      ctx.lineTo(x + s*0.1, y + s*0.55);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.8, y + s*0.45);
      ctx.lineTo(x + s*1.05, y + s*0.25);
      ctx.lineTo(x + s*0.9, y + s*0.55);
      ctx.fill();
    }
  },
  goblin_king: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#166534';
      ctx.fillRect(x + s*0.25, y + s*0.35, s*0.5, s*0.4);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.25, s*0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(x + s*0.3, y + s*0.15);
      ctx.lineTo(x + s*0.35, y + s*0.0);
      ctx.lineTo(x + s*0.45, y + s*0.1);
      ctx.lineTo(x + s*0.5, y + s*-0.02);
      ctx.lineTo(x + s*0.55, y + s*0.1);
      ctx.lineTo(x + s*0.65, y + s*0.0);
      ctx.lineTo(x + s*0.7, y + s*0.15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 6;
      ctx.fillRect(x + s*0.36, y + s*0.2, s*0.1, s*0.08);
      ctx.fillRect(x + s*0.54, y + s*0.2, s*0.1, s*0.08);
      ctx.shadowBlur = 0;
    }
  },
  skeleton_lord: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#fafafa';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.22, s*0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7c3aed';
      ctx.shadowColor = '#7c3aed';
      ctx.shadowBlur = 8;
      ctx.fillRect(x + s*0.36, y + s*0.16, s*0.1, s*0.1);
      ctx.fillRect(x + s*0.54, y + s*0.16, s*0.1, s*0.1);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#e5e5e5';
      ctx.fillRect(x + s*0.44, y + s*0.38, s*0.12, s*0.4);
      ctx.fillStyle = '#581c87';
      ctx.fillRect(x + s*0.35, y + s*0.38, s*0.3, s*0.25);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(x + s*0.35, y + s*0.08);
      ctx.lineTo(x + s*0.5, y + s*-0.05);
      ctx.lineTo(x + s*0.65, y + s*0.08);
      ctx.closePath();
      ctx.fill();
    }
  },
  orc_warlord: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(x + s*0.2, y + s*0.32, s*0.6, s*0.45);
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.22, s*0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef9c3';
      ctx.beginPath();
      ctx.moveTo(x + s*0.28, y + s*0.35);
      ctx.lineTo(x + s*0.22, y + s*0.55);
      ctx.lineTo(x + s*0.35, y + s*0.4);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.72, y + s*0.35);
      ctx.lineTo(x + s*0.78, y + s*0.55);
      ctx.lineTo(x + s*0.65, y + s*0.4);
      ctx.fill();
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(x + s*0.3, y + s*0.05, s*0.4, s*0.12);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x + s*0.25, y + s*0.0, s*0.5, s*0.08);
    }
  },
  spider_queen: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.6, s*0.3, s*0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#9333ea';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.32, s*0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(x + s*0.35, y + s*0.2);
      ctx.lineTo(x + s*0.5, y + s*0.1);
      ctx.lineTo(x + s*0.65, y + s*0.2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 6;
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(x + s*0.36 + i*s*0.05, y + s*0.28, s*0.04, s*0.04);
      }
      ctx.shadowBlur = 0;
    }
  },
  lich: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#164e63';
      ctx.beginPath();
      ctx.moveTo(x + s*0.5, y + s*0.2);
      ctx.lineTo(x + s*0.8, y + s*0.9);
      ctx.lineTo(x + s*0.2, y + s*0.9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e5e5e5';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.22, s*0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.fillRect(x + s*0.38, y + s*0.18, s*0.08, s*0.08);
      ctx.fillRect(x + s*0.54, y + s*0.18, s*0.08, s*0.08);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(x + s*0.15, y + s*0.5, s*0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  demon_lord: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(x + s*0.2, y + s*0.32, s*0.6, s*0.45);
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.25, s*0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(x + s*0.25, y + s*0.2);
      ctx.lineTo(x + s*0.1, y + s*-0.1);
      ctx.lineTo(x + s*0.35, y + s*0.1);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.75, y + s*0.2);
      ctx.lineTo(x + s*0.9, y + s*-0.1);
      ctx.lineTo(x + s*0.65, y + s*0.1);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 10;
      ctx.fillRect(x + s*0.35, y + s*0.2, s*0.1, s*0.08);
      ctx.fillRect(x + s*0.55, y + s*0.2, s*0.1, s*0.08);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.moveTo(x + s*0.15, y + s*0.4);
      ctx.lineTo(x - s*0.15, y + s*0.15);
      ctx.lineTo(x + s*0.05, y + s*0.5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.85, y + s*0.4);
      ctx.lineTo(x + s*1.15, y + s*0.15);
      ctx.lineTo(x + s*0.95, y + s*0.5);
      ctx.fill();
    }
  },
  ancient_dragon: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#92400e';
      ctx.fillRect(x + s*0.2, y + s*0.35, s*0.6, s*0.4);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(x + s*0.55, y + s*0.28, s*0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350f';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + s*(0.35 + i*0.12), y + s*0.12);
        ctx.lineTo(x + s*(0.38 + i*0.12), y + s*-0.05);
        ctx.lineTo(x + s*(0.45 + i*0.12), y + s*0.1);
        ctx.fill();
      }
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.fillRect(x + s*0.45, y + s*0.22, s*0.08, s*0.08);
      ctx.fillRect(x + s*0.58, y + s*0.22, s*0.08, s*0.08);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(x + s*0.15, y + s*0.4);
      ctx.lineTo(x - s*0.2, y + s*0.15);
      ctx.lineTo(x - s*0.1, y + s*0.35);
      ctx.lineTo(x + s*0.1, y + s*0.55);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.85, y + s*0.4);
      ctx.lineTo(x + s*1.2, y + s*0.15);
      ctx.lineTo(x + s*1.1, y + s*0.35);
      ctx.lineTo(x + s*0.9, y + s*0.55);
      ctx.fill();
    }
  },
  player: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Body (blue tunic)
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(x + s*0.3, y + s*0.35, s*0.4, s*0.4);
      
      // Head (skin tone)
      ctx.fillStyle = '#fcd5b8';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.25, s*0.18, 0, Math.PI * 2);
      ctx.fill();
      
      // Hair (brown)
      ctx.fillStyle = '#8b5a2b';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.2, s*0.15, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x + s*0.35, y + s*0.12, s*0.3, s*0.1);
      
      // Eyes
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x + s*0.4, y + s*0.22, s*0.06, s*0.06);
      ctx.fillRect(x + s*0.54, y + s*0.22, s*0.06, s*0.06);
      
      // Sword (right hand)
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x + s*0.7, y + s*0.25, s*0.08, s*0.35);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x + s*0.65, y + s*0.55, s*0.18, s*0.06);
      
      // Shield (left hand)
      ctx.fillStyle = '#1e40af';
      ctx.beginPath();
      ctx.moveTo(x + s*0.1, y + s*0.35);
      ctx.lineTo(x + s*0.28, y + s*0.35);
      ctx.lineTo(x + s*0.28, y + s*0.55);
      ctx.lineTo(x + s*0.19, y + s*0.65);
      ctx.lineTo(x + s*0.1, y + s*0.55);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(x + s*0.15, y + s*0.42, s*0.08, s*0.12);
      
      // Legs
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x + s*0.32, y + s*0.72, s*0.14, s*0.18);
      ctx.fillRect(x + s*0.54, y + s*0.72, s*0.14, s*0.18);
      
      // Boots
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + s*0.3, y + s*0.85, s*0.18, s*0.1);
      ctx.fillRect(x + s*0.52, y + s*0.85, s*0.18, s*0.1);
    }
  },
  goblin: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Body - small and hunched
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.55, s*0.18, s*0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Loincloth
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + s*0.38, y + s*0.65, s*0.24, s*0.12);
      // Head - big for body
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.32, s*0.2, 0, Math.PI * 2);
      ctx.fill();
      // Big pointy ears
      ctx.beginPath();
      ctx.moveTo(x + s*0.32, y + s*0.32);
      ctx.lineTo(x + s*0.08, y + s*0.15);
      ctx.lineTo(x + s*0.25, y + s*0.38);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.68, y + s*0.32);
      ctx.lineTo(x + s*0.92, y + s*0.15);
      ctx.lineTo(x + s*0.75, y + s*0.38);
      ctx.closePath();
      ctx.fill();
      // Big nose
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.38, s*0.08, s*0.06, 0, 0, Math.PI * 2);
      ctx.fill();
      // Evil yellow eyes
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(x + s*0.4, y + s*0.28, s*0.06, s*0.07, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + s*0.6, y + s*0.28, s*0.06, s*0.07, 0, 0, Math.PI * 2);
      ctx.fill();
      // Pupils
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(x + s*0.42, y + s*0.28, s*0.025, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.62, y + s*0.28, s*0.025, 0, Math.PI * 2);
      ctx.fill();
      // Grin with teeth
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.42, s*0.1, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#fef9c3';
      ctx.beginPath();
      ctx.moveTo(x + s*0.42, y + s*0.42);
      ctx.lineTo(x + s*0.45, y + s*0.48);
      ctx.lineTo(x + s*0.48, y + s*0.42);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.52, y + s*0.42);
      ctx.lineTo(x + s*0.55, y + s*0.48);
      ctx.lineTo(x + s*0.58, y + s*0.42);
      ctx.fill();
      // Arms with dagger
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(x + s*0.15, y + s*0.45, s*0.18, s*0.08);
      ctx.fillRect(x + s*0.67, y + s*0.45, s*0.18, s*0.08);
      // Rusty dagger
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + s*0.82, y + s*0.4, s*0.04, s*0.1);
      ctx.fillStyle = '#a8a29e';
      ctx.beginPath();
      ctx.moveTo(x + s*0.84, y + s*0.4);
      ctx.lineTo(x + s*0.84, y + s*0.2);
      ctx.lineTo(x + s*0.88, y + s*0.35);
      ctx.fill();
      // Legs
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(x + s*0.35, y + s*0.75, s*0.1, s*0.18);
      ctx.fillRect(x + s*0.55, y + s*0.75, s*0.1, s*0.18);
    }
  },
  orc: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Body (muscular, dark green)
      ctx.fillStyle = '#365314';
      ctx.fillRect(x + s*0.25, y + s*0.35, s*0.5, s*0.4);
      
      // Head
      ctx.fillStyle = '#4d7c0f';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.25, s*0.22, 0, Math.PI * 2);
      ctx.fill();
      
      // Tusks
      ctx.fillStyle = '#fef9c3';
      ctx.beginPath();
      ctx.moveTo(x + s*0.32, y + s*0.38);
      ctx.lineTo(x + s*0.28, y + s*0.52);
      ctx.lineTo(x + s*0.38, y + s*0.42);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.68, y + s*0.38);
      ctx.lineTo(x + s*0.72, y + s*0.52);
      ctx.lineTo(x + s*0.62, y + s*0.42);
      ctx.closePath();
      ctx.fill();
      
      // Angry eyes
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x + s*0.36, y + s*0.2, s*0.1, s*0.08);
      ctx.fillRect(x + s*0.54, y + s*0.2, s*0.1, s*0.08);
      ctx.fillStyle = '#000';
      ctx.fillRect(x + s*0.38, y + s*0.22, s*0.05, s*0.05);
      ctx.fillRect(x + s*0.57, y + s*0.22, s*0.05, s*0.05);
      
      // Eyebrows (angry)
      ctx.fillStyle = '#1a2e05';
      ctx.fillRect(x + s*0.34, y + s*0.15, s*0.14, s*0.04);
      ctx.fillRect(x + s*0.52, y + s*0.15, s*0.14, s*0.04);
      
      // Arms (muscular)
      ctx.fillStyle = '#4d7c0f';
      ctx.fillRect(x + s*0.08, y + s*0.35, s*0.18, s*0.15);
      ctx.fillRect(x + s*0.74, y + s*0.35, s*0.18, s*0.15);
      
      // Axe
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + s*0.82, y + s*0.15, s*0.06, s*0.5);
      ctx.fillStyle = '#71717a';
      ctx.beginPath();
      ctx.moveTo(x + s*0.88, y + s*0.15);
      ctx.lineTo(x + s*0.98, y + s*0.25);
      ctx.lineTo(x + s*0.88, y + s*0.35);
      ctx.closePath();
      ctx.fill();
      
      // Legs
      ctx.fillStyle = '#365314';
      ctx.fillRect(x + s*0.28, y + s*0.72, s*0.16, s*0.2);
      ctx.fillRect(x + s*0.56, y + s*0.72, s*0.16, s*0.2);
    }
  },
  troll: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Large body (purple/grey)
      ctx.fillStyle = '#6b21a8';
      ctx.fillRect(x + s*0.2, y + s*0.3, s*0.6, s*0.45);
      
      // Head (smaller relative to body)
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.22, s*0.18, 0, Math.PI * 2);
      ctx.fill();
      
      // Warts/bumps
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.arc(x + s*0.35, y + s*0.18, s*0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.62, y + s*0.25, s*0.03, 0, Math.PI * 2);
      ctx.fill();
      
      // Small angry eyes
      ctx.fillStyle = '#fcd34d';
      ctx.fillRect(x + s*0.4, y + s*0.18, s*0.07, s*0.06);
      ctx.fillRect(x + s*0.53, y + s*0.18, s*0.07, s*0.06);
      
      // Big nose
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.28, s*0.06, 0, Math.PI * 2);
      ctx.fill();
      
      // Mouth
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(x + s*0.38, y + s*0.34, s*0.24, s*0.06);
      
      // Big arms
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(x + s*0.02, y + s*0.32, s*0.2, s*0.2);
      ctx.fillRect(x + s*0.78, y + s*0.32, s*0.2, s*0.2);
      
      // Club
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + s*0.85, y + s*0.1, s*0.1, s*0.55);
      ctx.fillStyle = '#57534e';
      ctx.beginPath();
      ctx.arc(x + s*0.9, y + s*0.12, s*0.12, 0, Math.PI * 2);
      ctx.fill();
      
      // Legs (thick)
      ctx.fillStyle = '#6b21a8';
      ctx.fillRect(x + s*0.25, y + s*0.72, s*0.2, s*0.22);
      ctx.fillRect(x + s*0.55, y + s*0.72, s*0.2, s*0.22);
    }
  },
  slime: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Body - gelatinous blob
      const gradient = ctx.createRadialGradient(x + s*0.5, y + s*0.5, 0, x + s*0.5, y + s*0.6, s*0.35);
      gradient.addColorStop(0, '#67e8f9');
      gradient.addColorStop(0.7, '#22d3ee');
      gradient.addColorStop(1, '#0891b2');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.58, s*0.32, s*0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      // Top bulge
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.42, s*0.2, 0, Math.PI * 2);
      ctx.fill();
      // Eyes - cute but menacing
      ctx.fillStyle = '#0c4a6e';
      ctx.beginPath();
      ctx.ellipse(x + s*0.4, y + s*0.42, s*0.06, s*0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + s*0.6, y + s*0.42, s*0.06, s*0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      // Eye highlights
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x + s*0.42, y + s*0.4, s*0.025, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.62, y + s*0.4, s*0.025, 0, Math.PI * 2);
      ctx.fill();
      // Body highlights
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.ellipse(x + s*0.35, y + s*0.35, s*0.08, s*0.06, -0.5, 0, Math.PI * 2);
      ctx.fill();
      // Drip effect
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.ellipse(x + s*0.25, y + s*0.75, s*0.06, s*0.08, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  wolf: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Body - muscular
      ctx.fillStyle = '#44403c';
      ctx.beginPath();
      ctx.ellipse(x + s*0.4, y + s*0.55, s*0.28, s*0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      // Fur texture
      ctx.fillStyle = '#57534e';
      ctx.beginPath();
      ctx.ellipse(x + s*0.35, y + s*0.52, s*0.12, s*0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.fillStyle = '#57534e';
      ctx.beginPath();
      ctx.ellipse(x + s*0.72, y + s*0.45, s*0.16, s*0.14, 0.2, 0, Math.PI * 2);
      ctx.fill();
      // Snout
      ctx.fillStyle = '#78716c';
      ctx.beginPath();
      ctx.ellipse(x + s*0.85, y + s*0.48, s*0.08, s*0.06, 0, 0, Math.PI * 2);
      ctx.fill();
      // Nose
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(x + s*0.9, y + s*0.47, s*0.025, 0, Math.PI * 2);
      ctx.fill();
      // Eyes - yellow predator eyes
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.ellipse(x + s*0.7, y + s*0.42, s*0.04, s*0.05, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.ellipse(x + s*0.71, y + s*0.42, s*0.02, s*0.03, 0, 0, Math.PI * 2);
      ctx.fill();
      // Ears - pointed
      ctx.fillStyle = '#44403c';
      ctx.beginPath();
      ctx.moveTo(x + s*0.62, y + s*0.35);
      ctx.lineTo(x + s*0.58, y + s*0.18);
      ctx.lineTo(x + s*0.66, y + s*0.32);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.74, y + s*0.32);
      ctx.lineTo(x + s*0.78, y + s*0.16);
      ctx.lineTo(x + s*0.8, y + s*0.3);
      ctx.fill();
      // Tail
      ctx.beginPath();
      ctx.moveTo(x + s*0.15, y + s*0.5);
      ctx.quadraticCurveTo(x + s*0.05, y + s*0.35, x + s*0.12, y + s*0.25);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#44403c';
      ctx.stroke();
      // Legs
      ctx.fillStyle = '#44403c';
      ctx.fillRect(x + s*0.25, y + s*0.65, s*0.08, s*0.22);
      ctx.fillRect(x + s*0.4, y + s*0.65, s*0.08, s*0.22);
      ctx.fillRect(x + s*0.55, y + s*0.65, s*0.08, s*0.2);
      ctx.fillRect(x + s*0.68, y + s*0.65, s*0.08, s*0.18);
    }
  },
  cultist: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#4c1d95';
      ctx.beginPath();
      ctx.moveTo(x + s*0.5, y + s*0.1);
      ctx.lineTo(x + s*0.8, y + s*0.9);
      ctx.lineTo(x + s*0.2, y + s*0.9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.35, s*0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#be123c';
      ctx.shadowColor = '#be123c';
      ctx.shadowBlur = 6;
      ctx.fillRect(x + s*0.42, y + s*0.32, s*0.06, s*0.06);
      ctx.fillRect(x + s*0.52, y + s*0.32, s*0.06, s*0.06);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.6, s*0.12, 0, Math.PI * 2);
      ctx.stroke();
    }
  },
  golem: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#57534e';
      ctx.fillRect(x + s*0.25, y + s*0.35, s*0.5, s*0.45);
      ctx.fillStyle = '#78716c';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.28, s*0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 6;
      ctx.fillRect(x + s*0.38, y + s*0.24, s*0.08, s*0.08);
      ctx.fillRect(x + s*0.54, y + s*0.24, s*0.08, s*0.08);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#44403c';
      ctx.fillRect(x + s*0.1, y + s*0.38, s*0.18, s*0.12);
      ctx.fillRect(x + s*0.72, y + s*0.38, s*0.18, s*0.12);
      ctx.fillRect(x + s*0.28, y + s*0.78, s*0.18, s*0.15);
      ctx.fillRect(x + s*0.54, y + s*0.78, s*0.18, s*0.15);
    }
  },
  vampire: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(x + s*0.5, y + s*0.25);
      ctx.lineTo(x + s*0.85, y + s*0.9);
      ctx.lineTo(x + s*0.15, y + s*0.9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fafaf9';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.3, s*0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.22, s*0.12, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 6;
      ctx.fillRect(x + s*0.4, y + s*0.26, s*0.06, s*0.06);
      ctx.fillRect(x + s*0.54, y + s*0.26, s*0.06, s*0.06);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fafaf9';
      ctx.beginPath();
      ctx.moveTo(x + s*0.42, y + s*0.38);
      ctx.lineTo(x + s*0.45, y + s*0.45);
      ctx.lineTo(x + s*0.48, y + s*0.38);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.52, y + s*0.38);
      ctx.lineTo(x + s*0.55, y + s*0.45);
      ctx.lineTo(x + s*0.58, y + s*0.38);
      ctx.fill();
    }
  },
  mimic: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + s*0.15, y + s*0.45, s*0.7, s*0.4);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(x + s*0.12, y + s*0.3, s*0.76, s*0.2);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x + s*0.3, y + s*0.35, s*0.1, s*0.08);
      ctx.fillRect(x + s*0.6, y + s*0.35, s*0.1, s*0.08);
      ctx.fillStyle = '#fef3c7';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(x + s*(0.2 + i*0.1), y + s*0.5);
        ctx.lineTo(x + s*(0.25 + i*0.1), y + s*0.6);
        ctx.lineTo(x + s*(0.3 + i*0.1), y + s*0.5);
        ctx.fill();
      }
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.55, s*0.15, s*0.08, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  vampire_lord: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath();
      ctx.moveTo(x + s*0.15, y + s*0.35);
      ctx.lineTo(x - s*0.1, y + s*0.2);
      ctx.lineTo(x + s*0.1, y + s*0.5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.85, y + s*0.35);
      ctx.lineTo(x + s*1.1, y + s*0.2);
      ctx.lineTo(x + s*0.9, y + s*0.5);
      ctx.fill();
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(x + s*0.25, y + s*0.35, s*0.5, s*0.5);
      ctx.fillStyle = '#fafaf9';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.28, s*0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(x + s*0.35, y + s*0.15);
      ctx.lineTo(x + s*0.5, y + s*0.05);
      ctx.lineTo(x + s*0.65, y + s*0.15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 8;
      ctx.fillRect(x + s*0.38, y + s*0.24, s*0.08, s*0.08);
      ctx.fillRect(x + s*0.54, y + s*0.24, s*0.08, s*0.08);
      ctx.shadowBlur = 0;
    }
  },
  golem_king: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#44403c';
      ctx.fillRect(x + s*0.2, y + s*0.32, s*0.6, s*0.5);
      ctx.fillStyle = '#57534e';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.25, s*0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(x + s*0.3, y + s*0.12);
      ctx.lineTo(x + s*0.35, y + s*0.0);
      ctx.lineTo(x + s*0.45, y + s*0.08);
      ctx.lineTo(x + s*0.5, y + s*-0.02);
      ctx.lineTo(x + s*0.55, y + s*0.08);
      ctx.lineTo(x + s*0.65, y + s*0.0);
      ctx.lineTo(x + s*0.7, y + s*0.12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#22d3ee';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 10;
      ctx.fillRect(x + s*0.36, y + s*0.2, s*0.1, s*0.1);
      ctx.fillRect(x + s*0.54, y + s*0.2, s*0.1, s*0.1);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#292524';
      ctx.fillRect(x + s*0.05, y + s*0.35, s*0.18, s*0.15);
      ctx.fillRect(x + s*0.77, y + s*0.35, s*0.18, s*0.15);
    }
  },
  demon: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Muscular demonic body
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.55, s*0.22, s*0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      // Chest muscles
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.arc(x + s*0.42, y + s*0.48, s*0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.58, y + s*0.48, s*0.08, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.28, s*0.18, 0, Math.PI * 2);
      ctx.fill();
      // Curved horns
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(x + s*0.32, y + s*0.2);
      ctx.quadraticCurveTo(x + s*0.15, y + s*0.05, x + s*0.22, y + s*-0.05);
      ctx.quadraticCurveTo(x + s*0.28, y + s*0.05, x + s*0.38, y + s*0.18);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.68, y + s*0.2);
      ctx.quadraticCurveTo(x + s*0.85, y + s*0.05, x + s*0.78, y + s*-0.05);
      ctx.quadraticCurveTo(x + s*0.72, y + s*0.05, x + s*0.62, y + s*0.18);
      ctx.fill();
      // Glowing eyes
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(x + s*0.4, y + s*0.26, s*0.05, s*0.04, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + s*0.6, y + s*0.26, s*0.05, s*0.04, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Evil grin
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.32, s*0.1, 0.1, Math.PI - 0.1);
      ctx.stroke();
      // Fangs
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.moveTo(x + s*0.4, y + s*0.36);
      ctx.lineTo(x + s*0.42, y + s*0.42);
      ctx.lineTo(x + s*0.44, y + s*0.36);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.56, y + s*0.36);
      ctx.lineTo(x + s*0.58, y + s*0.42);
      ctx.lineTo(x + s*0.6, y + s*0.36);
      ctx.fill();
      // Bat wings
      ctx.fillStyle = '#7f1d1d';
      // Left wing
      ctx.beginPath();
      ctx.moveTo(x + s*0.28, y + s*0.45);
      ctx.lineTo(x - s*0.05, y + s*0.2);
      ctx.lineTo(x + s*0.0, y + s*0.35);
      ctx.lineTo(x - s*0.08, y + s*0.4);
      ctx.lineTo(x + s*0.05, y + s*0.5);
      ctx.lineTo(x + s*0.15, y + s*0.55);
      ctx.closePath();
      ctx.fill();
      // Right wing
      ctx.beginPath();
      ctx.moveTo(x + s*0.72, y + s*0.45);
      ctx.lineTo(x + s*1.05, y + s*0.2);
      ctx.lineTo(x + s*1.0, y + s*0.35);
      ctx.lineTo(x + s*1.08, y + s*0.4);
      ctx.lineTo(x + s*0.95, y + s*0.5);
      ctx.lineTo(x + s*0.85, y + s*0.55);
      ctx.closePath();
      ctx.fill();
      // Tail with arrow tip
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + s*0.5, y + s*0.78);
      ctx.quadraticCurveTo(x + s*0.2, y + s*0.9, x + s*0.1, y + s*0.75);
      ctx.stroke();
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(x + s*0.1, y + s*0.75);
      ctx.lineTo(x + s*0.02, y + s*0.68);
      ctx.lineTo(x + s*0.02, y + s*0.82);
      ctx.closePath();
      ctx.fill();
      // Hooved legs
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(x + s*0.32, y + s*0.75, s*0.12, s*0.15);
      ctx.fillRect(x + s*0.56, y + s*0.75, s*0.12, s*0.15);
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.ellipse(x + s*0.38, y + s*0.92, s*0.08, s*0.04, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + s*0.62, y + s*0.92, s*0.08, s*0.04, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

// Map enemy types to sprite names
const ENEMY_SPRITES_MAP = {
  2: 'rat', 3: 'bat', 4: 'goblin', 5: 'skeleton', 6: 'orc', 7: 'spider', 8: 'zombie', 9: 'troll', 10: 'wraith', 11: 'demon', 12: 'dragon', 13: 'slime', 14: 'wolf', 15: 'cultist', 16: 'golem', 17: 'vampire', 18: 'mimic',
  100: 'goblin_king', 101: 'skeleton_lord', 102: 'orc_warlord', 103: 'spider_queen', 104: 'lich', 105: 'demon_lord', 106: 'ancient_dragon', 107: 'vampire_lord', 108: 'golem_king',
};

export function drawEnemy(ctx, enemyType, x, y, size, frame = 0) {
  const spriteName = ENEMY_SPRITES_MAP[enemyType];
  
  if (spriteName && SPRITES[spriteName]) {
    SPRITES[spriteName].draw(ctx, x, y, size, frame);
  } else {
    // Fallback text
    const stats = ENEMY_STATS[enemyType];
    if (stats) {
        ctx.fillStyle = stats.color;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stats.symbol, x + size/2, y + size/2);
    }
  }
}

export function drawLargeEnemy(ctx, spriteName, x, y, size, frame = 0) {
    // Large bosses have suffix or specialized names
    const largeName = spriteName + '_large'; // Mapping convention
    if (SPRITES[largeName]) {
        SPRITES[largeName].draw(ctx, x, y, size, frame);
    } else if (SPRITES[spriteName]) {
        // Fallback to normal sprite scaled up
        SPRITES[spriteName].draw(ctx, x, y, size, frame);
    }
}