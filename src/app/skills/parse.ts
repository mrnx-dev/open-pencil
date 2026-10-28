/** Shared SKILL.md parsing for bundled seeding and imports. Content stays the full raw file. */
export interface ParsedSkillMarkdown {
  name?: string
  description?: string
  content: string
}

/** A skill folder parsed from any source: the app bundle, a zip, a folder upload, or pasted text. */
export interface SkillFolder {
  name: string
  content: string
  description?: string
  refs: Record<string, string>
}

/** Parse a `---`-delimited frontmatter block's simple `key: value` lines. */
export function parseSkillMarkdown(raw: string): ParsedSkillMarkdown {
  const block = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!block) return { content: raw }
  const parsed: ParsedSkillMarkdown = { content: raw }
  for (const line of block[1].split(/\r?\n/)) {
    const entry = line.match(/^([\w-]+):\s*(.*\S)\s*$/)
    if (entry?.[1] === 'name') parsed.name = entry[2]
    else if (entry?.[1] === 'description') parsed.description = entry[2]
  }
  return parsed
}
