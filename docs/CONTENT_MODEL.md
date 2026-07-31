# Content model

## Catalogs and stable IDs

Catalogs contain reusable, versioned definitions for diagnoses, investigations, services and fulfillment, individual tests, reference-interval sets, medications, reaction triggers/manifestations, formularies, treatments/dispositions, demographic variant pools, locations, facilities, upgrades, and decor. Each diagnosis family has one file under `content/catalogs/diagnoses/definitions/`; shared rules, its severity axis, specifiers, comorbidity relationships, complexity contributions, and source-use notes remain nested in that family. Each laboratory or diagnostic study has one file under `content/catalogs/tests/definitions/`; panel components remain nested only inside their owning test. `content/catalogs/tests/reference-interval-sets.json` owns reporting/unit conventions, jurisdiction, numeric-range authority, policy sources, and review state referenced by profiles. `content/catalogs/upgrades/upgrades.json` owns point cost, prerequisites, allowed facility tiers, optional department, granted capability/formulary IDs, affected services, in-house cost metadata, target facility where relevant, and unlock labels. `content/catalogs/decor/decor.json` separately owns decor items plus the versioned satisfaction curve/cap. IDs are lowercase, namespaced strings and are never inferred from labels. Case content and future authoring tools may select only existing permitted IDs.

Each test file declares its reusable result shape independently of clinical relevance. Numeric and
categorical panels declare fixed or patient-defined components, binary tests enumerate lawful
outcomes, and imaging/electrical studies declare structured findings. A resolved numeric component
retains value, unit, UCUM code, reference interval, and `normal`/`high`/`low` interpretation.
Critical abnormalities and overrides belong to resolved patient state; information actions own
menu presentation and fulfillment; scoring rules own whether ordering or interpreting the result
matters in the focused encounter.

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

A sparse dossier may project short speculative candidates without pretending they fill a
knowledge gap. A `source_lead` points to the exact admitted source unit that raised a question. An
`authoring_inference` points to the exact structured inputs and developer-side tool, model, prompt,
or generator version that produced a hypothesis. Both preserve assumptions, uncertainty, creation
metadata, and a concrete follow-up question; both render as `Speculative`. They are quarantined
authoring candidates, not evidence contributions, Developer opinions, clinical facts,
relationships, rules, points, or approval, and the runtime compiler cannot consume them. Empty
sections are never automatically populated merely to make a dossier look complete.

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

A future reviewed generic policy may derive one minor `regulatory_alignment` modifier from a
verified current FDA source unit when its indication, population, jurisdiction, and selected
formulation exactly match the resolved patient and treatment. The provisional balance is +10.
Regulatory records stay separate from treatment-route evidence, the modifier deduplicates per
selected treatment, a true contraindication suppresses it, and no approval match produces zero
rather than a penalty. The current identity and regulatory catalogs do not activate this policy.

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

The target exposure model reuses medication and supplement identities and owns separate identities
only for other substances. Its optional misuse prior is intentionally coarse: one approximate
probability given use, plus prescribed-to-patient and not-prescribed-to-patient multipliers for
medications. Every prior requires a formal contribution or Developer opinion; no recorded prior
means uncharacterized rather than zero.

`ResolvedExposureInventory` is objective positive-use state. Each entry preserves current or
elapsed recency, a current amount when applicable, medication prescription relationship, the final
misuse Boolean, and authored or deterministic resolution. Absence means the frozen patient did not
use that agent, not that the player failed to assess it. Patient report, collateral, records,
toxicology, intoxication, withdrawal, diagnosis, and causal attribution remain separate evidence
or clinical owners. This unified target replaces a second supplement-use array in the future
`ResolvedPatientState`; existing background-exposure and supplement schemas remain compatibility
records. Age-based counts, allowlists, enthusiast patterns, clinical effects, and generation
profiles remain proposed authoring work.

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
each selectable therapy modality. Source contributions and condition dossiers may preserve
delivery- or course-specific wording, but the focused encounter projection contains only the
stable modality ID and means “recommend this intervention now.” It does not assert duration,
protocol fidelity, practitioner details, or course completion. Referral remains a separate
selectable intervention when the immediate action truly is referral. Exact manual text,
worksheets, scripts, and training materials remain outside the database unless an item-specific
permission allows them.

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

- a source-controlled `PatientTemplate`—the current technical name for a case/encounter
  recipe—owns setting, condition and chart-record constraints,
  patient-family optional-comorbidity pools, regimen/prior-trial constraints, clinical-context
  dimensions, presentation generators, specific observations, encounter focus, an encounter
  complexity budget or envelope, presentation limits, narrow overrides, and provenance;
- reusable diagnosis, medication, investigation, therapy, disposition, and clinical-decision
  policy files own knowledge shared across templates;
- a `PatientInstance` saves the fully resolved fictional person, including every internal
  condition, chart diagnosis entry, medication-regimen entry, prior trial, typed fact, derived tag,
  observation, demographic choice, and seed;
- an `EncounterInstance` freezes the immediate decision snapshot, available actions, and compiled
  rubric;
- an attempt saves player events against that frozen encounter.

The point-free `ResolvedPatientState` foundation now supplies the future `PatientInstance`'s
clinical-state payload without activating generation. Internal conditions and chart claims are
separate; chart mappings may be absent; repeated chart diagnoses and medication identities are
valid; target-scoped duration and burden reference exact resolved records; and canonical findings,
measurements, structured tests, treatment/reaction history, context, and proposition evidence
remain independently auditable. The envelope contains no template constraints, clinical
inference, points, reveal state, or encounter rubric.

The compiled rubric is anchored by exactly one version-pinned `DecisionPolicyDefinition` and its
one primary broad route. The policy may name narrow supporting overrides, but it does not copy or
hand-list every patient-specific effect. The compiler may discover a reviewed secondary rule from
any exact typed fact in the complete frozen `ResolvedPatientState` when that rule also names an
exact action available in the focused horizon. Broad routes owned by background diagnoses stay
inactive unless selected as the primary policy; matching safety, interaction, and
treatment-prerequisite guardrails remain eligible. Labels, prose, arbitrary tags, lexical
similarity, and file order never create a match.

`CompiledRubric` freezes the policy, primary route, included rule versions, inclusion lane,
normalized patient/action activation predicates, exact fact-to-record bindings, matched action
targets, review/provenance/balance references, effect/issue/specificity metadata, coverage
diagnostics, and compiler/index fingerprints. A reusable rule may explicitly require several facts
from the same repeated regimen/trial/reaction record; those facts must be unique, share one record
kind, and bind to a common record. Singleton patient-state owners and separate clinical-context
dimensions have distinct deterministic binding IDs; ordinary conjunction remains cross-owner.
Duration and burden facts preserve their source and time scope, burden preserves its scale version,
and current-regimen tolerability preserves the exact subject entry. A tolerability-linked regimen
operation is invalid unless its predicate requires and its action targets that same entry; a
medication-level match cannot silently cross duplicate regimen entries.
Negative facts must be explicit (`absent`, `false`, `documented_none`, and similar). Missing,
unassessed, unresolved, and inapplicable state is never converted to false through closed-world
negation. The compiler canonicalizes unordered branches/targets/provenance IDs before freezing the
artifact, uses all 16 hexadecimal digits of its 64-bit compiler fingerprint in the rubric ID, and
includes the exact patient-state and action-horizon IDs in the verified payload. It provides a
payload-integrity verifier for persisted or untrusted data. The active rule-reference union is
deliberately restricted to canonical owner kinds already validated by the content tool. An approved
policy or medication-regimen record may depend only on medically approved formal contributions or
accepted Developer opinions; a permitted but unreviewed source-use record cannot activate reviewed
behavior.
The first real D-237 records make this boundary executable without making it runtime-active: the
MDD initial-medication policy pins one route; the route pins its approved diagnosis rule, exact
typed MDD focus predicate, and exact one-eligible/one-total-start transition; and the explicit
class memberships identify the five reviewed medication identities. The authoring adapter creates
only the coarse action-horizon candidate. The canonical route still owns cardinality, and its pure
transition evaluator derives no points.
D-238 adds a separate `DecisionBalanceCatalog`: one exact rule reference may resolve to one
separately versioned provisional balance containing a non-diagnosis component, impact band,
nonzero matched point value, zero-on-not-triggered behavior, explanations, and accepted
Developer-opinion provenance. `attachDecisionBalance` decorates the normalized candidate; the
route and policy stay point-free. D-242's native evaluator receives complete point-free player and
database-plan decisions, each preserving information-action, diagnosis, and treatment selections.
Exact selected-action matching stays distinct from D-191 horizon availability. The current route
continues to read only each decision's treatment lane; it does not derive points from rule metadata
or search for a maximized plan.
D-243 adds one nullable `triggeredInformationPrerequisite` to a normalized candidate and compiled
rule. It is required for a diagnosis-owned prerequisite and contains a non-information trigger
plus information-only fulfillment; `actionWhen` is the exact fulfillment predicate. The closed-v1
pair also retains its originating policy ID/version and focused-decision ID, and requires a
non-null typed patient predicate. The D-191 `3.0.0` compiler freezes the complete contract only
when both action sides are available and its retained policy scope exactly matches the current
policy. The selected-decision evaluator preserves three point-free states—`not_triggered`,
`fulfilled`, and `omitted`—without collapsing them into the existing matched/unmatched balance
shape. The approved MDD medication-reconciliation and reaction-history rules can now be adapted
mechanically; the tag-based antidepressant/mania rule cannot.

