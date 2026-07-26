# Source-document ingestion and patient scaffolding

The protected authoring boundary now has a bounded local vertical slice: SHA-256 scanning,
duplicate detection, PDF/DOCX/TXT/Markdown extraction, ordered text chunks, heading paths for
Markdown and DOCX, watch mode, manifest validation, a controlled patient scaffolder, automatic
Developer-mode discovery, and a macOS-only Apple Notes adapter with metadata-only audit,
acknowledged private export, per-note crash-recovery checkpoints, and explicit local OCR for
image/PDF attachments. It is not the full Milestone 6–7 workflow: there is no automatic Google
Drive OAuth downloader in the CLI, source-summary review UI, external AI provider, critic model, or
automatic clinical-rule authoring. General source extraction does not silently OCR arbitrary PDFs;
OCR exists only in the explicit Apple Notes sync path.

Three records remain deliberately separate: private `SourceDocument`/`SourceChunk` text, tracked formal `EvidenceSourceDefinition` bibliography, and `EvidenceContribution` application notes. A PDF does not become formal evidence merely because it looks academic. Formal use requires a catalog entry; anything else is Expert opinion until a human classifies and catalogs it.

## Source access and incorporation status

Every source report uses the following explicit stages:

1. **Discovered** — provider metadata identifies a candidate; no source bytes are local.
2. **Downloaded** — exact local bytes exist, have a SHA-256 hash, and passed duplicate comparison.
3. **Extracted** — a parser produced verified `SourceDocument` and `SourceChunk` records.
4. **Semantically reviewed** — the report names the exact document units/chunks and review scope;
   unreviewed portions remain explicit.
5. **Candidates created** — proposed identities, bibliography, Developer opinions, claims, or
   content changes exist but remain non-executable and medically unreviewed.
6. **Incorporated** — a human-accepted change names the resulting versioned catalog, rule, patient,
   or other content IDs and has passed its normal validators.

Do not use “processed,” “ingested,” or “incorporated” without identifying the exact stage. Report
connector unavailability, authorization failure, unsupported export, parser loss, OCR failure,
truncation, ambiguous segmentation, and partial coverage when first observed and again in the
final handoff while unresolved. Discovery or extraction alone never implies semantic review, and
semantic review alone never implies a gameplay change. If no versioned content IDs changed, say
that runtime content is unchanged.

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

The current connected-folder verification found nine direct items: eight clinical/source
candidates already represented by the private discovery manifest and one Reviewer-feedback JSON
that is not a clinical source. No new candidate or changed remote timestamp was found. Four
discovery candidates still have no downloaded bytes, SHA-256, local manifest record, or extraction:
the psychotic-depression PDF, QTc/TdP Funk review PDF, Pink Book 2021 PDF, and Brief Therapy
Vignettes Doc. They remain discovered only and must be transferred one at a time under the ordinary
source-identity and rights checks.

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

## Whole-corpus private lexical inventory

`pnpm content:knowledge:inventory` verifies every eligible Apple Notes title/plaintext revision
against the private intake manifest and builds one deterministic lexical triage index. It uses
NFKC/case normalization and Unicode-aware literal boundaries against only current safe medication
identity, diagnosis, nonmedication-intervention, and test labels/explicit aliases. It neither
guesses acronyms nor discovers new entities.

The detailed JSON is mode `0600` under gitignored `content/generated/personal-knowledge/`. It stores
source IDs/hashes/dates, target IDs/terms, counts, fingerprints, and fixed warnings; it stores no
title, plaintext, excerpt, HTML, attachment, OCR, composite, or extracted-chunk prose. Console
output is aggregate-only. The first run covered all 204 eligible revisions, with 72 revisions
matching at least one of 68 current safe identities. All 124 attachments, 116 OCR outputs, and
remote Drive sources were explicitly excluded.

This is physical-coverage and prioritization infrastructure, not semantic processing. A lexical
match cannot create an authored source unit, bibliographic record, Developer opinion, clinical
claim, rule, point, citation, approval, or runtime entry. Unknown medication/condition concepts
remain outside this first dictionary and require the separately reviewed identity-expansion path.

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
The official Google Drive connector exported the exact native document `Aggregate sharepoint
notes` as a DOCX through the connected `PsychSim documents` folder. The protected local source has
SHA-256
`8fedf00c83190f6a3661bf820382b76d27a59ce3d425b02202a7fe8b797f03c1` and source-document ID
`source-document.8fedf00c83190f6a3661`.

Physical preservation and structure-aware extraction are complete. Parser version
`psychsim-source-parser-5` found 24 top-level heading instances, three nested heading instances,
and one unsectioned preamble across 39 bounded chunks. Thirty-eight chunks are sectioned and carry
deterministic `sectionInstance` locators; all 39 carry a locator/body `provenanceHash`. Parser-v1
through parser-v4 extractions are retained as four private extraction-history revisions. Exactly
one parser warning records an unrecognized Word `Title` style; semantic review must decide whether
that paragraph is front matter or a logical authored-unit boundary. Semantic review, authored-unit
candidates, Developer opinions, bibliography candidates, database changes, rule changes, and
runtime incorporation have not begun. Gameplay content is unchanged.

