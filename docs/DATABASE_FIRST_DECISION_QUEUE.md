# Database-first decision queue

## Purpose

PsychSim is database-first. The private authoring database is a useful, auditable psychiatry
knowledge system in its own right; the game is a deliberately narrow compiler and playtest surface
over reviewed parts of that system. A current patient, receipt, or UI need may expose a database
gap, but reusable clinical knowledge must land in the appropriate source unit, topical owner,
Developer opinion, relationship, or policy record rather than being patched into one case or React
component.

This file is a sequencing aid, not a second source of truth. Binding answers are recorded in
`docs/DECISIONS.md`; clinical questions and source gaps remain versioned tickets. The queue is
re-evaluated after every answer because an earlier choice may merge, remove, or substantially
change later questions.

## Already settled

The following foundations are not being asked again:

- facts, sourced contributions, Developer opinions, executable rules, and point balance are
  separate layers (D-105);
- evidence precedence is proposition- and question-specific rather than one universal source score
  (D-108);
- one source or review packet may contribute to every explicitly named dossier without copying the
  same source unit into each entry (D-150);
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

### DBQ-001 — Define source, topic, and rule ownership

**Status:** accepted as D-164.

Do not create one source file per proposition or make a new global “assertion database.” A
foundational source such as CANMAT owns one durable source record containing its metadata, rights,
version/update relationships, navigable section structure, many source-local contribution units,
target cross-links, unresolved gaps, and typed Developer commentary. Stable nested IDs make
individual recommendations, findings, tables, or sections linkable without splitting the
guideline into hundreds of files or manually reconstructing it as a new manual. Exact retained
detail remains constrained by the source-specific reuse decision.

Topical records—diagnoses, medications, findings such as weight or insomnia, tests, therapies, and
other independently useful concepts—compile material from many source records under readable
headers. They preserve accepted Developer interpretation separately from source-authored content
and cross-reference related topical owners rather than copying their complete contents.

Concrete game relationships and rules have one canonical topical owner plus source-contribution
and/or Developer-opinion links. Other implicated dossiers receive generated reverse links. For
example, a weight-status record may own a reviewed mirtazapine/high-BMI fit rule, while an insomnia
record may own a separate mirtazapine/insomnia fit rule; the mirtazapine dossier assembles both.
The patient inherits the relevant resolved facts, and the rule compiler applies the applicable
relationships. Point magnitude remains a separate balance field.

The accepted deterministic ownership rule for relationships involving several topics is:

1. the most specific decision-driving topic owns the relationship;
2. all other implicated topics receive derived reverse links; and
3. a genuinely symmetric or multifactor relationship with no natural owner receives one dedicated
   relationship/policy record rather than duplicated copies.

This follows Fractured Fate's primary-owner plus related-file pattern and its rule against automatic
entity explosion. “Assertion” should not be used as a separate architectural tier; where the word
appears descriptively, it means a source contribution, topical interpretation, or concrete rule
inside one of these owners.

**Unlocks:** reliable cross-entry fan-out, source-oriented review, topical dossiers, conflict
review, question-specific scouting, and safe knowledge-to-rule compilation without rebuilding large
guidelines by hand.

### DBQ-002 — Define dossier maturity states and minimum useful entry views

**Status:** current.

Decide which nonexclusive states distinguish an identity shell, source-indexed entry,
clinician-interpreted entry, and game-mapped entry. This must label readiness without blocking
early capture, inventing a completeness percentage, or implying that one reviewed rule makes an
entire monograph complete.

**Proposed default:** do not give the whole dossier one linear status such as “draft,” “approved,”
or “complete.” A stable identity is sufficient for database inclusion and cross-linking. Readiness
is then tracked independently for:

1. identity and alias resolution;
2. source mapping, currentness, and disagreement;
3. accepted Developer interpretation;
4. individual topical relationships and clinical rules; and
5. exact generation/game mappings plus their balance and reference-policy validation.

