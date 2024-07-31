import babel from '@rollup/plugin-babel'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import path from 'path'

const rootDist = path.resolve(__dirname, '../../dist/')

export default [
  {
    input: './src/index.js',
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
    external: ['react', 'react-dom'],
    plugins: [
      nodeResolve({ extensions: ['.js', '.jsx'] }),
      babel({
        babelHelpers: 'bundled',
        presets: ['@babel/preset-react'],
        extensions: ['.js', '.jsx'],
      }),
    ],
  },
]
