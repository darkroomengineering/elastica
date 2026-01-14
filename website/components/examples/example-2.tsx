'use client'

import ReactElastica, {
  AxisAlignedBoundaryBox,
  initalConditionsPresets,
  useElastica,
  type ReactElasticaRef,
  type UpdateParams,
} from '@elastica'
import { useDrag } from '@use-gesture/react'
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
}

const initialParams: Example2Params = {
  gridSize: 5,
  collisions: true,
  borders: 'periodic',
  useOBB: false,
  velocity: {
    x: 0.3,
    y: 0,
  },
  dumpingFactor: 0.001,
  play: true,
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

interface ItemProps {
  name: string
  index: number
  isHovered: React.MutableRefObject<boolean[]>
}

function Item({ name, index, isHovered }: ItemProps) {
  const context = useElastica()

  const onDragStop = useCallback(
    (newDir: number[]) => {
      if (!context) return
      const { elastica } = context
      const { externalForces } = elastica

      let norm = newDir.map((pos) => pos * pos).reduce((a, b) => a + b)
      norm = Math.sqrt(norm)

      if (norm === 0) return

      externalForces[index] = newDir.map((pos) => pos / norm) as [
        number,
        number,
      ]
    },
    [context, index]
  )

  const bind = useDrag(({ down, movement: [mx, my] }) => {
    if (down) {
      onDragStop([mx, my])
    }
  })

  return (
    <AxisAlignedBoundaryBox className="absolute inset-0 w-fit h-fit select-none cursor-grab touch-none" {...bind()}>
      <div
        className="text-primary bg-secondary dr-p-8 dr-rounded-12 data-[grabbed=true]:text-secondary data-[grabbed=true]:bg-white"
        onMouseEnter={({ target }) => {
          isHovered.current[index] = true
          ;(target as HTMLElement).dataset.grabbed = 'true'
        }}
        onMouseLeave={({ target }) => {
          isHovered.current[index] = false
          ;(target as HTMLElement).dataset.grabbed = 'false'
        }}
      >
        {name}
      </div>
    </AxisAlignedBoundaryBox>
  )
}

export function Example2({ data }: Example2Props) {
  const elasticaRef = useRef<ReactElasticaRef>(null)
  const [items] = useState(() => adjustArrayLength(data, 18))
  const isHovered = useRef(items.map(() => false))
  const params = useTweakpane(initialParams, (value) => {
    if (value) {
      elasticaRef.current?.play()
    } else {
      elasticaRef.current?.pause()
    }
  })

  return (
    <section className="fixed h-full w-full">
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
          boxes.forEach((_, index) => {
            const velocity = velocities[index]
            const position = positions[index]
            const draggin = externalForces[index]
            if (!velocity || !position || !draggin) return

            const stVel = [params.velocity.x, -params.velocity.y]

            if (isHovered.current[index]) {
              velocities[index] = velocity.map(
                (v, i) =>
                  v -
                  deltaTime * params.dumpingFactor * (v - 4 * (draggin[i] ?? 0))
              ) as [number, number]
            } else {
              velocities[index] = velocity.map(
                (v, i) =>
                  v -
                  deltaTime *
                    params.dumpingFactor *
                    (v - 4 * (draggin[i] ?? 0) + (stVel[i] ?? 0))
              ) as [number, number]
            }

            positions[index] = position.map(
              (pos, i) => pos + (velocity[i] ?? 0) * deltaTime
            ) as [number, number]

            externalForces[index] = [0, 0]
          })
        }}
      >
        {items.map(({ name }, index) => (
          <Item key={index} name={name} index={index} isHovered={isHovered} />
        ))}
      </ReactElastica>
    </section>
  )
}
