import { useCallback } from 'react';
import { processEnemyTurn, calculateEnemyDamage } from "@/engine/systems/EnemyAI";
import { calculatePlayerStats } from "@/engine/systems/ItemSystem";
import { ENEMY_STATS } from '@/data/enemies';
import { soundManager } from "@/engine/systems/SoundSystem";

export function useTurnSystem() {
  
  const processTurn = useCallback(({
    dungeon, setDungeon,
    player, setPlayer,
    addMessage,
    setGameOver,
    showFloatingText // <--- RECIBIR LA FUNCIÓN PARA EFECTOS VISUALES
  }) => {
    // 1. Regeneración del Jugador (MP) y Cooldowns
    // Esto ya se maneja en usePlayer.regenerate(), lo llamaremos desde el Engine.

    // 2. IA Enemiga
    const newEnemies = [...dungeon.enemies];
    let playerHit = false;
    let totalDamage = 0;
    
    const pStats = calculatePlayerStats(player);
    
    newEnemies.forEach(enemy => {
      const action = processEnemyTurn(
        enemy, 
        player, 
        dungeon.enemies, 
        dungeon.map, 
        dungeon.visible, 
        addMessage, 
        dungeon.chests,
        dungeon.npcs // <--- CORRECCIÓN: Añadimos este parámetro al final
      );
      
      if (action.action.includes('attack')) {
        const isRanged = action.action === 'ranged_attack';
        // Reducir daño si es a distancia (ejemplo de balance)
        const enemyStats = isRanged ? { ...enemy, attack: Math.floor(enemy.attack * 0.7) } : enemy;
        
        const combatResult = calculateEnemyDamage(
          enemyStats, 
          player, 
          pStats, 
          player.skills.buffs || []
        );
        
        if (combatResult.evaded) {
          addMessage(`Esquivaste a ${ENEMY_STATS[enemy.type].name}`, 'info');
          if (showFloatingText) showFloatingText(player.x, player.y, "Miss", '#94a3b8');
        } else {
          totalDamage += combatResult.damage;
          playerHit = true;
          addMessage(`${ENEMY_STATS[enemy.type].name} te golpea: -${combatResult.damage} HP`, 'enemy_damage');
          if (showFloatingText) showFloatingText(player.x, player.y, `-${combatResult.damage}`, '#dc2626');
        }
      }
    });

    // Aplicar daño al jugador
    if (playerHit) {
      setPlayer(prev => {
        const newHp = prev.hp - totalDamage;
        if (newHp <= 0) {
          setGameOver(true);
          addMessage("Has muerto...", 'death');
          soundManager.play('gameOver');
        }
        return { ...prev, hp: newHp };
      });
    }

    // Actualizar enemigos en el estado del dungeon
    setDungeon(prev => ({ ...prev, enemies: newEnemies }));

  }, []);

  return { processTurn };
}