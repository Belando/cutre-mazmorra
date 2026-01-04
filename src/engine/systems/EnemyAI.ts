import { Entity, Enemy, Player, ISpatialHash, Point } from '@/types';
import { AI_CONFIG, AI_BEHAVIORS } from '@/data/ai';
import { ENTITY } from '@/data/constants';
import { AIContext, EnemyAction, AIBehavior } from '@/engine/ai/types';
import { AggressiveBehavior } from '@/engine/ai/behaviors/Aggressive';
import { CautiousBehavior } from '@/engine/ai/behaviors/Cautious';
import { GoblinKingAI } from '@/engine/ai/bosses/GoblinKingAI';
import { LichAI } from '@/engine/ai/bosses/LichAI';

// Re-export utils for compatibility if needed (legacy imports)
export { isTileFree } from '@/engine/ai/AIUtils';

// Strategy Cache (Behaviors are stateless strategies)
const behaviors: Record<string, AIBehavior> = {
    [AI_BEHAVIORS.AGGRESSIVE]: new AggressiveBehavior(),
    [AI_BEHAVIORS.CAUTIOUS]: new CautiousBehavior(),
    // [AI_BEHAVIORS.PACK]: new AggressiveBehavior(), // Fallback for now, implement Pack later
    // [AI_BEHAVIORS.SUPPORT]: new CautiousBehavior(), // Fallback
};

// Boss Strategies
const bossBehaviors: Record<string, AIBehavior> = {
    [ENTITY.BOSS_GOBLIN_KING]: new GoblinKingAI(),
    [ENTITY.BOSS_LICH]: new LichAI(),
};

export function getEnemyBehavior(enemyType: number | string): string {
    // Keep this mapping or move to data
    const type = typeof enemyType === 'string' ? parseInt(enemyType) : enemyType;
    if (type >= 100) return AI_BEHAVIORS.BOSS;

    const mapping: Record<number, string> = {
        2: AI_BEHAVIORS.PACK,
        3: AI_BEHAVIORS.CAUTIOUS,
        7: AI_BEHAVIORS.AMBUSH,
        10: AI_BEHAVIORS.CAUTIOUS,
        15: AI_BEHAVIORS.SUPPORT,
        19: AI_BEHAVIORS.CAUTIOUS,
    };
    return mapping[type] || AI_BEHAVIORS.AGGRESSIVE;
}

export function processEnemyTurn(
    enemy: Enemy,
    player: Player,
    enemies: Enemy[],
    map: number[][],
    visible: boolean[][],
    spatialHash: ISpatialHash
): EnemyAction {

    // 1. Culling / Sleep
    const dist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
    const isActive = enemy.isBoss ? dist < AI_CONFIG.BOSS_ACTIVATION_DISTANCE : dist < AI_CONFIG.ACTIVATION_DISTANCE;

    if (!isActive) return { action: 'sleep' };

    // 2. Status Effects
    if ((enemy.stunned || 0) > 0) {
        enemy.stunned = (enemy.stunned || 0) - 1;
        enemy.lastAction = 'stunned';
        return { action: 'stunned' };
    }
    if ((enemy.poisoned || 0) > 0) {
        const poisonDmg = enemy.poisonDamage || 3;
        enemy.hp = (enemy.hp || 10) - poisonDmg;
        enemy.poisoned = (enemy.poisoned || 0) - 1;
        if ((enemy.hp || 0) <= 0) return { action: 'died_poison', damage: poisonDmg };
    }

    // 3. Resolve Strategy
    const context: AIContext = { enemy, player, enemies, map, visible, spatialHash };

    // Boss Override
    if (enemy.isBoss && bossBehaviors[enemy.type]) {
        const result = bossBehaviors[enemy.type].evaluate(context);
        handleMoveUpdate(enemy, result, spatialHash);
        return result;
    }

    // Standard Behavior
    const behaviorKey = getEnemyBehavior(enemy.type);

    // Default fallback to Aggressive if specific Pack/Support implementations missing
    let strategy = behaviors[behaviorKey] || behaviors[AI_BEHAVIORS.AGGRESSIVE];

    // Simple Mapping for now while we refactor Pack/Support fully
    if (behaviorKey === AI_BEHAVIORS.PACK || behaviorKey === AI_BEHAVIORS.AMBUSH) strategy = behaviors[AI_BEHAVIORS.AGGRESSIVE];
    if (behaviorKey === AI_BEHAVIORS.SUPPORT) strategy = behaviors[AI_BEHAVIORS.CAUTIOUS];

    const result = strategy.evaluate(context);

    handleMoveUpdate(enemy, result, spatialHash);

    return result;
}

function handleMoveUpdate(enemy: Enemy, result: EnemyAction, spatialHash: ISpatialHash) {
    if (result.action === 'move' && result.x !== undefined && result.y !== undefined) {
        // Move in SpatialHash
        spatialHash.move(enemy.x, enemy.y, result.x, result.y, enemy);

        // Update Entity
        enemy.x = result.x;
        enemy.y = result.y;
        enemy.lastMoveTime = Date.now();
    }
}
