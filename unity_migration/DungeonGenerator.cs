using UnityEngine;
using System.Collections.Generic;
using System.Linq;

namespace DungeonGame
{
    public static class DungeonGenerator
    {
        private const int MIN_LEAF_SIZE = 8;
        private const int MAX_LEAF_SIZE = 22;
        private const int ROOM_PADDING = 1;

        public static DungeonData Generate(int width, int height, int level, int playerLevel = 1)
        {
            // 1. Initialize Map
            TileType[,] map = new TileType[width, height];
            for (int x = 0; x < width; x++)
            for (int y = 0; y < height; y++)
                map[x, y] = TileType.WALL;

            // 2. BSP
            BSPNode root = new BSPNode(0, 0, width, height);
            List<BSPNode> nodes = new List<BSPNode> { root };

            bool didSplit = true;
            while (didSplit)
            {
                didSplit = false;
                var leaves = root.GetLeaves();
                foreach (var leaf in leaves)
                {
                    if (leaf.width > MAX_LEAF_SIZE || leaf.height > MAX_LEAF_SIZE || Random.value > 0.25f)
                    {
                        if (leaf.Split())
                        {
                            nodes.Add(leaf.leftChild);
                            nodes.Add(leaf.rightChild);
                            didSplit = true;
                        }
                    }
                }
            }

            root.CreateRooms();

            // 3. Draw Rooms
            List<Room> rooms = new List<Room>();
            foreach (var leaf in root.GetLeaves())
            {
                if (leaf.room != null)
                {
                    Room r = leaf.room.Value;
                    rooms.Add(r);
                    for (int x = r.x; x < r.x + r.width; x++)
                    for (int y = r.y; y < r.y + r.height; y++)
                    {
                        if (x >= 0 && x < width && y >= 0 && y < height)
                            map[x, y] = TileType.FLOOR;
                    }
                }
            }

            // 4. Corridors
            CreateCorridors(root, map, width, height);

            // 5. Doors
            PlaceDoors(map, rooms, width, height);

            // 6. Points of Interest
            Vector2Int playerStart = rooms[0].Center;
            Vector2Int stairsDown = rooms[rooms.Count - 1].Center;
            map[stairsDown.x, stairsDown.y] = TileType.STAIRS;

            Vector2Int? stairsUp = null;
            if (level > 1)
            {
                stairsUp = new Vector2Int(rooms[0].x + 1, rooms[0].y + 1);
                map[stairsUp.Value.x, stairsUp.Value.y] = TileType.STAIRS_UP;
            }


            // 7. Torches (Simplified)
            List<Vector2Int> torches = new List<Vector2Int>();
            
            // 8. Entities (Enemies)
            List<EntityData> enemies = new List<EntityData>();
            // Get available enemies based on level
            var enemyTypes = GameConstants.EnemyTemplates.Keys.ToList();
            
            for (int i = 1; i < rooms.Count; i++) // Skip first room
            {
                if (Random.value < 0.6f)
                {
                    // Pick Random Type
                    EntityType type = enemyTypes[Random.Range(0, enemyTypes.Count)];
                    
                    // Clone Data
                    EntityData template = GameConstants.EnemyTemplates[type];
                    EntityData enemy = new EntityData
                    {
                        id = System.Guid.NewGuid().ToString(),
                        name = template.name,
                        type = template.type,
                        position = rooms[i].Center,
                        hp = template.hp,
                        baseStats = new Stats 
                        { 
                            maxHp = template.baseStats.maxHp,
                            attack = template.baseStats.attack,
                            defense = template.baseStats.defense,
                            speed = template.baseStats.speed
                        },
                        isBoss = template.isBoss
                    };
                    
                    // Simple Level Scaling
                    if (level > 1)
                    {
                         enemy.baseStats.maxHp += (level * 2);
                         enemy.baseStats.attack += level;
                         enemy.hp = enemy.baseStats.maxHp;
                    }
                    
                    enemies.Add(enemy);
                }
            }

            // Return Data
            DungeonData data = new DungeonData
            {
                level = level,
                map = map,
                entityMap = new EntityType[width, height],
                rooms = rooms,
                player = new PlayerData 
                { 
                    id = "player",
                    name = "Hero", 
                    type = EntityType.PLAYER, 
                    position = playerStart,
                    hp = 100, 
                    baseStats = new Stats() // Will be overwritten by ClassSystem
                },
                stairsDown = stairsDown,
                // stairsUp = stairsUp, // Removed from new struct or implicit? Checking GameTypes... handled below
                enemies = enemies,
                groundItems = new List<ItemData>()
            };

            return data;
        }

