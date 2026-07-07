import type { CollisionRecord, Vector2D } from '../types';
import type { AABBState } from './types';
/**
 * Sort-and-sweep algorithm for dense buckets
 * Sorts bodies by X-axis and uses early-exit to reduce pair checks
 * Returns pairs that potentially overlap on the X-axis
 */
export declare function sweepBucket(bucket: number[], positions: Vector2D[], dimensions: Vector2D[], extents?: number[]): Array<[number, number]>;
/**
 * Get neighbor cell IDs for a given cell (3x3 grid)
 * Returns array of valid cell IDs including the cell itself
 */
export declare function getNeighborCellIds(cellId: number, gridSize: number): number[];
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
 * Resolve an AABB collision through the shared contact resolver.
 *
 * Builds a minimum-translation-vector contact (axis of least overlap, normal
 * pointing from A toward B) and delegates to resolveContact — see resolve.ts
 * for the full design rationale. AABB mode resolves without rotation.
 */
export declare function resolveAABBCollision(state: AABBState, indexA: number, indexB: number): boolean;
/**
 * Detect and resolve all AABB collisions
 * Uses spatial hash buckets for O(n×k) complexity instead of O(n²)
 * Dense buckets use sort-and-sweep for additional optimization
 */
export declare function detectAndResolveAABB(state: AABBState, elementCount: number, onCollision?: (indexA: number, indexB: number) => void): CollisionRecord[];
