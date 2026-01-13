import Elastica, {
  type ElasticaConfigOBB,
  type ElementData
} from '@darkroom.engineering/elastica'
import { useFrame, useRect } from '@darkroom.engineering/hamo'
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
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
  AxisAlignedBoundaryBox,
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

function useElastica(): ElasticaContextValue | null {
  return useContext(ElasticaContext)
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

const ReactElastica = forwardRef<ReactElasticaRef, ReactElasticaProps>(
  function ReactElastica(
    {
      children,
      className,
      config = {
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
      },
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
    const [elastica, setElastica] = useState(() => new Elastica(config))

    useEffect(() => {
      setElastica(new Elastica(config))
    }, [config])

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

    // Set initial conditions
    useEffect(() => {
      const boxes = [...boxesRefs.current.values()]

      if (isEmptyArray(boxes) || boxes.some(({ rect }) => !rect)) return

      elastica.initialCondition(boxes, sectionRect, (instances) =>
        initialCondition({ boxes, ...instances })
      )
    }, [elastica, sectionRect, initialCondition])

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
        update({ boxes, ...instance, deltaTime })

        boxes.forEach((element, index) => {
          const position = instance.positions[index]
          const dimensions = instance.dimensions[index]
          const angle = instance.useOBB ? instance.angles[index] : 0

          if (position && dimensions) {
            instance.setPosition(element?.element, {
              x: position[0] - dimensions[0],
              y: position[1] - dimensions[1],
              angle: angle ?? 0,
            })
          }
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

export type AxisAlignedBoundaryBoxProps = HTMLAttributes<HTMLDivElement>

function AxisAlignedBoundaryBox({
  className,
  children,
  ...props
}: AxisAlignedBoundaryBoxProps) {
  const context = useElastica()
  const [setRectRef, rect] = useRect()
  const elementRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (elementRef.current && context) {
      const element = elementRef.current
      context.addBox(element, {
        element,
        rect,
      })

      return () => {
        context.removeBox(element)
      }
    }
  }, [rect, context])

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
}

export default ReactElastica

