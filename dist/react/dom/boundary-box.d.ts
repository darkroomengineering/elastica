import { type HTMLAttributes } from 'react';
export type BoundaryBoxProps = HTMLAttributes<HTMLDivElement>;
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
 */
export declare const BoundaryBox: import("react").NamedExoticComponent<BoundaryBoxProps>;
