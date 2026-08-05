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

The current dependency-readiness inventory and ordered blocking queue are maintained in
[ENCOUNTER_GENERATION_DEPENDENCIES.md](ENCOUNTER_GENERATION_DEPENDENCIES.md). Patient generation
remains disabled until one complete general slice passes that gate.

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
one version-7 export containing multiple completed attempts, case reviews, database-entry
reviews, flags, and tickets. GitHub Pages
deploys this finite Reviewer artifact from `main`; it does not include the local Developer glob,
source/opinion queues, ticket discovery, writer endpoint, source bytes, or AI tooling. Assignment
`2026-07g` additionally includes one exact finite packet of ten patient-linked review questions.

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

Database-browser checkpoint: desktop and mobile hubs open one shared searchable Database screen.
It presents a schema-minimized public projection of modeled conditions, 33 normalized medication
identities (subsequently expanded to 52 identity records without expanding gameplay),
interventions, dispositions, investigations, tests, and formal bibliography. Each
record opens in a dedicated full reader. Developer and portable Reviewer can save/export a prose
comment with the exact safe entry snapshot; Player remains read-only. It explicitly excludes
patient answer keys, points/rules, private sources, and the authoring-only ICD cache. Component,
runtime-boundary, desktop Player, and phone Reviewer tests keep those exclusions executable. This
is catalog inspection and review, not a filesystem API, comprehensive diagnostic manual, or
Milestone-5 rubric editor.

Follow-up beta checkpoint: Reviewer symptom duration is now structured numeric/unit case state with
short swappable displays and deterministic replay. Current ranges only support the already-authored
episode state; cyclothymia threshold discrimination remains a source/clinical-review ticket rather
than inferred behavior. Non-GAD Reviewer patients may show at most one deterministic background
anxiety finding, exercising subthreshold variation without creating a diagnosis or changing the
rubric. Finding rows display explicit outcome chips and grouped positive/negative states. Receipts
use one responsive care-point meter and expose attempt-persisted rule provenance in every trace.
The material cohort revision is namespaced as
`reviewer-assignment.common-psychiatry.2026-07g`.

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
normalized identity and regulatory facts, source-owned contribution units, topically owned
relationships, Developer opinions, executable clinical rules, and point balance. Public
RxNorm/FDA/NLM sources form the preferred bulk
factual scaffold; comparative evidence and guidelines remain separately scoped. Proprietary
references are human-only absent permission, and psychotherapy manuals are not copied. The current
identity catalog has 125 pinned RxNorm ingredient records: 13 runtime-compatible and 112
identity-only. It includes required public attribution/currentness disclosure and does not change
formularies, treatments, clinical claims, or scoring. The official NLM-refresh-gated intake and
generated static-index verifier are implemented; multi-ingredient/formulation ownership, therapy
migration, and the remaining knowledge layers are still open.

DrugCentral is now registered as an authoring-only `structured_database` seed under a restrictive
initial CC BY-SA gate: local deterministic indexing and unreviewed derived candidates are allowed,
while AI-assisted processing and runtime/commercial redistribution remain blocked pending an
isolated ShareAlike package. Evidence precedence is specified as proposition- and question-specific
rather than one pyramid score. The user's private residency-article aggregate is one protected
physical source containing many dated logical article units and potential atomic Developer
opinions. Its exact bytes are downloaded, hashed, and structure-aware extracted; no semantic unit,
opinion, clinical rule, point value, or runtime content has been incorporated.

Clinical-record and encounter-economy follow-up: medication-list certainty now distinguishes
unreconciled, verified-none, and provided states; focused medication reconciliation remains
distinct from full structured treatment history; weight/BMI remains distinct from body habitus;
and selected service-backed interventions can incur separately itemized treatment operating costs
without changing clinical correctness. The starter MDD reference policies now intentionally tie
the database and strong-alternative medication baselines, with patient fit evaluated separately.

Remaining scope before complex generation is dependency-first. Author the smallest coherent
general foundation for stable identity/ownership/provenance; reusable history, symptom, function,
safety, substance, MSE, physical, vital/measurement, reaction, regimen, prior-trial,
treatment-history, demographic/context, internal-condition, and chart-diagnosis state; laboratory,
panel, reference-interval, imaging/electrical/instrument, reveal-action, service, medication,
therapy, and disposition owners; diagnosis/intervention relationships; sourced decision policies;
focused rule and balance compilation; and only then source-controlled encounter recipes,
deterministic patient/encounter instances, optional-comorbidity selection, replay, persistence, and
cohort calibration. A diagnosis dossier may be drafted early to discover missing dependencies, but
it does not bypass this gate or own encounter setting, difficulty, time, or complexity.

