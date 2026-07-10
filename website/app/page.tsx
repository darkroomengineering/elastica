import { HeroDrop } from '~/components/hero-drop'
import { IntRollers } from '~/components/int-rollers'
import { MurmurThief } from '~/components/murmur-thief'
import { FlockSection } from '~/components/murmur-thief/flock-section'
import { PillsEscort } from '~/components/pills-escort'
import { RollerProgress } from '~/components/roller-progress'
import { Link } from '~/components/ui/link'
import { Fold } from '~/components/ui/fold'
import { Wrapper } from '~/components/layout/wrapper'
import { FooterSection } from '~/components/footer-clutch/footer-section'
import s from './page.module.css'

export default function Home() {
  return (
    <Wrapper theme="light" lenis footer={false} className={s.page}>
      {/* everything above the footer paints over the fold (z-index) so the
          light page slides up to reveal the footer pinned beneath it */}
      <div className={s.aboveFold}>
        {/* ── Header chrome (fixed across all sections) ── */}
        <header className={s.headerChrome}>
          <span>elastica</span>
          <span className={s.headerCenter}>@darkroom.engineering/elastica</span>
          <Link
            href="https://github.com/darkroomengineering/elastica"
            className={s.headerLink}
          >
            github ↗
          </Link>
        </header>

        {/* ── Roller progress track ── */}
        <RollerProgress />

        {/* ── S1 Hero ── */}
        <HeroDrop />

        {/* ── S2 Pills ── */}
        <PillsEscort />

        {/* ── INT Rollers band ── */}
        <IntRollers />

        {/* ── S3 Murmur ── */}
        <MurmurThief />

        {/* ── S4 Flock — the DOM story in its own room ── */}
        <FlockSection />
      </div>

      {/* ── S5 Footer — hidden fold revealed as the page scrolls past ── */}
      <Fold type="top" className={s.footerFold}>
        <FooterSection />
      </Fold>
    </Wrapper>
  )
}
