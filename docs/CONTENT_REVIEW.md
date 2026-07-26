# Content review and disagreement workflow

## Milestone 1 capture and ticket queue

The receipt exposes a local flag control for the whole encounter, each receipt item, and each rule trace. A ContentFlag records stable ID, case/blueprint/content version, seed, engine version, attempt ID, disputed item, category, clinical-review requirement, note, open status, and timestamp. The associated CompletedAttempt preserves the resolved CaseInstance, clinic snapshot, event/action history, submitted combination, point report, and exact rule trace. Flags and attempts persist together in IndexedDB.

Categories cover the whole encounter, information result, workup objective, treatment grade,
interaction rule, penalty, rationale, missing acceptable alternative, need for another
guideline/source, narrative ambiguity, and UI/engine bug. A source-gap flag creates a local ticket
whose next step is to check existing evidence and then create or update a tracked `SourceRequest`;
it never authorizes the engine or Codex to invent the missing rule. Capturing a flag does not modify
or re-score the historical attempt.

On the local development server, every receipt row also has “Add guidance.” Guidance creates a proposed `ClinicalReviewTicket` with the exact row snapshot, patient/content version, requested ticket type, whether clinical acumen is required, target IDs, dependency/conflict slots, proposed routing, optional resurfacing trigger, and timestamps. A clinically marked flag also creates a ticket. Developer mode shows the local queue and gives every existing or newly created ticket one editable “What should Codex do?” field. Lifecycle status remains internal because the prior user-facing status menu contained overlapping choices.

At the end of a Developer or portable Reviewer patient, a separate “Case and app experience notes”
box accepts clinical/scoring observations as well as subjective pacing, clarity, mobile usability,
screen-density, and overall-app comments. Saving upserts one `DeveloperAttemptReview` for that
exact attempt. It embeds the resolved patient, seed, clinic and case versions, purchases, submitted
treatment/disposition, ordered events, point report, receipt, and rule trace. It also freezes every
option that was visible, its catalog label and section, whether the reviewer chose it, and the
displayed fulfillment tuple where applicable. Information actions preserve service, fulfillment
method, and cost; service-backed nonmedication and disposition options preserve the same fields.
Thus “I missed suicide risk assessment and was not penalized” can be checked against proof that the
action was available, unpurchased, and absent or present in the trace. The review does not require
the user to manually enumerate selections or reproduce a seed.

The receipt organizes the explanatory trace into stable domains and places point-changing rules
before zero-point supporting rules. No trace row is discarded; zero-point rows remain available in
an expandable section so a reviewer can still inspect provenance and predicate outcomes. Every
post-submit receipt also replays the declared reference solutions against the exact saved patient,
starting clinic, encounter location, and service fulfillment costs. The player and the
completed declared `database_plan` replay appear in parallel, with exact investigations,
treatments, disposition, care points, workup cost, and payout. A comparison bar normally uses the
database score as its maximum and expands to an above-plan player score while marking the database
value. Developer mode additionally exposes the current engine version and all declared policy
results. The policies are a finite audit set rather than an exhaustive search; an invalid replay
remains visible as an audit failure.

Developer mode also exposes a searchable “Opinions needing references” inventory. It derives
uncited rule-level clinical claims from current patient, medication, diagnosis, workup,
disposition, safety, and test definitions, then deduplicates copied rule IDs across owning files.
It links existing `SourceRequest` records where targets overlap and distinguishes clinical
direction requiring evidence from exact point magnitudes that remain game-balance judgment. This
inventory is a read-only audit surface, not the still-pending dedicated Developer-opinion
provenance schema and not 1:1 automatic ticket creation.

Large Developer queues use lazy disclosures. The patient queue and ticket workbench begin
collapsed. Opening the ticket workbench mounts exactly one current decision: a prose question,
proposed direction, any concise evidence/source summary, and the response field. Detailed
patient/rule audits, references, routing metadata, and source packets remain under a second
collapsed disclosure and are not mounted until requested. Saving and advancing must finish local
persistence before the next ticket replaces the current one; the next heading receives focus.
Reviewed decisions remain in a separate collapsed history and can be reopened without mounting the
whole queue. A ticket appears on a patient only when it explicitly names that patient's blueprint
ID; sharing a medication, action, or other target ID does not imply a patient link. Guidance
created from a receipt binds to that exact immutable attempt, and export validation rejects an
attempt whose blueprint differs from the ticket.

