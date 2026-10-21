# Compositions

Section recipes for the deliverables this tool is most asked for. They are starting points, not
templates: keep the taste rules in SKILL.md (typography, spacing scale, color, imagery) in charge of
every decision. Build one section per `render` call, or replace a whole section with `replace_id`
once its structure must change, the mechanics are in [render-and-replace.md](./render-and-replace.md).

## Landing page

A landing page sells one action. Treat the hero as the entire pitch compressed: what this is, why it
matters, what to do next.

- **Hero:** one headline idea, one short subheadline, one primary button. Lead with the
  transformation ("Finally feel in control") over the outcome ("Ship faster") and the feature
  ("AI writing assistant"). Show the visitor's future (people in the outcome state, not abstract
  blobs) with an intentional aspect ratio (4:3, 16:9); place photos after render with `stock_photo`
  and `set_image_fill`. Text over imagery needs an overlay, shadow, or its own container.
- **Section rhythm:** alternate dark and light backgrounds and alternate density; never stack two
  sections of the same weight. Dark bands carry credibility and depth; light bands carry
  explanation and detail.
- **Narrative flow:** promise → proof → action. What it is, why it works, why you can trust it, what
  to do next. Proof sections are testimonials, metrics, or product detail; end on one clear call to
  action.
- **One conversion accent:** reserve the accent color for buttons and primary links across the whole
  page. Decorative elements stay neutral so the call to action is always the strongest element.
- Pick one alignment axis per section and keep it; group related elements tightly, separate groups
  generously.

```jsx
<Frame name="Hero" w={1440} h="hug" flex="col" gap={32} px={96} py={96} bg="#18181B">
  <Text
    name="Headline"
    w={640}
    size={64}
    weight={700}
    lineHeight={1.1}
    letterSpacing="-1.5%"
    color="#FAFAFA"
  >
    Invoicing that runs itself
  </Text>
  <Text name="Subheadline" w={560} size={18} lineHeight="auto" color="#A1A1AA">
    Send the first invoice in five minutes and never chase a payment again.
  </Text>
  <Frame name="CTA" h="hug" flex="row" gap={12} px={28} py={18} rounded={9999} bg="#7C5CFF">
    <Text name="Label" size={16} weight={600} color="#FFFFFF">
      Start free
    </Text>
  </Frame>
</Frame>
```

A proof section flips the palette and drops the density:

```jsx
<Frame name="Proof" w={1440} h="hug" flex="col" gap={24} px={96} py={80} bg="#FAFAFA">
  <Text
    name="Heading"
    w="fill"
    size={40}
    weight={700}
    lineHeight={1.2}
    letterSpacing="-1%"
    color="#18181B"
  >
    Trusted by 4,300 studios
  </Text>
  <Frame name="Cards" w="fill" h="hug" flex="row" gap={24}>
    {quotes.map((quote) => (
      <Frame
        name={quote.author}
        w="fill"
        h="hug"
        flex="col"
        gap={12}
        p={24}
        rounded={12}
        bg="#FFFFFF"
        stroke="#18181B14"
        strokeWidth={1}
      >
        <Text w="fill" size={15} lineHeight="auto" color="#3F3F46">
          “{quote.text}”
        </Text>
        <Text size={13} weight={600} color="#18181B">
          {quote.author}
        </Text>
      </Frame>
    ))}
  </Frame>
</Frame>
```

## App screen and dashboard

A product screen answers one dominant question and supports one primary action. Structure the shell
first, fill the content second.

- **Shell:** a fixed-width sidebar for navigation, a content column that fills the rest. The header
  toolbar carries the screen title, the primary action, and search or filters. Nothing else.
- **Density:** pick one density for the screen and keep it. Data-heavy tables go compact
  (row padding 8–12); settings and marketing-adjacent screens stay airy (16–24). Do not mix
  densities inside one region.
