'use client'

import ReactElasticCollision, {
  CollisionBox,
  initalConditionsPresets,
  updatePresets,
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

const members = [...data, ...data, ...data]

export function Example2() {
  return (
    <section className={s.example}>
      <ReactElasticCollision
        config={{
          gridSize: 8,
          collisions: true,
          borders: 'rigid',
        }}
        initialConditions={initalConditionsPresets.random}
        update={updatePresets.dvdAnimation}
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
