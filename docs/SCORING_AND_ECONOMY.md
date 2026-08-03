# Points, scoring, and settlement

## One visible unit

PsychSim uses points everywhere. The player spends points on investigations, earns points for clinical decisions, receives a base reimbursement in points, banks the nonnegative result, and unlocks later progression through lifetime points. Reputation, XP, credits, letter ranks, and a separate 0–100 clinical scale are retired.

The receipt still separates point sources so the calculation is legible:

- `carePointsEarned`: signed points from workup, treatment, safety, nonmedication care, disposition, and efficiency.
- `baseReimbursement`: the encounter's fixed point allowance.
- `informationExpenses`: the points spent revealing information and tests.
- `treatmentExpenses`: the points spent delivering selected nonmedication or disposition services.
- `operatingExpenses`: the sum of information and treatment-service expenses.
- `netClinicPointsEarned`: the nonnegative payout added to both the spendable balance and lifetime progression in Normal mode.

All are the same unit. “Care points” names a subtotal; it is not a second currency.

## Database-plan comparison

Each patient declares an executable database plan and one or more accepted alternatives. These are
finite comparison policies, not claims of exhaustive optimality or medical approval. The receipt
reports:

- database-plan care points;
- the player's care points and signed difference from the database plan;
- database-plan workup cost;
- selected-path workup cost;
- actual workup cost and variance.

The two path costs are authored sendout baselines for a compatible starter clinic. Actual cost is resolved from the clinic at encounter time. If owned equipment fulfills a service more cheaply, the receipt separately shows `externalCostAvoided` for that item and the total upgrade savings. A below-baseline variance therefore remains auditable rather than looking like a missing expense.

The UI never calls this an “optimal plan.” A player may exceed the database-plan subtotal when a reviewed catalog fit modifier makes another reasonable choice fit the generated patient better. Care points are not clamped to 0–100 and may be negative after unsafe care.

Every post-submit receipt renders a comparison bar and parallel plan cards. Ordinarily the
database-plan care points define the full bar and the player's care points define its fill. If the
player exceeds that target, the scale expands to the player score and a labeled marker preserves
the database score inside the filled bar. Negative care totals retain their signed label and use
zero visual fill. This is the only primary score graphic; a second circular score or written
“points versus plan” headline would duplicate the same comparison, especially on a phone. The
parallel cards preserve the exact investigations, fulfillment/costs, treatments, and disposition
selected by the player beside the completed declared `database_plan` replay.

Every rule trace snapshots its own provenance with the attempt. Collapsed rows identify formal
references, mixed formal-source/Developer-opinion provenance, Expert opinion, or unavailable
legacy provenance. Expanded rows show the saved citation/link and concise statement of what the
source contributed. The receipt does not resolve a historical rule against the current evidence
catalog, and a citation does not imply that the source endorsed the exact game-balance point value.

The replay uses the completed attempt's exact patient, clinic, location, and available fulfillment
methods. Deterministic ordering is payout first, then care points, then lower workup expense, then
stable ID. This is not a global optimizer and must not be labeled “best possible”: unlisted
combinations have not been searched. Developer mode additionally shows every declared policy
result and any invalid replay failure.

## Workup objectives

Each objective has a stable ID, importance, JSON-safe satisfaction predicate, points when obtained, omission penalty, and explanations. `any` represents explicit alternatives. An appropriate negative result receives full points because ordering the information—not whether it is positive—is evaluated.

Necessary or treatment-required investigation points must exceed the cheapest available point cost at every compatible location. Validation rejects a case that violates this rule. Optional or unnecessary actions may cost points without earning care points. Unsupported expensive workups therefore reduce the payout even when the care subtotal changes little.

