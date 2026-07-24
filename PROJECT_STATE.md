# PsychSim project state

Last updated: 2026-07-24

## Operational state

- Canonical Codex thread: `019f86e1-8867-7143-b2e9-e93d7f25db8b`, generation 1.
- Current branch: `beta`, tracking `origin/beta`. Future local work stays on `beta`.
- Verified feature checkpoint: `dd924f4ea0d48210249f707eed5ec736194066a9`
  (`Add reviewer variability and phone distribution support`).
- GitHub workflow `30130820877` passed every beta verification gate. Its Pages package and deploy
  jobs were correctly skipped.
- Released `origin/main`: `bccf717bc62edb5772886586a698eae28c7b207b`.
- `main` and the public Pages application remain unchanged. Promote the whole tested `beta` branch
  only after an explicit user request such as “push to main.”
- The currently distributed Reviewer remains at `https://dcr-cmyk648.github.io/PsychSim/` and
  predates this beta checkpoint.

## Current phase and bounded checkpoint

Milestone 3 remains complete. Do not begin departments/Milestone 4. The active work remains a
pre-Milestone-4 clinical-authoring, portable-review, and phone-distribution checkpoint:

1. Preserve the question-bank snapshot model: investigate, choose the immediate intervention and
   disposition, submit, and audit points. Do not add longitudinal monitoring simulation.
2. Keep patient state, reusable diagnosis/medication/test knowledge, focused decision policies,
   and point balance separable.
3. Improve the finite, explicitly unreviewed Reviewer cohort and its phone feedback path before
   adding broad clinical content.
4. Keep install/update behavior deterministic and observable without clearing local feedback or
   IndexedDB.

## Portable Reviewer and gameplay checkpoint

- Three web boundaries remain:
  - ordinary Player: approved-for-prototype root content only;
  - local Vite Developer: review/source/opinion queues plus the fixed workspace writer;
  - portable Reviewer: the two prototype patients plus exactly ten allowlisted review scenarios.
- Reviewer assignment: `reviewer-assignment.common-psychiatry.2026-07b`. A material cohort or policy
  change must bump this ID again.
- The ten scenarios cover five MDD decision states plus initial GAD, bipolar depression, acute
  mania, schizophrenia relapse, and PTSD. Every case and executable clinical rule is fictional,
  synthetic, and medically unreviewed.
- Reviewer duration facts now come from structured, diagnosis-aware profiles instead of a fixed
  sentence. The current ranges preserve each authored episode state. A source-gap ticket records
  the unresolved cyclothymia-duration requirement rather than guessing a threshold.
- Eligible Reviewer cases may receive zero or one deterministic, bounded background-anxiety
  finding. It is explicitly subthreshold, saved in the resolved case, and cannot create a new
  syndrome or alter the rubric.
- Structured findings now make absent/negative observations visually distinct. Positive symptoms
  use a red plus; abnormal numeric results use red direction glyphs while retaining value, unit,
  reference interval, and interpretation.
- The receipt has one responsive care-points meter. The player's score fills toward the declared
  database-plan benchmark; if the player exceeds it, the player score becomes the scale maximum and
  the database benchmark is marked on the same meter.
- The player's selected plan and the database-plan replay remain side by side on wide layouts and
  stack legibly on phones.
- Rule traces lead with point-relevant entries and now expose reference/provenance labels. Expanded
  details retain source contribution, derivation, rule review state, and citation location where
  present. Unreferenced judgments remain labeled `Expert opinion`.
- Treatment remains one searchable catalog menu spanning medication name/class, psychotherapy and
  other nonmedication labels/categories, and disposition. A regression test protects that search
  behavior.
- Portable Reviewer feedback still captures both case-specific and subjective app-experience
  comments, exact completed-attempt state, all displayed options/costs/choices, generated tickets,
  flags, and multiple cases in one versioned export.

## Intake-assistant upgrade checkpoint

- A bounded first staffing upgrade exists: `upgrade.intake-assistant.basic`.
- It costs 900 spendable points and requires 600 lifetime points. It is unavailable in practice
  overlays and cannot create debt.
- The player may configure at most three eligible routine intake actions. The configured actions
  run through ordinary information-purchase events when an encounter starts; they reveal
  immediately, remain nonrepeatable, appear in the ledger/receipt/replay, and still cost points at
  a discounted but nonzero fulfillment cost.
