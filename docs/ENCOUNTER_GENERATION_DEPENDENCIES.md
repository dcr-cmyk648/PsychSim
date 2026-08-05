# Encounter-generation dependency readiness

Status: architecture audit only. This document records what reusable owners exist and which
missing-owner tickets block generalized patient generation. It is not a second ticket tracker,
clinical approval matrix, completion percentage, or runtime input. The referenced ticket files
remain authoritative for live status.

Last audited: 2026-08-03.

## Purpose

PsychSim is database-first. A reusable diagnosis dossier can help discover missing concepts, but a
patient generator must not hide those gaps in case-local prose. Generalized generation remains
disabled until one small but complete cross-cutting slice can resolve:

1. canonical typed facts;
2. a complete resolved patient state;
3. structured investigations and treatment choices;
4. reviewed decision policies and an explainable rubric; and
5. deterministic instance, replay, persistence, and migration boundaries.

This is a readiness topology, not a requirement to finish all of psychiatry before the first
generated encounter. MDD is the first deep knowledge vertical, but shared concepts exposed while
deepening MDD return to their general owners.

## Audit snapshot

The repository already has useful foundations:

- 115 stable registry entries;
- 40 universal information actions: 20 history, 6 physical, 10 laboratory, and 4 imaging/action
  identities;
- 31 service definitions and least-cost fulfillment;
- 9 diagnosis-family files;
- 125 medication identities, 13 compatibility medication definitions, and 6 supplement identities;
- 16 treatment choices: 13 nonmedication interventions and 3 dispositions;
- 14 test files: 6 numeric panels with 16 components that compile through the detached D-306
  authoring seam, plus 8 patient-owned result placeholders;
- one prototype, medically unreviewed adult reference-interval set;
- 5 cosmetic demographic pools containing 107 first names, 114 last names, 32 occupations, 8
  education values, and 12 neutral locations; one separate runtime-excluded race/ethnicity catalog
  containing the seven 2024 OMB minimum categories and no clinical weights; and
- compatibility schemas for reactions, regimen entries, prior trials, treatment history,
  clinical-context dimensions, deterministic replay, and IndexedDB persistence.

The most important duplication signal is in the current authored content. Across the five
approved/review `*.case.json` files, 621 nested finding occurrences use 186 finding IDs; 112 IDs
occur in more than one file. Depressive symptoms, anxiety, mania, psychosis, safety, adherence,
substance use, sleep, prior trials, and similar concepts are repeatedly authored inside cases.
The canonical finding-definition boundary now owns 50 identity-only, medically unreviewed
definitions, typed outcome semantics, explicit unresolved states, and contributor provenance. The
approved 37-candidate audit added only unambiguous identities, then the reviewer approved one
combined anhedonia identity at a decision-relevant granularity and one broad self-reported
fatigue/low-energy identity that does not replace its distinct possible contributors. The approved
source/time default then resolved grandiosity, impulsivity versus concrete behavior, preparatory
behavior timing, weapon access versus clinical concern, and reported versus observed thought
disorganization. Duration and subjective burden now route to target-scoped typed owners. Paranoia
now remains presentation/search vocabulary while suspiciousness or mistrust, ideas of reference,
and persecutory ideation resolve separately. Latent proposition truth, source-specific
patient-scene evidence, dependency handling, and belief appraisal route to a new point-free schema
foundation. D-247 adds the first MDD completeness identities for increased appetite, indecision,
worthlessness, and self-reported and observed psychomotor directions while preserving weight and
BMI as numeric measurements. D-248 adds a neutral pessimism identity. D-250 adds separate current
unintentional weight-gain and weight-loss findings without inferring change from one measurement.
These decisions
intentionally do not migrate or normalize case-local occurrences.

Other material gaps:

- only MDD currently has executable diagnosis-owned base rules; the other eight diagnosis files
  are primarily sparse identity dossiers;
- no diagnosis file currently has a populated specifier or comorbidity-relationship module;
- only one of the 13 compatibility medication definitions has fit modifiers;
- `PatientOpening.basicVitals` is still presentation text rather than typed measurements;
- the eight patient-owned tests have a D-307 exact authored-profile/result-contract compiler, but
  no real reviewed profiles or template-owned selection/attachment;
- `PatientDiagnosis` does not yet separate internal condition truth from chart diagnosis claims;
- `PatientRecord` still combines compatibility patient state with case-era generation/treatment
  references; and
- `PatientTemplate`, `PatientInstance`, and `EncounterInstance` now exist as a synthetic-only,
  runtime-excluded attachment boundary with exact recipe fingerprints and a point-free attached
  `CompiledRubric`; real dependency resolution, generation, persistence, and compatibility
  migration do not yet exist.

These are architecture facts, not claims that current prototype cases or saved attempts are
invalid. Existing `CaseBlueprint` and `CaseInstance` snapshots remain the compatibility path.

## Readiness matrix

