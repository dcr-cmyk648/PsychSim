# Source-document ingestion and patient scaffolding

The protected authoring boundary now has a bounded local vertical slice: SHA-256 scanning,
duplicate detection, PDF/DOCX/TXT/Markdown extraction, ordered text chunks, watch mode, manifest
validation, a controlled patient scaffolder, automatic Developer-mode discovery, and a macOS-only
Apple Notes adapter with metadata-only audit, acknowledged private export, per-note crash-recovery
checkpoints, and explicit local OCR for image/PDF attachments. It is not the full Milestone 6–7
workflow: there is no automatic Google Drive OAuth downloader, claim-review UI, external AI
provider, critic model, or automatic clinical-rule authoring. General source extraction does not
silently OCR arbitrary PDFs; OCR exists only in the explicit Apple Notes sync path.

Three records remain deliberately separate: private `SourceDocument`/`SourceChunk` text, tracked formal `EvidenceSourceDefinition` bibliography, and `EvidenceContribution` application notes. A PDF does not become formal evidence merely because it looks academic. Formal use requires a catalog entry; anything else is Expert opinion until a human classifies and catalogs it.

Before downloading or processing third-party publication bytes for claim extraction, the authoring
workflow requires an applicable `SourceUseDecision`. D-120 is a narrower exception for acknowledged
private preservation of the user's Apple Notes corpus: it permits local export, hashing, and OCR
only, not formal-source status or clinical use. Public readability and bibliographic verification
are not permission. Storage, local extraction, local structured indexing, AI-assisted processing,
derived clinical content, runtime redistribution, and commercial distribution are separate
permissions; a blocked or absent source-specific decision leaves a candidate metadata-only for
formal use. The complete contract is [SOURCE_USE_POLICY.md](SOURCE_USE_POLICY.md).

Source-specific terms override generic landing-page metadata. The 2024 WHO CDDR PDF is CC
BY-NC-ND 3.0 IGO and expressly prohibits adaptations without permission, so its text must not enter
the extraction or AI-assisted pipeline. DSM-5-TR likewise remains metadata-only. Correction
notices, updates, and superseding sources are separate catalog entries with validated
source-to-source relations; they are never silently folded into an older record.

## Evidence requests before ingestion

The tracked developer-only queue at `content/cases/review/source-needed.requests.json` records clinical decisions that cannot yet be finalized from current provenance. A request names the exact research question, affected rules/tests/patients, originating clinical tickets, preferred formal-source types, and concrete acceptance criteria. It also records existing sources that provide context but leave the question open. This prevents “needs sourcing” from becoming an ambiguous comment or an accidental rule approval.

The queue directs the user to `PsychSim documents`, but it contains no copyrighted text and performs no connector action. After the user asks Codex to check Drive, new bytes still pass through discovery, SHA-256 deduplication, the protected local inbox, extraction, and one-at-a-time claim review. Only then may the request link source-document/chunk IDs and move to source-received. Resolution additionally requires a concise resolution note and the normal rule-level content change/revalidation workflow. `pnpm content:validate` checks the tracked request graph; `pnpm content:sources:validate` checks the private discovery and extraction graph.

## Local workflow

```text
content/source-docs/
  inbox/       new local inputs
  processed/   successfully processed originals
  archive/     byte-identical duplicates and intentionally retained inputs
  quarantine/  failures retained with an explicit error
  extracted/   local-only normalized document/chunk packages and Apple Notes private exports
  manifests/   local-only SHA-256/status/provider-provenance records
```

Only `.gitkeep` files and the warning README are tracked. Root ignore rules protect every other file
in these folders, including the account-specific Drive discovery manifest, the Apple Notes intake
manifest, private note revisions, attachment bytes, OCR text, and deterministic composites. Vite
imports neither this directory nor content tooling; a bundle-safety test scans production output.
Private manifests and Apple Notes derivatives use restrictive local permissions.

## Classification import is a separate authoring path

