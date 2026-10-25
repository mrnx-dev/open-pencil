<script setup lang="ts">
import type { ChatStatus } from 'ai'
import { TooltipProvider } from 'reka-ui'
import { computed, nextTick, ref, watch } from 'vue'

import { useI18n } from '@open-pencil/vue/i18n'

import { deleteChipAtCaret, insertSkillChipAtCaret } from '@/app/skills/chip'
import { syncBundledSkills } from '@/app/skills/seed'
import { detectSlashQuery, suggestSkills, type SkillSuggestion } from '@/app/skills/trigger'
import IconButton from '@/components/ui/button/IconButton.vue'
import InputGroup from '@/components/ui/input/InputGroup.vue'

syncBundledSkills()

const { status, disabled = false } = defineProps<{ status: ChatStatus; disabled?: boolean }>()
const emit = defineEmits<{
  submit: [text: string]
  stop: []
  settings: []
  paste: [event: ClipboardEvent]
}>()
const { ai } = useI18n()
const editable = ref<HTMLDivElement>()
// The button reads this instead of the DOM: typing in a contenteditable changes no reactive state.
const hasText = ref(false)
const isStreaming = computed(() => disabled || status === 'streaming' || status === 'submitted')

// --- Skills slash autocomplete with inline chips ---
const suggestions = ref<SkillSuggestion[]>([])
const showSuggestions = ref(false)
const selectedIdx = ref(0)
let lastQuery: string | null = null

function getPlainText(): string {
  const el = editable.value
  if (!el) return ''
  // collect text: chip spans have data-token, convert to token text, <br> marks a line break
  let out = ''
  el.childNodes.forEach((n) => {
    if (n.nodeType === 1 && (n as HTMLElement).dataset.token) {
      out += (n as HTMLElement).dataset.token + ' '
    } else if (n.nodeName === 'BR') {
      out += '\n'
    } else {
      out += n.textContent || ''
    }
  })
  return out.replace(/\u00A0/g, ' ')
}

/** DOM edits do not re-render this component, so every text mutation reports its result. */
function syncHasText(): void {
  hasText.value = getPlainText().trim() !== ''
}

function getCaretOffset(): number {
  const el = editable.value
  if (!el) return getPlainText().length
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return getPlainText().length
  const range = sel.getRangeAt(0).cloneRange()
  range.selectNodeContents(el)
  range.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset)
  // count tokens as their text length for query detection
  const frag = range.cloneContents()
  let len = 0
  frag.childNodes.forEach((n) => {
    const token = (n as HTMLElement).dataset?.token
    if (token) len += token.length + 1
    else len += n.textContent?.length || 0
  })
  return len
}

async function updateSuggestions() {
  const text = getPlainText()
  const pos = getCaretOffset()
  const query = detectSlashQuery(text, pos)
  if (query !== null) {
    const shouldReset = query !== lastQuery
    lastQuery = query
    const list = await suggestSkills(query)
    const prevLen = suggestions.value.length
    suggestions.value = list
    showSuggestions.value = list.length > 0
    if (shouldReset || prevLen !== list.length) selectedIdx.value = 0
    else selectedIdx.value = Math.min(selectedIdx.value, Math.max(0, list.length - 1))
  } else {
    lastQuery = null
    showSuggestions.value = false
  }
}

function insertChip(s: SkillSuggestion) {
  const el = editable.value
  if (!el) return
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return
  // find slash start in plain text before caret, then delete slash query from DOM
  const text = getPlainText()
  const pos = getCaretOffset()
  const before = text.slice(0, pos)
  const slashStart = before.lastIndexOf('/')
  if (slashStart === -1) return
  // remove slash query text nodes between slashStart and pos
  // simpler: delete slash query chars from editable by walking back
  const tokenLen = pos - slashStart
  // delete chars
  let toDelete = tokenLen
  // delete backwards from caret
  while (toDelete > 0 && sel.rangeCount) {
    const r = sel.getRangeAt(0)
    // if caret inside text node, delete char
    if (r.endContainer.nodeType === 3) {
      const txt = r.endContainer as Text
      const offset = r.endOffset
      if (offset > 0) {
        txt.deleteData(offset - 1, 1)
        r.setStart(txt, offset - 1)
        r.collapse(true)
        toDelete--
      } else {
        // move to previous node
        const prev = txt.previousSibling
        if (!prev) break
        if (prev.nodeType === 1 && (prev as HTMLElement).dataset.token) {
          // if previous is chip and we are at boundary, just move
          const pr = document.createRange()
          pr.selectNode(prev)
          pr.collapse(false)
          sel.removeAllRanges()
          sel.addRange(pr)
          if (toDelete === tokenLen) {
            // chip is not part of slash query, stop
            break
          }
        } else if (prev.nodeType === 3) {
          const pr = document.createRange()
          pr.selectNodeContents(prev as Text)
          pr.collapse(false)
          sel.removeAllRanges()
          sel.addRange(pr)
        }
      }
    } else {
      break
    }
  }
  // create the chip and a trailing caret space at the caret
  if (!insertSkillChipAtCaret(`/skill:${s.id}`)) return
  showSuggestions.value = false
  lastQuery = null
  syncHasText()
  el.focus()
}

