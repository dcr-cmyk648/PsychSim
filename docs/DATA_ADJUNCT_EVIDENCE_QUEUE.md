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

## Handoff back to PsychSim

PsychSim validates the base commit, IDs, source identity, corrections, source-use permissions,
packet hash, and target freshness. The psychiatrist then reviews the proposed interpretation.
Only after that review may PsychSim author a target-specific contribution, Developer opinion,
dimension profile, qualitative rule, or provisional balance. The adjunct never performs those
steps.
