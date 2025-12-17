import { describe, it, expect, beforeEach } from 'vitest';
import { SpatialHash, SpatialEntity } from './SpatialHash';

describe('SpatialHash', () => {
    let spatialHash: SpatialHash;

    beforeEach(() => {
        spatialHash = new SpatialHash();
    });

    it('should add entities correctly', () => {
        const entity: SpatialEntity = { x: 10, y: 10, type: 'enemy', id: 1 };
        spatialHash.add(10, 10, entity);

        const retrieved = spatialHash.get(10, 10);
        expect(retrieved).toHaveLength(1);
        expect(retrieved[0]).toBe(entity);
    });

    it('should retrieve empty array for empty cell', () => {
        expect(spatialHash.get(0, 0)).toHaveLength(0);
    });

    it('should remove entities correctly', () => {
        const entity: SpatialEntity = { x: 5, y: 5, type: 'item' };
        spatialHash.add(5, 5, entity);
        spatialHash.remove(5, 5, entity);

        expect(spatialHash.get(5, 5)).toHaveLength(0);
    });

    it('should move entities correctly', () => {
        const entity: SpatialEntity = { x: 1, y: 1, type: 'player' };
        spatialHash.add(1, 1, entity);

        // Simular movimiento actualizando coordenadas de la entidad (si fuera ref)
        // Pero aquí SpatialHash no trackea la entidad, solo su referencia en la rejilla.
        // Simulamos el "move" del sistema
        spatialHash.move(1, 1, 2, 2, entity);

        expect(spatialHash.get(1, 1)).toHaveLength(0);
        expect(spatialHash.get(2, 2)).toHaveLength(1);
        expect(spatialHash.get(2, 2)[0]).toBe(entity);
    });

    it('should detect blocking entities', () => {
        const enemy: SpatialEntity = { x: 3, y: 3, type: 'enemy' };
        const item: SpatialEntity = { x: 4, y: 4, type: 'item' };

        spatialHash.add(3, 3, enemy);
        spatialHash.add(4, 4, item);

        expect(spatialHash.isBlocked(3, 3)).toBe(true);
        expect(spatialHash.isBlocked(4, 4)).toBe(false); // Items no bloquean según lógica
    });
});