The ICD-10-CM classification catalog does not pass through the general source-document inbox.
`pnpm content:diagnoses:import -- /path/to/icd10cm-order-2026.txt` verifies the pinned official
member hash before deterministically replacing generated terms. `pnpm
content:diagnoses:validate` checks release, code-prefix navigation, uniqueness, counts, and normalized hash;
`pnpm content:diagnoses:search -- "major depressive"` searches the authoring catalog.

This path imports standardized codes and titles only. It does not extract criteria, generate
diagnosis rules, or make content medically reviewed, and bundle-safety gates keep the entire
classification directory out of production.

## Google Drive remote inbox

The user-designated folder is `PsychSim documents`. The folder ID and discovered file IDs live only in `content/source-docs/manifests/google-drive-discovery.json`, not tracked product content. On an explicit request to check the folder:

1. Locate the folder through Drive rather than assuming a cached title match.
2. List direct children and compare provider file ID, size, MIME type, and modified version/time with the local discovery manifest.
3. Pull each new or changed file, compute SHA-256 over its bytes, and compare that hash with all prior sources.
4. Record exact duplicates without reprocessing them. Never use filename or modified time as the deduplication authority.
5. Queue genuinely new hashes in stable discovery order and work through one source at a time.
6. Create concise claim/change proposals with target catalog IDs and provenance. Do not modify scoring, medication modifiers, or patients during discovery.
7. Require explicit human acceptance plus validators/reference runs before a proposal becomes reviewed content.

The initial Drive check found the 2023 CANMAT adult-MDD update. A CC BY copy is now locally
extracted as `source-document.412aade56104fd394503`; the private PDF and chunks remain ignored, and
no contribution is linked to a clinical rule. The connected-Drive action and the local CLI
intentionally remain separate security boundaries: raw downloaded bytes are placed in `inbox/`,
then the local byte-based scanner becomes the authority. The CLI does not embed a personal OAuth
token or pretend connector metadata is extracted content.

The recommended-guideline intake also processed the public VA/DoD suicide-risk PDF and CC BY BAP
catatonia article. NICE, APA, ACE Singapore, and ASAM records remain metadata-only because their
current terms require permission or prohibit AI ingestion. See
[the intake map](RECOMMENDED_GUIDELINE_SOURCE_MAP.md) for exact IDs and tickets.

## Apple Notes private research intake

On macOS, the folder named exactly `Psych research` is a local private source inbox. The adapter
uses Notes' public AppleScript dictionary rather than copying the Notes database or resolving
private attachment paths. It searches nested folders across every Notes account and refuses to
continue unless exactly one folder matches.

Audit and content access are separate operations:

```sh
pnpm content:notes:audit -- --folder "Psych research"
pnpm content:notes:sync -- --folder "Psych research" \
  --ack-no-phi \
  --ack-authorized-local-processing \
  --ack-shared-material-rights \
  --acknowledged-by "Your name"
pnpm content:notes:validate
pnpm content:notes:codex-review -- \
  --next \
  --provider openai-codex \
  --model "<exact exposed model identifier>" \
  --ack-no-phi \
  --ack-authorized-external-ai-processing \
  --ack-title-plaintext-rights \
  --ack-shared-material-rights \
  --ack-appropriate-to-transmit \
  --acknowledged-by "Your name"
```

The audit reads only the account/folder/note/attachment identifiers exposed by Notes, provider
creation and modification dates, attachment ordinals/content identifiers, locked/shared flags, and
counts. It does not request note titles, plaintext, HTML, or attachment bytes. It writes
`content/source-docs/manifests/apple-notes-intake.json` with mode `0600` and prints only aggregate
counts and the private manifest path.

The sync refuses body or attachment access unless all four acknowledgment inputs are present. The
acknowledgment records that the folder contains no identifiable patient information, that local
processing is authorized, that shared-material rights have been considered, who acknowledged the
conditions, and when. These assertions permit the bounded private workflow; they do not verify
copyright ownership or convert third-party article screenshots into reusable publications.

