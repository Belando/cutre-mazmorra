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
  isInvisible = false,
  lastMoveTime = 0 
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
    isInvisible,
    lastMoveTime 
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
  isInvisible,
  lastMoveTime
) {
  ctx.save();

  if (isInvisible) {
      ctx.globalAlpha = 0.4;
  }
  
  const s = size;
  const colors = appearance.colors;
  const now = Date.now();

  // --- LÓGICA DE MOVIMIENTO ---
  const MOVE_DURATION = 150; 
  const isMoving = (now - lastMoveTime) < MOVE_DURATION;
  
  const walkCycle = isMoving ? Math.sin(now * 0.015) : 0; 
  const bodyBob = isMoving ? Math.abs(walkCycle) * s * 0.02 : 0;
  
  // Balanceo de brazos
  // armSwing: rotación principal (adelante/atrás)
  const armSwing = isMoving ? Math.sin(now * 0.015) * 0.4 : 0;
  // armInward: rotación "hacia dentro" (cruce ligero al caminar)
  const armInward = isMoving ? Math.abs(Math.sin(now * 0.015)) * 0.1 : 0;

  const leftLegLift = isMoving && walkCycle > 0 ? walkCycle * s * 0.08 : 0;
  const rightLegLift = isMoving && walkCycle < 0 ? -walkCycle * s * 0.08 : 0;

  // --- LÓGICA DE COMBATE ---
  const ATTACK_DURATION = 250;
  const SKILL_DURATION = 400;
  const timeSinceAttack = now - lastAttackTime;
  const isAttacking = timeSinceAttack < ATTACK_DURATION;
  const isCasting = (now - lastSkillTime) < SKILL_DURATION;
  
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

  // --- SUELO ---
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
      
      let circleColor = playerClass === 'mage' ? '#a855f7' : '#fbbf24';
      if (isHeal) circleColor = '#22c55e';
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

  // --- SOMBRA ---
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  const breath = Math.sin(frame * (isCasting ? 0.5 : 0.1)) * (isCasting ? s * 0.05 : s * 0.02);
  const shadowScale = 1 - breath / s;
  const jumpScale = 1 - bodyBob / s; 
  ctx.ellipse(
    x + s * 0.5,
    y + s * 0.85,
    s * 0.3 * shadowScale * jumpScale,
    s * 0.1 * shadowScale * jumpScale,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  const yAnim = y + breath - (isCasting ? s * 0.1 : 0) - bodyBob;
  const cx = x + s * 0.5;
  const cy = yAnim + s * 0.5;

  ctx.translate(cx, cy);
  if (isBackstab) ctx.rotate(attackProgress * Math.PI * 2);
  if (isMoving) ctx.rotate(walkCycle * 0.05); 
  ctx.translate(-cx, -cy);

  // ==========================================
  //      DIBUJO DEL CUERPO
  // ==========================================

  // 1. PIERNAS
  const legColor = playerClass === 'warrior' ? '#334155' : (playerClass === 'rogue' ? '#1c1917' : '#1e1b4b');
  ctx.fillStyle = legColor;
  ctx.fillRect(x + s * 0.35, yAnim + s * 0.65 - leftLegLift, s * 0.12, s * 0.25);
  ctx.fillRect(x + s * 0.53, yAnim + s * 0.65 - rightLegLift, s * 0.12, s * 0.25);
  
  ctx.fillStyle = '#0f172a'; 
  ctx.beginPath();
  ctx.arc(x + s * 0.41, yAnim + s * 0.9 - leftLegLift, s * 0.07, 0, Math.PI * 2);
  ctx.arc(x + s * 0.59, yAnim + s * 0.9 - rightLegLift, s * 0.07, 0, Math.PI * 2);
  ctx.fill();

  // 2. TORSO Y CABEZA
  if (playerClass === "warrior") {
      // GUERRERO (Sin cambios)
      ctx.fillStyle = '#7f1d1d'; 
      ctx.fillRect(x + s * 0.3, yAnim + s * 0.3, s * 0.4, s * 0.5);

      ctx.fillStyle = '#94a3b8'; 
      ctx.beginPath();
      ctx.moveTo(x + s * 0.25, yAnim + s * 0.3); 
      ctx.lineTo(x + s * 0.75, yAnim + s * 0.3);
      ctx.lineTo(x + s * 0.7, yAnim + s * 0.7);
      ctx.lineTo(x + s * 0.3, yAnim + s * 0.7);
      ctx.fill();

      ctx.fillStyle = '#475569'; 
      ctx.beginPath();
      ctx.moveTo(x + s * 0.32, yAnim + s * 0.35); 
      ctx.lineTo(x + s * 0.15, yAnim + s * 0.28); 
      ctx.lineTo(x + s * 0.22, yAnim + s * 0.42); 
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(x + s * 0.68, yAnim + s * 0.35); 
      ctx.lineTo(x + s * 0.85, yAnim + s * 0.28); 
      ctx.lineTo(x + s * 0.78, yAnim + s * 0.42); 
      ctx.fill();

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + s * 0.32, yAnim + s * 0.35);
      ctx.lineTo(x + s * 0.15, yAnim + s * 0.28);
      ctx.lineTo(x + s * 0.22, yAnim + s * 0.42);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + s * 0.68, yAnim + s * 0.35);
      ctx.lineTo(x + s * 0.85, yAnim + s * 0.28);
      ctx.lineTo(x + s * 0.78, yAnim + s * 0.42);
      ctx.stroke();

      ctx.fillStyle = '#64748b'; 
      ctx.beginPath();
      ctx.arc(x + s * 0.5, yAnim + s * 0.22, s * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a'; 
      ctx.fillRect(x + s * 0.35, yAnim + s * 0.22, s * 0.3, s * 0.04);
      ctx.fillRect(x + s * 0.48, yAnim + s * 0.15, s * 0.04, s * 0.15);

  } else if (playerClass === "mage") {
      // --- MAGO MEJORADO ---
      
      // Túnica GRIS
      ctx.fillStyle = '#64748b'; 
      ctx.beginPath();
      ctx.moveTo(x + s * 0.3, yAnim + s * 0.25);
      ctx.lineTo(x + s * 0.7, yAnim + s * 0.25);
      // Cintura
      ctx.lineTo(x + s * 0.7, yAnim + s * 0.5); 
      // Bajo
      ctx.lineTo(x + s * 0.65, yAnim + s * 0.85); 
      ctx.quadraticCurveTo(x + s * 0.5, yAnim + s * 0.9, x + s * 0.35, yAnim + s * 0.85);
      ctx.lineTo(x + s * 0.3, yAnim + s * 0.5); 
      ctx.closePath();
      ctx.fill();

      // BRAZO IZQUIERDO (Mano Libre - Animación hacia dentro)
      ctx.save();
      // Pivote en el hombro izquierdo
      ctx.translate(x + s * 0.3, yAnim + s * 0.28);
      // Rotación compuesta: Balanceo + ligero cruce hacia el cuerpo
      ctx.rotate(-armSwing + armInward); 
      
      ctx.fillStyle = '#64748b'; // Color túnica
      ctx.beginPath();
      ctx.moveTo(0, 0); // Hombro local
      // Brazo ligeramente curvado
      ctx.lineTo(-s * 0.05, s * 0.15); 
      ctx.lineTo(-s * 0.02, s * 0.3); // Mano
      ctx.lineTo(s * 0.12, s * 0.25); // Ancho manga
      ctx.lineTo(s * 0.1, 0); // Vuelta al hombro
      ctx.fill();
      
      // Mano izquierda
      ctx.fillStyle = colors.skin;
      ctx.beginPath();
      ctx.arc(-s * 0.02, s * 0.32, s * 0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Fajín
      ctx.fillStyle = '#334155'; 
      ctx.fillRect(x + s * 0.33, yAnim + s * 0.52, s * 0.44, s * 0.08);

      ctx.fillStyle = colors.skin; // Cabeza
      ctx.beginPath();
      ctx.arc(x + s * 0.5, yAnim + s * 0.2, s * 0.16, 0, Math.PI * 2);
      ctx.fill();

      // Sombrero GRIS
      ctx.fillStyle = '#64748b'; 
      // Ala
      ctx.beginPath();
      // CAMBIO 1: De 0.18 a 0.10 (Sube la base)
      ctx.ellipse(x + s * 0.5, yAnim + s * 0.10, s * 0.25, s * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Cono
      ctx.beginPath();
      // CAMBIO 2: De 0.18 a 0.10 (Inicio de la base del cono)
      ctx.moveTo(x + s * 0.35, yAnim + s * 0.10);
      
      // CAMBIO 3: Ajustar la altura de la punta para mantener la proporción
      // Antes control: -0.05 -> Ahora -0.13
      // Antes punta: -0.18 -> Ahora -0.26
      // (Hemos restado 0.08 a todo para subirlo en bloque)
      ctx.quadraticCurveTo(x + s * 0.45, yAnim - s * 0.13, x + s * 0.4, yAnim - s * 0.26); 
      
      // CAMBIO 4: De 0.18 a 0.10 (Fin de la base del cono)
      ctx.lineTo(x + s * 0.65, yAnim + s * 0.10);
      ctx.fill();

      // Barba GRIS
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(x + s * 0.38, yAnim + s * 0.28);
      ctx.quadraticCurveTo(x + s * 0.5, yAnim + s * 0.55, x + s * 0.62, yAnim + s * 0.28);
      ctx.fill();

      ctx.fillStyle = '#1e293b'; // Ojos
      ctx.fillRect(x + s * 0.42, yAnim + s * 0.22, s * 0.04, s * 0.04);
      ctx.fillRect(x + s * 0.54, yAnim + s * 0.22, s * 0.04, s * 0.04);

  } else {
      // PÍCARO
      ctx.fillStyle = '#1c1917'; // Capa
      ctx.beginPath();
      ctx.moveTo(x + s * 0.3, yAnim + s * 0.3);
      ctx.lineTo(x + s * 0.7, yAnim + s * 0.3);
      ctx.lineTo(x + s * 0.8, yAnim + s * 0.75);
      ctx.lineTo(x + s * 0.2, yAnim + s * 0.75);
      ctx.fill();

      ctx.fillStyle = colors.tunic; // Torso
      ctx.fillRect(x + s * 0.32, yAnim + s * 0.35, s * 0.36, s * 0.35);
      
      ctx.fillStyle = '#78350f'; // Cinturón
      ctx.fillRect(x + s * 0.32, yAnim + s * 0.6, s * 0.36, s * 0.08);

      ctx.fillStyle = colors.tunic; // Capucha
      ctx.beginPath();
      ctx.arc(x + s * 0.5, yAnim + s * 0.22, s * 0.18, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#0f172a'; // Sombra cara
      ctx.beginPath();
      ctx.arc(x + s * 0.5, yAnim + s * 0.24, s * 0.12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef3c7'; // Ojos
      ctx.fillRect(x + s * 0.42, yAnim + s * 0.24, s * 0.04, s * 0.02);
      ctx.fillRect(x + s * 0.54, yAnim + s * 0.24, s * 0.04, s * 0.02);
  }

  // ==========================================
  //      ARMAS Y MANOS
  // ==========================================

  if (playerClass === "warrior") {
    // GUERRERO (Sin cambios)
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
          ctx.translate(s * 0.25, 0); 
        }

        ctx.rotate(rotation);
        ctx.translate(thrust, 0);

        ctx.fillStyle = isPowerStrike ? "#ef4444" : "#cbd5e1"; 
        ctx.fillRect(0, -s * 0.05, s * 0.45, s * 0.1); 
        ctx.beginPath(); 
        ctx.moveTo(s * 0.45, -s * 0.05);
        ctx.lineTo(s * 0.55, 0);
        ctx.lineTo(s * 0.45, s * 0.05);
        ctx.fill();

        ctx.fillStyle = "#fbbf24"; 
        ctx.fillRect(-s * 0.02, -s * 0.12, s * 0.08, s * 0.24);
        ctx.fillStyle = "#78350f"; 
        ctx.fillRect(-s * 0.15, -s * 0.04, s * 0.15, s * 0.08);

        if (isAttacking && attackProgress > 0.2 && attackProgress < 0.8) {
          ctx.fillStyle = isPowerStrike ? "rgba(239, 68, 68, 0.6)" : "rgba(255, 255, 255, 0.4)";
          ctx.fillRect(-s * 0.05, -s * 0.2, s * 0.4, s * 0.02);
          ctx.fillRect(-s * 0.05, s * 0.18, s * 0.4, s * 0.02);
        }
        ctx.restore();
    }

    ctx.save();
    ctx.translate(x + s * 0.5, yAnim + s * 0.5); 
    if (isShieldBash) {
        const dir = lastAttackDir || { x: 1, y: 0 };
        const bash = Math.sin(attackProgress * Math.PI) * (s * 0.5);
        ctx.translate(dir.x * bash, dir.y * bash);
    } else if (!isAttacking) {
        ctx.translate(-s * 0.25, s * 0.1); 
    } else {
        ctx.translate(-s * 0.2, 0); 
    }
    
    ctx.fillStyle = "#1e3a8a"; 
    ctx.beginPath();
    ctx.arc(0, 0, s * (isShieldBash ? 0.25 : 0.2), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fbbf24"; 
    ctx.lineWidth = 1.5; 
    ctx.stroke();
    ctx.fillStyle = "#94a3b8"; 
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

  } else if (playerClass === "mage") {
    // MAGO BASTÓN + BRAZO DERECHO
    ctx.save();
    const centerX = x + s * 0.5;
    const centerY = yAnim + s * 0.7;
    ctx.translate(centerX, centerY);

    // Rotación del bastón (siempre vertical en reposo)
    let rotation = -Math.PI / 2 + (isMoving ? Math.sin(frame * 0.05) * 0.05 : 0);
    let thrust = 0;

    if (isHeal) {
        rotation = -Math.PI / 2; 
        thrust = -s * 0.2 + Math.sin(castProgress * Math.PI) * (-s * 0.1);
        ctx.translate(0, -s * 0.2);
    } else if (isAttacking) {
        const dir = lastAttackDir || { x: 1, y: 0 };
        rotation = Math.atan2(dir.y, dir.x);
        thrust = Math.sin(attackProgress * Math.PI) * (s * 0.1);
    } else if (isCasting) {
        const dir = lastAttackDir || { x: 1, y: 0 };
        if (dir.x === 0 && dir.y === 0) rotation = -Math.PI / 2;
        else rotation = Math.atan2(dir.y, dir.x);
        thrust = Math.sin(castProgress * Math.PI * 4) * (s * 0.05) + (s * 0.2);
    } else {
      // REPOSO: Posición lateral
      ctx.translate(s * 0.25, s * 0.1); 
      // Leve oscilación al andar
      ctx.rotate(armSwing * 0.3);
    }

    ctx.rotate(rotation);
    ctx.translate(thrust, 0);

    // Brazo Derecho (Manga conectando al hombro)
    ctx.fillStyle = '#64748b'; // Color túnica
    ctx.beginPath();
    ctx.moveTo(0, 0); // Hombro relativo
    ctx.lineTo(s * 0.4, s * 0.04); // Hacia la mano (bastón)
    ctx.lineTo(s * 0.35, -s * 0.08); // Grosor manga
    ctx.fill();

    // Vara (Extendida hacia abajo hasta los pies)
    ctx.fillStyle = "#78350f";
    ctx.fillRect(-s * 0.1, -s * 0.025, s * 0.9, s * 0.05); 
    ctx.fillRect(0.4 * s - 0.55 * s, -s * 0.025, s * 0.8, s * 0.05); 

    // Mano (Piel) sujetando la vara
    ctx.fillStyle = colors.skin;
    ctx.beginPath();
    ctx.arc(s * 0.4, 0, s * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Soporte orbe (Punta superior)
    const tipX = 0.4 * s + 0.35 * s; // 0.75s
    ctx.fillStyle = "#78350f";
    ctx.beginPath();
    ctx.moveTo(tipX, s * 0.05);
    ctx.lineTo(tipX + s * 0.1, s * 0.08);
    ctx.lineTo(tipX + s * 0.1, -s * 0.08);
    ctx.lineTo(tipX, -s * 0.05);
    ctx.fill();

    // ORBE (Altura sombrero)
    let orbColor = '#ffffff'; 
    let glowColor = '#ffffff';

    if (isCasting) {
        if (isHeal) glowColor = '#22c55e';
        else if (isFireball) glowColor = '#f97316';
        else glowColor = '#a855f7';
    }

    ctx.fillStyle = orbColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = (10 + Math.sin(frame * 0.2) * 5) * (isCasting ? 2 : 0.5);
    
    ctx.beginPath();
    ctx.arc(tipX + s * 0.1, 0, s * (isCasting ? 0.15 : 0.13), 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Rayo
    if (isCasting && castProgress > 0.2 && !isHeal) {
         ctx.save();
         ctx.fillStyle = isFireball 
            ? `rgba(249, 115, 22, ${1 - castProgress})`
            : `rgba(168, 85, 247, ${1 - castProgress})`;
         ctx.fillRect(tipX + s * 0.1, -s*0.05, s*1.0, s*0.1); 
         ctx.restore();
    }
    
    ctx.restore(); 

  } else if (playerClass === "rogue") {
    // PÍCARO (Sin cambios)
    ctx.save();
    const centerX = x + s * 0.5;
    const centerY = yAnim + s * 0.5;
    ctx.translate(centerX, centerY);

    let rotation = Math.PI / 1.5;
    let thrust1 = 0;
    let thrust2 = 0;
    let tilt = 0;

    if (isAttacking) {
      const dir = lastAttackDir || { x: 1, y: 0 };
      rotation = Math.atan2(dir.y, dir.x);
      thrust1 = Math.sin(attackProgress * Math.PI) * (s * 0.5);
      thrust2 = Math.sin(Math.max(0, attackProgress - 0.2) / 0.8 * Math.PI) * (s * 0.5);
    } else {
      rotation = Math.PI / 2;
      ctx.translate(0, s * 0.1);
      tilt = 0.4;
    }

    ctx.rotate(rotation);

    const drawDagger = (offsetX, thrust, angle, colorOverride) => {
      ctx.save();
      ctx.translate(thrust, offsetX); 
      ctx.rotate(angle);
      ctx.fillStyle = colorOverride || "#cbd5e1";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(s * 0.3, 0); 
      ctx.lineTo(0, s * 0.08);
      ctx.lineTo(0, -s * 0.06);
      ctx.fill();
      ctx.fillStyle = "#475569";
      ctx.fillRect(-s * 0.12, -s * 0.02, s * 0.12, s * 0.04);
      ctx.restore();
    };

    const effectColor = isCasting ? '#4ade80' : (isBackstab ? '#ef4444' : null);

    drawDagger(-s * 0.11, thrust1, tilt, effectColor);
    drawDagger(s * 0.11, thrust2, -tilt, effectColor);

    ctx.restore();
  }

  ctx.restore();
}