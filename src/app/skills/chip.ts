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
