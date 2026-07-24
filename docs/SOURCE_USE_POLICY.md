# Source-use, licensing, and fair-use policy

## Purpose

PsychSim should use as much reliable clinical source material as the law and each source's terms
clearly permit, while avoiding a copied or lightly paraphrased substitute for a protected manual.
This is an engineering risk-control policy, not legal advice. Public release, international
distribution, monetization, or institutional deployment must trigger an intellectual-property
review appropriate to that use.

Clinical validity and reuse permission are independent gates. A source can be lawful to reuse but
clinically unsuitable, or clinically authoritative but restricted to metadata and human
consultation. Neither bibliographic verification nor a source-use decision medically approves a
rule.

Evidence authority is also claim-specific. A systematic review can be the best anchor for average
efficacy while an applicable cohort is more informative for a rare harm, a controlled human study
is more direct for a pharmacokinetic interaction, and a regulator is authoritative only for the
current regulatory proposition. PsychSim records design, directness/applicability, bias/certainty,
currency, and source role separately; it does not turn a conventional evidence pyramid into one
global numeric source rank. The resolution contract is in
[MEDICATION_AND_INTERVENTION_DATA.md](MEDICATION_AND_INTERVENTION_DATA.md).

## Recorded source layers

Every formal source has:

- one `EvidenceSourceDefinition` under `content/catalogs/evidence/formal/`;
- an access policy recording full-text, reuse, AI-assisted processing, and local-extraction status;
- a separate `SourceUseDecision` when material will be ingested, transformed, redistributed, or
  deliberately held metadata-only;
- exact source/version URLs and known hashes where bytes were obtained;
- rule-level contributions and medical review before any derived clinical behavior becomes
  executable.

`content/catalogs/evidence/source-use-decisions.json` is the machine-validated decision log. It
records the legal basis, territories, permitted uses, attribution, required notices,
NonCommercial/ShareAlike obligations, third-party handling, reviewer role, and review date.
`pnpm content:evidence` prints every formal source beside its effective decision; `pnpm
content:validate` rejects missing or duplicate decisions, contradictory permissions, and formal
contributions whose extraction, AI, derivative, or runtime use exceeds the recorded decision.

## Reuse lanes

### 1. U.S. public-domain government text and data

Government-authored material may be copied and transformed in the United States unless an item is
marked otherwise. A `.gov` host is not enough: contractor, grantee, instrument, image, publisher,
or other third-party content can retain copyright. Reuse therefore excludes images and credited
third-party elements unless an item-level decision says otherwise. Attribution and
non-endorsement notices remain required project policy even when copyright does not require them.

Current examples:

- NIMH topic text can supply attributed presentation and symptom scaffolds for common disorders.
- VA/DoD, DoD, SAMHSA, NIAAA, and AHRQ material may be used item by item after authorship and
  embedded-rights review.

### 2. Open licences that permit adaptation

The exact licence controls the derived material. Attribution, change notices, scope, commercial
restrictions, ShareAlike, and non-endorsement requirements are stored as data and carried into
generated outputs.

