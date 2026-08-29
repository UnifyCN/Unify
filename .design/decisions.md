# Design decisions

Keep history here; keep `DESIGN.md` current.

| ID | Date | Status | Decision | Why | Evidence | Supersedes |
|---|---|---|---|---|---|---|
| D-001 | 2026-08-28 | proposed | {{decision}} | {{reason}} | {{links}} | - |

## R1 — Entry model for the Resources header band

**Date:** 2026-08-28
**Decision:** Option B, "Orientation" — a 22pt question heading plus one supporting
grey line, then the search field.

**Accepted because:** the band should orient a newcomer who does not yet know the
vocabulary. B is the only option that answers the question the person is actually
holding when they open the tab.

**Rejected:**
- **A, Nav search** — biggest density win (30pt band, 8 cards above fold) but the
  nav pill would filter on Learn and navigate on Social. One shape, two meanings.
- **C, Search first** — good chips, but with 23 organizations a specific query
  often returns little.
- **D, Proof bar** — same height as today and carries real evidence; still live as
  a mix candidate with B.
- **E, Needs first** — best task-fit, costs 140pt and needs data on the top three
  jobs that we do not have.

**Open (R2):** where the "How we choose these" trust link goes, now that B's
heading and grey line replaced the sentence that used to carry it.

## R2 — Placement of the "How we choose these" trust link

**Date:** 2026-08-28
**Decision:** B1, inside the supporting-copy block, but on its own line rather
than inline in the sentence.

Final band, top to bottom: 24pt question heading → 16pt supporting line → teal
underlined trust link → search field. 141pt, matching the 140pt held constant
across the R2 bench.

**Accepted because:** the link keeps a full line of its own, so it is a real tap
target and cannot blend into grey body text, and it needs no new string —
`learn.resources.howWeChoose.link` already ships in all four locales.

**Rejected:**
- **B2, heading row** — highest contrast, but needs a shorter label added to four
  locales, and a terse action beside a question can read as help about the
  question rather than about the list.
- **B3, after the grid** — free above the fold, but invisible to anyone who taps
  straight into a category, which is when the trust claim matters most.

**Deviation from the R2 mock:** the mock set the heading at 22pt and the
supporting line at 15pt grey. Shipped at 24pt / 16pt black instead, carrying
forward the earlier decision to match the Lessons greeting and subtitle. The mock
predated that alignment; this is the correction, not an override.

**New string:** `learn.resources.heading` in en/es/hi/vi. Parity holds at 971.

## R3 — Vertical rhythm in the header block

**Date:** 2026-08-28
**Decision:** S3, "Stepped" — 8 / 6 / 18 / 12.

heading →8→ subtitle →6→ trust link →18→ search →12→ grid. Band 155pt, 14pt
taller than shipped. Still six cards above the fold, so the choice cost nothing
in density.

**Accepted because:** gaps widen as the relationship between elements weakens.
The shipped block had subtitle→link at 0pt, which made the link read as a third
line of the paragraph rather than a tap target. 6pt lifts it clear while keeping
it in the copy group it explains; 18pt closes the block before the input.

**Rejected:**
- **S2, two groups (10/2/16/12)** — 2pt is a hairline and does not fix the defect.
- **S4, open (12/8/22/14)** — calmer, but sparse against the dense Lessons view
  one toggle away.
- **S5, link with search (8/14/10/12)** — groups the link with the input, which
  misreads it. It opens a sheet of vetting criteria; it does not filter anything.

**Implementation note:** the gap sits on the TouchableOpacity wrapper
(`styles.linkButton`), not on the Text, because the link shares `styles.subtitle`.

## R4 — Category detail screen (Figma 8129:32881)

**Date:** 2026-08-30
**Decision:** Build the node as drawn, with four corrections carried forward from
the landing screen and one addition.

**The change that matters** is the partner row. It was a hairline-divided list
row; it is now a card — white fill, 1pt `#E7E4DE`, the shared Learn shadow. The
node draws radius 16; shipped at 20, matching the category tile the list sits one
tap behind. A partner list is a list of cards, not divided rows.

**Corrections carried forward:**
- **Funnel Sans and Nunito Sans → the system face.** The node sets the title,
  description, tagline and chips in Funnel Sans and the card name in Nunito Sans
  ExtraBold. Same correction as the landing screen; same reason.
- **20pt gutter → 16pt.** `CategoryDetail` renders inside `ResourcesView`'s
  padding, so it inherits this rather than setting it.
- **Title 24/700 → 24/600.** The landing heading's weight, so the two Resources
  screens read as one.
- **Material Symbols → Feather.** Unlike the category glyphs, every icon this
  node asks for (`location_on`, `chevron_right`, `arrow_back_ios_new`) has a
  Feather equivalent, so no new committed SVGs.

**Addition — the cost chip carries colour.** Free takes `#0F766E` on `#E6F7F4`,
mixed `#9A6318` on `#FDF1E2`, both straight from the node. All three pairs clear
WCAG AA unaltered, which is a first for this feature — the landing screen needed
three swatches darkened.

**`paid` is ours.** The node draws free and mixed only. Paid takes the neutral of
the service-area chip beside it (`#6F6C64` on `#F4F2EE`, 4.69:1), which leaves
"Free" as the only chip in a row that draws the eye. Cost is the field a newcomer
scans a directory for, and "free" is the answer that changes what they do next.

**Rejected:**
- **A third hue for `paid`** — colour-codes all three states, but then every row
  carries two coloured chips and nothing stands out. Colour should mark the
  exception, not the enumeration.
- **The node's flatter shadow** (`0 1px 1px rgba(30,25,15,0.04)`) — the tiles one
  tap back use PathwayCard's, and two shadow depths inside one feature read as an
  error rather than a hierarchy.

**Copy change:** `learn.resources.cost.mixed` shortened from "Free + paid options"
to "Free + paid" in all four locales, so the chip fits beside the service area
instead of wrapping the row. It also appears on the partner detail screen, where
the shorter form reads no worse. Parity holds at 971.

**Blast radius:** `PartnerRow` renders in the category list **and** in the landing
screen's search results. Both were verified on an iPhone 17 Pro; the search
results are where all three cost chips appear together.

**Not fixed here — two data gaps the node exposes:**
- The node draws "Free" on DIVERSEcity and Burnaby Neighbourhood House. Neither
  carries an org-level `cost`; the value sits on their programs. `types/partner.ts`
  states that an absent value means the partner does not publish one, and must
  never be inferred — routing someone to a service they cannot afford or qualify
  for is this feature's main failure mode. The cards ship without a cost chip.
- The node draws real partner logos. No partner in `constants/Partners.ts` has a
  `logo`, so every card falls back to a monogram. That is an asset task, not a
  design one.

**Correction after review (2026-08-30):** the back nav shipped with
`minHeight: 44`, which centred its label and left ~14pt of dead space between the
segmented control and the label — Savar flagged it on device. It now sizes to its
label with `paddingVertical: 2` and reaches 44pt through `hitSlop`, the pattern
the landing screen's trust link already uses. The label now starts the same
distance below the segmented control as the landing heading does.
