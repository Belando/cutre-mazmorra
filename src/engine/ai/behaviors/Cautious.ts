import { AIBehavior, AIContext, EnemyAction } from '../types';
import { moveToward, moveAway, getLateralMove, moveRandomly } from '../AIUtils';
import { ENEMY_STATS } from '@/data/enemies'; // Better source
import { hasLineOfSight } from '@/engine/core/utils';

export class CautiousBehavior implements AIBehavior {
    evaluate(context: AIContext): EnemyAction {
        const { enemy, player, map, spatialHash, visible } = context;
        const dist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
        const canSee = visible[enemy.y]?.[enemy.x];

        // Get ranged info directly from data
        const stats = ENEMY_STATS[Number(enemy.type)];
        const attack = stats?.attacks?.find(a => a.type === 'ranged' || a.type === 'magic');
        const maxRange = attack ? attack.range : 4;
        const optimalRange = Math.floor(maxRange * 0.7);

        if (dist <= 2) {
            const away = moveAway(enemy, player, map, spatialHash);
            if (away) return { action: 'move', x: away.x, y: away.y };
        }
        else if (dist < optimalRange && canSee) {
            if (Math.random() < 0.6) {
                const away = moveAway(enemy, player, map, spatialHash);
                if (away) return { action: 'move', x: away.x, y: away.y };
            }
        }
        else if (dist > optimalRange + 2 && canSee) {
            const toward = moveToward(enemy, player.x, player.y, map, spatialHash);
            if (toward) return { action: 'move', x: toward.x, y: toward.y };
        }
        else if (canSee && Math.random() < 0.2) {
            const lateral = getLateralMove(enemy, player, map, spatialHash);
            if (lateral) return { action: 'move', x: lateral.x, y: lateral.y };
        }

        // Ranged Attack Opportunity
        if (canSee && attack && dist <= maxRange && hasLineOfSight(map, enemy.x, enemy.y, player.x, player.y)) {
            return { action: 'ranged_attack', range: maxRange };
        }

        return { action: 'wait' };
    }
}
