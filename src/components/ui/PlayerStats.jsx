import { 
  GiHearts, GiSwordsPower, GiCheckedShield, GiCoins, GiFootsteps, 
  GiBackpack, GiWaterDrop,
  // Iconos de Clase (Nombres verificados)
  GiSpartanHelmet,   // Warrior
  GiWizardFace,      // Mage
  GiNinjaMask,       // Rogue
  GiVisoredHelm,     // Knight (Corregido)
  GiVikingHelmet,    // Berserker
  GiWarlockHood,     // Arcane
  GiHornedHelm,      // Druid (CORREGIDO: Era GiAntlerHelmet)
  GiExecutionerHood, // Assassin
  GiRobinHoodHat     // Archer
} from 'react-icons/gi';
import { Button } from '../ui/button';
import PlayerSprite from '@/engine/entities/PlayerSprite';

const CLASS_ICONS = {
  warrior: GiSpartanHelmet,
  mage: GiWizardFace,
  rogue: GiNinjaMask,
  knight: GiVisoredHelm,
  berserker: GiVikingHelmet,
  arcane: GiWarlockHood,
  druid: GiHornedHelm,   // <--- Usamos el nombre correcto
  assassin: GiExecutionerHood,
  archer: GiRobinHoodHat,
  default: GiSpartanHelmet
};

export default function PlayerStats({ player, dungeonLevel, onOpenInventory, inventoryCount, playerClass }) {
  if (!player) return null;
  
  const expForNext = player.level * 25;
  const expPercent = (player.exp / expForNext) * 100;
  const totalAttack = (player.baseAttack || player.attack) + (player.equipAttack || 0);
  const totalDefense = (player.baseDefense || player.defense) + (player.equipDefense || 0);
  const ClassIcon = CLASS_ICONS[player.class] || CLASS_ICONS.default;
  
  return (
    <div className="p-2 border rounded-lg bg-slate-900/80 backdrop-blur-sm border-slate-700/50">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center w-10 h-10 overflow-hidden rounded-lg bg-slate-800 border border-slate-600 shadow-inner">
          <ClassIcon className="w-8 h-8 text-slate-200" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white truncate max-w-[80px]">{player.name || 'Héroe'}</span>
            <span className="text-[10px] text-slate-400 capitalize">{player.class} Nv.{player.level}</span>
          </div>
          <div className="h-1 w-full bg-slate-800 rounded-full mt-1 overflow-hidden">
             <div className="h-full bg-purple-500" style={{ width: `${expPercent}%` }} />
          </div>
        </div>
      </div>
      
      <div className="mb-2 space-y-1">
        <div className="flex items-center gap-1.5">
          <GiHearts className="flex-shrink-0 w-3 h-3 text-red-500" />
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full transition-all bg-gradient-to-r from-red-600 to-red-400" style={{ width: `${(player.hp / player.maxHp) * 100}%` }} />
          </div>
          <span className="text-[10px] text-slate-400 w-10 text-right">{player.hp}/{player.maxHp}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <GiWaterDrop className="text-blue-400 w-3 h-3 flex-shrink-0" />
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full transition-all bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: `${((player.mp || 0) / (player.maxMp || 30)) * 100}%` }} />
          </div>
          <span className="text-[10px] text-slate-400 w-10 text-right">{player.mp || 0}/{player.maxMp || 30}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        <StatBox icon={GiSwordsPower} label="ATK" value={totalAttack} color="text-orange-400" />
        <StatBox icon={GiCheckedShield} label="DEF" value={totalDefense} color="text-cyan-400" />
        <StatBox icon={GiCoins} label="Oro" value={player.gold} color="text-yellow-400" />
        <StatBox icon={GiFootsteps} label="Piso" value={dungeonLevel} color="text-emerald-400" />
      </div>
      
      <Button onClick={onOpenInventory} variant="outline" size="sm" className="w-full h-7 text-[10px] border-amber-800/50 bg-amber-900/20 hover:bg-amber-800/30 text-amber-200 flex items-center justify-center gap-2">
        <GiBackpack className="w-4 h-4" />
        <span>Inventario ({inventoryCount}/64) [I]</span>
      </Button>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-slate-800/50 rounded p-1.5 flex items-center gap-1.5">
      <Icon className={`w-4 h-4 ${color}`} />
      <div>
        <div className="text-[9px] text-slate-500 leading-none">{label}</div>
        <div className="text-xs font-bold leading-none text-white">{value}</div>
      </div>
    </div>
  );
}