# PsychSim project state

Last updated: 2026-08-05

## Operational handoff

- Canonical Codex thread: `019f86e1-8867-7143-b2e9-e93d7f25db8b`, generation 1.
- Canonical branch: `beta`, tracking `origin/beta`. Local database-first dependency work stays on
  `beta` and is intentionally batched without per-decision pushes, browser/app verification, or
  Pages checks. Complete gates and remote promotion occur only at a deliberate integration
  checkpoint or explicit user request, after which the checkout returns to `beta`.
- Current phase: Milestone 3 is complete. The bounded work is still the pre-Milestone-4
  clinical-authoring, knowledge-database, review, and scoring-engine checkpoint. Do not begin
  departments or longitudinal-care simulation.
- Current checkpoint implements the D-159 compatibility and D-245/D-252/D-255 native generated
  scoring/replay engines plus accepted architecture Decisions D-160 through D-382. D-163 makes
  the private, sourced knowledge database the
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
  registers 61 medically unreviewed, identity-only findings. The 37-candidate audit plus subsequent
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
  The strict runtime catalog now registers 61 medically unreviewed identity-only findings; the
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
  D-191 adds the point-free decision-policy compiler boundary. Each target compiled encounter uses
  exactly one reviewed, version-pinned primary policy to own the focused dominant route, while
  reviewed secondary contributors may be discovered from any exact typed fact in the complete
  frozen patient when their exact action targets intersect the focused horizon. A semantic full
  scan and copied/re-fingerprinted in-memory reverse index must return the same ordered candidate
  set. The compiled trace freezes patient/action predicates and exact fact-to-record bindings;
  explicit same-record matching prevents false joins across repeated trials or regimen records,
  rejects cross-kind or unrelated singleton/context joins, and missing/unassessed state never
  becomes a negative. Unordered rule fields are normalized before freezing; the durable rubric ID
  uses the full 64-bit fingerprint suffix, and persisted data has a strict payload-integrity
  verifier that covers the exact patient-state and action-horizon IDs. Duration/burden facts retain
  source and time scope plus scale version, and tolerability-linked regimen operations must bind
  the exact subject entry so duplicate same-medication entries do not exchange modifiers. Approved
  policies/regimen records may use only approved formal contributions or accepted Developer
  opinions. Only canonical rule-reference kinds that current validation can resolve are active.
  Background diagnoses do not activate
  additional broad routes; labels, prose, aliases, free tags, point values, and file order never
  match. Matching safety/interaction and treatment prerequisites remain eligible; matching
  unreviewed content and missing coverage produce nonblocking diagnostics. The catalog is empty
  and runtime-excluded, so no clinical relationship, point, generated patient, compatibility
  migration, or gameplay behavior changed.
  D-192 records the independent PsychSimDataAdjunct boundary: its concept-first queue and hashed,
  medically unreviewed proposal bundles are separate from PsychSim ticket authority, while a
  snapshot-bound mapping may propose targets. PsychSim remains the only canonical writer and
  authority for IDs, source use, clinical rules, balance, and runtime. The safe whole-corpus
  Developer Database projection was deterministically refreshed and validated for adjunct coverage
  signals without exposing private source text.
  D-193 adds the pure point-free shared-finding compiler. Exact version-pinned upstream candidates
  resolve to one canonical value per definition with complete candidate/contributor/review
  dispositions; literal hard-value contradictions return exact stable audit records while
  uncertainty is aggregated separately. Explicit all/any reveal projections pin finding,
  proposition, evidence-source/time, expression-bank, target, response, and projection-horizon
  versions. Wording is deterministic but does not reroll from unrelated request material. Compiled
  outputs retain exact attachment identities, audit graph invariants, and payload fingerprints.
  Weighted/cardinality/background generation, real projection content, patient instances,
  compatibility migration, clinical rules, and points remain disabled.
  D-194 now atomically freezes the synthetic template/patient/encounter attachment. D-195 adds a
  separate template-owned, point-free presentation-richness expectation and exact frozen-state
  evaluator. Prior-effort shortfalls and inconsistent treatment-naive exceptions remain
  nonblocking authoring diagnostics and have no generation, rejection, scoring, or runtime
  authority. D-196 adds the standalone exact-template optional-condition profile and deterministic
  without-replacement selector with complete selected/unselected, draw, state, binding,
  provenance, explicit incompatibility, and fingerprint traces. Its weights mean game variety
  only. D-197 adds exact reviewed condition-finding/cardinality profiles and a deterministic
  selector. Required and bounded-selected outcomes become D-193 candidates while all unselected
  mappings, unbound conditions, draws, exact condition-state ownership, reviews, provenance, and
  fingerprints remain auditable. D-198 adds the separate lowest-priority background-outcome
  profile and selector, with one exact reviewed finite outcome set and deterministic game-only
  draw per bounded finding target. D-199 adds one complete nonnegative additive soft-tendency
  allocation over the same closed categorical outcome set, preserves the exact normalized
  synthetic draw, and emits one weighted candidate without deleting its D-198 baseline. D-200
  validates one complete resolved-condition source followed by D-197-through-D-199, retains the
  exact candidate union and complete D-193/D-194 request, and replays that request during
  standalone integrity before accepting the compiled snapshot or literal hard conflict. It
  preserves the encounter-owned runtime complexity envelope unspent. D-201 separately selects
  optional module identities against that one hard
  maximum, preserving required state outside the budget plus every count/candidate decision and
  spent/unspent value. D-202 maps the complete bounded comorbidity-module pool bijectively to the
  D-196 optional-condition pool and materializes required plus D-201-selected condition state
  without another draw or budget charge. Its separate bridge audit retains the normalized D-196
  configuration and D-201 provenance; it does not fabricate a D-196 selection artifact. D-203
  gives D-197 one strict genuine-D-196-or-D-202 source contract and native verifier, embeds the
  complete source, and preserves the historical D-196 draw/candidate key. D-204 carries that
  complete source through D-200, requires exact equality with D-197, and retains nested
  D-201/D-202 provenance while attaching only derived condition state/bindings to D-194. D-205
  maps every D-201 `allergy_reaction` candidate to one complete uninterpreted reaction-history
  alternative. Pairwise D-201 incompatibility guarantees zero-or-one materialization, while the
  original selected-module cost, ordinal, stable draw, total spent, and remaining budget remain
  unchanged. Its exact typed reference horizon and full D-201 artifact remain authoring
  provenance; it does not merge with base state or enter D-194/runtime. D-206 maps each D-201
  `prior_treatment` candidate to one nonempty positive history contribution. Compatible selected
  modules concatenate globally unique medication-trial, psychotherapy-trial, current-provider,
  and prior-level-of-care records without replacing required/core history or performing another
  draw, charge, adequacy inference, or outcome simulation. The original D-201 selection ordinals,
  stable draws, spending, and remaining budget remain unchanged. D-207 maps every D-201
  `substance_use` candidate to one nonempty positive-use exposure contribution. Compatible
  selected modules concatenate only across distinct semantic agents; same-agent alternatives must
  pin one exact version and already be incompatible in D-201. Authored recency, amount,
  prescription relationship, and misuse truth gain deterministic provenance from the original
  stable draw without another selection, probability calculation, or cost. These compilers are
  quarantined behind `@psychsim/engine/authoring`. D-208 is the single authoring-only attachment
  point for required/default and optional patient state: it verifies one exact D-201 artifact
  across the genuine condition source and every applicable D-205, D-206, and D-207 bridge,
  materializes each selected typed module exactly once, preserves D-201's unchanged complexity
  accounting, rejects record or semantic-agent collisions, and produces one deterministic
  complete pre-finding `ResolvedPatientState`. A selected unsupported `other` module yields an
  auditable `not_composed` artifact rather than reroll, substitution, refund, or patient
  invalidation. D-208 adds no selection, probability, clinical inference, points, persistence, or
  runtime behavior. D-209 makes that complete D-208 artifact D-200's only pre-finding patient
  source. It removes independently supplied condition, state, binding, and proposition context;
  derives the complete D-193/D-194 request; retains/replays the D-208 → D-193 → D-194 chain; and
  propagates blocked D-208 state before downstream compilation without fallback, reroll, or
  complexity refund. D-210 adds the standalone authoring-only whole-state tendency-applicability
  compiler. It verifies one composed D-208 state and genuine D-198 target artifact, semantically
  scans every supplied approved definition through exact typed facts and same-record joins,
  retains all matches/nonmatches plus exact record/profile/target/version provenance, and emits at
  most one D-199-ready binding per definition. Core and D-201-selected optional facts are equal
  inputs once frozen; D-201 remains the sole complexity selector/cost authority and D-199 remains
  the sole allocation/pooling/normalization/draw authority.
  D-211 advances D-200 to `4.0.0` and makes one verified D-210 artifact the sole source of D-199
  applicability bindings. D-200 derives the exact referenced profile and finding-definition
  subsets, retains and replays the resulting D-199 request/artifact, and keeps D-199 null when
  D-210 emits no bindings while preserving the full audit and D-198 baseline. A complication
  spends its D-201 module cost once; any number of exact downstream matches performs no additional
  complexity selection or spending.
  D-212 adds the schema-only structured non-finding reveal foundation. Closed chart, regimen,
  exposure, treatment-history, tolerability, and reaction lanes plus explicit reaction and
  safety-planning singleton fields now retain exact action fingerprint, patient, source, time,
  claim/dependency, included/omitted truth-record, presentation-status, and
  aligned/misaligned/indeterminate audit. A source may be partial or inaccurate without changing
  hidden truth, and an empty lane never silently becomes “none reported.” D-212 has no real
  source-report generation profile, reliability probability, wording, scoring, persistence,
  runtime behavior, or complexity authority; D-201 alone selects and spends optional modules.
  D-213 adds the standalone exact-catalog universal information-action result compiler. One
  versioned recipe per action routes only verified frozen D-193 projections, D-212 source views,
  measurements, categorical observations, and structured tests. Every catalog action retains a
  complete, incomplete-coverage, or outside-horizon evaluation; only complete in-horizon actions
  emit deterministic binding candidates. Missing sources never become fabricated negatives,
  malformed or stale frozen owners fail structurally, and instrument targets remain explicit
  diagnostics. D-214 advances reusable templates to `attachment_only.v2` with one exact static
  action-result assembly, makes D-194 build patient-specific D-212 envelopes only after final
  D-193 state, requires complete D-213 coverage, and derives every result binding without a caller
  fallback. The patient instance freezes only presentation-safe D-212 views, while the full audit
  remains in the authoring snapshot and replays through D-200 `5.0.0`. D-213/D-214 add no real
  recipe or source-report content, scoring, reveal behavior, persistence, runtime activation, or
  complexity authority. D-201 still spends a selected complication's authored cost exactly once
  regardless of downstream source/action count; information-action purchase points are separate.
  D-215 adds the standalone exact whole-lane structured source-report compiler. It consumes an
  already-selected approved behavior profile, resolves each declared lane or typed singleton once,
  fingerprints the exact patient/profile/definition/source-view payloads, and replays the complete
  transformation. It owns no probability selection, partial record filter, complexity spending,
  information-action cost, scoring, point value, persistence, runtime behavior, or D-194
  attachment.
  D-216 advanced its attachment contract to `attachment_only.v3`, catalog-instance
  compiler `3.0.0`, and D-200 `6.0.0`. One exact care setting—outpatient psychiatry, emergency
  department, inpatient psychiatry, or consultation-liaison—is frozen across template, location,
  and encounter. Care setting costs zero complexity and grants no capability, action, service,
  formulary, disposition, difficulty, reimbursement, or points. Every current runtime location is
  explicitly outpatient; real non-outpatient operational content and generalized runtime
  generation remain disabled.
  D-217 adds a neutral exact source-view horizon plus one reviewed care-setting-specific behavior
  selection profile. Each slot is fixed or selects among complete D-215 profiles through positive
  within-slot game-generation mass and an independent stable substream. The compiler verifies
  source coordinates, allowed source kinds, exact lane/singleton coverage, stable profile identity,
  fingerprints, all four care settings, and replay while consuming no patient truth or D-201
  budget. D-218 advances catalog-instance compilation to `4.0.0` and D-200 to `7.0.0`.
  D-194 now preflights the exact D-217 seed/template/assembly/setting context before D-193,
  runs D-215 only after final patient truth exists, derives the native D-212/D-213/D-214 chain,
  and retains/replays both complete authoring artifacts. Empty structured-definition horizons
  require null selection/report artifacts. No real source behavior, point, persistence, runtime
  generation, or non-outpatient operational content was added.
  D-219 advances the current attachment contract to `attachment_only.v4`, catalog-instance
  compiler `5.0.0`, and D-200 `8.0.0`. One exact authoring-only operational-admission artifact
  pins the template, physical location, focused action horizon, universal action catalog, and
  minimized service, formulary, medication-identity, and treatment projections. It evaluates every
  information action, start medication, current-regimen operation, intervention, and disposition
  against only the selected location's baseline capabilities, base formulary, disposition
  allowlist, and eligible service methods. The same explicit-resource algorithm passes synthetic
  outpatient, ED, inpatient-psychiatry, and consultation-liaison fixtures. Care-setting labels and
  neighboring locations grant nothing; staff-only methods remain pending explicit runtime context;
  current-regimen operations remain patient-state-owned. Incomplete access is itemized and blocks
  attachment without rerolling the patient or changing D-201. D-194/D-200 retain and replay the
  artifact and the encounter pins its ID/fingerprint. No cost, point, clinical route, real
  non-outpatient catalog, persistence, runtime generation, or UI was added.
  D-220 adds the standalone, point-free `instrument-item-response-only.v1` owner and compiler. It
  resolves one exact response option per D-193 instrument-item target only when the approved
  instrument/item version, complete response scale, information action, respondent source, time
  scope, and opaque rights boundary all agree. It retains the complete contributor and projection
  audit, returns an honest incomplete artifact for missing/stale ownership, and returns a complete
  empty artifact when no instrument target exists. It owns no item wording, score, total, cutoff,
  interpretation, probability, action cost, points, or D-201 spending.
  D-221 advances the attachment contracts to `attachment_only.v5`, universal action-result
  assembly v2, D-213 `2.0.0`, catalog compiler/D-194 `6.0.0`, and D-200 `9.0.0`. D-194 derives the
  minimized D-220 action context after final D-193 truth and supplies one complete artifact to
  D-213/D-214. The full D-220 audit remains at the snapshot root and nested in D-213; PatientInstance
  freezes only response/action/instrument/item/scale/option/time/respondent/rights identities.
  Every safe response must bind exactly once to its owning information action. Empty, multiple-item,
  missing-owner, omitted/duplicated response, valid-but-crossed owner, and tamper paths replay
  deterministically. The same explicit-resource-neutral chain passes outpatient, ED, inpatient
  psychiatry, and consultation-liaison fixtures, and a nonzero D-201 run remains byte-identical.
  No real instrument content, persistence, runtime generation, scoring, or UI was added.
  D-222 `2.0.0` projects exact resources for one selected built location from a complete
  clinic-wide assignment horizon, exact owner fingerprints, explicit exclusive/shared placement,
  and exact formulary membership; clinic-global and neighboring-location unions grant nothing.
  D-224 makes D-219 `2.0.0` consume that artifact and advances D-194 to `7.0.0` and D-200 to
  `10.0.0`, preserving the historical chain while requiring an independently recompiled
  validation-only current resource context. D-223 owns one D-201-through-D-208 pre-finding pass
  and spends each selected optional complication exactly once. D-225 advances D-200 to `11.0.0`
  and makes D-223 its single pre-finding root; no parallel D-208 root, reroll, refund, or second
  complexity authority remains.
  D-231 now materializes the sole lifecycle horizon upstream of D-226. Standard/Normal and
  Endgame accept only the explicit lifecycle-approved lane; local Developer may add a separately
  supplied lifecycle-review lane. Wrong-lane, blueprint, draft, deprecated, and duplicate stable
  IDs are rejected. Medical review, setting, resource coverage, weights, points, complexity, and
  run history do not affect lifecycle membership.
  D-226 `3.0.0` adds the authoring-only complete D-231 template × built-location admission matrix. It compiles
  D-222 once per location and admits only exact version-current, care-setting-matched pairs with
  exact action/result dependencies and complete D-219 mechanical coverage. The same algorithm
  covers outpatient psychiatry, emergency department, inpatient psychiatry, and
  consultation-liaison. Setting labels grant no resources; admission selects no patient, spends no
  optional complexity, and makes no clinical-winnability claim. Real non-outpatient catalog
  owners, persisted assignments, distribution/repeat/refill policy, compatibility save/runtime
  migration, and runtime activation remain disabled.
  D-227 replaces full mutable ClinicState retention in this chain with strict
  `clinic-operational-context.v1`. Facility, built locations, departments, owned upgrades and
  equipment, staff configuration, and formularies remain fingerprinted; labels, active location,
  aggregate capabilities, points, satisfaction, and Endgame/debug state do not. D-222 advances to
  `3.0.0`, D-219 to `3.0.0`, D-194 to `8.0.0`, D-200 to `18.0.0`, and D-226 to `3.0.0`. The pure
  projector and strict schema prevent unrelated clinic mutations from staling admission while
  retaining all material resource ownership.
  D-228 binds one caller-named, diagnostic-free admitted D-226 cell into a compact exact template,
  location, patient-pool, care-setting, D-222, and complete D-219 certificate after validating the
  full current matrix context.
  D-229 records that future generated-patient slots belong to exact physical locations. Compiler
  `2.0.0` validates current D-226 context, retains the complete sorted admitted horizon for that
  location, rejects empty or cross-location selection without global fallback, and nests D-228
  for the caller-selected local cell. D-200 advances to `14.0.0`, derives its historical operational
  roots from D-228, exact-matches the full D-228 and D-223 templates, and retains an independent
  current selected-location resource check. The same compiler covers outpatient psychiatry,
  emergency department, inpatient psychiatry, and consultation-liaison without selecting a
  patient, assigning weights/repeats/refills, drawing a seed, changing probabilities, spending
  complexity, or activating runtime generation. Normal begins outpatient-only; other settings
  require progression and real built owners. Endgame/Developer may broaden explicit template
  horizons but retain exact setting/location and gain no resources from mode. The compatibility
  aggregate `patientSlotCount` is not migrated.
  D-230 adds the authoring-only local template selector above D-229. A versioned
  location/template-fingerprint-pinned distribution profile supplies positive relative
  question-bank mass, never prevalence, clinical probability, points, difficulty, or complexity.
  Active-waiting and bounded recent-completion suppression match only the stable template ID,
  apply at most once each, remain positive, and retain match counts in the audit. One deterministic
  64-bit substream keyed by seed/location/slot draws from the exact current local horizon, then
  nests the selected D-229/D-228 proof. D-228, D-229, and D-230 are `2.0.0`; D-200 is now
  `18.0.0` and accepts D-230 only through D-233 as its sole slot root. The selector covers all four
  settings without independently assigning a patient seed, spending
  complexity, persisting/refilling a slot, or activating runtime generation. D-231 owns only
  static lifecycle membership; at that checkpoint Developer already-run behavior remained later
  queue state, and D-234 now supplies its authoring-only contract.
  D-232 adds separate authoring-only exact-location capacity and facility-transition proofs.
  Base slots and explicit capacity-upgrade contributions compile from a minimized capacity-only
  ownership/assignment context into stable authorized coordinates. A compact certificate is
  D-200's sole capacity authorization for D-230. A separate successor profile and atomic
  migration compiler preserve every frozen patient, seed, template, historical D-230/D-232
  proof, and source provenance while assigning target capacity and a fresh current D-226/D-228
  binding. Missing occupied mapping, insufficient capacity, or unavailable exact target
  admission blocks every commit; no patient is rerolled, dropped, truncated, or partially moved.
  FacilityDefinition.patientSlotCount, SaveData v5, the compatibility queue, persistence, refill,
  and UI remain unchanged.
  D-233 adds the authoring-only compact occupancy, seed-authority, and atomic empty-slot fill
  boundary. One private per-mode generation root plus exact location, first empty coordinate, and
  monotonically increasing coordinate-local ordinal derives the D-230 template seed. The exact
  selected template then derives one patient seed shared by D-223, D-197, D-198, optional D-199,
  D-193/D-194, optional D-217, and the final patient. Request/audit identities, unrelated slots,
  weights, points, prose, and file order are excluded from seed entropy. Success changes only the
  target to one complete frozen patient; a deterministic error or literal finding conflict leaves
  it empty, records the exact replayable blocker, consumes one ordinal, and never retries
  silently. D-200 advances to `18.0.0` and accepts D-233 as its sole slot root. The facility-move
  compiler advances to `2.0.0` to preserve historical D-233 authority.
  D-234 adds the authoring-only occupied-to-completed-to-empty lifecycle. It vacates one exact
  coordinate and advances bounded duplicate-preserving mode/location completion history coupled
  to its current occupancy. Endgame/Developer refresh creates skipped records only. Developer
  completion separately updates exact-version run history; exhausted unrun selection is an
  ordinal-free no-op, and same-template rerandomization cannot fall back. An exact eligibility
  overlay filters before D-230 `3.0.0` weighting. Canonical refill preserves all earlier
  successes, pins the same root/profile/current matrix across every active and retained patient,
  stops at the first blocker, and can continue only through a retained transcript that explicitly
  names that blocker as a retry boundary.
  D-235 replaces D-234's temporary opaque JSON bridge with a native
  `GeneratedCompletedEncounterAttempt`. Its compact replay snapshot is derived from the exact D-200
  waiting patient and preserves the native patient/encounter, minimized information-action
  runtime horizon, purchases and fulfillment, editable diagnosis and V2 treatment selections,
  contiguous start-through-completion events, complete compiled-rule trace, provisional point
  snapshot, arithmetic-verified settlement, engine/content versions, and deterministic
  fingerprints. The compiler rejects crossed contexts, unavailable/duplicate actions, invalid
  regimen-entry operations, missing or stale trace rows, reordered events, and point/expense/bank
  arithmetic tampering. Diagnosis qualifier validation is explicitly family-only; price origins
  remain explicitly unverified. Wall-clock completion time belongs to
  a separately fingerprinted persistence wrapper and cannot alter clinical replay. D-234
  transition/reconciliation advance to `2.0.0`; D-235 begins at `1.0.0`. D-236 then audits and
  deliberately defers SaveData/runtime activation until one real native vertical exists.
  D-237 adds the first real reviewed point-free MDD initial-medication class, count-aware route,
  policy, exact qualitative adapter, and full transition evaluator. D-238 adds one separate
  runtime-excluded provisional decision-balance owner at `+200`, attaches it only after qualitative
  adaptation, and advances D-235 to compiler `2.0.0`/point-report v2. D-235 now derives trace rows,
  route matching, component, point value, and the frozen database-plan total natively; callers
  cannot inject them. D-239 reuses the existing full versioned service definitions as native
  information-price owners, makes purchase commands quote-free, intersects D-219 availability
  with D-222 action-specific staff configuration, and advances D-235 to compiler `3.0.0` with
  replay/attempt/settlement v2. Treatment charges and the remaining settlement inputs,
  secondary-rule combination/suppression, and the
  remaining real generation/presentation dependencies stay open. D-240 adds the first missing
  reusable presentation owner found by the MDD audit: singular exact target-scoped duration and
  burden definitions, a standalone deterministic compiler, complete authoring audit, and a
  separately target-redacted frozen reveal. D-241 attaches those definitions after final patient
  truth through D-213/D-214/D-194/D-200, freezes only referenced safe reveals on the patient, and
  retains the complete authoring audit for replay without another complexity charge. D-242 freezes
  complete point-free player and database-plan decisions, derives the player information actions
  from replayed purchases, validates all three selection lanes against the frozen horizons, and
  separates action availability from selection without changing current MDD route points. D-243
  then freezes treatment triggers separately from information fulfillment, advances D-191
  to `3.0.0`, and proves the approved any-medication-start reconciliation/reaction adapters. D-244
  adds their separate exact three-outcome balances, advances native balance to `3.0.0` and D-235
  to `5.0.0`/point-report v4, and preserves not-triggered/fulfilled/omitted plus both component
  Booleans through replay. D-245 advances native balance to `4.0.0` and D-235 to
  `6.0.0`/point-report v5. It normalizes exact selected medication/regimen/intervention/disposition
  targets, applies D-159 specificity replacement, worst-only same-issue harm, and exact-target hard
  contraindication suppression to both player and database-plan traces, preserves every
  pre-combination row/controller/explanation, and rejects combination, target, and extra-row replay
  tampering. SaveData v5, IndexedDB,
  compatibility queues and attempts, Reviewer exports, automatic Standard refill, and UI remain
  unchanged.
  D-246 then audits the exact D-223/D-200 request graph against checked-in content. It confirms
  that the real MDD policy/route/balances and shared identities stop before a generation graph:
  every executable template, complete core state, generation profile, projection recipe,
  universal-result assembly, source-report profile, and real launcher-profile/content attachment
  remains synthetic or absent. D-273 now supplies the standalone launcher resolver contract but
  not those inputs. The result stays in the existing dependency ticket/audit instead of
  introducing a duplicate readiness-status model.
  D-247 accepts the atomic symptom-owner model, adds six missing MDD-oriented identity shells, and
  retains weight/BMI as typed numeric measurements. Diagnoses compose those owners through
  declarative profiles and pure compilers rather than executable content.
  D-248 adds the approved disorder-general D-197 dimension/manifestation model. A reviewed profile
  selects a total dimension count under nonoverlapping core/cluster constraints, then preserves
  one or more separate manifestations per selected dimension. Pessimism now has a neutral atomic
  finding owner. The first real MDD profile remains blocked on the exact evidence-reviewed core,
  cardinality, grouping, and pessimism/suicidality semantics, not on compiler expressiveness.
  D-249 adds the synthetic typed `finding_texture` bridge. It preserves one D-201 draw and charge,
  retains exact candidate IDs through D-208/D-223, and replaces only the matching D-198 baseline
  in D-200 while hard D-197 findings remain dominant. No real texture mapping or distribution is
  activated.
  The requested integration audit also advances D-201 to selector `2.0.0`: exact template/profile
  fingerprints remain in validation and replay, while the RNG-only profile fingerprint excludes
  the embedded full-template fingerprint so changing only D-216 care setting cannot reroll or
  resize optional complexity. The public Developer Database projection now retains public
  Developer-opinion targets while omitting separately validated authoring-only clinical-rule IDs;
  unknown private rule IDs still fail closed.
  The remaining database architecture choices are dependency-ordered in
  `docs/DATABASE_FIRST_DECISION_QUEUE.md`.
- Verified local implementation checkpoint:
  `891792a646f035fe3c0fba5a95185e7e5bb8a69b` (`Build generated-patient foundations and developer
maker`). It contains the complete D-254-through-D-274 public code, schema, catalog, test, and
  documentation batch except the operational handoff. `main` and `origin/main` remain at
  `ca0fc353bab10c7f7cbe39db2be6a7d003e8dc99` (`Stabilize completion history integration test`).
  The remote-verified `beta` checkpoint is
  `867541820f128d394b0421e8470568fade88c598` (`Record D-274 integration handoff`). The final
  verification-note commit containing this paragraph is documentation-only and uses `[skip ci]`;
  after its push, local `beta` and `origin/beta` should match exactly one commit beyond that
  verified checkpoint.
- D-275 through D-382 form the current fully validated database/engine release batch. When this
  file is read from the released commit, that complete batch must be present on both `beta` and
  `main` and backed up on both remote branches. It preserves the exact legacy D-201 contract while
  adding the separately versioned
  scalable baseline-plus-optional complexity envelope, qualified-result semantics, exact
  medication-record result attribution, sparse exact current-medication benefit state, and the
  separate exact current-medication tolerability, dose-position, and medication-change temporal
  reveals plus the rights-neutral instrument-administration boundary, compiler, strict safe
  projection, frozen-context admission proof, exact catalog-snapshot administration adapter, and
  exact catalog-snapshot launcher-presentation adapter plus two independently source-verified
  neutral medication identity bins and the exact post-composition functional-impairment
  attachment envelope plus strict target/source-instance-redacted projection and the independent
  exact-patient source-instance horizon plus exact impairment-source, instrument-respondent, and
  condition-duration-source adapters plus the source-validated D-200 duration integration
  and source-validated D-285/D-286 instrument-admission integration plus the source-validated
  D-269 standalone severity-combination input and the standalone source-validated D-240
  duration/burden projection audit plus D-215 structured source-report audit and reusable D-291
  source-role identity plus the complete D-208 composed-state source audit and the direct D-193
  finding-report source audit plus the first neutral checked-in source-role catalog, typed
  measurement/observation/test sources, the exact catalog-to-D-291 authoring adapter, and the
  standalone exact numeric and authored patient-owned structured-test result compilers plus the
  exact authored patient-owned measurement-value and categorical-observation compilers plus the
  detached exact patient clinical-result collection, its exact empty-lane D-208 attachment, the
  exact common-root post-composition assembly, the source-validated functional-impairment
  patient-state/D-194 integration, the target-scoped impairment action-result projection plus
  hidden-source validation, the exact detached metric BMI derivation, its explicit detached
  derived-measurement provenance materialization, its noncyclic exact-input D-311 attachment, and
  its synthetic proof through the existing universal direct-measurement result route described
  below, plus the exact template-owned clinical-result recipe, D-311's recipe-only attachment
  integration, the finite exact mode-template recipe-coverage horizon, and D-320's mandatory
  horizon-owned recipe resolution, plus the finite exact recipe-resource coverage audit and the
  exact D-233/D-208/D-324 patient materialization context plus its exact D-306-through-D-310/
  D-316/D-317/D-320 result-materialization orchestration and D-326-only delegation to D-311
  empty-result-lane attachment plus D-327-rooted D-312 post-composition orchestration with
  optional D-294/D-292 branches plus the single D-324-to-D-325-through-D-329 authoring
  orchestration over a result-free D-200 request scaffold and the D-331 exact D-330-to-D-233
  atomic-fill integration plus the D-332 checked-in runtime-excluded launcher-presentation
  catalog, D-333 exact successful-fill-to-minimized-presentation attachment, and the D-334 exact
  runtime-excluded weight/BMI action-result assembly over the existing measurement route plus the
  D-335 detached deterministic generated-measurement profile/compiler and D-336 distinct
  D-308/D-335 D-310 collection integration plus D-337 exact generated-measurement
  recipe/resource/materialization integration through D-320/D-324/D-326, D-338's exact
  reviewed-class MDD mania-history prerequisite with separate provisional balance, D-339's exact
  canonical passive-death-wish patient scope plus direct safety-assessment balance, D-340's four
  additional neutral detailed-safety finding identities, D-341's exact nine-fact detailed-safety
  projection/result assembly, D-342's separately typed safety-planning-ability structured result
  definition and universal binding, D-343's exact current-medication-regimen result, D-344's exact
  uninterpreted allergy/adverse-reaction record and assessment-status result, D-345's exact
  source-reported exposure-use result, D-346/D-347's focused-versus-full treatment-history
  mappings, D-348's four-lane exact-regimen medication-effects result, D-349's closed minimized
  structured-record field projection, and D-350's exact D-299-derived source-validated projection
  collection plus D-351's exact D-350/D-213-to-D-214 detached result attachment and D-352's exact
  sixteen-finding current/past mania-history projection and universal result owner plus D-353's
  exact six-finding current psychosis-history projection and universal result owner plus D-354's
  exact broad functional-impact projection inside the existing two-action MDD
  initial-assessment foundation.
  They do not alter the verified D-274 remote checkpoint, `main`, or either deployed application.
- D-355 through D-379 continue that same local dependency batch through the real generated-MDD
  scoring, settlement, historical authoring persistence, and completed-slot lifecycle proof plus
  the weighted functional-impairment resolver foundation. D-380 now closes the last D-372
  generated-MDD action-result coverage gap with one reviewed, source-conditioned broad current
  self-reported functional-impact profile and the complete Presenting problem and timeline result.
  It deliberately creates no condition-attributed impairment, severity, treatment, complexity,
  rule, balance, or point. D-381 adds a deterministic read-only adjunct packet inventory and
  fingerprint command. D-382 independently verifies and adds 70 NLM RxNorm ingredient identities,
  expands the catalog to 125 identities, and generates the explicit static import/registry index;
  only the existing 13 runtime medication definitions remain playable.
- The current adjunct stale-target mapping base is
  `891792a646f035fe3c0fba5a95185e7e5bb8a69b`. The later handoff and verification-note commits do
  not change canonical schema, catalog, or engine targets.
- Beta verification run
  `https://github.com/dcr-cmyk648/PsychSim/actions/runs/30842884010` passed the complete Node 22
  D-254-through-D-274 gate at
  `867541820f128d394b0421e8470568fade88c598`. Main verification/deployment run
  `https://github.com/dcr-cmyk648/PsychSim/actions/runs/30644611327` independently passed the same
  older distributed-release gate, including iPhone/WebKit, then deployed Pages.
- Live portable Reviewer: `https://dcr-cmyk648.github.io/PsychSim/`. Its fresh
  `version.json` reports distribution
  `ca0fc353bab10c7f7cbe39db2be6a7d003e8dc99`, build kind `portable_reviewer`, and channel `main`.
- Configured local Developer URL: `http://127.0.0.1:4318/` (not started for this backend-only
  checkpoint).
- Configured local portable Reviewer URL: `http://127.0.0.1:4319/` (not started for this
  backend-only checkpoint).

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
- The target generated-record pipeline is now explicit:
  `PatientTemplate → PatientInstance → EncounterInstance + CompiledRubric`. Diagnosis families own
  reusable disorder variants, so the MDD record owns mild/moderate/severe while a template selects
  one state and adds only narrow constraints. `CaseBlueprint` remains the historical compatibility
  snapshot. `PatientTemplate` is the current technical name for a source-controlled case/encounter
  recipe, not a pre-generated person. Its setting, focused decision, complexity envelope, and
  presentation limits never belong to MDD. The shared-finding, optional-feature,
  condition/finding/background/tendency, reaction-history, prior-treatment, exposure,
  action-result, source-report, instrument-response, and exact-location operational chains are now
  complete as authoring-only structural slices. D-223 runs the one D-201 optional-complexity pass
  and composes the genuine pre-finding state; D-225 makes it D-200's only pre-finding root.
  D-231 materializes the sole mode/lifecycle template horizon, D-226 compiles that exact horizon ×
  built-location mechanical admission matrix before any patient selection, D-227 limits that
  matrix to a strict derived operational clinic context, and
  D-228 binds one explicitly named admitted cell without duplicating the full matrix. D-229 owns
  the exact physical-location slot coordinate and complete local admitted horizon. D-230 applies
  the explicit positive local distribution/repeat policy, makes one deterministic slot-local draw,
  and supplies nested D-229/D-228 to D-200 without creating a second complexity authority.
  D-232 through D-235 now prove authoring-only per-location capacity, occupancy/seed/fill,
  native attempt completion, completion/skip, Developer run history, refill/retry, and
  facility-move behavior. Generalized
  runtime generation, real non-outpatient operational owners, persistence/orchestration
  activation, compatibility migration, and real clinical/profile content remain blocked or
  deliberately deferred.
- The point-free `DecisionPolicyDefinition → CompiledRubric` compiler boundary now exists before
  that runtime pipeline. It freezes one primary route plus automatically discovered reviewed
  secondary candidates from exact typed patient facts and exact action targets, with nonblocking
  coverage diagnostics and deterministic scan/index equivalence. Its runtime-excluded source
  catalog now owns one reviewed MDD initial-medication policy, its exact +200 primary route, two
  point-free any-medication-start information prerequisites, and their separate D-244
  reconciliation `+35/-25` and reaction-history `+30/-40` three-outcome balances. Native scoring
  and D-235 replay preserve the exact prerequisite state and both component Booleans. D-338 adds
  a third point-free prerequisite over the exact reviewed five-member initial-MDD antidepressant
  class, expands it to concrete starts without tag inference, and attaches its separate
  mania-history `0/+35/-50` balance. The full isolated native database-plan fixture now totals
  `415`; D-339 adds the separate fact-conditional passive-death-wish safety assessment, preserving
  that `415` plan without the fact and deriving `465` when the fact is present and the detailed
  assessment is obtained (`335` when only that assessment is omitted). The compatibility
  CaseBlueprint rules remain unchanged. D-245 now
  combines every native player/database-plan rule row using exact selected targets, keeps the
  complete pre-combination/controller audit, and verifies that result during replay. Current
  case-local rubrics remain compatibility fixtures; real generated clinical attachment remains
  open.
- A shared finding must resolve once with every contributing owner and then project into all
  relevant investigation views. The exact-candidate compiler now implements that point-free pass
  and freezes explicit reviewed projections without adding probabilities or clinical rules. The
  GAD Reviewer feedback remains preserved as a blocking historical attempt ticket.
- The 2026-07-28 dependency audit found 621 nested finding occurrences and 186 finding IDs across
  the five approved/review case files, with 112 IDs reused across files. The canonical
  finding-definition boundary, original 47-definition wide/shallow seed, and current
  61-definition catalog are implemented and validated.
  Point-free proposition/evidence, presentation-projection, measurement/exam, structured-test, and
  complete resolved-patient-state owners are now present. Substance/background-exposure,
  intervention-modality, medication-regimen, and point-free decision-policy/compiler boundaries
  are also present. Exact shared-finding compilation and the synthetic
  `PatientTemplate → PatientInstance → EncounterInstance` attachment boundary are now present and
  validated, while real projection content and compatibility migration remain deliberately
  disabled. The point-free presentation-richness envelope/evaluator and deterministic
  condition/finding/background/tendency pipeline, optional-feature budget selector, and bounded
  comorbidity bridge plus D-197/D-200 neutral condition-source path are also present.
  Reaction-history alternatives, additive prior-treatment records, and additive positive-use
  exposure contributions now have typed authoring-only bridges, and D-208 verifies their common
  D-201 source before composition. No generic payload is authorized for the unowned `other`
  sentinel. D-214 now completes the synthetic action-result attachment seam with one
  template-pinned static assembly, complete D-213 horizon, derived D-194 bindings, and the
  presentation-safe/full-audit D-212 split. D-215 now compiles an already-selected reviewed
  whole-lane source-report profile into native D-212 projections with exact replay. D-217 now
  selects one complete reviewed D-215 profile per exact source-view slot through fixed or
  independent weighted behavior. D-218 now replaces caller-authored projections in D-194 with
  exact D-217 selection, runs D-215 against final patient truth, and replays the complete chain;
  no real profile exists. D-216 freezes
  one exact care setting across the template, location, and encounter without changing D-201
  accounting or granting operational capabilities. The compiler accepts all four target settings
  structurally, while the current runtime location catalog remains outpatient only. D-217 supplies
  the separate reviewed profile-selection proof and D-218 attaches it without an additional
  complexity charge. No real patient, scoring rule, result probability, exposure prevalence,
  treatment guidance, non-outpatient location, or generalized runtime generation was added.
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
clinical rule, or compatibility-case behavior was added or run. The decision-policy owner named
by that checkpoint is now resolved by D-191.

The D-191/D-192 decision-policy and evidence-adjunct checkpoint passed its bounded integration
gate on 2026-07-29:

- 52 focused compiler/schema/runtime-boundary tests, including 23 direct compiler tests;
- root `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`;
- the complete unit/handoff gate: 64 Vitest files with 509 tests plus 10 Python handoff tests;
- direct content/catalog/registry/source-use validation;
- deterministic refresh and validation of the local whole-corpus Developer Database projection:
  206 documents, 234 source units, 91 of 164 entries linked, 2,098 lexical matches, 51 semantic
  candidates, 38 formal contributions, 89 identity gaps, 16 overlaps, and 8 partial units; and
- `git diff --check`.

The first sandboxed invocations of `pnpm content:validate` and
`pnpm content:knowledge:crossref:validate` failed only because the managed sandbox denied the local
tsx IPC socket; the identical permissioned commands passed. The catalog is empty,
runtime-excluded, and point-free. No clinical relationship, policy, balance value, generated
patient, compatibility migration, application build, browser suite, portable-app build,
app-server check, or Pages observation was added or run. The exact next owner is
`ticket.engine.patient-generation.shared-finding-compiler`.

The D-193 shared-finding compiler checkpoint passed its bounded local gate on 2026-07-29:

- 40 focused shared-finding, canonical-finding, and presentation-projection tests after adversarial
  compiler review;
- the complete unit/handoff gate: 65 Vitest files with 531 tests plus 10 Python handoff tests;
- root `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`;
- direct content/catalog/registry validation and runtime-boundary checks; and
- `git diff --check`.

The first sandboxed `pnpm content:validate` invocation failed only because the managed sandbox
denied the local tsx IPC socket; the identical permissioned command passed. The compiler is pure,
point-free, and has no content imports. It added no clinical probability, cardinality selection,
diagnosis inference, patient cohort, score, compatibility migration, runtime projection content,
application build, browser suite, server, GitHub push, or Pages observation. The exact next owner is
`ticket.engine.patient-generation.catalog-compiled-instances`.

The D-194 catalog-instance attachment checkpoint passed its bounded local gate on 2026-07-29:

- 13 direct catalog-instance compiler tests after independent schema, fixture, and adversarial
  compiler audits, plus 24 shared-finding, 26 decision-policy, and 13 runtime-boundary focused
  tests;
- the complete unit/handoff gate: 66 Vitest files with 551 tests plus 10 Python handoff tests;
- root `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`;
- direct content/catalog/registry validation; and
- `git diff --check`.

The first sandboxed `pnpm content:validate` invocation again failed only because the managed
sandbox denied the local tsx IPC socket; the identical permissioned command passed. The additive
compiler accepts only synthetic already-resolved inputs and pins exact horizon payloads,
result-selector recipes, condition provenance, location, seed, nested compiler context, and
patient/encounter/snapshot integrity. It added no real generation, probability, optional draw,
clinical content, point rule, compatibility adapter, save/queue migration, application build,
browser suite, server, GitHub push, or Pages observation. The exact next owner is
`ticket.engine.patient-generation.presentation-richness-envelope`.

The D-195 presentation-richness checkpoint passed its bounded local gate on 2026-07-29:

- 7 direct evaluator tests and 14 catalog-instance integration tests after independent audit,
  plus 13 runtime-boundary tests;
- focused D-191/D-193/D-194/D-195 coverage: 84 tests;
- root `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`;
- direct content/catalog/registry validation; and
- `git diff --check`.

The first sandboxed `pnpm content:validate` invocation again failed only because the managed
sandbox denied the local tsx IPC socket; the identical permissioned command passed. The envelope
records explicit decision-driver categories and structured prior-effort expectation without a
global maximum; its exact frozen-state evaluation emits only nonblocking diagnostics. The
authoring compilers were removed from the ordinary engine root and quarantined behind
`@psychsim/engine/authoring`. No patient selection, finding generation, probability, clinical
content, point rule, compatibility adapter, save/queue migration, application build, browser
suite, server, GitHub push, or Pages observation was added or run. The exact next owner is
`ticket.engine.patient-generation.template-condition-selector`.

The D-196 template-condition selector checkpoint passed its bounded local gate on 2026-07-29:

- 8 direct selector tests, 15 catalog-instance tests including selector-output attachment, and 14
  recursive runtime-boundary tests;
- focused D-191/D-193/D-194/D-195/D-196 coverage: 94 tests;
- root `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`;
- direct content/catalog/registry validation; and
- `git diff --check`.

The first sandboxed `pnpm content:validate` invocation again failed only because the managed
sandbox denied the local tsx IPC socket; the identical permissioned command passed. The standalone
profile pins an exact template and uses explicit game-only count/candidate weights. Selection is
deterministic, order-invariant, without replacement, and freezes every selected/unselected
candidate, stable draw, exact state/binding, and provenance record. Only selected endpoints of an
approved explicit literal incompatibility pair produce a complete reproducible
retry-or-quarantine artifact. Successful output is accepted by D-194, but the selector audit
artifact itself remains separate until an explicit composer checkpoint. Recursive lint and source
tests quarantine all authoring engine subpaths from web/content-runtime code. No finding
generation, diagnosis inference, clinical probability, point rule, persistence, queue, cohort,
compatibility migration, application build, browser suite, server, GitHub push, or Pages
observation was added or run. The exact next owner is
`ticket.engine.patient-generation.condition-finding-cardinality-selector`.

The D-197 condition-finding/cardinality selector checkpoint passed its bounded local gate on
2026-07-29:

- 11 direct selector tests, 24 shared-finding tests, 8 condition-selector tests, and 14 recursive
  runtime-boundary tests;
- focused D-191/D-193/D-194/D-195/D-196/D-197 coverage: 105 tests;
- root `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`;
- complete `pnpm content:validate`; and
- `git diff --check`.

The first sandboxed `pnpm content:validate` invocation again failed only because the managed
sandbox denied the local tsx IPC socket; the identical permissioned command passed. Exact selected
condition states can bind composable matching reviewed profiles. Required outcomes emit D-193
diagnostic candidates; bounded groups use game-only count/member weights without replacement and
emit only selected cardinality candidates. Every selected and unselected mapping, stable draw,
review/provenance record, exact `condition_state` owner, unbound selected condition, and
input/output fingerprint remains auditable. Stable profile/finding IDs cannot appear at multiple
versions in one request, and bound/unbound traces cannot contradict each other. No real diagnostic
criteria, background/soft-tendency aggregation, clinical probability, points, diagnosis inference,
presentation, persistence, retry search, composer attachment, runtime import, compatibility
migration, application build, browser suite, server, GitHub push, or Pages observation was added
or run. The exact next owner is
`ticket.engine.patient-generation.background-finding-outcome-selector`.

The D-198 background-finding outcome selector checkpoint passed its bounded local gate on
2026-07-29:

- 8 direct selector tests, 11 condition-finding tests, 24 shared-finding tests, and 14 recursive
  runtime-boundary tests;
- focused D-191/D-193/D-194/D-195/D-196/D-197/D-198 coverage: 113 tests;
- root `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`;
- complete permissioned `pnpm content:validate`; and
- `git diff --check`.

Each exact target in a bounded horizon now binds one reviewed finite background profile. Selection
is deterministic and order-invariant, and every offered value/weight, selected outcome, stable
draw, exact D-197/horizon/profile pin, review/provenance record, candidate contribution, and
fingerprint remains auditable. Integrity verification reconstructs both the profile payload and
weighted draw. Exact definition-version alignment includes every D-197 required and cardinality
member evaluation, even when a member was unselected. D-193 tests prove that a hard condition value
prevails without deleting background trace and that background can fill an otherwise uncovered
definition. No real clinical profile, soft-tendency aggregation, prevalence/probability claim,
point rule, diagnosis inference, patient-context inspection, presentation, persistence, retry,
composer attachment, runtime import, compatibility migration, application build, browser suite,
server, GitHub push, or Pages observation was added or run. The exact next owner is
`ticket.engine.patient-generation.weighted-finding-tendency-aggregator`, pending the one policy
decision below.

The D-199 weighted-finding tendency and D-200 finding-pipeline audit checkpoints passed their
bounded local gate on 2026-07-29:

- 126 focused tests spanning D-191 and D-193 through D-200 plus recursive runtime-boundary guards;
- root `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`;
- complete permissioned `pnpm content:validate`; and
- `git diff --check`.

D-199 adds only nonnegative synthetic generation mass over one exact exhaustive mutually-exclusive
outcome set; it does not use negative weights or claim clinical prevalence. D-200 validates every
D-196→D-199 reference edge, retains D-198 beside D-199, constructs one collision-free exact D-193
candidate union, and calls D-194 once. Its artifact also retains the complete assembled D-193/D-194
request. Standalone integrity replays that request, so matching IDs cannot hide a different
candidate body, template, complexity envelope, condition state/binding, snapshot, or conflict.
Tests exercise same-finding D-197 hard precedence over both soft lanes, each crossed chain edge,
retained-request tampering, and exact literal-conflict replay. Each stage keeps its own seed. The
encounter-owned complexity budget passes through unchanged and unspent. No real clinical profile,
prevalence claim, point rule, optional-module selection, diagnosis inference, presentation,
persistence, compatibility migration, application build, browser suite, server, GitHub push, or
Pages observation was added or run. The exact next owner is
`ticket.engine.patient-generation.optional-feature-budget-selector`.

The D-201 optional-feature budget selector checkpoint passed its bounded local gate on 2026-07-29:

- 139 focused tests spanning D-191 and D-193 through D-201 plus recursive runtime-boundary guards;
- root `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`;
- complete permissioned `pnpm content:validate`; and
- `git diff --check`.

D-201 uses the encounter recipe's one existing additional-feature budget as a hard maximum rather
than a quota. Required and case-defining state remains outside it. An exact-template profile binds
reusable module identities to explicit cost, impact, five-axis contributions, synthetic
game-variety weights, and reviewed incompatibilities. The selector draws one explicitly feasible
count, selects without replacement, performs exact remaining-budget/incompatibility look-ahead,
and freezes all count/candidate decisions plus selected, unselected, spent, and unspent state.
Standalone integrity replays the complete normalized request. Adversarial tests cover budget and
module caps, valid unused capacity, exact incompatibility traces, feasibility look-ahead, order
invariance, stale context, and retained-request/artifact tampering. No optional module payload,
clinical probability, prevalence, point rule, difficulty, presentation, persistence,
compatibility migration, runtime import, application build, browser suite, server, GitHub push, or
Pages observation was added or run. The exact next owner is the narrow D-201→D-196
optional-comorbidity bridge; it must not create a second optional-condition draw.

The D-202 optional-comorbidity budget bridge checkpoint passed its bounded local gate on
2026-07-29:

- 150 focused tests spanning D-191 and D-193 through D-202 plus recursive runtime-boundary guards;
- 25 direct bridge and runtime-boundary tests after the focused-condition adversarial fix;
- root `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`;
- complete permissioned `pnpm content:validate`; and
- `git diff --check`.

D-202 verifies the complete D-201 artifact and normalized D-196 request, then maps the complete
bounded D-201 comorbidity candidate pool one-to-one to exact D-196 optional condition candidates.
Required template constraints materialize as authored condition state outside the optional budget;
only D-201-selected comorbidities materialize as generated optional state. Focused conditions,
missing or duplicate mappings, cross-version bindings, nonzero optional-group minima, stale
profiles, and over-capacity realized selections are rejected. D-196 weights remain audit-only:
changing their seed or weights cannot change D-201-owned membership. Literal incompatibilities are
retained without reroll or substitution, and standalone integrity replays the complete bridge
request. The current structural slice is intentionally bounded by D-201's 64-candidate authoring
ceiling. No condition findings, other optional-module payload, clinical probability, point rule,
presentation, persistence, compatibility migration, runtime import, application build, browser
suite, server, GitHub push, or Pages observation was added or run. The exact next owner is a
neutral resolved-condition-source contract plus source-specific verifier integration; D-203 and
D-204 now complete that path without fabricating a D-196 artifact.

The D-203 resolved-condition-source and D-197 integration checkpoint passed its bounded local gate
on 2026-07-29:

- 151 focused tests spanning D-191 and D-193 through D-203 plus recursive runtime-boundary guards;
- 37 direct D-197, D-202, and runtime-boundary tests, including a genuine selected D-202→D-197
  path and literal-source-conflict rejection;
- root `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`;
- complete permissioned `pnpm content:validate`; and
- `git diff --check`.

D-203 defines a strict discriminated source over the complete D-196 or D-202 artifact and
dispatches to its native integrity verifier. The common source view is derived only; D-197 embeds
the genuine source and its kind-aware native reference, re-verifies it during integrity checks, and
requires its bound/unbound IDs to exactly partition source condition state. D-202 condition state
keeps its D-201 stable-draw and bridge provenance, and D-197 performs no optional draw or budget
calculation. The historical D-196 two-field draw/candidate hash domain remains unchanged. D-200 is
now migrated by D-204 as recorded below. No real profile, clinical probability, point rule,
presentation, persistence, compatibility migration, runtime import, application build, browser
suite, server, GitHub push, or Pages observation was added or run.

The D-204 finding-pipeline resolved-condition-source checkpoint passed its bounded local gate on
2026-07-29:

- 153 focused tests spanning D-191 and D-193 through D-204 plus recursive runtime-boundary guards;
- 21 direct D-200/D-202 tests, including genuine D-196 and D-202 chains, crossed-source rejection,
  nested D-201/D-202 tamper rejection, exact D-194 state/binding retention, and deterministic
  context replay;
- root `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`;
- complete permissioned `pnpm content:validate`; and
- `git diff --check`.

D-204 replaces D-200's raw D-196 field with the complete strict `ResolvedConditionSource`,
advances the authoring composer contract to `2.0.0`, dispatches native source verification during
composition and standalone integrity, and requires D-197's complete source and typed reference to
match exactly. D-194 receives the verified template, condition states, and bindings. A D-202 path
retains the complete nested D-201 budget and bridge audit in D-200 while the template complexity
profile remains `budget_only` with no selected runtime modules. No real profile, clinical
probability, point rule, presentation, persistence, compatibility migration, runtime import,
application build, browser suite, server, GitHub push, or Pages observation was added or run.

The D-205 optional reaction-history payload bridge checkpoint passed its bounded local gate on
2026-07-29:

- 162 focused tests spanning D-191 and D-193 through D-205 plus recursive runtime-boundary guards;
- 23 direct D-205 and runtime-boundary tests covering null, unassessed, documented-none,
  records-present, medication and nonmedication triggers, exact D-201 ordinal/draw and unchanged
  spending, nonreaction selection, mapping/horizon/incompatibility failures, and nested tampering;
- root `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`;
- complete permissioned `pnpm content:validate`; and
- `git diff --check`.

D-205 verifies the complete D-201 artifact, maps every `allergy_reaction` candidate to one complete
typed history, and requires those alternatives to be pairwise incompatible in D-201 so at most one
can materialize. It preserves the original module cost, total spent, remaining budget, selection
ordinal, and stable draw without another selection or charge. A narrow exact reference horizon
pins all medication, nonmedication-trigger, and manifestation identities used by the alternatives.
Null means no optional contribution; unassessed and documented-none are explicit non-null
histories. Recorded labels and reported severity remain uninterpreted, and the bridge does not
merge with base reaction state, evaluate clinical rules or points, attach to D-194, persist, or
enter runtime.

The D-206 optional prior-treatment payload bridge checkpoint passed its bounded local gate on
2026-07-29:

- 171 focused tests spanning D-191 and D-193 through D-206 plus recursive runtime-boundary guards;
- 32 direct D-205, D-206, and runtime-boundary tests covering null optional contributions,
  non-prior selections, compatible additive histories, 15 medication trials, repeated treatment
  identities under distinct records, exact D-201 cost/ordinal/draw/spending retention,
  mapping/horizon/duplicate rejection, nested tamper rejection, replay, and runtime isolation;
- root `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`;
- complete permissioned `pnpm content:validate`; and
- `git diff --check`.

D-206 verifies the complete D-201 artifact and maps every `prior_treatment` candidate to one
nonempty positive contribution containing medication trials, psychotherapy trials, current
providers, and/or prior levels of care. Compatible selected contributions compose by deterministic
globally unique record union; repeated medication or intervention identities remain valid when
their record IDs differ. Required or decision-defining treatment history remains core template
state outside the optional budget. Null means no optional contribution, never treatment-naive.
The bridge preserves authored exposure, adequacy, adherence, response, tolerability, source, and
summary fields without inferring one from another, and it neither merges with base history nor
enters D-194, persistence, scoring, or runtime.

The D-207 optional exposure budget bridge checkpoint passed its bounded local gate on 2026-07-29:

- 181 focused tests spanning D-191 and D-193 through D-207 plus recursive runtime-boundary guards;
- 42 direct D-205, D-206, D-207, and runtime-boundary tests covering null contributions,
  non-exposure selections, medication/supplement/other-substance entries, compatible additive
  bundles, same-agent alternatives, current/elapsed amount and prescription invariants, explicit
  misuse truth, semantic agent uniqueness across content versions, exact D-201
  cost/ordinal/draw/spending retention, horizon/mapping/tamper rejection, replay, and runtime
  isolation;
- root `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`;
- complete permissioned `pnpm content:validate`; and
- `git diff --check`.

D-207 verifies the complete D-201 artifact and maps every `substance_use` candidate to one
nonempty positive-use contribution. Compatible selected contributions compose only when their
record and semantic-agent identities are disjoint. Same-agent alternatives must pin the same
exact content version and already be explicitly incompatible in D-201. The bridge preserves
authored recency, current amount, prescription relationship, and frozen misuse truth, adding only
deterministic resolution provenance from the original D-201 stable draw. It neither applies
population/misuse priors nor draws, charges, or refunds again. Null means no optional exposure
contribution, not nonuse or unassessed state. Required exposure and core-inventory composition
remain deferred, and the generic `other` module kind remains unsupported.

The D-208 resolved patient-state composition checkpoint passed its bounded local gate on
2026-07-29:

- 190 focused tests spanning D-191 and D-193 through D-208 plus recursive runtime-boundary guards;
- 51 direct D-205, D-206, D-207, D-208, and runtime-boundary tests covering zero-module/default
  semantics, required and optional condition composition, whole-history reaction replacement,
  additive prior-treatment and exposure materialization, selected unsupported `other` coverage,
  record and semantic-agent collision rejection, crossed D-201 contexts, exact required-condition
  matching, deterministic identities, nested tamper rejection, replay, and runtime isolation;
- root `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`;
- complete permissioned `pnpm content:validate`; and
- `git diff --check`.

D-208 verifies one complete D-201 selection/accounting artifact across the genuine condition
source and every typed optional payload bridge required by that candidate pool. Core conditions
must equal the required-condition subset; the complete verified source then owns final conditions.
An optional reaction may replace only an explicitly declared core default, while prior-treatment
and exposure contributions append without deduplication or a second draw or charge. Every selected
typed module has one materialization audit. Selected unsupported `other` and native condition
conflicts produce a typed `not_composed` artifact without refund or reroll. The resulting
pre-finding state has deterministic provenance-sensitive state and exposure-inventory identities,
retains the complete D-201/bridge audit, and keeps `canonicalFindings` empty for D-193. D-208 does
not yet attach this state to D-200/D-194, enter persistence/runtime, or enable real patient
generation.

The D-209 composed-state finding-pipeline attachment checkpoint passed its bounded local gate on
2026-07-29:

- 191 focused tests spanning D-191 and D-193 through D-209 plus recursive runtime-boundary guards;
- 33 direct D-208, D-209, and runtime-boundary tests covering genuine D-196 and D-202 sources,
  exact full-state/binding/proposition attachment, preserved D-201 optional-comorbidity spending,
  selected unsupported-module and native condition-conflict blocking, crossed source and nested
  D-208 tamper rejection, deterministic replay, literal finding-conflict retention, and runtime
  isolation;
- root `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`;
- complete permissioned `pnpm content:validate`; and
- `git diff --check`.

D-209 advances only D-200's authoring composer contract to `3.0.0`. Its request now contains one
complete D-208 artifact plus a nullable downstream payload: a composed state requires D-197 through
D-200, while a blocked state cannot fabricate those artifacts. D-200 derives the genuine condition
source, complete pre-finding state, exact bindings, D-193 patient-state ID, and proposition state
from D-208, then retains and replays the full D-208 → D-193 → D-194 chain. A selected unsupported
module or native condition conflict returns `PATIENT_STATE_COMPOSITION_BLOCKED` with the original
D-208 blocker IDs and unchanged D-201 spending. D-209 adds no probability, clinical inference,
point rule, real profile content, compatibility migration, persistence, runtime generation, or app
work.

The D-210 whole-state tendency-applicability checkpoint passed its bounded local gate on
2026-07-29:

- 199 focused tests spanning D-191 and D-193 through D-210 plus recursive runtime-boundary guards;
- 48 direct D-191, D-210, and runtime-boundary tests, including required and D-201-selected
  optional-condition matching, unchanged complexity accounting, same-record success and
  cross-record failure, unassessed known-state nonmatch, exact patient/profile/target versions,
  scan/index byte equivalence, stale-index rejection, deterministic replay, trace/context tamper
  rejection, and upstream D-208 blocker propagation;
- root `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`;
- complete permissioned `pnpm content:validate`; and
- `git diff --check`.

D-210 verifies one complete composed D-208 state and genuine D-198 target artifact, then evaluates
every supplied approved applicability definition through the existing exact typed-patient-fact
and same-record matcher. It retains matched and nonmatched evaluations, exact record IDs, and
definition/profile/target versions and emits at most one D-199-ready binding per matched
definition. Required and optional facts are equal inputs after D-208 freezes them; their upstream
origin remains auditable. D-201 remains the only selector and cost/spending authority, and D-199
remains the only allocation, pooled-mass, normalization, and draw authority. No real definition or
profile, D-199/D-200 attachment, probability or point calculation, compatibility migration,
persistence, runtime generation, or app work was added.

The D-211 weighted-tendency applicability-attachment checkpoint passed its bounded local gate on
2026-07-29:

- 201 focused tests spanning D-191 and D-193 through D-211 plus recursive runtime-boundary guards;
- 40 direct D-199, D-200/D-211, D-210, and runtime-boundary tests covering matched and genuine
  zero-match D-210 paths, exact derived profile/definition subsets, D-198 retention, optional
  D-202-condition matching with unchanged D-201 spending, legacy caller-owned D-199 rejection,
  crossed D-208/D-198/D-210 rejection, retained D-210/D-199 tamper rejection, deterministic
  replay, hard-lane precedence, and literal-conflict retention;
- root `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`;
- complete permissioned `pnpm content:validate`; and
- `git diff --check`.

D-211 advances D-200 to composer `4.0.0`. A ready request supplies D-197, D-198, and one complete
verified D-210 artifact but no D-199 result. D-200 verifies exact D-208/D-198 equality, selects
only profiles referenced by emitted D-210 bindings and only their exact finding definitions from
the shared recipe, constructs one deterministic D-199 request, and delegates all mass pooling,
normalization, and drawing to D-199. Zero bindings retain the complete D-210 nonmatch audit with
null D-199 and an active D-198 baseline. D-201 remains the only optional-module selector and cost
authority: a selected complication spends its authored cost once, while downstream applicability
and finding generation spend nothing further. No real profile, points, compatibility migration,
persistence, runtime generation, or app work was added.

The D-212 structured non-finding reveal-projection checkpoint passed its bounded local gate on
2026-07-29:

- 9 direct schema tests covering grouped treatment history, patient denial versus objective
  exposure truth, explicit negative versus unassessed empty state, exact lane partition,
  presentation/alignment consistency, reaction-status consistency, singleton truth and
  indeterminate state, exact action/source/patient pinning, and exclusion of scoring, reliability,
  reveal-state, and complexity fields;
- root `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`;
- complete permissioned `pnpm content:validate`;
- schema and ticket/scout JSON parsing; and
- `git diff --check`.

D-212 adds a versioned definition, resolved source view, and integrity envelope for closed
non-finding patient-state lanes. Each view retains one exact action fingerprint, patient, source
instance, time scope, claim origin, dependency groups, explicit presentation status, and complete
included-versus-omitted truth-record audit. It supports source denial, omission, and uncertainty
without mutating hidden state or inferring why evidence disagrees. It adds no source-report
probabilities, fabricated records, compiler, D-194 attachment, wording, points, persistence,
runtime behavior, or optional-complexity work. D-201 remains the sole selector and spender.

The D-213 universal information-action result-recipe checkpoint passed its bounded local gate on
2026-07-29:

- 11 direct compiler tests covering exact catalog/recipe bijection, all five supported frozen
  owner classes, out-of-horizon neutrality, unordered-input normalization, missing-source
  coverage without fake negatives, explicit D-212 documented-none views, action and patient
  fingerprint pinning, instrument and unknown-action horizon audit, action-owned source
  enforcement, explicit measurement/observation availability, stale-version rejection, replay,
  tamper detection, and complexity/scoring isolation;
- 696 root tests across 81 Vitest files plus 10 handoff tests, including recursive runtime-boundary
  quarantine for the new authoring compiler;
- root `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`;
- complete permissioned `pnpm content:validate`;
- ticket/scout JSON parsing; and
- `git diff --check`.

D-213 adds an exact versioned universal information-action catalog, one recipe per catalog action,
closed source references, per-action evaluations, deterministic standalone binding candidates,
coverage diagnostics, and full request/replay fingerprints. Complete in-horizon actions bind
verified D-193, D-212, measurement, observation, or structured-test sources; missing declared
sources remain incomplete and never become fake normal, negative, empty, or documented-none
results. Invalid/stale owners and unknown action targets fail structurally, while instrument-item
targets remain explicit diagnostics for a later compiler. D-213 deliberately does not emit D-194
requests or attach to D-200, because D-194 cannot yet retain and verify D-212 envelopes. It adds
no real recipe content, points, persistence, runtime generation, or optional-complexity work.
D-201 remains the sole selector and spender.

The D-214 verified universal action-result attachment checkpoint passed its bounded local gate on
2026-07-29:

- 49 focused tests: 7 translator, 16 D-194 catalog-instance, 12 D-200 composer, and 14 recursive
  runtime-boundary tests;
- 704 root tests across 82 Vitest files plus 10 handoff tests;
- root `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`;
- complete permissioned `pnpm content:validate`;
- ticket/scout JSON parsing; and
- `git diff --check`.

D-214 advances `PatientTemplate` to `attachment_only.v2`, the catalog-instance compiler to
`2.0.0`, and D-200 to `5.0.0`. A template pins one reusable static action-result assembly rather
than patient-specific binding IDs. D-194 builds exact D-212 envelopes only after final D-193
state, compiles one complete D-213 artifact for the focused horizon, derives every binding request,
and blocks incomplete coverage without fallback. The authoring snapshot retains the complete
D-212/D-213 audit; the patient instance freezes only presentation-safe D-212 fields. Exact
state/source/definition/recipe/horizon context and derived bindings replay during integrity
verification. Reviewed multi-action availability for one measurement or observation remains
valid. D-201 remains the only optional-module selector and complexity-budget spender, while
information-action purchase points remain separate. No real recipe/source profile, clinical rule,
probability, point value, persistence, runtime generation, or app work was added.

The D-215 structured source-report compiler checkpoint passed its bounded focused gate on
2026-07-30:

- 17 direct compiler tests plus D-212 and recursive runtime-boundary coverage;
- exact populated/empty whole-lane behavior, all four presentation modes, all nine D-212 lanes,
  typed singleton handling, documented-none/unassessed/unable distinctions, ordering,
  changed-payload identity, replay, and tamper checks; and
- strict rejection of probability, partial-record, complexity, scoring, and economy fields.

D-215 consumes one already-selected approved source behavior profile. It does not select among
profiles, contain real behavior data, or attach to D-194.

The D-216 encounter care-setting checkpoint passed its bounded focused gate on 2026-07-30:

- 21 catalog-instance tests, 12 D-200 composer tests, 14 recursive runtime-boundary tests, and 56
  content-runtime tests;
- structural compilation for outpatient psychiatry, emergency department, inpatient psychiatry,
  and consultation-liaison plus crossed-setting rejection and tamper validation; and
- proof that care setting neither changes D-201 selection/spending nor grants capabilities.

D-216 advances the current template/compiler contracts to `attachment_only.v3`, catalog-instance
`3.0.0`, and D-200 `6.0.0`. All existing runtime locations remain outpatient and generalized
runtime generation remains disabled.

The D-217 source-report behavior-selection checkpoint passed its bounded focused gate on
2026-07-30:

- 21 direct selector tests plus 14 recursive runtime-boundary tests;
- fixed seed-independent selection, deterministic weighted variation, exact per-slot
  normalization, independent stable substreams, candidate-order and unrelated-slot invariance;
- exact D-215 source-kind and lane/singleton compatibility, stable-profile uniqueness, all four
  care settings, D-215 handoff, replay, strict forbidden-field rejection, and tamper checks; and
- root typecheck plus focused lint and formatting.

D-217 remains authoring-only, contains no real source-report profile or clinical probability, and
does not consume patient state, D-201 accounting, action costs, scoring, economy, persistence, or
runtime content.

The D-218 verified source-report attachment checkpoint passed its bounded focused gate on
2026-07-30:

- catalog-instance compiler `4.0.0` and D-200 composer `7.0.0`;
- 28 D-194 tests, 13 D-200 tests, 21 D-217 tests, 17 D-215 tests, and 14 recursive
  runtime-boundary tests;
- exact fixed and weighted D-217 → D-215 → D-212 → D-213/D-214 compilation in outpatient
  psychiatry, emergency department, inpatient psychiatry, and consultation-liaison;
- null-horizon, exact seed/template/assembly/setting, legacy-field, final-state, pre-D-193
  conflict-path preflight, request/snapshot replay, and nested tamper checks; and
- byte-identical D-201 retention through a nonzero selected-module D-200 path, with no capability
  or point leakage.

D-218 accepts no caller-authored patient-specific D-212 recipe. It retains both complete
authoring artifacts and freezes only the existing presentation-safe view into the patient. It
adds no real behavior profile, action recipe, clinical probability, point value, persistence,
runtime generation, UI, or non-outpatient operational catalog.

The D-219 exact operational-admission checkpoint passed its bounded focused gate on 2026-07-30:

- operational-admission compiler `1.0.0`, `attachment_only.v4`, catalog compiler `5.0.0`, and
  D-200 composer `8.0.0`;
- 74 focused D-219, D-194, D-200, and recursive runtime-boundary tests plus focused lint,
  root typecheck, formatting, ticket/scout parsing, and `git diff --check`;
- one exact normalized evaluation per focused information action, medication start,
  current-regimen operation, intervention, and disposition;
- the same explicit-resource algorithm in outpatient psychiatry, emergency department, inpatient
  psychiatry, and consultation-liaison;
- same-setting location isolation, staff-only pending access, unrestricted external fulfillment,
  exact formulary/treatment/disposition gaps, context verification, deterministic replay, and
  tamper detection; and
- unchanged nested D-201 optional-module selection, spending, and remaining budget.

D-219 is exported only through `@psychsim/engine/authoring` and carries operational-only
projections, not costs, points, quality, reimbursement, or clinical scoring. It proves the
mechanical exact-location boundary synthetically; all current runtime locations remain outpatient.

The D-220/D-221 instrument-response checkpoint passed its bounded focused gate on 2026-07-30:

- standalone D-220 compiler `1.0.0`, `attachment_only.v5`, universal action-result assembly v2,
  D-213 `2.0.0`, catalog compiler/D-194 `6.0.0`, and D-200 `9.0.0`;
- 118 focused tests: D-220 16, D-213 13, D-214 8, D-194 32, D-200 13, D-219 22, and recursive
  runtime-boundary 14;
- exact approved instrument/item/scale/action/source/time/rights ownership, complete-empty and
  incomplete-owner paths, multiple item responses under one action, treatment-field-isolated
  minimized action context, deterministic replay, and strict tamper detection;
- complete contributor/projection audit retained at the snapshot root and nested in D-213 while
  PatientInstance retains only the presentation-safe response identity; and
- explicit omission/duplication, valid-but-crossed owner, all-four-setting, and nonzero D-201
  byte-preservation tests.

D-220/D-221 add no real instrument text, total, cutoff, interpretation, clinical scoring, action
cost, point value, persistence, runtime generation, or UI.

The D-222 through D-231 lifecycle horizon, operational admission, location-owned slot, local draw,
and handoff checkpoint passed its bounded focused gate on 2026-07-30:

- the prior 142-test D-222-through-D-228 gate plus a 54-test D-229/D-230/D-200/runtime-boundary
  extension;
- D-231 compiler `1.0.0`, D-230 selector and D-229/D-228 compilers `2.0.0`, D-226 `3.0.0`,
  D-222/D-219 `3.0.0`, D-194 `8.0.0`, and D-200 `16.0.0`;
- exact caller-bound admitted-cell replay for outpatient psychiatry, emergency department,
  inpatient psychiatry, and consultation-liaison;
- exact physical-location ownership, exhaustive local admitted horizons, two-same-setting-location
  isolation, empty/cross-location rejection without global fallback, full-template equality across
  D-230 → D-229 → D-228 and D-223, exact location/pool/setting/D-222/D-219 crosslinks,
  positive local mass, active/recent stable-ID suppression, deterministic 64-bit slot substreams,
  exact probability audit, stale/current operational separation, deterministic replay, strict
  queue-authority exclusion, payload-substitution and tamper rejection, runtime exclusion, and
  byte-stable D-201 complexity accounting; and
- strict Standard/Endgame approved-only and local-Developer approved-plus-explicit-review lanes,
  medical-review independence, all-four-setting pass-through, raw-template bypass rejection, and
  proof that a broad Endgame horizon grants no absent location or resource.

The D-231 extension passed its final bounded gate on 2026-07-30: root lint and typecheck; 65 focused
D-231/D-226/D-228/D-229/D-230/D-200/runtime-boundary tests across four files; ticket/scout JSON
parsing; content validation; repository-wide Prettier; and `git diff --check`. Content validation
emitted only the existing Node 26 `module.register()` deprecation warning. No app build, browser
suite, app server, persistence migration, real setting-specific content, Git commit, push, or
Pages check was due under the database-first batching contract.

The D-232 exact-location capacity and atomic facility-move checkpoint passed its bounded gate on
2026-07-30:

- capacity compiler/certificate `1.0.0`, facility-move compiler `1.0.0`, and D-200 `17.0.0`;
- separate base-plus-explicit-upgrade capacity profiles, minimized capacity-only ownership and
  assignment, stable coordinates, current-context replay, and D-200 rejection of missing,
  crossed, or tampered D-230 capacity authorization;
- atomic migration that preserves the exact patient payload, seed, template, historical
  D-230/D-232 selection, and source provenance while attaching target capacity plus fresh current
  D-226/D-228 proof;
- itemized missing-successor, capacity-shortfall, and exact-target-admission blockers with zero
  committed migrations whenever any waiting slot is blocked; and
- 72 focused tests across capacity, D-200/migration, D-226/D-228/D-229/D-230, and recursive
  runtime-boundary suites; root lint/typecheck, ticket/scout JSON parsing, content validation,
  repository-wide Prettier, and `git diff --check`.

Content validation emitted only the existing Node 26 `module.register()` deprecation warning. No
app build, browser suite, app server, compatibility queue/SaveData migration, facility-purchase
activation, real capacity upgrade, Git commit, push, or Pages check was due under the
database-first batching contract.

The D-233 empty-slot seed-authority and atomic fill checkpoint passed its bounded gate on
2026-07-30:

- occupancy compiler, seed-authority compiler, and atomic empty-slot fill compiler `1.0.0`,
  D-200 `18.0.0`, and facility-move compiler `2.0.0`;
- one canonical compact occupancy snapshot over the exact D-232 capacity horizon, canonical
  first-empty placement, location/mode-local fill ordinals, and separate deterministic
  template-selection and patient-generation seeds;
- seed-domain separation from request/audit IDs, occupancy serialization, unrelated slots, and
  repeat-history details that did not change the selected template, while the patient seed also
  binds the exact selected template identity, version, and fingerprint;
- one patient-generation seed across D-223, D-197 through optional D-199, D-193/D-194, optional
  D-217, and the frozen PatientInstance, with D-233 as D-200's sole slot root;
- atomic success, hard D-200 blocker, and literal-finding-conflict outcomes that alter only the
  target coordinate, consume exactly one fill ordinal, never retry internally, and reproduce
  exactly under integrity and context verification;
- native cross-coordinate relocation rejection plus facility-move preservation of the full
  historical D-233 authority, patient seed, patient payload, template, and source provenance; and
- 85 focused tests across five engine/runtime-boundary files; root lint and typecheck; ticket/scout
  JSON parsing; content validation; repository-wide Prettier; and `git diff --check`.

Content validation emitted only the existing Node 26 `module.register()` deprecation warning. No
app build, browser suite, app server, compatibility queue/SaveData migration, post-encounter
completion/refill activation, Git commit, push, or Pages check was due under the database-first
batching contract.

The D-234 post-encounter lifecycle checkpoint passed its bounded gate on 2026-07-30:

- lifecycle transition and refill-reconciliation compilers `1.0.0`, D-230 selector `3.0.0`,
  D-233 seed/fill `2.0.0`, D-200 `19.0.0`, and facility-move migration `3.0.0`;
- strict canonical JSON-safe attempt bridging with a unique terminal `EncounterCompleted` event,
  exact waiting/patient/attempt/proof binding, and replay of the complete frozen D-200 patient;
- occupancy-bound, bounded, duplicate-preserving local completion history with collision checks
  before truncation, exact-version Developer run history, and skipped-only Endgame/Developer
  refresh;
- exact-location active-waiting exclusion, global completed-version exclusion, changed-fingerprint
  rejection, ordinal-free Developer exhaustion, and no-fallback same-template rerandomization;
- canonical multi-vacancy refill with one root across active and retained-history patients, one
  exact location/fingerprint matrix and distribution profile, preserved earlier successes,
  blocker-bound explicit retries, and a 128-attempt bound covering 64 fills plus 64 authorized
  blocker retries; and
- 92 focused tests across four engine/runtime-boundary files; root lint and typecheck; content
  validation; repository-wide Prettier; and `git diff --check`.

Content validation emitted only the existing Node 26 `module.register()` deprecation warning. No
app build, browser suite, app server, native generated-attempt persistence, compatibility
queue/SaveData migration, runtime activation, Git commit, push, or Pages check was due under the
database-first batching contract.

The D-235 native generated completed-attempt checkpoint passed its bounded gate on 2026-07-30:

- native generated replay snapshot, action/purchase, V2 treatment selection, event, point report,
  settlement, completed-attempt, and timestamp-separated persistence-record schemas plus compiler
  `1.0.0`;
- compact exact patient/encounter derivation from the verified D-200 waiting slot, minimized
  information-action runtime horizon, exact result/service/fulfillment binding, editable
  diagnosis and treatment event folding, and one unique terminal `EncounterCompleted` event;
- one trace row per exact compiled-rubric rule, explicit unbalanced rows, provisional balance and
  unverified-price labels, component/cap/expense/payout-floor/practice-bank arithmetic, and zero
  complexity-derived settlement value;
- deterministic replay and payload fingerprints, separate wall-clock persistence fingerprint,
  crossed-patient/context rejection, nonrepeatable/out-of-horizon action rejection, and
  event/trace/settlement tamper rejection;
- D-234 lifecycle/reconciliation and completion proof v2 embedding and cross-verifying the native
  attempt before exact-coordinate vacancy; and
- 3 focused D-235 tests, 1 D-234 native-proof/vacancy/refill integration test, 1 recursive runtime
  quarantine test, root typecheck and lint, content validation, repository-wide Prettier, and
  `git diff --check`.

Content validation emitted only the existing Node 26 `module.register()` deprecation warning. The
first sandboxed validator attempt failed because tsx could not create its temporary IPC socket;
the required unsandboxed rerun passed. No app build, browser suite, app server, SaveData/IndexedDB
migration, compatibility queue change, review/export projection, runtime activation, Git commit,
push, or Pages check was due under the database-first batching contract.

The D-236 through D-238 real-route and native-balance checkpoint passed its bounded gate on
2026-07-30:

- D-236 records the explicit decision not to migrate SaveData or activate runtime before one real
  deterministic vertical exists;
- D-237 adds the exact five-identity reviewed MDD initial-medication class, one-eligible and
  one-total-start route, focused policy, qualitative diagnosis-rule adapter, and separate
  count-aware route evaluator;
- D-238 adds one runtime-excluded exact rule-to-balance catalog, provisional dominant-route
  `+200`, and a separate attachment compiler so point retuning cannot churn the clinical route or
  policy;
- native decision scoring evaluates both the submitted and frozen database-plan treatments
  through the full route predicate; zero, nonmember, and two-start selections do not receive the
  route award;
- D-235 advances to compiler `2.0.0` and generated point-report v2, retains the exact
  database-plan treatment, and no longer accepts caller-authored trace rows, match state,
  components, point values, caps, safety IDs, or database-plan totals; and
- focused schema/engine/D-235/D-234/runtime-boundary tests, root typecheck, and content validation
  pass. The sandboxed validator again failed only on the local tsx IPC restriction; its required
  unsandboxed rerun passed with the existing Node 26 deprecation warning.

Native treatment charges and other settlement inputs, real MDD
finding/result/source/presentation profiles, SaveData, browser
persistence, review projection, runtime generation, and UI remain deliberately unactivated. No
app build, browser suite, server, Git commit, push, or Pages check is due for this local
database-first batch.

The D-239 native information-service pricing checkpoint passed its bounded gate on 2026-07-30:

- the existing `ServiceDefinition` catalog remains the sole versioned price owner; no parallel
  pricing catalog or new clinical judgment was added;
- generated purchase commands now retain only purchase and information-action identity, while a
  separate authoring-only compiler verifies exact D-219 topology, D-222 action-specific staff
  configuration, and equal-quality mechanically available methods;
- least operating cost plus stable method-ID tie-break derives fulfillment, label, operating cost,
  external savings, and staff savings; missing, stale, drifted, unavailable, and unequal-quality
  inputs fail closed;
- replay snapshot v2 freezes normalized price owners and per-action method horizons; integrity
  replay recalculates every purchase and rejects quote tampering;
- D-235 advances to compiler `3.0.0`, generated attempt v2, and settlement v2 with the explicit
  mixed-pricing derivation label; treatment charges and other settlement inputs remain unverified;
  and
- focused native quote, operational join, D-235/D-234 integration, runtime-boundary tests, root
  typecheck, and content validation pass.

SaveData, IndexedDB, runtime queues, browser/reviewer projection, UI, app builds, browser tests,
servers, Git commit, push, and Pages remain deliberately untouched.

The D-240 target-scoped duration/burden projection checkpoint passed its bounded gate on
2026-07-30:

- the MDD vertical audit found that typed duration and burden could not safely enter D-212
  whole-lane source reports or D-193 canonical findings;
- one static definition now pins exactly one action payload, value kind, duration profile or
  ordinal scale, target-definition selector, source kind, and time scope, without accepting
  patient-specific record IDs;
- the standalone compiler distinguishes absent, singular, ambiguous, and missing-value target
  states; preserves full authoring values; emits a target-redacted frozen reveal; and records an
  explicit source-record-to-safe-value binding;
- one patient record may explicitly feed different actions, while same-action overlap fails;
  exact action fingerprints, semantic owners, target versions, source/time, safe transforms, and
  complete artifact replay are verified;
- a neutral patient-state normalizer replaces the previous incidental D-212/D-215 normalization
  dependency without changing normalized output.

The D-241 target-scoped attachment checkpoint passed its bounded gate on 2026-07-30:

- assembly v3 owns the exact static definitions, and D-194 `9.0.0` compiles D-240 only after the
  final frozen patient state;
- D-213 `3.0.0` treats an all-not-applicable target source as neutral when another source resolves,
  but refuses partial same-action binding when any applicable target definition is missing or
  ambiguous;
- D-214 attaches only referenced target-redacted frozen reveals to `PatientInstance`, while the
  full D-240 artifact remains nested in the authoring snapshot and D-200 `20.0.0` replays it;
- a neutral information-action fingerprint module prevents a D-213/D-240 dependency cycle; and
- focused D-240/D-213/D-214 (35 tests), D-194 (35 tests), D-200 composition plus a nonempty D-240
  replay/tamper proof (2 focused tests), and runtime-boundary (14 tests) runs exit cleanly; the
  pre-proof complete D-200 file also completed all 44 then-existing assertions before hitting the
  already documented Node 26 post-test worker-IPC timeout; and
- root lint, typecheck, repository-wide format check, `git diff --check`, and content validation
  pass. The sandboxed validator failed only because tsx could not create its temporary IPC socket;
  the required unsandboxed rerun passed with the existing Node 26 `module.register()` deprecation
  warning.

No real projection definition, MDD clinical threshold, patient generation, complexity spending,
points, persistence, runtime, browser, or UI behavior was added.

The D-242 full native encounter-decision checkpoint passed its bounded gate on 2026-07-30:

- strict `GeneratedEncounterDecisionSelection` snapshots preserve presence-semantic purchased
  information-action IDs plus final diagnosis and treatment selections for both player and
  database plan;
- the player snapshot derives only from successfully replayed/natively quoted purchases and final
  submitted events, while one explicit `databasePlanDecision` replaces the old treatment-only
  reference;
- both snapshots validate against exact information, diagnosis, medication-start,
  current-regimen-entry operation, intervention, and disposition horizons; duplicate same-medication
  regimen entries remain independently targetable;
- a separate selected-decision matcher distinguishes selection from D-191 action-horizon
  availability, without tag, prose, probability, or point inference;
- native balance advances to `2.0.0`, D-235 compilation to `4.0.0`, and point report to v3; the
  current D-237 route still reads only treatment selection, preserving the existing `+200`/zero
  behavior and settlement arithmetic;
- focused decision-selection/balance (9 tests), D-235 (3 tests), D-234 lifecycle (15 tests), and
  runtime-boundary (14 tests) runs pass. One previously default-timed D-234 integration test now
  declares the same 20-second bound as adjacent heavy integration tests after its deterministic
  work exceeded Vitest's 5-second default; no production behavior changed; and
- root lint, typecheck, repository-wide format check, `git diff --check`, and content validation
  pass. The sandboxed validator failed only because tsx could not create its temporary IPC socket;
  the required unsandboxed rerun passed with the existing Node 26 `module.register()` deprecation
  warning.

No prerequisite rule, clinical content, new point value, diagnosis scoring, treatment charge,
compatibility migration, persistence activation, runtime queue, browser behavior, or UI was added.

The D-243 triggered-information prerequisite checkpoint passed its bounded gate on 2026-07-30:

- strict point-free trigger/fulfillment ownership is required for diagnosis-owned prerequisites;
  trigger targets cannot be information actions, fulfillment targets can only be information
  actions, the D-191 availability anchor must exactly equal fulfillment, and the closed-v1
  contract requires a non-null typed patient predicate plus exact originating policy scope;
- D-191 advances to `3.0.0`, freezes both normalized predicates and the originating policy
  ID/version plus focused-decision ID in the compiled-rule fingerprint, requires exact policy,
  trigger, and fulfillment horizons, and preserves semantic scan/index equivalence;
- D-242 decisions now evaluate a prerequisite as `not_triggered`, `fulfilled`, or `omitted` while
  retaining independent trigger-selected and fulfillment-selected state; availability alone never
  fulfills it;
- one authoring-only adapter verifies the exact approved diagnosis/policy/primary-route chain and
  losslessly adapts the MDD any-medication-start reconciliation and reaction-history rules without
  emitting compatibility tags;
- the tag-based antidepressant/mania rule fails closed pending a reviewed exact native medication
  set or class; it was not approximated from tags;
- adapted prerequisites remain unbalanced zero-point rows, and the current `+200` primary route and
  database-plan total are unchanged; and
- 100 focused assertions pass across the real adapter/route (7), D-191 (29), D-242/native balance
  (11), D-194 catalog propagation (35), D-200 base composition (1), D-235 replay (3), and runtime
  boundary (14). Root lint, typecheck, repository-wide format check, `git diff --check`, and
  content validation also pass; validation emits only the existing Node 26 `module.register()`
  deprecation warning.

No prerequisite balance, fulfilled award, omission penalty, safety cap, new clinical judgment,
D-235/report version, persistence, runtime generation, compatibility case, review export, browser
behavior, or UI was added.

The D-244 triggered-information prerequisite-balance checkpoint passed its bounded gate on
2026-07-30:

- native balance `3.0.0` attaches exact three-outcome owners to the two already-reviewed MDD
  prerequisites: medication reconciliation `+35/-25` and medication reaction history `+30/-40`;
- not-triggered remains zero, while fulfillment and omission remain independently traceable from
  trigger selection and information fulfillment;
- D-235 advances to `5.0.0`/point-report v4 and replays the exact nested prerequisite state without
  accepting caller-authored points; and
- focused engine, D-235 replay, typecheck, formatting, and content validation passed without
  activating persistence or runtime content.

The D-245 native rule-combination checkpoint passed its bounded gate on 2026-07-30:

- native balance `4.0.0` applies D-159 specificity replacement, worst-only same-issue harm, and
  exact-target hard-contraindication suppression after per-rule evaluation for both player and
  database-plan traces;
- broad selected medication/regimen actions normalize to exact selected targets, and every row
  retains its pre-combination points, final status, direct controller, and explanation;
- D-235 advances to `6.0.0`/point-report v5, reconstructs complete exact targets, recombines the
  trace, and rejects status, target, controller, or forged-extra-row tampering;
- focused rule-combination/decision-balance/decision-policy tests pass 52/52, the isolated D-235
  persistence contract passes 4/4 with 42 unrelated assertions skipped, and root typecheck passes.

No real contraindication, fit contributor, new point magnitude, clinical cap, treatment charge,
settlement owner, persistence, runtime generation, compatibility case, browser behavior, or UI was
added.

The D-246 first-real-MDD compile-readiness audit completed on 2026-07-30:

- the exact D-223 `1.0.0` and D-200 `20.0.0` request graphs were compared with checked-in content;
- the real reusable boundary ends at MDD diagnosis rules, the five-medication route/policy, native
  balances, and shared identity catalogs;
- all executable templates, core pre-finding states, generation profiles, projection recipes,
  universal-result assemblies, source-report profiles, and complete presentations remain synthetic
  or absent; and
- the existing dependency ticket/document records a real `PatientTemplate` as the first executable
  blocker and the MDD episode finding/cardinality owner plus canonical identity completeness as its
  first clinical dependency.

No new readiness schema, compiler, completion percentage, clinical inference, patient, point,
persistence, runtime generation, browser behavior, or UI was added.

The D-247 atomic MDD finding-owner pass completed locally on 2026-07-31:

- the reusable finding catalog now has 47 identity-only definitions;
- new shells cover increased appetite, indecision, worthlessness, self-reported psychomotor
  agitation, and separately observed psychomotor agitation/slowing;
- existing depressed mood, anhedonia, fatigue/energy, sleep, reduced appetite, guilt,
  concentration, psychomotor slowing, passive-death-wish, active-SI, weight, and BMI owners were
  retained rather than duplicated;
- weight and BMI remain numeric `MeasurementDefinition` records;
- D-247 records database-entry-as-function as a declarative ownership metaphor: diagnoses
  reference atomic versioned inputs and pure compilers execute the mapping; and
- `ticket.catalog.diagnoses.mdd-current-episode-finding-profile` is the one active clinical packet.
  It must decide dimension/cardinality semantics before a real D-197 profile can safely count
  paired or differently sourced manifestations.

The focused content-runtime suite passes 56/56 and `pnpm content:validate` passes. No real MDD
criterion, cardinality, generation weight, diagnosis inference, point, patient, persistence,
runtime behavior, browser behavior, UI, build, server, or remote update was added.

The D-248 dimension/manifestation pass completed locally on 2026-07-31:

- `condition-finding-dimensions.v1` extends D-197 rather than creating a parallel symptom engine;
- a profile chooses one reviewed total dimension count, enforces nonoverlapping core/cluster
  constraints, then selects one or more separately auditable manifestations inside every selected
  dimension;
- the frozen artifact retains selected/unselected dimensions and manifestations, requirement
  evaluations, separate stable draws, exact provenance, candidates, and fingerprints;
- D-197 advances to selector `3.0.0`; synthetic tests prove determinism, input-order invariance,
  exact core satisfaction, multiple manifestations counting as one dimension, invalid-overlap
  rejection, and D-193 compatibility;
- the finding catalog advances to 48 with neutral, medically unreviewed
  `finding.history.current-pessimism`;
- `source-request.mdd.current-episode-dimensions` now requests legally reusable evidence for the
  exact MDD core/cardinality/grouping and pessimism/suicidality roles before any real profile;
- `docs/DATA_ADJUNCT_EVIDENCE_QUEUE.md` makes that request the bootstrap priority while preserving
  the source-request JSON as canonical status; and
- source-request validation now accepts exact registered authoring-only evidence IDs supplied by
  the content validator, so metadata-only sources such as NIMH can remain visible without entering
  the Player catalog.

Focused validation passes: 108 assertions across six impacted engine/content-runtime suites,
`pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm content:validate`, and
`git diff --check`. No real MDD clinical mapping, texture bridge, generation probability, points,
patient, persistence, runtime behavior, browser behavior, UI, build, server, commit, or remote
update was added.

The D-249 optional finding-texture bridge completed locally on 2026-07-31:

- strict profile/request/artifact schemas bind exact D-201 module/profile/template identity to a
  bounded exact finding horizon and lawful reviewed outcomes;
- the pure bridge reuses each selected module's ordinal and stable draw and copies the unchanged
  selected count, spent budget, and remaining budget;
- D-208 and D-223 advance to `2.0.0`, audit the emitted candidate IDs as materialized records, and
  do not populate canonical findings before D-193;
- D-200 advances to `21.0.0`, substitutes selected texture for only the exact matching D-198
  baseline, preserves hard D-197 precedence, and rejects same-target D-199 overlap pending
  reviewed combination semantics;
- synthetic tests cover selected/unselected behavior, one-charge accounting, D-193 precedence,
  full D-223/D-200 attachment, deterministic replay, and stale/tampered/illegal-value rejection;
  and
- the future database-generated Developer Patient Maker is recorded as a thin exact-template/setting/
  complexity client over the canonical compiler, while the adjunct handoff now requires
  source-local takeaways to be atomized into exact owners and reviewed qualitative rules before
  any separate provisional balance.

Focused D-249 validation passes 28 assertions across the bridge, D-208, and D-223 suites; the
targeted D-200 attachment assertion passes; `pnpm typecheck` passes. The complete D-200 file's
47 assertions pass when run under the current Node process, although the known Node 26 Vitest
worker `onTaskUpdate` shutdown timeout can still make a long aggregate invocation exit nonzero.
No real MDD mapping, outcome rate, clinical rule, point, patient, persistence, runtime, browser
behavior, UI, commit, or remote update was added.

The D-250 through D-252 and evidence-scaffolding pass completed locally on 2026-07-31:

- D-250 adds separate medically unreviewed identities for current unintentional weight gain and
  loss while point-in-time weight and BMI remain numeric measurements;
- formal metadata/source-use boundaries now register the 2018 CANMAT/ISBD bipolar guideline, its
  2023 evidence update, the APA 2023 eating-disorders guideline, the DRS-R-98 validation article
  and erratum, one 2024 MDD treatment network meta-analysis, and VA/DoD MDD 2022 without extracting
  restricted text or activating clinical content;
- D-251 permits explicitly preliminary adjunct packets to guide neutral owners, schemas,
  dependency edges, candidate bins, and review questions while prohibiting clinical mappings,
  generation probabilities, qualitative rules, balances, points, and runtime behavior;
- matching unreviewed rules already remain nonblocking diagnostics outside the compiled rubric,
  and a new regression proves they cannot receive a provisional balance;
- D-252 advances native decision balance to `5.0.0`, D-235 generated-attempt compilation to
  `7.0.0`, and generated point-report to v6;
- the point report fingerprints the complete source balance catalog, freezes only exact
  rubric-referenced balance payloads, omits authoring rationale and Developer-opinion records,
  retains complete player and database-plan traces, and revalidates exact magnitudes and
  explanations before D-159 combination and arithmetic; and
- same-ID/version balance retuning changes the source and minimized-payload fingerprints, while
  catalog reordering remains inert.

Focused D-251/D-252 validation passes 43 decision-policy/balance assertions and 18 targeted native
balance/generated-attempt assertions (43 unrelated D-200 assertions skipped), plus `pnpm
typecheck`. Those interim results are superseded by the complete D-253 gate below. No clinical
rule, probability, balance magnitude, patient, SaveData, IndexedDB, runtime queue, browser
behavior, or UI was added.

The D-253 integration gate completed locally on 2026-07-31:

- Vitest now uses its thread pool, which preserves the complete assertions and isolation while
  avoiding the fork worker's fixed RPC acknowledgement timeout;
- the complete Node 22.23.1 unit/handoff gate exits cleanly with 98 Vitest files / 989 product
  assertions plus 10 Python handoff tests;
- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `git diff --check`,
  `pnpm content:validate`, `pnpm content:sources:validate`,
  `pnpm content:diagnoses:validate`, `pnpm content:knowledge:crossref:validate`,
  `pnpm content:compile`, and `pnpm demo:reference-runs` pass;
- Player and portable Reviewer builds pass their separate bundle-isolation scans;
- the Player Chromium gate passes 5/5, and the portable Reviewer Chromium phone gates pass 4/4
  across 390-pixel and 320-pixel layouts, including multi-case feedback export;
- Playwright 1.53.2 WebKit build 2182 is installed locally but declares macOS 14.5 as its minimum;
  this Intel Mac is on macOS 14.1.1, so the browser process exits with a bus error before opening a
  page. The repository's required `CI=true` workflow installs and runs the iPhone/WebKit project
  on a supported runner; both beta and main remote gates passed that project before the
  main/Pages promotion was accepted; and
- the sandboxed tsx validators and Playwright servers failed only because the managed sandbox
  denies local IPC sockets or loopback listeners; identical Node 22 commands passed with the
  required local permission.

D-253 also repairs two stale aggregate tests: authoring-only evidence metadata participates in the
Developer synthesis validation boundary, and missing ticket coverage targets one known active
ticket instead of whichever attachment happens to be last. The Player E2E queue count is derived
from the checked-in source-request file. No clinical rule, probability, balance magnitude,
patient, runtime content, persistence behavior, or UI was added.

The requested beta-backup integration audit completed on 2026-07-30:

- the three integration regressions exposed by the first aggregate run were repaired: D-216 care
  setting no longer perturbs D-201 optional-module draws, the D-202 tamper fixture now performs a
  genuine binding mutation, and private clinical-rule opinion targets remain outside the public
  Database projection while unknown rule IDs are rejected;
- focused regression suites pass 43/43, and the five affected D-219/D-202 pipeline assertions pass
  in isolation;
- all 97 Vitest files and all 979 product assertions pass under both the installed Node 26 runtime
  and temporary Node 22.23.2. The aggregate Vitest process still exits nonzero after completing
  every assertion because its worker reports `Timeout calling "onTaskUpdate"`; the same post-run
  runner error persists with four workers and with one forked worker. This backup is therefore not
  represented as a clean full-suite certification;
- `pnpm test:handoff` passes 10/10; `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, and
  `git diff --check` pass;
- `pnpm content:validate`, `pnpm content:sources:validate`,
  `pnpm content:diagnoses:validate`, `pnpm content:knowledge:crossref:validate`, and
  `pnpm demo:reference-runs` pass; and
- the gitignored local Developer Database projection was refreshed and validates at 206 private
  documents, 234 deterministic source units, 91/164 database entries linked, 89 identity gaps,
  and 16 overlapping catalog terms.

The sandboxed tsx commands were unable to open local IPC sockets and passed unchanged when rerun
with local permission. The existing PDF standard-font and Node `module.register()` warnings remain
advisory. No browser build, E2E suite, Pages check, or server was run because this checkpoint is
database/engine-only and is a backup rather than a release promotion.

The D-254/D-255 MDD profile-to-scoring checkpoint completed locally on 2026-08-02:

- one runtime-excluded, psychiatrist-approved current-episode MDD finding profile now composes
  nine reusable dimensions, selects five through nine, and requires depressed mood or anhedonia;
- every concrete manifestation remains a separate canonical finding; pessimism remains
  non-counting; equal selection weights are game-variety controls rather than prevalence,
  probability, evidence strength, clinical importance, or points;
- NIMH and CANMAT contributions remain source-scoped, while the exact profile mapping is an
  accepted Developer opinion; the related source request and clinical ticket are resolved;
- D-255 adds one native direct-information adapter that verifies the focused compatibility tag
  but emits only the primary route's exact typed patient predicate plus one information-action
  predicate;
- separate provisional balances now score episode course `+35/−35`, depressive syndrome
  `+50/−50`, and preferred substance-use history `+30/0`;
- native decision balance advances to `6.0.0`, the frozen balance snapshot to
  `decision-balance-catalog-snapshot.v2`/compiler `2.0.0`, D-235 generated-attempt compilation to
  `8.0.0`, and the generated point report to v7;
- the focused native database-plan fixture totals `380`; both required focused histories without
  medication or substance history total `85`; medication plus both treatment-triggered histories
  while omitting both focused histories totals `180`; medication with no purchased history totals
  `50`;
- replay derives purchase presence only from the frozen decision, retains exact workup rows and
  balance payloads, and rejects crossed balance shapes or point/explanation tampering; and
- the antidepressant-tag mania rule and passive-death-wish safety rule remain unbalanced because
  their exact native class/patient predicates are not yet available. No tag, prose, unselected
  manifestation, or source certainty was used to infer them.

Focused validation passes 73 assertions across the adapter, native balance, real profile, and full
finding-pipeline/generated-attempt replay suites. `pnpm typecheck`, `pnpm format:check`, `pnpm
lint`, `git diff --check`, and `pnpm content:validate` pass. No real `PatientTemplate`, runtime
patient, SaveData, persistence migration, browser behavior, UI, commit, or remote update was
added.

The D-256 sparse-positive symptom-closure correction completed locally on 2026-08-03:

- the proposed per-manifestation MDD D-198 `absent` profiles were rejected and not created;
- condition, texture, override, and other generators remain free to contribute positive or
  otherwise deliberately authored values before result assembly;
- D-193 advances to `1.1.0`; one approved negative-result projection may opt into a derived
  `absent` fallback only when the complete supplied candidate set has no approved value-bearing
  candidate for its one exact finding;
- a generated positive, explicit negative, or explicit unresolved value suppresses the fallback;
  an outside-horizon missing definition retains `NO_REVIEWED_VALUE`;
- latent assessment truth remains separate from information purchase/reveal and from later
  patient/collateral/record/examination report behavior; and
- explicit negative generator constraints remain reserved for separately reviewed exclusions or
  literal incompatibilities, with no clinical incompatibility inferred from the reviewer's
  structural example.

Focused shared-finding validation passes 27/27 and the downstream D-200/D-213/D-220 suites pass
80/80. `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `git diff --check`, and
`pnpm content:validate` pass. The first sandboxed content-validator attempt was blocked only by
tsx local IPC (`EPERM`) and passed unchanged with local permission. No real MDD action-result
projection, source-report profile, patient, persistence change, runtime activation, browser/UI
change, commit, or remote update was added.

The D-257 source-report complexity correction completed locally on 2026-08-03:

- accurate/aligned self-report is the zero-complexity base; an inaccurate or partial report is a
  reviewed `source_report` module selected and charged once by D-201;
- D-208 preserves the selected module's exact binding, cost, ordinal, stable draw, and remaining
  budget as `deferred_to_post_truth`, without adding or changing hidden patient facts;
- D-217 advances to `2.0.0` with `complexity_gated` source-view policies over D-215 structured
  non-finding lanes. No selected module uses the accurate base; a selected module reuses its D-201
  trace with no second draw or cost;
- one module may affect several exact structured views for its one cost. A view cannot receive two
  selected modifiers, and potential same-view alternatives must already be D-201-incompatible;
- D-200 requires D-217 to retain the exact complete D-201 artifact from its one D-208 root;
- focused tests prove zero-cost base behavior, one-charge inaccurate behavior, truth-preserving
  D-208 composition, exact ordinal/draw/cost retention, replay, and rejection of an unmapped or
  crossed D-201 artifact; and
- canonical symptom/finding reports use D-193 rather than D-215. D-257 deliberately left that
  narrow path separate; D-258 now resolves it without a parallel symptom engine.

The focused D-217, D-208, and D-200 suites pass 81/81. `pnpm typecheck`, `pnpm lint`, `pnpm
format:check`, and `pnpm content:validate` pass; the ticket scout explicitly records that the
remaining projection bridge is technical and does not invent a literature requirement. The first
sandboxed content-validator attempt was blocked only by tsx local IPC (`EPERM`) and passed
unchanged with local permission. No real source-report profile, module cost or frequency,
symptom-report bridge, point rule, patient, persistence/runtime/UI change, commit, push,
application build, browser suite, app server, Actions observation, or Pages check was added or
run.

The D-258 finding source-report projection bridge completed locally on 2026-08-03:

- D-193 advances to `1.2.0`; one approved
  `finding-source-report-projection.v1` policy retains the complete D-201 artifact and defines
  exact patient-report slots with an accurate base plus module-specific alternatives;
- every base/alternative in one slot has the same hidden source predicate and result target. The
  selected projection may change the displayed response but cannot change canonical finding
  truth;
- the exact D-201 module definition/fingerprint/template binding/selected record plus original
  cost, ordinal, and stable draw remain in the compiled projection trace. No second selection or
  charge occurs;
- D-256 closed-assessment absence derivation considers only the active governed projection, so an
  inactive accurate or inaccurate variant cannot create or influence latent finding candidates;
- D-200 advances to `22.0.0` and requires every D-201 `source_report` definition to be covered by
  the union of the D-217 structured-view path and D-258 finding-projection path, with every
  embedded D-201 artifact exactly equal to the one nested D-208 root; and
- `ticket.engine.patient-generation.finding-source-report-complexity-bridge` is resolved/applied.
  Synthetic tests cover zero-cost base behavior, one-charge inaccurate display, unchanged truth,
  active-projection-only closure, full-root replay, and crossed/tampered artifact rejection.

The focused D-258/D-193 suites pass 31/31, the full D-200 audit suite passes 48/48, and downstream
D-213/D-214/D-220/catalog attachment suites pass 70/70. `pnpm typecheck`, `pnpm lint`, `pnpm
format:check`, `pnpm content:validate`, and `git diff --check` pass. The first sandboxed
content-validator attempt was blocked only by tsx local IPC (`EPERM`) and passed unchanged with
local permission. No real report profile, module cost/frequency, motive, clinical probability,
point rule, patient, persistence/runtime/UI change, commit, push, application build, browser
suite, app server, Actions observation, or Pages check was added or run.

The D-259 through D-264 result-content and duration checkpoint completed locally on
2026-08-03:

- the reviewer approved brief insomnia/hypersomnia and passive-death-wish/current-active-SI items
  in the compact Depressive symptoms action while dedicated Sleep and Suicide/self-harm actions
  retain deeper assessment;
- `registry.catalog.finding-projections` now owns 49 explicit mappings over 17 atomic findings:
  present and D-256 closed absent for all 17, plus hidden-subthreshold to displayed-present for
  the 15 nonsafety findings;
- `registry.catalog.finding-projection-horizons` pins that exact projection set and
  `registry.catalog.universal-action-result-assemblies` supplies the current-payload
  `finding_projections`-only D-213 recipe;
- checked-in integration tests prove one positive plus 16 derived negatives becomes one complete
  17-source D-213 binding without changing hidden truth;
- clinical-duration profiles now carry schema/content versions, compatibility resolution saves
  the exact profile version, and future resolved/deferred duration records plus D-240 definitions
  match exact profile ID/version pairs; and
- `registry.catalog.clinical-duration-profiles` now owns one reviewed current-MDD profile with 13
  neutral week-valued options from 2 through 52 weeks, while one second static universal assembly
  routes its already-resolved D-240 Presenting-problem reveal beside the compact 17-finding
  depressive-symptom result;
- the NIMH two-week support remains in an accepted authoring-only Developer-opinion evidence
  relationship rather than leaking an authoring-only source or target into the runtime MDD
  dossier; and
- the pure condition-duration resolver canonicalizes one exact reviewed profile and
  condition/source/time coordinate, makes one unweighted deterministic choice, freezes every
  offered option plus the selected resolved record and stable draw, and replays the complete
  stored request;
- the post-D-208 duration attachment replays the genuine patient-state composition and every
  genuine duration resolution, requires the exact patient/condition coordinate, rejects duplicate
  or preexisting condition/profile owners, preserves a zero-resolution identity path, and emits a
  fingerprinted state without another draw or complexity charge; and
- no D-200/D-194 integration of that attached state, impairment/exclusion content, inaccurate-report profile,
  PatientTemplate, generated patient, point rule, runtime/persistence/UI change, commit, or push
  was added.

Focused D-259/D-260 tests passed 51/51. The D-261 affected-suite run passed 229/231 before two test
expectations were corrected: one D-240 status map and one pre-existing D-255 direct-information
contract assertion. The corrected D-240, D-191, and Reviewer duration suites pass 50/50.
`pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm content:validate`, and
`git diff --check` pass. The first sandboxed content-validator attempt failed only because tsx
could not open its local IPC socket (`EPERM`); the unchanged validator passed with local
permission. D-262's focused duration/profile/assembly suite passes 17/17.
D-263's focused resolver plus checked-in profile/projection suite passes 23/23, including
repeatability, content-order invariance, exact-option bounds across 512 checked-in seeds, crossed
target rejection, and tamper detection.
D-264's focused D-208/D-263/D-264 suite passes 21/21, including zero-input identity, one and
multiple exact attachments, input-order invariance, unchanged D-201 draws/accounting, crossed
patient/condition rejection, duplicate and preexisting-owner rejection, upstream replay, and
tamper detection. `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm content:validate`, and
`git diff --check` pass after D-264.

The D-265 race/ethnicity identity foundation completed locally on 2026-08-03:

- one runtime-excluded catalog pins the seven 2024 OMB SPD 15 minimum categories as a combined,
  select-all-that-apply, self-identified sociopolitical classification;
- one verified formal-source record and public-domain source-use decision support category
  identity and collection structure only, with no psychiatric inference;
- one accepted direct-reviewer Developer opinion records that names never infer identity,
  diagnosis-generation modifiers may alter only positive relative mass, symptom-report effects
  require robust population-matched evidence, and pharmacology effects require unusually strong
  evidence without using social categories as ancestry/genetics proxies;
- `ResolvedPatientDemographicsV3` adds exact standard/version, provided multiselect,
  `not_recorded`, and `declined_to_answer` states while historical v2 snapshots remain unchanged;
- only explicitly provided categories become exact version-pinned demographic decision facts;
  missing states emit no negative fact; and
- validation rejects catalog weights/name-pool inference fields, requires exact registry,
  source-use, OMB-category, and Developer-opinion ownership, and keeps the catalog out of ordinary
  runtime.

The focused demographic and decision-policy suites pass 37/37. `pnpm typecheck`, `pnpm lint`,
`pnpm format:check`, `pnpm content:validate`, and `git diff --check` pass after D-265. The first
sandboxed content-validator run failed only because tsx could not create its local IPC socket
(`EPERM`); the unchanged validator passed with local permission. D-265 adds no demographic
distribution, diagnosis sampler, report profile, pharmacology rule, point value, complexity
spending, PatientTemplate, runtime/persistence/UI change, commit, or push.

The D-266 verified duration-to-finding-pipeline integration completed locally on 2026-08-03:

- D-200 advances to `23.0.0` and owns one nullable
  `conditionClinicalDurationAttachmentArtifact`;
- null preserves the exact D-208-only route, while non-null must replay one genuine D-264 artifact
  whose nested D-208 composition exactly equals the one retained under D-223;
- every retained D-263 resolution must share the one D-233 patient-generation seed;
- D-200 passes only the verified D-208 or D-264 resulting state into the unchanged D-194 `9.0.0`
  base-state path, while D-208 remains the condition-binding and D-210 applicability owner;
- the full optional D-264 artifact participates in D-200 input/payload fingerprints and standalone
  replay, so crossed roots, changed seeds, tampering, or silently dropping a duration source fail;
  and
- D-240 consumes the frozen condition duration in its existing final-state pass without another
  draw or complexity charge.

The affected D-200/D-208/D-240/D-194 suites pass 109/109, including the D-208-only compatibility
route, D-264 attachment replay, exact D-233 seed enforcement, crossed-root rejection, D-194 state
derivation, target-redacted D-240 reveal, and retained-artifact tamper rejection. D-266 adds no
profile-selection plan, clinical weight, probability, severity, impairment/exclusion content,
points, PatientTemplate, runtime/persistence/UI change, commit, or push.
`pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm content:validate`, and
`git diff --check` pass after D-266. The first sandboxed content-validator attempt failed only
because tsx could not create its local IPC socket (`EPERM`); the unchanged validator passed with
local permission.

The D-267 functional-impairment owner completed locally on 2026-08-03:

- `FunctionalImpairmentLevel` defines only the qualitative
  `none`/`mild`/`moderate`/`severe` identities;
- one versioned `ConditionFunctionalImpairmentProfile` binds a finite unique option horizon to one
  exact diagnosis plus reviewed source-use or accepted Developer-opinion provenance;
- one pure authoring-only resolver binds that profile to an exact condition state, patient
  identity, source, time scope, and internal seed, then freezes all options, one selected
  condition-attributed level, stable draw, full request, and profile/input/payload fingerprints;
- integrity validation replays the complete request, while crossed diagnosis/time targets,
  duplicate levels, unapproved provenance, and tampering are rejected; and
- the new record remains distinct from subjective burden and the coarse current-functional-impact
  finding.

The focused D-267 suite passes 5/5. `pnpm typecheck`, `pnpm lint`, `pnpm format:check`,
`pnpm content:validate`, and `git diff --check` pass after D-267. The first sandboxed
content-validator attempt failed only because tsx could not create its local IPC socket (`EPERM`);
the unchanged validator passed with local permission. D-267 checks in no real impairment profile
and adds no resolved-patient attachment, D-200/D-194/D-240 route, MDD severity convention,
selection weight, probability, prevalence, result wording, complexity cost, treatment, points,
PatientTemplate, runtime/persistence/UI change, commit, or push.

The D-268 MDD backend-severity and diagnosis-presentation policy completed locally on 2026-08-03:

- `DiagnosisSeverityAxis` now declares whether severity is player-selectable and may own one exact
  reviewed qualitative derivation policy;
- the MDD axis is `family_only`, so mild/moderate/severe remains internal generation state and
  encounter/content validation rejects player-submitted MDD severity qualifiers;
- the approved MDD policy requires separate symptom-severity and
  condition-attributed-functional-impairment inputs and names only their higher qualitative level;
- every MDD severity level remains `disabled_pending_source`, so the policy cannot generate a
  level or smuggle in unresolved cutoffs;
- `specifier.mdd.psychotic-features` is a separately reviewed, player-selectable named-variant
  identity and is not inferred from severity; and
- the exact user approval is stored as an accepted Developer opinion with a separate CANMAT
  evidence relationship and source-use notes.

The final focused D-268 engine/diagnosis/content/decision suite passes 170/170. Content validation
first exposed the intended exact-version cascade from the MDD dossier to its condition-finding
profile, medication-regimen route, decision policy, balances, and current-duration projection; all
dependent records now carry new payload identities without changing their clinical meaning or
point magnitudes. The separate Developer-opinion validator now recognizes exact diagnosis
severity-policy and specifier targets rather than permitting arbitrary clinical-rule IDs.
`pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm content:validate`, and
`git diff --check` pass. The first sandboxed content-validator attempt failed only because tsx
could not create its local IPC socket (`EPERM`); the unchanged validator passed with local
permission. D-268 adds no symptom-severity owner, real impairment profile/attachment, level
boundary, generation distribution, treatment consequence, point value, complexity cost,
PatientTemplate, generated patient, persistence migration, qualifier UI, commit, or push.

The D-269 same-episode severity-derivation proof completed locally on 2026-08-03:

- `ResolvedConditionSymptomSeverityInput` is a strict external-owner envelope with exact
  patient/condition/diagnosis-version/clinical-state/time coordinates, qualitative level, owner
  version, and payload fingerprint; it does not define or authenticate symptom boundaries;
- one minimized diagnosis owner retains the exact approved D-268 policy without creating another
  diagnosis catalog or enabling a severity branch;
- the pure authoring-only compiler requires one exact symptom envelope plus one native
  replay-valid D-267 impairment artifact for the same episode and emits only their higher
  qualitative level;
- the output is explicitly `derived_descriptor_only`, contains no `severityId`, and freezes both
  input values, owner IDs/versions/fingerprints, complete normalized request, and input/payload
  fingerprints; and
- integrity replay rejects crossed patient, condition, diagnosis version, clinical state, time
  scope, policy, impairment artifact, retained input, and derived-output tampering.

The focused D-267/D-269 suite passes 22/22; the diagnosis/content regression slice passes 85/85.
`pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm content:validate`, and
`git diff --check` pass. The first sandboxed content-validator attempt failed only because tsx
could not create its local IPC socket (`EPERM`); the unchanged validator passed with local
permission. D-269 adds no symptom-severity generator, real impairment profile/attachment,
severity-ID mapping, level boundary, probability, complexity cost, treatment consequence, point
value, PatientTemplate, resolved-patient attachment, runtime/persistence/UI change, commit, or
push.

The D-270 native service-backed treatment-pricing checkpoint completed locally on 2026-08-03:

- the exact versioned `ServiceDefinition` remains the sole operating-price owner, while replay
  snapshot v3 now also freezes every exact intervention/disposition owner and nullable
  fulfillment-service relationship from the verified D-219 horizon;
- generated-attempt input no longer accepts caller-authored treatment-charge rows;
- the final selection derives exactly one least-cost equal-quality quote for each selected
  service-backed treatment, retaining method, cost, outside-service savings, upgrade savings, and
  exact treatment/service fingerprints;
- service-free treatments and medication/regimen operations receive no invented charge;
- settlement v3 independently re-quotes the complete charge set during replay and rejects charge
  or arithmetic tampering; and
- D-235 advances to compiler `9.0.0` and completed-attempt v3 without changing care points,
  treatment availability, price content, the payout floor, complexity, persistence, runtime, or
  UI.

The focused service/operational tests pass 33/33, and the isolated D-270 generated-attempt
integration passes 1/1. The complete local checkpoint now also passes all 1,068 Vitest tests across
107 files, all 10 handoff tests, root lint, root typecheck, formatting, `git diff --check`, and the
full content validator. The full regression gate exposed and repaired three stale test expectations
from the already-accepted D-254-through-D-269 ticket/source lifecycle changes plus the matching
strict Developer knowledge/runtime-boundary allowlists; no production behavior was loosened.
The content validator required the known local permission rerun because sandboxed `tsx` could not
create its IPC pipe (`EPERM`), then passed every catalog and case. Base reimbursement, challenge
bonus, satisfaction multiplier, and pre-encounter bank inputs remain explicit non-native settlement
inputs. No app build, browser suite, app server, SaveData/IndexedDB migration, runtime activation,
commit, push, or Pages check is due.

The D-271 native generated-settlement-context checkpoint completed locally on 2026-08-03:

- a separate strict `GeneratedEncounterEconomyPolicy` now owns provisional base reimbursement and
  challenge bonus for one exact PatientTemplate ID/version/fingerprint, without deriving either
  value from diagnosis, severity, setting, file order, or optional complexity;
- the complete current ClinicState now owns clinic/lifetime points before the encounter and raw
  satisfaction, and must project exactly to the D-227 operational clinic context that admitted the
  frozen patient;
- one exact versioned satisfaction-configuration owner rederives the multiplier and rejects a
  stale stored clinic multiplier;
- `generated-encounter-settlement-context.v1` freezes all owners, operational projection, derived
  multiplier, and independent fingerprints in replay snapshot v4;
- generated-attempt input no longer accepts free base, challenge, multiplier, clinic-points, or
  lifetime-points scalars; settlement v4 derives those values, payout, zero floor, practice-mode
  bank behavior, and after-balances from the frozen context; and
- D-235 advances to compiler `10.0.0` and completed-attempt v4. One focused end-to-end test proves
  the owner-derived arithmetic, rejects the retired scalar shape, rejects crossed template and
  stale satisfaction sources, and detects replay-context tampering.

The focused generated-attempt/runtime-boundary suite passes 65/65. The complete local checkpoint
also passes all 1,069 Vitest tests across 107 files, all 10 handoff tests, root lint, root
typecheck, formatting, `git diff --check`, and the full content validator. The content validator
used its existing local-permission path so `tsx` could create the required IPC socket and passed
every catalog and case.

D-271 adds no real template economy-policy record and changes no production value, compatibility
case economy, clinical rule, point magnitude, service price, complexity, patient generation,
SaveData/IndexedDB, runtime, or UI. The next economy step is real balance content only after a real
PatientTemplate exists; it must not become a reason to invent a template prematurely.

The D-272 generated diagnosis-qualifier checkpoint completed locally on 2026-08-03:

- a new strict compiler consumes the exact diagnosis-selection horizon plus full source diagnosis
  definitions at the authoring boundary and freezes only the minimized qualifier facts needed to
  validate a submitted diagnosis;
- each minimized owner pins the exact diagnosis identity/version and full source-definition
  fingerprint, family-only versus severity-selectable behavior, reviewed player-selectable
  specifiers, exclusive groups, and its own payload fingerprint;
- MDD therefore rejects player-entered mild/moderate/severe qualifiers while accepting the exact
  reviewed psychotic-features specifier; internal or unavailable specifiers, unsupported severity
  identities, and same-exclusive-group collisions fail closed;
- both player and database-plan snapshots are checked against that same frozen owner set, and
  replay verifies its exact horizon and payload rather than persisting full diagnosis dossiers;
  and
- D-235 advances to compiler `11.0.0`, replay snapshot v5, and completed-attempt v5 while settlement
  remains v4 and generated point report remains v7. The completed-attempt audit field now records
  `exact_frozen_qualifier_owners` instead of the superseded family-identity-only label.

D-272 adds no diagnosis inference, diagnosis points, severity derivation, qualifier UI, real
PatientTemplate, clinical rule, persistence migration, runtime activation, or player-facing
content. A future severity-selectable diagnosis must provide exact reviewed enabled level owners;
the current MDD diagnosis remains family-only as approved.

The focused diagnosis-owner/selection/runtime-boundary gate passes 23/23. The complete local
checkpoint passes all 1,073 Vitest tests across 108 files, all 10 handoff tests, root lint, root
typecheck, formatting, `git diff --check`, and the full content validator. The validator used its
existing local-permission path so `tsx` could create the required IPC socket and passed every
catalog and case. No app build, browser suite, app server, SaveData/IndexedDB migration, runtime
activation, commit, push, or Pages check is due.

The D-273 standalone launcher-presentation checkpoint completed locally on 2026-08-03:

- new strict schemas define reusable short chief-complaint banks, exact profile bindings to
  fictional first/last-name pools, the literal 25% middle-initial policy, complete resolution
  audit, and a minimized player-safe resolved presentation;
- the pure resolver uses independent stable substreams for first name, last name, middle-initial
  presence, middle-initial letter, complaint-bank selection, and complaint-variant selection;
- first and last names receive no race/ethnicity, sex, diagnosis, or complaint inputs, while
  complaint text remains separate from clinical truth, rules, points, and eligibility;
- equal-priority complaint banks can mix general and condition-specific wording, while a higher
  priority is an explicit specific-over-general authoring override and same-level weights mean
  synthetic game variety only; and
- deterministic integrity replay covers the exact profile, pools, banks, eligible/shadowed
  bindings, stable draws, resolved display, and fingerprints. The minimized presentation contains
  no seed, diagnosis, source prose, authoring rationale, or score data.

The focused D-273 resolver/runtime-boundary gate passes 19/19. The complete local checkpoint
passes all 1,078 Vitest tests across 109 files, all 10 handoff tests, root lint, root typecheck,
formatting, `git diff --check`, and the full content validator. The validator used its existing
local-permission path so `tsx` could create the required IPC socket. D-273 adds no real
complaint-bank/profile content, PatientInstance or D-200/D-235 attachment, waiting-slot/save
migration, historical debrief projection, runtime activation, browser/UI work, commit, push, or
Pages check.

The D-274 transitional local Developer Patient Maker checkpoint completed locally on 2026-08-03:

- the Developer content subpath now projects only approved/review CaseBlueprints that pass the
  complete canonical content validator and own a nonlegacy measured complexity profile;
- the collapsed local-only UI lets the reviewer select one exact authored complexity budget and
  one matching playable case, with responsive single-column controls on a phone;
- the budget is a strict filter and cannot edit the CaseBlueprint, materialize D-201 modules,
  change hidden facts, or imply that the future database-generated PatientTemplate path is active;
- the pure queue entry point reuses ordinary deterministic case instantiation and eligibility,
  replaces a prior maker/same-case slot, explicitly re-enables a selected previously run case,
  preserves/refills other Developer cases through the canonical queue algorithm, and freezes the
  result at `slot.developer.patient-maker` before the chart opens; and
- completed attempts, case notes, review tickets, and export continue through the existing
  Developer workflow, while Normal, Endgame, and portable Reviewer content receive no maker
  allowlist.

Focused engine/content/component coverage passes 69/69. The dedicated 390-by-844 Patient Maker
browser check passes 1/1. The complete local integration gate also passes:

- all 1,081 Vitest tests across 110 files and all 10 handoff tests;
- root lint, strict typecheck, formatting, and `git diff --check`;
- the complete content, source-boundary, diagnosis, and private cross-reference validators after
  deterministically refreshing the ignored local Developer knowledge projection;
- both existing reference-run families with their established efficient/alternative/shotgun/
  unsafe ordering;
- sequential Player and portable Reviewer production builds plus their bundle-isolation scans;
- all six Player/local-Developer Chromium tests, including Patient Maker generation, queue
  persistence, and reload at phone width; and
- all four portable Reviewer phone tests at Pixel 7 and 320-pixel widths.

The first unit invocation was incorrectly run concurrently with lint, TypeScript, and formatting,
causing three existing five-second stress tests to time out under CPU contention; the required
standalone `pnpm test` gate then passed all 1,081 tests. Local validation used Node 26.3.0 because
Node 22 is not installed on this Mac. GitHub run `30842884010` subsequently passed the complete
project-required Node 22 gate, including all unit, content, source-boundary, Player/Developer
browser, portable Reviewer mobile, and bundle-build stages. The complete public checkpoint is
backed up on `beta`; `main` remains unchanged.

The D-275 scalable modular-complexity checkpoint completed locally on 2026-08-03:

- the original `additional-feature-budget.v1` profile remains exact and replay-compatible, with
  its historical three-module, six-unit ceiling;
- the new `baseline-plus-additional-budget.v2` profile records an encounter-recipe-owned required
  baseline separately from an optional-richness maximum, supporting up to 24 independently
  selected modules, 96 optional units, and explicit per-module costs from 1 through 12;
- legacy artifacts retain `baselineComplexityUnits: null` rather than falsely converting an
  unmeasured historical baseline into zero, while v2 artifacts preserve the exact authored
  baseline;
- D-201 selector `3.0.0` preserves a stable draw, selection ordinal, cost, reason, template
  fingerprint, profile fingerprint, and complete selected/unselected audit for every optional
  module, with exact feasibility pruning for larger sets;
- every active typed bridge and the D-208 composition boundary accepts the wider audit without
  introducing another draw or charge; one selected module may materialize several typed records,
  findings, or later rule inputs while retaining its single module identity and cost; and
- the intended learning trace remains encounter recipe and complexity profile → selected module
  → exact typed binding/record/fact → reviewed qualitative rule → separately balanced receipt row.
  Baseline and optional cost do not imply player difficulty, eligibility, probability, points,
  reimbursement, or clinical importance.

The focused selector suite passes 15/15 and the focused selector/bridge/composition group passes
118/118 across 10 files. The complete unit suite, root lint, strict typecheck, formatting, and
`git diff --check` pass. The full content validator also passes through its existing
local-permission path for the `tsx` IPC socket. No real v2 complexity profile or module, Patient
Maker/runtime activation, patient content, scoring rule, point balance, persistence/UI change, app
build, browser suite, commit, push, or Pages check is included.

The D-276 qualified-result-semantics checkpoint completed locally on 2026-08-03:

- compatibility finding blueprints and resolved findings now accept the optional versioned
  `finding-result-semantics.v1` envelope, preserving historical CaseInstance parsing;
- the envelope distinguishes ordinary status results from qualified values whose
  neutral/normal/abnormal/indeterminate/not-applicable interpretation is stored independently;
- a qualified value uses `outcome: present` only to mean that a concrete answer exists, requires
  visible value text, and keeps the existing value-only presentation mode;
- deterministic case instantiation carries the exact envelope into the saved result;
- the finite Reviewer-cohort adapter now projects regimen adherence from typed entry state:
  consistent is normal, intermittent and not-taking are abnormal, and unknown is indeterminate;
  no adherence category is mislabeled positive or negative; and
- the affected MDD nonresponse, MDD adherence, and schizophrenia-relapse scenario versions and
  their assigned-ticket versions advance together.

Focused schema, encounter, and Reviewer-content coverage passes 67/67 across three files. The
complete checkpoint passes all 1,084 Vitest tests across 110 files, all 10 handoff tests, root
typecheck, lint, formatting, `git diff --check`, and the full content validator through its
existing local-permission path for the `tsx` IPC socket. D-276 does not add a clinical rule, point
value, patient-truth inference, React styling, native D-214 attachment, exact regimen-entry reveal
attribution, app build, browser run, commit, push, or Pages check.

The D-277 exact medication-record result-attribution checkpoint completed locally on 2026-08-03:

- compatibility finding blueprints and resolved findings now accept the optional versioned
  `finding-record-subject.v1` reference;
- its closed variants name one exact current regimen entry or one exact prior medication trial in
  the containing patient snapshot;
- CaseBlueprint and CaseInstance validation reject missing/crossed subjects, and deterministic
  instantiation preserves the exact reference;
- the finite Reviewer compiler attaches subjects to medication reconciliation, adherence, focused
  prior-trial history, and the medication portion of full treatment history;
- several reveal actions may point to the same record without duplicating or merging that record;
  labels, medication IDs, finding-ID substrings, array order, and prose have no ownership
  authority; and
- the six affected Reviewer scenario versions and their exact assigned-ticket versions advance
  together.

Focused schema, encounter, and Reviewer-content coverage passes 68/68 across three files. The
complete checkpoint passes all 1,085 Vitest tests across 110 files, all 10 handoff tests, root
typecheck, lint, formatting, `git diff --check`, and the full content validator through its
existing local-permission path for the `tsx` IPC socket. D-277 does not add medication benefit,
tolerability, causality, dose mechanics, rules, points, React behavior, native D-214 attachment,
app builds, browser tests, commit, push, or Pages checks.

The D-278 sparse current-medication reported-benefit checkpoint completed locally on 2026-08-03:

- one typed record attaches `none`, `partial`, `substantial`, or assessed-but-`unknown`
  patient-reported benefit to an exact D-277 current-regimen subject, patient-report source
  instance, and time scope;
- record existence means the medication was assessed, while an absent record means neither
  unassessed nor no benefit; D-212 source-view presentation status remains the owner of that
  distinction;
- resolved patient state, compatibility patient records, and finite Reviewer scenarios reject a
  dangling benefit subject, while normalizers and composers preserve the sparse record;
- D-212 now has a closed current-medication-benefit lane, and decision-fact extraction emits the
  exact record/source/time/medication/subject without creating a rule;
- any future response-linked regimen operation must require and target the exact regimen-entry
  subject; and
- the medically unreviewed MDD nonresponse Reviewer case exposes `Reported benefit: none` for its
  exact sertraline entry as a neutral qualified value.

Focused D-278 schema, decision, reveal, and Reviewer-content coverage passes 66/66 across four
files. The complete checkpoint passes all 1,089 Vitest tests across 110 files, all 10 handoff
tests, root typecheck, lint, formatting, `git diff --check`, and the full content validator through
its existing local-permission path for the `tsx` IPC socket. D-278 adds no medication-specific
probability, clinical rule, point value, dose mechanic, causal inference, generalized patient
generation, persistence migration, React behavior, app build, browser run, commit, push, or Pages
check.

The D-279 exact medication-tolerability compatibility checkpoint completed locally on 2026-08-03:

- the existing `MedicationTolerabilityFindingV2` remains the sole typed owner rather than being
  duplicated by another adverse-effect model;
- compatibility patient records and finite Reviewer scenarios now carry migration-safe sparse
  collections and reject missing current-regimen or prior-trial subjects;
- `unknown`, `absent`, and `present` remain distinct, manifestations remain present-only, and the
  finite medication-effects projection derives its medication label only from the exact subject;
- the projection retains the D-277 subject and uses D-276 indeterminate/normal/abnormal
  presentation interpretations without creating clinical meaning; and
- the medically unreviewed MDD nonresponse Reviewer case displays no other reported adverse
  effects for its exact current sertraline entry alongside its separate no-benefit record.

Focused D-279 schema, decision, reveal, and Reviewer-content coverage passes 67/67 across four
files. The complete checkpoint passes all 1,090 Vitest tests across 110 files, all 10 handoff
tests, root typecheck, lint, formatting, `git diff --check`, and the full content validator through
its existing local-permission path for the `tsx` IPC socket. D-279 adds no medication-specific
incidence or game probability, random adverse effect, causal or temporal inference, clinical
rule, point value, generalized patient generation, persistence migration, React behavior, app
build, browser run, commit, push, or Pages check.

The D-280 exact medication-change temporal-relationship checkpoint completed locally on
2026-08-03:

- one sparse point-free record names an exact current-regimen entry, a
  started/increased/reduced/stopped change, separate change and target time scopes, one exact
  source instance, one separately owned target, and only before/after/uncertain temporal order;
- native resolved patient state accepts only included canonical-finding or
  categorical-observation targets, while compatibility patient records accept only exact
  information-action/finding coordinates;
- compatibility CaseBlueprint and CaseInstance validation reject dangling targets, missing
  relationship references, and a projected regimen subject crossed from the relationship owner;
- deterministic instantiation retains the exact relationship reference and regimen subject;
- D-212 gains one closed medication-change-temporal source-view lane without adding source
  behavior or presentation wording; and
- the medically unreviewed review-only restlessness case now stores distinct fluoxetine and
  aripiprazole regimen entries and reports that restlessness followed the exact aripiprazole
  increase rather than an unspecified dose increase.

Focused D-280 schema, source-view, decision-regression, and compatibility-content coverage passes
111/111 across four files. The complete checkpoint passes all 1,093 Vitest tests across 110 files,
all 10 handoff tests, root typecheck, lint, formatting, `git diff --check`, and the full content
validator through its existing local-permission path for the `tsx` IPC socket. D-280 adds no dose
amount or schedule, medication-causality or akathisia inference, incidence probability, clinical
rule, point value, balance, complexity cost, generalized patient generation, persistence
migration, React behavior, app build, browser run, commit, push, or Pages check.

The D-281 sparse exact current-medication dose-position checkpoint completed locally on
2026-08-03:

- one point-free record names one exact current-regimen entry, `below_maximum`, `at_maximum`, or
  assessed-but-`unknown`, one source instance, and one time scope;
- record absence has no inferred meaning, while unknown remains distinct from below maximum;
- native, compatibility, and finite Reviewer state reject a dangling regimen subject;
- normalization and composition preserve stable dose-position records;
- D-191 projects exact same-record decision facts and requires a future dose-position-linked
  regimen operation to target the same exact entry;
- D-212 gains one closed dose-position lane; and
- an in-memory Reviewer compatibility proof renders assessed-unknown Sertraline dose position
  without changing checked-in patient content or storing a dose or medication-specific maximum.

Focused D-281 schema, source-view, decision, and compatibility coverage passes 73/73 across four
files. The complete checkpoint passes all 1,097 Vitest tests across 110 files, all 10 handoff
tests, root typecheck, lint, formatting, `git diff --check`, and the full content validator through
its existing local-permission path for the `tsx` IPC socket. D-281 adds no medication-maximum
table, milligram value, schedule, adequacy inference, treatment conclusion, probability, clinical
rule, point value, balance, complexity cost, generalized patient generation, persistence
migration, React behavior, app build, browser run, commit, push, or Pages check.

The D-282 point-free instrument-administration checkpoint completed locally on 2026-08-03:

- one standalone administration definition pins an exact D-220 instrument version, opaque rights
  boundary, information action, respondent, time scope, unique item set, and nullable lawful raw
  total range;
- one administration record pins the exact definition and source instance, explicitly records
  complete versus partial status, lists included item-response and missing-item identities, and
  carries either a bounded already-authored raw total or `not_calculated`;
- included and missing items must exactly partition the administration definition, and every
  included response must retain its exact neutral instrument/item/scale/option/source/time/rights
  coordinates without interpretation;
- a partial administration, including an attempted administration with zero completed items,
  cannot carry a total, so missing answers never silently become zero; and
- the boundary remains standalone schema-level authoring state: it neither calculates nor
  interprets a total and is not attached to the generated-patient or action-result chain.

The focused D-282 plus D-220 suite passes 20/20 across two files. The complete checkpoint passes
all 1,101 Vitest tests across 111 files, all 10 handoff tests, root typecheck, lint, formatting,
`git diff --check`, and the full content validator. D-282 adds no real instrument, item text,
response weight, calculation formula, cutoff, validation claim, diagnosis, severity, clinical
rule, point value, balance, complexity cost, rights permission, persistence, runtime attachment,
UI, app build, browser run, commit, push, or Pages check.

The D-283 exact patient-bound instrument-administration compiler checkpoint completed locally on
2026-08-03:

- one strict authoring request embeds the complete replay-verifiable D-220 artifact, exact approved
  D-282 administration definition, source instance, explicit included/missing item references,
  and optional already-authored raw total;
- the caller cannot author patient or output-administration identity; the compiler derives both
  from the verified D-220 patient state and normalized request;
- an included response must equal the exact response named by its complete D-220 evaluation, while
  a missing item is permitted only when its exact incomplete evaluation reports only
  `response_not_resolved`;
- stale/missing definitions, forbidden options, owner mismatches, duplicate responses, and other
  structural D-220 failures cannot be relabeled as patient nonresponse; and
- compiler `1.0.0` normalizes set-like references, fingerprints the exact request/definition/
  output, freezes the request, and replays deterministically through the authoring-only export.

The focused D-220/D-282/D-283 suite passes 24/24 across three files. The complete checkpoint passes
all 1,105 Vitest tests across 112 files, all 10 handoff tests, root typecheck, lint, formatting,
`git diff --check`, and the full content validator. D-283 adds no real instrument or item text,
total calculation, score interpretation or validation, source-instance existence proof, rights
permission, result/runtime attachment, complexity cost, clinical rule, balance, point value,
persistence, UI, app build, browser run, commit, push, or Pages check.

The D-284 strict presentation-safe instrument-administration projection checkpoint completed
locally on 2026-08-03:

- one pure projector first integrity-verifies the complete D-283 artifact and then retains only
  hidden patient/administration identity, action and exact definition versions,
  respondent/time/opaque-rights coordinates, complete/partial state, item counts, and the
  already-authored raw-total state;
- source-instance identity, item IDs and responses, raw-total range, definitions, compile request,
  fingerprints, diagnostics, labels, wording, and interpretation remain authoring-only;
- strict count invariants require one exact completed/missing partition, and a partial
  administration cannot expose a calculated total; and
- a separate verifier reprojects the exact D-283 artifact and rejects any changed coordinate,
  count, completion state, or raw total rather than trusting a caller-authored summary.

The focused D-220/D-282/D-283/D-284 suite passes 27/27 across four files. The complete checkpoint
passes all 1,108 Vitest tests across 113 files, all 10 handoff tests, root typecheck, lint,
formatting, `git diff --check`, and the full content validator. The validator required its existing
local-permission path because `tsx` could not create its IPC socket inside the sandbox. D-284 adds
no real instrument or item text, score calculation or interpretation, source-instance existence
proof, rights permission, `PatientInstance`/D-213/D-214/runtime attachment, complexity cost,
clinical rule, balance, point value, persistence, UI, app build, browser run, commit, push, or
Pages check.

The D-285 exact frozen-context instrument-administration admission checkpoint completed locally
on 2026-08-03:

- one standalone context retains an exact patient-state identity, finite information-action
  horizon, and D-214-compatible presentation-safe item responses without claiming to be a
  `PatientInstance`;
- compiler `1.0.0` independently verifies D-283, derives D-284, and rejects a crossed patient,
  out-of-horizon action, absent included response, or any included safe response whose exact
  coordinate differs from D-220;
- complete, partial, and zero-response administrations retain D-283's semantics and do not
  manufacture a total; and
- set-like context fields are normalized, the exact request/output are fingerprinted and frozen,
  and integrity replay rejects tampering.

The focused D-220/D-282/D-283/D-284/D-285 suite passes 31/31 across five files. The complete
checkpoint passes all 1,112 Vitest tests across 114 files, all 10 handoff tests, root typecheck,
lint, formatting, `git diff --check`, and the full content validator through its existing
local-permission path for the `tsx` IPC socket. D-285 adds no source-instance proof, rights
permission, `PatientInstance`/D-194/D-213/D-214 mutation, encounter-result binding, score
calculation or interpretation, real instrument content, complexity cost, clinical rule, balance,
point value, persistence, UI, app build, browser run, commit, push, or Pages check.

The D-286 exact catalog-snapshot administration-context adapter checkpoint completed locally on
2026-08-03:

- one standalone adapter independently verifies the complete D-194 catalog snapshot and D-283
  administration;
- D-283 must embed the exact same D-220 artifact retained by the snapshot, so an otherwise valid
  administration from another patient/snapshot is rejected;
- D-285's patient-state ID, action horizon, and safe item responses are derived exclusively from
  the snapshot rather than supplied by the caller; and
- a fingerprinted wrapper retains the exact snapshot, D-283, and derived D-285 relationship for
  deterministic replay without modifying the source snapshot.

Focused D-282-through-D-286 plus catalog attachment coverage passes 68/68 across six files. The
complete checkpoint passes all 1,114 Vitest tests across 114 files, all 10 handoff tests, root
typecheck, lint, formatting, `git diff --check`, and the full content validator through its
existing local-permission path for the `tsx` IPC socket. D-286 adds no source-instance proof,
rights permission, real instrument content, `PatientInstance`/D-194/D-213/D-214 mutation,
encounter-result binding, score calculation or interpretation, complexity cost, clinical rule,
balance, point value, persistence, UI, app build, browser run, commit, push, or Pages check.

The D-287 exact catalog-snapshot launcher-presentation adapter checkpoint completed locally on
2026-08-03:

- one standalone adapter independently verifies the complete D-194 catalog snapshot and derives
  D-273's patient-state identity and seed exclusively from its exact `PatientInstance`;
- the caller can provide only a reviewed launcher profile plus its exact fictional-name pools and
  chief-complaint banks; extra caller-authored patient or seed fields fail strict parsing;
- D-273 remains the sole content validator, normalizer, and deterministic draw owner, so reordered
  set-like presentation inputs produce the same nested resolution and wrapper; and
- a fingerprinted wrapper retains the exact snapshot and D-273 relationship for replay without
  mutating the source snapshot or attaching presentation to runtime.

Focused D-273 plus catalog attachment coverage passes 44/44 across two files. The complete corpus
passes all 1,116 Vitest tests across 114 files with bounded workers and a 10-second runner ceiling,
all 10 handoff tests, root typecheck, lint, formatting, `git diff --check`, and the full content
validator through its existing local-permission path for the `tsx` IPC socket. Two ordinary
default-timeout full runs encountered only unrelated 5-second lifecycle/content stress-test
timeouts under machine load; each timed-out test passed in isolation with its unchanged assertion,
and the complete 1,116-test corpus passed without changing any test or domain code. D-287 adds no
real launcher profile/bank, diagnosis or formulary content, `PatientInstance`/D-200/D-235 mutation,
waiting-slot attachment, probability, clinical rule, balance, point value, persistence, runtime,
UI, app build, browser run, commit, push, or Pages check.

The D-288 neutral medication-identity gap checkpoint completed locally on 2026-08-03:

- the preliminary adjunct breadth inventory exposed clomipramine and pregabalin as missing
  candidate bins, but supplied no canonical identity or clinical meaning;
- the canonical thread independently verified `medication.clomipramine` (RxCUI 2597) and
  `medication.pregabalin` (RxCUI 187832) as active RxNorm ingredient concepts against official NLM
  RxNorm data version 03-Aug-2026, API version 3.1.354;
- a separate dated evidence/source-use snapshot prevents either new record from falsely citing the
  older July Current Prescribable Content release; and
- both records are identity-only, medically unreviewed, searchable public-catalog bins.

Focused content, public-projection, source-use, and runtime-boundary coverage passes 87/87 across
four files. The full content validator, root typecheck, lint, formatting, and `git diff --check`
also pass. The catalog now contains 55 normalized medication identities, of which 42 remain
identity-only and 13 retain runtime compatibility. D-288 adds no runtime medication definition,
formulation, medication class, indication, diagnosis relationship, treatment route, formulary
membership, comparative fit, safety rule, probability, balance, point value, patient, encounter
generation, or UI mechanism.

The D-289 condition-functional-impairment attachment checkpoint completed locally on 2026-08-03:

- one standalone authoring compiler verifies an exact completed D-208 patient-state composition
  and every complete D-267 impairment-resolution artifact;
- each resolution must target the exact composed patient and one unchanged included condition,
  while artifact IDs, resolved-record IDs, and condition/profile assignments remain unique;
- set-like resolution input is normalized, and the artifact freezes the exact D-208/base-state
  references, minimized D-267 references, resolved impairment records, and replay fingerprints;
  and
- an empty collection preserves the exact binding without changing or replacing D-208.

Focused D-267/D-289 and D-208 attachment coverage passes 26/26 across two files. Root typecheck,
lint, formatting, and `git diff --check` also pass. D-289 adds no real impairment profile,
replacement `ResolvedPatientState`, source-instance proof, information-result projection, MDD
severity mapping, complexity charge, clinical rule, balance, point value, persistence, runtime,
UI, commit, push, or Pages check.

The D-290 target-redacted functional-impairment projection checkpoint completed locally on
2026-08-03:

- the authoring-only projector first verifies and replays the complete D-289 attachment;
- its strict output retains only the patient-state ID plus stable-ID-ordered resolved impairment
  ID, qualitative level, source kind, and time scope;
- diagnosis/condition targets, profile/option IDs, source-instance identity, draw/resolution
  provenance, requests, and fingerprints are absent from the minimized view; and
- exact reprojection rejects invalid, crossed, duplicated, or caller-altered values, including
  while preserving a genuinely empty D-289 collection.

Focused D-267/D-289/D-290 and D-208 attachment/projection coverage passes 30/30 across two files.
Root typecheck also passes. D-290 adds no real impairment profile, information-action result,
`ResolvedPatientState` or `PatientInstance` field, D-200/D-194/D-213/D-214/D-240 attachment,
severity mapping, source-instance validation, complexity, clinical rule, balance, point,
persistence, runtime, UI, commit, push, or Pages check. Root lint, formatting, and
`git diff --check` also pass.

The D-291 patient-scene source-instance checkpoint completed locally on 2026-08-03:

- one versioned definition owns only a stable identity, content version, and closed patient-scene
  source kind;
- the authoring compiler canonicalizes zero or more unique definitions, binds them to one exact
  patient state, derives deterministic opaque instance IDs, and freezes full request/payload
  replay audit;
- the generic validator accepts a scoped source only when the horizon is replay-valid, belongs to
  the expected patient, contains the exact instance, and assigns the matching source kind; and
- an empty horizon remains structural emptiness rather than evidence that an assessment occurred
  or was negative.

Focused D-291 coverage passes 5/5 and root typecheck passes. D-291 adds no real source-role
definition, credibility, accuracy, independence, report behavior, action availability, clinical
meaning, probability, complexity, rule, balance, point, persistence, runtime, UI, commit, push, or
Pages check. Root lint, formatting, and `git diff --check` also pass.

The D-292 condition-functional-impairment source-validation checkpoint completed locally on
2026-08-03:

- the authoring adapter independently replays one D-289 impairment attachment and one D-291
  source horizon, then requires exact patient equality;
- every attached D-267 source instance must exist in the independent horizon and use its exact
  source kind;
- the artifact freezes stable-ID-ordered source bindings and derives rather than accepts the
  strict D-290 projection; and
- empty D-289 and D-291 collections remain a valid empty proof.

Focused D-267/D-289/D-290/D-291/D-292 coverage passes 39/39 across three files and root typecheck
passes. D-292 adds no real source definition or impairment profile, source credibility/accuracy,
patient-state mutation, information-action result, severity mapping, complexity, clinical rule,
balance, point, persistence, runtime, UI, commit, push, or Pages check. Root lint, formatting, and
`git diff --check` also pass.

The D-293 instrument-respondent source-validation checkpoint completed locally on 2026-08-03:

- the authoring adapter independently replays one D-283 instrument administration and one D-291
  source horizon, then requires exact patient equality;
- the administration respondent source instance must exist in that independent horizon and its
  patient-report, collateral-report, or clinician-observation kind must match exactly;
- the adapter derives rather than accepts the strict D-284 projection and preserves complete,
  partial, and authored-raw-total semantics; and
- full request/payload fingerprints plus replay detect upstream and retained-artifact tampering.

Focused D-283/D-284/D-291/D-293 coverage passes 16/16 across four files and root typecheck passes.
An initial declaration-order failure in the schema module was caught before domain tests and fixed
by placing the D-293 schemas after their D-283 dependencies. D-293 adds no real source or
instrument definition, D-285/D-286 admission, rights decision, reliability, score calculation or
interpretation, action/result attachment, patient/runtime state, persistence, UI, commit, push, or
Pages check. Root lint, formatting, and `git diff --check` also pass.

The D-294 condition-clinical-duration source-validation checkpoint completed locally on
2026-08-03:

- the authoring adapter independently replays one D-264 duration attachment and one D-291 source
  horizon;
- the horizon must use the exact D-264 base patient-state ID already named by every D-263
  resolution, and every newly attached duration source must exist with its exact kind;
- because D-264 can create a changed composed-state ID, the artifact retains that resulting ID and
  fingerprint separately rather than substituting it as the original source scope; and
- empty D-264 and D-291 collections remain a valid empty proof with full replay/tamper protection.

Focused D-208/D-263/D-264/D-289/D-290/D-291/D-292/D-294 coverage passes 38/38 across two files and
root typecheck passes. D-294 adds no real source definition or duration profile, D-240 projection,
source credibility/behavior, duration threshold or interpretation, information result, complexity,
clinical rule, balance, point, persistence, runtime, UI, commit, push, or Pages check. Root lint,
formatting, and `git diff --check` also pass.

The D-295 source-validated duration-to-finding-pipeline checkpoint completed locally on
2026-08-03:

- D-200 advances to `24.0.0` and replaces its nullable raw D-264 field with one nullable exact
  D-294 source-validation artifact;
- null preserves the existing D-208-only path, while a non-null wrapper must replay its D-264
  attachment and independent base-patient D-291 source horizon before D-200 derives the resulting
  state;
- the existing exact D-208-root and one-D-233-seed checks remain, and the D-200 audit now retains
  D-294's source bindings, horizon, base-patient scope, composed-state reference, and full request;
  and
- D-194 `9.0.0` and D-240 remain unchanged and consume only the verified resulting state.

Focused D-200 duration/source-validation coverage passes 51/51 in
`finding-pipeline-audit-composer.test.ts`, and root typecheck passes. D-295 adds no real source
definition or duration profile, source credibility/behavior, duration probability or threshold,
clinical interpretation, new result content, complexity, clinical rule, balance, point,
persistence, runtime, UI, commit, push, app build, browser suite, server, or Pages check. Root
lint, repository-wide formatting, and `git diff --check` also pass.

The D-296 source-validated instrument-admission checkpoint completed locally on 2026-08-03:

- D-285 and D-286 advance to `2.0.0` and replace raw D-283 input with one exact replay-valid D-293
  respondent-source validation;
- D-285 preserves its frozen patient/action/safe-item-response checks and uses D-293's derived
  D-284 projection, while D-286 still derives that context from one verified D-194 snapshot;
- D-286 requires D-293's embedded D-220 artifact to equal the snapshot's exact retained D-220
  artifact, and both audit artifacts retain the complete source-validation reference; and
- raw D-283 requests are explicitly rejected, while complete, partial, zero-response, and
  authored-total semantics remain unchanged.

Focused D-283/D-284/D-285/D-286/D-291/D-293 plus catalog-snapshot coverage passes 47/47 across
three files, and root typecheck passes. D-296 adds no real source or instrument definition,
credibility/accuracy, rights decision, score calculation or interpretation, result attachment,
patient/runtime state, complexity, clinical rule, balance, point, persistence, UI, commit, push,
app build, browser suite, server, or Pages check. Root lint, repository-wide formatting, and
`git diff --check` also pass.

The D-297 source-validated standalone episode-severity checkpoint completed locally on 2026-08-03:

- D-269 advances to `2.0.0` and now requires one complete replay-valid D-291 source-instance
  compilation beside its standalone D-267 impairment input;
- the D-291 horizon must belong to the same exact patient and contain D-267's opaque source
  instance with the exact recorded source kind;
- the derivation artifact retains the exact D-291 reference and validated source binding beside
  its existing policy, symptom-severity, D-267, and replay audit; and
- a raw D-267-only request is rejected, while D-292 remains the distinct post-D-208 D-289
  collection proof.

Focused D-267/D-269/D-291 source-validation coverage passes 28/28 across three files, and root
typecheck passes. D-297 adds no real source definition, source credibility/accuracy, real
impairment profile, symptom-severity owner, severity mapping, patient/result attachment,
probability, complexity, clinical rule, balance, point, persistence, UI, commit, push, app build,
browser suite, server, or Pages check. Root lint, repository-wide formatting, and
`git diff --check` also pass.

The D-298 target-scoped duration/burden source-validation checkpoint completed locally on
2026-08-03:

- one standalone authoring adapter independently replays D-240 and one same-patient D-291 source
  horizon;
- every complete D-240 value is reconstructed through its exact
  information-action/record/frozen-value binding and its opaque source instance must exist with
  the exact recorded kind;
- the artifact retains the exact upstream references and binding audit while carrying only
  D-240's already-target-redacted frozen reveals; and
- an empty source horizon is valid only when D-240 projected no source-bearing value.

Focused D-240/D-291/D-298 coverage passes 18/18 across two files, and root typecheck passes.
D-298 adds no real source or projection definition, source credibility/accuracy, action
availability, D-194/D-213/D-214 integration, patient/result attachment, probability, complexity,
clinical rule, balance, point, persistence, UI, commit, push, app build, browser suite, server, or
Pages check. Root lint, repository-wide formatting, and `git diff --check` also pass.

The D-299 structured source-report source-validation checkpoint completed locally on 2026-08-03:

- one standalone authoring adapter independently replays D-215 and one same-patient D-291 source
  horizon;
- every selected D-215 profile is reconstructed through its exact
  profile/version/definition/projection binding and its opaque source instance must exist with the
  exact recorded kind;
- the artifact retains the exact upstream references and source-binding audit while carrying
  D-215's detached D-212 projection recipes unchanged; and
- shared source instances remain valid across profiles, but every distinct source reference is
  independently checked against the horizon.

Focused D-215/D-291/D-299 coverage passes 25/25 across two files, and root typecheck passes. D-299
adds no real source or report profile, source credibility/accuracy, report behavior selection,
D-194/D-213/D-214 integration, patient/result attachment, probability, complexity, clinical rule,
balance, point, persistence, UI, commit, push, app build, browser suite, server, or Pages check.
Root lint, repository-wide formatting, and `git diff --check` also pass.

The D-300 reusable source-role identity checkpoint completed locally on 2026-08-03:

- D-291 advances to `2.0.0` and derives each opaque source-role instance ID from the exact
  source-definition ID, content version, and kind rather than the future patient-state ID;
- each D-291 artifact and instance still retains its exact patient-state ID, and all validation
  still rejects a crossed patient before resolving the role;
- the same reusable role ID may therefore appear in different patient horizons without making
  those horizons or their patient evidence interchangeable; and
- D-299's audit now retains the exact source-definition ID and version behind every validated
  profile binding.

Focused D-215/D-291/D-299/D-300 coverage passes 26/26 across two files, and root typecheck passes.
D-300 adds no real source or report profile, person or collateral identity, source
credibility/accuracy, report behavior, patient/result attachment, probability, complexity,
clinical rule, balance, point, persistence, UI, commit, push, app build, browser suite, server, or
Pages check. Root lint, repository-wide formatting, and `git diff --check` also pass.

The D-301 composed patient-state source-validation checkpoint completed locally on 2026-08-03:

- one standalone wrapper independently replays a complete D-208 composition and a same-patient
  D-291 source horizon;
- diagnosis records, medication benefit/dose/temporal records, durations, burden, and proposition
  evidence require exact source-kind equality;
- measurements, categorical observations, and structured tests retain an explicitly labeled
  `source_existence_only` audit because their current record shapes do not own an expected kind;
  and
- every validated binding retains the exact source-role definition ID/version rather than only an
  opaque hash-shaped instance ID.

Focused D-208/D-291/D-301 coverage passes 43/43 across two files, including empty, complete,
crossed-patient, missing-source, exact-kind mismatch, existence-only, and tamper paths. Root
typecheck passes. D-301 adds no real source role, credibility/accuracy/reliability model, clinical
meaning, D-200/D-194/D-235 integration, result attachment, probability, complexity, clinical
rule, balance, point, persistence, runtime, UI, commit, push, app build, browser suite, server, or
Pages check. The complete D-300 broader generation suite also passed 184/184 before this seam;
root lint, repository-wide formatting, and `git diff --check` also pass.

The D-302 shared-finding source-validation checkpoint completed locally on 2026-08-03:

- one standalone wrapper independently replays an exact D-193 request/output and a same-patient
  D-291 source horizon;
- every D-193 projection carrying a direct D-258 source-report selection requires exact
  patient/source-kind validity and an exact originating slot plus base-or-modifier projection;
- each binding retains the full source/time/claim/dependency coordinates, any already-spent D-201
  optional-complexity trace, and the exact source-role definition ID/version; and
- an ordinary D-193 projection without a source-report selection needs no source binding.

Focused D-193/D-291/D-302 coverage passes 15/15 across two files, including base,
complexity-modified, empty, crossed-patient, missing-source, crossed-kind, replay-mismatch, and
tamper paths. Root typecheck passes. D-302 adds no real source role or report profile,
credibility/accuracy/reliability model, report correctness, clinical meaning,
D-200/D-194/D-235 integration, result attachment, probability, complexity spend, clinical rule,
balance, point, persistence, runtime, UI, commit, push, app build, browser suite, server, or Pages
check.

The D-303 neutral patient-scene source-role catalog checkpoint completed locally on 2026-08-03:

- one runtime-excluded, registry-owned, schema-parsed catalog now provides ten reusable source
  roles spanning every closed D-291 source kind;
- primary and secondary collateral roles plus current-chart and outside-record roles remain
  distinct even though each pair shares one source kind;
- registry membership, stable order, closed-kind coverage, and absence of inherited
  clinical/evidence authority are content-validation gates; and
- ordinary Player and portable Reviewer entry points do not import the catalog.

Focused D-291/catalog/runtime-boundary coverage passes 24/24 across three files. Root typecheck and
the complete content validator pass, including the new `patient-scene-source-definitions` report.
D-303 adds no real-person identity, source availability, credibility/accuracy/reliability model,
report behavior, clinical meaning, probability, complexity spend, clinical rule, balance, point,
persistence, runtime, UI, commit, push, app build, browser suite, server, or Pages check.

The D-304 typed patient-state source checkpoint completed locally on 2026-08-03:

- `ResolvedMeasurement`, `ResolvedCategoricalObservation`, and every `StructuredTestResult` now
  own an explicit `PatientStateScopedSource` rather than a flat opaque source ID;
- D-301 advances to `2.0.0` and requires exact patient, source-instance, and source-kind equality
  for all ten current source-bearing patient-state lanes;
- the exact D-291 definition reference remains present in every validated binding; and
- the former measurement/observation/test existence-only mode is removed from the current
  authoring schema rather than guessed from labels or definition IDs.

Seven affected schema/compiler suites pass 103/103, including an explicit former-measurement-lane
kind mismatch, and root typecheck passes. D-304 is a pre-runtime authoring-schema hardening: no
persisted or distributed D-301/native patient artifact exists to migrate. It adds no real source
or patient, credibility/accuracy/reliability model, clinical meaning, result attachment,
probability, complexity, rule, balance, point, persistence, runtime, UI, commit, push, app build,
browser suite, server, or Pages check.

The D-305 catalog-backed source-horizon checkpoint completed locally on 2026-08-03:

- one authoring-only adapter accepts the exact D-303 catalog and patient-state ID and derives
  D-291's definition array rather than accepting an independently assembled horizon;
- the wrapper fingerprints the exact catalog ID/version/payload and retains the nested
  replay-valid patient-bound D-291 artifact;
- reusable role IDs remain stable across patients while wrapper and horizon ownership remains
  patient-specific; and
- the checked-in catalog test now exercises this adapter, while ordinary engine/runtime entry
  points remain unchanged.

Focused D-291/D-303/D-305/runtime-boundary coverage passes 28/28 across four files. The complete
local unit gate passes 1,168/1,168 Vitest tests across 118 files plus 10/10 handoff tests; content
validation, root typecheck, lint, formatting, and diff checks also pass. That full gate exposed and
then corrected stale Database-browser inventory assertions left by D-288: the review-safe
projection contains 55 medication identities, 27 formal references, and 167 total entries. The
application behavior and projection payload were unchanged. D-305 adds no source availability or
selection, report behavior, credibility, accuracy, independence, action access, clinical meaning,
probability, complexity, rule, balance, point, persistence, runtime, UI, commit, push, app build,
browser suite, server, or Pages check.

The D-306 numeric structured-test result checkpoint completed locally on 2026-08-03:

- one standalone authoring compiler accepts an exact generated-numeric test definition, typed
  patient context, internal seed, exact reference-interval horizon, time scope, catalog source-role
  reference, and complete D-305 patient-bound source artifact;
- it reuses the existing deterministic profile matcher and numeric generator, freezes one typed
  `StructuredTestResult`, and fingerprints the exact test, selected profile, interval owner,
  source instance, complete request, and output;
- patient-owned or case-defining tests are rejected rather than being assigned invented results;
  and
- all six current numeric laboratory definitions compile through the checked-in D-303/D-305
  laboratory source role while retaining their explicit medically unreviewed status.

Focused D-306/source/schema/content/runtime-boundary coverage passes 31/31 across five files, and
root typecheck passes. The immediately preceding complete D-305 local gate remains 1,168/1,168
Vitest tests plus 10/10 handoff tests with content validation, lint, formatting, and diff checks.
D-306 adds no patient-state or information-action attachment, test availability or indication,
clinical correctness, source credibility, probability change, reference-interval change,
complexity, rule, balance, point, persistence, runtime, UI, commit, push, app build, browser suite,
server, or Pages check.

The D-307 patient-owned structured-test result checkpoint completed locally on 2026-08-03:

- one versioned authored-result profile now owns only an exact test reference, kind-specific
  payload, source-use references, and explicit review state;
- one authoring-only compiler validates that profile against the exact patient-owned test
  definition and ordinary structured-result contract, binds the result to the exact patient, time,
  and D-305 laboratory/diagnostic source role, and freezes complete replay;
- generated numeric definitions remain D-306-only inputs, and D-307 does not select a profile for
  a template or accept a generated test; and
- all eight current patient-owned definitions pass synthetic-only numeric, categorical, binary,
  imaging, and electrical contract fixtures without adding real result content.

Focused D-306/D-307/source/schema/content/runtime-boundary coverage passes 38/38 across seven files,
and root typecheck passes. The final D-307-only/runtime regression is 22/22; complete content
validation, root lint, formatting, and diff checks also pass. D-307 adds no real result profile,
patient/template selection, patient-state or action-result attachment, test availability or
indication, clinical correctness, source credibility, probability, reference interval,
complexity, rule, balance, point, persistence, runtime, UI, commit, push, app build, browser
suite, server, or Pages check.

The D-308 patient-owned measurement-value checkpoint completed locally on 2026-08-03:

- one versioned authored-value profile now owns only an exact measurement-definition reference,
  numeric value, display value, allowed context values, source-use references, and explicit review
  state;
- one authoring-only compiler binds that profile to the exact patient, time, and D-305
  direct-measurement source role, takes its units from the definition, validates the ordinary
  measurement envelope, emits `not_interpreted`, and freezes complete replay;
- all nine current vital-sign and anthropometric definitions pass synthetic-only contract
  fixtures without adding real patient values or interpretation; and
- the compiler and its profile remain detached from template selection, patient/action state,
  persistence, and runtime.

Focused D-306/D-307/D-308/source/schema/content/runtime-boundary coverage passes 49/49 across ten
files, and root typecheck passes. Complete content validation, root lint, formatting, and diff
checks also pass. D-308 adds no real value profile, generation distribution, population range,
height/weight/BMI relationship, body-habitus interpretation, clinical tag, template selection,
patient/action-result attachment, complexity, rule, balance, point, persistence, runtime, UI,
commit, push, app build, browser suite, server, or Pages check.

The D-309 patient-owned categorical-observation checkpoint completed locally on 2026-08-03:

- one versioned authored-value profile now owns only an exact
  categorical-observation-definition reference, allowed value ID, display value, source-use
  references, and explicit review state;
- one authoring-only compiler binds that profile to the exact patient, time, and D-305
  clinician-observation source role, validates the ordinary observation envelope, emits an empty
  interpretation list, and freezes complete replay;
- synthetic-only definitions prove both the mental-status-exam and physical-exam domains while the
  checked-in real categorical-observation catalog remains empty; and
- no real clinical observation, value, meaning, generation, or attachment was created.

Focused D-308/D-309/source/schema/content/runtime-boundary coverage passes 35/35 across seven
files, and root typecheck passes. Complete content validation, root lint, formatting, and diff
checks also pass. D-309 adds no real definition or value profile, interpretation, diagnostic
meaning, generation distribution, template selection, patient/action-result attachment,
complexity, rule, balance, point, persistence, runtime, UI, commit, push, app build, browser
suite, server, or Pages check.

The D-310 detached patient clinical-result collection checkpoint completed locally on
2026-08-03:

- one authoring-only compiler now accepts replay-valid D-306 generated tests, D-307 authored
  tests, D-308 measurements, and D-309 categorical observations for one exact patient and D-305
  source horizon;
- it retains every complete upstream artifact, independently verifies replay and full source
  equality, emits canonical typed output arrays plus one exact member audit per record, and
  rejects repeated artifacts or duplicate resolved-record IDs rather than silently dropping them;
- distinct same-definition records remain valid when their exact profile, time, or context yields
  a distinct record identity; and
- the checked-in proof combines TSH, pregnancy, and weight catalog contracts with one explicitly
  synthetic observation while the real observation catalog stays empty.

Focused D-306-through-D-310/source/schema/content/runtime-boundary coverage passes 59/59 across
fourteen files, and root typecheck passes. Complete content validation, root lint, formatting, and
diff checks also pass. D-310 adds no value selection, generation, merge, interpretation,
patient-state or action attachment, template, complexity, clinical rule, balance, point,
persistence, runtime, UI, commit, push, app build, browser suite, server, or Pages check.

The D-311 patient clinical-result attachment checkpoint completed locally on 2026-08-03:

- one authoring-only compiler now independently replays a successful D-208 composition and one
  same-patient D-310 collection;
- it requires the D-208 measurement, categorical-observation, and structured-test lanes to be
  empty, rejects any caller-authored merge, and replaces only those lanes;
- the output receives a new state ID and fingerprint while both complete inputs, every attached
  record ID, and the D-310 base-state source scope remain auditable; and
- synthetic unit coverage proves deterministic replay, immutability, crossed-patient rejection,
  preexisting-lane rejection, and tamper detection without adding real content.

Focused D-208/D-310/D-311 plus runtime-boundary coverage passes 59/59 across three files. Root
typecheck, content validation, lint, formatting, and diff checks also pass. D-311 adds no profile
selection, result generation or interpretation, information-action result, D-194/D-213/D-214 or
D-200/D-235 integration, `PatientInstance`, template, complexity, clinical rule, balance, point,
persistence, runtime, UI, commit, push, app build, browser suite, server, or Pages check.

The D-312 post-composition patient-state assembly checkpoint completed locally on 2026-08-03:

- one authoring-only assembler now independently replays one successful D-208 root plus at least
  one D-294 duration or D-311 clinical-result branch;
- every branch must retain the exact same D-208 artifact, whose duration, measurement,
  categorical-observation, and structured-test lanes must all remain empty;
- the output copies only the nonoverlapping D-294 and D-311 lanes into one newly identified and
  fingerprinted state while retaining every complete input, reference, record ID, and replay
  proof; and
- synthetic coverage proves both-branch and single-branch assembly, immutable inputs, crossed-root
  and preexisting-lane rejection, empty-request rejection, and tamper detection.

Focused D-208/D-294/D-310-through-D-312 plus runtime-boundary coverage passes 63/63 across three
files. Root typecheck, content validation, lint, formatting, and diff checks also pass. D-312 adds
no profile selection, value generation or interpretation, functional-impairment attachment,
information-action result, D-194/D-213/D-214 or D-200/D-235 integration, `PatientInstance`,
template, complexity, clinical rule, balance, point, persistence, runtime, UI, commit, push, app
build, browser suite, server, or Pages check.

The D-313 D-200 post-composition integration checkpoint completed locally on 2026-08-03:

- D-200 advances to `25.0.0` and replaces its nullable direct D-294 input with one nullable
  replay-valid D-312 assembly;
- null preserves the unchanged D-208 route, while non-null requires the exact D-223/D-208 root,
  derives the assembled state rather than accepting a replacement, and retains the complete D-312
  artifact in input and payload replay;
- nested D-294 duration resolutions remain subject to the one D-233 patient-generation seed, and
  D-210 continues to use the original D-208 applicability scope; and
- synthetic end-to-end coverage proves that D-294 duration plus one real D-310/D-311 measurement
  branch survive together through unchanged D-194 into the frozen patient instance, while raw
  D-294, crossed roots, dropped assemblies, seed drift, and tampering are rejected.

Focused D-208/D-294/D-310-through-D-313 plus runtime-boundary coverage passes 115/115 across four
files. Root typecheck, content validation, lint, formatting, and diff checks also pass. D-313 adds
no profile selection, value generation or interpretation, functional-impairment attachment, new
action-result recipe, real content, complexity, clinical rule, balance, point, persistence,
runtime activation, UI, commit, push, app build, browser suite, server, or Pages check.

The D-314 source-validated functional-impairment patient-state checkpoint completed locally on
2026-08-03:

- `ResolvedPatientState` now owns a canonical `functionalImpairments` lane with global record-ID
  uniqueness plus exact included-condition, diagnosis, time-scope, and profile-version checks;
- D-312 advances to `2.0.0` and accepts only replay-valid D-292 source validation as its optional
  impairment branch alongside D-294 duration and D-311 clinical results;
- D-200 advances to `26.0.0`, includes every nested D-267 draw in the existing D-233 seed audit,
  and routes the assembled duration/impairment/result state through unchanged D-194 into the
  frozen patient instance;
- the null assembly route rejects prepopulated post-composition lanes; and
- D-301 advances to `3.0.0` so the new source-bearing lane participates in the standalone
  exact-patient D-291 source audit.

Focused D-312/D-200/schema/catalog/action-result plus runtime-boundary coverage passes 194/194
across seven files. Root typecheck, content validation, lint, formatting, and diff checks also
pass. D-314 adds no real impairment profile or probability, player-facing result, severity
mapping, template selection, complexity, clinical rule, balance, point, persistence, runtime
activation, UI, commit, push, app build, browser suite, server, or Pages check.

The D-315 functional-impairment target-scoped result checkpoint completed locally on 2026-08-03:

- D-240 advances to `2.0.0` and reuses the existing target-scoped patient-value projection for
  condition-attributed functional impairment already retained in final D-194 patient state;
- the authoring audit keeps the exact condition target, profile/option identity, and source
  instance, while the player-safe value retains only level, source kind, and time scope;
- D-298 advances to `2.0.0`, independently validates the hidden exact source instance against the
  same-patient D-291 horizon, and preserves that binding outside the player-safe projection; and
- the already-generic D-213/D-214 route is proven with synthetic fixtures to compile and attach the
  minimized reveal without exposing diagnosis, condition, profile, option, or source-instance
  identity.

Focused D-240/D-298/D-213/D-214 plus catalog/snapshot/runtime-boundary coverage passes 166/166
across seven files. Root typecheck, content validation, lint, formatting, and diff checks also
pass. D-315 adds no checked-in impairment projection definition, real profile, wording, action
choice, persistence, runtime activation, clinical rule, balance, point, UI, commit, push, app
build, browser suite, server, or Pages check.

The D-316 detached metric BMI derivation checkpoint completed locally on 2026-08-03:

- the runtime-excluded measurement catalog now owns one exact, versioned cm-height/kg-weight to
  kg/m2-BMI relationship while retaining lifecycle `review` and medically `unreviewed` status;
- the authoring-only compiler consumes explicit height and weight record IDs from one replay-valid
  D-310 collection, requires positive finite values, and never chooses among repeated records;
- the artifact retains both complete input measurements plus exact derivation and collection
  fingerprints and deterministically calculates and formats the uninterpreted BMI value; and
- the output deliberately remains detached from `ResolvedMeasurement`, patient-scene source, time
  scope, resolution ownership, patient state, information actions, persistence, and runtime.

Focused D-316/D-310/D-315 measurement/result/content-runtime-boundary coverage passes 73/73 across
nine files. Root typecheck, content validation, lint, formatting, and diff checks also pass. D-316
adds no range, abnormality, body-habitus meaning, clinical tag, template selection, complexity,
rule, balance, point, persistence, runtime activation, UI, commit, push, app build, browser suite,
server, or Pages check.

The D-317 detached derived-measurement materialization checkpoint completed locally on 2026-08-03:

- `ResolvedMeasurement` now distinguishes ordinary patient-scene sources from explicit
  `derived_measurement` provenance and requires the latter to pair with an exact
  `deterministic_derivation` resolution trace;
- the authoring-only materializer accepts only replay-valid D-316, retains the definition,
  artifact payload, and ordered height/weight record IDs, and emits the common
  `ResolvedMeasurement` shape without a fake source-instance ID;
- output time scope is mechanically inherited from the explicitly selected weight record while
  both input records retain their independent source/time audits in D-316; and
- D-301 explicitly rejects derived measurements and D-310 remains direct-result-only, so no
  patient-state or result-collection bypass was added.

Focused D-317/D-316/D-310/D-308/D-301/schema/runtime-boundary coverage passes 80/80 across six
files. Root typecheck, content validation, lint, formatting, and diff checks also pass. D-317 adds
no D-311/D-312/D-200/D-194/D-213/D-214 attachment, generation, range, abnormality,
body-habitus meaning, clinical tag, rule, balance, point, persistence, runtime, UI, commit, push,
app build, browser suite, server, or Pages check.

The D-318 noncyclic derived-BMI attachment checkpoint completed locally on 2026-08-03:

- D-311 advances to `2.0.0` and accepts optional replay-valid D-317 BMI materializations only
  alongside the exact D-310 collection retained in each nested D-316 request;
- every materialization is independently replayed, retains an explicit artifact/payload/record
  reference, and is rejected when its patient or complete D-310 input differs;
- the compiler appends BMI beside the canonical height/weight inputs, rejects duplicate artifacts,
  record collisions, and total lane overflow, and never inserts BMI back into D-310; and
- the existing D-312 common-root assembly carries the verified measurement lane unchanged without
  a parallel patient snapshot or a fabricated patient-scene source.

Focused D-318/D-317/D-316/D-312/D-311/D-310/D-308/D-301/D-200/schema/runtime-boundary coverage
passes 134/134 across seven files. Root typecheck, content validation, lint, formatting, and diff
checks also pass. D-318 adds no real profile, value generation, range, abnormality, body-habitus
meaning, information-action result definition, clinical tag, rule, balance, point, persistence,
runtime activation, UI, commit, push, app build, browser suite, server, or Pages check.

The D-319 derived-BMI universal-result reuse checkpoint completed locally on 2026-08-03:

- no parallel target-scoped or derived-measurement result model was added;
- the synthetic full pipeline carries exact D-318 height/weight/BMI state through D-312, D-200,
  and D-194 into the frozen `PatientInstance`;
- unchanged D-213 validates all three records against exact definition/action relationships, and
  D-214 freezes their exact measurement IDs in request and result bindings; and
- the complete D-316/D-317 derivation audit remains attached to the BMI record in patient state
  rather than being duplicated into the player-facing binding.

Focused D-319 pipeline coverage passes 54/54 in its end-to-end file; the complete
D-319/D-318/D-317/D-316/D-312/D-311/D-310/D-308/D-301/D-200/schema/runtime-boundary set passes
135/135 across seven files. Root typecheck, content validation, lint, formatting, and diff checks
also pass. D-319 adds no real profile, value generation, production action mapping, range,
abnormality, interpretation, body-habitus meaning, clinical rule, balance, point, persistence,
runtime activation, UI, commit, push, app build, browser suite, server, or Pages check.

The D-320 exact template clinical-result recipe checkpoint completed locally on 2026-08-03:

- one separate versioned recipe fingerprints the full `PatientTemplate` without adding patient
  values to that template;
- typed members name exact D-306-through-D-309 profile/source/time owners, while a BMI member names
  its exact D-316 relationship and two direct input members;
- compilation requires one-to-one complete coverage of every supplied replay-valid D-310/D-317
  artifact and freezes the member-to-compilation-to-record audit; and
- stale templates, crossed profiles/sources/times/inputs, ambiguous matches, and unowned results
  are rejected.

The D-321 template-owned attachment checkpoint then advances D-311 to `3.0.0`:

- D-311 accepts only replay-valid D-208 and D-320 artifacts and rejects the legacy raw D-310
  request shape;
- it derives the exact D-310 collection and D-317 materializations only from D-320;
- it recomputes D-208's condition-selection and D-320's full-template fingerprints across the
  boundary, in addition to exact template ID/version matching; and
- its artifact retains the exact D-320 reference beside the unchanged D-310/D-317 and changed-state
  audits.

The combined D-320/D-321/D-319/D-318 attachment and runtime-boundary regression set passes
123/123 across four files. Root typecheck, content validation, lint, formatting, and diff checks
also pass. D-320/D-321 add no real recipe/profile content, result distribution, interpretation,
action availability, clinical rule, balance, point, complexity, persistence, runtime activation,
UI, commit, push, app build, browser suite, server, or Pages check.

The D-322 exact mode-template recipe-coverage checkpoint completed locally on 2026-08-03:

- one authoring-only horizon consumes the complete replay-valid mode-template horizon;
- each exact template receives one canonical `bound` or `missing_recipe` member;
- orphan recipes and duplicate exact-template owners are rejected rather than silently ignored;
- exact resolution requires template ID, content version, and full template fingerprint; and
- lifecycle/source-boundary and template/recipe review metadata remain visible without becoming
  clinical approval or runtime eligibility.

The D-322 compiler plus ordinary-runtime boundary regression set passes 28/28 across two files.
D-322 adds no real recipe/profile content, result compilation, values, distributions,
interpretation, formulary behavior, action availability, clinical rule, balance, point,
complexity, persistence, runtime activation, UI, commit, push, app build, browser suite, server,
or Pages check.

The D-323 horizon-owned recipe-compilation checkpoint completed locally on 2026-08-03:

- D-320 advances to `2.0.0` and replaces its raw recipe request with one replay-valid D-322
  horizon;
- exact template ID, content version, and full fingerprint select the one retained normalized
  recipe, while missing coverage fails explicitly;
- the output retains the exact D-322 ID and input/payload fingerprints;
- integrity replay revalidates both D-322 and the exact resolution before replaying result
  bindings; and
- the legacy raw-recipe request is rejected.

The complete D-323/D-322/D-321/D-320/D-319 authoring-to-final-snapshot and runtime-boundary
regression set passes 128/128 across four files. D-323 adds no real recipe/profile content,
result generation, values, distributions, interpretation, formulary behavior, action
availability, clinical rule, balance, point, complexity, persistence change, runtime activation,
UI, commit, push, app build, browser suite, server, or Pages check.

The D-324 exact recipe-resource coverage checkpoint completed locally on 2026-08-03:

- one finite `PatientClinicalResultResourceSet` retains exact test, interval, patient-owned
  result-profile, measurement, categorical-observation, BMI-derivation, and source-role owners;
- every bound D-322 recipe member receives exact `resolved` or `missing` resource requirements;
- `recipe_missing` and `missing_resources` remain separate diagnostics without deleting a
  template or manufacturing fallback content;
- duplicate stable resource bins, output tampering, and replay mismatch are rejected; and
- existing D-306-through-D-309/D-316 compilers remain the relationship, contract, kind, value,
  and derivation authorities.

The D-324 compiler plus ordinary-runtime boundary regression set passes 33/33 across two files.
D-324 adds no real resource/recipe/profile content, value generation, distribution,
interpretation, action availability, clinical correctness, formulary behavior, complexity,
rule, balance, point, persistence change, runtime activation, UI, commit, push, app build,
browser suite, server, or Pages check.

The D-325 exact patient result-materialization-context checkpoint completed locally on
2026-08-03:

- its only inputs are replay-valid D-233 seed authority, completed D-208 patient composition, and
  D-324 resource coverage;
- D-233 and D-208 must retain the identical full selected template and generation seed lineage;
- age, sex-for-reference, active diagnosis-definition IDs, and clinical tags derive only from the
  composed patient;
- the selected template must have complete exact D-324 coverage and the matching D-322 recipe;
- one same-patient catalog source-instance horizon is compiled from D-324's retained resource set;
  and
- incomplete resources fail this authoring step without mutating, deleting, or rerolling D-208.

The complete D-325 synthetic full-generation-chain plus ordinary-runtime boundary regression set
passes 72/72 across two files. D-325 adds no result compilation, patient value, distribution,
interpretation, action availability, complexity spend, clinical rule, balance, point, formulary
behavior, persistence change, runtime activation, UI, commit, push, app build, browser suite,
server, or Pages check.

The D-326 exact patient clinical-result-materialization checkpoint completed locally on
2026-08-03:

- its only input is one replay-valid D-325 context; raw templates, patient IDs, seeds, generation
  context, resources, source horizons, result collections, and values are absent;
- it resolves the exact D-322 recipe and D-324 resource set already retained by D-325;
- it invokes D-306 through D-309 for direct members, D-310 for canonical collection ownership,
  D-316/D-317 for declared BMI outputs, and D-320 for exact-template binding;
- D-324 remains a presence audit while each existing compiler remains the semantic/value
  authority, so a crossed profile relationship fails instead of being inferred or repaired; and
- the complete D-325-to-D-320 chain is frozen and deterministic-replay verified.

The complete D-326 synthetic full-generation-chain plus ordinary-runtime boundary regression set
passes 76/76 across two files. D-326 adds no D-311 attachment, real resource/profile content,
interpretation, action availability, complexity spend, clinical rule, balance, point, formulary
behavior, persistence change, runtime activation, UI, commit, push, app build, browser suite,
server, or Pages check. The focused D-326 regression set passes 5/5; typecheck, lint,
format-check, diff-check, and content validation also pass.

The D-327 exact materialized-result attachment checkpoint completed locally on 2026-08-03:

- its only input is one replay-valid D-326 artifact;
- it derives the exact D-208 composition and D-320 compilation already frozen by D-326 and
  delegates them unchanged to D-311 `3.0.0`;
- callers cannot separately select a patient composition, collection, derived materialization,
  template, or recipe;
- D-311 remains the empty-lane, template, same-patient, collision, capacity, and attached-state
  authority; and
- the complete D-326 and D-311 chains remain frozen and deterministic-replay verified.

The focused D-327 plus ordinary-runtime boundary regression set passes 5/5, and the complete
generation-chain plus runtime-isolation regression set passes 80/80 across two files. Typecheck,
lint, format-check, diff-check, and content validation also pass. D-327 adds no D-312 assembly,
real content, interpretation, action availability, complexity spend, clinical rule, balance,
point, formulary behavior, persistence change, runtime activation, UI, commit, push, app build,
browser suite, server, or Pages check.

The D-328 exact result-enabled post-composition orchestration checkpoint completed locally on
2026-08-03:

- one replay-valid D-327 result branch is required; D-208 and D-311 derive only from it;
- independently replay-valid D-294 duration and D-292 impairment branches remain optional and
  explicit;
- unchanged D-312 `2.0.0` remains the exact-common-root, lane, and composed-state authority;
- a crossed optional branch fails instead of being dropped or rebound; and
- the complete D-327 and D-312 chains remain frozen and deterministic-replay verified.

The focused D-328 plus ordinary-runtime boundary regression set passes 5/5, and the complete
generation-chain plus runtime-isolation regression set passes 84/84 across two files. Typecheck,
lint, format-check, diff-check, and content validation also pass. D-328 adds no alternative
patient state, branch generation, real content, interpretation, action availability, complexity
spend, clinical rule, balance, point, formulary behavior, persistence change, runtime activation,
UI, commit, push, app build, browser suite, server, or Pages check.

The D-329 exact result-enabled D-200 integration checkpoint completed locally on 2026-08-03:

- D-200 advances to `27.0.0` and retains a nullable exact D-328 authority separately from its
  resolved D-312 assembly;
- a D-312 branch with non-null D-311 results is rejected unless D-200 receives and replays the
  exact D-328 artifact that produced it;
- D-328's nested D-233 seed authority and D-208 root must equal the current generation audit;
- null and direct duration/impairment-only D-312 compatibility paths remain valid; and
- D-200 fingerprints and replays both D-328 and its derived D-312, so crossing, tampering, or
  dropping the result authority invalidates the audit.

The focused D-329 regression set passes 3/3, and the complete generation-chain plus
runtime-isolation regression set passes 85/85 across two files. Typecheck, lint, format-check,
diff-check, and content validation also pass. D-329 adds no result generation, alternate patient
state, new complexity spend, clinical rule, balance, point, formulary behavior, persistence
change, runtime activation, UI, commit, push, app build, browser suite, server, or Pages check.

The D-330 exact clinical-result finding-pipeline orchestration checkpoint completed locally on
2026-08-03:

- one schema-valid composed, result-free D-200 request scaffold and one exact D-324
  resource-coverage artifact are its only high-level inputs;
- the scaffold is not prematurely compiled, because its recipe may require measurements generated
  by the derived result chain;
- D-325, D-326, D-327, and D-328 derive in order from the exact D-233/D-208/D-324 authority;
- any independently verified result-free duration and impairment branches are preserved; and
- only the final D-200 `27.0.0` audit is compiled and retained beside the exact D-328 chain.

The focused D-330 regression set passes 3/3, and the complete generation-chain plus
runtime-isolation regression set passes 87/87 across two files. Typecheck, lint, format-check,
diff-check, and content validation also pass. D-330 adds no real content, new result value,
complexity spend, clinical rule, balance, point, formulary behavior, persistence change, runtime
activation, UI, commit, push, app build, browser suite, server, or Pages check.

The D-331 exact result-enabled atomic-fill checkpoint completed locally on 2026-08-03:

- D-233 atomic fill advances to `3.0.0`;
- its direct compatibility path accepts only a genuinely result-free D-200 request;
- exact replay-valid D-324 coverage causes the fill to derive D-330 from its own D-233 seed
  authority and request scaffold;
- only D-330's final D-200 audit can populate the frozen waiting slot and occupied coordinate;
- successful fills retain exact D-324 and D-330 provenance; and
- valid incomplete coverage produces one blocked, ordinal-consuming attempt without retaining a
  partial D-330, while integrity-invalid coverage is rejected as input.

The focused D-331 plus ordinary-runtime boundary regression set passes 8/8, and the complete
generation-chain/lifecycle plus runtime-isolation regression set passes 89/89 across two files.
Typecheck, lint, format-check, diff-check, and content validation also pass. D-331 adds no real
result content, complexity selection or spend, clinical rule, balance, point, formulary behavior,
persistence change, runtime refill, UI, commit, push, app build, browser suite, server, or Pages
check.

The D-332 real launcher-presentation content checkpoint completed locally on 2026-08-03:

- one strict runtime-excluded catalog owns three reusable medically unreviewed chief-complaint
  banks with 48 concise variants;
- one Developer-approved cosmetic MDD profile reuses the existing substantial independent
  fictional first/last-name pools and literal one-quarter middle-initial policy;
- nonspecific, mood/interest, and energy/sleep/function banks share the same specificity and
  synthetic weight, so variety never becomes diagnosis probability;
- catalog, registry, Developer-opinion, hint-language, pool-size/kind, deterministic breadth, and
  Player/Reviewer isolation checks fail closed; and
- no presentation is attached to D-194/D-200/D-233, a waiting slot, persistence, runtime, or UI.

The focused resolver/catalog/runtime-isolation regression set passes 63/63 across four files.
Typecheck, lint, format-check, diff-check, and content validation pass. The first sandboxed
content-validation attempt failed only because the managed sandbox denied the existing `tsx` IPC
socket; the identical permissioned command passed. D-332 adds no PatientTemplate, clinical fact,
diagnosis inference, complexity spend, rule, balance, point, medication, formulary decision,
persistence change, runtime activation, UI, commit, push, app build, browser suite, server, or
Pages check.

The D-333 exact waiting-slot launcher-presentation attachment checkpoint completed locally on
2026-08-03:

- one successful replay-valid D-331 fill is the sole waiting-slot and patient authority;
- the compiler derives D-287 only from that fill's final D-194 catalog snapshot and exact D-332
  content;
- the detached minimized output pins the frozen waiting-slot ID, patient-instance fingerprint,
  fictional name, and brief complaint with its own payload fingerprint;
- blocked fills and caller-supplied patient, seed, snapshot, or prebuilt-presentation authority
  fail closed; and
- full D-331/D-287 replay detects crossed or tampered output.

The focused D-333 tests pass 2/2, and the complete generation-chain/lifecycle plus
runtime-isolation regression set passes 92/92 across two files. Typecheck, lint, format-check,
diff-check, and the complete permissioned content validator pass. D-333 adds no PatientTemplate,
clinical meaning, complexity spend, rule, balance, point, medication, formulary decision, queue
mutation, persistence migration, runtime activation, UI, commit, push, app build, browser suite,
server, or Pages check.

The D-334 exact weight/BMI action-result content checkpoint completed locally on 2026-08-03:

- one runtime-excluded universal-result assembly pins the exact shared
  `info.physical.weight-bmi` action payload;
- the assembly embeds exact canonical height, weight, and BMI measurement definitions and one
  measurement-source recipe;
- validation rejects stale or unknown embedded definitions and a measurement recipe without an
  exact action-linked canonical definition;
- the unchanged D-213/D-214 path routes exact height, weight, and derived BMI records while every
  measurement remains `not_interpreted`; and
- body habitus remains a separate future categorical-observation owner rather than being inferred
  from BMI.

The focused checked-in-content plus runtime-isolation regression set passes 22/22 across two
files. Typecheck, lint, format-check, diff-check, and the complete permissioned content validator
pass. D-334 adds no height/weight profile or value generation, reference range, abnormality,
body-habitus category, clinical tag, template selection, complexity spend, rule, balance, point,
persistence, runtime activation, UI, commit, push, app build, browser suite, server, or Pages
check.

The D-335 deterministic generated-measurement profile/compiler checkpoint completed locally on
2026-08-03:

- one reviewed profile targets an exact measurement definition and owns a typed patient-context
  predicate, priority, weighted numeric support bands, definition-allowed context values,
  source-use references, and exact review;
- the compiler selects the highest-priority match, makes independent stable band/value draws,
  rounds only to definition-owned display precision, and freezes one common uninterpreted
  measurement;
- relative band weights are distribution inputs only and cannot become evidence weight,
  normality, clinical importance, or points;
- missing profile coverage fails explicitly and exact definition/profile/band/source/draw/result
  fingerprints plus replay detect drift; and
- no real profile or distribution is checked in.

The focused D-335 schema/engine plus runtime-isolation set passes 29/29 across three files.
Typecheck, lint, format-check, diff-check, and the complete permissioned content validator pass.
D-335 adds no real height, weight, vital-sign, or demographic distribution; reference range,
abnormality, BMI/body-habitus meaning, D-310/D-320 attachment, template selection, complexity
spend, clinical tag, diagnosis inference, rule, balance, point, persistence, runtime activation,
UI, commit, push, app build, browser suite, server, or Pages check.

The D-336 D-310 generated-measurement collection checkpoint completed locally on 2026-08-03:

- D-310 advances to `2.0.0` and accepts a closed union of replay-valid D-308 authored and D-335
  generated measurement compilations;
- exact upstream integrity dispatch preserves one same-patient D-305 source horizon;
- collection members distinguish `measurement` from `generated_measurement` while both retain
  the common typed measurement record;
- canonical ordering, duplicate rejection, fingerprints, and replay remain unchanged; and
- existing D-320 authored-measurement matching and test-fixture construction explicitly refuse
  to infer ownership for a D-335 compilation.

The focused D-336/D-335/BMI plus runtime-isolation regression set passes 47/47 across four files.
Typecheck, lint, format-check, diff-check, and the complete permissioned content validator pass.
D-336 adds no generated-measurement recipe, D-324 requirement, D-326 dispatch, real distribution,
range/interpretation, body-habitus meaning, template selection, complexity, rule, balance, point,
persistence, runtime activation, UI, commit, push, app build, browser suite, server, or Pages
check.

The D-337 generated-measurement recipe/resource/materialization checkpoint completed locally on
2026-08-04:

- D-320 advances to `3.0.0` with a distinct `generated_measurement` recipe member that pins one
  exact definition, complete unique D-335 profile horizon, measurement source, and time scope;
- D-324 advances to `2.0.0`, carries D-335 profiles in its finite resource set, and reports every
  missing exact profile without deleting or rerolling the patient;
- D-326 advances to `2.0.0` and invokes D-335 only with the D-325 patient seed, typed context,
  D-305 source horizon, and time scope;
- D-310 continues to preserve `generated_measurement` ownership, while the unchanged BMI route
  may consume authored or generated height/weight inputs; and
- exact full-horizon matching prevents selected-profile-only binding and prevents the authored
  D-308 member from binding generated output.

The focused D-337/D-336/D-335/BMI plus runtime-isolation regression set passes 50/50 across five
files, including exact D-320 binding, missing-profile D-324 coverage, D-325-authorized D-326
generation, generated height/weight-to-BMI derivation, deterministic replay, and authored versus
generated separation. Typecheck, lint, format-check, diff-check, and the complete permissioned
content validator pass. D-337 adds no real measurement profile or distribution,
range/interpretation, body-habitus meaning, complexity, rule, balance, point, persistence,
runtime activation, UI, commit, push, app build, browser suite, server, or Pages check.

The D-338 native exact-class mania-history prerequisite checkpoint completed locally on
2026-08-04:

- `DiagnosisSelectionPredicate` now permits one exact class ID/version plus explicit count bounds,
  while the separate `CaseTreatmentSelectionPredicate` preserves the old compatibility scorer and
  rejects that authoring-only shape;
- the MDD dossier advances to `1.5.0` and adds one separate approved native mania-history rule
  over the existing reviewed five-member initial-antidepressant class; the legacy tag rule stays
  unchanged;
- diagnosis prerequisite adaptation advances to `2.0.0`, expands the complete approved class
  membership horizon into sorted concrete medication starts, and rejects missing, stale,
  unreviewed, empty, or cardinality-lossy mappings without falling back to tags;
- a separate provisional workup balance owns `notTriggered 0`, `fulfilled +35`, and
  `omitted -50`; and
- the complete isolated native MDD fixture now composes seven rules and derives `415` for the
  database plan, while focused tests separately prove fulfilled, omitted, and nonmember
  not-triggered behavior with no class/tag data in the compiled trace.

Focused schema/adapter/scoring/content/runtime validation passes 49/49 across four files plus the
targeted semantic-content test. Typecheck and the complete permissioned content validator pass.
Lint, format-check, and diff-check pass. D-338 adds no medication membership, compatibility-case
score change, generated patient, persistence/runtime activation, SaveData migration, browser
behavior, UI, commit, push, app build, browser suite, server, or Pages check.

The D-339 native exact-finding safety-assessment checkpoint completed locally on 2026-08-04:

- diagnosis guidance gains one optional native-only canonical-finding outcome supplement without
  widening compatibility `PatientContextPredicate`;
- the MDD passive-death-wish safety-assessment rule pins the exact present
  `finding.safety.current-passive-death-wish@1.0.0` fact while retaining its legacy compatibility
  tag only for the old scorer and audit;
- diagnosis information adaptation advances to `3.0.0`, validates exact finding identity,
  version, approved lifecycle, and allowed outcome, and emits only the typed patient fact beside
  the primary-route predicate;
- a separately accepted Developer opinion and provisional workup balance own `+50` obtained and
  `-80` omitted; and
- the full isolated native MDD fixture remains `415` without the fact, derives `465` with the fact
  and detailed assessment, and derives `335` when that assessment alone is omitted.

Focused schema/adapter/scoring/content/runtime validation passes 103/103 across four files.
Typecheck, lint, format-check, diff-check, and the complete permissioned content validator pass.
D-339 adds no risk score,
disposition inference, compatibility-case score change, generated patient, persistence/runtime
activation, SaveData migration, browser behavior, UI, commit, push, app build, browser suite,
server, or Pages check.

The D-340 through D-342 detailed-safety result checkpoint completed locally on 2026-08-04:

- D-340 adds four neutral present/absent finding identities for current suicidal intent, a
  current specific plan, current self-reported access to identified suicide means, and a recent
  attempt while preserving narrower weapon access and exact event details as separate owners;
- D-341 adds an exact reviewed eighteen-projection horizon over nine independently auditable
  detailed-safety facts and binds those projections to
  `info.history.suicide-safety` through one exact universal action-result assembly;
- D-342 binds the separate typed `reportedSafetyPlanningAbility` singleton to
  `info.history.existing-safety-plan` through one current-patient-report structured reveal
  definition and universal recipe; and
- the compiled safety-planning result retains only a redacted resolved-reveal pointer, while its
  authoring proof preserves exact source-report resolution and aligned `reports_unable` content.

Focused finding-projection, universal-result, content-runtime, and runtime-boundary validation
passes 89/89 across four files. Typecheck, lint, format-check, diff-check, and the complete
permissioned content validator pass. D-340 through D-342 add no safety-fact probability, written
safety-plan state, plan-making intervention, risk formulation, disposition inference, point
value, generated patient, persistence/runtime activation, SaveData migration, browser behavior,
UI, commit, push, app build, browser suite, server, or Pages check.

The D-343/D-344 medication-history result checkpoint completed locally on 2026-08-04:

- D-343 binds `info.history.medication-reconciliation` to the exact
  `medication_regimen_entries` structured lane from one current patient-report source;
- D-344 binds `info.history.allergies-adverse-reactions` to exact `reaction_records` plus the
  explicit overall and medication-assessment status singletons;
- both universal bindings retain only redacted resolved-reveal pointers while the authoring proof
  preserves exact included/omitted records and truth alignment; and
- reaction records retain their reported label and null interpretation, so neither result
  definition infers treatment meaning.

Focused finding-projection, universal-result, content-runtime, and runtime-boundary validation
passes 93/93 across four files. Typecheck, lint, format-check, diff-check, and the complete
permissioned content validator pass. D-343/D-344 add no regimen or reaction generation, supplement
projection, source-error probability, adherence/benefit/tolerability inference, reaction
interpretation, new points, generated patient, persistence/runtime activation, SaveData migration,
browser behavior, UI, commit, push, app build, browser suite, server, or Pages check.

The D-345 through D-348 structured-history result checkpoint completed locally on 2026-08-04:

- D-345 maps `info.history.substance-use` only to source-reported `exposure_use_entries`, leaving
  objective positive-use truth and source accuracy separate;
- D-346 maps focused prior medication trials only to `medication_trials`;
- D-347 maps full treatment history to four independently auditable medication-trial,
  psychotherapy-trial, current-provider, and prior-level-of-care lanes; and
- D-348 maps medication effects to separate benefit, tolerability, dose-position, and
  change-timing lanes, each retaining exact regimen subjects and noncausal semantics.

Focused finding-projection, universal-result, content-runtime, and runtime-boundary validation
passes 100/100 across four files. Typecheck, lint, format-check, diff-check, and the complete
permissioned content validator pass. The current universal bindings still freeze only redacted
record references; the D-349 checkpoint below supplies the separately validated minimized
record-field view but does not yet attach it before runtime display. D-345 through D-348 add no
generation profile,
source-error probability, intoxication/withdrawal inference, clinical causality, new points,
generated patient, persistence/runtime activation, SaveData migration, browser behavior, UI,
commit, push, app build, browser suite, server, or Pages check.

The D-349 minimized structured-record projection checkpoint completed locally on 2026-08-04:

- all twelve D-212 structured lanes project through closed per-lane record shapes rather than an
  arbitrary field selector;
- only source-presented record IDs resolve, with normalized lane/record order, an exact action,
  definition, patient, source, and time context, a payload fingerprint, and deterministic
  reprojection;
- medication trials expose observed duration and highest reported dose but not the hidden legacy
  `adequacy` category; and
- exposure misuse truth, reaction interpretation, internal chart mappings, per-record source and
  generation audit, authoring summaries, omitted truth IDs, and truth-alignment internals remain
  outside the minimized view.

Focused projection and runtime-boundary validation passes 23/23 across two files, and typecheck
passes. D-349 remains detached from D-214, `PatientInstance`, persistence, runtime, and UI and
adds no generation behavior, clinical interpretation, rule, balance, or points.

The D-350 source-validated record-projection checkpoint completed locally on 2026-08-04:

- one replay-valid D-299 artifact is the only accepted authority;
- every retained D-212 recipe is recombined with D-215's exact frozen patient and projected
  through D-349 exactly once;
- each minimized view remains pinned to D-299's validated definition, action payload, patient,
  source role, and time scope; and
- raw D-215 input, source/report drift, crossed patients, missing or extra safe views, and
  caller-authored projection fields fail closed.

Focused D-349/D-350 and runtime-boundary validation passes 28/28 across three files, and typecheck
passes. D-350 remains detached from D-218/D-194/D-213/D-214, `PatientInstance`, persistence,
runtime, and UI and adds no report-selection behavior, source credibility, clinical
interpretation, generation, rule, balance, or points.

The D-351 source-validated universal-result attachment checkpoint completed locally on 2026-08-04:

- one replay-valid D-350 collection and one replay-valid D-213 artifact must own the same exact
  patient and complete structured-reveal envelope set;
- D-214 is derived mechanically rather than accepted from the caller;
- every safe record projection must match one frozen reveal by exact definition, action payload,
  patient, source, time scope, lane status, record IDs, and singleton values; and
- crossed patients, raw D-214 input, missing/extra envelopes, stale upstream artifacts, and payload
  tampering fail closed.

Focused D-349-through-D-351 and runtime-boundary validation passes 33/33 across four files.
Typecheck, lint, format-check, diff-check, and the complete permissioned content validator pass.
D-351 remains detached from `PatientInstance`, D-194/D-218, persistence, runtime, and UI and adds
no wording, source credibility, interpretation, generation, rule, balance, or points.

The D-352 mania/hypomania-history result checkpoint completed locally on 2026-08-04:

- seven missing historical symptom identities complete an eight-current/eight-past patient-report
  pair set;
- one compact `info.history.mania` projection horizon retains all sixteen distinct resolved
  finding IDs and contributors while excluding MSE observations;
- hidden subthreshold state may display as present without being erased, and absent rows derive
  only through the explicit closed-assessment projections; and
- one universal result recipe binds the canonical shared action payload to that exact horizon.

Focused finding, universal-result, and content-runtime validation passes 67/67 across three files.
Typecheck, lint, format-check, diff-check, and the complete permissioned content validator also
pass. D-352 adds no episode or bipolar-diagnosis inference, source-report probability, generation
profile, treatment consequence, new balance, point value, persistence, runtime activation, or UI.

The D-353 psychosis-history result checkpoint completed locally on 2026-08-04:

- the older generic hallucination and delusional-belief identities retain their stable IDs while
  advancing to `1.1.0` with explicit current-self-report labels;
- one closed six-finding projection horizon preserves hallucinations, delusional beliefs,
  suspiciousness, ideas of reference, persecutory ideation, and subjective thought
  disorganization separately;
- hidden subthreshold state and explicit derived negatives remain reconstructable; and
- the exact shared psychosis-history action payload resolves through one universal result recipe.

Focused psychosis, mania, projection, and content-runtime validation passes 70/70 across four
files. Typecheck, lint, format-check, diff-check, and the complete permissioned content validator
also pass. D-353 adds no proposition-truth or belief appraisal, MSE merge, aggregate psychosis
conclusion, diagnosis, generation profile, clinical rule, balance, points, persistence, runtime
activation, or UI.

The D-354 MDD presenting-problem result checkpoint completed locally on 2026-08-04:

- the existing broad current self-reported functional-impact finding now has explicit present and
  closed-assessment absent projections under `info.history.presenting-problem`;
- one exact 51-projection horizon joins those two projections to the unchanged 49-projection
  depressive-symptom result;
- the existing presenting-problem recipe now consumes both frozen finding projection and
  target-scoped duration sources without creating another result framework; and
- the separate D-267/D-314/D-315 condition-attributed functional-impairment owner remains
  unchanged and cannot be satisfied by the broad report.

Focused projection, universal-result, and content-runtime validation passes 86/86 across three
files. Typecheck, lint, format-check, diff-check, and the complete permissioned content validator
pass. D-354 adds no impairment level, condition attribution, severity, diagnosis, generation
profile, clinical rule, balance, points, persistence, runtime activation, or UI.

The D-355 body-habitus result checkpoint completed locally on 2026-08-04:

- the canonical measurement catalog now owns one neutral physical-exam body-habitus observation
  definition with five stable, medically unreviewed value identities;
- the existing Weight, BMI, and body habitus assembly embeds that exact definition and routes its
  categorical-observation lane beside height, weight, and derived BMI;
- the result proof retains one uninterpreted observed value separately from all three numeric
  measurements; and
- static validation now rejects stale embedded categorical-observation definitions and recipes
  that declare the lane without one exact action-compatible definition.

Focused categorical-observation, measurement, and universal-result validation passes 24/24 across
three files, and the complete permissioned content validator passes. D-355 adds no value profile,
generation distribution, BMI/body-composition inference, interpretation, clinical tag, rule,
balance, points, persistence, runtime activation, or UI.

The D-356 generated categorical-observation checkpoint completed locally on 2026-08-04:

- new schemas define one reviewed context-sensitive profile with weighted, definition-approved
  categorical values and a replay-fingerprinted compilation artifact;
- the detached pure compiler normalizes unordered inputs, chooses the highest-priority matching
  profile, makes one stable weighted draw, and emits one source-bound uninterpreted observation;
- missing profile coverage is explicit, and crossed definitions, disallowed values, wrong source
  kinds, crossed patients, and tampering fail closed; and
- all proof remains synthetic; the real D-355 body-habitus definition has no generation profile.

Focused generated/authored observation and generated-measurement validation passes 16/16 across
three files. Typecheck and lint pass. D-356 adds no real distribution, BMI relationship, result
collection, template recipe, complexity spend, interpretation, tag, clinical rule, balance,
points, persistence, runtime activation, or UI.

The D-357 generated-observation collection checkpoint completed locally on 2026-08-04:

- D-310 advances to `3.0.0` and accepts a closed authored/generated categorical-observation
  compilation union;
- a generated D-356 result receives the distinct
  `generated_categorical_observation` collection member kind while keeping the common neutral
  observation payload;
- upstream replay, exact patient/source horizon, duplicate-record, order-normalization, and
  tamper checks remain in force; and
- D-320 authored-observation matching and its resource/test helpers explicitly narrow away from
  generated observations pending a separate recipe owner.

Focused D-356/D-357 validation passes 27/27 across two files. Typecheck and lint pass. D-357 adds
no real profile, generated-observation template recipe, patient-state attachment, complexity
spend, interpretation, clinical tag, rule, balance, point, persistence, runtime activation, or UI.

The D-358 generated-observation recipe/resource/materialization checkpoint completed locally on
2026-08-04:

- D-320 advances to `4.0.0` with one explicit
  `generated_categorical_observation` direct member that pins the exact observation definition,
  complete D-356 generation-profile horizon, source definition, and time scope;
- D-324 advances to `3.0.0` and requires every exact generated-observation profile rather than
  only the profile selected for one seed;
- D-326 advances to `3.0.0` and invokes D-356 only from D-325's frozen patient seed, typed
  generation context, source horizon, and complete resource set; and
- synthetic proof rejects selected-profile-only recipe ownership, reports missing exact profiles,
  preserves authored/generated collection identity, and replays deterministic materialization.

Focused D-356/D-358 validation passes 11/11 for the exact generated-observation boundaries, and
the expanded D-310/D-320/D-324 file passes 23/23. The full 109-test three-file run passed all
D-358 tests and 108 tests overall; one unrelated unchanged D-294/D-292 integration test exceeded
its 5-second default timeout, then passed independently in 5.74 seconds with a 15-second allowance.
Typecheck passes. D-358 adds no real body-habitus profile or distribution, BMI relationship,
complexity spend, interpretation, clinical tag, rule, balance, point, persistence, runtime
activation, or UI.

The D-359 generated-observation frozen-patient checkpoint completed locally on 2026-08-04:

- the existing D-327/D-328/D-329/D-330 path accepts D-358 output without a new compiler branch;
- one synthetic D-330 patient retains the exact D-356 compilation, stable option draw, resolved
  observation, generated D-310 member, and generated D-320 binding;
- D-311 attachment and the final D-200 patient contain the exact same resolved observation, and
  the D-356 seed equals the D-233 patient-generation seed; and
- complete D-330 replay reproduces the same artifact with no second draw or provenance relabeling.

The focused end-to-end D-359 proof passes 1/1 in 30.51 seconds. D-359 adds no compiler version,
real profile or distribution, BMI relationship, complexity spend, interpretation, clinical tag,
rule, balance, point, persistence, runtime activation, or UI.

The D-360 checked-in current-MDD duration integration completed locally on 2026-08-04:

- one end-to-end D-330 fixture now imports the reviewed
  `duration-profile.mdd.current-episode@1.0.0` directly from the checked-in catalog;
- D-263 resolves one exact declared option from the D-233 patient-generation seed;
- D-294 validates the patient-report source, D-328/D-200 retain the resolved value, and D-240
  exposes its minimized target-scoped reveal; and
- canonical profile-fingerprint equality proves exact catalog identity without treating unordered
  option or display-variant array order as clinical meaning, while complete D-330 replay remains
  identical.

The focused D-360 proof passes 1/1. D-360 changes no duration option, weight, prevalence claim,
severity/impairment relationship, treatment meaning, rule, balance, point, persistence, runtime
activation, or UI.

The D-361 checked-in current-MDD condition-finding integration completed locally on 2026-08-04:

- the exact reviewed `condition-finding-profile.mdd.current-episode@1.3.0` now binds the exact
  `diagnosis.major-depressive-disorder@1.6.0` state in one end-to-end D-330 fixture;
- D-197 selects five through nine declared dimensions, satisfies the reviewed core requirement,
  emits only declared manifestations, and uses the D-233 patient-generation seed;
- the checked-in D-256/D-259/D-260 depressive-history horizon derives absent responses only for
  its exact 17 patient-report items after positive generation, while an exact selected MSE
  manifestation may join independently and unselected MSE alternatives remain open-world; and
- the final patient contains every D-197 positive, the depressive-symptom result binding contains
  one projection for each of the 17 assessed items, and complete D-330 replay is identical.

The focused D-361 proof passes 1/1 in 23.60 seconds and typecheck passes. The generic D-324/D-330
test harness retains its separate synthetic measurement action only as a nonclinical
materialization anchor. D-361 adds no symptom, cardinality, weight, prevalence, diagnosis
inference, severity/impairment relationship, treatment meaning, rule, balance, point,
persistence, runtime activation, or UI.

The D-362 combined checked-in current-MDD truth-state proof completed locally on 2026-08-04:

- D-197 and D-263 consume the same exact D-233 patient-generation seed while retaining their
  independent reviewed profile references, stable draws, and source-validation chains;
- the final D-330 patient contains every selected current-MDD manifestation plus the exact
  checked-in current-episode duration, and D-294/D-328/D-200 preserve the two branches without
  redraw or relabeling;
- complete D-330 replay reproduces the same combined patient; and
- the target-scoped duration reveal is deliberately empty in this combined proof because the full
  presenting-problem assembly also needs broad functional impact, which has no reviewed generation
  owner. Missing impact remains missing rather than becoming an absent patient claim.

The focused D-362 proof passes 1/1 in 23.93 seconds. D-362 adds no symptom, duration, weight,
prevalence claim, functional-impact or impairment value, diagnosis inference, severity, treatment
meaning, rule, balance, point, persistence, runtime activation, or UI.

The D-363 checked-in mania/hypomania-history integration completed locally on 2026-08-04:

- the exact D-352 action, result recipe, sixteen current/past patient-report definitions, and
  thirty-two present/absent projections now join the combined MDD finding/duration fixture;
- because no reviewed positive mania-history generator is active, D-256 closes those sixteen
  assessment rows to absent only after the MDD positive-generation branch settles;
- the final patient retains exactly sixteen mania-history finding identities, the
  `info.history.mania` result binding references exactly those sixteen resolved projections, and
  no MDD condition-finding candidate is relabeled as a mania finding; and
- complete D-330 replay remains identical.

The focused D-363 proof passes 1/1 in 24.83 seconds and typecheck passes. D-363 adds no manic or
hypomanic episode generation, bipolar inference, antidepressant safety conclusion, treatment
prerequisite, rule, balance, point, persistence, runtime activation, or UI.

The D-364 checked-in psychosis-history integration completed locally on 2026-08-04:

- the exact D-353 action, result recipe, six current patient-report definitions, and twelve
  present/absent projections now join D-363's combined MDD assessment fixture;
- because no reviewed positive psychosis-history generator is active, D-256 closes those six rows
  to absent only inside that assessment horizon after positive generation;
- the final patient retains exactly six psychosis-history finding identities, the
  `info.history.psychosis` binding references exactly those six resolved projections, and the
  sixteen-row mania binding plus checked-in duration remain present; and
- complete D-330 replay remains identical.

The focused D-364 proof passes 1/1 in 25.35 seconds and typecheck passes. D-364 adds no proposition
truth adjudication, MSE observation, psychosis/diagnosis inference, treatment meaning, rule,
balance, point, persistence, runtime activation, or UI.

The D-365 checked-in detailed suicide/self-harm assessment integration completed locally on
2026-08-04:

- the exact D-340/D-341 action, result recipe, nine patient-report definitions, and eighteen
  present/absent projections now join the combined MDD assessment fixture;
- the fixed D-233 seed selects exactly one MDD death/suicidality manifestation in that horizon;
  D-256 preserves its positive value and closes only the other eight rows;
- the `info.history.suicide-safety` result binding references exactly those nine resolved
  projections while the existing depressive-symptom, mania, psychosis, and duration state remains
  intact; and
- complete D-330 replay remains identical.

The focused D-365 proof passes 1/1 in 25.50 seconds and typecheck passes. D-365 adds no risk score
or category, safety-planning ability, disposition conclusion, treatment meaning, rule, balance,
point, persistence, runtime activation, or UI.

The D-366 checked-in MDD native safety-rule integration completed locally on 2026-08-04:

- one combined D-330 fixture now imports the reviewed
  `decision-policy.mdd-initial-medication@1.3.0`, exact focused
  `medication-regimen-route.mdd-initial-one-first-line-antidepressant@1.3.0`, and D-339
  `rule.diagnosis-mdd.passive-death-wish-safety-assessment`;
- the ordinary short generation root `g.mdd-policy.0` produces the exact reviewed
  `finding.safety.current-passive-death-wish@1.0.0 = present` value through the existing D-233
  patient-generation path;
- D-191 includes the real primary route plus the safety rule as an automatic prerequisite, binds
  the rule to the exact generated finding record, and targets only
  `info.history.suicide-safety`; and
- the complete D-330 artifact passes native integrity and deterministic replay while the rule
  retains `balanceRef: null`.

The focused D-366 proof passes 1/1 in 25.56 seconds and typecheck passes. D-366 imports no balance
or points and infers no risk category, disposition, treatment selection, persistence, runtime
activation, or UI.

The D-367 checked-in antidepressant-triggered mania-history integration completed locally on
2026-08-04:

- the real MDD fixture now also adapts D-338
  `rule.diagnosis-mdd.initial-route-antidepressant-mania-history` through the exact approved
  `medication-class.mdd-initial-first-line-antidepressant@1.0.0` owner and its five reviewed
  memberships;
- the compiled trigger retains concrete starts for bupropion, escitalopram, fluoxetine,
  mirtazapine, and sertraline while carrying no medication-class ID, tag, or prose-derived
  relationship;
- D-191 includes the rule because this encounter makes bupropion and `info.history.mania`
  available, but the complete medication trigger and information-only fulfillment predicate
  remain separately frozen; and
- complete D-330 integrity and replay remain identical with `balanceRef: null`.

The focused D-367 proof passes 1/1 in 25.63 seconds. D-367 adds no points, antidepressant-safety
conclusion, selected treatment, player fulfillment/omission evaluation, persistence, runtime
activation, or UI.

The D-368 checked-in generated-MDD balance evaluation completed locally on 2026-08-04:

- the existing D-173 attachment boundary decorates only D-338 and D-339 with their exact
  checked-in reviewed balance records before D-191 compilation; the MDD primary route remains
  unbalanced;
- D-235 freezes those two canonical balance payloads, derives purchased information only from
  successful events, and evaluates the exact final medication snapshot for the player and
  database plan through the same native scorer;
- the database plan and fulfilled player decision each produce +35 mania-history and +50 detailed
  safety points, totaling +85;
- bupropion with both histories omitted produces −50 and −80, totaling −130, while detailed
  safety without an antidepressant start produces explicit `not_triggered` zero plus +50; and
- all three attempts preserve complete balance snapshots, point traces, and deterministic D-235
  replay.

The focused D-368 proof passes 1/1 in 18.47 seconds. D-368 adds or retunes no point value, does not
claim a complete MDD plan score, and widens no persistence, runtime, or UI surface.

The D-369 checked-in direct depressive-syndrome scoring proof completed locally on 2026-08-04:

- the reviewed `rule.diagnosis-mdd.initial-depressive-syndrome-assessment` now compiles against
  the existing checked-in `info.history.depressive-symptoms` action/result and exact MDD patient
  scope;
- the expanded test balance view attaches only its existing
  `balance.mdd-initial-depressive-syndrome-assessment@1.3.0` owner in addition to D-338/D-339;
- the database plan and obtained player decision produce `+50 + +35 + +50 = +135`, while omitting
  only depressive symptoms changes that subtotal to `−50 + +35 + +50 = +35`; and
- D-235 freezes the three exact balance records and deterministically replays both attempts.

The focused D-369 proof passes 1/1 in 15.08 seconds. D-369 adds no symptom-count diagnosis
inference, primary-route points, functional-impact state, point retuning, persistence/runtime/UI
widening, or other clinical rule.

The D-370 checked-in dominant primary-route scoring proof completed locally on 2026-08-04:

- the exact focused MDD regimen-route candidate now receives its existing
  `balance.mdd-initial-one-first-line-antidepressant@1.3.0` owner before D-191 compilation;
- the route continues to use its reviewed count-aware transition predicate and the encounter's
  exact admitted medication horizon, which contains bupropion in this fixture;
- the database plan and matching player decision calculate
  `+200 + +50 + +35 + +50 = +335`; and
- obtaining all three histories while selecting no antidepressant calculates
  `0 + +50 + 0 + +50 = +100`, preserving the route's explicit zero-unmatched behavior and
  the mania-history rule's `not_triggered` state.

The focused D-370 proof passes 1/1 in 15.01 seconds. D-370 adds no unavailable medication,
comparative-fit rule, treatment-omission penalty, point retuning, diagnosis/disposition scoring,
or persistence/runtime/UI widening.

The D-371 generated-MDD standard-mode settlement proof completed locally on 2026-08-04:

- a deterministic standard-mode MDD patient with the same four reviewed balances settles the
  database-plan-like selected route at 335 care points and the same-workup no-route decision at
  100 care points;
- exact frozen service quotes determine information expenses, operating expenses remain the sum
  of information and treatment expenses, and gross payout remains base reimbursement plus positive
  care points at the existing 1.00 satisfaction multiplier;
- each positive payout is floored at zero before it is added to the 250-point bank and 100-point
  lifetime total; and
- a zero-reimbursement/no-action stress attempt scores −130 care points but banks zero and leaves
  both persistent totals unchanged.

All three native attempts pass D-235 integrity replay. The focused D-371 proof passes 1/1 in
18.63 seconds. D-371 adds no resource price, treatment charge, bonus, satisfaction effect, new
economy formula, persistence migration, runtime activation, or UI.

The D-372 generated-MDD information-owner coverage audit completed locally on 2026-08-04:

- the complete lossless native MDD candidate set now includes the reviewed episode-course,
  depressive-syndrome, exact-class mania-history, medication-reconciliation, reaction-history,
  substance-history, and passive-death-wish safety rules beside the focused route;
- D-191 emits exact point-free `uncovered_action` diagnostics for presenting problem, medication
  reconciliation, allergy/adverse-reaction history, and substance history because their patient
  scope and any medication trigger apply while those exact actions remain outside the generated
  encounter horizon;
- a treatment-triggered diagnostic disappears when the trigger is unavailable; and
- current duration, empty regimen/exposure lanes, and explicitly unassessed reaction state remain
  unchanged and do not become fabricated negative results.

The focused D-372 generated-patient proof passes 1/1 in 27.61 seconds, and all 33 decision-policy
tests pass in 0.15 seconds. D-372 adds no clinical rule, point value, source-report profile,
patient invalidation/reroll, persistence/runtime activation, or UI.

The D-373 accurate structured-history baseline completed locally on 2026-08-04:

- three checked-in authoring-only profiles bind the catalog-derived patient self-report role to
  current medication regimen, longitudinal reaction history, and longitudinal substance-use
  definitions;
- fixed selection carries no report weight, stable report draw, or D-201 source-report module and
  leaves the zero-module optional-complexity artifact unchanged;
- empty regimen and positive-use lanes become aligned `none_reported` source views, while the
  explicitly unassessed reaction lane and both assessment statuses remain `unassessed` and
  indeterminate; and
- the exact D-217/D-215/D-299/D-350/D-351/D-214 chain attaches all three results, leaving only the
  separate presenting-problem functional-impact action uncovered and adding no balance or points.

The focused D-373 generated-patient proof passes 1/1 in 28.91 seconds, `pnpm content:validate`
passes, the focused Player/Reviewer bundle-isolation proof passes 1/1, and `pnpm typecheck` passes.
The first attempted focused command used the root `pnpm test` wrapper, which does not forward a
Vitest filter and instead began the whole suite. That broad run was stopped after it exposed four
stale assertions elsewhere in the uncommitted batch: MDD profile-scope test data, launcher-profile
Developer-opinion target registration in the Developer Database compiler, and two pre-D-355
empty-categorical-observation expectations. Those four nonclinical assertions now use the current
MDD scope, recognize the already validated launcher-presentation catalog, and expect the checked-in
neutral body-habitus definition; their exact four-file gate passes 28/28. D-373 adds no
inaccurate-report profile, report probability, clinical
inference, point value, persistence/runtime activation, or UI.

The D-374 generated-MDD diagnosis horizon completed locally on 2026-08-04:

- the real generated-MDD catalog snapshot now carries one exact optional family-level MDD
  diagnosis choice while preserving blank submission;
- D-272 compiles the exact checked-in MDD definition into a minimized owner with no player
  severity IDs and only the reviewed psychotic-features specifier;
- one native completed attempt submits family-level MDD, receives no diagnosis points, and
  replays through D-235; and
- fixed D-373 source-report selection now omits the absent optional-feature artifact rather than
  retaining `undefined`, making the complete waiting patient losslessly JSON-safe for attempt
  replay.

The combined D-373/D-374 focused generated-patient proof passes 1/1 in 33.03 seconds, and the
focused fixed-selector JSON round-trip/integrity proof passes 1/1. D-374 adds no diagnosis
inference, answer key, diagnosis score, severity generation, point value, persistence migration,
runtime activation, or UI.

The D-375 structured-history purchase/replay proof completed locally on 2026-08-04:

- one ordinary purchase event obtains each checked-in medication-reconciliation,
  allergy/adverse-reaction, and substance-use result;
- every purchase references the exact frozen structured reveal and derives a 25-point native
  least-cost history-service quote rather than accepting a caller-authored cost row;
- D-242 derives the three purchased information-action identities beside the family-level MDD
  submission; and
- D-235 replays the zero-care-point Endgame attempt with 75 itemized information-expense points
  and zero practice banking.

The combined D-373–D-375 focused proof passes 1/1 in 33.10 seconds. The neighboring D-368 score and
D-371 settlement fixtures initially showed deterministic patient-seed drift when the diagnosis
horizon was added to every MDD fixture. D-374 now uses an explicit diagnosis-enabled template
variant, preserving the existing clinical fixtures; the exact D-368, D-371, D-374, and fixed
selector regression set passes 4/4. D-375 adds no clinical balance, source behavior, service
price, persistence migration, runtime activation, or UI.

The D-376 historical persistence-envelope proof completed locally on 2026-08-04. The exact D-375
attempt now passes the existing timestamp-separated persistence-record schema, JSON round trip,
native attempt integrity replay, and persistence-record integrity replay without changing its
embedded payload. The combined focused proof passes 1/1 in 32.93 seconds. D-376 adds no wall-clock
engine input, SaveData/IndexedDB migration, runtime queue, review export, or UI.

The D-377 completion-proof checkpoint completed locally on 2026-08-04. The exact D-375 attempt,
terminal event, D-374 waiting slot, patient payload, and template fingerprint now pass the
existing D-234 completion-proof JSON and integrity replay. The combined focused proof passes 1/1
in 37.61 seconds. D-377 stops before slot mutation/refill and adds no SaveData, runtime queue,
clinical behavior, points, or UI.

The D-378 completed-patient lifecycle checkpoint completed locally on 2026-08-04. The exact
D-377 proof now passes D-234's completed-encounter transition, vacates only the occupied D-374
coordinate, retains the complete D-375 attempt in completion ordinal zero, advances bounded
location history once, and passes transition integrity/context replay. The combined focused
D-373–D-378 proof passes 1/1 in 57.26 seconds. D-378 stops before refill because the generic
lifecycle fixture does not rebuild the seed-dependent clinical MDD payload from the
post-transition authority. It adds no SaveData, runtime queue, clinical behavior, points, or UI.

The D-379 functional-impairment weighted-selection foundation completed locally on 2026-08-04.
D-267's resolver now preserves its neutral uniform mode while accepting one optional
all-options positive-integer mass policy, selecting through cumulative mass, and freezing exact
normalized probabilities for every option. Weighted policy and request source kind, time scope,
and care setting must match; incomplete, invented, or crossed-context mass fails closed. The focused
resolver proof passes 6/6, the D-289/D-290/D-292/D-312/D-194 regression set passes 15/15, and the
D-269/D-297 severity derivation suite passes 18/18. No real MDD profile or adjunct number was
imported.

The planned read-only adjunct check through D-379 found its committed coordinate still at
`1fc0bbaf223d2912c11d16057c955011cd760c08` with a materially dirty worktree. A newly visible
substance-use/withdrawal/overdose/tobacco medication-breadth packet remains the active review item.
The substantively reviewed MDD functional-impairment packet is still explicitly preliminary,
medically unreviewed for downstream use, unmapped, and without an immutable evidence unit or
bundle. `proposals/psychsim/` still contains only its README, so no functional-impact distribution,
diagnosis, medication, formulary, relationship, rule, balance, or point was imported.

## Files to read before continuing

Always read the startup contract files named in `AGENTS.md`. For the current checkpoint also read:

- `docs/DECISIONS.md` through D-379
- `docs/ARCHITECTURE.md`
- `docs/CONTENT_MODEL.md`
- `docs/CONTENT_REVIEW.md`
- `docs/DATA_ADJUNCT_EVIDENCE_QUEUE.md`
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
- `packages/engine/src/decision-policy.ts`
- `packages/engine/src/decision-balance.ts`
- `packages/engine/src/decision-selection.ts`
- `packages/engine/src/decision-selection.test.ts`
- `packages/engine/src/generated-diagnosis-selection-owner.ts`
- `packages/engine/src/patient-template-clinical-result-attachment-orchestrator.ts`
- `packages/engine/src/patient-template-clinical-result-materialization-compiler.ts`
- `packages/engine/src/catalog-patient-launcher-presentation-attachment.ts`
- `packages/engine/src/patient-launcher-presentation-resolver.ts`
- `packages/engine/src/generated-waiting-slot-launcher-presentation-attachment.ts`
- `content/catalogs/presentations/launcher-presentations.json`
- `tools/content-cli/src/patient-launcher-presentations.test.ts`
- `content/catalogs/actions/universal-action-result-assemblies.json`
- `content/catalogs/findings/projections.json`
- `content/catalogs/findings/projection-horizons.json`
- `tools/content-cli/src/universal-action-result-content.test.ts`
- `tools/content-cli/src/finding-projections.test.ts`
- `packages/engine/src/patient-template-clinical-result-materialization-context-compiler.ts`
- `packages/engine/src/patient-template-clinical-result-resource-coverage-compiler.ts`
- `packages/engine/src/patient-template-post-composition-assembly-orchestrator.ts`
- `packages/engine/src/generated-diagnosis-selection-owner.test.ts`
- `packages/engine/src/patient-launcher-presentation-resolver.ts`
- `packages/engine/src/patient-launcher-presentation-resolver.test.ts`
- `packages/engine/src/catalog-patient-launcher-presentation-attachment.ts`
- `packages/engine/src/catalog-patient-scene-source-instance-compiler.ts`
- `packages/engine/src/catalog-patient-scene-source-instance-compiler.test.ts`
- `packages/engine/src/numeric-structured-test-result-compiler.ts`
- `packages/engine/src/numeric-structured-test-result-compiler.test.ts`
- `packages/engine/src/patient-owned-structured-test-result-compiler.ts`
- `packages/engine/src/patient-owned-structured-test-result-compiler.test.ts`
- `packages/engine/src/patient-owned-measurement-compiler.ts`
- `packages/engine/src/patient-owned-measurement-compiler.test.ts`
- `packages/engine/src/generated-measurement-compiler.ts`
- `packages/engine/src/generated-measurement-compiler.test.ts`
- `packages/engine/src/body-mass-index-derivation-compiler.ts`
- `packages/engine/src/body-mass-index-derivation-compiler.test.ts`
- `packages/engine/src/body-mass-index-measurement-materializer.ts`
- `packages/engine/src/patient-owned-categorical-observation-compiler.ts`
- `packages/engine/src/patient-owned-categorical-observation-compiler.test.ts`
- `packages/engine/src/patient-clinical-result-collection-compiler.ts`
- `packages/engine/src/patient-clinical-result-collection-compiler.test.ts`
- `packages/engine/src/patient-clinical-result-attachment.ts`
- `packages/engine/src/post-composition-patient-state-assembler.ts`
- `packages/engine/src/patient-scene-source-instance-compiler.ts`
- `packages/engine/src/patient-scene-source-instance-compiler.test.ts`
- `packages/engine/src/condition-functional-impairment-attachment.ts`
- `packages/engine/src/condition-functional-impairment-projection.ts`
- `packages/engine/src/condition-functional-impairment-source-validation.ts`
- `packages/engine/src/queue.ts`
- `packages/engine/src/engine.test.ts`
- `packages/engine/src/diagnosis-information-prerequisite-adapter.ts`
- `packages/engine/src/diagnosis-information-prerequisite-adapter.test.ts`
- `packages/engine/src/medication-regimen-route-adapter.ts`
- `packages/engine/src/shared-finding-compiler.ts`
- `packages/engine/src/finding-source-report-projection.test.ts`
- `packages/engine/src/catalog-instance-compiler.ts`
- `packages/engine/src/catalog-instrument-administration-attachment.ts`
- `packages/engine/src/encounter-operational-admission-compiler.ts`
- `packages/engine/src/encounter-operational-admission-compiler.test.ts`
- `packages/engine/src/generated-service-quote.ts`
- `packages/engine/src/generated-completed-attempt-compiler.ts`
- `packages/engine/src/instrument-item-response-compiler.ts`
- `packages/engine/src/instrument-item-response-compiler.test.ts`
- `packages/engine/src/presentation-richness.ts`
- `packages/engine/src/template-condition-selector.ts`
- `packages/engine/src/condition-finding-cardinality-selector.ts`
- `packages/engine/src/background-finding-outcome-selector.ts`
- `packages/engine/src/weighted-finding-tendency-aggregator.ts`
- `packages/engine/src/weighted-finding-tendency-applicability-compiler.ts`
- `packages/engine/src/finding-pipeline-audit-composer.ts`
- `packages/engine/src/pre-finding-patient-state-orchestrator.ts`
- `packages/engine/src/selected-location-operational-resource-compiler.ts`
- `packages/engine/src/mode-patient-template-horizon-compiler.ts`
- `packages/engine/src/patient-template-location-admission-compiler.ts`
- `packages/engine/src/admitted-template-location-binding-compiler.ts`
- `packages/engine/src/optional-feature-budget-selector.ts`
- `packages/engine/src/optional-comorbidity-budget-bridge.ts`
- `packages/engine/src/optional-reaction-history-bridge.ts`
- `packages/engine/src/optional-prior-treatment-bridge.ts`
- `packages/engine/src/optional-exposure-budget-bridge.ts`
- `packages/engine/src/resolved-patient-state-composer.ts`
- `packages/engine/src/resolved-patient-state-composer.test.ts`
- `packages/engine/src/resolved-patient-state-source-validation.ts`
- `packages/engine/src/shared-finding-source-validation.ts`
- `tools/content-cli/src/patient-scene-source-definitions.test.ts`
- `tools/content-cli/src/numeric-structured-test-results.test.ts`
- `tools/content-cli/src/patient-owned-structured-test-results.test.ts`
- `tools/content-cli/src/patient-owned-measurements.test.ts`
- `tools/content-cli/src/patient-owned-categorical-observations.test.ts`
- `tools/content-cli/src/patient-clinical-result-collections.test.ts`
- `content/catalogs/patient-scene-sources/definitions.json`
- `packages/engine/src/resolved-patient-state-normalizer.ts`
- `packages/engine/src/resolved-condition-source.ts`
- `packages/engine/src/information-action-fingerprint.ts`
- `packages/engine/src/universal-action-result-compiler.ts`
- `packages/engine/src/universal-action-result-compiler.test.ts`
- `packages/engine/src/universal-action-result-attachment.ts`
- `packages/engine/src/universal-action-result-attachment.test.ts`
- `packages/engine/src/structured-source-report-compiler.ts`
- `packages/engine/src/structured-source-report-compiler.test.ts`
- `packages/engine/src/structured-source-report-source-validation.ts`
- `packages/engine/src/structured-source-report-behavior-selector.ts`
- `packages/engine/src/structured-source-report-behavior-selector.test.ts`
- `packages/engine/src/structured-patient-state-record-projection.ts`
- `packages/engine/src/structured-patient-state-record-projection.test.ts`
- `packages/engine/src/structured-source-report-record-projection.ts`
- `packages/engine/src/structured-source-report-record-projection.test.ts`
- `packages/engine/src/structured-source-report-result-attachment.ts`
- `packages/engine/src/structured-source-report-result-attachment.test.ts`
- `packages/engine/src/target-scoped-patient-value-projection.ts`
- `packages/engine/src/target-scoped-patient-value-projection.test.ts`
- `packages/engine/src/target-scoped-patient-value-source-validation.ts`
- `packages/engine/src/clinical-duration-profile-resolver.ts`
- `packages/engine/src/clinical-duration-profile-resolver.test.ts`
- `packages/engine/src/condition-clinical-duration-attachment.ts`
- `packages/engine/src/condition-clinical-duration-source-validation.ts`
- `packages/engine/src/condition-episode-severity-derivation.ts`
- `packages/engine/src/condition-episode-severity-derivation.test.ts`
- `packages/engine/src/condition-functional-impairment-profile-resolver.ts`
- `packages/engine/src/condition-functional-impairment-profile-resolver.test.ts`
- `packages/engine/src/catalog-instance-compiler.test.ts`
- `packages/engine/src/finding-pipeline-audit-composer.test.ts`
- `packages/engine/src/location-owned-patient-slot-selection-compiler.ts`
- `packages/engine/src/location-patient-slot-capacity-compiler.ts`
- `packages/engine/src/location-patient-slot-capacity-compiler.test.ts`
- `packages/engine/src/patient-slot-fill-seed-authority.ts`
- `packages/engine/src/empty-authorized-patient-slot-fill-compiler.ts`
- `packages/engine/src/generated-completed-attempt-compiler.ts`
- `packages/engine/src/generated-service-quote.ts`
- `packages/engine/src/generated-settlement-context.ts`
- `packages/engine/src/instrument-administration-compiler.ts`
- `packages/engine/src/instrument-administration-compiler.test.ts`
- `packages/engine/src/instrument-administration-attachment.ts`
- `packages/engine/src/instrument-administration-attachment.test.ts`
- `packages/engine/src/instrument-administration-projection.ts`
- `packages/engine/src/instrument-administration-projection.test.ts`
- `packages/engine/src/instrument-administration-source-validation.ts`
- `packages/engine/src/instrument-administration-source-validation.test.ts`
- `packages/engine/src/instrument-administration-test-fixture.ts`
- `packages/engine/src/case.ts`
- `packages/engine/src/patient-slot-post-encounter-lifecycle-compiler.ts`
- `packages/engine/src/facility-move-waiting-slot-migration-compiler.ts`
- `packages/engine/src/patient-template-location-admission-compiler.test.ts`
- `packages/engine/src/diagnosis-scoring.ts`
- `packages/schemas/src/index.ts`
- `packages/schemas/src/instrument-administration.test.ts`
- `packages/schemas/src/v2-clinical-scaffolding.test.ts`
- `packages/schemas/src/structured-patient-state-reveal-projection.test.ts`
- `packages/content-runtime/src/review-cohort.ts`
- `packages/content-runtime/src/reviewer-content.test.ts`
- `packages/content-runtime/src/reviewer-policies.ts`
- `packages/content-runtime/src/developer-content.ts`
- `packages/content-runtime/src/developer-content.test.ts`
- `tools/content-cli/src/developer-database-knowledge.ts`
- `tools/content-cli/src/google-drive-sync.ts`
- `apps/web/src/components/DeveloperDatabaseKnowledge.tsx`
- `apps/web/src/components/PersonalKnowledgeWorkbench.tsx`
- `apps/web/src/components/ReceiptView.tsx`
- `apps/web/src/components/DeveloperPatientMaker.tsx`
- `apps/web/src/components/DeveloperPatientMaker.test.tsx`
- `apps/web/src/components/DatabaseBrowser.test.tsx`
- `content/catalogs/authoring/personal-knowledge/cross-reference-aliases.json`
- `content/catalogs/authoring/personal-knowledge/private-source-catalog.json`
- `content/catalogs/decision-policies/catalog.json`
- `content/catalogs/decision-policies/balances.json`
- `content/catalogs/findings/projections.json`
- `content/catalogs/findings/projection-horizons.json`
- `content/catalogs/findings/definitions/past-episodic-decreased-sleep-need.finding.json`
- `content/catalogs/findings/definitions/past-episodic-elevated-irritable-mood.finding.json`
- `content/catalogs/findings/definitions/past-episodic-high-risk-spending.finding.json`
- `content/catalogs/findings/definitions/past-episodic-increased-goal-directed-activity.finding.json`
- `content/catalogs/findings/definitions/past-episodic-pressured-speech.finding.json`
- `content/catalogs/findings/definitions/past-episodic-racing-thoughts.finding.json`
- `content/catalogs/findings/definitions/past-episodic-self-reported-impulsivity.finding.json`
- `content/catalogs/findings/definitions/reported-delusional-beliefs.finding.json`
- `content/catalogs/findings/definitions/reported-hallucinations.finding.json`
- `content/catalogs/actions/universal-action-result-assemblies.json`
- `content/catalogs/evidence/opinions/developer-opinions.json`
- `content/catalogs/patient-scene-sources/structured-report-profiles/current-medication-regimen-accurate.profile.json`
- `content/catalogs/patient-scene-sources/structured-report-profiles/reaction-history-accurate.profile.json`
- `content/catalogs/patient-scene-sources/structured-report-profiles/substance-use-accurate.profile.json`
- `content/catalogs/measurements/definitions.json`
- `tools/content-cli/src/universal-action-result-content.test.ts`
- `tools/content-cli/src/mania-history-action-result.test.ts`
- `tools/content-cli/src/psychosis-history-action-result.test.ts`
- `tools/content-cli/src/validate.ts`
- `content/catalogs/demographics/race-ethnicity.json`
- `content/catalogs/evidence/formal/omb-spd15-2024.evidence.json`
- `content/catalogs/medications/regimen-knowledge.json`
- `content/cases/blueprints/reviewer-cohort/bipolar-depression.scenario.json`
- `content/cases/blueprints/reviewer-cohort/mdd-adherence.scenario.json`
- `content/cases/blueprints/reviewer-cohort/mdd-adequate-nonresponse.scenario.json`
- `content/cases/blueprints/reviewer-cohort/mdd-prior-good-response.scenario.json`
- `content/cases/blueprints/reviewer-cohort/mdd-prior-intolerance.scenario.json`
- `content/cases/blueprints/reviewer-cohort/schizophrenia-relapse.scenario.json`
- `content/cases/blueprints/reviewer-cohort/reviewer-assignment.tickets.json`
- `content/cases/review/database-driven-patient-generation.tickets.json`
- `content/cases/review/ticket-literature-scout.catalog.json`
- `content/cases/review/drive-reviewer-feedback-2026-07-27.tickets.json`
- `content/catalogs/findings/background-outcome-profiles.json`
- `content/catalogs/evidence/formal/cdc-nchs-nhanes-2021-2023-depression-screener.evidence.json`
- `content/catalogs/evidence/formal/nlm-rxnorm-api-2026-08-03.evidence.json`
- `content/catalogs/medications/identity-intake.candidates.json`
- `packages/content-runtime/src/medication-identities.generated.ts`
- `tools/content-cli/src/adjunct-packet-status.ts`
- `tools/content-cli/src/background-finding-outcome-profiles.test.ts`
- `tools/content-cli/src/intake-rxnorm-medication-identities.ts`
- `tools/content-cli/src/sync-medication-identity-index.ts`

## Exact next action

This explicit integration/release checkpoint is fully validated under Node 22.23.2 and pnpm
10.13.1. The complete intended D-275-through-D-382 batch must now be committed on `beta`, pushed,
promoted as a whole by fast-forwarding `main`, and verified on GitHub Pages. The checkout must then
return to `beta` and leave the local Developer server available at
`http://127.0.0.1:4318/`. Before the release commit, `main`/`origin/main` are four commits behind
the clean `beta`/`origin/beta` base with no divergence. When this file is read from the released
commit, `beta`, `main`, `origin/beta`, and `origin/main` are expected to contain the same release
tip; stop on any mismatch. Do not begin another clinical owner before that release completes.

After the release, the exact next database task is the smallest point-free medication composition
foundation needed to represent fixed multi-ingredient/formulation products without misusing the
single-ingredient identity schema. It must preserve ingredient identities and add no indication,
class, formulary membership, regimen behavior, rule, generation probability, balance, or point.
At the next diagnosis/medication boundary, run `pnpm content:adjunct:status`; the 2026-08-05
inventory has 60 packets, 19 Developer-reviewed packets, one immutable evidence bundle, zero
snapshot-bound PsychSim mappings, and fingerprint
`628a37af01c30547bf24387a594e87c1d482737f9b70ea7abdf16d545acd6148`.

The remaining text in this section is dependency history and guardrails for the batch being
released; it does not supersede the immediate integration action above.

`ticket.source.mdd.severity-generator-policy` is resolved by D-268 and its point-free same-episode
combination is proven by D-269/D-297 with an independent D-291 structural source check on the
D-267 impairment input. Preserve family-level MDD diagnosis selection, the detached higher-of
descriptor, and the separate named psychotic-features specifier. The remaining source request
concerns exact backend symptom-severity and impairment boundaries, not whether
mild/moderate/severe should become player diagnoses.

D-274 closes the requested transitional local Developer Patient Maker over the finite
compatibility-case engine. Its complete integration gate, implementation commit
`891792a646f035fe3c0fba5a95185e7e5bb8a69b`, remote handoff checkpoint
`867541820f128d394b0421e8470568fade88c598`, and Node 22 GitHub gate are complete. D-275 now
establishes the scalable modular-complexity contract needed before richer patients are activated;
D-276 adds the migration-safe qualified-result semantic boundary and corrects the three finite
Reviewer cases that currently project regimen adherence; D-277 pins medication-history findings
to exact regimen or trial records; D-278 adds sparse patient-reported benefit for one exact current
medication; D-279 carries the separate exact tolerability owner into compatibility patient/scenario
state and medication-effects reveal; and D-280 adds the separate exact medication-change temporal
owner plus the attributed review-only restlessness projection; and D-281 adds the separate sparse
exact current-medication dose-position owner, closed reveal lane, and point-free exact-subject
decision facts. D-282 adds the standalone point-free rights-neutral
instrument-administration definition, complete/partial record, exact item partition, and optional
bounded authored raw-total boundary; and D-283 adds its exact patient-bound D-220 compiler,
fingerprints, structural-gap guard, and deterministic replay. D-284 adds the strict item/source
audit-redacted projection with exact reprojection; and D-285 proves standalone admission against
an explicit frozen patient/action/safe-response context; and D-286 derives that complete context
from an exact D-194 snapshot and retains replay. D-287 separately derives D-273's patient identity
and seed from that verified snapshot while accepting only reviewed presentation content. D-288
adds only the independently source-verified clomipramine and pregabalin neutral identity bins
exposed as gaps by the preliminary breadth inventory. D-289 binds genuine D-267 impairment
resolutions to one exact completed D-208 state in a separate authoring envelope without replacing
that state. D-290 derives only its strict target/source-instance-redacted minimized projection
with exact reprojection. D-291 separately establishes the deterministic exact-patient
source-instance horizon and patient/existence/kind validator. D-292 validates every D-289 source
against that horizon and carries D-290 forward without a result attachment. D-293 performs the
same independent exact-patient existence/kind proof for a D-283 instrument respondent and derives
D-284. D-296 advances D-285/D-286 to `2.0.0` and makes D-293 their only administration input,
eliminating the raw-D-283 admission bypass while preserving their frozen-context and exact-D-194
snapshot checks. D-294 validates each newly attached D-264 condition-duration source against the
base-patient D-291 horizon while retaining the changed composed-state reference separately. D-295
advances D-200 to `24.0.0` and makes that D-294 wrapper the only non-null condition-duration input,
eliminating the raw-D-264 bypass while preserving the no-duration path and unchanged D-194/D-240
consumption. D-297 advances D-269 to `2.0.0`, requires one same-patient D-291 horizon, validates
the standalone D-267 source instance and kind, and rejects a raw-D-267-only request without
changing the higher-of algorithm. D-298 separately validates every complete D-240
action/record/frozen-value source binding against a same-patient D-291 horizon and carries only
the existing target-redacted reveals forward without changing D-194/D-213/D-214. D-299 applies
the same independent proof to every selected D-215 profile/definition/projection source binding
and retains its detached D-212 recipes without changing catalog attachment. D-300 advances D-291
to a reusable exact-definition role ID while keeping patient ownership and validation in each
horizon, and D-299 now retains that definition reference. D-301 validates every opaque source
reference in the complete D-208 composed state against one same-patient D-291 horizon. D-304
advances that validator to `2.0.0` and makes all current source-bearing lanes own exact source
kinds. D-302 separately validates every direct D-258 finding-report source selection frozen in
D-193 while preserving its exact slot/projection and optional-complexity trace. D-303 adds the
first registry-validated neutral source-role definition horizon while keeping it out of
Player/Reviewer runtimes, and D-305 derives one exact patient-bound D-291 horizon from that
catalog through the authoring-only entry. D-306 compiles one exact generated-numeric test profile,
patient context, seed, interval owner, and that catalog-backed source into a frozen typed result
without attaching it to patient or runtime state. D-307 adds the complementary exact authored
result-profile and contract/source compiler for patient-owned tests, proven only with synthetic
fixtures. D-308 adds the exact authored measurement-value profile and direct-measurement source
compiler, likewise proven only with synthetic fixtures and kept `not_interpreted`. D-309 adds the
exact categorical-observation profile/compiler with empty interpretation and synthetic-only
MSE/physical domain proof. Their working tree is intentionally local, uncommitted, and unpushed
until a deliberate integration checkpoint. D-310 gathers the four replay-valid result owners into
one exact detached collection, D-311 attaches that collection only to the three empty result lanes
of one same-patient D-208 state, and D-312 combines that branch with an independently verified
D-294 duration branch only under their exact common D-208 root. D-313 connects only that exact
assembly to D-200/D-194. D-314 adds the separately source-validated D-292 impairment branch to the
same D-312 seam, checks its seed through D-200 `26.0.0`, and retains it in the frozen patient
snapshot. D-315 advances D-240 and D-298 to `2.0.0` and proves that this final-state impairment can
reuse the existing generic D-213/D-214 result route while preserving stricter player-safe
redaction than duration or burden. D-316 adds one exact runtime-excluded metric BMI derivation
definition and a replay-valid detached compiler over explicit D-310 height/weight records without
fabricating derived source/time ownership. D-317 materializes that value only into a detached
common measurement with explicit derivation provenance and the selected weight record's time
scope. D-318 advances D-311 to `2.0.0`, attaches that replay-valid record only beside the exact
D-310 input collection retained by D-316, and lets the existing D-312 common-root seam carry it
without recursive membership or a parallel snapshot. D-319 proves the unchanged D-213/D-214
direct-measurement binding through D-200/D-194 with synthetic content only. D-320 separately
pins every supplied D-310/D-317 owner to one exact full-template recipe, and D-321 advances
D-311 to `3.0.0` so that replay-valid D-320 artifact is its only result-set input. D-322 adds the
finite authoring-only exact-template recipe-coverage horizon above those recipes, with explicit
missing coverage and no inferred default. D-323 advances D-320 to `2.0.0` so it resolves only the
exact recipe retained by D-322 and rejects its former raw-recipe request. D-324 audits each bound
recipe member against one finite exact resource set and keeps missing resources explicit. D-325
derives the exact selected patient's seed, numeric generation context, recipe, and catalog source
horizon only from D-233/D-208/D-324. D-326 consumes only that context and delegates exact direct
result compilation, D-310 collection assembly, declared BMI materialization, and D-320 binding to
the existing typed authorities. All remain authoring-only. Do not promote `main` without a
separate explicit release instruction.

After the complete D-332 gate, do not widen D-235, persistence, queues, or runtime merely because
the complete authoring chain can now materialize template-owned results, atomically propose a
frozen waiting patient, and resolve real cosmetic launcher copy. The required read-only sibling
data-review checkpoint is complete: the adjunct remains dirty at
`1fc0bbaf223d2912c11d16057c955011cd760c08`, its broader diagnosis/formulary packets remain
preliminary or unmapped, `proposals/psychsim/` still contains only its README, and no safe current
snapshot mapping exists. Import nothing that remains preliminary, unmapped, rights-unclear, or
stale, and continue checking those briefs at diagnosis and formulary boundaries.

The D-333 detached D-331-to-D-287 waiting-slot presentation attachment is complete. Do not widen
that lane into `FrozenGeneratedWaitingSlot`, D-235, SaveData, persistence, runtime refill, or UI
before the first source-controlled vertical is otherwise complete enough to justify one explicit
migration/projection decision.

D-334 closes only the real checked-in action-result mapping for the existing weight/BMI action.
Do not widen it into invented height/weight values, BMI ranges or abnormality, adiposity/body
habitus inference, clinical fit tags, a template recipe, persistence, runtime generation, or UI.
The next measurement work must have an exact profile/generation owner or a separately reviewed
categorical-observation owner.

D-335 now supplies the detached generated-measurement compiler but no real distribution. Do not
invent a real height/weight/vital-sign profile, treat a support band as a reference interval,
infer normality or body habitus, or add D-320 recipe ownership merely because the compiler exists.
A first real profile requires exact source-controlled content and review; D-320 support requires
a separate typed recipe migration that preserves authored D-308 profiles.

D-336 now lets D-310 retain D-335 output distinctly. Do not use the shared measurement lane to
erase generated provenance or let an existing D-320 `measurement` member bind a generated
compilation. The next structural measurement seam is an explicit generated-measurement recipe,
resource, and materialization path; it must preserve the complete profile horizon rather than
matching only the selected profile.

D-337 now closes that structural seam. Do not weaken its full-profile-horizon ownership to the
single selected profile, merge authored and generated recipe kinds, or treat successful synthetic
height/weight/BMI proof as authorization for a real distribution. The next measurement work is
source-controlled clinical content: reviewed real profiles and, separately, range/interpretation
and body-habitus owners.

D-338 now closes the exact reviewed-class MDD mania-history prerequisite seam. Preserve the
separate native rule, complete class/version/membership validation, concrete compiled targets,
legacy compatibility rule, and independent provisional balance. Never reintroduce tag inference,
let an exact class enter the compatibility scorer, or treat these points as evidence-derived.
D-339 now closes the exact passive-death-wish/detailed-safety-assessment seam. Preserve the
native-only exact finding supplement, compatibility tag isolation, primary-route conjunction,
strict finding reference validation, and independent provisional balance. Never infer the
patient fact from a tag, treat action availability as fulfillment, derive a risk/disposition
conclusion, or let this authoring supplement enter compatibility scoring.
D-340/D-341 now close the detailed-safety fact and compact result seam. Preserve all nine exact
fact identities, present-versus-closed-horizon-absent trace, exact shared-action fingerprint, and
the absence of any risk or disposition aggregate. Never infer broader means access from weapon
access, invent a recent-attempt cutoff, or turn display closure into negative generation.
D-342 now closes the separate safety-planning-ability result-definition seam. Preserve its exact
current patient-report source kind, singleton-only typed reveal, redacted universal binding, and
authoring-only full source audit. Never treat it as a written plan, plan intervention, detailed
safety assessment, risk category, disposition conclusion, or point rule.
D-343 now closes the medication-reconciliation result-definition seam. Preserve the exact current
regimen-entry lane and current patient-report source. Never fold prior trials, benefit,
tolerability, dose position, change relationships, supplements, interpretation, or points into
that result.
D-344 now closes the allergy/adverse-reaction result-definition seam. Preserve exact reaction
records, both explicit assessment statuses, reported labels, null interpretation, and the
redacted/full-audit split. Never infer immune allergy, contraindication, treatment consequence, or
points from the structured result.
D-345 now closes the substance-history result-definition seam. Preserve objective exposure truth
separately from the exact source-reported entry lane. Never infer nonuse, source accuracy,
intoxication, withdrawal, diagnosis, causality, or points from the result.
D-346/D-347 now close the focused-versus-full treatment-history routing seam. Preserve
medication-only prior trials and the four distinct full-history lanes. Never show the hidden legacy
trial-adequacy field to the player; a minimized field-level projection remains required before
runtime.
D-348 now closes the medication-effects result-definition seam. Preserve separate exact-subject
benefit, tolerability, dose-position, and temporal-change lanes plus sparse missing semantics.
Never infer causality, dose, treatment correctness, or points from their grouping.
D-349 now closes the detached minimized-record field seam. Preserve its closed lane shapes,
source-presented-only resolution, trial duration/highest-dose display, hidden-field redactions,
fingerprint, and exact reprojection. Never attach caller-authored record fields or expose trial
adequacy, objective misuse truth, reaction interpretation, internal diagnosis mappings,
source-alignment audit, or authoring summaries.
D-350 now closes the detached source-validation seam for that safe view. Preserve D-299 as the
only upstream authority, exact patient/definition/action/source/time cross-links, one projection
per retained recipe, ordered fingerprints, and full replay. Never accept raw D-215 output,
caller-authored safe fields, or treat the wrapper as D-218/D-194/D-213/D-214/runtime authority.
D-351 now closes the detached D-350-to-D-214 join. Preserve exact replay-valid D-350 and D-213
authority, one identical patient and complete structured-envelope set, mechanical D-214
translation, exact safe-field/reveal matching, and full replay. Never accept caller-authored
D-214 output or widen this artifact into PatientInstance, D-194/D-218, persistence, runtime, or UI.
D-352 now closes the checked-in mania/hypomania-history result-content seam behind D-338. Preserve
all eight current and eight past episodic patient-report identities, hidden subthreshold values,
explicit closed negatives, and the separation from MSE observations. Never infer an episode,
bipolar diagnosis, generation frequency, treatment consequence, or points from this package.
D-353 now closes the checked-in psychosis-history result-content seam. Preserve all six current
patient-report identities, hidden subthreshold values, explicit closed negatives, and separation
from paranoia vocabulary, proposition truth, belief appraisal, other evidence sources, and MSE.
Never infer psychosis, diagnosis, generation frequency, treatment consequence, or points from this
package.
D-354 now closes the broad presenting-problem impact seam inside the existing MDD
initial-assessment foundation. Preserve the separate current-episode duration, broad
self-reported impact, and condition-attributed impairment owners. Never turn the broad report into
an impairment level, severity, diagnosis, treatment consequence, or points.
D-355 now closes the observed body-habitus result seam beneath the existing weight/BMI action.
Preserve its categorical physical-exam identity separately from numeric height, weight, and BMI,
and never infer either lane from the other.
D-356 now closes the detached generated-categorical-observation selection seam. Preserve its
complete profile horizon, exact definition/option/source/time/seed chain, stable draw, empty
interpretation, and synthetic-only proof.
D-357 now closes the D-356-to-D-310 collection seam. Preserve its distinct generated member kind,
exact upstream replay/source identity, and the explicit authored-only D-320 narrowing.
D-358 now closes the generated-observation recipe/resource/materialization seam. Preserve its
complete exact D-356 profile horizon, explicit D-324 resource requirements, D-325-only seed/context
authority, and D-326 delegation through D-356/D-310/D-320.
D-359 now proves the generic D-327-through-D-330 chain retains that same generated observation and
draw through the frozen patient without a new compiler path.
D-360 now proves that the checked-in reviewed
`duration-profile.mdd.current-episode@1.0.0` follows the same D-263/D-294/D-328/D-200/D-240/D-330
chain and one D-233 seed without copying or reinterpreting its content.
D-361 now proves that the checked-in reviewed
`condition-finding-profile.mdd.current-episode@1.3.0` follows D-197/D-200/D-330 with the exact
D-256/D-259/D-260 17-item history closure. Sparse-positive generation and open-world unselected
MSE alternatives remain distinct.
D-362 now proves those two checked-in branches coexist in one D-330 patient under one D-233 seed
without attaching the full presenting-problem result or inferring absent functional impact.
D-363 now adds the exact checked-in current/past mania/hypomania-history closure and result binding
without generating a bipolar episode or treatment conclusion.
D-364 now adds the exact checked-in current psychosis-history closure and result binding without
adjudicating proposition truth or inferring psychosis.
D-365 now adds the exact checked-in detailed suicide/self-harm assessment, reuses one
MDD-generated safety fact, and closes only the other eight assessment rows.
D-366 now replaces the synthetic primary decision inputs in that combined patient with the
checked-in MDD policy, exact focused regimen route, and D-339 passive-death-wish safety
requirement. The exact generated fact activates the native rule and binds the detailed safety
action while balance remains absent.
D-367 now adds the D-338 exact-class antidepressant-triggered mania-history prerequisite while
preserving five concrete trigger medications and the distinct information-only fulfillment
predicate point-free.
D-368 now carries those two rules through their exact existing balance owners and native
completed-attempt evaluation, proving fulfilled, omitted, and not-triggered outcomes plus the
database plan without a new scoring path.
D-369 now carries the existing depressive-syndrome action/result through its exact direct
requirement and balance, proving obtained versus omitted evaluation without symptom-count
diagnosis inference.
D-370 now adds the exact checked-in dominant primary-route balance and proves selected versus
unmatched route behavior beside the three workup modifiers.
D-371 now carries that exact four-balance decision through standard-mode settlement and proves
service-derived expenses, base-plus-care gross arithmetic, the nonnegative payout floor,
banked/lifetime updates, and no persistent debit on a zero-payout stress case.
D-372 now identifies those four missing generated/source owners through exact nonblocking
`uncovered_action` diagnostics without converting empty or unassessed state into a result.
D-373 now supplies the fixed, zero-complexity accurate patient-report profiles for medication
reconciliation, reaction history, and substance-use history. Their checked-in definitions and
generated-MDD proof preserve aligned empty versus explicitly unassessed state, retain
inaccurate/partial reporting behind D-201, and leave only presenting-problem functional impact
uncovered.
D-374 now gives an explicit diagnosis-enabled generated-MDD variant one exact optional
family-level MDD horizon, exact D-272 owner, and replayed player submission while keeping severity
internal and preserving the prior clinical fixtures' deterministic seeds. It also makes fixed
D-373 report selection losslessly JSON-safe by omitting the absent D-201 field.
D-375 now purchases all three fixed structured histories through native action/result/service
pricing, retains their exact decision presence and 75-point expense beside the diagnosis, and
replays the complete zero-care-point practice attempt.
D-376 now carries that exact attempt through the existing timestamp-separated authoring
persistence record and lossless JSON replay without activating browser persistence.
D-377 now binds the replay-valid attempt to its exact waiting patient through D-234's immutable
completion proof while deliberately stopping before queue mutation.
D-378 now applies that proof through D-234's completed-encounter transition, vacates the exact
coordinate, and retains the complete attempt in bounded location history while deliberately
stopping before a seed-dependent clinical refill.
D-379 now lets one reviewed condition-functional-impairment profile own complete categorical
generation mass and exact normalized probabilities while preserving D-267's neutral uniform
legacy mode. Weighted source kind, time scope, and care-setting applicability are exact. It checks
in no MDD profile or source-derived weight.

D-380 now checks in one reviewed D-198 broad current self-reported functional-impact profile with
exact NHANES-derived `1244:8756` absent/present mass, an explicit source-use decision, and an
accepted Developer-opinion transportability bridge. It closes the Presenting problem and timeline
assembly in the generated-MDD proof while retaining an empty condition-attributed impairment
lane. D-381 adds the read-only, hash-stable adjunct inventory command and observes 60 packets,
19 Developer reviews, and zero snapshot-bound mappings. D-382 adds an official NLM-refresh-gated
RxNorm identity intake, generated static index, and 70 new identity-only ingredient files for
125 total identities. These checkpoints add no new gameplay medication, formulary member,
clinical relationship, generation behavior, rule, balance, or point.

Focused D-380 integration, D-381 inventory, D-382 intake/index tests, strict typecheck, complete
content/source/cross-reference validation, format, lint, both bundle-isolated production builds,
the complete 1,354-test Vitest plus 10-test handoff suite, all six Player Playwright flows, and all
four portable mobile Reviewer Playwright flows pass locally. The final read-only adjunct refresh is
unchanged at 60 packets, 19 Developer-reviewed packets, one immutable bundle, zero snapshot-bound
mappings, and fingerprint
`628a37af01c30547bf24387a594e87c1d482737f9b70ea7abdf16d545acd6148`.
Adjunct packet review status still does not authorize clinical import; the D-380 profile is a
separate PsychSim source-use and Developer-opinion decision over independently verified public
data. Keep populations, settings, horizons, and measurement constructs separated.

The next real-generation work must return to the unresolved clinical dependency owners rather
than add another lifecycle or launcher wrapper. Recheck the adjunct's in-progress diagnosis and formulary
briefs at the next diagnosis/medication/formulary boundary. A packet can enter PsychSim only after
it has an immutable source-local unit or bundle, source-use review, and a separate current-snapshot
mapping. Until then, continue only with a smallest already-reviewed source-independent owner that
closes the real MDD vertical; do not invent a condition distribution, formulary membership,
impairment/severity boundary, source-report behavior, or clinical result value from preliminary
breadth. Any
later real instrument activation still requires a lawful reviewed definition, source-instance
owner, explicit score validation/interpretation, and a separate versioned attachment decision.
Any later launcher activation still requires a separate persistence/runtime/UI projection
decision after that detached authoring attachment.

D-288 permits only independently verified neutral identity capture from a preliminary breadth gap
signal. Keep clomipramine and pregabalin outside runtime medication definitions and all formularies
until exact source-local clinical units, source-use review, and psychiatrist interpretation
establish any later relationship. Continue to re-check the adjunct at each diagnosis, medication,
or formulary catalog boundary; do not infer clinical meaning from packet membership.

D-289 remains the exact D-208-to-D-267 attachment envelope. D-314 permits only its D-292-validated
records to enter `ResolvedPatientState` through D-312/D-200/D-194. D-315 permits only those final
records to enter D-240/D-213/D-214 through an exact future projection definition; keep raw D-289
outside patient state and result compilation, and keep severity mapping, persistence, and runtime
separate.

D-290 permits only the strict minimized view of D-289. D-315 independently reproduces its
target/profile/option/source-instance redaction at the D-240 player-safe boundary. Keep D-290
itself detached from information actions, result recipes, patient/runtime state, persistence,
severity, and scoring; do not reconstruct a hidden target from its record ID or source/time
values.

D-291 permits only independent source-instance identity and validation. Do not infer its horizon
from downstream records, check in real definitions without their owning template/action design,
or treat a valid source reference as credibility, accuracy, independence, action access, or
clinical evidence.

D-292 permits only the exact D-289-to-D-291 source proof and derived D-290 view. D-314 may copy its
exact validated impairment records into patient state, and D-315 may project only those final
records through a separate exact D-240 definition. Keep D-290 detached from information
actions/results, severity, persistence, and runtime. A valid source still says nothing about
whether its claim is true or clinically important.

D-293 permits only the exact D-283-to-D-291 respondent-source proof and derived D-284 view. Keep it
separate from rights decisions, score calculation or interpretation, patient/action-result
attachment, persistence, and runtime; a valid source reference still says nothing about report
accuracy or clinical meaning. D-296 is the separate versioned decision that permits D-285/D-286
to consume D-293 without broadening those semantics.

D-296 permits only D-293-backed D-285/D-286 admission. Preserve the existing snapshot, patient,
action, D-220, and safe-response checks; reject raw D-283. Do not infer credibility, accuracy,
independence, rights, score meaning, result attachment, persistence, or runtime authority.

D-297 permits only D-269's exact same-patient D-291 source check over its standalone D-267 input.
Preserve the detached descriptor and D-292's separate post-D-208 collection role; reject a
raw-D-267-only request. Do not infer source credibility, clinical correctness, enabled severity,
patient/result attachment, persistence, or runtime authority.

D-298 `2.0.0` permits only the exact D-240-to-D-291 source proof for values D-240 actually
projects. Preserve the action/record/frozen-value bindings, including impairment's hidden exact
source instance, and carry only the already-redacted reveals forward. Do not infer source
credibility or action availability, and do not attach the validation wrapper to
D-194/D-213/D-214, `PatientInstance`, persistence, or runtime without a separate versioned
decision.

D-299 permits only the exact D-215-to-D-291 source proof for selected structured report profiles.
Preserve profile/definition/projection/source bindings and detached D-212 recipes; do not infer
source reliability or report correctness, and do not attach the wrapper to D-194/D-213/D-214,
`PatientInstance`, persistence, or runtime without a separate versioned decision.

D-300 permits only definition-stable D-291 source-role IDs with patient ownership retained by the
exact horizon. Preserve patient-horizon checks and exact definition/version/kind identity; never
validate by opaque ID alone or treat matching role IDs in different patient horizons as shared
patient evidence.

D-301/D-304/D-314 permit only the standalone patient-state/D-291 source audit. Preserve every
record-authored source kind and exact definition reference behind each binding. Never infer a kind
from labels or IDs, and do not treat this artifact as D-200/D-194/D-235, patient/result,
persistence, or runtime integration.

D-302 permits only the standalone D-193/D-291 audit for direct D-258 finding-report selections.
Preserve the exact slot, selected base-or-modifier projection, source/time/claim/dependency
coordinates, optional D-201 trace, and resolved definition reference. Do not infer credibility,
report correctness, or clinical meaning, and do not treat the wrapper as D-200/D-194/D-235,
patient/result, persistence, or runtime integration.

D-303 permits only the neutral runtime-excluded source-role definition catalog and its exact
registry/content validation. A role definition says only identity and kind. Do not infer that a
source exists for a patient, is available through an action, is reliable or independent, or has
clinical or scoring meaning; do not import the catalog into Player/Reviewer runtime without a
separate activation decision.

D-304 permits only typed source ownership on the three formerly ID-only patient-state lanes and
D-301 `2.0.0` exact-kind validation. Recompile old authoring-only artifacts; do not infer source
kind from labels or definition IDs or treat this as runtime/persistence migration authority.

D-305 permits only the authoring-only exact-catalog-to-D-291 adapter. Preserve the catalog
fingerprint and complete nested D-291 proof; do not use it to infer source availability,
reliability, action access, report behavior, clinical meaning, or runtime authority.

D-306 permits only standalone numeric-panel result compilation from an exact test profile and
D-305 patient source horizon. Preserve exact test/profile/interval/source/request/output replay,
reject patient-owned and case-defining tests, and keep the result detached from patient state,
actions, D-194/D-213/D-214, D-200/D-235, persistence, runtime, clinical correctness, and points.

D-307 permits only one exact authored patient-owned result profile and its standalone
contract/source compiler. Preserve exact profile review/provenance and full replay, keep generated
numeric tests on D-306, and do not treat synthetic fixtures as content or infer template
ownership, selection, patient/action attachment, clinical correctness, probability, or points.

D-308 permits only one exact authored patient-owned measurement-value profile and its standalone
definition/source compiler. Preserve definition-owned units, allowed context, `not_interpreted`,
exact review/provenance, and replay. Never treat synthetic fixtures as content or infer a
population range, generation distribution, BMI relationship, body habitus, clinical tag, template
ownership, patient/action attachment, clinical correctness, or points.

D-309 permits only one exact authored patient-owned categorical-observation value profile and its
standalone definition/source compiler. Preserve exact allowed value identity, empty
interpretation, review/provenance, and replay. Never treat synthetic fixtures as content or infer
real MSE/physical definitions, diagnostic meaning, generation, template ownership, patient/action
attachment, clinical correctness, or points.

D-310 permits only one exact detached collection over replay-valid D-306 through D-309 artifacts.
Preserve its same-patient D-305 horizon, every upstream artifact and record, canonical order, and
duplicate-record rejection. Never select, generate, merge, interpret, or attach another value or
infer template, action, persistence, runtime, clinical, complexity, rule, balance, or point
authority.

D-311 `3.0.0` permits only the exact D-208-to-D-320 empty-result-lane attachment. Derive D-310 and
optional replay-valid D-317 BMI only from that exact recipe artifact. Preserve every upstream
artifact, both template fingerprint checks, same-patient equality, explicit D-320/D-317
references, the changed state fingerprint, and the D-310 base-state source scope. Never accept a
raw caller-owned collection, merge caller-authored result arrays, insert a derived record into
D-310, reinterpret a value, or treat the changed state as D-194/D-213/D-214, D-200/D-235,
`PatientInstance`, persistence, runtime, rule, balance, point, or UI authority.

D-312 `2.0.0` permits only the exact common-root composition of nonoverlapping D-294 duration,
D-292 source-validated functional-impairment, and D-311 clinical-result lanes. Preserve the
complete successful D-208 root, every upstream artifact, empty base-lane enforcement, exact record
identity, changed state fingerprint, and replay. Never use it as an arbitrary state merge, accept
raw D-289, reinterpret a value, or infer template, action, persistence, runtime, rule, balance,
point, or UI authority.

D-313 historically permitted only D-200 `25.0.0`'s nullable replay-valid D-312 seam. Preserve the exact
D-223/D-208 root, derive the final pre-finding state only from that verified assembly or the
unchanged D-208 root, carry every nested D-294 duration seed into the existing D-233 equality
check, retain D-210's original D-208 applicability scope, and freeze the complete D-312 payload
for replay. Never accept direct D-294 input or use that historical integration to select
D-310/D-311 content or accept raw D-289 impairment. D-314 is the sole later widening to a
source-validated impairment lane; neither decision authorizes persistence, runtime, templates,
complexity, clinical rules, balances, points, UI, or real content.

D-314 permits only the exact D-292-to-D-312-to-D-200 functional-impairment patient-state path.
Preserve exact D-208 roots, D-267/D-291/D-289/D-292 replay, nested D-267 seed equality, the
canonical source-bearing state lane, unchanged D-194 routing, and null-route empty-lane
enforcement. Never infer a real profile, probability, display result, severity, treatment,
complexity, clinical rule, balance, point, persistence, runtime, or UI authority.

D-315 permits only the D-240/D-298 `2.0.0` target-scoped impairment projection and source-proof
extension plus proof that the existing generic D-213/D-214 route can carry its safe reveal.
Preserve the full authoring audit separately from the strict player-safe value and never expose
the condition target, profile, option, source instance, or generation audit. Do not check in a real
definition or infer a profile, action, wording, diagnosis meaning, severity, treatment, clinical
rule, balance, point, persistence, runtime, or UI authority.

D-316 permits only the exact runtime-excluded metric height/weight/BMI relationship and detached
authoring compiler over explicitly selected replay-valid D-310 records. Preserve both complete
inputs, exact definition/collection fingerprints, positive finite values, deterministic formula,
definition-owned display precision, and `not_interpreted` output. Never select a most-recent
record, fabricate source/time/resolution ownership, attach the value to patient/actions/runtime,
or infer a range, abnormality, body habitus, clinical tag, rule, balance, point, or medical
approval.

D-317 permits only explicit derived-measurement provenance plus one detached D-316 BMI
materialization. Preserve the exact derivation definition, artifact payload identity, ordered
input record IDs, selected weight time scope, and `not_interpreted` result. Never fabricate a
patient-scene source, let D-301 silently accept it, add it directly to D-310, select a record, or
infer ranges, body habitus, clinical meaning, rules, balances, points, persistence, runtime, or UI.

D-318 permits only the D-311 `2.0.0` noncyclic attachment of replay-valid D-317 BMI beside its
exact D-310 input collection and the existing D-312 lane carry-through. Preserve full nested
D-316/D-317 replay, canonical materialization references, duplicate/collision/capacity rejection,
and the unchanged direct collection. Never infer an action result, range, abnormality, body
habitus, clinical meaning, rule, balance, point, complexity, persistence, runtime, or UI.

The required post-D-319 adjunct re-check is complete and recorded below. D-320 permits only a
separate exact-template recipe over already compiled D-310/D-317 artifacts. D-321 permits only
D-311 `3.0.0`'s replay-valid D-208-plus-D-320 attachment and rejects the raw collection bypass.
D-322 permits only finite exact-template recipe coverage, and D-323 permits only D-320 `2.0.0`'s
exact resolution from that replay-valid horizon while rejecting a raw recipe.
Preserve both template fingerprint schemes, complete one-to-one ownership, nested replay, exact
D-322/D-320/D-310/D-317 references, and the unchanged empty-lane attachment semantics. Never
infer real recipe content, values, distributions, interpretation, action availability,
complexity, clinical rules, balances, points, persistence, runtime, or UI.

D-294 permits only the exact D-264-to-D-291 source proof over newly attached duration records.
Preserve the base patient as source scope and the changed composed-state reference separately. Do
not infer thresholds or source behavior, or add information results, persistence, or runtime.

D-295 is the separate versioned integration decision anticipated by D-294. D-200 may derive and
route the duration-bearing state only from a replay-valid D-294 wrapper; it must never accept raw
D-264 or reconstruct a D-291 horizon from duration records. This does not authorize any further
patient/result/runtime widening.

1. Treat remaining adjunct MDD severity, TSH, antidepressant-fit, and regimen-combination packets
   as preliminary. They may expose missing typed owners or review questions, but cannot supply real
   generation probabilities, qualitative rules, balances, or points.
2. D-256 through D-260 now supply one sparse-positive, exact 17-finding compact depressive-symptom
   result path. Preserve its hidden/display split, exact projection set, and static D-213 recipe;
   do not add per-manifestation D-198 absence baselines, infer open-world negatives, or duplicate
   scoring merely because focused Sleep or Suicide/self-harm actions can later reveal overlapping
   atomic facts.
3. D-257/D-258 resolve source-report routing: accurate reporting is the zero-cost base, while an
   inaccurate/partial report is an individual D-201 `source_report` complexity module. The exact
   one-charge selection can govern D-215 structured views and D-193 canonical-finding report
   projections without changing truth; D-200 `24.0.0` retains complete union coverage. No real
   inaccurate-report profile or module cost/frequency is approved yet.
4. D-261–D-266 make every duration semantic owner exact-versioned, supply one checked-in
   runtime-excluded current-MDD profile and exact D-240 Presenting-problem route, resolve one
   option through a pure replayable artifact, and attach genuine resolutions to a verified D-208
   state without another draw or complexity charge. D-200 `24.0.0` now accepts only the optional
   exact D-294 source-validation wrapper, preserves the D-208-only compatibility path, derives its
   verified D-264 state, and routes only that state through D-194/D-240. Do not add a
   profile-selection plan, weights, prevalence, probability,
   severity, impairment, persistent-depression exclusion, treatment history, points, a
   PatientTemplate, runtime activation, or UI merely because this structural route now exists.
5. D-265 makes race/ethnicity a sourced, self-identified, multiselect authoring identity only.
   Preserve every eligible diagnosis at positive generation mass; never infer identity from
   names; do not add a prevalence table, report modifier, pharmacology modifier, or point rule
   without a separate population-matched source and clinical review. Keep social classification
   distinct from ancestry, genetics, and metabolizer phenotype.
6. D-267 supplies only the standalone condition-functional-impairment profile/resolver contract,
   D-289 binds its exact outputs to one completed D-208 state without replacing that state, D-290
   emits only a target/source-instance-redacted exact projection, D-314 admits only
   D-292-validated records to final patient state, and D-315 lets an exact future D-240 definition
   project the same strict safe value through D-213/D-214. Preserve impairment's separation from
   subjective burden and coarse functional-impact findings. Do not check in a real MDD impairment
   profile or action definition, infer severity, or add probabilities/points until the pending
   clinical packet and exact downstream content are reviewed.
7. D-268 permits only the qualitative higher-of relationship. Keep every MDD severity level
   disabled until exact symptom-severity and impairment boundaries are reviewed. Do not expose
   severity as a player qualifier or infer psychotic features from it.
8. D-269/D-297 may combine only one exact external symptom-severity envelope and one replay-valid
   D-267 artifact for the same episode after a replay-valid same-patient D-291 horizon proves the
   impairment source instance and kind. Its output remains `derived_descriptor_only`; do not
   treat the envelope as an authenticated upstream derivation, promote source validity into
   credibility, map the descriptor to `severityId`, or attach it to patient state before the
   exact source-controlled owners and enabled level mapping exist.
9. D-270 natively owns only service-backed intervention/disposition operating charges. Preserve
   exact treatment/service/method replay and never infer a medication, regimen, or service-free
   treatment price. D-271 owns the remaining settlement scalars only through an exact
   template-economy policy, current ClinicState, matching D-227 projection, and versioned
   satisfaction curve. Do not author a real economy policy before its real PatientTemplate exists
   or derive balance from diagnosis, severity, setting, or optional complexity.
10. D-272 owns only minimized exact player diagnosis-qualifier validation. Keep MDD severity
    backend-only, permit only explicitly reviewed player-selectable specifiers, and do not infer
    qualifiers, diagnosis ancestry, diagnosis points, or clinical meaning from labels or file
    order.
11. D-273 owns only standalone launcher presentation resolution. Preserve independent
    name/complaint substreams, the fixed one-quarter middle-initial policy, and the
    seed/diagnosis/rule/point-free minimized output. Do not check in a real complaint profile,
    attach it to PatientInstance/D-200/D-235 or a waiting slot, or migrate persistence/runtime/UI
    until a real PatientTemplate and complete presentation content exist.
12. D-274 owns only the transitional local compatibility-case Patient Maker. Preserve its finite
    completely validated approved/review allowlist, exact authored complexity-budget filtering,
    ordinary deterministic CaseInstance/eligibility path, and persisted reserved Developer slot.
    Do not describe its budget control as optional-module generation, expose the allowlist to
    Player or portable Reviewer builds, or reuse it as the future PatientTemplate maker.
13. D-275 owns only the versioned scalable complexity accounting contract. Preserve v1 replay,
    v2's separately authored required baseline and optional maximum, stable per-module attribution,
    and exact downstream audit. Do not infer points, probabilities, difficulty, eligibility,
    reimbursement, or clinical importance from either complexity number, and do not activate real
    v2 modules or the generalized Patient Maker merely because the structural ceiling is wider.
14. D-276 owns only the status-versus-qualified-value compatibility semantic envelope and the
    finite adherence projections that use it. Preserve historical save parsing, keep typed patient
    state authoritative, and never infer truth, rules, points, or complexity from interpretation,
    wording, or future display color.
15. D-277 owns only the exact current-regimen/prior-trial subject reference and its finite
    medication-history projections. Preserve historical parsing and exact existence validation;
    never infer subject ownership from labels, IDs embedded in other strings, order, or prose, and
    never treat the reference alone as benefit, harm, causality, adequacy, or a point rule.
16. D-278 owns only sparse patient-reported benefit for an exact current regimen entry. Preserve
    explicit none versus assessed-unknown and absent-record semantics; never conflate benefit with
    adherence, tolerability, causality, trial adequacy, or a treatment rule.
17. D-279 owns only exact medication-tolerability state and its finite compatibility projection.
    Preserve unknown/absent/present, exact regimen-or-trial attribution, and present-only
    manifestations; never infer causality, temporal order, an incidence probability, or points.
18. D-280 owns only one exact medication-change temporal relationship. Preserve exact regimen,
    source, both time scopes, target identity, and before/after/uncertain order; never infer dose,
    causality, diagnosis, treatment correctness, probabilities, or points.
19. D-281 owns only one exact current-medication dose position. Preserve below/at/assessed-unknown,
    exact regimen, source, time, and absent-record semantics; never infer a medication maximum,
    dose, schedule, adequacy, treatment correctness, probability, rule, or point.
20. D-282 owns only one exact authored instrument administration and its optional bounded raw
    total. Preserve complete/partial state, zero-response partial attempts, exact source/action/
    respondent/time/rights coordinates, and exact included/missing item partition. Never calculate
    option weights or totals, infer missing values, interpret or validate the score, imply rights
    permission, attach it to runtime, spend complexity, or assign rules/points.
21. D-283 owns only the standalone authoring compilation/replay proof over D-282 and the exact
    patient-bound D-220 artifact. Preserve derived patient/administration identity, exact
    response-versus-missing evaluation semantics, structural-gap rejection, fingerprints, and
    replay. Never treat a non-response structural error as patient nonresponse, establish source
    or rights authorization, attach to runtime, calculate or interpret a total, spend complexity,
    or assign rules/points.
22. D-284 owns only the strict presentation-safe projection of one verified D-283 artifact.
    Preserve hidden patient/administration identity, exact action/instrument/definition
    coordinates, completion/count semantics, authored raw-total state, full authoring-field
    redaction, and exact reprojection. Never attach it to patient/runtime state, calculate or
    interpret a score, establish source or rights authorization, spend complexity, or assign
    rules/points.
23. D-285 owns only the frozen-context administration admission proof. Preserve exact patient and
    action matching, exact safe included-response equality, D-293 validation and its D-284
    projection, complete/partial/zero-response semantics, and deterministic replay. Never accept
    raw D-283 or treat the context as a
    `PatientInstance`, establish source or rights authorization, mutate D-194/D-213/D-214, add a
    result binding, calculate or interpret a score, spend complexity, or assign rules/points.
24. D-286 owns only the exact D-194-to-D-285 adapter and replay wrapper. Preserve full snapshot
    integrity, exact D-293-embedded-D-220 equality, snapshot-derived context, and unchanged source
    snapshot. Never accept raw D-283 or a replacement context, mutate
    `PatientInstance`/D-194/D-213/D-214, add a result binding, establish source credibility or
    rights authorization, calculate or interpret a score, spend complexity, or assign
    rules/points.
25. D-287 owns only the exact D-194-to-D-273 adapter and replay wrapper. Preserve full snapshot
    integrity, snapshot-derived patient identity and seed, D-273 normalization, and unchanged
    source snapshot. Never accept replacement identity/seed authority, add real presentation
    content, mutate `PatientInstance`/D-200/D-235, create a waiting patient, or let cosmetic text
    drive diagnosis, findings, rules, points, probability, or eligibility.
26. D-288 permits only independently source-verified, unambiguous neutral identity bins from a
    preliminary breadth gap signal. Never let packet inclusion create an indication, diagnosis
    relationship, treatment route, formulary membership, clinical rule, probability, balance, or
    point.
27. D-289 owns only the exact D-208-to-D-267 attachment and replay envelope. Preserve complete
    upstream integrity, exact patient/condition matching, unique condition/profile assignments,
    and the unchanged D-208 state. Never treat its separately attached records as
    `ResolvedPatientState`, an information result, severity, complexity, rule, balance, point,
    persistence, or runtime content.
28. D-290 owns only strict minimization and exact reprojection of D-289. Preserve the
    patient-state coordinate, record identity, level, source kind, and time scope while keeping
    every diagnosis/condition target, profile/option identity, source instance, and generation
    audit redacted. Never attach the projection to actions, results, patient/runtime state,
    persistence, severity, rules, balance, or points.
29. D-291 owns only deterministic source-role instantiation and exact patient/existence/kind
    validation. Preserve opaque IDs and the independently authored definition horizon; never
    construct that horizon from the records being checked or infer credibility, accuracy,
    independence, source behavior, action access, clinical meaning, probability, complexity,
    rules, balance, points, persistence, or runtime behavior.
30. D-292 owns only the same-patient D-289/D-291 validation wrapper and its derived D-290
    projection. Preserve exact upstream replay and source bindings; never treat source validity as
    truth, reliability, clinical correctness, or permission to add patient/result/runtime state,
    severity, rules, balance, or points.
31. D-293 owns only the same-patient D-283/D-291 respondent validation wrapper and its derived
    D-284 projection. Preserve exact upstream replay, respondent existence/kind equality, and
    complete/partial/authored-total semantics; never treat it as D-285/D-286 admission, rights,
    reliability, score interpretation, or permission to add patient/result/runtime state,
    complexity, rules, balance, or points.
32. D-294 owns only the base-patient D-264/D-291 duration-source validation wrapper and separately
    retained composed-state reference. Preserve exact upstream replay and source existence/kind;
    never treat the changed state ID as original source scope or infer a D-240 projection,
    threshold, interpretation, source behavior, probability, complexity, rules, balance, points,
    persistence, or runtime behavior.
33. D-295 owns only D-200's exact nullable D-294 integration. Preserve the null D-208-only path,
    derive D-264 solely from the replay-valid wrapper, and retain the full source-validation
    audit. Never re-admit raw D-264, infer source credibility or duration meaning, or treat this as
    permission for patient/result/runtime attachment.
34. D-296 owns only D-285/D-286's exact D-293 integration. Preserve the complete respondent-source,
    D-220, frozen-context, and catalog-snapshot proofs; never re-admit raw D-283 or infer
    credibility, rights, score meaning, or runtime authority.
35. D-297 owns only D-269's direct D-291 validation of one standalone D-267 impairment source.
    Preserve exact patient/existence/kind proof, the detached descriptor, and D-292's separate
    post-D-208 collection role; never re-admit a raw-D-267-only request or infer credibility,
    clinical correctness, enabled severity, patient/result attachment, persistence, or runtime.
36. D-298 owns only standalone D-240/D-291 source validation for values D-240 actually projects.
    Preserve exact action/record/frozen-value bindings and the existing target-redacted reveals;
    never infer credibility, action access, or clinical meaning, and do not treat the wrapper as
    D-194/D-213/D-214, patient, persistence, or runtime integration.
37. D-299 owns only standalone D-215/D-291 source validation for selected structured report
    profiles. Preserve exact profile/definition/projection/source bindings and detached D-212
    recipes; never infer reliability or report correctness, and do not treat the wrapper as
    D-194/D-213/D-214, patient, persistence, or runtime integration.
38. D-300 owns only D-291's definition-stable source-role identity. Preserve exact
    patient-horizon validation and definition/version/kind audit; never validate by role ID alone
    or treat the same role ID in different patient horizons as shared patient evidence.
39. D-301/D-304 own only standalone D-208/D-291 composed-state source validation. Preserve each
    record-authored source kind and every source-role definition reference; never infer kind from
    labels or definition IDs or treat the wrapper as D-200/D-194/D-235, persistence, or runtime
    integration.
40. D-302 owns only standalone D-193/D-291 source validation for direct D-258 finding-report
    selections. Preserve exact slot/projection/source/time/claim/dependency and optional D-201
    trace; never infer credibility or report correctness or treat the wrapper as
    D-200/D-194/D-235, persistence, or runtime integration.
41. D-303 owns only the runtime-excluded neutral source-role definition catalog. Preserve exact
    registry membership and stable definition/kind identity; never infer person identity,
    availability, reliability, action access, clinical meaning, or runtime authority.
42. D-305 owns only the authoring-only exact-catalog-to-D-291 adapter. Preserve catalog identity,
    payload fingerprint, nested D-291 replay, and patient ownership; never infer source
    availability, reliability, action access, clinical meaning, or runtime authority.
43. D-306 owns only standalone generated-numeric test materialization. Preserve exact
    test/profile/interval/source/request/output replay, reject patient-owned and case-defining
    tests, and keep the result detached from patient/action/runtime state, clinical correctness,
    probability changes, and points.
44. D-307 owns only an exact authored patient-owned result profile and standalone
    contract/source compiler. Preserve exact review/provenance and replay; never treat synthetic
    fixtures as content or infer template ownership, selection, patient/action attachment,
    clinical correctness, probability, or points.
45. D-308 owns only an exact authored patient-owned measurement-value profile and standalone
    definition/source compiler. Preserve definition-owned units, allowed context,
    `not_interpreted`, exact review/provenance, and replay; never treat synthetic fixtures as
    content or infer ranges, generation, BMI relationships, body habitus, template ownership,
    patient/action attachment, clinical correctness, or points.
46. D-309 owns only an exact authored patient-owned categorical-observation value profile and
    standalone definition/source compiler. Preserve exact allowed value identity, empty
    interpretation, review/provenance, and replay; never treat synthetic fixtures as content or
    infer real MSE/physical definitions, diagnostic meaning, generation, template ownership,
    patient/action attachment, clinical correctness, or points.
47. D-310 owns only the exact detached same-patient collection over replay-valid D-306 through
    D-309 artifacts under one D-305 horizon. Preserve every upstream artifact and resolved record,
    canonical order, and duplicate-record rejection; never select, generate, merge, interpret, or
    attach another value or infer template, action, persistence, runtime, clinical, or point
    authority.
48. D-311 `3.0.0` owns only the exact D-208-to-D-320 empty-lane attachment and changed authoring
    state. Derive D-310 and optional D-317 BMI only from D-320. Preserve complete upstream replay,
    both template checks, same-patient equality, empty result-lane enforcement, explicit
    D-320/D-317 references, and the original D-310 base-state source scope; never accept a raw
    collection, merge caller-authored results, recursively modify D-310, reinterpret a value, or
    treat the output as D-194/D-213/D-214, D-200/D-235,
    `PatientInstance`, persistence, runtime, rule, balance, point, or UI authority.
49. D-312 `2.0.0` owns only one exact assembly over nullable D-294 duration, D-292
    source-validated impairment, and D-311 result branches that retain the same successful
    empty-lane D-208 root. Preserve every complete input, exact nonoverlapping lane, source scope,
    changed state identity, and replay; never use it as a general merge, accept raw D-289, or infer
    persistence, runtime, clinical, balance, point, or UI authority.
50. D-313 owns only D-200 `25.0.0`'s nullable replay-valid D-312 integration. Preserve exact
    D-223/D-208 roots, nested duration-seed audit, original D-210 applicability scope, unchanged
    D-194 routing, complete D-312 replay, and rejection of direct D-294 input; never infer
    impairment, template, persistence, runtime, clinical, balance, point, or UI authority.
51. D-314 owns only the source-validated functional-impairment patient-state path through
    D-312 `2.0.0`, D-200 `26.0.0`, and D-194. Preserve exact target/version/source identity,
    global record uniqueness, nested D-267 seed audit, and null-route empty-lane rejection; never
    infer a real profile, action result, severity, treatment, persistence, runtime, clinical,
    balance, point, or UI authority.
52. D-315 owns only D-240/D-298 `2.0.0`'s target-scoped impairment projection/source proof and the
    synthetic D-213/D-214 routing proof. Preserve exact final-state record matching, hidden-source
    validation, and strict target/profile/option/source-instance redaction; never infer real
    content, action availability, wording, severity, treatment, persistence, runtime, clinical,
    balance, point, or UI authority.
53. D-316 owns only the exact metric BMI relationship and detached authoring compiler over
    explicit replay-valid D-310 inputs. Preserve complete input and formula audit and keep the
    derived value source/time/resolution-free and uninterpreted; never attach it, select among
    records, or infer clinical meaning, rules, balance, points, persistence, runtime, or UI.
54. D-317 owns only explicit derived-measurement provenance and detached D-316 BMI
    materialization. Preserve exact artifact/input identity and the selected weight time scope;
    never fabricate patient-scene evidence, let D-301/D-310 absorb it directly, or infer
    clinical meaning, rules, balance, points, persistence, runtime, or UI.
55. D-318 owns only the noncyclic D-311 attachment of replay-valid D-317 BMI beside its exact
    D-310 inputs. Preserve nested derivation replay, canonical references, collision rejection,
    and D-312's existing lane carry-through; never infer an action result, range, interpretation,
    body habitus, clinical meaning, rules, balance, points, complexity, persistence, runtime, or UI.
56. D-319 owns only synthetic proof that D-318 BMI reuses the unchanged D-213/D-214
    direct-measurement route. Preserve exact definition/action validation and ID-only bindings;
    never treat the proof as a real profile, production action mapping, range, interpretation,
    clinical rule, point, persistence, runtime, or UI decision.
57. D-320 owns only the separate exact-template clinical-result recipe and its complete
    D-310/D-317 binding audit. Preserve typed profile/source/time/input ownership and one-to-one
    coverage; never treat it as patient value generation, clinical meaning, action availability,
    complexity, points, persistence, runtime, or UI.
58. D-321 owns only D-311 `3.0.0`'s exact D-208-plus-D-320 integration. Preserve both template
    fingerprint checks, derive all result inputs from D-320, retain its exact reference, and reject
    the legacy raw collection request; never infer real recipe content or runtime authority.
59. D-322 owns only the finite exact mode-template recipe-coverage horizon. Preserve one coverage
    member per exact template, exact ID/version/fingerprint resolution, missing-coverage
    diagnostics, lifecycle/source-boundary metadata, and complete replay; never infer a default
    recipe, medical approval, runtime eligibility, values, formulary behavior, rules, points,
    persistence, runtime, or UI.
60. D-323 owns only D-320 `2.0.0`'s mandatory D-322 resolution. Preserve exact horizon replay,
    template ID/version/fingerprint matching, missing-coverage failure, retained horizon
    fingerprints, and the unchanged result-binding semantics; never accept a raw recipe or infer
    content, review promotion, clinical meaning, formulary behavior, points, persistence, runtime,
    or UI.
61. D-324 owns only the finite exact recipe-resource coverage audit. Preserve D-322 replay,
    one-current-version resource bins, exact per-member resolved/missing requirements, separate
    missing-recipe diagnostics, and full replay; never use resource presence as proof of
    relationship validity, clinical correctness, generation, interpretation, formulary,
    complexity, rules, points, persistence, runtime, or UI.
62. D-325 owns only the exact patient result-materialization context. Preserve D-233 seed
    authority, D-208 composition, D-324 coverage, exact template/seed equality, state-derived
    numeric context, catalog-derived same-patient source instances, and replay; never accept raw
    caller context or use the artifact to generate values, spend complexity, reroll a patient,
    infer clinical meaning, create formulary/rule/point behavior, persist, activate runtime, or
    alter UI.
63. D-326 owns only the exact D-325-to-D-320 result-materialization orchestration. Preserve the
    frozen context, invoke existing direct/collection/derivation/recipe compilers without
    reimplementing their semantics, retain complete replay, and reject raw caller seeds,
    resources, contexts, or values; never attach D-311, spend complexity, infer clinical meaning,
    create formulary/rule/point behavior, persist, activate runtime, or alter UI.
64. D-327 owns only D-326-derived D-311 attachment. Preserve exact D-326 replay, derive D-208 and
    D-320 only from it, delegate unchanged D-311 checks, and retain both complete chains; never
    accept caller-selected patient/result inputs, assemble D-312, spend complexity, infer clinical
    meaning, persist, activate runtime, or alter UI.
65. D-328 owns only the canonical result-enabled D-312 orchestration. Preserve exact D-327 replay,
    optional independent D-294/D-292 inputs, D-312 common-root/lane authority, and the single
    combined state; never generate branches, spend complexity again, create a parallel state
    model, infer clinical meaning, persist, activate runtime, or alter UI.
66. D-329 owns only the exact result-enabled D-200 entrance. Preserve D-328 replay, exact
    D-233/D-208 equality, and retained D-328-plus-derived-D-312 fingerprints; preserve null and
    result-free D-312 compatibility paths, but never accept, reconstruct, or retain a
    result-enabled raw D-312 without D-328. Do not add generation, complexity, clinical meaning,
    persistence, runtime, or UI.
67. D-330 owns only the result-free-scaffold-plus-D-324 authoring orchestration through
    D-325/D-326/D-327/D-328 and the final D-200 compile. Preserve the exact request, existing
    result-free duration/impairment branches, D-328/final-audit artifacts, fingerprints, and
    replay. Never precompile an intentionally incomplete scaffold, accept a prebuilt result chain,
    replace seed/template/context, charge complexity again, persist, activate runtime, or alter UI.
68. D-331 owns only D-233 atomic-fill integration with D-330. Preserve the direct result-free path,
    exact replay-valid D-324 validation, internally derived D-330, final-audit-only waiting-slot
    fill, one ordinal per success or valid content blocker, unrelated-slot immutability, and
    complete replay. Never accept prebuilt result authority, retain partial D-330 state, retry
    internally, persist/refill runtime queues, or add content, points, or UI.
69. Keep the antidepressant-mania prerequisite unbalanced until an exact reviewed native
    antidepressant class or focused class mapping exists. Keep the passive-death-wish safety rule
    unbalanced until its exact positive and relevant negative patient facts can be represented;
    never translate either compatibility tag directly into scoring.
70. Real ED, inpatient-psychiatry, and consultation-liaison runtime locations, real PatientTemplate
    activation and economy-policy content, generated SaveData and compatibility migration,
    generalized PatientTemplate Patient Maker, qualifier UI, and other generated-patient UI remain
    deliberately unactivated until one realistic source-controlled vertical is ready.
71. D-332 owns only real runtime-excluded launcher presentation content. Preserve its exact
    registry, accepted cosmetic Developer opinion, medically unreviewed complaint banks, existing
    independent name-pool references, literal one-quarter middle-initial policy, concise reusable
    variants, and equal-priority/equal-weight variety semantics. Never treat complaint selection as
    diagnosis probability or attach the catalog to D-200/D-233, persistence, runtime, scoring,
    formulary behavior, or UI without a later exact boundary.
72. D-333 owns only the detached exact successful-D-331-fill-to-D-287 presentation attachment.
    Preserve full D-331/D-287 integrity, final-snapshot-derived patient/seed authority, exact
    waiting-slot and patient references, minimized fingerprinted presentation, caller-authority
    rejection, and deterministic replay. Never modify the waiting slot, add a parallel patient
    identity, persist or render this projection, or infer clinical meaning, diagnosis probability,
    rules, points, or formulary behavior.
73. D-334 owns only the runtime-excluded real result mapping for
    `info.physical.weight-bmi`. Preserve exact canonical height/weight/BMI definition payloads,
    the exact shared information-action fingerprint, the existing measurement route, and
    uninterpreted result semantics. Never fabricate measurement values, infer body habitus or
    abnormality, select a profile/template, spend complexity, or add tags, rules, points,
    persistence, runtime activation, or UI.
74. D-335 owns only the detached deterministic generated-measurement profile/compiler. Preserve
    exact definition/context/profile/band/source/draw provenance, stable priority/tie-breaking,
    order normalization, `not_interpreted` output, and replay. Treat relative band weights only as
    within-profile distribution inputs. Never invent real distributions, reinterpret a support
    band as a clinical range, infer body habitus/tags/diagnoses, widen D-310/D-320, spend
    complexity, or add rules, points, persistence, runtime, or UI without later exact decisions.
75. D-336 advances only D-310 to retain a closed D-308/D-335 measurement-compilation union.
    Dispatch exact upstream replay and preserve `measurement` versus `generated_measurement`
    member identity plus the common resolved value. Never relabel D-335 output as authored or let
    the existing D-320 authored-measurement member infer a generated profile owner.
76. D-337 advances D-320/D-324/D-326 only. Preserve the complete exact D-335 profile horizon,
    D-325-only seed/context authority, exact source/time scope, and generated ownership through
    D-310 and optional BMI derivation. Never match only the selected profile, bind generated
    output through the authored member, or infer a real distribution, range, body habitus, rule,
    point, persistence, runtime, or UI from this structural integration.
77. D-338 permits a native diagnosis prerequisite to pin one exact reviewed medication class and
    expand its complete approved membership horizon to concrete starts. Preserve exact version
    checks, lossless cardinality, the separate legacy compatibility predicate/rule, and the
    independently versioned three-outcome balance. Never infer membership from tags, labels, or
    prose; never allow the native class predicate into compatibility scoring; and never derive
    point magnitude from evidence or class membership.
78. D-339 permits one native diagnosis rule to refine the exact primary-route patient scope with
    one version-pinned canonical-finding outcome. Preserve strict finding lifecycle/version/value
    validation, the legacy compatibility tag as audit-only input, typed D-191 fact output, and the
    separately versioned direct-information balance. Never infer the fact from a tag, widen the
    supplement into a general expression language, let action availability satisfy purchase, or
    derive risk, disposition, or point magnitude from the finding identity.
79. D-340 adds neutral identity only for four detailed-safety facts. Keep broad means access
    distinct from weapon access and keep recent-attempt identity distinct from exact event timing.
    Never infer probability, recency thresholds, risk, disposition, treatment, or points from
    these shells.
80. D-341 owns one finite nine-fact detailed-safety projection horizon and exact universal result
    assembly. Preserve each fact's independent trace and the distinction between resolved positive
    candidates and closed-horizon absent display values. Never aggregate those rows into a risk
    score or disposition and never move safety-planning ability into this action.
81. D-342 owns only the typed Subjective safety-planning-ability result for
    `info.history.existing-safety-plan`. Preserve the current patient-report source restriction,
    singleton-only reveal, redacted runtime binding, and authoring-only full audit. Never infer a
    written plan, planning intervention, risk, disposition, generation behavior, or points from
    the result.
82. D-343 owns only the current `medication_regimen_entries` result for medication reconciliation.
    Preserve exact regimen-instance identity, the current patient-report source, and redacted
    binding. Never mix in prior trials, effects, dose position, change relationships, supplements,
    interpretation, generation behavior, or points.
83. D-344 owns only exact reaction records and explicit overall/medication assessment statuses for
    allergy/adverse-reaction history. Preserve reported labels separately from null clinical
    interpretation and retain unassessed versus documented-none versus entries-present semantics.
    Never infer immune allergy, contraindication, treatment consequence, generation behavior, or
    points.
84. D-345 owns only the exact source-reported positive-use exposure lane for substance-use
    history. Preserve objective exposure truth separately from source presentation and omitted
    truth records; never infer nonuse, report accuracy, intoxication, withdrawal, diagnosis,
    causality, generation behavior, or points.
85. D-346 owns only the focused medication-trial lane for prior medication trials. Preserve exact
    trial-record identity and keep psychotherapy, providers, and levels of care out of that
    result. Before player presentation, project observed duration and highest reported dose
    through a separately validated minimized record shape; never expose the hidden legacy
    adequacy category or infer adequacy, treatment meaning, generation behavior, or points.
86. D-347 owns only the four-lane full treatment-history result. Preserve medication trials,
    psychotherapy trials, current treatment providers, and prior levels of care as independently
    auditable record kinds; never coerce psychotherapy into medication history or infer engagement,
    longitudinal outcome, diagnosis, treatment meaning, generation behavior, or points.
87. D-348 owns only the four exact-regimen medication-effects lanes. Preserve reported benefit,
    tolerability, dose position, and medication-change timing as separate sparse records with
    exact regimen subjects; never infer causality, dose, adequacy, treatment correctness,
    generation behavior, or points from their grouping.
88. D-349 owns only the closed minimized field projection over exact source-presented structured
    record IDs. Preserve observed trial duration and highest reported dose while excluding legacy
    trial adequacy, exposure misuse truth, reaction interpretation, internal chart mappings,
    per-record source/generation audit, authoring summaries, omitted truth IDs, and alignment
    internals. Keep it detached from D-214, PatientInstance, persistence, runtime, UI, rules, and
    points until a separate exact source-validated integration owns that transition.
89. D-350 owns only the D-299-derived collection of D-349 safe views. Require replay-valid
    source-validation authority and preserve exact patient, definition, action, source, time,
    recipe, projection, and fingerprint relationships. Never accept raw D-215 output or
    caller-authored safe fields, and keep D-218/D-194/D-213/D-214, persistence, runtime, UI,
    clinical interpretation, rules, balances, and points separate.
90. D-351 owns only the detached exact join between replay-valid D-350 and D-213 artifacts. Require
    the same complete patient and structured-envelope set, derive D-214 mechanically, and prove
    every minimized record payload matches its frozen reveal. Never accept raw D-214 or
    caller-authored fields, and keep PatientInstance, D-194/D-218, persistence, runtime, UI,
    clinical interpretation, generation, rules, balances, and points separate.
91. D-352 owns only the checked-in current/past mania-history finding projection and universal
    result content. Preserve all sixteen patient-report findings independently, keep MSE
    observations outside the action, and retain hidden subthreshold values beneath visible
    present status. Do not infer an episode, bipolar diagnosis, source accuracy, generation
    distribution, treatment consequence, balance, points, persistence, runtime, or UI.
92. D-353 owns only the checked-in current psychosis-history finding projection and universal
    result content. Preserve all six patient-report findings independently and keep paranoia
    vocabulary, proposition truth, belief appraisal, other evidence sources, and MSE observations
    outside the action. Do not infer psychosis, diagnosis, source reliability, generation
    distribution, treatment consequence, balance, points, persistence, runtime, or UI.
93. D-354 owns only the broad current self-reported functional-impact projection inside the
    existing two-action MDD initial-assessment result. Preserve current-MDD duration and
    condition-attributed functional impairment as separate typed values. Do not infer impairment
    level, severity, diagnosis, generation distribution, treatment consequence, balance, points,
    persistence, runtime, or UI.
94. D-355 owns only the neutral body-habitus categorical-observation definition and its existing
    weight/BMI action-result route. Preserve its independent source/value identity beside
    uninterpreted numeric measurements. Never infer body habitus from BMI or BMI from body
    habitus, and do not add a real value profile, generation distribution, interpretation, tag,
    rule, balance, point, complexity spend, persistence, runtime, or UI.
95. D-356 owns only the detached deterministic generated-categorical-observation compiler.
    Preserve exact definition/profile/option/source/time/seed provenance, stable selection,
    normalization, explicit no-profile coverage failure, empty interpretation, and replay. Never
    treat relative weights as prevalence or evidence, infer BMI/body-habitus relationships, add a
    real profile, spend complexity, attach patient state or a template recipe, or create clinical
    tags, rules, balances, points, persistence, runtime, or UI.
96. D-357 owns only D-310 `3.0.0` admission of replay-valid D-356 output. Preserve the distinct
    generated-observation member discriminator, exact upstream patient/source/artifact identity,
    order normalization, duplicate rejection, and neutral payload. Keep D-320 authored matching
    narrowed to D-309 until a separate generated recipe owner exists; do not infer template
    ownership, attach patient state, spend complexity, or add meaning, rules, balances, points,
    persistence, runtime, or UI.
97. D-358 owns the explicit generated-observation D-320/D-324/D-326 path. Preserve the exact
    definition, complete unique D-356 profile horizon, source/time owner, missing-resource
    diagnostics, and D-325-only seed/context authority. Never replace the full horizon with the
    selected profile, perform a second draw, infer a real body-habitus distribution or BMI
    relationship, spend complexity, or add interpretation, clinical tags, rules, balances,
    points, persistence, runtime, or UI.
98. D-359 owns only proof that D-327/D-328/D-329/D-330 preserve one exact D-358 result. Keep the
    original D-356 compilation, draw, generated member/binding identity, and resolved observation
    unchanged through the final patient; never add a second selection or specialized attachment
    framework.
99. D-360 owns only the checked-in current-MDD duration integration proof. Preserve exact catalog
    ID/version plus canonical profile-fingerprint equality, the one D-233 seed, declared-option
    membership, D-263/D-294/D-328/D-200/D-240/D-330 provenance, and deterministic replay. Never
    treat source-file option order as semantic or infer prevalence, severity, impairment,
    treatment meaning, rules, balances, points, persistence, runtime, or UI.
100. D-361 owns only the checked-in current-MDD D-197 plus D-256/D-259/D-260 integration proof.
     Preserve exact diagnosis/profile scope, sparse-positive dimension/manifestation selection,
     the reviewed five-through-nine/core-requirement trace, exact 17-item patient-report closure,
     and selected out-of-horizon MSE positives. Never turn unselected MSE alternatives into
     negatives, add per-manifestation D-198 absent baselines, or infer diagnosis, severity,
     impairment, treatment meaning, rules, balances, points, persistence, runtime, or UI.
101. D-362 owns only the combined checked-in current-MDD finding-plus-duration truth-state proof.
     Preserve one D-233 seed, independent D-197 and D-263/D-294 profile/draw/source provenance,
     the complete combined D-328/D-200/D-330 patient, and deterministic replay. Keep the full
     presenting-problem result gated until broad functional impact has a reviewed generation owner;
     never infer absent impact or downstream clinical, scoring, persistence, runtime, or UI
     meaning from coexistence alone.
102. D-363 owns only the checked-in D-352 mania/hypomania-history integration proof. Preserve all
     sixteen exact current/past patient-report identities, the unchanged action and result recipe,
     assessment-local D-256 closure after positive generation, exact action binding, and
     deterministic replay. Never turn closed rows into a global negative-generation rule or infer
     a manic episode, bipolar diagnosis, antidepressant safety, rule, balance, points,
     persistence, runtime, or UI.
103. D-364 owns only the checked-in D-353 psychosis-history integration proof. Preserve all six
     exact current patient-report identities, the unchanged action and result recipe,
     assessment-local D-256 closure after positive generation, exact binding, and deterministic
     replay. Never adjudicate proposition truth, manufacture MSE evidence, create a global
     negative, or infer psychosis, diagnosis, treatment meaning, rules, points, persistence,
     runtime, or UI.
104. D-365 owns only the checked-in D-340/D-341 detailed-safety integration proof. Reuse an exact
     MDD-generated passive-death-wish or active-suicidal-ideation value, preserve it through the
     nine-item assessment, close only the other declared rows, and retain exact action binding and
     replay. Never add a second safety draw or infer risk, safety-plan ability, disposition,
     treatment meaning, rules, points, persistence, runtime, or UI.
105. D-366 owns only the first checked-in clinical-rule binding over generated patient truth.
     Preserve the exact real MDD policy and focused route, generated passive-death-wish
     fact/record binding, and `info.history.suicide-safety` action target. Keep compatibility tags
     out of the native rubric and keep `balanceRef: null`; never infer points, risk, disposition,
     treatment selection, persistence, runtime, or UI from this seam.
106. D-367 owns only the checked-in D-338 exact-class prerequisite integration. Preserve the five
     concrete reviewed medication-start triggers, distinct `info.history.mania` fulfillment
     predicate, availability-only D-191 discovery, exact patient binding, and deterministic replay.
     Never infer a class from tags/prose, treat availability as a player decision, or import
     balance/points, antidepressant-safety conclusions, persistence, runtime, or UI.
107. D-368 owns only native balance attachment/evaluation for the exact D-338/D-339 generated-MDD
     rules. Preserve their canonical balance payloads, derived event-backed information
     selections, final treatment snapshot, independent database-plan evaluation, explicit
     fulfilled/omitted/not-triggered traces, and replay. Never retune or infer points, treat the
     subtotal as a complete plan score, or widen persistence, runtime, or UI.
108. D-369 owns only direct-information scoring for the exact checked-in depressive-syndrome
     action/result. Preserve the reviewed diagnosis rule, exact MDD patient scope, existing
     +50/−50 balance payload, event-derived purchase state, independent database plan, and replay.
     Never score individual rows, infer diagnosis from symptom count, import primary-route points,
     manufacture functional-impact state, or widen persistence, runtime, or UI.
109. D-370 owns only primary-route balance attachment/evaluation in the generated MDD proof.
     Preserve the exact count-aware reviewed route, admitted medication horizon, +200 matched
     balance, explicit zero-unmatched behavior, modifier traces, database plan, and replay. Never
     infer an omission penalty or comparative fit, admit unavailable medications, retune points,
     or widen persistence, runtime, or UI.
110. D-371 owns only standard-mode settlement of the exact four-balance generated MDD proof.
     Preserve service-derived expenses, base-plus-care gross arithmetic, 1.00 satisfaction,
     nonnegative payout flooring, positive bank/lifetime updates, and D-235 replay. Never debit
     persistent points for encounter expenses or invent a price, bonus, formula, migration,
     runtime activation, or UI.
111. D-372 owns only nonblocking decision-rule action-coverage diagnostics. Emit
     `uncovered_action` for an approved diagnosis information rule only when its patient scope and
     any separate treatment trigger apply but the exact information action is absent. Never
     compile or score that rule, infer a negative result from empty/unassessed state, invalidate or
     reroll the patient, or widen persistence, runtime, or UI.
112. D-373 owns only the first fixed accurate structured patient-report profiles. Preserve their
     exact action-result fingerprints, catalog-derived patient-report source role, time scopes,
     complete `report_all`/`mirror_truth` behaviors, zero report draw and D-201 spend, and
     authoring-only bundle boundary. Never turn an empty positive-record lane into lifetime nonuse,
     unassessed reactions into documented none, or the profiles into probability, source
     credibility, clinical inference, points, persistence, runtime activation, or UI.
113. D-374 owns only the explicit diagnosis-enabled generated-MDD variant and JSON-safe fixed
     report request. Preserve blank diagnosis submission, the exact family-level MDD horizon and
     D-272 owner, empty player severity allowlist, separately reviewed psychotic-features
     specifier, and omitted absent optional-feature field. Never derive the player diagnosis from
     hidden truth, expose backend severity, add diagnosis points, or change existing clinical
     fixtures' deterministic seeds.
114. D-375 owns only native purchase/replay of the three D-373 structured histories. Preserve the
     exact frozen result bindings, one successful nonrepeatable event per action, native
     least-cost service quotes, D-242 purchased-action derivation, itemized 75-point expense, and
     zero-point practice replay. Never let purchasing generate truth, author a clinical balance,
     change service prices, or widen persistence, runtime, or UI.
115. D-376 owns only the existing timestamp-separated authoring persistence envelope over the
     exact D-375 attempt. Preserve the embedded attempt byte-for-byte, its independent replay and
     payload fingerprints, completion time outside deterministic logic, JSON round-trip equality,
     and record integrity. Never treat this as SaveData/IndexedDB migration, a runtime queue,
     review export, or authority for wall-clock clinical behavior.
116. D-377 owns only D-234's immutable completion proof for the exact D-375 attempt and D-374
     waiting patient. Preserve the attempt snapshot, terminal completion event, waiting-slot,
     patient, template, and fingerprint bindings plus JSON/integrity replay. Never vacate or
     refill a slot, mutate history, activate a runtime queue, or add SaveData, points, or UI at
     this boundary.
117. D-378 owns only the existing D-234 completed-encounter transition over that exact proof.
     Preserve the one-coordinate vacancy, complete attempt-bearing history entry, bounded
     newest-first history, and native integrity/context replay. Never treat the generic D-234
     refill fixture as a rebuilt clinical patient, copy the completed patient into the next slot,
     or add SaveData, runtime activation, clinical content, points, or UI at this boundary.
118. D-379 owns only the optional complete weighted-selection policy for one exact
     condition-functional-impairment profile. Preserve qualitative level identity separately
     from explicit generation mass, require one positive weight for every and only offered option,
     pin and match source kind, time scope, and care-setting applicability, freeze normalized
     probabilities, and keep source-conditioned populations in separate reviewed profile
     versions. Never infer weights from points, prose, evidence rank, catalog order, or a
     preliminary adjunct packet, and never treat neutral uniform mode as a prevalence claim.
119. D-380 owns only the reviewed outpatient-MDD broad current self-reported functional-impact
     background profile and its exact Presenting problem and timeline attachment. Preserve the
     public NHANES cycle/files/weighted subgroup aggregate and separate Developer-opinion
     transportability bridge. Never treat its mass as outpatient prevalence or infer
     condition-attributed impairment, severity, treatment, complexity, a rule, balance, or points.
120. D-381 owns only deterministic read-only observation of the sibling adjunct. Keep packet and
     inventory fingerprints outside production content and saves. A Developer review or packet
     membership is not source use, a PsychSim mapping, clinical approval, a formulary decision,
     or runtime authority.
121. D-382 owns only official NLM-verified normalized ingredient identity intake and mechanical
     static import/registry synchronization. Preserve offline drift failure and require current
     online verification before writes. An identity-only record creates no formulation,
     indication, class, formulary membership, regimen behavior, generation, rule, balance, point,
     or approval; fixed combinations require a separate owner.

The sibling PsychSimDataAdjunct remains read-only and operates its own concept-first evidence
horizon; PsychSim tickets are inputs, not its queue authority. A general proposal may remain an
unmapped, hashed, medically unreviewed bundle. A proposal submitted for PsychSim incorporation
must add a separate mapping pinned to the current committed `beta` HEAD. The first safe
medication-regimen evidence mapping may name:

- `source-request.medications.regimen-combination-boundaries`;
- `ticket.source.canmat-mdd.inadequate-response-route`;
- `ticket.source.canmat-mdd.switch-transition-state`; and
- the exact target IDs already listed on that `SourceRequest`.

The data-review thread is currently preparing broader diagnosis-coverage and formulary-coverage
briefs. Check for those new or revised packets at the next evidence/catalog boundary. Until exact
files exist and their hashes, base mapping, source access/rights, and target freshness validate,
they remain pending unmapped inputs. They may help populate candidate bins and expose gaps, but
cannot themselves add a playable diagnosis, formulary medication, treatment route, rule, or point
value.

The canonical thread checked the adjunct workspace on 2026-08-03. It found current read-only
playable-breadth and medication-breadth audits plus preliminary antidepressant, antipsychotic, and
cross-diagnostic medication-census packets. They explicitly report no mapping, no sealed evidence
artifact, medically unreviewed status, and dirty-worktree observation bases. They are useful
coverage signals but remain unsafe for direct import; re-check when the in-progress broader briefs
produce immutable/hash-bound units or a stale-safe PsychSim mapping proposal.

The canonical thread checked again after D-280 on 2026-08-03. The adjunct still has a dirty,
uncommitted observation base and no completed immutable diagnosis-breadth or formulary-breadth
mapping proposal. Newer preliminary generator, setting-mix, symptom, antidepressant,
antipsychotic, and medication-census work remains useful gap context only. No adjunct content was
imported.

The canonical thread checked again after D-281 on 2026-08-03. The adjunct now also has preliminary
core mood-stabilizer/anticonvulsant breadth plus broader playable- and medication-breadth audits,
but its worktree remains dirty and the packets explicitly remain unmapped, medically unreviewed,
and without immutable/hash-bound units or a stale-safe PsychSim mapping. These are gap signals
only. No diagnosis, formulary, medication relationship, rule, probability, or point was imported.

The canonical thread checked again after D-282 on 2026-08-03. The adjunct's current state still
describes the breadth packets as medically unreviewed, unmapped, and without immutable units or a
PsychSim mapping. The new tiered-medication-breadth and ADHD-sequencing decisions govern adjunct
research order only; the read-only medication audit remains based on the dirty PsychSim worktree
at committed D-274. No completed hash-bound diagnosis/formulary mapping is available, so no
diagnosis, medication identity, formulary membership, rule, probability, or point was imported.

The canonical thread checked again after D-286 on 2026-08-03. The adjunct's active packet remains
the preliminary core mood-stabilizer/anticonvulsant breadth review awaiting Developer review, and
the broader diagnosis/formulary work remains preliminary, medically unreviewed for downstream
use, unmapped, and without an immutable hash-bound PsychSim bundle. Its “formulary breadth” is an
evidence inventory rather than a formulary-selection proposal. No adjunct diagnosis, medication,
formulary membership, relationship, rule, probability, balance, or point was imported. Re-check
when the reviewer produces exact immutable units and a separate stale-safe target mapping.

The canonical thread checked again after D-287 on 2026-08-03. The
core-mood-stabilizer/anticonvulsant breadth packet now has a dated Developer review, while the
anxiety/panic/OCD/PTSD/arousal-medication breadth packet is the adjunct's sole active review item.
Both formal-source packets remain preliminary, medically unreviewed for downstream use, unmapped,
and without immutable evidence units or bundles. The exact PsychSim landing horizon after
D-288—nine diagnosis definitions, 55 broad medication identities, 13 narrower runtime medication
definitions, and three current formularies—is now recorded in
`docs/DATA_ADJUNCT_EVIDENCE_QUEUE.md` for later deduplication and gap routing. The preliminary
packet exposed two candidate gaps, but only independently verified NLM RxNorm identity metadata
was incorporated; no adjunct clinical content was imported.

The canonical thread checked again after D-290 on 2026-08-03. The anxiety/panic/OCD/PTSD/arousal
packet now has a dated Developer review, as do the core antidepressant, core antipsychotic,
cross-diagnostic medication-census, core mood-stabilizer/anticonvulsant, and several reusable
symptom/context packets. The insomnia/wakefulness medication-breadth packet is now the sole active
review item. All remain preliminary and unmapped, with no immutable evidence unit/bundle plus
fresh PsychSim mapping; no completed broad diagnosis-coverage bundle or formulary-selection
proposal exists. No clinical content or additional identity was imported.

The canonical thread checked again at the D-295 static boundary on 2026-08-03. The adjunct still
lists the insomnia/wakefulness medication-breadth packet as its sole active review item. Its
broader reviewed packets remain preliminary and unmapped; “formulary breadth” is explicitly an
evidence-inventory objective rather than a PsychSim formulary selection. The only sealed current
evidence bundle is the preexisting adult-substance-states bundle, and
`proposals/psychsim/` contains no target-bound proposal beyond its contract README. No completed
immutable diagnosis-coverage or formulary-selection packet was available, so D-295 imported no
adjunct diagnosis, medication, formulary membership, relationship, rule, probability, balance,
or point.

The canonical thread checked again after the complete D-296 gate on 2026-08-03. The adjunct
worktree remains dirty and still names insomnia/wakefulness medication breadth as the sole active
review item. No new immutable diagnosis-coverage bundle, formulary-selection bundle, or
target-bound PsychSim mapping exists; `proposals/psychsim/` still contains only its contract
README. The broader diagnosis and medication inventories remain medically unreviewed,
preliminary, and unmapped gap signals, so no adjunct clinical or formulary data was imported.

The canonical thread checked again at the D-302/D-303 catalog boundary on 2026-08-03. The adjunct
contains expanded playable-breadth and medication-breadth audits plus preliminary antidepressant,
antipsychotic, mood-stabilizer, anxiety/PTSD/OCD, insomnia, and cross-diagnostic medication
packets, but its worktree remains dirty. Its own current state still marks the broader diagnosis
and formulary work medically unreviewed for downstream use, unmapped, and without immutable
hash-bound units or a current target-bound PsychSim proposal. Those materials remain useful
coverage signals for the next catalog pass; no diagnosis, medication identity, formulary
membership, clinical relationship, probability, rule, balance, or point was imported.

The canonical thread checked again after D-305 and while completing D-306 on 2026-08-03. The
adjunct worktree remains dirty and now contains broader preliminary diagnosis/generator packets
including MDD phenotype and functional impairment, plus expanded antidepressant, antipsychotic,
mood-stabilizer, anxiety/PTSD/OCD, insomnia/wakefulness, and cross-diagnostic medication breadth
inventories. Its current handoff names insomnia/wakefulness as the sole active sequential review
item and plans substance-use/withdrawal/overdose/tobacco breadth afterward. The packets remain
medically unreviewed for downstream use, preliminary, and unmapped; `proposals/psychsim/` still
contains only its contract README. No immutable snapshot-bound diagnosis/formulary proposal was
available, so D-306 imported no adjunct diagnosis, medication, formulary membership, clinical
relationship, generation distribution, rule, balance, or point. Continue checking these broader
briefs at each relevant diagnosis, medication, or formulary boundary.

The canonical thread checked again after D-309 on 2026-08-03. The adjunct worktree remains dirty,
the insomnia/wakefulness medication-breadth supplement remains its sole active review item, and
substance-use/withdrawal/overdose/tobacco breadth remains next. Broader diagnosis/generator and
medication packets now preserve useful source-conditioned observations and dated Developer
reviews, but remain preliminary, medically unreviewed for downstream use, and unmapped. The sole
sealed current evidence bundle remains adult substance states, while `proposals/psychsim/` still
contains only its contract README. No immutable snapshot-bound diagnosis-coverage,
medication-identity, or formulary-selection mapping was available, so D-309 imported no adjunct
diagnosis, medication, formulary membership, measurement/observation value, generation
distribution, clinical relationship, rule, balance, or point.

The canonical thread checked again after D-311 on 2026-08-03. The adjunct worktree remains dirty,
the insomnia/wakefulness medication-breadth supplement remains its sole active review item, and
substance-use/withdrawal/overdose/tobacco breadth remains next. The broader diagnosis/generator
and medication packets remain useful source-conditioned gap signals with dated reviews, but still
identify themselves as preliminary, medically unreviewed for downstream use, and unmapped. The
only sealed evidence bundle remains adult substance states, and `proposals/psychsim/` still
contains only its contract README. No immutable snapshot-bound diagnosis or formulary mapping was
available, so D-311 imported no adjunct diagnosis, medication identity, formulary membership,
result value, generation distribution, relationship, rule, balance, or point.

The canonical thread checked again before D-314 on 2026-08-03. The adjunct worktree remains dirty
at `1fc0bbaf223d2912c11d16057c955011cd760c08`; its cross-diagnostic medication census plus core
antidepressant, antipsychotic, mood-stabilizer, anxiety/PTSD/OCD, and insomnia breadth packets
remain preliminary, medically unreviewed for downstream use, and unmapped. The insomnia/
wakefulness supplement remains the sole active sequential review item, with substance-use,
withdrawal, overdose, and tobacco breadth planned next. The medication audit is a coverage
inventory rather than a formulary decision, and `proposals/psychsim/` still contains only its
contract README. No immutable snapshot-bound diagnosis or formulary mapping was available, so
D-314 imported no adjunct diagnosis, medication identity, formulary membership, generation
distribution, functional-impairment profile, relationship, rule, balance, or point.

The canonical thread checked again after the complete D-319 gate on 2026-08-03. The adjunct is
still at the same committed observation coordinate with a materially dirty worktree. Its
playable-breadth, medication-breadth, and generator-readiness audits plus preliminary MDD,
setting, antidepressant, antipsychotic, mood-stabilizer, anxiety/PTSD/OCD,
insomnia/wakefulness, and cross-diagnostic medication packets provide increasingly useful gap
signals and several dated Developer reviews. They remain preliminary, medically unreviewed for
downstream use, and unmapped. The only sealed bundle remains adult substance states, and
`proposals/psychsim/` still contains only its contract README. No immutable current-snapshot-bound
diagnosis or formulary mapping is available, so no diagnosis, medication identity, formulary
membership, distribution, relationship, rule, balance, or point was imported. Continue with only
source-independent typed dependency owners while these broader briefs mature.

The canonical thread checked again after D-321 on 2026-08-03. The committed coordinate, dirty
worktree, preliminary packet set, active insomnia/wakefulness review, sole sealed adult-substance
bundle, and empty `proposals/psychsim/` mapping directory are unchanged. The broader packets still
provide diagnosis/formulary gap signals rather than immutable source-local units or a
snapshot-bound PsychSim mapping. D-320/D-321 therefore imported no diagnosis, medication identity,
formulary membership, result profile, distribution, relationship, rule, balance, or point.

The canonical thread checked again after D-322 on 2026-08-03 in response to the user's reminder
that broader diagnosis and formulary briefs are in progress. The adjunct remains at
`1fc0bbaf223d2912c11d16057c955011cd760c08` with a materially dirty worktree, the active
insomnia/wakefulness breadth packet and queued substance-use/withdrawal/overdose/tobacco breadth
work remain preliminary, and `proposals/psychsim/` still contains only its README. No immutable
source-local diagnosis/formulary bundle plus current-snapshot PsychSim mapping exists, so D-322
imported no diagnosis, medication identity, formulary membership, recipe/profile, distribution,
relationship, rule, balance, or point.

The canonical thread checked again after D-324 on 2026-08-03. The committed adjunct coordinate
remains `1fc0bbaf223d2912c11d16057c955011cd760c08` and its worktree remains materially dirty. It
now has substantially broader preliminary MDD phenotype and reusable finding packets plus
cross-diagnostic medication-census, antidepressant, antipsychotic, mood-stabilizer,
anxiety/panic/OCD/PTSD, and insomnia/wakefulness breadth packets, with several dated Developer
reviews. They remain medically unreviewed for downstream use, preliminary, and unmapped; the
medication inventory is not a PsychSim formulary decision. `proposals/psychsim/` still contains
only its contract README, so D-324 imported no diagnosis, medication identity, formulary
membership, result profile, distribution, relationship, rule, balance, or point.

The canonical thread checked again after the complete D-328 gate on 2026-08-03. The adjunct
remains at the same committed coordinate with a materially dirty worktree. Its breadth horizon
now contains reviewed but explicitly preliminary MDD phenotype/impairment, setting-mix, reusable
finding-state, antidepressant, antipsychotic, mood-stabilizer, anxiety/PTSD/OCD,
insomnia/wakefulness, and cross-diagnostic medication inventories. The insomnia/wakefulness
supplement remains the active sequential review item. The only sealed evidence bundle remains
adult substance states, and `proposals/psychsim/` still contains only its README. No immutable
current-snapshot diagnosis-coverage or formulary-selection mapping exists, so D-328 imported no
diagnosis, medication identity, formulary membership, generation distribution, relationship,
rule, balance, or point. Continue checking the user's in-progress broader briefs at diagnosis and
formulary boundaries.

The canonical thread checked again after the complete D-331 gate on 2026-08-03. The adjunct
remains at committed coordinate `1fc0bbaf223d2912c11d16057c955011cd760c08` with a materially
dirty worktree, and `proposals/psychsim/` still contains only its README. Its newer
`PSYCHSIM_PLAYABLE_BREADTH_EVIDENCE_READINESS_AUDIT` and
`PSYCHSIM_MEDICATION_BREADTH_READONLY_AUDIT` are useful coverage inventories but explicitly have
no sealed evidence artifact and no PsychSim mapping; each observed a stale, dirty PsychSim
snapshot. They report broad preliminary/reviewed packets across diagnosis families and 53
medication identities but do not establish diagnosis activation or formulary membership. The
insomnia/wakefulness packet remains active, substance/withdrawal/overdose/tobacco medication
breadth remains next, and adult substance states remain the only sealed bundle. D-331 therefore
imported no diagnosis, medication, formulary membership, generation distribution, relationship,
rule, balance, or point.

The canonical thread checked again after D-332 on 2026-08-03 in response to the user's reminder
that broader diagnosis and formulary briefs are in progress. The adjunct remains at the same
committed coordinate with a materially dirty worktree. Its active item is the preliminary
insomnia/wakefulness medication-breadth packet, with substance-use/withdrawal/overdose/tobacco
medication breadth next. Its reviewed diagnosis-family and medication-breadth packets remain
medically unreviewed for downstream use, preliminary or unmapped, and explicitly do not choose a
PsychSim formulary. `proposals/psychsim/` still contains only its contract README, and adult
substance states remain the only sealed evidence bundle. D-332 imported no adjunct diagnosis,
medication, formulary membership, distribution, relationship, rule, balance, or point.

The canonical thread repeated that read-only diagnosis/formulary check after D-333. The adjunct
still resolves to committed coordinate `1fc0bbaf223d2912c11d16057c955011cd760c08` over a
materially dirty worktree. Its active item and next item are unchanged; the broader
diagnosis/generator and medication/formulary materials remain preliminary or unmapped;
`proposals/psychsim/` still contains only its contract README; and adult substance states remain
the only sealed evidence bundle. No diagnosis, medication, formulary membership, distribution,
relationship, rule, balance, or point was imported. Continue checking at each relevant boundary
and require an immutable source-local unit, source-use review, and a fresh snapshot-bound mapping
before canonical intake.

The canonical thread repeated the read-only check after D-337 on 2026-08-04. The adjunct HEAD is
still `1fc0bbaf223d2912c11d16057c955011cd760c08` with a materially dirty worktree. New breadth
audits, decisions, source leads, and preliminary diagnosis/medication packets improve coverage
discovery, but their own records explicitly preserve medically unreviewed, preliminary, unmapped,
or evidence-gap status. The medication inventory explicitly is not a formulary decision;
`proposals/psychsim/` still contains only its contract README; and no immutable current-snapshot
mapping exists. D-337 therefore imported no adjunct diagnosis, medication identity, formulary
membership, distribution, relationship, rule, balance, or point.

The canonical thread repeated that read-only check after D-338 on 2026-08-04. The adjunct remains
at the same committed coordinate with a materially dirty worktree. A dated review file now exists
for the preliminary insomnia/wakefulness medication-breadth packet, although the adjunct's own
dirty `PROJECT_STATE.md` still calls it the active item awaiting review; the queued
substance-use/withdrawal/overdose/tobacco breadth lead is also present. Both remain preliminary
and unmapped. The only sealed bundle is still adult substance states, and
`proposals/psychsim/` still contains only its README. No immutable current-snapshot diagnosis or
formulary mapping was available, so D-338 imported no adjunct diagnosis, medication identity,
formulary membership, generation profile, relationship, rule, balance, or point.

The canonical thread repeated the read-only diagnosis boundary check after D-339 on 2026-08-04.
The adjunct remains at `1fc0bbaf223d2912c11d16057c955011cd760c08` with a materially dirty
worktree. A new substance-use/withdrawal/overdose/tobacco medication-breadth packet directory is
present, but it remains preliminary and unmapped; the insomnia/wakefulness materials likewise
remain preliminary despite a dated review file. `proposals/psychsim/` still contains only its
README, so no immutable current-snapshot mapping exists. D-339 imported no adjunct diagnosis,
medication identity, formulary membership, generation profile, relationship, rule, balance, or
point.

The canonical thread repeated the read-only check through D-379 on 2026-08-04. The adjunct HEAD is
unchanged and its worktree remains dirty. `proposals/psychsim/` still contains only its contract
README. The adult-MDD functional-impairment packet now supplies useful source-conditioned public
observations and a dated Developer review accepting its construct distinctions and broad
clinical plausibility, while explicitly retaining preliminary, medically unreviewed for
downstream use, unmapped, and unsealed status. The newer
substance-use/withdrawal/overdose/tobacco breadth packet is likewise preliminary. No immutable
current-snapshot mapping exists, so D-379 imported no functional-impact distribution, diagnosis,
medication, formulary membership, relationship, rule, balance, or point.

This canonical thread retains stale-target/source-use validation, canonical IDs, database edits,
review status, rules/points, and all runtime validation. The refreshed whole-corpus Developer
Database projection may supply safe coverage signals and locators. D-192 does not authorize
private source-text transfer; the ordinary explicit source-specific authorization remains
required.

The 13 current adjunct handoff bundles pass the adjunct's own v2 validator, but they are not yet
safe direct imports. The adjunct repository has no committed provenance; the bundles have no
machine-readable stale-safe PsychSim mapping, exact target hashes/versions, complete normalized
source/correction metadata, or exact page/section/recommendation locators. Rights observations are
not PsychSim `SourceUseDecision`s, packet `accepted_direction` is not clinical approval, and the
psychotic-depression bundle's Oliva access claim is narrowed by a separate advisory that its bundle
validator does not enforce. Future adjunct handoff should preserve immutable hashed evidence units
for emulation and send a separate target-bound mapping proposal; it must not create points, rules,
clinical winners, canonical IDs, or runtime content.

Adjunct proposals are never copied wholesale into game content. The canonical translation pass
validates packet/base/source-use identity, preserves each source-local finding and limitation,
routes it to the smallest exact owner or a retained candidate bin, separates emulation inputs from
clinical judgment, and asks for only the unresolved psychiatrist interpretation. An accepted
qualitative rule and its provisional balance remain two distinct later records.

The D-274 transitional local Developer Patient Maker is active only over completely validated
compatibility CaseBlueprints and treats the selected budget as an exact filter over pre-authored
case complexity. The future generalized PatientTemplate maker remains deferred: it may eventually
choose an exact template/recipe, admitted care setting/location, and bounded complexity envelope
and request one deterministic patient from the canonical compiler. It must not bypass admission,
expose hidden truth, create a parallel generator, or reuse D-274's CaseBlueprint compatibility
path as if it exercised D-201/D-200. Do not build that generated path until the first realistic
source-controlled generation vertical is complete enough to audit.
