'use client'

import Elastica from '@darkroom.engineering/elastica'
import type { ElementData } from '@darkroom.engineering/elastica'
import { useFrame, useRect } from '@darkroom.engineering/hamo'
import { type ReactNode, useCallback, useEffect, useMemo, useRef } from 'react'
import { ElasticaContext, type CanvasElasticaContextValue } from '../context'
import type {
  CanvasParticleData,
  ElasticaConfigOBB,
  InitialConditionParams,
  UpdateParams,
} from '../types'
export type { CanvasParticleData }
import { renderBatched, renderHashGrid } from './renderer'

export interface CanvasElasticaProps {
  children?: ReactNode
  className?: string
  style?: React.CSSProperties
  config?: ElasticaConfigOBB
  initialCondition?: (params: InitialConditionParams) => void
  update?: (params: UpdateParams) => void
  /** Device pixel ratio (default: window.devicePixelRatio) */
  dpr?: number
  /** Show spatial hash grid for debugging */
  showHashGrid?: boolean
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
export function CanvasElastica({
  children,
  className,
  style,
  config,
  initialCondition,
  update,
  dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1,
  showHashGrid = false,
}: CanvasElasticaProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const elasticaRef = useRef<Elastica | null>(null)
  const particlesRef = useRef<Map<number, CanvasParticleData>>(new Map())
  const nextIndexRef = useRef(0)
  const initializedRef = useRef(false)
  const [setRectRef, containerRect] = useRect()

  // Store callbacks in refs to avoid stale closures
  const initialConditionRef = useRef(initialCondition)
  const updateRef = useRef(update)
  useEffect(() => {
    initialConditionRef.current = initialCondition
  }, [initialCondition])
  useEffect(() => {
    updateRef.current = update
  }, [update])

  // Stable config reference
  const stableConfig = useMemo(
    () => config,
    [
      config?.gridSize,
      config?.collisions,
      config?.borders,
      config?.useOBB,
      config?.defaultMass,
      config?.defaultRestitution,
      config?.containerOffsets?.top,
      config?.containerOffsets?.bottom,
      config?.containerOffsets?.left,
      config?.containerOffsets?.right,
    ]
  )

  // Initialize engine
  useEffect(() => {
    elasticaRef.current = new Elastica(stableConfig)
    initializedRef.current = false
  }, [stableConfig])

  // Combine refs for container
  const setContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node
      setRectRef(node)
    },
    [setRectRef]
  )

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !containerRect) return

    canvas.width = containerRect.width * dpr
    canvas.height = containerRect.height * dpr
    canvas.style.width = `${containerRect.width}px`
    canvas.style.height = `${containerRect.height}px`

    // Re-initialize when container size changes
    initializedRef.current = false
  }, [containerRect, dpr])

  // Build ElementData array from registered particles
  const buildElementDataArray = useCallback((): ElementData[] => {
    const particles = Array.from(particlesRef.current.values())
    return particles.map((p) => ({
      element: undefined, // Canvas mode - no DOM element
      rect: { width: p.width, height: p.height },
    }))
  }, [])

  // Animation loop
  useFrame((time: number, deltaTime: number) => {
    const elastica = elasticaRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!elastica || !canvas || !ctx || !containerRect) return

    const particles = Array.from(particlesRef.current.values())
    if (particles.length === 0) return

    const elements = buildElementDataArray()

    // Initialize on first frame or after resize
    if (!initializedRef.current) {
      // Set static flags and dimensions before initialCondition
      particles.forEach((p, i) => {
        if (p.isStatic) {
          const el = elements[i]
          if (el && el.element === null) {
            // Mark as static via a workaround - set data attribute equivalent
            elastica.isStatic[i] = true
          }
        }
        // Set mass and restitution if specified
        if (p.mass !== undefined) {
          elastica.masses[i] = p.mass
        }
        if (p.restitution !== undefined) {
          elastica.restitutions[i] = p.restitution
        }
      })

      elastica.initialCondition(elements, containerRect, () => {
        // Apply particle-specific properties after dimensions are set
        particles.forEach((p, i) => {
          if (p.isStatic) {
            elastica.isStatic[i] = true
          }
          if (p.mass !== undefined) {
            elastica.setMass(i, p.mass)
          }
          if (p.restitution !== undefined) {
            elastica.setRestitution(i, p.restitution)
          }
        })

        // Call user's initialCondition callback
        initialConditionRef.current?.({
          boxes: elements,
          positions: elastica.positions,
          velocities: elastica.velocities,
          container: containerRect,
          useOBB: elastica.useOBB,
          angles: elastica.angles,
          angularVelocities: elastica.angularVelocities,
          masses: elastica.masses,
          momentsOfInertia: elastica.momentsOfInertia,
          restitutions: elastica.restitutions,
          isStatic: elastica.isStatic,
          displayScales: elastica.displayScales,
        })
      })
      initializedRef.current = true
    }

    // Cap delta time to prevent physics explosion
    const cappedDeltaTime = Math.min(deltaTime, 100)

    // Run physics update
    elastica.update(elements, () => {
      updateRef.current?.({
        boxes: elements,
        positions: elastica.positions,
        velocities: elastica.velocities,
        externalForces: elastica.externalForces,
        container: containerRect,
        useOBB: elastica.useOBB,
        angles: elastica.angles,
        angularVelocities: elastica.angularVelocities,
        masses: elastica.masses,
        momentsOfInertia: elastica.momentsOfInertia,
        restitutions: elastica.restitutions,
        isStatic: elastica.isStatic,
        displayScales: elastica.displayScales,
        deltaTime: cappedDeltaTime,
        hash: elastica.hash,
        gridSize: elastica.gridSize,
        bounced: elastica.bounced,
      })
    })

    // Render to canvas
    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, containerRect.width, containerRect.height)

    // Batched render - package handles all transforms
    renderBatched(ctx, particles, elastica.positions, elastica.angles)

    if (showHashGrid) {
      renderHashGrid(ctx, elastica.gridSize, containerRect)
    }

    ctx.restore()
  })

  // Stable registration functions - must not change to avoid re-registration
  const registerParticle = useCallback(
    (data: Omit<CanvasParticleData, 'index'>) => {
      const index = nextIndexRef.current++
      particlesRef.current.set(index, { ...data, index })
      initializedRef.current = false // Force re-initialization
      return index
    },
    []
  )

  const unregisterParticle = useCallback((index: number) => {
    particlesRef.current.delete(index)
    initializedRef.current = false // Force re-initialization
  }, [])

  const updateParticle = useCallback(
    (index: number, data: Partial<CanvasParticleData>) => {
      const existing = particlesRef.current.get(index)
      if (existing) {
        particlesRef.current.set(index, { ...existing, ...data })
      }
    },
    []
  )

  // Context value - functions are stable via useCallback
  const contextValue: CanvasElasticaContextValue = {
    elastica: elasticaRef.current!,
    container: containerRect,
    mode: 'canvas' as const,
    registerParticle,
    unregisterParticle,
    updateParticle,
  }

  return (
    <div
      ref={setContainerRef}
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', ...style }}
    >
      <ElasticaContext.Provider value={contextValue}>
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
        {children}
      </ElasticaContext.Provider>
    </div>
  )
}
