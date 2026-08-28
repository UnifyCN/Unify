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