| Layer                                                 | Existing reusable owners                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Missing blocking boundary                                                                                                                                                                                                    | Owning ticket                                                                                                                                                                                        |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity and governance                               | Stable IDs, registry, Zod versions, lifecycle, formal evidence, source-use decisions, Developer opinions                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Add registry kinds only when a real catalog is implemented; do not create empty parallel stores                                                                                                                              | Routed by each owner ticket                                                                                                                                                                          |
| Race/ethnicity demographic identity                   | D-265 runtime-excluded 2024 OMB minimum-category catalog; combined select-all-that-apply self-identification; exact source/source-use/Developer-opinion guardrails; migration-safe demographics v3; distinct provided/not-recorded/declined states; exact provided-category decision facts                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | No generation distribution or clinical modifier exists; future diagnosis mass, report effects, and pharmacology effects each require separate population-matched evidence/review and runtime activation                      | D-265 applied 2026-08-03                                                                                                                                                                             |
| Atomic findings                                       | Case-local compatibility plus versioned canonical definition, resolved value, contributor provenance, and permitted projection modes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Technical identity boundary complete; runtime compilation remains in its separate row/ticket                                                                                                                                 | `ticket.catalog.findings.canonical-definition-boundary` (resolved 2026-07-28)                                                                                                                        |
| General psychiatry findings                           | 50 identity-only canonical definitions, many compatibility IDs, 40 neutral reveal actions, typed weight/BMI measurements, separate current unintentional weight-change findings, and one reviewed point-free adult current-MDD nine-dimension profile                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Add separate real duration, impairment, exclusion, source/report, and presentation owners; continue input-driven substance, MSE, and physical identities without probabilities or scoring                                    | MDD profile ticket resolved 2026-07-31; route new gaps to their smallest exact owner                                                                                                                 |
| Latent propositions and patient-scene evidence        | Versioned point-free proposition, source-evidence, structural profile, dependency-group, belief-appraisal, and narrow resolved-state schemas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Runtime composition/reveal/decision use remains disabled; no generic Bayesian, credibility, or convergence engine                                                                                                            | `ticket.schema.patient-state.latent-proposition-evidence-foundation` (resolved 2026-07-28)                                                                                                           |
| Patient-scene source-instance identity                | D-291 `2.0.0` versioned source-role identity; definition/version/kind-stable opaque role ID with exact ownership retained by each patient horizon; deterministic compilation; canonicalized empty-or-bounded horizon; full fingerprint/replay artifact; generic patient/existence/source-kind validation; D-292 same-patient D-289 consumer with exact source-binding audit and derived D-290 projection; D-293 same-patient D-283 respondent consumer with exact kind validation and derived D-284 projection; D-294 base-patient D-264 duration consumer with exact source binding and separately retained composed-state reference; D-298 same-patient D-240 action/record/value consumer with redacted reveals; D-299 same-patient D-215 profile/projection/definition consumer with detached D-212 recipes; D-301/D-304 same-patient D-208 composed-state audit over all current typed source references with exact kind equality; D-302 same-patient D-193 consumer for every direct D-258 finding-report selection with exact slot/projection/source and optional-complexity trace; D-303 registry-validated runtime-excluded neutral role catalog covering all closed source kinds, including distinct collateral and record roles; D-305 authoring-only exact-catalog adapter deriving and freezing the same-patient D-291 horizon; zero credibility, accuracy, independence, action, or clinical semantics                                                                                                                                                         | Exact adapters from remaining post-D-208 source-bearing owners; patient/result attachment, persistence, and runtime                                                                                                          | D-291–D-294/D-298–D-305 applied 2026-08-03                                                                                                                                                           |
| Subjective response and wording                       | Versioned runtime-excluded expression banks, explicit source bindings, frozen contributor-preserving projections, D-220 exact neutral instrument/item response ownership, and D-221 complete-audit plus presentation-safe attachment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Real rights-reviewed instrument definitions/content, runtime integration, and compatibility migration remain disabled                                                                                                        | Presentation foundation plus D-220/D-221 tickets (resolved 2026-07-30)                                                                                                                               |
| Vitals, measurements, MSE, physical exam              | Runtime-excluded neutral vital/anthropometric definitions, typed categorical observation owners, resolved value/context/source envelopes; D-308 versioned exact authored measurement-value profile and same-patient D-305 source compiler with definition-owned units, allowed contexts, `not_interpreted`, full replay, and synthetic contract proof across all nine current definitions; D-309 exact authored categorical-observation value/compiler with clinician-observation source, empty interpretation, and synthetic MSE/physical domain proof while the real observation catalog stays empty; D-316 checked-in exact metric height/weight/BMI derivation definition plus authoring-only explicit-record D-310 compiler, complete input/formula replay, and detached uninterpreted output with no fabricated source/time owner; D-317 explicit derived-measurement provenance/resolution plus detached materialization using the selected weight record's time scope; D-318 exact noncyclic D-311 attachment beside the retained D-310 inputs with full D-316/D-317 replay; D-319 synthetic proof through the existing D-312/D-200/D-194/D-213/D-214 direct-measurement result path                                                                                                                                                                                                                                                                                                                                                                                 | Real measurement profiles/generation owners and ranges; reviewed production action mapping; sourced real categorical definitions/values or generation owners; real reviewed template recipe content; compatibility migration | `ticket.catalog.measurements.vitals-exam-foundation` (resolved 2026-07-28); D-308/D-309/D-316–D-319 applied 2026-08-03                                                                               |
| Tests and results                                     | One file per test; fixed/patient-defined numeric and categorical panels; binary, imaging, and electrical result contracts; UCUM/reference metadata; D-306 standalone exact-test/context/seed/reference/source compilation for generated numeric panels with full replay and six checked-in laboratory fixtures; D-307 versioned exact authored-result profile and contract/source compiler for patient-owned tests, proven across all eight current definitions with synthetic fixtures                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Real reviewed patient-owned profiles, exact recipe content, reviewed interval/generation content, production action routing, persistence, and runtime remain separate                                                        | Structured-result foundation plus D-306/D-307 applied 2026-08-03                                                                                                                                     |
| Detached clinical-result collection                   | D-310 exact same-patient, same-D-305-horizon canonical collection over replay-valid D-306 generated tests, D-307 authored tests, D-308 measurements, and D-309 categorical observations; complete upstream artifact retention; typed member audit; duplicate compilation/record rejection; full replay; checked-in TSH, pregnancy, and weight contract proof plus one synthetic observation; D-320 separate exact-template recipe with one-to-one typed direct and derived member bindings over the complete supplied D-310/D-317 set; D-321 makes that artifact the only D-311 result-set owner; D-322 finite exact mode-template recipe-coverage horizon with explicit missing coverage, orphan/duplicate rejection, and exact deterministic resolution; D-323 makes that horizon D-320 `2.0.0`'s only recipe owner and rejects the raw-recipe request; D-324 audits every bound recipe member against one finite exact test/interval/profile/measurement/observation/BMI/source resource set and preserves missing resources as diagnostics; D-325 binds complete selected-template coverage to the exact D-233/D-208 patient seed/context and compiles its catalog source horizon without producing values; D-326 consumes that context only and delegates exact direct result compilation, D-310 collection assembly, D-316/D-317 BMI, and D-320 template binding to the existing authorities                                                                                                                                                                           | Real reviewed recipes/profiles, persistence, runtime, action-result routing, and real result content remain separate                                                                                                         | D-310/D-320/D-321/D-322/D-323/D-324/D-325/D-326 applied 2026-08-03                                                                                                                                   |
| Detached clinical-result state attachment             | D-311 `3.0.0` exact D-208-plus-D-320 authoring attachment; D-310 and optional D-317 are derived only from the replay-valid exact-template recipe artifact; both template fingerprint schemes are cross-verified; successful same-patient composition; three empty base result lanes; complete upstream replay; exact changed-state fingerprint; raw collection bypass, caller-authored merge, derived-record collision, and recursive D-310 membership rejected; D-327 accepts D-326 only, derives its frozen D-208/D-320 pair, and delegates unchanged D-311 attachment with complete replay; D-328 derives the D-208/D-311 result branch from D-327 and delegates exact-common-root combination with optional D-294/D-292 to D-312; D-329 makes exact D-328 replay and D-233/D-208 equality mandatory for result-enabled D-200 `27.0.0` carry-through while preserving result-free D-312 paths                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Real reviewed recipes/profiles, D-213/D-214 production action-result definition, D-235 persistence, runtime orchestration, and real result content remain separate                                                           | D-311/D-318/D-321/D-327/D-328/D-329 applied 2026-08-03                                                                                                                                               |
| Compatibility result semantics and record attribution | D-276 optional versioned status-versus-qualified-value envelope; separate neutral/normal/abnormal/indeterminate/not-applicable interpretation; deterministic Reviewer-cohort adherence projection; D-277 exact current-regimen/prior-trial subject reference with blueprint/instance existence validation and finite medication-history attachment; D-278 typed current-medication reported-benefit record and exact neutral compatibility reveal; D-279 exact typed medication-tolerability record validation and finite compatibility projection; D-280 exact current-regimen medication-change temporal relationship with native/compatibility target separation and review-only restlessness projection; D-281 sparse exact current-regimen categorical dose position plus assessed-unknown compatibility proof                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Native persistence/UI consumption, other qualified compatibility-value migration, medication-specific maximum ownership, and causal-attribution projections remain separate                                                  | D-276/D-277/D-278/D-279/D-280/D-281 applied 2026-08-03                                                                                                                                               |
| Resolved patient state                                | Complete point-free snapshot composing internal conditions, chart claims, regimen/history/reactions, findings, measurements/tests, condition durations, D-314 source-validated condition-attributed functional impairments, and evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Real profile selection, action-result projection, runtime compiler, migration, and clinical inference remain disabled                                                                                                        | `ticket.schema.patient-state.resolved-record-foundation` (resolved 2026-07-28); D-314 lane integration applied 2026-08-03                                                                            |
| Target-scoped patient-value projection                | D-240 compiler `2.0.0`; singular exact action/value-kind/versioned semantic-owner/target-definition/source/time definitions for clinical duration, subjective burden, and condition-attributed functional impairment; D-261 exact duration-profile ID/version retention across compatibility and resolved/deferred state; D-262 runtime-excluded current-MDD 2–52-week within-state profile plus exact Presenting-problem definition and two-action static assembly; D-263 condition-duration resolver `1.0.0` with canonicalized unweighted option selection, complete draw/request/option audit, and deterministic replay; D-264 post-D-208 attachment with exact upstream replay, patient/condition matching, collision rejection, zero-input identity, and no second draw or complexity spend; D-266 historical D-200 `23.0.0` raw optional attachment; D-294 exact base-patient D-291 source existence/kind validation for newly attached durations with separately retained composed-state reference; D-295 historical D-200 `24.0.0` nullable D-294-only integration; absent/ambiguous/missing/complete evaluations; full authoring projection and target-redacted reveals; D-315 strict target/profile/option/source-instance-redacted impairment safe value; D-298 `2.0.0` independent same-patient D-291 source existence/kind validation for every complete D-240 action/record/frozen-value binding, including the hidden impairment source instance, with only redacted reveals carried forward; D-213 `3.0.0` definition-level coverage; D-214 safe attachment | Real reviewed impairment profile and exact action definition; exclusion owners; wording, persistence, and runtime                                                                                                            | D-240/D-241 tickets (resolved 2026-07-30); D-261–D-264/D-266/D-294/D-295/D-298/D-315 applied 2026-08-03                                                                                              |
| Condition-attributed functional impairment            | D-267 standalone exact profile/resolver schema; separate `none`/`mild`/`moderate`/`severe` identities; exact diagnosis/condition/source/time binding; D-379 resolver `2.0.0` preserving neutral uniform selection or one optional complete positive-integer weighted policy with exact source-kind/time-scope/care-setting applicability and normalized-probability audit; complete replay/fingerprint artifact; D-289 exact post-D-208 attachment envelope; D-290 strict minimized patient/record/level/source-kind/time projection; D-292 exact same-patient D-291 source existence/kind validation; D-314 canonical `ResolvedPatientState.functionalImpairments` lane with exact target/version/global-ID checks, D-312 `2.0.0` source-validated attachment, D-301 `3.0.0` whole-state source audit, and D-200 `27.0.0` seed-checked D-194/PatientInstance routing; D-315 D-240/D-298 `2.0.0` generic action-result projection/source-validation path with D-290-equivalent patient-safe redaction and D-213/D-214 routing proof                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Real reviewed source-conditioned profile/mass and exact action definition; MDD severity relationship; real D-291 source definitions; wording, persistence, and runtime                                                       | D-267/D-289/D-290/D-292/D-314/D-315 applied 2026-08-03; D-379 applied 2026-08-04                                                                                                                     |
| MDD generation severity and diagnosis presentation    | D-268 approved higher-of qualitative policy over separate symptom-severity and condition-attributed-impairment inputs; exact two-input schema validation; `family_only` player severity boundary; named `specifier.mdd.psychotic-features` identity; source/Developer-opinion split; all mild/moderate/severe levels remain disabled; D-269/D-297 standalone point-free same-episode higher-of compiler `2.0.0` with strict external symptom-owner envelope, native D-267 replay verification, exact same-patient D-291 source existence/kind proof, detached descriptor, raw-D-267-only rejection, and complete replay/fingerprint audit                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Exact symptom-severity owner and level boundaries; real impairment profile and action-result attachment; enabled severity-ID mapping/attachment; psychotic-feature finding/route content; qualifier UI                       | `ticket.source.mdd.severity-generator-policy` (resolved/applied 2026-08-03); D-269/D-297 applied 2026-08-03; `source-request.mdd.severity-thresholds` remains source_received                        |
| Structured non-finding reveal projection              | Closed chart/regimen/exposure/trial/provider/level-of-care/tolerability/current-medication-benefit/current-medication-dose-position/medication-change-temporal/reaction lanes plus reaction/safety singleton fields; D-278 sparse exact-regimen patient-reported benefit with explicit none versus assessed-unknown semantics; D-280 exact source/time/target medication-change relationship; D-281 sparse exact-regimen dose position with below/at/unknown semantics; exact action fingerprint, patient/source/time/claim/dependency references; included/omitted truth audit; D-214 safe view; D-215 whole-lane compiler; D-217 `2.0.0` fixed/weighted plus D-257 D-201-backed `complexity_gated` source selection; D-218 exact final-state attachment across all four care settings; D-299 independent same-patient D-291 validation of every selected D-215 profile/projection source with detached D-212 recipes retained                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | D-299 integration decision if required; real reviewed aligned/inaccurate profiles and module costs/frequencies; altered fields or false-positive records; wording, persistence, and runtime                                  | D-217/D-218 tickets plus `ticket.engine.patient-generation.source-report-complexity-gating` (resolved 2026-08-03); D-278/D-280/D-281/D-299 applied 2026-08-03                                        |
| Universal information-action result recipes           | Exact versioned action catalog; one recipe and normalized evaluation per action; deterministic D-213 `3.0.0` routing across D-193, D-212, D-240, measurement, observation, structured-test, and exact D-220 instrument-response owners; target-scoped N/A/missing/ambiguous semantics; explicit incomplete coverage; replay and tamper validation; D-214 attachment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Real catalog recipes/source profiles, persistence, and runtime generation                                                                                                                                                    | D-213/D-214/D-221/D-241 tickets (resolved 2026-07-30)                                                                                                                                                |
| Verified action-result attachment                     | `attachment_only.v6`; assembly v3; exact template/location/encounter setting; catalog compiler/D-194 `9.0.0` requires the complete exact D-222 → D-219 operational chain, verifies nullable D-217, runs D-215/D-220/D-240 after final truth, supplies complete D-213 `3.0.0`, derives D-214 bindings/safe views, and replays through D-200 `27.0.0` without another complexity charge                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Real source profiles and action recipes; persistence, compatibility migration, and runtime generation                                                                                                                        | D-218/D-219/D-221/D-224/D-225/D-227/D-228/D-229/D-230/D-231/D-232/D-233/D-241/D-314/D-329 tickets (resolved through 2026-08-03)                                                                      |
| Instrument response and administration ownership      | D-220 `instrument-item-response-only.v1` definitions/compiler; minimized action horizon; exact owner/scale/option/action/source/time/rights checks; D-221 root+nested audit retention and D-213/D-214 item-response binding; D-282 exact patient/source complete-or-partial administration and bounded authored raw-total owner; D-283 authoring compiler `1.0.0` with exact D-220 verification, response-versus-missing partition, structural-gap rejection, normalized fingerprints, and replay; D-284 strict item/source-redacted administration projection with exact reprojection; D-293 exact same-patient D-291 respondent existence/kind validation with derived D-284 projection; D-296 D-285/D-286 `2.0.0` D-293-only frozen-context and exact-D-194-snapshot admission with raw-D-283 rejection; zero wording, calculation, interpretation, scoring, or complexity authority                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Real lawful instrument owners; versioned `PatientInstance`/result attachment; score validation/interpretation; persistence and runtime generation                                                                            | D-220/D-221 attachment ticket (resolved 2026-07-30); D-282/D-283/D-284/D-285/D-286/D-293/D-296 applied 2026-08-03                                                                                    |
| Encounter care-setting attachment                     | Closed outpatient-psychiatry, emergency-department, inpatient-psychiatry, and consultation-liaison coordinate; one setting per template; exact template/location/encounter equality; frozen identity/replay; zero complexity cost and no implicit grants                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Real ED/inpatient/consultation-liaison locations plus typed capability, action, service, formulary, disposition, queue, persistence, and UI horizons                                                                         | `ticket.engine.patient-generation.encounter-care-setting-attachment` (resolved 2026-07-30)                                                                                                           |
| Mode/lifecycle template horizon                       | D-231 compiler `1.0.0`; strict explicit approved lane for Standard/Endgame; approved plus explicit review lane for local Developer; exact stable-ID/version and full-payload fingerprints; independent medical-review audit; deterministic replay; no setting/pool/resource/history/weight/point/complexity filtering                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Runtime persistence/activation; D-231 intentionally stays static while D-234 owns exact Developer run history separately                                                                                                     | `ticket.engine.patient-generation.mode-lifecycle-template-horizon` (resolved 2026-07-30)                                                                                                             |
| Minimized clinic operational context                  | Strict `clinic-operational-context.v1`; pure projection from ClinicState; exact clinic/facility/tier, built locations/departments, upgrade/equipment/formulary ownership, and staff configuration only; volatile label/active-location/global-capability/points/debug/satisfaction fields excluded; exact fingerprint and strict parsing                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Persisted assignment lifecycle and compatibility migration; any new mutable ClinicState input requires an explicit versioned decision                                                                                        | `ticket.engine.patient-generation.minimized-clinic-operational-context` (resolved 2026-07-30)                                                                                                        |
| Encounter operational admission                       | D-219 `3.0.0` consumes one exact complete D-222 artifact; exact template/location/care-setting/action-horizon/action-catalog context; selected-location capability, service-method, formulary, medication-start, current-regimen, intervention, and disposition evaluations; itemized incomplete coverage; D-194/D-200 retention and current-context replay; zero complexity/scoring/economy authority                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Real setting-specific owners/assignments; compatibility/save migration; generated queue, persistence, and UI                                                                                                                 | Operational-admission plus D-224/D-227 tickets (resolved 2026-07-30)                                                                                                                                 |
| Selected-location operational resources               | D-222 compiler `3.0.0`; strict minimized clinic operational context; complete clinic-wide assignment horizon; one assignment per built location; exact upgrade/formulary membership fingerprints; exclusive/shared placement; exact facility/location/department/ownership/staff/formulary validation; no clinic-global union; all four settings; replay and diagnostics                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Persisted real assignment lifecycle and owners; compatibility/save migration; generated queue, persistence, and UI                                                                                                           | Selected-location plus D-224/D-227 tickets (resolved 2026-07-30)                                                                                                                                     |
| Template/location admission matrix                    | D-226 compiler `3.0.0`; verified D-231 as sole template source; strict minimized clinic operational context; complete current template × built-location matrix; D-222 once per location; exact compatible-location/care-setting/action-horizon/assembly and D-219 checks; stale-reference and nonblocking coverage diagnostics; all four care settings; zero selection/complexity/clinical authority                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Real non-outpatient location/resource owners; compatibility SaveData/runtime orchestration and activation                                                                                                                    | D-226/D-227/D-229/D-230/D-231/D-232 tickets (resolved 2026-07-30)                                                                                                                                    |
| Admitted template/location binding                    | D-228 compiler `2.0.0`; caller-named diagnostic-free admitted D-226 cell; complete current-matrix replay; compact exact template/location/pool/setting plus D-222 reference and complete D-219 proof; nested under D-233/D-230/D-229/D-200 `24.0.0`; all four settings; zero draw, seed, probability, complexity, scoring, economy, persistence, or runtime authority                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Real setting-specific owners; compatibility/save migration and runtime activation                                                                                                                                            | `ticket.engine.patient-generation.admitted-template-location-binding` (resolved 2026-07-30)                                                                                                          |
| Location-owned admitted-cell selection certificate    | D-229 compiler `2.0.0`; exact physical-location slot coordinate; exhaustive sorted diagnostic-free admitted D-226 horizon for that location; caller-selected local evaluation; nested D-228; empty/cross-location rejection with no global fallback; all four synthetic settings; no mode/draw/weight/repeat/seed/refill/persistence/points/probability/complexity authority                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Consumed only through D-230 plus D-232 capacity authorization; real non-outpatient owners; runtime activation of D-234 lifecycle                                                                                             | D-229/D-232 tickets (resolved 2026-07-30)                                                                                                                                                            |
| Local template distribution selection                 | D-230 selector `3.0.0`; exact all-admitted, Developer-unrun, or same-template eligibility overlay before weights; exact location/profile/template pins; positive question-bank weights; active/recent stable-ID suppression once each and never zero; exact integer mass/probability audit; deterministic 64-bit slot-local draw; frozen local repeat snapshot; nested D-229/D-228; consumed through D-233/D-200 `24.0.0`; no complexity/points/persistence authority                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Real non-outpatient owners; compatibility persistence and runtime activation                                                                                                                                                 | D-230/D-232/D-233/D-234 checkpoints (resolved 2026-07-30)                                                                                                                                            |
| Exact-location slot capacity and facility-move proof  | D-232 capacity compiler/certificate `1.0.0`, migration compiler `3.0.0`; separate exact-location base/upgrade capacity profile; minimized capacity ownership/assignment; stable authorized coordinates; D-233 wraps the compact D-230 capacity certificate for D-200 `24.0.0`; separate successor profile; atomic no-reroll migration preserving patient/seed/template/historical D-233 authority and attaching current target D-226/D-228 proof                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Capacity-upgrade content; SaveData/runtime queue migration; facility-purchase commit; persistence/refill/UI                                                                                                                  | `ticket.engine.patient-generation.location-capacity-facility-move-migration` (resolved 2026-07-30)                                                                                                   |
| Empty-slot occupancy and patient-seed authority       | D-233 occupancy `1.0.0`, seed-authority `2.0.0`, and D-331 atomic-fill `3.0.0`; private per-mode generation root; exact first-empty coordinate and monotonic ordinal; domain-separated template/patient seeds; one patient seed across D-223/D-197/D-198/optional D-199/D-193/D-194/optional D-217/final patient; direct result-free D-200 compatibility or exact D-324-to-D-330 result orchestration; successful D-324/D-330/final-audit retention; valid incomplete coverage becomes one blocked ordinal without partial orchestration; exact filled-or-blocked replay; unrelated-slot immutability                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | SaveData/runtime persistence and activation; later explicit D-233 retry may resume a blocker-advanced empty occupancy                                                                                                        | `ticket.engine.patient-generation.empty-slot-fill-seed-authority` plus D-331 (resolved/applied through 2026-08-03)                                                                                   |
| Post-encounter location-slot lifecycle                | D-234 transition/reconciliation `2.0.0`; exact frozen patient plus embedded native D-235 attempt proof; D-377 first checked-in generated-MDD diagnosis/structured-history attempt bound to its exact waiting slot, patient, template, and terminal event through that proof; D-378 exact completed-patient transition into one coordinate vacancy and one bounded history record retaining the complete attempt; unique replayed completion identities; exact-coordinate vacancy; bounded duplicate-preserving mode/location history; Endgame/Developer selected-location skipped refresh; exact-version Developer completed/active exclusion, dynamic exhaustion, and same-template rerandomization; one root/profile/current matrix; canonical generic refill, preserved earlier success, and explicit blocker-bound retry transcript                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Real seed-dependent clinical-payload rebuild for canonical refill; Standard automatic runtime refill; SaveData/compatibility queue migration, browser persistence, runtime activation, and UI                                | D-234/D-235/D-377/D-378 resolved/applied                                                                                                                                                             |
| Native generated completed attempt                    | D-235 compiler `11.0.0`; compact replay snapshot derived from exact D-200 waiting patient; native patient/encounter, contiguous events, D-242 full player/reference decision snapshots, D-252/D-255 minimized exact balance snapshot v2 plus full source-catalog fingerprint, D-272 minimized exact diagnosis-qualifier owner set and validation, D-374 first nonempty checked-in MDD family horizon plus replayed optional family-level submission, D-375 three native structured-history purchase/result-binding/service-quote events beside that diagnosis, D-376 exact timestamp-separated persistence-record/JSON replay of that complete attempt, natively derived complete player/database-plan traces, D-239 native versioned information-service quotes, D-270 exact service-backed intervention/disposition quotes and replay, D-271 exact template-economy/clinic-state/satisfaction owner context and settlement replay, D-244 three-outcome triggered-prerequisite balance/replay, D-255 direct required/preferred information-action balance/replay, D-245 exact native rule combination, generated point-report v7, replay/attempt v5, settlement v4, deterministic fingerprints, timestamp-separated persistence wrapper, and D-234 v2 context verification                                                                                                                                                                                                                                                                                                  | Real template economy-policy records; SaveData/runtime queue migration; IndexedDB, review/export, Standard refill, qualifier UI, and UI activation                                                                           | Native-attempt ticket resolved 2026-07-30; D-238/D-239/D-242/D-244/D-245/D-252/D-255/D-270–D-272/D-374–D-376 applied                                                                                 |
| Substance/background exposure                         | Medication/supplement identity reuse; four neutral other-substance identities; coarse source/opinion-backed misuse-prior contract; unified positive-use inventory                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Runtime rate profiles, count/allowlist calibration, evidence projections, intoxication/withdrawal, diagnosis, and clinical inference remain separate                                                                         | `ticket.catalog.exposures.substance-use-foundation` (resolved 2026-07-28)                                                                                                                            |
| Medication and intervention knowledge                 | Medication identities, 13 compatibility definitions, stable treatment/disposition files, modality-only therapy selection, explicit point-free regimen classes/memberships/routes/contributor bins; D-237 exact reviewed five-agent MDD class and one-start route                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Author reviewed medication relationships, pair safety, withdrawal, duplication, therapy efficacy/combination/redundancy/capability, and balance                                                                              | Medication/intervention structure resolved 2026-07-28; first native MDD route added 2026-07-30                                                                                                       |
| Dispositions and service access                       | Three dispositions, facility/capability/service catalogs, safe referral                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Current identities are sufficient for the first foundation; split or expand only when a focused policy exposes a real missing owner                                                                                          | Coverage ticket when encountered                                                                                                                                                                     |
| Diagnosis dossiers                                    | Nine family files, MDD base rules, qualitative composition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Deepen MDD and related dossiers only after shared concepts point to general owners                                                                                                                                           | Database-first review queue and source-specific tickets                                                                                                                                              |
| Decision and scoring policy                           | D-191 `3.0.0` runtime-excluded point-free compiler; one pinned primary route; exact typed full-state/action matching; scan/index equivalence; frozen compiled-rubric provenance; nonblocking diagnostics; D-237 real MDD route; D-238 separate +200 balance; D-242 exact player/reference decisions; D-243 distinct trigger/fulfillment contract and adapter; D-244 separate +35/-25 and +30/-40 three-outcome treatment-triggered balances; D-255 direct required +35/-35 and +50/-50 outcomes plus preferred +30/0 substance-history balance; D-245/D-252/D-255 native balance `6.0.0` exact-target combination plus minimized exact balance snapshot v2 and full source-catalog fingerprint                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Attach exact real MDD generation/result/source dependencies; add exact typed owners for mania and safety triggers before balancing them                                                                                      | D-191 resolved 2026-07-28; D-237/D-238/D-242/D-243/D-244/D-245/D-252/D-255 applied                                                                                                                   |
| Fact compilation                                      | D-193 `1.2.0` point-free exact-candidate reconciliation; one canonical result per definition; stable hard-conflict output; explicit all/any action/instrument projections; source/time-filtered proposition evidence; deterministic version-pinned wording; one optional reviewed closed-assessment absence fallback applied only after no approved value-bearing candidate exists; D-258 exact D-201-backed patient-report projection selection after truth freezes; inactive governed projections cannot affect negative closure; open-world missing and explicit unresolved remain nonnegative; D-259 real 17-finding/49-mapping depressive-symptom projection catalog; D-260 exact set horizon plus current-payload D-213 static assembly; integrity fingerprints                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Reviewed inaccurate-report profiles, functional-impairment patient-state/result projection, exclusion result owners, exact PatientTemplate binding, persistence, and runtime activation remain disabled                      | Shared-finding compiler resolved 2026-07-29; D-256/D-258 extensions and D-259/D-260 first real result content applied 2026-08-03                                                                     |
| Target instances and persistence                      | Synthetic-only versioned `PatientTemplate → PatientInstance → EncounterInstance`, exact location/horizon/result/finding/rubric attachments, compiler/seed/payload integrity; compatibility saves remain unchanged                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Real dependency resolution, presentation generation, queue/save migration, compatibility mapping, and historical replay                                                                                                      | `ticket.engine.patient-generation.catalog-compiled-instances` (resolved 2026-07-29)                                                                                                                  |
| Transitional Developer Patient Maker                  | D-274 local-only finite allowlist of completely validated approved/review CaseBlueprints with measured authored complexity; exact-budget filtering; ordinary deterministic CaseInstance/eligibility path; reserved persisted Developer slot; desktop/mobile browser reload proof                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | It does not exercise PatientTemplate, D-201 optional-module materialization, D-200, or generated SaveData; retire/replace only after one real generated vertical                                                             | D-274 compatibility bridge (resolved/applied 2026-08-03)                                                                                                                                             |
| Launcher presentation                                 | D-273 standalone resolver `1.0.0`; exact reviewed profile; curated first/last-name pools; literal 25% middle-initial policy; reusable short chief-complaint banks; explicit same-priority mixing or higher-priority override; six independent stable draws; complete audit and minimized seed/diagnosis/rule/point-free resolved presentation; deterministic replay; D-287 exact verified-D-194 adapter deriving patient identity and seed without caller replacement authority; D-332 real runtime-excluded catalog with three reusable banks, 48 short variants, one Developer-approved cosmetic MDD profile, exact existing name-pool references, equal-priority/equal-weight mixing, medically unreviewed bank status, and strict no-clinical/no-runtime boundary validation; D-333 exact successful-D-331-fill-to-D-287 attachment with frozen slot/patient references, minimized fingerprinted presentation, caller-authority rejection, and complete replay                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Persisted/runtime waiting-slot and historical-attempt projection; SaveData migration; launcher UI activation                                                                                                                 | D-273/D-287/D-332/D-333 detached authoring checkpoint (resolved/applied 2026-08-03)                                                                                                                  |
| Presentation richness                                 | Template-owned point-free decision-driver categories and prior-effort expectation; exact frozen-domain counts/IDs; nonblocking shortfall/exception diagnostics; root snapshot integrity attachment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Calibrated generation profiles that create the underlying records; no scoring, rejection, or optional selection is authorized                                                                                                | `ticket.engine.patient-generation.presentation-richness-envelope` (resolved 2026-07-29)                                                                                                              |
| Template condition selection                          | Standalone exact-template profile; explicit game-only count/candidate weights; deterministic selection without replacement; complete selected/unselected draw, state, binding, provenance, conflict, and fingerprint trace                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Real condition-profile content, composer attachment, deterministic retry orchestration, finding generation, persistence, and runtime activation                                                                              | `ticket.engine.patient-generation.template-condition-selector` (resolved 2026-07-29)                                                                                                                 |
| Condition finding/cardinality selection               | Exact selected-state/profile binding; reviewed fixed outcomes and bounded count/member draws; complete selected/unselected, provenance, unbound-coverage, and fingerprint trace; exact D-193 positive candidate output; checked-in current-MDD profile with five-to-nine dimensions and a mood/anhedonia core constraint; D-256 sparse-positive semantics prohibit routine negative candidates for unselected manifestations; D-259 supplies the first exact downstream 17-finding compact assessment horizon without D-198 baselines or truth mutation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Reviewed inaccurate-report profiles, additional diagnosis profiles, manifestation-coexistence distributions, exact PatientTemplate binding, persistence, and runtime activation                                              | Selector resolved 2026-07-29; first real MDD profile resolved 2026-07-31; D-256/D-258/D-259 applied 2026-08-03                                                                                       |
| Background finding selection                          | Exact bounded horizon and one reviewed profile per finding; deterministic game-only outcome draw; complete offered/selected/provenance/fingerprint trace; one lowest-priority D-193 candidate per target                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Real background profiles, multi-contributor soft-tendency aggregation, composer attachment, persistence, and runtime activation                                                                                              | `ticket.engine.patient-generation.background-finding-outcome-selector` (resolved 2026-07-29)                                                                                                         |
| Weighted soft-finding aggregation                     | Exact complete mutually-exclusive outcome vectors; nonnegative baseline/contributor mass; pooled and normalized probability trace; target-stable draw; exact D-210-only applicability/review/provenance; one D-193 weighted candidate                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Real contributor profiles, persistence, and runtime activation                                                                                                                                                               | D-199/D-211 tickets (resolved 2026-07-29)                                                                                                                                                            |
| Whole-state tendency applicability                    | Verified composed D-208 state plus genuine D-198 target context; complete approved-definition semantic scan; exact typed and same-record matches; one D-199-ready binding maximum per definition; exact profile/target/version and record provenance; D-200 attachment, zero-match audit, and replay                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Real applicability/profile content, persistence, and runtime activation                                                                                                                                                      | D-210/D-211 tickets (resolved 2026-07-29)                                                                                                                                                            |
| Finding-pipeline audit composition                    | D-200 `24.0.0` accepts one exact D-233 seed authority plus one D-223 root; derives D-230/D-232 and exact historical template/location/D-219 through D-233 and genuine nested D-208 state; requires the one patient seed across D-223/D-197/D-198/D-210/optional D-199/D-193/D-194/optional D-217/final patient; substitutes selected D-249 texture only for its exact D-198 baseline; exact D-208/D-217/D-258 source-report artifact equality and complete module-union coverage; exact cross-artifact equality, independent current-resource replay, collision-free candidate union, or typed upstream blocker; no second budget authority                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Real profile content, other optional-module payloads, action/result recipes, persistence policy, and runtime activation                                                                                                      | D-200/D-204/D-209/D-211/D-225/D-227/D-228/D-229/D-230/D-231/D-232/D-233/D-234/D-249/D-258 checkpoints                                                                                                |
| Optional-feature budget selection                     | D-275 versioned complexity contract: exact historical v1 envelope plus v2 recipe-owned required-state baseline, zero-to-96 optional maximum, up to 24 independently traced modules, one-to-twelve exact-template costs; D-201 selector `3.0.0`; explicit feasible count; deterministic selection without replacement; remaining-budget and incompatibility look-ahead; complete selected/unselected, baseline, spent/unspent, binding, draw, and review audit                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Real reviewed v2 module/profile content and costs; compatibility migration, persistence, runtime activation, and later calibrated display/difficulty mapping                                                                 | `ticket.engine.patient-generation.optional-feature-budget-selector` (resolved 2026-07-29); D-275 scalable contract applied 2026-08-03                                                                |
| Optional-comorbidity budget bridge                    | Bounded bijective exact-template module-to-condition mappings; D-201-only membership; D-196 configuration audit; authored required plus selected optional condition state/bindings; exact incompatibility and replay trace                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Real reviewed mappings, other optional-module payloads, compatibility, and persistence                                                                                                                                       | `ticket.engine.patient-generation.optional-comorbidity-budget-bridge` (resolved 2026-07-29)                                                                                                          |
| Optional reaction-history budget bridge               | Every reaction module mapped to one complete typed history; pairwise D-201 incompatibility; exact typed reference horizon; zero-or-one materialization with original ordinal/draw and unchanged budget audit; deterministic replay                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Required/base-state composition, real mappings/costs/frequencies, reveal compilation, clinical interpretation, compatibility, persistence, runtime                                                                           | `ticket.engine.patient-generation.optional-reaction-history-bridge` (resolved 2026-07-29)                                                                                                            |
| Optional prior-treatment budget bridge                | Every prior-treatment module mapped to one nonempty additive four-lane record contribution; compatible multi-module union by globally unique record ID; exact medication/intervention horizon; original ordinals/draws and unchanged budget audit; deterministic replay                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Core-plus-optional composition, real mappings/costs/frequencies, trial-schema evolution, reveals, compatibility, persistence, runtime                                                                                        | `ticket.engine.patient-generation.optional-prior-treatment-bridge` (resolved 2026-07-29)                                                                                                             |
| Optional exposure budget bridge                       | Every `substance_use` module mapped to one nonempty additive positive-use contribution; compatible union by globally unique record and semantic-agent identity; exact medication/supplement/other-substance horizon; same-agent exact-version plus D-201 incompatibility; original ordinals/draws and unchanged budget; deterministic replay                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Core-plus-optional inventory composition, real mappings/costs/frequencies, source-report/reveal generation, clinical interpretation, compatibility, persistence, runtime                                                     | `ticket.engine.patient-generation.optional-exposure-budget-bridge` (resolved 2026-07-29)                                                                                                             |
| Optional source-report complexity routing             | D-257 `source_report` module kind; accurate zero-cost base; D-208 deferred-post-truth audit; D-217 `2.0.0` exact D-201 module/binding/profile mapping for D-215 structured non-finding lanes; D-258 D-193 `1.2.0` exact D-201 module/binding/projection mapping for canonical finding reports; same-slot collision rejection; active-projection-only D-256 closure; D-200 `24.0.0` exact artifact equality and complete union coverage; no second draw or charge; D-373 fixed authoring-only accurate patient-report profiles for current medication regimen, longitudinal reaction history, and longitudinal substance-use history with exact empty/unassessed semantics; D-374 fixed-mode omission of the absent optional-feature field and lossless generated-attempt JSON replay; D-375 native purchase/result-binding/quote replay for all three checked-in profiles                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Additional reviewed accurate profiles where needed; inaccurate/partial profiles and real module costs/frequencies; false-positive structured-record support; persistence and runtime activation                              | Source-report complexity and finding-projection bridge tickets resolved 2026-08-03; first accurate profile tranche D-373, JSON-safe attempt proof D-374, and purchase proof D-375 applied 2026-08-04 |
| Core-plus-optional patient-state composition          | One exact D-201 artifact verified across genuine condition, reaction, prior-treatment, exposure, finding-texture, and deferred source-report owners; explicit reaction-default replacement; additive history/exposure; exact-once module and budget audit; collision rejection; deterministic pre-finding state or typed incomplete coverage; exact D-200/D-194 attachment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Real module content/costs/frequencies, compatibility migration, persistence, runtime generation                                                                                                                              | D-208/D-209/D-249/D-257 tickets                                                                                                                                                                      |
| Pre-finding patient-state orchestration               | D-223 orchestrator `2.0.0`; one exact D-201 selection/spend; required-only D-196 versus D-202 from the complete comorbidity horizon; complete nullable D-205/D-206/D-207/D-249 lane audits; explicit reaction ownership; genuine D-208 `2.0.0` composed/not-composed output; one D-233 patient seed and D-200 `24.0.0` attachment; no reroll/refund; exact replay and all-four-setting neutrality                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Real module/profile content; compatibility/save migration; generated queue, persistence, and runtime activation                                                                                                              | D-223/D-225/D-228/D-229/D-230/D-231/D-232/D-233/D-249/D-258 attachment tickets (resolved 2026-08-03)                                                                                                 |
| Optional finding-texture bridge                       | D-249 synthetic authoring bridge; exact `finding_texture` module/profile/horizon mapping; original D-201 draw and unchanged spend; D-208 materialization audit without early canonical findings; exact D-198 substitution in D-200; D-197 hard precedence; same-target D-199 collision rejection; integrity/context replay                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Real reviewed texture modules, mappings, and variety distributions; compatibility/persistence/runtime activation                                                                                                             | `ticket.engine.patient-generation.optional-finding-texture-bridge` (resolved 2026-07-31)                                                                                                             |
| Resolved condition source                             | Strict genuine-D-196-or-D-202 source union; native verification/reference; complete source retained and verified by D-197 and D-200; exact D-194 state/binding attachment; no provenance conversion, draw, budget recalculation, or selected-module runtime attachment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Another source kind, other optional-module payloads, compatibility, and persistence                                                                                                                                          | D-203/D-204 tickets (resolved 2026-07-29)                                                                                                                                                            |
| Generated cohorts                                     | Cosmetic variants and finite compatibility/reviewer cases                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Runtime composition, seed sweeps, richness calibration, and generated queues                                                                                                                                                 | Intentionally deferred until every prior gate is coherent                                                                                                                                            |
| Post-composition patient-state assembly               | D-312 `2.0.0` exact common-root assembly over replay-valid D-294 duration, D-292 source-validated functional-impairment, and D-311 result attachments; empty D-208 owned lanes; nonoverlapping lane copies; complete upstream retention and replay                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Exact template/profile selection, persistence, runtime, action-result routing, and real reviewed content remain separate                                                                                                     | D-312/D-314 applied 2026-08-03                                                                                                                                                                       |
| D-200 post-composition integration                    | D-329 D-200 `27.0.0` integration plus D-330 whole-chain authoring orchestration; exact D-223/D-208 root equality; nested duration and impairment seed audit; exact D-328 plus nested D-233 authority required whenever D-311 results are present; null and direct result-free D-312 compatibility paths retained; one schema-valid result-free D-200 request scaffold plus exact D-324 coverage may derive D-325/D-326/D-327/D-328 before the only final D-200 compile; assembled duration/impairment/result state routed through unchanged D-194; complete orchestration/assembly retention and replay; raw result-enabled D-312 input, direct branch input, prebuilt D-328 input, and prepopulated null-route lanes rejected                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Real profile/template selection, persistence, runtime activation, player-facing result mappings, and real reviewed content remain separate                                                                                   | D-313/D-314/D-329/D-330 applied 2026-08-03                                                                                                                                                           |