Structural checkpoint D-194 now proves the target template/patient/encounter attachment with
synthetic already-resolved inputs, exact location/horizon/result/finding/rubric fingerprints, and
no compatibility or runtime activation. D-195 adds the separate point-free template
presentation-richness envelope and exact frozen-state evaluator; shortfalls remain nonblocking and
have no generation or scoring authority. D-196 adds a standalone exact-template condition profile
and deterministic, without-replacement required/optional selector with complete draw, binding,
provenance, incompatibility, and integrity traces. Its weights are game variety only, and the
selector remains authoring-only. D-197 adds the separate exact-state condition-finding lane:
reviewed fixed outcomes, simple raw cardinality groups, and D-248's constrained
dimension-then-manifestation profiles emit exact D-193 diagnostic/cardinality candidates while
preserving every selected/unselected mapping, requirement, unbound condition, draw, and provenance
record. It adds no real clinical profile, background/soft-tendency aggregation, diagnosis
inference, or scoring. D-198
adds the bounded exact-finding background profile and deterministic lowest-priority outcome
selector, retaining all offered weights/values and exact D-197/horizon/profile/provenance traces.
It contains no real outcome rates or context-sensitive aggregation. D-199 adds the authoring-only
complete categorical contributor profile and additive soft-tendency aggregator: nonnegative
synthetic mass is pooled over one exhaustive mutually-exclusive outcome set, normalized once,
redrawn deterministically, and emitted as one D-193 weighted candidate with full audit trace.
D-200 adds the authoring-only finding-pipeline audit composer: it validates and retains the exact
resolved-condition-source-through-D-199 chain, assembles one collision-free D-193 candidate union,
retains and replays the complete D-193/D-194 request, and freezes either the verified snapshot or
the literal hard-conflict audit without spending the template-owned complexity budget. D-201 adds one authoring-only
optional-feature selector over that hard maximum, with explicit feasible-count selection,
remaining-budget/incompatibility look-ahead, complete selected/unselected trace, and no clinical
payload. D-275 preserves the historical three-module/six-unit v1 envelope and adds the versioned
baseline-plus-additional v2 contract for up to 24 independently traced optional modules, granular
one-to-twelve exact-template costs, and an unchanged required-state baseline. None of those values
becomes difficulty, points, eligibility, or reimbursement. D-276 adds a migration-safe,
versioned qualified-result semantic envelope so a resolved categorical value retains a separate
normal/abnormal/neutral/indeterminate interpretation instead of overloading binary outcome labels;
the first application corrects Reviewer-cohort adherence display data without creating a rule or
point value. D-277 adds a migration-safe exact-record subject to medication-related compatibility
findings, validates it against the containing regimen or prior-trial snapshot, and preserves it
through deterministic instantiation without parsing labels or prose. D-278 adds one sparse,
source- and time-scoped current-medication reported-benefit owner for an exact regimen entry,
keeps explicit no benefit distinct from assessed-but-unknown and absent-record semantics, and
provides a point-free structured reveal/decision-fact boundary without inferring adequacy,
causality, rules, or points. D-279 reuses the separate medication-tolerability record in
compatibility patient/scenario state, validates its exact current-regimen or prior-trial subject,
and projects its unknown/absent/present status without adding incidence probabilities, causality,
rules, or points. D-280 adds a separate sparse exact medication-change temporal record, validates
native versus compatibility target ownership, preserves source and both time scopes, and updates
the review-only restlessness projection to identify the exact changed aripiprazole entry without
adding dose amount, causality, diagnosis, probabilities, rules, or points. D-281 adds a sparse
exact-current-regimen `below_maximum`/`at_maximum`/assessed-`unknown` dose-position owner, a closed
source-view lane, and point-free exact-subject decision facts without defining medication
maximums, doses, adequacy, treatment correctness, rules, or points. D-282 adds a standalone
rights-neutral complete/partial instrument-administration record and optional bounded authored raw
total without adding real instrument content, calculation, interpretation, rules, or points.
D-283 adds the standalone exact-D-220 administration compiler, fingerprints, and replay proof
without attaching the administration to runtime or changing those limits. D-284 adds an
independently verified, strictly minimized administration projection that redacts item/source
audit and remains unattached to patient/runtime state. D-285 adds a standalone exact
patient/action/item-response admission proof without widening `PatientInstance` or runtime.
D-286 derives that proof from an exact verified catalog snapshot and preserves replay without
mutating it. D-296 advances both attachment compilers to `2.0.0` and makes the exact D-293
respondent-source proof their sole administration input, rejecting raw D-283 without adding
instrument interpretation or runtime attachment. D-297 separately advances D-269 to `2.0.0` and
requires an exact D-291 source-instance proof for its standalone D-267 impairment input without
enabling severity or attaching it to runtime. D-298 independently validates every source-bearing
value that D-240 actually projects against a same-patient D-291 horizon and carries only the
existing target-redacted reveals forward, without changing D-194/D-213/D-214 or runtime.
D-299 independently validates every selected D-215 source-view profile against a same-patient
D-291 horizon and retains only its detached D-212 recipes, again without changing catalog or
runtime attachment. D-300 advances D-291 to a reusable source-role ID whose patient ownership
remains enforced by the exact horizon, allowing future static profiles to bind before a patient is
generated without sharing patient evidence. D-301 then audits every opaque source reference in one
complete D-208 composed state. D-304 advances that audit to `2.0.0` and moves measurements,
categorical observations, and structured tests onto explicit typed source references, so every
current lane now requires exact kind equality. D-305 then provides the authoring-only,
catalog-fingerprinted adapter from D-303 to a derived same-patient D-291 horizon. D-306 then
compiles one exact numeric test profile, patient context, seed, interval owner, and catalog-backed
laboratory source into a frozen typed result. D-307 supplies the complementary exact authored
profile/result-contract path for patient-owned numeric, categorical, binary, imaging, and
electrical results. D-308 adds the parallel exact authored measurement-value profile/compiler,
proven across all nine current measurement definitions with synthetic fixtures while retaining
`not_interpreted`. D-309 adds the exact authored categorical-observation profile/compiler with
empty interpretation, proven only with synthetic MSE/physical definitions while the real catalog
remains empty. D-310 verifies those four result owners under one exact patient/source horizon and
emits one canonical duplicate-free detached collection. These result owners remain detached from
runtime. D-311 separately attaches that exact collection to the three empty result lanes of one
replay-valid D-208 composition, produces a newly fingerprinted authoring state, and rejects any
caller-authored result merge. D-312 then composes that result branch with an optional
source-validated D-294 duration branch under their exact common D-208 root, without permitting an
arbitrary state merge. D-313 advances D-200 to `25.0.0` and makes the nullable replay-valid D-312
artifact its sole post-composition input, preserving the D-208-only route and passing the
assembled state into unchanged D-194 without activating runtime content.
D-314 advances the same seam without adding another snapshot: `ResolvedPatientState` gains an
exact functional-impairment lane, D-312 `2.0.0` admits only source-validated D-292 impairment
records alongside D-294 duration and D-311 results, and D-200 `26.0.0` carries the assembled state
through D-194 while auditing every nested D-267 draw against the D-233 seed. D-301 `3.0.0`
independently covers the new source-bearing lane. A real impairment profile, player-facing
result, clinical interpretation, persistence, runtime activation, and scoring remain later gates.
D-315 advances D-240 and D-298 to `2.0.0` and proves the neutral player-safe projection seam for
those already-attached impairment records. One future reviewed definition may bind an exact
condition/profile/source/time value to an exact action; the authoring value retains full
target/profile/option/source identity while the safe value retains only level, source kind, and
time scope. The existing D-213/D-214 target-scoped source class routes that minimized shape without
a parallel result framework. No real definition, profile, action choice, wording, persistence,
runtime activation, rule, or point is added.
D-316 then adds one runtime-excluded metric BMI derivation definition and an authoring-only
compiler over explicitly selected replay-valid D-310 height and weight records. It retains both
inputs and emits an uninterpreted detached value without inventing source/time provenance or
choosing a record. Patient-state/action attachment, ranges, body habitus, clinical tags, rules,
points, persistence, and runtime remain separate gates.
D-317 materializes that value into the common `ResolvedMeasurement` envelope with explicit
derived provenance and the selected weight input's time scope. D-301 and D-310 reject/omit this
new path by contract. D-318 advances D-311 to append replay-valid D-317 BMI only beside the exact
D-310 input collection retained by D-316; it rejects crossed or duplicate derived records and
lets the existing D-312 lane carry the result without recursively altering D-310. Action-result
selection, interpretation, ranges, persistence, and runtime remain separate future gates. D-319
proves with synthetic content that the unchanged D-213/D-214 direct-measurement route can bind
that final record by ID; no parallel reveal model or production mapping is added. D-320 adds a
separate exact-template clinical-result recipe and requires one-to-one ownership of every supplied
D-310/D-317 artifact without generating values or attaching them to patient state. Its later
attachment integration remains a separate gate. D-321 closes that gate by making D-320 the only
D-311 input owner and cross-verifying its full template against D-208; real recipes and runtime
activation remain separate. D-322 adds an authoring-only finite horizon that exposes exact
per-template recipe coverage and deterministic resolution while retaining missing coverage as a
diagnostic; it does not activate those recipes. D-323 advances D-320 so that exact D-322
resolution is its only recipe input and the legacy raw-recipe request is rejected. D-324 adds a
finite authoring-only resource-set audit that reports exact missing test, interval, profile,
measurement, observation, BMI-derivation, or source owners per recipe member without compiling
values or changing runtime. D-325 binds complete coverage to one exact D-233/D-208 selected
patient, derives its numeric generation context and catalog source horizon, and still stops before
result compilation or runtime activation. D-326 consumes only that exact frozen context and
delegates direct results, collection assembly, BMI derivation/materialization, and exact-template
binding to D-306-through-D-310/D-316/D-317/D-320. The replay-valid output remains authoring-only;
D-311 attachment, real content, persistence, and runtime activation remain separate. D-327 closes
the attachment-selection seam by deriving D-208 and D-320 only from replay-valid D-326 before
delegating unchanged empty-lane attachment to D-311. D-328 then provides the canonical
result-enabled D-312 entry: it derives D-208/D-311 from D-327 and preserves optional D-294/D-292
branches under D-312's exact common-root checks. D-329 advances D-200 to `27.0.0`, requires this
exact D-328 authority for every result-enabled branch, and preserves the null and
duration/impairment-only D-312 compatibility paths. D-330 adds one authoring-only orchestration
from a result-free D-200 request scaffold plus exact D-324 coverage through D-325/D-326/D-327/
D-328 and the final compiled D-200 audit. The scaffold is not prematurely compiled, prebuilt
result authority is rejected, and runtime remains separate. D-331 advances the authoring-only
atomic slot fill so exact D-324 coverage derives D-330 and only its final audit can occupy the
authorized coordinate; the direct result-free path remains available and runtime remains
separate.
D-202 adds an
authoring-only
bijective
bridge from D-201 comorbidity candidates to D-196
optional conditions and materializes required plus selected condition state without another draw
or charge. D-203 adds a neutral genuine-D-196-or-D-202 condition-source contract and source-specific
verification for D-197 while preserving native provenance and performing no new draw. D-204
carries that complete source through D-200 and D-194 replay, requires exact equality with D-197,
and preserves nested D-201/D-202 provenance without attaching selected modules to runtime
complexity. D-205 adds the authoring-only complete reaction-history alternative bridge: D-201
remains the sole budget/draw authority, pairwise incompatibility permits zero or one complete
uninterpreted payload, and typed horizon plus replay provenance remain frozen without base-state
attachment. D-206 adds additive nonempty prior-treatment contributions: compatible modules may
spend budget independently and concatenate globally unique historical records while D-201 retains
all selection/accounting authority. D-207 adds additive nonempty positive-use exposure
contributions: compatible `substance_use` modules concatenate disjoint
medication/supplement/other-substance records while D-201 retains all selection/accounting
authority and same-agent alternatives require exact-version agreement plus explicit
incompatibility. D-208 verifies one exact D-201 artifact across the condition, reaction,
prior-treatment, and exposure owners and composes one collision-safe pre-finding patient state
without another draw or charge. Selected unsupported `other` modules remain explicit incomplete
coverage rather than being rerolled. D-209 makes that complete D-208 artifact D-200's only
pre-finding patient source, derives all D-193/D-194 state and binding fields, retains/replays the
full chain, and propagates blocked composition before downstream compilation. D-210 independently
discovers approved whole-state tendency applicability from exact typed facts, retains same-record
matches and exact profile/target versions, and emits at most one D-199-ready binding per
definition without probability or complexity work. D-211 makes that verified audit D-199's sole
applicability source inside D-200, derives exact profile/definition subsets, retains an explicit
zero-match/null-D-199 path, and preserves D-201's one-time complication spending. D-212 adds the
schema-only structured non-finding reveal foundation: closed source-specific lanes and singleton
fields preserve exact included/omitted truth records, source/time/dependency provenance, explicit
negative versus unassessed status, and alignment audit without changing hidden state or complexity
spending. D-213 adds the exact full-catalog action/result recipe compiler and standalone binding
candidates across D-193, D-212, measurement, observation, and structured-test owners, with
explicit incomplete coverage and no invented negative results. D-214 advances templates to one
static action-result assembly, makes D-194 derive every binding from one complete D-213 artifact,
freezes only presentation-safe D-212 views into the patient instance, and advances D-200 to retain
and replay the full audit without charging D-201's complexity budget again. D-215 adds a
standalone exact whole-lane compiler for one already-selected reviewed source-report profile,
including patient/profile/definition fingerprints and replay, but no probability selection,
partial record filtering, complexity, or points. D-216 advances the current attachment contract
to `attachment_only.v3`, catalog-instance compiler `3.0.0`, and D-200 `6.0.0`, freezing one exact
outpatient, ED, inpatient-psychiatry, or consultation-liaison setting across template, location,
and encounter without granting capabilities or spending complexity. Real source-report profiles
now have a separate D-217 reviewed fixed/weighted behavior-selection boundary with independent
slot-local deterministic draws across all four care settings, but no real profiles. D-218
advances catalog-instance compilation to `4.0.0` and D-200 to `7.0.0`: it replaces
caller-authored D-212 recipes with exact D-217 selection, runs D-215 after final truth, and replays
the complete D-217/D-215/D-213/D-194 audit. D-257 corrects the real-content policy: accurate
self-report is the zero-cost base, while inaccurate/partial self-report is a D-201
`source_report` complexity module applied through a D-217 `2.0.0` complexity-gated slot without a
second draw, charge, or truth mutation. This first route covers D-215 structured non-finding
views. D-258 completes the matching D-193 route: the same exact D-201 artifact selects one
approved patient-report projection after finding truth freezes, every alternative preserves the
same hidden predicate and target, only the active projection participates in D-256 negative
closure, and D-200 `22.0.0` verifies complete union coverage across both routes without a second
cost. No real report profile or frequency is activated. D-219
advances the current attachment contract to
`attachment_only.v4`, catalog compiler `5.0.0`, and D-200 `8.0.0`: one exact, operational-only
admission artifact evaluates the complete focused action horizon against the selected physical
location's capabilities, base formulary, disposition allowlist, and eligible service methods.
The same explicit-resource algorithm is proven synthetically for outpatient psychiatry, ED,
inpatient psychiatry, and consultation-liaison without deriving access from the setting name or
spending D-201 complexity. D-220 adds a standalone instrument item-response compiler `1.0.0`.
Exact approved `instrument-item-response-only.v1` owners supply response-scale/options,
information-action, respondent, time, and opaque rights metadata to one verified D-193 projection
per target. The compiler preserves exact option-set, null-presentation, action-source, contributor,
diagnostic, and replay guards without adding text, scoring, interpretation, or complexity.
D-221 closes that synthetic attachment seam under `attachment_only.v5`,
`universal-action-result-assembly.v2`, D-213 `2.0.0`, catalog compiler/D-194 `6.0.0`, and D-200
`9.0.0`. D-194 derives D-220 after final D-193 truth; D-213/D-214 route each exact action-owned
response and freeze a presentation-safe patient redaction while the full D-220 audit remains both
root and nested. Empty instrument horizons, exact replay/tamper checks, unchanged D-201 spending,
and one resource-neutral algorithm across outpatient, ED, inpatient psychiatry, and
consultation-liaison are covered. D-222 adds standalone selected-location operational-resource
compiler `1.0.0`: a complete clinic-wide assignment horizon covers every built location, exact
version/fingerprint-pinned upgrade and formulary references declare exclusive or shared placement,
and current clinic/facility/location/department/ownership/staff/formulary owner horizons determine
the selected location's effective resources without any clinic-global union. The same
assignment-based algorithm covers all four care settings, blocks duplicate or overlapping staff
automation, and at its standalone checkpoint had no D-219 attachment, persistence, runtime,
clinical, point, economy, probability, or D-201 complexity authority. Contributor content, typed
routing of any future `other` module, real profiles and universal recipes, real rights-reviewed
instrument definitions, real setting-specific operational owners and assignments,
compatibility/save migration, persistence, and cohorts remain open. All current runtime locations
remain outpatient.

