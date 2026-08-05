# Architecture

## Cross-thread coordination boundary

`PROJECT_STATE.md` is the durable operational resume point between Codex threads. A repository-local standard-library state machine in `scripts/codex_handoff.py` keeps a gitignored lease for one canonical write-capable thread per worktree and fingerprints branch, HEAD, full Git status, and `PROJECT_STATE.md`. Trusted project hooks may block stale prompts and file-writing tools, but they never stage, commit, push, merge, or resolve clinical content. Git remains the cross-clone durability mechanism; the local lease coordinates only threads sharing this worktree. See `docs/CODEX_THREAD_HANDOFF.md`.

## Shape of the system

PsychSim is a static browser application in a pnpm workspace. Zod schemas form the data boundary, JSON content supplies stable reviewed inputs, pure TypeScript produces deterministic state transitions and point-rule traces, React renders those values, and an IndexedDB repository persists versioned saves.

The Pages artifact also has a thin installation/distribution shell. A stable relative web manifest
and generated icons support iPhone Home Screen installation. Vite injects and emits one
Git-SHA-based distribution record; a browser-only update manager compares the compiled record with
base-relative `version.json` and offers a cache-busting reload only at a safe hub screen. This
infrastructure never enters the pure engine, never versions or clears IndexedDB, and adds no
backend. Offline service-worker caching remains deferred; see
[INSTALL_AND_UPDATES.md](INSTALL_AND_UPDATES.md).

```text
approved JSON catalogs + case/encounter recipe
                 │ Zod parse + reference validation
                 ▼
        content-runtime static bundle
                 │
                 │ clinic/location state + internal seed
                 ▼
 browser-runtime patient composition → frozen encounter + rubric
                                           │
                                           ▼
                               pure encounter engine
                                           │
                                           ▼
                              care points → settlement → receipt
                 │                                      │
                 └──────────────── React UI ─────────────┘
                                      │
                               IndexedDB repository
```

The current prototype still feeds `CaseBlueprint` directly into `CaseInstance`; that is a
versioned compatibility path, not the target authoring boundary. The generated-patient migration is
specified in [PATIENT_GENERATION_ENGINE.md](PATIENT_GENERATION_ENGINE.md).

Authoring prepares the reusable files and recipes consumed by this graph; it does not check in a
finite catalog of resolved encounters. Generalized generation remains deferred until the
finding/condition/intervention/test/regimen/context/policy dependencies and compiler passes exist.
Once enabled, composition occurs deterministically in the browser when a queue slot is filled or
explicitly refreshed, and the complete resolved patient and encounter are persisted before play.

The private authoring database is deliberately richer than the runtime graph:

```text
private notes + authored material + formal sources
                       │
       source-owned, provenance-preserving units
                       │
 candidate bins + topic owners + generated dossiers + gaps
                       │ optional quarantined leads/inferences
                       │ psychiatrist review
 reviewed relationships + distinct Developer opinions
                       │ separate rule and balance review
             reusable qualitative rules
                       │ focused encounter compilation
              small question-bank snapshot
```

This is a compiler boundary, not two competing products. Comprehensive knowledge capture supports
personal audit, reading, and retention. Runtime compilation admits only reviewed,
decision-relevant rules and patient facts, preserving game legibility and bundle privacy.

A future dossier coverage map remains a projection over this graph. It is calculated from existing
source units, evidence links, Developer opinions, review records, and gameplay mappings rather than
stored as a second clinical database. The local workbench requests one entry at a time; Player and
portable Reviewer builds receive neither the map nor private supporting records. An empty cell
means only that the projection cannot currently establish coverage—it never deletes, suppresses,
or downgrades unmatched material.

The local projection may display short speculative source leads or developer-side authoring
inferences when they reuse traceable admitted inputs. Those records sit beside—not inside—the
source-contribution, Developer-opinion, and executable-rule lanes. They retain origin, assumptions,
uncertainty, and a follow-up question, cannot satisfy coverage, and never enter the runtime
compiler. The system does not spend processing merely to populate every empty cell.

There is no linear dossier-wide maturity or approval state. A thin identity shell is useful
database content even when its other lanes are unknown. The local projection derives a compact
summary of identity resolution, source/currentness coverage, accepted Developer interpretation,
individual relationships/rules, and exact game mappings from the canonical records that already
own those facts. Full provenance remains expandable. The author should not manually keep a second
matrix synchronized, and the runtime compiler never asks whether a whole dossier is “complete”; it
validates only the exact reviewed dependencies required by the focused patient. This projection
must first prove useful and inexpensive for one dossier before any broader schema or UI expansion.

## Package responsibilities

`@psychsim/schemas` owns stable IDs, schema/content versions, catalogs, the content registry,
diagnosis families/severity/specifiers, qualitative diagnosis rules, bounded patient composition and
gameplay-critical context dimensions, per-test generators, structured reference intervals,
rule-level review records, patient records, blueprints/instances, declarative predicates, encounter
events, point-report/receipt/settlement models, persistent patient queues, local clinical
tickets/export bundles, developer source requests, clinic/save/flag data, upgrade/decor/facility
definitions, source manifests/documents/chunks, generation provenance, and patient-scaffold
requests. It also owns authoring-only diagnosis-classification releases and terms, compact reviewed
diagnosis-classification bindings, and source-use decisions that separately gate storage,
extraction, local indexing, AI processing, derived clinical content, redistribution, and
commercial use. The additive future-state boundary now includes typed findings, measurements and
tests, internal condition states, separate chart diagnosis entries, independent medication
regimen entries, structured prior trials, reactions, duration, burden, and proposition evidence
without reinterpreting old snapshots. Decision policies, patient templates, frozen encounter
instances, and runtime migration remain later owners. Upgrade
definitions declare kind, point cost, lifetime/facility/department/prerequisite gates, granted
capabilities/formularies, related services, per-use cost metadata, patient-category effects, and
player-facing capability labels. Facility definitions own their locations, default location,
threshold, slot count, and permitted purchases; decor definitions own satisfaction contribution,
display slot, and visual token. The universal information catalog owns neutral menu presentation,
SOAP/source metadata, and service references; patient templates own structured results, narrow
overrides, internal progression-pool classification, and generation constraints. Types are inferred
from schemas except the recursive predicate unions.

The schema package also owns the small reaction-concept catalog, explicit
`PatientReactionHistory`, and versioned `PatientComplexityProfile`. Reaction records keep the
patient/chart `recordedAs` label separate from a nullable reviewed interpretation. The complexity
profile is a transitional encounter-recipe-owned optional-richness envelope, never diagnosis-owned.
It is not a score, tier, progression gate, or economy configuration.

The authoring-only medication-regimen knowledge catalog provides explicit medication-class
identities and memberships, a V2 transition payload made only of starts and entry-targeted
operations, focused route-owned transition meanings, and separate qualitative contributor kinds.
It remains registered with `runtimeIncluded: false`. D-237 adds the first real reviewed topical
records: an exact five-identity MDD initial-antidepressant class, one count-aware focused route, and
an explicit link to the approved diagnosis-owned qualitative rule. D-238 keeps those records
point-free and adds a separate runtime-excluded decision-balance catalog keyed by the route's exact
full rule reference. An attachment compiler decorates the normalized candidate only after
qualitative adaptation, so balance retuning never versions the route or policy.
Generated encounters and runtime activation remain disabled.
Legacy class-label strings are never parsed. Patient state and player selections never own
switch/augmentation/simplification intent, and recognizing a replacement shape never establishes
safe overlap, washout, or cross-taper timing.

The authoring-only decision-policy catalog owns exactly one pinned primary route per focused
policy plus narrow explicit supporting references. It does not duplicate topical medication,
diagnosis, finding, interaction, intervention, or disposition knowledge. Topical adapters expose
point-free reviewed candidates to `compileDecisionPolicy`. The compiler projects the complete
frozen patient into exact typed fact keys, intersects candidates with exact available action
targets, and returns a versioned point-free `CompiledRubric`. The compiled rule retains its
patient/action activation predicates plus exact fact-to-record bindings, so later submission
evaluation never has to reread mutable source content and repeated records cannot be flattened into
an unauditable match. Cross-owner `all` and explicit `same_record_all` are separate operations.
The first adapter is intentionally narrow: it verifies the regimen route's exact diagnosis/rule
owner, copies qualitative stance/concern/certainty from that approved rule, expands only explicit
versioned medication-class memberships, and emits a coarse action-horizon discovery anchor. The
route's recursive count predicate remains canonical and is evaluated separately. Unsupported
lossy anchors fail; tags, labels, aliases, and prose never substitute for relationships.
`same_record_all` accepts unique facts from one record kind only; singleton patient-state domains
and each clinical-context dimension receive distinct deterministic binding identities so shared
container IDs cannot create a false join.
Duration and subjective-burden adapters retain target identity, source modality, time scope, and
the exact ordinal-scale version. A current-regimen tolerability adapter also emits its exact
regimen-entry subject; any candidate that targets a regimen operation must bind that same entry,
so two copies of one medication cannot exchange fit or harm facts.
Missing or unresolved state is never interpreted as a negative; a negative dependency must match
an explicit typed value. A semantic scan and the derived in-memory reverse index must return the
same deterministic candidate set. A supplied index is copied and re-fingerprinted before use; it
is not persisted source truth. Semantically unordered predicate branches, action targets, and
provenance IDs are normalized before serialization. The frozen rubric uses the full 64-bit
compiler-fingerprint suffix as its ID, includes the exact patient-state and action-horizon IDs in
the fingerprint payload, and requires untrusted or persisted artifacts to pass both strict schema
parsing and `verifyCompiledRubricIntegrity`.
Content validation resolves every rule and owner version pin, requires formal contributions to
pass the existing derived-content source-use decision, and rejects an approved policy that relies
on a superseded or retired Developer opinion or on a formal contribution that is not itself
medically approved. The active reference union contains only owner kinds that validation can
currently resolve; future diagnosis-route, intervention, disposition, or template-override
references must arrive atomically with their canonical owner and validator.

`@psychsim/engine` owns top-down diagnosis and decision-policy composition, typed-fact derivation,
conflict reports, constrained patient generation, focused encounter compilation, deterministic
clinical-context/demographic/finding/test variation, service resolution, effective-formulary
calculation, atomic upgrade/facility/decor offers and purchases, deterministic satisfaction
calculation, persistent queue construction/relocation, encounter commands, predicate evaluation,
points-only progression overlays, care-point evaluation, economy, receipts, replay, and
eligibility. Diagnosis composition is qualitative and point-free. It has no React import, browser
global, network call, wall-clock decision, mutable singleton, or runtime AI.

Diagnosis dossiers consumed by the engine remain setting-, difficulty-, and treatment-intensity
independent. A case/encounter recipe (currently planned as `PatientTemplate`) selects setting,
focused decision, condition branches, complexity envelope, and presentation limits. The reusable
MDD dossier can therefore serve later outpatient, hospital, polypharmacy, ECT, ketamine, and other
contexts without duplicated diagnosis knowledge.

Generalized composition is gated by the owner inventory and ordered topology in
[ENCOUNTER_GENERATION_DEPENDENCIES.md](ENCOUNTER_GENERATION_DEPENDENCIES.md). It records current
implementation gaps only; exact ticket state remains in the review catalogs and it is never loaded
by the browser.

`@psychsim/content-runtime` has three explicit entry boundaries. Its ordinary root entry imports
approved JSON only, parses it at module load, supplies the starting clinic, cross-checks imports and
dependency edges against `content/registry.json`, performs semantic reference validation, and
executes reference policies. The local `./developer` entry discovers review patients/tickets and
the tracked source-request queue. The portable `./reviewer` entry imports one finite assignment of
ten named scenario files, their eight schema-parsed provisional decision policies, and one exact
stable-path packet containing one patient-linked ticket per scenario; it never globs a lifecycle
or ticket directory. Validation rejects tickets outside that ten-patient allowlist. A tiny
`./reviewer-assignment` entry owns the assignment identity used to namespace its save database and
export bundles. The normal root index exports none of these reviewer modules. Its pure rule
inspector derives compact review rows from parsed blueprints and catalogs; it does not duplicate
point evaluation or mutate content.

The ordinary root also exports a derived `PublicClinicalCatalogProjection` for the cross-device
Database screen. A strict Zod union and fixed category builder copy only neutral, explicitly
allowlisted fields from modeled conditions, normalized medication identities, nonmedication interventions,
dispositions, shared investigations, test definitions, and formal bibliography records. The
projection is deterministic, read-only, and generated at build time; it does not traverse
`content/registry.json`, expose actual filesystem paths, or persist a second database. Patient
records, case solutions, point values, scoring predicates, medication-fit details, tickets,
private source material, and authoring-only classification terms never enter it. Logical catalog
locators help a reviewer identify a record without claiming access to the Mac or phone filesystem.
The same minimized projection is safe for Player, local Developer, and portable Reviewer builds.
Each entry opens in a dedicated reader. Developer and portable Reviewer may attach a
`DatabaseEntryReview` containing prose plus the exact safe entry snapshot; the Player has no
comment controls. The comment path writes browser storage/export data only and never mutates the
projection. Medication identity records additionally carry the dated RxNorm snapshot warning and
public NLM attribution required for redistribution.

Formal source metadata is static content under `content/catalogs/evidence/formal`, distinct from
private document/database bytes. It covers publications plus structured databases and includes
version/scope fields, access/reuse/AI/local-extraction policy, and validated relationships for
corrections, updates, supersession, companions, and executive summaries. A case or medication
contribution links a cataloged source to exact target IDs and snapshots the citation plus
contribution statement into the rule trace. If no contribution is linked, the engine snapshots
`Expert opinion`. This makes historical receipts auditable without bundling copyrighted source
text or implying that bibliographic verification equals clinical approval.

Evidence precedence belongs in a derived authoring-resolution view, not in static source metadata
or a second global assertion store. The resolver compares source-local contributions and
Developer interpretations addressing compatible questions by question-specific design fit,
bias/certainty, directness/applicability, currency, and correction state. It retains unresolved
disagreement and never turns a source type or publication date into a hidden universal authority
score. The resulting evidence-body view is disposable and traces back to its source and topical
owners. Aggregate sources such as DrugCentral remain authoring-only until their source-use decision
explicitly permits a separately licensed runtime contribution.

The future medication/intervention authoring compiler is also outside the browser runtime. It
combines source-cleared identity and regulatory imports, stable source-local contribution units,
topically owned relationships, separate Developer opinions, and reviewed rule transformations into
the small approved runtime subset.
PsychSim stable IDs remain primary over RxCUIs, UNIIs, application/product IDs, and external
classification identifiers. A generated medication audit may assemble direct and class-level
knowledge for one review page, but it is disposable output rather than a second source of truth.
No source import, label change, or comparative-effect estimate writes a gameplay rule or point
value directly. See `docs/MEDICATION_AND_INTERVENTION_DATA.md`.

The current local-only authoring projection resolves formal contributions and accepted
`DeveloperOpinion` records by their explicit target IDs rather than by the tracked file that owns
the record. This is the compatibility form of the source/topic ownership contract: one reviewed
source unit can appear in every relevant medication and diagnosis dossier without duplication,
while one concrete relationship remains owned by its most specific decision-driving topic and is
reverse-linked elsewhere. The projection is still a disposable, schema-minimized view: neither
fan-out nor an accepted opinion compiles a treatment option, rule, dose mechanic, or point
modifier.

`@psychsim/web` owns presentation, transient UI state, accessibility, local Developer tools, and the
persistence boundary. It may add real timestamps when saving attempts, flags, reviewer notes,
tickets, and Developer attempt reviews; those timestamps never affect clinical behavior. A
`DeveloperAttemptReview` embeds the immutable `CompletedAttempt` plus a normalized snapshot of
every information, medication, nonmedication, and disposition option shown for that attempt,
including displayed service fulfillment/cost and whether it was chosen. This makes free-form
comments auditable even after catalogs change. `DatabaseEntryReview` applies the same immutable
snapshot principle to one review-safe database entry. IndexedDB sits behind `SaveRepository`.

The ordinary Player and local Developer surfaces use `psychsim-local-save`. The portable Reviewer
uses an assignment-namespaced database, forces practice progression, and can reopen every completed
receipt after reload. Its version-7 download contains build kind, assignment identity, engine
version, all completed attempts, case comments and normalized option snapshots, database-entry
comments, flags, and tickets.
Several cases can be reviewed before one manual export. The export is the only cross-device
durability mechanism; there is no sync or import. In local development only, the fixed Vite
middleware mirrors the same schema-validated bundle to
`content/generated/local-review-tickets/tickets.json`; Playwright uses the separate
`tickets.e2e.json` target. The portable Reviewer contains no middleware endpoint, local
ticket discovery, source/opinion queues, or arbitrary file writer. Its only preassigned questions
are the exact finite ticket packet registered for assignment `2026-07g`; responses remain
browser-local until manual export.

The assignment ID is a persistence migration boundary, not merely a label. A material change to
cohort membership, scenario semantics, policy semantics, or intended reviewer content requires a
new ID so prior run history cannot suppress revised patients and exports cannot mix assignment
revisions. The current bundle identifies build kind rather than an exact Git revision; exact
release-commit identity remains a future export enhancement.

`@psychsim/content-cli` is developer-side. It implements validation, reference runs, reverse-impact
reporting, SHA-256 source scanning, bounded PDF/DOCX/TXT/Markdown extraction, source review
listings, controlled patient scaffolding, production-bundle checks, and a before/after ECG
ownership economy report. Its macOS Apple Notes provider is an additional protected intake edge:
metadata audit and explicitly acknowledged sync use the public Notes scripting boundary, local
Vision/PDFKit OCR, per-note checkpoints, and private ignored manifests. It is not imported by the
web app. Extracted records and generation provenance are local and ignored; an intentionally
generated patient scaffold and its blocking audit tickets can be committed under
`content/cases/review`. A source request can name proposed shared impact IDs for ticket routing,
but the compiler keeps those separate from owner-local evidence contributions and never applies
them as rules. The CLI also validates and searches the pinned authoring-only ICD-10-CM catalog and
deterministically reimports it only after verifying the official release-member hash. Those
commands never add the classification payload to `CatalogBundle` or the web app.

