# Game design contract

## Player fantasy

The player starts as a careful solo psychiatric prescriber in a minimally equipped office and grows toward an integrated psychiatric-medical system. The fantasy is not “complete paperwork correctly”; it is “make sharp medication decisions, earn trust, and turn one room into an institution.” A routine encounter should take roughly two to five minutes.

The long arc is:

`solo office → outpatient clinic → multidisciplinary center → specialty psychopharmacology center → psychiatric hospital → integrated psychiatric-medical center → behavioral-health system`

## Patient loop

An encounter launcher shows only a fictional patient name and brief chief complaint. It never labels the diagnosis, puzzle type, difficulty interpretation, or likely answer: a complaint of “depression” may ultimately have another cause. The opened chart can then show brief observable context, known medications/history, and basic vitals already available at the location. The player purchases structured history, records, examination, laboratory, or diagnostic actions. Each result is revealed immediately and enters an expense ledger; there is no virtual clock, waiting, pending queue, or repeated action by default.

The location-compatible menu is deliberately stable across cases: neutral searchable History, Physical, Labs, and Imaging lists do not reveal the case's rubric. A case supplies the patient-specific result behind every option. Fulfillment badges distinguish sendouts from work performed in house and make the financial tradeoff visible without revealing clinical correctness. Early solo-office encounters begin with common couch-and-clipboard presentations such as basic depressive complaints; adverse-effect and interaction puzzles enter after that foundation.

Result prose stops at Subjective and Objective facts. It may report what the patient/collateral said, what the clinician observed/measured, or what a record/test reported. It must not tell the player that outpatient care is suitable, a diagnosis is supported, a treatment is appropriate, or an action is defensible/redundant before submission.

Information results are short structured findings, not case-specific prose paragraphs. History
commonly appears as atomic `+` and `−` findings whose labels and order can vary. Every row also
shows a plain-language outcome chip such as `Present` or `Absent`; positive and negative states use
distinct grouped styling, so the result remains legible without relying only on color or treating a
negative as an ordinary list item. A criteria-bearing patient definition declares the required and
allowed number of positives; the MDD prototype deterministically selects five to seven depressive
symptoms while preserving required core symptoms. This makes a patient family recombinable without
letting a memorable anecdote become an answer key.

Absence of a diagnosis does not require every related symptom to be negative. The finite Reviewer
cohort pilots ordinary subthreshold variation by allowing zero or one background anxiety finding
to be positive outside the primary GAD scenario. That is a deliberately narrow current fixture,
not the target complexity ceiling. Future generated findings may overlap enough to superficially
satisfy another symptom checklist; they remain visible and may affect reviewed fit rules but do not
automatically create internal diagnosis truth or change the focused rubric. Attribution, timing,
substance or medication context, and exclusion logic remain separate from symptom count. New
symptom families need reviewed generation inputs rather than one global probability.

Symptom duration is also structured when it can matter clinically. Reviewer scenarios choose
deterministically among stable numeric value/unit options, save the exact resolved measurement for
replay and audit, and render it through short interchangeable sentences. Current ranges only vary
within each authored episode state. PsychSim does not yet implement cyclothymia duration thresholds
or a generic duration-based diagnostic engine; a future near-miss case must explicitly identify the
reviewed criterion it is designed to miss after suitable source and clinical review.

When a patient file does not own a test result, that test's individual definition file may generate it deterministically from declared patient context such as age, sex used for reference ranges, diagnoses, and clinical tags. Numeric results show the value, unit, reporting profile's reference interval, and `N`/`H`/`L` flag in an EMR-like table. Most values fall within that test's curated normal-generation range. A numeric panel has a test-specific chance of at most one slightly out-of-range flag drawn only from tightly bounded mild ranges. These incidental flags are objective findings, not hidden diagnoses: they do not alter the case rubric, and the player must decide whether they matter. Clinically meaningful abnormalities require an explicit reviewed patient variant.

The player then edits a structured final combination: start, stop, and occasionally continue medications; select nonmedication care; and choose a disposition or referral. Submission locks the combination. The receipt reports care points versus the patient-owned database plan, rule-by-rule explanations, safety errors, workup cost, actual spending, payout, and lifetime points. There is no letter rank or 0–100 layer. Attempts save locally and disputed items can be flagged or turned into proposed developer guidance tickets.

No formal diagnosis, differential, prose assessment, plan, follow-up interval, or contingency text is submitted by the player.

## Clinical center of gravity

Psychopharmacology drives the puzzles: selection, discontinuation, adverse effects, interactions, CYP inhibition/induction, monitoring, organ constraints, symptom-worsening medications, prior trials, resistance, adherence, levels, limited formularies, uncommon alternatives, and cases where adding nothing is best. Medical, neurologic, laboratory, and imaging decisions matter only when they sharpen psychiatric reasoning, treatment safety, or disposition.

The engine grades complete combinations and supports several defensible paths. A familiar medication can be unavailable; a start can require a stop or a test; two acceptable individual drugs can form a dangerous pair; and referral can be safe but financially inefficient. Grades are case-specific: optimal, strong alternative, acceptable, weak, ineffective, and harmful.

