import React from 'react';
import { Heart, Sword, Shield, Coins, Footprints } from 'lucide-react';
import { Button } from '../ui/button';
// CORRECCIÓN: Ruta actualizada a entities
import PlayerSprite from '@/engine/entities/PlayerSprite';

export default function PlayerStats({ player, dungeonLevel, onOpenInventory, inventoryCount, appearance, playerClass }) {
  if (!player) return null;
  
  const expForNext = player.level * 25;
  const expPercent = (player.exp / expForNext) * 100;
  const totalAttack = (player.baseAttack || player.attack) + (player.equipAttack || 0);
  const totalDefense = (player.baseDefense || player.defense) + (player.equipDefense || 0);
  
  return (
    <div className="p-2 border rounded-lg bg-slate-900/80 backdrop-blur-sm border-slate-700/50">
      {/* Header compacto */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center w-8 h-8 overflow-hidden rounded bg-slate-800">
          <PlayerSprite size={28} appearance={appearance} playerClass={player?.class || playerClass} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white truncate max-w-[80px]">{player.name || 'Héroe'}</span>
            <span className="text-[10px] text-slate-400">Nv.{player.level}</span>
          </div>
        </div>
      </div>
      
      {/* Barras de vida, maná y EXP */}
      <div className="mb-2 space-y-1">
        <div className="flex items-center gap-1.5">
          <Heart className="flex-shrink-0 w-3 h-3 text-red-400" />
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all bg-gradient-to-r from-red-600 to-red-400"
              style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 w-10 text-right">{player.hp}/{player.maxHp}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-blue-400 text-[10px] flex-shrink-0">💧</span>
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all bg-gradient-to-r from-blue-600 to-blue-400"
              style={{ width: `${((player.mp || 0) / (player.maxMp || 30)) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 w-10 text-right">{player.mp || 0}/{player.maxMp || 30}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-purple-400 text-[10px] flex-shrink-0">📊</span>
          <div className="flex-1 h-1 overflow-hidden rounded-full bg-slate-800">
            <div 
              className="h-full transition-all bg-gradient-to-r from-purple-600 to-purple-400"
              style={{ width: `${expPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 w-10 text-right">{player.exp}/{expForNext}</span>
        </div>
      </div>
      
      {/* Stats Grid compacto */}
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        <StatBox icon={Sword} label="ATK" value={totalAttack} color="text-orange-400" />
        <StatBox icon={Shield} label="DEF" value={totalDefense} color="text-cyan-400" />
        <StatBox icon={Coins} label="Oro" value={player.gold} color="text-yellow-400" />
        <StatBox icon={Footprints} label="Piso" value={dungeonLevel} color="text-emerald-400" />
      </div>
      
      {/* Botón inventario - bolsa medieval */}
      <Button 
        onClick={onOpenInventory}
        variant="outline"
        size="sm"
        className="w-full h-7 text-[10px] border-amber-800/50 bg-amber-900/20 hover:bg-amber-800/30 text-amber-200"
      >
        <span className="mr-1.5">⚔</span>
        Inventario ({inventoryCount}/20) [I]
      </Button>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-slate-800/50 rounded p-1.5 flex items-center gap-1.5">
      <Icon className={`w-3 h-3 ${color}`} />
      <div>
        <div className="text-[9px] text-slate-500 leading-none">{label}</div>
        <div className="text-xs font-bold leading-none text-white">{value}</div>
      </div>
    </div>
  );
}