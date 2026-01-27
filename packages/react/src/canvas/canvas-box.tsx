'use client'

import { useEffect, useRef } from 'react'
import { useCanvasElastica } from '../context'
import type { CanvasShape } from '../types'

export interface CanvasBoxProps {
  /** Width in pixels (required for 'rect', ignored for 'circle' if radius is set) */
  width?: number
  /** Height in pixels (required for 'rect', ignored for 'circle' if radius is set) */
  height?: number
  /** Radius in pixels (for 'circle' shape only) */
  radius?: number
  /** Shape to render (default: 'rect') */
  shape?: CanvasShape
  /** Fill color (default: '#ffffff') */
  fill?: string
  /** Stroke color (optional) */
  stroke?: string
  /** Stroke width (default: 1 if stroke is set) */
  strokeWidth?: number
  /** Mass (defaults to config.defaultMass) */
  mass?: number
  /** Restitution/bounciness (defaults to config.defaultRestitution) */
  restitution?: number
  /** Static elements don't move */
  static?: boolean
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
export function CanvasBox({
  width,
  height,
  radius,
  shape = 'rect',
  fill = '#ffffff',
  stroke,
  strokeWidth = 1,
  mass,
  restitution,
  static: isStatic = false,
}: CanvasBoxProps) {
  const { registerParticle, unregisterParticle, updateParticle } = useCanvasElastica()
  const indexRef = useRef<number>(-1)
  const registeredRef = useRef(false)

  // For circles with radius, derive width/height from radius
  const effectiveWidth = shape === 'circle' && radius !== undefined ? radius * 2 : (width ?? 0)
  const effectiveHeight = shape === 'circle' && radius !== undefined ? radius * 2 : (height ?? 0)

  // Register particle on mount
  useEffect(() => {
    if (registeredRef.current) return

    indexRef.current = registerParticle({
      width: effectiveWidth,
      height: effectiveHeight,
      radius,
      shape,
      fill,
      stroke,
      strokeWidth,
      mass,
      restitution,
      isStatic,
    })
    registeredRef.current = true

    return () => {
      if (indexRef.current >= 0) {
        unregisterParticle(indexRef.current)
        registeredRef.current = false
      }
    }
  }, [registerParticle, unregisterParticle])

  // Update particle properties when they change
  useEffect(() => {
    if (indexRef.current >= 0 && registeredRef.current) {
      updateParticle(indexRef.current, {
        width: effectiveWidth,
        height: effectiveHeight,
        radius,
        shape,
        fill,
        stroke,
        strokeWidth,
        mass,
        restitution,
        isStatic,
      })
    }
  }, [effectiveWidth, effectiveHeight, radius, shape, fill, stroke, strokeWidth, mass, restitution, isStatic, updateParticle])

  // Virtual component - renders nothing
  return null
}
