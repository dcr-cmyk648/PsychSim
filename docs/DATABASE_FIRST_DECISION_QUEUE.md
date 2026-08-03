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
  (D-169), and therapy source/course detail compiles to a stable modality recommendation rather
  than encounter fidelity mechanics (D-189); and
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

Three implementation prerequisites are now resolved:

1. `ticket.catalog.findings.subjective-presentation-projection-foundation` (2026-07-28)
2. `ticket.engine.patient-generation.shared-finding-compiler` (2026-07-29)
3. `ticket.engine.patient-generation.catalog-compiled-instances` (2026-07-29)

They establish structural owners and attachments only; generalized generation remains disabled.

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
   symptom-targeted option, or discontinuation candidate. Source-specific eligibility roles may
   disagree. The selected submission's explanation as replacement, augmentation, or
   simplification belongs to its focused reviewed route rather than the medication record,
   patient state, or player payload.
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
   dossier supplies reusable eligibility, benefit, fit, and safety relationships; the focused
   route owns the matched transition meaning. This supports retention, replacement, augmentation,
   retrial, simplification, and duplicate-therapy review without a player intent field or
   simulated schedule.
7. Psychotherapy and other interventions share identity, evidence, role, fit, combination,
   redundancy, and capability concepts. A source or dossier may preserve course- or
   program-specific wording, while the encounter compiler projects a psychotherapy to its stable
   modality ID only. Selecting it means recommending that intervention now; it does not model
   duration, fidelity, practitioner, or completion. Referral remains a separate action when the
   focused decision is referral.
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