Developer-only literature-synthesis proposals are static decision packets, not a second evidence
engine. They link exact ticket, source-request, blueprint, evidence, and source-use IDs; validation
requires source-cleared support and keeps metadata/abstract-only context non-supporting. React may
render the packet only after the local Developer entry is dynamically loaded. The proposal cannot
change a rule, choose point magnitudes, or enter Player/Reviewer production bundles.

A newly referenced publication first receives one stable formal-source record (or a metadata-only
record when rights or access are unresolved). Registration is a landing operation, not
integration: a target-specific source-use contribution and a developer-review ticket are required
before the source can change a diagnosis dossier, medication dossier, patient rubric, rule, or
point value. This keeps a source discoverable immediately without pretending that every possible
downstream use has already been interpreted.

The separate `TicketLiteratureScoutCatalog` is an earlier discovery layer. A developer-side CLI
queries Europe PMC for one bounded ticket question, records the exact ten-year query, provider
citation snapshot, rank, and hashes, and keeps raw API responses under ignored
`content/generated/literature-scout/`. Tracked references contain only concise original
abstract-only paraphrases plus enough bibliographic identity and a stable locator to audit the
paper independently. The packet names the access/full-text limitation and never promotes
abstract-only context to full-text support. Validation requires every active checked-in Developer
ticket to have profiles or an explicit exemption. Only the dynamically loaded local Developer
module imports the catalog; Player and portable Reviewer builds do not. No browser network call,
runtime AI, rule mutation, or evidence approval results from scouting.

## Source-rights and diagnosis-classification boundary

Bibliographic metadata, lawful processing, medical review, and runtime inclusion are independent
gates. `EvidenceSourceDefinition` describes a source; `SourceUseDecision` records what PsychSim may
do with it; rule-level contributions and clinical review determine whether derived behavior may
execute. A blocked or absent rights decision permits metadata only. See
[SOURCE_USE_POLICY.md](SOURCE_USE_POLICY.md).

`content/catalogs/diagnoses/classifications/` is an authoring-only namespace. Its tracked FY 2026
ICD-10-CM F01–F99 release manifest pins dates, source hashes, importer version, term count, and
normalized output. The generated code-title cache is gitignored and retained only in the local
workspace under its narrow U.S. fair-use decision. Registry entries are `runtimeIncluded: false`,
bundle-safety checks reject the directory and its stable term IDs, and the payload is absent from
`CatalogBundle`.

A playable `DiagnosisDefinition` may carry only compact reviewed bindings containing a
classification release ID, code, mapping relation (`exact_match`, `broader_than_code`,
`narrower_than_code`, or `related`), note, and review record. Label similarity and file order never
create a mapping. A binding supplies neither criteria nor treatment guidance.

The source-specific notice controls when a landing page and a document disagree. Page iv of the
official 2024 WHO CDDR PDF identifies that work as CC BY-NC-ND 3.0 IGO and prohibits adaptations
without permission, despite the publication page linking a generic ShareAlike deed. The separate
ICD-11 digital classification/API is also NoDerivatives. CDDR and DSM-5-TR therefore remain
bibliographic metadata only: neither source's text enters source folders, prompts, fixtures,
generated content, or runtime data without written permission.

The current classification schema is deliberately ICD-10-CM-specific. A future ICD-11
exact-identifier catalog must use its own URI-bearing schema so code, title, and WHO URI remain
together as required by the API terms. It must receive a separate source-use decision and cannot
reuse the ICD-10-CM importer or imply permission to derive diagnostic rules.

## Static content flow

Content moves through `blueprints → drafts → review → approved → deprecated`. The ordinary Player
artifact imports only `content/cases/approved`. The local Developer entry may discover schema-valid
review files. The separately flagged portable Reviewer artifact is a distribution exception for
review, not a lifecycle promotion: it imports only the ten exact scenario IDs and paths in its
assignment allowlist plus the one exact assignment-ticket path, and every compiled rule remains
medically unreviewed. The registry records where content lives but never overrides an entry
allowlist. Validators cover schemas, references, eligibility, provenance, reference policies, and
all compiled Reviewer scenarios. Bundle scanning rejects every other authoring-only registry
marker; Reviewer mode relaxes the scanner only for those exact registered paths.

The initial prototype has a temporary distinction: its lifecycle placement is approved for bundling and playtesting, while `medicalReviewStatus` remains `unreviewed`. The UI always shows that status. A future clinical approval workflow must add reviewer metadata before content can claim medical approval.

## Deterministic instantiation and replay

`instantiateCase(blueprint, seed, catalogs)` hashes `blueprint ID + seed + stable generator ID`. It resolves only declared choice, catalog-choice, weighted-choice, integer/decimal range, text-template, reviewed clinical-context options, constrained finding selection, and per-test generators. No arbitrary code and no `Math.random` are allowed. Clinical-context options are critical: the selected option and its tags are saved, and its present/absent bindings are materialized into the same structured findings a player can reveal. Cosmetic variants cannot change those rules. Criteria-bearing finding sets declare minimum/maximum positives and required present/absent IDs. A test definition chooses the highest-priority matching profile from declared age, sex-for-reference, diagnosis, and resolved clinical-tag context. Unspecified numeric values may vary only inside catalog-defined normal or mild incidental ranges and cannot change the rubric. Results retain UCUM units, structured low/high interval bounds, source/population labels, and derived normal/high/low interpretation. Every test definition also declares a point-free structured result contract: numeric and categorical panels distinguish fixed from patient-defined components, binary tests enumerate lawful outcomes, and imaging/electrical studies use patient-owned structured findings. The contract describes shape only; patient state owns critical abnormalities and overrides, reveal actions own presentation and cost, and scoring separately owns relevance. D-276 gives compatibility narrative findings an optional versioned status-versus-qualified-value envelope; a qualified value records availability and interpretation separately, and neither displayed text nor interpretation creates truth or points. D-277 gives medication-related compatibility findings an exact validated link to their containing regimen or prior-trial record, preserved through instantiation without parsing labels or prose. D-278 adds one sparse typed patient-reported-benefit record for an exact current regimen entry. Record existence means the medication was assessed; `none`, `partial`, `substantial`, and assessed-but-`unknown` remain distinct, while a missing record has no inferred meaning. Its exact record, source instance, time scope, and medication subject survive normalization and deterministic reveal. The saved CaseInstance stores the internal seed and every resolved value; the UI never displays the seed.

D-279 reuses the separate typed medication-tolerability owner in compatibility patient/scenario
state. It validates one exact current-regimen or prior-trial subject and projects `unknown`,
`absent`, or `present` as an independently interpreted qualified medication-effects result. It
neither infers causality nor activates a source-rate profile.

D-280 adds a separate sparse medication-change temporal relationship. It names one exact current
regimen entry, a started/increased/reduced/stopped change, one exact separately owned canonical
finding, categorical observation, or compatibility finding, both time scopes, a source instance,
and only `change_before_target`, `change_after_target`, or `uncertain`. Native patient state rejects
compatibility targets; compatibility case validation resolves the exact action/finding coordinate
and requires any projected result to retain the same regimen subject. The first review-only
projection identifies aripiprazole rather than presenting an unattributed “dose increase.” It
adds no dose amount, causality, diagnosis, generation probability, rule, or points.

D-281 adds one independent sparse current-medication dose-position record. It retains an exact
regimen-entry subject, `below_maximum`, `at_maximum`, or assessed-but-`unknown`, one source
instance, and one time scope. Its authoring context owns any medication-specific maximum; the
record contains no amount, unit, schedule, adequacy, or treatment conclusion. Exact same-record
decision facts and a closed structured-reveal lane make it usable by future reviewed policies
without parsing prose. The compatibility proof is synthetic and assessed-unknown, so checked-in
patient content is unchanged.

D-282 adds a standalone instrument-administration authoring boundary without widening D-220's
neutral item definitions. An exact administration definition owns its instrument version, action,
respondent, time, rights coordinate, item set, and nullable lawful raw-total range. One
administration record then pins a patient state, source instance, exact completed item-response
references, explicit missing items, completeness, and an optional already-authored bounded raw total. The
boundary rejects crossed owners, duplicate or incomplete item partitions, interpreted item
responses, and a total on a partial administration. It calculates and interprets nothing and is
not yet attached to the generated-patient or action-result pipeline.

D-283 adds the standalone authoring compiler and replay proof for that record. Its request embeds
the complete exact D-220 artifact rather than accepting loose responses. The compiler derives the
patient and administration identities, admits complete D-220 responses, treats only an exact
`response_not_resolved` evaluation as an explicitly missing administration item, rejects all
other structural coverage failures, and freezes normalized input/output fingerprints. It remains
outside the D-194/D-213/D-214 attachment chain and cannot establish that its opaque source
instance or rights boundary is authorized for runtime use.

D-284 adds a separately verified presentation-safe projection of one D-283 artifact. The strict
view retains hidden patient/administration identity, action and exact definition versions,
respondent/time/opaque-rights coordinates, complete/partial status, item counts, and the authored
raw-total state. It redacts source-instance identity, item identities and responses, lawful range,
definitions, compile request, fingerprints, diagnostics, labels, wording, and interpretation.
Partial administrations cannot expose a calculated total, and integrity verification reprojects
the exact D-283 artifact instead of trusting caller-authored summary fields. This view remains
authoring-only and is not yet attached through D-194, D-213, D-214, `PatientInstance`,
persistence, or runtime.

D-285 adds a standalone admission proof before any runtime schema changes. One frozen attachment
context declares the exact patient-state ID, finite action horizon, and D-214-compatible safe item
responses. Its current `2.0.0` compiler accepts only D-293, uses the wrapper's derived D-284
projection, requires exact patient/action equality, and matches every included item response to
its exact safe D-220 projection. The context is normalized, fingerprinted, frozen, and replayed.
It remains a future catalog-compiler input seam rather than a `PatientInstance`, result binding,
source-credibility proof, or rights decision.

D-286 removes the remaining free-standing-context trust at the catalog boundary. Its current
`2.0.0` adapter verifies one complete D-194 catalog snapshot and D-293 source-validation wrapper,
requires the wrapper's embedded D-283/D-220 artifact to equal the snapshot's retained D-220
artifact, derives D-285's context only from the snapshot, and freezes the complete
snapshot/D-293/D-285 relationship with replay. It rejects raw D-283, does not mutate the snapshot,
and does not advance any runtime schema version.

D-287 closes the equivalent identity/seed seam for D-273 without activating presentation content.
One authoring-only adapter verifies the complete D-194 catalog snapshot, derives the exact
patient-state ID and seed from its `PatientInstance`, accepts only a reviewed launcher profile and
the exact referenced name pools and complaint banks, and delegates all normalization and draws to
D-273. Its fingerprinted wrapper proves the snapshot-to-presentation relationship on replay. It
does not mutate the snapshot or attach presentation to `PatientInstance`, D-200/D-235, queue
slots, persistence, runtime, or UI.

The point-free shared-finding compiler separates atomic patient facts, assessment responses, and
surface wording. It accepts exact version-pinned candidate values from upstream generators,
resolves each finding definition once, and retains every applied, superseded, compatible,
unreviewed, or conflicting candidate in an audit trace. It does not choose clinical probabilities
or combine raw weights: upstream reviewed generation profiles must first turn those inputs into
frozen candidates. A versioned reveal projection explicitly maps one or more applicable resolved
findings or proposition-evidence claims to an action- or instrument-owned response; a separate
expression bank supplies stable wording variants for unstructured history. The resolved
projection, all contributor IDs, and selected variant are frozen before play. Patient phrases may
overlap across different source facts, but canonical aliases remain identity-equivalent and
globally unique. Neither string matching nor displayed wording may activate diagnosis, treatment,
or point logic.
Current report, historical report, collateral, records, MSE/physical observation, and standardized
response remain independently resolvable when they can disagree. Their discordance is retained
rather than treated as a generator conflict or assigned an inferred explanation. Add these scope
combinations only when input content needs them; until the future typed scope boundary exists,
consumers enumerate stable IDs and never parse scope from their spelling.
An explicitly modeled adjudicable proposition adds a separate hidden-truth and patient-scene
evidence path. The proposition resolves true or false before play. Patient, collateral, record,
examination, and test claims then resolve separately from explicit conditional claim-generation
profiles and retain shared-origin or dependency links. Exact copies cannot become independent
corroboration, and correlated claims cannot be naively multiplied or majority-voted. A reported
false proposition is not itself a delusion: belief state, belief appraisal, and clinical
interpretation remain separate. The complete path is frozen before play and later reconstructs
`proposition → evidence claim → dependency handling → reveal projection`; purchase only reveals
it. This patient-scene evidence layer is unrelated to the formal literature-evidence catalog.
The generator does not require the evidence corpus to converge on hidden truth. Persistently
ambiguous or misleading evidence is valid state, not a retry condition; broad/unspecified
diagnosis and conservative coverage routes belong in diagnosis and decision-policy scoring rather
than a generic winnability validator.
The additive schema foundation implements strict latent propositions, source evidence, structural
generation-profile ownership, shared-origin and correlation groups, belief appraisal, and one
narrow `ResolvedPatientPropositionState` envelope. The shared-finding pass can now consume that
frozen state for explicit source- and time-scoped projections without counting claims, assigning
credibility, or requiring convergence on hidden truth. Embedding its output in the complete
generated-patient and encounter records remains a later dependency, and the compatibility
`CaseInstance` path is unchanged.

The presentation layer remains an additive point-free boundary. Runtime-excluded expression banks
hold wording variants; explicit reveal projections pin exact finding/proposition and expression
bank content versions, filter proposition evidence by typed source and optional time scope, and map
those sources to action/instrument responses. A compile request supplies an exact projection
horizon. D-220 supplies the separate neutral instrument/item owner and compiler that materializes
exact item responses from those frozen projections without fabricating instrument metadata. D-221
makes D-194 derive and run that compiler, then routes its exact responses through D-213/D-214 while
freezing only a presentation-safe redaction in the patient instance. Frozen projection records
retain all matching backend IDs, the selected wording version, a stable input fingerprint, the
exact projection-horizon ID, and compiled provenance. Wording selection is scoped to the seed,
projection, bank version, and matched source IDs so unrelated compiler inputs do not reroll it. No
string matcher or alias resolver can create a mapping. Real instrument definitions and projection
content, generated-instance persistence, and compatibility migration remain disabled.

The additive catalog-instance boundary freezes those structural products without activating real
generation. An `attachment_only.v6` `PatientTemplate` pins the focused decision, policy, exact
horizon IDs and payload fingerprints, location versions, one exact care setting, condition
constraints, and one exact `universal-action-result-assembly.v3`. Catalog-instance compiler
`9.0.0` first requires one complete D-219 operational-admission artifact for that exact template,
physical location, focused action horizon, and universal information-action catalog. It then runs
D-193 with any exact D-258 D-201-backed patient-report projection slots, inserts any
definition-addressed finding duration/burden records, applies verified D-217 source selection
through D-215, derives one complete D-220 response artifact, resolves D-240
target-scoped values against the final patient truth, compiles one complete D-213 `3.0.0`
artifact, derives frozen result bindings plus presentation-safe structured views, instrument
responses, and target-redacted D-240 reveals, compiles D-191, and atomically emits a `PatientInstance`,
`EncounterInstance`, and verified snapshot. Every internal condition is bound through one required
or selected optional template condition with matching provenance. The snapshot embeds the complete
D-219, D-217, D-215, D-220, D-240, and D-213 audits and fingerprints every patient, horizon,
location, derived result, rubric, seed, and compiler attachment. The containing D-200 audit
composer is `27.0.0`. It remains synthetic and
runtime-excluded: no case adapter, save migration, queue behavior, new probability draw, scoring,
or browser import exists.

The first real D-259 projection content remains on the same authoring side of this boundary.
`content/catalogs/findings/projections.json` contains the explicit 17-finding compact
depressive-symptom assessment mappings, including D-256 closed negatives and nonsafety
subthreshold-to-present display mappings. It is registry-tracked but `runtimeIncluded: false`.
The ordinary content-runtime root does not import it; only authoring validation and a later exact
compiler request may consume it before minimized generated results are frozen.

D-260 adds the corresponding checked-in set and routing owners without weakening that isolation.
`projection-horizons.json` pins all 49 exact projection versions and the one lawful action target;
`universal-action-result-assemblies.json` pins the current shared action payload and declares only
the existing `finding_projections` source class. D-213 therefore receives every frozen projection
for that action without a content-level filter. Both files remain authoring-only and are
cross-validated against the shared action and projection catalogs.

D-261 version-pins the duration semantic owner across compatibility generation, resolved and
deferred patient state, and D-240 definitions. Full authoring audit retains the exact profile
ID/version; the browser-safe reveal remains profile-redacted. A stale profile version cannot
silently match a current definition.

D-262 adds the first runtime-excluded reusable duration content. The duration catalog owns one
reviewed current-MDD profile with neutral at-least-two-week options and no weights or inference
logic. A second static universal assembly combines the exact Presenting problem and timeline
payload with the compact Depressive symptoms payload: D-240 supplies the former and D-193/D-256
supplies the latter before D-213 routes both. The formal NIMH locator stays in the
authoring-only Developer-opinion evidence relationship rather than entering the runtime diagnosis
dossier. No browser entry imports either the profile catalog or the assembly; a later exact
template/compiler request must freeze the minimized results first.

D-263 adds that exact authoring-side selection seam. The condition-duration resolver accepts one
reviewed profile and exact condition/source/time coordinate, derives one stable unweighted draw
from the internal seed, and emits one replayable artifact containing all offered options plus the
complete resolved duration. Canonical sorting makes content-array order irrelevant. The resolver
exports only from `@psychsim/engine/authoring`; the ordinary engine root, content-runtime root,
browser bundles, persistence, and D-200/D-194 attachment remain unchanged.

