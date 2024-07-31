'use client'

import ReactElastica, {
  AxisAlignedBoundaryBox,
  initalConditionsPresets,
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

const members = [...data, ...data]

export function Example1() {
  return (
    <section className={s.example}>
      <ReactElastica
        config={{
          gridSize: 8,
          collisions: true,
          borders: 'rigid',
        }}
        initialCondition={initalConditionsPresets.random}
        update={({ boxes, positions, velocities, bounced, deltaTime }) => {
          boxes.forEach(({ element }, index) => {
            positions[index] = positions[index].map(
              (pos, i) => pos + velocities[index][i] * deltaTime,
            )

            const bounce = bounced[index]
            if (bounce % 2 !== 0) {
              element.classList.toggle(s.bounce, true)
            } else {
              element.classList.toggle(s.bounce, false)
            }
          })
        }}
      >
        {members.map(({ name }, index) => (
          <Item key={index} name={name} index={index} />
        ))}
      </ReactElastica>
    </section>
  )
}

function Item({ name, index }) {
  return (
    <AxisAlignedBoundaryBox key={index} className={s.item} index={index}>
      <div>{name}</div>
    </AxisAlignedBoundaryBox>
  )
}
