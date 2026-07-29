# PsychSim project state

Last updated: 2026-07-28

## Operational handoff

- Canonical Codex thread: `019f86e1-8867-7143-b2e9-e93d7f25db8b`, generation 1.
- Canonical branch: `beta`, tracking `origin/beta`. Local database-first dependency work stays on
  `beta` and is intentionally batched without per-decision pushes, browser/app verification, or
  Pages checks. Complete gates and remote promotion occur only at a deliberate integration
  checkpoint or explicit user request, after which the checkout returns to `beta`.
- Current phase: Milestone 3 is complete. The bounded work is still the pre-Milestone-4
  clinical-authoring, knowledge-database, review, and scoring-engine checkpoint. Do not begin
  departments or longitudinal-care simulation.
- Current checkpoint implements the D-159 rule-combination engine plus accepted architecture
  Decisions D-160 through D-190. D-163 makes the private, sourced knowledge database the
  foundation and the game a focused compiled projection. D-164 establishes one source file with
  many linkable units, primary topical ownership, generated reverse links, and dedicated
  relationship files only when no natural owner exists. D-165 establishes sparse, independently
  derived dossier readiness with a strict simplicity ceiling: no entry-wide approval state,
  percentage, duplicated status matrix, or runtime dependency. D-166 establishes input-driven
  wide-but-shallow identity capture: every potentially relevant concept receives a stable candidate
  bin and review determines its final identity/alias/merge/relationship/unresolved outcome. D-167
  establishes compact, question-specific source-review packets with an appropriate evidence-depth
  budget, explicit stop rule, and a findable bibliographic reference plus access limitation even
  for abstract-only review. D-168 establishes sparse diagnosis-family dossiers whose broad routes
  can score complete best-next-step regimen transitions over complex current regimens and prior
  trials. It also permits clearly quarantined source leads and developer-side authoring inferences
  in sparse sections without treating them as evidence, opinion, rules, points, or runtime
  content. D-169 establishes a shared intervention-dossier envelope with type-specific medication
  and psychotherapy modules and complex regimen-transition support. A future reviewed, exact FDA
  on-label match may contribute one minor +10 regulatory-alignment modifier without defining the
  primary route or penalizing off-label care. D-170 establishes one canonical resolved finding per
  patient and keeps test definitions, reveal actions, generation tendencies, and post-submit
  scoring as separate owners. Its additive implementation provides the canonical
  identity/resolved-value/contributor schemas without changing any clinical association,
  probability, point rule, patient, or compatibility snapshot.
  D-171 clarifies that a focused psychiatry encounter may remain highly textured and
  diagnostically muddy: bounded template-owned comorbidity groups, extensive prior treatment,
  uncertain chart labels, and surface symptom overlap are valid, while symptom counts alone
  neither create diagnoses nor trigger finding cleanup. D-172 retires “no safe route” as a
  patient-generation rejection concept: only malformed or literally contradictory same-scope
  state invalidates generation, while missing clinical/rubric coverage creates a nonblocking
  diagnostic and ticket. D-173 establishes two-stage rule promotion: one explicit qualitative
  psychiatrist review, followed by separately labeled provisional D-156-band points for
  Developer/Reviewer play without a second clinical review.
  D-174 keeps diagnosis dossiers setting-, difficulty-, time-, and treatment-intensity-independent;
  case/encounter recipes own the focused decision and complexity envelope; static authoring
  prepares reusable files rather than resolved patients; and deterministic browser-runtime
  composition remains deferred behind a general dependency-readiness gate. Ticket priority now
  proceeds through identity/governance, general patient-state and finding owners, tests/actions and
  intervention owners, dossier relationships, reviewed decision/scoring policies, compiler
  mechanics, and only then generated cohorts. Thin diagnosis dossiers may be used early to discover
  dependencies but cannot bypass the gate.
  D-175 makes reusable finding identity atomic and conservative: aliases are interchangeable
  wording only; facts stay distinct when time, source, specificity, or value can differ; typed
  records and measurements keep their real owners; and ambiguous collisions remain one-at-a-time
  review items rather than automatic merges.
  D-176 sets a decision-relevant granularity ceiling for the game: a psychiatrist reviewer may
  approve one identity for adjacent descriptions that ordinarily do not change the focused
  best-next-step decision, while source wording/provenance remains available for a later split.
  The first application treats loss/reduction of interest or pleasure as one anhedonia identity.
  D-177 separates patient truth, assessment/item response, and surface wording. The broad current
  self-reported fatigue/low-energy complaint does not replace its possible contributors:
  sleepiness, weakness, psychomotor slowing, medication sedation, exertional intolerance, and
  later reviewed facts remain independently resolvable. Standardized responses require explicit
  item-owned mappings; unstandardized history uses deterministic expression banks whose phrases
  may overlap. Every projection must be frozen before play with all contributor IDs, while aliases
  remain identity-equivalent and wording never drives rules or points.
  DBQ-010 was explicitly approved on 2026-07-28: MDD is the first deep knowledge/database
  dependency vertical, with no setting or difficulty ceiling, and generalized patient generation
  remains disabled. The first dependency-readiness audit is now recorded in
  `docs/ENCOUNTER_GENERATION_DEPENDENCIES.md`; it routes missing reusable owners to authoritative
  tickets without adding clinical rules, probabilities, points, or runtime behavior.
  `ticket.catalog.findings.canonical-definition-boundary` and the unambiguous portion of
  `ticket.catalog.findings.general-psychiatry-seed` are now resolved. The strict runtime catalog
  registers 41 medically unreviewed, identity-only findings. The 37-candidate audit plus subsequent
  reviewed defaults now route duration and subjective burden to typed owners and resolve
  grandiosity, impulsivity versus concrete behavior, preparatory-behavior timing, weapon access
  versus concern, and reported versus observed thought disorganization without forcing them into
  unsafe aliases. Paranoia remains presentation/search vocabulary while suspiciousness, ideas of
  reference, and persecutory ideation have distinct shells. The accepted
  `ticket.schema.patient-state.latent-proposition-evidence-foundation` now owns latent proposition
  truth, source-specific patient-scene evidence, dependency handling, and belief appraisal. The
  accepted
  `ticket.catalog.findings.subjective-presentation-projection-foundation` owns the future typed
  projection boundary; current `FindingBlueprint`, `ResolvedFinding`, case instances, saves,
  replay, generation, and scoring remain unchanged.
  D-178 makes the current database-foundation loop intentionally local and narrow: one decision or
  owner at a time, smallest relevant schema/content validation, and no routine GitHub push,
  Actions/Pages observation, browser suite, portable-app build, or app-server work. Full app and
  release gates resume only for an affected surface, an explicit integration request, or the
  realistic-patient-generation readiness checkpoint.
  D-179 generalizes source, observation modality, and time scope across symptom clusters. Current
  report, historical report, collateral, records, MSE/physical observation, and instrument response
  remain independently resolvable when they can disagree, while a compact player-facing action may
  group them. Discordance is valid and does not imply minimization, secondary gain, poor insight,
  or another explanation unless separately authored. Scope combinations remain input-driven rather
  than pre-enumerated.
  D-180 keeps paranoia as overlapping presentation/search vocabulary while separately resolving
  current self-reported suspiciousness or mistrust, ideas of reference, and persecutory ideation.
  Belief content, world-state truth, belief appraisal, and clinical interpretation remain separate.
  The strict runtime catalog now registers 41 medically unreviewed identity-only findings; the
  initial 37-candidate semantic-collision tranche is resolved without migrating compatibility
  cases.
  D-181 establishes a fourth patient-state layer for explicitly modeled adjudicable encounter
  propositions. A proposition resolves true or false before play; patient, collateral, record,
  examination, and test claims resolve separately with exact source, shared-origin, and known
  dependency links. Copied or correlated evidence cannot become independent corroboration through
  counting or naïve multiplication. A false proposition is not automatically a delusion,
  patient-scene evidence is distinct from formal literature provenance, and no reliability
  probability, scoring rule, diagnosis inference, or runtime generator is activated.
  D-182 explicitly rejects a generic evidence-convergence or case-winnability validator.
  Realistically ambiguous, incomplete, or collectively misleading reports remain valid patient
  state and do not trigger retry or quarantine. The later rubric supports blank, broad,
  unspecified, multiple-defensible, and conservative coverage responses when exact certainty is
  not justified; missing support remains a nonblocking coverage gap.
  D-183 implements the narrow point-free proposition/evidence envelope with exact authored or
  deterministic provenance, shared-origin/correlation groups, belief appraisal, and no
  convergence requirement. D-184 adds explicit versioned finding/reveal projections and
  runtime-excluded expression banks; mappings are never inferred from aliases or phrase overlap.
  D-185 adds neutral typed numeric-measurement and categorical-observation owners without medical
  ranges or interpretation defaults. D-186 adds structured numeric, categorical, binary, imaging,
  and electrical-study result contracts to all current test files while leaving critical values
  patient-owned. D-187 composes the complete future `ResolvedPatientState` payload from distinct
  internal conditions, chart claims, regimen/history/reactions, findings, measurements/tests,
  duration, burden, context, and proposition evidence. It preserves repeated identities and
  contradictory records without inference, points, generation, or compatibility migration.
  D-188 adds a deliberately small objective exposure boundary: medication and supplement
  identities are reused, only other substances receive new identity shells, and an optional
  source/opinion-backed misuse prior contains one probability given use plus medication-only
  prescribed/nonprescribed multipliers. The future patient snapshot stores only positive use
  entries and the frozen misuse Boolean; assessment evidence, intoxication, withdrawal, diagnosis,
  attribution, points, and runtime generation remain separate.
  D-189 keeps psychotherapy encounter semantics deliberately small. Source contributions and
  diagnosis dossiers may preserve language about a course or program, but submitted treatment and
  scoring contain only the stable modality ID and mean “recommend this intervention now.” Current
  treatments and dispositions now have one file-backed editing surface with exact registry
  membership. No delivery, duration, practitioner, fidelity, completion, clinical mapping, point
  value, or runtime behavior was added. Prior psychotherapy remains structured historical patient
  state and is already revealed through the full psychiatric treatment-history action.
  D-190 keeps medication-change input concrete: starts plus entry-targeted continue, increase,
  reduce/limit, taper, or stop operations. A focused reviewed diagnosis route or decision policy
  owns explanatory meanings such as replacement, augmentation, or simplification. The new
  runtime-excluded medication-regimen knowledge catalog provides empty, point-free bins for
  explicit medication classes/memberships, focused routes, and independently traceable
  contributors. Free-text classes, arbitrary tags, and medication count cannot create a class,
  duplicate, interaction, or penalty; no clinical relationship, route, points, cross-taper rule,
  compatibility score, or medical approval was activated.
  The remaining database architecture choices are dependency-ordered in
  `docs/DATABASE_FIRST_DECISION_QUEUE.md`.