A packet may include an unreviewed `LiteratureSynthesisProposal`: a concise proposed answer,
search scope, eligible supporting sources, opposing or qualifying context, limitations, and
unresolved questions. Supporting sources must match the formal evidence catalog and a
`SourceUseDecision` that permits this authoring synthesis. Metadata-only, abstract-only,
inaccessible, or otherwise uncleared sources may provide clearly labeled context but cannot be
counted as support for the proposed direction. The psychiatrist's plain-language response remains
the decision. A proposal never sets point magnitudes, edits a rule, attaches a citation to runtime
content, or grants medical approval.

Every unresolved checked-in Developer ticket also has a `TicketLiteratureScoutCatalog`
attachment. Related tickets may share a clinically bounded profile. The Developer-side refresh
tool automatically repeats the recorded Europe PMC search, ranks clinically relevant
meta-analyses by that provider's cited-by count, stores the dated metadata/hashes, and refuses to
silently replace a selected paper. The tracked abstract summary is a short independently worded
paraphrase prepared from the abstract; raw responses and abstract text remain local and ignored.
Valid outcomes are a selected recent meta-analysis, an explicit no-suitable result, or a
different-evidence requirement. Nonclinical and umbrella tickets carry an explicit exemption
instead of an irrelevant paper.

The citation count is only a mutable retrieval tie-breaker after relevance screening, not an
evidence-quality score. A scout never changes a ticket or source-request status, claims that an
absence of a direct meta-analysis means no evidence exists, supplies point magnitude, edits a
rule, attaches a runtime citation, or grants approval. Formal application still follows the
source-use, contribution, impact, and clinical-review workflow. The scout remains local
Developer-only; D-128 keeps it out of the portable Reviewer assignment.

Local Developer mode saves either ticket instructions or an attempt review to IndexedDB first and
then atomically mirrors the complete versioned bundle to the fixed gitignored path
`content/generated/local-review-tickets/tickets.json`. A failed mirror never discards the browser
record. “Update Codex handoff file” retries the mirror. Automated browser tests write only to
`tickets.e2e.json`, never the human handoff file. Normal and Endgame receipts do not expose the
whole-case review box.

Portable Reviewer is a separate static artifact for a colleague using desktop or phone. It has no
workspace writer or local authoring queues. Its assignment-versioned IndexedDB retains patient
slots, completed attempts, flags, tickets, and multiple case notes on that one browser/device. A
completed receipt can be reopened after reload to add or edit feedback. Manual Export downloads
one version-7 JSON bundle containing build kind, assignment identity, engine version, all completed
attempts, all `DeveloperAttemptReview` option snapshots, all `DatabaseEntryReview` snapshots, all
flags, and all tickets. The reviewer
can complete several cases and email the single file to the project owner. There is no server sync
or formal bundle import yet; export before clearing browser data or moving devices. Free-text notes
must never contain real patient information or other identifiable clinical material. A material
cohort or policy revision receives a new assignment ID rather than silently sharing old run history
and exports.

Database review follows the same durable-feedback rule without exposing clinical answer keys.
Every entry opens as the complete strict public projection. Developer and portable Reviewer may
save one editable prose note; `DatabaseEntryReview` stores the exact safe entry snapshot,
category/entry IDs, catalog/projection versions, and timestamps. Player has no comment form.
Local Developer mirrors these reviews to the fixed Codex handoff bundle after IndexedDB succeeds;
portable Reviewer keeps them assignment-local until export. Saving feedback never edits the entry,
adds a clinical source, changes a score, or grants approval. The reader shows one entry at a time
within the current filtered result order. Previous/next controls save any changed comment before
navigating, focus the next entry heading, and return to the filtered Database list after the final
entry.