The starter MDD database plan uses seven focused histories costing 145 points total. The
episode/timeline, depressive-symptom, suicide-safety, and substance-contribution objectives award
35, 50, 50, and 30 points. Medication reconciliation establishes the previously unknown current
list; its 35-point treatment-conditional award exceeds its 30-point cost. The mania screen is a
treatment prerequisite: its 45-point conditional award exceeds its 25-point cost. Allergy and
adverse-reaction history is a separate any-medication prerequisite whose 30-point award exceeds
its 10-point cost. Omitting a necessary item creates a `critical_omission` trace shown in red.

Treatment prerequisites retain their activation predicate, qualitative concern, qualitative
certainty, point mapping, and safety consequence as separate fields. For example, the current
mania-history rule has major concern and strong certainty, while its +45/−70 values remain
provisional balance. Starting no medication activates neither medication reconciliation nor
reaction history; starting a non-antidepressant activates those two but not the antidepressant
mania rule. Staff automation may fulfill an activated investigation but never changes what the
rule means.

### Default provisional authoring bands

Rule promotion is two-stage under D-173. A psychiatrist first approves the atomic qualitative
trigger, scope, direction, concern, certainty, exceptions, rationale, and provenance with no
points attached. Tooling may then assign an explicit `provisional_balance` value from the bands
below for Developer/Reviewer play without a second clinical review. Point retuning does not reopen
the qualitative judgment; changing its meaning does. A missing rule remains a coverage ticket and
never becomes an implicit zero-value or negative rule.

New rule proposals use the following starting bands when no more specific reviewed balance exists:

| Role                                     |                 Default provisional range |
| ---------------------------------------- | ----------------------------------------: |
| Dominant primary route                   |                        approximately +200 |
| Minor fit or efficiency effect           |                                     ±5–10 |
| Moderate fit, workup, or omission effect |                                    ±15–30 |
| Major fit, workup, or omission effect    |                                   ±35–100 |
| Critical safety effect                   | −150 to −500, often with a care-point cap |

These bands improve consistency and reduce repetitive point-tuning work; they are not a hidden
clinical formula. Every executable value remains explicit and can be overridden by a narrower
medication, diagnosis, interaction, or patient rule. Necessary investigation reward must still
exceed accessible cost. A critical contraindication is ineligible for positive goodness-of-fit
bonuses, and a cap prevents accumulated small bonuses from rescuing a critical error.

### Where points enter the generated encounter

Patient and diagnosis profiles never contain points. They resolve the complete frozen patient
state first, including facts the player may never reveal. The focused policy compiler then
matches approved, point-free qualitative rules to that state and the exact action horizon. Only
after that match may the separate balance catalog attach an explicit provisional magnitude to the
exact rule version. The generated attempt freezes the minimized balance payload before play, and
submission evaluates the player's final decision against it before combination and summation.

This order is deliberate:

1. Database profiles answer “what is true about this patient?”
2. Qualitative rules answer “what does this fact/action combination mean for this focused
   decision?”
3. Balance records answer “how much should that already-reviewed meaning matter in this game
   build?”
4. The submitted-decision trace answers “which of those rules actually applied, were fulfilled,
   or were omitted?”

Retuning a balance cannot change patient generation or the qualitative rule. Changing a
diagnosis profile cannot silently award points. A new finding, medication relationship, or
source contribution remains point-free until a psychiatrist accepts a concrete qualitative rule;
tooling may then assign a provisional value from the approved bands. This allows the personal
knowledge database to remain comprehensive while the game compiles only focused, auditable,
decision-relevant scoring.

D-238 implements the first native use of this contract. The point-free MDD route is decorated
after qualitative compilation by one separate exact balance record at `+200`. The native scorer
evaluates the route's full cardinality for the submitted and database-plan decisions, then emits
the D-235 trace. D-242 freezes each as one full point-free decision containing purchased
information-action IDs, diagnosis selections, and treatment selection. The player decision is
derived from replayed purchases and final events; the database plan is one explicit reference
snapshot. The current MDD route still reads only treatment selection, so this wider audit changes
no current award. It never derives the value from CANMAT, concern, certainty, tags, complexity, or
a caller-authored score row. A balance retune versions only the balance record.

