import type { CollisionRecord, Vector2D } from '../types';
/**
 * State required for AABB collision detection
 */
export type AABBState = {
    positions: Vector2D[];
    velocities: Vector2D[];
    dimensions: Vector2D[];
    hash: number[];
    gridSize: number;
    isStatic: boolean[];
};
/**
 * Check if two bodies are in neighboring hash cells
 */
export declare function isNeighbor(state: AABBState, indexA: number, indexB: number): boolean;
/**
 * Check if two AABBs are overlapping
 */
export declare function testAABB(state: AABBState, indexA: number, indexB: number): boolean;
/**
 * Calculate the superposition/exclusion force between two overlapping AABBs
 * Returns a force vector to push bodies apart
 */
export declare function calculateSuperposition(state: AABBState, indexA: number, indexB: number): Vector2D;
/**
 * Resolve AABB collision with energy conservation
 * Swaps velocities and scales to conserve kinetic energy
 */
export declare function resolveAABBCollision(state: AABBState, indexA: number, indexB: number): void;
/**
 * Detect and resolve all AABB collisions
 */
export declare function detectAndResolveAABB(state: AABBState, elementCount: number, onCollision?: (indexA: number, indexB: number) => void): CollisionRecord[];
