import { ENEMY_STATS } from "@/data/enemies";

const ATTACK_DURATION = 300; 

// Normal enemies and bosses drawing logic
const SPRITES = {
  rat: {
    draw: (ctx, x, y, size, frame, isAttacking, attackProgress, attackDir) => {
      const s = size;
      const angle = Math.atan2(attackDir.y, attackDir.x);
      
      // Salto dirigido
      const lungeDist = isAttacking ? Math.sin(attackProgress * Math.PI) * (s * 0.4) : 0;
      const xAnim = x + (isAttacking ? Math.cos(angle) * lungeDist : 0);
      const yAnim = y + (isAttacking ? Math.sin(angle) * lungeDist : 0) + (!isAttacking ? Math.abs(Math.sin(frame*0.2))*s*0.05 : 0);

      const grad = ctx.createRadialGradient(xAnim + s*0.5, yAnim + s*0.5, 0, xAnim + s*0.5, yAnim + s*0.5, s*0.3);
      grad.addColorStop(0, "#a8a29e");
      grad.addColorStop(1, "#57534e");
      ctx.fillStyle = grad;
      
      ctx.beginPath();
      ctx.ellipse(xAnim + s * 0.5, yAnim + s * 0.5, s * 0.25, s * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cola
      ctx.strokeStyle = "#d6d3d1";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xAnim + s * 0.25, yAnim + s * 0.5);
      const tailWag = Math.sin(frame * 0.3) * 0.1;
      ctx.quadraticCurveTo(xAnim, yAnim + s * 0.4, xAnim - s * 0.1, yAnim + s * 0.3 + tailWag * s);
      ctx.stroke();

      // Cabeza (Orientada si es posible, o simple círculo)
      ctx.fillStyle = "#a8a29e";
      ctx.beginPath();
      ctx.arc(xAnim + s * 0.75, yAnim + s * 0.5, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = isAttacking ? "#ef4444" : "#000";
      ctx.beginPath(); ctx.arc(xAnim + s * 0.78, yAnim + s * 0.48, s * 0.03, 0, Math.PI * 2); ctx.fill();
    },
  },

  bat: {
    draw: (ctx, x, y, size, frame, isAttacking, attackProgress, attackDir) => {
      const s = size;
      const angle = Math.atan2(attackDir.y, attackDir.x);
      
      const hover = Math.sin(frame * 0.15) * (s * 0.1);
      const diveDist = isAttacking ? Math.sin(attackProgress * Math.PI) * (s * 0.5) : 0;
      
      const xAnim = x + (isAttacking ? Math.cos(angle) * diveDist : 0);
      const yAnim = y + hover + (isAttacking ? Math.sin(angle) * diveDist : 0);
      
      ctx.fillStyle = "#101011ff";
      const wingY = Math.sin(frame * (isAttacking ? 1.5 : 0.2)) * (s * 0.15);

      ctx.beginPath();
      ctx.moveTo(xAnim + s * 0.5, yAnim + s * 0.5);
      ctx.quadraticCurveTo(xAnim + s * 0.1, yAnim + s * 0.2 + wingY, xAnim, yAnim + s * 0.4);
      ctx.lineTo(xAnim + s * 0.4, yAnim + s * 0.6);
      ctx.moveTo(xAnim + s * 0.5, yAnim + s * 0.5);
      ctx.quadraticCurveTo(xAnim + s * 0.9, yAnim + s * 0.2 + wingY, xAnim + s, yAnim + s * 0.4);
      ctx.lineTo(xAnim + s * 0.6, yAnim + s * 0.6);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(xAnim + s * 0.5, yAnim + s * 0.5, s * 0.12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ef4444";
      ctx.fillRect(xAnim + s * 0.45, yAnim + s * 0.48, s * 0.04, s * 0.04);
      ctx.fillRect(xAnim + s * 0.51, yAnim + s * 0.48, s * 0.04, s * 0.04);
    },
  },

  slime: {
    draw: (ctx, x, y, size, frame, isAttacking, attackProgress, attackDir) => {
      const s = size;
      const angle = Math.atan2(attackDir.y, attackDir.x);
      
      let centerX = x + s * 0.5;
      let centerY = y + s * 0.7;

      // Estiramiento direccional
      let stretchX = 1; 
      let stretchY = 1;
      
      if (isAttacking) {
          const lunge = Math.sin(attackProgress * Math.PI);
          // Mover el centro en la dirección del ataque
          centerX += Math.cos(angle) * lunge * s * 0.3;
          centerY += Math.sin(angle) * lunge * s * 0.3;
          
          // Deformación simple (más grande al atacar)
          stretchX = 1 + lunge * 0.2;
          stretchY = 1 + lunge * 0.2;
      } else {
          const pulse = Math.sin(frame * 0.15);
          stretchX = 1 + pulse * 0.1;
          stretchY = 1 - pulse * 0.1;
      }

      const gradient = ctx.createRadialGradient(centerX, centerY - s * 0.2, 0, centerX, centerY, s * 0.4);
      gradient.addColorStop(0, "rgba(103, 232, 249, 0.9)");
      gradient.addColorStop(1, "rgba(8, 145, 178, 0.6)");

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(stretchX, stretchY);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.35, Math.PI, 0); 
      ctx.bezierCurveTo(s * 0.35, s * 0.2, -s * 0.35, s * 0.2, -s * 0.35, 0);
      ctx.fill();
      
      ctx.strokeStyle = "rgba(165, 243, 252, 0.5)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ojos miran hacia el ataque
      ctx.fillStyle = "#0e7490";
      ctx.beginPath();
      // Pequeño offset de ojos hacia la dirección
      const eyeDX = Math.cos(angle) * s * 0.1;
      const eyeDY = Math.sin(angle) * s * 0.1;
      
      ctx.arc(-s * 0.1 + eyeDX, -s * 0.1 + eyeDY, s * 0.05, 0, Math.PI * 2);
      ctx.arc(s * 0.1 + eyeDX, -s * 0.1 + eyeDY, s * 0.05, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },
  },

  goblin: {
    draw: (ctx, x, y, size, frame, isAttacking, attackProgress, attackDir, lastMoveTime) => {
      const s = size * 0.85; 
      const offsetX = (size - s) / 2;
      const offsetY = (size - s);
      const gx = x + offsetX;
      const gy = y + offsetY;

      // 1. MOVIMIENTO
      const now = Date.now();
      const isMoving = (now - lastMoveTime) < 300; 
      
      const walkCycle = isMoving ? Math.sin(now * 0.015) : 0;
      const bodyBob = isMoving ? Math.abs(walkCycle) * s * 0.05 : Math.sin(frame * 0.05) * s * 0.02; 
      
      // CAMBIO 3: Movimiento de brazos suavizado (0.3 en lugar de 0.8)
      const armSwing = isMoving ? Math.sin(now * 0.015) * 0.2 : 0; 
      
      const leftLegLift = isMoving && walkCycle > 0 ? walkCycle * s * 0.15 : 0;
      const rightLegLift = isMoving && walkCycle < 0 ? -walkCycle * s * 0.15 : 0;

      const yAnim = gy - bodyBob;

      // PIERNAS
      ctx.fillStyle = "#14532d"; 
      ctx.fillRect(gx + s * 0.35, yAnim + s * 0.75 - leftLegLift, s * 0.12, s * 0.25);
      ctx.fillRect(gx + s * 0.53, yAnim + s * 0.75 - rightLegLift, s * 0.12, s * 0.25);

      // TORSO
      ctx.fillStyle = "#78350f"; 
      ctx.beginPath();
      ctx.moveTo(gx + s * 0.3, yAnim + s * 0.45);
      ctx.lineTo(gx + s * 0.7, yAnim + s * 0.45);
      ctx.lineTo(gx + s * 0.75, yAnim + s * 0.75); 
      ctx.lineTo(gx + s * 0.25, yAnim + s * 0.75);
      ctx.fill();

      ctx.fillStyle = "#a16207"; // Cinturón
      ctx.fillRect(gx + s * 0.3, yAnim + s * 0.65, s * 0.4, s * 0.05);

      // BRAZO IZQUIERDO (Fondo)
      ctx.save();
      ctx.translate(gx + s * 0.3, yAnim + s * 0.5); 
      ctx.rotate((Math.PI / 2) - armSwing); 
      
      ctx.fillStyle = "#4ade80";
      ctx.beginPath();
      ctx.moveTo(0, -s*0.05);
      ctx.lineTo(s * 0.25, 0); 
      ctx.lineTo(0, s*0.05); 
      ctx.fill();
      // Mano izquierda
      ctx.beginPath(); ctx.arc(s*0.25, 0, s*0.06, 0, Math.PI*2); ctx.fill();
      ctx.restore();

      // BRAZO DERECHO (Ataque/Arma)
      ctx.save();
      ctx.translate(gx + s * 0.7, yAnim + s * 0.5); // Hombro

      let armRot = (Math.PI / 2) + armSwing;

      if (isAttacking) {
           const angle = Math.atan2(attackDir.y, attackDir.x);
           const stab = Math.sin(attackProgress * Math.PI);
           armRot = angle; 
           const thrustDist = stab * s * 0.3;
           ctx.translate(Math.cos(angle) * thrustDist, Math.sin(angle) * thrustDist);
      }
      
      ctx.rotate(armRot);
      
      // Dibujar Brazo
      ctx.fillStyle = "#4ade80";
      ctx.beginPath();
      ctx.moveTo(0, -s*0.05); 
      ctx.lineTo(s * 0.25, 0); // Muñeca
      ctx.lineTo(0, s*0.05);   
      ctx.fill();

      // CAMBIO 2: DIBUJAR MANO (Puño visible)
      ctx.fillStyle = "#4ade80"; 
      ctx.beginPath();
      ctx.arc(s * 0.25, 0, s * 0.07, 0, Math.PI * 2); 
      ctx.fill();

      // --- DAGA ---
      ctx.translate(s * 0.25, 0); // Mover origen a la mano
      
      // Hoja
      ctx.fillStyle = '#9ca3af'; 
      ctx.beginPath();
      ctx.moveTo(0, -s*0.04); 
      ctx.lineTo(s*0.3, 0);    
      ctx.lineTo(0, s*0.04);   
      ctx.fill();
      
      // Brillo Hoja
      ctx.fillStyle = '#d1d5db';
      ctx.beginPath();
      ctx.moveTo(0, -s*0.01);
      ctx.lineTo(s*0.25, 0);
      ctx.lineTo(0, s*0.01);
      ctx.fill();

      // Mango
      ctx.fillStyle = '#4b5563'; 
      ctx.fillRect(-s*0.08, -s*0.03, s*0.08, s*0.06); 
      
      // Guardamanos
      ctx.fillStyle = '#374151';
      ctx.fillRect(0, -s*0.06, s*0.03, s*0.12); 
      
      ctx.restore();

      // CABEZA
      ctx.fillStyle = "#4ade80"; 
      ctx.beginPath();
      ctx.arc(gx + s * 0.5, yAnim + s * 0.35, s * 0.18, 0, Math.PI * 2);
      ctx.fill();

      // NARIZ
      ctx.fillStyle = "#22c55e"; 
      ctx.beginPath();
      ctx.moveTo(gx + s * 0.5, yAnim + s * 0.35);
      ctx.lineTo(gx + s * 0.45, yAnim + s * 0.42);
      ctx.lineTo(gx + s * 0.55, yAnim + s * 0.4);
      ctx.fill();

      // OREJAS
      ctx.beginPath();
      ctx.moveTo(gx + s * 0.35, yAnim + s * 0.35); ctx.lineTo(gx + s * 0.1, yAnim + s * 0.25); ctx.lineTo(gx + s * 0.35, yAnim + s * 0.3); 
      ctx.moveTo(gx + s * 0.65, yAnim + s * 0.35); ctx.lineTo(gx + s * 0.9, yAnim + s * 0.25); ctx.lineTo(gx + s * 0.65, yAnim + s * 0.3); 
      ctx.fill();

      // OJOS
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(gx + s * 0.42, yAnim + s * 0.32, s * 0.035, 0, Math.PI * 2);
      ctx.arc(gx + s * 0.58, yAnim + s * 0.32, s * 0.035, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = "#000";
      ctx.fillRect(gx + s * 0.41, yAnim + s * 0.31, s * 0.02, s * 0.02);
      ctx.fillRect(gx + s * 0.57, yAnim + s * 0.31, s * 0.02, s * 0.02);
    },
  },

  skeleton: {
    draw: (ctx, x, y, size, frame, isAttacking, attackProgress, attackDir) => {
      const s = size;
      const rattle = Math.sin(frame * 0.2) * (s * 0.02);

      ctx.fillStyle = "#e5e5e5";
      ctx.beginPath();
      ctx.arc(x + s * 0.5 + rattle, y + s * 0.3, s * 0.18, 0, Math.PI * 2);
      ctx.fill();
      
      const jawOpen = isAttacking ? Math.sin(attackProgress * Math.PI * 4) * s * 0.05 : 0;
      ctx.fillRect(x + s * 0.4 + rattle, y + s * 0.42 + jawOpen, s * 0.2, s * 0.08);

      ctx.fillStyle = "#171717";
      ctx.beginPath();
      ctx.arc(x + s * 0.45 + rattle, y + s * 0.3, s * 0.05, 0, Math.PI * 2);
      ctx.arc(x + s * 0.55 + rattle, y + s * 0.3, s * 0.05, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#e5e5e5";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5 + rattle, y + s * 0.5); ctx.lineTo(x + s * 0.5 + rattle, y + s * 0.8);
      ctx.moveTo(x + s * 0.35 + rattle, y + s * 0.55); ctx.lineTo(x + s * 0.65 + rattle, y + s * 0.55);
      ctx.stroke();
      
      const angle = Math.atan2(attackDir.y, attackDir.x);
      drawWeapon(ctx, x + s*0.5 + rattle, y + s*0.5, s, 'sword', isAttacking ? attackProgress : 0, angle);
    },
  },

  ghost: {
    draw: (ctx, x, y, size, frame, isAttacking, attackProgress, attackDir) => {
      const s = size;
      const angle = Math.atan2(attackDir.y, attackDir.x);
      const float = Math.sin(frame * 0.1) * (s * 0.1);
      const lunge = isAttacking ? Math.sin(attackProgress * Math.PI) * (s * 0.4) : 0;
      
      const xAnim = x + (isAttacking ? Math.cos(angle) * lunge : 0);
      const yAnim = y + float + (isAttacking ? Math.sin(angle) * lunge : 0);

      const grad = ctx.createLinearGradient(xAnim, yAnim, xAnim, yAnim + s);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0.0)");
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.arc(xAnim + s * 0.5, yAnim + s * 0.4, s * 0.3, Math.PI, 0);
      ctx.lineTo(xAnim + s * 0.8, yAnim + s * 0.8);
      for(let i=0; i<=s*0.6; i+=5) {
          ctx.lineTo(xAnim + s*0.8 - i, yAnim + s*0.8 + Math.sin(i*0.1 + frame*0.2)*5);
      }
      ctx.lineTo(xAnim + s * 0.2, yAnim + s * 0.4);
      ctx.fill();

      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(xAnim + s * 0.4, yAnim + s * 0.35, s * 0.04, 0, Math.PI * 2);
      ctx.arc(xAnim + s * 0.6, yAnim + s * 0.35, s * 0.04, 0, Math.PI * 2);
      ctx.fill();
      
      if (isAttacking) {
          ctx.beginPath();
          ctx.ellipse(xAnim + s*0.5, yAnim + s*0.5, s*0.05, s*0.08, 0, 0, Math.PI*2);
          ctx.fill();
      }

      ctx.shadowColor = "#a5f3fc";
      ctx.shadowBlur = 10;
      ctx.strokeStyle = "rgba(165, 243, 252, 0.5)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
    },
  },

  orc: {
    draw: (ctx, x, y, size, frame, isAttacking, attackProgress, attackDir) => {
      const s = size;
      const yAnim = y + Math.abs(Math.sin(frame * 0.1)) * 2;

      ctx.fillStyle = "#365314";
      ctx.fillRect(x + s * 0.25, yAnim + s * 0.35, s * 0.5, s * 0.4);

      ctx.fillStyle = "#4d7c0f";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, yAnim + s * 0.25, s * 0.22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fef9c3";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.35, yAnim + s * 0.35); ctx.lineTo(x + s * 0.35, yAnim + s * 0.15); ctx.lineTo(x + s * 0.42, yAnim + s * 0.35); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s * 0.65, yAnim + s * 0.35); ctx.lineTo(x + s * 0.65, yAnim + s * 0.15); ctx.lineTo(x + s * 0.58, yAnim + s * 0.35); ctx.fill();
      
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(x + s * 0.35, yAnim + s * 0.22, s * 0.08, s * 0.04);
      ctx.fillRect(x + s * 0.57, yAnim + s * 0.22, s * 0.08, s * 0.04);

      const angle = Math.atan2(attackDir.y, attackDir.x);
      drawWeapon(ctx, x + s*0.5, yAnim + s*0.4, s, 'axe', isAttacking ? attackProgress : 0, angle);
    },
  },

  generic: {
    draw: (ctx, x, y, size, frame, color = "#ef4444", isAttacking, attackProgress, attackDir) => {
      const s = size;
      const pulse = Math.sin(frame * 0.1) * s * 0.05;
      const angle = Math.atan2(attackDir.y, attackDir.x);
      
      const lunge = isAttacking ? Math.sin(attackProgress * Math.PI) * s * 0.3 : 0;
      const xAnim = x + Math.cos(angle) * lunge;
      const yAnim = y + Math.sin(angle) * lunge;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(xAnim + s*0.5, yAnim + s*0.5, s * 0.35 + pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.fillRect(xAnim + s*0.35, yAnim + s*0.4, s * 0.1, s * 0.1);
      ctx.fillRect(xAnim + s*0.55, yAnim + s*0.4, s * 0.1, s * 0.1);
    },
  },


  spider: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Abdomen - big and hairy
      ctx.fillStyle = "#3b0764";
      ctx.beginPath();
      ctx.ellipse(
        x + s * 0.5,
        y + s * 0.6,
        s * 0.22,
        s * 0.18,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      // Fur texture
      ctx.fillStyle = "#581c87";
      ctx.beginPath();
      ctx.arc(x + s * 0.45, y + s * 0.55, s * 0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s * 0.55, y + s * 0.58, s * 0.05, 0, Math.PI * 2);
      ctx.fill();
      // Cephalothorax
      ctx.fillStyle = "#581c87";
      ctx.beginPath();
      ctx.ellipse(
        x + s * 0.5,
        y + s * 0.38,
        s * 0.14,
        s * 0.12,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      // Eyes - multiple red eyes
      ctx.fillStyle = "#dc2626";
      ctx.shadowColor = "#dc2626";
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.arc(x + s * 0.44, y + s * 0.34, s * 0.025, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s * 0.56, y + s * 0.34, s * 0.025, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s * 0.48, y + s * 0.32, s * 0.02, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s * 0.52, y + s * 0.32, s * 0.02, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Fangs
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.46, y + s * 0.42);
      ctx.lineTo(x + s * 0.44, y + s * 0.5);
      ctx.lineTo(x + s * 0.48, y + s * 0.44);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s * 0.54, y + s * 0.42);
      ctx.lineTo(x + s * 0.56, y + s * 0.5);
      ctx.lineTo(x + s * 0.52, y + s * 0.44);
      ctx.fill();
      // Legs - 8 articulated legs
      ctx.strokeStyle = "#581c87";
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const yOffset = i * s * 0.06;
        // Left legs
        ctx.beginPath();
        ctx.moveTo(x + s * 0.36, y + s * 0.4 + yOffset);
        ctx.lineTo(x + s * 0.15, y + s * 0.25 + yOffset);
        ctx.lineTo(x + s * 0.05, y + s * 0.35 + yOffset);
        ctx.stroke();
        // Right legs
        ctx.beginPath();
        ctx.moveTo(x + s * 0.64, y + s * 0.4 + yOffset);
        ctx.lineTo(x + s * 0.85, y + s * 0.25 + yOffset);
        ctx.lineTo(x + s * 0.95, y + s * 0.35 + yOffset);
        ctx.stroke();
      }
    },
  },
  zombie: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Tattered clothes
      ctx.fillStyle = "#52525b";
      ctx.fillRect(x + s * 0.28, y + s * 0.38, s * 0.44, s * 0.38);
      // Tears in clothes
      ctx.fillStyle = "#3b0764";
      ctx.fillRect(x + s * 0.32, y + s * 0.5, s * 0.08, s * 0.12);
      ctx.fillRect(x + s * 0.6, y + s * 0.45, s * 0.06, s * 0.1);
      // Green rotting skin
      ctx.fillStyle = "#4d7c0f";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.26, s * 0.18, 0, Math.PI * 2);
      ctx.fill();
      // Decayed patches
      ctx.fillStyle = "#365314";
      ctx.beginPath();
      ctx.arc(x + s * 0.58, y + s * 0.22, s * 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s * 0.42, y + s * 0.3, s * 0.04, 0, Math.PI * 2);
      ctx.fill();
      // Eyes - one normal, one droopy
      ctx.fillStyle = "#fef9c3";
      ctx.fillRect(x + s * 0.38, y + s * 0.22, s * 0.09, s * 0.07);
      ctx.fillRect(x + s * 0.53, y + s * 0.24, s * 0.09, s * 0.06);
      ctx.fillStyle = "#1c1917";
      ctx.fillRect(x + s * 0.4, y + s * 0.24, s * 0.04, s * 0.04);
      ctx.fillRect(x + s * 0.56, y + s * 0.25, s * 0.04, s * 0.04);
      // Mouth - groaning
      ctx.fillStyle = "#1c1917";
      ctx.fillRect(x + s * 0.42, y + s * 0.34, s * 0.16, s * 0.04);
      // Arms reaching forward
      ctx.fillStyle = "#4d7c0f";
      ctx.save();
      ctx.translate(x + s * 0.25, y + s * 0.45);
      ctx.rotate(-0.5);
      ctx.fillRect(0, 0, s * 0.28, s * 0.08);
      ctx.restore();
      ctx.save();
      ctx.translate(x + s * 0.72, y + s * 0.42);
      ctx.rotate(0.3);
      ctx.fillRect(-s * 0.05, 0, s * 0.28, s * 0.08);
      ctx.restore();
      // Legs
      ctx.fillStyle = "#52525b";
      ctx.fillRect(x + s * 0.32, y + s * 0.74, s * 0.12, s * 0.18);
      ctx.fillRect(x + s * 0.56, y + s * 0.74, s * 0.12, s * 0.18);
    },
  },
  wraith: {
    draw: (ctx, x, y, size) => {
      const s = size;
      const gradient = ctx.createLinearGradient(x, y, x, y + s);
      gradient.addColorStop(0, "rgba(99, 102, 241, 0.9)");
      gradient.addColorStop(1, "rgba(99, 102, 241, 0.1)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5, y + s * 0.1);
      ctx.quadraticCurveTo(x + s * 0.8, y + s * 0.3, x + s * 0.75, y + s * 0.9);
      ctx.lineTo(x + s * 0.25, y + s * 0.9);
      ctx.quadraticCurveTo(x + s * 0.2, y + s * 0.3, x + s * 0.5, y + s * 0.1);
      ctx.fill();
      ctx.fillStyle = "#c7d2fe";
      ctx.shadowColor = "#c7d2fe";
      ctx.shadowBlur = 8;
      ctx.fillRect(x + s * 0.35, y + s * 0.25, s * 0.08, s * 0.06);
      ctx.fillRect(x + s * 0.57, y + s * 0.25, s * 0.08, s * 0.06);
      ctx.shadowBlur = 0;
    },
  },
  dragon: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = "#b45309";
      ctx.fillRect(x + s * 0.3, y + s * 0.4, s * 0.4, s * 0.35);
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(x + s * 0.55, y + s * 0.32, s * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#78350f";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.45, y + s * 0.2);
      ctx.lineTo(x + s * 0.35, y + s * 0.05);
      ctx.lineTo(x + s * 0.5, y + s * 0.15);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s * 0.65, y + s * 0.2);
      ctx.lineTo(x + s * 0.75, y + s * 0.05);
      ctx.lineTo(x + s * 0.6, y + s * 0.15);
      ctx.fill();
      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 4;
      ctx.fillRect(x + s * 0.48, y + s * 0.28, s * 0.06, s * 0.05);
      ctx.fillRect(x + s * 0.58, y + s * 0.28, s * 0.06, s * 0.05);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#92400e";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.2, y + s * 0.45);
      ctx.lineTo(x - s * 0.05, y + s * 0.25);
      ctx.lineTo(x + s * 0.1, y + s * 0.55);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s * 0.8, y + s * 0.45);
      ctx.lineTo(x + s * 1.05, y + s * 0.25);
      ctx.lineTo(x + s * 0.9, y + s * 0.55);
      ctx.fill();
    },
  },
  goblin_king: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = "#166534";
      ctx.fillRect(x + s * 0.25, y + s * 0.35, s * 0.5, s * 0.4);
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.25, s * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.3, y + s * 0.15);
      ctx.lineTo(x + s * 0.35, y + s * 0.0);
      ctx.lineTo(x + s * 0.45, y + s * 0.1);
      ctx.lineTo(x + s * 0.5, y + s * -0.02);
      ctx.lineTo(x + s * 0.55, y + s * 0.1);
      ctx.lineTo(x + s * 0.65, y + s * 0.0);
      ctx.lineTo(x + s * 0.7, y + s * 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 6;
      ctx.fillRect(x + s * 0.36, y + s * 0.2, s * 0.1, s * 0.08);
      ctx.fillRect(x + s * 0.54, y + s * 0.2, s * 0.1, s * 0.08);
      ctx.shadowBlur = 0;
    },
  },
  skeleton_lord: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = "#fafafa";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.22, s * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#7c3aed";
      ctx.shadowColor = "#7c3aed";
      ctx.shadowBlur = 8;
      ctx.fillRect(x + s * 0.36, y + s * 0.16, s * 0.1, s * 0.1);
      ctx.fillRect(x + s * 0.54, y + s * 0.16, s * 0.1, s * 0.1);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#e5e5e5";
      ctx.fillRect(x + s * 0.44, y + s * 0.38, s * 0.12, s * 0.4);
      ctx.fillStyle = "#581c87";
      ctx.fillRect(x + s * 0.35, y + s * 0.38, s * 0.3, s * 0.25);
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.35, y + s * 0.08);
      ctx.lineTo(x + s * 0.5, y + s * -0.05);
      ctx.lineTo(x + s * 0.65, y + s * 0.08);
      ctx.closePath();
      ctx.fill();
    },
  },
  orc_warlord: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = "#7c2d12";
      ctx.fillRect(x + s * 0.2, y + s * 0.32, s * 0.6, s * 0.45);
      ctx.fillStyle = "#ea580c";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.22, s * 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fef9c3";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.28, y + s * 0.35);
      ctx.lineTo(x + s * 0.22, y + s * 0.55);
      ctx.lineTo(x + s * 0.35, y + s * 0.4);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s * 0.72, y + s * 0.35);
      ctx.lineTo(x + s * 0.78, y + s * 0.55);
      ctx.lineTo(x + s * 0.65, y + s * 0.4);
      ctx.fill();
      ctx.fillStyle = "#1c1917";
      ctx.fillRect(x + s * 0.3, y + s * 0.05, s * 0.4, s * 0.12);
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(x + s * 0.25, y + s * 0.0, s * 0.5, s * 0.08);
    },
  },
  spider_queen: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = "#581c87";
      ctx.beginPath();
      ctx.ellipse(
        x + s * 0.5,
        y + s * 0.6,
        s * 0.3,
        s * 0.22,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.fillStyle = "#9333ea";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.32, s * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.35, y + s * 0.2);
      ctx.lineTo(x + s * 0.5, y + s * 0.1);
      ctx.lineTo(x + s * 0.65, y + s * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 6;
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(
          x + s * 0.36 + i * s * 0.05,
          y + s * 0.28,
          s * 0.04,
          s * 0.04
        );
      }
      ctx.shadowBlur = 0;
    },
  },
  lich: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = "#164e63";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5, y + s * 0.2);
      ctx.lineTo(x + s * 0.8, y + s * 0.9);
      ctx.lineTo(x + s * 0.2, y + s * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#e5e5e5";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.22, s * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#06b6d4";
      ctx.shadowColor = "#06b6d4";
      ctx.shadowBlur = 10;
      ctx.fillRect(x + s * 0.38, y + s * 0.18, s * 0.08, s * 0.08);
      ctx.fillRect(x + s * 0.54, y + s * 0.18, s * 0.08, s * 0.08);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#22d3ee";
      ctx.beginPath();
      ctx.arc(x + s * 0.15, y + s * 0.5, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  demon_lord: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = "#7f1d1d";
      ctx.fillRect(x + s * 0.2, y + s * 0.32, s * 0.6, s * 0.45);
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.25, s * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1c1917";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.25, y + s * 0.2);
      ctx.lineTo(x + s * 0.1, y + s * -0.1);
      ctx.lineTo(x + s * 0.35, y + s * 0.1);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s * 0.75, y + s * 0.2);
      ctx.lineTo(x + s * 0.9, y + s * -0.1);
      ctx.lineTo(x + s * 0.65, y + s * 0.1);
      ctx.fill();
      ctx.fillStyle = "#fbbf24";
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 10;
      ctx.fillRect(x + s * 0.35, y + s * 0.2, s * 0.1, s * 0.08);
      ctx.fillRect(x + s * 0.55, y + s * 0.2, s * 0.1, s * 0.08);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#450a0a";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.15, y + s * 0.4);
      ctx.lineTo(x - s * 0.15, y + s * 0.15);
      ctx.lineTo(x + s * 0.05, y + s * 0.5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s * 0.85, y + s * 0.4);
      ctx.lineTo(x + s * 1.15, y + s * 0.15);
      ctx.lineTo(x + s * 0.95, y + s * 0.5);
      ctx.fill();
    },
  },
  ancient_dragon: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = "#92400e";
      ctx.fillRect(x + s * 0.2, y + s * 0.35, s * 0.6, s * 0.4);
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(x + s * 0.55, y + s * 0.28, s * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#78350f";
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + s * (0.35 + i * 0.12), y + s * 0.12);
        ctx.lineTo(x + s * (0.38 + i * 0.12), y + s * -0.05);
        ctx.lineTo(x + s * (0.45 + i * 0.12), y + s * 0.1);
        ctx.fill();
      }
      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#ef4444";
      ctx.shadowBlur = 8;
      ctx.fillRect(x + s * 0.45, y + s * 0.22, s * 0.08, s * 0.08);
      ctx.fillRect(x + s * 0.58, y + s * 0.22, s * 0.08, s * 0.08);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#b45309";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.15, y + s * 0.4);
      ctx.lineTo(x - s * 0.2, y + s * 0.15);
      ctx.lineTo(x - s * 0.1, y + s * 0.35);
      ctx.lineTo(x + s * 0.1, y + s * 0.55);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s * 0.85, y + s * 0.4);
      ctx.lineTo(x + s * 1.2, y + s * 0.15);
      ctx.lineTo(x + s * 1.1, y + s * 0.35);
      ctx.lineTo(x + s * 0.9, y + s * 0.55);
      ctx.fill();
    },
  },
  troll: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Large body (purple/grey)
      ctx.fillStyle = "#6b21a8";
      ctx.fillRect(x + s * 0.2, y + s * 0.3, s * 0.6, s * 0.45);

      // Head (smaller relative to body)
      ctx.fillStyle = "#7c3aed";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.22, s * 0.18, 0, Math.PI * 2);
      ctx.fill();

      // Warts/bumps
      ctx.fillStyle = "#581c87";
      ctx.beginPath();
      ctx.arc(x + s * 0.35, y + s * 0.18, s * 0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s * 0.62, y + s * 0.25, s * 0.03, 0, Math.PI * 2);
      ctx.fill();

      // Small angry eyes
      ctx.fillStyle = "#fcd34d";
      ctx.fillRect(x + s * 0.4, y + s * 0.18, s * 0.07, s * 0.06);
      ctx.fillRect(x + s * 0.53, y + s * 0.18, s * 0.07, s * 0.06);

      // Big nose
      ctx.fillStyle = "#581c87";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.28, s * 0.06, 0, Math.PI * 2);
      ctx.fill();

      // Mouth
      ctx.fillStyle = "#1e1b4b";
      ctx.fillRect(x + s * 0.38, y + s * 0.34, s * 0.24, s * 0.06);

      // Big arms
      ctx.fillStyle = "#7c3aed";
      ctx.fillRect(x + s * 0.02, y + s * 0.32, s * 0.2, s * 0.2);
      ctx.fillRect(x + s * 0.78, y + s * 0.32, s * 0.2, s * 0.2);

      // Club
      ctx.fillStyle = "#78350f";
      ctx.fillRect(x + s * 0.85, y + s * 0.1, s * 0.1, s * 0.55);
      ctx.fillStyle = "#57534e";
      ctx.beginPath();
      ctx.arc(x + s * 0.9, y + s * 0.12, s * 0.12, 0, Math.PI * 2);
      ctx.fill();

      // Legs (thick)
      ctx.fillStyle = "#6b21a8";
      ctx.fillRect(x + s * 0.25, y + s * 0.72, s * 0.2, s * 0.22);
      ctx.fillRect(x + s * 0.55, y + s * 0.72, s * 0.2, s * 0.22);
    },
  },
  wolf: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Body - muscular
      ctx.fillStyle = "#44403c";
      ctx.beginPath();
      ctx.ellipse(
        x + s * 0.4,
        y + s * 0.55,
        s * 0.28,
        s * 0.16,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      // Fur texture
      ctx.fillStyle = "#57534e";
      ctx.beginPath();
      ctx.ellipse(
        x + s * 0.35,
        y + s * 0.52,
        s * 0.12,
        s * 0.1,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      // Head
      ctx.fillStyle = "#57534e";
      ctx.beginPath();
      ctx.ellipse(
        x + s * 0.72,
        y + s * 0.45,
        s * 0.16,
        s * 0.14,
        0.2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      // Snout
      ctx.fillStyle = "#78716c";
      ctx.beginPath();
      ctx.ellipse(
        x + s * 0.85,
        y + s * 0.48,
        s * 0.08,
        s * 0.06,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      // Nose
      ctx.fillStyle = "#1c1917";
      ctx.beginPath();
      ctx.arc(x + s * 0.9, y + s * 0.47, s * 0.025, 0, Math.PI * 2);
      ctx.fill();
      // Eyes - yellow predator eyes
      ctx.fillStyle = "#fbbf24";
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.ellipse(
        x + s * 0.7,
        y + s * 0.42,
        s * 0.04,
        s * 0.05,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#1c1917";
      ctx.beginPath();
      ctx.ellipse(
        x + s * 0.71,
        y + s * 0.42,
        s * 0.02,
        s * 0.03,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      // Ears - pointed
      ctx.fillStyle = "#44403c";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.62, y + s * 0.35);
      ctx.lineTo(x + s * 0.58, y + s * 0.18);
      ctx.lineTo(x + s * 0.66, y + s * 0.32);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s * 0.74, y + s * 0.32);
      ctx.lineTo(x + s * 0.78, y + s * 0.16);
      ctx.lineTo(x + s * 0.8, y + s * 0.3);
      ctx.fill();
      // Tail
      ctx.beginPath();
      ctx.moveTo(x + s * 0.15, y + s * 0.5);
      ctx.quadraticCurveTo(
        x + s * 0.05,
        y + s * 0.35,
        x + s * 0.12,
        y + s * 0.25
      );
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#44403c";
      ctx.stroke();
      // Legs
      ctx.fillStyle = "#44403c";
      ctx.fillRect(x + s * 0.25, y + s * 0.65, s * 0.08, s * 0.22);
      ctx.fillRect(x + s * 0.4, y + s * 0.65, s * 0.08, s * 0.22);
      ctx.fillRect(x + s * 0.55, y + s * 0.65, s * 0.08, s * 0.2);
      ctx.fillRect(x + s * 0.68, y + s * 0.65, s * 0.08, s * 0.18);
    },
  },
  cultist: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = "#4c1d95";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5, y + s * 0.1);
      ctx.lineTo(x + s * 0.8, y + s * 0.9);
      ctx.lineTo(x + s * 0.2, y + s * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#0a0a0a";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.35, s * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#be123c";
      ctx.shadowColor = "#be123c";
      ctx.shadowBlur = 6;
      ctx.fillRect(x + s * 0.42, y + s * 0.32, s * 0.06, s * 0.06);
      ctx.fillRect(x + s * 0.52, y + s * 0.32, s * 0.06, s * 0.06);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.6, s * 0.12, 0, Math.PI * 2);
      ctx.stroke();
    },
  },
  golem: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = "#57534e";
      ctx.fillRect(x + s * 0.25, y + s * 0.35, s * 0.5, s * 0.45);
      ctx.fillStyle = "#78716c";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.28, s * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fbbf24";
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 6;
      ctx.fillRect(x + s * 0.38, y + s * 0.24, s * 0.08, s * 0.08);
      ctx.fillRect(x + s * 0.54, y + s * 0.24, s * 0.08, s * 0.08);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#44403c";
      ctx.fillRect(x + s * 0.1, y + s * 0.38, s * 0.18, s * 0.12);
      ctx.fillRect(x + s * 0.72, y + s * 0.38, s * 0.18, s * 0.12);
      ctx.fillRect(x + s * 0.28, y + s * 0.78, s * 0.18, s * 0.15);
      ctx.fillRect(x + s * 0.54, y + s * 0.78, s * 0.18, s * 0.15);
    },
  },
  vampire: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = "#1c1917";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5, y + s * 0.25);
      ctx.lineTo(x + s * 0.85, y + s * 0.9);
      ctx.lineTo(x + s * 0.15, y + s * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fafaf9";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.3, s * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1c1917";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.22, s * 0.12, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#dc2626";
      ctx.shadowColor = "#dc2626";
      ctx.shadowBlur = 6;
      ctx.fillRect(x + s * 0.4, y + s * 0.26, s * 0.06, s * 0.06);
      ctx.fillRect(x + s * 0.54, y + s * 0.26, s * 0.06, s * 0.06);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fafaf9";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.42, y + s * 0.38);
      ctx.lineTo(x + s * 0.45, y + s * 0.45);
      ctx.lineTo(x + s * 0.48, y + s * 0.38);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s * 0.52, y + s * 0.38);
      ctx.lineTo(x + s * 0.55, y + s * 0.45);
      ctx.lineTo(x + s * 0.58, y + s * 0.38);
      ctx.fill();
    },
  },
  mimic: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = "#78350f";
      ctx.fillRect(x + s * 0.15, y + s * 0.45, s * 0.7, s * 0.4);
      ctx.fillStyle = "#92400e";
      ctx.fillRect(x + s * 0.12, y + s * 0.3, s * 0.76, s * 0.2);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(x + s * 0.3, y + s * 0.35, s * 0.1, s * 0.08);
      ctx.fillRect(x + s * 0.6, y + s * 0.35, s * 0.1, s * 0.08);
      ctx.fillStyle = "#fef3c7";
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(x + s * (0.2 + i * 0.1), y + s * 0.5);
        ctx.lineTo(x + s * (0.25 + i * 0.1), y + s * 0.6);
        ctx.lineTo(x + s * (0.3 + i * 0.1), y + s * 0.5);
        ctx.fill();
      }
      ctx.fillStyle = "#b91c1c";
      ctx.beginPath();
      ctx.ellipse(
        x + s * 0.5,
        y + s * 0.55,
        s * 0.15,
        s * 0.08,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    },
  },
  vampire_lord: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = "#0a0a0a";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.15, y + s * 0.35);
      ctx.lineTo(x - s * 0.1, y + s * 0.2);
      ctx.lineTo(x + s * 0.1, y + s * 0.5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s * 0.85, y + s * 0.35);
      ctx.lineTo(x + s * 1.1, y + s * 0.2);
      ctx.lineTo(x + s * 0.9, y + s * 0.5);
      ctx.fill();
      ctx.fillStyle = "#7f1d1d";
      ctx.fillRect(x + s * 0.25, y + s * 0.35, s * 0.5, s * 0.5);
      ctx.fillStyle = "#fafaf9";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.28, s * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.35, y + s * 0.15);
      ctx.lineTo(x + s * 0.5, y + s * 0.05);
      ctx.lineTo(x + s * 0.65, y + s * 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#dc2626";
      ctx.shadowColor = "#dc2626";
      ctx.shadowBlur = 8;
      ctx.fillRect(x + s * 0.38, y + s * 0.24, s * 0.08, s * 0.08);
      ctx.fillRect(x + s * 0.54, y + s * 0.24, s * 0.08, s * 0.08);
      ctx.shadowBlur = 0;
    },
  },
  golem_king: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = "#44403c";
      ctx.fillRect(x + s * 0.2, y + s * 0.32, s * 0.6, s * 0.5);
      ctx.fillStyle = "#57534e";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.25, s * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.3, y + s * 0.12);
      ctx.lineTo(x + s * 0.35, y + s * 0.0);
      ctx.lineTo(x + s * 0.45, y + s * 0.08);
      ctx.lineTo(x + s * 0.5, y + s * -0.02);
      ctx.lineTo(x + s * 0.55, y + s * 0.08);
      ctx.lineTo(x + s * 0.65, y + s * 0.0);
      ctx.lineTo(x + s * 0.7, y + s * 0.12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#22d3ee";
      ctx.shadowColor = "#22d3ee";
      ctx.shadowBlur = 10;
      ctx.fillRect(x + s * 0.36, y + s * 0.2, s * 0.1, s * 0.1);
      ctx.fillRect(x + s * 0.54, y + s * 0.2, s * 0.1, s * 0.1);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#292524";
      ctx.fillRect(x + s * 0.05, y + s * 0.35, s * 0.18, s * 0.15);
      ctx.fillRect(x + s * 0.77, y + s * 0.35, s * 0.18, s * 0.15);
    },
  },
  demon: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Muscular demonic body
      ctx.fillStyle = "#991b1b";
      ctx.beginPath();
      ctx.ellipse(
        x + s * 0.5,
        y + s * 0.55,
        s * 0.22,
        s * 0.25,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      // Chest muscles
      ctx.fillStyle = "#7f1d1d";
      ctx.beginPath();
      ctx.arc(x + s * 0.42, y + s * 0.48, s * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s * 0.58, y + s * 0.48, s * 0.08, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.28, s * 0.18, 0, Math.PI * 2);
      ctx.fill();
      // Curved horns
      ctx.fillStyle = "#1c1917";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.32, y + s * 0.2);
      ctx.quadraticCurveTo(
        x + s * 0.15,
        y + s * 0.05,
        x + s * 0.22,
        y + s * -0.05
      );
      ctx.quadraticCurveTo(
        x + s * 0.28,
        y + s * 0.05,
        x + s * 0.38,
        y + s * 0.18
      );
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s * 0.68, y + s * 0.2);
      ctx.quadraticCurveTo(
        x + s * 0.85,
        y + s * 0.05,
        x + s * 0.78,
        y + s * -0.05
      );
      ctx.quadraticCurveTo(
        x + s * 0.72,
        y + s * 0.05,
        x + s * 0.62,
        y + s * 0.18
      );
      ctx.fill();
      // Glowing eyes
      ctx.fillStyle = "#fbbf24";
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(
        x + s * 0.4,
        y + s * 0.26,
        s * 0.05,
        s * 0.04,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(
        x + s * 0.6,
        y + s * 0.26,
        s * 0.05,
        s * 0.04,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;
      // Evil grin
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.32, s * 0.1, 0.1, Math.PI - 0.1);
      ctx.stroke();
      // Fangs
      ctx.fillStyle = "#fef3c7";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.4, y + s * 0.36);
      ctx.lineTo(x + s * 0.42, y + s * 0.42);
      ctx.lineTo(x + s * 0.44, y + s * 0.36);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s * 0.56, y + s * 0.36);
      ctx.lineTo(x + s * 0.58, y + s * 0.42);
      ctx.lineTo(x + s * 0.6, y + s * 0.36);
      ctx.fill();
      // Bat wings
      ctx.fillStyle = "#7f1d1d";
      // Left wing
      ctx.beginPath();
      ctx.moveTo(x + s * 0.28, y + s * 0.45);
      ctx.lineTo(x - s * 0.05, y + s * 0.2);
      ctx.lineTo(x + s * 0.0, y + s * 0.35);
      ctx.lineTo(x - s * 0.08, y + s * 0.4);
      ctx.lineTo(x + s * 0.05, y + s * 0.5);
      ctx.lineTo(x + s * 0.15, y + s * 0.55);
      ctx.closePath();
      ctx.fill();
      // Right wing
      ctx.beginPath();
      ctx.moveTo(x + s * 0.72, y + s * 0.45);
      ctx.lineTo(x + s * 1.05, y + s * 0.2);
      ctx.lineTo(x + s * 1.0, y + s * 0.35);
      ctx.lineTo(x + s * 1.08, y + s * 0.4);
      ctx.lineTo(x + s * 0.95, y + s * 0.5);
      ctx.lineTo(x + s * 0.85, y + s * 0.55);
      ctx.closePath();
      ctx.fill();
      // Tail with arrow tip
      ctx.strokeStyle = "#991b1b";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5, y + s * 0.78);
      ctx.quadraticCurveTo(x + s * 0.2, y + s * 0.9, x + s * 0.1, y + s * 0.75);
      ctx.stroke();
      ctx.fillStyle = "#1c1917";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.1, y + s * 0.75);
      ctx.lineTo(x + s * 0.02, y + s * 0.68);
      ctx.lineTo(x + s * 0.02, y + s * 0.82);
      ctx.closePath();
      ctx.fill();
      // Hooved legs
      ctx.fillStyle = "#991b1b";
      ctx.fillRect(x + s * 0.32, y + s * 0.75, s * 0.12, s * 0.15);
      ctx.fillRect(x + s * 0.56, y + s * 0.75, s * 0.12, s * 0.15);
      ctx.fillStyle = "#1c1917";
      ctx.beginPath();
      ctx.ellipse(
        x + s * 0.38,
        y + s * 0.92,
        s * 0.08,
        s * 0.04,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(
        x + s * 0.62,
        y + s * 0.92,
        s * 0.08,
        s * 0.04,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    },
  },
};