The first generated `SourceReviewSnapshot` is therefore metadata-only. It records the unresolved
heading-boundary warning and asks whether the aggregate should remain semantically quarantined. It
does not contain the private heading or source prose and cannot resolve the ambiguity by itself.
Semantic atomization remains blocked until a source-specific acknowledged one-unit review or a
separate local-only boundary inspector can show sufficient private context without widening the
runtime or portable-review surface.

The aggregate is one physical, private, hashed `SourceDocument`, but each original article is a
separate future `AuthoredSourceUnit`. Article units preserve title, byline, original URL/venue,
original and revised dates, heading path, chunk IDs, asserted authorship, rights status, and
currentness. Short atomic `DeveloperOpinion` candidates and unverified `BibliographicCandidate`
records derive from each unit. The original articles are not automatically formal evidence, and
their bibliography does not automatically support every nearby statement.

Before semantic review or any optional external processing, the user must confirm:

- the export contains no identifiable patient information;
- it is appropriate to store and process locally;
- authorship and any known residency/employer reuse restrictions;
- whether external AI processing is permitted, if that optional workflow is ever requested; and
- that third-party quotations, tables, figures, scales, screenshots, and publisher material can be
  excluded.

Markdown remains a good interchange format for a long multi-article export. DOCX extraction now
uses Mammoth's default heading mappings with embedded document style maps disabled, drops images
without reading their bytes, parses the generated fragment as inert data, and retains both the
leaf section and complete H1–H6 heading path. Heading structure is a candidate boundary, not proof
that an article unit is complete; ambiguous boundaries still create review work rather than a
guess.

Review proceeds one article or small topic cluster at a time. Each batch shows proposed concise
opinions, original dates, cited-source candidates and their verification state, newer potentially
conflicting evidence, and affected catalog IDs. Accepted opinions remain Developer opinion and
must pass a separate change proposal, impact scan, clinical review, and balance decision before
affecting gameplay.

The intended reviewer surface is mobile as well as desktop. Each batch must be short enough to
review on a phone and retain a typed, immutable snapshot of the source unit, concise derived
summary, atomic proposals, provenance, uncertainty, conflicts, and affected IDs. The reviewer
supplies plain-language guidance; saving it does not directly edit content. The durable loop is:
phone-friendly concise packet → plain-language reviewer judgment → canonical Codex versioned
proposal → explicit database/rule edit → Database plus affected patient/reference-run audit. The
source, the reviewer’s Developer opinion, the implemented rule, and point balance remain
separable throughout.

## Implemented commands