## Personal knowledge and learning loop

PsychSim's authoring database is also a personal knowledge system. It should organize the
developer's accumulated notes, authored teaching material, formal sources, concise interpretations,
unresolved disagreements, and identified gaps into coherent medication, diagnosis, investigation,
therapy, and policy dossiers. The developer should be able to audit what is known, see why a belief
is held, identify stale or weakly supported areas, receive bounded suggestions for recent reading,
and reinforce retention by reviewing dossiers and seeing the same rules exercised in varied
patients. This is closer to preparing and teaching a class than passively collecting references.

The knowledge layer may be comprehensive; an encounter must not be. The game compiles only the
small, reviewed, decision-relevant slice needed for one legible question-bank snapshot. Knowledge
that is useful for learning but irrelevant to that immediate decision remains available in the
database without entering the stem, action menu, rubric, or receipt.

## Clinic loop and positive progression

Points are the single economy, clinical-award, and progression unit. The profile tracks a current spendable balance and lifetime points earned. Every positive case payout increases both; a future purchase reduces only the balance, so progression never runs backward. Care decisions contribute signed point subcategories to the reimbursement calculation. In normal mode, investigation costs reduce only the case payout. Poor play generally earns zero rather than taking banked points, debt is impossible, starter cases remain repeatable, and safe referral remains available without up-front cash.

Disposition is part of clinical fit, not a free safety valve. A safe but disproportionate escalation receives a large signed point deduction; transferring a stable basic outpatient presentation to emergency care is materially worse than ordinary outpatient management. Safe referral remains preferable to unsafe internal treatment when higher care is actually needed.

Voluntary purchases include service contracts, equipment, staff, formularies, programs,
departments, facilities, and decor. The implemented early choices are an outpatient ECG machine,
an additive outpatient formulary expansion, a configurable Clinical intake assistant, two facility
moves, and three decor items. The assistant can automatically administer up to three allowlisted
routine checklist or medication-history actions at a discounted but nonzero per-patient cost; each
delegated result and expense follows the same auditable purchase path as a manual action. Purchases
spend only banked points and can increase margins, slots, available treatment options, or ambience;
they never rewrite patient facts or clinical correctness. There are initially no salaries,
maintenance, depreciation, loans, capacity queues, schedules, or insurance billing.

## Facilities, areas, and services

Lifetime-point thresholds make higher facility tiers purchasable; they do not grant them or every associated upgrade. The first three playable tiers are the one-slot solo office, the two-slot outpatient clinic at 2,500 lifetime points plus a separate 1,800-point purchase, and the three-slot multidisciplinary center at 7,500 lifetime points plus a separate 5,000-point purchase. Facility moves preserve prior equipment, formularies, decor, current balance after purchase, and the resolved patients already waiting in slots. Items declare permitted facility tiers, prerequisites, and optional required departments. Planned areas include outpatient, emergency, consultation-liaison, and inpatient, followed by addiction, geriatric, child/adolescent, perinatal, neuromodulation, imaging, laboratory, PHP/IOP, and observation areas.

The setting is part of every waiting-room slot and opened chart; diagnoses remain internal. A resolved patient remains stuck in a Normal slot until seen. Higher tiers can expose several eligible patient slots so the player chooses whom to see. Endgame practice mode derives the highest facility tier, all currently defined capabilities/formularies, the maximum approved queue size, and an explicit refresh button. Local Developer mode adds review content, shows only definitions not yet run, and permits rerolling all noncritical characteristics or resetting the run history. Both practice modes are reversible and bank no rewards; production excludes Developer content.

A service can be fulfilled outside, through a partner/shared service, or in house. The least expensive equivalent method is automatic. The case owns the patient result; clinic state owns availability and operating cost. For example, a 12-lead ECG costs 500 points through the starter office's outside service and 70 points after purchasing the compact ECG machine. The same authored result and care rules apply either way; the 430-point difference is shown as upgrade savings.

## Decor and satisfaction

The first visible environment items are a waiting-room plant, framed abstract print, and warm clinic lighting. Each contributes additive satisfaction, while the cataloged rational curve converts the total into diminishing returns toward a 1.15× cap. The hub visibly renders owned decor and every store card previews its multiplier change. Satisfaction multiplies only the positive reimbursement portion; negative care points remain unmultiplied. It never changes care-point rules, removes a safety error, makes harmful care acceptable, or makes unsafe play profitable.

## Challenge encounters

Later labeled challenges can use adverse-effect mimics, inhibitors/inducers, unusual metabolism, polypharmacy, levels, organ dysfunction, rare but clueable medical conditions, dangerous combinations, treatment resistance, and limited formularies. They must be inferable from available clues—not trivia traps.

## Non-goals

PsychSim is not a Step 3 clone, EHR/note-writing simulator, free-text interview, diagnosis or formulation exam, virtual-time simulation, real-time emergency game, billing/debt/maintenance system, leaderboard, cloud account, multiplayer product, or live-AI patient generator. It contains no real patient records and makes no claim of authoritative guidance without human review.
