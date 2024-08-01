import React, { useEffect, useState } from 'react'

export function isEmptyArray(arr) {
  if (!arr) return true

  return Array.isArray(arr) && arr.length === 0
}

export function useJavascriptEnable(initState = true) {
  const [javascriptEnable, setJavascriptEnable] = useState(initState)

  useEffect(() => {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        setJavascriptEnable(false)
      }
    })

    return () => {
      document.removeEventListener('visibilitychange', () => {})
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
}

export function HashGrid({ gridSize }) {
  return (
    <>
      <div
        style={{
          ...fullSize,
        }}
      >
        {new Array(gridSize + 1).fill(0).map((_, index) => (
          <span key={index} style={{ border: '1px solid white' }} />
        ))}
      </div>
      <div
        style={{
          flexDirection: 'column',
          ...fullSize,
        }}
      >
        {new Array(gridSize + 1).fill(0).map((_, index) => (
          <span key={index} style={{ border: '1px solid white' }} />
        ))}
      </div>
    </>
  )
}