**P6 — Compile permissively but remain focused.** Exactly one primary decision policy owns the
dominant broad route. It need not hand-link every secondary effect. The encounter compiler may
discover any reviewed secondary contributor whose exact typed patient dependency matches the
complete frozen state and whose exact action target intersects the focused horizon. Matching
global interaction/safety and treatment-prerequisite contributors stay eligible. A background
diagnosis's broad route does not become another primary objective merely because the condition is
present. Exhaustive semantic scanning and a deterministic derived reverse index must return the
same ordered candidates. Missing qualitative coverage creates a nonblocking coverage diagnostic
and ticket. It never invents a default penalty, declares an unmodeled option wrong, or invalidates
the patient.

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
generator winnability gate. The point-free proposition/evidence, subjective-presentation,
measurement, structured test-result, complete resolved patient-state, and compact objective
exposure foundations are now implemented and validated. Exposure reuses medication/supplement
identities, adds only neutral other-substance identities, and permits one coarse misuse
probability plus medication prescription-context multipliers; no rate is currently authored.
Assessment/evidence, intoxication/withdrawal, diagnosis, scoring, migration, and runtime
generation remain separate. The intervention modality boundary is now resolved with one stable
file and ID per current treatment/disposition, exact registry membership, and no delivery/fidelity
schema. The medication-regimen boundary is also resolved as a runtime-excluded, point-free
catalog: explicit classes/memberships, concrete transition actions, route-owned explanatory
meaning, and separately typed contributors. D-237 supplies its first reviewed clinical records:
one exact five-medication MDD class, one count-aware initial-medication route, and a lossless
authoring adapter linked to the approved diagnosis rule. D-191 adds
the runtime-excluded, point-free decision-policy catalog, exact typed patient/action dependency
matching, scan/index equivalence, one primary route, frozen `CompiledRubric` provenance, and
nonblocking coverage diagnostics. D-193 now adds the pure exact-candidate shared-finding compiler:
one resolved value per definition, complete candidate/contributor dispositions, stable literal
hard-conflict output, explicit version-pinned all/any source projections, exact target horizons,
source/time-filtered proposition evidence, deterministic wording, and verified frozen output. It
does not choose diagnostic cardinality, weights, probabilities, points, or patients. The next
resolved boundary, D-194, atomically attaches a synthetic template, patient state, exact location
and horizons, frozen result bindings, shared findings, and compiled rubric with seed/payload
integrity. It performs no clinical draw or runtime migration. D-195 resolves
`ticket.engine.patient-generation.presentation-richness-envelope` with a small template-owned
envelope naming audited decision-driver categories and prior-effort expectation. Its pure
frozen-state evaluator records exact domain IDs/counts and only nonblocking shortfall/exception
diagnostics; it has no generation, scoring, rejection, or runtime authority. D-196 now adds a
standalone exact-template optional-condition profile and pure selector. It uses explicit game-only
count/candidate weights, selects without replacement, freezes selected and unselected traces, and
materializes exact condition states/bindings. Only selected endpoints of an approved literal
incompatibility pair produce a complete reproducible structural-conflict artifact. It does not
search, retry, infer from symptoms, generate findings, use clinical probabilities, assign points,
persist, or enter runtime. D-197 now binds those exact states to reviewed
`condition-finding-cardinality.v1` profiles, deterministically materializes fixed and bounded
finding outcomes, preserves selected/unselected mappings and unbound-condition coverage, and feeds
exact diagnostic/cardinality candidates into D-193. It does not turn nonselection into absence,
aggregate soft tendencies, infer diagnoses, use real criteria, score, retry, persist, or enter
runtime. D-198 now adds that separate `weighted-background-finding.v1` selector. Each exact bounded
horizon target has one reviewed finite outcome set; a deterministic game-only draw emits one
lowest-priority D-193 background candidate while retaining every offered value/weight and exact
upstream/profile/provenance/fingerprint trace. It does not infer a default value, inspect patient
context, claim prevalence, score, persist, or enter runtime. D-199 now adds the accepted
`additive-categorical-finding-tendency.v1` profile and pure aggregator. Each already-matched
reviewed contributor supplies a complete nonnegative vector over the same exhaustive
mutually-exclusive outcome set as D-198; the artifact preserves raw and pooled mass, exact
normalization, applicability, provenance, and one target-stable weighted draw. D-200 now retains
and validates one complete resolved-condition source followed by D-197–D-199, the exact assembled
D-193/D-194 request, and the resulting snapshot or literal conflict. Standalone integrity replays
that request rather than trusting candidate IDs. D-201 now adds the independent
encounter-recipe-owned optional-feature
budget selector: optional complications may spend the one existing hard maximum,
required/case-defining features remain outside it, and unspent capacity remains valid and
auditable. It selects module identities and accounting only. D-202 now maps the complete
comorbidity candidate pool bijectively into D-196 optional groups and materializes membership
directly from D-201 without another draw or charge. D-203 now supplies the neutral
resolved-condition-source contract and native verifier used by D-197. It embeds either the genuine
D-196 or genuine D-202 source, preserves native provenance, and performs no selection or budget
work. D-204 carries that same complete source through D-200, requires exact equality with D-197,
and retains D-201/D-202 provenance while attaching only resolved condition state/bindings to
D-194. D-205 now maps every D-201 allergy/reaction candidate to one complete uninterpreted history
alternative. Pairwise D-201 incompatibility guarantees at most one payload, and the bridge
preserves the exact upstream draw and budget without merging, rerolling, or charging again. It is
an authoring contribution only; composition with required/base reaction state and runtime remains
deferred. D-206 now gives prior-treatment modules additive nonempty record contributions. Several
compatible modules may independently spend D-201 budget and concatenate by globally unique record
ID; the bridge preserves repeated treatment identities, performs no inference or second charge,
and does not replace core history. D-207 now gives `substance_use` modules additive, nonempty
positive-use contributions across medication, supplement, and other-substance identities.
Compatible selected modules concatenate only when agent identities are disjoint; same-agent
alternatives require exact-version agreement and D-201 incompatibility. D-201 retains all
selection/accounting authority, and null means no optional exposure contribution. D-208 now
verifies all four typed lanes against one exact D-201 artifact and composes one complete
pre-finding patient state. It preserves required/default state, uses explicit whole-reaction
replacement ownership, appends history/exposure records, rejects collisions, and retains every
budget transition without another charge. The generic `other` module kind remains an unsupported
sentinel: unselected is a nonblocking coverage diagnostic, while selected produces an auditable
incomplete composition without reroll or refund. D-209 now makes that D-208 artifact D-200's only
pre-finding patient source. It removes independent state, binding, and proposition inputs; derives
the complete D-193/D-194 request; and propagates D-208 blockers before downstream compilation
without reroll or refund. D-210 now provides point-free whole-state tendency applicability:
approved definitions scan the complete typed D-208 state, retain exact same-record matches and
D-198/profile/version provenance, and emit at most one D-199-ready binding each without
probability or complexity work. D-211 now makes one verified D-210 artifact the sole source of
D-199 applicability bindings inside D-200. D-200 derives exact referenced profiles and finding
definitions, retains a complete zero-match audit with null D-199, and never charges D-201's
complexity budget again. D-212 now separates closed, structured non-finding source views from
hidden patient truth. It pins exact action, patient, source, time, record-partition, and alignment
audit; it cannot infer a negative from an empty collection or change D-201 spending. Universal
action/result recipes are now compiled by D-213 across the exact full action catalog. D-213 emits
one complete/incomplete/outside evaluation per action and a deterministic candidate only for
complete in-horizon sources; missing data never becomes a fake negative. Its source union remains
separate as an audit type. D-214 advances reusable templates to one static action-result assembly,
builds patient-specific D-212 envelopes only after final D-193 state, requires one complete D-213
artifact across the focused horizon, and makes D-194 derive every frozen result binding. Only
presentation-safe D-212 source views enter the patient instance; the full audit stays in the
authoring snapshot and replays through D-200 `5.0.0`. Measurements and observations retain
reviewed multi-action availability. None of these checkpoints changes D-201's one-time
complication spending, and information-action purchase points remain separate. No runtime
generation is enabled.

