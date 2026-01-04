import { AIBehavior, AIContext, EnemyAction } from '../types';
import { moveToward, isTileFree } from '../AIUtils';
import { ENTITY } from '@/data/constants';
import { ENEMY_STATS } from '@/data/enemies';
import { Enemy } from '@/types';

export class GoblinKingAI implements AIBehavior {
    evaluate(context: AIContext): EnemyAction {
        const { enemy, player, map, spatialHash, enemies } = context;
        const now = Date.now();
        const dist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
        const isEnraged = (enemy.hp / enemy.maxHp) < 0.3;

        // 1. SUMMONING
        const SUMMON_COOLDOWN = isEnraged ? 8000 : 12000;
        if (!enemy.lastSummonTime) enemy.lastSummonTime = now + 2000;

        if (now - (enemy.lastSummonTime || 0) > SUMMON_COOLDOWN) {
            let summoned = 0;
            const summonCount = isEnraged ? 2 : 1;
            const minionType = Math.random() < 0.7 ? ENTITY.ENEMY_GOBLIN : ENTITY.ENEMY_RAT;
            const template = ENEMY_STATS[minionType];

            for (let i = 0; i < summonCount; i++) {
                const spawnPoints = [
                    { x: enemy.x + 1, y: enemy.y }, { x: enemy.x - 1, y: enemy.y },
                    { x: enemy.x, y: enemy.y + 1 }, { x: enemy.x, y: enemy.y - 1 }
                ].sort(() => Math.random() - 0.5);

                for (const sp of spawnPoints) {
                    if (isTileFree(sp.x, sp.y, map, spatialHash)) {
                        const minion: Enemy = {
                            x: sp.x, y: sp.y,
                            id: Date.now() + Math.random(),
                            type: minionType,
                            name: template.name,
                            level: enemy.level,
                            hp: template.hp, maxHp: template.hp,
                            mp: 0, maxMp: 0,
                            stats: {
                                attack: template.attack, defense: template.defense, speed: 1000,
                                hp: template.hp, maxHp: template.hp, mp: 0, maxMp: 0,
                                magicAttack: 0, magicDefense: 0, critChance: 0, evasion: 0
                            },
                        };
                        enemies.push(minion);
                        spatialHash.add(minion.x, minion.y, minion);
                        summoned++;
                        break;
                    }
                }
            }

            if (summoned > 0) {
                enemy.lastSummonTime = now;
                return { action: 'shout', message: '¡A MÍ, MIS SÚBDITOS!', color: '#4ade80' };
            }
        }

        // 2. ENRAGED AGGRESSION
        if (dist <= 1) {
            return { action: 'melee_attack', damage: isEnraged ? enemy.stats.attack * 1.5 : undefined };
        }

        // 3. MOVEMENT
        const nextPos = moveToward(enemy, player.x, player.y, map, spatialHash);
        if (nextPos) {
            return { action: 'move', x: nextPos.x, y: nextPos.y };
        }

        return { action: 'wait' };
    }
}
