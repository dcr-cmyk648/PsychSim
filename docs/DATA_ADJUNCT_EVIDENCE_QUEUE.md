# PsychSimDataAdjunct evidence queue

## Purpose and authority

This is the durable routing guide for the read-only PsychSimDataAdjunct. It is not a second
clinical-ticket database and does not duplicate request status.

- `content/cases/review/source-needed.requests.json` is the canonical machine-readable list of
  evidence gaps, exact questions, target IDs, acceptance criteria, and current status.
- `content/cases/review/database-driven-patient-generation.tickets.json` is the canonical clinical
  decision queue.
- This document supplies work order and packet expectations only.
- PsychSim remains the only canonical writer and the only project that can create IDs, decide
  source use, accept clinical meaning, assign points, or compile runtime rules.
- A packet may be consulted while it is explicitly preliminary when it helps identify reusable
  owners, schema fields, dependency edges, candidate bins, or missing review questions. Preliminary
  content remains authoring-only and cannot supply a clinical mapping, generation probability,
  qualitative rule, balance record, point magnitude, or runtime behavior.
- An identity shell or candidate bin may be created before its literature is complete. No
  diagnosis-owned executable generation profile may be authored until its exact diagnostic
  structure has a returned evidence packet and psychiatrist review.

The practical objective is evidence-complete vertical depth before encyclopedic breadth: close
the smallest set of general dependencies needed for one realistic generated encounter, then reuse
those owners across the next diagnoses. This gets playable texture sooner without lowering the
evidence gate for clinical mappings.

## Current ordered queue

Status below is intentionally omitted; the adjunct must read the canonical request record before
starting and skip anything no longer marked `needs_source`.

### Bootstrap lane — first realistic MDD generation

1. `source-request.mdd.current-episode-dimensions`
   - Blocking ticket: `ticket.catalog.diagnoses.mdd-current-episode-finding-profile`
   - Deliverable: sources and concise source-local findings that distinguish diagnosis-level
     dimensions from concrete manifestations; address core requirements, total dimensional
     cardinality, and the exact roles of pessimism/hopelessness and passive/active suicidality.
   - This packet unblocks the general dimension compiler's first real diagnosis profile.
2. `source-request.mdd.severity-thresholds`
   - Deliverable: operational, legally reusable mild/moderate/severe episode distinctions and
     disagreements. Do not substitute a treatment-severity grouping for a diagnostic rule.
   - D-379 landing contract: return source-local, source-conditioned candidate categorical mass
     for condition-attributed functional impairment only when the source actually supports it.
     Keep NHANES current screen-score difficulty, NSDUH past-year worst-period interference,
     STAR\*D treatment-seeking function, and setting-specific observations separate. The mapping
     must name the exact population, setting, time horizon, measurement construct, source
     locator, limitations, and proposed PsychSim profile target. Do not pool distributions,
     harmonize source labels, infer episode severity, or choose runtime weights.
   - D-380 separately landed only the broad current patient-reported impact finding through a
     PsychSim-reviewed NHANES aggregate plus Developer-opinion transportability bridge. That
     closes the Presenting problem result; it does not satisfy this request's
     condition-attributed impairment or severity boundaries.
3. `source-request.mdd.tsh-workup`
   - Deliverable: patient facts that make TSH useful, optional, or low value in a focused
     depressive presentation.
4. `source-request.mdd.antidepressant-fit-dimensions`
   - Deliverable: reusable patient-level fit inputs, with source limitations and null findings
     preserved. Do not produce medication winners or point magnitudes.

### General medication and texture lane

5. `source-request.medications.regimen-combination-boundaries`
6. `source-request.medications.regimen-adjustment-operations`
7. `source-request.background-exposures.age-banded-counts`
8. `source-request.background-exposures.supplement-enthusiast`
9. `source-request.supplements.effects-interactions`

### Later setting and differential lane

10. `source-request.delirium.polypharmacy-focused-snapshot`
11. `source-request.bpd-vs-bipolar.differential-boundaries`
12. `source-request.alcohol-withdrawal.ed-boundaries`

