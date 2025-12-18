import { useState, useCallback } from 'react';
import { initializeSkills, updateCooldowns, updateBuffs } from "@/engine/systems/SkillSystem";
import { PLAYER_APPEARANCES, PlayerAppearance } from '@/data/player';
import { Entity, SkillState, Stats, SpriteComponent } from '@/types';

// Extended Player Interface
export interface Player extends Entity {
    // Ensuring specific fields are present for player logic
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;

    baseAttack: number;
    baseMagicAttack: number;
    baseDefense: number;
    baseMagicDefense: number;

    equipAttack: number;
    equipMagicAttack: number;
    equipDefense: number;
    equipMagicDefense: number;
    equipMaxHp: number;
    equipMaxMp: number;

    exp: number;
    level: number;
    gold: number;
    name: string;
    class: 'warrior' | 'mage' | 'rogue';
    appearance: PlayerAppearance;
    skills: SkillState;

    // Derived or UI flags
    leveledUp?: boolean;
}

export interface UsePlayerResult {
    player: Player | null;
    setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
    initPlayer: (savedPlayer?: Player | null, classType?: 'warrior' | 'mage' | 'rogue', name?: string, startPos?: { x: number, y: number }) => void;
    updatePlayer: (updates: Partial<Player>) => void;
    gainExp: (amount: number) => void;
    regenerate: () => void;
}

