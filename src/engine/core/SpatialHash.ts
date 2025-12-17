import { GameState } from "@/types";

export interface SpatialEntity {
    x: number;
    y: number;
    type: string | number;
    ref?: any;
    [key: string]: any;
}

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
            const index = list.indexOf(entity);
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
    rebuild(gameState: GameState): void {
        this.grid.clear();
        const { enemies, chests, npcs, items, player } = gameState as any; // Cast to any to access chests/npcs/items if not in GameState interface yet

        // Registramos todo con una propiedad 'type' auxiliar para identificarlo rápido
        if (player) this.add(player.x, player.y, { ...player, type: 'player', ref: player });

        // Safety checks for arrays
        if (enemies) enemies.forEach((e: any) => this.add(e.x, e.y, { ...e, type: 'enemy', ref: e }));
        if (chests) chests.forEach((c: any) => this.add(c.x, c.y, { ...c, type: 'chest', ref: c }));
        if (npcs) npcs.forEach((n: any) => this.add(n.x, n.y, { ...n, type: 'npc', ref: n }));
        if (items) items.forEach((i: any) => this.add(i.x, i.y, { ...i, type: 'item', ref: i }));
    }
}
