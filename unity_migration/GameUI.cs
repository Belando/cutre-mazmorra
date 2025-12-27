using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;
using System.Collections;

namespace DungeonGame
{
    // This script should be attached to the Canvas
    public class GameUI : MonoBehaviour
    {
        [Header("HUD")]
        public Image healthBarFill;
        public Text hpText; // Legacy Text or TMPro
        public Text messageLogText;

        [Header("Inventory")]
        public GameObject inventoryPanel;
        public Transform itemContainer;
        public GameObject itemSlotPrefab; // A button with an Image and Text

        [Header("Interaction")]
        public GameObject interactPrompt;
        public Text interactText;

        // Message Buffer
        private Queue<string> messageQueue = new Queue<string>();
        private const int MAX_LOG_LINES = 5;

        private void Awake()
        {
            // Auto-Generate UI if references are missing (User request for code-only setup)
            AutoSetup();
        }

        private void Start()
        {
            // Subscribe to Events
            if (UIManager.Instance != null)
            {
                UIManager.Instance.OnHealthChanged += UpdateHealthUI;
                UIManager.Instance.OnMessageLog += UpdateMessageLog;
                UIManager.Instance.OnInventoryUpdated += UpdateInventoryUI;
            }

            if (inventoryPanel != null) inventoryPanel.SetActive(false);
            if (interactPrompt != null) interactPrompt.SetActive(false);
            
            // Force initial update
            if (TurnManager.Instance != null && TurnManager.Instance.GetDungeon() != null)
            {
                 var player = TurnManager.Instance.GetDungeon().player;
                 UpdateHealthUI(player.hp, player.baseStats.maxHp);
            }
        }
        
        // --- PROCDURAL UI GENERATION (CODE ONLY SETUP) ---
        private void AutoSetup()
        {
            // 1. Ensure Canvas
            Canvas canvas = GetComponent<Canvas>();
            if (canvas == null)
            {
                canvas = gameObject.AddComponent<Canvas>();
                canvas.renderMode = RenderMode.ScreenSpaceOverlay;
                gameObject.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                gameObject.AddComponent<GraphicRaycaster>();
            }

            // 2. Health Bar (Top Left)
            if (healthBarFill == null)
            {
                GameObject barObj = CreateUIObject("HealthBar", transform);
                RectTransform rt = barObj.AddComponent<RectTransform>();
                rt.anchorMin = new Vector2(0, 1); rt.anchorMax = new Vector2(0, 1); // Top Left
                rt.pivot = new Vector2(0, 1);
                rt.anchoredPosition = new Vector2(20, -20);
                rt.sizeDelta = new Vector2(200, 30);
                
                // Background
                Image bg = barObj.AddComponent<Image>();
                bg.color = Color.gray;
                
                // Fill
                GameObject fillObj = CreateUIObject("Fill", barObj.transform);
                RectTransform fillRt = fillObj.AddComponent<RectTransform>();
                fillRt.anchorMin = Vector2.zero; fillRt.anchorMax = Vector2.one; // Stretch
                fillRt.sizeDelta = Vector2.zero;
                
                healthBarFill = fillObj.AddComponent<Image>();
                healthBarFill.color = Color.red;
                healthBarFill.type = Image.Type.Filled;
                healthBarFill.fillMethod = Image.FillMethod.Horizontal;
            }

            // 3. HP Text
            if (hpText == null)
            {
                GameObject textObj = CreateUIObject("HPText", transform);
                RectTransform rt = textObj.AddComponent<RectTransform>();
                rt.anchorMin = new Vector2(0, 1); rt.anchorMax = new Vector2(0, 1); 
                rt.pivot = new Vector2(0, 1);
                rt.anchoredPosition = new Vector2(230, -20); // Right of bar
                rt.sizeDelta = new Vector2(100, 30);
                
                hpText = textObj.AddComponent<Text>();
                hpText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                hpText.fontSize = 20;
                hpText.color = Color.white;
                hpText.alignment = TextAnchor.MiddleLeft;
            }

            // 4. Message Log (Bottom Left)
            if (messageLogText == null)
            {
                GameObject logObj = CreateUIObject("MessageLog", transform);
                RectTransform rt = logObj.AddComponent<RectTransform>();
                rt.anchorMin = new Vector2(0, 0); rt.anchorMax = new Vector2(0, 0); // Bottom Left
                rt.pivot = new Vector2(0, 0);
                rt.anchoredPosition = new Vector2(20, 20);
                rt.sizeDelta = new Vector2(400, 150);
                
                messageLogText = logObj.AddComponent<Text>();
                messageLogText.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                messageLogText.fontSize = 16;
                messageLogText.color = Color.white;
                messageLogText.alignment = TextAnchor.LowerLeft; // Grow upwards
                messageLogText.horizontalOverflow = HorizontalWrapMode.Wrap;
            }

            // 5. Inventory Panel (Center)
            if (inventoryPanel == null)
            {
                inventoryPanel = CreateUIObject("InventoryPanel", transform);
                RectTransform rt = inventoryPanel.AddComponent<RectTransform>();
                rt.anchorMin = new Vector2(0.5f, 0.5f); rt.anchorMax = new Vector2(0.5f, 0.5f);
                rt.anchoredPosition = Vector2.zero;
                rt.sizeDelta = new Vector2(400, 300);
                
                Image bg = inventoryPanel.AddComponent<Image>();
                bg.color = new Color(0, 0, 0, 0.8f);

                // Container
                GameObject container = CreateUIObject("Container", inventoryPanel.transform);
                RectTransform contRt = container.AddComponent<RectTransform>();
                contRt.anchorMin = Vector2.zero; contRt.anchorMax = Vector2.one;
                contRt.offsetMin = new Vector2(10, 10); contRt.offsetMax = new Vector2(-10, -10);
                
                itemContainer = container.transform;
                GridLayoutGroup grid = container.AddComponent<GridLayoutGroup>();
                grid.cellSize = new Vector2(80, 80);
                grid.spacing = new Vector2(10, 10);
            }

            // 6. Prefab
            if (itemSlotPrefab == null)
            {
                itemSlotPrefab = CreateUIObject("SlotPrefab", transform); // Temporary in scene
                itemSlotPrefab.SetActive(false);
                Image img = itemSlotPrefab.AddComponent<Image>();
                img.color = Color.white;
                itemSlotPrefab.AddComponent<Button>();
                
                GameObject textObj = CreateUIObject("Text", itemSlotPrefab.transform);
                RectTransform tr = textObj.AddComponent<RectTransform>();
                tr.anchorMin = Vector2.zero; tr.anchorMax = Vector2.one;
                Text t = textObj.AddComponent<Text>();
                t.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                t.alignment = TextAnchor.MiddleCenter;
                t.fontSize = 12;
                t.color = Color.black;
            }
        }

