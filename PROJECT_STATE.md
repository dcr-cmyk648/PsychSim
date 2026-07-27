# PsychSim project state

Last updated: 2026-07-27

## Operational handoff

- Canonical Codex thread: `019f86e1-8867-7143-b2e9-e93d7f25db8b`, generation 1.
- Canonical branch: `beta`, tracking `origin/beta`. Local work stays on `beta` until the user
  explicitly asks to promote the whole branch to `main`.
- Current phase: Milestone 3 is complete. The bounded work is still the pre-Milestone-4
  clinical-authoring, knowledge-database, review, and scoring-engine checkpoint. Do not begin
  departments or longitudinal-care simulation.
- Current checkpoint implements Decisions D-151 through D-158. The current GitHub-safe tree is
  the verified backup checkpoint for `origin/beta`.
- Expected post-checkpoint Git state: clean `beta`, with `HEAD == origin/beta`; `main` and
  `origin/main` remain unchanged unless the user separately authorizes promotion.
- Local Developer server: `http://127.0.0.1:4318/`.
- Local portable Reviewer server: `http://127.0.0.1:4319/`.

Repository history and `docs/DECISIONS.md` preserve completed checkpoint history. This file keeps
only the current operational state and should not grow into a second changelog.

## Active product and engine contract

1. PsychSim is a fast, question-bank-like snapshot: read the stem, buy focused history/exam/tests,
   choose the immediate intervention and disposition, submit, and audit points. It is not a
   comprehensive clinical or longitudinal-care simulator.
2. The patient has a complete deterministic resolved state before play. Buying information reveals
   that state; it never generates a new clinical fact. Hidden facts may still affect treatment fit
   and safety.
3. Patient definitions own focused encounter state and narrow overrides. Reusable diagnosis,
   medication, test, therapy, disposition, evidence, and decision-policy knowledge belongs in
   versioned catalogs. Case-specific rules outrank shared rules only within their stated scope.
4. Points are the only player-facing unit. The primary decision carries most points; distinct
   goodness-of-fit effects are smaller but meaningful; critical errors cannot be outweighed by
   stacked minor bonuses. Default authoring bands are recorded in D-156.
5. Clinical correctness and operating cost remain separate calculations even though both render in
   points. Necessary investigation rewards must normally exceed their cost, encounter payout has a
   zero floor, and encounter expenses do not debit the persistent bank.
6. Diagnosis entry is optional. The engine preserves blank, broad, unspecified, and exact answers
   as distinct concepts. Hierarchy-aware partial credit remains a separate queued task and must use
   explicit reviewed ancestry rather than label or ICD-prefix inference.
7. One broad database-plan treatment route should dominate when possible. Medication-specific fit,
   treatment-triggered prerequisites, interactions, duplicate therapy, adverse reactions, and
   disposition remain separately traceable.
8. Every nonexact treatment result is labeled engine-inferred. Applied, omitted, suppressed, and
   overridden contributors must remain explainable after submission.
9. The personal knowledge database is a first-class learning product. It preserves the developer's
   notes, authored material, formal sources, interpretations, disagreements, staleness, and gaps.
   The game is a focused compiler over reviewed decision-relevant knowledge, not a display of the
   complete dossier.
10. Knowledge coverage is a sparse local-Developer projection, not a completion percentage. It
    preserves `unknown` separately from `missing`, names exact supporting IDs, loads lazily per
    entry, never filters unmatched material, and cannot approve or activate a claim.

## Current implementation checkpoint

- The focused initial-MDD prototype compiles treatment-triggered workup from diagnosis-owned
  qualitative rules:
  - episode/depressive assessment is MDD-specific;
  - starting an antidepressant activates mania/hypomania assessment;
  - starting any medication activates medication reconciliation and allergy/adverse-reaction
    history;
  - substance-use history is broadly rewarded;
  - the resolved passive wish for death keeps detailed safety assessment central.
- A shared exact-same-medication reaction policy reads the frozen pre-encounter patient state.
  Failing to reveal a prior reaction cannot erase its treatment consequence. Only the worst
  matching same-medication reaction policy applies per selected medication, with a separate safety
  trace and optional score cap.
- Current unreviewed MDD reference runs:

  | Run                         |  Care points | Investigation cost | Payout |
  | --------------------------- | -----------: | -----------------: | -----: |
  | Database plan               |          745 |                145 |  1,300 |
  | Equivalent first-line route |          745 |                145 |  1,300 |
  | Shotgun                     |          725 |              7,755 |      0 |
  | Unsafe                      |         -695 |                145 |      0 |
  | Inappropriate ED comparator | capped at 75 |                145 |    630 |

