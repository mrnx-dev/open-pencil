# Render and replace

How to build a new design and edit an existing one with the chat tools, without breaking the document.

## Building new designs with `render`

- `render` takes a design JSX string and returns the created node IDs. Use those IDs for every follow-up
  instead of searching again.
- Build in manageable sections: render the page frame first, then fill each section with its own call.
  Wait for the returned IDs of one section before referencing it in the next.
- Give every layer you will want to address later an explicit `name`. Names are how `replace_id` and the
  inspection tools find things in the returned tree.
- Do not write HTML files, terminal scripts, or temporary documents to "plan" the design. The canvas is
  the medium; explain the composition briefly in text instead.

## Editing with `replace_id`

- To change a subtree's structure or content, render the improved subtree and use `replace_id` to swap it
  in, rather than deleting the original before the new content exists.
- Keep references to the IDs returned by `replace_id`; the swap re-creates nodes and the old IDs may die.
- Re-render a whole tree only when its structure must change. Targeted property tools
  (`set_fill`, `set_text`, `set_layout`, …) are cheaper and safer for everything else.

## Diagnosing

- Use `describe` on a relevant subtree to diagnose layout; use `get_node` or `find_nodes` for precise
  reads. Batch related fixes in one pass.
- Diagnose a failed edit before replacing content. Do not blindly delete nodes after a fixed retry
  count: a failed property set is usually a type, reference, or sizing problem, not a wrong node.
- When `undo` is available, revert your own mistake with it instead of rebuilding the previous state by
  hand.

## Verifying

- Before reporting, run `diff_changes`: it lists what this run changed on the page, or under one node,
  against its state before the run. Nothing needs to be cloned for it.
- Before a risky change to an existing design, `clone_node` the affected subtree as a reference when the
  tool is available. Afterwards `diff_jsx` or `diff_create` against the reference confirms the structural
  change, and `diff_visual` confirms only the intended region changed: check `changedBounds` against your
  target and inspect the returned image. Delete the clone afterwards.
- Export the affected nodes with `export_image`, not the whole page, and inspect the image. Check wrapping
  with longer content, narrower containers, and component edits. Resolve overflow and contrast problems at
  their source.
- Select and focus the result with the selection and viewport tools so the user can see it. Do not
  repeatedly refocus while the user works elsewhere.

## Budget

- Respect the remaining tool budget. When a warning appears, finish the current bounded step and report
  what remains instead of opening a new subtask.