function drawStunStars(ctx, x, y, size, frame) {
  const s = size;
  const cx = x + s * 0.5;
  const cy = y + s * 0.15;
  ctx.fillStyle = '#fbbf24';
  for (let i = 0; i < 3; i++) {
    const angle = (frame * 0.1 + (i * (Math.PI * 2 / 3))) % (Math.PI * 2);
    const px = cx + Math.cos(angle) * (s * 0.3);
    const py = cy + Math.sin(angle) * (s * 0.1);
    ctx.beginPath(); ctx.arc(px, py, s * 0.05, 0, Math.PI * 2); ctx.fill();
  }
}

function drawShadow(ctx, x, y, size) {
  const s = size;
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.ellipse(x + s * 0.5, y + s * 0.85, s * 0.3, s * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawEnemy(ctx, enemyType, x, y, size, frame = 0, isStunned = false, lastAttackTime = 0, lastAttackDir = {x:0, y:0}, lastMoveTime = 0) {
  // 1. Obtener la clave de renderizado desde los datos (Source of Truth)
  const stats = ENEMY_STATS[enemyType];
  const spriteKey = stats?.renderKey; // Ej: 'rat', 'goblin'

  drawShadow(ctx, x, y, size);

  const now = Date.now();
  const timeSinceAttack = now - lastAttackTime;
  const isAttacking = timeSinceAttack < ATTACK_DURATION;
  const attackProgress = isAttacking ? timeSinceAttack / ATTACK_DURATION : 0;

  // 2. Usar la clave para buscar el sprite en SPRITES (y si no existe, usar el renderKey como fallback o generic)
  // Nota: Si has definido todos los sprites en SPRITES, esto funcionará directo.
  // Si falta alguno, usará 'generic'.
  if (spriteKey && SPRITES[spriteKey]) {
    SPRITES[spriteKey].draw(ctx, x, y, size, frame, isAttacking, attackProgress, lastAttackDir, lastMoveTime);
  } else {
    const color = stats ? stats.color : "#ef4444";
    SPRITES.generic.draw(ctx, x, y, size, frame, color, isAttacking, attackProgress, lastAttackDir);
  }

  if (isStunned) drawStunStars(ctx, x, y, size, frame);
}

// ... (drawLargeEnemy y drawWeapon se mantienen igual) ...
export function drawLargeEnemy(ctx, spriteName, x, y, size, frame = 0, isStunned, lastAttackTime = 0) {
  const s = size;
  const pulse = Math.sin(frame * 0.05) * 0.02 + 1;
  const isAttacking = (Date.now() - lastAttackTime) < ATTACK_DURATION;
  const attackColor = isAttacking ? "#ef4444" : "#7f1d1d";

  ctx.save();
  ctx.translate(x + s / 2, y + s / 2);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = attackColor;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(-s * 0.15, -s * 0.1, s * 0.05, 0, Math.PI * 2);
  ctx.arc(s * 0.15, -s * 0.1, s * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWeapon(ctx, x, y, size, type = 'sword', progress = 0, angle = 0) {
    // ... (código existente de drawWeapon) ...
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle); 
    const swing = Math.sin(progress * Math.PI);
    ctx.rotate(swing * 2.0 - 1.0); 
    ctx.fillStyle = '#9ca3af'; 
    if (type === 'dagger') {
        ctx.fillRect(size*0.2, -size*0.05, size*0.3, size*0.1); 
        ctx.fillStyle = '#4b5563'; ctx.fillRect(0, -size*0.05, size*0.2, size*0.1); 
    } else if (type === 'axe') {
        ctx.fillStyle = '#78350f'; ctx.fillRect(0, -size*0.05, size*0.6, size*0.1); 
        ctx.fillStyle = '#9ca3af'; ctx.beginPath(); ctx.arc(size*0.5, 0, size*0.2, 0, Math.PI*2); ctx.fill();
    } else { 
        ctx.fillRect(size*0.2, -size*0.05, size*0.5, size*0.1); 
        ctx.fillStyle = '#fbbf24'; ctx.fillRect(size*0.2, -size*0.15, size*0.05, size*0.3); 
        ctx.fillStyle = '#78350f'; ctx.fillRect(0, -size*0.04, size*0.2, size*0.08); 
    }
    ctx.restore();
}

