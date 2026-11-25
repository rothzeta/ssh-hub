import { createApp } from 'vue'
import defaults from '../config/defaults.json'
import App from './App.vue'
import { type Config, validateConfig } from './config'
import './style.css'

const root = document.documentElement
const systemLight = matchMedia('(prefers-color-scheme: light)')
let preference = 'system'
try {
  const stored = localStorage.getItem('ssh-hub:appearance')
  if (stored === 'light' || stored === 'dark') preference = stored
} catch {
  // Keep appearance available when storage is disabled.
}

function setAppearance() {
  const mode = preference === 'system' ? (systemLight.matches ? 'light' : 'dark') : preference
  root.dataset.theme = `ssh-hub-${mode}`
}

setAppearance()
systemLight.addEventListener('change', setAppearance)

async function loadConfig(): Promise<{ config: Config; warning?: string }> {
  const fallback = { config: defaults }
  try {
    const response = await fetch('./config.json', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(4000),
    })
    if (response.status === 404 || response.status === 204) return fallback
    if (!response.ok) throw new Error(`config.json: HTTP ${response.status}`)
    const text = await response.text()
    let input: unknown
    try {
      input = JSON.parse(text)
    } catch {
      throw new Error('config.json: expected valid JSON')
    }
    return { config: validateConfig(input) }
  } catch (error) {
    return { ...fallback, warning: error instanceof Error ? error.message : 'config.json: could not load' }
  }
}

async function start() {
  const { config, warning } = await loadConfig()
  const title = config.title ?? defaults.title
  document.title = title
  root.dataset.themeName = config.theme?.name ?? defaults.theme.name
  for (const [key, value] of Object.entries(config.theme?.colors ?? {})) {
    root.style.setProperty(`--color-${key}`, value)
  }

  createApp(App, {
    title,
    subtitle: config.subtitle ?? defaults.subtitle,
    links: config.links,
    warning,
    preference,
    onAppearance: (value: string) => {
      preference = value
      setAppearance()
      try {
        localStorage.setItem('ssh-hub:appearance', value)
      } catch {
        // The current selection still applies.
      }
    },
  }).mount('#app')
}

void start()
