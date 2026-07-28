# Database-first decision queue

## Purpose

PsychSim is database-first. The private authoring database is a useful, auditable psychiatry
knowledge system in its own right; the game is a deliberately narrow compiler and playtest surface
over reviewed parts of that system. A current patient, receipt, or UI need may expose a database
gap, but reusable clinical knowledge must land in the appropriate catalog, assertion, opinion, or
policy record rather than being patched into one case or React component.

This file is a sequencing aid, not a second source of truth. Binding answers are recorded in
`docs/DECISIONS.md`; clinical questions and source gaps remain versioned tickets. The queue is
re-evaluated after every answer because an earlier choice may merge, remove, or substantially
change later questions.

## Already settled

The following foundations are not being asked again:

- facts, sourced contributions, Developer opinions, executable rules, and point balance are
  separate layers (D-105);
- evidence precedence is claim- and question-specific rather than one universal source score
  (D-108);
- one source or review packet may contribute to every explicitly named dossier without copying the
  same assertion into each entry (D-150);
- every source and unresolved semantic target receives an explicit landing state, even when no
  matching catalog entry exists yet (D-152);
- the personal knowledge database is a first-class learning product and the game is a focused
  projection over it (D-157 and D-163);
- coverage is a sparse, rebuildable audit rather than a completion percentage or parallel database
  (D-158);
- diagnosis families own reusable variants, while patient templates select and narrowly constrain
  them (D-160); and
- one resolved finding may appear in several player-facing views while retaining one backend truth
  and complete contributor provenance (D-161).

Two implementation prerequisites are also already approved:

1. `ticket.engine.patient-generation.catalog-compiled-instances`
2. `ticket.engine.patient-generation.shared-finding-compiler`

They require engineering work and tests, not another product decision.

## Review format

Only one decision is presented at a time. Each packet should contain:

1. a short statement of the problem;
2. the recommended default;
3. concrete examples;
4. the important tradeoffs and failure modes;
5. the existing records or tickets affected; and
6. one clearly labeled question (`Q1`, `Q2`, and so on).

The reviewer may approve, modify, reject, or defer the recommendation in plain language. No
clinical rule or point value is activated merely because a database-architecture decision is
accepted.

## Priority queue

### DBQ-001 — Define the canonical structured clinical assertion

**Status:** current.

Decide how one independently reviewable clinical proposition is represented between raw
source-specific findings and Developer interpretation. The current `EvidenceContribution` record
preserves a concise statement, source IDs, targets, and contribution types, but it is not yet the
structured claim/evidence-body model anticipated by D-108. This decision controls whether the
database can answer exactly what is claimed, in whom, under what conditions, from which evidence,
with which exceptions, and how it may later compile into game logic.

**Unlocks:** every later dossier contract, reliable cross-entry fan-out, conflict review,
claim-specific scouting, and safe knowledge-to-rule compilation.

### DBQ-002 — Define dossier maturity states and minimum useful entry views

**Status:** queued after DBQ-001.

Decide which nonexclusive states distinguish an identity shell, source-indexed entry,
clinician-interpreted entry, and game-mapped entry. This must label readiness without blocking
early capture, inventing a completeness percentage, or implying that one reviewed rule makes an
entire monograph complete.

**Unlocks:** honest database browsing, gap reports, prioritized review, and measurable authoring
progress.

### DBQ-003 — Set the catalog breadth and provisional-identity policy

**Status:** queued after DBQ-002.

Decide how aggressively to create broad identity “bins” for common psychiatric diagnoses,
medications, formulations, therapies, tests, scales, supplements, findings, and dispositions
before their dossiers are deep. This includes the threshold for creating a provisional identity,
alias and overlap handling, and when an ambiguous merge must return for review.

**Unlocks:** comprehensive capture without losing new entities or creating silent duplicates.

### DBQ-004 — Standardize the source-scouting and review packet

**Status:** queued after DBQ-001 through DBQ-003.

Decide the default evidence packet for one assertion or small topic: regulatory/official facts,
current guidelines, recent syntheses, pivotal or applicability-expanding studies, personal notes,
contrary evidence, source rights, and currentness. Existing literature-scout tools remain
discovery aids; this decision defines what a reviewer should normally receive before accepting an
assertion.

