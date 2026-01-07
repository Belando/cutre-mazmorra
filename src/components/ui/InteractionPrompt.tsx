import React from 'react';
import { GameState } from '@/types';
import { ENTITY, TILE } from '@/data/constants';
import { useInputMethod } from '@/hooks/useInputMethod';

interface InteractionPromptProps {
    gameState: GameState;
}

export const InteractionPrompt: React.FC<InteractionPromptProps> = ({ gameState }) => {
    const { player, map, entities, npcs, chests } = gameState;
    const inputMethod = useInputMethod();

    if (!player) return null;

    const { x, y } = player;

    const getKeyText = (action: string) => {
        const isGamepad = inputMethod === 'gamepad';
        const key = isGamepad ? 'Ⓐ' : 'E';
        return `${key} - ${action}`;
    };

    // Helper to get action text
    const getAction = (): string | null => {
        // 1. Check current tile (Stairs)
        const currentTile = map[y]?.[x];
        if (currentTile === TILE.STAIRS) return getKeyText("Descender");
        if (currentTile === TILE.STAIRS_UP) return getKeyText("Subir");

        // 2. Check adjacent tiles
        const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // Up, Down, Left, Right

        for (const [dx, dy] of dirs) {
            const tx = x + dx;
            const ty = y + dy;

            // Check Bounds
            if (ty < 0 || ty >= map.length || tx < 0 || tx >= map[0].length) continue;

            // NPCs
            const npc = npcs.find(n => n.x === tx && n.y === ty);
            if (npc) return getKeyText("Hablar");

            // Chests
            const chest = chests.find(c => c.x === tx && c.y === ty);
            if (chest && !chest.isOpen) return getKeyText("Abrir");

            // Doors
            const tile = map[ty][tx];
            if (tile === TILE.DOOR) return getKeyText("Abrir");

            // Static Entities (Trees, Rocks, etc.)
            const entityType = entities[ty]?.[tx];
            if (entityType) {
                if (entityType === ENTITY.TREE || entityType === ENTITY.ROCK || entityType === ENTITY.PLANT) {
                    return getKeyText("Recolectar");
                }
                if (entityType === ENTITY.CRATE || entityType === ENTITY.BARREL) {
                    return getKeyText("Romper");
                }
                if (entityType === ENTITY.DUNGEON_GATE) {
                    return getKeyText("Entrar");
                }
            }
        }

        return null;
    };

    const actionText = getAction();

    if (!actionText) return null;

    return (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 pointer-events-none z-50">
            <div className="bg-black/80 text-white px-6 py-2 rounded-full border border-white/20 text-lg font-medium shadow-lg backdrop-blur-sm animate-bounce-subtle">
                {actionText}
            </div>
        </div>
    );
};
