'use client'

import { useEffect, useRef, useState } from 'react'
import { Link } from '~/components/ui/link'
import { FooterClutch } from './index'
import s from '~/app/page.module.css'

/**
 * FooterSection — client component that owns the footer's refs.
 * Renders the full footer markup so it can pass refs to FooterClutch.
 * prefers-reduced-motion: canvas not mounted, static DOM baseline visible.
 */
export function FooterSection() {
  const footerRef = useRef<HTMLElement>(null)
  const rectRef = useRef<HTMLDivElement>(null)
  const [motionOk, setMotionOk] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setMotionOk(!mq.matches)

    const onChange = (e: MediaQueryListEvent) => setMotionOk(!e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <footer ref={footerRef} className={s.footer}>
      {/* Canvas layer — absolute inset 0, behind all chrome (z-index via CSS) */}
      {motionOk && (
        <FooterClutch footerRef={footerRef} rectRef={rectRef} />
      )}

      <span className={s.footerTopLeft}>divs with mass.</span>
      <span className={s.footerTopRight}>
        npm i @darkroom.engineering/elastica
      </span>

      {/* Static DOM rect — stays on top of canvas (z-index via CSS) */}
      <div className={s.footerCenter}>
        <div ref={rectRef} className={s.footerRect}>
          <span className={s.footerWordmark}>ELASTICA</span>
        </div>
      </div>

      <Link
        href="https://github.com/darkroomengineering/elastica"
        className={`${s.footerBottomLeft} ${s.footerLink}`}
      >
        github ↗
      </Link>
      <Link
        href="https://darkroom.engineering"
        className={`${s.footerBottomRight} ${s.footerLink}`}
      >
        darkroom.engineering ↗
      </Link>
    </footer>
  )
}