        private static void CreateCorridors(BSPNode node, TileType[,] map, int width, int height)
        {
            if (node.leftChild != null && node.rightChild != null)
            {
                CreateCorridors(node.leftChild, map, width, height);
                CreateCorridors(node.rightChild, map, width, height);

                Room? lRoom = node.leftChild.GetRoom();
                Room? rRoom = node.rightChild.GetRoom();

                if (lRoom.HasValue && rRoom.HasValue)
                {
                    Vector2Int p1 = lRoom.Value.Center;
                    Vector2Int p2 = rRoom.Value.Center;

                    if (Random.value > 0.5f)
                    {
                        CarveH(map, p1.x, p2.x, p1.y, width, height);
                        CarveV(map, p1.y, p2.y, p2.x, width, height);
                    }
                    else
                    {
                        CarveV(map, p1.y, p2.y, p1.x, width, height);
                        CarveH(map, p1.x, p2.x, p2.y, width, height);
                    }
                }
            }
        }

        private static void CarveH(TileType[,] map, int x1, int x2, int y, int width, int height)
        {
            for (int x = Mathf.Min(x1, x2); x <= Mathf.Max(x1, x2); x++)
                if (x >= 0 && x < width && y >= 0 && y < height) map[x, y] = TileType.FLOOR;
        }

        private static void CarveV(TileType[,] map, int y1, int y2, int x, int width, int height)
        {
            for (int y = Mathf.Min(y1, y2); y <= Mathf.Max(y1, y2); y++)
                if (x >= 0 && x < width && y >= 0 && y < height) map[x, y] = TileType.FLOOR;
        }

        private static void PlaceDoors(TileType[,] map, List<Room> rooms, int width, int height)
        {
            foreach (var room in rooms)
            {
                // Check walls N, S, E, W
                CheckDoor(map, room.Center.x, room.y - 1, width, height);
                CheckDoor(map, room.Center.x, room.y + room.height, width, height);
                CheckDoor(map, room.x - 1, room.Center.y, width, height);
                CheckDoor(map, room.x + room.width, room.Center.y, width, height);
            }
        }

        private static void CheckDoor(TileType[,] map, int x, int y, int width, int height)
        {
            if (x < 1 || x >= width - 1 || y < 1 || y >= height - 1) return;
            
            if (map[x, y] == TileType.FLOOR)
            {
                // Check if it's a doorway spot (Wall-Floor-Wall pattern)
                bool horizontal = (map[x-1, y] == TileType.WALL && map[x+1, y] == TileType.WALL);
                bool vertical = (map[x, y-1] == TileType.WALL && map[x, y+1] == TileType.WALL);

                if (horizontal || vertical)
                {
                    map[x, y] = TileType.DOOR;
                }
            }
        }
    }

    public class BSPNode
    {
        public int x, y, width, height;
        public BSPNode leftChild, rightChild;
        public Room? room;

        public BSPNode(int x, int y, int width, int height)
        {
            this.x = x; this.y = y; this.width = width; this.height = height;
        }

        public bool Split()
        {
            if (leftChild != null) return false;

            bool splitH = Random.value > 0.5f;
            if (width > height && width / height >= 1.25) splitH = false;
            else if (height > width && height / width >= 1.25) splitH = true;

            int max = (splitH ? height : width) - 8; // MIN_LEAF_SIZE
            if (max <= 8) return false;

            int splitPos = Random.Range(8, max);

            if (splitH)
            {
                leftChild = new BSPNode(x, y, width, splitPos);
                rightChild = new BSPNode(x, y + splitPos, width, height - splitPos);
            }
            else
            {
                leftChild = new BSPNode(x, y, splitPos, height);
                rightChild = new BSPNode(x + splitPos, y, width - splitPos, height);
            }
            return true;
        }

        public void CreateRooms()
        {
            if (leftChild != null || rightChild != null)
            {
                leftChild?.CreateRooms();
                rightChild?.CreateRooms();
            }
            else
            {
                int minSize = 4;
                int w = Random.Range(minSize, width - 2);
                int h = Random.Range(minSize, height - 2);
                int rx = x + Random.Range(1, width - w - 1);
                int ry = y + Random.Range(1, height - h - 1);
                room = new Room { x = rx, y = ry, width = w, height = h };
            }
        }

        public Room? GetRoom()
        {
            if (room != null) return room;
            return leftChild?.GetRoom() ?? rightChild?.GetRoom();
        }

        public List<BSPNode> GetLeaves()
        {
            if (leftChild == null && rightChild == null) return new List<BSPNode> { this };
            var list = new List<BSPNode>();
            if (leftChild != null) list.AddRange(leftChild.GetLeaves());
            if (rightChild != null) list.AddRange(rightChild.GetLeaves());
            return list;
        }
    }
}
