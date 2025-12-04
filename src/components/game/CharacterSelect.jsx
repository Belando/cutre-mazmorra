import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SKILL_TREES, BASE_CLASSES } from './SkillSystem';

// Only 3 base classes available at start
export const PLAYER_APPEARANCES = {
  warrior: {
    name: 'Guerrero',
    class: 'warrior',
    icon: '⚔️',
    colors: { tunic: '#dc2626', hair: '#78350f', skin: '#fcd5b8' },
    description: 'Maestro del combate cuerpo a cuerpo. Alta defensa y fuerza bruta.',
  },
  mage: {
    name: 'Mago',
    class: 'mage',
    icon: '✨',
    colors: { tunic: '#7c3aed', hair: '#fafafa', skin: '#fcd5b8' },
    description: 'Domina las artes arcanas. Ataques a distancia y curación.',
  },
  rogue: {
    name: 'Pícaro',
    class: 'rogue',
    icon: '🗡️',
    colors: { tunic: '#1e293b', hair: '#292524', skin: '#fcd5b8' },
    description: 'Sigilo y precisión. Golpes críticos letales.',
  },
};

// Evolved class appearances (used after evolution)
export const EVOLVED_APPEARANCES = {
  knight: {
    name: 'Caballero',
    class: 'knight',
    colors: { tunic: '#64748b', hair: '#1c1917', skin: '#fcd5b8', armor: '#94a3b8' },
    description: 'Defensor imparable con armadura pesada.',
  },
  berserker: {
    name: 'Berserker',
    class: 'berserker',
    colors: { tunic: '#7f1d1d', hair: '#f59e0b', skin: '#d4a574', warpaint: '#dc2626' },
    description: 'Furia desatada, daño brutal.',
  },
  arcane: {
    name: 'Arcano',
    class: 'arcane',
    colors: { tunic: '#4c1d95', hair: '#c4b5fd', skin: '#fcd5b8', glow: '#8b5cf6' },
    description: 'Maestro de la magia destructiva.',
  },
  druid: {
    name: 'Druida',
    class: 'druid',
    colors: { tunic: '#166534', hair: '#854d0e', skin: '#d4a574', nature: '#22c55e' },
    description: 'Curador y protector de la naturaleza.',
  },
  assassin: {
    name: 'Asesino',
    class: 'assassin',
    colors: { tunic: '#0f0f0f', hair: '#450a0a', skin: '#e5e5e5', shadow: '#1c1917' },
    description: 'Muerte silenciosa desde las sombras.',
  },
  archer: {
    name: 'Arquero',
    class: 'archer',
    colors: { tunic: '#166534', hair: '#78350f', skin: '#d4a574', bow: '#92400e' },
    description: 'Maestro del combate a distancia.',
  },
};

