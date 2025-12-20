import { useEffect } from 'react';
import { soundManager } from "@/engine/systems/SoundSystem";
import { Player } from "@/types";
import { DungeonState } from "@/hooks/useDungeon";

interface UseAudioControllerProps {
    gameStarted: boolean;
    gameOver: boolean;
    gameWon: boolean;
    player: Player | null;
    dungeon: DungeonState;
}

export function useAudioController({ gameStarted, gameOver, gameWon, player, dungeon }: UseAudioControllerProps) {
    // 1. Ambience Management
    useEffect(() => {
        if (gameStarted && !gameOver && !gameWon) {
            soundManager.initAmbience();
            soundManager.playDungeonAmbience();

            if (player) {
                let minDist = Infinity;
                if (dungeon.torches) {
                    dungeon.torches.forEach((torch: { x: number, y: number }) => {
                        const dist = Math.sqrt(Math.pow(torch.x - player.x, 2) + Math.pow(torch.y - player.y, 2));
                        if (dist < minDist) minDist = dist;
                    });
                }
                if (dungeon.npcs) {
                    const blacksmith = dungeon.npcs.find((n: { type: string, x: number, y: number }) => n.type === 'blacksmith');
                    if (blacksmith) {
                        const dist = Math.sqrt(Math.pow(blacksmith.x - player.x, 2) + Math.pow(blacksmith.y - player.y, 2));
                        if (dist * 0.8 < minDist) minDist = dist * 0.8;
                    }
                }
                soundManager.updateFireAmbience(minDist);
            }
        } else {
            soundManager.stopAmbience();
            soundManager.stopAmbienceMusic();
        }

        return () => {
            if (!gameStarted) {
                soundManager.stopAmbience();
                soundManager.stopAmbienceMusic();
            }
        };
    }, [gameStarted, gameOver, gameWon, player?.x, player?.y, dungeon.torches, dungeon.npcs]);

    // 2. Victory Music
    useEffect(() => {
        if (gameWon) {
            soundManager.playVictoryTheme();
        }
    }, [gameWon]);

    // 3. Level Up Sound
    useEffect(() => {
        if (player && player.level > 1 && gameStarted) {
            soundManager.play('levelUp');
        }
    }, [player?.level]);
}
