import Elastica, {
  type ElasticaConfigOBB,
  type ElementData
} from '@darkroom.engineering/elastica'
import { useFrame, useRect } from '@darkroom.engineering/hamo'
import {
  createContext,
  forwardRef,
  memo,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react'
import {
  dragForcePresetsLib,
  initalConditionsPresets,
  updatePresets,
  type InitialConditionParams,
  type UpdateParams,
} from './presets'
import { HashGrid, isEmptyArray, useJavascriptEnable } from './utils'

// Re-export types from engine for consumers
export type {
  Container, ElasticaConfigOBB, ElementData, Vector2D
} from '@darkroom.engineering/elastica'
export type {
  InitialConditionParams,
  UpdateParams
} from './presets'
export {
  BoundaryBox,
  // Deprecated alias for backwards compatibility
  BoundaryBox as AxisAlignedBoundaryBox,
  dragForcePresetsLib,
  initalConditionsPresets,
  updatePresets,
  useElastica
}

type ElasticaContextValue = {
  addBox: (element: HTMLElement, slide: ElementData) => void
  removeBox: (element: HTMLElement) => void
  elastica: Elastica
}

const ElasticaContext = createContext<ElasticaContextValue | null>(null)

function useElastica(): ElasticaContextValue {
  const context = useContext(ElasticaContext)
  if (!context) {
    throw new Error('useElastica must be used within a ReactElastica provider')
  }
  return context
}

export type ReactElasticaRef = {
  play: () => void
  pause: () => void
}

export type ReactElasticaProps = {
  children?: ReactNode
  className?: string
  config?: ElasticaConfigOBB
  initialCondition?: (params: InitialConditionParams) => void
  update?: (params: UpdateParams) => void
  showHashGrid?: boolean
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
}

const ReactElastica = forwardRef<ReactElasticaRef, ReactElasticaProps>(
  function ReactElastica(
    {
      children,
      className,
      config,
      initialCondition = () => {},
      update = () => {},
      showHashGrid = false,
    },
    ref
  ) {
    const timeRef = useRef(0)
    const isPausedRef = useRef(false)
    const boxesRefs = useRef(new Map<HTMLElement, ElementData>())
    const [sectionRectRef, sectionRect] = useRect()
    const [javascriptEnable, setJavascriptEnable] = useJavascriptEnable()

    // Memoize config to prevent unnecessary engine recreation
    // Only recreate when actual config values change, not object reference
    const stableConfig = useMemo<ElasticaConfigOBB>(() => ({
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
    }), [
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
    ])

    const [elastica, setElastica] = useState(() => new Elastica(stableConfig))

    // Store callbacks in refs to avoid effect re-runs when they change
    const initialConditionRef = useRef(initialCondition)
    const updateRef = useRef(update)

    // Keep refs up to date
    useEffect(() => {
      initialConditionRef.current = initialCondition
    }, [initialCondition])

    useEffect(() => {
      updateRef.current = update
    }, [update])

    useEffect(() => {
      setElastica(new Elastica(stableConfig))
    }, [stableConfig])

    const addBox = useCallback((element: HTMLElement, slide: ElementData) => {
      boxesRefs.current.set(element, slide)
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

    // Set initial conditions - only re-run when elastica or sectionRect changes
    useEffect(() => {
      const boxes = [...boxesRefs.current.values()]

      if (isEmptyArray(boxes) || boxes.some(({ rect }) => !rect)) return

      elastica.initialCondition(boxes, sectionRect, (instances) =>
        initialConditionRef.current({ boxes, ...instances })
      )
    }, [elastica, sectionRect])

    // Update simulation
    useFrame((time: number) => {
      if (isPausedRef.current) return

      if (!javascriptEnable) {
        timeRef.current = time
        setJavascriptEnable(true)
      }

      const boxes = [...boxesRefs.current.values()]
      const deltaTime = Math.min(time - timeRef.current, 100)
      timeRef.current = time

      elastica.update(boxes, (instance) => {
        updateRef.current({
          boxes,
          ...instance,
          deltaTime,
          hash: instance.hash,
          gridSize: instance.gridSize,
          bounced: instance.bounced,
          isStatic: instance.isStatic
        })
      })
    })

    useImperativeHandle(ref, () => ({
      play,
      pause,
    }))

    return (
      <div
        className={className}
        ref={sectionRectRef as RefObject<HTMLDivElement>}
        style={{ position: 'relative', width: '100%', height: '100%' }}
      >
        <ElasticaContext.Provider value={{ addBox, removeBox, elastica }}>
          {children}
          {showHashGrid && <HashGrid gridSize={elastica.gridSize} />}
        </ElasticaContext.Provider>
      </div>
    )
  }
)

ReactElastica.displayName = 'ReactElastica'

export type BoundaryBoxProps = HTMLAttributes<HTMLDivElement>

/** @deprecated Use BoundaryBoxProps instead */
export type AxisAlignedBoundaryBoxProps = BoundaryBoxProps

const BoundaryBox = memo(function BoundaryBox({
  className,
  children,
  ...props
}: BoundaryBoxProps) {
  const context = useElastica()
  const [setRectRef, rect] = useRect()
  const elementRef = useRef<HTMLDivElement | null>(null)
  const elementDataRef = useRef<ElementData | null>(null)

  // Register element once on mount, cleanup on unmount
  useEffect(() => {
    const element = elementRef.current
    if (!element || !context) return

    // Create element data object that will be mutated with rect updates
    const elementData: ElementData = {
      element,
      rect,
    }
    elementDataRef.current = elementData
    context.addBox(element, elementData)

    return () => {
      context.removeBox(element)
      elementDataRef.current = null
    }
    // Only depend on context, not rect - we update rect separately
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context])

  // Update rect in place without re-registering
  useEffect(() => {
    if (elementDataRef.current && rect) {
      // Mutate the existing element data to update rect
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

export default ReactElastica