D-223 adds standalone pre-finding patient-state orchestrator `1.0.0`. One strict authoring request
runs D-201 exactly once, selects required-only D-196 versus D-202 from the complete comorbidity
candidate horizon, retains complete D-205/D-206/D-207 lane audits including null materializations,
requires explicit reaction-history ownership, and passes only genuine child artifacts to D-208.
Literal D-202 conflicts and selected unsupported `other` modules remain charged and produce
audited `not_composed` results without reroll or refund. Exact nested replay, tamper/cross-context
guards, and the same accounting algorithm across outpatient, ED, inpatient psychiatry, and
consultation-liaison are covered by 28 focused tests (14 direct plus 14 runtime-boundary).
Typecheck, lint, Prettier, and diff checks pass. At its standalone checkpoint D-223 remained
detached from D-200; real module content, persistence, runtime generation, points, clinical rules,
and probability calibration remain open.

D-224 closes the exact selected-location resource seam: D-222 `2.0.0` binds formulary membership,
D-219 `2.0.0` consumes one complete D-222 artifact, and D-194 `7.0.0`/D-200 `10.0.0` retain the
historical chain while independently validating current clinic/location resources. D-225 advances
D-200 to `11.0.0` and makes D-223 its single pre-finding root; the genuine D-208 composition is
derived rather than supplied in parallel. Neither change creates another optional-complexity
authority.

D-231 first materializes the strict mode/lifecycle template horizon. Standard/Normal and Endgame
accept only the explicit lifecycle-approved lane; local Developer may add a separate explicit
lifecycle-review lane. Other lifecycle states, crossed lanes, and duplicate stable IDs are
rejected. Inclusion remains independent of medical review, setting, resource coverage, queue
history, weights, points, and complexity.

D-226 `3.0.0` adds the authoring-only complete D-231 template × built-location admission matrix. It compiles
D-222 once per location and admits only exact version-current, care-setting-matched template pairs
with complete D-219 mechanical access. The same algorithm covers outpatient psychiatry, ED,
inpatient psychiatry, and consultation-liaison; setting labels grant nothing. The matrix selects no
patient and spends no complexity. Real non-outpatient locations and operational owners, persisted
assignments, distribution/repeat/refill policy, compatibility save/runtime migration, and runtime
activation remain open.

D-227 replaces full mutable ClinicState retention with strict
`clinic-operational-context.v1`. Only facility/location/department/resource ownership and staff
configuration affect admission; points, satisfaction, active location, global capabilities, and
Endgame/debug state are excluded. The resulting D-222 `3.0.0` → D-219 `3.0.0` → D-194 `8.0.0` →
D-200 `18.0.0` and D-226 `3.0.0` chain remains authoring-only and spends no complexity.

