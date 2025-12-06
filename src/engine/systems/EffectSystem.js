export class EffectsManager {
  constructor() {
    this.effects = [];
    this.idCounter = 0;
    this.screenShake = 0; // Intensidad actual del temblor
  }

  // --- SCREEN SHAKE ---
  addShake(amount) {
    this.screenShake = Math.min(this.screenShake + amount, 25); // Límite máximo para no marear
  }

  // --- TEXTO FLOTANTE ---
  addText(x, y, text, color = '#fff', isCritical = false) {
    this.effects.push({
      id: this.idCounter++,
      type: 'text',
      x, y,
      text,
      color,
      isCritical,
      life: isCritical ? 90 : 60,
      maxLife: isCritical ? 90 : 60,
      vx: isCritical ? (Math.random() - 0.5) * 0.1 : 0,
      vy: isCritical ? -0.1 : -0.05,
      offsetY: 0
    });
  }

  // --- PARTICULAS CON FÍSICA (Sangre/Escombros) ---
  addBlood(x, y, color = '#dc2626') {
    const count = 6 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.15;
      this.effects.push({
        id: this.idCounter++,
        type: 'particle',
        style: 'rect',
        x: x + 0.5, // Centro del tile
        y: y + 0.5,
        z: 0.5 + Math.random() * 0.5, // Altura inicial (Eje Z simulado)
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 0.1 + Math.random() * 0.2, // Salto hacia arriba
        life: 180 + Math.random() * 60, // Duran más para manchar el suelo
        maxLife: 240,
        color: color,
        size: Math.random() * 0.12 + 0.04,
        gravity: 0.04,
        friction: 0.95,
        bounces: 2 // Cantidad de rebotes
      });
    }
  }

  addExplosion(x, y, color = '#fbbf24') {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 0.1 + Math.random() * 0.2;
      this.effects.push({
        id: this.idCounter++,
        type: 'particle',
        style: 'circle',
        x: x + 0.5, y: y + 0.5, z: 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 0,
        life: 30, maxLife: 30,
        color: color,
        size: 0.1 + Math.random() * 0.1,
        gravity: 0, friction: 0.9
      });
    }
  }

  addSparkles(x, y, color = '#fbbf24') {
    for (let i = 0; i < 8; i++) {
      this.effects.push({
        id: this.idCounter++,
        type: 'particle',
        style: 'star',
        x: x + 0.2 + Math.random() * 0.6,
        y: y + 0.2 + Math.random() * 0.6,
        z: 0.5 + Math.random() * 0.5,
        vx: 0, vy: 0, vz: 0.02 + Math.random() * 0.03, // Flotan hacia arriba
        life: 50, maxLife: 50,
        color: color,
        size: 0.05 + Math.random() * 0.1,
        gravity: 0, friction: 1
      });
    }
  }

  // --- MOTOR DE FÍSICA ---
  update() {
    // Decaimiento del Screen Shake
    if (this.screenShake > 0) {
        this.screenShake *= 0.9; // Se reduce un 10% cada frame
        if (this.screenShake < 0.5) this.screenShake = 0;
    }

    this.effects.forEach(effect => {
      if (effect.type === 'particle') {
        // Movimiento plano (XY)
        effect.x += effect.vx;
        effect.y += effect.vy;
        
        // Simulación de Altura (Z) y Rebotes
        if (effect.z !== undefined) {
            effect.z += effect.vz;
            
            // Si está en el aire, aplicar gravedad
            if (effect.z > 0) {
                effect.vz -= effect.gravity;
            } 
            // Si toca el suelo
            else {
                effect.z = 0;
                // Si le quedan rebotes y tiene velocidad, rebota
                if (effect.bounces > 0 && Math.abs(effect.vz) > 0.05) {
                    effect.vz *= -0.5; // Pierde energía en el rebote
                    effect.bounces--;
                } else {
                    effect.vz = 0;
                    // Fricción alta en el suelo (se detiene)
                    effect.vx *= 0.5;
                    effect.vy *= 0.5;
                }
            }
        }

        if (effect.friction) {
          effect.vx *= effect.friction;
          effect.vy *= effect.friction;
        }
      } else if (effect.type === 'text') {
        effect.x += effect.vx;
        effect.y += effect.vy;
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

    const particles = [];
    const texts = [];
    this.effects.forEach(e => e.type === 'text' ? texts.push(e) : particles.push(e));

    // 1. DIBUJAR PARTÍCULAS
    particles.forEach(effect => {
      // Calculamos posición visual: Y visual = Y mundo - Altura Z
      const zOffset = effect.z || 0;
      
      const screenX = (effect.x - offsetX) * tileSize;
      const screenY = (effect.y - offsetY - zOffset) * tileSize;

      // Sombra de la partícula (si está en el aire)
      if (zOffset > 0.1) {
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          const shadowY = (effect.y - offsetY) * tileSize;
          const shadowSize = effect.size * tileSize * (1 - zOffset * 0.5);
          if (shadowSize > 0) ctx.fillRect(screenX, shadowY, shadowSize, shadowSize * 0.5);
      }

      const alpha = Math.min(1, effect.life / 30);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = effect.color;

      const size = effect.size * tileSize;
      
      if (effect.style === 'rect') {
        ctx.fillRect(screenX, screenY, size, size);
      } else if (effect.style === 'circle') {
        ctx.beginPath(); ctx.arc(screenX, screenY, size, 0, Math.PI * 2); ctx.fill();
      } else if (effect.style === 'star') {
        ctx.fillRect(screenX - size, screenY, size*3, size/2);
        ctx.fillRect(screenX, screenY - size, size/2, size*3);
      }
    });

    // 2. DIBUJAR TEXTOS
    texts.forEach(effect => {
      const screenX = (effect.x - offsetX) * tileSize;
      const screenY = (effect.y - offsetY + effect.offsetY) * tileSize;
      
      const alpha = Math.min(1, effect.life / 20);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = effect.color;
      
      const fontSize = effect.isCritical ? 20 : 14;
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textAlign = 'center';
      
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.strokeText(effect.text, screenX + tileSize/2, screenY + tileSize/2);
      ctx.fillText(effect.text, screenX + tileSize/2, screenY + tileSize/2);
    });

    ctx.restore();
  }
}