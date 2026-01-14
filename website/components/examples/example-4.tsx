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

interface Example4Props {
  data: Array<{ name: string }>
}

interface Example4Params {
  gridSize: number
  collisions: boolean
  borders: 'rigid' | 'periodic'
  useOBB: boolean
  thrustPower: number
  noiseStrength: number
  play: boolean
}

const initialParams: Example4Params = {
  gridSize: 5,
  collisions: true,
  borders: 'periodic',
  useOBB: true,
  thrustPower: 0.3,
  noiseStrength: 1,
  play: true,
}

function useTweakpane(
  paneParams: Example4Params,
  callback: (value: boolean) => void
) {
  const [params, setParams] = useState(paneParams)

  useEffect(() => {
    const pane = new Pane()
    const localParams = { ...paneParams }

    pane
      .addBinding(localParams, 'thrustPower', {
        label: 'Thrust Power',
        min: 0,
        max: 1,
        step: 0.01,
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          thrustPower: ev.value,
        }))
      })

    pane
      .addBinding(localParams, 'noiseStrength', {
        label: 'Noise Strength',
        min: 0,
        max: 2,
        step: 0.01,
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          noiseStrength: ev.value,
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

export function Example4({ data }: Example4Props) {
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
        config={params}
        initialCondition={initalConditionsPresets.randomOBB}
        update={({
          boxes,
          positions,
          velocities,
          angles,
          bounced,
          deltaTime,
        }: UpdateParams & { bounced: number[] }) => {
          boxes.forEach(({ element }, index) => {
            const position = positions[index]
            const velocity = velocities[index]
            const angle = angles[index]
            if (!position || !velocity || angle === undefined) return

            // Add angular noise to the propulsion angle
            const angularNoise = (Math.random() - 0.5) * params.noiseStrength
            const noisyAngle = angle + angularNoise

            // Calculate thrust direction based on the noisy angle (main axis + angular variation)
            const thrustDirection: [number, number] = [
              Math.cos(noisyAngle),
              Math.sin(noisyAngle)
            ]

            // Self-propulsion displacement along the noisy angle
            const thrust: [number, number] = [
              thrustDirection[0] * params.thrustPower * deltaTime,
              thrustDirection[1] * params.thrustPower * deltaTime,
            ]

            // Direct position update: position += thrust
            const newPosition: [number, number] = [
              position[0] + thrust[0],
              position[1] + thrust[1],
            ]

            // Update velocity based on actual displacement (for collision system)
            if (deltaTime > 0) {
              const displacement: [number, number] = [
                newPosition[0] - position[0],
                newPosition[1] - position[1],
              ]
              
              velocities[index] = [
                displacement[0] / deltaTime ,
                displacement[1] / deltaTime ,
              ]
            }

            positions[index] = newPosition

            // Visual feedback for collisions
            const bounce = bounced[index]
            if (element) {
              if (bounce !== undefined && bounce % 2 !== 0) {
                element.dataset.bounced = 'true'
              } else {
                element.dataset.bounced = 'false'
              }
            }
          })
        }}
        ref={elasticaRef}
      >
        {adjustArrayLength(data, 32).map(({ name }, index) => (
          <AxisAlignedBoundaryBox
            key={index}
            className={cn(
              'absolute inset-0 w-fit h-fit bg-contrast dr-rounded-12 dr-p-8',
           
            )}
          >
            {name}
          </AxisAlignedBoundaryBox>
        ))}
      </ReactElastica>
    </section>
  )
}
