using System.Collections.Generic;
using DungeonGame;

public static class GameConstants
{
    // --- SOUND SETTINGS ---
    public struct SoundConfig
    {
        public float volume;
        public float pitch;
    }

    public static Dictionary<string, SoundConfig> SoundSettings = new Dictionary<string, SoundConfig>
    {
        { "default", new SoundConfig { volume = 1.0f, pitch = 1.0f } },
        { "step", new SoundConfig { volume = 0.2f, pitch = 0.8f } },
        { "door", new SoundConfig { volume = 1.0f, pitch = 1.0f } },
        { "game_start", new SoundConfig { volume = 0.6f, pitch = 1.0f } }, // Mapped from start_adventure
        { "game_over", new SoundConfig { volume = 0.6f, pitch = 1.0f } }
    };
    // --- SKILL DEFINITIONS (Ported from skills.ts) ---
    public static Dictionary<string, SkillData> SkillTemplates = new Dictionary<string, SkillData>
    {
        // WARRIOR
        { "power_strike", new SkillData { id = "power_strike", name = "Golpe Poderoso", manaCost = 3, cooldownMax = 3, effectType = "Damage", effectValue = 1.5f } },
        { "shield_bash", new SkillData { id = "shield_bash", name = "Golpe de Escudo", manaCost = 4, cooldownMax = 5, effectType = "Damage", effectValue = 0.75f } }, // + Stun logic handled in dedicated effect
        { "whirlwind", new SkillData { id = "whirlwind", name = "Torbellino", manaCost = 8, cooldownMax = 6, effectType = "AoE", effectValue = 1.0f, range = 1 } },
        { "war_cry", new SkillData { id = "war_cry", name = "Grito de Guerra", manaCost = 5, cooldownMax = 10, effectType = "Buff", effectValue = 5, buffId = "war_cry" } },
        
        // MAGE
        { "fireball", new SkillData { id = "fireball", name = "Bola de Fuego", manaCost = 8, cooldownMax = 4, effectType = "Damage", effectValue = 1.75f, range = 6 } },
        { "heal", new SkillData { id = "heal", name = "Curación", manaCost = 8, cooldownMax = 7, effectType = "Heal", effectValue = 30f } }, // simplified to flat or % in method
        { "ice_shard", new SkillData { id = "ice_shard", name = "Fragmento de Hielo", manaCost = 6, cooldownMax = 4, effectType = "Damage", effectValue = 1.25f, range = 5 } },
        
        // ROGUE
        { "backstab", new SkillData { id = "backstab", name = "Puñalada Trasera", manaCost = 5, cooldownMax = 4, effectType = "Damage", effectValue = 2.0f } },
        { "quick_step", new SkillData { id = "quick_step", name = "Paso Rápido", manaCost = 6, cooldownMax = 8, effectType = "Buff", effectValue = 3, buffId = "evasion_up" } }
    };

    // --- RARITY COLORS ---
    public static Dictionary<ItemRarity, string> RarityColors = new Dictionary<ItemRarity, string>
    {
        { ItemRarity.Common, "#a1a1aa" },
        { ItemRarity.Uncommon, "#4ade80" },
        { ItemRarity.Rare, "#3b82f6" },
        { ItemRarity.Epic, "#a855f7" },
        { ItemRarity.Legendary, "#f59e0b" }
    };

    // --- DEFAULT STATS (Example for Warrior) ---
    public static Stats BaseWarriorStats = new Stats
    {
        maxHp = 100, maxMp = 30,
        attack = 10, defense = 5,
        magicAttack = 2, magicDefense = 2,
        critChance = 5, evasion = 5
    };