- The dossier compiler projects formal contributions and accepted Developer opinions to every
  explicit target without copying claims or activating runtime behavior. The private projection
  currently covers 206 source documents, 234 deterministic source units, and 91 of 164 public
  catalog entries. Its lexical/semantic links are retrieval aids, not clinical claims.
- Venlafaxine remains the first concrete dossier audit: it is identity-only and medically
  unreviewed, with private-source links and unresolved candidates but no executable rule or point
  modifier.
- Eight formal source records and their source-use decisions cover current FDA
  aripiprazole/clozapine labels, selected clozapine-augmentation literature, and VA/DoD
  schizophrenia metadata. Two accepted `DeveloperOpinion` records preserve the psychiatrist's
  interpretation separately from their supporting or limiting sources. Dose details are retained
  only as authoring context; there is no dose-entry mechanic.
- The public-safe catalog contains 164 records, including 53 RxNorm-verified medication
  identities, 13 runtime-compatible medication definitions, and six identity-only supplements.
  Identity-only records cannot appear in formularies or treatment choices.
- Developer and portable Reviewer encounters include an autosaved case-instance-scoped scratchpad.
  On submission it is preserved with the immutable attempt snapshot. It never enters encounter
  events or scoring.
- The mobile receipt provides a vertical list of choices, costs, applied/omitted point rules, and
  cap/floor reconciliation. Mobile purchased-result dialogs can be reopened without repurchase.
  The main dialog action closes; a smaller action opens Revealed information.
- Developer database review saves one interpretation against an immutable entry-brief fingerprint.
  IndexedDB is authoritative; the local fixed handoff bundle is a mirror. Saved prose never edits
  clinical content directly.
- The diagnosis-classification inspector lazily exposes the local official ICD-10-CM F01-F99 term
  cache for authoring lookup. It does not supply criteria or runtime diagnoses and remains outside
  production bundles.

## Private source and local data state

- The protected source manifest contains 210 entries, 210 unique SHA-256 hashes, zero duplicate
  hash groups, and 210 `extracted` statuses. There are no quarantined source-document failures.
- The protected source tree currently contains 1,324 non-placeholder files totaling 506,933,306
  bytes. It includes 204 Apple Notes composites plus attachments/OCR history, four formal PDFs, two
  private Drive DOCX sources, extracted records, and local manifests.
- The ignored `content/generated/` tree currently contains 20 active authoring/review artifacts
  totaling 2,159,539 bytes: provenance packets, literature-scout snapshots, the human review
  handoff, private knowledge projections, and source-review state.
- The cleanup audit found no exact duplicate or unreferenced GitHub-safe project files. It removed
  only two regenerable test artifacts: the previous Playwright `.last-run.json` marker and the
  E2E-only local ticket handoff. Dependencies and current build output remain because they are
  active local tooling/runtime state and are already ignored.
- Raw sources, extracted text, provider manifests, Apple Notes/Drive identifiers, local review
  handoffs, browser-only feedback, generated private projections, build output, dependencies, and
  secrets are intentionally excluded from Git. The public GitHub repository is therefore a backup
  of code, schemas, safe metadata, accepted concise contributions, tests, and documentation—not a
  backup of the private 507 MB source corpus or unsent browser-local data.
- The tracked `private-source-catalog.json` contains stable source-unit identities, hashes,
  processing-rights state, and concise boundary decisions only. It contains no private source
  prose.
- Four Drive candidates still lack local bytes: the psychotic-depression PDF, QTc/TdP Funk review,
  Pink Book 2021, and Brief Therapy Vignettes. Eight prioritized Apple Notes revisions, six mixed
  SharePoint/residency units, and two other private Drive chunk boundaries remain queued for
  one-topic-at-a-time semantic review.

## Source and review safeguards

- Private source documents and local generated projections never enter Player or portable Reviewer
  bundles. GitHub backup must not override these ignore and source-use boundaries.
- A publication first receives a stable evidence record plus rights/source-use metadata. Any
  target-specific interpretation becomes a review ticket or contribution later; registration alone
  never fills a database field or activates a rule.
- Personal notes begin as Developer opinion. Formal citations remain separate, and a source may
  support or limit an opinion without converting the complete interpretation into a source-direct
  claim.
