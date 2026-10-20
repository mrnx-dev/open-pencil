import 'fake-indexeddb/auto'
import { afterEach, expect, test } from 'bun:test'

import { readSkillReference } from '@/app/ai/tools/skills'
import { clearSkills, writeSkill } from '@/app/skills/store'

afterEach(async () => {
  await clearSkills()
})

test('read_skill_reference resolves a bundled skill reference by name', async () => {
  await writeSkill({
    name: 'designer',
    content: 'SKILL.md linking [design-authoring.md](./design-authoring.md)',
    refs: { 'design-authoring.md': '# Design authoring\n' },
    source: 'builtin'
  })
  const result = await readSkillReference.execute(null as never, {
    skill: 'designer',
    reference: 'design-authoring.md'
  })
  expect(result).toEqual({
    skill: 'designer',
    reference: 'design-authoring.md',
    content: '# Design authoring\n'
  })
})

test('names are normalized like the /skill autocomplete ids', async () => {
  await writeSkill({ name: 'My Design Skill', content: 'x', source: 'zip' })
  const result = await readSkillReference.execute(null as never, {
    skill: 'My-Design-Skill',
    reference: 'anything.md'
  })
  expect(result).toEqual({ error: 'Skill "My Design Skill" has no reference files.' })
})

test('unknown skills and references are reported with what exists', async () => {
  const missing = await readSkillReference.execute(null as never, {
    skill: 'nonsense',
    reference: 'x.md'
  })
  expect(missing).toEqual({
    error: 'No skill named "nonsense" exists. Try the /skill autocomplete names.'
  })

  await writeSkill({
    name: 'designer',
    content: 'x',
    refs: { 'render-and-replace.md': '# Render', 'guide/code.md': '# Code' },
    source: 'builtin'
  })
  const wrong = await readSkillReference.execute(null as never, {
    skill: 'designer',
    reference: 'design-authoring.md'
  })
  expect(wrong).toEqual({
    error:
      'Skill "designer" has no reference "design-authoring.md". Available references: render-and-replace.md, guide/code.md.'
  })
})
