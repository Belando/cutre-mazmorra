import { useMemo, useState } from 'react';
import { Item, EquipmentState, Player } from '@/types';

export interface UseInventoryLogicProps {
    inventory: Item[];
    equipment: EquipmentState;
    player: Player;
    materials?: Record<string, number>;
}

export type SortMethod = 'newest' | 'rarity' | 'type' | 'value';

export function useInventoryLogic({ inventory, equipment, player, materials }: UseInventoryLogicProps) {
    const [sortMethod, setSortMethod] = useState<SortMethod>('newest');
    const [filterCategory, setFilterCategory] = useState<string | 'all'>('all');

    // Stats / Derived Data
    const formattedGold = useMemo(() => {
        return new Intl.NumberFormat('es-ES').format(player.gold);
    }, [player.gold]);

    const materialCounts = useMemo(() => ({
        wood: materials?.wood || 0,
        stone: materials?.stone || 0,
        iron: materials?.iron || 0 // Added for future
    }), [materials]);

    const inventoryCount = inventory.filter(i => !!i).length;
    const isFull = inventoryCount >= 64; // Hardcoded size for now

    // Sorting & Filtering
    const processedInventory = useMemo(() => {
        let items = [...inventory]; // Copy to avoid mutation

        // 1. Filter
        if (filterCategory !== 'all') {
            items = items.map(item =>
                (item && item.category === filterCategory) ? item : (null as any)
            );
            // Note: In grid inventory, we usually keep empty slots as null/undefined to maintain grid structure.
            // If we want a "filtered view" that collapses gaps, we'd filter.
            // But if we want to dim them, we'd handle it differently.
            // For now, let's assume valid sorting re-arranges them or we just sort standard items.
            // ACTUALLY: The current Grid expects fixed slots. Sorting typically compacts them.
            // Let's keep it simple: This hook provides a "View" of the inventory.
        }

        // 2. Sort (Only affects non-null items, usually packs them to start)
        const validItems = items.filter(i => i !== null && i !== undefined);
        const emptySlots = items.length - validItems.length; // Remaining slots

        validItems.sort((a, b) => {
            switch (sortMethod) {
                case 'rarity':
                    const rarityScore = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
                    return (rarityScore[b.rarity] || 0) - (rarityScore[a.rarity] || 0);
                case 'value':
                    return (b.value || 0) - (a.value || 0);
                case 'type':
                    return (a.category || '').localeCompare(b.category || '');
                case 'newest':
                default:
                    return 0; // Original order implicit in validItems extraction if we don't track timestamp
            }
        });

        // If we are applying sort, we return compacted list + empty slots?
        // Or do we strictly return the original array if 'newest' (unsorted)?
        if (sortMethod === 'newest') return inventory; // Return raw 

        // If sorted, we flatten
        return [...validItems, ...Array(Math.max(0, 64 - validItems.length)).fill(null)];

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