D-228 binds one explicitly named admitted D-226 cell to its exact template, location, patient
pool, care setting, D-222 reference, and complete D-219 proof after replaying the current matrix
context. D-229 then fixes the future queue coordinate: every generated-patient slot belongs to one
exact physical location, retains the exhaustive admitted horizon for only that location, rejects
empty or cross-location selection without global fallback, and nests D-228 for a caller-selected
local member. D-230 makes that local choice using explicit positive question-bank weights,
nonzero local active/recent repeat suppression by stable template ID, and one deterministic 64-bit
slot-local draw. It nests the selected D-229/D-228 proof and retains the complete probability and
suppression audit. D-228, D-229, and D-230 advance to `2.0.0` for the D-231/D-226 proof change.
D-200 `18.0.0` consumes D-233 beside D-223, derives D-230 plus its D-232 capacity certificate,
exact-compares nested D-228 and D-223 template payloads, and retains an independent
current-resource check. The checkpoint
supports outpatient psychiatry, ED, inpatient psychiatry, and consultation-liaison through one
algorithm, but real non-outpatient generation still awaits concrete owners and progression. It
does not spend complexity, refill/persist a runtime slot, project UI, or activate runtime
generation.

D-232 now completes the separate authoring proof for exact-location capacity and facility
transition. Base slots plus explicit capacity-upgrade contributions compile from a minimized
capacity ownership/assignment horizon into stable authorized coordinates. D-200 requires the
matching compact authorization for D-230. A separate successor profile and atomic migration
compiler preserve every frozen patient, seed, template, historical D-230/D-232 proof, and source
provenance while attaching free target capacity and fresh current D-226/D-228 proof. Missing
occupied mapping, insufficient capacity, or unavailable exact target admission blocks the whole
move without reroll, deletion, truncation, or partial commit.

D-233 now completes the separate authoring proof for compact exact-location occupancy, first-empty
canonical fill ordering, a private per-mode root, domain-separated D-230 template and downstream
patient seeds, exact one-seed enforcement through the final patient, and immutable
filled-or-blocked attempts. A blocker leaves the slot empty, records its deterministic reason,
consumes one ordinal, and requires an explicit retry; occupied patients never reroll when another
coordinate changes.

D-234 now completes the authoring-only occupied-to-completed-to-empty boundary. It updates bounded
duplicate-preserving local completion history bound to the exact current occupancy, distinguishes
Endgame/Developer skipped refresh from completion, records exact-version Developer run history,
supports no-fallback same-template Developer rerandomization, dynamically excludes completed
versions globally and active waiting versions at the exact location before D-230 weighting, and
chains ordinary D-233 refills against one exact root across active and retained-history patients
plus one profile/current matrix containing the exact location/fingerprint, in canonical order
until full, Developer exhaustion, or a blocker. Continuing past a blocker requires the later caller
to name it as an explicit retry boundary in the retained transcript; the next attempt starts from
the retained ordinal.

D-235 replaces D-234's temporary JSON attempt bridge with
`GeneratedCompletedEncounterAttempt`. One compact replay snapshot is derived from the exact
verified D-200 waiting patient and preserves native patient/encounter state, minimized action
fulfillment context, purchases, editable diagnosis and V2 treatment selections, a contiguous
start-through-completion event log, complete compiled-rule trace, provisional point snapshot,
arithmetic-verified all-points settlement, content/engine versions, and deterministic
fingerprints. Every purchase, action target, regimen-entry operation, diagnosis-family identity,
trace reference, component total, expense, payout floor, and mode-specific bank transition is
verified against that frozen encounter. Provisional balance and unverified-price derivations stay
explicit, while persistence `completedAt` metadata has a separate fingerprint and cannot alter
clinical replay. D-234 v2 embeds and cross-verifies this native attempt before vacancy. D-230 is
`3.0.0`, D-233 seed/fill are `2.0.0`, D-200 is `19.0.0`, facility migration is `3.0.0`, D-234
compilers are `2.0.0`, and the D-235 attempt compiler is `1.0.0`.

D-236 audited the proposed SaveData/runtime checkpoint and found activation premature. The
authoring chain has no real file-backed route/policy vertical, native balance or service-price
authority, frozen launcher/debrief presentation, or compact private queue-restore record.
`FacilityDefinition.patientSlotCount`, SaveData v5, the compatibility queue and
`CompletedAttempt`, IndexedDB, Reviewer exports, automatic Standard refill, and application UI
therefore remain unchanged; no placeholder v6 or generated-attempt union is added.

D-237 completes the first real reviewed point-free MDD initial-medication route and decision
policy. It uses one explicit five-identity class, a one-eligible/one-total-start count predicate,
an explicit link to the approved diagnosis qualitative rule, and an authoring-only adapter that
expands exact memberships into D-191 action anchors without interpreting tags. A separate pure
route evaluator preserves the complete cardinality semantics.

D-238 supplies the first separate native provisional balance owner. The exact D-237 route maps to
the `medication_selection` dominant-primary-route band at `+200`; the route and policy remain
point-free. D-235 advances to compiler `2.0.0` and point-report v2: it derives every trace row and
the database-plan total from the exact catalogs plus frozen submitted/reference treatments rather
than accepting caller-authored point rows. Secondary-rule combination and runtime activation
remain open.

D-239 reuses the existing versioned service definitions as the native information-price owners.
The authoring-only quote compiler verifies their exact price-neutral projection against D-219,
intersects staff methods with D-222's action-specific configuration, selects the least-cost
equal-quality method deterministically, and freezes the owner/method horizon for replay. Generated
purchase commands no longer accept quote fields. D-235 advances to compiler `3.0.0`; treatment
charges and the remaining settlement inputs stay explicitly unverified. No SaveData, runtime,
browser, or UI work is activated.

D-270 extends that exact native price-owner join to the complete intervention/disposition
horizon. Generated-attempt input no longer accepts treatment-charge rows. Replay snapshot v3
freezes exact treatment owners and nullable fulfillment-service bindings; the submitted selection
creates one least-cost equal-quality quote only for each service-backed option, and integrity
replay rejects charge tampering. Service-free treatments and medication/regimen actions receive
no invented price. D-235 advances to compiler `9.0.0`, generated attempt/settlement v3, while
base reimbursement, challenge bonus, satisfaction multiplier, and prior-bank inputs remain
explicit non-native settlement inputs. No clinical rule, point, price, SaveData, runtime, browser,
or UI work is activated.

D-271 closes those remaining free scalar settlement inputs without inventing production balance.
One separate versioned, exact-template economy policy owns provisional base reimbursement and
challenge bonus. The current ClinicState owns prior clinic/lifetime points and raw satisfaction,
must match the exact D-227 operational clinic projection used for admission, and is combined with
the exact versioned satisfaction curve. Replay snapshot, settlement, and generated attempt advance
to v4 and D-235 advances to compiler `10.0.0`; integrity replay rederives the multiplier, payout,
zero floor, practice banking, and after-balances. Real template economy policies, runtime
activation, SaveData, browser persistence, and UI remain open.

D-272 closes generated diagnosis-qualifier validation. One minimized owner set is compiled from
every exact diagnosis definition in the frozen diagnosis horizon and retains only family/severity
selection mode plus reviewed player-selectable qualifier identities. MDD severity remains backend
state and cannot be submitted; the reviewed psychotic-features specifier remains available for a
later named-qualifier interface. Replay snapshot and completed attempt advance to v5 and D-235 to
compiler `11.0.0`. No diagnosis scoring, severity generation, real template, runtime, persistence,
or UI is activated.

