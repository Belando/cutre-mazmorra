import { useMemo, useState } from 'react';
import { Item, EquipmentState, Player } from '@/types';
import { SortMethod } from '@/components/ui/inventory/ItemFilters';

export interface UseInventoryControllerProps {
    inventory: Item[];
    equipment: EquipmentState;
    player: Player;
    materials?: Record<string, number>;
}

export function useInventoryController({ inventory, equipment, player, materials }: UseInventoryControllerProps) {
    const [sortMethod, setSortMethod] = useState<SortMethod>('newest');
    const [filterCategory, setFilterCategory] = useState<string>('all');

    // Stats / Derived Data
    const formattedGold = useMemo(() => {
        return new Intl.NumberFormat('es-ES').format(player.gold);
    }, [player.gold]);

    const materialCounts = useMemo(() => ({
        wood: materials?.wood || 0,
        stone: materials?.stone || 0,
        iron: materials?.iron || 0
    }), [materials]);

    const inventoryCount = inventory.filter(i => !!i).length;
    const isFull = inventoryCount >= 64;

    // Sorting & Filtering
    const processedInventory = useMemo(() => {
        let items = [...inventory];

        // 1. Filter
        if (filterCategory !== 'all') {
            // map non-matching items to null so they display as empty slots or are hidden? 
            // If we filter, we usually want to show mostly the filtered items.
            // But if the grid is pos-based, filtering is tricky.
            // For now, let's just nullify them so they disappear from the grid view but slots remain?
            // Or act like a search filtering where we only show matches.
            // If we assume a rigid grid, filtering means "grey out" or "hide".
            // Let's go with: filter returns a compacted list of valid items, plus specific nulls? 
            // Or just return matching items.
            const matches = items.filter(item => item && item.category === filterCategory);
            // We pad with nulls to fill grid if needed, or just return matches.
            // InventoryGrid expects 64 length usually?
            // If InventoryGrid just maps the array, we can return matches + null padding.
            const padding = Array(Math.max(0, 64 - matches.length)).fill(null);
            return [...matches, ...padding].slice(0, 64);
        }

        // 2. Sort
        if (sortMethod !== 'newest') {
            const validItems = items.filter(i => i !== null && i !== undefined);

            validItems.sort((a, b) => {
                switch (sortMethod) {
                    case 'rarity':
                        const rarityScore: Record<string, number> = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
                        return (rarityScore[b.rarity] || 0) - (rarityScore[a.rarity] || 0);
                    case 'value':
                        return (b.value || 0) - (a.value || 0);
                    case 'type':
                        return (a.category || '').localeCompare(b.category || '');
                    default:
                        return 0;
                }
            });

            const padding = Array(Math.max(0, 64 - validItems.length)).fill(null);
            return [...validItems, ...padding].slice(0, 64);
        }

        return items; // Default view

    }, [inventory, sortMethod, filterCategory]);

    const getEquippedItem = (slot: string) => {
        return equipment[slot as keyof EquipmentState];
    };

    return {
        // State
        sortMethod,
        setSortMethod,
        filterCategory,
        setFilterCategory,

        // Data
        processedInventory,
        formattedGold,
        materialCounts,
        inventoryCount,
        isFull,

        // Helpers
        getEquippedItem
    };
}