D-215 now compiles one already-selected, reviewed source-report profile over one exact frozen
patient state. It resolves each declared D-212 lane only as a complete `report_all`,
`none_reported`, `unassessed`, or `unable_to_assess` view, handles typed singleton fields, and
retains exact patient/profile/definition fingerprints plus deterministic replay. It does not own
profile selection, probabilities, partial record filters, complexity, action cost, scoring, or
points, and it is not yet attached to D-194.

D-216 now freezes one exact care setting across template, location, and encounter. The closed
values are outpatient psychiatry, emergency department, inpatient psychiatry, and
consultation-liaison. One template owns one setting, reusable diagnosis dossiers remain
setting-independent, and setting spends zero complexity and grants no operational capability.
D-216's structural contract was `attachment_only.v3`, catalog-instance compiler `3.0.0`, and
D-200 `6.0.0`. All current runtime locations remain outpatient; generalized generation and real
ED/inpatient/consultation-liaison operational content remain disabled.

D-217 now adds the separate source-report behavior horizon and selector required before D-215
attachment. One neutral horizon owns exact source-view slots; one reviewed care-setting profile
owns a fixed or weighted complete D-215 profile policy for every slot. Weighted mass normalizes
only inside one slot and independent stable substreams prevent unrelated slots from perturbing
each other. The selector verifies allowed sources and complete D-215 behavior coverage, retains all
candidates and replay fingerprints, and consumes no patient state or D-201 budget. No real profile
or source probability was added.

D-218 now replaces caller-authored D-212 projection recipes with the verified nullable D-217
artifact. Catalog compiler `4.0.0` runs D-215 only after final D-193 truth, retains both complete
authoring artifacts, derives D-213/D-214 attachments, and replays the whole chain through D-200
`7.0.0`. Empty horizons require both artifacts to be null. Fixed and weighted profiles compile
structurally in outpatient psychiatry, emergency department, inpatient psychiatry, and
consultation-liaison without a complexity charge or operational capability grant. Real profiles,
weights, action recipes, non-outpatient locations, persistence, and runtime generation remain
separate.

