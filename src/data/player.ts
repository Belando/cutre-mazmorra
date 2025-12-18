// src/data/player.ts

export interface PlayerAppearance {
    name: string;
    class: 'warrior' | 'mage' | 'rogue';
    colors: {
        tunic: string;
        hair: string;
        skin: string;
    };
    description: string;
}

export const PLAYER_APPEARANCES: Record<string, PlayerAppearance> = {
    warrior: {
        name: 'Guerrero',
        class: 'warrior',
        colors: { tunic: '#dc2626', hair: '#78350f', skin: '#fcd5b8' },
        description: 'Maestro del combate cuerpo a cuerpo. Alta defensa y fuerza bruta.',
    },
    mage: {
        name: 'Mago',
        class: 'mage',
        colors: { tunic: '#7c3aed', hair: '#fafafa', skin: '#fcd5b8' },
        description: 'Domina las artes arcanas. Ataques a distancia y curación.',
    },
    rogue: {
        name: 'Pícaro',
        class: 'rogue',
        colors: { tunic: '#1e293b', hair: '#292524', skin: '#fcd5b8' },
        description: 'Sigilo y precisión. Golpes críticos letales.',
    },
};
