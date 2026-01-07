import React, { memo } from 'react';
import {
    GiHearts,
    GiCheckedShield,
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
} from 'react-icons/gi';
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
}

function PlayerStatsComponent({ player, dungeonLevel }: PlayerStatsProps) {
    if (!player) return null;

    const expForNext = player.level * 25;
    const expPercent = Math.min(100, (player.exp / expForNext) * 100);
    const ClassIcon = CLASS_ICONS[player.class] || CLASS_ICONS.default;

    return (
        <div className="relative p-2 select-none flex items-start gap-3">
            {/* AVATAR + LEVEL */}
            <div className="relative group shrink-0">
                <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center justify-center overflow-hidden z-10 relative">
                    <ClassIcon className="w-10 h-10 text-slate-100 drop-shadow-lg" />

                    {/* Glossy Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"></div>
                </div>

                {/* Level Badge (Floating) */}
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-slate-950 border-2 border-amber-500 rounded-full flex items-center justify-center z-20 shadow-md">
                    <span className="text-xs font-bold text-amber-500 font-mono">{player.level}</span>
                </div>
            </div>

            {/* BARS & NAME CONTAINER */}
            <div className="flex flex-col pt-1 w-48">
                {/* Name Row */}
                <div className="flex items-baseline justify-between mb-1 translate-y-[-2px]">
                    <h2 className="text-sm font-black text-white font-fantasy tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] stroke-black">
                        {player.name || 'Héroe'}
                    </h2>
                    <span className="text-[10px] text-amber-400/80 font-bold uppercase tracking-widest">{player.class}</span>
                </div>

                {/* Bars - Thicker & Floating */}
                <div className="space-y-1.5">
                    {/* HP */}
                    <div className="relative h-3.5 bg-black/60 rounded-r-lg border-l-2 border-red-600 backdrop-blur-sm shadow-sm overflow-visible">
                        <div
                            className="h-full bg-gradient-to-r from-red-900 via-red-600 to-red-500 rounded-r-sm transition-all duration-300 relative"
                            style={{ width: `${Math.min(100, (player.hp / player.maxHp) * 100)}%` }}
                        >
                            <div className="absolute top-0 right-0 w-px h-full bg-white/50 shadow-[0_0_5px_white]"></div>
                        </div>
                        <span className="absolute top-1/2 -translate-y-1/2 left-2 text-[9px] font-bold text-white drop-shadow-md z-10 flex items-center gap-1">
                            <GiHearts className="text-red-300" /> {player.hp}/{player.maxHp}
                        </span>
                    </div>

                    {/* MP */}
                    <div className="relative h-2.5 bg-black/60 rounded-r-lg border-l-2 border-blue-600 backdrop-blur-sm shadow-sm overflow-visible w-[90%]">
                        <div
                            className="h-full bg-gradient-to-r from-blue-900 via-blue-600 to-blue-500 rounded-r-sm transition-all duration-300 relative"
                            style={{ width: `${Math.min(100, ((player.mp || 0) / (player.maxMp || 30)) * 100)}%` }}
                        >
                            <div className="absolute top-0 right-0 w-px h-full bg-white/50 shadow-[0_0_5px_white]"></div>
                        </div>
                        <span className="absolute top-1/2 -translate-y-1/2 left-2 text-[8px] font-bold text-white drop-shadow-md z-10 flex items-center gap-1">
                            <GiWaterDrop className="text-blue-300" /> {player.mp}/{player.maxMp}
                        </span>
                    </div>

                    {/* EXP - Thin Line */}
                    <div className="h-0.5 w-[85%] bg-slate-800/50 rounded-full overflow-hidden mt-1">
                        <div
                            className="h-full bg-purple-500 shadow-[0_0_5px_purple]"
                            style={{ width: `${expPercent}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Active Buffs (Floating) */}
            <div className="absolute top-full left-2 flex gap-1 mt-2">
                {player.poisoned && <StatusIcon icon={GiWaterDrop} color="text-red-500" />}
                {player.slowed && <StatusIcon icon={GiCheckedShield} color="text-amber-500" />}
            </div>
        </div>
    );
}

function StatusIcon({ icon: Icon, color }: any) {
    return (
        <div className="w-5 h-5 rounded-full bg-black/60 border border-slate-700 flex items-center justify-center animate-pulse">
            <Icon className={`w-3 h-3 ${color}`} />
        </div>
    )
}

function arePropsEqual(prev: PlayerStatsProps, next: PlayerStatsProps) {
    if (prev.dungeonLevel !== next.dungeonLevel) return false;

    // Only re-render if visual stats change
    const p1 = prev.player;
    const p2 = next.player;

    if (!p1 || !p2) return p1 === p2;

    return (
        p1.hp === p2.hp &&
        p1.maxHp === p2.maxHp &&
        p1.mp === p2.mp &&
        p1.maxMp === p2.maxMp &&
        p1.exp === p2.exp &&
        p1.level === p2.level &&
        p1.poisoned === p2.poisoned &&
        p1.slowed === p2.slowed &&
        p1.class === p2.class
    );
}

export default memo(PlayerStatsComponent, arePropsEqual);
