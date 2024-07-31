'use client'

import { useDrag } from '@use-gesture/react'
import { adjustArrayLength } from 'libs/utils'
import { useCallback, useEffect, useState } from 'react'
import { Pane } from 'tweakpane'
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

const paneParams = {
  collisions: true,
  borders: 'rigid',
  dumpingFactor: 0.001,
}

export function Example3({ data }) {
  const params = useTweakpane(paneParams)

  return (
    <section className={s.example}>
      <ReactElastica
        config={params}
        initialCondition={initalConditionsPresets.random}
        update={({
          boxes,
          positions,
          velocities,
          externalForces,
          deltaTime,
        }) => {
          boxes.forEach((_, index) => {
            let draggin = externalForces[index]

            velocities[index] = velocities[index].map(
              (v, i) =>
                v - deltaTime * params.dumpingFactor * (v - 4 * draggin[i]),
            )

            positions[index] = positions[index].map(
              (pos, i) => pos + velocities[index][i] * deltaTime,
            )

            externalForces[index] = [0, 0]
          })
        }}
      >
        {adjustArrayLength(data, 24).map(({ name }, index) => (
          <Item key={index} name={name} index={index} />
        ))}
      </ReactElastica>
    </section>
  )
}

function Item({ name, index }) {
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
    if (down && onDragStop) {
      onDragStop([mx, my])
    }
  })

  return (
    <AxisAlignedBoundaryBox key={index} className={s.wrapper} {...bind()}>
      <div
        className={s.item}
        onMouseEnter={({ target }) => {
          target.classList.toggle(s.grabbed, true)
        }}
        onMouseLeave={({ target }) => {
          target.classList.toggle(s.grabbed, false)
        }}
      >
        {name}
      </div>
    </AxisAlignedBoundaryBox>
  )
}

const useTweakpane = (paneParams) => {
  const [params, setParams] = useState(paneParams)

  useEffect(() => {
    const pane = new Pane()

    pane
      .addBinding(paneParams, 'collisions', {
        label: 'Collisions',
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          collisions: ev.value,
        }))
      })

    pane
      .addBinding(paneParams, 'borders', {
        label: 'Borders',
        options: { rigid: 'rigid', periodic: 'periodic' },
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          borders: ev.value,
        }))
      })

    pane
      .addBinding(paneParams, 'dumpingFactor', {
        label: 'Dumping Factor',
        min: 0.0001,
        max: 0.01,
        step: 0.0001,
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          dumpingFactor: ev.value,
        }))
      })

    return () => {
      pane.dispose()
    }
  }, [])

  return params
}
