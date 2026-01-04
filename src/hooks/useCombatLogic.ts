import { ENEMY_STATS, EnemyType } from '@/data/enemies';
import { ENTITY } from '@/data/constants';
import { SKILLS, SKILL_COLORS } from '@/data/skills';
import { generateMaterialDrop, generateBossDrop } from "@/engine/systems/CraftingSystem";
import { calculatePlayerStats, generateItem } from '@/engine/systems/ItemSystem';
import { calculateBuffBonuses, getSkillEffectiveStats, useSkill, canUseSkill } from "@/engine/systems/SkillSystem";
// import { soundManager } from '@/engine/systems/SoundSystem'; // DECOUPLED
import { events, GAME_EVENTS } from '@/engine/core/EventManager';
import { Item, Entity, Player, Enemy, Stats, SkillState } from '@/types';
import { DungeonState } from './useDungeon';

export interface CombatLogicContext {
    dungeon: DungeonState;
    setDungeon: React.Dispatch<React.SetStateAction<DungeonState>>;
    player: Player;
    updatePlayer: (updates: Partial<Player>) => void;
    gainExp: (amount: number) => void;
    setStats: React.Dispatch<React.SetStateAction<any>>;
    addMessage: (msg: string, type?: string) => void;
    addItem: (item: Item) => boolean;
    effectsManager: any;
    setSelectedSkill: React.Dispatch<React.SetStateAction<string | null>>;
    setGameWon: React.Dispatch<React.SetStateAction<boolean>>;
    spatialHash: any;
}