**Unlocks:** repeatable literature review, efficient psychiatrist review, and fair comparison of
formal evidence with Developer opinion.

### DBQ-005 — Define the diagnosis-family dossier contract

**Status:** queued after the common assertion and dossier decisions.

Decide the reusable sections a diagnosis family may own: identity and hierarchy, defining
features, severity/specifier branches, common manifestations, expected associated findings,
mimics and exclusions, setting/safety considerations, broad treatment routes, and generation
tendencies. The contract must remain useful without recreating a proprietary diagnostic manual or
turning every encounter into a comprehensive assessment.

**Unlocks:** diagnosis-driven findings, variants such as mild/moderate/severe MDD, differential
texture, and reusable treatment pathways.

### DBQ-006 — Define the medication and intervention dossier contract

**Status:** queued after the common assertion and dossier decisions.

Decide the reusable sections for medication ingredients/formulations, psychotherapy and other
interventions: identity, regulatory status, evidence-supported uses, expected benefits, adverse
effects, interactions, fit dimensions, contraindication/risk severity, prior-response context,
monitoring prerequisites relevant to a snapshot, and regimen relationships. Exact dose information
may be retained for reference without adding dose-entry gameplay.

**Unlocks:** broad treatment menus, medication fit, adverse-effect puzzles, polypharmacy cleanup,
and source-linked receipt explanations.

### DBQ-007 — Define the shared finding, test, and tendency contract

**Status:** queued after DBQ-005 and DBQ-006.

Decide how symptoms, observations, measurements, laboratory values, instruments, and prior
exposures are represented once and influenced by diagnoses, medications, age, context, and
background variation. Separate source-supported clinical associations from game-generation
weights and preserve unknown, absent, normal, incidental, and case-defining states.

**Unlocks:** coherent cross-domain information, reusable test generators, and explainable patient
variation.

### DBQ-008 — Calibrate patient richness and randomization

**Status:** queued after the compiler prerequisites and DBQ-005 through DBQ-007.

Decide a bounded presentation envelope across case-defining facts, expected-but-variable
associated findings, ordinary background findings, prior exposure/treatment, optional
comorbidity, and distractors. This is the clinical/product decision currently represented by
`ticket.engine.patient-generation.presentation-richness-envelope` and the GAD attempt feedback.

**Unlocks:** patients who feel plausible and varied without becoming unreadable, trivially
diagnostic, or accidentally dominated by another syndrome.

### DBQ-009 — Define promotion from knowledge to executable game rules

**Status:** queued after the core dossier contracts.

Decide the exact review gates for translating an assertion and/or Developer opinion into a
qualitative rule, then separately into provisional points. This includes inheritance,
patient-specific overrides, interaction resolution, focused-decision relevance, source
disagreement, and the rule trace that returns to the dossier.

**Unlocks:** scalable database-driven scoring without treating source extraction as automatic
clinical authority.

### DBQ-010 — Choose the first deep database vertical

**Status:** queued after DBQ-001 through DBQ-009 are sufficiently stable.

Choose the first topic to take from broad identity coverage through complete dossiers, generated
patient families, executable rules, reference patients, and reviewer audit. The current likely
candidate is the MDD sequence—initial treatment, prior response/intolerance, and inadequate
response—because it exercises shared findings, medication fit, psychotherapy, treatment history,
safety, disposition, and common laboratory reasoning.

**Unlocks:** a genuinely textured playable cohort and a proof that the database-first workflow
works end to end before scaling to GAD, bipolar disorder, psychosis, PTSD, substance-related
conditions, delirium, and eating disorders.

### DBQ-011 — Define ongoing currentness, conflict, and maintenance cadence

**Status:** queued after one complete vertical exposes real maintenance costs.

Decide how often to rescout different assertion types, how corrections and superseding sources
resurface affected records, when disagreement demands review, and how point/rule impact is audited
without repeatedly rereading every dossier.

**Unlocks:** a maintainable personal knowledge system rather than a one-time content import.

## Current stopping point

Present and resolve DBQ-001 before detailing DBQ-002. Do not implement a new assertion schema,
bulk-atomize private sources, or migrate executable rules until DBQ-001 is accepted or revised.
