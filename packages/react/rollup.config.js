import babel from '@rollup/plugin-babel'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'

export default [
  {
    input: './src/index.js',
    output: [
      {
        file: './dist/elastic-collisions-react.mjs',
        format: 'esm',
        strict: true,
        sourcemap: true,
        name: 'Elastic Collisions React',
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
