import { IconType } from 'react-icons';

export interface Point {
    x: number;
    y: number;
}

export interface Stats {
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    attack: number;
    defense: number;
    magicAttack: number;
    magicDefense: number;
    critChance: number;
    evasion: number;
    speed: number;
    [key: string]: number; // Allow extensibility but enforced number
}

// Visual customization for the player
export interface Appearance {
    hairColor: string;
    skinColor: string;
    eyeColor: string;
    clothingColor: string;
    hairStyle: number;
}

export interface IEffectsManager {
    update: () => void;
    draw: (ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, size: number, halfW: number, halfH: number) => void;
    addText: (x: number, y: number, text: string, color: string, isCritical?: boolean, isSmall?: boolean) => void;
    addSparkles: (x: number, y: number, color: string) => void;
    current?: IEffectsManager;
    screenShake: number;
    effects: any[]; // TODO: Define Effect interface strictly later
}

export interface AttackResult {
    success: boolean;
    hit: boolean;
    damage: number;
    isCritical: boolean;
    isKill: boolean;
    evaded: boolean;
    message?: string;
    target?: Entity;
    path?: Point[];
    type?: string;
    attackType?: string;
    color?: string;
}

export interface ISpatialHash {
    rebuild: (state: GameState) => void;
    move: (oldX: number, oldY: number, newX: number, newY: number, entity: Entity) => void;
    add: (x: number, y: number, entity: Entity) => void;
    remove: (x: number, y: number, entity: Entity) => void;
    get: (x: number, y: number) => Entity[];
    find: (x: number, y: number, predicate: (e: Entity) => boolean) => Entity | null;
    isBlocked: (x: number, y: number) => boolean;
    updatePlayer: (player: Player) => void;
}

export interface Buff {
    id: string;
    name: string;
    duration: number;
    stats?: Partial<Stats>;
    invisible?: boolean;
    breaksOnAction?: boolean;
    type?: string;
    value?: number;
    icon?: string | IconType;
    absorb?: number;
    evasion?: number;
}

export interface SkillState {
    class: string;
    evolvedClass?: string | null;
    learned: string[];
    skillLevels: Record<string, number>;
    skillPoints: number;
    cooldowns: Record<string, number>;
    buffs: Buff[];
}

export interface SpriteComponent {
    texture: string;
    frameSize: Point;
    cols?: number;
    anims: Record<string, number[]>;
    currentAnim: string;
    currentFrameIndex: number;
    frameTimer: number;
    frameDuration: number;
    isMultiFile?: boolean;
    textureKeys?: Record<string, string[]>;
    flipLeft?: boolean;
}

export interface BaseEntity extends Point {
    id: string | number;
    type: string | number;
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    stats: Stats;
    sprite?: SpriteComponent;
    lastAttackTime?: number;
    lastAttackDir?: Point;
    lastMoveTime?: number;
    lastActionTime?: number;
    stunned?: number;
    slowed?: number;
    poisoned?: number;
    poisonDamage?: number;
    marked?: boolean;
    lastAction?: string;
    tags?: string[]; // Systemic tags (e.g. 'UNDEAD', 'FIRE', 'FLYING')

    // Optional stats for all entities (enemies, NPCs might use them)
    baseAttack?: number;
    baseDefense?: number;
    baseMagicAttack?: number;
    baseMagicDefense?: number;
    baseCrit?: number;
    baseEvasion?: number;

    equipAttack?: number;
    equipDefense?: number;
    equipMagicAttack?: number;
    equipMagicDefense?: number;
    equipCrit?: number;
    equipEvasion?: number;
    equipMaxHp?: number;
    equipMaxMp?: number;
}

export interface Player extends BaseEntity {
    type: 'player';
    class: string;
    exp: number;
    gold: number;
    skills: SkillState;
    appearance: Appearance; // Strict typing

    // Base stats
    baseAttack: number;
    baseDefense: number;
    baseMagicAttack: number;
    baseMagicDefense: number;
    baseCrit: number;
    baseEvasion: number;

