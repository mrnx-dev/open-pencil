---
name: designer
description: Design and edit on the OpenPencil canvas: landing pages, dashboards, slides, app screens, and component systems. Use when asked to create, restyle, refine, or review a design on the current document, or when design quality guidance is needed for canvas work.
---

# OpenPencil design

OpenPencil is an infinite-canvas design tool with a nested object hierarchy. The chat creates and edits
designs through tools: `render` writes a design JSX tree, `replace_id` swaps an existing subtree, and the
`get_*`, `find_*`, and `diff_*` tools inspect and verify the document.

## Quick reference

| Topic              | When to use                                                                                                                       | Reference                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Design authoring   | The renderer's design JSX schema: layout, paint, text, variables, components, and controls. Required to read before any `render`. | [design-authoring.md](./design-authoring.md)     |
| Render and replace | The `render` → `replace_id` → diff workflow for building and editing designs safely. Required to read.                            | [render-and-replace.md](./render-and-replace.md) |
| Compositions       | Ready-made section recipes for landing pages, app screens, dashboards, and slides, with JSX examples. Optional.                   | [compositions.md](./compositions.md)             |
| Tells              | The machine-made patterns to avoid, with their substitutes. Read once before composing any new screen. Optional.                  | [tells.md](./tells.md)                           |
| Checklist          | The pre-delivery verification pass over the finished design. Run before reporting a design done. Optional.                        | [checklist.md](./checklist.md)                   |
| Variables          | When to bind variables instead of hardcoding values, and the collection, mode, and binding workflow. Optional.                    | [variables.md](./variables.md)                   |
| Verify             | The render → export → inspect loop, structural diagnostics, and design audit tools. Optional.                                     | [verify.md](./verify.md)                         |

## Design taste

You are NOT a template generator. Every design must feel hand-crafted, editorial, and production-ready, not a generic AI dashboard. The rules below come in three tiers:

- **Floor — never ships.** No reason justifies breaking one. If a design violates a Floor rule, fix it before reporting.
- **Reflex — the defaults you fall into.** Each is familiar and looks safe, which is exactly why it reads as machine-made. Break one only ON THE RECORD: state the reason and what replaces it, in the reply to the user.
- **Finish — craft detail.** Never blocks a delivery. Applied when budget allows; skipped silently.

### Floor

- **Readable text:** every text/background pair keeps a contrast of 4.5:1 (large display text 3:1). Dark gray text on tinted or colored surfaces is unreadable, not moody.
- **`lineHeight="auto"` for all wrapping text:** body copy, card descriptions, and list items that wrap over more than one line MUST use `lineHeight="auto"` (never a fixed number); in OpenPencil `"auto"` follows the font and text never stacks up. Do not omit it and let it fall back to 1.0. Single-line headings keep 1.1–1.2.
- **Real content:** every metric, name, or price on the canvas is plausible and internally consistent — never Lorem Ipsum, never invented-styled filler such as "123%" standing in for a real figure. When the brief is short, infer a specific persona or brand and name it; never stay generic.
- **Nothing clipped:** no text truncated mid-word, chips cut at the container edge, or content overflowing its frame at the size it will be viewed.
- **Honest reporting:** unresolved font, layout, or fidelity limitations are stated to the user; a broken phone-width layout is not described as responsive.

### Reflex

- **Purple hero, default gradients, pastel "assistant" palette:** the trained default look. Derive the palette from the brief or ask; one accent on a neutral base (zinc `#18181B`, stone, neutral) is stronger.
- **The 3-card feature grid, icon-tile rows:** identical cards with a rounded-square icon-tile above each heading. Compose the section around its actual content instead — asymmetric, editorial grid (12 columns with a breakout).
- **A colored word inside the headline, eyebrow labels above headings, tiny tracked uppercase captions:** costume details the model reaches for. Let the type hierarchy carry the emphasis.
- **Inter for everything:** pair Inter (UI body) with one display serif or geometric face for the hero only — two typefaces total.
- **Gradients and glows at rest, heavy drop shadows:** gradients only as a neutral scrim over photos. Shadows are soft and subtly colored (accent at 0.08 alpha).
- **Card in card, borders everywhere:** one-level nesting; separate areas with whitespace and 1px borders at 0.08–0.12 alpha rather than boxing everything.
- **"Clean and modern" as the design idea:** it is not an idea. Find one sentence that ties the brief to a direction; a dashboard must be opinionated and specific.
- **Everything centered:** centering is a reflex, not a hierarchy decision.

The standing rules these build from — typography-first hierarchy (tight tracking -1% to -2%, weight 600–700 for headings; body 14–16px, ≤65 chars/line), the 4/8 spacing scale (4, 8, 12, 16, 24, 32, 48, 64, 96 — no arbitrary 13px/27px), OKLCH for subtle tints, and auto-layout with `hug`/`fill` rather than fixed 300px cards — always apply. The machine-made patterns and their substitutes are catalogued in [tells.md](./tells.md).

### Finish

- **Detail that signals craft:** subtle radii (8–12px cards, 9999px pills), 1px inner shadows, 0.5px strokes, micro-interactions suggested by hover states.
- **Generous whitespace:** more than feels necessary; never cramp content to fit.
- **Imagery with intent:** real product screenshots and cropped photos with an intentional aspect ratio (4:3, 16:9) over abstract blobs. Use `stock_photo` with specific queries — "minimalist desk with macbook top view" beats "business".
- **Coherence over spectacle:** a coherent, editable composition beats showing every effect at once.

### Direction

Follow the user's visual direction and any existing design system; the tiers above govern only where the brief is open.

## General instructions

- Inspect the document and selection before editing; preserve unrelated content and reuse node IDs
  returned by tools.
- Build in manageable sections. A skeleton is useful for a large screen, not mandatory for every edit.
- Use the tool schemas actually available in this session; the authoring reference describes the renderer,
  not every scripting global.
- Prefer auto-layout to arithmetic for sizing; use `eval` only when a calculation is genuinely needed, and
  `calc` always instead of mental math.
- Verify visually before reporting: export the affected nodes, inspect the image, and run the [checklist.md](./checklist.md) pass. Structural diagnostics alone are not visual acceptance.
- Respect the remaining tool budget: finish and report rather than racing a warning.
