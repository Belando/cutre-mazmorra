import { useCallback } from 'react';
import { processEnemyTurn, EnemyAction } from "@/engine/systems/EnemyAI";
import { calculateEnemyDamage } from "@/engine/systems/CombatSystem";
import { calculatePlayerStats } from "@/engine/systems/ItemSystem";
import { ENEMY_STATS, EnemyType } from '@/data/enemies';
import { soundManager } from "@/engine/systems/SoundSystem";
import { SpatialHash } from "@/engine/core/SpatialHash";
import { DungeonState } from './useDungeon'; // We defined this earlier
import { Player } from './usePlayer'; // We defined this earlier

export interface ProcessTurnParams {
    dungeon: DungeonState;
    setDungeon: React.Dispatch<React.SetStateAction<DungeonState>>;
    player: Player;
    setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
    addMessage: (msg: string, type?: string) => void;
    setGameOver: React.Dispatch<React.SetStateAction<boolean>>;
    showFloatingText?: (x: number, y: number, text: string, color: string, floatUp?: boolean, isDamage?: boolean) => void;
    spatialHash: SpatialHash;
}

export function useTurnSystem() {

    const processTurn = useCallback(({
        dungeon, setDungeon,
        player, setPlayer,
        addMessage,
        setGameOver,
        showFloatingText,
        spatialHash
    }: ProcessTurnParams) => {

        // 1. RECONSTRUIR HASH
        // Antes de que los enemigos piensen, actualizamos el mapa espacial con el estado actual
        if (spatialHash) {
            spatialHash.rebuild({
                player,
                enemies: dungeon.enemies || [],
                chests: dungeon.chests || [],
                npcs: dungeon.npcs || [],
                items: dungeon.items || []
            });
        }

        // 2. IA Enemiga
        if (!dungeon || !dungeon.enemies) return;

        // Creamos una copia nueva para asegurar reactividad y no mutar el estado directamente durante el loop
        // Casting to any to avoid deep type issues with Entity clone if needed, but spreading is usually fine for shallow
        const newEnemies = dungeon.enemies.map(e => ({ ...e }));
        let playerHit = false;
        let totalDamage = 0;

        // @ts-ignore - calculatePlayerStats expects Entity, Player extends Entity but might have extra strictness
        const pStats = calculatePlayerStats(player);

        newEnemies.forEach(enemy => {
            // @ts-ignore
            const action = processEnemyTurn(
                enemy,
                player,
                newEnemies,
                dungeon.map,
                dungeon.visible,
                spatialHash
            );

            if (action.action && action.action.includes('attack')) {
                enemy.lastAttackTime = Date.now();
                enemy.lastAttackDir = {
                    x: player.x - enemy.x,
                    y: player.y - enemy.y
                };

                const isRanged = action.action === 'ranged_attack';
                const enemyStats = isRanged ? { ...enemy, attack: Math.floor((enemy.attack || 0) * 0.7) } : enemy;

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

                    // --- CAMBIO: Sonido específico de recibir daño ---
                    soundManager.play('enemy_hit');
                    // ------------------------------------------------

                    if (showFloatingText) showFloatingText(player.x, player.y, `${combatResult.damage}`, '#dc2626', false, true);
                }
            }
        });

        // Aplicar daño al jugador
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

        // Actualizar enemigos en el estado del dungeon
        setDungeon(prev => ({ ...prev, enemies: newEnemies }));

    }, []);

    return { processTurn };
}
