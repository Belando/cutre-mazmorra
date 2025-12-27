using UnityEngine;

using System.Collections.Generic;
using UnityEngine.InputSystem;

namespace DungeonGame
{
    public class GameController : MonoBehaviour
    {
        [Header("Settings")]
        public bool generateOnStart = true;
        public int dungeonWidth = 40;
        public int dungeonHeight = 40;
        public int dungeonLevel = 1;

        [Header("References")]
        public DungeonVisualizer visualizer; // Handles 3D view

        // Runtime State
        private DungeonData currentDungeon;
        private bool isPlayerTurn = true; // Still used? Potentially for pausing.
        
        // Timers
        private float lastEnemyTickTime;
        private const float ENEMY_TICK_RATE = 0.6f; // 600ms
        private float lastPlayerMoveTime;
        private const float PLAYER_MOVE_COOLDOWN = 0.15f; // Fast but not instant
        
        // Systems
        private InventorySystem inventorySystem;
        private CombatSystem combatSystem;
        private TurnManager turnManager; // Cache ref

        private void Start()
        {
            // 1. Auto-Link Visualizer if missing
            if (visualizer == null)
            {
                visualizer = GetComponent<DungeonVisualizer>();
                if (visualizer == null) visualizer = gameObject.AddComponent<DungeonVisualizer>();
            }

            // 2. Initialize Singletons
            if (InventorySystem.Instance == null) gameObject.AddComponent<InventorySystem>();
            if (CombatSystem.Instance == null) gameObject.AddComponent<CombatSystem>();
            if (TurnManager.Instance == null) gameObject.AddComponent<TurnManager>();
            if (SaveSystem.Instance == null) gameObject.AddComponent<SaveSystem>();
            if (UIManager.Instance == null) gameObject.AddComponent<UIManager>();
            
            // Phase 8-10 Systems
            if (SoundManager.Instance == null) gameObject.AddComponent<SoundManager>();
            if (QuestSystem.Instance == null) gameObject.AddComponent<QuestSystem>();
            if (NPCSystem.Instance == null) gameObject.AddComponent<NPCSystem>();
            if (CraftingSystem.Instance == null) gameObject.AddComponent<CraftingSystem>();

            inventorySystem = InventorySystem.Instance;
            combatSystem = CombatSystem.Instance;
            turnManager = TurnManager.Instance;
            
            // ... (Rest of Start unchanged) ...

            // Load or New Game logic
            if (SaveSystem.Instance.HasSaveFile())
            {
                currentDungeon = SaveSystem.Instance.LoadGame();
                // Validate Data (JsonUtility fails on 2D arrays, so map might be null)
                if (currentDungeon != null && (currentDungeon.map == null || currentDungeon.map.GetLength(0) == 0))
                {
                    Debug.LogWarning("Save file found but map data is missing (JsonUtility 2D array limitation). Starting New Game.");
                    currentDungeon = null; 
                }
                else if (currentDungeon != null)
                {
                    Debug.Log("Save file loaded successfully.");
                }
            }

            if (currentDungeon == null)
            {
                StartNewGame();
            }

            // 3. Initialize Cycle
            if (turnManager != null) turnManager.Initialize(currentDungeon);

            // 4. Visualize
            if (visualizer != null)
            {
                visualizer.Visualize(currentDungeon);
            }
            
            // 5. Audio
            SoundManager.Instance.PlayMusic("dungeon_loop");
            SoundManager.Instance.PlaySFX("game_start");

            UIManager.Instance.UpdateHealth(currentDungeon.player.hp, currentDungeon.player.baseStats.maxHp);
            isPlayerTurn = true;
        }

        public void StartNewGame()
        {
             // 1. Generate Dungeon Data
            currentDungeon = DungeonGenerator.Generate(dungeonWidth, dungeonHeight, dungeonLevel);
            
            // 1.5 Apply Class Logic
            if (string.IsNullOrEmpty(currentDungeon.player.playerClass)) 
            {
                ClassSystem.ApplyClassStats(currentDungeon.player, "Warrior"); // Default
            }

            // 2. Initialize Player Inventory (Starter Gear)
            inventorySystem.AddToInventory(currentDungeon.player, GameConstants.ItemTemplates["health_potion"]);
            inventorySystem.AddToInventory(currentDungeon.player, GameConstants.ItemTemplates["sword"]);
            // Equip weapon
            inventorySystem.EquipItem(currentDungeon.player, 1); // Index 1 is sword

            // 3. Visualize
            if (visualizer != null) visualizer.Visualize(currentDungeon);
        }
 


        private void Update()
        {
            if (currentDungeon == null || !isPlayerTurn) return;
            
            // New Input System
            var kb = UnityEngine.InputSystem.Keyboard.current;
            if (kb == null) return;

            // Handle Input (Player Realtime)
            int dx = 0;
            int dy = 0;

            if (Time.time > lastPlayerMoveTime + PLAYER_MOVE_COOLDOWN)
            {
                if (kb.wKey.wasPressedThisFrame || kb.upArrowKey.wasPressedThisFrame) dy = 1;
                else if (kb.sKey.wasPressedThisFrame || kb.downArrowKey.wasPressedThisFrame) dy = -1;
                else if (kb.aKey.wasPressedThisFrame || kb.leftArrowKey.wasPressedThisFrame) dx = -1;
                else if (kb.dKey.wasPressedThisFrame || kb.rightArrowKey.wasPressedThisFrame) dx = 1;

                if (dx != 0 || dy != 0)
                {
                    if (turnManager != null) turnManager.MovePlayer(new Vector2Int(dx, dy));
                    lastPlayerMoveTime = Time.time;
                }
            }
            
            // Handle Enemy Logic (Ticker)
            if (Time.time > lastEnemyTickTime + ENEMY_TICK_RATE)
            {
                if (turnManager != null) turnManager.ProcessEnemiesRealtime();
                lastEnemyTickTime = Time.time;
            }
            
            // Debug Keys
            if (kb.iKey.wasPressedThisFrame)
            {
                Debug.Log($"Inventory: {currentDungeon.player.inventory.Count} items.");
                foreach(var item in currentDungeon.player.inventory) Debug.Log($"- {item.name}");
            }
            

            if (kb.cKey.wasPressedThisFrame)
            {
                Stats s = CombatSystem.Instance.CalculateEffectiveStats(currentDungeon.player);
                Debug.Log($"Stats: HP {currentDungeon.player.hp}/{s.maxHp} | ATK: {s.attack} | DEF: {s.defense}");
                UIManager.Instance.LogMessage($"HP: {currentDungeon.player.hp}/{s.maxHp} | ATK: {s.attack} | DEF: {s.defense}");
            }

            if (kb.f5Key.wasPressedThisFrame)
            {
                SaveSystem.Instance.SaveGame(currentDungeon);
                UIManager.Instance.LogMessage("Game Saved!");
            }
        }

    }
}
