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
not infer a dose, cross-taper schedule, future response, or follow-up interval. Neither the
resolved patient nor the submitted selection stores switch, augmentation, or simplification
intent. A focused reviewed route owns that explanatory meaning after matching the concrete
entry-targeted operations and starts.

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
clues, interactions, and safety constraints. Exactly one primary decision policy owns the
dominant broad route. Reviewed secondary fit effects may arise from any exact typed fact in the
complete frozen patient, but only when they also target an available action in this focused
horizon. Availability limits which contributors may compile against the encounter;
D-242's full selected-decision snapshot separately determines what the player or database plan
actually selected. A background diagnosis's broad route does not become another objective merely
because that condition exists. Matching global safety, interaction, and treatment-prerequisite
rules always remain eligible.

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
7. Reconcile exact shared-finding candidates into one resolved value per definition, then compile
   every reviewed reveal projection in the exact encounter horizon. Weighted tendencies and
   cardinality choices must already have been resolved by their upstream reviewed generators.
8. Generate other presentation wording and noncritical observations.
9. Compile exactly one primary decision policy, then discover reviewed secondary contributors
   from complete typed patient state through exact action-relative matching. A derived reverse
   index must be equivalent to exhaustive semantic scanning.
10. Validate schema conformance, deterministic identity/reference integrity, literal fact
    consistency, and explicitly reviewed same-scope incompatibilities. Emit nonblocking coverage
    diagnostics for missing action/rubric relationships.
11. Retry from deterministic sub-seeds within a fixed limit only for structural invalidity, or
    quarantine that invalid candidate with a reproducible reason. Preserve plausible ambiguous
    state and nonblocking coverage diagnostics.
12. Save every resolved value in the `PatientInstance` and `EncounterInstance`.

The current implementation proves the condition-selection portion of step 2, the exact
condition-owned required/cardinality portion of step 7, and the attachment portion of steps 7, 9,
10, and 12 with synthetic inputs.
`weighted-template-condition-selection.v1` pins an exact template and uses explicit game-only
count/candidate weights to materialize every required condition plus bounded optional selections
without replacement. It freezes selected/unselected traces, stable draw IDs, exact condition
states/bindings, and literal approved incompatibility conflicts. It does not search for an
alternative selection, use clinical prevalence, infer a diagnosis, or generate findings.

The D-197 condition-finding lane then binds exact selected condition states to reviewed profiles
and emits exact D-193 candidates. Required outcomes always emit. A
`condition-finding-cardinality.v1` profile retains raw bounded count/member selection for simple
uncoupled finding sets. A `condition-finding-dimensions.v1` profile instead selects a reviewed
total number of dimensions under nonoverlapping core/cluster constraints and then selects one or
more manifestations per dimension. The dimension counts once while every manifestation remains a
separate candidate. The artifact retains all selected and unselected mappings, requirements,
dimensions, manifestations, reviews/provenance, stable draws, profile fingerprints, and unbound
selected conditions. An unselected mapping does not itself emit an absent finding. Condition,
texture, override, and other applicable generators first compose a sparse set of positive or
otherwise deliberately authored values. Only after that composition is complete may a finite,
versioned assessment horizon derive an ungenerated member as negative for that assessment. This
closed-horizon projection is not a D-198 baseline, does not compete with later generators, does
not imply anything outside the assessment's exact member set, and does not make an unrevealed
result known to the player. A separately authored explicit negative remains available only for a
reviewed exclusion or literal incompatibility and participates in conflict validation.
Overlapping condition contributions remain distinct and D-193 alone resolves agreement or
reports a literal conflict.
No real diagnostic criteria, background variation, soft-tendency combination, diagnosis
inference, clinical probability, or points are enabled.

The “database entry as a function” metaphor stops at this pure boundary. Findings and
measurements are declarative reusable records; diagnoses reference them; compilers execute. The
MDD family does not contain code and does not receive the encounter's location or optional-feature
budget. Those inputs are handled by the location-admission and complexity-selection passes before
the frozen patient graph is assembled.

Before a real MDD profile is added, its exact core, total dimensional cardinality, manifestation
grouping, and the roles of pessimism and suicidality still require source and psychiatrist review.
The compiler can now represent the result without accidental raw-member double-counting.

`weighted-background-finding.v1` resolves the lowest-priority independent texture lane. One exact
profile covers each target in a bounded horizon and offers only explicitly reviewed lawful
outcomes with positive integer unnormalized synthetic generation mass. The selector makes one
deterministic draw per finding, emits one D-193 `background_variation` candidate, and preserves every offered
outcome/weight plus the exact D-197 artifact, horizon, profile, review/provenance, draw, and
fingerprints. D-193 lets a hard condition value prevail without deleting this trace. The selector
does not invent normality or absence, inspect the patient for applicable tendencies, or combine
multiple soft influences.

`additive-categorical-finding-tendency.v1` combines those soft influences only after a caller has
matched them to exact typed patient inputs. For one finding, let \(b*i\) be D-198 baseline mass and
\(c*{ki}\) the nonnegative mass explicitly assigned to outcome \(i\) by contributor \(k\):

```text
pooledMass[i] = baselineMass[i] + sum(contributor[k].mass[i])
normalizedGameSelectionProbability[i] = pooledMass[i] / sum(pooledMass)
```

The outcome set is closed, exhaustive, and mutually exclusive. Every contributor supplies a
complete vector, including explicit zeros, so a three-or-more-outcome profile cannot ask the
engine to invent redistribution. Coexisting clinical states use separate findings and separate
draws. The normalized number is the probability for this synthetic game draw only; neither raw
mass nor its normalization is gameplay points, clinical prevalence, evidence strength, or
diagnostic probability. One target-stable deterministic draw emits one D-193
`weighted_tendency` candidate. D-198 remains in the candidate union for audit, while D-193 hard
lanes still prevail.

The implemented structural flow is now:

```text
D-223 pre-finding orchestration
  → one D-201 optional-module selection
  → required-only D-196 or D-202 condition source
  → complete D-205 / D-206 / D-207 typed lane audits
  → D-208 complete or not-composed pre-finding patient state
  → D-203 verified D-196-or-D-202 condition source retained inside D-208
exact template + physical location + focused action and operational-owner horizons
  → D-219 exact location-baseline operational admission
  → D-197 condition findings
  → D-198 background outcomes
  → D-210 whole-state applicability audit
  → optional D-199 weighted tendency derived only from D-210 bindings
  → D-200 exact D-208-backed candidate union and audit
  → D-193 shared-finding resolution
  → D-217-selected / D-215-compiled D-212 structured source views
  → D-194-derived D-220 exact instrument item responses
  → D-194-derived D-240 target-scoped duration/burden projections
  → D-213 complete universal action-result audit
  → D-214 result bindings and presentation-safe patient/encounter attachment
```

D-241 makes D-240 an active authoring-pipeline edge after final patient truth exists. The full
projection audit stays nested in D-213, while D-214 attaches only the referenced target-redacted
frozen reveal. Target absence is neutral when another declared source resolves; missing or
ambiguous applicable values block that action's binding and cannot be masked by another complete
definition.

D-242 then freezes the complete point-free encounter decision used by native scoring. Purchased
information-action IDs are derived from successful replayed purchases with presence semantics;
final diagnosis and treatment selections come from the submitted event history. The database plan
uses the same strict shape, and both snapshots validate against the exact frozen information,
diagnosis, medication, regimen-entry, intervention, and disposition horizons. This finally
separates an action that was mechanically available from an action that was actually selected,
without yet adding a treatment-triggered prerequisite or changing current MDD route points.

D-243 adds the missing point-free prerequisite shape. The D-191 `3.0.0` compiler freezes one
non-information trigger separately from one information-only fulfillment predicate, the exact
originating policy ID/version and focused-decision ID, and a non-null typed patient predicate. It
requires both actions in the exact horizon and exact current-policy equality; D-242 then evaluates
actual selection as not triggered, fulfilled, or omitted. The approved MDD
any-medication-start reconciliation and reaction-history rules pass the authoring adapter, but
remain unbalanced and are not attached to a runtime patient. The tag-based antidepressant/mania
rule stays disabled until a reviewed exact native medication set or class owns its trigger.

D-244 adds only the separate native balance/replay layer for those two approved prerequisites.
Medication reconciliation contributes `+35` when fulfilled and `-25` when omitted;
allergy/adverse-reaction history contributes `+30` or `-40`; neither applies without a medication
start. The broad route remains separately `+200`. Native traces preserve not-triggered,
fulfilled, and omitted rather than reducing them to matched/unmatched, and D-235 replay
recomputes the exact state from the frozen decision. This does not add a real patient template,
source-report profile, action-result recipe, runtime queue, or persistence activation. A separate
pre-runtime task must pin the exact balance-catalog payload used for historical re-derivation.
D-252, described below, completes that task without activating persistence.

D-338 closes the previously deferred native antidepressant/mania-history trigger without changing
patient generation. The diagnosis rule pins the reviewed initial-MDD medication class, and the
authoring adapter expands the complete approved membership horizon into concrete start targets.
Legacy medication tags remain compatibility-only and cannot enter the native compiled rubric.
This supplies one more auditable scoring dependency for a future generated MDD encounter; it does
not generate a patient, choose a medication, or activate the queue/runtime path.

D-339 consumes one already-resolved patient fact without changing generation. A present canonical
passive-death-wish outcome can admit the reviewed detailed-safety-assessment rule to the native
rubric; an absent or missing fact does not. The adapter does not generate, repair, reveal, or
reinterpret the finding, and it never converts the old compatibility tag into patient state.
Patient generation therefore remains the sole owner of the frozen finding, while selected
information and scoring remain downstream concerns.

D-340/D-341 give that future patient a complete first-pass detailed-safety result path without
requiring generators to emit redundant negatives. The generator may emit the positive safety
facts selected or required by the encounter. D-256-style closed-horizon projection then supplies
absent values for the remaining members of the exact nine-fact action horizon. The resolved
positive facts and derived display negatives remain distinguishable in the audit.

This does not authorize safety-fact probabilities, a suicide-event generator, a recent-time
cutoff, a means-access/weapon-access implication, protective-factor generation, source-report
error profiles, risk aggregation, disposition selection, or patient retry. Those remain separate
dependency owners and must not be smuggled into the action-result recipe.

D-342 consumes the already typed `reportedSafetyPlanningAbility` value through a separate
patient-report result path. Generation still must resolve that value and select an exact reviewed
source-report profile before play; purchasing the action only reveals the frozen result. The
first static owner does not generate the value, infer it from detailed safety findings, assert
that a written plan exists, or use it to decide risk or disposition.

D-343/D-344 likewise consume already resolved state rather than generate it. A future patient must
own exact current regimen entries and explicit reaction-history state before source-report
selection. Medication reconciliation may then report the current-entry lane, while the separate
reaction action may report exact records and assessment statuses. Neither result owner invents a
current medication, fabricates a documented-none history, interprets a reaction, or changes the
optional-complexity budget.

D-345 through D-348 complete more static routing without changing generation. Objective exposure
truth, prior treatment, current-medication effect records, and exact regimen subjects must already
exist in the resolved patient. A separately selected source profile determines which records are
reported. The result assembly never invents nonuse, treatment naivety, efficacy, an adequate
trial, causality, or the need for a medication change. D-349 now supplies the detached player-safe
record-field projection required before these IDs can become displayable values. It resolves only
source-presented IDs and strips hidden authoring and truth fields, but it does not yet attach that
minimized payload to D-214, `PatientInstance`, persistence, or UI. That integration remains a
separate dependency over the exact final-patient and source-validation chain.

D-350 now closes the detached source-validation half of that dependency. It replays D-299 and
derives every D-349 projection from the retained final patient and D-212 recipe rather than
accepting caller-authored fields. It does not yet change D-218/D-194/D-213/D-214 or generated
patient/runtime state.

D-351 proves the next transition without activating it. One exact D-350 collection and one exact
D-213 artifact for the same patient and complete structured-envelope set are replayed; D-214 is
derived mechanically; and the safe record fields are matched to those frozen reveals. The output
is still detached from `PatientInstance`, waiting slots, persistence, and runtime generation.

D-245 adds the native D-159 pass after each compiled rule has evaluated the complete frozen
decision. Same-effect specificity, exact-target hard-contraindication suppression, and
worst-only same-issue harm run identically for player and database plan. Broad selected starts and
regimen operations become concrete medication or regimen-entry action targets before overlap;
triggered-information targets retain their separate authored audit meaning. Resolved rows are
never deleted and preserve original/applied points, status, direct controller chain, explanation,
selected targets, and any prerequisite subtrace. D-235 replay reconstructs those targets and
combination results and rejects extra noncompiled rows or tampering. This activates no real
secondary clinical relationship, point magnitude, cap, settlement input, persistence, runtime,
compatibility content, browser behavior, or UI.

