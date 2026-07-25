# PsychSim

PsychSim is a browser-based psychiatric clinic-building game prototype. Milestones 0–3 deliver a small playable clinical loop plus the first progression arc: purchase immediate structured information, assemble a treatment plan, lock it in, receive an itemized all-points settlement, and reinvest banked points in services, formularies, facilities, and visible ambience.

Cross-device Codex work uses one canonical write-capable thread per local worktree. Start every new or resumed thread from [PROJECT_STATE.md](PROJECT_STATE.md), run `./scripts/codex-handoff status`, and follow [the phone/Mac handoff guide](docs/CODEX_THREAD_HANDOFF.md) before editing. Conversation history is not project memory.

The ordinary Player build currently has two approved-for-prototype patients. A separate portable
Reviewer build adds ten explicitly allowlisted common-psychiatry review scenarios for clinical and
gameplay feedback. Every one of these patients is fictional, synthetic, medically unreviewed, and
not authoritative treatment guidance. Waiting-room cards intentionally show only patient name,
chief complaint, and setting; hidden case labels, diagnoses, decision-policy names, and source
organizations are never launcher copy. No external service, account, API key, backend, or AI call
is required to play.

## Quick start

Requirements: Node 22+ and pnpm 10.13.1.

```sh
pnpm install
pnpm dev
```

Open the local URL printed by Vite. Other root commands:

```sh
pnpm build
pnpm build:reviewer
pnpm lint
pnpm typecheck
pnpm test
pnpm test:handoff
pnpm test:e2e
pnpm test:e2e:reviewer
pnpm content:validate
pnpm content:sources:validate
pnpm content:scan
pnpm content:extract
pnpm content:watch
pnpm content:notes:audit -- --folder "Psych research"
pnpm content:notes:sync -- --folder "Psych research" --ack-no-phi --ack-authorized-local-processing --ack-shared-material-rights --acknowledged-by "Your name"
pnpm content:notes:validate
pnpm content:notes:codex-review -- --next --provider openai-codex --model "<exact exposed model identifier>" --ack-no-phi --ack-authorized-external-ai-processing --ack-title-plaintext-rights --ack-shared-material-rights --ack-appropriate-to-transmit --acknowledged-by "Your name"
pnpm content:draft content/cases/blueprints/basic-mdd-scaffold.example.json
pnpm content:review
pnpm content:evidence
pnpm content:literature:refresh -- --ticket <ticket-id> --dry-run
pnpm content:literature:refresh -- --next
pnpm content:diagnoses:validate
pnpm content:diagnoses:search -- "major depressive"
pnpm content:diagnoses:import -- /path/to/icd10cm-order-2026.txt
pnpm content:compile
pnpm content:impact medication.bupropion
pnpm demo:reference-runs
pnpm assets:icons
```

On a machine without a locally installed Google Chrome, install Playwright's pinned browser once
with `pnpm exec playwright install chromium` before `pnpm test:e2e`.

The first profile begins with 250 spendable points and zero lifetime points earned. Investigation costs, care awards/penalties, reimbursement, purchases, and progression all use the same point unit. There is no letter grade, 0–100 score, credits, Reputation, or XP. The clinic store currently offers a 1,200-point ECG machine, an 800-point outpatient formulary expansion, the beta-only 900-point Clinical intake assistant, two facility moves, and three decor items. Purchases reduce only the spendable balance; lifetime points never decrease. Encounter expenses never debit banked points directly—only the nonnegative settled payout is added. Saves, resolved patient slots, attempts, flags, review tickets, facility state, decor, upgrade ownership, and configured staff intake actions use a small IndexedDB repository in the browser.

The first facility move becomes eligible at 2,500 lifetime points and separately costs 1,800 spendable points, increasing the persistent queue from one to two slots. The multidisciplinary center becomes eligible at 7,500 lifetime points, requires the outpatient-clinic move, costs 5,000 spendable points, and adds a third slot. Waiting patients and previous purchases survive the move. The plant, framed print, and warm-lighting purchases appear in the hub and add diminishing ambience toward a cataloged 1.15× cap on positive rewards only; they never change clinical scoring or rescue unsafe care.

The ECG patient is playable before ownership through a 500-point outside service. Owning the machine automatically fulfills the same order in house for 70 points; the receipt reports the 430-point external cost avoided without changing any clinical rule or result.

The beta-only Clinical intake assistant becomes purchasable at 600 lifetime points and costs 900
spendable points. After hiring, the player may configure up to three allowlisted routine
actions—depressive-symptom checklist, anxiety-symptom checklist, medication reconciliation, or
adherence review—to occur automatically whenever a chart opens. Each result is revealed immediately
through the ordinary information-purchase path and still incurs a discounted, nonzero encounter
cost. Automatic intake satisfies the same case rules as a manual purchase; it changes fulfillment
and expense, not clinical correctness. Its normal `InformationPurchased` event records the
automatic-intake origin and staff upgrade ID, so replay, receipts, and exported reviews remain
auditable. There are no salaries, schedules, capacity queues, virtual time, departments, or
automatic treatment decisions.