D-334 closes the real action-result mapping portion of the vitals/measurement row for
`info.physical.weight-bmi`. The checked-in runtime-excluded assembly pins the exact canonical
height, weight, and BMI definitions and reuses the existing D-213/D-214 measurement route. Real
height/weight profiles or generators, body-habitus observation, ranges and interpretation,
template selection, persistence, and runtime activation remain missing.

D-335 closes only the reusable generated-measurement compiler gap. It defines reviewed,
context-selected weighted support-band profiles and freezes one uninterpreted value through
separate stable band/value draws with exact source and replay provenance. No real profile or
distribution is checked in, and the D-320 recipe/member model still admits only D-308 authored
measurement profiles, so generated-measurement template ownership remains a later explicit
migration.

D-336 advances D-310 to collect replay-valid D-335 output without erasing its origin. Generated
measurements receive their own collection-member discriminant while sharing the typed numeric
measurement lane. D-320 still rejects inferred generated-measurement recipe ownership, so D-324
resource coverage and D-326 materialization remain unchanged.

D-337 closes that structural ownership seam explicitly. D-320 now has a distinct
`generated_measurement` member that requires the complete exact D-335 profile horizon, D-324
audits each profile resource, and D-326 invokes D-335 from the exact D-325 seed and context before
using the unchanged D-310/D-316/D-317 chain. The authored D-308 member remains separate. Real
height/weight distributions, ranges, interpretation, and body-habitus observation are still
missing clinical-content owners.