- **Lists and tables:** rows are auto-layout frames with consistent padding and `justify="between"`
  for the value columns; align numbers right where comparison matters. Empty states carry one
  sentence and one action. Loading, empty, and error are states to design, not to skip.
- **Hierarchy:** one dominant region per screen. Secondary panels are visibly subordinate (smaller
  type, quieter fills), not equal-weight siblings.

```jsx
<Frame name="Orders" w={1440} h={900} flex="row" bg="#FFFFFF">
  <Frame name="Sidebar" w={232} h="fill" flex="col" gap={2} p={12} bg="#18181B">
    {navItems.map((item) => (
      <Frame
        name={item}
        w="fill"
        h="hug"
        flex="row"
        items="center"
        gap={8}
        px={10}
        py={8}
        rounded={8}
        bg={item === 'Orders' ? '#27272A' : undefined}
      >
        <Text
          size={14}
          weight={item === 'Orders' ? 600 : 400}
          color={item === 'Orders' ? '#FFFFFF' : '#A1A1AA'}
        >
          {item}
        </Text>
      </Frame>
    ))}
  </Frame>
  <Frame name="Content" w="fill" h="fill" flex="col" gap={24} px={32} py={24}>
    <Frame name="Toolbar" w="fill" h="hug" flex="row" justify="between" items="center">
      <Text size={24} weight={600} color="#18181B">
        Orders
      </Text>
      <Frame name="New order" h="hug" flex="row" px={16} py={8} rounded={8} bg="#7C5CFF">
        <Text size={14} weight={600} color="#FFFFFF">
          New order
        </Text>
      </Frame>
    </Frame>
    <Frame name="Table" w="fill" h="hug" flex="col">
      {orders.map((order) => (
        <Frame
          name={`Row ${order.id}`}
          w="fill"
          h="hug"
          flex="row"
          justify="between"
          items="center"
          py={10}
          stroke={order.first ? undefined : '#0000000F'}
          strokeWidth={1}
        >
          <Text size={14} color="#18181B">
            {order.customer}
          </Text>
          <Text size={14} color="#71717A">
            {order.status}
          </Text>
          <Text size={14} weight={600} color="#18181B">
            {order.total}
          </Text>
        </Frame>
      ))}
    </Frame>
  </Frame>
</Frame>
```

Rendering the shell first (sidebar and toolbar) and the rows second keeps each `render` call small
and gives you IDs to `replace_id` into.

## Slide

Slides present one idea per frame at 16:9. The audience reads from the back of the room: type is
large, content is sparse.

- **Frame:** 1280 × 720, generous margins (64–96), one background. Dark decks read well; keep the
  choice deck-wide, not per slide.
- **Grid:** title on top, content below: either one strong image or two to three columns of short
  text. Never full text documents on a slide; break long lists across slides.
- **Typography:** title 48–72, supporting text 24–32, both far above body sizes. One text idea per
  line, `lineHeight="auto"` for anything that wraps.

```jsx
<Frame name="Slide 3 — Roadmap" w={1280} h={720} flex="col" p={80} bg="#18181B">
  <Text
    name="Title"
    w="fill"
    size={64}
    weight={700}
    lineHeight={1.1}
    letterSpacing="-1.5%"
    color="#FAFAFA"
  >
    What ships this year
  </Text>
  <Frame name="Columns" w="fill" h="fill" flex="row" gap={48} items="stretch">
    {quarters.map((quarter) => (
      <Frame name={quarter.label} w="fill" h="hug" flex="col" gap={16} pt={24}>
        <Text size={32} weight={600} color="#A78BFA">
          {quarter.label}
        </Text>
        <Text w="fill" size={24} lineHeight="auto" color="#D4D4D8">
          {quarter.items.join(' · ')}
        </Text>
      </Frame>
    ))}
  </Frame>
</Frame>
```

## Verifying compositions

Composition errors are visual: a hero with dead space on one side, a table column that clipped, a
slide title colliding with its columns. Export the section you just built with `export_image` and
look at it before moving on. The full loop is in [verify.md](./verify.md).
