import { AIBehavior, AIContext, EnemyAction } from '../types';
import { moveToward } from '../AIUtils';
import { AI_CONFIG } from '@/data/ai';

export class AggressiveBehavior implements AIBehavior {
    evaluate(context: AIContext): EnemyAction {
        const { enemy, player, map, spatialHash, visible } = context;
        const dist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
        const canSee = visible[enemy.y]?.[enemy.x];

        // 1. Attack if close
        if (dist === 1) {
            return { action: 'melee_attack' };
        }

        // 2. Move towards player
        if (canSee || dist <= AI_CONFIG.PATHFINDING_LIMIT) {
            const nextPos = moveToward(enemy, player.x, player.y, map, spatialHash);
            if (nextPos) {
                return { action: 'move', x: nextPos.x, y: nextPos.y };
            }
        }

        return { action: 'wait' };
    }
}
