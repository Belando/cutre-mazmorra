import { soundManager } from "@/engine/systems/SoundSystem";
import { saveGame as saveSystem, loadGame as loadSystem } from '@/engine/systems/SaveSystem';
import { Item, Player, QuickSlotData, EquipmentState } from '@/types';
import { DungeonState } from './useDungeon';
import { PLAYER_APPEARANCES } from "@/data/player";

export interface MetaActionsContext {
    player: Player | null;
    setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
    inventory: Item[];
    setInventory: React.Dispatch<React.SetStateAction<Item[]>>;
    equipment: EquipmentState;
    setEquipment: React.Dispatch<React.SetStateAction<EquipmentState>>;
    dungeon: DungeonState;
    setDungeon: React.Dispatch<React.SetStateAction<DungeonState>>;
    stats: any;
    setStats: React.Dispatch<React.SetStateAction<any>>;
    activeQuests: string[];
    setActiveQuests: React.Dispatch<React.SetStateAction<string[]>>;
    completedQuests: string[];
    setCompletedQuests: React.Dispatch<React.SetStateAction<string[]>>;
    materials: Record<string, number>;
    setMaterials: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    quickSlots: (QuickSlotData | null)[];
    setQuickSlots: React.Dispatch<React.SetStateAction<(QuickSlotData | null)[]>>;
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
        };
        saveSystem(gameStateToSave as any, stats, activeQuests, completedQuests, context.questProgress, materials, quickSlots);
        addMessage("Juego guardado", 'info');
    };

    const loadGame = () => {
        const d = loadSystem();
        if (d) {
            const { gameState: savedGS, stats: sStats, activeQuests: sAQ, completedQuests: sCQ, questProgress: sQP, materials: sMat, quickSlots: sQS } = d;

            if (savedGS && savedGS.player) {
                setPlayer(savedGS.player as Player);
                updateMapFOV(savedGS.player.x, savedGS.player.y);
            }

            setDungeon({
                ...savedGS,
                visible: savedGS.visible || Array(35).fill(null).map(() => Array(50).fill(false)),
                explored: savedGS.explored || Array(35).fill(null).map(() => Array(50).fill(false)),
            } as any);

            if (savedGS.inventory) setInventory(savedGS.inventory);
            if (savedGS.equipment) setEquipment(savedGS.equipment);

            if (sStats) setStats(sStats);
            if (sAQ) setActiveQuests(sAQ);
            if (sCQ) setCompletedQuests(sCQ);
            if (sQP && context.setQuestProgress) context.setQuestProgress(sQP);
            if (sMat) setMaterials(sMat);
            if (sQS) setQuickSlots(sQS);

            setGameStarted(true);
            addMessage("Juego cargado", 'info');
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

    const selectCharacter = (k: string, appearanceKey: any) => {
        soundManager.play('start_adventure');
        const appearance = (PLAYER_APPEARANCES as any)[appearanceKey] || PLAYER_APPEARANCES.warrior;
        setPlayerName(playerName || 'Héroe');
        setSelectedAppearance(k);
        setPlayerClass(appearance.class as 'warrior' | 'mage' | 'rogue');
        setGameStarted(true);
    };

    return {
        saveGame,
        loadGame,
        restart,
        selectCharacter
    };
}
