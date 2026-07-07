export type PhysicsAccumulator = {
  accumulated: number
  fixedDeltaTime: number
}

/**
 * Maximum number of physics steps allowed per frame.
 * Caps catch-up steps after a backgrounded tab (spiral-of-death guard).
 * Under sustained overload the simulation runs slower than wall-clock by design.
 */
const MAX_STEPS_PER_FRAME = 4

export function createAccumulator(fixedDeltaTime: number): PhysicsAccumulator {
  const safeDt = Number.isFinite(fixedDeltaTime) ? Math.max(1, fixedDeltaTime) : 16.67
  return {
    accumulated: 0,
    fixedDeltaTime: safeDt,
  }
}

/**
 * Accumulates time and returns how many physics steps should run this frame.
 * This decouples physics rate from render rate, ensuring consistent simulation
 * speed across different screen refresh rates (60Hz vs 120Hz).
 */
export function accumulateTime(
  accumulator: PhysicsAccumulator,
  deltaTime: number
): number {
  accumulator.accumulated += deltaTime

  let steps = 0
  while (accumulator.accumulated >= accumulator.fixedDeltaTime) {
    accumulator.accumulated -= accumulator.fixedDeltaTime
    steps++
  }

  // Cap to prevent spiral of death if tab was backgrounded
  return Math.min(steps, MAX_STEPS_PER_FRAME)
}
