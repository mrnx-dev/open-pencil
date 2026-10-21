---
title: Skills
description: Teach the AI chat OpenPencil workflows with skills - bundled guidance the model reads on demand.
---

# Skills

A skill is a saved set of instructions the AI chat can follow: how to build designs in OpenPencil, a
team's component conventions, or any workflow you want the model to repeat. Skills are saved on this
device and are available in every document and conversation.

OpenPencil ships one bundled skill, **designer**, which teaches the canvas workflow: composing
designs with the chat's design tools and verifying the result on screen. It is always available and
cannot be deleted, but you can hide it from autocomplete (see below).

## Using a skill

Type `/` in the chat composer and pick a skill, or type its chip directly:

```
/skill:designer Design a landing page for a bicycle repair studio
```

Submitting the message injects the skill's instructions for the model. If the skill links larger
reference files, the model loads them on demand with the `read_skill_reference` tool, so a skill can
stay light in the conversation while keeping deep documentation a tool call away. The chip itself
stays visible as part of your message.

## Installing skills

Open **Settings → AI** and find the **Skills** section. Import from:

- **File:** a `.zip` archive of one or more skills, or a single markdown file.
- **Folder:** a directory containing a `SKILL.md` plus sibling reference files.
- **URL:** a link to a `.zip` bundle or a single markdown file, fetched at import time.

Imported folders follow a simple layout: each folder with a `SKILL.md` becomes one skill, and other
markdown files beside it become its references. `SKILL.md` starts with two frontmatter fields, `name`
and a one-line `description`, followed by the instructions themselves:

```markdown
---
name: brand-reviewer
description: Review designs against our brand rules. Use when auditing colors or typography.
---

Check every screen against the brand palette before reporting...
```

The description is what the model sees when deciding a skill applies, so make it concrete. Loose
`.md` files import as single-file skills.

## Managing skills

The Settings list shows each skill's name, description (or its `/skill:` name), how many reference
files it links, and where it came from: bundled, zip, folder, file, or URL.

- **Show / hide:** the eye toggle hides a skill from the `/` autocomplete. A hidden skill still
  works when you type its `/skill:<name>` chip by hand.
- **Delete:** imported skills can be removed; the bundled designer skill cannot. Deleting a skill
  does not affect conversations that already reference it.
- Bundled skills are refreshed automatically when the app updates them, while preserving your
  show/hide choice.

## How injection works

For how chips are resolved on submit and how reference files stay out of the
context window until the model asks for them, see [AI Chat](/development/ai-chat).
