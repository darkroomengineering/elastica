import type { Vector2D } from './types';
/**
 * Simple object pool for Vector2D arrays to reduce GC pressure in hot paths.
 *
 * USAGE:
 *   const vec = vectorPool.acquire()   // Get a [0, 0] vector
 *   vec[0] = x; vec[1] = y             // Use it
 *   vectorPool.release(vec)            // Return it when done
 *
 * IMPORTANT: Only use for temporary calculations within a single function.
 * Do not store pooled vectors in state - they will be reused!
 */
declare class VectorPool {
    private pool;
    private maxSize;
    constructor(initialSize?: number, maxSize?: number);
    /**
     * Get a vector from the pool (or create a new one if empty)
     * Vector is reset to [0, 0]
     */
    acquire(): Vector2D;
    /**
     * Return a vector to the pool for reuse
     */
    release(vec: Vector2D): void;
    /**
     * Get current pool size (for debugging)
     */
    get size(): number;
}
/**
 * Pool for 4-corner arrays used in OBB collision detection
 */
declare class CornersPool {
    private pool;
    private maxSize;
    constructor(initialSize?: number, maxSize?: number);
    acquire(): [Vector2D, Vector2D, Vector2D, Vector2D];
    release(corners: [Vector2D, Vector2D, Vector2D, Vector2D]): void;
    get size(): number;
}
/**
 * Pool for axes arrays used in SAT collision test
 * Each axes array holds 4 Vector2D (2 from each OBB)
 */
declare class AxesPool {
    private pool;
    private maxSize;
    constructor(initialSize?: number, maxSize?: number);
    acquire(): Vector2D[];
    release(axes: Vector2D[]): void;
    get size(): number;
}
export declare const vectorPool: VectorPool;
export declare const cornersPool: CornersPool;
export declare const axesPool: AxesPool;
export {};
