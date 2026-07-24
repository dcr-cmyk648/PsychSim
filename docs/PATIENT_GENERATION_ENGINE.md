# Patient generation and encounter compilation

## Status and purpose

This document records the next clinical-data boundary before PsychSim adds more diagnoses or
guideline-derived rules. It is an architecture contract, not an executable clinical policy. Current
runtime patients and point values are unchanged.

The source-controlled unit should not be a single memorable fictional person. It should be a
reviewed generator recipe capable of producing many resolved patients who share a clinical
decision state without sharing giveaway wording or irrelevant details.

## Proposed ownership model

```text
diagnosis / medication / test / therapy catalogs
                    +
        sourced clinical decision policies
                    +
            one PatientTemplate
                    |
          deterministic generation
                    v
             PatientInstance
                    |
          encounter compilation
                    v
     EncounterInstance + CompiledRubric
                    |
            player event history
                    v
                  Attempt
```

The intended records are:

- `DiagnosisDefinition`: one logical family record with criteria, severity, specifiers,
  compatibility metadata, and reusable qualitative guidance.
- `MedicationDefinition`: medication identity, classes, interactions, monitoring, adverse-effect
  and fit rules. Patient regimens reference it; they do not copy its knowledge.
- `TestDefinition`, `InformationActionDefinition`, and therapy/disposition definitions: shared
  options and result-generation rules.
- `ClinicalFactDefinition`: a typed fact or measurement that can be generated, observed, and used
  by rules. Stable tags are derived cross-file indexes, not substitutes for the underlying value.
- `DecisionPolicyDefinition`: a sourced decision node such as an acute episode after a documented
  inadequate response. It declares applicability and broad acceptable next-step families without
  owning game-balance points. It may be nested under or registry-linked to the diagnosis family
  that logically owns it; the important boundary is that templates reference the policy rather
  than copy it.
- `PatientTemplate`: the source-controlled patient-family recipe. It owns setting, required and
  optional condition constraints, medication-regimen and prior-trial constraints, available
  records, presentation modules, a focused encounter objective, and narrow patient-specific
  adjustments.
- `PatientInstance`: the fully resolved fictional person. It saves every generated condition,
  chart claim, medication-regimen entry, prior trial, fact, observation, demographic value, and
  seed-derived choice. It is never regenerated during replay.
- `EncounterInstance`: the frozen decision snapshot presented to the player. It identifies the
  immediate decision horizon, available investigations and treatments, and the compiled rule
  trace.
- `CompiledRubric`: the deterministic result of composing reviewed diagnosis, medication,
  investigation, decision-policy, setting, and patient-specific rules. It is derived content rather
  than a second hand-authored treatment plan.

“Case” can remain player-facing shorthand for an encounter. In source code and content, the
specific record name should state whether it is a reusable template, a resolved patient, or a
frozen encounter.

## Diagnosis truth versus chart history

Complex psychiatric records require two different layers:

1. Internal `ConditionState` records drive generation and scoring. They identify the modeled active
   syndrome, severity/specifiers, temporal status, and encounter relevance.
2. `DiagnosisRecordEntry` records represent what a problem list, outside record, patient, or prior
   clinician says. They carry source and assertion status and may be accurate, incomplete,
   historical, duplicated, or questionable.

A chart diagnosis must not automatically activate every treatment rule. This separation allows a
patient to arrive with six recorded diagnoses while only some are modeled as active, and it allows
record review itself to be useful gameplay. Neither layer is displayed as an answer key before
submission.

## Medication regimens and prior trials

Medication IDs alone cannot represent realistic polypharmacy. A resolved patient needs a multiset
of stable `MedicationRegimenEntry` records. Each entry has its own instance ID and references a
catalog medication, so duplicate agents and duplicate classes remain representable. Stop and
continue actions target the regimen-entry ID; a start action targets a catalog medication ID.

Past treatment belongs in structured `MedicationTrialRecord` values rather than prose facts.
Initially, adequacy can use reviewed categorical fields instead of real-world dosing:

- dose adequacy: adequate, inadequate, or unknown;
- duration adequacy: adequate, inadequate, or unknown;
- adherence: adequate, limited, absent, or unknown;
- response: remission, response, partial response, no response, worsened, or unknown;
- tolerability and reason stopped;
- information source and confidence.

This is sufficient to distinguish nonresponse from an inadequate trial, intolerance, or
nonadherence without turning PsychSim into a dosing or EHR simulator.

