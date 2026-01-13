import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

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
