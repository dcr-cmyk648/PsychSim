# Milestone roadmap and gates

Work proceeds one milestone at a time. Completing a gate does not authorize starting the next milestone.

## Milestone 0 — Product and architecture contract (complete)

Delivered: contributor contract; game design; architecture; scoring/economy; content model; ingestion and review designs; roadmap; decisions; repository/command conventions; protected authoring folders.

Gate: documents agree on no virtual time, deterministic browser play, one visible point unit with itemized clinical and financial subcalculations, positive progression, static reviewed content, and source privacy. Root commands and boundaries are discoverable.

## Milestone 1 — First playable clinical vertical slice (complete)

Delivered: strict versioned schemas including rule-level review records; deterministic seeded instantiation; atomic finding sets; one-file-per-test contextual generation with UCUM units and EMR-style reference-interval display; pure encounter/points/economy/service/replay/eligibility/queue logic; starting solo office; one playable medically unreviewed MDD starter case with one broad primary medication-tag pathway plus one review-only engine fixture; a 38-option universal information catalog with immediate case-specific results; searchable structured treatment UI; itemized all-points receipt and full trace; durable Normal/Endgame/Developer queues; local profile/attempt/flag/ticket persistence; Developer whole-case review notes with immutable attempt/all-option snapshots; reviewer notes, developer ticket triage, automatic fixed-path Codex handoff mirror, and JSON export; content validation; four executable starter policies; unit and Playwright coverage.

Gate: one complete case plays opening-to-receipt; reload preserves profile/attempt/patient slot/tickets/Developer attempt reviews; same seed/history is deterministic; a whole-case review preserves every offered option and exact choices; tests prove complaint variation, criteria-constrained findings, immediate results, costs, nonrepeatability, negative-test credit, indicated reward above cost, omissions, waste, fit modifiers, alternative paths, discontinuation, dangerous combination, path-specific requirements, zero-floor settlement, service independence, reference ordering, Developer-content isolation, and AI/source bundle isolation; lint, typecheck, tests, e2e, validation, and production build pass.

## Milestone 2 — First clinic-building loop (complete)

Delivered: a data-driven hub store; pure read-only upgrade quotes and atomic purchases; persisted upgrade/equipment/capability/formulary ownership; a 1,200-point outpatient ECG machine with automatic 500-point outside versus 70-point in-house resolution, receipt savings, three-use break-even, and unchanged clinical trace; an 800-point additive outpatient formulary expansion; start-medication filtering by effective location/clinic formulary; a second approved-for-prototype, fictional, synthetic, medically unreviewed ECG-relevant patient; source-use metadata; two sets of four executable policies; catalog/registry/gate validation; before/after economy reporting; unit, component, persistence, and browser coverage.

Gate: purchases are voluntary, reject debt and duplicates atomically, preserve lifetime points, persist after reload, and use declarative facility/prerequisite fields; before/after ECG reference runs have identical 1,140 care points and rule trace while cost changes from 630 to 200 and payout rises by 430; cards show cost, prerequisites, facility/department gates, current/projected methods, per-use savings, break-even, and capability/patient effects; every approved patient validates against the unequipped starter clinic; policy simulations preserve safe external fulfillment and starter-formulary treatment paths. No department construction, decor multiplier, source extraction, or AI drafting was added.

## Milestone 3 — Progression and environment (complete)

Delivered: explicit starter/transitional/advanced patient-pool metadata; a one-slot solo office, two-slot outpatient clinic, and three-slot multidisciplinary center; 2,500/7,500 lifetime-point thresholds with separate 1,800/5,000-point facility purchases; declarative facility locations and allowed purchases; waiting-patient relocation without regeneration; preserved prior equipment/formulary/decor; a separate decor catalog with plant, artwork, and warm-lighting visuals; a rational diminishing-return satisfaction curve capped at 1.15×; store multiplier previews; positive-reward-only ambience settlement; Endgame decor unlocks; and eligibility/validation across complete workup, medication, intervention, disposition, and every compatible facility location.

Gate: unit/component/browser tests prove lifetime eligibility does not grant ownership, balance spending leaves lifetime progression unchanged, facility/decor purchases are atomic, prior ECG ownership survives a move, waiting patients persist while slot count grows, decor visibly persists after reload, diminishing returns remain under the catalog cap, care-point traces remain identical, and unsafe play remains unprofitable. Both approved patients remain available through safe external services at all declared Normal locations; the starter pool remains repeatable. No departments or new clinically inferred patients were added.

