'use client'

import cn from 'clsx'
import { useState } from 'react'
import { Wrapper } from '../(components)/wrapper'
import { Example1 } from './(componentes)/example-1'
import { Example2 } from './(componentes)/example-2'
import { Example3 } from './(componentes)/example-3'
import s from './home.module.scss'

const examples = [
  { name: 'Example 1', component: 'Example1' },
  { name: 'Example 2', component: 'Example2' },
  { name: 'Example 3', component: 'Example3' },
]

const data = [
  { name: 'Guido' },
  { name: 'Franco' },
  { name: 'Lea' },
  { name: 'Felix' },
  { name: 'Clément' },
  { name: 'Fermin' },
]

export default function Home() {
  const [example, setExample] = useState(examples[0])

  return (
    <Wrapper theme="red" className={s.page}>
      {example.component === 'Example1' && <Example1 data={data} />}
      {example.component === 'Example2' && <Example2 data={data} />}
      {example.component === 'Example3' && <Example3 data={data} />}

      <ul className={s.list}>
        {examples.map(({ name, component }, index) => (
          <li
            key={component}
            className={cn(s.item, component === example.component && s.active)}
          >
            <button onClick={() => setExample(examples[index])}>{name}</button>
          </li>
        ))}
      </ul>
    </Wrapper>
  )
}
