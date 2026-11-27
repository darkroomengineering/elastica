import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('the published React bundle declares its client boundary', () => {
  const bundle = readFileSync(new URL('../../../dist/elastica-react.mjs', import.meta.url), 'utf8')
  assert.match(bundle, /^['"]use client['"];?\r?\n/)
})
