import { useState, useCallback } from 'react';
import { addToInventory as addItemLogic } from "@/engine/systems/ItemSystem";
import { Item, EquipmentState } from '@/types';
import { QuickSlotData } from '@/components/ui/QuickSlots';

export interface InventorySaveData {
    inventory: Item[];
    equipment: EquipmentState;
    materials: Record<string, number>;
    quickSlots: (QuickSlotData | null)[];
}

export interface UseInventoryResult {
    inventory: Item[];
    setInventory: React.Dispatch<React.SetStateAction<Item[]>>;
    equipment: EquipmentState;
    setEquipment: React.Dispatch<React.SetStateAction<EquipmentState>>;
    materials: Record<string, number>;
    setMaterials: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    quickSlots: (QuickSlotData | null)[];
    setQuickSlots: React.Dispatch<React.SetStateAction<(QuickSlotData | null)[]>>;
    initInventory: (savedData: InventorySaveData | null) => void;
    resetInventory: () => void;
    addItem: (item: Item) => boolean;
    addMaterial: (type: string, amount: number) => void;
    reorderInventory: (fromIndex: number, toIndex: number) => void;
}

export function useInventory(): UseInventoryResult {
    const [inventory, setInventory] = useState<Item[]>([]);
    const [equipment, setEquipment] = useState<EquipmentState>({
        weapon: null, offhand: null, helmet: null, chest: null,
        legs: null, boots: null, gloves: null, ring: null,
        earring: null, necklace: null
    });
    const [materials, setMaterials] = useState<Record<string, number>>({});
    const [quickSlots, setQuickSlots] = useState<(QuickSlotData | null)[]>([null, null, null]);

    // Cargar datos guardados
    const initInventory = useCallback((savedData: InventorySaveData | null) => {
        if (savedData) {
            setInventory(savedData.inventory || []);
            setEquipment(savedData.equipment || {
                weapon: null, offhand: null, helmet: null, chest: null,
                legs: null, boots: null, gloves: null, ring: null,
                earring: null, necklace: null
            });
            setMaterials(savedData.materials || {});
            setQuickSlots(savedData.quickSlots || [null, null, null]);
        }
    }, []);

    const resetInventory = useCallback(() => {
        setInventory([]);
        setEquipment({
            weapon: null, offhand: null, helmet: null, chest: null,
            legs: null, boots: null, gloves: null, ring: null,
            earring: null, necklace: null
        });
        setMaterials({});
        setQuickSlots([null, null, null]);
    }, []);

    // --- NUEVO: Función para reordenar (Intercambiar posiciones) ---
    const reorderInventory = useCallback((fromIndex: number, toIndex: number) => {
        setInventory(prev => {
            if (fromIndex === toIndex) return prev;
            const newInv = [...prev];
            // Verificar límites
            if (fromIndex < 0 || fromIndex >= newInv.length || toIndex < 0 || toIndex >= newInv.length) return prev;

            // Intercambio simple (Swap)
            const temp = newInv[fromIndex];
            newInv[fromIndex] = newInv[toIndex];
            newInv[toIndex] = temp;

            return newInv;
        });
    }, []);
    // -------------------------------------------------------------

    const addItem = useCallback((item: Item) => {
        const newInv = [...inventory];
        const res = addItemLogic(newInv, item);
        if (res.success) {
            setInventory(newInv);
        }
        return res.success;
    }, [inventory]);


    const addMaterial = useCallback((type: string, amount: number) => {
        setMaterials(prev => ({ ...prev, [type]: (prev[type] || 0) + amount }));
    }, []);

    return {
        inventory, setInventory,
        equipment, setEquipment,
        materials, setMaterials,
        quickSlots, setQuickSlots,
        initInventory,
        resetInventory,
        addItem,
        addMaterial,
        reorderInventory
    };
}
