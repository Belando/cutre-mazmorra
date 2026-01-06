import { ENTITY } from '../constants';
import { ENEMY_IDS } from '../ids';
import { EntityTag, DamageType } from '@/types';
import { EnemyStats } from './types';

export const UNDEAD_STATS: Record<number, EnemyStats> = {
    [ENTITY.ENEMY_SKELETON]: { id: ENEMY_IDS.SKELETON, name: 'Esqueleto', hp: 15, attack: 5, defense: 2, exp: 8, symbol: 's', color: '#e5e5e5', minLevel: 2, renderKey: 'skeleton', aiBehavior: 'aggressive', tags: [EntityTag.UNDEAD, EntityTag.SKELETON] },
    [ENTITY.ENEMY_ZOMBIE]: { id: ENEMY_IDS.ZOMBIE, name: 'Zombi', hp: 30, attack: 6, defense: 4, exp: 14, symbol: 'z', color: '#65a30d', minLevel: 3, renderKey: 'zombie', aiBehavior: 'aggressive', tags: [EntityTag.UNDEAD] },
    [ENTITY.ENEMY_WRAITH]: {

        id: 'wraith',
        name: 'Wraith',
        hp: 60,
        attack: 15,
        defense: 5,
        exp: 35,
        symbol: 'W',
        color: '#aaddff',
        minLevel: 4,
        renderKey: 'ghost',
        tags: [EntityTag.UNDEAD, EntityTag.GHOST, EntityTag.FLYING],
        damageType: DamageType.MAGICAL,
        aiBehavior: 'hit_and_run',
        attacks: [
            { type: 'magic', range: 4, name: 'Spirit Bolt', element: DamageType.ICE, color: '#aaddff', damageMult: 1.0 }
        ],
        resistances: { 'physical': 0.5, 'dark': 0.8, 'poison': 1.0 }
    },
    [ENTITY.ENEMY_VAMPIRE]: {
        id: ENEMY_IDS.VAMPIRE, name: 'Vampiro', hp: 45, attack: 12, defense: 4, exp: 32, symbol: 'V', color: '#7f1d1d', minLevel: 5, renderKey: 'vampire', aiBehavior: 'aggressive', tags: [EntityTag.UNDEAD, EntityTag.VAMPIRE],
        attacks: [{ type: 'magic', range: 5, name: 'Drenar Vida', color: '#991b1b', effect: { type: 'drain', duration: 0, chance: 1 } }]
    },
    [ENTITY.ENEMY_MAGE]: {
        id: ENEMY_IDS.MAGE, name: 'Mago Esqueleto', hp: 25, attack: 10, defense: 1, exp: 20, symbol: 'L', color: '#6366f1', minLevel: 6, renderKey: 'skeleton_mage', aiBehavior: 'cautious', tags: [EntityTag.UNDEAD, EntityTag.SKELETON, EntityTag.MAGIC],
        attacks: [{ type: 'magic', range: 6, name: 'Bola de Fuego', color: '#ef4444', element: DamageType.FIRE, effect: { type: 'burn', duration: 4, chance: 0.4 } }]
    },
    [ENTITY.ENEMY_GHOST]: {
        id: ENEMY_IDS.GHOST, name: 'Fantasma', hp: 22, attack: 8, defense: 1, exp: 18, symbol: 'ø', color: '#e0f2fe', minLevel: 3, renderKey: 'wraith', aiBehavior: 'flee', tags: [EntityTag.UNDEAD, EntityTag.SPIRIT, EntityTag.FLYING],
        resistances: { [DamageType.PHYSICAL]: 0.5, [DamageType.POISON]: 0 }
    },
    [ENTITY.BOSS_LICH]: {

        id: 'lich',
        name: 'The Lich King',
        hp: 500,
        attack: 30,
        defense: 10,
        exp: 1000,
        symbol: 'L',
        color: '#aa00ff',
        minLevel: 10,
        renderKey: 'lich',
        isBoss: true,
        tags: [EntityTag.UNDEAD, EntityTag.MAGIC, EntityTag.BOSS],
        damageType: DamageType.MAGICAL,
        aiBehavior: 'boss_caster',
        attacks: [],
        resistances: { 'physical': 0.3, 'ice': 0.8, 'dark': 0.9 }
    },
    [ENTITY.ENEMY_ELITE_SKELETON]: {
        id: ENEMY_IDS.ELITE_SKELETON, name: 'Guardia Esqueleto', hp: 35, attack: 9, defense: 4, exp: 20, symbol: 'S', color: '#d4d4d8', minLevel: 3, renderKey: 'skeleton', aiBehavior: 'pack', tags: [EntityTag.UNDEAD, EntityTag.SKELETON]
    },
};
