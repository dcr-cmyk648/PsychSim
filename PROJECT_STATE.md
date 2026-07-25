# PsychSim project state

Last updated: 2026-07-25

## Operational state

- Canonical Codex thread: `019f86e1-8867-7143-b2e9-e93d7f25db8b`, generation 1.
- Current branch: `beta`, tracking `origin/beta`. Future local work stays on `beta`.
- Current beta feature checkpoint:
  `8d78c078ba60b7e67f7934c714773aa277b64769`
  (`Incorporate mobile regimen review feedback`). It contains assignment `2026-07f`, the bounded
  initial-outpatient duplicate-antidepressant rule, exact Developer-opinion provenance, and the
  queued normalized-regimen/evidence follow-up.
- Current beta authoring checkpoint:
  `2f64b014fe6944e31222248ce1802e36915b0d15`
  (`Add ticket literature scout workflow`). It adds the local Developer-only, relevance-first
  meta-analysis scout and leaves all clinical rules, points, ticket/source statuses, and portable
  Reviewer content unchanged.
- Released feature checkpoint: `8d78c078ba60b7e67f7934c714773aa277b64769`.
- Current beta source-intake checkpoint:
  `8d0816e155643f4ee37e090571efa5637e322d6c` (`Harden private source intake`).
- Beta workflow `30170704601` passed every verification gate for
  `901aca33ec9353cf677d85d34db446f0223e7865`, including iPhone/WebKit and both bundle-safety
  builds; its Pages jobs skipped as intended.
- `origin/main` is `8d78c078ba60b7e67f7934c714773aa277b64769`. Main workflow `30168178421`
  repeated the full matrix, packaged the portable Reviewer, and deployed Pages.
- The public portable Reviewer is live at `https://dcr-cmyk648.github.io/PsychSim/`. Its
  cache-busted `version.json` returned the exact release SHA, `portable_reviewer`, and `main`.
- The deployed cache-busted `version.json` independently returned exact release
  `8d78c078ba60b7e67f7934c714773aa277b64769`, build kind `portable_reviewer`, and channel `main`.
- The working copy is back on `beta`. Feature content matches `main`; the durable-state follow-up
  commit may leave beta one documentation-only commit ahead.
- Local Developer remains available at `http://127.0.0.1:4318/`. A dedicated current portable
  Reviewer server is verified at `http://127.0.0.1:4319/`.

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
5. Keep private Apple Notes intake separate from executable content; physical intake is complete,
   while semantic opinion/citation review remains separately gated and one item at a time.
6. Keep validated runtime content, scoring/provenance, and the finite Reviewer ticket assignment
   current on `main`; reserve beta-only quarantine for materially risky UI or app mechanisms.

## Portable Reviewer and gameplay checkpoint

- Three web boundaries remain:
  - ordinary Player: approved-for-prototype root content only;
  - local Vite Developer: review/source/opinion queues plus the fixed workspace writer;
  - portable Reviewer: the two prototype patients plus exactly ten allowlisted review scenarios.
- Reviewer assignment: `reviewer-assignment.common-psychiatry.2026-07f`. A material cohort or policy
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
- Structured findings now make present and absent observations visually distinct. Present findings
  use a red `Present` chip; abnormal numeric results use red direction glyphs while retaining
  value, unit, reference interval, and interpretation.
- The receipt has one responsive care-points meter. The player's score fills toward the declared
  database-plan benchmark; if the player exceeds it, the player score becomes the scale maximum and
  the database benchmark is marked on the same meter.
- The player's selected plan and the database-plan replay remain side by side on wide layouts and
  stack legibly on phones.
- Rule traces lead with point-relevant entries and now expose reference/provenance labels. Expanded
  details retain source contribution, derivation, rule review state, and citation location where
  present. Reviewer-supplied contributions beginning `Developer opinion:` display as Developer
  opinion; generic unreferenced judgments remain labeled `Expert opinion`.
