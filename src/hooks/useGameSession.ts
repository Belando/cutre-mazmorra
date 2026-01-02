import { useState } from 'react';
import { Entity } from '@/types';

export function useGameSession() {
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [gameWon, setGameWon] = useState(false);
    const [location, setLocation] = useState<'home' | 'dungeon'>('home');

    // Stats & Progression
    const [stats, setStats] = useState({ maxLevel: 1, kills: 0, gold: 0, playerLevel: 1 });

    // Quests
    const [activeQuests, setActiveQuests] = useState<string[]>([]);
    const [completedQuests, setCompletedQuests] = useState<string[]>([]);
    const [questProgress, setQuestProgress] = useState<Record<string, any>>({});

    // Player Meta
    const [selectedAppearance, setSelectedAppearance] = useState<any>(null);
    const [playerClass, setPlayerClass] = useState<'warrior' | 'mage' | 'rogue'>('warrior');
    const [playerName, setPlayerName] = useState('');

    // Combat UI
    const [selectedSkill, setSelectedSkill] = useState<any>(null);
    const [rangedMode, setRangedMode] = useState(false);
    const [rangedTargets, setRangedTargets] = useState<Entity[]>([]);

    return {
        gameStarted, setGameStarted,
        gameOver, setGameOver,
        gameWon, setGameWon,
        location, setLocation,
        stats, setStats,
        activeQuests, setActiveQuests,
        completedQuests, setCompletedQuests,
        questProgress, setQuestProgress,
        selectedAppearance, setSelectedAppearance,
        playerClass, setPlayerClass,
        playerName, setPlayerName,
        selectedSkill, setSelectedSkill,
        rangedMode, setRangedMode,
        rangedTargets, setRangedTargets
    };
}
