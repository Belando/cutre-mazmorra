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

    // --- 1. Validaciones ---
    const level = player.skills?.skillLevels?.[skillId] || 1;
    const { manaCost } = getSkillEffectiveStats(skill, level);

    if (manaCost > 0 && player.mp < manaCost) {
        addMessage(`¡Falta Maná! (Req: ${manaCost})`, 'info');
        if(effectsManager.current) effectsManager.current.addText(player.x, player.y, "No MP", '#94a3b8');
        return false;
    }

    // --- 2. Cálculos de Combate ---
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
        
        // --- 3. PREPARAR ACTUALIZACIÓN ÚNICA DEL JUGADOR ---
        const updates = {};

        // A) Maná
        if(skill.manaCost) {
            updates.mp = player.mp - skill.manaCost;
        }

        // B) Animaciones
        if (skill.type === 'melee' && targetEnemy) {
            updates.lastAttackTime = Date.now();
            updates.lastAttackDir = { x: targetEnemy.x - player.x, y: targetEnemy.y - player.y };
        } else {
            updates.lastSkillTime = Date.now();
            updates.lastSkillId = skillId;
            if (targetEnemy) {
                updates.lastAttackDir = { x: targetEnemy.x - player.x, y: targetEnemy.y - player.y };
            }
        }

        // C) Skills (Cooldowns y Buffs combinados)
        // Clonamos skills para no perder datos entre actualizaciones parciales
        const newSkills = { ...player.skills };
        
        // Aplicar Cooldown
        newSkills.cooldowns = { ...newSkills.cooldowns, [skillId]: res.cooldown };
        
        // Aplicar Buff si existe
        if (res.buff) {
            newSkills.buffs = [...(newSkills.buffs || []), res.buff];
            if(effectsManager.current) {
                effectsManager.current.addSparkles(player.x, player.y, '#fbbf24');
                effectsManager.current.addText(player.x, player.y, 'BUFF', '#fbbf24');
            }
        }
        updates.skills = newSkills;

        // D) Curación
        if (res.heal) {
            updates.hp = Math.min(player.maxHp, player.hp + res.heal);
            if(effectsManager.current) {
                effectsManager.current.addText(player.x, player.y, `+${res.heal}`, '#4ade80');
                effectsManager.current.addSparkles(player.x, player.y, '#4ade80');
            }
        }

        // --- 4. APLICAR TODOS LOS CAMBIOS DE GOLPE ---
        updatePlayer(updates);

        // --- 5. Efectos en Enemigos ---
        let currentEnemiesList = [...dungeon.enemies];
        if (res.damages && res.damages.length > 0) {
            res.damages.forEach(dmgInfo => {
                const idx = currentEnemiesList.indexOf(dmgInfo.target);
                if (idx !== -1) {
                    const enemy = currentEnemiesList[idx];
                    enemy.hp -= dmgInfo.damage;
                    
                    if(effectsManager.current) {
                        effectsManager.current.addExplosion(enemy.x, enemy.y, '#a855f7');
                        effectsManager.current.addText(enemy.x, enemy.y, dmgInfo.damage, '#a855f7', true);
                    }
                    
                    if (dmgInfo.stun) enemy.stunned = dmgInfo.stun;
                    if (dmgInfo.slow) enemy.slowed = dmgInfo.slow;

                    if (enemy.hp <= 0) {
                        currentEnemiesList = handleEnemyDeath(idx);
                        soundManager.play('kill');
                        if(effectsManager.current) effectsManager.current.addExplosion(enemy.x, enemy.y, '#52525b');
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