| Command                                                  | Behavior                                                                                                                                                                                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm content:scan`                                      | Hash direct inbox files, detect byte-identical duplicates, write the local manifest, and retain unsupported inputs in quarantine.                                                                                               |
| `pnpm content:extract`                                   | Parse discovered inputs, verify the pre-extraction hash, write document/chunk records atomically, and retain originals under processed or quarantine.                                                                           |
| `pnpm content:extract -- --refresh-entry <manifest-id>`  | Explicitly re-extract one older-parser source, archive its prior private artifact, and update only that entry. Already-current, missing, and non-extracted entries are rejected.                                                |
| `pnpm content:watch`                                     | Watch the inbox and serialize the same scan/extract functions; it adds no alternate behavior.                                                                                                                                   |
| `pnpm content:notes:audit -- --folder "Psych research"`  | Record Apple Notes IDs, dates, locked/shared flags, and counts without reading note titles, bodies, or attachment bytes.                                                                                                        |
| `pnpm content:notes:sync -- --folder "Psych research" …` | After all required acknowledgments, export changed unlocked notes privately, hash attachments, run local image/PDF OCR by default, checkpoint each note, queue deterministic Markdown composites, then scan and extract them.   |
| `pnpm content:notes:validate`                            | Validate the ignored Apple Notes manifest, unique records, protected paths, and attachment byte hashes without printing source text.                                                                                            |
| `pnpm content:notes:codex-review -- --next …`            | After separate external-processing acknowledgments, prepare one bounded private title/plaintext packet plus a hash-only audit record; make no provider or API call.                                                             |
| `pnpm content:knowledge:index -- --refresh --next`       | Refresh one bounded topic's private lexical queue and report only aggregate counts plus an opaque next record; matching does not establish a claim.                                                                             |
| `pnpm content:knowledge:prepare -- …`                    | Release the next missing segment from the prioritized source revision under explicit acknowledgments; make no provider or API call.                                                                                             |
| `pnpm content:knowledge:import -- <private-result>`      | Strictly validate and idempotently import one private candidate classification; create no evidence, rules, points, tickets, citations, or approval.                                                                             |
| `pnpm content:knowledge:status`                          | Validate queue/workspace state and refresh the ignored, read-only local Developer projection without printing private content.                                                                                                  |
| `pnpm content:source-review:prepare`                     | Validate and persist one complete parser-v5 source unit as an immutable safe Developer ticket plus a separate private locator; make no rule, point, approval, or runtime change.                                                |
| `pnpm content:knowledge:review-packet`                   | Project one fully classified personal-knowledge revision into one immutable local Developer packet with one proposal per opinion candidate; preserve exact private provenance in the paired locator and make no content change. |
| `pnpm content:review`                                    | List extracted source IDs/chunk counts and current Developer review patients without printing source text.                                                                                                                      |
| `pnpm content:evidence`                                  | List every formal evidence record, linked contributions or unused status, and expert-opinion coverage.                                                                                                                          |
| `pnpm content:draft <request.json>`                      | Create a medically unreviewed patient scaffold, local provenance, and blocking clinical-audit tickets.                                                                                                                          |
| `pnpm content:compile`                                   | Schema- and semantically validate every review patient; it never promotes one.                                                                                                                                                  |
| `pnpm content:sources:validate`                          | Validate Drive/local manifests, duplicate references, document/chunk relationships, and text hashes.                                                                                                                            |

## Current local extraction inventory

The protected manifest currently contains 210 entries and 210 corresponding extracted artifacts:
204 Apple Notes Markdown composites, four formal PDFs, and two private Drive DOCX files. All six
non-Notes sources use parser v5 and every one of their 504 chunks has a locator/body
`provenanceHash`. The four PDF source chunk IDs and text hashes remained stable through refresh, so
all 12 tracked provenance references continue to resolve. No duplicate or missing active artifact
is known.

The Apple Notes corpus has 204/204 title/plaintext revisions and 124 attachment records. Local OCR
completed for 116 attachments; one format is unsupported and seven attachment saves failed while
their note text remained available. Those OCR, HTML, attachment, composite, and generic extracted
chunk representations remain outside the authorized semantic scope. The current bounded MDD queue
contains 13 exact Notes revisions: one classified into unreviewed candidates and 12 awaiting
one-revision-at-a-time review. This is review workload, not incorporated knowledge.

`Additional notes` is extracted into two parser-sized chunks but has no heading unit, so the current
complete-`sectionInstance` source-review selector deliberately cannot packetize it. Its logical
authored-unit boundaries must be reviewed before semantic use. The aggregate contains 27 heading
instances plus one unsectioned preamble and the single warning described above. Extraction
coverage is therefore high; review throughput, source rights/currentness, and immutable
adjudication—not more bulk parsing—are the limiting steps.

The scanner has a 50 MiB per-file safety bound and ignores dotfiles. It uses a content hash plus filename-derived stable entry ID, so re-running the same inbox converges while a differently named byte-identical file receives a duplicate record linked to its primary. Successful originals are renamed into `processed/` with their manifest ID; duplicates go to `archive/`; failures go to `quarantine/`. None is deleted.

Success writes extracted artifacts before moving the original and marks the manifest extracted last. Failures retain the original with a clear status/error. A rerun reuses stable content-derived document and chunk IDs rather than creating new provenance records. Watch mode is merely a development convenience over the same idempotent functions.

## File and extraction strategy

PDF parsing uses a developer-only PDF.js dependency and preserves page numbers. DOCX parsing uses
developer-only Mammoth plus parse5: Mammoth creates inert HTML with embedded style maps disabled
and a no-read image converter, while parse5 retains visible block text and H1–H6 paths without
executing or preserving tags, attributes, links, scripts, styles, or images. TXT is normalized and
paragraph-chunked; Markdown also preserves heading paths. The common parser splits oversized text
into bounded chunks, removes NULs, normalizes line endings, and never evaluates macros, scripts,
links, or embedded instructions. New parser runs record `psychsim-source-parser-5`, a document text
hash, ordered chunks, page/section/section-path context where available, a deterministic
section-boundary instance for sectioned chunks, a hash for the exact local chunk text, and a
locator/body provenance hash for every chunk. DOCX parser warnings and their total count are
retained in the private document record so ambiguous styles or truncated warning lists cannot
disappear from semantic review.

A parser upgrade never silently rewrites prior extracted artifacts because existing tracked
source-chunk IDs depend on source hash and ordinal. Re-extraction therefore requires one exact
manifest ID, rejects an already-current entry, preserves the prior artifact under
`extracted/history/`, validates every integrity field available in the old parser version,
requires an existing same-named history revision to be equivalent, serializes scan/extract behind
a fixed atomic stale-recovery claim that fails closed if an earlier claim requires inspection,
operations with a private lock, compares the manifest fingerprint before commit, and uses a
durable marker to recover after interruption. Parser-v1/v2 locator metadata predates provenance
hashes and cannot be retrospectively authenticated. The general file pipeline still has no silent
OCR fallback. OCR is an explicit, provider-scoped capability of `content:notes:sync`: macOS Vision
processes only exported Apple Notes image/PDF attachments, records its engine and outcome, and can
be disabled with `--skip-ocr`.

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
