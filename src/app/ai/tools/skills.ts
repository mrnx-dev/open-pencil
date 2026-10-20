import * as v from 'valibot'

import { defineTool } from '@open-pencil/core/tools'

import { getSkill } from '@/app/skills/store'

/**
 * Progressive disclosure for the in-app chat: a seeded or imported skill ships as SKILL.md plus
 * sibling reference files (see `src/app/skills/`). The model reads the compact SKILL.md on its own
 * from the injected skill content and pulls the larger references it links through this tool.
 */
export const readSkillReference = defineTool({
  name: 'read_skill_reference',
  description:
    "Read one reference file bundled with a skill, such as a skill's authoring guide. Use this when a skill's content links a reference file you need, instead of guessing its contents.",
  execution: { kind: 'async', mutation: 'none' },
  capabilities: ['settings:read'],
  exposure: { ai: true },
  input: v.strictObject({
    skill: v.pipe(
      v.string(),
      v.description('Skill name as listed by /skill autocomplete, e.g. "designer"')
    ),
    reference: v.pipe(
      v.string(),
      v.description(
        'Reference file name exactly as the skill content links it, e.g. "design-authoring.md"'
      )
    )
  }),
  execute: async (_figma, { skill, reference }) => {
    const record = await getSkill(skill)
    if (!record) {
      return { error: `No skill named "${skill}" exists. Try the /skill autocomplete names.` }
    }
    const content = record.refs?.[reference]
    if (content === undefined) {
      const available = Object.keys(record.refs ?? {})
      return available.length === 0
        ? { error: `Skill "${record.name}" has no reference files.` }
        : {
            error: `Skill "${record.name}" has no reference "${reference}". Available references: ${available.join(', ')}.`
          }
    }
    return { skill: record.id, reference, content }
  }
})
