import { type HTMLAttributes } from 'react';
export type BoundaryBoxProps = HTMLAttributes<HTMLDivElement> & {
    /**
     * Collision shape for the body. Circles use `min(width, height) / 2`
     * as the radius. Defaults to 'rectangle'.
     */
    shape?: 'rectangle' | 'circle';
};
/**
 * BoundaryBox wraps a DOM element to register it with DomElastica physics simulation.
 *
 * Usage:
 * ```tsx
 * <DomElastica config={...}>
 *   <BoundaryBox>
 *     <div className="my-element">Content</div>
 *   </BoundaryBox>
 * </DomElastica>
 * ```
 *
 * Add `data-state="static"` to make the element immovable:
 * ```tsx
 * <BoundaryBox data-state="static">
 *   <div>Static obstacle</div>
 * </BoundaryBox>
 * ```
 *
 * Pass `shape="circle"` for a circular collision body (e.g. rolling glyphs):
 * ```tsx
 * <BoundaryBox shape="circle">(n)</BoundaryBox>
 * ```
 */
export declare const BoundaryBox: import("react").NamedExoticComponent<BoundaryBoxProps>;
