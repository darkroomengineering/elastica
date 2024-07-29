import { useFrame, useRect } from '@darkroom.engineering/hamo'
import { useDrag } from '@use-gesture/react'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import ElasticCollision from '../../engine/dist/elastic-collisions.mjs'
import { isEmptyArray } from './utils'

const ElasticCollisionContext = createContext({})

function useElasticCollision() {
  return useContext(ElasticCollisionContext)
}

function ReactElasticCollision({
  children,
  className,
  config = {
    gridSize: 8,
    collisions: false,
    borders: 'rigid',
    containerOffsets: {
      top: 0,
      bottom: 1,
      left: 0,
      right: 1,
    },
  },
  setup = () => {},
  update = () => {},
}) {
  const boxesRefs = useRef(new Map())
  const [sectionRectRef, sectionRect] = useRect()
  const [elasticCollision] = useState(() => new ElasticCollision(config))

  const addBox = useCallback((element, slide) => {
    boxesRefs.current.set(element, slide)
  }, [])
  const removeBox = useCallback((element) => {
    boxesRefs.current.delete(element)
  }, [])

  useEffect(() => {
    const boxes = [...boxesRefs.current.values()]

    if (isEmptyArray(boxes)) return

    if (boxes.some(({ rect }) => !rect)) return

    elasticCollision.setup(boxes, sectionRect, (instances) =>
      setup({ boxes, ...instances })
    )
  }, [elasticCollision, sectionRect, setup])

  useFrame((_, deltaTime) => {
    const boxes = [...boxesRefs.current.values()]

    elasticCollision.update(boxes, (instance) => {
      update({ boxes, ...instance, deltaTime })

      boxes.forEach((element, index) => {
        const position = instance.positions[index]
        const dimensions = instance.dimensions[index]

        instance?.setPosition(element?.element, {
          // shift centers element to center of mass
          x: position[0] - dimensions[0],
          y: position[1],
        })
      })
    })
  })

  return (
    <div
      className={className}
      ref={sectionRectRef}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      <ElasticCollisionContext.Provider value={{ addBox, removeBox }}>
        {children}
      </ElasticCollisionContext.Provider>
    </div>
  )
}

function CollisionBox({
  className,
  children,
  onDragStop = () => {},
  ...props
}) {
  const { addBox, removeBox } = useElasticCollision()
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

  const bind = useDrag(({ down, movement: [mx, my] }) => {
    if (down) {
      onDragStop([mx, my])
    }
  })

  return (
    <div
      ref={(node) => {
        elementRef.current = node
        setRectRef(node)
      }}
      className={className}
      {...props}
    >
      <div {...bind()}>{children}</div>
    </div>
  )
}

export default ReactElasticCollision
export { CollisionBox, useElasticCollision }
