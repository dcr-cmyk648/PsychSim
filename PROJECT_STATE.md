# PsychSim project state

Last updated: 2026-07-26

## Operational state

- Canonical Codex thread: `019f86e1-8867-7143-b2e9-e93d7f25db8b`, generation 1.
- Current branch: `beta`, tracking `origin/beta`. Future local work stays on `beta`.
- Current beta immutable-source-review checkpoint:
  `e1fdb94ae5d063f351364485b692fd0e9f092c35`
  (`Add immutable local source review packets`). One complete parser-v5 source unit can now produce
  a hash-bound, local-Developer-only `SourceReviewSnapshot` plus a separate private locator. The
  safe packet enters the existing focused ticket reader; saving prose preserves its exact snapshot
  and never mutates clinical content. The first aggregate packet is deliberately metadata-only and
  records the unresolved Word-heading boundary. It creates no clinical atom, source claim,
  opinion, database entry, rule, point, or runtime change.
- Local source coverage is 210/210 extracted artifacts: 204 Apple Notes composites, four formal
  PDFs, and two private Drive DOCX files. All six non-Notes artifacts use parser v5. The connected
  Drive listing has nine items: eight already-known source candidates plus one Reviewer-feedback
  JSON; no new or changed clinical source was found. Four candidates still lack local bytes,
  SHA-256, and extraction: psychotic depression, QTc/TdP Funk review, Pink Book 2021, and Brief
  Therapy Vignettes.
- Local Developer and portable Reviewer servers were restarted on the current worktree and are
  available at `http://127.0.0.1:4318/` and `http://127.0.0.1:4319/`. The Developer source endpoint
  returns exactly one validated safe packet with no private locator markers; the Reviewer endpoint
  remains absent and falls through to the ordinary app shell.
- Current beta database-audit checkpoint:
  `99989e9ef5d6a0c0c8caa4bd41a19cc3c08cc312`
  (`Add auditable database reader and medication identities`). The Database opens every public-safe
  record in a dedicated desktop/mobile reader and lets Developer/portable Reviewer users save,
  revise, remove, and export comments with immutable entry snapshots. The public catalog contains
  123 records, including 33 normalized medication identities. A whole-corpus private lexical
  inventory covers all 204 authorized Apple Notes title/plaintext revisions without importing
  private prose or changing gameplay. It is pushed to `origin/beta`; `main` remains unchanged.
- Current beta database-inspection checkpoint:
  `0b714e65af4d4d128f85933d433141d64e16fe23`
  (`Add safe cross-device database browser`). It adds the strict public catalog projection and the
  shared desktop/mobile Database screen without exposing cases, point rules, private sources,
  tickets, or the local classification cache. It is pushed to `origin/beta`.
- Current beta feature checkpoint:
  `8d78c078ba60b7e67f7934c714773aa277b64769`
  (`Incorporate mobile regimen review feedback`). It contains assignment `2026-07f`, the bounded
  initial-outpatient duplicate-antidepressant rule, exact Developer-opinion provenance, and the
  queued normalized-regimen/evidence follow-up.
- Current beta authoring checkpoint:
  `f6e6ae0` (`Add bounded personal knowledge workflow`). It adds a local Developer-only,
  one-topic/one-source-revision Apple Notes classification queue, strict private candidate import,
  and a read-only personal-knowledge workbench. The first pilot source has been classified into
  unreviewed candidates; no evidence, rule, point, ticket, approval, Player, or portable Reviewer
  content changed. The prior literature-scout checkpoint remains
  `2f64b014fe6944e31222248ce1802e36915b0d15`.
- Released feature checkpoint: `8d78c078ba60b7e67f7934c714773aa277b64769`.
- Current beta source-intake checkpoint:
  `8d0816e155643f4ee37e090571efa5637e322d6c` (`Harden private source intake`).
- Current beta structured-source checkpoint:
  `36d1971d076659d3ecede55179779754d8a154c6`
  (`Harden structured private source extraction`). It preserves private authored-unit structure and
  provenance, validates explicit one-source refreshes transactionally, and keeps source extraction
  separate from semantic review and executable content.