- Expected Git state after recording D-190 and the user's explicit backup request: local `beta`
  is clean and matches `origin/beta`. This backup does not promote the distribution branch;
  `main` remains at its prior published checkpoint. Inspect actual refs rather than assuming
  `main` contains the database-foundation commits.
- Current local checkpoint message after this bounded decision:
  `Add route-owned medication regimen foundation`. Inspect `HEAD` for its exact hash and use that
  committed base for read-only adjunct packet assignments.
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
   “Focused” limits the immediate decision horizon, not patient complexity: a template may own
   multiple required or bounded-selected conditions, long treatment histories, polypharmacy,
   uncertain chart labels, and overlapping findings.
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
8. Every nonexact treatment result is labeled engine-inferred. Applied, replaced, deduplicated,
   suppressed, and omitted contributors must remain explainable after submission.
9. The personal knowledge database is a first-class learning product. It preserves the developer's
   notes, authored material, formal sources, interpretations, disagreements, staleness, and gaps.
   The game is a focused compiler over reviewed decision-relevant knowledge, not a display of the
   complete dossier.
10. Knowledge coverage is a sparse local-Developer projection, not a completion percentage. It
    preserves `unknown` separately from `missing`, names exact supporting IDs, loads lazily per
    entry, never filters unmatched material, and cannot approve or activate a claim.
