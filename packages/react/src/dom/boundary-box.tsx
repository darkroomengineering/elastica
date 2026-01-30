'use client'

import type { ElementData } from '@darkroom.engineering/elastica'
import { useRect } from '@darkroom.engineering/hamo'
import { memo, useEffect, useRef, type HTMLAttributes } from 'react'
import { useDomElastica } from '../context'
import { initializeElement } from './renderer'

export type BoundaryBoxProps = HTMLAttributes<HTMLDivElement>

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
export const BoundaryBox = memo(function BoundaryBox({
  className,
  children,
  ...props
}: BoundaryBoxProps) {
  const { addBox, removeBox } = useDomElastica()
  const [setRectRef, rect] = useRect()
  const elementRef = useRef<HTMLDivElement | null>(null)
  const elementDataRef = useRef<ElementData | null>(null)

  // Register element once on mount, cleanup on unmount
  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Initialize element for CSS variable-based positioning
    initializeElement(element)

    // Create element data object that will be mutated with rect updates
    const elementData: ElementData = {
      element,
      rect: rect ?? { width: 0, height: 0 },
    }
    elementDataRef.current = elementData
    addBox(element, elementData)

    return () => {
      removeBox(element)
      elementDataRef.current = null
    }
    // Only depend on addBox/removeBox, not rect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addBox, removeBox])

  // Update rect in place without re-registering
  useEffect(() => {
    if (elementDataRef.current && rect) {
      elementDataRef.current.rect = rect
    }
  }, [rect])

  return (
    <div
      ref={(node) => {
        elementRef.current = node
        ;(setRectRef as (node: HTMLDivElement | null) => void)(node)
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  )
})