D-338 closes the existing reviewed MDD antidepressant/mania-history scoring seam without adding
generation content. The native diagnosis rule now pins the exact approved initial-antidepressant
class, the adapter expands its complete membership horizon to concrete starts, and the separate
three-outcome balance scores fulfillment or omission. The legacy tag predicate remains isolated
to compatibility cases; a real generated encounter still needs the unresolved patient/result and
runtime owners elsewhere in this inventory.

D-339 closes the existing reviewed passive-death-wish/detailed-safety-assessment scoring seam
without adding generation content. The rule pins one exact present canonical finding outcome, the
native adapter preserves that fact beside the primary-route scope, and the separate direct
information balance scores obtained or omitted assessment. The compatibility tag remains
isolated; risk formulation, disposition logic, and generated runtime activation remain open.

## Ordered blocking queue

The general dependency gate depends on the following work in this order:

1. `ticket.catalog.findings.canonical-definition-boundary` (resolved 2026-07-28)
2. `ticket.catalog.findings.general-psychiatry-seed` (resolved 2026-07-28)
   - anhedonia, fatigue/energy, mechanical source/time, behavior/interpretation, and typed-value
     owner boundaries resolved; paranoia/content identities resolved; 50 definitions after the
     D-247 identity-completeness pass, D-248 pessimism shell, and D-250 weight-change split
3. `ticket.schema.patient-state.latent-proposition-evidence-foundation` (resolved 2026-07-28)
4. `ticket.catalog.findings.subjective-presentation-projection-foundation` (resolved 2026-07-28)
5. `ticket.catalog.measurements.vitals-exam-foundation` (resolved 2026-07-28)
6. `ticket.catalog.tests.structured-result-foundation` (resolved 2026-07-28)
7. `ticket.schema.patient-state.resolved-record-foundation` (resolved 2026-07-28)
8. `ticket.catalog.exposures.substance-use-foundation` (resolved 2026-07-28)
9. `ticket.catalog.interventions.identity-and-fidelity` (resolved 2026-07-28)
10. `ticket.catalog.medications.normalized-regimen-risk-benefit` (resolved 2026-07-28)
11. `ticket.engine.decision-policy.catalog-compiler` (resolved 2026-07-28)
12. `ticket.engine.patient-generation.shared-finding-compiler` (resolved 2026-07-29)
13. `ticket.engine.patient-generation.catalog-compiled-instances` (resolved 2026-07-29)
14. `ticket.engine.patient-generation.presentation-richness-envelope` (resolved 2026-07-29)
15. `ticket.engine.patient-generation.template-condition-selector` (resolved 2026-07-29)
16. `ticket.engine.patient-generation.condition-finding-cardinality-selector` (resolved
    2026-07-29)
17. `ticket.engine.patient-generation.background-finding-outcome-selector` (resolved 2026-07-29)
18. `ticket.engine.patient-generation.weighted-finding-tendency-aggregator` (resolved 2026-07-29)
19. `ticket.engine.patient-generation.finding-pipeline-audit-composer` (resolved 2026-07-29)
20. `ticket.engine.patient-generation.optional-feature-budget-selector` (resolved 2026-07-29)
21. `ticket.engine.patient-generation.optional-comorbidity-budget-bridge` (resolved 2026-07-29)
22. `ticket.engine.patient-generation.resolved-condition-source-contract` (resolved 2026-07-29)
23. `ticket.engine.patient-generation.finding-pipeline-resolved-condition-source` (resolved
    2026-07-29)
24. `ticket.engine.patient-generation.optional-reaction-history-bridge` (resolved 2026-07-29)
25. `ticket.engine.patient-generation.optional-prior-treatment-bridge` (resolved 2026-07-29)
26. `ticket.engine.patient-generation.optional-exposure-budget-bridge` (resolved 2026-07-29)
27. `ticket.engine.patient-generation.core-optional-patient-state-composer` (resolved 2026-07-29)
28. `ticket.engine.patient-generation.finding-pipeline-composed-patient-state` (resolved
    2026-07-29)
29. `ticket.engine.patient-generation.whole-state-tendency-applicability` (resolved 2026-07-29)
30. `ticket.engine.patient-generation.weighted-tendency-applicability-attachment` (resolved
    2026-07-29)
31. `ticket.engine.patient-generation.structured-patient-state-reveal-projections` (resolved
    2026-07-29)
32. `ticket.engine.patient-generation.universal-action-result-recipe-compiler` (resolved
    2026-07-29)
33. `ticket.engine.patient-generation.verified-universal-action-result-attachment` (resolved
    2026-07-29)
34. `ticket.engine.patient-generation.structured-source-report-compiler` (resolved 2026-07-30)
35. `ticket.engine.patient-generation.encounter-care-setting-attachment` (resolved 2026-07-30)
36. `ticket.engine.patient-generation.source-report-behavior-selection` (resolved 2026-07-30)
37. `ticket.engine.patient-generation.source-report-attachment-chain` (resolved 2026-07-30)
38. `ticket.engine.patient-generation.encounter-operational-admission` (resolved 2026-07-30)
39. `ticket.engine.patient-generation.instrument-item-response-compiler` (resolved 2026-07-30)
40. `ticket.engine.patient-generation.instrument-item-response-attachment-chain` (resolved
    2026-07-30)
41. `ticket.engine.patient-generation.selected-location-operational-resource-context` (resolved
    2026-07-30)