- The assistant does not choose clinically correct actions, bypass case availability, change
  clinical rewards, or execute tests that are not explicitly marked eligible.
- This is the only staffing slice. Do not broaden it into salaries, scheduling, capacity, or a
  general staff system without a later scoped decision.

## iPhone install and distribution-version contract

- The web app now ships a base-path-safe `manifest.webmanifest`, Apple web-app metadata, and
  generated 180, 192, and 512 px icons.
- The Hub exposes an “Install on iPhone” dialog with the current Safari flow: Share, Add to Home
  Screen, enable Open as Web App, then Add.
- The dialog warns that Safari and an installed Home Screen app may have separate browser storage.
  A reviewer should export feedback from the surface where it was created before clearing data or
  switching surfaces.
- Vite emits a strict `version.json` beside each build and compiles the same record into the app.
  The record identifies the distribution build, channel, and full release ID.
- A `main` Pages build receives the full Git commit SHA and `main` channel from GitHub Actions.
  Bundle verification rejects missing install assets, mismatched build kind, or an invalid/main
  non-SHA distribution ID.
- A running app checks `version.json` on mount, foreground, reconnect, every five minutes, and on
  manual request using `no-store` fetches and a unique query. A newer release produces a persistent
  update banner.
- Updates are user-triggered. An active encounter or receipt is preserved; the user returns to the
  Hub before reloading the release-specific URL. The update path never deletes IndexedDB.
- There is deliberately no service worker or offline cache yet. This avoids stale hand-versioned
  caches and origin-wide cache deletion while local review data remains browser-only.
- Required follow-up after a beta-to-main promotion: install the live Pages build on a physical
  iPhone, save a Reviewer note, publish a second test release, foreground/check for update, apply
  it at the Hub, and confirm the note survives. Add offline support only as a separate later task.

## Content, evidence, and source state

- The ordinary investigation menu remains a shared 36-action catalog; cases own structured
  immediate results and post-submit rules, never answer-hint descriptions.
- Fictional first and last names resolve independently from large curated pools, with a
  deterministic 25% middle-initial chance and more than 10,000 base combinations.
- Diagnosis-family definitions exist for MDD, bipolar spectrum, GAD, PTSD, schizophrenia spectrum,
  BPD, medication-induced akathisia, and substance-induced mood disorder. The Reviewer cohort
  exercises provisional focused policies; it does not establish approved shared guidance.
- Formal RxNorm current-prescribable-content metadata was verified against NLM's July 6, 2026
  release. Its source-use decision permits identity/normalization authoring only. It does not make
  RxNorm a treatment recommendation source and no dump, importer, or runtime expansion was added.
- Four Developer-visible catalog-gap tickets now queue:
  - a curated psychiatry medication allowlist;
  - formal provenance for current medication rules;
  - therapy identity/fidelity and naming;
  - common outpatient diagnosis coverage.
- DrugCentral remains an authoring-only aggregate seed. No database dump, bulk medication importer,
  or clinical rule was activated.
- DSM and WHO CDDR remain metadata-only. The local ICD-10-CM cache remains gitignored
  authoring/search data and never enters the browser bundle.
- The private residency-article aggregate remains pending user export and no-PHI acknowledgment. No
  SharePoint bytes or developer opinions were imported.

## Google Drive source-inbox state

- The connected Drive folder `PsychSim documents` was requested for this checkpoint, but this
  canonical session has no callable Google Drive connector and no locally synchronized Drive root.
  The remote folder was therefore not refreshed and no unseen document was ingested.
- The local-only discovery state still records five candidates from the prior scan; four have
  locally available extracted artifacts. Inbox, quarantine, and archive are currently empty.
- Do not claim that the fifth remote candidate is locally available merely because provider
  metadata says it was once pulled; its bytes/hash cannot be verified from the observable local
  source manifest.
- Safe next source intake:
  1. use a connector-enabled canonical session to list direct children and select one source at a
     time, or manually download one rights-cleared, non-PHI source into
     `content/source-docs/inbox/`;
  2. run `pnpm content:scan`, `pnpm content:extract`, and
     `pnpm content:sources:validate`;
  3. review license/full-text/AI-use permissions;
  4. create reviewable claim/change proposals and tickets before any runtime scoring change.
