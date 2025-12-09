
import { 
  // Equipment Slots Defaults
  GiBroadsword, GiCheckedShield, GiHood, GiChestArmor, 
  GiArmoredPants, GiBoots, GiGauntlet, GiRing, 
  GiEarrings, GiNecklace, 
  // Categories
  GiHealthPotion, GiScrollUnfurled, GiMeat, GiTwoCoins, GiSwapBag, GiCrossbow,
  // Materials
  GiGoldNuggets, GiCrystalBars, GiDrop, GiSewingString, GiStoneBlock, GiScales, GiAnimalHide,
  // Map
  GiMeeple, GiChest, GiStairs, GiDoor, GiConversation, GiDeathSkull,
  // Specific Weapons
  GiBattleAxe, GiDaggers, GiPocketBow, GiWizardStaff, GiFairyWand, GiSpellBook, GiQuiver, GiWarPick,
  // Specific Armor
  GiClosedBarbute, GiBreastplate, GiLegArmor, GiMetalBoot, // Heavy
  GiLeatherArmor, GiLeatherBoot, // Medium
  GiPointyHat, GiRobe, GiSkirt, // Light
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
  material: GiSwapBag,
  default: GiSwapBag
};

// Mapa de iconos específicos para materiales
const MATERIAL_ICONS = {
  iron_ore: GiStoneBlock,
  gold_ore: GiGoldNuggets,
  crystal: GiCrystalBars,
  dragon_scale: GiScales,
  essence: GiDrop,
  leather: GiAnimalHide,
  cloth: GiSewingString
};

export const getItemIcon = (item) => {
  if (!item) return GiSwapBag;
  
  // 1. Prioridad: Materiales específicos por templateKey
  if (item.category === 'material' && item.templateKey && MATERIAL_ICONS[item.templateKey]) {
      return MATERIAL_ICONS[item.templateKey];
  }
  
  // 2. Prioridad: Tipos de Arma Específicos
  if (item.weaponType) {
      switch (item.weaponType) {
          case 'axe': return GiBattleAxe;
          case 'dagger': return GiDaggers;
          case 'bow': return GiPocketBow;
          case 'staff': return GiWizardStaff;
          case 'wand': return GiFairyWand;
          case 'tome': return GiSpellBook;
          case 'shield': return GiCheckedShield;
          case 'quiver': return GiQuiver;
          case 'mace': return GiWarPick;
          default: return GiBroadsword;
      }
  }

  // 3. Prioridad: Tipos de Armadura Específicos
  if (item.armorType) {
      // Heavy
      if (item.armorType === 'heavy') {
          if (item.slot === 'helmet') return GiClosedBarbute;
          if (item.slot === 'chest') return GiBreastplate;
          if (item.slot === 'legs') return GiLegArmor;
          if (item.slot === 'boots') return GiMetalBoot;
      }
      // Light / Mage
      if (item.armorType === 'light') {
          if (item.slot === 'helmet') return GiPointyHat;
          if (item.slot === 'chest') return GiRobe;
          if (item.slot === 'legs') return GiSkirt;
      }
      // Medium / Generic Fallbacks
      if (item.slot === 'chest') return GiLeatherArmor;
      if (item.slot === 'boots') return GiLeatherBoot;
  }
  
  // 4. Fallback por Slot Genérico
  if (item.slot && EQUIPMENT_SLOTS[item.slot]) return EQUIPMENT_SLOTS[item.slot].icon;
  
  // 5. Fallback por Categoría
  return CATEGORY_ICONS[item.category] || CATEGORY_ICONS.default;
};

export const MAP_ICONS = {
    player: GiMeeple,
    chest: GiChest,
    stairs: GiStairs,
    door: GiDoor,
    npc: GiConversation,
    danger: GiDeathSkull
};
