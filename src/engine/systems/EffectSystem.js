// src/engine/systems/EffectSystem.js

export class EffectsManager {
  constructor() {
    this.effects = [];
    this.idCounter = 0;
    this.screenShake = 0;
  }

  // --- SCREEN SHAKE (Igual) ---
  addShake(amount) {
    this.screenShake = Math.min(this.screenShake + amount, 25);
  }

  // --- TEXTO FLOTANTE ---
  // CAMBIO 1: Añadido parámetro 'isSkillHit'
  addText(x, y, text, color = '#fff', isCritical = false, isSmall = false, isSkillHit = false) {
    this.effects.push({
      id: this.idCounter++,
      type: 'text',
      x, y,
      text,
      color,
      isCritical,
      isSmall,
      isSkillHit, // Guardamos la nueva propiedad
      life: isCritical ? 90 : 60,
      maxLife: isCritical ? 90 : 60,
      vx: isCritical ? (Math.random() - 0.5) * 0.1 : 0,
      vy: isCritical ? -0.1 : -0.05,
      offsetY: 0
    });
  }

  // --- NUEVO: EFECTO DE STUN (Estrellas girando) ---
  addStunEffect(x, y) {
    const color = '#fbbf24'; // Amarillo dorado
    for (let i = 0; i < 5; i++) {
      this.effects.push({
        id: this.idCounter++,
        type: 'particle',
        style: 'star',
        // Posición inicial centrada sobre la cabeza
        x: x + 0.5, 
        y: y + 0.2, 
        z: 0.8, // Altura
        // Velocidad orbital inicial (se calcula en update)
        angle: (Math.PI * 2 * i) / 5, // Ángulo inicial distribuido
        radius: 0.3, // Radio de giro
        orbitalSpeed: 0.15, // Velocidad de giro
        vx: 0, vy: 0, vz: 0,
        life: 60, maxLife: 60, // Dura 1 segundo (o lo que dure el stun)
        color: color,
        size: 0.12,
        gravity: 0, friction: 1,
        isOrbiting: true // Marcador para lógica especial en update
      });
    }
  }