- Current bounded source-structure work adds parser
  `psychsim-source-parser-5`, explicit one-entry extraction refresh with private artifact history,
  hierarchical DOCX/Markdown section paths, deterministic section-boundary instances, and
  per-chunk locator/body provenance hashes. Refresh captures parser warnings, serializes source
  operations behind a lock whose fixed atomic stale-recovery claim prevents concurrent
  compare/unlink races and fails closed when a prior claim needs inspection, verifies the manifest
  has not changed before commit,
  validates every available field in the old artifact and same-named history revision, and
  recovers an interrupted transaction on the next source command. The exact
  `Aggregate sharepoint notes` DOCX is now downloaded, SHA-256 verified, and structure-aware
  extracted. It has not been semantically reviewed and has changed no database entry, patient,
  rule, point value, or runtime bundle.
- Beta workflow `30170704601` passed every verification gate for
  `901aca33ec9353cf677d85d34db446f0223e7865`, including iPhone/WebKit and both bundle-safety
  builds; its Pages jobs skipped as intended.
- `origin/main` is `8d78c078ba60b7e67f7934c714773aa277b64769`. Main workflow `30168178421`
  repeated the full matrix, packaged the portable Reviewer, and deployed Pages.
- The public portable Reviewer is live at `https://dcr-cmyk648.github.io/PsychSim/`. Its
  cache-busted `version.json` returned the exact release SHA, `portable_reviewer`, and `main`.
- The deployed cache-busted `version.json` independently returned exact release
  `8d78c078ba60b7e67f7934c714773aa277b64769`, build kind `portable_reviewer`, and channel `main`.
- The working copy is on `beta`. The private-authoring workflow and the Database audit mechanisms
  are pushed to `origin/beta`; neither has been promoted to `main`.
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
5. Keep private Apple Notes intake separate from executable content. Physical intake is complete,
   and semantic review has begun one bounded topic and one complete source revision at a time. The
   first title/plaintext source revision is classified only into unreviewed candidates.
6. Keep validated runtime content, scoring/provenance, and the finite Reviewer ticket assignment
   current on `main`; reserve beta-only quarantine for materially risky UI or app mechanisms.
7. Let reviewers inspect every field in the strict public-safe catalog projection and comment on
   an immutable snapshot. Never turn that surface into filesystem access, an answer-key browser,
   direct content mutation, or a route to private authoring data.

## Portable Reviewer and gameplay checkpoint

- Three web boundaries remain:
  - ordinary Player: approved-for-prototype root content only;
  - local Vite Developer: review/source/opinion queues plus the fixed workspace writer;
  - portable Reviewer: the two prototype patients plus exactly ten allowlisted review scenarios.
- Every hub now exposes a shared Database screen. It contains 123 public-safe records: 8 modeled
  conditions, 33 normalized medication identities, 13 nonmedication interventions, 3 dispositions,
  40 shared investigations, 14 test definitions, and 12 formal bibliography records. Thirteen
  medications have existing runtime compatibility definitions; twenty are explicitly identity-only
  authoring records and cannot appear in treatment choices or formularies.
- The Database projection is a strict schema allowlist with deterministic ordering, exact category
  and source-ID parity, unique IDs/logical paths, HTTPS-only source links, and minimized public
  correction/update relationships. It omits patient/case records, point values, predicates,
  modifier/rule counts, generation status, review queues, private provenance, and authoring-only
  diagnosis terms. The logical locators it shows are not host filesystem paths.
- The Database screen defaults to modeled conditions and searches within one category or all
  categories. Opening a result enters a dedicated reader that shows every review-safe semantic
  field plus the complete strict JSON projection, then restores focus to that exact result on
  return. At phone widths its category rail scrolls horizontally, and the reader stays within the
  viewport.
- Developer and portable Reviewer users may save one free-text comment per database entry. IndexedDB
  is updated first; Developer mirrors the fixed local Codex handoff bundle, while portable Reviewer
  comments remain on that browser/device until export. Export schema version 7 includes the exact
  immutable entry snapshot. Player mode can read the database but has no comment form.
- The top-left distribution control now says `APP & UPDATES` on desktop, `PHONE INSTALL` only on
  Apple mobile browsers, and `HOME SCREEN APP` when running as an installed web app.
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
  release. Thirty-three one-file-per-ingredient identity records now pin current ingredient RxCUIs,
  normalized names, and reviewed aliases to that release. Thirteen link one-to-one to existing
  runtime medication definitions; twenty are identity-only. The source-use decision permits
  identity/normalization authoring only, the public reader carries NLM's requested attribution and
  dated-snapshot warning, and none of these identities establishes indication, efficacy, safety,
  monitoring, medical approval, or treatment availability.
