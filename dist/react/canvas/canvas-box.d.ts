import type { CanvasShape } from '../types';
export interface CanvasBoxProps {
    /** Width in pixels */
    width: number;
    /** Height in pixels */
    height: number;
    /** Shape to render (default: 'rect') */
    shape?: CanvasShape;
    /** Fill color (default: '#ffffff') */
    fill?: string;
    /** Stroke color (optional) */
    stroke?: string;
    /** Stroke width (default: 1 if stroke is set) */
    strokeWidth?: number;
    /** Mass (defaults to config.defaultMass) */
    mass?: number;
    /** Restitution/bounciness (defaults to config.defaultRestitution) */
    restitution?: number;
    /** Static elements don't move */
    static?: boolean;
}
/**
 * CanvasBox is a virtual component that registers a particle with CanvasElastica.
 * It renders nothing to the DOM - all rendering is handled by the canvas.
 *
 * Usage:
 * ```tsx
 * <CanvasElastica>
 *   <CanvasBox width={10} height={10} shape="rect" fill="#ffffff" />
 *   <CanvasBox width={20} height={20} shape="circle" fill="#ff0000" />
 * </CanvasElastica>
 * ```
 */
export declare function CanvasBox({ width, height, shape, fill, stroke, strokeWidth, mass, restitution, static: isStatic, }: CanvasBoxProps): null;
