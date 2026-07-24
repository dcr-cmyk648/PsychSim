# Source-document ingestion and patient scaffolding

The protected authoring boundary now has a bounded local vertical slice: SHA-256 scanning, duplicate detection, PDF/DOCX/TXT/Markdown extraction, ordered text chunks, watch mode, manifest validation, a controlled patient scaffolder, and automatic Developer-mode discovery. It is not the full Milestone 6–7 workflow: there is no OCR, automatic Google Drive OAuth downloader, claim-review UI, external AI provider, critic model, or automatic clinical-rule authoring.

Three records remain deliberately separate: private `SourceDocument`/`SourceChunk` text, tracked formal `EvidenceSourceDefinition` bibliography, and `EvidenceContribution` application notes. A PDF does not become formal evidence merely because it looks academic. Formal use requires a catalog entry; anything else is Expert opinion until a human classifies and catalogs it.

Before downloading or processing bytes, the authoring workflow requires an applicable
`SourceUseDecision`. Public readability and bibliographic verification are not permission. Storage,
local extraction, local structured indexing, AI-assisted processing, derived clinical content,
runtime redistribution, and commercial distribution are separate permissions; a blocked or absent decision leaves the
source metadata-only. The complete contract is
[SOURCE_USE_POLICY.md](SOURCE_USE_POLICY.md).

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
  extracted/   local-only normalized document/chunk packages
  manifests/   local-only SHA-256/status/provenance records
```

Only `.gitkeep` files and the warning README are tracked. Root ignore rules protect every other file in these folders, including the account-specific Drive discovery manifest. Vite imports neither this directory nor content tooling; a bundle-safety test scans production output.

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

| Command                             | Behavior                                                                                                                                              |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm content:scan`                 | Hash direct inbox files, detect byte-identical duplicates, write the local manifest, and retain unsupported inputs in quarantine.                     |
| `pnpm content:extract`              | Parse discovered inputs, verify the pre-extraction hash, write document/chunk records atomically, and retain originals under processed or quarantine. |
| `pnpm content:watch`                | Watch the inbox and serialize the same scan/extract functions; it adds no alternate behavior.                                                         |
| `pnpm content:review`               | List extracted source IDs/chunk counts and current Developer review patients without printing source text.                                            |
| `pnpm content:evidence`             | List every formal evidence record, linked contributions or unused status, and expert-opinion coverage.                                                |
| `pnpm content:draft <request.json>` | Create a medically unreviewed patient scaffold, local provenance, and blocking clinical-audit tickets.                                                |
| `pnpm content:compile`              | Schema- and semantically validate every review patient; it never promotes one.                                                                        |
| `pnpm content:sources:validate`     | Validate Drive/local manifests, duplicate references, document/chunk relationships, and text hashes.                                                  |

The scanner has a 50 MiB per-file safety bound and ignores dotfiles. It uses a content hash plus filename-derived stable entry ID, so re-running the same inbox converges while a differently named byte-identical file receives a duplicate record linked to its primary. Successful originals are renamed into `processed/` with their manifest ID; duplicates go to `archive/`; failures go to `quarantine/`. None is deleted.

Success writes extracted artifacts before moving the original and marks the manifest extracted last. Failures retain the original with a clear status/error. A rerun reuses stable content-derived document and chunk IDs rather than creating new provenance records. Watch mode is merely a development convenience over the same idempotent functions.

## File and extraction strategy

PDF parsing uses a developer-only PDF.js dependency and preserves page numbers. DOCX parsing uses a developer-only Mammoth dependency. TXT is normalized and paragraph-chunked; Markdown additionally preserves heading context. The common parser splits oversized text into bounded chunks, removes NULs, normalizes line endings, and never evaluates macros, scripts, links, or embedded instructions. Each parser run records `psychsim-source-parser-1`, a document text hash, ordered chunks, page/section context where available, and a hash for the exact local chunk text. OCR is a later explicit capability, never a silent fallback.

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

## External AI opt-in

Local-only and deterministic mock drafting work without a provider. No external provider is implemented. A future provider may send source text only with a command flag, an interactive acknowledgment that the operator has rights and the material is appropriate to transmit, an explicit provider/model, and an audit record of referenced document/chunk IDs. No implicit environment-based send is allowed. API keys stay in local environment/secret storage, never source control, output files, browser code, or prompts saved for review.

## Provenance and human control

Drafts retain document/chunk IDs, hashes, parser/model/prompt/generator versions, validation/critic results, and repairs. Imported personal notes begin as protected author overrides, not evidence-backed global modifiers. A future AI provider may see only allowed catalog IDs and cannot invent predicate types or approve content. A clinician must review and explicitly approve any eventual production medical content. Source deletion/archival and content deprecation remain separate actions so provenance is never silently broken.
