'use client'

import type { ElasticaConfigOBB, ElementData } from '@darkroom.engineering/elastica'
import Elastica, {
  createAccumulator,
  accumulateTime,
  type PhysicsAccumulator,
} from '@darkroom.engineering/elastica'
import { useFrame, useRect } from '@darkroom.engineering/hamo'
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react'
import { ElasticaContext, type DomElasticaContextValue } from '../context'
import type { InitialConditionParams, UpdateParams } from '../types'
import { HashGrid, isEmptyArray, useJavascriptEnable } from '../utils'
import { injectElasticaStyles, renderElement } from './renderer'

export type DomElasticaRef = {
  play: () => void
  pause: () => void
}

export type DomElasticaProps = {
  children?: ReactNode
  className?: string
  config?: ElasticaConfigOBB
  initialCondition?: (params: InitialConditionParams) => void
  update?: (params: UpdateParams) => void
  showHashGrid?: boolean
  ref?: Ref<DomElasticaRef>
}

// Default config values
const DEFAULT_CONFIG: ElasticaConfigOBB = {
  gridSize: 8,
  collisions: true,
  borders: 'rigid',
  useOBB: true,
  containerOffsets: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  solver: {
    slop: 0.5,
    percent: 0.8,
    fixedDeltaTime: 16.67,
  },
}

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

export function DomElastica({
  children,
  className,
  config,
  initialCondition = () => {},
  update = () => {},
  showHashGrid = false,
  ref,
}: DomElasticaProps) {
    const timeRef = useRef(0)
    const isPausedRef = useRef(false)
    const boxesRefs = useRef(new Map<HTMLElement, ElementData>())
    const accumulatorRef = useRef<PhysicsAccumulator | null>(null)
    const [sectionRectRef, sectionRect] = useRect()
    const [javascriptEnable, setJavascriptEnable] = useJavascriptEnable()

    // Memoize config to prevent unnecessary engine recreation
    const stableConfig = useMemo<ElasticaConfigOBB>(
      () => ({
        gridSize: config?.gridSize ?? DEFAULT_CONFIG.gridSize,
        collisions: config?.collisions ?? DEFAULT_CONFIG.collisions,
        borders: config?.borders ?? DEFAULT_CONFIG.borders,
        useOBB: config?.useOBB ?? DEFAULT_CONFIG.useOBB,
        containerOffsets: {
          top: config?.containerOffsets?.top ?? DEFAULT_CONFIG.containerOffsets?.top ?? 0,
          bottom: config?.containerOffsets?.bottom ?? DEFAULT_CONFIG.containerOffsets?.bottom ?? 0,
          left: config?.containerOffsets?.left ?? DEFAULT_CONFIG.containerOffsets?.left ?? 0,
          right: config?.containerOffsets?.right ?? DEFAULT_CONFIG.containerOffsets?.right ?? 0,
        },
        defaultMass: config?.defaultMass,
        defaultRestitution: config?.defaultRestitution,
        solver: {
          slop: config?.solver?.slop ?? DEFAULT_CONFIG.solver?.slop,
          percent: config?.solver?.percent ?? DEFAULT_CONFIG.solver?.percent,
          fixedDeltaTime: config?.solver?.fixedDeltaTime ?? DEFAULT_CONFIG.solver?.fixedDeltaTime,
        },
      }),
      [
        config?.gridSize,
        config?.collisions,
        config?.borders,
        config?.useOBB,
        config?.containerOffsets?.top,
        config?.containerOffsets?.bottom,
        config?.containerOffsets?.left,
        config?.containerOffsets?.right,
        config?.defaultMass,
        config?.defaultRestitution,
        config?.solver?.slop,
        config?.solver?.percent,
        config?.solver?.fixedDeltaTime,
      ]
    )

    const [elastica, setElastica] = useState(() => new Elastica(stableConfig))

    // Store callbacks in refs to avoid effect re-runs
    const initialConditionRef = useRef(initialCondition)
    const updateRef = useRef(update)

    useEffect(() => {
      initialConditionRef.current = initialCondition
    }, [initialCondition])

    useEffect(() => {
      updateRef.current = update
    }, [update])

    useEffect(() => {
      const newElastica = new Elastica(stableConfig)
      setElastica(newElastica)
      accumulatorRef.current = createAccumulator(newElastica.fixedDeltaTime)
      // Inject CSS styles for DOM rendering
      injectElasticaStyles()
    }, [stableConfig])

    const addBox = useCallback((element: HTMLElement, data: ElementData) => {
      boxesRefs.current.set(element, data)
    }, [])

    const removeBox = useCallback((element: HTMLElement) => {
      boxesRefs.current.delete(element)
    }, [])

    const play = useCallback(() => {
      isPausedRef.current = false
    }, [])

    const pause = useCallback(() => {
      isPausedRef.current = true
    }, [])

    // Set initial conditions
    useEffect(() => {
      const boxes = [...boxesRefs.current.values()]

      if (isEmptyArray(boxes) || boxes.some(({ rect }) => !rect)) return

      elastica.initialCondition(boxes, sectionRect, (instances) =>
        initialConditionRef.current({ boxes, ...instances })
      )
    }, [elastica, sectionRect])

    // Update simulation
    useFrame((time: number, deltaTime: number) => {
      if (isPausedRef.current) return

      if (!javascriptEnable) {
        timeRef.current = time
        setJavascriptEnable(true)
      }

      const boxes = [...boxesRefs.current.values()]
      timeRef.current = time

      // Accumulate time and run physics at fixed rate
      const accumulator = accumulatorRef.current
      if (!accumulator) return

      const steps = accumulateTime(accumulator, deltaTime)
      for (let i = 0; i < steps; i++) {
        // Pass render callback only on last step (render once per frame)
        const isLastStep = i === steps - 1
        elastica.update(
          boxes,
          (instance) => {
            updateRef.current({
              boxes,
              ...instance,
              deltaTime: instance.fixedDeltaTime,
              hash: instance.hash,
              gridSize: instance.gridSize,
              bounced: instance.bounced,
              isStatic: instance.isStatic,
            })
          },
          isLastStep
            ? (index, x, y, angle, scale) => {
                const element = boxes[index]?.element
                if (element) {
                  renderElement(element, x, y, angle, scale, elastica.calculateCollisions)
                }
              }
            : undefined
        )
      }
    })

    useImperativeHandle(ref, () => ({
      play,
      pause,
    }))

    const contextValue = useMemo<DomElasticaContextValue>(
      () => ({
        addBox,
        removeBox,
        elastica,
        container: sectionRect,
        mode: 'dom' as const,
      }),
      [addBox, removeBox, elastica, sectionRect]
    )

    return (
      <div
        className={className}
        ref={sectionRectRef as RefObject<HTMLDivElement>}
        style={{ position: 'relative', width: '100%', height: '100%' }}
      >
        <ElasticaContext.Provider value={contextValue}>
          {children}
          {showHashGrid && <HashGrid gridSize={elastica.gridSize} />}
        </ElasticaContext.Provider>
      </div>
  )
}
