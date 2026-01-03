import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Hammer, ArrowUp, Package, Coins } from 'lucide-react';
import { Button } from './button';
import { RECIPES, MATERIAL_TYPES, UPGRADE_COSTS, canCraft } from '@/engine/systems/CraftingSystem';
import { getItemIcon } from '@/data/icons';
import { Item } from '@/types';

const rarityColors: Record<string, string> = {
    common: 'text-slate-400',
    uncommon: 'text-green-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-yellow-400',
};

const IconWrapper = ({ item, className }: { item: any, className?: string }) => {
    const Icon = getItemIcon(item);
    return <Icon className={className} />;
};

interface CraftingPanelProps {
    isOpen: boolean;
    onClose: () => void;
    materials?: any; // Materials might be handled via inventory
    inventory: Item[];
    equipment: Record<string, Item | null>;
    gold: number;
    onCraft: (key: string) => void;
    onUpgrade: (slot: string) => void;
    npc?: {
        name: string;
        symbol: string;
        color: string;
        dialogue: {
            greeting: string;
        };
    };
}

export default function CraftingPanel({
    isOpen, onClose, inventory, equipment, gold, onCraft, onUpgrade, npc
}: CraftingPanelProps) {
    const [activeMode, setActiveMode] = useState<'craft' | 'upgrade' | 'materials'>('craft');
    const [currentDialogue, setCurrentDialogue] = useState('');

    useEffect(() => {
        if (npc) {
            setCurrentDialogue(npc.dialogue?.greeting || "¡A trabajar el acero!");
        } else {
            setCurrentDialogue("Mesa de trabajo lista.");
        }
    }, [npc, isOpen]);

    if (!isOpen) return null;

    const equippedItems = Object.entries(equipment || {})
        .filter(([_, item]) => item)
        .map(([slot, item]) => ({ ...item, slot }));

    const handleCraft = (key: string, name: string) => {
        onCraft(key);
        setCurrentDialogue(`¡${name} forjado con éxito! Una pieza magnífica.`);
        setTimeout(() => setCurrentDialogue(npc?.dialogue?.greeting || "Listo para más trabajo."), 2500);
    };

    const handleUpgrade = (slot: string, name: string) => {
        onUpgrade(slot);
        setCurrentDialogue(`¡He reforzado tu ${name}! Ahora es más letal.`);
        setTimeout(() => setCurrentDialogue(npc?.dialogue?.greeting || "Listo para más trabajo."), 2500);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
                className="w-full max-w-lg overflow-hidden border shadow-2xl bg-slate-900 rounded-2xl border-slate-700"
                onClick={e => e.stopPropagation()}
            >
                <div className="relative p-6 pb-4 text-center border-b border-orange-900/50 bg-[#1a0f0f] overflow-hidden">
                    {/* Fire Effect */}
                    <div className="absolute inset-0 opacity-20 bg-[url('/noise.png')]"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-orange-600/20 to-transparent pointer-events-none"></div>

                    <div className="absolute top-4 right-4 z-10">
                        <Button variant="ghost" size="icon" onClick={onClose} className="text-orange-200/50 hover:text-white hover:bg-orange-900/30">
                            <X className="w-6 h-6" />
                        </Button>
                    </div>

                    <div className="flex flex-col items-center justify-center relative z-10">
                        <div className="flex items-center justify-center w-20 h-20 mb-3 text-5xl border-4 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.4)] bg-slate-900 transform rotate-3"
                            style={{ borderColor: npc?.color || '#f97316', color: npc?.color || '#f97316' }}>
                            {npc ? npc.symbol : <Hammer className="animate-pulse" />}
                        </div>
                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-orange-200 to-orange-600 font-fantasy uppercase drop-shadow-sm">
                            {npc ? npc.name : "LA FORJA"}
                        </h2>
                        <div className="h-0.5 w-16 bg-orange-800/50 my-2"></div>
                        <p className="text-xs font-bold tracking-[0.3em] uppercase text-orange-400/80">
                            {npc ? 'Herrero Maestro' : 'Estación de Crafteo'}
                        </p>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-900">
                    <div className="relative p-4 border rounded-xl bg-slate-800/60 border-slate-700/50">
                        <div className="absolute w-4 h-4 rotate-45 border-t border-l -top-2 left-1/2 -translate-x-1/2 bg-slate-800 border-slate-700/50"></div>
                        <p className="text-sm italic leading-relaxed text-center text-slate-300">
                            "{currentDialogue}"
                        </p>
                    </div>
                </div>

                <div className="px-6 pb-2 flex gap-2">
                    <ActionButton
                        icon={Hammer}
                        label="Forjar"
                        isActive={activeMode === 'craft'}
                        onClick={() => setActiveMode('craft')}
                        color="text-orange-400"
                    />
                    <ActionButton
                        icon={ArrowUp}
                        label="Mejorar"
                        isActive={activeMode === 'upgrade'}
                        onClick={() => setActiveMode('upgrade')}
                        color="text-emerald-400"
                    />
                    <ActionButton
                        icon={Package}
                        label="Materiales"
                        isActive={activeMode === 'materials'}
                        onClick={() => setActiveMode('materials')}
                        color="text-blue-400"
                    />
                </div>

                <div className="px-6 pb-6 h-[280px] overflow-y-auto custom-scrollbar border-t border-slate-800/50 pt-4 bg-slate-950/30">

                    {activeMode === 'craft' && (
                        <div className="space-y-2">
                            {Object.entries(RECIPES).map(([key, recipe]) => {
                                const canMake = canCraft(recipe, inventory);
                                const resultItem = { ...recipe, templateKey: key };

                                return (
                                    <div key={key} className={`p-2 rounded border transition-colors ${canMake ? 'bg-slate-800/60 border-slate-600 hover:border-slate-500' : 'bg-slate-900/40 border-slate-800 opacity-60'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-md bg-slate-900 border border-slate-700 ${rarityColors[recipe.rarity as string]}`}>
                                                    <IconWrapper item={resultItem} className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <div className={`text-sm font-medium ${rarityColors[recipe.rarity as string]}`}>{recipe.name}</div>
                                                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 mt-1">
                                                        {Object.entries(recipe.materials).map(([matKey, count]) => {
                                                            const invItem = inventory.find(i => i.templateKey === matKey);
                                                            const have = invItem ? invItem.quantity || 0 : 0;
                                                            return (
                                                                <span key={matKey} className={`flex items-center gap-1 ${have >= count ? 'text-green-400' : 'text-red-400'}`}>
                                                                    <IconWrapper item={{ category: 'material', templateKey: matKey }} className="w-3 h-3" />
                                                                    {have}/{count}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                className="h-7 text-xs bg-orange-700 hover:bg-orange-600 border-orange-600"
                                                disabled={!canMake}
                                                onClick={() => handleCraft(key, recipe.name)}
                                            >
                                                Crear
                                            </Button>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-2 pl-12 border-t border-slate-700/50 pt-1 flex gap-2">
                                            {recipe.result?.attack && <span className="text-orange-300">ATK +{recipe.result.attack}</span>}
                                            {recipe.result?.defense && <span className="text-blue-300">DEF +{recipe.result.defense}</span>}
                                            {recipe.result?.maxHp && <span className="text-pink-300">HP +{recipe.result.maxHp}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeMode === 'upgrade' && (
                        <div className="space-y-2">
                            {equippedItems.length === 0 ? (
                                <div className="py-8 text-center text-slate-600 text-sm">Equipa objetos para poder mejorarlos.</div>
                            ) : (
                                equippedItems.map(item => {
                                    const level = item.upgradeLevel || 0;
                                    const nextCost = (UPGRADE_COSTS as any)[level + 1];
                                    const canUpgrade = level < 5 && nextCost && gold >= nextCost.gold;

                                    return (
                                        <div key={item.slot} className="p-2 border rounded-lg bg-slate-800/60 border-slate-700">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-md bg-slate-900 border border-slate-700 ${rarityColors[item.rarity as string]}`}>
                                                        <IconWrapper item={item} className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <div className={`text-sm font-medium ${rarityColors[item.rarity as string]}`}>
                                                            {item.name} <span className="text-yellow-500 text-xs">+{level}</span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-500">
                                                            {item.stats?.attack && `ATK +${item.stats.attack} `}
                                                            {item.stats?.defense && `DEF +${item.stats.defense}`}
                                                        </div>
                                                    </div>
                                                </div>

                                                {level < 5 && nextCost ? (
                                                    <Button
                                                        size="sm"
                                                        className="h-7 text-xs bg-emerald-700 hover:bg-emerald-600 border-emerald-600 flex flex-col items-center justify-center leading-none py-1"
                                                        disabled={!canUpgrade}
                                                        onClick={() => handleUpgrade(item.slot as string, item.name as string)}
                                                    >
                                                        <span className="font-bold">+1</span>
                                                        <span className="text-[9px] opacity-80 flex items-center gap-0.5">
                                                            <Coins className="w-2 h-2" /> {nextCost.gold}
                                                        </span>
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs font-bold text-yellow-500 px-3">MAX</span>
                                                )}
                                            </div>

                                            {nextCost && level < 5 && (
                                                <div className="mt-2 pl-12 pt-1 border-t border-slate-700/50 flex flex-wrap gap-2 text-[10px]">
                                                    {Object.entries(nextCost.materials as Record<string, number>).map(([matKey, count]) => {
                                                        const invItem = inventory.find(i => i.templateKey === matKey);
                                                        const have = invItem ? invItem.quantity || 0 : 0;
                                                        return (
                                                            <span key={matKey} className={`flex items-center gap-1 ${have >= count ? 'text-green-400' : 'text-red-400'}`}>
                                                                <IconWrapper item={{ category: 'material', templateKey: matKey }} className="w-3 h-3" />
                                                                {have}/{count}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {activeMode === 'materials' && (
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(MATERIAL_TYPES).map(([key, mat]) => {
                                const invItem = inventory.find(i => i.templateKey === key);
                                const count = invItem ? invItem.quantity || 0 : 0;
                                const matItemDummy = { category: 'material', templateKey: key };

                                return (
                                    <div key={key} className="flex items-center gap-2 p-2 border rounded-lg bg-slate-800/40 border-slate-700/50">
                                        <div className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                                            <IconWrapper item={matItemDummy} className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className={`text-xs font-medium ${rarityColors[mat.rarity]}`}>{mat.name}</div>
                                            <div className="text-sm font-bold text-white">{count}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

interface ActionButtonProps {
    icon: any;
    label: string;
    isActive: boolean;
    onClick: () => void;
    color: string;
}

function ActionButton({ icon: Icon, label, isActive, onClick, color }: ActionButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${isActive
                ? 'bg-slate-800 border border-slate-600 shadow-inner'
                : 'bg-transparent hover:bg-slate-800/50 border border-transparent'
                }`}
        >
            <Icon className={`w-5 h-5 mb-1 ${isActive ? color : 'text-slate-500'}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wide ${isActive ? 'text-white' : 'text-slate-500'}`}>
                {label}
            </span>
        </button>
    );
}
