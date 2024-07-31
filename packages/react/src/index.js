import { useFrame, useRect } from '@darkroom.engineering/hamo'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import Elastica from '../../../dist/elastica.mjs'
import {
  dragForcePresetsLib,
  initalConditionsPresets,
  updatePresets,
} from './presets'
import { isEmptyArray } from './utils'

const ElasticaContext = createContext({})

function useElastica() {
  return useContext(ElasticaContext)
}

function ReactElastica({
  children,
  className,
  config = {
    gridSize: 8,
    collisions: true,
    borders: 'rigid',
    containerOffsets: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
  },
  initialCondition = () => {},
  update = () => {},
}) {
  const boxesRefs = useRef(new Map())
  const [sectionRectRef, sectionRect] = useRect()
  const [elastica] = useState(() => new Elastica(config))
  const timeRef = useRef(0)
  const [javascriptEnable, setJavascriptEnable] = useState(true)

  const addBox = useCallback((element, slide) => {
    boxesRefs.current.set(element, slide)
  }, [])
  const removeBox = useCallback((element) => {
    boxesRefs.current.delete(element)
  }, [])

  useEffect(() => {
    const boxes = [...boxesRefs.current.values()]

    if (isEmptyArray(boxes) || boxes.some(({ rect }) => !rect)) return

    elastica.initialCondition(boxes, sectionRect, (instances) =>
      initialCondition({ boxes, ...instances }),
    )
  }, [elastica, sectionRect])

  useFrame((time) => {
    const boxes = [...boxesRefs.current.values()]

    if (!javascriptEnable) {
      timeRef.current = time
      setJavascriptEnable(true)
    }

    const deltaTime = Math.min(time - timeRef.current, 100)
    timeRef.current = time

    elastica.update(boxes, (instance) => {
      update({ boxes, ...instance, deltaTime })

      boxes.forEach((element, index) => {
        const position = instance.positions[index]
        const dimensions = instance.dimensions[index]

        instance?.setPosition(element?.element, {
          // shift centers element to center of mass
          x: position[0] - dimensions[0],
          y: position[1] - dimensions[1],
        })
      })
    })
  })

  useEffect(() => {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        setJavascriptEnable(false)
      }
    })

    return () => {
      document.removeEventListener('visibilitychange', () => {})
    }
  }, [])

  return (
    <div
      className={className}
      ref={sectionRectRef}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      <ElasticaContext.Provider value={{ addBox, removeBox, elastica }}>
        {children}
      </ElasticaContext.Provider>
    </div>
  )
}

function AxisAlignedBoundaryBox({ className, children, ...props }) {
  const { addBox, removeBox, elastica } = useElastica()
  const [setRectRef, rect] = useRect()
  const elementRef = useRef()

  useEffect(() => {
    if (elementRef.current) {
      addBox(elementRef.current, {
        element: elementRef.current,
        rect,
      })

      return () => {
        removeBox(elementRef.current)
      }
    }
  }, [rect, addBox, removeBox])

  return (
    <div
      ref={(node) => {
        elementRef.current = node
        setRectRef(node)
      }}
      className={className}
      {...props}
    >
      {children}
    </div>
  )
}

export default ReactElastica
export {
  AxisAlignedBoundaryBox,
  dragForcePresetsLib,
  initalConditionsPresets,
  updatePresets,
  useElastica,
}
