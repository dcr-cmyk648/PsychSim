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
engine does not impose one rigid universal hierarchy on every patient.

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

Status: accepted as a target model; schema implementation remains pending. An authorized
psychiatrist/developer judgment is labeled `Developer opinion` and stored separately in a concise,
versioned form. A later source review may mark a publication as supporting, contextualizing, or
challenging/limiting that opinion, but the opinion does not become a direct guideline recommendation
merely because a source is linked. Where the judgment is more specific or interpretive than the
publication, the provenance remains both the publication relationship and Developer opinion.
This supersedes D-057's assumption that an expert-opinion object can never have a formal-source
relationship; existing `EvidenceContribution` validation remains unchanged until a dedicated
developer-opinion/source-relation schema is implemented.

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

Status: accepted as the generation contract; runtime implementation remains pending. Ordinary
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

Status: accepted as the simpler generation policy; runtime implementation remains pending. A
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

Status: accepted and implemented as an audit surface; D-085's dedicated Developer-opinion
provenance object remains pending. Developer mode derives a searchable list of current rule-level
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

## D-109 — The residency-article aggregate is a private container for dated Developer opinions

Status: accepted as an intake design; no SharePoint bytes or opinions have been imported. The long
aggregate export is one private, hashed `SourceDocument` containing many logical
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
