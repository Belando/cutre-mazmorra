export const ENV_SPRITES = {
  torch: {
    draw: (ctx, x, y, size, frame = 0) => {
      const s = size;
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + s*0.4, y + s*0.5, s*0.2, s*0.35);
      ctx.fillStyle = '#a16207';
      ctx.fillRect(x + s*0.35, y + s*0.4, s*0.3, s*0.15);
      const flicker = Math.sin(frame * 0.3) * 0.05;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(x + s*0.5, y + s*0.1 + flicker * s);
      ctx.quadraticCurveTo(x + s*0.65, y + s*0.25, x + s*0.6, y + s*0.4);
      ctx.lineTo(x + s*0.4, y + s*0.4);
      ctx.quadraticCurveTo(x + s*0.35, y + s*0.25, x + s*0.5, y + s*0.1 + flicker * s);
      ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(x + s*0.5, y + s*0.18);
      ctx.quadraticCurveTo(x + s*0.58, y + s*0.28, x + s*0.55, y + s*0.38);
      ctx.lineTo(x + s*0.45, y + s*0.38);
      ctx.quadraticCurveTo(x + s*0.42, y + s*0.28, x + s*0.5, y + s*0.18);
      ctx.fill();
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 8;
      ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.3, s*0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  },
  chest: {
    draw: (ctx, x, y, size, isOpen = false, rarity = 'common') => {
      const s = size;
      const chestColors = {
        common: { main: '#78350f', light: '#a16207', metal: '#71717a' },
        uncommon: { main: '#166534', light: '#22c55e', metal: '#71717a' },
        rare: { main: '#1e40af', light: '#3b82f6', metal: '#fbbf24' },
        epic: { main: '#581c87', light: '#a855f7', metal: '#fbbf24' },
        legendary: { main: '#854d0e', light: '#fbbf24', metal: '#fbbf24' },
      };
      const colors = chestColors[rarity] || chestColors.common;
      
      if (isOpen) {
        ctx.fillStyle = colors.main;
        ctx.fillRect(x + s*0.15, y + s*0.5, s*0.7, s*0.35);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(x + s*0.2, y + s*0.52, s*0.6, s*0.2);
        ctx.fillStyle = colors.light;
        ctx.beginPath();
        ctx.moveTo(x + s*0.15, y + s*0.5);
        ctx.lineTo(x + s*0.1, y + s*0.2);
        ctx.lineTo(x + s*0.8, y + s*0.2);
        ctx.lineTo(x + s*0.85, y + s*0.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = colors.main;
        ctx.fillRect(x + s*0.1, y + s*0.18, s*0.7, s*0.08);
      } else {
        ctx.fillStyle = colors.main;
        ctx.fillRect(x + s*0.15, y + s*0.45, s*0.7, s*0.4);
        ctx.fillStyle = colors.light;
        ctx.fillRect(x + s*0.12, y + s*0.3, s*0.76, s*0.2);
        ctx.beginPath();
        ctx.moveTo(x + s*0.12, y + s*0.3);
        ctx.quadraticCurveTo(x + s*0.5, y + s*0.2, x + s*0.88, y + s*0.3);
        ctx.lineTo(x + s*0.88, y + s*0.35);
        ctx.quadraticCurveTo(x + s*0.5, y + s*0.25, x + s*0.12, y + s*0.35);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = colors.metal;
        ctx.fillRect(x + s*0.2, y + s*0.3, s*0.08, s*0.55);
        ctx.fillRect(x + s*0.72, y + s*0.3, s*0.08, s*0.55);
        ctx.fillStyle = colors.metal;
        ctx.fillRect(x + s*0.42, y + s*0.42, s*0.16, s*0.12);
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.arc(x + s*0.5, y + s*0.48, s*0.03, 0, Math.PI * 2);
        ctx.fill();
      }
      if (['rare', 'epic', 'legendary'].includes(rarity) && !isOpen) {
        ctx.shadowColor = colors.light;
        ctx.shadowBlur = 6;
        ctx.strokeStyle = colors.light;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + s*0.12, y + s*0.25, s*0.76, s*0.6);
        ctx.shadowBlur = 0;
      }
    }
  },
  goldPile: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.75, s*0.35, s*0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(x + s*0.45, y + s*0.65, s*0.25, s*0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(x + s*0.55, y + s*0.6, s*0.2, s*0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fcd34d';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.52, s*0.12, s*0.05, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x + s*0.6, y + s*0.5, s*0.03, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  stairs: {
    draw: (ctx, x, y, size) => {
        const s = size;
        ctx.fillStyle = '#171717'; // Hueco oscuro
        ctx.fillRect(x + s*0.2, y + s*0.2, s*0.6, s*0.6);
        
        // Peldaños
        ctx.fillStyle = '#404040';
        for(let i=0; i<3; i++) {
            ctx.fillRect(x + s*0.2, y + s*0.2 + (i*s*0.15), s*0.6, s*0.1);
        }
    }
  },
  wallTorch: {
    draw: (ctx, x, y, size, frame = 0) => {
      const s = size;
      // Soporte
      ctx.fillStyle = '#44403c';
      ctx.fillRect(x + s*0.45, y + s*0.5, s*0.1, s*0.3);
      
      // Fuego (3 capas para dar profundidad)
      const flicker = Math.sin(frame * 0.5) * s*0.05;
      
      // Halo de luz
      const gradient = ctx.createRadialGradient(x+s*0.5, y+s*0.4, 0, x+s*0.5, y+s*0.4, s*0.6);
      gradient.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
      gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath(); ctx.arc(x+s*0.5, y+s*0.4, s*0.6, 0, Math.PI*2); ctx.fill();

      // Núcleo rojo
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.4, s*0.15, s*0.2, 0, 0, Math.PI*2);
      ctx.fill();
      
      // Centro naranja
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5 + flicker*0.5, y + s*0.38, s*0.1, s*0.15, 0, 0, Math.PI*2);
      ctx.fill();
      
      // Punta amarilla
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(x + s*0.5 + flicker, y + s*0.35, s*0.06, 0, Math.PI*2);
      ctx.fill();
    }
  },
  bones: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#d4d4d4';
      ctx.beginPath();
      ctx.arc(x + s*0.35, y + s*0.6, s*0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(x + s*0.28, y + s*0.56, s*0.04, s*0.04);
      ctx.fillRect(x + s*0.36, y + s*0.56, s*0.04, s*0.04);
      ctx.fillStyle = '#e5e5e5';
      ctx.save();
      ctx.translate(x + s*0.6, y + s*0.5);
      ctx.rotate(0.3);
      ctx.fillRect(-s*0.15, -s*0.03, s*0.3, s*0.06);
      ctx.beginPath();
      ctx.arc(-s*0.15, 0, s*0.05, 0, Math.PI * 2);
      ctx.arc(s*0.15, 0, s*0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.translate(x + s*0.55, y + s*0.7);
      ctx.rotate(-0.4);
      ctx.fillRect(-s*0.12, -s*0.025, s*0.24, s*0.05);
      ctx.restore();
    }
  },
  barrel: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.75, s*0.3, s*0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x + s*0.2, y + s*0.25, s*0.6, s*0.5);
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.25, s*0.3, s*0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#71717a';
      ctx.fillRect(x + s*0.18, y + s*0.32, s*0.64, s*0.04);
      ctx.fillRect(x + s*0.18, y + s*0.55, s*0.64, s*0.04);
    }
  },
  pillar: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#44403c';
      ctx.fillRect(x + s*0.2, y + s*0.8, s*0.6, s*0.15);
      ctx.fillStyle = '#57534e';
      ctx.fillRect(x + s*0.28, y + s*0.15, s*0.44, s*0.65);
      ctx.fillStyle = '#44403c';
      ctx.fillRect(x + s*0.2, y + s*0.08, s*0.6, s*0.12);
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(x + s*0.32, y + s*0.2, s*0.08, s*0.55);
      ctx.fillRect(x + s*0.6, y + s*0.2, s*0.08, s*0.55);
    }
  },
  crack: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + s*0.3, y + s*0.2);
      ctx.lineTo(x + s*0.45, y + s*0.4);
      ctx.lineTo(x + s*0.35, y + s*0.55);
      ctx.lineTo(x + s*0.5, y + s*0.7);
      ctx.lineTo(x + s*0.42, y + s*0.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + s*0.45, y + s*0.4);
      ctx.lineTo(x + s*0.6, y + s*0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + s*0.5, y + s*0.7);
      ctx.lineTo(x + s*0.65, y + s*0.75);
      ctx.stroke();
    }
  },
  rubble: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#44403c';
      ctx.beginPath();
      ctx.arc(x + s*0.3, y + s*0.7, s*0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.55, y + s*0.65, s*0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.7, y + s*0.72, s*0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#57534e';
      ctx.beginPath();
      ctx.arc(x + s*0.4, y + s*0.55, s*0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.6, y + s*0.8, s*0.05, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  bloodstain: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = 'rgba(127, 29, 29, 0.6)';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.6, s*0.25, s*0.15, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(153, 27, 27, 0.5)';
      ctx.beginPath();
      ctx.ellipse(x + s*0.35, y + s*0.5, s*0.1, s*0.08, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + s*0.65, y + s*0.7, s*0.08, s*0.06, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  cobweb: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + s*0.3, y + s*0.1, x + s*0.6, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + s*0.1, y + s*0.3, x, y + s*0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + s*0.4, y + s*0.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + s*0.15, y + s*0.05);
      ctx.quadraticCurveTo(x + s*0.2, y + s*0.2, x + s*0.05, y + s*0.15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + s*0.3, y + s*0.1);
      ctx.quadraticCurveTo(x + s*0.25, y + s*0.25, x + s*0.1, y + s*0.3);
      ctx.stroke();
    }
  },
  waterPool: {
    draw: (ctx, x, y, size, frame = 0) => {
      const s = size;
      const ripple = Math.sin(frame * 0.1) * 0.02;
      ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.6, s*0.35 + ripple * s, s*0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(147, 197, 253, 0.5)';
      ctx.beginPath();
      ctx.ellipse(x + s*0.4, y + s*0.55, s*0.1, s*0.05, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
};

export function drawEnvironmentSprite(ctx, type, x, y, size, ...args) {
  if (ENV_SPRITES[type]) {
    ENV_SPRITES[type].draw(ctx, x, y, size, ...args);
  }
}