# PsychSim project state

Last updated: 2026-07-31

## Operational handoff

- Canonical Codex thread: `019f86e1-8867-7143-b2e9-e93d7f25db8b`, generation 1.
- Canonical branch: `beta`, tracking `origin/beta`. Local database-first dependency work stays on
  `beta` and is intentionally batched without per-decision pushes, browser/app verification, or
  Pages checks. Complete gates and remote promotion occur only at a deliberate integration
  checkpoint or explicit user request, after which the checkout returns to `beta`.
- Current phase: Milestone 3 is complete. The bounded work is still the pre-Milestone-4
  clinical-authoring, knowledge-database, review, and scoring-engine checkpoint. Do not begin
  departments or longitudinal-care simulation.
- Current checkpoint implements the D-159 compatibility and D-245/D-252 native generated
  scoring/replay engines plus accepted architecture Decisions D-160 through D-253. D-163 makes
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
  registers 50 medically unreviewed, identity-only findings. The 37-candidate audit plus subsequent
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
  The strict runtime catalog now registers 50 medically unreviewed identity-only findings; the
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
  universal-result assembly, source-report profile, and complete presentation remains synthetic or
  absent. The result stays in the existing dependency ticket/audit instead of introducing a
  duplicate readiness-status model.
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
- Expected Git state during this bounded local iteration: `HEAD` and `origin/beta` remain
  `19d8582747bec30609c64a4985911e3671c453b5` (`Build deterministic patient-generation
foundation`). The worktree intentionally contains the uncommitted D-247/D-248 finding-identity,
  dimension-compiler, evidence-queue, and review-packet changes plus the D-249 synthetic
  optional-texture bridge. The user has authorized a later deliberate beta-to-main release only
  after all safely executable dependency work is exhausted and complete Player/Reviewer/mobile
  gates pass.
- The current committed checkpoint includes D-193 through D-246 and may be used as the adjunct's
  stale-target mapping base after its exact commit hash is confirmed from Git.
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
  and D-235 replay preserve the exact prerequisite state and both component Booleans. D-245 now
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
  finding-definition boundary and 47-definition wide/shallow seed are implemented and validated.
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
- the deferred local Developer Patient Maker is recorded as a thin exact-template/setting/
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
  on a supported runner; that remote gate must pass before the main/Pages promotion is considered
  verified; and
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

## Files to read before continuing

Always read the startup contract files named in `AGENTS.md`. For the current checkpoint also read:

- `docs/DECISIONS.md` through D-252
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
- `packages/engine/src/diagnosis-information-prerequisite-adapter.ts`
- `packages/engine/src/diagnosis-information-prerequisite-adapter.test.ts`
- `packages/engine/src/medication-regimen-route-adapter.ts`
- `packages/engine/src/shared-finding-compiler.ts`
- `packages/engine/src/catalog-instance-compiler.ts`
- `packages/engine/src/encounter-operational-admission-compiler.ts`
- `packages/engine/src/encounter-operational-admission-compiler.test.ts`
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
- `packages/engine/src/resolved-patient-state-normalizer.ts`
- `packages/engine/src/resolved-condition-source.ts`
- `packages/engine/src/information-action-fingerprint.ts`
- `packages/engine/src/universal-action-result-compiler.ts`
- `packages/engine/src/universal-action-result-compiler.test.ts`
- `packages/engine/src/universal-action-result-attachment.ts`
- `packages/engine/src/universal-action-result-attachment.test.ts`
- `packages/engine/src/structured-source-report-compiler.ts`
- `packages/engine/src/structured-source-report-compiler.test.ts`
- `packages/engine/src/structured-source-report-behavior-selector.ts`
- `packages/engine/src/structured-source-report-behavior-selector.test.ts`
- `packages/engine/src/target-scoped-patient-value-projection.ts`
- `packages/engine/src/target-scoped-patient-value-projection.test.ts`
- `packages/engine/src/catalog-instance-compiler.test.ts`
- `packages/engine/src/finding-pipeline-audit-composer.test.ts`
- `packages/engine/src/location-owned-patient-slot-selection-compiler.ts`
- `packages/engine/src/location-patient-slot-capacity-compiler.ts`
- `packages/engine/src/location-patient-slot-capacity-compiler.test.ts`
- `packages/engine/src/patient-slot-fill-seed-authority.ts`
- `packages/engine/src/empty-authorized-patient-slot-fill-compiler.ts`
- `packages/engine/src/generated-completed-attempt-compiler.ts`
- `packages/engine/src/generated-service-quote.ts`
- `packages/engine/src/patient-slot-post-encounter-lifecycle-compiler.ts`
- `packages/engine/src/facility-move-waiting-slot-migration-compiler.ts`
- `packages/engine/src/patient-template-location-admission-compiler.test.ts`
- `packages/engine/src/diagnosis-scoring.ts`
- `packages/schemas/src/index.ts`
- `packages/schemas/src/structured-patient-state-reveal-projection.test.ts`
- `packages/content-runtime/src/reviewer-policies.ts`
- `tools/content-cli/src/developer-database-knowledge.ts`
- `tools/content-cli/src/google-drive-sync.ts`
- `apps/web/src/components/DeveloperDatabaseKnowledge.tsx`
- `apps/web/src/components/PersonalKnowledgeWorkbench.tsx`
- `apps/web/src/components/ReceiptView.tsx`
- `content/catalogs/authoring/personal-knowledge/cross-reference-aliases.json`
- `content/catalogs/authoring/personal-knowledge/private-source-catalog.json`
- `content/catalogs/decision-policies/catalog.json`
- `content/catalogs/decision-policies/balances.json`
- `content/catalogs/medications/regimen-knowledge.json`
- `content/cases/review/database-driven-patient-generation.tickets.json`
- `content/cases/review/drive-reviewer-feedback-2026-07-27.tickets.json`

