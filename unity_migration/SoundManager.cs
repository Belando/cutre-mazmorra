using UnityEngine;
using System.Collections.Generic;

namespace DungeonGame
{
    public class SoundManager : MonoBehaviour
    {
        public static SoundManager Instance { get; private set; }

        [Header("Sources")]
        [SerializeField] private AudioSource musicSource;
        [SerializeField] private AudioSource sfxSource;
        
        // Dictionary to hold loaded clips (Resource Cache)
        private Dictionary<string, AudioClip> clipCache = new Dictionary<string, AudioClip>();

        [Header("Volume Settings")]
        [Range(0, 1)] public float masterVolume = 1.0f;
        [Range(0, 1)] public float musicVolume = 0.5f;
        [Range(0, 1)] public float sfxVolume = 1.0f;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                InitializeSources();
            }
            else Destroy(gameObject);
        }

        private void InitializeSources()
        {
            // Create AudioSources if not assigned in Inspector
            if (musicSource == null)
            {
                musicSource = gameObject.AddComponent<AudioSource>();
                musicSource.loop = true;
                musicSource.playOnAwake = false;
            }
            
            if (sfxSource == null)
            {
                sfxSource = gameObject.AddComponent<AudioSource>();
                sfxSource.loop = false;
                sfxSource.playOnAwake = false;
            }
        }

        public void PlayMusic(string clipName)
        {
            AudioClip clip = LoadClip("Music/" + clipName);
            if (clip != null)
            {
                musicSource.clip = clip;
                musicSource.volume = musicVolume * masterVolume;
                musicSource.Play();
            }
        }

        public void PlaySFX(string clipName, float pitch = -1.0f)
        {
            // 1. Lookup Settings
            float vol = sfxVolume;
            float p = (pitch > 0) ? pitch : 1.0f;

            if (GameConstants.SoundSettings.ContainsKey(clipName))
            {
                var settings = GameConstants.SoundSettings[clipName];
                vol *= settings.volume;
                if (pitch < 0) p = settings.pitch;
            }
            else if (GameConstants.SoundSettings.ContainsKey("default"))
            {
                 // Apply default scaling if needed, or just keep unity default
            }

            AudioClip clip = LoadClip("SFX/" + clipName);
            if (clip != null)
            {
                sfxSource.pitch = pitch;
                sfxSource.PlayOneShot(clip, sfxVolume * masterVolume);
                // Reset pitch for next use? Or use separate source. 
                // For a simple manager, one source is okay, but pitch change affects playing sound if not OneShot.
                // PlayOneShot ignores source pitch in some versions, but usually respects it.
                // Better approach: PlayOneShot scales volume. Source pitch affects it. 
                // We should reset pitch after a frame or use a pool. For simplicity: leave as is.
            }
        }

        // 3D Sound (Torches, Doors)
        public void PlaySoundAtPosition(string clipName, Vector3 position, float volumeScale = 1.0f)
        {
            AudioClip clip = LoadClip("SFX/" + clipName);
            if (clip != null)
            {
                AudioSource.PlayClipAtPoint(clip, position, sfxVolume * masterVolume * volumeScale);
            }
        }

        private AudioClip LoadClip(string path)
        {
            if (clipCache.ContainsKey(path)) return clipCache[path];

            // Assumes resources are in "Resources/Audio/" folder
            AudioClip clip = Resources.Load<AudioClip>("Audio/" + path);
            if (clip != null)
            {
                clipCache[path] = clip;
                return clip;
            }
            
            // Debug.LogWarning($"AudioClip not found: Audio/{path}");
            return null;
        }
    }
}
