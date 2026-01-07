import { useState } from 'react';
import { motion } from 'framer-motion';
import { Item, Player, EquipmentState } from '@/types';
import { useMenuNavigation } from '@/hooks/useMenuNavigation'; // Keep using this hook for gamepad
import { useInventoryController } from '@/hooks/useInventoryController';
import { EquipmentPaperDoll } from './inventory/EquipmentPaperDoll';
import { InventoryHeader } from './inventory/InventoryHeader';
import { InventoryGrid } from './inventory/InventoryGrid';
import { ItemDetailsPanel } from './inventory/ItemDetailsPanel';
import { ItemFilters } from './inventory/ItemFilters';

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

    // Logic Hook
    const {
        formattedGold, materialCounts, processedInventory,
        sortMethod, setSortMethod, filterCategory, setFilterCategory
    } = useInventoryController({
        inventory, equipment, player, materials
    });

    // Local Selection State (View State)
    const [selectedItemState, setSelectedItemState] = useState<UIItem | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<string | undefined>(undefined);

    // Gamepad Navigation Hook
    const { selectedIndex, setSelectedIndex } = useMenuNavigation({
        itemsCount: 64,
        cols: 8,
        isActive: isOpen,
        onBack: onClose,
        onSelect: (index) => {
            const item = processedInventory[index];
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
                className="bg-slate-950/80 backdrop-blur-xl w-full max-w-6xl h-[650px] rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.6)] flex overflow-hidden ring-1 ring-white/5"
                onClick={e => e.stopPropagation()}
            >
                {/* LEFT: Equipment & Stats */}
                <div className="flex flex-col border-r w-80 bg-slate-900/80 border-slate-700">
                    <EquipmentPaperDoll
                        player={player}
                        equipment={equipment}
                        onSelectSlot={handleSelectEquipSlot}
                        selectedSlot={selectedSlot}
                    />
                </div>

                {/* MIDDLE: Inventory Grid */}
                <div className="flex flex-col flex-1 bg-slate-900/30 relative backdrop-blur-sm">
                    {/* Dynamic Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

                    {/* Header */}
                    <InventoryHeader materialCounts={materialCounts} formattedGold={formattedGold} />

                    <ItemFilters
                        currentFilter={filterCategory}
                        onFilterChange={setFilterCategory}
                        currentSort={sortMethod}
                        onSortChange={setSortMethod}
                    />

                    {/* Grid Container */}
                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                        <InventoryGrid
                            inventory={processedInventory}
                            selectedIndex={selectedIndex}
                            selectedItem={selectedItemState || null}
                            onSelect={handleSelectGridItem}
                            onReorder={onReorder}
                        />
                    </div>
                </div>

                {/* RIGHT: Details Panel */}
                <ItemDetailsPanel
                    item={selectedItemState || null}
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