D-244 extends `DecisionBalanceDefinition` as a strict union rather than adding points to diagnosis
or policy content. A triggered-information balance targets one exact approved diagnosis rule and
owns explicit zero `notTriggered`, positive `fulfilled`, and negative `omitted` outcomes, each
with its own explanation and applicable provisional impact band. The two initial MDD records are
separate stable catalog entries and cite the accepted treatment-triggered-history Developer
opinion. A balance retune versions the balance record/catalog only. Generated point rows preserve
the exact nested three-state evaluation even when the qualitative rule remains unbalanced.

A patient template still should not copy a
complete treatment plan from every diagnosis file. Current `CaseInstance` snapshots remain
immutable and replayable during migration; no old save is silently reinterpreted.
[PATIENT_GENERATION_ENGINE.md](PATIENT_GENERATION_ENGINE.md) specifies the target boundary.

A diagnosis dossier never owns encounter duration, difficulty, facility, location, complexity
budget, or a treatment-intensity ceiling. The MDD dossier therefore remains one reusable family
across outpatient, hospital, polypharmacy, ECT, ketamine, and other later contexts; encounter
recipes select only the branches needed for one focused decision. Unsupported advanced sections
remain sparse and ticketed instead of being split into separate diagnosis files or filled by
inference.

Static authoring prepares these reusable files and recipes, not a finite inventory of resolved
patients. Generalized composition remains disabled until the required finding, test,
medication/intervention, regimen/trial, context, and policy owners plus compiler passes are ready.
The eventual deterministic browser engine resolves and persists `PatientInstance`,
`EncounterInstance`, and rubric data from the approved bundle, clinic/location state, and an
internal seed when a queue slot is filled or explicitly refreshed.

[ENCOUNTER_GENERATION_DEPENDENCIES.md](ENCOUNTER_GENERATION_DEPENDENCIES.md) inventories which
owners currently satisfy that boundary and routes each missing layer to one authoritative ticket.
It does not add content status, clinical approval, or runtime behavior.

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

All modeled gameplay-relevant values are resolved before the encounter begins. On the target path,
that resolution occurs in the deterministic browser engine at queue-fill or explicit refresh time,
not as a checked-in pre-generated encounter. Applicable
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

The target measurement foundation now adds neutral, versioned numeric and categorical owners.
Each resolved numeric value retains its exact definition/unit version, measurement context, time
scope, source, interpretation reference, and resolution trace. `not_interpreted` is a first-class
state, so a recorded value is not automatically displayed as abnormal. MSE and physical
categorical observations remain distinct from numeric measurements. The first identity catalog
contains no reference ranges, body-habitus categories, clinical associations, or generation
probabilities, and it is not yet part of runtime patient compilation.

## Information and workup

The target model has eight deliberately separate boundaries:

1. A reusable finding definition owns neutral identity, aliases/search terms, value type, allowed
   outcomes, and permitted projection modes. Its aliases are identity-equivalent and globally
   unique.
2. The `PatientInstance` owns that patient's fully resolved value, uncertainty, origin, and
   contributor trace. It is the canonical truth even before the player reveals it.
3. An optional `LatentPatientProposition` owns one explicitly modeled adjudicable true/false
   world-state statement. It does not replace typed symptoms, experiences, diagnoses, or
   measurements.
4. `PatientPropositionEvidence` owns each patient, collateral, record, examination, or test claim
   about that proposition plus its source, conditional generation, shared origin, and dependency
   links. It is patient-scene evidence, not literature provenance.
5. A `FindingExpressionBank` owns stable wording-variant IDs for a display channel. Its phrases may
   intentionally overlap with another bank and never act as clinical rule keys.
6. A `FindingRevealProjection` owns the explicit many-to-many mapping from resolved source facts
   to one action or instrument response. Its frozen result retains every contributing finding ID.
7. A test or named-instrument definition owns components, item/response schema, generation profiles,
   units/reference intervals, interpretation metadata, rights boundary, and display conventions.
   The implemented D-220 `instrument-item-response-only.v1` owner is intentionally narrower: it
   admits only exact response metadata and an opaque rights boundary, leaving wording, scoring, and
   interpretation to later reviewed owners.
8. The shared `InformationActionDefinition` owns the stable player action ID, neutral label and
   description, History/Physical/Testing category, SOAP section, report source, service,
   fulfillment, and repeatability. Post-submit rules—not any of these definitions—own clinical
   relevance and points.

The first additive part of this target now exists without replacing compatibility content:

- `FindingDefinition` owns a stable identity, neutral label/aliases, semantic kind, admissible
  canonical outcomes, and allowed presentation projection modes.
- `ResolvedCanonicalFinding` owns one typed outcome or an explicit `unknown`/`unassessed` state,
  the definition version, resolution origin/uncertainty, and the exact contributor trace.
- `FindingContribution` identifies the contributing owner, its content version, contribution role,
  and provenance IDs. It cannot contain points or clinical relevance.
- `CanonicalFindingResolutionEnvelope` validates that a resolved outcome is admitted by the exact
  referenced definition version.
- `FindingResolutionCandidate` carries one explicit reviewed value or `no_opinion`, its upstream
  origin class, uncertainty, contributor owners, provenance, and authored/stable-draw trace.
- `CompiledSharedFindingSet` freezes one resolved value per definition, every applied or inert
  candidate disposition, all applicable reveal projections, nonblocking review diagnostics, and
  input/payload fingerprints.

The runtime catalog currently contains 41 identity-only, medically unreviewed definitions across
function, depressive/anxiety/mania history, reported psychosis, sleep/appetite, and
suicide/violence safety. They have no condition association, criteria role, prevalence, generation
weight, treatment implication, or point value. The first 37-candidate audit intentionally did not
force duration or ordinal burden into outcome values. A subsequent reviewed game-granularity
decision normalized loss/reduction of interest and loss/reduction of pleasure as aliases of one
current anhedonia identity. The next decision added one broad current self-reported
fatigue/low-energy identity while explicitly retaining sleepiness, weakness, psychomotor slowing,
medication sedation, exertional intolerance, and other possible contributors as separate facts.
The next source/time pass added separate current, past episodic, and MSE-observed grandiosity;
current self-reported impulsivity without replacing concrete high-risk behaviors; separate current
and historical suicide preparatory behavior; current self-reported weapon access without inventing
a patient-level `weapon concern`; and separate self-reported versus MSE-observed thought
disorganization. Duration and subjective burden are routed to target-scoped typed values rather
than Boolean findings. The final reviewed semantic boundary keeps paranoia as overlapping
presentation/search vocabulary while separately resolving current self-reported suspiciousness or
mistrust, ideas of reference, and persecutory ideation. Belief truth and appraisal do not live in
those identity shells.

Source, modality, and time are general axes even though the first additive schema does not yet
encode them as independent typed fields. Add only combinations encountered by real content, and
enumerate their stable IDs explicitly. Never infer scope by parsing an ID, label, alias, or phrase.
Current report, historical report, collateral, records, MSE/physical observation, and instrument
response may disagree without invalidating a patient. The explanation system preserves the
discordance but cannot infer its reason without a separately authored fact.

When a focused encounter models whether a proposition is factually true, the proposition and the
reports about it remain separate. The proposition resolves true or false before play. Each patient,
collateral, record, examination, or test claim can support, oppose, be uncertain about, or be
unable to assess it. Claims retain exact shared origins and known dependency groups so copied or
correlated reports cannot masquerade as independent corroboration. Conditional reliability is
future reviewed game-calibration data, not a global credibility score or an epidemiologic claim.
A false proposition is not automatically a delusion; patient belief state, conviction/context
appraisal, and clinical interpretation remain separate. None of these layers is generated when an
action is purchased.