Assignment `reviewer-assignment.common-psychiatry.2026-07f` adds one narrow exception to the rule
that portable Reviewer has no authoring queue: it statically imports one exact ticket packet with
one patient-linked question for each of its ten allowlisted scenarios. This is an assignment
artifact, not local Developer ticket discovery. Every ticket must name one of those exact
blueprint IDs; the artifact still contains no source-request, opinion, literature-synthesis,
private-source, or arbitrary workspace queue.

Desktop and mobile use the same one-decision workbench. Only the current ticket is mounted; its
question, proposed direction, concise support/qualification summary, and response field appear
first, while exact audit material remains optional and collapsed. “Save and go to next decision”
persists the response before advancing. Responses use the assignment's existing IndexedDB and
version-7 export. They do not write to the repository, edit a patient or rule, or confer medical
approval. The owner must still supply the exported bundle to Codex.

Reaction-history review must distinguish the chart/patient label from any reviewed interpretation.
A statement recorded as an “allergy” is not automatically an immune allergy, and prior-trial
tolerability remains a separate record. Safety-planning history is the patient's Subjective report
of whether they feel able to participate. It is not a safety formulation or disposition decision;
creating or revising a plan would be a separate intervention and rule-review target.

The local handoff is deliberately simple: describe the desired outcome on tickets and/or record
playthrough observations on receipts, save, then tell Codex that the local review is ready. Codex
reads `tickets`, `attemptReviews`, `flags`, and `completedAttempts` from the fixed workspace file.
For a remote reviewer, the owner supplies the exported bundle to Codex after receiving it. Codex
uses each captured attempt to identify the concrete action, selection, receipt item, and rule trace
implicated by the prose, then infers whether the user requested implementation, preservation,
deferral, sourcing, or clarification. It asks only when a material ambiguity remains. Any
resulting content change still uses normal versioning and validation. Saving or exporting feedback
is never authorization to change a clinical rule and never grants medical approval.

Developer and portable Reviewer patient queues also begin collapsed. Completing a patient removes
that exact persisted slot from the queue. The receipt puts “Case and app experience notes” before
the long audit material and offers “Save feedback and open next patient”; it saves the immutable
attempt review first, then opens the first remaining persisted slot without rerolling or
regenerating it. On the last slot the action becomes “Save feedback and finish review queue.”
Patient-linked ticket questions on the receipt use the same single-question/save-and-next pattern
and preserve their separate ticket response instead of merging it into the whole-case note. Normal
and Endgame patient queues and receipts keep their ordinary gameplay behavior.

Read-only evidence-gap, opinion-reference, and private-knowledge inventories remain separate,
collapsed audit indexes. They do not acquire parallel feedback stores. Any item that actually
requires a reviewer decision is represented by the existing `ClinicalReviewTicket` workflow so
there is one actionable decision queue and one durable response model.

This lightweight queue adopts the useful workflow invariants from the user's book repository:

- raw observations and historical snapshots remain immutable;
- proposals never auto-mutate durable content;
- one authoritative status lives on the ticket rather than being inferred from prose;
- technical dependencies can be cleared before clinical adjudication;
- accepted, rejected, deferred, and resolved outcomes are explicit;
- deferred claims can declare when they should resurface;
- durable changes create versioned content plus validation evidence.

The current instruction editor and ticket bundle are review tools, not rubric editors. Saving prose does not claim that clinical JSON changed. The local writer can persist the queue file only; it cannot choose an arbitrary path or mutate patients, medications, tests, pathways, or scoring. Codex records the eventual internal disposition while implementing or deferring the request. Versioned rubric editing, dependency scans, and supersession links remain Milestone 5.

## Generated patient audit packages

The bounded patient scaffolder writes a review patient and a companion `*.tickets.json` file. Developer mode discovers both only on the local Vite server. Every package starts with a blocking inherited-rule audit and a high-priority source-application audit; source-free mechanics fixtures still receive the latter so the user must explicitly decide whether provenance is required. These tickets appear in the same local queue as receipt guidance and may be exported or mirrored, but resolving them does not modify the scaffold.

