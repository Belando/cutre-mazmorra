using UnityEngine;
using System.Collections.Generic;
using System.Linq;

namespace DungeonGame
{
    public class InventorySystem : MonoBehaviour
    {
        // Singleton instance
        public static InventorySystem Instance { get; private set; }

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        // --- ITEM GENERATION ---

        public ItemData GenerateItem(int level)
        {
            // 1. Pick Template
            var templates = GameConstants.ItemTemplates.Keys.ToList();
            string key = templates[Random.Range(0, templates.Count)];
            ItemData template = GameConstants.ItemTemplates[key];
            
            // Clone Item Data
            ItemData newItem = new ItemData
            {
                id = System.Guid.NewGuid().ToString(),
                templateId = key,
                name = template.name,
                category = template.category,
                slot = template.slot,
                value = template.value,
                maxStack = template.maxStack > 0 ? template.maxStack : 1,
                quantity = 1,
                // Deep Copy Stats to avoid reference issues
                stats = new Stats 
                { 
                    attack = template.stats.attack,
                    defense = template.stats.defense,
                    magicAttack = template.stats.magicAttack,
                    magicDefense = template.stats.magicDefense,
                    maxHp = template.stats.maxHp,
                    maxMp = template.stats.maxMp,
                    critChance = template.stats.critChance,
                    evasion = template.stats.evasion
                }
            };

            // 2. Determine Rarity
            newItem.rarity = GenerateRarity();
            
            // 3. Scale Stats by Level & Rarity
            float rarityMult = GetRarityMultiplier(newItem.rarity);
            float levelMult = 1.0f + (level * 0.1f);
            float totalMult = rarityMult * levelMult;

            ScaleStats(newItem.stats, totalMult);
            newItem.value = Mathf.FloorToInt(newItem.value * totalMult);

            // 4. Apply Prefix (if high rarity)
            if (newItem.rarity >= ItemRarity.Rare)
            {
                ApplyRandomPrefix(newItem);
            }

            return newItem;
        }

        private ItemRarity GenerateRarity()
        {
            float roll = Random.Range(0f, 100f);
            if (roll < 50) return ItemRarity.Common;
            if (roll < 80) return ItemRarity.Uncommon;
            if (roll < 95) return ItemRarity.Rare;
            if (roll < 99) return ItemRarity.Epic;
            return ItemRarity.Legendary;
        }

        private float GetRarityMultiplier(ItemRarity rarity)
        {
            switch (rarity)
            {
                case ItemRarity.Common: return 1.0f;
                case ItemRarity.Uncommon: return 1.3f;
                case ItemRarity.Rare: return 1.6f;
                case ItemRarity.Epic: return 2.0f;
                case ItemRarity.Legendary: return 3.0f;
                default: return 1.0f;
            }
        }

        private void ScaleStats(Stats stats, float multiplier)
        {
            // Simple integer scaling with floor
            if (stats.attack > 0) stats.attack = Mathf.Max(1, Mathf.FloorToInt(stats.attack * multiplier));
            if (stats.defense > 0) stats.defense = Mathf.Max(1, Mathf.FloorToInt(stats.defense * multiplier));
            if (stats.magicAttack > 0) stats.magicAttack = Mathf.Max(1, Mathf.FloorToInt(stats.magicAttack * multiplier));
            // Add other stats as needed
        }

        private void ApplyRandomPrefix(ItemData item)
        {
            // Pick a random prefix
            var keys = GameConstants.Prefixes.Keys.ToList();
            string prefixKey = keys[Random.Range(0, keys.Count)];
            var prefixData = GameConstants.Prefixes[prefixKey];

            // Apply Name
            item.name = $"{prefixData.name} {item.name}";
            item.prefixId = prefixKey; // Store for tooltip

            // Apply Stat Bonus
            // Assuming we modify the existing stat or add base value if 0
            switch (prefixData.stat)
            {
                case StatType.Attack:
                    item.stats.attack = Mathf.FloorToInt((item.stats.attack > 0 ? item.stats.attack : 2) * prefixData.multiplier);
                    break;
                case StatType.Defense:
                    item.stats.defense = Mathf.FloorToInt((item.stats.defense > 0 ? item.stats.defense : 2) * prefixData.multiplier);
                    break;
                 // Add cases for other stats...
            }
        }

