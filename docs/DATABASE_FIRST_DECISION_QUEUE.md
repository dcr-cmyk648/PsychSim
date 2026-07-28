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
  them (D-160);
- one resolved finding may appear in several player-facing views while retaining one backend truth
  and complete contributor provenance (D-161); and
- diagnosis dossiers support complete snapshot regimen transitions and separately quarantined
  source-lead/authoring-inference speculation without automatic sparse-section completion (D-168).

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

**Status:** accepted as D-165.

Decide which nonexclusive states distinguish an identity shell, source-indexed entry,
clinician-interpreted entry, and game-mapped entry. This must label readiness without blocking
early capture, inventing a completeness percentage, or implying that one reviewed rule makes an
entire monograph complete.

**Accepted decision:** do not give the whole dossier one linear status such as “draft,” “approved,”
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

The acceptance includes a strict simplicity constraint. The readiness profile is calculated from
canonical records, not maintained as another status matrix. The local reader shows a compact
summary with details collapsed, computes only the requested dossier, and never enters the gameplay
bundle. Do not add a field when the state can already be derived. Pilot one dossier before
expansion, and remove or combine a lane if it creates substantial maintenance cost without changing
a concrete review decision.

**Unlocks:** honest database browsing, gap reports, prioritized review, and measurable authoring
progress.

### DBQ-003 — Set the catalog breadth and provisional-identity policy

**Status:** accepted as D-166.

Decide how aggressively to create broad identity “bins” for common psychiatric diagnoses,
medications, formulations, therapies, tests, scales, supplements, findings, and dispositions
before their dossiers are deep. This includes the threshold for creating a provisional identity,
alias and overlap handling, and when an ambiguous merge must return for review.

**Accepted decision:** use a wide-but-shallow psychiatry-first catalog with conservative semantic
merging.

1. Every unmatched named concept from an admitted source or private authored unit lands
   immediately in a provenance-preserving identity queue; nothing is dropped because a dossier
   does not exist.
2. Create a provisional identity shell when the concept has an unambiguous recognized identifier,
   is clearly named and independently useful to search/review, or is required by an active
   patient/rule ticket. Repeated vague phrases remain unresolved mentions rather than generating
   junk entities.
3. A provisional shell contains identity, aliases, type, provenance, and open gaps only. It gains
   no clinical relationship, gameplay availability, approval, or points merely by existing.
4. Apply category-specific granularity:
   - diagnosis families own severity variants and specifiers rather than spawning duplicate
     disorders;
   - medications begin at ingredient level, with separate formulations only for a meaningful
     clinical/game distinction;
   - named therapies, tests/scales, supplements, findings, and dispositions receive their own
     identity when they are independently searchable or reusable;
   - incidental phrases, one-off prose, and implementation tags do not become entities.
5. Alias only verified synonyms. Never merge on label similarity alone. Ambiguous overlaps create
   one review item; accepted merges preserve old IDs as redirects/superseded identities so sources
   and historical attempts do not break.
6. Run a deterministic duplicate/overlap and unresolved-landing audit whenever identities or
   source units are added. Broad initial seeding is useful, but the landing queue—not an attempt to
   pre-enumerate all psychiatry—is the durable protection against information loss.

This produces many inexpensive identity shells without pretending they are completed records. It
also avoids the opposite failure mode: automatically creating hundreds of nearly synonymous
entities from every phrase in a large guideline or personal-note archive.

The acceptance clarifies that every potentially relevant concept found while processing an
admitted input receives a stable candidate bin, even when its category or canonical identity is
uncertain. Review determines whether that bin becomes a canonical provisional identity, alias,
merge, relationship-only concept, retained unresolved concept, or reviewed non-entity/out-of-scope
item. A high bin count is expected and preferable to silent loss. Bins retain provenance and remain
authoring-only until separately promoted.

**Unlocks:** comprehensive capture without losing new entities or creating silent duplicates.

### DBQ-004 — Standardize the source-scouting and review packet

**Status:** accepted as D-167.

Decide the default evidence packet for one relationship or small topic: regulatory/official facts,
current guidelines, recent syntheses, pivotal or applicability-expanding studies, personal notes,
contrary evidence, source rights, and currentness. Existing literature-scout tools remain
discovery aids; this decision defines what a reviewer should normally receive before accepting an
interpretation or relationship.

**Accepted decision:** use one compact, question-specific packet with a source-depth budget rather
than an exhaustive literature dump.

1. Lead with the exact decision, affected topical owners, current database behavior, and why review
   is needed.
2. Search the existing formal catalog and complete enrolled personal corpus first. Show the
   relevant accepted Developer opinions, source units, rules, conflicts, and gaps.
