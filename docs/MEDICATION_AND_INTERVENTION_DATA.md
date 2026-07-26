# Medication and intervention knowledge architecture

## Purpose

PsychSim needs enough structured psychopharmacology and psychotherapy background to draft rich,
auditable patients without requiring the psychiatrist/developer to write a monograph for every
intervention. It must still preserve the distinction between:

- a normalized identity or regulatory fact;
- a claim made by one source in one population and setting;
- a psychiatrist/developer interpretation;
- an executable gameplay rule; and
- the point magnitude used to balance the game.

Those are separate records. Importing more data may reduce clerical work, but it never approves a
clinical rule or determines a point value automatically.

This document is an authoring and data-contract checkpoint. It does not activate a medication
recommendation, change a patient, or add a runtime AI dependency. All source-use conclusions are
engineering risk controls rather than legal advice. The exact source, edition, licence, terms, and
territory must still receive a machine-validated `SourceUseDecision` before its content is
processed.

## Product boundary

The database should support a question-bank-style decision:

> Given the information available now, what is the best next intervention and disposition?

It should not attempt to reproduce a complete commercial drug reference, dosing handbook,
psychotherapy manual, longitudinal treatment planner, or interaction checker. The player generally
does not enter doses, schedules, titrations, monitoring intervals, or a complete care plan.

The useful depth is therefore selective:

- broad treatment-family eligibility carries most of the care points;
- contraindications, dangerous combinations, and other critical safety rules can preempt fit;
- patient-specific fit, prior trials, adverse effects, organ function, metabolism, preferences, and
  feasibility can contribute several independently traceable smaller modifiers;
- only facts relevant to the focused encounter decision are compiled into its rubric; and
- the receipt can show every applied rule and its provenance without presenting the background
  database to the player before submission.

## Current gap

The current medication files contain a label, free-text classes and tags, executable fit
modifiers, and protected author overrides. The current treatment catalog contains flat menu
entries for CBT, IPT, supportive psychotherapy, DBT, behavioral activation, and other
interventions. That is enough to exercise the prototype, but not enough to distinguish:

- ingredient from salt, formulation, or marketed product;
- a regulatory class from a gameplay treatment class;
- a label statement from comparative evidence or expert opinion;
- an adverse-effect signal from a quantified patient-fit rule;
- a generic therapy family from a faithful manualized program; or
- a source finding from the point value later assigned to it.

Official and comparative data must not be poured directly into the current `classes`, `tags`, or
`fitModifiers` fields. The current records remain the compatibility/runtime layer.

The first identity-only slice is now implemented separately. Thirty-three curated
`MedicationIdentityDefinition` files carry normalized ingredient names, explicit aliases, RxCUIs,
the pinned July 6, 2026 RxNorm CPC release, source/use-decision IDs, and unreviewed status.
Thirteen link the existing same-ID runtime records; twenty are browseable authoring identities
with no gameplay class, formulary membership, treatment availability, rule, or point effect.
Validation locks that separation. Classification memberships, regulatory facts, evidence claims,
Developer opinions, and compilation into additional runtime treatments remain future work.

## Five separate knowledge layers

### 1. Identity and classification

This layer answers “what intervention is this?” without making a clinical recommendation.

For a medication it can contain:

- the stable PsychSim medication ID;
- normalized generic name and carefully selected aliases;
- ingredient and precise-ingredient RxCUIs;
- UNIIs and active-moiety/salt relationships;
- formulation variants only when they matter to gameplay, such as immediate-release versus
  extended-release or oral versus long-acting injectable;
- brand/product relationships for authoring search, not player-facing endorsement;
- separately sourced regulatory, mechanism, and game-treatment class memberships; and
- source release, acquisition date, obsolete/remap state, and exact provenance.

PsychSim IDs remain primary. External identifiers can change, merge, or become obsolete.

For a psychotherapy or other intervention it can contain:

- one stable intervention ID;
- generic family versus named/manualized program;
- neutral short description;
- delivery modes, such as individual, group, family, or guided digital;
- minimum capability and practitioner/fidelity requirements;
- neutral focus tags; and
- separately reviewed variants where setting or delivery changes the intervention materially.

Identity records carry no points and do not imply that an intervention is effective for a
particular patient.

### 2. Product and regulatory facts

This layer records what a particular regulator or current label says. Ingredient-level and
product/formulation-level scope must remain explicit.

Candidate medication fields include:

- NDA, ANDA, or BLA application and product identifiers;
- jurisdiction, approval and marketing status;
- route, dosage form, and strength where relevant;
- Structured Product Label Set ID, document/revision ID, version, and effective date;
- labeled indications and limitations of use;
- boxed warnings, contraindications, warnings and precautions;
- adverse reactions and labeled interactions;
- population, pregnancy/lactation, renal, and hepatic sections;
- REMS status;
- FDA pharmacologic-class, mechanism, physiologic-effect, CYP/transporter, and pharmacogenomic
  relationships; and
- source snapshot hash and currentness state.

Regulatory language must be preserved as a source category. For example, `contraindicated`,
`avoid`, `not recommended`, and `monitor` are not interchangeable. PsychSim's eventual safety
severity or game consequence is a separate reviewed interpretation.

A product label does not establish first-line status, comparative superiority, a common off-label
use, or the correct point value. Absence from a label is not evidence that a risk or use is absent.

### 3. Structured evidence claims

Each reusable clinical proposition receives a stable claim ID rather than being buried in prose or
copied into several medications.

A future claim record should be able to answer:

- What is the claim type: indication, treatment role, contraindication, warning, interaction,
  adverse effect, monitoring need, metabolic role, discontinuation concern, population issue,
  comparative effectiveness, comparative acceptability, or feasibility?
- Which ingredient, formulation, class, therapy, diagnosis, population, setting, severity, and
  treatment line does it cover?
- Is it a direct comparison, indirect network comparison, guideline recommendation, regulatory
  statement, systematic-review conclusion, clinician-authored derivation, or evidence gap?
- What outcome, comparator, time horizon, estimate, uncertainty, evidence certainty, and important
  limitations apply?
- Which exact source version and source location support it?
- Was the text extracted locally, drafted with permitted AI assistance, or authored manually?
- Is it current, corrected, superseded, disputed, or awaiting review?
- Has a psychiatrist reviewed the transformation into this concise original statement?

Claims do not contain care-point values. Conflicting claims coexist and retain their context.
Neither file order nor a source count selects a winner.

### Evidence hierarchy is claim-specific, not one global pyramid

PsychSim uses tiered attribution, but it must not assign one permanent authority rank to an entire
source. Evidence design is only one dimension, and the best design depends on the question. A
current systematic review of applicable randomized trials is usually the best anchor for average
treatment efficacy; it is not automatically the best source for a rare delayed harm, a
pharmacokinetic interaction, a current regulatory warning, or patients systematically excluded
from those trials.

The authoring model follows four compatible ideas:

- [GRADE](https://book.gradepro.org/guideline/overview-of-the-grade-approach) evaluates certainty
  for a defined body of evidence and outcome, not the prestige of one article. Risk of bias,
  inconsistency, indirectness, imprecision, and publication bias remain separate.
- [Oxford CEBM](https://www.cebm.ox.ac.uk/files/levels-of-evidence/cebm-levels-of-evidence-2-1.pdf)
  selects evidence designs by question type. Treatment benefit, harm, diagnosis, and prognosis do
  not share one universal ordering.
- [Cochrane](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-07)
  assesses bias at the result level and keeps bias, imprecision, and applicability distinct.
- [AHRQ](https://effectivehealthcare.ahrq.gov/products/methods-guidance-applicability/methods)
  treats narrow eligibility, excluded comorbidities, setting, and baseline risk as explicit
  applicability concerns rather than hiding them in one quality score.

The future claim layer should therefore separate:

- `EvidenceClaim`: the proposition and exact population, exclusions, intervention, comparator,
  outcome, time horizon, setting, and question type;
- `EvidenceContribution`: one source's relationship to that claim, its source role, study design,
  question-design fit, result-specific risk of bias, directness/applicability, publication and
  search-through dates, correction/supersession state, upstream sources, and concise contribution;
  and
- `EvidenceBody`: the reviewed resolution across compatible contributions, any source-supplied or
  explicitly performed formal certainty assessment, retained conflicts, applicability gap, and
  review rationale.

Useful source roles include `primary_study`, `evidence_synthesis`, `guideline`, `regulatory`,
`aggregator`, and `developer_opinion`. These describe provenance; they do not themselves activate
a rule.

| Question                                           | Usual evidence anchor                                                                                                    |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Average treatment efficacy                         | Current, applicable systematic review/meta-analysis of suitable trials, then suitable primary trials                     |
| Comparative efficacy                               | Direct head-to-head synthesis/trial; network evidence with indirectness made explicit                                    |
| Common short-term harms                            | Trial synthesis plus adequately powered observational surveillance                                                       |
| Rare, delayed, or special-population harms         | Large cohorts, registries, case-control evidence, or suitable synthesis; spontaneous reports remain signals              |
| Patients excluded from efficacy trials             | Direct pragmatic, cohort, or subgroup evidence; otherwise an explicit applicability gap                                  |
| Pharmacokinetics and drug interactions             | Controlled human PK/interaction evidence and current regulatory material; mechanism/in-vitro evidence remains supporting |
| Current regulatory status, warning, or label claim | Current record from the relevant regulator, scoped only to the regulatory proposition                                    |
| Guideline recommendation                           | Current applicable guideline, stored as a recommendation with jurisdiction, values, feasibility, and certainty context   |
| Broad discovery/background                         | A versioned aggregate such as DrugCentral, retained as a seed and never promoted silently to primary support             |

Resolution is deterministic only where the comparison is unambiguous:

1. Retain historically but deactivate retracted, invalidated, source-use-prohibited, or explicitly
   superseded contributions.
2. Compare only contributions addressing compatible questions, populations, outcomes, time
   horizons, and settings. A population difference is usually a scope difference, not a vote.
3. Apply corrections and source-version supersession before comparing the evidence.
4. Prefer a verified direct source over an aggregator for the exact fact, while retaining the
   aggregate record as discovery provenance.
5. A current, applicable, adequately appraised synthesis may anchor a body of evidence. A newer
   primary study beyond its search date creates `update_required`; publication date alone does not
   automatically reverse the synthesis.
6. Prefer one contribution only when it is no worse in design fit, bias/certainty, directness, and
   currency and better in at least one. Otherwise retain both.
7. Nondominated clinically meaningful disagreement becomes `contested` and creates a review
   ticket. File order, source count, and a hidden numeric authority score never choose the winner.
8. Developer opinion may bridge an evidence or applicability gap, but it never inherits a cited
   source's certainty. The resulting rule remains visibly “source plus Developer opinion.”
9. Evidence resolution can propose a clinical rule but never assigns care points.

This preserves the user-visible “why” behind a medication decision. For example, an efficacy
synthesis can support a broad antidepressant role while a direct interaction study, a real-world
harm study, a patient-specific fact, and a dated psychiatrist interpretation each remain separate
traceable inputs.

### 4. Developer opinions

A psychiatrist/developer may add a concise original interpretation such as:

> Bupropion may be usable in selected patients with a well-controlled seizure disorder, but it is
> almost never the preferred initial option in that setting.

That remains a separately labeled `Developer opinion`. A later paper can be attached as partial
support without converting the interpretive part into a direct publication claim. Restricted
commercial references may be consulted privately by a lawful subscriber, but their text is not
stored, pasted into prompts, or treated as reusable formal support unless the relevant terms or
written permission allow the intended transformation.

### User-authored residency archive

The user's long aggregate of previously authored residency-site articles is a high-value starting
map of psychiatrist judgment, but it is not one evidence source and must not become one giant
opinion. The physical export is one private, hashed `SourceDocument`; each original article is a
separate logical authored unit, and each reusable judgment becomes a short atomic
`DeveloperOpinion` candidate.

Each logical article unit should preserve:

- original title, byline, URL/venue, publication date, revision date, and location inside the
  aggregate;
- exact private document/chunk provenance and nested section path;
- asserted authorship separately from verified copyright/reuse ownership;
- a currentness state such as `needs_currentness_review`, `current`, `superseded`, or `retired`;
- target medication, therapy, diagnosis, test, patient-tag, or rule IDs;
- short independently worded opinion candidates;
- embedded citations as unverified bibliographic candidates; and
- any third-party quotation, figure, table, instrument, or other material that must be excluded.

The initial rights posture is private local storage and deterministic extraction only after the
user confirms that the export has no identifiable patient information and is appropriate to
process. Personal authorship does not by itself prove ownership of the residency website's exact
expression. Article prose is not redistributed. Accepted concise judgments retain their original
“as of” date and Developer-opinion authority. Embedded references become formal evidence only
after independent bibliographic, source-use, and claim-support verification.

The implemented first pilot operationalizes only a narrow slice of this design: initial MDD
antidepressant selection and its allowlisted diagnosis/medication targets. Deterministic
title/plaintext matching queues source revisions; it does not infer a medication claim. Complete
segment review can produce private authored-unit, atomic opinion, and bibliographic candidates.
The local dossier shows candidates beside existing runtime fit modifiers so differences are
auditable, but it cannot edit those modifiers or assign points. No pilot candidate enters a
medication file, evidence catalog, rule, or runtime bundle until separately verified, adjudicated,
versioned, and validated.

When new evidence touches the same targets, the impact system resurfaces the opinion for one of:
`supported`, `partially_supported`, `contextualized`, `challenged`, `limited`, or
`still_expert_bridge`. A source relationship never erases the opinion's interpretive delta.
Review proceeds one article or small topic cluster at a time so the archive does not create
hundreds of undifferentiated tickets.

### 5. Executable game rules and balance

Only reviewed rules in this layer affect a player:

- broad treatment eligibility;
- treatment-family role and cardinality;
- contraindication or high-risk choice;
- pharmacokinetic and pharmacodynamic interaction;
- duplicate or shotgun treatment;
- treatment-specific prerequisite;
- patient-specific positive or negative fit;
- required stop/continue behavior; and
- point magnitude, caps, and deduplication.

Every rule links to the evidence claims and Developer opinions that informed it. The rule records
the game-specific transformation; the balance profile records the point magnitude. A source
update creates an impact ticket rather than silently rewriting the rule.

This separation lets the receipt say, for example:

- broad first-line treatment family: +300;
- medication-specific fatigue/weight fit: +35;
- patient preference fit: +15;
- interaction penalty: −80; and
- database inference rather than authored patient-path match.

A contraindicated treatment cannot collect positive fit bonuses. High-risk but potentially
defensible choices can retain graded penalties when the reviewed rule explicitly distinguishes
them from absolute contraindications.

### Historical fit-first authoring seed

J. Michael Bostwick's 2010 Mayo Clinic Proceedings review, “A Generalist's Guide to Treating
Patients With Depression With an Emphasis on Using Side Effects to Tailor Antidepressant
Therapy,” is now a verified metadata record
(`evidence.bostwick.mdd-antidepressant-fit.2010`). The remembered date was approximately 2008, but
the article was published in 2010 and reports a literature search ending in 2009.

Its abstract is useful for nominating sleep, sexual function, weight, and adherence/tolerability
as candidate antidepressant-fit dimensions. It does not supply PsychSim's exact medication
directions or point values. PMCID PMC2878258 is freely readable but the official PMC Open Access
API reports that it is not in the Open Access subset; no reusable licence was identified.
Accordingly, PsychSim stores verified bibliography and independently worded abstract-level
discovery context only. Detailed medication claims require a current, legally processable source
and separate psychiatrist review.

## File ownership and the “one medication file” editing experience

The user should still be able to inspect one medication or therapy at a time. That does not require
duplicating every shared rule into that file.

The target authoring layout is:

```text
content/catalogs/medications/
    definitions/              one stable ingredient/intervention edit surface per medication
    classes/                  reusable regulatory, mechanism, and game-treatment classes
    formulations/             only clinically/gameplay-distinct variants
    rules/                    reviewed medication/class rules that can compile to runtime

content/catalogs/interventions/
    therapies/                one file per therapy or other reusable intervention
    classes/                  shared modality/fidelity/delivery definitions
    rules/                    reviewed intervention and combination rules

content/catalogs/evidence/
    formal/                   source bibliography and access policy
    claims/                   concise source-scoped clinical propositions
    opinions/                 separate Developer opinions

content/generated/
    medication-audits/        disposable compiled “everything known about this medication” views
    intervention-audits/      disposable compiled therapy/intervention views
```

The generated audit view resolves direct claims, class claims, source relationships, opinions,
rules, and impacted patients into one readable dossier. It is not an independent source of truth
and must be reproducible from tracked records. This preserves the desired one-file/one-page review
workflow while keeping shared information normalized.

## Medication granularity

PsychSim should begin at ingredient level. It should not import every NDC, package, strength, and
marketed product into the runtime.

Create a separate formulation or product entity only when one of these is true:

- the formulation changes an important safety or interaction rule;
- it changes the best-next-step decision;
- it is a distinct treatment program, such as an LAI;
- the case explicitly asks about formulation or route; or
- the formulary needs to distinguish availability.

Patient current medications remain regimen-entry instances, so two entries for the same ingredient
can be addressed independently. Prior trials remain structured records with adequacy, adherence,
response, tolerability, and source. Neither a medication definition nor an evidence claim replaces
those patient-specific records.

## Psychotherapy and other interventions

Therapies should become one-file-per-intervention catalogs just like medications. The initial
useful distinction is:

- **CBT:** a broad structured CBT model, with delivery variants only where reviewed;
- **behavioral activation:** a separate intervention/family, not merely a CBT synonym;
- **IPT:** a distinct structured interpersonal therapy requiring therapy-specific competence;
- **non-directive/supportive therapy:** a lower-specificity supportive option, not a synonym for
  CBT, IPT, or DBT; and
- **DBT:** a manualized program whose full label should require the modeled package and
  capabilities; a smaller offering should use a separate label such as `DBT-informed skills`.

VA/DoD and WHO are strong initial sources for the availability and relative role of several
depression psychotherapies. NICE can be useful for human review and delivery distinctions, but its
current international and AI-reuse terms require a separate decision or permission. SAMHSA can
support selected implementation contexts. Exact therapy manuals, worksheets, session scripts,
fidelity checklists, and training materials are not copied.

The current flat runtime treatment entries are prototypes. In particular, the existing DBT menu
label does not by itself claim that the clinic is delivering a complete, fidelity-concordant DBT
program.

## Lawful source stack

### Bulk factual scaffold

These sources can eliminate substantial clerical work after exact source-use review:

| Source                                                                                                                                                                                             | Best use                                                                                   | Important boundary                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [RxNorm Current Prescribable Content](https://www.nlm.nih.gov/research/umls/rxnorm/docs/prescribe.html)                                                                                            | Normalized medication names, RxCUIs, ingredients, dose forms, strengths, and relationships | Use the public-domain Current Prescribable Content subset, not unfiltered proprietary source vocabularies; it is not a clinical recommendation or interaction database. |
| [FDA GSRS/UNII](https://www.fda.gov/industry/fda-data-standards-advisory-board/fdas-global-substance-registration-system)                                                                          | Substance, salt, and active-moiety identity                                                | A UNII does not imply approval.                                                                                                                                         |
| [Drugs@FDA data files](https://www.fda.gov/drugs/drug-approvals-and-databases/drugsfda-data-files)                                                                                                 | U.S. approval/application/product status and approved-label anchors                        | Linked applicant documents and third-party material need separate review.                                                                                               |
| [DailyMed services](https://dailymed.nlm.nih.gov/dailymed/app-support-web-services.cfm) and [openFDA labels](https://open.fda.gov/apis/drug/label/)                                                | Versioned structured label sections and identifiers                                        | Company-submitted labeling is not automatically the latest FDA-approved label; do not copy label prose/tables wholesale or assume every embedded item is public domain. |
| [FDA pharmacologic classes](https://www.fda.gov/industry/structured-product-labeling-resources/pharmacologic-class) and [RxClass](https://lhncbc.nlm.nih.gov/RxNav/applications/RxClassIntro.html) | EPC, mechanism, physiologic-effect, pharmacokinetic, and selected VA/MED-RT relationships  | Preserve relation source/version. Do not ingest SNOMED CT or WHO ATC merely because RxClass exposes them. An EPC is not automatically a PsychSim treatment class.       |
| [FDA CYP/transporter examples](https://www.fda.gov/drugs/drug-interactions-labeling/healthcare-professionals-fdas-examples-drugs-interact-cyp-enzymes-and-transporter-systems)                     | Reviewed substrate/inhibitor/inducer role candidates                                       | Explicitly nonexhaustive; roles do not generate a complete pairwise interaction rule by themselves.                                                                     |
| FDA safety communications, safety-labeling changes, REMS, and pharmacogenomic tables                                                                                                               | Versioned safety overlays and source-update tickets                                        | They produce draft claims and impact reports, never silent scoring changes.                                                                                             |
| NLM LiverTox and LactMed                                                                                                                                                                           | Specialist hepatotoxicity and lactation claim candidates                                   | Record per-record version/revision and the exact reuse terms; neither becomes a universal game rule automatically.                                                      |

`DrugCentral` is accepted as a versioned, broad, low-authority authoring seed under CC BY-SA 4.0.
The current public full dump is dated November 2023 and aggregates literature, labels, regulatory
sources, and external databases. Every imported record remains medically unreviewed and preserves
the DrugCentral release plus available upstream identifiers. A verified direct source supersedes
DrugCentral as support for the exact fact without deleting the discovery history.

The initial `SourceUseDecision` permits local storage, deterministic extraction/indexing, and
original derived claim candidates. It deliberately blocks AI-assisted processing, runtime
redistribution, and commercial distribution until an isolated attribution/ShareAlike data package
and upstream-rights review are implemented. No dump bytes have been downloaded. The database
cannot set first-line status, clinical authority, executable rules, or care points.

### Comparative effectiveness and board-relevant evidence

Comparative sources supplement regulatory facts:

- [Cipriani et al. 2018](https://pubmed.ncbi.nlm.nih.gov/29477251/) and the
  [versioned CC BY 4.0 re-analysis dataset](https://data.mendeley.com/datasets/83rthbp8ys/2)
  are high-value starting evidence for acute adult MDD antidepressant monotherapy.
- AHRQ comparative-effectiveness reports can often support original structured summaries when the
  exact report's public-domain notice and embedded third-party material are checked.
- NIMH pages for STAR\*D, CATIE, STEP-BD, TADS, and TORDIA can provide government-authored
  high-level context; each underlying article still needs its own licence decision.
- ClinicalTrials.gov can supply NCT identity, registered interventions, comparators, outcomes,
  submitted results, version history, and retrieval date. A registry entry is not proof of
  efficacy or study quality.
- PubMed supplies bibliographic metadata; abstracts are not assumed reusable. PMC full text is
  processed only when the article-specific licence permits the intended adaptation and AI use.
- Cochrane is assessed review by review. A “Cochrane” label is not a blanket open licence, and its
  current website/data terms do not grant unrestricted scraping or generative-AI processing.

Cipriani's network meta-analysis should not become a universal antidepressant ranking. Its scope
is acute adult MDD monotherapy, primarily short trials, population-average response, and all-cause
discontinuation; it does not settle long-term outcomes, individual comorbidity fit, previous-trial
adequacy, contraindications, or sequencing. STAR\*D supports a narrow model of prior nonresponse and
sequenced options, but participant choice, attrition, and selected later-step cohorts prevent a
simple deterministic ranking of every switch and augmentation.

A future landmark-study record can preserve:

- stable study and trial-registry IDs;
- the narrow board-relevant question;
- design, population, setting, interventions, and comparators;
- outcome and time horizon;
- effect estimate and uncertainty where permitted;
- direct limitations;
- a concise reviewed teaching point; and
- the exact medication, diagnosis, prior-trial, or decision-policy records it may inform.

The teaching point is not itself an executable point rule.

### Guidelines

Guidelines determine treatment roles more directly than labels or nomenclature databases. Each
guideline still keeps its jurisdiction, population, setting, publication version, correction
relationships, recommendation strength/certainty, source-use decision, and medical review.

Useful initial lanes include current VA/DoD, WHO, CANMAT, BAP, ASAM, SAMHSA, and other
source-cleared condition-specific guidance. Their exact terms control; inclusion in this list is
not automatic permission or medical approval.

### Proprietary references

Carlat, UpToDate, and Stahl can be useful clinical reading but are not interchangeable with
ingestable source data:

- [Carlat's subscription agreement](https://www.thecarlatreport.com/policy/subscription) prohibits
  derivative works and AI/automated processing without written consent. It permits only narrowly
  limited unchanged educational excerpts under its stated conditions.
- [UpToDate's terms](https://www.wolterskluwer.com/en/solutions/uptodate/policies-legal/terms-of-use)
  expressly prohibit extraction, transformations, correlations, tables, algorithms, models,
  text/data mining, and AI processing without permission.
- Cambridge permits noncommercial text/data mining of lawfully accessed
  [Cambridge Core content](https://www.cambridge.org/core/services/open-research-policies/text-and-data-mining)
  under stated conditions, but that is not blanket permission for every Stahl edition, purchased
  print/e-book product, AI workflow, persistent database, or future commercial use. The exact
  edition and access channel need verification; bulk access should be discussed with Cambridge.

Default treatment: bibliographic metadata plus private human consultation only. Do not upload
these sources to PsychSim's source inbox or an AI provider. If the psychiatrist uses them to
formulate an independent judgment, record the concise judgment as Developer opinion unless a
separately reusable source supports the formal claim. Written permission could create a narrower
future lane.

### Therapy manuals and branded programs

The existence, broad purpose, and research question associated with a therapy are different from
its protected manual text and training materials. PsychSim can store original neutral metadata
and source-backed applicability claims; it does not copy worksheets, scripts, diagrams, skills
curricula, or fidelity tools. A branded or manualized name is used only when the modeled service
meaningfully matches it.

## What automated imports must never infer

An importer must not infer:

- first-line, second-line, preferred, “board favorite,” or patient-best status from FDA approval;
- common off-label use from label silence, RxNorm, NDC, or Orange Book data;
- comparative efficacy or tolerability from separate product labels;
- comparable adverse-effect incidence across labels with different trials and populations;
- causation, incidence, or comparative risk from FAERS report counts;
- a complete interaction, its severity, or required action from one CYP role;
- that a regulatory class, chemical class, mechanism class, and gameplay treatment class are the
  same thing;
- that every labeled contraindication maps to an absolute game prohibition;
- that absence of a claim means a negative finding;
- points, caps, treatment-path membership, or the focused workup horizon;
- psychotherapy fidelity from a menu label; or
- source authority or current standard of care from public availability alone.

## Update and review workflow

A future deterministic medication/intervention authoring pipeline should:

1. curate a psychiatric ingredient and intervention allowlist;
2. import source-cleared identity and regulatory records into local authoring storage;
3. pin source releases, exact snapshots, hashes, and acquisition times;
4. generate concise structured claim candidates from permitted content only;
5. label every candidate medically unreviewed;
6. compare new snapshots with prior versions;
7. create impact tickets for added, changed, removed, corrected, or superseded claims;
8. let the psychiatrist accept, narrow, reject, defer, or add a separate Developer opinion;
9. compile reviewed claims and opinions into versioned runtime rules;
10. assign and balance care points separately;
11. run affected patient/reference policies and deterministic replay tests; and
12. produce a per-medication or per-therapy audit dossier for final review.

The update job never edits a runtime rule directly. A revised label, new guideline, or new review
can reopen an older Developer opinion and ask whether the source supports, narrows, contradicts, or
does not address it.

Likely later developer commands, not implemented in this checkpoint:

```text
pnpm content:medications:sync:rxnorm
pnpm content:medications:sync:fda
pnpm content:medications:diff
pnpm content:medications:audit medication.bupropion
pnpm content:interventions:audit intervention.psychotherapy.cbt
```

Raw downloads, extracted label text, and comparative datasets remain local authoring artifacts and
outside the production bundle unless an exact reviewed runtime use is separately permitted.

## Minimum implementation sequence

To avoid building a comprehensive drug-reference product before proving the game:

1. Define the identity, claim, classification-membership, and Developer-opinion schemas.
2. Migrate the ten current medication files without changing their clinical behavior.
3. Extend the manually verified 33-ingredient RxNorm CPC identity checkpoint into a
   source-cleared, versioned refresh/import tool for only the curated psychiatric ingredient list.
4. Add one FDA/label pipeline for one medication and verify product/formulation scoping,
   source-update diffs, rights gates, and audit output.
5. Add Cipriani 2018 as one comparative-evidence fixture for adult acute MDD, without converting
   rankings into points.
6. Split CBT, behavioral activation, IPT, and non-directive supportive therapy into individual
   intervention files with neutral metadata. Do not claim full DBT until program requirements are
   modeled.
7. Compile one existing MDD patient from the new records and compare its trace with current
   behavior.
8. Only after the review workflow is legible, expand the medication and intervention allowlists.

## One-at-a-time decision queue

The decisions should be presented and resolved in this order because each affects the next:

1. **DrugCentral boundary — resolved:** use its CC BY-SA database as a versioned authoring seed
   behind an authoring-only ShareAlike/provenance gate. Do not import bytes until the isolated
   importer boundary exists.
2. **Initial medication scope — resolved:** begin with a curated, board-relevant psychiatry
   ingredient allowlist. Do not import every U.S. psychiatric-labeled product. The first proposed
   identities live in `ticket.catalog.medications.psychiatry-allowlist`; inclusion there is an
   authoring-review candidate, not a formulary choice or clinical recommendation.
3. **Formulation depth:** define the minimum rules for when IR/SR/XL, LAI, transdermal, sublingual,
   intranasal, and combination products become separate game interventions.
4. **Adverse-effect representation:** choose the smallest qualitative severity/frequency model
   that preserves useful fit without pretending cross-label incidence is comparable.
5. **Interaction representation:** choose the initial shared-mechanism families and the threshold
   for a specific pair rule.
6. **Psychotherapy fidelity:** decide which menu items represent a generic family, a referral, a
   protocol-based therapy, or a full program.
7. **Update cadence:** decide which source changes require immediate tickets versus a scheduled
   authoring review.

Only the next unresolved decision—formulation depth—should be presented to the user at the next
workshop step.
