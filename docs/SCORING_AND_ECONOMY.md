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

The starter MDD database plan uses six focused histories costing 135 points total. The
episode/timeline, depressive-symptom, suicide-safety, and substance-contribution objectives award
35, 50, 50, and 30 points. Medication reconciliation establishes the previously unknown current
list; its 35-point treatment-conditional award exceeds its 30-point cost. The mania screen is a
treatment prerequisite: its 45-point conditional award exceeds its 25-point cost. Omitting a
necessary item creates a `critical_omission` trace shown in red.

## Treatment and modifier layers

The final combination is evaluated in named layers:

1. Base treatment grade for the complete intervention selection.
2. Patient-fit modifiers from the selected medication and therapy files.
3. Treatment-specific workup requirements.
4. Medication discontinuation rules.
5. Interaction and contraindication rules.
6. Combination support, redundancy, and parsimony.
7. Disposition.
8. Efficiency.

The itemized receipt keeps these layers separate. For example, a selected SSRI can show a +100 base award and a separate +0 patient-fit row. It did not “earn zero”; it simply had no additional patient-specific adjustment. The current medically unreviewed mirtazapine prototype has a +35 insomnia fit modifier and a −50 high-BMI-without-countervailing-reason modifier. Those values exercise architecture and remain reviewable clinical content, not authoritative guidance.

Every investigation remains a genuine point cost even when it reveals nothing useful. A purchase
does not automatically earn care points; independent workup objectives reward only authored
essential, high-yield, or treatment-required information. Under D-143, the next engine pass will
let a useful revealed fact unlock an objectively applicable positive fit bonus, rather than
awarding that bonus from hidden patient state alone. The fit points stay on the treatment row,
while the trace separately shows the supporting knowledge. Safety and contraindication effects
are never hidden by failure to ask. Ordinary non-safety negative-fit gating remains an explicit
pending decision, so current runtime behavior is unchanged in this source-intake checkpoint.

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
polypharmacy claim. A future normalized regimen evaluator must represent indication or role,
augmentation benefit, additive risk, interactions, and cross-titration as separate auditable
contributors before applying reusable combination logic.

## Safety and disposition

Safety rules can deduct large point values, record named safety errors, and cap the care subtotal. They are not hidden duplicate financial penalties: the same signed care subtotal enters settlement once.

Disposition is a material clinical decision. The stable outpatient patient earns +70 for close outpatient follow-up. Unnecessary emergency transfer receives −450 disposition points and a 200-point cap. Safe referral remains available for patients the location cannot treat, but disproportionate escalation is not a free answer.

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

For the 515-care-point starter database plan, the undecorated gross is 1,215 and the 135-point
focused workup yields 1,080 banked points. With the plant, gross is
`round(1,215 × 1.035) = 1,258`, yielding 1,123 points. With plant plus artwork, gross is
`round(1,215 × 1.067) = 1,296`, yielding 1,161 points. The same decor leaves the unsafe reference
run at a zero payout.

## Executable starter reference runs

These are generated by `pnpm demo:reference-runs`, not hand-entered expectations. “Workup cost” in
these tables is `informationExpenses`. Every listed reference policy currently has zero
`treatmentExpenses`; a selected service-backed intervention or disposition would be shown and
deducted separately.

| Policy             | Care points | Database plan | Workup cost | Base | Complexity | Gross | Calculated | Banked |
| ------------------ | ----------: | ------------: | ----------: | ---: | ---------: | ----: | ---------: | -----: |
| Database plan      |         515 |           515 |         135 |  650 |         50 | 1,215 |      1,080 |  1,080 |
| Strong alternative |         515 |           515 |         135 |  650 |         50 | 1,215 |      1,080 |  1,080 |
| Shotgun testing    |         495 |           515 |       7,745 |  650 |         50 | 1,195 |     −6,550 |      0 |
| Unsafe treatment   |        −905 |           515 |         135 |  650 |         50 |     0 |       −135 |      0 |

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
