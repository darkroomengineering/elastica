'use client'

import ReactElastica, {
  AxisAlignedBoundaryBox,
  initalConditionsPresets,
  type ReactElasticaRef,
  type UpdateParams,
} from '@elastica'
import cn from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { Pane } from 'tweakpane'
import { adjustArrayLength } from '~/utils/array'

interface Example1Props {
  data: Array<{ name: string }>
}

interface Example1Params {
  gridSize: number
  showHashGrid: boolean
  collisions: boolean
  useOBB: boolean
  borders: 'rigid' | 'periodic'
  speed: number
  play: boolean
}

const initialParams: Example1Params = {
  gridSize: 5,
  showHashGrid: false,
  collisions: true,
  useOBB: false,
  borders: 'rigid',
  speed: 1,
  play: true,
}

function useTweakpane(
  paneParams: Example1Params,
  callback: (value: boolean) => void
) {
  const [params, setParams] = useState(paneParams)

  useEffect(() => {
    const pane = new Pane()
    const localParams = { ...paneParams }

    pane
      .addBinding(localParams, 'showHashGrid', {
        label: 'Show Hash Grid',
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          showHashGrid: ev.value,
        }))
      })

    pane
      .addBinding(localParams, 'gridSize', {
        label: 'Grid Size',
        min: 1,
        max: 10,
        step: 1,
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          gridSize: Math.floor(ev.value),
        }))
      })

    pane
      .addBinding(localParams, 'useOBB', {
        label: 'Use OBB',
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          useOBB: ev.value,
        }))
      })

    pane
      .addBinding(localParams, 'collisions', {
        label: 'Collisions',
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          collisions: ev.value,
        }))
      })

    pane
      .addBinding(localParams, 'borders', {
        label: 'Borders',
        options: { rigid: 'rigid', periodic: 'periodic' },
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          borders: ev.value as 'rigid' | 'periodic',
        }))
      })

    pane
      .addBinding(localParams, 'speed', {
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
      .addBinding(localParams, 'play', {
        label: 'Play',
      })
      .on('change', (ev) => {
        callback(ev.value)
      })

    return () => {
      pane.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return params
}

export function Example1({ data }: Example1Props) {
  const elasticaRef = useRef<ReactElasticaRef>(null)
  const params = useTweakpane(initialParams, (value) => {
    if (value) {
      elasticaRef.current?.play()
    } else {
      elasticaRef.current?.pause()
    }
  })

  return (
    <section className='fixed inset-0 w-full h-full'>
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
        }: UpdateParams & { bounced: number[]; hash: number[] }) => {
          boxes.forEach(({ element }, index) => {
            const position = positions[index]
            const velocity = velocities[index]
            if (!position || !velocity) return

            positions[index] = position.map(
              (pos, i) => pos + params.speed * (velocity[i] ?? 0) * deltaTime
            ) as [number, number]

            const bounce = bounced[index]
            if (element) {
              if (bounce !== undefined && bounce % 2 !== 0) {
                element.dataset.bounced = 'true'
              } else {
                element.dataset.bounced = 'false'
              }

              if (params.showHashGrid && hash[index] !== undefined) {
                element.textContent = 'elastica-' + hash[index]
              }
            }
          })
        }}
        ref={elasticaRef} 
      >
        {adjustArrayLength(data, 24).map(({ name }, index) => (
          <AxisAlignedBoundaryBox key={index} className={cn('absolute inset-0 w-fit h-fit bg-contrast dr-rounded-12 dr-p-8', 'data-[bounced=true]:bg-secondary data-[bounced=true]:text-primary')}>
            {name}
          </AxisAlignedBoundaryBox>
        ))}
      </ReactElastica>
    </section>
  )
}
