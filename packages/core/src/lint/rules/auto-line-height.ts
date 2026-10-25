import { textLengthPixels } from '@open-pencil/scene-graph/text'

import { defineRule } from '#core/lint/rule'
import type { LintNode } from '#core/lint/types'

/**
 * Line heights tighter than this stack lines up on multi-line text. A single-line heading can
 * sit tighter, but the layer model cannot tell line counts, so the rule asks for the ratio band
 * the auto behavior follows.
 */
const DEFAULT_MIN_RATIO = 1.1

/** The fixed line-height ratio a text layer enforces, or null when it follows the font. */
function fixedRatio(node: LintNode): number | null {
  if (!node.lineHeight) return null
  return textLengthPixels(node.lineHeight, node.fontSize) / node.fontSize
}

export default defineRule({
  meta: {
    id: 'auto-line-height',
    category: 'typography',
    description: "Text that wraps should follow the font's line height (auto), not a tighter one"
  },
  match: ['TEXT'],
  check(node, context) {
    const config = context.getConfig() as { minRatio?: number } | undefined
    const minRatio = config?.minRatio ?? DEFAULT_MIN_RATIO
    const ratio = fixedRatio(node)
    if (ratio === null || ratio >= minRatio) return
    const lineHeight = textLengthPixels(node.lineHeight!, node.fontSize)
    context.report({
      node,
      message: `Line height ${lineHeight}px is below ${minRatio}× the ${node.fontSize}px font`,
      suggest: 'Set line height to auto so it follows the font',
      data: { fontSize: node.fontSize, lineHeight: Math.round(lineHeight * 100) / 100 }
    })
  }
})