42. `ticket.engine.patient-generation.pre-finding-patient-state-orchestrator` (resolved
    2026-07-30)
43. `ticket.engine.patient-generation.selected-location-operational-admission-attachment`
    (resolved 2026-07-30)
44. `ticket.engine.patient-generation.pre-finding-orchestration-attachment` (resolved
    2026-07-30)
45. `ticket.engine.patient-generation.template-location-admission-matrix` (resolved
    2026-07-30)
46. `ticket.engine.patient-generation.minimized-clinic-operational-context` (resolved
    2026-07-30)
47. `ticket.engine.patient-generation.admitted-template-location-binding` (resolved
    2026-07-30)
48. `ticket.engine.patient-generation.queue-coordinate-policy` (resolved 2026-07-30)
49. `ticket.engine.patient-generation.local-template-distribution-policy` (resolved 2026-07-30)
50. `ticket.engine.patient-generation.mode-lifecycle-template-horizon` (resolved 2026-07-30)
51. `ticket.engine.patient-generation.location-capacity-facility-move-migration` (resolved
    2026-07-30)
52. `ticket.engine.patient-generation.empty-slot-fill-seed-authority` (resolved 2026-07-30)
53. D-234 post-encounter location-slot lifecycle (resolved/applied 2026-07-30)
54. `ticket.engine.patient-generation.native-generated-attempt-persistence-contract` (resolved
    2026-07-30)
55. D-236 generated-persistence readiness audit (resolved as deliberately deferred 2026-07-30)
56. D-237 first native reviewed MDD regimen route and decision-policy adapter (resolved 2026-07-30)
57. D-238 separate native decision-balance owner and D-235 point derivation (resolved 2026-07-30)
58. D-239 native versioned information-service quote derivation (resolved 2026-07-30)
59. `ticket.engine.patient-generation.target-scoped-duration-burden-projection` (resolved
    2026-07-30)
60. `ticket.engine.patient-generation.target-scoped-value-attachment-chain` (resolved
    2026-07-30)
61. `ticket.engine.patient-generation.full-native-encounter-decision-snapshot` (resolved
    2026-07-30)
62. `ticket.engine.patient-generation.triggered-information-prerequisite-adapter` (resolved
    2026-07-30)
63. `ticket.engine.patient-generation.triggered-information-prerequisite-balance` (resolved
    2026-07-30)
64. `ticket.engine.patient-generation.native-rule-combination` (resolved 2026-07-30)
65. `ticket.engine.patient-generation.decision-balance-catalog-fingerprint` (resolved
    2026-07-31)
66. `ticket.engine.patient-generation.first-real-mdd-compile-readiness-audit` (resolved
    2026-07-30)
67. `ticket.engine.patient-generation.optional-finding-texture-bridge` (resolved 2026-07-31)
68. `ticket.catalog.findings.weight-change-owner-boundary` (resolved 2026-07-31)
69. `ticket.catalog.diagnoses.mdd-current-episode-finding-profile` (resolved 2026-07-31)
70. D-255 direct focused information-action balance and replay (resolved/applied 2026-08-02)
71. `ticket.engine.patient-generation.sparse-positive-symptom-closure` (resolved/applied
    2026-08-03)
72. `ticket.engine.patient-generation.source-report-complexity-gating` (resolved/applied
    2026-08-03)
73. `ticket.engine.patient-generation.finding-source-report-complexity-bridge`
    (resolved/applied 2026-08-03)
74. `ticket.catalog.findings.mdd-depressive-symptom-assessment-horizon` (resolved/applied
    2026-08-03)
75. D-260 checked-in projection-horizon and universal action-result assembly content
    (resolved/applied 2026-08-03)
76. D-261 exact duration-profile version identity across compatibility state and D-240
    (resolved/applied 2026-08-03)
77. D-262 checked-in current-MDD duration profile, exact Presenting-problem D-240 definition, and
    two-action static universal result assembly (resolved/applied 2026-08-03)
78. D-263 pure exact condition-duration option resolver and replay artifact (resolved/applied
    2026-08-03)
79. D-264 post-D-208 exact condition-duration attachment and replay artifact (resolved/applied
    2026-08-03)
80. D-265 race/ethnicity identity, provenance, migration-safe patient-state, and future-use
    guardrail foundation (resolved/applied 2026-08-03)
81. D-266 optional verified D-264 state routing through D-200/D-194/D-240 with preserved
    D-208-only compatibility (resolved/applied 2026-08-03)
82. D-267 standalone exact condition-functional-impairment profile/resolver owner and replay
    artifact (resolved/applied 2026-08-03)
83. D-268 generation-only MDD higher-of severity policy, family-only diagnosis boundary, and named
    psychotic-features specifier identity (resolved/applied 2026-08-03)
84. D-269 standalone same-episode higher-of severity derivation and replay artifact
    (resolved/applied 2026-08-03)
85. D-270 native service-backed intervention/disposition pricing and settlement replay
    (resolved/applied 2026-08-03)
86. D-271 exact generated economy-policy, clinic-state, and satisfaction settlement context plus
    native replay (resolved/applied 2026-08-03)
87. D-272 minimized exact diagnosis-qualifier owner compilation, generated-decision validation,
    and replay integrity (resolved/applied 2026-08-03)
88. D-273 standalone deterministic fictional-name and brief chief-complaint presentation resolver
    with complete replay audit and minimized safe output (resolved/applied 2026-08-03)
89. D-274 transitional local Developer Patient Maker over completely validated compatibility
    CaseBlueprints and their exact authored complexity budgets (resolved/applied 2026-08-03)
90. D-275 versioned baseline-plus-additional optional-feature complexity envelope
    (resolved/applied 2026-08-03)
91. D-276 qualified compatibility-result semantics (resolved/applied 2026-08-03)
92. D-277 exact medication-record finding attribution (resolved/applied 2026-08-03)
93. D-278 sparse exact current-medication reported benefit (resolved/applied 2026-08-03)
94. D-279 exact current/prior medication tolerability compatibility projection
    (resolved/applied 2026-08-03)
95. D-280 exact noncausal medication-change temporal relationship (resolved/applied 2026-08-03)
96. D-281 sparse exact current-medication categorical dose position (resolved/applied 2026-08-03)
97. D-282 point-free rights-neutral instrument-administration result owner
    (resolved/applied 2026-08-03)
98. D-283 exact patient-bound instrument-administration compiler and replay
    (resolved/applied 2026-08-03)
99. D-284 strict presentation-safe instrument-administration projection and exact reprojection
    (resolved/applied 2026-08-03)
100. D-285 exact frozen-context instrument-administration admission compiler and replay
     (resolved/applied 2026-08-03)
101. D-286 exact D-194 catalog-snapshot administration-context adapter and replay
     (resolved/applied 2026-08-03)
102. D-287 exact D-194 catalog-snapshot launcher-presentation adapter and replay
     (resolved/applied 2026-08-03)
103. D-289 exact post-D-208 condition-functional-impairment attachment envelope and replay
     (resolved/applied 2026-08-03)
104. D-290 strict target/source-instance-redacted condition-functional-impairment projection and
     exact reprojection (resolved/applied 2026-08-03)
105. D-291 deterministic exact-patient source-instance horizon and kind/existence validator
     (resolved/applied 2026-08-03)
106. D-292 exact D-289-to-D-291 source-validation adapter with derived D-290 projection
     (resolved/applied 2026-08-03)
107. D-293 exact D-283-to-D-291 respondent-source validation with derived D-284 projection
     (resolved/applied 2026-08-03)
108. D-294 exact D-264-to-D-291 condition-duration source validation with separate composed-state
     reference (resolved/applied 2026-08-03)
109. D-295 D-200 `24.0.0` source-validated condition-duration integration: nullable D-294 replaces
     raw D-264 while preserving the no-duration path and unchanged D-194/D-240 consumption
     (resolved/applied 2026-08-03)
110. D-296 D-285/D-286 `2.0.0` source-validated instrument admission: D-293 replaces raw D-283 in
     both frozen-context and exact-D-194-snapshot attachment proofs
     (resolved/applied 2026-08-03)
111. D-297 D-269 `2.0.0` standalone source validation: one replay-valid same-patient D-291
     horizon now validates the D-267 impairment source instance and kind, and a raw-D-267-only
     request is rejected (resolved/applied 2026-08-03)
112. D-298 standalone D-240 source validation: one replay-valid same-patient D-291 horizon
     validates every complete action/record/frozen-value duration or burden source binding and
     carries only D-240's existing target-redacted reveals forward
     (resolved/applied 2026-08-03)
113. D-299 standalone D-215 source validation: one replay-valid same-patient D-291 horizon
     validates every selected profile/definition/projection source binding and retains D-215's
     detached D-212 recipes (resolved/applied 2026-08-03)
114. D-300 D-291 `2.0.0` reusable source-role identity: opaque IDs derive from exact
     definition/version/kind while patient ownership remains in and is validated through the
     exact horizon; D-299 also retains each validated role's definition reference
     (resolved/applied 2026-08-03)
115. D-301 standalone D-208 composed-state source validation: every current opaque
     source-instance reference is checked against one same-patient D-291 horizon; records with
     typed kinds require equality, while measurement/categorical/test ID-only records remain
     explicitly existence-only with their resolved definition retained
     (resolved/applied 2026-08-03)
116. D-302 standalone D-193 shared-finding source validation: every direct D-258
     source-report selection is checked against one same-patient D-291 horizon and retains its
     exact slot, selected projection, source/time/claim/dependency coordinates, optional D-201
     trace, and resolved source definition (resolved/applied 2026-08-03)
117. D-303 neutral patient-scene source-role catalog: one registry-validated, stable-order,
     runtime-excluded definition horizon covers every closed D-291 kind and keeps multiple
     collateral and record roles distinguishable without assigning source authority
     (resolved/applied 2026-08-03)
118. D-304 typed measurement/observation/test sources: replace the three remaining flat source
     IDs with exact `PatientStateScopedSource` records and advance D-301 to `2.0.0`, eliminating
     existence-only validation from the current composed patient state
     (resolved/applied 2026-08-03)
119. D-305 catalog-backed source-horizon adapter: one exact catalog fingerprint and patient-state
     ID derive and retain the complete D-291 definition request and patient-bound horizon through
     the authoring-only engine entry (resolved/applied 2026-08-03)
120. D-306 standalone numeric structured-test result compiler: one exact generated-numeric test,
     typed patient context, internal seed, referenced interval horizon, time scope, and exact
     D-305 source role compile into one frozen typed result with profile/source/replay audit; all
     six current numeric lab definitions pass the checked-in content proof while remaining
     medically unreviewed and detached from patient/action/runtime state
     (resolved/applied 2026-08-03)
121. D-307 patient-owned structured-test result profile and compiler: one versioned exact authored
     payload is checked against its test contract and bound to one D-305 patient source role with
     complete replay; all eight current patient-owned definitions pass synthetic numeric,
     categorical, binary, imaging, and electrical contract fixtures, with no real profile or
     runtime attachment (resolved/applied 2026-08-03)
122. D-308 patient-owned measurement value profile and compiler: one exact authored value/display/
     context payload is checked against its measurement definition and bound to one D-305
     direct-measurement source role with complete replay; all nine current definitions pass
     synthetic fixtures while remaining `not_interpreted`, with no real profile, generation,
     range, derived BMI relationship, or runtime attachment (resolved/applied 2026-08-03)
123. D-309 patient-owned categorical-observation value profile and compiler: one exact authored
     allowed value/display payload is checked against its observation definition and bound to one
     D-305 clinician-observation source role with complete replay and empty interpretation;
     synthetic MSE and physical-exam definitions prove both domains while the real observation
     catalog remains empty (resolved/applied 2026-08-03)
124. D-310 detached clinical-result collection: replay-valid D-306 through D-309 artifacts bind
     to one exact patient and D-305 source horizon, retain every upstream artifact, canonicalize
     all typed outputs, and reject duplicate compilation or resolved-record identities without
     selecting, interpreting, or attaching another value (resolved/applied 2026-08-03)
125. D-311 patient clinical-result attachment: one replay-valid D-310 collection replaces only
     the empty measurement, categorical-observation, and structured-test lanes of one successfully
     composed same-patient D-208 state; both upstream artifacts and the changed state are frozen
     with exact replay while runtime/catalog attachment remains absent (resolved/applied
     2026-08-03)
126. D-312 post-composition patient-state assembly: one successful D-208 root plus at least one
     replay-valid D-294 duration or D-311 result branch composes only those nonoverlapping lanes
     into a newly fingerprinted authoring state; crossed roots, preexisting base lanes, and
     arbitrary state merges are rejected while downstream integration remains absent
     (resolved/applied 2026-08-03)
127. D-313 D-200 post-composition integration: D-200 `25.0.0` accepts only nullable replay-valid
     D-312 after D-208, keeps direct D-294 invalid, carries nested duration seeds into the existing
     D-233 equality audit, and routes the assembled duration/result state through unchanged D-194
     without adding runtime or clinical authority (resolved/applied 2026-08-03)
128. D-314 functional-impairment patient-state integration: add the exact source-bearing
     `ResolvedPatientState.functionalImpairments` lane, advance D-312 to `2.0.0` so only
     replay-valid D-292 records can populate it alongside D-294 duration and D-311 results, advance
     D-301 to `3.0.0`, and advance D-200 to `26.0.0` so every D-267 draw is seed-audited and the
     assembled state survives through D-194 without adding a real profile, result projection,
     runtime, or clinical authority (resolved/applied 2026-08-03)
