# Content model

## Catalogs and stable IDs

Catalogs contain reusable, versioned definitions for diagnoses, investigations, services and fulfillment, individual tests, reference-interval sets, medications, formularies, treatments/dispositions, demographic variant pools, locations, facilities, upgrades, and decor. Each diagnosis family has one file under `content/catalogs/diagnoses/definitions/`; shared rules, its severity axis, specifiers, comorbidity relationships, complexity contributions, and source-use notes remain nested in that family. Each laboratory or diagnostic study has one file under `content/catalogs/tests/definitions/`; panel components remain nested only inside their owning test. `content/catalogs/tests/reference-interval-sets.json` owns reporting/unit conventions, jurisdiction, numeric-range authority, policy sources, and review state referenced by profiles. `content/catalogs/upgrades/upgrades.json` owns point cost, prerequisites, allowed facility tiers, optional department, granted capability/formulary IDs, affected services, in-house cost metadata, target facility where relevant, and unlock labels. `content/catalogs/decor/decor.json` separately owns decor items plus the versioned satisfaction curve/cap. IDs are lowercase, namespaced strings and are never inferred from labels. Case content and future authoring tools may select only existing permitted IDs.

Classification catalogs are a separate authoring layer, not reusable runtime knowledge.
`content/catalogs/diagnoses/classifications/icd-10-cm/2026/` tracks an immutable release manifest
for the official CDC/NCHS FY 2026 F01–F99 scope. The release pins source/member hashes, dates,
importer version, expected term count, and normalized-output hash. Its generated code-title cache
is gitignored local data under a narrow U.S. fair-use assessment. Terms contain only code,
PsychSim-derived code-prefix parent, exact descriptions, billable/category state, and source order.
They support authoring search and are excluded from `CatalogBundle`, Git distribution, and
production output.

A playable diagnosis can reference that background through `classificationBindings`. Each compact
binding names the release, code, explicit semantic relation, reviewer note, and independent review
record. Bindings are never inferred from matching names and do not import classification terms,
diagnostic requirements, severity logic, or treatment recommendations into the diagnosis file.

Formal evidence is a catalog, not raw source storage. Every article, guideline, systematic review,
structured database, regulatory document, book chapter, professional guidance source, or
correction notice has one `EvidenceSourceDefinition` file with a stable ID, title,
authors/organization, publication and last-review dates, version, DOI/PMID/link where available,
canonical citation, known content hashes, jurisdiction/population/setting, explicit
access/reuse/AI/local-extraction policy, bibliographic verification state, and independent
medical-review state. Correction, update, supersession, companion, and executive-summary
relationships are source-to-source edges validated against the same catalog. Multiple cases and
medications cite the same entry rather than copying citation strings. Generation provenance also
snapshots the selected evidence-source IDs alongside private source-document and chunk IDs.

Source type is not a universal authority score. Future `EvidenceClaim`, `EvidenceContribution`,
and `EvidenceBody` records will evaluate compatible propositions by question-specific design fit,
result-level bias or supplied certainty, directness/applicability, currency/search-through date,
correction state, and provenance role. GRADE-style certainty belongs to a body of evidence, not to
one article unless a source explicitly reports it. A verified direct source outranks an aggregate
for the exact fact, but a conventional efficacy synthesis does not automatically outrank
observational evidence for a rare harm or a direct pharmacokinetic study for an interaction.
Nondominated disagreement remains `contested` and routes to review; publication date, file order,
source count, or a hidden numeric evidence score never selects a clinical winner.

An `EvidenceContribution` records how knowledge entered content. It declares `formal_publication` or `expert_opinion`, every formal evidence ID used, optional private document/chunk provenance, exact target content IDs, contribution types, and a concise original contribution statement. Formal contributions require catalog IDs; expert opinion forbids them. A publication can be cataloged but unused. A rule can cite multiple relevant publications through separate or multi-source contributions. Unlinked prototype rules are rendered as Expert opinion, while approved rules require an explicit contribution.

DrugCentral is cataloged as an authoring-only `structured_database` source. Its initial rights
decision allows local deterministic indexing and unreviewed claim candidates but blocks runtime
redistribution. Every candidate retains the database release, record origin, available upstream
source IDs, and `aggregator` role. Direct-source verification can refine or supersede its support
without erasing that provenance.