export function useCombatLogic({
    dungeon, setDungeon,
    player, updatePlayer, gainExp,
    setStats,
    addMessage, addItem,
    effectsManager,
    setSelectedSkill,
    setGameWon,
    spatialHash
}: CombatLogicContext) {

    // --- MANEJO DE MUERTE DE ENEMIGOS ---
    const handleEnemyDeath = (enemyIdx: number): Entity[] => {
        const enemy = dungeon.enemies[enemyIdx];
        if (!enemy) return dungeon.enemies;

        const info = ENEMY_STATS[enemy.type as EnemyType];
        const newEnemies = [...dungeon.enemies];
        newEnemies.splice(enemyIdx, 1);

        // --- JUICE: CORPSE SPAWNING ---
        const corpse = {
            x: enemy.x,
            y: enemy.y,
            type: enemy.type,
            rotation: Math.random() * 360,
            timestamp: Date.now()
        };

        setDungeon(prev => ({
            ...prev,
            enemies: newEnemies,
            corpses: [...(prev.corpses || []), corpse]
        }));
        gainExp(info.exp);
        addMessage(`${info.name} derrotado! +${info.exp} XP`, 'death');
        events.emit(GAME_EVENTS.ENEMY_DIED, { enemy });

        if (effectsManager.current) {
            effectsManager.current.addShake(2);
            effectsManager.current.addBlood(enemy.x, enemy.y);
        }

        if (spatialHash && spatialHash.remove) {
            spatialHash.remove(enemy.x, enemy.y, enemy);
        }

        const isBoss = (enemy as Enemy).isBoss || false;

        // 1. Drops
        const drops = isBoss ? generateBossDrop(enemy.type as any, dungeon.level) : generateMaterialDrop(enemy.type as EnemyType, dungeon.level);
        if (Math.random() < 0.15 || isBoss) {
            const lootItem = generateItem(dungeon.level) as Item | null;
            if (lootItem) drops.push(lootItem);
        }

        // 3. Procesar Drops
        drops.forEach(item => {
            const success = addItem(item);
            if (success) {
                addMessage(`Botín: ${(item as any).quantity || 1}x ${item.name}`, 'pickup');
                // events.emit(GAME_EVENTS.ITEM_PICKUP); // Explicit event vs Sound
            } else {
                addMessage(`Inventario lleno, no pudiste recoger ${item.name}`, 'info');
            }
        });

        if (isBoss) {
            setDungeon(prev => ({ ...prev, bossDefeated: true }));
            addMessage("¡Jefe de piso eliminado!", 'levelup');
            events.emit(GAME_EVENTS.LEVEL_UP); // Sound effect

            if (Number(enemy.type) === ENTITY.BOSS_ANCIENT_DRAGON) {
                setGameWon(true);
                addMessage("¡HAS DERROTADO AL DRAGÓN ANCESTRAL!", 'levelup');
            }
        }
        setStats((prev: any) => ({ ...prev, kills: prev.kills + 1 }));
        return newEnemies;
    };

    // --- EJECUCIÓN DE HABILIDADES ---
    const executeSkillAction = (skillId: string, targetEnemy: Entity | null = null) => {
        const skill = SKILLS[skillId];
        if (!skill) return false;

        if (!canUseSkill(skillId, player.skills?.cooldowns || {})) {
            addMessage(`¡${skill.name} no está lista!`, 'info');
            events.emit('SOUND_PLAY', 'error'); // Using direct sound event as fallback
            if (effectsManager.current) {
                effectsManager.current.addText(player.x, player.y, "CD", '#94a3b8', false, true);
            }
            return false;
        }

        const level = player.skills?.skillLevels?.[skillId] || 1;
        const { manaCost } = getSkillEffectiveStats(skill, level);

        if (manaCost > 0 && player.mp < manaCost) {
            addMessage(`¡Falta Maná! (Req: ${manaCost})`, 'info');
            events.emit('SOUND_PLAY', 'error');
            if (effectsManager.current) {
                effectsManager.current.addText(player.x, player.y, "No MP", '#60a5fa', false, true);
            }
            return false;
        }

        const pStats = calculatePlayerStats(player);
        const buffBonuses = calculateBuffBonuses(player.skills?.buffs || [], pStats);
        const effectiveStats: Stats = {
            ...pStats,
            attack: (pStats.attack || 0) + buffBonuses.attackBonus,
            defense: (pStats.defense || 0) + buffBonuses.defenseBonus
        };

        const res = useSkill(skillId, player, effectiveStats, targetEnemy, dungeon.enemies, dungeon.visible, dungeon.map);

        if (res.success) {
            if (skill.type === 'ranged' && targetEnemy) {
                const projColor = skill.projectileColor || '#fff';
                const projStyle = skill.projectileStyle || 'circle';

                if (effectsManager.current) {
                    effectsManager.current.addProjectile(player.x, player.y, targetEnemy.x, targetEnemy.y, projColor, projStyle);
                }
            }

            // Sound Event Emission
            // We could emit 'SKILL_USED' but SoundSystem isn't listening yet to dynamic payloads well
            // So we emit specific sounds or a generic skill event.
            // For now, let's map skillId to Event or generic sound
            if (skillId === 'fireball') events.emit('SOUND_PLAY', 'fireball');
            else if (skillId === 'heal') events.emit(GAME_EVENTS.PLAYER_HEAL);
            else events.emit('SOUND_PLAY', 'magic');

            let currentBuffs = player.skills?.buffs || [];
            if (['melee', 'ranged', 'aoe', 'ultimate'].includes(skill.type)) {
                currentBuffs = currentBuffs.filter(b => !b.invisible && !b.breaksOnAction);
            }

            if (res.buff) {
                currentBuffs = [...currentBuffs, res.buff];
                if (effectsManager.current) {
                    effectsManager.current.addSparkles(player.x, player.y, '#fbbf24');
                    effectsManager.current.addText(player.x, player.y, 'BUFF', '#fbbf24');
                }
            }

            const updates: Partial<Player> = {};
            if (skill.manaCost) updates.mp = Math.max(0, player.mp - skill.manaCost);
            if (skill.type === 'melee' && targetEnemy) {
                updates.lastAttackTime = Date.now();
                updates.lastAttackDir = { x: targetEnemy.x - player.x, y: targetEnemy.y - player.y };
            }

            const newSkills: SkillState = {
                ...player.skills,
                buffs: currentBuffs,
                cooldowns: { ...player.skills.cooldowns, [skillId]: res.cooldown || 0 }
            };
            updates.skills = newSkills;

            if (res.heal && effectsManager.current) {
                effectsManager.current.addText(player.x, player.y, `+${res.heal}`, '#22c55e');
                effectsManager.current.addSparkles(player.x, player.y, '#4ade80');
            }

            updatePlayer(updates);

            let currentEnemiesList = [...dungeon.enemies];
            if (res.damages && res.damages.length > 0) {
                let damageColor = SKILL_COLORS[skillId] || SKILL_COLORS.default;
                if (skillId === 'power_strike') damageColor = '#ffffff';

                res.damages.forEach(dmgInfo => {
                    const idx = currentEnemiesList.indexOf(dmgInfo.target as any);
                    if (idx !== -1) {
                        const enemy = currentEnemiesList[idx];
                        enemy.hp = (enemy.hp || 0) - dmgInfo.damage;

                        if (effectsManager.current) {
                            const explosionColor = skillId === 'fireball' ? '#f97316' : (skillId === 'power_strike' || skillId === 'shield_bash' ? '#ffffff' : '#a855f7');
                            effectsManager.current.addExplosion(enemy.x, enemy.y, explosionColor);
                            effectsManager.current.addBlood(enemy.x, enemy.y, '#dc2626');

                            const isCritical = dmgInfo.isCrit || false;
                            const finalColor = isCritical ? '#fef9c3' : damageColor;
                            const textToShow = isCritical ? `${dmgInfo.damage}!` : dmgInfo.damage.toString();

                            effectsManager.current.addText(enemy.x, enemy.y, textToShow, finalColor, isCritical, false, true);
                            if (isCritical) effectsManager.current.addShake(5);
                        }

                        if (dmgInfo.stun) {
                            enemy.stunned = dmgInfo.stun;
                            if (effectsManager.current) effectsManager.current.addStunEffect(enemy.x, enemy.y);
                        }
                        if (dmgInfo.slow) enemy.slowed = dmgInfo.slow;

                        if ((enemy.hp || 0) <= 0) {
                            currentEnemiesList = handleEnemyDeath(currentEnemiesList.indexOf(enemy));
                            // soundManager.play('kill'); // REMOVED: Handled inside handleEnemyDeath
                            if (effectsManager.current) effectsManager.current.addExplosion(enemy.x, enemy.y, '#52525b');
                        }
                    }
                });
            }

            addMessage(res.message || "Accion completada", 'player_damage');
            setSelectedSkill(null);
            setDungeon(prev => ({ ...prev, enemies: currentEnemiesList }));
            return true;
        } else {
            addMessage(res.message || "Fallo", 'info');
            return false;
        }
    };

    const performAttack = (targetEnemy: Entity, enemyIdx: number) => {
        // Basic Attack Logic
        const pStats = calculatePlayerStats(player);
        const damage = Math.max(1, Math.floor(pStats.attack || 1));

        targetEnemy.hp = (targetEnemy.hp || 0) - damage;

        if (effectsManager.current) {
            effectsManager.current.addExplosion(targetEnemy.x, targetEnemy.y, '#fff');
            effectsManager.current.addBlood(targetEnemy.x, targetEnemy.y);
            effectsManager.current.addText(targetEnemy.x, targetEnemy.y, damage.toString(), '#fff');
        }

        // soundManager.play('hit');
        events.emit(GAME_EVENTS.PLAYER_ATTACK); // Makes sound play 'hit' or 'swing'

        updatePlayer({ lastAttackTime: Date.now() });

        if ((targetEnemy.hp || 0) <= 0) {
            handleEnemyDeath(enemyIdx);
        }
    };

    return { handleEnemyDeath, executeSkillAction, performAttack };
}