D-252 closes the separate balance-payload identity debt. Native scoring fingerprints the complete
validated source balance catalog, freezes only exact balances referenced by the compiled rubric,
and derives both the player and database-plan traces from that minimized snapshot. Generated
attempt replay verifies each row's component, pre-combination magnitude, and explanation against
the snapshot before combination and arithmetic. The snapshot does not copy clinical rules,
authoring rationale, or Developer-opinion records, and does not activate SaveData or runtime
queues.

D-246 checks that exact chain against source-controlled content. The current real MDD
route/policy/balances and shared catalogs stop before a generation graph: every executable
template, complete core pre-finding state, condition/background/tendency profile, projection
recipe, universal result assembly, source-report profile, and complete presentation used by the
proof remains synthetic or absent. Compatibility patients cannot fill those owners. This audit is
recorded in the existing dependency ticket/document rather than a duplicate status model. The
first clinical input required before a real template is an approved MDD episode
finding/cardinality owner and a review that its canonical finding identities are complete enough
for the focused slice.

D-247 completes the currently identified MDD identity shells and interprets the “entry as a
function” metaphor as declarative data plus a pure compiler. The remaining profile review must
separate diagnosis-level dimensions from concrete manifestations; raw finding-member cardinality
cannot silently count insomnia and hypersomnia, or self-reported and observed psychomotor change,
as independent MDD dimensions.

D-248 supplies that disorder-general dimension/manifestation selection. D-249 then supplies the
separate optional-texture bridge without changing diagnostic meaning: D-201 selects and charges
one `finding_texture` module, the bridge reuses its exact draw and maps it to reviewed
`background_variation` candidates, and D-200 substitutes those candidates for only the matching
D-198 baselines. D-197 hard diagnosis values remain higher priority. No real MDD mapping, texture
frequency, or points are authorized by either compiler.

D-200 keeps every upstream artifact and stage seed, never removes D-198 when D-199 exists, and
retains and replays the complete assembled D-193/D-194 request before returning either a verified
D-194 snapshot or a complete literal hard-conflict audit. D-209 makes D-208 its sole pre-finding
patient source: condition source, complete base state, condition bindings, D-193 patient-state ID,
and proposition state are derived rather than supplied independently. D-201's selected modules and
spent/unspent audit remain inside D-208 and are never charged again. A blocked D-208 artifact stops
before D-197/D-193/D-194 without fallback, reroll, or refund. Real contributor content,
source-report profiles, universal action/result recipe content, persistence, and runtime
generation remain separate dependencies.

`attachment_only.v6` accepts the already-resolved state plus one template-pinned
`universal-action-result-assembly.v3`. Catalog-instance compiler `9.0.0` first requires one complete
D-219
artifact for the exact template, physical location, focused action horizon, and universal action
catalog. It then derives rather than accepts source views and result bindings: D-217 selects
reviewed behavior, D-215 applies it after final patient truth, D-194 derives D-220 instrument
responses, and D-213/D-214 attach the complete result audit plus presentation-safe structured and
instrument views. The snapshot pins matching care setting, exact horizons, shared findings, the
D-219 operational artifact, source-report artifacts, the root and nested D-220 audit, nested D-240
audit, result audit, and compiled-rubric payloads. D-213 `3.0.0` and D-200 composer `27.0.0`
retain the complete chain. Finding-scoped duration and burden are staged by finding-definition
version, then D-240 resolves them after D-193 creates the target ID. Structural, stale, tampered,
or incomplete operational/result
attachments are rejected without recalculating D-201. The implementation still does not perform these steps with real
non-outpatient catalog content, generate presentation, persist a generated queue, or replace
compatibility cases.

The intended outer order is:

```text
exact location or queue slot establishes care setting
  → choose a template with that same exact setting
  → D-219 proves exact location-baseline access for every focused action
  → D-201 selects and spends optional complexity once
  → compile frozen findings, source reports, and action results
  → compile the one primary decision policy plus eligible secondary contributors
  → freeze PatientInstance and EncounterInstance
```

Care setting itself spends zero complexity and grants no capability. The matched location remains
the owner of the action, service, formulary, and disposition horizon. D-219 does not decide
clinical correctness or choose a cheapest method; it proves only that the exact mechanical option
is reachable through the minimized operational owners.

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

The implemented shared pass accepts exact candidate values after those upstream steps. Patient
overrides have explicit precedence; compatible reviewed hard constraints co-apply; a reviewed hard
value prevails over compatible lower-priority candidates; and no-opinion or unreviewed candidates
remain visible but inert. Literal disagreement among same-scope hard values produces a stable
structural conflict rather than a load-order winner. Conflicting weighted or background candidates
are rejected as an upstream aggregation gap because this pass does not invent their clinical
weights. An intentional fixed patient fact requires a versioned reason and remains visible in the
audit.

The compiled set identifies every contributing owner and constraint, each candidate's disposition,
the upstream deterministic draw when supplied, the final value, nonblocking diagnostics, compiler
version, exact projection-horizon ID, and integrity fingerprint. Agreeing values co-apply even when
their uncertainty differs; the controlling tier retains the most cautionary explicit marker
(`conflicting_sources`, then `reported_uncertain`, then `none`) while every candidate preserves its
own marker. Structural errors retain exact normalized candidate snapshots. The encounter may
present one compact blended response to the player, but the post-submission and developer views
can always disentangle why it was generated. Numerical calibration of combined soft tendencies
remains a separate upstream generation-profile and balance decision.

The first exact upstream condition pass is implemented separately:
`condition-finding-cardinality.v1` materializes reviewed fixed requirements and bounded symptom
sets, then hands D-193 exact `diagnostic_requirement` and `cardinality_requirement` candidates.
It never interprets a nonselection as an absent symptom and never chooses between two conflicting
condition contributions.

The separate background selector supplies exactly one reviewed lowest-priority candidate per
bounded target. It is intentionally not the multi-contributor soft-tendency aggregator: it does
not decide how condition, medication, context, and baseline weights should combine.

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

The shared compiler resolves each applicable reviewed projection before play and saves:

- projection ID and content version;
- source action or named instrument/item;
- response value;
- selected expression-bank and wording-variant IDs when applicable; and
- every contributing resolved-finding, proposition, and evidence-record ID.

Purchasing information reveals that frozen response; it never generates wording or changes a
source fact. Multiple contributors yield one response without duplicate workup credit. Diagnosis,
treatment, and point rules consume typed facts or explicitly reviewed response predicates, never
the displayed phrase. The audit reconstructs `source fact → projection → displayed response`.
Every projection pins its exact finding/proposition and expression-bank content versions.
Proposition-evidence bindings also name allowed source kinds and, when needed, time scopes. An
exact compile-time horizon validates action and instrument-item targets and instrument response
values without manufacturing instrument metadata. D-220 now resolves those instrument targets
through separate exact approved `instrument-item-response-only.v1` owners. The compiled set names
its horizon explicitly, and wording draws remain stable when unrelated request material changes.
Current compatibility `labelVariants` are not the reusable projection model.

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

The adjacent point-free presentation foundation and shared compiler are implemented as versioned
expression banks, exact source-to-response mappings, and frozen resolved projections. The pass
preserves resolved-finding, proposition, and patient-scene evidence IDs through to the display
choice and selects expression variants deterministically from stable IDs. No alias or surface
phrase can create a mapping. The standalone D-220 compiler now materializes standardized
item-response metadata from one exact approved owner, projection horizon, minimized information
action horizon, and universal action catalog. It contains no real instrument definition and does
not attach its artifact to the encounter pipeline yet.

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

D-276 applies the same distinction to compatibility narrative results. Binary status remains
separate from a qualified categorical value: intermittent adherence is a present resolved value
with an abnormal interpretation, not a negative result. The first Reviewer-cohort projection
derives that interpretation from the frozen regimen-entry enum and preserves it through
instantiation. A later native result path must retain exact record/source attribution rather than
reconstructing the category from its displayed words. Interpretation is for presentation and
audit only; it does not itself generate findings, truth, rules, or points.

D-277 closes that first compatibility attribution gap. Medication-reconciliation and adherence
findings name the exact current regimen entry; focused and full-treatment-history medication-trial
findings name the exact prior-trial record. Blueprint and CaseInstance validation reject dangling
references, and instantiation copies the reference unchanged. This identity link can support later
benefit, tolerability, temporal-link, and dose-change projections, but it supplies none of those
facts by itself.

D-278 supplies the first one of those independent owners. A
`CurrentMedicationReportedBenefit` attaches `none`, `partial`, `substantial`, or
assessed-but-`unknown` patient-reported benefit to one exact current regimen entry, patient-report
source instance, and time scope. It is intentionally sparse: record existence means the question
was assessed, while absence of a record means neither no benefit nor unassessed. A D-212
source-view presentation decides whether the player sees items, none reported, unassessed, or
unable to assess. D-278 emits exact same-record decision facts and rejects a future
response-linked regimen operation unless it targets the required regimen-entry subject, but it
authors no response rule or balance. The finite nonresponse Reviewer case uses the same owner to
show `Reported benefit: none` for sertraline without converting that report into treatment
adequacy, causality, or a clinical conclusion.

D-279 activates the already separate `MedicationTolerabilityFindingV2` shape in compatibility
patient/scenario state rather than inventing another adverse-effect model. Current-regimen and
prior-trial subjects must exist in the exact containing snapshot. The medication-effects
projection maps `present`, `absent`, and `unknown` to abnormal, normal, and indeterminate qualified
values, respectively, while preserving the D-277 subject. The first bounded application reports
no other adverse effects for the exact current sertraline entry in the medically unreviewed MDD
nonresponse scenario. It adds no incidence mapping, random adverse effect, causality inference,
rule, or point. A symptom beginning after a medication change remains a separate temporal-event
and relationship problem.

D-280 supplies that separate point-free relationship owner. One record names an exact current
regimen entry, one categorical change kind, separate change and target time scopes, one
source-instance claim, one exact separately owned target, and only before/after/uncertain temporal
order. Native generation may target a canonical finding or categorical observation;
compatibility migration may target an exact action/finding coordinate, but native state rejects
that compatibility-only coordinate. The first review-only restlessness case now stores both
fluoxetine and aripiprazole as distinct regimen entries and projects the relationship as
restlessness following the exact aripiprazole increase. The model contains no milligram value,
causal inference, akathisia inference, incidence probability, rule, or point.

D-281 adds the independent current-dose-position owner needed before a reviewed route can
distinguish a medication known to be below its reviewed maximum from one known to be at it.
`CurrentMedicationDosePosition` is sparse, source- and time-scoped, and tied to one exact current
regimen entry. `unknown` means assessed but unresolved; no record means neither unknown nor below
maximum. D-191 projects it into same-record exact-subject facts, and D-212 exposes it through a
closed lane. The record does not contain a dose, define a medication maximum, establish trial
adequacy, or imply that increasing, continuing, or stopping is correct.

D-282 supplies only the missing administration-level container above D-220 item responses. It can
retain one exact complete or partial administration, the exact patient/source and item partition,
and an optional authored raw total when the exact administration definition permits that numeric range.
It never calculates from response options, treats missing items as zero, interprets a total, or
attaches the record to generated patient state. Real instrument content, rights approval,
administration compilation/replay, result attachment, and clinical scoring remain later
dependencies.

D-283 closes only the standalone compilation/replay part of that list. The authoring compiler
verifies and retains the complete patient-bound D-220 artifact, derives the administration's
patient and stable identity, accepts only exact complete response evaluations, and permits a
missing item only when D-220 reports exactly `response_not_resolved`. It fingerprints and replays
the normalized request and output but does not attach the administration to D-194/D-213/D-214,
validate its source instance against patient state, or create any total formula or interpretation.

D-284 adds only a strict presentation-safe projection of that verified D-283 result. The
projection retains hidden patient/administration identity, action and version coordinates,
respondent/time/opaque-rights coordinates, complete/partial state, item counts, and the authored
raw-total state. It redacts item/source identities and the complete authoring audit, and exact
reprojection rejects caller-authored changes. It remains outside generated patient state and the
encounter result pipeline; no real instrument, score calculation, interpretation, rule, or point
is introduced.

D-285 adds the smallest authoring-only attachment admission proof. A frozen context names one
patient state, finite action horizon, and safe item-response collection. Its current `2.0.0`
compiler verifies D-293, uses its derived D-284, and rejects patient/action crossings or any
included response that differs from the exact safe D-220 projection. Raw D-283 is not admitted.
It supports complete, partial, and zero-response attempts without modifying `PatientInstance`,
D-194, D-213, D-214, encounter bindings, or runtime.

D-286 derives that complete context from one verified D-194 catalog snapshot instead of accepting
it from a caller. Its current `2.0.0` compiler requires exact D-220 equality between the snapshot
and the D-283 embedded in D-293, invokes D-285 with that same wrapper, and retains a replayable
snapshot/source-validation/admission chain. The source snapshot is not widened or mutated, so
runtime attachment remains a later explicit versioned decision.

