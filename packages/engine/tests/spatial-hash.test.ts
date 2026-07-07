/**
 * Regression tests for issue #9 (C8 / C36 / C37):
 * The spatial hash must remain consistent under edge-case inputs.
 *
 * THESE FIXES ARE NOT YET IMPLEMENTED.
 * Every test documents the agreed post-fix contract.
 *
 *   (a) Large-body auto-clamp: a body whose half-extent is larger than one cell
 *       must still collide with bodies in non-adjacent cells. Post-fix: the hash
 *       clamps effective gridSize so that cellSize ≥ largest maxExtent, widening
 *       the neighbourhood so large bodies are never missed.
 *
 *   (b) Zero / unset container: constructing an engine without a container (or
 *       with 0×0) and calling update() must not produce NaN or hang.
 *
 *   (c) gridSize single-source: changing elastica.gridSize at runtime must keep
 *       the hash encode/decode in sync; two overlapping bodies at container
 *       centre must still be detected as colliding.
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
// (a) Large body: body A spans multiple cells, body B overlaps from outside
//     the 3×3 neighbourhood of A's centre cell
// ---------------------------------------------------------------------------

describe('(a) large-body auto-clamp: pair detected beyond default 3×3 neighbourhood', () => {
  /**
   * Container 800×800, gridSize 8 → cellSize = 100 px.
   *
   * Body A: static 400×400 centred at (200, 400).
   *   halfExtent = sqrt(200²+200²) ≈ 282.8 px (spans ~3 cells on each side).
   *   A's centre cell: cellX = floor(8*200/800) = 2, cellY = floor(8*400/800) = 4 → cell 34.
   *
   * Body B: dynamic 20×20 centred at (405, 400), moving left (vx = −0.1 px/ms).
   *   B overlaps A's right edge by ~5 px.
   *   B's centre cell: cellX = floor(8*405/800) = 4, cellY = 4 → cell 36.
   *
   * Current bug: |cellX_A - cellX_B| = 2 > 1, so B is OUTSIDE A's 3×3 neighbourhood
   * and the pair is never detected. B passes through A.
   *
   * Post-fix: effective gridSize is clamped so that cellSize ≥ A's maxExtent (≈283 px).
   *   effectiveGridSize = floor(800 / 283) = 2 → cellSize = 400 px.
   *   A → cell (0, 1), B → cell (1, 1); they ARE neighbours → collision detected.
   */

  test('body B moving into large body A: B velocity changes sign within a few frames', () => {
    const container = { width: 800, height: 800 }
    const elements: ElementData[] = [
      staticEl(400, 400),  // index 0 — A
      dynamicEl(20, 20),   // index 1 — B
    ]

    const e = new Elastica({
      gridSize: 8,
      useOBB: true,
      borders: false,
      collisions: true,
      defaultRestitution: 0.8,
    })

    e.initialCondition(elements, container, (eng) => {
      eng.positions[0] = [200, 400]   // A: static, centre at (200, 400)
      eng.positions[1] = [405, 400]   // B: overlaps A's right edge (400) by 5 px
      eng.velocities[1] = [-0.1, 0]  // B moving left, into A
    })

    const vxBefore = e.velocities[1]![0]  // -0.1

    // Run a few frames — with fix, collision is detected on the first frame
    for (let frame = 0; frame < 5; frame++) {
      e.update(elements, integrate)
    }

    const vxAfter = e.velocities[1]![0]

    expect(Number.isFinite(vxAfter)).toBe(true)
    expect(Number.isFinite(e.positions[1]![0])).toBe(true)

    // Post-fix: B is pushed right (away from A) → vx becomes positive.
    // Bug: pair not detected → B continues moving left → vx stays near -0.1.
    expect(vxAfter).toBeGreaterThan(vxBefore)   // velocity changed
    expect(vxAfter).toBeGreaterThan(0)           // now moving right (expelled)
  })
})

// ---------------------------------------------------------------------------
// (b) Zero / unset container — engine must not produce NaN or hang
// ---------------------------------------------------------------------------

describe('(b) zero or unset container: no NaN and no crash', () => {
  /**
   * With container {width:0, height:0}, computeCellId divides by zero.
   * Math.floor(Infinity) = Infinity; after clamping all bodies land in the last
   * cell, which is fine — no NaN. The test locks in that invariant and also
   * verifies that calling update() with an empty element list before any
   * initialCondition does not throw.
   */

  test('update() before initialCondition (empty positions): does not throw', () => {
    const e = new Elastica({ gridSize: 4, useOBB: true, borders: false })
    // No initialCondition call — positions is empty
    expect(() => {
      e.update([], () => {})
    }).not.toThrow()
  })

  test('update() with 0×0 container: positions stay finite', () => {
    const container = { width: 0, height: 0 }
    const elements: ElementData[] = [dynamicEl(20, 20), dynamicEl(20, 20)]

    const e = new Elastica({ gridSize: 4, useOBB: true, borders: false })

    e.initialCondition(elements, container, (eng) => {
      eng.positions[0] = [100, 100]
      eng.positions[1] = [120, 100]
      eng.velocities[0] = [0.05, 0]
      eng.velocities[1] = [-0.05, 0]
    })

    for (let frame = 0; frame < 10; frame++) {
      e.update(elements, integrate)
    }

    for (let i = 0; i < elements.length; i++) {
      expect(Number.isFinite(e.positions[i]![0])).toBe(true)
      expect(Number.isFinite(e.positions[i]![1])).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// (c) gridSize single-source: runtime change must keep hash and resolver in sync
// ---------------------------------------------------------------------------

describe('(c) runtime gridSize change stays consistent', () => {
  /**
   * elastica.gridSize is a public field; the SpatialHash instance has its OWN
   * readonly gridSize from construction. If the user changes elastica.gridSize
   * at runtime, getOBBState() passes the new value as the grid size for
   * neighbour lookup, but computeCellId still uses the old value.
   *
   * Post-fix contract: changing elastica.gridSize (via whatever setter survives
   * the fix) causes both the hash encode AND the neighbour decode to use the
   * same value, so two overlapping bodies at container centre still collide.
   */

  test('two overlapping bodies still collide after gridSize is changed to 16', () => {
    const container = { width: 800, height: 800 }
    const elements: ElementData[] = [dynamicEl(20, 20), dynamicEl(20, 20)]

    const e = new Elastica({
      gridSize: 4,   // initial
      useOBB: true,
      borders: false,
      collisions: true,
      defaultRestitution: 0.8,
    })

    e.initialCondition(elements, container, (eng) => {
      eng.positions[0] = [392, 400]   // overlapping: half-extents 10+10 vs Δx=16 → 4px overlap
      eng.positions[1] = [408, 400]
      eng.velocities[0] = [0.05, 0]
      eng.velocities[1] = [-0.05, 0]
    })

    // Change gridSize at runtime — post-fix: both hash and resolver use 16
    e.gridSize = 16

    const vx0Before = e.velocities[0]![0]
    const vx1Before = e.velocities[1]![0]

    for (let frame = 0; frame < 3; frame++) {
      e.update(elements, integrate)
    }

    // Post-fix: collision detected → velocities change
    // Bug: hash and resolver diverge → pair never detected → velocities unchanged
    expect(e.velocities[0]![0]).toBeLessThan(vx0Before)   // body 0 slowed/reversed
    expect(e.velocities[1]![0]).toBeGreaterThan(vx1Before) // body 1 slowed/reversed

    expect(Number.isFinite(e.velocities[0]![0])).toBe(true)
    expect(Number.isFinite(e.velocities[1]![0])).toBe(true)
  })
})
