import { DamageType, EntityTag } from '@/types';

export interface InteractionResult {
    multiplier: number;
    message: string;
}

export type InteractionMap = Partial<phases>;

type phases = Record<DamageType, Partial<Record<EntityTag, InteractionResult>>>;


export const DAMAGE_INTERACTIONS: InteractionMap = {
    [DamageType.FIRE]: {
        [EntityTag.PLANT]: { multiplier: 1.5, message: '¡Efectivo!' },
        [EntityTag.INSECT]: { multiplier: 1.5, message: '¡Efectivo!' },
        // 'OILY' needs to be added to EntityTag if it doesn't exist, or handled as a special case.
        // Assuming we can assume string casting for dynamic tags if necessary, or strictifying tags later.
        // For now, I'll allow casting in usage or add OILY to tags later.
    },
    [DamageType.ICE]: {
        [EntityTag.FIRE]: { multiplier: 1.5, message: '¡Vaporizado!' },
    },
    [DamageType.LIGHTNING]: {
        // Wet/Water logic often implies status effects or tags.
        // If 'WET' is a status, it might be a transient tag.
    },
    [DamageType.HOLY]: {
        [EntityTag.UNDEAD]: { multiplier: 2.0, message: '¡Purificado!' },
    }
};

// Start with standard interactions, special dynamic tags like 'WET' or 'OILY' might need flexible keys
// We can use string keys for the inner record to support dynamic tags.

export const DYNAMIC_INTERACTIONS: Record<string, Partial<Record<string, InteractionResult>>> = {
    [DamageType.FIRE]: {
        'OILY': { multiplier: 2.0, message: '¡Ignición!' },
        [EntityTag.PLANT]: { multiplier: 1.5, message: '¡Efectivo!' },
        [EntityTag.INSECT]: { multiplier: 1.5, message: '¡Efectivo!' },
    },
    [DamageType.ICE]: {
        [EntityTag.FIRE]: { multiplier: 1.5, message: '¡Vaporizado!' },
        'WET': { multiplier: 1.2, message: '¡Congelado!' },
    },
    [DamageType.LIGHTNING]: {
        'WET': { multiplier: 2.0, message: '¡Electrocutado!' },
        'WATER': { multiplier: 2.0, message: '¡Electrocutado!' },
    },
    [DamageType.HOLY]: {
        [EntityTag.UNDEAD]: { multiplier: 2.0, message: '¡Purificado!' },
    }
};