  // --- PARTICULAS (Sangre/Explosión/Chispas) ---
  // (Se mantienen igual que en tu código anterior: addBlood, addExplosion, addSparkles)
  addBlood(x, y, color = '#dc2626') {
    const count = 6 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.15;
      this.effects.push({
        id: this.idCounter++,
        type: 'particle',
        style: 'rect',
        x: x + 0.5, y: y + 0.5, z: 0.5 + Math.random() * 0.5,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, vz: 0.1 + Math.random() * 0.2,
        life: 180 + Math.random() * 60, maxLife: 240, color: color, size: Math.random() * 0.12 + 0.04,
        gravity: 0.04, friction: 0.95, bounces: 2
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
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, vz: 0,
        life: 30, maxLife: 30, color: color, size: 0.1 + Math.random() * 0.1,
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
        x: x + 0.2 + Math.random() * 0.6, y: y + 0.2 + Math.random() * 0.6, z: 0.5 + Math.random() * 0.5,
        vx: 0, vy: 0, vz: 0.02 + Math.random() * 0.03,
        life: 50, maxLife: 50, color: color, size: 0.05 + Math.random() * 0.1,
        gravity: 0, friction: 1
      });
    }
  }

  // --- MOTOR DE FÍSICA ---
  update() {
    if (this.screenShake > 0) {
        this.screenShake *= 0.9;
        if (this.screenShake < 0.5) this.screenShake = 0;
    }

    this.effects.forEach(effect => {
      if (effect.type === 'particle') {
        // Lógica especial para partículas orbitales (Stun)
        if (effect.isOrbiting) {
            effect.angle += effect.orbitalSpeed;
            // Recalcular posición basada en el centro original y el ángulo actual
            // (Necesitamos guardar el centro original, usaremos x/y iniciales como referencia aproximada)
            const centerX = effect.x; // Simplificación: giran sobre su punto de spawn
            const centerY = effect.y;
            effect.x = centerX + Math.cos(effect.angle) * effect.radius * 0.1; // * 0.1 para que sea sutil el movimiento en X
            // El movimiento principal es en Z (profundidad) y visualmente en X
        } else {
            // Física normal
            effect.x += effect.vx;
            effect.y += effect.vy;
        }
        
        // Simulación de Altura (Z)
        if (effect.z !== undefined && !effect.isOrbiting) { // Los orbitales no caen
            effect.z += effect.vz;
            if (effect.z > 0) {
                effect.vz -= effect.gravity;
            } else {
                effect.z = 0;
                if (effect.bounces > 0 && Math.abs(effect.vz) > 0.05) {
                    effect.vz *= -0.5; effect.bounces--;
                } else {
                    effect.vz = 0; effect.vx *= 0.5; effect.vy *= 0.5;
                }
            }
        }

        if (effect.friction && !effect.isOrbiting) {
          effect.vx *= effect.friction; effect.vy *= effect.friction;
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
      const zOffset = effect.z || 0;
      
      // Para el stun, calculamos la posición orbital visual aquí
      let finalX = effect.x;
      let finalY = effect.y;
      
      if (effect.isOrbiting) {
          // El movimiento orbital se ve como una elipse sobre la cabeza
          finalX = effect.x + Math.cos(effect.angle) * effect.radius;
          // Achatamos el círculo en Y para dar perspectiva 
          finalY = effect.y + Math.sin(effect.angle) * effect.radius * 0.3; 
      }

      const screenX = (finalX - offsetX) * tileSize;
      const screenY = (finalY - offsetY - zOffset) * tileSize;

      // Sombra (solo para no orbitales)
      if (zOffset > 0.1 && !effect.isOrbiting) {
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          const shadowY = (finalY - offsetY) * tileSize;
          const shadowSize = effect.size * tileSize * (1 - zOffset * 0.5);
          if (shadowSize > 0) ctx.fillRect(screenX, shadowY, shadowSize, shadowSize * 0.5);
      }

      const alpha = Math.min(1, effect.life / (effect.isOrbiting ? 10 : 30)); // Fade out más rápido al final para stun
      ctx.globalAlpha = alpha;
      ctx.fillStyle = effect.color;

      const size = effect.size * tileSize;
      
      if (effect.style === 'rect') {
        ctx.fillRect(screenX, screenY, size, size);
      } else if (effect.style === 'circle') {
        ctx.beginPath(); ctx.arc(screenX, screenY, size, 0, Math.PI * 2); ctx.fill();
      } else if (effect.style === 'star') {
        // Dibujar una estrella simple (dos rectángulos cruzados rotados)
        ctx.save();
        ctx.translate(screenX, screenY);
        if(effect.isOrbiting) ctx.rotate(effect.angle * 2); // Que giren sobre sí mismas también
        ctx.fillRect(-size/2, -size/6, size, size/3);
        ctx.fillRect(-size/6, -size/2, size/3, size);
        ctx.restore();
      }
    });

    // 2. DIBUJAR TEXTOS
    texts.forEach(effect => {
      const screenX = (effect.x - offsetX) * tileSize;
      const screenY = (effect.y - offsetY + effect.offsetY) * tileSize;
      
      const alpha = Math.min(1, effect.life / 20);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = effect.color;
      
      // CAMBIO 3: Lógica de tamaño de fuente actualizada
      // Crítico (20) > Habilidad (18) > Normal (14) > Pequeño (10)
      let fontSize = 14;
      if (effect.isCritical) fontSize = 24; // Crítico muy grande
      else if (effect.isSkillHit) fontSize = 18; // Habilidad grande
      else if (effect.isSmall) fontSize = 10; // Daño recibido pequeño
      
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textAlign = 'center';
      
      // Borde negro para que se lea bien
      ctx.lineWidth = effect.isCritical || effect.isSkillHit ? 4 : 2;
      ctx.strokeStyle = 'black';
      ctx.strokeText(effect.text, screenX + tileSize/2, screenY + tileSize/2);
      ctx.fillText(effect.text, screenX + tileSize/2, screenY + tileSize/2);
    });

    ctx.restore();
  }
}