    // --- ENEMY STATS (Ported from enemies.ts) ---
    public static Dictionary<EntityType, EntityData> EnemyTemplates = new Dictionary<EntityType, EntityData>
    {
        { EntityType.RAT, new EntityData { name = "Rat", type = EntityType.RAT, baseStats = new Stats { maxHp = 6, attack = 2, defense = 0, speed = 8 }, hp = 6 } },
        { EntityType.BAT, new EntityData { name = "Bat", type = EntityType.BAT, baseStats = new Stats { maxHp = 8, attack = 3, defense = 0, speed = 10 }, hp = 8 } },
        { EntityType.GOBLIN, new EntityData { name = "Goblin", type = EntityType.GOBLIN, baseStats = new Stats { maxHp = 12, attack = 4, defense = 1, speed = 6 }, hp = 12 } },
        { EntityType.SLIME, new EntityData { name = "Slime", type = EntityType.SLIME, baseStats = new Stats { maxHp = 10, attack = 2, defense = 1, speed = 4 }, hp = 10 } },
        { EntityType.SKELETON, new EntityData { name = "Skeleton", type = EntityType.SKELETON, baseStats = new Stats { maxHp = 15, attack = 5, defense = 2, speed = 5 }, hp = 15 } },
        { EntityType.ORC, new EntityData { name = "Orc", type = EntityType.ORC, baseStats = new Stats { maxHp = 22, attack = 6, defense = 3, speed = 5 }, hp = 22 } },
        { EntityType.WOLF, new EntityData { name = "Wolf", type = EntityType.WOLF, baseStats = new Stats { maxHp = 16, attack = 7, defense = 2, speed = 9 }, hp = 16 } },
        { EntityType.SPIDER, new EntityData { name = "Spider", type = EntityType.SPIDER, baseStats = new Stats { maxHp = 18, attack = 7, defense = 2, speed = 7 }, hp = 18 } },
        { EntityType.ZOMBIE, new EntityData { name = "Zombie", type = EntityType.ZOMBIE, baseStats = new Stats { maxHp = 30, attack = 6, defense = 4, speed = 3 }, hp = 30 } },
        { EntityType.CULTIST, new EntityData { name = "Cultist", type = EntityType.CULTIST, baseStats = new Stats { maxHp = 20, attack = 9, defense = 2, speed = 6 }, hp = 20 } },
        { EntityType.TROLL, new EntityData { name = "Troll", type = EntityType.TROLL, baseStats = new Stats { maxHp = 40, attack = 9, defense = 5, speed = 4 }, hp = 40 } },
        { EntityType.GOLEM, new EntityData { name = "Golem", type = EntityType.GOLEM, baseStats = new Stats { maxHp = 50, attack = 8, defense = 8, speed = 2 }, hp = 50 } },
        { EntityType.WRAITH, new EntityData { name = "Wraith", type = EntityType.WRAITH, baseStats = new Stats { maxHp = 35, attack = 11, defense = 3, speed = 8 }, hp = 35 } },
        { EntityType.VAMPIRE, new EntityData { name = "Vampire", type = EntityType.VAMPIRE, baseStats = new Stats { maxHp = 45, attack = 12, defense = 4, speed = 10 }, hp = 45 } },
        { EntityType.MIMIC, new EntityData { name = "Mimic", type = EntityType.MIMIC, baseStats = new Stats { maxHp = 38, attack = 14, defense = 5, speed = 0 }, hp = 38 } },
        { EntityType.DEMON, new EntityData { name = "Demon", type = EntityType.DEMON, baseStats = new Stats { maxHp = 55, attack = 13, defense = 6, speed = 7 }, hp = 55 } },
        { EntityType.DRAGON, new EntityData { name = "Dragon", type = EntityType.DRAGON, baseStats = new Stats { maxHp = 70, attack = 15, defense = 8, speed = 8 }, hp = 70 } },
        
        // BOSSES
        { EntityType.BOSS_GOBLIN_KING, new EntityData { name = "Goblin King", type = EntityType.BOSS_GOBLIN_KING, baseStats = new Stats { maxHp = 60, attack = 8, defense = 4, speed = 6 }, hp = 60, isBoss = true } },
        { EntityType.BOSS_SKELETON_LORD, new EntityData { name = "Skeleton Lord", type = EntityType.BOSS_SKELETON_LORD, baseStats = new Stats { maxHp = 80, attack = 10, defense = 5, speed = 5 }, hp = 80, isBoss = true } },
        { EntityType.BOSS_ORC_WARLORD, new EntityData { name = "Orc Warlord", type = EntityType.BOSS_ORC_WARLORD, baseStats = new Stats { maxHp = 100, attack = 12, defense = 6, speed = 5 }, hp = 100, isBoss = true } }
    };