D-243 preserves treatment trigger and purchased-information fulfillment as separate exact
predicates and evaluates a frozen decision as `not_triggered`, `fulfilled`, or `omitted`.
Qualitative prerequisites remain visible `unbalanced` rows worth zero until an exact balance owner
exists. D-244 adds the separate three-outcome balance shape: not triggered must be zero,
fulfilled must be a positive explicit provisional value, and omitted must be negative. The
current matched/nonmatched balance cannot be reused because an omission is not the same as a rule
that never triggered.

The two already-approved MDD any-medication-start prerequisites begin with the existing reviewed
prototype tuning: medication reconciliation `+35/-25` and allergy/adverse-reaction history
`+30/-40`, both in `workup`. With the independent `+200` broad route, the database plan is
`265`. Medication plus neither history is `135`; reconciliation only is `195`; reaction history
only is `205`; both is `265`; and histories without a medication start contribute `0`. Two
medication starts fail the broad route but still activate both prerequisites, producing `-65`
when neither history was purchased. Every trace preserves the three-state result, both component
Booleans, exact selected targets, component, balance reference, and explanation.

D-252 freezes the exact point owners used by a native generated attempt. A minimized balance
snapshot retains only rubric-referenced magnitudes, outcomes, components, impact bands, and
player-facing explanations while a separate fingerprint identifies the complete validated source
catalog. Both player and database-plan traces are stored and replayed against that snapshot before
D-159 combination and totals. Authoring rationale and Developer-opinion records remain outside the
attempt. Reordering a catalog is inert; changing a same-ID/version magnitude changes the snapshot
fingerprints.

D-255 adds direct focused information actions without pretending that availability means the
player obtained them. A required action has explicit positive fulfilled and negative omitted
outcomes; a preferred action has a positive selected outcome and zero unselected outcome. The
first native MDD values are episode course `+35/−35`, depressive syndrome `+50/−50`, and preferred
substance-use history `+30/0`. Together with the existing `+200` broad medication route and
treatment-triggered histories, the current isolated database-plan fixture totals `380`. These
care-point values do not include information operating costs; settlement still subtracts those
costs separately.

D-239 independently makes generated information expenses native. It does not affect care points
or whether an investigation was appropriate. The compiler selects the least-cost available
equal-quality fulfillment method from the exact versioned service owner after D-219 mechanical
availability and D-222 action-specific staff configuration are verified. It derives operating
cost, external cost avoided, and staff savings; changing only fulfillment economics therefore
cannot change the clinical rule trace. At that checkpoint, treatment-service charges and the
other settlement inputs remained explicitly unverified pending separate owners.

D-270 attaches that bounded owner for service-backed interventions and dispositions. The exact
versioned treatment and service owners plus D-219 availability determine one least-cost
equal-quality quote after the final selection. Each such charge is frozen with its method and
savings and rederived during replay. A treatment with no explicit fulfillment service has no
operating charge; medication and regimen-operation costs remain unmodeled rather than silently
verified at zero.

D-271 removes the remaining free scalar settlement seam. One exact, separately versioned
template economy policy supplies provisional base reimbursement and challenge bonus. The frozen
current ClinicState supplies prior clinic points, lifetime points, and raw satisfaction, and must
project to the same operational clinic context used to admit the patient. The exact versioned
satisfaction curve derives the multiplier and must agree with the stored clinic state. Settlement
then derives every before/after balance and independently replays the full owner set. No real
generated-template economy policy has been authored yet, and neither reimbursement nor challenge
bonus may be inferred from diagnosis, severity, or the optional-feature complexity budget.

Certainty does not multiply point magnitude automatically. Concern describes potential clinical
impact; certainty describes confidence and provenance. A high-impact but uncertain risk remains
visible as such instead of becoming artificially trivial, while review and reuse gates prevent the
uncertainty from being hidden.

