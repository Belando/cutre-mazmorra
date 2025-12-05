import { useState, useCallback } from 'react';
import { 
  addToInventory as addItemLogic, 
  useItem as useItemLogic, 
  equipItem as equipItemLogic, 
  unequipItem as unequipItemLogic 
} from '@/components/game/systems/ItemSystem';
import { craftItem as craftLogic, upgradeItem as upgradeLogic } from '@/components/game/systems/CraftingSystem';


export function useInventory() {
  const [inventory, setInventory] = useState([]);
  const [equipment, setEquipment] = useState({ 
    weapon: null, offhand: null, helmet: null, chest: null, 
    legs: null, boots: null, gloves: null, ring: null, 
    earring: null, necklace: null 
  });
  const [materials, setMaterials] = useState({});
  const [quickSlots, setQuickSlots] = useState([null, null, null]);

  const initInventory = useCallback((savedData) => {
    if (savedData) {
      setInventory(savedData.inventory || []);
      setEquipment(savedData.equipment || {});
      setMaterials(savedData.materials || {});
      setQuickSlots(savedData.quickSlots || [null, null, null]);
    }
  }, []);

  // CORRECCIÓN: Ahora addItem devuelve el booleano correcto síncronamente
  const addItem = useCallback((item) => {
    const newInv = [...inventory];
    const res = addItemLogic(newInv, item);
    
    if (res.success) {
      setInventory(newInv);
    }
    return res.success;
  }, [inventory]); // Añadimos dependencia de inventory

  const useItem = useCallback((index, player) => {
    let result = { success: false, message: '' };
    setInventory(prev => {
      const newInv = [...prev];
      result = useItemLogic(newInv, index, player);
      return result.success ? newInv : prev;
    });
    return result;
  }, []);

  const equipItem = useCallback((index, player) => {
    return { success: false, message: "Use engine action" }; 
  }, []);

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