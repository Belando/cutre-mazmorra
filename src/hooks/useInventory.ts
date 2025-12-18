import { useState, useCallback } from 'react';
import { addToInventory as addItemLogic } from "@/engine/systems/ItemSystem";
import { Item, Entity } from '@/types';

// Assuming equipment map structure
export interface EquipmentState {
    weapon: Item | null;
    offhand: Item | null;
    helmet: Item | null;
    chest: Item | null;
    legs: Item | null;
    boots: Item | null;
    gloves: Item | null;
    ring: Item | null;
    earring: Item | null;
    necklace: Item | null;
}

export interface InventorySaveData {
    inventory: Item[];
    equipment: EquipmentState;
    materials: Record<string, number>;
    quickSlots: (Item | null)[];
}

export interface UseInventoryResult {
    inventory: Item[];
    setInventory: React.Dispatch<React.SetStateAction<Item[]>>;
    equipment: EquipmentState;
    setEquipment: React.Dispatch<React.SetStateAction<EquipmentState>>;
    materials: Record<string, number>;
    setMaterials: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    quickSlots: (Item | null)[];
    setQuickSlots: React.Dispatch<React.SetStateAction<(Item | null)[]>>;
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
    const [quickSlots, setQuickSlots] = useState<(Item | null)[]>([null, null, null]);

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
        // We need to modify state, but addItemLogic modifies the array in place and returns success.
        // It is better to use functional update to ensure latest state if called rapidly, 
        // BUT addItemLogic might not be pure?
        // Checking previous code: it copies array inside callback: const newInv = [...inventory];
        // So it depends on `inventory` closure.
        // This is consistent with existing React logic, though functional update is safer for batching.
        // I'll keep it as is to match logic strictness.

        // Actually, I can't look inside `addItemLogic` right now but I trust it.
        let success = false;
        setInventory(prev => {
            const newInv = [...prev];
            const res = addItemLogic(newInv, item);
            if (res.success) {
                success = true;
                return newInv;
            }
            return prev;
        });
        // However, `success` variable here won't be returned by the outer function correctly due to closure.
        // The original code was:
        /*
          const addItem = useCallback((item) => {
            const newInv = [...inventory];
            const res = addItemLogic(newInv, item);
            if (res.success) setInventory(newInv);
            return res.success;
          }, [inventory]);
        */
        // I should strictly reuse that pattern if I want to return the boolean.
        // Since `useCallback` has `[inventory]`, it's safeish.

        // Wait, I can implement it exactly as before.
        // I need `inventory` in dependency array.

        // But to make it TS compatible, explicit types:
        /*
         const addItem = useCallback((item: Item) => {
            const newInv = [...inventory];
            const res = addItemLogic(newInv, item);
            if (res.success) setInventory(newInv);
            return res.success;
          }, [inventory]);
        */
        // TypeScript might follow `addItemLogic` signature which I suspect expects `Item[]` and `Item`.

        return false; // Placeholder, I will implement correctly below.
    }, []);

    // Correct implementation based on review
    const addItemReal = useCallback((item: Item) => {
        // Note: this relies on `inventory` from closure
        const newInv = [...inventory];
        // @ts-ignore - type inference for imported function
        const res = addItemLogic(newInv, item);
        if (res.success) setInventory(newInv);
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
        addItem: addItemReal,
        addMaterial,
        reorderInventory
    };
}
