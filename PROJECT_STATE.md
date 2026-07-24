# PsychSim project state

Last updated: 2026-07-24

## Operational state

- Canonical Codex thread: `019f86e1-8867-7143-b2e9-e93d7f25db8b`, generation 1.
- Current branch while this release unit is being published: `main`, tracking `origin/main`.
- Implementation checkpoint: `220a019` (`Fix mobile reviewer navigation focus`), following the
  portable-review implementation in `ee7aef9` and release-state commit `5605ab2`.
- The implementation tree is clean; this durable-state update is the only follow-up change before
  pushing the WebKit fix to `main`.
- Expected final state for this unit: verified checkpoint on `origin/main`, GitHub Pages deployed
  from that `main` commit, then a clean local `beta` tracking `origin/beta`.
- `beta` is the durable development branch after this release. `main` changes again only after an
  explicit whole-beta promotion request from the user.
- The repository is public and GitHub Pages is enabled at
  `https://dcr-cmyk648.github.io/PsychSim/`. GitHub currently reports the legacy branch source;
  the main-only workflow must still publish the verified Reviewer artifact.

## Current phase and bounded checkpoint

Milestone 3 remains complete. Do not begin departments/Milestone 4. The active work is a
pre-Milestone-4 clinical-authoring and portable-review checkpoint:

1. Preserve the question-bank snapshot model: investigate, choose the immediate intervention and
   disposition, submit, and audit points. Do not add longitudinal monitoring simulation.
2. Keep patient state, reusable diagnosis/medication/test knowledge, focused decision policies,
   and point balance separable.
3. Distribute one finite, explicitly unreviewed Reviewer assignment so a psychiatrist colleague can
   play multiple patients on a phone and return one exact feedback bundle.

## Portable Reviewer checkpoint

- Three web boundaries now exist:
  - ordinary Player: approved-for-prototype root content only;
  - local Vite Developer: review/source/opinion queues plus the fixed workspace writer;
  - portable Reviewer: the two prototype patients plus exactly ten allowlisted review scenarios.
- Reviewer assignment: `reviewer-assignment.common-psychiatry.2026-07`.
- The ten scenarios cover five MDD decision states plus initial GAD, bipolar depression, acute
  mania, schizophrenia relapse, and PTSD. Eight provisional shared policies compile them into the
  current engine. Every case and executable clinical rule is fictional, synthetic, and medically
  unreviewed.
- The assignment uses its own IndexedDB namespace and forced practice clinic. Patient run history,
  attempts, flags, generated tickets, and multiple case/app-experience reviews survive reload on
  the same browser/device/origin.
- Mobile has Patient, Revealed, Investigate, Treatment, and Results/review tabs. Purchased results
  appear immediately in a native dialog and remain in Revealed, newest first by default. The tab
  strip scrolls horizontally without moving the document; the disclaimer no longer overlaps it at
  320 px.
- Route changes have one post-commit instant-scroll owner. Opening a chart focuses its patient
  heading without retaining the prior Hub scroll position; submitting on a phone lands on and
  focuses the Reviewer feedback heading.
- A submitted or historical receipt can be reopened after reload. The feedback box is near the top
  of Results and accepts both case-specific and general app-experience comments.
- Version-5 manual export contains `buildKind`, `assignmentId`, `bundleId`, `engineVersion`, every
  completed attempt, every exact option snapshot for case comments, all flags, and all tickets.
  Attempt-linked feedback is rejected without its historical attempt. Several cases export in one
  file suitable for email.
- There is no remote sync, login, server backup, or bundle import. The reviewer must confirm the
  download before clearing site data or switching devices and must not enter PHI.
- A material cohort or policy revision must bump `REVIEWER_ASSIGNMENT_ID`; never reuse this ID for
  changed reviewer content.

## Content, evidence, and generation state

- The ordinary investigation menu is a shared 36-action catalog; cases own structured immediate
  results and post-submit rules, never answer-hint descriptions.
- Fictional first and last names resolve independently from large curated pools, with a
  deterministic 25% middle-initial chance and more than 10,000 base name combinations.
- Diagnosis-family definitions exist for MDD, bipolar spectrum, GAD, PTSD, schizophrenia spectrum,
  BPD, medication-induced akathisia, and substance-induced mood disorder. The ten-case Reviewer
  cohort exercises only provisional focused policies; it does not establish approved shared
  clinical guidance.
- Source-use decisions remain separate from bibliography, clinical contribution, rule review, and
  runtime inclusion. DSM and WHO CDDR remain metadata-only. The local ICD-10-CM cache remains
  gitignored authoring/search data and never enters the browser bundle.
- DrugCentral remains an authoring-only aggregate seed. No database dump, bulk medication importer,
  or clinical rule was activated.
