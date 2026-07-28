# Diagnosis and patient-composition engine

## Purpose

PsychSim separates reusable clinical knowledge from a particular fictional patient. A diagnosis file describes reviewed guidance shared by a diagnosis family. A patient file describes which diagnosis modules and structured patient facts apply to one generative patient family. The pure engine composes those inputs, reports contradictions, and leaves point balancing to a separate policy.

This checkpoint establishes mechanics, not clinical authority. The checked-in diagnosis definitions and all current executable cases remain medically unreviewed. No diagnosis guidance in this layer currently changes a production receipt.

## Ownership boundaries

One diagnosis family lives in one file under `content/catalogs/diagnoses/definitions/`. It may own:

- base clinical tags and qualitative rules that apply to the whole family;
- one optional severity axis, with ordered levels in the same file;
- specifiers, including mutually exclusive groups;
- compatibility, overlap, or exclusion relationships with other diagnoses;
- broad condition-specific treatment routes, including complete best-next-step regimen
  transitions when the focused decision requires them;
- source-linked complexity contributions;
- source-use notes that identify exactly which nested rules they informed.

MDD therefore has one family file containing the future mild, moderate, and severe branches. Its severity constraints are deliberately `disabled_pending_source`; the file does not guess symptom-count, impairment, psychosis, or safety thresholds while the source request remains open.

A medically unreviewed severity-policy packet now asks whether a patient template should author
intended severity while the generator validates separate bounded dimensions such as symptom
burden, intensity, distress, and function. Psychosis and acute safety remain separate structured
facts, and a PHQ band remains a symptom-burden measurement rather than a diagnosis or sole severity
definition. This is a decision proposal, not an adopted generator algorithm; all MDD severity
branches remain disabled until the envelopes and provenance receive psychiatrist review.

A patient-template file continues to own:

- the internal condition constraints and separately generated chart-diagnosis records needed for
  the encounter;
- any explicitly allowed optional-comorbidity candidates;
- structured observations and information results;
- gameplay-critical context dimensions such as sleep pattern or body-habitus category;
- its focused decision state, narrow case-specific exceptions, and safe fallback;
- source provenance and all presentation wording.

Medication, investigation/test, therapy/disposition, service, and location knowledge remains in their respective catalogs. Diagnosis files reference those stable IDs; they do not copy their labels, operating costs, laboratory ranges, or medication properties.

A broad treatment route may classify both a patient's current regimen and the submitted transition
as generally compatible with condition guidance. It therefore cannot stop at “contains an allowed
medication.” It may describe roles and cardinalities for a retained anchor, an entry to stop or
reduce, and a replacement or adjunct. The resolved regimen and trial history supply response,
tolerability, prior exposure, and role; medication, interaction, finding, and other topical rules
supply specific fit and safety; balance supplies points. The encounter grades the complete
snapshot recommendation without simulating doses, a cross-taper, follow-up, or future response.

Standardized classification background lives separately under
`content/catalogs/diagnoses/classifications/`. It is not another diagnosis-rule catalog. A
`DiagnosisDefinition` may carry compact `classificationBindings`, each naming a release ID, code,
explicit mapping relation, note, and review record. There is no automatic label match or one-code
assumption: a PsychSim family may be exact, broader, narrower, or merely related. These bindings
support authoring, search, provenance, and future exports; they never activate criteria, severity,
complexity, treatment, or scoring.

The current `CaseBlueprint` still combines these responsibilities for the playable prototype.
[PATIENT_GENERATION_ENGINE.md](PATIENT_GENERATION_ENGINE.md) records the planned split among a
reusable patient template, fully resolved `PatientInstance`, frozen `EncounterInstance`, and
derived rubric before complex multi-diagnosis generation is enabled.

## Composition flow

```text
diagnosis base guidance
        ↓
selected severity branch
        ↓
selected specifier branches
        ↓
other active diagnoses
        ↓
resolved patient context tags
        ↓
patient-specific reviewed override (future)
        ↓
conflict scan → composed qualitative guidance or quarantine
```

`composeDiagnosisGuidance` is pure and deterministic. It accepts already resolved patient diagnoses and clinical tags. It returns the active diagnosis IDs, derived tags, active rules, a complexity vector, and every conflict. It does not pick an evidence winner, assign points, or mutate a case.

Only `primary` and `contributing` diagnoses contribute guidance. `excluded` and `reference_only` entries remain internal case logic and test-generation context; they never activate treatment rules.