        private GameObject CreateUIObject(string name, Transform parent)
        {
            GameObject go = new GameObject(name);
            go.transform.SetParent(parent, false);
            return go;
        }

        private void OnDestroy()
        {
            if (UIManager.Instance != null)
            {
                UIManager.Instance.OnHealthChanged -= UpdateHealthUI;
                UIManager.Instance.OnMessageLog -= UpdateMessageLog;
                UIManager.Instance.OnInventoryUpdated -= UpdateInventoryUI;
            }
        }

        private void Update()
        {
            // Simple toggle for inventory (should ideally be input system event, but this is a visualizer)
            if (UnityEngine.InputSystem.Keyboard.current.iKey.wasPressedThisFrame)
            {
                ToggleInventory();
            }
        }

        public void UpdateHealthUI(int current, int max)
        {
            if (healthBarFill != null)
            {
                healthBarFill.fillAmount = (float)current / max;
            }
            if (hpText != null)
            {
                hpText.text = $"{current} / {max}";
            }
        }

        public void UpdateMessageLog(string message)
        {
            messageQueue.Enqueue(message);
            if (messageQueue.Count > MAX_LOG_LINES)
            {
                messageQueue.Dequeue();
            }

            if (messageLogText != null)
            {
                messageLogText.text = string.Join("\n", messageQueue.ToArray());
                // Fade out coroutine could go here
            }
        }

        public void ToggleInventory()
        {
            if (inventoryPanel == null) return;
            
            bool isActive = !inventoryPanel.activeSelf;
            inventoryPanel.SetActive(isActive);

            if (isActive)
            {
                UpdateInventoryUI();
            }
        }

        public void UpdateInventoryUI()
        {
            if (inventoryPanel == null || !inventoryPanel.activeSelf) return;

            // Clear existing slots
            foreach (Transform child in itemContainer)
            {
                Destroy(child.gameObject);
            }

            // Rebuild
            var player = TurnManager.Instance.GetDungeon()?.player;
            if (player != null && player.inventory != null)
            {
                foreach (var item in player.inventory)
                {
                    GameObject slot = Instantiate(itemSlotPrefab, itemContainer);
                    var textComp = slot.GetComponentInChildren<Text>();
                    if (textComp != null) textComp.text = $"{item.name} (x{item.quantity})";
                    
                    // Button listener for equipping/using
                    var btn = slot.GetComponent<Button>();
                    if (btn != null)
                    {
                        btn.onClick.AddListener(() => 
                        {
                            InventorySystem.Instance.UseItem(player, item);
                            UpdateInventoryUI(); // Refresh list (item might be consumed)
                        });
                    }
                }
            }
        }
    }
}
