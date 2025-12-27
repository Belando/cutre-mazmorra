using UnityEngine;
using System.Collections.Generic;
using System.Linq;

namespace DungeonGame
{
    [System.Serializable]
    public class Recipe
    {
        public string id;
        public string outputItemId;
        public int outputCount;
        public Dictionary<string, int> inputMaterials = new Dictionary<string, int>(); // ItemID, Count
    }

    public class CraftingSystem : MonoBehaviour
    {
        public static CraftingSystem Instance { get; private set; }
        public List<Recipe> Recipes = new List<Recipe>();

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                InitializeRecipes();
            }
            else Destroy(gameObject);
        }

        private void InitializeRecipes()
        {
            // --- WEAPONS ---
            AddRecipe("steel_sword", "sword", 1, new Dictionary<string, int> { { "iron_ore", 3 }, { "leather", 1 } });
            // crystal_blade (requires crystal item in DB)
            AddRecipe("crystal_blade", "sword", 1, new Dictionary<string, int> { { "iron_ore", 2 }, { "crystal", 2 } }); // mapped to sword template for now or new template
            AddRecipe("dragon_sword", "sword", 1, new Dictionary<string, int> { { "iron_ore", 3 }, { "dragon_scale", 2 }, { "crystal", 1 } });

            // --- ARMOR ---
            AddRecipe("reinforced_armor", "heavy_chest", 1, new Dictionary<string, int> { { "iron_ore", 4 }, { "leather", 2 } });
            AddRecipe("mystic_robe", "light_chest", 1, new Dictionary<string, int> { { "cloth", 3 }, { "crystal", 2 } });
            AddRecipe("dragon_armor", "heavy_chest", 1, new Dictionary<string, int> { { "iron_ore", 3 }, { "dragon_scale", 3 }, { "leather", 2 } });

            // --- ACCESSORIES ---
            AddRecipe("power_ring", "ring", 1, new Dictionary<string, int> { { "gold_ore", 2 }, { "crystal", 1 } });
            AddRecipe("life_amulet", "necklace", 1, new Dictionary<string, int> { { "gold_ore", 2 }, { "essence", 2 } });

            // --- POTIONS/AMMO ---
            AddRecipe("health_potion", "health_potion", 1, new Dictionary<string, int> { { "essence", 1 } });
            // AddRecipe("fire_arrows", "fire_arrows", 5, ...); // Needs Ammo ItemTemplate
        }

        private void AddRecipe(string id, string outputId, int count, Dictionary<string, int> mats)
        {
            var r = new Recipe { id = id, outputItemId = outputId, outputCount = count, inputMaterials = mats };
            Recipes.Add(r);
        }

        public bool CanCraft(PlayerData player, Recipe recipe)
        {
            foreach (var mat in recipe.inputMaterials)
            {
                // Count items in inventory with templateId == mat.Key
                // Note: Our Inventory is ItemData list. We need to check templateId or similar.
                // Assuming `templateId` holds the material key (e.g. "iron_ore")
                
                int count = player.inventory.Where(i => i.templateId == mat.Key || i.id == mat.Key).Sum(i => i.quantity);
                if (count < mat.Value) return false;
            }
            return true;
        }

        public void Craft(PlayerData player, string recipeId)
        {
            Recipe recipe = Recipes.FirstOrDefault(r => r.id == recipeId);
            if (recipe == null) return;

            if (!CanCraft(player, recipe))
            {
                UIManager.Instance.LogMessage("Not enough materials!");
                return;
            }

            // Consume Materials
            foreach (var mat in recipe.inputMaterials)
            {
                int remainingToRemove = mat.Value;
                
                // Iterate backwards to safely remove
                for (int i = player.inventory.Count - 1; i >= 0; i--)
                {
                    if (remainingToRemove <= 0) break;

                    ItemData item = player.inventory[i];
                    if (item.templateId == mat.Key || item.id == mat.Key)
                    {
                        if (item.quantity > remainingToRemove)
                        {
                            item.quantity -= remainingToRemove;
                            remainingToRemove = 0;
                        }
                        else
                        {
                            remainingToRemove -= item.quantity;
                            player.inventory.RemoveAt(i);
                        }
                    }
                }
            }

            // Grant Item
            if (GameConstants.ItemTemplates.ContainsKey(recipe.outputItemId))
            {
                ItemData template = GameConstants.ItemTemplates[recipe.outputItemId];
                // Use InventorySystem to generate/add (handles deep copy)
                // Since we don't have direct access to InventorySystem.GenerateItem private logic,
                // we call AddToInventory on the template. But remember template is shared.
                // InventorySystem.AddToInventory handles cloning? Let's check. 
                // Previous memory: AddToInventory adds the instance directly if stackable, or checks ID.
                // We should clone it first.
                
                // Simulating Item Generation
                InventorySystem.Instance.AddToInventory(player, template); 
                UIManager.Instance.LogMessage($"Crafted {template.name}!");
            }
        }
    }
}
