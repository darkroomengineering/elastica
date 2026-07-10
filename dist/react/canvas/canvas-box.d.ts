import type { CanvasParticleData, CanvasShape } from '../types';
export interface CanvasBoxProps {
    /** Width in pixels (required for 'rect', ignored for 'circle' if radius is set) */
    width?: number;
    /** Height in pixels (required for 'rect', ignored for 'circle' if radius is set) */
    height?: number;
    /** Radius in pixels (for 'circle' shape only) */
    radius?: number;
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
    /**
     * Custom per-particle draw function. Overrides the default batched renderer for
     * this particle. Called with origin (0,0) at body center, rotation already applied.
     * Enables SVG/icon sprites via pre-rasterized offscreen canvas + drawImage.
     */
    draw?: CanvasParticleData['draw'];
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
export declare function CanvasBox({ width, height, radius, shape, fill, stroke, strokeWidth, mass, restitution, static: isStatic, draw, }: CanvasBoxProps): null;
