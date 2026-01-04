import { Item } from '@/types';

// NOTE: This file now returns String IDs for icons, not React Components.
// Consumers must use IconMap to resolve them.

export const EQUIPMENT_SLOTS: Record<string, { name: string, icon: string }> = {
    weapon: { name: 'Arma', icon: 'GiBroadsword' },
    offhand: { name: 'Mano Izq.', icon: 'GiCheckedShield' },
    helmet: { name: 'Cabeza', icon: 'GiHood' },
    chest: { name: 'Pecho', icon: 'GiChestArmor' },
    legs: { name: 'Piernas', icon: 'GiArmoredPants' },
    boots: { name: 'Pies', icon: 'GiBoots' },
    gloves: { name: 'Manos', icon: 'GiGauntlet' },
    ring: { name: 'Anillo', icon: 'GiRing' },
    earring: { name: 'Accesorio', icon: 'GiEarrings' },
    necklace: { name: 'Cuello', icon: 'GiNecklace' },
};

export const CATEGORY_ICONS: Record<string, string> = {
    weapon: 'GiBroadsword',
    armor: 'GiChestArmor',
    potion: 'GiHealthPotion',
    scroll: 'GiScrollUnfurled',
    food: 'GiMeat',
    currency: 'GiTwoCoins',
    ammo: 'GiCrossbow',
    accessory: 'GiRing',
    material: 'GiSwapBag',
    default: 'GiSwapBag'
};

const MATERIAL_ICONS: Record<string, string> = {
    iron_ore: 'GiStoneBlock',
    gold_ore: 'GiGoldNuggets',
    crystal: 'GiCrystalBars',
    dragon_scale: 'GiScales',
    essence: 'GiDrop',
    leather: 'GiAnimalHide',
    cloth: 'GiSewingString'
};

export const getItemIcon = (item: Item | null): string => {
    if (!item) return 'GiSwapBag';

    // 1. Prefer the explicit symbol from Item Data (Phase 6 Architecture)
    if (item.symbol && typeof item.symbol === 'string') {
        return item.symbol;
    }

    // 2. Fallbacks for Legacy/Procedural items lacking symbols
    if (item.category === 'material' && item.templateKey && MATERIAL_ICONS[item.templateKey]) {
        return MATERIAL_ICONS[item.templateKey];
    }

    if (item.weaponType) {
        switch (item.weaponType) {
            case 'axe': return 'GiBattleAxe';
            case 'dagger': return 'GiDaggers';
            case 'bow': return 'GiPocketBow';
            case 'staff': return 'GiWizardStaff';
            case 'wand': return 'GiFairyWand';
            case 'tome': return 'GiSpellBook';
            case 'shield': return 'GiCheckedShield';
            case 'quiver': return 'GiQuiver';
            case 'mace': return 'GiWarPick';
            default: return 'GiBroadsword';
        }
    }

    if (item.armorType) {
        if (item.armorType === 'heavy') {
            if (item.slot === 'helmet') return 'GiClosedBarbute';
            if (item.slot === 'chest') return 'GiBreastplate';
            if (item.slot === 'legs') return 'GiLegArmor';
            if (item.slot === 'boots') return 'GiMetalBoot';
        }
        if (item.armorType === 'light') {
            if (item.slot === 'helmet') return 'GiPointyHat';
            if (item.slot === 'chest') return 'GiRobe';
            if (item.slot === 'legs') return 'GiSkirt';
        }
        if (item.slot === 'chest') return 'GiLeatherArmor';
        if (item.slot === 'boots') return 'GiLeatherBoot';
    }

    if (item.slot && EQUIPMENT_SLOTS[item.slot]) return EQUIPMENT_SLOTS[item.slot].icon;

    return CATEGORY_ICONS[item.category] || CATEGORY_ICONS.default;
};

export const MAP_ICONS: Record<string, string> = {
    player: 'GiMeeple',
    chest: 'GiChest',
    stairs: 'GiStairs',
    door: 'GiDoor',
    npc: 'GiConversation',
    danger: 'GiDeathSkull'
};
