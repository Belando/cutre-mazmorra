// Item sprite rendering system

export function drawItemSprite(ctx, item, x, y, size) {
  const s = size;
  
  // Draw based on category and rarity
  const rarityGlow = {
    common: null,
    uncommon: { color: '#22c55e', blur: 4 },
    rare: { color: '#3b82f6', blur: 6 },
    epic: { color: '#a855f7', blur: 8 },
    legendary: { color: '#fbbf24', blur: 10 },
  };
  
  const glow = rarityGlow[item.rarity];
  
  if (glow) {
    ctx.shadowColor = glow.color;
    ctx.shadowBlur = glow.blur;
  }
  
  switch (item.category) {
    case 'weapon':
      drawWeaponSprite(ctx, item, x, y, s);
      break;
    case 'armor':
      drawArmorSprite(ctx, item, x, y, s);
      break;
    case 'potion':
      drawPotionSprite(ctx, item, x, y, s);
      break;
    case 'ammo':
      drawAmmoSprite(ctx, item, x, y, s);
      break;
    default:
      // Fallback to symbol
      ctx.fillStyle = glow?.color || '#9ca3af';
      ctx.font = `bold ${s * 0.6}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.symbol, x + s/2, y + s/2);
  }
  
  ctx.shadowBlur = 0;
}

function drawWeaponSprite(ctx, item, x, y, size) {
  const s = size;
  const rarityColors = {
    common: '#71717a',
    uncommon: '#3b82f6',
    rare: '#6366f1',
    epic: '#a855f7',
    legendary: '#fbbf24',
  };
  
  const bladeColor = rarityColors[item.rarity] || '#71717a';
  
  if (item.templateKey?.includes('sword')) {
    // Sword
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + s*0.42, y + s*0.5, s*0.16, s*0.35);
    ctx.fillStyle = bladeColor;
    ctx.beginPath();
    ctx.moveTo(x + s*0.5, y + s*0.1);
    ctx.lineTo(x + s*0.6, y + s*0.5);
    ctx.lineTo(x + s*0.4, y + s*0.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(x + s*0.5, y + s*0.52, s*0.12, s*0.06, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.templateKey?.includes('axe')) {
    // Axe
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + s*0.45, y + s*0.3, s*0.1, s*0.6);
    ctx.fillStyle = bladeColor;
    ctx.beginPath();
    ctx.moveTo(x + s*0.3, y + s*0.25);
    ctx.lineTo(x + s*0.7, y + s*0.3);
    ctx.lineTo(x + s*0.6, y + s*0.45);
    ctx.lineTo(x + s*0.4, y + s*0.4);
    ctx.closePath();
    ctx.fill();
  } else if (item.templateKey?.includes('dagger')) {
    // Dagger
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + s*0.44, y + s*0.6, s*0.12, s*0.25);
    ctx.fillStyle = bladeColor;
    ctx.beginPath();
    ctx.moveTo(x + s*0.5, y + s*0.2);
    ctx.lineTo(x + s*0.58, y + s*0.6);
    ctx.lineTo(x + s*0.42, y + s*0.6);
    ctx.closePath();
    ctx.fill();
  } else {
    // Generic weapon
    ctx.fillStyle = bladeColor;
    ctx.fillRect(x + s*0.4, y + s*0.2, s*0.2, s*0.6);
  }
}

function drawArmorSprite(ctx, item, x, y, size) {
  const s = size;
  const rarityColors = {
    common: '#a1a1aa',
    uncommon: '#3b82f6',
    rare: '#6366f1',
    epic: '#a855f7',
    legendary: '#fbbf24',
  };
  
  const armorColor = rarityColors[item.rarity] || '#a1a1aa';
  
  if (item.slot === 'armor') {
    // Chestplate
    ctx.fillStyle = armorColor;
    ctx.fillRect(x + s*0.25, y + s*0.25, s*0.5, s*0.6);
    ctx.fillStyle = adjustBrightness(armorColor, -30);
    ctx.fillRect(x + s*0.3, y + s*0.3, s*0.4, s*0.5);
    // Shoulder pads
    ctx.fillStyle = armorColor;
    ctx.fillRect(x + s*0.15, y + s*0.2, s*0.15, s*0.15);
    ctx.fillRect(x + s*0.7, y + s*0.2, s*0.15, s*0.15);
  } else if (item.slot === 'accessory') {
    // Ring/Amulet
    if (item.templateKey?.includes('ring')) {
      ctx.strokeStyle = armorColor;
      ctx.lineWidth = s * 0.1;
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.5, s*0.25, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.5, s*0.08, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Amulet
      ctx.strokeStyle = armorColor;
      ctx.lineWidth = s * 0.08;
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.35, s*0.15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.moveTo(x + s*0.5, y + s*0.5);
      ctx.lineTo(x + s*0.4, y + s*0.75);
      ctx.lineTo(x + s*0.6, y + s*0.75);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawPotionSprite(ctx, item, x, y, size) {
  const s = size;
  
  // Bottle
  ctx.fillStyle = 'rgba(100, 150, 200, 0.3)';
  ctx.fillRect(x + s*0.35, y + s*0.25, s*0.3, s*0.55);
  ctx.fillRect(x + s*0.42, y + s*0.15, s*0.16, s*0.12);
  
  // Cork
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x + s*0.42, y + s*0.12, s*0.16, s*0.05);
  
  // Liquid color based on type
  let liquidColor = '#ef4444';
  if (item.stats?.attackBoost) liquidColor = '#f59e0b';
  if (item.stats?.maxHpBoost) liquidColor = '#ec4899';
  
  ctx.fillStyle = liquidColor;
  ctx.globalAlpha = 0.8;
  ctx.fillRect(x + s*0.37, y + s*0.4, s*0.26, s*0.38);
  ctx.globalAlpha = 1;
  
  // Highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillRect(x + s*0.4, y + s*0.3, s*0.08, s*0.15);
}

function drawAmmoSprite(ctx, item, x, y, size) {
  const s = size;
  
  // Arrow bundle
  ctx.fillStyle = '#78350f';
  for (let i = 0; i < 3; i++) {
    const offset = i * s * 0.15;
    ctx.fillRect(x + s*0.2 + offset, y + s*0.3, s*0.05, s*0.5);
    // Arrowhead
    ctx.fillStyle = '#71717a';
    ctx.beginPath();
    ctx.moveTo(x + s*0.225 + offset, y + s*0.3);
    ctx.lineTo(x + s*0.175 + offset, y + s*0.4);
    ctx.lineTo(x + s*0.275 + offset, y + s*0.4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#78350f';
  }
  
  // Feathers
  ctx.fillStyle = '#fef3c7';
  for (let i = 0; i < 3; i++) {
    const offset = i * s * 0.15;
    ctx.beginPath();
    ctx.moveTo(x + s*0.225 + offset, y + s*0.75);
    ctx.lineTo(x + s*0.15 + offset, y + s*0.85);
    ctx.lineTo(x + s*0.225 + offset, y + s*0.8);
    ctx.fill();
  }
}

function adjustBrightness(hex, amount) {
  if (!hex || typeof hex !== 'string') {
  return '#000000'; 
}
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}