using UnityEngine;
using System.IO;

namespace DungeonGame
{
    public class SaveSystem : MonoBehaviour
    {
        public static SaveSystem Instance { get; private set; }
        private const string SAVE_FILE = "savegame.json";

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        public void SaveGame(DungeonData data)
        {
            if (data == null) return;

            string json = JsonUtility.ToJson(data, true);
            string path = Path.Combine(Application.persistentDataPath, SAVE_FILE);
            
            try 
            {
                File.WriteAllText(path, json);
                Debug.Log($"Game Saved to {path}");
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to save game: {e.Message}");
            }
        }

        public DungeonData LoadGame()
        {
            string path = Path.Combine(Application.persistentDataPath, SAVE_FILE);
            if (!File.Exists(path)) 
            {
                Debug.LogWarning("No save file found.");
                return null;
            }

            try 
            {
                string json = File.ReadAllText(path);
                DungeonData data = JsonUtility.FromJson<DungeonData>(json);
                Debug.Log("Game Loaded!");
                return data;
            }
            catch (System.Exception e)
            {
                Debug.LogError($"Failed to load game: {e.Message}");
                return null;
            }
        }

        public bool HasSaveFile()
        {
            return File.Exists(Path.Combine(Application.persistentDataPath, SAVE_FILE));
        }
    }
}
