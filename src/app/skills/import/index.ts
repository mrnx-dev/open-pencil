import { strFromU8, unzipSync } from 'fflate'

import { type SkillFolder, parseSkillMarkdown } from '../parse'
import { writeSkill } from '../store'

const MARKDOWN = /\.md$/i

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/')
}

/**
 * A tree of markdown files becomes one skill per folder that directly owns a SKILL.md, at any
 * depth; its files below become reference files keyed by their path inside that folder. A root
 * SKILL.md and .md files outside any skill folder stay flat skills.
 */
export function skillsFromMarkdownTree(tree: Record<string, string>): SkillFolder[] {
  const files = Object.entries(tree).map(([rawPath, content]) => {
    const path = normalizePath(rawPath)
    return { path, parts: path.split('/'), content }
  })
  // Only a directory that directly contains a SKILL.md owns a skill; files elsewhere stay loose.
  const skillFolders = new Set(
    files
      .filter(({ parts }) => parts.length > 1 && parts.at(-1) === 'SKILL.md')
      .map(({ parts }) => parts.slice(0, -1).join('/'))
  )
  const groups = new Map<string, { content?: string; refs: Record<string, string> }>()
  const loose: { path: string; content: string }[] = []
  for (const { path, parts, content } of files) {
    // A folder only owns a SKILL.md that it directly contains, so nested skills group separately.
    let owner: string | undefined
    if (parts.length > 1) {
      for (let i = parts.length - 1; i >= 1; i--) {
        const dir = parts.slice(0, i).join('/')
        if (skillFolders.has(dir)) {
          owner = dir
          break
        }
      }
    }
    if (!owner) {
      loose.push({ path, content })
      continue
    }
    let group = groups.get(owner)
    if (!group) groups.set(owner, (group = { refs: {} }))
    const rel = path.slice(owner.length + 1)
    if (rel === 'SKILL.md') group.content = content
    else group.refs[rel] = content
  }
  const skills: SkillFolder[] = []
  for (const [folder, group] of groups) {
    if (!group.content) continue // Owners always have a SKILL.md by construction.
    const parsed = parseSkillMarkdown(group.content)
    skills.push({
      name: parsed.name ?? folder.slice(folder.lastIndexOf('/') + 1),
      content: group.content,
      description: parsed.description,
      refs: group.refs
    })
  }
  for (const { path, content } of loose) {
    if (!MARKDOWN.test(path)) continue
    const parsed = parseSkillMarkdown(content)
    skills.push({
      name: parsed.name ?? path.slice(path.lastIndexOf('/') + 1).replace(MARKDOWN, ''),
      content,
      description: parsed.description,
      refs: {}
    })
  }
  return skills
}

function markdownTreeFromZip(data: Uint8Array): Record<string, string> {
  const tree: Record<string, string> = {}
  for (const [path, bytes] of Object.entries(unzipSync(data))) {
    if (
      path.endsWith('/') ||
      path.split('/').some((part) => part.startsWith('.') || part.startsWith('__'))
    )
      continue
    if (!MARKDOWN.test(path)) continue
    tree[path] = strFromU8(bytes)
  }
  return tree
}

/** Imports a .zip skill bundle: one record per SKILL.md folder, plus flat files. */
export async function importFromZip(file: File): Promise<number> {
  const skills = skillsFromMarkdownTree(
    markdownTreeFromZip(new Uint8Array(await file.arrayBuffer()))
  )
  if (skills.length === 0)
    throw new Error('The archive contains no SKILL.md or markdown skill files.')
  for (const skill of skills) await writeSkill({ ...skill, source: 'zip' })
  return skills.length
}

/** Imports a picked batch: .zip archives whole, markdown files and folder uploads by their tree. */
export async function importFromFiles(files: FileList | readonly File[]): Promise<number> {
  const list = Array.from(files as FileList)
  const zips = list.filter((file) => /\.zip$/i.test(file.name))
  const tree: Record<string, string> = {}
  for (const file of list) {
    if (!MARKDOWN.test(file.name)) continue
    tree[file.webkitRelativePath || file.name] = await file.text()
  }
  const folder = list.some((file) => file.webkitRelativePath)
  let count = 0
  const skills = skillsFromMarkdownTree(tree)
  for (const skill of skills) {
    await writeSkill({ ...skill, source: folder ? 'folder' : 'file' })
    count += 1
  }
  for (const zip of zips) count += await importFromZip(zip)
  if (count === 0) throw new Error('No SKILL.md or markdown skill files were picked.')
  return count
}

export async function importFromURL(url: string): Promise<number> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`)
  const contentType = response.headers.get('content-type') || ''
  const isZip = url.endsWith('.zip') || contentType.includes('zip')
  let skills: SkillFolder[]
  if (isZip) {
    skills = skillsFromMarkdownTree(
      markdownTreeFromZip(new Uint8Array(await response.arrayBuffer()))
    )
  } else {
    const parsed = parseSkillMarkdown(await response.text())
    const fallback = normalizePath(url).split('/').at(-1)?.replace(MARKDOWN, '') || 'imported'
    skills = [
      {
        name: parsed.name ?? fallback,
        content: parsed.content,
        description: parsed.description,
        refs: {}
      }
    ]
  }
  if (skills.length === 0) throw new Error('The URL contains no markdown skill files.')
  for (const skill of skills) await writeSkill({ ...skill, source: 'url' })
  return skills.length
}

export async function importFromText(name: string, content: string): Promise<number> {
  const parsed = parseSkillMarkdown(content)
  const skillName = (parsed.name ?? name).trim()
  if (!skillName || !content.trim()) throw new Error('Name and content required')
  await writeSkill({ name: skillName, content, description: parsed.description, source: 'text' })
  return 1
}

export function isFolderDrop(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.items).some(
    (item) => item.webkitGetAsEntry()?.isDirectory === true
  )
}
