import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Clock } from 'lucide-react';

export default function Controls({ onMove, onWait }) {
  return (
    <div className="p-2 border rounded-lg bg-slate-900/80 backdrop-blur-sm border-slate-700/50">
      <div className="grid grid-cols-3 gap-1 max-w-[100px] mx-auto">
        <div />
        <ControlButton onClick={() => onMove(0, -1)} icon={ArrowUp} />
        <div />
        <ControlButton onClick={() => onMove(-1, 0)} icon={ArrowLeft} />
        <ControlButton onClick={onWait} icon={Clock} variant="secondary" />
        <ControlButton onClick={() => onMove(1, 0)} icon={ArrowRight} />
        <div />
        <ControlButton onClick={() => onMove(0, 1)} icon={ArrowDown} />
        <div />
      </div>
      <p className="text-[10px] text-slate-500 text-center mt-1">WASD / Flechas</p>
    </div>
  );
}

function ControlButton({ onClick, icon: Icon, variant = 'primary' }) {
  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded flex items-center justify-center transition-all active:scale-95 ${
        variant === 'primary' 
          ? 'bg-slate-700 hover:bg-slate-600 text-white' 
          : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}