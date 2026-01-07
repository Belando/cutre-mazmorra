import { soundManager } from "@/engine/systems/SoundSystem";
import { Item, Player, NPC } from '@/types';
import { ITEM_TEMPLATES } from '@/data/items';
import { SpatialHash } from '@/engine/core/SpatialHash';
import { DungeonState } from './useDungeon';

export interface InteractionActionsContext {
    player: Player;
    updatePlayer: (updates: Partial<Player>) => void;
    dungeon: DungeonState;
    setDungeon: React.Dispatch<React.SetStateAction<DungeonState>>;
    inventory: Item[];
    setInventory: React.Dispatch<React.SetStateAction<Item[]>>;
    addItem: (item: Item) => boolean;
    activeQuests: string[];
    setActiveQuests: React.Dispatch<React.SetStateAction<string[]>>;
    completedQuests: string[];
    setCompletedQuests: React.Dispatch<React.SetStateAction<string[]>>;
    gainExp: (amount: number) => void;
    addMessage: (msg: string, type?: string) => void;
    effectsManager: any;
    spatialHash: SpatialHash;
    addMaterial: (name: string, amount: number) => void;
    initGame: (level?: number, player?: Player | null, startLocation?: 'home' | 'dungeon') => void;
}

export interface InteractionResult {
    type: 'chest' | 'npc';
    data?: any;
}

