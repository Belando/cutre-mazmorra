import { SKILLS } from '@/data/skills';
import { ENEMY_STATS } from '@/data/enemies';
import { soundManager } from "@/engine/systems/SoundSystem";
import { calculatePlayerHit } from '@/engine/systems/CombatSystem';
import { hasLineOfSight } from '@/engine/core/utils';

export function useCombatActions(context) {
  const {
      player, updatePlayer,
      dungeon, setDungeon,
      addMessage, effectsManager,
      executeSkillAction: coreExecuteSkillAction, 
      handleEnemyDeath
  } = context;

  const performAttack = (enemy, enemyIdx) => {
      const currentBuffs = player.skills?.buffs || [];
      const newBuffs = currentBuffs.filter(b => !b.invisible && !b.breaksOnAction);
      
      updatePlayer({ 
          lastAttackTime: Date.now(),
          lastAttackDir: { x: enemy.x - player.x, y: enemy.y - player.y },
          lastSkillId: null,
          skills: { ...player.skills, buffs: newBuffs }
      });

      const { damage, isCrit } = calculatePlayerHit(player, enemy);
      
      soundManager.play(isCrit ? 'critical' : 'attack');
      if (effectsManager.current) {
          effectsManager.current.addBlood(enemy.x, enemy.y);
          effectsManager.current.addText(enemy.x, enemy.y, damage, isCrit ? '#ef4444' : '#fff', isCrit);
          effectsManager.current.addShake(isCrit ? 10 : 3);
      }

      const nextEnemies = [...dungeon.enemies];
      nextEnemies[enemyIdx] = { ...enemy, hp: enemy.hp - damage };
      
      addMessage(`Golpeas a ${ENEMY_STATS[enemy.type].name}: ${damage}`, 'player_damage');
      
      if (nextEnemies[enemyIdx].hp <= 0) {
          soundManager.play('kill');
          if (effectsManager.current) {
              effectsManager.current.addExplosion(enemy.x, enemy.y, '#52525b'); 
          }
          return handleEnemyDeath(enemyIdx); 
      }
      
      return nextEnemies;
  };

  const executeSkillActionWrapper = (skillId, targetEnemy = null) => {
      const skill = SKILLS[skillId];
      if (!skill) return false;

      if (skill.type === 'ranged' && !targetEnemy) {
          let bestTarget = null;
          let minDist = Infinity;

          dungeon.enemies.forEach(e => {
              const dist = Math.abs(e.x - player.x) + Math.abs(e.y - player.y);
              if (
                  dist <= (skill.range || 5) && 
                  dungeon.visible[e.y]?.[e.x] &&
                  hasLineOfSight(dungeon.map, player.x, player.y, e.x, e.y) 
              ) {
                  if (dist < minDist) {
                      minDist = dist;
                      bestTarget = e;
                  }
              }
          });

          if (bestTarget) {
              targetEnemy = bestTarget;
          } else {
              addMessage("¡No hay enemigos en rango!", 'info');
              soundManager.play('error'); // Sonido
              if (effectsManager.current) {
                  effectsManager.current.addText(player.x, player.y, "?", '#94a3b8');
              }
              return false;
          }
      }

      return coreExecuteSkillAction(skillId, targetEnemy);
  };

  return { performAttack, executeSkillAction: executeSkillActionWrapper };
}