## Treatment and modifier layers

The final combination is evaluated in named layers:

1. Base treatment grade for the complete intervention selection.
2. Regulatory-alignment modifiers when applicable.
3. Patient-fit modifiers from the selected medication and therapy files.
4. Treatment-specific workup requirements.
5. Medication discontinuation rules.
6. Interaction and contraindication rules.
7. Combination support, redundancy, and parsimony.
8. Disposition.
9. Efficiency.

The itemized receipt keeps these layers separate. In the current initial-MDD snapshot, one of the
five reviewed first-line antidepressants receives the same provisional +200 primary-route award.
A compatibility case may then show a separate +0 fit row; it did not “earn zero,” it simply had no
additional patient-specific adjustment. Native generated point-report v3 does not yet create a
balanced matched-zero row; that explicit trace status is deferred until the first reviewed native
fit contributor requires it. The current medically unreviewed mirtazapine prototype
has a +35 insomnia fit modifier and a −50 high-BMI-without-countervailing-reason modifier. Those
values exercise architecture and remain reviewable clinical content, not authoritative guidance.

A verified current FDA on-label match may eventually compile one minor
`regulatory_alignment` row after the generic rule receives rule-level review. The provisional
default is +10 when indication, population, jurisdiction, and selected formulation all match. The
row is deliberately smaller than the primary route and most major fit/safety effects. Duplicate
label records cannot stack it; a hard contraindication suppresses it; lack of FDA approval creates
no automatic deduction. A case whose focused board-style question is FDA status may author a
larger case-specific row instead.

### Rule combination and override semantics

Rules do not override one another merely because they are loaded later or mention the same
treatment. A contributor may declare:

- `effectId`: the one effect it represents;
- `specificityPriority`: explicit precedence among rules for that same effect; and
- `issueId`: the underlying error to use for worst-only negative deduplication.

A more-specific rule replaces a general rule only when their non-null `effectId` values match.
Different effects—such as primary treatment appropriateness, insomnia fit, metabolic fit, prior
response, and a separate interaction—remain independently visible and may stack. Negative rows
sharing one `issueId` contribute only the worst point consequence. Equal specificity for the same
effect is a content-validation error; the engine's stable-ID tie-break exists to preserve
determinism if an older or otherwise unvalidated snapshot reaches replay.

A true hard contraindication suppresses only positive primary-treatment, fit, response,
tolerability, prior-trial, and regulatory-alignment rows for the same canonical exact selected
treatment target. Broad medication-start and regimen-operation predicates are normalized to the
selected medication or regimen-entry operation before this comparison. A high-risk but
nonabsolute concern remains a negative row and does not erase otherwise legitimate benefits.
Other earned workup, diagnosis, and disposition points remain separate unless their own rule says
otherwise. Safety caps remain an additional, explicit mechanism for a critical error; suppression
is not an implicit global score cap.

The native resolver runs once after per-rule evaluation for both the player and database plan.
It keeps every contributor in the saved trace. `replaced`, `deduplicated`, and `suppressed` rows
show their original points, applied zero, direct controlling trace, combination explanation, and
exact selected targets. A direct controller can itself later be suppressed or deduplicated, so
the complete deterministic chain remains auditable without double-counting it. Current
compilation rejects equal-priority ambiguity for the same effect; a stable rule-ID tie-break is
retained for deterministic recovery.

Every investigation remains a genuine point cost even when it reveals nothing useful. A purchase
does not automatically earn care points; independent workup objectives reward only authored
essential, high-yield, or treatment-required information. Revealing a useful fact improves the
player's ability to select a fitting intervention, but it does not unlock that intervention's
points. All positive and negative fit modifiers evaluate the complete resolved patient state
whether revealed or not, representing the immediate downstream effects of the submitted choice.
Fit points stay on the treatment row, while workup cost/reward remains separate. The complete rule
trace itemizes every applied or resolved modifier and its provenance so a player can inspect
exactly why a choice gained, lost, or had points suppressed.

