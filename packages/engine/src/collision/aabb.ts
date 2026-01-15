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
  isStatic: boolean[]
  buckets: Map<number, number[]>
}

/**
 * Get neighbor cell IDs for a given cell (3x3 grid)
 * Returns array of valid cell IDs including the cell itself
 */
export function getNeighborCellIds(
  cellId: number,
  gridSize: number
): number[] {
  const cellX = cellId % gridSize
  const cellY = Math.floor(cellId / gridSize)
  const neighbors: number[] = []

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = cellX + dx
      const ny = cellY + dy

      // Skip out-of-bounds cells
      if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) {
        continue
      }

      neighbors.push(nx + ny * gridSize)
    }
  }

  return neighbors
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

  const isStaticA = state.isStatic[indexA] ?? false
  const isStaticB = state.isStatic[indexB] ?? false

  // Skip if both are static
  if (isStaticA && isStaticB) return

  // Calculate exclusion force
  const exclusionForce = calculateSuperposition(state, indexA, indexB)

  // Handle static-dynamic collision
  if (isStaticA || isStaticB) {
    if (isStaticA) {
      // A is static, B is dynamic - apply double force to B and reverse it
      const newVelB: Vector2D = [
        velB[0] - exclusionForce[0] * 2,
        velB[1] - exclusionForce[1] * 2,
      ]
      state.velocities[indexB] = newVelB
      // Keep A's velocity unchanged (it's static)
    } else {
      // B is static, A is dynamic - apply double force to A
      const newVelA: Vector2D = [
        velA[0] + exclusionForce[0] * 2,
        velA[1] + exclusionForce[1] * 2,
      ]
      state.velocities[indexA] = newVelA
      // Keep B's velocity unchanged (it's static)
    }
    return
  }

  // Both are dynamic - original behavior
  // Calculate initial kinetic energy (assuming equal masses)
  const initialKE =
    0.5 * (velA[0] * velA[0] + velA[1] * velA[1] + velB[0] * velB[0] + velB[1] * velB[1])

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
 * Uses spatial hash buckets for O(n×k) complexity instead of O(n²)
 */
export function detectAndResolveAABB(
  state: AABBState,
  elementCount: number,
  onCollision?: (indexA: number, indexB: number) => void
): CollisionRecord[] {
  const collisionsList: CollisionRecord[] = []
  // Track checked pairs to avoid duplicate checks
  const checkedPairs = new Set<string>()

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

      for (const indexB of bucket) {
        // Skip self and ensure we only check each pair once (lower index first)
        if (indexA >= indexB) continue

        const velB = state.velocities[indexB]
        if (!velB) continue

        // Create pair key to avoid duplicate checks
        const pairKey = `${indexA}:${indexB}`
        if (checkedPairs.has(pairKey)) continue
        checkedPairs.add(pairKey)

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
  }

  return collisionsList
}
