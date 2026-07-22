# Architecture

## Cross-thread coordination boundary

`PROJECT_STATE.md` is the durable operational resume point between Codex threads. A repository-local standard-library state machine in `scripts/codex_handoff.py` keeps a gitignored lease for one canonical write-capable thread per worktree and fingerprints branch, HEAD, full Git status, and `PROJECT_STATE.md`. Trusted project hooks may block stale prompts and file-writing tools, but they never stage, commit, push, merge, or resolve clinical content. Git remains the cross-clone durability mechanism; the local lease coordinates only threads sharing this worktree. See `docs/CODEX_THREAD_HANDOFF.md`.

## Shape of the system

PsychSim is a static browser application in a pnpm workspace. Zod schemas form the data boundary, JSON content supplies stable reviewed inputs, pure TypeScript produces deterministic state transitions and point-rule traces, React renders those values, and an IndexedDB repository persists versioned saves.

```text
approved JSON catalogs + case blueprint
                 │ Zod parse + reference validation
                 ▼
        content-runtime static bundle
                 │
                 ▼
 seeded instantiation → pure encounter engine → care points → settlement → receipt
                 │                                      │
                 └──────────────── React UI ─────────────┘
                                      │
                               IndexedDB repository
```

## Package responsibilities

`@psychsim/schemas` owns stable IDs, schema/content versions, catalogs, the content registry, per-test generators, structured reference intervals, rule-level review records, patient records, blueprints/instances, declarative predicates, encounter events, point-report/receipt/settlement models, persistent patient queues, local clinical tickets/export bundles, clinic/save/flag data, upgrade definitions, source manifests/documents/chunks, generation provenance, and patient-scaffold requests. Upgrade definitions declare kind, point cost, lifetime/facility/department/prerequisite gates, granted capabilities/formularies, related services, per-use cost metadata, patient-category effects, and player-facing capability labels. The universal information catalog owns neutral menu presentation, SOAP/source metadata, and service references; patient files own structured results, observations, authored pathways, and rule classifications. Types are inferred from schemas except the recursive predicate union.

`@psychsim/engine` owns seeded demographic/finding/test variation, service resolution, effective-formulary calculation, atomic upgrade offers/purchases, persistent queue construction, encounter commands, predicate evaluation, points-only progression overlays, care-point evaluation, economy, receipts, replay, and eligibility. It has no React import, browser global, network call, wall-clock decision, mutable singleton, or runtime AI.

`@psychsim/content-runtime` explicitly imports approved JSON only, parses it at module load, supplies the starting clinic, cross-checks imports and dependency edges against `content/registry.json`, performs semantic reference validation, and executes reference policies. A production build cannot discover arbitrary draft files.

Formal bibliographic metadata is static runtime-safe content under `content/catalogs/evidence/formal`, distinct from private document bytes. A case or medication contribution links a cataloged source to exact target IDs and snapshots the citation plus contribution statement into the rule trace. If no contribution is linked, the engine snapshots `Expert opinion`. This makes historical receipts auditable without bundling copyrighted source text or implying that bibliographic verification equals clinical approval.

`@psychsim/web` owns presentation, transient UI state, accessibility, local Developer tools, and the persistence boundary. It may add real timestamps when saving attempts, flags, and tickets; those timestamps never affect clinical behavior. IndexedDB sits behind `SaveRepository`, allowing migrations or another local adapter later. In development only, a fixed Vite middleware endpoint atomically mirrors a schema-validated ticket bundle to `content/generated/local-review-tickets/tickets.json`; production contains no writable endpoint. Pre-release v4 archives incompatible legacy 0–100 receipts as opaque local payloads rather than pretending they use the new point model.

`@psychsim/content-cli` is developer-side. It implements validation, reference runs, reverse-impact reporting, SHA-256 source scanning, bounded PDF/DOCX/TXT/Markdown extraction, source review listings, controlled patient scaffolding, production-bundle checks, and a before/after ECG ownership economy report. It is not imported by the web app. Extracted records and generation provenance are local and ignored; an intentionally reviewed patient scaffold and its blocking audit tickets can be committed under `content/cases/review`.

## Static content flow

Content moves through `blueprints → drafts → review → approved → deprecated`. Only explicit imports from `content/cases/approved` enter the production bundle. The registry records where content lives, but does not override that allowlist. A validator rejects invalid IDs, predicates, registry paths, finding constraints, missing per-test files, unsafe generation ranges, indicated-action rewards that do not exceed cost, SOAP-boundary violations, pre-submit assessment/answer hints, references, unsafe eligibility, medical-approval claims, insufficient presentation variation, and critical-field variants. A development-only glob import exposes approved plus every schema-valid review patient and companion ticket bundle in Developer mode. A generated review file becomes playable after a development-server restart without changing React code. Compile-time dead-code elimination and explicit forbidden-content scanning keep that module out of production.

The initial prototype has a temporary distinction: its lifecycle placement is approved for bundling and playtesting, while `medicalReviewStatus` remains `unreviewed`. The UI always shows that status. A future clinical approval workflow must add reviewer metadata before content can claim medical approval.

## Deterministic instantiation and replay

