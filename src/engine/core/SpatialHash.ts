import { GameState, Entity, Player } from "@/types";
import { ENTITY } from "@/data/constants";

// Entity is a union type, so we cannot extend it via interface. 
// Using intersection on a type instead.
export type SpatialEntity = Partial<Entity> & {
    x: number;
    y: number;
    type: string | number;
    ref?: any;
    [key: string]: any;
};


export class SpatialHash {
    private grid: Map<string, SpatialEntity[]>;

    constructor() {
        this.grid = new Map();
    }

    private _key(x: number, y: number): string {
        return `${x},${y}`;
    }

    // Añadir entidad al hash
    add(x: number, y: number, entity: SpatialEntity): void {
        const key = this._key(x, y);
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key)!.push(entity);
    }

    // Eliminar entidad específica de una posición
    remove(x: number, y: number, entity: SpatialEntity): void {
        const key = this._key(x, y);
        if (this.grid.has(key)) {
            const list = this.grid.get(key)!;

            // Try to find by ID first if present
            const index = list.findIndex(e => {
                if (entity.id !== undefined && e.id !== undefined) {
                    return e.id === entity.id;
                }
                return e === entity;
            });

            if (index !== -1) {
                list.splice(index, 1);
                // Limpieza de memoria si la lista queda vacía
                if (list.length === 0) {
                    this.grid.delete(key);
                }
            }
        }
    }

    // Mover entidad de una posición a otra de forma atómica
    move(oldX: number, oldY: number, newX: number, newY: number, entity: SpatialEntity): void {
        this.remove(oldX, oldY, entity);
        this.add(newX, newY, entity);
    }

    // Obtener todas las entidades en una posición
    get(x: number, y: number): SpatialEntity[] {
        return this.grid.get(this._key(x, y)) || [];
    }

    // Obtener la primera entidad que cumpla un criterio (opcional)
    find(x: number, y: number, predicate: (e: SpatialEntity) => boolean): SpatialEntity | null {
        const entities = this.get(x, y);
        return entities.find(predicate) || null;
    }

    // Verificar si hay algo bloqueante (Muros se chequean en el mapa, esto es para entidades)
    isBlocked(x: number, y: number): boolean {
        const entities = this.get(x, y);
        // Asumimos que enemigos, cofres y NPCs bloquean. Items no.
        return entities.some(e => ['enemy', 'chest', 'npc', 'player'].includes(String(e.type)));
    }

    // Reconstrucción total (útil al cambiar de nivel o cargar partida)
    rebuild(gameState: GameState & { entities?: number[][] }): void {
        this.grid.clear();
        const { enemies, chests, npcs, items, player, entities } = gameState;

        // Registramos todo con una propiedad 'type' auxiliar para identificarlo rápido
        if (player) this.add(player.x, player.y, { ...player, type: 'player', ref: player });

        // Safety checks for arrays
        if (enemies) enemies.forEach(e => this.add(e.x, e.y, { ...e, type: 'enemy', ref: e }));
        if (chests) chests.forEach(c => this.add(c.x, c.y, { ...c, type: 'chest', ref: c }));
        if (npcs) npcs.forEach(n => this.add(n.x, n.y, { ...n, type: 'npc', ref: n }));
        if (items) items.forEach(i => {
            const ix = i.x ?? 0;
            const iy = i.y ?? 0;
            this.add(ix, iy, { ...i, x: ix, y: iy, type: 'item', ref: i });
        });

        // Scan entities grid for static interactables (Home Base)
        if (entities) {
            const height = entities.length;
            const width = entities[0]?.length || 0;
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const id = entities[y][x];
                    if (id > 0) { // Assuming 0 is NONE
                        // Map specific IDs to types
                        // We need to import ENTITY/CONSTANTS conceptually, but avoiding cyclic dep.
                        // Let's rely on ID ranges or values known.
                        // TREE: 200, ROCK: 201, WORKBENCH: 202, GATE: 203
                        let type = '';
                        if (id === ENTITY.TREE) type = 'tree';
                        else if (id === ENTITY.ROCK) type = 'rock';
                        else if (id === ENTITY.WORKBENCH) type = 'workbench';
                        else if (id === ENTITY.DUNGEON_GATE || id === ENTITY.DUNGEON_GATE_TRIGGER) type = 'dungeon_gate'; // 203=Visual, 205=Trigger
                        else if (id === ENTITY.PLANT) type = 'plant';
                        else if (id === ENTITY.BLOCKER) type = 'blocker';

                        if (type) {
                            this.add(x, y, { x, y, type, id, ref: { x, y, id, type } });
                        }
                    }
                }
            }
        }
    }

    updatePlayer(player: Player): void {
        // Optimization: The caller (useTurnSystem) knows the player. 
        // We update the REF at the CURRENT position.
        const currentList = this.get(player.x, player.y);
        const index = currentList.findIndex(e => e.type === 'player');
        if (index !== -1) {
            currentList[index] = { ...player, type: 'player', ref: player };
        } else {
            // Player moved or not found at strict coords? Just add it.
            this.add(player.x, player.y, { ...player, type: 'player', ref: player });
        }
    }
}
