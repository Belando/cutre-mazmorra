import { AIBehavior, AIContext, EnemyAction } from '../types';
import { moveToward, moveAway, getLateralMove, isTileFree } from '../AIUtils';
import { ENTITY } from '@/data/constants';
import { ENEMY_STATS, ENEMY_RANGED_INFO } from '@/data/enemies';
import { Enemy } from '@/types';
import { hasLineOfSight } from '@/engine/core/utils';

export class LichAI implements AIBehavior {
    evaluate(context: AIContext): EnemyAction {
        const { enemy, player, map, spatialHash, enemies } = context;
        const now = Date.now();
        const dist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
        const isEnraged = (enemy.hp) < (enemy.maxHp) * 0.5;

        // 0. ENRAGE SHOUT
        if (isEnraged && !enemy.hasEnraged) {
            enemy.hasEnraged = true;
            return { action: 'shout', message: '¡LA MUERTE OS ESPERA!', color: '#ef4444' };
        }

        // 1. SUMMONING (Lich summons Skeletons/Mages)
        const SUMMON_COOLDOWN = isEnraged ? 8000 : 12000;
        if (!enemy.lastSummonTime) enemy.lastSummonTime = now + 5000;

        if (now - (enemy.lastSummonTime || 0) > SUMMON_COOLDOWN) {
            let summoned = 0;
            const summonCount = 2;

            for (let i = 0; i < summonCount; i++) {
                // Random spot
                const dx = Math.floor(Math.random() * 5) - 2;
                const dy = Math.floor(Math.random() * 5) - 2;
                if (isTileFree(enemy.x + dx, enemy.y + dy, map, spatialHash)) {
                    const minionType = Math.random() < 0.3 ? ENTITY.ENEMY_MAGE : ENTITY.ENEMY_SKELETON;
                    const template = ENEMY_STATS[minionType];
                    const minion: Enemy = {
                        x: enemy.x + dx, y: enemy.y + dy,
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
                }
            }
            if (summoned > 0) {
                enemy.lastSummonTime = now;
                return { action: 'special_summon' };
            }
        }

        // 2. RANGED COMBAT
        const rangedInfo = ENEMY_RANGED_INFO[String(enemy.type)];
        if (rangedInfo && dist <= rangedInfo.range && hasLineOfSight(map, enemy.x, enemy.y, player.x, player.y)) {
            if (Math.random() < 0.7) return { action: 'ranged_attack', range: rangedInfo.range };
        }

        // 3. KITING MOVEMENT
        const optimalRange = 5;
        if (dist < optimalRange - 1) {
            const away = moveAway(enemy, player, map, spatialHash);
            if (away) return { action: 'move', x: away.x, y: away.y };
        } else if (dist > optimalRange + 1) {
            const toward = moveToward(enemy, player.x, player.y, map, spatialHash);
            if (toward) return { action: 'move', x: toward.x, y: toward.y };
        } else {
            const lateral = getLateralMove(enemy, player, map, spatialHash);
            if (lateral) return { action: 'move', x: lateral.x, y: lateral.y };
        }

        return { action: 'wait' };
    }
}