The 2024 WHO _Clinical descriptions and diagnostic requirements for ICD-11 mental, behavioural
and neurodevelopmental disorders_ has conflicting surface metadata. Its landing page links a
generic CC BY-NC-SA 3.0 IGO deed, but page iv of the official PDF labels the specific work
[CC BY-NC-ND 3.0 IGO](https://creativecommons.org/licenses/by-nc-nd/3.0/igo/) and expressly says
adaptations, including translations, require WHO permission. The source-specific notice controls:
PsychSim keeps CDDR metadata only and does not extract or convert its text into rules without
written permission.

The ICD-11 API/digital classification is separately licensed CC BY-ND 3.0 IGO. Exact identifiers
may be used under its terms, but its content likewise may not be transformed into PsychSim rules
without permission. WHO requires an ICD-11 identifier display to preserve the code, title, and URI.
If PsychSim later adds that exact-identifier layer, it needs a separate URI-bearing schema and
source-use decision; the ICD-10-CM importer must not be reused for it.

CDC/NCHS publishes ICD-10-CM as the official WHO-authorized U.S. clinical modification. CDC states
that WHO owns ICD-10, while WHO's ICD-10 licensing FAQ directs users of the U.S. modification to
NCHS for licensing. The Creative Commons terms published for ICD-11 do not automatically cover
ICD-10-CM. PsychSim therefore does not claim an open licence for the imported code-title data.

### 3. No-derivatives sources

No-derivatives material may be stored or redistributed only as its licence permits and must remain
unaltered. It cannot be converted into executable criteria, crosswalks, summaries, or game rules.
PsychSim-authored data must be visibly separate.

### 4. Permission-required or prohibited sources

These remain bibliographic metadata and links only. The source text is not downloaded into the
authoring inbox, extracted, pasted into prompts, embedded, summarized by an AI system, or copied
into runtime content.

DSM-5-TR is currently in this lane. APA's terms require permission for reuse and prohibit putting
APA content into generative-AI or machine-learning systems without written authorization. A
clinician may privately consult a lawfully accessed copy to cross-check independently sourced
content. The resulting judgment is recorded as Developer opinion unless a reusable formal source
also supports it. PsychSim does not claim DSM endorsement or exact DSM-5-TR concordance.

### 5. Developer opinion

A psychiatrist/developer can supply a concise original judgment. It remains separately labeled
Developer opinion even when a publication later provides partial support. It does not acquire a
fabricated citation, and it receives rule-level review like any other clinical contribution.

A user-authored teaching article or note is normally a dated Developer-opinion source, not a
formal clinical study. Its embedded bibliography supplies candidate citations only. Each cited
source must be independently verified, rights-cleared, and checked against the exact claim before
it can become a formal contribution. A relationship can support, partially support, contextualize,
challenge, or limit an opinion without converting the opinion's interpretive remainder into a
publication claim.

## Fair-use policy

Fair use is a case-specific U.S. defense, not a blanket educational licence. Noncommercial study
helps one factor but does not automatically authorize systematic copying, especially when the
result could substitute for the source. PsychSim therefore does not use fair use as the default
basis for source ingestion and does not use it to build a comprehensive substitute for a manual.

Any proposed fair-use exception must have its own `SourceUseDecision` with
`legalBasis: "fair_use"` and a non-null `FairUseAssessment` that records:

1. the precise excerpt and intended use;
2. purpose and character, including transformation and access controls;
3. the nature of the source work;
4. the amount and qualitative substantiality used;
5. likely market or licensing impact;
6. a reviewer, timestamp, and conclusion.

The schema rejects a fair-use decision without all four factors. The current assessments are
deliberately narrow:

- a private, noncommercial U.S. authoring/search cache of the official ICD-10-CM F01–F99 codes and
  titles; and
- one existing, independently worded citalopram safety proposition used in a fictional case,
  without retaining, extracting, quoting, or redistributing label text.

The ICD-10-CM cache is the only current fair-use-based source ingestion. It is gitignored, excluded
from runtime and exports, never processed with AI, and contains no coding notes or diagnostic
requirements. The FDA-label assessment covers only the single recorded proposition and does not
authorize systematic label ingestion. Broader repository distribution, public deployment,
commercial use, or transformation requires permission or a new legal review.
When the conclusion is uncertain, the action is to seek permission or legal review, not to ingest
first.

## Diagnostic-source strategy

The standardized background is deliberately layered:

1. **Classification index:** a gitignored local CDC/NCHS ICD-10-CM F01-F99 cache provides 1,112
   current U.S. mental/behavioral/neurodevelopmental codes, titles, billable/category state, and
   code-prefix navigation under the recorded narrow fair-use assessment.
2. **Diagnostic requirements:** no single comprehensive manual is currently cleared for
   transformation. WHO ICD-11 CDDR and DSM-5-TR remain metadata-only pending permission, so
   diagnosis modules must use independently reusable disorder-specific sources plus narrow
   Developer-opinion deltas.
3. **Common-condition corroboration:** public-domain NIMH, SAMHSA, NIAAA, VA, and other verified
   federal sources reduce the amount of Developer-authored material.
4. **Treatment and safety:** VA/DoD and other treatment guidelines remain distinct from diagnostic
   standards.
5. **Narrow deltas:** unresolved DSM-5-TR-specific or jurisdiction-specific differences become
   source-gap tickets or concise Developer opinions.

An ICD code or title never supplies diagnostic criteria, severity, treatment, or medical approval.
Playable diagnosis-family files may carry compact reviewed mappings to a classification release,
but the 1,112-term background catalog is excluded from the browser bundle.

## Source intake checklist

Before any source text is downloaded or parsed:

1. Identify the exact edition, publication date, URL, territory, and copyright owner.
2. Read the source-specific licence and terms; do not infer rights from public readability.
3. Distinguish government-authored material from contractors, instruments, figures, tables, and
   credited third parties.
4. Record local-storage, extraction, AI-assisted processing, adaptation, redistribution, and
   commercial-use permissions separately.
5. Record attribution, change notice, ShareAlike, non-endorsement, and other required notices.
6. Hash the exact bytes and preserve the release relationship.
7. Keep restricted material metadata-only.
8. Create original, concise structured content; never reproduce long passages.
9. Attach source use at rule level and obtain medical review.
10. Recheck the rights decision when distribution, monetization, source terms, or source version
    changes.

Question banks and other educational products are not source material. Some visibly license exact
DSM content; others publish original case questions without disclosing their private legal
arrangements. Their existence does not grant PsychSim permission to copy either DSM or the
question bank.

## Medication and psychotherapy sources

Medication knowledge uses a layered source strategy rather than trying to find one legally
unrestricted replacement for a commercial drug handbook:

1. Source-cleared RxNorm Current Prescribable Content, FDA/GSRS identifiers, Drugs@FDA, and
   carefully scoped DailyMed/openFDA records can populate identity and regulatory-fact candidates.
2. FDA safety communications, labeling changes, REMS, CYP/transporter examples, pharmacogenomic
   tables, and NLM specialist records can create versioned safety claim candidates.
3. Source-cleared guidelines, systematic reviews, comparative studies, and landmark-trial records
   can support condition-, population-, and outcome-scoped clinical claims.
4. Developer opinion supplies the remaining interpretive delta and remains separately labeled.
5. Only independently reviewed rules compiled from those records can affect gameplay or points.

DrugCentral is accepted as a broad `structured_database` authoring seed under CC BY-SA 4.0. The
source record pins the public 2023-11-01 dump version even though no bytes have yet been
downloaded. Its initial source-use decision permits local deterministic extraction/indexing and
original claim candidates but blocks AI-assisted processing, runtime redistribution, and
commercial distribution. This is a project-safety boundary, not a statement that the open licence
forbids every one of those uses.

DrugCentral-derived records must remain in an isolated data layer with:

- source release and acquisition hash;
- DrugCentral record/table identity and any available upstream-source IDs;
- the exact field-level transformation;
- attribution, change notice, and CC BY-SA obligations;
- item-level third-party review;
- an `aggregator` source role and medically unreviewed state; and
- replacement or qualification by verified direct sources without deleting the discovery trail.

No DrugCentral record becomes an executable rule, first-line recommendation, interaction severity,
or point value merely because it appears in the database. A separate reviewed packaging decision
is required before any DrugCentral-derived contribution can enter the browser runtime.

An automated import never infers first-line status, comparative superiority, off-label usefulness,
interaction severity, psychotherapy fidelity, patient-fit direction, or point magnitude from a
nomenclature record or regulatory label. Ingredient, formulation/product, source claim, Developer
opinion, executable rule, and balance value remain distinct.

Commercial clinical references are not source-document inbox material by default. Carlat's
current subscription agreement prohibits derivative works and AI/automated processing without
permission. UpToDate's current terms expressly prohibit extraction, transformations, structured
derivatives, text/data mining, and AI processing without permission. Cambridge Core currently
permits specified noncommercial text/data mining for lawfully accessed content, but that does not
automatically cover every Stahl edition, access channel, AI use, persistent database, or
commercial distribution. Exact product and edition terms control.

Cochrane is assessed review by review; neither the brand nor public readability creates a blanket
text-mining or AI licence. PubMed supplies metadata rather than blanket rights to abstracts, and
PMC articles are processed only under their item-specific licences. AHRQ government works can be
valuable, but each report is checked for its public-domain notice and embedded third-party
material. ClinicalTrials.gov is a provenance and trial-record source, not an efficacy authority.

Psychotherapy manuals, worksheets, scripts, fidelity instruments, and branded training materials
are not copied. PsychSim may store original neutral intervention metadata and reviewed
source-scoped claims while preserving the boundary between a broad therapy family, a referral,
protocol-based delivery, and a complete manualized program.

## Private user-authored article archives

A long export containing many articles is handled as one private physical `SourceDocument` and
many logical authored units. The local source record preserves each article's original title,
author/byline, URL or venue, original and revised dates, heading path, and exact private chunks.
Short atomic Developer-opinion candidates are derived from those units; the aggregate document is
never treated as one mega-source or one global opinion.

The initial policy is conservative:

- asserted authorship is recorded separately from verified copyright ownership;
- no identifiable patient information may be present;
- local storage and extraction require an explicit user acknowledgment;
- exact article prose, third-party quotations, tables, figures, instruments, and screenshots never
  enter runtime;
- external AI processing remains separately opt-in and requires confirmed rights;
- article citations are unverified bibliographic candidates until checked independently; and
- only reviewed, concise, independently worded Developer opinions can become tracked content.

This permits the user's older teaching material to seed the database without presenting it as
current formal evidence. New sources can resurface every overlapping opinion for currentness and
support review.

The full proposed data model, source map, and staged implementation are in
`docs/MEDICATION_AND_INTERVENTION_DATA.md`.
