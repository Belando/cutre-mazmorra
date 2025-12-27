import { useRef } from 'react';
import { TILE } from '@/data/constants';
import { SKILLS } from '@/data/skills';
import { canUseSkill } from '@/engine/systems/SkillSystem';
import { soundManager } from "@/engine/systems/SoundSystem";
import { Entity, Item, Player, Enemy } from '@/types';
import { DungeonState } from './useDungeon';
import { SpatialHash } from '@/engine/core/SpatialHash';

// Context interface required by this hook
export interface MovementActionsContext {
    player: Player;
    updatePlayer: (updates: Partial<Player>) => void;
    dungeon: DungeonState;
    setDungeon: React.Dispatch<React.SetStateAction<DungeonState>>;
    addMessage: (msg: string, type?: string) => void;
    updateMapFOV: (x: number, y: number) => void;
    spatialHash: SpatialHash;
    addItem: (item: Item) => boolean;
    effectsManager: any;
    selectedSkill: string | null;
    inventory: Item[];
    setInventory: React.Dispatch<React.SetStateAction<Item[]>>;
    initGame: (level: number, player?: Player | null) => void;
}

export function useMovementActions(
    context: MovementActionsContext,
    executeSkillAction: (skillId: string, target: Entity) => boolean,
    performAttack: (enemy: Entity, index: number) => Entity[],
    executeTurn: (playerState: Player, enemiesOverride?: Entity[] | null) => void
) {
    const {
        player, updatePlayer,
        dungeon, setDungeon,
        addMessage, updateMapFOV,
        spatialHash,
        addItem, effectsManager,
        selectedSkill,
    } = context;

    const openingDoors = useRef(new Set<string>());

    const move = (dx: number, dy: number) => {
        const nx = player.x + dx;
        const ny = player.y + dy;

        if (!dungeon.map || nx < 0 || nx >= dungeon.map[0].length || ny < 0 || ny >= dungeon.map.length) return;
        const targetTile = dungeon.map[ny][nx];
        if (targetTile === TILE.WALL) return;

        if (targetTile === TILE.DOOR) {
            const doorKey = `${nx},${ny}`;

            // Si la puerta ya se está abriendo, ignoramos la interacción (no repetimos sonido)
            if (openingDoors.current.has(doorKey)) return;

            openingDoors.current.add(doorKey);
            soundManager.play('door');
            addMessage("La puerta se está abriendo...", 'info');

            setTimeout(() => {
                setDungeon(prev => {
                    const newMap = [...prev.map];
                    newMap[ny] = [...newMap[ny]];
                    newMap[ny][nx] = TILE.DOOR_OPEN;
                    return { ...prev, map: newMap };
                });
                // Actualizamos FOV desde la posición donde se inició la acción (o la actual si no se movió)
                updateMapFOV(player.x, player.y);
                openingDoors.current.delete(doorKey);
            }, 1000);

            return;
        }

        const entitiesAtTarget = spatialHash.get(nx, ny);

        // Bloqueos
        if (entitiesAtTarget.some(e => e.type === 'chest')) {
            addMessage("Un cofre bloquea el camino (Usa 'E')", 'info');
            soundManager.play('error');
            return;
        }
        if (entitiesAtTarget.some(e => e.type === 'npc')) {
            addMessage("Un NPC bloquea el camino (Usa 'E')", 'info');
            soundManager.play('error');
            return;
        }

        const entitiesLeft = spatialHash.get(nx - 1, ny);
        const blacksmithLeft = entitiesLeft.find(e => e.type === 'npc') as any;
        if (blacksmithLeft && blacksmithLeft.ref && blacksmithLeft.ref.type === 'blacksmith') {
            addMessage("El horno está muy caliente, mejor no tocarlo.", 'info');
            return;
        }

        // Combate
        const enemyRef = entitiesAtTarget.find(e => e.type === 'enemy');
        if (enemyRef) {
            const enemyIdx = dungeon.enemies.findIndex(e => e.x === nx && e.y === ny);
            if (enemyIdx !== -1) {
                const enemy = dungeon.enemies[enemyIdx];
                if (selectedSkill && SKILLS[selectedSkill] && SKILLS[selectedSkill].type === 'melee') {
                    const cooldowns = player.skills?.cooldowns || {};
                    if (canUseSkill(selectedSkill, cooldowns)) {
                        const success = executeSkillAction(selectedSkill, enemy);
                        if (success) return;
                    }
                }
                const nextEnemiesState = performAttack(enemy, enemyIdx);
                executeTurn(player, nextEnemiesState);
                return;
            }
        }

        // --- MOVIMIENTO VÁLIDO ---
        spatialHash.move(player.x, player.y, nx, ny, { ...player, type: 'player' });
        updatePlayer({ x: nx, y: ny, lastMoveTime: Date.now() });

        soundManager.play('step');

        // Recoger Items
        const itemRef = entitiesAtTarget.find(e => e.type === 'item');
        if (itemRef) {
            const itemIdx = dungeon.items.findIndex(i => i.x === nx && i.y === ny);
            if (itemIdx !== -1) {
                const item = dungeon.items[itemIdx];
                if (item.category === 'currency') {
                    soundManager.play('pickup');
                    updatePlayer({ gold: player.gold + (item.value || 0) });
                    addMessage(`+${item.value} Oro`, 'pickup');
                    if (effectsManager.current) effectsManager.current.addText(nx, ny, `+${item.value}`, '#fbbf24');

                    const newItems = [...dungeon.items];
                    newItems.splice(itemIdx, 1);
                    setDungeon(prev => ({ ...prev, items: newItems }));
                } else {
                    const success = addItem(item);
                    if (success) {
                        soundManager.play('pickup');
                        if (effectsManager.current) effectsManager.current.addSparkles(nx, ny);
                        addMessage(`Recogiste: ${item.name}`, 'pickup');

                        const newItems = [...dungeon.items];
                        newItems.splice(itemIdx, 1);
                        setDungeon(prev => ({ ...prev, items: newItems }));
                    } else {
                        addMessage("Inventario lleno", 'info');
                    }
                }
            }
        }

        executeTurn({ ...player, x: nx, y: ny } as Player);
    };

    const descend = (goUp: boolean) => {
        if (goUp && dungeon.stairsUp && player.x === dungeon.stairsUp.x && player.y === dungeon.stairsUp.y) {
            if (dungeon.level > 1) {
                soundManager.play('stairs');
                context.initGame(dungeon.level - 1, player);
            }
            else addMessage("No puedes salir aún", 'info');
        } else if (!goUp && dungeon.stairs && player.x === dungeon.stairs.x && player.y === dungeon.stairs.y) {
            if (dungeon.enemies.some(e => (e as Enemy).isBoss)) addMessage("¡Mata al jefe primero!", 'info');
            else {
                soundManager.play('stairs');
                context.initGame(dungeon.level + 1, player);
            }
        } else {
            addMessage("No hay escaleras aquí", 'info');
        }
    };

    const moveFluid = (inputX: number, inputY: number) => {
        if (inputX === 0 && inputY === 0) return;

        const SPEED = 0.1; // Adjust based on feel
        const PLAYER_SIZE = 0.4; // Half-width (radius) for collision

        // Calculate next potential positions independently for X and Z (Y in 2D) to allow sliding
        let nextX = player.x + inputX * SPEED;
        let nextY = player.y + inputY * SPEED;

        // Helper to check collision at a point
        const isSolid = (x: number, y: number) => {
            const tx = Math.floor(x);
            const ty = Math.floor(y);
            if (!dungeon.map || ty < 0 || ty >= dungeon.map.length || tx < 0 || tx >= dungeon.map[0].length) return true;

            // Wall collision
            if (dungeon.map[ty][tx] === TILE.WALL) return true;

            // Door collision (closed)
            if (dungeon.map[ty][tx] === TILE.DOOR) {
                // If closed, trigger open but return TRUE (collision) so we stop and wait
                const doorKey = `${tx},${ty}`;
                if (!openingDoors.current.has(doorKey)) {
                    openingDoors.current.add(doorKey);
                    soundManager.play('door');
                    addMessage("La puerta se está abriendo...", 'info');

                    setTimeout(() => {
                        setDungeon(prev => {
                            const newMap = [...prev.map];
                            newMap[ty] = [...newMap[ty]];
                            newMap[ty][tx] = TILE.DOOR_OPEN;
                            return { ...prev, map: newMap };
                        });
                        // Recalculate FOV
                        updateMapFOV(player.x, player.y);
                        openingDoors.current.delete(doorKey);
                    }, 1000);
                }
                return true;
            }

            return false;
        };

        // Standard AABB vs Tilemap collision
        // Check X axis
        if (inputX !== 0) {
            const checkX = inputX > 0 ? nextX + PLAYER_SIZE : nextX - PLAYER_SIZE;
            if (isSolid(checkX, player.y - PLAYER_SIZE) || isSolid(checkX, player.y + PLAYER_SIZE)) {
                nextX = player.x; // Stop X movement
            }
        }

        // Check Y axis (Z in 3D world)
        if (inputY !== 0) {
            const checkY = inputY > 0 ? nextY + PLAYER_SIZE : nextY - PLAYER_SIZE;
            if (isSolid(nextX - PLAYER_SIZE, checkY) || isSolid(nextX + PLAYER_SIZE, checkY)) {
                nextY = player.y; // Stop Y movement
            }
        }

        // Apply visual updates
        updatePlayer({ x: nextX, y: nextY, lastMoveTime: Date.now() });

        // Trigger generic spatial updates (FOV, items)
        // Optimization: Only update FOV if tile changed
        if (Math.floor(nextX) !== Math.floor(player.x) || Math.floor(nextY) !== Math.floor(player.y)) {
            updateMapFOV(nextX, nextY);
        }

        // Check triggers (items, doors)
        // ... (simplified version of grid 'move' logic for triggers)
    };

    return { move, descend, moveFluid };
}
