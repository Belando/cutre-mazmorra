import { Item } from '@/types';

export function drawItemSprite(ctx: CanvasRenderingContext2D, item: Item, x: number, y: number, size: number) {
    const s = size;
    const rarityGlow: Record<string, { color: string, blur: number } | null> = {
        common: null,
        uncommon: { color: '#22c55e', blur: 4 },
        rare: { color: '#3b82f6', blur: 6 },
        epic: { color: '#a855f7', blur: 8 },
        legendary: { color: '#fbbf24', blur: 10 },
    };

    const glow = rarityGlow[item.rarity as string];
    if (glow) {
        ctx.shadowColor = glow.color;
        ctx.shadowBlur = glow.blur;
    }

    if (item.category === 'weapon') {
        if (item.weaponType === 'shield') drawShieldSprite(ctx, item, x, y, s);
        else if (item.weaponType === 'tome') drawTomeSprite(ctx, item, x, y, s);
        else if (item.weaponType === 'quiver') drawQuiverSprite(ctx, item, x, y, s);
        else drawWeaponSprite(ctx, item, x, y, s);
    } else if (item.category === 'armor') {
        drawArmorSprite(ctx, item, x, y, s);
    } else if (item.category === 'potion') {
        drawPotionSprite(ctx, item, x, y, s);
    } else if (item.category === 'ammo') {
        drawAmmoSprite(ctx, item, x, y, s);
    } else if (item.category === 'currency') {
        drawCoinSprite(ctx, x, y, s);
    } else if (item.category === 'accessory') {
        drawAccessorySprite(ctx, item, x, y, s);
    } else if (item.category === 'food') {
        drawFoodSprite(ctx, item, x, y, s);
    } else if (item.category === 'material') {
        drawMaterialSprite(ctx, item, x, y, s);
    } else {
        ctx.fillStyle = glow?.color || '#9ca3af';
        ctx.font = `bold ${s * 0.6}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const char = typeof item.symbol === 'string' ? item.symbol : (item.name?.[0] || '?');
        ctx.fillText(char, x + s / 2, y + s / 2);
    }

    ctx.shadowBlur = 0;
}

function getRarityColor(rarity: string) {
    const colors: Record<string, string> = {
        common: '#a1a1aa', uncommon: '#4ade80', rare: '#60a5fa',
        epic: '#c084fc', legendary: '#fbbf24'
    };
    return colors[rarity] || colors.common;
}

function drawShieldSprite(ctx: CanvasRenderingContext2D, item: Item, x: number, y: number, s: number) {
    const color = getRarityColor(item.rarity as string);
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(x + s * 0.2, y + s * 0.2);
    ctx.lineTo(x + s * 0.8, y + s * 0.2);
    ctx.lineTo(x + s * 0.8, y + s * 0.5);
    ctx.quadraticCurveTo(x + s * 0.5, y + s * 0.9, x + s * 0.2, y + s * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillRect(x + s * 0.45, y + s * 0.25, s * 0.1, s * 0.4);
    ctx.fillRect(x + s * 0.3, y + s * 0.35, s * 0.4, s * 0.1);
}

function drawTomeSprite(ctx: CanvasRenderingContext2D, item: Item, x: number, y: number, s: number) {
    const color = getRarityColor(item.rarity as string);
    ctx.fillStyle = color;
    ctx.fillRect(x + s * 0.25, y + s * 0.2, s * 0.5, s * 0.6);
    ctx.fillStyle = '#fefce8';
    ctx.fillRect(x + s * 0.3, y + s * 0.25, s * 0.4, s * 0.5);
    ctx.fillStyle = '#1e293b';
    ctx.font = `bold ${s * 0.3}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦', x + s * 0.5, y + s * 0.5);
}

function drawQuiverSprite(ctx: CanvasRenderingContext2D, _item: Item, x: number, y: number, s: number) {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + s * 0.35, y + s * 0.3, s * 0.3, s * 0.5);
    ctx.strokeStyle = '#fcd34d';
    ctx.beginPath();
    ctx.moveTo(x + s * 0.4, y + s * 0.3); ctx.lineTo(x + s * 0.35, y + s * 0.15);
    ctx.moveTo(x + s * 0.5, y + s * 0.3); ctx.lineTo(x + s * 0.5, y + s * 0.1);
    ctx.moveTo(x + s * 0.6, y + s * 0.3); ctx.lineTo(x + s * 0.65, y + s * 0.15);
    ctx.stroke();
}