- Four Developer-visible catalog-gap tickets now queue:
  - a curated psychiatry medication allowlist;
  - formal provenance for current medication rules;
  - therapy identity/fidelity and naming;
  - common outpatient diagnosis coverage.
- DrugCentral remains an authoring-only aggregate seed. No database dump, bulk medication importer,
  or clinical rule was activated.
- DSM and WHO CDDR remain metadata-only. The local ICD-10-CM cache remains gitignored
  authoring/search data and never enters the browser bundle.
- The official Google Drive plugin is installed and enabled. A fresh connector-enabled worker
  located and exported the exact native `Aggregate sharepoint notes` document as DOCX. Its
  protected local bytes are 93,214 bytes with SHA-256
  `8fedf00c83190f6a3661bf820382b76d27a59ce3d425b02202a7fe8b797f03c1`.
- The local pipeline scanned and extracted that source as
  `source-document.8fedf00c83190f6a3661`. Parser v5 preserves 24 top-level heading instances,
  three nested heading instances, and one unsectioned preamble across 39 chunks. Thirty-eight
  chunks are sectioned and carry deterministic `sectionInstance` values; all 39 chunks carry a
  locator/body `provenanceHash`. One private parser warning records an unrecognized Word `Title`
  paragraph style; whether it is front matter or an additional authored-unit boundary remains for
  semantic review rather than being guessed. Parser-v1 through parser-v4 extractions remain as four
  private history revisions. Semantic review, authored-unit candidates,
  Developer-opinion candidates, bibliography candidates, database/rule changes, and incorporation
  remain at zero; runtime content is unchanged.
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
  local-only. The source graph now contains 210 extracted artifacts: 204 Notes composites, four
  formal PDFs, and two private Drive DOCX files.
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
- The initial-MDD-antidepressant-selection pilot matched 13 current title/plaintext source
  revisions. One exact source revision is fully classified and 12 remain queued; none is released
  or partial. The classified packet was
  `apple-notes-codex-review.53bc9ebee7a28762aad43f7b`, segment 1/1, with SHA-256
  `8da75481ea30741c22614875bfe444f97fcf0ee2a871a9491547eb96a8176026`, model
  `gpt-5.6-sol`, and prompt `personal-knowledge-classifier-1`.
- That source produced one authored-source-unit candidate, seven unreviewed Developer-opinion
  candidates, and three unverified bibliography leads. All seven opinions have at least one
  allowlisted target; deliberately unresolved class-level mappings remain visible instead of being
  guessed. Zero opinions are accepted or evidence-linked.
- The candidate themes concern antidepressant efficacy-versus-tolerability fit, comparative SSRI
  tolerability and adverse effects, bupropion tolerability/anxiety uncertainty, small comparative
  efficacy observations, and overdose safety. These are descriptions of private, unreviewed
  candidates—not medical findings or current recommendations. The bibliography strings mentioning
  Cipriani, CANMAT, and STAR\*D remain unverified leads.
- Intake still cannot directly create evidence contributions, accepted Developer opinions, rules,
  points, citations, tickets, or medical approval. The 116 OCR outputs and all HTML, attachment,
  composite, and extracted-chunk content remain explicitly outside this semantic pilot.
- `pnpm content:knowledge:inventory` now verifies all 204 authorized title/plaintext revisions
  against the current 68-item safe dictionary (33 medication identities, 8 condition definitions,
  13 non-disposition interventions, and 14 tests). The deterministic run found 72 revisions with
  at least one known-target match, 132 without, 29 mentioned identities, and 248
  Unicode-boundary-aware literal matches.
- The inventory is a private, mode-protected locator index, not semantic parsing. It stores IDs,
  hashes, exact catalog terms, and counts rather than source prose; it excludes 124 attachment
  records, 116 OCR outputs, HTML, composites, extracted chunks, and all remote Drive material. It
  neither discovers unknown entities nor creates evidence, opinions, clinical rules, points, or
  runtime content.

## Verification for immutable source-review checkpoint

Passed locally on 2026-07-26:

- `pnpm content:source-review:prepare`: one immutable metadata-only packet and one private locator;
  rerun is idempotent.
- Private packet/feed/draft and Drive discovery files are mode `0600` and gitignored.
- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, and `git diff --check`.
- `pnpm test`: 40 TypeScript test files / 286 tests plus all 10 handoff tests.
- Focused source packet/bridge/loader/merge/reader tests: 29 tests.
- `pnpm content:validate`: all catalogs and 15 executable patients.
- `pnpm content:sources:validate`: 8 Drive candidates, 210 local manifest entries/210 extracted
  artifacts, 204 Apple Notes records, 13 personal-knowledge queue records, and one immutable source
  packet.
- `pnpm content:compile`, `pnpm content:evidence`, and `pnpm demo:reference-runs`; existing care,
  expense, and payout baselines remain unchanged.
- `pnpm build`: Player bundle safety passed (11 files).
- `pnpm build:reviewer`: portable Reviewer bundle safety passed (15 files).
- Node 22.23.1 desktop browser gate: 5/5 Player/Developer/Endgame tests.
- Node 22.23.1 mobile Reviewer gate: 4/4 tests across 390-pixel and 320-pixel projects.
- Live loopback smoke: Developer and Reviewer roots return 200; the Developer source endpoint
  returns JSON with exactly one safe packet and no private document/chunk/path marker; Reviewer
  contains no source endpoint. A fresh browser context opens the packet in Developer mode and
  confirms its response field is enabled while the private locator is healthy.
- The first sandboxed `tsx` and loopback attempts failed with environment `EPERM`; the exact root
  commands and browser gates then passed outside the restricted IPC/network sandbox. Node's
  nonblocking `module.register()` deprecation warning and Vite's existing large-chunk warning
  remain.

## Verification for DOCX structure and aggregate extraction checkpoint

Current local results:

- `pnpm exec vitest run tools/content-cli/src/source-pipeline.test.ts`: 14/14 tests pass. Coverage
  includes real DOCX H1/H2 extraction, complete heading paths, inert HTML/link/image handling,
  nested-list/table deduplication, >6,000-character split context, repeated-heading boundary
  identity, schema-level locator consistency, parser-warning capture, manifest/artifact
  one-to-one coverage, explicit-only refresh, operation locking, compare-and-swap protection,
  restart recovery, transaction rollback, corrupted-prior rejection, private-history equivalence,
  and parser-version agreement.
- `pnpm typecheck`: pass.
- Explicit aggregate refresh: 0 ordinary extractions, 1 named refresh, 0 duplicates, 0
  quarantines.
- Aggregate integrity smoke check: exact source SHA unchanged; parser manifest/document versions
  agree on `psychsim-source-parser-5`; 39 nonempty chunks; 38 sectioned chunks; 24 top-level
  heading instances; three nested heading instances; one unsectioned preamble; all 39 chunks carry
  `provenanceHash`; all 38 sectioned chunks carry `sectionInstance`; one unrecognized-`Title`-style
  warning is retained with total count one; combined extracted-text hash matches; parser-v1
  through parser-v4 artifacts remain as four private history revisions.
- `pnpm content:sources:validate`: pass with 8 Drive candidates, 210 manifest entries/210 extracted
  artifacts, 204 Apple Notes records, one bounded Notes review packet, and the existing private
  personal-knowledge state.
- `pnpm format:check`, `pnpm lint`, and `pnpm typecheck`: pass.
- `pnpm test`: 37 TypeScript files, 267 tests; 10 handoff tests; all pass.
- `pnpm content:validate`, `pnpm content:compile`, `pnpm content:evidence`, and
  `pnpm demo:reference-runs`: pass; existing care, expense, and payout baselines are unchanged.
- `pnpm build`: Player bundle-safety scan passes (11 files); the existing nonblocking Vite
  large-chunk warning remains.
- `pnpm build:reviewer`: portable Reviewer bundle-safety scan passes (15 files); the same
  nonblocking Vite warning remains.
- `pnpm test:e2e`: 5/5 desktop Player/Developer/Endgame tests pass.
- The exact mobile Reviewer suite under temporary Node 22.23.1 exits cleanly: 4/4 pass at 390 px
  and 320 px. It now releases the downloaded review artifact and page explicitly and runs its
  viewport projects with one worker; parallel local Chrome 150 teardown could otherwise leave the
  pinned Playwright 1.53 worker IPC open after all assertions passed. Node 22 LTS remains the
  full-gate toolchain until the pinned Playwright runner is upgraded and verified on Node 26.
