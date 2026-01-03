import { findPath } from '@/engine/core/pathfinding';
import { ENEMY_RANGED_INFO, ENEMY_STATS } from '@/data/enemies';
import { hasLineOfSight } from '@/engine/core/utils';
import { TILE, ENTITY } from '@/data/constants';
import { Entity, Enemy, Player, Point, ISpatialHash } from '@/types';

import { AI_CONFIG, AI_BEHAVIORS } from '@/data/ai';

export interface EnemyAction {
    action: string;
    x?: number;
    y?: number;
    range?: number;
    damage?: number;
}

// Asignar comportamiento según tipo de enemigo
export function getEnemyBehavior(enemyType: number | string): string {
    const type = typeof enemyType === 'string' ? parseInt(enemyType) : enemyType;
    if (type >= 100) return AI_BEHAVIORS.BOSS;

    const behaviors: Record<number, string> = {
        2: AI_BEHAVIORS.PACK,        // Rata
        3: AI_BEHAVIORS.CAUTIOUS,    // Murciélago
        7: AI_BEHAVIORS.AMBUSH,      // Araña
        10: AI_BEHAVIORS.CAUTIOUS,   // Espectro
        13: AI_BEHAVIORS.PACK,       // Slime
        14: AI_BEHAVIORS.PACK,       // Lobo
        15: AI_BEHAVIORS.CAUTIOUS,   // Cultista
        17: AI_BEHAVIORS.CAUTIOUS,   // Vampiro
        18: AI_BEHAVIORS.AMBUSH,     // Mímico
    };

    return behaviors[type] || AI_BEHAVIORS.AGGRESSIVE;
}

export function isRangedEnemy(enemyType: number | string): boolean {
    const type = String(enemyType);
    return !!ENEMY_RANGED_INFO[type];
}

export function getEnemyRangedInfo(enemyType: number | string): any | null {
    const type = String(enemyType);
    return ENEMY_RANGED_INFO[type] || null;
}

export function getEnemyRange(enemyType: number | string): number {
    const type = String(enemyType);
    return ENEMY_RANGED_INFO[type]?.range || 1;
}

// --- FUNCIONES DE MOVIMIENTO (OPTIMIZADAS CON SPATIAL HASH) ---

// Comprueba si una casilla está libre de obstáculos
function isTileFree(x: number, y: number, map: number[][], spatialHash: ISpatialHash): boolean {
    // 1. Límites del mapa
    if (y < 0 || y >= map.length || x < 0 || x >= map[0].length) return false;

    // 2. Obstáculos estáticos (Muros/Puertas Cerradas)
    const tile = map[y][x];
    const isWalkable = tile === TILE.FLOOR || tile === TILE.STAIRS || tile === TILE.STAIRS_UP || tile === TILE.DOOR_OPEN;

    if (!isWalkable) return false;

    // 3. Entidades dinámicas (Consulta O(1) al Hash)
    // isBlocked devuelve true si hay Player, Enemy, Chest o NPC
    if (spatialHash.isBlocked(x, y)) return false;

    return true;
}

// Calcular posición de flanqueo
/**
 * Calculates a flanking position for pack enemies.
 * Tries to find a spot opposite to an existing ally relative to the player.
 */
