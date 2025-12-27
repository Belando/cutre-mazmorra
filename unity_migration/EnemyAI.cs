using UnityEngine;
using System.Collections.Generic;
using System.Linq;

namespace DungeonGame
{
    public enum AIBehavior
    {
        Aggressive,
        Cautious,
        Pack,
        Ambush,
        Boss
    }

    public enum EnemyActionType { Move, Attack, Wait }

    public struct EnemyAction
    {
        public EnemyActionType type;
        public Vector2Int targetPos; // For Move
    }

    public static class EnemyAI
    {
        // Configuration
        private static Dictionary<EntityType, AIBehavior> BehaviorMap = new Dictionary<EntityType, AIBehavior>
        {
            { EntityType.RAT, AIBehavior.Pack },
            { EntityType.SLIME, AIBehavior.Pack }, // Assuming Pack
            { EntityType.GOBLIN, AIBehavior.Aggressive },
            { EntityType.ORC, AIBehavior.Aggressive },
            { EntityType.SKELETON, AIBehavior.Aggressive },
            { EntityType.SPECTRE, AIBehavior.Cautious },
            { EntityType.DRAGON, AIBehavior.Boss },
            { EntityType.BOSS_GOBLIN_KING, AIBehavior.Boss }
        };

        // Added missing Patch for 'Packing' typo or just map to Pack
        // Fixed:
        
        public static AIBehavior GetBehavior(EntityType type)
        {
            if (BehaviorMap.ContainsKey(type)) return BehaviorMap[type];
            return AIBehavior.Aggressive;
        }

        public static EnemyAction DecideTurn(EntityData enemy, PlayerData player, DungeonData dungeon)
        {
            AIBehavior behavior = GetBehavior(enemy.type);
            int dist = ManhattanDistance(enemy.position, player.position);
            
            // Activation Range
            int activationRange = (behavior == AIBehavior.Boss) ? 40 : 15;
            if (dist > activationRange) return new EnemyAction { type = EnemyActionType.Wait };

            // Melee Attack Check (Range 1)
            if (dist == 1)
            {
                return new EnemyAction { type = EnemyActionType.Attack, targetPos = player.position };
            }

            Vector2Int nextPos = enemy.position;

            switch (behavior)
            {
                case AIBehavior.Aggressive:
                    return MoveToward(enemy, player.position, dungeon);

                case AIBehavior.Cautious:
                    // If too close, flee. If too far, approach. If medium, maybe strafe?
                    if (dist <= 2) return MoveAway(enemy, player.position, dungeon);
                    else if (dist > 6) return MoveToward(enemy, player.position, dungeon);
                    else
                    {
                        // Strafe or Wait
                        if (Random.value < 0.5f) return MoveRandomly(enemy, dungeon); // Simplified strafe
                        return new EnemyAction { type = EnemyActionType.Wait };
                    }

                case AIBehavior.Pack:
                    // If allies nearby, aggressive. If alone, maybe retreat to ally?
                    // Simplified Pack: Try to flank.
                    // Check if another enemy is adjacent to player
                    bool allyEngaged = dungeon.enemies.Any(e => e != enemy && !e.isDead && ManhattanDistance(e.position, player.position) == 1);
                    if (allyEngaged)
                    {
                        // Flank: Try to move to opposite side
                        Vector2Int flankPos = GetFlankingPos(player.position, enemy.position, dungeon);
                        if (flankPos != enemy.position) return MoveTowardPos(enemy, flankPos, dungeon);
                    }
                    return MoveToward(enemy, player.position, dungeon);

                case AIBehavior.Ambush:
                    if (dist <= 3) return MoveToward(enemy, player.position, dungeon); // Only move if close
                    return new EnemyAction { type = EnemyActionType.Wait };

                case AIBehavior.Boss:
                    // Mix of behaviors
                    if (dist < 3 && Random.value < 0.3f) return MoveAway(enemy, player.position, dungeon);
                    return MoveToward(enemy, player.position, dungeon);
            }

            return new EnemyAction { type = EnemyActionType.Wait };
        }

        // --- Movement Logic ---