The additive `ResolvedPatientPropositionState` envelope now validates the narrow proposition path:
frozen Boolean truth, source-specific assertions, exact claim origins, bidirectional dependency
groups, and separately identified belief-appraisal dimensions and interpretations. Authored and
deterministic records have distinct strict traces. The structural generation-profile record
contains no probability or credibility value. This envelope is deliberately narrower than the
future complete `ResolvedPatientState`.

No content validator requires these claims to converge on the modeled truth. A realistic resolved
corpus may contain no evidence, remain ambiguous, or even be collectively misleading without
making the patient invalid. A focused rubric instead recognizes uncertainty through explicit
blank, broad, unspecified, alternative, or conservative-coverage routes. Missing support for
those routes is a nonblocking catalog/rubric coverage gap, not a reason to regenerate the patient.

The target subjective-presentation schemas and one real runtime-excluded wording bank now exist. A
standardized instrument item uses an explicit reviewed mapping from applicable source findings to
its response, including its timeframe, respondent or observation modality, rights boundary, and
interpretation references. An unstandardized history action may instead use a deterministic
expression bank. The frozen projection saves its version, source action or item, response, stable
wording variant, and every contributing resolved-finding, proposition, and patient-scene evidence
ID before play. The same phrase may appear in several expression banks; canonical aliases remain
strict and cannot create that relationship. Post-submit audit can therefore disentangle patient
truth, assessment response, and displayed wording even when the player-facing answer is compact
or the report and observation conflict.

The pure shared-finding compiler now creates those point-free records from exact reviewed
candidates. It does not choose probabilities or diagnostic cardinality. Patient overrides may
control while displaced inputs remain visible; otherwise hard requirements must agree. A literal
hard-value contradiction returns a stable retry-or-quarantine result, while unresolved soft
disagreement is invalid upstream generation-profile input rather than a file-order winner.
Projection bindings pin finding/proposition versions and filter proposition evidence by exact
source and optional time scope. Their exact action or instrument target and response must exist in
a frozen projection horizon. Approved expression banks are version-pinned, channel-checked, and
sampled from ID-sorted variants. Its output can now attach to the synthetic target-instance
snapshot, but remains unattached to runtime patient queues, saves, and gameplay.

D-220 now supplies the neutral `InstrumentDefinition`/`InstrumentItemDefinition` response owner and
an authoring compiler. The definition pins one opaque rights boundary and, per item, the response
scale and complete option set, owning information action, respondent source, and time scope. It
includes no item wording, score weight, total, threshold, or interpretation. The compiler requires
an approved exact owner and one D-193 `response_option` projection per exact instrument target,
with a null display channel, no expression bank, exact action/report-source agreement, and
identical option sets for items sharing a scale ID. It emits one frozen response or itemized
incomplete coverage with exact contributors and deterministic replay. It does not infer finding
modality from D-193. D-221 now invokes that compiler from the catalog attachment boundary and
separates its full authoring audit from the strict presentation-safe patient response.

Existing `FindingBlueprint`, `ResolvedFinding`, `CaseBlueprint`, `CaseInstance`, saves, and replay
remain the compatibility path and were not migrated. Numeric measurements, test-owned results,
and full resolved-patient composition already have point-free owner schemas. The separate
synthetic-only target attachment now freezes:

- a versioned `PatientTemplate` recipe containing exact structural IDs, payload fingerprints,
  condition bounds, one exact `careSetting`, and one static universal action-result assembly
  reference;
- a `LocationDefinition` carrying that same exact care setting and the separately modeled
  capabilities, services, formulary, and dispositions actually available there;
- one complete `EncounterOperationalAdmissionArtifact` that evaluates the exact focused action
  horizon against only that location's baseline capabilities, base formulary, disposition
  allowlist, and eligible operational service methods;
- a `PatientInstance` containing the internal seed, exact condition bindings, complete
  `ResolvedPatientState`, verified D-193 output, presentation-safe structured source views, and
  presentation-safe D-220 instrument responses plus target-redacted D-240 duration/burden reveals;
- an `EncounterInstance` freezing the matching care setting plus exact
  location/action/diagnosis/projection horizons, D-213-derived result selectors, action-to-result
  bindings, D-219 artifact ID/fingerprint, and the D-191 `CompiledRubric`; and
- one atomic authoring snapshot with the static assembly, full
  D-219/D-217/D-215/D-220/D-240/D-213 audits, nested input/payload fingerprints, compiler-version
  verification, and one
  template/patient-bound point-free presentation-richness evaluation.

Every full internal condition is bound exactly once: a required condition retains exact
template-authored provenance, and a selected optional condition retains deterministic-generation
provenance. Additional bound background or contributing conditions are valid; chart labels,
rule-outs, overlapping findings, and diagnostic ambiguity remain separate patient-state layers.

Finding-scoped duration and subjective burden use definition/version selectors in their static
D-240 projection definitions and resolve against exact patient record IDs only after D-193 creates
the frozen finding state. D-241 places those definitions in
`universal-action-result-assembly.v3`; D-194 `9.0.0` compiles the full D-240 audit after final
truth, D-213 `3.0.0` evaluates definition-level completeness, and D-214 attaches only referenced
target-redacted reveals to `attachment_only.v6` patient instances. `not_applicable` remains
neutral, while applicable missing or ambiguous values prevent a partial binding. The full target
audit remains nested in the authoring snapshot and replays through D-200 `20.0.0`. This avoids
duplicating a pre-resolved finding merely to attach dependent state. The required
`presentation-richness.v1` envelope records decision-driver categories and one prior-effort
expectation without copying a rule predicate or point value. Its derived evaluation lists exact
IDs/counts for internal conditions, chart diagnoses, current regimen entries, exposures,
medication and psychotherapy trials, current providers, prior levels of care, reactions, and
canonical findings. It has no scalar tier, global maximum, clinical inference, or rejection
authority.

Optional-condition selection uses a separate `TemplateConditionSelectionProfile`, not a field
inside the template. It pins one exact template version and payload, contains exactly one group
profile per optional group, and records explicit `gameSelectionWeight` values for reachable counts
and every candidate. A frozen `TemplateConditionSelectionArtifact` retains all selected and
unselected candidate evaluations, stable draws, required and optional bindings, complete condition
states, approved literal incompatibilities that actually matched, and verified request/output
fingerprints. These weights have no evidentiary or clinical-probability meaning. The artifact is
not yet attached to the catalog-instance snapshot; a later composer must preserve it rather than
discarding its trace.

An exact selected `ConditionState` may bind matching
`ConditionFindingCardinalityProfile` records. Each profile owns one reviewed scope; its fixed
outcomes are required, while each bounded group owns explicit game-only count and member weights
and samples members without replacement. `ConditionFindingCardinalityArtifact` preserves exact
profile fingerprints, state/profile bindings, required evaluations, every selected and unselected
group member, stable draws, source/Developer-opinion provenance, emitted D-193 candidates, and
unbound selected conditions. Only selected members emit a `cardinality_requirement`; an unselected
member is not rewritten as absent. Multiple selected conditions or composable profiles may emit
agreeing or conflicting candidates for the same finding, and D-193 remains their sole exact-value
reconciler. The first profile shape deliberately keeps one finding target unique within one
profile; coupled or overlapping constraint groups remain later design work rather than an
implicit rule. A valid zero-count-only result may emit no candidate and is therefore a
compositional partial; the later composer, not this selector, must supply D-193 a nonempty merged
candidate set.

A bounded `BackgroundFindingHorizon` may now name exact finding versions that receive independent
reviewed background texture. Each target has one `weighted-background-finding.v1` profile with a
finite unique outcome set and positive integer `gameGenerationWeight` values. The frozen artifact
retains every offered value and weight, exactly one selected value, the stable draw, exact
D-197/horizon/profile pins, approved source/Developer-opinion provenance, one emitted
`background_variation` candidate, and input/output fingerprints. These weights have no prevalence,
clinical-probability, evidence-strength, or scoring meaning: they are unnormalized synthetic
generation mass. The selector never creates an implicit normal/absent value and never inspects
context; D-193 alone decides whether the background value fills a target or remains displaced by a
hard candidate.

