/**
 * Regression test for issue #6 (C3 / C38):
 * Body pairs that straddle the boundary between two DENSE buckets
 * (buckets with > DENSE_BUCKET_THRESHOLD = 16 bodies) must still collide.
 *
 * Pre-fix bug: detectAndResolveOBB switches to the sort-and-sweep path for
 * dense buckets but only sweeps INTRA-bucket pairs. Cross-bucket pairs where
 * both buckets are dense are silently dropped, so bodies in adjacent dense
 * cells pass through each other.
 *
 * Post-fix contract: P and Q collide and their velocities change sign even
 * when every neighboring bucket exceeds the dense threshold.
 */

import { describe, expect, test } from 'bun:test'
import Elastica from '../src/index'
import type { ElementData } from '../src/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function staticEl(width: number, height: number): ElementData {
  return {
    element: { dataset: { state: 'static' } } as unknown as HTMLElement,
    rect: { width, height },
  }
}

function dynamicEl(width: number, height: number): ElementData {
  return { rect: { width, height } }
}

function integrate(e: Elastica): void {
  const dt = e.fixedDeltaTime
  for (let i = 0; i < e.positions.length; i++) {
    if (e.isStatic[i]) continue
    const pos = e.positions[i]
    const vel = e.velocities[i]
    if (pos && vel) {
      pos[0] += vel[0] * dt
      pos[1] += vel[1] * dt
    }
  }
}

// ---------------------------------------------------------------------------
// Scenario
//
// Container 800×800, gridSize 8 → cellSize = 100 px per cell.
//
// Cell (col=0, row=0) — x ∈ [0,100), y ∈ [0,100):
//   Fill with 17 static 8×8 boxes at y = 10, 20, 30 and x = 10…80.
//   → bucket 0 gets 18 bodies (17 fillers + P) → DENSE.
//
// Cell (col=1, row=0) — x ∈ [100,200), y ∈ [0,100):
//   Fill with 17 static 8×8 boxes at y = 10, 20, 30 and x = 110…180.
//   → bucket 1 gets 18 bodies (17 fillers + Q) → DENSE.
//
// P (index 34): dynamic 20×20 at (92, 50), vx = +0.1 px/ms  → cell 0
// Q (index 35): dynamic 20×20 at (108, 50), vx = -0.1 px/ms → cell 1
//
// P and Q are already overlapping across the seam:
//   P right edge = 102, Q left edge = 98  → 4 px overlap on x.
//
// isOBBNeighbor check:
//   dist(P,Q) = 16 px; maxDist = sqrt(200)+sqrt(200) ≈ 28.3 → they ARE neighbours.
//   SAT gives penetration = 4 on the x-axis, normal = [1, 0].
//
// None of the static fillers can collide with P or Q:
//   All fillers are at y ≤ 34 (box bottom = y + halfH = 30+4 = 34);
//   P and Q are at y = 50 with halfH = 10  → top of P/Q is y = 40 > 34.
// ---------------------------------------------------------------------------

// Build the element list
function buildElements(): ElementData[] {
  const elements: ElementData[] = []

  // Indices 0-16: 17 static fillers in cell (0,0)
  const cell0Xs = [10, 20, 30, 40, 50, 60, 70, 80]   // 8 at y=10
  const cell0Xs2 = [10, 20, 30, 40, 50, 60, 70, 80]  // 8 at y=20
  // 1 at y=30 to reach 17
  for (const x of cell0Xs) {
    elements.push(staticEl(8, 8))   // will be placed at (x, 10)
  }
  for (const x of cell0Xs2) {
    elements.push(staticEl(8, 8))   // will be placed at (x, 20)
  }
  elements.push(staticEl(8, 8))    // index 16, placed at (10, 30)

  // Indices 17-33: 17 static fillers in cell (1,0)
  const cell1Xs = [110, 120, 130, 140, 150, 160, 170, 180]
  const cell1Xs2 = [110, 120, 130, 140, 150, 160, 170, 180]
  for (const x of cell1Xs) {
    elements.push(staticEl(8, 8))   // will be placed at (x, 10)
  }
  for (const x of cell1Xs2) {
    elements.push(staticEl(8, 8))   // will be placed at (x, 20)
  }
  elements.push(staticEl(8, 8))    // index 33, placed at (110, 30)

  // Index 34: P — dynamic 20×20 at (92, 50), approaching Q
  elements.push(dynamicEl(20, 20))

  // Index 35: Q — dynamic 20×20 at (108, 50), approaching P
  elements.push(dynamicEl(20, 20))

  return elements
}

