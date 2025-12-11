export const NPC_SPRITES = {
  merchant: {
    draw: (ctx, x, y, size, frame) => {
      const s = size;
      // Animación de respiración suave
      const breath = Math.sin(frame * 0.05) * s * 0.02;
      
      // Robe
      ctx.fillStyle = "#854d0e";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5, y + s * 0.25 + breath);
      ctx.lineTo(x + s * 0.8, y + s * 0.9);
      ctx.lineTo(x + s * 0.2, y + s * 0.9);
      ctx.closePath();
      ctx.fill();
      
      // Face
      ctx.fillStyle = "#d4a574";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.28 + breath, s * 0.14, 0, Math.PI * 2);
      ctx.fill();
      
      // Beard
      ctx.fillStyle = "#78716c";
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.38 + breath, s * 0.1, s * 0.08, 0, 0, Math.PI);
      ctx.fill();
      
      // Hat
      ctx.fillStyle = "#92400e";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.2 + breath, s * 0.12, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x + s * 0.3, y + s * 0.18 + breath, s * 0.4, s * 0.06);
      
      // Gold coin indicator (Floating animation)
      const float = Math.sin(frame * 0.1) * s * 0.05;
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(x + s * 0.7, y + s * 0.65 + float, s * 0.08, 0, Math.PI * 2);
      ctx.fill();
      
      // Coin shine
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(x + s * 0.72, y + s * 0.63 + float, s * 0.02, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  quest_elder: {
    draw: (ctx, x, y, size, frame) => {
      const s = size;
      const breath = Math.sin(frame * 0.04) * s * 0.01;

      // Robe
      ctx.fillStyle = "#1e3a5f";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5, y + s * 0.25 + breath);
      ctx.lineTo(x + s * 0.75, y + s * 0.9);
      ctx.lineTo(x + s * 0.25, y + s * 0.9);
      ctx.closePath();
      ctx.fill();
      // Face
      ctx.fillStyle = "#fcd5b8";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.28 + breath, s * 0.14, 0, Math.PI * 2);
      ctx.fill();
      // Long white beard
      ctx.fillStyle = "#e5e5e5";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.35, y + s * 0.35 + breath);
      ctx.quadraticCurveTo(
        x + s * 0.5,
        y + s * 0.7 + breath,
        x + s * 0.65,
        y + s * 0.35 + breath
      );
      ctx.fill();
      // Hood
      ctx.fillStyle = "#1e40af";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.22 + breath, s * 0.16, Math.PI, Math.PI * 2);
      ctx.fill();
      // Staff (Static)
      ctx.fillStyle = "#78350f";
      ctx.fillRect(x + s * 0.72, y + s * 0.15, s * 0.05, s * 0.7);
      
      // Orb pulsing
      const glow = 6 + Math.sin(frame * 0.1) * 3;
      ctx.fillStyle = "#60a5fa";
      ctx.shadowColor = "#60a5fa";
      ctx.shadowBlur = glow;
      ctx.beginPath();
      ctx.arc(x + s * 0.745, y + s * 0.15, s * 0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    },
  },
  sage: {
    draw: (ctx, x, y, size, frame) => {
      const s = size;
      // Hover effect
      const hover = Math.sin(frame * 0.08) * s * 0.05;
      const yAnim = y + hover;

      // Mystical robe
      ctx.fillStyle = "#581c87";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5, yAnim + s * 0.2);
      ctx.lineTo(x + s * 0.8, yAnim + s * 0.9);
      ctx.lineTo(x + s * 0.2, yAnim + s * 0.9);
      ctx.closePath();
      ctx.fill();
      
      // Glowing symbols (Rotating)
      ctx.save();
      ctx.translate(x + s * 0.5, yAnim + s * 0.55);
      ctx.rotate(frame * 0.02);
      ctx.strokeStyle = "#a855f7";
      ctx.shadowColor = "#a855f7";
      ctx.shadowBlur = 6;
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Draw a triangle
      ctx.moveTo(0, -s * 0.15);
      ctx.lineTo(s * 0.13, s * 0.08);
      ctx.lineTo(-s * 0.13, s * 0.08);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      ctx.shadowBlur = 0;

      // Face (ethereal)
      ctx.fillStyle = "#c4b5fd";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, yAnim + s * 0.28, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
      // Eyes (glowing)
      ctx.fillStyle = "#a855f7";
      ctx.shadowColor = "#a855f7";
      ctx.shadowBlur = 8;
      ctx.fillRect(x + s * 0.42, yAnim + s * 0.25, s * 0.06, s * 0.04);
      ctx.fillRect(x + s * 0.52, yAnim + s * 0.25, s * 0.06, s * 0.04);
      ctx.shadowBlur = 0;
    },
  },
  blacksmith: {
    draw: (ctx, x, y, size, frame) => {
      const s = size;
      
      // 1. DIBUJAR YUNQUE (Nuevo)
      ctx.fillStyle = "#334155"; // Gris azulado oscuro (metal)
      // Base del yunque
      ctx.fillRect(x + s * 0.55, y + s * 0.65, s * 0.35, s * 0.25); 
      // Parte superior más ancha
      ctx.fillRect(x + s * 0.5, y + s * 0.6, s * 0.45, s * 0.1); 
      // Punta del yunque
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5, y + s * 0.6);
      ctx.lineTo(x + s * 0.5, y + s * 0.7);
      ctx.lineTo(x + s * 0.35, y + s * 0.62);
      ctx.fill();

      // 2. CUERPO
      const breath = Math.sin(frame * 0.1) * s * 0.01;
      ctx.fillStyle = "#431407"; 
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5, y + s * 0.25 + breath);
      ctx.lineTo(x + s * 0.75, y + s * 0.9); // Un poco más estrecho para dejar ver el yunque
      ctx.lineTo(x + s * 0.25, y + s * 0.9);
      ctx.closePath();
      ctx.fill();
      
      // Delantal
      ctx.fillStyle = "#9a3412"; 
      ctx.fillRect(x + s * 0.35, y + s * 0.4 + breath, s * 0.3, s * 0.45);
      
      // Cabeza
      ctx.fillStyle = "#d4a574";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.28 + breath, s * 0.14, 0, Math.PI * 2);
      ctx.fill();
      
      // Barba
      ctx.fillStyle = "#1c1917";
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.35 + breath, s * 0.12, s * 0.1, 0, 0, Math.PI);
      ctx.fill();

      // 3. ANIMACIÓN DEL MARTILLO
      // Ciclo de golpeo (0 a 1)
      const cycleSpeed = 0.15;
      const cycle = Math.sin(frame * cycleSpeed);
      
      // Lógica: Levanta el brazo despacio, golpea rápido
      let rot = -0.5; // Ángulo base (arriba)
      let isHit = false;
      
      if (cycle > 0.6) {
          // GOLPE (Bajada rápida)
          rot = 0.6; // Ángulo abajo
          isHit = true;
      } else {
          // SUBIDA (Interpolación lenta hacia arriba)
          rot = -0.8 + (cycle + 1) * 0.4;
      }

      // 4. DIBUJAR BRAZO Y MARTILLO
      ctx.save();
      // Punto de pivote: El hombro
      ctx.translate(x + s * 0.65, y + s * 0.45 + breath);
      ctx.rotate(rot);
      
      // Brazo
      ctx.fillStyle = "#d4a574";
      ctx.fillRect(0, -s*0.05, s*0.2, s*0.1); // Brazo saliendo del hombro
      
      // Mango del martillo (perpendicular al brazo)
      ctx.fillStyle = "#52525b";
      ctx.fillRect(s*0.15, -s*0.2, s*0.05, s*0.35);
      
      // Cabeza del martillo
      ctx.fillStyle = "#cbd5e1"; // Metal brillante
      ctx.fillRect(s*0.1, -s*0.25, s*0.15, s*0.12);
      
      ctx.restore();

      // 5. CHISPAS (Solo en el momento del impacto)
      if (isHit) {
          ctx.fillStyle = "#fbbf24"; // Amarillo chispa
          for(let i=0; i<3; i++) {
              // Posición aleatoria cerca del yunque
              const sparkX = x + s * 0.65 + (Math.random()-0.5) * s * 0.2;
              const sparkY = y + s * 0.6 + (Math.random()-0.5) * s * 0.1;
              const sparkSize = s * 0.05;
              ctx.fillRect(sparkX, sparkY, sparkSize, sparkSize);
          }
      }
    },
  },
};

function drawShadow(ctx, x, y, size) {
  const s = size;
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(x + s * 0.5, y + s * 0.85, s * 0.3, s * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
}

// IMPORTANTE: Añadimos 'frame' como último argumento
export function drawNPC(ctx, npcType, x, y, size, frame = 0) {
  drawShadow(ctx, x, y, size);
  // Mapeo simple de tipo a key de sprite
  const spriteKey = npcType === "merchant" ? "merchant" :
                    npcType === "quest_giver" ? "quest_elder" :
                    npcType === "sage" ? "sage" :
                    npcType === "blacksmith" ? "blacksmith" : null;

  if (spriteKey && NPC_SPRITES[spriteKey]) {
    // Pasamos el frame al sprite específico
    NPC_SPRITES[spriteKey].draw(ctx, x, y, size, frame);
  } else {
    // Fallback
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 3, 0, Math.PI * 2);
    ctx.fill();
  }
}