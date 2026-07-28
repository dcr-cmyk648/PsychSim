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
  source-lead/authoring-inference speculation without automatic sparse-section completion (D-168);
  and
- intervention dossiers share a common envelope with type-specific modules, while an exact
  reviewed FDA-label match may contribute one minor nonexclusive regulatory-alignment bonus
  (D-169); and
- shared findings resolve once in the patient, while test definitions, reveal actions, generation
  tendencies, and post-submit scoring remain separate owners (D-170); and
- focused psychiatric patients may remain highly textured and diagnostically muddy, while only
  literal same-scope contradictions invalidate generation and coverage gaps remain nonblocking
  tickets (D-171 and D-172); and
- qualitative rules require one explicit atomic psychiatrist review before tooling may attach
  separately labeled provisional D-156-band points for Developer/Reviewer play (D-173); and
- canonical patient facts, assessment/item responses, and player-facing wording remain separate,
  while reviewed expression banks may deliberately reuse the same ordinary phrase across distinct
  facts (D-177).

Three implementation prerequisites are also already approved:

1. `ticket.catalog.findings.subjective-presentation-projection-foundation`
2. `ticket.engine.patient-generation.catalog-compiled-instances`
3. `ticket.engine.patient-generation.shared-finding-compiler`

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

**Status:** accepted as D-169.

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
   version-specific lane. A verified current FDA on-label match for the resolved indication,
   population, and formulation may compile one modest, separately itemized
   `regulatory_alignment` bonus. The provisional default is +10 points. It neither defines the
   broad treatment route nor proves comparative benefit, never stacks across duplicate label
   records, is suppressed by a true contraindication, and does not penalize an otherwise supported
   off-label treatment. A case explicitly testing approval knowledge may author a larger
   case-specific consequence.
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

**Status:** accepted as D-170.

Decide how symptoms, observations, measurements, laboratory values, instruments, and prior
exposures are represented once and influenced by diagnoses, medications, age, context, and
background variation. Separate source-supported clinical associations from game-generation
weights and preserve unknown, absent, normal, incidental, and case-defining states.

**Accepted decision:** use one canonical resolved-finding layer, separate reusable test
definitions, and separately reviewed generation tendencies:

1. Every reusable symptom, history element, exposure, examination finding, measurement, or
   observation encountered in admitted input or modeled content receives one stable concept ID
   with neutral labels, identity-equivalent aliases/search terms, value type, allowed outcomes, and
   permitted projection modes. Its definition does not contain a patient's value or decide whether
   asking about it is worth points.
2. A `PatientInstance` owns the resolved clinical value, source, and uncertainty for each modeled
   fact; `EncounterState` separately owns whether the player has revealed it. A truly
   `unassessed`/`unknown` fact is different from a known `absent`, `subthreshold`, `present`,
   `normal`, `high`, `low`, `positive`, or `negative` value, and an unrevealed fact does not become
   unknown to the engine. Every History, Physical exam, Testing, diagnosis, treatment-fit, and
   receipt view references that one truth.
3. Diagnosis, medication, age/context, and other owners contribute constraints or tendencies to
   shared findings rather than creating duplicate facts. Source-supported associations remain
   separate from game-generation weights. Explicit specificity resolves compatible contributions;
   hard contradictions retry deterministically or quarantine instead of using file order.
4. A patient template distinguishes case-defining required facts, expected-but-variable findings,
   ordinary background variation, optional comorbidity findings, and bounded distractors.
   Criteria-driven groups use reviewed required/minimum/maximum constraints. As clarified by
   D-171, background and cross-condition findings may overlap or superficially satisfy another
   symptom checklist; they are retained but do not automatically create an internal condition or
   change the focused rubric.
5. Every orderable study or instrument owns a separate test definition: study kind, components,
   result schema, units/reference intervals, deterministic generation profiles, interpretation,
   rights boundary, and result-display conventions. The linked shared
   `InformationActionDefinition` separately owns the player-facing action ID, neutral label,
   category/search metadata, and service/fulfillment relationship. The patient may provide a
   more-specific authored result override. Neither owner decides clinical correctness or points.
6. All results available in one encounter are resolved and frozen before play. Buying an action
   only reveals them. Numeric results render value, unit, population-appropriate reference
   interval, and `N`/`H`/`L`; at most one incidental abnormality per panel follows a reviewed
   test-specific probability and narrow range, remains non-case-defining, and cannot alter
   scoring.