11. Patient-scene evidence need not converge on hidden truth. Realistic diagnostic uncertainty,
    broad or unspecified formulations, and conservative treatment coverage are valid focused
    outcomes; only literal malformed state automatically invalidates generation.

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
- Engine `0.6.0` adds one pure final rule-combination pass. Stable `effectId` plus explicit
  specificity permits replacement only for the same effect; stable `issueId` collapses duplicate
  negative consequences to the worst row; distinct fit effects stack; and a true medication
  contraindication suppresses explicitly identified positive base/fit rows for the same
  treatment. Serious nonabsolute risk penalties do not suppress legitimate benefits. Every
  resolved contributor remains in the saved receipt trace with its original points, controlling
  rule, and `applied`, `replaced`, `deduplicated`, or `suppressed` status.
- Case/catalog validation rejects equal-specificity ambiguity for one effect. Synthetic engine
  tests cover replacement, stacking, worst-only harm, hard-contraindication suppression,
  nonabsolute benefit/risk visibility, deterministic tie-breaking, and safety-error/cap
  deduplication. No current clinical rule or point magnitude changed.
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
- The queued target compiler is now explicit:
  `PatientTemplate → PatientInstance → EncounterInstance + CompiledRubric`. Diagnosis families own
  reusable disorder variants, so the MDD record owns mild/moderate/severe while a template selects
  one state and adds only narrow constraints. `CaseBlueprint` remains the historical compatibility
  snapshot. `PatientTemplate` is the current technical name for a source-controlled case/encounter
  recipe, not a pre-generated person. Its setting, focused decision, complexity envelope, and
  presentation limits never belong to MDD. Runtime migration is not the next task: it remains
  blocked until the general dependency-readiness audit and shared-finding foundation are complete.