- Treatment remains one searchable catalog menu spanning medication name/class, psychotherapy and
  other nonmedication labels/categories, and disposition. A regression test protects that search
  behavior.
- Initial MDD, prior-good-response MDD, and prior-intolerance MDD scenarios are content version
  `1.5.0`; the other seven Reviewer scenarios remain `1.4.0`. The shared initial-MDD decision
  policy is `1.1.0`. They preserve explicit medication-list status,
  structured medication/psychotherapy/provider/level-of-care history, reviewed weight/BMI
  measurements, and separate body-habitus observations. Service-backed treatment choices freeze
  fulfillment and displayed cost in review snapshots.
- The shared investigation catalog now has 40 neutral actions. `Allergies and adverse reactions`
  and `Safety-planning ability` are searchable History actions with immediate results.
  Safety-planning history records only whether the patient reports feeling able to participate; it
  is neither a clinician safety formulation nor an outpatient-disposition conclusion. Creating or
  revising a plan remains a separate future intervention.
- Every authored Reviewer scenario owns explicit reaction state. Current entries use bounded
  seasonal/environmental or food examples and separately author medication-reaction assessment;
  a nonmedication entry can no longer imply “no medication reactions.” Chart labels remain
  separate from disabled/unreviewed clinical interpretation.
- Each patient carries a `budget_only` optional-feature profile. It records coarse room for future
  richness but does not affect score, payout, eligibility, pool, facility, or difficulty.
  Nonempty optional-module selection remains rejected until a catalog/compiler exists.
- Assignment `2026-07f` includes exactly ten patient-linked, medically unreviewed review tickets.
  Desktop Developer mode retains dense inline details plus a focused dialog. Portable/mobile
  Reviewer opens each ticket in a full-screen view with its own response field; responses persist
  in the assignment database and export with case feedback.
- At widths of 760 pixels or less, all waiting-patient cards occupy one contained horizontal row.
  The next card remains partially visible, touch/trackpad scrolling stays inside the queue, and
  focusing a later chart control scrolls it into view without introducing page-wide overflow.
- The compact `Review tickets` disclosure remains collapsed so ten rule audits do not recreate a
  long phone page. Its visible launcher reports the outstanding count, and its full-screen ticket
  workflow is now an explicit 390-pixel/320-pixel regression assertion.
- The assignment bump intentionally creates a fresh Reviewer IndexedDB namespace. Unexported
  `2026-07e` feedback remains in the old browser database and is not mixed into revised cases.
- A pre-change waiting slot with legacy `unassessed` safety-planning state is re-instantiated from
  the current blueprint with its original seed during queue hydration. The patient identity stays
  deterministic, the stale written-plan result cannot appear under the new label, and completed
  historical attempts remain untouched.
- Debrief headings are diagnosis/decision-state labels authored for post-submit use. They never
  appear on patient cards or pre-submit charts.
- Portable Reviewer feedback still captures both case-specific and subjective app-experience
  comments, exact completed-attempt state, all displayed options/costs/choices, generated tickets,
  flags, and multiple cases in one versioned export.

## Intake-assistant upgrade checkpoint

- A bounded first staffing upgrade exists: `upgrade.staff.intake-assistant`.
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

- The ordinary investigation menu remains a shared 40-action catalog; cases own structured
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
- The MDD prototype is content version `4.3.0`. CANMAT and Developer-opinion/game-balance
  contributions remain separate in the trace. Sertraline and escitalopram share the broad
  first-line baseline; medication-specific fit remains a separate modifier layer. All embedded
  rules remain medically unreviewed.

## Ticket literature-scout checkpoint

- Every one of the 32 unresolved checked-in Developer tickets has exactly one tracked attachment:
  17 tickets link through 13 reusable bounded questions and 15 have explicit exemptions because a
  meta-analysis cannot resolve their legal/access, identity, architecture, balance, or umbrella
  decision.
