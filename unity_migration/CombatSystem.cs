using UnityEngine;
using System.Collections.Generic;

namespace DungeonGame
{
    public class CombatSystem : MonoBehaviour
    {
        public static CombatSystem Instance { get; private set; }

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        // --- STATS CALCULATION ---

        public Stats CalculateEffectiveStats(EntityData entity)
        {
            // Start with Base Stats
            Stats total = new Stats
            {
                maxHp = entity.baseStats.maxHp,
                maxMp = entity.baseStats.maxMp,
                attack = entity.baseStats.attack,
                defense = entity.baseStats.defense,
                magicAttack = entity.baseStats.magicAttack,
                magicDefense = entity.baseStats.magicDefense,
                critChance = entity.baseStats.critChance,
                evasion = entity.baseStats.evasion
            };

            // Add Equipment Bonuses (Player Only)
            if (entity is PlayerData player)
            {
                foreach (var item in player.equipment.Values)
                {
                    total += item.stats;
                }
            }

            // Add Active Buffs
            foreach (var buff in entity.activeBuffs)
            {
                if (buff.statBonuses != null)
                {
                    total += buff.statBonuses;
                }
            }

            return total;
        }

        // --- DAMAGE FORMULAS ---

        public struct AttackResult
        {
            public int damage;
            public bool isCrit;
            public bool isEvaded;
            public string message;
        }

        public AttackResult CalculateMeleeDamage(EntityData attacker, EntityData defender)
        {
            Stats attStats = CalculateEffectiveStats(attacker);
            Stats defStats = CalculateEffectiveStats(defender);

            // 1. Evasion Check
            float hitChance = 100f - (defStats.evasion - attStats.critChance); // Simplified accuracy
            // Using pure evasion for now as per original code
            if (Random.Range(0f, 100f) < defStats.evasion)
            {
                return new AttackResult { damage = 0, isEvaded = true, message = "Dodged!" };
            }

            // 2. Base Damage
            int baseDmg = Mathf.Max(1, attStats.attack - defStats.defense);
            
            // 3. Crit Check
            bool isCrit = Random.Range(0f, 100f) < attStats.critChance;
            if (isCrit) baseDmg = Mathf.FloorToInt(baseDmg * 1.5f);

            // 4. Variance (+/- 10%)
            float variance = Random.Range(0.9f, 1.1f);
            int finalDmg = Mathf.Max(1, Mathf.FloorToInt(baseDmg * variance));

            return new AttackResult 
            { 
                damage = finalDmg, 
                isCrit = isCrit, 
                isEvaded = false, 
                message = isCrit ? $"CRIT! {finalDmg}" : $"{finalDmg}" 
            };
        }

        // --- SKILL EXECUTION ---

        public void ExecuteSkill(SkillData skill, EntityData source, EntityData target)
        {
            if (source.mp < skill.manaCost) 
            {
                Debug.Log("Not enough mana!");
                return;
            }

            source.mp -= skill.manaCost;
            skill.cooldownCurrent = skill.cooldownMax;

            // Resolve Effect
            // In a real system, this would use a robust Effect Strategy pattern or ScriptableObjects.
            // Here we use a simple switch for migration.
            
            switch (skill.effectType)
            {
                case "Damage": // Basic Single Target
                    if (target != null)
                    {
                        Stats ad = CalculateEffectiveStats(source);
                        int dmg = Mathf.FloorToInt(ad.attack * skill.effectValue);
                        AttackResult res = new AttackResult { damage = dmg, isCrit = false, isEvaded = false, message = "" };
                        ApplyDamage(target, dmg);
                        UIManager.Instance.LogMessage($"{skill.name} hit {target.name} for {dmg}");
                    }
                    break;
                
                case "Healing":
                case "Heal":
                    EntityData healTarget = target ?? source;
                    int heal = Mathf.FloorToInt(skill.effectValue);
                    healTarget.hp = Mathf.Min(healTarget.hp + heal, CalculateEffectiveStats(healTarget).maxHp);
                    UIManager.Instance.LogMessage($"{skill.name} healed {heal}");
                    break;

                case "AoE":
                    // Hit all enemies within range of Source
                    // Assuming DungeonContext is available or we pass it? 
                    // Refactor: ExecuteSkill should probably take the DungeonData or list of entities context.
                    // For now, using TurnManager Singleton to access Dungeon is a dirty but working fix for migration.
                    if (TurnManager.Instance != null) // We'll add a public getter to TurnManager or pass context
                    {
                        var dungeon = TurnManager.Instance.GetDungeon(); // NEED TO ADD THIS METHOD
                        if (dungeon != null)
                        {
                            foreach (var enemy in dungeon.enemies)
                            {
                                int dist = Mathf.Abs(source.position.x - enemy.position.x) + Mathf.Abs(source.position.y - enemy.position.y);
                                if (dist <= skill.range && !enemy.isDead)
                                {
                                    int dmg = Mathf.FloorToInt(CalculateEffectiveStats(source).magicAttack * skill.effectValue);
                                    ApplyDamage(enemy, dmg);
                                    UIManager.Instance.LogMessage($"AoE Hit {enemy.name} for {dmg}!");
                                }
                            }
                        }
                    }
                    break;

                case "Buff":
                    EntityData buffTarget = target ?? source;
                    Buff b = new Buff 
                    { 
                        id = skill.buffId, 
                        name = skill.name, 
                        durationTurns = (int)skill.effectValue,
                        statBonuses = new Stats { attack = 5 } // Hardcoded for demo, normally specific to buffID
                    };
                    AddBuff(buffTarget, b);
                    UIManager.Instance.LogMessage($"{buffTarget.name} gained {skill.name}!");
                    break;
            }

        }

        public void ApplyDamage(EntityData target, int amount)
        {
            target.hp -= amount;
            if (target.hp <= 0)
            {
                target.hp = 0;
                Debug.Log($"{target.name} has died!");
                // Handle Death (Drop items, remove from list)
            }
        }

        // --- BUFF MANAGEMENT ---

        public void AddBuff(EntityData entity, Buff buff)
        {
            entity.activeBuffs.Add(buff);
        }

        public void UpdateBuffs(EntityData entity)
        {
            for (int i = entity.activeBuffs.Count - 1; i >= 0; i--)
            {
                entity.activeBuffs[i].durationTurns--;
                if (entity.activeBuffs[i].durationTurns <= 0)
                {
                    entity.activeBuffs.RemoveAt(i);
                }
            }
        }
    }
}
