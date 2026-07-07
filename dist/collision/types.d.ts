import type { ShapeType, Vector2D } from '../types';
/**
 * Base state required for collision detection with spatial hashing
 */
export type CollisionState = {
    positions: Vector2D[];
    velocities: Vector2D[];
    dimensions: Vector2D[];
    isStatic: boolean[];
    hash: number[];
    gridSize: number;
    buckets: Map<number, number[]>;
};
/**
 * State required by the shared contact resolver (see resolve.ts).
 * The angular fields are optional: AABB mode resolves without rotation.
 */
export type ResolutionState = CollisionState & {
    masses: number[];
    restitutions: number[];
    slop: number;
    percent: number;
    angularVelocities?: number[];
    momentsOfInertia?: number[];
    deltaTime?: number;
};
/**
 * State required for AABB collision detection.
 * AABB mode shares the contact resolver, minus the angular fields.
 */
export type AABBState = ResolutionState;
/**
 * State required for OBB collision detection
 * Extends CollisionState with rotation and physics properties
 */
export type OBBState = CollisionState & {
    angles: number[];
    angularVelocities: number[];
    masses: number[];
    momentsOfInertia: number[];
    restitutions: number[];
    maxExtents: number[];
    shapeTypes: ShapeType[];
    slop: number;
    percent: number;
    deltaTime: number;
};
