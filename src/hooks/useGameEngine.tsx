import { useCallback, useEffect, useRef, useMemo } from 'react';
import { usePlayer } from './usePlayer';
import { useDungeon } from './useDungeon';
import { useInventory } from './useInventory';
import { useRealTimeSystem } from './useRealTimeSystem';
import { useGameEffects } from "@/hooks/useGameEffects";
import { useCombatLogic } from '@/hooks/useCombatLogic';
import { useGameActions } from '@/hooks/useGameActions';
import { SpatialHash } from '@/engine/core/SpatialHash';
import { ASSET_MANIFEST } from '@/data/assets';
import { spriteManager } from '@/engine/core/SpriteManager';
import { Player } from '@/types';
import { useAudioController } from './useAudioController';

import { useGameContext } from './useGameContext';
import { useGameLoop } from './useGameLoop';
import { useGameSession } from './useGameSession';
import { GAME_CONFIG } from '@/data/config';

export function useGameEngine() {
    const { player, setPlayer, initPlayer, updatePlayer, gainExp, regenerate: regenPlayer } = usePlayer();
    const { dungeon, setDungeon, generateLevel, updateMapFOV } = useDungeon();

    const {
        inventory, setInventory, equipment, setEquipment, materials, setMaterials,
        quickSlots, setQuickSlots, addItem, resetInventory,
        reorderInventory
    } = useInventory();

    const { updateGameState } = useRealTimeSystem();
    const { messages, setMessages, addMessage, effectsManager, showFloatingText } = useGameEffects();

    // 1. INSTANCIAR SPATIAL HASH
    const spatialHash = useRef(new SpatialHash());

    // CARGAR SPRITES
    useEffect(() => {
        const loadGameAssets = async () => {
            const promises = ASSET_MANIFEST.map(asset =>
                spriteManager.load(asset.key, asset.src)
                    .catch(err => console.warn(`Failed to lead asset: ${asset.key}`, err))
            );
            await Promise.all(promises);
            console.log("Assets loaded");
        };
        loadGameAssets();
    }, []);

    const session = useGameSession();
    const {
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
    } = session;

    // Refs for loop
    const gameStateRef = useRef({
        player,
        dungeon,
        gameStarted,
        gameOver,
        location // Add location to ref
    });

    useEffect(() => {
        gameStateRef.current = { player, dungeon, gameStarted, gameOver, location };
    }, [player, dungeon, gameStarted, gameOver, location]);

    // 2. SINCRONIZAR HASH CUANDO CAMBIA EL NIVEL O SE CARGA JUEGO
    useEffect(() => {
        if (dungeon && dungeon.map && dungeon.map.length > 0) {
            // Solo reconstruimos completo si cambia el nivel o el mapa
            // Los movimientos individuales usan spatialHash.move / updatePlayer
            spatialHash.current.rebuild({
                player: player || null,
                enemies: dungeon.enemies || [],
                chests: dungeon.chests || [],
                npcs: dungeon.npcs || [],
                items: dungeon.items || [],
                torches: dungeon.torches || [],
                map: dungeon.map,
                visible: dungeon.visible,
                explored: dungeon.explored,
                level: dungeon.level,
                bossDefeated: dungeon.bossDefeated,
                inventory,
                equipment,
                questProgress,
                materials,
                effectsManager: effectsManager.current,
                spatialHash: spatialHash.current,
                entities: dungeon.entities, // Pass entities grid
                location: dungeon.location || 'dungeon'
            });
        }
        // Eliminamos 'player' de las dependencias para evitar rebuild en cada movimiento
        // El jugador se actualiza via updatePlayer en el turno
    }, [dungeon?.level, dungeon?.map, dungeon?.entities, gameStarted, location]); // entities dependency added

    // 3. AUDIO CONTROLLER
    useAudioController({ gameStarted, gameOver, gameWon, player, dungeon });

    // REAL-TIME GAME LOOP
    // REAL-TIME GAME LOOP
    const accumulatorRef = useRef(0);
    const { TICK_RATE, MAX_ACCUMULATOR } = GAME_CONFIG.LOOP;

    useGameLoop((deltaTime) => {
        accumulatorRef.current += deltaTime;

        // Limit accumulator to prevent spiral of death
        if (accumulatorRef.current > MAX_ACCUMULATOR) accumulatorRef.current = MAX_ACCUMULATOR;

        while (accumulatorRef.current >= TICK_RATE) {
            const currentState = gameStateRef.current;
            if (currentState.player && currentState.dungeon) {
                updateGameState({
                    dungeon: currentState.dungeon,
                    setDungeon,
                    player: currentState.player,
                    setPlayer,
                    addMessage,
                    setGameOver,
                    showFloatingText,
                    spatialHash: spatialHash.current
                });
            }
            accumulatorRef.current -= TICK_RATE;
        }
    }, gameStarted && !gameOver);

    // Regen Loop - Could also be integrated into GameLoop or kept as simple interval
    // Keeping interval for now as it's low frequency (1s)
    useEffect(() => {
        if (!gameStarted || gameOver) return;
        const regenInterval = setInterval(() => {
            const currentState = gameStateRef.current;
            if (!currentState.player || !currentState.dungeon) return;
            // Call regenerate (updates MP, cooldowns, buffs)
            regenPlayer();
        }, 1000); // 1 sec

        return () => {
            clearInterval(regenInterval);
        };
    }, [gameStarted, gameOver, updateGameState, regenPlayer, addMessage, showFloatingText]);


    const { handleEnemyDeath, executeSkillAction, performAttack } = useCombatLogic({
        dungeon, setDungeon, player: player!, updatePlayer, gainExp, setStats,
        addMessage, addItem, effectsManager, setSelectedSkill, setGameWon,
        spatialHash: spatialHash.current,
        activeQuests, setQuestProgress // Pass Quest Props
    });

    // Modified initGame to support Home Base and Object Argument
    const initGame = useCallback((arg1: any = 1, arg2: Player | null = null, arg3: 'home' | 'dungeon' = 'home') => {
        let level = 1;
        let existingPlayer: Player | null = null;
        let startLocation: 'home' | 'dungeon' = 'home';

        if (typeof arg1 === 'object' && arg1 !== null && 'level' in arg1) {
            // Object call: initGame({ level: 1, startLocation: 'dungeon' })
            level = arg1.level || 1;
            existingPlayer = arg1.player || null;
            startLocation = arg1.startLocation || 'home';
        } else {
            // Legacy positional call
            level = typeof arg1 === 'number' ? arg1 : 1;
            existingPlayer = arg2;
            startLocation = arg3;
        }

        if (!existingPlayer && !player) initPlayer(null, playerClass, playerName);
        else if (existingPlayer) setPlayer({ ...existingPlayer, x: 0, y: 0 });

        setLocation(startLocation);

        const pLevel = existingPlayer?.level || player?.level || 1;
        const targetLevel = startLocation === 'home' ? 0 : level;
        const newDungeon = generateLevel(targetLevel, pLevel);

        if (newDungeon) {
            updatePlayer({ x: newDungeon.playerStart.x, y: newDungeon.playerStart.y });
            updateMapFOV(newDungeon.playerStart.x, newDungeon.playerStart.y);

            // Auto explore home
            if (targetLevel === 0 && newDungeon.explored) {
                // Reveal everything at home?
                // Or keep FOV? Home is usually fully visible or standard FOV.
                // keeping standard FOV is fine.
            }

        } else {
            console.error("Failed to init game level", level);
            return;
        }

        if (level === 1 && !existingPlayer) addMessage(`¡Bienvenido, ${playerName || 'Héroe'}!`, 'info');
        if (startLocation === 'home') addMessage("Hogar dulce hogar.", 'info');
        else addMessage(`Piso ${level}`, 'info');

    }, [playerClass, playerName, generateLevel, initPlayer, updatePlayer, updateMapFOV, addMessage, player]);

    // --- ACTIONS CONTEXT ---
    const actionsContext = useGameContext(
        player, dungeon, inventory, equipment, materials, quickSlots, stats, activeQuests, completedQuests, questProgress,
        {
            setPlayer, updatePlayer, gainExp,
            setDungeon,
            setInventory, addItem,
            setEquipment,
            setMaterials,
            setQuickSlots,
            resetInventory,
            reorderInventory,
            setStats,
            setActiveQuests,
            setCompletedQuests,
            setQuestProgress,
            setGameStarted, setGameOver, setPlayerName, setSelectedSkill, setRangedMode, setRangedTargets, setMessages, updateMapFOV, setGameWon,
            setSelectedAppearance, setPlayerClass
        },
        {
            initGame, addMessage, showFloatingText, effectsManager,
            handleEnemyDeath, executeSkillAction, performAttack
        },
        {
            playerName, selectedAppearance, playerClass, selectedSkill, rangedMode, rangedTargets
        },
        spatialHash.current
    );

    const actions = useGameActions(actionsContext);

    // Initial Start at Home
    useEffect(() => {
        if (gameStarted && !player) initGame(1, null, 'home');
    }, [gameStarted, player, initGame]);

    // CHEATS / DEBUG
    useEffect(() => {
        (window as any).cheat = {
            levelUp: (amount = 1) => {
                // 100 exp per level approx? Let's just give a lot.
                // Or better, call gainExp loop.
                // Assuming base exp needed is 100 * level or similar.
                const expNeeded = (player?.nextLevelExp || 100) - (player?.exp || 0);
                gainExp(expNeeded + 1);
                console.log(`Level Up!`);
                if (amount > 1) {
                    setTimeout(() => (window as any).cheat.levelUp(amount - 1), 100);
                }
            },
            godMode: () => {
                const newHp = 9999;
                setPlayer(p => p ? ({ ...p, hp: newHp, maxHp: newHp, stats: { ...p.stats, hp: newHp, maxHp: newHp, defense: 999 } }) : null);
                console.log("God Mode Active");
            },
            gold: (amount = 1000) => {
                updatePlayer({ gold: (player?.gold || 0) + amount });
                console.log(`Rich! +${amount} gold`);
            }
        };
        // console.log("Cheats loaded"); // Removed spam
    }, [player, gainExp, setPlayer, updatePlayer]);

    useEffect(() => {
        if (player && player.level > 1 && gameStarted) {
            effectsManager.current.addSparkles(player.x, player.y, '#ffff00');
            addMessage(`¡Nivel ${player.level} alcanzado!`, 'levelup');
        }
    }, [player?.level]);

    const gameState = useMemo(() => ({
        player,
        map: dungeon.map || [],
        enemies: dungeon.enemies || [],
        items: dungeon.items || [],
        chests: dungeon.chests || [],
        torches: dungeon.torches || [],
        corpses: dungeon.corpses || [],
        npcs: dungeon.npcs || [],
        stairs: dungeon.stairs,
        stairsUp: dungeon.stairsUp,
        visible: dungeon.visible, explored: dungeon.explored, level: dungeon.level, bossDefeated: dungeon.bossDefeated,
        inventory, equipment, questProgress, materials, effectsManager: effectsManager.current,
        spatialHash: spatialHash.current,
        entities: dungeon.entities, // Include entities grid
        location // Export location
    }), [player, dungeon, inventory, equipment, questProgress, materials, location]);

    const playerInfo = useMemo(() => ({ name: playerName, class: playerClass, appearance: selectedAppearance }), [playerName, playerClass, selectedAppearance]);
    const uiState = useMemo(() => ({ activeQuests, completedQuests, questProgress, materials, quickSlots, selectedSkill, rangedMode, rangedTargets }), [activeQuests, completedQuests, questProgress, materials, quickSlots, selectedSkill, rangedMode, rangedTargets]);

    return {
        gameState, gameStarted, gameOver, gameWon, messages, stats,
        playerInfo,
        uiState,
        actions
    };
}
