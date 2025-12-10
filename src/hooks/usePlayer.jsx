import { useState, useCallback } from 'react';
import { initializeSkills, updateCooldowns, updateBuffs } from "@/engine/systems/SkillSystem";
import { PLAYER_APPEARANCES } from '@/components/ui/CharacterSelect';

export function usePlayer() {
  const [player, setPlayer] = useState(null);

  const initPlayer = useCallback((savedPlayer = null, classType = 'warrior', name = 'Héroe', startPos = { x: 1, y: 1 }) => {
    if (savedPlayer) {
      setPlayer(savedPlayer);
      return;
    }

    const appearance = PLAYER_APPEARANCES[classType] || PLAYER_APPEARANCES.warrior;

    // Stats Base según clase
    let baseStats = { attack: 5, magicAttack: 0, defense: 2, magicDefense: 1 };
    if (classType === 'mage') baseStats = { attack: 1, magicAttack: 8, defense: 1, magicDefense: 4 };
    if (classType === 'rogue') baseStats = { attack: 6, magicAttack: 1, defense: 2, magicDefense: 2 };

    setPlayer({
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
      class: classType, appearance, 
      skills: initializeSkills(classType)
    });
  }, []);

  const updatePlayer = useCallback((updates) => {
    setPlayer(prev => ({ ...prev, ...updates }));
  }, []);

  // --- CORRECCIÓN AQUÍ ---
  const gainExp = useCallback((amount) => {
    setPlayer(prev => {
      let { exp, level, maxHp, hp, skills, baseAttack, baseMagicAttack, baseDefense, baseMagicDefense } = prev;
      exp += amount;
      let leveledUp = false;
      
      // Usamos while en lugar de if para permitir múltiples subidas de nivel si la EXP es mucha
      while (exp >= level * 25) {
        exp -= level * 25; // RESTAMOS la experiencia necesaria en lugar de ponerla a 0
        level++;
        
        // Mejoras por subir de nivel
        maxHp += 10;
        hp = maxHp; // Recuperar vida al subir nivel
        skills.skillPoints = (skills.skillPoints || 0) + 1;
        
        // Subida de stats base
        baseAttack += 1;
        baseMagicAttack += 1;
        baseDefense += 1;
        baseMagicDefense += 1;
        
        leveledUp = true;
      }
      return { ...prev, exp, level, maxHp, hp, skills, baseAttack, baseMagicAttack, baseDefense, baseMagicDefense, leveledUp };
    });
  }, []);
  // -----------------------

  const regenerate = useCallback(() => {
    setPlayer(prev => {
      if (!prev) return null;
      const mp = Math.min((prev.mp || 0) + 1, prev.maxMp || 30);
      const skills = { ...prev.skills };
      if (skills) {
        skills.cooldowns = updateCooldowns(skills.cooldowns);
        skills.buffs = updateBuffs(skills.buffs);
      }
      return { ...prev, mp, skills };
    });
  }, []);

  return { player, setPlayer, initPlayer, updatePlayer, gainExp, regenerate };
}