3. Scout the smallest appropriate formal-source stack:
   - current official/regulatory material when the question concerns identity, approval, labeling,
     warnings, or other regulatory facts;
   - the most current applicable guideline;
   - one clinically responsive systematic review or meta-analysis from the last ten years when that
     design fits the question, using citation count only as a tie-breaker after relevance;
   - a newer study or an older still-relevant landmark, head-to-head, pragmatic, or
     special-population study only when the synthesis or guideline does not answer the actual
     question; and
   - the strongest material that opposes, limits, or materially qualifies the proposed answer.
4. When meta-analysis is the wrong design—for example a rare harm, pharmacokinetic interaction,
   diagnostic instrument, regulatory status, or excluded population—state that explicitly and use
   the appropriate evidence type instead of forcing an irrelevant paper.
5. Keep the primary synthesis to roughly one page: proposed answer, supporting material,
   opposition/limitations, relevant Developer opinion, exact affected bins/relationships/rules,
   uncertainty, source-use/currentness constraints, and the specific reviewer decision needed.
   Give every selected source a concise original “what this contributes” summary, explicitly
   labeled abstract-only when full text was not lawfully reviewed. Every selected source remains
   independently findable: show its stable evidence ID when cataloged, full bibliographic
   identity, DOI/PMID or stable URL when available, access/full-text status, and the exact review
   limitation. Full citations, provenance, and detailed notes remain expandable. The reviewer may
   follow that reference and supply feedback or a better-accessible source without treating the
   abstract summary as full-text support.
6. Stop when the minimum stack answers the narrow question without a material conflict. Add depth
   only for high-stakes safety, unresolved disagreement, important applicability gaps, or a source
   that has been corrected/superseded.
7. Approval of the packet records source units and interpretation relationships only. Executable
   rules and point magnitudes still require their separate clinical and balance review.

This preserves the desired one-topic-at-a-time workflow while avoiding both shallow unsupported
summaries and enormous packets that shift the literature-review workload back to the psychiatrist.

**Unlocks:** repeatable literature review, efficient psychiatrist review, and fair comparison of
formal evidence with Developer opinion.

### DBQ-005 — Define the diagnosis-family dossier contract

**Status:** accepted as D-168.

Decide the reusable sections a diagnosis family may own: identity and hierarchy, defining
features, severity/specifier branches, common manifestations, expected associated findings,
mimics and exclusions, setting/safety considerations, broad treatment routes, and generation
tendencies. The contract must remain useful without recreating a proprietary diagnostic manual or
turning every encounter into a comprehensive assessment.

**Proposed default:** use a sparse diagnosis-family dossier whose sections are populated only when
reviewed material exists:

1. The family owns identity, aliases, classification/hierarchy links, and its reusable
   severity/specifier branches. MDD therefore owns mild, moderate, and severe variants; a related
   but distinct disorder retains its own identity.
2. The family owns a qualitative condition-state envelope: defining features, duration and
   threshold relationships, branch-specific changes, and explicit `unknown`, `absent`,
   `subthreshold`, and `present` distinctions. This must be independently paraphrased from
   permitted sources or labeled Developer opinion; it must not reconstruct protected DSM prose.
3. The family owns reusable presentation tendencies and constraints. Source-supported clinical
   associations stay separate from game-generation weights. Patient templates select and narrowly
   override these tendencies, while resolved patients save the exact generated findings.
4. The family owns boundaries that matter to the focused game: mimics, exclusions, incompatible
   states, and common comorbid or associated conditions. Chart diagnoses remain distinct from
   internal condition truth. Inconsistency may quarantine or reroll a patient, but the engine does
   not become a general free-text differential system.
5. The family owns only condition-relevant focused assessment, safety, and setting relationships.
   Treatment-triggered prerequisites remain conditional. Shared findings, tests, scales, and
   dispositions keep their own topical owners and appear through cross-links.
6. The family owns broad treatment routes by branch or line, such as a reviewed first-line
   medication family or psychotherapy route. A route may describe a complete snapshot regimen
   transition rather than only static treatment eligibility: retain a beneficial anchor, act on a
   poorly fitting or ineffective current regimen entry, and start an eligible replacement or
   adjunct. Both the before and proposed states may satisfy the broad route while medication
   response, tolerability, prior trials, interactions, and fit distinguish the better next step.
   Individual medication and other topical owners supply those effects; regimen entries and prior
   trials remain patient state; point magnitudes remain separate. No route implies a dose,
   cross-taper schedule, virtual follow-up, or observed longitudinal outcome.
