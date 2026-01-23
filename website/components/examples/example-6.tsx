'use client'

import { CanvasBox, CanvasElastica } from '@elastica'
import { useEffect, useRef, useState } from 'react'
import { Pane } from 'tweakpane'

const PARTICLE_COUNT = 200

// Default cursor repulsion settings
const initialParams = {
  repulsionRadius: 250,
  repulsionStrength: 0.13,
  gravity: 0.0035,
}

/**
 * Example 6: CanvasElastica with cursor repulsion
 * Move your mouse to push particles away
 */
export function Example6() {
  const mouseRef = useRef({ x: -1000, y: -1000, prevX: -1000, prevY: -1000 })
  const paramsRef = useRef({ ...initialParams })
  const [showHashGrid, setShowHashGrid] = useState(false)

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const mouse = mouseRef.current
      mouse.prevX = mouse.x
      mouse.prevY = mouse.y
      mouse.x = e.clientX
      mouse.y = e.clientY
    }

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000, prevX: -1000, prevY: -1000 }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  // Tweakpane setup
  useEffect(() => {
    const pane = new Pane()
    const localParams = { ...initialParams }

    const cursorFolder = pane.addFolder({ title: 'Cursor Interaction' })
    cursorFolder
      .addBinding(localParams, 'repulsionRadius', {
        label: 'Radius',
        min: 50,
        max: 400,
        step: 10,
      })
      .on('change', (ev) => {
        paramsRef.current.repulsionRadius = ev.value
      })
    cursorFolder
      .addBinding(localParams, 'repulsionStrength', {
        label: 'Strength',
        min: 0.01,
        max: 0.3,
        step: 0.01,
      })
      .on('change', (ev) => {
        paramsRef.current.repulsionStrength = ev.value
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
          defaultRestitution: 0.8,
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
          const mouse = mouseRef.current
          const params = paramsRef.current

          // Check if mouse is moving (has displacement)
          const mouseDx = mouse.x - mouse.prevX
          const mouseDy = mouse.y - mouse.prevY
          const isMouseMoving = mouseDx * mouseDx + mouseDy * mouseDy > 0.1

          // Clear prev position after checking (only repel on active movement)
          mouse.prevX = mouse.x
          mouse.prevY = mouse.y

          const radiusSq = params.repulsionRadius * params.repulsionRadius

          for (let i = 0; i < positions.length; i++) {
            const pos = positions[i]!
            const vel = velocities[i]!

            // Only apply repulsion if mouse is actively moving
            if (isMouseMoving) {
              const dx = pos[0] - mouse.x
              const dy = pos[1] - mouse.y
              const distSq = dx * dx + dy * dy

              if (distSq < radiusSq && distSq > 0.01) {
                const dist = Math.sqrt(distSq)
                const force = (1 - dist / params.repulsionRadius) * params.repulsionStrength

                vel[0] += (dx / dist) * force * deltaTime
                vel[1] += (dy / dist) * force * deltaTime
              }
            }

            // Apply gravity
            vel[1] += params.gravity * deltaTime

            // Move particles by velocity
            pos[0] += vel[0] * deltaTime
            pos[1] += vel[1] * deltaTime
          }
        }}
      >
        {/* {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
          <CanvasBox
            key={`white-${i}`}
            width={12 + Math.random() * 8}
            height={12 + Math.random() * 8}
            shape="rect"
            fill="#ffffff"
          />
        ))} */}
        {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
          <CanvasBox
            key={`blue-${i}`}
            width={40 + Math.random() * 15}
            height={40 + Math.random() * 15}
            shape="circle"
            fill="#4444ff"
            mass={5}
          />
        ))}
      </CanvasElastica>
    </div>
  )
}