function drawWeaponSprite(ctx: CanvasRenderingContext2D, item: Item, x: number, y: number, s: number) {
    const color = getRarityColor(item.rarity as string);
    const type = item.weaponType || 'sword';

    ctx.fillStyle = color;

    if (type === 'sword') {
        ctx.fillRect(x + s * 0.45, y + s * 0.1, s * 0.1, s * 0.6);
        ctx.fillStyle = '#78350f'; ctx.fillRect(x + s * 0.45, y + s * 0.7, s * 0.1, s * 0.2);
        ctx.fillStyle = '#94a3b8'; ctx.fillRect(x + s * 0.3, y + s * 0.7, s * 0.4, s * 0.05);
    } else if (type === 'axe') {
        ctx.fillStyle = '#78350f'; ctx.fillRect(x + s * 0.45, y + s * 0.2, s * 0.1, s * 0.7);
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(x + s * 0.45, y + s * 0.3, s * 0.25, 0, Math.PI * 2); ctx.fill();
    } else if (type === 'bow') {
        ctx.strokeStyle = '#78350f'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x + s * 0.3, y + s * 0.5, s * 0.4, -Math.PI / 2, Math.PI / 2); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x + s * 0.3, y + s * 0.1); ctx.lineTo(x + s * 0.3, y + s * 0.9); ctx.stroke();
    } else if (type === 'staff') {
        ctx.fillStyle = '#78350f'; ctx.fillRect(x + s * 0.45, y + s * 0.1, s * 0.1, s * 0.8);
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x + s * 0.5, y + s * 0.2, s * 0.15, 0, Math.PI * 2); ctx.fill();
    } else {
        ctx.fillRect(x + s * 0.4, y + s * 0.2, s * 0.2, s * 0.6);
    }
}

function drawArmorSprite(ctx: CanvasRenderingContext2D, item: Item, x: number, y: number, s: number) {
    const color = getRarityColor(item.rarity as string);
    ctx.fillStyle = color;

    if (item.armorType === 'heavy') ctx.fillStyle = '#94a3b8';
    else if (item.armorType === 'medium') ctx.fillStyle = '#92400e';
    else if (item.armorType === 'light') ctx.fillStyle = '#4c1d95';

    const type = item.slot;

    if (type === 'helmet') {
        ctx.beginPath(); ctx.arc(x + s * 0.5, y + s * 0.5, s * 0.3, Math.PI, 0); ctx.lineTo(x + s * 0.8, y + s * 0.8); ctx.lineTo(x + s * 0.2, y + s * 0.8); ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    } else if (type === 'chest') {
        ctx.fillRect(x + s * 0.25, y + s * 0.2, s * 0.5, s * 0.6);
        ctx.fillStyle = color; ctx.fillRect(x + s * 0.45, y + s * 0.2, s * 0.1, s * 0.6);
    } else if (type === 'legs') {
        ctx.fillRect(x + s * 0.3, y + s * 0.2, s * 0.15, s * 0.7);
        ctx.fillRect(x + s * 0.55, y + s * 0.2, s * 0.15, s * 0.7);
        ctx.fillRect(x + s * 0.3, y + s * 0.2, s * 0.4, s * 0.2);
    } else if (type === 'boots') {
        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(x + s * 0.2, y + s * 0.4, s * 0.15, s * 0.4);
        ctx.fillRect(x + s * 0.2, y + s * 0.7, s * 0.25, s * 0.1);
        ctx.fillRect(x + s * 0.6, y + s * 0.4, s * 0.15, s * 0.4);
        ctx.fillRect(x + s * 0.6, y + s * 0.7, s * 0.25, s * 0.1);
    } else if (type === 'gloves') {
        ctx.fillRect(x + s * 0.2, y + s * 0.3, s * 0.2, s * 0.4);
        ctx.fillRect(x + s * 0.6, y + s * 0.3, s * 0.2, s * 0.4);
    }
}

