export type PhysicsAccumulator = {
  accumulated: number
  fixedDeltaTime: number
}

export function createAccumulator(fixedDeltaTime: number): PhysicsAccumulator {
  return {
    accumulated: 0,
    fixedDeltaTime,
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
  return Math.min(steps, 4)
}