The user's residency-site article aggregate will use a separate future authoring shape. One private
hashed `SourceDocument` contains many logical `AuthoredSourceUnit` records; short
`DeveloperOpinion` candidates point back to the exact unit/chunks and retain the original “as of”
date, currentness, target IDs, and later evidence relationships. Embedded citations begin as
unverified bibliographic candidates. Current schemas do not yet implement those logical units or
opinion-to-evidence relationships; the aggregate must not be flattened into the existing
case-specific contribution shape.

`SourceUseDecision` is the rights gate between bibliography and any processing or derived content.
It records permission for local storage, extraction, local structured indexing, AI-assisted
processing, derived clinical content, runtime redistribution, and commercial distribution, plus territory, attribution,
third-party, and review obligations. A proposed fair-use exception must include a complete
four-factor assessment. The canonical contract is
[SOURCE_USE_POLICY.md](SOURCE_USE_POLICY.md).

The source-specific CC BY-NC-ND notice in the WHO CDDR PDF blocks adapting that publication into
rules without permission; the ICD-11 API/digital classification is separately NoDerivatives.
DSM-5-TR is also metadata-only pending written permission. A clinician may privately cross-check
independently authored content, but the resulting residual judgment remains labeled Developer
opinion rather than becoming an implied CDDR/DSM contribution or concordance claim.

The current release/term schemas are intentionally specific to ICD-10-CM. If exact ICD-11
identifiers are added later, a distinct schema must retain each code, title, and WHO URI together
and enforce the ICD-11 API terms. The existing importer is not a generic cross-classification
ingestion path.

`content/registry.json` is the persistent relationship map from stable content IDs to their files, categories, dependency IDs, and runtime-inclusion status. Validation cross-checks paths and dependency edges against the explicit static imports. It is data, not a dynamic production glob: Vite still bundles only deliberately imported approved content.

Each medication has its own definition file. It owns class/tags plus separate arrays for active fit modifiers and protected human author overrides. Bupropion preserves supplied concepts as inactive, explicitly unreviewed overrides. Mirtazapine also contains active prototype modifiers (+35 for a matching insomnia tag and −50 for a matching high-BMI tag) to exercise the fit architecture requested for playtesting. The trace labels their unreviewed status. A modifier is not clinical authority merely because it is executable; later sourcing/review must version or reject it.

The current medication shape is a runtime compatibility layer, not the target background
knowledge database. Future authoring separates stable ingredient/formulation identity, sourced
classification memberships, product/regulatory records, structured evidence claims, concise
Developer opinions, executable clinical rules, and balance values. Source imports may populate
only the factual/claim layers as medically unreviewed drafts. A reviewed transformation is required
before a claim becomes a rule, and a separate balance decision supplies points. Shared class claims
remain normalized while a generated per-medication audit view assembles everything relevant to one
medication for review. See `docs/MEDICATION_AND_INTERVENTION_DATA.md`.

Psychotherapies and other reusable interventions follow the same principle. One file identifies
each therapy family or meaningfully distinct program, while shared evidence and fidelity
requirements remain referenced rather than copied. A generic modality, protocol-based therapy,
referral, and complete manualized program are distinct concepts. Exact manual text, worksheets,
scripts, and training materials remain outside the database unless an item-specific permission
allows them.

Locations declare facility tier, capabilities, formulary, and dispositions. Facilities declare stable location IDs, one default location, minimum lifetime points, persistent patient-slot count, and permitted upgrade/decor IDs. A clinic's effective formulary is the stable union of its persisted formulary purchases and the active location's baseline formularies. Services declare one or more outside, partner, shared, or in-house methods. Cases provide patient-specific results; catalogs and ClinicState provide availability and cost. Equipment acquisition adds capability IDs and makes a cheaper catalog service method eligible; it never alters the result or rubric. A facility purchase swaps only the declarative facility/location baseline while preserving owned upgrades. A decor purchase adds raw satisfaction and a visual token; the pure engine derives the capped multiplier.

## Template, patient instance, and encounter instance

The current prototype stores one `CaseBlueprint` per generative patient family. It still combines a
generator recipe, patient-specific content, and much of the rubric so the first loop remains
executable. That shape is transitional and should not be multiplied into hundreds of cases.

