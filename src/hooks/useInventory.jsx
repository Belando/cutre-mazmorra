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

  const addItem = useCallback((item) => {
    let success = false;
    setInventory(prev => {
      const newInv = [...prev];
      const res = addItemLogic(newInv, item);
      success = res.success;
      return res.success ? newInv : prev;
    });
    return success;
  }, []);

  // Nota: Estas funciones requieren acceso al 'player' para validar stats.
  // En este hook manejamos el estado del inventario, pero la lógica de validación
  // a veces necesita datos externos. Los pasaremos como argumentos.

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
    let result = { success: false };
    // Necesitamos actualizar inventory Y equipment a la vez
    // Esto es tricky con useState separados si dependen uno del otro.
    // Usaremos una actualización funcional combinada desde fuera o aquí.
    
    // Simplificación: Asumimos que equipItemLogic muta los arrays pasados
    // Así que clonamos antes.
    
    let newInv, newEq;
    setInventory(prevInv => {
      newInv = [...prevInv];
      return prevInv; // No actualizamos aún
    });
    setEquipment(prevEq => {
      newEq = { ...prevEq };
      return prevEq;
    });

    // Esta lógica es compleja de desacoplar porque equipItemLogic modifica player stats también.
    // Para simplificar el refactor, devolveremos las nuevas versiones para que el Engine actualice.
    
    return { success: false, message: "Use engine action" }; 
  }, []);

  // Para evitar complejidad, expongamos los setters directos para acciones complejas
  // y usemos lógica simple para materiales y slots.

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