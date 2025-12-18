import {
    GiBroadsword, GiCheckedShield, GiHood, GiChestArmor,
    GiArmoredPants, GiBoots, GiGauntlet, GiRing,
    GiEarrings, GiNecklace,
    GiHealthPotion, GiScrollUnfurled, GiMeat, GiTwoCoins, GiSwapBag, GiCrossbow,
    GiGoldNuggets, GiCrystalBars, GiDrop, GiSewingString, GiStoneBlock, GiScales, GiAnimalHide,
    GiMeeple, GiChest, GiStairs, GiDoor, GiConversation, GiDeathSkull,
    GiBattleAxe, GiDaggers, GiPocketBow, GiWizardStaff, GiFairyWand, GiSpellBook, GiQuiver, GiWarPick,
    GiClosedBarbute, GiBreastplate, GiLegArmor, GiMetalBoot,
    GiLeatherArmor, GiLeatherBoot,
    GiPointyHat, GiRobe, GiSkirt,
} from 'react-icons/gi';
import { Item } from '@/types';

export const EQUIPMENT_SLOTS: Record<string, { name: string, icon: any }> = {
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

export const CATEGORY_ICONS: Record<string, any> = {
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

const MATERIAL_ICONS: Record<string, any> = {
    iron_ore: GiStoneBlock,
    gold_ore: GiGoldNuggets,
    crystal: GiCrystalBars,
    dragon_scale: GiScales,
    essence: GiDrop,
    leather: GiAnimalHide,
    cloth: GiSewingString
};

export const getItemIcon = (item: Item | null): any => {
    if (!item) return GiSwapBag;

    if (item.category === 'material' && item.templateKey && MATERIAL_ICONS[item.templateKey]) {
        return MATERIAL_ICONS[item.templateKey];
    }

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

    if (item.armorType) {
        if (item.armorType === 'heavy') {
            if (item.slot === 'helmet') return GiClosedBarbute;
            if (item.slot === 'chest') return GiBreastplate;
            if (item.slot === 'legs') return GiLegArmor;
            if (item.slot === 'boots') return GiMetalBoot;
        }
        if (item.armorType === 'light') {
            if (item.slot === 'helmet') return GiPointyHat;
            if (item.slot === 'chest') return GiRobe;
            if (item.slot === 'legs') return GiSkirt;
        }
        if (item.slot === 'chest') return GiLeatherArmor;
        if (item.slot === 'boots') return GiLeatherBoot;
    }

    if (item.slot && EQUIPMENT_SLOTS[item.slot]) return EQUIPMENT_SLOTS[item.slot].icon;

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
