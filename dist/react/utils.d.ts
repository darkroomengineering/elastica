import { type Dispatch, type SetStateAction } from 'react';
import type { Vector2D } from '@darkroom.engineering/elastica';
export declare function isEmptyArray<T>(arr: T[] | null | undefined): boolean;
export declare function useJavascriptEnable(initState?: boolean): [boolean, Dispatch<SetStateAction<boolean>>];
export type HashGridProps = {
    gridSize: number;
};
export declare function HashGrid({ gridSize }: HashGridProps): import("react/jsx-runtime").JSX.Element;
/**
 * SettleDetector — pure stateful object that detects when all non-static bodies
 * have settled (max speed below threshold for N consecutive frames), fires a
 * callback once, and re-arms when speed exceeds 2× threshold.
 *
 * Extracted as a pure helper so it can be unit-tested without a React harness.
 *
 * @param onSettle     Callback fired when the system settles (once per cycle).
 * @param threshold    Velocity magnitude threshold (default 0.05).
 * @param frameCount   Number of consecutive sub-threshold frames to wait (default 10).
 */
export declare function createSettleDetector(onSettle: () => void, threshold?: number, frameCount?: number): {
    /**
     * Call once per physics step with the current velocity and isStatic arrays.
     * Allocation-free: plain loop, no array allocations.
     */
    check(velocities: Vector2D[], isStatic: boolean[]): void;
    /** Reset all state (e.g. on re-initialization). */
    reset(): void;
};
