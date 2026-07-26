# WHO mhGAP 2023 source map

## Source identity and boundary

The first broad authoring source is the World Health Organization’s 2023 third edition of the
[Mental Health Gap Action Programme guideline](https://www.who.int/publications/i/item/9789240084278).
PsychSim catalogs it as `evidence.who.mhgap-mns.2023`. The verified local PDF has SHA-256
`90f1220536d6323b8d8493090a567be137ef042bc76bffc7fd391ba47cbd005b` and was extracted under the
protected authoring boundary as `source-document.90f1220536d6323b8d84`.

The publication is a broad baseline for non-specialist care across varied resource settings. It is
not automatically the final psychiatric-specialist authority, a diagnostic manual, or an answer
key. Recommendation strength, certainty, intended population, availability assumptions, and
implementation context must survive claim extraction. Formal cataloging verifies bibliographic
identity; it does not confer medical approval.

Raw PDF text, extracted chunks, and source manifests stay gitignored and out of the browser bundle.
Tracked content contains only bibliographic metadata, concise original summaries, stable
provenance IDs, and review records.

## Module queue

The source contains modules for alcohol use disorders, anxiety, child and adolescent mental
disorders, stress-related conditions, dementia, depression, drug use disorders, epilepsy and
seizures, overarching care, psychosis and bipolar disorder, and self-harm/suicide. Those headings
are a candidate authoring queue, not permission to generate all related diagnoses or patients at
once.

Process one module and one recommendation group at a time:

1. map the recommendation and its context to exact chunks;
2. identify candidate diagnosis, medication, test, therapy, decision-policy, and patient-template
   targets;
3. record conflicts and missing standards;
4. create medically unreviewed tickets and, only where an existing template is semantically
   suitable, a Developer patient scaffold;
5. obtain clinician instructions;
6. implement accepted changes as versioned owner-local files and re-run impact validation.

## First slice: depression DEP1–DEP4

| Recommendation | Local chunks | Candidate use                                                                                                                    | Current disposition                                                   |
| -------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| DEP1           | `.87`, `.88` | Broad antidepressant baseline plus selection/safety context for moderate-to-severe depression                                    | Unreviewed, point-excluded synthesis packet; no rule activated        |
| DEP2           | `.88`, `.89` | A future continuation/remission/adherence/adverse-effect best-next-step patient                                                  | Unreviewed snapshot-design packet; no longitudinal mechanics added    |
| DEP3           | `.90`, `.91` | Discrete psychotherapy catalog entries and a broad structured-therapy family                                                     | Unreviewed catalog-mapping packet; no therapy or scoring rule changed |
| DEP4           | `.91`, `.92` | Medication, psychotherapy, and combined-treatment route logic conditioned on availability, preferences, and benefit/harm balance | Unreviewed conflict packet; no pathway changed                        |

The first source-backed Developer patient is `case.review.who-mhgap-mdd-initial`. It is a
deterministic, medically unreviewed scaffold derived from the existing mechanics template. It
retains short varied chief complaints and exact source provenance, but its executable facts and
rubric are inherited—not inferred from WHO—and therefore have a blocking inheritance audit. It is
useful for reviewing the game loop and candidate rule applications; it is not evidence that the
current receipt is clinically correct.

The existing MDD diagnosis-family file now carries one context-only, medically unreviewed formal
source note for DEP1–DEP4. That note explicitly says the source does not define PsychSim’s
diagnostic criteria or operational severity thresholds. No base, severity, specifier, treatment, or
point rule references the note.

Each DEP recommendation now also has exactly one tracked `LiteratureSynthesisProposal` attached to
its existing Developer ticket. These are concise original adaptations of the source-cleared WHO
material, retain the non-specialist and certainty limitations, and are explicitly medically
unreviewed and point-excluded. DEP4 keeps its tension with CANMAT visible instead of averaging the
sources into a false consensus. DEP2 describes only a possible future continue-versus-stop
snapshot; it does not authorize virtual time, follow-up intervals, or monitoring simulation.

The DEP1/DEP3/DEP4 source-use records identify proposed shared impact targets in the review ticket.
Apart from the diagnosis file’s context-only provenance note, they do not mutate diagnosis
guidance, medication files, the therapy catalog, or patient scoring. DEP2 does not yet have a
playable patient because an initial-treatment template is not a safe substitute for a continuation
encounter.

## Known evidence gaps

The depression module uses a moderate-to-severe population but does not operationalize PsychSim’s
diagnostic criteria or mild/moderate/severe generator thresholds. The existing MDD severity source
request therefore remains open and now records WHO as relevant context that does not close the gap.
Patient generation must not infer the missing threshold.

Other questions likely to require narrower or newer sources include:

- specialist first-line options beyond the WHO resource-sensitive list;
- continuation duration by recurrence history and other risk factors;
- antidepressant tapering and withdrawal decision rules;
- treatment availability and patient-preference representation;
- psychotherapy modality definitions and delivery constraints;
- suicide-risk facts mapped to disposition.

These are hypotheses for review, not conclusions. The user can mark an exact receipt row or rule as
`Needs another guideline/source`. That flag creates a local `source_gap` ticket. Codex must first
check already-cataloged evidence, then create or update a structured source request if the gap is
real.

## Review sequence

In Developer mode:

1. open the WHO mhGAP patient slot;
2. play it as a normal encounter and inspect the itemized rule trace;
3. use `Flag this rule` or an item’s `Flag` control for a clinical concern;
4. choose `Needs another guideline/source` when the problem is insufficient evidence rather than a
   known correction;
5. return to the clinic and write instructions in the ticket’s `What should Codex do?` field;
6. save the queue to the workspace or export it, then tell Codex the review is ready.

No user-facing ticket status selection is required. The reviewer supplies clinical intent in plain
language; internal lifecycle fields remain an audit detail.