## Pre-Milestone 4 — Diagnosis/composition and generated-patient engine

Delivered foundation: one file per diagnosis family; shared → severity → specifier composition;
qualitative recommendation stances; constrained patient/treatment context predicates; deterministic
gameplay-critical context dimensions that keep findings and fit tags aligned; bounded
multi-diagnosis authoring; conservative conflict quarantine; multidimensional complexity; reference
and provenance validation.

Additional delivered slice: the 2023 WHO mhGAP guideline is cataloged and locally extracted under
the protected source boundary; depression DEP1–DEP4 has exact chunk provenance,
recommendation-level Developer tickets, and one deterministic medically-unreviewed source-linked
MDD scaffold. A receipt can flag `Needs another guideline/source`, producing a local source-gap
ticket. None of these records activates shared clinical guidance.

Portable review checkpoint: an explicitly allowlisted, medically unreviewed common-psychiatry
assignment compiles ten separate patient scenarios (five MDD decision states plus GAD, bipolar
depression, acute mania, schizophrenia relapse, and PTSD) through eight shared provisional
decision policies. The separate static Reviewer artifact includes mobile workspace tabs,
mobile-only immediate-result dialogs, newest/oldest reveal ordering, read-only post-submit context,
near-top general feedback, reopenable completed receipts, an assignment-versioned IndexedDB, and
one version-5 export containing multiple completed attempts/reviews/flags/tickets. GitHub Pages
deploys this finite Reviewer artifact from `main`; it does not include the local Developer glob,
source/opinion queues, ticket discovery, writer endpoint, source bytes, or AI tooling. Assignment
`2026-07f` additionally includes one exact finite packet of ten patient-linked review questions.

Portable review gate: every scenario passes schema, registry, reference, semantic eligibility, and
four-policy ordering checks in the all-capabilities Reviewer clinic; ordinary Player and Reviewer
bundles pass separate isolation scans; local Chromium phone tests at 390 px and 320 px plus a
required CI iPhone/WebKit run prove immediate results, tab navigation, no horizontal overflow,
post-submit Results selection, reload/reopen recovery, two distinct completed cases, persistence,
and one combined exact export. The cohort remains medically unreviewed, and remote bundle import,
historical re-scoring, and rubric editing remain Milestone 5 work.

Phone hub follow-up: at the mobile breakpoint, the finite patient queue is one contained
horizontally scrollable row with a visible next-card edge and focus-driven keyboard scrolling. The
page itself retains no horizontal overflow. The collapsed `Review tickets` launcher remains visible
below the compact hub, reports how many assigned questions need input, and opens each question in
the existing full-screen phone dialog. This avoids replacing one long patient page with ten
simultaneously expanded rule audits.

Database-browser checkpoint: desktop and mobile hubs open one shared read-only, searchable
Database screen. It presents a schema-minimized public projection of modeled conditions,
medications, interventions, dispositions, investigations, tests, and formal bibliography, with
collapsed records and logical catalog locators. It explicitly excludes patient answer keys,
points/rules, review tickets, private sources, and the authoring-only ICD cache. Component,
runtime-boundary, desktop Player, and phone Reviewer tests keep those exclusions executable. This
is catalog inspection, not a filesystem API, comprehensive diagnostic manual, or Milestone-5
rubric editor.

Follow-up beta checkpoint: Reviewer symptom duration is now structured numeric/unit case state with
short swappable displays and deterministic replay. Current ranges only support the already-authored
episode state; cyclothymia threshold discrimination remains a source/clinical-review ticket rather
than inferred behavior. Non-GAD Reviewer patients may show at most one deterministic background
anxiety finding, exercising subthreshold variation without creating a diagnosis or changing the
rubric. Finding rows display explicit outcome chips and grouped positive/negative states. Receipts
use one responsive care-point meter and expose attempt-persisted rule provenance in every trace.
The material cohort revision is namespaced as
`reviewer-assignment.common-psychiatry.2026-07f`.

Progression follow-up: a 900-point Clinical intake assistant, gated at 600 lifetime points, can
automatically administer up to three selected routine checklist/medication-history actions. Each
uses the ordinary immutable purchase/event path at a discounted but nonzero action-specific cost
and earns exactly the same clinical evaluation as manual fulfillment. This slice adds no
department, salary, capacity queue, virtual time, or automatic treatment decision, so it does not
begin Milestone 4.

