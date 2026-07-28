# Content model

## Catalogs and stable IDs

Catalogs contain reusable, versioned definitions for diagnoses, investigations, services and fulfillment, individual tests, reference-interval sets, medications, reaction triggers/manifestations, formularies, treatments/dispositions, demographic variant pools, locations, facilities, upgrades, and decor. Each diagnosis family has one file under `content/catalogs/diagnoses/definitions/`; shared rules, its severity axis, specifiers, comorbidity relationships, complexity contributions, and source-use notes remain nested in that family. Each laboratory or diagnostic study has one file under `content/catalogs/tests/definitions/`; panel components remain nested only inside their owning test. `content/catalogs/tests/reference-interval-sets.json` owns reporting/unit conventions, jurisdiction, numeric-range authority, policy sources, and review state referenced by profiles. `content/catalogs/upgrades/upgrades.json` owns point cost, prerequisites, allowed facility tiers, optional department, granted capability/formulary IDs, affected services, in-house cost metadata, target facility where relevant, and unlock labels. `content/catalogs/decor/decor.json` separately owns decor items plus the versioned satisfaction curve/cap. IDs are lowercase, namespaced strings and are never inferred from labels. Case content and future authoring tools may select only existing permitted IDs.

Classification catalogs are a separate authoring layer, not reusable runtime knowledge.
`content/catalogs/diagnoses/classifications/icd-10-cm/2026/` tracks an immutable release manifest
for the official CDC/NCHS FY 2026 F01–F99 scope. The release pins source/member hashes, dates,
importer version, expected term count, and normalized-output hash. Its generated code-title cache
is gitignored local data under a narrow U.S. fair-use assessment. Terms contain only code,
PsychSim-derived code-prefix parent, exact descriptions, billable/category state, and source order.
They support authoring search and are excluded from `CatalogBundle`, Git distribution, and
production output. The local Developer Database can inspect this cache through a separate,
loopback-only, lazily loaded projection. Those terms never join `PublicClinicalCatalogProjection`,
its condition count, portable review snapshots, or gameplay content.

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

One source file may own many stable source-local contribution units under readable headers. A unit
preserves the exact source version and location, scoped proposition, population/setting/outcome
context, target topic IDs, extraction/authoring method, currentness/correction state, and review
state. Large guidelines therefore remain one navigable source record rather than being
reconstructed as hundreds of files. A source-local unit has no care-point value and does not
become a rule merely because it has been extracted.

The current `EvidenceContribution` schema is the compatibility record for how knowledge entered
content. It declares `formal_publication` or `expert_opinion`, every formal evidence ID used,
optional private document/chunk provenance, exact target content IDs, contribution types, and a
concise original contribution statement. Formal contributions require catalog IDs; generic
expert-opinion contributions forbid them. A publication can be cataloged but unused. A rule can
cite multiple relevant publications through separate or multi-source contributions. Unlinked
prototype rules are rendered as Expert opinion, while approved rules require an explicit
contribution. A bounded future migration may nest these source-derived units under their source
owners without reinterpreting existing receipts.

Independently useful topics own their reusable interpretations and concrete clinical/game
relationships. The most specific decision-driving topic owns a relationship, every other
implicated topic receives a generated reverse link, and only a genuinely symmetric or multifactor
relationship with no natural owner receives a dedicated policy file. Generated dossiers assemble
the forward and reverse links; they are not another truth store.

Source type is not a universal authority score. A derived evidence-resolution view evaluates
compatible source units and Developer interpretations by question-specific design fit,
result-level bias or supplied certainty, directness/applicability, currency/search-through date,
correction state, and provenance role. GRADE-style certainty belongs to a body of evidence, not to
one article unless a source explicitly reports it. A verified direct source outranks an aggregate
for the exact fact, but a conventional efficacy synthesis does not automatically outrank
observational evidence for a rare harm or a direct pharmacokinetic study for an interaction.
Nondominated disagreement remains `contested` and routes to review; publication date, file order,
source count, or a hidden numeric evidence score never selects a clinical winner. The assembled
evidence-body view is reproducible from its owners rather than persisted as a global assertion
database.

The compact Reviewer-policy model preserves that authority distinction per exact target rule.
Broad guideline context cannot automatically absorb a separately authored safety or balance
judgment. An explicit psychiatrist/developer contribution is compiled as Developer opinion with no
formal evidence ID; unaffected source-linked rules keep their own publication contribution.

