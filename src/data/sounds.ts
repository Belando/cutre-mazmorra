export type SoundEffectName =
    | 'step' | 'chest' | 'door' | 'stairs' | 'pickup' | 'equip' | 'error' | 'levelUp'
    | 'attack' | 'hit' | 'enemy_hit' | 'critical' | 'kill' | 'anvil'
    | 'fireball' | 'ice' | 'heal' | 'buff' | 'magic'
    | 'start_adventure' | 'gameOver' | 'speech' | 'break';

export const SOUND_ASSETS: Record<SoundEffectName | string, string> = {
    'step': '/sounds/sfx/steps.wav',
    'chest': '/sounds/sfx/chest_open.mp3',
    'door': '/sounds/sfx/open_door.wav',
    'stairs': '/sounds/sfx/stairs.mp3',
    'pickup': '/sounds/sfx/coin.mp3',
    'equip': '/sounds/sfx/equip.mp3',
    'error': '/sounds/sfx/error.mp3',
    'levelUp': '/sounds/sfx/levelup.mp3',
    'attack': '/sounds/sfx/swing.mp3',
    'hit': '/sounds/sfx/impact.mp3',
    'enemy_hit': '/sounds/sfx/slime_hit.mp3',
    'critical': '/sounds/sfx/crit.mp3',
    'kill': '/sounds/sfx/kill.mp3',
    'anvil': '/sounds/sfx/anvil.mp3',
    'break': '/sounds/sfx/impact.mp3', // Reusing impact for break

    'fireball': '/sounds/sfx/fireball.mp3',
    'ice': '/sounds/sfx/ice.mp3',
    'heal': '/sounds/sfx/heal.mp3',
    'buff': '/sounds/sfx/buff.mp3',
    'magic': '/sounds/sfx/spell.mp3',

    'start_adventure': '/sounds/music/start.mp3',
    'gameOver': '/sounds/music/gameover.mp3',
    'speech': '/sounds/sfx/speech_blip.mp3'
};

export interface SoundSettings {
    volume: number;
    pitch: number;
}

export const SOUND_SETTINGS: Record<string, SoundSettings> = {
    // Valores por defecto
    'default': { volume: 1.0, pitch: 1.0 },

    // Ajustes específicos
    'step': { volume: 0.2, pitch: 0.8 },
    'door': { volume: 1.0, pitch: 1.0 },
    'start_adventure': { volume: 0.6, pitch: 1.0 },
    'gameOver': { volume: 0.6, pitch: 1.0 },
};
