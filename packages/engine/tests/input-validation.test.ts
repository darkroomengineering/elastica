/**
 * Regression tests for issue #8 (C24 / C25 / C27 / C74 / C75):
 * Input validation — the engine must clamp or reject out-of-range values
 * rather than letting NaN / infinity / divide-by-zero propagate.
 *
 * THESE FIXES ARE NOT YET IMPLEMENTED.
 * Every test in this file documents the agreed post-fix contract.
 * They are expected to fail against the current code.
 *
 *   (a) defaultRestitution > 1  → clamped to [0, 1]; energy cannot explode.
 *   (b) createAccumulator with fixedDeltaTime 0 / negative / NaN → clamped
 *       to ≥ 1 ms; accumulateTime() must terminate.
 *   (c) solver.substeps NaN or 0 → treated as 1; body actually moves.
 *   (d) setMass(i, 0) / setMass(i, -5) / setMass(i, NaN) → no-op, previous
 *       mass is preserved; subsequent collisions stay finite.
 *   (e) Zero-size body (dimensions [0, 0]) → NEVER collides with another body.
 */

import { describe, expect, test } from 'bun:test'
import Elastica from '../src/index'
import { accumulateTime, createAccumulator } from '../src/accumulator'
import type { ElementData } from '../src/types'

// ---------------------------------------------------------------------------
// Helpers shared across subtests
// ---------------------------------------------------------------------------

function dynamicEl(width: number, height: number): ElementData {
  return { rect: { width, height } }
}

