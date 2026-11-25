<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  ToggleGroupItem,
  ToggleGroupRoot,
} from 'reka-ui'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { Config } from './config'

const props = defineProps<{
  title: string
  subtitle: string
  links: Config['links']
  warning?: string
  preference: string
}>()
const emit = defineEmits<{ appearance: [value: string] }>()

const appearances = ['system', 'light', 'dark'] as const
const appearance = ref(props.preference)
const query = ref('')
const search = ref<HTMLInputElement | null>(null)
const helpOpen = ref(false)
const warningVisible = ref(Boolean(props.warning))
let shortcutOpener: HTMLElement | null = null

const terminals = computed(() => props.links.map((link) => ({
  ...link,
  summary: link.description?.trim() || new URL(link.url).hostname,
})))

const matches = computed(() => {
  const filter = query.value.trim().toLowerCase()
  return terminals.value.filter(({ label, summary, tags = [] }) =>
    [label, summary, ...tags].some((text) => text.toLowerCase().includes(filter)),
  )
})

function updateAppearance(value: unknown) {
  const choice = appearances.find((option) => option === value)
  if (choice) {
    appearance.value = choice
    emit('appearance', choice)
  }
}

function handleShortcut(event: KeyboardEvent) {
  if (helpOpen.value || event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return
  if (event.key === 'Escape' && query.value) {
    event.preventDefault()
    query.value = ''
    return
  }

  const target = event.target
  if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select'))) return
  if (event.key === '/') {
    event.preventDefault()
    search.value?.focus()
  } else if (event.key === '?') {
    event.preventDefault()
    if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
      shortcutOpener = document.activeElement
    }
    helpOpen.value = true
  }
}

function restoreShortcutFocus(event: Event) {
  if (shortcutOpener?.isConnected) {
    event.preventDefault()
    shortcutOpener.focus()
  }
  shortcutOpener = null
}

onMounted(() => window.addEventListener('keydown', handleShortcut))
onUnmounted(() => window.removeEventListener('keydown', handleShortcut))
</script>

<template>
  <header class="topbar">
    <div class="shell topbar-inner">
      <div class="brand"><span class="brand-mark" aria-hidden="true">$_</span> SSH Hub</div>

      <div class="topbar-controls">
        <ToggleGroupRoot
          class="theme-switch"
          type="single"
          aria-label="Color scheme"
          :model-value="appearance"
          @update:model-value="updateAppearance"
        >
          <ToggleGroupItem
            v-for="choice in appearances"
            :key="choice"
            :value="choice"
            class="theme-option"
          >{{ choice }}</ToggleGroupItem>
        </ToggleGroupRoot>

        <DialogRoot v-model:open="helpOpen">
          <DialogTrigger class="btn help-button">Keyboard help</DialogTrigger>
          <DialogPortal>
            <DialogOverlay class="dialog-overlay" />
            <DialogContent class="dialog-panel" @close-auto-focus="restoreShortcutFocus">
              <DialogTitle class="dialog-title">Keyboard help</DialogTitle>
              <DialogDescription>Use these shortcuts to browse the directory.</DialogDescription>
              <dl class="shortcuts">
                <div><dt><kbd>/</kbd></dt><dd>Focus the filter</dd></div>
                <div><dt><kbd>Esc</kbd></dt><dd>Clear the filter or close this dialog</dd></div>
                <div><dt><kbd>?</kbd></dt><dd>Open keyboard help</dd></div>
                <div><dt><kbd>Tab</kbd></dt><dd>Move to the next control or terminal</dd></div>
                <div><dt><kbd>Enter</kbd></dt><dd>Open the focused terminal in a new tab</dd></div>
              </dl>
              <DialogClose class="btn">Close</DialogClose>
            </DialogContent>
          </DialogPortal>
        </DialogRoot>
      </div>
    </div>
  </header>

  <main class="shell main-content">
    <div v-if="warningVisible" class="config-warning">
      <p role="alert"><strong>Using default configuration.</strong> {{ warning }}</p>
      <button class="btn" type="button" @click="warningVisible = false">Dismiss</button>
    </div>

    <h1>{{ title }}</h1>
    <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>

    <section class="directory" aria-label="Terminals">
      <div class="directory-tools">
        <label class="search-field">
          <span class="sr-only">Filter terminals</span>
          <span class="search-icon" aria-hidden="true"></span>
          <input ref="search" v-model="query" type="search" placeholder="Filter terminals" aria-keyshortcuts="/">
          <kbd aria-hidden="true">/</kbd>
        </label>

        <p class="result-count" aria-live="polite" aria-atomic="true">
          {{ matches.length }} {{ matches.length === 1 ? 'terminal' : 'terminals' }}
        </p>
      </div>

      <p id="new-tab-hint" class="sr-only">Opens in a new tab.</p>
      <ul v-if="matches.length" class="terminal-grid">
        <li v-for="terminal in matches" :key="terminal.id">
          <a
            class="terminal-card"
            :href="terminal.url"
            target="_blank"
            rel="noopener noreferrer"
            aria-describedby="new-tab-hint"
            :style="{ '--terminal-accent': terminal.accent }"
          >
            <span class="terminal-mark" aria-hidden="true">$_</span>
            <span class="terminal-label">{{ terminal.label }}</span>
            <span class="terminal-summary">{{ terminal.summary }}</span>
            <span v-if="terminal.tags?.length" class="terminal-tags">
              <span v-for="(tag, index) in terminal.tags" :key="index" class="badge">{{ tag }}</span>
            </span>
          </a>
        </li>
      </ul>
      <p v-else class="empty-state">{{ terminals.length ? 'No matching terminals.' : 'No terminals configured.' }}</p>
    </section>
  </main>
</template>
