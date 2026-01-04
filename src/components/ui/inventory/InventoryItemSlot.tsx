import React from 'react';
import { Item } from '@/types';
import { getItemIcon } from '@/data/icons';
import { getIconComponent } from '@/components/ui/IconMap';

interface InventoryItemSlotProps {
    item?: Item;
    index: number;
    isSelected?: boolean;
    isActive?: boolean; // For gamepad focus
    isEmpty?: boolean;
    onClick?: () => void;
    onDragStart?: (e: React.DragEvent, index: number) => void;
    onDrop?: (e: React.DragEvent, index: number) => void;
    onDragOver?: (e: React.DragEvent) => void;
}

export function InventoryItemSlot({
    item,
    index,
    isSelected,
    isActive,
    isEmpty,
    onClick,
    onDragStart,
    onDrop,
    onDragOver
}: InventoryItemSlotProps) {
    if (isEmpty || !item) {
        return (
            <div
                className={`w-10 h-10 rounded border transition-all 
                ${isActive ? 'border-amber-500/50 bg-amber-900/10' : 'border-slate-800/60 bg-slate-950/50'}
                `}
                onDrop={(e) => onDrop?.(e, index)}
                onDragOver={onDragOver}
            />
        );
    }

    const iconId = getItemIcon(item);
    const Icon = getIconComponent(iconId);

    // Rarity styles tailored for Dark Fantasy (Glows & Borders)
    const rarityStyles = {
        common: 'border-slate-600 bg-slate-800/80',
        uncommon: 'border-emerald-700 bg-emerald-950/80 text-emerald-400',
        rare: 'border-blue-600 bg-blue-950/80 text-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.15)]',
        epic: 'border-purple-600 bg-purple-950/80 text-purple-400 shadow-[0_0_10px_rgba(147,51,234,0.15)]',
        legendary: 'border-amber-500 bg-amber-950/80 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]',
    }[item.rarity as string] || 'border-slate-600';

    return (
        <button
            onClick={onClick}
            draggable={true}
            onDragStart={(e) => onDragStart?.(e, index)}
            onDrop={(e) => onDrop?.(e, index)}
            onDragOver={onDragOver}
            className={`
                relative w-10 h-10 rounded border-2 flex items-center justify-center transition-all group overflow-hidden
                ${rarityStyles}
                ${isSelected ? 'ring-2 ring-white scale-110 z-20' : ''}
                ${!isSelected && isActive ? 'ring-2 ring-amber-500/50 scale-105 z-10' : ''}
                ${!isSelected && !isActive ? 'hover:scale-105 hover:brightness-110 hover:z-10' : ''}
            `}
        >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <Icon className="w-6 h-6 drop-shadow-md pointer-events-none relative z-10" />

            {(item.quantity || 1) > 1 && (
                <span className="absolute bottom-0 right-0 text-[10px] bg-black/90 px-1 rounded-tl text-white font-mono font-bold border-t border-l border-slate-700 leading-none z-20">
                    {item.quantity}
                </span>
            )}

            {(item.upgradeLevel || 0) > 0 && (
                <span className="absolute top-0 left-0 text-[9px] text-yellow-300 font-bold drop-shadow-md leading-none bg-black/50 px-0.5 rounded z-20 border border-yellow-900/30">
                    +{item.upgradeLevel}
                </span>
            )}
        </button>
    );
}