D-287 derives D-273's patient-state identity and RNG seed from that same verified D-194 boundary.
The caller may provide only reviewed presentation content: one profile, its exact fictional-name
pools, and its exact chief-complaint banks. The adapter normalizes through D-273 and retains the
catalog/presentation relationship for deterministic replay. It neither adds presentation fields
to the generated patient nor creates a waiting patient; real content, queue attachment,
persistence, and UI remain later explicit gates.

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

`PatientComplexityProfile` is the current transitional schema name for a deliberately bounded
case/encounter-recipe boundary. It is not owned by a diagnosis dossier. Historical
`additional-feature-budget.v1` records retain their exact zero-to-six optional budget,
zero-to-three module limit, and one-to-three module costs. New generated-patient recipes may use
`baseline-plus-additional-budget.v2`, which separates a zero-to-64 required-state baseline from a
zero-to-96 optional budget and permits up to 24 selected modules with exact-template costs from one
through twelve. These ceilings bound authoring and audit payloads; they do not define clinical
thresholds.

`baselineComplexityUnits` belongs to the exact versioned `PatientTemplate`. It summarizes the
required conditions, focused complication, regimen/history premise, and other state needed to pose
the immediate question, but does not replace or copy those owners. The template version and
fingerprint are its provenance. Every selected optional module separately retains a stable
reusable definition, an exact-template binding, cost, impact class, game-variety weight, review,
and traced contributions to the diagnostic, pharmacologic, workup, safety/disposition, and
information dimensions. Downstream bridges preserve the original selection ordinal and draw while
linking the module to its typed patient-state records, allowing later rules and receipt rows to be
traced back through the complete chain.

Current compatibility patient files use the explicit `budget_only` state: they record capacity but
do not claim a calibrated complexity measurement. Historical content may use
`legacy_unmeasured`; a later calibrated compiler may use `authored_envelope`. Compatibility
CaseBlueprints remain v1 and are not silently reinterpreted as v2.

Neither the baseline nor the optional budget is total patient complexity. Required diagnoses,
acute safety states, current medications, and the focused decision may be complex even when the
additional-feature budget is zero. Conversely, optional background details do not automatically
increase case difficulty or reimbursement. Neither value, module count, module cost, nor their sum
may set `difficultyTier`, patient pool, facility eligibility, care points, reimbursement, or
`economy.complexityBonus`.

The D-201 `3.0.0` authoring-only selector treats the optional budget as one hard maximum, not a
target to exhaust, while carrying the v2 required-state baseline unchanged.
A reusable definition owns module identity and kind; the exact-template binding owns cost, impact,
five-axis contributions, synthetic game-variety weight, and review. The profile explicitly
weights every count from zero through the template maximum. Selection is without replacement and
uses exact budget and incompatibility look-ahead so the requested count remains feasible. The
artifact freezes all count/candidate decisions, draws, selected and unselected modules, total
spent, remaining capacity, and the unchanged baseline. A selected module may materialize several
records or later activate several reviewed fit/safety rules without a second complexity charge;
the full module → binding → record/fact → rule → receipt path must remain auditable.

D-201 is an independent pre-payload lane, not another step inside the D-196→D-200 finding chain.
It selects identities and accounting only. It does not materialize reaction, condition, exposure,
regimen, trial, finding, test, or scoring state, derive a scalar tier, or change the focused
question. Nonempty module selection remains rejected by compatibility/runtime until typed payload
compilers exist. The D-201 artifact alone does not materialize D-196 optional conditions; D-202
provides the explicit constrained bridge. Optional modules may enrich background, fit, or a
companion safety consideration; they may not silently replace the main decision state.

D-202 supplies that bridge without running D-196's count or candidate lottery. Every candidate
comorbidity module maps one-to-one to an exact optional group/candidate, and every bridged group
must permit zero selections. Focused conditions are rejected from optional groups; required
template constraints materialize as authored state outside the budget. The current pool is bounded
by D-201's 64-candidate authoring ceiling.
Configured D-196 weights are retained for audit but cannot change membership when their seed or
weighting changes. The bridge materializes only required plus D-201-selected condition states and
bindings, preserves D-201 selection ordinals/stable draw IDs, and rechecks explicit D-196
incompatibilities without reroll or substitution. Non-comorbidity modules remain selected
identities until their own payload compilers exist.

D-203 now gives D-197 one strict source union over either complete genuine D-196 selection or
complete genuine D-202 bridge provenance. D-197 embeds and verifies the original artifact,
generates findings only from successful resolved state, and neither redraws optional conditions
nor recalculates the budget. D-204 carries the same complete source through D-200, requires exact
source/reference equality with D-197, and uses the derived source view for D-194 attachment.
Runtime compatibility still rejects nonempty selected modules.

D-205 gives D-201-selected `allergy_reaction` modules their first typed authoring payload without
changing that budget contract. Every reaction candidate maps to one complete
`PatientReactionHistory`, and every pair is already incompatible in D-201, so zero or one complete
alternative materializes with its exact upstream ordinal and stable draw. The bridge retains the
full D-201 artifact and a narrow exact reference horizon; it performs no merge, second draw,
recalculation, or clinical interpretation. Null means no optional contribution, not unassessed
state. Composition with required/base reaction state, action reveals, real frequencies and costs,
points, persistence, and runtime activation remain explicitly deferred.

D-206 uses the same D-201 authority for `prior_treatment` modules but composes positive records
additively. Each mapped contribution is nonempty and can contain medication trials, psychotherapy
trials, current providers, and prior levels of care; compatible selected contributions concatenate
through globally unique IDs. This allows separate historical complications to spend complexity
budget while a coherent long-history module can still carry many trials. Repeated medication or
intervention identities remain distinct events. The bridge preserves exact exposure and outcome
fields plus every D-201 ordinal/draw, performs no second selection, adequacy inference, or outcome
simulation, and emits null only when there is no optional history contribution. Required/core
history attachment, tolerability/regimen composition, reveals, points, persistence, and runtime
remain deferred.

D-207 uses D-201's same selection/accounting authority for `substance_use` modules and materializes
nonempty positive-use exposure contributions. Compatible selected contributions concatenate by
globally unique record and semantic-agent identity. When two mappings describe alternative states
for the same agent, they must pin one exact version and already be explicitly incompatible in
D-201. The exact horizon covers medication, supplement, and other-substance identities. D-207
copies recency, current amount, prescription relationship, and explicit misuse truth, then adds
deterministic resolution provenance from the original D-201 stable draw. It performs no second
draw, probability/prior calculation, or cost. Null means no optional exposure contribution, not
nonuse or unassessed state. Required/core exposure, whole-inventory composition, source evidence
and reveals, intoxication/withdrawal, diagnosis, points, persistence, and runtime remain deferred.
The generic `other` module kind remains unsupported.

D-208 composes these owners once before finding compilation. One exact D-201 artifact must be
present inside the genuine D-202 condition source and every applicable D-205/D-206/D-207 bridge.
Core condition state is the exact required subset; final condition state is the complete source.
Reaction history is either core-locked or an explicit zero-selection default that a selected
D-205 complete history replaces. Prior-treatment and exposure contributions append by record ID,
while cross-core record collisions and duplicate semantic exposure agents fail rather than merge.

The module's already-authored D-201 cost is the whole complexity charge regardless of how many
records it contributes. Required/focus-defining state is never charged, unused capacity remains
valid, and selected modules never enter the attachment-only template complexity profile. A
selected unsupported `other` module remains fully charged and traced but produces no composed
state; it is not rerolled or refunded. Successful output is a deterministic, complete,
pre-D-193 `ResolvedPatientState` plus exact bindings and the complete selection audit. D-209 now
carries that whole artifact through D-200, derives all D-193/D-194 patient-context fields from it,
and replays the exact chain.

D-210 now provides whole-state tendency applicability for that chain. It verifies the complete
D-208 state plus genuine D-198 target context, evaluates every
supplied approved definition through exact typed facts and same-record joins, and retains all
matched/nonmatched evaluations and exact record bindings. Core and D-201-selected optional facts
are equally matchable after composition; D-208 still explains their origin. D-210 neither reads a
module's cost as a trigger nor changes selected count, spent budget, remaining capacity, synthetic
mass, normalized probability, or draw. D-211 attaches the verified D-210 artifact as the sole
source of D-199 applicability bindings. D-200 derives the exact referenced profile and
finding-definition subsets, calls D-199 only when bindings exist, and retains null D-199 plus the
complete D-210 audit when none match. D-201 still charges a selected complication once regardless
of how many reviewed downstream tendencies its frozen facts activate. Persistence, compatibility,
real profiles, points, and runtime generation remain separate.

D-212 adds a separate schema-only reveal layer for non-finding patient state after that state is
frozen. One source view may group several closed typed lanes, such as regimen entries or the four
treatment-history lanes, while retaining the exact source instance, time scope, claim origin,
dependency groups, included truth-record IDs, omitted truth-record IDs, and
aligned/misaligned/indeterminate audit. A patient may report no substance use while the objective
exposure inventory still contains a frozen positive-use record; purchasing history will later
reveal the report, not rewrite the truth. Explicit `none_reported`, `unassessed`, and
`unable_to_assess` states prevent an empty array from silently becoming a negative answer.

Required/core records and D-201-selected optional records are equally eligible to appear in a
source view after composition, but their origin remains auditable. D-212 has no selector, draw,
probability, complexity cost, wording, action availability, score, persistence, or runtime
attachment. Projection count and record count therefore cannot spend more complexity: D-201 alone
selects modules and owns the encounter recipe's spent and remaining budget.

D-213 now evaluates one exact recipe for every action in the complete universal action catalog.
It routes only already-frozen D-193 projections, D-212 source views, measurements, categorical
observations, and structured tests. A complete in-horizon action gets one deterministic binding
candidate; missing declared input remains incomplete coverage and cannot become an invented
normal, negative, or documented-none result. An explicit D-212 negative remains distinguishable
because it is itself a verified source view. Instrument-item targets remain visible diagnostics
outside this information-action compiler.

This compiler does not select actions for clinical relevance, expose results to play, or attach
results to play. D-214 makes D-194 the only attachment orchestrator. A reusable
`attachment_only.v2` template pins one static action-result assembly by exact version and
fingerprint, while patient-specific D-212 projection recipes stay outside the template. After the
final D-193-backed patient state exists, D-194 builds and verifies those D-212 envelopes, compiles
one D-213 artifact, requires complete coverage for every focused information action, and
mechanically derives all result selectors. A caller cannot supply a second binding list, and
incomplete coverage never falls back to an invented result.

The authoring snapshot retains the complete D-213 and D-212 audit. The patient instance freezes
only the presentation-safe D-212 view and omits hidden/omitted truth, truth relationships,
claim/dependency audit, copied patient state, and generation resolution. Exact state, source,
definition, recipe, action, and projection horizons are replayed during integrity verification.
D-200 composer `5.0.0` retains the complete chain, while a literal D-193 conflict stops before
result attachment. D-213/D-214 never read or write D-201
selection/count/cost/spent/remaining fields: one cost-1 complication may yield many downstream
facts, projections, action sources, and reveals while still spending exactly one unit. Player
purchase points are separate from generation complexity.

D-215 adds the standalone `StructuredSourceReportProfile` compiler. An already-selected profile
must resolve every declared lane exactly once as `report_all`, `none_reported`, `unassessed`, or
`unable_to_assess`; typed singleton fields either mirror truth or present one explicit lawful
value. The artifact fingerprints the exact patient state, definition, profile, and source view and
replays the transformation. It cannot choose behavior probabilities, filter individual record
IDs, mutate truth, spend complexity, or assign points. No real profile exists and D-215 is not yet
attached to D-194.

D-216 adds one exact encounter care setting: `outpatient_psychiatry`, `emergency_department`,
`inpatient_psychiatry`, or `consultation_liaison`. One template owns one setting, the exact
location declares the same setting, and the encounter freezes it. Compilation and integrity
reject any mismatch. This advances the current contract to `attachment_only.v3`,
catalog-instance compiler `3.0.0`, and D-200 composer `6.0.0`. Setting is not patient truth, a
diagnosis property, a complexity module, or a capability grant. All current runtime locations
remain outpatient, and generalized runtime generation remains disabled until each other setting
has real typed operational content.

D-217 now selects the already-reviewed source behavior that D-215 will later apply. One neutral
horizon may define several independent patient, collateral, record, or observation source slots,
including several slots for one D-212 definition. A care-setting-specific reviewed profile gives
each slot either one fixed profile or a weighted set of complete alternatives. Each weighted slot
normalizes and draws independently, so unrelated sources cannot perturb it. The selector verifies
the exact source coordinate and complete D-215 compatibility before selection. It consumes no
patient facts and performs no D-201 selection or spending.