The data-review adjunct is also preparing broader diagnosis-coverage and formulary-coverage
briefs. Until an exact bundle exists, these remain pending unmapped evidence-horizon inputs rather
than canonical PsychSim requests. At the next relevant evidence or catalog boundary, the canonical
thread must check for new or revised bundles, validate their hashes/base/source access and rights,
then route each concrete source-local unit to an existing owner or a new candidate bin. A broad
brief cannot itself add a diagnosis to generated play, place a medication in a formulary, establish
a treatment route, or create rules or points.

### Current breadth checkpoint — 2026-08-03

The canonical thread rechecked the adjunct after D-287:

- the core mood-stabilizer/anticonvulsant breadth packet now has a dated Developer review, but its
  formal-source packet remains preliminary, medically unreviewed for downstream use, unmapped,
  and without an immutable evidence unit or bundle;
- the anxiety, panic, OCD, PTSD, and arousal-medication breadth packet is the adjunct's sole active
  item awaiting Developer review and has the same preliminary/unmapped/no-bundle limits;
- the adjunct explicitly treats “formulary breadth” as an evidence inventory, not a proposal to
  grant medication availability; and
- no diagnosis, medication identity, formulary membership, relationship, generation tendency,
  qualitative rule, balance, or point was imported.

The current PsychSim landing horizon has nine diagnosis-family/condition definitions, 55 broad
medication identity shells, 13 narrower runtime medication definitions, and three existing
formularies. Those counts are audit coordinates, not completeness or approval claims. A returned
breadth packet should first be compared with these identity shells to find genuinely missing
bins, aliases, source units, and relationship candidates. Formulary placement and playable
diagnosis activation remain later PsychSim-owned review decisions.

The preliminary anxiety/panic/OCD/PTSD/arousal breadth inventory exposed two unambiguous missing
ingredient bins. D-288 added neutral `medication.clomipramine` and `medication.pregabalin`
identity-only records only after independently verifying their exact ingredient properties
against the official NLM RxNorm API data version dated 2026-08-03. The preliminary packet supplied
only the gap signal. It did not supply identity authority, an indication, a diagnosis
relationship, a treatment route, formulary membership, comparative fit, safety meaning,
probability, rule, balance, or point value.

### Follow-up breadth checkpoint after D-290 — 2026-08-03

The canonical thread rechecked the adjunct after completing the source-independent D-290
projection:

- the anxiety/panic/OCD/PTSD/arousal packet now has a dated Developer review;
- the core antidepressant, core antipsychotic, cross-diagnostic medication census, core
  mood-stabilizer/anticonvulsant, and several reusable symptom/context packets also have dated
  Developer reviews;
- the insomnia/wakefulness medication-breadth packet is now the adjunct's sole active review item;
- all of these breadth packets still describe themselves as preliminary and unmapped, and none has
  an immutable evidence unit/bundle plus a snapshot-bound PsychSim mapping suitable for canonical
  import; and
- no completed broad diagnosis-coverage bundle or formulary-selection proposal exists. The
  adjunct continues to define “formulary breadth” as evidence inventory rather than medication
  availability.

Therefore no diagnosis, medication identity, formulary membership, source-derived relationship,
generation tendency, rule, balance, or point was imported at this checkpoint. The new reviewed
packets can inform later deduplication and evidence-gap routing once immutable source-local units
and a fresh mapping exist; dated Developer review alone is not downstream medical approval.

### Follow-up breadth checkpoint after D-305/D-306 — 2026-08-03

The canonical thread rechecked the adjunct while the reviewer was preparing broader diagnosis and
formulary coverage:

- the worktree remains dirty and contains expanded preliminary diagnosis/generator inputs,
  including MDD phenotype and functional-impairment packets, plus antidepressant, antipsychotic,
  mood-stabilizer, anxiety/PTSD/OCD, insomnia/wakefulness, and cross-diagnostic medication breadth
  inventories;
- the adjunct currently names the insomnia/wakefulness medication supplement as its sole active
  sequential review item, with substance-use/withdrawal/overdose/tobacco medication breadth
  planned afterward;
