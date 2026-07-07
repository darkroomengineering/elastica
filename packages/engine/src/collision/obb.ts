import { distanceSquared } from '../math'
import { axesPool, cornersPool } from '../pool'
import type { CollisionRecord, CollisionResult, ContactPoint, Vector2D } from '../types'
import { getNeighborCellIds, sweepBucket } from './aabb'
import { circleVsCircle, circleVsOBB } from './circle'
import { resolveContact } from './resolve'
import type { OBBState } from './types'

/**
 * Threshold for using sort-and-sweep in dense buckets
 */
const DENSE_BUCKET_THRESHOLD = 16

/**
 * Get the four corners of a rotated rectangle (OBB)
 * Returns corners in order: top-left, top-right, bottom-right, bottom-left
 *
 * @param corners - Optional pre-allocated corners array to fill (from pool)
 * @returns The corners array, or null if invalid state
 */
export function getOBBCorners(
  state: OBBState,
  index: number,
  corners?: [Vector2D, Vector2D, Vector2D, Vector2D]
): [Vector2D, Vector2D, Vector2D, Vector2D] | null {
  const position = state.positions[index]
  const dimension = state.dimensions[index]
  const angle = state.angles[index]

  if (!position || !dimension || angle === undefined) return null

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const hw = dimension[0]
  const hh = dimension[1]

  // Local corner offsets (unrotated): TL, TR, BR, BL
  const localX = [-hw, hw, hw, -hw]
  const localY = [-hh, -hh, hh, hh]

  // Use provided corners or allocate new ones
  const result = corners ?? cornersPool.acquire()

  // Rotate and translate to world coordinates (no .map() allocation)
  for (let i = 0; i < 4; i++) {
    const lx = localX[i]!
    const ly = localY[i]!
    result[i]![0] = position[0] + lx * cos - ly * sin
    result[i]![1] = position[1] + lx * sin + ly * cos
  }

  return result
}

/**
 * Get the two edge normals (axes) for SAT collision test
 */
export function getOBBAxes(
  state: OBBState,
  index: number
): [Vector2D, Vector2D] | null {
  const angle = state.angles[index]
  if (angle === undefined) return null

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  return [
    [cos, sin],
    [-sin, cos],
  ]
}

/**
 * Project an OBB onto an axis and return the min/max projection values
 */
export function projectOBBOntoAxis(
  state: OBBState,
  index: number,
  axis: Vector2D
): [number, number] | null {
  const corners = getOBBCorners(state, index)
  if (!corners) return null

  let min = Infinity
  let max = -Infinity

  for (const corner of corners) {
    const projection = corner[0] * axis[0] + corner[1] * axis[1]
    min = Math.min(min, projection)
    max = Math.max(max, projection)
  }

  return [min, max]
}

/**
 * SAT (Separating Axis Theorem) collision test between two OBBs
 * Uses object pooling to minimize allocations in hot path.
 */
export function satCollisionTest(
  state: OBBState,
  indexA: number,
  indexB: number
): CollisionResult {
  const axesA = getOBBAxes(state, indexA)
  const axesB = getOBBAxes(state, indexB)

  if (!axesA || !axesB) {
    return { collided: false }
  }

  // Use pooled axes array instead of spread allocation
  const axes = axesPool.acquire()
  axes[0]![0] = axesA[0][0]; axes[0]![1] = axesA[0][1]
  axes[1]![0] = axesA[1][0]; axes[1]![1] = axesA[1][1]
  axes[2]![0] = axesB[0][0]; axes[2]![1] = axesB[0][1]
  axes[3]![0] = axesB[1][0]; axes[3]![1] = axesB[1][1]

  let minOverlap = Infinity
  let minOverlapAxis: Vector2D | null = null

  for (const axis of axes) {
    const projA = projectOBBOntoAxis(state, indexA, axis)
    const projB = projectOBBOntoAxis(state, indexB, axis)

    if (!projA || !projB) {
      axesPool.release(axes)
      return { collided: false }
    }

    const overlap = Math.min(projA[1], projB[1]) - Math.max(projA[0], projB[0])

    if (overlap <= 0) {
      axesPool.release(axes)
      return { collided: false }
    }

    if (overlap < minOverlap) {
      minOverlap = overlap
      minOverlapAxis = axis
    }
  }

  // Release axes - we've extracted what we need (minOverlapAxis values)
  const savedAxisX = minOverlapAxis ? minOverlapAxis[0] : 0
  const savedAxisY = minOverlapAxis ? minOverlapAxis[1] : 0
  axesPool.release(axes)

  if (!minOverlapAxis) {
    return { collided: false }
  }

  const posA = state.positions[indexA]
  const posB = state.positions[indexB]

  if (!posA || !posB) {
    return { collided: false }
  }

  // Ensure normal points from A to B
  const centerDiffX = posB[0] - posA[0]
  const centerDiffY = posB[1] - posA[1]
  const dot = centerDiffX * savedAxisX + centerDiffY * savedAxisY

  const normal: Vector2D = dot < 0
    ? [-savedAxisX, -savedAxisY]
    : [savedAxisX, savedAxisY]

  // Contact point at midpoint between centers
  const contactPoint: Vector2D = [
    (posA[0] + posB[0]) / 2,
    (posA[1] + posB[1]) / 2,
  ]

  const contact: ContactPoint = {
    point: contactPoint,
    normal: normal,
    penetration: minOverlap,
  }

  return { collided: true, contact }
}