7. Named instruments and criteria lists retain their identity, validation scope, interpretation,
   administration effort, and reuse permission. Protected item wording is not copied without
   permission. The player-facing result can be a score or permitted structured summary while the
   backend retains the exact derived inputs needed for audit.
8. Information-action labels, neutral descriptions, categories, and search metadata are global.
   Patient files supply only resolved results and narrow reveal mappings. Post-submit workup,
   diagnosis, treatment, and fit rules separately explain how a finding mattered; no pre-submit
   result or menu description exposes its value.
9. A standardized assessment response is an instrument- or action-owned projection from explicitly
   named applicable source findings, not another spelling of those findings. A frozen response
   retains the projection version and every contributing resolved-finding ID.
10. Unstandardized patient language comes from deterministic expression banks with stable variant
    IDs. The same phrase may appear in several reviewed mappings, but canonical aliases remain
    globally unique and wording never activates a rule. The audit reconstructs source fact →
    assessment response → displayed wording.

This keeps a patient's state coherent across every screen while allowing the same symptom or test
to behave differently across diagnoses, medications, ages, and patient templates without copying
it into every file.

**Unlocks:** coherent cross-domain information, reusable test generators, and explainable patient
variation.

### DBQ-008 — Calibrate patient richness and randomization

**Status:** accepted as D-171 and D-172.

Decide a bounded presentation envelope across case-defining facts, expected-but-variable
associated findings, ordinary background findings, prior exposure/treatment, optional
comorbidity, and distractors. This is the clinical/product decision currently represented by
`ticket.engine.patient-generation.presentation-richness-envelope` and the GAD attempt feedback.

**Revised proposed default:** use a template-specific `PresentationRichnessEnvelope` plus a
psychiatry-referral plausibility check. “Focused” limits what the player must decide now; it does
not require a simple, diagnostically clean patient:

**P1 — Require a psychiatrist-level decision.** Before optional variation, the template fixes its
focused decision, required condition state, and safety facts. It also names at least one reason
this is meaningfully psychiatric rather than a trivial primary-care prescription: diagnostic
attribution, prior response or intolerance, regimen transition, comorbidity fit, adverse effects
or interactions, safety, or disposition. Missing rule coverage does not invalidate the patient.

**P2 — Separate core complexity from optional texture.** Required diagnoses, current regimen,
decision-relevant treatment history, and focused complications do not consume the D-126
optional-feature budget. The richness envelope separately controls expected-but-variable
associations, ordinary background findings, optional condition modules, and unrelated
distractors. There is no scalar patient “level” or one global realism count.

**P3 — Make prior history match the specialty population.** A prolonged, severe, or
specialty-level template requires multiple structured prior efforts by default—medications,
therapy, prior clinical contact, OTC or supplement use, coping attempts, substance-related
coping, or higher levels of care. There is no small upper cap: a patient may own 15 prior trials
when the template calls for it. A treatment-naive exception requires an explicit template reason.
Long histories render as a concise summary with expandable detail.

**P4 — Let cases select bounded comorbidity sets.** A template may declare groups such as “select
one to three from these condition modules,” with stable candidate IDs, minimum and maximum
selection counts, game weights, and reviewed incompatibilities. Selected conditions are saved
internal state. The engine has no global random-diagnosis pool, and source association strength
remains separate from `gameSelectionWeight`.

**P5 — Preserve chart uncertainty separately.** Required and selected internal conditions,
historical or questionable chart diagnoses, and explicit rule-out/uncertain records remain
distinct. A patient may therefore arrive with numerous overlapping labels while the encounter
still asks for one best next step. Nothing player-facing reveals the internal answer before
submission.

**P6 — Keep overlapping symptoms instead of cleaning them.** Shared findings resolve once and may
legitimately resemble or superficially satisfy several disorders' symptom lists. The generator
does not delete, redraw, retry, or quarantine them for a threshold count alone, and it does not
auto-promote a new internal diagnosis. Etiology, timing, substance or medication context,
functional relationship, and “not better explained” logic remain separate from raw symptom
cardinality.