- A shared finding must resolve once with every contributing owner and then project into all
  relevant investigation views. The GAD Reviewer feedback is preserved as a blocking historical
  attempt ticket; no probabilities or clinical rules changed.
- The 2026-07-28 dependency audit found 621 nested finding occurrences and 186 finding IDs across
  the five approved/review case files, with 112 IDs reused across files. The canonical
  finding-definition boundary and 41-definition wide/shallow seed are implemented and validated.
  Point-free proposition/evidence, presentation-projection, measurement/exam, structured-test, and
  complete resolved-patient-state owners are now present. Runtime compilation and compatibility
  migration remain deliberately disabled. The first unresolved dependency is reusable
  substance/background-exposure state; medication/intervention normalization and the focused
  decision-policy compiler follow it. No patient, scoring rule, result probability, exposure
  prevalence, or treatment guidance was generated.
- The player-facing navigation target is History, Physical exam, Testing, Diagnosis, and Treatment.
  Testing will combine labs, imaging, electrical studies, and named instruments in one searchable
  presentation group while retaining their backend types.

## Private source and local data state

- The protected source manifest contains 212 entries, 212 unique byte-level SHA-256 hashes, and 212
  `extracted` statuses. There are no quarantined source-document failures. One semantic duplicate
  group is intentional: two DOCX exports of the current SharePoint revision have different package
  bytes but the same extracted-text hash, 39 chunks, and warning provenance.
- The protected source tree currently contains 1,328 non-placeholder files totaling 507,441,148
  bytes. It includes 204 Apple Notes composites plus attachments/OCR history, four formal PDFs,
  Drive DOCX revisions, extracted records, and local manifests.
- The ignored `content/generated/` tree currently contains 25 active authoring/review artifacts
  totaling 4,875,646 bytes: provenance packets, literature-scout snapshots, Drive Reviewer bundles,
  the human review handoff, private knowledge projections, and source-review state.
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
- The official Google Drive plugin is installed and enabled, and project config requests its
  read-only tools in future trusted sessions. This canonical session did not receive the app tool
  attachment. A machine-local read-only rclone fallback now powers `pnpm content:drive:status` and
  `pnpm content:drive:sync`; `pnpm content:drive:pull` admits exactly one discovered source after
  its identity/rights gate, so the user no longer needs to download files manually. The latest
  status sees 11 remote files, eight source candidates, three review bundles, zero new sources,
  zero changed admitted sources, and zero missing local review bundles.
- Two current export-version-7 review bundles are available privately. The older export-version-5
  bundle is retained in quarantine because it lacks the current `databaseEntryReviews` field and
  uses an incompatible export version; it was not discarded or treated as imported.
