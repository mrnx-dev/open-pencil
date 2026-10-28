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
    "Read one file bundled with a skill: its SKILL.md instructions, or a reference file its content links, such as an authoring guide. Use this instead of guessing a file's contents, for example to load another skill the current skill tells you to hand off to.",
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
        'File name: "SKILL.md" reads the skill\'s own instructions; otherwise a reference file name exactly as the skill content links it, e.g. "design-authoring.md"'
      )
    )
  }),
  execute: async (_figma, { skill, reference }) => {
    const record = await getSkill(skill)
    if (!record) {
      return { error: `No skill named "${skill}" exists. Try the /skill autocomplete names.` }
    }
    // A skill referenced from another skill's content has nothing injected, so its SKILL.md is
    // reachable only here; guessing reference names was the failure this prevents.
    if (reference === 'SKILL.md') {
      return { skill: record.id, reference, content: record.content }
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
