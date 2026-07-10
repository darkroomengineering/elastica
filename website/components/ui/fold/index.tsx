'use client'

import cn from 'clsx'
import { useRect, useWindowSize } from 'hamo'
import {
  createContext,
  type HTMLAttributes,
  useContext,
  useRef,
} from 'react'
import { useScrollTrigger } from '~/hooks'
import s from './fold.module.css'

const FoldContext = createContext(false)

export function useFold() {
  return useContext(FoldContext)
}

type FoldProps = HTMLAttributes<HTMLDivElement> & {
  type?: 'bottom' | 'top'
  disabled?: boolean
  overlay?: boolean
  parallax?: boolean
}

export function Fold({
  children,
  className,
  disabled = false,
  type = 'bottom',
  overlay = true,
  parallax = true,
  ...props
}: FoldProps) {
  const overlayRef = useRef<HTMLDivElement>(null!)
  const stickyRef = useRef<HTMLDivElement>(null!)

  // hamo measures the fold once (and again on resize); the scroll trigger
  // maps scroll through that cached rect — no per-frame layout reads
  const [setRectRef, rect] = useRect()
  const { height: windowHeight = 0 } = useWindowSize()

  // top: reveal runs while the fold's top edge travels one viewport past the
  // viewport top. bottom: while its bottom edge closes the last viewport.
  useScrollTrigger({
    rect,
    start: type === 'top' ? 'top top' : `bottom ${windowHeight * 2}`,
    end: type === 'top' ? `top ${-windowHeight}` : 'bottom bottom',
    disabled,
    onProgress: ({ progress }) => {
      const value = String(type === 'top' ? 1 - progress : progress)
      overlayRef.current?.style.setProperty('--progress', value)
      stickyRef.current?.style.setProperty('--progress', value)
    },
  })

  return (
    <FoldContext.Provider value={true}>
      <div
        ref={setRectRef}
        className={cn(
          s.fold,
          disabled && s.isDisabled,
          type === 'bottom' && s.isBottom,
          type === 'top' && s.isTop,
          overlay && s.isOverlay,
          parallax && s.isParallax,
          className
        )}
        {...props}
      >
        <div className={cn(s.sticky)} ref={stickyRef}>
          {children}
        </div>
        <div className={s.overlay} ref={overlayRef} />
      </div>
    </FoldContext.Provider>
  )
}