function drawPotionSprite(ctx: CanvasRenderingContext2D, item: Item, x: number, y: number, s: number) {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.arc(x + s * 0.5, y + s * 0.6, s * 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x + s * 0.4, y + s * 0.2, s * 0.2, s * 0.2);

    let liquid = '#ef4444';
    if ((item.stats as any)?.mana) liquid = '#3b82f6';
    if ((item.stats as any)?.attackBoost) liquid = '#f59e0b';
    ctx.fillStyle = liquid;
    ctx.beginPath(); ctx.arc(x + s * 0.5, y + s * 0.6, s * 0.2, 0, Math.PI * 2); ctx.fill();
}

function drawCoinSprite(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
    ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(x + s * 0.5, y + s * 0.5, s * 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f59e0b'; ctx.stroke();
    ctx.fillStyle = '#fefce8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${s * 0.3}px sans-serif`; ctx.fillText('$', x + s * 0.5, y + s * 0.52);
}

function drawAmmoSprite(ctx: CanvasRenderingContext2D, _item: Item, x: number, y: number, s: number) {
    ctx.strokeStyle = '#78350f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + s * 0.2, y + s * 0.8); ctx.lineTo(x + s * 0.8, y + s * 0.2); ctx.stroke();
    ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(x + s * 0.8, y + s * 0.2); ctx.lineTo(x + s * 0.7, y + s * 0.35); ctx.lineTo(x + s * 0.65, y + s * 0.3); ctx.fill();
}

function drawAccessorySprite(ctx: CanvasRenderingContext2D, item: Item, x: number, y: number, s: number) {
    const color = getRarityColor(item.rarity as string);
    if (item.slot === 'ring') {
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x + s * 0.5, y + s * 0.5, s * 0.25, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x + s * 0.5, y + s * 0.3, s * 0.08, 0, Math.PI * 2); ctx.fill();
    } else if (item.slot === 'necklace') {
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x + s * 0.5, y + s * 0.4, s * 0.25, 0, Math.PI); ctx.stroke();
        ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x + s * 0.5, y + s * 0.65); ctx.lineTo(x + s * 0.4, y + s * 0.85); ctx.lineTo(x + s * 0.6, y + s * 0.85); ctx.fill();
    } else {
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x + s * 0.5, y + s * 0.5, s * 0.15, 0, Math.PI * 2); ctx.fill();
    }
}

function drawFoodSprite(ctx: CanvasRenderingContext2D, _item: Item, x: number, y: number, s: number) {
    ctx.fillStyle = '#ef4444'; // Red Apple/Meat
    ctx.beginPath(); ctx.arc(x + s * 0.5, y + s * 0.6, s * 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#16a34a'; // Stem/Leaf
    ctx.fillRect(x + s * 0.45, y + s * 0.25, s * 0.1, s * 0.15);
}

function drawMaterialSprite(ctx: CanvasRenderingContext2D, _item: Item, x: number, y: number, s: number) {
    ctx.fillStyle = '#64748b'; // Gray Ore/Stone
    ctx.beginPath();
    ctx.moveTo(x + s * 0.3, y + s * 0.8);
    ctx.lineTo(x + s * 0.5, y + s * 0.3);
    ctx.lineTo(x + s * 0.7, y + s * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(x + s * 0.5, y + s * 0.3);
    ctx.lineTo(x + s * 0.8, y + s * 0.8);
    ctx.lineTo(x + s * 0.6, y + s * 0.8);
    ctx.fill();
}