- Seven profiles select a recent meta-analysis and store a concise original abstract-only summary;
  six record that no directly suitable recent meta-analysis was found rather than substituting an
  unrelated paper.
- The initial Europe PMC searches use the exact 2016-07-25 through 2026-07-25 window. Refreshes roll
  that window forward as ten calendar years, preserve exact queries/result hashes, and record the
  provider-specific cited-by count and as-of time. Relevance is screened before citation rank.
- `pnpm content:literature:refresh -- --ticket <ticket-id> --dry-run` and `--next` operate on one
  attached ticket at a time. Raw API responses remain under ignored
  `content/generated/literature-scout/`; a refresh cannot silently replace a selected paper.
- Local Developer tickets render the selected citation, abstract-only summary, relevance,
  limitations, and search method—or the explicit exemption. The sidecar is dynamically loaded only
  in local Developer mode. Player and portable Reviewer bundle-safety gates exclude it.
- The scout is medically unreviewed discovery context. It is not formal evidence, does not choose
  point magnitude, and made no rule, source-request, ticket-status, assignment, or approval change.

## Apple Notes private-intake state

- The user supplied the required no-PHI, authorized-local-processing, shared-material-rights, and
  named-reviewer acknowledgments. The exact `Psych research` folder then synchronized locally:
  204/204 note title/plaintext records are preserved, with 124 attachment records and no locked
  notes.
- Local macOS OCR completed for 116 attachments. One unsupported attachment and seven attachments
  that Notes could enumerate but not save retain explicit status. The seven affected note texts
  remain exported; the attachments alone are quarantined and no partial bytes are trusted.
- The gitignored mode-`0600` manifest, private revisions, OCR, composites, and extracted chunks are
  local-only. The source graph now contains 209 extracted artifacts: four prior sources, 204 Notes
  composites, and one newly pulled Drive DOCX.
- `content:notes:validate` and `content:sources:validate` pass. Re-running the sync is idempotent;
  the final recovery pass reported 7 newly preserved notes, 197 unchanged notes, and zero
  note-level quarantines.
- On 2026-07-25 Dustin Rowland additionally supplied the named “I confirm” acknowledgment after
  re-reviewing the Notes folder. D-129 records it without treating the acknowledgment as a source
  license waiver.
- `content:notes:codex-review` now provides the separately acknowledged, one-note/one-segment
  authoring boundary. It reads only verified title/plaintext, uses model-independent deterministic
  segmentation, hashes complete canonical packets, stores exact-mode private files plus a
  hash-only audit, rejects symlink/path escapes, and contains no provider/network/API-key call.
- Intake still cannot directly create evidence contributions, Developer opinions, rules, points,
  citations, or medical approval. No real packet was prepared because the active Codex surface did
  not expose an exact model identifier with enough precision. Validation reports `PASS no private
Apple Notes Codex review packets`; no Notes title/plaintext, HTML, attachment, or OCR was printed
  or transmitted in this checkpoint.

## Google Drive source-inbox state

- The apparent missing connector was deferred-tool discovery, not an authentication failure. The
  authenticated connector resolved the exact cached folder ID. The folder now has a ninth direct
  child: the mobile review bundle described below. Source discovery intentionally retains eight
  candidates because a feedback export is not clinical source material.
- The three new candidates are native Docs: `Aggregate sharepoint notes`, `Additional notes`, and
  `Brief Therapy Vignettes`. Account-specific IDs/timestamps remain only in the ignored discovery
  manifest; none is publicly shared.
- `Additional notes` was selected first, downloaded through a non-inline connector attachment,
  verified as a 13,765-byte DOCX with SHA-256
  `804ac28de2b1e8a6836082b1f4f0c461baf3ad60c5478b2e51353bceab4378bf`, then scanned and extracted
  locally as `source-document.804ac28de2b1e8a68360`. No document body was printed or inspected.
