import { ENEMY_STATS } from '@/data/enemies';
import { SKILLS } from '@/data/skills';
import { MATERIAL_TYPES, generateMaterialDrop, generateBossDrop } from "@/engine/systems/CraftingSystem";
import { calculatePlayerStats } from '@/engine/systems/ItemSystem';
import { calculateBuffBonuses, canUseSkill, getSkillEffectiveStats, useSkill } from "@/engine/systems/SkillSystem";
import { soundManager } from '@/engine/systems/SoundSystem';

export function useCombatLogic({ 
  dungeon, setDungeon, 
  player, updatePlayer, gainExp, 
  setStats, 
  addMessage, addMaterial, 
  effectsManager, 
  executeTurn, // Necesitamos esto para pasar turno tras una skill
  setSelectedSkill
}) {

  // --- MANEJO DE MUERTE DE ENEMIGOS ---
  const handleEnemyDeath = (enemyIdx) => {
    const enemy = dungeon.enemies[enemyIdx];
    if (!enemy) return dungeon.enemies;

    const info = ENEMY_STATS[enemy.type];
    
    // Eliminar enemigo
    const newEnemies = [...dungeon.enemies];
    newEnemies.splice(enemyIdx, 1);
    
    setDungeon(prev => ({ ...prev, enemies: newEnemies }));
    
    gainExp(info.exp);
    addMessage(`${info.name} derrotado! +${info.exp} XP`, 'death');
    
    const drops = enemy.isBoss ? generateBossDrop(enemy.type, dungeon.level) : generateMaterialDrop(enemy.type, dungeon.level);
    drops.forEach(d => {
      addMaterial(d.type, d.count);
      addMessage(`Botín: ${d.count} ${MATERIAL_TYPES[d.type]?.name}`, 'pickup');
    });

    if(enemy.isBoss) {
      setDungeon(prev => ({ ...prev, bossDefeated: true }));
      addMessage("¡Jefe de piso eliminado!", 'levelup');
    }
    
    setStats(prev => ({ ...prev, kills: prev.kills + 1 }));
    
    return newEnemies; // Retornamos la lista nueva para uso inmediato
  };

  // --- EJECUCIÓN DE HABILIDADES ---
  const executeSkillAction = (skillId, targetEnemy = null) => {
    const skill = SKILLS[skillId];
    if (!skill) return false;

    const level = player.skills?.skillLevels?.[skillId] || 1;
    const { manaCost } = getSkillEffectiveStats(skill, level);

    if (manaCost > 0 && player.mp < manaCost) {
        addMessage(`¡Falta Maná! (Req: ${manaCost})`, 'info');
        effectsManager.current.addText(player.x, player.y, "No MP", '#94a3b8');
        return false;
    }

    const pStats = calculatePlayerStats(player);
    const buffBonuses = calculateBuffBonuses(player.skills.buffs || [], pStats);
    const effectiveStats = {
        ...pStats,
        attack: pStats.attack + buffBonuses.attackBonus,
        defense: pStats.defense + buffBonuses.defenseBonus
    };

    const res = useSkill(skillId, player, effectiveStats, targetEnemy, dungeon.enemies, dungeon.visible);

    if (res.success) {
        soundManager.play('magic');
        if(skill.manaCost) updatePlayer({ mp: player.mp - skill.manaCost });

        const newCooldowns = { ...player.skills.cooldowns, [skillId]: res.cooldown };
        updatePlayer({ skills: { ...player.skills, cooldowns: newCooldowns } });

        if (res.heal) {
            updatePlayer({ hp: Math.min(player.maxHp, player.hp + res.heal) });
            effectsManager.current.addText(player.x, player.y, `+${res.heal}`, '#4ade80');
            effectsManager.current.addSparkles(player.x, player.y, '#4ade80');
        }
        if (res.buff) {
            const newBuffs = [...(player.skills.buffs || []), res.buff];
            updatePlayer({ skills: { ...player.skills, buffs: newBuffs } });
            effectsManager.current.addSparkles(player.x, player.y, '#fbbf24');
            effectsManager.current.addText(player.x, player.y, 'BUFF', '#fbbf24');
        }

        let currentEnemiesList = [...dungeon.enemies];
        if (res.damages && res.damages.length > 0) {
            res.damages.forEach(dmgInfo => {
                const idx = currentEnemiesList.indexOf(dmgInfo.target);
                if (idx !== -1) {
                    const enemy = currentEnemiesList[idx];
                    enemy.hp -= dmgInfo.damage;
                    effectsManager.current.addExplosion(enemy.x, enemy.y, '#a855f7');
                    effectsManager.current.addText(enemy.x, enemy.y, dmgInfo.damage, '#a855f7', true);
                    
                    if (dmgInfo.stun) enemy.stunned = dmgInfo.stun;
                    if (dmgInfo.slow) enemy.slowed = dmgInfo.slow;

                    if (enemy.hp <= 0) {
                        currentEnemiesList = handleEnemyDeath(idx);
                        soundManager.play('kill');
                        effectsManager.current.addExplosion(enemy.x, enemy.y, '#52525b');
                    }
                }
            });
        }

        addMessage(res.message, 'player_damage');
        setSelectedSkill(null);
        executeTurn(player, currentEnemiesList); 
        return true;
    } else {
        addMessage(res.message, 'info');
        return false;
    }
  };

  return { handleEnemyDeath, executeSkillAction };
}