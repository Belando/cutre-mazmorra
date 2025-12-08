import { useState, useCallback, useRef } from 'react';
import { EffectsManager } from "@/engine/systems/EffectSystem";

const LOG_LENGTH = 50;

export function useGameEffects() {
  const [messages, setMessages] = useState([]);
  const effectsManager = useRef(new EffectsManager());

  const addMessage = useCallback((text, type = 'info') => {
    setMessages(prev => [...prev, { text, type }].slice(-LOG_LENGTH));
  }, []);

  // CAMBIO: Acepta isCritical e isSmall
  const showFloatingText = useCallback((x, y, text, color, isCritical = false, isSmall = false) => {
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