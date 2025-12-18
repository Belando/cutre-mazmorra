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
    id?: string;
    name?: string;
    duration?: number;
    stats?: Stats;
    invisible?: boolean;
    breaksOnAction?: boolean;
    // Add specific buff properties if needed
    [key: string]: any;
}

export interface SkillState {
    class?: string;
    evolvedClass?: string | null;
    learned: string[];
    skillLevels: Record<string, number>;
    skillPoints: number;
    cooldowns: Record<string, number>;
    buffs: Buff[];
    active?: Record<string, any>; // Deprecated? Keeping for safety
}

export interface SpriteComponent {
    texture: string;
    frameSize: Point; // { w: 32, h: 32 }
    anims: Record<string, number[]>; // "idle": [0,1], "run": [2,3]
    currentAnim: string;
    frameTimer: number;
    currentFrameIndex: number;
    frameDuration: number;
    // Multi-file support
    isMultiFile?: boolean;
    textureKeys?: Record<string, string[]>;
}

export interface Entity extends Point {
    id?: number | string;
    type: string | number; // Enemy type ID or string for player/npc
    name?: string;
    level?: number;
    lastAction?: string;
    lastAttackTime?: number;
    lastAttackDir?: Point;
    lastMoveTime?: number;
    lastSkillTime?: number;
    lastSkillId?: string | null;
    isBoss?: boolean;
    class?: string; // 'warrior', 'mage', 'rogue', etc.

    // Base Stats (merged from Stats interface conceptually, but explicit here to avoid index signature conflict)
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

    // Visuals
    sprite?: SpriteComponent;

    // State
    stats?: Stats; // Calculated total stats
    skills?: SkillState;
    exp?: number;

    // Status Effects
    stunned?: number;
    slowed?: number;
    slowedTurn?: boolean;
    poisoned?: number;

    // Equipment stats additions (Player)
    equipAttack?: number;
    equipDefense?: number;
    equipMagicAttack?: number;
    equipMagicDefense?: number;
    equipCrit?: number;
    equipEvasion?: number;
    equipMaxHp?: number;
    equipMaxMp?: number;

    // Base stats (Player)
    baseAttack?: number;
    baseDefense?: number;
    baseMagicAttack?: number;
    baseMagicDefense?: number;
    baseCrit?: number;
    baseEvasion?: number;

    // NPC specific
    ref?: any;

    // Visual Appearance
    appearance?: any;
}

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
    symbol?: string;

    // Equipment
    slot?: 'weapon' | 'offhand' | 'helmet' | 'chest' | 'legs' | 'boots' | 'gloves' | 'ring' | 'necklace' | 'earring' | 'armor' | 'accessory';
    weaponType?: string;
    armorType?: string;
    stats?: Stats;
    templateKey?: string;
    prefix?: string;
    upgradeLevel?: number;

    // Location (if on ground)
    x?: number;
    y?: number;
}

export interface GameState {
    player: Entity;
    map: number[][];
    enemies: Entity[];
    torches: Point[];
    level: number;
    items: Item[];
    chests: any[]; // Define properly if needed
    npcs: Entity[];
    visible: boolean[][];
    explored: boolean[][];
    bossDefeated: boolean;
    effectsManager?: any;
}
