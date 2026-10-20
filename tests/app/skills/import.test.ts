import 'fake-indexeddb/auto'
import { afterEach, expect, test } from 'bun:test'

import { zipSync } from 'fflate'

import { importFromFiles, importFromText, skillsFromMarkdownTree } from '@/app/skills/import'
import { clearSkills, getSkill, listSkills } from '@/app/skills/store'

afterEach(async () => {
  await clearSkills()
})

const DESIGNER_SKILL = `---
name: designer
description: Design with the OpenPencil canvas.
---
# Designer
Use render, then replace_id.`

test('a SKILL.md folder becomes one skill; siblings become refs keyed inside the folder', () => {
  const [skill] = skillsFromMarkdownTree({
    'designer/SKILL.md': DESIGNER_SKILL,
    'designer/render-and-replace.md': '# Render and replace',
    'designer/guide/compositions.md': '# Compositions',
    'assets/logo.txt': 'unrelated'
  })
  expect(skill).toEqual({
    name: 'designer',
    description: 'Design with the OpenPencil canvas.',
    content: DESIGNER_SKILL,
    refs: {
      'render-and-replace.md': '# Render and replace',
      'guide/compositions.md': '# Compositions'
    }
  })
})

test('frontmatter names override folder names, and loose files stay flat skills', () => {
  const skills = skillsFromMarkdownTree({
    'pen-tools/SKILL.md': DESIGNER_SKILL,
    'notes/todo.md': '# Todo'
  })
  expect(skills.find((skill) => skill.content === DESIGNER_SKILL)?.name).toBe('designer')
  expect(skills.find((skill) => skill.content === '# Todo')?.name).toBe('todo')
})

test('a folder without SKILL.md keeps its files as loose skills', () => {
  const skills = skillsFromMarkdownTree({
    'notes/todo.md': '# Todo',
    'notes/done.md': '# Done'
  })
  expect(skills.map((skill) => skill.name).sort()).toEqual(['done', 'todo'])
})

test('importFromFiles splits zip and markdown picks the same way', async () => {
  const zip = zipSync({
    'designer/SKILL.md': new TextEncoder().encode(DESIGNER_SKILL),
    'designer/render-and-replace.md': new TextEncoder().encode('# Render and replace')
  })
  const files = [new File([zip], 'bundle.zip'), new File(['# Flat\nOne skill.'], 'flat.md')]
  const count = await importFromFiles(files)
  expect(count).toBe(2)
  const designer = await getSkill('designer')
  expect(designer?.refs).toEqual({ 'render-and-replace.md': '# Render and replace' })
  expect(designer?.description).toBe('Design with the OpenPencil canvas.')
  expect((await listSkills()).map((skill) => skill.id).sort()).toEqual(['designer', 'flat'])
})

test('a pasted skill takes its frontmatter name and records the source', async () => {
  await importFromText('ignored', DESIGNER_SKILL)
  const skills = await listSkills()
  expect(skills).toHaveLength(1)
  expect(skills[0]).toMatchObject({
    id: 'designer',
    name: 'designer',
    source: 'text',
    content: DESIGNER_SKILL
  })
})
