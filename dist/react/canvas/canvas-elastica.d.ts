import { type ReactNode } from 'react';
import type { CanvasParticleData, ElasticaConfigOBB, InitialConditionParams, UpdateParams } from '../types';
export type { CanvasParticleData };
export interface CanvasElasticaProps {
    children?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
    config?: ElasticaConfigOBB;
    initialCondition?: (params: InitialConditionParams) => void;
    update?: (params: UpdateParams) => void;
    /** Device pixel ratio (default: window.devicePixelRatio) */
    dpr?: number;
    /** Show spatial hash grid for debugging */
    showHashGrid?: boolean;
}
/**
 * CanvasElastica provides a canvas-based physics simulation for many particles.
 * Use this instead of DomElastica when you need 200+ elements for better performance.
 *
 * Usage:
 * ```tsx
 * <CanvasElastica
 *   config={{ collisions: true, borders: 'rigid' }}
 *   initialCondition={({ positions, velocities, container }) => {
 *     for (let i = 0; i < positions.length; i++) {
 *       positions[i] = [Math.random() * container.width, Math.random() * container.height]
 *       velocities[i] = [(Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5]
 *     }
 *   }}
 *   update={({ velocities, deltaTime }) => {
 *     for (let i = 0; i < velocities.length; i++) {
 *       velocities[i][1] += 0.0005 * deltaTime // gravity
 *     }
 *   }}
 * >
 *   {Array.from({ length: 200 }, (_, i) => (
 *     <CanvasBox key={i} width={10} height={10} shape="rect" fill="#ffffff" />
 *   ))}
 * </CanvasElastica>
 * ```
 */
export declare function CanvasElastica({ children, className, style, config, initialCondition, update, dpr, showHashGrid, }: CanvasElasticaProps): import("react/jsx-runtime").JSX.Element;
