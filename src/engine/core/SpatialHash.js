export class SpatialHash {
  constructor() {
    this.grid = new Map();
  }

  _key(x, y) {
    return `${x},${y}`;
  }

  // Añadir entidad al hash
  add(x, y, entity) {
    const key = this._key(x, y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key).push(entity);
  }

  // Eliminar entidad específica de una posición
  remove(x, y, entity) {
    const key = this._key(x, y);
    if (this.grid.has(key)) {
      const list = this.grid.get(key);
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
  move(oldX, oldY, newX, newY, entity) {
    this.remove(oldX, oldY, entity);
    this.add(newX, newY, entity);
  }

  // Obtener todas las entidades en una posición
  get(x, y) {
    return this.grid.get(this._key(x, y)) || [];
  }

  // Obtener la primera entidad que cumpla un criterio (opcional)
  find(x, y, predicate) {
    const entities = this.get(x, y);
    return entities.find(predicate) || null;
  }

  // Verificar si hay algo bloqueante (Muros se chequean en el mapa, esto es para entidades)
  isBlocked(x, y) {
    const entities = this.get(x, y);
    // Asumimos que enemigos, cofres y NPCs bloquean. Items no.
    return entities.some(e => ['enemy', 'chest', 'npc', 'player'].includes(e.type));
  }

  // Reconstrucción total (útil al cambiar de nivel o cargar partida)
  rebuild(gameState) {
    this.grid.clear();
    const { enemies, chests, npcs, items, player } = gameState;

    // Registramos todo con una propiedad 'type' auxiliar para identificarlo rápido
    if (player) this.add(player.x, player.y, { ...player, type: 'player', ref: player });
    enemies.forEach(e => this.add(e.x, e.y, { ...e, type: 'enemy', ref: e }));
    chests.forEach(c => this.add(c.x, c.y, { ...c, type: 'chest', ref: c }));
    npcs.forEach(n => this.add(n.x, n.y, { ...n, type: 'npc', ref: n }));
    items.forEach(i => this.add(i.x, i.y, { ...i, type: 'item', ref: i }));
  }
}