The target compiler does not require the focused policy to link each modifier by hand. One primary
policy supplies the dominant broad route. A reviewed secondary modifier becomes eligible when its
exact typed patient dependency matches the complete frozen state and its exact treatment,
regimen-operation, intervention, investigation, or disposition target intersects the focused
action horizon. Only an actually submitted choice later earns or loses its points. Broad routes
for background diagnoses do not become additional score objectives, and unselected actions do not
collect fit bonuses. Matching safety/interaction and treatment-specific prerequisite guardrails
remain eligible. Exhaustive scanning and the derived reverse index must produce the same
qualitative candidates before balance is applied. The compiler freezes each candidate's
patient/action activation logic and its exact fact-to-record bindings before balance is applied.
When several attributes must describe one repeated trial, regimen entry, reaction, or other
record, the rule uses an explicit same-record predicate; ordinary `all` may combine independent
owners. A missing or unassessed value never satisfies a negative rule.

A subjective assessment response may preserve several contributing patient facts, but purchasing
that action and satisfying its workup objective still occur once. Contributor count cannot
multiply the investigation reward. Display wording is never a scoring predicate; a clinical rule
must reference a typed fact or an explicitly reviewed assessment-response identity. This permits
ambiguous, natural patient language without allowing “tired” or another phrase to become a hidden
diagnostic or point rule.

Report/observation disagreement follows the same rule. A scoring predicate must name the exact
reviewed source/time fact or response it requires; it cannot parse a generic phrase or silently
choose between patient report, history, collateral, record, and MSE. A discrepancy has no automatic
penalty or inferred meaning.

For an explicitly modeled proposition, scoring also cannot infer truth from the number of agreeing
claims. Exact copies and known correlated evidence retain shared-origin/dependency metadata and
cannot stack as independent corroboration. Only a narrow reviewed rule may consume a named
proposition, source claim, or allowed evidence group. The receipt must preserve the hidden
proposition, each revealed or unrevealed source claim, dependency handling, and the exact rule that
used them. Conditional claim-generation probabilities are separate game-calibration data; they are
not care points, source authority, or general patient credibility.

Evidence does not have to converge on hidden truth for an encounter to remain scoreable. A focused
rubric may reward a blank, broad, or unspecified diagnosis; a conservative intervention that
reasonably covers multiple live possibilities; or several defensible routes when the resolved
evidence does not justify greater precision. Hidden truth may still drive objective downstream fit
and safety, but it cannot by itself erase credit for a reasonable uncertainty-aware decision.
Missing support for such routes is a nonblocking coverage gap and review ticket, not a generator
retry rule.

Resolved patient facts also remain separate from what the player purchased. A prior reaction to a
selected medication therefore affects the submitted treatment even when the player did not reveal
the allergy/reaction history. Revealing that history earns the treatment-prerequisite workup
points; it does not create or erase the reaction. The current shared mild/moderate/severe/unknown
reaction mapping is medically unreviewed provisional balance and must yield to a more specific
reviewed medication/reaction rule when one exists.

Exact complete matches are labeled `authored_pathway`. A nonexact programmed result is prominently labeled `engine_inferred`; the receipt says deterministic catalog rules estimated it. `unmatched` means no programmed route recognized the combination and invites a missing-alternative ticket.

Medication and psychotherapy are peer modalities. A reviewed pathway may define either as a
single sufficient treatment, explicitly reward one compatible medication-plus-therapy
combination, or treat that combination as neutral and acceptable when the source does not prefer
it. Cardinality and redundancy rules prevent “select everything” play: multiple same-role
antidepressants or several simultaneous primary psychotherapies require explicit support or lose
points. Investigation shotgun behavior is ordinarily penalized through cumulative point costs
without duplicate clinical deductions.