A scaffold can be played immediately to evaluate wording, variation, menus, and receipt behavior. It must not be promoted merely because it is executable. Clinical facts, criteria constraints, workup weights, treatment families, fit modifiers, combinations, disposition, settlement, and every reference policy remain individually reviewable.

## Source-review ticket packets

A tracked `*.tickets.json` file may decompose one formal source into proposed rule-level questions without attaching that publication to an executable rule. Developer mode loads these packets into the same local queue. The first example, `canmat-2023-mdd-source-review.tickets.json`, separates assessment/workup, severity and initial modality, broad antidepressant baseline/fit, psychotherapy, and disposition. Each ticket names exact candidate targets, source section routing, conflicts, dependencies, and resurfacing conditions. It paraphrases only the narrow candidate contribution and does not include private extracted text.

Creating or accepting a ticket is not source application. A formal `EvidenceContribution`, target rule review update, content-version change, impact scan, and affected reference policies are still required after the user adjudicates the question. This keeps “the paper exists,” “the source may support this claim,” and “this exact game rule has been clinically approved” as three separate states.

The recommended-guideline intake adds a fourth gate: “the source is lawful to process in this
workflow.” NICE, APA, ACE Singapore, and ASAM currently remain metadata-only under their published
terms. Their tickets ask for permission or scope adjudication; they do not paraphrase inaccessible
recommendations. VA/DoD, CANMAT, BAP, and WHO have local protected documents, but their rule-level
tickets remain medically unreviewed. A published correction is a separate evidence record linked
to the affected source and must be checked before downstream review continues.

## Immutable private-source review packets

Private personal material enters the same local Developer ticket queue through a narrower
`SourceReviewSnapshot`, not through tracked source-review ticket files. One preparation selects
exactly one review unit—either one complete parser-v5 `sectionInstance` or one fully classified
personal-knowledge source revision—and writes two mode-`0600`, gitignored records:

- a browser-safe decision packet containing a short original paraphrase, up to eight atomic
  proposals, public catalog targets or explicit unresolved labels, uncertainty, conflicts,
  currentness, rights/boundary state, and the exact ticket routing shown to the reviewer. A
  classified personal-knowledge revision projects every candidate opinion one-to-one; it neither
  merges nor silently drops candidates;
- a discriminated private locator containing either parser artifact/chunk identities, hashes, and
  warnings or the exact queue revision, semantic run, audit entry, source-unit candidate, opinion
  candidate, bibliography-candidate, and fingerprint relationships needed to reproduce and audit
  the packet.

The public packet never contains raw source text, headings, filenames, provider IDs, filesystem
paths, document IDs, or chunk IDs. Its hash covers every displayed and routing field. The separate
source-unit fingerprint covers the exact parser artifact and chunk locators. Re-preparing the same
packet is idempotent; a different packet for the same fingerprint is rejected until an explicit
supersession workflow exists.

Developer mode presents this as one concise decision at a time in the existing responsive focused
reader on the local loopback device. The layout can be tested at phone widths, but private packets
are not available to a separate physical phone or the portable Reviewer. Saving prose updates
IndexedDB and the ordinary local Codex handoff bundle while preserving the exact original
snapshot. It does not modify a source unit, create a claim, accept an opinion, attach evidence,
edit a rule, change points, or grant medical approval.

The personal-knowledge branch may use `private_processing_only` only for local
`developer_opinion` or `no_change` proposals. The user's bounded local-processing authorization is
not a formal `SourceUseDecision`, does not make a bibliography candidate evidence, and does not
authorize portable review, redistribution, or runtime use. The safe projection reports only the
number of nearby unverified bibliography leads; their private identifiers and citation details
remain in the locator-side workspace.

If the safe feed or private locator later fails validation, an already saved packet remains visible
only as historical context and becomes read-only. It is omitted from new handoff/export bundles
until private validation recovers; unrelated profile and review data remain usable.
Canonical Codex later interprets the response and prepares the smallest separate versioned
proposal. Any accepted implementation must still pass its normal source-use, provenance, review,
impact, reference-run, and release gates.