// Draw player preview on canvas
export function drawPlayerPreview(ctx, appearance, size, evolvedClass = null) {
  const s = size;
  const colors = appearance?.colors || { tunic: '#3b82f6', hair: '#8b5a2b', skin: '#fcd5b8' };
  const playerClass = evolvedClass || appearance?.class || 'warrior';
  
  ctx.clearRect(0, 0, s, s);
  
  // Body (tunic)
  ctx.fillStyle = colors.tunic;
  ctx.fillRect(s*0.25, s*0.32, s*0.5, s*0.42);
  
  // Head
  ctx.fillStyle = colors.skin;
  ctx.beginPath();
  ctx.arc(s*0.5, s*0.22, s*0.18, 0, Math.PI * 2);
  ctx.fill();
  
  // Class-specific appearance
  if (playerClass === 'warrior') {
    // Hair
    ctx.fillStyle = colors.hair;
    ctx.beginPath();
    ctx.arc(s*0.5, s*0.17, s*0.16, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(s*0.34, s*0.1, s*0.32, s*0.12);
    // Helmet hint
    ctx.fillStyle = '#71717a';
    ctx.fillRect(s*0.32, s*0.06, s*0.36, s*0.06);
    // Shoulder pads
    ctx.fillStyle = '#52525b';
    ctx.fillRect(s*0.18, s*0.32, s*0.12, s*0.1);
    ctx.fillRect(s*0.7, s*0.32, s*0.12, s*0.1);
    // Sword
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(s*0.72, s*0.2, s*0.08, s*0.4);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(s*0.67, s*0.55, s*0.18, s*0.06);
    // Shield
    ctx.fillStyle = colors.tunic;
    ctx.beginPath();
    ctx.moveTo(s*0.08, s*0.32);
    ctx.lineTo(s*0.26, s*0.32);
    ctx.lineTo(s*0.26, s*0.55);
    ctx.lineTo(s*0.17, s*0.68);
    ctx.lineTo(s*0.08, s*0.55);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(s*0.17, s*0.48, s*0.06, 0, Math.PI * 2);
    ctx.fill();
  } else if (playerClass === 'mage') {
    // Wizard hat
    ctx.fillStyle = colors.tunic;
    ctx.beginPath();
    ctx.moveTo(s*0.5, s*-0.05);
    ctx.lineTo(s*0.75, s*0.22);
    ctx.lineTo(s*0.25, s*0.22);
    ctx.closePath();
    ctx.fill();
    // Hat brim
    ctx.fillRect(s*0.22, s*0.2, s*0.56, s*0.06);
    // Staff
    ctx.fillStyle = '#78350f';
    ctx.fillRect(s*0.75, s*0.1, s*0.06, s*0.6);
    // Crystal orb
    ctx.fillStyle = '#a855f7';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(s*0.78, s*0.1, s*0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Book
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(s*0.08, s*0.4, s*0.16, s*0.22);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(s*0.1, s*0.42, s*0.03, s*0.18);
  } else if (playerClass === 'rogue') {
    // Hood
    ctx.fillStyle = colors.tunic;
    ctx.beginPath();
    ctx.arc(s*0.5, s*0.15, s*0.22, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(s*0.28, s*0.15, s*0.44, s*0.14);
    // Shadow on face
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(s*0.5, s*0.24, s*0.14, 0, Math.PI * 2);
    ctx.fill();
    // Glowing eyes
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 4;
    ctx.fillRect(s*0.4, s*0.22, s*0.06, s*0.04);
    ctx.fillRect(s*0.54, s*0.22, s*0.06, s*0.04);
    ctx.shadowBlur = 0;
    // Dual daggers
    ctx.fillStyle = '#71717a';
    ctx.beginPath();
    ctx.moveTo(s*0.75, s*0.28);
    ctx.lineTo(s*0.78, s*0.55);
    ctx.lineTo(s*0.72, s*0.55);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s*0.25, s*0.32);
    ctx.lineTo(s*0.28, s*0.55);
    ctx.lineTo(s*0.22, s*0.55);
    ctx.closePath();
    ctx.fill();
    // Cape
    ctx.fillStyle = colors.tunic;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(s*0.28, s*0.35);
    ctx.quadraticCurveTo(s*0.08, s*0.6, s*0.12, s*0.88);
    ctx.lineTo(s*0.24, s*0.78);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  } else {
    // Default hair for evolved classes
    ctx.fillStyle = colors.hair;
    ctx.beginPath();
    ctx.arc(s*0.5, s*0.17, s*0.16, Math.PI, Math.PI * 2);
    ctx.fill();
  }
  
  // Eyes (base)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(s*0.38, s*0.2, s*0.07, s*0.06);
  ctx.fillRect(s*0.55, s*0.2, s*0.07, s*0.06);
  
  // Legs
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(s*0.28, s*0.72, s*0.16, s*0.18);
  ctx.fillRect(s*0.56, s*0.72, s*0.16, s*0.18);
  
  // Boots
  ctx.fillStyle = '#78350f';
  ctx.fillRect(s*0.25, s*0.87, s*0.2, s*0.1);
  ctx.fillRect(s*0.55, s*0.87, s*0.2, s*0.1);
}

export default function CharacterSelect({ onSelect, playerName, onNameChange }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const canvasRef = useRef(null);
  
  // Only show base classes
  const appearanceKeys = Object.keys(PLAYER_APPEARANCES);
  const currentAppearance = PLAYER_APPEARANCES[appearanceKeys[selectedIndex]];
  const currentKey = appearanceKeys[selectedIndex];
  
  useEffect(() => {
    if (canvasRef.current && currentAppearance) {
      const ctx = canvasRef.current.getContext('2d');
      drawPlayerPreview(ctx, currentAppearance, 128);
    }
  }, [selectedIndex, currentAppearance]);
  
  const prevCharacter = () => {
    setSelectedIndex((prev) => (prev - 1 + appearanceKeys.length) % appearanceKeys.length);
  };
  
  const nextCharacter = () => {
    setSelectedIndex((prev) => (prev + 1) % appearanceKeys.length);
  };
  
  const treeInfo = SKILL_TREES[currentAppearance?.class] || { name: 'Guerrero', color: '#ef4444', icon: '⚔️' };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto text-center"
    >
      <h1 className="mb-2 text-3xl font-bold text-white">
        Dungeon<span className="text-blue-500">Crawler</span>
      </h1>
      <p className="mb-6 text-sm text-slate-400">Elige tu clase</p>
      
      {/* Character Preview */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <Button variant="ghost" size="icon" onClick={prevCharacter} className="text-slate-400 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 min-w-[200px]">
          <canvas 
            ref={canvasRef} 
            width={128} 
            height={128}
            className="mx-auto rounded"
          />
          <h2 className="mt-2 text-xl font-bold text-white">{currentAppearance?.name || 'Guerrero'}</h2>
          <p className="text-xs text-slate-400 min-h-[32px]">{currentAppearance?.description || ''}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="text-lg">{treeInfo.icon}</span>
            <span className="text-sm font-medium" style={{ color: treeInfo.color }}>
              {treeInfo.name}
            </span>
          </div>
          <p className="text-[10px] text-amber-500 mt-2">
            ¡Al nivel 10 podrás evolucionar!
          </p>
        </div>
        
        <Button variant="ghost" size="icon" onClick={nextCharacter} className="text-slate-400 hover:text-white">
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>
      
      {/* Appearance indicators */}
      <div className="flex justify-center gap-1 mb-4">
        {appearanceKeys.map((_, i) => (
          <div 
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${i === selectedIndex ? 'bg-blue-500' : 'bg-slate-600'}`}
          />
        ))}
      </div>
      
      {/* Name input */}
      <div className="mb-4">
        <input
          type="text"
          value={playerName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Nombre del héroe..."
          maxLength={16}
          className="w-full px-4 py-2 text-center text-white border rounded-lg bg-slate-800 border-slate-600 focus:outline-none focus:border-blue-500"
        />
      </div>
      
      {/* Start button */}
      <Button 
        onClick={() => onSelect(currentKey, currentAppearance)}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
      >
        <Play className="w-4 h-4 mr-2" />
        Comenzar Aventura
      </Button>
      
      {/* Quick info */}
      <div className="mt-4 text-[10px] text-slate-500">
        WASD: mover | I: inventario | C: artesanía | T: habilidades | 1-6: habilidades
      </div>
    </motion.div>
  );
}