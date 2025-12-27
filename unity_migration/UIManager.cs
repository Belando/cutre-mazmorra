using UnityEngine;
using System;

namespace DungeonGame
{
    public class UIManager : MonoBehaviour
    {
        public static UIManager Instance { get; private set; }

        // Events for UI Updates
        public event Action<int, int> OnHealthChanged; // Current, Max
        public event Action<string> OnMessageLog; // Combat Text
        public event Action OnInventoryUpdated;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        public void UpdateHealth(int current, int max)
        {
            // Trigger Event for HUD
            OnHealthChanged?.Invoke(current, max);
            // Debug Fallback
            // Debug.Log($"[UI] HP: {current}/{max}");
        }

        public void LogMessage(string message)
        {
            OnMessageLog?.Invoke(message);
            // Debug.Log($"[LOG] {message}");
        }

        public void RefreshInventory()
        {
            OnInventoryUpdated?.Invoke();
            // Debug.Log("[UI] Inventory Refreshed");
        }
        
        // Example for showing a floating text (would spawn a prefab in real implementation)
        public void ShowFloatingText(Vector3 worldPos, string text, Color color)
        {
            // Debug.Log($"[FLOAT] {text} at {worldPos}");
        }
    }
}
