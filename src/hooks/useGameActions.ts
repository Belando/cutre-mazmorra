import { useMovementActions, MovementActionsContext } from './useMovementActions';
import { useInteractionActions, InteractionActionsContext } from './useInteractionActions';
import { useCombatActions, CombatActionsContext } from './useCombatActions';
import { useInventoryActions, InventoryActionsContext } from './useInventoryActions';
import { useMetaActions, MetaActionsContext } from './useMetaActions';
import { useSkillActions, SkillActionsContext } from './useSkillActions';

export type GameActionsContext = MovementActionsContext &
    InteractionActionsContext &
    CombatActionsContext &
    InventoryActionsContext &
    MetaActionsContext &
    SkillActionsContext & {
        setPlayerName: (name: string) => void;
        setSelectedSkill: (skillId: string | null) => void;
        setRangedMode: (mode: boolean) => void;
        setRangedTargets: (targets: any[]) => void;
        executeTurn: (player?: any, enemies?: any) => void;
        executeSkillAction: (skillId: string, target?: any) => boolean;
    };

export interface GameActions {
    executeTurn: (player?: any, enemies?: any) => void;
    executeSkillAction: (skillId: string, target?: any) => boolean;
    move: (dx: number, dy: number) => void;
    descend: (isShift?: boolean) => void;
    interact: () => any;
    buyItem: (item: any) => void;
    sellItem: (index: number, price: number) => void;
    acceptQuest: (quest: any) => void;
    completeQuest: (quest: any) => void;

    useItem: (item: any) => void;
    dropItem: (item: any) => void;
    equipItem: (item: any) => void;
    unequipItem: (item: any) => void;
    useQuickSlot: (index: number) => void;
    assignToQuickSlot: (item: any, index: number) => void;
    craftItem: (recipeKey: string) => void;
    upgradeItem: (item: any) => void;
    reorderInventory: (items: any[]) => void;

    learnSkill: (skillId: string) => void;
    upgradeSkill: (skillId: string) => void;
    evolveClass: (newClass: string) => void;

    saveGame: () => void;
    loadGame: () => void;
    restart: () => void;
    selectCharacter: (k: string, a: any) => void;

    setPlayerName: (name: string) => void;
    setSelectedSkill: (skillId: string | null) => void;
    setRangedMode: (mode: boolean) => void;
    setRangedTargets: (targets: any[]) => void;
}

export function useGameActions(context: GameActionsContext): GameActions {
    const {
        executeTurn,
        setPlayerName, setSelectedSkill, setRangedMode, setRangedTargets
    } = context;

    const { performAttack, executeSkillAction } = useCombatActions(context);
    const { move, descend } = useMovementActions(context, executeSkillAction, performAttack, executeTurn);
    const { interact, buyItem, sellItem, acceptQuest, completeQuest } = useInteractionActions(context);
    const inventoryActions = useInventoryActions(context);
    const metaActions = useMetaActions(context);
    const skillActions = useSkillActions(context);

    return {
        executeTurn,
        executeSkillAction,
        move,
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
