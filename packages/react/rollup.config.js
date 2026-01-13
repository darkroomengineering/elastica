import { nodeResolve } from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import path from 'path'

const rootDist = path.resolve(__dirname, '../../dist/')

export default [
  {
    input: './src/index.tsx',
    output: [
      {
        file: path.join(rootDist, 'elastica-react.mjs'),
        format: 'esm',
        strict: true,
        sourcemap: true,
        name: 'Elastica React',
        plugins: [
          terser({
            keep_classnames: true,
            keep_fnames: true,
          }),
        ],
      },
    ],
    external: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@darkroom.engineering/elastica',
      '@darkroom.engineering/hamo',
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: path.join(rootDist, 'react'),
      }),
      nodeResolve({ extensions: ['.ts', '.tsx'] }),
    ],
  },
]