## Exact next action

1. Inspect the final beta diff and branch relation, commit the complete intentional checkpoint,
   push `beta`, and wait for its Node 22 verification workflow.
2. Promote the whole verified `beta` branch to `main`, push it, and require the main workflow's
   Player, 390-pixel, 320-pixel, and iPhone/WebKit assertions plus Pages deployment to pass. Do not
   represent the locally unsupported WebKit binary as a passing local test.
3. Return the checkout to `beta`, update this handoff with exact commits and remote relations, and
   start a verified local server whose URL can be handed to the user.
4. Treat the current adjunct MDD dimensions, severity, TSH, antidepressant-fit, and regimen
   combination packets as preliminary. They may expose missing typed owners or review questions,
   but cannot supply real profiles, probabilities, qualitative rules, balances, or points.
5. The next clinical decision remains
   `ticket.catalog.diagnoses.mdd-current-episode-finding-profile`. Do not invent its exact core
   constraint, total dimensional cardinality, manifestation groupings, or
   pessimism/suicidality roles. The source request is received, but the preliminary packet still
   requires canonical source-use validation and psychiatrist interpretation.
6. In the absence of that clinical decision, continue only bounded dependency work that is
   clinical-neutral. Current candidates are: formal-source metadata/rights registration;
   broad-category and unspecified diagnosis identities with explicit reviewed ancestry queued
   separately; real-owner inventory for source reports/action recipes; and audit of the eventual
   generated-to-review projection. Do not author a real patient template yet.
7. Real ED, inpatient-psychiatry, and consultation-liaison runtime locations remain deferred until
   their typed location, department, capability, service, formulary, disposition, action, and
   assignment owners exist. Setting labels never grant those resources.
8. Treatment-charge ownership, severity/specifier diagnosis validation, real finding/result/
   source/presentation content, SaveData, compatibility queue migration, IndexedDB, review/export
   projection, automatic Standard refill, Developer Patient Maker, and UI remain deliberately
   unactivated until one realistic source-controlled vertical is ready.

The sibling PsychSimDataAdjunct remains read-only and operates its own concept-first evidence
horizon; PsychSim tickets are inputs, not its queue authority. A general proposal may remain an
unmapped, hashed, medically unreviewed bundle. A proposal submitted for PsychSim incorporation
must add a separate mapping pinned to the current committed `beta` HEAD. The first safe
medication-regimen evidence mapping may name:

- `source-request.medications.regimen-combination-boundaries`;
- `ticket.source.canmat-mdd.inadequate-response-route`;
- `ticket.source.canmat-mdd.switch-transition-state`; and
- the exact target IDs already listed on that `SourceRequest`.

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

The deferred local Developer Patient Maker may eventually choose an exact template/recipe,
admitted care setting/location, and bounded complexity envelope and request one deterministic
patient from the canonical compiler. It must not bypass admission, expose hidden truth, or create
a parallel generator. Do not build it until the first realistic source-controlled generation
vertical is complete enough to audit.
