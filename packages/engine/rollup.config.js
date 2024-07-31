import terser from '@rollup/plugin-terser'
import path from 'path'

const rootDist = path.resolve(__dirname, '../../dist/')

export default [
  {
    input: './src/index.js',
    output: [
      {
        file: path.join(rootDist, 'elastica.mjs'),
        format: 'esm',
        strict: true,
        sourcemap: true,
        name: 'Elastica',
        plugins: [
          terser({
            keep_classnames: true,
            keep_fnames: true,
          }),
        ],
      },
      {
        file: path.join(rootDist, 'elastica.min.js'),
        format: 'umd',
        strict: true,
        sourcemap: true,
        name: 'Elastica',
        plugins: [
          terser({
            keep_classnames: true,
            keep_fnames: true,
          }),
        ],
      },
      {
        file: path.join(rootDist, 'elastica.js'),
        format: 'umd',
        strict: true,
        sourcemap: true,
        name: 'Elastica',
      },
    ],
  },
]