The Codex-review command has a second, independent acknowledgment because local Notes access does
not authorize external AI processing. It prepares one title/plaintext segment only. Segmentation
is deterministic from source text and does not change with the requested model identifier or
provider revision metadata. The complete canonical packet determines its ID; a reused release
returns the SHA-256 of the already audited bytes. Input, segment, packet, and segment-count limits
bound local work. Protected directory chains reject symlinks/path escapes, private directories
use exact mode `0700`, and packet/audit files use exact mode `0600`. Invalid private JSON is
reported without including a source-text fragment.

For each unlocked new or provider-modified note, Notes writes a private revision containing title,
plaintext, HTML, and accessible attachments under
`content/source-docs/extracted/apple-notes-private/`. Provider IDs are hashed for path-safe local
IDs, while exact provider account, folder, note, and attachment IDs and dates remain in the ignored
manifest. Attachment bytes receive SHA-256 hashes, MIME detection, size checks, and exact-duplicate
links. Changed notes create a new revision; unchanged notes are not re-exported; notes no longer in
the folder remain as `missing` provenance; locked notes and export failures remain recorded as
quarantined metadata. The workflow never edits or deletes the Notes originals. It atomically
checkpoints the private manifest after every note, so a process interruption resumes from the
first unfinished record.

The public Notes scripting interface can expose a note's title/plaintext while refusing to save a
particular attachment. That attachment is quarantined independently with a failed OCR state and a
clear export error; the note's usable text still receives its deterministic composite. Partial
attachment files are discarded inside the protected revision directory and never treated as valid
source bytes.

Unless `--skip-ocr` is supplied, image attachments and PDFs are processed locally with macOS Vision
`VNRecognizeTextRequest` at accurate recognition level; PDFKit renders a bounded number of scanned
pages and ImageIO bounds image dimensions. The helper is compiled into a private temporary
directory with the installed macOS SDK, records its source/OS/SDK identity, uses bounded subprocess
and output limits, and sends nothing to a provider. OCR status is explicitly `completed`, `empty`,
`unsupported`, or `failed`; OCR failure never masquerades as an empty source. Attachments over
100 MiB are retained and hashed with an error rather than sent through OCR.

The adapter builds one deterministic Markdown composite per reviewable note from its title,
plaintext, and attachment OCR boundaries. The composite enters the ordinary inbox scanner and
extractor immediately, so the existing SHA-256 manifest, duplicate handling, chunk hashing, and
private `SourceDocument` IDs remain authoritative. Raw HTML, attachment bytes, and OCR text remain
private. The Apple Notes manifest links provider records to hashes, paths, OCR state, composite
hash, and expected source-document ID. `content:notes:validate` validates manifest identity,
private-path containment, unique local records, and attachment hashes; `content:sources:validate`
runs that validation alongside the Drive and ordinary source manifests.

The output is an intake corpus, not a clinical database update. Note text and OCR are untrusted
private source material. Personal takeaways begin as Developer opinion; article titles and embedded
citations are bibliographic candidates only. Formal evidence still requires independent
bibliographic verification, an applicable `SourceUseDecision`, exact claim review, and a tracked
contribution. No note, OCR passage, or citation changes a case, rule, score, or review status.

The Codex-review command is a second, separately acknowledged release boundary. One invocation
prepares at most one note/segment under
`content/source-docs/extracted/apple-notes-private/codex-review/packets/`. It reads only the exact
private `title.txt` and `plaintext.txt` fields and verifies both against the intake manifest; it
never reads the note's HTML, attachment bytes, attachment OCR, deterministic composite, or
extracted chunks. A title is limited to 2,048 UTF-8 bytes, a plaintext segment to 8,192 bytes, and
the complete JSON packet to 12,288 bytes. Long plaintext is split deterministically without
dropping or overlapping characters, and `--next` advances one segment at a time.

Every packet is mode `0600`, remains gitignored, and has one hash-only audit entry under
`content/source-docs/manifests/`. The command requires the exact provider/model plus explicit
no-PHI, external-processing, title/plaintext-rights, shared-material-rights, appropriate-to-send,
and named-reviewer acknowledgments. It prints only stable IDs, segment counts, hashes, and private
paths. It contains no provider SDK, network request, API-key lookup, or model invocation:
preparation is not proof that Codex consumed or classified the packet. Do not run it against the
real corpus until the current Codex surface exposes an exact model identifier for the audit.