export function usePlayer(): UsePlayerResult {
    const [player, setPlayer] = useState<Player | null>(null);

    const initPlayer = useCallback((savedPlayer: Player | null = null, classType: 'warrior' | 'mage' | 'rogue' = 'warrior', name = 'Héroe', startPos = { x: 1, y: 1 }) => {
        if (savedPlayer) {
            setPlayer(savedPlayer);
            return;
        }

        const appearance = PLAYER_APPEARANCES[classType] || PLAYER_APPEARANCES.warrior;

        // Stats Base según clase
        let baseStats = { attack: 5, magicAttack: 0, defense: 2, magicDefense: 1 };
        if (classType === 'mage') baseStats = { attack: 1, magicAttack: 8, defense: 1, magicDefense: 4 };
        if (classType === 'rogue') baseStats = { attack: 6, magicAttack: 1, defense: 2, magicDefense: 2 };

        const initialSprite: SpriteComponent = {
            texture: `player_${classType}`, // Used as fallback or base identifier
            frameSize: { x: 32, y: 32 }, // Correcting interface matching to Point {x,y}
            isMultiFile: true, // Custom property not in current SpriteComponent interface? 
            // Note: Entity interface defined SpriteComponent. 
            // Checking src/types/index.ts viewed earlier:
            // interface SpriteComponent { texture: string; frameSize: Point; anims: Record<string, number[]>; ... }
            // It does not have isMultiFile or textureKeys. 
            // I should probably update the interface or cast it.
            // For now, I'll validly construct it or extend strictness later.
            // Actually, the JS code used `isMultiFile` and `textureKeys`. I will add them to the interface in types if needed, or assume Any for now to avoid compilation block.
            // Let's use `as any` for the sprite object to bypass strict check for new fields, or better, update types.
            // I will update types in next step. For now, strict cast.
            // @ts-ignore
            isMultiFile: true,
            textureKeys: {
                idle: [`${classType}_idle_1`, `${classType}_idle_2`, `${classType}_idle_3`],
                walk_down: [`${classType}_walk_down_1`, `${classType}_walk_down_2`, `${classType}_walk_down_3`],
                walk_up: [`${classType}_walk_down_1`, `${classType}_walk_down_2`, `${classType}_walk_down_3`],
                walk_left: [`${classType}_walk_down_1`, `${classType}_walk_down_2`, `${classType}_walk_down_3`],
                walk_right: [`${classType}_walk_down_1`, `${classType}_walk_down_2`, `${classType}_walk_down_3`],
                attack_left: [`${classType}_attack_left_1`, `${classType}_attack_left_2`, `${classType}_attack_left_3`],
                attack_right: [`${classType}_attack_right_1`, `${classType}_attack_right_2`, `${classType}_attack_right_3`],
                attack_down: [`${classType}_attack_left_1`, `${classType}_attack_left_2`, `${classType}_attack_left_3`],
                attack_up: [`${classType}_attack_right_1`, `${classType}_attack_right_2`, `${classType}_attack_right_3`],
            },
            anims: {
                idle: [0, 1, 2],
                walk_down: [0, 1, 2],
                walk_up: [0, 1, 2],
                walk_left: [0, 1, 2],
                walk_right: [0, 1, 2],
                attack_left: [0, 1, 2],
                attack_right: [0, 1, 2],
                attack_down: [0, 1, 2],
                attack_up: [0, 1, 2]
            },
            currentAnim: 'idle',
            currentFrameIndex: 0,
            frameTimer: 0,
            frameDuration: 150
        };

        setPlayer({
            type: 'player', // Entity requirement
            x: startPos.x, y: startPos.y,
            hp: 50, maxHp: 50, mp: 30, maxMp: 30,

            // Nuevos Stats Base
            baseAttack: baseStats.attack,
            baseMagicAttack: baseStats.magicAttack,
            baseDefense: baseStats.defense,
            baseMagicDefense: baseStats.magicDefense,

            // Bonificadores de Equipo
            equipAttack: 0, equipMagicAttack: 0,
            equipDefense: 0, equipMagicDefense: 0,
            equipMaxHp: 0, equipMaxMp: 0,

            exp: 0, level: 1, gold: 0,
            name,
            class: classType,
            appearance,
            skills: initializeSkills(classType),

            sprite: initialSprite
        });
    }, []);

    const updatePlayer = useCallback((updates: Partial<Player>) => {
        setPlayer(prev => (prev ? { ...prev, ...updates } : null));
    }, []);

    const gainExp = useCallback((amount: number) => {
        setPlayer(prev => {
            if (!prev) return null;
            let { exp, level, maxHp, hp, skills, baseAttack, baseMagicAttack, baseDefense, baseMagicDefense } = prev;
            exp = (exp || 0) + amount;
            let leveledUp = false;

            // Usamos while en lugar de if para permitir múltiples subidas de nivel si la EXP es mucha
            while (exp >= level * 25) {
                exp -= level * 25; // RESTAMOS la experiencia necesaria en lugar de ponerla a 0
                level++;

                // Mejoras por subir de nivel
                maxHp += 10;
                hp = maxHp; // Recuperar vida al subir nivel
                if (skills) skills.skillPoints = (skills.skillPoints || 0) + 1;

                // Subida de stats base
                baseAttack = (baseAttack || 0) + 1;
                baseMagicAttack = (baseMagicAttack || 0) + 1;
                baseDefense = (baseDefense || 0) + 1;
                baseMagicDefense = (baseMagicDefense || 0) + 1;

                leveledUp = true;
            }
            return { ...prev, exp, level, maxHp, hp, skills, baseAttack, baseMagicAttack, baseDefense, baseMagicDefense, leveledUp };
        });
    }, []);

    const regenerate = useCallback(() => {
        setPlayer(prev => {
            if (!prev) return null;
            const mp = Math.min((prev.mp || 0) + 1, prev.maxMp || 30);
            let skills = prev.skills ? { ...prev.skills } : undefined;
            if (skills) {
                skills.cooldowns = updateCooldowns(skills.cooldowns);
                skills.buffs = updateBuffs(skills.buffs);
            }
            return { ...prev, mp, skills } as Player; // Cast because skills might be undefined but Entity says optional, Player says strict? I defined Player with strict skills.
        });
    }, []);

    return { player, setPlayer, initPlayer, updatePlayer, gainExp, regenerate };
}
