import { listSkills } from './store'

export interface SkillSuggestion {
  id: string
  name: string
  description?: string
}

const SLASH_RE = /(?:^|\s)\/([a-z0-9-_]*)$/i

export function detectSlashQuery(text: string, cursorPos: number): string | null {
  const before = text.slice(0, cursorPos)
  const m = before.match(SLASH_RE)
  return m ? m[1] : null
}

export async function suggestSkills(query: string): Promise<SkillSuggestion[]> {
  const all = await listSkills()
  const q = query.toLowerCase()
  return all
    .filter(
      (s) => s.enabled !== false && (!q || s.id.includes(q) || s.name.toLowerCase().includes(q))
    )
    .map((s) => ({ id: s.id, name: s.name, description: s.description }))
    .slice(0, 8)
}

export function applySkillToPrompt(
  currentText: string,
  cursorPos: number,
  skillContent: string
): { text: string; newCursor: number } {
  const before = currentText.slice(0, cursorPos)
  const after = currentText.slice(cursorPos)
  const slashStart = before.lastIndexOf('/')
  if (slashStart === -1) return { text: currentText, newCursor: cursorPos }
  const prefix = currentText.slice(0, slashStart)
  // inject skill content as context, keep user editability
  const injected = `\n\n[Skill: ${skillContent.slice(0, 200)}...]\n`
  const text = prefix + injected + after
  return { text, newCursor: prefix.length + injected.length }
}
