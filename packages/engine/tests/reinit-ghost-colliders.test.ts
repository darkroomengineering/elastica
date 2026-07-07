/**
 * Regression tests for issue #10 (C26):
 * Re-running initialCondition where an element is now null must fully reset
 * that body index — clearing position contribution to the spatial hash,
 * zeroing velocity, setting maxExtent to 0 — so it cannot phantom-collide
 * with future bodies passing through its old position.
 *
 * Additionally, shrinking the element list (e.g. 3 → 2 bodies) must truncate
 * ALL per-body state arrays to the new length.
 *
 * THESE FIXES ARE NOT YET IMPLEMENTED.
 * Tests marked with the expected failure reason document the post-fix contract.
 *
 * How initialCondition reads elements (from elastica.ts:136-147):
 *   this.dimensions = elements.map((element, index) => {
 *     if (!element) return [0, 0]           // dims reset for null elements
 *     this.isStatic[index] = element.element?.dataset?.state === 'static'
 *     this.positions[index] = [0, 0]         // only for non-null
 *     this.velocities[index] = [0, 0]        // only for non-null
 *     ...
 *   })
 *   // after callback: cache staticPositions, call updateSpatialHash
 *
 * The bug: null elements only get dims=[0,0]; positions, velocities, maxExtents,
 * and the hash entry for that index are NOT reset.  When the element list shrinks
 * from 3 to 2, positions/velocities/maxExtents arrays are not truncated.
 */

import { describe, expect, test } from 'bun:test'
import Elastica from '../src/index'
import type { ElementData } from '../src/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
// Scenario — step by step:
//
// Round 1: init 3 bodies (A=0, B=1, C=2) at known positions.  Run 5 frames.
// Round 2: re-init with [A, null, C].  Index 1 becomes the ghost.
//   • Ghost has dims=[0,0] (from map returning [0,0] for null).
//   • BUG: positions[1] still holds Round-1 value; maxExtents[1] still > 0.
//   • Move body C through the ghost's old position for 100 frames.
//   • Assert C's velocity is not perturbed by the ghost.
// Round 3: re-init with [A, C] (2 elements).
//   • POST-FIX: all per-body arrays shrink to length 2.
//   • BUG: positions.length stays 3, maxExtents.length stays 3, etc.
// ---------------------------------------------------------------------------

const CONTAINER = { width: 800, height: 800 }

describe('ghost collider after re-initialCondition with null', () => {
  test('body C velocity is not changed by ghost (index 1) as C passes through old position', () => {
    const elA = dynamicEl(20, 20)
    const elB = dynamicEl(20, 20)  // will become ghost
    const elC = dynamicEl(20, 20)

    const e = new Elastica({
      gridSize: 4,
      useOBB: true,
      borders: false,
      collisions: true,
    })

    // Round 1: three bodies
    const round1 = [elA, elB, elC]
    e.initialCondition(round1, CONTAINER, (eng) => {
      eng.positions[0] = [100, 400]
      eng.positions[1] = [400, 400]  // B will become ghost at (400, 400)
      eng.positions[2] = [700, 400]
      // zero initial velocities
    })

    for (let i = 0; i < 5; i++) {
      e.update(round1, integrate)
    }

    // Round 2: B is now null → ghost at old position (400, 400)
    const round2: (ElementData | null | undefined)[] = [elA, null, elC]
    e.initialCondition(round2, CONTAINER, (eng) => {
      eng.positions[0] = [100, 400]
      // positions[1] not reset by current code (the bug) — ghost persists
      // C starts near the ghost and passes through it
      eng.positions[2] = [350, 400]
      eng.velocities[2] = [0.1, 0]   // moving right through ghost's position (400,400)
    })

    const vxBefore = e.velocities[2]![0]

    for (let i = 0; i < 100; i++) {
      e.update(round2, integrate)
    }

    // C's velocity must be unchanged: ghost has dims=[0,0] so SAT returns
    // zero overlap regardless of position. This is a sanity-check assertion
    // that also catches regressions if the SAT path changes.
    const vxAfter = e.velocities[2]![0]
    expect(Number.isFinite(vxAfter)).toBe(true)
    expect(Number.isFinite(e.positions[2]![0])).toBe(true)

    // Tolerance: velocity may drift very slightly but must not have a visible
    // collision impulse (which would flip sign or change magnitude by > 10%)
    expect(Math.abs(vxAfter - vxBefore)).toBeLessThan(0.02)
  })

  test('ghost maxExtent is 0 after re-init with null at that index', () => {
    const elA = dynamicEl(20, 20)
    const elB = dynamicEl(20, 20)   // will become ghost
    const elC = dynamicEl(20, 20)

    const e = new Elastica({ gridSize: 4, useOBB: true, borders: false })

    e.initialCondition([elA, elB, elC], CONTAINER, (eng) => {
      eng.positions[0] = [100, 400]
      eng.positions[1] = [400, 400]
      eng.positions[2] = [700, 400]
    })

    // elB (20×20) → maxExtents[1] = sqrt(10²+10²) ≈ 14.14 after round 1
    const maxExtentAfterRound1 = e.maxExtents[1]
    expect(maxExtentAfterRound1).toBeGreaterThan(0)

    // Re-init with B as null
    e.initialCondition([elA, null, elC], CONTAINER, (eng) => {
      eng.positions[0] = [100, 400]
      eng.positions[2] = [700, 400]
    })

    // Post-fix: maxExtents[1] must be reset to 0 so the ghost is invisible to
    // the broad-phase isOBBNeighbor check.
    // Bug: maxExtents[1] is still ≈ 14.14.
    expect(e.maxExtents[1]).toBe(0)
  })
})

