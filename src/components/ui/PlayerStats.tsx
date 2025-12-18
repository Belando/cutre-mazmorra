import React from 'react';
import {
    GiHearts,
    GiSwordsPower,
    GiCheckedShield,
    GiCoins,
    GiFootsteps,
    GiBackpack,
    GiWaterDrop,
    GiSpartanHelmet,   // Warrior
    GiWizardFace,      // Mage
    GiNinjaMask,       // Rogue
    GiClosedBarbute,   // Knight
    GiBarbarian,       // Berserker
    GiCultist,         // Arcane
    GiDeerHead,        // Druid
    GiCowled,          // Assassin
    GiBowman,          // Archer
    GiMagicTrident,
    GiMagicShield
} from 'react-icons/gi';
import { Button } from './button';
import { calculatePlayerStats } from '@/engine/systems/ItemSystem';
import { Player } from '@/hooks/usePlayer';

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
    dungeonLevel: number;
    onOpenInventory: () => void;
    inventoryCount: number;
}

export default function PlayerStats({ player, onOpenInventory, inventoryCount }: PlayerStatsProps) {
    if (!player) return null;

    const expForNext = player.level * 25;
    const expPercent = Math.min(100, (player.exp / expForNext) * 100);

    const stats = calculatePlayerStats(player);
    const ClassIcon = CLASS_ICONS[player.class] || CLASS_ICONS.default;

    return (
        <div className="p-2 border rounded-lg bg-slate-900/80 backdrop-blur-sm border-slate-700/50">
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

            <div className="mb-2 space-y-1">
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

            <div className="grid grid-cols-2 gap-1.5 mb-2">
                <StatBox
                    icon={GiSwordsPower}
                    label="ATK"
                    value={stats.attack}
                    color="text-orange-400"
                />
                <StatBox
                    icon={GiMagicTrident}
                    label="M.ATK"
                    value={stats.magicAttack}
                    color="text-purple-400"
                />
                <StatBox
                    icon={GiCheckedShield}
                    label="DEF"
                    value={stats.defense}
                    color="text-slate-400"
                />
                <StatBox
                    icon={GiMagicShield}
                    label="M.DEF"
                    value={stats.magicDefense}
                    color="text-blue-400"
                />
            </div>

            <Button
                onClick={onOpenInventory}
                variant="outline"
                size="sm"
                className="w-full h-7 text-[10px] border-amber-800/50 bg-amber-900/20 hover:bg-amber-800/30 text-amber-200 flex items-center justify-center gap-2"
            >
                <GiBackpack className="w-4 h-4" />
                <span>Inventario ({inventoryCount}) </span>
            </Button>
        </div>
    );
}

interface StatBoxProps {
    icon: any;
    label: string;
    value: number;
    color: string;
}

function StatBox({ icon: Icon, label, value, color }: StatBoxProps) {
    return (
        <div className="bg-slate-800/50 rounded p-1.5 flex items-center gap-1.5 border border-slate-700/30">
            <Icon className={`w-4 h-4 ${color}`} />
            <div>
                <div className="text-[9px] text-slate-500 leading-none uppercase tracking-wide">{label}</div>
                <div className="text-xs font-bold leading-none text-white mt-0.5">{value}</div>
            </div>
        </div>
    );
}
