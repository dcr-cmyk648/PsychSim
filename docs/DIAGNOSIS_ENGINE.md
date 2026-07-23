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
- source-linked complexity contributions;
- source-use notes that identify exactly which nested rules they informed.

MDD therefore has one family file containing the future mild, moderate, and severe branches. Its severity constraints are deliberately `disabled_pending_source`; the file does not guess symptom-count, impairment, psychosis, or safety thresholds while the source request remains open.

A patient file continues to own:

- its fixed primary, contributing, excluded, and reference-only diagnoses;
- any explicitly allowed optional-comorbidity candidates;
- structured observations and information results;
- gameplay-critical context dimensions such as sleep pattern or body-habitus category;
- its broad authored treatment route, case-specific exceptions, and safe fallback;
- source provenance and all presentation wording.

Medication, investigation/test, therapy/disposition, service, and location knowledge remains in their respective catalogs. Diagnosis files reference those stable IDs; they do not copy their labels, operating costs, laboratory ranges, or medication properties.

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

Objective fit and player knowledge remain separate concerns. The resolved patient fact can affect actual fit even when the player failed to ask for it; a separate workup rule can then evaluate whether the player obtained the relevant information. Whether this should be the default policy for every fit variable is an open product decision.

## Comorbidity composition

The schema can declare bounded optional contributing diagnoses with game inclusion probabilities, permitted severity/specifier IDs, a maximum active-diagnosis count, and `conflictPolicy: "quarantine"`. The composer already evaluates any resolved multi-diagnosis patient.

Random optional-comorbidity selection is not enabled in approved content yet. Before enabling it, the project needs one binding decision about where candidate pools and their game weights live. The recommended model is patient-family-owned pools: a diagnosis file states compatibility or overlap, while a patient family explicitly lists the comorbidities it may draw. This avoids treating every diagnosis as globally mixable and avoids presenting game weights as prevalence estimates.

Every resolved combination must be validated before it can occupy a patient slot. A mutually exclusive pair, disabled severity branch, unknown specifier, or incompatible active rule quarantines the generated instance rather than silently dropping a diagnosis or rule.

## Conflict detection

The composer currently blocks:

- missing or duplicated active diagnosis definitions;
- unknown or source-disabled severity selections;
- unknown or mutually exclusive specifiers;
- mutually exclusive diagnosis pairs;
- active positive and negative stances aimed at the same domain and target.

Clinical conflicts never use “newest source wins,” “most specific wins,” or diagnosis ordering. They produce stable rule IDs and diagnosis IDs suitable for a clinical review ticket. The current rule conflict scan is deliberately conservative: it does not attempt a general satisfiability proof for two complex selection predicates. A later compiler may prove that conditions are mutually exclusive; until then the combination remains reviewable instead of being guessed safe.

## Complexity

Raw diagnosis count is not a reliable patient level. One diagnosis can require dangerous interaction management, extensive workup, or a difficult disposition, while several stable comorbid diagnoses can still be straightforward.

The engine therefore accumulates reviewed contributions along five independent dimensions:

- diagnostic
- pharmacologic
- workup
- safety/disposition
- information burden

It returns the vector and its traceable contributions. It does not yet collapse the vector into a player-facing level. A later progression policy can be tuned from reference patients and playtest duration without rewriting diagnosis or patient files.

## Validation and provenance

Validation now checks:

- unique diagnosis and nested rule IDs;
- valid patient diagnosis/severity/specifier references;
- valid medication, medication-tag, information, intervention, and disposition targets;
- valid diagnosis-context predicates and treatment-selection predicates;
- valid evidence/source-use targets;
- approved-rule attribution;
- source-reviewed severity before generation can be enabled;
- fixed and candidate composition conflicts;
- deterministic clinical-context bindings and finding limits;
- test profiles that reference only cataloged diagnoses;
- one runtime diagnosis catalog registration.

Current placeholder files for MDD, bipolar-spectrum disorder, substance-induced mood disorder, medication-induced akathisia, and borderline personality disorder contain no newly invented treatment rules. Their purpose is referential integrity and authoring structure.

## Open decisions before guideline application

1. Decide whether safety conflicts always hard-block while non-safety conflicts always create a ticket, or whether a narrow documented precedence rule is allowed.
2. Confirm that optional comorbidity candidates live in patient-family pools rather than being drawn globally from diagnosis relationships.
3. Confirm whether objective fit and discovery credit are always scored separately.
4. Choose how the five-dimensional complexity vector eventually becomes an unlock tier, if it should be displayed at all.
5. Define a versioned patient-specific override record with provenance before allowing an exception to supersede diagnosis guidance.
6. Decide whether reusable context conditions should continue to use stable clinical tags or move to a first-class typed clinical-fact catalog before the database grows.
