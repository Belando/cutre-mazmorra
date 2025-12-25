
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
        <div className="p-2 border rounded-lg bg-slate-900/50 backdrop-blur-sm border-slate-700/50 flex flex-col items-center">
            <div className="text-[10px] text-slate-400 font-medium mb-1">CONSUMIBLES</div>

            <div className="flex flex-row gap-1.5">
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
                                "relative w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all mx-auto",
                                isEmpty
                                    ? "border-slate-700 bg-slate-800/30 cursor-default"
                                    : "border-emerald-600 bg-emerald-900/30 hover:bg-emerald-800/40 hover:scale-105",
                                disabled && "opacity-50 cursor-not-allowed"
                            )}
                            title={item ? `${item.name} (${key})` : `Slot vacío (${key})`}
                        >
                            {item && ItemIcon ? (
                                <>
                                    <ItemIcon className="text-2xl text-white" />
                                    {(item.quantity || 1) > 1 && (
                                        <span className="absolute -bottom-1 -right-1 text-[9px] bg-slate-700 rounded px-1 text-white border border-slate-600">
                                            {item.quantity}
                                        </span>
                                    )}
                                </>
                            ) : null}

                            <span className="absolute -top-1 -left-1 w-4 h-4 bg-slate-600 rounded text-[10px] text-white flex items-center justify-center font-bold shadow">
                                {key}
                            </span>
                        </button>
                    );
                })}
            </div>


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
