using UnityEngine;
using System;
using System.Collections.Generic;

namespace DungeonGame
{
    // --- ENUMS ---
    public enum TileType
    {
        FLOOR = 0,
        WALL = 1,
        DOOR = 2,
        DOOR_OPEN = 3,
        STAIRS = 4,
        STAIRS_UP = 5
    }

    public enum EntityType
    {
        NONE = 0,
        PLAYER = 1,
        // NPCs
        NPC_MERCHANT = 50, // Alias for Merchant
        NPC_QUESTGIVER = 51,
        MERCHANT = 50,
        QUEST_GIVER = 51,
        
        // Enemies
        SLIME = 100,
        RAT = 101, 
        BAT = 102,
        SKELETON = 103,
        GOBLIN = 104,
        ORC = 105,
        SPECTRE = 106,
        WOLF = 107,
        SPIDER = 108,
        ZOMBIE = 109,
        CULTIST = 110,
        TROLL = 111,
        GOLEM = 112,
        WRAITH = 113,
        VAMPIRE = 114,
        MIMIC = 115,
        DEMON = 116,
        DRAGON = 120,

        // Bosses
        BOSS_GOBLIN_KING = 200,
        BOSS_SKELETON_LORD = 201,
        BOSS_ORC_WARLORD = 202
    }

    public enum ItemRarity
    {
        Common,
        Uncommon,
        Rare,
        Epic,
        Legendary
    }

    public enum ItemCategory
    {
        Weapon,
        Armor,
        Accessory,
        Potion,
        Material,
        Gold
    }

    public enum EquipmentSlot
    {
        None,
        Head,
        Chest,
        Legs,
        Feet,
        Hands,
        MainHand,
        OffHand,
        Ring,
        Necklace,
        Earring
    }

    public enum StatType
    {
        MaxHp,
        MaxMp,
        Attack,
        Defense,
        MagicAttack,
        MagicDefense,
        CritChance,
        Evasion,
        Speed
    }

    // --- STRUCTS & DATA CLASSES ---

    [System.Serializable]
    public struct Room
    {
        public int x, y, width, height;
        public Vector2Int Center => new Vector2Int(x + width / 2, y + height / 2);
    }

    [System.Serializable]
    public class Stats
    {
        public int maxHp;
        public int maxMp;
        public int attack;
        public int defense;
        public int magicAttack;
        public int magicDefense;
        public float critChance; // 0-100
        public float evasion;    // 0-100
        public int speed;        // For turn order / movement

        public static Stats operator +(Stats a, Stats b)
        {
            return new Stats
            {
                maxHp = a.maxHp + b.maxHp,
                maxMp = a.maxMp + b.maxMp,
                attack = a.attack + b.attack,
                defense = a.defense + b.defense,
                magicAttack = a.magicAttack + b.magicAttack,
                magicDefense = a.magicDefense + b.magicDefense,
                critChance = a.critChance + b.critChance,
                evasion = a.evasion + b.evasion,
                speed = a.speed + b.speed
            };
        }
    }

    [System.Serializable]
    public class Buff
    {
        public string id;
        public string name;
        public int durationTurns;
        public Stats statBonuses;
        
        // Special Flags
        public bool invisible;
        public bool stunned;
        public int damageOverTime; // Poison/Bleed
        public string dotType;     // "poison", "bleed", "fire"
    }

    [System.Serializable]
    public class ItemData
    {
        public string id;
        public string name;
        public string description;
        public ItemRarity rarity;
        public ItemCategory category;
        public EquipmentSlot slot;
        
        // Dynamic Stats (can be serialized as List of keys/values if needed, for now object is fine)
        public Stats stats;
        
        public int value;
        public int maxStack;
        public int quantity;
        public string iconPath; // Path to UI icon (Texture)
        
        // Logic identifiers
        public string templateId; // e.g., "sword_basic"
        public string prefixId;   // e.g., "sharp"
        public int levelRequirement;
    }

    [System.Serializable]
    public class SkillData
    {
        public string id;
        public string name;
        public string description;
        public int manaCost;
        public int cooldownMax;
        public int cooldownCurrent;
        public int range;
        public string targetType; // "Self", "Melee", "Ranged", "AoE"
        
        // Simple Effect Data for migration
        public string effectType; // "Damage", "Heal", "Buff"
        public float effectValue; // Multiplier or Base Value
        public string buffId;     // If it applies a buff
    }

    [System.Serializable]
    public class EntityData
    {
        public string id;
        public string name;
        public EntityType type;
        public Vector2Int position;
        
        // Vitals
        public int hp;
        public int mp;
        public int level;
        
        public Stats baseStats;
        public List<Buff> activeBuffs = new List<Buff>();
        
        public bool isBoss; 
        
        // Runtime
        public bool isDead => hp <= 0;
    }

    [System.Serializable]
    public class PlayerData : EntityData
    {
        public string playerClass; // Warrior, Mage, Rogue
        public int xp;
        public int xpToNextLevel;
        public int gold;
        
        public List<ItemData> inventory = new List<ItemData>();
        public Dictionary<EquipmentSlot, ItemData> equipment = new Dictionary<EquipmentSlot, ItemData>();
        
        public List<SkillData> skills = new List<SkillData>();

        // --- Quest System ---
        public List<string> activeQuests = new List<string>(); // IDs
        public List<string> completedQuests = new List<string>(); // IDs
        
        // Progress: key = questID, value = kill count / progress value
        public List<QuestProgress> questProgress = new List<QuestProgress>();
    }

    [System.Serializable]
    public class QuestProgress
    {
        public string questId;
        public int currentCount;
    }

    [System.Serializable]
    public class DungeonData : ISerializationCallbackReceiver
    {
        public int level;
        
        // Non-Serialized 2D Map (Runtime)
        public TileType[,] map;
        public EntityType[,] entityMap; 

        // Serialized Flattened Data
        [SerializeField] private TileType[] _flatTileMap;
        [SerializeField] private EntityType[] _flatEntityMap;
        [SerializeField] private int _width;
        [SerializeField] private int _height;

        public List<Room> rooms;
        
        public PlayerData player;
        public List<EntityData> enemies;
        public List<ItemData> groundItems; 
        public Vector2Int stairsDown;

        public void OnBeforeSerialize()
        {
            if (map != null)
            {
                _width = map.GetLength(0);
                _height = map.GetLength(1);
                _flatTileMap = new TileType[_width * _height];
                // _flatEntityMap = new EntityType[_width * _height]; // Optional if we want to save this cache

                for (int x = 0; x < _width; x++)
                {
                    for (int y = 0; y < _height; y++)
                    {
                        _flatTileMap[y * _width + x] = map[x, y];
                    }
                }
            }
        }

        public void OnAfterDeserialize()
        {
            if (_flatTileMap != null && _width > 0 && _height > 0)
            {
                map = new TileType[_width, _height];
                entityMap = new EntityType[_width, _height]; // Re-init cache
                
                for (int x = 0; x < _width; x++)
                {
                    for (int y = 0; y < _height; y++)
                    {
                        map[x, y] = _flatTileMap[y * _width + x];
                    }
                }
            }
        }
    }
}