- the reviewed breadth materials still describe themselves as preliminary, medically unreviewed
  for downstream use, and unmapped; and
- `proposals/psychsim/` still contains only its contract README, so there is no new immutable,
  snapshot-bound diagnosis or formulary proposal for PsychSim to validate.

D-306 therefore used only PsychSim's existing medically unreviewed numeric-test catalog and no
adjunct clinical content. No diagnosis identity, formulary membership, medication relationship,
generation distribution, clinical rule, balance, or point was imported. Continue checking at
diagnosis, medication, and formulary boundaries; the first eligible packet must still pass exact
hash/base/source-use/target validation and PsychSim-owned clinical review.

### Follow-up breadth checkpoint after D-309 — 2026-08-03

After completing the neutral measurement and categorical-observation value owners, the canonical
thread rechecked the adjunct before choosing another evidence-facing boundary:

- the worktree remains dirty and the active review item remains the preliminary
  insomnia/wakefulness medication-breadth supplement, followed by planned
  substance-use/withdrawal/overdose/tobacco breadth;
- broader MDD phenotype, impairment, setting, antidepressant, antipsychotic, mood-stabilizer,
  anxiety/PTSD/OCD, insomnia/wakefulness, and cross-diagnostic medication packets now have useful
  source-conditioned observations and several dated Developer reviews, but still describe
  themselves as preliminary, medically unreviewed for downstream use, and unmapped;
- the sole sealed current evidence bundle remains the previously known adult-substance-states
  bundle; and
- `proposals/psychsim/` still contains only its contract README, so no immutable snapshot-bound
  diagnosis-coverage, medication-identity, or formulary-selection mapping is ready for import.

No diagnosis, medication, formulary membership, measurement/observation value, generation
distribution, relationship, rule, balance, or point was imported. The broader briefs remain
valuable gap and future-owner inputs, but the next PsychSim incorporation step still requires
immutable source-local units plus a fresh target mapping and PsychSim-owned source-use and
psychiatrist review.

### Follow-up breadth checkpoint after D-311 — 2026-08-03

After completing the point-free clinical-result collection and composed-state attachment, the
canonical thread rechecked the adjunct:

- its worktree remains dirty and the insomnia/wakefulness medication-breadth supplement remains
  the sole active review item, with substance-use/withdrawal/overdose/tobacco breadth next;
- the broader diagnosis/generator and medication packets remain useful source-conditioned gap
  signals with dated reviews, but still identify themselves as preliminary, medically unreviewed
  for downstream use, and unmapped;
- the only sealed evidence bundle remains adult substance states; and
- `proposals/psychsim/` still contains only its mapping-contract README.

No immutable snapshot-bound diagnosis or formulary mapping is ready for import. D-311 therefore
used no adjunct clinical content and added no diagnosis, medication identity, formulary
membership, result value, generation distribution, relationship, rule, balance, or point.

### Follow-up breadth checkpoint after D-313 — 2026-08-03

After D-313 completed the source-independent D-200 post-composition integration, the canonical
thread rechecked the adjunct at commit `1fc0bbaf223d2912c11d16057c955011cd760c08`:

- the adjunct worktree remains dirty and still names the preliminary insomnia/wakefulness
  medication-breadth supplement as its sole active sequential review item, with
  substance-use/withdrawal/overdose/tobacco breadth planned afterward;
- cross-diagnostic medication census plus core antidepressant, antipsychotic, mood-stabilizer,
  anxiety/PTSD/OCD, insomnia, MDD phenotype, impairment, and setting packets now provide useful
  source-conditioned coverage signals and several dated Developer reviews;
- those packets remain medically unreviewed for downstream use, preliminary, and unmapped, while
  the medication audit explicitly remains an evidence inventory rather than a formulary
  selection; and
- `proposals/psychsim/` still contains only its mapping-contract README.

