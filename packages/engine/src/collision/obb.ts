import { distanceSquared } from '../math'
import type { CollisionRecord, CollisionResult, ContactPoint, Vector2D } from '../types'

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
}

/**
 * Get the four corners of a rotated rectangle (OBB)
 * Returns corners in order: top-left, top-right, bottom-right, bottom-left
 */
export function getOBBCorners(
  state: OBBState,
  index: number
): [Vector2D, Vector2D, Vector2D, Vector2D] | null {
  const position = state.positions[index]
  const dimension = state.dimensions[index]
  const angle = state.angles[index]

  if (!position || !dimension || angle === undefined) return null

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const hw = dimension[0]
  const hh = dimension[1]

  // Local corner offsets (unrotated)
  const localCorners: [Vector2D, Vector2D, Vector2D, Vector2D] = [
    [-hw, -hh],
    [hw, -hh],
    [hw, hh],
    [-hw, hh],
  ]

  // Rotate and translate to world coordinates
  return localCorners.map(([lx, ly]) => [
    position[0] + lx * cos - ly * sin,
    position[1] + lx * sin + ly * cos,
  ]) as [Vector2D, Vector2D, Vector2D, Vector2D]
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

  const axes = [...axesA, ...axesB]

  let minOverlap = Infinity
  let minOverlapAxis: Vector2D | null = null

  for (const axis of axes) {
    const projA = projectOBBOntoAxis(state, indexA, axis)
    const projB = projectOBBOntoAxis(state, indexB, axis)

    if (!projA || !projB) {
      return { collided: false }
    }

    const overlap = Math.min(projA[1], projB[1]) - Math.max(projA[0], projB[0])

    if (overlap <= 0) {
      return { collided: false }
    }

    if (overlap < minOverlap) {
      minOverlap = overlap
      minOverlapAxis = axis
    }
  }

  if (!minOverlapAxis) {
    return { collided: false }
  }

  const posA = state.positions[indexA]
  const posB = state.positions[indexB]

  if (!posA || !posB) {
    return { collided: false }
  }

  // Ensure normal points from A to B
  const centerDiff: Vector2D = [posB[0] - posA[0], posB[1] - posA[1]]
  const dot = centerDiff[0] * minOverlapAxis[0] + centerDiff[1] * minOverlapAxis[1]

  const normal: Vector2D = dot < 0
    ? [-minOverlapAxis[0], -minOverlapAxis[1]]
    : [minOverlapAxis[0], minOverlapAxis[1]]

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
 */
export function isOBBNeighbor(
  state: OBBState,
  indexA: number,
  indexB: number
): boolean {
  const posA = state.positions[indexA]
  const posB = state.positions[indexB]
  const dimA = state.dimensions[indexA]
  const dimB = state.dimensions[indexB]

  if (!posA || !posB || !dimA || !dimB) return false

  // Maximum extent is the diagonal
  const maxExtentA = Math.sqrt(dimA[0] * dimA[0] + dimA[1] * dimA[1])
  const maxExtentB = Math.sqrt(dimB[0] * dimB[0] + dimB[1] * dimB[1])

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

  const { normal, penetration } = contact
  const restitution = Math.min(restA, restB)

  // Step 1: Calculate initial total kinetic energy
  const initialKE = getKineticEnergy(state, indexA) + getKineticEnergy(state, indexB)

  // Step 2: Calculate repulsion strength based on overlap
  const overlapForce = Math.max(penetration, 1)
  const repulsionStrength = 1 / overlapForce

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
 * Detect and resolve all OBB collisions
 */
export function detectAndResolveOBB(
  state: OBBState,
  elementCount: number,
  onCollision?: (indexA: number, indexB: number) => void
): CollisionRecord[] {
  const collisionsList: CollisionRecord[] = []

  for (let indexA = 0; indexA < elementCount; indexA++) {
    const velA = state.velocities[indexA]
    if (!velA) continue

    for (let indexB = indexA + 1; indexB < elementCount; indexB++) {
      const velB = state.velocities[indexB]
      if (!velB) continue

      // Broad phase check
      if (!isOBBNeighbor(state, indexA, indexB)) continue

      // Narrow phase SAT test
      const result = satCollisionTest(state, indexA, indexB)

      if (!result.collided || !result.contact) continue

      collisionsList.push({ loop: indexA, inHash: indexB })
      onCollision?.(indexA, indexB)

      // Resolve collision
      resolveOBBCollision(state, indexA, indexB, result.contact)
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
