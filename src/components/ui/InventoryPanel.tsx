import { useState } from 'react';
import { motion } from 'framer-motion';
import { Item, Player, EquipmentState } from '@/types';
import { useMenuNavigation } from '@/hooks/useMenuNavigation'; // Keep using this hook for gamepad
import { EquipmentPaperDoll } from './inventory/EquipmentPaperDoll';
import { InventoryGrid } from './inventory/InventoryGrid';
import { ItemDetailsPanel } from './inventory/ItemDetailsPanel';
import { GiBackpack, GiCoins, GiWoodPile, GiStoneBlock } from 'react-icons/gi';

// Extended Item type for UI state (helper props)
export interface UIItem extends Item {
    index?: number;
    isEquipped?: boolean;
    slot?: string;
}

interface InventoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    inventory: Item[];
    equipment: EquipmentState;
    player: Player;
    onUseItem: (index: number) => void;
    onEquipItem: (index: number) => void;
    onUnequipItem: (slot: string) => void;
    onDropItem: (index: number) => void;
    onAssignQuickSlot: (index: number, itemId: string) => void;
    onReorder: (source: number, target: number) => void;
    materials: Record<string, number>;
}

export default function InventoryPanel({
    isOpen, onClose, inventory, equipment, player,
    onUseItem, onEquipItem, onUnequipItem, onDropItem, onAssignQuickSlot, onReorder, materials
}: InventoryPanelProps) {

    // State
    const [selectedItemState, setSelectedItemState] = useState<UIItem | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | undefined>(undefined);

    // Gamepad Navigation Hook
    const { selectedIndex, setSelectedIndex } = useMenuNavigation({
        itemsCount: 64,
        cols: 8,
        isActive: isOpen,
        onBack: onClose,
        onSelect: (index) => {
            const item = inventory[index];
            if (item) {
                // Focus Item
                setSelectedItemState({ ...item, index, isEquipped: false });
                setSelectedSlot(undefined);
            } else {
                setSelectedItemState(null);
            }
        }
    });

    if (!isOpen) return null;

    // Handlers
    const handleSelectGridItem = (item: Item, index: number) => {
        setSelectedItemState({ ...item, index, isEquipped: false });
        setSelectedSlot(undefined);
        setSelectedIndex(index); // Sync gamepad
    };

    const handleSelectEquipSlot = (item: Item, slot: string) => {
        setSelectedItemState({ ...item, slot, isEquipped: true });
        setSelectedSlot(slot);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#0f172a] w-full max-w-6xl h-[650px] rounded-2xl border border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex overflow-hidden ring-1 ring-white/10"
                onClick={e => e.stopPropagation()}
            >
                {/* LEFT: Equipment & Stats */}
                <div className="flex flex-col border-r w-80 bg-slate-900/80 border-slate-700">
                    <EquipmentPaperDoll
                        player={player}
                        equipment={equipment as any}
                        onSelectSlot={handleSelectEquipSlot}
                        selectedSlot={selectedSlot}
                    />
                </div>

                {/* MIDDLE: Inventory Grid */}
                <div className="flex flex-col flex-1 bg-slate-900/40 relative">
                    {/* Dynamic Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/90 backdrop-blur">
                        <h2 className="flex items-center gap-3 text-2xl font-bold text-amber-500 font-fantasy tracking-wider drop-shadow-md">
                            <GiBackpack className="w-8 h-8" /> Mochila
                        </h2>

                        <div className="flex items-center gap-4">
                            {/* Resources */}
                            <div className="flex items-center gap-4 px-4 py-1.5 border rounded-full bg-black/60 border-slate-700 shadow-inner">
                                <div className="flex items-center gap-2" title="Madera">
                                    <GiWoodPile className="w-5 h-5 text-amber-700" />
                                    <span className="text-sm font-bold text-slate-300 font-mono">{materials?.wood || 0}</span>
                                </div>
                                <div className="w-px h-4 bg-slate-700/50"></div>
                                <div className="flex items-center gap-2" title="Piedra">
                                    <GiStoneBlock className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm font-bold text-slate-300 font-mono">{materials?.stone || 0}</span>
                                </div>
                            </div>

                            {/* Gold */}
                            <div className="flex items-center gap-2 px-4 py-1.5 border rounded-full bg-gradient-to-r from-amber-950/40 to-black/40 border-amber-500/30">
                                <GiCoins className="w-5 h-5 text-yellow-500 drop-shadow-sm" />
                                <span className="font-mono text-lg font-bold text-yellow-100">{player.gold}</span>
                            </div>
                        </div>
                    </div>

                    {/* Grid Container */}
                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                        <InventoryGrid
                            inventory={inventory}
                            selectedIndex={selectedIndex}
                            selectedItem={selectedItemState}
                            onSelect={handleSelectGridItem}
                            onReorder={onReorder}
                        />
                    </div>
                </div>

                {/* RIGHT: Details Panel */}
                <ItemDetailsPanel
                    item={selectedItemState as any}
                    player={player}
                    onClose={onClose}
                    onUse={() => { onUseItem(selectedItemState!.index!); setSelectedItemState(null); }}
                    onEquip={() => { onEquipItem(selectedItemState!.index!); setSelectedItemState(null); }}
                    onUnequip={() => { onUnequipItem(selectedItemState!.slot!); setSelectedItemState(null); }}
                    onDrop={() => { onDropItem(selectedItemState!.index!); setSelectedItemState(null); }}
                    onAssignQuickSlot={(idx, id) => onAssignQuickSlot(idx, id)}
                />

            </motion.div>
        </div>
    );
}