Accepted psychiatrist interpretations additionally have a dedicated, nonruntime
`DeveloperOpinionCatalog`. Each concise opinion owns explicit typed target IDs and separate
evidence-relationship records that say whether a source supports, contextualizes, challenges, or
limits it and whether an expert bridge remains. A later source-oriented authoring view may
physically co-locate commentary with the source being discussed, but the opinion remains a
separately typed provenance object. Linking a source never converts the opinion into
source-authored content. The local Database compiler projects both formal contributions and
accepted opinions onto every declared target entry; physical file ownership is only an authoring
location, not the scope of the knowledge. The catalog and projection cannot activate a clinical
rule or assign care points.

## Personal knowledge database and game projection

The private authoring database is a first-class learning system, not merely a staging area for
playable content. A dossier should eventually let the developer reconstruct what they believe
about an entry, which personal notes or authored materials informed it, which formal sources
support or challenge it, what remains uncertain or stale, and which recent sources might efficiently
close a knowledge gap. Review and repeated patient use support active retention in the same way
that preparing to teach a topic does.

Knowledge completeness and gameplay readiness are independent. A rich medication dossier may have
no executable point rule; a narrowly reviewed rule may support a patient before the broader
medication dossier is comprehensive. Missing coverage, conflicting evidence, source age, pending
reading, unreviewed candidates, and absent gameplay mappings remain explicit states rather than
being collapsed into “complete” or silently filled. Suggestions for reading are review proposals,
not evidence contributions.

The game is a focused projection over this database. Encounter compilation selects only rules and
facts relevant to the authored decision horizon plus applicable global safety constraints. It does
not expose the complete dossier, grade every background condition, or copy all available knowledge
into the patient. Conversely, information excluded from an encounter remains available for
database audit and future content work.

A future `KnowledgeCoverageProjection` is derived, sparse, and noncanonical. It may summarize
identity/regulatory baseline, personal knowledge, formal evidence, currentness,
disagreement/uncertainty, reviewed interpretation, and gameplay mapping, but every displayed cell
must point back to the exact records that caused it. It distinguishes `unknown`, `missing`,
`present`, `stale`, `contested`, and `not_applicable` where those states are actually supported;
it never infers absence from an unfinished source review.

The projection is not required to create or preserve an entry, cannot reject or filter source
units, cannot promote content, and has no aggregate completeness percentage. Unmatched material
continues to appear in the identity-gap/landing audit. It is computed lazily for one local
Developer dossier so expanding the private corpus does not enlarge or slow the gameplay bundle.
Recent-reading suggestions are separate review proposals with search provenance, not coverage
facts or evidence contributions.

The cross-topic minimum dossier consists of an identity/alias header, a concise accepted synthesis
when one exists, compact independent readiness lanes, open gaps/conflicts, linked source units and
Developer opinions, topical forward/reverse relationships, and exact game/rule/patient mappings.
These are views over existing owners, not required monograph sections. Readiness is never one
entry-wide lifecycle or approval field. A stable identity is sufficient for database inclusion;
each source unit, opinion, relationship, clinical rule, balance decision, and reference policy
retains its own typed state. The projection should reuse those states and add no duplicated field
when a result can be derived.

The local authoring UI computes one dossier lazily and shows the compact summary before collapsed
detail. Gameplay eligibility ignores this summary and validates the precise dependency set needed
by that patient. If maintaining a readiness lane requires broad manual synchronization, harms
performance, or does not support a concrete review decision, the lane is simplified or omitted.

Catalog breadth is driven by admitted inputs rather than an attempt to enumerate psychiatry in
advance. Semantic processing creates one stable candidate bin for every potentially relevant named
concept and links it to the exact source/authored units that raised it. A bin may carry a proposed
category and possible matches while remaining unresolved. Review may promote it to a canonical
identity shell, attach a verified alias, merge it into an existing owner while preserving the old
bin ID, classify it as a relationship-only concept, leave it unresolved, or mark it as a reviewed
non-entity/out-of-scope item. Every outcome retains provenance and rationale.

Candidate bins are authoring landing records, not runtime catalog identities. They do not create
clinical facts, recommendations, rules, points, formulary availability, or approval. Many bins are
expected because psychiatry has many reusable concepts. Deterministic overlap reports can group
likely matches for review, but neither lexical similarity nor repeated occurrence performs a merge
automatically.

DrugCentral is cataloged as an authoring-only `structured_database` source. Its initial rights
decision allows local deterministic indexing and unreviewed source-unit candidates but blocks runtime
redistribution. Every candidate retains the database release, record origin, available upstream
source IDs, and `aggregator` role. Direct-source verification can refine or supersede its support
without erasing that provenance.