/**
 * Check if two OBBs are potentially close enough to collide (broad phase)
 * Used as secondary filter after spatial hash for rotated boxes
 * Uses cached maxExtents to avoid sqrt calculations every frame
 */
export function isOBBNeighbor(
  state: OBBState,
  indexA: number,
  indexB: number
): boolean {
  const posA = state.positions[indexA]
  const posB = state.positions[indexB]
  const maxExtentA = state.maxExtents[indexA]
  const maxExtentB = state.maxExtents[indexB]

  if (!posA || !posB || maxExtentA === undefined || maxExtentB === undefined) return false

  // Use cached diagonal extents instead of recalculating sqrt each frame
  const maxDist = maxExtentA + maxExtentB
  const maxDistSquared = maxDist * maxDist

  return distanceSquared(posA, posB) <= maxDistSquared
}

/**
 * Calculate kinetic energy (linear + rotational) for a body
 */
export function getKineticEnergy(state: OBBState, index: number): number {
  const velocity = state.velocities[index]
  const angularVelocity = state.angularVelocities[index]
  const mass = state.masses[index]
  const inertia = state.momentsOfInertia[index]

  if (!velocity || angularVelocity === undefined || mass === undefined || inertia === undefined) {
    return 0
  }

  const linearKE = 0.5 * mass * (velocity[0] * velocity[0] + velocity[1] * velocity[1])
  const rotationalKE = 0.5 * inertia * angularVelocity * angularVelocity

  return linearKE + rotationalKE
}

/**
 * Resolve an OBB collision.
 *
 * Thin wrapper over the shared contact resolver (see resolve.ts for the full
 * design rationale): mass-weighted impulse split, approach-velocity gate,
 * kick proportional to approach speed, KE ceiling, positional correction.
 */
export function resolveOBBCollision(
  state: OBBState,
  indexA: number,
  indexB: number,
  contact: ContactPoint
): boolean {
  return resolveContact(state, indexA, indexB, contact)
}

/**
 * Perform narrow-phase collision test based on shape types
 * Dispatches to appropriate collision function for each shape combination
 */
function shapeCollisionTest(
  state: OBBState,
  indexA: number,
  indexB: number
): CollisionResult {
  const shapeA = state.shapeTypes[indexA] ?? 'rectangle'
  const shapeB = state.shapeTypes[indexB] ?? 'rectangle'

  // Circle vs Circle
  if (shapeA === 'circle' && shapeB === 'circle') {
    return circleVsCircle(state, indexA, indexB)
  }

  // Circle vs Rectangle (OBB)
  // circleVsOBB returns normal pointing from rect toward circle
  // Here: A=circle, B=rect, so normal points B→A, need to flip to A→B
  if (shapeA === 'circle' && shapeB === 'rectangle') {
    const result = circleVsOBB(state, indexA, indexB)
    if (result.collided && result.contact) {
      result.contact.normal = [-result.contact.normal[0], -result.contact.normal[1]]
    }
    return result
  }

  // Rectangle vs Circle
  // Here: A=rect, B=circle, so circleVsOBB(B, A) gives normal from A→B, which is correct
  if (shapeA === 'rectangle' && shapeB === 'circle') {
    return circleVsOBB(state, indexB, indexA)
  }

  // Rectangle vs Rectangle - use SAT
  return satCollisionTest(state, indexA, indexB)
}

/**
 * Process an OBB collision pair - test, record, and resolve
 */
