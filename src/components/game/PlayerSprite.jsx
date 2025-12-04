import React, { useRef, useEffect } from 'react';
import { PLAYER_APPEARANCES } from './CharacterSelect';

export default function PlayerSprite({ size = 32, appearance = null, playerClass = null }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const s = size;
    
    ctx.clearRect(0, 0, s, s);
    
    // Get colors from appearance or default
    const app = appearance && PLAYER_APPEARANCES[appearance] ? PLAYER_APPEARANCES[appearance] : null;
    const colors = app ? app.colors : { tunic: '#3b82f6', hair: '#8b5a2b', skin: '#fcd5b8' };
    const classToUse = playerClass || (app ? app.class : 'warrior');
    
    // Body (tunic)
    ctx.fillStyle = colors.tunic;
    ctx.fillRect(s*0.3, s*0.35, s*0.4, s*0.4);
    
    // Head (skin tone)
    ctx.fillStyle = colors.skin;
    ctx.beginPath();
    ctx.arc(s*0.5, s*0.25, s*0.18, 0, Math.PI * 2);
    ctx.fill();
    
    // Class-specific appearance with better sprites
    if (classToUse === 'warrior') {
      // Helmet
      ctx.fillStyle = '#71717a';
      ctx.beginPath();
      ctx.arc(s*0.5, s*0.18, s*0.17, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(s*0.33, s*0.18, s*0.34, s*0.08);
      // Helmet visor
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(s*0.38, s*0.22, s*0.24, s*0.04);
      
      // Eyes visible through visor
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(s*0.42, s*0.22, s*0.04, s*0.03);
      ctx.fillRect(s*0.54, s*0.22, s*0.04, s*0.03);
      
      // Sword with detail
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(s*0.72, s*0.18, s*0.06, s*0.4);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(s*0.73, s*0.2, s*0.02, s*0.35);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(s*0.68, s*0.54, s*0.14, s*0.04);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(s*0.75, s*0.56, s*0.03, 0, Math.PI * 2);
      ctx.fill();
      
      // Shield with emblem
      ctx.fillStyle = colors.tunic;
      ctx.beginPath();
      ctx.moveTo(s*0.08, s*0.35);
      ctx.lineTo(s*0.26, s*0.35);
      ctx.lineTo(s*0.26, s*0.58);
      ctx.lineTo(s*0.17, s*0.68);
      ctx.lineTo(s*0.08, s*0.58);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(s*0.17, s*0.42);
      ctx.lineTo(s*0.22, s*0.52);
      ctx.lineTo(s*0.17, s*0.48);
      ctx.lineTo(s*0.12, s*0.52);
      ctx.closePath();
      ctx.fill();
      
      // Shoulder armor
      ctx.fillStyle = '#71717a';
      ctx.beginPath();
      ctx.arc(s*0.3, s*0.38, s*0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(s*0.7, s*0.38, s*0.06, 0, Math.PI * 2);
      ctx.fill();
    } else if (classToUse === 'mage') {
      // Wizard hat with stars
      ctx.fillStyle = colors.tunic;
      ctx.beginPath();
      ctx.moveTo(s*0.5, s*-0.02);
      ctx.lineTo(s*0.75, s*0.28);
      ctx.lineTo(s*0.25, s*0.28);
      ctx.closePath();
      ctx.fill();
      // Hat brim
      ctx.fillStyle = colors.tunic;
      ctx.fillRect(s*0.22, s*0.26, s*0.56, s*0.05);
      // Star on hat
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(s*0.5, s*0.12, s*0.03, 0, Math.PI * 2);
      ctx.fill();
      
      // Hair flowing
      ctx.fillStyle = colors.hair;
      ctx.fillRect(s*0.28, s*0.28, s*0.12, s*0.1);
      ctx.fillRect(s*0.6, s*0.28, s*0.12, s*0.1);
      
      // Glowing eyes
      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(s*0.42, s*0.26, s*0.03, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(s*0.58, s*0.26, s*0.03, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Staff with crystal orb
      ctx.fillStyle = '#5b21b6';
      ctx.fillRect(s*0.74, s*0.12, s*0.04, s*0.6);
      // Crystal
      ctx.fillStyle = '#c084fc';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(s*0.76, s*0.02);
      ctx.lineTo(s*0.82, s*0.1);
      ctx.lineTo(s*0.76, s*0.18);
      ctx.lineTo(s*0.70, s*0.1);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Spellbook
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(s*0.08, s*0.42, s*0.14, s*0.16);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(s*0.1, s*0.44, s*0.02, s*0.12);
      // Runes
      ctx.fillStyle = '#c084fc';
      ctx.font = `${s*0.06}px serif`;
      ctx.fillText('✦', s*0.14, s*0.52);
    } else if (classToUse === 'rogue') {
      // Hood with shadows
      ctx.fillStyle = colors.tunic;
      ctx.beginPath();
      ctx.arc(s*0.5, s*0.18, s*0.22, Math.PI * 0.8, Math.PI * 2.2);
      ctx.fill();
      ctx.fillRect(s*0.28, s*0.18, s*0.44, s*0.14);
      
      // Deep shadow under hood
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.arc(s*0.5, s*0.26, s*0.12, 0, Math.PI * 2);
      ctx.fill();
      
      // Glinting eyes in shadow
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.arc(s*0.44, s*0.25, s*0.025, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(s*0.56, s*0.25, s*0.025, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Dual daggers crossed
      ctx.fillStyle = '#71717a';
      // Right dagger
      ctx.save();
      ctx.translate(s*0.78, s*0.35);
      ctx.rotate(0.3);
      ctx.fillRect(-s*0.02, 0, s*0.04, s*0.22);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-s*0.04, s*0.18, s*0.08, s*0.04);
      ctx.restore();
      // Left dagger
      ctx.fillStyle = '#71717a';
      ctx.save();
      ctx.translate(s*0.22, s*0.38);
      ctx.rotate(-0.3);
      ctx.fillRect(-s*0.02, 0, s*0.04, s*0.2);
      ctx.restore();
      
      // Cape flowing
      ctx.fillStyle = colors.tunic;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(s*0.32, s*0.35);
      ctx.quadraticCurveTo(s*0.15, s*0.55, s*0.18, s*0.82);
      ctx.lineTo(s*0.28, s*0.72);
      ctx.quadraticCurveTo(s*0.25, s*0.5, s*0.35, s*0.38);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    
    // Legs
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(s*0.32, s*0.72, s*0.14, s*0.18);
    ctx.fillRect(s*0.54, s*0.72, s*0.14, s*0.18);
    
    // Boots
    ctx.fillStyle = '#78350f';
    ctx.fillRect(s*0.3, s*0.85, s*0.18, s*0.1);
    ctx.fillRect(s*0.52, s*0.85, s*0.18, s*0.1);
  }, [size, appearance, playerClass]);
  
  return <canvas ref={canvasRef} width={size} height={size} className="rounded" />;
}