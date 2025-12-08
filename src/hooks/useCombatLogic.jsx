import { ENEMY_STATS } from '@/data/enemies';
import { SKILLS, SKILL_COLORS } from '@/data/skills';
import { MATERIAL_TYPES, generateMaterialDrop, generateBossDrop } from "@/engine/systems/CraftingSystem";
import { calculatePlayerStats } from '@/engine/systems/ItemSystem';
import { calculateBuffBonuses, getSkillEffectiveStats, useSkill } from "@/engine/systems/SkillSystem";
import { soundManager } from '@/engine/systems/SoundSystem';

export function useCombatLogic({ 
  dungeon, setDungeon, 
  player, updatePlayer, gainExp, 
  setStats, 
  addMessage, addMaterial, 
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
        // --- NUEVO: EFECTO DE PROYECTIL (Paso 3.2) ---
        // Disparamos la animación antes de aplicar daños
        if (skill.type === 'ranged' && targetEnemy) {
            let projColor = '#fff';
            let projStyle = 'circle';
            
            // Personalización básica según ID o árbol de habilidad
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

        // Sonidos específicos
        if (skillId === 'fireball') soundManager.play('fireball');
        else if (skillId === 'heal') soundManager.play('heal');
        else soundManager.play('magic');
        
        // --- GESTIÓN DE BUFFS E INVISIBILIDAD ---
        let currentBuffs = player.skills?.buffs || [];
        
        // Si la habilidad es ofensiva, rompemos la invisibilidad
        if (['melee', 'ranged', 'aoe', 'ultimate'].includes(skill.type)) {
             currentBuffs = currentBuffs.filter(b => !b.invisible && !b.breaksOnAction);
        }
        
        // Añadir nuevos buffs
        if (res.buff) {
            currentBuffs = [...currentBuffs, res.buff];
            if(effectsManager.current) {
                effectsManager.current.addSparkles(player.x, player.y, '#fbbf24');
                effectsManager.current.addText(player.x, player.y, 'BUFF', '#fbbf24');
            }
        }

        // --- 3. ACTUALIZACIÓN DEL JUGADOR ---
        const updates = {};

        // A) Maná
        if(skill.manaCost) {
            updates.mp = player.mp - skill.manaCost;
        }

        // B) Animaciones
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

        // C) Skills (Cooldowns y Buffs)
        const newSkills = { ...player.skills, buffs: currentBuffs };
        newSkills.cooldowns = { ...newSkills.cooldowns, [skillId]: res.cooldown };
        updates.skills = newSkills;

        // D) Curación
        if (res.heal) {
            updates.hp = Math.min(player.maxHp, player.hp + res.heal);
            if(effectsManager.current) {
                effectsManager.current.addText(player.x, player.y, `+${res.heal}`, '#22c55e');
                effectsManager.current.addSparkles(player.x, player.y, '#4ade80');
            }
        }

        updatePlayer(updates);

        // --- 5. EFECTOS EN ENEMIGOS ---
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
                            true // isSkillHit
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