using UnityEngine;
using System.Collections.Generic;

namespace DungeonGame
{
    [System.Serializable]
    public class ClassDefinition
    {
        public string id;
        public string name;
        public Stats baseStats;
        public Stats growthStats;
        public List<string> startingSkills;
    }

    public static class ClassSystem
    {
        public static Dictionary<string, ClassDefinition> Classes = new Dictionary<string, ClassDefinition>();

        static ClassSystem()
        {
            InitializeClasses();
        }

        private static void InitializeClasses()
        {
            // Warrior
            Classes.Add("Warrior", new ClassDefinition
            {
                id = "Warrior", name = "Guerrero",
                baseStats = new Stats { maxHp = 120, maxMp = 30, attack = 12, defense = 10, magicAttack = 2, magicDefense = 4, critChance = 5, evasion = 5, speed = 8 },
                growthStats = new Stats { maxHp = 20, maxMp = 5, attack = 2, defense = 2, magicAttack = 0, magicDefense = 1, critChance = 0, evasion = 0, speed = 0 },
                startingSkills = new List<string> { "power_strike", "shield_bash" }
            });

            // Mage
            Classes.Add("Mage", new ClassDefinition
            {
                id = "Mage", name = "Mago",
                baseStats = new Stats { maxHp = 70, maxMp = 100, attack = 3, defense = 3, magicAttack = 15, magicDefense = 10, critChance = 5, evasion = 5, speed = 10 },
                growthStats = new Stats { maxHp = 10, maxMp = 15, attack = 0, defense = 1, magicAttack = 3, magicDefense = 2, critChance = 0, evasion = 0, speed = 0 },
                startingSkills = new List<string> { "fireball", "heal" }
            });

            // Rogue
            Classes.Add("Rogue", new ClassDefinition
            {
                id = "Rogue", name = "Pícaro",
                baseStats = new Stats { maxHp = 85, maxMp = 50, attack = 10, defense = 5, magicAttack = 4, magicDefense = 5, critChance = 15, evasion = 15, speed = 12 },
                growthStats = new Stats { maxHp = 12, maxMp = 8, attack = 2, defense = 1, magicAttack = 1, magicDefense = 1, critChance = 1, evasion = 1, speed = 0 },
                startingSkills = new List<string> { "backstab", "smoke_bomb" }
            });
        }

        public static void ApplyClassStats(PlayerData player, string className)
        {
             if (Classes.ContainsKey(className))
             {
                 var def = Classes[className];
                 player.playerClass = className;
                 // Deep copy stats
                 player.baseStats = CopyStats(def.baseStats);
                 player.hp = player.baseStats.maxHp;
                 player.mp = player.baseStats.maxMp;
             }
        }

        public static void LevelUp(PlayerData player)
        {
            player.level++;
            player.xp -= player.xpToNextLevel;
            player.xpToNextLevel = (int)(player.xpToNextLevel * 1.5f);
            
            if (Classes.ContainsKey(player.playerClass))
            {
                var growth = Classes[player.playerClass].growthStats;
                player.baseStats.maxHp += growth.maxHp;
                player.baseStats.maxMp += growth.maxMp;
                player.baseStats.attack += growth.attack;
                player.baseStats.defense += growth.defense;
                player.baseStats.magicAttack += growth.magicAttack;
                player.baseStats.magicDefense += growth.magicDefense;
                player.baseStats.critChance += growth.critChance;
                player.baseStats.evasion += growth.evasion;
                
                // Full heal on level up
                player.hp = player.baseStats.maxHp;
                player.mp = player.baseStats.maxMp;
                
                UIManager.Instance.LogMessage($"LEVEL UP! You are now level {player.level}!");
                SoundManager.Instance.PlaySFX("levelup"); // Assuming clip exists or warning silenced
            }
        }

        private static Stats CopyStats(Stats s)
        {
            return new Stats
            {
                maxHp = s.maxHp, maxMp = s.maxMp, attack = s.attack, defense = s.defense,
                magicAttack = s.magicAttack, magicDefense = s.magicDefense,
                critChance = s.critChance, evasion = s.evasion, speed = s.speed
            };
        }
    }
}
