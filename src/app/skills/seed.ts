import { JSX_REFERENCE } from '@open-pencil/design-jsx'

import { type SkillFolder, parseSkillMarkdown } from './parse'
import { deleteSkill, getSkill, listSkills, writeSkill } from './store'

// Bundled skills, one folder per skill in the SKILL.md format: built-in/<name>/SKILL.md with a
// frontmatter `name` (+ optional `description`) and sibling reference .md files. Globbed as raw text
// at build time, which is the browser equivalent of reading a vendor skills folder from disk.
const bundledFiles = import.meta.glob<string>('./built-in/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
})

export function bundledSkills(): SkillFolder[] {
  const skills: SkillFolder[] = []
  for (const [path, content] of Object.entries(bundledFiles)) {
    // Paths look like './built-in/<folder>/SKILL.md' with nested reference files below.
    const rel = path.slice('./built-in/'.length)
    const sep = rel.indexOf('/')
    const folder = sep === -1 ? undefined : rel.slice(0, sep)
    if (folder === undefined) continue
    const key = rel.slice(sep + 1)
    let skill = skills.find((s) => s.name === folder)
    if (!skill) skills.push((skill = { name: folder, refs: {}, content: '' }))
    if (key === 'SKILL.md') {
      const parsed = parseSkillMarkdown(content)
      skill.content = content
      skill.description = parsed.description
      if (parsed.name) skill.name = parsed.name
      // The renderer's authoring reference is composed from its package source rather than copied
      // into the skill folder, then stored under the name the SKILL.md links to. The reference is
      // joined verbatim: dedenting it would flatten its indented code examples.
      if (/\[.*?\]\(\.\/design-authoring\.md\)/.test(content)) {
        skill.refs['design-authoring.md'] = JSX_REFERENCE
      }
    } else {
      skill.refs[key] = content
    }
  }
  return skills.filter((s) => s.content).sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Keep the skill store in line with the bundled skills: seed missing ones, refresh builtin copies
 * whose content changed, and drop builtin records left over from previous bundles (for example old
 * seed examples). User-imported skills — any source but `builtin` — are never touched.
 */
export async function syncBundledSkills() {
  try {
    const bundledIds = new Set<string>()
    for (const bundledSkill of bundledSkills()) {
      const record = await getSkill(bundledSkill.name)
      if (record?.source === 'builtin' && record.content === bundledSkill.content) {
        // Already current: keep the record (and any user tweaks to its description) as is.
        bundledIds.add(record.id)
        continue
      }
      // A refresh overwrites a stale builtin copy.
      const written = await writeSkill({ ...bundledSkill, source: 'builtin' })
      bundledIds.add(written.id)
    }
    for (const record of await listSkills()) {
      if (record.source === 'builtin' && !bundledIds.has(record.id)) await deleteSkill(record.id)
    }
  } catch (error) {
    // IndexedDB may be unavailable (e.g. private contexts): skip this run.
    console.warn('[skills] syncing bundled skills failed:', error)
  }
}
