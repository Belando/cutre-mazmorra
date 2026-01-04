import { ENEMY_STATS, EnemyType } from '@/data/enemies';
import { ENTITY } from '@/data/constants';
import { SKILLS, SKILL_COLORS } from '@/data/skills';
import { generateMaterialDrop, generateBossDrop } from "@/engine/systems/CraftingSystem";
import { calculatePlayerStats, generateItem } from '@/engine/systems/ItemSystem';
import { calculateBuffBonuses, getSkillEffectiveStats, useSkill, canUseSkill } from "@/engine/systems/SkillSystem";
import { calculateMeleeDamage } from "@/engine/systems/CombatSystem";
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

    const getMessage = (code: string, params: Record<string, any> = {}): string => {
        const MESSAGES: Record<string, string> = {
            'OUT_OF_RANGE': '¡Fuera de alcance!',
            'NO_LOS': '¡Sin línea de visión!',
            'NO_MANA': '¡Falta Maná! (Req: {cost})',
            'COOLDOWN': '¡{skill} no está lista!',
            'PICKUP': 'Botín: {qty}x {item}',
            'INVENTORY_FULL': 'Inventario lleno, no pudiste recoger {item}',
            'DEATH': '{name} derrotado! +{exp} XP',
            'BOSS_DEATH': '¡Jefe de piso eliminado!',
            'GAME_WON': '¡HAS DERROTADO AL DRAGÓN ANCESTRAL!',
            'ACTION_COMPLETED': 'Acción completada',
            'FAILURE': 'Fallo',
            'NO_TARGET': '¡Sin objetivo!',
            'NO_ENEMIES_NEAR': '¡Sin enemigos cerca!',
            'TOO_FAR': '¡Muy lejos!',
            'NO_VISIBLE_ENEMIES': '¡Sin enemigos visibles!',
            'CRITICAL_HIT': '¡CRÍTICO!',
            'HIT': '¡Golpe!',
            // Skill System codes
            'SKILL_NOT_FOUND': 'Habilidad no encontrada',
            'ALREADY_LEARNED': 'Ya aprendida',
            // Fallbacks for dynamic messages from SkillSystem if unmapped
        };

        let msg = MESSAGES[code] || code;
        Object.entries(params).forEach(([key, val]) => {
            msg = msg.replace(`{${key}}`, String(val));
        });

        // Handle complex dynamic codes from system (e.g. LEARNED:Fireball)
        if (code.startsWith('LEARNED:')) return `¡Aprendiste ${code.split(':')[1]}!`;
        if (code.startsWith('SKILL_IMPROVED:')) {
            const parts = code.split(':');
            return `${parts[1]} subió a nivel ${parts[2]}!`;
        }
        if (code.startsWith('EVOLVED:')) return `¡Evolucionaste a ${code.split(':')[1]}!`;

        return msg;
    };

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
        addMessage(getMessage('DEATH', { name: info.name, exp: info.exp }), 'death');
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
                addMessage(getMessage('PICKUP', { qty: (item as any).quantity || 1, item: item.name }), 'pickup');
                // events.emit(GAME_EVENTS.ITEM_PICKUP); // Explicit event vs Sound
            } else {
                addMessage(getMessage('INVENTORY_FULL', { item: item.name }), 'info');
            }
        });

        if (isBoss) {
            setDungeon(prev => ({ ...prev, bossDefeated: true }));
            addMessage(getMessage('BOSS_DEATH'), 'levelup');
            events.emit(GAME_EVENTS.LEVEL_UP); // Sound effect

            if (Number(enemy.type) === ENTITY.BOSS_ANCIENT_DRAGON) {
                setGameWon(true);
                addMessage(getMessage('GAME_WON'), 'levelup');
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
            addMessage(getMessage('COOLDOWN', { skill: skill.name }), 'info');
            events.emit('SOUND_PLAY', 'error');
            if (effectsManager.current) {
                effectsManager.current.addText(player.x, player.y, "CD", '#94a3b8', false, true);
            }
            return false;
        }

        const level = player.skills?.skillLevels?.[skillId] || 1;
        const { manaCost } = getSkillEffectiveStats(skill, level);

        if (manaCost > 0 && player.mp < manaCost) {
            addMessage(getMessage('NO_MANA', { cost: manaCost }), 'info');
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

                            const isCritical = dmgInfo.isCritical || false;
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

            addMessage(getMessage(res.message || 'ACTION_COMPLETED'), 'player_damage');
            setSelectedSkill(null);
            setDungeon(prev => ({ ...prev, enemies: currentEnemiesList }));
            return true;
        } else {
            addMessage(getMessage(res.message || 'FAILURE'), 'info');
            return false;
        }
    };

    const performAttack = (targetEnemy: Entity, enemyIdx: number) => {
        // 1. Calculate Damage using CombatSystem (Tags, Defense, Crits)
        const pStats = calculatePlayerStats(player);
        const { damage, isCritical } = calculateMeleeDamage(player, targetEnemy, pStats);

        // 2. Clone Enemies to update state immutably
        const newEnemies = [...dungeon.enemies];
        const updatedEnemy = { ...newEnemies[enemyIdx] };
        updatedEnemy.hp = Math.max(0, (updatedEnemy.hp || 0) - damage);
        updatedEnemy.lastAttackTime = Date.now(); // Feedback visual

        newEnemies[enemyIdx] = updatedEnemy;

        // 3. Visual Effects
        if (effectsManager.current) {
            const color = isCritical ? '#fef9c3' : '#fff'; // Yellow for crit
            effectsManager.current.addExplosion(updatedEnemy.x, updatedEnemy.y, color);
            effectsManager.current.addBlood(updatedEnemy.x, updatedEnemy.y);

            const text = isCritical ? `${damage}!` : damage.toString();
            effectsManager.current.addText(updatedEnemy.x, updatedEnemy.y, text, color, isCritical);

            if (isCritical) effectsManager.current.addShake(3);
        }

        // 4. Sound
        events.emit(GAME_EVENTS.PLAYER_ATTACK);
        updatePlayer({ lastAttackTime: Date.now() });

        // 5. Update State or Handle Death
        if (updatedEnemy.hp <= 0) {
            // handleEnemyDeath expects index from current dungeon state, which aligns with our clone
            // But handleEnemyDeath clones internally too. 
            // It's safer to just call handleEnemyDeath if dead, OR setDungeon if alive.
            // Note: handleEnemyDeath uses 'dungeon.enemies' from closure. 
            // If we assume handleEnemyDeath handles the state update, we just call it.
            handleEnemyDeath(enemyIdx);
        } else {
            // Alive: Update Dungeon State
            setDungeon(prev => ({ ...prev, enemies: newEnemies }));
        }
    };

    return { handleEnemyDeath, executeSkillAction, performAttack };
}
