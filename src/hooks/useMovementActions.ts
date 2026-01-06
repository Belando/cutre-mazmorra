import { useRef } from 'react';
import { TILE, ENTITY } from '@/data/constants';
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
    initGame: (level?: any, player?: Player | null, startLocation?: 'home' | 'dungeon') => void;
}

export function useMovementActions(
    context: MovementActionsContext,
    executeSkillAction: (skillId: string, target: Entity) => boolean,
    performAttack: (enemy: Entity, index: number) => Entity[]
) {
    const {
        player, updatePlayer,
        dungeon, setDungeon,
        addMessage, updateMapFOV,
        spatialHash,
        addItem, effectsManager,
        selectedSkill,
    } = context;

    const move = (dx: number, dy: number) => {
        // MOVEMENT COOLDOWN / SLOW LOGIC
        const now = Date.now();
        const baseSpeed = 150; // ms
        const moveDelay = (player.slowed || 0) > 0 ? 300 : baseSpeed;

        if (player.lastMoveTime && now - player.lastMoveTime < moveDelay) return;
        const nx = player.x + dx;
        const ny = player.y + dy;

        if (!dungeon.map || nx < 0 || nx >= dungeon.map[0].length || ny < 0 || ny >= dungeon.map.length) return;
        const targetTile = dungeon.map[ny][nx];
        if (targetTile === TILE.WALL) return;

        if (targetTile === TILE.DOOR) {
            addMessage("La puerta está cerrada. (Usa 'E' para abrir)", 'info');
            soundManager.play('error');
            return;
        }

        const entitiesAtTarget = spatialHash.get(nx, ny);

        // Bloqueos (Cofres, NPCs)
        if (entitiesAtTarget.some(e => e.type === 'chest' || e.type === 'npc')) {
            addMessage("Algo bloquea el camino (Usa 'E')", 'info');
            return;
        }

        // --- INTERACTIVITY CHECK (Crates/Barrels) ---
        // Check both direct entities grid and spatial hash for robustness
        const staticEntity = dungeon.entities[ny]?.[nx];
        const isDestructible = staticEntity === ENTITY.CRATE || staticEntity === ENTITY.BARREL;

        if (isDestructible) {
            // Attack the object!
            soundManager.play('hit');
            if (effectsManager.current) {
                effectsManager.current.addText(nx, ny, "Hit", "#e2e8f0");
                effectsManager.current.addExplosion(nx, ny, "#78350f"); // Wood color
            }

            // "Destroy" logic - remove from grid and potentially spawn item
            setDungeon(prev => {
                const newEntities = prev.entities.map(row => [...row]);
                newEntities[ny][nx] = ENTITY.NONE;

                // Chance for loot
                const dropChance = Math.random();
                let newItems = [...prev.items];
                let msg = "";

                if (dropChance < 0.3) {
                    // Drop Gold
                    const goldAmount = Math.floor(Math.random() * 5) + 1;
                    newItems.push({
                        id: `gold-crate-${nx}-${ny}`,
                        x: nx, y: ny,
                        name: 'Oro',
                        category: 'currency',
                        rarity: 'common',
                        value: goldAmount,
                        char: '$', color: '#ffD700'
                    });
                    msg = "¡Encontraste oro!";
                } else if (dropChance < 0.4) {
                    // Drop Potion
                    newItems.push({
                        id: `potion-crate-${nx}-${ny}`,
                        x: nx, y: ny,
                        name: 'Poción Menor',
                        category: 'potion',
                        rarity: 'common',
                        effect: 'heal',
                        value: 20,
                        char: '!', color: '#ef4444'
                    });
                    msg = "¡Una poción!";
                }

                if (msg) addMessage(msg, 'pickup');

                return { ...prev, entities: newEntities, items: newItems };
            });

            return; // Stop movement, we attacked
        }

        // Blocking Obstacles (Trees, Rocks, Gate, Invisible Blockers)
        const obstacle = entitiesAtTarget.find(e => ['tree', 'rock', 'dungeon_gate', 'blocker'].includes(String(e.type)));
        if (obstacle) {
            return;
        }

        const entitiesLeft = spatialHash.get(nx - 1, ny);
        const blacksmithLeft = entitiesLeft.find(e => e.type === 'npc') as any;
        if (blacksmithLeft && blacksmithLeft.ref && blacksmithLeft.ref.type === 'blacksmith') {
            addMessage("El horno está muy caliente, mejor no tocarlo.", 'info');
            return;
        }

        // Combate - Check SpatialHash AND direct enemies list for fail-safe
        // Safety check for entitiesAtTarget
        const safeEntities = entitiesAtTarget || [];
        const enemyRef = safeEntities.find(e => e.type === 'enemy');
        const enemyDirect = dungeon.enemies?.find(e => e.x === nx && e.y === ny);

        if (enemyRef || enemyDirect) {
            const enemy = enemyDirect || (enemyRef ? dungeon.enemies.find(e => e.id === enemyRef.id) : null);

            if (enemy) {
                const enemyIdx = dungeon.enemies.findIndex(e => e.id === enemy.id);
                if (selectedSkill && SKILLS[selectedSkill] && SKILLS[selectedSkill].type === 'melee') {
                    const cooldowns = player.skills?.cooldowns || {};
                    if (canUseSkill(selectedSkill, cooldowns)) {
                        const success = executeSkillAction(selectedSkill, enemy);
                        if (success) return;
                    }
                }
                const nextEnemiesState = performAttack(enemy, enemyIdx);
                setDungeon(prev => ({ ...prev, enemies: nextEnemiesState }));
                return;
            } else {
                // Fallback if we detected an enemy ref but couldn't find it in the list (Zombie ref?)
                // Prevent movement anyway
                return;
            }
        }

        // --- MOVIMIENTO VÁLIDO ---
        spatialHash.move(player.x, player.y, nx, ny, { ...player, type: 'player' });

        // Check for Traps (Spikes)
        // Spikes don't block, but hurt
        const tileEntity = dungeon.entities[ny]?.[nx];
        if (tileEntity === ENTITY.SPIKES) {
            soundManager.play('hit');
            // Damage player
            const damage = 5;
            updatePlayer({
                x: nx, y: ny,
                lastMoveTime: Date.now(),
                hp: Math.max(0, (player.hp || 100) - damage)
            });

            if (effectsManager.current) {
                effectsManager.current.addBlood(nx, ny);
                effectsManager.current.addText(nx, ny, `-${damage}`, "#dc2626", true);
                effectsManager.current.addShake(2);
            }
            addMessage("¡Pinchos! Te has herido.", 'damage');
        } else {
            // Normal Move
            updatePlayer({ x: nx, y: ny, lastMoveTime: Date.now() });
        }

        updateMapFOV(nx, ny); // Update FOV immediately on move

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
    };

    const descend = (goUp: boolean) => {
        if (goUp && dungeon.stairsUp && player.x === dungeon.stairsUp.x && player.y === dungeon.stairsUp.y) {
            if (dungeon.level > 1) {
                soundManager.play('stairs');
                // Going up from > 1 stays in dungeon
                context.initGame({ level: dungeon.level - 1, player, startLocation: 'dungeon' });
            } else if (dungeon.level === 1) {
                // Going up from level 1 goes to Home
                soundManager.play('stairs');
                context.initGame({ level: 0, player, startLocation: 'home' });
            }
            else addMessage("No puedes salir aún", 'info');
        } else if (!goUp && dungeon.stairs && player.x === dungeon.stairs.x && player.y === dungeon.stairs.y) {
            if (dungeon.enemies.some(e => (e as Enemy).isBoss)) addMessage("¡Mata al jefe primero!", 'info');
            else {
                soundManager.play('stairs');
                // Going down from Home (0) or Dungeon (>0) always targets 'dungeon'
                // If Home (0) -> Level 1
                // If Dungeon (L) -> Level L+1
                const nextLevel = dungeon.level === 0 ? 1 : dungeon.level + 1;
                context.initGame({ level: nextLevel, player, startLocation: 'dungeon' });
            }
        } else {
            addMessage("No hay escaleras aquí", 'info');
        }
    };

    return { move, descend };
}