D-273 adds the standalone deterministic launcher-presentation owner required before a generated
waiting patient can have neutral display copy. Exact curated first/last-name pools, a fixed 25%
middle-initial policy, and reusable brief chief-complaint banks resolve through independent stable
substreams into a replayable authoring artifact and a minimized safe presentation. No real
profile/bank content, PatientInstance attachment, queue/save migration, runtime activation, or UI
is included.
D-287 adds the authoring-only exact D-194 adapter for that owner: patient identity and seed are
derived from the verified catalog snapshot, while the caller supplies only reviewed D-273
presentation content. The wrapper replays deterministically but still activates no real profile,
queue slot, save, runtime, or UI.
D-332 closes the content-only portion of that gap with one runtime-excluded catalog containing
three reusable short complaint banks, 48 variants, and one Developer-approved cosmetic MDD
profile over the existing fictional-name pools. It adds no PatientInstance/D-200 attachment,
queue/save migration, runtime activation, UI, clinical inference, rule, point, or formulary
behavior.
D-333 then binds that exact content to one successful D-331 frozen waiting-slot proposal through
the fill's final D-194 snapshot and D-287. The resulting fingerprinted minimized presentation
remains a detached authoring artifact; SaveData, runtime queue projection, historical-attempt
projection, launcher UI, and clinical behavior remain deferred.
D-334 separately adds one runtime-excluded universal action-result assembly for the existing
weight/BMI action. It pins exact canonical height, weight, and BMI definitions and proves the real
content route through D-213/D-214 while retaining `not_interpreted` semantics. Real measurement
profiles, body-habitus observation, ranges/interpretation, persistence, runtime generation, and UI
remain deferred.
D-335 then adds the detached authoring-only generated-measurement profile/compiler contract:
typed context and priority select one reviewed profile, weighted support bands and values resolve
through separate stable draws, and the common uninterpreted measurement plus complete replay audit
is frozen. It adds no real distributions, template recipe, persistence, runtime, or UI.
D-336 advances only the D-310 collection lane to retain D-308 authored and D-335 generated
measurements as distinct direct member kinds under the same exact patient/source horizon. D-320
recipe syntax and D-324/D-326 support for generated profiles remain deferred.
D-337 closes that structural deferral: D-320 pins the complete generated-profile horizon,
D-324 audits every exact profile resource, and D-326 invokes D-335 from D-325 seed/context before
using the unchanged D-310/BMI path. Real measurement profiles, ranges/interpretation, body habitus,
persistence, runtime generation, and UI remain deferred.
D-338 returns to the reviewed native MDD scoring dependency: one diagnosis predicate pins the
exact reviewed initial-antidepressant class, the adapter expands approved memberships to concrete
starts without tag inference, and a separate `0/+35/-50` prerequisite balance scores
not-triggered/fulfilled/omitted mania history. Compatibility CaseBlueprint scoring remains
unchanged and generated runtime activation remains deferred.

D-339 closes the reviewed MDD passive-death-wish/safety-assessment scoring seam. One native-only
diagnosis supplement pins the exact canonical finding outcome; the adapter combines it with the
primary-route patient scope without emitting the legacy tag; and a separate `+50/-80` direct
information balance scores detailed assessment obtained versus omitted. No risk score,
disposition inference, patient generation, compatibility migration, persistence, runtime, or UI
is added.

D-340/D-341 close the corresponding first detailed-safety result dependency. Four neutral
identity shells complete the initial fact set, an exact 18-projection horizon preserves nine
independent present/absent rows, and one universal assembly binds them to the shared
`Suicide and self-harm assessment` action. Safety-planning ability, protective factors, acute
modifiers, event details, risk formulation, disposition, generation rates, persistence, runtime,
and UI remain separate or deferred.

D-342 closes the separate safety-planning-ability result-definition seam. One exact structured
reveal definition and universal recipe project only the current patient-reported
`reports_able`/`reports_unable`/`uncertain` value for the shared History action. It adds no written
plan state, planning intervention, risk or disposition inference, generation profile, points,
persistence, runtime activation, or UI.

D-343/D-344 close the first medication-history result-definition seams needed by the native MDD
prerequisites. Medication reconciliation exposes only exact current regimen entries;
allergy/adverse-reaction history exposes exact reaction records plus explicit overall and
medication-assessment statuses. Both retain redacted universal bindings and add no source
probabilities, clinical interpretation, new points, persistence, runtime activation, or UI.

D-345 closes the objective-exposure-to-patient-report substance-history result seam. D-346/D-347
keep medication-only trials and the four-lane full treatment history distinct. D-348 groups four
exact current-medication effect lanes without merging benefit, tolerability, dose position, or
change timing. These checkpoints add no generation profiles, clinical inference, points,
persistence, runtime activation, or UI. D-349 adds the closed, fingerprinted, replayable minimized
field-level projection for all twelve structured lanes while withholding internal diagnosis
mappings, exposure misuse truth, reaction interpretation, trial adequacy, authoring summaries,
generation traces, and source-alignment internals. Runtime attachment and presentation remain
deferred.

D-350 then derives that complete safe-view collection only from the independently source-validated
D-299 report chain, preserving exact patient/definition/action/source/time cross-links and full
replay while rejecting raw D-215 input. D-218/D-194/D-213/D-214 integration, persistence, runtime,
and UI remain deferred.

D-351 joins that collection only to a replay-valid D-213 artifact with the same exact patient and
complete structured-envelope set, derives D-214 mechanically, and verifies each safe record
projection against its frozen reveal. `PatientInstance`, D-194/D-218 orchestration, persistence,
runtime activation, and UI remain deferred.

D-240 adds the first missing reusable presentation owner found by auditing that real route:
clinical duration and subjective burden compile through singular exact
action/semantic-owner/target/source/time definitions into a full authoring projection and a
separately target-redacted frozen reveal. Target absence, ambiguity, and missing values remain
distinct; same-action overlap fails; the artifact replays deterministically. This standalone
checkpoint changes no D-213/D-214/D-194/D-200 version and activates no real content.

D-241 attaches that owner through the universal-result chain. Static assembly v3 owns definitions;
D-194 `9.0.0` compiles D-240 after final truth; D-213 `3.0.0` preserves definition-level
not-applicable, missing, and ambiguous coverage while routing only safe frozen reveals; D-214
attaches the referenced subset; and D-200 `21.0.0` replays the full nested audit without another
complexity charge. The patient attachment contract is now `attachment_only.v6`.

D-242 widens the native generated scoring audit from treatment-only comparison to one complete
point-free player decision and one complete database-plan decision. Replayed purchases supply
presence-semantic information-action IDs, while final diagnosis and treatment events supply the
remaining selections. Both snapshots are exact-horizon validated and replayed; the current
D-237/D-238 route still reads treatment only, so no clinical behavior or point total changes.

D-243 adds one diagnosis-owned point-free triggered-information prerequisite contract. D-191
`3.0.0` freezes distinct trigger and information-fulfillment predicates, exact originating policy
scope, and a non-null typed patient predicate only when both actions are in the exact horizon and
the current policy scope matches. D-242 decisions evaluate them as not triggered, fulfilled, or
omitted. The two approved any-medication-start MDD prerequisites are mechanically adaptable but
remain unbalanced; the antidepressant/mania tag trigger remains disabled rather than inferred as a
medication class.

D-244 adds the separate three-outcome provisional balance owner for the two already-approved MDD
any-medication-start prerequisites. Native scoring `3.0.0` and D-235 `5.0.0`/point-report v4
derive and replay zero not-triggered, positive fulfilled, and negative omitted outcomes while
retaining both component Booleans. The reference decision now derives `265` (`+200 +35 +30`);
mixed and omitted paths remain separately traceable. Exact-catalog payload fingerprinting,
secondary-contributor combination, real vertical content, and runtime persistence remain open.

D-245 applies D-159 to the native generated path without adding clinical content. Native scoring
`4.0.0` evaluates exact secondary action predicates, normalizes selected starts and regimen
operations to concrete targets, then performs same-effect replacement, exact-target
hard-contraindication suppression, and worst-only same-issue harm for both frozen decisions.
D-235 `6.0.0`/point-report v5 retains and replays every original row, direct controller chain,
combination explanation, selected target, and prerequisite subtrace; it rejects extra noncompiled
rows and combination tampering. Current compilation rejects equal-priority ambiguity for one
effect. Exact balance-catalog payload identity, real secondary contributors, remaining MDD
generation/result/source dependencies, and runtime persistence remain open.

D-252 advances native scoring to `5.0.0`, D-235 to `7.0.0`, and the generated point report to v6.
It freezes a minimized exact balance payload plus the complete source-catalog fingerprint and
retains the complete database-plan trace, so same-ID/version retuning cannot silently change
historical magnitudes. This remains runtime-excluded and does not activate SaveData.

D-246 re-audits that exact native path against checked-in content before the first real template.
The approved MDD route/policy/balances and shared identities are reusable, but every executable
patient template, core pre-finding state, generation profile, finding projection recipe, universal
result assembly, source-report profile, and complete presentation in the end-to-end proof is still
synthetic or absent. Compatibility cases are not promoted. The result remains in the existing
dependency ticket/audit rather than creating a parallel readiness-status system; the next clinical
dependency is the MDD episode finding/cardinality owner and its finding-identity completeness
review.

