import { EntityTag, DamageType } from '@/types';

export type EnemyType = number;
export type LargeEnemyType = number;

export interface EnemyAttack {
    type: 'melee' | 'ranged' | 'magic';
    range: number;
    name: string;
    damageMult?: number; // Default 1.0
    element?: DamageType | string; // Use enum but allow string fallback
    color?: string;
    chance?: number; // 0-1, default 1
    effect?: {
        type: 'stun' | 'slow' | 'poison' | 'burn' | 'bleed' | 'drain';
        duration: number;
        value?: number;
        chance: number;
    };
}

export interface EnemyStats {
    id: string;
    name: string;
    hp: number;
    attack: number;
    defense: number;
    exp: number;
    symbol: string;
    color: string;
    minLevel: number;
    renderKey: string;
    isBoss?: boolean;
    tags?: EntityTag[]; // Type safe tags
    aiBehavior?: string;
    attacks?: EnemyAttack[];
    resistances?: Record<string, number>;
    damageType?: DamageType | string;
}

export interface LargeEnemyConfig {
    width: number;
    height: number;
    scale?: number;
    name: string;
}
