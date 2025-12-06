// src/renderer/player.jsx

export function drawPlayer(ctx, x, y, size, appearance = null, playerClass = null, frame = 0) {
  const app = appearance || { colors: { tunic: '#3b82f6', hair: '#8b5a2b', skin: '#fcd5b8' }, class: 'warrior' };
  drawCustomPlayer(ctx, x, y, size, app, playerClass || app.class, frame);
}

function drawCustomPlayer(ctx, x, y, size, appearance, playerClass, frame) {
  const s = size;
  const colors = appearance.colors;
  
  // Animación de respiración/flotación (Idle)
  const breath = Math.sin(frame * 0.1) * (s * 0.03); // Sube y baja 3%
  const yAnim = y + breath; // Posición Y animada
  
  // Sombra (fija en el suelo, se encoge cuando el jugador sube)
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  const shadowScale = 1 - (breath / s); 
  ctx.ellipse(x + s*0.5, y + s*0.85, s*0.3 * shadowScale, s*0.1 * shadowScale, 0, 0, Math.PI*2);
  ctx.fill();

  // --- CUERPO ---
  // Túnica/Cuerpo
  ctx.fillStyle = colors.tunic;
  // Forma un poco más redondeada/orgánica
  ctx.beginPath();
  ctx.moveTo(x + s*0.3, yAnim + s*0.4);
  ctx.lineTo(x + s*0.7, yAnim + s*0.4);
  ctx.lineTo(x + s*0.75, yAnim + s*0.75); // Más ancho abajo
  ctx.lineTo(x + s*0.25, yAnim + s*0.75);
  ctx.fill();

  // --- CABEZA ---
  ctx.fillStyle = colors.skin;
  ctx.beginPath();
  ctx.arc(x + s*0.5, yAnim + s*0.25, s*0.18, 0, Math.PI * 2);
  ctx.fill();

  // --- CLASE ESPECÍFICA ---
  if (playerClass === 'warrior') {
    // Casco mejorado
    ctx.fillStyle = '#52525b'; // Gris oscuro metal
    ctx.beginPath();
    ctx.arc(x + s*0.5, yAnim + s*0.2, s*0.19, Math.PI, Math.PI * 2); // Cúpula
    ctx.lineTo(x + s*0.7, yAnim + s*0.35);
    ctx.lineTo(x + s*0.3, yAnim + s*0.35);
    ctx.fill();
    
    // Espada (Animada: se balancea ligeramente)
    ctx.save();
    ctx.translate(x + s*0.75, yAnim + s*0.4);
    ctx.rotate(Math.sin(frame * 0.05) * 0.1); // Balanceo suave
    ctx.fillStyle = '#94a3b8'; // Hoja
    ctx.fillRect(-s*0.04, -s*0.2, s*0.08, s*0.5);
    ctx.fillStyle = '#fbbf24'; // Empuñadura dorada
    ctx.fillRect(-s*0.06, 0.15*s, s*0.12, s*0.04);
    ctx.restore();

    // Escudo
    ctx.fillStyle = '#1e40af';
    ctx.beginPath();
    ctx.arc(x + s*0.25, yAnim + s*0.45, s*0.15, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24'; // Borde dorado
    ctx.lineWidth = 2;
    ctx.stroke();

  } else if (playerClass === 'mage') {
    // Sombrero de Mago
    ctx.fillStyle = colors.tunic;
    ctx.beginPath();
    ctx.moveTo(x + s*0.2, yAnim + s*0.25);
    ctx.lineTo(x + s*0.8, yAnim + s*0.25);
    ctx.lineTo(x + s*0.5, yAnim - s*0.1 + (Math.sin(frame*0.1)*2)); // La punta se mueve
    ctx.fill();
    
    // Bastón con orbe brillante
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + s*0.75, yAnim + s*0.1, s*0.05, s*0.6);
    // Orbe pulsante
    ctx.fillStyle = '#a855f7';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 10 + Math.sin(frame * 0.2) * 5;
    ctx.beginPath();
    ctx.arc(x + s*0.77, yAnim + s*0.1, s*0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Capa (detrás)
    ctx.fillStyle = colors.tunic;
    ctx.globalCompositeOperation = 'destination-over'; // Dibujar detrás
    ctx.beginPath();
    ctx.moveTo(x + s*0.35, yAnim + s*0.3);
    ctx.lineTo(x + s*0.65, yAnim + s*0.3);
    // Ondeo de la capa
    const wave = Math.sin(frame * 0.2) * s * 0.05;
    ctx.lineTo(x + s*0.7 + wave, yAnim + s*0.8);
    ctx.lineTo(x + s*0.3 + wave, yAnim + s*0.8);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

  } else if (playerClass === 'rogue') {
    // Capucha y antifaz
    ctx.fillStyle = colors.tunic;
    ctx.beginPath();
    ctx.arc(x + s*0.5, yAnim + s*0.25, s*0.2, Math.PI, 0); // Capucha arriba
    ctx.fill();
    
    // Dagas duales (Posición de combate)
    ctx.fillStyle = '#cbd5e1';
    // Daga 1
    ctx.beginPath();
    ctx.moveTo(x + s*0.2, yAnim + s*0.5);
    ctx.lineTo(x + s*0.1, yAnim + s*0.3);
    ctx.lineTo(x + s*0.25, yAnim + s*0.4);
    ctx.fill();
    // Daga 2
    ctx.beginPath();
    ctx.moveTo(x + s*0.8, yAnim + s*0.5);
    ctx.lineTo(x + s*0.9, yAnim + s*0.3);
    ctx.lineTo(x + s*0.75, yAnim + s*0.4);
    ctx.fill();
  }

  // Ojos (común) - Parpadeo
  if (frame % 200 < 190) { // Parpadea cada 200 frames
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + s*0.42, yAnim + s*0.22, s*0.05, s*0.05);
    ctx.fillRect(x + s*0.53, yAnim + s*0.22, s*0.05, s*0.05);
  } else {
    ctx.fillStyle = '#1e293b'; // Ojos cerrados
    ctx.fillRect(x + s*0.42, yAnim + s*0.24, s*0.05, s*0.01);
    ctx.fillRect(x + s*0.53, yAnim + s*0.24, s*0.05, s*0.01);
  }
}