129. D-315 functional-impairment target-scoped projection: advance D-240 and D-298 to `2.0.0`,
     require one exact condition/profile/source/time/action definition, retain full
     target/profile/option/source identity in authoring audit, emit only a
     target/profile/option/source-instance-redacted safe value, and prove generic D-213/D-214
     routing without checking in a real definition, profile, wording, runtime activation, or
     clinical authority (resolved/applied 2026-08-03)
130. D-316 metric BMI derivation: register one exact runtime-excluded height/weight/BMI
     relationship, require explicit positive cm/kg records from one replay-valid D-310
     collection, retain both inputs and deterministic formula replay, and emit only a detached
     uninterpreted kg/m2 value without fabricating source/time ownership or adding ranges, body
     habitus, action attachment, rules, points, persistence, or runtime
     (resolved/applied 2026-08-03)
131. D-317 derived BMI measurement materialization: add explicit derived-measurement provenance
     and a paired deterministic-derivation trace, materialize only replay-valid D-316 output into
     a detached `ResolvedMeasurement`, use the selected weight record's time scope, and keep D-301,
     D-310, patient/action attachment, persistence, runtime, clinical meaning, and points outside
     the boundary (resolved/applied 2026-08-03)
132. D-318 noncyclic derived-BMI attachment: advance D-311 to `2.0.0`, require every optional
     replay-valid D-317 artifact to retain the exact D-310 collection being attached, append its
     record beside rather than inside those direct inputs, preserve explicit materialization
     references, reject crossed collections/duplicates/capacity overflow, and let D-312 carry the
     verified lane without adding action-result, clinical, persistence, or runtime authority
     (resolved/applied 2026-08-03)
133. D-319 derived-BMI universal-result reuse: prove with synthetic content that the unchanged
     D-213/D-214 measurement source validates D-318 BMI against its exact definition/action
     relationship, carries height/weight/BMI through D-312/D-200/D-194 into `PatientInstance`,
     and freezes only exact measurement IDs in result bindings without a parallel reveal model or
     production content activation (resolved/applied 2026-08-03)
134. D-320 exact template clinical-result recipe: define a separate reviewed recipe pinned to the
     full exact `PatientTemplate`, name typed D-306-through-D-309 profile owners and D-316 BMI
     dependencies, bind every supplied D-310/D-317 artifact exactly once, reject unmatched or
     ambiguous ownership, and freeze complete replay without changing D-311, values, actions,
     clinical meaning, persistence, or runtime (resolved/applied 2026-08-03)
135. D-321 template-owned clinical-result attachment: advance D-311 to `3.0.0`, accept only one
     replay-valid D-320 artifact beside the replay-valid D-208 composition, cross-check both
     template fingerprint schemes, derive D-310/D-317 only from D-320, retain its exact reference,
     and reject the legacy raw collection request without real content or runtime activation
     (resolved/applied 2026-08-03)
136. D-322 exact-template clinical-result recipe horizon: consume one replay-valid mode-template
     horizon, retain one `bound` or `missing_recipe` member per exact template, reject orphan and
     duplicate recipe ownership, resolve only by exact template ID/version/fingerprint, and keep
     lifecycle/review state and missing coverage auditable without compiling results or activating
     runtime content (resolved/applied 2026-08-03)
137. D-323 horizon-owned recipe compilation: advance D-320 to `2.0.0`, replace its raw recipe
     input with one replay-valid D-322 horizon, resolve only the supplied exact template, retain
     the horizon reference, fail on missing coverage, and reject the legacy request while leaving
     result binding, clinical behavior, persistence, and runtime unchanged
     (resolved/applied 2026-08-03)
138. D-324 exact recipe-resource coverage: consume one replay-valid D-322 horizon plus one finite
     typed resource set, emit exact resolved or missing requirements for every bound recipe member,
     preserve missing recipes separately, reject duplicate stable resource bins, and retain full
     replay without generating values, validating clinical meaning, deleting templates, or
     activating runtime (resolved/applied 2026-08-03)
139. D-325 exact patient result-materialization context: consume one replay-valid D-233 seed
     authority, completed D-208 patient state, and D-324 coverage artifact; require identical
     template and seed lineage, derive numeric context only from resolved patient state, compile
     one catalog-backed same-patient source horizon, and freeze replay without compiling results,
     spending complexity, rerolling the patient, or activating runtime
     (resolved/applied 2026-08-03)
140. D-326 exact patient clinical-result materialization: consume one replay-valid D-325 context
     only; resolve its retained D-322 recipe and D-324 resources; delegate every direct result to
     D-306 through D-309, the collection to D-310, declared BMI outputs to D-316/D-317, and exact
     template binding to D-320; preserve complete replay and native semantic failures without raw
     caller inputs, D-311 attachment, complexity spend, persistence, or runtime activation
     (resolved/applied 2026-08-03)
141. D-327 exact materialized-result attachment: consume one replay-valid D-326 artifact only,
     derive its embedded D-208 composition and D-320 result compilation, delegate unchanged
     empty-lane attachment to D-311, and retain both exact chains without admitting caller-selected
     patient/result inputs, D-312 assembly, complexity spend, persistence, or runtime activation
     (resolved/applied 2026-08-03)
142. D-328 exact result-enabled post-composition orchestration: consume one replay-valid D-327
     result branch plus optional independently replay-valid D-294 duration and D-292 impairment
     branches, derive D-208/D-311 only from D-327, delegate exact-common-root state assembly to
     D-312, and retain full replay without a parallel state model, second complexity spend,
     persistence, or runtime activation (resolved/applied 2026-08-03)
143. D-329 exact result-enabled D-200 integration: advance D-200 to `27.0.0`; require one
     replay-valid D-328 with the exact current D-233 and D-208 authorities whenever the
     post-composition branch carries D-311 results; retain both D-328 and its derived D-312 in
     audit fingerprints; preserve null and direct result-free D-312 paths; reject raw,
     crossed, tampered, or dropped result authority without adding generation, complexity,
     persistence, or runtime activation (resolved/applied 2026-08-03)
144. D-330 exact clinical-result finding-pipeline orchestration: consume one schema-valid,
     composed, result-free D-200 request scaffold plus one exact D-324 resource-coverage artifact;
     derive D-325/D-326/D-327/D-328 without compiling the intentionally incomplete scaffold first;
     preserve existing result-free D-294/D-292 branches; invoke D-200 only with the generated
     D-328 authority; retain exact replay; and reject prebuilt results or replacement
     seed/template/context without adding complexity, persistence, or runtime activation
     (resolved/applied 2026-08-03)
145. D-331 exact D-233 atomic-fill integration: advance the authoring-only fill to `3.0.0`;
     preserve direct result-free D-200 compatibility; require exact replay-valid D-324 coverage
     for result-enabled patients; derive D-330 from the fill's own seed authority and scaffold;
     freeze only the final D-200 audit; retain successful D-324/D-330 provenance; and convert
     valid incomplete coverage into one blocked, ordinal-consuming attempt without retaining
     partial result authority, persistence, or runtime activation (resolved/applied 2026-08-03)
146. D-332 checked-in launcher-presentation content: add one strict runtime-excluded catalog with
     three reusable medically unreviewed complaint banks, 48 concise variants, and one
     Developer-approved cosmetic MDD profile over the existing independent fictional first/last
     name pools and literal one-quarter middle-initial policy; validate exact registry/opinion
     ownership, deterministic breadth, no diagnostic hints, and Player/Reviewer isolation without
     attaching the result to D-200/D-233, persistence, runtime, scoring, or UI
     (resolved/applied 2026-08-03)
147. D-333 exact waiting-slot launcher-presentation attachment: consume one replay-valid
     successful D-331 fill plus exact D-332 content; derive D-287 from the fill's final D-194
     snapshot; freeze one fingerprinted minimized slot/patient-bound presentation; reject blocked,
     crossed, tampered, or caller-substituted authority; and retain complete replay without
     modifying the slot, persistence, runtime, points, formulary behavior, or UI
     (resolved/applied 2026-08-03)
148. D-334 exact weight/BMI action-result content: add one runtime-excluded universal-result
     assembly for the existing weight/BMI action; pin exact canonical height, weight, and BMI
     definitions plus the shared action payload; reject stale embedded definitions; and prove the
     unchanged measurement route without adding value generation, body-habitus inference,
     interpretation, rules, points, persistence, runtime, or UI
     (resolved/applied 2026-08-03)
149. D-335 deterministic generated-measurement profile/compiler: add a detached authoring-only
     reviewed profile with typed context, priority, weighted support bands, source-use/review, and
     definition-allowed context values; select the profile and band deterministically; freeze one
     uninterpreted common measurement with separate band/value draws and full replay; and add no
     real distribution, D-320 recipe support, body-habitus meaning, ranges, rules, points,
     persistence, runtime, or UI
     (resolved/applied 2026-08-03)
150. D-336 D-310 generated-measurement collection integration: advance the collection compiler to
     accept a closed D-308/D-335 measurement-compilation union, dispatch exact integrity replay,
     preserve authored versus generated collection-member identity, and retain the common
     measurement lane without adding D-320 recipe inference, real content, rules, points,
     persistence, runtime, or UI
     (resolved/applied 2026-08-03)
151. D-337 generated-measurement recipe/resource/materialization integration: add a distinct D-320
     recipe member with a complete exact D-335 profile horizon, audit every profile through D-324,
     invoke D-335 only from D-325 seed/context in D-326, preserve generated ownership through
     D-310, permit the existing BMI derivation to consume authored or generated inputs, and add no
     real distribution, range, interpretation, body-habitus meaning, rules, points, persistence,
     runtime, or UI
     (resolved/applied 2026-08-04)
152. D-338 native exact-class treatment prerequisite: add a version-pinned diagnosis selection
     predicate over the existing reviewed MDD initial-antidepressant class, expand the complete
     approved membership horizon to concrete start targets without tag inference, preserve the
     legacy tag rule behind a distinct compatibility-case predicate schema, and attach a separate
     provisional `0/+35/-50` mania-history prerequisite balance without changing compatibility
     scoring, patient generation, persistence, runtime, or UI
     (resolved/applied 2026-08-04)
153. D-339 native exact-finding information requirement: add one narrow version-pinned
     canonical-finding outcome supplement without widening compatibility patient predicates,
     compile the present passive-death-wish fact beside the exact primary-route scope, validate
     missing/stale/inactive/outcome-incompatible references, and attach a separate provisional
     `+50/-80` detailed safety-assessment balance without adding risk formulation, disposition
     inference, patient generation, persistence, runtime, or UI
     (resolved/applied 2026-08-04)
154. D-340 detailed suicide-safety finding identities: add separate neutral present/absent owners
     for current suicidal intent, a current specific plan, self-reported access to identified
     suicide means, and a recent attempt while retaining weapon access, exact event timing,
     generation rates, interpretation, risk, disposition, and points as separate dependencies
     (resolved/applied 2026-08-04)
155. D-341 detailed suicide-safety action-result owner: add an exact reviewed nine-fact,
     eighteen-projection horizon and bind it through the universal result assembly to the shared
     History action; keep safety-planning ability, protective/acute modifiers, source
     discordance, risk formulation, disposition, generation, persistence, runtime, and UI
     separate
     (resolved/applied 2026-08-04)
156. D-342 safety-planning-ability action-result owner: bind the existing typed
     `reportedSafetyPlanningAbility` state through one exact current-patient-report structured
     reveal definition and universal recipe; retain only a redacted reveal pointer in the result
     binding while keeping written-plan state, intervention, risk, disposition, generation,
     points, persistence, runtime, and UI separate
     (resolved/applied 2026-08-04)
157. D-343 medication-reconciliation action-result owner: bind the exact current
     `medication_regimen_entries` lane through one reviewed current-patient-report structured
     definition and universal recipe while keeping trials, effects, interpretation, generation,
     points, persistence, runtime, and UI separate
     (resolved/applied 2026-08-04)
158. D-344 allergy/adverse-reaction action-result owner: bind exact `reaction_records` plus
     explicit overall and medication-assessment statuses through one reviewed
     current-patient-report structured definition and universal recipe; preserve reported labels
     without inferring immune allergy, contraindication, treatment consequence, generation,
     points, persistence, runtime, or UI
     (resolved/applied 2026-08-04)
159. D-345 substance-use action-result owner: bind exact source-reported
     `exposure_use_entries` through one current-patient-report structured definition and universal
     recipe while keeping objective truth, source accuracy, intoxication, withdrawal, diagnosis,
     generation, points, persistence, runtime, and UI separate
     (resolved/applied 2026-08-04)
160. D-346 prior-medication-trial action-result owner: bind only the `medication_trials` lane to
     the focused prior-trials action without adding psychotherapy, provider, level-of-care,
     adequacy-display, generation, point, persistence, runtime, or UI semantics
     (resolved/applied 2026-08-04)
161. D-347 full-treatment-history action-result owner: bind medication trials, psychotherapy
     trials, current providers, and prior levels of care as four separate exact lanes without
     merging record types or adding generation, points, persistence, runtime, or UI
     (resolved/applied 2026-08-04)
162. D-348 medication-effects action-result owner: bind exact current-regimen benefit,
     tolerability, dose-position, and medication-change-timing lanes while preserving sparse
     missing state, exact subjects, and noncausal semantics; defer minimized player-field
     projection, generation profiles, rules, points, persistence, runtime, and UI
     (resolved/applied 2026-08-04)
163. D-349 minimized structured-record projector: resolve only source-presented record IDs through
     one closed safe shape per existing lane; preserve observed trial duration and highest
     reported dose while excluding trial adequacy, exposure misuse truth, reaction
     interpretation, internal diagnosis mappings, authoring summaries, omitted truth IDs, and
     source-alignment internals; defer D-214/PatientInstance attachment, persistence, runtime, and
     UI (resolved/applied 2026-08-04)
