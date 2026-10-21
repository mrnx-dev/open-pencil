# Variables

Documents can hold variables: named COLOR, FLOAT, STRING, or BOOLEAN values grouped in collections,
each collection holding one or more modes (the columns — Light and Dark, Compact and Relaxed). Layers
reference a variable instead of carrying a literal, so changing the mode or the value updates every
bound layer at once.

## When to use variables

- **Use them** when a value belongs to a system the user will iterate on: theme colors and spacing
  that must switch with a mode, a token set the rest of the design keeps citing, anything the brief
  calls a "design system". Also when the user's brief already mentions variables or themes.
- **Hardcode** when the document is a one-off mock with no mode dimension and no reused token — a
  variable per literal is ceremony, not structure.
- Follow an existing system the user supplies before inventing tokens (see SKILL.md's design taste).

## Collections and modes

Create variables only inside a collection; `create_collection` starts one with a single mode.

1. `create_collection` with the collection name, e.g. "Brand".
2. `create_variable` per variable: name, type (`COLOR`, `FLOAT`, `STRING`, or `BOOLEAN`), the
   collection ID, and an initial value (hex for COLOR, a number for FLOAT, `true`/`false` for
   BOOLEAN). Name them so references read well: `Surface/base`, `Space/small`, `Type/body`.
3. More values per mode with `set_variable`: the variable ID, the mode ID, and the value. One mode is
   the default; additional modes come from `import_design_tokens`.

Adding modes: `import_design_tokens` creates them when tokens arrive with their modes attached —
one DTCG file per mode in a folder (how imports from other tools export modes), a `.resolver.json`
that lists its files, or a Tokens Studio file with `$themes`. Collections and variables with known
names are updated in place; nothing is deleted. Importing two files named for Light and Dark into
collection "Brand" gives it two modes with two columns of values.

Inspect before you build:

- `list_collections` / `get_collection` — collections, their modes, and the active mode.
- `list_variables` / `get_variable` / `find_variables` — variables by type or name pattern.

## Referencing variables from JSX

Create the variables **before** the `render` that references them — a reference to a missing
variable is an error, not a silent zero.

- `designVar('name')` wraps one reference into any supported prop:
  `bg={designVar('Surface/base')}`, `size={designVar('Type/body')}`,
  `gap={designVar('Space/small')}`.
- `defineVars` groups references under short keys so a render reads cleanly:
  `const v = defineVars({ base: 'Surface/base', body: 'Type/body' })` then `bg={v.base}`.
  It groups references into the JSX only; it never creates the underlying variable.
- COLOR references work in paint props (`bg`, `fill`, `stroke`, text `color`). FLOAT references work
  in the scalar props: `w`, `h`, `gap`, padding, corner radii, `strokeWidth`, `opacity`, text
  `size`, `lineHeight`, `letterSpacing`, and the row/column gaps. Give these props numbers or
  variable references, never strings like `"12px"`.

```jsx
<Frame
  name="Card"
  w={280}
  h="hug"
  flex="col"
  gap={designVar('Space/small')}
  p={designVar('Space/medium')}
  bg={designVar('Surface/base')}
>
  <Text
    name="Message"
    w="fill"
    size={designVar('Type/body')}
    letterSpacing={designVar('Type/body-tracking')}
    lineHeight="auto"
    color={designVar('Text/primary')}
  >
    Reads from the theme, switches with the mode.
  </Text>
</Frame>
```

## Binding fields without a shorthand

When no JSX shorthand targets a field, bind it directly with `bind_variable`: the node ID, the field
path, and the variable ID. Field paths are indexed for paints — `fills/0/color`, `strokes/0/color` —
and named for scalars: `opacity`, `width`, `height`, `cornerRadius`, `fontSize`, `letterSpacing`,
`itemSpacing`, `paddingLeft/Right/Top/Bottom`, `strokeWeight`, `visible` (BOOLEAN), `fontFamily`
(STRING), and more; the tool schema lists them all. `unbind_variable` removes a binding with the
same node ID and field path.

## Scalar layouts and modes

References preserve real graph bindings — they do not copy a value into the node. That is the point:
recomputing values updates the layer live, and switching a collection's active mode restyles every
bound layer. Three consequences of the scalar case:

- A later `set_variable` call re-lays out bound widths, gaps, and text sizes on its own.
- Scalar-bound layout (a `w` or `gap` bound to a FLOAT variable) resolves from the mode inherited at
  creation time. Set the intended mode on the parent **before** creating scalar-bound content.
- After switching modes, verify geometry as well as paint: export the region and check nothing
  clipped or collapsed.

## Bulk tokens

`import_design_tokens` is also the shortest path when the user already has tokens: W3C DTCG files
become variables and collections; typography and shadow tokens become text and effect styles. When a
brief arrives as a token JSON, import it instead of re-typing values with `create_variable`.
