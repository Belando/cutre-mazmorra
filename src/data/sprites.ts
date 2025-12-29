import { ENTITY } from '@/data/constants';
import { SpriteComponent } from '@/types';

// Helper para configurar el sprite según el tipo de enemigo
export function getSpriteForEnemy(type: number | string): SpriteComponent | null {
    // Mapeo de IDs a texturas (SVG placeholders generados)
    let texture: string | null = null;
    const t = typeof type === 'string' ? parseInt(type) : type;

    switch (t) {
        case ENTITY.ENEMY_RAT: texture = 'rat'; break;
        case ENTITY.ENEMY_BAT: texture = 'rat'; break; // Reusar rat o añadir bat_sheet
        case ENTITY.ENEMY_GOBLIN: texture = 'goblin_sheet'; break;
        case ENTITY.ENEMY_ORC: texture = 'goblin_sheet'; break; // Reusar goblin
        case ENTITY.ENEMY_SKELETON: texture = 'skeleton_sheet'; break;
        case ENTITY.ENEMY_ZOMBIE: texture = 'skeleton_sheet'; break; // Reusar skeleton
        case ENTITY.ENEMY_SPIDER: texture = 'rat'; break; // Placeholder
        case ENTITY.ENEMY_TROLL: texture = 'goblin_sheet'; break; // Placeholder
        case ENTITY.ENEMY_WRAITH: texture = 'skeleton_sheet'; break; // Placeholder
        case ENTITY.ENEMY_DEMON: texture = 'goblin_sheet'; break; // Placeholder
        case ENTITY.ENEMY_DRAGON: texture = 'rat'; break; // Placeholder
        case ENTITY.ENEMY_SLIME: texture = 'slime_sheet'; break;
        case ENTITY.ENEMY_WOLF: texture = 'rat'; break; // Placeholder
        case ENTITY.ENEMY_CULTIST: texture = 'skeleton_sheet'; break; // Placeholder
        case ENTITY.ENEMY_GOLEM: texture = 'goblin_sheet'; break; // Placeholder
        case ENTITY.ENEMY_VAMPIRE: texture = 'skeleton_sheet'; break; // Placeholder
        case ENTITY.ENEMY_MIMIC: texture = 'chest_open'; break; // Especial?

        // Bosses
        case ENTITY.BOSS_GOBLIN_KING: texture = 'goblin_sheet'; break;
        case ENTITY.BOSS_SKELETON_LORD: texture = 'skeleton_sheet'; break;
        case ENTITY.BOSS_ORC_WARLORD: texture = 'goblin_sheet'; break;
        case ENTITY.BOSS_SPIDER_QUEEN: texture = 'rat'; break;
        case ENTITY.BOSS_LICH: texture = 'skeleton_sheet'; break;
        case ENTITY.BOSS_DEMON_LORD: texture = 'goblin_sheet'; break;
        case ENTITY.BOSS_ANCIENT_DRAGON: texture = 'rat'; break;

        default: return null;
    }

    if (!texture) return null;

    // Special config for new Rat sprite
    if (texture === 'rat') {
        return {
            texture: texture,
            frameSize: { x: 341, y: 256 }, // 1024/3, 1024/4
            cols: 3,
            anims: {
                walk_down: [0, 1, 2, 1], // Row 0
                walk_left: [3, 4, 5, 4], // Row 1
                walk_right: [6, 7, 8, 7], // Row 2
                walk_up: [9, 10, 11, 10]  // Row 3
            },
            currentAnim: 'walk_down',
            currentFrameIndex: 1,
            frameTimer: 0,
            frameDuration: 200 + Math.random() * 50
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