D-257 narrows how real inaccurate self-report reaches that selector. Accurate/aligned reporting is
the fixed zero-complexity base. An inaccurate, partial, minimizing, exaggerating, or otherwise
discordant self-report pattern is an optional `source_report` module selected and charged once by
D-201. D-208 carries that selection as deferred post-truth presentation rather than mutating
patient state. A reviewed D-217 `complexity_gated` policy maps the exact module and template
binding to one complete alternative D-215 profile, reusing D-201's ordinal and stable draw with no
second selection or cost. One module may modify several exact views; two modifiers cannot control
one slot unless D-201 already makes them mutually exclusive. D-200 exact-matches the retained
D-201 artifact across D-208 and D-217. No motive, global reliability, clinical probability, or
point value is inferred.

That route governs D-215 structured non-finding lanes. D-258 now reuses the same exact D-201
artifact for symptom and other canonical-finding responses compiled through D-193. A reviewed
finding-report slot pins one accurate base projection and exact module-specific alternatives.
Every projection in the slot must share the same hidden finding predicate and target, so selection
can change only the displayed response. D-193 preserves hidden finding → exact D-201 module
binding/cost/ordinal/draw → selected projection → displayed response provenance without a second
draw or charge.

D-256 closed-assessment absence closure sees only the active projection in each governed slot.
Inactive report variants cannot create latent candidates or otherwise influence patient truth.
D-200 verifies exact D-201 artifact equality and complete `source_report` module coverage across
the D-217 structured-view and D-258 finding-projection paths. The bridge is therefore complete
mechanically, but no real inaccurate-report profile, module cost/frequency, motive, point rule, or
runtime patient has been activated.

D-259 adds the first real, runtime-excluded projection content to that existing machinery.
`registry.catalog.finding-projections` maps 17 exact patient-report findings into
`info.history.depressive-symptoms`: depressed mood, anhedonia, four appetite/weight directions,
two sleep directions, two self-reported psychomotor directions, fatigue, worthlessness, guilt,
concentration difficulty, indecision, passive death wish, and active suicidal ideation. Every
finding has explicit present and D-256 closed-absent projections. The 15 nonsafety findings also
map hidden `subthreshold` to displayed `present`; their canonical values remain subthreshold.
Focused Sleep and Suicide/self-harm actions retain deeper detail and do not create duplicate
truth or automatic duplicate points. The catalog has no real inaccurate-report variant and is not
yet bound to a PatientTemplate.

D-260 supplies the two static owners needed before that template. One exact
`FindingProjectionHorizonDefinition` pins all 49 D-259 mappings and permits only present/absent
display responses for the compact action. One `universal-action-result-assembly.v3` embeds the
current action payload and declares only `finding_projections`; D-213 therefore routes every
resolved in-horizon projection without a finding-level filter. Content validation cross-checks
projection versions, target/response availability, current action fingerprints, and complete
horizon-to-assembly coverage. The real checked-in content now compiles to one complete 17-source
D-213 binding, but no PatientTemplate or generated instance consumes it yet.

D-261 makes clinical-duration meaning historical rather than ID-relative. Every duration profile
has an exact content version; compatibility resolution, future resolved/deferred patient records,
and D-240 projection definitions retain that version. D-240 matches only an exact profile
ID/version pair, while its minimized reveal continues to omit authoring profile identity. No real
duration options or generation distribution were selected by this mechanical checkpoint.

D-262 supplies the first checked-in profile and result route, but still no duration generator. The
current-MDD profile offers 13 exact values from 2 through 52 weeks only within the already
authored episode state. A later deterministic resolver may choose one option using the recipe and
seed, then must freeze its profile/version, option ID, value/unit, condition target, source/time,
and resolution trace. D-240 can then project that record through Presenting problem and timeline
beside the existing compact symptom action in one static D-213 assembly. The profile does not
consume optional complexity, select severity or impairment, classify persistent depression,
invent treatment history, affect treatment or points, or authorize a PatientTemplate.

D-263 adds the standalone deterministic resolver for that pre-attachment step. It binds one exact
condition state to one exact profile/source/time coordinate, canonicalizes array ordering, performs
one unweighted seeded choice, and freezes all option evaluations plus the selected
`ResolvedClinicalDuration`. Its verifier replays the full stored request and rejects crossed
diagnosis/time state, stale/tampered output, or unapproved provenance. It remains detached from
D-200/D-194 and spends no optional-complexity budget. The next attachment must consume this
artifact rather than let a caller hand-author the same condition duration in base patient state.

D-264 supplies that narrow attachment. It begins only after D-208 has produced a verified composed
state, then replays every D-263 input and requires each to target the exact composed patient and an
unchanged included condition. It canonicalizes artifact order, rejects duplicate or preexisting
condition/profile owners, and appends the exact duration records without selecting again. No
durations is a state-preserving identity path; any attachment produces a new deterministic
patient-state identity and a complete replay artifact. This step neither spends nor refunds the
D-201 budget and does not yet enter D-200/D-194.

D-266 connects that artifact to the frozen finding pipeline. D-200 `23.0.0` accepts either the
unchanged D-208 state or one fully verified D-264 result, never a parallel caller-authored
duration. A D-264 result must retain the exact D-208 composition under D-223 and every D-263 draw
must share the D-233 patient-generation seed. D-200 passes the selected state through the existing
D-193/D-194 request, retains the entire proof, and replays it during integrity validation. D-240
therefore receives a genuine condition duration after final state exists, with no second draw,
complexity spend, probability, points, or runtime activation.

D-295 advances that path to D-200 `24.0.0` and removes raw D-264 from its current input contract.
The nullable seam now accepts only D-294. Null preserves the unchanged D-208-only path; a non-null
wrapper must replay its independent D-291 source horizon and every D-264/D-263 input before D-200
derives the duration-bearing state. D-200 retains the full source-validation wrapper in its audit,
so source-instance existence and kind cannot be bypassed by supplying an otherwise valid duration
attachment. D-194 and D-240 still receive only the verified final state and do not acquire source
credibility, duration interpretation, or another draw.

D-265 supplies the demographic identity foundation needed before a realistic generator can freeze
race/ethnicity. The engine eventually chooses only from the exact versioned, self-identified OMB
category horizon and saves the complete multiselect response in `ResolvedPatientDemographicsV3`;
it must never derive that response from a fictional name. The checked-in foundation intentionally
contains no selection distribution. Later epidemiologic evidence can modify positive relative
mass only for optional selection among otherwise eligible candidates; it cannot override a
case-required diagnosis or make an allowed patient impossible. Uncommon demographic/diagnosis
combinations remain generatable by design.

Race/ethnicity is base demographic context and does not spend the optional-complexity budget.
Any inaccurate or incomplete report about it would require an explicit source-report complexity
owner rather than changing hidden identity. Any symptom-report or pharmacology association must
be separately reviewed and population-matched; no current compiler, rule, balance, or point trace
uses the newly indexable category facts.

D-267 establishes the neutral generator-side owner for condition-attributed functional impairment
without yet putting it into a generated patient. One exact reviewed profile may offer a finite
subset of `none`, `mild`, `moderate`, and `severe` for one diagnosis. Given one exact condition
state, source, time scope, patient identity, and internal seed, the standalone resolver makes one
canonicalized unweighted draw and freezes the full selection/replay artifact. This variation
mechanic does not claim a population distribution.

Functional impairment remains distinct from symptom selection, symptom intensity, subjective
burden, and a patient's coarse report of functional impact. It spends no D-201 optional-complexity
budget and does not derive an MDD severity label. No real profile, patient-state/result projection,
PatientTemplate, or runtime generator path exists yet; those require the pending clinical review.

D-289 supplies only an exact-state binding proof. It verifies one complete D-208 composition,
replays every supplied D-267 artifact, requires exact patient/condition equality, normalizes
unique condition/profile assignments, and freezes the resolved impairment collection. It does
not change the D-208 patient state or spend complexity again. No real profile is activated, and
the collection is not yet routed into `ResolvedPatientState`, information results, D-200/D-194,
persistence, or runtime.

D-290 can minimize that exact collection for a later reveal boundary without changing its
authority. The projection retains only patient-state identity plus resolved impairment ID, level,
source kind, and time scope. It is deterministically rederived from D-289 and cannot expose the
condition/diagnosis target, profile/option identity, source instance, or synthetic draw. This is
still authoring-only: no action chooses it, no player wording displays it, and no generated
patient, encounter, severity derivation, rule, or point consumes it.

D-291 adds a separate exact-patient source-instance horizon. Static versioned definitions declare
only whether an instance is patient report, collateral, record review, observation, instrument,
measurement, laboratory, or diagnostic-study output. Compilation deterministically derives the
opaque instance identities and freezes full replay audit. A generic check can then reject a
missing, cross-patient, or kind-crossed reference without assigning reliability or truth. The
compiler does not inspect downstream records to manufacture its own evidence, and the empty
horizon means only that no source roles were supplied. No real definition, source behavior,
action binding, probability, complexity, rule, point, persistence, or runtime path is activated.

D-292 proves the functional-impairment source path without activating it. One same-patient D-291
horizon must contain every source instance referenced by the replay-valid D-289 impairment
records, and each source kind must match. The adapter carries the strict D-290 projection forward
only after those checks and freezes complete replay audit. It changes no D-208 state, spends no
complexity, and adds no information action, wording, severity mapping, source reliability,
generation frequency, rule, point, persistence, or runtime behavior.

D-293 performs the analogous source proof for one D-283 instrument administration. The respondent
source instance must exist in the exact-patient D-291 horizon and its source kind must equal the
administration's patient, collateral, or clinician respondent kind. Only then is the exact D-284
safe summary derived. Partial administrations remain partial and cannot acquire a manufactured
total. No catalog-snapshot attachment, instrument rights, reliability, score interpretation,
clinical rule, complexity, point, persistence, or runtime behavior is added.

D-296 closes the corresponding admission bypass. D-285 and D-286 `2.0.0` accept only D-293 and
derive the underlying administration/projection from it; raw D-283 fails schema admission. This
preserves the existing frozen-context and exact-D-220 checks while carrying the independent
respondent-source proof into both replay artifacts. It does not attach an instrument result to
runtime or interpret its source or score.

D-294 validates the source of each duration newly attached by D-264. The D-291 horizon binds to the
base patient state used by the exact D-263 resolutions; the D-264 composed state can have a new
identity and is retained separately by ID and fingerprint rather than being substituted as source
scope. Empty attachment/horizon pairs remain valid. The adapter performs no new draw, projection,
threshold interpretation, source-behavior inference, complexity spend, clinical rule, point,
persistence, or runtime behavior.

D-295 is the explicit downstream integration decision anticipated by D-294. It does not broaden
D-294: the wrapper remains the source-validation owner, D-264 remains the attachment owner, and
D-200 only verifies and carries both before invoking the existing finding and result pipeline.

D-268 approves how those future inputs combine for MDD but still does not generate them. Once one
exact symptom-severity owner and one exact D-267 condition-attributed impairment record exist for
the same episode, the MDD dossier may use the higher qualitative level as internal current-episode
severity. Until exact boundary profiles and downstream patient/result attachment are reviewed, all three MDD
level branches remain disabled and no patient may acquire a generated level from this policy.

Internal severity does not spend optional complexity and does not change the player diagnosis
identity. Mild, moderate, and severe presentations all submit as MDD. Psychotic features is a
separate named specifier and may reframe a future encounter, so it must be explicitly required or
selected by the encounter recipe outside optional texture; severity alone cannot create it.

D-269 proves only the already-approved same-episode combination. A strict symptom-severity input
envelope identifies its future upstream owner and payload fingerprint without pretending to
derive a level from symptoms. The pure authoring compiler requires that envelope and one
replay-valid D-267 impairment artifact to share the exact patient, condition, diagnosis version,
clinical state, and time scope, then emits their higher qualitative level. D-297 advances the
compiler to `2.0.0` and also requires one independently replay-valid same-patient D-291 source
horizon. The impairment's opaque source instance must exist with its exact recorded kind, and the
artifact freezes that horizon reference and binding beside the existing inputs. It has no draw and
freezes the complete request, policy projection, child identities, fingerprints, and replay.

The output is explicitly `derived_descriptor_only`: it contains no `severityId` and is not added
to `ResolvedPatientState`, `ConditionState`, D-200, persistence, or runtime. This closes only the
combination and structural source-reference algorithm. D-292 remains the separate post-D-208
collection proof. A reviewed symptom-severity owner, exact real impairment profile, attachments
for both inputs, and an enabled diagnosis-level mapping remain necessary before an MDD patient can
acquire a generated severity.

D-298 separately verifies the source references carried by D-240 target-scoped projections.
D-315 advances D-240 and D-298 to `2.0.0`, adding condition-attributed functional impairment
beside duration and burden. It independently replays one D-240 artifact and one same-patient D-291
horizon, reconstructs each complete action/record/frozen-value binding, and validates source
existence and exact kind before copying D-240's already-target-redacted reveals. The functional-
impairment safe value contains only its opaque value ID, level, source kind, and time scope; the
exact target/profile/option/source-instance chain remains in authoring audit. An empty source
horizon is acceptable only when D-240 produced no value. The wrapper remains detached from
D-194/D-213/D-214 and runtime; it does not regenerate a value, spend complexity, infer source
behavior, choose a real action, or add wording.

