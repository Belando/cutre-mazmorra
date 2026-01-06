import { ItemTemplate } from './types';

export const POTION_TEMPLATES: Record<string, ItemTemplate> = {
    health_potion: { name: 'Poción de Vida', category: 'potion', symbol: 'GiHealthPotion', description: 'Restaura vida.', stackable: true, baseStats: { health: 50 } },
    mana_potion: { name: 'Poción de Maná', category: 'potion', symbol: 'GiWaterFlask', description: 'Restaura maná.', stackable: true, baseStats: { mana: 30 } },
};
