// src/engine/systems/EffectSystem.js

export class EffectsManager {
  constructor() {
    this.effects = [];
    this.idCounter = 0;
    this.screenShake = 0;
  }

  // --- SCREEN SHAKE ---
  addShake(amount) {
    this.screenShake = Math.min(this.screenShake + amount, 25);
  }

  // --- TEXTO FLOTANTE ---
  addText(x, y, text, color = '#fff', isCritical = false, isSmall = false, isSkillHit = false) {
    this.effects.push({
      id: this.idCounter++,
      type: 'text',
      x, y,
      text,
      color,
      isCritical,
      isSmall,
      isSkillHit,
      life: isCritical ? 90 : 60,
      maxLife: isCritical ? 90 : 60,
      vx: isCritical ? (Math.random() - 0.5) * 0.1 : 0,
      vy: isCritical ? -0.1 : -0.05,
      offsetY: 0
    });
  }

  // --- EFECTO DE STUN (Estrellas girando) ---
  addStunEffect(x, y) {
    const color = '#fbbf24'; // Amarillo dorado
    for (let i = 0; i < 5; i++) {
      this.effects.push({
        id: this.idCounter++,
        type: 'particle',
        style: 'star',
        x: x + 0.5, 
        y: y + 0.2, 
        z: 0.8,
        angle: (Math.PI * 2 * i) / 5,
        radius: 0.3,
        orbitalSpeed: 0.15,
        vx: 0, vy: 0, vz: 0,
        life: 60, maxLife: 60,
        color: color,
        size: 0.12,
        gravity: 0, friction: 1,
        isOrbiting: true
      });
    }
  }

  // --- NUEVO: AÑADIR PROYECTIL ---
  addProjectile(startX, startY, targetX, targetY, color = '#fbbf24', style = 'circle') {
    this.effects.push({
      id: this.idCounter++,
      type: 'projectile',
      x: startX + 0.5,    // Centro de la casilla origen
      y: startY + 0.5,
      targetX: targetX + 0.5, // Centro de la casilla destino
      targetY: targetY + 0.5,
      color,
      style, // 'circle', 'arrow', 'fireball'
      speed: 0.4, // Velocidad de viaje
      life: 30,   // Tiempo de vida de seguridad
      reached: false
    });
  }