- The rclone credential remains outside the repository and the remote has read-only Drive scope.
  Its shared Google OAuth client is scheduled for retirement during 2026; replace it with a private
  read-only OAuth client before that cutoff. This is the remaining durability risk.

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

The complete D-159 checkpoint passed on 2026-07-27:

- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, and `git diff --check`;
- `pnpm test`: 53 test files / 390 tests plus 10 Python handoff tests;
- `pnpm content:validate`, `pnpm content:sources:validate`, and
  `pnpm content:diagnoses:validate`;
- `pnpm demo:reference-runs`, with both existing finite policy sets unchanged;
- `pnpm build` with Player bundle-safety scan;
- `pnpm build:reviewer` with portable Reviewer bundle-safety scan;
- `pnpm test:e2e`: five Player/Developer browser tests; and
- `pnpm test:e2e:reviewer`: four portable Reviewer tests at 390-pixel and 320-pixel widths.

The first sandboxed invocations of the three tsx content validators could not open their local IPC
sockets; each passed unchanged when rerun outside that filesystem sandbox. Builds retain the
existing advisory large-chunk warning. Tests retain the existing PDF standard-font warning and
Node `module.register()` deprecation notice; none is a product/test failure.

The Drive/compiler-queue checkpoint passed on 2026-07-27:

- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, and `git diff --check`;
- `pnpm test`: 54 Vitest files / 398 tests plus 10 Python handoff tests, including eight focused
  Google Drive planner tests;
- live `pnpm content:drive:sync`, followed by an idempotent status of zero missing bundles and zero
  changed sources;
- `pnpm content:validate`, `pnpm content:sources:validate`, and
  `pnpm content:diagnoses:validate`;
- `pnpm content:knowledge:crossref` plus its validator after the private corpus fingerprint changed;
- `pnpm demo:reference-runs`, with existing finite policy results unchanged;
- `pnpm build` and `pnpm build:reviewer`, including both bundle-safety scans;
- `pnpm test:e2e`: five Player/Developer browser tests; and
- `pnpm test:e2e:reviewer`: four portable Reviewer tests at 390-pixel and 320-pixel widths.

The first sandboxed tsx/loopback invocations failed only because the managed sandbox denied their
local IPC socket or loopback listener; each passed when rerun with the required local permission.
The existing large-chunk, PDF standard-font, npm environment, and Node `module.register()`
warnings remain advisory.

The database-first decision-queue checkpoint through D-174 passed on 2026-07-28:

- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, and `git diff --check`;
- `pnpm test`: 54 Vitest files / 398 tests plus 10 Python handoff tests;
- `pnpm content:validate`, `pnpm content:sources:validate`, and
  `pnpm content:diagnoses:validate`;
- `pnpm demo:reference-runs`, with existing finite policy results unchanged;
- sequential `pnpm build` and `pnpm build:reviewer`, including both bundle-safety scans;
- `pnpm test:e2e`: five Player/Developer browser tests; and
- `pnpm test:e2e:reviewer`: four portable Reviewer tests at 390-pixel and 320-pixel widths.

An initial parallel Player/Reviewer build was invalid because both commands intentionally share the
same `apps/web/dist` output and the Reviewer build replaced the Player artifact before its safety
scan. Both builds passed when rerun in the required sequence; no code or bundle-boundary defect was
found. The sandboxed content-validator and browser-test invocations again required their existing
local IPC/loopback permission and passed unchanged outside that restriction. The first D-174
content-validation pass correctly rejected the new general-dependency ticket until it received the
required explicit architecture exemption from clinical literature scouting; the repaired ticket
catalog then passed.

The DBQ-010 dependency-readiness audit checkpoint passed on 2026-07-28:

- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, and `git diff --check`;
- `pnpm test`: 54 Vitest files / 398 tests plus 10 Python handoff tests;
- `pnpm content:validate`, `pnpm content:sources:validate`, and
  `pnpm content:diagnoses:validate`;
- `pnpm demo:reference-runs`, with both existing finite policy sets unchanged;
- sequential `pnpm build` and `pnpm build:reviewer`, including both bundle-safety scans;
- `pnpm test:e2e`: five Player/Developer browser tests; and
- `pnpm test:e2e:reviewer`: four portable Reviewer tests at 390-pixel and 320-pixel widths.