function getFlankingPosition(player: Player, allies: Enemy[], map: number[][], spatialHash: ISpatialHash): Point | null {
    const directions = [
        { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
        { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
        { dx: 1, dy: 1 }, { dx: -1, dy: 1 },
        { dx: 1, dy: -1 }, { dx: -1, dy: -1 },
    ];

    // Posiciones ocupadas por aliados (para no intentar ir donde ya hay uno)
    const occupiedPositions = new Set(allies.map(a => `${a.x},${a.y}`));

    for (const dir of directions) {
        const pos = { x: player.x + dir.dx, y: player.y + dir.dy };

        // Usamos isTileFree con el hash
        if (isTileFree(pos.x, pos.y, map, spatialHash) && !occupiedPositions.has(`${pos.x},${pos.y}`)) {
            // Es posición de flanqueo si está opuesta a otro aliado
            const isFlank = allies.some(ally => {
                const dx = Math.sign(player.x - ally.x);
                const dy = Math.sign(player.y - ally.y);
                return dir.dx === -dx || dir.dy === -dy;
            });
            if (isFlank) return pos;
        }
    }
    return null;
}

// Moverse lejos del objetivo (Huida/Cautela)
function moveAway(enemy: Entity, player: Entity, map: number[][], spatialHash: ISpatialHash): Point | null {
    const dx = Math.sign(enemy.x - player.x);
    const dy = Math.sign(enemy.y - player.y);

    // Intentar moverse en dirección opuesta
    const moves = [
        { x: enemy.x + dx, y: enemy.y },
        { x: enemy.x, y: enemy.y + dy },
        { x: enemy.x + dx, y: enemy.y + dy },
    ];

    for (const move of moves) {
        if (isTileFree(move.x, move.y, map, spatialHash)) return move;
    }
    return null;
}

// Movimiento lateral (Strafe)
function getLateralMove(enemy: Entity, player: Entity, map: number[][], spatialHash: ISpatialHash): Point | null {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;

    // Direcciones perpendiculares
    const lateralMoves = [
        { x: enemy.x - dy, y: enemy.y + dx },
        { x: enemy.x + dy, y: enemy.y - dx },
    ];

    if (Math.random() < 0.5) lateralMoves.reverse();

    for (const move of lateralMoves) {
        if (isTileFree(move.x, move.y, map, spatialHash)) return move;
    }
    return null;
}

// Movimiento aleatorio (cuando no te ven)
function moveRandomly(enemy: Entity, map: number[][], spatialHash: ISpatialHash, player: Entity): Point | null {
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    const randomDir = dirs[Math.floor(Math.random() * dirs.length)];
    const target = { x: enemy.x + randomDir[0], y: enemy.y + randomDir[1] };

    // Evitar pisar al jugador explícitamente si es invisible
    if (target.x === player.x && target.y === player.y) return null;

    if (isTileFree(target.x, target.y, map, spatialHash)) {
        return target;
    }
    return null;
}

// Mover hacia el objetivo usando lógica Híbrida (A* o Directa)
function moveToward(enemy: Entity, targetX: number, targetY: number, map: number[][], spatialHash: ISpatialHash): Point | null {
    const dist = Math.abs(enemy.x - targetX) + Math.abs(enemy.y - targetY);

    // OPTIMIZACIÓN 1: INTELIGENTE (Solo si está cerca)
    if (dist <= AI_CONFIG.PATHFINDING_LIMIT) {
        // 1. Intentar encontrar el camino ideal con A*
        const nextStep = findPath(enemy.x, enemy.y, targetX, targetY, map);

        // Si A* encuentra un camino
        if (nextStep) {
            // 1a. CAMINO LIBRE: Verificamos entidades con el Hash
            if (isTileFree(nextStep.x, nextStep.y, map, spatialHash)) {
                return nextStep;
            }

            // 1b. FLOCKING: Si el paso óptimo está bloqueado por otra entidad, buscar adyacente
            const neighbors = [
                { x: enemy.x + 1, y: enemy.y },
                { x: enemy.x - 1, y: enemy.y },
                { x: enemy.x, y: enemy.y + 1 },
                { x: enemy.x, y: enemy.y - 1 }
            ];

            const validMoves = neighbors.filter(pos => isTileFree(pos.x, pos.y, map, spatialHash));

            if (validMoves.length > 0) {
                // Ordenamos las opciones por distancia al objetivo
                validMoves.sort((a, b) => {
                    const distA = Math.abs(a.x - targetX) + Math.abs(a.y - targetY);
                    const distB = Math.abs(b.x - targetX) + Math.abs(b.y - targetY);
                    return distA - distB;
                });
                return validMoves[0];
            }
        }
    }

    // OPTIMIZACIÓN 2: TONTA (Movimiento directo si está lejos o A* falla)
    const dx = Math.sign(targetX - enemy.x);
    const dy = Math.sign(targetY - enemy.y);

    const simpleMoves: Point[] = [];
    // Priorizar el eje más largo para que el movimiento se vea más natural
    if (Math.abs(targetX - enemy.x) > Math.abs(targetY - enemy.y)) {
        if (dx !== 0) simpleMoves.push({ x: enemy.x + dx, y: enemy.y });
        if (dy !== 0) simpleMoves.push({ x: enemy.x, y: enemy.y + dy });
    } else {
        if (dy !== 0) simpleMoves.push({ x: enemy.x, y: enemy.y + dy });
        if (dx !== 0) simpleMoves.push({ x: enemy.x + dx, y: enemy.y });
    }

    for (const move of simpleMoves) {
        if (isTileFree(move.x, move.y, map, spatialHash)) {
            return move;
        }
    }

    return null; // No se puede mover
}

/**
 * Core AI Logic: Determines what the enemy does this turn.
 * Handled status effects (stun/slow/poison), cooldowns, and movement behavior.
 * @param enemy The enemy entity
 * @param player The player entity
 * @param enemies List of all enemies (for pack behaviors)
 * @param map Terrain map
 * @param visible Visibility map (FoV)
 * @param spatialHash Spatial hash for optimizing collision checks
 */
export function processEnemyTurn(enemy: Enemy, player: Player, enemies: Enemy[], map: number[][], visible: boolean[][], spatialHash: ISpatialHash): EnemyAction {

    // OPTIMIZACIÓN 3: CULLING (IA DORMIDA)
    // Si el enemigo está muy lejos, retornamos inmediatamente.
    // Excepción: Los Bosses siempre están activos si están a menos de 40 casillas.
    const dist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
    const isActive = enemy.isBoss ? dist < AI_CONFIG.BOSS_ACTIVATION_DISTANCE : dist < AI_CONFIG.ACTIVATION_DISTANCE;

    if (!isActive) {
        return { action: 'sleep' };
    }

    // 1. Estados alterados
    if ((enemy.stunned || 0) > 0) {
        enemy.stunned = (enemy.stunned || 0) - 1;
        enemy.lastAction = 'stunned';
        return { action: 'stunned' };
    }

    if ((enemy.slowed || 0) > 0) {
        enemy.slowedTurn = !enemy.slowedTurn;
        enemy.slowed = (enemy.slowed || 0) - 1;
        if (enemy.slowedTurn) {
            enemy.lastAction = 'slowed';
            return { action: 'slowed' };
        }
    }

    if ((enemy.poisoned || 0) > 0) {
        const poisonDmg = enemy.poisonDamage || 3;
        enemy.hp = (enemy.hp || 10) - poisonDmg;
        enemy.poisoned = (enemy.poisoned || 0) - 1;
        if ((enemy.hp || 0) <= 0) return { action: 'died_poison', damage: poisonDmg };
    }

    // 2. Comportamiento
    const behavior = getEnemyBehavior(enemy.type);
    const canSee = visible[enemy.y]?.[enemy.x];

    const isPlayerInvisible = player.skills?.buffs?.some(b => b.invisible) || false;

    if (isPlayerInvisible) {
        const newPos = moveRandomly(enemy, map, spatialHash, player);
        if (newPos) {
            // ACTUALIZAR HASH AL MOVER
            spatialHash.move(enemy.x, enemy.y, newPos.x, newPos.y, { ...enemy, type: 'enemy' });
            enemy.x = newPos.x;
            enemy.y = newPos.y;
            enemy.lastMoveTime = Date.now();
            return { action: 'wander', x: newPos.x, y: newPos.y };
        }
        return { action: 'wait_confused' };
    }

    // Ataque cuerpo a cuerpo
    if (dist === 1) return { action: 'melee_attack' };

    // Ataque a distancia
    const rangedInfo = getEnemyRangedInfo(enemy.type);
    if (rangedInfo && dist <= rangedInfo.range && dist > 1) {
        // Para disparar, necesitamos comprobar línea de visión real
        if (hasLineOfSight(map, enemy.x, enemy.y, player.x, player.y)) {
            const shouldShoot = !rangedInfo.preferMelee || Math.random() < 0.3 || dist > 3;
            if (shouldShoot) return { action: 'ranged_attack', range: rangedInfo.range };
        }
    }

    // 3. Movimiento Estándar
    let newPos: Point | null = null;

    switch (behavior) {
        case AI_BEHAVIORS.AGGRESSIVE:
            if (canSee || dist <= AI_CONFIG.PATHFINDING_LIMIT) {
                newPos = moveToward(enemy, player.x, player.y, map, spatialHash);
            }
            break;

        case AI_BEHAVIORS.CAUTIOUS:
            const ranged = getEnemyRangedInfo(enemy.type);
            const optimalRange = ranged ? Math.floor(ranged.range * 0.7) : 4;

            if (dist <= 2) {
                newPos = moveAway(enemy, player, map, spatialHash);
            } else if (dist < optimalRange && canSee) {
                if (Math.random() < 0.6) newPos = moveAway(enemy, player, map, spatialHash);
            } else if (dist > optimalRange + 2 && canSee) {
                newPos = moveToward(enemy, player.x, player.y, map, spatialHash);
            } else if (canSee && Math.random() < 0.2) {
                const lateralMove = getLateralMove(enemy, player, map, spatialHash);
                if (lateralMove) newPos = lateralMove;
            }
            break;

        case AI_BEHAVIORS.PACK:
            if (canSee || dist <= 10) {
                // Optimización: Solo buscar aliados cercanos para no iterar todo el array
                const allies = enemies.filter(e =>
                    e !== enemy &&
                    Math.abs(e.x - enemy.x) + Math.abs(e.y - enemy.y) < AI_CONFIG.FLANKING_RANGE
                );

                if (allies.length > 0) {
                    const flankPos = getFlankingPosition(player, allies, map, spatialHash);
                    if (flankPos) {
                        newPos = moveToward(enemy, flankPos.x, flankPos.y, map, spatialHash);
                    } else {
                        newPos = moveToward(enemy, player.x, player.y, map, spatialHash);
                    }
                } else {
                    newPos = moveToward(enemy, player.x, player.y, map, spatialHash);
                }
            }
            break;

        case AI_BEHAVIORS.AMBUSH:
            if (dist <= AI_CONFIG.AMBUSH_RANGE) { // Rango reducido de emboscada
                newPos = moveToward(enemy, player.x, player.y, map, spatialHash);
            }
            break;

        case AI_BEHAVIORS.BOSS:
            if (canSee || dist <= 15) {
                if (enemy.type === ENTITY.BOSS_GOBLIN_KING || enemy.type === 'goblin_king') {
                    // Goblin King Specific Logic
                    return processGoblinKingTurn(enemy, player, enemies, map, spatialHash);
                }

                if (dist <= 2 && Math.random() < 0.3) {
                    newPos = moveAway(enemy, player, map, spatialHash);
                } else {
                    newPos = moveToward(enemy, player.x, player.y, map, spatialHash);
                }
            }
            break;
    }

    if (newPos) {
        // ACTUALIZAR HASH AL MOVER
        spatialHash.move(enemy.x, enemy.y, newPos.x, newPos.y, { ...enemy, type: 'enemy' });

        enemy.x = newPos.x;
        enemy.y = newPos.y;
        enemy.lastMoveTime = Date.now();
        return { action: 'move', x: newPos.x, y: newPos.y };
    }

    return { action: 'wait' };
}

function processGoblinKingTurn(boss: Enemy, player: Player, enemies: Enemy[], map: number[][], spatialHash: ISpatialHash): EnemyAction {
    const now = Date.now();
    const dist = Math.abs(boss.x - player.x) + Math.abs(boss.y - player.y);
    const isEnraged = (boss.hp / boss.maxHp) < 0.3;

    // 1. SUMMONING (Every 10s roughly, starts on CD)
    const SUMMON_COOLDOWN = isEnraged ? 8000 : 12000;
    if (!boss.lastSummonTime) boss.lastSummonTime = now + 2000; // Delay first summon slightly

    if (now - boss.lastSummonTime > SUMMON_COOLDOWN) {
        // Try to summon
        const minionType = Math.random() < 0.7 ? ENTITY.ENEMY_GOBLIN : ENTITY.ENEMY_RAT;
        const summonCount = isEnraged ? 2 : 1;
        let summoned = 0;

        for (let i = 0; i < summonCount; i++) {
            // Find free spot
            const spawnPoints = [
                { x: boss.x + 1, y: boss.y }, { x: boss.x - 1, y: boss.y },
                { x: boss.x, y: boss.y + 1 }, { x: boss.x, y: boss.y - 1 },
                { x: boss.x + 1, y: boss.y + 1 }, { x: boss.x - 1, y: boss.y - 1 },
                { x: boss.x + 1, y: boss.y - 1 }, { x: boss.x - 1, y: boss.y + 1 }
            ];

            // Shuffle
            spawnPoints.sort(() => Math.random() - 0.5);

            for (const sp of spawnPoints) {
                if (isTileFree(sp.x, sp.y, map, spatialHash)) {
                    // Create Minion
                    const template = ENEMY_STATS[minionType];
                    const minion: Enemy = {
                        x: sp.x, y: sp.y,
                        id: Date.now() + Math.random(),
                        type: minionType,
                        name: template.name,
                        level: boss.level,
                        hp: template.hp,
                        maxHp: template.hp,
                        mp: 0, maxMp: 0,
                        stats: { attack: template.attack, defense: template.defense, speed: 1000 },
                        lastActionTime: now + 1000 // Summon sickness (1s delay)
                    };

                    // Add to lists
                    enemies.push(minion);
                    spatialHash.add(minion.x, minion.y, { ...minion, type: 'enemy' });
                    summoned++;
                    break; // One per loop iteration
                }
            }
        }

        if (summoned > 0) {
            boss.lastSummonTime = now;
            boss.lastAction = 'summon';
            return { action: 'special_summon' }; // This string can be used for speech bubbles later
        }
    }

    // 2. ENRAGED AGGRESSION
    if (dist <= 1) {
        return { action: 'melee_attack', damage: isEnraged ? (boss.stats.attack || 0) * 1.5 : undefined };
    }

    // 3. MOVEMENT
    if (isEnraged) {
        // Relentless pursuit
        const move = moveToward(boss, player.x, player.y, map, spatialHash);
        if (move) {
            spatialHash.move(boss.x, boss.y, move.x, move.y, { ...boss, type: 'enemy' });
            boss.x = move.x; boss.y = move.y;
            boss.lastMoveTime = now;
            return { action: 'move', x: move.x, y: move.y };
        }
    } else {
        // Tactical movement (keep minions between boss and player?)
        // For now, standard aggressive
        const move = moveToward(boss, player.x, player.y, map, spatialHash);
        if (move) {
            spatialHash.move(boss.x, boss.y, move.x, move.y, { ...boss, type: 'enemy' });
            boss.x = move.x; boss.y = move.y;
            boss.lastMoveTime = now;
            return { action: 'move', x: move.x, y: move.y };
        }
    }

    return { action: 'wait' };
}