`WeightedFindingTendencyProfile` records add one complete nonnegative allocation over an exact
finding-definition outcome universe. That universe is a single closed exhaustive mutually
exclusive category set and must exactly match the positive D-198 baseline; coexisting states use
different finding identities. Each `WeightedFindingTendencyBinding` pins an exact profile,
background target, and already-matched typed applicability contributions. The aggregator preserves
each baseline and contributor table separately, then stores exact pooled mass plus
`numerator / denominator` and decimal normalized game-selection probability for every outcome.
Exactly one deterministic result emits a `weighted_tendency` candidate. A zero contributor entry
adds no support; it does not make that outcome impossible. Every contributor uses a complete
vector, so the engine never guesses which alternatives receive displaced support.

`FindingPipelineAuditRequest` combines one complete D-208
`ResolvedPatientStateCompositionArtifact` with either the full D-197, D-198, D-210 applicability
audit, and candidate-free D-193/D-194 recipe or a null downstream request when D-208 is blocked.
The ready request accepts no caller-owned D-199 artifact. D-200 derives a D-199 request only from
D-210's emitted bindings, exact referenced profiles, and exact targeted finding definitions. The ready
recipe no longer accepts independent patient-state, condition-binding, patient-state-ID, or
proposition-state copies. Only explicit authored `patient_override`, `case_critical`, and
`no_opinion` candidates can be added at this boundary. `FindingPipelineAuditArtifact` embeds every
upstream artifact, including D-208, D-210, the nullable derived D-199 request/result, and the
complete condition source, the ID-normalized
collision-free union, the complete assembled
`CatalogInstanceCompileRequest`, D-193/D-194 input fingerprints, and either the complete
`CatalogCompiledInstanceSnapshot` or a normalized `LITERAL_SAME_SCOPE_CONTRADICTION`. D-197's
embedded source and typed reference must exactly match D-208's source. D-200 derives the D-193
patient-state ID/proposition state and D-194 base state/bindings from D-208. The background
candidate remains present beside a weighted candidate so candidate dispositions can explain which
lane prevailed. Standalone integrity replays the retained D-208 → D-193 → D-194 request and
verifies its exact candidate bodies, native source integrity, template/condition context, compiled
snapshot or hard conflict, and outer fingerprints. A blocked D-208 request returns its typed
composition blocker before downstream compilation.

`PatientOptionalFeatureModuleDefinition` owns only the reusable identity and kind of one optional
texture module. `TemplateOptionalFeatureCandidateBinding` separately gives that module an
exact-template cost, impact, five-axis complexity contributions, synthetic game-selection weight,
and review. `TemplateOptionalFeatureSelectionProfile` owns the complete candidate pool, explicit
count weights from zero through the template maximum, and reviewed pair incompatibilities. The
D-201 selection artifact preserves the normalized request, exact module/profile fingerprints,
every feasible or infeasible count, per-step eligibility, all draws, selected and unselected
module snapshots, total spent, and unspent capacity. Its resulting complexity profile is an
authoring snapshot only: it identifies optional modules but contains no reaction, condition,
exposure, regimen, trial, finding, test, or scoring payload.

`OptionalComorbidityBridgeProfile` owns the exact-template relationship from each D-201
`comorbidity` candidate definition/binding/selected-record identity to one D-196 optional
group/candidate. The mapping is a bijection across both complete candidate pools, and every
bridged group permits zero selections. Focused conditions cannot enter this optional mapping. The
current exact pool is bounded by D-201's 64-candidate cap.
`OptionalComorbidityBridgeArtifact` retains the complete
D-201 artifact and normalized D-196 request, every selected and unselected mapping, configured
D-196 weights as noncontrolling audit context, authored required and selected optional condition
states/bindings, explicit incompatibility conflicts, and replay fingerprints. Optional condition
membership and provenance come only from D-201; the bridge contains no second count/candidate draw
and performs no budget calculation.

`ResolvedConditionSource` is an authoring-only discriminated union over the complete genuine D-196
selection artifact or complete genuine D-202 bridge artifact. Its source-kind-aware reference pins
the native artifact ID/payload fingerprint and exact template; a derived common view never becomes
a second truth record. D-197 embeds and re-verifies this source, accepts findings only from a
successful source, and preserves an exact bound/unbound partition of source condition states.
D-204 makes D-200 retain and re-verify that same complete source, then uses only the derived
template, condition states, and bindings for D-194 attachment.

`OptionalReactionHistoryBridgeProfile` maps every D-201 `allergy_reaction` candidate to one
complete typed reaction-history alternative and pins its exact module version/fingerprint,
candidate binding, selected-record identity, approved review, and narrow reference horizon.
Reaction alternatives are pairwise incompatible in D-201, so the bridge materializes at most one
complete payload with the original D-201 ordinal/draw and unchanged spending audit. No selected
reaction module produces null; no selected module means a null optional contribution rather than
fabricated unassessed or documented-none state. The artifact remains authoring-only and does not
merge with required/base reaction state or interpret `recordedAs`, severity, manifestations, or
medication consequences.

`OptionalPriorTreatmentContribution` is a positive additive fragment, not a complete-history
replacement. It contains at least one medication trial, psychotherapy trial, current provider,
and/or prior level-of-care record using the existing owners. Its profile bijects every D-201
`prior_treatment` candidate to one reviewed contribution and exact module/binding/selected-record
identity. Compatible selected fragments concatenate into four ID-sorted lanes; all record IDs are
globally unique across mappings, but repeated treatment identities under distinct record IDs are
preserved. A narrow horizon exactly pins medication and psychotherapy intervention versions.
Null means no optional contribution, never treatment-naive. Decision-defining history remains
core state, and core-plus-optional composition is deferred.

`OptionalExposureContribution` owns one nonempty list of
`OptionalExposureUseEntrySpecification` records using exact medication, supplement, or
other-substance identities. Compatible D-201-selected contributions may concatenate only when
their stable record IDs and semantic agent identities are disjoint. Same-agent alternatives must
pin one exact content version and be explicitly incompatible in D-201.
`OptionalExposureMaterializedContribution` adds only deterministic resolution provenance from the
original D-201 stable draw; it does not become a complete `ResolvedExposureInventory`. A null
contribution means no optional exposure texture, not nonuse or unassessed state. The exact
reference horizon covers every and only agent identity/version used across mappings. Required
exposure, population or misuse priors, evidence/reveals, intoxication/withdrawal, diagnosis,
points, base-state composition, and runtime remain separate.

Real contributor discovery, instrument output, compatibility mapping, persistence, and runtime
generation remain later dependency work. D-208 now composes one complete pre-finding
`ResolvedPatientState` from required/default state plus the genuine D-202, D-205, D-206, and D-207
outputs selected by one exact D-201 artifact. Conditions replace the required-only lane, reaction
history replaces only an explicitly declared default, and treatment history and exposure append
without deduplication. The composition artifact retains every cost, ordinal, draw, bridge, and
coverage diagnostic. A selected unsupported `other` module yields no state and is neither rerolled
nor refunded. D-209 now attaches this single source to D-200/D-194 and removes the parallel
caller-owned state and binding inputs.

D-210 adds a separate reviewed applicability-definition owner. One definition identifies one
finding-definition version and one exact complete D-199 profile, then supplies a positive typed
patient predicate. Its compilation evaluation records the normalized predicate, exact
fact-to-record matches, exact D-198 target availability, and either one emitted D-199 binding or
none. Multiple matching records do not multiply a profile. Missing or unassessed known state is a
nonmatch, not a negative contribution. The artifact retains the complete D-208/D-198 request and
all definition/profile/target fingerprints for replay; it owns no allocation weight, probability,
complexity cost, point value, or clinical score.

D-211 makes D-210 the sole applicability-binding source for D-199 inside D-200. A nonempty binding
set produces one exact retained D-199 request and artifact; an empty set keeps both null while
retaining all D-210 evaluations and the D-198 baseline. D-200 never reruns the patient predicate
matcher. One D-201 module cost remains one encounter-complexity charge even when the module's
frozen records match several applicability definitions; downstream relationship count and
generation mass never spend or recalculate that budget.

D-212 supplies the missing source-view boundary for structured state that is not a canonical
finding. `StructuredPatientStateRevealDefinition` pins one information action by full payload
fingerprint and declares only closed lanes and singleton fields. Initial lanes cover chart
diagnoses, regimen entries, positive exposure-use truth, medication and psychotherapy trials,
providers, prior levels of care, medication-tolerability findings, and reaction records. Explicit
singleton fields retain overall reaction status, medication-reaction assessment status, and the
patient's reported ability to participate in safety planning.