`instantiateCase(blueprint, seed, catalogs)` hashes `blueprint ID + seed + stable generator ID`. It resolves only declared choice, catalog-choice, weighted-choice, integer/decimal range, text-template, constrained finding selection, and per-test generators. No arbitrary code and no `Math.random` are allowed. Critical content is copied unchanged. Criteria-bearing finding sets declare minimum/maximum positives and required present/absent IDs. A test definition chooses the highest-priority matching profile from declared age, sex-for-reference, diagnosis, and clinical-tag context. Unspecified numeric values may vary only inside catalog-defined normal or mild incidental ranges and cannot change the rubric. Results retain UCUM units, structured low/high interval bounds, source/population labels, and derived normal/high/low interpretation. The saved CaseInstance stores the internal seed and every resolved value; the UI never displays the seed.

The launcher renders from that resolved CaseInstance—not internal case metadata—so it can show only patient name and chief complaint. Hidden diagnosis/category fields remain content and validation inputs and are never used as player-facing case labels.

Encounter commands return new values and typed `Result` failures. Stable event IDs derive from encounter identity and event order. Purchases contain the exact structured result, fulfillment, and cost. A CompletedAttempt stores the full resolved case snapshot, clinic-at-start, events, purchases, final treatment, rule trace, receipt, content version, engine version through flags, and persistence timestamp. This is sufficient for exact historical replay without regenerating a patient.

## Service, location, and eligibility boundaries

Service definitions enumerate fulfillment methods with costs and capability/location requirements. Resolution unions location and clinic capabilities, filters available methods, and deterministically chooses cost then stable ID. Equipment purchase previews the projected clinic through the same resolver, so store estimates and encounter costs cannot diverge. Eligibility checks compatible location/lifetime points, reachable required workup, a formulary-available accepted start-treatment path, and safe referral/transfer. Existing medications remain available to stop or explicitly continue even when they are not stocked for a new start. Department satisfiability becomes stricter in Milestones 3–4 without changing patient files.

`getUpgradeOffer` is a read-only pure quote. It reports blockers, current/projected service methods, per-use savings, and ceiling-rounded break-even uses. `purchaseUpgrade` re-evaluates the same gates and either returns one validated ClinicState with the exact point deduction and granted IDs or a typed failure with the input unchanged. Purchases never reduce lifetime points, permit debt, or run in practice modes. The browser persists the returned ClinicState through the existing SaveRepository.

The profile persists standard clinic state, mode, and complete resolved queue slots. Calling queue fill twice leaves a Normal patient unchanged; completing the slot retires its chief complaint into a bounded recent-history list before a replacement is generated. Endgame is a pure derived overlay that selects the highest declared facility/location, unions capabilities/formularies, increases approved patient slots, and permits manual refresh. Developer uses the same overlay but a development-only content pool, tracks patient definitions already run, and permits reroll/reset. Practice settlements set `bankedClinicPointsEarned` to zero. Diagnosis metadata remains internal.

Receipt feedback is persisted as `ContentFlag` and `ClinicalReviewTicket`. Guidance snapshots the disputed receipt row and records routing, target/dependency/conflict IDs, whether clinical acumen is required, status, optional resurfacing trigger, and resolution. It is deliberately a proposal queue: browser feedback never edits JSON catalogs or patient files. Developer mode may download the queue or ask the development server to mirror it to one gitignored queue file; that file remains a proposal bundle, not runtime content.

## Local authoring boundary

`content/source-docs` is outside runtime and gitignored. `content:scan` hashes local inbox bytes, records a versioned manifest, identifies exact duplicates by hash, and quarantines unsupported or oversized files without deletion. `content:extract` parses PDF pages, DOCX text, TXT, and Markdown into hashed `SourceDocument`/`SourceChunk` artifacts with page or section context, then retains originals in processed/archive/quarantine. Text is untrusted inert data, extraction is idempotent, and every private artifact remains outside Vite and Git.

A formal publication has a second, tracked representation containing citation metadata only. Known byte hashes can associate a private copy with that entry without committing its text. Source-use records are the third layer: they state whether authority is `formal_publication` or `expert_opinion`, list every relevant formal-source ID, identify target rules, classify the contribution, and summarize how it was used.

`content:draft <request.json>` is deliberately narrower than clinical generation. It requires an explicit runtime template, verified source-document/chunk IDs when sources are cited, a new stable patient ID, an adult age range, and at least ten brief chief-complaint variants. It copies executable mechanics, resets every inherited clinical rule to unreviewed, runs schema/reference/eligibility validation, and emits a review-only patient plus blocking clinical audit tickets. It never interprets source prose or silently converts a claim into a score. `content:compile` validates all Developer patients, while `content:review` lists the local review surface.

The connected Drive folder `PsychSim documents` is a remote discovery inbox. An explicit user-requested scan lists provider metadata and stores it in a local-only manifest. Connector access and local extraction are separate trust boundaries: a Drive file must be downloaded into the protected local inbox before its bytes can be hashed and extracted by the CLI. Sources are handled one at a time for claim and impact review.

The remaining Milestone 7 work adds an optional developer-side provider abstraction, explicit external-send acknowledgment, catalog-constrained clinical drafting, critic/repair passes, policy simulations, and human review. No provider package, source text, prompt, or key belongs in `apps/web`.

## Browser-only limitations

Milestone 2 remains single-device and local-only: no account sync, server recovery, collaboration, public leaderboard, or remote review queue. IndexedDB can be cleared by the browser. There is no anti-cheat, server authority, or protected economy. These are intentional product constraints, not missing backend tasks.