The hub includes reversible Endgame and local-only Developer practice modes. Endgame derives a
highest-tier clinic with every currently modeled capability and multiple approved patient slots.
Local Developer mode also exposes review content that has not yet been run, supports reroll/reset,
and shows the clinical-ticket, source-request, and uncited-opinion queues. Each checked-in
Developer ticket also shows either a bounded recent-meta-analysis scout or an explicit reason that
meta-analysis is the wrong source type. These records are unreviewed discovery context, not formal
evidence or clinical answers. `content:literature:refresh -- --next` refreshes the
least-recently-searched attached ticket one at a time; it is not bulk synthesis. Every ticket has one
plain-language “What should Codex do?” field; internal lifecycle statuses are not user-facing.
Ticket instructions and “Case and app experience notes” persist in IndexedDB and automatically
refresh the fixed gitignored Codex handoff file at
`content/generated/local-review-tickets/tickets.json`. “Update Codex handoff file” retries that
copy, while JSON export is a backup. The ordinary Player build contains neither these queues nor the
writable local endpoint.

The portable Reviewer build is the controlled phone/desktop review surface. It uses a separate
assignment-versioned IndexedDB database, provides the all-capabilities practice clinic, and loads
the two prototype patients plus exactly ten medically unreviewed reviewer-cohort scenarios. It
does not expose source organizations before submission, arbitrary review globs, preloaded local
Developer ticket/source/opinion queues, or a workspace writer. Reviewer-created guidance, flags,
and tickets still remain available for export. Mobile uses Patient, Revealed, Investigate,
Treatment, and Results/review tabs; purchased results also appear in a dismissible mobile dialog
and remain permanently available newest-first in Revealed. After submission, the feedback box is
near the top of Results. Every completed receipt can be reopened after reload so an interrupted
phone session does not strand unsaved feedback.

Reviewer feedback is local to that browser/device/origin until export. Several case comments,
item flags, and generated tickets can be accumulated and exported together as one version-5 JSON
bundle. It includes the assignment ID, every completed attempt, exact resolved patient and event
history, normalized offered options for commented cases, selections, receipt, and rule trace. The
reviewer can email that one file to the project owner. There is currently no account sync, server
backup, bundle import, or application authentication; export before clearing site data, switching
browsers, or moving devices. Do not enter real patient information or other identifiable material
in free-text feedback.

The assignment ID also versions the browser database. Any material cohort or policy revision must
use a new assignment ID so old run history cannot hide revised patients or mix revisions in one
export.

Every post-submit receipt groups its rule trace by workup, treatment, medication changes, safety,
nonmedication care, disposition, and efficiency, with point-changing rows first and zero-point rows
still inspectable. Each collapsed rule identifies whether it has formal references, mixed
source/opinion provenance, Expert opinion, or only a legacy unavailable snapshot; expanded rows
show the attempt-persisted citation and concise contribution statement. The receipt uses one
care-point comparison bar and shows the player's exact plan beside the declared database-plan
replay lower on the page. The database value normally sets the bar maximum; an above-plan player
score expands the scale and leaves a labeled database marker inside it. This is an auditable finite
benchmark, not a claim that every possible combination was searched. Practice receipts bank zero
points.

Numeric laboratory results use an EMR-style `Test · Result · Reference interval · Flag` table with familiar display units, UCUM codes in the data model, and explicit normal/high/low interpretation. Reference intervals belong to versioned test profiles rather than being treated as universal; see [LAB_RESULTS.md](docs/LAB_RESULTS.md).

The local authoring slice hashes and extracts PDF, DOCX, TXT, and Markdown sources into gitignored
document/chunk records. On macOS, a separate Apple Notes adapter can audit the exact
`Psych research` folder without reading titles, bodies, or attachment bytes. A content sync is a
separate explicit action: it requires acknowledgments that the folder contains no identifiable
patient information, is authorized for local processing, and may lawfully be processed despite
its shared-folder status. The sync preserves provider IDs and dates in a private manifest, exports
note text and accessible attachments into the protected local boundary, hashes exact bytes,
performs local-only Vision OCR for images and PDFs unless `--skip-ocr` is supplied, checkpoints
after every note, and queues one deterministic Markdown composite per note through the ordinary
source scanner and extractor. If Notes cannot export one attachment, the attachment is quarantined
with error provenance while usable title/plaintext from that note is retained. No note text or
image is printed or transmitted.

