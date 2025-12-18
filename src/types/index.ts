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
    cooldowns: Record<string, number>;
    active: Record<string, any>;
    buffs: Buff[];
    skillLevels?: Record<string, number>;
}

export interface SpriteComponent {
    texture: string;
    frameSize: Point; // { w: 32, h: 32 }
    anims: Record<string, number[]>; // "idle": [0,1], "run": [2,3]
    currentAnim: string;
    frameTimer: number;
    currentFrameIndex: number;
    frameDuration: number;
}

export interface Entity extends Point {
    id?: number | string;
    type: string | number; // Enemy type ID or string for player/npc
    name?: string;
    level?: number;
    lastAction?: string;
    lastAttackTime?: number;
    lastMoveTime?: number;
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

    // Enemy Specific
    stunned?: number | boolean;
    slowed?: number | boolean;
}

export interface Item {
    id: string;
    name: string;
    category: 'weapon' | 'armor' | 'accessory' | 'potion' | 'material' | 'currency' | 'food';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    levelRequirement?: number;
    description?: string;
    value?: number;
    quantity?: number;
    stackable?: boolean;
    symbol?: string;

    // Equipment
    slot?: 'weapon' | 'offhand' | 'helmet' | 'chest' | 'legs' | 'boots' | 'gloves' | 'ring' | 'necklace' | 'earring';
    weaponType?: string;
    armorType?: string;
    stats?: Stats;
    templateKey?: string;
    prefix?: string;

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
}
