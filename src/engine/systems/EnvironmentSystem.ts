import { TILE_TAGS } from '@/data/constants';
import { DamageType } from '@/types';

/**
 * Checks for elemental interactions with the environment.
 * @param x Map X
 * @param y Map Y
 * @param element Attack element (e.g. 'fire', 'ice')
 * @param map Terrain map
 * @returns Effect result message or null
 */
export function processTileInteraction(x: number, y: number, element: string, map: number[][]): { effect: string, status?: string } | null {
    const tile = map[y]?.[x];
    if (tile === undefined) return null;

    const tags = (TILE_TAGS as any)[tile] || [];

    if (element === DamageType.FIRE) {
        if (tags.includes('FLAMMABLE') || tags.includes('OILY')) {
            return { effect: 'BURNING_GROUND', status: 'BURNING' };
        }
    }

    if (element === DamageType.ICE) {
        if (tags.includes('WATER')) {
            return { effect: 'FROZEN_GROUND', status: 'FROZEN' };
        }
    }

    if (element === DamageType.LIGHTNING) {
        if (tags.includes('WATER')) {
            return { effect: 'ELECTRIFIED_WATER', status: 'SHOCKED' };
        }
    }

    return null;
}