function staticEl(width: number, height: number): ElementData {
  return {
    element: { dataset: { state: 'static' } } as unknown as HTMLElement,
    rect: { width, height },
  }
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
// (a) defaultRestitution clamping
// ---------------------------------------------------------------------------

describe('(a) defaultRestitution > 1 must be clamped to 1', () => {
  /**
   * Why this matters: restitution is a coefficient of energy restitution. Any value
   * above 1 causes the resolver to ADD energy each collision, leading to runaway
   * velocities. The engine must clamp it so a collision cannot violate energy budget.
   */
  test('two-body head-on collision with restitution=1.2: total KE never exceeds initial KE', () => {
    // Two equal-mass bodies approaching head-on
    const container = { width: 600, height: 600 }
    const elements: ElementData[] = [dynamicEl(20, 20), dynamicEl(20, 20)]

    // defaultRestitution=1.2 must be clamped to 1.0 post-fix
    const e = new Elastica({
      gridSize: 4,
      useOBB: true,
      borders: false,
      collisions: true,
      defaultRestitution: 1.2,
    })

    e.initialCondition(elements, container, (eng) => {
      eng.positions[0] = [250, 300]
      eng.positions[1] = [350, 300]
      eng.velocities[0] = [0.1, 0]   // moving right
      eng.velocities[1] = [-0.1, 0]  // moving left
    })

    // Compute initial total kinetic energy (linear only, both mass=1 by default)
    function kineticEnergy(eng: Elastica): number {
      let ke = 0
      for (let i = 0; i < eng.velocities.length; i++) {
        const vel = eng.velocities[i]
        const mass = eng.masses[i] ?? 1
        if (vel) ke += 0.5 * mass * (vel[0] ** 2 + vel[1] ** 2)
      }
      return ke
    }

    const initialKE = kineticEnergy(e)
    expect(initialKE).toBeGreaterThan(0)

    // Run 200 frames: if restitution is not clamped, KE will explode
    for (let frame = 0; frame < 200; frame++) {
      e.update(elements, integrate)

      const ke = kineticEnergy(e)
      expect(Number.isFinite(ke)).toBe(true)

      // Post-fix: KE may decrease (inelastic) but must never exceed initial
      // Bug: KE grows unboundedly when restitution > 1
      expect(ke).toBeLessThanOrEqual(initialKE * 1.01) // 1% tolerance for float arithmetic
    }
  })
})

// ---------------------------------------------------------------------------
// (b) createAccumulator edge-case fixedDeltaTime values
// ---------------------------------------------------------------------------

describe('(b) createAccumulator clamps fixedDeltaTime to ≥ 1 ms', () => {
  /**
   * accumulateTime with fixedDeltaTime=0 or negative causes an infinite while-loop
   * (accumulated never drops below the step size). The fix must clamp the stored
   * fixedDeltaTime to at least 1 ms so the function always terminates.
   */

  test('fixedDeltaTime=0 is clamped: accumulateTime terminates and returns > 0 steps', () => {
    // Without fix: infinite loop — this test times out.
    const acc = createAccumulator(0)   // post-fix: stored as ≥ 1 ms
    const steps = accumulateTime(acc, 100)
    expect(Number.isFinite(steps)).toBe(true)
    expect(steps).toBeGreaterThan(0)
  }, 1000 /* ms timeout — prevents infinite hang in CI */)

  test('fixedDeltaTime=-10 is clamped: accumulateTime terminates and returns > 0 steps', () => {
    // Without fix: negative step size also causes an infinite loop (accumulated grows).
    const acc = createAccumulator(-10)
    const steps = accumulateTime(acc, 100)
    expect(Number.isFinite(steps)).toBe(true)
    expect(steps).toBeGreaterThan(0)
  }, 1000)

  test('fixedDeltaTime=NaN defaults to engine default (≈16.67 ms): returns > 0 steps for 100 ms input', () => {
    // Without fix: NaN comparison always false → 0 steps returned.
    const acc = createAccumulator(NaN)
    const steps = accumulateTime(acc, 100)
    expect(Number.isFinite(steps)).toBe(true)
    // At ≈16.67 ms per step, 100 ms → ~6 steps (cap is 4 per bun test run)
    expect(steps).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// (c) solver.substeps NaN or 0 → treated as 1
// ---------------------------------------------------------------------------

describe('(c) substeps NaN or 0 treated as 1: body position changes after update', () => {
  /**
   * Math.max(1, Math.floor(NaN)) = NaN, so the for-loop condition `0 < NaN`
   * is always false → physics never runs → the body never moves.
   * Post-fix: substeps must be clamped to Math.max(1, ...) with a NaN guard.
   */

  test('substeps=NaN: body with non-zero velocity moves after one update()', () => {
    const container = { width: 400, height: 400 }
    const elements: ElementData[] = [dynamicEl(20, 20)]

    const e = new Elastica({
      gridSize: 4,
      useOBB: true,
      borders: false,
      collisions: false,
      solver: { substeps: NaN },
    })

    e.initialCondition(elements, container, (eng) => {
      eng.positions[0] = [200, 200]
      eng.velocities[0] = [0.1, 0]
    })

    const xBefore = e.positions[0]![0]
    e.update(elements, integrate)
    const xAfter = e.positions[0]![0]

    // Post-fix: at least 1 substep ran → position must change
    // Bug: 0 substeps ran → position unchanged → assertion fails
    expect(xAfter).toBeGreaterThan(xBefore)
  })

  test('substeps=0: body with non-zero velocity moves after one update()', () => {
    const container = { width: 400, height: 400 }
    const elements: ElementData[] = [dynamicEl(20, 20)]

    const e = new Elastica({
      gridSize: 4,
      useOBB: true,
      borders: false,
      collisions: false,
      solver: { substeps: 0 },
    })

    e.initialCondition(elements, container, (eng) => {
      eng.positions[0] = [200, 200]
      eng.velocities[0] = [0.1, 0]
    })

    const xBefore = e.positions[0]![0]
    e.update(elements, integrate)
    const xAfter = e.positions[0]![0]

    expect(xAfter).toBeGreaterThan(xBefore)
  })
})

// ---------------------------------------------------------------------------
// (d) setMass invalid values → no-op, previous mass preserved
// ---------------------------------------------------------------------------

describe('(d) setMass with invalid values is a no-op', () => {
  /**
   * Setting mass to 0 causes division by zero in the position-correction formula
   * (totalMass = massA + massB = 0). The engine must treat 0, negative, and NaN
   * as invalid and leave the stored mass unchanged.
   */

  function makeTwoBodyEngine() {
    const container = { width: 400, height: 400 }
    const elements: ElementData[] = [dynamicEl(20, 20), dynamicEl(20, 20)]
    const e = new Elastica({ gridSize: 4, useOBB: true, borders: false, collisions: true })
    e.initialCondition(elements, container, (eng) => {
      eng.positions[0] = [180, 200]
      eng.positions[1] = [220, 200]
      eng.velocities[0] = [0.05, 0]
      eng.velocities[1] = [-0.05, 0]
    })
    return { e, elements }
  }

  test('setMass(i, 0) is a no-op: mass stays at its previous value', () => {
    const { e } = makeTwoBodyEngine()
    const prevMass = e.masses[0]!
    e.setMass(0, 0)
    // Post-fix: mass unchanged. Bug: mass becomes 0.
    expect(e.masses[0]).toBe(prevMass)
  })

  test('setMass(i, -5) is a no-op: mass stays at its previous value', () => {
    const { e } = makeTwoBodyEngine()
    const prevMass = e.masses[0]!
    e.setMass(0, -5)
    expect(e.masses[0]).toBe(prevMass)
  })

  test('setMass(i, NaN) is a no-op: mass stays at its previous value', () => {
    const { e } = makeTwoBodyEngine()
    const prevMass = e.masses[0]!
    e.setMass(0, NaN)
    expect(e.masses[0]).toBe(prevMass)
  })

  test('collision after invalid setMass produces finite velocities', () => {
    const { e, elements } = makeTwoBodyEngine()
    e.setMass(0, 0)  // buggy code sets mass to 0 → NaN/Inf in resolver

    for (let i = 0; i < 20; i++) {
      e.update(elements, integrate)
    }

    for (let i = 0; i < elements.length; i++) {
      expect(Number.isFinite(e.velocities[i]![0])).toBe(true)
      expect(Number.isFinite(e.velocities[i]![1])).toBe(true)
      expect(Number.isFinite(e.positions[i]![0])).toBe(true)
      expect(Number.isFinite(e.positions[i]![1])).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// (e) Zero-size body never collides
// ---------------------------------------------------------------------------

describe('(e) zero-size body never causes a collision', () => {
  /**
   * A body with dimensions [0, 0] has zero area. It must not perturb any other
   * body's velocity, even when co-located. The SAT check naturally returns
   * overlap=0 for degenerate bodies (overlap ≤ 0 → no collision).
   * This test locks in that invariant so a future refactor cannot break it.
   */

  test('zero-size body co-located with a moving body: moving body velocity unchanged', () => {
    const container = { width: 400, height: 400 }

    // Index 0: zero-size rectangle (width=0, height=0)
    const zeroEl: ElementData = { rect: { width: 0, height: 0 } }
    // Index 1: normal moving 20×20 body
    const normalEl: ElementData = dynamicEl(20, 20)
    const elements: ElementData[] = [zeroEl, normalEl]

    const e = new Elastica({
      gridSize: 4,
      useOBB: true,
      borders: false,
      collisions: true,
    })

    e.initialCondition(elements, container, (eng) => {
      eng.positions[0] = [200, 200]  // zero-size body at the same spot
      eng.positions[1] = [200, 200]  // normal body moving through it
      eng.velocities[1] = [0.1, 0]
    })

    const vxBefore = e.velocities[1]![0]

    for (let frame = 0; frame < 50; frame++) {
      e.update(elements, integrate)
    }

    // Normal body must not have been deflected by the zero-size body.
    // The zero-size body contributes zero overlap in SAT, so no collision fires.
    // Use a generous tolerance; the body may have drifted but velocity origin is clear.
    expect(Number.isFinite(e.velocities[1]![0])).toBe(true)
    expect(Number.isFinite(e.positions[1]![0])).toBe(true)

    // Velocity should be approximately unchanged (no collisions with the ghost)
    // We allow a small epsilon for floating-point drift
    expect(Math.abs(e.velocities[1]![0] - vxBefore)).toBeLessThan(0.01)
  })
})