164. D-350 source-validated record-projection collection: replay one exact D-299 artifact and
     derive every D-349 safe view from its retained patient and D-212 recipes, preserving exact
     definition/action/source/time bindings and source-reported empty semantics while rejecting raw
     D-215 input; defer D-218/D-194/D-213/D-214 integration, persistence, runtime, and UI
     (resolved/applied 2026-08-04)
165. D-351 source-validated universal-result attachment: require one replay-valid D-350 collection
     and D-213 artifact for the same exact patient and complete structured-envelope set, derive
     D-214 mechanically, and prove every safe record projection matches its frozen reveal while
     retaining the other safe result lanes; defer PatientInstance, D-194/D-218 orchestration,
     persistence, runtime, and UI (resolved/applied 2026-08-04)
166. D-352 mania/hypomania history result owner: preserve eight current and eight past episodic
     patient-report symptom identities under one compact shared action, with explicit closed
     negatives and hidden subthreshold values remaining auditable; exclude MSE, episode/diagnosis
     inference, generation profiles, points, persistence, runtime, and UI
     (resolved/applied 2026-08-04)
167. D-353 psychosis-history result owner: bind six separate current patient-report findings to the
     shared compact action while keeping paranoia vocabulary, proposition truth, belief appraisal,
     collateral/records, and MSE outside; add no aggregate psychosis inference, diagnosis,
     generation, points, persistence, runtime, or UI
     (resolved/applied 2026-08-04)
168. D-354 MDD presenting-problem result owner: extend the existing two-action foundation so the
     presenting-problem action joins current-MDD duration with the separate broad current
     self-reported functional-impact finding, while preserving the 17-item depressive-symptom
     result and keeping condition-attributed impairment, severity, generation, points,
     persistence, runtime, and UI outside
     (resolved/applied 2026-08-04)
169. D-355 body-habitus result owner: add one neutral physical-exam categorical observation to the
     existing weight/BMI action, preserve its independent source and value identity beside numeric
     height/weight/BMI, and validate exact canonical definition/action routing without inferring
     body composition from BMI or adding generation, interpretation, tags, rules, points,
     persistence, runtime, or UI
     (resolved/applied 2026-08-04)
170. D-356 generated categorical-observation compiler: deterministically choose one
     definition-approved value from the highest-priority matching reviewed profile with stable
     draw and complete replay provenance, prove the contract with synthetic content only, and
     defer real profiles, BMI relationships, result collection, template recipes, complexity,
     interpretation, tags, rules, points, persistence, runtime, and UI
     (resolved/applied 2026-08-04)
171. D-357 generated-observation collection owner: advance D-310 to retain replay-valid D-356
     output under a distinct `generated_categorical_observation` member kind beside authored D-309
     output, preserve exact source/artifact provenance, and keep D-320 authored matching narrowed
     until a separate generated recipe owner exists; add no real profile, patient attachment,
     complexity, interpretation, tags, rules, points, persistence, runtime, or UI
     (resolved/applied 2026-08-04)
172. D-358 generated-observation recipe and materialization owner: add one explicit D-320 member
     that pins the exact definition, complete D-356 generation-profile horizon, source, and time;
     require every exact resource through D-324 and invoke D-356 only from frozen D-325
     seed/context through D-326; prove selected-profile-only rejection, missing-profile
     diagnostics, deterministic materialization, and replay with synthetic content while adding
     no real body-habitus distribution, BMI relationship, complexity, interpretation, tags,
     rules, points, persistence, runtime, or UI
     (resolved/applied 2026-08-04)
173. D-359 generated-observation frozen-patient proof: demonstrate that the generic
     D-327/D-328/D-329/D-330 chain retains the exact D-356 artifact, stable draw, generated
     D-310 member, generated D-320 binding, attached observation, and final patient value without
     a second selection or provenance relabeling; add no compiler branch, real profile,
     interpretation, complexity, rules, points, persistence, runtime, or UI
     (resolved/applied 2026-08-04)
174. D-360 checked-in current-MDD duration integration: replace one synthetic D-330 duration
     profile with `duration-profile.mdd.current-episode@1.0.0`, preserve exact canonical
     profile identity and one D-233 seed through D-263/D-294/D-328/D-200/D-240/D-330, and prove
     the resolved value belongs to the declared option horizon and replays identically without
     changing duration content, prevalence, severity, impairment, treatment, points,
     persistence, runtime, or UI
     (resolved/applied 2026-08-04)
175. D-361 checked-in current-MDD finding integration: bind the exact reviewed
     `condition-finding-profile.mdd.current-episode@1.3.0` to
     `diagnosis.major-depressive-disorder@1.6.0`, select only declared dimensions and
     manifestations through D-197 from the D-233 seed, close only the exact checked-in 17-item
     depressive-history assessment through D-256/D-259/D-260, retain selected out-of-horizon MSE
     positives without manufacturing unselected MSE negatives, and prove D-200/D-330 patient and
     action-result replay without changing symptoms, weights, diagnosis inference, severity,
     impairment, treatment, points, persistence, runtime, or UI
     (resolved/applied 2026-08-04)
176. D-362 combined current-MDD truth-state proof: resolve the checked-in condition-finding and
     episode-duration profiles together from one D-233 seed, preserve their independent
     D-197/D-263/D-294 provenance through D-328/D-200/D-330 and deterministic replay, and keep the
     full presenting-problem result gated rather than infer absent functional impact; add no new
     symptom, duration, weight, prevalence, impairment, diagnosis, treatment, points,
     persistence, runtime, or UI
     (resolved/applied 2026-08-04)
177. D-363 checked-in MDD mania-history assessment integration: merge the exact D-352
     sixteen-finding current/past patient-report horizon and unchanged `info.history.mania` result
     recipe into the combined MDD D-330 proof, derive absent rows only through D-256 after all
     positive generators run, preserve exact action bindings and deterministic replay, and add no
     episode generation, bipolar inference, treatment safety, rule, points, persistence, runtime,
     or UI
     (resolved/applied 2026-08-04)
178. D-364 checked-in MDD psychosis-history assessment integration: merge the exact D-353
     six-finding current patient-report horizon and unchanged `info.history.psychosis` result
     recipe beside D-363, derive absent rows only through D-256 after positive generation, preserve
     exact action bindings and replay, and add no proposition adjudication, MSE inference,
     psychosis/diagnosis conclusion, treatment meaning, points, persistence, runtime, or UI
     (resolved/applied 2026-08-04)
179. D-365 checked-in MDD detailed-safety assessment integration: merge the exact D-340/D-341
     nine-finding patient-report horizon and unchanged `info.history.suicide-safety` recipe, reuse
     the one safety manifestation selected by the fixed MDD D-197 seed, close only the other eight
     rows through D-256, preserve exact action bindings and replay, and add no risk category,
     safety-planning ability, disposition, treatment meaning, points, persistence, runtime, or UI
     (resolved/applied 2026-08-04)
180. D-366 generated-MDD native safety-rule integration: compile the checked-in MDD initial-
     treatment policy and focused route beside the D-339 passive-death-wish information
     requirement, bind its exact canonical-finding predicate to the generated present record and
     its action predicate to `info.history.suicide-safety`, preserve complete D-191/D-330 replay,
     and keep the separate balance, points, risk/disposition, persistence, runtime, and UI out
     (resolved/applied 2026-08-04)
181. D-367 generated-MDD treatment-triggered prerequisite integration: adapt the checked-in D-338
     mania-history rule only through the exact approved first-line-antidepressant class and five
     reviewed memberships, retain the complete concrete medication-start trigger separately from
     the `info.history.mania` fulfillment predicate, prove D-191/D-330 integrity and replay, and
     keep the three-outcome balance, player evaluation, treatment conclusion, persistence,
     runtime, and UI out
     (resolved/applied 2026-08-04)
182. D-368 generated-MDD native balance evaluation: attach only the checked-in D-338/D-339 balance
     owners before D-191 compilation, freeze their exact payloads in D-235, derive player
     information selections only from successful purchase events, and prove fulfilled, omitted,
     and not-triggered player outcomes plus the exact database plan through deterministic replay;
     add no new or retuned points, complete treatment score, persistence/runtime/UI widening, or
     additional catalog balance
     (resolved/applied 2026-08-04)
183. D-369 generated-MDD direct depressive-syndrome scoring: adapt the exact reviewed diagnosis
     rule to the already compiled `info.history.depressive-symptoms` action/result, attach only its
     existing +50/−50 direct-information balance beside D-338/D-339, and prove obtained versus
     omitted player/database-plan evaluation through D-235; add no symptom-count diagnosis
     inference, primary-route points, missing functional-impact value, retuning,
     persistence/runtime/UI widening, or other rule
     (resolved/applied 2026-08-04)
184. D-370 generated-MDD dominant primary-route scoring: attach the exact checked-in +200 balance
     to the reviewed count-aware focused regimen route, evaluate selected versus unmatched
     treatment snapshots beside the existing three information balances, preserve explicit
     zero-unmatched behavior and deterministic D-235 replay, and add no unavailable medication,
     inferred omission penalty, comparative fit, diagnosis/disposition scoring, retuning, or
     persistence/runtime/UI widening
     (resolved/applied 2026-08-04)
185. D-371 generated-MDD standard-mode settlement: carry the exact four-balance selected-route,
     no-route, and zero-reimbursement/no-action attempts through native D-235 settlement, preserve
     service-derived expenses, base-plus-care gross arithmetic, 1.00 satisfaction, the nonnegative
     payout floor, positive bank/lifetime updates, and no persistent debit; add no new price,
     bonus, economy formula, persistence migration, runtime activation, or UI
     (resolved/applied 2026-08-04)
186. D-372 generated-MDD information-owner coverage audit: adapt the complete lossless native MDD
     information-rule set, emit the existing nonblocking point-free `uncovered_action` diagnostic
     only when patient scope and any treatment trigger apply but the exact information action is
     absent, and identify presenting-problem functional-impact, explicit medication-report,
     reaction-assessment, and substance-report owners without inferring negative state, blocking
     or rerolling the patient, or adding points/runtime/UI
     (resolved/applied 2026-08-04)
187. D-373 accurate structured-history baseline: check in fixed authoring-only patient-report
     profiles for current medication regimen, longitudinal reaction history, and longitudinal
     substance-use history; preserve aligned empty regimen/exposure views and explicitly
     unassessed reaction semantics through D-217/D-215/D-299/D-350/D-351/D-214; spend no optional
     complexity, leave inaccurate/partial reporting behind D-201, and add no source probability,
     clinical inference, point value, persistence/runtime activation, or UI
     (resolved/applied 2026-08-04)
188. D-374 generated-MDD diagnosis horizon and JSON-safe attempt seam: place one exact optional
     family-level MDD identity in the frozen encounter horizon, compile its exact D-272 owner,
     preserve blank submission and backend-only severity, replay one submitted family diagnosis
     without points, and omit the absent D-201 artifact from fixed source-report requests rather
     than storing `undefined`; add no diagnosis inference, answer key, diagnosis balance,
     persistence migration, runtime activation, or UI
     (resolved/applied 2026-08-04)
189. D-375 generated structured-history purchase/replay: purchase the three fixed D-373 history
     actions through ordinary generated encounter events, derive each exact structured result
     binding and native 25-point service quote, retain the purchased-action decision snapshot and
     75-point itemized expense beside the D-374 family diagnosis, and add no clinical balance,
     source behavior, price, persistence migration, runtime activation, or UI
     (resolved/applied 2026-08-04)
190. D-376 generated-attempt authoring persistence proof: wrap the exact D-375 attempt in the
     existing timestamp-separated persistence record, preserve its complete diagnosis,
     structured-history purchase, patient, rule-trace, and settlement payload through schema and
     JSON round trips, and add no wall-clock engine input, SaveData/IndexedDB migration, runtime
     queue, review export, or UI
     (resolved/applied 2026-08-04)
191. D-377 exact generated-MDD completion proof: bind the replay-valid D-375 attempt and terminal
     completion event to the exact D-374 waiting slot, patient payload, template version, and
     template fingerprint through D-234's immutable completion proof; prove JSON/integrity replay
     and add no slot mutation, history update, refill, SaveData, runtime queue, points, or UI
     (resolved/applied 2026-08-04)
192. D-378 exact generated-MDD completion transition: apply the D-377 proof to the existing D-234
     completed-encounter transition, vacate only the occupied D-374 coordinate, retain the complete
     D-375 attempt in completion ordinal zero, advance bounded location history once, and prove
     integrity/context replay; stop before canonical refill, SaveData, runtime queue activation,
     clinical behavior, points, or UI
     (resolved/applied 2026-08-04)
193. D-379 weighted condition-functional-impairment profile mode: preserve D-267's uniform
     synthetic path while permitting one approved profile to assign complete positive integer
     generation mass across its exact level options; pin exact source-kind, time-scope, and
     care-setting applicability; normalize and freeze every probability, select through the same
     deterministic profile-local draw, reject mixed/incomplete/cross-context mass, and add no real
     MDD profile, source distribution, severity mapping, complexity, rule, point, persistence,
     runtime, or UI
     (resolved/applied 2026-08-04)