D-247 completes the currently identified atomic MDD symptom-owner shells, retains weight and BMI
as numeric measurement owners, and fixes the composition boundary: diagnoses reference reusable
facts through declarative profiles and pure compilers rather than executable content. The next
review is the current adult MDD episode's dimension/cardinality model. No real MDD profile or
patient may compile until paired or related manifestations can remain separate in the audit
without being double-counted diagnostically.

D-248 completes the disorder-general technical part of that review. D-197 v3 selects a total
number of dimensions under explicit nonoverlapping core/cluster constraints and then preserves
one or more separate manifestations per dimension. Pessimism has a neutral atomic identity.
The real MDD profile remains evidence-gated on its exact core, cardinality, manifestation
grouping, and pessimism/suicidality roles. The read-only adjunct's ordered evidence work is
documented separately without replacing canonical source-request status.

D-249 completes the first synthetic optional-texture materialization seam. One D-201-selected
`finding_texture` module retains its original draw and complexity accounting, emits exact
background candidates through D-208/D-223, and replaces only the matching generic D-198 baseline
inside D-200 `21.0.0`. Hard diagnosis candidates remain dominant and a same-target D-199 collision
is rejected pending reviewed combination semantics. Real texture mappings/rates and the real MDD
profile remain evidence-gated.

D-254 adds the first real, runtime-excluded current-episode MDD profile: five through nine of nine
reviewed dimensions with depressed mood or anhedonia required, one concrete manifestation per
selected dimension in v1, and no points. D-255 then proves the approved downstream scoring
handoff without binding a patient template. Exact direct MDD information actions receive separate
required `fulfilled/omitted` or preferred `selected/unselected` balance shapes, frozen in balance
snapshot v2 and replayed by native scorer `6.0.0`/D-235 `8.0.0`/point-report v7. Remaining real
source-report behavior, result recipes, mania/safety triggers, diagnosis, disposition, fit, and
settlement owners still gate the vertical. D-256 explicitly rejects per-manifestation D-198
absence baselines. D-193 `1.1.0` instead lets one reviewed negative-result projection derive
`absent` only after the complete supplied generator candidate set contains no approved value for
that exact finding; positive and unresolved values suppress the fallback, and open-world missing
remains distinct. D-258 advances D-193 to `1.2.0`: a D-201-selected inaccurate self-report may
choose an alternate display projection, but only the active projection can request that D-256
fallback and the canonical finding remains unchanged. D-259 then adds the first real
runtime-excluded projection catalog: 49 explicit mappings close a 17-finding compact
`info.history.depressive-symptoms` horizon, include brief sleep and death/suicidality items, and
display a nonsafety subthreshold symptom as present without changing its hidden value. Dedicated
Sleep and Suicide/self-harm actions remain the owners of deeper detail. The next content
checkpoint D-260 pins those 49 mappings in one versioned projection horizon and adds one exact
`finding_projections`-only static D-213 recipe for the current shared action payload. The
checked-in content now produces one complete 17-source result binding. D-261 separately
version-pins duration profiles, resolved/deferred duration records, and D-240 definitions before
real duration content is added. D-262 then adds the first runtime-excluded current-MDD duration
profile and a two-action static foundation that routes its already-resolved D-240 reveal beside
the 17-finding compact symptom result. D-263 adds one standalone deterministic, replayable,
unweighted profile-option resolver with exact condition/source/time provenance. D-264 then replays
one genuine D-208 artifact plus the genuine D-263 results and appends them through a collision-safe,
state-fingerprinted authoring artifact. D-266 advances D-200 to `23.0.0`, retains one optional
verified D-264 artifact, and passes its resulting state through the unchanged D-194/D-240 path
while keeping null as the D-208-only compatibility route. D-267 adds the standalone exact
condition-functional-impairment profile/resolver contract, but deliberately checks in no real
profile. D-289 now proves a separate exact D-208-to-D-267 attachment envelope without modifying
`ResolvedPatientState`; D-290 derives a strict target/source-instance-redacted projection with
exact reprojection but still adds no action/result/runtime attachment. Real profile content and
result/runtime attachment remain absent. D-291 separately establishes a deterministic exact-
patient source-instance horizon and kind/existence validator without credibility, report
behavior, action, or runtime semantics. D-292 validates the detached D-289 impairment sources
against that horizon and carries D-290 forward without adding a result/runtime attachment. D-293
does the same for D-283's respondent and D-284 while remaining separate from catalog/runtime
admission. D-296 then advances D-285/D-286 to `2.0.0` and makes D-293 their only administration
input, preserving the existing context/D-220 checks while closing the respondent-source bypass.
D-294 validates each newly attached D-264 condition-duration source against its
base-patient D-291 horizon while retaining the changed composed-state reference separately; it
adds no D-240 projection, duration semantics, scoring, persistence, or runtime attachment. D-295
then advances D-200 to `24.0.0`, replaces its raw nullable D-264 input with the exact nullable
D-294 wrapper, and preserves both the no-duration compatibility route and unchanged D-194/D-240
consumption. This closes the source-validation bypass without adding real source definitions,
duration probabilities or thresholds, persistence, runtime activation, or UI. D-268 then records
MDD's reviewed
generation-only higher-of severity policy and family-only player diagnosis boundary, plus the
named psychotic-features specifier identity, while leaving every exact level boundary disabled.
D-269 adds the replayable authoring-only higher-of combiner over one strict externally owned
symptom-severity envelope and one native-verified D-267 artifact for the exact same episode. It
returns only a detached qualitative descriptor and does not create the missing upstream
symptom-severity derivation or map the result to a diagnosis severity ID. D-297 advances that
combiner to `2.0.0`, requires one replay-valid same-patient D-291 horizon, validates the D-267
source instance and kind, and rejects a raw D-267-only request without adding credibility or
clinical meaning. D-298 separately adds a replayable same-patient D-240/D-291 proof for every
projected duration or burden source reference; it derives exact action/record/frozen-value
bindings and retains only D-240's existing redacted reveals without attaching them anywhere new.
D-299 similarly adds a replayable D-215/D-291 proof for each selected structured source-report
profile and retains its detached D-212 recipes without selecting behavior or attaching a result.
D-300 makes the exact source-definition role ID stable across patient horizons while preserving
strict patient-horizon validation and exact definition audit. D-301 adds a replayable
D-208/D-291 composed-state source audit. D-304 advances it to exact source-kind validation for
every current source-bearing patient-state lane. D-302 adds the corresponding replayable
D-193/D-291 audit for each direct D-258 finding-report source selection while retaining its full
slot/projection and optional-complexity trace. D-303 adds the first registry-validated,
runtime-excluded neutral source-role catalog covering every closed D-291 kind without adding
availability, reliability, clinical, or scoring semantics. D-305 derives and freezes one
patient-bound D-291 horizon from that exact catalog through the authoring-only entry. D-306 then
compiles an exact catalog numeric-test profile, patient context, seed, interval owner, and D-305
laboratory source horizon into one frozen typed result with complete replay, while remaining
detached from patient/action/runtime state. D-307 adds the parallel versioned authored-result
profile and compiler for patient-owned tests, proven only with synthetic fixtures and likewise
unattached. D-308 adds the exact authored measurement-value profile/compiler, likewise proven
only with synthetic fixtures and kept `not_interpreted` and unattached. D-309 adds the analogous
categorical-observation profile/compiler with empty interpretation and synthetic-only domain
proof. D-310 adds one exact same-patient collection over all four outputs, with full upstream
replay and no patient-state attachment. D-311 then provides one exact authoring-only
D-208-plus-D-310 attachment with empty-lane enforcement and complete replay, but does not connect
the changed state to PatientInstance, action results, persistence, or runtime. D-312 composes that
branch with D-294 condition durations only when both retain the same empty-lane D-208 root and
likewise remains unattached. D-313 then integrates only that exact assembly into D-200 `25.0.0`,
eliminating direct D-294 input and preserving both duration and result lanes through D-194 while
remaining authoring-only.
D-314 then adds only the typed, source-validated impairment lane to that same assembly and advances
D-200 to `26.0.0`; the frozen patient snapshot can now retain duration, impairment, measurement,
observation, and structured-test records together without activating a player-facing result.
D-315 then extends D-240/D-298 to the impairment lane and proves the already-generic D-213/D-214
safe result route with synthetic content. It preserves D-290's target/profile/option/source-instance
redaction and checks in no real projection definition. D-316 separately adds the exact
runtime-excluded metric height/weight-to-BMI relationship and a detached replay-valid compiler,
and D-317 materializes that output only into a detached derived-provenance measurement record.
D-318 then attaches that record beside its exact direct D-310 inputs through D-311 `2.0.0` and
the existing D-312 common-root lane without making it a D-310 member. D-319 proves the existing
D-213/D-214 measurement binding through the final snapshot using synthetic content only. D-320
then adds exact template/profile ownership over D-310/D-317 as a detached authoring artifact;
and D-321 advances D-311 so that artifact is its only result-set input. These
detached seams continue through D-322 recipe coverage, D-324 resource coverage, D-325 context,
D-326 materialization, D-327 attachment, and D-328 post-composition orchestration. D-329 makes
D-328 the only result-enabled D-200 `27.0.0` input while retaining result-free legacy paths.
D-330 then owns the exact result-free-scaffold-plus-D-324 orchestration through those seams and the
final compiled D-200 audit without activating runtime. D-331 connects that exact chain to the
authoring-only D-233 atomic fill while keeping persistent queues and automatic refill disabled.
D-332 separately supplies the first real launcher-profile and complaint-bank content while keeping
it runtime-excluded and detached from that fill.
D-333 separately proves the exact successful-fill-to-minimized-presentation relationship without
changing the slot or activating persistence/runtime.
These
steps still add no PatientTemplate,
real impairment profile or real result mapping,
symptom-severity owner, exclusion owner, or point rule. PatientTemplate
activation, inaccurate-report content, reviewed impairment content and downstream projection,
exclusion owners, points,
persistence, and UI remain later gates.