D-299 applies the same structural validation to D-215 whole-lane source reports. It replays one
D-215 artifact and one same-patient D-291 horizon, derives every exact
profile/definition/projection/source binding, and validates source existence and kind before
retaining the detached D-212 recipes. It does not reselect behavior, reroll a report, spend
complexity, or attach anything to D-194/D-213/D-214 or runtime.

D-300 makes those source roles reusable across generated patients without weakening patient
scope. D-291 `2.0.0` derives the opaque instance ID from the exact source-definition
ID/version/kind; the horizon and instance still retain the exact patient-state ID. A checked-in
profile can therefore name a stable source role, while D-299 and every other consumer still reject
a horizon belonging to another patient. Distinct same-kind roles require distinct definitions and
remain separately auditable.

D-301 audits the complete D-208 composed state before any later attachment is considered. It
validates every current opaque source reference against a D-291 horizon compiled for that exact
composed-state ID. D-304 gives measurement, categorical-observation, and structured-test records
an explicit typed source and advances D-301 to `2.0.0`, so every current source-bearing lane must
match the independently compiled source kind. This standalone artifact performs no draw, retry,
complexity charge, source-reliability inference, result projection, patient attachment, or runtime
activation.

D-302 audits the D-193 projection layer independently. After D-193 has resolved hidden findings
and any D-258 patient-report projection choice, the validator replays that exact request/output and
checks each selected report source against the same-patient D-291 horizon. It retains the original
slot, selected projection, source/time/claim/dependency coordinates, any already-spent D-201
complexity trace, and the source definition. It neither spends complexity again nor validates the
truthfulness or clinical interpretation of the report, and it remains outside the generated
patient/runtime attachment path.

D-303 provides the reusable technical definitions that a later patient-generation orchestration
may pass to D-291. The initial catalog covers every closed source kind and includes separate roles
where a complex encounter may need more than one collateral or record source. Compiling the same
role catalog for two patients intentionally produces the same role IDs inside two different
patient-owned horizons; validation still rejects a crossed horizon. Loading the catalog does not
select, reveal, purchase, trust, or correlate a source and spends no complexity. D-305 supplies
the narrow authoring-only handoff: one exact catalog and patient-state ID deterministically
produce a nested D-291 horizon with both catalog and horizon fingerprints retained.

D-306 supplies one point-free numeric test materialization step after that source horizon exists.
For a test whose own file declares a `numeric_panel` generator, the compiler chooses the
highest-priority matching profile from typed age/sex-for-reference/diagnosis/tag context, applies
only the profile's authored deterministic ranges and incidental-abnormal probability, and freezes
the resulting numeric components with their units, UCUM codes, reference interval, interpretation,
source role, time scope, stable draw, and exact replay audit. A test's file remains the reusable
range/profile owner; the generated artifact is the patient-specific output. This seam does not
spend D-201 complexity, make the test available or indicated, bind an information action, or
attach the output to D-208/D-200/D-194. Patient-owned and focused case-defining test results remain
separate recipe state.

D-307 provides the point-free authoring contract for that separate recipe state. A versioned
patient-owned result profile owns one exact kind-specific payload and review/provenance envelope.
The compiler binds it to one patient, time, test definition, and D-305 source role and validates
the complete `StructuredTestResultEnvelope`; it never chooses the profile or derives its clinical
values. This allows a later template to say “this encounter owns this exact abnormal or
case-defining result” without placing that result in React or a generic test generator. The
current structural proof uses only synthetic fixtures and remains detached from D-208/D-200/D-194
and runtime.

D-308 provides the same point-free authored-value path for physical measurements. A versioned
profile may own an exact weight, height, BMI, vital-sign, or other existing measurement value and
its allowed context, but it cannot interpret that value. The compiler derives units from the
definition, binds the value to one patient, time, and D-305 direct-measurement role, validates the
ordinary measurement contract, and freezes replay with `not_interpreted`. All nine current
measurement definitions pass synthetic-only contract fixtures. A later recipe still must choose
the real profile or generation owner and explicitly attach it; no range, distribution,
height/weight/BMI relationship, body-habitus inference, clinical tag, complexity cost, or point is
introduced here.

D-316 provides the separate deterministic height/weight-to-BMI relationship. A checked-in
runtime-excluded derivation definition pins exact metric measurement versions, and the
authoring-only compiler operates only on explicitly selected replay-valid D-310 height and weight
records. It retains both complete inputs and emits an uninterpreted detached value. It does not
choose a most-recent measurement, consume complexity, or invent a patient-scene source/time owner.
Patient-state attachment, action-result routing, ranges, abnormality, body habitus, clinical tags,
and scoring remain later independent owners.

D-317 materializes that detached value into the common `ResolvedMeasurement` shape while keeping
derived provenance distinct from patient-scene evidence. The record names the exact D-316
artifact and both ordered inputs, uses the selected weight record's time scope, and remains
`not_interpreted`. D-301 and D-310 intentionally do not absorb it.

D-318 provides the narrow attachment decision. D-311 `2.0.0` may place replay-valid D-317 BMI
beside the direct height and weight records only when D-317's nested D-316 request retains the
same exact D-310 collection being attached. It replays the complete derivation chain, prevents
duplicate records and recursive collection membership, and freezes explicit D-317 references.
D-312 then carries the already verified lane without a second patient snapshot. This does not
choose measurements, generate values, interpret BMI, classify body habitus, spend complexity,
select an action result, or activate persistence/runtime behavior.

D-319 proves the next generic compiler boundary without adding another model. Once D-318 BMI is
present in the final state, D-213 discovers it through the exact measurement definition's action
relationship and D-214 freezes the same measurement ID in the encounter result binding. The
complete height/weight/derivation chain remains traceable in patient state. The proof uses only
synthetic action content and does not authorize a real profile, range, interpretation, runtime
generator, or UI.

D-334 replaces only the synthetic action-definition portion of that proof with exact checked-in
content. The existing weight/BMI action now has a runtime-excluded universal-result assembly that
routes canonical height, weight, and derived BMI records through the unchanged measurement source.
It does not create those records. A future template still must select or author real height and
weight profiles, invoke the existing deterministic BMI path, and separately own any body-habitus
observation. All three numeric results remain uninterpreted until a reviewed range/interpretation
owner is added.

D-335 supplies the source-independent compiler for the first of those future options. A reviewed
generated-measurement profile can express context-specific weighted support bands without
embedding executable code. The compiler selects one matching profile by explicit priority,
resolves band and value through independent stable substreams, and freezes the complete audit
before play. No profile is currently checked in, so the compiler cannot yet create a real height
or weight. Real distributions must come from reviewed content and still require D-320 recipe
ownership before joining a generated patient.

D-336 adds only the intermediate D-310 collection step. A generated measurement can now join
authored tests, authored measurements, generated numeric tests, and categorical observations
under one exact patient/source horizon while retaining a distinct generated member kind and full
D-335 provenance. The old D-320 measurement member still requires a D-308 value profile, so this
checkpoint cannot yet materialize a generated measurement from a template recipe.

D-337 adds a separate generated-measurement recipe path instead of relaxing that authored
contract. The recipe freezes the full exact D-335 profile horizon; D-324 proves those resources
exist; and D-326 supplies D-335 only the frozen D-325 seed, patient context, source horizon, and
time scope. Generated height and weight can therefore feed the existing D-316/D-317 BMI route
while every direct record remains visibly generated. This is still structural authoring support:
without reviewed real profiles, it cannot create production height, weight, or vital-sign values.

D-320 introduces the exact template-owned clinical-result recipe needed before those result
artifacts can become a genuine generated-patient dependency. A recipe fingerprints the complete
`PatientTemplate`, references only typed direct profiles and derived-measurement relationships,
and must account for every supplied D-310 compilation and D-317 materialization exactly once.
The compiler freezes which template member produced which resolved record while leaving the
actual value generation in the existing result owners. D-320 remains detached from D-311, so it
does not yet replace the raw collection/materialization attachment input or activate a template
in runtime generation.

D-321 closes only that remaining raw-input seam. D-311 `3.0.0` requires the replay-valid D-320
artifact, verifies that its exact template is the same template already governing D-208, and
derives all attachment inputs from the frozen recipe compilation. This is still an authoring
chain: it does not select a real recipe, construct values, spend complexity, expose a player
action, persist a generated patient, or activate generalized patient generation.

D-322 provides deterministic exact-template recipe discovery before that compilation chain. It
indexes the finite replay-valid mode-template horizon, admits at most one recipe for each exact
template, and keeps missing recipes explicit. The resolver cannot choose by label, lifecycle,
diagnosis, location, or file order; it requires exact template ID, version, and fingerprint. This
coverage horizon is authoring-only and does not itself select a patient slot, compile values,
establish runtime eligibility, spend complexity, or authorize a real recipe.

D-323 then requires D-320 `2.0.0` to use that resolver. The compilation request no longer admits a
raw recipe; it retains the complete D-322 horizon and exact template, fails on missing coverage,
and freezes the horizon reference before binding the already compiled result artifacts. D-311
continues to cross-check that exact template against D-208. This still does not create values,
select a runtime patient, persist a slot, or authorize generalized generation.

D-324 makes the next readiness question explicit before any real values are compiled: does every
recipe member have its exact finite resource owner? The authoring-only coverage compiler walks the
D-322 template horizon and checks tests, intervals, authored result profiles, measurements,
observations, BMI derivations, and source roles. It preserves `recipe_missing` and
`missing_resources` as separate template diagnostics. It does not generate values, adjudicate
whether a found owner is clinically correct, spend the encounter's optional-complexity budget,
drop a plausible template, or activate patient generation.

D-325 then derives the per-patient context needed by those existing compilers. D-233 supplies the
only patient-generation seed and selected template; D-208 supplies the only composed patient
demographics, active conditions, and clinical tags; D-324 supplies the only recipe/resource and
source-catalog horizon. Exact template and seed lineage must agree. Missing coverage returns a
typed authoring failure while leaving D-208 intact, so it cannot become a hidden patient reroll.
This boundary still generates no test, measurement, observation, or BMI value and spends none of
the optional-complexity budget.

D-326 consumes only that frozen context and performs the missing deterministic orchestration. For
each exact recipe member it calls the existing typed result compiler, then D-310; for each
declared BMI output it calls D-316/D-317; and it closes the detached chain with D-320. Thus value
selection remains governed by the reviewed profile/generator already named by the recipe, not by
new orchestration heuristics. A presence-complete but semantically crossed resource fails its
native compiler, and the composed D-208 patient is not rerolled or changed. D-326 remains
authoring-only and does not yet attach D-311, populate a slot, or authorize generalized runtime
generation.

D-327 then performs only that D-311 attachment. The request names D-326 and nothing else; the
compiler obtains the exact D-208 base patient and D-320 result recipe from the frozen chain and
lets D-311 replace only the three empty result lanes. The base D-208 state remains unchanged and
the attached state stays authoring-only. D-327 neither assembles other post-composition branches
nor fills a patient slot.

D-328 composes that result branch with any independently present D-294 condition-duration and
D-292 functional-impairment branches. It derives the D-208 root and D-311 attachment from D-327
and lets D-312 enforce exact root equality and construct the single combined post-composition
state. It does not generate any of those branches, spend optional complexity again, or create a
parallel result-only patient representation.

D-329 then makes D-328 the only result-enabled entrance to D-200 `27.0.0`. D-200 independently
replays the wrapper, requires its nested D-233 seed authority and D-208 composition to equal the
current generation root, derives D-312 from it, and retains both authorities. A direct D-312
assembly remains legal only for result-free duration/impairment compatibility paths. Thus the
generator can no longer substitute a previously assembled clinical-result state without proving
which template recipe, resources, patient context, and deterministic draws produced it.

D-330 supplies the first single-call authoring orchestration over that complete result path. It
starts with the already composed but result-free D-200 request scaffold and exact D-324 coverage,
derives D-325 through D-328 without accepting replacement intermediate state, and compiles D-200
only after the generated result branch exists. Existing result-free duration and impairment
branches are carried into D-328 unchanged. The output is a replay-valid final catalog snapshot,
not a runtime slot fill: no patient is queued, persisted, exposed to Player mode, charged another
complexity cost, or given a clinical score.

D-331 lets the already-authorized empty-slot attempt call that orchestration without accepting a
caller-assembled patient. With no D-324 input, the preserved direct path must remain
clinical-result-free. With D-324 input, the fill validates the artifact, derives D-330 from its
own D-233 seed authority and D-200 scaffold, and uses the final audit for the waiting-slot and
occupancy identities. Incomplete but structurally valid result coverage blocks that one ordinal
exactly like another deterministic patient-compilation blocker; it does not trigger an internal
retry or discard another slot.

