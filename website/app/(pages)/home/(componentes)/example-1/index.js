'use client'

import { adjustArrayLength } from 'libs/utils'
import { useEffect, useRef, useState } from 'react'
import { Pane } from 'tweakpane'
import ReactElastica, {
  AxisAlignedBoundaryBox,
  initalConditionsPresets,
} from '../../../../../../dist/elastica-react.mjs'
import s from './example.module.scss'

const paneParams = {
  gridSize: 5,
  showHashGrid: false,
  collisions: true,
  useOBB: false,
  borders: 'rigid',
  speed: 1,
  play: true,
}

export function Example1({ data }) {
  const elasticaRef = useRef(null)
  const params = useTweakpane(paneParams, (value) => {
    if (value) {
      elasticaRef.current.play()
    } else {
      elasticaRef.current.pause()
    }
  })

  return (
    <section className={s.example}>
      <ReactElastica
        showHashGrid={params.showHashGrid}
        config={params}
        initialCondition={initalConditionsPresets.random}
        update={({
          boxes,
          positions,
          velocities,
          bounced,
          deltaTime,
          hash,
        }) => {
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

            if (params.showHashGrid) {
              element.textContent = 'elastica-' + hash[index]
            }
          })
        }}
        ref={elasticaRef}
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

function useTweakpane(paneParams, callback) {
  const [params, setParams] = useState(paneParams)

  useEffect(() => {
    const pane = new Pane()

    pane
      .addBinding(paneParams, 'showHashGrid', {
        label: 'Show Hash Grid',
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          showHashGrid: ev.value,
        }))
      })

    pane
      .addBinding(paneParams, 'gridSize', {
        label: 'Grid Size',
        min: 1,
        max: 10,
        step: 1,
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          gridSize: parseInt(ev.value),
        }))
      })

    pane
      .addBinding(paneParams, 'useOBB', {
        label: 'Use OBB',
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          useOBB: ev.value,
        }))
      })

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

    pane
      .addBinding(paneParams, 'play', {
        label: 'Play',
      })
      .on('change', (ev) => {
        callback(ev.value)
      })

    return () => {
      pane.dispose()
    }
  }, [])

  return params
}
