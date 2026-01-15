import type { Container, ContainerOffsets, Vector2D } from './types';
/**
 * State required for border handling
 */
export type BorderState = {
    positions: Vector2D[];
    velocities: Vector2D[];
    dimensions: Vector2D[];
    container: Container;
    containerOffsets: ContainerOffsets;
    isStatic: boolean[];
};
/**
 * Handle rigid borders - bodies bounce off container edges
 */
export declare function handleRigidBorders(state: BorderState, elementCount: number, onBounce?: (index: number) => void): void;
/**
 * Handle periodic borders - bodies wrap around container edges
 */
export declare function handlePeriodicBorders(state: BorderState, elementCount: number): void;