    // --- ITEM TEMPLATES (Ported from items.ts) ---
    public static Dictionary<string, ItemData> ItemTemplates = new Dictionary<string, ItemData>
    {
        // POTIONS
        { "health_potion", new ItemData { name = "Health Potion", category = ItemCategory.Potion, stats = new Stats { maxHp = 50 }, value = 20, maxStack = 10, prefixId = "potion" } },
        { "mana_potion", new ItemData { name = "Mana Potion", category = ItemCategory.Potion, stats = new Stats { maxMp = 30 }, value = 20, maxStack = 10, prefixId = "potion" } },

        // WEAPONS
        { "sword", new ItemData { name = "Sword", category = ItemCategory.Weapon, slot = EquipmentSlot.MainHand, stats = new Stats { attack = 4 }, value = 50 } },
        { "axe", new ItemData { name = "Axe", category = ItemCategory.Weapon, slot = EquipmentSlot.MainHand, stats = new Stats { attack = 5, speed = -1 }, value = 55 } },
        { "dagger", new ItemData { name = "Dagger", category = ItemCategory.Weapon, slot = EquipmentSlot.MainHand, stats = new Stats { attack = 2, critChance = 10 }, value = 30 } },
        { "bow", new ItemData { name = "Bow", category = ItemCategory.Weapon, slot = EquipmentSlot.MainHand, stats = new Stats { attack = 3 }, value = 45 } },
        { "staff", new ItemData { name = "Staff", category = ItemCategory.Weapon, slot = EquipmentSlot.MainHand, stats = new Stats { magicAttack = 5 }, value = 60 } },
        { "wand", new ItemData { name = "Wand", category = ItemCategory.Weapon, slot = EquipmentSlot.MainHand, stats = new Stats { magicAttack = 3 }, value = 40 } },
        
        // OFFHAND
        { "shield", new ItemData { name = "Round Shield", category = ItemCategory.Weapon, slot = EquipmentSlot.OffHand, stats = new Stats { defense = 3 }, value = 40 } },
        { "tome", new ItemData { name = "Tome", category = ItemCategory.Weapon, slot = EquipmentSlot.OffHand, stats = new Stats { magicAttack = 2, maxMp = 10 }, value = 40 } },

        // HELMET
        { "heavy_helmet", new ItemData { name = "Plate Helm", category = ItemCategory.Armor, slot = EquipmentSlot.Head, stats = new Stats { defense = 2 }, value = 50 } },
        { "leather_helmet", new ItemData { name = "Leather Hood", category = ItemCategory.Armor, slot = EquipmentSlot.Head, stats = new Stats { defense = 1, magicDefense = 1 }, value = 30 } },
        { "light_helmet", new ItemData { name = "Pointy Hat", category = ItemCategory.Armor, slot = EquipmentSlot.Head, stats = new Stats { magicDefense = 3, maxMp = 5 }, value = 30 } },

        // CHEST
        { "heavy_chest", new ItemData { name = "Plate Chest", category = ItemCategory.Armor, slot = EquipmentSlot.Chest, stats = new Stats { defense = 4, maxHp = 10 }, value = 80 } },
        { "leather_chest", new ItemData { name = "Leather Armor", category = ItemCategory.Armor, slot = EquipmentSlot.Chest, stats = new Stats { defense = 2, magicDefense = 2 }, value = 60 } },
        { "light_chest", new ItemData { name = "Robe", category = ItemCategory.Armor, slot = EquipmentSlot.Chest, stats = new Stats { magicDefense = 5, maxMp = 15 }, value = 50 } },

        // LEGS
        { "heavy_legs", new ItemData { name = "Plate Greaves", category = ItemCategory.Armor, slot = EquipmentSlot.Legs, stats = new Stats { defense = 3 }, value = 60 } },
        { "leather_legs", new ItemData { name = "Leather Pants", category = ItemCategory.Armor, slot = EquipmentSlot.Legs, stats = new Stats { defense = 2, magicDefense = 1 }, value = 45 } },
        { "light_legs", new ItemData { name = "Skirt", category = ItemCategory.Armor, slot = EquipmentSlot.Legs, stats = new Stats { magicDefense = 3, maxMp = 5 }, value = 40 } },

        // ACCESSORIES
        { "ring", new ItemData { name = "Ring", category = ItemCategory.Accessory, slot = EquipmentSlot.Ring, stats = new Stats { attack = 1, magicAttack = 1 }, value = 100 } },
        { "necklace", new ItemData { name = "Necklace", category = ItemCategory.Accessory, slot = EquipmentSlot.Necklace, stats = new Stats { maxHp = 10, maxMp = 10 }, value = 120 } }
    };

    // --- ITEM PREFIXES (Ported from ItemSystem.ts) ---
    // Could be ScriptableObjects in full Unity, but code-config is fine for now.
    public struct PrefixData
    {
        public string name;
        public StatType stat;
        public float multiplier;
        public int adder;
    }

    public static Dictionary<string, PrefixData> Prefixes = new Dictionary<string, PrefixData>
    {
        { "sharp", new PrefixData { name = "Sharp", stat = StatType.Attack, multiplier = 1.2f } },
        { "deadly", new PrefixData { name = "Deadly", stat = StatType.CritChance, adder = 5 } },
        { "heavy", new PrefixData { name = "Heavy", stat = StatType.Attack, multiplier = 1.3f } },
        { "mystic", new PrefixData { name = "Mystic", stat = StatType.MagicAttack, multiplier = 1.25f } },
        { "sturdy", new PrefixData { name = "Sturdy", stat = StatType.Defense, multiplier = 1.2f } },
        { "vital", new PrefixData { name = "Vital", stat = StatType.MaxHp, adder = 15 } }
    };
}
