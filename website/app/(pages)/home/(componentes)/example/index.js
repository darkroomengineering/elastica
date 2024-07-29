'use client'

import { useRef } from 'react'
import ReactElasticCollision, {
  CollisionBox,
} from '../../../../../../packages/react/dist/elastic-collisions-react.mjs'
import s from './example.module.scss'

const data = [
  { name: 'Guido' },
  { name: 'Franco' },
  { name: 'Lea' },
  { name: 'Felix' },
  { name: 'Clément' },
  { name: 'Fermin' },
]

export function Example() {
  const dragVelocity = useRef([])
  const stVels = useRef([])

  return (
    <section className={s.example}>
      <ReactElasticCollision
        config={{
          gridSize: 8,
          collisions: true,
          borders: 'rigid',
          containerOffsets: {
            top: 0,
            bottom: 1,
            left: 0,
            right: 1,
          },
        }}
        setup={({ boxes, positions, velocities, container }) => {
          boxes.forEach((_, index) => {
            const vel = [
              0.5 * (Math.random() - 0.5),
              0.5 * (Math.random() - 0.5),
            ]

            velocities[index] = vel
            stVels.current[index] = vel

            positions[index] = [
              Math.random() * container.width,
              Math.random() * container.height,
            ]

            dragVelocity.current[index] = [0, 0]
          })
        }}
        update={({ boxes, velocities, positions, deltaTime }) => {
          boxes.forEach((element, index) => {
            let velocity = velocities[index]
            let position = positions[index]
            let draggin = dragVelocity.current[index]

            const flow = [0, -0.5]

            velocity = velocity.map(
              (v, i) => v + deltaTime * -0.001 * (v - 4 * draggin[i] + flow[i]),
            )

            position = position.map((pos, i) => pos + velocity[i] * deltaTime)

            positions[index] = position
            velocities[index] = velocity

            dragVelocity.current[index] = [0, 0]
          })
        }}
      >
        {data.map(({ name }, index) => (
          <CollisionBox
            key={index}
            className={s.item}
            onDragStop={(newDir) => {
              let norm = newDir.map((pos) => pos * pos).reduce((a, b) => a + b)
              norm = Math.sqrt(norm)

              if (norm === 0) return
              dragVelocity.current[index] = newDir.map((pos) => pos / norm)
            }}
          >
            <div>{name}</div>
          </CollisionBox>
        ))}
      </ReactElasticCollision>
    </section>
  )
}