D-264 adds the next authoring-side composition seam without widening either upstream owner. It
replays one complete D-208 artifact plus every supplied D-263 artifact, requires the exact composed
patient identity and unchanged condition payload, rejects repeated or preexisting
condition/profile owners, and emits either the unchanged zero-resolution state or one new
fingerprinted state with the exact sorted duration records appended. The complete attachment
request and all upstream references remain frozen for replay. The export stays confined to
`@psychsim/engine/authoring`; D-200/D-194, runtime content, persistence, and browser bundles still
cannot consume it.

D-266 makes that consumption explicit without changing D-194. D-200 `23.0.0` owns one nullable
D-264 field: null keeps the existing D-208-only route, while a non-null value is fully replayed,
must embed the exact D-208 artifact under the retained D-223 root, and must share D-233's patient
seed across every D-263 resolution. Only the verified resulting patient state is passed through
the existing D-194 `9.0.0` base-state input; D-208 still owns condition bindings and D-210
applicability. The D-200 artifact retains the full optional D-264 proof and replays the complete
chain, so a duration-bearing D-194 request cannot silently outlive or switch its source. D-240
then sees the frozen condition duration during its ordinary final-state pass. This remains an
authoring-only integration with no profile selection plan, new draw, complexity charge, runtime
content, persistence, or UI.

D-265 adds a separate authoring-only demographic identity boundary rather than extending cosmetic
variant pools or rewriting historical patient snapshots. `race-ethnicity.json` pins the 2024 OMB
SPD 15 minimum category set, combined multiselect collection semantics, exact evidence/source-use
owners, and an accepted Developer-opinion guardrail. `ResolvedPatientDemographicsV3` stores the
exact standard version and either a self-identified category set, not-recorded state, or declined
state; the existing v2 remains valid. Provided categories may enter the typed decision-fact index,
but no current policy consumes them. The ordinary content-runtime entry, browser persistence,
PatientTemplate compiler, and UI do not import or generate this catalog. Future epidemiologic,
reporting, or pharmacology adapters require separate source- and scope-specific owners and may
not infer race/ethnicity from name pools.

D-267 adds a second deliberately standalone authoring seam for condition-attributed functional
impairment. The new profile and resolver live in schemas plus `@psychsim/engine/authoring`; they do
not enter the ordinary engine entry, content-runtime, browser, persistence, or composed patient
pipeline. One reviewed, versioned profile can offer unique qualitative
`none`/`mild`/`moderate`/`severe` levels for one exact diagnosis. The resolver binds it to one exact
condition/source/time coordinate, canonicalizes its finite horizon, makes one replayable
unweighted synthetic selection, and freezes the full proof. No real profile is checked in yet.
This preserves a later exact attachment seam without conflating impairment with subjective burden
or the existing coarse functional-impact finding, and without answering the pending MDD severity
question through architecture.

D-289 adds only the next exact structural seam. One authoring-only attachment compiler verifies
the complete D-208 composition and every D-267 replay artifact, requires each artifact to target
the exact composed patient and one unchanged included condition, normalizes unique
condition/profile assignments, and freezes the resulting record collection plus complete
fingerprints. It deliberately does not create a replacement `ResolvedPatientState`; the
impairment records remain beside the exact D-208 state until a later versioned patient/result
attachment is reviewed. This adds no real profile, source-instance proof, information result,
severity mapping, complexity cost, clinical rule, point value, persistence, runtime, or UI.

D-290 adds the presentation-minimization seam without crossing that attachment boundary. Its
authoring-only projector first replays the complete D-289 artifact, then returns only the exact
patient-state ID and a stable-ID-ordered collection of resolved impairment ID, qualitative level,
source kind, and time scope. It redacts diagnosis and condition targets, profile and option IDs,
source-instance identity, and deterministic-generation audit. Integrity checking reprojects from
the original D-289 artifact rather than trusting caller-authored values. The projection is not an
information-action result, `PatientInstance` field, D-213/D-214 binding, persisted record, or
runtime input.

D-291 supplies the missing structural authority behind opaque patient-scene source IDs. One
versioned source-role definition owns only a stable ID, content version, and closed source kind.
The authoring compiler binds a canonicalized definition horizon to one exact patient state,
derives deterministic opaque instance IDs, freezes complete request/payload fingerprints, and
replays the result. A reusable validator checks only exact patient ownership, instance existence,
and source-kind equality. It does not derive a horizon from downstream references and gives no
source credibility, accuracy, independence, report behavior, action availability, clinical
meaning, probability, point, persistence, or runtime authority. No real source-role content is
checked in yet.

D-292 applies that authority only to the detached functional-impairment seam. It independently
replays D-289 and D-291, requires both to name the same patient, validates every D-267 source
instance and kind through the D-291 horizon, and then derives rather than accepts the strict D-290
projection. The fingerprinted wrapper retains exact upstream references and one minimized source
binding per impairment. Empty impairment and source collections remain valid. It does not mutate
patient state, attach an information result, add a real source definition/profile, or give source
references accuracy, credibility, action, clinical, scoring, persistence, or runtime semantics.

D-293 applies D-291 independently to D-283 instrument administrations. It replays the
administration and source horizon, requires exact patient equality, validates the respondent
instance and patient/collateral/clinician kind, then derives rather than accepts D-284. The wrapper
preserves complete and partial administration semantics and exact fingerprints, but remains
separate from runtime attachment. D-296 makes it D-285 `2.0.0` and D-286 `2.0.0`'s only
administration input, so both admission proofs retain and replay respondent-source validation
instead of accepting raw D-283. This does not establish instrument rights, source reliability,
score calculation or interpretation, action binding, patient/runtime state, persistence, or UI.

D-294 applies the same structural authority to D-264 condition-duration attachment. D-264 may
derive a new composed patient-state ID after adding duration records, so the D-291 horizon must
match the exact base patient-state ID already named by every replay-valid D-263 resolution. The
adapter validates the source instance and kind for only the newly attached records and retains the
changed composed-state ID/fingerprint separately. It creates no D-240 projection, information
result, duration threshold, diagnosis inference, scoring, persistence, or runtime attachment.

D-295 closes the historical duration integration bypass rather than creating another patient-state
owner. D-200 `24.0.0` replaced its nullable raw D-264 input with the nullable D-294
source-validation artifact. Null remains the byte-for-byte D-208-only route. For a non-null input,
D-200 first replays D-294, derives the embedded replay-valid D-264 attachment, checks its exact
D-208 root and D-233 patient seed, and only then supplies the resulting state to unchanged D-194
and D-240 compilation. The D-200 artifact retains and fingerprints the whole D-294 request,
source horizon, bindings, and D-264 payload, so historical verification no longer depends on a
bare source-instance string. This remains authoring-only and adds no real source definition,
duration profile, probability, threshold, clinical meaning, persistence, runtime activation, or
UI.

D-268 resolves only that qualitative MDD policy. `DiagnosisDefinition.severityAxis` now separates
internal severity composition from player diagnosis selection. The MDD axis is `family_only` and
owns one reviewed `highest_qualitative_level` policy requiring both symptom severity and
condition-attributed impairment. Its level records remain source-disabled, so the policy is inert
until exact upstream values and boundary profiles exist. Encounter and content validation reject
player-submitted severity qualifiers for such an axis.

The MDD dossier also owns a reviewed, player-selectable identity shell for
`specifier.mdd.psychotic-features`; this does not create a psychosis detector, finding mapping,
case route, or UI. The ordinary diagnosis picker therefore continues to submit family-level MDD.
The approved Developer opinion and separate CANMAT relationship preserve which portions are
source-supported versus game-authoring judgment.

D-269 adds only the standalone authoring proof for applying that policy to two already-resolved
same-episode inputs. `ResolvedConditionSymptomSeverityInput` is a compact, exact upstream-owner
envelope: it carries the patient/condition/diagnosis/clinical-state/time coordinate, qualitative
level, owner version, and payload fingerprint, but deliberately does not claim how symptoms or an
instrument produced that level. The second input is the complete D-267 artifact and must pass its
native replay verifier.

`deriveConditionEpisodeSeverity` verifies the exact coordinate and approved diagnosis-owned policy,
then returns the higher qualitative level with `attachmentStatus: derived_descriptor_only`. Its
artifact freezes the normalized request, minimized policy projection, both input IDs and payload
fingerprints, input/payload fingerprints, and complete deterministic replay. It has no random draw
and does not map the descriptor to a diagnosis severity ID. The compiler remains available only
through `@psychsim/engine/authoring`; the unresolved symptom-severity owner, real impairment
profile/attachment, enabled level mapping, resolved-patient attachment, and runtime path remain
separate gates.

D-297 advances that standalone compiler to `2.0.0` without changing the qualitative algorithm.
The request must now carry one independently compiled, replay-valid D-291 source horizon for the
same patient. D-269 validates that D-267's opaque impairment source exists in that horizon with
the exact recorded kind, and its artifact retains the horizon reference and validated binding. A
raw D-267-only request is rejected. This direct standalone proof complements rather than replaces
D-292's post-D-208 collection adapter and adds no source credibility, real content, severity
mapping, patient/result attachment, persistence, runtime, or UI.

D-298 closes the equivalent standalone structural gap for D-240 without altering the established
result pipeline. One authoring-only adapter independently replays D-240 and a same-patient D-291
horizon, reconstructs every complete action/record/frozen-value source binding from D-240's own
cross-links, and validates exact source existence and kind. D-315 advances both owners to `2.0.0`
so the same path also accepts condition-attributed functional impairment already present in final
patient state. Its safe value omits target, profile, option, generation audit, and source-instance
identity; D-298 retains and validates the exact hidden source instance in authoring audit. It
carries only D-240's target-redacted frozen reveals forward. D-194, D-213, and D-214 remain
unchanged and do not consume the validation wrapper; a later integration would require its own
versioned decision. The wrapper adds no source reliability, action availability, clinical
semantics, persistence, runtime, or UI.

D-299 provides the corresponding standalone proof for D-215. It independently replays one
structured source-report artifact and one same-patient D-291 horizon, reconstructs each exact
profile/version/definition/projection/source binding, and validates source existence and kind.
The wrapper retains D-215's detached D-212 recipes but does not select behavior or feed them into
D-194/D-213/D-214. A later integration would require a separate compiler-version decision; D-299
itself adds no source reliability, report semantics, persistence, runtime, or UI.

D-300 advances D-291 to `2.0.0` so the opaque source-role instance ID is derived from the exact
source-definition ID/version/kind rather than the future patient-state ID. This lets reusable
D-215/D-217 profiles name a stable role. Patient ownership does not move into static content: the
D-291 horizon and each instance still name the exact patient, and every validator rejects a
crossed patient before resolving the role. D-299 additionally freezes the exact definition
reference behind each validated profile binding. The same role ID in two patient horizons is
therefore reusable identity, not shared patient evidence.

D-301 adds a standalone audit at the composed patient-state boundary. It independently replays
D-208 and D-291, requires the horizon to belong to the exact composed state, and validates every
opaque source reference currently carried by that state. D-304 advances the validator to `2.0.0`
and replaces the three remaining flat measurement/observation/test source IDs with typed
`PatientStateScopedSource` records. Every current lane now requires exact patient, source-instance,
and source-kind equality while retaining the exact definition found in D-291. The wrapper remains
outside D-200, D-194, D-235, persistence, and runtime.

D-302 closes the equivalent standalone source-reference gap for D-193 finding-report projections.
It independently replays the exact shared-finding request/output and a same-patient D-291 horizon,
then validates every projection carrying a D-258 `sourceReportSelection`. Each audit binding
retains the exact source role plus the originating slot, selected base-or-modifier projection,
time scope, claim origin, dependency groups, and optional D-201 complexity trace. Projections
without that selection require no source entry. This remains detached from D-200, D-194, D-235,
persistence, and runtime, and it adds no credibility, report-correctness, clinical, or scoring
meaning.

D-303 supplies the first checked-in input horizon for D-291 without activating generation. The
runtime-excluded `PatientSceneSourceDefinitionCatalog` contains stable identity/kind-only roles for
patient report, two distinguishable collateral reports, current and outside record review,
clinician observation, standardized-instrument response, direct measurement, laboratory result,
and diagnostic-study result. The registry and authoring validator require exact membership,
stable order, closed-kind coverage, and no dependencies that could imply inherited clinical
authority. The ordinary Player and portable Reviewer entries do not import the catalog. A later
authoring orchestration may compile these definitions for a patient, but catalog membership alone
does not mean a source is available, obtained, truthful, independent, or clinically meaningful.
D-305 adds the authoring-only catalog adapter: it fingerprints the exact catalog, derives rather
than accepts D-291's definition array, and freezes the nested patient-bound horizon for
deterministic replay. The adapter is exported only through `@psychsim/engine/authoring`; it does
not make the catalog or horizon part of Player/Reviewer runtime.

D-306 adds the next detached test-result seam. One exact numeric `TestDefinition`, typed patient
context, internal seed, reference-interval horizon, time scope, source-role reference, and complete
D-305 artifact compile into one fingerprinted `StructuredTestResult`. The compiler reuses the
existing profile matcher and numeric generator rather than duplicating range or probability
logic. Test, selected profile, interval owner, source role, complete request, and output all remain
replayable. It is available only from the authoring entry and is not wired into patient state,
action-result assembly, generated snapshots, persistence, or browser runtimes. Patient-owned and
case-defining test results remain separate exact-content paths.

D-307 defines that separate exact-content path without putting clinical payload in the compiler.
One versioned patient-owned result profile owns only a test-bound numeric, categorical, binary, or
structured-finding payload plus source-use and review metadata. The authoring compiler binds it to
one exact patient, time scope, and D-305 laboratory/diagnostic source role, validates the ordinary
test-result envelope, and freezes full replay. No real profile catalog or template selection is
activated yet; the current eight-definition proof uses synthetic test fixtures only. The artifact
remains outside resolved patient state, action results, persistence, and runtime.

D-308 supplies the corresponding detached measurement-value seam. One versioned patient-owned
profile references an exact `MeasurementDefinition` and owns only its numeric value, display value,
allowed context values, source-use references, and review state. The authoring compiler binds that
profile to one patient, time scope, and D-305 direct-measurement role, takes units from the
definition, validates the ordinary measurement envelope, and always emits `not_interpreted`.
Synthetic fixtures prove all nine checked-in measurement definitions, but no real profile,
generation distribution, range, height/weight/BMI derivation, interpretation, template selection,
patient/action attachment, persistence, or runtime path is activated.

D-316 adds the narrow mathematical relationship that D-308 deliberately omitted. One
runtime-excluded `BodyMassIndexDerivationDefinition` pins the exact cm-height, kg-weight, and
kg/m2-BMI definition versions. Its authoring compiler accepts explicit height and weight record
IDs from one replay-valid D-310 collection, retains both complete inputs, and emits a detached
uninterpreted BMI value with deterministic replay. It does not choose among repeated records and
does not fabricate a patient-scene source, time scope, or resolution owner. A separate future
attachment must own those semantics before the value can enter patient state or an action result;
ranges, body habitus, clinical tags, rules, and points remain outside this seam.

D-317 supplies that provenance shape without supplying attachment authority. It extends only
`ResolvedMeasurement` with a `derived_measurement` source and paired
`deterministic_derivation` resolution, then materializes one D-316 BMI into that common shape.
Both layers retain the exact derivation definition and ordered input-record IDs; the source also
pins the D-316 artifact payload. The materialized record uses the explicitly selected weight
record's time scope and remains `not_interpreted`. D-301 rejects derived records because its
authority is limited to D-291 patient-scene sources, and D-310 remains direct-result-only. A later
owner must validate and attach D-317 explicitly.

D-318 supplies that exact noncyclic attachment owner by advancing D-311 to `2.0.0`. One attachment
still starts from the exact empty-lane D-208 root and one replay-valid D-310 direct-result
collection. Optional D-317 BMI materializations are accepted only when each nested D-316 request
contains that same D-310 artifact in full. D-311 replays every materialization, rejects crossed
collections, duplicate artifacts, record collisions, and lane overflow, then appends the derived
record beside the canonical direct inputs while retaining explicit materialization references.
It never changes or recursively rebuilds D-310. D-312 can carry the resulting measurement lane
through its existing common-root assembly, while D-301 remains the independent audit for
patient-scene-sourced records only. This adds no action-result choice, interpretation, range,
body-habitus inference, runtime activation, persistence, or scoring.

D-319 confirms that no measurement-specific result framework is required after attachment. The
existing D-213/D-214 direct-measurement path validates the final `ResolvedMeasurement` against
its exact definition and that definition's action relationship, then freezes only a measurement
record reference in the encounter binding. A synthetic end-to-end fixture carries D-318 BMI
through D-312, D-200, D-194, D-213, and D-214 while preserving the complete derivation provenance
in the frozen patient state. No production action mapping, real value profile, range,
interpretation, runtime orchestration, or persistence behavior is introduced.

D-334 supplies the first real checked-in action-result content for that existing route. One
runtime-excluded universal-result assembly pins the exact shared weight/BMI action payload and
exact canonical height, weight, and BMI definitions, then declares only the existing
`measurements` source class. The content validator compares embedded definitions with the
canonical measurement catalog byte-semantically after key normalization, so a stale local copy
cannot silently drift. This closes the action-result mapping gap without generating values:
height/weight profiles, body-habitus observation, interpretation/ranges, persistence, and runtime
activation remain separate boundaries.

D-335 adds the detached value-generation boundary that D-334 deliberately lacks. It parallels
D-306's context-selected numeric generation and D-308's neutral measurement output: a finite
profile horizon chooses by typed patient context and priority, then separate deterministic draws
select a weighted support band and a value within it. The artifact retains exact definition,
profile, band, source-role, draw, request, result, and replay identity. The compiler is exposed
only through `@psychsim/engine/authoring`; no real distribution content or runtime path is added.

D-336 advances D-310 so its existing measurement compilation lane is an explicit union of D-308
and D-335 artifacts. The collection member discriminant records `measurement` versus
`generated_measurement`, while both contribute the same typed resolved-measurement lane. Integrity
dispatch is based on the compilation request shape and replays the correct upstream compiler.
D-320 remains authored-measurement-only until a later exact recipe/resource migration.