  // --- PARTICULAS (Sangre/Explosión/Chispas) ---
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
      // --- LÓGICA PROYECTILES ---
      if (effect.type === 'projectile') {
         const dx = effect.targetX - effect.x;
         const dy = effect.targetY - effect.y;
         const dist = Math.sqrt(dx*dx + dy*dy);
         
         if (dist < effect.speed) {
             // Llegó al destino: forzamos posición final y matamos efecto
             effect.x = effect.targetX;
             effect.y = effect.targetY;
             effect.reached = true; 
             effect.life = 0; 
             // Opcional: Generar chispas al impactar
             this.addExplosion(Math.floor(effect.x), Math.floor(effect.y), effect.color);
         } else {
             // Mover hacia el objetivo
             const angle = Math.atan2(dy, dx);
             effect.x += Math.cos(angle) * effect.speed;
             effect.y += Math.sin(angle) * effect.speed;
             effect.angle = angle; // Guardamos ángulo para rotar la flecha al dibujar
         }
      } 
      // --- LÓGICA PARTÍCULAS ---
      else if (effect.type === 'particle') {
        if (effect.isOrbiting) {
            effect.angle += effect.orbitalSpeed;
            const centerX = effect.x; 
            const centerY = effect.y;
            // Movimiento elíptico (perspectiva)
            effect.x = centerX + Math.cos(effect.angle) * effect.radius * 0.1;
        } else {
            effect.x += effect.vx;
            effect.y += effect.vy;
        }
        
        if (effect.z !== undefined && !effect.isOrbiting) {
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
      } 
      // --- LÓGICA TEXTO ---
      else if (effect.type === 'text') {
        effect.x += effect.vx;
        effect.y += effect.vy;
        effect.vy *= 0.9; 
        effect.offsetY += effect.vy; 
      }
      
      // Reducir vida (si no es proyectil, o si lo es para seguridad)
      if (effect.type !== 'projectile' || effect.life > 0) {
          effect.life--;
      }
    });

    this.effects = this.effects.filter(e => e.life > 0);
  }

  // --- RENDERIZADO ---
  draw(ctx, offsetX, offsetY, tileSize) {
    ctx.save();

    const particles = [];
    const texts = [];
    const projectiles = [];

    // Separar por tipo para dibujar en orden
    this.effects.forEach(e => {
        if (e.type === 'text') texts.push(e);
        else if (e.type === 'projectile') projectiles.push(e);
        else particles.push(e);
    });

    // 1. DIBUJAR PROYECTILES (Debajo de partículas y texto)
    projectiles.forEach(p => {
        const screenX = (p.x - offsetX) * tileSize;
        const screenY = (p.y - offsetY) * tileSize;
        const size = tileSize * 0.3; // Tamaño del proyectil

        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(screenX, screenY);
        
        if (p.style === 'arrow') {
            ctx.rotate(p.angle || 0);
            ctx.beginPath();
            // Forma de flecha simple
            ctx.moveTo(size/2, 0);
            ctx.lineTo(-size/2, -size/4);
            ctx.lineTo(-size/2, size/4);
            ctx.fill();
        } else {
            // Bola de energía/fuego
            ctx.beginPath(); 
            ctx.arc(0, 0, size/2, 0, Math.PI*2); 
            ctx.fill();
            // Cola/Estela simple
            ctx.globalAlpha = 0.5;
            ctx.beginPath(); 
            ctx.arc(-size/2, 0, size/3, 0, Math.PI*2); 
            ctx.fill();
        }
        ctx.restore();
    });

    // 2. DIBUJAR PARTÍCULAS
    particles.forEach(effect => {
      const zOffset = effect.z || 0;
      
      let finalX = effect.x;
      let finalY = effect.y;
      
      if (effect.isOrbiting) {
          finalX = effect.x + Math.cos(effect.angle) * effect.radius;
          finalY = effect.y + Math.sin(effect.angle) * effect.radius * 0.3; 
      }

      const screenX = (finalX - offsetX) * tileSize;
      const screenY = (finalY - offsetY - zOffset) * tileSize;

      if (zOffset > 0.1 && !effect.isOrbiting) {
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          const shadowY = (finalY - offsetY) * tileSize;
          const shadowSize = effect.size * tileSize * (1 - zOffset * 0.5);
          if (shadowSize > 0) ctx.fillRect(screenX, shadowY, shadowSize, shadowSize * 0.5);
      }

      const alpha = Math.min(1, effect.life / (effect.isOrbiting ? 10 : 30));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = effect.color;

      const size = effect.size * tileSize;
      
      if (effect.style === 'rect') {
        ctx.fillRect(screenX, screenY, size, size);
      } else if (effect.style === 'circle') {
        ctx.beginPath(); ctx.arc(screenX, screenY, size, 0, Math.PI * 2); ctx.fill();
      } else if (effect.style === 'star') {
        ctx.save();
        ctx.translate(screenX, screenY);
        if(effect.isOrbiting) ctx.rotate(effect.angle * 2);
        ctx.fillRect(-size/2, -size/6, size, size/3);
        ctx.fillRect(-size/6, -size/2, size/3, size);
        ctx.restore();
      }
    });

    // 3. DIBUJAR TEXTOS (Siempre encima)
    texts.forEach(effect => {
      const screenX = (effect.x - offsetX) * tileSize;
      const screenY = (effect.y - offsetY + effect.offsetY) * tileSize;
      
      const alpha = Math.min(1, effect.life / 20);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = effect.color;
      
      let fontSize = 14;
      if (effect.isCritical) fontSize = 24;
      else if (effect.isSkillHit) fontSize = 18;
      else if (effect.isSmall) fontSize = 10;
      
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textAlign = 'center';
      
      ctx.lineWidth = effect.isCritical || effect.isSkillHit ? 4 : 2;
      ctx.strokeStyle = 'black';
      ctx.strokeText(effect.text, screenX + tileSize/2, screenY + tileSize/2);
      ctx.fillText(effect.text, screenX + tileSize/2, screenY + tileSize/2);
    });

    ctx.restore();
  }
}