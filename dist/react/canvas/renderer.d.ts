import type { Vector2D } from '@darkroom.engineering/elastica';
import type { CanvasParticleData } from '../types';
/**
 * Renders particles to canvas using batched draw calls, with optional per-particle
 * custom draw callbacks.
 *
 * Draw order:
 *   1. Batched default pass — particles without a `draw` prop, grouped by visual
 *      properties (shape + fill + stroke + strokeWidth) to minimize state changes.
 *   2. Custom pass — particles with a `draw` prop, rendered individually on top.
 *
 * Performance:
 * - 200 white rects (no custom draw) = 1 draw call
 * - 100 white + 100 red = 2 draw calls
 * - Custom-draw particles each get their own save/restore + callback; no new arrays
 *   allocated per frame (inline check).
 *
 * Custom draw contract:
 *   Origin (0, 0) inside the callback = body center, rotation already applied.
 *   `scale` is the DPR factor in effect at the call site.
 */
export declare function renderBatched(ctx: CanvasRenderingContext2D, particles: CanvasParticleData[], positions: Vector2D[], angles: number[], scale?: number): void;
/**
 * Renders spatial hash grid for debugging.
 */
export declare function renderHashGrid(ctx: CanvasRenderingContext2D, gridSize: number, container: {
    width: number;
    height: number;
}): void;
