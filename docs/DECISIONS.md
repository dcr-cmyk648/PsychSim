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

Status: accepted. The user-designated `PsychSim documents` Drive folder is discovered only on explicit requests. Account-specific metadata is saved in a local gitignored manifest. New/changed files are pulled, SHA-256 hashed, deduplicated by content, and queued one at a time. Discovery or extraction never edits clinical data directly: it produces provenance-backed claim/change proposals that require human review, affected-case validation, and new content versions.

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
