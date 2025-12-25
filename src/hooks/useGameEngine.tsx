import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { usePlayer } from './usePlayer';
import { useDungeon } from './useDungeon';
import { useInventory } from './useInventory';
import { useTurnSystem } from './useTurnSystem';
import { useGameEffects } from "@/hooks/useGameEffects";
import { useCombatLogic } from '@/hooks/useCombatLogic';
import { useGameActions, GameActionsContext } from '@/hooks/useGameActions';
import { SpatialHash } from '@/engine/core/SpatialHash';
import { ASSET_MANIFEST } from '@/data/assets';
import { spriteManager } from '@/engine/core/SpriteManager';
import { Entity, Player, Enemy, NPC, Item } from '@/types';
import { useAudioController } from './useAudioController';
import { useGameContext } from './useGameContext';
import { PlayerClass } from '@/types/enums';

export function useGameEngine() {
    const { player, setPlayer, initPlayer, updatePlayer, gainExp, regenerate: regenPlayer } = usePlayer();
    const { dungeon, setDungeon, generateLevel, updateMapFOV } = useDungeon();

    const {
        inventory, setInventory, equipment, setEquipment, materials, setMaterials,
        quickSlots, setQuickSlots, addItem, addMaterial, resetInventory,
        reorderInventory
    } = useInventory();

    const { processTurn } = useTurnSystem();
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

    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [stats, setStats] = useState({ maxLevel: 1, kills: 0, gold: 0, playerLevel: 1 });
    const [activeQuests, setActiveQuests] = useState<string[]>([]);
    const [completedQuests, setCompletedQuests] = useState<string[]>([]);
    const [questProgress, setQuestProgress] = useState<Record<string, any>>({});
    const [selectedAppearance, setSelectedAppearance] = useState<any>(null);
    const [playerClass, setPlayerClass] = useState<PlayerClass>(PlayerClass.WARRIOR);
    const [playerName, setPlayerName] = useState('');
    const [selectedSkill, setSelectedSkill] = useState<any>(null);
    const [rangedMode, setRangedMode] = useState(false);
    const [rangedTargets, setRangedTargets] = useState<Entity[]>([]);
    const [gameWon, setGameWon] = useState(false);

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
                spatialHash: spatialHash.current
            });
        }
        // Eliminamos 'player' de las dependencias para evitar rebuild en cada movimiento
        // El jugador se actualiza via updatePlayer en el turno
    }, [dungeon?.level, dungeon?.map, gameStarted]);

    // 3. GESTIÓN DE AMBIENTE SONORO (NUEVO)
    // 3. AUDIO CONTROLLER
    useAudioController({ gameStarted, gameOver, gameWon, player, dungeon });

    const executeTurn = useCallback((currentPlayerState: Player | null = player, enemiesOverride: Entity[] | null = null) => {
        regenPlayer();
        const dungeonState = enemiesOverride ? { ...dungeon, enemies: enemiesOverride } : dungeon;

        if (!currentPlayerState) return;

        processTurn({
            dungeon: dungeonState,
            setDungeon,
            player: currentPlayerState,
            setPlayer,
            addMessage,
            setGameOver,
            showFloatingText,
            // Pasamos el hash actualizado a la IA
            spatialHash: spatialHash.current
        });
        updateMapFOV(currentPlayerState.x, currentPlayerState.y);
    }, [dungeon, player, regenPlayer, processTurn, updateMapFOV, addMessage, setPlayer, setDungeon, showFloatingText]);

    const { handleEnemyDeath, executeSkillAction } = useCombatLogic({
        dungeon, setDungeon, player: player!, updatePlayer, gainExp, setStats,
        addMessage, addItem, effectsManager, executeTurn, setSelectedSkill, setGameWon,
        spatialHash: spatialHash.current
    });

    const initGame = useCallback((level: number = 1, existingPlayer: Player | null = null) => {
        if (!existingPlayer && !player) initPlayer(null, playerClass, playerName);
        else if (existingPlayer) setPlayer({ ...existingPlayer, x: 0, y: 0 });

        const pLevel = existingPlayer?.level || player?.level || 1;
        const newDungeon = generateLevel(level, pLevel);

        if (newDungeon) {
            updatePlayer({ x: newDungeon.playerStart.x, y: newDungeon.playerStart.y });
            updateMapFOV(newDungeon.playerStart.x, newDungeon.playerStart.y);
        } else {
            console.error("Failed to init game level", level);
            return;
        }

        if (level === 1 && !existingPlayer) addMessage(`¡Bienvenido, ${playerName || 'Héroe'}!`, 'info');
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
            initGame, executeTurn, addMessage, showFloatingText, effectsManager,
            handleEnemyDeath, executeSkillAction
        },
        {
            playerName, selectedAppearance, playerClass, selectedSkill, rangedMode, rangedTargets
        },
        spatialHash.current
    );

    const actions = useGameActions(actionsContext);

    useEffect(() => { if (gameStarted && !player) initGame(1); }, [gameStarted, player, initGame]);

    useEffect(() => {
        if (player && player.level > 1 && gameStarted) {
            effectsManager.current.addSparkles(player.x, player.y, '#ffff00');
            addMessage(`¡Nivel ${player.level} alcanzado!`, 'levelup');
        }
    }, [player?.level]);

    const gameState = useMemo(() => ({
        player, map: dungeon.map, enemies: dungeon.enemies, items: dungeon.items, chests: dungeon.chests,
        torches: dungeon.torches, npcs: dungeon.npcs, stairs: dungeon.stairs, stairsUp: dungeon.stairsUp,
        visible: dungeon.visible, explored: dungeon.explored, level: dungeon.level, bossDefeated: dungeon.bossDefeated,
        inventory, equipment, questProgress, materials, effectsManager: effectsManager.current,
        spatialHash: spatialHash.current
    }), [player, dungeon, inventory, equipment, questProgress, materials]);

    const playerInfo = useMemo(() => ({ name: playerName, class: playerClass, appearance: selectedAppearance }), [playerName, playerClass, selectedAppearance]);
    const uiState = useMemo(() => ({ activeQuests, completedQuests, questProgress, materials, quickSlots, selectedSkill, rangedMode, rangedTargets }), [activeQuests, completedQuests, questProgress, materials, quickSlots, selectedSkill, rangedMode, rangedTargets]);

    return {
        gameState, gameStarted, gameOver, gameWon, messages, stats,
        playerInfo,
        uiState,
        actions
    };
}
