// src/engine/systems/SoundSystem.ts
import { SoundEffectName, SOUND_ASSETS, SOUND_SETTINGS } from '@/data/sounds';

interface FireAmbience {
    node: AudioBufferSourceNode | null;
    gain: GainNode | null;
}

interface Ambience {
    fire: FireAmbience;
    timer: NodeJS.Timeout | null;
}

export type { SoundEffectName };

export class SoundSystem {
    ctx: AudioContext | null;
    enabled: boolean;
    masterVolume: number;
    ambience: Ambience;
    buffers: Map<string, AudioBuffer> = new Map();

    private activeAmbienceNodes: AudioNode[] = [];
    private ambienceSource: AudioBufferSourceNode | null = null;
    currentAmbiencePath: string | null = null;

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
    // 2. AMBIENTE
    // ==========================================

    initAmbience(): void {
        if (!this.enabled) return;
        this.init();
        if (!this.ambience.fire.node) {
            this.createFireLoop(); // Async, fire & forget
        }
    }

    async createFireLoop(): Promise<void> {
        if (!this.ctx) return;

        // 1. Intentar cargar sample de fuego
        const fireBuffer = await this.loadAsset('/sounds/ambience/torch_loop.wav');

        // Si ya hay nodo (race condition), pararlo
        if (this.ambience.fire.node) {
            try { this.ambience.fire.node.stop(); } catch (e) { }
        }

        if (fireBuffer) {
            const gain = this.ctx.createGain();
            gain.gain.value = 0;

            const source = this.ctx.createBufferSource();
            source.buffer = fireBuffer;
            source.loop = true;
            source.connect(gain);
            gain.connect(this.ctx.destination);
            source.start();

            this.ambience.fire = { node: source, gain: gain };
        }
        // Si no carga, silencio total (sin fallback sintético)
    }

    stopAmbience(): void {
        if (this.ambience.fire.node) {
            try { this.ambience.fire.node.stop(); } catch (e) { }
            this.ambience.fire.node = null;
        }
        if (this.ambience.timer) {
            clearTimeout(this.ambience.timer);
            this.ambience.timer = null;
        }
    }

    updateFireAmbience(distance: number): void {
        if (!this.ambience.fire.gain || !this.ctx) return;
        const maxDist = 8; // Aumentado radio de escucha
        let vol = 0;
        if (distance < maxDist) {
            // Caída lineal para que se escuche mejor a media distancia (3-4 tiles)
            const factor = 1 - (distance / maxDist);
            vol = factor * 0.3;
        }
        this.ambience.fire.gain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.5);
    }


    // ==========================================
    // SYSTEMA DE AUDIO BASADO EN SAMPLES
    // ==========================================

    // Preload opcional
    async loadAsset(name: SoundEffectName | string): Promise<AudioBuffer | null> {
        const path = (SOUND_ASSETS as any)[name] || name;
        if (!path) return null;

        if (this.buffers.has(name)) return this.buffers.get(name)!;

        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
            this.buffers.set(name, audioBuffer);
            return audioBuffer;
        } catch (e) {
            // console.warn(`Failed to load audio: ${name}`, e);
            return null;
        }
    }

    playSample(name: SoundEffectName, vol: number = 1.0, pitch: number = 1.0): boolean {
        // Intenta cargar si no está, pero no bloquea (fire & forget para la próxima)
        if (!this.buffers.has(name)) {
            this.loadAsset(name).then(buffer => {
                if (buffer) this.playSample(name, vol, pitch);
            });
            return false;
        }

        const buffer = this.buffers.get(name);
        if (!buffer || !this.ctx) return false;

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = pitch;

        const gain = this.ctx.createGain();
        // Ajuste de volumen para samples (suelen sonar fuerte)
        gain.gain.value = vol * this.masterVolume * 0.8;

        source.connect(gain).connect(this.ctx.destination);
        source.start();
        return true;
    }

    // ==========================================
    // 4. MÚSICA & AMBIENTE (MEJORADO)
    // ==========================================

    async playDungeonAmbience(): Promise<void> {
        if (!this.enabled) return;
        this.init();
        this.stopAmbienceMusic();

        // A. Intentar cargar sample loop real
        const path = '/sounds/ambience/dungeon_loop.mp3';
        try {
            const response = await fetch(path);
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);

                const source = this.ctx!.createBufferSource();
                source.buffer = audioBuffer;
                source.loop = true;
                const gain = this.ctx!.createGain();
                gain.gain.value = 0.4 * this.masterVolume;

                source.connect(gain).connect(this.ctx!.destination);
                source.start();
                this.ambienceSource = source;
                this.activeAmbienceNodes.push(source, gain);
                this.currentAmbiencePath = path;
                return; // Éxito
            }
        } catch (e) { }

        // B. Si falla, silencio.
    }

    stopAmbienceMusic(): void {
        if (this.ambienceSource) {
            try { this.ambienceSource.stop(); } catch (e) { }
            this.ambienceSource = null;
        }
        this.activeAmbienceNodes.forEach(node => {
            try {
                if (node instanceof AudioBufferSourceNode || node instanceof OscillatorNode) {
                    node.stop();
                    node.disconnect();
                } else {
                    node.disconnect();
                }
            } catch (e) { }
        });
        this.activeAmbienceNodes = [];
    }

    async playVictoryTheme(): Promise<void> {
        if (!this.enabled) return;
        this.init();
        this.stopAmbienceMusic();

        // A. Intentar cargar sample
        const path = '/sounds/music/victory.mp3';
        try {
            const response = await fetch(path);
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
                const source = this.ctx!.createBufferSource();
                source.buffer = audioBuffer;
                const gain = this.ctx!.createGain();
                gain.gain.value = 0.5 * this.masterVolume;
                source.connect(gain).connect(this.ctx!.destination);
                source.start();
                this.activeAmbienceNodes.push(source, gain);
            }
        } catch (e) { }
        // B. Si falla, silencio.
    }

    // ==========================================
    // 5. CATÁLOGO DE EFECTOS
    // ==========================================
    play(effectName: SoundEffectName): void {
        try {
            this.init();

            // 1. CARGAR SETTINGS DESDE DATA (Refactorizado)
            const settings = SOUND_SETTINGS[effectName] || SOUND_SETTINGS['default'];
            const vol = settings.volume;
            const pitch = settings.pitch;

            // 2. REPRODUCIR SAMPLE
            const played = this.playSample(effectName, vol, pitch);
            if (!played) {
                // Silently failed or loading
            }

        } catch (e) {
            console.warn("Audio error:", e);
        }
    }
}

export const soundManager = new SoundSystem();
