import { useState, useCallback } from 'react';
import { initializeSkills, updateCooldowns, updateBuffs } from "@/engine/systems/SkillSystem";
import { calculatePlayerStats } from "@/engine/systems/ItemSystem";

export function usePlayer() {
  const [player, setPlayer] = useState(null);

  // Inicializar jugador (o resetear)
  const initPlayer = useCallback((savedPlayer = null, classType = 'warrior', name = 'Héroe', startPos = { x: 1, y: 1 }) => {
    if (savedPlayer) {
      setPlayer(savedPlayer);
      return;
    }

    const classAttributes = {
      warrior: { strength: 10, dexterity: 5, intelligence: 3 },
      mage: { strength: 3, dexterity: 5, intelligence: 10 },
      rogue: { strength: 5, dexterity: 10, intelligence: 3 },
    };

    setPlayer({
      x: startPos.x, y: startPos.y,
      hp: 50, maxHp: 50, mp: 30, maxMp: 30,
      attack: 8, baseAttack: 8, defense: 3, baseDefense: 3,
      equipAttack: 0, equipDefense: 0, equipMaxHp: 0,
      exp: 0, level: 1, gold: 0,
      name,
      class: classType,
      ...(classAttributes[classType] || classAttributes.warrior),
      skills: initializeSkills(classType)
    });
  }, []);

  const updatePlayer = useCallback((updates) => {
    setPlayer(prev => ({ ...prev, ...updates }));
  }, []);

  const gainExp = useCallback((amount) => {
    setPlayer(prev => {
      let { exp, level, maxHp, hp, skills } = prev;
      exp += amount;
      let leveledUp = false;
      
      // Lógica de subida de nivel
      if (exp >= level * 25) {
        level++;
        exp = 0;
        maxHp += 10;
        hp = maxHp;
        skills.skillPoints = (skills.skillPoints || 0) + 1;
        leveledUp = true;
      }
      return { ...prev, exp, level, maxHp, hp, skills, leveledUp };
    });
  }, []);

  const regenerate = useCallback(() => {
    setPlayer(prev => {
      if (!prev) return null;
      // Regenerar Maná
      const mp = Math.min((prev.mp || 0) + 1, prev.maxMp || 30);
      
      // Actualizar Cooldowns y Buffs
      const skills = { ...prev.skills };
      if (skills) {
        skills.cooldowns = updateCooldowns(skills.cooldowns);
        skills.buffs = updateBuffs(skills.buffs);
      }
      
      return { ...prev, mp, skills };
    });
  }, []);

  return { 
    player, 
    setPlayer, 
    initPlayer, 
    updatePlayer, 
    gainExp,
    regenerate
  };
}