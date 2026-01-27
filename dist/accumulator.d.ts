export type PhysicsAccumulator = {
    accumulated: number;
    fixedDeltaTime: number;
};
export declare function createAccumulator(fixedDeltaTime: number): PhysicsAccumulator;
/**
 * Accumulates time and returns how many physics steps should run this frame.
 * This decouples physics rate from render rate, ensuring consistent simulation
 * speed across different screen refresh rates (60Hz vs 120Hz).
 */
export declare function accumulateTime(accumulator: PhysicsAccumulator, deltaTime: number): number;
