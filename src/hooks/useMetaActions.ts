import { soundManager } from "@/engine/systems/SoundSystem";
import { saveGame as saveSystem, loadGame as loadSystem } from '@/engine/systems/SaveSystem';
import { Player } from './usePlayer';
import { DungeonState } from './useDungeon';
import { Item } from '@/types';
import { EquipmentState } from './useInventory';
import { PlayerAppearance } from "@/data/player"; // Assuming exported or similar

export interface MetaActionsContext {
    player: Player | null;
    setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
    inventory: Item[];
    setInventory: React.Dispatch<React.SetStateAction<Item[]>>;
    equipment: EquipmentState;
    setEquipment: React.Dispatch<React.SetStateAction<EquipmentState>>;
    dungeon: DungeonState;
    setDungeon: React.Dispatch<React.SetStateAction<DungeonState>>;
    stats: any; // Define strict stats type if possible
    setStats: React.Dispatch<React.SetStateAction<any>>;
    activeQuests: string[];
    setActiveQuests: React.Dispatch<React.SetStateAction<string[]>>;
    completedQuests: string[];
    setCompletedQuests: React.Dispatch<React.SetStateAction<string[]>>;
    materials: Record<string, number>;
    setMaterials: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    quickSlots: (Item | null)[];
    setQuickSlots: React.Dispatch<React.SetStateAction<(Item | null)[]>>;
    addMessage: (msg: string, type?: string) => void;
    setMessages: React.Dispatch<React.SetStateAction<any[]>>;
    setGameStarted: React.Dispatch<React.SetStateAction<boolean>>;
    setGameOver: React.Dispatch<React.SetStateAction<boolean>>;
    setPlayerName: React.Dispatch<React.SetStateAction<string>>;
    setSelectedAppearance: React.Dispatch<React.SetStateAction<any>>;
    setPlayerClass: React.Dispatch<React.SetStateAction<'warrior' | 'mage' | 'rogue'>>;
    playerName: string;
    updateMapFOV: (x: number, y: number) => void;
    questProgress: Record<string, any>;
    setQuestProgress: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export function useMetaActions(context: MetaActionsContext) {
    const {
        player, setPlayer,
        inventory, setInventory,
        equipment, setEquipment,
        dungeon, setDungeon,
        stats, setStats,
        activeQuests, setActiveQuests,
        completedQuests, setCompletedQuests,
        materials, setMaterials,
        quickSlots, setQuickSlots,
        addMessage, setMessages,
        setGameStarted, setGameOver,
        setPlayerName, setSelectedAppearance, setPlayerClass,
        playerName, updateMapFOV
    } = context;

    const saveGame = () => {
        if (!player) return;
        const gameStateToSave = {
            player,
            inventory,
            equipment,
            ...dungeon
        } as any; // Cast as SaveSystem might expect simpler object or stricter
        // Checked SaveSystem earlier, saveGame(gameState, stats, activeQuests, completedQuests, questProgress, materials, quickSlots)
        // defined in SaveSystem.ts.
        saveSystem(gameStateToSave, stats, activeQuests, completedQuests, context.questProgress, materials, quickSlots);
        addMessage("Juego guardado", 'info');
    };

    const loadGame = () => {
        const d = loadSystem();
        if (d) {
            const { gameState: savedGS, stats: sStats, activeQuests: sAQ, completedQuests: sCQ, questProgress: sQP, materials: sMat, quickSlots: sQS } = d;
            // @ts-ignore - savedGS types
            setPlayer(savedGS.player);
            // @ts-ignore
            setDungeon({
                ...savedGS,
                // @ts-ignore
                visible: Array(35).fill(null).map(() => Array(50).fill(false)),
                // @ts-ignore
                explored: savedGS.explored || Array(35).fill(null).map(() => Array(50).fill(false)),
            });
            // @ts-ignore
            setInventory(savedGS.inventory);
            // @ts-ignore
            setEquipment(savedGS.equipment);
            setStats(sStats); setActiveQuests(sAQ); setCompletedQuests(sCQ);
            if (context.setQuestProgress) context.setQuestProgress(sQP);
            setMaterials(sMat); setQuickSlots(sQS);
            setGameStarted(true);
            addMessage("Juego cargado", 'info');
            // @ts-ignore
            updateMapFOV(savedGS.player.x, savedGS.player.y);
        }
    };

    const restart = () => {
        setGameStarted(false);
        setGameOver(false);
        setPlayer(null);
        setMessages([]);

        setInventory([]);
        setEquipment({
            weapon: null, offhand: null, helmet: null, chest: null,
            legs: null, boots: null, gloves: null, ring: null,
            earring: null, necklace: null
        });
        setMaterials({});
        setQuickSlots([null, null, null]);

        setStats({ maxLevel: 1, kills: 0, gold: 0, playerLevel: 1 });

        setActiveQuests([]);
        setCompletedQuests([]);
        if (context.setQuestProgress) context.setQuestProgress({});
    };

    const selectCharacter = (k: string, a: PlayerAppearance) => {
        soundManager.play('start_adventure');
        setPlayerName(playerName || 'Héroe');
        setSelectedAppearance(k);
        setPlayerClass(a.class as 'warrior' | 'mage' | 'rogue');
        setGameStarted(true);
    };

    return {
        saveGame,
        loadGame,
        restart,
        selectCharacter
    };
}
