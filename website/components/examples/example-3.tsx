'use client'

import ReactElastica, {
  BoundaryBox,
  initalConditionsPresets,
  type ReactElasticaRef,
  type UpdateParams,
} from '@elastica'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Pane } from 'tweakpane'
import { adjustArrayLength } from '~/utils/array'

interface Example3Props {
  data: Array<{ name: string }>
}

interface Example3Params {
  gridSize: number
  collisions: boolean
  borders: 'rigid' | 'periodic'
  useOBB: boolean
  thrustPower: number
  steeringSpeed: number
  noiseStrength: number
  play: boolean
}

const initialParams: Example3Params = {
  gridSize: 5,
  collisions: true,
  borders: 'periodic',
  useOBB: true,
  thrustPower: 0.3,
  steeringSpeed: 0.05,
  noiseStrength: 0.1,
  play: true,
}

interface ItemProps {
  name: string
  index: number
}

function Item({ name }: ItemProps) {
  return (
    <BoundaryBox className="absolute inset-0 w-fit h-fit select-none">
      <div className="text-primary bg-secondary dr-p-8 dr-rounded-12">
        {name}
      </div>
    </BoundaryBox>
  )
}

export function Example3({ data }: Example3Props) {
  const elasticaRef = useRef<ReactElasticaRef>(null)
  const [cursorPosition, setCursorPosition] = useState<[number, number]>([0, 0])
  
  const params = useTweakpane(initialParams, (value) => {
    if (value) {
      elasticaRef.current?.play()
    } else {
      elasticaRef.current?.pause()
    }
  })

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setCursorPosition([e.clientX, e.clientY])
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  return (
    <section className="fixed h-full w-full">
      <ReactElastica
        ref={elasticaRef}
        config={params}
        initialCondition={initalConditionsPresets.randomOBB}
        update={({
          boxes,
          positions,
          velocities,
          angles,
          deltaTime,
        }: UpdateParams) => {
          boxes.forEach((_, index) => {
            const position = positions[index]
            const velocity = velocities[index]
            const angle = angles[index]
            if (!position || !velocity || angle === undefined) return

            // Calculate direction to cursor (pack leader)
            const toCursor: [number, number] = [
              cursorPosition[0] - position[0],
              cursorPosition[1] - position[1]
            ]
            
            // Get distance to cursor
            const distToCursor = Math.sqrt(toCursor[0] ** 2 + toCursor[1] ** 2)
            
            // Normalize direction
            const directionToCursor: [number, number] = distToCursor > 0 
              ? [toCursor[0] / distToCursor, toCursor[1] / distToCursor]
              : [0, 0]

            // Calculate desired angle (angle toward cursor)
            const desiredAngle = Math.atan2(directionToCursor[1], directionToCursor[0])
            
            // Smoothly rotate toward desired angle (steering)
            let angleDiff = desiredAngle - angle
            
            // Normalize angle difference to [-π, π]
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI
            
            // Add angular noise for variation
            const angularNoise = (Math.random() - 0.5) * params.noiseStrength
            const steeringAngle = angle + angleDiff * params.steeringSpeed + angularNoise

            angles[index] = steeringAngle

            // Move along the item's current angle (like example-4)
            const thrustDirection: [number, number] = [
              Math.cos(steeringAngle),
              Math.sin(steeringAngle)
            ]

            // Distance-based thrust power (move faster when farther from cursor)
            const minDistance = 100 // Dead zone
            const followStrength = distToCursor > minDistance 
              ? Math.min(distToCursor / 500, 1.0) 
              : 0

            const thrust: [number, number] = [
              thrustDirection[0] * params.thrustPower * followStrength * deltaTime,
              thrustDirection[1] * params.thrustPower * followStrength * deltaTime,
            ]

            // Update position
            const newPosition: [number, number] = [
              position[0] + thrust[0],
              position[1] + thrust[1],
            ]

            // Update velocity for collision system
            if (deltaTime > 0) {
              const displacement: [number, number] = [
                newPosition[0] - position[0],
                newPosition[1] - position[1],
              ]
              
              velocities[index] = [
                displacement[0] / deltaTime,
                displacement[1] / deltaTime,
              ]
            }

            positions[index] = newPosition
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

function useTweakpane(
  paneParams: Example3Params,
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
      .addBinding(localParams, 'steeringSpeed', {
        label: 'Steering Speed',
        min: 0.01,
        max: 0.2,
        step: 0.01,
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          steeringSpeed: ev.value,
        }))
      })

    pane
      .addBinding(localParams, 'noiseStrength', {
        label: 'Noise Strength',
        min: 0,
        max: 1,
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