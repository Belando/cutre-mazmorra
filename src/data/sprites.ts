import { ENTITY } from '@/data/constants';
import { SpriteComponent } from '@/types';

// Helper para configurar el sprite según el tipo de enemigo
export function getSpriteForEnemy(type: number | string): SpriteComponent | null {
    // Mapeo de IDs a texturas (SVG placeholders generados)
    let texture: string | null = null;
    const t = typeof type === 'string' ? parseInt(type) : type;

    switch (t) {
        case ENTITY.ENEMY_RAT: texture = 'rat'; break;
        case ENTITY.ENEMY_BAT: texture = 'bat'; break;
        case ENTITY.ENEMY_GOBLIN: texture = 'goblin'; break;
        case ENTITY.ENEMY_ORC: texture = 'goblin'; break; // Reusar goblin
        case ENTITY.ENEMY_SKELETON: texture = 'skeleton'; break;
        case ENTITY.ENEMY_ZOMBIE: texture = 'skeleton'; break; // Reusar skeleton
        case ENTITY.ENEMY_SPIDER: texture = 'spider'; break;
        case ENTITY.ENEMY_TROLL: texture = 'goblin'; break; // Placeholder
        case ENTITY.ENEMY_WRAITH: texture = 'skeleton'; break; // Placeholder
        case ENTITY.ENEMY_DEMON: texture = 'goblin'; break; // Placeholder
        case ENTITY.ENEMY_DRAGON: texture = 'rat'; break; // Placeholder
        case ENTITY.ENEMY_SLIME: texture = 'slime_sheet'; break;
        case ENTITY.ENEMY_WOLF: texture = 'wolf'; break;
        case ENTITY.ENEMY_CULTIST: texture = 'skeleton'; break; // Placeholder
        case ENTITY.ENEMY_GOLEM: texture = 'goblin'; break; // Placeholder
        case ENTITY.BOSS_GOBLIN_KING: texture = 'goblin_king'; break;
        case ENTITY.BOSS_SKELETON_LORD: texture = 'skeleton'; break;
        case ENTITY.BOSS_ORC_WARLORD: texture = 'goblin'; break;
        case ENTITY.BOSS_DEMON_LORD: texture = 'goblin'; break;
        case ENTITY.BOSS_ANCIENT_DRAGON: texture = 'rat'; break;

        default: return null;
    }

    if (!texture) return null;

    // Special config for new sprites (Rat, Bat, Spider, Wolf, Goblin King, Skeleton, Goblin)
    if (['rat', 'bat', 'spider', 'wolf', 'goblin_king', 'skeleton', 'goblin'].includes(texture)) {
        return {
            texture: texture,
            frameSize: { x: 256, y: 256 }, // CRITICAL: Matches Smart Slicer output
            cols: 8,
            anims: {
                // Row 0: Down
                walk_down: [0, 1, 2, 3],
                attack_down: [4, 5, 6, 7],

                // Row 1: Left
                walk_left: [8, 9, 10, 11],
                attack_left: [12, 13, 14, 15],

                // Row 2: Right
                walk_right: [16, 17, 18, 19],
                attack_right: [20, 21, 22, 23],

                // Row 3: Up
                walk_up: [24, 25, 26, 27],
                attack_up: [28, 29, 30, 31]
            },
            flipLeft: false,
            currentAnim: 'walk_down',
            currentFrameIndex: 0,
            frameTimer: 0,
            frameDuration: 120
        };
    }

    return {
        texture: texture,
        frameSize: { x: 32, y: 32 },
        anims: {
            walk_down: [0, 1, 2, 1],
            walk_left: [3, 4, 5, 4],
            walk_right: [6, 7, 8, 7],
            walk_up: [9, 10, 11, 10]
        },
        currentAnim: 'walk_down',
        currentFrameIndex: 1,
        frameTimer: 0,
        frameDuration: 200 + Math.random() * 50
    };
}