function processOBBCollisionPair(
  state: OBBState,
  indexA: number,
  indexB: number,
  checkedPairs: Set<number>,
  collisionsList: CollisionRecord[],
  onCollision?: (indexA: number, indexB: number) => void
): void {
  const velA = state.velocities[indexA]
  const velB = state.velocities[indexB]
  if (!velA || !velB) return

  // Zero-size bodies never collide
  if (!((state.maxExtents[indexA] ?? 0) > 0) || !((state.maxExtents[indexB] ?? 0) > 0)) return

  // Create pair key to avoid duplicate checks (bitwise encoding, no allocation)
  const pairKey = (indexA << 16) | indexB
  if (checkedPairs.has(pairKey)) return
  checkedPairs.add(pairKey)

  // Broad phase distance check (for rotated boxes that may span cells)
  if (!isOBBNeighbor(state, indexA, indexB)) return

  // Narrow phase collision test (dispatches based on shape types)
  const result = shapeCollisionTest(state, indexA, indexB)

  if (!result.collided || !result.contact) return

  // Resolve first: record + bounce callback only when a real impulse fired.
  // Overlap-only frames (already-separating or resting pairs, drained by
  // positional correction) are not bounces — recording them made touching
  // pairs increment the bounce counter every frame.
  if (!resolveOBBCollision(state, indexA, indexB, result.contact)) return

  collisionsList.push({ loop: indexA, inHash: indexB })
  onCollision?.(indexA, indexB)
}

/**
 * Detect and resolve all OBB collisions
 * Uses spatial hash buckets for O(n×k) complexity instead of O(n²)
 * Dense buckets use sort-and-sweep for additional optimization
 */
export function detectAndResolveOBB(
  state: OBBState,
  elementCount: number,
  onCollision?: (indexA: number, indexB: number) => void
): CollisionRecord[] {
  const collisionsList: CollisionRecord[] = []
  // Track checked pairs to avoid duplicate checks
  // Uses bitwise encoding: (indexA << 16) | indexB for zero-allocation pair keys
  const checkedPairs = new Set<number>()

  // Track which buckets we've already processed with sweep
  const sweptBuckets = new Set<number>()

  for (let indexA = 0; indexA < elementCount; indexA++) {
    const velA = state.velocities[indexA]
    if (!velA) continue

    const cellIdA = state.hash[indexA]
    if (cellIdA === undefined) continue

    // Get all neighbor cell IDs
    const neighborCells = getNeighborCellIds(cellIdA, state.gridSize)

    // Check elements in neighboring cells only
    for (const neighborCellId of neighborCells) {
      const bucket = state.buckets.get(neighborCellId)
      if (!bucket) continue

      // Dense bucket: use sort-and-sweep algorithm
      if (bucket.length > DENSE_BUCKET_THRESHOLD) {
        // Interior sweep: process all within-bucket pairs exactly once per frame.
        // Passes maxExtents so the X-axis overlap check is rotation-safe (C38):
        // for rotated OBBs, dimensions[0] is the unrotated half-width which
        // under-estimates the true swept extent, causing valid pairs to be pruned.
        if (!sweptBuckets.has(neighborCellId)) {
          sweptBuckets.add(neighborCellId)
          const sweepPairs = sweepBucket(bucket, state.positions, state.dimensions, state.maxExtents)
          for (const [idxA, idxB] of sweepPairs) {
            processOBBCollisionPair(state, idxA, idxB, checkedPairs, collisionsList, onCollision)
          }
        }
        // Cross-cell pass: test indexA against members of this neighboring dense bucket.
        // Skipped when neighborCellId is indexA's own cell because sweepBucket already
        // covered all pairs among co-members. The checkedPairs guard in
        // processOBBCollisionPair deduplicates any pair that appears in multiple neighbors.
        if (neighborCellId !== cellIdA) {
          for (const indexB of bucket) {
            if (indexA >= indexB) continue
            processOBBCollisionPair(state, indexA, indexB, checkedPairs, collisionsList, onCollision)
          }
        }
        continue
      }

      // Sparse bucket: simple iteration
      for (const indexB of bucket) {
        // Skip self and ensure we only check each pair once (lower index first)
        if (indexA >= indexB) continue

        processOBBCollisionPair(state, indexA, indexB, checkedPairs, collisionsList, onCollision)
      }
    }
  }

  return collisionsList
}

/**
 * Integrate angular motion (update angles from angular velocities)
 */
export function integrateAngularMotion(state: OBBState): void {
  const dt = state.deltaTime
  for (let i = 0; i < state.angles.length; i++) {
    const angle = state.angles[i]
    const angularVelocity = state.angularVelocities[i]

    if (angle !== undefined && angularVelocity !== undefined) {
      state.angles[i] = angle + angularVelocity * dt
    }
  }
}
