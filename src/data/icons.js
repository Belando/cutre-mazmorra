import { 
  GiBroadsword, GiCheckedShield, GiHood, GiChestArmor, 
  GiArmoredPants, GiBoots, GiGauntlet, GiRing, 
  GiEarrings, GiNecklace, GiHealthPotion, GiScrollUnfurled,
  GiMeat, GiTwoCoins, GiSwapBag, GiCrossbow, GiMagicTrident,
  GiDaggers, GiGoldNuggets, GiCrystalBars, 
  GiDrop, GiSewingString,
  GiMeeple, GiChest, GiStairs, GiDoor, GiConversation, GiDeathSkull
} from 'react-icons/gi';

export const EQUIPMENT_SLOTS = {
  weapon: { name: 'Arma', icon: GiBroadsword },
  offhand: { name: 'Mano Izq.', icon: GiCheckedShield },
  helmet: { name: 'Cabeza', icon: GiHood },
  chest: { name: 'Pecho', icon: GiChestArmor },
  legs: { name: 'Piernas', icon: GiArmoredPants },
  boots: { name: 'Pies', icon: GiBoots },
  gloves: { name: 'Manos', icon: GiGauntlet },
  ring: { name: 'Anillo', icon: GiRing },
  earring: { name: 'Accesorio', icon: GiEarrings },
  necklace: { name: 'Cuello', icon: GiNecklace },
};

export const CATEGORY_ICONS = {
  weapon: GiBroadsword,
  armor: GiChestArmor,
  potion: GiHealthPotion,
  scroll: GiScrollUnfurled,
  food: GiMeat,
  currency: GiTwoCoins,
  ammo: GiCrossbow,
  accessory: GiRing,
  material: GiSwapBag, // Icono por defecto para materiales
  default: GiSwapBag
};

// Mapa de iconos específicos para materiales
const MATERIAL_ICONS = {
  iron_ore: GiSwapBag,
  gold_ore: GiGoldNuggets,
  crystal: GiCrystalBars,
  dragon_scale: GiSwapBag,
  essence: GiDrop,
  leather: GiSwapBag,
  cloth: GiSewingString
};

export const getItemIcon = (item) => {
  if (!item) return GiSwapBag;
  
  if (item.category === 'material' && MATERIAL_ICONS[item.templateKey]) {
      return MATERIAL_ICONS[item.templateKey];
  }
  
  if (item.weaponType === 'dagger') return GiDaggers;
  if (item.weaponType === 'staff') return GiMagicTrident;
  
  if (item.slot && EQUIPMENT_SLOTS[item.slot]) return EQUIPMENT_SLOTS[item.slot].icon;
  return CATEGORY_ICONS[item.category] || CATEGORY_ICONS.default;
};

// Exportamos iconos para el Minimapa
export const MAP_ICONS = {
    player: GiMeeple,
    chest: GiChest,
    stairs: GiStairs,
    door: GiDoor,
    npc: GiConversation,
    danger: GiDeathSkull
};