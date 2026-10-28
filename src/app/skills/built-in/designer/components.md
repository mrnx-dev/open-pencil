# Components

Decide when repeated structures deserve main components and instances instead of clones, and when to
reuse what the document or a library already ships. This reference is the decision guide; the schema
part (element names, the `properties` array, property value grammar, Reka UI control parts) lives
in [design-authoring.md](./design-authoring.md), and the verification pass is in
[checklist.md](./checklist.md).

## When to make a component

- The same structure appears twice or more in the document: two identical cards, a repeated row
  pattern, a nav item used across screens. One main component, then instances.
- Design-system elements are always component candidates: buttons, inputs, selects, badges, tags,
  and every Reka UI control the renderer supports as a `Switch.Root`, `Slider.Root`, and so on.
- The user asks for consistency, a reusable set, or a component library, even for a single element.
- The shape repeats while the content differs: expose the changing text, booleans, and swaps as
  component properties instead of duplicating nodes and hand-editing each copy.

## When not to

- Placeholders and rough sketches: a component's variants must be maintained; do not componentize
  exploration that will be thrown away.
- Structures that appear once and have no second occurrence coming.
- A design still being explored: convert existing clones into a component only after the design
  settles, so the main component does not freeze an unfinished shape.

## Reuse before creating

Before authoring a new component, check whether one already exists: `get_components` lists the
document's components, and `list_libraries` lists the connected libraries. Inserting an existing
library component is `insert_library_component`. When you were about to suggest a component that
already exists, reuse it and say so.

## Recommendation flow

After rendering a screen, name the repeated elements you would extract, in one short list, and offer
to convert them; the user decides which become components. When they accept, or the brief calls for
components from the start:

1. Render the main component and its variants: a `ComponentSet` whose `Component` children carry
   variant names such as `State=On` or `variant=Primary`. One variant per meaningful state.
2. Render the usages as `Instance` elements resolving the component, setting exposed properties by
   name instead of editing cloned child nodes.
3. Re-render the affected subtree with `replace_id` when converting existing copies into instances.

Read [design-authoring.md](./design-authoring.md) with `read_skill_reference` before your first
component render in a session: it defines the exact element and property grammar this flow uses.