D-309 supplies the parallel point-free path for categorical MSE and physical-exam observations.
An authored profile may own one allowed value ID and compact display value, but it cannot own a
clinical interpretation. The compiler binds that exact profile to one patient, time, and D-305
clinician-observation role, validates the ordinary observation contract, emits no interpretation
IDs, and freezes replay. Synthetic fixtures prove both observation domains while the real catalog
remains empty. A later sourced content decision still must create definitions and real value
profiles or generation owners and explicitly attach them; no diagnostic inference, complexity
cost, rule, or point is introduced here.

D-310 then gathers any already compiled numeric tests, patient-owned tests, measurements, and
categorical observations into one exact patient/source-horizon collection. Every upstream
compiler is replayed, every source horizon must match in full, records are ordered
deterministically, and duplicate record IDs are rejected rather than hidden. This gives a future
core-state compiler one traceable input instead of four caller-authored arrays, while retaining
multiple lawful values that share a definition but differ by exact time, context, or authored
profile. D-310 itself still does not attach the collection to D-208, patient state, results shown
to the player, persistence, or runtime.

D-311 performs the narrowly separated patient-state attachment. One replay-valid D-208 composition
must be complete and must still have empty measurement, categorical-observation, and
structured-test lanes; one replay-valid D-310 collection must target that exact base-state ID. The
compiler creates a new state ID and fingerprint, copies only the D-310 arrays into those lanes,
and retains both complete inputs. It rejects preexisting result-lane content instead of merging or
silently deduplicating it. The changed state remains a detached authoring artifact: no template
chooses its profiles yet, no action reveals it, and no runtime, persistence, clinical
interpretation, complexity, or point behavior follows from attachment.

D-312 resolves post-composition branch collisions without creating a generic state merge. Its
current `2.0.0` contract lets one successful, empty-lane D-208 root contribute a replay-valid
D-294 duration branch, D-292 source-validated functional-impairment branch, D-311 result branch,
or any nonempty combination. The assembler verifies that every branch retains the same exact root
and copies only its owned lanes into a new deterministic state. This keeps independently generated
duration, impairment, tests, and measurements available together without letting one attachment
overwrite another.

D-313 advances the authoring-only D-200 composer to `25.0.0` and replaces its direct nullable
D-294 input with the exact nullable D-312 assembly. Null still routes the unchanged D-208 state.
When present, D-200 replays D-312, checks the common D-208/D-223 root, includes nested duration
draws in the existing D-233 seed audit, and passes the assembled duration/result state into
unchanged D-194. The D-311 measurement proof confirms that the clinical-result branch survives
alongside D-294 duration through the frozen patient instance. D-210 still evaluates the original
D-208 whole-state applicability input, and D-193 still owns canonical finding compilation. No
profile selection, impairment attachment, runtime activation, persistence, clinical meaning, or
points are added.

D-314 adds functional impairment to the complete patient snapshot rather than leaving D-289 as a
detached side record. `ResolvedPatientState.functionalImpairments` accepts only exact
condition/diagnosis/time/profile-version records, D-312 accepts only replay-valid D-292 as its
impairment owner, and D-200 `26.0.0` checks every nested D-267 draw against the same D-233 seed
before D-194 freezes the patient instance. D-301 `3.0.0` also audits the new lane's opaque source
references. The minimized D-290 view still has no information-action recipe, and no real profile,
selection probability, interpretation, severity mapping, complexity, scoring, persistence,
runtime, or UI is activated.

D-218 now applies that exact selection only after D-193 freezes patient truth. Catalog compiler
`4.0.0` resolves the selected profiles, runs D-215 against every template-pinned D-212 definition,
passes only those generated envelopes through D-213/D-214, and retains both full authoring
artifacts for replay. No caller may inject a patient-specific reveal recipe. An empty definition
horizon uses an explicit null selection/report path. The same structural chain compiles in all
four care settings without granting capabilities or spending optional complexity; real setting
content and generalized runtime generation remain deferred.

D-219 now proves the separate mechanical admission boundary before that clinical/finding pipeline
can attach. One exact request pins the template, physical location, care setting, focused action
horizon, universal action catalog, and operational-only service, formulary, medication-identity,
and treatment projections. Information actions and service-backed treatments require one eligible
method at the exact location; start medications require an exact owner and exact base-formulary
membership; dispositions require exact location allowlisting; and current-regimen operations stay
patient-state-owned. A staff-only method is pending rather than silently borrowed.

The same resource-explicit algorithm is tested in outpatient psychiatry, ED, inpatient psychiatry,
and consultation-liaison. Missing access yields complete itemized coverage diagnostics and blocks
attachment without rerolling the patient or touching D-201. `attachment_only.v4`, catalog compiler
`5.0.0`, and D-200 `8.0.0` retain and replay the exact artifact. No cost, points, clinical
winnability, cheapest-method selection, real non-outpatient location, persistence, generated
queue, or UI was added.

D-270 consumes that exact D-219 treatment topology only at generated-attempt settlement. It freezes
the full intervention/disposition owners and the normalized service-price owners, then derives one
least-cost equal-quality charge for each selected option that explicitly names a fulfillment
service. Service-free options and medication/regimen actions receive no invented price. This
changes no patient fact, treatment eligibility, clinical rule, care point, generation draw,
complexity budget, or source provenance.

D-271 consumes the waiting patient's exact template fingerprint and the exact D-227 clinic
projection only at generated-attempt settlement. It freezes a separate provisional economy policy
for that template, the current ClinicState, and the versioned satisfaction curve. Bank-before and
raw satisfaction come from clinic state; the multiplier is rederived and must agree; base
reimbursement and challenge bonus come only from the explicit economy policy. Diagnosis,
severity, care setting, and D-201 complexity cannot synthesize any of those values. No real
template economy policy or runtime behavior is enabled by the structural owner.

D-272 separately closes player diagnosis-qualifier validation after a generated patient is
frozen. The exact diagnosis horizon is joined to every and only its exact
`DiagnosisDefinition` owners, then projected into a minimized replay set containing family versus
severity selection mode and reviewed selectable qualifier identities. It does not feed patient
generation or change hidden `ConditionState`. MDD's internal mild/moderate/severe descriptor
therefore never becomes a player qualifier; the named psychotic-features specifier remains a
separate reviewed identity. Missing, stale, crossed, internal-only, unreviewed, or mutually
exclusive qualifiers fail before submission is accepted.

D-273 separately resolves launcher presentation without changing patient truth. It independently
draws a fictional first name, fictional last name, optional middle initial, eligible short
chief-complaint bank, and stable complaint variant from exact versioned inputs. The same request
and seed replay byte-equivalently, catalog order cannot change the result, and changing complaint
content does not reroll the name. Names receive no demographic or clinical inputs. Complaint
specificity is an explicit content-override hierarchy; equal-priority banks can deliberately mix
general and condition-specific wording. The output is not yet part of D-200 or a waiting slot, so
this checkpoint generates no player and changes no queue behavior.

D-332 supplies the first checked-in content for that resolver. Its runtime-excluded catalog has
three reusable short complaint banks, 48 variants, and one MDD presentation profile that reuses
the existing independent first/last-name pools and the literal one-quarter middle-initial policy.
All three banks have the same specificity and game weight, so nonspecific, mood/interest, and
energy/sleep/function complaints mix without becoming a diagnostic distribution. The banks
remain medically unreviewed and the profile is approved only as Developer-owned cosmetic product
behavior. The catalog does not spend complexity, influence clinical generation, attach itself to
D-194/D-200/D-233, populate a waiting slot, persist, activate runtime, or render UI.

D-333 connects those already-resolved parts without widening the generator. It accepts one
successful integrity-verified D-331 fill and exact D-332 content, derives D-287 from the final
D-194 snapshot retained by that fill, and freezes a detached slot/patient-bound minimized
presentation. It cannot operate on a blocked fill and accepts no independent patient identity,
seed, catalog snapshot, or prebuilt D-287 artifact. Deterministic replay verifies the entire
D-331-to-D-287 relationship. The frozen waiting-slot object itself remains unchanged, so D-333
does not create queue persistence, automatic refill, runtime launcher behavior, UI, complexity,
clinical rules, points, or formulary behavior.

D-220 adds the standalone authoring-only item-response compiler after D-193. An
`instrument-item-response-only.v1` definition owns one rights-boundary ID and each item's exact
response scale/options, information action, respondent source, and time scope. The compiler accepts
only a minimized `InstrumentInformationActionHorizon`, not the complete decision-action horizon.
For every exact instrument target it requires one approved owner, one D-193 `response_option`, an
exact complete option set, null display channel, no expression bank, and an owning action whose
neutral report source agrees with the item. Items sharing a response-scale ID must share its option
set.

The artifact emits one response or an explicit incomplete evaluation per target and retains all
contributors, rights/scale/action/source/time metadata, diagnostics, fingerprints, normalized
inputs, and replay. A horizon with no instrument items yields a complete empty artifact. D-220
copies reviewed source/time metadata from the item definition; it does not infer modality from
canonical finding IDs. It adds no wording, score, total, threshold, interpretation, probability,
points, action cost, or D-201 complexity operation.

D-221 makes D-194 own that D-220 compilation after final D-193 truth. The static
`universal-action-result-assembly.v2` supplies the exact neutral instrument definitions, and D-194
derives the minimized horizon rather than accepting it from a caller. D-213 `2.0.0` requires the
same complete D-220 artifact and routes each response only to its owning action. D-214 validates
the exact response/evaluation and freezes a presentation-safe patient record that omits
contributor, proposition/evidence, projection, interpretation, diagnostic, request, and
fingerprint audit fields.

The full D-220 artifact remains both at the snapshot root and nested inside D-213; exact equality,
integrity replay, and patient/binding checks reject crossed or tampered copies. An empty instrument
horizon produces an attached complete empty artifact and no frozen patient response. Current
contracts are `attachment_only.v5`, catalog compiler/D-194 `6.0.0`, and D-200 `9.0.0`. This path
works identically in outpatient psychiatry, emergency department, inpatient psychiatry, and
consultation-liaison, but setting names grant no resources and D-219 still owns exact-location
admission. No D-201 complexity is selected or spent.

No real instrument text, total, cutoff, interpretation, point value, persistence, runtime
generation, or UI was added.

D-222 establishes the standalone selected-location operational-resource input required before
D-219 can eventually stop receiving manually prepared resource projections. One clinic-wide
`clinic-location-resource-assignment-horizon.v1` covers every built clinic location exactly once.
Its nested `selected-location-operational-resource-assignment.v1` records bind exact
version-and-fingerprint-pinned upgrade/formulary references to exact location versions; upgrade
owners declare `exclusive_location` or `shared_locations`. Compiler `1.0.0` accepts that complete
horizon with the exact clinic, facility, selected location, minimized upgrade owners, and formulary
owners.

It first proves that clinic, facility, tier, complete built-location assignment, selected location,
and optional department describe one context. It then applies only assigned upgrades whose exact
version/kind/fingerprint matches the current owner and that pass clinic ownership, separate
equipment ownership where applicable, facility allowlisting, tier eligibility, exclusive/shared
placement, and required department. Staff assignments must match staff owners and exactly one
clinic configuration inside the owner's automatic-information-action horizon and maximum;
duplicate configurations/actions and cross-staff action overlap block the affected grants.
Additional formularies must be owned, match exact current owners, and exactly equal grants from
valid upgrades assigned to that location.

The artifact retains baseline versus effective capability IDs, valid assigned upgrade references,
effective formulary references, staff contexts, itemized diagnostics, exact input/owner
fingerprints, and deterministic replay. Verification receives the complete current assignment and
owner horizons, preventing stale or fabricated grants. An upgrade, capability, formulary, or staff
member that is merely clinic-global or assigned to another location cannot appear. The algorithm
is identical in outpatient psychiatry, emergency department, inpatient psychiatry, and
consultation-liaison; a care-setting label adds no resource.

D-224 attaches this artifact without weakening it. D-219 `2.0.0` accepts one complete exact D-222
artifact rather than caller-prepared operational projections, and independently verifies exact
effective-formulary membership. D-194 `7.0.0` and D-200 `10.0.0` retain that historical chain
while requiring a validation-only current resource context before activation. Current context is
recompiled from the current clinic, facility, exact location, assignments, owners, and formulary
membership; it is never copied into the patient or encounter.

D-223 supplies one authoring-only owner for the complete pre-finding state pass. Its request pins
the exact D-201 selection request, condition-source plan, pre-finding core state, explicit
reaction-history ownership, and the typed D-205/D-206/D-207 inputs required by the whole candidate
horizon. Compiler `1.0.0` runs D-201 once; no downstream bridge may select, spend, reroll, refund,
or reconstruct optional complexity.

