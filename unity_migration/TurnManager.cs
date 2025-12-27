using UnityEngine;
using System.Collections.Generic;
using System.Linq;

namespace DungeonGame
{
    public class TurnManager : MonoBehaviour
    {
        private static TurnManager _instance;
        public static TurnManager Instance
        {
            get
            {
                if (_instance == null)
                {
                    _instance = FindFirstObjectByType<TurnManager>();
                    if (_instance == null)
                    {
                        // Optional: Create if missing, but usually GameController manages lifecycle
                        // GameObject go = new GameObject("TurnManager");
                        // _instance = go.AddComponent<TurnManager>();
                    }
                }
                return _instance;
            }
        }

        private DungeonData dungeon;

        private void Awake()
        {
            if (_instance != null && _instance != this)
            {
                Destroy(gameObject);
                return;
            }
            _instance = this;
        }

        public void Initialize(DungeonData dungeonData)
        {
            this.dungeon = dungeonData;
        }

        public DungeonData GetDungeon() => this.dungeon;


        public void MovePlayer(Vector2Int moveDir)
        {
            if (dungeon == null || dungeon.player == null) return;
            
            // 1. Player Move Logic
            Vector2Int targetPos = dungeon.player.position + moveDir;

            // 1. Check Walls and Bounds
            if (IsWalkable(targetPos))
            {
                // Check Enemy
                EntityData enemy = GetEnemyAt(targetPos);
                if (enemy != null)
                {
                    // Attack
                    var result = CombatSystem.Instance.CalculateMeleeDamage(dungeon.player, enemy);
                    CombatSystem.Instance.ApplyDamage(enemy, result.damage);
                    Debug.Log($"Player hit {enemy.name} for {result.damage} damage! ({enemy.hp} HP left)");

                    if (enemy.isDead)
                    {
                        Debug.Log($"{enemy.name} died!");
                        QuestSystem.Instance.CheckProgress(dungeon.player, QuestType.Kill, "SKELETON");
                        
                        // XP & Level Up
                        dungeon.player.xp += 20; // Hardcoded per enemy for now
                        UIManager.Instance.LogMessage("Gained 20 XP!");
                        if (dungeon.player.xp >= dungeon.player.xpToNextLevel)
                        {
                            ClassSystem.LevelUp(dungeon.player);
                        }
                    }
                }
                else
                {
                    // Move
                    dungeon.player.position = targetPos;
                    // Check items on floor?
                }
            }
        }

        public void ProcessEnemiesRealtime()
        {
             if (dungeon == null || dungeon.enemies == null) return;

             // Find player pos
             Vector2Int playerPos = dungeon.player.position;

             foreach (var enemy in dungeon.enemies)
             {
                 if (enemy.isDead) continue; 
                 
                 // Use Advanced AI
                 EnemyAction action = EnemyAI.DecideTurn(enemy, dungeon.player, dungeon);

                 if (action.type == EnemyActionType.Move)
                 {
                     enemy.position = action.targetPos;
                 }
                 else if (action.type == EnemyActionType.Attack)
                 {
                     var result = CombatSystem.Instance.CalculateMeleeDamage(enemy, dungeon.player);
                     CombatSystem.Instance.ApplyDamage(dungeon.player, result.damage);
                     // Visualizing attack?
                     Debug.Log($"Enemy {enemy.name} hit Player for {result.damage}!");
                 }
                 // Wait does nothing
             }
            Debug.Log("Turn Complete");
        }

        private bool IsWalkable(Vector2Int position)
        {
            // Bound Check
            if (position.x < 0 || position.x >= dungeon.map.GetLength(0) || position.y < 0 || position.y >= dungeon.map.GetLength(1))
                return false;
                
            // Wall Check
            if (dungeon.map[position.x, position.y] == TileType.WALL)
                return false;
             
             // Check entities (Player or other Enemies) - optional depending on if we want to walk through them
             // Usually blocked by enemies
            if (dungeon.enemies.Any(e => !e.isDead && e.position == position)) return false;
            if (dungeon.player.position == position) return false;

            return true;
        }

        private EntityData GetEnemyAt(Vector2Int position)
        {
            return dungeon.enemies.FirstOrDefault(e => e.position == position);
        }
    }
}
