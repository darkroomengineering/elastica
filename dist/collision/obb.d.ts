import type { CollisionRecord, CollisionResult, ContactPoint, Vector2D } from '../types';
/**
 * State required for OBB collision detection
 */
export type OBBState = {
    positions: Vector2D[];
    velocities: Vector2D[];
    dimensions: Vector2D[];
    angles: number[];
    angularVelocities: number[];
    masses: number[];
    momentsOfInertia: number[];
    restitutions: number[];
    maxExtents: number[];
    isStatic: boolean[];
    hash: number[];
    gridSize: number;
    buckets: Map<number, number[]>;
};
/**
 * Get the four corners of a rotated rectangle (OBB)
 * Returns corners in order: top-left, top-right, bottom-right, bottom-left
 *
 * @param corners - Optional pre-allocated corners array to fill (from pool)
 * @returns The corners array, or null if invalid state
 */
export declare function getOBBCorners(state: OBBState, index: number, corners?: [Vector2D, Vector2D, Vector2D, Vector2D]): [Vector2D, Vector2D, Vector2D, Vector2D] | null;
/**
 * Get the two edge normals (axes) for SAT collision test
 */
export declare function getOBBAxes(state: OBBState, index: number): [Vector2D, Vector2D] | null;
/**
 * Project an OBB onto an axis and return the min/max projection values
 */
export declare function projectOBBOntoAxis(state: OBBState, index: number, axis: Vector2D): [number, number] | null;
/**
 * SAT (Separating Axis Theorem) collision test between two OBBs
 * Uses object pooling to minimize allocations in hot path.
 */
export declare function satCollisionTest(state: OBBState, indexA: number, indexB: number): CollisionResult;
/**
 * Check if two OBBs are potentially close enough to collide (broad phase)
 * Used as secondary filter after spatial hash for rotated boxes
 * Uses cached maxExtents to avoid sqrt calculations every frame
 */
export declare function isOBBNeighbor(state: OBBState, indexA: number, indexB: number): boolean;
/**
 * Calculate kinetic energy (linear + rotational) for a body
 */
export declare function getKineticEnergy(state: OBBState, index: number): number;
/**
 * Resolve OBB collision with energy conservation
 *
 * PERF NOTE: Creates multiple Vector2D arrays per collision resolution.
 * For high collision counts, consider mutating in-place or using object pooling.
 */
export declare function resolveOBBCollision(state: OBBState, indexA: number, indexB: number, contact: ContactPoint): void;
/**
 * Detect and resolve all OBB collisions
 * Uses spatial hash buckets for O(n×k) complexity instead of O(n²)
 * Dense buckets use sort-and-sweep for additional optimization
 */
export declare function detectAndResolveOBB(state: OBBState, elementCount: number, onCollision?: (indexA: number, indexB: number) => void): CollisionRecord[];
/**
 * Integrate angular motion (update angles from angular velocities)
 */
export declare function integrateAngularMotion(state: OBBState): void;
