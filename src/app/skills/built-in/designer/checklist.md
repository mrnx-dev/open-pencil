# Checklist

Run against the finished design before reporting it done: export the affected nodes, inspect the
image, then verify every item below. An item you cannot verify is a limitation to state, not to skip.

**Structure**

- [ ] Every text/background pair passes contrast: 4.5:1 body text, 3:1 large display text.
- [ ] No text is clipped mid-word, no chip or label cut at a container edge, nothing overflows its frame.
- [ ] All wrapping text uses `lineHeight="auto"`; single-line headings keep 1.1–1.2.
- [ ] Spacing follows the 4/8 scale (4, 8, 12, 16, 24, 32, 48, 64, 96) — no arbitrary 13px/27px.
- [ ] Cards nest at most one level; no card inside a card.

**Content**

- [ ] All copy, names, prices, and metrics are plausible and internally consistent — no Lorem Ipsum, no placeholder bars.
- [ ] Icons are vector shapes or `stock_photo`-derived imagery — no emoji standing in as icons.

**Craft**

- [ ] At most two typefaces; the display face appears in the hero only.
- [ ] At most three saturated colors; one accent on a neutral base.
- [ ] No page-level gradient, glow, or heavy shadow; shadows are soft and accent-tinted at 0.08 alpha.
- [ ] The composition is not centered-by-default; alignment varies where hierarchy warrants it.
- [ ] Every Reflex broken during the build was stated in the reply with its reason and replacement.

Adapted from the pre-delivery checks in [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT).
