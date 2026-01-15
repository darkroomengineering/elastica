'use client'

import ReactElastica, {
  BoundaryBox,
  initalConditionsPresets,
  useElastica,
  type ReactElasticaRef,
  type UpdateParams,
} from '@elastica'
import { useDrag } from '@use-gesture/react'
import cn from 'clsx'
import { useCallback, useEffect, useRef, useState } from 'react'
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

interface ItemProps {
  name: string
  index: number
  className: string
  onHoverChange: (index: number, hovered: boolean) => void
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

const dampingFactor = 0.9

export function Example1({ data }: Example1Props) {
  const elasticaRef = useRef<ReactElasticaRef>(null)
  const [items] = useState(() => adjustArrayLength(data, 24))
  const hoveredItems = useRef(items.map(() => false))
  const params = useTweakpane(initialParams, (value) => {
    if (value) {
      elasticaRef.current?.play()
    } else {
      elasticaRef.current?.pause()
    }
  })

  const handleHoverChange = useCallback((index: number, hovered: boolean) => {
    hoveredItems.current[index] = hovered
  }, [])

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
          externalForces,
          bounced,
          deltaTime,
          hash,
        }: UpdateParams & { bounced: number[]; hash: number[] }) => {
          boxes.forEach(({ element }, index) => {
            velocities[index] = velocities[index]?.map(
              (v, i) => 
                v -
              deltaTime * 100 * (externalForces[index]?.[i] ?? 0)
            ) as [number, number]

            if (hoveredItems.current[index]) {
              velocities[index] = [0, 0]
            }

            externalForces[index] =  externalForces[index]?.map((d) => d - dampingFactor * deltaTime * d) as [number, number]

            positions[index] =  positions[index]?.map(
              (pos, i) => pos + params.speed * (velocities[index]?.[i] ?? 0) * deltaTime
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
        {items.map(({ name }, index) => (
          <DraggableItem 
            key={index} 
            name={name} 
            index={index} 
            className="bg-contrast dr-rounded-12 dr-p-8 data-[bounced=true]:bg-secondary data-[bounced=true]:text-primary"
            onHoverChange={handleHoverChange}
          />
        ))}
      </ReactElastica>
    </section>
  )
}
  
function DraggableItem({ name, index, className, onHoverChange }: ItemProps) {
  const {elastica} = useElastica()
  const [isGrabbed, setIsGrabbed] = useState(false)

  const onDragStop = useCallback(
    (newDir: number[]) => {
      if (!elastica) return
      const { externalForces } = elastica

      let norm = newDir.map((pos) => pos * pos).reduce((a, b) => a + b)
      norm = Math.sqrt(norm)

      if (norm === 0) return

      externalForces[index] = newDir.map((pos) => pos / norm) as [
        number,
        number,
      ]
    },
    [elastica, index]
  )

  const bind = useDrag(
    useCallback(
      ({ down, movement: [mx, my] }) => {
        if (down) {
          onDragStop([mx, my])
        } else {
          onHoverChange(index, false)
        }
      },
      [index]
    )
  )

  const handleMouseEnter = useCallback(() => {
    setIsGrabbed(true)
    onHoverChange(index, true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsGrabbed(false)
    onHoverChange(index, false)
  }, [])

  return (
    <BoundaryBox 
      className={cn(
        "absolute inset-0 w-fit h-fit select-none cursor-grab touch-none", 
        isGrabbed && 'text-secondary bg-white',
        className
      )} 
      {...bind()}
    >
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {name}
      </div>
    </BoundaryBox>
  )
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