D-337 completes that exact migration without merging the two origins. D-320 `3.0.0` adds a
`generated_measurement` member that pins the measurement definition, complete exact D-335 profile
horizon, source role, and time scope. D-324 `2.0.0` audits every referenced profile in one finite
resource set. D-326 `2.0.0` invokes D-335 only from the D-325 patient seed and typed context, then
passes the resulting generated records through D-310 and the existing optional BMI derivation.
An authored recipe cannot match generated output, selected-profile-only matching is forbidden,
and no real distribution or runtime content is introduced.

D-320 closes the next authoring ownership gap without changing `PatientTemplate` or D-311. A
separate `PatientTemplateClinicalResultRecipe` pins the exact full template fingerprint and names
each direct D-306-through-D-309 owner by definition, exact patient-owned profile where relevant,
source role, and time scope. Optional BMI derivation names its exact D-316 definition, output, and
the two recipe-owned input measurement members. The authoring-only compiler requires the supplied
D-310/D-317 artifacts to match those members one-to-one, rejects unowned or ambiguous results,
and freezes the complete binding audit. It does not compile new values, attach the collection to
patient state, or change action, clinical, persistence, or runtime boundaries.

D-321 then makes that ownership unavoidable at attachment. D-311 `3.0.0` accepts D-208 plus D-320
only, derives the direct collection and derived materializations from D-320, and cross-verifies
both the D-208 condition-selection template fingerprint and D-320 full-template fingerprint
against the template retained by the other artifact. Its output keeps an exact D-320 reference
beside the D-310/D-317 audit. This removes a raw caller bypass without activating a real template,
result profile, persistence shape, runtime orchestrator, or player-facing result.

D-322 adds the finite discovery layer above those exact recipes without widening runtime. One
authoring-only recipe horizon consumes the replay-valid mode-template horizon and reports
`bound` or `missing_recipe` for every exact template. Orphan recipes and duplicate exact-template
owners fail; exact resolution uses ID, version, and full template fingerprint. The artifact
retains lifecycle/source-boundary and review metadata for audit, but coverage never becomes
clinical approval, runtime eligibility, result generation, formulary membership, persistence,
or player-visible content.

D-323 makes that discovery layer mandatory for compilation. D-320 `2.0.0` accepts the exact
template and replay-valid D-322 horizon, not a raw recipe, resolves the one exact bound recipe,
and retains the horizon reference before applying its unchanged result-binding algorithm. This
closes a caller-selection bypass while keeping D-311, persistence, runtime orchestration, and
player-visible result routing unchanged.

D-324 adds a compact referential-coverage layer between recipe discovery and those result
compilers. One finite authoring-only resource set lists the exact definitions, profiles,
reference intervals, BMI derivations, and catalog-backed source roles currently available.
The compiler audits every bound D-322 recipe member and retains exact resolved or missing
requirements per template. Missing recipes and missing resources remain distinct diagnostics;
neither changes the mode-template horizon. This layer deliberately does not replace the deeper
D-306-through-D-309/D-316 relationship and value validation, compile a result, or cross the
ordinary runtime boundary.

D-325 binds that referential inventory to one actual selected authoring patient without yet
materializing results. The compiler consumes D-233, D-208, and D-324 only, cross-checks their
exact template and seed lineage, derives the numeric-test context from composed patient state,
and compiles the same-patient catalog source horizon. No caller may substitute a raw seed,
template, context, source horizon, or resource set. Its output is the deterministic context a
later orchestrator can pass to D-306-through-D-309; it is not itself a result collection or a
runtime patient.

D-326 is that narrow authoring orchestrator. Its only input is the replay-valid D-325 context. It
resolves the retained exact recipe and resources, delegates direct values to D-306 through D-309,
delegates canonical collection ownership to D-310, delegates BMI calculation/materialization to
D-316/D-317, and delegates exact template binding to D-320. It does not duplicate those
compilers' contracts or repair a semantically crossed resource merely because D-324 found its ID.
The resulting artifact freezes the complete D-325-to-D-320 chain for replay but remains outside
the ordinary engine root, D-311 attachment, persistence, and runtime.

D-327 supplies the separately versioned attachment orchestration above that artifact. It accepts
D-326 only, derives the nested D-208 composition and D-320 compilation, and delegates their
attachment to unchanged D-311 `3.0.0`. This removes the last caller-controlled pairing at that
seam while leaving D-311's empty-lane, collision, capacity, template, and state-identity logic
authoritative. D-327 remains authoring-only and is not D-312 assembly, persistence, or runtime
activation.

D-328 provides the canonical result-enabled D-312 entry without changing D-312's lower-level lane
contract. It derives the base composition and clinical-result attachment from D-327 and admits
only the existing optional replay-valid D-294 duration and D-292 impairment branches beside it.
D-312 still verifies the common D-208 root and builds the one combined state; D-328 only freezes
the higher-level provenance and rejects caller substitution of its result root. It remains
outside ordinary runtime and persistence.

D-329 advances D-200 to `27.0.0` and closes the remaining result-root bypass. The D-200 request
now carries D-328 separately from its result-free legacy D-312 field. When clinical results are
present, D-200 verifies D-328, requires its nested D-233 authority and D-208 root to equal the
current generation audit, derives D-312 from that wrapper, and fingerprints both artifacts.
Duration/impairment-only D-312 input remains valid, but a direct result-enabled D-312 input is
rejected. This remains an authoring-only provenance integration and does not activate generated
patients at runtime.

D-330 closes the caller-orchestration gap above that chain. One authoring request supplies a
schema-valid composed D-200 request scaffold with no clinical-result attachment plus exact D-324
resource coverage. The scaffold is deliberately not compiled first: its result recipe may refer
to a measurement that D-325/D-326 will materialize. D-330 derives D-325, D-326, D-327, and D-328
from the scaffold's frozen D-233/D-208 root, preserves any result-free duration and impairment
branches, and performs the only D-200 compile after D-328 exists. The retained D-328 and final
D-200 artifacts make the complete authoring chain replayable without admitting caller-authored
intermediate results. This still does not connect generated patients to queues, persistence, or
ordinary runtime imports.

D-331 connects that authoring chain to the existing atomic empty-slot proposal without connecting
it to browser persistence. The D-233 atomic fill advances to `3.0.0`: its direct compatibility
path accepts result-free D-200 only, while its result-enabled path accepts exact D-324 coverage
and derives D-330 internally from the same seed authority and request scaffold. A successful
D-330 final audit becomes the sole frozen waiting patient and occupancy reference. A valid
incomplete coverage artifact creates the existing deterministic blocked-attempt/advanced-ordinal
proposal, while an integrity-invalid artifact is rejected before the attempt. The artifact
retains D-324 and successful D-330 provenance; no partial result orchestration survives failure.

D-309 adds the corresponding detached categorical-observation seam. One versioned profile
references an exact `CategoricalObservationDefinition` and owns only an allowed value ID, display
value, source-use references, and review state. The authoring compiler binds that profile to one
patient, time scope, and D-305 clinician-observation role, validates the ordinary observation
envelope, and emits an empty interpretation list. The real catalog remains empty; synthetic
mental-status and physical-exam definitions prove shape only. No clinical values, interpretation,
generation, template selection, patient/action attachment, persistence, or runtime path is
activated.

D-310 provides one detached collection seam over those four result owners. It verifies every
D-306-through-D-309 artifact, requires exact equality with one patient-owned D-305 source horizon,
retains all upstream artifacts in its normalized request, and emits canonical measurement,
categorical-observation, and structured-test arrays plus a complete member audit. Duplicate
resolved-record IDs fail rather than disappearing; distinct same-definition records remain
separate. The collection is not a `ResolvedPatientState` attachment and is unavailable to ordinary
engine/runtime imports.

D-311 adds the separately versioned authoring-only attachment seam. It independently replays one
successful D-208 composition and one same-patient D-310 collection, requires all three D-208 result
lanes to be empty, and creates a new `ResolvedPatientState` identity by replacing only those lanes.
The artifact retains both upstream objects, their exact fingerprints, the attached record IDs, and
the complete changed state. It does not merge legacy caller-authored arrays, reinterpret values, or
join the changed state to D-194/D-213/D-214, D-200/D-235, `PatientInstance`, persistence, or
runtime. The D-310 source horizon remains scoped to the D-208 base-state ID; the new state ID does
not retroactively rename its evidence sources.

D-312 provides the authoring-only composition boundary for nonoverlapping post-D-208 lanes.
Its current `2.0.0` contract requires one successful D-208 root with empty duration,
functional-impairment, and clinical-result lanes plus at least one exact D-294 duration, D-292
source-validated impairment, or D-311 result attachment rooted there. The assembler copies only
the owned lanes into a new state and retains every complete upstream artifact, source-validation
reference, attached record ID, and fingerprint. This avoids choosing among independently valid
changed-state branches and prevents one branch from silently dropping another.

D-313 advances D-200 to `25.0.0` and makes that exact D-312 artifact its only non-null
post-composition input. D-200 independently replays D-312, requires the same D-208 root nested
under D-223, retains any nested D-294 duration seed in the existing D-233 equality audit, and
passes only the assembled state into unchanged D-194. Null still supplies the untouched D-208
state. The D-200 request and artifact no longer admit D-294 directly, so duration and clinical
results cannot compete as parallel changed-state branches. D-210 applicability remains scoped to
the original D-208 composition, and D-193 may add canonical findings after the assembled base
state.

D-314 advances D-200 to `26.0.0`, adds `functionalImpairments` as a canonical
`ResolvedPatientState` lane, and makes D-292 the only impairment branch D-312 may attach. The
source-validated D-292 records, D-294 durations, and D-311 clinical results now survive together
through unchanged D-194 into the frozen `PatientInstance`; D-200 also includes every nested D-267
draw in its existing D-233 seed audit. The null D-312 route rejects prepopulated post-composition
lanes rather than accepting caller-authored state. D-301 `3.0.0` includes the new source-bearing
impairment lane in its independent exact-source audit. This remains authoring-only and adds no real
profile, probability, display result, persistence, runtime behavior, clinical rule, balance,
point, or UI.

The template also owns one small `presentation-richness.v1` authoring envelope, separate from the
optional-feature budget. It names at least one audited category explaining what makes the focused
decision substantive and records prior-effort expectation as not required, multiple expected
(authored minimum two or greater, no maximum), or a reasoned treatment-naive exception. A pure
evaluator runs against the final frozen `ResolvedPatientState`, enumerates exact IDs and counts
across ten patient-state domains, and counts medication trials, psychotherapy trials, and current
providers once each plus prior levels of care by documented occurrence count. Its fingerprinted
result attaches once at the atomic snapshot root. A shortfall or inconsistent exception is an
authoring diagnostic with `nonblocking` impact; it does not alter findings, conditions, the primary
policy, generation, scoring, persistence, or patient validity.

Optional internal-condition selection is now a separate authoring pass. One standalone
`weighted-template-condition-selection.v1` profile pins the exact template payload and provides
explicit game-only count and candidate weights for every optional group. The pure selector
materializes required conditions and deterministic optional selections without replacement,
retaining selected/unselected traces, stable draw IDs, authored-versus-generated provenance, and
verified fingerprints. Only reviewed literal incompatibility pairs among selected exact template
condition IDs produce a complete reproducible structural-conflict artifact. The selector does not
search, retry, infer a diagnosis, generate findings, or use prevalence or points. Successful
states/bindings satisfy the existing attachment compiler; preserving the selector artifact in a
composed snapshot remains a later explicit composer boundary.

Condition-to-finding materialization is another standalone authoring pass. One
`condition-finding-cardinality.v1` profile pins an exact diagnosis definition, clinical state,
time scope, severity scope, and required specifier subset. Every required outcome, cardinality
group, and member requires approved rule review plus formal-source or Developer-opinion
provenance. Required outcomes always emit exact D-193 `diagnostic_requirement` candidates.
Cardinality groups select a reviewed count and members without replacement using game-only
weights, preserve all selected and unselected evaluations, and emit `cardinality_requirement`
candidates only for selected members. Unselected members remain unknown, and selected conditions
without a bound profile remain explicit nonblocking coverage. Multiple conditions may contribute
to the same finding; D-193 alone reconciles agreement or returns a literal hard-value conflict.
This pass does not aggregate soft tendencies, infer diagnoses, assign points, retry a seed, or
contain real diagnosis criteria.

Clinical content remains declarative even when it is useful to think of a database record as a
function. Atomic `FindingDefinition` and `MeasurementDefinition` records are reusable inputs;
diagnosis-owned composition data and pure authoring compilers produce frozen outputs. Content
files never receive callbacks or arbitrary expressions. The overall encounter compiler may
consume location and complexity state, but location admission, optional-feature spending, and
diagnosis-to-finding composition remain separate passes.

The condition-finding lane now supports an explicit dimension boundary rather than counting every
concrete manifestation independently. A `condition-finding-dimensions.v1` profile selects a total
number of dimensions subject to nonoverlapping reviewed core/cluster constraints, then selects
one or more manifestations inside each selected dimension. Backend facts such as insomnia versus
hypersomnia and self-reported versus observed psychomotor change remain independently auditable,
while their owning dimension counts once. This is D-197 v3, not a parallel cluster engine or
general expression language. Real MDD mappings remain disabled until the evidence-gated profile is
reviewed.

Subthreshold texture remains downstream of encounter-owned D-201 optional-richness selection.
D-249 supplies the typed authoring-only bridge: one selected `finding_texture` module maps to
exact reviewed finding outcomes, reuses its D-201 ordinal/draw, and copies the unchanged
selection/spend audit. D-208/D-223 retain the emitted IDs without populating canonical findings
early. D-200 replaces only the matching generic D-198 baseline with those
`background_variation` candidates before D-193. Hard D-197 candidates still control the same
finding. The narrow first version rejects a same-target D-199 contributor collision pending
reviewed combination semantics. Diagnosis criteria and core dimensions never spend the optional
budget, and no real texture mapping or rate is active.

Background texture is a separate lowest-priority authoring pass. A
`weighted-background-finding.v1` profile pins one exact finding definition and finite lawful
outcome set. One exact profile binds every target in a bounded background horizon. The pure
selector samples one outcome from ID-normalized game-only weights and emits one D-193
`background_variation` candidate per target. Its artifact freezes every offered outcome and
weight, selected outcome, stable draw, D-197/horizon/profile references, approved provenance, and
integrity fingerprint. D-193 may use that value for an otherwise uncovered finding or retain it as
displaced trace when a hard condition candidate controls. The selector does not infer a default
normal/absent value, inspect patient context, combine condition/medication influences, or claim
prevalence.

Soft-tendency pooling is a separate authoring pass after D-198. An
`additive-categorical-finding-tendency.v1` profile supplies a complete nonnegative allocation over
the same closed exhaustive mutually exclusive outcome set as its exact D-198 baseline. The
aggregator accepts only already-matched bindings, retains each exact applicability contribution,
sums unnormalized synthetic generation mass outcome-by-outcome, records exact normalized
game-selection probabilities, and makes one target-stable deterministic draw. It emits one D-193
`weighted_tendency` candidate while retaining D-198 as the lower-priority trace. Coexisting states
belong to separate findings; zero contributor mass is a no-op rather than impossibility; and no
negative mass or inferred redistribution exists. Whole-patient discovery and matching remain a
later composer concern.

The D-200 finding-pipeline audit composer now verifies one complete D-208 patient-state
composition followed by D-197 condition findings, D-198 baseline, and one complete D-210
whole-state applicability audit. It requires D-197 to embed the exact condition source retained by
D-208 and D-210 to embed that same D-208/D-198 payload. A caller cannot supply D-199. When D-210
emits bindings, D-200 derives the exact profile and finding-definition subsets and delegates
probability work to D-199; a zero-binding audit retains null D-199. It then builds one
collision-free D-193 candidate union. D-198 is never dropped when D-199 exists; the sole exception
is D-249's exact one-for-one substitution of a selected texture candidate for the generic D-198
baseline on that same definition. The composer
preflights D-193 for a complete conflict trace, calls D-194 once, and freezes every upstream
artifact, the derived D-199 request/result, the complete assembled compiler request, and either the
verified catalog snapshot or one literal hard-conflict audit. Standalone integrity replays the
retained D-199 and D-193/D-194 requests, so a
candidate body, template, condition state, complexity envelope, compiled snapshot, or conflict
cannot be crossed merely by retaining an ID. Stage seeds remain independent. The encounter-owned
optional-feature budget is spent only by D-201; D-200 never recalculates or refunds it. D-200
derives the condition source, complete pre-finding state, condition bindings, D-193 patient-state
ID, and D-193 proposition state from D-208 rather than accepting independent copies. A blocked
D-208 request stops before D-197/D-193/D-194 with its native blocker audit.

The D-201 optional-feature budget selector supplies that independent lane. D-275 keeps historical
v1 templates byte-compatible and adds a v2 template contract that carries a required-state
baseline separately from a larger optional budget. One exact-template profile binds reusable
module identities to encounter-local cost, impact, five-axis contributions, synthetic
game-variety weight, and reviewed incompatibilities. Selector `3.0.0` explicitly draws a feasible
module count, then selects without replacement while exact remaining-budget and incompatibility
look-ahead preserves at least one completion. The frozen artifact keeps the exact template-owned
baseline, full request, every count and candidate decision, draws, selected and unselected
snapshots, and spent and unspent capacity. Downstream bridges retain that artifact while adding
typed owner and materialized-record links, so a later learning trace can reconstruct module →
binding → patient fact → rule → receipt without treating complexity as clinical meaning. It
materializes no clinical payload and does not alter D-194. Compatibility/runtime continues to
reject nonempty selected modules. D-202 is the narrow bridge that makes D-201 the sole budget
authority for D-196 optional comorbidities rather than allowing two independent draws.

The D-202 optional-comorbidity bridge now provides that narrow authoring boundary without invoking
D-196's weighted selector. A reviewed exact-template profile maps the complete D-201 comorbidity
candidate pool bijectively to the complete D-196 optional-condition pool. The bridge verifies and
retains the complete D-201 artifact plus normalized D-196 request, materializes required template
constraints as authored condition state, materializes only D-201-selected optional condition
states/bindings with D-201 draw provenance, and re-evaluates explicit D-196 incompatibilities.
D-196 weights remain visible audit context but do not select membership. The current bridge is
bounded by D-201's 64-candidate authoring ceiling. D-203 adds a discriminated
`ResolvedConditionSource` and source-specific verifier so D-197 can consume either the complete
genuine D-196 artifact or complete genuine D-202 artifact. D-197 embeds that source and its native
reference, re-verifies it during integrity checks, and never fabricates D-196 draw semantics.
D-204 advances D-200 to the same source contract, requires complete source/reference equality with
D-197, and retains that source through attachment fingerprints and replay. Runtime compatibility
continues to reject selected modules.

