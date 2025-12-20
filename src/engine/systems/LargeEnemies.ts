import { LARGE_ENEMIES } from "@/data/enemies";

// Check if enemy is large
export function isLargeEnemy(enemyType: string): boolean {
    return LARGE_ENEMIES[Number(enemyType)] !== undefined;
}

export interface EnemySize {
    width: number;
    height: number;
    scale: number;
}

// Get enemy size info
export function getEnemySize(enemyType: string): EnemySize {
    const config = LARGE_ENEMIES[Number(enemyType)];
    if (config) {
        return {
            width: config.width,
            height: config.height,
            scale: config.scale || 1
        };
    }
    return { width: 1, height: 1, scale: 1 };
}

// NPC rendering moved to src/renderer/NPCRenderer.ts
