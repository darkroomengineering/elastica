'use client'

import cn from 'clsx'
import { useState } from 'react'
import { Example1 } from '~/components/examples/example-1'
import { Example2 } from '~/components/examples/example-2'
import { Example3 } from '~/components/examples/example-3'
import { Wrapper } from '~/components/layout/wrapper'
import s from './page.module.css'

const examples = [
  { name: 'Example 1', component: 'Example1' },
  { name: 'Example 2', component: 'Example2' },
  { name: 'Example 3', component: 'Example3' },
] as const

const data = [
  { name: 'Elastica' },
  { name: 'Elastica' },
  { name: 'Elastica' },
  { name: 'Elastica' },
  { name: 'Elastica' },
  { name: 'Elastica' },
  
]

type Example = (typeof examples)[number]

export default function Home() {
  const [example, setExample] = useState<Example>(examples[0])

  const renderExample = () => {
    switch (example.component) {
      case 'Example1':
        return <Example1 data={data} />
      case 'Example2':
        return <Example2 data={data} />
      case 'Example3':
        return <Example3 data={data} />
      default:
        return null
    }
  }

  return (
    <Wrapper theme="red" lenis={false} className={s.page}>
      {renderExample()}

      <ul className={s.list}>
        {examples.map(({ name, component }, index) => (
          <li
            key={component}
            className={cn(s.item, component === example.component && s.active)}
          >
            <button
              type="button"
              onClick={() => {
                const ex = examples[index]
                if (ex) setExample(ex)
              }}
            >
              {name}
            </button>
          </li>
        ))}
      </ul>
    </Wrapper>
  )
}
