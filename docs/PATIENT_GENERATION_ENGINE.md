# Patient generation and encounter compilation

## Status and purpose

This document records the next clinical-data boundary before PsychSim adds more diagnoses or
guideline-derived rules. It is an architecture contract, not an executable clinical policy. Current
runtime patients and point values are unchanged.

The source-controlled inputs should not be a catalog of resolved fictional people. Authoring
prepares reusable diagnosis, finding, test, intervention, policy, and context files plus a reviewed
case/encounter recipe. Once the dependency gate is complete, the deterministic browser engine
uses those static files and an internal seed to construct a resolved patient and frozen encounter
when a queue slot is filled. No generalized patient generator is active yet.

## Proposed ownership model

```text
approved diagnosis / finding / medication / test / therapy catalogs
                    +
        sourced clinical decision policies
                    +
    one case/encounter recipe (`PatientTemplate`)
                    +
            clinic/location state + seed
                    |
    deterministic browser-runtime composition
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
  compatibility metadata, and reusable qualitative guidance across settings and treatment
  intensity. It owns no encounter time, difficulty, complexity budget, facility, or location.
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
- `PatientTemplate`: the current technical name for the source-controlled case/encounter recipe,
  not a pre-generated patient. It owns setting, required and optional condition constraints,
  medication-regimen and prior-trial constraints, available records, presentation modules, a
  focused encounter objective, an encounter complexity budget or envelope, presentation limits,
  and narrow patient-specific adjustments.
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

The reusable MDD dossier is not an “outpatient MDD generator.” It must be able to supply shared
knowledge to later outpatient, inpatient, polypharmacy, ECT, ketamine, and other MDD encounter
recipes. Those recipes select the relevant branches and keep the immediate question legible;
unsupported branches remain sparse rather than being invented.

## Generation-readiness dependency order

Runtime generation is the last integration step, not the mechanism used to discover or patch
missing data. Ticket priority follows the complete architecture:

1. **Identity and governance:** stable IDs, one canonical owner, aliases, registry relationships,
   schema/content versions, lifecycle state, provenance, source-use decisions, and rule-level
   review boundaries.
2. **General resolved patient state:** demographics and neutral presentation pools; time course,
   symptoms, function, safety, social and substance history; MSE and physical findings; vitals,
   anthropometrics, and other measurements; internal conditions versus chart diagnoses and
   rule-outs; allergies/adverse reactions; current prescription, nonpsychiatric medication, and
   supplement regimen entries; prior medication and psychotherapy trials; prior levels of care;
   adherence and tolerability; and reusable contextual dimensions.
3. **General investigations and actions:** one owner per laboratory analyte or panel with units,
   population/reference intervals, precision, and bounded incidental behavior; imaging,
   electrical studies, toxicology, medication levels, and named instruments; neutral searchable
   reveal actions; fixed or patient-defined structured result contracts; patient-owned resolved
   values and critical overrides; service access and fulfillment; and shared medication,
   psychotherapy, other-intervention, and disposition identities.
4. **Reusable knowledge:** diagnosis-family and intervention dossiers, severity/specifier
   branches, clinical associations, treatment roles, interactions, contraindications, monitoring
   or treatment prerequisites within the focused snapshot, and explicit cross-topic
   relationships. A dossier may be drafted before all dependencies when doing so identifies the
   missing owners, but it cannot silently contain local replacements for them.
5. **Decision and scoring compilation:** broad best-next-step routes, conditional workup,
   treatment-fit contributors, regimen-transition logic, parsimony and combination rules,
   disposition consequences, qualitative rule review, provisional balance, provenance snapshots,
   and deterministic combination/receipt traces.
6. **Recipe and compiler mechanics:** the case/encounter-recipe schema, complexity budget or
   envelope, typed constraint resolution, contributor provenance, `PatientInstance`,
   `EncounterInstance`, `CompiledRubric`, coverage diagnostics, deterministic retry for literal
   conflicts only, replay, persistence/migration, and bundle isolation.
7. **Runtime cohorts and calibration:** only after the preceding slice is coherent may the browser
   generate patients, run many seeds, calibrate complexity and presentation, or expand player
   queues.

This is not a requirement to encode all medicine or all psychiatry before one generated encounter.
It is a requirement to build the smallest complete _general_ dependency slice rather than hiding
missing owners in MDD-specific prose. MDD and GAD dossiers can serve as design probes, while every
dependency they expose is routed back to its general owner before generation is enabled.

The dated implementation audit, current owner inventory, and ordered missing-owner tickets live in
[ENCOUNTER_GENERATION_DEPENDENCIES.md](ENCOUNTER_GENERATION_DEPENDENCIES.md). That document is a
non-runtime projection over authoritative tickets, not a second status store.

## Diagnosis truth versus chart history

Complex psychiatric records require two different layers:

1. Internal `ConditionState` records identify the modeled condition-definition version, opaque
   clinical/time state, severity/specifiers, encounter relevance, origin, and resolution trace.
   Their clinical meaning remains catalog-owned rather than hard-coded into the patient envelope.
2. `DiagnosisRecordEntry` records represent what a problem list, outside record, patient, or prior
   clinician says. They carry source and assertion status, may have no catalog mapping, and may be
   accurate, incomplete, historical, duplicated, or questionable.

A chart diagnosis must not automatically activate every treatment rule. This separation allows a
patient to arrive with six recorded diagnoses while only some are modeled as active, and it allows
record review itself to be useful gameplay. Neither layer is displayed as an answer key before
submission.

## Medication regimens and prior trials

Medication IDs alone cannot represent realistic polypharmacy. A resolved patient needs a multiset
of stable `MedicationRegimenEntry` records. Each entry has its own instance ID and references a
catalog identity, so nonpsychiatric medications, duplicate agents, and duplicate classes remain
representable without making every identity a treatment-menu option. Current-medication
recommendations target the regimen-entry ID and use one categorical snapshot operation:
`continue`, `increase`, `reduce_or_limit`, `taper`, or `stop`. A start action still targets a
catalog treatment ID. These operations never imply a simulated taper schedule.

Past treatment belongs in structured `MedicationTrialRecord` values rather than prose facts.
Player-facing history supplies the observations:

- duration as a number and unit when known;
- highest reported dose, unit, and frequency when known;
- adherence or exposure consistency;
- response;
- tolerability, manifestations, and reason stopped;
- information source and confidence.

The player decides whether that exposure seems sufficient for the immediate question. A reviewed
backend inference may later classify the exposure for rule compilation, but it remains separate
from the displayed observations. Legacy snapshots retain their categorical `adequacy` field for
replay and are never retroactively assigned invented dose or duration values.

Background medication, supplement, and other-substance use resolves through one objective
positive-use inventory. Medication and supplement identities are reused; only other agents receive
new exposure identities. The database may eventually supply one coarse misuse probability given
use, with prescribed-versus-not-prescribed multipliers for medications. Case/context generation
profiles may modify that base before the deterministic final yes/no is saved, but the first
foundation authors no rates or generator.

Each used agent stores current or elapsed recency, current amount when applicable, prescription
relationship for medications, final misuse truth, and one resolution trace. It does not store
unassessed/documented-none states, patient-report accuracy, intoxication, withdrawal, diagnosis, or
attribution. Those belong to separately generated evidence and clinical records, so a patient may
have one objective fact while history, collateral, records, or toxicology provide concordant or
conflicting views. No age distribution, allowlist, supplement-enthusiast pattern, or clinical
effect is active until separately reviewed.

Medication-associated sexual effects are structured tolerability findings tied to one current
regimen entry or prior trial. Unknown is distinct from absent. Any medication-specific random
generation retains the source estimate, population, outcome definition, time horizon, uncertainty,
and a separately reviewed game-probability mapping; published incidence is never silently copied
into the generator.

A complex encounter compiles a regimen transition, not merely a replacement medication set. The
submitted snapshot can preserve one beneficial entry, target another entry with
`reduce_or_limit`, `taper`, or `stop`, and add a replacement or adjunct. The current and proposed
regimens may both satisfy the diagnosis family's broad treatment route. Patient-owned response,
tolerability, adverse-effect, adherence, and prior-trial records combine with reusable medication,
interaction, and fit rules to distinguish the better next move. This supports many current
medications and prior trials without asking the player for a complete longitudinal plan. It does
not infer a dose, cross-taper schedule, future response, or follow-up interval.

## Allergy and adverse-reaction history

A resolved patient carries an explicit reaction-history status rather than relying on an empty
list. `unassessed`, `documented_none`, and `entries_present` are different clinical states; the
player's knowledge of that state remains separate until the universal allergy/adverse-reaction
history action is purchased.

Medication-reaction assessment has its own status. An environmental or food reaction does not
prove that medication reactions were asked about, and only an explicit `documented_none` may
render the medication-reaction row as absent. New patient files own both states; schema defaults
exist only to preserve historical snapshots as unknown.

A reaction record references either a cataloged medication or a stable nonmedication trigger and
one or more stable manifestations. `recordedAs` preserves whether the patient or chart called it
an allergy, intolerance, adverse reaction, or left it unspecified. The nullable `interpretedAs`
field is a separate reviewed conclusion. The generator and UI must never convert a chart label,
sleepiness, hives, an oculogyric crisis, or another manifestation into an immune allergy or
treatment rule by themselves. Non-null `interpretedAs` values remain disabled until the
interpretation can carry rule-level review and provenance.

Reaction history is patient state, not medication knowledge. Medication definitions and reviewed
safety/fit rules determine whether a resolved record affects the focused treatment decision. A
mild background environmental entry may add texture without changing the rubric, while a
decision-relevant medication reaction must remain visible through its own rule trace and
provenance.

Assessment credit and objective treatment consequences are separate. Purchasing reaction history
can satisfy a treatment-triggered workup requirement, but failing to purchase it cannot erase a
pre-resolved reaction to the selected medication. The current compatibility engine can apply one
worst matching generic policy per selected medication using exact trigger identity, chart
category, and reported severity. Those generic severity values are medically unreviewed
provisional balance; they do not infer immune mechanism, absolute contraindication, or
medication-specific retrial acceptability, and a reviewed specific policy must take precedence.

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
eventually use the deterministic constrained pipeline below. It remains an implementation gate,
not current authorization to create patients before the reusable dependencies and compiler passes
exist:

1. Resolve the template, setting, and encounter objective.
2. Resolve internal condition states and patient-family-owned optional comorbidities.
3. Resolve chart diagnosis entries separately.
4. Resolve current regimen entries and structured prior trials.
5. Resolve reaction history and any explicitly authored optional-feature modules.
6. Resolve typed clinical facts and derive stable tags from them.
7. Generate presentation wording, findings, and noncritical observations.
8. Compile only applicable clinical rules for the decision horizon.
9. Validate schema conformance, deterministic identity/reference integrity, literal fact
   consistency, and explicitly reviewed same-scope incompatibilities. Emit nonblocking coverage
   diagnostics for missing action/rubric relationships.
10. Retry from deterministic sub-seeds within a fixed limit, or quarantine with a reproducible
    reason.
11. Save every resolved value in the `PatientInstance` and `EncounterInstance`.

Compiled rules preserve at least: patient scope, submitted-selection trigger, target, consequence,
clinical concern, confidence/certainty, provenance, review state, and the separately versioned
point mapping. Points communicate relative gameplay weight but never become the only stored
meaning of a clinical judgment.

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
compact blended response to the player, but the post-submission and developer views can always
disentangle why it was generated. Numerical calibration of combined soft tendencies remains a
separate balance decision.

One clinical concept may have independently resolved source/time observations. Current
self-report, past or lifetime report, collateral, chart evidence, MSE or physical observation, and
instrument response do not overwrite each other when their values can disagree. Grandiosity, for
example, currently has distinct current self-report, past episodic self-report, and current
MSE-observed identity shells. Discordance is valid and does not make the patient contradictory.
The compiler preserves it without guessing minimization, secondary gain, insight, or etiology.
These combinations are added only when real input requires them; no symptom × source × time
Cartesian catalog is pre-generated.

### Subjective assessment and wording projection

Patient truth, assessment response, and surface wording compile in that order and remain separate.
For example, daytime sleepiness, muscular weakness, psychomotor slowing, medication sedation, and
exertional intolerance can remain distinct resolved findings while any applicable combination may
contribute to a broad self-reported fatigue/low-energy response. The response does not diagnose or
erase its contributors.

A standardized assessment item owns an explicit reviewed source-finding-to-response mapping, its
own yes/no/ordinal scale, timeframe, and respondent or observation modality. An unstandardized
history action instead uses a versioned expression bank with stable variant IDs. Phrase banks may
intentionally overlap—a patient with different underlying facts may say “tired,” “fatigued,” or
“low energy,” and generic grandiosity wording may apply to different report/observation scopes—
without making those facts aliases. No mapping or scope is inferred from strings.

The compiler resolves each applicable projection before play and saves:

- projection ID and content version;
- source action or named instrument/item;
- response value;
- selected expression-bank and wording-variant IDs when applicable; and
- every contributing resolved-finding ID.

Purchasing information reveals that frozen response; it never generates wording or changes a
source fact. Multiple contributors yield one response without duplicate workup credit. Diagnosis,
treatment, and point rules consume typed facts or explicitly reviewed response predicates, never
the displayed phrase. The audit reconstructs `source fact → projection → displayed response`.
These target schemas remain gated by
`ticket.catalog.findings.subjective-presentation-projection-foundation`; current compatibility
`labelVariants` are not the reusable projection model.

### Latent propositions and conflicting evidence

An encounter may explicitly model one adjudicable world-state proposition, such as whether a
specific reported event occurred. That proposition resolves deterministically to true or false
when the patient instance is generated. It is not inferred from whichever report happens to be
revealed, and purchasing information cannot reroll it. Symptoms, subjective experiences,
measurements, diagnoses, and other nonpropositional state retain their existing typed owners.

Every patient, collateral, record, examination, or test result concerning the proposition is a
separate frozen evidence record. Its generator may condition on the latent truth and other reviewed
patient context, producing support, opposition, uncertainty, or inability to assess. The record
saves the source instance, timeframe, stable generator and draw, and exact relation to other
claims. Exact copies share an origin. Known correlated claims use dependency groups; repeated or
copied evidence cannot be counted as independent merely because it appears in several reveal
actions.

The initial foundation does not implement a generic Bayesian engine. Later focused policies may
use reviewed conditional reliability or corroboration rules over explicit independent groups, but
there is no global patient/collateral credibility weight, majority vote, or raw multiplication of
all claims. Conflicting evidence remains valid generated texture. It does not imply deception,
malingering, secondary gain, poor insight, or another explanation unless separately authored.
The resolved claims are not required to converge on the hidden proposition. A plausible patient is
not rerolled or quarantined merely because the complete evidence corpus remains ambiguous,
uninformative, or misleading. Generation profiles later calibrate how often those patterns occur;
they do not impose a universal inference-success target.

Belief content has three separable layers: the modeled proposition's truth, the patient's belief
state, and any clinical belief appraisal. A false proposition alone does not make a belief
delusional, and a report labeled delusional does not establish that the proposition is false. The
post-submit trace must be able to show `latent proposition → evidence claims → dependency handling
→ revealed response → rule evaluation`.

The narrow point-free schema foundation is implemented. It freezes Boolean propositions, separate
source assertions, opaque time-scope IDs, claim origins, shared-origin or correlation groups,
belief appraisal, and authored/deterministic resolution traces inside
`ResolvedPatientPropositionState`. It rejects probabilities, credibility scores, reveal state,
diagnosis inference, and points. It is not yet embedded in the complete resolved patient,
compatibility cases, or a runtime generator.

The adjacent point-free presentation foundation is implemented as versioned expression banks,
explicit source-to-response mappings, frozen resolved projections, and standardized item-response
records. It preserves resolved-finding, proposition, and patient-scene evidence IDs through to the
display choice. No alias or surface phrase can create a mapping, and the shared compiler that would
instantiate these records remains gated.

When ambiguity persists, the focused answer may appropriately be blank, broad, or unspecified
diagnosis plus a conservative intervention that covers the live possibilities. That is a rubric
and relationship-compilation concern, not a patient-generation validity check. Missing
uncertainty-aware coverage becomes a nonblocking diagnostic under D-172 rather than causing
evidence cleanup or patient regeneration.

### Test, action, and reveal boundary

D-170 fixes the target ownership contract. A reusable finding definition owns identity and typed
outcomes; a generated `PatientInstance` owns the resolved value; a test or named-instrument
definition owns its result schema and deterministic generation; and an
`InformationActionDefinition` owns the neutral action label, search/category metadata,
fulfillment, and repeatability. Post-submit rules separately own clinical relevance and points.

All encounter-available findings and test results are resolved and frozen before play. Encounter
state records only whether the player revealed them. A truly unknown fact, an unrevealed fact, and
a known negative fact are therefore different states. A patient-authored test result may override
the reusable generator without changing the global test or action definition. Numeric panels keep
their value, unit, reference interval, and `N`/`H`/`L` interpretation; a bounded incidental result
remains non-case-defining and point-neutral. This is the accepted architecture, not authorization
to migrate schemas or choose clinical generation weights.

## Syndrome generation and incompatibility validation

Background and cross-condition variation may produce isolated, overlapping, subthreshold, or
surface-threshold symptom sets. Raw cardinality is not a diagnosis composer. A symptom cluster may
look like it satisfies another disorder's list while timing, etiology, substance or medication
context, functional relationship, or “not better explained” logic points elsewhere or remains
uncertain.

The generator retains those findings. It does not remove, redraw, retry, or quarantine a patient
merely because an unrelated checklist count is reached, and it does not silently assign a new
internal diagnosis. A full internal condition enters `ConditionState` only because the template
requires it or a reviewed patient-family condition-selection group selects its module. The
post-submission Developer audit separately identifies required conditions, selected
comorbidities, chart diagnoses, rule-outs, and overlapping generated findings.

Diagnosis definitions may still declare narrow reviewed incompatibilities between internal
condition states. Only malformed state, a literal same-scope fact contradiction, or an explicitly
incompatible selected pair invalidates the generated candidate. Inaccessible modeled care or
missing rule/rubric coverage creates a nonblocking coverage diagnostic and ticket rather than
deleting the patient. Multiple plausible formulations, uncertain chart labels, symptom overlap,
and benefit-versus-risk tension remain valid psychiatric patient states.

### Template diagnosis and comorbidity boundary

Each patient template declares required conditions and may declare one or more condition-selection
groups. A group owns stable candidate module IDs, explicit minimum and maximum selections,
deterministic game weights, and applicable compatibility constraints. This supports instructions
such as “select one to three of these comorbidities” without treating every diagnosis as globally
mixable.

Internal condition selections, chart diagnoses, historical labels, and rule-out or uncertain
records are separate. Operational diagnostic criteria may validate that a selected condition
module generated its required state, but they do not sweep every patient for every possible
diagnosis and do not clean findings to preserve a single neat formulation. All resolved symptoms
remain available to reviewed finding-level fit and safety rules whether or not they support the
template's primary diagnosis.

### Specialty treatment-history plausibility

Decision-relevant prior history is core patient state, not optional texture. A prolonged, severe,
or specialty-level psychiatry template requires multiple structured prior efforts by default,
which may include medications, psychotherapy, prior clinical contact, OTC or supplement use,
self-directed coping, substance-related coping, or higher levels of care. There is no small global
maximum; a complex patient can own many medication trials and regimen entries. A treatment-naive
specialty patient is an explicitly authored exception with a reviewable reason.

The player-facing result summarizes long histories and allows expansion, while the frozen
`PatientInstance` retains every structured record for rule matching and audit. The frequency
assumption remains labeled Developer opinion until a suitable formal contribution is reviewed.

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
- the current executable treatment selection still uses medication-ID sets; the planned
  regimen-entry operation schema is not yet wired into encounters, so duplicate prescriptions
  cannot yet be targeted independently in gameplay.
- prior medication trials are revealed as findings rather than saved as reusable structured
  records.
- broad per-case treatment grades remain more authoritative than the planned compiled rule system.
- quarantining every opposed recommendation stance is safe for early authoring but too aggressive
  for realistic multimorbidity, where a treatment benefit for one condition and a safety problem
  from another may be the intended puzzle.

No existing save shape should be silently reinterpreted. A schema migration should preserve old
case snapshots while new templates compile to the new records.

## Encounter-owned optional-feature budget

`PatientComplexityProfile` is the current transitional schema name for a deliberately small
case/encounter-recipe boundary for optional richness. It is not owned by a diagnosis dossier.
An authored profile may spend at most six cost units across no more than three selected modules.
Each selected module has a stable ID, a kind, a cost from one through three, an impact class, and
traced contributions to the existing diagnostic, pharmacologic, workup, safety/disposition, and
information dimensions. Current patient files use the explicit `budget_only` state: they record
capacity but do not claim a calibrated complexity measurement. Historical content uses
`legacy_unmeasured`; a later calibrated compiler may use `authored_envelope`.

The budget is not total patient complexity. Required diagnoses, acute safety states, current
medications, and the focused decision may be complex even when the additional-feature budget is
zero. Conversely, optional background details do not automatically increase case difficulty or
reimbursement. `difficultyTier`, patient pool, facility eligibility, care points, and
`economy.complexityBonus` remain independent authored systems.

The current compatibility compiler only validates and carries an already-authored profile.
Nonempty module selection is rejected until a stable module catalog and payload compiler exist. It
does not choose modules, fill a budget, derive a scalar tier, or change scoring. A future deterministic
selector must keep candidate pools recipe-owned, preserve the focused question, retry or
quarantine only literal structural conflicts, and emit nonblocking diagnostics for coverage gaps.
Optional modules may enrich background, fit, or a companion safety consideration; they may not
silently replace the main decision state.

## Conflict classes for complex generation

The next compiler should distinguish:

- **structural invalidity**: impossible or malformed typed state, unresolved required identity, or
  explicitly mutually exclusive resolved facts/internal states in the same scope; quarantine;
- **coverage gap**: missing clinical relationship, unavailable modeled action, incomplete rubric,
  or no recognized response path; keep the patient, emit a nonblocking diagnostic, and create or
  update a review ticket;
- **clinical tension**: two valid conditions create competing benefits, harms, or priorities; retain
  as encounter data and let a reviewed safety rule govern while preserving both sides in the trace;
- **evidence disagreement**: sources or reviewers disagree about the rule itself; create a ticket
  and keep the disputed executable change disabled;
- **balance disagreement**: clinical direction is accepted but point magnitude is unsettled; keep
  it outside diagnosis/evidence files and route it to balance review.

Only structural invalidity automatically quarantines. A patient-specific override may later fill a
real coverage gap, but the absence of that override does not invalidate or regenerate the
underlying patient.

## Resolved decisions

The user's complex-record example resolves two boundaries: internal condition states are separate
from visible/obtainable chart diagnosis entries, and a best-next-step encounter grades a focused
decision set—often one primary decision plus required companion safety actions—rather than an
exhaustive complete plan.

Reviewed safety constraints may resolve an otherwise valid clinical tension while preserving both
rules in the trace. Only literal structural invalidity quarantines. Coverage gaps remain
nonblocking and ticketed; evidence disagreement remains disabled behind a ticket; balance
disagreement does not change clinical direction.

Future calibrated case/encounter recipes may declare target envelopes over the five-axis
complexity trace. The compiler
measures the resolved patient after composition and deterministic variation, then accepts,
deterministically retries, or quarantines it against that envelope. This is provisional and will be
calibrated with reference patients before any single displayed patient level or progression formula
is adopted.

These are accepted design constraints, not claims that the complete target compiler exists. The
current `CaseBlueprint` compatibility path can carry typed reaction history and a validated
budget-only `PatientComplexityProfile`, but it has neither the new conflict taxonomy nor
deterministic optional-module selection. It does not claim that the current budget is a measured
complexity envelope.
Before implementing that versioned compiler migration, authoring must prepare the reusable symptom
and finding definitions, condition branches, medication/intervention and test relationships,
regimen and prior-trial records, context modules, and qualitative policies it will resolve. The
migration must then add runtime composition without reinterpreting historical attempts or checking
in pre-resolved patient inventories.
