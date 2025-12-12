// src/renderer/npcs.js
import { soundManager } from "@/engine/systems/SoundSystem";

export const NPC_SPRITES = {
  merchant: {
    draw: (ctx, x, y, size, frame) => {
      const s = size;
      const breath = Math.sin(frame * 0.05) * s * 0.02;

      // 1. ALFOMBRA (Base)
      ctx.fillStyle = "#78350f";
      ctx.fillRect(x + s * 0.1, y + s * 0.85, s * 0.8, s * 0.15);
      ctx.fillStyle = "#b45309"; // Borlas
      ctx.fillRect(x + s * 0.05, y + s * 0.85, s * 0.05, s * 0.15);
      ctx.fillRect(x + s * 0.9, y + s * 0.85, s * 0.05, s * 0.15);

      // 2. CAJA DE MERCANCÍA (Atrás izquierda)
      ctx.fillStyle = "#5c3a21";
      ctx.fillRect(x + s * 0.1, y + s * 0.5, s * 0.25, s * 0.25);
      ctx.fillStyle = "#3e2515"; // Detalle madera
      ctx.fillRect(x + s * 0.12, y + s * 0.52, s * 0.21, s * 0.21);
      // Item en la caja (Poción roja)
      ctx.fillStyle = "#ef4444";
      ctx.beginPath(); ctx.arc(x + s * 0.22, y + s * 0.55, s * 0.06, 0, Math.PI * 2); ctx.fill();

      // 3. NPC (Mercader)
      // Túnica
      ctx.fillStyle = "#854d0e";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5, y + s * 0.25 + breath);
      ctx.lineTo(x + s * 0.8, y + s * 0.9);
      ctx.lineTo(x + s * 0.3, y + s * 0.9);
      ctx.closePath();
      ctx.fill();
      
      // Cara
      ctx.fillStyle = "#d4a574";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.28 + breath, s * 0.14, 0, Math.PI * 2);
      ctx.fill();
      
      // Barba
      ctx.fillStyle = "#78716c";
      ctx.beginPath();
      ctx.ellipse(x + s * 0.5, y + s * 0.38 + breath, s * 0.1, s * 0.08, 0, 0, Math.PI);
      ctx.fill();
      
      // Turbante
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.2 + breath, s * 0.13, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x + s * 0.3, y + s * 0.18 + breath, s * 0.4, s * 0.06);
      
      // Moneda flotante (Animación)
      const float = Math.sin(frame * 0.1) * s * 0.05;
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(x + s * 0.75, y + s * 0.5 + float, s * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff"; // Brillo
      ctx.beginPath();
      ctx.arc(x + s * 0.77, y + s * 0.48 + float, s * 0.02, 0, Math.PI * 2);
      ctx.fill();
    },
  },

  quest_elder: {
    draw: (ctx, x, y, size, frame) => {
      const s = size;
      const breath = Math.sin(frame * 0.04) * s * 0.01;

      // Túnica
      ctx.fillStyle = "#1e3a5f";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5, y + s * 0.25 + breath);
      ctx.lineTo(x + s * 0.75, y + s * 0.9);
      ctx.lineTo(x + s * 0.25, y + s * 0.9);
      ctx.closePath();
      ctx.fill();
      
      // Detalles dorados en túnica
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(x + s * 0.48, y + s * 0.4 + breath, s * 0.04, s * 0.5);

      // Cara
      ctx.fillStyle = "#fcd5b8";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.28 + breath, s * 0.14, 0, Math.PI * 2);
      ctx.fill();
      
      // Barba larga blanca
      ctx.fillStyle = "#e5e5e5";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.35, y + s * 0.35 + breath);
      ctx.quadraticCurveTo(x + s * 0.5, y + s * 0.7 + breath, x + s * 0.65, y + s * 0.35 + breath);
      ctx.fill();
      
      // Capucha
      ctx.fillStyle = "#1e40af";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.22 + breath, s * 0.16, Math.PI, Math.PI * 2);
      ctx.fill();
      
      // Bastón (Estático)
      ctx.fillStyle = "#78350f";
      ctx.fillRect(x + s * 0.72, y + s * 0.15, s * 0.05, s * 0.75);
      
      // Orbe pulsante
      const glow = 6 + Math.sin(frame * 0.1) * 3;
      ctx.fillStyle = "#60a5fa";
      ctx.shadowColor = "#60a5fa";
      ctx.shadowBlur = glow;
      ctx.beginPath();
      ctx.arc(x + s * 0.745, y + s * 0.15, s * 0.07, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    },
  },

  sage: {
    draw: (ctx, x, y, size, frame) => {
      const s = size;
      const hover = Math.sin(frame * 0.08) * s * 0.05;
      const yAnim = y + hover;

      // Túnica Mística
      ctx.fillStyle = "#581c87";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5, yAnim + s * 0.2);
      ctx.lineTo(x + s * 0.8, yAnim + s * 0.9);
      ctx.lineTo(x + s * 0.2, yAnim + s * 0.9);
      ctx.closePath();
      ctx.fill();
      
      // Símbolo flotante en el pecho
      ctx.save();
      ctx.translate(x + s * 0.5, yAnim + s * 0.55);
      ctx.rotate(frame * 0.05);
      ctx.strokeStyle = "#d8b4fe";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.1);
      ctx.lineTo(s * 0.09, s * 0.05);
      ctx.lineTo(-s * 0.09, s * 0.05);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // Cara
      ctx.fillStyle = "#c4b5fd";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, yAnim + s * 0.28, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
      
      // Ojos brillantes
      ctx.fillStyle = "#a855f7";
      ctx.fillRect(x + s * 0.42, yAnim + s * 0.25, s * 0.06, s * 0.04);
      ctx.fillRect(x + s * 0.52, yAnim + s * 0.25, s * 0.06, s * 0.04);

      // --- LIBRO FLOTANTE ---
      const bookX = x + s * 0.85;
      const bookY = yAnim + s * 0.3 + Math.cos(frame * 0.1) * s * 0.05;
      
      ctx.fillStyle = "#451a03"; // Portada
      ctx.fillRect(bookX, bookY, s * 0.25, s * 0.3);
      ctx.fillStyle = "#fefce8"; // Páginas
      ctx.fillRect(bookX + 2, bookY + 2, s * 0.2, s * 0.25);
      
      // Texto mágico simulado
      ctx.fillStyle = "#a855f7";
      ctx.fillRect(bookX + 4, bookY + 6, s * 0.15, 1);
      ctx.fillRect(bookX + 4, bookY + 10, s * 0.10, 1);
    },
  },

  blacksmith: {
    draw: (ctx, x, y, size, frame) => {
      const s = size * 1.2;
      const adjX = x - size * 0.1;
      const adjY = y - size * 0.4;

      const c = {
        skin: "#854d0e", 
        beard: "#0f172a",
        apron: "#a16207", 
        apronDark: "#713f12",
        shirt: "#d4d4d8", 
        metalDark: "#334155",
        metalMid: "#475569", 
        metalLight: "#94a3b8",
        metalHighlight: "#cbd5e1", 
        stoneDark: "#292524",
        stoneMid: "#44403c",
        stoneLight: "#78716c",
        fire: ["#ef4444", "#f97316", "#facc15", "#ffffff"],
        hotMetal: "#fca5a5",
        smoke: "rgba(200, 200, 200, 0.3)",
        wood: "#451a03",
        woodGrain: "#351202"
      };

      const forgeX = adjX + size * 0.9;
      const forgeY = adjY + s * 0.1;

      // ==========================================
      // 1. LA FORJA DETALLADA (Fondo)
      // ==========================================
      // -- Estructura Principal --
      // Fondo más oscuro para dar profundidad
      ctx.fillStyle = "#1c1917"; 
      ctx.fillRect(forgeX + s*0.05, forgeY + s*0.05, s*1.1, s*0.95);
      
      ctx.fillStyle = c.stoneDark; 
      ctx.fillRect(forgeX, forgeY, s*1.1, s*0.95);
      
      ctx.fillStyle = c.stoneMid; 
      // Ladrillos
      for(let i=0; i<5; i++) { 
          let off = (i%2===0) ? 0 : s*0.1; 
          ctx.fillRect(forgeX + off + s*0.05, forgeY + i*s*0.18 + s*0.05, s*0.35, s*0.12);
          ctx.fillRect(forgeX + off + s*0.5, forgeY + i*s*0.18 + s*0.05, s*0.35, s*0.12);
      }

      // -- Boca y Fuego --
      ctx.fillStyle = "#1c1917"; // Borde arco
      ctx.beginPath(); ctx.arc(forgeX + s*0.55, forgeY + s*0.75, s*0.45, Math.PI, 0); ctx.fill();
      
      ctx.fillStyle = c.stoneDark; ctx.beginPath(); ctx.moveTo(forgeX + s*0.15, forgeY + s*0.75); ctx.arc(forgeX + s*0.55, forgeY + s*0.75, s*0.4, Math.PI, 0); ctx.lineTo(forgeX + s*0.95, forgeY + s*0.95); ctx.lineTo(forgeX + s*0.15, forgeY + s*0.95); ctx.fill();
      
      ctx.strokeStyle = c.stoneLight; ctx.lineWidth = s*0.08; ctx.beginPath(); ctx.arc(forgeX + s*0.55, forgeY + s*0.75, s*0.4, Math.PI, 0); ctx.stroke();
      const fireAnim = Math.sin(frame * 0.3); const fireX = forgeX + s*0.55; const fireY = forgeY + s*0.85;
      ctx.fillStyle = c.fire[0]; ctx.beginPath(); ctx.arc(fireX, fireY, s*0.25, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = c.fire[1]; ctx.beginPath(); ctx.arc(fireX, fireY-s*0.05, s*(0.2 + fireAnim*0.02), 0, Math.PI*2); ctx.fill();
      
      // -- CHIMENEA (CAMPANA TRAPEZOIDAL) --
      // Visualmente separada del cuerpo principal
      ctx.fillStyle = c.stoneDark;
      ctx.beginPath();
      // Base ancha (voladizo)
      ctx.moveTo(forgeX + s*0.15, forgeY - s*0.15); 
      ctx.lineTo(forgeX + s*0.95, forgeY - s*0.15);
      // Estrechamiento hacia arriba
      ctx.lineTo(forgeX + s*0.75, forgeY - s*0.5); 
      ctx.lineTo(forgeX + s*0.35, forgeY - s*0.5);
      ctx.closePath();
      ctx.fill();

      // Borde inferior de la campana (Separación visual)
      ctx.fillStyle = "#1c1917"; // Sombra
      ctx.fillRect(forgeX + s*0.15, forgeY - s*0.15, s*0.8, s*0.05); 
      ctx.fillStyle = c.stoneMid; // Borde iluminado
      ctx.fillRect(forgeX + s*0.15, forgeY - s*0.2, s*0.8, s*0.05); 
      
      ctx.fillStyle = c.smoke; 
      for(let i=0; i<4; i++) {
          const smokeOffset = (frame * 1.5 + i * 30) % 120; const t = smokeOffset / 120;
          const smokeY = (forgeY - s*0.5) - (smokeOffset * s * 0.015); 
          const spread = (Math.random()-0.5) * s * 0.2;
          const smokeX = (forgeX + s*0.55) + Math.sin(smokeOffset * 0.08) * s * 0.2 * t + spread * t;
          ctx.globalAlpha = 1 - t; ctx.beginPath(); ctx.arc(smokeX, smokeY, s * (0.1 + t * 0.25), 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1.0;
      }

      // ==========================================
      // 2. YUNQUE (Sin cambios)
      // ==========================================
      const anvilX = adjX + s * 0.75;
      const anvilY = adjY + s * 0.75;
      
      ctx.fillStyle = c.wood; ctx.fillRect(anvilX - s*0.1, anvilY + s*0.2, s*0.5, s*0.25);
      ctx.fillStyle = c.woodGrain; ctx.fillRect(anvilX, anvilY + s*0.25, s*0.3, s*0.05); ctx.fillRect(anvilX-s*0.05, anvilY + s*0.35, s*0.4, s*0.03);
      
      ctx.fillStyle = c.metalDark;
      ctx.fillRect(anvilX - s*0.1, anvilY + s*0.2, s*0.6, s*0.05); 
      ctx.beginPath(); ctx.moveTo(anvilX - s*0.25, anvilY + s*0.02); ctx.lineTo(anvilX + s*0.5, anvilY + s*0.02); ctx.lineTo(anvilX + s*0.45, anvilY + s*0.2); ctx.lineTo(anvilX + s*0.05, anvilY + s*0.2); ctx.fill();

      ctx.fillStyle = c.metalMid;
      ctx.fillRect(anvilX, anvilY + s*0.02, s*0.5, s*0.1); 
      ctx.beginPath(); ctx.moveTo(anvilX, anvilY + s*0.02); ctx.lineTo(anvilX, anvilY + s*0.12); ctx.quadraticCurveTo(anvilX - s*0.15, anvilY + s*0.08, anvilX - s*0.25, anvilY + s*0.02); ctx.fill();

      ctx.fillStyle = c.metalLight;
      ctx.beginPath(); ctx.moveTo(anvilX - s*0.25, anvilY); ctx.lineTo(anvilX + s*0.5, anvilY); ctx.lineTo(anvilX + s*0.5, anvilY + s*0.05); ctx.lineTo(anvilX + s*0.05, anvilY + s*0.05); ctx.quadraticCurveTo(anvilX, anvilY + s*0.08, anvilX - s*0.25, anvilY); ctx.fill();
      
      ctx.fillStyle = c.metalHighlight; ctx.fillRect(anvilX, anvilY, s*0.5, s*0.02);
      ctx.fillStyle = c.metalDark; ctx.fillRect(anvilX + s*0.35, anvilY + s*0.01, s*0.06, s*0.06);

      // ==========================================
      // 3. EL HERRERO - CAPA TRASERA (BRAZO MARTILLO)
      // ==========================================
      const smithX = adjX + s * 0.25;
      const smithY = adjY + s * 0.3;
      const breath = Math.sin(frame * 0.08) * s * 0.01;
      const ingotX = anvilX + s*0.15; const ingotY = anvilY - s*0.05;

      const cycle = frame % 60;
      let armRot = 0, forearmRot = 0, hit = false, metalGlow = 0;
      if (cycle < 30) { const t = cycle/30; armRot = -Math.PI/1.8 * t; forearmRot = -Math.PI/3 * t; }
      else if (cycle < 40) { armRot = -Math.PI/1.8; forearmRot = -Math.PI/3; }
      else if (cycle < 45) { const t = (cycle-40)/5; armRot = -Math.PI/1.8 + (Math.PI/1.8 + 0.1)*t; forearmRot = -Math.PI/3 + (Math.PI/3 + 0.2)*t; if(cycle>=43){hit=true; metalGlow=1;}}
      else { const t = (cycle-45)/15; armRot = 0.1 - 0.1*t; forearmRot = 0.2 - 0.2*t; metalGlow = 1-t;}

      if (cycle === 43) {
          soundManager.play('anvil');
      }

      ctx.save();
      ctx.translate(smithX + s*0.35, smithY + s*0.25 + breath); 
      ctx.rotate(armRot);
      ctx.fillStyle = "#6b3d0a"; ctx.fillRect(0, -s*0.06, s*0.25, s*0.14); 
      
      // CAMBIO: Antebrazo aún más corto (s*0.12)
      ctx.translate(s*0.25, 0); ctx.rotate(forearmRot); ctx.fillRect(0, -s*0.05, s*0.12, s*0.12);
      
      // CAMBIO: Mango del martillo más corto
      ctx.translate(s*0.12, 0); ctx.rotate(Math.PI/2);
      ctx.fillStyle = c.wood; ctx.fillRect(-s*0.05, -s*0.1, s*0.1, s*0.15); // Mango corto
      ctx.fillStyle = c.metalDark; ctx.fillRect(-s*0.12, -s*0.25, s*0.24, s*0.15); 
      ctx.fillStyle = c.metalLight; ctx.fillRect(-s*0.12, -s*0.12, s*0.24, s*0.03); 
      ctx.restore();

      // ==========================================
      // 4. EL HERRERO - CUERPO
      // ==========================================
      ctx.fillStyle = "#292524"; ctx.fillRect(smithX + s*0.05, smithY + s*0.65, s*0.12, s*0.3); ctx.fillRect(smithX + s*0.25, smithY + s*0.7, s*0.12, s*0.3);
      ctx.fillStyle = "#0f0f0f"; ctx.fillRect(smithX + s*0.03, smithY + s*0.9, s*0.16, s*0.1); ctx.fillRect(smithX + s*0.23, smithY + s*0.95, s*0.16, s*0.1);
      
      ctx.fillStyle = c.shirt; 
      ctx.fillRect(smithX + s*0.05, smithY + s*0.15 + breath, s*0.35, s*0.5);
      ctx.beginPath();
      ctx.fill();

      ctx.fillStyle = c.apron; ctx.beginPath(); ctx.moveTo(smithX + s*0.1, smithY + s*0.25 + breath); ctx.lineTo(smithX + s*0.4, smithY + s*0.3 + breath); ctx.lineTo(smithX + s*0.4, smithY + s*0.8 + breath); ctx.lineTo(smithX + s*0.05, smithY + s*0.75 + breath); ctx.fill();
      ctx.fillStyle = c.apronDark; ctx.fillRect(smithX + s*0.05, smithY + s*0.45 + breath, s*0.35, s*0.08);
      
      ctx.fillStyle = c.skin; ctx.fillRect(smithX + s*0.1, smithY - s*0.05 + breath, s*0.25, s*0.25);
      ctx.fillStyle = c.beard; ctx.beginPath(); ctx.moveTo(smithX + s*0.35, smithY + s*0.05 + breath); ctx.lineTo(smithX + s*0.45, smithY + s*0.25 + breath); ctx.lineTo(smithX + s*0.2, smithY + s*0.3 + breath); ctx.lineTo(smithX + s*0.1, smithY + s*0.2 + breath); ctx.fill();
      ctx.fillRect(smithX + s*0.05, smithY - s*0.08 + breath, s*0.3, s*0.1); 
      ctx.fillStyle = "#000"; ctx.fillRect(smithX + s*0.3, smithY + s*0.05 + breath, s*0.04, s*0.03); 
      
      // -- CAMBIO: Brazo Izquierdo (Tenazas) RECTO Y ABAJO --
      ctx.save(); 
      // Punto de origen más abajo
      ctx.translate(smithX + s*0.25, smithY + s*0.35 + breath); 
      
      // Rotación directa hacia el yunque (sin articulación extraña)
      ctx.rotate(0.6); 
      
      ctx.fillStyle = c.skin;
      // Brazo entero (recto)
      ctx.fillRect(0, -s*0.05, s*0.45, s*0.1);
      
      // Tenazas en la punta
      ctx.translate(s*0.45, 0); 
      ctx.fillStyle = c.metalDark; ctx.fillRect(0, -s*0.05, s*0.3, s*0.05); ctx.fillRect(0, s*0.05, s*0.3, s*0.05); ctx.fillRect(s*0.3, -s*0.05, s*0.05, s*0.15);
      ctx.restore();

      // ==========================================
      // 5. EFECTOS (Primerísimo plano)
      // ==========================================
      ctx.fillStyle = metalGlow > 0 ? "#ffffff" : c.hotMetal; ctx.shadowColor = c.fire[1]; ctx.shadowBlur = metalGlow * 25; ctx.fillRect(ingotX, ingotY, s*0.25, s*0.06); ctx.shadowBlur = 0;
      if (hit) {
          ctx.fillStyle = "#fbbf24";
          for(let i=0; i<10; i++) {
              const angle = -Math.PI/4 + (Math.random()-0.5)*0.8; const dist = s*(0.1+Math.random()*0.3);
              ctx.fillRect(ingotX + s*0.1 + Math.cos(angle)*dist, ingotY + Math.sin(angle)*dist, s*(0.02+Math.random()*0.03), s*(0.02+Math.random()*0.03));
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

export function drawNPC(ctx, npcType, x, y, size, frame = 0) {
  drawShadow(ctx, x, y, size);
  
  const spriteKey = npcType === "merchant" ? "merchant" :
                    npcType === "quest_giver" ? "quest_elder" :
                    npcType === "sage" ? "sage" :
                    npcType === "blacksmith" ? "blacksmith" : null;

  if (spriteKey && NPC_SPRITES[spriteKey]) {
    NPC_SPRITES[spriteKey].draw(ctx, x, y, size, frame);
  } else {
    // Fallback genérico
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 3, 0, Math.PI * 2);
    ctx.fill();
  }
}