import React from 'react';
import {
    // Consumibles
    GiHealthPotion, GiWaterFlask,
    // Armas
    GiBroadsword, GiBattleAxe, GiDaggers, GiPocketBow, GiWizardStaff, GiFairyWand,
    // Offhands
    GiRoundShield, GiSpellBook, GiQuiver,
    // Heavy Armor (Placas)
    GiClosedBarbute, GiBreastplate, GiLegArmor, GiMetalBoot, GiGauntlet,
    // Medium Armor (Cuero)
    GiHood, GiLeatherArmor, GiTrousers, GiLeatherBoot, GiBracers,
    // Light Armor (Tela)
    GiPointyHat, GiRobe, GiSkirt, GiBoots, GiGloves,
    // Accesorios
    GiRing, GiNecklace, GiEarrings,
    // Materiales
    GiStoneBlock, GiWoodPile, GiHerbsBundle,
    // Fallbacks / Generics
    GiKnapsack
} from 'react-icons/gi';

export const ICON_MAP: Record<string, React.ComponentType<any>> = {
    // Consumibles
    'GiHealthPotion': GiHealthPotion,
    'GiWaterFlask': GiWaterFlask,

    // Armas
    'GiBroadsword': GiBroadsword,
    'GiBattleAxe': GiBattleAxe,
    'GiDaggers': GiDaggers,
    'GiPocketBow': GiPocketBow,
    'GiWizardStaff': GiWizardStaff,
    'GiFairyWand': GiFairyWand,

    // Offhands
    'GiRoundShield': GiRoundShield,
    'GiSpellBook': GiSpellBook,
    'GiQuiver': GiQuiver,

    // Heavy Armor
    'GiClosedBarbute': GiClosedBarbute,
    'GiBreastplate': GiBreastplate,
    'GiLegArmor': GiLegArmor,
    'GiMetalBoot': GiMetalBoot,
    'GiGauntlet': GiGauntlet,

    // Medium Armor
    'GiHood': GiHood,
    'GiLeatherArmor': GiLeatherArmor,
    'GiTrousers': GiTrousers,
    'GiLeatherBoot': GiLeatherBoot,
    'GiBracers': GiBracers,

    // Light Armor
    'GiPointyHat': GiPointyHat,
    'GiRobe': GiRobe,
    'GiSkirt': GiSkirt,
    'GiBoots': GiBoots,
    'GiGloves': GiGloves,

    // Accesorios
    'GiRing': GiRing,
    'GiNecklace': GiNecklace,
    'GiEarrings': GiEarrings,

    // Materiales
    'GiStoneBlock': GiStoneBlock,
    'GiWoodPile': GiWoodPile,
    'GiHerbsBundle': GiHerbsBundle,
    'GiKnapsack': GiKnapsack
};

export function getIconComponent(iconId: string | undefined): React.ComponentType<any> {
    if (!iconId) return GiKnapsack;
    return ICON_MAP[iconId] || GiKnapsack;
}