No immutable snapshot-bound diagnosis or formulary mapping is ready for canonical intake.
Therefore no diagnosis, medication identity, formulary membership, generation distribution,
clinical relationship, qualitative rule, balance, or point was imported. Continue to check these
briefs at diagnosis, medication, and formulary boundaries; neutral scaffolding may use only their
gap signals until a sealed source-local unit and fresh PsychSim mapping pass the full handoff
contract.

### Follow-up breadth checkpoint after D-319 — 2026-08-03

After closing the detached height/weight/BMI path through the existing universal measurement
result route, the canonical thread rechecked the adjunct at
`1fc0bbaf223d2912c11d16057c955011cd760c08`:

- the adjunct worktree remains materially dirty, so that commit is an observation coordinate and
  not a reproducible mapping base;
- its playable-breadth, medication-breadth, and generator-readiness audits now identify the
  diagnosis, formulary, medication-dossier, and reusable patient-state gaps more concretely;
- preliminary packets now cover MDD phenotype and impairment, care-setting mix, antidepressants,
  antipsychotics, mood stabilizers, anxiety/panic/OCD/PTSD agents, insomnia/wakefulness agents,
  and a cross-diagnostic medication census, with several dated Developer reviews;
- those packets remain explicitly preliminary, medically unreviewed for downstream use, and
  unmapped. The insomnia/wakefulness packet remains the sole active sequential review item, with
  substance-use/withdrawal/overdose/tobacco breadth planned next;
- the only sealed evidence bundle remains
  `adjunct-evidence-bundle.adult-substance-states.v1.json`; and
- `proposals/psychsim/` still contains only its contract README, so there is no immutable,
  current-snapshot-bound diagnosis-coverage or formulary-selection proposal.

The breadth audits are therefore useful for dependency order, missing-bin discovery, and later
deduplication, but not for canonical clinical intake. No diagnosis, medication identity,
formulary membership, source-derived distribution, relationship, rule, balance, or point was
imported. The next PsychSim work may close source-independent typed generator seams; any clinical
mapping still requires sealed source-local units, a fresh target mapping, source-use validation,
and PsychSim-owned psychiatrist review.

### Follow-up breadth checkpoint after D-321 — 2026-08-03

The exact-template clinical-result ownership seam did not create a clinical intake boundary, so
the canonical thread performed another read-only status check rather than importing preliminary
material. The adjunct remains at committed observation coordinate
`1fc0bbaf223d2912c11d16057c955011cd760c08` with the same materially dirty worktree. No file has
appeared under `proposals/psychsim/` beyond its README, and the only sealed bundle remains adult
substance states.

The broader diagnosis/generator and medication-breadth packets are still valuable gap inventories,
but they remain preliminary, medically unreviewed for downstream use, and unmapped. The
medication census explicitly does not decide a PsychSim formulary. D-320/D-321 therefore imported
no diagnosis, medication identity, formulary membership, result profile, distribution,
relationship, rule, balance, or point. Recheck when the reviewer emits either a committed
immutable source-local bundle or a separate mapping pinned to a current PsychSim snapshot.

The canonical thread rechecked after D-322 on 2026-08-03 because the user confirmed broader
diagnosis and formulary briefs are still being prepared. The adjunct remains at
`1fc0bbaf223d2912c11d16057c955011cd760c08` with a materially dirty worktree;
`proposals/psychsim/` still contains only its README. The active insomnia/wakefulness breadth
packet and queued substance-use/withdrawal/overdose/tobacco breadth work remain preliminary, and
the diagnosis and medication breadth materials still expose evidence gaps rather than an
immutable source-local bundle plus current-snapshot mapping. D-322 therefore imported no
diagnosis, medication identity, formulary membership, recipe/profile, distribution, relationship,
rule, balance, or point.

### Follow-up breadth checkpoint after D-324 — 2026-08-03

The recipe-resource coverage boundary prompted another read-only adjunct check. Its committed
observation coordinate is still `1fc0bbaf223d2912c11d16057c955011cd760c08`, and its worktree is
materially dirty. It now contains substantially broader preliminary packets for MDD episode
phenotypes, reusable fatigue/appetite/weight/psychomotor/impairment foundations, a
cross-diagnostic medication census, core antidepressants, antipsychotics, mood stabilizers,
anxiety/panic/OCD/PTSD agents, and insomnia/wakefulness agents. Several packets also retain dated
Developer reviews.

