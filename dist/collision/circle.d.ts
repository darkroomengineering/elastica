import type { CollisionResult } from '../types';
import type { OBBState } from './types';
/**
 * Circle vs Circle collision detection
 * Uses squared distance comparison to avoid sqrt in the common (non-colliding) case
 *
 * @returns CollisionResult with contact point on circle A's surface toward B
 */
export declare function circleVsCircle(state: OBBState, indexA: number, indexB: number): CollisionResult;
/**
 * Circle vs AABB (Axis-Aligned Bounding Box) collision detection
 * Used when the rectangle has no rotation (angle === 0)
 *
 * Algorithm:
 * 1. Find closest point on AABB to circle center
 * 2. Check if distance from closest point to center is less than radius
 *
 * @returns CollisionResult with contact point and normal
 */
export declare function circleVsAABB(state: OBBState, circleIndex: number, rectIndex: number): CollisionResult;
/**
 * Circle vs OBB (Oriented Bounding Box) collision detection
 * Handles rotated rectangles by transforming to local space
 *
 * Algorithm:
 * 1. Transform circle center to OBB's local coordinate space (rotate by -angle)
 * 2. Perform AABB check in local space
 * 3. Transform contact normal back to world space
 *
 * @returns CollisionResult with contact point and normal in world space
 */
export declare function circleVsOBB(state: OBBState, circleIndex: number, rectIndex: number): CollisionResult;
