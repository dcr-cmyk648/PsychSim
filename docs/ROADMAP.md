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
identity catalog has 52 pinned RxNorm ingredient records: 13 runtime-compatible and 39
identity-only. It includes required public attribution/currentness disclosure and does not change
formularies, treatments, clinical claims, or scoring. A refresh importer, therapy migration, and
the remaining knowledge layers are still open.

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
selector remains authoring-only. D-197 adds the separate exact-state
`condition-finding-cardinality.v1` profile and selector: reviewed fixed outcomes and bounded
count/member draws emit exact D-193 diagnostic/cardinality candidates while preserving every
selected/unselected mapping, unbound condition, draw, and provenance record. It adds no real
clinical profile, background/soft-tendency aggregation, diagnosis inference, or scoring. D-198
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
payload. D-202 adds an authoring-only bijective bridge from D-201 comorbidity candidates to D-196
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
the complete D-217/D-215/D-213/D-194 audit. D-219 advances the current attachment contract to
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

D-240 adds the first missing reusable presentation owner found by auditing that real route:
clinical duration and subjective burden compile through singular exact
action/semantic-owner/target/source/time definitions into a full authoring projection and a
separately target-redacted frozen reveal. Target absence, ambiguity, and missing values remain
distinct; same-action overlap fails; the artifact replays deterministically. This standalone
checkpoint changes no D-213/D-214/D-194/D-200 version and activates no real content.

D-241 attaches that owner through the universal-result chain. Static assembly v3 owns definitions;
D-194 `9.0.0` compiles D-240 after final truth; D-213 `3.0.0` preserves definition-level
not-applicable, missing, and ambiguous coverage while routing only safe frozen reveals; D-214
attaches the referenced subset; and D-200 `20.0.0` replays the full nested audit without another
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

D-246 re-audits that exact native path against checked-in content before the first real template.
The approved MDD route/policy/balances and shared identities are reusable, but every executable
patient template, core pre-finding state, generation profile, finding projection recipe, universal
result assembly, source-report profile, and complete presentation in the end-to-end proof is still
synthetic or absent. Compatibility cases are not promoted. The result remains in the existing
dependency ticket/audit rather than creating a parallel readiness-status system; the next clinical
dependency is the MDD episode finding/cardinality owner and its finding-identity completeness
review.

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
