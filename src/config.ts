import { colorsNamed, parse } from 'culori'

const colorKeys = [
  'base-100', 'base-200', 'base-300', 'base-content',
  'primary', 'primary-content', 'secondary', 'secondary-content',
  'accent', 'accent-content', 'neutral', 'neutral-content',
  'info', 'info-content', 'success', 'success-content',
  'warning', 'warning-content', 'error', 'error-content',
] as const

type Colors = Partial<Record<(typeof colorKeys)[number], string>>

type Terminal = {
  id: string
  label: string
  url: string
  description?: string
  tags?: string[]
  accent?: string
}

export type Config = {
  title?: string
  subtitle?: string
  theme?: { name?: string; colors?: Colors }
  links: Terminal[]
}

function invalid(field: string, expected: string): never {
  throw new Error(`${field}: expected ${expected}`)
}

function object(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    invalid(field, 'an object')
  }
  return value as Record<string, unknown>
}

function list(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) invalid(field, 'an array')
  return value
}

function string(value: unknown, field: string, allowEmpty = false): string {
  if (typeof value !== 'string' || (!allowEmpty && !value.trim())) {
    invalid(field, allowEmpty ? 'a string' : 'a non-empty string')
  }
  return value
}

function color(value: unknown, field: string): string {
  const literal = string(value, field).trim().toLowerCase()
  // Culori also accepts bare hexadecimal digits. CSS requires the # prefix.
  const cssSyntax = literal.startsWith('#') || literal.includes('(')
    || literal === 'transparent' || Object.hasOwn(colorsNamed, literal)
  const parsed = cssSyntax ? parse(literal) : undefined
  if (!parsed || Object.values(parsed).some((channel) => typeof channel === 'number' && !Number.isFinite(channel))) {
    invalid(field, 'a literal CSS color')
  }
  return literal
}

function url(value: unknown, field: string): string {
  const text = string(value, field)
  if (!/^https?:\/\/[^/\\?#\s]/i.test(text)) invalid(field, 'an absolute HTTP(S) URL')
  let parsed: URL
  try {
    parsed = new URL(text)
  } catch {
    invalid(field, 'an absolute HTTP(S) URL')
  }
  if (parsed.username || parsed.password) invalid(field, 'a URL without credentials')
  return parsed.href
}

export function validateConfig(value: unknown): Config {
  const input = object(value, 'config.json')
  const ids = new Set<string>()
  const links = list(input.links, 'links').map((value, index): Terminal => {
    const field = `links[${index}]`
    const link = object(value, field)
    const id = string(link.id, `${field}.id`)
    if (ids.has(id)) invalid(`${field}.id`, 'a unique id')
    ids.add(id)
    return {
      id,
      label: string(link.label, `${field}.label`),
      url: url(link.url, `${field}.url`),
      description: link.description === undefined ? undefined : string(link.description, `${field}.description`, true),
      tags: link.tags === undefined ? undefined : list(link.tags, `${field}.tags`)
        .map((tag, index) => string(tag, `${field}.tags[${index}]`)),
      accent: link.accent === undefined ? undefined : color(link.accent, `${field}.accent`),
    }
  })

  const config: Config = { links }
  if (input.title !== undefined) config.title = string(input.title, 'title')
  if (input.subtitle !== undefined) config.subtitle = string(input.subtitle, 'subtitle', true)
  if (input.theme !== undefined) {
    const theme = object(input.theme, 'theme')
    config.theme = {}
    if (theme.name !== undefined) config.theme.name = string(theme.name, 'theme.name')
    if (theme.colors !== undefined) {
      const values = object(theme.colors, 'theme.colors')
      const colors: Colors = {}
      for (const key of colorKeys) {
        if (Object.hasOwn(values, key)) colors[key] = color(values[key], `theme.colors.${key}`)
      }
      config.theme.colors = colors
    }
  }
  return config
}