The first sandboxed invocations of the three tsx validators failed only because the managed
sandbox denied their local IPC sockets; each passed unchanged with the required local permission.
The existing large-chunk, PDF standard-font, npm environment, and Node `module.register()`
warnings remain advisory.

The canonical finding boundary, general-psychiatry identity seed, and first reviewed
decision-granularity resolution passed on 2026-07-28:

- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, and `git diff --check`;
- `pnpm test`: 55 Vitest files / 408 tests plus 10 Python handoff tests;
- `pnpm content:validate`, `pnpm content:sources:validate`, and
  `pnpm content:diagnoses:validate`;
- `pnpm content:knowledge:crossref`, required once to refresh the private projection fingerprint
  after the runtime catalog changed;
- `pnpm demo:reference-runs`, with both existing finite policy sets unchanged;
- sequential `pnpm build` and `pnpm build:reviewer`, including both bundle-safety scans;
- `pnpm test:e2e`: five Player/Developer browser tests; and
- `pnpm test:e2e:reviewer`: four portable Reviewer tests at 390-pixel and 320-pixel widths.

The first sandboxed content-validation and reference-run invocations again failed only because the
managed sandbox denied the local tsx IPC socket; the identical direct local commands passed. The
private cross-reference projection was regenerated after the catalog changed, then source
validation passed. Both local servers returned HTTP 200. Existing large-chunk, PDF standard-font,
npm environment, Vite chunk-size, color-environment, and Node `module.register()` warnings remain
advisory.

The fatigue/energy identity and subjective-presentation architecture checkpoint passed on
2026-07-28:

- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, and `git diff --check`;
- `pnpm test`: 55 Vitest files / 408 tests plus 10 Python handoff tests;
- focused canonical-finding/content tests: 61 tests;
- `pnpm content:validate`, `pnpm content:sources:validate`,
  `pnpm content:diagnoses:validate`, and `pnpm content:knowledge:crossref:validate`;
- `pnpm content:knowledge:crossref`, required once to refresh the private projection fingerprint
  after the runtime catalog changed;
- `pnpm demo:reference-runs`, with both existing finite policy sets unchanged;
- sequential `pnpm build` and `pnpm build:reviewer`, including both bundle-safety scans;
- `pnpm test:e2e`: five Player/Developer browser tests; and
- `pnpm test:e2e:reviewer`: four portable Reviewer tests at 390-pixel and 320-pixel widths.

The first sandboxed `pnpm content:validate` and Player browser-test invocations failed only because
the managed sandbox denied their local IPC socket or loopback listener; the identical direct or
permissioned commands passed. Existing large-chunk, PDF standard-font, npm environment, Vite
chunk-size, color-environment, and Node `module.register()` warnings remain advisory.

The D-179 source/time-scope batch passed its deliberately narrow local gate on 2026-07-28:

- 75 focused canonical-finding, runtime-content, Developer-ticket, and literature-attachment tests;
- direct content/catalog/registry validation;
- Developer database cross-reference regeneration and validation: 206 documents, 234 source units,
  89 retained identity gaps, and 16 overlapping terms; and
- focused formatting plus `git diff --check`.

No application build, browser suite, app-server check, GitHub push, Actions observation, Pages
check, reference-run replay, or complete repository gate was run; D-178 intentionally defers those
until an affected surface or integration checkpoint.

The D-180/D-181 paranoia and latent-proposition architecture batch passed its deliberately narrow
local gate on 2026-07-28:

- 75 focused canonical-finding, runtime-content, Developer-ticket, and literature-attachment tests;
- direct content/catalog/registry validation;
- Developer database cross-reference regeneration and validation: 206 documents, 234 source units,
  89 retained identity gaps, and 16 overlapping terms; and
- focused formatting plus `git diff --check`.

The first sandboxed cross-reference rebuild failed only because the managed sandbox denied its
local tsx IPC socket; the identical permissioned command passed. No proposition/evidence schema,
conditional reliability value, scoring rule, case migration, patient generator, application build,
browser suite, app-server check, GitHub push, Actions/Pages observation, reference-run replay, or
complete repository gate was added or run.

The D-182 realistic-ambiguity decision passed its deliberately narrow local gate on 2026-07-28:

