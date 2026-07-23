# Milestone roadmap and gates

Work proceeds one milestone at a time. Completing a gate does not authorize starting the next milestone.

## Milestone 0 — Product and architecture contract (complete)

Delivered: contributor contract; game design; architecture; scoring/economy; content model; ingestion and review designs; roadmap; decisions; repository/command conventions; protected authoring folders.

Gate: documents agree on no virtual time, deterministic browser play, one visible point unit with itemized clinical and financial subcalculations, positive progression, static reviewed content, and source privacy. Root commands and boundaries are discoverable.

## Milestone 1 — First playable clinical vertical slice (complete)

Delivered: strict versioned schemas including rule-level review records; deterministic seeded instantiation; atomic finding sets; one-file-per-test contextual generation with UCUM units and EMR-style reference-interval display; pure encounter/points/economy/service/replay/eligibility/queue logic; starting solo office; one playable medically unreviewed MDD starter case with one broad primary medication-tag pathway plus one review-only engine fixture; a 36-option universal information catalog with immediate case-specific results; searchable structured treatment UI; itemized all-points receipt and full trace; durable Normal/Endgame/Developer queues; local profile/attempt/flag/ticket persistence; reviewer notes, developer ticket triage, automatic fixed-path Codex handoff mirror, and JSON export; content validation; four executable starter policies; unit and Playwright coverage.

Gate: one complete case plays opening-to-receipt; reload preserves profile/attempt/patient slot/tickets; same seed/history is deterministic; tests prove complaint variation, criteria-constrained findings, immediate results, costs, nonrepeatability, negative-test credit, indicated reward above cost, omissions, waste, fit modifiers, alternative paths, discontinuation, dangerous combination, path-specific requirements, zero-floor settlement, service independence, reference ordering, Developer-content isolation, and AI/source bundle isolation; lint, typecheck, tests, e2e, validation, and production build pass.

## Milestone 2 — First clinic-building loop (complete)

Delivered: a data-driven hub store; pure read-only upgrade quotes and atomic purchases; persisted upgrade/equipment/capability/formulary ownership; a 1,200-point outpatient ECG machine with automatic 500-point outside versus 70-point in-house resolution, receipt savings, three-use break-even, and unchanged clinical trace; an 800-point additive outpatient formulary expansion; start-medication filtering by effective location/clinic formulary; a second approved-for-prototype, fictional, synthetic, medically unreviewed ECG-relevant patient; source-use metadata; two sets of four executable policies; catalog/registry/gate validation; before/after economy reporting; unit, component, persistence, and browser coverage.

Gate: purchases are voluntary, reject debt and duplicates atomically, preserve lifetime points, persist after reload, and use declarative facility/prerequisite fields; before/after ECG reference runs have identical 1,140 care points and rule trace while cost changes from 630 to 200 and payout rises by 430; cards show cost, prerequisites, facility/department gates, current/projected methods, per-use savings, break-even, and capability/patient effects; every approved patient validates against the unequipped starter clinic; policy simulations preserve safe external fulfillment and starter-formulary treatment paths. No department construction, decor multiplier, source extraction, or AI drafting was added.

## Milestone 3 — Progression and environment (complete)

Delivered: explicit starter/transitional/advanced patient-pool metadata; a one-slot solo office, two-slot outpatient clinic, and three-slot multidisciplinary center; 2,500/7,500 lifetime-point thresholds with separate 1,800/5,000-point facility purchases; declarative facility locations and allowed purchases; waiting-patient relocation without regeneration; preserved prior equipment/formulary/decor; a separate decor catalog with plant, artwork, and warm-lighting visuals; a rational diminishing-return satisfaction curve capped at 1.15×; store multiplier previews; positive-reward-only ambience settlement; Endgame decor unlocks; and eligibility/validation across complete workup, medication, intervention, disposition, and every compatible facility location.

Gate: unit/component/browser tests prove lifetime eligibility does not grant ownership, balance spending leaves lifetime progression unchanged, facility/decor purchases are atomic, prior ECG ownership survives a move, waiting patients persist while slot count grows, decor visibly persists after reload, diminishing returns remain under the catalog cap, care-point traces remain identical, and unsafe play remains unprofitable. Both approved patients remain available through safe external services at all declared Normal locations; the starter pool remains repeatable. No departments or new clinically inferred patients were added.

## Milestone 4 — Departments and broader services

Scope: outpatient area, ED, consultation-liaison, inpatient; construction; department equipment/cases; disposition capabilities; location-specific formularies.

Gate: case/location validator proves safe workup, acceptable treatment, and safe disposition; department gates are declarative; unavailable global-best treatments always have formulary-safe or referral alternatives; outpatient content persists at later tiers.

## Milestone 5 — Content review and authoring tools

Scope: build on the Milestone 1 proposed-ticket queue with exact attempt replay; review inspector; dependency/conflict and supersession workflows; rubric editing; historical comparison/re-score; JSON bundles; reference-policy simulations and QA reports; generated content indexes.

Gate: historical records are immutable and reproducible; current-engine comparisons are labeled; rubric edits create versions; flag statuses/audit metadata persist; imports are schema/size validated; no unreviewed case silently reaches production.

## Milestone 6 — Source-document ingestion

Status: a bounded local slice was delivered by explicit follow-up after Milestone 2. It includes SHA-256 manifests, exact-duplicate retention, PDF/DOCX/TXT/Markdown extraction, hashed chunks with page/section context, watch mode, quarantine, privacy guards, a one-file-per-formal-source evidence catalog, explicit contribution records, Expert-opinion fallback labels, evidence auditing, tests, and source/review listing commands. Full source review, crash-recovery hardening, claim extraction, and remote-file byte transfer remain open, so Milestone 6 is not complete.

Scope: SHA-256 scan/manifest/duplicates; PDF, DOCX, TXT, Markdown strategy; extraction/chunks; watch; processed/quarantine; provenance; privacy controls; source review.

Gate: idempotence and crash recovery; exact duplicates detected by hash; failures retained; parser versions recorded; malicious/instructional text remains inert; secrets/PHI warnings; raw/extracted/manifest material is ignored and absent from production; no external transmission.

## Milestone 7 — AI-assisted drafting

Status: one non-AI precursor is delivered. An explicit scaffold request can create a playable, medically unreviewed Developer patient from a named template, verified local source references, and controlled presentation variants. It resets inherited rule reviews and emits blocking audit tickets. It does not infer clinical claims, call a provider, perform critic/repair, or approve content.

Scope: provider abstraction and mock; optional explicit external provider; constrained structured single-case draft; critic and repair; provenance; external-send confirmation; deterministic validation and policy bots; human approval gate.

Gate: gameplay works without provider/key; browser has no SDK/key/call; all outputs begin unreviewed; catalogs constrain every ID/unit/route/predicate; transmission requires acknowledgment; provenance/critic/repair preserved; AI cannot approve content; bulk generation remains disabled.

## Milestone 8 — Scale and hospital progression

Scope: larger catalogs and case families; remaining facility tiers; psychiatric hospital/integrated center; owned laboratory/imaging including late MRI; specialties and challenges; broader decor; PWA/performance hardening.

Gate: batch validators and seed/property tests scale; every location/case is winnable; content review throughput is measured; challenge cases are clueable; offline/static performance budgets pass; migrations preserve saves and historical reviews.
