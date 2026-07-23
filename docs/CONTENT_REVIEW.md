# Content review and disagreement workflow

## Milestone 1 capture and ticket queue

The receipt exposes a local flag control for the whole encounter, each receipt item, and each rule trace. A ContentFlag records stable ID, case/blueprint/content version, seed, engine version, attempt ID, disputed item, category, clinical-review requirement, note, open status, and timestamp. The associated CompletedAttempt preserves the resolved CaseInstance, clinic snapshot, event/action history, submitted combination, point report, and exact rule trace. Flags and attempts persist together in IndexedDB.

Categories cover the whole encounter, information result, workup objective, treatment grade, interaction rule, penalty, rationale, missing acceptable alternative, narrative ambiguity, and UI/engine bug. Capturing a flag does not modify or re-score the historical attempt.

On the local development server, every receipt row also has “Add guidance.” Guidance creates a proposed `ClinicalReviewTicket` with the exact row snapshot, patient/content version, requested ticket type, whether clinical acumen is required, target IDs, dependency/conflict slots, proposed routing, optional resurfacing trigger, and timestamps. A clinically marked flag also creates a ticket. Developer mode shows the local queue and gives every existing or newly created ticket an editable reviewer-notes field plus status. Saving a review persists both values in IndexedDB and atomically mirrors the complete versioned bundle to the fixed gitignored path `content/generated/local-review-tickets/tickets.json`. Clinical decision statuses require nonempty notes. “Update Codex handoff file” retries or refreshes the mirror; “Export JSON” downloads the same portable bundle. Automated browser tests write only to `tickets.e2e.json`, never the human handoff file.

The intended handoff is deliberately simple: review tickets in the UI, save each review, then tell Codex that the local review is ready. Codex reads the fixed workspace file and applies only the accepted or narrowed instructions through normal versioned content changes and validation. No browser console, manual JSON editing, or pasted transcript is required.

This lightweight queue adopts the useful workflow invariants from the user's book repository:

- raw observations and historical snapshots remain immutable;
- proposals never auto-mutate durable content;
- one authoritative status lives on the ticket rather than being inferred from prose;
- technical dependencies can be cleared before clinical adjudication;
- accepted, rejected, deferred, and resolved outcomes are explicit;
- deferred claims can declare when they should resurface;
- durable changes create versioned content plus validation evidence.

The current reviewer-notes editor, status selector, and ticket bundle are review tools, not rubric editors. Marking a ticket accepted or resolved records the user disposition but does not claim that clinical JSON was changed. The local writer can persist the queue file only; it cannot choose an arbitrary path or mutate patients, medications, tests, pathways, or scoring. Applying accepted tickets to versioned content, dependency scans, and supersession links remain Milestone 5.

## Generated patient audit packages

The bounded patient scaffolder writes a review patient and a companion `*.tickets.json` file. Developer mode discovers both only on the local Vite server. Every package starts with a blocking inherited-rule audit and a high-priority source-application audit; source-free mechanics fixtures still receive the latter so the user must explicitly decide whether provenance is required. These tickets appear in the same local queue as receipt guidance and may be exported or mirrored, but resolving them does not modify the scaffold.

A scaffold can be played immediately to evaluate wording, variation, menus, and receipt behavior. It must not be promoted merely because it is executable. Clinical facts, criteria constraints, workup weights, treatment families, fit modifiers, combinations, disposition, settlement, and every reference policy remain individually reviewable.

## Source-review ticket packets

A tracked `*.tickets.json` file may decompose one formal source into proposed rule-level questions without attaching that publication to an executable rule. Developer mode loads these packets into the same local queue. The first example, `canmat-2023-mdd-source-review.tickets.json`, separates assessment/workup, severity and initial modality, broad antidepressant baseline/fit, psychotherapy, and disposition. Each ticket names exact candidate targets, source section routing, conflicts, dependencies, and resurfacing conditions. It paraphrases only the narrow candidate contribution and does not include private extracted text.

Creating or accepting a ticket is not source application. A formal `EvidenceContribution`, target rule review update, content-version change, impact scan, and affected reference policies are still required after the user adjudicates the question. This keeps “the paper exists,” “the source may support this claim,” and “this exact game rule has been clinically approved” as three separate states.

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

Before any content is eligible for wider distribution, tests must cover the database plan, at least one defensible alternative, shotgun, unsafe treatment, each safety cap, treatment-specific prerequisites, eligibility at every compatible location, critical invariance across seeds, and bundle isolation. Reviewers should be able to dispute individual rules without accepting the rest of a case.

## New-study impact workflow

A newly discovered article is reviewed one at a time. Extraction first creates source/chunk provenance and concise candidate claims; it does not edit medications or patients. Each accepted claim becomes a proposed change with target stable IDs, prior behavior, proposed behavior, author/evidence status, and an automatically computed impact set from registry dependencies, medication/patient tags, pathway references, and overrides.

Before a formal publication can be cited, its bibliographic record must exist in `content/catalogs/evidence/formal/`. Bibliographic verification checks identity and citation metadata only. Each proposed application separately records the target rules and how the source contributed. If a note or judgment has no formal record, reviewers classify it as Expert opinion instead of attaching a nearby or guessed citation. `pnpm content:evidence` exposes formal sources with no linked use, every linked contribution, explicit expert notes, and the count of uncited rules that therefore display as Expert opinion.

Changes to shared medication knowledge create impact tickets for every dependent patient; they do not propagate automatically. Patient-specific exceptions stay in that patient's file instead of weakening a global rule. Personal notebook/iOS material starts as an inactive author override until separately sourced and reviewed. Conflicting guideline, review, trial, or author-note claims remain linked tickets with no automatic precedence; the user accepts, narrows, rejects, defers, or supersedes them. Accepted changes create new content versions; old attempts retain their historical snapshots. Rejection records the rationale so the same source claim is not repeatedly re-proposed without new evidence.
