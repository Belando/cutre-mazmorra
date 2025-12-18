// src/engine/systems/SoundSystem.ts

type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle' | 'custom';

interface FireAmbience {
    node: AudioBufferSourceNode | null;
    gain: GainNode | null;
}

interface Ambience {
    fire: FireAmbience;
    timer: NodeJS.Timeout | null;
}

export type SoundEffectName =
    | 'step' | 'chest' | 'door' | 'stairs' | 'pickup' | 'equip' | 'error' | 'levelUp'
    | 'attack' | 'hit' | 'enemy_hit' | 'critical' | 'kill' | 'anvil'
    | 'fireball' | 'ice' | 'heal' | 'buff' | 'magic'
    | 'start_adventure' | 'gameOver' | 'speech';

export class SoundSystem {
    ctx: AudioContext | null;
    enabled: boolean;
    masterVolume: number;
    ambience: Ambience;

    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.masterVolume = 0.4;

        this.ambience = {
            fire: { node: null, gain: null },
            timer: null
        };
    }

    init(): void {
        if (!this.ctx) {
            // @ts-ignore - Handle webkit prefix legacy
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // ==========================================
    // 1. SINTETIZADOR FM (16-BIT RETRO)
    // ==========================================
    playFM(carrierFreq: number, modFreq: number, modIndex: number, duration: number, type: OscillatorType = 'sine', vol: number = 0.1): void {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;

        const carrier = this.ctx.createOscillator();
        carrier.type = type;
        carrier.frequency.setValueAtTime(carrierFreq, t);

        const modulator = this.ctx.createOscillator();
        modulator.frequency.setValueAtTime(modFreq, t);

        const modGain = this.ctx.createGain();
        modGain.gain.setValueAtTime(modIndex, t);
        modGain.gain.exponentialRampToValueAtTime(1, t + duration);

        const masterGain = this.ctx.createGain();
        masterGain.gain.setValueAtTime(0, t);
        masterGain.gain.linearRampToValueAtTime(vol * this.masterVolume, t + 0.02);
        masterGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);
        carrier.connect(masterGain);
        masterGain.connect(this.ctx.destination);

        carrier.start();
        modulator.start();
        carrier.stop(t + duration);
        modulator.stop(t + duration);
    }

    // ==========================================
    // 2. AMBIENTE
    // ==========================================

    initAmbience(): void {
        if (!this.enabled) return;
        this.init();
        if (!this.ambience.fire.node) this.ambience.fire = this.createFireLoop();
    }

    stopAmbience(): void {
        if (this.ambience.fire.node) {
            this.ambience.fire.node.stop();
            this.ambience.fire.node = null;
        }
        if (this.ambience.timer) {
            clearTimeout(this.ambience.timer);
            this.ambience.timer = null;
        }
    }

    updateFireAmbience(distance: number): void {
        if (!this.ambience.fire.gain || !this.ctx) return;
        const maxDist = 5;
        let vol = 0;
        if (distance < maxDist) {
            const factor = 1 - (distance / maxDist);
            vol = factor * factor * 0.08;
        }
        this.ambience.fire.gain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.5);
    }

    createFireLoop(): FireAmbience {
        if (!this.ctx) return { node: null, gain: null };

        const bufferSize = this.ctx.sampleRate * 5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;

        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            lastOut = (lastOut + (0.02 * white)) / 1.002;
            const flicker = 0.8 + 0.2 * Math.sin(i * 0.0005) * Math.sin(i * 0.003);
            data[i] = lastOut * flicker * 0.5;

            if (Math.random() < 0.0008) {
                const snapStrength = 0.5 + Math.random() * 0.5;
                const snapLength = Math.floor(10 + Math.random() * 30);
                for (let j = 0; j < snapLength; j++) {
                    if (i + j < bufferSize) {
                        const snapNoise = (Math.random() * 2 - 1) * snapStrength;
                        const envelope = 1 - (j / snapLength);
                        data[i + j] += snapNoise * envelope;
                    }
                }
            }
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowshelf';
        filter.frequency.value = 200;
        filter.gain.value = 10;
        const gain = this.ctx.createGain();
        gain.gain.value = 0;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
        return { node: noise, gain: gain };
    }

    // --- 3. GENERADOR DE RUIDO ---
    playNoise(duration: number, vol: number = 0.1, filterFreq: number = 500): void {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + duration);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol * this.masterVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }

    // --- 4. CATÁLOGO DE EFECTOS ---
    play(effectName: SoundEffectName): void {
        try {
            this.init();
            switch (effectName) {

                // INTERACCIÓN
                case 'step':
                    this.playNoise(0.06, 0.2, 150 + Math.random() * 200);
                    break;
                case 'chest':
                    this.playFM(600, 1200, 500, 0.5, 'sine', 0.2);
                    this.playNoise(0.3, 0.2, 300);
                    break;
                case 'door':
                    this.playFM(60, 30, 80, 0.4, 'sawtooth', 0.3);
                    setTimeout(() => this.playNoise(0.15, 0.5, 200), 250);
                    break;
                case 'stairs':
                    this.playNoise(0.25, 0.8, 200);
                    setTimeout(() => this.playNoise(0.3, 0.6, 150), 300);
                    break;
                case 'pickup':
                    this.playFM(1500, 3000, 200, 0.1, 'sine', 0.15);
                    setTimeout(() => this.playFM(2000, 4000, 200, 0.2, 'sine', 0.15), 50);
                    break;
                case 'equip':
                    this.playNoise(0.1, 0.2, 800);
                    break;
                case 'error': // NUEVO SONIDO
                    this.playFM(150, 50, 100, 0.3, 'sawtooth', 0.2);
                    break;
                case 'levelUp':
                    const base = 440;
                    [1, 1.25, 1.5, 2].forEach((r, i) => {
                        setTimeout(() => this.playFM(base * r, base * r * 2, 300, 0.4, 'triangle', 0.2), i * 100);
                    });
                    break;

                // COMBATE
                case 'attack':
                    this.playNoise(0.15, 0.2, 1500);
                    this.playFM(800, 1200, 200, 0.15, 'triangle', 0.1);
                    break;
                case 'hit':
                    this.playNoise(0.12, 0.4, 300);
                    break;
                case 'enemy_hit':
                    this.playFM(120, 40, 20, 0.25, 'triangle', 0.5);
                    this.playNoise(0.2, 0.6, 300);
                    break;
                case 'critical':
                    this.playFM(800, 150, 1000, 0.2, 'square', 0.2);
                    this.playNoise(0.2, 0.5, 800);
                    break;
                case 'kill':
                    this.playFM(100, 50, 100, 0.4, 'sine', 0.3);
                    break;
                case 'anvil':
                    this.playFM(700, 1200, 1500, 0.4, 'sine', 0.3);
                    setTimeout(() => { this.playFM(1800, 0, 0, 0.8, 'sine', 0.1); }, 10);
                    this.playNoise(0.05, 0.3, 1000);
                    break;

                // MAGIA
                case 'fireball':
                    this.playNoise(0.5, 0.4, 400);
                    this.playFM(150, 600, 500, 0.3, 'sawtooth', 0.2);
                    break;
                case 'ice':
                    this.playFM(1200, 434, 1000, 0.2, 'sine', 0.2);
                    setTimeout(() => this.playFM(1800, 567, 800, 0.2, 'sine', 0.1), 50);
                    break;
                case 'heal':
                    this.playFM(400, 800, 200, 0.6, 'sine', 0.15);
                    setTimeout(() => this.playFM(600, 1200, 200, 0.6, 'sine', 0.15), 150);
                    break;
                case 'buff':
                    this.playFM(300, 600, 800, 0.4, 'square', 0.15);
                    break;
                case 'magic':
                    this.playFM(1200, 434, 1000, 0.2, 'sine', 0.2);
                    break;

                case 'start_adventure':
                    this.playFM(220, 440, 200, 0.5, 'triangle', 0.2);
                    setTimeout(() => this.playFM(330, 660, 200, 0.5, 'triangle', 0.2), 150);
                    break;
                case 'gameOver':
                    this.playFM(100, 50, 300, 1.5, 'sawtooth', 0.4);
                    break;
                case 'speech':
                    this.playFM(300 + Math.random() * 100, 50, 100, 0.05, 'square', 0.1);
                    break;
            }
        } catch (e) {
            console.warn("Audio error:", e);
        }
    }
}

export const soundManager = new SoundSystem();
