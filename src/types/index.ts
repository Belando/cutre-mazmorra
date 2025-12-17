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

export interface Entity extends Point, Stats {
    id: number;
    type: string | number; // Enemy type ID or string for player/npc
    name?: string;
    level?: number;
    lastAction?: string;
    lastAttackTime?: number;
    lastMoveTime?: number;
}

export interface GameState {
    player: Entity;
    map: number[][];
    enemies: Entity[];
    torches: Point[];
    level: number;
}
