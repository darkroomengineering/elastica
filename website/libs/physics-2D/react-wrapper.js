'use client'

import { useFrame, useRect } from '@darkroom.engineering/hamo'
import { useDrag } from '@use-gesture/react'
import cn from 'clsx'
import gsap from 'gsap'
import { ElasticCollision } from 'libs/physics-2D'
import { isEmptyArray } from 'libs/utils'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import s from './collisions.module.scss'

export function ElasticCollisionWrapper({
  children,
  className,
  config = {
    gridSize: 8,
    collisions: false,
    borders: 'periodic',
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
      setup({ boxes, ...instances }),
    )
  }, [elasticCollision, sectionRect, setup])

  useFrame((_, deltaTime) => {
    const boxes = [...boxesRefs.current.values()]

    elasticCollision.update(boxes, (instance) => {
      update({ boxes, instance, deltaTime })

      boxes.forEach((element, index) => {
        const position = instance.positions[index]
        const dimensions = instance.dimensions[index]

        gsap.set(element?.element, {
          // shift centers element to center of mass
          x: position[0] - dimensions[0],
          y: position[1],
        })
      })
    })
  })

  return (
    <ElasticCollisionContext.Provider value={{ addBox, removeBox }}>
      <div className={cn(s.wrapper, className)} ref={sectionRectRef}>
        {children}
      </div>
    </ElasticCollisionContext.Provider>
  )
}

export function CollisionBox({
  className,
  children,
  onDragStop = () => {},
  ...props
}) {
  const { addBox, removeBox } = useElasticCollisionContext()
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
      className={cn(s.item, className)}
      {...props}
    >
      <div {...bind()}>{children}</div>
    </div>
  )
}

export const ElasticCollisionContext = createContext({})

export function useElasticCollisionContext() {
  return useContext(ElasticCollisionContext)
}
