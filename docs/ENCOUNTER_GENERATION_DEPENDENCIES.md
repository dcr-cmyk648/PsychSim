# Encounter-generation dependency readiness

Status: architecture audit only. This document records what reusable owners exist and which
missing-owner tickets block generalized patient generation. It is not a second ticket tracker,
clinical approval matrix, completion percentage, or runtime input. The referenced ticket files
remain authoritative for live status.

Last audited: 2026-07-28.

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

- 91 stable registry entries;
- 40 universal information actions: 20 history, 6 physical, 10 laboratory, and 4 imaging/action
  identities;
- 31 service definitions and least-cost fulfillment;
- 9 diagnosis-family files;
- 53 medication identities, 13 compatibility medication definitions, and 6 supplement identities;
- 16 treatment choices: 13 nonmedication interventions and 3 dispositions;
- 14 test files: 6 numeric panels with 16 components and 8 patient-owned result placeholders;
- one prototype, medically unreviewed adult reference-interval set;
- 5 demographic pools containing 107 first names, 114 last names, 32 occupations, 8 education
  values, and 12 neutral locations; and
- compatibility schemas for reactions, regimen entries, prior trials, treatment history,
  clinical-context dimensions, deterministic replay, and IndexedDB persistence.

The most important duplication signal is in the current authored content. Across the five
approved/review `*.case.json` files, 621 nested finding occurrences use 186 finding IDs; 112 IDs
occur in more than one file. Depressive symptoms, anxiety, mania, psychosis, safety, adherence,
substance use, sleep, prior trials, and similar concepts are repeatedly authored inside cases.
The canonical finding-definition boundary now owns 41 identity-only, medically unreviewed
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
foundation. These decisions intentionally do not migrate or normalize case-local occurrences.

Other material gaps:

- only MDD currently has executable diagnosis-owned base rules; the other eight diagnosis files
  are primarily sparse identity dossiers;
- no diagnosis file currently has a populated specifier or comorbidity-relationship module;
- only one of the 13 compatibility medication definitions has fit modifiers;
- `PatientOpening.basicVitals` is still presentation text rather than typed measurements;
- the eight patient-owned tests have no reusable structured result contract;
- `PatientDiagnosis` does not yet separate internal condition truth from chart diagnosis claims;
- `PatientRecord` still combines compatibility patient state with case-era generation/treatment
  references; and
- `PatientTemplate`, `PatientInstance`, `EncounterInstance`, and `CompiledRubric` do not yet exist
  as the target versioned boundary.

These are architecture facts, not claims that current prototype cases or saved attempts are
invalid. Existing `CaseBlueprint` and `CaseInstance` snapshots remain the compatibility path.

## Readiness matrix

