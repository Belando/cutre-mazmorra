type EventHandler<T = any> = (payload: T) => void;

class EventManager {
    private listeners: Map<string, EventHandler[]> = new Map();

    // Subscribe to an event
    on<T = any>(event: string, handler: EventHandler<T>): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(handler);
    }

    // Unsubscribe from an event
    off<T = any>(event: string, handler: EventHandler<T>): void {
        if (!this.listeners.has(event)) return;
        const handlers = this.listeners.get(event)!;
        this.listeners.set(event, handlers.filter(h => h !== handler));
    }

    // Emit an event
    emit<T = any>(event: string, payload?: T): void {
        if (!this.listeners.has(event)) return;
        this.listeners.get(event)!.forEach(handler => {
            try {
                handler(payload);
            } catch (error) {
                console.error(`Error in event handler for "${event}":`, error);
            }
        });
    }

    // Clear all listeners (useful for reset/cleanup)
    clear(): void {
        this.listeners.clear();
    }
}

// Singleton instance
export const events = new EventManager();

// Known Events Enum for Type Safety reference
export enum GAME_EVENTS {
    PLAYER_MOVED = 'PLAYER_MOVED',
    PLAYER_ATTACK = 'PLAYER_ATTACK',
    PLAYER_HIT = 'PLAYER_HIT',
    PLAYER_HEAL = 'PLAYER_HEAL',
    PLAYER_DIED = 'PLAYER_DIED',

    ENEMY_SPAWNED = 'ENEMY_SPAWNED',
    ENEMY_DAMAGED = 'ENEMY_DAMAGED',
    ENEMY_DIED = 'ENEMY_DIED',

    ITEM_PICKUP = 'ITEM_PICKUP',
    ITEM_DROP = 'ITEM_DROP',
    ITEM_USE = 'ITEM_USE',

    LEVEL_UP = 'LEVEL_UP',
    DUNGEON_GENERATED = 'DUNGEON_GENERATED',

    SOUND_PLAY = 'SOUND_PLAY',
    SCREEN_SHAKE = 'SCREEN_SHAKE',
}
