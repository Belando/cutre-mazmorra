import { soundManager } from "@/engine/systems/SoundSystem";
import { Item, Player, NPC } from '@/types';
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
        spatialHash
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

            // 2. Interactuar con NPC
            const npcRef = entities.find(e => e.type === 'npc') as NPC | undefined;
            if (npcRef) {
                soundManager.play('speech');
                return { type: 'npc', data: npcRef.ref };
            }
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
