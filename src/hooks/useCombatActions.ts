import { SKILLS } from '@/data/skills';
import { ENEMY_STATS, EnemyType } from '@/data/enemies';
import { soundManager } from "@/engine/systems/SoundSystem";
import { calculatePlayerHit } from '@/engine/systems/CombatSystem';
import { hasLineOfSight } from '@/engine/core/utils';
import { Player } from './usePlayer';
import { DungeonState } from './useDungeon';
import { Entity } from '@/types';

export interface CombatActionsContext {
    player: Player;
    updatePlayer: (updates: Partial<Player>) => void;
    dungeon: DungeonState;
    setDungeon: React.Dispatch<React.SetStateAction<DungeonState>>;
    addMessage: (msg: string, type?: string) => void;
    effectsManager: any; // Using any for GameEffects as it's JS
    executeSkillAction: (skillId: string, targetEnemy?: Entity | null) => boolean;
    handleEnemyDeath: (enemyIdx: number) => Entity[];
}

export function useCombatActions(context: CombatActionsContext) {
    const {
        player, updatePlayer,
        dungeon, setDungeon,
        addMessage, effectsManager,
        executeSkillAction: coreExecuteSkillAction,
        handleEnemyDeath
    } = context;

    const performAttack = (enemy: Entity, enemyIdx: number) => {
        const currentBuffs = player.skills?.buffs || [];
        const newBuffs = currentBuffs.filter(b => !b.invisible && !b.breaksOnAction);

        updatePlayer({
            lastAttackTime: Date.now(),
            lastAttackDir: { x: enemy.x - player.x, y: enemy.y - player.y },
            // @ts-ignore - Entity/Player structural differences if any, but Player should strict type skills
            skills: { ...player.skills, buffs: newBuffs }
        });

        const { damage, isCrit } = calculatePlayerHit(player, enemy);

        soundManager.play(isCrit ? 'critical' : 'attack');
        if (effectsManager.current) {
            effectsManager.current.addBlood(enemy.x, enemy.y);
            effectsManager.current.addText(enemy.x, enemy.y, damage.toString(), isCrit ? '#ef4444' : '#fff', isCrit);
            effectsManager.current.addShake(isCrit ? 10 : 3);
        }

        const nextEnemies = [...(dungeon.enemies || [])];
        nextEnemies[enemyIdx] = { ...enemy, hp: (enemy.hp || 0) - damage };

        const enemyName = ENEMY_STATS[enemy.type as EnemyType]?.name || 'Enemigo';
        addMessage(`Golpeas a ${enemyName}: ${damage}`, 'player_damage');

        if ((nextEnemies[enemyIdx].hp || 0) <= 0) {
            soundManager.play('kill');
            if (effectsManager.current) {
                effectsManager.current.addExplosion(enemy.x, enemy.y, '#52525b');
            }
            return handleEnemyDeath(enemyIdx);
        }

        return nextEnemies;
    };

    const executeSkillActionWrapper = (skillId: string, targetEnemy: Entity | null = null): boolean => {
        const skill = SKILLS[skillId];
        if (!skill) return false;

        // Logic for ranged skills auto-target if no target provided
        if (skill.type === 'ranged' && !targetEnemy) {
            let bestTarget: Entity | null = null;
            let minDist = Infinity;

            dungeon.enemies.forEach(e => {
                const dist = Math.abs(e.x - player.x) + Math.abs(e.y - player.y);
                if (
                    dist <= (skill.range || 5) &&
                    dungeon.visible[e.y]?.[e.x] &&
                    // @ts-ignore - map type mismatch number[][] vs something else? useDungeon defines map as number[][]
                    hasLineOfSight(dungeon.map, player.x, player.y, e.x, e.y)
                ) {
                    if (dist < minDist) {
                        minDist = dist;
                        bestTarget = e;
                    }
                }
            });

            if (bestTarget) {
                targetEnemy = bestTarget;
            } else {
                addMessage("¡No hay enemigos en rango!", 'info');
                soundManager.play('error'); // Sonido
                if (effectsManager.current) {
                    effectsManager.current.addText(player.x, player.y, "?", '#94a3b8');
                }
                return false;
            }
        }

        return coreExecuteSkillAction(skillId, targetEnemy);
    };

    return { performAttack, executeSkillAction: executeSkillActionWrapper };
}
