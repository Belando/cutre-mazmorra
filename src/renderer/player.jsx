export function drawPlayer(ctx, x, y, size, appearance = null, playerClass = null) {
  // Si no hay apariencia, usa la lógica default
  if (appearance || playerClass) {
      drawCustomPlayer(ctx, x, y, size, appearance || { 
          colors: { tunic: '#3b82f6', hair: '#8b5a2b', skin: '#fcd5b8' },
          class: playerClass || 'warrior'
      }, playerClass);
  } else {
      // Fallback a sprite básico
      const s = size;
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(x + s*0.3, y + s*0.35, s*0.4, s*0.4);
      ctx.fillStyle = '#fcd5b8';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.25, s*0.18, 0, Math.PI * 2);
      ctx.fill();
  }
}
// Draw player with custom appearance
function drawCustomPlayer(ctx, x, y, size, appearance, playerClass = null) {
  const s = size;
  const colors = appearance.colors;
  const classToUse = playerClass || appearance.class;
  
  // Body (tunic)
  ctx.fillStyle = colors.tunic;
  ctx.fillRect(x + s*0.3, y + s*0.35, s*0.4, s*0.4);
  
  // Head
  ctx.fillStyle = colors.skin;
  ctx.beginPath();
  ctx.arc(x + s*0.5, y + s*0.25, s*0.18, 0, Math.PI * 2);
  ctx.fill();
  
  // Class-specific items and appearance
  if (classToUse === 'warrior') {
    // Warrior hair
    ctx.fillStyle = colors.hair;
    ctx.beginPath();
    ctx.arc(x + s*0.5, y + s*0.2, s*0.15, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + s*0.35, y + s*0.12, s*0.3, s*0.1);
    
    // Eyes
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x + s*0.4, y + s*0.22, s*0.06, s*0.06);
    ctx.fillRect(x + s*0.54, y + s*0.22, s*0.06, s*0.06);
    
    // Sword
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x + s*0.7, y + s*0.25, s*0.08, s*0.35);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x + s*0.65, y + s*0.55, s*0.18, s*0.06);
    // Shield
    ctx.fillStyle = colors.tunic;
    ctx.beginPath();
    ctx.moveTo(x + s*0.1, y + s*0.35);
    ctx.lineTo(x + s*0.28, y + s*0.35);
    ctx.lineTo(x + s*0.28, y + s*0.55);
    ctx.lineTo(x + s*0.19, y + s*0.65);
    ctx.lineTo(x + s*0.1, y + s*0.55);
    ctx.closePath();
    ctx.fill();
    // Shield emblem
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(x + s*0.19, y + s*0.48, s*0.05, 0, Math.PI * 2);
    ctx.fill();
  } else if (classToUse === 'mage') {
    // Mage hood/hat
    ctx.fillStyle = colors.tunic;
    ctx.beginPath();
    ctx.moveTo(x + s*0.5, y + s*0.02);
    ctx.lineTo(x + s*0.72, y + s*0.25);
    ctx.lineTo(x + s*0.28, y + s*0.25);
    ctx.closePath();
    ctx.fill();
    
    // Hair under hood
    ctx.fillStyle = colors.hair;
    ctx.fillRect(x + s*0.35, y + s*0.22, s*0.3, s*0.06);
    
    // Eyes with glow
    ctx.fillStyle = '#a855f7';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 4;
    ctx.fillRect(x + s*0.4, y + s*0.24, s*0.06, s*0.05);
    ctx.fillRect(x + s*0.54, y + s*0.24, s*0.06, s*0.05);
    ctx.shadowBlur = 0;
    
    // Staff with glowing orb
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + s*0.72, y + s*0.15, s*0.05, s*0.55);
    ctx.fillStyle = '#a855f7';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x + s*0.745, y + s*0.12, s*0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Book in other hand
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(x + s*0.1, y + s*0.4, s*0.15, s*0.18);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(x + s*0.12, y + s*0.42, s*0.02, s*0.14);
  } else if (classToUse === 'rogue') {
    // Hood covering head
    ctx.fillStyle = colors.tunic;
    ctx.beginPath();
    ctx.arc(x + s*0.5, y + s*0.2, s*0.2, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + s*0.3, y + s*0.2, s*0.4, s*0.12);
    
    // Shadow on face
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(x + s*0.5, y + s*0.25, s*0.12, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes glinting in shadow
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 3;
    ctx.fillRect(x + s*0.42, y + s*0.24, s*0.05, s*0.04);
    ctx.fillRect(x + s*0.54, y + s*0.24, s*0.05, s*0.04);
    ctx.shadowBlur = 0;
    
    // Dual daggers
    ctx.fillStyle = '#71717a';
    // Right dagger
    ctx.beginPath();
    ctx.moveTo(x + s*0.75, y + s*0.3);
    ctx.lineTo(x + s*0.78, y + s*0.55);
    ctx.lineTo(x + s*0.72, y + s*0.55);
    ctx.closePath();
    ctx.fill();
    // Left dagger
    ctx.beginPath();
    ctx.moveTo(x + s*0.25, y + s*0.35);
    ctx.lineTo(x + s*0.28, y + s*0.55);
    ctx.lineTo(x + s*0.22, y + s*0.55);
    ctx.closePath();
    ctx.fill();
    
    // Cape flowing
    ctx.fillStyle = colors.tunic;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(x + s*0.3, y + s*0.35);
    ctx.quadraticCurveTo(x + s*0.1, y + s*0.6, x + s*0.15, y + s*0.85);
    ctx.lineTo(x + s*0.25, y + s*0.75);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  
  // Legs
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x + s*0.32, y + s*0.72, s*0.14, s*0.18);
  ctx.fillRect(x + s*0.54, y + s*0.72, s*0.14, s*0.18);
  
  // Boots
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x + s*0.3, y + s*0.85, s*0.18, s*0.1);
  ctx.fillRect(x + s*0.52, y + s*0.85, s*0.18, s*0.1);
}