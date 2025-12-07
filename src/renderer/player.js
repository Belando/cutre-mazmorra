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
  lastSkillTime = 0, lastSkillId = null
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
    lastAttackDir
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
  lastSkillTime
) {
  const s = size;
  const colors = appearance.colors;

  // LÓGICA DE TIEMPOS
  const now = Date.now();
  const ATTACK_DURATION = 250;
  const SKILL_DURATION = 400;
  const timeSinceAttack = Date.now() - lastAttackTime;
  const isAttacking = timeSinceAttack < ATTACK_DURATION;
  const isCasting = (now - lastSkillTime) < SKILL_DURATION;
  let attackProgress = 0;
  let castProgress = isCasting ? (now - lastSkillTime) / SKILL_DURATION : 0;

  if (isAttacking) {
    attackProgress = timeSinceAttack / ATTACK_DURATION;
  }

  // Animación de respiración (Idle)
  // Si está casteando, "flota" más alto y rápido (acumulando energía)
  const breathSpeed = isCasting ? 0.5 : 0.1;
  const breathAmp = isCasting ? s * 0.05 : s * 0.03;
  const breath = Math.sin(frame * breathSpeed) * breathAmp;
  const yAnim = y + breath - (isCasting ? s * 0.1 : 0);

  if (isCasting) {
      ctx.save();
      ctx.translate(x + s*0.5, y + s*0.5);
      ctx.rotate(frame * 0.1);
      ctx.strokeStyle = playerClass === 'mage' ? '#a855f7' : (playerClass === 'rogue' ? '#22c55e' : '#fbbf24');
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1 - castProgress; // Se desvanece
      ctx.beginPath();
      const radius = s * 0.4 + (castProgress * s * 0.3); // Se expande
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Rectángulo rotando (estilo rúnico simple)
      ctx.rotate(Math.PI/4);
      ctx.strokeRect(-radius*0.7, -radius*0.7, radius*1.4, radius*1.4);
      
      ctx.restore();
  }

  // Sombra
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
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

  // --- CUERPO ---
  ctx.fillStyle = colors.tunic;
  ctx.beginPath();
  ctx.moveTo(x + s * 0.3, yAnim + s * 0.4);
  ctx.lineTo(x + s * 0.7, yAnim + s * 0.4);
  ctx.lineTo(x + s * 0.75, yAnim + s * 0.75);
  ctx.lineTo(x + s * 0.25, yAnim + s * 0.75);
  ctx.fill();

  // --- CABEZA ---
  ctx.fillStyle = colors.skin;
  ctx.beginPath();
  ctx.arc(x + s * 0.5, yAnim + s * 0.25, s * 0.18, 0, Math.PI * 2);
  ctx.fill();

  // --- CLASE ESPECÍFICA ---
  if (playerClass === "warrior") {
    // Casco
    ctx.fillStyle = "#52525b";
    ctx.beginPath();
    ctx.arc(x + s * 0.5, yAnim + s * 0.2, s * 0.19, Math.PI, Math.PI * 2);
    ctx.lineTo(x + s * 0.7, yAnim + s * 0.35);
    ctx.lineTo(x + s * 0.3, yAnim + s * 0.35);
    ctx.fill();

    // --- ESPADA DIRECCIONAL (CORREGIDA) ---
    ctx.save();

    // Pivote en el centro del cuerpo
    const centerX = x + s * 0.5;
    const centerY = yAnim + s * 0.5;
    ctx.translate(centerX, centerY);

    // CORRECCIÓN 1: Rotación Idle apuntando hacia abajo (PI/2) con ligera oscilación
    let rotation = -Math.PI / 2 + Math.sin(frame * 0.05) * 0.05;
    let thrust = 0;

    if (isAttacking) {
      // Si ataca, usamos el ángulo hacia el objetivo
      const dir = lastAttackDir || { x: 1, y: 0 };
      rotation = Math.atan2(dir.y, dir.x);
      // Movimiento de estocada
      thrust = Math.sin(attackProgress * Math.PI) * (s * 0.6);
      
    } else if (isCasting) {
      // HABILIDAD (Grito de guerra): Levanta la espada al cielo
      rotation = -Math.PI / 2; // Vertical perfecta
      thrust = -s * 0.2; // La sube
      // Vibración
      rotation += Math.sin(frame * 0.8) * 0.1;
    }else {
      // Ajuste de posición en idle para que cuelgue al lado del cuerpo
      ctx.translate(s * 0.2, -s * 0.1);
    }

    // Aplicar transformaciones
    ctx.rotate(rotation);
    ctx.translate(thrust, 0);

    // CORRECCIÓN 2: ESPADA MÁS CORTA
    // Hoja (reducida de 0.6 a 0.35 de largo)
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(0, -s * 0.04, s * 0.35, s * 0.08);
    // Punta (ajustada al nuevo largo, termina en 0.45 en vez de 0.7)
    ctx.beginPath();
    ctx.moveTo(s * 0.35, -s * 0.04);
    ctx.lineTo(s * 0.45, 0);
    ctx.lineTo(s * 0.35, s * 0.04);
    ctx.fill();

    // Empuñadura y Guarda más compactas
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(-s * 0.1, -s * 0.03, s * 0.1, s * 0.06); // Mango
    ctx.fillStyle = "#52525b";
    ctx.fillRect(0, -s * 0.1, s * 0.03, s * 0.2); // Guarda vertical

    // Estela de velocidad (ajustada al largo)
    if (isAttacking && attackProgress > 0.2 && attackProgress < 0.8) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      // Largo reducido a s*0.3
      ctx.fillRect(-s * 0.05, -s * 0.15, s * 0.3, s * 0.02);
      ctx.fillRect(-s * 0.05, s * 0.13, s * 0.3, s * 0.02);
    }

    ctx.restore();

    // Escudo
    ctx.save();
    ctx.translate(x + s * 0.25, yAnim + s * 0.45);
    if (isAttacking)
      ctx.translate(Math.sin(attackProgress * Math.PI) * -s * 0.1, 0);
    ctx.fillStyle = "#330a03ff";
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#9b7411ff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  } else if (playerClass === "mage") {
    // Sombrero
    ctx.fillStyle = colors.tunic;
    ctx.beginPath();
    ctx.moveTo(x + s * 0.2, yAnim + s * 0.25);
    ctx.lineTo(x + s * 0.8, yAnim + s * 0.25);
    ctx.lineTo(x + s * 0.5, yAnim - s * 0.1 + Math.sin(frame * 0.1) * 2);
    ctx.fill();

    // --- BASTÓN DIRECCIONAL ---
    ctx.save();

    // CORRECCIÓN 1: El pivote de rotación para atacar debe ser el pecho (0.4)
    // Así al atacar horizontalmente no golpea el suelo.
    const centerX = x + s * 0.5;
    const centerY = yAnim + s * 0.4;
    ctx.translate(centerX, centerY);

    // Rotación base: Vertical hacia arriba (-90 grados) con oscilación
    let rotation = -Math.PI / 2.2 + Math.sin(frame * 0.05) * 0.05;
    let thrust = 0;

    if (isAttacking) {
      // Apuntar al enemigo
      const dir = lastAttackDir || { x: 1, y: 0 };
      rotation = Math.atan2(dir.y, dir.x);

      // Empuje del ataque
      thrust = Math.sin(attackProgress * Math.PI) * (s * 0.2);
    } else if (isCasting) {
        // LANZANDO HECHIZO: Apunta al enemigo o arriba
        const dir = lastAttackDir || { x: 1, y: 0 };
        // Si no hay dirección clara (self cast), apunta arriba
        if (dir.x === 0 && dir.y === 0) rotation = -Math.PI / 2;
        else rotation = Math.atan2(dir.y, dir.x);
        
        // Empuje vibrante
        thrust = Math.sin(castProgress * Math.PI * 4) * (s * 0.05) + (s * 0.2);
    }else {
      ctx.translate(s * 0.25, s * 0.3);
    }

    ctx.rotate(rotation);
    ctx.translate(thrust, 0);

    // Bastón (Dibujado horizontal apuntando a la derecha)
    ctx.fillStyle = "#78350f";
    ctx.fillRect(0, -s * 0.025, s * 0.6, s * 0.05); // Vara

    // Orbe en la punta
    ctx.fillStyle = isCasting ? "#fff" : "#a855f7"; // Orbe brilla blanco al castear
    ctx.shadowColor = isCasting || isAttacking ? "#fff" : "#a855f7";
    ctx.shadowBlur = (10 + Math.sin(frame * 0.2) * 5) * (isCasting ? 3 : (isAttacking ? 2 : 1));
    ctx.beginPath();
    ctx.arc(s * 0.6, 0, s * (isCasting ? 0.12 : 0.08), 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Partículas al atacar
    if (isAttacking && attackProgress > 0.4) {
      ctx.fillStyle = "#d8b4fe";
      for (let i = 0; i < 3; i++) {
        const px = s * 0.6 + (Math.random() - 0.5) * s * 0.4;
        const py = (Math.random() - 0.5) * s * 0.4;
        ctx.fillRect(px, py, 2, 2);
      }
    }
    ctx.restore();

    // Rayo mágico al castear
    if (isCasting && castProgress > 0.2) {
         ctx.fillStyle = `rgba(168, 85, 247, ${1 - castProgress})`;
         ctx.fillRect(s*0.6, -s*0.05, s*1.0, s*0.1); // Rayo saliendo
    }

    ctx.restore();

    // Capa (detrás)
    ctx.fillStyle = colors.tunic;
    ctx.globalCompositeOperation = "destination-over";
    ctx.beginPath();
    ctx.moveTo(x + s * 0.35, yAnim + s * 0.3);
    ctx.lineTo(x + s * 0.65, yAnim + s * 0.3);
    const waveSpeed = isAttacking ? 0.8 : 0.2;
    // Si castea, la capa vuela hacia arriba
    const waveAmp = isAttacking ? s * 0.1 : s * 0.05;
    const wave = Math.sin(frame * waveSpeed) * waveAmp;
    ctx.lineTo(x + s * 0.7 + wave, yAnim + s * 0.8);
    ctx.lineTo(x + s * 0.3 + wave, yAnim + s * 0.8);
    // Si castea, capa sube
    const lift = isCasting ? -s * 0.2 : 0;
    ctx.fill();
    ctx.lineTo(x + s * 0.7 + wave, yAnim + s * 0.8 + lift);
    ctx.lineTo(x + s * 0.3 + wave, yAnim + s * 0.8 + lift);
    ctx.globalCompositeOperation = "source-over";
  } else if (playerClass === "rogue") {
    // Capucha
    ctx.fillStyle = colors.tunic;
    ctx.beginPath();
    ctx.arc(x + s * 0.5, yAnim + s * 0.25, s * 0.2, Math.PI, 0);
    ctx.fill();

    // --- DAGAS DIRECCIONALES ---
    ctx.save();
    // Pivote en el centro
    const centerX = x + s * 0.5;
    const centerY = yAnim + s * 0.4;
    ctx.translate(centerX, centerY);

    let rotation = Math.PI / 1.5; // Idle: Apuntando abajo-derecha (reposo)
    let thrust1 = 0;
    let thrust2 = 0;

    if (isAttacking) {
      const dir = lastAttackDir || { x: 1, y: 0 };
      rotation = Math.atan2(dir.y, dir.x);

      // Puñalada doble rápida
      thrust1 = Math.sin(attackProgress * Math.PI) * (s * 0.4);
      // La segunda daga va con un pequeño retraso
      const prog2 = Math.max(0, attackProgress - 0.2) / 0.8;
      thrust2 = Math.sin(prog2 * Math.PI) * (s * 0.4);
    } else if (isCasting) {
      // HABILIDAD (Bomba de humo/Lanzar): Brazos cruzados o alzados
      rotation = -Math.PI / 2; 
      thrust1 = -s * 0.1;
      thrust2 = -s * 0.1;
      // Rotan opuestamente (efecto ninja)
      rotation += Math.sin(frame) * 0.2; 
    }else {
      // Ajuste idle: manos bajas
      ctx.translate(0, s * 0.1);
    }

    ctx.rotate(rotation);

    // Función auxiliar para dibujar una daga horizontal
    const drawDagger = (offsetX, thrust) => {
      ctx.save();
      ctx.translate(thrust, offsetX); // offsetX mueve la daga a izq/der del cuerpo

      // Hoja
      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(s * 0.25, 0); // Punta
      ctx.lineTo(0, s * 0.06);
      ctx.lineTo(0, -s * 0.06);
      ctx.fill();

      // Mango
      ctx.fillStyle = "#475569";
      ctx.fillRect(-s * 0.1, -s * 0.03, s * 0.1, s * 0.06);

      ctx.restore();
    };
      // Si castea, las dagas brillan verde (veneno/skill)
    const daggerColor = isCasting ? '#4ade80' : null;

    drawDagger(-s * 0.15, thrust1, daggerColor);
    drawDagger(s * 0.15, thrust2, daggerColor);

    // Dibujar Daga 1 (Izquierda relativa)
    drawDagger(-s * 0.15, thrust1);
    // Dibujar Daga 2 (Derecha relativa)
    drawDagger(s * 0.15, thrust2);

    ctx.restore();
  }

  // Ojos (Brillan al castear)
  ctx.fillStyle = isCasting ? '#fff' : "#1e293b";
  if (isAttacking || isCasting) {
    // ... (Ojos de esfuerzo igual que antes) ...
    ctx.beginPath(); ctx.moveTo(x + s * 0.4, yAnim + s * 0.22); ctx.lineTo(x + s * 0.48, yAnim + s * 0.25); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + s * 0.6, yAnim + s * 0.22); ctx.lineTo(x + s * 0.52, yAnim + s * 0.25); ctx.stroke();
    ctx.fillRect(x + s * 0.42, yAnim + s * 0.24, s * 0.05, s * 0.03);
    ctx.fillRect(x + s * 0.53, yAnim + s * 0.24, s * 0.05, s * 0.03);
  } else {
    if (frame % 200 < 190) {
      ctx.fillRect(x + s * 0.42, yAnim + s * 0.22, s * 0.05, s * 0.05);
      ctx.fillRect(x + s * 0.53, yAnim + s * 0.22, s * 0.05, s * 0.05);
    } else {
      ctx.fillRect(x + s * 0.42, yAnim + s * 0.24, s * 0.05, s * 0.01);
      ctx.fillRect(x + s * 0.53, yAnim + s * 0.24, s * 0.05, s * 0.01);
    }
  }
}