D-265 separately adds the runtime-excluded race/ethnicity identity foundation: the current 2024
OMB minimum categories, combined multiselect self-identification, exact source/source-use and
Developer-opinion guardrails, a migration-safe demographics v3 record, and typed provided-category
facts. It adds no demographic selection distribution or clinical modifier. Before any such content
can enter a generated vertical, tests must prove name pools cannot infer identity, every eligible
diagnosis retains positive mass, report effects stay out of hidden truth, pharmacology effects do
not proxy ancestry/genetics, and every active modifier has exact reviewed provenance.

D-274 adds a transitional local Developer Patient Maker only for finite compatibility cases that
already pass complete playability validation. Its complexity choice filters on the exact authored
budget and cannot synthesize optional modules. It persists the ordinary deterministic case into a
Developer slot before opening it. The later database-generated maker remains a separate thin
client over exact recipe, admitted setting/location, and D-201/D-200 complexity ownership; that
path still cannot activate before one realistic source-controlled generation vertical.

The remaining
exact finding/result/source/presentation, diagnosis, secondary-rule, and settlement dependencies
for that outpatient vertical still follow before persistence. SaveData versioning resumes only after
one deterministic outpatient vertical can generate, play, score, settle, replay, and compile a
minimized review-safe projection without exposing hidden patient state or raw rubric internals.

Gate: do not activate generalized generation until the dependency-readiness audit is satisfied for
one complete general slice. The runtime behavior and reference baselines recorded at this
checkpoint remain stable through the later schema split; old snapshots replay through a versioned
migration; unsourced severity cannot generate; the same recipe and seed reproduce the same
complete patient/regimen/trial state; duplicate medications are independently addressable; chart
claims do not automatically activate internal-condition rules; exactly one primary policy anchors
the dominant route; and reviewed secondary contributors from complete typed patient state enter
only when their exact action targets intersect the focused horizon. Broad routes from background
diagnoses remain inactive while matching global safety, interaction, and treatment-prerequisite
guardrails remain eligible. Exhaustive scanning and an in-memory reverse index must produce the
same candidates. Structural invalidity quarantines while
coverage gaps remain nonblocking and clinical/evidence/balance conflicts remain distinguishable.
No point mapping, department work, or new clinical recommendation is invented. Encounter recipes
may later use a provisional multidimensional target envelope, but diagnosis dossiers never own it
and complexity-to-level display and progression mapping remain disabled until reference-patient
testing supports them.

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
approval control. An additional immutable-source-packet precursor reuses the same focused ticket
reader for one concise private-source decision at a time. The browser-safe packet is hash-bound to
a separate private locator, reviewer prose cannot replace its snapshot, invalid private state is
quarantined visibly, and Player/portable Reviewer bundles exclude the feature. The first packet is
metadata-only and does not claim semantic atomization.

The whole-corpus Database overlay now adds one fingerprint-bound dossier decision brief per entry.
It preserves candidate contribution types, resolved target roles, unresolved cross-target
mentions, and an explicitly non-executable patient/randomization lane. Saving one psychiatrist
interpretation reuses the existing local ticket workflow; it creates no rule, weight, point,
runtime treatment, or approval. This is still an authoring precursor, not completion of historical
comparison, rubric editing, re-scoring, or the Milestone 5 gate.

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
Full source review, source-unit extraction, broader remote-file byte transfer, and completion of every
Milestone 6 gate remain open. The first acknowledged private sync now preserves and extracts all
204 note title/plaintext records, locally OCRs 116 accessible attachments, records one unsupported
attachment, and quarantines seven attachment-save failures without discarding their note text.
None of this creates reviewed topical relationships or executable content.
A bounded title/plaintext-only semantic queue now supports one tracked topic and one complete
source revision at a time, with segment-complete coverage, strict private import, and aggregate
status reporting. Lexical matching only queues candidates; HTML, OCR, attachments, composites, and
bulk-corpus semantic processing remain outside this slice. Candidate output cannot affect evidence,
rules, points, or approval.
An additional private lexical inventory now covers all 204 authorized title/plaintext revisions
against 68 current safe identities. It stores only hashes, IDs, terms, and counts; 72 revisions
matched at least one known target. Attachments, OCR, remote Drive sources, semantic interpretation,
unknown-entity discovery, source-unit candidates, and runtime changes remain outside that inventory.
The local source manifest now contains 210 extracted artifacts: 204 Apple Notes composites, four
formal PDFs, and two private Drive DOCX files. All six non-Notes sources use parser v5. Four Drive
discovery candidates still have no local bytes, hash, or extraction and must not be reported as
processed. A safe/local packet plus private-locator bridge is delivered, but broad source-unit
extraction, source-unit supersession, and the remaining remote transfers are still open.

Scope: SHA-256 scan/manifest/duplicates; PDF, DOCX, TXT, Markdown strategy; extraction/chunks; watch; processed/quarantine; provenance; privacy controls; source review.

Gate: idempotence and crash recovery; exact duplicates detected by hash; failures retained; parser versions recorded; malicious/instructional text remains inert; secrets/PHI warnings; raw/extracted/manifest material is ignored and absent from production; no external transmission.

## Milestone 7 — AI-assisted drafting

Status: one non-AI precursor is delivered. An explicit scaffold request can create a playable,
medically unreviewed Developer patient from a named template, verified local source references,
controlled presentation variants, and proposed shared impact IDs. It deduplicates provenance,
resets inherited rule reviews, and emits blocking audit tickets. The WHO-linked MDD scaffold proves
the local workflow. It does not infer clinical relationships, call a provider, perform critic/repair, or
approve content.

Scope: provider abstraction and mock; optional explicit external provider; constrained structured single-case draft; critic and repair; provenance; external-send confirmation; deterministic validation and policy bots; human approval gate.

Gate: gameplay works without provider/key; browser has no SDK/key/call; all outputs begin unreviewed; catalogs constrain every ID/unit/route/predicate; transmission requires acknowledgment; provenance/critic/repair preserved; AI cannot approve content; bulk generation remains disabled.

## Milestone 8 — Scale and hospital progression

Scope: larger catalogs and case families; remaining facility tiers; psychiatric hospital/integrated center; owned laboratory/imaging including late MRI; specialties and challenges; broader decor; offline/service-worker and broader PWA/performance hardening beyond the delivered install/update shell.

Gate: batch validators and seed/property tests scale; every released encounter has at least one
reviewed reasonable response route without requiring the evidence to converge on hidden truth;
content review throughput is measured; challenge cases are clueable; offline/static performance
budgets pass; migrations preserve saves and historical reviews.

## Current database-first checkpoint note

