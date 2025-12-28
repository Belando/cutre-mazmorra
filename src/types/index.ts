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
    frameSize: Point; // { x: 32, y: 32 }
    anims: Record<string, number[]>; // "idle": [0,1], "run": [2,3]
    currentAnim: string;
    frameTimer: number;
    currentFrameIndex: number;
    frameDuration: number;
    // Multi-file support
    isMultiFile?: boolean;
    textureKeys?: Record<string, string[]>;
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

    // Location (if on ground)
    x?: number;
    y?: number;
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

export interface GameState {
    player: Player | null;
    map: number[][];
    enemies: Enemy[];
    torches: Point[];
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
    effectsManager?: any;
    spatialHash?: any;
}
