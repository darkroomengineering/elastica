import type { CollisionRecord, Vector2D } from '../types'
import { resolveContact } from './resolve'
import type { AABBState } from './types'

/**
 * Threshold for using sort-and-sweep in dense buckets
 * Buckets with more elements than this will use sweep algorithm
 */
const DENSE_BUCKET_THRESHOLD = 16

/**
 * Sort-and-sweep algorithm for dense buckets
 * Sorts bodies by X-axis and uses early-exit to reduce pair checks
 * Returns pairs that potentially overlap on the X-axis
 */
export function sweepBucket(
  bucket: number[],
  positions: Vector2D[],
  dimensions: Vector2D[],
  extents?: number[]
): Array<[number, number]> {
  if (bucket.length < 2) return []

  // Build sortable entries with left edge position.
  // When extents is provided (e.g. rotation-invariant maxExtents for OBBs),
  // use it instead of dimensions[0] so rotated bodies are not pruned incorrectly.
  const entries: Array<{ idx: number; left: number; right: number }> = []
  for (const idx of bucket) {
    const pos = positions[idx]
    const dim = dimensions[idx]
    if (pos && dim) {
      const halfExtent = extents !== undefined ? (extents[idx] ?? dim[0]) : dim[0]
      entries.push({
        idx,
        left: pos[0] - halfExtent,
        right: pos[0] + halfExtent,
      })
    }
  }

  // Sort by left edge
  entries.sort((a, b) => a.left - b.left)

  const pairs: Array<[number, number]> = []

  for (let i = 0; i < entries.length; i++) {
    const a = entries[i]!
    const rightA = a.right

    // Only check subsequent bodies until their left edge is past our right edge
    for (let j = i + 1; j < entries.length; j++) {
      const b = entries[j]!

      // Early exit: if b's left edge is past a's right edge, no more overlaps possible
      if (b.left > rightA) break

      // Ensure consistent pair ordering (lower index first)
      if (a.idx < b.idx) {
        pairs.push([a.idx, b.idx])
      } else {
        pairs.push([b.idx, a.idx])
      }
    }
  }

  return pairs
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

  // Zero-size bodies never collide (consistent with OBB zero-size guard)
  if (dimA[0] <= 0 || dimA[1] <= 0 || dimB[0] <= 0 || dimB[1] <= 0) {
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
 * Resolve an AABB collision through the shared contact resolver.
 *
 * Builds a minimum-translation-vector contact (axis of least overlap, normal
 * pointing from A toward B) and delegates to resolveContact — see resolve.ts
 * for the full design rationale. AABB mode resolves without rotation.
 */
export function resolveAABBCollision(
  state: AABBState,
  indexA: number,
  indexB: number
): boolean {
  const posA = state.positions[indexA]
  const dimA = state.dimensions[indexA]
  const posB = state.positions[indexB]
  const dimB = state.dimensions[indexB]

  if (!posA || !dimA || !posB || !dimB) return false

  const overlapX = dimA[0] + dimB[0] - Math.abs(posA[0] - posB[0])
  const overlapY = dimA[1] + dimB[1] - Math.abs(posA[1] - posB[1])
  if (overlapX <= 0 || overlapY <= 0) return false

  let normal: Vector2D
  let penetration: number

  if (overlapX < overlapY) {
    normal = [posB[0] >= posA[0] ? 1 : -1, 0]
    penetration = overlapX
  } else {
    normal = [0, posB[1] >= posA[1] ? 1 : -1]
    penetration = overlapY
  }

  return resolveContact(state, indexA, indexB, {
    point: [(posA[0] + posB[0]) / 2, (posA[1] + posB[1]) / 2],
    normal,
    penetration,
  })
}

/**
 * Process a collision pair - test, record, and resolve
 */
function processCollisionPair(
  state: AABBState,
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

  // Test for collision
  if (!testAABB(state, indexA, indexB)) return

  // Resolve first: record + bounce callback only when a real impulse fired.
  // Overlap-only frames (already-separating or resting pairs, drained by
  // positional correction) are not bounces — recording them made touching
  // pairs increment the bounce counter every frame.
  if (!resolveAABBCollision(state, indexA, indexB)) return

  collisionsList.push({ loop: indexA, inHash: indexB })
  onCollision?.(indexA, indexB)
}

/**
 * Detect and resolve all AABB collisions
 * Uses spatial hash buckets for O(n×k) complexity instead of O(n²)
 * Dense buckets use sort-and-sweep for additional optimization
 */
export function detectAndResolveAABB(
  state: AABBState,
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
        if (!sweptBuckets.has(neighborCellId)) {
          sweptBuckets.add(neighborCellId)
          const sweepPairs = sweepBucket(bucket, state.positions, state.dimensions)
          for (const [idxA, idxB] of sweepPairs) {
            processCollisionPair(state, idxA, idxB, checkedPairs, collisionsList, onCollision)
          }
        }
        // Cross-cell pass: test indexA against members of this neighboring dense bucket.
        // Skipped when neighborCellId is indexA's own cell because sweepBucket already
        // covered all pairs among co-members. The checkedPairs guard in
        // processCollisionPair deduplicates any pair that appears in multiple neighbors.
        if (neighborCellId !== cellIdA) {
          for (const indexB of bucket) {
            if (indexA >= indexB) continue
            processCollisionPair(state, indexA, indexB, checkedPairs, collisionsList, onCollision)
          }
        }
        continue
      }

      // Sparse bucket: simple iteration
      for (const indexB of bucket) {
        // Skip self and ensure we only check each pair once (lower index first)
        if (indexA >= indexB) continue

        processCollisionPair(state, indexA, indexB, checkedPairs, collisionsList, onCollision)
      }
    }
  }

  return collisionsList
}