D-352 adds the exact static mania/hypomania-history result content needed by the reviewed
antidepressant prerequisite: sixteen separately auditable current/past patient-report findings,
one closed projection horizon, and one universal result recipe. It adds no episode/diagnosis
inference, generation profile, points, persistence, runtime activation, or UI.

D-353 adds the next static MDD exclusion-assessment dependency: six separately auditable current
psychosis-history report findings, one closed projection horizon, and one universal result recipe.
It keeps MSE, truth adjudication, diagnosis, generation, points, persistence, runtime activation,
and UI outside the checkpoint.

D-354 completes the existing static MDD initial-assessment foundation: Presenting problem and
timeline now joins current episode duration with one broad self-reported functional-impact finding,
while Depressive symptoms retains its 17-item result. Condition-attributed impairment, severity,
generation, points, persistence, runtime activation, and UI remain outside the checkpoint.

D-355 completes the static mixed-result mapping for Weight, BMI, and body habitus: the existing
action now carries one neutral categorical physical observation beside height, weight, and derived
BMI. Real value profiles, generation distributions, BMI/body-composition relationships,
interpretation, rules, points, persistence, runtime activation, and UI remain outside the
checkpoint.

D-356 adds the detached deterministic generation contract needed for future categorical
observations. It is synthetic-only and not yet connected to result collection, template recipes,
real body-habitus profiles, complexity, persistence, runtime, or UI.

D-357 connects that synthetic-capable compiler only to the detached result collection with an
explicit generated member kind. Template recipes, patient-state attachment, real profiles,
persistence, runtime, and UI remain deferred.

D-358 adds the explicit generated-observation recipe/resource/materialization path. One template
member owns the complete exact D-356 profile horizon; D-324 reports missing resources and D-326
materializes only from frozen D-325 authority. The proof remains synthetic and adds no real
body-habitus distribution, BMI relationship, complexity, points, persistence, runtime, or UI.

D-359 proves that the existing attachment and frozen-patient chain carries the D-358 result without
redrawing or relabeling it. No new runtime surface or clinical content is activated.

D-360 proves the checked-in reviewed current-MDD episode-duration profile—not a copied synthetic
fixture—through D-263, D-294, D-328, D-200, D-240, and deterministic D-330 replay. It changes no
duration content, clinical relationship, points, persistence, runtime, or UI.

D-361 proves the checked-in reviewed current-MDD symptom-dimension profile through D-197 and
D-330 together with the exact D-256/D-259/D-260 depressive-history closure/result owners. It adds
no new clinical content, points, persistence, runtime, or UI.

D-362 proves the checked-in MDD symptom and current-episode duration profiles together in one
deterministic D-330 patient under one D-233 seed. The full presenting-problem result remains gated
until broad functional impact has a reviewed generation owner; no absent impact is inferred.

D-363 adds the exact checked-in current/past mania/hypomania-history closure and result recipe to
that patient. It proves sixteen assessment rows and one action binding without generating a bipolar
episode, inferring diagnosis or safety, adding points, or activating persistence/runtime/UI.

D-364 adds the exact checked-in six-item current psychosis-history closure and result recipe to the
same patient. It keeps patient report separate from MSE and proposition truth and adds no
diagnosis, treatment, points, persistence, runtime, or UI.

D-365 adds the exact checked-in detailed suicide/self-harm assessment and proves that one MDD
safety manifestation is reused while only the other eight rows close absent. It adds no risk,
disposition, treatment, points, persistence, runtime, or UI.

D-366 replaces synthetic rubric inputs with the checked-in MDD initial-treatment policy, focused
route, and passive-death-wish safety requirement. The exact generated fact binds the exact action
target point-free; balance, attempt scoring, persistence, runtime, and UI remain separate.

D-367 adds the checked-in exact-class antidepressant-triggered mania-history prerequisite. The
compiled encounter preserves five reviewed medication-start triggers and the distinct
`info.history.mania` fulfillment action while leaving balance, player evaluation, persistence,
runtime, and UI separate.

D-368 connects those checked-in D-338/D-339 rules to their existing reviewed balance owners only
at native generated-attempt evaluation. Fulfilled, omitted, and not-triggered frozen decisions
produce replay-valid point traces without adding a new scorer, changing the patient, or widening
runtime/UI.

D-369 adds the checked-in depressive-syndrome direct requirement and its existing +50/−50 balance
over the already attached 17-item result. Obtained and omitted decisions replay through D-235
without symptom-count diagnosis inference or runtime/UI widening.

D-370 attaches the existing +200 dominant primary-route balance. The generated score now shows the
intended primary-route-versus-modifier hierarchy while preserving explicit zero-unmatched behavior
and leaving comparative fit, diagnosis, disposition, persistence, runtime, and UI outside.

D-371 carries that exact score into the existing standard-mode settlement and proves
service-derived expenses, gross/net arithmetic, the nonnegative payout floor, positive bank and
lifetime updates, and no persistent debit on a zero-payout stress case. It adds no new economy
formula, price, persistence migration, runtime activation, or UI.

D-372 audits the remaining native MDD information rules against the generated encounter and emits
four exact nonblocking `uncovered_action` diagnostics instead of inventing missing
presenting-problem, medication-reconciliation, reaction-history, or substance-history state.
Diagnostics remain point-free and do not invalidate or reroll the patient.

D-373 checks in fixed accurate patient-report profiles for medication reconciliation, reaction
history, and substance-use history and carries them through the existing generated-patient result
chain. They consume no optional-complexity budget and preserve empty versus explicitly unassessed
state exactly. The first three D-372 action gaps therefore close structurally; presenting-problem
functional impact remains unresolved. No inaccurate-report profile, source probability, point
value, persistence/runtime activation, or UI is added.

D-374 populates that generated MDD encounter's diagnosis horizon with one exact optional
family-level MDD choice and carries a submitted MDD identity through native attempt replay without
diagnosis points. Backend severity remains unavailable to the player and blank submission remains
valid. The same proof removes an explicit `undefined` from fixed source-report selection so the
D-373 waiting patient is losslessly JSON-safe. No diagnosis inference, runtime activation,
persistence migration, or UI is added.

D-375 purchases all three D-373 structured histories through native generated encounter events,
derives their exact result bindings and service costs, and replays them beside the D-374 diagnosis
selection. The 75-point expense is itemized while care points remain zero because no new balance
is authored. No runtime, persistence migration, or UI is added.

D-376 wraps that exact completed attempt in the existing timestamp-separated authoring
persistence record and proves schema, JSON, attempt-integrity, and record-integrity round trips.
It does not migrate SaveData or activate IndexedDB/runtime queues.

D-377 binds the complete attempt to its exact waiting patient through the existing D-234
completion proof and verifies a JSON/integrity round trip. Slot mutation, refill, SaveData, and UI
remain deferred.

D-378 applies that exact proof through the existing completed-encounter lifecycle transition. One
location-owned coordinate is vacated and one bounded history entry retains the full patient and
attempt with integrity/context replay. Canonical refill remains deferred until the new
seed-dependent clinical payload can be rebuilt from the post-transition authority; no generic
fixture is treated as that patient-generation step.

D-379 adds an optional complete weighted-selection policy to the existing condition-attributed
functional-impairment profile. The resolver preserves neutral uniform legacy profiles, but an
approved weighted profile now freezes exact integer mass and normalized probabilities before one
deterministic draw and rejects a request outside the policy's exact source kind, time scope, or
care-setting allowlist. No real MDD profile, source distribution, severity mapping, persistence,
or UI is activated.

D-380 adds the first reviewed real broad functional-impact background profile and carries it
through the generated-MDD Presenting problem and timeline result. The explicit NHANES-derived
binary mass and Developer-opinion transportability bridge remain separate from
condition-attributed impairment, severity, treatment, and points.

D-381 adds deterministic, read-only adjunct packet inventory and hashing so evidence-horizon
progress can be checked repeatedly without making the sibling repository a build dependency or
silently importing preliminary clinical material.

D-382 expands the normalized medication ingredient catalog from 55 to 125 through an official
NLM RxNorm refresh, one-file-per-ingredient records, a checked-in intake manifest, and a generated
static import/registry verifier. Only the existing 13 medication definitions remain playable; the
other 112 identities are neutral authoring bins. Fixed multi-ingredient/formulation modeling is
the next medication-identity dependency rather than a reason to misuse ingredient records.