The user's residency-site article aggregate uses one private hashed `SourceDocument` containing
many future logical `AuthoredSourceUnit` records. The schemas now distinguish authored-unit
candidates, reviewed authored units, `DeveloperOpinion` candidates and accepted opinions, and
unverified bibliographic candidates with later evidence relationships. The current private
workbench exercises those shapes for a bounded Apple Notes pilot; the aggregate has only completed
structure-aware physical extraction. It must not be flattened into one case-specific contribution,
and no authored unit or opinion exists until a bounded semantic review creates and a human reviews
that candidate.

`SourceUseDecision` is the rights gate between bibliography and any processing or derived content.
It records permission for local storage, extraction, local structured indexing, AI-assisted
processing, derived clinical content, runtime redistribution, and commercial distribution, plus
territory, attribution, third-party, and review obligations. A decision that enables derived
content must also enumerate its allowed contribution types; validation rejects a formal
contribution whose lane is outside that allowlist. A proposed fair-use exception must include a
complete four-factor assessment. The canonical contract is
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

`content/registry.json` is the persistent relationship map from stable content IDs to their files,
categories, dependency IDs, and runtime-inclusion status. Validation cross-checks paths and
dependency edges against the explicit static imports. It is data, not a dynamic production glob:
the ordinary Player bundles only deliberately imported approved content; local Developer mode and
the exact finite Reviewer assignment are controlled, explicit exceptions rather than registry
discovery or lifecycle promotion.

`PublicClinicalCatalogProjection` is a nonpersistent presentation view derived from that approved
runtime subset. It has a strict per-record field allowlist and exposes neutral identities,
categories, stable IDs, versions, test component labels/units, and
verified bibliography metadata. It deliberately omits patient/case records, executable rules,
points, predicates, fit-modifier details, private provenance, review queues, and classification
term caches. Its logical catalog locators are stable navigation hints, not host filesystem paths.
The current eight condition records are the diagnosis families modeled for gameplay, not a
comprehensive diagnostic manual; the larger local ICD authoring index remains separately
rights-gated and runtime-excluded. The medication category is broader than gameplay: it includes
all source-cleared `MedicationIdentityDefinition` records and explicitly marks which are
identity-only versus runtime-compatible.

Each medication identity has its own file under `content/catalogs/medications/identities/`. It owns
the stable PsychSim ID, normalized ingredient name, explicit aliases, RxCUI, pinned RxNorm
release/source/use-decision metadata, authoring scope, and unreviewed status. The current curated set
contains 53 ingredients. Thirteen link a same-ID runtime compatibility definition; 40 are
identity-only and cannot enter a formulary, case treatment menu, or score. The collection registry
lists all member IDs, and validation cross-checks registry, static imports, disk files, source
permissions, names, RxCUIs, and runtime parity.

Supplement identities live separately under `content/catalogs/supplements/identities/`. A record
may use an exact RxNorm ingredient, a MeSH concept, or both; it must describe preparation
distinctions honestly and must never invent an RxCUI to fit the medication schema. Identity-only
records support Database browsing and later regimen authoring. They are not runtime-selectable,
carry no efficacy, safety, interaction, incidence, or point claim, and cannot enter patient
generation until a separately reviewed generation profile references them.

Each runtime-compatible medication separately has its existing definition file. It owns
human-readable class labels and stable runtime tags plus separate arrays for active fit modifiers
and protected human author overrides.
Every current medication has at least one class label, but executable rules must use stable tags;
they may not parse display strings. Bupropion preserves supplied concepts as inactive, explicitly
unreviewed overrides. Mirtazapine also contains active prototype modifiers (+35 for a matching
insomnia tag and −50 for a matching high-BMI tag) to exercise the fit architecture requested for
playtesting. The trace labels their unreviewed status. A modifier is not clinical authority merely
because it is executable; later sourcing/review must version or reject it.

Executable workup, treatment-grade, treatment-prerequisite, score, and medication-fit records may
declare `effectId`, `issueId`, and `specificityPriority`. These are relationship metadata, not
clinical findings or provenance. Same-effect records are replacement candidates; same-issue
negative records are worst-only consequence candidates; records with distinct effect IDs stack.
Null IDs mean “independent/no declared relationship,” preserving older content. Content validation
rejects two same-effect candidates at the same specificity in one compatible encounter. A hard
contraindication is separately typed by the medication rule—it cannot be inferred from a negative
point value or from words in a label. The frozen receipt saves both raw and resolved contributor
state so later catalog edits cannot rewrite what an old attempt displayed.