describe('shrinking element list truncates all per-body state arrays', () => {
  /**
   * After re-initialCondition with a 2-element list following a 3-element
   * initialisation, ALL per-body arrays must have length 2.
   *
   * Current bug: only this.dimensions is replaced via .map() (new array of length 2).
   * this.positions, this.velocities, this.maxExtents etc. are mutated at specific
   * indices, never truncated, so they remain length 3.
   */

  test('positions.length becomes 2 after re-init with 2-element list', () => {
    const elA = dynamicEl(20, 20)
    const elB = dynamicEl(20, 20)
    const elC = dynamicEl(20, 20)

    const e = new Elastica({ gridSize: 4, useOBB: true, borders: false })

    e.initialCondition([elA, elB, elC], CONTAINER, (eng) => {
      eng.positions[0] = [100, 400]
      eng.positions[1] = [400, 400]
      eng.positions[2] = [700, 400]
    })

    expect(e.positions.length).toBe(3)  // sanity check before re-init

    e.initialCondition([elA, elC], CONTAINER, (eng) => {
      eng.positions[0] = [100, 400]
      eng.positions[1] = [700, 400]
    })

    // Post-fix: arrays are truncated.  Bug: positions.length stays 3.
    expect(e.positions.length).toBe(2)
  })

  test('velocities.length becomes 2 after re-init with 2-element list', () => {
    const elA = dynamicEl(20, 20)
    const elB = dynamicEl(20, 20)
    const elC = dynamicEl(20, 20)

    const e = new Elastica({ gridSize: 4, useOBB: true, borders: false })

    e.initialCondition([elA, elB, elC], CONTAINER, (eng) => {
      eng.positions[0] = [100, 400]
      eng.positions[1] = [400, 400]
      eng.positions[2] = [700, 400]
    })

    e.initialCondition([elA, elC], CONTAINER, (eng) => {
      eng.positions[0] = [100, 400]
      eng.positions[1] = [700, 400]
    })

    expect(e.velocities.length).toBe(2)
  })

  test('maxExtents.length becomes 2 after re-init with 2-element list', () => {
    const elA = dynamicEl(20, 20)
    const elB = dynamicEl(20, 20)
    const elC = dynamicEl(20, 20)

    const e = new Elastica({ gridSize: 4, useOBB: true, borders: false })

    e.initialCondition([elA, elB, elC], CONTAINER, (eng) => {
      eng.positions[0] = [100, 400]
      eng.positions[1] = [400, 400]
      eng.positions[2] = [700, 400]
    })

    e.initialCondition([elA, elC], CONTAINER, (eng) => {
      eng.positions[0] = [100, 400]
      eng.positions[1] = [700, 400]
    })

    expect(e.maxExtents.length).toBe(2)
  })

  test('a 2-body simulation after shrink-re-init produces finite state for 50 frames', () => {
    const elA = dynamicEl(20, 20)
    const elB = dynamicEl(20, 20)
    const elC = dynamicEl(20, 20)

    const e = new Elastica({ gridSize: 4, useOBB: true, borders: false, collisions: true })

    e.initialCondition([elA, elB, elC], CONTAINER, (eng) => {
      eng.positions[0] = [100, 400]
      eng.positions[1] = [400, 400]
      eng.positions[2] = [700, 400]
    })

    const reduced = [elA, elC]
    e.initialCondition(reduced, CONTAINER, (eng) => {
      eng.positions[0] = [200, 400]
      eng.positions[1] = [250, 400]   // overlapping — collision should fire
      eng.velocities[0] = [0.05, 0]
      eng.velocities[1] = [-0.05, 0]
    })

    for (let i = 0; i < 50; i++) {
      e.update(reduced, integrate)
    }

    for (let i = 0; i < reduced.length; i++) {
      expect(Number.isFinite(e.positions[i]![0])).toBe(true)
      expect(Number.isFinite(e.velocities[i]![0])).toBe(true)
    }
  })
})
