import React from 'react';
import { cn } from '@/lib/utils';

const QUICK_SLOT_KEYS = ['Q', 'E', 'R'];

export default function QuickSlots({ 
  quickSlots = [], 
  onUseSlot, 
  disabled,
  inventory = []
}) {
  return (
    <div className="w-20 p-2 border rounded-lg bg-slate-900/80 backdrop-blur-sm border-slate-700/50">
      <div className="text-[10px] text-slate-400 font-medium mb-2 text-center">CONSUMIBLES</div>
      
      <div className="flex flex-col gap-1.5">
        {QUICK_SLOT_KEYS.map((key, index) => {
          const slot = quickSlots[index];
          const item = slot ? inventory.find(i => i.id === slot.itemId) : null;
          const isEmpty = !item;
          
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
              title={item ? `${item.name} (${key})` : `Slot vacío (${key}) - Asigna desde inventario`}
            >
              {item && item.symbol ? (
                <>
                  <span className="text-lg">{item.symbol}</span>
                  {item.quantity > 1 && (
                    <span className="absolute -bottom-1 -right-1 text-[9px] bg-slate-700 rounded px-1 text-white">
                      {item.quantity}
                    </span>
                  )}
                </>
              ) : null}
              
              <span className="absolute -top-1 -left-1 w-4 h-4 bg-slate-600 rounded text-[10px] text-white flex items-center justify-center font-bold">
                {key}
              </span>
            </button>
          );
        })}
      </div>
      
      <p className="text-[8px] text-slate-600 text-center mt-2">Asigna en [I]</p>
    </div>
  );
}

// Assign item to quick slot
export function assignToQuickSlot(quickSlots, slotIndex, itemId) {
  const newSlots = [...(quickSlots || [null, null, null])];
  
  // Remove item from other slots if already assigned
  newSlots.forEach((slot, i) => {
    if (slot?.itemId === itemId) {
      newSlots[i] = null;
    }
  });
  
  newSlots[slotIndex] = { itemId };
  return newSlots;
}

// Use item from quick slot
export function useQuickSlot(quickSlots, slotIndex, inventory, player) {
  const slot = quickSlots?.[slotIndex];
  if (!slot) return { success: false, message: 'Slot vacío' };
  
  const itemIndex = inventory.findIndex(i => i.id === slot.itemId);
  if (itemIndex === -1) {
    return { success: false, message: 'Item no encontrado', clearSlot: true };
  }
  
  const item = inventory[itemIndex];
  // Allow potions, scrolls, and food
  if (!['potion', 'scroll', 'food'].includes(item.category)) {
    return { success: false, message: 'Solo consumibles en slots rápidos' };
  }
  
  return { success: true, itemIndex };
}

export const QUICK_SLOT_HOTKEYS = ['q', 'e', 'r'];