The separately acknowledged `content:notes:codex-review` boundary prepares exactly one bounded,
gitignored title/plaintext packet and a hash-only audit record. It does not read HTML,
attachments, OCR, or composites and contains no model/provider call. It must not be run with a
guessed model identifier; the current checkpoint prepared no real Notes packet.

A controlled scaffold request can turn an existing reviewed-as-a-template case into a new
medically unreviewed Developer patient with source provenance, proposed shared impact IDs, and
blocking clinical-audit tickets. Neither Apple Notes intake nor scaffolding infers a clinical rule,
creates a formal citation, or calls an AI provider. See
[DOCUMENT_INGESTION.md](docs/DOCUMENT_INGESTION.md) and
[the scaffold example](content/cases/blueprints/basic-mdd-scaffold.example.json).

Formal literature has a separate, tracked evidence catalog. Each article, guideline, regulatory
document, or correction receives one stable record with bibliography, scope, source relationships,
and explicit full-text/reuse/AI/local-extraction policy. A public download link is not treated as
permission to process a source. Case and medication contribution notes say exactly which rule a
source informed and how; catalog presence alone changes nothing. Receipt traces show those
citations and contribution statements. Rules without a linked formal contribution display
`Expert opinion` rather than receiving an inferred citation. Run `pnpm content:evidence` to audit
sources, access gates, correction edges, linked contributions, unused sources, and implicit
expert-opinion rules.

Source reuse has a separate machine-validated rights gate: bibliography, permission to process,
medical review, and runtime inclusion are independent decisions. A gitignored local CDC/NCHS
ICD-10-CM FY 2026 F01–F99 cache supplies 1,112 standardized codes and titles for U.S.
authoring/search under a documented narrow fair-use assessment; it supplies no criteria,
treatment, or approval and cannot enter the browser bundle or repository distribution. Playable
diagnosis files may later carry compact reviewed mappings to it. Source-specific terms control:
the WHO CDDR PDF is CC BY-NC-ND 3.0 IGO despite a conflicting generic licence link on its landing
page, so both CDDR and DSM-5-TR remain metadata-only pending permission for the intended
transformation. See [the source-use policy](docs/SOURCE_USE_POLICY.md) and
[the diagnosis-catalog contract](content/catalogs/diagnoses/README.md).

The clinical-model checkpoint now includes one file per diagnosis family, top-down
base/severity/specifier composition, deterministic gameplay-critical patient-context variants,
conservative blocking conflict detection, and a five-dimensional complexity vector. The next
compiler is specified to quarantine structural/no-safe-route states while preserving valid
clinical tension as traceable; that narrower classification is not implemented yet. The next recorded
boundary splits reusable patient templates, resolved patients, frozen encounters, regimen/prior
trial records, and compiled focused rubrics so future poly-diagnosis patients do not require copied
per-case treatment plans. Diagnosis guidance is qualitative and point-free until separately
balanced. MDD severity and optional comorbidity generation remain disabled in approved content
pending source and compiler gates; see [DIAGNOSIS_ENGINE.md](docs/DIAGNOSIS_ENGINE.md) and
[PATIENT_GENERATION_ENGINE.md](docs/PATIENT_GENERATION_ENGINE.md).

The CANMAT MDD source has been decomposed into five unresolved Developer tickets rather than
applied automatically. The 2023 WHO mhGAP guideline is now cataloged as a broad non-specialist
baseline; its DEP1–DEP4 depression section produced one source-linked Developer patient and four
recommendation-level tickets without changing executable shared guidance. The MDD diagnosis file
retains only an unreviewed context note that explicitly does not define criteria or severity.
Receipt flags include
`Needs another guideline/source`, which creates a local evidence-gap ticket rather than filling the
gap by inference. See the [WHO source map](docs/WHO_MHGAP_2023_SOURCE_MAP.md). Three additional ECG
tickets cover necessity/weight, continuation versus switching, and disposition. Switch to
Developer mode on the local server to play the review patient and enter plain-language instructions;
saving a ticket never silently rewrites clinical JSON.

The subsequent recommended-guideline intake added verified metadata for VA/DoD suicide risk, NICE
self-harm, APA BPD, APA delirium, the CANMAT corrigendum, BAP catatonia, Singapore ACE GAD, and ASAM
benzodiazepine tapering. VA/DoD, CANMAT, and BAP joined WHO in the protected local extraction
pipeline. NICE, APA, ACE, and ASAM remain metadata-only because their current terms require
permission or prohibit AI ingestion. Eight new Developer tickets own those access and clinical
scope decisions; no recommendation or point rule was activated. See the
[recommended-guideline intake map](docs/RECOMMENDED_GUIDELINE_SOURCE_MAP.md).