function setupPositions(e: Elastica): void {
  // Fillers in cell (0,0) — indices 0–16
  const cell0Xs = [10, 20, 30, 40, 50, 60, 70, 80]
  let idx = 0
  for (const x of cell0Xs) {
    e.positions[idx++] = [x, 10]
  }
  for (const x of cell0Xs) {
    e.positions[idx++] = [x, 20]
  }
  e.positions[idx++] = [10, 30]   // idx === 16 after this, idx becomes 17

  // Fillers in cell (1,0) — indices 17–33
  const cell1Xs = [110, 120, 130, 140, 150, 160, 170, 180]
  for (const x of cell1Xs) {
    e.positions[idx++] = [x, 10]
  }
  for (const x of cell1Xs) {
    e.positions[idx++] = [x, 20]
  }
  e.positions[idx++] = [110, 30]  // idx === 33 after this, idx becomes 34

  // P (index 34)
  e.positions[34] = [92, 50]
  e.velocities[34] = [0.1, 0]    // approaching Q (moving right)

  // Q (index 35)
  e.positions[35] = [108, 50]
  e.velocities[35] = [-0.1, 0]   // approaching P (moving left)
}

describe('dense-bucket seam collision', () => {
  test('P and Q collide across the dense-bucket boundary: velocities change', () => {
    const container = { width: 800, height: 800 }
    const elements = buildElements()

    const e = new Elastica({
      gridSize: 8,
      useOBB: true,
      borders: false,
      collisions: true,
      defaultRestitution: 0.8,
    })

    e.initialCondition(elements, container, (eng) => {
      setupPositions(eng)
    })

    // Verify both buckets are dense before running (>16 bodies each)
    const bucket0 = e.buckets.get(0)
    const bucket1 = e.buckets.get(1)
    expect((bucket0?.length ?? 0)).toBeGreaterThan(16)
    expect((bucket1?.length ?? 0)).toBeGreaterThan(16)

    // P and Q are already overlapping (P.right=102, Q.left=98)
    expect(e.positions[34]![0]).toBe(92)
    expect(e.positions[35]![0]).toBe(108)

    const initialPvx = e.velocities[34]![0]  // +0.1
    const initialQvx = e.velocities[35]![0]  // -0.1

    // Run a few frames; post-fix the collision is detected on the first frame
    for (let frame = 0; frame < 3; frame++) {
      e.update(elements, integrate)
    }

    const finalPvx = e.velocities[34]![0]
    const finalQvx = e.velocities[35]![0]

    // Everything must stay finite
    expect(Number.isFinite(finalPvx)).toBe(true)
    expect(Number.isFinite(finalQvx)).toBe(true)

    // Post-fix: collision was detected → velocities must have changed.
    // P was moving right (+0.1); after resolving it must have decelerated or reversed.
    // Q was moving left (−0.1); after resolving it must have decelerated or reversed.
    // Pre-fix bug: velocities stay at ±0.1 (pair never seen by the resolver).
    expect(finalPvx).toBeLessThan(initialPvx)   // P slowed or reversed
    expect(finalQvx).toBeGreaterThan(initialQvx) // Q slowed or reversed
  })

  test('all body positions and velocities remain finite after 10 frames', () => {
    const container = { width: 800, height: 800 }
    const elements = buildElements()

    const e = new Elastica({ gridSize: 8, useOBB: true, borders: false })

    e.initialCondition(elements, container, (eng) => {
      setupPositions(eng)
    })

    for (let frame = 0; frame < 10; frame++) {
      e.update(elements, integrate)
    }

    for (let i = 0; i < elements.length; i++) {
      const pos = e.positions[i]
      const vel = e.velocities[i]
      if (pos) {
        expect(Number.isFinite(pos[0])).toBe(true)
        expect(Number.isFinite(pos[1])).toBe(true)
      }
      if (vel) {
        expect(Number.isFinite(vel[0])).toBe(true)
        expect(Number.isFinite(vel[1])).toBe(true)
      }
    }
  })
})