- The Drive discovery manifest now has eight candidates: three prior PDFs remain discovered, three
  sources are pulled/hashed, and the two larger new native Docs remain discovered. Continue one
  source at a time; do not bulk-pull the remaining queue.
- Safe next source intake:
  1. classify/review `Additional notes` before choosing the next Drive source;
  2. run `pnpm content:scan`, `pnpm content:extract`, and
     `pnpm content:sources:validate`;
  3. review license/full-text/AI-use permissions;
  4. create reviewable claim/change proposals and tickets before any runtime scoring change.
- Never propagate a Drive document directly into medication, therapy, diagnosis, or scoring rules.

## Review and provenance state

- The mobile Drive export
  `psychsim-reviewer-feedback-2026-07-25T16-44-44-100Z.review-bundle.json` was downloaded as
  untrusted review input and parsed exactly against export schema v5. It is 17,774 bytes with
  SHA-256 `194b7bb855ebf8daec734f712f269449a9f4c7e298ff0e8c40f9e217abae2dad`.
  Static ticket integrity matched assignment `2026-07e`. The bundle contains all ten tickets,
  exactly one nonempty response on `ticket.reviewer-cohort.mdd-initial`, and no attempt review,
  completed attempt, selections, receipt, flag, or rule trace. It is feedback—not a clinical source
  document—and therefore did not enter source scanning, extraction, or the evidence catalog.
- That response identified two separable needs. The bounded current fix scores any simultaneous
  start of two or more available antidepressants as harmful in the initial outpatient MDD
  snapshot, retains the existing care-point cap, and attributes both trace rows solely to explicit
  Developer opinion. A medication plus psychotherapy remains outside that duplicate rule. The rule
  does not claim to govern established augmentation, separate indications, or cross-titration.
- All 13 current medication definitions have at least one class label; citalopram, escitalopram,
  fluoxetine, and sertraline retain the SSRI display class and the stable executable
  `antidepressant` tag. Free-text class labels remain non-executable.
- The broader indication/class-aware risk-benefit model is queued as
  `ticket.catalog.medications.normalized-regimen-risk-benefit`, linked to
  `source-request.medications.regimen-combination-boundaries`. It must keep benefits, additive
  risks, interactions, duplicate warnings, and later explicit exceptions independently auditable.
  No normalized regimen engine, cross-titration state, or new point magnitudes were implemented.
- Local Developer ticket instructions and attempt reviews save to IndexedDB and mirror to
  `content/generated/local-review-tickets/tickets.json`. The existing human handoff file remains a
  legacy artifact until the next intentional browser save; do not overwrite it merely to modernize
  it. Playwright uses the separate `tickets.e2e.json`.
- Portable Reviewer never exposes local source/opinion queues, arbitrary local tickets, or the
  writer endpoint. Its only preassigned tickets are the exact ten patient-linked questions in the
  assignment-`2026-07f` allowlist. Reviewer-created guidance, flags, and tickets may also be
  included in the manual export.
- Saving feedback is not clinical approval and is not authorization to edit a rule.
- Source-linked trace rows now make the evidence trail visible, but bibliographic verification
  still does not confer medical or rule-level approval.
- Developer queues, source requests, opinions, individual tickets, and rule audits begin collapsed
  and mount only when opened. Patient association requires an explicit blueprint ID; shared target
  IDs do not imply a link. Receipt guidance binds an exact immutable attempt, and export validation
  rejects a mismatched patient.
- The starter-MDD initial-modality packet includes one validated, medically unreviewed literature
  proposal. Source-cleared CANMAT can support its proposed direction; ACP/IPT metadata or abstracts
  remain qualifying context only. The proposal changes no rule, point value, or approval state.

## Verification for mobile-feedback checkpoint `8d78c07`

