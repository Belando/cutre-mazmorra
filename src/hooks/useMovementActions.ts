import { TILE } from '@/data/constants';
import { SKILLS } from '@/data/skills';
import { canUseSkill } from '@/engine/systems/SkillSystem';
import { soundManager } from "@/engine/systems/SoundSystem";
import { Entity, Item } from '@/types';
import { DungeonState } from './useDungeon';
import { Player } from './usePlayer';
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
    effectsManager: any; // Using any for now as useGameEffects is JS
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
        inventory, setInventory // For gold pickup
    } = context;

    const move = (dx: number, dy: number) => {
        const nx = player.x + dx;
        const ny = player.y + dy;

        if (!dungeon.map || nx < 0 || nx >= dungeon.map[0].length || ny < 0 || ny >= dungeon.map.length) return;
        const targetTile = dungeon.map[ny][nx];
        if (targetTile === TILE.WALL) return;

        if (targetTile === TILE.DOOR) {
            const newMap = [...dungeon.map];
            newMap[ny] = [...newMap[ny]];
            newMap[ny][nx] = TILE.DOOR_OPEN;
            setDungeon(prev => ({ ...prev, map: newMap }));
            soundManager.play('door');
            addMessage("Abres la puerta.", 'info');
            updateMapFOV(player.x, player.y);
            return;
        }

        // Consultar Hash
        const entitiesAtTarget = spatialHash.get(nx, ny);

        // Bloqueos
        if (entitiesAtTarget.some(e => e.type === 'chest')) {
            addMessage("Un cofre bloquea el camino (Usa 'E')", 'info');
            soundManager.play('error'); // Sonido
            return;
        }
        if (entitiesAtTarget.some(e => e.type === 'npc')) {
            addMessage("Un NPC bloquea el camino (Usa 'E')", 'info');
            soundManager.play('error'); // Sonido
            return;
        }

        const entitiesLeft = spatialHash.get(nx - 1, ny);
        const blacksmithLeft = entitiesLeft.find(e => e.type === 'npc');
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
                // Assuming SKILLS is strictly typed or has index signature
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
        // Casting to Partial<Player> implicitly via object literal
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
            if (dungeon.enemies.some(e => e.isBoss)) addMessage("¡Mata al jefe primero!", 'info');
            else {
                soundManager.play('stairs');
                context.initGame(dungeon.level + 1, player);
            }
        } else {
            addMessage("No hay escaleras aquí", 'info');
        }
    };

    return { move, descend };
}