Patient medication state preserves epistemic certainty. `medicationListStatus` distinguishes a
known list from an unreconciled list, so an empty array cannot silently mean “takes no
medications.” Current regimen entries remain separate from prior medication trials. A focused
medication reconciliation may establish the current list; the more expensive full treatment
history can return an arbitrarily long structured set of medication trials, psychotherapy
experiences, current treatment relationships, and prior levels of care. Psychotherapy is never
misfiled as a medication trial.

Prior-trial displays expose duration and highest reported dose rather than the conclusion
“adequate trial.” Adherence, response, tolerability, and source remain structured beside those
observations. A legacy adequacy category may remain in historical snapshots, while a future
reviewed inference lives separately and never causes dose or duration to be invented during
migration.

The planned background-exposure record resolves nonpsychiatric medication entries and supplement
entries against a saved reviewed age band and generation-profile ID. Every entry has a stable
instance ID and impact class. The optional enthusiast pattern requires multiple distinct
supplement identities and is derived from that resolved set. Age-based count distributions and
allowlists remain proposed authoring data until source and clinician review; cosmetic presentation
age is not a clinical-generation input.

The current medication shape is a runtime compatibility layer, not the target background
knowledge database. Future authoring separates stable ingredient/formulation identity, sourced
classification memberships, product/regulatory records, source-local contribution units,
topically owned relationships, concise Developer opinions, executable clinical rules, and balance
values. Source imports may populate only source-owned factual units as medically unreviewed drafts.
A reviewed transformation is required before a source unit informs a rule, and a separate balance
decision supplies points. Shared class relationships remain normalized while a generated
per-medication audit view assembles everything relevant to one medication for review. See
`docs/MEDICATION_AND_INTERVENTION_DATA.md`.

Psychotherapies and other reusable interventions follow the same principle. One file identifies
each therapy family or meaningfully distinct program, while shared evidence and fidelity
requirements remain referenced rather than copied. A generic modality, protocol-based therapy,
referral, and complete manualized program are distinct concepts. Exact manual text, worksheets,
scripts, and training materials remain outside the database unless an item-specific permission
allows them.

Locations declare facility tier, capabilities, formulary, and dispositions. Facilities declare stable location IDs, one default location, minimum lifetime points, persistent patient-slot count, and permitted upgrade/decor IDs. A clinic's effective formulary is the stable union of its persisted formulary purchases and the active location's baseline formularies. Services declare one or more outside, partner, shared, or in-house methods. Cases provide patient-specific results; catalogs and ClinicState provide availability and cost. Equipment acquisition adds capability IDs and makes a cheaper catalog service method eligible; it never alters the result or rubric. Selected nonmedication interventions and dispositions may also reference a service. Their availability and least-cost fulfillment resolve before submission, and their costs settle separately from investigation costs without changing clinical correctness. A facility purchase swaps only the declarative facility/location baseline while preserving owned upgrades. A decor purchase adds raw satisfaction and a visual token; the pure engine derives the capped multiplier.

## Template, patient instance, and encounter instance

The current prototype stores one `CaseBlueprint` per generative patient family. It still combines a
generator recipe, patient-specific content, and much of the rubric so the first loop remains
executable. That shape is transitional and should not be multiplied into hundreds of cases.

The portable Reviewer cohort exercises a narrow intermediate split without claiming to be the
final compiler. Each `ReviewCaseScenario` file owns patient state: internal diagnoses, typed
critical facts, explicit medication-list status, current regimen entries, focused
prior-medication-trial records, full structured treatment history, short complaint variants, one
structured duration profile, explicit reaction/medication-reaction assessment state, a
budget-only optional-feature profile, structured finding overrides, setting, and one referenced
policy ID. These authored patient facts are required in the scenario file and never supplied by a
clinical schema default. The compiler derives the visible reaction finding from that typed state;
validation rejects a mismatch.
A duration profile contains stable numeric value/unit options, short swappable display forms, an
optional related diagnosis, an authored interpretation, and rule-level review metadata.
Compilation resolves one option deterministically and saves the profile ID, option ID, numeric
value, unit, interpretation, related diagnosis, and optional criterion ID in the frozen finding.
The generated display sentence is presentation only; replay and audit use the saved measurement.
Eight shared
`ReviewDecisionPolicy` records own the provisional focused workup/treatment/disposition rubric and
four executable reference selections. `buildReviewCaseCohort` schema-parses both sets, rejects
duplicate or missing/orphan policy IDs, fills the universal 40-action menu with patient-specific
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

All modeled gameplay-relevant values are resolved before the encounter begins. Applicable
treatment-fit and safety rules evaluate that saved patient truth even when the supporting detail
remains unknown to the player. Purchasing information changes what the player can reason from and
may independently satisfy workup objectives; it does not reroll the patient or activate an
otherwise dormant fit modifier.

