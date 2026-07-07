import type { ShapeType, Vector2D } from '../types'

/**
 * Base state required for collision detection with spatial hashing
 */
export type CollisionState = {
  positions: Vector2D[]
  velocities: Vector2D[]
  dimensions: Vector2D[]
  isStatic: boolean[]
  hash: number[]
  gridSize: number
  buckets: Map<number, number[]>
}

/**
 * State required by the shared contact resolver (see resolve.ts).
 * The angular fields are optional: AABB mode resolves without rotation.
 */
export type ResolutionState = CollisionState & {
  masses: number[]
  restitutions: number[]
  // Solver parameters (positional correction)
  slop: number
  percent: number
  // Angular state (OBB mode only)
  angularVelocities?: number[]
  momentsOfInertia?: number[]
  deltaTime?: number
}

/**
 * State required for AABB collision detection.
 * AABB mode shares the contact resolver, minus the angular fields.
 */
export type AABBState = ResolutionState

/**
 * State required for OBB collision detection
 * Extends CollisionState with rotation and physics properties
 */
export type OBBState = CollisionState & {
  angles: number[]
  angularVelocities: number[]
  masses: number[]
  momentsOfInertia: number[]
  restitutions: number[]
  maxExtents: number[] // Cached diagonal extent for broad-phase checks
  shapeTypes: ShapeType[] // Shape type for each element ('rectangle' or 'circle')
  // Solver parameters
  slop: number
  percent: number
  deltaTime: number
}