The first generated packet is intentionally a metadata-only quarantine decision for the private
residency-article aggregate. It records that one Word heading-boundary warning remains unresolved
and asks whether semantic work should remain paused. The next packet demonstrates the classified
personal-knowledge branch: one acknowledged Apple Notes revision projects its seven concise,
medically unreviewed Developer-opinion candidates for reviewer disposition while retaining exact
private hashes and relationships outside the browser-safe packet. Neither packet creates evidence,
clinical content, rules, points, or runtime behavior. Portable Reviewer rejects
`SourceReviewSnapshot` records; this queue remains local Developer-only.

## Exact rule audit and source-needed queue

Developer tickets with a patient blueprint now embed a read-only audit derived from the same parsed case and catalog objects used by the engine. The reviewer does not need to run or solve the patient to see current values. A targeted ticket shows matching rules first; a case-wide scaffold ticket shows the complete audit. The audit includes:

- each relevant investigation objective, obtained reward, omission penalty, current fulfillment method/cost, treatment-specific modifier, and rule-level provenance;
- every treatment-grade predicate and base point value;
- active medication fit modifiers and whether the current patient tags trigger them;
- accepted treatment pathways, required workup, conditional safety requirements, and path par;
- each additional point/safety/disposition rule, both true and false values, safety errors, and care-point caps;
- an explicit cannot-miss list, complete selectable treatment menu, database-plan comparison values, and reference policies.

This is a deterministic inspector, not a second scoring implementation. It reads declarative case content, uses the shared predicate and service catalogs for labels/costs, and never changes a patient or rule. Unlinked rules display as Expert opinion/no formal contribution rather than borrowing a nearby citation. Existing locally reviewed tickets are refreshed from their checked-in definition so newly added exact target IDs appear without replacing reviewer instructions or resolution history.

Clinical questions that need another article or authoritative source live in the tracked, developer-only `source-needed.requests.json` queue. Each versioned request owns one exact question, why it matters, target content IDs, linked ticket IDs, acceptable formal source types, acceptance criteria, the `PsychSim documents` destination, existing evidence that did not close the gap, and later document/chunk/source-use provenance. Its small internal state (`needs_source`, `source_received`, or `resolved`) describes whether evidence has actually arrived; it is not another reviewer dropdown. A resolved request requires linked evidence plus a resolution note. `pnpm content:validate` rejects duplicate IDs, missing tickets, invalid targets, and unknown evidence links.

The initial queue records the unresolved ECG-monitoring threshold, continue-versus-switch logic, TSH workup indications, structured MDD severity thresholds, and suicide-risk/disposition mapping. These records do not change the provisional executable values. The user can place suitable material in the Drive folder and ask Codex to check it; source ingestion and rule adjudication remain separate steps.

## Historical fidelity

Never replay old feedback against an unversioned current case. The review tool must open the saved case snapshot and engine/content versions first. It may separately load the current blueprint and show a structured comparison. Resolved variants are stored, so replay does not regenerate a new fictional patient.

If migration is required, preserve the original bytes/record and write a new schema version; never silently overwrite clinical history. Deprecated content remains accessible to review tooling even when excluded from new play.

## Planned Milestone 5 queue

The local review queue will filter by status, category, case version, rule, and recency. A reviewer can:

1. Open the exact historical patient, action order, ledger, combination, receipt, and trace.
2. Compare historical and current content.
3. Replay with the historical engine where available or clearly label a current-engine simulation.
4. Edit a draft rubric or accepted alternative outside the production bundle.
5. Re-run validators and all reference policies.
6. Re-score the old attempt as a non-destructive comparison.
7. Mark the flag accepted, rejected, or addressed with reviewer notes.
8. Re-import a versioned JSON review bundle and compare it with the local queue. Export is already available.

Changing a rubric creates a new content version. It does not mutate the original receipt. An “addressed” flag links to the replacement version and validation evidence.

## Approval requirements