The current initial-outpatient MDD snapshots implement one deliberately bounded rule: starting two
or more options carrying the stable `antidepressant` tag in the same submitted plan triggers the
existing harmful duplicate-start consequence. One medication plus psychotherapy does not. This is
an explicitly unreviewed Developer-opinion game rule for those snapshots—not a universal
polypharmacy claim. The authoring-only normalized regimen boundary now preserves explicit
medication classes/memberships, route-owned transition meaning, and separate benefit, fit,
duplication, interaction, withdrawal, contraindication, and prerequisite contributors. It
activates no reusable consequence: same-class membership or medication count alone never creates
a penalty, and replacement-shaped actions never imply safe overlap or cross-titration.

## Safety and disposition

Safety rules can deduct large point values, record named safety errors, and cap the care subtotal. They are not hidden duplicate financial penalties: the same signed care subtotal enters settlement once.

Disposition is a material clinical decision. The stable outpatient patient earns +70 for close outpatient follow-up. Unnecessary emergency transfer receives a provisional −500 disposition points and a 75-point cap. Safe referral remains available for patients the location cannot treat, but disproportionate escalation is not a free answer.

## Settlement formula

Normal-mode settlement is:

```text
positive reward subtotal =
    base reimbursement
  + max(0, care points)
  + complexity bonus
  + challenge bonus

care-point penalty = min(0, care points)

gross reimbursement = round(max(0,
    positive reward subtotal × satisfaction multiplier
  + care-point penalty))

calculated payout =
    gross reimbursement
  - information operating expenses
  - selected treatment-service operating expenses

points earned = max(0, calculated payout)

spendable points after = spendable points before + points earned
lifetime points after = lifetime points before + points earned
```

The base reimbursement is intentionally large enough to cover a focused indicated workup and
tolerate a small amount of inefficiency, while extensive unnecessary testing or service use still
matters. Treatment-service availability and cost are resolved when the final selection is made;
they do not decide whether that selection is clinically correct. Encounter expenses never directly
debit previously banked points. Debt is impossible. Endgame and Developer are practice modes: they
calculate the same projected payout but bank zero.

## Upgrade spending and service savings

An upgrade is a voluntary bank transaction, not an encounter expense:

```text
if every declarative gate is satisfied and balance >= purchase cost:
  spendable points after = spendable points before - purchase cost
  lifetime points after = lifetime points before
  owned upgrades/capabilities/formularies = prior values + granted IDs
else:
  clinic state is unchanged
```

The first ECG upgrade costs 1,200 points. The outside ECG method costs 500 per encounter and the in-house method costs 70, so estimated savings are 430 per use and the displayed break-even is `ceil(1,200 / 430) = 3` uses. Service resolution automatically chooses the in-house method after ownership. It does not add care points, change the ECG result, alter whether ordering it was indicated, or retroactively change lifetime progression.

The Clinical intake assistant is a 900-point staff purchase gated at 600 lifetime points. After
hiring, the player may configure up to three of four routine actions. Each delegated action uses an
action-specific discounted but nonzero fulfillment method: medication reconciliation costs 18
instead of 30 points, adherence review 9 instead of 15, and either standard symptom checklist 12
instead of 20. The result, objective satisfaction, care-point rule, and immediate reveal are
identical to a manual purchase. The receipt attributes the delegated fulfillment and savings; a
reference run uses the same automatic intake and skips any configured nonrepeatable action instead
of buying it twice. Hiring creates no salary, maintenance charge, free information, or clinical
bonus.

The first formulary expansion costs 800 points and adds bupropion, mirtazapine, and buspirone to the starter office's start-medication menu. It does not imply those drugs are appropriate for a particular patient; patient and medication rules still evaluate fit. A medication already taken by a patient remains available to stop or continue even if the location does not stock it for new starts.