/** Arrows, Enter, and Escape while the suggestion menu is open. True when handled. */
function applySuggestionKey(event: KeyboardEvent): boolean {
  if (!showSuggestions.value) return false
  if (event.code === 'ArrowDown') {
    event.preventDefault()
    selectedIdx.value = (selectedIdx.value + 1) % suggestions.value.length
    return true
  }
  if (event.code === 'ArrowUp') {
    event.preventDefault()
    selectedIdx.value =
      (selectedIdx.value - 1 + suggestions.value.length) % suggestions.value.length
    return true
  }
  const selected = suggestions.value[selectedIdx.value]
  if (event.code === 'Enter' && !event.shiftKey && selected) {
    event.preventDefault()
    insertChip(selected)
    return true
  }
  if (event.code === 'Escape') {
    showSuggestions.value = false
    lastQuery = null
    return true
  }
  return false
}

function handleKeydown(event: KeyboardEvent) {
  if (applySuggestionKey(event)) return
  // backspace on chip: delete whole chip when caret just after it
  if (deleteChipAtCaret(event)) {
    syncHasText()
    return
  }
  if (event.code === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    const target = (event.currentTarget as HTMLElement).closest('form')
    target?.requestSubmit()
  }
}

function handleInput() {
  updateSuggestions()
  syncHasText()
}

/** Leaving the composer closes the menu; suggestion rows prevent blur with mousedown.prevent. */
function handleBlur(): void {
  if (!showSuggestions.value) return
  showSuggestions.value = false
  lastQuery = null
}

const suggestionList = ref<HTMLDivElement>()

/** Keeps the keyboard-selected row visible, like a native listbox does. */
watch(selectedIdx, async () => {
  await nextTick()
  suggestionList.value
    ?.querySelector(`[data-suggestion-idx="${selectedIdx.value}"]`)
    ?.scrollIntoView({ block: 'nearest' })
})

function handleSubmit(event: Event) {
  event.preventDefault()
  if (isStreaming.value) return
  const text = getPlainText().trim()
  if (!text) return
  showSuggestions.value = false
  lastQuery = null
  emit('submit', text)
  if (editable.value) editable.value.innerHTML = ''
  hasText.value = false
}

function restoreDraft(text: string): boolean {
  const el = editable.value
  if (!el || el.textContent?.trim()) return false
  el.textContent = text
  syncHasText()
  return true
}
defineExpose({ restoreDraft })
</script>
<template>
  <TooltipProvider>
    <div class="shrink-0 border-t border-border bg-panel p-2.5">
      <form class="relative" @submit="handleSubmit" @paste.stop="emit('paste', $event)">
        <!-- Dropdown outside InputGroup to avoid overflow clipping and transparent bg -->
        <div
          v-if="showSuggestions"
          ref="suggestionList"
          role="listbox"
          :aria-label="ai.skillsHeader({ count: suggestions.length })"
          class="absolute bottom-full left-2 right-2 z-30 mb-2 max-h-44 overflow-y-auto rounded-xl border border-border bg-panel p-1 shadow-xl"
        >
          <div class="px-2 py-1 text-[10px] font-medium uppercase tracking-widest text-muted">
            {{ ai.skillsHeader({ count: suggestions.length }) }}
          </div>
          <button
            v-for="(s, idx) in suggestions"
            :key="s.id"
            type="button"
            role="option"
            :data-suggestion-idx="idx"
            :aria-selected="idx === selectedIdx"
            class="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-xs transition-colors"
            :class="
              idx === selectedIdx ? 'bg-accent text-on-accent' : 'text-surface hover:bg-hover'
            "
            @mousedown.prevent="insertChip(s)"
          >
            <span class="font-medium">/skill:{{ s.id }}</span>
            <span class="truncate text-[11px] text-muted">{{ s.name }}</span>
          </button>
        </div>

        <InputGroup :disabled="isStreaming">
          <template v-if="$slots.attachment" #attachment><slot name="attachment" /></template>

          <div
            ref="editable"
            contenteditable="true"
            role="textbox"
            :aria-label="ai.describeChange"
            data-test-id="chat-input"
            :data-placeholder="ai.describeChange + ' (' + ai.skillsHint + ')'"
            class="block min-h-12 max-h-40 w-full overflow-y-auto whitespace-pre-wrap bg-transparent px-3 py-2.5 text-xs leading-relaxed outline-none empty:before:text-muted empty:before:content-[attr(data-placeholder)] disabled:opacity-60 [&_span[data-token]]:align-baseline"
            @keydown="handleKeydown"
            @input="handleInput"
            @click="updateSuggestions"
            @blur="handleBlur"
            @copy.stop
            @cut.stop
          />

          <template #leading><slot name="leading" /></template>
          <template #model><slot name="model" /></template>
          <template #actions>
            <IconButton
              :label="ai.providerSettings"
              size="sm"
              data-test-id="provider-settings-trigger"
              @click="emit('settings')"
            >
              <icon-lucide-settings class="size-3.5" />
            </IconButton>
            <IconButton
              v-if="isStreaming"
              :label="ai.stopGenerating"
              size="sm"
              data-test-id="chat-stop-button"
              class="border border-border"
              @click="emit('stop')"
            >
              <icon-lucide-square class="size-3" />
            </IconButton>
            <IconButton
              v-else
              :label="ai.sendMessage"
              size="sm"
              type="submit"
              data-test-id="chat-send-button"
              class="bg-accent text-on-accent hover:bg-accent/90 hover:text-on-accent"
              :disabled="!hasText"
            >
              <icon-lucide-send class="size-3.5" />
            </IconButton>
          </template>
        </InputGroup>
        <slot name="overlay" />
      </form>
    </div>
  </TooltipProvider>
</template>
