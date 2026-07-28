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
approved JSON catalogs + patient template
                 │ Zod parse + reference validation
                 ▼
        content-runtime static bundle
                 │
                 ▼
 diagnosis/decision composition + deterministic constraints
                 │
                 ▼
 patient instance → encounter compilation → pure encounter engine
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

The private authoring database is deliberately richer than the runtime graph:

```text
private notes + authored material + formal sources
                       │
       source-owned, provenance-preserving units
                       │
 topic owners + generated dossiers + gaps + disagreements
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
extraction, local indexing, AI processing, derived clinical content, redistribution, and commercial use. The next schema
version adds typed facts/derivations, internal condition states, separate
chart diagnosis entries, medication-regimen entries, structured prior trials, decision policies,
patient templates, and frozen encounter instances without reinterpreting old snapshots. Upgrade
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
profile validates only optional-feature richness and a five-axis envelope; it is not a score, tier,
progression gate, or economy configuration.

`@psychsim/engine` owns top-down diagnosis and decision-policy composition, typed-fact derivation,
conflict reports, constrained patient generation, focused encounter compilation, deterministic
clinical-context/demographic/finding/test variation, service resolution, effective-formulary
calculation, atomic upgrade/facility/decor offers and purchases, deterministic satisfaction
calculation, persistent queue construction/relocation, encounter commands, predicate evaluation,
points-only progression overlays, care-point evaluation, economy, receipts, replay, and
eligibility. Diagnosis composition is qualitative and point-free. It has no React import, browser
global, network call, wall-clock decision, mutable singleton, or runtime AI.

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
abstract-only paraphrases. Validation requires every active checked-in Developer ticket to have
profiles or an explicit exemption. Only the dynamically loaded local Developer module imports the
catalog; Player and portable Reviewer builds do not. No browser network call, runtime AI, rule
mutation, or evidence approval results from scouting.

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

`instantiateCase(blueprint, seed, catalogs)` hashes `blueprint ID + seed + stable generator ID`. It resolves only declared choice, catalog-choice, weighted-choice, integer/decimal range, text-template, reviewed clinical-context options, constrained finding selection, and per-test generators. No arbitrary code and no `Math.random` are allowed. Clinical-context options are critical: the selected option and its tags are saved, and its present/absent bindings are materialized into the same structured findings a player can reveal. Cosmetic variants cannot change those rules. Criteria-bearing finding sets declare minimum/maximum positives and required present/absent IDs. A test definition chooses the highest-priority matching profile from declared age, sex-for-reference, diagnosis, and resolved clinical-tag context. Unspecified numeric values may vary only inside catalog-defined normal or mild incidental ranges and cannot change the rubric. Results retain UCUM units, structured low/high interval bounds, source/population labels, and derived normal/high/low interpretation. The saved CaseInstance stores the internal seed and every resolved value; the UI never displays the seed.

Diagnosis files are composed separately from patient instantiation.
`composeDiagnosisGuidance` applies base, severity, specifier, and other active-diagnosis rules,
derives tags and a five-dimensional complexity vector, and returns stable blocking conflicts. It
never assigns points or chooses a source winner. The next compiler narrows that conservative
checkpoint: structural invalidity/no-safe-route states quarantine; a reviewed safety constraint may
govern valid clinical tension while both rules remain traceable; evidence disagreement stays
disabled behind a ticket; and balance disagreement remains outside qualitative guidance. That
compiler consumes internal conditions rather than chart claims, addresses regimen entries
independently, measures the resolved patient against a provisional template complexity envelope,
and limits positive guidance to the focused decision horizon while retaining global
safety/interaction rules. See
[DIAGNOSIS_ENGINE.md](DIAGNOSIS_ENGINE.md) and
[PATIENT_GENERATION_ENGINE.md](PATIENT_GENERATION_ENGINE.md).

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
opening. A CompletedAttempt stores the full resolved case snapshot, clinic-at-start, events,
purchases, final treatment, rule trace, receipt, content version, engine version through flags, and
persistence timestamp. This is sufficient for exact historical replay without regenerating a
patient.

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
