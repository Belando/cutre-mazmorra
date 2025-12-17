import { useState, useEffect } from 'react';
import { spriteManager } from '@/engine/core/SpriteManager';

// Definir aquí los assets que el juego necesita cargar al inicio
const REQUIRED_ASSETS = [
    { key: 'player_sheet', src: '/sprites/player_sheet.svg' },
    
    // Warrior - Idle
    { key: 'warrior_idle_1', src: '/sprites/warrior/idle1.png' },
    { key: 'warrior_idle_2', src: '/sprites/warrior/idle2.png' },
    { key: 'warrior_idle_3', src: '/sprites/warrior/idle3.png' },
    
    // Warrior - Walk Down
    { key: 'warrior_walk_down_1', src: '/sprites/warrior/walk-down-1.png' },
    { key: 'warrior_walk_down_2', src: '/sprites/warrior/walk-down-2.png' },
    { key: 'warrior_walk_down_3', src: '/sprites/warrior/walk-down-3.png' },
    
    // Warrior - Attack Left
    { key: 'warrior_attack_left_1', src: '/sprites/warrior/attack-left-1.png' },
    { key: 'warrior_attack_left_2', src: '/sprites/warrior/attack-left-2.png' },
    { key: 'warrior_attack_left_3', src: '/sprites/warrior/attack-left-3.png' },

    // Warrior - Attack Right
    { key: 'warrior_attack_right_1', src: '/sprites/warrior/attack-right-1.png' },
    { key: 'warrior_attack_right_2', src: '/sprites/warrior/attack-right-2.png' },
    { key: 'warrior_attack_right_3', src: '/sprites/warrior/attack-right-3.png' },

    { key: 'skeleton_sheet', src: '/sprites/skeleton_sheet.svg' },
    { key: 'rat_sheet', src: '/sprites/rat_sheet.svg' },
    { key: 'goblin_sheet', src: '/sprites/goblin_sheet.svg' },
    { key: 'door_closed', src: '/sprites/door_closed.png' },
    { key: 'door_open', src: '/sprites/door_open.png' },
    { key: 'bones', src: '/sprites/bones.png' },
    { key: 'rubble', src: '/sprites/rubble.png' },
    { key: 'bloodstain', src: '/sprites/bloodstain.png' },
    { key: 'crack', src: '/sprites/crack.png' },
];

export function useAssetLoader() {
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        let loadedCount = 0;
        let isMounted = true;

        const loadAll = async () => {
            try {
                const promises = REQUIRED_ASSETS.map(async (asset) => {
                    await spriteManager.load(asset.key, asset.src);
                    if (isMounted) {
                        loadedCount++;
                        setProgress(Math.round((loadedCount / REQUIRED_ASSETS.length) * 100));
                    }
                });

                await Promise.all(promises);
                
                if (isMounted) {
                    setLoading(false);
                }
            } catch (err) {
                console.error("Failed to load assets", err);
                if (isMounted) {
                    setError(err);
                    setLoading(false); // Permitimos continuar aunque fallen (fallback visual)
                }
            }
        };

        loadAll();

        return () => {
            isMounted = false;
        };
    }, []);

    return { loading, progress, error };
}