        // --- INVENTORY MANAGEMENT ---

        public bool AddToInventory(PlayerData player, ItemData item)
        {
            if (item.maxStack > 1)
            {
                // Try to stack
                var existing = player.inventory.Find(i => i.templateId == item.templateId && i.rarity == item.rarity && i.prefixId == item.prefixId);
                if (existing != null)
                {
                    existing.quantity += item.quantity;
                    return true;
                }
            }
            
            if (player.inventory.Count < 30) // Hardcoded limit for now
            {
                player.inventory.Add(item);
                return true;
            }
            
            return false; // Full
        }

        public void EquipItem(PlayerData player, int inventoryIndex)
        {
            if (inventoryIndex < 0 || inventoryIndex >= player.inventory.Count) return;
            
            ItemData item = player.inventory[inventoryIndex];
            if (item.slot == EquipmentSlot.None) return; // Not equipable

            // Unequip current slot if occupied
            if (player.equipment.ContainsKey(item.slot))
            {
                ItemData oldItem = player.equipment[item.slot];
                player.inventory.Add(oldItem); // Return to inventory
                player.equipment.Remove(item.slot);
            }

            // Equip new item
            player.equipment[item.slot] = item;
            player.inventory.RemoveAt(inventoryIndex);
            
            // Recalculate Stats (Needs a method in Player/Stats system)
            RecalculatePlayerStats(player);
        }

        public void UseItem(PlayerData player, ItemData item)
        {
            if (item == null) return;

            // 1. Handle Consumables (Potions)
            if (item.category == ItemCategory.Potion)
            {
                // Apply Effect
                bool used = false;
                if (item.stats.maxHp > 0)
                {
                    int heal = item.stats.maxHp; // Using maxHp field for heal amount in potions
                    int oldHp = player.hp;
                    player.hp = Mathf.Min(player.hp + heal, player.baseStats.maxHp); // Should be total max HP
                    if (player.hp > oldHp) 
                    {
                        used = true;
                        UIManager.Instance.LogMessage($"Healed for {player.hp - oldHp} HP!");
                    }
                    else
                    {
                        UIManager.Instance.LogMessage("Already at full health!");
                    }
                }
                
                if (item.stats.maxMp > 0)
                {
                    int recover = item.stats.maxMp;
                    player.mp = Mathf.Min(player.mp + recover, player.baseStats.maxMp);
                    used = true;
                    UIManager.Instance.LogMessage($"Recovered {recover} MP!");
                }

                if (used)
                {
                    item.quantity--;
                    if (item.quantity <= 0)
                    {
                        player.inventory.Remove(item);
                    }
                }
            }
            // 2. Handle Equipment
            else if (item.category == ItemCategory.Weapon || item.category == ItemCategory.Armor || item.category == ItemCategory.Accessory)
            {
                // Find index
                int index = player.inventory.IndexOf(item);
                if (index != -1)
                {
                    EquipItem(player, index);
                    UIManager.Instance.LogMessage($"Equipped {item.name}.");
                }
            }
        }

        public void RecalculatePlayerStats(PlayerData player)
        {
            // Start with Class Base Stats as the foundation
            // Note: In a robust system we'd separate Base vs Current vs Buffed.
            // For now, we assume modifications to 'maxHp' etc in 'baseStats' are permanent growth (LevelUp),
            // and we rely on CombatSystem.CalculateEffectiveStats for temporary bonuses (Buffs/Equip).
            // However, typical RPGs show "Total Stats" in the UI.
            
            // If we want to view stats in UI, we should verify specific fields.
            // Actually, CombatSystem.CalculateEffectiveStats handles this dynamically!
            // So we might not need to bake it into a variable unless the UI fails to read it.
            
            // If the UI reads player.baseStats, it sees naked stats.
            // If the UI reads player.stats (doesn't exist), or we update UI with effective stats.
            
            // Let's modify the standard 'baseStats' field? NO, that would permanently bake items.
            // Let's rely on CombatSystem to get the right numbers during combat.
            // But for UI display (C Key), we should use CalculateEffectiveStats.
            
            Debug.Log($"Stats recalculated. Equipment count: {player.equipment.Count}");
        }
    }
}
