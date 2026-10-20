import 'fake-indexeddb/auto'
import { afterEach, expect, test } from 'bun:test'

import { appendSkillContext, SKILL_CONTEXT_MARKER, stripModelNotes } from '@/app/ai/chat/context'
import { clearSkills, writeSkill } from '@/app/skills/store'

afterEach(async () => {
  await clearSkills()
})

test('a /skill chip appends the skill content as a model note', async () => {
  await writeSkill({
    name: 'designer',
    content: '# Designer\nBuild in sections.',
    refs: { 'design-authoring.md': '# Authoring' },
    source: 'builtin'
  })
  const text = await appendSkillContext('/skill:designer make a landing page')
  expect(text).toContain('/skill:designer make a landing page')
  expect(text).toContain(SKILL_CONTEXT_MARKER)
  expect(text).toContain('# Designer\nBuild in sections.')
  // The skill carries references, so the model learns how to load them.
  expect(text).toContain('read_skill_reference')
})

test('the chip survives stripping, the appended content does not', async () => {
  await writeSkill({ name: 'designer', content: '# Designer\nBody.', source: 'builtin' })
  const text = await appendSkillContext('/skill:designer restyle the hero')
  expect(stripModelNotes(text)).toBe('/skill:designer restyle the hero')
})

test('duplicate and case-mixed chips resolve once', async () => {
  await writeSkill({ name: 'designer', content: '# Designer', source: 'builtin' })
  const text = await appendSkillContext('/skill:designer and /Skill:Designer again')
  expect(text.split('# Designer')).toHaveLength(2)
})

test('a missing skill says so instead of failing the request', async () => {
  const text = await appendSkillContext('/skill:ghost write copy')
  expect(text).toContain('no saved skill has this name')
})

test('a message without chips passes through untouched', async () => {
  const text = 'make the header blue'
  expect(await appendSkillContext(text)).toBe(text)
})