`ResolvedStructuredPatientStateRevealProjection` represents one exact patient, collateral,
record, or clinician-observation view at one time scope. It records source instance, claim origin,
dependency groups, presentation status, included truth-record IDs, audit-only omitted truth-record
IDs, singleton truth and presented values, and aligned/misaligned/indeterminate relationships.
`StructuredPatientStateRevealProjectionEnvelope` proves exact definition, action fingerprint,
patient-state identity, source bounds, lane partition, singleton truth, and reaction-status
consistency. A source can omit or deny a true exposure without changing
`ResolvedExposureInventory`; a genuinely empty lane can be `none_reported` or `unassessed`, but
the two remain explicit and different.

This first version does not invent false-positive records or alter individual fields inside a
truth record. It has no real source-report generation profile, wording, reliability probability,
scoring, points, persistence, or runtime output. D-201 remains the only optional-complexity
selector and spender.

D-213 adds `UniversalInformationActionCatalog`, `UniversalActionResultRecipe`, and a
`UniversalActionResultArtifact`. The recipe names only one exact action payload and a closed set of
source-owner classes; it contains no free filter, clinical relevance judgment, wording, or point
rule. The compiler retains one evaluation per catalog action and normalizes source references into
a binding candidate only when every declared owner class is present. D-213 `2.0.0` supports D-193
finding projections, D-212 structured source views, measurements, categorical observations,
structured tests, and exact complete D-220 instrument responses.

Missing frozen data and an explicit negative are different: a missing declared source produces an
incomplete-coverage diagnostic and null candidate, while a D-212 source view may explicitly say
`none_reported`. Exact owner definitions and content versions are validated; malformed or stale
frozen owners cannot be downgraded into an apparently empty result. The artifact retains its full
normalized request and deterministic replay fingerprints.

D-214 adds `UniversalActionResultAssemblyRecipe`,
`StructuredPatientStateRevealProjectionRecipe`, and
`FrozenStructuredPatientStateReveal`. A reusable `PatientTemplate`
`attachment_only.v2` pins only the static assembly recipe: the complete action catalog, universal
recipes, and source definitions. Patient-specific structured projections are supplied separately
and are attached only after D-194 has the final D-193-backed state. D-194 builds exact D-212
envelopes, requires one complete D-213 artifact for the entire focused information-action horizon,
and derives all result-binding requests. There is no caller-owned binding list or partial fallback.

The full authoring snapshot retains hidden D-212 truth and audit data through D-213. The
`PatientInstance` retains only the frozen source presentation: source/time identity, explicit
presentation statuses, presented record IDs, and presented singleton values. Omitted truth IDs,
truth values and relationships, claim/dependency audit, copied patient state, and authoring
resolution stay out of that safe view. D-194 and D-200 `5.0.0` verify and replay exact assembly,
patient, D-193, D-212, action, and projection context. These records own no complexity fields,
clinical score, point value, purchase cost, reveal state, persistence, or runtime authority.

D-215 adds `StructuredSourceReportProfile`, `StructuredSourceReportCompileRequest`, and
`StructuredSourceReportArtifact` as a standalone authoring-only transformation over one exact
frozen `ResolvedPatientState`. An already-selected reviewed profile resolves every declared
whole lane exactly once as `report_all`, `none_reported`, `unassessed`, or
`unable_to_assess`. Typed singleton fields either mirror truth or present one explicit lawful
typed value. The artifact pins the exact patient-state, D-212-definition, profile, and source-view
fingerprints and replays the complete request. It cannot filter individual record IDs, choose a
probability or weight, mutate fields, spend complexity, or assign points. No real profile exists,
and this artifact is not yet attached to D-194.

D-240 separately adds `TargetScopedPatientValueProjectionDefinition`, full authoring
`ResolvedTargetScopedPatientValueProjection`, minimized
`FrozenTargetScopedPatientValueReveal`, and one replayable projection artifact for clinical
duration and subjective burden. Each definition is singular: one action payload, value kind,
duration profile or ordinal scale, target-definition selector, source kind, and time scope. A
definition never names a patient-specific record. The compiler reports `not_applicable`,
`ambiguous_target`, `missing_required_value`, or `complete`, and a complete result retains an
explicit record-to-opaque-frozen-value binding. Raw target identity, duration
interpretation/criterion, related diagnosis, profile option, and generation resolution stay out
of the frozen reveal.

D-241 places only the definitions in `universal-action-result-assembly.v3` and the full compiled
artifact inside D-213's replay request. D-213 `3.0.0` exposes only complete frozen-reveal
references, and D-214 attaches only the in-horizon safe subset to `PatientInstance`. Target
absence is neutral when another source resolves; missing or ambiguous applicable targets make the
action incomplete. The full raw-target audit never enters the patient-safe view.

D-216 added the closed `EncounterCareSetting` values `outpatient_psychiatry`,
`emergency_department`, `inpatient_psychiatry`, and `consultation_liaison`. A
`PatientTemplate` owns exactly one setting, the exact `LocationDefinition` declares it, and the
`EncounterInstance` freezes it. Snapshot validation requires equality across all three. The
D-216 attachment contract was `attachment_only.v3`, catalog-instance compiler `3.0.0`, and
D-200 composer `6.0.0`. Setting consumes no optional-complexity budget and confers no capability,
action, service, formulary item, disposition, difficulty, reimbursement, or point behavior. All
current runtime locations remain outpatient; other setting content and runtime generation remain
deferred.

D-217 adds `StructuredSourceReportSelectionHorizon`,
`StructuredSourceReportSelectionProfile`, and
`StructuredSourceReportSelectionArtifact`. The horizon is setting-neutral and owns exact
source-view slots. The reviewed profile binds that horizon to one care setting and supplies one
fixed or weighted complete D-215-profile policy per slot. Weighted mass is normalized only within
one mutually exclusive slot and is never clinical prevalence, source reliability, evidence
strength, points, or optional complexity. The artifact preserves every candidate, the exact
selected profile, nullable stable draw, care setting, static assembly and definition fingerprints,
and deterministic replay. It contains no patient truth.

D-218 changes `CatalogInstanceCompileRequest` to carry that nullable D-217 artifact instead of
caller-authored structured reveal recipes. A nonempty static definition horizon requires it;
D-194 then runs D-215 over final frozen patient truth. `CatalogCompiledInstanceSnapshot` retains
both the selection and compiled report artifacts, while `PatientInstance` still receives only
presentation-safe D-214 views. Empty definition horizons retain null for both artifacts. The
compiler and D-200 audit replay their exact context without adding points, complexity, or runtime
authority.

D-219 adds `EncounterOperationalAdmissionRequest` and
`EncounterOperationalAdmissionArtifact`. The request owns exact versioned operational projections,
not full scoring or economy catalogs: service methods expose only capability, staff, and
location constraints; medication owners expose only identity/version; formularies expose exact
membership; and treatment definitions provide their existing kind, capability, optional service,
and disposition identity. The output retains one normalized evaluation for every focused
information action, start medication, current-regimen operation, intervention, and disposition,
plus exact owner fingerprints and itemized coverage diagnostics.

Care setting remains equality-only. Baseline availability derives only from the selected physical
location; it never unions capabilities or formularies across a facility. Staff-dependent methods
remain pending an explicit future runtime context. Existing-regimen operations are available as
patient-owned targets even when their medications are absent from the new-start formulary.
`incomplete_coverage` blocks attachment but does not alter patient truth, reroll state, infer a
clinical route, or spend/refund complexity.

`attachment_only.v4`, catalog compiler `5.0.0`, and D-200 `8.0.0` require, retain, pin, and replay
one complete D-219 artifact. It contains no operating cost, point value, quality modifier,
cheapest-method choice, clinical correctness, reimbursement, or runtime access grant. The
compatibility `CaseBlueprint` queue and saves are unchanged; generalized four-setting runtime
queues remain disabled.

D-220 adds `InstrumentInformationActionHorizon`,
`InstrumentItemResponseCompileRequest`, `InstrumentItemResponseEvaluation`, coverage diagnostics,
and `InstrumentItemResponseCompilationArtifact`. The minimized action horizon contains only exact
information-action IDs; it does not duplicate medication, intervention, or disposition state. The
artifact evaluates every exact instrument target once, retains a complete empty result when no
instrument target exists, and preserves the normalized definitions, owner/action/horizon
fingerprints, response records, diagnostics, and replay request.

A complete response copies only the reviewed instrument-owned scale, option, action, respondent,
time, rights, and D-193 contributor/projection references. Interpretation IDs are empty. D-220
compiler `1.0.0` remains independently integrity-verifiable.