D-219 now supplies the exact operational-admission proof that D-216 deliberately did not infer.
One authoring-only compiler evaluates every focused information action, medication start,
current-regimen operation, intervention, and disposition against a version-pinned physical
location and minimized operational owners. It uses only that location's capabilities, base
formulary, disposition allowlist, and eligible service methods. A setting label, facility tier, or
neighboring location grants nothing; staff-dependent access remains pending explicit runtime
context; current-regimen operations remain patient-owned.

The artifact preserves owner fingerprints, method blockers, and honest incomplete-coverage
diagnostics. It contains no clinical rule, minimum-safe-route requirement, cost, point, quality,
reimbursement, cheapest-method choice, or complexity operation. D-194/D-200 now require, retain,
and replay the complete artifact under `attachment_only.v4`, catalog compiler `5.0.0`, and D-200
`8.0.0`. Synthetic explicit-resource tests cover all four care settings. Real non-outpatient
catalog owners, selected-location `ClinicState` access, generated queue/save migration, and
compatibility/runtime activation remain separate work.

D-220 now materializes exact instrument-item responses as a standalone authoring artifact after
D-193. One `instrument-item-response-only.v1` owner pins only the item's response scale and complete
option set, owning information action, respondent source, time scope, and an opaque instrument
rights boundary. The compiler uses the exact shared-finding artifact and projection horizon, exact
universal action catalog, and a minimized `InstrumentInformationActionHorizon`. It requires one
approved exact item owner and exactly one D-193 `response_option` per target.

Option sets must match exactly between the horizon and item and across every item sharing one scale
ID. Instrument targets must have a null display channel, their projections cannot use expression
banks, and the owning action's neutral report source must agree with the item. D-220 retains one
complete or incomplete evaluation per target, all source contributors, itemized diagnostics,
fingerprints, normalized inputs, and deterministic replay. It returns an explicit complete empty
artifact when the horizon contains no instrument items.

D-220 compiler `1.0.0` imports no real instrument definition and owns no wording, score, total,
threshold, interpretation, probability, action cost, point value, or D-201 complexity operation.
It copies reviewed respondent/time metadata from the item and does not infer finding modality from
D-193. D-213 remains unchanged and still reports instrument projections as unsupported. D-221 is
the next bounded attachment owner, but its schema/version changes and ticket remain separate.

D-221 now closes that bounded attachment seam. `PatientTemplate` advances to
`attachment_only.v5`, the static assembly to `universal-action-result-assembly.v2`, D-213 to
`2.0.0`, catalog compiler/D-194 to `6.0.0`, and D-200 to `9.0.0`. D-194 derives the minimized
instrument information-action horizon and runs D-220 only after final D-193 truth. D-213 indexes
each exact complete response under its owning action, and D-214 derives both the encounter selector
and a strict presentation-safe patient response.

The complete contributor- and projection-bearing D-220 artifact remains at the snapshot root and
inside D-213's compile request. Integrity replay requires exact equality and separately rejects
root, nested, patient-safe, or binding tampering. A zero-instrument horizon attaches a complete
empty artifact and no patient response. The path runs uniformly in outpatient psychiatry,
emergency department, inpatient psychiatry, and consultation-liaison, but derives no resource from
the setting name and does not select or spend D-201 complexity. No real instrument wording, total,
cutoff, interpretation, point rule, runtime generation, persistence migration, or UI was added.

D-222 now supplies the standalone selected-location operational-resource projection. Compiler
`1.0.0` accepts one exact ClinicState, facility, selected location, complete
`clinic-location-resource-assignment-horizon.v1`, and current minimized upgrade/formulary owner
horizons. The clinic-wide horizon covers every built location exactly once; its nested assignments
pin exact location versions plus versioned/fingerprinted upgrade and formulary references, while
each upgrade owner declares `exclusive_location` or `shared_locations`.

Compilation validates exact facility/tier/location/department context, assignment coverage,
reference-to-current-owner identity, clinic and equipment ownership, facility allowlists,
exclusive/shared placement, exactly one valid staff configuration, no duplicate or cross-staff
automatic-action overlap, and formulary ownership/grant parity. Only the selected location's
baseline resources plus valid explicit assignments enter the artifact. Clinic-global or
neighboring-location upgrades, capabilities, formularies, equipment, and staff never enter by
union. The same algorithm applies in outpatient psychiatry, emergency department, inpatient
psychiatry, and consultation-liaison; setting names grant nothing.