- Never propagate a Drive document directly into medication, therapy, diagnosis, or scoring rules.

## Review and provenance state

- Local Developer ticket instructions and attempt reviews save to IndexedDB and mirror to
  `content/generated/local-review-tickets/tickets.json`. The existing human handoff file remains a
  legacy artifact until the next intentional browser save; do not overwrite it merely to modernize
  it. Playwright uses the separate `tickets.e2e.json`.
- Portable Reviewer never exposes preloaded local source/opinion/ticket queues or the writer
  endpoint. Reviewer-created guidance, flags, and tickets may be included in the manual export.
- Saving feedback is not clinical approval and is not authorization to edit a rule.
- Source-linked trace rows now make the evidence trail visible, but bibliographic verification
  still does not confer medical or rule-level approval.

## Verification for checkpoint `dd924f4`

Passed locally on 2026-07-24:

- `pnpm assets:icons`
- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`: 22 TypeScript files, 161 tests; 10 handoff tests
- `pnpm content:validate`
- `pnpm content:sources:validate`: 5 discovery candidates, 4 local extracted artifacts
- `pnpm content:compile`: 3 local review patients plus 10 portable Reviewer scenarios
- `pnpm content:evidence`
- `pnpm content:diagnoses:validate`: 1,112 local ICD-10-CM terms, hash
  `f13efd1dd80c96397e94276e2600ef0e9883454391b3351b2a66ef43ace35d7c`
- `pnpm demo:reference-runs`
- `pnpm test:e2e`: 4 Player/Developer/Endgame browser tests
- `pnpm test:e2e:reviewer`: 4 phone Reviewer tests, including install guidance and a complete
  390/320 px review/export workflow
- `pnpm build`: Player bundle and source-boundary scanner, 11 files
- Pages-equivalent `pnpm build:reviewer` with a full injected main SHA: Reviewer bundle and
  source-boundary scanner, 15 files
- `git diff --check`

GitHub Actions workflow `30130820877` also passed formatting, lint, typecheck, unit/content tests,
approved/source validation, Developer compilation, standard browser tests, mobile Reviewer browser
tests, and both Player and portable Reviewer builds. Pages packaging/deployment skipped on `beta`
as intended. GitHub emitted only its nonblocking Node-action deprecation annotation.

Development-only failed attempts were resolved before the checkpoint: icon generation initially
lacked a locally usable browser, and two Reviewer assertions were too dependent on a particular
randomized case/finding. The final generator used the installed Chrome binary, and the tests now
select stable source-linked and mania-screen observations.

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
- Medication/palpitations with owned ECG:
  - database plan remains 1,140 care;
  - workup expense falls to 200 and payout rises to 1,740;
  - the receipt attributes 430 points of savings without changing clinical correctness.

## Files to read before continuing

- `AGENTS.md`
- `README.md`
- `docs/DECISIONS.md` (through D-119)
- `docs/ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTENT_MODEL.md`
- `docs/CONTENT_REVIEW.md`
- `docs/MEDICATION_AND_INTERVENTION_DATA.md`
- `docs/SOURCE_USE_POLICY.md`
- `docs/INSTALL_AND_UPDATES.md`
- `packages/content-runtime/src/reviewer-assignment.ts`
- `packages/content-runtime/src/reviewer-content.ts`
- `packages/content-runtime/src/review-cohort.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/components/ClinicHub.tsx`
- `apps/web/src/components/EncounterView.tsx`
- `apps/web/src/components/ReceiptView.tsx`
- `apps/web/src/distribution-version.ts`
- `apps/web/src/review-export.ts`
- `tests/e2e/reviewer-mobile.spec.ts`
- `.github/workflows/pages.yml`

## Exact next action

When the user is ready to continue, present one bounded decision: how much formulation granularity
the medication catalog should model initially (for example, ingredient only versus clinically
meaningful IR/SR/XL, long-acting injectable, route, and combination-product distinctions).

Do not implement a bulk medication importer, invent missing therapy/diagnosis guidance, begin
Milestone 4, add a service worker, or modify `main` until the relevant decision or promotion is
explicitly authorized.
