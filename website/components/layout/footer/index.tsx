import Logo from '~/components/ui/darkroom.svg'
import { Link } from '~/components/ui/link'

export function Footer() {
  return (
    <footer className="flex dt:flex-row flex-col dt:items-end items-center justify-between p-safe font-mono uppercase">
      <Link href="https://darkroom.engineering/" className="link">
        <Logo className="dr-w-148 text-secondary" />
      </Link>
      <Link
        href="https://github.com/darkroomengineering/elastica"
        className="link"
      >
        github
      </Link>
    </footer>
  )
}
