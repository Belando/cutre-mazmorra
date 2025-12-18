import { useState, useCallback, useRef } from 'react';
import { EffectsManager } from "@/engine/systems/EffectSystem";

const LOG_LENGTH = 50;

export interface GameMessage {
    text: string;
    type: string;
}

export interface UseGameEffectsResult {
    messages: GameMessage[];
    setMessages: React.Dispatch<React.SetStateAction<GameMessage[]>>;
    addMessage: (text: string, type?: string) => void;
    effectsManager: React.MutableRefObject<EffectsManager>;
    showFloatingText: (x: number, y: number, text: string, color: string, isCritical?: boolean, isSmall?: boolean) => void;
}

export function useGameEffects(): UseGameEffectsResult {
    const [messages, setMessages] = useState<GameMessage[]>([]);
    const effectsManager = useRef(new EffectsManager());

    const addMessage = useCallback((text: string, type: string = 'info') => {
        setMessages(prev => [...prev, { text, type }].slice(-LOG_LENGTH));
    }, []);

    const showFloatingText = useCallback((x: number, y: number, text: string, color: string, isCritical: boolean = false, isSmall: boolean = false) => {
        effectsManager.current.addText(x, y, text, color, isCritical, isSmall);
    }, []);

    return {
        messages,
        setMessages,
        addMessage,
        effectsManager,
        showFloatingText
    };
}
