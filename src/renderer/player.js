// src/renderer/player.js

export function drawPlayer(
  ctx,
  x,
  y,
  size,
  appearance = null,
  playerClass = null,
  frame = 0,
  lastAttackTime = 0,
  lastAttackDir = { x: 1, y: 0 },
  lastSkillTime = 0, 
  lastSkillId = null,
  isInvisible = false
) {
  const app = appearance || {
    colors: { tunic: "#3b82f6", hair: "#8b5a2b", skin: "#fcd5b8" },
    class: "warrior",
  };
  
  drawCustomPlayer(
    ctx,
    x,
    y,
    size,
    app,
    playerClass || app.class,
    frame,
    lastAttackTime,
    lastAttackDir,
    lastSkillTime,
    lastSkillId,
    isInvisible
  );
}

function drawCustomPlayer(
  ctx,
  x,
  y,
  size,
  appearance,
  playerClass,
  frame,
  lastAttackTime,
  lastAttackDir,
  lastSkillTime,
  lastSkillId,
  isInvisible
) {
  // 1. GUARDAR ESTADO ORIGINAL DEL CONTEXTO (Aísla la opacidad)
  ctx.save();

  // 2. APLICAR OPACIDAD SOLO PARA ESTE DIBUJO
  if (isInvisible) {
      ctx.globalAlpha = 0.4;
  }
  const s = size;
  const colors = appearance.colors;

  const now = Date.now();
  const ATTACK_DURATION = 250;
  const SKILL_DURATION = 400;
  const timeSinceAttack = Date.now() - lastAttackTime;
  const isAttacking = timeSinceAttack < ATTACK_DURATION;
  const isCasting = (now - lastSkillTime) < SKILL_DURATION;
  
  // Identificar habilidades
  const isPowerStrike = isAttacking && lastSkillId === 'power_strike';
  const isShieldBash = isAttacking && lastSkillId === 'shield_bash';
  const isBackstab = isAttacking && lastSkillId === 'backstab';
  const isHeal = isCasting && lastSkillId === 'heal';
  const isFireball = isCasting && lastSkillId === 'fireball';

  let attackProgress = 0;
  let castProgress = isCasting ? (now - lastSkillTime) / SKILL_DURATION : 0;

  if (isAttacking) {
    attackProgress = timeSinceAttack / ATTACK_DURATION;
  }

  // --- EFECTO VISUAL DE INVISIBILIDAD (HUMO) ---
  if (isInvisible) {
      ctx.save();
      ctx.translate(x + s * 0.5, y + s * 0.6); // Centro del humo un poco más abajo
      
      // Dibujar partículas de humo giratorias
      for (let i = 0; i < 6; i++) {
          const speed = 0.05;
          // Ángulo dinámico para que giren
          const angle = (frame * speed + i * (Math.PI * 2 / 6)) % (Math.PI * 2);
          // Radio variable (se expande y contrae ligeramente)
          const radius = s * 0.4 + Math.sin(frame * 0.1 + i) * s * 0.05;
          
          const px = Math.cos(angle) * radius;
          const py = Math.sin(angle) * radius * 0.6; // Perspectiva achatada
          
          // Tamaño variable de la partícula
          const partSize = s * 0.15 * (1 + Math.sin(frame * 0.1 + i) * 0.3);
          
          // Color humo grisáceo semitransparente
          ctx.fillStyle = `rgba(200, 200, 210, ${0.2 + Math.sin(frame * 0.1 + i) * 0.1})`;
          
          ctx.beginPath();
          ctx.arc(px, py, partSize, 0, Math.PI * 2);
          ctx.fill();
      }
      ctx.restore();
      
      // Aplicar opacidad al personaje (para lo que se dibuja después)
      
  }

  ctx.globalAlpha = isInvisible ? 0.4 : 1.0;

  // --- 1. EFECTOS DE SUELO (Círculos) ---
  
  if (isPowerStrike || isBackstab) {
      ctx.save();
      ctx.translate(x + s*0.5, y + s*0.5);
      ctx.globalAlpha = 0.6 * Math.sin(attackProgress * Math.PI);
      ctx.fillStyle = isPowerStrike ? '#ef4444' : '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
  }

  if (isCasting) {
      ctx.save();
      ctx.translate(x + s*0.5, y + s*0.5);
      ctx.rotate(frame * 0.1);
      
      let circleColor = '#fbbf24'; 
      if (playerClass === 'mage') circleColor = '#a855f7';
      if (isHeal) circleColor = '#22c55e'; // Verde para curar
      if (isFireball) circleColor = '#ef4444'; 
      
      ctx.strokeStyle = circleColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1 - castProgress;
      ctx.beginPath();
      const radius = s * 0.4 + (castProgress * s * 0.3);
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.rotate(Math.PI/4);
      ctx.strokeRect(-radius*0.7, -radius*0.7, radius*1.4, radius*1.4);
      ctx.restore();
  }

  // Sombra base
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  const breath = Math.sin(frame * (isCasting ? 0.5 : 0.1)) * (isCasting ? s * 0.05 : s * 0.03);
  const shadowScale = 1 - breath / s;
  ctx.ellipse(
    x + s * 0.5,
    y + s * 0.85,
    s * 0.3 * shadowScale,
    s * 0.1 * shadowScale,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // --- 2. CUERPO Y CABEZA ---
  
  const yAnim = y + breath - (isCasting ? s * 0.1 : 0);
  
  ctx.save();
  ctx.translate(x + s * 0.5, yAnim + s * 0.5);
  
  if (isBackstab) {
      ctx.rotate(attackProgress * Math.PI * 2);
  }
  
  // Túnica
  ctx.fillStyle = colors.tunic;
  ctx.beginPath();
  ctx.moveTo(-s * 0.2, -s * 0.1);
  ctx.lineTo(s * 0.2, -s * 0.1);
  ctx.lineTo(s * 0.25, s * 0.25);
  ctx.lineTo(-s * 0.25, s * 0.25);
  ctx.fill();

  // Cabeza
  ctx.fillStyle = colors.skin;
  ctx.beginPath();
  ctx.arc(0, -s * 0.25, s * 0.18, 0, Math.PI * 2);
  ctx.fill();
  
  if (playerClass === "warrior") {
      ctx.fillStyle = "#52525b";
      ctx.beginPath();
      ctx.arc(0, -s * 0.3, s * 0.19, Math.PI, Math.PI * 2);
      ctx.lineTo(s * 0.2, -s * 0.15);
      ctx.lineTo(-s * 0.2, -s * 0.15);
      ctx.fill();
  } else if (playerClass === "rogue") {
      ctx.fillStyle = colors.tunic;
      ctx.beginPath();
      ctx.arc(0, -s * 0.25, s * 0.2, Math.PI, 0);
      ctx.fill();
  } else if (playerClass === "mage") {
      ctx.fillStyle = colors.tunic;
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, -s * 0.25);
      ctx.lineTo(s * 0.3, -s * 0.25);
      ctx.lineTo(0, -s * 0.6 + Math.sin(frame * 0.1) * 2);
      ctx.fill();
  }
  
  // Ojos
  ctx.fillStyle = isCasting || isPowerStrike || isBackstab ? '#fff' : "#1e293b";
  if (isAttacking || isCasting) {
    ctx.fillRect(-s * 0.08, -s * 0.26, s * 0.05, s * 0.03);
    ctx.fillRect(s * 0.03, -s * 0.26, s * 0.05, s * 0.03);
  } else {
    if (frame % 200 < 190) {
      ctx.fillRect(-s * 0.08, -s * 0.28, s * 0.05, s * 0.05);
      ctx.fillRect(s * 0.03, -s * 0.28, s * 0.05, s * 0.05);
    } else {
      ctx.fillRect(-s * 0.08, -s * 0.26, s * 0.05, s * 0.01);
      ctx.fillRect(s * 0.03, -s * 0.26, s * 0.05, s * 0.01);
    }
  }
  
  ctx.restore();

  // --- 3. ARMAS Y MANOS ---

  if (playerClass === "warrior") {
    // ... (CÓDIGO GUERRERO IGUAL QUE ANTES) ...
    if (!isShieldBash) {
        ctx.save();
        const centerX = x + s * 0.5;
        const centerY = yAnim + s * 0.5;
        ctx.translate(centerX, centerY);

        let rotation = -Math.PI / 2 + Math.sin(frame * 0.05) * 0.05;
        let thrust = 0;

        if (isAttacking) {
          const dir = lastAttackDir || { x: 1, y: 0 };
          rotation = Math.atan2(dir.y, dir.x);
          
          if (isPowerStrike) {
             thrust = Math.sin(attackProgress * Math.PI) * (s * 0.9);
             ctx.scale(1.3, 1.3);
          } else {
             thrust = Math.sin(attackProgress * Math.PI) * (s * 0.6);
          }
        } else if (isCasting) {
          rotation = -Math.PI / 2;
          thrust = -s * 0.2;
          rotation += Math.sin(frame * 0.8) * 0.1;
        } else {
          ctx.translate(s * 0.2, -s * 0.1);
        }

        ctx.rotate(rotation);
        ctx.translate(thrust, 0);

        ctx.fillStyle = isPowerStrike ? "#ef4444" : "#94a3b8"; 
        ctx.fillRect(0, -s * 0.04, s * 0.35, s * 0.08);
        ctx.beginPath();
        ctx.moveTo(s * 0.35, -s * 0.04);
        ctx.lineTo(s * 0.45, 0);
        ctx.lineTo(s * 0.35, s * 0.04);
        ctx.fill();

        ctx.fillStyle = "#fbbf24";
        ctx.fillRect(-s * 0.1, -s * 0.03, s * 0.1, s * 0.06);
        ctx.fillStyle = "#52525b";
        ctx.fillRect(0, -s * 0.1, s * 0.03, s * 0.2);

        if (isAttacking && attackProgress > 0.2 && attackProgress < 0.8) {
          ctx.fillStyle = isPowerStrike ? "rgba(239, 68, 68, 0.6)" : "rgba(255, 255, 255, 0.4)";
          ctx.fillRect(-s * 0.05, -s * 0.15, s * 0.3, s * 0.02);
          ctx.fillRect(-s * 0.05, s * 0.13, s * 0.3, s * 0.02);
        }
        ctx.restore();
    }

    ctx.save();
    ctx.translate(x + s * 0.25, yAnim + s * 0.45);
    if (isShieldBash) {
        const dir = lastAttackDir || { x: 1, y: 0 };
        const bash = Math.sin(attackProgress * Math.PI) * (s * 0.5);
        ctx.translate(s*0.25, -s*0.1); 
        ctx.translate(dir.x * bash, dir.y * bash);
        if (attackProgress > 0.5) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, s*0.3, 0, Math.PI*2); ctx.stroke();
        }
    } else if (isAttacking) {
      ctx.translate(Math.sin(attackProgress * Math.PI) * -s * 0.1, 0);
    }
    ctx.fillStyle = "#330a03ff";
    ctx.beginPath();
    ctx.arc(0, 0, s * (isShieldBash ? 0.22 : 0.15), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#9b7411ff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

  } else if (playerClass === "mage") {
    // --- BASTÓN DEL MAGO ---
    ctx.save();
    const centerX = x + s * 0.5;
    const centerY = yAnim + s * 0.4;
    ctx.translate(centerX, centerY);

    let rotation = -Math.PI / 2.2 + Math.sin(frame * 0.05) * 0.05;
    let thrust = 0;

    // <-- CAMBIO CURACIÓN: Lógica de movimiento del bastón
    if (isHeal) {
        // Si está curando, bastón recto hacia arriba
        rotation = -Math.PI / 2; 
        // Pequeño movimiento vertical hacia arriba al curar
        thrust = -s * 0.1 + Math.sin(castProgress * Math.PI) * (-s * 0.1);
        // Movemos el punto de pivote más arriba para que parezca alzado
        ctx.translate(0, -s * 0.2);
    } else if (isAttacking) {
      // ... (lógica de ataque melee del mago, si tuviera)
      const dir = lastAttackDir || { x: 1, y: 0 };
      rotation = Math.atan2(dir.y, dir.x);
      thrust = Math.sin(attackProgress * Math.PI) * (s * 0.2);
    } else if (isCasting) {
        // ... (lógica de casteo ofensivo normal, como fireball)
        const dir = lastAttackDir || { x: 1, y: 0 };
        if (dir.x === 0 && dir.y === 0) rotation = -Math.PI / 2;
        else rotation = Math.atan2(dir.y, dir.x);
        thrust = Math.sin(castProgress * Math.PI * 4) * (s * 0.05) + (s * 0.2);
    } else {
      // Posición de reposo
      ctx.translate(s * 0.25, s * 0.3);
    }

    ctx.rotate(rotation);
    ctx.translate(thrust, 0);

    ctx.fillStyle = "#78350f";
    ctx.fillRect(0, -s * 0.025, s * 0.6, s * 0.05); // Vara

    // <-- CAMBIO CURACIÓN: Color de la bola del bastón
    let orbColor = '#a855f7'; // Morado por defecto
    if (isHeal) orbColor = '#22c55e'; // VERDE intenso al curar
    else if (isFireball) orbColor = '#f97316'; // Naranja fuego
    else if (isCasting) orbColor = '#fff'; // Blanco al castear genérico

    ctx.fillStyle = orbColor;
    ctx.shadowColor = orbColor;
    // El brillo es más intenso si se está curando o lanzando fuego
    ctx.shadowBlur = (10 + Math.sin(frame * 0.2) * 5) * (isCasting ? 3 : 1);
    
    ctx.beginPath();
    // Si es heal, la bola es ligeramente más grande
    ctx.arc(s * 0.6, 0, s * (isCasting ? (isHeal ? 0.14 : 0.12) : 0.08), 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Partículas de ataque físico (melee mago)
    if (isAttacking && attackProgress > 0.4) {
      ctx.fillStyle = "#d8b4fe";
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(s * 0.6 + (Math.random()-0.5)*s*0.4, (Math.random()-0.5)*s*0.4, 2, 2);
      }
    }
    
    // Fuego en el bastón (solo fireball)
    if (isCasting && isFireball && !isHeal) {
        ctx.fillStyle = `rgba(249, 115, 22, ${Math.random()})`;
        for(let i=0; i<5; i++) {
            const px = s*0.6 + (Math.random()-0.5)*s*0.3;
            const py = (Math.random()-0.5)*s*0.3;
            ctx.beginPath(); ctx.arc(px, py, s*0.05, 0, Math.PI*2); ctx.fill();
        }
    }
    
    ctx.restore(); // Fin transformación bastón

    // <-- CAMBIO CURACIÓN: Rayo Mágico (NO DIBUJAR SI ES HEAL)
    if (isCasting && castProgress > 0.2 && !isHeal) {
         ctx.save();
         ctx.translate(centerX, centerY);
         ctx.rotate(rotation);
         ctx.translate(thrust, 0);
         
         ctx.fillStyle = isFireball 
            ? `rgba(249, 115, 22, ${1 - castProgress})`
            : `rgba(168, 85, 247, ${1 - castProgress})`;
            
         ctx.fillRect(s*0.6, -s*0.05, s*1.0, s*0.1); 
         ctx.restore();
    }
    
    // Capa (Igual)
    ctx.fillStyle = colors.tunic;
    ctx.globalCompositeOperation = "destination-over";
    ctx.beginPath();
    ctx.moveTo(x + s * 0.35, yAnim + s * 0.3);
    ctx.lineTo(x + s * 0.65, yAnim + s * 0.3);
    const waveSpeed = isAttacking ? 0.8 : 0.2;
    const waveAmp = isAttacking ? s * 0.1 : s * 0.05;
    const wave = Math.sin(frame * waveSpeed) * waveAmp;
    ctx.lineTo(x + s * 0.7 + wave, yAnim + s * 0.8);
    ctx.lineTo(x + s * 0.3 + wave, yAnim + s * 0.8);
    const lift = isCasting ? -s * 0.2 : 0;
    ctx.fill();
    ctx.lineTo(x + s * 0.7 + wave, yAnim + s * 0.8 + lift);
    ctx.lineTo(x + s * 0.3 + wave, yAnim + s * 0.8 + lift);
    ctx.globalCompositeOperation = "source-over";

  } else if (playerClass === "rogue") {
    // ... (CÓDIGO PÍCARO IGUAL QUE ANTES) ...
    ctx.save();
    const centerX = x + s * 0.5;
    const centerY = yAnim + s * 0.4;
    ctx.translate(centerX, centerY);

    let rotation = Math.PI / 1.5;
    let thrust1 = 0;
    let thrust2 = 0;

    if (isAttacking) {
      const dir = lastAttackDir || { x: 1, y: 0 };
      rotation = Math.atan2(dir.y, dir.x);

      if (isBackstab) {
          thrust1 = Math.sin(attackProgress * Math.PI) * (s * 0.6);
          thrust2 = Math.sin(attackProgress * Math.PI) * (s * 0.6);
      } else {
          thrust1 = Math.sin(attackProgress * Math.PI) * (s * 0.4);
          const prog2 = Math.max(0, attackProgress - 0.2) / 0.8;
          thrust2 = Math.sin(prog2 * Math.PI) * (s * 0.4);
      }
    } else if (isCasting) {
      rotation = -Math.PI / 2; 
      thrust1 = -s * 0.1;
      thrust2 = -s * 0.1;
      rotation += Math.sin(frame) * 0.2; 
    } else {
      ctx.translate(0, s * 0.1);
    }

    ctx.rotate(rotation);

    const drawDagger = (offsetX, thrust, colorOverride) => {
      ctx.save();
      ctx.translate(thrust, offsetX); 
      ctx.fillStyle = colorOverride || "#cbd5e1";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(s * 0.25, 0); 
      ctx.lineTo(0, s * 0.06);
      ctx.lineTo(0, -s * 0.06);
      ctx.fill();
      ctx.fillStyle = "#475569";
      ctx.fillRect(-s * 0.1, -s * 0.03, s * 0.1, s * 0.06);
      ctx.restore();
    };

    const effectColor = isCasting ? '#4ade80' : (isBackstab ? '#ef4444' : null);

    drawDagger(-s * 0.15, thrust1, effectColor);
    drawDagger(s * 0.15, thrust2, effectColor);

    ctx.restore();
  }
  // 3. RESTAURAR ESTADO DEL CONTEXTO (Elimina la opacidad para el resto del juego)
  ctx.restore();
}