The D-205 optional reaction-history bridge is a second narrow consumer of D-201. Every
`allergy_reaction` candidate maps to one complete `PatientReactionHistory`, and the exact D-201
profile must make every pair of those alternatives incompatible. The bridge therefore copies zero
or one complete payload plus its original ordinal and stable draw; it does not merge histories,
redraw, or recalculate the complexity budget. A versioned authoring horizon exactly pins the
medication, nonmedication-trigger, and manifestation IDs used by the alternatives. Null means no
optional contribution. Reaction labels and reported severity remain uninterpreted, and the output
does not attach to D-194, required/base reaction state, persistence, or runtime.

The D-206 optional prior-treatment bridge deliberately differs where the native state is additive.
Each `prior_treatment` candidate owns one nonempty contribution across the four existing
treatment-history record lanes. Several compatible D-201-selected contributions concatenate by
globally unique record ID, so separate complications can spend budget independently without
replacing the patient's whole past. One contribution may contain many trials. D-201 still owns all
selection and accounting; D-206 retains each ordinal/draw, performs no clinical inference, and
uses an exact medication/intervention reference horizon. The normalized aggregate remains an
authoring contribution and is not merged with core history, regimen/tolerability state, D-194,
persistence, or runtime.

The D-207 optional exposure bridge is the analogous additive owner for D-201 `substance_use`
modules. Each candidate maps exactly once to a reviewed, nonempty `OptionalExposureContribution`.
Compatible selected contributions concatenate into one ID-sorted
`OptionalExposureMaterializedContribution`; co-selectable mappings must use disjoint semantic
agents, while same-agent alternatives must pin one exact version and be explicitly incompatible in
D-201. The exact `OptionalExposureReferenceHorizon` covers every medication, supplement, and
other-substance reference. D-201 remains the sole selection/accounting authority. D-207 copies
frozen recency, amount, prescription relationship, and misuse truth and adds resolution provenance
from the upstream stable draw. Null means no optional contribution, not nonuse. It does not
construct or merge a complete inventory, derive priors or new clinical state, attach to D-194,
persist, or enter runtime; required exposure remains core state.

D-208 is the first and only core-plus-optional state attachment point. Its authoring-only composer
verifies one complete D-201 artifact across the genuine condition source and every typed optional
bridge required by that candidate pool. It replaces the core required-only condition lane with the
complete source, optionally replaces one explicitly declared reaction-history default, and
additively attaches prior-treatment and exposure records. It rejects record and semantic-agent
collisions rather than deduplicating them. A selected unowned `other` module produces an auditable
`not_composed` artifact without reroll or refund. The output retains all D-201 accounting and
bridge provenance and derives one deterministic pre-D-193 `ResolvedPatientState`. D-209 attaches
the complete D-208 artifact to D-200 as its only patient-state source. D-200 derives the D-193 and
D-194 state and binding fields, retains and replays the full D-208 → D-193 → D-194 chain, and
propagates `not_composed` as a typed upstream blocker without fallback, reroll, or refund.

D-210 is an authoring sidecar over that complete state. It verifies D-208 and genuine
D-198 target context, scans approved reusable applicability definitions through the existing typed
patient-fact and same-record matcher, and emits only audited D-199-ready bindings. It retains
matched and nonmatched definitions, exact record IDs, definition/profile/target versions, and
fingerprints. Required and optional facts are treated identically once D-208 freezes them; the
nested D-201 accounting is provenance, never a D-210 trigger or a second charge. D-211 wires that
verified artifact into D-200 as D-199's sole applicability source. D-210 still performs no
allocation, normalization, draw, scoring, or points, while D-200 performs no patient-fact
rediscovery. Persistence, compatibility, real profiles, and runtime remain deferred.

D-212 adds a schema-only authoring sidecar for structured patient-state results that do not belong
in the canonical-finding compiler. A versioned definition pins one legacy information-action
payload fingerprint and closed record lanes or singleton fields. Each resolved source view retains
one exact patient-state ID, source instance, time scope, claim origin, dependency groups, explicit
presentation status, and a complete included-versus-omitted truth-record partition. Its integrity
envelope permits partial or inaccurate reports while proving that hidden state was neither copied
into the wrong source nor mutated. An empty truth lane is not a negative result without an explicit
source-scoped `none_reported` statement. No arbitrary selector language, source-reliability
probability, inferred motive, wording, action availability, scoring, persistence, or runtime
surface exists here.

D-213 supplies that standalone compiler. A versioned universal information-action catalog and one
versioned recipe per exact action are compiled against the complete frozen D-193 output, D-212
envelopes, measurements, categorical observations, and structured tests. Every catalog action
receives one normalized `complete`, `incomplete_coverage`, or `outside_action_horizon` evaluation.
Only complete in-horizon actions receive a deterministic binding candidate. A missing declared
owner remains a nonblocking coverage diagnostic with no fabricated result; an invalid or stale
owner/version is rejected because its frozen payload cannot be verified. Instrument-item targets
remain explicit unsupported diagnostics, and unknown information-action targets fail against the
exact catalog.

The D-213 source union remains a standalone audit boundary, and D-214 now gives D-194 sole
attachment authority. `PatientTemplate` `attachment_only.v2` pins one static
`UniversalActionResultAssemblyRecipe`: the exact action catalog, universal recipes, and source
definitions, but no patient-specific projection or binding. After D-193 produces the final
patient state, D-194 validates detached D-212 projection recipes against that state, compiles one
complete D-213 artifact over the exact focused horizon, and mechanically derives every
`EncounterResultBindingRequest`. Caller-authored result bindings are rejected, and incomplete
coverage attaches nothing.

The authoring snapshot retains the complete D-212 envelopes inside D-213. The `PatientInstance`
copies only presentation-safe structured source views, excluding omitted truth IDs, truth values
and relationships, claim/dependency audit, copied patient state, and resolution internals.
Standalone integrity replays D-213 and re-derives the exact safe views and result bindings against
the static assembly, final state, D-193 output, and both horizons. D-200 composer `5.0.0` preserves
that artifact chain; its literal-finding-conflict path stops before attachment. D-201 remains the
sole selector and spender: the quantity of recipes, sources, candidates, disclosures, omissions,
actions, or reveals never changes optional-complexity accounting. Information-action purchase cost
is a separate encounter-economy concern.

D-215 adds a standalone authoring-only structured source-report compiler over one exact frozen
`ResolvedPatientState`. Each already-selected profile resolves every declared whole lane once as
`report_all`, `none_reported`, `unassessed`, or `unable_to_assess`, and resolves typed singleton
fields by mirroring truth or presenting one explicit lawful value. The artifact pins exact
patient-state, profile, and D-212-definition fingerprints and replays the full request for
integrity. It does not select a behavior, filter individual record IDs, assign probabilities or
weights, mutate fields, spend complexity, or assign points. It is not yet attached to D-194 and
contains no real source-report profile.

D-240 adds a parallel owner for target-scoped clinical duration, subjective burden, and—at
`2.0.0` under D-315—condition-attributed functional impairment. Those records cannot safely enter
D-212 whole-lane reports because each one points to an exact condition, finding, or proposition
and retains independent source/time semantics. One static definition pins one semantic owner,
target-definition selector, source kind, time scope, and exact information-action payload. The
compiler resolves absent, singular, and ambiguous target multiplicity, then produces both a
complete authoring projection and an explicitly bound, target-redacted frozen reveal. Functional
impairment is stricter: its safe value also omits source-instance identity while the authoring
projection retains it. The same patient record may feed different actions, while same-action
overlap fails closed. A neutral patient-state normalizer supplies canonical ordering without
making D-240 depend on D-212/D-215 semantics.

D-241 attaches that verified owner without widening its safe view.
`universal-action-result-assembly.v3` owns static definitions, D-194 `9.0.0` runs D-240 only after
final patient truth exists, and D-213 `3.0.0` routes the complete nullable artifact through one
closed target-scoped source class. `not_applicable` is neutral when another source resolves;
missing or ambiguous applicable definitions block the action and cannot be hidden by a complete
sibling definition. D-214 puts only referenced target-redacted reveals on
`attachment_only.v6` patient instances. The complete D-240 audit stays nested in D-213 and replays
through D-200 `27.0.0`; no parallel snapshot copy, complexity spend, real definition, persistence,
runtime, or UI is added.

D-216 adds the closed `EncounterCareSetting` values `outpatient_psychiatry`,
`emergency_department`, `inpatient_psychiatry`, and `consultation_liaison`. One
`PatientTemplate` owns one setting; `LocationDefinition` names the setting; `EncounterInstance`
freezes it; compilation and integrity require exact template/location/encounter equality. Care
setting is encounter metadata, not a patient fact, diagnosis attribute, or optional-complexity
module. It costs zero budget and grants no capability, action, service, formulary item,
disposition, difficulty, reimbursement, or points. All current runtime locations remain
outpatient; real ED, inpatient, and consultation-liaison operational content, queue selection,
persistence, and UI remain deferred.

D-217 adds the standalone behavior-selection boundary before D-215. A neutral horizon defines
exact source-view slots over the static assembly. A separately reviewed selection profile binds
that horizon to one care setting and chooses either one fixed complete D-215 profile or one of
several weighted complete alternatives per slot. Weights normalize only inside their
mutually-exclusive slot and use independent stable substreams; they are game-generation mass, not
clinical probabilities or complexity costs. The compiler verifies exact assembly, definition,
source coordinate, allowed source kind, full lane/singleton coverage, profile fingerprints, and
care-setting equality. It retains complete candidates, selected profiles, draws, fingerprints,
and replay but consumes no patient state and does not run D-215.

D-218 closes that synthetic attachment boundary. Catalog compiler `4.0.0` accepts no
caller-authored D-212 projection recipe. With a nonempty structured-definition horizon it
requires one verified D-217 artifact, applies only its selected profiles through D-215 after final
D-193 truth exists, feeds only the resulting native D-212 envelopes to D-213, and freezes the
D-214 safe views. The snapshot retains both complete authoring artifacts and replays the exact
D-217 → D-215 → D-213 → D-194 chain; an empty horizon requires both artifacts to be null. D-200
`7.0.0` retains the same audit. This adds no real profile, operational location, complexity
charge, action cost, scoring, persistence, or runtime generation.

D-219 adds the separate exact-location operational-admission boundary. Its intentionally narrow
request contains the template, physical location, focused action horizon, universal action
catalog, and operational-only service-method, formulary, medication-identity, and treatment
projections. One algorithm evaluates all four care settings without deriving access from their
names: only the exact location's capabilities, base formulary, disposition allowlist, and eligible
service methods can satisfy baseline access. Staff-dependent methods remain pending an explicit
future runtime context. Current-regimen operations remain patient-state-owned and are not blocked
because the medication is absent from the new-start formulary.

Incomplete access creates itemized coverage diagnostics and prevents attachment, but it does not
reroll a patient, infer clinical unsafety, require a minimum safe route, or change D-201 spending.
The projection carries no cost, quality, cheapest-method choice, points, reimbursement, or hidden
clinical rule. Catalog compiler `5.0.0` preflights one complete D-219 artifact before D-193, pins
its ID/fingerprint in the encounter, and retains it at the snapshot root; D-200 `8.0.0` replays the
same audit. All tests for outpatient, ED, inpatient psychiatry, and consultation-liaison currently
use synthetic explicit resources. All real runtime locations remain outpatient.

D-220 adds the standalone `instrument-item-response-only.v1` owner and authoring compiler `1.0.0`.
The owner contains only an opaque rights boundary and exact item scale/options,
information-action, respondent-source, and time-scope metadata. It contains no item wording,
score weight, total, threshold, interpretation, or clinical rule. The compiler consumes one
verified D-193 artifact plus its exact projection horizon, a minimized
`InstrumentInformationActionHorizon`, the exact universal action catalog, and approved exact
instrument definitions. Every instrument target retains one complete or incomplete evaluation.

A complete response requires one and only one D-193 `response_option`, the complete
instrument-owned option set, null presentation channel, no expression bank, an exact owning action,
and compatible neutral action/report source. Items sharing a scale ID must share its complete option
set. The artifact freezes rights, scale, option, action, respondent, time, contributor provenance,
owner fingerprints, diagnostics, and deterministic replay. It copies reviewed source/time metadata
from the item owner; it cannot infer a finding's modality from D-193 output. An empty instrument
horizon produces a complete empty artifact.

D-221 attaches this exact artifact without broadening its authority. The static assembly advances
to `universal-action-result-assembly.v2` and owns the exact neutral instrument definitions. D-194
derives D-220 only after final D-193 truth, and D-213 `2.0.0` treats each exact complete response as
an action-owned source. D-214 validates each source against the full response/evaluation audit and
freezes a contributor-free patient projection. The root snapshot and nested D-213 request retain
the complete D-220 artifact and must be exactly equal under replay. A horizon with no instrument
targets retains a complete empty D-220 artifact and no patient response.

This advances `PatientTemplate` to `attachment_only.v5`, catalog compiler/D-194 to `6.0.0`, and
D-200 to `9.0.0`. Root, nested, patient-safe, or encounter-binding tampering fails integrity. The
same compiler path works in outpatient psychiatry, emergency department, inpatient psychiatry,
and consultation-liaison, but care setting grants no resources and D-219 remains the separate
exact-location admission authority. D-201 remains the sole optional-feature selector and spender.
The compiler imports no real instrument text and assigns no probability, complexity, action cost,
point, score, total, cutoff, threshold, validation claim, or interpretation. Persistence,
generalized runtime generation, and UI remain disabled.

D-222 now supplies the missing selected-location resource projection as a separate authoring
artifact. One clinic-wide `ClinicLocationResourceAssignmentHorizon` covers every built location
exactly once. Each nested `SelectedLocationResourceAssignment` binds exact
version-and-fingerprint-pinned upgrade and formulary references to one exact location version, and
each upgrade owner declares exclusive or shared location placement. Compiler `1.0.0` validates
clinic/facility identity and tier, complete built-location coverage, exact selected-location and
department context, current owner reference integrity, clinic and equipment ownership, facility
allowlist and tier, exclusive/shared placement, required department, staff kind plus exactly one
valid nonoverlapping automation configuration, and formulary owner/ownership/grant parity.

Only the selected location's baseline resources plus valid explicitly assigned grants enter the
effective capability, formulary, and staff projections. Clinic-global or neighboring-location
resources never enter by union. The same pure algorithm accepts outpatient psychiatry, emergency
department, inpatient psychiatry, and consultation-liaison coordinates without deriving a resource
from the setting name. Its complete/incomplete artifact retains itemized diagnostics, normalized
input, exact fingerprints, and replay.

Artifact verification also requires the same complete current upgrade-owner and formulary-owner
horizons. This prevents a stale assignment reference or caller-supplied replacement owner from
silently changing a capability or formulary grant.

Under D-224, D-219 `2.0.0` consumes the complete exact D-222 artifact directly and resolves its
operational inputs only from that artifact. D-222 `2.0.0` fingerprints exact formulary membership;
D-219 receives only those exact effective formulary definitions. D-194 `7.0.0` and D-200 `10.0.0`
retain the full historical chain but require a separately recompiled, validation-only current
resource context before activation. This current context never enters `PatientInstance` or
`EncounterInstance`.

D-223 closes a different caller-owned seam: one standalone authoring orchestrator now owns the
complete D-201-through-D-208 pre-finding pass. Its strict request carries the exact optional-module
selection request, condition plan, required core state, explicit reaction-history ownership, and
the typed D-205/D-206/D-207 inputs implied by the complete candidate horizon. It runs D-201 once
and injects that single immutable accounting artifact into every applicable child.

The orchestrator chooses the condition source structurally from the candidate horizon, not from a
selected count or clinical inference. A horizon without any comorbidity candidate uses
required-only D-196. A horizon with a comorbidity candidate always uses D-202, including when the
candidate remains unselected. Reaction, prior-treatment, and exposure lanes likewise retain their
complete typed bridge artifacts when they materialize no optional contribution. D-208 is the only
composition boundary and preserves either the composed state or a typed `not_composed` audit. A
literal D-202 conflict or unsupported selected `other` remains charged; no child redraws, refunds,
or recalculates D-201.

Compiler `1.0.0` freezes normalized input, deterministic child request IDs, complete root and
nested audits, exact fingerprints, and replay. It rejects crossed template, seed, profile,
reference-horizon, core-state, ownership, or complexity-envelope context. The same code path
accepts outpatient psychiatry, emergency department, inpatient psychiatry, and
consultation-liaison templates. Care setting participates in exact identity but never grants a
resource or changes optional accounting.

D-225 attaches D-223 as D-200 `11.0.0`'s single pre-finding root. D-200 verifies D-223 natively,
derives its genuine nested D-208 composition for downstream compilers, and rejects a parallel
caller-supplied D-208 root. The retained authoring audit includes D-223, while patient and
encounter projections do not. This introduces no real content, runtime activation,
rule/point/probability evaluation, or second complexity authority.

D-231 adds a strict authoring-only lifecycle layer before D-226. Standard/Normal and Endgame
materialize only the explicitly loaded lifecycle-approved lane; local Developer may append one
separately loaded lifecycle-review lane. The compiler rejects other lifecycle states, crossed
lanes, or multiple current versions of one stable template ID. It retains medical-review status
for audit but never uses it as lifecycle approval, and it owns no setting, resource, queue-history,
weight, point, or complexity decision.

D-226 `3.0.0` removes its caller-owned template array and accepts that verified D-231 artifact as
its sole template source. It compiles D-222 once per built location, then forms the complete
D-231 template × built-location matrix and runs D-219 only for exact declared, version-current,
care-setting-matched pairs whose template action
horizon and universal result assembly resolve. Complete D-219 coverage yields `admitted`;
incomplete resources or operational access retain itemized diagnostics. Undeclared pairs are
ordinary matrix cells, and an unavailable template in the current clinic is not declared
clinically invalid.