## Qualitative rules before point balance

`DiagnosisRecommendationRule` uses a constrained stance:

- `required`
- `preferred`
- `acceptable`
- `neutral`
- `discouraged`
- `avoid`
- `contraindicated`

A rule targets a cataloged medication, medication tag, information action, intervention, or disposition. `patientWhen` may inspect only declared diagnoses, severity, specifiers, and clinical tags. `selectionWhen` may inspect only structured treatment selections. It cannot reach case-local fact IDs, service ownership, purchased actions, arbitrary expressions, or executable code.

This lets a later sourced rule represent the shape of “metabolic assessment is required when an antipsychotic is selected for a patient with the relevant body-habitus context” without embedding an unexplained point number. A separately versioned balance policy will eventually translate a reviewed stance and safety classification into receipt magnitude.

## Gameplay-critical patient variation

Cosmetic variants and clinical variants are different systems.

Cosmetic variants change names, chief-complaint wording, occupation, and other noncritical presentation fields. `PatientClinicalContextDimension` handles facts that can change treatment fit, workup, safety, or complexity. Each dimension contains reviewed gameplay-weighted options. Exactly one option resolves deterministically from the case seed.

Every option:

- adds zero or more structured clinical tags;
- binds the same declared variable finding targets to `present` or `absent`;
- is saved in `CaseInstance.resolvedClinicalContext`;
- is materialized before tests and treatment fit are evaluated;
- cannot overlap another dimension or contradict required finding constraints.

For example, an insomnia option can make the short depressive-symptom finding positive and add `symptom.insomnia`; the no-insomnia option makes that same finding negative and does not add the tag. A medication-fit rule then sees the resolved tag. This prevents a hidden fit modifier from disagreeing with the history the player can buy.

The option field is named `gameSelectionWeight` intentionally. It is a game-generation distribution, not an epidemiologic prevalence claim. Any distribution that changes care requires its own review and provenance.

Objective fit and player knowledge are separate concerns. The resolved patient fact affects actual
fit even when the player failed to ask for it; a separate workup rule evaluates whether the player
obtained the relevant information. The receipt must trace those effects separately so an objective
fit modifier is not mistaken for discovery credit.

D-143 confirms that all objectively applicable positive and negative fit effects use this complete
resolved state whether or not the player revealed it. Information helps the player select the
right treatment but does not change the patient's downstream response. Player knowledge remains
available for independent workup predicates and audit; it is not a fit-point gate. The current
medication-fit engine already follows this rule by evaluating saved clinical tags rather than
`knownFactIds`.

## Comorbidity composition

The schema can declare bounded optional contributing diagnoses with game inclusion probabilities, permitted severity/specifier IDs, a maximum active-diagnosis count, and `conflictPolicy: "quarantine"`. The composer already evaluates any resolved multi-diagnosis patient.

Random optional-comorbidity selection is not enabled in approved content yet. Candidate pools and
game weights belong to the patient family: a diagnosis file states compatibility or overlap, while
a patient template explicitly lists the comorbidities it may draw. This avoids treating every
diagnosis as globally mixable and avoids presenting game weights as prevalence estimates.

Every resolved combination must be validated before it can occupy a patient slot. A mutually
exclusive pair, disabled severity branch, or unknown specifier quarantines the generated instance
rather than silently dropping a diagnosis or rule. The current engine also quarantines opposed
active recommendation stances. That conservative rule is adequate for the simple checkpoint but
must be divided into structural invalidity, valid clinical tension, evidence disagreement, and
balance disagreement before complex poly-diagnosis generation.

## Conflict detection

The composer currently blocks:

- missing or duplicated active diagnosis definitions;
- unknown or source-disabled severity selections;
- unknown or mutually exclusive specifiers;
- mutually exclusive diagnosis pairs;
- active positive and negative stances aimed at the same domain and target.

Clinical conflicts never use “newest source wins,” “most specific wins,” or diagnosis ordering.
They produce stable rule IDs and diagnosis IDs suitable for a clinical review ticket. The current
rule conflict scan is deliberately conservative: it does not attempt a general satisfiability proof
for two complex selection predicates. Before hospital-level patients are generated, the compiler
must preserve clinically meaningful benefit-versus-risk tensions without confusing them with
malformed or unwinnable content. See
[PATIENT_GENERATION_ENGINE.md](PATIENT_GENERATION_ENGINE.md).

## Complexity

