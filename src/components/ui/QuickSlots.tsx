import React from 'react';
import { cn } from "@/engine/core/utils";
import { getItemIcon } from '@/data/icons';
import { Item } from '@/types';

const QUICK_SLOT_KEYS = ['Q', 'E', 'R'];

export interface QuickSlotData {
    itemId: string;
}

interface QuickSlotsProps {
    quickSlots?: (QuickSlotData | null)[];
    onUseSlot: (index: number) => void;
    disabled?: boolean;
    inventory?: Item[];
}

export default function QuickSlots({
    quickSlots = [],
    onUseSlot,
    disabled,
    inventory = []
}: QuickSlotsProps) {
    return (
        <div className="flex gap-2 items-center">
            {QUICK_SLOT_KEYS.map((key, index) => {
                const slot = quickSlots[index];
                const item = slot ? inventory.find(i => i.id === slot.itemId) : null;
                const isEmpty = !item;
                const ItemIcon = item ? getItemIcon(item) : null;

                return (
                    <button
                        key={key}
                        onClick={() => !isEmpty && !disabled && onUseSlot(index)}
                        className={cn(
                            "relative w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all",
                            isEmpty
                                ? "border-slate-800 bg-slate-900/50 cursor-default"
                                : "border-emerald-600 bg-emerald-900/40 hover:bg-emerald-800/60 hover:scale-105",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                        title={item ? `${item.name} (${key})` : `Slot vacío (${key})`}
                    >
                        {item && ItemIcon ? (
                            <>
                                <ItemIcon className="text-2xl text-white drop-shadow-md" />
                                <span className="absolute -bottom-1 -right-1 text-[10px] bg-slate-800 rounded px-1.5 text-white border border-slate-600 font-bold min-w-[16px] text-center">
                                    {item.quantity || 1}
                                </span>
                            </>
                        ) : null}

                        <span className="absolute -top-2 -left-2 w-5 h-5 bg-slate-700/90 rounded-full text-[10px] text-white flex items-center justify-center font-bold border border-slate-600 shadow-sm">
                            {key}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

export function assignToQuickSlot(quickSlots: (QuickSlotData | null)[], slotIndex: number, itemId: string) {
    const newSlots = [...(quickSlots || [null, null, null])];
    newSlots.forEach((slot, i) => {
        if (slot?.itemId === itemId) {
            newSlots[i] = null;
        }
    });
    newSlots[slotIndex] = { itemId };
    return newSlots;
}

export function useQuickSlot(quickSlots: (QuickSlotData | null)[], slotIndex: number, inventory: Item[]) {
    const slot = quickSlots?.[slotIndex];
    if (!slot) return { success: false, message: 'Slot vacío' };

    const itemIndex = inventory.findIndex(i => i.id === slot.itemId);
    if (itemIndex === -1) {
        return { success: false, message: 'Item no encontrado', clearSlot: true };
    }

    const item = inventory[itemIndex];
    if (!['potion', 'scroll', 'food'].includes(item.category)) {
        return { success: false, message: 'Solo consumibles en slots rápidos' };
    }

    return { success: true, itemIndex };
}

export const QUICK_SLOT_HOTKEYS = ['q', 'e', 'r'];
