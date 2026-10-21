# Verify

Every edit is finished when you have seen the result, not when the tool call succeeded. This is the
verification loop SKILL.md summarizes as "verify visually", expanded.

## The main loop

1. **Change** — `render` / `replace_id`, or a targeted property tool (`set_fill`, `set_text`,
   `set_layout`, …).
2. **Export the affected region** with `export_image` on the changed node (or its parent section) —
   not the whole page. `export_svg` and `export_pdf` exist for deliverable exports, not for checking.
3. **Inspect the image** like a reviewer with fresh eyes. Run through the checklist:
   - Does the layout hold, or did a column collapse, overlap, or drift to the origin?
   - Is any content truncated — text clipped, buttons cut off, rows shortened? Check with longer
     copy and narrower containers than the obvious case.
   - Is contrast sufficient — text on imagery, gray-on-gray, the accent on its background?
   - Is spacing intentional — elements on the 4/8 scale, groups separated, not squashed or floating?
4. **Fix at the source** and loop again. A clipped label is a sizing or wrap problem to solve in the
   structure (`w="fill"`, `lineHeight="auto"`), never `overflow="hidden"` to hide it.
5. **Point the user at the result** — select and frame the finished node so it is on screen.

Export after each bounded change, not after ten: finding which of five edits broke the layout via one
final image costs more calls than checking along the way.

## Structural diagnostics

Structural tools tell you what the graph contains; they never tell you what it looks like.

- `get_jsx` returns a subtree as design JSX — read it after a messy edit to see what actually landed,
  or before re-rendering to know exactly what you are replacing.
- `diff_jsx` compares a subtree against a base (or a clone taken before a risky change, with
  `diff_create`) and shows the structural delta: what moved, changed, or vanished.
- `diff_changes` lists what this run changed on the page or under one node — cheap, no setup.
- `describe` reports layout and bounds; `get_node` / `find_nodes` / `node_bounds` give precise reads.
  Batch related questions in one call.
- `lint` finds rule violations (contrast, touching targets, off-scale values); `lint_fix` applies
  fixable ones. Fix the source, not the symptom, when a violation reflects design intent.

## Design audits

Before reporting a whole screen or page finished, run the audit tools and skim their findings:

- `analyze_colors` — palette drift, near-duplicate swatches, contrast problems.
- `analyze_spacing` — values off the scale, inconsistent padding, crowding.
- `analyze_typography` — too many sizes and weights, sub-scale text.
- `analyze_clusters` — elements sitting at odd, near-miss positions.

Treat their output as leads: an audit does not judge composition, hierarchy, or whether the design
answers the brief.

## Structural ≠ visual

`describe` reporting clean bounds, `diff_jsx` showing the intended delta, and a green `lint` are all
necessary, and none of them is acceptance. Typography and spacing failures — a headline wrapped into
two lines, a hero's dead space, a button touching its label — are invisible to every structural tool
and obvious in one exported image. Report results with evidence from both sides: what the structure
shows you saw, and what the image showed you.
