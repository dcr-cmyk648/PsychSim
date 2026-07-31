# Decision log

These decisions implement the authoritative product brief. Change one only with a dated entry, rationale, migration impact, and corresponding tests/docs.

## D-001 — No virtual clinical time

Status: accepted. Results reveal immediately. There is no clock, waiting, pending-result queue, delayed lab, advance-time control, or real-time emergency. Time mechanics would slow the two-to-five-minute puzzle without improving the intended pharmacology decisions.

## D-002 — Structured choices, no formal diagnosis input

Status: accepted. Players purchase menu actions and select start/stop/continue, nonmedication, and disposition choices. They never submit a diagnosis list, differential, prose formulation, assessment, note, plan, follow-up interval, or contingency instructions. The game evaluates care, not documentation.

## D-003 — Clinical score and finances are separate

Status: scoring-model portion superseded by D-035; fulfillment invariant retained. An appropriate action receives the same care points whether fulfilled externally or in house. Costs and savings appear separately in settlement/receipt. Satisfaction cannot change clinical rules. Necessary negative tests receive credit.

## D-004 — Positive-progression normal economy

Status: accepted. Encounter expenses settle against gross case payout; `net earned = max(0, calculated)`. Persistent points are not debited by a case, debt is impossible, and severe errors reduce signed care points, payout, or apply a point cap rather than creating a negative bank. Upgrades are later voluntary spends. Starting grant is 250 points; lifetime points earned begins at zero.

## D-005 — XP unlocks eligibility, not automatic ownership

Status: superseded by D-027. Reputation/XP has been removed. Lifetime Clinic Point thresholds allow a facility move/purchase. Facility/department/formulary/capability prerequisites remain independent declarative gates; a threshold does not grant every item.

## D-006 — Item and patient gating is location/capability data

Status: accepted. UI code does not hard-code named facility behavior. Cases declare compatible locations and minimum lifetime points. Eligibility requires reachable required workup, an acceptable treatment path, and safe referral/transfer. External access counts even when expensive.

## D-007 — Source documents never enter runtime

Status: accepted. Raw documents, extraction, chunks, and manifests are local developer assets, ignored by Git, excluded from Vite, and treated as untrusted. No external AI transmission occurs without an explicit CLI opt-in and rights/privacy acknowledgment.

## D-008 — Deterministic variation and replay

Status: accepted. Domain logic never calls `Math.random` or uses wall-clock state. Hash-derived generators resolve declared noncritical fields. Seed and resolved values save with a full executable case snapshot and event history. Critical fields, scoring, and safety are invariant across seeds.

## D-009 — Pure engine, Zod at boundaries

Status: accepted. Zod is the persistent/content source of truth. Engine commands are immutable TypeScript functions returning typed Result failures. React, IndexedDB, DOM, network, and timestamps remain outside the engine.

## D-010 — Native IndexedDB repository for Milestone 1

Status: accepted with revisit. The first slice uses a narrow `SaveRepository` around native IndexedDB rather than Dexie. One primary versioned SaveData record is sufficient. Consider Dexie when Milestone 5 needs indexed review queries and migrations; changing adapters must not leak into the engine.

## D-011 — Bundling approval is not medical approval

Status: accepted temporary prototype compromise. Normal builds import only `content/cases/approved`; the playable prototype is stored there so production build acceptance can be exercised. Its metadata remains `medicalReviewStatus: "unreviewed"`, fictional, synthetic, and visibly non-authoritative. “Approved” currently means explicitly selected for prototype bundling, not clinician approval. Later approval metadata must remove this ambiguity before public clinical claims.

## D-012 — First case scope

Status: superseded for player ordering by D-016. The synthetic new-restlessness puzzle remains a review-only later-tier engine fixture and is excluded from the production web entry point. It is history/medication-reasoning dominant, supports stopping the contributor without adding medication as optimal, a monitored symptomatic strong alternative, safe referral, useful negative screening, unnecessary expensive testing, and dangerous added dopamine blockade. No dose entry or guideline citation is used.

## D-013 — Satisfaction fixed at 1.00×

Status: accepted for Milestone 1. Satisfaction/ambience schemas and receipt field exist, but no decor/store or adjustable multiplier is implemented. The final cap waits for Milestone 3 economy testing.

## D-014 — Toolchain and supported browser assumptions

Status: accepted. pnpm 10.13.1, strict TypeScript, React/Vite, Zod, Vitest, ESLint/Prettier, and Playwright are pinned. The browser must support IndexedDB and modern evergreen JavaScript. Node 22+ is the developer baseline. There is no legacy-browser or server-rendering requirement.

## D-015 — Universal, neutral investigation menu

Status: accepted. The player sees the same location-compatible investigation catalog in every case. Catalog entries own neutral labels, descriptions, categories, services, and repeatability; cases own only patient-specific results and post-submit scoring. History, physical examination, laboratory, and imaging options are searchable category lists. Pre-submit text must not reveal whether an option is essential, defensible, redundant, low-value, or wasteful.

## D-016 — Early cases follow a couch-and-clipboard learning curve

Status: accepted. The first patient tier should begin with uncomplicated, commonly taught outpatient presentations such as basic major depressive disorder, with little or no testing required. The existing adverse-effect case is better positioned after that foundation rather than serving as the player's first clinical encounter. More complex interactions remain later cases even when the solo office can safely manage them.

## D-017 — Patient launchers are diagnostically neutral

Status: accepted. A waiting case is rendered from the seeded CaseInstance and shows only fictional patient name and brief chief complaint. Internal metadata title, diagnosis, difficulty interpretation, solution family, and editorial descriptions such as “straightforward” never appear in launcher copy or its action label. The chart may reveal only the brief facts the location already knows. This preserves presentations in which the complaint and final explanation differ.

## D-018 — SOAP is a content boundary, not a player task

Status: accepted. History and patient/collateral reports are Subjective. Clinician observation, measurement, record review, laboratory data, and diagnostic studies are Objective. Assessment and Plan contain synthesis and action, so level-of-care conclusions, diagnosis statements, treatment recommendations, and scoring/value labels are forbidden in pre-submit result prose. Players are not asked to write a SOAP note.

## D-019 — Registry plus one-file-per-patient/medication ownership

Status: accepted. `content/registry.json` records stable content IDs, paths, kinds, and runtime inclusion. Each patient file owns structured diagnoses, tags, observations/labs, case results, authored pathways, source-use notes, and generation policy. Each medication file owns reusable class/tags and future reviewed fit modifiers plus separate human overrides. Explicit static imports still control production bundling; the registry is validated coordination data, not a permissive file glob.

## D-020 — Hybrid treatment scoring must disclose provenance

Status: accepted incrementally and extended by D-045. A patient owns a broad intended medication family and explicit authored pathways. A deterministic catalog layer may adjust or estimate an alternative using medication fit data, interactions, contraindications, and patient tags. The receipt distinguishes an authored match from an engine-inferred or unmatched result. Two explicit medically unreviewed mirtazapine fit modifiers are active for architecture testing; every such modifier is itemized with review status. There is no general clinical expression language.

## D-021 — Incidental abnormalities require reviewed variants

Status: superseded in part by D-031. Clinically meaningful abnormalities still require explicit reviewed variants, but tightly bounded non-case-defining incidental laboratory flags may be generated from reviewed test catalogs.

## D-022 — Clinic Points are the only spendable unit

Status: superseded by D-035. The useful part remains: credits, Reputation, and XP are removed and persistent fields use `clinicPoints` and `lifetimePointsEarned`. The separate 0–100 score is now also removed.

## D-023 — Receipt separates base care from fit modifiers

Status: accepted and simplified by D-035. The receipt groups point effects as workup, base treatment fit, patient-specific medication modifier, interaction modifier, medication change, nonmedication, disposition, and efficiency. A selected medication with no individual adjustment explicitly shows a zero patient-fit modifier instead of appearing to lose its base award. Each rule contributes once to the care-point subtotal.

## D-024 — Disproportionate escalation is a material error

Status: accepted with current values revised by D-035. A disposition may be physically safe yet substantially wrong for the established presentation. The basic outpatient patient assigns urgent escalation a meaningful deduction and emergency transfer −450 disposition points plus a 200 care-point cap. Higher-level referral pathways remain available when internal care is unsafe or unsupported.

## D-025 — Dark console visual language

Status: accepted. Milestone 1 uses a dark-only, compact, monospaced console aesthetic with subtle grid/scanline texture, green status accents, amber sendout badges, semantic controls, and high-contrast keyboard focus. It remains an original game interface rather than imitating a proprietary clinical or examination product.

## D-026 — Solo-office fulfillment labels are explicit

Status: accepted. The starter location treats history and physical examination as in-house work. Laboratory and imaging actions resolve as sendouts, with the badge and operating point cost visible before purchase. Outside-record retrieval may also be labeled as external despite living in the History menu. Future equipment changes fulfillment cost, not clinical correctness.

## D-027 — One point unit drives economy and progression

Status: accepted and completed by D-035. Reputation/XP, letter ranks, and the 0–100 score are removed. The profile stores current spendable points and lifetime points earned. Every nonnegative encounter payout increases both by the same amount. Future purchases reduce only spendable balance, so unlocking never runs backward.

## D-028 — Setting-first queues; diagnosis stays internal

Status: accepted with D-038 extension. Every patient slot shows its setting, resolved fictional name, and chief complaint. Diagnosis IDs, tags, case family, and pathway metadata remain internal. Facility tier determines slot count; the highest tier exposes six. Normal and Endgame use approved blueprints; local Developer mode may explicitly load review content.

## D-029 — Off-road treatment estimates are visibly inferred

Status: accepted. Exact patient-owned pathways retain their authored label. Any future catalog-based evaluation of a nonexact treatment must say `engine_inferred` prominently and cannot imply patient-specific medical review. Until reviewed global modifiers exist, inferred logic stays constrained and conservative; a missing programmed excellent option remains flaggable as a missing alternative.

## D-030 — Personal clinical notes begin as author overrides

Status: accepted. Material imported from notebooks, iOS notes, or similar personal sources begins as an inactive author override with provenance. It cannot become an evidence-backed medication modifier or silently propagate into cases until tied to reviewable sources and explicitly accepted.

## D-031 — Non-case-defining incidental laboratory variation

Status: accepted with D-037 file ownership. When a patient does not own a numeric result, its test definition may deterministically generate values. Normal values stay inside a curated range. A panel allows at most one incidental flag from explicit mild ranges no more than 25% of the reference span beyond the boundary. Generated observations are noncritical and do not change points, pathways, safety, or disposition. Anything clinically meaningful requires an explicit reviewed patient variant.

## D-032 — Seeds are saved but never shown to players

Status: accepted. Seeds and every resolved value remain in saved attempts for deterministic replay, audit, and flags. Launchers, charts, receipts, and recent-attempt summaries never display seeds because recognizable values could become answer keys.

## D-033 — Endgame is a reversible review-safe overlay

Status: accepted. A visible debug/practice button toggles a derived highest-tier clinic with all currently declared capabilities/formularies and maximum patient slots. It does not overwrite normal points, purchases, or clinic ownership. Practice receipts display their projected payout but bank zero points and add zero lifetime progression. “All patients” means all eligible approved runtime content; draft/review/quarantined material remains excluded.

## D-034 — Google Drive is a remote source inbox

Status: accepted. The user-designated `PsychSim documents` Drive folder is discovered only on
explicit requests. The attached Google Drive app is preferred; a machine-local, read-only rclone
remote is the durable fallback when a Codex session does not receive app tools. Account-specific
metadata is saved in a local gitignored manifest. Portable review bundles may be pulled and
schema-validated automatically. New clinical sources are discovered but not silently downloaded;
changed revisions of sources already admitted to local intake may be re-pulled, SHA-256 hashed, and
scanned. One-at-a-time intake uses an explicit local pull command after the source identity and
rights gate, so the user never has to download or relay the file manually. Exact duplicates are
retained as provenance without reapplying content. Discovery, download, extraction, or
reviewer-bundle import never edits clinical data directly: each can only produce provenance-backed
claim/change proposals that require human review, affected-case validation, and new content
versions. The fallback credential never enters Git, the remote never receives write scope, and its
shared OAuth client must be replaced before its announced 2026 retirement.

## D-035 — Raw database-plan points replace ranks and 0–100 scoring

Status: accepted. Every visible quantitative effect uses points. The receipt shows signed care points versus the patient-owned database plan, then adds that subtotal once to base reimbursement and subtracts investigation costs. There is no letter rank, 0–100 scale, credits, Reputation, or XP. “Care points” is a labeled subtotal, not another currency. The database plan is a comparison route, not a claim of universal optimality, and players may exceed it through explicit fit modifiers.

## D-036 — Clinical facts are atomic, constrained, and recombinable

Status: accepted. Case results are structured finding sets with short label variants and explicit outcomes rather than distinctive prose. Criteria-bearing sets declare minimum/maximum positives plus required present/absent IDs. The starter MDD syndrome generates five to seven positives including depressed mood and anhedonia. Suicide assessment is restricted to four concise factual findings. Order and phrasing may vary without changing critical logic.

## D-037 — One file owns each test generator

Status: accepted. Every lab or diagnostic study has a versioned definition file that declares context inputs and either numeric profiles or a patient-owned policy. Profiles select by age, sex-for-reference, diagnoses, and clinical tags with deterministic priority and a required fallback. Patient files override a test when its result matters clinically. Validators enforce complete catalog coverage and bounded incidental values.

## D-038 — Resolved patient slots are durable mode-specific state

Status: accepted. Normal patients remain fixed until completed; a bounded recent-complaint list prevents immediate repetition when a replacement is generated. Endgame uses approved content, a six-slot highest-tier practice overlay, and manual refresh. Developer exists only in local development, loads approved plus review content, shows each unrun patient definition, and supports reroll/reset. Endgame and Developer bank zero points; production excludes the developer content module.

## D-039 — Clinical feedback enters a proposed ticket lifecycle

Status: accepted. Local receipt guidance and clinically marked flags create structured tickets with immutable attempt/item snapshots, target/dependency/conflict IDs, clinical-acumen flag, routing, status, resurfacing trigger, and resolution. Tickets are proposals and never directly mutate durable content. Applying an accepted ticket later requires versioned file edits, impact analysis, validation, and reference runs.

## D-040 — Book-workflow patterns are reused as invariants, not copied wholesale

Status: accepted. The public `fractured-fate-book-1` repository informed the intake/review contract: immutable raw intake, normalized deduplication, a single authoritative status registry, explicit accepted/rejected/deferred/superseded outcomes, technical-first dependency handling, resurfacing triggers, decision records, and generated indexes. PsychSim implements only the bounded equivalents appropriate to local clinical content; it does not import the book project's domain-specific pipeline or scripts.

## D-041 — Incompatible pre-release receipts are archived on migration

Status: accepted. SaveData v4 cannot truthfully reinterpret an old 0–100 receipt as raw care points. Migration preserves the old payload in a local `legacyArchive`, retains the compatible profile balance, and starts typed v4 attempts/queues/tickets cleanly. It does not silently fabricate a new score or discard the historical bytes.

## D-042 — Medical approval is rule-level

Status: accepted. Workup objectives, treatment grades, conditional requirements, treatment pathways, score rules, medication modifiers, medication tag sets, test profiles, and test components each carry an independent clinical-review record. An approved rule must identify its reviewer and review timestamp. Case-level release metadata remains useful, but cannot imply that every embedded rule was clinically approved.

## D-043 — Evidence changes create impact tickets

Status: accepted. A new source or changed claim never propagates directly through tagged medications or patient families. Deterministic impact analysis identifies candidate rules and patients, then creates tickets. Human resolution decides whether each proposed change is accepted, narrowed, rejected, deferred, or superseded before versioned content changes are made.

## D-044 — Laboratory reporting follows current structured-result conventions

Status: accepted. Numeric laboratory observations use a FHIR/US Core-shaped contract: value, display unit, UCUM unit code, structured reference interval, applicable-population label, source ID, and adjacent `N`, `H`, or `L` interpretation. The UI always displays the interval. CLSI and CLIA require population-appropriate laboratory verification, so PsychSim does not claim one universal numeric range; each versioned test profile owns its interval and review record.

## D-045 — One broad primary patient pathway is preferred

Status: accepted. A patient treatment reference declares one primary authored pathway whenever possible, such as exactly one medication carrying an accepted class/tag plus proportionate disposition. Medication-specific grades and fit modifiers supply swing room. Separate additional authored pathways remain available for genuinely distinct care routes, and safety referral/transfer paths are tracked explicitly rather than inflating the primary plan.

## D-046 — Developer tickets can be mirrored locally and exported

Status: accepted. Developer mode keeps IndexedDB as the immediate working queue. A development-only Vite endpoint can atomically mirror a validated, versioned ticket bundle to the fixed gitignored path `content/generated/local-review-tickets/tickets.json`; it cannot choose an arbitrary path and is absent from production builds. A separate Export JSON button downloads the same bundle for backup or future import.

## D-047 — Clinical conflicts have no automatic evidence winner

Status: accepted. The engine does not silently rank a guideline, review, trial, or author note to resolve a clinical conflict. Conflicting claims create linked clinical tickets and remain proposed or deferred until the user records a disposition. Technical dependency checks may run first, but they do not make the clinical choice.

## D-048 — Upgrade transactions are pure, atomic, and progression-safe

Status: accepted. `getUpgradeOffer` computes blockers and projected economics without mutation. `purchaseUpgrade` rechecks the same catalog/facility/lifetime/department/prerequisite/balance gates and returns either one validated ClinicState or a typed failure with no partial grant. A purchase reduces current spendable points only, never lifetime points, cannot create debt, and cannot run in Endgame or Developer practice mode. IndexedDB persists the resulting ClinicState through the existing repository boundary.

## D-049 — Formularies are additive location-and-clinic sets

Status: accepted. Available medication starts are the intersection of a patient's declared start options with the stable union of location baseline formularies and persisted clinic formulary purchases. The starter set contains fluoxetine, sertraline, and escitalopram; the first expansion adds bupropion, mirtazapine, and buspirone. Existing patient medications remain selectable for stop/explicit continue even if they are not stocked for a new start. Formulary availability constrains the menu and eligibility, not the patient-specific treatment score.

## D-050 — The first equipment loop uses equivalent ECG fulfillment

Status: accepted. The compact outpatient ECG upgrade costs 1,200 points, grants `equipment.ecg`, and makes the 70-point in-house method eligible instead of the 500-point outside method. The engine automatically chooses the cheapest equivalent method, yielding 430 points saved per use and a displayed three-use break-even. The patient-authored result, workup reward, omissions, and every care rule are invariant to ownership. Receipt baselines remain authored sendout comparisons and show external cost avoided explicitly.

## D-051 — The first formulary expansion broadens options without asserting fit

Status: accepted. The 800-point expanded outpatient add-on is a clinic-building affordance, not a blanket clinical recommendation. It grants start-menu availability only; the patient pathway, medication file, combination rules, and visible authored-versus-inferred label still determine the clinical evaluation. It unlocks no patient by itself in Milestone 2, avoiding an artificial requirement to buy it for safe progression.

## D-052 — The ECG prototype is source-noted but medically unreviewed

Status: accepted as prototype content pending ticket-based clinical review. The second runtime patient reports intermittent palpitations during existing citalopram treatment and owns a normal 12-lead ECG result. A concise source-use note records that the FDA citalopram label calls for further evaluation, including cardiac monitoring, when symptoms such as palpitations occur. The necessity weight, continuation-versus-switch scoring, and disposition penalties remain rule-level `unreviewed` content; bundling does not imply approval, and any disputed choice must be resolved through clinical tickets rather than automatic propagation.

## D-053 — Local source extraction is bounded, hashed, and inert

Status: accepted. The developer CLI supports PDF, DOCX, TXT, and Markdown files up to 50 MiB. It computes SHA-256 from bytes, deduplicates by hash rather than filename/date, retains every original in processed/archive/quarantine, records parser and timestamp metadata, and emits hashed chunks with page or section context. Raw documents, extracted text, manifests, and provenance stay gitignored and out of Vite. Extraction treats all prose as inert data and never executes instructions or changes a clinical rule.

## D-054 — Patient creation begins with a controlled review scaffold

Status: accepted as a non-AI authoring precursor. A checked-in request names one explicit runtime template, one new stable review-case ID, at least ten brief chief complaints, an adult age range, and optional exact source-document/chunk references. The compiler copies mechanics only, resets every inherited rule to medically unreviewed, validates the result, and creates blocking clinical-audit tickets. This makes a patient playable in local Developer mode without claiming that copied rules or cited prose are clinically correct.

## D-055 — Drive discovery and local byte processing are separate trust boundaries

Status: accepted. The connected `PsychSim documents` folder supplies remote metadata and, on explicit request, downloadable source material. Provider IDs and discovery state remain in a local ignored manifest. The local CLI hashes and extracts only bytes deliberately placed into the protected inbox; a connector listing cannot masquerade as a completed local extraction. The current discovered CANMAT PDF remains queued until its bytes are locally available and reviewed one source at a time.

## D-056 — GitHub Pages is a verified static production surface

Status: accepted. Vite takes an explicit deployment base path while local development remains rooted at `/`. A GitHub Actions workflow runs the repository quality/content/browser gates, builds for the repository subpath, verifies the emitted bundle, and deploys only `apps/web/dist` through the official Pages artifact flow. Public repositories deploy automatically; private deployment requires both plan support and the explicit `PSYCHSIM_ENABLE_PAGES` repository variable, so an unsupported private repository still receives green verification without a doomed deploy step. Pages adds no backend: IndexedDB remains device-local, Developer mode remains absent, and source documents/extracted text remain ignored and forbidden from the bundle. The backup repository begins private; changing repository or Pages visibility is an explicit owner decision.

## D-057 — Formal sources and expert opinion are explicit and separate

Status: accepted. Every formal article, guideline, regulatory document, or comparable publication receives one stable evidence-catalog file containing bibliographic metadata, identifiers/link, known content hashes, and separate bibliographic/medical review states. A contribution record identifies all source IDs used, exact target content IDs, contribution categories, and what the source contributed. Catalog presence is not clinical endorsement. Notes, notebooks, and uncited judgment are labeled `Expert opinion` and cannot carry a formal evidence ID. Unlinked prototype rules display as Expert opinion; medically approved rules require an explicit contribution. Private extracted text remains outside the catalog and production bundle.

## D-058 — One canonical Codex thread owns each worktree

Status: accepted. PsychSim adapts the tested phone/CLI handoff state machine from `fractured-fate-book-1` with no runtime dependency on that repository. `PROJECT_STATE.md` is durable operational memory; a gitignored local lease records one canonical write-capable thread, direct-fork lineage, active-turn state, and branch/HEAD/status/project-state fingerprints. Explicit phone/Mac preparation, safe direct-child takeover, read-only drift reconciliation, stale-thread hook blocking, and deterministic tests reduce concurrent phone/computer edits. The lease stores no prompts, clinical content, source text, tickets, or secrets and never performs Git or clinical workflow actions. Normal validated commits and pushes remain required for cross-clone durability.

## D-059 — CANMAT application begins as five unresolved rule tickets

Status: accepted as review workflow, not as clinical adjudication. The verified CANMAT 2023 MDD guideline record remains medically unreviewed and has not been attached to an executable rule. Developer mode now surfaces separate proposed tickets for assessment/workup, episode severity and initial modality, the broad antidepressant baseline and fit modifiers, psychotherapy catalog/weighting, and disposition severity. In particular, the current medication-plus-psychotherapy requirement and unexplained sertraline/escitalopram/other-antidepressant point spread are treated as conflicts to resolve, not recommendations that Codex may silently apply. The user must accept, narrow, reject, or defer each ticket before versioned clinical content changes.

## D-060 — Facility thresholds grant eligibility, then require an atomic purchase

Status: accepted for Milestone 3 balancing. The solo office has one patient slot. At 2,500 lifetime points, the player may separately spend 1,800 current points to move to a two-slot outpatient clinic. At 7,500 lifetime points, and after the outpatient-clinic purchase, the player may spend 5,000 current points for a three-slot multidisciplinary center. A threshold never grants a facility, spending never reduces lifetime points, and a move preserves equipment, formularies, decor, and the exact resolved waiting patients. These point values are explicit prototype economy parameters and may be rebalanced without changing the transaction model.

## D-061 — Decor uses a cataloged rational satisfaction curve on positive rewards only

Status: accepted for Milestone 3 balancing. Decor lives in its own catalog and contributes additive raw satisfaction plus a stable visual token. The current curve is `raw / (raw + 20)` mapped from 1.00× toward a 1.15× cap and rounded to three decimals. The plant, artwork, and warm lighting contribute 6, 10, and 16 raw points. The multiplier applies to base reimbursement, nonnegative care points, and positive case bonuses; negative care points are then applied at full value. Care traces, safety errors, treatment grades, and clinical caps are invariant, and the unsafe reference policy still banks zero.

## D-062 — Patient pools are explicit but never player-facing diagnoses

Status: accepted. Every patient definition declares `starter`, `transitional`, or `advanced` metadata for future pool balancing. The launcher still shows only name, brief complaint, and setting. Pool classification does not itself establish eligibility: lifetime threshold, compatible facility location, complete reachable workup path, formulary/tag option, intervention/disposition capabilities, and safe referral remain independent gates. All currently approved patients retain a zero minimum so Normal mode can show every approved prototype as requested; review-only advanced content remains quarantined to Developer mode.

## D-063 — Ticket review is completed in the UI and handed off through one local file

Status: accepted. Every Developer ticket has an editable reviewer-notes field. Saving a review writes status, notes, and note timestamp to IndexedDB and refreshes the complete schema-validated queue at `content/generated/local-review-tickets/tickets.json`. Clinical decision statuses require a written rationale. The user can then tell Codex that the local review is ready; no browser-console work or pasted decision transcript is required. The visible handoff button retries the same fixed-path write, JSON export remains a backup, and Playwright uses `tickets.e2e.json` so automated tests never overwrite human review. Neither persistence action changes executable clinical content.

## D-064 — The reviewer supplies instructions, not a workflow status

Status: accepted; supersedes the user-facing portion of D-063. The overlapping proposed/in-review/accepted/deferred/rejected/resolved selector is removed from Developer mode. Every ticket instead asks “What should Codex do?” Saving nonempty prose marks the ticket internally as reviewed, persists it in IndexedDB, and refreshes the same Codex handoff file. Codex infers whether the request means implement, preserve, defer, source, or clarify and asks only when a consequential ambiguity remains. Internal status and resolution fields remain available for audit and later tooling but are not choices the clinical reviewer must manage.

## D-065 — Ticket rule audits are derived from executable content

Status: accepted. A Developer ticket with a patient ID embeds a compact read-only audit derived from the parsed blueprint, shared catalogs, and service resolver. Target IDs focus the display; a case-wide ticket shows the complete set. Investigation rewards/omissions/costs, treatment bases and fit modifiers, pathway prerequisites/par, disposition and safety values, cannot-miss rules, point caps, selectable treatments, provenance, and reference policies are visible without running the patient. React owns presentation only; the inspector does not score, mutate, or create a second clinical rubric. Existing local reviewer instructions survive checked-in ticket-target refreshes.

## D-066 — Unresolved evidence questions are first-class source requests

Status: accepted. A versioned, tracked, runtime-excluded `SourceRequest` records one exact clinical question, affected content/tickets, preferred formal-source types, acceptance criteria, existing evidence that did not close the gap, and the `PsychSim documents` destination. Its internal source-needed/received/resolved state is descriptive, not a reviewer dropdown; resolution requires linked evidence and a note. Source requests never alter rules. Drive discovery, local hashing/extraction, evidence contribution, impact analysis, content versioning, and clinical approval remain separate gates. The initial queue covers ECG necessity, ECG continue-versus-switch logic, TSH workup indications, MDD severity generation, and suicide-risk/disposition provenance.

## D-067 — Diagnosis families own qualitative top-down guidance

Status: accepted. Each diagnosis family has one file containing rules shared by the family plus
nested severity and specifier branches. Composition order is base, selected severity, selected
specifiers, then other active diagnoses. Reusable diagnosis rules use qualitative stances and
constrained catalog targets; they do not own point values or case-local predicates. Patient
templates own the generation envelope, focused decision state, narrow case-specific exceptions, and
provenance; resolved patient and encounter instances preserve the compiled result.

## D-068 — Critical random context must bind visible facts to fit inputs

Status: accepted. A fact that can change treatment fit, workup, safety, diagnosis, or complexity is
not a cosmetic variant. A reviewed patient clinical-context dimension resolves one gameplay-weighted
option deterministically, saves it in the CaseInstance, binds the same structured findings for every
option, and contributes derived tags to downstream rules. D-073 clarifies that the typed fact or
measurement is the source of truth. The distribution is labeled a game weight, not prevalence.
Cosmetic presentation variants remain clinically inert.

## D-069 — Incompatible diagnosis guidance quarantines the composition

Status: accepted for the current low-complexity checkpoint; requires narrowing before complex
generation. Missing definitions, duplicated active diagnoses, source-disabled severity, invalid or
mutually exclusive specifiers, mutually exclusive diagnoses, and incompatible active
recommendation stances produce stable conflicts. File order, recency, diagnosis count, and apparent
specificity cannot automatically choose a clinical winner. A future patient-specific override must
be explicit, sourced or labeled expert opinion, versioned, and reviewable. Realistic
multi-diagnosis patients will also contain valid benefit-versus-risk tensions, so D-077 requires the
next compiler to distinguish those from malformed or unwinnable content.

## D-070 — Patient complexity is a vector before it is a level

Status: provisional pending playtesting. Diagnosis count alone does not set patient level. The engine traces separate diagnostic, pharmacologic, workup, safety/disposition, and information-burden contributions. It does not yet collapse them into one unlock tier. The future aggregation policy must be versioned and tested against case duration and reference patients rather than embedded in diagnosis files.

## D-071 — Optional comorbidity pools belong to patient families

Status: accepted. Each patient template explicitly owns its candidate comorbidities, constraints,
and game-selection weights. Diagnosis files own compatibility, overlap, and exclusion metadata but
do not create a global random-mixing pool. Game weights are not labeled as epidemiologic
prevalence. Every resolved combination remains subject to deterministic consistency,
accessibility, and safe-route validation.

## D-072 — Objective fit and discovery credit are separate

Status: accepted. A resolved patient fact can affect the objective fit or safety of a treatment
even if the player did not ask about it. A separate workup rule evaluates whether the player
obtained the relevant information. Receipts trace the treatment-fit effect and the
discovery/omission effect independently; neither is silently substituted for the other.

## D-073 — Typed facts own values; derived tags provide cross-file indirection

Status: accepted. Reusable stable tags such as a high-BMI context remain valid references across
diagnosis, medication, workup, and patient files. A typed clinical fact, category, or measurement is
the source of truth, and a versioned derivation produces the tag. Free strings cannot independently
claim a value or contradict the resolved fact. The fact, derivation version, and derived tag are
saved for replay and audit.

## D-074 — One selected diagnostic standard owns criteria and severity

Status: accepted for now. A diagnosis family identifies one versioned diagnostic standard for
criteria, severity, and specifier semantics. Treatment guidelines consume those states and may add
recommendations, but do not redefine the diagnosis in their own files. Conflicting or newer
standards enter the evidence/ticket workflow rather than silently changing generated patients.

## D-075 — Source-controlled patient files are generator templates, not fixed people

Status: accepted as the target architecture. Every playable person is deterministically generated
and saved as a resolved instance. A source-controlled patient template describes the setting,
condition and chart-record constraints, medication and prior-trial constraints, presentation
modules, encounter focus, and narrow patient-specific adjustments. Shared diagnosis, medication,
test, therapy, and decision-policy knowledge is referenced rather than copied into a per-case
treatment plan. “Case” may remain player-facing shorthand, but schemas distinguish template,
patient instance, encounter instance, and attempt.

## D-076 — The clinical engine must represent complex records without grading a complete plan

Status: accepted as a long-range engine requirement. The data model must eventually support a
hospital patient with multiple internal conditions, diagnosis records of varying reliability,
duplicate medication/classes, many active regimen entries, structured prior trials, and an acute
syndrome such as delirium. Each encounter still grades focused initial questioning/workup and the
best immediate decision, with necessary companion safety actions, rather than requiring an
exhaustive treatment plan for every active problem.

## D-077 — Clinical tension is not the same as invalid generation

Status: accepted. The compiler distinguishes structural invalidity, clinically meaningful
benefit-versus-risk tension, disagreement between evidence sources, and disagreement only about
point magnitude. Structural impossibility, inaccessible required care, and the absence of any safe
route remain quarantine conditions. A reviewed safety constraint may govern an otherwise valid
clinical tension while the competing benefit and safety rules both remain visible in the trace.
A patient-specific override is required only when the general reviewed rules cannot resolve the
patient state safely. Evidence disagreement creates a ticket and keeps the disputed executable
change disabled. Point-magnitude disagreement routes to balance review without changing the
accepted clinical direction.

Implementation note: this is the binding policy for the next generated-patient compiler. The
current `composeDiagnosisGuidance` checkpoint still reports every opposing stance as the older
blocking `RULE_STANCE_CONFLICT`; it must not be described as implementing this taxonomy yet.

## D-078 — Complexity aggregation remains deliberately unset

Status: accepted provisionally. A patient template declares a target envelope across the existing
diagnostic, pharmacologic, workup, safety/disposition, and information-burden dimensions. After
composition and deterministic generation, the engine measures the resolved patient rather than
assuming the template hit its target. A generated candidate is accepted, deterministically retried,
or quarantined according to the envelope. The envelope will be workshopped against reference
patients before any scalar player-facing level, unlock formula, or permanent generation budget is
introduced.

Implementation note: the current engine exposes the five-axis trace only. Template envelopes,
deterministic retry, and quarantine-by-envelope remain planned compiler work.

## D-079 — WHO mhGAP is a baseline source map, not automatic specialist authority

Status: accepted. The 2023 WHO mhGAP guideline is cataloged and processed as a broad baseline for
candidate diagnosis, treatment, safety, monitoring, and patient-template work. Its intended
non-specialist and global/resource-sensitive context, recommendation strength, and certainty must
remain visible. Source text is mapped one recommendation group at a time, beginning with depression
DEP1–DEP4. A WHO recommendation can create medically unreviewed claims, scaffolds, tickets, and
source requests, but it does not automatically activate scoring or outrank a more specific source.
Specialist guidance, diagnostic standards, medication files, and patient-specific facts may refine
or conflict with it; those disagreements stay explicit in the ticket workflow.

## D-080 — Source-derived patients enter through Developer review

Status: accepted. The first source-derived output is a small number of deterministic,
medically-unreviewed Developer-mode patient scaffolds rather than bulk case generation. Each
scaffold retains exact evidence-source, local source-document, and source-chunk provenance and has
blocking inherited-rule and source-application tickets. The reviewer may flag the whole encounter,
a receipt row, or an exact rule. “Needs another guideline or source” is a first-class flag category;
it creates a local ticket for Codex to convert into a tracked source request rather than inventing
missing guidance. Nothing is promoted or added to executable shared guidance merely because the
scaffold is playable.

## D-081 — Clinical gameplay is a best-next-step snapshot

Status: accepted; narrows any earlier longitudinal language. A PsychSim encounter asks what the
player should do at this moment: read the short stem, buy focused history/examination/lab/imaging
information, choose an intervention combination, and choose a disposition. It is not a longitudinal
care simulator. Historical prior trials, adherence, response, adverse effects, and recent changes
may inform the snapshot, but the engine does not require follow-up intervals, monitoring plans,
reassessment schedules, adequate-trial clocks, or future contingency planning. A later source may
inform a different continuation or withdrawal patient without adding virtual time to the current
encounter.

## D-082 — Clinical state, source support, and player knowledge never collapse

Status: accepted. The resolved patient owns the modeled facts; evidence records explain where
candidate clinical behavior came from; encounter events determine what the player has actually
learned. UI wording may make a pre-reveal option feel natural and compact, but the backend and
receipt must always disentangle those three layers. Unknown is not false. A lower-priority routine
path may be deferred by a relevant finding or missing selected-treatment prerequisite, but the
engine does not impose one rigid universal hierarchy on every patient. Unknown to the player is
not absent from the patient: player knowledge never gates an objectively applicable treatment-fit
or safety effect.

## D-083 — Primary choices dominate points; fit remains rich but bounded

Status: accepted as the scoring contract for the next engine pass. The complete intervention
combination and disposition are co-primary decisions and own most available points. Explicit
medication, diagnosis, symptom, BMI, metabolic, prior-trial, interaction, and preference modifiers
may stack within a bounded goodness-of-fit budget so a careful choice matters without outweighing a
critical error. A contraindicated intervention receives no positive fit modifiers; `discouraged`,
`avoid`, and `contraindicated` remain distinct reviewed severities. Information/workup rewards have
per-action or category caps, and missing workup is penalized only for a big miss or an explicit
patient/treatment prerequisite. Unnecessary tests usually lose only their cost unless independently
harmful. One underlying mistake receives only the worst applicable consequence through a stable
issue ID rather than stacked duplicate penalties.

## D-084 — Reusable findings are stable atoms and absent diagnoses permit symptoms

Status: accepted. Any symptom, observation, history item, or other concept reused across multiple
owners receives a shared stable definition rather than copied prose. Diagnosis, patient-template,
test, scale, and presentation-module files reference those atoms. A diagnosis constrains a coherent
criteria-bearing set but does not monopolize its symptoms: a patient without that diagnosis may
still have common, subthreshold, or context-appropriate findings such as intermittent anxiety or
sleep difficulty. Shared atoms increase uniformity and variation without allowing a unique phrase
to identify a memorized patient. D-087 defines how multiple owners constrain the same atom.

## D-085 — Developer opinion remains a distinct provenance object when sources are attached

Status: accepted and implemented for the authoring catalog and local Database projection. An authorized
psychiatrist/developer judgment is labeled `Developer opinion` and stored separately in a concise,
versioned form. A later source review may mark a publication as supporting, contextualizing, or
challenging/limiting that opinion, but the opinion does not become a direct guideline recommendation
merely because a source is linked. Where the judgment is more specific or interpretive than the
publication, the provenance remains both the publication relationship and Developer opinion.
This supersedes D-057's assumption that an expert-opinion object can never have a formal-source
relationship. `DeveloperOpinionCatalog` now owns the opinions and their separately reviewed
evidence relationships. Every relationship preserves whether the publication supports,
contextualizes, challenges, or limits the opinion, plus what interpretive bridge remains the
developer's. The catalog is nonruntime, cannot assign points or activate a rule, and is projected
only into the local Developer Database through a minimized schema.

## D-086 — Lawful processing and publication corrections are evidence gates

Status: accepted. A formal evidence record now states full-text availability, reuse status, AI-use
status, local-extraction status, license/terms links, jurisdiction, population, setting, version,
and review dates. Free-to-read does not mean permitted for AI ingestion. Sources that require
permission or prohibit AI use remain metadata-only and generate access tickets rather than inferred
claims. Corrections, updates, superseding publications, companions, and executive summaries are
separate source records with validated relationships. None of these records activates clinical
behavior without a rule-level contribution and human review.

## D-087 — Shared findings resolve from traced constraints, never file precedence

Status: accepted as the compiler contract; runtime implementation remains pending. A diagnosis,
patient template, comorbidity module, medication, scale, or background module contributes a typed
constraint to a shared finding rather than assigning the final value directly. Initially supported
constraint roles are equivalent to `required-present`, `required-absent`,
`diagnostic-requirement`, `weighted-tendency`, and `no-opinion`.

The deterministic resolver first honors explicit case-critical facts, then satisfies active
diagnostic/cardinality requirements, combines compatible weighted tendencies, and finally draws
unconstrained background variation. An author may fix a critical result only through an explicit,
versioned patient/template constraint with a reviewable reason. A hard contradiction is never
resolved by load order, file recency, apparent specificity, or diagnosis count; it produces a
stable conflict and clinical-review ticket or quarantines the generated candidate when no safe,
coherent resolution exists.

The resolved `PatientInstance` saves every contributing owner, constraint, derivation version,
deterministic draw, final value, and conflict outcome. The player-facing result may blend those
influences into a compact finding, while the developer audit and post-submission explanation can
disentangle them. This decision specifies composition behavior but does not yet choose numerical
probability calibration for soft tendencies.

## D-088 — Coherent incidental findings may promote an internal diagnosis

Status: superseded by D-089 before runtime implementation. Automatic diagnosis promotion from
independent background findings was judged too likely to turn a symptom randomizer into an
uncontrolled syndrome generator.

## D-089 — Full syndromes come from condition modules, not coincidental background draws

Status: partially superseded by D-171 before runtime implementation. D-171 retains condition-level
ownership and forbids automatic diagnosis promotion, but removes the symptom-count cleanup,
retry, and quarantine behavior below. Ordinary
background variation may produce isolated, overlapping, and subthreshold symptoms, but it must not
independently assemble a complete coherent syndrome such as mania. A full additional condition
enters the internal `ConditionState` only through a template-required condition or a deliberately
eligible optional-comorbidity module selected at the condition level. The post-submission
Developer audit distinguishes those origins.

After findings are resolved, reviewed operational criteria act as a consistency validator. If
background draws nevertheless satisfy an unrequested full syndrome, that is a generation defect:
the candidate is deterministically retried or quarantined rather than silently promoted. Diagnosis
definitions also declare reviewed incompatibilities. A generated patient containing incompatible
active conditions, or a condition incompatible with the template's intended decision state, is
invalid and receives the same retry/quarantine treatment. Chart diagnosis entries remain separate
and may still contain inaccurate or historically superseded labels.

This guardrail does not remove subthreshold human variation or prevent those findings from
affecting treatment fit. It prevents independent random facts from silently replacing the authored
question-bank decision state.

## D-090 — Patient templates bound diagnoses and minimally repair random threshold crossings

Status: superseded by D-171 before runtime implementation. Findings are no longer removed merely
because their surface symptom count resembles another disorder. A
patient template declares the diagnoses that a generated patient may contain: required conditions
and a small explicit pool of eligible optional conditions. The generator does not discover
additional diagnoses from arbitrary background facts.

After findings are resolved, operational criteria may be used as a guardrail. If disposable
background findings accidentally push the patient across the threshold for a diagnosis outside the
template's allowed set, the generator removes the smallest deterministic set of lowest-priority
background findings needed to return below that threshold. Authored critical facts,
diagnosis-required findings, medication effects, and other protected facts are never removed by
this cleanup. The repair and removed finding origins remain visible in the Developer audit.

The initial repair budget should remain deliberately small—normally one or two background
findings. If the patient cannot be repaired within that budget, the candidate is regenerated or
quarantined because its randomization is too aggressive. This narrows D-089's default
retry/quarantine behavior and prevents the finding system from becoming a comprehensive diagnostic
inference engine.

## D-091 — Diagnosis compatibility uses two narrow reviewed relationships

Status: accepted provisionally and intentionally minimal. Diagnosis definitions may declare
`mutually_exclusive` when two internal condition states cannot coexist in the specified context,
or `reframes` when one condition changes how another symptom cluster is classified. Unspecified
pairs are allowed; the project will not attempt an exhaustive all-diagnosis compatibility matrix.
Relationships may be scoped to current episode, lifetime diagnostic truth, or a template's focused
decision state and retain source or Developer-opinion provenance.

For example, a template requiring routine unipolar MDD is invalid when a bipolar condition module
is also active, while depressive symptoms remain valid within bipolar disorder. Historical or
questionable chart labels are not deleted because chart diagnosis entries remain separate from
internal condition truth.

## D-092 — Safety information uses a routine screen followed by a purchasable assessment

Status: accepted as the question-bank information contract; runtime catalog migration remains
pending. Obtaining general psychiatric history reveals a concise routine suicide-safety screen as
one part of that broader result. The screen remains a structured patient report and does not state
that outpatient care is appropriate or otherwise make the disposition decision for the player.

`Suicide and self-harm assessment` remains a separate, universally searchable History action with
its own point cost. Purchasing it reveals the detailed structured fields together: current
ideation with passive/active distinction, intent, specific plan, recent preparatory behavior or
attempt, access to relevant means, prior attempts, and applicable acute modifiers. Findings that
also belong to another observation or history domain reference the same resolved fact atoms rather
than creating duplicate truths.

Until the detailed assessment is purchased, its component fields remain unknown even when the
routine screen is negative. The screen exists to help the player decide whether the added
information is worth its cost. Both actions are stable catalog options shared across patients;
only their structured results and case-specific scoring relevance vary.

## D-093 — Detailed safety assessment is conditionally valuable and can substitute for screening

Status: accepted as the information-economy rule; runtime implementation remains pending. A
positive or ambiguous routine safety screen, or another relevant resolved safety clue, activates a
high-value conditional objective for the detailed suicide and self-harm assessment. Its clinical
reward must exceed its point cost. After an entirely negative routine screen with no other relevant
clue, the detailed assessment remains available but ordinarily earns no additional clinical
points; its consequence is the points spent rather than a separate clinical penalty.

Purchasing the detailed assessment directly fulfills the routine safety-screen subobjective because
it contains that information, but it does not fulfill unrelated components of general psychiatric
history. This avoids a mandatory click sequence. If important suicide-related patient facts exist
and the player obtains neither screening nor detailed assessment, the omission remains eligible for
a major penalty. The receipt traces the screen, conditional trigger, detailed assessment, and
omission separately. The game-specific trigger and point values are reviewed Developer opinion
informed by the source, not a point formula attributed directly to the VA/DoD guideline.

## D-094 — Wrong-disposition penalties are asymmetric and issue-deduplicated

Status: accepted as the disposition-scoring contract; exact point values remain pending
playtesting. Disposition is a co-primary encounter decision. Unsafe under-escalation is the most
severe class: choosing routine outpatient care when emergency transfer is clearly required loses
the disposition reward and receives a large additional consequence that may reduce encounter
payout to zero. Gross over-escalation is also a major error: unnecessary emergency transfer for a
clearly manageable outpatient forfeits the disposition reward and imposes a substantial point
cost. Unnecessary urgent assessment is penalized less than unnecessary emergency transfer but must
still be meaningful.

The initial content set uses clear disposition states. A database plan may explicitly accept
multiple dispositions when genuine ambiguity is intentionally authored, but ambiguous
intermediate-risk generation is deferred until clear cases are fair in playtesting. One wrong
disposition produces one stable issue and one combined itemized consequence; its receipt row may
explain safety, resource use, and plan mismatch without stacking duplicate penalties. Unsafe
under-escalation remains worse than over-escalation, while over-escalation remains costly enough
that sending every patient to the emergency department is not a viable strategy.

## D-095 — BFCRS is searchable everywhere while catatonia patients are setting-weighted

Status: accepted as the catatonia encounter contract; exact scale-content ingestion remains
permission-gated. The universal investigation catalog includes a named Bush–Francis Catatonia
Rating Scale examination under Physical/Mental Status. Availability of the examination does not
make it point-relevant in every patient. Catatonia assessment receives points only when the
authored patient contains fair motor, behavioral, historical, or severity clues.

Catatonia-focused patient templates are weighted primarily toward inpatient, hospital, and
consultation-liaison pools. They are very rare in the routine outpatient pool and are not part of
the initial low-level “couch and clipboard” patient set. These are game-selection weights rather
than asserted epidemiologic prevalence. A template still declares its compatible locations and
must pass the ordinary safe-route validator.

The original BFCRS publication and University of Rochester assessment resources are publicly
identifiable, but an explicit license for reproducing their exact item wording in PsychSim has not
yet been verified. The game may reserve the stable action and structured-result architecture now,
but must not copy the instrument text until the source and reuse gate is resolved.

## D-096 — The player-facing BFCRS result is score-only

Status: accepted. After the player purchases the BFCRS examination, the ordinary encounter UI
shows only the resolved BFCRS score. It does not display an item list, interpretation,
scale-derived diagnosis, or disposition recommendation. Any item-level inputs required to
reproduce the score remain internal structured data and may be inspected only in the Developer
audit; they are not part of the normal player-facing result.

The source/reuse gate in D-095 still applies because calculating a faithful score may require
versioned item definitions and scoring anchors even when those items are not displayed.

## D-097 — Treatment scoring evaluates the complete intervention set with parsimony

Status: accepted as the general treatment-combination contract; runtime implementation remains
pending. Medication and psychotherapy are peer treatment modalities rather than a primary
medication grade plus a secondary nonmedication checkbox. When a reviewed algorithm ranks
medication and psychotherapy equally, one appropriate selection from either modality can fully
satisfy the primary treatment objective. When the source explicitly favors combination treatment,
one compatible medication plus one compatible psychotherapy receives a combination bonus. When a
combination is source-silent but neither redundant nor harmful, it remains acceptable without an
automatic bonus or penalty.

The evaluator applies reviewed cardinality and redundancy rules to the final set. Starting two
same-role antidepressants or selecting several simultaneous primary psychotherapies is penalized
unless an explicit combination pathway supports it. A contraindicated or dangerous duplicate
receives the applicable safety consequence and cannot collect positive fit modifiers. One
medication plus one therapy is not shotgun treatment merely because combination is neutral in a
particular algorithm.

Investigation parsimony remains primarily economic: every action costs points, indicated actions
earn more than their cost, and unsupported shotgun actions accumulate costs without clinical
reward. They do not also receive a duplicate clinical penalty unless independently low-value,
harmful, or part of a specifically reviewed waste rule. Treatment and workup reference runs must
include parsimonious, compatible-combination, shotgun, and unsafe selections.

## D-098 — Whole-patient Developer feedback is attempt-linked and uses the ticket handoff

Status: accepted and implemented. Every completed Developer-mode patient exposes one editable
“Case and app experience notes” field after the receipt. The note is not an isolated text blob and
is not forced into a single clinical-ticket category. Its `DeveloperAttemptReview` freezes the exact
`CompletedAttempt` plus a normalized snapshot of every information, medication, nonmedication, and
disposition option offered, including the option label, section, selection state, and displayed
service fulfillment/cost where applicable.

Save-data v5 persists these reviews in IndexedDB. Saving or revising one then refreshes the same
fixed, gitignored Codex handoff bundle used by ticket instructions; a writer failure leaves the
browser copy intact and can be retried from the Developer hub. When the user says reviews are
ready, Codex reads both arrays and grounds comments in the captured patient, choices, events,
receipt, and rule trace before proposing a change. A review note does not directly mutate content
or confer medical approval. The box is absent from Normal and Endgame receipts. The ordinary
Player artifact has neither the writer nor this review workflow; D-110 adds the separate finite
portable Reviewer exception without the writer.

## D-099 — Developer receipts expose categorized traces and a tested reference benchmark

Status: accepted and implemented from
`review.attempt.case.medication-check-palpitations.1`. Rule traces are grouped into workup,
medication selection, medication changes, safety/interactions, nonmedication care, disposition,
and efficiency. Point-changing rows appear first; zero-point rows remain available in a
collapsible subsection. Grouping changes presentation only and preserves the complete stored trace.

Developer mode uses the explicitly displayed current engine version to replay each reference
solution already declared by the saved `CaseInstance` against that exact patient, clinic snapshot,
encounter location, and resolved service costs. The receipt shows the highest-payout successful
replay, all actions and selections that produced it, and a comparison of every declared replay.
Ties resolve by care points, lower workup expense, then stable ID. The UI calls this the “highest
tested reference payout,” never a global optimum, because the engine does not exhaustively search
arbitrary treatment combinations. Invalid reference policies remain visible. Normal and Endgame
receipts do not expose this answer key. No clinical rule, patient content, or point value changed
while processing this review.

## D-100 — Post-submit results compare the player plan with the tested database plan

Status: accepted and implemented; supersedes only D-099's restriction of the benchmark to
Developer mode. After treatment is locked, Normal, Endgame, and Developer receipts may expose the
database comparison because it is now part of the requested debrief rather than a live answer
hint. The player's exact purchased information, resolved cost/fulfillment, treatment, and
disposition appear beside the completed declared `database_plan` replay for the same
saved patient and clinic snapshot.

The database-plan care score normally sets the full comparison-bar scale and the player score fills
it. If the player exceeds the database score, the scale expands to the player total and retains a
labeled database marker inside the bar. A negative player score has zero visual fill while its
signed value remains explicit. The full all-reference table and replay failures remain
Developer-only. The benchmark is always labeled finite/database-calculated rather than globally
optimal.

## D-101 — Developer mode inventories uncited opinions without inventing sources

Status: accepted and implemented as an audit surface. D-085's dedicated Developer-opinion
catalog is now implemented separately; the older inferred inventory remains useful for locating
unattributed executable rules and does not silently convert them into accepted opinions.
Developer mode derives a searchable list of current rule-level
clinical claims that have no formal `EvidenceContribution`. Copies of a stable rule across patient
scaffolds are one inventory entry with multiple owners rather than dozens of duplicate tickets.
Existing `SourceRequest` records are linked when their target IDs overlap; uncovered entries are
visibly marked as needing a future source ticket.

The inventory asks for evidence supporting the clinical direction. Exact point values, caps, and
other game weights remain Developer balance judgment and are not misrepresented as claims a paper
must supply. The list is read-only and does not auto-attach evidence, approve rules, or create a
ticket for every occurrence.

## D-102 — Standardized diagnosis classification is authoring-only

Status: accepted and implemented. PsychSim keeps the comprehensive standardized diagnosis index
separate from the small playable diagnosis-rule catalog. The tracked CDC/NCHS ICD-10-CM FY 2026
F01–F99 release manifest pins an expected local cache of 1,112 exact codes/titles,
billable/category state, source order, and PsychSim-derived code-prefix navigation. It records the
official archive hash, source-member hash, April 2026 verification artifact, importer version, term
count, and normalized output hash.

The generated terms are gitignored local data under D-103's narrow U.S. fair-use assessment. The
classification directory and stable term IDs are excluded from `CatalogBundle`, repository
distribution, and production output. An ICD entry never supplies diagnostic requirements,
severity, treatment, scoring, or medical approval. A playable diagnosis may later hold a compact
independently reviewed mapping with an explicit release, code, semantic relation, note, and review
record. Label similarity and file order never create mappings.

## D-103 — Source use and fair use are explicit, independently validated gates

Status: accepted and implemented. Every authoring-only formal source has a separate
`SourceUseDecision` before its text is stored, extracted, processed with AI, transformed into
structured content, redistributed at runtime, or used commercially. The record states its legal
basis, territory, exact permitted uses, attribution, required notices, commercial/ShareAlike
limits, third-party handling, reviewer role, timestamp, and rationale. Bibliographic verification,
lawful processing, medical review, and runtime inclusion remain independent decisions.

Fair use is not PsychSim's default ingestion license and private/noncommercial study is not treated
as an automatic exemption. Any proposed fair-use exception must identify a precise bounded use and
record purpose/character, nature of the work, amount/substantiality, market effect, reviewer,
timestamp, and conclusion. The schema rejects `legalBasis: "fair_use"` without that four-factor
assessment. One current decision permits a gitignored, non-AI, noncommercial U.S.
authoring/search cache of ICD-10-CM F01–F99 code-title data and expressly forbids runtime,
repository, export, or commercial redistribution. A separate decision covers only the existing
independently worded citalopram safety proposition, without storing, extracting, quoting, or
redistributing label text. Neither assessment is a blanket educational exemption or permission to
ingest the broader source.

## D-104 — Diagnostic background uses a layered lawful-source strategy

Status: accepted and implemented as an authoring boundary; no new clinical rule is activated.
The official CDC/NCHS ICD-10-CM release supplies a local U.S. psychiatric classification lookup
only under D-103's narrow fair-use record. CDC states that WHO owns ICD-10, WHO directs U.S.
modification licensing questions to NCHS, and ICD-11 Creative Commons terms are not imported into
the ICD-10-CM decision. Common playable diagnoses should draw original structured feature packs
from verified reusable federal sources such as NIMH, VA/DoD, VA, SAMHSA, NIAAA, CDC, or other
source-specific open material.
Treatment/safety guidelines remain distinct from diagnostic requirements. Any residual clinical
delta is a concise, separately labeled Developer opinion.

Source-specific terms control over generic landing-page metadata. The 2024 WHO CDDR landing page
links a generic ShareAlike deed, but page iv of the official PDF identifies that work as CC
BY-NC-ND 3.0 IGO and expressly prohibits adaptations without WHO permission. The ICD-11 digital
classification/API is separately NoDerivatives. CDDR and DSM-5-TR therefore remain metadata-only
and outside extraction, AI-assisted authoring, comprehensive paraphrase, and runtime content until
written permission changes their recorded decisions. Commercial question banks are not evidence
that PsychSim may copy DSM or the banks; independently authored clinical puzzles may test the same
facts without reproducing protected expression. Any future exact ICD-11 identifier catalog requires
a separate URI-bearing schema and source-use decision; the ICD-10-CM importer cannot be reused.

## D-105 — Medication and intervention knowledge separates facts, claims, opinions, rules, and points

Status: accepted as an architecture checkpoint; no medication rule, point value, patient, or
runtime treatment behavior changed. The current medication definition remains a compatibility
shape while future authoring separates: stable ingredient/formulation identity; sourced
classification and product/regulatory facts; population- and outcome-scoped evidence claims;
concise Developer opinions; executable game rules; and balance values. An imported fact or
comparative estimate cannot become a scoring rule directly, and a scoring rule cannot acquire its
point magnitude from a source file.

Each medication and therapy still has a stable one-record editing surface. Shared class knowledge
and evidence claims remain normalized, while a reproducible generated audit view assembles every
direct and inherited claim, opinion, rule, source, and impacted patient for one intervention. This
avoids both duplicating shared claims and forcing the reviewer to browse a graph manually.
PsychSim stable IDs remain primary when external RxCUIs, UNIIs, product/application identifiers, or
classification relationships change.

The therapy delivery/fidelity distinction originally described below is narrowed by D-189.

Medication definitions begin at ingredient level. Formulation/product entities are added only
when route, release pattern, delivery program, formulary availability, or a reviewed clinical
distinction affects gameplay. Therapy definitions distinguish generic modality, referral,
protocol-based delivery, and complete manualized program; a menu label alone does not establish
fidelity. Exact manuals, worksheets, scripts, skills curricula, and training materials remain
outside the database absent item-specific permission.

## D-106 — Public identity/regulatory data and open evidence are the medication source backbone

Status: accepted as a source boundary; actual importers, new evidence records, and clinical
transformations remain pending. Source-cleared RxNorm Current Prescribable Content, FDA/GSRS,
Drugs@FDA, carefully scoped DailyMed/openFDA records, FDA safety overlays, and selected NLM
specialist records are the preferred bulk factual scaffold. Condition-specific guidelines,
item-cleared systematic reviews, comparative studies, and landmark-trial records supply clinical
context. All imports begin authoring-only and medically unreviewed; source versions and hashes are
pinned, and later changes create impact tickets rather than overwriting runtime rules.

Carlat and UpToDate remain metadata/private-human-consultation sources because their current terms
prohibit the relevant derivative and AI/automated processing without permission. Cambridge Core's
noncommercial text/data-mining policy does not create blanket permission for every Stahl edition,
access product, AI workflow, persistent database, or future commercial use. Cochrane is evaluated
review by review, PubMed/PMC article by article, and AHRQ report by report. Restricted-source
knowledge supplied by the psychiatrist remains Developer opinion unless a separately reusable
formal source supports the claim.

The CC BY 4.0 Cipriani 2018 adult-MDD antidepressant re-analysis dataset is a strong candidate
comparative fixture, but its acute monotherapy population-average findings must not become a
universal drug ranking. STAR\*D supports narrow prior-trial/sequencing context rather than a
deterministic medication ladder. ClinicalTrials.gov supplies provenance and submitted trial
records, not efficacy authority. DrugCentral's CC BY-SA database was left as the first explicit
workshop decision because its breadth had to be weighed against source-mixing, currentness, and
ShareAlike/database-right obligations before any bytes were imported; D-107 resolves that choice.

## D-107 — DrugCentral is a gated, authoring-only aggregate seed

Status: accepted and implemented as a source-metadata and rights gate; no database bytes, clinical
claim, executable rule, point value, or runtime data were imported. DrugCentral's public
2023-11-01 database dump is cataloged as a `structured_database` under CC BY-SA 4.0. It is useful
for broad medication identity, product, indication, pharmacology, safety, and upstream-source
discovery, but its aggregate records are low-authority seeds rather than clinical truth.

The initial `SourceUseDecision` permits local deterministic storage, extraction/indexing, and
original medically unreviewed claim candidates. It blocks AI-assisted processing, runtime
redistribution, and commercial distribution until an isolated attribution/ShareAlike data package
and item-level upstream-rights review exist. Every derived candidate must retain release, record
origin, available upstream identifiers, transformation, licence, and `aggregator` source role. A
verified direct source can replace DrugCentral as support for the exact fact without deleting the
discovery trail. DrugCentral never selects first-line status, safety severity, executable
behavior, or care points.

## D-108 — Evidence precedence is tiered by question and multiple visible dimensions

Status: accepted as an authoring contract; claim/body schemas and resolver remain unimplemented.
PsychSim does not assign one permanent rank or numeric authority score to an entire source.
Evidence design is evaluated for the exact question: an applicable current synthesis often anchors
average efficacy; appropriate observational evidence can be more informative for rare or delayed
harms and excluded populations; controlled human PK evidence and current regulatory material can
anchor interaction or labeling propositions. Guideline recommendations remain decision products
with population, jurisdiction, values, feasibility, and certainty context rather than raw effect
estimates.

Future claims separate source role, study design, question-design fit, result-level bias or
source-supplied certainty, directness/applicability, currency/search-through date,
correction/supersession, and upstream provenance. GRADE-style certainty belongs to a compatible
body of evidence, not automatically to one publication. A newer study beyond a synthesis search
date triggers update review rather than automatically winning. Only Pareto-dominant,
like-for-like evidence can be preferred automatically; clinically meaningful nondominated
disagreement remains `contested` and creates a ticket. Developer opinion may bridge an evidence or
applicability gap but never inherits a cited source's certainty, and evidence resolution never
assigns points.

D-164 later supersedes only the proposed physical ownership of separate global `EvidenceClaim` and
`EvidenceBody` records. The question-specific comparison and disagreement rules above remain
binding. A compatible evidence-body view may be generated from source-local contribution units,
topical relationships, and Developer opinions without becoming another truth store.

## D-109 — The residency-article aggregate is a private container for dated Developer opinions

Status: accepted as an intake design. At this decision's checkpoint no SharePoint bytes or
opinions had been imported; D-139 through D-142 record the later exact-byte extraction and
metadata-only review bridge without opinion or runtime incorporation. The long aggregate export is
one private, hashed `SourceDocument` containing many logical
`AuthoredSourceUnit` articles, not one formal source or one mega-opinion. Each article unit keeps
its original title, byline, URL/venue, original and revision dates, section/chunk provenance,
asserted authorship, rights status, and currentness. Short atomic `DeveloperOpinion` candidates and
unverified bibliographic candidates derive from those units.

The residency articles are initially dated psychiatrist/developer synthesis. Personal authorship
does not automatically prove ownership of the residency site's exact expression, so article prose
and third-party tables, figures, scales, quotations, or screenshots stay private and out of
runtime. Embedded citations become formal evidence only after independent bibliographic,
source-use, and exact-claim verification. Later evidence can support, partially support,
contextualize, challenge, or limit an opinion without erasing its interpretive delta. Intake and
review proceed one article or small topic cluster at a time; accepted opinions still require a
separate content-change proposal, impact scan, clinical review, and balance decision before
gameplay changes.

## D-110 — Portable Reviewer is a finite static artifact, not public Developer mode

Status: accepted and implemented; extends D-038, D-056, and D-098 without promoting review
content. PsychSim now has three web artifacts: the ordinary Player build with approved-for-prototype
patients, the local Vite Developer environment with authoring queues and its fixed workspace
writer, and a portable Reviewer build selected by `VITE_PSYCHSIM_REVIEW_BUILD=1`. The Reviewer
artifact forces practice mode and imports the two prototypes plus exactly ten named
common-psychiatry `ReviewCaseScenario` files through one explicit package subpath. It never uses the
Developer review glob.

Every cohort patient and rule remains fictional, synthetic, medically unreviewed, and
`lifecycle: "review"`. Inclusion in the Reviewer artifact is a review-distribution exception, not
runtime/lifecycle approval. Its bundle scanner allowlist matches ten exact stable-ID/path pairs;
all other review patients, source documents, extraction records, classifications, source/opinion
queues, clinical ticket definitions, and the writable local endpoint remain forbidden. Launcher
cards hide source provenance and every other answer hint. GitHub Pages deploys this Reviewer
artifact from `main` so a colleague can use it on a phone without a local console.

## D-111 — Portable reviews are assignment-local until one complete manual export

Status: accepted and implemented; extends D-046 and D-098. Each portable Reviewer assignment owns
a stable ID and a separately named IndexedDB database. Patient run history, completed attempts,
flags, generated tickets, and multiple case/app-experience notes persist on that browser, device,
and origin. Every completed receipt remains reopenable after reload, including when the tab was
evicted after submission but before a comment was saved.

The version-5 JSON export identifies build kind, assignment, and engine version and includes every
completed attempt, every exact normalized option snapshot attached to a case comment, all flags,
and all tickets. Attempt-linked feedback is rejected if its completed attempt is absent. A reviewer
may complete several cases and email one file to the owner. There is no account sync, server
backup, application login, or bundle import. The UI warns the reviewer to export before clearing
site data or switching devices and not to enter identifiable patient information. Download object
URLs are revoked after a delay to avoid racing mobile Safari. Saving/exporting feedback never
edits content or confers clinical approval.

The assignment ID is a persistence-version boundary. Any material change to cohort membership,
scenario or policy semantics, or intended reviewer content must receive a new assignment ID; the
same ID must never silently represent a revised package. This prevents prior run history from
suppressing revised patients and prevents mixed-revision browser data. Version 5 does not yet store
an exact Git/release commit, so “build kind” must not be described as exact build reproduction.

## D-112 — Fictional names resolve first, last, and optional middle initial independently

Status: accepted and implemented. Shared curated pools contain at least one hundred first names and
one hundred last names. The deterministic `fictionalName` generator hashes separate stable
subkeys for the first name, last name, middle-initial presence, and middle-initial letter. The
default reviewed presentation probability is 25% for one middle initial. The same blueprint/seed
always resolves the same complete name; first/last recombination produces more than ten thousand
base pairings before age, complaint, occupation, and wording variation. Names remain
noncritical/cosmetic and never change diagnosis, fit, scoring, safety, or disposition.

## D-113 — Development is beta-first and main is the explicit distribution branch

Status: accepted as the durable Git workflow after this portable Reviewer checkpoint. `beta` is
the normal local and remote feature-integration branch. Validated checkpoints are developed and
pushed there. `main` is the stable GitHub Pages/distributed copy and changes only when the user
explicitly says `push to main` or gives equivalently clear promotion authorization. That
instruction authorizes promoting the verified beta branch as a whole; it does not authorize
cherry-picking convenient pieces, bypassing gates, force-pushing, or discarding divergence.

The Pages workflow verifies both `beta` and `main`, but configure/upload/deploy steps are restricted
to `main`. After a successful promotion, the working copy returns to `beta`.
`PROJECT_STATE.md` records the exact current branch, HEAD, remote relation, and last deployed
checkpoint. Unexpected local/remote divergence stops the workflow for inspection rather than being
resolved destructively.

## D-114 — Clinically meaningful duration is structured case state, not cosmetic prose

Status: accepted and implemented for the finite Reviewer cohort. A duration finding owns a stable
profile with numeric value/unit options, short swappable display variants, a related diagnosis,
an authored interpretation, and rule-level review metadata. The deterministic resolver chooses one
option, saves the numeric measurement and its stable option ID in the `CaseInstance`, and renders a
brief generic sentence. The same seed repeats exactly; current cohort ranges vary within the
authored diagnostic/episode state and do not change its rubric.

Duration is not a noncritical `VariantSpecification`. A future diagnostic near miss must explicitly
declare `designed_below_threshold` and name the reviewed diagnosis-owned criterion it misses. The
schema rejects a below-threshold claim without that criterion. It does not prove that a range is
clinically correct, infer a diagnosis, or activate cyclothymia criteria. Exact cyclothymia temporal
constraints remain the source/clinical-review ticket
`ticket.source.cyclothymia.duration-discrimination`.

## D-115 — Background symptom variation is bounded and cannot manufacture a syndrome

Status: accepted and implemented as a narrow Reviewer pilot. An otherwise neutral anxiety-history
result may deterministically contain zero or one positive finding. All threshold-relevant atoms are
variable and the declarative maximum is one, so the draw remains explicitly subthreshold and
cannot create a full anxiety syndrome. Primary GAD scenarios continue to own their complete
authored symptom set. This game-selection weight is not represented as epidemiologic prevalence,
does not infer a new diagnosis, and does not silently alter the focused rubric.

The validator now uses the same total-positive semantics as runtime when a finding set mixes fixed
and variable atoms. More symptom families require a reviewed cap, required absences, an explanatory
trace where points change, and consistency with D-084, D-087, D-089, and D-090. Pre-submit negative
and positive findings are visually explicit chips plus glyphs; absence is never conveyed only by a
plain list item or color.

## D-116 — Routine intake staff automate selected actions through auditable service fulfillment

Status: accepted and implemented as a bounded pre-Milestone-4 upgrade. The Clinical intake
assistant is a voluntary 900-point staff purchase gated at 600 lifetime points. Ownership creates
an empty persisted configuration. The player may select up to three of four neutral catalog
actions: medication reconciliation, adherence review, depressive-symptom checklist, and
anxiety-symptom checklist. Detailed suicide assessment, mania/psychosis, trauma, substance use,
exams, labs, and imaging are deliberately excluded.

Each configured action resolves automatically when the next encounter opens, reveals the same
patient-authored result, fulfills the same workup predicate, and records an ordinary
`InformationPurchased` event with `initiatedBy: "automatic_intake"` and the staff upgrade ID. Its
action-specific in-house method has a discounted but nonzero cost. A shared service does not become
cheap for unconfigured actions, and generic capability resolution cannot activate staff methods.
Receipt rows preserve initiator, delegated fulfillment, cost, and upgrade savings. Historical
replay starts empty and replays those persisted events; reference plans start with the same clinic
routine and skip already purchased nonrepeatable actions.

This is task delegation, not a department, salary, capacity queue, virtual clock, clinical
recommendation, or automatic treatment. Exact purchase and per-use values are provisional game
balance. Configuration affects future encounters only and remains empty in Endgame/Developer and
portable Reviewer unless explicitly chosen in a standard clinic.

## D-117 — One primary receipt meter and visible rule provenance

Status: accepted and implemented. The old circular point seal and separate “points vs database
plan” headline were removed. Desktop and mobile use one horizontal meter as the primary comparison:
player care points fill the bar; the database-plan value is a labeled marker; an above-plan score
expands the scale; a negative signed score remains explicit with zero visual fill. Detailed point
subtotals and side-by-side plan audit remain lower-page explanations, not competing score graphics.

Every collapsed rule row now announces `N references`, `Expert opinion`, a mixed
source/opinion label, or `Provenance unavailable` for a legacy empty snapshot. Expanding the row
shows the attempt-persisted citation/link and concise contribution statement. The UI never looks up
new catalog sources while rendering a historical attempt and explicitly separates source
contribution from game-balance point magnitude. Material Reviewer duration/content changes use the
new assignment ID `reviewer-assignment.common-psychiatry.2026-07b`.

## D-118 — Medication identity starts with a curated psychiatry allowlist and dated RxNorm CPC

Status: accepted as an authoring boundary; no importer or runtime medication expansion is
implemented. The first medication-identity scope is a curated board-relevant psychiatry ingredient
allowlist rather than every U.S. psychiatric-labeled ingredient or product. The exact source seed
is the July 6, 2026 U.S. National Library of Medicine RxNorm Current Prescribable Content monthly
release. NLM's official files and terms describe its normalized names/codes as U.S. government
public-domain data and the CPC subset as downloadable without a UMLS license. PsychSim records a
machine-validated source-use decision with NLM acknowledgement, non-endorsement, exact-release, and
currentness notices and excludes proprietary vocabularies from the full RxNorm distribution.

RxNorm may populate identity, normalized name, alias, RxCUI, and relationship candidates only. It
cannot establish diagnosis role, first-line status, efficacy, contraindications, interaction
severity, monitoring, fit modifiers, formulary access, case availability, or points. Those remain
separate sourced claims, Developer opinions, reviewed rules, and balance decisions. The proposed
first identity wave and existing thirteen-medication provenance audit are queued as Developer
tickets. Formulation depth is the next one-at-a-time product decision; do not implement a bulk
importer before that decision and an isolated source-backed identity schema are complete.

## D-119 — Phone installation uses a stable manifest and Git-SHA release marker without offline caching

Status: accepted and implemented as an explicitly requested bounded distribution slice. PsychSim
reuses the useful parts of the user's other apps: relative manifest identity, Apple Home Screen
metadata, dedicated icons, in-app Safari instructions, and a build-generated version marker. It
does not copy their hand-maintained cache names, unconditional service-worker activation, or
origin-wide cache deletion. Those older patterns can drift and can evict caches belonging to
another project on the shared GitHub Pages origin.

Every Pages package from `main` compiles and emits the exact full commit SHA, Reviewer build kind,
and `main` channel. Installed copies compare that strict `version.json` record on mount,
foreground, reconnection, a five-minute interval, and manual request. A mismatch remains visible.
Reload is unavailable during a patient or receipt and is explicitly initiated at the hub with the
new release ID in the URL. This preserves in-progress choices and comments while preventing an
old cached HTML entry point from indefinitely pinning hashed assets. GitHub Pages edge caching can
delay discovery by several minutes, and a closed/offline web app cannot receive an update; the
contract is reliable eventual discovery on a later online check, not an instantaneous push.

The manifest ID/scope, origin, Reviewer assignment ID, and IndexedDB name remain independent of
the release SHA. Updating never clears browser storage. The install UI warns that Safari and an
iPhone Home Screen app can use separate storage, so existing Safari feedback must be exported
before installation. Offline app-shell caching, service-worker migration, push, and device sync
remain Milestone 8 work rather than being implied by “installable.”

## D-120 — Apple Notes research intake is acknowledged, private, local-only, and provenance-preserving

Status: accepted and implemented as a local authoring adapter. The macOS folder named exactly
`Psych research` may first receive a metadata-only audit. The audit searches nested folders across
Notes accounts, requires exactly one match, and records provider
account/folder/note/attachment IDs, dates, counts, and locked/shared state in a gitignored
mode-`0600` manifest without requesting note titles, bodies, or attachment bytes.

Substantive sync requires explicit acknowledgments of no identifiable patient information,
authorization for private local processing, rights to process shared material, and the named person
making the acknowledgment. Unlocked new or changed notes are exported through Notes' public
AppleScript interface into a protected revision directory; exact provider provenance is retained;
attachments are SHA-256 hashed, size-bounded, MIME-identified, and duplicate-linked; and image/PDF
OCR uses only local macOS Vision/PDFKit unless explicitly skipped. One deterministic Markdown
composite per note then enters the ordinary hashed source pipeline. The manifest checkpoints after
every note. Locked notes, missing notes, unsupported attachments, and failures retain
metadata/status instead of being deleted, and the workflow never edits the Notes originals or
transmits source material externally.

The first authorized local run imported every one of the 204 note text records. Seven attachments
that the public Notes interface could enumerate but not save are quarantined individually; their
notes remain available from title/plaintext, and no partial attachment is accepted as source
bytes. This is a preservation behavior, not a waiver of the later source-use or review gates.

The folder is a private intake corpus, not formal evidence or executable content. Personal
takeaways remain Developer opinion; article images, OCR, and embedded references remain private
rights-unverified or bibliographically unverified candidates. Formal-source cataloging,
`SourceUseDecision`, exact-claim contribution, clinical review, content versioning, impact checks,
and balance remain separate gates. Apple Notes intake cannot directly modify patients, rules,
scores, citations, medical-review status, or the browser bundle.

## D-121 — Medication-list certainty, full treatment history, and body measurements remain distinct

Status: accepted and implemented for the current patient model. A patient opening may explicitly
provide a medication list or leave it unreconciled; an empty list is never silently interpreted as
“takes no medication.” Focused medication reconciliation and the more expensive full treatment
history remain separate actions. The latter can display many structured medication trials,
psychotherapies, current treatment relationships, and prior levels of care without putting therapy
inside a medication-trial result.

Weight/BMI and general physical examination are separate objective actions. Weight/BMI owns the
reviewed measurement; general examination may describe body habitus so elevated BMI is not assumed
to represent adiposity. Reviewer compilation preserves these structured details. Historical v5
saves receive additive defaults rather than being discarded or silently regenerated.

## D-122 — Selected interventions may have explicit operating costs

Status: accepted and implemented as a narrow service extension. A nonmedication intervention or
disposition may reference a service definition. Availability and least-cost fulfillment resolve
before the player can commit the selection; completion charges the chosen method exactly once.
Settlement and receipt separate investigation expense, treatment-service expense, and total
operating expense. The exact method and cost are frozen in Developer attempt-review option
snapshots.

Service cost never determines clinical correctness. A selected intervention can still receive its
clinical rule result independently of whether a future partner or owned service makes delivery
cheaper. The first example is brief substance-use counseling. This does not create recurring
salaries, capacity, scheduling, or longitudinal treatment simulation.

## D-123 — Developer questions are lazy decision packets with reviewable evidence proposals

Status: accepted and implemented as an authoring-only workflow. Large Developer queues and
individual tickets begin collapsed and do not mount their expensive rule trees until opened.
Closing a packet preserves unsaved local text. Patient questions attach only through an explicit
blueprint ID; shared action or medication targets do not imply a patient link. Saving from a
receipt can bind a ticket to that exact immutable attempt, and export validation rejects a
different-patient attempt.

A packet may include an unreviewed literature-synthesis proposal with a concise proposed answer,
eligible supporting sources, opposing or qualifying context, search scope, limitations, and
unresolved questions. A metadata-, abstract-, or inaccessible source cannot support the proposed
direction. Source-cleared support must match the evidence catalog and a use decision permitting
the synthesis. These packets never determine point magnitudes, mutate content, or approve a rule;
the psychiatrist's plain-language response remains the decision. The first pilot addresses the
starter-MDD initial-modality ticket only.

## D-124 — Material Reviewer option changes receive a fresh assignment namespace

Status: accepted and implemented. The portable Reviewer assignment is
`reviewer-assignment.common-psychiatry.2026-07c`. This replaces the `2026-07b` namespace because
the universal investigation menu, medication-list certainty, structured treatment-history
results, physical measurements, and service-backed treatment options materially changed the
offered-option snapshots. A fresh assignment uses a fresh IndexedDB name so a reviewer cannot
silently mix earlier run history with the revised cohort.

The assignment bump is a review-distribution boundary, not clinical approval. The ten scenarios,
their compiled rules, and every new option remain fictional, synthetic, and medically unreviewed.

## D-125 — Reaction history preserves the chart label and reviewed interpretation separately

Status: accepted and implemented as a typed patient-history slice. Every new patient definition
may carry an explicit `PatientReactionHistory` state: `unassessed`, `documented_none`, or
`entries_present`. An empty record array never silently means that the patient has no allergies or
adverse reactions. Medication triggers reference the medication catalog; nonmedication triggers
and manifestations use the small stable reaction-concept catalog.

Each reaction record preserves what the patient or chart called the entry in `recordedAs`
separately from the nullable `interpretedAs` field. A charted “allergy,” “intolerance,” or “adverse
reaction” does not prove an immune mechanism, and the engine must not infer a reviewed
interpretation from the label or manifestation alone. A later reviewed interpretation,
medication-fit rule, contraindication, or point effect remains a separate provenance-bearing
clinical decision.

`info.history.allergies-adverse-reactions` is now a neutral universal history option. Current
Reviewer scenarios explicitly own either a mild seasonal/environmental or food-allergy entry and
separately record whether medication reactions were assessed. The engine may display “no reported
medication reaction” only from `medicationAssessmentStatus: "documented_none"`; a nonmedication
entry alone never implies that negative finding. Legacy patient records default both overall and
medication-specific assessment to `unassessed` rather than fabricated none. Authored patient state
is validated against the visible structured result, and non-null `interpretedAs` values are
rejected until rule-level interpretation provenance exists. This data addition does not itself
award care points, change treatment fit, or claim medical review.

## D-126 — Additional-feature budget limits optional richness, not patient difficulty

Status: accepted and implemented as a schema and validation boundary; deterministic
optional-module selection remains future compiler work. `PatientComplexityProfile` records the
versioned `additional-feature-budget.v1` model, an additional-feature budget from zero through
six, no more than three selected modules, module costs from one through three, and eventual traced
five-axis contributions. Supported module kinds are allergy/reaction, prior treatment,
comorbidity, substance use, and a narrow other category; impact is restricted to background,
fit-modifier, or companion-safety context.

This budget controls only how much optional patient richness a template may carry. It is not a
scalar patient level, player-facing difficulty, `starter`/`transitional`/`advanced` pool
assignment, facility gate, clinical score, care-point value, reimbursement, or
`economy.complexityBonus`. The diagnostic, pharmacologic, workup, safety/disposition, and
information vector remains the measured complexity representation. A condition that reframes the
main question—such as mania, withdrawal, delirium, or an adequate-treatment nonresponse
state—belongs in required template/decision-policy content rather than a randomly selected
optional module.

Historical records receive the explicit `legacy_unmeasured` default, which cannot contain a
budget, selected modules, or target envelope. Current authored patients use `budget_only`: they
own a coarse optional-feature capacity but make no claim that their full clinical complexity has
been measured. `authored_envelope` remains available for a later calibrated compiler. The current
Reviewer cohort intentionally selects no optional modules; validation rejects nonempty module
selection until a stable module catalog and payload compiler exist. No automatic tier mapping,
patient generator, scoring, eligibility, or economy mapping has been added.

## D-127 — Existing safety-plan history is an investigation, not creation of a safety plan

Status: accepted and implemented as an information-boundary clarification.
`info.history.existing-safety-plan` asks whether the patient already has a written plan, crisis
contacts, support people, and access to those resources. It is a purchasable Subjective/history
result and does not itself create, revise, recommend, or clinically judge a safety plan. The
result also does not choose disposition for the player.

If creating or revising a safety plan is later offered, it must be a separate nonmedication
intervention with its own catalog ID, applicability, cost, scoring, provenance, and review.
Factual plan history and a newly selected intervention must remain distinguishable in saved events
and receipts. The existing medication counseling option is therefore labeled “Medication
adverse-effect education”; it no longer implies that selecting education also created a safety
plan.

## D-128 — Assignment 2026-07d includes one exact finite Reviewer ticket packet

Status: accepted and implemented as a bounded portable-review exception. The current portable
assignment is `reviewer-assignment.common-psychiatry.2026-07d`. It compiles the same ten medically
unreviewed scenario files at content version `1.3.0` and statically imports one exact stable-path
packet containing one patient-linked clinical-review ticket for each scenario. Validation rejects
a ticket whose blueprint is outside that ten-patient allowlist, and bundle safety permits only the
registered assignment ticket file in addition to the existing finite scenario paths.

This narrowly supersedes D-110 only where that decision excluded every preassigned ticket
definition from portable Reviewer, and it supersedes D-124 only as the current assignment
namespace. The portable artifact still excludes local Developer ticket discovery, source
requests, opinion queues, literature-synthesis queues, private source material, and the workspace
writer. It does not become public Developer mode.

Desktop keeps the detailed inline ticket interface and also offers a focused dialog. Mobile
presents each ticket as a compact launcher into a full-screen dialog with the same details and
response field. Responses persist only in the assignment-namespaced IndexedDB and enter the
existing version-5 manual export; saving never mutates a rule or grants clinical approval. The
namespace changed because the universal reaction/safety-plan options and preassigned review
questions materially changed the intended review package.

## D-129 — Apple Notes semantic review uses one separately acknowledged bounded packet

Status: accepted and implemented as an authoring-only privacy boundary. On 2026-07-25 Dustin
Rowland reconfirmed that he reviewed the `Psych research` Notes folder, found the material
appropriate for this workflow, and supplied the requested named “I confirm” acknowledgment. This
supplements the earlier no-identifiable-patient-information and local-processing authorization; it
does not waive third-party source licenses or make any note a redistributable source.

`content:notes:codex-review` requires the human to repeat explicit command-line acknowledgments for
no PHI, external AI processing, title/plaintext transmission rights, shared-material rights, and
appropriateness for OpenAI Codex. It reads one eligible note's verified `title.txt` and
`plaintext.txt` only, releases at most one deterministic segment, and excludes HTML, attachments,
OCR, composites, and extracted chunks. Titles, segments, whole packets, whole plaintext inputs,
and segment counts are bounded; segmentation depends only on title/plaintext bytes rather than the
selected model or provider revision. Packet identity hashes the complete canonical packet.
Protected directory chains reject symlinks and path escapes, private directories use mode `0700`,
and packet/audit files use exact mode `0600`. Packet JSON failures are reported without echoing
private source fragments. All private artifacts remain gitignored and outside web bundles.

The tool prepares a packet but contains no provider SDK, network call, API-key lookup, or automatic
classification. A real packet must name the exact model identifier exposed by the active Codex
surface. Because this thread does not expose that identifier with sufficient precision, no real
Notes packet was prepared or read in this checkpoint. Test fixtures use an explicit fake model
identifier. A future authorized read remains one packet at a time and cannot directly create
evidence, Developer opinion, rules, points, citations, or medical approval.

## D-130 — Safety-planning ability is a Subjective report, not a plan inventory or disposition

Status: accepted and implemented; this supersedes D-127's description of the current history
action while preserving D-127's separation between history and intervention. The player-facing
action asks whether the patient feels able to participate in safety planning. It does not ask
whether a written plan already exists, create or revise a plan, formulate risk, or declare a
patient appropriate for outpatient care.

Patient content owns a typed `reportedSafetyPlanningAbility` state: `reports_able`,
`reports_unable`, or `uncertain`. Historical saved patients receive the truthful `unassessed`
default. The purchased result reveals one short structured finding and a state-specific fact ID,
so a later reviewed disposition rule can use the factual response without treating purchase of
the question as a positive answer. No current point or disposition rule changed in this
correction; the response may inform case-specific disposition appropriateness but can never be the
sole determinant.

The internal action and service IDs retain the words `existing-safety-plan` and
`safety-plan-review` solely for compatibility with in-progress local saves. Their visible labels
and authored semantics are now safety-planning ability. Material changes to the Reviewer snapshots
move the ten scenarios to content version `1.4.0` and the portable assignment to
`reviewer-assignment.common-psychiatry.2026-07e`. The new assignment intentionally uses a fresh
IndexedDB namespace; any unexported `2026-07d` feedback remains in its old browser database rather
than being silently mixed with revised cases.

At local queue hydration, a waiting patient with the truthful legacy `unassessed` default is
re-instantiated from the current matching blueprint and its original seed. This preserves the
patient's deterministic identity while preventing the new menu label from revealing an old
written-plan result. Completed attempts and their historical snapshots are never rewritten.

## D-131 — Main tracks validated gameplay data; beta quarantine is risk-based

Status: accepted; supersedes D-113 only on release cadence and standing authorization. Validated
runtime case content, declarative scoring and rules, catalogs and provenance, and the finite
portable Reviewer ticket packet should normally be promoted to `main` after the complete
Player/Reviewer gates rather than waiting indefinitely on `beta`. The user's standing instruction
authorizes promotion for that class of change.

`main` remains the stable portable Reviewer artifact. Keeping content current does not authorize
the Pages build to import arbitrary local Developer queues, draft discovery, private sources,
authoring-only indexes, or the workspace writer. Lifecycle, exact-assignment allowlists, assignment
namespace changes, and bundle-isolation gates remain unchanged.

UI or application-mechanism work stays beta-only only when it poses a material failure risk to app
boot, navigation, persistence or migration, mobile review/export, install/update behavior, or
bundle isolation. Routine responsive and presentation changes may ship once the required desktop,
390-pixel, 320-pixel, iPhone/WebKit, Player, Reviewer, and bundle gates pass. Whole verified-beta
promotion remains the normal release path. Promote a safe checkpoint before starting
risk-quarantined work; never use the new cadence as a reason to cherry-pick convenient pieces,
rewrite history, force-push, or ignore unexpected divergence. The working copy still returns to
`beta` after a release.

## D-132 — Duplicate-start scoring is bounded now; normalized regimen reasoning stays queued

Status: accepted and implemented for the current initial-outpatient MDD snapshots. A validated
version-5 mobile Reviewer export recorded the psychiatrist/developer direction that multiple new
medications for one indication are ordinarily less parsimonious, while distinct indications,
supported augmentation, and an explicit future cross-titration state may justify a multi-drug
plan. The feedback bundle is review evidence, not a clinical source document, and did not enter
the source-ingestion pipeline.

The current first-visit MDD case and the Reviewer policy used by the initial, prior-good-response,
and prior-intolerance MDD snapshots now match any two or more simultaneously started medications
carrying the stable `antidepressant` treatment tag. They no longer enumerate only one or several
SSRI pairs. The change preserves the existing provisional harmful grade, penalty, and safety cap;
it does not claim those point magnitudes are a treatment guideline. One medication plus one
psychotherapy remains outside the duplicate-start predicate. Historical attempts retain their old
snapshots; affected content moves to new versions and portable review moves to assignment
`reviewer-assignment.common-psychiatry.2026-07f`.

This bounded rule does not create a universal polypharmacy engine. Every current medication file
already stores at least one human-readable class, but those strings are display metadata and must
not be parsed as executable relationships. A tracked Developer ticket and source request now own
the future normalized medication-class, indication or role, additive-risk, interaction,
augmentation-benefit, and cross-titration model. Each eventual contributor must remain separately
visible in the receipt trace, and clinical direction must remain separate from video-game point
balance.

The duplicate-start rule carries an explicit Developer-opinion contribution. The Reviewer-policy
compiler now preserves formal-publication versus expert-opinion authority per exact rule instead
of forcing every compact policy contribution to look formally sourced. The broad WHO contribution
therefore remains attached to the rules it actually seeded, while the new duplicate-start judgment
does not borrow WHO authority. Explicit Developer-opinion traces are labeled as such; genuinely
unattributed prototype rules still display `Expert opinion`.

## D-133 — Developer tickets receive a bounded literature-scout attachment

Status: accepted and implemented as authoring-only discovery. Every unresolved checked-in
Developer ticket has exactly one attachment: one or more clinically relevant search profiles, or
an explicit exemption for legal/access, identity/taxonomy, architecture, balance, or umbrella
questions that a meta-analysis cannot resolve. Scout v1 records exact inclusive window dates and
refreshes them as a rolling ten-calendar-year interval. The initial run spans 2016-07-25 through
2026-07-25. Within a bounded query, relevance is screened first and Europe PMC
`cited_by_count` selects the highest-cited suitable meta-analysis. Provider, scope, count, as-of
time, exact query, selected rank, and hashes remain visible because citation counts are mutable
and provider-specific; they are not evidence-quality scores.

A selected record carries a concise independently worded abstract-only summary and remains
medically unreviewed discovery context. “No suitable recent meta-analysis” is a valid explicit
outcome; the workflow does not substitute an unrelated paper. Discovery never changes a ticket
or source-request status, creates a formal contribution, attaches a runtime citation, selects
point magnitude, modifies a clinical rule, or grants approval. A refresh cannot silently replace
the selected paper; a changed candidate requires review.

Only local Developer tooling imports this sidecar. D-128 remains controlling: portable Reviewer
continues to exclude source requests, opinion queues, literature-synthesis queues, and this
literature-scout catalog, so this work does not change the assignment ID.

## D-134 — Personal knowledge is processed one bounded topic and one complete source at a time

Status: accepted and implemented as an authoring-only pilot. The first tracked profile covers
initial MDD antidepressant selection and allowlists its diagnosis and medication targets.
NFKC-normalized literal term groups may queue an Apple Notes source revision using the separately
authorized title/plaintext fields only. Matching is deliberately recall-oriented: it is not
semantic evidence that the source is relevant and cannot create a claim, citation, contribution,
rule, point value, ticket, or approval. HTML, OCR, attachments, composites, and extracted chunks
remain outside this semantic scope.

The unit of completeness is the exact source revision, not the first useful segment. The queue
records the expected deterministic segment count, every released packet and ordinal, and every
classified ordinal. Only one packet may await import at a time; partially classified revisions
take priority over new sources; a revision is “classified” only after all expected segments are
imported. Stale provider revisions remain stale and are not silently resurrected. Import is strict,
source-locator-bound, target-allowlisted, and idempotent.

The private workspace may preserve rich authored-unit candidates, concise atomic
Developer-opinion candidates, unverified bibliographic candidates, currentness, target mapping,
model/prompt provenance, and later human adjudication. All remain medically unreviewed and
non-executable. They cannot carry point magnitudes, executable predicates, clinical approval, or
inferred formal authority. A minimized workbench projection is read-only and available only from
the local Vite Developer server over loopback; ordinary Player and portable Reviewer bundles
exclude it. Runtime content changes only through the existing separate evidence, contribution,
rule-review, balance, versioning, validation, and release gates. This is a pilot, not a claim that
all personal notes have been processed.

## D-135 — Cross-device database browsing uses a minimized public projection

Status: accepted and implemented. Desktop Player, local Developer, and portable phone/desktop
Reviewer hubs expose one shared read-only Database screen. Browser sandboxing and the static Pages
architecture make literal Mac/phone filesystem exposure both unavailable and undesirable.
Instead, the ordinary runtime entry builds a strict, schema-parsed projection from fixed public
catalog categories. It exposes neutral identity and catalog metadata for modeled conditions,
medications, interventions, dispositions, investigations, tests, and formal bibliography, plus
logical catalog locators that do not imply filesystem access.

The projection is a security and product boundary, not a convenience serializer. It excludes
patient/case records, answer keys, point values, predicates, medication-fit details, tickets,
source requests/chunks, private Apple Notes work, and authoring-only classification terms.
Production and portable Reviewer builds receive the same minimized view; neither may inspect the
registry, glob lifecycle directories, or call a local authoring endpoint. New visible fields or
categories require a schema allowlist and boundary tests.

The current eight condition entries mean “diagnosis families modeled for gameplay,” not “complete
diagnostic list.” The 1,112-term local ICD-10-CM authoring cache remains gitignored,
runtime-excluded, and governed by D-102/D-103. A full classification inspector must be a
separate local-Developer feature unless an explicit source-rights and distribution decision
authorizes a minimized portable index.

That separate local inspector is now implemented without widening the public projection. It is
collapsed and lazily loads the validated cache only after the developer opens it, offers bounded
search plus one complete term reader, and carries the exact local-use attribution and notices.
It cannot create a `DatabaseEntryReview`, enter an export, appear in Player/portable Reviewer
bundles, change the public catalog total, or imply that a classification term is a modeled
diagnosis, diagnostic criterion, treatment rule, point value, or medical approval.

## D-136 — Database review uses a full safe reader and immutable comment snapshots

Status: accepted and implemented. “Open database entry” now means a dedicated large reader on
desktop and a contained full-screen reader on mobile. It renders every field in the strict
`PublicClinicalCatalogEntry` union and offers the same parsed object as a formatted structured
record. “Every field” does not widen D-135: patient/case answers, point rules, predicates, private
source text, source chunks, local filesystem paths, and authoring-only indexes remain absent.

Ordinary Player remains read-only. Local Developer and portable Reviewer may save one editable
plain-language comment per entry. A `DatabaseEntryReview` preserves the exact review-safe entry
snapshot, stable entry/category identity, catalog content version, projection version, note, and
timestamps. Saving first updates assignment-scoped IndexedDB. Local Developer then mirrors the
complete bundle to the fixed gitignored Codex handoff file; portable Reviewer includes it in the
manual download. A comment never edits or approves the catalog.

The review wire format is version 7 and contains `databaseEntryReviews` alongside completed
attempts, attempt reviews, flags, and tickets. This additive browser-save field remains under
`saveDataVersion: 5`; older v5 saves receive an empty collection without losing prior data.
Reviewer assignment `2026-07f` remains valid because no patient, policy, or intended case cohort
changed.

## D-137 — Medication identity coverage is broader than gameplay compatibility

Status: accepted and implemented as a source-cleared identity slice. Each medication identity has
one file, stable PsychSim ID, normalized ingredient name, explicit aliases, RxCUI, pinned RxNorm
release, source/use-decision IDs, and unreviewed status. The psychiatry-first allowlist currently has
53 ingredients. Thirteen link same-ID runtime compatibility definitions; 40 are
`identity_only`. Validators require exact static-import/disk/registry parity, unique IDs, RxCUIs
and normalized terms, complete 13-to-13 compatibility parity, source/release/use permission, and
absence of identity-only IDs from runtime medications and formularies.

Identity-only means browseable and available for future authoring normalization, not selectable
in a case. It supplies no class, indication, fit, interaction, contraindication, monitoring,
formulary, pathway, or point rule. Adding or commenting on an identity cannot expand gameplay.
The public reader includes the July 6, 2026 dated-snapshot/currentness warning and NLM's requested
attribution/non-endorsement statement. RxNorm is identity provenance, never treatment authority.

The registry currently maps the validated identity collection and its complete member-ID list;
standard filenames make each ID-to-file relation deterministic. Individual impact-graph nodes
remain a scalability follow-up before large automated catalog expansion.

## D-138 — Whole-corpus Notes inventory is lexical triage, not semantic ingestion

Status: accepted and implemented for the already authorized Apple Notes title/plaintext boundary.
`content:knowledge:inventory` verifies every eligible source revision against the private manifest,
then performs deterministic NFKC-normalized, Unicode-boundary-aware literal matching against the
current safe medication, diagnosis, intervention, and test identity dictionary. The first run
covered all 204 eligible revisions: 72 had at least one known-target match and 132 did not; 29 of
68 current target identities were mentioned in 248 literal matches.

Detailed output is mode-`0600`, gitignored, hash/fingerprint based, and contains source identities,
target identities, and counts—but no title, plaintext, excerpt, HTML, attachment, OCR, composite,
or extracted-chunk prose. The command prints aggregates only. It explicitly inspects zero remote
Drive sources and excludes all 124 attachment records and 116 OCR outputs.

This inventory proves physical coverage and creates a resumable prioritization map; it does not
interpret all notes, discover unknown entities, create a bibliography, establish a clinical
claim, attach evidence, approve content, or alter gameplay. Semantic review still proceeds through
bounded source packets and medically unreviewed candidates. At that checkpoint the remote
SharePoint aggregate had not reached the authorized download stage; D-139 through D-141 record its
later exact-byte intake and structure-aware extraction without semantic or runtime incorporation.

## D-139 — Source access and incorporation states must never be conflated

**Decision:** Every private or external source is reported through six explicit stages:
`discovered`, `downloaded and SHA-256 verified`, `extracted`, `semantically reviewed`,
`candidates created`, and `incorporated`. “Processed,” “ingested,” and “incorporated” are not
acceptable shorthand unless the exact completed stage is also named.

Connector, authorization, export, parser, OCR, truncation, segmentation, and coverage failures are
reported as soon as known, preserved in the applicable private manifest or `PROJECT_STATE.md`, and
repeated in the final handoff while unresolved. Partial access never becomes silent success.

An incorporated-source claim must name the resulting versioned catalog, rule, patient, or other
content IDs. Discovery, byte preservation, extraction, or candidate generation does not change
runtime content, and reports must say so explicitly when no content IDs changed.

## D-140 — Personal-source authoring closes through phone review and patient audit

**Decision:** Personal notes and authored archives produce concise, atomic, phone-readable review
packets rather than direct database mutations. Each packet retains a typed, immutable
source-unit/chunk snapshot, original derived summary, proposed targets, provenance, uncertainty,
conflicts, and affected IDs. The reviewer responds in plain language on mobile or desktop.

Saving reviewer guidance does not apply a rule. Canonical Codex work interprets the response and
creates the smallest versioned identity, provenance, opinion, clinical-rule, balance, or no-change
proposal. Any accepted database/rule edit remains a separate, explicit implementation step. The
resulting Database entry and affected patient/reference runs then become the reviewer’s audit
surface. Source statements, Developer opinion, reviewer instructions, implemented clinical rules,
and point balance remain independently traceable so the explanatory system can disentangle them.
The durable sequence is: phone-friendly concise packet → plain-language reviewer judgment →
canonical Codex versioned proposal → explicit database/rule edit → Database plus affected
patient/reference-run audit.

## D-141 — DOCX structure is preserved without silently retargeting source chunks

**Decision:** New DOCX extraction uses Mammoth's default heading mappings with embedded document
style maps disabled and an image converter that does not read image bytes. parse5 treats the
generated fragment as inert data and retains visible block text plus H1–H6 heading paths. Scripts,
styles, image data, link targets, and HTML attributes are not retained. `SourceChunk.section`
remains the compatible leaf label; optional `sectionPath` preserves the complete hierarchy.

The parser version is `psychsim-source-parser-5`. Each section boundary has a deterministic
`sectionInstance`, so repeated identical headings remain distinguishable. Every chunk has a
`provenanceHash` over its stable locator metadata and exact body hash, making section/ordinal
retargeting detectable independently of the combined document-text hash. Parser warnings and their
total count are retained rather than silently discarded. A version bump never automatically re-extracts older
sources because stable chunk IDs currently depend on source hash and ordinal, and changed
boundaries could silently retarget an existing provenance reference. The CLI may refresh only
explicitly named, previously extracted, older-parser manifest entries. It preserves the old
artifact under the private extraction-history directory, validates every integrity field
available for that parser version, requires an existing same-named history revision to be
equivalent, serializes source operations behind a private lock with one fixed atomic
stale-recovery claim, fails closed on an ambiguous prior claim, refuses to overwrite a changed
manifest, and uses a durable marker to recover an interrupted refresh. Parser-v1/v2 locator
metadata predates provenance hashes and therefore cannot be retrospectively authenticated.

The private residency-article aggregate was explicitly refreshed because no tracked content or
semantic candidate referenced its older-parser chunks. Its exact source bytes remained unchanged;
its parser-v1 through parser-v4 artifacts remain as four private history revisions. Parser v5
produced 39 chunks: 38 sectioned chunks with `sectionInstance`, all 39 with `provenanceHash`, 24
top-level heading instances, three nested heading instances, and one unsectioned preamble. It also
retains exactly one warning for an unrecognized Word `Title` style; semantic review must decide whether
that paragraph is front matter or a logical boundary. Heading paths establish deterministic
candidate boundaries; they do not by themselves create authored units, evidence, Developer
opinions, clinical rules, points, approval, or runtime content.

## D-142 — Private source review uses an immutable safe packet and separate locator

**Decision:** One local private-source review decision is represented as a
`SourceReviewSnapshot` embedded in the existing proposed `ClinicalReviewTicket`, not as a parallel
queue or clinical engine. One preparation selects exactly one review unit: either one complete
parser-v5 `sectionInstance` or one fully classified personal-knowledge source revision. A
browser-safe packet stores only a concise original paraphrase, up to eight atomic proposals,
public target IDs or explicit unresolved labels, uncertainty, conflicts, currentness,
rights/boundary state, and the exact displayed ticket-routing context. A classified revision must
project every opinion candidate one-to-one rather than merging, omitting, or reclassifying it. The
packet never stores raw source text, source headings, filenames, private provider IDs,
document/chunk/candidate IDs, private hashes, or filesystem paths.

A separate mode-`0600`, gitignored discriminated locator stores either the exact private
document/chunk identities, hashes, and parser warnings or the exact queue revision, semantic run,
classification audit entry, source-unit/opinion/bibliography candidate fingerprints, and
source-unit fingerprint. The safe packet hash covers every displayed and routing field.
Validation re-reads the protected source state and fails closed on drift, invalid permissions,
path escape, warning mismatch, incomplete/noncontiguous units, changed queue/audit/run/candidate
records, edited safe proposals, unknown public targets, or a missing one-to-one packet/locator
pair. Re-running an identical packet is idempotent. A different packet for the same source-unit
fingerprint is rejected until an explicit supersession workflow is designed.

The safe feed is seed-only. Reviewer prose and resolution remain browser-owned save data, and
saving them cannot mutate source, evidence, opinion, clinical, balance, or runtime content.
Developer mode exposes the safe feed only through a loopback read-only bridge and a lazy
development-only renderer. Invalid private state surfaces as quarantine rather than an empty
queue. A cached browser snapshot becomes read-only and is omitted from new handoff/export bundles
while its private locator is invalid; unrelated saved profile/review state remains intact. Player
and portable Reviewer bundles, portable exports, and source-document production paths reject this
feature.

Local preservation or extraction permission does not imply permission to transmit source text for
semantic processing. When the exact source lacks the required source-specific external-processing
acknowledgment, Codex may prepare only a metadata boundary packet. The first aggregate packet
therefore records its unresolved heading warning and no-change quarantine question; it does not
atomize clinical content or provide enough context to resolve the boundary. The next semantic step
requires a source-specific acknowledged one-unit review or a separately designed local-only
boundary inspector.

Bounded authorization to process the user's private personal knowledge locally likewise does not
create a formal `SourceUseDecision`. A `private_processing_only` classified revision may project
only local `developer_opinion` or `no_change` proposals. It remains medically unreviewed,
nonportable, and nonruntime; nearby bibliography stays an unverified private lead until separately
verified and admitted through the formal evidence workflow.

## D-143 — Information is a real cost; fit follows complete resolved patient state

**Decision:** Purchasing history, examination, laboratory, or imaging information always spends
the displayed points. An unrevealing result is not refunded and does not receive points merely
because it was purchased. Independently essential, high-yield, or treatment-required workup can
still earn its separately authored workup reward, including when the result is negative.

Every modeled gameplay-relevant patient stat is resolved deterministically when the patient is
generated and saved with the patient instance. Reusable treatment-fit rules consume that complete
resolved state through derived clinical tags or other explicit predicates. Every objectively
applicable positive bonus, negative fit decrement, contraindication, interaction, and immediate
downstream effect therefore applies whether or not the player bought the information that would
have revealed its supporting feature. A lucky blind choice can receive its actual fit benefit, and
an uninformed poor choice still receives its actual downside.

Information creates value by improving the player's chance of choosing well; it does not unlock
the patient's underlying outcomes. Workup rewards and omissions remain separately authored, so
the receipt can distinguish the cost and quality of information gathering from the downstream fit
of the submitted plan. All matching fit modifiers may contribute within D-083's bounded fit
budget, but critical-error caps and contraindication precedence prevent a pile of small bonuses
from rescuing unsafe care. Every applied modifier remains a separate post-submit trace row with
its signed points, reason, review state, related treatment, and exact formal-source or
Developer/Expert-opinion provenance.

This reaffirms D-072 and resolves the prior proposed knowledge-gating branch. The existing
medication-fit engine already evaluates resolved clinical tags independently of `knownFactIds`;
no patient-tag knowledge-binding subsystem should be added.

The Bostwick 2010 Mayo Clinic Proceedings review is cataloged as a medically unreviewed historical
authoring seed for this fit-first concept. Its verified abstract nominates sleep, sexual function,
weight, and adherence/tolerability as candidate review dimensions. Its full text is free to read
through PMC but is not in the PMC Open Access subset, so the current source-use decision is
metadata-only and no full-text extraction, AI processing, medication-specific rule, or point value
was created.

## D-144 — Reviewer work is one focused decision at a time

**Decision:** Developer and portable Reviewer interfaces prioritize one actionable decision and
one response field at a time. Their patient queue and clinical-ticket workbench begin collapsed.
Opening the ticket workbench mounts only the next unanswered `ClinicalReviewTicket`: its
plain-language question, proposed direction, concise source/evidence summary where available, and
feedback field. References, exact rule values, source packets, routing metadata, and other audit
detail remain available under a collapsed disclosure. Saving and advancing must complete browser
persistence before replacing the current decision, then focus the next decision heading. Reviewed
tickets remain separately reopenable. The visible ordinal stays anchored to the complete ordered
queue, so completing the first of ten advances to “Decision 2 of 10” rather than restarting the
remaining queue at “Decision 1 of 9.”

A completed Developer/Reviewer patient receipt puts the whole-case feedback field before the long
audit and offers a combined save-and-next action. It saves the immutable
`DeveloperAttemptReview`, then opens the first remaining already-persisted patient slot without
rerolling or regenerating it. The final patient returns to the collapsed queue. Normal and Endgame
gameplay do not gain this review-only navigation. Patient-linked ticket questions on a receipt also
render one at a time with their own save-and-next control; their ticket responses remain separate
from the whole-case attempt note.

The Database reader follows the same pattern within the current filtered result order: one complete
entry, one comment field, and previous/next controls that save changed prose before navigation.
Read-only opinion, source-gap, and private-knowledge inventories remain collapsed audit indexes;
they do not gain parallel feedback models. Items that require a decision continue to enter the
existing ticket system.

Review prose and textareas use a readable sans-serif face at approximately 16 px with increased
line height and contrast; console typography remains for labels, headings, IDs, and game chrome.
Secondary review metadata does not fall below approximately 13 px. This decision supersedes only
the prior desktop-inline/mobile-dialog presentation described in D-123 and D-128. It changes no
schema, patient content, clinical rule, point calculation, provenance, or approval state.

## D-145 — Whole-corpus cross-reference is a local lexical audit; authority lanes stay separate

**Decision:** The local Developer Database may compile one deterministic cross-reference across
the entire explicitly enrolled personal corpus: Apple Notes title/plaintext composites, locally
available attachment OCR, the user-authored SharePoint/residency archive, and other private Drive
documents named in the tracked private-source catalog. “Full corpus” means this enumerated,
hash-verified snapshot only. Every run reports complete, partial, quarantined, matched, and
unmatched unit counts. It never hides unavailable attachment content or a missing enrolled source.

The cross-reference maps exact normalized catalog names and reviewed authoring aliases to opaque
source units. A lexical match is a retrieval signal only—not a clinical claim, diagnosis,
recommendation, evidence relationship, Developer opinion, semantic review, incorporation, or
approval. The database reader must show personal-source signals, semantically atomized candidate
summaries, verified formal-source contributions, executable/proposed rules, and point magnitudes
as distinct lanes. A source can advance through those lanes only through the existing bounded
review and versioned-change workflow; file order and match frequency never choose a clinical
winner.

The ignored projection is mode `0600`, deterministic, fingerprinted over its exact private input
surfaces and tracked catalogs, and served only by the local Vite development server over
loopback. A missing projection is “not compiled”; an invalid, stale, permissively readable, or
schema-invalid projection is quarantined and surfaced as an error. Player and portable Reviewer
bundles, exports, and ordinary `DatabaseEntryReview` snapshots exclude the projection, its private
unit IDs, and its Developer-only rendering code. The complete structured record in the shared
Database reader remains the strict public projection.

Personal material remains `private_processing_only` and acquires no formal-source authority.
Public adjuncts require their own `EvidenceSourceDefinition`, item-level `SourceUseDecision`,
required attribution/notices, and an explicit contribution before they can appear as support for a
target. MeSH, LactMed, LiverTox, and the FDA CYP/transporter examples table enter initially as
authoring-only source records with no automatic assertion, medication fact, interaction,
contraindication, recommendation, rule, point, or medical approval. This decision expands D-138's
narrow title/plaintext inventory into a broader audit; it does not change D-139 through D-142's
stage, privacy, or review boundaries.

## D-146 — “My notes” means the complete enrolled authored corpus

**Decision:** When the developer asks to process or cross-reference “my notes,” scope includes
every explicitly enrolled, authorized private authored source available to the project: Apple
Notes title/plaintext composites and locally OCRed attachments, the SharePoint/residency article
archive, and other private writing recorded in the private-source catalog. A topic pilot may
prioritize that corpus, but it may never be reported as the corpus boundary.

Coverage is reported independently for physical capture, deterministic unit indexing, lexical
cross-reference, semantic classification, candidate creation, human acceptance, formal-evidence
attachment, and executable incorporation. The Database may expose all safe local cross-reference
lanes in Developer mode, but private prose and source paths remain outside the browser projection.
Material the developer wrote becomes proposed `Developer opinion`; a nearby paper is a separate
bibliographic lead until verified and linked. Neither authorship nor capture is clinical approval.

“Maximum allowable public information” means the largest source-specific, provenance-preserving
subset that the applicable source terms actually allow—not the largest technically downloadable
subset. Every public adjunct enters the formal source registry even when its current decision is
metadata-only. The registry and each Database entry distinguish catalog presence, processing
permission, attached contribution, rule review, and runtime redistribution. Catalog presence
never fills a medication field, diagnosis definition, treatment recommendation, rule, or point
value by itself.

The initial extension admits openFDA Structured Product Labeling as an authoring-only source under
its Public Domain/CC0 dataset statement with item-level third-party safeguards. RxClass and
DailyMed remain metadata-only until relation-source and submitted-label rights are narrowed
respectively. Nineteen additional RxNorm-verified ingredient identities discovered while
cross-referencing the private corpus expand the browseable medication identity catalog from 33 to
52; all nineteen are identity-only and add no formulary, treatment, scoring, or gameplay behavior.

Every source decision that permits derived clinical content now enumerates its allowed formal
contribution types, and validation rejects a contribution outside that source-specific allowlist.
Terminology-only MeSH cannot become treatment or scoring authority; the FDA CYP examples remain
classification/teaching context rather than a pairwise interaction or point source; and openFDA
remains teaching/context-only until a narrower assertion model exists. A technical ticket owns the
remaining need for machine-readable assertion kinds and item-level third-party-material clearance.
The local private-projection writer also canonicalizes its protected root before mutation, rejects
root/directory/output symlinks, and uses an exclusive mode-`0600` unique temporary file before an
atomic rename.

## D-147 — Database dossiers produce fingerprint-bound review tickets, never direct rules

**Decision:** A local Developer Database entry may present one deterministic decision brief above
its detailed authority lanes. The brief summarizes corpus coverage, directly mapped semantic
candidates, unresolved cross-target mentions, bibliography leads, formal contributions, current
rules/points, related entries, and known gaps. It preserves candidate contribution types and safe
resolved target roles so a reviewer can distinguish patient-fact material from medication-fit,
safety, treatment, workup, and other authoring implications. An unresolved target mention is
retrieval for adjudication; it does not silently resolve or promote the candidate.

Saving the psychiatrist's prose creates or updates one ordinary local
`ClinicalReviewTicket` identified by the database entry and a deterministic fingerprint of that
entry's exact concise brief. The brief is stored in ticket guidance; the resurfacing trigger stores
both the entry-brief fingerprint and the complete source-projection fingerprint that produced it;
and reviewer prose remains `reviewerNotes`. An unrelated corpus change or generation timestamp
does not hide a still-current entry review. A material change to the displayed entry brief creates
a new historical ticket. Ordinary `DatabaseEntryReview`, Player data, and portable Reviewer exports
remain public-only and reject these dossier tickets.

The saved review may later be atomized into separate evidence/Developer-opinion, typed patient
fact, clinical-context generation, diagnosis-compatibility, treatment-fit, safety/interaction, or
balance proposals. Saving performs none of those transformations and cannot assign a generation
weight, create a tag, activate a rule, change a point value, make an identity selectable, or grant
medical approval. A potential randomization lane may show only semantically classified
`patient_fact` candidates; lexical matches never enter it.

Browser persistence is authoritative for save-and-next. Failure to mirror an already-persisted
review into the workspace handoff is visible and retryable but does not report that the browser
save failed or trap the reviewer on the current entry. Because local dossier tickets can contain
concise private-corpus-derived summaries, the handoff writer accepts only fully schema-validated
`local_developer` bundles over loopback, rejects symlink/path escape, and writes through an
exclusive mode-`0600` temporary file and atomic rename. Manual Developer exports carry an explicit
privacy warning.

## D-148 — Objective exposure, background substances, and compact applied feedback

**Decision:** A purchased investigation remains one immutable purchase. Selecting it again may
reopen its already-resolved result, but may not spend points, reveal a new value, or append an
event. On phone layouts the primary result-dialog action closes the dialog; the smaller secondary
action moves to the persistent Revealed-information pane. Measured values such as weight may render
without a present/absent chip when the status itself conveys no useful interpretation. This is a
presentation choice only: the structured outcome remains saved and auditable. Numeric laboratory
results continue to show value, unit, reference interval, and `N`/`H`/`L`.

Player-facing prior medication history shows objective exposure—duration and highest reported
dose—alongside adherence, response, and tolerability. It does not announce that a trial was
“adequate.” Legacy categorical adequacy remains an internal compatibility field until historical
saves migrate; future records keep any reviewed adequacy inference separate from the observations
that support it.

Background nonpsychiatric medications and supplement use are resolved patient state, not cosmetic
prose or free tags. Age-dependent generation requires a separately reviewed and saved demographic
profile; it may not consume the current noncritical display-age variant. Each exposure is an
independently addressable regimen or supplement entry with an identity reference, status, source,
and impact class. A “supplement enthusiast” pattern is derived from multiple resolved supplement
entries and never inserted as an ungrounded clinical tag. Counts, age-band distributions,
allowlists, interactions, and clinical effects remain disabled until their source and generation
mapping are reviewed. Supplement identity records may enter the Database without becoming
selectable treatments or making efficacy claims; a missing RxNorm concept is never fabricated.

Medication-associated sexual effects belong to structured medication tolerability and point to the
specific current-regimen entry or prior trial. `unknown`, `absent`, and `present` stay distinct.
Medication-specific incidence data must preserve population, outcome definition, time horizon,
uncertainty, and the separately reviewed mapping from a published estimate to a game-generation
probability. Sexual effects are not allergies.

Current-medication recommendations will target regimen-entry IDs and support the categorical
snapshot operations `continue`, `increase`, `reduce or limit`, `taper`, and `stop`. These are
best-next-step recommendations, not virtual taper schedules. Duplicate prescriptions therefore
remain independently addressable. Polypharmacy-cleanup and delirium-with-polypharmacy patient
families remain review proposals until the regimen-operation model, withdrawal/interaction safety
rules, and safe focused pathways are source-reviewed.

One broad authored case pathway continues to own most points—for example, select one reasonable
first-line treatment—while independently traceable medication, symptom, comorbidity, prior-trial,
substance-use, and regimen-fit effects enrich the result. Activation waits for D-083 enforcement:
a dedicated bounded fit budget, stable issue deduplication, and suppression of positive fit bonuses
for contraindicated interventions. The mobile receipt prioritizes one vertical list of effects
actually applied to the submitted playthrough, with signed care points, operating cost, and links
to related rule traces. General rules that did not fire remain separately labeled audit material
and must not be blended into that applied list.

## D-149 — In-encounter review notes are private scratchpads, not gameplay

**Decision:** Local Developer mode and the portable Reviewer build expose an optional note
scratchpad while a patient encounter is in progress. It is a review aid only. The note is never an
encounter command, clinical fact, purchased result, treatment selection, score input, or part of
deterministic replay. Standard and Endgame play do not render the surface.

The draft is stored in a dedicated IndexedDB object store keyed by the exact resolved
`CaseInstance.id`. It autosaves after a short debounce and flushes on blur, backgrounding, leaving
the encounter, and submission. Returning to the same persisted patient restores that draft. On
submission, a nonblank draft becomes the editable `DeveloperAttemptReview.reviewerNote` attached
to the immutable completed-attempt and offered-options snapshots. The primary save and draft
deletion occur in one IndexedDB transaction so a completed draft cannot be lost or resurrected.
Local Developer mode then mirrors the ordinary fixed Codex handoff bundle; the portable Reviewer
includes the review in its ordinary JSON export. A draft that has not reached submission is local
to that browser and is not independently exported.

On narrow screens the scratchpad is a fixed 56-pixel bottom bar that opens into a readable drawer,
following the useful interaction pattern in the Fractured Fate writing workbench. Desktop uses a
compact fixed review panel. The control has a semantic toggle, visible label, save-status
announcement, Escape-to-close behavior, focus restoration, safe-area handling, and
`VisualViewport` adjustment for the software keyboard. Reviewers must not enter real patient
information or other identifiable material.

## D-150 — Review packets fan out knowledge and prioritize foundational decisions

**Decision:** A completed review packet is atomized by authority and target rather than copied
wholesale into one medication or diagnosis file. Formal findings remain
`EvidenceContribution` records, accepted psychiatrist interpretations remain separate
`DeveloperOpinion` records, and exact point values remain a later balance decision. The local
Database projection resolves each formal contribution and opinion onto every explicitly named
target entry, regardless of which tracked definition physically owns the contribution. This lets a
clozapine-augmentation review also enrich aripiprazole, memantine, mirtazapine, and schizophrenia
dossiers without duplicating claims or making identity-only medications playable.

Exact doses, exposure ranges, or formulation details found during review may be retained in a
source-scoped authoring note when relevant to future dose-change mechanics. Retention does not add
milligram-entry gameplay, a dose rule, or permission to generalize an oral result to a long-acting
formulation. Long-acting aripiprazole availability can inform a separately labeled Developer
opinion about routine adherence practicality; it does not establish that the long-acting
formulation has been studied as clozapine augmentation. Repeated or maintenance ECT practicality
and involuntary/court-ordered availability remain separate considerations. No case may assume
involuntary ECT is available or lawful without jurisdiction-specific legal or policy review.

The one-packet-at-a-time queue normally proceeds from the highest-reuse, highest-foundational
questions to narrower edge cases: shared encounter decisions and safety prerequisites first,
common diagnosis pathways next, common medication/class fit and interactions after that, and rare
augmentation scenarios later. A narrower packet may move earlier when it is already blocking a
specific patient or tests a needed authoring mechanism, but its completion does not displace the
foundational queue. Every packet states whether it changed only bibliography, formal
contributions, Developer opinions, generation proposals, executable rules, or point balance.

## D-151 — Initial MDD medication scoring uses one broad route plus separate fit

**Decision:** For a focused, uncomplicated adult MDD snapshot that has already reached the
initial-medication decision, starting exactly one currently reviewed first-line antidepressant is
one dominant primary route. The current runtime set is sertraline, escitalopram, fluoxetine,
bupropion, and mirtazapine. These five receive the same primary-route value; this does not rank
them universally, make them available in every formulary, or erase patient-specific safety,
interaction, prior-response, preference, feasibility, or fit differences.

CANMAT support and the psychiatrist's accepted interpretation remain separately attributable.
The qualitative diagnosis-owned rule is approved by Dustin Rowland. The prototype maps it to a
provisional +200 care-point grade and allows separately itemized smaller medication-fit effects
inside the existing medication-selection budget. Those exact magnitudes remain medically
unreviewed game balance and may be retuned from patient review. Multiple simultaneous
antidepressant starts remain governed by the separate nonparsimonious/harmful rule and safety cap.
The focused decision tag prevents this initial-treatment rule from leaking into nonresponse,
intolerance, bipolar, maintenance, or other MDD states.

## D-152 — Every discovered source and semantic target gets an explicit landing state

**Decision:** A newly referenced formal resource first receives one stable evidence-source record,
which makes it a separately readable Database reference entry. Registration does not integrate
the source into every medication or condition. A source-review ticket or source request then owns
the later claim extraction, target selection, conflict review, and attachment work. A source may
remain registered but unattached indefinitely; the Database must label that state rather than
imply incorporation.

Every atomized unresolved semantic target is retained in the local catalog-identity audit. The
cross-reference compiler classifies it as one likely existing entry, multiple ambiguous existing
entries, a proposed new medication/condition/intervention/test entry, a non-catalog rule/tag/
template target, or a target whose kind still needs review. It also recomputes normalized terms
owned by multiple catalog entries on every run. Neither likely matches nor overlaps are merged
automatically. Unclear identity, synonym, parent/child, formulation, or diagnosis-boundary choices
require Developer approval. Schema parity rejects a projection that drops an unresolved target,
and the local Developer Database exposes both the landing audit and overlap inventory.

This is the comprehensive-capture guarantee: raw source units remain preserved before semantic
review; atomized facts cannot disappear for lack of an existing bin; and executable content still
requires its ordinary provenance, clinical review, validation, and versioning gates.

## D-153 — Diagnosis answers may be blank, broad, unspecified, or specific

**Decision:** A player is never forced to submit a diagnosis. Blank is a valid structured answer
state, although a case may assign a transparent omission consequence. Diagnosis selection remains
separate from internal patient truth and cannot change treatment-fit, workup, safety, or
disposition facts.

The diagnosis catalog will explicitly model reviewed parent/child relationships among broad
categories, unspecified clinical labels, diagnosis families, and supported specific diagnoses;
the engine must not infer hierarchy from names or code prefixes. A case rubric can then give a
correct broad or unspecified family meaningful partial credit, a correctly supported specific
answer more credit, and an unrelated family zero credit or a case-specific negative/safety
consequence when the misclassification would materially redirect care. “Unspecified depression”
and “unspecified psychosis” are legitimate future selectable entries, not UI aliases for MDD or
schizophrenia.

The current diagnosis-answer engine already preserves a blank selection and supports explicit
canonical, reasonable-alternative, partial, omission, and misclassification rows. Catalog
hierarchy and reusable descendant matching remain a bounded follow-up; until then, partial-family
credit must be authored explicitly in each case rubric rather than guessed.

## D-154 — Initial-MDD emergency escalation retains a dominant consequence after rebalance

**Decision:** Raising the broad initial-MDD medication route from +100 to +200 must not make an
unnecessary emergency transfer materially less consequential. Its provisional disposition row
changes from −450 to −500. D-155's treatment-triggered workup rewards later raised the escalated
run above half the efficient database-plan payout, so its provisional care-point cap changes from
200 to 75 to preserve the intended ordering with a small balance margin.

These are game-balance preservation steps, not medical approval of the exact −500 value or cap.
`ticket.source.canmat-mdd.disposition-severity` remains unresolved and still owns clinical review
of the structured facts, disposition direction, and eventual magnitude. The adjustment applies
only to the authored prototype snapshot and does not create a reusable emergency-disposition rule.

## D-155 — Focused assessment rules retain treatment triggers, concern, and certainty

**Decision:** The assessment rubric follows the focused snapshot and the submitted intervention;
it is not one universal psychiatric checklist. The approved initial-MDD policy is:

- **P1:** Depressive-symptom assessment is central to this initial-MDD decision but is not required
  in every psychiatric encounter.
- **P2:** Episode course, current depressive symptoms, functional effect, and this patient's
  safety-relevant presentation form the core workup before treatment selection.
- **P3:** Starting an antidepressant activates prior-mania/hypomania history. Starting no
  antidepressant does not. Later reviewed medication- or class-specific rules may change the
  magnitude without changing that trigger architecture.
- **P4:** Starting any medication activates medication reconciliation. A future staff automation
  can fulfill the same investigation at a lower operating cost; it cannot waive it.
- **P5:** Starting any medication activates allergy and adverse-reaction history.
- **P6:** A resolved prior reaction to the selected medication affects the treatment consequence
  whether or not the player purchased the history. Purchasing information reveals patient state;
  it never creates that state.
- **P7:** Substance-use history is broadly rewarded for MDD, anxiety, and other presentations
  commonly caused or worsened by substances. The omission consequence remains contextual rather
  than automatically safety-critical.

Reusable qualitative rules store trigger, patient scope, target, concern, certainty, rationale,
provenance, and review independently from executable game balance. The current initial-MDD
mapping uses strong certainty with moderate-to-critical concern labels and provisional workup
values. Missing an activated necessary item renders as a red `critical_omission`; only a separately
declared `safetyCritical` omission enters the safety-error list.

The shared exact-same-medication reaction layer evaluates the pre-resolved patient record, chooses
only the worst matching reaction policy per selected medication, and cannot be neutralized by
failing to reveal the history. Its current severity-to-point mapping is medically unreviewed
provisional balance. It must yield to a future more-specific reviewed medication/reaction rule and
must not be mistaken for a general determination that every charted “allergy” is immune-mediated
or absolutely contraindicating.

## D-156 — Provisional balance starts from impact bands while certainty remains separate

**Decision:** Use consistent default bands when an approved qualitative direction needs an initial
game-balance estimate:

- a dominant primary route starts near +200;
- minor effects start near ±5–10;
- moderate effects start near ±15–30;
- major effects start near ±35–100; and
- critical safety effects start near −150 to −500 and may impose a care-point cap.

These values are authoring defaults, not an automatic clinical calculator or final balance. The
executable rule stores its exact value, and a more-specific medication, diagnosis, interaction, or
patient rule may override the starting estimate. Necessary investigation reward must still exceed
its accessible cost. Critical contraindications receive no positive goodness-of-fit bonuses, and
score caps preserve the rule that accumulated small bonuses cannot rescue a critical error.

Clinical concern and evidence certainty remain independent. Certainty does not automatically scale
points up or down: a serious but uncertain hazard should not become low-impact merely because the
evidence is limited. Certainty instead remains visible in provenance, review requirements, and
reuse eligibility.

## D-157 — The personal knowledge database is a first-class learning product

**Decision:** PsychSim has two compatible outputs from one coherent knowledge architecture:

1. a comprehensive private authoring database representing the developer's accumulated notes,
   authored teaching material, formal sources, interpretations, disagreements, and gaps; and
2. a deliberately narrow, legible game compiled from reviewed decision-relevant portions of that
   database.

The database should help the developer audit why they believe something, distinguish personal
judgment from source claims, identify weak, stale, missing, or conflicting coverage, receive
bounded suggestions for recent reading, and improve retention through repeated dossier review and
patient play. This learning loop resembles preparing to teach a class. Captured knowledge does not
need an immediate gameplay use to be worth preserving.

Database completeness and gameplay readiness are separate. A comprehensive dossier does not make
its claims executable, and a focused reviewed game rule does not imply that the surrounding
database entry is comprehensive. Reading suggestions remain proposals until reviewed; personal
notes remain Developer opinion unless independently supported; and only reviewed, focused rules
plus applicable safety constraints compile into an encounter.

## D-158 — Knowledge coverage is a sparse derived audit, never a second database

**Decision:** Use a multidimensional dossier coverage map only under the following constraints:

- it is derived from canonical source units, evidence relationships, Developer opinions, review
  records, rules, and gameplay mappings;
- it stores or displays the exact supporting IDs rather than copying clinical claims;
- it distinguishes unknown or unfinished review from demonstrated absence;
- it never blocks entry creation, drops unmatched data, filters the source corpus, promotes a
  claim, or determines runtime inclusion;
- it has no aggregate completeness percentage;
- it remains local-Developer-only and loads lazily for one dossier at a time; and
- recent-reading suggestions remain separately reviewable search proposals.

The initial dimensions are identity/regulatory baseline, personal knowledge, formal-evidence
coverage, currentness, disagreement/uncertainty, reviewed psychiatrist interpretation, and
gameplay mapping. Dimensions are sparse: `not_applicable` and `unknown` are valid, and adding a
source must not require manually editing every related dossier. Unresolved or unrecognized
material remains visible in the existing landing/identity-gap audit, preventing a polished
coverage display from hiding useful data that has not yet been atomized.

This decision authorizes the architecture and future local projection, not an immediate large UI
or schema migration. Begin with one entry and measure utility, rebuild cost, and omission behavior
before expanding it.

## D-159 — Rule combination is explicit, deterministic, and fully traceable

**Decision:** Reusable scoring contributors use two independent stable relationship keys:
`effectId` identifies the clinical/game effect that a more-specific rule may replace, while
`issueId` identifies one underlying mistake whose duplicate negative consequences must not stack.
Every replaceable contributor also declares an explicit nonnegative `specificityPriority`.
File/import order, source date, evidence tier, and point magnitude never silently decide which
rule is more specific.

The final trace resolver applies the approved model in deterministic stages:

1. Among contributors with the same non-null `effectId`, the highest explicit specificity wins;
   a stable rule-ID tie-break exists for deterministic recovery, while content validation rejects
   equal-priority ambiguity.
2. A true hard-contraindication rule suppresses the affected treatment's positive primary-route
   reward and positive fit modifiers. A serious but nonabsolute risk remains an ordinary large
   negative contributor, so legitimate benefits remain visible and may still stack.
3. Applied negative contributors sharing one non-null `issueId` collapse to the most negative
   consequence. Distinct effects continue to stack.

Resolution never deletes a contributor. Every row persists with `applied`, `replaced`,
`deduplicated`, or `suppressed` status; changed rows preserve their pre-resolution points,
controlling rule ID, and plain-language explanation. Receipts surface these rows with the
point-changing rules rather than hiding them among routine zero-point evaluations. This
architecture does not approve any clinical rule or alter current point magnitudes by itself.
Engine version `0.6.0` marks the new deterministic scoring behavior.

## D-160 — Diagnosis families own variants; templates select and constrain them

**Decision:** A reusable diagnosis-family record owns the base disorder plus its ordinary variants,
severity branches, and specifier relationships. Major depressive disorder therefore owns mild,
moderate, and severe MDD in one record. A patient template may request a state such as moderate MDD
and add narrow encounter-specific constraints or specifiers, but it does not copy generic
moderate-MDD criteria, treatment recommendations, or point rules.

The target pipeline is `PatientTemplate → PatientInstance → EncounterInstance + CompiledRubric`.
The compiler composes diagnosis, medication, assessment, therapy, disposition, evidence, and
decision-policy owners; validates a coherent focused question and safe route; saves every resolved
fact and contributor; then produces the immutable encounter snapshot. `CaseBlueprint` remains a
versioned historical compatibility format until that compiler is proven with one family. The
acceptance test for first-visit MDD is whether the database can generate varied, coherent patients
without case-specific clinical prose or duplicated diagnosis rules—not whether one hand-authored
case is sufficiently detailed.

This ownership decision does not select the clinical boundaries of mild, moderate, or severe MDD.
Those envelopes remain disabled behind
`ticket.source.mdd.severity-generator-policy` until their provenance and clinical content are
reviewed.

## D-161 — One resolved fact may be projected into multiple investigation views

**Decision:** A clinical fact is generated and saved once even when it is relevant to multiple
player-facing screens. For example, one resolved concentration problem may appear in both anxiety
and depressive-symptom reviews, and one resolved restless demeanor may contribute to history and
mental-status displays. The player presentation may blend these influences, but the backend and
post-submit explanation retain the fact ID, final value, every contributing owner, constraint role,
deterministic draw, conflict outcome, and projection location.

This extends D-084 and D-087; it does not create a parallel symptom store. File order never chooses
a value. Hard contradictions retry deterministically or quarantine. Subthreshold cross-diagnostic
symptoms are allowed, while complete additional syndromes still require an explicit eligible
condition module under D-089. Presentation-richness calibration remains a separate review task so
the compiler does not make every patient maximally complex or bury the question-bank decision.

## D-162 — Testing is one player-facing group, not one backend test type

**Decision:** The encounter navigation target is `History → Physical exam → Testing → Diagnosis →
Treatment`. The Testing view is one searchable player-facing group containing laboratory assays,
imaging, ECG/EEG, and named structured instruments. Backend definitions retain their distinct
study kind, generator, result schema, service/fulfillment route, point cost, provenance, and rights
boundary. This is a UI projection and does not flatten schemas or reinterpret historical action
IDs.

Searchable availability is not clinical relevance. A named instrument such as BFCRS or a future
DRS-R-98 entry may be visible globally while receiving points only when the resolved patient and
focused decision make it appropriate. Instrument identity, exact wording, score interpretation,
and reuse permission remain independently gated.

## D-163 — PsychSim is database-first; gameplay is a compiled projection

**Decision:** The private, sourced, auditable knowledge database is the architectural foundation
and a useful product in its own right. The game is a downstream compiler and stress test over
reviewed, focused portions of that database. Database structure is therefore designed to capture,
relate, scout, review, and maintain reusable psychiatry knowledge before it is optimized around one
current patient or UI.

A case or playtest may reveal a missing identity, assertion, relationship, generation tendency, or
rule, but the durable fix belongs in the narrowest reusable owner. Patient templates select and
constrain shared knowledge; they do not become the primary storage location for diagnosis,
medication, test, therapy, or evidence facts. React components never substitute for a missing
database or engine relationship. Runtime bundles still receive only the explicitly reviewed,
versioned, decision-relevant projection, so database breadth does not make an encounter exhaustive
or turn the game into a comprehensive clinical simulator.

Database-first is not raw-source-first or automation-first. A downloaded document is untrusted
input, source registration is not claim incorporation, an extracted statement is not medical
approval, and a reviewed assertion is not automatically an executable rule or point value. The
preferred work order is stable identities and knowledge atoms, source and opinion relationships,
assembled dossiers and gap audits, deterministic patient/rule compilation, and finally playable
case/UI expansion. `docs/DATABASE_FIRST_DECISION_QUEUE.md` sequences the unresolved design choices;
binding answers continue to live in this decision log.

## D-164 — Sources, topics, and rules use tiered primary ownership

**Decision:** PsychSim follows the useful Fractured Fate ownership pattern rather than creating
one physical file per proposition or a separate global “assertion database.”

Each formal article, guideline, regulatory record, or other source has one durable source file. A
large source file may contain many stable nested section, recommendation, finding, table, and
source-contribution IDs under readable headers, together with metadata, rights, version and
correction relationships, target cross-links, unresolved gaps, and typed Developer commentary.
Developer commentary may be physically co-located with the source it discusses, but it remains a
distinct provenance object and never becomes source-authored content. Source topology and concise
derived material are retained only to the degree permitted by that source's reuse decision.

Independently useful clinical topics—diagnoses, medications, formulations, symptoms/findings,
measurements, tests, therapies, dispositions, and similar concepts—have canonical topical owner
files. They assemble relevant source units and accepted Developer interpretation under useful
headers and cross-reference other owners rather than duplicating their full contents. Generated
dossier views resolve both forward and reverse links so one medication page can still display
everything currently connected to it.

A concrete clinical/game relationship has one canonical owner:

1. the most specific decision-driving topic owns it;
2. every other implicated topic receives a generated reverse link; and
3. a genuinely symmetric or multifactor relationship with no natural owner receives one dedicated
   relationship or policy file.

For example, a weight-status owner may hold a reviewed mirtazapine/high-BMI fit rule, while an
insomnia owner holds a separate mirtazapine/insomnia fit rule. The mirtazapine dossier assembles
both. A resolved patient supplies the relevant BMI and sleep facts; the focused compiler selects
the applicable rules. Each rule names its source-unit and/or Developer-opinion support, exact
scope, exceptions, review state, and separately authored point magnitude.

Do not create a new owner for every mention. Use a dedicated relationship/policy file only when
the relationship is independently reusable and lacks a natural topical owner. Existing
`EvidenceContribution` and `DeveloperOpinion` records remain compatibility structures until a
bounded migration is designed after the adjacent dossier-readiness decisions. This decision
changes architecture and terminology only; it does not bulk-reconstruct guidelines, activate a
clinical rule, or migrate source content by itself.

## D-165 — Dossier readiness is independent, derived, and deliberately compact

**Decision:** A database entry does not receive one linear “draft,” “approved,” “complete,” or
percentage-complete state. A stable identity shell is useful and browseable even when its clinical
knowledge is sparse. Identity resolution, source/currentness coverage, accepted Developer
interpretation, individual topical relationships/rules, and exact game mappings are independent
readiness areas.

The canonical records in each area retain their own typed lifecycle and review state. A local
`KnowledgeCoverageProjection` derives a sparse readiness summary using supported distinctions such
as `unknown`, `missing`, `present`, `stale`, `contested`, and `not_applicable`; it does not become a
second database or require authors to maintain a parallel status matrix. The common dossier view
contains an identity/alias header, a concise current synthesis when available, compact readiness
lanes, open gaps/conflicts, linked source units and Developer opinions, topical forward/reverse
relationships, and exact game/rule/patient mappings. Detailed provenance remains collapsed until
requested.

Gameplay never checks a whole-entry maturity badge. The compiler validates only the exact identity,
relationship, generation, clinical-review, balance, and reference-policy dependencies required by
the focused patient. One reviewed rule does not approve a monograph, while an incomplete monograph
does not block an otherwise complete and reviewed focused route.

Complexity is an explicit failure condition. Readiness must be derived from records that already
own the relevant state, computed lazily for one local dossier, and excluded from Player and
portable Reviewer bundles. Do not add a duplicate field when the answer can be derived. First
pilot one dossier; if a lane creates substantial synchronization, performance, or reviewer burden
without changing a concrete decision, combine or remove it rather than expanding the schema. This
decision authorizes that bounded pilot and future exact dependency checks, not a broad readiness
schema or content migration.

## D-166 — Catalog breadth is input-driven, wide, shallow, and conservatively resolved

**Decision:** PsychSim does not attempt to pre-enumerate all of psychiatry. Instead, semantic
processing of each admitted formal source or private authored unit creates a stable,
provenance-preserving candidate bin for every potentially relevant named concept. A large corpus is
expected to produce many bins because the domain itself is broad; avoiding silent loss is more
important than keeping the candidate count artificially small.

A candidate bin may have an uncertain category and several possible catalog matches. Review gives
it one explicit outcome: promote it to a canonical provisional identity shell, attach it as a
verified alias, merge it into an existing owner while retaining the old bin ID and provenance,
classify it as a relationship-only concept, retain it as unresolved, or mark it as a reviewed
non-entity/out-of-scope item. No outcome deletes the source relationship. Raw restricted
expressions remain inside their permitted private boundary; tracked bins retain only permitted
labels, hashes, IDs, and concise original metadata.

Canonical identities remain wide but shallow. A provisional shell contains identity, category,
aliases, provenance, and open gaps only; it creates no clinical relationship, gameplay option,
rule, point value, approval, formulary access, or patient availability. Diagnosis families own
severity variants and specifiers; medications begin at ingredient level; named therapies,
tests/scales, supplements, findings, and dispositions become identities when independently useful
for search or reuse. One-off prose and implementation tags remain nonentities.

Lexical similarity, repeated mention, or file order never aliases or merges concepts. Deterministic
overlap and unresolved-landing audits group candidates for review. Verified synonyms may become
aliases, while ambiguous overlap remains a review item. Accepted merges preserve superseded IDs or
redirects so source links and historical attempts remain reproducible. This decision authorizes
the candidate-bin architecture and later bounded pilot, not immediate bulk catalog creation or
automatic semantic promotion.

## D-167 — Source-review packets are compact, question-specific, and independently auditable

**Decision:** Each source-scouting review addresses one narrow clinical or database question. Its
primary synthesis stays near one page and shows the exact decision, affected owners and current
behavior, relevant personal knowledge already enrolled, proposed answer, supporting evidence,
opposition or important qualification, uncertainty, currentness/source-use limits, and the one
reviewer decision needed. Detailed records remain available under collapsed audit sections.

The default source-depth budget uses the smallest question-appropriate stack: current
official/regulatory material when relevant, the most current applicable guideline, one responsive
systematic review or meta-analysis from the last ten years when that design fits, and only the
additional newer, landmark, head-to-head, pragmatic, special-population, or opposing evidence
needed to answer a remaining issue. Clinical relevance is screened before citation count is used
as a tie-breaker. A rare harm, interaction, instrument, regulatory fact, or excluded-population
question uses the appropriate evidence type rather than forcing a meta-analysis.

Every selected source receives a concise original statement of what it contributes. It also
remains independently findable: show its stable evidence ID when cataloged, title, authors or
issuing organization, year, journal/publisher or source, DOI/PMID or stable URL when available,
retrieval/as-of date where relevant, access/full-text status, and the exact review limitation.
When only an abstract was lawfully reviewed, label the summary `abstract-only`. That label limits
the interpretation; it never permits omitting the reference or presenting the summary as full-text
support. The reviewer may retrieve the article and supply feedback, a correction, or a
better-accessible source.

Stop when the minimum stack answers the narrow question without material conflict. Add depth only
for high-stakes safety, unresolved disagreement, important applicability gaps, or
corrected/superseded material. Accepting a packet records reviewable source units and
interpretations only; it never creates an executable rule, chooses a point magnitude, changes
content, or grants medical approval. This decision defines the review contract but does not
authorize bulk scouting or a packet-schema migration.

## D-168 — Diagnosis dossiers are sparse, transition-capable, and may expose quarantined speculation

**Decision:** A diagnosis-family dossier is a sparse reusable owner rather than a complete
diagnostic manual or one fixed patient solution. One family owns its stable identity, aliases and
classification links; shared condition-state envelope; severity/specifier branches; presentation
tendencies and constraints; clinically useful boundaries and incompatibilities; focused
assessment/safety/setting relationships; and broad treatment routes. Shared tests, findings,
medications, therapies, dispositions, and point magnitudes retain their own owners and appear
through cross-links. `unknown`, `absent`, `subthreshold`, and `present` remain distinct. Patient
templates select and narrowly constrain family knowledge; resolved patients save exact facts.

A broad treatment route is not limited to asking whether one static medication list is
guideline-compatible. It can describe a complete best-next-step regimen transition over an already
complex patient: retain a helpful anchor, act on a poorly fitting or ineffective current regimen
entry, and add an eligible replacement or adjunct. The baseline and proposed regimens may both
satisfy the broad diagnosis route while retained response, current nonresponse, adverse effects,
prior trials, interaction safety, and goodness of fit distinguish the better next move.

The patient instance owns distinct current-regimen entries and arbitrarily many structured prior
trials. A diagnosis family or focused decision policy owns the broad strategy; medication,
finding, interaction, and other topical owners supply reusable specific effects; the balance layer
owns points. A submitted snapshot may combine entry-targeted `continue`, `increase`,
`reduce_or_limit`, `taper`, or `stop` operations with one or more starts when the reviewed route
allows them. It does not imply a dose, cross-taper schedule, virtual follow-up, or observed
longitudinal outcome. For example, an eventual bipolar case could preserve lithium's reported
benefit, stop poorly effective olanzapine with problematic metabolic fit, and add a previously
untried eligible adjunct; the architecture does not approve that clinical example or its points.

Sparse sections remain honestly unknown by default, but they may display short speculative
candidates when doing so reuses already captured work rather than manufacturing completeness.
There are two distinct candidate origins:

1. A `source_lead` records a traceable brief mention from an admitted source that warrants
   follow-up but is not yet an interpreted contribution.
2. An `authoring_inference` records a developer-side generated hypothesis with exact input IDs,
   tool/model/generator identity where applicable, assumptions, uncertainty, and a follow-up
   question.

Both render prominently as `Speculative` and remain structurally separate from source
contributions, accepted Developer opinions, clinical facts, executable rules, point values, and
medical approval. They cannot compile into gameplay. Human review may reject or defer them, route
a source lead for verification, or explicitly move an interpretation into the separate
Developer-opinion workflow. No process auto-fills every empty section. Runtime gameplay remains
deterministic and AI-free; an engine-derived result is explained by its exact rule trace rather
than being mislabeled as AI inference. This decision defines dossier behavior but does not
authorize a schema migration, diagnosis-content import, or clinical rule.

## D-169 — Intervention dossiers share a common envelope and FDA alignment may add modest points

**Decision:** Medications, psychotherapies, and other interventions use one common dossier envelope
for stable identity, aliases, classifications, source relationships, clinical roles, benefits,
fit, safety, combinations, rules, balance, and impact links. Type-specific modules preserve the
differences that matter. Medication modules own ingredient/formulation relationships, regulatory
facts, pharmacology, adverse effects, interactions, discontinuation concerns, and
snapshot-relevant prerequisites. Psychotherapy and program modules own delivery, fidelity,
practitioner, setting, capability, and program-completeness distinctions rather than pretending
they are medications.

The psychotherapy delivery/fidelity portion of this paragraph is superseded by D-189. Stable
identity, source relationships, clinical roles, combination/redundancy, capability, provenance,
rule, and balance separation remain in force.

Medication identity begins at ingredient level. A formulation or product becomes a distinct
intervention only when route/formulation materially changes availability, safety, adherence,
fulfillment, or the best-next-step decision. Regulatory records remain jurisdiction-, product-,
formulation-, version-, and population-specific. They do not automatically establish first-line
status, comparative superiority, a broad treatment route, or a point magnitude.

There is one narrow exception for educational FDA-label alignment. After the relevant generic
rule receives rule-level review, a verified current FDA approval that exactly matches the resolved
indication, population, and selected formulation may compile one separately itemized
`regulatory_alignment` modifier. Its provisional default is a minor +10 points. It is a useful
board-relevant fact, not the primary treatment award.

The modifier never stacks because several FDA records, products, or approved indications describe
the same selected treatment decision. A true contraindication suppresses it with the treatment's
other positive fit rows. Absence of an approval creates no automatic penalty: a guideline-supported
or otherwise reviewed off-label choice can still receive the complete broad-route and fit awards.
Current nonresponse, prior failure, adverse effects, interactions, poor fit, a more appropriate
treatment line, or a stronger specific rule may outweigh the small regulatory bonus. A patient
explicitly designed to test FDA-approval knowledge may instead use a larger authored
case-specific rule whose focus and points are visible in the trace.

Clinical-use relationships preserve condition, population, setting, severity/phase, treatment
line, target outcome, and role such as monotherapy, retained anchor, adjunct, replacement,
symptom-targeted option, or discontinuation candidate. Benefits, adverse effects, feasibility,
fit, safety severity, and evidence limitations remain separately traceable. Source estimates never
become unexplained patient probabilities or points.

Patient instances—not medication files—own distinct current-regimen entries and structured prior
trials. A submitted snapshot may target entries with `continue`, `increase`, `reduce_or_limit`,
`taper`, or `stop` and combine them with starts. Dossiers provide the reusable relationships
needed to evaluate retention, replacement, augmentation, retrial, simplification, and duplicate
therapy without encoding a dose schedule or longitudinal simulation. Speculative source leads and
authoring inferences follow D-168 and remain nonexecutable. This decision defines dossier behavior
and provisional balance direction; it does not activate the FDA modifier, migrate content, or
clinically approve an intervention.

## D-170 — Shared findings resolve once; tests and reveal actions remain separate owners

The surface-syndrome restriction in this decision is narrowed by D-171: overlapping findings may
resemble or superficially satisfy another disorder's symptom list without being removed, promoted
to an internal diagnosis, or treated as a generation failure.

**Decision:** Every reusable symptom, history element, exposure, examination finding,
measurement, or observation has one stable finding identity with neutral labels, search terms,
typed outcomes, and presentation templates. That identity never owns a particular patient's value
or the points for asking about it. A generated `PatientInstance` owns the complete resolved value,
source, uncertainty, and contributor trace; encounter state owns only whether the player has
revealed it. `unknown` or truly unassessed, unrevealed, known absent, subthreshold, present, normal,
high, low, positive, and negative therefore remain distinct states. Every History, Physical exam,
Testing, diagnosis, fit, and receipt projection reads the same resolved truth.

Diagnosis families, medications, age or context records, and patient templates contribute typed
constraints or generation tendencies to that shared finding rather than creating duplicate facts.
Source-supported clinical associations remain separate from game-generation weights. Explicit
specificity combines compatible contributions; a hard contradiction deterministically retries or
quarantines the candidate instead of selecting a load-order winner. Templates distinguish
case-defining requirements, expected-but-variable associations, ordinary background variation,
optional-comorbidity findings, and bounded distractors. Criteria groups use reviewed cardinality
and required-finding constraints. Under D-171, background variation may overlap enough to resemble
another syndrome; it cannot silently create internal condition truth or change the focused
question from symptom count alone.

An orderable study or named instrument has a test definition separate from its reveal action. The
test definition owns study type, components, result schema, units and reference intervals,
deterministic generation profiles, interpretation metadata, rights boundary, and display
conventions. The shared `InformationActionDefinition` owns the neutral player-facing label,
category, search aliases, service and fulfillment relationship, and repeatability. A patient may
provide a more-specific authored result override. Neither the test nor action definition decides
clinical correctness or points; post-submit rules do.

Every encounter-available result is resolved and frozen before play. Purchasing information only
records cost and reveals the already resolved result. Numeric results render value, unit,
population-appropriate reference interval, and `N`/`H`/`L`. A test-specific incidental generator
may produce at most one tightly bounded, non-case-defining abnormality per panel; it cannot alter
the rubric. Named instruments preserve their identity, validation scope, administration effort,
interpretation, and reuse permission, but protected item wording is not copied without permission.
The player may see a lawful score or structured summary while the backend retains the auditable
inputs.

Global action labels and result prose must remain answer-neutral. Patient files supply resolved
results and narrow reveal mappings, while post-submit workup, diagnosis, treatment, and fit traces
explain how each finding mattered. This decision fixes the conceptual ownership and deterministic
resolution contract only. It does not authorize a schema migration, add a clinical association,
choose a generation probability, activate a score rule, or grant medical approval.

## D-171 — Focused psychiatric snapshots may remain diagnostically muddy and highly textured

**Decision:** A focused encounter limits the decision horizon, not the patient's diagnostic or
treatment complexity. PsychSim should not normalize every patient into one certain diagnosis and
one obvious treatment. Each playable template must contain a psychiatrist-relevant decision
driver—such as diagnostic attribution, prior response or intolerance, regimen transition,
comorbidity fit, interaction or adverse-effect reasoning, safety, or disposition—even when the
setting and available tools remain “couch and clipboard.”

A template owns required internal condition states and may also own one or more bounded condition
selection groups with stable candidate IDs and explicit minimum and maximum selections, such as
“select one to three from this reviewed comorbidity pool.” Those selections are deterministic and
saved. There is no global random-diagnosis pool. Required and selected internal conditions remain
separate from chart diagnoses, historical labels, and explicit rule-out or uncertain diagnostic
records, which may be numerous, overlapping, inaccurate, or substance- and time-dependent.

Resolved findings are not cleaned merely because their visible symptom count resembles or
superficially satisfies another disorder's checklist. Such overlap is common and may be the
intended learning texture. The generator neither deletes those findings nor automatically promotes
the apparent disorder into internal condition truth. Etiology, time course, substance or
medication context, attribution, functional relationship, and “not better explained” logic remain
separate from raw symptom cardinality. Only a required or selected condition module creates an
active internal condition. Post-submit audit must distinguish required conditions, selected
comorbidities, chart labels, rule-outs, and coincidentally overlapping findings.

Diagnostic ambiguity and clinically meaningful tension are valid generated states. As narrowed by
D-172, retry or quarantine is reserved for literal structural impossibility, malformed state, or
an explicitly reviewed incompatible pair of internal states in the same scope—not for symptom
overlap, incomplete rule coverage, multiple plausible formulations, or a threshold count alone.
This supersedes D-090 and the threshold-cleanup portions of D-089 and D-170 while preserving their
prohibition on automatic diagnosis promotion.

For PsychSim's psychiatry-referral population, prolonged, severe, or otherwise specialty-level
presentations require multiple resolved prior efforts by default rather than zero or one generic
“adequate trial.” These may include medication, psychotherapy, prior clinical contact, OTC or
supplement use, self-directed coping, substance-related coping, or higher levels of care.
Decision-relevant treatment history does not consume the optional-texture budget and has no small
global maximum; it uses structured records and a compact summary with expandable detail. A
treatment-naive specialty patient is an explicit template exception with a reviewable reason. This
frequency judgment is Developer opinion until a suitable source contribution is separately
reviewed.

The compiled rubric may apply distinct reviewed fit, safety, interaction, response, and
tolerability contributors from every relevant resolved condition, finding, medication entry, and
prior trial. One broad authored next-step route still carries most care points; smaller
contributors may stack subject to the existing deduplication, cap, and hard-safety rules. Their
points are auditable game weights linked to formal sources and/or Developer opinion, not a claim
that the engine makes clinical decisions or perfectly resolves diagnostic uncertainty. This
decision changes the architecture contract only; it activates no diagnosis, generation
probability, clinical rule, or point value.

## D-172 — Patient generation is permissive; coverage gaps do not invalidate plausible patients

**Decision:** Retire “no safe route” as a patient-generation rejection concept. Generation rejects
only literal structural impossibility or malformed state: for example, one canonical fact holding
two explicitly mutually exclusive values in the same defined time/context, an impossible typed
measurement, an unknown required identity that prevents deterministic resolution, or two internal
condition states with an explicitly reviewed same-scope incompatibility. Diagnostic ambiguity,
overlapping symptoms, incomplete knowledge coverage, missing point rules, several plausible
formulations, and an unmodeled treatment option do not make the patient invalid.

A compiler may emit nonblocking `coverage_gap` diagnostics when it cannot find an applicable
reviewed treatment route, disposition, investigation relationship, or sufficient rubric coverage.
The generated patient remains available in Developer/Reviewer workflows, the diagnostic names the
exact missing owners or relationships, and an individual encounter may be flagged after play.
Coverage gaps never fabricate a penalty, silently classify an option as wrong, delete patient
facts, or trigger regeneration.

Human content review may still decline to promote a clearly broken encounter into an approved
Player bundle. That is a lifecycle/release decision about the compiled encounter, not a claim that
the underlying patient is clinically impossible. Future production eligibility can require an
explicitly reviewed playable response only through a separate release policy; the generator itself
remains permissive.

This narrows D-091, D-160, D-168, D-171, and older “safe-route” language wherever those decisions
described generation quarantine. It does not weaken schema conformance, deterministic replay,
literal fact consistency, content-version preservation, or the ability to flag and correct
individual encounters. No runtime validator or clinical rule changes in this architecture
decision.

## D-173 — Qualitative rule approval precedes separately labeled provisional point balance

**Decision:** Knowledge never executes directly. A formal source contribution, topical
relationship, Developer opinion, source lead, or authoring inference may produce a rule proposal,
but the proposal must first name one canonical owner, target IDs, focused decision scope, typed
trigger, qualitative direction, clinical concern, certainty, exceptions, concise rationale,
provenance IDs, and receipt explanation. It carries no point value and cannot enter gameplay.

Three support paths are valid and remain visibly distinct: directly applicable formal
contribution; formal contribution plus an explicitly identified Developer-opinion bridge; or
Developer opinion alone. Speculative source leads and authoring inferences cannot promote until
the reviewer deliberately converts them through the evidence or Developer-opinion workflow. A
source never inherits the broader interpretive claim of an opinion, and an opinion never inherits
the source's certainty.

The psychiatrist performs one explicit qualitative review of the atomic direction and scope:
accept, narrow, reject, or defer. Acceptance records reviewer identity, timestamp, reviewed
version/fingerprint, exceptions, and unresolved disagreement. It approves only that rule, not the
source, dossier, medication, diagnosis, neighboring rules, or any point magnitude. Corrected,
superseded, or nondominated conflicting evidence remains visible and creates impact review. No
file order, source count, publication date alone, nominal evidence tier, or point value chooses a
clinical winner. A scoped Developer opinion may govern the game transformation while preserving
the disagreement.

The narrowest reusable decision-driving topic owns the rule. Diagnosis base/severity/specifier
guidance, other active conditions, medication/formulation relationships, interactions, setting,
and patient-template overrides compose only through typed scope and explicit specificity.
Case-specific overrides are narrow versioned exceptions rather than silent edits to shared
knowledge. The encounter compiler remains permissive: it collects applicable reviewed rules within
the focused decision horizon plus global interaction/safety contributors, while missing
qualitative coverage creates a nonblocking ticket and never invents a default penalty or labels an
unmodeled option wrong.

After qualitative acceptance, the system may assign one explicit provisional point mapping from
the D-156 impact bands without requiring a second psychiatrist review before
Developer/Reviewer play. The mapping is labeled `provisional_balance` and remains separate from
clinical concern, certainty, and provenance. Reference patients and encounter feedback may retune
it without reopening the qualitative decision; a change to clinical direction, trigger, scope, or
exception does require new qualitative review.

Every executable contributor receives stable rule, effect, and issue IDs plus explicit
specificity. D-159 governs replacement, worst-only duplicate harm, stacking of distinct fit
effects, hard-contraindication suppression, and score caps. The receipt preserves rule ID,
qualitative classification, points, support path, exact contribution/opinion IDs, clinical-review
metadata, balance status, applicability, and applied/replaced/deduplicated/suppressed outcome.
Engine-inferred matches remain labeled.

Promotion requires schema/catalog validation, deterministic compile/replay, reference-patient
checks, and rule-combination tests. Unresolved clinical direction stays disabled. Provisional
balance may run in Developer/Reviewer play, and human lifecycle review separately decides whether
a compiled encounter enters the Player bundle. This decision authorizes the promotion contract,
not a schema migration, bulk activation, clinical rule, or new point value.

## D-174 — Diagnosis dossiers remain setting-independent; encounter recipes own runtime complexity

**Decision:** A diagnosis-family dossier is reusable clinical knowledge, not a patient tier, one
care setting, or a prebuilt encounter family. It owns the condition's stable identity, shared
state model, severity and specifier branches, presentation relationships, broad treatment roles,
decision policies, boundaries, provenance, and links to other topical owners. It never owns a
target play time, difficulty level, complexity budget, facility, location, player progression
gate, or an outpatient/inpatient treatment ceiling.

The MDD dossier must therefore be structurally capable of supporting a straightforward outpatient
decision, a hospital patient with polypharmacy, advanced treatment-resistant presentations, ECT,
ketamine, neuromodulation, and other later contexts without creating separate copies of generic
MDD knowledge. This does not require every branch to be populated now. Unreviewed or unsupported
sections remain sparse, disabled, or ticketed under D-165 and D-172; the engine must not invent
guidance merely to make the dossier appear complete.

A source-controlled case/encounter recipe—currently planned under the technical
`PatientTemplate` boundary—owns the setting, focused best-next-step question, selected diagnosis
states, eligible comorbidity pools, regimen and prior-history constraints, available actions,
presentation limits, complexity budget or envelope, and any narrow reviewed override. The
two-to-five-minute design target and any displayed difficulty are properties of the compiled
encounter and its presentation, not of MDD or another diagnosis.

Authoring prepares the versioned diagnosis, finding, test, medication, therapy, disposition,
regimen/trial, context, policy, and encounter-recipe files required for composition. It does not
pre-resolve or check in a finite catalog of fictional patients. Once those dependencies and the
versioned compiler are ready, the deterministic browser engine constructs a complete
`PatientInstance`, then freezes an `EncounterInstance` and `CompiledRubric`, from approved static
inputs plus an internal seed at queue-fill or explicit refresh time. It saves the seed, every
resolved value, contributors, and compiled versions; a waiting slot does not reroll during play.
There is no runtime AI, network dependency, `Math.random`, or regeneration on information
purchase.

Generalized runtime generation remains deferred until the required reusable owners and compiler
passes exist. The initial MDD work may deepen the dossier and its dependency graph without
generating a cohort. Current hand-authored `CaseBlueprint` and `CaseInstance` records remain
immutable compatibility fixtures until a separately validated migration.

Ticket order follows the complete database-to-game dependency graph, not the quickest path to a
visible case. The default order is:

1. stable identities, ownership, registry/versioning, provenance, and lifecycle boundaries;
2. general reusable patient-state primitives: findings/symptoms, time course, function, history,
   MSE, physical findings, vitals/measurements, medication and substance exposure, reactions,
   regimens, prior trials, comorbidity/chart state, and contextual variation;
3. general test and action owners: laboratory analytes/panels and reference intervals, bounded
   result generation, imaging/electrical studies/instruments, reveal actions, service
   fulfillment, therapies, medications, and dispositions;
4. diagnosis/intervention dossiers and cross-topic relationships, which may be opened earlier as
   discovery probes to expose missing dependencies but cannot make those dependencies executable;
5. reviewed qualitative decision policies, treatment prerequisites, interactions, fit, rule
   promotion, provisional balance, and audit trace;
6. encounter-recipe, instance, resolver, deterministic replay, persistence, coverage-diagnostic,
   and validation compiler passes; and
7. only then generated encounter cohorts, calibration, and player-facing expansion.

This order is a readiness topology rather than a demand to finish all of psychiatry before one
case. Each layer needs the smallest coherent, extensible general foundation required by the next
layer. A diagnosis dossier such as GAD may be sketched early when it helps discover shared
findings or test dependencies, but its existence cannot be used as evidence that runtime
generation is ready.

This decision corrects DBQ-010 and any earlier wording that treated the first MDD vertical as
outpatient-only, placed duration or difficulty in the diagnosis dossier, or made generated
patients the immediate acceptance gate. It changes architecture and work order only; it adds no
schema, patient, clinical rule, generation probability, or point value.

## D-175 — Canonical finding identities are atomic, source-aware, and normalized conservatively

**Decision:** One reusable finding identity represents one independently resolvable patient truth.
Interchangeable wording may be an alias, but lexical similarity, familiar clinical grouping, or a
compact player-facing list does not make two truths identical. Facts remain separate whenever
their values can coexist or disagree because of time scope, report source, observation source,
specificity, or value semantics. Player-facing actions may group several atomic facts; the
resolved patient and later explanation trace must keep every value and contributor separable.

Structured medication regimens, prior trials, reactions, treatment history, numeric measurements,
named instruments, laboratory values, imaging, and electrical studies retain their own typed
owners. They are not flattened into outcome-valued pseudo-findings. In particular, a duration or
ordinal burden value cannot be represented merely as `present`; its candidate remains unresolved
until the appropriate typed owner exists.

The first general-psychiatry audit examined 37 candidate concepts across current authored and
finite Reviewer content. Twenty-seven identity-only definitions are unambiguous under the current
schema, including the existing depressed-mood seed; 26 new definition files are registered.
Ten candidates remain review work because their value type or semantic boundary is not yet safe:
duration/course or ordinal burden, diminished interest versus diminished pleasure, fatigue versus
low energy, grandiosity time scope, impulsivity versus high-risk behavior, preparatory-behavior
time scope, weapon access versus weapon concern, paranoia versus persecutory belief, and reported
versus observed thought disorganization. Each ambiguity is resolved through one bounded review
packet rather than an automatic merge.

Every definition in this tranche is medically unreviewed and owns only stable identity, neutral
labels and aliases, semantic kind, admitted outcome values, and presentation projection. This
decision adds no diagnosis association, criterion, generation tendency, prevalence, probability,
clinical relevance, point value, treatment implication, case migration, or medical approval.
Existing `FindingBlueprint`, case, save, and replay snapshots remain unchanged.

## D-176 — Finding granularity stops at useful game decision boundaries

**Decision:** Canonical finding identity is not required to reproduce every phenomenologic
distinction that could be made in a comprehensive clinical model. PsychSim is a focused question
bank and learning game. When two descriptions ordinarily lead to the same immediate psychiatric
decision, the psychiatrist reviewer may deliberately approve one shared identity even if a more
granular research or assessment model could separate them.

The first approved application is anhedonia. Loss or reduction of interest and loss or reduction
of pleasure are presentation aliases for one current self-reported anhedonia identity because
that distinction usually does not change the focused best-next-step decision. Source records keep
their original permitted wording and provenance, so a future decision-specific reason may reopen
the boundary without discarding what each source actually stated.

This is a reviewed simplification, not automatic semantic merging. Different time scopes, patient
report versus observed examination, safety facts, treatment consequences, or distinctions that
materially change workup, treatment, disposition, or explanation remain separate. The decision
adds one medically unreviewed identity shell only; it adds no diagnostic criterion, generation
tendency, probability, clinical relevance, point value, treatment implication, case migration, or
medical approval.

## D-177 — Patient truth, assessment response, and surface wording are separate layers

**Decision:** Ordinary patient language is a deliberately lossy presentation of clinical state,
not a canonical identity resolver. PsychSim therefore keeps three versioned layers:

1. independently resolvable patient facts, each with its own value and contributor provenance;
2. an action- or instrument-owned assessment response derived through an explicit reviewed
   projection from one or more applicable facts; and
3. the deterministic wording variant shown to the player.

The first application is the broad current self-reported fatigue/low-energy complaint. `Fatigue`,
`Low energy`, and `Tiredness` are identity-equivalent terms for that nonspecific subjective
report. They do not merge or identify daytime sleepiness/somnolence, muscular weakness,
psychomotor slowing, medication sedation, exertional intolerance, or any later reviewed
contributor. Those facts remain independently resolved and can coexist or disagree. A patient may
use the same ordinary wording for any of them, and the same phrase may therefore appear in several
reviewed expression mappings without becoming a shared rule key.

A standardized assessment or instrument item owns its response scale and an explicit mapping from
applicable resolved facts to a yes/no/ordinal response. An unstandardized history action uses a
versioned expression bank with stable variant IDs. Both the response and wording are resolved and
saved before play with the projection version, source action or item, chosen variant, and every
contributing resolved-finding ID; purchasing the action only reveals the frozen result.
Instrument wording, interpretation, and reuse permission remain instrument-owned.

Canonical finding aliases remain globally unique identity terms. Phrase similarity never creates
a clinical mapping, and the displayed response never drives diagnosis, treatment, or scoring.
Several facts projecting to one response cannot double-award workup points. Post-submit and
Developer traces reconstruct `source fact → reviewed projection → displayed response`, while the
pre-submit presentation may remain compact and ambiguous.

This decision authorizes one medically unreviewed subjective energy-complaint identity and a
blocking technical projection contract. It does not implement that compiler, migrate compatibility
cases, infer an etiology, define an instrument item, add a diagnostic criterion, choose a
generation probability, assign points, change treatment behavior, or grant medical approval.

## D-178 — Database-foundation decisions use a tight local loop

**Decision:** While PsychSim is building the reusable database dependencies required for realistic
patient generation, work proceeds one bounded identity, owner, or contract at a time on local
`beta`. Each iteration runs only the smallest focused schema/content validation that proves the
changed boundary. It does not routinely push to GitHub, observe Actions or Pages, run browser
suites, build the Player or portable Reviewer, maintain app servers, or promote to `main`.

Full application and release verification resumes when a change actually affects those surfaces,
the user explicitly requests an integration/release checkpoint, or the database reaches the
readiness gate for deterministic realistic-patient generation. Until then, local changes are
batched, and `PROJECT_STATE.md` must state clearly what is and is not remotely backed up. This
workflow changes iteration cadence only; it does not relax content validation, deterministic
architecture, source/privacy boundaries, or the complete gates required for a later integration
checkpoint.

## D-179 — Symptom source, modality, and time scope remain independently resolvable

**Decision:** The grandiosity boundary generalizes across symptom clusters. Current patient report,
past or lifetime report, collateral report, chart or record evidence, current MSE or physical
observation, and a standardized instrument response remain independently resolvable whenever their
values can disagree. One History, Physical, or Testing action may present several of them compactly,
and their ordinary wording may overlap, but the resolved backend and explanation trace preserve
each value, scope, contributor, and projection.

Discordance is valid patient state rather than a generation contradiction. The engine does not
infer minimization, secondary gain, lack of insight, misunderstanding, cognition, or etiology from
the discrepancy unless a separate reviewed fact represents that explanation. Scope is applied
input-first: add the combinations encountered by actual content rather than pre-enumerating every
possible symptom × source × time permutation. Until a typed scope schema is implemented, every
consumer enumerates stable IDs explicitly and must never parse scope from an ID, label, alias, or
surface phrase.

This default automatically resolves mechanical source/time collisions. Current, past episodic, and
MSE-observed grandiosity are separate identities. Current self-reported impulsivity remains
separate from concrete behavior such as high-risk spending. Current and historical suicide
preparatory behavior are separate; exact event timing remains a later typed record. Current
self-reported weapon access is patient state, while whether it is clinically concerning belongs to
a safety assessment or policy. Self-reported and MSE-observed thought disorganization are separate.
Symptom duration and subjective burden route to target-scoped typed values rather than Boolean
findings.

These identity and ownership decisions add no diagnostic criterion, clinical interpretation,
generation probability, scoring, treatment behavior, compatibility migration, or medical
approval. A genuinely consequential semantic boundary—rather than a mechanical scope
application—still returns for psychiatrist review.

## D-180 — Paranoia is presentation vocabulary, not one backend truth

**Decision:** `Paranoia` may appear in search terms, ordinary patient language, and compact
player-facing presentation, but it is not one canonical Boolean finding. The backend separately
resolves current self-reported suspiciousness or mistrust, current self-reported ideas of
reference, and current self-reported persecutory ideation because any one may occur without the
others.

Belief content does not determine whether a proposition is true, and falsity does not by itself
make a belief delusional. A later typed belief appraisal must keep the patient's belief state,
conviction or fixity, relevant context, and any clinical interpretation separate from both the
reported content and the modeled world-state proposition. Patient report, collateral, records,
examination, and testing may disagree without invalidating the patient or authorizing an inference
about insight, deception, motive, or diagnosis.

The first implementation adds only three medically unreviewed identity shells. `Paranoia` remains
out of their canonical aliases so phrase overlap cannot silently merge them. World-state truth,
source-specific evidence, appraisal, and conditional reliability route to D-181 and its blocking
technical ticket. No compatibility case is migrated, and no criterion, generation probability,
clinical relevance, point value, treatment implication, or medical approval is added.

## D-181 — Encounter propositions and source evidence are separate, dependency-aware layers

**Decision:** When an encounter explicitly models an adjudicable factual proposition, that latent
proposition resolves deterministically to `true` or `false` before play and is saved with the
patient instance. Buying information never creates or changes it. Typed symptoms, subjective
experiences, diagnoses, measurements, and other state retain their native owners and are not
flattened into Boolean propositions merely to use this mechanism.

Patient, collateral, record, examination, and test evidence are separately resolved claims or
observations about the proposition. Each one saves its source instance, time scope, assertion,
claim-generation rule and version, deterministic draw when applicable, and relationship to the
latent truth. A claim may support, oppose, be uncertain about, or be unable to assess the
proposition. All claims are frozen before play; purchasing an action only reveals the relevant
saved evidence.

Evidence sources are not assumed independent. Exact copies retain one shared origin and cannot
become extra corroboration. Known correlated reports, repeated observations, copied-forward
records, related instrument items, or tests with a shared basis retain explicit dependency links.
The engine may later apply narrowly reviewed conditional reliability or corroboration rules to
independent evidence groups, but it must not use a global patient-credibility score, majority
vote, raw claim count, or naïve multiplication that double-counts correlated evidence. The
illustrative percentages discussed during design are game-calibration examples, not approved
clinical frequencies.

Conflict is expected educational state. It does not make a generated patient invalid and does not
imply lying, malingering, secondary gain, poor insight, memory impairment, or another explanation
unless that explanation is independently authored. A false world proposition is not automatically
a delusion; belief state and clinical appraisal remain separate under D-180. Patient-scene
evidence is also distinct from the formal article, guideline, regulatory, and Developer-opinion
provenance system.

The eventual post-submit trace must be able to reconstruct:

`latent proposition → source evidence → shared-origin/dependency handling → revealed result →
rule evaluation`.

This decision authorizes the point-free schema and dependency ticket only. It does not implement a
general Bayesian or causal inference engine, assign reliability probabilities, add diagnostic or
treatment rules, change scoring, migrate compatibility snapshots, or enable patient generation.

## D-182 — Evidence realism does not require convergence or perfect case resolution

**Decision:** Reject a generic fairness or “winnability” rule that requires the available evidence
corpus to converge on a latent proposition, favor the hidden truth, or make one exact diagnosis
inferable. Such a gate is too vague, risks excluding legitimately difficult psychiatric
presentations, and would push the generator toward artificial epistemic neatness.

Patient, collateral, records, examination, and testing may remain contradictory, incomplete,
uninformative, or collectively misleading at realistic reviewed frequencies. That does not make
the patient malformed and does not trigger deterministic retry, cleanup, or quarantine. Source
accuracy and dependency patterns are calibrated through narrow, context-specific generation
profiles and later play review, not through one global convergence target or credibility score.

The focused question remains the best next step under the information available. When the exact
diagnosis cannot reasonably be established, the player may leave diagnosis blank, choose an
appropriate broad or unspecified diagnosis, select a conservative intervention that covers the
live possibilities, avoid an unsafe commitment, or use another explicitly modeled general route.
The rubric may award greater specificity when it is actually supported, but it must not require
false precision. Multiple reasonable formulations and treatment routes may receive credit, and
hidden truth does not by itself make an evidence-responsive choice irrational.

This policy does not guarantee that every clinical uncertainty can be perfectly solved and does
not add a per-case winnability audit. Under D-172, automatic generation rejection remains limited
to literal structural impossibility or malformed state, including an explicitly incompatible
same-scope pair. Missing broad diagnosis identities, uncertainty-aware treatment relationships, or
rubric coverage remain nonblocking coverage gaps and review tickets; they are database work rather
than reasons to delete or reroll a plausible patient.

## D-183 — Proposition evidence has a narrow point-free resolved-state envelope

**Decision:** Implement the accepted D-181/D-182 boundary additively without changing the
compatibility patient or case schemas. `LatentPatientProposition` freezes one explicitly modeled
Boolean world-state statement. `PatientPropositionEvidence` freezes each source-specific claim,
its assertion, mechanically derived relation to truth, source instance, opaque time-scope ID,
claim origin, dependency links, and authored or deterministic resolution trace.

`EvidenceDependencyGroup` distinguishes exact shared origins from known correlation. Membership is
bidirectional; repeated records from one claim origin cannot remain ungrouped as independent
corroboration. `BeliefAppraisal` stores belief position, independently identified appraisal
dimensions, and separately rule-owned clinical interpretations. No truth value automatically
creates an interpretation. `PropositionEvidenceGenerationProfile` currently owns only versioned
scope, lawful assertion kinds, and rule review; it contains no probability or reliability value.

The cross-record `ResolvedPatientPropositionState` envelope validates identity and reference
integrity, saved truth relationships, and dependency membership. It deliberately accepts no
evidence, conflicting evidence, and collectively misleading evidence. It does not require
convergence, count votes, infer motive or diagnosis, expose reveal state, or contain points.

The narrow name is intentional. The later resolved-record foundation still owns the complete
`ResolvedPatientState` composition across internal conditions, chart claims, findings,
measurements, regimens, reactions, treatment history, context, and this proposition-state
envelope. Existing `PatientRecord`, `CaseBlueprint`, `CaseInstance`, persistence, and runtime
generation remain unchanged.

## D-184 — Finding presentation uses explicit versioned projections, never phrase inference

**Decision:** Implement the accepted presentation boundary as a point-free catalog/schema layer.
A `FindingExpressionBank` owns only stable wording variants and lawful display channels. It owns no
finding identity, canonical aliases, clinical association, or points. The first real bank records
the previously approved interchangeable ordinary low-energy phrases and remains medically
unreviewed and excluded from the ordinary runtime until the shared compiler exists.

A `FindingRevealProjection` explicitly names every canonical-finding state or proposition-evidence
assertion it consumes, its `all`/`any` match behavior, its information-action or instrument-item
target, its response, and any expression bank. A frozen `ResolvedFindingProjection` retains the
exact definition version, target, response, selected wording variant, resolved-finding IDs,
proposition IDs, evidence IDs, and deterministic resolution trace. An envelope validates the exact
definition and wording-bank version.

`InstrumentItemResponse` separately preserves instrument/item, response-scale option, time scope,
respondent/observer source, rights boundary, interpretation IDs, and all contributing backend IDs.
It does not assert that any instrument is valid or reusable; those are definition- and
source-specific review questions.

Aliases and phrase similarity cannot create mappings. Displayed wording, contributor count, and
instrument response cannot create diagnosis, treatment, or score behavior. Compatibility
`labelVariants`, current cases, reveal state, and runtime generation remain unchanged.

## D-185 — Measurements and categorical examinations are separate typed owners

**Decision:** Add a point-free measurement catalog/schema boundary without parsing compatibility
prose. `MeasurementDefinition` owns neutral identity, vital/anthropometric/physical domain, display
and UCUM units, precision, applicable reveal actions, and lawful context dimensions.
`ResolvedMeasurement` owns one finite value, display value, exact unit, context values such as body
position, time scope, source instance, interpretation reference, and resolution trace.

An interpretation may explicitly remain `not_interpreted`. Merely recording weight, BMI, a vital
sign, or another measurement does not make it abnormal and does not choose a UI color, diagnosis,
or point consequence. Reference intervals, abnormality thresholds, incidental distributions, and
clinical associations remain source- and rule-specific work.

`CategoricalObservationDefinition` and `ResolvedCategoricalObservation` separately support MSE and
physical observations with explicit allowed values and optional interpretation references. Weight
and BMI remain numeric measurements; body habitus remains a separate categorical observation.
Neither may be inferred from the other.

The first runtime-excluded catalog contains nine neutral identity/unit records for core vitals,
height, weight, and BMI. It contains no body-habitus categories or clinical ranges. Existing
`PatientOpening.basicVitals` strings and compatibility observations remain unchanged; no prose
parser may silently migrate them. The target compiler will consume only explicitly authored typed
records.

## D-186 — Every reusable test declares a structured patient-result contract

**Decision:** Add a point-free result contract to each current test definition. Numeric panels
declare fixed or patient-defined component ownership; categorical panels declare the same boundary;
binary tests declare their lawful outcomes; imaging and electrical studies declare
patient-defined structured findings. The resolved result preserves the exact definition version,
source and time scope, deterministic/authored resolution trace, and typed result kind.

Numeric components preserve value, display value, unit, UCUM code, exact reference-interval
metadata, and `normal`/`high`/`low` interpretation. Categorical, binary, imaging, and electrical
results preserve typed components or findings rather than one memorable narrative paragraph. A
fixed numeric contract must exactly match the component definitions already owned by its
generation profiles.

The contract does not invent test components, reference ranges, sensitivity, specificity,
incidental probabilities, clinical interpretation, or points. Critical abnormalities and
case-specific overrides remain patient-owned. Reveal actions still own neutral menu presentation
and service cost; scoring separately owns relevance. Existing compatibility case results and
runtime generation remain unchanged until the shared compiler and migration work are explicitly
approved.

## D-187 — Resolved patient state composes distinct records without inferring among them

**Decision:** Add one complete, point-free `ResolvedPatientState` schema for the future catalog
compiler while leaving `PatientRecord`, `CaseBlueprint`, `CaseInstance`, persistence, and runtime
behavior unchanged. Its records remain independently addressable:

- `ConditionState` owns an internal diagnosis-definition version, opaque clinical/time state,
  severity/specifiers, encounter relevance, origin, and resolution trace.
- `DiagnosisRecordEntry` owns what a patient, collateral source, record, or clinician source
  labeled, including questioned or rule-out entries. Its catalog mapping may be absent. A chart
  entry never creates an internal condition, and an internal condition does not require a chart
  entry.
- Current regimen entries, supplements, prior treatment history, reaction history, and
  medication-tolerability records retain their existing typed owners. Repeated medication and
  diagnosis identities are lawful because instance IDs remain independent.
- Canonical findings, numeric measurements, categorical observations, structured test results,
  clinical contexts, target-scoped duration, target-scoped ordinal burden, proposition/evidence
  state, clinical tags, and reported safety-planning ability compose the rest of the frozen
  patient snapshot.

The envelope validates globally unique owned record IDs, one resolution per canonical finding
definition, exact duration/burden targets, medication-tolerability subjects, paired chart mappings,
and inclusion of tags produced by resolved clinical contexts. It preserves no-evidence,
conflicting-evidence, chart/internal disagreement, repeated chart labels, long treatment
histories, and duplicate medication identities as valid state.

This composition does not judge chart accuracy, infer one record from another, choose optional
comorbidities, assign source reliability, add a diagnosis or treatment recommendation, contain
points, expose purchase/reveal state, or activate a generator. The next unresolved owner is the
substance/background-exposure vocabulary; no exposure taxonomy or prevalence was smuggled into
this record.

## D-188 — Exposure generation stays coarse while patient use truth stays objective

**Decision:** Reuse the existing medication and supplement identities for exposure state; add a
separate identity only when an agent is neither. A medication does not receive a duplicate
“substance” record merely because it can be misused. The initial other-substance catalog contains
neutral, runtime-excluded identity shells only.

One optional `AgentMisuseGenerationPrior` may describe each agent with a single approximate
probability of misuse given use. A medication prior additionally carries one prescribed-to-this-
patient multiplier and one not-prescribed-to-this-patient multiplier. Multipliers combine by
multiplication followed by a 0–1 clamp; this is a global schema/engine rule rather than repeated
metadata in every prior. Here misuse means a source- or reviewer-defined problematic or abusive
use pattern. A medication’s prescribed/not-prescribed relationship is a separate modifier and does
not decide that truth by itself. Every prior must point to a formal contribution or a Developer
opinion; a missing prior means “not characterized,” never zero. Published population statistics
are game-generation inputs rather than exact epidemiologic simulation, and no prior is authored in
this decision.

The resolved patient stores a compact positive-use inventory. Each used agent has one versioned
identity reference, current or elapsed recency, a current amount only when current, medication
prescription relationship when relevant, the final misuse Boolean, and one authored or
deterministic resolution trace. Absence from the frozen inventory means the patient did not use
that agent; it does not mean unassessed. History, collateral, records, toxicology, and other
projections separately determine what evidence the player receives and how accurately it reflects
the objective fact.

Medication-regimen entries remain prescription/list records with source-stated adherence;
medication exposure is the separate objective use fact. A prescribed medication can therefore be
listed while not used, and a nonprescribed medication can be used without a regimen entry.
Apparent disagreement remains auditable evidence rather than triggering automatic inference or
cleanup.

Intoxication, withdrawal, substance-use diagnosis, causal attribution, assessment status, reveal
state, treatment, and points remain separate owners. For the future `ResolvedPatientState`, this
unified inventory supersedes D-187’s separate supplement array; the existing
`SupplementUseEntry` and background-exposure schemas remain untouched compatibility records. No
runtime generator, clinical inference, rate, or gameplay behavior is activated.

## D-189 — Therapy source detail compiles to a simple modality recommendation

**Decision:** A psychotherapy selected in a focused encounter means “recommend this modality now.”
The complete submitted-treatment and scoring payload is the stable intervention ID, analogous to
selecting a medication without claiming that a future adequate trial was delivered. Encounter
state does not model session count, duration, practitioner, protocol fidelity, course completion,
or a full-program guarantee.

Source contributions, article records, Developer opinions, and diagnosis-family dossiers may
preserve the source's more specific language, including statements about a full course or program.
That authoring detail remains available for audit and provenance, but the encounter compiler
projects it to the corresponding therapy-modality ID. Evidence-supported efficacy, combinations,
redundancy, availability/capability, and point balance remain separate reviewable relationships;
this simplification does not turn a source statement directly into a rule.

Each current treatment or disposition now has one stable file-backed editing surface. The existing
`TreatmentOption` ID is the canonical selectable identity; no parallel intervention-identity
schema or fidelity layer is added. Prior psychotherapy attempts remain richer historical patient
state under `PatientTreatmentHistory` and are revealed through
`info.history.treatment-history`; their status, engagement, and response do not impose semantics on
a new recommendation. This decision narrows the psychotherapy delivery/fidelity portions of
D-105 and D-169 while preserving their identity, provenance, source-rights, combination, and
balance boundaries. No clinical mapping, efficacy claim, point value, or encounter behavior
changes.

## D-190 — Medication-change meaning belongs to the reviewed route, not the player payload

**Decision:** The player submits concrete snapshot actions only: medication starts plus
entry-targeted `continue`, `increase`, `reduce_or_limit`, `taper`, or `stop` operations. The
selection contains no switch, augmentation, simplification, or other intent field; no dose,
schedule, transition timing, follow-up instruction, or predicted outcome; and no points, grade,
par, or score cap.

A focused reviewed diagnosis route or decision policy owns the acceptable transition shape and
its explanatory meaning. It may interpret a complete action combination as initial treatment,
replacement, augmentation, simplification, or maintenance/optimization. This explanation is
route metadata, not patient truth and not a player assertion. An initial MDD route can therefore
require one eligible first-line start, while a complex route can retain one beneficial regimen
entry, reduce/taper/stop another entry, and add an eligible adjunct. A replacement-shaped start
plus taper/stop may match a reviewed route, but it never implies that overlap, washout, or a
cross-taper schedule is safe.

Medication classes and their memberships are explicit stable, versioned relationships. The
legacy free-text `MedicationDefinition.classes` values and arbitrary tags are never parsed to
infer class membership, duplication, or safety. Reusable benefit, prior-response, nonresponse,
tolerability, prior-trial, goodness-of-fit, duplication, interaction, withdrawal,
contraindication, and prerequisite contributors remain separately typed and traceable. A later
balance layer may assign provisional points; the qualitative relationship does not own them. A
true contraindication can later suppress positive fit rows under D-159, while a serious but
nonabsolute risk remains a large independent negative rather than being mislabeled absolute.

There is no universal regimen-quality score, blanket same-class penalty, automatic clinical
winner, or inference of treatment meaning from medication count. A reviewed route or separately
reviewed reusable hazard must support any consequence. An unmatched but structurally plausible
plan remains eligible for the existing `engine_inferred` evaluation label rather than acquiring an
invented penalty or citation.

The new medication-regimen knowledge catalog is intentionally empty and runtime-excluded. It
creates authoring bins and validation boundaries only. No medication class, membership, clinical
relationship, route, point rule, compatibility-case score, or medical approval is activated by
this decision. D-190 narrows the historical unreviewed categorical-intent proposal associated
with the CANMAT source review: source material may distinguish combination, adjunctive treatment,
and switching, but PsychSim stores the chosen explanation on a reviewed route rather than in
patient state or the player payload.

## D-191 — One primary policy anchors the encounter; typed full-state discovery supplies secondary contributors

**Decision:** Each target encounter compiles exactly one version-pinned primary
`DecisionPolicyDefinition`. It owns the focused question, one or more broad acceptable response
branches, and the dominant qualitative route later eligible for the primary point band. It may
name companion requirements and narrow overrides, but it is not required to hand-list every
patient-specific bonus, harm, or prerequisite that could affect a submitted option.

The complete frozen `ResolvedPatientState` remains eligible input. The compiler automatically
discovers reviewed secondary contributors whose declared typed patient dependencies intersect
that state and whose exact treatment, regimen-entry, intervention, investigation, or disposition
targets intersect the encounter's action horizon. Selection-dependent predicates resolve when the
player submits. This includes, when separately authored and reviewed, fit, response, tolerability,
prior-trial, reaction, regulatory-alignment, discontinuation/withdrawal, duplication/parsimony,
interaction, contraindication, treatment-triggered prerequisite, and disposition effects. A
modifier can therefore arise from any relevant condition, finding, interpreted measurement,
context, regimen entry, trial, reaction, or exposure without the primary policy copying or linking
it individually.

A patient predicate matches explicit typed values only. Closed-world `not` is deliberately absent:
missing, unresolved, unassessed, and inapplicable state cannot be converted to a negative finding.
An author who needs a negative condition names its explicit `absent`, `false`, `documented_none`,
or other reviewed value. Ordinary `all` combines independent facts; `same_record_all` explicitly
requires every named fact to bind to at least one common repeated record. The compiled trace keeps
each matched fact attached to the exact record IDs that satisfied it.

A semantic full scan and a deterministic reverse-index lookup are interchangeable
implementations. Production may use a versioned derived index keyed only by exact typed
dependencies and action targets. Given the same catalogs, frozen patient, action horizon, and
versions, either method must return the identical ordered candidate set independent of source or
file order. A caller-supplied index is copied and deterministically re-fingerprinted before use;
one compile input may contain only one active version/owner for a logical rule ID. No labels,
surface wording, arbitrary tags, lexical similarity, point magnitude, or nearby dossier may create
a match.

Full-state discovery does not make the encounter an exhaustive care plan. A background
diagnosis's broad treatment route does not become another primary objective merely because it is
present. Only the primary policy supplies the dominant route; automatically discovered positive
contributors must be action-relative secondary effects within the focused snapshot. The engine
does not require treating every condition, ordering every potentially relevant test, or reward
unselected options. Matching global safety/interaction and selected-treatment prerequisite
guardrails stay eligible. Missing reviewed coverage emits a nonblocking diagnostic and ticket and
neither invents a penalty nor invalidates the patient.

`CompiledRubric` freezes the primary policy and route versions, included rule versions, inclusion
lane, normalized patient/action activation predicates, matched fact-to-record and action
references, review/provenance/balance references, rule-combination identifiers, and
compiler/index fingerprints. Unordered predicate branches, action targets, and provenance IDs are
normalized before freezing; unrelated singleton owners cannot share same-record identity; the
durable rubric ID uses the full 64-bit fingerprint suffix; patient-state and action-horizon IDs are
part of the integrity payload; and a persisted artifact must pass strict semantic schema checks
plus payload-integrity verification. Duration and burden retain source/time scope and scale
version. Tolerability attached to a current regimen entry may affect an entry operation only when
the normalized candidate binds that exact entry, preventing duplicate same-medication records from
sharing a modifier. An approved policy/regimen record may rely only on an approved formal
contribution or accepted Developer opinion. The active reference union
admits only canonical rule-owner kinds that validation can resolve and expands atomically with a
future owner. D-159 combination semantics still govern after separately reviewed
balance records supply points. Current case-local rubrics and reference runs remain compatibility
fixtures. This decision authorizes only the point-free policy/compiler ownership and tests; it
adds no guidance, points, generated patients, runtime migration, general expression language, or
medical approval.

## D-192 — PsychSimDataAdjunct is an independent proposal producer, not a second writer

**Decision:** PsychSimDataAdjunct may operate asynchronously as a separate clinical-learning and
evidence-horizon process. PsychSim tickets are useful inputs but do not control its queue. The
adjunct may maintain concept-first research records, preserve private-corpus leads without
duplicating completed review, and return versioned, hashed, medically unreviewed proposal bundles.
Any PsychSim mapping is a separate snapshot-bound layer so a proposal does not claim current
canonical IDs or targets after the pinned snapshot changes.

PsychSim remains the only canonical writer and authority for stable IDs, source-use decisions,
clinical rules, balance/points, review state, and runtime content. This repository must validate
the adjunct's pinned base and stale targets, decide whether each source may support the proposed
use, and perform every candidate database edit and runtime validation. An adjunct packet can
neither resolve a PsychSim ticket nor approve or activate content. The safe whole-corpus Developer
Database projection may provide coverage signals after deterministic regeneration and validation;
the adjunct does not reread or receive private source text merely to reconstruct those signals.

## D-193 — Shared-finding compilation reconciles exact candidates before it projects presentation

**Decision:** The first shared-finding compiler is a deterministic, point-free reconciliation
pass over explicit candidate values. It does not own diagnostic cardinality, epidemiologic
probability, or game-generation weights. An upstream diagnosis, template, context, medication,
generation profile, or patient override may supply one already-authored or
already-deterministically-generated candidate with its exact finding-definition version,
candidate role, uncertainty, contributor owners, provenance, review state, and authored or stable
draw trace. `no_opinion` remains an explicit inert candidate rather than becoming absence.

For one finding definition, reviewed patient overrides take precedence while retaining every
displaced candidate. Otherwise reviewed case-critical, diagnostic-requirement, and
cardinality-result candidates must agree. Agreeing hard candidates co-apply. An incompatible hard
value at the same scope produces one stable `literal_same_scope_contradiction` result that a later
patient composer may retry or quarantine; input order never chooses a winner. A reviewed
weighted-tendency result may control only after an upstream generation profile has already
aggregated its inputs. If several soft candidates still propose different values, compilation
stops with an invalid-input diagnostic rather than inventing weights. Background variation is
used only when no higher-priority value-bearing candidate exists. Every candidate and contributor
is retained as applied, compatible but nondecisive, overridden, displaced by a higher-priority
candidate, no-opinion, or not reviewed.

Uncertainty metadata does not turn an agreeing literal value into a contradiction. Within the
controlling tier the compiled value retains the most cautionary explicitly supplied marker:
`conflicting_sources` before `reported_uncertain` before `none`. Every original marker remains
visible on its candidate evaluation.

After values freeze, an explicit `FindingRevealProjection` may map one fact into several views or
several facts and proposition-evidence claims into one response. Canonical-finding and proposition
bindings pin definition versions. Proposition-evidence bindings also name allowed assertion,
source kind, and optional time scope so patient, collateral, record, examination, and test claims
cannot leak into one another. `all` requires every binding; `any` retains every matching binding,
not merely the first. Conflicting or correlated patient-scene evidence remains valid and is not
counted, reconciled, or treated as a finding contradiction.

Each projection target and response must be present in a frozen projection horizon. The horizon
is an encounter snapshot, not a new catalog owner; a later instance compiler must derive it from
the canonical information-action and instrument owners. This allows the pure compiler to freeze
both information-action and instrument-item projection records without inventing instrument
scale, rights, interpretation, or response metadata. Materializing the separate
`InstrumentItemResponse` remains deferred until a real instrument definition supplies those
fields.

Expression-bank ID and content version are pinned. Approved projections may use only approved
banks in the target's declared display channel. Variant choice is derived from the internal seed,
patient/projection identity, exact matched sources, and an ID-sorted variant set, never file order.
The compiled set saves every resolved finding, candidate disposition, matched
finding/proposition/evidence ID, stable wording draw, nonblocking review diagnostic, input
fingerprint, exact projection-horizon ID, and verified payload fingerprint. Structural conflict
results retain the same exact input fingerprint and normalized candidate/value/contributor/review
snapshots rather than only a generic error label. It contains no reveal state, diagnosis
inference, clinical rule, points, treatment recommendation, compatibility-case migration, or
generated patient cohort. The existing case-local finding path remains unchanged.

## D-194 — Catalog instances freeze exact structural attachments before generation is enabled

**Decision:** The target runtime model now has an additive, synthetic-only
`PatientTemplate → PatientInstance → EncounterInstance` attachment boundary. The current
`CaseBlueprint`, `CaseInstance`, attempts, saves, queues, and browser application remain unchanged.
`attachment_only.v1` means that a template can pin exact condition constraints, optional-condition
group bounds, location versions, one primary policy, the focused decision, action/diagnosis/finding
horizon IDs plus payload fingerprints, result-binding recipe IDs plus its exact selector
fingerprint, and an unspent `budget_only` complexity envelope. It contains no probability,
optional draw, clinical association, point value, presentation generation, or resolved patient.

The pure assembler accepts already-resolved structural inputs. It requires canonical findings to
come from D-193, attaches every compiled information-action projection exactly once to a frozen
result binding, inserts exact finding-scoped duration and burden records only after their
definition selectors resolve, then compiles D-191 against the final patient state and exact action
horizon. Required and selected condition bindings must match complete versioned condition state;
every full internal condition must enter through exactly one required or selected optional binding.
Required conditions retain exact template-authored provenance; selected optional conditions retain
deterministic generation provenance. Additional bound contributing/background conditions remain
lawful, while muddy findings, chart labels, and rule-outs remain independent. An empty diagnosis
submission remains available. Disposition options must exist at the pinned location, while missing
broader clinical coverage remains a nonblocking decision-policy diagnostic rather than patient
invalidity.

Patient, encounter, and atomic snapshot records retain stable IDs, compiler version, internal
seed, request/input fingerprints, exact template and location payloads, condition-selection trace,
shared-finding output, projection/action/diagnosis horizons, resolved result bindings, and the
compiled qualitative rubric. The encounter also retains the exact pre-resolution result selectors,
so selector-to-frozen-result resolution can be reconstructed. Integrity verification rejects
unknown outer or nested compiler versions, same-ID patient/action/diagnosis/projection/result-recipe
mutation, stale policy/location/condition/result references, seed-mismatched wording draws,
orphaned information projections, and payload tampering. Only declared set-like fields are
normalized; diagnosis-option, result-source, and other authored ordering is preserved.

This boundary deliberately does not generate a patient. Reusable condition probabilities,
optional-module draws, demographic/regimen/reaction/test profiles, presentation richness,
instrument materialization, scoring/balance, persistence migration, compatibility adapters,
runtime content, queues, and cohorts remain disabled. Existing base patient state can hold
condition/proposition-scoped duration and burden; finding-scoped records use the explicit
two-phase selector because their resolved finding IDs do not exist until D-193 finishes.

## D-195 — Presentation richness is a nonblocking template expectation, not a patient tier

**Decision:** Each target `PatientTemplate` owns one versioned `presentation-richness.v1`
envelope, separate from its optional-feature budget and from clinical rules. The envelope names at
least one audited decision-driver category and expresses prior-effort expectation as
`not_required`, `multiple_expected` with an authored minimum of at least two and no maximum, or a
reasoned `treatment_naive_exception`. This captures the accepted expectation that prolonged or
severe psychiatry presentations commonly contain multiple prior treatments or coping attempts
without imposing a universal history cap or diagnosis-owned difficulty.

A pure evaluator runs only after the complete `ResolvedPatientState` freezes. It enumerates exact
source IDs and counts for internal conditions, chart diagnoses, current regimen entries,
exposures, medication trials, psychotherapy trials, current providers, prior levels of care,
reaction records, and canonical findings. Medication trials, psychotherapy trials, and current
providers contribute one structured prior-effort unit each; a prior level of care contributes its
documented occurrence count. The evaluator does not count current medications again as prior
effort and does not infer the purpose of exposures.

The evaluation is fingerprinted against the exact template reference, normalized envelope, and
frozen patient-state fingerprint, then attached once at the root
`CatalogCompiledInstanceSnapshot`. Integrity verification deterministically re-evaluates that
context and rejects stale or tampered attachments. An unmet minimum or a treatment-naive exception
paired with existing prior effort emits a compact `nonblocking` authoring diagnostic. It never
deletes findings, simplifies overlapping diagnoses, changes the primary policy, generates or
selects optional content, rerolls/rejects/quarantines a plausible patient, assigns points,
calibrates difficulty, changes persistence, or enters the current runtime compatibility path.
The D-191/D-193/D-194 compilers and this evaluator are quarantined behind
`@psychsim/engine/authoring`; the ordinary engine root imported by browser/runtime code does not
re-export them.

## D-196 — Template conditions are selected by an exact game profile, not clinical prevalence

**Decision:** Optional internal conditions now have one standalone, versioned
`weighted-template-condition-selection.v1` authoring profile. The profile pins the complete exact
`PatientTemplate` payload and supplies one explicit count-weight table and one candidate-weight
table for every optional-condition group. These are named `gameSelectionWeight` because they tune
question-bank variety only; they are not prevalence, association strength, diagnostic likelihood,
evidence certainty, or points.

The pure selector always materializes every required condition, then selects each optional group
without replacement from deterministic stable draws. Declared set-like inputs are normalized so
file order cannot affect output. Its complete artifact preserves the seed, template/profile
versions and fingerprints, selected count and candidate draws, every selected and unselected
candidate with its authored weight, exact `ConditionState` and
`ResolvedTemplateConditionBinding` records, required-versus-generated provenance, input and output
fingerprints, and deterministic replay verification.

Only an explicitly authored, rule-level-approved literal incompatibility between two selected
template-condition IDs may return a structural conflict. The conflict retains the full artifact
and has `retry_or_quarantine` disposition; the selector itself does not search for a cleaner
combination or retry another seed. Required-required incompatibility, stale template pinning,
incomplete group coverage, and impossible count profiles are malformed recipe input. Surface
symptom overlap, uncertain chart diagnoses, missing treatment coverage, or psychiatric ambiguity
remain valid and cannot create incompatibility.

A focused integration test proves that successful condition states and bindings are accepted by
the D-194 attachment compiler. The selection artifact itself is not yet embedded into D-194; an
explicit later composer checkpoint must preserve that audit attachment rather than coupling the
standalone selector into an attachment-only request prematurely. The selector is exported only
through `@psychsim/engine/authoring`, with recursive lint and runtime-source guards against browser
or content-runtime imports. It adds no finding generation, diagnosis inference, clinical
probability, optional richness-module selection, points, persistence, queue, cohort, compatibility
migration, or gameplay behavior.

## D-197 — Condition findings use reviewed exact profiles before shared-value reconciliation

**Decision:** Each exact selected `ConditionState` may bind one or more standalone, versioned
`condition-finding-cardinality.v1` authoring profiles. A profile scope pins the diagnosis
definition and version, clinical state, time scope, severity scope, and required specifier subset.
Every fixed outcome, cardinality group, and selectable member requires approved rule-level review
plus a formal source-use reference or separately typed Developer-opinion reference. These profiles
are not diagnosis inference, epidemiologic prevalence, evidence strength, or point rules.

Required mappings always emit one exact D-193 `diagnostic_requirement` candidate. A cardinality
group selects one reviewed count, then samples members without replacement using explicit
`gameSelectionWeight` values; only selected members emit `cardinality_requirement` candidates.
The complete artifact preserves every selected and unselected member, count/member draws, exact
state/profile binding, review and provenance record, profile/input/output fingerprints, and any
selected condition left without a profile. An unselected member remains unknown to that profile
and can never be silently converted to an absent finding.

A profile whose only selected cardinality count is zero may lawfully emit no candidate. That
artifact is a compositional partial, not a standalone D-193 request: a later composer must merge it
with the other exact/background candidate owners and call D-193 only with its required nonempty
candidate set.

More than one condition or composable profile may contribute to the same finding. This selector
neither blends those contributions nor chooses a clinical winner: D-193 remains the only
exact-value reconciler and either co-applies agreement or returns a stable literal hard-value
conflict. The first profile shape keeps finding targets unique within one profile so coupled or
overlapping cardinality constraints cannot acquire accidental semantics; a later reviewed
extension may add those semantics if real content requires them.

The selector and its integrity/context verifiers are exposed only through
`@psychsim/engine/authoring`, with recursive runtime-source guards. This decision adds no real MDD
or other diagnostic criteria, background variation, soft-tendency aggregation, clinical
probability, diagnosis inference, points, retry/search loop, presentation, persistence, composer
attachment, compatibility migration, cohort, or gameplay behavior.

## D-198 — Background findings use explicit reviewed game weights, never inferred defaults

**Decision:** A standalone `weighted-background-finding.v1` authoring profile may supply
lowest-priority texture for one exact finding-definition version. A bounded
`BackgroundFindingHorizon` names the exact targets, and each target must bind one exact profile
and definition version. The profile owns a finite unique set of lawful concrete outcomes,
positive integer `gameGenerationWeight` values, approved rule review, and a formal source-use
reference or separately typed Developer-opinion reference.

The weights are nonnegative unnormalized synthetic generation mass used to tune question-bank
variety. They are not normalized or clinical probability, prevalence, evidence certainty,
diagnostic likelihood, or gameplay points. The selector samples exactly one outcome from
ID-normalized weights using a stable deterministic draw and emits one D-193
`background_variation` candidate per target. It never creates an implicit absent or normal value.

The artifact preserves the exact D-197 reference, horizon and profile fingerprints, every offered
outcome and weight, selected outcome, stable draw, review/provenance, definition and profile
contributions, candidate, and input/output fingerprints. Standalone integrity verification
reconstructs the profile fingerprint and weighted selection, while exact-context verification
replays the request. If D-197 already emits the same stable finding ID, D-198 must use the same
content version. D-193 can then retain the background trace while a diagnostic/cardinality value
prevails, or use background to fill an otherwise uncovered definition.

This selector does not inspect conditions, medications, demographics, or context; aggregate
multiple soft influences; reject symptom overlap; infer diagnoses; assign points; project wording;
persist; retry; attach itself to D-194; or enter runtime. Real background values remain disabled
until their profiles receive source/reviewer approval. How multiple applicable soft contributors
combine before one `weighted_tendency` candidate is resolved by D-199.

## D-199 — Soft finding tendencies pool only within one explicit categorical outcome set

**Decision:** For one exact finding-definition version, D-199 begins with the complete D-198
baseline and accepts only already-matched, independently reviewed soft-contributor profiles.
`gameGenerationWeight` is nonnegative unnormalized synthetic generation mass. It is not gameplay
points, a percentage, evidence strength, diagnostic likelihood, epidemiologic prevalence, or a
care recommendation. The aggregator adds each explicit contributor allocation to the matching
baseline outcome, normalizes the pooled mass once, makes one deterministic target-stable draw, and
emits exactly one D-193 `weighted_tendency` candidate.

The target outcome set must be closed, exhaustive, and mutually exclusive. In the first strict
profile shape, the D-198 baseline and every contributor provide one entry for every lawful
finding-definition outcome. A zero contributor entry means only “no added mass”; the positive
baseline keeps that outcome possible. If two states may coexist, they require separate finding
identities and draws. A binary suppressive influence may explicitly add support to its unique
complement. With three or more outcomes, every contributor supplies its complete allocation and
the engine never guesses how support should be redistributed. Literal impossibility remains an
explicit reviewed hard constraint, never a zero or negative soft weight.

Raw baseline and contributor tables intentionally retain magnitude: scaling one contributor alone
changes its influence. A common scaling of the whole pool preserves normalized probabilities and
the target-stable random quantile. The artifact records every raw allocation, pooled numerator and
denominator, normalized game-selection decimal, selected outcome, exact applicability
contributions, review/provenance, stable draw, and fingerprints. Duplicate applicability IDs
cannot stack. Unreviewed, unresolved, missing, or inapplicable material is omitted before this
already-matched request and is never converted into negative evidence.

D-193 retains the D-198 background candidate alongside the D-199 candidate: the weighted candidate
controls only when no patient override or diagnostic/cardinality hard value exists. This
authoring-only aggregator does not discover contributors from patient state, estimate clinical
probability, infer diagnoses, assign points, retry a seed, project wording, persist, attach itself
to D-194, or enter runtime.

## D-200 — Finding-pipeline composition preserves every upstream audit

**Decision:** A narrow authoring-only composer now verifies and retains the complete
D-196 → D-197 → D-198 → optional D-199 chain before handing one exact candidate union to D-193 and
one exact attachment request to D-194. It validates every standalone artifact, every exact
ID/payload-fingerprint reference, the complete D-196 template payload, and the selected condition
states and bindings attached by D-194. The candidate union is the explicit authored hard/no-opinion
lane plus every D-197 candidate, every D-198 candidate, and every optional D-199 candidate.
Candidate or contribution ID collisions are errors; the composer never deduplicates equivalent
clinical meaning.

D-198 remains in the union even when D-199 exists, so D-193 can retain the displaced baseline
trace. When D-199 is absent, D-198 remains the controlling soft lane. D-197 and authored hard
lanes retain their existing precedence. D-193 is preflighted once for its complete conflict detail,
then D-194 is invoked exactly once. A literal same-scope hard conflict is accepted as a
fingerprinted outer audit only when D-194 reaches the same shared-finding conflict boundary; an
earlier malformed attachment remains an ordinary error. The composer does not retry, reroll,
remove candidates, or search for a cleaner patient.

Every stage keeps its own seed. No root/sub-seed policy is inferred. The outer success or conflict
artifact freezes every upstream artifact, the exact candidate union, the complete assembled
D-193/D-194 request, both compiler input fingerprints, the D-194 snapshot or normalized hard
conflict, and its own payload fingerprint. Standalone integrity replays the retained request and
requires the same compiled snapshot or the same literal conflict; matching IDs alone cannot
substitute a different candidate payload, condition state, template, or complexity envelope. The
outer input fingerprint binds the exact upstream payload references to D-194's canonical request
fingerprint, so reordering a set-like recipe field does not create a different clinical artifact.
The exact template preserves the encounter-owned, still-unspent optional-complexity budget. D-200
does not spend that budget, discover applicable contributors, generate actions or results, infer
diagnoses, assign points, persist, migrate compatibility content, or enter the browser/runtime
surface.

## D-201 — One encounter-owned budget selects optional texture only

**Decision:** The existing `additional-feature-budget.v1` value is one hard maximum for optional
features selected by an exact encounter recipe. It is not a target to exhaust. A zero-module draw
and unused capacity are valid, saved, and auditable. Required diagnoses, focused complications,
current regimen/history needed to pose the immediate question, and any other feature that reframes
the primary decision remain required template/policy state and spend no optional budget.

A reusable optional-module definition owns stable identity and module kind. An exact-template
candidate binding separately owns that encounter's selected-record ID, cost, impact,
five-dimensional complexity contributions, synthetic game-selection weight, and review. This
allows the same reusable concept to cost different amounts of optional richness in different
focused encounters without making a global difficulty or clinical-importance claim. The complete
exact-template profile explicitly weights every count from zero through the template maximum and
binds every candidate once. Every offered count must have at least one compatible subset within
the budget.

The pure authoring selector draws one feasible count, then selects without replacement. At each
ordinal it admits a candidate only when its cost fits, it does not conflict with an already
selected module, and exact bounded look-ahead proves that at least one completion remains for the
requested count. Its artifact preserves the normalized request, every count and candidate weight,
per-step eligibility or blocking reason, exact incompatibility/review/provenance records, stable
draws, selected and unselected module snapshots, total spent, and remaining capacity. Standalone
integrity replays the complete request.

Module `cost` consumes only optional-richness capacity. `gameSelectionWeight` controls only
deterministic game variety. Neither is a care-point value, clinical probability, prevalence,
evidence strength, reimbursement, patient tier, facility gate, or displayed difficulty. D-201
freezes only module selection; it does not materialize an allergy/reaction, prior treatment,
comorbidity, substance exposure, finding, test, regimen, diagnosis, or scoring payload.

D-196 remains standalone synthetic condition-selection infrastructure. D-202 supplies the
separate narrow bridge that constrains optional-comorbidity candidates to modules already selected
by D-201, preserving D-196 audit context while charging the single D-201 budget exactly once. The
two selectors never make independent unrestricted optional-comorbidity draws. Compatibility and
runtime validation continue rejecting nonempty selected modules until their typed payload
compilers, replay, and migration boundary exist.

## D-202 — Budget-selected comorbidities materialize without a second draw

**Decision:** D-201 is the sole authority for optional-comorbidity membership and budget spending.
The D-202 authoring bridge consumes the complete verified D-201 artifact plus one normalized D-196
template/profile request. It never calls D-196's weighted count or candidate selector. Changing the
D-196 seed or weights therefore cannot change which optional condition identities D-201 selected.

One reviewed exact-template bridge profile maps every D-201 candidate module whose kind is
`comorbidity` bijectively to every D-196 optional group/candidate. Each mapping pins the module
version and fingerprint, D-201 candidate-binding ID, selected-record ID, group ID, and template
condition ID. Missing, extra, duplicate, stale, cross-template, cross-version, required-condition,
or non-comorbidity mappings are invalid. A bridged optional group must permit zero selections; a
nonzero minimum is case-defining state and belongs in the template's required conditions outside
the optional budget.

The bridge preserves D-196's configured count/candidate weights as audit context only. D-201
selection ordinals and stable draw IDs provide the actual selection provenance. Required
conditions are materialized with authored provenance and do not consume budget. Only selected
comorbidity mappings materialize generated optional `ConditionState` and group-scoped condition
bindings. Non-comorbidity D-201 modules remain selected identities for their later typed payload
owners.

Reviewed D-196 incompatibilities are re-evaluated over required plus D-201-selected conditions. A
literal conflict remains an exact retry-or-quarantine audit; the bridge does not reroll, silently
substitute another module, refund or recharge capacity, infer diagnoses, or decide clinical
coverage. The artifact retains the complete normalized D-201, D-196, and bridge inputs plus every
selected/unselected mapping, condition state/binding, conflict, and fingerprint, and standalone
integrity replays that request.

D-202 remains authoring-only. It does not materialize condition findings, reactions, exposures,
regimens, prior trials, tests, treatment rules, points, presentation, persistence, compatibility
content, or browser/runtime generation. Downstream D-197/D-200 attachment requires a later
neutral resolved-condition-source contract and source-specific verifier integration; current
compatibility/runtime validation still rejects nonempty selected modules.

## D-203 — Condition findings consume genuine source provenance, never simulated D-196 draws

**Decision:** D-197 accepts one strict `ResolvedConditionSource` discriminated union containing
either the complete genuine D-196 template-condition-selection artifact or the complete genuine
D-202 optional-comorbidity bridge artifact. A source-specific authoring verifier dispatches to the
matching native integrity verifier and derives one transient common view of source identity,
template reference/fingerprint, condition states, bindings, and conflicts. That view is not stored
as another truth artifact, and no branch is converted into the other branch's schema.

D-197 embeds the complete verified source and a native source-kind-aware reference. The reference
pins source kind, artifact ID, native payload fingerprint, and exact template. D-197 accepts only a
successful source for finding generation; a structurally valid literal-incompatibility source
remains a retry-or-quarantine audit and emits no finding candidates. Bound and unbound condition
state IDs form an exact partition of the source state. Each profile binding retains the existing
exact diagnosis/version/clinical-state/time/severity/specifier checks, and standalone D-197
integrity re-verifies the embedded source before trusting its candidates.

For a D-202 source, required conditions retain authored template provenance and optional
comorbidities retain the bridge profile plus original D-201 stable draw. D-197 performs no
optional-condition count draw, module draw, budget calculation, reroll, or provenance rewrite. Its
historical D-196 draw and candidate hash key remains the two-field native source ID/payload
reference so the ordinary D-196 candidate semantics do not change merely because the outer source
contract became explicit.

D-200 remains deliberately D-196-only in this bounded slice and now rejects a D-197 artifact whose
source kind or exact template/reference does not match its supplied D-196 artifact. Migrating
D-200, retaining a complete D-202 source through D-194 replay, and proving the full
D-202→D-197→D-198→D-199→D-200 chain is the next separate authoring checkpoint. D-203 adds no real
clinical profile, probability, prevalence, point rule, diagnosis inference, other optional-module
payload, presentation, persistence, compatibility migration, patient queue, or browser/runtime
behavior.

## D-204 — Finding-pipeline audits retain the genuine condition source end to end

**Decision:** D-200 consumes the same strict `ResolvedConditionSource` as D-197. Composition and
standalone integrity dispatch to the native D-196 or D-202 verifier before trusting condition
state. D-197's complete embedded source and source-kind-aware reference must exactly equal the
source supplied to D-200; matching an ID alone is insufficient.

D-194 receives the exact template, condition states, and condition bindings derived from that
verified source. D-200 embeds the complete genuine source and binds its kind, native payload
fingerprint, template, and nested provenance into the outer input and output fingerprints. A
genuine D-202→D-197→D-198→optional-D-199→D-200 chain therefore retains the original D-201 budget,
selection draws, bridge mappings, and condition provenance without simulating a D-196 selection
artifact. The breaking authoring composer contract advances to `2.0.0`.

D-201's resulting `selectedModules` remain an authoring audit and are not copied into D-194 or
runtime complexity state. D-204 attaches only the verified condition state and bindings already
materialized by D-202. Compatibility/runtime continue to reject nonempty selected modules until
each other module kind has a typed payload compiler and an explicit migration boundary.

D-204 adds no real profile, clinical probability, prevalence, point rule, diagnosis inference,
non-comorbidity payload, presentation, persistence, patient queue, or browser/runtime behavior.
It supersedes only D-203's temporary D-200-is-D-196-only restriction; the historical D-200 and
D-203 decisions remain accurate records of their bounded checkpoints.

## D-205 — One budget-selected reaction module materializes one complete uninterpreted history

**Decision:** D-201 remains the sole authority for optional-richness membership, cost, selection
ordinal, and stable draw. The D-205 authoring bridge maps every `allergy_reaction` candidate in one
exact D-201 pool to one complete typed `PatientReactionHistory` alternative. It performs no
additional draw, budget calculation, reroll, substitution, refund, or second charge.

Every pair of reaction-history alternatives must already be explicitly incompatible in the exact
reviewed D-201 profile. This guarantees that at most one complete history can materialize and
avoids inventing record-merging or precedence semantics among `unassessed`, `documented_none`, and
`entries_present`. A selected reaction module never produces `null`. When no reaction module is
selected, the bridge produces a null optional contribution rather than fabricating an unassessed
or documented-none history.

Each mapping pins the exact module version and fingerprint, D-201 candidate-binding ID,
selected-record ID, complete reaction-history payload, and approved review. A narrow versioned
reference horizon exactly covers every medication, nonmedication trigger, and reaction
manifestation used across the mapped alternatives. The artifact retains the complete verified
D-201 artifact, unchanged complexity spending and remaining capacity, all selected and unselected
mappings, the exact upstream ordinal and stable draw, the materialized history or null, and
deterministic input/output fingerprints. Standalone integrity replays the full request.

The patient's `recordedAs` label and reported severity remain uninterpreted observations.
`interpretedAs` remains null. A medication trigger does not imply immune allergy, contraindication,
avoidance, safety consequence, probability, or points. D-205 does not import medication-reaction
selection policies, compile a reveal, merge with the required/base patient reaction history,
attach to D-194, alter persistence, or enter the browser/runtime. Those are separate future
composition, clinical-review, and migration decisions.

## D-206 — Optional prior-treatment modules are additive positive record contributions

**Decision:** Every D-201 `prior_treatment` candidate maps to one nonempty positive contribution
using the existing medication-trial, psychotherapy-trial, current-provider, and prior-level-of-care
record owners. Unlike D-205 reaction history, these four lanes have no mutually exclusive
top-level unassessed/documented-none status. Compatible prior-treatment modules may therefore
co-select and concatenate by stable record ID. Universal pairwise incompatibility or whole-history
replacement would create unnecessary Cartesian authoring and prevent separate historical
complications from spending the encounter's optional-richness budget.

D-201 remains the sole authority for candidate membership, count, module cost, total spending,
remaining capacity, selection ordinal, stable draw, and reviewed incompatibilities. D-206 performs
no draw, cost, refund, reroll, substitution, or semantic merge. Every mapping is nonempty, and all
record IDs are globally unique across every lane and mapped contribution because several modules
may co-select. Repeated medication, intervention, provider type, or level-of-care identities remain
valid under distinct record IDs; the bridge never deduplicates or combines them. No selected
prior-treatment module yields a null aggregate. When no prior-treatment module is selected, the
aggregate is null rather than asserting treatment-naive or documented-none history.

An exact versioned authoring horizon covers all medication IDs used by medication trials and all
psychotherapy intervention IDs used by psychotherapy trials. Provider types and levels of care are
closed schema values and do not receive invented reference records. The bridge pins the supplied
reference snapshot; catalog currentness remains a separate content-validation boundary. The bridge
preserves authored duration, maximum dose, adequacy, adherence, response, tolerability, source,
summary, provider activity, and occurrence count verbatim. It does not infer adequacy from
exposure, normalize dose, construct chronology, expand occurrence counts, simulate response, or
recommend treatment.

Required or decision-defining history remains core encounter state outside the optional budget.
One optional contribution may still contain many records when those records form one coherent
texture module; a long psychiatric history is not reduced to one module per trial. D-206 retains
the complete verified D-201 artifact, selected and unselected mappings, each original ordinal and
draw, normalized aggregate or null, and deterministic replay fingerprints. It remains
authoring-only and does not merge with required/base patient treatment history, tolerability
findings, current regimen, D-194, persistence, compatibility, or browser/runtime state.

## D-207 — Optional substance-use modules materialize additive positive-use records

**Decision:** Every D-201 `substance_use` candidate maps exactly once to one reviewed, nonempty
`OptionalExposureContribution`. A contribution contains one or more positive-use entry
specifications using the existing medication, supplement, or other-substance agent identities.
Compatible selected modules may co-select and concatenate into one deterministic, ID-sorted
`OptionalExposureMaterializedContribution`; D-207 does not replace a complete exposure inventory.

D-201 remains the sole authority for candidate membership, count, module cost, total spending,
remaining capacity, selection ordinal, stable draw, and reviewed incompatibilities. D-207 performs
no second selection, field draw, probability calculation, cost, refund, reroll, or substitution. It
copies each selected mapping's authored recency, current amount, prescription relationship, and
explicit frozen `misuseTruth`, then adds deterministic-generation provenance using that mapping's
original D-201 stable draw. Every and only `substance_use` candidates in the exact D-201 pool must
be mapped; non-substance modules are outside this bridge.

Use-entry IDs are globally unique across the profile, and one contribution stores at most one
summary per semantic agent identity. Co-selectable mappings must use disjoint agents. When two
mappings describe alternative states for the same agent, they must pin the same exact agent
content version and their D-201 modules must already be explicitly incompatible. The bridge never
deduplicates, merges, or chooses a winner by file order. An exact versioned
`OptionalExposureReferenceHorizon` contains every and only medication, supplement, and
other-substance identity/version used across all mappings.

A selected exposure module always materializes a nonempty positive contribution. When D-201
selects no `substance_use` module, the result is null: this means no optional exposure
contribution, not no lifetime use and not an unassessed or inaccurately reported state. Required or
decision-defining exposure remains core encounter state outside the optional-richness budget. One
coherent optional module may contain several agents, but it spends only its already-authored D-201
module cost; entry count, misuse status, clinical severity, prevalence, and downstream point impact
never calculate that cost.

The artifact retains the complete verified D-201 request and artifact, every selected and
unselected mapping, exact ordinals and draws, unchanged spending and remaining capacity, the exact
reference horizon, the materialized contribution or null, and deterministic replay fingerprints.
D-207 adds no prevalence or misuse priors, evidence-claim ingestion, source-report accuracy,
intoxication, withdrawal, diagnosis, attribution, clinical rule, point value, reveal,
base-inventory composition, persistence, compatibility, or browser/runtime behavior. The generic
D-201 `other` kind remains an unsupported sentinel; it receives no catch-all payload.

## D-208 — One verified composer attaches core and optional patient state exactly once

**Decision:** One standalone authoring-only composer consumes a complete pre-finding core
`ResolvedPatientState`, the exact D-201 optional-feature artifact, one genuine
`ResolvedConditionSource`, and every D-205, D-206, or D-207 bridge required by the candidate kinds
in that same D-201 pool. It verifies native integrity and complete shared D-201 context rather than
trusting matching IDs. Every selected supported module materializes exactly once through its typed
owner; no module disappears, contributes twice, draws again, or incurs another charge.

D-201 remains the sole authority for the encounter recipe's optional-richness count, module costs,
total spending, remaining capacity, selection ordinals, stable draws, and incompatibilities.
Payload size never determines cost: one coherent prior-treatment module may contain many trials,
and one exposure module may contain several agents while spending only its single authored D-201
cost. Required and focus-defining state remains core content outside the optional budget. The
composer neither copies selected modules into the attachment-only template nor derives difficulty,
reimbursement, progression, or clinical importance from complexity.

When the D-201 pool contains comorbidity candidates, the condition source must be the genuine
D-202 bridge containing that exact D-201 artifact. Otherwise it must be a genuine D-196 source
with required conditions only and no independent optional-selection groups. Core condition state
must equal the source's exact required subset; the composed lane then becomes the source's complete
required-plus-selected state. Native literal condition conflicts yield a fingerprinted
`not_composed` audit rather than a partial patient.

Reaction history uses an explicit structural ownership choice. `core_locked` is valid only when
the D-201 pool contains no reaction candidates. `optional_alternative_default` declares the core
history to be the complete zero-selection fallback; a selected D-205 history replaces it whole.
No value—including `unassessed` or `documented_none`—is treated as an empty placeholder.
D-206 contributions append to all four treatment-history lanes, while D-207 contributions append
positive-use records to the exposure inventory. Repeated medication or intervention identities
remain valid under distinct historical record IDs. Record-ID collisions and exposure
semantic-agent collisions are rejected rather than deduplicated or renamed.

The generic D-201 `other` kind remains unsupported. An unselected candidate produces a
nonblocking coverage diagnostic. If selected, it remains charged and auditable under the original
D-201 selection but blocks composition because no typed owner exists; the composer does not
reroll, substitute, refund, invent a catch-all payload, or classify the patient as clinically
invalid.

The resulting state has deterministic state and changed-inventory identities, retains exact
condition bindings, and keeps `canonicalFindings` empty for D-193. The complete core state, D-201
artifact, bridges, selected-module materialization audits, coverage diagnostics, and replay
fingerprints remain attached to the D-208 artifact. D-208 performs no clinical inference,
probability calculation, tag derivation, diagnosis promotion, point mapping, D-200/D-194
attachment, compatibility migration, persistence, or runtime generation.

## D-209 — The finding pipeline derives all patient context from one verified composition artifact

**Decision:** D-200 consumes one complete D-208 `ResolvedPatientStateCompositionArtifact` as its
only pre-finding patient-state source. Its authoring request no longer accepts a separate condition
source, base patient state, condition bindings, D-193 patient-state ID, or D-193 proposition state.
For a composed D-208 result, D-200 derives all five values from that artifact and advances its own
breaking composer contract from `2.0.0` to `3.0.0`. D-193 and D-194 retain their existing contracts;
D-200 now assembles those requests without parallel caller-owned state.

The request stores the D-208 artifact plus either the complete D-197-through-D-200 downstream
payload or null. Null is valid only when D-208 is `not_composed`, because a native condition
conflict cannot legitimately produce a D-197 artifact. D-200 verifies D-208 first and returns the
typed `PATIENT_STATE_COMPOSITION_BLOCKED` outcome with its retained blocker IDs. It never creates
dummy downstream artifacts, compiles core-only state, rerolls a module, substitutes another
payload, or refunds the D-201 complexity cost.

On the ready path, D-197's complete condition source and typed reference must exactly equal the
source embedded by D-208. The assembled D-193 request uses the composed state's exact ID and
proposition state. The assembled D-194 request uses that complete state and D-208's exact condition
bindings once. The D-200 artifact embeds D-208 beside D-197 through D-199, the assembled D-193/D-194
request, and either the compiled snapshot or the existing literal finding-conflict audit.
Standalone integrity natively verifies D-208 and replays the full D-208 → D-193 → D-194 chain.

D-201 remains the only optional-feature selector, count, cost, draw, spent, and remaining-budget
authority. D-209 performs no selection, probability calculation, clinical inference, point
mapping, real-content activation, compatibility migration, persistence, or runtime generation.

## D-210 — Reviewed soft-tendency applicability is compiled from complete typed patient state

**Decision:** A standalone authoring-only compiler verifies one successful D-208 composition
artifact and one genuine D-198 background artifact, then semantically scans every supplied
approved reusable applicability definition against the complete frozen patient state. Each
definition pins one exact finding-definition version and D-199 tendency-profile
version/fingerprint, contains one exact typed patient predicate, and may emit at most one D-199
applicability binding for its exact D-198 target. Every evaluation remains in the audit whether it
matched, did not match, or lacked an exact target.

The compiler reuses the decision-policy patient-fact vocabulary and explicit same-record
semantics. Each positive match retains exact fact-to-record bindings. Missing, unresolved,
unknown, or unassessed state never satisfies a known positive dependency and is never converted
into a negative finding. Pre-D-193 applicability cannot depend on a canonical finding that does not
yet exist. Labels, prose, aliases, free tags, point magnitude, and file order never match.
Semantic full scan is authoritative; any deterministic reverse index is re-fingerprinted against
the complete exact definition payloads and must return the identical ordered match set.

D-208 origin provenance remains auditable, but a typed fact has the same applicability whether it
came from required core state or a D-201-selected optional module. One optional module may activate
several independently reviewed tendencies without another charge; one definition still emits at
most one binding regardless of how many records or `any` branches matched.

D-199 remains the sole owner of complete outcome allocations, pooled synthetic mass,
normalization, and the weighted finding draw. D-201 remains the sole optional-richness selector
and authority for module costs, spent budget, and remaining capacity. D-210 performs no allocation
arithmetic, probability calculation, finding draw, complexity selection or spending, clinical
inference, scoring, or points. This checkpoint adds no real applicability definitions or
profiles, D-199/D-200 attachment, compatibility migration, persistence, or runtime generation.

## D-211 — D-200 derives D-199 only from one verified whole-state applicability audit

**Decision:** The D-200 finding-pipeline composer advances to `4.0.0` and accepts one complete
D-210 artifact instead of a caller-supplied D-199 artifact or contributor-binding list. D-200
verifies that D-210 embeds the exact D-208 patient-state composition and exact D-198 background
artifact already in the pipeline. It never reruns the applicability matcher or discovers another
contributor.

When D-210 emits bindings, D-200 selects exactly the referenced profiles from D-210 and exactly the
targeted finding-definition payloads from the existing shared-finding recipe. It constructs and
retains one content-derived D-199 request, calls D-199, and retains that artifact. D-199 remains the
sole owner of allocation arithmetic, pooled synthetic mass, normalization, and the target-stable
draw. Integrity replay reconstructs the same request, verifies the D-199 context, and binds D-210
plus the derived request and result into the D-200 fingerprints.

When D-210 emits no bindings, D-200 retains every matched/nonmatched/unavailable evaluation and
requires both D-199 fields to be null. The genuine D-198 candidate remains active; absence of an
applicable secondary tendency does not erase the baseline.

D-201 remains the sole optional-richness selector and budget authority. A complication spends its
authored module cost exactly once when D-201 selects it. Its frozen facts may activate several
independently reviewed D-210 tendencies without additional complexity spending, and the number or
strength of downstream rules never changes the encounter budget. D-211 adds no real profiles,
clinical probabilities, scoring points, compatibility migration, persistence, or runtime patient
generation.

## D-212 — Structured non-finding reveals remain source views, not patient truth

**Decision:** Structured history and record results that are not canonical findings receive a
separate authoring-only reveal boundary. A versioned
`StructuredPatientStateRevealDefinition` names one exact legacy information-action payload
fingerprint, a closed set of patient-state lanes or singleton fields, and the source kinds allowed
to produce that view. The initial lanes cover diagnosis records, medication-regimen entries,
positive exposure-use entries, medication and psychotherapy trials, current treatment providers,
prior levels of care, medication-tolerability findings, and reaction records. Reaction-history
status, medication-reaction-assessment status, and reported safety-planning ability remain
separate singleton fields.

One `ResolvedStructuredPatientStateRevealProjection` is one source view at one exact time scope.
It retains the source instance, claim origin, known dependency groups, explicit presentation
status, every included truth-record ID, every omitted truth-record ID, and an
aligned/misaligned/indeterminate relationship. The integrity envelope verifies that included and
omitted IDs exactly partition the corresponding frozen patient-state lane and that singleton truth
values equal the frozen state. It permits a partial or inaccurate report without mutating hidden
truth or forcing evidence convergence. Reaction records cannot appear without an explicit
assessment status, and reported safety-planning ability remains a patient report.

An empty patient-state array never silently means “none reported.” A source-scoped
`none_reported`, `unassessed`, or `unable_to_assess` statement must be explicit even when the truth
lane is empty. D-212 does not yet support invented false-positive records or field-level alteration
of a truth record; those require a later bounded version and review. It adds no arbitrary filter or
expression language, inferred motive for discordance, reliability probability, wording,
information-action availability, result binding, scoring predicate, point value, persistence,
compatibility migration, or runtime behavior.

D-201 remains the sole optional-module selector and spender. D-212 is a read-only projection over
already-frozen state: projection count, source count, included or omitted record count, alignment
status, and reveal count never select, charge, refund, reroll, or recalculate an optional module.
D-213 may later compile the versioned universal action catalog, D-193 finding projections, D-212
structured views, and existing measurement/test owners into D-194 result bindings.

## D-213 — Universal information-action recipes route frozen results without inventing data

**Decision:** One standalone authoring-only compiler consumes a versioned exact universal
information-action catalog, one versioned recipe for every catalog action, one focused action
horizon, the exact D-193 output and projection horizon, D-212 structured reveal envelopes, and
the exact measurement, categorical-observation, and structured-test owners present in the frozen
patient state. Every catalog action receives exactly one normalized evaluation:
`outside_action_horizon`, `complete`, or `incomplete_coverage`.

A recipe names only a closed set of source-owner classes. It cannot filter by labels, aliases,
prose, clinical relevance, diagnosis, points, or file order. Exact action-targeted D-193
projections, D-212 views, and structured tests are action-owned and cannot be silently omitted by
their action's recipe. Measurements and categorical observations are routed only through their
explicit `availableThroughActionIds`; one source may legitimately be available through several
actions. Every resolved owner retains its exact ID and content version. An unknown action,
malformed source, stale owner definition, crossed patient, or stale action fingerprint is a
structural input error because the alleged frozen source cannot be verified.

Missing declared source data is different from invalid data and from an explicit negative. A
missing owner yields a nonblocking `incomplete_coverage` evaluation, no binding candidate, and no
fabricated normal, negative, empty, or documented-none result. A D-212 `none_reported` source view
is itself verified data and may complete a recipe. Instrument-item targets remain explicit
unsupported diagnostics for their separate future compiler, even when no instrument projection
resolved; information-action targets in the D-193 horizon must belong to the exact universal
catalog.

The artifact retains the normalized request, full catalog evaluation, exact source references,
coverage diagnostics, deterministic IDs/fingerprints, and replay validation. Its binding-candidate
union is deliberately separate from D-194's current selector union: D-213 does not claim to emit
an `EncounterResultBindingRequest`, because D-194 cannot yet retain and verify D-212 envelopes.
D-214 owns that attachment.

D-201 remains the sole optional-richness selector and budget authority. Recipe count, action
count, source count, record count, emitted candidates, omissions, and diagnostics never select,
charge, refund, reroll, or recalculate an optional module. One cost-1 module may produce many
facts and result sources while spending remains 1. Information-action purchase cost is a separate
encounter-economy concern. D-213 adds no real recipe content, clinical rule, probability, wording,
points, scoring, reveal state, persistence, compatibility migration, runtime generation, D-194
attachment, or D-200 attachment.

## D-214 — D-194 derives frozen result bindings from one complete D-213 artifact

**Decision:** A reusable `PatientTemplate` advances to `attachment_only.v2` and pins one exact
static `UniversalActionResultAssemblyRecipe` by version and payload fingerprint. That assembly
contains the universal action catalog, action recipes, and source-owner definitions. It never
contains a patient state, patient-specific D-212 projection, focused horizon, result binding,
score, or complexity charge. Patient-specific D-212 projection recipes remain detached inputs
until D-194 has compiled the final D-193-backed patient state.

D-194 is the only result-attachment orchestrator. It builds and verifies the exact D-212 envelopes
against that final state, compiles one D-213 artifact over the exact action and projection
horizons, and proceeds only when every focused information action has complete coverage. It then
mechanically translates D-213 candidates into D-194 selector requests. Callers can no longer
supply parallel result-binding requests. Missing coverage returns its diagnostic and attaches
nothing; there is no fallback binding and no invented normal, negative, empty, or
documented-none result.

The complete D-212 envelope remains in the authoring-only D-213 audit. `PatientInstance` freezes
only a presentation-safe structured source view: presented record IDs and presented singleton
values remain, while omitted truth IDs, hidden truth values, truth relationships, claim-origin and
dependency audit, copied patient state, and authoring resolution are not copied into the frozen
reveal. Exact patient, D-193, D-212, action-catalog, action-horizon, projection-horizon, source
definition, recipe, and static-assembly equality is checked during compilation and standalone
integrity replay. Measurements and categorical observations may remain explicitly available
through more than one action; action-owned finding projections, structured views, and tests remain
bound to their exact action.

D-200 advances to composer `5.0.0` and retains the static assembly plus the full D-213 artifact in
its authoring snapshot. Its literal D-193 conflict path still stops before result attachment.
D-201 remains the sole optional-module selector and complexity-budget spender: a selected
complication pays its authored module cost once, regardless of how many facts, projections,
sources, or reveal actions it later produces. Purchasing an information action spends encounter
points in the separate gameplay economy and never changes the generation-complexity budget.

D-214 adds no real action recipe, source-report profile, instrument compiler, clinical rule,
probability, wording, point value, persistence migration, compatibility activation, runtime
patient generation, UI, or app work.

## D-215 — Structured source reports compile one already-selected whole-lane behavior

**Decision:** One authoring-only compiler derives patient-specific D-212 source views from an
exact frozen `ResolvedPatientState`, exact D-212 definitions, and explicitly reviewed source-report
profiles. Each profile owns one exact definition/source/time/claim-origin view and resolves every
declared lane or singleton exactly once. A lane supports only `report_all`, `none_reported`,
`unassessed`, or `unable_to_assess`; a typed singleton either mirrors frozen truth or presents one
explicit lawful value.

This checkpoint does not choose a behavior. It contains no source-credibility score, probability,
weight, partial-record selector, false-positive record, field mutation, clinical inference,
wording, point value, action cost, persistence, or runtime output. A later separately reviewed
owner may select among complete behavior profiles. D-215 never treats an empty truth lane as
implicitly negative: `report_all` over an assessed empty lane becomes an aligned
`none_reported`, while unassessed or unavailable sources remain indeterminate.

The compiler normalizes the exact patient state, pins its payload fingerprint into artifact and
projection identities, validates every result through the native D-212 envelope, retains exact
profile and definition fingerprints, and replays the complete request during integrity
verification. The approved source-report profile is the executable behavior-review gate; the
D-212 definition remains a neutral structural action-to-lane mapping whose lifecycle is validated
separately by later runtime admission.

D-201 remains the sole optional-module selector and complexity-budget spender. One selected module
may create many patient records and many reviewed source views without another charge. Report
count, action count, included/omitted record count, and alignment never debit, refund, or resize
the encounter complexity budget. Information-action purchase points remain a separate gameplay
economy. D-215 is not yet attached to D-194 and adds no real source-report profile.

## D-216 — Encounter care setting is an exact recipe/location coordinate, not patient complexity

**Decision:** The generated-encounter attachment boundary has one closed care-setting identity:
`outpatient_psychiatry`, `emergency_department`, `inpatient_psychiatry`, or
`consultation_liaison`. “Inpatient psychiatry” means a psychiatric inpatient unit; psychiatric
consultation for a medically hospitalized patient belongs to consultation-liaison.

One `PatientTemplate` owns exactly one care setting, every `LocationDefinition` names its setting,
and the frozen `EncounterInstance` retains the value. D-194 accepts an exact compatible location
only when template and location settings agree, and standalone integrity requires the
template/location/encounter triple to remain identical. The compiler contract advances to
`attachment_only.v3` / catalog-instance compiler `3.0.0`; the containing D-200 audit composer
advances to `6.0.0`.

Care setting is encounter metadata, not a `ResolvedPatientState.clinicalContexts` fact, diagnosis
dossier property, symptom, comorbidity, optional feature, scalar tier, or proxy for difficulty.
Selecting a setting costs zero complexity. Context-defining facts required to pose the focused
question are core recipe state; optional complications still spend their authored D-201 cost
exactly once. The same diagnosis owner may support separate context-specific encounter recipes
without duplicating diagnosis knowledge.

A setting grants no capability, action, service, formulary item, disposition, reimbursement, or
points. Physical locations remain the operational owners of those resources, and the primary
policy remains template-pinned. The current four runtime locations are explicitly outpatient.
The authoring compiler is structurally complete for all four settings, but real ED, inpatient, and
consultation-liaison locations, dispositions, service horizons, queue selection, department
construction, persistence, and UI remain separate validated work rather than being fabricated by
this enum.

Implementation correction recorded 2026-07-30: D-201 selector `2.0.0` keeps the complete template
and selection-profile fingerprints for exact validation, provenance, and replay, but its
RNG-only draw domain omits the profile's embedded full-template fingerprint. A care-setting-only
template change therefore changes the audited exact fingerprints without rerolling the selected
optional-module count, identities, cost, or remaining budget. Profile policy, module identities,
seed, lane, and ordinal remain in the draw domain; budget and compatibility still govern
feasibility.

## D-217 — Source-report behavior selection is slot-local and care-setting reviewed

**Decision:** Source-report behavior is selected before D-215 through a standalone authoring-only
artifact. A neutral `StructuredSourceReportSelectionHorizon` pins one exact universal
action-result assembly and one or more exact source-view slots per D-212 definition. Every slot
retains its definition fingerprint, source kind and instance, time scope, claim origin, and known
dependency groups. Multiple patient, collateral, record, or clinician-observation slots may point
to the same definition without blending their evidence.

A separately reviewed `StructuredSourceReportSelectionProfile` pins the neutral horizon and one
exact D-216 care setting. It owns one policy per slot. A `fixed` policy names one complete D-215
profile and performs no draw. A `weighted` policy names at least two mutually exclusive complete
D-215 profiles with positive unnormalized `gameGenerationWeight`. Weight normalization occurs
only inside that one slot. It is synthetic game-selection mass, not clinical prevalence,
reliability, evidence strength, diagnosis probability, points, or complexity.

Every candidate must be one exact stable profile version, match the slot's complete source
coordinate, use a source kind permitted by its D-212 definition, and resolve every declared lane
and singleton exactly once. The compiler rejects two content versions of one stable profile ID.
Each weighted slot uses an independent deterministic substream keyed by its stable slot/source
coordinate and complete candidate weights. Reordering candidates or adding an unrelated slot does
not perturb an existing selection; fixed slots never draw. The artifact retains every candidate,
exact normalized within-slot mass, selected profile, nullable stable draw, request, fingerprints,
and deterministic replay.

D-217 does not consume patient truth, inspect a location, grant capabilities, or run D-215. It
imports no D-201 artifact and does not select, spend, refund, or resize optional complexity.
Source count, misleading or unavailable reports, and behavior choice cost zero complexity;
information-action purchase points remain separate. The selector supports outpatient psychiatry,
emergency department, inpatient psychiatry, and consultation-liaison structurally, but adds no
real behavior profile or non-outpatient operational content. D-218 must separately attach the
verified D-217 selection to D-215 and D-194 after the final patient state exists.

## D-218 — Source-report attachment replays one exact D-217 → D-215 → D-213 chain

**Decision:** D-194 no longer accepts caller-authored patient-specific D-212 projection recipes.
Its only structured-source behavior input is a nullable, integrity-verified D-217 selection
artifact. Null is required exactly when the template-pinned static assembly has no D-212
definitions. A nonempty definition horizon requires the selection artifact.

After D-193 freezes the complete patient state, catalog compiler `4.0.0` verifies that D-217 pins
the exact patient seed, normalized patient template, static assembly, and D-216 care setting. The
D-217 integrity/context preflight occurs before D-193, so even a retained literal-conflict audit
cannot carry a replay-invalid selection; D-215 still waits for a valid final state. It resolves only
the selected complete profiles, compiles D-215 over final patient truth and every assembly
definition, converts only D-215 output into native D-212 envelopes, and supplies those envelopes
to D-213. D-214 remains a mechanical full-audit-to-safe-view translator and does not learn source
behavior.

The authoring snapshot retains both the complete D-217 selection and D-215 report artifact.
Standalone integrity independently verifies and reconstructs D-217, re-runs D-215 from the exact
selected profiles and final state, requires its definitions to equal the static assembly, and
requires D-213 envelopes and D-214 safe views to equal the reconstructed output. The zero-horizon
path requires both source-report artifacts and all D-212 envelopes to be absent. D-200 advances to
`7.0.0` and retains the same chain.

D-218 does not add real source behavior, weights, probabilities, clinical claims, point values,
information-action costs, persistence, runtime generation, or UI. Care setting continues to
grant no capability. D-201 remains the only optional-complexity selector and spender: D-217
selection, D-215 compilation, report count, source count, and action attachment cost zero
generation complexity. Real outpatient, emergency-department, inpatient-psychiatry, and
consultation-liaison content must later provide separately reviewed locations, operational
horizons, profiles, and recipes.

The D-217 template fingerprint intentionally covers the full versioned template, including its
complexity profile, as audit invalidation. Changing only complexity does not alter a slot's stable
draw or selected behavior, but it requires a newly compiled selection artifact for the changed
template payload. This is not a second selection or complexity charge.

## D-219 — Operational admission proves exact location access before encounter attachment

**Decision:** Add one standalone, authoring-only
`EncounterOperationalAdmissionArtifact` before D-194 may compile a patient and encounter. Its
request pins the exact `PatientTemplate`, physical `LocationDefinition`, focused
`DecisionActionHorizon`, universal information-action catalog, and deliberately minimized
operational projections of service methods, formularies, medication identities, and treatment
options. The same compiler algorithm applies to `outpatient_psychiatry`,
`emergency_department`, `inpatient_psychiatry`, and `consultation_liaison`; care-setting names,
facility tiers, and resources belonging to another location confer no access.

The artifact evaluates every focused information action, start medication, current-regimen
operation, nonmedication intervention, and disposition exactly once. Baseline information-action
and treatment access depends only on the exact location's capabilities and an eligible
location-scoped service method. A start requires an exact medication owner and membership in that
location's exact base formulary. A disposition additionally requires exact location allowlisting.
Current-regimen operations remain patient-state-owned and are not blocked merely because the
existing medication is not stocked for a new start. A method that requires staff is retained as
`requires_explicit_runtime_context`; it cannot borrow an upgrade that was not supplied through a
future exact runtime-context artifact. An unrestricted external method may satisfy baseline
mechanical access.

The operational projections intentionally exclude labels, service kind, operating cost,
cheapest-method selection, quality modifiers, point values, reimbursement, clinical correctness,
fit rules, and answer-key content. Missing owners or requirements create itemized
`incomplete_coverage` diagnostics. They block activation of that compiled encounter but do not
invalidate, reroll, simplify, refund, or respend the patient. D-201 remains the sole
optional-feature selector and budget authority.

D-194 now requires a complete, integrity-verified D-219 artifact for the exact template,
location, care setting, action horizon, and information-action catalog before D-193 may proceed.
It retains the complete artifact in the root snapshot and pins its ID and payload fingerprint in
the `EncounterInstance`. D-200 retains and replays that same artifact. This advances the current
contracts to `attachment_only.v4`, catalog compiler `5.0.0`, and D-200 composer `8.0.0`.

D-219 is a structural admission proof, not a clinical winnability or minimum-safe-route rule. It
does not infer staff, equipment, departments, upgrades, capabilities, formulary access, or
dispositions from a setting name. It adds no real non-outpatient location, real service profile,
point value, clinical rule, compatibility migration, queue behavior, persistence, runtime
generation, or UI. Real ED, inpatient-psychiatry, and consultation-liaison content remains
deferred until selected-location runtime access is explicit; the compatibility runtime's current
facility-wide capability/formulary union must not be used to admit multiple operational settings.

## D-220 — Instrument item responses materialize from exact reviewed owners without score interpretation

**Decision:** Add a standalone authoring-only instrument item-response compiler after D-193. An
`instrument-item-response-only.v1` `InstrumentDefinition` pins one exact content version and an
opaque rights-boundary ID. Each `InstrumentItemDefinition` owns only its item ID, response-scale
ID, permitted response-option IDs, owning information action, respondent or observer source, and
time scope. These neutral owners contain no item wording, score weight, total-score formula,
threshold, interpretation, clinical relevance, or point value.

The compiler consumes one integrity-verified `CompiledSharedFindingSet`, its exact
`FindingProjectionHorizon`, the exact universal information-action catalog, a minimized
`InstrumentInformationActionHorizon`, and exact instrument definitions. It evaluates every
instrument-item horizon target exactly once. A complete target requires an approved exact
instrument version and item, its owning action in both the catalog and focused information-action
horizon, and exactly one frozen D-193 `response_option` projection admitted by that item. The
target's horizon options must equal the item's complete option set, its display channel must be
null, and its projection cannot select an expression bank. Every item sharing one response-scale
ID must expose the same option set. The action's neutral report source must agree with the
instrument-owned respondent source.

Missing, stale, or unapproved owners; a missing or out-of-horizon action; no or multiple frozen
responses; a non-option response; an unlisted or divergent option set; or presentation/source
leakage produces itemized `incomplete_coverage`. D-220 never chooses, deduplicates, interprets, or
invents a response. It copies the reviewed respondent and time scope from the exact item owner; it
does not infer a canonical finding's modality from D-193 output.

A complete `InstrumentItemResponse` preserves the instrument/item/version, response scale and
option, owning action, time scope, respondent source, rights boundary, projection identity, and
every contributing finding, proposition, and evidence ID. Interpretation IDs remain empty in this
checkpoint. The artifact retains exact owner, action, and horizon fingerprints, every evaluation
and diagnostic, the normalized request, and deterministic replay. A horizon with no instrument
items produces an explicit complete empty artifact.

D-220 compiler `1.0.0` is exported only from `@psychsim/engine/authoring`. It adds no real
instrument content or copied item text, validation claim, score, threshold, total, probability,
diagnosis, clinical interpretation, action cost, point value, D-201 complexity operation,
persistence, runtime generation, or UI. D-213 remains unchanged and continues to report instrument
targets as unsupported. D-220 does not yet attach to D-213, D-194, or D-200, so
`attachment_only.v4`, catalog compiler `5.0.0`, and D-200 `8.0.0` remain current.

## D-221 — Exact instrument responses attach through the universal result pipeline

**Decision:** Advance the authoring-only attachment chain so D-194, rather than a caller, owns
instrument item-response compilation. `PatientTemplate` advances to `attachment_only.v5`, and the
static `UniversalActionResultAssemblyRecipe` advances to
`universal-action-result-assembly.v2`. The assembly owns exact neutral D-220 instrument
definitions alongside the universal action catalog and other result owners. After D-193 freezes
the complete patient state, D-194 derives the minimized `InstrumentInformationActionHorizon`,
builds and runs the exact D-220 request, and rejects incomplete or context-mismatched response
coverage without fallback.

D-213 advances to compiler `2.0.0`. Its request requires the complete integrity-verified D-220
artifact for the same patient, D-193 output, projection horizon, universal action catalog, and
derived information-action horizon. Each complete instrument response is indexed only under its
exact owning action and becomes an `instrument_item_responses` source in the corresponding result
recipe. D-214 verifies the response and D-220 evaluation before translating it into an encounter
result selector. The complete D-220 response retains contributor, proposition/evidence,
projection, owner, rights, and compiler audit; `PatientInstance` receives only the strict
presentation-safe projection containing identity, action, scale, selected option, respondent,
time, and rights metadata.

The atomic snapshot retains the complete D-220 artifact both at its root and inside the D-213
compile request. Integrity verification requires exact equality and replays the full
D-220 → D-213 → D-214 → D-194 chain. It separately rejects root-audit, nested-audit,
patient-safe-response, and encounter-binding tampering. When the projection horizon has no
instrument target, D-194 still derives and retains one complete empty D-220 artifact; D-213
attaches no instrument source and the patient instance freezes no instrument response.

This advances catalog compiler/D-194 to `6.0.0` and D-200 to `9.0.0`. The same exact algorithm is
verified in outpatient psychiatry, emergency department, inpatient psychiatry, and
consultation-liaison. A care-setting label grants no instrument, action, service, staff,
capability, formulary item, or disposition; D-219 remains the separate exact-location operational
admission authority. D-221 neither selects nor spends a D-201 optional-complexity module.

D-221 adds no real instrument definition or item text, total score, cutoff, validation claim,
interpretation, clinical rule, action cost, point value, persistence migration, generalized
runtime generation, or UI. Rights-reviewed instrument content and any scoring or interpretation
remain separately reviewed dependencies.

The focused D-220-through-D-221 gate contains 118 passing tests: D-220 16, D-213 13, D-214 8,
D-194 32, D-200 13, D-219 22, and runtime-boundary 14. Coverage includes minimized-horizon
isolation from treatment fields, a nonzero D-201 `totalSpent` preservation proof, omitted and
duplicated instrument owners, a valid-but-crossed D-220/D-213 owner chain, incomplete-owner
blocking, empty attachment, four-setting equality, and nested/root/patient/binding tamper
rejection.

## D-222 — Operational resources require explicit assignment to one selected location

**Decision:** Add a standalone authoring-only compiler that projects operational resources for one
exact selected location without reading the compatibility runtime's facility-wide unions. A
versioned `clinic-location-resource-assignment-horizon.v1` belongs to one exact ClinicState and
contains exactly one `selected-location-operational-resource-assignment.v1` record for every built
clinic location. Each assignment pins its location version and exact upgrade/formulary
identity-content-version-fingerprint references. Each upgrade owner separately declares whether it
is `exclusive_location` or `shared_locations`. The horizon is an assignment owner, not a clinical
rule, purchase transaction, availability answer, or runtime grant.

Compiler `1.0.0` accepts the exact `ClinicState`, `FacilityDefinition`, selected
`LocationDefinition`, complete clinic-wide assignment horizon, minimized upgrade owners, and
formulary owner references. Before projecting anything, it requires the clinic and facility to
agree on identity and tier; the facility and clinic to contain the selected location; the horizon
to cover every built clinic location exactly once; the selected assignment to pin that exact
location version; and any selected-location department to be both built by the clinic and allowed
by the facility.

An assigned upgrade contributes only when its exact owner exists, the clinic owns the upgrade,
equipment ownership separately confirms equipment, the exact facility allows it, the facility
tier is permitted, and any required department is the selected location's built department. Every
assignment reference must match the current owner's identity, content version, kind where
applicable, and deterministic fingerprint. An `exclusive_location` owner cannot appear at more
than one location; `shared_locations` is the only explicit multi-location mode. Staff IDs must
agree with staff-kind upgrade assignments. Exactly one clinic-owned automation configuration must
exist per assigned staff owner, remain within its eligible information-action horizon and maximum,
contain no duplicate action, and not overlap an automatic action assigned to another staff owner.
An assigned formulary must have an exact current owner, be owned by the clinic, and exactly match
the formulary grants of valid upgrades assigned to that location. The selected location's baseline
formulary must also have an exact owner.

The artifact retains the location's baseline capabilities, only valid assigned upgrade
references, effective capabilities, effective formulary references, valid staff contexts,
itemized incomplete-coverage diagnostics, normalized input, exact fingerprints, and deterministic
replay. Clinic-global capabilities, formularies, staff, equipment, and upgrades that were not
explicitly assigned to that location cannot leak into the result. External verification requires
the same exact current clinic, facility, location, complete assignment horizon, upgrade-owner
horizon, and formulary-owner horizon; a stale or fabricated owner grant cannot verify. The same
algorithm applies to `outpatient_psychiatry`, `emergency_department`,
`inpatient_psychiatry`, and `consultation_liaison`; the setting name itself grants nothing.

D-222 is exported only through `@psychsim/engine/authoring`. It is not attached to D-219, D-194,
D-200, a patient or encounter instance, a runtime queue, or persistence. It chooses no service or
fulfillment method and contains no action correctness, clinical rule, patient fact, purchase cost,
point value, probability, reimbursement, or D-201 complexity field. A later bounded checkpoint
must translate one complete exact D-222 artifact into D-219's minimized operational inputs before
runtime multi-setting generation can be considered.

The focused D-222 gate passes 37 tests: 23 direct compiler tests plus 14 runtime-boundary tests.
They cover all four care settings, full built-location coverage, explicit exclusive/shared
assignment, exact version/fingerprint owner references and current-owner verification,
facility/location/department context, upgrade/equipment ownership, facility allowlists and tiers,
duplicate/invalid/overlapping staff automation, formulary ownership and grant parity,
global-resource isolation, deterministic order/replay, tamper/cross-context rejection, strict
forbidden-field rejection, and authoring-only export. The combined D-220-through-D-222 file gate
contains 141 tests and remains pending the root combined run.

## D-223 — One authoring orchestrator owns the complete pre-finding patient-state pass

**Decision:** Add a standalone authoring-only orchestrator that runs the already reviewed D-201
through D-208 boundaries exactly once from one strict request. Compiler `1.0.0` accepts one exact
optional-feature selection request, one condition-source plan, one pre-finding core
`ResolvedPatientState`, explicit reaction-history ownership, and the exact typed reaction,
prior-treatment, and exposure bridge inputs required by the complete D-201 candidate horizon.

D-201 remains the sole optional-module selector, cost owner, and budget spender. The orchestrator
runs it once and injects the resulting complete artifact into every applicable child. When the
candidate horizon contains no comorbidity module, condition state must use required-only D-196.
When any comorbidity candidate is present—even if unselected—condition state must instead pass
through D-202 so the full optional-condition horizon remains auditable. The optional-feature and
condition requests must share one exact normalized template and seed.

A present `allergy_reaction`, `prior_treatment`, or `substance_use` candidate lane requires its
exact D-205, D-206, or D-207 typed bridge input. Each bridge runs even when that lane selected
nothing, preserving its complete null-materialization artifact rather than collapsing absence of
an optional contribution into documented none, treatment-naive, or nonuse. Reaction-history
ownership is an explicit request field: a reaction candidate horizon requires
`optional_alternative_default`; a horizon without one requires `core_locked`.

D-208 receives the genuine condition source and every required typed bridge plus the unchanged
D-201 artifact. A composed result freezes the complete pre-finding patient state. A D-202 literal
condition conflict or selected unsupported `other` module yields a fully audited
`not_composed` result. Neither path rerolls selection, refunds the optional budget, removes a
selected complication, or silently falls back to core state. Exact costs, stable draws, selection
ordinals, `totalSpent`, and `remainingBudget` remain unchanged across all child artifacts.

The artifact retains normalized input, deterministic D-202 and D-208 request identities, every
root and nested child audit, exact input and payload fingerprints, and deterministic replay.
Integrity and external-context verification reject root or nested tampering, crossed same-ID
template, seed, profile, typed horizon, or core payloads, incorrect reaction ownership, and
already-populated or non-budget-only complexity envelopes. The same orchestration algorithm and
single D-201 accounting model apply to `outpatient_psychiatry`, `emergency_department`,
`inpatient_psychiatry`, and `consultation_liaison`; the exact care setting remains part of the
template fingerprint but adds no setting-specific branch or grant.

D-223 is exported only through `@psychsim/engine/authoring`. It is not attached to D-200, the
catalog compiler, runtime queue generation, persistence, or UI. It adds no real patient/module
content, clinical rule, treatment behavior, point value, score, probability, prevalence,
reimbursement, action availability, or second complexity authority.

The focused D-223 gate passes 28 tests: 14 direct orchestrator tests plus 14 runtime-boundary
tests. Coverage includes required-only zero selection, unselected comorbidity and typed lanes,
mixed-pool single accounting, literal conflict and unsupported `other` preservation, missing or
unexpected lane inputs, explicit reaction ownership, complexity-envelope guards, exact crossed
context and tamper rejection, deterministic replay and ordering, and all four care settings.
Typecheck, lint, Prettier, and diff checks also pass.

## D-224 — Operational admission consumes one exact selected-location resource artifact

**Decision:** Replace D-219's caller-supplied location/resource projections with one complete
integrity-verified D-222 artifact. D-219 compiler `2.0.0` derives the selected physical location,
care setting, effective capabilities, explicitly assigned staff, and exact effective formulary
references only from that artifact. A care-setting label, facility-wide capability union,
clinic-owned-but-unassigned upgrade, neighboring location, or staff automation configuration
cannot independently grant access.

D-222 compiler `2.0.0` fingerprints each formulary owner by stable ID, content version, and exact
medication membership. Labels and medication ordering remain neutral; changing membership changes
the fingerprint. D-219 independently receives the complete effective formulary definitions needed
for medication evaluation and requires their owner fingerprints to match D-222 exactly. It does
not accept an extra, missing, stale, or same-ID/version-but-different-membership formulary.

D-194/catalog compiler `7.0.0` and D-200 `10.0.0` retain the full historical D-222 → D-219 chain,
but activation also requires an independently supplied validation-only current resource context.
That current context is recompiled against the current clinic, facility, exact full location
payload, assignment horizon, upgrade owners, and formulary membership. It never enters
`PatientInstance` or `EncounterInstance`. Historical snapshot verification remains self-contained;
current activation cannot validate itself from the artifact it is checking.

The same algorithm applies to outpatient psychiatry, emergency department, inpatient psychiatry,
and consultation-liaison. D-224 adds no real non-outpatient owner, queue behavior, selection,
clinical rule, cost, point, probability, persistence migration, or D-201 complexity operation.
Incomplete operational coverage blocks attachment of that encounter but remains an itemized
coverage result rather than patient invalidity or a reroll.

## D-225 — D-200 accepts one D-223 orchestration root, not a parallel D-208 root

**Decision:** Finding-pipeline composer D-200 advances to `11.0.0` and replaces its direct root
`ResolvedPatientStateCompositionArtifact` with one complete
`PreFindingPatientStateOrchestrationArtifact`. D-200 first runs native D-223 integrity, then derives
the nested D-208 artifact for D-197, D-198, D-210, D-193, and D-194. The D-208 artifact remains
nested where downstream provenance requires it; callers cannot submit a second parallel root.

A valid D-223 `not_composed` result with no downstream request returns the established typed
patient-state blocker while retaining D-201 selection, spend, and native conflict IDs. D-200 does
not call D-201, D-196, D-202, or D-208 and never rerolls, refunds, or selects an optional module.
Both D-200 input and payload fingerprints bind the complete D-223 identity, input fingerprint,
payload fingerprint, and status. Legacy direct-D-208 roots, obsolete D-223 versions, crossed
sources, and nested or retained tampering fail schema, integrity, or deterministic replay.

The authoring snapshot retains D-223; presentation-safe `PatientInstance` and `EncounterInstance`
do not. Care setting continues to flow through the exact template/location chain without branching
or granting resources. D-225 adds no real module/profile content, runtime generation, persistence,
points, probability, clinical rule, or additional complexity authority.

## D-226 — Template/location admission is a complete current-context matrix

**Decision:** Add an authoring-only `PatientTemplateLocationAdmissionMatrix` compiler before
patient selection or D-223 orchestration. Its request owns one exact current clinic, facility,
complete built-location definition set, assignment horizon, operational owner catalogs, template
horizon, focused action horizons, universal action/result assemblies, and D-219 owner catalogs.
The compiler runs D-222 exactly once per built location, then evaluates every patient-template ×
built-location pair.

An admitted cell requires an exact versioned `compatibleLocationRef`, the same explicit care
setting, the template's exact action horizon and universal assembly, a complete D-222 resource
artifact, and a complete D-219 operational admission artifact. A compatible reference to an
unbuilt location is neutral. A same-ID stale version is reported and never auto-upgraded.
`not_declared_compatible` is a normal matrix result. Missing dependencies, incomplete resources,
and incomplete operational coverage remain itemized authoring diagnostics; a template with no
currently admitted location is not automatically malformed, clinically unwinnable, or deleted.

The same compiler and status model cover outpatient psychiatry, emergency department, inpatient
psychiatry, and consultation-liaison. Context determines which templates can present and which
actions are mechanically available; setting names and facility labels grant nothing. The matrix
selects no patient or queue slot, performs no random draw, runs no clinical policy, and spends no
D-201 complexity. A later selector may choose only from admitted cells and then run D-223 once;
queue distribution, per-location slot policy, Endgame weighting, save migration, and real
non-outpatient content remain separate decisions.

## D-227 — Operational admission fingerprints only minimized clinic state

**Decision:** Add the strict derived `clinic-operational-context.v1` projection and make it the
only mutable clinic-state input retained by D-222 and D-226. It contains the clinic identity,
facility identity and tier, built location and department IDs, owned upgrade and equipment IDs,
staff automation configurations, and owned formulary IDs. These are the only current ClinicState
fields read by selected-location resource admission.

The projection deliberately excludes the clinic label, active location, facility-wide capability
union, current and lifetime points, Endgame/debug flag, satisfaction, and satisfaction multiplier.
Changing any excluded field leaves the projection and admission artifacts unchanged. Changing an
operational ownership, location, department, staff, formulary, facility, or tier field changes the
projection fingerprint and fails current-context verification against an older artifact. Endgame
must materialize real locations and ownership; its debug flag cannot grant operational access.

`projectClinicOperationalContext` is a pure compatibility-boundary projector. D-222 and D-226
request/artifact schemas accept and retain only its strict output, so a full ClinicState or an
excluded field cannot silently re-enter the authoring audit. Set-like arrays normalize
deterministically, while duplicate automatic staff actions remain intact so D-222 can diagnose
invalid configuration rather than sanitize it.

This advances D-222 to `3.0.0`, D-219 to `3.0.0`, D-194 to `8.0.0`, D-200 to `12.0.0`, and D-226
to `2.0.0`. It changes no ClinicState save schema, save version, patient or encounter projection,
resource ownership, queue policy, clinical rule, probability, point, economy calculation, or
D-201 complexity selection/spend. The same minimized operational boundary applies to outpatient
psychiatry, emergency department, inpatient psychiatry, and consultation-liaison.

## D-228 — A caller-bound admitted cell is D-200's only historical operational root

**Decision:** Add one authoring-only admitted-template/location binding between the complete D-226
matrix and D-200. The caller supplies an exact `admissionEvaluationId`; the binding compiler makes
no choice, draw, weighting, pool decision, or queue decision. It first verifies the D-226 artifact
and its independently supplied current matrix request, then requires that exact cell to be
diagnostic-free, `admitted`, and backed by one complete D-219 artifact.

The compact binding retains the D-226 matrix identity and input/payload fingerprints, the selected
cell identity, patient pool as copied audit metadata, care setting, exact full template and
location payloads, their D-226 fingerprints, and the complete selected D-219 → D-222 chain. The
full matrix is not copied into every binding. Standalone integrity verifies every retained
crosslink; external context verification is the only operation that may claim the binding still
belongs to a caller-supplied current matrix.

D-200 advances to `13.0.0` and retains this binding as an orthogonal root beside D-223. The
downstream catalog recipe can no longer supply parallel template, location, or historical D-219
payloads; D-200 derives them from D-228 and requires the exact full D-228 template to equal D-223's
orchestration template. The independently supplied current selected-location resource context
remains separate so a historical binding cannot validate its own current resource access.

This closes the structural flow `D-226 admitted cell → D-228 binding → D-223 once → D-200/D-194`
for outpatient psychiatry, emergency department, inpatient psychiatry, and
consultation-liaison. It does not select a patient, decide facility-wide versus per-location
queues, weight settings or templates, filter lifecycle modes, derive a seed, persist a slot,
activate runtime generation, add clinical content, assign points or probabilities, or spend the
D-201 complexity budget. Those policies require explicit later decisions.

## D-229 — Generated-patient slots belong to exact physical locations

**Decision:** Every generated-patient slot belongs to one exact versioned physical location. Its
eligible horizon is every and only mechanically admitted D-226 cell for that location. A
clinic-hub patient list may later aggregate location-owned frozen slots for convenience, but it is
a projection rather than a global queue and cannot change a slot's owner, setting, formulary, or
resource context. Later capacity upgrades attach to individual locations.

Normal progression begins with outpatient-clinic locations. Emergency-department, inpatient, and
consultation-liaison patients become eligible only after their real locations and operational
owners are built through progression. Endgame and local Developer may broaden their explicitly
loaded template horizons, but every candidate remains bound to and tagged with its exact
location/setting. A mode label never grants resources: full unlock must materialize concrete
locations, assignments, formularies, services, and other owners before D-226 can admit a cell.
Endgame remains approved-only; Developer may include its explicitly loaded review horizon under
the existing lifecycle rules.

D-229 is the authoring-only proof for this decision. The caller supplies an exact slot coordinate,
the current D-226 artifact/request, and one selected evaluation ID. Compiler `1.0.0` verifies
current D-226 context, resolves the exact built location, enumerates a unique sorted exhaustive
local admitted-candidate horizon, rejects an empty horizon or cross-location selection without
fallback, and nests one D-228 binding for the selected local cell. D-200 advances to `14.0.0`,
retains D-229 as its sole slot root, and derives template, location, and historical D-219 through
the nested D-228 proof.

D-229 performs no selection draw, weighting, repeat suppression, seed derivation, refill,
reroll, persistence, UI projection, point/probability calculation, or complexity spend. Those
remain separate decisions. The existing CaseBlueprint compatibility runtime and
`FacilityDefinition.patientSlotCount` remain unchanged until a dedicated migration; this decision
must not silently redistribute its legacy facility-wide slots.

## D-230 — Local template selection uses explicit positive game mass and soft repeat suppression

**Decision:** Select one template only after D-226 has materialized the current eligible horizon
and D-229 has defined the exact physical-location slot coordinate. A separate versioned
`LocationTemplateDistributionProfile` pins the exact location payload and assigns a positive
relative `gameSelectionWeight` to each eligible exact template version/fingerprint. This mass is
question-bank distribution policy, not clinical prevalence, treatment probability, evidence
strength, points, difficulty, complexity, or reimbursement. Extra profile entries outside the
current upstream-filtered horizon contribute no mass; every current local candidate must have one
exact matching entry.

D-230 normalizes only mutually exclusive D-229 candidates at that exact location. It uses one
deterministic 64-bit draw substream keyed by the root seed, exact location, and slot-coordinate ID.
Request IDs, profile ordering, active-slot ordering, weight magnitude, and unrelated locations do
not alter the draw value. Exact integer selection mass and the raw 64-bit draw avoid making a
positive but highly suppressed candidate unreachable through coarse random buckets.

Repeat suppression is local and soft. A candidate receives the active-waiting multiplier once if
the same stable template ID is already waiting in one or more other slots at that location, and
the bounded recent-completion multiplier once if that stable ID appears within the configured
newest-first local history window. Match counts remain visible but do not exponentiate either
factor. Active suppression is stronger than recent suppression; both multipliers are positive and
below one, so neither can eliminate a candidate. Suppression never matches name, complaint,
patient pool, diagnosis, seed, wording, or lexical similarity. Cross-location history is rejected.
The local repeat snapshot is frozen when the slot is filled and later queue activity does not
invalidate the waiting patient.

`LocationTemplateSelectionArtifact` retains the base weight, both configured/applied suppression
factors and match counts, exact effective integer mass, normalized draw probability, stable draw,
selected candidate, compact distribution/repeat input, and complete nested D-229 → D-228 proof.
Compiler `1.0.0` verifies the current D-226 context before drawing; its external context verifier
replays the whole decision against a caller-supplied current matrix. D-200 advances to `15.0.0`
and accepts D-230 as its sole slot-selection root, preventing a parallel caller-selected D-229
seam.

D-230 is mode-free and authoring-only. Lifecycle/progression filtering and real location/resource
materialization occur upstream; D-201 complexity selection occurs only after the template draw.
D-230 does not assign the patient-instance seed, decide capacity, refill/reroll/persist a slot,
grant resources, define a queue projection, assign points, or activate runtime generation. Those
remain later boundaries. The existing compatibility `patientSlotCount` remains unchanged.

## D-231 — Mode horizons are explicit lifecycle lanes before operational admission

**Decision:** A pure authoring-only `ModePatientTemplateHorizon` compiler materializes the sole
template input to D-226. Normal/standard and Endgame accept the explicit approved lane only;
Developer accepts that same approved lane plus a separately supplied explicit review lane. The
lanes are strict: approved-lane payloads must have lifecycle `approved`, review-lane payloads must
have lifecycle `review`, one stable template ID may pin only one exact content version across the
horizon, and blueprint, draft, deprecated, or wrong-lane content is rejected. Inclusion is
controlled by lifecycle, not `medicalReviewStatus`; rule-level medical review remains an
independent clinical boundary.

D-231 does not filter by setting, location, patient pool, diagnosis, prior run/completion history,
points, distribution weight, complexity, or downstream dependency coverage. Endgame and
Developer labels grant no locations or resources. D-226 remains responsible for exact
built-location, resource, action-horizon, and result-assembly admission and for retaining
diagnostics for lifecycle-eligible but incomplete templates. Normal begins outpatient through its
real operational context; later settings become admitted only when concrete owners are built.
Developer “unrun” behavior remains later queue and persistence policy.

D-226 removes its parallel raw `templates` array and consumes one complete verified D-231 artifact
as its sole horizon, preventing lifecycle bypass. D-231 and D-226 artifacts remain authoring-only;
selected patients retain the existing compact matrix proof, and a future queue root owns mode.
The proof-chain versions are D-231 `1.0.0`, D-226 `3.0.0`, D-228/D-229/D-230 `2.0.0`, and D-200
`16.0.0`. No save, capacity, refill, history, patient seed, point, clinical probability, resource
ownership, runtime generation, or UI behavior changes.

## D-232 — Location capacity and facility transitions use separate atomic proofs

**Decision:** Patient-slot capacity belongs to a separate versioned
`LocationPatientSlotCapacityProfile`, never to `LocationDefinition`, the D-222/D-226 operational
context, distribution weights, clinical points, or the D-201 complexity budget. A profile pins one
exact location and declares a positive base capacity plus explicit versioned capacity-upgrade
contributions. The compiler consumes only the relevant capacity-upgrade ownership and exact
per-location assignments. It materializes stable coordinates from the location and each base or
upgrade authorization; adding another predeclared capacity contribution therefore adds
coordinates without changing existing coordinate identities.

D-230 remains the deterministic local template-draw root. A compact D-232 certificate verifies
that D-230's caller-supplied coordinate was one of the exact authorized coordinates for that
location. D-200 advances to `17.0.0` and requires this certificate as its sole capacity
authorization for the retained D-230 coordinate. The certificate does not replace D-230, grant a
clinical resource, select a template, assign points, or spend complexity.

Facility replacement uses a separate versioned `FacilityLocationSuccessorProfile`, not fields on
facility or location definitions. It pins the exact source and target facility projections and
maps occupied source locations to explicit same-setting successors. A pure migration compiler
checks every frozen waiting slot against current target capacity and the current D-226 matrix. It
preserves the complete patient payload, patient seed, resolved values, exact template
version/fingerprint, historical D-230/D-232 selection, and source generation provenance. It
assigns one free verified successor coordinate and attaches a fresh D-228 binding from current
target D-226 admission without rerunning D-230, D-201, or patient generation.

The move is atomic. If any occupied source location lacks a successor, target capacity is
insufficient, or the exact frozen template is not currently admitted at its successor, the entire
move is blocked with itemized diagnostics. No patient is partially moved, deleted, overflow-sliced,
silently routed to the first compatible location, or regenerated. Completed attempts are outside
the migration.

This checkpoint is authoring-only. `FacilityDefinition.patientSlotCount`, SaveData v5,
`PatientQueueState`, the compatibility `queue.ts` implementation, facility purchasing, capacity
upgrade content, persistence, refill/reroll, Developer run history, app UI, and runtime generation
remain unchanged. Those surfaces require explicit later migrations rather than treating this
proof as already active gameplay behavior.

## D-233 — Empty location slots use one atomic, seed-authorized patient fill

**Decision:** Each progression mode owns a private persisted patient-generation root. One exact
location-owned capacity coordinate owns a monotonically increasing `fillOrdinal`. An empty-slot
attempt derives a template-selection seed only from the generation-root authority, mode, exact
location/version/fingerprint, exact coordinate, and ordinal. D-230 alone consumes that seed. The
exact selected template ID/version/fingerprint is then added to the same stable coordinates to
derive one domain-separated patient-generation seed.

The patient-generation seed is the sole seed authority for D-223 optional-feature and condition
selection, D-197 condition findings, D-198 background findings, optional D-199 weighted findings,
D-193/D-194 finding and catalog compilation, optional D-217 structured-source selection, and the
final `PatientInstance`. Request IDs, occupancy artifact IDs/fingerprints, unrelated slots, input
ordering, weight magnitudes, point values, prose, and file order are excluded from seed entropy.
The complete occupancy and repeat snapshots remain attached for audit and current-context replay,
but they do not contaminate the seed.

`LocationPatientSlotOccupancySnapshotArtifact` is compact and nonrecursive. Full frozen D-200
waiting slots enter only the authoring compile input; occupied output rows retain exact compact
D-200, patient, template, and D-233 references. A native generated patient must remain on the exact
mode and physical coordinate that authorized it. A facility move must use its separate verified
migration boundary rather than relabeling a generic occupancy row.

An empty-slot fill is immutable and atomic. The compiler fills only the first empty coordinate in
canonical capacity order. A successful D-200 compile proposes one complete frozen waiting patient
and changes only that coordinate from empty to occupied. A deterministic D-200 error or literal
same-scope finding conflict records an exact replayable blocker, proposes no patient, leaves the
coordinate empty, and still advances `nextFillOrdinal` by one. It never retries internally.
Another attempt is explicit and therefore receives new seeds. When several coordinates are empty,
the caller fills them individually; each later authority sees earlier occupied assignments in its
frozen location-local repeat context.

D-200 advances to `18.0.0` and accepts `PatientSlotFillSeedAuthorityArtifact` as its only slot root,
replacing parallel caller-supplied D-230 and D-232 artifacts. The facility-move compiler advances
to `2.0.0` and preserves the complete historical D-233 authority alongside the unchanged frozen
patient while attaching current target proof.

This remains an authoring proof. It does not migrate SaveData v5 or the compatibility queue,
commit proposals to browser persistence, decide the occupied-to-completed-to-empty lifecycle,
update completion history, define normal versus Developer refresh, activate runtime generation,
or change points, complexity, clinical probability, or UI behavior. Those transitions require
their own versioned checkpoint.

## D-234 — Completion, refresh, and refill are explicit location-slot transitions

**Decision:** Recording one generated attempt whose final event is the exact named
`EncounterCompleted` event creates a completion proof before its occupied location slot is
vacated. The proof retains the complete frozen waiting
patient and a strict bridge around the complete opaque encounter payload. The payload must be
losslessly JSON-safe and canonical; the bridge binds the exact attempt, waiting slot, patient
instance, and terminal `EncounterCompleted` event. That envelope is an authoring bridge rather
than a claim that the compatibility
`CompletedAttempt` schema can represent generated patients; a native generated-attempt contract
must replace it before SaveData/runtime activation.

Completion advances one mode- and location-local ordinal and prepends one completion record to the
distribution profile's bounded newest-first history. Repeated stable template IDs remain repeated
so D-230 can expose the actual match count while applying recent-repeat suppression only once.
That history explicitly names the exact current occupancy, so an older occupied patient cannot be
combined with newer completion history and completed again. The exact occupied coordinate becomes
empty without changing its next fill ordinal. Refill then
uses ordinary D-233 attempts in canonical first-empty order. A successful earlier refill remains
committed in the proposed chain; the first blocker remains empty with its consumed ordinal and
stops the chain. A later caller may continue only by retaining the exact deterministic transcript
and explicitly naming that blocked request as an authorized retry boundary; the next attempt
therefore starts from the blocker-advanced occupancy with a new ordinal and new seeds.

Normal/Standard has no skip or rerandomize command: a waiting patient remains until the encounter
is completed. Endgame and local Developer may explicitly refresh occupied coordinates within one
exact selected-location snapshot; each displaced patient receives a skipped record but does not
enter completion history. Developer may also rerandomize one occupied coordinate only under the
same exact template ID, content version, and fingerprint, with no fallback. These authoring
commands do not decide whether a later UI refresh control operates across several locations; a
future persistence/orchestration owner must invoke one exact location transition at a time.

Developer completion separately updates exact-version run history. A stable ID/content-version
pair may have only one fingerprint. Ordinary Developer selection excludes exact admitted versions
that are completed globally or currently waiting at the exact reconciled location, recomputes that
horizon after every fill, and may reach an explicit exhausted no-op after earlier successes
without consuming another ordinal. Same-template rerandomization supplies a one-member constraint
and must target the canonical first vacancy after removal. Standard and Endgame retain the full
admitted horizon. This eligibility overlay is applied before D-230 weight normalization; D-230
still owns only the deterministic relative-mass draw and cannot infer run history.

Every reconciliation pins one exact caller-supplied mode generation root across every
pre-transition active and retained-history patient, one current admission matrix containing the
exact location and location fingerprint, and one distribution profile across ordinary and
explicitly retried attempts. Retained completion history requires unique patient, attempt,
terminal-event, and proof identities and replays the nested D-200 patient and bridge proof before
use. The bounded transcript permits at most 64 authorized blocker retries in addition to the
location's at most 64 successful fills.

The resulting versions are D-230 selector `3.0.0`, D-233 seed authority `2.0.0`, D-233 atomic fill
`2.0.0`, D-200 composer `19.0.0`, facility-move migration `3.0.0`, and D-234 transition and refill
reconciliation `1.0.0`. Occupancy and D-232 capacity/certificate remain `1.0.0`. All are
authoring-only. This decision does not migrate SaveData v5, activate the compatibility queue,
persist a generated attempt, add UI controls, start an app server, change clinical rules or
points, or authorize real non-outpatient runtime content.

## D-235 — Generated encounter completion uses one native replayable attempt

**Decision:** A generated patient is completed through the separate
`GeneratedCompletedEncounterAttempt`, never through the legacy `CaseInstance`-based
`CompletedAttempt` or D-234's temporary opaque JSON envelope. The D-235 compiler derives one
compact `GeneratedEncounterReplaySnapshot` from the exact verified D-200 waiting slot. It retains
the complete frozen `PatientInstance` and `EncounterInstance`, exact slot/location and source-audit
references, and the minimized information-action fulfillment fields needed to replay purchases.
It does not copy the recursively large D-200 authoring chain into the browser-shaped attempt and
does not accept a parallel caller-authored patient or encounter.

The native attempt owns exact purchased result/service/fulfillment snapshots, editable diagnosis
selections, V2 regimen-entry-targeted medication transitions, interventions, disposition, final
submitted snapshots, and one contiguous event sequence. Exactly one start precedes all actions,
exactly one submission precedes one point report and one settlement, and one matching
`EncounterCompleted` event is terminal. Purchases and treatments must belong to the frozen
encounter horizons; regimen operations must target exact existing entries; diagnosis IDs must
belong to the exact frozen family horizon; and the final selections must equal the event-replayed
state. The current diagnosis check explicitly records `family_identity_only`; severity and
specifier qualifier validation remain a later typed owner rather than being inferred from labels.

The attempt also stores one trace row for every exact compiled-rubric rule, explicit balance
references where available, component totals, cap, safety consequences, database-plan comparison,
all-points expenses and settlement, mode banking behavior, engine versions, and deterministic
replay/payload fingerprints. D-235 verifies trace references, combination status, totals, expense
arithmetic, payout floor, and bank arithmetic. It does not pretend that current caller-supplied
point balance or service prices were independently derived: the record carries explicit
`provisional_balance_snapshot`, `supplied_unverified_quote_snapshot`, and
`arithmetic_verified_pricing_unverified` labels until those native owners are attached.

Wall-clock persistence metadata is separate. A
`GeneratedCompletedEncounterAttemptPersistenceRecord` adds `completedAt` and its own record
fingerprint without changing clinical replay identity. D-234 completion proof advances to v2 and
embeds the exact native attempt, cross-verifying it against the retained occupied waiting patient
before vacancy. Both D-234 compilers advance to `2.0.0`; the D-235 compiler begins at `1.0.0`.

This decision remains authoring-only. It does not migrate SaveData v5, union generated attempts
into compatibility saves, change IndexedDB, activate generated queues or automatic Standard
refill, expose hidden patient/rubric data through Developer or portable Reviewer exports, change
clinical rules or points, add UI, or authorize real non-outpatient runtime content. Those require
a separate explicit persistence/runtime migration.

## D-236 — Generated persistence is deferred until one real native vertical exists

**Decision:** The D-193-through-D-235 authoring chain proves deterministic mechanics but does not
yet justify a SaveData migration or browser activation. SaveData v5, IndexedDB, the compatibility
`PatientQueueState`, compatibility `CompletedAttempt`, and clinical-ticket export v7 remain
unchanged. Generated attempts must not be unioned into those compatibility structures, and an
empty placeholder SaveData v6 would create a second persistence subsystem before it has a real
consumer.

The readiness audit found several concrete blockers:

1. The medication-regimen and decision-policy catalogs do not yet contain one real reviewed native
   route. The existing MDD dossier has approved qualitative material, but no file-backed typed
   route/policy adapter currently compiles it.
2. No one exact approved template has the real finding-generation profiles, source-report
   behavior, universal action-result recipes, and lawful instrument definitions it actually
   needs.
3. D-235 validates caller-supplied provisional point and price snapshots. Native balance and
   service-quote owners do not yet derive those values.
4. Diagnosis validation is family-only; any selected vertical that needs severity or specifier
   qualifiers must add the exact typed horizon first.
5. The generated patient chain does not yet freeze the resolved launcher/opening and historical
   debrief presentation needed for play and review.
6. A `FrozenGeneratedWaitingSlot` and D-234 history retain recursive private authoring audits.
   They are not an acceptable browser-save or portable-review shape.

The next bounded work is therefore database-first: materialize the already reviewed, point-free
MDD initial-medication route and decision policy with exact medication identities and typed action
anchors. Then supply the exact real generation, balance, pricing, diagnosis, presentation, and
review-projection owners required by that one outpatient vertical. Only after one complete
deterministic seed/replay/score/settlement path passes hidden-state boundary tests should a
separate SaveData version be designed.

That future migration must preserve valid v5 compatibility data without rewriting its nested
attempts, keep generated roots/slots/ordinals/history/attempts in a separate private lane, normalize
rather than duplicate recursive history, fail closed on malformed saves, and compile a minimized
one-way review/export snapshot that excludes unrevealed patient truth, raw rubrics and predicates,
private provenance, seeds, and authoring audit graphs. Real ED, inpatient, and
consultation-liaison activation remains later still, behind concrete location and resource owners.

## D-237 — The first native MDD route compiles from explicit topical owners

**Decision:** The first real point-free native decision vertical is the already reviewed focused
adult MDD initial-medication decision. One explicit medication class contains exactly the five
currently reviewed identities—sertraline, escitalopram, fluoxetine, bupropion, and mirtazapine.
One focused route requires exactly one start from that class and exactly one total medication
start. One decision policy pins that route. These records reuse the accepted CANMAT contribution
and Dustin Rowland Developer opinion; they do not add citalopram, psychotherapy, a severity
branch, a point value, or a claim that the five-medication set exhausts the guideline.

A regimen route now links explicitly to the approved diagnosis-owned qualitative rule that
supplies its stance, concern, and certainty. The authoring-only adapter verifies the diagnosis
owner/version and rule review, expands only versioned medication-class memberships, and emits the
coarse exact action-horizon candidate consumed by D-191. It never parses compatibility tags,
labels, aliases, or prose. A class or membership that is missing, stale, or unreviewed cannot
silently fall back to a tag.

The route's recursive count-aware `MedicationRegimenTransitionPredicate` remains the canonical
submission meaning. A separate pure evaluator proves that one reviewed start matches while zero,
two, or a nonmember start does not. The D-191 action predicate is only a discovery anchor; it does
not replace cardinality, assign points, or decide treatment quality. Unsupported lossy action
anchors fail rather than being approximated. The catalogs and adapter remain excluded from Player
and portable Reviewer runtime entries.

This checkpoint does not migrate the dossier's treatment-triggered history prerequisites because
their compatibility predicates still combine legacy tags with trigger-versus-fulfillment
semantics. It does not add native balance, service pricing, patient generation, SaveData,
IndexedDB, UI, or runtime activation. Those are later exact owners.

## D-238 — Provisional points are owned separately and derived natively

**Decision:** A reviewed qualitative decision rule never owns its point magnitude. The
runtime-excluded `decision_balance_catalog` maps one exact, versioned `DecisionRuleReference` to
one separately versioned provisional game-balance record. Retuning that record changes neither the
medication route nor the decision policy. Missing balance remains an explicit unbalanced trace;
a stale, ambiguous, wrong-rule, or unreviewed target fails closed.

The first balance record maps the D-237 MDD route to the `medication_selection` component and the
approved dominant-primary-route starting band of `+200`. That number is a provisional PsychSim
balance choice grounded in the accepted Developer opinion and D-151/D-156/D-173 design policy.
CANMAT supports the qualitative treatment set but did not supply the point value. A separate
attachment step decorates the normalized route candidate before D-191 compilation; the route,
class, and policy files remain point-free.

The authoring-only native point compiler resolves every compiled rule's exact balance reference.
For a balanced medication-regimen route it evaluates the complete canonical transition predicate,
not the coarse action-discovery anchor. Exactly one reviewed start therefore earns `+200`; zero
starts, a nonmember, or two starts do not trigger the route and earn zero from it. The database
plan is evaluated through the same algorithm against an explicit, frozen reference treatment and
that reference selection is retained in point-report v2. The compiler does not maximize over
possible treatments or infer points from stance, concern, certainty, tags, labels, prose,
complexity, or evidence strength.

D-235 advances to compiler `2.0.0`: callers now provide the exact balance/regimen catalogs and
database-plan treatment, but cannot provide trace rows, components, match state, point magnitudes,
caps, safety IDs, or database-plan totals. The compiler folds the submitted events, invokes the
native scorer, and then performs its existing arithmetic/replay checks. Rules with no balance
owner still produce an auditable zero-point `unbalanced` row. The first slice supports one
balanced primary medication route; secondary-rule combination, explicit contraindication
suppression, native diagnosis/information scoring, and a future matched-zero trace status remain
separate exact-policy work rather than inferred behavior.

This decision does not add native service pricing, alter the payout formula, migrate SaveData or
IndexedDB, activate queues, expose hidden authoring state, add UI, generate a real patient, or
authorize non-outpatient runtime content.

## D-239 — Generated information purchases use native versioned service quotes

**Decision:** The existing versioned `ServiceDefinition` records remain the sole price owners; no
parallel pricing catalog is added. D-219 remains deliberately price-neutral and proves only the
exact action-to-service relationship and mechanically available fulfillment methods. A separate
authoring-only D-239 compiler joins the exact full service-owner subset to that verified
operational artifact, requires ID/content-version and costless-topology equality, and freezes the
normalized full price owners needed by the encounter.

A generated information-purchase command now contains only its purchase ID and information-action
ID. Callers cannot choose a fulfillment method or supply a label, operating cost, external savings,
or staff savings. The native compiler intersects D-219 availability with D-222's exact
action-specific staff configuration, requires available methods to have equivalent quality,
selects the lowest operating cost with stable method ID as the tie-break, and derives the complete
quote. External savings compare the selected method with the cheapest available outside-referral
method. Staff savings compare a selected staff method with the cheapest available nonstaff method.
Missing, stale, topologically drifted, unavailable, or unequal-quality owners fail closed rather
than producing a zero-cost fallback.

Replay snapshot v2 retains the exact normalized service owners, their fingerprints, and each
action's action-specific available method horizon. Purchase snapshots use
`native_versioned_service_quote.v1`; integrity replay recalculates every quote and rejects changed
method, label, cost, or savings. D-235 advances to compiler `3.0.0`, generated attempt v2, and
settlement v2. Settlement remains honestly mixed:
`arithmetic_verified_information_pricing_native_treatment_pricing_unverified` records that
information expenses are native while treatment charges, base reimbursement, challenge bonus,
satisfaction input, and bank-before values remain separate unverified inputs.

This mechanical game-economy checkpoint adds no clinical judgment, does not change whether an
investigation is correct, and spends no encounter complexity budget. It remains available only
through `@psychsim/engine/authoring`; it does not migrate SaveData, IndexedDB, queues, review
exports, runtime generation, or UI. Native treatment-service charges remain a later bounded task.

## D-240 — Duration and burden use an exact target-scoped projection owner

**Decision:** Clinical duration and subjective burden remain typed records on the complete
`ResolvedPatientState`. They are neither canonical findings nor D-212 whole-lane source reports.
A standalone authoring-only projection compiler now routes those already-frozen values through
one exact information action without changing patient truth.

One static definition owns exactly one value kind and semantic owner, one target-definition
selector, one patient-scene source kind, one time scope, and one exact information-action payload.
A duration definition pins its `durationProfileId`; a burden definition pins its ordinal scale ID
and content version. Definitions never accept patient-specific condition, finding, proposition,
duration, or burden record IDs. Several definitions may feed one action, and one frozen record may
explicitly feed different actions, but the same action cannot receive the same record through
overlapping definitions.

Target multiplicity is explicit. No exact target is `not_applicable`; one target without the
required typed value is `missing_required_value`; more than one condition or proposition instance
matching the definition is `ambiguous_target` until a real use case justifies a closed qualifier.
The compiler never silently aggregates those instances or adds a general expression language.

Every complete evaluation retains a full authoring projection and an explicit
record-to-frozen-value binding. The authoring projection preserves raw target identity, source
instance, time scope, duration profile/option or ordinal scale, and exact values. Its separate
future-player-safe reveal preserves patient, action, definition, source identity/time, opaque
value identity, and the displayable typed value, while omitting raw condition/finding/proposition
targets, related diagnosis, threshold interpretation, criterion, generation resolution, and
wording. All cross-links and the exact action fingerprint replay deterministically.

A neutral `ResolvedPatientState` normalizer now supplies canonical ordering to independent
authoring compilers; D-240 does not depend semantically on D-212/D-215 merely to fingerprint
patient state. This checkpoint adds no real projection definition, MDD threshold, diagnosis
inference, source behavior probability, point rule, optional-complexity spending, D-213/D-214
attachment, PatientInstance field, persistence, runtime activation, review export, or UI.

## D-241 — Target-scoped values attach through one safe universal-result source

**Decision:** The verified D-240 owner now participates in the deterministic authoring pipeline
without changing patient truth or exposing its hidden target audit. The static
`universal-action-result-assembly.v3` owns exact target-scoped projection definitions only.
Catalog compiler D-194 `9.0.0` runs D-240 after D-193 findings and deferred finding-scoped records
have produced the final normalized `ResolvedPatientState`.

D-213 `3.0.0` accepts the complete nullable D-240 artifact and adds one closed
`target_scoped_patient_value_reveals` source class. It integrity-replays D-240, requires the exact
patient and action payloads, and routes only the frozen target-redacted reveals. The authoring
projection and raw condition/finding/proposition selectors never become result sources.
Definition-level coverage remains visible: `not_applicable` is neutral when another declared
source resolves, while `missing_required_value` or `ambiguous_target` makes the action incomplete.
One complete definition therefore cannot mask a missing or ambiguous definition for the same
action. A recipe that silently omits an owned target-scoped definition fails even when its current
target is not applicable.

D-214 translates only referenced in-horizon frozen reveals into strict encounter selectors and
attaches them to `PatientInstance`; each attached reveal must be bound exactly once. Complete
outside-horizon authoring audit remains available only inside the nested D-240 artifact. A neutral
information-action fingerprint module prevents a D-213/D-240 import cycle. The attachment contract
advances to `attachment_only.v6`; D-200 advances to `20.0.0` and retains the whole chain through
its existing exact catalog-snapshot replay rather than adding a parallel D-240 root.

This checkpoint adds no real duration/burden definition, patient wording, diagnosis threshold,
clinical association, source probability, scoring rule, point magnitude, D-201 complexity cost,
SaveData, persistence, runtime generation, review export, browser behavior, or UI.

## D-242 — Native scoring freezes the complete selected encounter decision

**Decision:** Native generated-attempt scoring must distinguish an action that was available in the
encounter horizon from an action the player actually selected. One strict point-free
`GeneratedEncounterDecisionSelection` therefore records unique purchased information-action
identities, the final submitted diagnosis selections, and the final treatment selection. Repeat
purchases remain separate events and expenses but have one presence-semantic action identity in
the decision snapshot.

The player decision is derived only from successfully replayed and natively quoted purchases plus
the final diagnosis and treatment events. A caller cannot supply it. The reference input becomes
one explicit `databasePlanDecision`; the former treatment-only field is removed rather than
retained as a second authority. Empty information, diagnosis, and treatment selections remain
valid. Both decisions are checked against the exact frozen information, diagnosis, medication
start, regimen-entry operation, intervention, and disposition horizons.

A separate selected-action matcher evaluates the existing closed `DecisionActionPredicate`
targets against the complete decision. Exact regimen-entry operations remain independently
targetable even when several entries contain the same medication; medication-identity operation
predicates may match any exact entry with that identity. D-191's existing action-horizon matcher
continues to answer availability, while this matcher answers selection. Neither performs clinical
inference, tag matching, probability, or scoring.

The D-237/D-238 native route still reads only `treatmentSelection`, so all current route matches
and point totals remain unchanged. Native decision balance advances to `2.0.0`, D-235 generated
attempt compilation advances to `4.0.0`, and the nested point report advances to
`generated-encounter-point-report.v3`. The outer attempt remains v2 because its top-level shape is
unchanged. This prepares—but does not implement—the later trigger-versus-fulfillment prerequisite
adapter.

This checkpoint adds no prerequisite rule, MDD presentation content, new point row or magnitude,
diagnosis scoring, treatment charge, persistence activation, compatibility migration, runtime
queue, browser behavior, or UI.

## D-243 — Treatment-triggered information prerequisites preserve trigger and fulfillment separately

**Decision:** A prerequisite that becomes relevant because of a selected treatment cannot use one
action predicate to mean both “the trigger exists” and “the required information was obtained.”
The point-free `DecisionTriggeredInformationPrerequisite` therefore stores an exact
`triggerWhen` predicate and an exact `fulfillmentWhen` predicate. Triggers cannot be information
actions; every fulfillment target is an information action; and the D-191 `actionWhen`
availability/discovery anchor must exactly equal the fulfillment predicate. The closed-v1
contract also stores the originating policy ID/version and focused-decision ID and requires one
non-null typed patient predicate.

This first closed contract is limited to diagnosis-owned `prerequisite` rules. D-191 advances to
`3.0.0`, preserves the normalized pair plus exact policy scope in every compiled rule and
fingerprint, and includes such a rule only when both trigger and fulfillment targets exist in the
exact encounter horizon and the retained policy scope equals the policy being compiled. The
reverse index remains keyed by the fulfillment/action anchor, then checks policy and trigger
availability, so semantic full scan and index discovery remain equivalent. Horizon matching still
means available, not selected.

D-242's frozen decision supplies the separate selection-time evaluation. The pure evaluator
returns `not_triggered`, `fulfilled`, or `omitted` and retains independent trigger-selected and
fulfillment-selected Booleans. Buying the information without selecting the trigger is
`not_triggered`; merely having the information action available never makes it fulfilled.

One authoring-only adapter can now losslessly map an already-approved diagnosis rule whose
selection trigger is exactly `anyMedicationStarted` and whose target is one information action.
It verifies the approved diagnosis, policy, and primary-route pin; requires the compatibility
patient-scope tag to equal that policy's focused decision; then emits the route's exact non-null
typed patient predicate and retains the policy identity/version plus focused-decision identity
rather than emitting the tag. The approved MDD medication-reconciliation and
allergy/adverse-reaction rules pass this adapter. The antidepressant/mania rule remains rejected
because its compatibility medication tag is not an exact reviewed native medication class and
must not be inferred.

The adapted prerequisites have no balance owner and remain explicit `unbalanced` zero-point rows
in native scoring. D-243 does not assign fulfilled bonuses, omission penalties, safety caps, or
clinical consequences; change D-235 or point-report versions; alter the existing `+200` MDD
route; or activate persistence, runtime generation, compatibility content, review export, browser
behavior, or UI.

## D-244 — Triggered-information balances own three explicit outcomes

**Decision:** A treatment-triggered information prerequisite may receive points only through a
separate exact balance owner. The qualitative diagnosis rule, its D-243 trigger/fulfillment pair,
and its policy scope remain point-free. The balance catalog now uses a strict union: the existing
matched-rule shape remains unchanged, while a
`triggered_information_prerequisite` balance owns explicit `notTriggered`, `fulfilled`, and
`omitted` outcomes.

`notTriggered` must be exactly zero. `fulfilled` must be positive and name its provisional D-156
impact band. `omitted` must be negative and name its band. Evidence certainty does not calculate
either magnitude. Each record still points to one exact approved qualitative rule version and at
least one accepted Developer opinion; the accepted treatment-triggered-history opinion now
targets the two new balance records without changing its clinical interpretation.

The initial approved MDD any-medication-start prerequisites use the existing provisional tuning:
medication reconciliation is `+35` when fulfilled and `-25` when omitted; allergy/adverse-reaction
history is `+30` when fulfilled and `-40` when omitted. Their component is `workup`. The primary
one-first-line-antidepressant route remains separately `+200`. Consequently, the reference
decision with one eligible medication plus both histories is `265`; one medication with neither
history is `135`; reconciliation only is `195`; reaction history only is `205`; both histories
without a medication start contribute `0`; and two medication starts with neither history score
`-65` because the primary route fails while both any-medication prerequisites still apply.

Every generated point row now retains a nullable structured prerequisite evaluation with the exact
three-state status and independent trigger/fulfillment Booleans. Balanced fulfilled and omitted
rows use generic `applied` status; balanced not-triggered rows use `not_triggered`; an unbalanced
qualitative prerequisite can still preserve its three-state audit at zero. Native balance advances
to `3.0.0`, D-235 generated-attempt compilation to `5.0.0`, and the nested point report to
`generated-encounter-point-report.v4`. D-235 recomputes the prerequisite state and selected targets
from the frozen decision and rejects tampering.

Schema, attachment, content validation, scoring, and replay reject shape-crossed, stale, dangling,
or ambiguous balance ownership. The authoring compiler still receives the validated balance
catalog as input; it does not yet persist a canonical payload fingerprint sufficient to
independently rederive historical magnitudes. That exact-catalog identity boundary is a recorded
pre-runtime persistence task, not a claim of D-244.

This checkpoint adds no antidepressant/mania mapping, alternative fulfillment, safety cap,
safety-consequence ID, secondary-contributor combination, SaveData migration, persistence/runtime
activation, compatibility content, review export, browser behavior, or UI.

## D-245 — Native generated scoring applies D-159 once after rule evaluation

**Decision:** Native generated scoring evaluates every exact compiled rule independently, then
applies the already-approved D-159 combination pass to both the player decision and the
database-plan decision before any component or total is calculated. Combination reads only frozen
compiled metadata, pre-combination points, and canonical selected action targets. It never derives
clinical meaning from point magnitude, prose, file order, or evidence hierarchy.

Rules sharing a non-null `effectId` use highest `specificityPriority`; current compilation rejects
equal-priority ambiguity, while the stable exact-rule-ID tie-break remains deterministic recovery
behavior. An applied negative row sharing a non-null `issueId` with another applied negative keeps
only the worst consequence. A true `contraindicated` rule suppresses positive primary-route,
fit, response, tolerability, prior-trial, and regulatory-alignment rows only when they share the
same canonical exact selected treatment target. Serious nonabsolute risks remain visible negative
contributors and do not erase legitimate benefits.

For combination, broad medication-start targets become the exact selected medication starts.
Broad or medication-identity regimen-operation predicates become exact selected
regimen-entry/operation targets, so duplicate current-medication entries remain independently
addressable. Triggered-information prerequisites retain their authored trigger and fulfillment
targets because those are a separate audit, not treatment-fit suppression input.

Every row remains in the trace with its pre-combination points, applied points, resolution status,
direct controller trace ID, plain-language combination explanation, exact selected targets, and
any D-244 prerequisite subtrace. A controller may itself later be suppressed or deduplicated; the
direct deterministic chain is valid and replayable. D-235 rejects missing or changed selected
targets, extra noncompiled source rows, and any status, controller, point, or combination drift.

Native decision balance advances to `4.0.0`, D-235 generated-attempt compilation to `6.0.0`, and
the nested report to `generated-encounter-point-report.v5`. The implementation uses synthetic
secondary rules only. It adds no real clinical contributor, point magnitude, score cap, settlement
input, persistence/runtime activation, compatibility content, browser behavior, or UI. Exact
canonical balance-catalog payload identity remains the recorded pre-runtime persistence task.

## D-246 — First-real-MDD readiness is audited from existing owners, not a second status system

**Decision:** Before authoring a real MDD patient template, inspect the exact D-223 and D-200 input
graph against checked-in canonical content. Record the result in the existing general-dependency
ticket and `docs/ENCOUNTER_GENERATION_DEPENDENCIES.md`. Do not add a manually synchronized
readiness schema, completion percentage, parallel truth store, or runtime dependency merely to
describe missing content.

The audit confirms that real reusable content currently reaches the approved MDD diagnosis rules,
five-medication initial route, decision policy, provisional route/prerequisite balances, native
information-service pricing, native player/database-plan decision and combination mechanics, and
shared identity catalogs. It does not yet form an executable generation graph. Every
`PatientTemplate`, complete core pre-finding patient state, condition/background/tendency
generation profile, finding projection recipe, universal action-result assembly, source-report
profile, and complete player-facing presentation used by the end-to-end D-200 proof is synthetic
test data or absent.

Compatibility MDD cases and reviewer scenarios are not substitutes. They hard-code medically
unreviewed, mostly case-local results and cannot be promoted into reusable generation content.
The first absent executable owner is therefore a real `PatientTemplate`, but that template cannot
be authored coherently before its exact general inputs exist. The first clinical review
dependency is an MDD episode finding/cardinality owner, preceded by a canonical
finding-identity-completeness review. Existing content does not authorize generation
probabilities, severity thresholds, source-report accuracy, incidental abnormality rates, action
relevance, result values, or new point magnitudes.

D-246 adds no schema, compiler, clinical claim, patient, rule, point value, persistence, runtime
activation, browser behavior, or UI. A future readiness projection is justified only if it can be
derived lazily from canonical owners and changes a concrete review decision more efficiently than
the current ticket/dependency audit.

## D-247 — Symptoms are atomic owners; diagnoses compose them declaratively

**Decision:** Treat the developer's “database entry as a function” description as an ownership and
compilation metaphor, not as executable code in content. Every symptom or other independently
resolvable patient fact receives the smallest reusable declarative owner that is useful to the
game. A diagnosis then references those exact versioned owners through reviewed composition data,
and pure deterministic compilers turn the selected condition state plus separately owned encounter
inputs into frozen patient state.

The first MDD completeness pass adds identity-only owners for increased appetite, indecision,
worthlessness, self-reported psychomotor agitation, and separately observed psychomotor agitation
and slowing. Existing owners already cover depressed mood, anhedonia, fatigue/low energy, reduced
appetite, insomnia, hypersomnia, excessive guilt, concentration difficulty, self-reported
psychomotor slowing, passive wish for death, and active suicidal ideation. Weight and BMI already
belong to the typed measurement catalog and must not be duplicated as outcome-valued symptoms.
Later subjective weight change or longitudinal weight trend requires its own typed relationship or
value owner rather than inference from one measured value.

Do not add a second generic “symptom function” framework or a parallel diagnosis-cluster truth
store. `FindingDefinition` remains the atomic identity boundary, `MeasurementDefinition` remains
the numeric boundary, and `condition-finding-cardinality` remains the intended diagnosis-to-finding
compilation lane. A content change propagates to future compilation through explicit versioned
references and validation; it never mutates a frozen historical patient or lets prose, aliases, or
file order drive behavior.

The encounter recipe still owns location, focused decision, and the optional-feature complexity
budget. The MDD dossier remains setting- and intensity-neutral. Location controls operational
admission; complexity selects separately budgeted optional modules; neither is hidden inside a
symptom definition or used to alter what MDD means.

The first real MDD profile remains disabled pending one narrow clinical decision. Related
manifestations such as insomnia/hypersomnia, appetite directions, self-reported versus observed
psychomotor change, worthlessness/guilt, concentration/indecision, and death/suicidality may need to
count as diagnosis-level dimensions while retaining separate backend facts. D-197 v1 selects raw
finding members and must not silently double-count mutually exclusive or criterion-equivalent
manifestations. Add a narrow dimension-with-manifestations extension only after the reviewer
approves the grouping and cardinality semantics.

D-247 adds six medically unreviewed identity shells and updates catalog membership. It adds no MDD
criterion, required symptom, cardinality, severity threshold, generation weight, source-report
behavior, background probability, diagnosis inference, wording, points, treatment rule, patient,
persistence, runtime activation, browser behavior, or UI.

## D-248 — Diagnosis dimensions count once; manifestations remain separate

**Decision:** Extend the existing D-197 condition-to-finding lane with one disorder-general
`condition-finding-dimensions.v1` profile. A reviewed profile selects a total number of
diagnosis-level dimensions, enforces one or more nonoverlapping reviewed core/cluster constraints,
and then selects one or more concrete manifestations inside each selected dimension. The
dimension—not each manifestation—counts toward the profile's diagnostic cardinality. Every
selected manifestation still emits its own exact D-193 candidate and retains its source modality,
finding identity, proposed value, draw, provenance, and review trace.

This is a narrow extension of the existing condition-finding compiler, not a second symptom
database, diagnosis engine, probability model, or general expression language. Required exact
outcomes remain available outside the dimensional set. Dimension-count, dimension-selection,
manifestation-count, and manifestation-selection weights are positive game-authoring variety
weights only. They are not prevalence, diagnostic probability, evidence strength, case points, or
clinical importance. Selection requirements may not overlap in v1; this keeps feasibility
deterministic and legible while covering required core sets and cluster minima. A later diagnosis
that genuinely needs coupled overlapping constraints requires a focused reviewed extension rather
than hidden inference.

The frozen artifact preserves all selected and unselected dimensions and manifestations, total
dimension count, every core/cluster requirement evaluation, all stable draws, exact
condition/profile binding, emitted candidates, and fingerprints. Integrity and exact-context
replay use the same pure selector. Multiple manifestations can therefore explain the patient
without inflating the number of diagnostic dimensions.

The reviewer also accepts subthreshold texture as optional encounter richness that may consume a
small positive amount of the encounter-owned D-201 budget. Core symptoms and the supra-threshold
diagnosis profile never spend that budget. No texture-module bridge or real texture distribution
is activated in this decision; authoring must first define its exact module owner and background
finding mapping so one feature cannot be charged twice or compete with a hard diagnostic
candidate.

Pessimism receives a medically unreviewed atomic finding identity because it may be reusable
across diagnoses and safety/fit questions. This decision does not declare pessimism, hopelessness,
passive death wish, or active suicidal ideation to be an MDD core criterion or merge those
constructs. `source-request.mdd.current-episode-dimensions` and the linked clinical ticket now own
that evidence and reviewer question. No real MDD profile, diagnostic threshold, severity mapping,
generation probability, point value, patient, runtime behavior, persistence change, or UI change
is added.

`docs/DATA_ADJUNCT_EVIDENCE_QUEUE.md` supplies a durable priority view for the read-only evidence
adjunct. Canonical question/status data remains only in `source-needed.requests.json`; the adjunct
returns evidence useful for emulation, never clinical rules, judgments, IDs, or points.

## D-249 — Optional finding texture spends once and replaces only its generic background baseline

**Decision:** Add one typed authoring-only `finding_texture` optional-module lane between D-201
and the existing D-193 finding resolver. D-201 remains the sole selector and complexity spender.
A reviewed `OptionalFindingTextureBridgeProfile` maps an exact selected module to one or more exact
versioned finding outcomes. The bridge reuses the module's original selection ordinal and stable
draw, copies the unchanged selected-count/spend/remaining-budget audit, and emits only
`background_variation` candidates. It performs no second draw and assigns no probability,
prevalence, diagnosis meaning, evidence strength, or points.

D-208 `2.0.0` retains each selected texture module as materialized by its exact emitted candidate
IDs while leaving the pre-finding patient's `canonicalFindings` empty. D-223 `2.0.0` builds and
replays the bridge exactly once. D-200 `21.0.0` replaces the ordinary D-198 baseline candidate only
for the same exact finding-definition ID/version, then passes the resulting collision-free union
to D-193. D-197 diagnosis/cardinality candidates keep their higher priority, so optional texture
cannot override a hard diagnosis-owned value. The first narrow version rejects a selected exact
texture outcome that also has an applicable D-199 weighted tendency for the same finding; a later
review must define intentional combination rather than letting file order or hidden arithmetic
choose.

This checkpoint uses synthetic fixtures only. It adds no real MDD mapping, texture frequencies,
clinical claim, case, patient, point rule, persistence, runtime activation, browser behavior, or
UI. The MDD dimension packet still gates the first real diagnosis profile and any real
subthreshold-texture distribution.

## D-250 — Longitudinal weight change is not inferred from one weight or BMI measurement

**Decision:** Keep `measurement.anthropometric.weight` and `measurement.anthropometric.bmi` as
numeric point-in-time owners. Add separate medically unreviewed finding identities for current
unintentional weight gain and current unintentional weight loss. A diagnosis profile may later
reference either directional finding as a manifestation only after clinical review; it may not
infer longitudinal change from one measured value, body habitus, appetite direction, label text,
or a free clinical tag.

The two directional findings remain distinct because the underlying patient truth and future
explanations can differ, while a diagnosis-level appetite/weight dimension may count either one
only once. A future structured amount, time window, or observed-versus-reported discrepancy must
use the existing target-scoped duration/measurement/projection boundaries rather than being packed
into the identity shell.

D-250 adds identity and registry membership only. It assigns no criterion role, threshold,
generation rate, complexity cost, source-report behavior, point value, treatment implication,
patient, runtime generator, persistence change, browser behavior, or UI.

## D-251 — Preliminary evidence packets may shape scaffolding but remain non-executable

**Decision:** A versioned PsychSimDataAdjunct packet does not have to be final before it is useful.
An explicitly preliminary packet may identify a reusable owner, a missing schema distinction, a
dependency edge, a candidate bin, a source-registration task, or a narrowly framed review
question. PsychSim may implement that neutral authoring scaffold while the evidence packet is
still evolving.

Preliminary status is a hard activation boundary, not a weaker kind of medical approval. A
preliminary packet cannot supply a diagnosis-to-finding mapping, source-report or patient
generation probability, qualitative clinical rule, balance record, point magnitude, runtime
content, or clinical winner. Its prose is not copied into gameplay. Exact source identity,
corrections, locators, access and reuse rights, target freshness, and source-use decisions remain
subject to the ordinary canonical translation pass.

The existing two-stage compiler boundary enforces the executable side of this decision. Matching
unreviewed candidates remain outside the compiled rubric and create nonblocking coverage
diagnostics. A compiled rubric may contain only approved qualitative rules, and an unreviewed
qualitative rule cannot receive a provisional balance. Therefore preliminary evidence can expose
what the database must be capable of representing without silently turning an evidence scout into
points.

D-251 adds one regression at the rule-to-balance boundary and documentation only. It adds no
clinical claim, probability, qualitative rule, point value, patient, runtime behavior,
persistence change, browser behavior, or UI.

## D-252 — Generated point reports freeze the exact balance payload they use

**Decision:** A generated attempt cannot rely on balance ID and content-version discipline alone.
Before native scoring, compile one minimized `DecisionBalanceCatalogSnapshot` from the validated
authoring catalog and exact compiled rubric. The snapshot fingerprints the complete source catalog
but retains only balances referenced by that rubric. Every retained balance preserves its exact
rule reference, component, impact band, point magnitude or three prerequisite outcomes, and
player-facing explanations.

The snapshot deliberately omits authoring rationale and Developer-opinion records. It is
historical point ownership, not a duplicate clinical-rule catalog or a public authoring endpoint.
The compiled rubric continues to own clinical meaning, trigger, scope, certainty, provenance, and
combination metadata. An unbalanced reviewed qualitative rule remains in the rubric and trace but
does not fabricate a balance snapshot row.

Native scoring derives both player and database-plan traces from the frozen snapshot. The point
report retains both complete traces and derives the database-plan total from its trace. Integrity
replay checks every balanced row's exact component, pre-combination magnitude, and explanation
against the snapshot before applying D-159 combination and arithmetic. Reordering the authoring
catalog is semantically inert, while changing a balance payload without changing its ID or
content version changes both the full-catalog and minimized-payload fingerprints.

Native decision balance advances to `5.0.0`, D-235 generated-attempt compilation advances to
`7.0.0`, and the nested report advances to `generated-encounter-point-report.v6`. D-252 does not
activate SaveData, IndexedDB, generated runtime queues, portable exports, or historical
re-scoring. It adds no clinical rule, probability, point magnitude, patient, settlement behavior,
browser behavior, or UI.

## D-253 — The unit gate uses Vitest threads and content-derived queue counts

**Decision:** Run Vitest with its thread pool. The long deterministic finding-pipeline audit can
keep a fork worker busy beyond Vitest 3.2.4's fixed RPC acknowledgement window even after every
assertion passes. The thread pool preserves per-file isolation and identical assertions while
allowing the complete Node 22 process to report and exit cleanly. One four-setting admission test
has an explicit ten-second timeout because its ordinary full-suite runtime can exceed the
framework's five-second default under parallel load; production code receives no timeout or
behavior change.

Browser tests that assert the complete Developer source-request queue derive the expected count
from the checked-in source-request file rather than duplicating a stale integer. They still assert
the exact queue size and named high-value requests. Literature-synthesis tests enumerate and parse
all registered formal evidence files in the test boundary, including authoring-only metadata,
without moving those sources into the ordinary runtime catalog. Missing-ticket coverage tests
remove one explicitly active ticket rather than relying on attachment order.

This is test-infrastructure maintenance only. It adds no clinical claim, probability, rule,
balance, point value, patient, runtime content, persistence change, browser behavior, or UI.
