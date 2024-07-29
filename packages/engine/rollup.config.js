import terser from '@rollup/plugin-terser'

export default [
  {
    input: './src/index.js',
    output: [
      {
        file: './dist/elastic-collisions.mjs',
        format: 'esm',
        strict: true,
        sourcemap: true,
        name: 'Elastic Collisions',
        plugins: [
          terser({
            keep_classnames: true,
            keep_fnames: true,
          }),
        ],
      },
      {
        file: './dist/elastic-collisions.min.js',
        format: 'umd',
        strict: true,
        sourcemap: true,
        name: 'Elastic Collisions',
        plugins: [
          terser({
            keep_classnames: true,
            keep_fnames: true,
          }),
        ],
      },
      {
        file: './dist/elastic-collisions.js',
        format: 'umd',
        strict: true,
        sourcemap: true,
        name: 'Elastic Collisions',
      },
    ],
  },
]
