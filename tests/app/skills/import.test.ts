import 'fake-indexeddb/auto'
import { afterEach, expect, test } from 'bun:test'

import { zipSync } from 'fflate'

import { importFromFiles, skillsFromMarkdownTree } from '@/app/skills/import'
import { parseSkillMarkdown } from '@/app/skills/parse'
import { clearSkills, getSkill, listSkills, writeSkill } from '@/app/skills/store'

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

const PEN_SKILL = `---
name: pen-flow
description: Draw with the pen.
---
# Pen flow`

test('nested skill folders group by the folder that directly owns their SKILL.md', () => {
  const skills = skillsFromMarkdownTree({
    'skills/better-ui/SKILL.md': '# Better UI\nNo frontmatter name.',
    'skills/better-ui/guides/colors.md': '# Colors',
    'skills/pen-flow/docs/steps.md': '# Steps',
    'skills/pen-flow/SKILL.md': PEN_SKILL,
    'assets/logo.md': '# Logo'
  })
  const byName = new Map(skills.map((skill) => [skill.name, skill]))
  expect(byName.get('better-ui')).toEqual({
    name: 'better-ui',
    description: undefined,
    content: '# Better UI\nNo frontmatter name.',
    refs: { 'guides/colors.md': '# Colors' }
  })
  expect(byName.get('pen-flow')).toMatchObject({
    content: PEN_SKILL,
    refs: { 'docs/steps.md': '# Steps' }
  })
  expect(byName.get('logo')?.content).toBe('# Logo')
})

test('a GitHub-style zip wrapper imports each nested skill with its refs and name', async () => {
  const zip = zipSync({
    'repo-main/skills/better-ui/SKILL.md': new TextEncoder().encode(DESIGNER_SKILL),
    'repo-main/skills/better-ui/guide/recipes.md': new TextEncoder().encode('# Recipes'),
    'repo-main/README.md': new TextEncoder().encode('# Repo')
  })
  const count = await importFromFiles([new File([zip], 'bundle.zip')])
  expect(count).toBe(2)
  const designer = await getSkill('designer')
  expect(designer?.refs).toEqual({ 'guide/recipes.md': '# Recipes' })
  expect((await listSkills()).map((skill) => skill.id).sort()).toEqual(['designer', 'readme'])
})

test('a tree mixing a root SKILL.md, nested skills, and loose files splits cleanly', () => {
  const skills = skillsFromMarkdownTree({
    'SKILL.md': PEN_SKILL,
    'misc/notes.md': '# Notes',
    'deep/nested/only/SKILL.md': DESIGNER_SKILL
  })
  const byName = new Map(skills.map((skill) => [skill.name, skill]))
  expect(byName.get('pen-flow')?.content).toBe(PEN_SKILL)
  expect(byName.get('notes')?.content).toBe('# Notes')
  expect(byName.get('designer')?.content).toBe(DESIGNER_SKILL)
})

test('an import colliding with a builtin skill keeps the builtin and derives a unique id', async () => {
  await writeSkill({
    ...parseSkillMarkdown(DESIGNER_SKILL),
    name: 'designer',
    source: 'builtin',
    refs: { 'guide.md': '# G' }
  })
  await importFromFiles([new File([DESIGNER_SKILL], 'designer.md')])
  const skills = await listSkills()
  const ids = skills.map((skill) => skill.id).sort()
  expect(ids).toEqual(['designer', 'designer-2'])
  const builtin = skills.find((skill) => skill.id === 'designer')
  expect(builtin?.source).toBe('builtin')
  expect(builtin?.refs).toEqual({ 'guide.md': '# G' })
  expect(skills.find((skill) => skill.id === 'designer-2')).toMatchObject({
    source: 'file',
    content: DESIGNER_SKILL
  })
})
