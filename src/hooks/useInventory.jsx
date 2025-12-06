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

  // Función auxiliar para añadir items (Usada por GameActions al recoger botín)
  const addItem = useCallback((item) => {
    // Usamos el callback de setInventory para asegurar que tenemos el estado más reciente
    // pero como addItemLogic devuelve un booleano success, necesitamos calcularlo antes.
    // En este caso, dependemos de que 'inventory' esté actualizado en el cierre del hook.
    
    const newInv = [...inventory];
    const res = addItemLogic(newInv, item);
    
    if (res.success) {
      setInventory(newInv);
    }
    return res.success;
  }, [inventory]);

  // Función auxiliar para añadir materiales (Simple suma)
  const addMaterial = useCallback((type, amount) => {
    setMaterials(prev => ({ ...prev, [type]: (prev[type] || 0) + amount }));
  }, []);

  return {
    inventory, setInventory,
    equipment, setEquipment,
    materials, setMaterials,
    quickSlots, setQuickSlots,
    initInventory,
    addItem,
    addMaterial
  };
}