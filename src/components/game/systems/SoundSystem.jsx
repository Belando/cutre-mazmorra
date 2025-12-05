// src/components/game/systems/SoundSystem.jsx

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  // Generador de tono básico con envolvente ADSR simple
  playTone(freq, type, duration, vol = 0.1) {
    if (!this.enabled) return;
    if (!this.ctx) this.init(); // Inicializar al primer sonido (requerimiento de navegadores)

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type; // 'sine', 'square', 'sawtooth', 'triangle'
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // Ruido blanco (para explosiones/golpes)
  playNoise(duration, vol = 0.1) {
    if (!this.enabled || !this.ctx) return;
    
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    noise.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  // --- EFECTOS PREDEFINIDOS ---

  // --- EFECTOS PREDEFINIDOS ACTUALIZADOS ---
  play(effectName) {
    try {
      switch (effectName) {
        // --- COMBATE BÁSICO ---
        case 'attack': 
          this.playNoise(0.1, 0.15); 
          break;
        case 'hit': 
          this.playTone(150, 'sawtooth', 0.2); 
          break;
        case 'kill': 
          this.playNoise(0.2, 0.2); 
          this.playTone(100, 'square', 0.2); 
          break;
        
        // --- NUEVOS SONIDOS DE HABILIDADES ---
        case 'fireball': 
          this.playNoise(0.3, 0.1); // Ruido de explosión
          this.playTone(150, 'sawtooth', 0.3); 
          break;
        case 'ice': 
          this.playTone(800, 'sine', 0.1); 
          setTimeout(() => this.playTone(1200, 'sine', 0.2), 50); // Sonido cristalino
          break;
        case 'heal': 
          this.playTone(300, 'sine', 0.2); 
          setTimeout(() => this.playTone(450, 'sine', 0.2), 100); 
          setTimeout(() => this.playTone(600, 'sine', 0.2), 200); // Acorde ascendente
          break;
        case 'buff': 
          this.playTone(200, 'square', 0.1); 
          setTimeout(() => this.playTone(300, 'square', 0.1), 100); // Power up
          break;
        case 'magic': 
          this.playTone(800, 'triangle', 0.3); 
          break;

        // --- CORRECCIÓN: SONIDO DE MUERTE (GAME OVER) ---
        case 'gameOver':
          // Secuencia descendente triste
          this.playTone(300, 'sine', 0.2);
          setTimeout(() => this.playTone(250, 'sine', 0.2), 300);
          setTimeout(() => this.playTone(200, 'sine', 0.2), 600);
          setTimeout(() => this.playTone(150, 'square', 0.4), 900); // Tono final más largo y grave
          break;

          // --- CORRECCIÓN: SONIDO ÉPICO DE INICIO ---
        case 'start_adventure':
          // Acorde ascendente (La Mayor: A - C# - E - A)
          this.playTone(220, 'sawtooth', 0.6); // A3 (Grave)
          
          setTimeout(() => this.playTone(277, 'sawtooth', 0.6), 100); // C#4
          setTimeout(() => this.playTone(329, 'sawtooth', 0.6), 200); // E4
          
          // Nota final larga y potente + "Platillo" (Ruido)
          setTimeout(() => {
            this.playTone(440, 'square', 1.5); // A4 (Agudo y fuerte)
            this.playNoise(0.8, 0.2); // Efecto de impacto/platillo
          }, 300);
          break;
      
      
        // --- UI / EVENTOS ---
        case 'levelUp': 
          setTimeout(() => this.playTone(440, 'sine', 0.1), 0);
          setTimeout(() => this.playTone(554, 'sine', 0.1), 100);
          setTimeout(() => this.playTone(659, 'sine', 0.2), 200);
          break;
        case 'pickup': 
          this.playTone(1200, 'sine', 0.1, 0.05);
          setTimeout(() => this.playTone(1800, 'sine', 0.1, 0.05), 50);
          break;
        case 'equip': 
          this.playTone(300, 'square', 0.05); 
          break;
        case 'step': 
          this.playNoise(0.03, 0.02); 
          break;
          // --- CORRECCIÓN: AÑADIR SONIDO DE COFRE ---
        // --- CORRECCIÓN: SONIDO DE COFRE MEJORADO ---
        case 'chest': 
          // 1. Click del cerrojo (Metálico, rápido)
          this.playTone(600, 'square', 0.05, 0.1);
          
          // 2. Apertura de madera (Grave, rasgado, con un pequeño retraso)
          setTimeout(() => this.playTone(100, 'sawtooth', 0.3, 0.2), 50);
          
          // 3. Brillo del tesoro (Agudo, limpio, doble tono)
          setTimeout(() => this.playTone(1200, 'sine', 0.2, 0.1), 250);
          setTimeout(() => this.playTone(1800, 'sine', 0.4, 0.1), 350);
          break;
          
      }
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }
}

export const soundManager = new SoundSystem();