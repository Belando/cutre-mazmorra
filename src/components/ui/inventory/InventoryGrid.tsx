import React from 'react';
import { Item } from '@/types';
import { InventoryItemSlot } from './InventoryItemSlot';

interface InventoryGridProps {
    inventory: Item[];
    maxSlots?: number;
    selectedIndex?: number;
    selectedItem?: Item | null;
    onSelect: (item: Item, index: number) => void;
    onReorder: (source: number, target: number) => void;
}

export function InventoryGrid({
    inventory,
    maxSlots = 64,
    selectedIndex,
    selectedItem,
    onSelect,
    onReorder
}: InventoryGridProps) {

    // Drag Handlers
    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData('sourceIndex', index.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        const sourceIndex = parseInt(e.dataTransfer.getData('sourceIndex'));
        if (!isNaN(sourceIndex) && sourceIndex !== targetIndex) {
            onReorder(sourceIndex, targetIndex);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const slots = Array.from({ length: maxSlots });

    return (
        <div className="grid grid-cols-8 gap-2 p-1">
            {slots.map((_, idx) => {
                const item = inventory[idx]; // Arrays are sparse or dense? Typically dense here but handling sparse just in case is tricky with linear map. 
                // Assuming inventory is NOT sparse but list of items. 
                // Wait, if I drag item from 0 to 5, does inventory become sparse?
                // The current Game logic usually pushes/splices.
                // IF we want "Grid Placement", inventory must be sparse (array with holes).
                // But `inventory` in `GameState` is `Item[]`.
                // Let's assume compact list for now, visualized as grid.
                // BUT `onReorder(source, target)` implies we might want specific slots.
                // If the game isn't designed for slot-based persistence (like Diablo), then reorder just swaps index.
                // The current implementation maps `inventory.map` then fills rest with empty.
                const isActive = selectedIndex === idx;
                const isSelected = (selectedItem as any)?.index === idx;

                return (
                    <InventoryItemSlot
                        key={idx}
                        index={idx}
                        item={item} // undefined if idx >= length
                        isEmpty={!item}
                        isActive={isActive}
                        isSelected={isSelected}
                        onClick={() => item && onSelect(item, idx)}
                        onDragStart={handleDragStart}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    />
                );
            })}
        </div>
    );
}
