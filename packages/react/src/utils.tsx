import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import type { Vector2D } from '@darkroom.engineering/elastica'

export function isEmptyArray<T>(arr: T[] | null | undefined): boolean {
  if (!arr) return true

  return Array.isArray(arr) && arr.length === 0
}

export function useJavascriptEnable(
  initState = true
): [boolean, Dispatch<SetStateAction<boolean>>] {
  const [javascriptEnable, setJavascriptEnable] = useState(initState)

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setJavascriptEnable(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return [javascriptEnable, setJavascriptEnable]
}

const fullSize = {
  display: 'flex',
  justifyContent: 'space-between',
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  width: '100%',
  height: '100%',
} as const

export type HashGridProps = {
  gridSize: number
}

export function HashGrid({ gridSize }: HashGridProps) {
  return (
    <>
      <div style={{ ...fullSize }}>
        {new Array(gridSize + 1).fill(0).map((_, index) => (
          <span key={index} style={{ border: '1px solid white' }} />
        ))}
      </div>
      <div style={{ flexDirection: 'column', ...fullSize }}>
        {new Array(gridSize + 1).fill(0).map((_, index) => (
          <span key={index} style={{ border: '1px solid white' }} />
        ))}
      </div>
    </>
  )
}

/**
 * SettleDetector — pure stateful object that detects when all non-static bodies
 * have settled (max speed below threshold for N consecutive frames), fires a
 * callback once, and re-arms when speed exceeds 2× threshold.
 *
 * Extracted as a pure helper so it can be unit-tested without a React harness.
 *
 * @param onSettle     Callback fired when the system settles (once per cycle).
 * @param threshold    Velocity magnitude threshold (default 0.05).
 * @param frameCount   Number of consecutive sub-threshold frames to wait (default 10).
 */
export function createSettleDetector(
  onSettle: () => void,
  threshold: number = 0.05,
  frameCount: number = 10
) {
  let consecutiveFrames = 0
  let fired = false

  return {
    /**
     * Call once per physics step with the current velocity and isStatic arrays.
     * Allocation-free: plain loop, no array allocations.
     */
    check(velocities: Vector2D[], isStatic: boolean[]): void {
      let maxSpeed = 0
      for (let i = 0; i < velocities.length; i++) {
        if (isStatic[i]) continue
        const v = velocities[i]
        if (!v) continue
        const speed = Math.sqrt(v[0] * v[0] + v[1] * v[1])
        if (speed > maxSpeed) maxSpeed = speed
      }

      if (!fired) {
        if (maxSpeed < threshold) {
          consecutiveFrames++
          if (consecutiveFrames >= frameCount) {
            fired = true
            onSettle()
          }
        } else {
          consecutiveFrames = 0
        }
      } else {
        // Re-arm: if speed later rises above 2× threshold, allow re-firing
        if (maxSpeed > threshold * 2) {
          fired = false
          consecutiveFrames = 0
        }
      }
    },

    /** Reset all state (e.g. on re-initialization). */
    reset(): void {
      consecutiveFrames = 0
      fired = false
    },
  }
}
