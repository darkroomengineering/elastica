import { distanceSquared } from '../math'
import { axesPool, cornersPool, vectorPool } from '../pool'
import type { CollisionRecord, CollisionResult, ContactPoint, Vector2D } from '../types'
import { getNeighborCellIds, sweepBucket } from './aabb'

/**
 * Threshold for using sort-and-sweep in dense buckets
 */
const DENSE_BUCKET_THRESHOLD = 16

/**
 * State required for OBB collision detection
 */
export type OBBState = {
  positions: Vector2D[]
  velocities: Vector2D[]
  dimensions: Vector2D[]
  angles: number[]
  angularVelocities: number[]
  masses: number[]
  momentsOfInertia: number[]
  restitutions: number[]
  maxExtents: number[] // Cached diagonal extent for broad-phase checks
  isStatic: boolean[]
  // Spatial hash for broad phase
  hash: number[]
  gridSize: number
  buckets: Map<number, number[]>
}

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
 * Resolve OBB collision with energy conservation
 *
 * PERF NOTE: Creates multiple Vector2D arrays per collision resolution.
 * For high collision counts, consider mutating in-place or using object pooling.
 */
export function resolveOBBCollision(
  state: OBBState,
  indexA: number,
  indexB: number,
  contact: ContactPoint
): void {
  const posA = state.positions[indexA]
  const posB = state.positions[indexB]
  const velA = state.velocities[indexA]
  const velB = state.velocities[indexB]
  const massA = state.masses[indexA]
  const massB = state.masses[indexB]
  const inertiaA = state.momentsOfInertia[indexA]
  const inertiaB = state.momentsOfInertia[indexB]
  const angVelA = state.angularVelocities[indexA]
  const angVelB = state.angularVelocities[indexB]
  const restA = state.restitutions[indexA]
  const restB = state.restitutions[indexB]

  if (
    !posA || !posB || !velA || !velB ||
    massA === undefined || massB === undefined ||
    inertiaA === undefined || inertiaB === undefined ||
    angVelA === undefined || angVelB === undefined ||
    restA === undefined || restB === undefined
  ) {
    return
  }

  const isStaticA = state.isStatic[indexA] ?? false
  const isStaticB = state.isStatic[indexB] ?? false

  // Skip if both are static
  if (isStaticA && isStaticB) return

  const { normal, penetration } = contact
  const restitution = Math.min(restA, restB)

  // Step 2: Calculate repulsion strength based on overlap
  const overlapForce = Math.max(penetration, 1)
  const repulsionStrength = 1 / overlapForce

  // Handle static-dynamic collision
  if (isStaticA || isStaticB) {
    if (isStaticA) {
      // A is static, B is dynamic - treat A as having infinite mass
      const initialKE = getKineticEnergy(state, indexB)

      // Apply double repulsion force to dynamic object
      const newVelB: Vector2D = [
        velB[0] + normal[0] * repulsionStrength * 2,
        velB[1] + normal[1] * repulsionStrength * 2,
      ]

      // Calculate torque on dynamic object
      const contactPoint: Vector2D = [(posA[0] + posB[0]) / 2, (posA[1] + posB[1]) / 2]
      const rBx = contactPoint[0] - posB[0]
      const rBy = contactPoint[1] - posB[1]
      const torqueB = rBx * (normal[1] * repulsionStrength * 2) - rBy * (normal[0] * repulsionStrength * 2)
      const newAngVelB = angVelB + torqueB / inertiaB

      // Apply new velocities temporarily
      state.velocities[indexB] = newVelB
      state.angularVelocities[indexB] = newAngVelB

      // Scale to conserve energy with restitution
      const finalKE = getKineticEnergy(state, indexB)
      if (finalKE > 0) {
        const targetKE = initialKE * restitution
        const scale = Math.sqrt(targetKE / finalKE)
        state.velocities[indexB] = [newVelB[0] * scale, newVelB[1] * scale]
        state.angularVelocities[indexB] = newAngVelB * scale
      }

      // Position correction - only move dynamic object
      const slop = 0.5
      const percent = 0.96
      if (penetration > slop) {
        const correction = (penetration - slop) * percent
        state.positions[indexB] = [
          posB[0] + normal[0] * correction,
          posB[1] + normal[1] * correction,
        ]
      }
    } else {
      // B is static, A is dynamic - treat B as having infinite mass
      const initialKE = getKineticEnergy(state, indexA)

      // Apply double repulsion force to dynamic object
      const newVelA: Vector2D = [
        velA[0] - normal[0] * repulsionStrength * 2,
        velA[1] - normal[1] * repulsionStrength * 2,
      ]

      // Calculate torque on dynamic object
      const contactPoint: Vector2D = [(posA[0] + posB[0]) / 2, (posA[1] + posB[1]) / 2]
      const rAx = contactPoint[0] - posA[0]
      const rAy = contactPoint[1] - posA[1]
      const torqueA = rAx * (-normal[1] * repulsionStrength * 2) - rAy * (-normal[0] * repulsionStrength * 2)
      const newAngVelA = angVelA + torqueA / inertiaA

      // Apply new velocities temporarily
      state.velocities[indexA] = newVelA
      state.angularVelocities[indexA] = newAngVelA

      // Scale to conserve energy with restitution
      const finalKE = getKineticEnergy(state, indexA)
      if (finalKE > 0) {
        const targetKE = initialKE * restitution
        const scale = Math.sqrt(targetKE / finalKE)
        state.velocities[indexA] = [newVelA[0] * scale, newVelA[1] * scale]
        state.angularVelocities[indexA] = newAngVelA * scale
      }

      // Position correction - only move dynamic object
      const slop = 0.5
      const percent = 0.96
      if (penetration > slop) {
        const correction = (penetration - slop) * percent
        state.positions[indexA] = [
          posA[0] - normal[0] * correction,
          posA[1] - normal[1] * correction,
        ]
      }
    }
    return
  }

  // Both are dynamic - original behavior
  // Step 1: Calculate initial total kinetic energy
  const initialKE = getKineticEnergy(state, indexA) + getKineticEnergy(state, indexB)

  // Step 3: Apply velocity changes along collision normal
  const newVelA: Vector2D = [
    velA[0] - normal[0] * repulsionStrength,
    velA[1] - normal[1] * repulsionStrength,
  ]
  const newVelB: Vector2D = [
    velB[0] + normal[0] * repulsionStrength,
    velB[1] + normal[1] * repulsionStrength,
  ]

  // Step 4: Apply angular velocity changes from torque
  const contactPoint: Vector2D = [(posA[0] + posB[0]) / 2, (posA[1] + posB[1]) / 2]

  const rAx = contactPoint[0] - posA[0]
  const rAy = contactPoint[1] - posA[1]
  const rBx = contactPoint[0] - posB[0]
  const rBy = contactPoint[1] - posB[1]

  const torqueA = rAx * (-normal[1] * repulsionStrength) - rAy * (-normal[0] * repulsionStrength)
  const torqueB = rBx * (normal[1] * repulsionStrength) - rBy * (normal[0] * repulsionStrength)

  const newAngVelA = angVelA + torqueA / inertiaA
  const newAngVelB = angVelB + torqueB / inertiaB

  // Step 5: Apply new velocities temporarily
  state.velocities[indexA] = newVelA
  state.velocities[indexB] = newVelB
  state.angularVelocities[indexA] = newAngVelA
  state.angularVelocities[indexB] = newAngVelB

  // Step 6: Calculate final kinetic energy and scale to conserve
  const finalKE = getKineticEnergy(state, indexA) + getKineticEnergy(state, indexB)

  if (finalKE > 0) {
    const targetKE = initialKE * restitution
    const scale = Math.sqrt(targetKE / finalKE)

    state.velocities[indexA] = [newVelA[0] * scale, newVelA[1] * scale]
    state.velocities[indexB] = [newVelB[0] * scale, newVelB[1] * scale]
    state.angularVelocities[indexA] = newAngVelA * scale
    state.angularVelocities[indexB] = newAngVelB * scale
  }

  // Step 7: Position correction
  const slop = 0.5
  const percent = 0.96

  if (penetration > slop) {
    const correction = (penetration - slop) * percent
    const totalMass = massA + massB

    state.positions[indexA] = [
      posA[0] - normal[0] * correction * (massB / totalMass),
      posA[1] - normal[1] * correction * (massB / totalMass),
    ]
    state.positions[indexB] = [
      posB[0] + normal[0] * correction * (massA / totalMass),
      posB[1] + normal[1] * correction * (massA / totalMass),
    ]
  }
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

  // Create pair key to avoid duplicate checks (bitwise encoding, no allocation)
  const pairKey = (indexA << 16) | indexB
  if (checkedPairs.has(pairKey)) return
  checkedPairs.add(pairKey)

  // Broad phase distance check (for rotated boxes that may span cells)
  if (!isOBBNeighbor(state, indexA, indexB)) return

  // Narrow phase SAT test
  const result = satCollisionTest(state, indexA, indexB)

  if (!result.collided || !result.contact) return

  collisionsList.push({ loop: indexA, inHash: indexB })
  onCollision?.(indexA, indexB)

  // Resolve collision
  resolveOBBCollision(state, indexA, indexB, result.contact)
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
        // Only sweep each dense bucket once
        if (sweptBuckets.has(neighborCellId)) continue
        sweptBuckets.add(neighborCellId)

        const sweepPairs = sweepBucket(bucket, state.positions, state.dimensions)
        for (const [idxA, idxB] of sweepPairs) {
          processOBBCollisionPair(state, idxA, idxB, checkedPairs, collisionsList, onCollision)
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
  for (let i = 0; i < state.angles.length; i++) {
    const angle = state.angles[i]
    const angularVelocity = state.angularVelocities[i]

    if (angle !== undefined && angularVelocity !== undefined) {
      state.angles[i] = angle + angularVelocity
    }
  }
}
