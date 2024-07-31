'use client'

import { useDrag } from '@use-gesture/react'
import { useCallback, useRef } from 'react'
import ReactElastica, {
  AxisAlignedBoundaryBox,
  initalConditionsPresets,
  useElastica,
} from '../../../../../../dist/elastica-react.mjs'
import s from './example.module.scss'

const data = [
  { name: 'Guido' },
  { name: 'Franco' },
  { name: 'Lea' },
  { name: 'Felix' },
  { name: 'Clément' },
  { name: 'Fermin' },
]

const members = [...data, ...data, ...data, ...data]

const stVels = members.map(() => [0.25 + 0.1 * Math.random(), 0])
const dumping = -0.001

export function Example2() {
  const isHovered = useRef(members.map(() => false))

  return (
    <section className={s.example}>
      <ReactElastica
        config={{
          gridSize: 8,
          collisions: true,
          borders: 'periodic',
          containerOffsets: {
            top: -0.25,
            bottom: 0.25,
            left: -0.2,
            right: 0.2,
          },
        }}
        initialCondition={initalConditionsPresets.random}
        update={({
          boxes,
          positions,
          velocities,
          externalForces,
          deltaTime,
        }) => {
          boxes.forEach((_, index) => {
            let velocity = velocities[index]
            let position = positions[index]
            let draggin = externalForces[index]
            const stVel = stVels[index]

            if (isHovered.current[index]) {
              velocities[index] = velocity.map(
                (v, i) => v + deltaTime * dumping * (v - 4 * draggin[i]),
              )
            } else {
              velocities[index] = velocity.map(
                (v, i) =>
                  v + deltaTime * dumping * (v - 4 * draggin[i] + stVel[i]),
              )
            }

            positions[index] = position = position.map(
              (pos, i) => pos + velocity[i] * deltaTime,
            )

            externalForces[index] = [0, 0]
          })
        }}
      >
        {members.map(({ name }, index) => (
          <Item key={index} name={name} index={index} isHovered={isHovered} />
        ))}
      </ReactElastica>
    </section>
  )
}

function Item({ name, index, isHovered }) {
  const { elastica } = useElastica()

  const onDragStop = useCallback(
    (newDir) => {
      const { externalForces } = elastica

      let norm = newDir.map((pos) => pos * pos).reduce((a, b) => a + b)
      norm = Math.sqrt(norm)

      if (norm === 0) return

      externalForces[index] = newDir.map((pos) => pos / norm)
    },
    [elastica],
  )

  const bind = useDrag(({ down, movement: [mx, my] }) => {
    if (down) {
      onDragStop([mx, my])
    }
  })

  return (
    <AxisAlignedBoundaryBox key={index} className={s.wrapper} {...bind()}>
      <div
        className={s.item}
        onMouseEnter={({ target }) => {
          isHovered.current[index] = true
          target.classList.toggle(s.grabbed, true)
        }}
        onMouseLeave={({ target }) => {
          isHovered.current[index] = false
          target.classList.toggle(s.grabbed, false)
        }}
      >
        {name}
      </div>
    </AxisAlignedBoundaryBox>
  )
}
