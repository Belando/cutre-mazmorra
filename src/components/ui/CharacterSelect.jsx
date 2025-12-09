import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { SKILL_TREES } from '@/data/skills';
import { drawPlayer } from '@/renderer/player';

// Only 3 base classes available at start
export const PLAYER_APPEARANCES = {
  warrior: {
    name: 'Guerrero',
    class: 'warrior',
    colors: { tunic: '#dc2626', hair: '#78350f', skin: '#fcd5b8' },
    description: 'Maestro del combate cuerpo a cuerpo. Alta defensa y fuerza bruta.',
  },
  mage: {
    name: 'Mago',
    class: 'mage',
    colors: { tunic: '#7c3aed', hair: '#fafafa', skin: '#fcd5b8' },
    description: 'Domina las artes arcanas. Ataques a distancia y curación.',
  },
  rogue: {
    name: 'Pícaro',
    class: 'rogue',
    colors: { tunic: '#1e293b', hair: '#292524', skin: '#fcd5b8' },
    description: 'Sigilo y precisión. Golpes críticos letales.',
  },
};

export default function CharacterSelect({ onSelect, playerName, onNameChange }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  
  const appearanceKeys = Object.keys(PLAYER_APPEARANCES);
  const currentAppearance = PLAYER_APPEARANCES[appearanceKeys[selectedIndex]];
  const currentKey = appearanceKeys[selectedIndex];
  
  // Efecto para dibujar y animar el personaje
  useEffect(() => {
    let animationId;
    
    const render = () => {
        const canvas = canvasRef.current;
        if (canvas && currentAppearance) {
          const ctx = canvas.getContext('2d');
          const size = 128;
          
          ctx.clearRect(0, 0, size, size);
          
          drawPlayer(
              ctx, 
              0, 0,       
              size,       
              currentAppearance, 
              currentAppearance.class, 
              frameRef.current 
          );
        }
        frameRef.current++;
        animationId = requestAnimationFrame(render);
    };
    
    render();
    
    return () => cancelAnimationFrame(animationId);
  }, [selectedIndex, currentAppearance]);
  
  const prevCharacter = () => {
    setSelectedIndex((prev) => (prev - 1 + appearanceKeys.length) % appearanceKeys.length);
  };
  
  const nextCharacter = () => {
    setSelectedIndex((prev) => (prev + 1) % appearanceKeys.length);
  };
  
  const treeInfo = SKILL_TREES[currentAppearance?.class] || SKILL_TREES.warrior;
  // CORRECCIÓN: Obtenemos el icono como componente
  const TreeIcon = treeInfo.icon;
  
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
          {/* Canvas para el personaje */}
          <canvas 
            ref={canvasRef} 
            width={128} 
            height={128}
            className="mx-auto rounded"
          />
          <h2 className="mt-2 text-xl font-bold text-white">{currentAppearance?.name || 'Guerrero'}</h2>
          <p className="text-xs text-slate-400 min-h-[32px]">{currentAppearance?.description || ''}</p>
          
          <div className="flex items-center justify-center gap-2 mt-2">
            {/* CORRECCIÓN: Renderizamos el componente del icono, no la variable */}
            <span className="text-lg text-amber-500 flex items-center">
              <TreeIcon />
            </span>
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