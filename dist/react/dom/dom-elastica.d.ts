import type { ElasticaConfigOBB } from '@darkroom.engineering/elastica';
import { type ReactNode, type Ref } from 'react';
import type { InitialConditionParams, UpdateParams } from '../types';
export type DomElasticaRef = {
    play: () => void;
    pause: () => void;
};
export type DomElasticaProps = {
    children?: ReactNode;
    className?: string;
    config?: ElasticaConfigOBB;
    initialCondition?: (params: InitialConditionParams) => void;
    update?: (params: UpdateParams) => void;
    showHashGrid?: boolean;
    ref?: Ref<DomElasticaRef>;
    /**
     * Called once when the simulation settles (max speed of non-static bodies stays
     * below `settleThreshold` for 10 consecutive physics steps). Re-arms after speed
     * later exceeds 2× threshold, allowing repeated settle→impulse cycles.
     */
    onSettle?: () => void;
    /**
     * Velocity magnitude threshold for settle detection (default: 0.05).
     * Based on typical initial velocity range of ~0.5 in presets.
     */
    settleThreshold?: number;
};
/**
 * DomElastica provides DOM-based physics simulation using CSS variable transforms.
 * Best for fewer than 200 elements where you need full DOM interactivity.
 *
 * For 200+ elements, use CanvasElastica instead for better performance.
 *
 * Usage:
 * ```tsx
 * <DomElastica
 *   config={{ collisions: true, borders: 'rigid' }}
 *   initialCondition={({ positions, velocities, container }) => {
 *     // Set initial positions and velocities
 *   }}
 *   update={({ velocities, deltaTime }) => {
 *     // Apply forces per frame
 *   }}
 * >
 *   <BoundaryBox><div>Element 1</div></BoundaryBox>
 *   <BoundaryBox><div>Element 2</div></BoundaryBox>
 * </DomElastica>
 * ```
 */
export declare function DomElastica({ children, className, config, initialCondition, update, showHashGrid, ref, onSettle, settleThreshold, }: DomElasticaProps): import("react/jsx-runtime").JSX.Element;