The portable Reviewer cohort exercises a narrow intermediate split without claiming to be the
final compiler. Each `ReviewCaseScenario` file owns patient state: internal diagnoses, typed
critical facts, current regimen entries, prior-trial records, short complaint/duration variants,
structured finding overrides, setting, and one referenced policy ID. Eight shared
`ReviewDecisionPolicy` records own the provisional focused workup/treatment/disposition rubric and
four executable reference selections. `buildReviewCaseCohort` schema-parses both sets, rejects
duplicate or missing/orphan policy IDs, fills the universal 36-action menu with patient-specific
immediate results, and emits ten ordinary `CaseBlueprint` snapshots for existing engine/replay
compatibility. The policies and all compiled rules remain medically unreviewed reviewer targets;
they are not promoted shared clinical guidance.

The next schema split is:

- a source-controlled `PatientTemplate` owns setting, condition and chart-record constraints,
  patient-family optional-comorbidity pools, regimen/prior-trial constraints, clinical-context
  dimensions, presentation generators, specific observations, encounter focus, narrow overrides,
  and provenance;
- reusable diagnosis, medication, investigation, therapy, disposition, and clinical-decision
  policy files own knowledge shared across templates;
- a `PatientInstance` saves the fully resolved fictional person, including every internal
  condition, chart diagnosis entry, medication-regimen entry, prior trial, typed fact, derived tag,
  observation, demographic choice, and seed;
- an `EncounterInstance` freezes the immediate decision snapshot, available actions, and compiled
  rubric;
- an attempt saves player events against that frozen encounter.

The compiled rubric is derived from reviewed reusable rules plus explicit patient-specific
overrides. A patient template should not copy a complete treatment plan from every diagnosis file.
Current `CaseInstance` snapshots remain immutable and replayable during migration; no old save is
silently reinterpreted. [PATIENT_GENERATION_ENGINE.md](PATIENT_GENERATION_ENGINE.md) specifies the
target boundary.

Metadata explicitly classifies a template as `starter`, `transitional`, or `advanced`; this is an
internal pool selector, never launcher copy, and does not bypass
lifetime/location/capability eligibility. Seeds are never player-facing because recognizable seeds
could become an answer leak.

## Invariants and controlled variation

Critical facts include everything that changes scoring, safety, diagnosis-relevant logic, interactions, thresholds, tests, treatments, pathways, or dispositions. They are fixed in a blueprint. Noncritical fields may use only declared `choice`, `weightedChoice`, `integerRange`, `decimalRange`, or `textTemplate` generators. Each variant is explicitly marked noncritical and targets an allowed patient presentation field.

Gameplay-critical variation uses `PatientClinicalContextDimension`, not the cosmetic variant list.
Each reviewed dimension resolves exactly one gameplay-weighted option. Options bind typed facts or
findings and derive stable fit/context tags, so the revealed record and downstream rules cannot
disagree. `CaseInstance.resolvedClinicalContext` preserves the choice for replay. Optional
multi-diagnosis composition is separately bounded; its candidates and game weights are explicitly
owned by the patient family rather than globally drawn from diagnosis relationships.
[DIAGNOSIS_ENGINE.md](DIAGNOSIS_ENGINE.md) defines the current boundary.

Instantiation hashes the seed with stable variant IDs. It never calls `Math.random`. Shared catalog pools supply long curated lists for fictional names, occupations, education, locations, and neutral social details; case-local variants supply only reviewed ranges or wording. The starter patient combines name, age within 27–39, occupation, and opening phrasing for well over 100 possible presentations. Variants cannot target protected critical structures or silently affect treatment logic. Tests sample many seeds and compare the full critical/scoring structures.

Each test file declares the patient context it consumes (`age_years`, `sex_for_reference`, `diagnosis_ids`, and/or `clinical_tag_ids`) and either a `numeric_panel` generator or `patient_owned` policy. Numeric profiles have priorities, context predicates, a versionable reference-interval set ID/population label, UCUM units, low/high bounds, narrower normal-generation ranges, display precision, test-specific incidental probabilities, and curated mild low/high ranges. Resolved numeric observations preserve display precision and show result, unit, reference interval, and `N`/`H`/`L` interpretation. See [LAB_RESULTS.md](LAB_RESULTS.md). The current prototype numbers are explicitly unreviewed. When a patient does not own a result, instantiation selects the highest-priority matching profile, generates every component, and may flag at most one component in that panel. Generated observations carry `generated_normal` or `generated_incidental`, `clinicallyCritical: false`, and `notCaseDefining: true`. Validation requires a fallback profile, normal ranges inside reference limits, matching flags, and incidental ranges within 25% of the reference span outside the boundary. A patient-authored observation suppresses generic generation. Findings capable of changing workup, diagnosis, treatment safety, points, or disposition remain critical and require an explicit reviewed patient/variant.