Passed locally on 2026-07-25:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`: 27 TypeScript files, 207 tests; 10 handoff tests
- `pnpm content:validate`: catalogs plus 15 executable patients
- `pnpm content:sources:validate`: 8 Drive candidates, 209 extracted artifacts, 204 private Apple
  Notes records, and no private Codex-review packets
- `pnpm content:notes:validate`: 204 note records, 124 attachment records, and no private
  Codex-review packets
- `pnpm content:compile`: 3 local review patients plus 10 portable Reviewer scenarios
- `pnpm content:evidence`
- `pnpm content:diagnoses:validate`: 1,112 local ICD-10-CM terms, hash
  `f13efd1ce8e5a1134129cd3b511f56913c5a41d10577e22ae3e1fb286ffb3e97`
- `pnpm demo:reference-runs`
- `pnpm test:e2e`: 4 Player/Developer/Endgame browser tests
- `pnpm test:e2e:reviewer`: 4 portable/mobile Reviewer tests at 390 px and 320 px
- `pnpm build`: Player bundle safety passed, 11 files
- Pages-equivalent `pnpm build:reviewer`: portable Reviewer bundle safety passed, 15 files
- `git diff --check`

Focused tests additionally enumerate all ten unordered pairs among the five current initial-MDD
antidepressants, reject single-medication and medication-plus-therapy false positives, exercise
the all-options upper bound, preserve formal attribution on unaffected rules, render Developer
opinion distinctly, and verify the new ticket/source-request link.

Beta workflow `30168035942` repeated the complete matrix and passed; Pages jobs skipped on beta as
intended. Main workflow `30168178421` repeated the complete matrix, packaged the portable Reviewer,
and deployed Pages. The public `version.json` returned exact distribution
`8d78c078ba60b7e67f7934c714773aa277b64769`, `portable_reviewer`, and `main`.

## Verification for beta feature checkpoint `8e08f7c`

Passed locally on 2026-07-25:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`: 27 TypeScript files, 202 tests; 10 handoff tests
- `pnpm test:handoff`: 10 tests
- `pnpm content:validate`: catalogs plus 15 executable patients
- `pnpm content:sources:validate`: 8 Drive candidates, 209 extracted artifacts, 204 private Apple
  Notes records, and no private Codex-review packets
- `pnpm content:notes:validate`: 204 note records, 124 attachment records, and no private
  Codex-review packets
- `pnpm content:compile`: 3 local review patients plus 10 portable Reviewer scenarios
- `pnpm content:evidence`
- `pnpm content:diagnoses:validate`: 1,112 local ICD-10-CM terms, hash
  `f13efd1ce8e5a1134129cd3b511f56913c5a41d10577e22ae3e1fb286ffb3e97`
- `pnpm demo:reference-runs`
- `pnpm test:e2e`: 4 Player/Developer/Endgame browser tests
- `pnpm test:e2e:reviewer`: 4 portable/mobile Reviewer tests at 390 px and 320 px
- `pnpm build`: Player bundle safety passed, 11 files
- Pages-equivalent `pnpm build:reviewer`: portable Reviewer bundle safety passed, 15 files
- `git diff --check`

The corrected safety-planning option remains Subjective history, uses typed patient-owned state,
and exposes a reusable state-specific fact without adding an unsourced score or disposition rule.
Validation rejects unassessed current content and a mismatch between the authored state, displayed
finding, and revealed fact. Both responsive Reviewer sizes completed and exported assignment
`2026-07e`.

## Verification for checkpoint `0536c28`