- Player, portable Reviewer, and local Developer remain separate build boundaries. Production
  imports approved prototype content only; Developer-only queues, private projections, and
  authoring caches must tree-shake out.
- Clinical feedback creates immutable snapshots and tickets. It never mutates a patient, catalog,
  rule, or point value directly.

## Verification

The complete checkpoint passed under Node 22.23.1 on 2026-07-27:

- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, and `git diff --check`;
- `pnpm test`: 51 test files / 378 tests plus 10 Python handoff tests;
- `pnpm content:validate`, `pnpm content:sources:validate`, and
  `pnpm content:diagnoses:validate`;
- `pnpm content:knowledge:crossref` and `pnpm content:knowledge:crossref:validate`;
- `pnpm content:compile`, `pnpm content:evidence`, and `pnpm demo:reference-runs`;
- `pnpm build` with Player bundle-safety scan;
- `pnpm build:reviewer` with portable Reviewer bundle-safety scan;
- `pnpm test:e2e`: five Player/Developer browser tests; and
- `pnpm test:e2e:reviewer`: four portable Reviewer tests at 390-pixel and 320-pixel widths.

One stale E2E balance assertion was corrected from 320 to 350 after the trace proved the intended
arithmetic: 250 starting points + 1,300 encounter payout - 1,200 ECG purchase = 350. No game logic
changed for that correction.

The first clean GitHub runner for this checkpoint exposed a separate test-harness issue:
`reviewer-content.test.ts` completed its finite reference-policy replay in 5.146 seconds, just over
Vitest's default five-second limit. The test now declares a 15-second timeout, matching the other
many-seed/replay tests. Its assertions and runtime behavior are unchanged; the focused test and the
complete 378-test/10-handoff-test suite pass after the correction.

`pnpm content:knowledge:corpus:materialize` was intentionally not used as a generic regeneration
step. An exploratory invocation without an input packet stopped at its mandatory four-part
privacy/authorization gate and changed nothing. That command processes one separately prepared
private semantic packet; it is not a routine build or validation gate. The already materialized
private state and current dossier projection passed their dedicated validators.

## Files to read before continuing

Always read the startup contract files named in `AGENTS.md`. For the current checkpoint also read:

- `docs/DECISIONS.md` through D-158
- `docs/ARCHITECTURE.md`
- `docs/CONTENT_MODEL.md`
- `docs/CONTENT_REVIEW.md`
- `docs/DOCUMENT_INGESTION.md`
- `docs/DIAGNOSIS_ENGINE.md`
- `docs/MEDICATION_AND_INTERVENTION_DATA.md`
- `docs/SCORING_AND_ECONOMY.md`
- `docs/SOURCE_USE_POLICY.md`
- `packages/engine/src/scoring.ts`
- `packages/engine/src/diagnosis-scoring.ts`
- `packages/content-runtime/src/reviewer-policies.ts`
- `tools/content-cli/src/developer-database-knowledge.ts`
- `apps/web/src/components/DeveloperDatabaseKnowledge.tsx`
- `apps/web/src/components/PersonalKnowledgeWorkbench.tsx`
- `apps/web/src/components/ReceiptView.tsx`
- `content/catalogs/authoring/personal-knowledge/cross-reference-aliases.json`
- `content/catalogs/authoring/personal-knowledge/private-source-catalog.json`

## Exact next action

1. Present `Q3` as one bounded engine-design decision: use stable effect and issue keys so a
   more-specific rule replaces only the same effect, distinct fit effects can add, one mistake
   receives only its worst equivalent penalty, critical safety suppresses positive fit for the
   affected intervention, and every suppressed/replaced contributor remains visible in the trace.
   Wait for the user's answer before shaping later workflow decisions.
2. Once Q3 is settled, present the already queued initial-MDD severity/modality packet. Atomize the
   response into the smallest formal contribution, Developer opinion, source gap, balance question,
   or no-change outcome. Any executable change still requires versioning, rule-level review,
   validators, reference runs, and affected browser tests.
3. Later bounded tasks, kept separate:
   - add real broad-category and unspecified diagnosis identities plus explicit reviewed ancestry;
   - harden medication-fit activation so unreviewed modifiers remain inert and true
     contraindications suppress positive fit;
   - continue foundational MDD, medication-family, psychotherapy, and common-interaction review
     packets before narrow augmentation topics;
   - continue private semantic processing one complete topic/source revision at a time;
   - split the private dossier loader into a compact index plus lazy per-entry payloads before it
     approaches the current 2 MB loader ceiling.
