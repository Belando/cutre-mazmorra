using UnityEngine;
using System.Collections.Generic;
using System.Linq;

namespace DungeonGame
{
    public enum QuestType { Kill, Collect, ReachFloor }

    [System.Serializable]
    public class Quest
    {
        public string id;
        public string title;
        public string description;
        public QuestType type;
        
        public string targetId; // Enemy ID or Item ID
        public int targetCount;
        
        public int rewardGold;
        public int rewardXp;
        public string rewardItemId; // Optional
    }

    public class QuestSystem : MonoBehaviour
    {
        public static QuestSystem Instance { get; private set; }
        
        // Database of all quests
        public Dictionary<string, Quest> QuestDatabase = new Dictionary<string, Quest>();

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                InitializeQuests();
            }
            else Destroy(gameObject);
        }

        private void InitializeQuests()
        {
            // Ported from quests.ts
            AddQuest(new Quest 
            { 
                id = "kill_rats", 
                title = "Plaga de Ratas", 
                description = "Elimina 5 ratas para el Anciano.", 
                type = QuestType.Kill, 
                targetId = "RAT", 
                targetCount = 5, 
                rewardGold = 30, 
                rewardXp = 20 
            });

            AddQuest(new Quest 
            { 
                id = "kill_skeletons", 
                title = "Huesos Inquietos", 
                description = "Destruye 4 esqueletos.", 
                type = QuestType.Kill, 
                targetId = "SKELETON", 
                targetCount = 4, 
                rewardGold = 50, 
                rewardXp = 35 
            });
            
             AddQuest(new Quest 
            { 
                id = "clear_spiders", 
                title = "Nido de Arañas", 
                description = "Elimina 5 arañas gigantes.", 
                type = QuestType.Kill, 
                targetId = "SPIDER", 
                targetCount = 5, 
                rewardGold = 60, 
                rewardXp = 40 
            });
            
            AddQuest(new Quest 
            { 
                id = "slay_goblin_king", 
                title = "Regicidio Goblin", 
                description = "Derrota al Rey Goblin.", 
                type = QuestType.Kill, 
                targetId = "BOSS_GOBLIN_KING", 
                targetCount = 1, 
                rewardGold = 75, 
                rewardXp = 50 
            });
        }

        private void AddQuest(Quest q)
        {
            if (!QuestDatabase.ContainsKey(q.id)) QuestDatabase.Add(q.id, q);
        }

        // --- MANIPULATION ---

        public void AcceptQuest(PlayerData player, string questId)
        {
            if (QuestDatabase.ContainsKey(questId) && !player.activeQuests.Contains(questId) && !player.completedQuests.Contains(questId))
            {
                player.activeQuests.Add(questId);
                player.questProgress.Add(new QuestProgress { questId = questId, currentCount = 0 });
                UIManager.Instance.LogMessage($"Quest Accepted: {QuestDatabase[questId].title}");
            }
        }

        public void CheckProgress(PlayerData player, QuestType type, string targetId, int amount = 1)
        {
            for (int i = player.activeQuests.Count - 1; i >= 0; i--)
            {
                string qId = player.activeQuests[i];
                if (!QuestDatabase.ContainsKey(qId)) continue;
                
                Quest q = QuestDatabase[qId];
                if (q.type == type && q.targetId == targetId)
                {
                    // Update Progress
                    var progress = player.questProgress.FirstOrDefault(p => p.questId == qId);
                    if (progress != null)
                    {
                        progress.currentCount += amount;
                        // Check Completion
                        if (progress.currentCount >= q.targetCount)
                        {
                            CompleteQuest(player, q);
                        }
                    }
                }
            }
        }

        private void CompleteQuest(PlayerData player, Quest q)
        {
            player.activeQuests.Remove(q.id);
            player.questProgress.RemoveAll(p => p.questId == q.id);
            player.completedQuests.Add(q.id);
            
            // Rewards
            player.gold += q.rewardGold;
            player.xp += q.rewardXp;
            
            UIManager.Instance.LogMessage($"Quest Completed: {q.title}!");
            UIManager.Instance.LogMessage($"Rewards: {q.rewardGold} Gold, {q.rewardXp} XP");
        }
    }
}