7. Sources, Developer opinions, conflicts, gaps, generation mappings, patients, and executable
   rules appear through the derived dossier with detailed provenance collapsed by default. Sparse
   or unreviewed sections stay explicitly unknown by default. A section may also show a short,
   clearly separated speculative candidate when an admitted source contains a traceable lead or an
   authorized developer-side authoring process makes a traceable inference. Source leads and
   authoring inferences retain different labels, inputs, provenance, assumptions, uncertainty, and
   follow-up questions. They cannot compile into gameplay or masquerade as a source contribution,
   Developer opinion, fact, rule, point value, or approval. Empty sections are not automatically
   filled, and dossier completeness is never required for identity capture or unrelated focused
   gameplay.

This should let one diagnosis family support varied first-visit, prior-response, and nonresponse
patients without copying a fixed case solution or requiring the game to model all of psychiatry.

**Unlocks:** diagnosis-driven findings, variants such as mild/moderate/severe MDD, differential
texture, and reusable treatment pathways.

### DBQ-006 — Define the medication and intervention dossier contract

**Status:** current.

Decide the reusable sections for medication ingredients/formulations, psychotherapy and other
interventions: identity, regulatory status, evidence-supported uses, expected benefits, adverse
effects, interactions, fit dimensions, contraindication/risk severity, prior-response context,
monitoring prerequisites relevant to a snapshot, and regimen relationships. Exact dose information
may be retained for reference without adding dose-entry gameplay.

**Proposed default:** use one shared intervention envelope with type-specific medication and
psychotherapy/other-intervention modules:

1. Every intervention owns stable identity, aliases, independently sourced classifications, and
   relationships to broader families. Medications begin at ingredient level. Formulations become
   separate entities only when route/formulation changes availability, safety, adherence,
   fulfillment, or the best-next-step decision. External IDs never replace PsychSim IDs.
2. Regulatory status remains a separate jurisdiction-, product-, formulation-, and
   version-specific lane. Approval, labeling, warnings, and contraindication wording are visible
   facts, not automatic evidence of first-line status, comparative benefit, or game points.
3. Clinical-use relationships preserve condition, population, setting, severity/phase, treatment
   line, target outcome, and role such as monotherapy, retained anchor, adjunct, replacement,
   symptom-targeted option, or discontinuation candidate. Source-specific roles may disagree.
4. Benefit, adverse-effect, feasibility, and patient-fit relationships are independently
   traceable. Source estimates retain population/outcome/time-horizon limits. A separate reviewed
   transformation decides whether a relationship becomes a qualitative rule, and balance supplies
   points; aggregate rates never become unexplained patient probabilities.
5. Safety keeps regulatory contraindications, reviewed hard contraindications, serious
   nonabsolute concerns, withdrawal/discontinuation effects, organ-function constraints,
   reproductive considerations, interactions, and snapshot-relevant prerequisites distinct.
   Shared mechanism/class rules may coexist with more-specific formulation, pair, or patient rules.
6. Medication files do not own a patient's regimen history. Each current medication is a distinct
   regimen-entry instance with role, response, tolerability, and other resolved state; each prior
   trial is a structured patient record. A complete submitted transition can target individual
   entries with `continue`, `increase`, `reduce_or_limit`, `taper`, or `stop`, plus starts. The
   dossier supplies reusable relationships needed to judge retention, replacement, augmentation,
   retrial, simplification, and duplicate therapy without simulating a schedule.
7. Psychotherapy and other interventions share identity, evidence, role, fit, combination,
   redundancy, and capability concepts, but use their own delivery, fidelity, practitioner,
   setting, and program-completeness fields rather than being forced into medication structures.
   A generic modality, protocol-based therapy, referral, and full program remain distinguishable.
8. The dossier is a derived one-entry audit over source units, Developer opinions, conflicting or
   speculative candidates, rules, balance, reverse links, current patients, and impact tickets.
   Detailed provenance remains collapsed. Speculative candidates follow D-168 and remain
   nonexecutable.

This structure should support a simple “start any first-line treatment” patient and a complex
polypharmacy patient with many prior trials using the same reusable records, without turning the
game into a dosing or longitudinal-care simulator.

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

Present and resolve DBQ-006 before detailing DBQ-007. Do not implement or bulk-migrate the
medication/intervention dossier schema until DBQ-006 is accepted or revised. D-168 permits
traceable speculative candidates but does not authorize automatic completion of sparse sections,
runtime AI, or speculative gameplay rules. D-167 still does not automatically apply scouted
sources, revise the tracked packet schema, or authorize bulk scouting. DBQ-002 authorizes only a
one-dossier readiness pilot, and DBQ-003 authorizes candidate-bin architecture rather than
immediate bulk catalog generation.
