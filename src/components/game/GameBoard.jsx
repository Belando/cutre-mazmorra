import React, { useEffect, useRef } from 'react';
import { TILE, ENEMY_STATS } from './DungeonGenerator';
import { getThemeForFloor, drawAmbientOverlay } from './DungeonThemes';
import { isLargeEnemy, getEnemySize, drawLargeBossSprite, NPC_SPRITES, drawNPCSprite } from './LargeEnemies';
import { PLAYER_APPEARANCES, drawPlayerPreview } from './CharacterSelect';
import { drawItemSprite } from './ItemSprites'; // Asegúrate de tener esta importación si usas items

const TILE_SIZE = 32;

// Improved enemy sprites with better details
const SPRITES = {
  rat: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Body - brown furry
      ctx.fillStyle = '#78716c';
      ctx.beginPath();
      ctx.ellipse(x + s*0.45, y + s*0.55, s*0.28, s*0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.fillStyle = '#a8a29e';
      ctx.beginPath();
      ctx.ellipse(x + s*0.72, y + s*0.52, s*0.14, s*0.12, 0.2, 0, Math.PI * 2);
      ctx.fill();
      // Ears
      ctx.fillStyle = '#fecaca';
      ctx.beginPath();
      ctx.arc(x + s*0.78, y + s*0.42, s*0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.68, y + s*0.42, s*0.05, 0, Math.PI * 2);
      ctx.fill();
      // Eye
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(x + s*0.76, y + s*0.5, s*0.03, 0, Math.PI * 2);
      ctx.fill();
      // Nose
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(x + s*0.84, y + s*0.54, s*0.025, 0, Math.PI * 2);
      ctx.fill();
      // Tail
      ctx.strokeStyle = '#a8a29e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + s*0.18, y + s*0.55);
      ctx.quadraticCurveTo(x + s*0.05, y + s*0.5, x + s*0.08, y + s*0.7);
      ctx.stroke();
      // Legs
      ctx.fillStyle = '#78716c';
      ctx.fillRect(x + s*0.3, y + s*0.68, s*0.08, s*0.12);
      ctx.fillRect(x + s*0.55, y + s*0.68, s*0.08, s*0.12);
    }
  },
  bat: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Wings spread
      ctx.fillStyle = '#27272a';
      // Left wing
      ctx.beginPath();
      ctx.moveTo(x + s*0.38, y + s*0.5);
      ctx.quadraticCurveTo(x + s*0.15, y + s*0.25, x + s*0.05, y + s*0.35);
      ctx.quadraticCurveTo(x + s*0.1, y + s*0.45, x + s*0.15, y + s*0.55);
      ctx.quadraticCurveTo(x + s*0.25, y + s*0.5, x + s*0.38, y + s*0.55);
      ctx.fill();
      // Right wing
      ctx.beginPath();
      ctx.moveTo(x + s*0.62, y + s*0.5);
      ctx.quadraticCurveTo(x + s*0.85, y + s*0.25, x + s*0.95, y + s*0.35);
      ctx.quadraticCurveTo(x + s*0.9, y + s*0.45, x + s*0.85, y + s*0.55);
      ctx.quadraticCurveTo(x + s*0.75, y + s*0.5, x + s*0.62, y + s*0.55);
      ctx.fill();
      // Body
      ctx.fillStyle = '#3f3f46';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.52, s*0.14, s*0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.fillStyle = '#52525b';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.38, s*0.1, 0, Math.PI * 2);
      ctx.fill();
      // Ears
      ctx.fillStyle = '#3f3f46';
      ctx.beginPath();
      ctx.moveTo(x + s*0.4, y + s*0.35);
      ctx.lineTo(x + s*0.35, y + s*0.2);
      ctx.lineTo(x + s*0.45, y + s*0.32);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.6, y + s*0.35);
      ctx.lineTo(x + s*0.65, y + s*0.2);
      ctx.lineTo(x + s*0.55, y + s*0.32);
      ctx.fill();
      // Eyes - red glowing
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(x + s*0.44, y + s*0.36, s*0.03, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.56, y + s*0.36, s*0.03, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  },
  skeleton: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Skull
      ctx.fillStyle = '#f5f5f4';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.22, s*0.16, 0, Math.PI * 2);
      ctx.fill();
      // Eye sockets
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.ellipse(x + s*0.42, y + s*0.2, s*0.05, s*0.06, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + s*0.58, y + s*0.2, s*0.05, s*0.06, 0, 0, Math.PI * 2);
      ctx.fill();
      // Nose hole
      ctx.beginPath();
      ctx.moveTo(x + s*0.5, y + s*0.26);
      ctx.lineTo(x + s*0.46, y + s*0.3);
      ctx.lineTo(x + s*0.54, y + s*0.3);
      ctx.closePath();
      ctx.fill();
      // Teeth
      ctx.fillStyle = '#f5f5f4';
      ctx.fillRect(x + s*0.4, y + s*0.32, s*0.2, s*0.06);
      ctx.fillStyle = '#1c1917';
      for (let i = 0; i < 4; i++) {
        ctx.fillRect(x + s*0.42 + i*s*0.045, y + s*0.33, s*0.02, s*0.04);
      }
      // Spine and ribs
      ctx.fillStyle = '#e7e5e4';
      ctx.fillRect(x + s*0.47, y + s*0.38, s*0.06, s*0.32);
      // Ribs
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + s*0.47, y + s*0.42 + i*s*0.1);
        ctx.quadraticCurveTo(x + s*0.3, y + s*0.44 + i*s*0.1, x + s*0.28, y + s*0.48 + i*s*0.1);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#e7e5e4';
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + s*0.53, y + s*0.42 + i*s*0.1);
        ctx.quadraticCurveTo(x + s*0.7, y + s*0.44 + i*s*0.1, x + s*0.72, y + s*0.48 + i*s*0.1);
        ctx.stroke();
      }
      // Pelvis
      ctx.fillStyle = '#e7e5e4';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.72, s*0.14, s*0.06, 0, 0, Math.PI * 2);
      ctx.fill();
      // Legs
      ctx.fillRect(x + s*0.38, y + s*0.75, s*0.05, s*0.18);
      ctx.fillRect(x + s*0.57, y + s*0.75, s*0.05, s*0.18);
      // Arms
      ctx.fillRect(x + s*0.25, y + s*0.42, s*0.05, s*0.22);
      ctx.fillRect(x + s*0.7, y + s*0.42, s*0.05, s*0.22);
    }
  },
  spider: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Abdomen - big and hairy
      ctx.fillStyle = '#3b0764';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.6, s*0.22, s*0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      // Fur texture
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.arc(x + s*0.45, y + s*0.55, s*0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.55, y + s*0.58, s*0.05, 0, Math.PI * 2);
      ctx.fill();
      // Cephalothorax
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.38, s*0.14, s*0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      // Eyes - multiple red eyes
      ctx.fillStyle = '#dc2626';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.arc(x + s*0.44, y + s*0.34, s*0.025, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.56, y + s*0.34, s*0.025, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.48, y + s*0.32, s*0.02, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.52, y + s*0.32, s*0.02, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Fangs
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(x + s*0.46, y + s*0.42);
      ctx.lineTo(x + s*0.44, y + s*0.5);
      ctx.lineTo(x + s*0.48, y + s*0.44);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.54, y + s*0.42);
      ctx.lineTo(x + s*0.56, y + s*0.5);
      ctx.lineTo(x + s*0.52, y + s*0.44);
      ctx.fill();
      // Legs - 8 articulated legs
      ctx.strokeStyle = '#581c87';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const yOffset = i * s * 0.06;
        // Left legs
        ctx.beginPath();
        ctx.moveTo(x + s*0.36, y + s*0.4 + yOffset);
        ctx.lineTo(x + s*0.15, y + s*0.25 + yOffset);
        ctx.lineTo(x + s*0.05, y + s*0.35 + yOffset);
        ctx.stroke();
        // Right legs
        ctx.beginPath();
        ctx.moveTo(x + s*0.64, y + s*0.4 + yOffset);
        ctx.lineTo(x + s*0.85, y + s*0.25 + yOffset);
        ctx.lineTo(x + s*0.95, y + s*0.35 + yOffset);
        ctx.stroke();
      }
    }
  },
  zombie: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Tattered clothes
      ctx.fillStyle = '#52525b';
      ctx.fillRect(x + s*0.28, y + s*0.38, s*0.44, s*0.38);
      // Tears in clothes
      ctx.fillStyle = '#3b0764';
      ctx.fillRect(x + s*0.32, y + s*0.5, s*0.08, s*0.12);
      ctx.fillRect(x + s*0.6, y + s*0.45, s*0.06, s*0.1);
      // Green rotting skin
      ctx.fillStyle = '#4d7c0f';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.26, s*0.18, 0, Math.PI * 2);
      ctx.fill();
      // Decayed patches
      ctx.fillStyle = '#365314';
      ctx.beginPath();
      ctx.arc(x + s*0.58, y + s*0.22, s*0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.42, y + s*0.3, s*0.04, 0, Math.PI * 2);
      ctx.fill();
      // Eyes - one normal, one droopy
      ctx.fillStyle = '#fef9c3';
      ctx.fillRect(x + s*0.38, y + s*0.22, s*0.09, s*0.07);
      ctx.fillRect(x + s*0.53, y + s*0.24, s*0.09, s*0.06);
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(x + s*0.4, y + s*0.24, s*0.04, s*0.04);
      ctx.fillRect(x + s*0.56, y + s*0.25, s*0.04, s*0.04);
      // Mouth - groaning
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(x + s*0.42, y + s*0.34, s*0.16, s*0.04);
      // Arms reaching forward
      ctx.fillStyle = '#4d7c0f';
      ctx.save();
      ctx.translate(x + s*0.25, y + s*0.45);
      ctx.rotate(-0.5);
      ctx.fillRect(0, 0, s*0.28, s*0.08);
      ctx.restore();
      ctx.save();
      ctx.translate(x + s*0.72, y + s*0.42);
      ctx.rotate(0.3);
      ctx.fillRect(-s*0.05, 0, s*0.28, s*0.08);
      ctx.restore();
      // Legs
      ctx.fillStyle = '#52525b';
      ctx.fillRect(x + s*0.32, y + s*0.74, s*0.12, s*0.18);
      ctx.fillRect(x + s*0.56, y + s*0.74, s*0.12, s*0.18);
    }
  },
  wraith: {
    draw: (ctx, x, y, size) => {
      const s = size;
      const gradient = ctx.createLinearGradient(x, y, x, y + s);
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.9)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.1)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(x + s*0.5, y + s*0.1);
      ctx.quadraticCurveTo(x + s*0.8, y + s*0.3, x + s*0.75, y + s*0.9);
      ctx.lineTo(x + s*0.25, y + s*0.9);
      ctx.quadraticCurveTo(x + s*0.2, y + s*0.3, x + s*0.5, y + s*0.1);
      ctx.fill();
      ctx.fillStyle = '#c7d2fe';
      ctx.shadowColor = '#c7d2fe';
      ctx.shadowBlur = 8;
      ctx.fillRect(x + s*0.35, y + s*0.25, s*0.08, s*0.06);
      ctx.fillRect(x + s*0.57, y + s*0.25, s*0.08, s*0.06);
      ctx.shadowBlur = 0;
    }
  },
  dragon: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#b45309';
      ctx.fillRect(x + s*0.3, y + s*0.4, s*0.4, s*0.35);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(x + s*0.55, y + s*0.32, s*0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(x + s*0.45, y + s*0.2);
      ctx.lineTo(x + s*0.35, y + s*0.05);
      ctx.lineTo(x + s*0.5, y + s*0.15);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.65, y + s*0.2);
      ctx.lineTo(x + s*0.75, y + s*0.05);
      ctx.lineTo(x + s*0.6, y + s*0.15);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 4;
      ctx.fillRect(x + s*0.48, y + s*0.28, s*0.06, s*0.05);
      ctx.fillRect(x + s*0.58, y + s*0.28, s*0.06, s*0.05);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.moveTo(x + s*0.2, y + s*0.45);
      ctx.lineTo(x - s*0.05, y + s*0.25);
      ctx.lineTo(x + s*0.1, y + s*0.55);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.8, y + s*0.45);
      ctx.lineTo(x + s*1.05, y + s*0.25);
      ctx.lineTo(x + s*0.9, y + s*0.55);
      ctx.fill();
    }
  },
  goblin_king: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#166534';
      ctx.fillRect(x + s*0.25, y + s*0.35, s*0.5, s*0.4);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.25, s*0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(x + s*0.3, y + s*0.15);
      ctx.lineTo(x + s*0.35, y + s*0.0);
      ctx.lineTo(x + s*0.45, y + s*0.1);
      ctx.lineTo(x + s*0.5, y + s*-0.02);
      ctx.lineTo(x + s*0.55, y + s*0.1);
      ctx.lineTo(x + s*0.65, y + s*0.0);
      ctx.lineTo(x + s*0.7, y + s*0.15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 6;
      ctx.fillRect(x + s*0.36, y + s*0.2, s*0.1, s*0.08);
      ctx.fillRect(x + s*0.54, y + s*0.2, s*0.1, s*0.08);
      ctx.shadowBlur = 0;
    }
  },
  skeleton_lord: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#fafafa';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.22, s*0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7c3aed';
      ctx.shadowColor = '#7c3aed';
      ctx.shadowBlur = 8;
      ctx.fillRect(x + s*0.36, y + s*0.16, s*0.1, s*0.1);
      ctx.fillRect(x + s*0.54, y + s*0.16, s*0.1, s*0.1);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#e5e5e5';
      ctx.fillRect(x + s*0.44, y + s*0.38, s*0.12, s*0.4);
      ctx.fillStyle = '#581c87';
      ctx.fillRect(x + s*0.35, y + s*0.38, s*0.3, s*0.25);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(x + s*0.35, y + s*0.08);
      ctx.lineTo(x + s*0.5, y + s*-0.05);
      ctx.lineTo(x + s*0.65, y + s*0.08);
      ctx.closePath();
      ctx.fill();
    }
  },
  orc_warlord: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(x + s*0.2, y + s*0.32, s*0.6, s*0.45);
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.22, s*0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef9c3';
      ctx.beginPath();
      ctx.moveTo(x + s*0.28, y + s*0.35);
      ctx.lineTo(x + s*0.22, y + s*0.55);
      ctx.lineTo(x + s*0.35, y + s*0.4);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.72, y + s*0.35);
      ctx.lineTo(x + s*0.78, y + s*0.55);
      ctx.lineTo(x + s*0.65, y + s*0.4);
      ctx.fill();
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(x + s*0.3, y + s*0.05, s*0.4, s*0.12);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x + s*0.25, y + s*0.0, s*0.5, s*0.08);
    }
  },
  spider_queen: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.6, s*0.3, s*0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#9333ea';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.32, s*0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(x + s*0.35, y + s*0.2);
      ctx.lineTo(x + s*0.5, y + s*0.1);
      ctx.lineTo(x + s*0.65, y + s*0.2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 6;
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(x + s*0.36 + i*s*0.05, y + s*0.28, s*0.04, s*0.04);
      }
      ctx.shadowBlur = 0;
    }
  },
  lich: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#164e63';
      ctx.beginPath();
      ctx.moveTo(x + s*0.5, y + s*0.2);
      ctx.lineTo(x + s*0.8, y + s*0.9);
      ctx.lineTo(x + s*0.2, y + s*0.9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e5e5e5';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.22, s*0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.fillRect(x + s*0.38, y + s*0.18, s*0.08, s*0.08);
      ctx.fillRect(x + s*0.54, y + s*0.18, s*0.08, s*0.08);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(x + s*0.15, y + s*0.5, s*0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  demon_lord: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(x + s*0.2, y + s*0.32, s*0.6, s*0.45);
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.25, s*0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(x + s*0.25, y + s*0.2);
      ctx.lineTo(x + s*0.1, y + s*-0.1);
      ctx.lineTo(x + s*0.35, y + s*0.1);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.75, y + s*0.2);
      ctx.lineTo(x + s*0.9, y + s*-0.1);
      ctx.lineTo(x + s*0.65, y + s*0.1);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 10;
      ctx.fillRect(x + s*0.35, y + s*0.2, s*0.1, s*0.08);
      ctx.fillRect(x + s*0.55, y + s*0.2, s*0.1, s*0.08);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.moveTo(x + s*0.15, y + s*0.4);
      ctx.lineTo(x - s*0.15, y + s*0.15);
      ctx.lineTo(x + s*0.05, y + s*0.5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.85, y + s*0.4);
      ctx.lineTo(x + s*1.15, y + s*0.15);
      ctx.lineTo(x + s*0.95, y + s*0.5);
      ctx.fill();
    }
  },
  ancient_dragon: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#92400e';
      ctx.fillRect(x + s*0.2, y + s*0.35, s*0.6, s*0.4);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(x + s*0.55, y + s*0.28, s*0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350f';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + s*(0.35 + i*0.12), y + s*0.12);
        ctx.lineTo(x + s*(0.38 + i*0.12), y + s*-0.05);
        ctx.lineTo(x + s*(0.45 + i*0.12), y + s*0.1);
        ctx.fill();
      }
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.fillRect(x + s*0.45, y + s*0.22, s*0.08, s*0.08);
      ctx.fillRect(x + s*0.58, y + s*0.22, s*0.08, s*0.08);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(x + s*0.15, y + s*0.4);
      ctx.lineTo(x - s*0.2, y + s*0.15);
      ctx.lineTo(x - s*0.1, y + s*0.35);
      ctx.lineTo(x + s*0.1, y + s*0.55);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.85, y + s*0.4);
      ctx.lineTo(x + s*1.2, y + s*0.15);
      ctx.lineTo(x + s*1.1, y + s*0.35);
      ctx.lineTo(x + s*0.9, y + s*0.55);
      ctx.fill();
    }
  },
  player: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Body (blue tunic)
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(x + s*0.3, y + s*0.35, s*0.4, s*0.4);
      
      // Head (skin tone)
      ctx.fillStyle = '#fcd5b8';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.25, s*0.18, 0, Math.PI * 2);
      ctx.fill();
      
      // Hair (brown)
      ctx.fillStyle = '#8b5a2b';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.2, s*0.15, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x + s*0.35, y + s*0.12, s*0.3, s*0.1);
      
      // Eyes
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x + s*0.4, y + s*0.22, s*0.06, s*0.06);
      ctx.fillRect(x + s*0.54, y + s*0.22, s*0.06, s*0.06);
      
      // Sword (right hand)
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x + s*0.7, y + s*0.25, s*0.08, s*0.35);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x + s*0.65, y + s*0.55, s*0.18, s*0.06);
      
      // Shield (left hand)
      ctx.fillStyle = '#1e40af';
      ctx.beginPath();
      ctx.moveTo(x + s*0.1, y + s*0.35);
      ctx.lineTo(x + s*0.28, y + s*0.35);
      ctx.lineTo(x + s*0.28, y + s*0.55);
      ctx.lineTo(x + s*0.19, y + s*0.65);
      ctx.lineTo(x + s*0.1, y + s*0.55);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(x + s*0.15, y + s*0.42, s*0.08, s*0.12);
      
      // Legs
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x + s*0.32, y + s*0.72, s*0.14, s*0.18);
      ctx.fillRect(x + s*0.54, y + s*0.72, s*0.14, s*0.18);
      
      // Boots
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + s*0.3, y + s*0.85, s*0.18, s*0.1);
      ctx.fillRect(x + s*0.52, y + s*0.85, s*0.18, s*0.1);
    }
  },
  goblin: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Body - small and hunched
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.55, s*0.18, s*0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Loincloth
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + s*0.38, y + s*0.65, s*0.24, s*0.12);
      // Head - big for body
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.32, s*0.2, 0, Math.PI * 2);
      ctx.fill();
      // Big pointy ears
      ctx.beginPath();
      ctx.moveTo(x + s*0.32, y + s*0.32);
      ctx.lineTo(x + s*0.08, y + s*0.15);
      ctx.lineTo(x + s*0.25, y + s*0.38);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.68, y + s*0.32);
      ctx.lineTo(x + s*0.92, y + s*0.15);
      ctx.lineTo(x + s*0.75, y + s*0.38);
      ctx.closePath();
      ctx.fill();
      // Big nose
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.38, s*0.08, s*0.06, 0, 0, Math.PI * 2);
      ctx.fill();
      // Evil yellow eyes
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(x + s*0.4, y + s*0.28, s*0.06, s*0.07, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + s*0.6, y + s*0.28, s*0.06, s*0.07, 0, 0, Math.PI * 2);
      ctx.fill();
      // Pupils
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(x + s*0.42, y + s*0.28, s*0.025, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.62, y + s*0.28, s*0.025, 0, Math.PI * 2);
      ctx.fill();
      // Grin with teeth
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.42, s*0.1, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#fef9c3';
      ctx.beginPath();
      ctx.moveTo(x + s*0.42, y + s*0.42);
      ctx.lineTo(x + s*0.45, y + s*0.48);
      ctx.lineTo(x + s*0.48, y + s*0.42);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.52, y + s*0.42);
      ctx.lineTo(x + s*0.55, y + s*0.48);
      ctx.lineTo(x + s*0.58, y + s*0.42);
      ctx.fill();
      // Arms with dagger
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(x + s*0.15, y + s*0.45, s*0.18, s*0.08);
      ctx.fillRect(x + s*0.67, y + s*0.45, s*0.18, s*0.08);
      // Rusty dagger
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + s*0.82, y + s*0.4, s*0.04, s*0.1);
      ctx.fillStyle = '#a8a29e';
      ctx.beginPath();
      ctx.moveTo(x + s*0.84, y + s*0.4);
      ctx.lineTo(x + s*0.84, y + s*0.2);
      ctx.lineTo(x + s*0.88, y + s*0.35);
      ctx.fill();
      // Legs
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(x + s*0.35, y + s*0.75, s*0.1, s*0.18);
      ctx.fillRect(x + s*0.55, y + s*0.75, s*0.1, s*0.18);
    }
  },
  orc: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Body (muscular, dark green)
      ctx.fillStyle = '#365314';
      ctx.fillRect(x + s*0.25, y + s*0.35, s*0.5, s*0.4);
      
      // Head
      ctx.fillStyle = '#4d7c0f';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.25, s*0.22, 0, Math.PI * 2);
      ctx.fill();
      
      // Tusks
      ctx.fillStyle = '#fef9c3';
      ctx.beginPath();
      ctx.moveTo(x + s*0.32, y + s*0.38);
      ctx.lineTo(x + s*0.28, y + s*0.52);
      ctx.lineTo(x + s*0.38, y + s*0.42);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.68, y + s*0.38);
      ctx.lineTo(x + s*0.72, y + s*0.52);
      ctx.lineTo(x + s*0.62, y + s*0.42);
      ctx.closePath();
      ctx.fill();
      
      // Angry eyes
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x + s*0.36, y + s*0.2, s*0.1, s*0.08);
      ctx.fillRect(x + s*0.54, y + s*0.2, s*0.1, s*0.08);
      ctx.fillStyle = '#000';
      ctx.fillRect(x + s*0.38, y + s*0.22, s*0.05, s*0.05);
      ctx.fillRect(x + s*0.57, y + s*0.22, s*0.05, s*0.05);
      
      // Eyebrows (angry)
      ctx.fillStyle = '#1a2e05';
      ctx.fillRect(x + s*0.34, y + s*0.15, s*0.14, s*0.04);
      ctx.fillRect(x + s*0.52, y + s*0.15, s*0.14, s*0.04);
      
      // Arms (muscular)
      ctx.fillStyle = '#4d7c0f';
      ctx.fillRect(x + s*0.08, y + s*0.35, s*0.18, s*0.15);
      ctx.fillRect(x + s*0.74, y + s*0.35, s*0.18, s*0.15);
      
      // Axe
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + s*0.82, y + s*0.15, s*0.06, s*0.5);
      ctx.fillStyle = '#71717a';
      ctx.beginPath();
      ctx.moveTo(x + s*0.88, y + s*0.15);
      ctx.lineTo(x + s*0.98, y + s*0.25);
      ctx.lineTo(x + s*0.88, y + s*0.35);
      ctx.closePath();
      ctx.fill();
      
      // Legs
      ctx.fillStyle = '#365314';
      ctx.fillRect(x + s*0.28, y + s*0.72, s*0.16, s*0.2);
      ctx.fillRect(x + s*0.56, y + s*0.72, s*0.16, s*0.2);
    }
  },
  troll: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Large body (purple/grey)
      ctx.fillStyle = '#6b21a8';
      ctx.fillRect(x + s*0.2, y + s*0.3, s*0.6, s*0.45);
      
      // Head (smaller relative to body)
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.22, s*0.18, 0, Math.PI * 2);
      ctx.fill();
      
      // Warts/bumps
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.arc(x + s*0.35, y + s*0.18, s*0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.62, y + s*0.25, s*0.03, 0, Math.PI * 2);
      ctx.fill();
      
      // Small angry eyes
      ctx.fillStyle = '#fcd34d';
      ctx.fillRect(x + s*0.4, y + s*0.18, s*0.07, s*0.06);
      ctx.fillRect(x + s*0.53, y + s*0.18, s*0.07, s*0.06);
      
      // Big nose
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.28, s*0.06, 0, Math.PI * 2);
      ctx.fill();
      
      // Mouth
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(x + s*0.38, y + s*0.34, s*0.24, s*0.06);
      
      // Big arms
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(x + s*0.02, y + s*0.32, s*0.2, s*0.2);
      ctx.fillRect(x + s*0.78, y + s*0.32, s*0.2, s*0.2);
      
      // Club
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + s*0.85, y + s*0.1, s*0.1, s*0.55);
      ctx.fillStyle = '#57534e';
      ctx.beginPath();
      ctx.arc(x + s*0.9, y + s*0.12, s*0.12, 0, Math.PI * 2);
      ctx.fill();
      
      // Legs (thick)
      ctx.fillStyle = '#6b21a8';
      ctx.fillRect(x + s*0.25, y + s*0.72, s*0.2, s*0.22);
      ctx.fillRect(x + s*0.55, y + s*0.72, s*0.2, s*0.22);
    }
  },
  slime: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Body - gelatinous blob
      const gradient = ctx.createRadialGradient(x + s*0.5, y + s*0.5, 0, x + s*0.5, y + s*0.6, s*0.35);
      gradient.addColorStop(0, '#67e8f9');
      gradient.addColorStop(0.7, '#22d3ee');
      gradient.addColorStop(1, '#0891b2');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.58, s*0.32, s*0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      // Top bulge
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.42, s*0.2, 0, Math.PI * 2);
      ctx.fill();
      // Eyes - cute but menacing
      ctx.fillStyle = '#0c4a6e';
      ctx.beginPath();
      ctx.ellipse(x + s*0.4, y + s*0.42, s*0.06, s*0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + s*0.6, y + s*0.42, s*0.06, s*0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      // Eye highlights
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x + s*0.42, y + s*0.4, s*0.025, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.62, y + s*0.4, s*0.025, 0, Math.PI * 2);
      ctx.fill();
      // Body highlights
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.ellipse(x + s*0.35, y + s*0.35, s*0.08, s*0.06, -0.5, 0, Math.PI * 2);
      ctx.fill();
      // Drip effect
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.ellipse(x + s*0.25, y + s*0.75, s*0.06, s*0.08, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  wolf: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Body - muscular
      ctx.fillStyle = '#44403c';
      ctx.beginPath();
      ctx.ellipse(x + s*0.4, y + s*0.55, s*0.28, s*0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      // Fur texture
      ctx.fillStyle = '#57534e';
      ctx.beginPath();
      ctx.ellipse(x + s*0.35, y + s*0.52, s*0.12, s*0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.fillStyle = '#57534e';
      ctx.beginPath();
      ctx.ellipse(x + s*0.72, y + s*0.45, s*0.16, s*0.14, 0.2, 0, Math.PI * 2);
      ctx.fill();
      // Snout
      ctx.fillStyle = '#78716c';
      ctx.beginPath();
      ctx.ellipse(x + s*0.85, y + s*0.48, s*0.08, s*0.06, 0, 0, Math.PI * 2);
      ctx.fill();
      // Nose
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(x + s*0.9, y + s*0.47, s*0.025, 0, Math.PI * 2);
      ctx.fill();
      // Eyes - yellow predator eyes
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.ellipse(x + s*0.7, y + s*0.42, s*0.04, s*0.05, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.ellipse(x + s*0.71, y + s*0.42, s*0.02, s*0.03, 0, 0, Math.PI * 2);
      ctx.fill();
      // Ears - pointed
      ctx.fillStyle = '#44403c';
      ctx.beginPath();
      ctx.moveTo(x + s*0.62, y + s*0.35);
      ctx.lineTo(x + s*0.58, y + s*0.18);
      ctx.lineTo(x + s*0.66, y + s*0.32);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.74, y + s*0.32);
      ctx.lineTo(x + s*0.78, y + s*0.16);
      ctx.lineTo(x + s*0.8, y + s*0.3);
      ctx.fill();
      // Tail
      ctx.beginPath();
      ctx.moveTo(x + s*0.15, y + s*0.5);
      ctx.quadraticCurveTo(x + s*0.05, y + s*0.35, x + s*0.12, y + s*0.25);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#44403c';
      ctx.stroke();
      // Legs
      ctx.fillStyle = '#44403c';
      ctx.fillRect(x + s*0.25, y + s*0.65, s*0.08, s*0.22);
      ctx.fillRect(x + s*0.4, y + s*0.65, s*0.08, s*0.22);
      ctx.fillRect(x + s*0.55, y + s*0.65, s*0.08, s*0.2);
      ctx.fillRect(x + s*0.68, y + s*0.65, s*0.08, s*0.18);
    }
  },
  cultist: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#4c1d95';
      ctx.beginPath();
      ctx.moveTo(x + s*0.5, y + s*0.1);
      ctx.lineTo(x + s*0.8, y + s*0.9);
      ctx.lineTo(x + s*0.2, y + s*0.9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.35, s*0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#be123c';
      ctx.shadowColor = '#be123c';
      ctx.shadowBlur = 6;
      ctx.fillRect(x + s*0.42, y + s*0.32, s*0.06, s*0.06);
      ctx.fillRect(x + s*0.52, y + s*0.32, s*0.06, s*0.06);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.6, s*0.12, 0, Math.PI * 2);
      ctx.stroke();
    }
  },
  golem: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#57534e';
      ctx.fillRect(x + s*0.25, y + s*0.35, s*0.5, s*0.45);
      ctx.fillStyle = '#78716c';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.28, s*0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 6;
      ctx.fillRect(x + s*0.38, y + s*0.24, s*0.08, s*0.08);
      ctx.fillRect(x + s*0.54, y + s*0.24, s*0.08, s*0.08);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#44403c';
      ctx.fillRect(x + s*0.1, y + s*0.38, s*0.18, s*0.12);
      ctx.fillRect(x + s*0.72, y + s*0.38, s*0.18, s*0.12);
      ctx.fillRect(x + s*0.28, y + s*0.78, s*0.18, s*0.15);
      ctx.fillRect(x + s*0.54, y + s*0.78, s*0.18, s*0.15);
    }
  },
  vampire: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(x + s*0.5, y + s*0.25);
      ctx.lineTo(x + s*0.85, y + s*0.9);
      ctx.lineTo(x + s*0.15, y + s*0.9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fafaf9';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.3, s*0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.22, s*0.12, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 6;
      ctx.fillRect(x + s*0.4, y + s*0.26, s*0.06, s*0.06);
      ctx.fillRect(x + s*0.54, y + s*0.26, s*0.06, s*0.06);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fafaf9';
      ctx.beginPath();
      ctx.moveTo(x + s*0.42, y + s*0.38);
      ctx.lineTo(x + s*0.45, y + s*0.45);
      ctx.lineTo(x + s*0.48, y + s*0.38);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.52, y + s*0.38);
      ctx.lineTo(x + s*0.55, y + s*0.45);
      ctx.lineTo(x + s*0.58, y + s*0.38);
      ctx.fill();
    }
  },
  mimic: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + s*0.15, y + s*0.45, s*0.7, s*0.4);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(x + s*0.12, y + s*0.3, s*0.76, s*0.2);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(x + s*0.3, y + s*0.35, s*0.1, s*0.08);
      ctx.fillRect(x + s*0.6, y + s*0.35, s*0.1, s*0.08);
      ctx.fillStyle = '#fef3c7';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(x + s*(0.2 + i*0.1), y + s*0.5);
        ctx.lineTo(x + s*(0.25 + i*0.1), y + s*0.6);
        ctx.lineTo(x + s*(0.3 + i*0.1), y + s*0.5);
        ctx.fill();
      }
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.55, s*0.15, s*0.08, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  vampire_lord: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath();
      ctx.moveTo(x + s*0.15, y + s*0.35);
      ctx.lineTo(x - s*0.1, y + s*0.2);
      ctx.lineTo(x + s*0.1, y + s*0.5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.85, y + s*0.35);
      ctx.lineTo(x + s*1.1, y + s*0.2);
      ctx.lineTo(x + s*0.9, y + s*0.5);
      ctx.fill();
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(x + s*0.25, y + s*0.35, s*0.5, s*0.5);
      ctx.fillStyle = '#fafaf9';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.28, s*0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(x + s*0.35, y + s*0.15);
      ctx.lineTo(x + s*0.5, y + s*0.05);
      ctx.lineTo(x + s*0.65, y + s*0.15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 8;
      ctx.fillRect(x + s*0.38, y + s*0.24, s*0.08, s*0.08);
      ctx.fillRect(x + s*0.54, y + s*0.24, s*0.08, s*0.08);
      ctx.shadowBlur = 0;
    }
  },
  golem_king: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#44403c';
      ctx.fillRect(x + s*0.2, y + s*0.32, s*0.6, s*0.5);
      ctx.fillStyle = '#57534e';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.25, s*0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(x + s*0.3, y + s*0.12);
      ctx.lineTo(x + s*0.35, y + s*0.0);
      ctx.lineTo(x + s*0.45, y + s*0.08);
      ctx.lineTo(x + s*0.5, y + s*-0.02);
      ctx.lineTo(x + s*0.55, y + s*0.08);
      ctx.lineTo(x + s*0.65, y + s*0.0);
      ctx.lineTo(x + s*0.7, y + s*0.12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#22d3ee';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 10;
      ctx.fillRect(x + s*0.36, y + s*0.2, s*0.1, s*0.1);
      ctx.fillRect(x + s*0.54, y + s*0.2, s*0.1, s*0.1);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#292524';
      ctx.fillRect(x + s*0.05, y + s*0.35, s*0.18, s*0.15);
      ctx.fillRect(x + s*0.77, y + s*0.35, s*0.18, s*0.15);
    }
  },
  demon: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Muscular demonic body
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.55, s*0.22, s*0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      // Chest muscles
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.arc(x + s*0.42, y + s*0.48, s*0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.58, y + s*0.48, s*0.08, 0, Math.PI * 2);
      ctx.fill();
      // Head
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.28, s*0.18, 0, Math.PI * 2);
      ctx.fill();
      // Curved horns
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(x + s*0.32, y + s*0.2);
      ctx.quadraticCurveTo(x + s*0.15, y + s*0.05, x + s*0.22, y + s*-0.05);
      ctx.quadraticCurveTo(x + s*0.28, y + s*0.05, x + s*0.38, y + s*0.18);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.68, y + s*0.2);
      ctx.quadraticCurveTo(x + s*0.85, y + s*0.05, x + s*0.78, y + s*-0.05);
      ctx.quadraticCurveTo(x + s*0.72, y + s*0.05, x + s*0.62, y + s*0.18);
      ctx.fill();
      // Glowing eyes
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(x + s*0.4, y + s*0.26, s*0.05, s*0.04, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + s*0.6, y + s*0.26, s*0.05, s*0.04, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Evil grin
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.32, s*0.1, 0.1, Math.PI - 0.1);
      ctx.stroke();
      // Fangs
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.moveTo(x + s*0.4, y + s*0.36);
      ctx.lineTo(x + s*0.42, y + s*0.42);
      ctx.lineTo(x + s*0.44, y + s*0.36);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s*0.56, y + s*0.36);
      ctx.lineTo(x + s*0.58, y + s*0.42);
      ctx.lineTo(x + s*0.6, y + s*0.36);
      ctx.fill();
      // Bat wings
      ctx.fillStyle = '#7f1d1d';
      // Left wing
      ctx.beginPath();
      ctx.moveTo(x + s*0.28, y + s*0.45);
      ctx.lineTo(x - s*0.05, y + s*0.2);
      ctx.lineTo(x + s*0.0, y + s*0.35);
      ctx.lineTo(x - s*0.08, y + s*0.4);
      ctx.lineTo(x + s*0.05, y + s*0.5);
      ctx.lineTo(x + s*0.15, y + s*0.55);
      ctx.closePath();
      ctx.fill();
      // Right wing
      ctx.beginPath();
      ctx.moveTo(x + s*0.72, y + s*0.45);
      ctx.lineTo(x + s*1.05, y + s*0.2);
      ctx.lineTo(x + s*1.0, y + s*0.35);
      ctx.lineTo(x + s*1.08, y + s*0.4);
      ctx.lineTo(x + s*0.95, y + s*0.5);
      ctx.lineTo(x + s*0.85, y + s*0.55);
      ctx.closePath();
      ctx.fill();
      // Tail with arrow tip
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + s*0.5, y + s*0.78);
      ctx.quadraticCurveTo(x + s*0.2, y + s*0.9, x + s*0.1, y + s*0.75);
      ctx.stroke();
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(x + s*0.1, y + s*0.75);
      ctx.lineTo(x + s*0.02, y + s*0.68);
      ctx.lineTo(x + s*0.02, y + s*0.82);
      ctx.closePath();
      ctx.fill();
      // Hooved legs
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(x + s*0.32, y + s*0.75, s*0.12, s*0.15);
      ctx.fillRect(x + s*0.56, y + s*0.75, s*0.12, s*0.15);
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.ellipse(x + s*0.38, y + s*0.92, s*0.08, s*0.04, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + s*0.62, y + s*0.92, s*0.08, s*0.04, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

// Map enemy types to sprite names
const ENEMY_SPRITES = {
  2: 'rat',
  3: 'bat',
  4: 'goblin',
  5: 'skeleton',
  6: 'orc',
  7: 'spider',
  8: 'zombie',
  9: 'troll',
  10: 'wraith',
  11: 'demon',
  12: 'dragon',
  13: 'slime',
  14: 'wolf',
  15: 'cultist',
  16: 'golem',
  17: 'vampire',
  18: 'mimic',
  // Bosses
  100: 'goblin_king',
  101: 'skeleton_lord',
  102: 'orc_warlord',
  103: 'spider_queen',
  104: 'lich',
  105: 'demon_lord',
  106: 'ancient_dragon',
  107: 'vampire_lord',
  108: 'golem_king',
};

// Environment sprites
const ENV_SPRITES = {
  torch: {
    draw: (ctx, x, y, size, frame = 0) => {
      const s = size;
      // Torch holder (on wall)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + s*0.4, y + s*0.5, s*0.2, s*0.35);
      
      // Torch top
      ctx.fillStyle = '#a16207';
      ctx.fillRect(x + s*0.35, y + s*0.4, s*0.3, s*0.15);
      
      // Flame (animated)
      const flicker = Math.sin(frame * 0.3) * 0.05;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(x + s*0.5, y + s*0.1 + flicker * s);
      ctx.quadraticCurveTo(x + s*0.65, y + s*0.25, x + s*0.6, y + s*0.4);
      ctx.lineTo(x + s*0.4, y + s*0.4);
      ctx.quadraticCurveTo(x + s*0.35, y + s*0.25, x + s*0.5, y + s*0.1 + flicker * s);
      ctx.fill();
      
      // Inner flame
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(x + s*0.5, y + s*0.18);
      ctx.quadraticCurveTo(x + s*0.58, y + s*0.28, x + s*0.55, y + s*0.38);
      ctx.lineTo(x + s*0.45, y + s*0.38);
      ctx.quadraticCurveTo(x + s*0.42, y + s*0.28, x + s*0.5, y + s*0.18);
      ctx.fill();
      
      // Glow effect
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 8;
      ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.3, s*0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  },
  chest: {
    draw: (ctx, x, y, size, isOpen = false, rarity = 'common') => {
      const s = size;
      
      // Chest color based on rarity
      const chestColors = {
        common: { main: '#78350f', light: '#a16207', metal: '#71717a' },
        uncommon: { main: '#166534', light: '#22c55e', metal: '#71717a' },
        rare: { main: '#1e40af', light: '#3b82f6', metal: '#fbbf24' },
        epic: { main: '#581c87', light: '#a855f7', metal: '#fbbf24' },
        legendary: { main: '#854d0e', light: '#fbbf24', metal: '#fbbf24' },
      };
      const colors = chestColors[rarity] || chestColors.common;
      
      if (isOpen) {
        // Open chest - lid tilted back
        // Base
        ctx.fillStyle = colors.main;
        ctx.fillRect(x + s*0.15, y + s*0.5, s*0.7, s*0.35);
        
        // Inside (dark)
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(x + s*0.2, y + s*0.52, s*0.6, s*0.2);
        
        // Lid (tilted back)
        ctx.fillStyle = colors.light;
        ctx.beginPath();
        ctx.moveTo(x + s*0.15, y + s*0.5);
        ctx.lineTo(x + s*0.1, y + s*0.2);
        ctx.lineTo(x + s*0.8, y + s*0.2);
        ctx.lineTo(x + s*0.85, y + s*0.5);
        ctx.closePath();
        ctx.fill();
        
        // Lid top edge
        ctx.fillStyle = colors.main;
        ctx.fillRect(x + s*0.1, y + s*0.18, s*0.7, s*0.08);
      } else {
        // Closed chest
        // Base
        ctx.fillStyle = colors.main;
        ctx.fillRect(x + s*0.15, y + s*0.45, s*0.7, s*0.4);
        
        // Lid
        ctx.fillStyle = colors.light;
        ctx.fillRect(x + s*0.12, y + s*0.3, s*0.76, s*0.2);
        
        // Lid curve
        ctx.beginPath();
        ctx.moveTo(x + s*0.12, y + s*0.3);
        ctx.quadraticCurveTo(x + s*0.5, y + s*0.2, x + s*0.88, y + s*0.3);
        ctx.lineTo(x + s*0.88, y + s*0.35);
        ctx.quadraticCurveTo(x + s*0.5, y + s*0.25, x + s*0.12, y + s*0.35);
        ctx.closePath();
        ctx.fill();
        
        // Metal bands
        ctx.fillStyle = colors.metal;
        ctx.fillRect(x + s*0.2, y + s*0.3, s*0.08, s*0.55);
        ctx.fillRect(x + s*0.72, y + s*0.3, s*0.08, s*0.55);
        
        // Lock
        ctx.fillStyle = colors.metal;
        ctx.fillRect(x + s*0.42, y + s*0.42, s*0.16, s*0.12);
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.arc(x + s*0.5, y + s*0.48, s*0.03, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Glow for rare+ chests
      if (['rare', 'epic', 'legendary'].includes(rarity) && !isOpen) {
        ctx.shadowColor = colors.light;
        ctx.shadowBlur = 6;
        ctx.strokeStyle = colors.light;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + s*0.12, y + s*0.25, s*0.76, s*0.6);
        ctx.shadowBlur = 0;
      }
    }
  },
  goldPile: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Gold coins pile
      ctx.fillStyle = '#fbbf24';
      
      // Bottom layer
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.75, s*0.35, s*0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Middle coins
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(x + s*0.45, y + s*0.65, s*0.25, s*0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(x + s*0.55, y + s*0.6, s*0.2, s*0.08, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Top coins
      ctx.fillStyle = '#fcd34d';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.52, s*0.12, s*0.05, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Sparkle
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x + s*0.6, y + s*0.5, s*0.03, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  stairs: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Dark hole
      ctx.fillStyle = '#0a0a0f';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.55, s*0.4, s*0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Steps going down
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x + s*0.2, y + s*0.35, s*0.6, s*0.1);
      ctx.fillStyle = '#334155';
      ctx.fillRect(x + s*0.25, y + s*0.45, s*0.5, s*0.08);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x + s*0.3, y + s*0.53, s*0.4, s*0.06);
      
      // Darkness gradient
      const gradient = ctx.createRadialGradient(
        x + s*0.5, y + s*0.6, 0,
        x + s*0.5, y + s*0.6, s*0.35
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0.8)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.55, s*0.35, s*0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Red glow from below
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.6, s*0.2, s*0.12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  wallTorch: {
    draw: (ctx, x, y, size, frame = 0) => {
      const s = size;
      // Wall bracket
      ctx.fillStyle = '#44403c';
      ctx.fillRect(x + s*0.4, y + s*0.6, s*0.2, s*0.25);
      ctx.fillRect(x + s*0.3, y + s*0.55, s*0.4, s*0.1);
      
      // Torch stick
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + s*0.45, y + s*0.35, s*0.1, s*0.25);
      
      // Flame with animation
      const flicker = Math.sin(frame * 0.4) * 0.03;
      const flicker2 = Math.cos(frame * 0.3) * 0.02;
      
      // Outer flame
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(x + s*0.5, y + s*0.08 + flicker * s);
      ctx.quadraticCurveTo(x + s*0.68 + flicker2 * s, y + s*0.2, x + s*0.62, y + s*0.35);
      ctx.lineTo(x + s*0.38, y + s*0.35);
      ctx.quadraticCurveTo(x + s*0.32 - flicker2 * s, y + s*0.2, x + s*0.5, y + s*0.08 + flicker * s);
      ctx.fill();
      
      // Inner flame
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.moveTo(x + s*0.5, y + s*0.15);
      ctx.quadraticCurveTo(x + s*0.6, y + s*0.24, x + s*0.56, y + s*0.33);
      ctx.lineTo(x + s*0.44, y + s*0.33);
      ctx.quadraticCurveTo(x + s*0.4, y + s*0.24, x + s*0.5, y + s*0.15);
      ctx.fill();
      
      // Core
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.28, s*0.06, s*0.08, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  bones: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#d4d4d4';
      // Skull
      ctx.beginPath();
      ctx.arc(x + s*0.35, y + s*0.6, s*0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(x + s*0.28, y + s*0.56, s*0.04, s*0.04);
      ctx.fillRect(x + s*0.36, y + s*0.56, s*0.04, s*0.04);
      // Bones
      ctx.fillStyle = '#e5e5e5';
      ctx.save();
      ctx.translate(x + s*0.6, y + s*0.5);
      ctx.rotate(0.3);
      ctx.fillRect(-s*0.15, -s*0.03, s*0.3, s*0.06);
      ctx.beginPath();
      ctx.arc(-s*0.15, 0, s*0.05, 0, Math.PI * 2);
      ctx.arc(s*0.15, 0, s*0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.translate(x + s*0.55, y + s*0.7);
      ctx.rotate(-0.4);
      ctx.fillRect(-s*0.12, -s*0.025, s*0.24, s*0.05);
      ctx.restore();
    }
  },
  barrel: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Barrel body
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.75, s*0.3, s*0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x + s*0.2, y + s*0.25, s*0.6, s*0.5);
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.25, s*0.3, s*0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      // Metal bands
      ctx.fillStyle = '#71717a';
      ctx.fillRect(x + s*0.18, y + s*0.32, s*0.64, s*0.04);
      ctx.fillRect(x + s*0.18, y + s*0.55, s*0.64, s*0.04);
    }
  },
  pillar: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Base
      ctx.fillStyle = '#44403c';
      ctx.fillRect(x + s*0.2, y + s*0.8, s*0.6, s*0.15);
      // Column
      ctx.fillStyle = '#57534e';
      ctx.fillRect(x + s*0.28, y + s*0.15, s*0.44, s*0.65);
      // Top
      ctx.fillStyle = '#44403c';
      ctx.fillRect(x + s*0.2, y + s*0.08, s*0.6, s*0.12);
      // Details
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(x + s*0.32, y + s*0.2, s*0.08, s*0.55);
      ctx.fillRect(x + s*0.6, y + s*0.2, s*0.08, s*0.55);
    }
  },
  crack: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + s*0.3, y + s*0.2);
      ctx.lineTo(x + s*0.45, y + s*0.4);
      ctx.lineTo(x + s*0.35, y + s*0.55);
      ctx.lineTo(x + s*0.5, y + s*0.7);
      ctx.lineTo(x + s*0.42, y + s*0.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + s*0.45, y + s*0.4);
      ctx.lineTo(x + s*0.6, y + s*0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + s*0.5, y + s*0.7);
      ctx.lineTo(x + s*0.65, y + s*0.75);
      ctx.stroke();
    }
  },
  rubble: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = '#44403c';
      ctx.beginPath();
      ctx.arc(x + s*0.3, y + s*0.7, s*0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.55, y + s*0.65, s*0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.7, y + s*0.72, s*0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#57534e';
      ctx.beginPath();
      ctx.arc(x + s*0.4, y + s*0.55, s*0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.6, y + s*0.8, s*0.05, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  bloodstain: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.fillStyle = 'rgba(127, 29, 29, 0.6)';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.6, s*0.25, s*0.15, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(153, 27, 27, 0.5)';
      ctx.beginPath();
      ctx.ellipse(x + s*0.35, y + s*0.5, s*0.1, s*0.08, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + s*0.65, y + s*0.7, s*0.08, s*0.06, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  cobweb: {
    draw: (ctx, x, y, size) => {
      const s = size;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      // Corner cobweb
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + s*0.3, y + s*0.1, x + s*0.6, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + s*0.1, y + s*0.3, x, y + s*0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + s*0.4, y + s*0.4);
      ctx.stroke();
      // Cross threads
      ctx.beginPath();
      ctx.moveTo(x + s*0.15, y + s*0.05);
      ctx.quadraticCurveTo(x + s*0.2, y + s*0.2, x + s*0.05, y + s*0.15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + s*0.3, y + s*0.1);
      ctx.quadraticCurveTo(x + s*0.25, y + s*0.25, x + s*0.1, y + s*0.3);
      ctx.stroke();
    }
  },
  mushroom: {
    draw: (ctx, x, y, size) => {
      const s = size;
      // Stem
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(x + s*0.45, y + s*0.55, s*0.1, s*0.25);
      // Cap
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.55, s*0.18, s*0.12, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.45, s*0.18, 0, Math.PI * 2);
      ctx.fill();
      // Spots
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.arc(x + s*0.42, y + s*0.42, s*0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.58, y + s*0.45, s*0.03, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + s*0.5, y + s*0.52, s*0.025, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  waterPool: {
    draw: (ctx, x, y, size, frame = 0) => {
      const s = size;
      const ripple = Math.sin(frame * 0.1) * 0.02;
      // Water
      ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
      ctx.beginPath();
      ctx.ellipse(x + s*0.5, y + s*0.6, s*0.35 + ripple * s, s*0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Highlight
      ctx.fillStyle = 'rgba(147, 197, 253, 0.5)';
      ctx.beginPath();
      ctx.ellipse(x + s*0.4, y + s*0.55, s*0.1, s*0.05, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

// Dynamic tile colors based on floor theme
function getTileColors(floor) {
  const theme = getThemeForFloor(floor);
  return {
    [TILE.WALL]: theme.wall,
    [TILE.FLOOR]: theme.floor,
    [TILE.STAIRS]: theme.floor,
    [TILE.DOOR]: theme.wall,
  };
}

export default function GameBoard({ gameState, viewportWidth = 21, viewportHeight = 15 }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;
    
    const ctx = canvas.getContext('2d');
    const { map, entities, enemies, player, items, visible, explored, torches = [], chests = [], level = 1 } = gameState;
    
    // Increment frame for animations
    frameRef.current++;
    
    // Get theme-based colors
    const TILE_COLORS = getTileColors(level);
    const theme = getThemeForFloor(level);
    
    // Calculate viewport centered on player
    const halfViewW = Math.floor(viewportWidth / 2);
    const halfViewH = Math.floor(viewportHeight / 2);
    
    let offsetX = player.x - halfViewW;
    let offsetY = player.y - halfViewH;
    
    // Clamp to map bounds
    offsetX = Math.max(0, Math.min(offsetX, map[0].length - viewportWidth));
    offsetY = Math.max(0, Math.min(offsetY, map.length - viewportHeight));
    
    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw tiles
    for (let y = 0; y < viewportHeight; y++) {
      for (let x = 0; x < viewportWidth; x++) {
        const mapX = x + offsetX;
        const mapY = y + offsetY;
        
        if (mapX >= 0 && mapX < map[0].length && mapY >= 0 && mapY < map.length) {
          const isVisible = visible[mapY]?.[mapX];
          const isExplored = explored[mapY]?.[mapX];
          
          if (isExplored || isVisible) {
            const tile = map[mapY][mapX];
            const screenX = x * TILE_SIZE;
            const screenY = y * TILE_SIZE;
            
            // Base tile
            ctx.fillStyle = isVisible ? TILE_COLORS[tile] : adjustBrightness(TILE_COLORS[tile], -60);
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            
            // Tile details
            if (tile === TILE.WALL) {
              ctx.fillStyle = isVisible ? theme.wallDetail : adjustBrightness(theme.wallDetail, -40);
              ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
              
              // Add brick pattern
              if (isVisible) {
                ctx.fillStyle = theme.wall;
                ctx.fillRect(screenX + 4, screenY + 6, TILE_SIZE - 10, 2);
                ctx.fillRect(screenX + 4, screenY + 14, TILE_SIZE - 10, 2);
                ctx.fillRect(screenX + TILE_SIZE/2 - 1, screenY + 2, 2, 5);
                ctx.fillRect(screenX + TILE_SIZE/2 - 1, screenY + 15, 2, 5);
                
                // Cobwebs on some wall corners (less in volcanic/inferno)
                const wallSeed = (mapX * 11 + mapY * 17) % 100;
                if (wallSeed < (level <= 4 ? 8 : 3)) {
                  ENV_SPRITES.cobweb.draw(ctx, screenX, screenY, TILE_SIZE);
                }
                
                // Lava cracks in volcanic areas
                if (theme.lavaGlow && wallSeed >= 90) {
                  ctx.strokeStyle = '#ef4444';
                  ctx.shadowColor = '#ef4444';
                  ctx.shadowBlur = 4;
                  ctx.lineWidth = 1;
                  ctx.beginPath();
                  ctx.moveTo(screenX + TILE_SIZE*0.3, screenY + TILE_SIZE*0.2);
                  ctx.lineTo(screenX + TILE_SIZE*0.5, screenY + TILE_SIZE*0.5);
                  ctx.lineTo(screenX + TILE_SIZE*0.4, screenY + TILE_SIZE*0.8);
                  ctx.stroke();
                  ctx.shadowBlur = 0;
                }
              }
            } else if (tile === TILE.STAIRS) {
              // Draw stairs down sprite
              if (isVisible) {
                ENV_SPRITES.stairs.draw(ctx, screenX, screenY, TILE_SIZE);
              } else {
                ctx.fillStyle = '#8b2a3a';
                ctx.font = 'bold 18px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('▼', screenX + TILE_SIZE/2, screenY + TILE_SIZE/2);
              }
            } else if (tile === 4) { // STAIRS_UP
              // Draw stairs up
              if (isVisible) {
                // Stone stairs going up
                ctx.fillStyle = '#334155';
                ctx.fillRect(screenX + TILE_SIZE*0.15, screenY + TILE_SIZE*0.3, TILE_SIZE*0.7, TILE_SIZE*0.55);
                // Steps
                ctx.fillStyle = '#475569';
                ctx.fillRect(screenX + TILE_SIZE*0.2, screenY + TILE_SIZE*0.65, TILE_SIZE*0.6, TILE_SIZE*0.1);
                ctx.fillRect(screenX + TILE_SIZE*0.25, screenY + TILE_SIZE*0.52, TILE_SIZE*0.5, TILE_SIZE*0.1);
                ctx.fillRect(screenX + TILE_SIZE*0.3, screenY + TILE_SIZE*0.4, TILE_SIZE*0.4, TILE_SIZE*0.1);
                // Light from above
                ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
                ctx.beginPath();
                ctx.ellipse(screenX + TILE_SIZE*0.5, screenY + TILE_SIZE*0.35, TILE_SIZE*0.25, TILE_SIZE*0.15, 0, 0, Math.PI * 2);
                ctx.fill();
              } else {
                ctx.fillStyle = '#4a5568';
                ctx.font = 'bold 18px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('▲', screenX + TILE_SIZE/2, screenY + TILE_SIZE/2);
              }
            } else if (tile === TILE.FLOOR && isVisible) {
              // Add subtle floor texture - more varied
              ctx.fillStyle = theme.floorDetail;
              if ((mapX + mapY) % 2 === 0) {
                ctx.fillRect(screenX + 10, screenY + 10, 4, 4);
              }
              // Extra floor cracks
              if ((mapX * 3 + mapY * 5) % 7 === 0) {
                ctx.fillStyle = theme.floorDetail;
                ctx.fillRect(screenX + 4, screenY + 16, 6, 2);
              }

              // Random environment decorations based on theme - MORE DECORATIONS
              const seed = (mapX * 7 + mapY * 13) % 100;

              if (level <= 4) {
                // Normal dungeon decorations - increased spawn rates
                if (seed < 5) {
                  ENV_SPRITES.bones.draw(ctx, screenX, screenY, TILE_SIZE);
                } else if (seed >= 5 && seed < 9) {
                  ENV_SPRITES.rubble.draw(ctx, screenX, screenY, TILE_SIZE);
                } else if (seed >= 9 && seed < 13) {
                  ENV_SPRITES.bloodstain.draw(ctx, screenX, screenY, TILE_SIZE);
                } else if (seed >= 13 && seed < 18) {
                  ENV_SPRITES.crack.draw(ctx, screenX, screenY, TILE_SIZE);
                } else if (seed >= 18 && seed < 22) {
                  ENV_SPRITES.mushroom.draw(ctx, screenX, screenY, TILE_SIZE);
                } else if (seed >= 22 && seed < 25) {
                  ENV_SPRITES.waterPool.draw(ctx, screenX, screenY, TILE_SIZE, frameRef.current);
                } else if (seed >= 25 && seed < 28) {
                  // Scattered stones
                  ctx.fillStyle = '#3f3f46';
                  ctx.beginPath();
                  ctx.arc(screenX + TILE_SIZE*0.3, screenY + TILE_SIZE*0.7, TILE_SIZE*0.08, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.beginPath();
                  ctx.arc(screenX + TILE_SIZE*0.6, screenY + TILE_SIZE*0.6, TILE_SIZE*0.05, 0, Math.PI * 2);
                  ctx.fill();
                } else if (seed >= 28 && seed < 30) {
                  // Chains on floor
                  ctx.strokeStyle = '#52525b';
                  ctx.lineWidth = 2;
                  ctx.beginPath();
                  ctx.moveTo(screenX + 4, screenY + TILE_SIZE*0.5);
                  ctx.lineTo(screenX + TILE_SIZE - 4, screenY + TILE_SIZE*0.5);
                  ctx.stroke();
                }
              } else {
                // Volcanic/Inferno decorations - MORE INTENSE
                if (seed < 8) {
                  // Lava pool
                  ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
                  ctx.shadowColor = '#ef4444';
                  ctx.shadowBlur = 10;
                  ctx.beginPath();
                  ctx.ellipse(screenX + TILE_SIZE*0.5, screenY + TILE_SIZE*0.6, TILE_SIZE*0.3, TILE_SIZE*0.15, 0, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.shadowBlur = 0;
                } else if (seed >= 8 && seed < 14) {
                  ENV_SPRITES.rubble.draw(ctx, screenX, screenY, TILE_SIZE);
                } else if (seed >= 14 && seed < 18) {
                  ENV_SPRITES.bones.draw(ctx, screenX, screenY, TILE_SIZE);
                } else if (seed >= 18 && seed < 24) {
                  // Embers
                  ctx.fillStyle = '#f59e0b';
                  ctx.shadowColor = '#f59e0b';
                  ctx.shadowBlur = 4;
                  for (let i = 0; i < 4; i++) {
                    const ex = screenX + TILE_SIZE*(0.15 + (seed * i) % 70 / 100);
                    const ey = screenY + TILE_SIZE*(0.2 + (seed * i * 2) % 60 / 100);
                    ctx.beginPath();
                    ctx.arc(ex, ey, 1.5 + (i % 2), 0, Math.PI * 2);
                    ctx.fill();
                  }
                  ctx.shadowBlur = 0;
                } else if (seed >= 24 && seed < 28) {
                  // Scorched marks
                  ctx.fillStyle = 'rgba(0,0,0,0.3)';
                  ctx.beginPath();
                  ctx.ellipse(screenX + TILE_SIZE*0.5, screenY + TILE_SIZE*0.5, TILE_SIZE*0.35, TILE_SIZE*0.25, seed * 0.1, 0, Math.PI * 2);
                  ctx.fill();
                } else if (seed >= 28 && seed < 31) {
                  // Skull
                  ctx.fillStyle = '#a1a1aa';
                  ctx.beginPath();
                  ctx.arc(screenX + TILE_SIZE*0.5, screenY + TILE_SIZE*0.5, TILE_SIZE*0.15, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = '#0a0a0a';
                  ctx.beginPath();
                  ctx.arc(screenX + TILE_SIZE*0.45, screenY + TILE_SIZE*0.47, TILE_SIZE*0.03, 0, Math.PI * 2);
                  ctx.arc(screenX + TILE_SIZE*0.55, screenY + TILE_SIZE*0.47, TILE_SIZE*0.03, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
              }
            
            // Grid lines (subtle)
            ctx.strokeStyle = 'rgba(255,255,255,0.03)';
            ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }
    
    // Draw torches on walls
    if (torches) {
      torches.forEach(torch => {
        const screenX = (torch.x - offsetX) * TILE_SIZE;
        const screenY = (torch.y - offsetY) * TILE_SIZE;
        
        if (visible[torch.y]?.[torch.x] && screenX >= -TILE_SIZE && screenX < canvas.width + TILE_SIZE && screenY >= -TILE_SIZE && screenY < canvas.height + TILE_SIZE) {
          ENV_SPRITES.wallTorch.draw(ctx, screenX, screenY, TILE_SIZE, frameRef.current);
        }
      });
    }
    
    // Draw chests (items are now in chests)
    if (chests) {
      chests.forEach(chest => {
        const screenX = (chest.x - offsetX) * TILE_SIZE;
        const screenY = (chest.y - offsetY) * TILE_SIZE;
        
        if (visible[chest.y]?.[chest.x] && screenX >= 0 && screenX < canvas.width && screenY >= 0 && screenY < canvas.height) {
          ENV_SPRITES.chest.draw(ctx, screenX, screenY, TILE_SIZE, chest.opened, chest.rarity);
        }
      });
    }
    
    // Draw loose items (dropped items or gold piles)
    items.forEach(item => {
      const screenX = (item.x - offsetX) * TILE_SIZE;
      const screenY = (item.y - offsetY) * TILE_SIZE;
      
      if (visible[item.y]?.[item.x] && screenX >= 0 && screenX < canvas.width && screenY >= 0 && screenY < canvas.height) {
        if (item.category === 'currency') {
          // Draw gold pile
          ENV_SPRITES.goldPile.draw(ctx, screenX, screenY, TILE_SIZE);
        } else {
          // Draw item with glow based on rarity
          const rarityColors = {
            common: '#9ca3af',
            uncommon: '#4ade80',
            rare: '#3b82f6',
            epic: '#a855f7',
            legendary: '#fbbf24',
          };
          ctx.fillStyle = rarityColors[item.rarity] || '#9ca3af';
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Draw glow for rare+ items
          if (['rare', 'epic', 'legendary'].includes(item.rarity)) {
            ctx.shadowColor = rarityColors[item.rarity];
            ctx.shadowBlur = 8;
          }
          ctx.fillText(item.symbol, screenX + TILE_SIZE/2, screenY + TILE_SIZE/2);
          ctx.shadowBlur = 0;
        }
      }
    });
    
    // Draw enemies (small ones first, then large)
    const smallEnemies = enemies.filter(e => !isLargeEnemy(e.type) || getEnemySize(e.type).width === 1);
    const largeEnemies = enemies.filter(e => isLargeEnemy(e.type) && getEnemySize(e.type).width > 1);
    
    smallEnemies.forEach(enemy => {
      const screenX = (enemy.x - offsetX) * TILE_SIZE;
      const screenY = (enemy.y - offsetY) * TILE_SIZE;
      
      if (visible[enemy.y]?.[enemy.x] && screenX >= 0 && screenX < canvas.width && screenY >= 0 && screenY < canvas.height) {
        const sizeInfo = getEnemySize(enemy.type);
        const scale = sizeInfo.scale || 1;
        const drawSize = TILE_SIZE * scale;
        const offsetDraw = (drawSize - TILE_SIZE) / 2;
        
        // Draw enemy sprite
        const spriteName = ENEMY_SPRITES[enemy.type];
        if (spriteName && SPRITES[spriteName]) {
          SPRITES[spriteName].draw(ctx, screenX - offsetDraw, screenY - offsetDraw, drawSize);
        } else {
          const stats = ENEMY_STATS[enemy.type];
          ctx.fillStyle = stats.color;
          ctx.font = 'bold 16px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(stats.symbol, screenX + TILE_SIZE/2, screenY + TILE_SIZE/2);
        }
        
        // Health bar
        const healthPercent = enemy.hp / enemy.maxHp;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(screenX + 2 - offsetDraw, screenY - 4 - offsetDraw, drawSize - 4, 3);
        ctx.fillStyle = healthPercent > 0.5 ? '#4ade80' : healthPercent > 0.25 ? '#eab308' : '#ef4444';
        ctx.fillRect(screenX + 2 - offsetDraw, screenY - 4 - offsetDraw, (drawSize - 4) * healthPercent, 3);
      }
    });
    
    // Draw large bosses (2x2)
    largeEnemies.forEach(enemy => {
      const screenX = (enemy.x - offsetX) * TILE_SIZE;
      const screenY = (enemy.y - offsetY) * TILE_SIZE;
      
      if (visible[enemy.y]?.[enemy.x] && screenX >= -TILE_SIZE && screenX < canvas.width && screenY >= -TILE_SIZE && screenY < canvas.height) {
        const sizeInfo = getEnemySize(enemy.type);
        const spriteName = sizeInfo.name;
        
        // Draw large boss sprite (2x2 tiles)
        drawLargeBossSprite(ctx, spriteName, screenX - TILE_SIZE/2, screenY - TILE_SIZE/2, TILE_SIZE, frameRef.current);
        
        // Health bar (larger)
        const healthPercent = enemy.hp / enemy.maxHp;
        const barWidth = TILE_SIZE * 2 - 8;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(screenX - TILE_SIZE/2 + 4, screenY - TILE_SIZE/2 - 6, barWidth, 5);
        ctx.fillStyle = healthPercent > 0.5 ? '#4ade80' : healthPercent > 0.25 ? '#eab308' : '#ef4444';
        ctx.fillRect(screenX - TILE_SIZE/2 + 4, screenY - TILE_SIZE/2 - 6, barWidth * healthPercent, 5);
        
        // Boss indicator
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('👑', screenX + TILE_SIZE/2, screenY - TILE_SIZE/2 - 10);
      }
    });
    
    // Draw player
    const playerScreenX = (player.x - offsetX) * TILE_SIZE;
    const playerScreenY = (player.y - offsetY) * TILE_SIZE;
    
    // Player glow
    const gradient = ctx.createRadialGradient(
      playerScreenX + TILE_SIZE/2, playerScreenY + TILE_SIZE/2, 0,
      playerScreenX + TILE_SIZE/2, playerScreenY + TILE_SIZE/2, TILE_SIZE
    );
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(playerScreenX - TILE_SIZE/2, playerScreenY - TILE_SIZE/2, TILE_SIZE * 2, TILE_SIZE * 2);
    
    // Draw player sprite (use appearance and class)
    if (player.appearance && PLAYER_APPEARANCES[player.appearance]) {
      const appearance = PLAYER_APPEARANCES[player.appearance];
      drawCustomPlayer(ctx, playerScreenX, playerScreenY, TILE_SIZE, appearance, player.class);
    } else if (player.class) {
      // Draw based on class even without specific appearance
      const defaultAppearance = {
        colors: { tunic: '#3b82f6', hair: '#8b5a2b', skin: '#fcd5b8' },
        class: player.class
      };
      drawCustomPlayer(ctx, playerScreenX, playerScreenY, TILE_SIZE, defaultAppearance, player.class);
    } else {
      SPRITES.player.draw(ctx, playerScreenX, playerScreenY, TILE_SIZE);
    }
    
    // Draw NPCs with sprites
    if (gameState.npcs) {
      gameState.npcs.forEach(npc => {
        const screenX = (npc.x - offsetX) * TILE_SIZE;
        const screenY = (npc.y - offsetY) * TILE_SIZE;
        
        if (visible[npc.y]?.[npc.x] && screenX >= 0 && screenX < canvas.width && screenY >= 0 && screenY < canvas.height) {
          // Try to draw NPC sprite
          const npcType = npc.type === 'merchant' ? 'merchant' : 
                          npc.type === 'quest_giver' ? 'quest_elder' : 
                          npc.type === 'sage' ? 'sage' : null;
          
          if (npcType && NPC_SPRITES[npcType]) {
            drawNPCSprite(ctx, npcType, screenX, screenY, TILE_SIZE);
          } else {
            // Fallback to symbol
            ctx.shadowColor = npc.color;
            ctx.shadowBlur = 8;
            ctx.fillStyle = npc.color;
            ctx.font = 'bold 18px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(npc.symbol, screenX + TILE_SIZE/2, screenY + TILE_SIZE/2);
            ctx.shadowBlur = 0;
          }
        }
      });
    }
    
    // Draw ambient overlay for volcanic/inferno themes
    if (theme.lavaGlow || theme.embers) {
      drawAmbientOverlay(ctx, canvas.width, canvas.height, level, frameRef.current);
    }
    
  }, [gameState, viewportWidth, viewportHeight]);
  
  return (
    <canvas
      ref={canvasRef}
      width={viewportWidth * TILE_SIZE}
      height={viewportHeight * TILE_SIZE}
      className="border rounded-lg shadow-2xl border-slate-700/50"
    />
  );
}

function adjustBrightness(hex, amount) {
  // --- INICIO DE LA MODIFICACIÓN ---
  // Si el color no existe o no es texto, devolvemos negro para evitar el error.
  if (!hex || typeof hex !== 'string') {
    return '#000000'; 
  }
  // --- FIN DE LA MODIFICACIÓN ---

  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
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