- 14 focused Developer-ticket and literature-scout tests;
- direct content/catalog/registry validation; and
- focused formatting plus `git diff --check`.

No schema, runtime rule, scoring behavior, patient generator, application build, browser suite,
app-server check, GitHub push, Actions/Pages observation, reference-run replay, cross-reference
rebuild, or complete repository gate was added or run.

The D-183 through D-187 point-free patient-state foundation passed its deliberately narrow local
gates on 2026-07-28:

- proposition/evidence foundation: 30 focused schema/Developer/scout tests;
- subjective-presentation projection foundation: 83 focused schema/runtime tests;
- neutral measurement/exam foundation: 79 focused schema/runtime tests;
- structured test-result foundation: 72 focused schema/runtime/Developer tests;
- complete resolved patient-state foundation: 48 focused schema/Developer tests;
- direct content/catalog/registry validation after every content-bearing slice;
- root `pnpm typecheck` after the final composition; and
- focused formatting plus `git diff --check`.

All current test definitions now carry structured result contracts and the complete future patient
snapshot parses complex polypharmacy, repeated chart claims, long treatment history, structured
findings/tests, target-scoped duration/burden, and conflicting proposition evidence. No clinical
probability, diagnosis inference, point rule, patient generator,
compatibility migration, application build, browser suite, app-server check, GitHub push,
Actions/Pages observation, or reference-run replay was added or run.

The D-188 objective-exposure foundation passed its deliberately narrow local gate on 2026-07-28:

- 46 focused exposure, resolved-state, and Developer-ticket tests;
- direct content/catalog/registry validation, including cross-catalog identity-version checks;
- root `pnpm typecheck`; and
- focused formatting plus `git diff --check`.

The runtime-excluded catalog has four neutral other-substance identity shells and no authored
misuse priors. No epidemiologic rate, age/count distribution, evidence-projection rule,
intoxication/withdrawal record, diagnosis inference, point rule, patient generator, compatibility
migration, application build, browser suite, app-server check, GitHub push, Actions/Pages
observation, or reference-run replay was added or run. The next bounded review owner is
`ticket.catalog.interventions.identity-and-fidelity`.

The D-189 therapy-modality boundary passed its deliberately narrow local gate on 2026-07-28:

- 71 focused strict-schema, runtime-content, registry, and Developer-ticket tests;
- root `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`;
- direct content/catalog/registry validation, including exact treatment membership; and
- `git diff --check`.

The first sandboxed `pnpm content:validate` invocation failed only because the managed sandbox
denied the local tsx IPC socket; the identical permissioned command passed. The aggregate
treatment file was replaced by sixteen stable per-treatment/disposition files without changing
their IDs, order, selections, source mappings, clinical rules, points, or runtime behavior. No
application build, browser suite, app-server check, GitHub push, Actions/Pages observation,
reference-run replay, or complete repository gate was run under D-178. The next bounded review
owner is `ticket.catalog.medications.normalized-regimen-risk-benefit`.

The D-190 medication-regimen ownership boundary passed its deliberately narrow local gate on
2026-07-28:

- 36 focused strict-schema, compatibility-scaffolding, Developer-ticket, and runtime-boundary
  tests;
- root `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`;
- direct content/catalog/registry validation, including runtime exclusion, exact registry
  membership, medication/class version pins, regimen-entry references, and provenance links; and
- `git diff --check`.

The first sandboxed `pnpm content:validate` invocation again failed only because the managed
sandbox denied the local tsx IPC socket; the identical permissioned command passed. The
regimen-knowledge catalog is empty and authoring-only. No app build, browser suite, app-server
check, Pages promotion, reference-run replay, medication class or relationship content, points,
clinical rule, or compatibility-case behavior was added or run. The next bounded review owner is
`ticket.engine.decision-policy.catalog-compiler`.

## Files to read before continuing

Always read the startup contract files named in `AGENTS.md`. For the current checkpoint also read:

- `docs/DECISIONS.md` through D-190
- `docs/ARCHITECTURE.md`
- `docs/CONTENT_MODEL.md`
- `docs/CONTENT_REVIEW.md`
- `docs/DATABASE_FIRST_DECISION_QUEUE.md`
- `docs/ENCOUNTER_GENERATION_DEPENDENCIES.md`
- `docs/DOCUMENT_INGESTION.md`
- `docs/DIAGNOSIS_ENGINE.md`
- `docs/MEDICATION_AND_INTERVENTION_DATA.md`
- `docs/PATIENT_GENERATION_ENGINE.md`
- `docs/SCORING_AND_ECONOMY.md`
- `docs/SOURCE_USE_POLICY.md`
- `packages/engine/src/scoring.ts`
- `packages/engine/src/rule-combination.ts`
- `packages/engine/src/diagnosis-scoring.ts`
- `packages/schemas/src/index.ts`
- `packages/content-runtime/src/reviewer-policies.ts`
- `tools/content-cli/src/developer-database-knowledge.ts`
- `tools/content-cli/src/google-drive-sync.ts`
- `apps/web/src/components/DeveloperDatabaseKnowledge.tsx`
- `apps/web/src/components/PersonalKnowledgeWorkbench.tsx`
- `apps/web/src/components/ReceiptView.tsx`
- `content/catalogs/authoring/personal-knowledge/cross-reference-aliases.json`
- `content/catalogs/authoring/personal-knowledge/private-source-catalog.json`
- `content/cases/review/database-driven-patient-generation.tickets.json`
- `content/cases/review/drive-reviewer-feedback-2026-07-27.tickets.json`

## Exact next action

1. Present and resolve only
   `ticket.engine.decision-policy.catalog-compiler`: decide whether each encounter compiles exactly
   one primary decision policy, admits positive/supporting contributors only through explicit
   stable-ID links, and automatically includes only matching reviewed safety/prerequisite
   guardrails. Do not scan every active diagnosis or the whole database for positive points.
2. If approved, implement only the point-free decision-policy catalog, compiled-rubric ownership,
   frozen provenance/version references, and nonblocking coverage diagnostics. Keep current
   case-local rubrics as compatibility fixtures; do not add clinical guidance, points, generated
   patients, or a general-purpose expression language.
3. Continue through the authoritative ordered queue in
   `docs/ENCOUNTER_GENERATION_DEPENDENCIES.md`; the decision-policy compiler now precedes
   shared-finding compilation. Do not substitute an MDD-local owner for a missing general file.
4. Only after the complete general foundation is ready, implement
   `ticket.engine.patient-generation.shared-finding-compiler` with deterministic
   conflict/replay/provenance tests.
5. Only after the dependency gate and shared-finding work are complete may
   `ticket.engine.patient-generation.catalog-compiled-instances` add the versioned
   PatientTemplate/PatientInstance/EncounterInstance boundary while preserving historical
   CaseBlueprint snapshots. Generated cohorts and richness calibration remain later gates.
6. DBQ-011 remains deferred until one complete vertical exposes real maintenance costs. Other later
   bounded tasks, kept separate:
   - review MDD severity envelopes; ownership is resolved but thresholds remain disabled;
   - select current eating-disorder medical-instability and CANMAT/ISBD bipolar sources;
   - verify DRS-R-98 identity, validation scope, and reuse rights before adding it to Testing;
   - add real broad-category and unspecified diagnosis identities plus explicit reviewed ancestry;
   - harden medication-fit activation so unreviewed modifiers remain inert and true
     contraindications suppress positive fit;
   - continue foundational MDD, medication-family, psychotherapy, and common-interaction review
     packets before narrow augmentation topics;
   - continue private semantic processing one complete topic/source revision at a time;
   - split the private dossier loader into a compact index plus lazy per-entry payloads before it
     approaches the current 2 MB loader ceiling.

The sibling PsychSimDataAdjunct remains read-only. Its first safe medication-regimen evidence
assignment may pin the current committed `beta` HEAD and:

- `source-request.medications.regimen-combination-boundaries`;
- `ticket.source.canmat-mdd.inadequate-response-route`;
- `ticket.source.canmat-mdd.switch-transition-state`; and
- the exact target IDs already listed on that `SourceRequest`.

The adjunct must return only a hashed medically unreviewed packet. This canonical thread retains
stale-target/source-use validation, canonical IDs, database edits, review status, rules/points, and
all runtime validation.
