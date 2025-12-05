import { useState, useCallback, useRef } from 'react';
import { EffectsManager } from '@/components/game/systems/EffectSystem';

const LOG_LENGTH = 50;

export function useGameEffects() {
  const [messages, setMessages] = useState([]);
  const effectsManager = useRef(new EffectsManager());

  const addMessage = useCallback((text, type = 'info') => {
    setMessages(prev => [...prev, { text, type }].slice(-LOG_LENGTH));
  }, []);

  const showFloatingText = useCallback((x, y, text, color) => {
    effectsManager.current.addText(x, y, text, color);
  }, []);

  return {
    messages,
    setMessages,
    addMessage,
    effectsManager, // Devolvemos la referencia
    showFloatingText
  };
}