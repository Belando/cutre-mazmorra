import { ItemTemplate } from './types';
import { POTION_TEMPLATES } from './consumables';
import { MATERIAL_TEMPLATES } from './materials';
import { WEAPON_TEMPLATES } from './weapons';
import { ARMOR_TEMPLATES } from './armor';

export * from './types';
export * from './config';

export const ITEM_TEMPLATES: Record<string, ItemTemplate> = {
    ...POTION_TEMPLATES,
    ...MATERIAL_TEMPLATES,
    ...WEAPON_TEMPLATES,
    ...ARMOR_TEMPLATES,
};