Facility movement uses the same atomic purchase contract. The outpatient clinic becomes eligible at 2,500 lifetime points and costs 1,800 current points; the multidisciplinary center becomes eligible at 7,500 lifetime points, requires the outpatient-clinic purchase, and costs 5,000 current points. Crossing a lifetime threshold grants neither facility automatically. Spending points never lowers the lifetime value, so eligibility cannot run backward.

Decor contributes raw satisfaction points. The current catalog converts them with a transparent rational curve:

```text
diminishing value = raw satisfaction / (raw satisfaction + 20)
multiplier = min(1.15, 1 + (1.15 - 1) × diminishing value)
```

The multiplier is rounded to three decimals for persisted/displayed state. The six-point plant produces 1.035×; plant plus ten-point artwork produces 1.067×, so the second item's per-point effect is smaller. The cap and half-saturation value live in the decor catalog rather than React. Only the positive reward subtotal is multiplied. A negative care subtotal remains a full unmultiplied penalty, and care-point traces, safety errors, treatment grades, and score caps are unchanged.

For the 745-care-point starter database plan, the undecorated gross is 1,445 and the 145-point
focused workup yields 1,300 banked points. With the plant, gross is
`round(1,445 × 1.035) = 1,496`, yielding 1,351 points. With plant plus artwork, gross is
`round(1,445 × 1.067) = 1,542`, yielding 1,397 points. The same decor leaves the unsafe reference
run at a zero payout.

## Executable starter reference runs

These are generated by `pnpm demo:reference-runs`, not hand-entered expectations. “Workup cost” in
these tables is `informationExpenses`. Every listed reference policy currently has zero
`treatmentExpenses`; a selected service-backed intervention or disposition is natively quoted,
shown, and deducted separately.

| Policy             | Care points | Database plan | Workup cost | Base | Complexity | Gross | Calculated | Banked |
| ------------------ | ----------: | ------------: | ----------: | ---: | ---------: | ----: | ---------: | -----: |
| Database plan      |         745 |           745 |         145 |  650 |         50 | 1,445 |      1,300 |  1,300 |
| Equivalent example |         745 |           745 |         145 |  650 |         50 | 1,445 |      1,300 |  1,300 |
| Shotgun testing    |         725 |           745 |       7,755 |  650 |         50 | 1,425 |     −6,330 |      0 |
| Unsafe treatment   |        −695 |           745 |         145 |  650 |         50 |     5 |       −140 |      0 |

Expected care-point ordering is database plan = strong alternative > shotgun > unsafe. The equal
focused results intentionally reflect one broad first-line medication family rather than an
arbitrary medication preference. Financially, either focused plan dominates shotgun testing.
Unsafe starter treatment earns no payout.

The second medically unreviewed ECG prototype uses the same four policy kinds before ownership:

| Policy             | Care points | Database plan | Workup cost | Base | Complexity | Gross | Calculated | Banked |
| ------------------ | ----------: | ------------: | ----------: | ---: | ---------: | ----: | ---------: | -----: |
| Database plan      |       1,140 |         1,140 |         630 |  700 |        100 | 1,940 |      1,310 |  1,310 |
| Strong alternative |       1,135 |         1,140 |         630 |  700 |        100 | 1,935 |      1,305 |  1,305 |
| Shotgun testing    |       1,120 |         1,140 |       7,745 |  700 |        100 | 1,920 |     −5,825 |      0 |
| Unsafe treatment   |      −1,155 |         1,140 |         130 |  700 |        100 |     0 |       −130 |      0 |

For an identical database-plan run, ownership changes only fulfillment economics:

| ECG state | Care points | Rule trace | Workup cost | Net payout | External cost avoided |
| --------- | ----------: | ---------- | ----------: | ---------: | --------------------: |
| Outside   |       1,140 | identical  |         630 |      1,310 |                     0 |
| In house  |       1,140 | identical  |         200 |      1,740 |                   430 |