Passed locally on 2026-07-24:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`: 26 TypeScript files, 183 tests; 10 handoff tests
- `pnpm content:validate`
- `pnpm content:sources:validate`: 5 Drive discovery candidates, 4 local extracted artifacts, and
  204 private Apple Notes metadata records
- `pnpm content:notes:validate`: 204 note records and 124 attachment records
- `pnpm content:compile`: 3 local review patients plus 10 portable Reviewer scenarios
- `pnpm content:evidence`
- `pnpm content:diagnoses:validate`: 1,112 local ICD-10-CM terms, hash
  `f13efd1ce8e5a1134129cd3b511f56913c5a41d10577e22ae3e1fb286ffb3e97`
- `pnpm demo:reference-runs`
- `pnpm test:e2e`: 4 Player/Developer/Endgame browser tests
- `pnpm test:e2e:reviewer`: 4 phone Reviewer tests, including install guidance and a complete
  390/320 px review/export workflow
- `pnpm build`: Player bundle and source-boundary scanner, 11 files
- Pages-equivalent `pnpm build:reviewer` with a full injected main SHA: Reviewer bundle and
  source-boundary scanner, 15 files
- `git diff --check`
- Metadata-only `pnpm content:notes:audit -- --folder "Psych research"`: 204 notes, 124
  attachments, no content access

Current private-intake verification on 2026-07-25:

- `pnpm content:notes:sync …`: 204 note texts preserved; 116 local OCR completions; one unsupported
  attachment; seven attachment-only quarantines; zero note-level quarantines.
- `pnpm content:notes:validate`: 204 note records and 124 attachment records.
- `pnpm content:sources:validate`: 8 Drive candidates and 209 extracted local artifacts.
- Focused `apple-notes-provider.test.ts`: 10/10 tests.
- `pnpm format:check`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`: 26 TypeScript files, 184 tests; 10 handoff tests.
- `pnpm content:validate`
- `pnpm content:compile`
- `pnpm content:evidence`
- `pnpm content:diagnoses:validate`
- `pnpm demo:reference-runs`
- `pnpm test:e2e`: 4 Player/Developer/Endgame browser tests.
- `pnpm test:e2e:reviewer`: 4 phone Reviewer tests.
- `pnpm build`: Player bundle safety passed, 11 files.
- Pages-equivalent `pnpm build:reviewer`: Reviewer bundle safety passed, 15 files.
- GitHub Actions workflow `30163825898` repeated the complete beta verification matrix and passed;
  Pages packaging/deployment skipped on beta as intended.

GitHub Actions workflow `30138035083` passed the complete beta matrix. Workflow `30138175892`
repeated the complete matrix on `main`, packaged the finite Reviewer build, and deployed Pages.
GitHub emitted only its nonblocking Node-action deprecation annotation.

Development-only failed attempts were resolved before release: one local Player/Reviewer build was
incorrectly parallelized against their shared `dist` directory; beta CI `30137938213` caught one
unformatted test file; and beta CI `30137963714` caught eager `sw_vers` discovery on Linux for
non-OCR paths. Sequential builds, formatted test code, and demand-driven OCR engine discovery are
now covered and passing. The substantive Apple Notes sync was intentionally not run.

## Reference-policy checkpoints

Fictional, synthetic, medically unreviewed prototypes:

- Initial MDD:
  - database plan: 515 care, 135 investigation, 1,080 payout points;
  - strong alternative: 515 care, 135 investigation, 1,080 payout;
  - shotgun: 495 care, 7,745 investigation, 0 payout;
  - unsafe: -905 care, 135 investigation, 0 payout.
- Medication/palpitations:
  - database plan: 1,140 care, 630 investigation, 1,310 payout;
  - strong alternative: 1,135 care, 630 investigation, 1,305 payout;
  - shotgun: 1,120 care, 7,745 investigation, 0 payout (calculated pre-floor payout -5,825);
  - unsafe: -1,155 care, 130 investigation, 0 payout.
- Medication/palpitations with owned ECG:
  - database plan remains 1,140 care;
  - workup expense falls to 200 and payout rises to 1,740;
  - the receipt attributes 430 points of savings without changing clinical correctness.

## Files to read before continuing

