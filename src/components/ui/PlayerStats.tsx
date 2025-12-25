
import {
    GiHearts,
    GiWaterDrop,
    GiSpartanHelmet,   // Warrior
    GiWizardFace,      // Mage
    GiNinjaMask,       // Rogue
    GiClosedBarbute,   // Knight
    GiBarbarian,       // Berserker
    GiCultist,         // Arcane
    GiDeerHead,        // Druid
    GiCowled,          // Assassin
    GiBowman           // Archer
} from 'react-icons/gi';
import { Player } from '@/types';

const CLASS_ICONS: Record<string, any> = {
    warrior: GiSpartanHelmet,
    mage: GiWizardFace,
    rogue: GiNinjaMask,
    knight: GiClosedBarbute,
    berserker: GiBarbarian,
    arcane: GiCultist,
    druid: GiDeerHead,
    assassin: GiCowled,
    archer: GiBowman,
    default: GiSpartanHelmet
};

interface PlayerStatsProps {
    player: Player;
}

export default function PlayerStats({ player }: PlayerStatsProps) {
    if (!player) return null;

    const expForNext = player.level * 25;
    const expPercent = Math.min(100, (player.exp / expForNext) * 100);
    const ClassIcon = CLASS_ICONS[player.class] || CLASS_ICONS.default;

    return (
        <div className="p-2 border rounded-lg bg-slate-900/50 backdrop-blur-sm border-slate-700/50 w-full">
            <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-10 h-10 overflow-hidden rounded-lg bg-slate-800 border border-slate-600 shadow-inner">
                    <ClassIcon className="w-8 h-8 text-slate-200" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white truncate max-w-[80px]">
                            {player.name || 'Héroe'}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">
                            Nv.{player.level}
                        </span>
                    </div>
                    <div className="h-1 w-full bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div
                            className="h-full bg-purple-500 transition-all duration-300"
                            style={{ width: `${expPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                    <GiHearts className="flex-shrink-0 w-3 h-3 text-red-500" />
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full transition-all duration-300 bg-gradient-to-r from-red-600 to-red-400"
                            style={{ width: `${Math.min(100, (player.hp / player.maxHp) * 100)}%` }}
                        />
                    </div>
                    <span className="text-[10px] text-slate-400 w-10 text-right">
                        {player.hp}/{player.maxHp}
                    </span>
                </div>

                <div className="flex items-center gap-1.5">
                    <GiWaterDrop className="text-blue-400 w-3 h-3 flex-shrink-0" />
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full transition-all duration-300 bg-gradient-to-r from-blue-600 to-blue-400"
                            style={{ width: `${Math.min(100, ((player.mp || 0) / (player.maxMp || 30)) * 100)}%` }}
                        />
                    </div>
                    <span className="text-[10px] text-slate-400 w-10 text-right">
                        {player.mp || 0}/{player.maxMp || 30}
                    </span>
                </div>
            </div>
        </div>
    );
}