Clinically meaningful duration uses `ClinicalDurationProfile`, not a cosmetic variant. Every
option has a stable ID, positive integer value, `day`/`week`/`month`/`year` unit, and short display
variants. The current Reviewer profiles are labeled `supports_authored_state`: their choices vary
only within the already-authored episode or decision state and do not change the rubric. A future
deliberate near miss must instead declare `designed_below_threshold` and name the reviewed
diagnosis-owned criterion it misses; schema validation rejects an unanchored below-threshold claim.
This structure does not itself prove a diagnostic threshold or infer a diagnosis. In particular,
no cyclothymia threshold logic is executable: its temporal discrimination remains pending a lawful
source and rule-level clinical review.

Instantiation hashes the seed with stable variant IDs. It never calls `Math.random`. Shared catalog pools supply long curated lists for fictional names, occupations, education, locations, and neutral social details; case-local variants supply only reviewed ranges or wording. The starter patient combines name, age within 27–39, occupation, and opening phrasing for well over 100 possible presentations. Variants cannot target protected critical structures or silently affect treatment logic. Tests sample many seeds and compare the full critical/scoring structures.

Each test file declares the patient context it consumes (`age_years`, `sex_for_reference`, `diagnosis_ids`, and/or `clinical_tag_ids`) and either a `numeric_panel` generator or `patient_owned` policy. Numeric profiles have priorities, context predicates, a versionable reference-interval set ID/population label, UCUM units, low/high bounds, narrower normal-generation ranges, display precision, test-specific incidental probabilities, and curated mild low/high ranges. Resolved numeric observations preserve display precision and show result, unit, reference interval, and `N`/`H`/`L` interpretation. See [LAB_RESULTS.md](LAB_RESULTS.md). The current prototype numbers are explicitly unreviewed. When a patient does not own a result, instantiation selects the highest-priority matching profile, generates every component, and may flag at most one component in that panel. Generated observations carry `generated_normal` or `generated_incidental`, `clinicallyCritical: false`, and `notCaseDefining: true`. Validation requires a fallback profile, normal ranges inside reference limits, matching flags, and incidental ranges within 25% of the reference span outside the boundary. A patient-authored observation suppresses generic generation. Findings capable of changing workup, diagnosis, treatment safety, points, or disposition remain critical and require an explicit reviewed patient/variant.

Weight/BMI and general physical examination are separate objective actions. The former owns
structured measurement details; the latter may own a separate body-habitus observation. This lets
the player distinguish an elevated BMI from an inference about adiposity or muscle mass. Reviewer
scenario compilation and saved attempts preserve both fields rather than reconstructing one from
the other.

## Information and workup

Every information option has two layers. The shared `InformationActionDefinition` catalog owns the stable ID, neutral label and description, History/Physical/Labs/Imaging category, SOAP section, report source, service, and repeatability policy; that same presentation is used in every compatible case. Each patient blueprint supplies only the immediate patient-specific structured result, revealed fact IDs, and default post-submit classification. A result is a list of short finding atoms with swappable labels and explicit outcomes. Variable finding sets declare minimum/maximum positives and required present/absent IDs; they cannot contain arbitrary code. The browser never displays classification or point rationale before submission.

Resolved narrative findings expose their outcome directly. The interface renders a glyph and
visible outcome chip such as `Present`, `Absent`, `Positive`, or `Negative`, with grouped row
styling, so a negative result is not conveyed only by muted color or an undifferentiated list item.
The finite Reviewer compiler also pilots bounded background anxiety variation outside the primary
GAD scenario: all threshold-relevant atoms are variable and deterministic selection permits zero
or one positive. The maximum is deliberately subthreshold, does not create an internal diagnosis,
and does not alter the focused rubric. Additional symptom families require their own reviewed cap,
required findings/absences, and consistency validation; there is no global unconstrained symptom
randomizer.

Some actions may reveal a compact summary derived from a larger shared fact family without
revealing every component. General psychiatric history, for example, includes a routine
suicide-safety screen. The separate `Suicide and self-harm assessment` History action reveals the
detailed ideation, intent, plan, preparatory-behavior/attempt, means-access, prior-attempt, and acute
modifier fields. Unrevealed detail remains unknown, not negative. Both actions reference the same
resolved fact atoms, so staged information purchase cannot create contradictory copies of the
patient's safety state.

SOAP is an authoring boundary, not a note-writing mechanic. Patient/collateral history is Subjective. Clinician observations, measurements, record review, labs, and diagnostic studies are Objective. Assessment and Plan language—including diagnosis, level-of-care conclusions, treatment recommendations, and action-value hints—is forbidden in pre-submit results and reserved for the receipt.