This order keeps resource gating outside the optional-complexity budget:

```text
explicit approved templates (+ explicit review templates only in local Developer)
  → D-231 mode/lifecycle horizon
current clinic + built locations + assignments + D-231 horizon
  → D-226 template/location matrix
  → D-232 exact-location capacity profile and authorized coordinates
  → D-233 compact occupancy + first empty coordinate + template-selection seed
  → D-230 local weighted draw + frozen repeat context
  → nested D-229 exhaustive local admitted horizon + selected cell
  → nested D-228 compact admitted template/location binding
  → D-233 patient-generation seed from exact selected template
  → D-223 one-time optional-complexity selection and pre-finding state
  → D-200 finding/result audit and D-194 instance compilation
  → D-233 atomic occupied-or-blocked fill proposal
```

The compiler is identical across outpatient, ED, inpatient psychiatry, and
consultation-liaison. Setting names grant nothing. Real non-outpatient generation remains disabled
until the static owners, persisted assignment lifecycle, compatibility save/runtime migration,
and runtime activation of the authoring-proven distribution/repeat/refill policies are
implemented.

D-227 removes volatile save state from this authoring chain. A pure compatibility-boundary
projector converts `ClinicState` into strict `clinic-operational-context.v1`, containing only
clinic/facility identity and tier, built location/department IDs, upgrade/equipment/formulary
ownership, and staff configurations. D-222 and D-226 retain only that projection. Clinic label,
active location, global capability union, points, lifetime progression, Endgame/debug state, and
satisfaction are neither inputs nor fingerprints.

The minimized context is deliberately not a parallel source of truth: it is derived from the
current saved ClinicState and can be rebuilt. D-222 `3.0.0`, D-219 `3.0.0`, D-194 `8.0.0`, D-200
`18.0.0`, and D-226 `3.0.0` require it. SaveData and ClinicState versions do not change.

D-228 adds the compact handoff from that complete current-context matrix to the downstream
pipeline. Its compiler accepts a caller-named admitted evaluation only after revalidating the
entire D-226 artifact against the complete current D-226 request. The output freezes the exact
template, location, pool, setting, D-222 resource reference, and complete D-219 operational proof;
the large matrix remains compile-time context rather than per-patient payload.

D-229 adds the exact-location-owned slot boundary above D-228. D-230 then removes its
caller-selection seam: it verifies current D-226 context, consumes a location-pinned versioned
distribution profile, applies positive active/recent stable-template-ID suppression to the frozen
local repeat snapshot, normalizes exact integer mass only within that location, and performs one
deterministic 64-bit slot-local draw. The selected D-229 proof is nested, so downstream code cannot
provide a parallel choice or fall back to a clinic-global queue. D-228, D-229, and D-230 advance
to `2.0.0` for the nested D-231/D-226 shape. D-233 now calls D-230 with a
domain-separated template-selection seed, then derives one patient-generation seed from the exact
selected template. D-200 `18.0.0` consumes the resulting D-233 authority beside D-223 and derives
the historical D-230/D-232, template, location, and D-219 proof through it. It exact-compares the
full D-228 template with D-223, while preserving a separate current selected-location resource
context so a historical binding cannot validate itself after resource changes.

Capacity is an independent D-232 authoring input. `LocationPatientSlotCapacityProfile` pins one
exact location and declares base slots plus explicit capacity-upgrade contributions. Its compiler
uses a minimized capacity-only ownership/assignment context and materializes stable authorized
coordinates; it cannot grant clinical resources or affect D-226 admission, D-230 mass, points, or
D-201 complexity. D-200 requires a compact capacity certificate that exact-matches its D-230
coordinate. Adding another predeclared contribution creates new coordinates without invalidating
an existing certificate.

Facility replacement is also a separate D-232 proof rather than queue mutation. A versioned
successor profile maps occupied source locations to exact same-setting targets. The atomic
migration compiler retains each frozen patient, seed, template, historical D-230/D-232 selection,
and source provenance; it assigns a free target capacity coordinate and attaches a fresh current
D-226/D-228 binding. One missing mapping, capacity shortfall, or exact-admission failure blocks
every commit with itemized diagnostics. The compiler never calls patient generation, D-201, or
D-230 and never drops, truncates, reroutes, or partially migrates a waiting patient.

D-233 is the authoring-only boundary that turns current capacity into a deterministic patient
attempt. `PatientSlotGenerationRoot` is private and mode-specific.
`LocationPatientSlotOccupancySnapshotArtifact` covers every and only current D-232 coordinate but
stores occupied patients as compact references, avoiding recursive queue snapshots. The first
empty coordinate's local ordinal and exact location derive a template-selection seed; the exact
D-230-selected template then derives the patient-generation seed shared by every downstream
patient compiler and the final instance. Occupancy audit IDs, unrelated coordinates, weights,
points, prose, and request IDs do not enter either seed.

`EmptyAuthorizedPatientSlotFillArtifact` is a proposal, not browser mutation. It deterministically
replays D-200 and proves that every unrelated occupancy row is unchanged. Success changes only the
target row to one exact frozen patient. A D-200 error or literal conflict leaves it empty, records
the exact blocker, and consumes one ordinal without a hidden retry. Native occupancy rejects
cross-coordinate or cross-mode relabeling. Multiple coordinates are filled one at a time in
canonical order, so the next D-230 draw receives the earlier occupied patient in its frozen repeat
snapshot. SaveData/persistence, completion-to-vacancy/refill transitions, Developer refresh
history, and runtime activation remain outside this boundary.

D-234 supplies that next authoring boundary without committing it to the browser. It vacates only
the exact completed coordinate and prepends the template to bounded duplicate-preserving
mode/location completion history bound to the exact current occupancy; retained patients,
attempts, terminal events, and proofs are unique and their nested D-200/proof integrity is
replayed. Selected-location refresh in Endgame or Developer records removed patients only as
skipped; it does not fabricate completion, recent-history, or Developer-run entries. Developer
completion tracks exact template ID/version/fingerprint. Replacement draws exclude completed
versions globally and currently waiting versions at that exact location, reject a fingerprint
change without a version change, recompute after each fill, and can end in an auditable empty
exhaustion after earlier successes. Same-template rerandomization pins the prior exact template
and may proceed only when its target is the canonical first vacancy after removal.

D-235 replaces D-234's temporary canonical-JSON envelope with the native
`GeneratedCompletedEncounterAttempt`. The compiler derives a compact
`GeneratedEncounterReplaySnapshot` from the verified D-200 waiting slot rather than accepting a
parallel patient copy. That snapshot retains the exact `PatientInstance`, `EncounterInstance`,
waiting-slot/location identity, source audit fingerprints, and only the information-action
runtime fields needed to validate historical purchases. It deliberately omits the recursive D-200
authoring chain from the browser-shaped attempt; D-234 may still retain that full chain in its
authoring-only history proof.

The native attempt then stores exact purchased result/service/fulfillment snapshots, editable
diagnosis selections, V2 regimen-entry-targeted medication transitions, interventions,
disposition, a contiguous ordered event log, the submitted snapshots, complete rule/point trace,
all-points settlement, content/engine versions, and replay/payload fingerprints. Compilation
requires one start, submission, score, settlement, and terminal completion in that order; actions
cannot occur after submission. Every purchase and treatment target must belong to the frozen
encounter horizon, every compiled-rubric rule must have one trace row, and component, cap,
expense, payout-floor, and practice-bank arithmetic must agree. D-272 now checks diagnosis
identity and every submitted qualifier against a minimized exact owner set compiled from every and
only the diagnosis definitions in the frozen horizon. It persists family/severity selection mode
and reviewed selectable specifier identities, not whole diagnosis dossiers.

The D-238 generated point source is now native: after folding the exact submitted events, D-235
resolves the separate balance catalog and evaluates the canonical count-aware regimen route.
D-242 extends that boundary from treatment-only comparison to two strict point-free decision
snapshots. The player snapshot is derived from successfully replayed purchases plus final
diagnosis and treatment events; the reference is one explicit `databasePlanDecision`. Both are
validated against the frozen encounter horizons. Callers cannot supply the player decision, trace
rows, match state, components, point values, caps, safety IDs, or the database-plan total.
The current D-237 route still evaluates only each snapshot's treatment selection, so D-242 changes
no rule match or point total.
Unbalanced qualitative rules remain explicit zero-point trace rows. The current service quotes and
settlement prices no longer share one undifferentiated status. D-239 joins the exact full
`ServiceDefinition` owner subset to D-219's price-neutral availability proof, intersects
staff-gated methods with D-222's action-specific staff configuration, and freezes the normalized
price owners in replay snapshot v2. Information-purchase commands carry only purchase and action
identity; native pricing selects the cheapest equal-quality available method, derives label/cost
and external/staff savings, and rejects stale topology or quote tampering. D-270 extends the same
join to the exact intervention/disposition horizon: replay snapshot v3 freezes every treatment
owner, its nullable fulfillment-service binding, and available method set. The final submitted
selection natively creates one charge only for each service-backed treatment and independently
re-quotes it on replay. A service-free treatment and every medication/regimen action remain
unpriced rather than receiving an assumed zero-cost owner. D-271 then freezes one separate
template-scoped economy policy, the complete current ClinicState, its exact D-227 operational
projection, and the versioned satisfaction configuration in replay snapshot v4. The economy policy
owns only provisional base reimbursement and challenge bonus. The clinic state owns bank-before,
lifetime-before, and raw satisfaction; the multiplier is recalculated and must agree with the
stored state. Settlement v4 records this boundary as
`native_economy_policy_clinic_state_satisfaction_and_service_pricing.v1` and contains no
free-floating caller settlement values. Real template economy-policy content remains unactivated.
D-272 advances replay snapshot and completed attempt to v5 and the D-235 compiler to `11.0.0`.
The snapshot now also contains one fingerprinted, minimized diagnosis-qualifier owner per exact
diagnosis option. A family-only owner exposes no player severity, and only individually reviewed
player-selectable specifiers plus their exclusivity groups survive the projection. The compiler
rejects missing, extra, stale, or crossed definition owners; replay independently rejects changed
option/version/qualifier payloads. No diagnosis prose, clinical rule, answer key, point value, or
backend severity descriptor enters this owner set.

D-273 adds a separate authoring-only launcher-presentation boundary. One exact reviewed profile
joins curated fictional first- and last-name pools to reusable short chief-complaint banks, then
uses independent seeded substreams for each name component and complaint selection. The full
artifact retains profile, pool, bank, draw, and fingerprint audit; its minimized resolved
presentation contains only the fictional name and brief complaint safe for a future launcher.
Neither name nor complaint wording is a clinical input, rule predicate, source of diagnosis
likelihood, or point owner. This standalone resolver is exported only from the engine authoring
entry and is not yet attached to D-200, D-235, a waiting slot, persistence, or UI.

D-332 adds the first real content behind that boundary without activating it. The
runtime-excluded `patient-launcher-presentations` catalog owns three reusable, concise complaint
banks and one MDD launcher profile. The profile references the existing substantial fictional
first- and last-name pools, fixes the accepted one-quarter middle-initial probability, and mixes
general, mood/interest, and energy/sleep/function complaint banks at equal specificity and equal
synthetic game weight. Complaint wording is cosmetic and may overlap across clinical causes; it
never changes patient truth, diagnosis likelihood, a finding, eligibility, rules, points, or
formulary behavior. The banks remain medically unreviewed, while the profile carries exact
accepted Developer-opinion ownership of the cosmetic behavior. Registry and runtime-boundary
validation keep the catalog out of ordinary Player and portable Reviewer roots until a separate
exact PatientInstance/slot/persistence attachment is reviewed.

D-333 closes only the detached authoring attachment seam. One exact replay-valid successful
D-331 fill supplies the frozen waiting-slot identity and its final D-194 catalog snapshot; the
compiler then invokes D-287 itself with the exact D-332 profile, name pools, and complaint banks.
The output retains the complete D-331 and D-287 artifacts and a minimized fingerprinted record
containing only waiting-slot reference, patient-instance reference, fictional name, and brief
chief complaint. A blocked fill, crossed or tampered fill, caller-supplied patient/seed/snapshot,
or mismatched presentation content fails closed. D-333 does not modify the frozen waiting slot,
change D-200/D-233, define SaveData, persist or refill a queue, activate Player/Reviewer runtime,
render UI, or add clinical meaning, rules, points, or formulary behavior.

D-274 does not change that generated-presentation status. It adds a separate transitional local
Developer Patient Maker over the existing `CaseBlueprint → instantiateCase → CaseInstance`
compatibility boundary. `@psychsim/content-runtime/developer` computes a finite safe option
projection only for measured approved/review cases whose complete canonical validator passes.
The web UI receives no raw registry traversal; it submits an exact blueprint ID and its existing
authored complexity budget to the pure queue function. That function reuses ordinary
instantiation and eligibility, persists one reserved Developer slot, and never invokes or
simulates D-201/D-200. The production root content entry and portable Reviewer assignment do not
export this allowlist.

A separate
`GeneratedCompletedEncounterAttemptPersistenceRecord` adds `completedAt` and its own record
fingerprint; wall-clock metadata never changes the attempt's clinical replay fingerprint.
D-234's v2 completion proof embeds the verified native attempt and cross-checks it against the
exact occupied waiting patient before vacancy.

D-230 `3.0.0` now filters the current admitted horizon through an exact eligibility overlay before
applying distribution weights. D-234 reconciliation fills canonical empty-coordinate order, pins
one exact current admission matrix containing the transition location/fingerprint, distribution
profile, and caller-supplied mode generation root shared by active and retained-history patients,
and
retains and stops at the first blocked D-233 attempt. A later caller may extend the same
deterministic transcript only by naming that exact blocker as an explicit retry authorization; the
next attempt uses the blocker-advanced occupancy, ordinal, and new seeds. Current dependent
versions are D-233 occupancy `1.0.0`, seed authority `2.0.0`, atomic fill `3.0.0`, D-200 `27.0.0`,
facility migration `3.0.0`, D-234 transition/reconciliation `2.0.0`, and the D-235 native-attempt
compiler `11.0.0`; generated point-report v7 retains the exact player and database-plan decisions,
both complete rule traces, the minimized D-252 balance snapshot, three-state prerequisite audits,
and native D-159 combination trace.

This remains authoring-only. D-230 owns only the local template draw; D-233 owns the derived
patient seed and atomic fill proposal. Neither persists/refills a slot, spends complexity, assigns
points or clinical probabilities, or activates runtime generation. D-231 materializes lifecycle
membership only; it deliberately excludes Developer run history and queue behavior. Normal
progression begins with outpatient
locations; other settings require concrete unlocked/built owners. Endgame and Developer may
supply broader explicit template horizons, but must materialize real exact locations/resources
and retain each patient's setting. The existing facility-wide `patientSlotCount` and compatibility
queue, SaveData v5, IndexedDB repository, compatibility `CompletedAttempt`, review/export payloads,
automatic Standard refill orchestration, and UI remain unchanged pending a dedicated
runtime/save migration. The native generated attempt must not be unioned into SaveData v5 or
silently exposed through current review exports because it contains generated-patient truth and
rubric material whose public projection has not been defined.

These synthetic compilers are exported only through the explicit
`@psychsim/engine/authoring` subpath. The ordinary `@psychsim/engine` root used by the browser and
content runtime does not re-export or transitively load them. Lint plus a recursive source-boundary
test forbid all engine subpath or deep-source imports from those runtime surfaces.

Do not activate real multiple-setting locations through the compatibility runtime's current
facility-wide capability/formulary union. D-222 proves the authoring-only selected-location
projection and D-224 attaches it exactly to D-219, but runtime operational access still requires
persisted assignments, compatibility migration, and deliberate replacement of the legacy union
path. D-227 supplies the minimized current operational context but does not activate that path.

Typed measurements now have a separate runtime-excluded target catalog. Numeric definitions own
identity, unit, precision, reveal-action access, and lawful context dimensions; categorical MSE or
physical observations use their own definition/value records. Resolved measurements may remain
uninterpreted. The architecture does not parse compatibility vital-sign prose or infer body
habitus, ranges, diagnoses, or score behavior.

Diagnosis files are composed separately from patient instantiation.
`composeDiagnosisGuidance` applies base, severity, specifier, and other active-diagnosis rules,
derives tags and a five-dimensional complexity vector, and returns stable blocking conflicts. It
never assigns points or chooses a source winner. The next compiler narrows that conservative
checkpoint: only malformed or literally contradictory same-scope state quarantines; missing
clinical/rubric/response coverage emits a nonblocking diagnostic and ticket. A reviewed safety
constraint may govern valid clinical tension while both rules remain traceable; evidence
disagreement stays disabled behind a ticket; and balance disagreement remains outside qualitative
guidance.

The point-free decision-policy compiler now establishes the next boundary without migrating this
compatibility path. Exactly one primary policy supplies the dominant route. Reviewed secondary
rules may be discovered from any exact typed fact in the complete resolved patient, but only when
their exact action targets intersect the focused horizon. Chart claims and internal conditions
have different fact namespaces; labels, prose, aliases, free clinical tags, and file order cannot
match. Background diagnoses therefore remain available context without silently becoming
additional primary treatment objectives. Matching safety, interaction, and treatment-prerequisite
guardrails stay eligible, and missing supporting coverage produces a nonblocking diagnostic. The
later generated-patient compiler will also address regimen entries independently and measure the
resolved patient against a provisional template complexity envelope. See
[DIAGNOSIS_ENGINE.md](DIAGNOSIS_ENGINE.md) and
[PATIENT_GENERATION_ENGINE.md](PATIENT_GENERATION_ENGINE.md).