| Layer                                          | Existing reusable owners                                                                                                                     | Missing blocking boundary                                                                                                                       | Owning ticket                                                                                                      |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Identity and governance                        | Stable IDs, registry, Zod versions, lifecycle, formal evidence, source-use decisions, Developer opinions                                     | Add registry kinds only when a real catalog is implemented; do not create empty parallel stores                                                 | Routed by each owner ticket                                                                                        |
| Atomic findings                                | Case-local compatibility plus versioned canonical definition, resolved value, contributor provenance, and permitted projection modes         | Technical identity boundary complete; runtime compilation remains in its separate row/ticket                                                    | `ticket.catalog.findings.canonical-definition-boundary` (resolved 2026-07-28)                                      |
| General psychiatry findings                    | 41 identity-only canonical definitions, many compatibility IDs, and 40 neutral reveal actions                                                | Add substance, MSE, and physical owners without probabilities or scoring                                                                        | Paranoia/content identity boundary resolved 2026-07-28                                                             |
| Latent propositions and patient-scene evidence | Versioned point-free proposition, source-evidence, structural profile, dependency-group, belief-appraisal, and narrow resolved-state schemas | Runtime composition/reveal/decision use remains disabled; no generic Bayesian, credibility, or convergence engine                               | `ticket.schema.patient-state.latent-proposition-evidence-foundation` (resolved 2026-07-28)                         |
| Subjective response and wording                | Accepted three-layer ownership contract; compatibility case-local `labelVariants`                                                            | Versioned expression banks, explicit source-finding-to-response mappings, and frozen contributor-preserving resolved projections                | `ticket.catalog.findings.subjective-presentation-projection-foundation`                                            |
| Vitals, measurements, MSE, physical exam       | Weight/BMI action, general/neurologic/movement/orthostatic exam actions, lab numeric primitives                                              | Typed reusable measurement and observation definitions; remove string-only vitals from the target path                                          | `ticket.catalog.measurements.vitals-exam-foundation`                                                               |
| Tests and results                              | One file per test, numeric-panel generator, UCUM fields, immediate service fulfillment                                                       | Structured reusable results for ECG, imaging, EEG, toxicology, levels, pregnancy, and pharmacogenomics; reviewed interval data remains separate | `ticket.catalog.tests.structured-result-foundation`                                                                |
| Resolved patient state                         | Compatibility reaction, regimen, trial, treatment-history, context, diagnosis, and record schemas                                            | Separate internal conditions from chart claims and compose one versioned, point-free patient-state record                                       | `ticket.schema.patient-state.resolved-record-foundation`                                                           |
| Substance/background exposure                  | Substance-use reveal action plus general medication/supplement compatibility records                                                         | Stable exposure identities and typed use/intoxication/withdrawal state; prevalence and clinical inference remain separate review work           | `ticket.catalog.exposures.substance-use-foundation`                                                                |
| Medication and intervention knowledge          | Medication identities, 13 compatibility definitions, treatment menu, reaction policies                                                       | Normalize regimen benefit/risk/duplication and split reusable intervention identity/fidelity                                                    | `ticket.catalog.medications.normalized-regimen-risk-benefit`; `ticket.catalog.interventions.identity-and-fidelity` |
| Dispositions and service access                | Three dispositions, facility/capability/service catalogs, safe referral                                                                      | Current identities are sufficient for the first foundation; split or expand only when a focused policy exposes a real missing owner             | Coverage ticket when encountered                                                                                   |
| Diagnosis dossiers                             | Nine family files, MDD base rules, qualitative composition                                                                                   | Deepen MDD and related dossiers only after shared concepts point to general owners                                                              | Database-first review queue and source-specific tickets                                                            |
| Decision and scoring policy                    | Pure predicate evaluation, rule combination, receipts, reference runs                                                                        | A reusable policy catalog/compiler that selects only focused positive rules plus global safety rules and diagnoses missing coverage             | `ticket.engine.decision-policy.catalog-compiler`                                                                   |
| Fact compilation                               | Deterministic case instantiation and case-local finding generation                                                                           | Resolve each canonical finding once, retain contributors/conflicts, and compile separately saved assessment/wording projections                 | `ticket.engine.patient-generation.shared-finding-compiler`                                                         |
| Target instances and persistence               | Frozen `CaseInstance`, replay/events, versioned save data, IndexedDB abstraction                                                             | `PatientTemplate → PatientInstance → EncounterInstance + CompiledRubric`, with migration and historical replay                                  | `ticket.engine.patient-generation.catalog-compiled-instances`                                                      |
| Generated cohorts                              | Cosmetic variants and finite compatibility/reviewer cases                                                                                    | Runtime composition, seed sweeps, richness calibration, and generated queues                                                                    | Intentionally deferred until every prior gate is coherent                                                          |

## Ordered blocking queue

The general dependency gate depends on the following work in this order:

1. `ticket.catalog.findings.canonical-definition-boundary` (resolved 2026-07-28)
2. `ticket.catalog.findings.general-psychiatry-seed` (resolved 2026-07-28)
   - anhedonia, fatigue/energy, mechanical source/time, behavior/interpretation, and typed-value
     owner boundaries resolved; paranoia/content identities resolved; 41 definitions
3. `ticket.schema.patient-state.latent-proposition-evidence-foundation` (resolved 2026-07-28)
4. `ticket.catalog.findings.subjective-presentation-projection-foundation`
5. `ticket.catalog.measurements.vitals-exam-foundation`
6. `ticket.catalog.tests.structured-result-foundation`
7. `ticket.schema.patient-state.resolved-record-foundation`
8. `ticket.catalog.exposures.substance-use-foundation`
9. `ticket.catalog.interventions.identity-and-fidelity`
10. `ticket.catalog.medications.normalized-regimen-risk-benefit`
11. `ticket.engine.decision-policy.catalog-compiler`
12. `ticket.engine.patient-generation.shared-finding-compiler`
13. `ticket.engine.patient-generation.catalog-compiled-instances`

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
5. every selected medication, intervention, and disposition references a stable reusable owner;
6. one reviewed broad or uncertainty-aware route plus relevant prerequisites, fit, interaction,
   safety, and disposition contributors compile into a deterministic, explainable rubric without
   requiring exact diagnostic precision;
7. missing rule or route coverage becomes a nonblocking diagnostic and ticket rather than an
   invented default or patient deletion;
8. literal same-scope contradictions retry deterministically or quarantine, while conflicting
   source evidence remains valid state;
9. the same recipe, clinic state, seed, and content versions reproduce the same resolved patient,
   encounter, rubric, score trace, and settlement;
10. current `CaseBlueprint` attempts still replay unchanged through an explicit compatibility or
    migration path; and
11. Player, Reviewer, and Developer bundle boundaries remain intact.

No generated-patient count, seed-distribution target, displayed difficulty, or play-time gate
applies before this foundation exists.

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
