import { ItemTemplate } from './types';

export const MATERIAL_TEMPLATES: Record<string, ItemTemplate> = {
    wood: { name: 'Madera', category: 'material', symbol: 'GiWoodPile', description: 'Recurso de construcción básico.', stackable: true, value: 5 },
    stone: { name: 'Piedra', category: 'material', symbol: 'GiStoneBlock', description: 'Fragmento de roca sólida.', stackable: true, value: 5 },
    herb: { name: 'Hierba Medicinal', category: 'material', symbol: 'GiHerbsBundle', description: 'Planta con propiedades curativas.', stackable: true, value: 10 },
    iron_ore: { name: 'Mineral de Hierro', category: 'material', symbol: 'GiStoneBlock', description: 'Hierro tal cual sale de la mina.', stackable: true, value: 15 },
    dragon_scale: { name: 'Escama de Dragón', category: 'material', symbol: 'GiScales', description: 'Dura y caliente al tacto.', stackable: true, value: 100 },
    ectoplasm: { name: 'Ectoplasma', category: 'material', symbol: 'GiDrop', description: 'Residuo fantasmal.', stackable: true, value: 25 },
    obsidian: { name: 'Obsidiana', category: 'material', symbol: 'GiStoneBlock', description: 'Vidrio volcánico afilado.', stackable: true, value: 40 },
};
