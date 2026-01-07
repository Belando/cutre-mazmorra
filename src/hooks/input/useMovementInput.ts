import { InputIntent } from '@/engine/input/InputTypes';
import { GameActions } from '../useGameActions';

export function useMovementInput(actions: GameActions) {
    const handleMovementInput = (intents: Set<InputIntent>): boolean => {
        let dx = 0;
        let dy = 0;

        if (intents.has(InputIntent.MOVE_UP)) dy -= 1;
        if (intents.has(InputIntent.MOVE_DOWN)) dy += 1;
        if (intents.has(InputIntent.MOVE_LEFT)) dx -= 1;
        if (intents.has(InputIntent.MOVE_RIGHT)) dx += 1;

        if (intents.has(InputIntent.MOVE_UP_LEFT)) { dx = -1; dy = -1; }
        if (intents.has(InputIntent.MOVE_UP_RIGHT)) { dx = 1; dy = -1; }
        if (intents.has(InputIntent.MOVE_DOWN_LEFT)) { dx = -1; dy = 1; }
        if (intents.has(InputIntent.MOVE_DOWN_RIGHT)) { dx = 1; dy = 1; }

        if (dx !== 0 || dy !== 0) {
            const gridDx = dx + dy;
            const gridDy = dy - dx;
            actions.move(Math.sign(gridDx), Math.sign(gridDy));
            return true;
        }

        return false;
    };

    return { handleMovementInput };
}
