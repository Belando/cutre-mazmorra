// src/engine/systems/SoundSystem.ts
import { SoundEffectName, SOUND_ASSETS, SOUND_SETTINGS } from '@/data/sounds';
import { events, GAME_EVENTS } from '@/engine/core/EventManager';

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

    private listenerPos: { x: number, y: number } = { x: 0, y: 0 };

    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.masterVolume = 0.4;

        this.ambience = {
            fire: { node: null, gain: null },
            timer: null
        };

        this.setupEventListeners();
    }

    private setupEventListeners() {
        events.on(GAME_EVENTS.PLAYER_ATTACK, () => this.play('attack'));
        events.on(GAME_EVENTS.PLAYER_HIT, () => this.play('hit'));
        events.on(GAME_EVENTS.ENEMY_DIED, (data: any) => {
            const pos = data?.enemy ? { x: data.enemy.x, y: data.enemy.y } : undefined;
            this.play('kill', pos);
        });
        events.on(GAME_EVENTS.ITEM_PICKUP, () => this.play('pickup'));
        events.on(GAME_EVENTS.LEVEL_UP, () => this.play('levelUp'));
        events.on(GAME_EVENTS.SOUND_PLAY, (data: any) => {
            // data can be string name OR object { name, x, y }
            if (typeof data === 'string') this.play(data as SoundEffectName);
            else if (data && data.name) this.play(data.name, data);
        });
    }

    public updateListenerPosition(x: number, y: number) {
        this.listenerPos = { x, y };
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

    playSample(name: SoundEffectName, vol: number = 1.0, pitch: number = 1.0, pan: number = 0): boolean {
        // Intenta cargar si no está, pero no bloquea (fire & forget para la próxima)
        if (!this.buffers.has(name)) {
            this.loadAsset(name).then(buffer => {
                if (buffer) this.playSample(name, vol, pitch, pan);
            });
            return false;
        }

        const buffer = this.buffers.get(name);
        if (!buffer || !this.ctx) return false;

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = pitch;

        // Chain: Source -> Panner -> Gain -> Master
        let lastNode: AudioNode = source;

        // Stereo Panner (Web Audio API)
        // Check support (safeguard)
        if (this.ctx.createStereoPanner) {
            const panner = this.ctx.createStereoPanner();
            panner.pan.value = Math.max(-1, Math.min(1, pan)); // Clamp
            lastNode.connect(panner);
            lastNode = panner;
        }

        const gain = this.ctx.createGain();
        gain.gain.value = vol * this.masterVolume * 0.8;

        lastNode.connect(gain);
        gain.connect(this.ctx.destination);

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
    play(effectName: SoundEffectName, sourcePos?: { x: number, y: number }): void {
        try {
            this.init();

            // 1. CARGAR SETTINGS DESDE DATA (Refactorizado)
            const settings = SOUND_SETTINGS[effectName] || SOUND_SETTINGS['default'];
            const vol = settings.volume;
            const pitch = settings.pitch;

            // 2. CALCULAR PANNING & DISTANCE ATTENUATION
            let pan = 0;
            // let distVol = 1.0; 

            if (sourcePos) {
                const dx = sourcePos.x - this.listenerPos.x;
                // const dy = sourcePos.y - this.listenerPos.y;
                const MAX_PAN_DIST = 10; // Tiles logic

                // Pan based on X axis ONLY (Stereo)
                pan = dx / MAX_PAN_DIST;

                // Distance attenuation (Optional, keeps it simple for now)
                // const dist = Math.sqrt(dx*dx + dy*dy);
                // distVol = Math.max(0, 1 - dist / 15);
                // We apply pan. Volume attenuation might be too much if we want "clear" feedback.
            }

            // 3. REPRODUCIR SAMPLE
            const played = this.playSample(effectName, vol, pitch, pan);
            if (!played) {
                // Silently failed or loading
            }

        } catch (e) {
            console.warn("Audio error:", e);
        }
    }
}

export const soundManager = new SoundSystem();
