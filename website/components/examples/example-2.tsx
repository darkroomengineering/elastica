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

interface Example2Props {
  data: Array<{ name: string }>
}

interface Example2Params {
  gridSize: number
  collisions: boolean
  borders: 'rigid' | 'periodic'
  useOBB: boolean
  velocity: { x: number; y: number }
  dumpingFactor: number
  play: boolean
  influenceRadius: number
  forceStrength: number
}

const initialParams: Example2Params = {
  gridSize: 5,
  collisions: true,
  borders: 'rigid',
  useOBB: true,
  velocity: {
    x: 0,
    y: 0.25,
  },
  dumpingFactor: 0.001,
  play: true,
  influenceRadius: 200,
  forceStrength: 2.0,
}

export function Example2({ data }: Example2Props) {
  const elasticaRef = useRef<ReactElasticaRef>(null)
  const containerRef = useRef<HTMLElement>(null)
  const [items] = useState(() => adjustArrayLength(data, 32))
  const mousePos = useRef<{ x: number; y: number } | null>(null)
  const params = useTweakpane(initialParams, (value) => {
    if (value) {
      elasticaRef.current?.play()
    } else {
      elasticaRef.current?.pause()
    }
  })

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    mousePos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    mousePos.current = null
  }, [])

  return (
    <section
      ref={containerRef}
      className="fixed h-full w-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <ReactElastica
        ref={elasticaRef}
        config={{
          ...params,
        }}
        initialCondition={initalConditionsPresets.random}
        update={({
          boxes,
          positions,
          velocities,
          externalForces,
          deltaTime,
        }: UpdateParams) => {
          const mouse = mousePos.current

          boxes.forEach((_, index) => {
            const velocity = velocities[index]
            const position = positions[index]
            if (!velocity || !position) return

            const stVel = [params.velocity.x, -params.velocity.y]

            // Calculate force based on mouse proximity
            if (mouse) {
              const dx = mouse.x - position[0]
              const dy = mouse.y - position[1]
              const distance = Math.sqrt(dx * dx + dy * dy)

              if (distance < params.influenceRadius && distance > 0) {
                // Calculate repelling force (inverse relationship)
                const forceMagnitude =
                  (params.influenceRadius - distance) / params.influenceRadius
                const forceScale = params.forceStrength

                // Apply force away from cursor
                externalForces[index] = [
                  (-dx / distance) * forceMagnitude * forceScale,
                  (-dy / distance) * forceMagnitude * forceScale,
                ]
              } else {
                externalForces[index] = [0, 0]
              }
            } else {
              externalForces[index] = [0, 0]
            }

            const force = externalForces[index] ?? [0, 0]

            // Update velocities with damping and forces
            velocities[index] = velocity.map(
              (v, i) =>
                v -
                deltaTime *
                  params.dumpingFactor *
                  (v - 4 * (force[i] ?? 0) + (stVel[i] ?? 0))
            ) as [number, number]

            // Update positions
            positions[index] = position.map(
              (pos, i) => pos + (velocity[i] ?? 0) * deltaTime
            ) as [number, number]
          })
        }}
      >
        <BoundaryBox className="text-primary bg-secondary absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 dr-w-400 dr-h-100 select-none flex items-center justify-center dr-text-32" data-state="static" >
        static</BoundaryBox>
        <BoundaryBox className="text-primary bg-secondary absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 dr-w-400 dr-h-100 select-none flex items-center justify-center dr-text-32" data-state="static" >
        static</BoundaryBox>
        {items.map(({ name }, index) => (
         <BoundaryBox key={index} className="absolute inset-0 w-fit h-fit select-none" data-state="dynamic">
          <div className="text-primary bg-secondary dr-p-8 dr-rounded-12">
            {name}
          </div>
         </BoundaryBox>
        ))}
      </ReactElastica>
    </section>
  )
}

function useTweakpane(
  paneParams: Example2Params,
  callback: (value: boolean) => void
) {
  const [params, setParams] = useState(paneParams)

  useEffect(() => {
    const pane = new Pane()
    const localParams = { ...paneParams }

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
      .addBinding(localParams, 'velocity', {
        label: 'Velocity',
        x: { min: -0.5, max: 0.5, step: 0.01 },
        y: { min: -0.5, max: 0.5, step: 0.01 },
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          velocity: ev.value,
        }))
      })

    pane
      .addBinding(localParams, 'dumpingFactor', {
        label: 'Dumping Factor',
        min: 0.0001,
        max: 0.001,
        step: 0.0001,
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          dumpingFactor: ev.value,
        }))
      })

    pane
      .addBinding(localParams, 'influenceRadius', {
        label: 'Influence Radius',
        min: 50,
        max: 400,
        step: 10,
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          influenceRadius: ev.value,
        }))
      })

    pane
      .addBinding(localParams, 'forceStrength', {
        label: 'Force Strength',
        min: 0.5,
        max: 5.0,
        step: 0.1,
      })
      .on('change', (ev) => {
        setParams((prev) => ({
          ...prev,
          forceStrength: ev.value,
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