**P7 — Quarantine only literal structural failures.** Malformed typed state, unresolved required
identity, or explicitly impossible same-scope facts/internal-state combinations may retry or
quarantine. Inaccessible modeled actions or missing investigation, treatment, disposition, or
rubric relationships create nonblocking coverage diagnostics and tickets. Diagnostic ambiguity,
several plausible formulations, incomplete rule coverage, and benefit-versus-risk tension are
valid patient states rather than generation defects.

**P8 — Resolve deterministically and retain every contributor.** Generate required conditions and
regimen, bounded condition selections, chart labels/rule-outs, structured prior history,
associated findings, background findings, and distractors in a stable order. Save the seed,
candidate pools, draws, attribution/uncertainty, and contributor trace.

**P9 — Keep display compact while allowing backend depth.** Openings remain name plus brief chief
complaint. Purchased results use concise structured findings, and large medication or treatment
histories use summaries and expansion rather than walls of text. Display limits do not delete
resolved patient state or block it from post-submit audit.

**P10 — Score the immediate decision across the whole patient.** One broad authored route carries
most care points. Smaller reviewed fit, safety, interaction, response, and tolerability rules may
contribute from every relevant condition, finding, regimen entry, and prior trial, subject to
existing deduplication, caps, and critical-safety behavior. The trace shows why each contribution
appeared; it is a game scoring explanation, not clinical decision support.

**P11 — Calibrate with clean and muddy cohorts.** Before enabling broad generation, instantiate
many MDD and GAD patients plus deliberately complex reference templates. Audit implausibly empty
satellite domains, repetitive bundles, treatment-history plausibility, overlapping symptom
patterns, diagnostic uncertainty, number of applicable rule contributors, coverage gaps, literal
contradictions, and player reading burden. The saved GAD review is an acceptance example, not a
probability source.

This revised model removes the earlier global `2–4 findings / 0–2 prior efforts` suggestion.
Richness is template-specific, while specialty-setting plausibility, structured prior history,
bounded comorbidity selection, deterministic replay, and compact display provide the guardrails.

**Unlocks:** patients who feel plausibly psychiatric, diagnostically muddy, and varied while the
immediate decision and complete explanatory trace remain legible.

### DBQ-009 — Define promotion from knowledge to executable game rules

**Status:** accepted as D-173.

Decide the exact review gates for translating source units, a topical relationship, and/or a
Developer opinion into a qualitative rule, then separately into provisional points. This includes
inheritance, patient-specific overrides, interaction resolution, focused-decision relevance,
source disagreement, and the rule trace that returns to the dossier.

**Proposed default:** use a two-stage promotion contract—first approve a qualitative clinical/game
relationship, then assign separately labeled provisional balance:

**P1 — Knowledge never executes directly.** A source unit, topical relationship, source lead,
authoring inference, or Developer opinion can propose a rule but cannot activate one. A proposal
must name its canonical owner, target IDs, focused decision scope, typed trigger, qualitative
direction, clinical concern, certainty, exceptions, rationale, provenance IDs, and receipt
explanation. It has no points yet.

**P2 — Preserve three support paths.** A qualitative rule may be supported by (a) a directly
applicable formal contribution, (b) formal contribution plus an explicitly identified
Developer-opinion bridge, or (c) Developer opinion alone. Each path remains visibly labeled.
Speculative source leads and authoring inferences cannot promote until the reviewer converts them
through the appropriate evidence or Developer-opinion workflow.

**P3 — Require one explicit qualitative review.** The psychiatrist accepts, narrows, rejects, or
defers the proposed direction and scope. Acceptance records reviewer identity, timestamp,
reviewed version/fingerprint, exceptions, and unresolved disagreement. It approves only that
atomic rule—not the dossier, source, medication, diagnosis, or neighboring rules.

**P4 — Keep disagreement visible.** A corrected or superseding source creates impact review.
Nondominated source disagreement remains attached and disabled unless the psychiatrist records a
scoped Developer opinion governing the game transformation. File order, source count,
publication date alone, point magnitude, or nominal evidence tier never chooses the winner.

**P5 — Own and inherit explicitly.** The narrowest reusable decision-driving topic owns the rule.
Diagnosis base/severity/specifier guidance, other active conditions, medication/formulation
relationships, interactions, setting, and patient-template overrides compose only through typed
scope plus explicit specificity. Case-specific overrides are narrow versioned exceptions; they
do not silently weaken shared knowledge.

