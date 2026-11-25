import assert from 'node:assert/strict'
import defaults from '../config/defaults.json' with { type: 'json' }
import { validateConfig } from '../src/config.ts'

const [link] = defaults.links
const valid = {
  ...defaults,
  theme: { name: 'test', colors: { accent: 'oklch(72% 0.14 190)', 'future-key': null } },
  links: [{ ...link, accent: '#177b82' }],
}

validateConfig(defaults)
const config = validateConfig(valid)
assert.equal(config.links[0].url, 'https://terminal.example.com/')
assert.equal(config.links[0].accent, '#177b82')
assert.deepEqual(config.theme.colors, { accent: 'oklch(72% 0.14 190)' })
console.log('Accepted defaults and a valid config with color overrides')

for (const [label, input, field] of [
  ['missing links array', {}, /^Error: links:/],
  ['missing URL', { links: [{ ...link, url: undefined }] }, /^Error: links\[0\]\.url:/],
  ['relative URL', { links: [{ ...link, url: '/terminal' }] }, /^Error: links\[0\]\.url:/],
  ['bad theme color', { ...valid, theme: { colors: { accent: 'bad' } } }, /^Error: theme\.colors\.accent:/],
  ['bad card color', { links: [{ ...link, accent: 'url(https://example.com)' }] }, /^Error: links\[0\]\.accent:/],
  ['non-HTTP(S) URL', { links: [{ ...link, url: 'javascript:alert(1)' }] }, /^Error: links\[0\]\.url:/],
]) {
  assert.throws(() => validateConfig(input), field)
  console.log(`Rejected ${label}`)
}
