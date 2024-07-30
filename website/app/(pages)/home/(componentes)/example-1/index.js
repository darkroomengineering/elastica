'use client'

import ReactElasticCollision, {
  CollisionBox,
  initalConditionsPresets,
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

const members = [...data, ...data]

export function Example1() {
  return (
    <section className={s.example}>
      <ReactElasticCollision
        config={{
          gridSize: 8,
          collisions: true,
          borders: 'rigid',
        }}
        initialConditions={initalConditionsPresets.random}
        update={({ boxes, positions, velocities, bounced, deltaTime }) => {
          boxes.forEach(({ element }, index) => {
            positions[index] = positions[index].map(
              (pos, i) => pos + velocities[index][i] * deltaTime,
            )

            const bounce = bounced[index]
            if (bounce % 2 !== 0) {
              element.classList.add(s.bounce)
            } else {
              element.classList.remove(s.bounce)
            }
          })
        }}
      >
        {members.map(({ name }, index) => (
          <Item key={index} name={name} index={index} />
        ))}
      </ReactElasticCollision>
    </section>
  )
}

function Item({ name, index }) {
  return (
    <CollisionBox key={index} className={s.item} index={index}>
      <div>{name}</div>
    </CollisionBox>
  )
}