**P6 — Compile permissively.** The encounter compiler collects every applicable reviewed rule
within the focused decision horizon plus global interaction/safety contributors. Missing
qualitative coverage creates a nonblocking coverage diagnostic and ticket. It never invents a
default penalty, declares an unmodeled option wrong, or invalidates the patient.

**P7 — Add points only after direction is accepted.** An accepted qualitative rule may receive an
initial explicit value from the already approved D-156 impact bands. The mapping remains
`provisional_balance`, separate from clinical concern and evidence certainty. It does not require
a second psychiatrist review before Developer/Reviewer play, but it remains auditable and may be
retuned from reference patients and encounter feedback.

**P8 — Preserve deterministic combination.** Every promoted contributor receives stable rule,
effect, and issue IDs plus explicit specificity. D-159 governs replacement, worst-only duplicate
harm, stacking of distinct fit effects, hard-contraindication suppression, and score caps. No
source or rule order has implicit precedence.

**P9 — Make the receipt the audit surface.** Each row preserves the rule ID, qualitative
classification, points, support path, exact formal contribution and/or Developer-opinion IDs,
clinical review metadata, balance status, applicability scope, and applied/replaced/deduplicated/
suppressed outcome. Engine-inferred matches remain labeled.

**P10 — Gate release, not plausible patients.** Promotion requires schema/catalog validation,
deterministic compile/replay, explicit reference-patient checks, and rule-combination tests.
Unresolved clinical direction stays disabled; unresolved point tuning may remain provisional in
Developer/Reviewer play. Coverage gaps create tickets rather than blocking generation. Human
lifecycle review separately decides whether a compiled encounter is ready for the Player bundle.

This creates an efficient loop: the reviewer decides the clinical/game meaning once, the system
makes a transparent provisional point guess, play exposes bad calibration or missing coverage, and
later source changes resurface only impacted rules.

**Q9:** Approve this two-stage contract, including automatic provisional D-156-band points after
one explicit qualitative-rule approval, without requiring a second psychiatrist review before
Developer/Reviewer play?

**Unlocks:** scalable database-driven scoring without treating source extraction as automatic
clinical authority.

### DBQ-010 — Choose the first deep database vertical

**Status:** resolved — approved 2026-07-28.

Choose the first topic whose knowledge dossier and dependency graph should move beyond thin
identity coverage. This is a database-authoring decision, not authorization to generate patients.
MDD remains the likely first topic because it touches common findings, medication fit,
psychotherapy, treatment history, safety, disposition, and clue-driven testing while still being
foundational for later, more complex encounters.

**Proposed default:** make MDD the first deep knowledge/database dependency vertical without an
outpatient, difficulty, or treatment-intensity ceiling on the reusable dossier:

**P1 — Deepen reusable knowledge, not one case.** The deliverable is a sparse but coherent MDD
diagnosis-family dossier plus explicit dependency and coverage maps to the finding, test,
medication, therapy, disposition, evidence, and decision-policy owners it needs. Hand-authored
`CaseBlueprint`s remain historical compatibility fixtures rather than becoming the new source of
truth.

**P2 — Keep the MDD dossier setting- and complexity-independent.** One MDD owner contains shared
state, mild/moderate/severe branches, specifier relationships, broad treatment roles, attribution
boundaries, and source-linked policies that can later be selected by outpatient, inpatient,
polypharmacy, ECT, ketamine, neuromodulation, and other encounter recipes. Sparse advanced
sections may remain disabled or ticketed, but the dossier structure must not exclude them.

**P3 — Treat current review depth as a tranche, not a dossier ceiling.** The first detailed review
may emphasize diagnostic attribution, initial treatment selection, prior response or intolerance,
and the first inadequate-response regimen transition because those are high-yield dependencies.
That sequencing does not define “adult outpatient MDD” as a separate diagnosis record or imply
that hospital and advanced-treatment MDD require duplicated files.

**P4 — Prepare dependency owners before composition.** Required reusable owners include
structured depressive and overlapping findings; severity/specifier state; adherence, prior-trial,
reaction, sleep, fatigue, appetite, weight, sexual, anxiety, substance, bipolarity, psychosis, and
safety concepts; current regimen and treatment-history records; BMI/physical findings; shared
tests such as clue-driven thyroid testing; broad medication and psychotherapy roles; and the
qualitative policies that connect them. New relevant concepts receive candidate bins even when
their deep review is deferred. Ticket triage works from general to specific:

1. identity, ownership, provenance, versions, aliases, and lifecycle;
2. canonical history/symptom/function/safety/substance findings, MSE, physical findings, vitals,
   measurements, demographics/context, conditions versus chart labels, reactions, regimen
   entries, prior trials, and treatment history;
3. laboratory analytes and panels, reference intervals and bounded result generation, named
   instruments, imaging/electrical studies, reveal actions, services, medications, therapies, and
   dispositions;
4. diagnosis and intervention dossiers plus their cross-topic relationships;
5. reviewed qualitative policies, prerequisites, fit, interactions, combination behavior,
   provenance traces, and provisional balance;
6. recipe/instance schemas, deterministic resolution, replay, persistence, diagnostics, and
   validation; and
7. generated patients and cohort calibration only after the preceding gate is coherent.

A thin MDD, GAD, or other dossier may be drafted earlier as a dependency-discovery probe. It does
not outrank missing general owners or authorize patient generation.

**P5 — Preserve source and ownership boundaries.** CANMAT adult MDD is an important
condition-specific source; ACP, WHO, current FDA records, the Mayo/Bostwick psychotropic-fit guide,
formal literature, and accepted Developer opinions contribute only within their reviewed scope.
Intervention, test, and finding owners keep their own knowledge and cross-link back to MDD; the
diagnosis dossier does not copy complete medication, procedure, or test files. Source-use,
correction, access-depth, and review limits remain explicit.

**P6 — Do not generate patients in this tranche.** Patient generation depends on stable,
versioned symptom/finding owners, context and weight models, regimen and prior-trial structures,
medication/intervention relationships, tests, comorbidity composition, qualitative policies, and
compiler passes. Deepening MDD should expose and queue those dependencies, not bypass them by
creating another authored patient or partially generated cohort. The generation-readiness ticket
remains blocked until an audit confirms that these general owners are represented and that any
intentional gaps are explicit, nonexecutable coverage tickets rather than silent case-specific
prose.

**P7 — Let encounter recipes own play time and difficulty.** A source-controlled case/encounter
recipe owns setting, focused best-next-step question, selected condition states, complexity budget
or envelope, available actions, presentation limits, and narrow overrides. The two-to-five-minute
target and any difficulty classification apply to the resulting encounter, never to the reusable
MDD dossier.

**P8 — Compose resolved encounters in the browser later.** After the dependency gate is met, the
deterministic engine should construct a complete `PatientInstance`, frozen `EncounterInstance`,
and `CompiledRubric` from approved static database files, one encounter recipe, clinic/location
state, and an internal seed when a patient slot is filled or explicitly refreshed. It saves every
resolved value and contributor; authoring does not check in a finite list of pre-generated
encounters.

**P9 — Define the current acceptance gate around database integrity.** The MDD dossier and every
prepared dependency must parse, retain stable IDs and provenance, distinguish unknown from
unsupported, expose coverage gaps without inventing rules, preserve diagnosis/intervention/test
ownership, and support reviewed qualitative-rule promotion. No generated-cohort, seed-distribution,
play-duration, or reference-patient gate applies until runtime composition is separately
authorized.

**P10 — Bound what is populated, not what MDD can represent.** This tranche need not author
psychotic, catatonic, perinatal, ECT, ketamine, advanced treatment-resistant, or hospital policies
without adequate sources and review. Those remain visible dependency bins and future review
packets rather than dossier exclusions. Complete bipolar, substance-use, delirium, and eating-
disorder engines remain separate verticals even when their concepts cross-link to MDD.

**Q10:** Approve MDD as the first deep knowledge/database dependency vertical, with no
setting/difficulty ceiling on the diagnosis dossier, general dependencies ordered before specific
case work, and no patient generation until the required files and compiler passes are ready?

**Resolution:** approved. MDD is the first deep knowledge/database dependency vertical. Its
reusable dossier has no setting, difficulty, time, or treatment-intensity ceiling. General
reusable dependencies precede diagnosis-specific case work, and patient generation remains
disabled until those files and compiler passes are ready. The first readiness audit and ordered
missing-owner queue are recorded in
[ENCOUNTER_GENERATION_DEPENDENCIES.md](ENCOUNTER_GENERATION_DEPENDENCIES.md).