Distribution follow-up: an explicitly authorized bounded pre-Milestone-8 slice adds a stable iPhone
Home Screen manifest/icon set and in-app installation guide. Every promoted `main` build emits its
exact commit SHA as `version.json`; installed copies check on launch, foreground, reconnection,
interval, and demand, then offer a safe cache-busting reload without clearing IndexedDB. There is
deliberately no offline service-worker cache, background sync, or automatic mid-case reload. Full
PWA/offline/performance hardening remains Milestone 8.

Medication/intervention authoring checkpoint: the target background database now separates
normalized identity and regulatory facts, structured evidence claims, Developer opinions,
executable clinical rules, and point balance. Public RxNorm/FDA/NLM sources form the preferred bulk
factual scaffold; comparative evidence and guidelines remain separately scoped. Proprietary
references are human-only absent permission, and psychotherapy manuals are not copied. This is a
documented boundary only: no medication importer, therapy migration, clinical claim, or scoring
change has been implemented.

DrugCentral is now registered as an authoring-only `structured_database` seed under a restrictive
initial CC BY-SA gate: local deterministic indexing and unreviewed derived candidates are allowed,
while AI-assisted processing and runtime/commercial redistribution remain blocked pending an
isolated ShareAlike package. Evidence precedence is specified as claim- and question-specific
rather than one pyramid score. The user's private residency-article aggregate is designed as one
physical source containing many dated logical article units and atomic Developer opinions; no
SharePoint bytes have been imported.

Clinical-record and encounter-economy follow-up: medication-list certainty now distinguishes
unreconciled, verified-none, and provided states; focused medication reconciliation remains
distinct from full structured treatment history; weight/BMI remains distinct from body habitus;
and selected service-backed interventions can incur separately itemized treatment operating costs
without changing clinical correctness. The starter MDD reference policies now intentionally tie
the database and strong-alternative medication baselines, with patient fit evaluated separately.

Remaining scope before complex generation: source-controlled patient templates that compile the
existing typed facts, internal condition/chart, regimen, prior-trial, and treatment-history records
into complete deterministic patient and encounter instances; sourced decision-policy nodes;
focused decision horizons; patient-family-owned optional-comorbidity selection; a conflict taxonomy
that preserves valid clinical tension; versioned patient-specific overrides; medication
identity/evidence/opinion schemas; claim-specific evidence-body resolution; logical authored-source
units and opinion/evidence relationships; and one source-cleared, tightly scoped medication import
proof before broad catalog expansion.

Gate: the runtime behavior and reference baselines recorded at this checkpoint remain stable through
the next schema split; old snapshots replay through a versioned migration; unsourced severity
cannot generate; the same template and seed reproduce the
same complete patient/regimen/trial state; duplicate medications are independently addressable;
chart claims do not automatically activate internal-condition rules; only decision-relevant
positive rules plus global safety rules enter a focused encounter; every generated encounter has
accessible questioning/workup and a safe best-next-step route; structural invalidity quarantines
while clinical/evidence/balance conflicts remain distinguishable; no point mapping, department
work, or new clinical recommendation is invented. Templates may use a provisional multidimensional
target envelope, but complexity-to-level display and progression mapping remain disabled until
reference-patient testing supports them.

## Milestone 4 — Departments and broader services

Scope: outpatient area, ED, consultation-liaison, inpatient; construction; department equipment/cases; disposition capabilities; location-specific formularies.

Gate: case/location validator proves safe workup, acceptable treatment, and safe disposition; department gates are declarative; unavailable global-best treatments always have formulary-safe or referral alternatives; outpatient content persists at later tiers.

## Milestone 5 — Content review and authoring tools

Status: two additional bounded precursor slices are delivered without claiming the milestone
complete. Developer queues now mount as collapsed decision packets with explicit patient/attempt
links. One packet may show a validated, unreviewed literature-synthesis proposal that separates
source-cleared support from metadata/abstract-only context and leaves the psychiatrist's
plain-language response authoritative. No proposal edits a rule, assigns points, or grants
approval. A separate literature-scout precursor now gives every active checked-in Developer ticket
a bounded ten-year meta-analysis search profile or an explicit exemption. Its one-ticket refresh
records relevance-first citation ranking and abstract-only discovery context without creating
formal evidence, changing ticket status, or entering Player/portable Reviewer bundles.
A further local-only precursor adds a collapsed read-only personal-knowledge dossier projection.
It separates candidate opinions/bibliography from current runtime balance and offers no apply or
approval control.