## Bounded personal-knowledge semantic workflow

The first semantic pilot covers one tracked topic—initial MDD antidepressant selection—without
claiming that every likely note or the whole Notes corpus has been processed:

```sh
pnpm content:knowledge:index -- --refresh --next
pnpm content:knowledge:prepare -- \
  --provider openai-codex \
  --model "<exact model identifier>" \
  --ack-no-phi \
  --ack-authorized-external-ai-processing \
  --ack-title-plaintext-rights \
  --ack-shared-material-rights \
  --ack-appropriate-to-transmit \
  --acknowledged-by "Your name"
pnpm content:knowledge:import -- /private/path/to/classification.json
pnpm content:knowledge:status
```

Indexing uses only normalized literal matches against the authorized Apple Notes title/plaintext
revision. A match is a recall-oriented queue signal, not a claim, citation, evidence relationship,
or clinical relevance decision. The profile allowlists target IDs and the semantic importer
rejects unknown targets.

Preparation selects one source revision and its next unclassified deterministic segment. Only one
packet may remain released at a time. If a revision spans multiple segments, the queue records its
expected segment count and every released/classified ordinal; the revision stays partially
classified until all expected segments have valid imports. The semantic boundary remains
title/plaintext only. HTML, attachment bytes, OCR, deterministic composites, and extracted chunks
are not included by these commands.

Import accepts one strict private classification result tied to the audited packet, source
revision, segment hash, exact model, prompt version, and tracked pilot profile. It creates only
unreviewed authored-unit, Developer-opinion, and bibliographic candidates in the ignored private
workspace. It is idempotent and cannot create formal evidence, executable rules, point values,
tickets, citations, or approval. Status validates the queue/workspace and writes a minimized
read-only Developer projection. The local Vite bridge is loopback-only; Player and portable
Reviewer bundles exclude the projection and endpoint.

## Private user-authored residency archive

The user's aggregate of previously authored residency-site articles can seed a large
Developer-opinion catalog, but it requires a logical layer above the physical document pipeline.
The current connector set cannot read SharePoint directly, and no copy is present in the local
source inbox. The first intake should use a manual export placed in
`content/source-docs/inbox/`, or an export copied to the connected `PsychSim documents` Drive
folder followed by an explicit check request.

The aggregate is one physical, private, hashed `SourceDocument`, but each original article is a
separate future `AuthoredSourceUnit`. Article units preserve title, byline, original URL/venue,
original and revised dates, heading path, chunk IDs, asserted authorship, rights status, and
currentness. Short atomic `DeveloperOpinion` candidates and unverified `BibliographicCandidate`
records derive from each unit. The original articles are not automatically formal evidence, and
their bibliography does not automatically support every nearby statement.

Before intake, the user must confirm:

- the export contains no identifiable patient information;
- it is appropriate to store and process locally;
- authorship and any known residency/employer reuse restrictions;
- whether external AI processing is permitted, if that optional workflow is ever requested; and
- that third-party quotations, tables, figures, scales, screenshots, and publisher material can be
  excluded.

Markdown is preferred for a long multi-article export. The current DOCX parser uses Mammoth
raw-text extraction and loses heading styles, so an unmodified DOCX export cannot reliably
establish article boundaries. HTML could preserve those headings but is not a currently supported
input type. Before processing a DOCX, either add explicit plain-text article delimiters, export to
Markdown, or implement and test semantic-heading DOCX/HTML extraction. Ambiguous segmentation
creates a review ticket rather than a guessed boundary.

Review proceeds one article or small topic cluster at a time. Each batch shows proposed concise
opinions, original dates, cited-source candidates and their verification state, newer potentially
conflicting evidence, and affected catalog IDs. Accepted opinions remain Developer opinion and
must pass a separate change proposal, impact scan, clinical review, and balance decision before
affecting gameplay.

## Implemented commands

