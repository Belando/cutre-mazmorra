import { soundManager } from "@/engine/systems/SoundSystem";
import {
    useItem as useItemLogic,
    equipItem as equipItemLogic,
    unequipItem as unequipItemLogic
} from '@/engine/systems/ItemSystem';
import { craftItem as craftItemLogic, upgradeItem as upgradeLogic } from '@/engine/systems/CraftingSystem';
import { useQuickSlot as processQuickSlot, assignToQuickSlot as assignQuickSlotLogic } from '@/components/ui/QuickSlots';
import { Player } from './usePlayer';
import { DungeonState } from './useDungeon';
import { Item } from '@/types';
import { EquipmentState } from './useInventory';

export interface InventoryActionsContext {
    player: Player;
    setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
    updatePlayer: (updates: Partial<Player>) => void;
    inventory: Item[];
    setInventory: React.Dispatch<React.SetStateAction<Item[]>>;
    equipment: EquipmentState;
    setEquipment: React.Dispatch<React.SetStateAction<EquipmentState>>;
    setDungeon: React.Dispatch<React.SetStateAction<DungeonState>>;
    addMessage: (msg: string, type?: string) => void;
    showFloatingText?: (x: number, y: number, text: string, color: string) => void;
    quickSlots: (Item | null)[];
    setQuickSlots: React.Dispatch<React.SetStateAction<(Item | null)[]>>;
    reorderInventory?: (from: number, to: number) => void;
}

export function useInventoryActions(context: InventoryActionsContext) {
    const {
        player, setPlayer, updatePlayer,
        inventory, setInventory,
        equipment, setEquipment,
        setDungeon,
        addMessage, showFloatingText,
        quickSlots, setQuickSlots,
    } = context;

    const useItem = (index: number) => {
        const newInv = [...inventory];
        // @ts-ignore - Player vs Entity mismatch in ItemSystem likely
        const res = useItemLogic(newInv, index, player);
        if (res.success) {
            setInventory(newInv);
            setPlayer({ ...player });
            // @ts-ignore
            res.effects.forEach(m => addMessage(m, 'heal'));
            if (showFloatingText) showFloatingText(player.x, player.y, "Used", '#fff');
            soundManager.play('heal');
        } else {
            addMessage(res.message || "No se puede usar", 'info');
        }
    };

    const equipItem = (idx: number) => {
        // @ts-ignore - equipItemLogic likely expects EquipmentState which is Record<string, Item> but here we have specific interface
        // We will assume it's compatible or cast
        const res = equipItemLogic(inventory, idx, equipment, player as any);
        if (res.success) {
            setInventory(res.newInventory);
            // @ts-ignore
            setEquipment(res.newEquipment);
            // @ts-ignore
            setPlayer(res.newPlayer);
            addMessage(res.message, 'pickup');
            soundManager.play('equip');
        } else {
            addMessage(res.message, 'info');
        }
    };

    const unequipItem = (slot: string) => {
        const res = unequipItemLogic(equipment, slot, inventory, player as any);
        if (res.success) {
            soundManager.play('equip');
            setInventory(res.newInventory);
            // @ts-ignore
            setEquipment(res.newEquipment);
            // @ts-ignore
            setPlayer(res.newPlayer);
            addMessage(res.message, 'info');
        } else {
            addMessage(res.message, 'info');
        }
    };

    const dropItem = (idx: number) => {
        const newInv = [...inventory];
        const item = newInv[idx];
        newInv.splice(idx, 1);
        setInventory(newInv);
        setDungeon(prev => ({
            ...prev,
            items: [...(prev.items || []), { ...item, x: player.x, y: player.y }]
        }));
        addMessage(`Soltaste ${item.name}`, 'info');
    };

    const craftItem = (key: string) => {
        const newInv = [...inventory];
        // @ts-ignore
        const res = craftItemLogic(key, newInv);
        if (res.success) {
            setInventory(newInv);
            addMessage(res.message, 'pickup');
            soundManager.play('equip');
        } else addMessage(res.message, 'info');
    };

    const upgradeItem = (slot: string) => {
        const newEq = { ...equipment };
        // @ts-ignore
        const item = newEq[slot] as Item | undefined;
        if (!item) return;

        const newInv = [...inventory];
        const res = upgradeLogic(item, newInv, player.gold);

        if (res.success) {
            setInventory(newInv);
            // @ts-ignore
            setEquipment(newEq);
            updatePlayer({ gold: player.gold - (res.goldCost || 0) });
            addMessage(res.message, 'levelup');
            soundManager.play('levelUp');
        } else addMessage(res.message, 'info');
    };

    const assignQuickSlot = (idx: number, itemId: string) => {
        // @ts-ignore
        setQuickSlots(prev => assignQuickSlotLogic(prev, idx, itemId));
    };

    const useQuickSlot = (idx: number) => {
        const newInv = [...inventory];
        // @ts-ignore
        const res = processQuickSlot(quickSlots, idx, newInv);
        if (res.success) {
            const useRes = useItemLogic(newInv, res.itemIndex, player);
            if (useRes.success) {
                setInventory(newInv); setPlayer({ ...player });
                addMessage("Objeto rápido usado", 'heal');
                soundManager.play('heal');
            }
        }
    };

    const reorderInventory = context.reorderInventory || ((startIndex: number, endIndex: number) => {
        const result = Array.from(inventory);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        setInventory(result);
    });

    return {
        useItem,
        equipItem,
        unequipItem,
        dropItem,
        craftItem,
        upgradeItem,
        assignQuickSlot,
        useQuickSlot,
        reorderInventory
    };
}
