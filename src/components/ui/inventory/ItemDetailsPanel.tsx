import React from 'react';
import { Item, Player } from '@/types';
import { Button } from '@/components/ui/button';
import { getItemIcon, EQUIPMENT_SLOTS } from '@/data/icons';
import { getIconComponent } from '@/components/ui/IconMap';
import { canClassEquip, canAssignToQuickSlot } from '@/engine/systems/ItemSystem';
import { WEAPON_TYPES } from '@/data/items';
import { X, Trash2, Users } from 'lucide-react';
import { GiBackpack } from 'react-icons/gi';

// Helper interface for UI state props
interface UIItem extends Item {
    index?: number;
    isEquipped?: boolean;
    slot?: string;
}

interface ItemDetailsPanelProps {
    item: UIItem | null;
    player: Player;
    onClose: () => void;
    onUse: () => void;
    onEquip: () => void;
    onUnequip: () => void;
    onDrop: () => void;
    onAssignQuickSlot: (index: number, itemId: string) => void;
}

const STAT_LABELS: Record<string, string> = {
    attack: "Ataque Físico",
    magicAttack: "Ataque Mágico",
    defense: "Defensa Física",
    magicDefense: "Defensa Mágica",
    maxHp: "Vida Máxima",
    maxMp: "Maná Máximo",
    health: "Cura Vida",
    mana: "Restaura Maná",
    critChance: "Crítico %",
    evasion: "Evasión",
    blockChance: "Bloqueo",
    attackSpeed: "Velocidad"
};

const CLASS_NAMES: Record<string, string> = {
    warrior: 'Guerrero',
    knight: 'Caballero',
    berserker: 'Berserker',
    mage: 'Mago',
    arcane: 'Arcano',
    druid: 'Druida',
    rogue: 'Pícaro',
    assassin: 'Asesino',
    archer: 'Arquero'
};

const getClassRestrictionText = (item: Item) => {
    let classes: string[] = [];
    if (item.weaponType && WEAPON_TYPES[item.weaponType]) {
        classes = WEAPON_TYPES[item.weaponType].classes;
    }

    if (!classes || classes.length === 0) return null;
    return classes.map(c => CLASS_NAMES[c] || c).join(', ');
};