## Focused decision horizon

An encounter should declare what is being judged: initial questioning, focused workup, medication
reconciliation, safety/disposition, or a best next step. The engine may require companion safety
actions, but it should not silently grade the player against an exhaustive long-term treatment
plan.

For example, an inpatient with several chronic diagnoses, nine active medication entries, and
superimposed delirium can still be a focused encounter. Most background data affect the available
clues, interactions, and safety constraints; only rules relevant to the current decision horizon
enter the positive-treatment rubric. Global safety and interaction rules always remain eligible.

## Deterministic constrained generation

Independent random draws are not sufficient for clinically coherent patients. Generation should
use a deterministic constrained pipeline:

1. Resolve the template, setting, and encounter objective.
2. Resolve internal condition states and patient-family-owned optional comorbidities.
3. Resolve chart diagnosis entries separately.
4. Resolve current regimen entries and structured prior trials.
5. Resolve typed clinical facts and derive stable tags from them.
6. Generate presentation wording, findings, and noncritical observations.
7. Compile only applicable clinical rules for the decision horizon.
8. Validate consistency, action accessibility, at least one safe route, target complexity envelope,
   and absence of impossible combinations.
9. Retry from deterministic sub-seeds within a fixed limit, or quarantine with a reproducible
   reason.
10. Save every resolved value in the `PatientInstance` and `EncounterInstance`.

Incidental test abnormalities remain bounded, non-case-defining observations. A genuine additional
condition is introduced only through an explicit reviewed condition/comorbidity module, never by a
generic incidental-value generator.

## Derived facts and tags

A flexible tag such as `clinical-tag.body-habitus.high-bmi` is useful because medication, workup,
and diagnosis files can all reference it. The tag must be derived from a typed source of truth such
as a resolved BMI measurement or reviewed body-habitus category.

This keeps indirection without allowing contradictory free strings:

```text
typed BMI fact / category
        -> reviewed derivation rule
        -> clinical-tag.body-habitus.high-bmi
        -> medication-fit and workup rules
```

The generated fact, derivation version, and derived tag are all saved for replay and audit.

## Shared finding constraint composition

A reusable finding is resolved once per generated patient even when several owners influence it.
Owners do not write the final value and do not overwrite one another. They emit typed constraints
equivalent to:

- `required-present` or `required-absent` for reviewed hard facts;
- `diagnostic-requirement` for criteria and cardinality constraints;
- `weighted-tendency` for compatible nonessential influences;
- `no-opinion` when the owner does not constrain the finding.

The deterministic resolver applies explicit patient/template critical facts, satisfies active
diagnostic requirements, combines compatible soft tendencies, and then fills remaining variation
from the background module. Hard contradictions produce a stable conflict and ticket or quarantine
rather than a load-order winner. An intentional fixed patient fact requires a versioned reason and
remains visible in the audit.

The saved resolution trace identifies every contributing owner and constraint, the deterministic
draw when one was needed, the final value, and any conflict outcome. The encounter may present one
compact blended finding to the player, but the post-submission and developer views can always
disentangle why it was generated. Numerical calibration of combined soft tendencies remains a
separate balance decision.

## Syndrome generation and incompatibility validation

Background variation may produce isolated, overlapping, and subthreshold symptoms. It is not a
syndrome composer. A full condition enters the internal state only because the patient template
requires it or because the template's reviewed optional-comorbidity pool selects its condition
module. The post-submission Developer audit distinguishes those origins.

Reviewed operational criteria then validate the resolved findings. If independent background draws
accidentally satisfy an unrequested complete syndrome, the candidate is treated as a generation
defect and is deterministically retried or quarantined rather than silently assigned a new
diagnosis. Likewise, diagnosis definitions declare reviewed incompatibilities, and an incompatible
active-condition combination invalidates the generated candidate. Chart diagnosis entries remain
separate and may still contain inaccurate, historical, or superseded labels.

This boundary preserves ordinary symptom variation and its treatment-fit effects while preventing
random fact collisions from changing the authored question-bank decision state.

### Template diagnosis boundary and minimal repair

Each patient template declares its required conditions and a small explicit pool of optional
conditions. Together they form the allowed diagnosis set for generated patients from that
template. Operational diagnostic criteria serve as a generation guardrail rather than a
general-purpose diagnostic inference engine.