export function useInteractionActions(context: InteractionActionsContext) {
    const {
        player, updatePlayer,
        dungeon, setDungeon,
        inventory, setInventory, addItem,
        activeQuests, setActiveQuests,
        completedQuests, setCompletedQuests,
        gainExp, addMessage, effectsManager,
        spatialHash, addMaterial,
        initGame
    } = context;

    const interact = (): InteractionResult | null => {
        if (!player) return null; // Safety check
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dx, dy] of dirs) {
            const tx = player.x + dx;
            const ty = player.y + dy;

            const entities = spatialHash.get(tx, ty);

            // 1. Interactuar con Cofre
            const chestRef = entities.find(e => e.type === 'chest');
            if (chestRef) {
                const chestIdx = dungeon.chests.findIndex(c => c.x === tx && c.y === ty);

                if (chestIdx !== -1) {
                    const chest = dungeon.chests[chestIdx];

                    if (chest.isOpen) {
                        addMessage("Este cofre ya está vacío.", 'info');
                        return null;
                    }
                    soundManager.play('chest');
                    if (effectsManager.current) effectsManager.current.addSparkles(tx, ty, '#fbbf24');
                    const item = chest.item;

                    if (item) {
                        const added = addItem(item);
                        if (added) {
                            addMessage(`Encontraste: ${item.name}`, 'pickup');

                            let floatText = "ITEM";
                            if (item.category === 'weapon') floatText = "⚔️";
                            else if (item.category === 'armor') floatText = "🛡️";
                            else if (item.category === 'potion') floatText = "🧪";
                            else if (item.category === 'accessory') floatText = "💍";
                            else if (item.category === 'currency') floatText = "💰";
                            else if (item.symbol && typeof item.symbol === 'string') floatText = item.symbol;

                            if (effectsManager.current) effectsManager.current.addText(tx, ty, floatText, '#fff');
                            setDungeon(prev => ({
                                ...prev,
                                chests: prev.chests.map((c, i) => i === chestIdx ? { ...c, isOpen: true } : c)
                            }));
                        } else {
                            addMessage("Inventario lleno.", 'info');
                            return null;
                        }
                    } else {
                        addMessage("El cofre estaba vacío...", 'info');
                        setDungeon(prev => ({
                            ...prev,
                            chests: prev.chests.map((c, i) => i === chestIdx ? { ...c, isOpen: true } : c)
                        }));
                    }
                    return { type: 'chest' };
                }
            }


            // 1.5. Interactuar con Puerta (NEW)
            const mapTile = dungeon.map?.[ty]?.[tx];
            if (mapTile === 3) { // TILE.DOOR
                soundManager.play('door');
                addMessage("Abriste la puerta.", 'info');

                setDungeon(prev => {
                    const newMap = [...prev.map];
                    newMap[ty] = [...newMap[ty]];
                    newMap[ty][tx] = 5; // TILE.DOOR_OPEN
                    return { ...prev, map: newMap };
                });
                return null;
            }

            // 2. Interactuar con NPC
            const npcRef = entities.find(e => e.type === 'npc') as NPC | undefined;
            if (npcRef) {
                soundManager.play('speech');
                return { type: 'npc', data: npcRef.ref };
            }

            // 3. Interactuar con Recursos (Home Base)
            const treeRef = entities.find(e => e.type === 'tree');
            if (treeRef) {
                // Chop Tree
                soundManager.play('hit');
                if (effectsManager.current) {
                    effectsManager.current.addSparkles(tx, ty, '#22c55e');
                    effectsManager.current.addText(tx, ty, "+1 Madera", '#22c55e');
                }

                const woodItem: Item = {
                    id: `wood-${Date.now()}-${Math.random()}`,
                    ...ITEM_TEMPLATES.wood,
                    rarity: 'common',
                    quantity: 1
                } as Item;

                addItem(woodItem);

                // Legacy support if needed, but better to use inventory
                addMaterial('wood', 1);

                addMessage("Has conseguido Madera!", "pickup");
                if (spatialHash) spatialHash.remove(tx, ty, treeRef);

                // Persist removal (Tree)
                if (dungeon.entities && dungeon.entities[ty] && dungeon.entities[ty][tx] === 200) { // 200 is TREE
                    const newEntities = [...dungeon.entities];
                    newEntities[ty] = [...newEntities[ty]];
                    newEntities[ty][tx] = 0;
                    setDungeon(prev => ({ ...prev, entities: newEntities }));
                }
                return null;
            }

            const rockRef = entities.find(e => e.type === 'rock');
            if (rockRef) {
                // Mine Rock
                soundManager.play('hit');
                if (effectsManager.current) {
                    effectsManager.current.addSparkles(tx, ty, '#94a3b8');
                    effectsManager.current.addText(tx, ty, "+1 Piedra", '#94a3b8');
                }

                const stoneItem: Item = {
                    id: `stone-${Date.now()}-${Math.random()}`,
                    ...ITEM_TEMPLATES.stone,
                    rarity: 'common',
                    quantity: 1
                } as Item;

                addItem(stoneItem);
                addMaterial('stone', 1);

                addMessage("Has conseguido Piedra!", "pickup");
                if (spatialHash) spatialHash.remove(tx, ty, rockRef);

                // Persist removal (Rock)
                if (dungeon.entities && dungeon.entities[ty] && dungeon.entities[ty][tx] === 201) { // 201 is ROCK
                    const newEntities = [...dungeon.entities];
                    newEntities[ty] = [...newEntities[ty]];
                    newEntities[ty][tx] = 0;
                    setDungeon(prev => ({ ...prev, entities: newEntities }));
                }
                return null;
            }

            const plantRef = entities.find(e => e.type === 'plant');
            if (plantRef) {
                // Gather Plant
                soundManager.play('pickup'); // Soft sound
                if (effectsManager.current) {
                    effectsManager.current.addSparkles(tx, ty, '#f472b6');
                    effectsManager.current.addText(tx, ty, "+1 Hierba", '#f472b6');
                }

                const herbItem: Item = {
                    id: `herb-${Date.now()}-${Math.random()}`,
                    ...ITEM_TEMPLATES.herb,
                    rarity: 'common',
                    quantity: 1
                } as Item;

                addItem(herbItem);

                addMessage("Has recolectado Hierbas!", "pickup");

                if (spatialHash) spatialHash.remove(tx, ty, plantRef);

                // Persist removal in dungeon state
                if (dungeon.entities && dungeon.entities[ty] && dungeon.entities[ty][tx] === 204) { // 204 is PLANT
                    const newEntities = [...dungeon.entities];
                    newEntities[ty] = [...newEntities[ty]];
                    newEntities[ty][tx] = 0; // Remove plant (Set to NONE)

                    setDungeon(prev => ({
                        ...prev,
                        entities: newEntities
                    }));
                }

                return null;
            }

            const gateRef = entities.find(e => e.type === 'dungeon_gate');
            if (gateRef) {
                // Enter Dungeon
                soundManager.play('stairs');
                addMessage("Entrando a la Mazmorra...", "info");
                try {
                    // Use initGame to properly switch scenes and generate dungeon
                    // @ts-ignore - bypassing strict type check for now to allow object override pattern
                    initGame({ level: 1, startLocation: 'dungeon' });
                } catch (err) {
                    console.error("CRASH during initGame:", err);
                    addMessage("Error al entrar a la mazmorra", "error");
                }
                return null;
            }

            // NEW: Breakables (Crates/Barrels)
            const crateRef = entities.find(e => e.type === 'crate');
            if (crateRef) {
                soundManager.play('break'); // You might need to add a 'break' sound or reuse 'hit'
                if (effectsManager.current) {
                    effectsManager.current.addDebris(tx, ty, '#fbbf24', 5); // Wood chips
                    effectsManager.current.addText(tx, ty, "¡Roto!", '#ffffff');
                }

                // Random loot chance?
                if (Math.random() < 0.3) {
                    const goldAmount = Math.floor(Math.random() * 5) + 1;
                    updatePlayer({ gold: player.gold + goldAmount });
                    addMessage(`Encontraste ${goldAmount} oro en la caja.`, 'pickup');
                }

                if (spatialHash) spatialHash.remove(tx, ty, crateRef);

                // Persist removal
                if (dungeon.entities && dungeon.entities[ty] && dungeon.entities[ty][tx] === 206) { // CRATE
                    const newEntities = [...dungeon.entities];
                    newEntities[ty] = [...newEntities[ty]];
                    newEntities[ty][tx] = 0;
                    setDungeon(prev => ({ ...prev, entities: newEntities }));
                }
                return null;
            }

            const barrelRef = entities.find(e => e.type === 'barrel');
            if (barrelRef) {
                soundManager.play('break');
                if (effectsManager.current) {
                    effectsManager.current.addDebris(tx, ty, '#9ca3af', 5); // Grey/Wood chips
                    effectsManager.current.addText(tx, ty, "¡Roto!", '#ffffff');
                }

                if (Math.random() < 0.3) {
                    // Potion logic or just gold
                    const goldAmount = Math.floor(Math.random() * 5) + 1;
                    updatePlayer({ gold: player.gold + goldAmount });
                    addMessage(`Encontraste ${goldAmount} oro en el barril.`, 'pickup');
                }

                if (spatialHash) spatialHash.remove(tx, ty, barrelRef);

                // Persist removal
                if (dungeon.entities && dungeon.entities[ty] && dungeon.entities[ty][tx] === 207) { // BARREL
                    const newEntities = [...dungeon.entities];
                    newEntities[ty] = [...newEntities[ty]];
                    newEntities[ty][tx] = 0;
                    setDungeon(prev => ({ ...prev, entities: newEntities }));
                }
                return null;
            }
        }


        // 4. Interactuar con Escaleras (Stairs)
        // Check current tile
        const currentTile = dungeon.map?.[player.y]?.[player.x];

        if (currentTile === 2) { // TILE.STAIRS (Down)
            if (dungeon.enemies.some((e: any) => e.isBoss)) {
                addMessage("¡Mata al jefe primero!", 'info');
            } else {
                soundManager.play('stairs');
                const nextLevel = dungeon.level === 0 ? 1 : dungeon.level + 1;
                initGame(nextLevel, player, 'dungeon');
                return null;
            }
        } else if (currentTile === 4) { // TILE.STAIRS_UP (Up)
            soundManager.play('stairs');
            if (dungeon.level > 1) {
                initGame(dungeon.level - 1, player, 'dungeon');
            } else {
                initGame(1, player, 'home');
            }
            return null;
        }

        addMessage("No hay nada aquí para interactuar.", 'info');
        return null;
    };

    const buyItem = (item: Item) => {
        const price = (item as any).price || item.value || 0;

        if (player.gold >= price) {
            const success = addItem(item);
            if (success) {
                updatePlayer({ gold: player.gold - price });
                addMessage(`Comprado: ${item.name}`, 'pickup');
                soundManager.play('pickup');
            } else {
                addMessage("Inventario lleno", 'info');
            }
        } else {
            addMessage("Oro insuficiente", 'info');
        }
    };

    const sellItem = (index: number, price: number) => {
        const newInv = [...inventory];
        const item = newInv[index];
        if (!item) return;
        newInv.splice(index, 1);
        setInventory(newInv);
        updatePlayer({ gold: player.gold + price });
        addMessage(`Vendido: ${item.name} (+${price} oro)`, 'pickup');
        soundManager.play('pickup');
    };

    interface Quest {
        id: string;
        name: string;
        reward?: {
            gold?: number;
            exp?: number;
            item?: Item;
        };
    }

    const acceptQuest = (quest: Quest) => {
        if (!activeQuests.includes(quest.id) && !completedQuests.includes(quest.id)) {
            setActiveQuests(prev => [...prev, quest.id]);
            addMessage(`Misión aceptada: ${quest.name}`, 'info');
            soundManager.play('buff');
        }
    };

    const completeQuest = (quest: Quest) => {
        let rewardText = "";
        if (quest.reward) {
            if (quest.reward.gold) {
                updatePlayer({ gold: player.gold + quest.reward.gold });
                rewardText += ` +${quest.reward.gold} Oro`;
            }
            if (quest.reward.exp) {
                gainExp(quest.reward.exp);
                rewardText += ` +${quest.reward.exp} XP`;
            }
            if (quest.reward.item) {
                addItem(quest.reward.item);
                rewardText += ` +${quest.reward.item.name}`;
            }
        }
        setActiveQuests(prev => prev.filter(q => q !== quest.id));
        setCompletedQuests(prev => [...prev, quest.id]);
        addMessage(`¡Misión completada!${rewardText}`, 'levelup');
        soundManager.play('levelUp');
    };

    return { interact, buyItem, sellItem, acceptQuest, completeQuest };
}
