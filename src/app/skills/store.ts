import { openDB, type DBSchema } from 'idb'

export interface SkillRecord {
  id: string // normalized from the SKILL.md `name`, e.g. "designer"
  name: string
  description?: string
  content: string // SKILL.md raw
  refs?: Record<string, string> // bundled sibling reference files, keyed like the SKILL.md's relative links
  /** False hides the skill from /skill autocomplete while keeping its chip injectable. */
  enabled?: boolean
  source: 'zip' | 'folder' | 'file' | 'url' | 'text' | 'builtin'
  createdAt: number
  updatedAt: number
}

interface SkillsDB extends DBSchema {
  skills: { key: string; value: SkillRecord; indexes: { name: string } }
}

const DB_NAME = 'open-pencil-skills'
const STORE = 'skills'

function getDB() {
  return openDB<SkillsDB>(DB_NAME, 1, {
    upgrade(db) {
      const store = db.createObjectStore(STORE, { keyPath: 'id' })
      store.createIndex('name', 'name')
    }
  })
}

function normalizeId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function writeSkill(input: {
  name: string
  content: string
  description?: string
  refs?: Record<string, string>
  enabled?: boolean
  source: SkillRecord['source']
}): Promise<SkillRecord> {
  const db = await getDB()
  const id = normalizeId(input.name)
  const existing = await db.get(STORE, id)
  const now = Date.now()
  const record: SkillRecord = {
    id,
    name: input.name,
    description: input.description,
    content: input.content,
    refs: input.refs,
    // A refresh keeps the user's visibility choice; only fresh skills default to shown.
    enabled: input.enabled ?? existing?.enabled,
    source: input.source,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  }
  await db.put(STORE, record)
  return record
}

/** Shows or hides a skill in /skill autocomplete, keeping its stored content. */
export async function setSkillEnabled(idOrName: string, enabled: boolean): Promise<void> {
  const record = await getSkill(idOrName)
  if (!record || record.enabled === enabled) return
  const db = await getDB()
  await db.put(STORE, { ...record, enabled })
}

export async function listSkills(): Promise<SkillRecord[]> {
  const db = await getDB()
  return db.getAll(STORE)
}

export async function getSkill(idOrName: string): Promise<SkillRecord | undefined> {
  const db = await getDB()
  const id = normalizeId(idOrName)
  return db.get(STORE, id)
}

export async function deleteSkill(idOrName: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE, normalizeId(idOrName))
}

export async function clearSkills(): Promise<void> {
  const db = await getDB()
  await db.clear(STORE)
}