The complete/incomplete artifact retains normalized input, itemized diagnostics, current-owner
fingerprints, and deterministic replay. D-224 has now attached D-222 `2.0.0` to D-219 `2.0.0`,
including exact formulary membership, and advanced D-194/D-200 to retain the chain plus a separate
validation-only current-context check. D-222 remains authoring-only and outside patient/encounter
projections, persistence, runtime queues, clinical correctness, service selection, costs, points,
probability, economy, and D-201 complexity.

D-223 now owns one complete synthetic pre-finding orchestration pass. Authoring compiler `1.0.0`
runs D-201 once, derives required-only D-196 versus D-202 from the complete candidate horizon,
retains every present D-205/D-206/D-207 lane artifact even when its materialization is null,
requires explicit reaction-history ownership, and passes only those genuine artifacts to D-208.
A literal condition conflict or unsupported selected `other` returns audited `not_composed`
without reroll, refund, or a second complexity calculation. Exact template, seed, profile,
horizon, core, nested-artifact, and deterministic child-ID context replay across outpatient, ED,
inpatient psychiatry, and consultation-liaison. D-225 has now attached D-223 as D-200 `11.0.0`'s
single pre-finding root. D-200 derives the genuine nested D-208 artifact; a caller cannot provide
a parallel composition root. The orchestrator remains authoring-only and adds no real content,
runtime generation, persistence, clinical rule, point, or probability authority.

D-231 now supplies the sole template lifecycle horizon upstream of operational admission.
Standard/Normal and Endgame accept an explicit lifecycle-approved lane only; local Developer may
add a separately supplied lifecycle-review lane. Wrong lanes, other lifecycle states, and
duplicate stable IDs are rejected. Medical review remains independent, and setting, pool,
dependency coverage, weights, complexity, points, and prior-run state do not affect inclusion.

D-226 `3.0.0` now supplies the current-context template/location admission matrix and derives its
templates only from verified D-231. It compiles exact D-222
resources once per built location and evaluates every template × location cell with exact
versioned compatibility, care setting, action horizon, universal result assembly, and D-219
mechanical coverage. It handles outpatient, ED, inpatient psychiatry, and
consultation-liaison uniformly, but it does not select a patient, weight a queue, run a clinical
policy, or spend optional complexity. Real non-outpatient locations/resources, persisted
assignments, distribution/repeat/refill policy, compatibility save/runtime migration, and runtime
activation remain later work.

D-227 now supplies the strict minimized clinic operational context consumed by D-222 and D-226.
Only clinic/facility/tier identity, built locations/departments, resource ownership, staff
automation, and formularies participate. Points, satisfaction, active location, global capability
unions, labels, and Endgame/debug flags cannot stale or grant admission. This advances
D-222/D-219/D-194/D-200/D-226 to `3.0.0`/`3.0.0`/`8.0.0`/`18.0.0`/`3.0.0` without changing saves,
clinical content, probability, points, queue policy, or optional-complexity spending.

D-229 resolves the queue-coordinate decision above D-228. Every generated-patient slot belongs to
one exact physical location; its candidate horizon is every and only admitted D-226 cell for that
location. D-230 resolves the local selection decision with a versioned location-pinned positive
game-distribution profile, one deterministic 64-bit slot-local draw, and nonzero stable-template-ID
suppression for active waiting and bounded recent-completion repeats. Each suppression class
applies once and remains fully audited. D-228, D-229, and D-230 `2.0.0` nest the changed
D-231/D-226 proof. D-233 now wraps D-230/D-232 as D-200's sole slot root. D-200 `18.0.0` derives
the historical template/location/D-219 chain through that authority and rejects parallel raw
selection/capacity roots.

