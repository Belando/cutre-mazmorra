export class EffectsManager {
  constructor() {
    this.effects = [];
    this.idCounter = 0;
  }

  // Añadir un nuevo texto flotante
  addText(x, y, text, color = '#fff', type = 'damage') {
    this.effects.push({
      id: this.idCounter++,
      x,
      y,
      text,
      color,
      type,
      life: 60, // Duración en frames (aprox 1 seg a 60fps)
      maxLife: 60,
      offsetY: 0,
      vx: (Math.random() - 0.5) * 0.05, 
      vy: -0.05 - Math.random() * 0.05 // Flota hacia arriba
    });
  }

  // Actualizar posición y vida de los efectos (Llamar en cada frame)
  update() {
    this.effects.forEach(effect => {
      effect.x += effect.vx;
      effect.y += effect.vy;
      effect.offsetY += effect.vy;
      effect.life--;
    });

    // Eliminar efectos muertos
    this.effects = this.effects.filter(e => e.life > 0);
  }

  // Dibujar los efectos en el canvas
  draw(ctx, offsetX, offsetY, tileSize) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 14px monospace'; 

    this.effects.forEach(effect => {
      // Calcular posición en pantalla
      const screenX = (effect.x - offsetX) * tileSize + tileSize / 2;
      const screenY = (effect.y - offsetY) * tileSize + tileSize / 2;

      // Calcular opacidad
      const alpha = Math.max(0, effect.life / 20);
      
      ctx.globalAlpha = alpha > 1 ? 1 : alpha;
      ctx.fillStyle = effect.color;
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;

      // Dibujar
      ctx.strokeText(effect.text, screenX, screenY);
      ctx.fillText(effect.text, screenX, screenY);
    });

    ctx.restore();
  }
}