D-221 advances the static assembly to `universal-action-result-assembly.v2` and makes its exact
instrument definitions part of D-194's versioned input. After final D-193 truth, D-194 derives the
minimized instrument-action horizon and complete D-220 artifact. D-213 `2.0.0` indexes each
response only under its exact owning action, and D-214 freezes the corresponding result selector
plus a strict `FrozenInstrumentItemResponse`. The patient-safe response keeps identity, action,
scale, selected option, respondent, time, and rights fields; it excludes contributors,
proposition/evidence IDs, projection IDs, interpretation fields, diagnostics, compile requests,
and fingerprints.

`CatalogCompiledInstanceSnapshot` retains the full D-220 artifact at the root and inside D-213's
compile request. Exact equality plus deterministic replay protects both copies, the patient-safe
projection, and encounter bindings from crossed or tampered content. An empty instrument horizon
retains a complete empty D-220 artifact and freezes no response. `attachment_only.v5`, catalog
compiler/D-194 `6.0.0`, and D-200 `9.0.0` implement this uniformly for outpatient psychiatry,
emergency department, inpatient psychiatry, and consultation-liaison without granting resources
from the setting name or spending D-201 complexity. D-219 remains the exact-location operational
admission owner.

No real instrument definition, item text, total, cutoff, validation claim, interpretation,
clinical rule, point value, persistence migration, runtime generation, or UI is enabled by this
attachment.

D-222 adds `ClinicLocationResourceAssignmentHorizon`, `SelectedLocationResourceAssignment`,
`SelectedLocationOperationalResourceContextRequest`, minimized upgrade/formulary owners,
itemized diagnostics, and `SelectedLocationOperationalResourceContextArtifact`. The horizon belongs
to one exact ClinicState and contains exactly one location-version-pinned assignment for every
built clinic location. Each assignment uses exact versioned and fingerprinted upgrade/formulary
references, while each upgrade owner declares `exclusive_location` or `shared_locations`. This is
distinct from both clinic ownership and the selected location's baseline catalog.

Compiler `1.0.0` admits assignment-derived resources only after exact clinic/facility/location and
optional department context succeeds. Upgrade grants require an exact owner, clinic ownership,
separate equipment ownership when applicable, facility allowlisting, allowed facility tier, and
the required built department at that location. Every reference must match the current owner
identity, version, kind where applicable, and fingerprint; exclusive owners cannot appear at
multiple locations. Staff assignment must match owner kind and exactly one clinic-owned automation
configuration inside the owner's action horizon and maximum, without duplicate or cross-staff
overlapping actions. Additional formularies require an exact current owner and clinic ownership,
and the assignment must equal the formulary grants of valid upgrades; the baseline location
formulary also needs an exact owner.

The artifact separates `baselineCapabilityIds` from assigned upgrade references and effective
capabilities, formularies, and staff contexts. It cannot inherit clinic-global or
neighboring-location resources merely because the clinic owns them. It records honest
complete/incomplete status, itemized diagnostics, normalized input, exact fingerprints, and
deterministic replay for outpatient psychiatry, emergency department, inpatient psychiatry, and
consultation-liaison. External verification also receives and compares the complete current
upgrade/formulary owner horizons, so a stale or fabricated grant cannot pass.

D-224 makes D-222 the exact operational resource root consumed by D-219 `2.0.0`; D-222 `2.0.0`
binds exact formulary medication membership, and D-194/D-200 retain and replay the complete
historical resource/admission chain. A separate validation-only current resource context prevents
a historical snapshot from authorizing current activation. D-222 still remains outside
`PatientInstance` and `EncounterInstance` and has no clinical, scoring, economy, probability,
purchase, service-selection, persistence, runtime, or D-201 complexity fields.

D-223 adds the authoring-only `PreFindingPatientStateOrchestrationRequest` and
`PreFindingPatientStateOrchestrationArtifact`. The request owns one exact D-201 selection request,
a discriminated required-only D-196 or D-202 condition plan, the pre-finding core
`ResolvedPatientState`, explicit reaction-history ownership, and nullable typed D-205, D-206, and
D-207 bridge inputs. Candidate kinds determine which inputs must be present; caller omission or an
unexpected parallel lane is invalid.

The orchestrator runs D-201 exactly once. A candidate horizon with no comorbidity uses D-196 and
must contain no optional condition groups. A horizon containing any comorbidity candidate uses
D-202 even if none is selected. Every present reaction, prior-treatment, and exposure lane retains
its complete bridge artifact, including an explicit null materialization. This preserves the
difference between no optional contribution and documented none, treatment-naive, or nonuse.
Reaction-history replacement is valid only under explicit `optional_alternative_default`
ownership; otherwise the core history remains `core_locked`.

The resulting artifact contains the exact D-201 selection/accounting artifact, resolved condition
source, nullable complete D-205/D-206/D-207 artifacts, complete D-208 composition artifact,
normalized orchestration request, exact input and payload fingerprints, status, and deterministic
identity. A D-202 literal conflict or selected `other` results in `not_composed` with the full
selection and cost trace intact. It cannot refund, reroll, drop a module, or invent a typed
fallback. External verification requires the exact template, seed, profiles, horizons, ownership,
and core payload and replays every nested artifact.

The model is identical for outpatient psychiatry, emergency department, inpatient psychiatry,
and consultation-liaison; the setting remains an exact template coordinate but owns no patient
content or operational grant. D-225 makes D-223 the single D-200 `11.0.0` pre-finding root, from
which the genuine nested D-208 state is derived. D-223 remains outside patient/encounter
projections, runtime persistence, and queues. It defines no real module payload, clinical
behavior, points, probabilities, or additional complexity budget.

`ModePatientTemplateHorizonRequest`, `ModePatientTemplateHorizonMember`, and
`ModePatientTemplateHorizonArtifact` implement D-231 before operational admission. One strict
request owns an explicit lifecycle-approved lane and, only for local Developer mode, a separately
supplied lifecycle-review lane. Every member retains the exact template reference, full-payload
fingerprint, lifecycle, independent medical-review status, care setting, pool, and inclusion
basis. Wrong-lane, blueprint, draft, deprecated, and duplicate stable IDs are rejected. The
artifact is deterministic and replayable but owns no location, resource, run-history, weight,
point, probability, or complexity authority.

D-226 adds `PatientTemplateLocationAdmissionMatrixRequest` and
`PatientTemplateLocationAdmissionMatrixArtifact` as current-context authoring records. The request
contains the complete current clinic/facility/built-location and assignment context, current
operational owners, the verified D-231 artifact as its sole template source,
action-horizon/assembly catalogs, and D-219 owner catalogs. The
artifact contains one D-222 resource evaluation per built location and one deterministic
evaluation for every template × built-location pair.

An evaluation distinguishes exact admission, undeclared compatibility, stale location version,
care-setting mismatch, missing template dependencies, incomplete location resources, and
incomplete operational coverage. An admitted cell retains the complete exact D-219 artifact;
incomplete D-219 coverage retains its audit rather than collapsing to a Boolean. The matrix is not
a patient catalog, a clinical eligibility verdict, a queue, a randomizer, or a complexity
envelope. It compiles no patient and consumes none of D-201's budget.

`ClinicOperationalContext` is the strict derived mutable-state input for D-222 and D-226. Its
`clinic-operational-context.v1` model contains clinic ID, facility ID/tier, built locations and
departments, owned upgrades/equipment/formularies, and staff automation configurations. It
contains no label, active location, global capability union, current/lifetime points, debug flag,
or satisfaction. The projection is rebuildable from ClinicState and is not persisted as a second
truth store.

D-231 advances the complete proof chain to D-231 `1.0.0`, D-226 `3.0.0`,
D-228/D-229/D-230 `2.0.0`, and D-200 `18.0.0`. D-222/D-219/D-194 remain
`3.0.0`/`3.0.0`/`8.0.0`. PatientInstance, EncounterInstance, ClinicState, SaveDataVersion, and
D-201 complexity schemas remain unchanged.

`AdmittedTemplateLocationBindingArtifact` is the compact D-228 certificate for one caller-named
admitted D-226 cell. Its compile input contains the full D-226 artifact plus the complete current
matrix request; its retained request stores only the matrix identity/fingerprints and evaluation
ID. The artifact freezes the exact template and location payloads and fingerprints, patient pool,
care setting, selected D-222 resource reference, and complete D-219 artifact. Intrinsic validation
proves those nested owners agree; external-context validation recompiles against the current
D-226 matrix.