D-243 advances this authoring compiler to `3.0.0` for one closed point-free prerequisite shape.
An exact treatment/intervention `triggerWhen` remains separate from an information-only
`fulfillmentWhen`; the ordinary `actionWhen` horizon anchor equals fulfillment. D-191 requires
both sides to be available and the retained originating policy ID/version plus focused-decision ID
to equal the current policy before compiling the rule. The adapter and compiled rule preserve that
scope and a non-null typed patient predicate rather than merely validating and discarding it.
D-242 evaluates actual frozen selection as `not_triggered`, `fulfilled`, or `omitted`. The reverse
index remains an optimization over fulfillment and must equal a full semantic scan. The initial
diagnosis adapter supports only approved exact `anyMedicationStarted` rules, and a medication-tag
trigger fails closed instead of being treated as native class membership. No points or runtime
behavior follow from this attachment.

D-338 advances that adapter to `2.0.0` without widening runtime predicate semantics. A diagnosis
rule may now pin one exact reviewed medication class/version and count bounds. The adapter
validates the complete approved membership horizon and expands it to sorted concrete
medication-start targets; it rejects stale, unreviewed, empty, duplicate, or cardinality-lossy
input. Compatibility `TreatmentWorkupRequirement` content uses a separate closed predicate schema
that excludes exact classes, so the existing tag-based CaseBlueprint rule stays frozen while the
new native MDD mania-history prerequisite compiles independently.

D-339 advances the same adapter to `3.0.0` and adds one narrow native-only patient-fact
refinement. A diagnosis rule may pin one exact canonical finding ID/version/outcome beside its
legacy compatibility `patientWhen`. The adapter validates that exact finding against the finite
catalog and combines its D-191 fact key with the primary route's typed patient predicate. It never
emits or evaluates the compatibility tag, and missing, stale, inactive, or outcome-incompatible
content fails closed. The first use gates the detailed suicide-safety history on a frozen present
passive-death-wish finding; it does not infer risk, disposition, or patient truth.

D-340/D-341 close the corresponding result-identity seam without widening that scoring adapter.
Four missing neutral findings complete the first detailed safety fact vocabulary, while a separate
checked-in projection horizon packages nine exact present-or-closed-horizon-absent facts under
`info.history.suicide-safety`. One universal-result assembly pins the current action fingerprint
and routes only those finding projections. The projection trace remains fact-by-fact even though
the player may see one compact result.

This assembly is intentionally not a safety engine. It does not consume
`reportedSafetyPlanningAbility`, infer weapon access into broader means access, define a recency
window, combine evidence, label risk, choose disposition, or assign points. Exact event details,
protective factors, acute modifiers, and source-discordant claims require their own reviewed
owners. The static content is runtime-excluded until a complete generated-patient vertical is
authorized.

D-342 gives `reportedSafetyPlanningAbility` its own equally narrow result boundary. One structured
reveal definition pins the exact `info.history.existing-safety-plan` payload, permits only a
current patient-report source, and projects only the typed singleton. A separate universal recipe
routes the redacted reveal reference. The complete source-report resolution remains in the
authoring audit, while the player-facing binding cannot expose hidden truth or source-reliability
metadata. This boundary reports ability only; it does not represent a written safety plan,
plan-making intervention, detailed risk assessment, risk formulation, or disposition.

D-343 and D-344 use that same redacted structured-result path for two already reviewed medication
histories. Medication reconciliation projects only exact current regimen-entry IDs from a current
patient-report source. Allergies/adverse reactions project exact reaction-record IDs plus explicit
overall and medication-assessment statuses. Neither assembly copies hidden records into the
binding, interprets a reported label, infers treatment safety, or owns the existing prerequisite
points. Patient-bound source-report profiles remain a later materialization dependency.

D-345 adds the parallel source-view mapping for objective positive-use inventory:
`info.history.substance-use` routes only source-reported `exposure_use_entries`. D-346 and D-347
keep focused prior medication trials distinct from the four-lane full treatment history. D-348
groups benefit, tolerability, dose position, and medication-change timing under one medication-
effects action while retaining one separate typed lane per meaning.

These assemblies still bind redacted record IDs, not player-ready record payloads. D-349 adds the
detached authoring projector that resolves only source-presented IDs through a closed per-lane
union. It preserves observed medication-trial duration and highest reported dose while omitting
the hidden `adequacy` category, objective exposure `misuseTruth`, reaction interpretation,
internal chart mappings, authoring summaries, omitted truth IDs, and source-alignment internals.
Its fingerprinted minimized result replays from the exact D-212 envelope. It is not yet attached to
D-214, `PatientInstance`, persistence, or UI; that later integration must derive rather than accept
its fields from the exact source-validated final-patient chain.

D-350 supplies that source-validation derivation seam without activating it. It accepts only a
replay-valid D-299 artifact, reconstructs each exact D-212 envelope from D-215's frozen patient
state, invokes D-349 once per validated recipe, and freezes the complete ordered projection
collection with D-299/input/output fingerprints and replay. A raw D-215 report cannot cross this
boundary. The collection remains detached from D-218/D-194/D-213/D-214 and runtime.

D-351 closes the next detached authority join. It accepts only replay-valid D-350 and D-213
artifacts for the same exact patient and complete structured-envelope set, derives D-214
mechanically, and proves every D-350 safe field projection matches the corresponding D-214 reveal
metadata, lane statuses, record IDs, and singleton values. It retains the complete D-214
attachment so instrument and target-scoped result lanes are not lost, but it still does not
modify `PatientInstance`, D-194/D-218, persistence, runtime, or UI.

D-244 keeps that qualitative contract unchanged and adds a separate strict three-outcome balance
shape. Exact approved prerequisite rules may map to zero `notTriggered`, positive `fulfilled`, and
negative `omitted` values. Native scoring `3.0.0` derives the outcome from the complete frozen
D-242 decision, while D-235 `5.0.0`/point-report v4 recomputes and verifies the nested status,
both Booleans, and selected targets. Balance shape is checked at content validation, attachment,
resolution, and replay. The authoring path is still runtime-excluded; D-252 supplies exact
balance-catalog payload fingerprinting but runtime persistence remains disabled.

D-252 compiles one minimized balance snapshot before scoring. It fingerprints the complete
validated source catalog, retains only the exact balances referenced by the compiled rubric, and
omits authoring rationale and Developer-opinion records. Native scoring derives both the player
and database-plan traces from this snapshot; generated-attempt replay verifies each row's exact
component, pre-combination magnitude, and explanation before combination and totals. This closes
same-ID/version balance drift without exposing the private authoring catalog or activating
SaveData.

The first runtime bridge from qualitative guidance is deliberately narrow.
`TreatmentWorkupRequirement` names one or more diagnosis-owned source-rule IDs, a shared workup
objective, and a constrained treatment-selection predicate. The trace retains concern and
certainty independently from provisional point values and the safety-critical flag. This permits,
for example, any medication start to activate reconciliation and reaction history while only an
antidepressant start activates prior-mania history. It is not a second diagnosis engine and it
does not let React infer prerequisites.

Reaction history and complexity profile are frozen patient-record data on this compatibility path.
Instantiation does not infer `interpretedAs` from `recordedAs`, and it does not select optional
modules or convert their budget into a scalar difficulty, care points, payout, or progression.
Current authored profiles are explicitly `budget_only`; their unused capacity is authoring
metadata, not a measured complexity score. Reviewer scenarios own these fields directly rather
than receiving clinical facts from schema defaults. Medication-reaction completeness is a
separate state from the presence of environmental or food reactions, and validation checks the
typed history against the structured result shown after purchase.
An exact selected-medication reaction can also enter a separate shared safety trace from that
frozen patient state. The result is independent of whether the corresponding history was
purchased; purchase affects workup scoring and player knowledge, not patient truth. The current
generic severity mapping is medically unreviewed provisional balance and is designed to be
superseded by more-specific reviewed medication/reaction policies.

After every domain rule has emitted its own immutable trace draft, the pure rule-combination
resolver performs the final relationship pass. Explicit `effectId` plus `specificityPriority`
selects a same-effect replacement; explicit `issueId` collapses duplicate negative consequences;
and the scorer passes the finite set of true hard contraindications and suppressible positive
treatment-base/fit rows. The resolver never reads prose, React state, source hierarchy, file
order, wall-clock time, or player knowledge. It preserves every input row with its resolution
status and original points, then component totals and safety consequences use only applied point
values. This central pass prevents catalog rules and patient-specific rules from inventing
parallel override systems.

`info.history.existing-safety-plan` retains its legacy stable ID for local replay compatibility but
now reveals the typed, Subjective `reportedSafetyPlanningAbility` state. Its structured result says
only whether the patient reports feeling able to participate; it never emits an
`outpatient-capable` conclusion. A future create-or-revise safety-plan treatment would use a
separate intervention boundary. Current disposition policies are unchanged until a reviewed rule
specifies when and how this response contributes.

Queue hydration repairs only the pre-change waiting-patient edge: when a saved slot has
`reportedSafetyPlanningAbility: "unassessed"` and its current blueprint has an authored response,
the engine re-instantiates that slot from the same blueprint and seed before eligibility and
relocation. It does not rewrite completed attempts, event histories, receipts, or review snapshots.

The launcher renders from that resolved CaseInstance—not internal case metadata—so it can show only patient name and chief complaint. Hidden diagnosis/category fields remain content and validation inputs and are never used as player-facing case labels.

Encounter commands return new values and typed `Result` failures. Stable event IDs derive from
encounter identity and event order. Purchases contain the exact structured result, fulfillment,
cost, initiator, and any upgrade savings. Live starts pass the primitive empty encounter through
`startEncounterWithAutomaticIntake`. That pure Result-returning step reads the clinic's persisted
staff configuration, intersects it with patient-available actions, and purchases each configured
action in the staff definition's stable allowlist order. The same structured result, facts, expense
ledger, and `InformationPurchased` event are used as for a player purchase; `initiatedBy` and
`initiatingStaffUpgradeId` preserve provenance. Historical replay deliberately starts from the
empty primitive and replays the recorded events, avoiding duplicate automatic purchases. Reference
policies use the automatic-start path and skip configured actions already obtained at chart
opening. The compatibility `CompletedAttempt` stores the full resolved `CaseInstance` snapshot,
clinic-at-start, events, purchases, final treatment, rule trace, receipt, content version, engine
version through flags, and persistence timestamp. This is sufficient for exact historical replay
of compatibility patients without regeneration. Generated patients instead use the separate D-235
native attempt described above; the two shapes remain isolated until the explicit SaveData
migration.

## Service, location, and eligibility boundaries

Service definitions enumerate fulfillment methods with costs and capability/location requirements.
A fulfillment method may additionally require a named owned-and-configured staff upgrade.
Investigation resolution supplies the information-action ID as context, unions location and clinic
capabilities, filters methods against location plus that exact action's staff assignment, and
deterministically chooses cost then stable ID. Generic service/capability resolution without action
context cannot activate a staff-only method; this matters because several routine histories share
one service. Equipment and staff quotes use the same resolver boundary, so store/configuration
estimates and encounter costs cannot diverge. Eligibility checks compatible location/lifetime
points, every objective required by at least one complete accepted path, medication-tag and
formulary satisfiability, intervention/disposition capability requirements, and safe
referral/transfer. Validation constructs a baseline clinic for every compatible facility location
rather than checking only the starter and Endgame overlays. Existing regimen entries remain
available to stop or explicitly continue even when their catalog medication is not stocked for a
new start. Department satisfiability becomes stricter in Milestone 4 without changing
patient-template content.

`getUpgradeOffer` is a read-only pure quote across equipment, staff, formulary, facility, and decor
catalogs. It reports blockers, current/projected service methods, per-use savings, break-even uses,
target facility/slot count, and before/after ambience where relevant. `purchaseUpgrade`
re-evaluates the same gates and atomically creates an empty persisted staff configuration when a
staff upgrade is bought. `configureStaffAutomation` is a separate pure transaction: it requires
ownership, rejects practice mode, duplicates, cross-staff collisions, nonallowlisted actions, and
more than the cataloged maximum of three, then normalizes selections to catalog order. The current
assistant's allowlist is finite and neutral; selected actions carry discounted but nonzero per-use
costs. Hiring/configuration never adds salaries, time, capacity, departments, or treatment
automation. A facility transition resolves locations and baseline capabilities declaratively while
preserving earlier purchases and staff configuration. Decor recomputes a catalog-configured
rational satisfaction curve. Purchases never reduce lifetime points, permit debt, or run in
practice modes. The browser persists the returned ClinicState through the existing SaveRepository.

The profile persists standard clinic state, mode, complete resolved queue slots, staff ownership,
and configured automatic action IDs. Configuration survives facility moves and affects only
encounters opened after it is saved. Calling queue fill twice leaves a Normal patient unchanged;
completing the slot retires its chief complaint into a bounded recent-history list before a
replacement is generated. When a facility move changes location IDs, the same resolved waiting
patient is relocated to the compatible new outpatient location rather than regenerated, and newly
available slots are then filled. Endgame is a pure derived overlay that selects the highest
declared facility/location, unions capabilities/formularies/purchases, increases approved patient
slots, and permits manual refresh. Local Developer uses the same overlay with its development
content pool. Portable Reviewer uses the overlay with its finite assignment, hides source
provenance before submission, tracks definitions already run, and permits reroll/reset. Those
derived practice clinics do not invent staff assignments, so existing reference cohorts do not
silently gain free intake. Practice settlements bank zero points. Diagnosis, source organization,
and `starter`/`transitional`/`advanced` pool metadata remain internal before submission.

This is the current SaveData v5 compatibility queue, not the D-232 target contract. Its relocation
helper may choose the first compatible location, drop an incompatible waiting case, or truncate
overflow. D-232 proves exact capacity authorization and an atomic no-reroll/no-drop facility
transition only inside the authoring boundary; queue hydration, persistence, facility purchasing,
and UI remain unchanged until a versioned SaveData/runtime migration replaces that compatibility
behavior.

This bounded intake-assistant slice currently exists on `beta`; stable `main`/Pages remains
unchanged until explicit whole-branch promotion.

Receipt feedback is persisted as `ContentFlag` and `ClinicalReviewTicket`. Guidance snapshots the
disputed receipt row and records routing, target/dependency/conflict IDs, whether clinical acumen is
required, internal status, reviewer instructions with their update timestamp, optional resurfacing
trigger, and resolution. `Needs another guideline/source` produces a `source_gap` ticket so Codex
can check existing evidence and create or update a `SourceRequest`; it does not synthesize a rule.
The UI deliberately hides the internal status taxonomy and asks only what Codex should do. It
remains a proposal queue: browser feedback never edits JSON catalogs or patient files. Developer
mode may download the queue or ask the development server to mirror it to one gitignored queue
file; that file remains a proposal bundle, not runtime content. Checked-in ticket definitions may
refresh descriptive fields and exact target IDs on reload while preserving the browser's reviewer
prose, timestamps, and resolution.

## Local authoring boundary

`content/source-docs` is outside runtime and gitignored. `content:scan` hashes local inbox bytes,
records a versioned manifest, identifies exact duplicates by hash, and quarantines unsupported or
oversized files without deletion. `content:extract` parses PDF pages, DOCX, TXT, and Markdown into
hashed `SourceDocument`/`SourceChunk` artifacts with page, leaf-section, or complete heading-path
context, then retains originals in processed/archive/quarantine. DOCX conversion disables embedded
style maps, does not read images, and reduces Mammoth-generated HTML to inert visible block text.
Text remains untrusted data. Parser-v5 chunks persist parser warnings and their total count, a deterministic
section-boundary instance, and a provenance hash over exact body and locator metadata, so repeated
headings remain distinct and retargeting is detectable. A parser upgrade never silently rewrites
old ordinal-based chunk IDs: one explicit older-parser entry may be refreshed only after every
available integrity field in its prior artifact and same-named history is validated. A private
lock, manifest fingerprint, and transaction marker prevent clobbering and recover interrupted
refreshes. Parser-v1/v2 locator metadata predates provenance hashes and cannot be retrospectively
authenticated. Every private artifact remains outside Vite and Git.

A formal publication has a second, tracked representation containing citation and lawful-processing metadata only. Known byte hashes can associate a private copy with that entry without committing its text. A public download link is insufficient when the publisher requires permission for reuse or AI use; those records remain metadata-only. Source-use records are the third layer: they state whether authority is `formal_publication` or `expert_opinion`, list every relevant formal-source ID, identify target rules, classify the contribution, and summarize how it was used.

`content:draft <request.json>` is deliberately narrower than clinical generation. It requires an explicit runtime template, verified source-document/chunk IDs when sources are cited, a new stable patient ID, an adult age range, and at least ten brief chief-complaint variants. It copies executable mechanics, resets every inherited clinical rule to unreviewed, runs schema/reference/eligibility validation, and emits a review-only patient plus blocking clinical audit tickets. It never interprets source prose or silently converts a claim into a score. `content:compile` validates all Developer patients, while `content:review` lists the local review surface.

The connected Drive folder `PsychSim documents` is a remote discovery inbox. An explicit user-requested scan lists provider metadata and stores it in a local-only manifest. Connector access and local extraction are separate trust boundaries: a Drive file must be downloaded into the protected local inbox before its bytes can be hashed and extracted by the CLI. Sources are handled one at a time for claim and impact review.

The user's SharePoint residency-article aggregate follows the same private-byte boundary but needs
one additional logical segmentation layer: one physical `SourceDocument` contains multiple
`AuthoredSourceUnit` articles, each of which can yield atomic Developer-opinion and bibliographic
candidates. A prior connector-enabled worker exported the exact native document into the protected
local inbox, and parser v5 now preserves its heading instances and locator hashes. Connector access
is session-specific: a worker can verify the current Drive listing, while a thread without the
connector can still use the already verified local bytes. Exact article prose remains private and
only reviewed, concise opinions may become tracked candidates.

Before discovery, a versioned `SourceRequest` may identify the unresolved question and its acceptable evidence. Requests are tracked under review content, registered as runtime-excluded, and validated against exact content and ticket IDs. Linking a source moves the evidence workflow forward but never changes the executable rule; a separate contribution, content version, impact scan, and clinical review remain mandatory.

The remaining Milestone 7 work adds an optional developer-side provider abstraction, explicit external-send acknowledgment, catalog-constrained clinical drafting, critic/repair passes, policy simulations, and human review. No provider package, source text, prompt, or key belongs in `apps/web`.