D-232 now owns the separate exact-location capacity proof. Base slots and explicit capacity
upgrade contributions compile from a minimized capacity-only ownership/assignment context into
stable coordinates. D-200 requires a compact D-232 certificate as the sole capacity authorization
for its D-230 coordinate. A separate successor profile and atomic migration compiler preserve
frozen patients, seeds, templates, historical selection proof, and source provenance while adding
fresh target capacity and D-226/D-228 proof. Any occupied-location mapping, capacity, or exact
admission failure blocks every commit; no patient is rerolled, dropped, truncated, or partially
moved.

Normal progression begins with outpatient locations; ED, inpatient, and
consultation-liaison require real unlocked/built owners. Endgame and Developer may broaden their
explicit D-231 horizons, but retain exact setting and location and gain no resources from their
mode labels. Developer already-run state remains queue/persistence policy rather than lifecycle
membership; D-234 now proves that authoring-only queue policy, while persistence and runtime
activation remain open. A future clinic-hub queue is only an aggregate projection.

D-233 is resolved. One private per-mode root plus exact location, first empty coordinate, and its
monotonic ordinal derive a template-selection seed. The exact D-230-selected template then derives
one patient-generation seed shared by D-223, D-197, D-198, optional D-199, D-193/D-194, optional
D-217, and the final patient. Request/audit identities, unrelated slots, weights, points, prose,
and file order are excluded from seed entropy. A successful attempt proposes one complete frozen
patient; a deterministic compile blocker leaves the slot empty, records the exact reason, consumes
one ordinal, and never retries silently. Multiple empties fill individually in canonical order.

D-234 is resolved. Encounter completion vacates only the exact coordinate and advances bounded,
duplicate-preserving mode/location completion history with unique replayed identities. Endgame and
Developer refreshes create skipped records rather than completions. Developer completion
separately advances one stable template ID/content-version run entry; unrun selection excludes
completed versions globally and active waiting versions at that exact location, rejects
same-version fingerprint mutation, recomputes after each fill, and can exhaust after earlier
successes without consuming another ordinal. Same-template rerandomization has no fallback and
targets the canonical first vacancy after removal. Ordinary D-233 `2.0.0` attempts pin one
generation root, distribution profile, and current matrix, proceed in canonical order, preserve
earlier successes, and stop at a blocker. A later request can continue only by retaining the exact
transcript and explicitly authorizing that blocker, so the retry starts at its incremented ordinal
with new seeds.

D-235 is resolved. `GeneratedCompletedEncounterAttempt` replaces the temporary opaque payload with
one compact replay snapshot derived from the exact D-200 waiting patient, native patient and
encounter instances, exact purchases and fulfillment, editable diagnosis and V2 treatment
selections, contiguous events, complete compiled-rule trace, provisional point snapshot,
arithmetic-verified all-points settlement, and deterministic fingerprints. D-234 v2 embeds and
cross-checks that attempt before vacancy. Persistence timestamps stay in a separately
fingerprinted wrapper, while family-only diagnosis validation and unverified treatment/settlement
inputs remain explicit limitations.

D-236 audited that proposed persistence checkpoint and deliberately deferred it. The native chain
still lacked one real reviewed file-backed route/policy vertical, native balance and price
authority, frozen player/reviewer presentation, and a compact private queue restore shape.
Persisting D-234's recursive authoring artifacts or widening compatibility attempts/review exports
would add risk without enabling realistic play. SaveData v5, IndexedDB, the compatibility queue,
automatic Standard refill, multi-location refresh orchestration, review/export projection, and UI
therefore remain unchanged.

D-237 through D-239 now close three of those blockers. D-237 supplies the exact point-free MDD
medication grouping, one-start route, policy, adapter, and full cardinality evaluator. D-238 adds a
separate exact rule-to-balance catalog and native scoring path: one reviewed start earns the
provisional dominant-route `+200`, other cardinalities earn zero, and D-235 v2 no longer accepts
caller-authored trace rows or point totals. The route/policy versions do not churn when balance is
retuned. D-239 joins the existing full versioned service owners to D-219/D-222, makes purchase
commands quote-free, and derives deterministic information fulfillment, cost, and savings in
D-235 v3. Treatment charges and other settlement inputs remain separate unverified work.

