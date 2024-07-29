'use client'

import { useRef } from 'react'
import ReactElasticCollision, {
  CollisionBox,
  initalConditionsPresets,
  updatePresets,
  useElasticCollision,
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
          borders: 'periodic',
          containerOffsets: {
            top: 0,
            bottom: 0,
            left: -0.2,
            right: 0,
          },
        }}
        initialConditions={initalConditionsPresets.random}
        update={updatePresets.rightFlow}
      >
        {[...data, ...data, ...data].map(({ name }, index) => (
          <Item key={index} name={name} index={index} />
        ))}
      </ReactElasticCollision>
    </section>
  )
}

function Item({ name, index }) {
  const { elasticCollision } = useElasticCollision()

  return (
    <CollisionBox
      key={index}
      className={s.item}
      onDragStop={(newDir, externalForces) => {
        let norm = newDir.map((pos) => pos * pos).reduce((a, b) => a + b)
        norm = Math.sqrt(norm)

        if (norm === 0) return

        externalForces[index] = newDir.map((pos) => pos / norm)
      }}
      index={index}
    >
      <div>{name}</div>
    </CollisionBox>
  )
}
