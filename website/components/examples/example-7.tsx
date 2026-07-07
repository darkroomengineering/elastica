'use client'

import { CanvasBox, CanvasElastica } from '@elastica'
import { useEffect, useRef, useState } from 'react'
import { Pane } from 'tweakpane'

const CIRCLE_COUNT = 100
const RECT_COUNT = 100

// Frame timestep the solver is configured with (ms) — used to convert the
// window's per-frame displacement into a velocity impulse
const FRAME_DT = 12

// OS window drags can report large jumps between frames; clamp so a fast
// fling reads as a solid "thunk" instead of a cannon blast
const MAX_WINDOW_DELTA = 80

const initialParams = {
  coupling: 0.25,
  smoothing: 0.15,
  gravity: 0.003,
}

/**
 * Example 7: the container is the browser window.
 * Drag the window around the screen — the bodies keep their inertia in
 * screen space and slosh against the walls of the moving container.
 */
export function Example7() {
  const paramsRef = useRef({ ...initialParams })
  const windowRef = useRef({ x: 0, y: 0, smoothDx: 0, smoothDy: 0, initialized: false })
  const [showHashGrid, setShowHashGrid] = useState(false)

  useEffect(() => {
    const pane = new Pane()
    const localParams = { ...initialParams }

    const windowFolder = pane.addFolder({ title: 'Window Inertia' })
    windowFolder
      .addBinding(localParams, 'coupling', {
        label: 'Coupling',
        min: 0,
        max: 1,
        step: 0.01,
      })
      .on('change', (ev) => {
        paramsRef.current.coupling = ev.value
      })
    windowFolder
      .addBinding(localParams, 'smoothing', {
        label: 'Smoothing',
        min: 0.02,
        max: 0.5,
        step: 0.01,
      })
      .on('change', (ev) => {
        paramsRef.current.smoothing = ev.value
      })

    const physicsFolder = pane.addFolder({ title: 'Physics' })
    physicsFolder
      .addBinding(localParams, 'gravity', {
        label: 'Gravity',
        min: 0,
        max: 0.005,
        step: 0.0001,
      })
      .on('change', (ev) => {
        paramsRef.current.gravity = ev.value
      })

    pane
      .addBinding({ showHashGrid: false }, 'showHashGrid', { label: 'Show Hash Grid' })
      .on('change', (ev) => {
        setShowHashGrid(ev.value)
      })

    return () => pane.dispose()
  }, [])

  return (
    <div className="w-full h-screen fixed inset-0">
      <CanvasElastica
        className="w-full h-full"
        config={{
          collisions: true,
          borders: 'rigid',
          gridSize: 8,
          useOBB: true,
          solver: {
            slop: 0,
            percent: 0.8,
            fixedDeltaTime: FRAME_DT,
            substeps: 4,
          }
        }}
        initialCondition={({ positions, velocities, container }) => {
          for (let i = 0; i < positions.length; i++) {
            positions[i] = [
              Math.random() * container.width,
              Math.random() * container.height * 0.5,
            ]
            velocities[i] = [
              (Math.random() - 0.5) * 0.3,
              Math.random() * 0.2,
            ]
          }
        }}
        showHashGrid={showHashGrid}
        update={({ velocities, positions, deltaTime }) => {
          const params = paramsRef.current
          const win = windowRef.current

          // Poll the window's screen position (there is no "window moved"
          // event). Reading + storing here means only the FIRST substep of a
          // frame sees a non-zero delta — later substeps read a zero delta.
          const screenX = window.screenX
          const screenY = window.screenY

          let impulseX = 0
          let impulseY = 0

          if (!win.initialized) {
            win.initialized = true
          } else {
            // Bodies have inertia in SCREEN space: when the container jerks
            // one way, they get shoved the other way relative to it.
            // Window deltas arrive quantized and bursty (0, 24, 0, 18 px...),
            // so low-pass the window velocity: the same total shove is
            // delivered as a smooth surge over a few frames instead of one
            // hammer blow per OS report.
            const dxWin = Math.max(-MAX_WINDOW_DELTA, Math.min(MAX_WINDOW_DELTA, screenX - win.x))
            const dyWin = Math.max(-MAX_WINDOW_DELTA, Math.min(MAX_WINDOW_DELTA, screenY - win.y))
            win.smoothDx += (dxWin - win.smoothDx) * params.smoothing
            win.smoothDy += (dyWin - win.smoothDy) * params.smoothing
            impulseX = (-win.smoothDx * params.coupling) / FRAME_DT
            impulseY = (-win.smoothDy * params.coupling) / FRAME_DT
          }

          win.x = screenX
          win.y = screenY

          for (let i = 0; i < positions.length; i++) {
            const pos = positions[i]!
            const vel = velocities[i]!

            vel[0] += impulseX
            vel[1] += impulseY + params.gravity * deltaTime

            pos[0] += vel[0] * deltaTime
            pos[1] += vel[1] * deltaTime
          }
        }}
      >
        {Array.from({ length: CIRCLE_COUNT }, (_, i) => (
          <CanvasBox
            key={`circle-${i}`}
            radius={20 + Math.random() * 7.5}
            shape="circle"
            fill="#000"
            mass={0.1}
          />
        ))}
        {Array.from({ length: RECT_COUNT }, (_, i) => (
          <CanvasBox
            key={`rect-${i}`}
            width={40 + Math.random() * 30}
            height={25 + Math.random() * 20}
            shape="rect"
            fill="#000"
            mass={0.1}
          />
        ))}
      </CanvasElastica>

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none text-contrast opacity-40 dr-text-24 text-center">
        drag the browser window around
      </div>
    </div>
  )
}