## Information and workup

Every information option has two layers. The shared `InformationActionDefinition` catalog owns the stable ID, neutral label and description, History/Physical/Labs/Imaging category, SOAP section, report source, service, and repeatability policy; that same presentation is used in every compatible case. Each patient blueprint supplies only the immediate patient-specific structured result, revealed fact IDs, and default post-submit classification. A result is a list of short finding atoms with swappable labels and explicit outcomes. Variable finding sets declare minimum/maximum positives and required present/absent IDs; they cannot contain arbitrary code. The browser never displays classification or point rationale before submission.

Some actions may reveal a compact summary derived from a larger shared fact family without
revealing every component. General psychiatric history, for example, includes a routine
suicide-safety screen. The separate `Suicide and self-harm assessment` History action reveals the
detailed ideation, intent, plan, preparatory-behavior/attempt, means-access, prior-attempt, and acute
modifier fields. Unrevealed detail remains unknown, not negative. Both actions reference the same
resolved fact atoms, so staged information purchase cannot create contradictory copies of the
patient's safety state.

SOAP is an authoring boundary, not a note-writing mechanic. Patient/collateral history is Subjective. Clinician observations, measurements, record review, labs, and diagnostic studies are Objective. Assessment and Plan language—including diagnosis, level-of-care conclusions, treatment recommendations, and action-value hints—is forbidden in pre-submit results and reserved for the receipt.