The candidate pool mechanically determines the condition branch. A pool without any comorbidity
candidate uses required-only D-196. A pool containing a comorbidity candidate uses D-202 even when
that candidate is unselected, so the optional horizon and zero selection remain visible. The same
principle applies to reaction, prior-treatment, and exposure lanes: a present lane always retains
its complete D-205, D-206, or D-207 artifact, including a null materialization. Null is no optional
contribution, not documented none, treatment-naive, or nonuse. Reaction history additionally
requires explicit `core_locked` versus `optional_alternative_default` ownership.

Only genuine child artifacts reach D-208. Success freezes the composed state; a literal D-202
conflict or selected unsupported `other` freezes an audited `not_composed` result with every
D-201 draw, ordinal, cost, `totalSpent`, and `remainingBudget` unchanged. There is no fallback to a
less complex patient. The root artifact owns deterministic D-202/D-208 request IDs, normalized
input, nested audits, exact fingerprints, replay, and external context verification. Crossed
same-ID template, seed, profile, typed-horizon, core, ownership, and complexity-envelope inputs are
rejected.

The same algorithm applies to outpatient psychiatry, emergency department, inpatient psychiatry,
and consultation-liaison. Care setting remains part of exact template identity but neither changes
the optional-selection algorithm nor grants an action, resource, or clinical behavior. D-225
advances D-200 to `11.0.0`: D-223 is now the single root for the pre-finding pass, and D-200 derives
the genuine nested D-208 artifact rather than accepting a second caller-supplied composition root.
A `not_composed` D-223 result preserves the selected complications and their spend in the typed
blocker. It adds no real module/patient content, probability, clinical rule, point, or second
complexity authority.

## Current-context template and location admission

D-231 first materializes one explicit mode/lifecycle template horizon. Normal/standard and
Endgame accept only lifecycle-approved templates. Local Developer accepts that same approved lane
plus a separately supplied lifecycle-review lane. Wrong-lane, blueprint, draft, deprecated, and
duplicate-stable-ID inputs are rejected. Medical-review status remains an independent audit field:
lifecycle-approved prototype content may still be medically unreviewed. D-231 does not inspect
setting, location, pool, diagnosis, dependency coverage, queue history, weights, points, or
complexity.

D-274 adds a deliberately transitional local Developer Patient Maker over the existing finite
compatibility-case graph. Its allowlist is computed only from approved/review `CaseBlueprint`s
that pass the complete content validator and own a measured complexity profile. The reviewer
chooses one exact authored budget and one matching case; the control filters rather than edits the
budget. Generation delegates to ordinary `instantiateCase`, endgame/Developer eligibility, and
the persisted Developer queue. It does not call D-201, materialize optional modules, or claim to
exercise the database-generated `PatientTemplate` chain.

The future generalized maker remains a thin authoring client over D-226/D-201/D-200. After one
real source-controlled vertical can compile, it may let the reviewer choose an exact
template/recipe, admitted setting/location, and adjustable bounded complexity envelope, then
request one deterministic seed and show retained diagnostics. It must not fabricate a patient
file, bypass admission, manually edit hidden truth, activate unreviewed clinical mappings, or
create a second generator. The two maker paths must remain explicitly distinguishable until the
compatibility path can be retired.

D-226 `3.0.0` removes its raw template input and derives every matrix row from the verified D-231
artifact. It adds one authoring-only admission matrix before patient selection and before any D-201
complexity selection. It compiles D-222 once for every currently built location, then evaluates
every template against every built location through the exact D-219 operational compiler. The
matrix therefore covers outpatient psychiatry, emergency department, inpatient psychiatry, and
consultation-liaison without treating a setting label as a resource.

A cell is admitted only when the template contains the exact current versioned location
reference, its care setting equals the location's setting, its action horizon and universal result
assembly resolve exactly, D-222 is complete, and D-219 finds complete mechanical access for every
focused option. A same-ID stale location reference is visible and never upgraded automatically.
An unbuilt compatible location is neutral, and a built location the template did not declare is a
normal `not_declared_compatible` cell. Missing resources or coverage produce retained diagnostics;
they do not delete or reroll a plausible patient and do not claim clinical “winnability.”

The matrix performs no random draw, selects no queue slot, runs no primary policy, and spends no
complexity. The later selector may draw only from admitted cells, then run D-223 once for the
selected template/location pair. Real ED, inpatient, and consultation-liaison generation still
requires real locations, exact resource assignments, setting-appropriate action horizons and
assemblies, a persisted assignment lifecycle, and an explicit queue/persistence checkpoint.

D-227 narrows mutable clinic input before this matrix. The strict
`clinic-operational-context.v1` projection retains only clinic/facility identity and tier, built
locations and departments, upgrade/equipment/formulary ownership, and staff automation
configuration. Labels, active location, facility-wide capabilities, points, Endgame/debug state,
and satisfaction do not affect operational admission and cannot appear in D-222 or D-226 requests.

This means a payout, ambience change, or navigation change does not stale the complete admission
chain. A real resource or ownership change does. Endgame must explicitly materialize the same
location/resource owners as ordinary play; its debug flag cannot bypass admission. D-222 `3.0.0`,
D-219 `3.0.0`, D-194 `8.0.0`, D-200 `18.0.0`, and D-226 `3.0.0` carry this minimized context
without changing patient/encounter projections or optional-complexity accounting.

D-228 closes the remaining caller-owned seam between admission and patient composition. A caller
names one already-admitted D-226 evaluation; compiler `1.0.0` revalidates the complete matrix
against the current operational request, requires a diagnostic-free cell with complete D-219
coverage, and emits a compact immutable binding to that exact template, location, patient pool,
care setting, D-222 resource artifact, and D-219 operational proof. The full matrix is not copied
into every downstream snapshot.

D-229 now owns the exact physical-location slot coordinate above D-228. Given current D-226
context, it enumerates every and only admitted cell at that location, rejects an empty local
horizon or a selected cell from another location without global fallback, and nests D-228 for the
caller-selected local member. Its output preserves the location fingerprint/setting, complete
sorted local candidate horizon, selected evaluation, compact matrix reference, and nested
operational proof.

D-230 closes D-229's caller-choice seam. A versioned distribution profile pins the exact location
and exact template versions/fingerprints, assigns positive relative question-bank mass, and
configures positive active-waiting and recent-completion basis-point multipliers. It normalizes
only the current exact-location horizon and performs one deterministic 64-bit slot-local draw.
Active and recent suppression match only the stable template ID, apply at most once each, remain
positive, and retain match counts plus the frozen newest-first local history window. They never
match narrative, diagnosis, patient pool, seed, or lexical similarity.

D-228, D-229, and D-230 are `2.0.0` after the nested D-231/D-226 proof change. D-233 now verifies
current D-226, D-230 distribution, D-232 capacity, exact occupancy, and mode-local completion
context before deriving a template-selection seed. It then derives the one patient-generation
seed from the exact D-230-selected template. D-200 `18.0.0` requires that D-233 authority and the
one D-223 orchestration root. It derives the historical D-230, D-232, template, location, and D-219
artifact through D-233, requires the exact complete D-228 template to equal D-223's template, and
still recompiles the selected location from an independent current operational context before
activating the historical snapshot.

D-232 authorizes the physical coordinate without changing the draw. One separate versioned
capacity profile declares an exact location's base slots and explicit upgrade contributions. The
capacity compiler sees only relevant exact upgrade ownership/assignment and produces stable
base/upgrade coordinates. A compact certificate proves D-230 used one authorized coordinate;
adding another predeclared capacity contribution does not change an existing coordinate or
certificate. Capacity has no clinical, distribution, scoring, economy, or D-201 authority.

D-232 also proves facility moves without performing runtime queue mutation. A successor profile
maps occupied source locations to exact same-setting targets. The compiler preserves the frozen
patient, seed, resolved values, selected template, historical D-230/D-232 proof, and source
provenance, then attaches a free target capacity coordinate and fresh current D-226/D-228 proof.
It commits every migration or none: missing mapping, insufficient capacity, or missing exact target
admission remains an itemized blocker. It never invokes generation, D-201, or D-230.

D-233 closes the seed and one-attempt fill boundary without activating the runtime queue:

1. Verify one private generation root whose mode exactly matches D-231, occupancy, and local recent
   completion context.
2. Compile a compact occupancy snapshot covering every and only current D-232 coordinate. Full
   frozen patients are rehydration inputs; occupied outputs retain compact exact references.
3. Select the first empty coordinate in canonical capacity order and read its next fill ordinal.
4. Derive the template-selection seed from the root authority, mode, exact
   location/version/fingerprint, exact coordinate, and ordinal. Do not hash request IDs,
   occupancy snapshot IDs/fingerprints, unrelated coordinates, weights, points, prose, or file
   order.
5. Run D-230 once with that seed and its frozen location-local repeat snapshot.
6. Derive the patient-generation seed from the same stable coordinates plus the exact selected
   template ID/version/fingerprint.
7. Require that seed for D-223 optional-feature and condition selection, D-197, D-198, optional
   D-199, D-193/D-194, optional D-217 and its nested request, and final `PatientInstance.seed`.
8. Replay D-200 once. Success proposes one complete frozen waiting patient and changes only the
   target row to occupied. A D-200 error or literal same-scope conflict leaves it empty, records the
   exact blocker, and advances the ordinal. There is no internal reroll.
9. Fill another empty coordinate only as a separate attempt. Its repeat context now includes the
   earlier occupied patient; that earlier patient and seed remain byte-stable.

Native occupied assignments must remain on the exact mode and coordinate that produced them.
Facility relocation requires the separate D-232 migration proof and is not achieved by relabeling
an occupancy entry. A later checkpoint must define the completed-to-empty transition, completion
history update, explicit Developer refresh, persistence commit, and SaveData/runtime migration.

D-234 now supplies the authoring-only portion of that later checkpoint. Completion retains the
exact frozen waiting patient plus a strict attempt/waiting-slot/patient/terminal-event bridge
around one losslessly JSON-safe canonical opaque payload pending a native generated-attempt
schema. It vacates only that coordinate and prepends a bounded, duplicate-preserving entry to its
mode/location completion history bound to the exact current occupancy, with unique retained
patient, attempt, completion-event, and proof identities plus nested integrity replay. Standard
automatic refill is
still later runtime orchestration. Explicit selected-location refresh in Endgame or Developer
creates skipped-patient audit only. Developer completion records the exact template
ID/version/fingerprint; replacement excludes completed versions globally and active waiting exact
versions at that location, rejects same-version fingerprint mutation, and recomputes the horizon
after each fill. Exhaustion is an auditable empty no-op even after earlier successes, and
same-template rerandomization pins the previous exact template at the canonical first vacancy
after removal.

D-230 `3.0.0` applies the mode-specific exact eligibility overlay before positive weights. D-234
reconciliation pins one caller-supplied generation root across active and retained-history
patients, one current admission matrix containing the exact location/fingerprint, and one
distribution profile while executing ordinary D-233 fill attempts in canonical empty-coordinate
order. It
stops at a retained blocker unless a later caller extends the exact transcript with an explicit
authorization naming that blocker; the next attempt starts at the blocker-advanced ordinal with
new seeds. Current versions are D-233 occupancy `1.0.0`, seed
authority `2.0.0`, atomic fill `3.0.0`, D-200 `27.0.0`, facility migration `3.0.0`, and D-234
transition/reconciliation `2.0.0`.

D-230 chooses the template but does not construct a patient; D-233 owns only the deterministic
patient seed and atomic authoring proposal. Neither spends complexity, persists/refills a runtime
slot, assigns points or clinical probabilities, or grants resources from a setting or mode label.
D-231 owns only static lifecycle membership; D-234 owns the authoring-only exact-version Developer
run history, while its queue/persistence activation remains later work.
Normal generation starts with outpatient locations; other contexts require concrete progressive
unlocks. Endgame and Developer may expose broader explicit template horizons but every result
remains exact-location/setting-bound. Runtime activation of per-location capacity and the
compatibility `patientSlotCount` save migration remain later work. D-232 completes the authoring capacity and
atomic migration proof only; SaveData v5, the compatibility queue, persistence, runtime refill,
and UI are unchanged.

## Presentation-richness expectation

`PresentationRichnessEnvelope` is a separate template-owned authoring contract, not another
complexity score. It requires one or more explicit decision-driver categories and records prior
effort as `not_required`, `multiple_expected` with a minimum of at least two and no maximum, or a
reasoned `treatment_naive_exception`. This allows a prolonged or severe psychiatric presentation
to expect extensive prior attempts without imposing a small history cap, while preserving a
reviewable exception for a genuinely treatment-naive focused encounter.

The pure evaluator observes only the complete frozen `ResolvedPatientState`. It reports exact
record IDs/counts across internal conditions, chart diagnoses, regimen entries, exposures,
medication trials, psychotherapy trials, providers, prior levels of care, reactions, and canonical
findings. Medication trials, psychotherapy trials, and providers contribute one prior-effort unit;
a prior level of care contributes its recorded occurrence count. The result is fingerprinted
against the exact template version, envelope, and patient-state fingerprint and is attached once
to the atomic catalog-instance snapshot.

