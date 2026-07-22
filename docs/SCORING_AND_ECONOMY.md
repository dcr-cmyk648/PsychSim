# Points, scoring, and settlement

## One visible unit

PsychSim uses points everywhere. The player spends points on investigations, earns points for clinical decisions, receives a base reimbursement in points, banks the nonnegative result, and unlocks later progression through lifetime points. Reputation, XP, credits, letter ranks, and a separate 0–100 clinical scale are retired.

The receipt still separates point sources so the calculation is legible:

- `carePointsEarned`: signed points from workup, treatment, safety, nonmedication care, disposition, and efficiency.
- `baseReimbursement`: the encounter's fixed point allowance.
- `operatingExpenses`: the points spent revealing information and tests.
- `netClinicPointsEarned`: the nonnegative payout added to both the spendable balance and lifetime progression in Normal mode.

All are the same unit. “Care points” names a subtotal; it is not a second currency.

## Database-plan comparison

Each patient owns a reviewed-as-a-unit database plan and one or more accepted alternatives. The receipt reports:

- database-plan care points;
- the player's care points and signed difference from the database plan;
- database-plan workup cost;
- selected-path workup cost;
- actual workup cost and variance.

The two path costs are authored sendout baselines for a compatible starter clinic. Actual cost is resolved from the clinic at encounter time. If owned equipment fulfills a service more cheaply, the receipt separately shows `externalCostAvoided` for that item and the total upgrade savings. A below-baseline variance therefore remains auditable rather than looking like a missing expense.

The UI never calls this an “optimal plan.” A player may exceed the database-plan subtotal when a reviewed catalog fit modifier makes another reasonable choice fit the generated patient better. Care points are not clamped to 0–100 and may be negative after unsafe care.

## Workup objectives

Each objective has a stable ID, importance, JSON-safe satisfaction predicate, points when obtained, omission penalty, and explanations. `any` represents explicit alternatives. An appropriate negative result receives full points because ordering the information—not whether it is positive—is evaluated.

Necessary or treatment-required investigation points must exceed the cheapest available point cost at every compatible location. Validation rejects a case that violates this rule. Optional or unnecessary actions may cost points without earning care points. Unsupported expensive workups therefore reduce the payout even when the care subtotal changes little.

The starter MDD patient uses four focused histories costing 80 points total. The episode/timeline, depressive-symptom, and suicide-safety objectives award 35, 50, and 50 points. The mania screen is a treatment prerequisite: its 45-point conditional award exceeds its 25-point cost. Omitting a necessary item creates a `critical_omission` trace shown in red.

## Treatment and modifier layers

The final combination is evaluated in named layers:

1. Base treatment grade for the complete medication selection.
2. Patient-fit modifiers from the selected medication's own file.
3. Treatment-specific workup requirements.
4. Medication discontinuation rules.
5. Interaction and contraindication rules.
6. Nonmedication selections.
7. Disposition.
8. Efficiency.

The itemized receipt keeps these layers separate. For example, a selected SSRI can show a +100 base award and a separate +0 patient-fit row. It did not “earn zero”; it simply had no additional patient-specific adjustment. The current medically unreviewed mirtazapine prototype has a +35 insomnia fit modifier and a −50 high-BMI-without-countervailing-reason modifier. Those values exercise architecture and remain reviewable clinical content, not authoritative guidance.

Exact complete matches are labeled `authored_pathway`. A nonexact programmed result is prominently labeled `engine_inferred`; the receipt says deterministic catalog rules estimated it. `unmatched` means no programmed route recognized the combination and invites a missing-alternative ticket.

## Safety and disposition

Safety rules can deduct large point values, record named safety errors, and cap the care subtotal. They are not hidden duplicate financial penalties: the same signed care subtotal enters settlement once.

Disposition is a material clinical decision. The stable outpatient patient earns +70 for close outpatient follow-up. Unnecessary emergency transfer receives −450 disposition points and a 200-point cap. Safe referral remains available for patients the location cannot treat, but disproportionate escalation is not a free answer.

## Settlement formula

Normal-mode settlement is:

```text
gross reimbursement = round(max(0,
    base reimbursement
  + care points
  + complexity bonus
  + challenge bonus) × satisfaction multiplier)

calculated payout = gross reimbursement - investigation operating expenses

points earned = max(0, calculated payout)

spendable points after = spendable points before + points earned
lifetime points after = lifetime points before + points earned
```

The base reimbursement is intentionally large enough to cover a focused indicated workup and tolerate a small amount of inefficiency, while extensive unnecessary testing still matters. Encounter expenses never directly debit previously banked points. Debt is impossible. Endgame and Developer are practice modes: they calculate the same projected payout but bank zero.

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

The first formulary expansion costs 800 points and adds bupropion, mirtazapine, and buspirone to the starter office's start-medication menu. It does not imply those drugs are appropriate for a particular patient; patient and medication rules still evaluate fit. A medication already taken by a patient remains available to stop or continue even if the location does not stock it for new starts.

Satisfaction is fixed at 1.00× in Milestone 2. A future capped, diminishing-return decor multiplier may alter positive reimbursement, but it cannot alter care rules, safety errors, or treatment correctness.

## Executable starter reference runs

These are generated by `pnpm demo:reference-runs`, not hand-entered expectations.

| Policy             | Care points | Database plan | Workup cost | Base | Complexity | Gross | Calculated | Banked |
| ------------------ | ----------: | ------------: | ----------: | ---: | ---------: | ----: | ---------: | -----: |
| Database plan      |         450 |           450 |          80 |  650 |         50 | 1,150 |      1,070 |  1,070 |
| Strong alternative |         445 |           450 |          80 |  650 |         50 | 1,145 |      1,065 |  1,065 |
| Shotgun testing    |         430 |           450 |       7,670 |  650 |         50 | 1,130 |     −6,540 |      0 |
| Unsafe treatment   |        −935 |           450 |          80 |  650 |         50 |     0 |        −80 |      0 |

Expected care-point ordering is database plan > strong alternative > shotgun > unsafe. Financially, the focused plans dominate shotgun testing. Unsafe starter treatment earns no payout.

The second medically unreviewed ECG prototype uses the same four policy kinds before ownership:

| Policy             | Care points | Database plan | Workup cost | Base | Complexity | Gross | Calculated | Banked |
| ------------------ | ----------: | ------------: | ----------: | ---: | ---------: | ----: | ---------: | -----: |
| Database plan      |       1,140 |         1,140 |         630 |  700 |        100 | 1,940 |      1,310 |  1,310 |
| Strong alternative |       1,135 |         1,140 |         630 |  700 |        100 | 1,935 |      1,305 |  1,305 |
| Shotgun testing    |       1,120 |         1,140 |       7,670 |  700 |        100 | 1,920 |     −5,750 |      0 |
| Unsafe treatment   |      −1,155 |         1,140 |         130 |  700 |        100 |     0 |       −130 |      0 |

For an identical database-plan run, ownership changes only fulfillment economics:

| ECG state | Care points | Rule trace | Workup cost | Net payout | External cost avoided |
| --------- | ----------: | ---------- | ----------: | ---------: | --------------------: |
| Outside   |       1,140 | identical  |         630 |      1,310 |                     0 |
| In house  |       1,140 | identical  |         200 |      1,740 |                   430 |