Those files still identify themselves as preliminary, medically unreviewed for downstream use,
and unmapped. The medication breadth audit is an evidence inventory rather than a PsychSim
formulary choice, the insomnia/wakefulness supplement remains the active sequential review item,
and substance-use/withdrawal/overdose/tobacco breadth is queued next.
`proposals/psychsim/` still contains only its contract README. No immutable current-snapshot
diagnosis or formulary mapping is therefore ready for import. D-324 used only source-independent
resource shapes and imported no identity, membership, profile, distribution, relationship,
clinical rule, balance, or point.

### Follow-up breadth checkpoint after D-328 — 2026-08-03

The complete result-enabled post-composition chain prompted the planned diagnosis/formulary
boundary check. The adjunct remains at committed observation coordinate
`1fc0bbaf223d2912c11d16057c955011cd760c08` with a materially dirty worktree, so its current files
cannot supply a reproducible PsychSim mapping base. The breadth horizon now records reviewed but
still preliminary foundations for MDD phenotype and impairment, care-setting mix, reusable
fatigue/appetite/weight/psychomotor state, antidepressants, antipsychotics, mood stabilizers,
anxiety/panic/OCD/PTSD agents, and the cross-diagnostic medication census. The
insomnia/wakefulness supplement remains the active sequential review item.

The adjunct's own medication audit continues to distinguish an evidence-identity inventory from
a PsychSim formulary decision. Its only sealed evidence bundle remains adult substance states,
and `proposals/psychsim/` still contains only the mapping-contract README. No completed broader
diagnosis-coverage brief or formulary-selection brief is yet available as an immutable
source-local bundle plus current-snapshot mapping.

No diagnosis identity, playable diagnosis, medication identity, formulary membership,
generation distribution, relationship, qualitative rule, balance, or point was imported at this
checkpoint. Continue to check for the in-progress broader briefs at diagnosis and formulary
boundaries. Until they satisfy the handoff contract, they may inform dependency order and
missing-bin audits only.

### Follow-up diagnosis/formulary checkpoint after D-331 — 2026-08-03

After the exact result-enabled atomic-fill gate, the canonical thread performed the user's
requested read-only check. The adjunct's committed coordinate remains
`1fc0bbaf223d2912c11d16057c955011cd760c08`, its worktree remains materially dirty, and
`proposals/psychsim/` still contains only the mapping-contract README. Its new playable-breadth
and medication-breadth audits explicitly identify themselves as operational inventories with no
sealed evidence artifact or PsychSim mapping; their observed PsychSim coordinates are stale,
dirty snapshots rather than reproducible mapping bases.

The broader packet set is useful for ordering work: it inventories 50 shared findings, nine
selectable diagnosis identities, 53 normalized medication identities, sparse reusable diagnosis
rules outside MDD, and a large identity-to-runtime/formulary gap. It also records multiple dated
Developer reviews. However, the packets remain preliminary for downstream use, and the medication
inventory explicitly does not choose formulary membership. The adjunct still names
insomnia/wakefulness as its active sequential review and substance/withdrawal/overdose/tobacco
medication breadth as the next pass; only the adult-substance evidence bundle is sealed.

No diagnosis, medication, formulary membership, generation distribution, profile, relationship,
clinical rule, balance, or point was imported. These audits may guide the next dependency owner,
but clinical incorporation still requires a committed immutable source-local bundle and a
separate mapping pinned to the current PsychSim snapshot, followed by PsychSim source-use and
psychiatrist review.