- The private residency-article aggregate remains pending user export/no-PHI acknowledgment. No
  SharePoint bytes or opinions were imported.
- The next unresolved product decision, after this release unit, is whether the first structured
  medication import uses a curated board-relevant psychiatry allowlist or every U.S.
  psychiatric-labeled ingredient. Present that decision one at a time; do not download DrugCentral
  or implement the importer before it is resolved.

## Review and provenance state

- Receipt traces are categorized and complete. Point-changing rows appear first; zero-point rules
  remain inspectable.
- Receipts show a care-point bar and the player's exact plan beside the declared database-plan
  replay. The benchmark is finite and auditable, not a claim of global optimality.
- Local Developer ticket instructions and attempt reviews save to IndexedDB and mirror to
  `content/generated/local-review-tickets/tickets.json`. The existing human handoff file is still a
  legacy version-3 artifact until the next intentional browser save; do not overwrite it merely to
  modernize it. The current schema/writer/export is version 5. Playwright uses the separate
  `tickets.e2e.json`.
- Portable Reviewer never exposes preloaded local source/opinion/ticket queues or the writer
  endpoint. Reviewer-created guidance, flags, and tickets may be included in the manual export.
- Saving feedback is not clinical approval and is not authorization to edit a rule.

## Verification for the current worktree

Passed locally on 2026-07-24:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`: 20 files, 142 TypeScript tests; 10 handoff tests
- `pnpm content:validate`: catalogs, registry, evidence/source-use, approved/review/cohort content
- `pnpm content:sources:validate`: 5 discovery candidates; 4 local extracted artifacts
- `pnpm content:compile`: 3 local review patients plus 10 portable Reviewer scenarios
- `pnpm content:evidence`
- `pnpm content:diagnoses:validate`: 1,112 local ICD-10-CM terms
- `pnpm demo:reference-runs`
- `pnpm test:e2e`: 4 Player/Developer/Endgame browser tests
- `pnpm test:e2e:reviewer`: 390 px and 320 px Chromium phone projects, including two cases,
  reload/reopen, multiple feedback notes, one exact export, route focus, and scroll reset
- `pnpm build`: explicit Player bundle verification
- `pnpm build:reviewer`: explicit exact-allowlist Reviewer bundle verification
- `git diff --check`

The first GitHub run for `5605ab2` passed all checks except its iPhone/WebKit project, where opening
a chart retained 118 px of the old Hub scroll position. Commit `220a019` moves the reset after React
navigation, makes it instant despite global smooth-scroll CSS, removes competing handler-level
scrolls, and adds destination-heading focus assertions. The local Playwright WebKit 18.5 binary
still cannot launch on this Intel macOS 14.1 host and exits with a pre-page `Bus error`; the next
Ubuntu iPhone/WebKit job is the release verdict. Do not describe WebKit as passed until that
GitHub check succeeds. Vite's existing >500 kB chunk advisory remains nonblocking.

## Reference-policy checkpoints

Fictional, synthetic, medically unreviewed prototypes:

- Initial MDD:
  - database plan: 450 care, 80 investigation, 1,070 payout points;
  - strong alternative: 445 care, 80 investigation, 1,065 payout;
  - shotgun: 430 care, 7,670 investigation, 0 payout;
  - unsafe: -935 care, 80 investigation, 0 payout.
- Medication/palpitations:
  - database plan: 1,140 care, 630 investigation, 1,310 payout;
  - strong alternative: 1,135 care, 630 investigation, 1,305 payout;
  - shotgun: 1,120 care, 7,670 investigation, 0 payout;
  - unsafe: -1,155 care, 130 investigation, 0 payout.

## Files to read before continuing

- `AGENTS.md`
- `README.md`
- `docs/DECISIONS.md` (through D-113)
- `docs/ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTENT_MODEL.md`
- `docs/CONTENT_REVIEW.md`
- `docs/MEDICATION_AND_INTERVENTION_DATA.md`
- `docs/SOURCE_USE_POLICY.md`
- `packages/content-runtime/src/reviewer-assignment.ts`
- `packages/content-runtime/src/reviewer-content.ts`
- `packages/content-runtime/src/review-cohort.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/components/ClinicHub.tsx`
- `apps/web/src/components/EncounterView.tsx`
- `apps/web/src/components/ReceiptView.tsx`
- `apps/web/src/review-export.ts`
- `tests/e2e/reviewer-mobile.spec.ts`
- `.github/workflows/pages.yml`

## Exact next action

Commit this state update, push `main` at `220a019` plus this state commit, and monitor the
verification/Pages run. After Pages succeeds, create and push `beta`, check it out, update this file
with exact release/branch state, and stop. The next product discussion after that is the single
medication-allowlist decision described above.
