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

`condition-finding-cardinality.v1` then binds exact selected condition states to reviewed profiles
and emits exact D-193 candidates. Required outcomes always emit; bounded groups use separate
game-only count/member weights and sample without replacement. The artifact retains all selected
and unselected mappings, exact reviews and provenance, stable draws, profile fingerprints, and
unbound selected conditions. An unselected mapping is unknown, not absent. Overlapping condition
contributions remain distinct and D-193 alone resolves agreement or reports a literal conflict.
No real diagnostic criteria, background variation, soft-tendency combination, diagnosis
inference, clinical probability, or points are enabled.

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

D-246 checks that exact chain against source-controlled content. The current real MDD
route/policy/balances and shared catalogs stop before a generation graph: every executable
template, complete core pre-finding state, condition/background/tendency profile, projection
recipe, universal result assembly, source-report profile, and complete presentation used by the
proof remains synthetic or absent. Compatibility patients cannot fill those owners. This audit is
recorded in the existing dependency ticket/document rather than a duplicate status model. The
first clinical input required before a real template is an approved MDD episode
finding/cardinality owner and a review that its canonical finding identities are complete enough
for the focused slice.

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
audit, result audit, and compiled-rubric payloads. D-213 `3.0.0` and D-200 composer `20.0.0`
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

The D-201 authoring-only selector treats that budget as one hard maximum, not a target to exhaust.
A reusable definition owns module identity and kind; the exact-template binding owns cost, impact,
five-axis contributions, synthetic game-variety weight, and review. The profile explicitly
weights every count from zero through the template maximum. Selection is without replacement and
uses exact budget and incompatibility look-ahead so the requested count remains feasible. The
artifact freezes all count/candidate decisions, draws, selected and unselected modules, total
spent, and remaining capacity.

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
authority `2.0.0`, atomic fill `2.0.0`, D-200 `20.0.0`, facility migration `3.0.0`, and D-234
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
Before implementing that versioned compiler migration, authoring must prepare the reusable symptom
and finding definitions, condition branches, medication/intervention and test relationships,
regimen and prior-trial records, context modules, and qualitative policies it will resolve. The
migration must then add runtime composition without reinterpreting historical attempts or checking
in pre-resolved patient inventories.
