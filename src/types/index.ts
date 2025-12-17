export interface Point {
    x: number;
    y: number;
}

export interface Stats {
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    magicAttack?: number;
    magicDefense?: number;
    critChance?: number;
    speed?: number;
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

export interface Entity extends Point, Stats {
    id: number;
    type: string | number; // Enemy type ID or string for player/npc
    name?: string;
    level?: number;
    lastAction?: string;
    lastAttackTime?: number;
    lastMoveTime?: number;

    // Visuals
    sprite?: SpriteComponent;
}

export interface GameState {
    player: Entity;
    map: number[][];
    enemies: Entity[];
    torches: Point[];
    level: number;
}