- `AGENTS.md`
- `README.md`
- `docs/DECISIONS.md` (through D-133)
- `docs/ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTENT_MODEL.md`
- `docs/CONTENT_REVIEW.md`
- `docs/DOCUMENT_INGESTION.md`
- `docs/MEDICATION_AND_INTERVENTION_DATA.md`
- `docs/SOURCE_USE_POLICY.md`
- `docs/INSTALL_AND_UPDATES.md`
- `content/source-docs/README.md`
- `content/cases/review/literature-synthesis.proposals.json`
- `content/cases/review/ticket-literature-scout.catalog.json`
- `content/cases/review/catalog-expansion-audit.tickets.json`
- `content/cases/review/source-needed.requests.json`
- `packages/content-runtime/src/literature-synthesis.ts`
- `packages/content-runtime/src/ticket-literature-scout.ts`
- `packages/content-runtime/src/reviewer-assignment.ts`
- `packages/content-runtime/src/reviewer-content.ts`
- `packages/content-runtime/src/review-cohort.ts`
- `packages/content-runtime/src/reviewer-policies.ts`
- `apps/web/src/App.tsx`
- `apps/web/src/components/ClinicHub.tsx`
- `apps/web/src/components/EncounterView.tsx`
- `apps/web/src/components/ReceiptView.tsx`
- `apps/web/src/styles.css`
- `apps/web/src/distribution.ts`
- `apps/web/src/review-export.ts`
- `packages/engine/src/services.ts`
- `tools/content-cli/src/apple-notes-provider.ts`
- `tools/content-cli/src/apple-notes-codex-review.ts`
- `tools/content-cli/src/refresh-ticket-literature.ts`
- `content/cases/blueprints/reviewer-cohort/reviewer-assignment.tickets.json`
- `content/catalogs/reactions/reaction-concepts.json`
- `tests/e2e/reviewer-mobile.spec.ts`
- `.github/workflows/pages.yml`

## Exact next action

On the local Developer server, open **Clinical and content tickets**, then inspect one selected
packet such as `ticket.source.canmat-mdd.antidepressant-baseline` and one no-suitable packet such as
`ticket.source.bupropion.seizure-history-nuance`. Confirm that the short abstract-only context and
limitations make the clinical decision easier without looking like an approved answer. Continue
adjudicating one ticket at a time; scouting alone never resolves it.

On the physical phone, foreground the installed/Safari copy, use the update banner or **Check for
update**, and confirm it reaches distribution
`8d78c078ba60b7e67f7934c714773aa277b64769`. Confirm sideways patient scrolling and the visible
`Review tickets · 10 need input` launcher. Export any older assignment feedback before relying on
the fresh `2026-07f` namespace.

Then run the `Recheck the initial MDD patient and database plan` ticket in assignment `2026-07f`.
Verify that any simultaneous two-antidepressant start among the five current options receives the
harmful grade and safety cap, that one antidepressant plus psychotherapy does not, and that those
two rows say `Developer opinion` rather than WHO/CANMAT. Export the completed attempt plus response
so the next review includes exact selections, receipt, and trace.

After that bounded recheck, review
`ticket.catalog.medications.normalized-regimen-risk-benefit` and its linked source request as one
clinical decision at a time. Do not build a general duplicate/augmentation/cross-titration engine
until normalized regimen relationships and evidence boundaries have been reviewed.

Separately, obtain the exact model identifier from a Codex surface before using
`content:notes:codex-review`. Then review one bounded Notes title/plaintext segment and classify it
as a Developer-opinion candidate, bibliographic candidate, secondary context, or
irrelevant/duplicate material. Do not infer the identifier and do not turn intake directly into
rules, points, citations, or approval.

The next queued product decision after the regimen review remains medication formulation
granularity:
ingredient only versus clinically meaningful IR/SR/XL, long-acting injectable, route, and
combination-product distinctions.

Do not implement a bulk medication importer, invent missing therapy/diagnosis guidance, begin
Milestone 4, add a service worker, or bulk-transmit private source material.
