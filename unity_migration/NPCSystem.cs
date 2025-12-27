using UnityEngine;
using System.Collections.Generic;

namespace DungeonGame
{
    public class NPCSystem : MonoBehaviour
    {
        public static NPCSystem Instance { get; private set; }
        private Dictionary<EntityType, string> npcDialogs = new Dictionary<EntityType, string>();

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
            
            InitializeNPCs();
        }

        private void InitializeNPCs()
        {
            // Ported from npcs.ts
            npcDialogs[EntityType.MERCHANT] = "¡Saludos, viajero! Tengo mercancías de tierras lejanas.";
            npcDialogs[EntityType.QUEST_GIVER] = "Ah, un alma valiente... La oscuridad avanza y necesito ayuda.";
        }

        public void SpawnNPCs(List<Room> rooms, DungeonData dungeon)
        {
            // Simple logic: 1 NPC per level, usually in first or second room
            if (rooms.Count < 2) return;
            
            // Merchant
            if (dungeon.level % 2 == 0) // Every 2 levels
            {
                SpawnNPC(EntityType.MERCHANT, rooms[1].Center, dungeon);
            }
            else
            {
                SpawnNPC(EntityType.QUEST_GIVER, rooms[1].Center, dungeon);
            }
        }

        private void SpawnNPC(EntityType type, Vector2Int pos, DungeonData dungeon)
        {
             EntityData npc = new EntityData
             {
                 id = System.Guid.NewGuid().ToString(),
                 name = GetNameFor(type),
                 type = type,
                 position = pos,
                 hp = 100,
                 baseStats = new Stats()
             };
             dungeon.enemies.Add(npc); 
        }

        private string GetNameFor(EntityType type)
        {
            switch(type)
            {
                case EntityType.MERCHANT: return "Garrick el Proveedor";
                case EntityType.QUEST_GIVER: return "Eldric el Sabio";
                default: return "NPC";
            }
        }
        
        public string GetDialog(EntityType type)
        {
            if (npcDialogs.ContainsKey(type)) return npcDialogs[type];
            return "...";
        }
    }
}