`LocationOwnedPatientSlotSelectionArtifact` is the D-229 certificate above D-228. It retains one
resolved exact physical-location slot coordinate and location fingerprint/setting, a compact
D-226 matrix reference, every and only admitted candidate for that location in deterministic
order, the caller-selected evaluation ID, and the nested exact D-228 binding. It rejects an empty
local horizon and never falls back to another location or a clinic-global queue. It contains no
draw, weight, seed, repeat, refill, persistence, mode, point, or complexity authority.

`LocationTemplateDistributionProfile` and `LocationTemplateSelectionArtifact` implement D-230
above D-229. The profile pins one exact location and exact template versions/fingerprints, with
positive relative game-selection weights and positive active/recent repeat multipliers. The
artifact freezes the local repeat-context snapshot, exact integer effective mass, normalized draw
probabilities, stable 64-bit slot-local draw, selected candidate, and complete nested D-229 proof.
Only stable template IDs participate in local repeat matching; each suppression class applies once
while retaining its match count. These values are game-distribution audit data, never prevalence,
clinical probability, points, difficulty, or complexity.

`LocationPatientSlotCapacityProfile`, `LocationPatientSlotCapacityArtifact`, and
`CapacityBoundLocationTemplateSelectionCertificateArtifact` implement D-232 without changing
location, facility, or clinic-state schemas. The profile owns one exact location's base capacity
and possible exact upgrade contributions. The artifact retains the minimized relevant ownership
and assignment audit plus every stable base/upgrade-authorized coordinate. The certificate pins
one D-230 selection to one of those coordinates but contains no clinical resource, draw, weight,
point, or complexity authority.

`FacilityLocationSuccessorProfile` and `FacilityMoveWaitingSlotMigrationArtifact` are separate
authoring records. A proposed migration retains the complete frozen patient, source coordinate,
historical D-200/D-233 proof, target capacity reference/authorization, and fresh target D-228
binding. The top-level artifact retains every slot evaluation and either commits all proposals or
none. Itemized missing-mapping, capacity, and exact-admission diagnostics remain auditable.

`PatientSlotGenerationRoot` is the private per-mode entropy owner.
`LocationPatientSlotOccupancySnapshotCompileInput` rehydrates full frozen waiting slots only at the
authoring boundary, while `LocationPatientSlotOccupancySnapshotArtifact` stores stable compact
occupied assignments for every current coordinate. `PatientSlotFillSeedCoordinates` retains the
root reference, mode, location/version/fingerprint, exact coordinate, fill ordinal, and occupancy
snapshot reference. The occupancy reference is audit-only: seed derivation uses only the root,
mode, exact location, coordinate, and ordinal.

`PatientSlotFillSeedAuthorityCompileInput` combines that exact occupancy with current D-226,
D-230 distribution, and mode-local recent-completion context.
`PatientSlotFillSeedAuthorityArtifact` retains the domain-separated template-selection seed, exact
D-230/D-232 proofs, selected template/version/fingerprint, and the derived patient-generation
seed. `EmptyAuthorizedPatientSlotFillCompileInput` binds it to one D-200 request.
`EmptyAuthorizedPatientSlotFillArtifact` retains an immutable filled-or-blocked attempt, exact
ordinal transition, deterministic D-200 outcome, optional frozen waiting-patient proposal, and the
complete proposed compact occupancy. Its validators prove every unrelated coordinate is
unchanged.

`FindingPipelineAuditRequest` now requires one D-233 seed-authority artifact and one D-223
orchestration artifact. D-200 `19.0.0` derives its historical D-230, D-232, template, location, and
operational-admission input through D-233 and requires the exact D-228 template to equal D-223's
complete template. All D-223, D-197, D-198, optional D-199, D-193/D-194, optional D-217, and final
patient seeds must equal the retained patient-generation seed. Its catalog compile recipe retains
a separate current selected-location resource context so activation cannot rely on the historical
proof alone. None of these authoring artifacts enters Player content, current saves, scoring, or
the D-201 complexity envelope.

`GeneratedCompletedEncounterAttempt` is the native D-235 generated-patient completion record. Its
`GeneratedEncounterReplaySnapshot` is derived from one verified D-200 waiting slot and retains the
exact `PatientInstance`, `EncounterInstance`, waiting coordinate/location, source-audit
fingerprints, and minimized information-action fulfillment horizon without recursively copying
the complete authoring chain. Purchases bind exact frozen result, service, and fulfillment
identities. Diagnosis selections may be empty; the current compiler verifies exact family
identity and records `family_identity_only` because severity/specifier qualifier ownership remains
later work. Treatment uses the V2 medication transition with entry-targeted
`continue`/`increase`/`reduce_or_limit`/`taper`/`stop`, medication starts, interventions, and one
optional disposition.

The attempt preserves a contiguous immutable event sequence from `EncounterStarted` through
`EncounterCompleted`, final submitted selections, one complete trace row per compiled-rubric rule,
the point report, all-points settlement, engine/content versions, and deterministic replay and
payload fingerprints. Generated point-report v5 preserves a complete point-free
`GeneratedEncounterDecisionSelection` for both the player and database plan: unique purchased
information-action IDs, final diagnosis selections, and final treatment selection. The player
decision is derived from replayed purchases and final events; the reference is the sole explicit
`databasePlanDecision`. Both validate against the frozen horizons, while repeated purchases
remain separately itemized in events and expenses. D-235 compiler v6 derives the point trace and
database-plan total through the native decision-balance compiler; caller input cannot inject the
player decision, trace rows, or point magnitudes. D-245 applies one D-159 pass after per-rule
evaluation for both decisions. Same-effect specificity replacement, same-issue worst-only harm,
and exact-selected-target contraindication suppression preserve every original row, direct
controller chain, combination explanation, selected target, and nested prerequisite audit.
Broad starts and regimen operations normalize to exact selected medication or regimen-entry
operations before treatment overlap. Replay reconstructs those targets, rejects extra
noncompiled rows, and reruns combination. A qualitative rule without a balance remains an
explicit unbalanced row and can retain its point-free qualitative action match. D-239 replay
snapshot v2 additionally owns
the exact normalized `ServiceDefinition` subset and per-action fulfillment horizon. Purchase
commands contain only purchase/action identity; the native service-quote compiler derives the
method, label, operating cost, external savings, and staff savings and replays those values from
the frozen owner. Treatment charges and other settlement inputs remain explicitly unverified.
`GeneratedCompletedEncounterAttemptPersistenceRecord`
adds a wall-clock `completedAt` value and separate record fingerprint; the timestamp is not part of
clinical replay identity.

`GeneratedEncounterCompletionProof` v2 is the D-234 lifecycle wrapper around that exact native
attempt. It embeds the attempt and binds it to the exact waiting slot, patient-instance reference,
and terminal `EncounterCompleted` event before the coordinate can be vacated. The legacy
compatibility `CompletedAttempt` remains a `CaseInstance`-based SaveData v5 record and is not
widened, unioned, or treated as the generated-patient attempt.
`LocationPatientSlotCompletionHistoryState` is bounded, newest-first, duplicate-preserving, and
mode/location-local, names the exact current occupancy snapshot, and keeps patient, attempt,
completion-event, and proof identities unique.
`DeveloperPatientTemplateRunHistoryState` owns one entry per stable template ID/content version,
retains its fingerprint, and rejects a changed fingerprint without a version change.
`PatientSlotLifecycleTransitionArtifact` vacates only explicitly completed
or skipped coordinates; Endgame/Developer selected-location refresh contributes skipped audit
only, and Developer same-template rerandomization pins the prior exact template.
`PatientSlotRefillReconciliationArtifact` replays ordinary D-233 attempts in canonical empty-slot
order against one exact current matrix containing that location/fingerprint, distribution profile,
and caller-supplied generation root shared by active and retained-history patients.
Developer unrun eligibility excludes completed versions globally and active waiting versions at
that exact location and is recomputed after every fill. Reconciliation stops at a blocker unless a
later request explicitly marks that exact blocked attempt as a retry boundary in the retained
transcript; the retry starts from the advanced ordinal and new seeds. Developer exhaustion is an
empty no-op and may follow earlier successful fills. Standard automatic refill, SaveData/runtime
queue migration, IndexedDB mutation, browser/public review projections, and UI activation remain
later work.

The current authoring chain is D-230 `3.0.0`, D-233 occupancy `1.0.0`, seed authority `2.0.0`,
atomic fill `2.0.0`, D-200 `20.0.0`, facility migration `3.0.0`, and D-234
lifecycle/reconciliation `2.0.0`, with D-235 native-attempt compiler `6.0.0` and point report v5
retaining complete player and database-plan decisions plus native combination traces. D-230's
eligibility overlay filters the
exact admitted horizon before positive distribution weights; it does not change clinical
probability, points, complexity, or admission.

