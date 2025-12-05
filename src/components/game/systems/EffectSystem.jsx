export class EffectsManager {
  constructor() {
    this.effects = [];
    this.idCounter = 0;
  }

  // --- TEXTO FLOTANTE (Daño, info) ---
  // Acepta un parámetro extra 'isCritical'
  addText(x, y, text, color = '#fff', isCritical = false) {
    this.effects.push({
      id: this.idCounter++,
      type: 'text',
      x, y,
      text,
      color,
      isCritical, // Guardamos si es crítico
      life: isCritical ? 90 : 60, // Dura más si es crítico
      maxLife: isCritical ? 90 : 60,
      // Si es crítico, salta más explosivamente hacia los lados
      vx: isCritical ? (Math.random() - 0.5) * 0.15 : (Math.random() - 0.5) * 0.05,
      // Si es crítico, salta más alto inicialmente
      vy: isCritical ? -0.1 : -0.05 - Math.random() * 0.05,
      offsetY: 0
    });
  }

  // --- EMISORES DE PARTÍCULAS ---

  // Sangre: Cae al suelo y se queda un rato
  addBlood(x, y, color = '#dc2626') {
    const count = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      this.effects.push({
        id: this.idCounter++,
        type: 'particle',
        style: 'rect',
        x: x + 0.5, // Centro del tile
        y: y + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        color: color,
        size: Math.random() * 0.15 + 0.05,
        gravity: 0.02,  // La sangre cae
        friction: 0.9,  // Se frena en el aire
        onGround: false // Para manchar el suelo (opcional futuro)
      });
    }
  }

  // Explosión Mágica: Expansión radial
  addExplosion(x, y, color = '#fbbf24') {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 0.1 + Math.random() * 0.2;
      this.effects.push({
        id: this.idCounter++,
        type: 'particle',
        style: 'circle',
        x: x + 0.5,
        y: y + 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 20 + Math.random() * 10,
        maxLife: 30,
        color: color,
        size: 0.1 + Math.random() * 0.1,
        gravity: 0,
        friction: 0.95
      });
    }
  }

  // Brillo (Level Up / Loot)
  addSparkles(x, y, color = '#fbbf24') {
    for (let i = 0; i < 8; i++) {
      this.effects.push({
        id: this.idCounter++,
        type: 'particle',
        style: 'star',
        x: x + 0.2 + Math.random() * 0.6,
        y: y + 0.2 + Math.random() * 0.6,
        vx: 0,
        vy: -0.02 - Math.random() * 0.05, // Flota arriba
        life: 40 + Math.random() * 20,
        maxLife: 60,
        color: color,
        size: 0.05 + Math.random() * 0.1,
        gravity: 0,
        friction: 1
      });
    }
  }

  // --- MOTOR DE FÍSICA ---
  update() {
    this.effects.forEach(effect => {
      // Física básica
      if (effect.type === 'particle') {
        effect.x += effect.vx;
        effect.y += effect.vy;
        
        if (effect.gravity) effect.vy += effect.gravity;
        if (effect.friction) {
          effect.vx *= effect.friction;
          effect.vy *= effect.friction;
        }
      } else if (effect.type === 'text') {
        effect.x += effect.vx;
        effect.y += effect.vy;
        
        // Easing / Fricción para el texto:
        // Hace que suba rápido al principio y luego "flote" suavemente
        effect.vy *= 0.9; 
        
        effect.offsetY += effect.vy; 
      }
      
      effect.life--;
    });

    this.effects = this.effects.filter(e => e.life > 0);
  }

  // --- RENDERIZADO ---
  draw(ctx, offsetX, offsetY, tileSize) {
    ctx.save();

    // Separamos en dos grupos para dibujar en orden
    // Esto es más eficiente que ordenar el array entero cada frame
    const particles = [];
    const texts = [];

    this.effects.forEach(e => {
      if (e.type === 'particle') particles.push(e);
      else if (e.type === 'text') texts.push(e);
    });

    // 1. DIBUJAR PARTÍCULAS (FONDO)
    particles.forEach(effect => {
      const screenX = (effect.x - offsetX) * tileSize;
      const screenY = (effect.y - offsetY) * tileSize;

      // Cull check
      if (screenX < -tileSize || screenY < -tileSize || 
          screenX > ctx.canvas.width || screenY > ctx.canvas.height) return;

      const alpha = Math.max(0, effect.life / 20);
      ctx.globalAlpha = alpha > 1 ? 1 : alpha;
      ctx.fillStyle = effect.color;

      const size = effect.size * tileSize;
      
      if (effect.style === 'rect') {
        ctx.fillRect(screenX, screenY, size, size);
      } else if (effect.style === 'circle') {
        ctx.beginPath();
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        ctx.fill();
      } else if (effect.style === 'star') {
        ctx.fillRect(screenX - size, screenY, size*3, size/2);
        ctx.fillRect(screenX, screenY - size, size/2, size*3);
      }
    });

    // 2. DIBUJAR TEXTOS (FRENTE)
    texts.forEach(effect => {
      const screenX = (effect.x - offsetX) * tileSize;
      const screenY = (effect.y - offsetY) * tileSize;

      // Cull check
      if (screenX < -tileSize || screenY < -tileSize || 
          screenX > ctx.canvas.width || screenY > ctx.canvas.height) return;

      const alpha = Math.max(0, effect.life / 20);
      ctx.globalAlpha = alpha > 1 ? 1 : alpha;
      ctx.fillStyle = effect.color;

      // Configuración según si es Crítico o Normal
      const fontSize = effect.isCritical ? 20 : 14;
      const fontWeight = 'bold';
      
      ctx.font = `${fontWeight} ${fontSize}px monospace`;
      ctx.textAlign = 'center';
      
      // Borde negro para legibilidad
      ctx.strokeStyle = 'black';
      ctx.lineWidth = effect.isCritical ? 4 : 3;
      
      ctx.strokeText(effect.text, screenX + tileSize/2, screenY + tileSize/2);
      ctx.fillText(effect.text, screenX + tileSize/2, screenY + tileSize/2);
    });

    ctx.restore();
  }
}