This closes the core-plus-optional-to-finding structural attachment seam but not the
complete-vertical gate. Real generation still needs typed routing for any real `other` module,
reviewed real soft-tendency profile and applicability content, additional accurate or
inaccurate/partial source-report profiles where needed, a reviewed symptom-severity owner, a real
functional-impairment profile
plus exact reviewed action definition, enabled severity-ID attachment, and exclusion result
owners that can join the checked-in D-259/D-260 symptom result, reviewed real height/weight
generation profiles, a separate body-habitus observation,
reviewed measurement
ranges/interpretation, real
rights-reviewed instrument definitions, administration result attachment, real
setting-specific operational owners, persisted
selected-location assignments and owners, runtime orchestration of the approved D-234/D-235
lifecycle, real template economy-policy content, and an explicit compatibility/persistence
checkpoint. The
D-220/D-221 instrument chain, exact D-222 → D-219 resource/admission attachment, D-223 → D-200
pre-finding attachment, D-226 complete current-context admission matrix, D-227 minimized clinic
operational context, D-228 admitted-cell binding, D-229 exact-location slot certificate, D-230
local template draw, D-231 lifecycle horizon, D-232 capacity/atomic-migration proof, and D-233
compact occupancy/seed/atomic-fill proof into D-200 plus the D-234 lifecycle and D-235 native
attempt are complete. D-295 additionally ensures that any duration-bearing D-200 path retains the
independent D-291 source proof through D-294 rather than accepting a raw D-264 attachment. All
current runtime locations remain outpatient and generalized runtime patient generation remains
disabled. D-301/D-304 separately audit all current typed source references in the complete D-208
composed state against one exact-patient D-291 horizon. They do not attach that audit to D-200.
D-302 separately audits direct D-258 patient-report selections
already frozen in D-193 projections and remains detached from D-200/D-194/D-235. D-303 supplies
the first checked-in neutral definition horizon, and D-305 deterministically adapts that catalog
to D-291. D-306 can deterministically materialize the six current numeric panel definitions from
that laboratory role, but none of these artifacts is attached to a generated patient, action
result, persistence, or runtime. D-307 can similarly bind an exact authored patient-owned result
profile to its contract and source role, but no real profile is selected by a template or attached
to patient state. D-308 can bind one exact authored measurement value and allowed context to the
direct-measurement role while retaining definition-owned units and `not_interpreted`; it likewise
has no real profile selection, generation owner, range/interpretation owner, patient attachment,
or runtime path. D-316 can derive a detached, uninterpreted BMI from two explicitly selected
replay-valid D-310 height/weight records under the checked-in metric relationship, and D-317 gives
that value explicit derived provenance and the selected weight's time scope. D-318 advances
D-311 to attach it beside the exact retained D-310 inputs without recursive membership, and D-319
proves the unchanged universal direct-measurement result route with synthetic content. No real
profile/action mapping, range, interpretation, persistence, or runtime is activated. D-309
provides the corresponding exact categorical-observation binding with an
empty interpretation list, but its domain proof remains synthetic and adds no real definition,
value profile, generation owner, patient attachment, or runtime path. D-310 now gathers all four
result-owner outputs under one replay-valid patient/source horizon, but that collection remains
detached from core patient-state construction, action-result assembly, persistence, and runtime.
D-320 separately pins one full exact template to every supplied D-310/D-317 member, and D-321
makes that replay-valid artifact the only D-311 result-set input.
D-311 supplies the exact authoring-only D-208 attachment for that collection: it requires
all three base result lanes to be empty, changes the patient-state identity, and retains both
complete inputs without merging or interpreting records. The resulting state still has no
D-194/D-213/D-214, D-200/D-235, `PatientInstance`, persistence, queue, or runtime route.
D-312 `2.0.0` now composes independently owned D-294 duration, D-292 source-validated
functional-impairment, and D-311 result branches only when they retain one exact empty-lane D-208
root. It copies only their nonoverlapping lanes and preserves every complete upstream artifact and
replay proof.
D-313 now makes that replay-valid D-312 artifact D-200 `25.0.0`'s only nullable post-composition
input. D-200 retains the exact D-223/D-208 root, derives the assembled state rather than accepting
a caller-authored replacement, includes nested duration draws in its existing D-233 seed audit,
and preserves duration plus clinical-result lanes through unchanged D-194. Direct D-294 input is
no longer valid.
D-314 advances the same path to D-200 `26.0.0`: functional impairment is now an exact
source-bearing patient-state lane, D-312 admits it only through D-292, D-301 `3.0.0` audits it with
the other source-bearing lanes, all nested D-267 draws must match the D-233 seed, and the complete
duration/impairment/result state survives through D-194. The null route rejects prepopulated
post-composition lanes. D-315 advances D-240 and D-298 to `2.0.0`, projects only those final-state
records through an exact future action/profile definition, preserves the complete hidden source
binding in authoring audit, and proves that D-213/D-214 can route the strict safe value without a
parallel result class. The chain remains authoring-only and still has no real impairment profile,
projection definition, wording, persistence, or runtime generation.
D-329 later advances D-200 to `27.0.0`: the same D-312 result-bearing state now enters only through
its exact D-328 materialization/attachment/assembly authority and matching D-233 root, while
result-free D-312 compatibility paths remain valid.

D-316 separately closes only the deterministic metric relationship among the already registered
height, weight, and BMI definitions. Its compiler consumes explicit replay-valid D-310 input
records and emits a detached uninterpreted value. D-317 materializes that value into a detached
`ResolvedMeasurement` with explicit derived provenance and the selected weight record's time
scope. D-318 attaches the replay-valid record beside those exact D-310 inputs through D-311
`2.0.0`, and the existing D-312 lane carries it without a parallel snapshot or recursive
collection. D-319 proves the existing D-194/D-213/D-214 direct-measurement path with synthetic
content only. It deliberately stops before a reviewed production action mapping, persistence, or
runtime activation. D-320 additionally supplies exact template recipe ownership for that result
set, but it remains an authoring-only detached artifact and contains no real recipe content.

D-236 specifically rejects a premature SaveData migration. D-234 history retains recursive
private authoring artifacts; D-235 remains a private replay record with native provisional balance,
D-239 native information pricing, D-270 native service-backed treatment pricing, and D-242 full
player/reference decisions. D-271 now freezes a separate exact-template provisional economy
policy, the current ClinicState, its matching D-227 projection, and the versioned satisfaction
curve before deriving every settlement scalar. D-272 now freezes the minimized exact diagnosis
qualifier facts needed to reject backend-only MDD severity labels, unavailable qualifiers, and
exclusive-group collisions while permitting an exact reviewed player-selectable specifier.
Real economy-policy content remains absent. D-273 supplies the standalone neutral
fictional-name/chief-complaint resolver, D-287 proves that a verified D-194 snapshot can supply
its exact patient identity and seed, and D-332 now supplies real runtime-excluded complaint
banks and one cosmetic MDD profile. D-333 now binds that content to one exact successful D-331
waiting-slot proposal through its final D-194 snapshot, but only as a detached authoring artifact.
No persisted/runtime waiting-slot field, historical debrief projection, SaveData migration,
runtime activation, or UI exists yet.
D-289 similarly proves only that genuine D-267 impairment records can be bound to the exact
completed D-208 state. D-290 may safely minimize those records while retaining exact
reprojection, but deliberately keeps them outside `ResolvedPatientState` and does not create an
information-action result or runtime path.
D-243 supplies the point-free distinct trigger/fulfillment contract
and proves both approved any-medication-start MDD adapters. D-244 supplies their separate exact
three-outcome balances and preserves the nested not-triggered/fulfilled/omitted replay audit.
D-245 then applies D-159 to both native player and database-plan traces with exact selected-target
normalization, specificity replacement, worst-only same-issue harm, hard-contraindication
suppression, full controller audit, and deterministic replay. D-252 closes the remaining balance
identity debt by fingerprinting the complete source catalog, freezing the exact minimized
referenced balance payload, retaining the full database-plan trace, and revalidating both traces
against the snapshot. No complete real generated
finding/result/source/presentation or frozen player/reviewer presentation vertical exists yet.
D-246 re-audits the exact D-223/D-200 input graph against checked-in content. The approved MDD
route/policy/balances and shared identity catalogs are real, but every executable
`PatientTemplate`, complete core pre-finding state, condition/background/tendency profile, finding
projection recipe, universal action-result assembly, source-report profile, and exact
launcher-presentation persistence/runtime projection used by the end-to-end proof remains
synthetic or absent.
The D-273 resolver, D-287 snapshot adapter, D-332 content, and D-333 detached slot attachment do
not change that runtime-activation result.
Compatibility cases hard-code
medically unreviewed results and are not generation inputs. The first executable blocker is a real
`PatientTemplate`; its first clinical dependency is an approved MDD episode finding/cardinality
owner plus a canonical finding-identity completeness review. This result stays in the authoritative
ticket and this audit rather than creating a second readiness-status schema.

D-247 completes the initially identified atomic MDD finding shells, and D-248 adds the
disorder-general D-197 dimension/manifestation compiler. Dimensions now count once while every
manifestation stays independently auditable. Pessimism has an additional neutral identity shell.
The evidence pass then exposed the D-250 owner split: current unintentional weight gain and loss
are directional findings, while point-in-time weight and BMI remain numeric measurements.
This does not make a real MDD profile: `source-request.mdd.current-episode-dimensions` and the
linked blocking ticket must still establish the exact core set, total cardinality, grouping, and
the roles of pessimism and suicidality. D-249 supplies the synthetic typed bridge by which
subthreshold texture may spend one small D-201 optional-richness cost and replace only its exact
D-198 baseline. It does not supply real mappings or rates, and core criteria never spend that
budget.

The ordered work before persistence is: the MDD route's exact real
generation/result/source dependencies; any
diagnosis qualifier horizon the template actually uses; and one deterministic outpatient
generation-to-review boundary proof. Only then may a separate SaveData version preserve the
already-frozen D-252 balance snapshot, preserve compatibility v5 data, and add a normalized
private generated lane plus minimized one-way review projection.

Some lanes can be implemented in parallel conceptually, but dependency edges determine what may
compile or activate. Clinical associations, generation tendencies, result probabilities,
reference intervals, treatment direction, and points require their own source/reviewer records;
none is authorized by an identity or schema ticket.

No gate requires patient-scene evidence to converge on a latent proposition or make an exact
diagnosis inferable. Ambiguous or misleading evidence is valid resolved state. When certainty is
not justified, the focused rubric may support blank, broad, unspecified, or conservative coverage
responses; missing support is a nonblocking coverage diagnostic rather than a patient retry.

## Gate for one complete vertical

Generalized generation is ready for a first bounded vertical only when:

1. every decision-relevant fact has one canonical ID and typed value;
2. every modeled adjudicable proposition, source-specific evidence claim, shared origin, and known
   dependency resolves before play without replacing native typed symptoms or measurements;
3. internal condition state, chart claims, regimen entries, reactions, prior trials, treatment
   history, and context resolve into a versioned patient record without free-prose truth;
4. every available reveal action projects an immediate structured result from that frozen state,
   and any assessment response or surface wording preserves its explicit mapping, stable variant,
   and contributing source-finding IDs;
   every instrument item must also have one exact lawful owner and attached response path before it
   can enter a generated encounter;
5. every focused information action, medication start, current-regimen operation, intervention,
   and disposition has complete mechanical admission at its exact selected location without
   deriving resources from a care-setting label or another location;
6. every selected medication, intervention, and disposition references a stable reusable owner;
7. one primary reviewed broad or uncertainty-aware route plus relevant action-relative
   prerequisites, fit, interaction, safety, and disposition contributors discovered from complete
   typed patient state compile into a deterministic, explainable rubric without requiring exact
   diagnostic precision or turning background diagnoses into additional objectives;
8. missing rule or route coverage becomes a nonblocking diagnostic and ticket rather than an
   invented default or patient deletion;
9. literal same-scope contradictions retry deterministically or quarantine, while conflicting
   source evidence remains valid state;
10. the same recipe, clinic state, seed, and content versions reproduce the same resolved patient,
    encounter, rubric, score trace, and settlement;
11. current `CaseBlueprint` attempts still replay unchanged through an explicit compatibility or
    migration path; and
12. Player, Reviewer, and Developer bundle boundaries remain intact.

No generated-patient count, seed-distribution target, displayed difficulty, or play-time gate
applies before this foundation exists.

## D-380–D-382 integration checkpoint

D-380 closes the broad Presenting problem and timeline generation gap for the current outpatient
MDD vertical. One reviewed D-198 background profile resolves
`finding.function.self-reported-current-impact@1.0.0`, and the existing D-240/D-213 result path
joins it with the separately generated current-episode duration. This is a broad patient-report
owner only. The condition-attributed D-267 impairment lane, exact impairment-to-severity
relationship, and any impairment treatment/point consequence remain unresolved.

D-381 makes recurring adjunct discovery deterministic and auditable through a read-only hashed
inventory. It adds no generation dependency and does not relax the immutable-source,
source-use-review, target-mapping, or psychiatrist-review gates.

D-382 closes a large identity-bin gap: 125 medication ingredients now have exact normalized
owners, including 112 identity-only records. This improves future source routing but does not
complete medication generation. The next medication identity dependency is a separate point-free
multi-ingredient/formulation composition owner. Each playable or generated medication still needs
its own runtime definition, explicit class/formulation relationships, source-controlled regimen
and trial behavior, location/formulary admission, reveal support, and reviewed decision-policy
coverage.

The next real generated-MDD clinical dependency is no longer broad current functional impact.
Prioritize the smallest source-reviewed owner needed for condition-attributed impairment/severity
or for a complete treatment/diagnosis/disposition rubric, while continuing to treat missing
coverage as nonblocking. Do not add another lifecycle wrapper or infer those values from D-380.

## Maintenance

Re-run this audit before:

- implementing any generalized patient generator;
- adding a case-local finding, test result, medication relationship, or policy that appears
  reusable;
- changing the target patient/encounter schema boundary;
- resolving a dependency ticket; or
- beginning a new deep diagnosis vertical.

Update facts and links here, but keep status, reviewer instructions, clinical disputes, and
resolution history in their authoritative tickets. Do not add completion percentages or copy
clinical propositions into this document.