| Command                                                  | Behavior                                                                                                                                                                                                                      |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm content:scan`                                      | Hash direct inbox files, detect byte-identical duplicates, write the local manifest, and retain unsupported inputs in quarantine.                                                                                             |
| `pnpm content:extract`                                   | Parse discovered inputs, verify the pre-extraction hash, write document/chunk records atomically, and retain originals under processed or quarantine.                                                                         |
| `pnpm content:watch`                                     | Watch the inbox and serialize the same scan/extract functions; it adds no alternate behavior.                                                                                                                                 |
| `pnpm content:notes:audit -- --folder "Psych research"`  | Record Apple Notes IDs, dates, locked/shared flags, and counts without reading note titles, bodies, or attachment bytes.                                                                                                      |
| `pnpm content:notes:sync -- --folder "Psych research" …` | After all required acknowledgments, export changed unlocked notes privately, hash attachments, run local image/PDF OCR by default, checkpoint each note, queue deterministic Markdown composites, then scan and extract them. |
| `pnpm content:notes:validate`                            | Validate the ignored Apple Notes manifest, unique records, protected paths, and attachment byte hashes without printing source text.                                                                                          |
| `pnpm content:notes:codex-review -- --next …`            | After separate external-processing acknowledgments, prepare one bounded private title/plaintext packet plus a hash-only audit record; make no provider or API call.                                                           |
| `pnpm content:knowledge:index -- --refresh --next`       | Refresh one bounded topic's private lexical queue and report only aggregate counts plus an opaque next record; matching does not establish a claim.                                                                           |
| `pnpm content:knowledge:prepare -- …`                    | Release the next missing segment from the prioritized source revision under explicit acknowledgments; make no provider or API call.                                                                                           |
| `pnpm content:knowledge:import -- <private-result>`      | Strictly validate and idempotently import one private candidate classification; create no evidence, rules, points, tickets, citations, or approval.                                                                           |
| `pnpm content:knowledge:status`                          | Validate queue/workspace state and refresh the ignored, read-only local Developer projection without printing private content.                                                                                                |
| `pnpm content:review`                                    | List extracted source IDs/chunk counts and current Developer review patients without printing source text.                                                                                                                    |
| `pnpm content:evidence`                                  | List every formal evidence record, linked contributions or unused status, and expert-opinion coverage.                                                                                                                        |
| `pnpm content:draft <request.json>`                      | Create a medically unreviewed patient scaffold, local provenance, and blocking clinical-audit tickets.                                                                                                                        |
| `pnpm content:compile`                                   | Schema- and semantically validate every review patient; it never promotes one.                                                                                                                                                |
| `pnpm content:sources:validate`                          | Validate Drive/local manifests, duplicate references, document/chunk relationships, and text hashes.                                                                                                                          |

The scanner has a 50 MiB per-file safety bound and ignores dotfiles. It uses a content hash plus filename-derived stable entry ID, so re-running the same inbox converges while a differently named byte-identical file receives a duplicate record linked to its primary. Successful originals are renamed into `processed/` with their manifest ID; duplicates go to `archive/`; failures go to `quarantine/`. None is deleted.

Success writes extracted artifacts before moving the original and marks the manifest extracted last. Failures retain the original with a clear status/error. A rerun reuses stable content-derived document and chunk IDs rather than creating new provenance records. Watch mode is merely a development convenience over the same idempotent functions.

## File and extraction strategy

PDF parsing uses a developer-only PDF.js dependency and preserves page numbers. DOCX parsing uses a developer-only Mammoth dependency. TXT is normalized and paragraph-chunked; Markdown additionally preserves heading context. The common parser splits oversized text into bounded chunks, removes NULs, normalizes line endings, and never evaluates macros, scripts, links, or embedded instructions. Each parser run records `psychsim-source-parser-1`, a document text hash, ordered chunks, page/section context where available, and a hash for the exact local chunk text. The general file pipeline still has no silent OCR fallback. OCR is an explicit, provider-scoped capability of `content:notes:sync`: macOS Vision processes only exported Apple Notes image/PDF attachments, records its engine and outcome, and can be disabled with `--skip-ocr`.

## Patient scaffolding and testing

`PatientScaffoldRequest` is a versioned, Zod-validated request. It identifies an existing approved
template, a new patient ID/internal title, at least ten short chief complaints, an adult age range,
and optional source uses containing explicit formal-publication versus expert-opinion authority,
formal evidence IDs where applicable, exact document/chunk IDs, contribution categories, a concise
original summary, and optional proposed shared-impact IDs. Proposed impacts are ticket routing, not
evidence contributions or executable edits. The compiler rejects unresolved provenance,
uncataloged formal evidence, expert opinion carrying a formal citation, and duplicate output unless
`--force` is explicit; repeated document/evidence/chunk IDs are stored once.

The scaffolder intentionally does less than a clinical generator. It copies executable facts/rules
from the named template, changes only controlled presentation/provenance fields, resets every
clinical rule to `unreviewed`, writes generation provenance locally, and creates two proposed
tickets: a blocking audit of inherited rules and a source-application audit. It never treats
article text as an instruction or changes scoring from a source summary. The resulting
`*.case.json` and companion `*.tickets.json` live in `content/cases/review/`; Vite's
development-only content module discovers them for Developer mode. The ordinary Player artifact
still imports approved cases only. The separately compiled portable Reviewer can import only its
exact static assignment; it never discovers arbitrary scaffolds from this directory.

Use [the tracked basic-MDD request](../content/cases/blueprints/basic-mdd-scaffold.example.json) to
test a clean checkout. The
[WHO mhGAP MDD request](../content/cases/blueprints/who-mhgap-mdd-initial-review.scaffold.json)
shows the source-backed form. It follows
`scan → extract → catalog formal source → review IDs → draft → compile → Developer mode`. This
creates a playtest scaffold, not medically approved content.

## Privacy, copyright, and untrusted input

Never place identifiable patient information in this folder. Assume sources may be confidential or copyrighted. Keep originals, derived text, and manifests local and out of Git; control filesystem access; do not reproduce long passages. Game outputs must be original fictional cases with concise derived teaching points. Public readability is not an ingestion license: check the tracked access policy before downloading or extracting a source.

Document text is untrusted data, not instructions. Parsers treat it as bytes/text only. Prompt injection, shell snippets, macros, links, and embedded instructions are not followed or executed. Parsers run with bounded file size/type handling, normalize output, and surface failures. No source file is served from `public/` or imported by application code.

Apple Notes audit is intentionally metadata-only. A sync requires explicit no-PHI,
authorized-local-processing, shared-material-rights, and named-reviewer acknowledgments before it
requests any title, body, or attachment bytes. The folder's shared flag and every note's shared flag
are retained because user possession and asserted authorship do not prove exclusive rights. All
Notes-derived material remains local and private; it is never logged as text or sent to an external
AI service.

## External AI opt-in

Local-only and deterministic mock drafting work without a provider. No external provider SDK or
network client is implemented. The Apple Notes Codex bridge may prepare one explicitly
acknowledged title/plaintext packet for a separately authorized Codex read, and the private
personal-knowledge importer may validate the resulting candidate classification; neither command
sends material itself. Every release records the exact audited packet, provider/model, scope, and
acknowledgments. Any future provider may receive source text only with a command flag, an
interactive acknowledgment that the operator has rights and the material is appropriate to
transmit, an explicit provider/model, and an audit record of referenced document/chunk IDs. No
implicit environment-based send is allowed. API keys stay in local environment/secret storage,
never source control, output files, browser code, or prompts saved for review.

## Provenance and human control

Drafts retain document/chunk IDs, hashes, parser/model/prompt/generator versions,
validation/critic results, and repairs. Apple Notes sync itself creates only private intake
records. A personally authored takeaway may later become an inactive Developer-opinion or
author-override candidate after human classification; article OCR and embedded citations remain
unverified source candidates. A future AI provider may see only allowed catalog IDs and cannot
invent predicate types or approve content. A clinician must review and explicitly approve any
eventual production medical content. Source deletion/archival and content deprecation remain
separate actions so provenance is never silently broken.