If low-priority background findings accidentally cross the threshold for a diagnosis outside the
allowed set, the generator deterministically removes the smallest set of those disposable findings
needed to restore the intended state. It never removes authored critical facts,
diagnosis-required findings, medication effects, or other protected facts. The initial cleanup
budget is one or two findings; a candidate requiring broader repair is regenerated or quarantined
as evidence that its randomization is poorly constrained. The Developer audit records every
removed finding and its origin.

## Guideline-shaped scenario example

The ACP acute-MDD recommendation discussed on 2026-07-23 illustrates the split:

- the MDD diagnosis family owns the selected diagnostic standard, episode state, and sourced
  severity representation;
- a decision-policy record owns the applicability condition “acute moderate-to-severe MDD after an
  adequate initial second-generation antidepressant trial without response” and the broad
  recommendation branches;
- a patient template requests that state and may add reviewed sleep, body-habitus, adherence,
  comorbidity, and medication-history modules;
- the generator chooses a concrete antidepressant/trial record and varied presentation while
  preserving the decision state;
- medication, therapy, interaction, and safety rules adjust the compiled choices for the resolved
  patient;
- higher-complexity templates can add chart noise, additional active conditions, prior trials, or
  polypharmacy without copying the MDD recommendation into each patient.

The [official ACP 2023 summary](https://www.acponline.org/acp-newsroom/american-college-of-physicians-recommends-cognitive-behavioral-therapy-or-second-generation)
describes switching to or augmenting with CBT, or switching to another second-generation
antidepressant or augmenting with a second pharmacologic treatment, for this population. That
publication is an architectural example only here. It must enter the evidence and rule-review
workflow—including review of later living-guideline alerts—before any executable recommendation is
enabled.

## Conflicts found in the current model

The present checkpoint is adequate for two simple patients but is intentionally transitional:

- `CaseBlueprint` currently combines generator recipe, resolved-patient content, and most of the
  rubric.
- `PatientDiagnosis.role` expresses primary/contributing/excluded/reference-only, but cannot
  distinguish internal condition truth from an uncertain chart claim.
- current medications and treatment selections are medication-ID sets, so duplicate regimen
  entries cannot be targeted independently.
- prior medication trials are revealed as findings rather than saved as reusable structured
  records.
- broad per-case treatment grades remain more authoritative than the planned compiled rule system.
- quarantining every opposed recommendation stance is safe for early authoring but too aggressive
  for realistic multimorbidity, where a treatment benefit for one condition and a safety problem
  from another may be the intended puzzle.

No existing save shape should be silently reinterpreted. A schema migration should preserve old
case snapshots while new templates compile to the new records.

## Conflict classes for complex generation

The next compiler should distinguish:

- **structural invalidity**: impossible or malformed state, missing definition, mutually exclusive
  internal states, inaccessible required action, or no safe route; quarantine;
- **clinical tension**: two valid conditions create competing benefits, harms, or priorities; retain
  as encounter data and let a reviewed safety rule govern while preserving both sides in the trace;
- **evidence disagreement**: sources or reviewers disagree about the rule itself; create a ticket
  and keep the disputed executable change disabled;
- **balance disagreement**: clinical direction is accepted but point magnitude is unsettled; keep
  it outside diagnosis/evidence files and route it to balance review.

Only structural invalidity or the absence of a safe route automatically quarantines. A
patient-specific override is still required when the reviewed shared rules cannot safely resolve a
particular composition.

## Resolved decisions

The user's complex-record example resolves two boundaries: internal condition states are separate
from visible/obtainable chart diagnosis entries, and a best-next-step encounter grades a focused
decision set—often one primary decision plus required companion safety actions—rather than an
exhaustive complete plan.

Reviewed safety constraints may resolve an otherwise valid clinical tension while preserving both
rules in the trace. Structural invalidity and the absence of a safe route still quarantine; evidence
disagreement remains disabled behind a ticket; balance disagreement does not change clinical
direction.

Patient templates declare target envelopes over the five-axis complexity trace. The compiler
measures the resolved patient after composition and deterministic variation, then accepts,
deterministically retries, or quarantines it against that envelope. This is provisional and will be
calibrated with reference patients before any single displayed patient level or progression formula
is adopted.

These are accepted design constraints, not claims about the current runtime. The current
`CaseBlueprint` path has neither typed conflict classes nor template complexity envelopes; the
versioned compiler migration must add them without reinterpreting historical attempts.