- `git diff --check`: pass.

## Verification for database-reader and medication-identity checkpoint

Passed locally on 2026-07-25:

- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, and `git diff --check`.
- `pnpm test`: 37 TypeScript test files / 256 tests plus all 10 handoff tests.
- `pnpm test:handoff`: 10 tests.
- `pnpm content:validate`, including medication identity/disk/registry/source-use validation and
  all approved/review patients.
- `pnpm content:sources:validate`: 8 discovery candidates, 209 extracted artifacts, 204 Apple Notes,
  and the private bounded-authoring state.
- `pnpm content:notes:validate`: 204 Notes, 124 attachment records, one bounded packet, 13 queued
  topic records, one semantic run, and seven opinion candidates.
- `pnpm content:diagnoses:validate`: 1,112 local ICD-10-CM authoring/search terms.
- `pnpm content:compile`, `pnpm content:evidence`, and `pnpm demo:reference-runs`.
- `pnpm content:knowledge:inventory`: 204 eligible title/plaintext revisions, 72 matched revisions,
  29 matched safe identities, and 248 exact boundary-aware matches.
- `pnpm build`: Player bundle safety passed (11 files).
- `pnpm build:reviewer`: portable Reviewer bundle safety passed (15 files).
- `pnpm test:e2e`: 5/5 desktop Player/Developer/Endgame tests.
- `pnpm test:e2e:reviewer`: 4/4 portable Reviewer tests across 390-pixel and 320-pixel phone
  projects. The build and preview phases are now separated so the test server exits cleanly after
  the suite.

The browser tests prove the desktop distribution label, 123-record catalog counts, dedicated
reader, complete strict record, entry-comment persistence, Developer handoff refresh, phone
viewport containment, portable local persistence, formal-reference reader, and exact export-schema
version 7 snapshots. Bundle/runtime tests prove private corpus material and the twenty
identity-only medication records cannot enter gameplay catalogs or formularies.

## Verification for database-inspection checkpoint `0b714e6`

- `pnpm format:check`, `pnpm lint`, and `pnpm typecheck` pass.
- `pnpm test` passes 35 TypeScript test files / 245 tests plus all 10 handoff tests.
- The strict public-projection tests prove exact parity for every exposed runtime category,
  deterministic sorting under reordered inputs, unique categories/entries/paths/components, the
  nested public relation allowlist, HTTPS-only source links, and rejection of scoring/private
  fields.
- `pnpm content:validate`, `pnpm content:sources:validate`,
  `pnpm content:notes:validate`, `pnpm content:diagnoses:validate`, `pnpm content:compile`,
  `pnpm content:evidence`, and `pnpm demo:reference-runs` pass.
- `pnpm build` passes the Player bundle-safety scan (11 files); `pnpm build:reviewer` passes the
  portable Reviewer bundle-safety scan (15 files). Both retain only the existing nonblocking Vite
  large-chunk warning.
- `pnpm test:e2e` passes all 5 desktop Player/Developer/Endgame tests. The Database journey checks
  focus, search, collapsed metadata, answer-key exclusion, unchanged profile/queue state, and
  focus restoration.
- `pnpm test:e2e:reviewer` passes all 4 portable phone tests at 390 and 320 pixels. It traverses
  modeled conditions, medications, the far-right formal-reference category, a long expanded
  citation, no-result private-ticket searches, no page-wide overflow, return focus, multi-patient
  feedback, persistence, and exact export.
- The first sandboxed `tsx`/Playwright launches were unable to create a temporary IPC socket or
  bind a loopback test port. The identical read-only commands passed outside that sandbox; this
  was an execution-environment restriction, not a project failure.

## Verification for personal-knowledge checkpoint `f6e6ae0`

