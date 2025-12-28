import { TILE_WIDTH, TILE_HEIGHT } from '@/data/constants';

/**
 * Converts 2D grid coordinates to Isometric screen coordinates.
 * @param gridX The X coordinate on the grid.
 * @param gridY The Y coordinate on the grid.
 * @returns An object containing the x and y screen coordinates.
 */
export function toScreen(gridX: number, gridY: number): { x: number; y: number } {
    const x = (gridX - gridY) * (TILE_WIDTH / 2);
    const y = (gridX + gridY) * (TILE_HEIGHT / 2);
    return { x, y };
}

/**
 * Converts Isometric screen coordinates back to 2D grid coordinates.
 * Useful for mouse interaction.
 * @param screenX The X coordinate on the screen (relative to map origin).
 * @param screenY The Y coordinate on the screen (relative to map origin).
 * @returns An object containing the x and y grid coordinates.
 */
export function toGrid(screenX: number, screenY: number): { x: number; y: number } {
    const x = (screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2;
    const y = (screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2;
    return { x: Math.round(x), y: Math.round(y) };
}