**Unlocks:** a well-owned MDD knowledge graph and an explicit dependency backlog that can later
feed deterministic in-browser encounter construction without multiplying hand-authored patients.

### DBQ-011 — Define ongoing currentness, conflict, and maintenance cadence

**Status:** queued after one complete vertical exposes real maintenance costs.

Decide how often to rescout different relationship and source-unit types, how corrections and superseding sources
resurface affected records, when disagreement demands review, and how point/rule impact is audited
without repeatedly rereading every dossier.

**Unlocks:** a maintainable personal knowledge system rather than a one-time content import.

## Current stopping point

DBQ-010 is resolved. Work now proceeds through the ordered dependency gate in
[ENCOUNTER_GENERATION_DEPENDENCIES.md](ENCOUNTER_GENERATION_DEPENDENCIES.md), one bounded owner at
a time. The canonical finding boundary and the unambiguous portion of the 37-candidate
general-psychiatry seed are complete. The reviewer chose one decision-relevant anhedonia identity
for loss/reduction of interest or pleasure, then one broad self-reported fatigue/low-energy
identity while preserving its possible contributors as separate facts. The latter also exposed
and resolved the three-layer architecture boundary between patient truth, assessment response, and
surface wording. Its typed projection foundation is accepted technical work and generalized
compilation remains disabled. The approved general source/time rule resolved grandiosity,
impulsivity versus concrete behavior, suicide-preparatory-behavior timing, weapon access versus
concern, and reported versus observed thought disorganization without further clinical review.
Duration and subjective burden route to typed values. The paranoia boundary is also resolved. The
runtime catalog has separate medically unreviewed
identity shells for current self-reported suspiciousness or mistrust, ideas of reference, and
persecutory ideation; `paranoia` remains overlapping presentation/search vocabulary. The reviewer
also approved the next four-layer backend contract:

`latent true/false encounter proposition → source-specific patient-scene evidence → assessment or
reveal projection → surface wording`.

Claims from the patient, collateral, records, examination, and tests may disagree. Their exact
sources, shared origins, and known dependency groups must remain auditable so copied or correlated
claims cannot be naively multiplied or majority-voted. A false proposition is not automatically a
delusion, and patient-scene evidence remains separate from formal literature provenance. The
reviewer rejected any additional requirement that these claims converge on hidden truth or make a
case perfectly solvable. Realistic ambiguity and collectively misleading evidence remain valid;
blank, broad, unspecified, and conservative coverage answers belong in the rubric rather than a
generator winnability gate. The point-free proposition/evidence schema foundation is now
implemented and validated without a probability, scoring, diagnosis, reveal, migration, or
runtime-generation change. The exact next implementation owner is the already accepted
`ticket.catalog.findings.subjective-presentation-projection-foundation`.

While this dependency queue is active, each accepted item remains a tight local database iteration:
edit one bounded owner, run only its focused schema/content checks, and move to the next review.
GitHub publication, Actions/Pages observation, application builds, browser suites, and app-server
verification are batched until an explicit integration checkpoint or realistic-patient-generation
readiness.

Do not detail DBQ-011 until one complete vertical exposes real maintenance costs. D-173 authorizes
a two-stage promotion contract but not its schema migration or bulk rule activation. D-172 makes
missing route/rubric coverage a nonblocking diagnostic rather than patient invalidity. D-171
permits complex, diagnostically muddy psychiatric patients but activates no randomization. D-170
fixes shared finding/test/reveal ownership but does not authorize a clinical association,
generation tendency, probability, or point value. D-169 permits a narrow verified FDA-alignment
bonus but does not make regulatory status the treatment pathway or create an off-label penalty.
D-168 permits traceable speculative candidates but does not authorize automatic completion of
sparse sections, runtime AI, or speculative gameplay rules. D-167 still does not automatically
apply scouted sources, revise the tracked packet schema, or authorize bulk scouting. DBQ-002
authorizes only a one-dossier readiness pilot, and DBQ-003 authorizes candidate-bin architecture
rather than immediate bulk catalog generation. D-174 keeps diagnosis dossiers independent of
setting, difficulty, and encounter complexity and explicitly defers patient generation until the
reusable dependency files and compiler are ready. D-177 accepts the presentation-projection
boundary but does not implement it or permit string matching to stand in for reviewed mappings.