The canonical thread checked again after D-332 on 2026-08-03 in response to the user's reminder
that broader diagnosis and formulary briefs are actively being prepared. The adjunct remains at
committed coordinate `1fc0bbaf223d2912c11d16057c955011cd760c08` with a materially dirty
worktree. Its active item is still the preliminary insomnia/wakefulness medication-breadth packet,
followed by substance-use/withdrawal/overdose/tobacco medication breadth. The reviewed
cross-diagnostic medication census, antidepressant, antipsychotic, mood-stabilizer,
anxiety/PTSD/OCD, diagnosis-family, setting, and generator-readiness packets remain useful
coverage signals, but they explicitly remain medically unreviewed for downstream use, preliminary
or unmapped, and do not choose formulary membership. `proposals/psychsim/` still contains only its
contract README, and adult substance states remain the only sealed evidence bundle. D-332
therefore imported no adjunct diagnosis, medication, formulary membership, generation
distribution, relationship, rule, balance, or point. Recheck these in-progress briefs at the next
diagnosis or formulary boundary rather than silently treating breadth as approval.

The canonical thread repeated the read-only check after D-333. The adjunct commit coordinate,
dirty-worktree caveat, active insomnia/wakefulness packet, queued
substance-use/withdrawal/overdose/tobacco breadth pass, sealed-bundle inventory, and empty
snapshot-mapping directory are unchanged. The in-progress diagnosis and formulary briefs remain
useful only for coverage signals and missing-bin discovery. No diagnosis, medication, formulary
membership, distribution, relationship, rule, balance, or point was imported.

### Follow-up diagnosis/formulary checkpoint after D-359 — 2026-08-04

After completing the generated categorical-observation frozen-patient proof, the canonical thread
rechecked the adjunct. Its committed coordinate remains
`1fc0bbaf223d2912c11d16057c955011cd760c08`, and its worktree remains materially dirty. The
insomnia/wakefulness breadth packet now has a dated Developer review, and a new preliminary
substance-use/withdrawal/overdose/tobacco medication-breadth packet is present. The broader
diagnosis/generator and medication inventories remain explicitly preliminary, medically
unreviewed for downstream use, and unmapped.

`proposals/psychsim/` still contains only its contract README. No immutable current-snapshot
diagnosis-coverage, medication-identity, or formulary-selection mapping is ready for canonical
intake. The packet set may continue to guide missing-bin and dependency audits, but D-359 imported
no diagnosis, medication, formulary membership, generation profile, distribution, relationship,
clinical rule, balance, or point.

The adjunct may interleave one especially high-leverage evidence gap discovered during
concept-first scouting when it is likely to unlock several owners or prevent foundational rework.
That autonomy does not permit it to skip a bootstrap blocker indefinitely, create a canonical
PsychSim request, or silently replace this order. Return an unmapped evidence-horizon proposal
when a useful gap has no current PsychSim ID; PsychSim will decide whether to register it.

## Packet contract

For one request at a time, return:

1. the exact `SourceRequest` ID, linked ticket IDs, and target IDs;
2. the PsychSim commit used for mapping, or `unmapped` when working concept-first;
3. search date, databases/sites searched, complete reproducible queries, and screening rules;
4. candidate sources, including contrary or qualifying results and corrections/supersession;
5. source role, directness, population, setting, jurisdiction, access, and reuse limitations;
6. concise source-local findings useful for emulation—observed structure, distributions,
   relationships, conditional patterns, and uncertainty—not proposed rules or judgments;
7. exact locators and stable bibliographic identifiers;
8. explicit `not_found`, inaccessible-full-text, and unresolved fields rather than inference;
9. a versioned packet hash and medically unreviewed status; and
10. a separate snapshot-bound PsychSim mapping so general research can be retained even if the
    target repository changes.

Large guidelines may contribute many source-local units. Do not collapse one source into one vague
claim, reproduce restricted text, or reconstruct protected diagnostic wording. Abstract-only
material must retain its citation and be labeled abstract-only.

## PsychSim translation after handoff

An adjunct bundle is deliberately shaped for evidence collection, not for direct game import.
The canonical PsychSim thread must translate it rather than copying its prose:

1. validate the packet hash, committed-base mapping, exact target versions, source identity,
   corrections, access, and source-use decision;