D-240 then closes the first missing reusable presentation owner found by the real-MDD audit:
duration and burden now have a standalone exact target/source/time/action projection, complete
authoring provenance, and a separately target-redacted frozen reveal. It deliberately does not
change the existing universal-result or instance-attachment versions.

D-241 now attaches that verified source without admitting caller-authored records or hidden target
identity. Static assembly v3 owns exact definitions; D-194 `9.0.0` runs D-240 after final truth;
D-213 `3.0.0` treats target absence as neutral but prevents missing or ambiguous applicable
definitions from being masked; D-214 attaches only referenced safe reveals; and D-200 `20.0.0`
retains the full nested audit without another D-201 charge.

D-242 closes the next native scoring audit seam. One strict decision snapshot now contains the
presence-semantic purchased information actions plus final diagnosis and treatment selections.
The player snapshot is derived from verified event replay, while the reference is one explicit
database-plan snapshot. Exact frozen-horizon validation and a separate selected-action matcher
distinguish selected actions from D-191 availability. Existing D-237/D-238 treatment-route matches and
points remain unchanged.

D-243 closes the mechanical treatment-triggered information seam. One diagnosis-owned
prerequisite now keeps a non-information trigger separate from information-only fulfillment.
D-191 `3.0.0` requires both in the exact horizon, preserves the exact originating policy
ID/version and focused-decision ID, and compiles only under that same policy scope. D-242 decisions
evaluate actual selection as not triggered, fulfilled, or omitted. The two approved MDD
any-medication-start rules adapt with non-null typed patient scope and without tags, while the
antidepressant/mania tag rule remains disabled.

D-244 closes the first three-outcome prerequisite-balance slice without reopening clinical
meaning. The two approved rules now have separate exact runtime-excluded balance owners:
reconciliation `+35/-25` and reaction history `+30/-40`, with zero when no medication trigger is
selected. Native scoring and D-235 replay retain not-triggered/fulfilled/omitted plus both
component Booleans. The primary route remains separately `+200`. Exact canonical balance-payload
fingerprinting is recorded as a pre-runtime persistence debt rather than implied by stable
ID/version references.

D-245 closes native secondary-rule combination using the already-approved D-159 semantics.
Per-rule evaluation now precedes one deterministic pass for same-effect specificity replacement,
exact-selected-target hard-contraindication suppression of positive treatment-fit contributors,
and worst-only same-issue negative consequences. Broad selected starts and regimen operations are
canonicalized to exact medication or regimen-entry targets. Every player and database-plan row
retains pre-combination points, applied points, direct controller chain, explanation, selected
targets, and prerequisite state. Current compilation rejects equal-priority same-effect ambiguity,
while replay preserves the stable tie-break, reconstructs exact targets, refuses noncompiled
source rows, and rejects trace tampering. No real secondary relationship or balance was activated.

D-252 closes the exact balance-payload replay debt before runtime activation. Native balance
`5.0.0` produces a minimized, fingerprinted snapshot containing only the exact point owners needed
by the compiled rubric while separately fingerprinting the full source catalog. D-235
`7.0.0`/point-report v6 freezes complete player and database-plan traces and revalidates every
pre-combination magnitude and explanation from that snapshot. Same-ID/version retuning changes the
snapshot fingerprints. No SaveData, runtime queue, clinical rule, or point magnitude was added.

D-270 closes the caller-authored treatment-charge seam for service-backed interventions and
dispositions. The same exact service owners used by D-239 now join the complete D-219 treatment
horizon; replay snapshot v3 freezes treatment owners, nullable service bindings, and available
equal-quality methods. The submitted decision derives and replays one least-cost quote per selected
service-backed option. Service-free treatments and medication/regimen actions receive no invented
price. Base reimbursement, challenge, satisfaction, and prior-bank inputs remain the next
settlement-ownership work; SaveData and runtime activation remain deferred.