Passed locally on 2026-07-25:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`: 33 TypeScript files, 237 tests; 10 handoff tests
- `pnpm test:handoff`: 10 tests
- Focused personal-knowledge/plugin/UI/runtime suites: 22 tests
- `pnpm content:knowledge:status`: 204 eligible Notes, 12 queued source revisions, one fully
  classified source revision, seven mapped opinion candidates, zero accepted/evidence-linked
- `pnpm content:validate`: catalogs plus 15 executable patients
- `pnpm content:notes:validate`: 204 Notes, 124 attachments, one packet, 13 queue records, one
  semantic run, and seven opinion candidates
- `pnpm content:sources:validate`: 8 Drive candidates, 209 extracted artifacts, and the same
  validated private-authoring state
- `pnpm content:compile`
- `pnpm content:evidence`
- `pnpm content:diagnoses:validate`: 1,112 local ICD-10-CM terms
- `pnpm demo:reference-runs`: all existing care, expense, and payout baselines unchanged
- `pnpm build`: Player bundle safety passed
- `pnpm build:reviewer`: portable Reviewer bundle safety passed
- `pnpm test:e2e`: 4 Player/Developer/Endgame browser tests
- `pnpm test:e2e:reviewer`: 4 mobile portable-Reviewer tests
- `git diff --check`

The first import was rerun and returned `UNCHANGED`, proving idempotence. Private queue, workspace,
projection, packet, and classifier input files are mode `0600`; directories are mode `0700`. A
regression test now rejects an import file with broader permissions. No private title, source text,
candidate wording, citation, summary, or path was printed by aggregate status/validation commands.

## Google Drive source-inbox state

- A fresh connected-folder verification found nine direct items: the same eight clinical/source
  candidates already represented by the private discovery manifest plus one Reviewer-feedback
  JSON. No additional clinical source or changed remote timestamp was found.
- The prior connector failure had a concrete cause: the official Google Drive plugin existed in
  the marketplace cache but was not installed. It is now installed and enabled. The long-lived
  root session does not dynamically gain newly installed connector tools, but a fresh
  connector-enabled worker can use the authenticated Drive app. Report that session attachment
  limitation explicitly rather than treating it as an authentication or file-permission failure.
- The authenticated connector resolved the exact `PsychSim documents` folder and its
  `Aggregate sharepoint notes` native Doc. The connector supplied a valid DOCX export without
  exposing document prose in logs. The fixed private file is 93,214 bytes with SHA-256
  `8fedf00c83190f6a3661bf820382b76d27a59ce3d425b02202a7fe8b797f03c1`.
- The file entered the ordinary protected inbox, scanned as
  `source-manifest.8fedf00c83190f6a36.97f972a7`, and extracted as
  `source-document.8fedf00c83190f6a3661`. The original now remains mode `0600` under processed
  storage. Parser-v1 through parser-v4 artifacts are archived as four private history revisions.
- Parser v5 detected 24 top-level heading instances, three nested heading instances, and one
  unsectioned preamble across 39 chunks, of which 38 are sectioned. All chunks have verified
  locator/body provenance hashes, and every sectioned chunk has a deterministic section-boundary
  instance. It records one unrecognized Word `Title` style; the first semantic packet must resolve
  whether that paragraph is front matter or a logical boundary. This completes only discovery,
  exact-byte download/hash verification, and extraction. No semantic unit has been reviewed, no
  candidate has been created, no database or rule has changed, and no content has been
  incorporated into runtime.
- The folder also has the mobile review bundle described below. Source discovery intentionally
  retains eight candidates because a feedback export is not clinical source material.
- The three new candidates are native Docs: `Aggregate sharepoint notes`, `Additional notes`, and
  `Brief Therapy Vignettes`. Account-specific IDs/timestamps remain only in the ignored discovery
  manifest; none is publicly shared.
- `Additional notes` was selected first, downloaded through a non-inline connector attachment,
  verified as a 13,765-byte DOCX with SHA-256
  `804ac28de2b1e8a6836082b1f4f0c461baf3ad60c5478b2e51353bceab4378bf`, then scanned and extracted
  locally as `source-document.804ac28de2b1e8a68360`. No document body was printed or inspected.
- The Drive discovery manifest has eight candidates. Aggregate notes, Additional notes, WHO, and
  CANMAT have local verified bytes and extraction. Psychotic depression, QTc/TdP Funk review, Pink
  Book 2021, and `Brief Therapy Vignettes` remain discovered only, with no local bytes, SHA-256,
  manifest entry, or extraction. Continue one source at a time; do not bulk-pull the remaining
  queue.
- Safe next source intake:
  1. build one local immutable source-review snapshot around one bounded aggregate heading unit;
  2. present only a concise summary, atomic proposals, uncertainty, currentness, rights state, and
     affected public IDs in the existing Developer ticket flow;
  3. save the psychiatrist's free-text response with that exact packet snapshot;
  4. let canonical Codex create the smallest separate versioned candidate changes;
  5. audit any accepted implementation through Database entries and affected patient/reference
     runs before proceeding to the next unit.
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
- `docs/DECISIONS.md` (through D-141)
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
- `apps/web/src/components/DatabaseBrowser.tsx`
- `apps/web/src/database-review.ts`
- `apps/web/src/components/EncounterView.tsx`
- `apps/web/src/components/ReceiptView.tsx`
- `apps/web/src/styles.css`
- `apps/web/src/distribution.ts`
- `apps/web/src/review-export.ts`
- `packages/engine/src/services.ts`
- `tools/content-cli/src/apple-notes-provider.ts`
- `tools/content-cli/src/source-pipeline.ts`
- `tools/content-cli/src/source-pipeline.test.ts`
- `tools/content-cli/src/validate-source-discovery.ts`
- `tools/content-cli/src/apple-notes-codex-review.ts`
- `tools/content-cli/src/personal-knowledge-workspace.ts`
- `content/catalogs/authoring/personal-knowledge/initial-mdd-antidepressant-selection.profile.json`
- `apps/web/src/components/PersonalKnowledgeWorkbench.tsx`
- `apps/web/personal-knowledge-workbench-plugin.ts`
- `packages/schemas/src/index.ts`
- `packages/content-runtime/src/public-clinical-catalog.ts`
- `packages/content-runtime/src/medication-identities.ts`
- `content/catalogs/medications/identities/`
- `tools/content-cli/src/personal-knowledge-inventory.ts`
- `tools/content-cli/src/refresh-ticket-literature.ts`
- `content/cases/blueprints/reviewer-cohort/reviewer-assignment.tickets.json`
- `content/catalogs/reactions/reaction-concepts.json`
- `tests/e2e/reviewer-mobile.spec.ts`
- `.github/workflows/pages.yml`

## Exact next action

1. In local Developer mode, inspect the first source-boundary ticket as a workflow check. It can
   support only “keep quarantined/no change”; it intentionally lacks the private context required
   to decide whether the Word `Title` paragraph is front matter or a new authored unit.
2. The next bounded engineering task is a safe adapter from the already acknowledged, already
   classified Apple Notes source revision into one half-page immutable review packet. Reuse its
   existing packet/model/prompt audit and seven medically unreviewed opinion candidates; do not
   reread OCR/HTML/attachments or create runtime content. This is the first immediately available
   semantic packet.
3. After that packet is reviewed, canonical Codex should create only the smallest separate
   bibliography, Developer-opinion, identity, source-gap, balance, or no-change proposal. Any
   accepted clinical change still requires explicit implementation plus Database/rule-trace and
   affected-patient/reference-run audit.
4. Continue the remaining 12 MDD Notes revisions one complete revision at a time only through
   their source-specific acknowledgment boundary. Do not expand the hard-coded MDD profile until
   source-revision ownership/reuse and packet supersession are designed.
5. For formal sources, finish existing queues rather than duplicate them: resolve the CANMAT
   corrigendum impact, complete WHO DEP1–DEP4 review, atomize one BAP recommendation while excluding
   BFCRS instrument content pending rights review, and complete the VA/DoD item-level rights audit
   before semantic indexing.
6. Transfer one of the four remote-only Drive candidates only when a connector-enabled canonical
   worker can preserve its exact bytes, hash, rights state, and manifest entry. Never report those
   four sources as extracted before that happens.
7. After any user Database/ticket/patient review, read `databaseEntryReviews`, `tickets`,
   `attemptReviews`, and completed snapshots from the exact saved/exported bundle. Saving a comment
   is never automatic clinical approval or authorization to alter a rule.

Keep this mechanism-heavy checkpoint on `beta` until the user explicitly authorizes promotion.
`main` and the public Pages Reviewer remain on the prior released checkpoint. Do not implement a
bulk medication importer, infer guidance from lexical matches, invent missing therapy/diagnosis
rules, begin Milestone 4, add a service worker, expose private source material, or make
identity-only records selectable in gameplay.
