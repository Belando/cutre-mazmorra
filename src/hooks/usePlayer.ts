import { useState, useCallback } from 'react';
import { initializeSkills, updateCooldowns, updateBuffs } from "@/engine/systems/SkillSystem";
import { PLAYER_APPEARANCES, PlayerAppearance } from '@/data/player';
import { Player, SkillState, Stats, SpriteComponent } from '@/types';
import { PlayerClass } from '@/types/enums';
import { CLASS_CONFIG } from '@/data/classes';

export interface UsePlayerResult {
    player: Player | null;
    setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
    initPlayer: (savedPlayer?: Player | null, classType?: PlayerClass, name?: string, startPos?: { x: number, y: number }) => void;
    updatePlayer: (updates: Partial<Player>) => void;
    gainExp: (amount: number) => void;
    regenerate: () => void;
}

export function usePlayer(): UsePlayerResult {
    const [player, setPlayer] = useState<Player | null>(null);

    const initPlayer = useCallback((savedPlayer: Player | null = null, classType: PlayerClass = PlayerClass.WARRIOR, name = 'Héroe', startPos = { x: 1, y: 1 }) => {
        if (savedPlayer) {
            setPlayer(savedPlayer);
            return;
        }

        const appearance = PLAYER_APPEARANCES[classType as keyof typeof PLAYER_APPEARANCES] || PLAYER_APPEARANCES.warrior;
        const config = CLASS_CONFIG[classType];
        const baseStats = config.baseStats;

        const initialSprite: SpriteComponent = {
            texture: `player_${classType}`,
            frameSize: { x: 32, y: 32 },
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
            id: 'player',
            type: 'player',
            x: startPos.x, y: startPos.y,
            hp: 50, maxHp: 50, mp: 30, maxMp: 30,

            // Nuevos Stats Base
            baseAttack: baseStats.attack,
            baseMagicAttack: baseStats.magicAttack,
            baseDefense: baseStats.defense,
            baseMagicDefense: baseStats.magicDefense,
            baseCrit: 5,
            baseEvasion: 5,

            // Bonificadores de Equipo
            equipAttack: 0, equipMagicAttack: 0,
            equipDefense: 0, equipMagicDefense: 0,
            equipCrit: 0, equipEvasion: 0,
            equipMaxHp: 0, equipMaxMp: 0,

            exp: 0, level: 1, gold: 0,
            name,
            class: classType,
            appearance,
            skills: initializeSkills(classType),
            stats: { ...baseStats, hp: 50, maxHp: 50, mp: 30, maxMp: 30 },
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

                const growth = CLASS_CONFIG[prev.class]?.growthRates || { hp: 10, mp: 5, attack: 1, defense: 1, magicAttack: 0, magicDefense: 0 };

                // Mejoras por subir de nivel
                maxHp += growth.hp;
                hp = maxHp; // Recuperar vida al subir nivel
                if (skills) skills.skillPoints = (skills.skillPoints || 0) + 1;

                // Subida de stats base
                baseAttack = (baseAttack || 0) + growth.attack;
                baseMagicAttack = (baseMagicAttack || 0) + growth.magicAttack;
                baseDefense = (baseDefense || 0) + growth.defense;
                baseMagicDefense = (baseMagicDefense || 0) + growth.magicDefense;

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