export function ItemDetailsPanel({
    item,
    player,
    onClose,
    onUse,
    onEquip,
    onUnequip,
    onDrop,
    onAssignQuickSlot
}: ItemDetailsPanelProps) {

    if (!item) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-600 relative">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-slate-500 hover:text-white" onClick={onClose}>
                    <X className="w-5 h-5" />
                </Button>
                <div className="flex items-center justify-center w-20 h-20 mb-4 border-2 border-dashed rounded-full bg-slate-900/50 border-slate-800">
                    <GiBackpack className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-sm font-medium">Selecciona un objeto</p>
                <p className="mt-2 text-xs opacity-50">Haz clic para ver detalles</p>
            </div>
        );
    }

    const iconId = getItemIcon(item);
    const Icon = getIconComponent(iconId);

    const rarityColor = {
        common: 'text-slate-200 border-slate-600 shadow-none',
        uncommon: 'text-emerald-400 border-emerald-500 shadow-emerald-500/20',
        rare: 'text-blue-400 border-blue-500 shadow-blue-500/20',
        epic: 'text-purple-400 border-purple-500 shadow-purple-500/20',
        legendary: 'text-amber-400 border-amber-500 shadow-amber-500/20',
    }[item.rarity as string] || 'text-slate-200';

    const canEquip = canClassEquip(item, player.class || 'warrior', player.level || 1);

    return (
        <div className="flex flex-col h-full bg-slate-950 relative border-l border-slate-800 shadow-2xl w-80">
            <Button variant="ghost" size="icon" className="absolute z-10 top-2 right-2 text-slate-500 hover:text-white" onClick={onClose}>
                <X className="w-5 h-5" />
            </Button>

            {/* Header / Icon */}
            <div className={`p-6 pb-4 border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden`}>
                {/* Glow Background */}
                <div className={`absolute inset-0 opacity-10 blur-xl ${item.rarity === 'legendary' ? 'bg-amber-500' : 'bg-transparent'}`}></div>

                <div className="flex justify-center mb-4 relative z-10">
                    <div className={`w-20 h-20 rounded-xl border-2 flex items-center justify-center bg-slate-900 shadow-lg ${rarityColor.split(' ')[1]} ${rarityColor.split(' ')[2]}`}>
                        <Icon className={`w-12 h-12 ${rarityColor.split(' ')[0]}`} />
                    </div>
                </div>
                <div className="text-center relative z-10">
                    <h3 className={`text-xl font-bold leading-tight font-fantasy tracking-wide ${rarityColor.split(' ')[0]}`}>
                        {item.name} {(item.upgradeLevel || 0) > 0 && `+${item.upgradeLevel}`}
                    </h3>
                    <span className="block mt-1 text-[10px] tracking-[0.2em] uppercase text-slate-500">
                        {item.rarity} • {item.category.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Content Scroll */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">

                {/* Class Restrictions */}
                {getClassRestrictionText(item) && (
                    <div className="flex items-start gap-2 mb-4 p-2 bg-slate-900/50 rounded border border-slate-800">
                        <Users className="w-4 h-4 text-slate-500 mt-0.5" />
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Clases</p>
                            <p className="text-xs text-slate-300 leading-tight">
                                {getClassRestrictionText(item)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Level Requirement */}
                {item.levelRequirement && (
                    <div className="mb-4">
                        <span className={`text-[10px] px-2 py-1 rounded border font-mono ${(player.level || 1) >= item.levelRequirement
                            ? 'border-green-900/50 bg-green-900/10 text-green-400'
                            : 'border-red-900/50 bg-red-900/10 text-red-400'
                            }`}>
                            Nivel {item.levelRequirement} Requerido
                        </span>
                    </div>
                )}

                {/* Slot Info */}
                {item.slot && (EQUIPMENT_SLOTS as any)[item.slot] && (
                    <div className="flex items-center gap-3 p-3 mb-4 border rounded-lg bg-slate-900/60 border-slate-700/50">
                        <div className="flex items-center justify-center w-8 h-8 rounded bg-slate-800 border-slate-700 text-slate-500">
                            {/* Icon fallback */}
                            {(() => {
                                const slotIconId = (EQUIPMENT_SLOTS as any)[item.slot]?.icon;
                                const SlotIconComp = getIconComponent(slotIconId);
                                return <SlotIconComp className="w-5 h-5" />;
                            })()}
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">
                                {item.isEquipped ? "Equipado" : "Slot"}
                            </p>
                            <p className="text-xs font-medium text-slate-300">{(EQUIPMENT_SLOTS as any)[item.slot].name}</p>
                        </div>
                    </div>
                )}

                {/* Stats */}
                {item.stats && (
                    <div className="p-1 mb-6 space-y-1 rounded bg-slate-900/30">
                        {Object.entries(item.stats).map(([key, val]) => (
                            <div key={key} className="flex items-center justify-between px-3 py-1.5 rounded hover:bg-white/5 transition-colors">
                                <span className="text-xs text-slate-400 capitalize">
                                    {STAT_LABELS[key] || key}
                                </span>
                                <span className="font-mono font-bold text-emerald-400">
                                    {(val as number) > 0 ? `+${val}` : String(val)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Description */}
                <div className="p-3 text-sm italic leading-relaxed border-l-2 border-slate-700 bg-slate-900/20 text-slate-400">
                    "{item.description}"
                </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 space-y-2 border-t border-slate-800 bg-slate-950">
                {(['weapon', 'armor', 'accessory'].includes(item.category) || item.slot) ? (
                    item.isEquipped ? (
                        <Button
                            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                            onClick={onUnequip}
                        >
                            Desequipar
                        </Button>
                    ) : (
                        <Button
                            className={`w-full ${canEquip ? 'bg-amber-700 hover:bg-amber-600 text-white shadow-lg shadow-amber-900/20' : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'}`}
                            disabled={!canEquip}
                            onClick={onEquip}
                        >
                            {canEquip ? 'Equipar' : 'Bloqueado'}
                        </Button>
                    )
                ) : (
                    item.category === 'material' ? (
                        <Button className="w-full bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed" disabled>
                            Material
                        </Button>
                    ) : (
                        <Button
                            className="w-full bg-emerald-700 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                            onClick={onUse}
                        >
                            Usar
                        </Button>
                    )
                )}

                {canAssignToQuickSlot(item) && !item.isEquipped && (
                    <div className="grid grid-cols-3 gap-1 pt-1">
                        {['1', '2', '3'].map((k, i) => (
                            <Button key={k} variant="outline" size="sm" className="text-[10px] h-7 border-slate-700 hover:bg-slate-800 text-slate-400"
                                onClick={() => onAssignQuickSlot(i, item.id)}>
                                {['Q', 'E', 'R'][i]}
                            </Button>
                        ))}
                    </div>
                )}

                {!item.isEquipped && (
                    <Button
                        variant="ghost"
                        className="w-full h-8 text-xs text-red-500 hover:text-red-400 hover:bg-red-950/20"
                        onClick={onDrop}
                    >
                        <Trash2 className="w-3 h-3 mr-2" /> Tirar
                    </Button>
                )}
            </div>
        </div>
    );
}