D-271 closes that structural settlement-owner work. One exact-template provisional economy policy
owns base reimbursement and challenge bonus; the current ClinicState owns bank-before,
lifetime-before, and raw satisfaction; and one exact versioned satisfaction configuration derives
the multiplier. The full owner set is frozen in replay snapshot v4 and must match the same D-227
clinic projection that admitted the patient. Real economy-policy records and balance review are
still required before a generated template can activate; no value is derived from diagnosis,
severity, setting, or optional complexity.

D-272 closes the already-identified generated diagnosis-qualifier seam without widening clinical
content. Every diagnosis horizon option must resolve to one exact selectable diagnosis-definition
owner. A pure compiler projects only the option/diagnosis versions, source-definition fingerprint,
family-versus-severity player mode, reviewed enabled severity allowlist, and reviewed
player-selectable specifiers with exclusivity groups. Generated decision validation now rejects
MDD severity qualifiers while retaining the reviewed psychotic-features identity as an available
future named qualifier. Replay snapshot and attempt v5 retain and verify that minimized owner set;
no diagnosis rule, hierarchy score, answer key, severity generation, PatientTemplate, runtime, or
UI is activated.

D-273 closes the standalone cosmetic launcher-resolution contract. A versioned profile references
exact curated fictional-name pools and reusable short chief-complaint banks. Independent stable
draws resolve first name, last name, optional middle initial, complaint bank, and complaint
variant, while the audit retains every exact input and fingerprint. Names never receive
race/ethnicity or clinical inputs; complaint wording never becomes a diagnosis, finding, rule, or
point signal. Equal-priority general and condition-specific banks may mix; higher priority is an
explicit authoring override. Real content, D-200 attachment, persistence, and UI remain later
bounded items.

D-274 adds only the requested transitional local Patient Maker for already playable compatibility
cases. Complete case validation creates its finite allowlist; the complexity selector filters on
an exact authored budget; and ordinary deterministic instantiation/eligibility persists the
selected CaseInstance in one reserved Developer queue slot. It does not make a real
PatientTemplate, consume D-201 modules, attach D-273 to D-200, or change the database-generation
readiness result below.

D-246 re-audits the first real MDD compile slice without creating another readiness framework.
The D-223/D-200 chain is executable, but all of its template, core-state, generation-profile,
projection, universal-result, source-report, and real launcher-profile/content attachment inputs
remain synthetic or absent; the standalone D-273 resolver contract does not fill those inputs.
Compatibility patients remain compatibility-only. The authoritative dependency ticket and
audit now identify a real `PatientTemplate` as the first executable blocker and the MDD episode
finding/cardinality owner plus finding-identity completeness review as its first clinical
dependency.

D-247 accepts the atomic-owner model for MDD symptoms and records the implementation boundary:
reusable findings and measurements are declarative inputs, diagnoses compose exact versioned
references, and pure compilers resolve patient state. The finding catalog now includes the
currently missing increased-appetite, indecision, worthlessness, and self-reported/observed
psychomotor identities; weight and BMI remain numeric measurements. The active packet is now the
narrow clinical/modeling question of how MDD symptom dimensions and concrete manifestations count
without backend facts being blended or double-counted.

D-248 resolves the general modeling portion. D-197 v3 can select reviewed core/cluster-constrained
dimensions and then separately select manifestations, preserving all backend facts while counting
each dimension once. Pessimism is now a neutral finding owner. The active MDD ticket remains
blocked only on its diagnosis-specific evidence: exact core/cardinality/grouping and the roles of
pessimism and suicidality. The ordered evidence work is maintained in
`docs/DATA_ADJUNCT_EVIDENCE_QUEUE.md`, with canonical status in the source-request catalog.

The remaining exact real finding/result/source/presentation ownership needed by that same
outpatient vertical resumes. SaveData versioning resumes only after the vertical can deterministically generate,
play, score, settle, replay, and produce a deliberately minimized review snapshot.

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
D-190 supplies no class memberships, clinical contributors, route content, points, or runtime
evaluator; those remain reviewed content/compiler work. D-191 supplies the compiler boundary but
does not populate the policy or regimen catalogs, map qualitative rules to balance, migrate
compatibility cases, or enable generated patients.
