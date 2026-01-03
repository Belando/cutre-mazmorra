import { useCallback, useRef } from 'react';
import { processEnemyTurn } from "@/engine/systems/EnemyAI";
import { calculateEnemyDamage } from "@/engine/systems/CombatSystem";
import { calculatePlayerStats } from "@/engine/systems/ItemSystem";
import { ENEMY_STATS, EnemyType } from '@/data/enemies';
import { soundManager } from "@/engine/systems/SoundSystem";
import { SpatialHash } from "@/engine/core/SpatialHash";
import { DungeonState } from './useDungeon';
import { Player, Enemy } from '@/types';

export interface UpdateGameStateParams {
    dungeon: DungeonState;
    setDungeon: React.Dispatch<React.SetStateAction<DungeonState>>;
    player: Player;
    setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
    addMessage: (msg: string, type?: string) => void;
    setGameOver: React.Dispatch<React.SetStateAction<boolean>>;
    showFloatingText?: (x: number, y: number, text: string, color: string, floatUp?: boolean, isDamage?: boolean) => void;
    spatialHash: SpatialHash;
}

import { GAME_CONFIG } from '@/data/config';

const ENEMY_BASE_SPEED = GAME_CONFIG.ENTITIES.ENEMY_BASE_SPEED; // ms

export function useRealTimeSystem() {

    // Use a ref to track if an update is already in progress to avoid overlapping ticks
    const isUpdating = useRef(false);

    const updateGameState = useCallback(({
        dungeon, setDungeon,
        player, setPlayer,
        addMessage,
        setGameOver,
        showFloatingText,
        spatialHash
    }: UpdateGameStateParams) => {

        if (isUpdating.current) return;
        if (!dungeon || !dungeon.enemies) return;

        isUpdating.current = true;
        const now = Date.now();
        let playerHit = false;
        let totalDamage = 0;
        let enemiesUpdated = false;

        // Optimization: Check if ANY enemy needs update before cloning
        // But we need to clone to modify anyway if we find one.
        // We'll iterate first.

        // Clone enemies to avoid direct mutation of state
        // We only map if we need to, but for simplicity/safety we map here.
        // Optimization: We could filter for 'active' enemies first, but map is cheap for < 50 enemies.
        const newEnemies = dungeon.enemies.map(e => ({ ...e }));

        // @ts-ignore
        const pStats = calculatePlayerStats(player);

        newEnemies.forEach(enemy => {
            // Check speed/cooldown
            const speed = enemy.stats?.speed || ENEMY_BASE_SPEED;
            const lastTime = enemy.lastActionTime || 0;

            if (now - lastTime < speed) return;

            // Enemy is ready to act
            enemiesUpdated = true;
            enemy.lastActionTime = now;

            // @ts-ignore
            const action = processEnemyTurn(
                enemy,
                player,
                newEnemies, // Pass the NEW array so they see updated positions of allies
                dungeon.map,
                dungeon.visible,
                spatialHash
            );

            if (action.action && action.action.includes('attack')) {
                enemy.lastAttackTime = now;
                enemy.lastAttackDir = {
                    x: player.x - enemy.x,
                    y: player.y - enemy.y
                };

                const isRanged = action.action === 'ranged_attack';
                const currentAttack = enemy.stats?.attack || 0;
                const enemyStats = isRanged
                    ? { ...enemy, stats: { ...enemy.stats, attack: Math.floor(currentAttack * 0.7) } }
                    : enemy;

                const combatResult = calculateEnemyDamage(
                    enemyStats,
                    pStats,
                    // @ts-ignore
                    player.skills?.buffs || []
                );

                const enemyName = ENEMY_STATS[enemy.type as EnemyType]?.name || 'Enemigo';

                if (combatResult.evaded) {
                    addMessage(`Esquivaste a ${enemyName}`, 'info');
                    if (showFloatingText) showFloatingText(player.x, player.y, "Miss", '#94a3b8');
                } else {
                    totalDamage += combatResult.damage;
                    playerHit = true;
                    addMessage(`${enemyName} te golpea: -${combatResult.damage} HP`, 'enemy_damage');
                    soundManager.play('enemy_hit');
                    if (showFloatingText) showFloatingText(player.x, player.y, `${combatResult.damage}`, '#dc2626', false, true);

                    // APPLY STATUS EFFECTS
                    const eKey = ENEMY_STATS[enemy.type as EnemyType]?.renderKey;

                    // Spider: Slow
                    if (eKey === 'spider' && Math.random() < 0.3) {
                        // @ts-ignore
                        setPlayer(prev => prev ? ({ ...prev, slowed: 3 }) : null);
                        addMessage("¡La araña te ha ralentizado!", 'warning');
                        if (showFloatingText) showFloatingText(player.x, player.y, "SLOW", '#a855f7');
                    }

                    // Mage/Demon/Dragon: Burn (Poison logic)
                    if ((eKey === 'skeleton_mage' || eKey === 'demon' || eKey === 'dragon') && Math.random() < 0.4) {
                        // @ts-ignore
                        setPlayer(prev => prev ? ({ ...prev, poisoned: 4, poisonDamage: 2 }) : null); // 2 dmg per sec for 4 sec
                        addMessage("¡Estás ardiendo!", 'warning');
                        if (showFloatingText) showFloatingText(player.x, player.y, "BURN", '#f97316');
                    }

                    // Cultist: Mark/Curse (Reduce MP or just visual for now)
                    if (eKey === 'cultist' && Math.random() < 0.3) {
                        addMessage("¡Sientes una maldición!", 'warning');
                        // Just drain MP immediately
                        // @ts-ignore
                        setPlayer(prev => prev ? ({ ...prev, mp: Math.max(0, (prev.mp || 0) - 2) }) : null);
                    }
                }
            } else if (action.action === 'heal' && action.targetId) {
                const target = newEnemies.find(e => e.id === action.targetId);
                if (target) {
                    enemy.lastActionTime = now; // Add cooldown

                    const healAmount = 15;
                    // @ts-ignore
                    target.hp = Math.min((target.hp || 0) + healAmount, target.maxHp || 10);
                    // @ts-ignore
                    addMessage(`${ENEMY_STATS[enemy.type]?.name || 'Enemigo'} cura a ${ENEMY_STATS[target.type]?.name}!`, 'warning');
                    if (showFloatingText) {
                        showFloatingText(enemy.x, enemy.y, "HEAL!", '#22c55e');
                        showFloatingText(target.x, target.y, `+${healAmount}`, '#22c55e', true);
                        // @ts-ignore
                        if (dungeon.effectsManager) dungeon.effectsManager.addSparkles(target.x, target.y, '#22c55e');
                    }
                }
            }
        });

        // Apply Player Damage
        if (playerHit) {
            setPlayer(prev => {
                if (!prev) return null;
                const newHp = (prev.hp || 0) - totalDamage;
                if (newHp <= 0) {
                    setGameOver(true);
                    addMessage("Has muerto...", 'death');
                    soundManager.play('gameOver');
                }
                return { ...prev, hp: newHp };
            });
        }

        // Apply Enemy Updates
        if (enemiesUpdated) {
            setDungeon(prev => ({ ...prev, enemies: newEnemies }));
        }

        isUpdating.current = false;

    }, []);

    return { updateGameState };
}
