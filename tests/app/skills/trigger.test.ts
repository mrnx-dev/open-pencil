import 'fake-indexeddb/auto'
import { afterEach, expect, test } from 'bun:test'

import { clearSkills, setSkillEnabled, writeSkill } from '@/app/skills/store'
import { detectSlashQuery, suggestSkills } from '@/app/skills/trigger'

afterEach(async () => {
  await clearSkills()
})

test('detectSlashQuery captures a trailing /word and nothing after a space', () => {
  expect(detectSlashQuery('/skill:designer', 6)).toBe('skill')
  expect(detectSlashQuery('write a hero ', 13)).toBeNull()
  expect(detectSlashQuery('/hello/world', 12)).toBeNull()
})

test('a hidden skill leaves /skill autocomplete but keeps its record', async () => {
  await writeSkill({ name: 'designer', content: 'x', source: 'builtin' })
  expect((await suggestSkills('')).map((skill) => skill.id)).toEqual(['designer'])
  await setSkillEnabled('designer', false)
  expect(await suggestSkills('')).toEqual([])
  expect(await suggestSkills('des')).toEqual([])
  await setSkillEnabled('designer', true)
  expect((await suggestSkills('des')).map((skill) => skill.id)).toEqual(['designer'])
})