Scope: build on the Milestone 1 proposed-ticket queue with exact attempt replay; review inspector; dependency/conflict and supersession workflows; rubric editing; historical comparison/re-score; JSON bundles; reference-policy simulations and QA reports; generated content indexes.

Gate: historical records are immutable and reproducible; current-engine comparisons are labeled;
rubric edits create versions; flag statuses/audit metadata persist; imports are schema/size
validated; no unreviewed case silently reaches the ordinary Player artifact. A finite portable
Reviewer assignment remains an explicitly labeled, exact-allowlist exception rather than a
clinical or lifecycle approval.

## Milestone 6 — Source-document ingestion

Status: bounded local slices were delivered by explicit follow-up after Milestone 2. The general
pipeline includes SHA-256 manifests, exact-duplicate retention, PDF/DOCX/TXT/Markdown extraction,
hashed chunks with page/section context, watch mode, quarantine, privacy guards, a
one-file-per-formal-source evidence catalog, explicit contribution records, Expert-opinion fallback
labels, evidence auditing, tests, and source/review listing commands. A macOS Apple Notes adapter
adds a metadata-only audit plus an explicitly acknowledged local sync for the exact
`Psych research` folder. The sync uses the public Notes scripting boundary, protected private
directories, local Vision/PDFKit OCR, per-note checkpoints, stable provider provenance, attachment
hashing/deduplication, and the ordinary source queue. It never edits Notes or transmits content.
Full source review, claim extraction, broader remote-file byte transfer, and completion of every
Milestone 6 gate remain open. The first acknowledged private sync now preserves and extracts all
204 note title/plaintext records, locally OCRs 116 accessible attachments, records one unsupported
attachment, and quarantines seven attachment-save failures without discarding their note text.
None of this creates evidence claims or executable content.
A bounded title/plaintext-only semantic queue now supports one tracked topic and one complete
source revision at a time, with segment-complete coverage, strict private import, and aggregate
status reporting. Lexical matching only queues candidates; HTML, OCR, attachments, composites, and
bulk-corpus semantic processing remain outside this slice. Candidate output cannot affect evidence,
rules, points, or approval.

Scope: SHA-256 scan/manifest/duplicates; PDF, DOCX, TXT, Markdown strategy; extraction/chunks; watch; processed/quarantine; provenance; privacy controls; source review.

Gate: idempotence and crash recovery; exact duplicates detected by hash; failures retained; parser versions recorded; malicious/instructional text remains inert; secrets/PHI warnings; raw/extracted/manifest material is ignored and absent from production; no external transmission.

## Milestone 7 — AI-assisted drafting

Status: one non-AI precursor is delivered. An explicit scaffold request can create a playable,
medically unreviewed Developer patient from a named template, verified local source references,
controlled presentation variants, and proposed shared impact IDs. It deduplicates provenance,
resets inherited rule reviews, and emits blocking audit tickets. The WHO-linked MDD scaffold proves
the local workflow. It does not infer clinical claims, call a provider, perform critic/repair, or
approve content.

Scope: provider abstraction and mock; optional explicit external provider; constrained structured single-case draft; critic and repair; provenance; external-send confirmation; deterministic validation and policy bots; human approval gate.

Gate: gameplay works without provider/key; browser has no SDK/key/call; all outputs begin unreviewed; catalogs constrain every ID/unit/route/predicate; transmission requires acknowledgment; provenance/critic/repair preserved; AI cannot approve content; bulk generation remains disabled.

## Milestone 8 — Scale and hospital progression

Scope: larger catalogs and case families; remaining facility tiers; psychiatric hospital/integrated center; owned laboratory/imaging including late MRI; specialties and challenges; broader decor; offline/service-worker and broader PWA/performance hardening beyond the delivered install/update shell.

Gate: batch validators and seed/property tests scale; every location/case is winnable; content review throughput is measured; challenge cases are clueable; offline/static performance budgets pass; migrations preserve saves and historical reviews.
