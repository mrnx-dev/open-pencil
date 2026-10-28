/**
 * DOM assembly for the composer's inline skill chips. Lives outside the Vue component on purpose:
 * chips are inserted at the caret of a contenteditable rather than rendered by Vue, and the lint
 * rules keep browser side effects out of components.
 */

const CHIP_CLASS =
  'inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-on-accent align-baseline mx-0.5 select-none'

export function isSkillChip(node: Node | null | undefined): node is HTMLElement {
  return node instanceof HTMLElement && node.dataset.token !== undefined
}

function createSkillChip(token: string): HTMLElement {
  const chip = document.createElement('span')
  chip.dataset.token = token
  chip.contentEditable = 'false'
  chip.className = CHIP_CLASS
  chip.textContent = token
  return chip
}

/** Inserts a chip plus a trailing caret space at the current selection. False when there is none. */
export function insertSkillChipAtCaret(token: string): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const chip = createSkillChip(token)
  sel.getRangeAt(0).insertNode(chip)
  const space = document.createTextNode('\u00A0')
  chip.after(space)
  const range = document.createRange()
  range.setStartAfter(space)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
  return true
}

/**
 * Selects the plain-text character span [start, end) within the editable DOM, using the same
 * accounting as the composer's plain-text extraction: a chip counts as its token plus a space.
 * False when the span cannot be mapped (DOM changed since the offsets were measured).
 */
export function selectPlainRange(el: HTMLElement, start: number, end: number): boolean {
  const range = document.createRange()
  let plain = 0
  let started = false
  const reached = (offset: number): boolean => started && plain >= offset
  // `start === 0` has no DOM anchor: without this, the range starts on the document node
  // and insertNode later throws HierarchyRequestError ("Only one element on document allowed").
  if (start === 0) {
    range.setStart(el, 0)
    started = true
  }
  const walk = (parent: Node): boolean => {
    for (const node of Array.from(parent.childNodes)) {
      if (isSkillChip(node)) {
        const len = (node.dataset.token ?? '').length + 1 // token plus its trailing space
        if (!started && plain + len >= start) {
          // A chip cannot be split: the start snaps to the whole chip.
          range.setStart(node, 0)
          started = true
        }
        plain += len
        if (reached(end)) {
          range.setEnd(node, node.childNodes.length)
          return true
        }
        continue
      }
      if (node.nodeType === Node.TEXT_NODE) {
        const txt = node as Text
        const len = txt.data.length
        if (!started && plain + len >= start) {
          range.setStart(txt, start - plain)
          started = true
        }
        plain += len
        if (reached(end)) {
          range.setEnd(txt, end - (plain - len))
          return true
        }
      } else if (node.nodeName === 'BR') {
        plain += 1
        if (reached(end)) {
          range.setEnd(node, 0)
          return true
        }
      } else if (walk(node)) {
        return true
      }
    }
    return false
  }
  if (!walk(el) || !started) return false
  // `end` fell short of the DOM's text (offsets measured before a mutation): take up to the end.
  if (plain < end) range.setEnd(el, el.childNodes.length)
  const sel = window.getSelection()
  if (!sel) return false
  sel.removeAllRanges()
  sel.addRange(range)
  return true
}

/**
 * Pastes clipboard content as plain text into the editable: rich HTML from the clipboard would
 * otherwise carry its source styling (colored spans, backgrounds) straight into the composer.
 * True when the event was handled.
 */
export function pastePlainText(event: ClipboardEvent): boolean {
  const editable = event.currentTarget
  const text = event.clipboardData?.getData('text/plain') ?? ''
  if (!(editable instanceof HTMLElement) || !text) return false
  event.preventDefault()
  document.execCommand('insertText', false, text)
  return true
}

/**
 * Backspace handling for chips: with the caret just before a chip node, delete the whole chip
 * instead of splitting it. True when the key was handled.
 */
export function deleteChipAtCaret(event: KeyboardEvent): boolean {
  if (event.code !== 'Backspace') return false
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  if (!range.collapsed) return false
  // Caret between nodes, or at the start of a text node after a chip.
  let before: Node | null = null
  if (range.startContainer.nodeType === 1) {
    before = range.startContainer.childNodes[range.startOffset - 1] ?? null
  } else if (range.startOffset === 0) {
    before = range.startContainer.previousSibling
  }
  if (!isSkillChip(before)) return false
  event.preventDefault()
  before.remove()
  return true
}