Raw diagnosis count is not a reliable patient level. One diagnosis can require dangerous interaction management, extensive workup, or a difficult disposition, while several stable comorbid diagnoses can still be straightforward.

The engine therefore accumulates reviewed contributions along five independent dimensions:

- diagnostic
- pharmacologic
- workup
- safety/disposition
- information burden

It returns the vector and its traceable contributions. It does not yet collapse the vector into a player-facing level. A later progression policy can be tuned from reference patients and playtest duration without rewriting diagnosis or patient files.

## Diagnostic-source rights boundary

A source can influence this engine only after two independent gates: a `SourceUseDecision` must
permit the intended processing and derived use, and the resulting rule must receive its own
clinical review. Catalog presence, an ICD code, or a clinician's private cross-check does not
satisfy either gate. See [SOURCE_USE_POLICY.md](SOURCE_USE_POLICY.md).

The source-specific copyright notice in the 2024 WHO CDDR PDF is CC BY-NC-ND 3.0 IGO and prohibits
adaptation without permission, despite a conflicting generic licence link on its landing page. The
separate ICD-11 digital classification/API is also NoDerivatives. DSM-5-TR remains metadata-only
pending written permission. No CDDR or DSM text, criteria table, organization, or comprehensive
paraphrase enters the engine. Diagnosis modules instead use independently reusable sources plus
narrow, separately labeled Developer opinion where needed.

## Validation and provenance

Validation now checks:

- unique diagnosis and nested rule IDs;
- valid compact classification bindings against the pinned authoring release;
- no inferred mappings or classification-derived criteria or rules;
- valid patient diagnosis/severity/specifier references;
- valid medication, medication-tag, information, intervention, and disposition targets;
- valid diagnosis-context predicates and treatment-selection predicates;
- valid evidence/source-use targets;
- an applicable source-use decision before source processing or transformation;
- authoring-only classifications and metadata-only sources remain outside runtime bundles;
- approved-rule attribution;
- source-reviewed severity before generation can be enabled;
- fixed and candidate composition conflicts;
- deterministic clinical-context bindings and finding limits;
- test profiles that reference only cataloged diagnoses;
- one runtime diagnosis catalog registration.

Current placeholder files for MDD, bipolar-spectrum disorder, substance-induced mood disorder, medication-induced akathisia, and borderline personality disorder contain no newly invented treatment rules. Their purpose is referential integrity and authoring structure.

## Resolved decisions for the next compiler

Resolved:

- optional comorbidity candidates and game weights live in patient-family pools;
- objective clinical fit and the player's discovery/workup credit are traced separately;
- reusable cross-file tags remain, but are derived from typed clinical facts or measurements rather
  than acting as free-string sources of truth;
- a diagnosis family may contribute a constraint or tendency to a shared finding, but the
  `PatientInstance` resolves that finding once; test definitions, player reveal actions, and
  post-submit scoring remain separate owners;
- one selected diagnostic standard owns criteria and severity representation; treatment guidelines
  consume those states without redefining them;
- patient-specific exceptions require a versioned, provenance-bearing override record;
- broad treatment guidance can compile a complete entry-targeted regimen transition, allowing both
  the baseline and proposed states to be broadly acceptable while incremental fit, safety,
  response, adverse effects, and prior trials distinguish the better next step;
- diagnosis dossiers may display separately typed, nonexecutable `source_lead` or
  `authoring_inference` speculative candidates with exact provenance and follow-up questions, but
  never auto-fill sparse sections or treat speculation as evidence, opinion, fact, rule, points, or
  approval;
- structural invalidity, inaccessible required care, and no-safe-route states quarantine;
- valid benefit-versus-risk tension remains playable, with a reviewed safety rule allowed to govern
  while both sides remain visible in the trace;
- evidence disagreement creates a ticket and leaves the disputed executable change disabled;
- balance disagreement stays outside diagnosis/evidence files and routes to point review;
- templates declare a five-dimensional target complexity envelope, while the compiler measures the
  resolved patient and accepts, retries, or quarantines it against that envelope;
- no permanent scalar patient level or unlock formula is committed until reference-patient testing
  makes that simplification useful.

The current `composeDiagnosisGuidance` implementation predates these compiler decisions. It still
treats every opposing active stance as a blocking `RULE_STANCE_CONFLICT`, does not consume a
template complexity envelope, and does not yet emit shared-finding contributions. That
conservative checkpoint remains safe, but it must be migrated before complex generated patients
are enabled.
