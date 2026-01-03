export interface Point {
    x: number;
    y: number;
}

export interface Stats {
    hp?: number;
    maxHp?: number;
    mp?: number;
    maxMp?: number;
    attack?: number;
    defense?: number;
    magicAttack?: number;
    magicDefense?: number;
    critChance?: number;
    evasion?: number;
    speed?: number;
    [key: string]: number | undefined;
}

export interface IEffectsManager {
    update: () => void;
    draw: (ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, size: number, halfW: number, halfH: number) => void;
    addText: (x: number, y: number, text: string, color: string, isCritical?: boolean, isSmall?: boolean) => void;
    addSparkles: (x: number, y: number, color: string) => void;
    current?: IEffectsManager;
}

export interface AttackResult {
    success?: boolean;
    hit?: boolean;
    damage: number;
    isCritical?: boolean; // Unified: usages might toggle between isCrit/isCritical. Let's support both or standardize. CombatSystem uses 'isCrit'.
    isCrit?: boolean;     // Add alias for now
    isKill?: boolean;
    evaded?: boolean;
    message?: string;
    target?: Entity;
    path?: Point[]; // Typed path
    type?: string;
    attackType?: string;
    color?: string;
}

export interface ISpatialHash {
    rebuild: (state: GameState) => void;
    move: (oldX: number, oldY: number, newX: number, newY: number, entity: Entity | any) => void; // Keeping | any for safety during migration
    add: (x: number, y: number, entity: Entity | any) => void;
    remove: (x: number, y: number, entity: Entity | any) => void;
    get: (x: number, y: number) => (Entity | any)[];
    find: (x: number, y: number, predicate: (e: Entity | any) => boolean) => (Entity | any) | null;
    isBlocked: (x: number, y: number) => boolean;
    updatePlayer: (player: Player) => void;
}

export interface Buff {
    id: string;
    name: string;
    duration: number;
    stats?: Stats;
    invisible?: boolean;
    breaksOnAction?: boolean;
    type?: string;
    value?: number;
    icon?: any;
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
    cols?: number; // Added for grid support
    anims: Record<string, number[]>; // "idle": [0,1], "run": [2,3]
    currentAnim: string;
    currentFrameIndex: number;
    frameTimer: number;
    frameDuration: number;
    // Multi-file support
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
    stats: Stats; // Calculated total stats
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
}

export interface Player extends BaseEntity {
    type: 'player';
    class: string;
    exp: number;
    gold: number;
    skills: SkillState;
    appearance: any;

    // Base stats (for leveling/progression)
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
    type: string | number; // Enemy template ID
    isBoss?: boolean;
    slowedTurn?: boolean;
    lastSummonTime?: number;
}

export interface NPC extends BaseEntity {
    type: string; // 'shopkeeper', 'questgiver', etc.
    ref?: any; // Reference to logic or template
}

// Re-export Entity as a union for backward compatibility where generic handling is needed
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
    symbol?: any; // React Component or string

    upgradeLevel?: number;

    // Equipment specific
    weaponType?: string;
    armorType?: string;
    slot?: string;
    stats?: Stats;

    // Location (if on ground)
    x?: number;
    y?: number;

    // Optional props for non-standard items
    char?: string;
    color?: string;
    effect?: string;
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
    variant: number; // 0=default, 1=flower, etc.
    noise: number; // Raw noise value for coloring
    rotation: number; // 0, 90, 180, 270 (for variety)
    tint?: string; // Pre-calculated tint color
}

export type RenderMap = RenderTile[][];

export interface RenderItem {
    y: number;
    sortY: number;
    draw: () => void;
}

export interface Corpse extends Point {
    type: string | number;
    rotation: number;
    timestamp: number;
}

export interface GameState {
    player: Player | null;
    map: number[][];
    renderMap?: RenderMap; // Pre-calculated visual data
    entities: number[][]; // Grid for static entities
    enemies: Enemy[];
    corpses: Corpse[];
    torches: Point[];
    location: 'home' | 'dungeon'; // New location state
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
    questProgress: Record<string, any>;
    materials: Record<string, number>;
    effectsManager?: IEffectsManager;
    spatialHash?: ISpatialHash;
}