        private static EnemyAction MoveToward(EntityData enemy, Vector2Int target, DungeonData dungeon)
        {
            // Simple approach: try X then Y
            Vector2Int diff = target - enemy.position;
            Vector2Int moveX = new Vector2Int(System.Math.Sign(diff.x), 0);
            Vector2Int moveY = new Vector2Int(0, System.Math.Sign(diff.y));

            // Prioritize axis with larger distance
            Vector2Int p1 = (Mathf.Abs(diff.x) > Mathf.Abs(diff.y)) ? moveX : moveY;
            Vector2Int p2 = (Mathf.Abs(diff.x) > Mathf.Abs(diff.y)) ? moveY : moveX;

            if (p1 != Vector2Int.zero && IsWalkable(enemy.position + p1, dungeon)) 
                return new EnemyAction { type = EnemyActionType.Move, targetPos = enemy.position + p1 };
            
            if (p2 != Vector2Int.zero && IsWalkable(enemy.position + p2, dungeon)) 
                return new EnemyAction { type = EnemyActionType.Move, targetPos = enemy.position + p2 };

            return new EnemyAction { type = EnemyActionType.Wait };
        }

        private static EnemyAction MoveTowardPos(EntityData enemy, Vector2Int specificPos, DungeonData dungeon)
        {
             // Same as above but specific target
             return MoveToward(enemy, specificPos, dungeon);
        }

        private static EnemyAction MoveAway(EntityData enemy, Vector2Int target, DungeonData dungeon)
        {
            Vector2Int diff = enemy.position - target; // Away vector
            Vector2Int moveX = new Vector2Int(System.Math.Sign(diff.x), 0);
            Vector2Int moveY = new Vector2Int(0, System.Math.Sign(diff.y));

             // Prioritize axis
            Vector2Int p1 = (Mathf.Abs(diff.x) > Mathf.Abs(diff.y)) ? moveX : moveY;
            Vector2Int p2 = (Mathf.Abs(diff.x) > Mathf.Abs(diff.y)) ? moveY : moveX;
            
            if (p1 != Vector2Int.zero && IsWalkable(enemy.position + p1, dungeon)) 
                return new EnemyAction { type = EnemyActionType.Move, targetPos = enemy.position + p1 };
             if (p2 != Vector2Int.zero && IsWalkable(enemy.position + p2, dungeon)) 
                return new EnemyAction { type = EnemyActionType.Move, targetPos = enemy.position + p2 };

            return new EnemyAction { type = EnemyActionType.Wait };
        }

        private static EnemyAction MoveRandomly(EntityData enemy, DungeonData dungeon)
        {
             Vector2Int[] dirs = { Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right };
             Vector2Int dir = dirs[Random.Range(0, 4)];
             if (IsWalkable(enemy.position + dir, dungeon))
                return new EnemyAction { type = EnemyActionType.Move, targetPos = enemy.position + dir };
             return new EnemyAction { type = EnemyActionType.Wait };
        }

        private static Vector2Int GetFlankingPos(Vector2Int target, Vector2Int flanker, DungeonData dungeon)
        {
            // Ideally opposite to flanker is difficult to know without knowing WHO handles the other side.
            // Simplified: Just pick a random adjacent spot to target that is valid
            Vector2Int[] dirs = { Vector2Int.up, Vector2Int.down, Vector2Int.left, Vector2Int.right };
            foreach(var d in dirs)
            {
                Vector2Int pos = target + d;
                if (IsWalkable(pos, dungeon)) return pos;
            }
            return target;
        }

        private static bool IsWalkable(Vector2Int pos, DungeonData dungeon)
        {
            if (pos.x < 0 || pos.y < 0 || pos.x >= dungeon.map.GetLength(0) || pos.y >= dungeon.map.GetLength(1)) return false;
            if (dungeon.map[pos.x, pos.y] == TileType.WALL) return false;
            
            // Check entities (Player or other Enemies)
            if (dungeon.player.position == pos) return false; // Although Attack logic checks this, Move logic shouldn't step over
            if (dungeon.enemies.Any(e => !e.isDead && e.position == pos)) return false;

            return true;
        }

        private static int ManhattanDistance(Vector2Int a, Vector2Int b)
        {
            return Mathf.Abs(a.x - b.x) + Mathf.Abs(a.y - b.y);
        }
    }
}
