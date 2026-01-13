import type { CollisionRecord, Vector2D } from '../types'

/**
 * State required for AABB collision detection
 */
export type AABBState = {
  positions: Vector2D[]
  velocities: Vector2D[]
  dimensions: Vector2D[]
  hash: number[]
  gridSize: number
}

/**
 * Check if two bodies are in neighboring hash cells
 */
export function isNeighbor(
  state: AABBState,
  indexA: number,
  indexB: number
): boolean {
  const hashA = state.hash[indexA]
  const hashB = state.hash[indexB]

  if (hashA === undefined || hashB === undefined) return false

  for (let i = -1; i < 2; i++) {
    for (let j = -1; j < 2; j++) {
      const box = hashA + state.gridSize * i + j

      if (box < 0 || box > state.gridSize * state.gridSize) {
        continue
      }

      if (box === hashB) {
        return true
      }
    }
  }

  return false
}

/**
 * Check if two AABBs are overlapping
 */
export function testAABB(
  state: AABBState,
  indexA: number,
  indexB: number
): boolean {
  const dimA = state.dimensions[indexA]
  const posA = state.positions[indexA]
  const dimB = state.dimensions[indexB]
  const posB = state.positions[indexB]

  if (!dimA || !posA || !dimB || !posB) {
    return false
  }

  const overlapX = Math.abs(posA[0] - posB[0]) < dimA[0] + dimB[0]
  const overlapY = Math.abs(posA[1] - posB[1]) < dimA[1] + dimB[1]

  return overlapX && overlapY
}

/**
 * Calculate the superposition/exclusion force between two overlapping AABBs
 * Returns a force vector to push bodies apart
 */
export function calculateSuperposition(
  state: AABBState,
  indexA: number,
  indexB: number
): Vector2D {
  const posA = state.positions[indexA]
  const dimA = state.dimensions[indexA]
  const posB = state.positions[indexB]
  const dimB = state.dimensions[indexB]

  if (!posA || !dimA || !posB || !dimB) {
    return [0, 0]
  }

  const overlapX = dimA[0] + dimB[0] - Math.abs(posA[0] - posB[0])
  const overlapY = dimA[1] + dimB[1] - Math.abs(posA[1] - posB[1])

  const dirX = -Math.sign(posA[0] - posB[0])
  const dirY = -Math.sign(posA[1] - posB[1])

  return [
    dirX * Math.max(1 / overlapX, 0.5),
    dirY * Math.max(1 / overlapY, 0.5),
  ]
}

/**
 * Resolve AABB collision with energy conservation
 * Swaps velocities and scales to conserve kinetic energy
 */
export function resolveAABBCollision(
  state: AABBState,
  indexA: number,
  indexB: number
): void {
  const velA = state.velocities[indexA]
  const velB = state.velocities[indexB]

  if (!velA || !velB) return

  // Calculate initial kinetic energy (assuming equal masses)
  const initialKE =
    0.5 * (velA[0] * velA[0] + velA[1] * velA[1] + velB[0] * velB[0] + velB[1] * velB[1])

  // Calculate exclusion force
  const exclusionForce = calculateSuperposition(state, indexA, indexB)

  // Apply exclusion force to velocities
  let newVelA: Vector2D = [
    velA[0] + exclusionForce[0],
    velA[1] + exclusionForce[1],
  ]
  let newVelB: Vector2D = [
    velB[0] - exclusionForce[0],
    velB[1] - exclusionForce[1],
  ]

  // Calculate final kinetic energy
  const finalKE =
    0.5 * (newVelA[0] * newVelA[0] + newVelA[1] * newVelA[1] +
           newVelB[0] * newVelB[0] + newVelB[1] * newVelB[1])

  // Scale to conserve energy
  if (finalKE !== 0) {
    const scale = Math.sqrt(initialKE / finalKE)
    newVelA = [newVelA[0] * scale, newVelA[1] * scale]
    newVelB = [newVelB[0] * scale, newVelB[1] * scale]
  }

  // Swap velocities (this creates the "bouncing" effect)
  state.velocities[indexA] = newVelB
  state.velocities[indexB] = newVelA
}

/**
 * Detect and resolve all AABB collisions
 */
export function detectAndResolveAABB(
  state: AABBState,
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

      // Skip if not in neighboring cells
      if (!isNeighbor(state, indexA, indexB)) continue

      // Test for collision
      if (!testAABB(state, indexA, indexB)) continue

      // Record collision
      collisionsList.push({ loop: indexA, inHash: indexB })

      // Callback for bounce tracking
      onCollision?.(indexA, indexB)

      // Resolve collision
      resolveAABBCollision(state, indexA, indexB)
    }
  }

  return collisionsList
}
