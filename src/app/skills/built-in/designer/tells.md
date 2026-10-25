# Tells

The patterns that make a design read as machine-made, with their substitutes. Each entry pairs a
pattern with why it fails and what replaces it. Skim before composing any new screen; treat the list
as a vocabulary of avoidance, not a checklist to satisfy minimally.

Curated from published anti-slop skill work: [impeccable](https://github.com/pbakaus/impeccable)
(Apache-2.0), [hallmark](https://github.com/Nutlope/hallmark) and
[taste-skill](https://github.com/Leonxlnx/taste-skill) (MIT).

| Tell                                         | Why it fails                                                                              | Replace with                                                                       |
| -------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Purple-to-blue gradient hero                 | The most common generated-page lead; reads as template before content is read             | Palette derived from the brief; one accent on a neutral base                       |
| Three identical feature cards                | Fills space without argument; the section says nothing the cards' titles don't            | An editorial composition built from the section's actual content                   |
| Rounded-square icon tile above headings      | A repeated ornament; studies of curated sites find it on ~1% of top pages vs ~28% generic | Direct typographic hierarchy; icons only where they aid recognition                |
| Inter (or one font) for everything           | Absence of type decisions; flattens the entire page to one voice                          | Inter for UI plus one display serif or geometric face, hero only                   |
| Gray text on colored surfaces                | Fails contrast and reads as an afterthought rather than a style                           | Full-contrast text on tinted surfaces; tint the surface, not the text              |
| Eyebrow label above every heading            | A costume detail repeated mechanically; adds noise, no information                        | Hierarchy through size and weight alone                                            |
| Tiny tracked uppercase captions              | Reads as award-site imitation; hurts legibility at small sizes                            | Sentence-case captions at readable sizes                                           |
| One colored word inside the headline         | Decoration standing in for emphasis the copy should carry                                 | Rewrite the headline so the emphasis is structural                                 |
| Gradient/glow decoration at rest             | Ornament without information; dates the page instantly                                    | Flat color fields; gradients only as a neutral scrim over photos                   |
| Cards nested in cards                        | Boxes inside boxes; hierarchy by indentation instead of layout                            | One level of nesting; whitespace and hairline borders separate areas               |
| Heavy drop shadows                           | Competes with content for attention; reads as default styling                             | Soft shadows tinted with the accent at 0.08 alpha                                  |
| Thin hairline rules and 1px boxes everywhere | Frame-costume generators imitate from award sites; adds visual noise                      | Whitespace as the separator; rules only where alignment changes                    |
| Monospace outside code                       | Used as a "technical" costume label; harms reading flow                                   | Regular UI type for labels                                                         |
| Glassmorphism/blur panels                    | Effect without purpose; expensive and rarely legible on busy backgrounds                  | Solid surfaces with deliberate opacity                                             |
| Emoji or blobs standing in for imagery       | Placeholder content that no finished product would ship                                   | Real product screenshots, cropped photos, or a `stock_photo` with a specific query |
| Fake gray-bar dashboards                     | Suggests data without showing any; reads as a wireframe, not a design                     | Realistic, internally consistent data                                              |
| "Clean and modern" as the entire idea        | Not a decision; the absence of one                                                        | One sentence tying the brief's subject to a direction                              |
| Everything centered                          | Treats symmetry as a default instead of a choice; flattens rhythm                         | Asymmetric, editorial grid with a deliberate breakout                              |
| Email sign-up ending every page              | Template stitching; the form rarely matches the page's job                                | One action per page, placed by the job the visitor came to do                      |
| A form that "says thanks" without sending    | Broken trust; also fails the Floor rule on real content                                   | Working states: submitted, validated, error                                        |
| Lorem Ipsum or invented filler metrics       | Placeholder standing in for the argument the content should make                          | Plausible, internally consistent copy; name a persona when the brief is short      |
