'use client'

import { adjustArrayLength } from 'libs/utils'
import { useEffect, useState } from 'react'
import { Pane } from 'tweakpane'
import ReactElastica, {
  AxisAlignedBoundaryBox,
  initalConditionsPresets,
} from '../../../../../../dist/elastica-react.mjs'
import s from './example.module.scss'

const paneParams = {
  collisions: true,
  borders: 'rigid',
  speed: 1,
}

export function Example1({ data }) {
  const params = useTweakpane(paneParams)

  return (
    <section className={s.example}>
      <ReactElastica
        config={params}
        initialCondition={initalConditionsPresets.random}
        update={({ boxes, positions, velocities, bounced, deltaTime }) => {
          boxes.forEach(({ element }, index) => {
            positions[index] = positions[index].map(
              (pos, i) => pos + params.speed * velocities[index][i] * deltaTime,
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
        {adjustArrayLength(data, 12).map(({ name }, index) => (
          <AxisAlignedBoundaryBox key={index} className={s.item}>
            {name}
          </AxisAlignedBoundaryBox>
        ))}
      </ReactElastica>
    </section>
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
      .addBinding(paneParams, 'speed', {
        label: 'speed',
        min: 0.01,
        max: 5,
        step: 0.001,
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          speed: ev.value,
        }))
      })

    return () => {
      pane.dispose()
    }
  }, [])

  return params
}
