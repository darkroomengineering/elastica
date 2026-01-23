import type { Vector2D } from '@darkroom.engineering/elastica';
import type { CanvasParticleData } from '../types';
/**
 * Renders particles to canvas using batched draw calls.
 *
 * Particles are grouped by visual properties (shape + fill + stroke + strokeWidth)
 * to minimize context state changes and maximize batching efficiency.
 *
 * Performance:
 * - 200 white rects = 1 draw call
 * - 100 white + 100 red = 2 draw calls
 */
export declare function renderBatched(ctx: CanvasRenderingContext2D, particles: CanvasParticleData[], positions: Vector2D[], angles: number[]): void;
/**
 * Renders spatial hash grid for debugging.
 */
export declare function renderHashGrid(ctx: CanvasRenderingContext2D, gridSize: number, container: {
    width: number;
    height: number;
}): void;
