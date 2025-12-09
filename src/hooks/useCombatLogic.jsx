import { ENEMY_STATS } from '@/data/enemies';
import { SKILLS, SKILL_COLORS } from '@/data/skills';
import { generateMaterialDrop, generateBossDrop } from "@/engine/systems/CraftingSystem";
import { calculatePlayerStats, generateItem } from '@/engine/systems/ItemSystem'; // Importamos generateItem
import { calculateBuffBonuses, getSkillEffectiveStats, useSkill } from "@/engine/systems/SkillSystem";
import { soundManager } from '@/engine/systems/SoundSystem';

export function useCombatLogic({ 
  dungeon, setDungeon, 
  player, updatePlayer, gainExp, 
  setStats, 
  addMessage, addItem, // Recibimos addItem
  effectsManager, 
  executeTurn, 
  setSelectedSkill
}) {

  // --- MANEJO DE MUERTE DE ENEMIGOS ---
  const handleEnemyDeath = (enemyIdx) => {
    const enemy = dungeon.enemies[enemyIdx];
    if (!enemy) return dungeon.enemies;

    const info = ENEMY_STATS[enemy.type];
    const newEnemies = [...dungeon.enemies];
    newEnemies.splice(enemyIdx, 1);
    setDungeon(prev => ({ ...prev, enemies: newEnemies }));
    gainExp(info.exp);
    addMessage(`${info.name} derrotado! +${info.exp} XP`, 'death');
    
    // 1. Drops de Materiales (Crafteo)
    const drops = enemy.isBoss ? generateBossDrop(enemy.type, dungeon.level) : generateMaterialDrop(enemy.type, dungeon.level);
    
    // 2. Drop de Equipo/Consumibles (Probabilidad del 15% para enemigos normales, 100% bosses)
    if (Math.random() < 0.15 || enemy.isBoss) {
        const lootItem = generateItem(dungeon.level);
        if (lootItem) drops.push(lootItem);
    }

    // 3. Procesar Drops
    drops.forEach(item => {
      // Usamos addItem para meterlo al inventario
      const success = addItem(item); 
      if (success) {
          addMessage(`Botín: ${item.quantity || 1}x ${item.name}`, 'pickup');
      } else {
          addMessage(`Inventario lleno, no pudiste recoger ${item.name}`, 'info');
      }
    });
    
    if(enemy.isBoss) {
      setDungeon(prev => ({ ...prev, bossDefeated: true }));
      addMessage("¡Jefe de piso eliminado!", 'levelup');
    }
    setStats(prev => ({ ...prev, kills: prev.kills + 1 }));
    return newEnemies;
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

    const res = useSkill(skillId, player, effectiveStats, targetEnemy, dungeon.enemies, dungeon.visible, dungeon.map);

    if (res.success) {
        // Efecto de proyectil
        if (skill.type === 'ranged' && targetEnemy) {
            let projColor = '#fff';
            let projStyle = 'circle';
            
            if (skillId === 'fireball') { projColor = '#f97316'; projStyle = 'circle'; }
            else if (skillId === 'ice_shard') { projColor = '#06b6d4'; projStyle = 'circle'; }
            else if (skillId === 'throwing_knife' || skillId === 'multishot') { projColor = '#cbd5e1'; projStyle = 'arrow'; }
            else if (skill.tree === 'mage' || skill.tree === 'arcane') { projColor = '#a855f7'; projStyle = 'circle'; }
            else if (skill.tree === 'archer') { projColor = '#f59e0b'; projStyle = 'arrow'; }

            if (effectsManager.current) {
                effectsManager.current.addProjectile(
                    player.x, player.y, 
                    targetEnemy.x, targetEnemy.y, 
                    projColor, 
                    projStyle
                );
            }
        }

        if (skillId === 'fireball') soundManager.play('fireball');
        else if (skillId === 'heal') soundManager.play('heal');
        else soundManager.play('magic');
        
        let currentBuffs = player.skills?.buffs || [];
        
        if (['melee', 'ranged', 'aoe', 'ultimate'].includes(skill.type)) {
             currentBuffs = currentBuffs.filter(b => !b.invisible && !b.breaksOnAction);
        }
        
        if (res.buff) {
            currentBuffs = [...currentBuffs, res.buff];
            if(effectsManager.current) {
                effectsManager.current.addSparkles(player.x, player.y, '#fbbf24');
                effectsManager.current.addText(player.x, player.y, 'BUFF', '#fbbf24');
            }
        }

        const updates = {};

        if(skill.manaCost) {
            updates.mp = player.mp - skill.manaCost;
        }

        if (skill.type === 'melee' && targetEnemy) {
            updates.lastAttackTime = Date.now();
            updates.lastSkillId = skillId;
            updates.lastAttackDir = { x: targetEnemy.x - player.x, y: targetEnemy.y - player.y };
        } else {
            updates.lastSkillTime = Date.now();
            updates.lastSkillId = skillId;
            if (targetEnemy) {
                updates.lastAttackDir = { x: targetEnemy.x - player.x, y: targetEnemy.y - player.y };
            }
        }

        const newSkills = { ...player.skills, buffs: currentBuffs };
        newSkills.cooldowns = { ...newSkills.cooldowns, [skillId]: res.cooldown };
        updates.skills = newSkills;

        if (res.heal) {
            updates.hp = Math.min(player.maxHp, player.hp + res.heal);
            if(effectsManager.current) {
                effectsManager.current.addText(player.x, player.y, `+${res.heal}`, '#22c55e');
                effectsManager.current.addSparkles(player.x, player.y, '#4ade80');
            }
        }

        updatePlayer(updates);

        let currentEnemiesList = [...dungeon.enemies];
        if (res.damages && res.damages.length > 0) {
            let damageColor = SKILL_COLORS[skillId] || SKILL_COLORS.default;

            if (skillId === 'power_strike') {
                damageColor = '#ffffff';
            }

            res.damages.forEach(dmgInfo => {
                const idx = currentEnemiesList.indexOf(dmgInfo.target);
                if (idx !== -1) {
                    const enemy = currentEnemiesList[idx];
                    enemy.hp -= dmgInfo.damage;
                    
                    if(effectsManager.current) {
                        const explosionColor = skillId === 'fireball' ? '#f97316' : (skillId === 'power_strike' || skillId === 'shield_bash' ? '#ffffff' : '#a855f7');
                        effectsManager.current.addExplosion(enemy.x, enemy.y, explosionColor);
                        
                        const isCritical = dmgInfo.isCrit || false;
                        const finalColor = isCritical ? '#fef9c3' : damageColor;
                        const textToShow = isCritical ? `${dmgInfo.damage}!` : dmgInfo.damage;
                        
                        effectsManager.current.addText(
                            enemy.x, enemy.y, 
                            textToShow, 
                            finalColor, 
                            isCritical, 
                            false, 
                            true 
                        );
                        
                        if (isCritical) effectsManager.current.addShake(5);
                    }
                    
                    if (dmgInfo.stun) {
                        enemy.stunned = dmgInfo.stun;
                        if(effectsManager.current) {
                            effectsManager.current.addStunEffect(enemy.x, enemy.y);
                        }
                    }
                    
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