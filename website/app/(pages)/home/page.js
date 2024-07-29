import { Wrapper } from '../(components)/wrapper'
import { Example } from './(componentes)/example'
import s from './home.module.scss'

export default function Home() {
  return (
    <Wrapper theme="red" className={s.page}>
      <Example />
    </Wrapper>
  )
}
