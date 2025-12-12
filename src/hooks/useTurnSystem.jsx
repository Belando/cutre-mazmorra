// src/hooks/useTurnSystem.jsx
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
    showFloatingText,
    spatialHash // <--- RECIBIMOS EL SPATIAL HASH AQUÍ
  }) => {
    
    // 1. RECONSTRUIR HASH
    // Antes de que los enemigos piensen, actualizamos el mapa espacial con el estado actual
    if (spatialHash) {
      spatialHash.rebuild({
        player,
        enemies: dungeon.enemies,
        chests: dungeon.chests,
        npcs: dungeon.npcs,
        items: dungeon.items
      });
    }

    // 2. IA Enemiga
    // Creamos una copia nueva para asegurar reactividad y no mutar el estado directamente durante el loop
    const newEnemies = dungeon.enemies.map(e => ({ ...e }));
    let playerHit = false;
    let totalDamage = 0;
    
    const pStats = calculatePlayerStats(player);
    
    newEnemies.forEach(enemy => {
      const action = processEnemyTurn(
        enemy, 
        player, 
        newEnemies, 
        dungeon.map, 
        dungeon.visible, 
        addMessage, 
        spatialHash // <--- Pasamos el hash actualizado a la IA
      );
      
      if (action.action.includes('attack')) {
        enemy.lastAttackTime = Date.now();
        enemy.lastAttackDir = { 
            x: player.x - enemy.x, 
            y: player.y - enemy.y 
        };

        const isRanged = action.action === 'ranged_attack';
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
          
          // --- CAMBIO: Sonido específico de recibir daño ---
          soundManager.play('enemy_hit'); 
          // ------------------------------------------------
          
          if (showFloatingText) showFloatingText(player.x, player.y, `${combatResult.damage}`, '#dc2626', false, true);
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