    // Equipment bonuses
    equipAttack: number;
    equipDefense: number;
    equipMagicAttack: number;
    equipMagicDefense: number;
    equipCrit: number;
    equipEvasion: number;
    equipMaxHp: number;
    equipMaxMp: number;

    lastSkillTime?: number;
    lastSkillId?: string | null;
}

export interface Enemy extends BaseEntity {
    type: string | number;
    isBoss?: boolean;
    slowedTurn?: boolean;
    lastSummonTime?: number;
    hasEnraged?: boolean; // Added for Lich/Boss State
}

export interface NPC extends BaseEntity {
    type: string;
    ref?: any; // Keeping 'any' for now as logic ref is complex
}

export type Entity = Player | Enemy | NPC;

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Item {
    id: string;
    name: string;
    category: 'weapon' | 'armor' | 'accessory' | 'potion' | 'material' | 'currency' | 'food' | 'ammo';
    rarity: Rarity;
    levelRequirement?: number;
    description?: string;
    value?: number;
    quantity?: number;
    stackable?: boolean;
    symbol?: string | IconType; // Strict typing
    upgradeLevel?: number;

    weaponType?: string;
    armorType?: string;
    slot?: string;
    stats?: Partial<Stats>;

    x?: number;
    y?: number;

    char?: string;
    color?: string;
    effect?: string;
    templateKey?: string;
    prefix?: string;
}

export interface EquipmentState {
    weapon: Item | null;
    offhand: Item | null;
    helmet: Item | null;
    chest: Item | null;
    legs: Item | null;
    boots: Item | null;
    gloves: Item | null;
    ring: Item | null;
    earring: Item | null;
    necklace: Item | null;
}

export interface QuickSlotData {
    itemId: string;
}

export interface Chest extends Point {
    isOpen: boolean;
    rarity: Rarity;
    item?: Item;
}

export interface RenderTile {
    variant: number;
    noise: number;
    rotation: number;
    tint?: string;
}

export type RenderMap = RenderTile[][];

export type RenderCommandType =
    | 'wall'
    | 'sprite'
    | 'enemy'
    | 'player'
    | 'corpse'
    | 'item'
    | 'npc'
    | 'rect'
    | 'healthbar'
    | 'text'
    | 'custom';



export interface RenderItem {
    sortY: number;
    type: RenderCommandType;

    // Payload (Optional fields, used based on type)
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    color?: string;
    texture?: string; // e.g. 'wall', 'chest'
    frame?: number;

    // Specifics
    health?: number;
    maxHealth?: number;
    flipX?: boolean;

    // Player Specifics
    appearance?: Appearance;
    playerClass?: string;

    // Enemy/Entity keys
    enemyType?: string | number;
    stunned?: boolean;
    lastAttackTime?: number;
    lastMoveTime?: number;
    lastAttackDir?: Point;
    spriteComp?: SpriteComponent;
    isLarge?: boolean;

    // Props
    isOpen?: boolean;
    rarity?: Rarity;
    item?: Item;
    npc?: NPC;
    rotation?: number;
    lastSkillTime?: number;
    lastSkillId?: string | null;
    isInvisible?: boolean;
    opacity?: number;

    // Custom Callback (Legacy fallback, try to avoid)
    draw?: () => void;
}

export interface Corpse extends Point {
    type: string | number;
    rotation: number;
    timestamp: number;
}

export interface GameState {
    player: Player | null;
    map: number[][];
    renderMap?: RenderMap;
    entities: number[][];
    enemies: Enemy[];
    corpses: Corpse[];
    torches: Point[];
    location: 'home' | 'dungeon';
    level: number;
    items: Item[];
    chests: Chest[];
    npcs: NPC[];
    visible: boolean[][];
    explored: boolean[][];
    bossDefeated: boolean;
    stairs?: Point;
    stairsUp?: Point | null;
    playerStart?: Point;
    inventory: Item[];
    equipment: EquipmentState;
    questProgress: Record<string, any>; // Storing complex quest data might still need 'any' for flexibility or specific QuestDatum type
    materials: Record<string, number>;
    effectsManager?: IEffectsManager;
    spatialHash?: ISpatialHash;
    seed?: number;
}