This boundary follows the conventional division summarized by [NCBI StatPearls](https://www.ncbi.nlm.nih.gov/books/NBK482263/) and [UMass Dartmouth nursing guidance](https://www.umassd.edu/nursing/resources/notes/): Subjective records reported experience/history; Objective records observations and test data; Assessment interprets them; Plan records actions. These references define note structure only and are not clinical authority for the prototype case.

WorkupObjective uses a constrained predicate and can express alternative actions through `any`. It carries points, omission effect, importance, and explanations. Path-specific requirements point at objectives rather than duplicating action logic. Validation ensures an indicated single-action objective plus its relevant conditional award is worth more points than the cheapest accessible fulfillment cost.

## Treatment pathways and combination rules

Available treatment IDs determine the structured UI. Reusable nonmedication entries distinguish modalities such as CBT, IPT, supportive psychotherapy, and DBT rather than collapsing every option into one prose choice. TreatmentGradeDefinition evaluates the complete intervention set with deterministic priority and an unbounded signed base-care-point award. TreatmentPathway represents an accepted complete route, required/alternative objectives, conditional prerequisites, workup-cost par, grade, and rationale. ScoreRules handle discontinuation, dangerous combinations, modality equivalence, combination bonuses, redundancy/cardinality, dispositions, efficiency, safety errors, and point caps.

The patient treatment reference is deliberately hybrid. It prefers one broad primary authored pathway composed from reviewed option groups: for example, exactly one first-line antidepressant or exactly one first-line psychotherapy, plus proportionate outpatient disposition. A source-supported combination may add a bonus; a compatible source-silent combination may remain neutral. Medication- and therapy-specific fit modifiers supply swing room inside those families. Reusable redundancy groups and maximum cardinalities prevent multiple equivalent treatments from accumulating rewards. `additionalAuthoredPathwayIds` remains available for truly distinct care routes, while `safetyFallbackPathwayIds` keeps referral/transfer separate from the main plan. A deterministic catalog engine may evaluate a combination outside those authored routes using reviewed catalog rules, but the receipt labels it `engine_inferred`; it cannot masquerade as an authored patient pathway.

Predicates are JSON-safe only: `actionPurchased`, `factKnown`, exact medication start/stop/continue, bounded `treatmentStartedWithTag`, `interventionSelected`, `dispositionSelected`, `serviceCapabilityAvailable`, `any`, `all`, and `not`. There is no arbitrary expression or embedded JavaScript.

## Reference solutions and eligibility

Each case includes database-plan, strong/acceptable alternative, shotgun, and unsafe policies. They are executable and must use only available actions/treatments. “Database plan” is the authored comparison route, not a claim that no other plan could be better. Validators require at least one acceptable path, a safe referral/transfer, accessible required objectives, valid par, and a compatible location. Eligibility further considers lifetime points, facility/location, service fulfillment, every workup objective required by a candidate path, effective formulary/tag availability, intervention capabilities, and disposition capabilities. Validation constructs a baseline clinic for every declared compatible location. A start medication must be stocked, while an existing medication may still be stopped or explicitly continued. External services count as capabilities even when expensive, so the ECG patient is winnable before equipment ownership.

Waiting-room queues store complete resolved CaseInstances after eligibility evaluation. The setting is visible on each slot; hidden diagnosis IDs, tags, and pool labels are never launcher text. Normal slots remain unchanged until the patient is completed, then avoid recently used chief complaints when generating a replacement. If the clinic moves, the exact resolved waiting instance is retained and assigned to a compatible location in the new facility before extra slots are filled. Slot count rises from one to two to three across the first implemented tiers. Endgame derives a refreshable six-slot highest-tier queue from the approved pool. Local Developer mode dynamically loads approved plus review patients, tracks which blueprint IDs have run, and supports reroll/reset; production does not contain that module.

## Lifecycle and production inclusion

Content directories are `blueprints`, `drafts`, `review`, `approved`, and `deprecated`. Normal
Player web code has explicit imports from `approved`; it does not glob case files. Local Developer
may discover review files. The portable Reviewer entry imports only its exact ten-scenario
assignment plus the two prototype patients; registry entries remain `runtimeIncluded: false` for
the cohort, and a separate exact bundle allowlist is required. Reviewer distribution is not
medical or lifecycle approval. Every prototype/cohort case remains prominently
`medicalReviewStatus: "unreviewed"`. Clinical/scoring rules additionally carry independent
`review` records. An approved rule requires reviewer identity and timestamp; a case-level status
cannot silently approve every embedded rule and an AI status change cannot approve either layer.

## Provenance and versioning

Major persistent/content records carry `schemaVersion`; content definitions and attempts carry semantic `contentVersion` where relevant. Save data has a separate migration version. `GenerationProvenance` records model/request version, generator identity, timestamps, source document/chunk IDs, validation, critic findings, repair history, and unreviewed status. `SourceDocument`/`SourceChunk` records retain hashes, parser version, extracted text, page/section context, and processing time without entering the production bundle.

A `PatientScaffoldRequest` is the checked-in, human-readable input to the bounded local scaffolder.
It identifies one explicit runtime template, one new review-only patient ID, brief chief-complaint
choices, an adult age range, and optional source-use summaries that cite exact extracted
document/chunk IDs. A source use may list `proposedImpactContentIds` for shared diagnosis,
medication, test, therapy, pathway, or rule records. Those IDs enter only the source-application
ticket; the scaffold’s owner-local evidence note still targets its own patient file. Compilation
verifies the relationships, deduplicates document/evidence/chunk provenance, copies the template,
resets every executable rule review, and emits a schema-valid Developer patient plus audit tickets.
The scaffold is useful for exercising variation and editing structure; inherited facts are not
evidence that a new patient is clinically correct.

New studies and receipt feedback do not edit patient files directly. Ingestion produces
source/chunk records; source-backed patient scaffolding adds exact provenance and blocking
claim-application tickets rather than inferring a clinical change. Receipt guidance becomes a
`ClinicalReviewTicket` with an immutable item snapshot. A whole-playthrough
`DeveloperAttemptReview` owns one editable note, the exact immutable `CompletedAttempt`, and a
normalized snapshot of every option offered and whether it was chosen; information options also
preserve displayed fulfillment and cost. Local Developer mode persists these records in IndexedDB
and mirrors or downloads them. Portable Reviewer uses a separate assignment-versioned IndexedDB
and manual version-5 export only. One bundle identifies its build kind, assignment, and engine
version and includes every completed attempt plus all attempt reviews, flags, and tickets, so
item-only feedback retains its historical patient/receipt context. There is no bundle import yet.
Neither save nor export mutates clinical rules or confers approval. Material changes to cohort
membership, scenario/policy semantics, or the intended review package require a new assignment ID;
reusing an ID could suppress revised patients through old run history and mix incompatible
revisions in one browser database.
