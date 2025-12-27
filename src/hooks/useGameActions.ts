import { useMovementActions, MovementActionsContext } from './useMovementActions';
import { useInteractionActions, InteractionActionsContext } from './useInteractionActions';
import { useCombatActions, CombatActionsContext } from './useCombatActions';
import { useInventoryActions, InventoryActionsContext } from './useInventoryActions';
import { useMetaActions, MetaActionsContext } from './useMetaActions';
import { useSkillActions, SkillActionsContext } from './useSkillActions';

import { Entity, Player, Item } from '@/types';

export type GameActionsContext = MovementActionsContext &
    InteractionActionsContext &
    CombatActionsContext &
    InventoryActionsContext &
    MetaActionsContext &
    SkillActionsContext & {
        setPlayerName: (name: string) => void;
        setSelectedSkill: (skillId: string | null) => void;
        setRangedMode: (mode: boolean) => void;
        setRangedTargets: (targets: Entity[]) => void;
        executeTurn: (playerState?: Player, enemiesOverride?: Entity[] | null) => void;
        executeSkillAction: (skillId: string, target?: Entity | null) => boolean;
        handleEnemyDeath: (index: number) => Entity[];
        spatialHash: any;
        playerName: string;
        selectedAppearance: string;
        playerClass: string;
        selectedSkill: string | null;
        rangedMode: boolean;
        rangedTargets: Entity[];
        setGameWon: (won: boolean) => void;
    };

export interface GameActions {
    executeTurn: (playerState?: Player, enemiesOverride?: Entity[] | null) => void;
    executeSkillAction: (skillId: string, target?: Entity | null) => boolean;
    handleEnemyDeath: (index: number) => Entity[];
    move: (dx: number, dy: number) => void;
    descend: (goUp: boolean) => void;
    interact: () => { type: 'chest' | 'npc', data?: any } | null;
    buyItem: (item: Item) => void;
    sellItem: (index: number, price: number) => void;
    acceptQuest: (quest: any) => void;
    completeQuest: (quest: any) => void;

    useItem: (index: number) => void;
    dropItem: (index: number) => void;
    equipItem: (index: number) => void;
    unequipItem: (slot: string) => void;
    useQuickSlot: (index: number) => void;
    assignQuickSlot: (index: number, itemId: string) => void;
    craftItem: (recipeKey: string) => void;
    upgradeItem: (slot: string) => void;
    reorderInventory: (from: number, to: number) => void;

    learnSkill: (skillId: string) => void;
    upgradeSkill: (skillId: string) => void;
    evolveClass: (newClass: string) => void;

    saveGame: () => void;
    loadGame: () => void;
    restart: () => void;
    selectCharacter: (k: string, appearanceKey: any) => void;

    setPlayerName: (name: string) => void;
    setSelectedSkill: (skillId: string | null) => void;
    setRangedMode: (mode: boolean) => void;
    setRangedTargets: (targets: Entity[]) => void;
    moveFluid: (dx: number, dy: number) => void;
}

export function useGameActions(context: GameActionsContext): GameActions {
    const {
        executeTurn, handleEnemyDeath,
        setPlayerName, setSelectedSkill, setRangedMode, setRangedTargets
    } = context;

    const { performAttack, executeSkillAction } = useCombatActions(context);
    const { move, descend, moveFluid } = useMovementActions(context, executeSkillAction, performAttack, executeTurn);
    const { interact, buyItem, sellItem, acceptQuest, completeQuest } = useInteractionActions(context);
    const inventoryActions = useInventoryActions(context);
    const metaActions = useMetaActions(context);
    const skillActions = useSkillActions(context);

    return {
        executeTurn,
        executeSkillAction,
        handleEnemyDeath,
        move,
        moveFluid,
        descend,
        interact,
        buyItem,
        sellItem,
        acceptQuest,
        completeQuest,
        ...inventoryActions,
        ...metaActions,
        ...skillActions,
        setPlayerName, setSelectedSkill, setRangedMode, setRangedTargets
    } as GameActions;
}
