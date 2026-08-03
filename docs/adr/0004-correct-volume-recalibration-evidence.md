# Correct the evidence basis cited in the volume-recalibration decision

**Status**: accepted (2026-08-03)

A 2026-08-03 peer-review audit — prompted by the athlete asking whether the
whole plan could be considered based on scientific research — independently
re-checked the citations in `docs/adr/0001-volume-recalibration.md`'s
"2026-07-28 deep-research pass," which that ADR treated as settled
peer-reviewed evidence. They don't hold up:

- The **"119,452-runner study"** and the **"92-plan quantitative analysis"**
  both trace to a single source: a RunnersConnect coaching-company blog post
  analyzing a 2024 Strava dataset. It is commercial content, not a
  peer-reviewed publication — no disclosed filtering methodology, no control
  for confounds, no journal review. ADR 0001 cited it as if it were two
  independent studies; it's one blog post.
- The **"997-runner RCT cohort"** is real — Fokkema et al. 2020, *Scandinavian
  Journal of Medicine & Science in Sports* (the INSPIRE trial) — but
  mischaracterized twice over. 997 is the combined marathon-plus-half-marathon
  count; only 441 runners are marathon-specific. And it isn't really an RCT
  for this question: the randomized injury-prevention intervention itself had
  no effect, so the authors' own framing is that "this study can be
  interpreted as a cohort" for everything else, including the
  volume-performance finding ADR 0001 leaned on.
- The **"~59km/week → 3:36 finish"** prediction and the **"6.8 vs. 4.1
  runs/week"** frequency claim could not be traced to any verifiable
  peer-reviewed source in this pass. Both most likely derive from the same
  non-peer-reviewed blog post above, restated in the ADR as if independently
  sourced.

We're correcting the record, not reversing the decision. The actual Fokkema
et al. finding is, if anything, a cleaner point in the same direction ADR
0001 was already leaning: **>65km/week was associated with faster marathon
finish times, and — notably — the study found no association between
training volume or longest-run distance and injury risk** in either the
marathon or half-marathon cohort. The volume-escalation rule's underlying
bet (more volume, especially easy volume, helps) survives; its original
justification did not fully hold up as written.

## Considered and rejected

- **Editing ADR 0001 in place to fix the citations** — rejected. ADRs in this
  project are treated as historical record (see ADR 0003 superseding ADR
  0002 without editing 0002's body); quietly rewriting the evidence a past
  decision leaned on would hide that the original reasoning rested on an
  unverified source for a period, which is itself useful history.
- **Reversing the volume-escalation rule now that the original citations are
  discredited** — rejected. The corrected primary source still supports the
  same direction on the point that mattered for that decision, so the
  mechanism (Step 4f, `CONTEXT.md`'s volume-escalation entries) stays as-is.

## Consequences

- `docs/adr/0001-volume-recalibration.md`'s own text is left exactly as
  originally written — this ADR is the correction, referenced from here
  forward rather than merged back into it.
- `CONTEXT.md`'s "Volume recalibration" glossary entry needs no change — it
  describes the mechanism, not the evidence, and was already hedged
  appropriately ("toward what research suggests").
- Going forward, any citation added to this project backing a numeric claim
  should link the actual paper (author/year/journal/DOI), not restate a
  secondary source's "a study of N found X" — that pattern is exactly what
  let this drift happen unnoticed for five days.