The beta catalog now also records the exact July 6, 2026 NLM RxNorm Current Prescribable Content
release and a public-domain source-use decision for medication identity normalization only. The
user-selected scope is a curated psychiatry/board-relevant allowlist, not every U.S. drug product.
No RxNorm bytes, importer, clinical claim, formulary expansion, or medication point rule was added.
Developer tickets separately queue the first identity list, the current thirteen-file provenance
audit, therapy identity/fidelity normalization, and common outpatient diagnosis coverage. The
existing treatment field already searches medications by label/class and searches nonmedication
and disposition labels through one combined control.

## Static deployment

The application is GitHub Pages-ready. [The Pages workflow](.github/workflows/pages.yml) runs on
`beta` and `main`, but only `main` can deploy. It runs formatting, lint, typecheck, unit/content,
ordinary browser, and mobile Reviewer gates; verifies both the approved Player build and the
separate portable Reviewer build; then deploys the Reviewer artifact with the repository subpath
as Vite's base URL. Public repositories deploy automatically. A private repository deploys only
when its GitHub plan supports Pages and the repository variable `PSYCHSIM_ENABLE_PAGES=true` is set;
otherwise verification remains green and deployment is skipped. Local builds continue to use `/`;
reproduce the Pages artifact with:

```sh
VITE_BASE_PATH=/PsychSim/ pnpm build:reviewer
```

Pages is a static host only. The deployed artifact contains the explicit portable Reviewer
assignment, not the local Developer environment and not arbitrary draft/review content. It never
contains the source inbox, extracted text, authoring classifications, local source/opinion/ticket
queues, writable workspace endpoint, or an AI SDK. Saves and review bundles remain local to the
browser until manual export.

Ordinary feature work is committed and verified on `beta`. Validated runtime content, declarative
scoring/provenance, and the finite portable Reviewer ticket packet normally move promptly to
`main`; beta-only quarantine is reserved for changes that materially risk app boot, navigation,
persistence, mobile review/export, installation/update, or bundle isolation. Pages still includes
only the exact static Reviewer assignment—not arbitrary Developer queues, drafts, private sources,
or the workspace writer. Whole verified-beta promotion remains the normal release path, and the
local working copy returns to `beta` afterward.

### Install on an iPhone

Open the public Pages address in Safari, use **Share → Add to Home Screen**, enable **Open as Web
App**, and tap **Add**. The hub's **Install on iPhone** control shows the same instructions. The
manifest uses a stable relative identity and includes dedicated 180, 192, and 512 pixel icons.

Safari and an installed Home Screen app can use separate local storage. A reviewer who already
completed work in Safari should export the feedback bundle before installing; installation does
not copy that Safari database. Subsequent distribution updates preserve the installed app's
IndexedDB.

Each `main` Pages build uses the exact commit SHA as its distribution ID. The installed app checks
a build-generated, non-cached `version.json` on launch, foreground, reconnection, every five
minutes, and on demand. A mismatch displays a persistent update control. Reload is disabled during
an encounter or receipt so transient clinical choices or reviewer prose are not discarded; return
to the clinic and choose **Update now**. The reload includes the new release ID so stale Pages HTML
cannot indefinitely pin the old hashed entry point. GitHub Pages may retain the marker at its edge
for several minutes, so this is reliable eventual propagation on the next online check, not a
promise of an instantaneous push while the app is closed. Broad offline/service-worker caching
remains deliberately out of scope. See
[INSTALL_AND_UPDATES.md](docs/INSTALL_AND_UPDATES.md).

## Documents

Start with [PROJECT_STATE.md](PROJECT_STATE.md), [GAME_DESIGN.md](docs/GAME_DESIGN.md),
[ARCHITECTURE.md](docs/ARCHITECTURE.md),
[INSTALL_AND_UPDATES.md](docs/INSTALL_AND_UPDATES.md),
[PATIENT_GENERATION_ENGINE.md](docs/PATIENT_GENERATION_ENGINE.md),
[MEDICATION_AND_INTERVENTION_DATA.md](docs/MEDICATION_AND_INTERVENTION_DATA.md),
[SOURCE_USE_POLICY.md](docs/SOURCE_USE_POLICY.md),
[RECOMMENDED_GUIDELINE_SOURCE_MAP.md](docs/RECOMMENDED_GUIDELINE_SOURCE_MAP.md),
[WHO_MHGAP_2023_SOURCE_MAP.md](docs/WHO_MHGAP_2023_SOURCE_MAP.md),
[LAB_RESULTS.md](docs/LAB_RESULTS.md), and [DECISIONS.md](docs/DECISIONS.md). Contributor constraints
live in [AGENTS.md](AGENTS.md), milestone sequencing is in [ROADMAP.md](docs/ROADMAP.md), and
phone/Mac coordination is in [CODEX_THREAD_HANDOFF.md](docs/CODEX_THREAD_HANDOFF.md).