Prototype and generated cases begin medically unreviewed. Approval is rule-level: workup objectives, treatment grades, conditional requirements, pathways, score rules, medication modifiers/tag sets, and test profiles/components each carry a review record. An approved rule requires explicit reviewer identity and review time. A future case release gate additionally checks content version/hash, validation and reference-run results, alternatives, contraindications, explanations, and provenance. A generator, critic, validator, or product engineer cannot grant clinical approval by itself.

Before content is eligible for ordinary Player release or any distribution that implies clinical
approval, tests must cover the database plan, at least one defensible alternative, shotgun, unsafe
treatment, each safety cap, treatment-specific prerequisites, eligibility at every compatible
location, critical invariance across seeds, and bundle isolation. A bounded portable Reviewer
artifact may distribute explicitly unreviewed content only through its exact assignment allowlist
and prominent disclaimer. Reviewers should be able to dispute individual rules without accepting
the rest of a case.

## New-study impact workflow

A newly discovered article is reviewed one at a time. Extraction first creates source/chunk provenance and concise candidate claims; it does not edit medications or patients. Each accepted claim becomes a proposed change with target stable IDs, prior behavior, proposed behavior, author/evidence status, and an automatically computed impact set from registry dependencies, medication/patient tags, pathway references, and overrides.

Before a formal publication can be cited, its bibliographic record must exist in `content/catalogs/evidence/formal/`. Bibliographic verification checks identity and citation metadata only. Each proposed application separately records the target rules and how the source contributed. If a note or judgment has no formal record, reviewers classify it as Expert opinion instead of attaching a nearby or guessed citation. `pnpm content:evidence` exposes formal sources with no linked use, every linked contribution, explicit expert notes, and the count of uncited rules that therefore display as Expert opinion.

Changes to shared medication knowledge create impact tickets for every dependent patient; they do
not propagate automatically. Patient-specific exceptions stay in that patient's file instead of
weakening a global rule. Apple Notes material enters only through the acknowledged private intake
workflow. Personal takeaways remain Developer-opinion candidates; article screenshots, OCR text,
and embedded citations remain rights-unverified or bibliographically unverified candidates until
independently cataloged and reviewed. None propagates automatically into rules, patients, points,
or citations.

Evidence comparison first partitions by question, population, intervention, comparator, outcome,
time horizon, and setting. It may prefer a contribution only when corrections/supersession and
question-specific design fit, bias/certainty, directness/applicability, and currency make it
unambiguously dominant. Otherwise conflicting guideline, review, trial, aggregate, or author-note
claims remain linked and `contested`; the user accepts, narrows, rejects, defers, or supersedes
them. A newer publication or higher nominal source tier alone never resolves the ticket. Accepted
changes create new content versions; old attempts retain their historical snapshots. Rejection
records the rationale so the same source claim is not repeatedly re-proposed without new evidence.

A multi-article personal archive is reviewed one logical article or small topic cluster at a time.
The review shows the original date/currentness, proposed atomic Developer opinions, target IDs,
citation candidates and their verification status, and newer evidence that may support, limit, or
challenge the opinion. The user can preserve historical context, update the concise judgment,
retain it as an expert bridge, or reject it. The exact private article prose never becomes the
review ticket or runtime content.

## Private personal-knowledge workbench

Local Developer mode has a collapsed, searchable, read-only dossier projection for the bounded
personal-knowledge pilot. It shows queue/segment coverage, mapped and unresolved targets,
authored-unit candidates, atomic Developer-opinion candidates, bibliographic candidates,
currentness, and the currently executable balance entries separately. The projection contains
candidate context only: it has no accept/apply controls, cannot mutate source, medication,
diagnosis, rule, point, ticket, evidence, or approval records, and is unavailable in Player and
portable Reviewer.

Review is source-revision complete rather than “first useful segment wins.” A multi-segment
revision remains partially classified until every expected segment is imported. Human adjudication
may later accept, narrow, reject, split, or remap a candidate; formal citation and runtime promotion
remain independent workflows. Process one bounded topic and one complete source at a time so a
personal archive never becomes an opaque bulk authority.
