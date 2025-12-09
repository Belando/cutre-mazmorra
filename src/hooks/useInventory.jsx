import { useState, useCallback } from 'react';
import { addToInventory as addItemLogic } from "@/engine/systems/ItemSystem";

export function useInventory() {
  const [inventory, setInventory] = useState([]);
  const [equipment, setEquipment] = useState({ 
    weapon: null, offhand: null, helmet: null, chest: null, 
    legs: null, boots: null, gloves: null, ring: null, 
    earring: null, necklace: null 
  });
  const [materials, setMaterials] = useState({});
  const [quickSlots, setQuickSlots] = useState([null, null, null]);

  // Cargar datos guardados
  const initInventory = useCallback((savedData) => {
    if (savedData) {
      setInventory(savedData.inventory || []);
      setEquipment(savedData.equipment || {});
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
  const reorderInventory = useCallback((fromIndex, toIndex) => {
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

  const addItem = useCallback((item) => {
    const newInv = [...inventory];
    const res = addItemLogic(newInv, item);
    if (res.success) setInventory(newInv);
    return res.success;
  }, [inventory]);

  const addMaterial = useCallback((type, amount) => {
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
    reorderInventory // <--- EXPORTAR
  };
}