The underlying records retain their own typed lifecycle and review states. The dossier shows a
derived sparse profile using the already accepted distinctions such as `unknown`, `missing`,
`present`, `stale`, `contested`, and `not_applicable`; it does not invent a percentage or promote
one section because another was reviewed.

The minimum useful cross-topic dossier view is:

- an identity header and aliases;
- a concise “current synthesis” assembled from accepted interpretation, with uncertainty visible;
- compact independent readiness lanes;
- open gaps, conflicts, and review work;
- linked source units, Developer opinions, topical relationships, and reverse links; and
- exact game/rule/patient mappings, clearly separated from background knowledge.

Database browsing can therefore include a thin identity shell. Gameplay may use only the exact
identity, relationship, generator, rule, balance, and validation dependencies required by that
patient; it never treats the entire dossier badge as clinical approval. This adds several
independent markers, but avoids the materially worse ambiguity of calling venlafaxine “approved”
when only its identity—or only one fit rule—has been reviewed.

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

Decide the default evidence packet for one relationship or small topic: regulatory/official facts,
current guidelines, recent syntheses, pivotal or applicability-expanding studies, personal notes,
contrary evidence, source rights, and currentness. Existing literature-scout tools remain
discovery aids; this decision defines what a reviewer should normally receive before accepting an
interpretation or relationship.

**Unlocks:** repeatable literature review, efficient psychiatrist review, and fair comparison of
formal evidence with Developer opinion.

### DBQ-005 — Define the diagnosis-family dossier contract

**Status:** queued after the common ownership and dossier decisions.

Decide the reusable sections a diagnosis family may own: identity and hierarchy, defining
features, severity/specifier branches, common manifestations, expected associated findings,
mimics and exclusions, setting/safety considerations, broad treatment routes, and generation
tendencies. The contract must remain useful without recreating a proprietary diagnostic manual or
turning every encounter into a comprehensive assessment.

**Unlocks:** diagnosis-driven findings, variants such as mild/moderate/severe MDD, differential
texture, and reusable treatment pathways.

### DBQ-006 — Define the medication and intervention dossier contract

**Status:** queued after the common ownership and dossier decisions.

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

Decide the exact review gates for translating source units, a topical relationship, and/or a
Developer opinion into a
qualitative rule, then separately into provisional points. This includes inheritance,
patient-specific overrides, interaction resolution, focused-decision relevance, source
disagreement, and the rule trace that returns to the dossier.

**Unlocks:** scalable database-driven scoring without treating source extraction as automatic
clinical authority.

### DBQ-010 — Choose the first deep database vertical

**Status:** queued after DBQ-001 through DBQ-009 are sufficiently stable.

Choose the first topic to take from broad identity coverage through mature-enough dossiers, generated
patient families, executable rules, reference patients, and reviewer audit. The current likely
candidate is the MDD sequence—initial treatment, prior response/intolerance, and inadequate
response—because it exercises shared findings, medication fit, psychotherapy, treatment history,
safety, disposition, and common laboratory reasoning.

**Unlocks:** a genuinely textured playable cohort and a proof that the database-first workflow
works end to end before scaling to GAD, bipolar disorder, psychosis, PTSD, substance-related
conditions, delirium, and eating disorders.

### DBQ-011 — Define ongoing currentness, conflict, and maintenance cadence

**Status:** queued after one complete vertical exposes real maintenance costs.

Decide how often to rescout different relationship and source-unit types, how corrections and superseding sources
resurface affected records, when disagreement demands review, and how point/rule impact is audited
without repeatedly rereading every dossier.

**Unlocks:** a maintainable personal knowledge system rather than a one-time content import.

## Current stopping point

Present and resolve DBQ-002 before detailing DBQ-003. Do not implement an entry-readiness schema,
source-record migration, or bulk dossier migration until DBQ-002 is accepted or revised.