The
target-instance,
shared-finding, decision-policy, presentation-richness, condition-selector,
condition-finding-cardinality, background-outcome, weighted-tendency, finding-pipeline audit,
optional-feature budget, optional-comorbidity bridge, optional reaction-history bridge, optional
prior-treatment bridge, optional exposure bridge, resolved patient-state composer, and
pre-finding patient-state orchestrator, whole-state tendency-applicability, encounter
operational-admission, selected-location operational resource, template-location admission
matrix, mode patient-template horizon, admitted template/location binding, location-owned
patient-slot selection, location patient-slot capacity, patient-slot seed authority, atomic
empty-slot fill, patient-slot post-encounter lifecycle, facility-move waiting-slot migration,
generated completed-attempt, instrument
item-response, local template distribution selection, and universal action-result compilers are
available only from `@psychsim/engine/authoring`, not the ordinary browser-facing engine root.

Every encounter-available result is resolved and frozen before play. `EncounterState` records only
whether the result has been revealed; buying it cannot generate or change a clinical fact.
`unknown` or truly unassessed, unrevealed, known absent, subthreshold, present, normal, high, low,
positive, and negative remain distinct. Every compatible case uses the same neutral action
presentation. A patient template supplies only constraints, narrow authored overrides, and reveal
mappings rather than copying global menu or test knowledge. Current `CaseBlueprint` result fields
remain an unchanged compatibility snapshot; the new catalog-instance assembler has no adapter into
that path.

A result is a list of short finding atoms with swappable labels and explicit outcomes. Variable
finding sets declare minimum/maximum positives and required present/absent IDs; they cannot contain
arbitrary code. Diagnosis, medication, context, and template records contribute typed constraints
or separately reviewed game tendencies to the shared finding resolver. Source-supported
associations do not automatically become game-generation weights. Only incompatible reviewed hard
values at the same scope yield a retry-or-quarantine conflict; unaggregated soft values are an
upstream authoring gap, and ordinary conflicting reports remain valid evidence. The browser never
displays classification or point rationale before submission.

Resolved narrative findings expose their outcome directly. The interface renders a glyph and
visible outcome chip such as `Present`, `Absent`, `Positive`, or `Negative`, with grouped row
styling, so a negative result is not conveyed only by muted color or an undifferentiated list item.
The finite Reviewer compiler also pilots bounded background anxiety variation outside the primary
GAD scenario: all threshold-relevant atoms are variable and deterministic selection permits zero
or one positive. The maximum is deliberately subthreshold, does not create an internal diagnosis,
and does not alter the focused rubric. This is current fixture behavior, not the target patient's
complexity ceiling. Under D-171, future background and cross-condition findings may superficially
satisfy another symptom list and remain intact. Symptom cardinality alone neither promotes an
internal diagnosis nor triggers cleanup; attribution, time course, medication/substance context,
required or selected condition modules, and chart uncertainty remain separate. Additional symptom
families still require reviewed generation inputs; there is no global unconstrained symptom
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

The patient treatment reference is deliberately hybrid. It prefers one broad primary authored pathway composed from reviewed option groups: for example, exactly one first-line antidepressant or exactly one first-line psychotherapy, plus proportionate outpatient disposition. For a complex existing regimen, the same concept expands into one complete snapshot transition over entry-targeted operations and new starts: a reviewed route may retain a beneficial anchor, stop or reduce a poorly fitting entry, and add a replacement or adjunct. The baseline and submitted regimens can both meet the broad route while response, tolerability, prior trials, safety, and fit distinguish the better next move. A source-supported combination may add a bonus; a compatible source-silent combination may remain neutral. Medication- and therapy-specific fit modifiers supply swing room inside those families. Reusable redundancy groups and maximum cardinalities prevent multiple equivalent treatments from accumulating rewards. `additionalAuthoredPathwayIds` remains available for truly distinct care routes, while `safetyFallbackPathwayIds` keeps referral/transfer separate from the main plan. A deterministic catalog engine may evaluate a combination outside those authored routes using reviewed catalog rules, but the receipt labels it `engine_inferred`; it cannot masquerade as an authored patient pathway. No transition implies a dose, taper schedule, virtual time, or observed future outcome.

The V2 medication-change payload stores starts and entry-targeted operations only. A focused
reviewed route—not the patient or player—owns explanatory meanings such as replacement,
augmentation, and simplification. Medication classes and memberships are explicit versioned
records. Medication count, a shared free-text class label, or an arbitrary tag never creates a
duplicate-therapy, interaction, contraindication, or parsimony consequence by itself; an authored
route or separately reviewed reusable contributor must support that row. The initial MDD
duplicate-start behavior remains a case-specific compatibility rule until separately migrated.

Knowledge-to-rule promotion is two-stage. An atomic qualitative rule first receives explicit
psychiatrist review of its typed trigger, scope, direction, concern, certainty, exceptions,
rationale, provenance, and explanation with no points attached. Tooling may then attach a
separately versioned `provisional_balance` value from the D-156 bands for Developer/Reviewer play.
Point-only retuning does not change the qualitative review; changing clinical meaning does.
Missing coverage creates a nonblocking diagnostic rather than an inferred rule or penalty. Every
compiled receipt row retains both review layers and its D-159 combination outcome.

Predicates are JSON-safe only: `actionPurchased`, `factKnown`, exact medication
start/stop/continue, `anyMedicationStarted`, bounded `treatmentStartedWithTag`,
`interventionSelected`, `dispositionSelected`, `serviceCapabilityAvailable`, `any`, `all`, and
`not`. There is no arbitrary expression or embedded JavaScript.

## Reference solutions and eligibility

Each case includes database-plan, strong/acceptable alternative, shotgun, and unsafe policies. They are executable and must use only available actions/treatments. “Database plan” is the authored comparison route, not a claim that no other plan could be better. Validators require at least one acceptable path, a safe referral/transfer, accessible required objectives, valid par, and a compatible location. Eligibility further considers lifetime points, facility/location, service fulfillment, every workup objective required by a candidate path, effective formulary/tag availability, intervention capabilities, and disposition capabilities. Validation constructs a baseline clinic for every declared compatible location. A start medication must be stocked, while an existing medication may still be stopped or explicitly continued. External services count as capabilities even when expensive, so the ECG patient is winnable before equipment ownership.

That paragraph describes the current legacy `CaseBlueprint` Player-release gate. D-172 changes the
target patient generator: missing treatment/rubric coverage emits a nonblocking authoring
diagnostic and ticket rather than invalidating or regenerating the patient. Human lifecycle review
may still decline to publish a clearly broken compiled encounter.

The current CaseBlueprint compatibility runtime stores complete resolved CaseInstances in a
facility-wide waiting-room queue after eligibility evaluation. The setting is visible on each
slot; hidden diagnosis IDs, tags, and pool labels are never launcher text. Normal slots remain
unchanged until completion, and the compatibility facility tiers still expose their aggregate
one/two/three slots while Endgame exposes six. This legacy behavior is not the target generated
patient model.

For generated patients, each future persisted slot belongs to one exact physical location and a
hub list can only project those location-owned slots. Normal begins outpatient-only; other
locations unlock through progression. Endgame uses approved templates and Developer may load
approved plus review templates, but both retain exact patient settings and neither mode label
grants resources. D-232 now defines authoring-only per-location capacity and atomic facility-move
proofs. D-233/D-234 define authoring-only empty-slot seed/fill and refill/repeat lifecycle
contracts. SaveData/runtime migration, persistence/orchestration activation, and UI projection
remain separate work; `FacilityDefinition.patientSlotCount` must not be silently distributed or
treated as already migrated.

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

- `references` preserve a findable bibliographic identity, PMID/DOI or stable locator when
  available, publication date and synthesis type, access/review-depth limitation, a
  provider-specific Europe PMC cited-by snapshot, and a concise original abstract-only summary;
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
`DeveloperAttemptReview` currently owns one editable note, the exact immutable compatibility
`CompletedAttempt`, and a normalized snapshot of every option offered and whether it was chosen;
information options also preserve displayed fulfillment and cost. It does not yet accept D-235
generated attempts. A `DatabaseEntryReview` similarly owns one editable note and the exact strict
public-entry snapshot. Local Developer mode persists these records in IndexedDB and mirrors or
downloads them. Portable Reviewer uses a separate assignment-versioned IndexedDB and manual
version-7 export only. One bundle identifies its build kind, assignment, and
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