This boundary follows the conventional division summarized by [NCBI StatPearls](https://www.ncbi.nlm.nih.gov/books/NBK482263/) and [UMass Dartmouth nursing guidance](https://www.umassd.edu/nursing/resources/notes/): Subjective records reported experience/history; Objective records observations and test data; Assessment interprets them; Plan records actions. These references define note structure only and are not clinical authority for the prototype case.

WorkupObjective uses a constrained predicate and can express alternative actions through `any`. It
carries points, omission effect, importance, and explanations. `TreatmentWorkupRequirement`
connects a reusable diagnosis-owned qualitative rule to one objective and a constrained submitted-
treatment predicate. Trigger, concern, certainty, point mapping, and safety-critical status remain
separate. This avoids hiding a medication prerequisite inside one authored treatment path and
allows the same requirement to apply to engine-inferred alternatives. Legacy path-specific
requirements still point at objectives rather than duplicating action logic. Validation ensures an
indicated single-action objective plus its relevant conditional award is worth more points than
the cheapest accessible fulfillment cost.

## Diagnosis answers

`PlayerDiagnosisSelection` is an optional submitted answer, never patient truth. An empty array is
valid and does not prevent treatment submission. `CaseDiagnosisRubric` independently defines one
or more answer groups, canonical/reasonable/partial options, an omission row, explicitly dangerous
or major misclassifications, and a capped parsimony consequence for unsupported extras. The
diagnosis trace is itemized separately and the worst row for one stable issue wins, so a wrong
answer does not stack an equivalent omission penalty.

Broad-category and unspecified answers require real catalog entries and explicit hierarchy. They
are not inferred from label substrings, ICD prefixes, or diagnosis tags. The future hierarchy will
connect broad categories, unspecified labels, diagnosis families, and supported specific
diagnoses; case rubrics will still own the actual partial-credit magnitude and any safety
consequence. Until that bounded catalog extension lands, a case may award family-level partial
credit only by naming that accepted diagnosis ID explicitly.

## Treatment pathways and combination rules

Available treatment IDs determine the structured UI. Reusable nonmedication entries distinguish modalities such as CBT, IPT, supportive psychotherapy, and DBT rather than collapsing every option into one prose choice. TreatmentGradeDefinition evaluates the complete intervention set with deterministic priority and an unbounded signed base-care-point award. TreatmentPathway represents an accepted complete route, required/alternative objectives, conditional prerequisites, workup-cost par, grade, and rationale. ScoreRules handle discontinuation, dangerous combinations, modality equivalence, combination bonuses, redundancy/cardinality, dispositions, efficiency, safety errors, and point caps.

The patient treatment reference is deliberately hybrid. It prefers one broad primary authored pathway composed from reviewed option groups: for example, exactly one first-line antidepressant or exactly one first-line psychotherapy, plus proportionate outpatient disposition. A source-supported combination may add a bonus; a compatible source-silent combination may remain neutral. Medication- and therapy-specific fit modifiers supply swing room inside those families. Reusable redundancy groups and maximum cardinalities prevent multiple equivalent treatments from accumulating rewards. `additionalAuthoredPathwayIds` remains available for truly distinct care routes, while `safetyFallbackPathwayIds` keeps referral/transfer separate from the main plan. A deterministic catalog engine may evaluate a combination outside those authored routes using reviewed catalog rules, but the receipt labels it `engine_inferred`; it cannot masquerade as an authored patient pathway.

Predicates are JSON-safe only: `actionPurchased`, `factKnown`, exact medication
start/stop/continue, `anyMedicationStarted`, bounded `treatmentStartedWithTag`,
`interventionSelected`, `dispositionSelected`, `serviceCapabilityAvailable`, `any`, `all`, and
`not`. There is no arbitrary expression or embedded JavaScript.

## Reference solutions and eligibility

Each case includes database-plan, strong/acceptable alternative, shotgun, and unsafe policies. They are executable and must use only available actions/treatments. “Database plan” is the authored comparison route, not a claim that no other plan could be better. Validators require at least one acceptable path, a safe referral/transfer, accessible required objectives, valid par, and a compatible location. Eligibility further considers lifetime points, facility/location, service fulfillment, every workup objective required by a candidate path, effective formulary/tag availability, intervention capabilities, and disposition capabilities. Validation constructs a baseline clinic for every declared compatible location. A start medication must be stocked, while an existing medication may still be stopped or explicitly continued. External services count as capabilities even when expensive, so the ECG patient is winnable before equipment ownership.

Waiting-room queues store complete resolved CaseInstances after eligibility evaluation. The setting is visible on each slot; hidden diagnosis IDs, tags, and pool labels are never launcher text. Normal slots remain unchanged until the patient is completed, then avoid recently used chief complaints when generating a replacement. If the clinic moves, the exact resolved waiting instance is retained and assigned to a compatible location in the new facility before extra slots are filled. Slot count rises from one to two to three across the first implemented tiers. Endgame derives a refreshable six-slot highest-tier queue from the approved pool. Local Developer mode dynamically loads approved plus review patients, tracks which blueprint IDs have run, and supports reroll/reset; production does not contain that module.

`AppleNotesIntakeManifest` is an authoring-only provider record under the protected ignored
boundary. Metadata audit preserves exact account, folder, note, and attachment identifiers, dates,
locked/shared states, and counts without reading content. After all required acknowledgments, sync
additionally records protected revision hashes, attachment duplicate/OCR status, composite hashes,
and expected `SourceDocument` IDs. A note, screenshot, OCR result, embedded citation, or personal
takeaway never becomes formal evidence or executable content merely through intake.

`AppleNotesCodexReviewPacket` is a separate private, ignored release artifact containing exactly one
bounded title plus one plaintext segment. `AppleNotesCodexReviewAuditManifest` contains only stable
IDs, hashes, byte-safe packet paths, provider/model identity, and the explicit external-processing
acknowledgment; it never contains the title or plaintext. The packet is untrusted source data and
the audit records preparation for a separately authorized Codex read, not successful consumption.
Neither record is `GenerationProvenance`, formal evidence, a Developer-opinion approval, an
evidence contribution, an executable rule, a point value, a citation, or medical review.

`PersonalKnowledgePilotProfile` is a tracked, authoring-only definition for one bounded topic. It
names allowed stable targets and deterministic literal term groups. A lexical match can place a
current Apple Notes title/plaintext revision in `PersonalKnowledgePilotQueue`; it cannot create or
support a clinical relationship or rule. Queue entries preserve the exact source revision, expected segment
count, released packet IDs, and released/classified segment ordinals. A revision is only fully
classified when every expected segment has a matching imported semantic run.

`PersonalKnowledgeWorkspace` is the ignored private semantic-authoring record. It preserves exact
packet/source locators, model and prompt identity, authored-source-unit candidates, atomic
Developer-opinion candidates, unverified bibliographic candidates, target mappings, currentness,
and human-review state. These candidate records are deliberately different from
`EvidenceSourceDefinition`, `EvidenceContribution`, `ClinicalRuleReview`, executable predicates,
and game-balance values. Import is idempotent and cannot assign points, alter rules, create
citations, or grant medical approval.

`PersonalKnowledgeWorkbenchProjection` is a minimized read-only projection for local Developer
mode. The Vite development server may serve it only over loopback; Player and portable Reviewer
builds forbid it. This preserves a rich private authoring surface while keeping runtime knowledge
narrow and explicitly promoted.

`DeveloperDatabaseKnowledgeProjection` is a separate whole-corpus audit projection. Its
`corpusUnits` enumerate opaque, deterministic units from Apple Notes composites/available OCR and
the explicitly enrolled private Drive sources. Each database record holds normalized indexed
terms, lexical retrieval signals, existing semantic candidates, bibliographic leads, formal
contributions with source-use notices, rule summaries, and safe structural relationships. The
projection stores no raw private prose, heading, filename, provider ID, source-document/chunk ID,
or filesystem path. Its aggregate `inputFingerprint` covers hashes of every indexed surface plus
the alias catalog, public Database catalog, semantic workbench, formal evidence registry, and
source-use decisions so stale output fails validation.

Workbench candidates preserve their contribution-type labels and safe resolved target/role
relationships. A record also projects atomized candidates whose unresolved target label matches
that entry's reviewed name or alias into an `unresolvedCandidateMentions` lane. This makes
cross-target omissions such as a medication comparator visible without claiming that the target
was resolved. Direct candidates and unresolved mentions are disjoint and neither changes the
record's rules or compilation state by itself.

Projection version 2 also owns a complete `catalogIdentityAudit`. Every unresolved target
occurrence must appear exactly once in a grouped identity gap. Exact normalized names and reviewed
aliases produce either one likely entry or an explicit ambiguous-entry set; an unknown medication,
diagnosis, intervention, or test becomes a proposed new catalog entry; rules, tags, and templates
stay in a non-catalog lane; and a target with no kind stays queued for kind review. A second list
enumerates every normalized indexed term owned by multiple current entries. These are review
inventories, not automatic resolutions. Projection validation fails if an unresolved occurrence
is omitted or the overlap inventory drifts from the current catalogs.

`DeveloperDatabaseDossierBrief` is a deterministic, concise view over one record plus its coverage
state. It may route a reviewer toward evidence/opinion, typed patient fact, generation constraint,
fit, safety/interaction, or balance work, but it is not content ownership and has no runtime
effect. A saved interpretation becomes a fingerprint-bound local `ClinicalReviewTicket`; the
ordinary public `DatabaseEntryReview` schema remains unchanged.

`PersonalKnowledgeAuthoringAliasCatalog` owns only reviewed retrieval aliases for existing public
Database entries; cross-target ambiguity is invalid. `PersonalKnowledgePrivateSourceCatalog`
enrolls exact private document hashes and parser-v5 unitization strategies without putting a
private filename or provider locator into tracked content. Both catalogs are runtime excluded.
Neither catalog nor the projection creates a source unit, opinion, evidence relationship, clinical
rule, point value, or approval.

Formal resources use the same staged ownership rule. Each article, guideline, regulatory record,
or correction first gets one stable evidence-source file and therefore one separately readable
Database reference entry. Its later uses are ticketed, target-specific contributions. A registered
source with zero contributions is intentionally visible as cataloged but unattached; registration
never bulk-fills every medication or condition mentioned by the source.

`LiteratureSynthesisProposal` is a Developer-only decision-packet record linked to exact ticket,
source-request, and blueprint IDs. It separates source-cleared support from opposing, qualifying,
metadata-only, abstract-only, or inaccessible context. Validation requires at least one
catalog-matching supporting source with a `SourceUseDecision` permitting synthesis; uncleared
sources cannot support the proposed direction. Proposals remain medically unreviewed, exclude
point magnitude, and never mutate or approve content.

`TicketLiteratureScoutCatalog` is a distinct Developer-only discovery sidecar:

- `references` preserve PMID/DOI identity, publication date and synthesis type, a provider-specific
  Europe PMC cited-by snapshot, and a concise original abstract-only summary;
- `profiles` preserve one bounded clinical question, exact ten-year search plan/run, selected or
  no-suitable outcome, relevance, limitations, and linked source requests; and
- `attachments` link an exact ticket to one or more shared profiles, or to one explicit exemption
  for a legal, identity, architecture, balance, or umbrella decision that meta-analysis cannot
  answer.

Validation rejects duplicate or unknown links, uncovered active Developer tickets, out-of-window
selected records, invalid ranks, and unused profiles/references. A scout reference is not an
`EvidenceSourceDefinition`, `SourceUseDecision`, `EvidenceContribution`, citation, clinical rule,
point decision, or medical approval.

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
source-application tickets rather than inferring a clinical change. Receipt guidance becomes a
`ClinicalReviewTicket` with an immutable item snapshot. A whole-playthrough
`DeveloperAttemptReview` owns one editable note, the exact immutable `CompletedAttempt`, and a
normalized snapshot of every option offered and whether it was chosen; information options also
preserve displayed fulfillment and cost. A `DatabaseEntryReview` similarly owns one editable note
and the exact strict public-entry snapshot. Local Developer mode persists these records in
IndexedDB and mirrors or downloads them. Portable Reviewer uses a separate assignment-versioned
IndexedDB and manual version-7 export only. One bundle identifies its build kind, assignment, and
engine version and includes every completed attempt plus all attempt reviews, database-entry
reviews, flags, and tickets, so feedback retains its historical context. There is no bundle import
yet.
Neither save nor export mutates clinical rules or confers approval. Material changes to cohort
membership, scenario/policy semantics, or the intended review package require a new assignment ID;
reusing an ID could suppress revised patients through old run history and mix incompatible
revisions in one browser database.

`SourceReviewSnapshot` is the local-only source-review record embedded in a proposed
`ClinicalReviewTicket`. It contains a hash of the exact displayed decision packet, an independent
fingerprint of the private source unit, a short original paraphrase, one to eight atomic proposals,
public-safe target IDs or unresolved labels, uncertainty/conflicts, currentness, rights and
boundary states, and immutable routing context. It is always medically unreviewed and has
`runtimeEffect: false`.

The safe snapshot never owns raw source text, source headings, filenames, document IDs, chunk IDs,
filesystem paths, or private provider identifiers. Those remain in a one-to-one
`SourceReviewPrivateLocator` manifest. Source feed records are seed-only (`proposed`, no reviewer
prose or resolution); browser-owned responses remain in `SaveData`. Local Developer export version
7 may preserve them for Codex handoff, while portable Reviewer export rejects them.
