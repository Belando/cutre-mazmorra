using UnityEngine;
using System.Collections.Generic;

namespace DungeonGame
{
    public class DungeonVisualizer : MonoBehaviour
    {
        [Header("Prefabs")]
        public GameObject floorPrefab;
        public GameObject wallPrefab;
        public GameObject wallCornerPrefab;
        public GameObject doorPrefab;
        public GameObject torchPrefab;
        public GameObject stairsPrefab;

        [Header("Settings")]
        public float tileSize = 2f; // Unity units per tile

        // Tracking
        private Dictionary<string, GameObject> entityObjects = new Dictionary<string, GameObject>();
        private GameObject playerObject;
        private DungeonData currentData;

        public void Visualize(DungeonData data)
        {
            currentData = data;
            entityObjects.Clear();

            // Clean up old children if any
            foreach (Transform child in transform) Destroy(child.gameObject);

            int width = data.map.GetLength(0);
            int height = data.map.GetLength(1);


            // 2. Spawn Tiles
            for (int x = 0; x < width; x++)
            {
                for (int y = 0; y < height; y++)
                {
                    TileType type = data.map[x, y];
                    Vector3 pos = new Vector3(x * tileSize, 0, y * tileSize);

                    if (type != TileType.WALL) 
                    {
                        Spawn(floorPrefab, pos, PrimitiveType.Plane, "Floor", new Color(0.8f, 0.8f, 0.8f)); // Light Gray
                    }

                    if (type == TileType.WALL)
                    {
                        // Check Neighbors (N, S, E, W)
                        bool n = IsWall(data.map, x, y + 1);
                        bool s = IsWall(data.map, x, y - 1);
                        bool e = IsWall(data.map, x + 1, y);
                        bool w = IsWall(data.map, x - 1, y);

                        // Spawn Wall
                        GameObject wall = Spawn(wallPrefab, pos + Vector3.up, PrimitiveType.Cube, "Wall", new Color(0.2f, 0.2f, 0.2f)); // Dark Gray
                        
                        // Example rotation based on neighbors (Very simplified)
                         if (n && s && !e && !w) wall.transform.rotation = Quaternion.Euler(0, 90, 0);
                    }
// ... wait, I need to clean this up. 
// Just updating the Spawn calls:

                    else if (type == TileType.DOOR || type == TileType.DOOR_OPEN)
                    {
                        Spawn(doorPrefab, pos, PrimitiveType.Cube, "Door", Color.yellow);
                    }
                    else if (type == TileType.STAIRS)
                    {
                        Spawn(stairsPrefab, pos, PrimitiveType.Cylinder, "Stairs", Color.magenta);
                    }
                }
            }

            // 3. Torches
            for (int x = 1; x < width - 1; x++)
            {
                for (int y = 1; y < height - 1; y++)
                {
                    if (data.map[x, y] == TileType.WALL && data.map[x, y - 1] == TileType.FLOOR)
                    {
                        if (Random.value < 0.1f) // 10% chance
                        {
                            Vector3 pos = new Vector3(x * tileSize, 1.5f, y * tileSize);
                            Spawn(torchPrefab, pos, PrimitiveType.Sphere, "Torch", new Color(1, 0.5f, 0));
                        }
                    }
                }
            }

            // 4. Entities
            if (data.enemies != null)
            {
                foreach(var enemy in data.enemies)
                {
                    GameObject go = GameObject.CreatePrimitive(PrimitiveType.Cube);
                    go.name = enemy.name;
                    go.GetComponent<Renderer>().material.color = Color.red;
                    go.transform.position = new Vector3(enemy.position.x * tileSize, 1, enemy.position.y * tileSize);
                    go.transform.parent = transform;
                    
                    // Track
                    entityObjects[enemy.id] = go;
                }
            }

            // 5. Player Visual
            playerObject = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            playerObject.name = "PlayerVisual";
            playerObject.transform.position = new Vector3(data.player.position.x * tileSize, 1, data.player.position.y * tileSize);
            playerObject.GetComponent<Renderer>().material.color = Color.blue;
            
            // Camera setup
            Camera.main.transform.position = playerObject.transform.position + new Vector3(0, 10, -5);
            Camera.main.transform.LookAt(playerObject.transform.position);
            Camera.main.transform.parent = null; // Detach from player to smooth follow later if needed, but for now simple follow
            // Actually, parenting to player is easiest for strict follow
            Camera.main.transform.parent = playerObject.transform;
            
            entityObjects["player"] = playerObject;
        }

        private void Update()
        {
            if (currentData == null) return;
            
            // Interpolate positions for smoothness? For now, snap to grid to verify logical movement.
            // Update Player
            if (playerObject != null)
            {
                 Vector3 targetPos = new Vector3(currentData.player.position.x * tileSize, 1, currentData.player.position.y * tileSize);
                 playerObject.transform.position = Vector3.Lerp(playerObject.transform.position, targetPos, Time.deltaTime * 10f);
            }

            // Update Enemies
            if (currentData.enemies != null)
            {
                // Remove dead
                List<string> toRemove = new List<string>();
                foreach(var kvp in entityObjects)
                {
                    if (kvp.Key == "player") continue;
                    
                    // Find in data
                    var enemyData = currentData.enemies.Find(e => e.id == kvp.Key);
                    if (enemyData == null || enemyData.isDead)
                    {
                        Destroy(kvp.Value);
                        toRemove.Add(kvp.Key);
                    }
                    else
                    {
                        Vector3 targetPos = new Vector3(enemyData.position.x * tileSize, 1, enemyData.position.y * tileSize);
                        kvp.Value.transform.position = Vector3.Lerp(kvp.Value.transform.position, targetPos, Time.deltaTime * 10f);
                    }
                }
                
                foreach(var key in toRemove) entityObjects.Remove(key);
            }
        }


        private GameObject Spawn(GameObject prefab, Vector3 pos, PrimitiveType primitive, string name, Color? color = null)
        {
            GameObject go;
            if (prefab != null)
            {
                go = Instantiate(prefab, pos, Quaternion.identity, transform);
            }
            else
            {
                go = GameObject.CreatePrimitive(primitive);
                go.transform.position = pos;
                go.transform.parent = transform;
                if (color.HasValue) go.GetComponent<Renderer>().material.color = color.Value;
                // Adjust plane scale if floor
                if (primitive == PrimitiveType.Plane) go.transform.localScale = Vector3.one * 0.2f; // Plane is 10x10 by default
            }
            go.name = name;
            return go;
        }


        private bool IsWall(TileType[,] map, int x, int y)
        {
            if (x < 0 || x >= map.GetLength(0) || y < 0 || y >= map.GetLength(1)) return true; // Edge is wall
            return map[x, y] == TileType.WALL;
        }

    }
}
