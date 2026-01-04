import { Enemy, Player, ISpatialHash } from '@/types';

export interface EnemyAction {
    action: string;
    x?: number;
    y?: number;
    range?: number;
    damage?: number;
    targetId?: string | number;
    message?: string;
    color?: string;
}

export interface AIContext {
    enemy: Enemy;
    player: Player;
    enemies: Enemy[];
    map: number[][];
    visible: boolean[][];
    spatialHash: ISpatialHash;
}

export interface AIBehavior {
    evaluate(context: AIContext): EnemyAction;
}