## Browser-only limitations

Milestone 3 remains single-device and local-only: no account sync, server recovery, collaboration,
public leaderboard, remote review queue, or review-bundle import. IndexedDB can be cleared by the
browser, and a portable reviewer must export before clearing site data or changing
device/browser/origin. Pages provides no application authentication; access control, if desired,
must be supplied outside this static app. There is no anti-cheat, server authority, or protected
economy. These are intentional product constraints, not missing backend tasks.

## Immutable local source-review packets

`tools/content-cli/src/source-review-packets.ts` bridges protected parser-v5 artifacts and fully
classified personal-knowledge revisions into the existing Developer ticket workflow without
creating a parallel clinical engine. One preparation selects exactly one review unit. For a
parser-v5 `sectionInstance`, the source-unit fingerprint covers the document text hash, parser
version, warning list/count, and every selected chunk locator, text hash, and provenance hash. For
a classified personal-knowledge revision, it covers the exact queue revision, semantic runs,
classification audit entries, and candidate record fingerprints. The public packet hash
separately covers the concise paraphrase, up to eight atomic proposals, public targets,
uncertainty/currentness/rights/boundary state, and all displayed ticket routing.

The safe feed lives under ignored `content/generated/source-review/`; exact document/chunk locators
or personal-knowledge record relationships live under ignored `content/source-docs/manifests/`.
Both are mode `0600`, validated as a one-to-one pair, and updated with rollback. The locator is a
discriminated union, so parser artifacts and classified revisions cannot be reinterpreted as one
another. Re-running the same packet is idempotent. A different packet for the same source-unit
fingerprint fails closed until an explicit supersession model exists.

The classified-revision adapter recomputes every safe proposal from the exact private opinion
candidate and rejects queue, audit, run, candidate, or safe-feed drift. It preserves one proposal
per candidate, exposes no raw title/plaintext or private IDs/hashes, and reports nearby
bibliography only as an unverified count. `private_processing_only` permits local
Developer-opinion review only; it is not a formal source-use decision and cannot produce a
portable packet, evidence contribution, executable rule, point value, approval, or runtime effect.

The Vite development server exposes the safe feed only to loopback requests. Invalid permissions,
schema, path containment, or feed contents return a visible quarantine error rather than an empty
queue. The renderer is a development-only lazy module. Player and portable Reviewer bundles,
portable exports, source text, headings, private IDs, and the endpoint are all excluded by build
gates.

## Whole-corpus Developer Database overlay

`tools/content-cli/src/developer-database-knowledge.ts` compiles the explicitly enrolled personal
corpus into a deterministic private cross-reference. The compiler authenticates source manifests,
parser provenance, chunk hashes, Apple Notes composite/attachment states, the tracked private
Drive hash catalog, semantic-workbench candidates, formal evidence, and source-use decisions. It
writes only
`content/generated/personal-knowledge/database-cross-reference.json` as a mode-`0600` ignored
file. `content:knowledge:crossref:validate` rebuilds in memory and rejects a stale fingerprint or
nonidentical deterministic output.

Projection version 2 also emits a complete catalog-identity audit. Every unresolved semantic
target is grouped into exactly one landing record and classified as a likely existing entry,
ambiguous existing entries, a proposed new catalog entry, a noncatalog target, or a target needing
kind review. All normalized terms or reviewed aliases shared by more than one catalog entry appear
in a separate overlap list. These are audit signals only: the compiler never creates an entry,
changes an alias, or merges records. An unclear landing or merge remains a developer-review
decision.

The existing serve-only Vite bridge exposes the projection at
`/__psychsim/developer-database-knowledge` to loopback `GET` requests. Missing output means “not
compiled”; invalid schema, permissions, path, or size returns a visible quarantine error. The
loader and all cross-reference rendering live in the same development-only lazy module guarded by
`import.meta.env.DEV && !REVIEWER_BUILD`. The shared Database component receives optional
renderers and search data but never imports the Developer view. Player/Reviewer bundle scanning
forbids the endpoint, generated path, and view markers. The shared complete-JSON reader and saved
`DatabaseEntryReview` snapshot remain public-only.

The same development-only module derives a concise `DeveloperDatabaseDossierBrief` for the active
entry. It preserves authority boundaries while adding unresolved cross-target candidate mentions,
candidate contribution types, resolved target roles, current implementation, and explicit
randomization gaps. The brief contains no private unit ID, source label, heading, matched term,
filename, provider/document/chunk ID, OCR text, source prose, or filesystem path.

A saved dossier interpretation reuses the existing `ClinicalReviewTicket` repository rather than
expanding the portable `DatabaseEntryReview` contract. Its stable ID combines the public entry and
a deterministic fingerprint of the exact displayed concise brief; its immutable guidance is that
brief; its resurfacing trigger retains both the entry-brief fingerprint and full source-projection
fingerprint; and its reviewer prose remains separate. A material entry-brief change produces
another ticket instead of rewriting history, while unrelated corpus or timestamp changes do not
hide the current opinion. The ticket has no runtime effect and is rejected from portable Reviewer
exports.

The serve-only ticket handoff validates the entire `ClinicalTicketExportBundle`, accepts only a
`local_developer`/null-assignment bundle from a loopback socket, verifies that its resolved parent
stays inside the repository, rejects nonregular/symlink targets, and atomically replaces the fixed
gitignored mode-`0600` file through an exclusive unique temporary file. IndexedDB remains the
authoritative save; a handoff mirror failure is a visible retry condition, not a failed browser
save.

## Local diagnosis-classification inspector

The local Developer Database exposes the ignored ICD-10-CM authoring cache through a second,
independent serve-only projection. `personal-knowledge-workbench-plugin.ts` validates the pinned
release manifest, term-catalog fingerprint and count, source-use decision, path containment,
symlink boundary, file size, and narrow local-indexing permission before returning any terms from
`/__psychsim/developer-diagnosis-classification`. It refuses to load if AI processing, derived
content, runtime redistribution, or commercial reuse has been enabled for that source decision.

The React inspector is collapsed by default and fetches only when opened. Search is bounded,
results page in small batches, and the complete reader labels a term as classification data rather
than a modeled diagnosis. It has no comment/export path and is not part of the public clinical
catalog, personal-corpus semantic pipeline, treatment engine, or scoring model. The shared
Database receives it only as an optional Development renderer. Player and portable Reviewer
bundle gates forbid its endpoint and identifying markers.

## Mania/hypomania history result boundary

D-352 adds the first exact result content behind the already-reviewed MDD antidepressant
mania-history prerequisite. The shared `info.history.mania` action owns one explicit
finding-projection horizon with eight current and eight past episodic patient-report identities.
The compact action never imports MSE observations or collapses historical state into current
state. Its universal recipe consumes only frozen finding projections, and neither the horizon nor
recipe infers an episode, diagnosis, treatment consequence, or point value.

## Psychosis-history result boundary

D-353 binds the shared `info.history.psychosis` payload to one closed projection horizon over six
current patient-report findings. It leaves MSE observations, proposition truth, belief appraisal,
and other evidence sources outside the result. The universal recipe exposes only the frozen
finding projections and does not create an aggregate psychosis screen, diagnosis, treatment
consequence, or point value.

## MDD presenting-problem result boundary

D-354 extends the existing MDD initial-assessment assembly in place. Its combined horizon owns the
two functional-impact projections plus the existing 49 depressive-symptom projections. The
presenting-problem recipe may therefore join one frozen broad current patient-report finding with
the separately typed current-episode duration, while the depressive-symptom recipe stays
finding-only. This does not merge the broad report with D-267's condition-attributed impairment
owner or add a second result framework.

## Weight, BMI, and body-habitus result boundary

D-355 extends the existing weight/BMI assembly through its already-supported
`categorical_observations` lane. The same purchased action can reveal height, weight, derived BMI,
and one independently resolved physical-exam observation, but the source records and result
bindings remain separately typed. Static validation compares the embedded observation definition
with the canonical measurement catalog and rejects a recipe that declares the lane without an
exact action-compatible definition. No numeric-to-categorical inference occurs at this boundary.

## Generated categorical-observation compiler

D-356 provides the detached generation counterpart to the authored D-309 observation compiler.
It consumes an exact definition, deterministic seed, typed context, complete versioned profile
horizon, catalog-backed clinician-observation source, and time scope. It normalizes unordered
inputs, chooses the highest-priority matching profile, selects one weighted allowed value with a
stable draw, and freezes the full replay chain. The compiler is not yet admitted to D-310,
D-320, a patient snapshot, persistence, runtime, or UI.

D-357 admits a replay-valid D-356 artifact only into the detached D-310 collection. The collection
uses a distinct generated member discriminator and retains the exact source and compilation
fingerprint; it does not relabel the value as authored. The downstream D-320 matcher remains
authored-only and ignores this new member until a separately versioned generated-observation
recipe contract is added.

D-358 supplies that separate recipe contract. D-320 now binds a generated observation only
through an explicit template member containing the exact definition, complete D-356 profile
horizon, source, and time scope. D-324 audits every member resource independently, and D-326
reconstructs the observation only from D-325's frozen seed, patient context, and source/resource
horizons. The selected profile is an output of D-356 and cannot substitute for template ownership
of the complete profile set.

D-359 proves no new downstream branch is necessary. The existing D-327 attachment, D-328
post-composition assembly, D-329 finding-pipeline boundary, and D-330 orchestration retain the
same generated compilation and resolved observation through the final frozen patient. These
layers consume typed D-310/D-320 authority and never redraw or infer provenance from the payload.

D-360 replaces one synthetic integration input with the checked-in reviewed current-MDD episode
duration profile. D-263 canonicalizes its unordered authoring arrays, selects from only the
declared options under the D-233 seed, and the existing D-294/D-328/D-200/D-240/D-330 boundaries
carry the result without a content-specific compiler branch. Exact ID/version and canonical
profile fingerprint establish catalog identity; JSON array order is not a semantic dependency.

D-361 exercises the checked-in MDD dimension profile and depressive-symptom projection/result
owners together. D-197 remains sparse-positive. D-193 receives the exact 17-definition
closed-assessment horizon plus any selected manifestation definition outside that horizon; it
does not receive every unselected MSE alternative. D-256 absence closure therefore supplies
compact history negatives without creating competing patient-generation candidates, while D-330
retains every selected positive and the complete auditable action result.

D-362 composes that D-361 finding branch with D-360's checked-in current-episode duration branch
inside one patient generated from one D-233 seed. The independently replayable D-197 and D-263
artifacts meet only through the existing D-294/D-328/D-200 composition chain. The full
presenting-problem assembly is deliberately withheld because its other member—current
self-reported functional impact—has no reviewed generation owner. A missing owner remains missing;
it never becomes an absent patient claim merely so a combined result can be attached.

D-363 extends the same shared-finding/result compilation with the exact checked-in
mania/hypomania-history horizon. A test-only combined horizon and assembly collect the independently
versioned MDD and mania components; the checked-in mania action and result recipe remain unchanged.
D-256 closes only those sixteen assessed patient-report identities after positive generation.
This is an assessment-result boundary, not a general-purpose absent-fact generator or a bipolar
inference path.

D-364 adds the parallel checked-in psychosis-history component to that combined test-only
container. Its six source-scoped current patient-report findings close independently of MSE and
proposition-evidence lanes. Exact action/recipe identity and result binding are preserved without
adding a psychosis aggregator or diagnosis inference.

D-365 demonstrates cross-action reuse rather than another truth lane. One safety manifestation
selected by the MDD D-197 profile is the same canonical finding consumed by the detailed
suicide/self-harm horizon. D-256 preserves it and closes only the remaining declared rows. The
depressive-symptoms and detailed-safety results can therefore present different reviewed views of
one frozen fact without duplicating generation or allowing display wording to drive logic.

D-366 replaces the fixture's synthetic rubric owners with the checked-in MDD decision policy,
focused regimen route, and native safety requirement. The D-191 fact index binds the requirement
to the exact resolved passive-death-wish record and exact safety action target. This composition
does not import the separate balance catalog; qualitative applicability and point magnitude remain
different compilation stages.

D-367 adds the checked-in D-338 treatment-triggered prerequisite through the existing diagnosis
adapter. The adapter expands one exact reviewed antidepressant class into five concrete medication
start targets; D-191 independently requires a trigger target and the mania-history fulfillment
action to exist in the encounter horizon. The compiled rule retains both predicates separately.
Class IDs, compatibility tags, balance records, and player selections do not cross this boundary.

D-368 uses the existing balance attachment and D-235 completed-attempt compiler after that
qualitative composition. A bounded catalog view carries only the two exact reviewed balance
records used by the proof. The compiler freezes their full payloads, derives purchases only from
successful events, evaluates the final medication selection separately, evaluates the database
plan through the same path, and persists/replays the resulting trace. Patient generation still
owns no points.

D-369 widens only that bounded balance view and qualitative candidate set by one exact direct
information requirement. The already compiled depressive-symptom action/result is the discovery
and selected-decision target; no finding count or display row becomes a scoring predicate. The
same D-235 path freezes and replays its +50/−50 balance beside D-338/D-339.

D-370 attaches the primary route's independently stored dominant balance through the same
pre-D-191 decorator. The route's count-aware treatment predicate remains owned by the medication
regimen catalog, the action horizon determines which reviewed members can be selected, and D-235
evaluates the frozen treatment snapshot. No separate generated-patient scoring path or implicit
penalty exists.

D-371 adds no compiler layer. It supplies the resulting frozen standard-mode attempt to the
existing D-235 settlement boundary, where service owners determine expenses and the economy owner
determines gross payout, the floor, and bank/lifetime updates. Clinical compilation remains
upstream and cannot read or mutate the persistent bank.

D-372 completes an existing point-free D-191 diagnostic path. Candidate adaptation may establish
that a reviewed rule is qualitatively valid while the exact generated encounter still lacks a
revealable action. The compiler reports that boundary only after matching patient scope and any
separate trigger; it does not call a result generator, alter the horizon, or infer a source report.

D-373 supplies the first real inputs to the existing D-217 → D-215 → D-299 → D-350 → D-351
structured-report path. Three authoring-only files bind the catalog-derived patient self-report
role to exact medication-reconciliation, reaction-history, and substance-use definitions. A
template-specific horizon may select each profile in fixed mode without a random draw or D-201
artifact. The existing compiler then reads the already frozen patient state, preserves its empty
or unassessed semantics, and attaches only the redacted D-214 view to the patient/encounter
snapshot. The profiles are not imported by Player or portable Reviewer runtime entries; later
runtime activation requires an exact generated-template binding and separate persistence
decision.

D-374 activates the already-defined D-272 qualifier boundary for the generated MDD proof. Its
catalog instance freezes one exact optional MDD family choice; completed-attempt compilation joins
that horizon to the exact checked-in diagnosis owner and never derives the player's submission
from hidden condition truth. The same end-to-end attempt boundary requires every nested authoring
artifact to be losslessly JSON-safe, so a fixed source-report selection omits the absent D-201
artifact field instead of storing `undefined`. No diagnosis scorer, persistence migration,
runtime route, or UI is introduced.

D-375 exercises the attached D-373 results through D-239/D-242/D-235 rather than adding a
parallel encounter path. Purchasing a structured history only references its frozen result
binding, derives the exact least-cost service quote, and records one immutable event. It neither
generates nor mutates the underlying patient state. The same replay snapshot carries the optional
D-374 diagnosis selection with no diagnosis balance.

D-376 verifies the separate authoring persistence boundary over that attempt. The wrapper owns
only completion time and a record fingerprint; its embedded D-235 attempt remains independently
replay-valid and losslessly JSON-safe. Browser persistence, SaveData migration, queue ownership,
review export, and UI remain outside this checkpoint.

D-377 supplies D-234's exact handoff from completed-attempt replay to future slot lifecycle
mutation. The completion proof verifies and fingerprints the attempt, terminal event, waiting
slot, patient payload, and template payload together. It remains an immutable detached artifact;
no slot is vacated or refilled at this boundary.

D-378 applies that proof through the existing D-234 `complete_encounter` transition. The location
slot becomes empty and one bounded history entry retains the exact completed patient and attempt;
the attempt is not reduced to a summary or regenerated from a seed. Canonical refill remains a
separate operation because the next patient must be compiled from the post-transition occupancy,
recent-completion context, and next fill ordinal. A generic refill fixture cannot stand in for
rebuilding that seed-dependent clinical payload.

D-379 keeps functional-impairment identity separate from how a reviewed profile varies it. The
existing D-267 profile may remain neutral/unweighted or carry one explicit complete categorical
mass policy. The resolver, rather than a caller, normalizes mass into auditable probabilities and
performs the seeded draw. A weighted policy also pins source kind, time scope, and allowed care
settings, and the request must match all three before selection. Different evidence populations
remain different profile owners; neither the compiler nor catalog order pools or transports their
distributions. No source observation becomes runtime content merely because this weighted
boundary exists.

D-380 deliberately uses the separate D-198 background-finding lane rather than D-267. One reviewed
outpatient-MDD profile resolves broad current patient-reported functional impact from a complete
binary mass table and joins its minimized reveal with current episode duration in the existing
presenting-problem assembly. The source aggregate, source-use decision, and Developer-opinion
transportability bridge remain distinct owners. Condition-attributed impairment and severity
therefore stay absent rather than being inferred from a general difficulty report.

D-381 adds a developer-only read boundary over PsychSimDataAdjunct. The command reads coordination,
Git, packet, review, evidence-bundle, and mapping-proposal state and emits deterministic hashes. It
does not import a sibling package, modify either worktree, or participate in build/runtime. The
inventory makes changing adjunct state visible without converting packet review status into
PsychSim source use, clinical approval, or runtime authority.

D-382 replaces hand-maintained medication identity imports with a checked-in generated static
index whose source is still one explicit file per ingredient. The authoring intake manifest pins
NLM RxNorm release and exact active ingredient tuples; online refresh is required before creating
missing files, while normal validation is offline. The index synchronizer verifies disk, static
imports, and registry membership as one set. Neither tool scans at runtime. Multi-ingredient
products remain outside this ingredient model until a separate formulation/composition owner is
defined.