This is a diagnostic authoring view. An unmet expectation or a treatment-naive exception paired
with prior efforts is retained as `nonblocking`; neither condition removes facts, infers a
diagnosis, changes the primary policy, rerolls or rejects the patient, assigns points, or alters
runtime eligibility. Future generation profiles may use reviewed population data to create the
underlying records, but this evaluator does not generate them.

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

The primary policy is not an exhaustive allowlist of secondary modifiers. Any reviewed fit,
response, tolerability, prior-trial, reaction, regulatory, discontinuation, parsimony,
interaction, contraindication, prerequisite, or disposition relationship may be discovered from
the complete frozen state when its exact typed patient dependency and exact action target match.
Predicates retain explicit same-record binding when several values must belong to one repeated
record; missing or unassessed state does not become a negative match. The compiled rule freezes
its logical patient/action predicates and exact fact-to-record trace. The deterministic reverse
index is an implementation optimization only, is re-fingerprinted before use, and must equal a
semantic scan. Broad routes from background diagnoses remain inactive, labels and free tags carry
no matching authority, and missing relationships emit nonblocking coverage diagnostics rather
than guessed scoring.

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

Condition-owned symptom generation now has one general dimension form. A reviewed profile chooses
the total number of diagnosis-level dimensions, satisfies explicit nonoverlapping core/cluster
requirements, and then chooses one or more atomic manifestations for each selected dimension.
Several manifestations may therefore describe one dimension without inflating the threshold
count. All draws and selected/unselected alternatives remain frozen and replayable. The model is
point-free and does not infer a diagnosis from symptoms.

Subthreshold texture belongs to the encounter's optional-richness envelope. It may eventually
spend a small authored D-201 cost, but it must materialize through its own typed background-finding
bridge. It cannot change the diagnosis definition, spend the core profile's cardinality, or hide a
required finding.
Before implementing that versioned compiler migration, authoring must prepare the reusable symptom
and finding definitions, condition branches, medication/intervention and test relationships,
regimen and prior-trial records, context modules, and qualitative policies it will resolve. The
migration must then add runtime composition without reinterpreting historical attempts or checking
in pre-resolved patient inventories.

## Mania/hypomania history result dependency

D-352 supplies the static result owner needed when a later generated patient exposes
`info.history.mania`. Generation must resolve current and past episodic symptom findings
independently; the action merely packages their frozen projections. Missing positive candidates
can derive explicit absent rows inside this closed assessment, while a subthreshold resolved value
remains hidden-but-auditable beneath a visible present status. The result owner does not generate
those states, infer an episode or bipolar diagnosis, or decide whether the action was clinically
required.

D-353 supplies the corresponding static result owner for `info.history.psychosis`. A later
generator may independently resolve any of the six report findings, including subthreshold
texture, while the purchased action only reveals their frozen projections. It must not infer
psychosis, a diagnosis, proposition truth, or treatment from the grouping.

D-354 completes the current static presenting-problem result foundation without adding generation.
A later patient must resolve broad current self-reported functional impact and current-MDD
duration independently before play. Purchasing the presenting-problem action may reveal both, but
neither result derives condition-attributed impairment or severity. A real impairment profile and
its selected qualitative level remain separate unresolved generation dependencies.

D-355 supplies the neutral body-habitus definition and result route, not a generation profile.
A future recipe must resolve one allowed categorical value through the existing patient-owned
observation contract (or a separately versioned generated-observation compiler) and retain its
source and selection provenance. It must not derive the value from BMI, weight, diagnosis, or free
text unless a later reviewed relationship explicitly owns that behavior.

D-356 now supplies that separately versioned generated-observation compiler contract. It can
select one allowed categorical value reproducibly from a complete reviewed profile horizon, but
only synthetic profiles prove the contract. A real body-habitus profile still needs source and
psychiatrist review, and later D-310/D-320 orchestration must preserve generated ownership rather
than relabel the output as an authored D-309 observation.

D-357 now carries replay-valid D-356 output through the detached D-310 collection with a distinct
generated member kind. It does not authorize D-311 patient-state attachment or D-320 template
binding. The next structural seam must give a template one complete exact generation-profile
horizon; it may not infer that ownership from the selected option or from a D-310 member alone.

D-358 closes that structural seam. A generated categorical-observation recipe pins the exact
definition, complete D-356 profile horizon, source, and time scope. D-324 keeps missing profiles as
authoring diagnostics, while D-326 uses only D-325's frozen seed and typed patient context to
materialize and bind the observation. The pathway is proved with synthetic content; no real
body-habitus distribution, BMI relationship, clinical interpretation, complexity cost, or point
effect is implied.

D-359 proves the existing D-327-through-D-330 chain preserves that result without a second draw.
The attached and final patient observations equal the D-356 resolved observation exactly, while
the collection and recipe retain their generated member and binding kinds. This is still
synthetic contract proof, not activation of a real observation distribution.

D-360 exercises the first reviewed checked-in MDD value profile through that same complete
patient chain. One D-233 seed selects a declared current-episode duration through D-263; D-294
validates its source, D-328 composes it, and D-200/D-240/D-330 freeze and reveal the same value.
No separate MDD generator or second duration draw exists, and replay reproduces the exact
artifact.

D-361 exercises the reviewed MDD symptom-dimension profile in the complete chain. D-197 emits
only five through nine selected positive manifestations and preserves the core requirement.
D-256 then closes only the exact checked-in 17-item depressive-history assessment, deriving
absent responses for ungenerated report items without authoring negative patient candidates.
Selected observed psychomotor manifestations remain separate MSE facts; unselected MSE
alternatives are not closed by the history action. The final patient and action result retain
these distinctions and replay from the same D-233 seed.

D-362 resolves those reviewed findings and the reviewed current-episode duration for the same
patient from the same D-233 seed while retaining independent selection draws, catalog references,
and source-validation artifacts. The combined patient truth survives D-328/D-200/D-330 and
replays identically. Presenting-problem packaging remains deferred: its broad functional-impact
member has no reviewed generation owner, so the compiler neither invents that value nor derives an
absent response from missing input.

D-363 adds the reviewed mania/hypomania-history assessment to that same compilation. The generator
still produces only the MDD profile's positive manifestations; after those settle, D-256 closes
the exact sixteen-item current/past mania-history horizon. The resulting absent rows and the
`info.history.mania` binding replay with the patient, but they do not generate an episode, infer a
diagnosis, or decide whether an antidepressant is safe.

D-364 adds the reviewed six-item psychosis-history assessment through the same closure boundary.
With no positive psychosis candidate active, its current patient-report rows resolve absent and
the exact `info.history.psychosis` result binding replays. The generator does not infer proposition
truth, an MSE finding, psychosis, or a diagnosis from that result.

D-365 adds the reviewed nine-item detailed safety assessment. The fixed integration seed selects
one MDD death/suicidality manifestation; that exact canonical value flows into the detailed result,
while D-256 closes the remaining eight rows. No second safety draw occurs. The resulting evidence
does not calculate risk, safety-planning ability, or disposition.

D-366 feeds that frozen truth into the checked-in MDD decision compiler. The exact passive-death-
wish record activates the reviewed information requirement, which points to the already available
detailed safety action. The compiler retains the real MDD primary route and complete fact binding
without generating a treatment, evaluating a player choice, or applying points.

D-367 adds the reviewed antidepressant-triggered mania-history prerequisite to the same compiled
encounter. Its patient scope comes from the MDD route, its trigger remains five exact reviewed
medication starts, and its fulfillment target remains the already attached `info.history.mania`
assessment. The encounter horizon makes the rule discoverable because bupropion and the history
action are available; generation does not claim either was selected or purchased.

D-368 leaves that generated patient unchanged and moves downstream into completed-attempt
evaluation. Information-purchase events and the final treatment snapshot, not generation, decide
whether each compiled prerequisite is fulfilled, omitted, or not triggered. The database plan is
another exact decision evaluated against the same frozen patient/rubric, not an alternative
patient generation.

D-369 reuses the generated patient's existing 17-row depressive-symptom result. Generation still
owns only the positive manifestations plus assessment-local closure; the later attempt scorer
checks only whether `info.history.depressive-symptoms` was purchased. It never recounts symptoms
to infer diagnosis or invents an absent functional-impact result.

D-370 still does not let generation choose treatment. It only carries the checked-in primary route
and exact admitted medication horizon into the frozen encounter. D-235 later determines whether
the player's final transition matches that route; an unmatched route remains zero because that is
the balance owner's explicit behavior.

D-371 likewise does not make economy part of patient generation. Standard-mode settlement consumes
the already frozen patient, successful action events, selected decision, score, and exact service
quotes. It cannot alter generated facts, reroll the patient, or debit the pre-encounter bank for an
expensive or unsafe encounter.

D-372 audits the remaining MDD information rules against that exact generated patient. Duration
alone cannot complete a presenting-problem result without its separately owned functional-impact
fact; an empty regimen or exposure collection cannot establish what the patient reports; and
explicitly unassessed reaction state cannot become documented none. These gaps leave the patient
valid while preventing the affected action and rule from entering the encounter.

D-373 activates only the accurate-source-view half of that boundary. After all patient truth is
frozen, fixed checked-in profiles expose current medication regimen, longitudinal reaction
history, and longitudinal substance-use history through the existing structured-report chain.
They spend zero optional-complexity units and never reroll truth. Empty medication and positive-use
collections become aligned `none_reported` source views; an unassessed reaction history stays
unassessed and indeterminate. The generated MDD proof therefore gains those three exact
action/result owners while the separate presenting-problem functional-impact value remains the
only D-372 coverage gap. Partial or inaccurate reporting still requires a D-201-selected
`source_report` module and a separately reviewed profile.

D-374 keeps diagnosis submission downstream from generation. The checked-in MDD patient now
receives one exact MDD family option in its frozen diagnosis-selection horizon, but the resolved
MDD condition does not auto-submit that answer. D-272 compiles the exact definition into a
minimized qualifier owner, so the native attempt accepts blank or family-level MDD, rejects
backend severity labels, and can expose only the separately reviewed psychotic-features
specifier. No diagnosis points exist yet. The same attempt proof requires fixed D-373 report
selection to omit its absent optional-complexity field rather than retain `undefined`, preserving
lossless JSON replay.

D-375 proves those source-owned results can participate in the ordinary encounter loop. Three
successful purchase events reference the already frozen medication, reaction, and substance
result bindings; native service pricing derives each operating cost; D-242 derives the purchased
action identities; and D-235 freezes and replays them beside the optional family-level diagnosis.
Generation does not change truth in response to a purchase, and no new point rule is inferred.

D-376 then proves that exact attempt can cross the existing historical authoring persistence
envelope. The completion timestamp is added only outside the deterministic attempt and receives
its own record fingerprint; a JSON round trip preserves every nested generation and replay owner.
This does not activate browser saves or make wall-clock time an engine input.

D-377 binds the same replay-valid attempt back to the exact frozen waiting patient through the
existing completion-proof owner. The proof retains both identities and payload fingerprints plus
the terminal completion event and template fingerprint. It does not itself vacate, refill, or
persist a queue.

D-378 then proves the exact patient can complete the already-reviewed location-slot transition.
The transition vacates only its occupied coordinate and adds one newest-first completion-history
entry containing the full D-375 attempt; it does not mutate or summarize the patient. The empty
coordinate is only an authorization boundary for a later refill. The next patient must be newly
compiled from the post-transition authority and next ordinal rather than copied from the retained
history record.

D-379 advances the D-267 resolver to explicit weighted categorical selection when, and only when,
an approved impairment profile supplies complete positive integer mass for all offered levels.
The same deterministic patient/profile draw selects one cumulative interval and freezes every
normalized option probability for replay. The policy also pins the source kind, time scope, and
allowed care settings; a crossed setting/source/time request fails before a draw. Profiles without
that policy keep the original neutral uniform synthetic mode. No real MDD profile or
source-derived mass is activated, and mutually incompatible survey or care-setting distributions
may not be averaged by the engine.

D-380 closes the last D-372 action-result owner gap through the lower-priority background-finding
path. The reviewed profile selects one broad current self-report finding with the existing stable
D-233 patient seed, and D-193/D-200 freeze it beside the independently generated MDD dimension and
duration state. D-240/D-213 then assemble the broad impact reveal with duration for Presenting
problem and timeline. The patient still has no D-267 condition-attributed impairment record, and
the compiler does not use the broad finding to derive severity, complexity, treatment, or points.

Medication identity breadth in D-382 is generation-neutral. A new identity can become a candidate
regimen member only after a separate reviewed medication definition, class/formulation
relationships, setting/formulary admission, source-controlled generation owner, reveal support,
and decision-policy coverage exist. The 112 identity-only records must therefore never increase a
generated patient's medication horizon merely because the names are now known.