2. retain each concrete source-local takeaway separately, including population, setting,
   comparator, outcome, direction, uncertainty, null/contrary finding, and exact locator;
3. route every takeaway to the smallest existing owner—formal-source unit, finding, measurement,
   diagnosis dimension, medication/intervention, test, relationship, decision policy, or
   unresolved candidate bin—without dropping cross-topic observations;
4. create a candidate bin and merge-review ticket when no safe owner exists; never invent an alias
   or silently place the material under the nearest label;
5. distinguish descriptive emulation inputs (ranges, distributions, conditional patterns,
   co-occurrence, source/report behavior) from qualitative clinical judgment;
6. ask the psychiatrist only for the smallest remaining interpretation. After acceptance, author
   one atomic qualitative rule with typed trigger/scope/exception/consequence/provenance;
7. assign any provisional point band only after that qualitative review, as a separate balance
   record; and
8. activate nothing until exact target validation, source-use review, deterministic replay, and
   the applicable content/runtime gates pass.

Preliminary packets stop before steps 6–8. Their useful output is structural: a likely owner,
missing identity, dependency, field distinction, review question, or source-registration task.
PsychSim may implement that neutral scaffolding while the packet evolves, provided the scaffold
contains no source-derived outcome distribution, clinical direction, scoring semantics, or
numeric tuning.

The adjunct must not pre-compress a rich source into a game winner, rule, or point value.
PsychSim's translation should be parsimonious in executable rules but loss-preserving in the
authoring database: a useful finding about another medication, diagnosis, symptom, or test is
routed to that owner even when it is not needed for the current ticket.

## Read-only inventory checkpoint — 2026-08-05

Use `pnpm content:adjunct:status` for each evidence/catalog boundary instead of reconstructing the
sibling state from conversation history. The 2026-08-05 observation found:

- adjunct HEAD `1fc0bbaf223d2912c11d16057c955011cd760c08` on `main`, with 80 changed paths;
- coordination revision 1;
- active packet
  `adjunct-packet.cognition-dementia-behavior-and-adverse-effect-treatment-breadth.preliminary-v1.2026-08-05`;
- last reviewed packet
  `adjunct-packet.substance-use-withdrawal-overdose-tobacco-medication-breadth.preliminary-v1.2026-08-05`;
- 60 packet directories, 19 with Developer review, 14 legacy handoff bundles, one immutable
  evidence bundle, and zero snapshot-bound PsychSim mapping proposals; and
- complete inventory fingerprint
  `628a37af01c30547bf24387a594e87c1d482737f9b70ea7abdf16d545acd6148`.

The medication queue now contains reviewed preliminary packets for core antidepressants,
antipsychotics, mood stabilizers/anticonvulsants, anxiety/PTSD/OCD treatments,
insomnia/wakefulness, cross-diagnostic medication breadth, regimen operations/combinations, and
substance-use/withdrawal/overdose/tobacco treatment, plus the active cognition/adverse-effect
packet. These are high-value coverage and source-gap inputs, but the zero-mapping result means none
can directly author a PsychSim indication, class, formulation, formulary, relationship, rule,
probability, balance, or point.

D-382 used those packet memberships only as discovery signals for neutral missing ingredient
bins. Every resulting record was independently verified as an exact active RxNorm ingredient
against the official NLM API. The next medication evidence work should:

1. define a point-free multi-ingredient product/formulation owner for the five known fixed
   combinations omitted from the ingredient catalog;
2. obtain immutable source-local units and a fresh PsychSim mapping before assigning class,
   indication, interaction, comparative-fit, or regimen-operation meaning;
3. deduplicate packet observations against the 125 canonical ingredient IDs; and
4. keep clinical selection/formulary decisions in focused review packets rather than treating
   breadth as approval.

## Handoff back to PsychSim

PsychSim validates the base commit, IDs, source identity, corrections, source-use permissions,
packet hash, and target freshness. The psychiatrist then reviews the proposed interpretation.
Only after that review may PsychSim author a target-specific contribution, Developer opinion,
dimension profile, qualitative rule, or provisional balance. The adjunct never performs those
steps.
