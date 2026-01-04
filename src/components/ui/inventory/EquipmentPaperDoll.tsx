import React from 'react';
import { Item, EquipmentState, Player } from '@/types';
import { EQUIPMENT_SLOTS, getItemIcon } from '@/data/icons';
import { Shield, Sword, Heart, Zap } from 'lucide-react';
import { GiMagicTrident, GiMagicShield } from 'react-icons/gi';

interface EquipSlotProps {
    slotKey: string;
    equipment: EquipmentState;
    onSelect: (item: Item, slot: string) => void;
    isSelected: boolean;
}

function EquipSlot({ slotKey, equipment, onSelect, isSelected }: EquipSlotProps) {
    const item = (equipment as any)[slotKey];
    const slotInfo = (EQUIPMENT_SLOTS as any)[slotKey];
    const SlotIcon = slotInfo.icon;

    const styles = item ? ({
        common: 'border-slate-500 bg-slate-800',
        uncommon: 'border-emerald-600 bg-emerald-900/40 text-emerald-400',
        rare: 'border-blue-600 bg-blue-900/40 text-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.2)]',
        epic: 'border-purple-600 bg-purple-900/40 text-purple-400 shadow-[0_0_10px_rgba(147,51,234,0.2)]',
        legendary: 'border-amber-600 bg-amber-900/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    }[item.rarity as string]) : 'border-dashed border-slate-700 bg-slate-950/30 text-slate-700';

    const Icon = item ? getItemIcon(item) : null;

    return (
        <div
            className={`
                relative w-14 h-14 rounded-lg border-2 flex items-center justify-center transition-all 
                ${styles} 
                ${item ? 'cursor-pointer hover:scale-105 hover:brightness-110' : ''}
                ${isSelected ? 'ring-2 ring-white scale-110 z-10' : ''}
            `}
            onClick={() => item && onSelect(item, slotKey)}
            title={item ? item.name : slotInfo.name}
        >
            {item && Icon ? <Icon className="w-8 h-8 drop-shadow-md" /> : <SlotIcon className="w-8 h-8 opacity-20" />}
        </div>
    );
}

interface StatRowProps {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    color?: string;
}

const StatRow = ({ label, value, icon, color }: StatRowProps) => (
    <div className="flex items-center justify-between p-1.5 rounded hover:bg-white/5 transition-colors group">
        <div className={`flex items-center gap-2 text-xs ${color || 'text-slate-400'} group-hover:text-white transition-colors`}>
            {icon} {label}
        </div>
        <span className="text-sm font-bold text-slate-200">{value}</span>
    </div>
);

interface EquipmentPaperDollProps {
    player: Player;
    equipment: EquipmentState;
    onSelectSlot: (item: Item, slot: string) => void;
    selectedSlot?: string;
}

export function EquipmentPaperDoll({ player, equipment, onSelectSlot, selectedSlot }: EquipmentPaperDollProps) {
    const totalAttack = (player.baseAttack || 0) + (player.equipAttack || 0);
    const totalMagicAttack = (player.baseMagicAttack || 0) + (player.equipMagicAttack || 0);
    const totalDefense = (player.baseDefense || 0) + (player.equipDefense || 0);
    const totalMagicDefense = (player.baseMagicDefense || 0) + (player.equipMagicDefense || 0);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-700 bg-slate-950/50">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-200 font-fantasy tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    {player.name || "Héroe"}
                </h2>
                <p className="ml-4 text-xs text-slate-500 uppercase tracking-widest">Nivel {player.level} • {player.class}</p>
            </div>

            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col items-center">
                {/* Visual Head/Body layout */}
                <div className="flex flex-col items-center gap-2 mb-6 w-full max-w-[200px]">
                    <EquipSlot slotKey="helmet" equipment={equipment} onSelect={onSelectSlot} isSelected={selectedSlot === 'helmet'} />

                    <div className="flex justify-between w-full">
                        <EquipSlot slotKey="weapon" equipment={equipment} onSelect={onSelectSlot} isSelected={selectedSlot === 'weapon'} />
                        <EquipSlot slotKey="chest" equipment={equipment} onSelect={onSelectSlot} isSelected={selectedSlot === 'chest'} />
                        <EquipSlot slotKey="offhand" equipment={equipment} onSelect={onSelectSlot} isSelected={selectedSlot === 'offhand'} />
                    </div>

                    <div className="flex justify-between w-full">
                        <EquipSlot slotKey="gloves" equipment={equipment} onSelect={onSelectSlot} isSelected={selectedSlot === 'gloves'} />
                        <EquipSlot slotKey="legs" equipment={equipment} onSelect={onSelectSlot} isSelected={selectedSlot === 'legs'} />
                        <EquipSlot slotKey="boots" equipment={equipment} onSelect={onSelectSlot} isSelected={selectedSlot === 'boots'} />
                    </div>

                    <div className="flex justify-center w-full gap-2 pt-4 mt-2 border-t border-slate-800/50">
                        <EquipSlot slotKey="necklace" equipment={equipment} onSelect={onSelectSlot} isSelected={selectedSlot === 'necklace'} />
                        <EquipSlot slotKey="ring" equipment={equipment} onSelect={onSelectSlot} isSelected={selectedSlot === 'ring'} />
                        <EquipSlot slotKey="earring" equipment={equipment} onSelect={onSelectSlot} isSelected={selectedSlot === 'earring'} />
                    </div>
                </div>

                {/* Stats Box */}
                <div className="w-full p-3 space-y-1 border rounded-lg bg-slate-900/30 border-slate-700/50">
                    <h3 className="mb-2 text-[10px] font-bold uppercase text-slate-500 tracking-wider">Atributos</h3>
                    <StatRow label="Físico" value={totalAttack} icon={<Sword className="w-3 h-3" />} color="text-orange-400" />
                    <StatRow label="Mágico" value={totalMagicAttack} icon={<GiMagicTrident className="w-3 h-3" />} color="text-purple-400" />
                    <div className="my-1 h-px bg-slate-700/50" />
                    <StatRow label="Defensa" value={totalDefense} icon={<Shield className="w-3 h-3" />} color="text-slate-300" />
                    <StatRow label="Resist." value={totalMagicDefense} icon={<GiMagicShield className="w-3 h-3" />} color="text-blue-300" />
                    <div className="my-1 h-px bg-slate-700/50" />
                    <StatRow label="Vida" value={`${player.hp}/${player.maxHp}`} icon={<Heart className="w-3 h-3" />} color="text-pink-400" />
                    <StatRow label="Maná" value={`${player.mp}/${player.maxMp}`} icon={<Zap className="w-3 h-3" />} color="text-blue-400" />
                </div>
            </div>
        </div>
    );
}
