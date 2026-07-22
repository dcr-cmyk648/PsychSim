# Source-document ingestion and patient scaffolding

The protected authoring boundary now has a bounded local vertical slice: SHA-256 scanning, duplicate detection, PDF/DOCX/TXT/Markdown extraction, ordered text chunks, watch mode, manifest validation, a controlled patient scaffolder, and automatic Developer-mode discovery. It is not the full Milestone 6–7 workflow: there is no OCR, automatic Google Drive OAuth downloader, claim-review UI, external AI provider, critic model, or automatic clinical-rule authoring.

Three records remain deliberately separate: private `SourceDocument`/`SourceChunk` text, tracked formal `EvidenceSourceDefinition` bibliography, and `EvidenceContribution` application notes. A PDF does not become formal evidence merely because it looks academic. Formal use requires a catalog entry; anything else is Expert opinion until a human classifies and catalogs it.

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

## Google Drive remote inbox

The user-designated folder is `PsychSim documents`. The folder ID and discovered file IDs live only in `content/source-docs/manifests/google-drive-discovery.json`, not tracked product content. On an explicit request to check the folder:

1. Locate the folder through Drive rather than assuming a cached title match.
2. List direct children and compare provider file ID, size, MIME type, and modified version/time with the local discovery manifest.
3. Pull each new or changed file, compute SHA-256 over its bytes, and compare that hash with all prior sources.
4. Record exact duplicates without reprocessing them. Never use filename or modified time as the deduplication authority.
5. Queue genuinely new hashes in stable discovery order and work through one source at a time.
6. Create concise claim/change proposals with target catalog IDs and provenance. Do not modify scoring, medication modifiers, or patients during discovery.
7. Require explicit human acceptance plus validators/reference runs before a proposal becomes reviewed content.

The current connector check found one PDF candidate, the 2023 CANMAT adult-MDD update (5,179,128 bytes), matching the local-only discovery record and SHA-256. Its bibliographic identity is now cataloged, but the private PDF remains locally unextracted and no contribution is linked to a clinical rule. The connected-Drive action and the local CLI intentionally remain separate security boundaries: raw downloaded bytes are placed in `inbox/`, then the local byte-based scanner becomes the authority. The CLI does not embed a personal OAuth token or pretend connector metadata is extracted content.

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

`PatientScaffoldRequest` is a versioned, Zod-validated request. It identifies an existing approved template, a new patient ID/internal title, at least ten short chief complaints, an adult age range, and optional source uses containing explicit formal-publication versus expert-opinion authority, formal evidence IDs where applicable, exact document/chunk IDs, contribution categories, and a concise original summary. The compiler rejects unresolved provenance, uncataloged formal evidence, expert opinion carrying a formal citation, and duplicate output unless `--force` is explicit.

The scaffolder intentionally does less than a clinical generator. It copies executable facts/rules from the named template, changes only controlled presentation/provenance fields, resets every clinical rule to `unreviewed`, writes generation provenance locally, and creates two proposed tickets: a blocking audit of inherited rules and a source-application audit. It never treats article text as an instruction or changes scoring from a source summary. The resulting `*.case.json` and companion `*.tickets.json` live in `content/cases/review/`; Vite's development-only content module discovers them for Developer mode. Production still imports approved cases only.

Use [the tracked basic-MDD request](../content/cases/blueprints/basic-mdd-scaffold.example.json) to test a clean checkout. A source-backed request follows `scan → extract → review IDs → draft → compile → Developer mode`. This creates a playtest scaffold, not medically approved content.

## Privacy, copyright, and untrusted input

Never place identifiable patient information in this folder. Assume sources may be confidential or copyrighted. Keep originals, derived text, and manifests local and out of Git; control filesystem access; do not reproduce long passages. Game outputs must be original fictional cases with concise derived teaching points.

Document text is untrusted data, not instructions. Parsers treat it as bytes/text only. Prompt injection, shell snippets, macros, links, and embedded instructions are not followed or executed. Parsers run with bounded file size/type handling, normalize output, and surface failures. No source file is served from `public/` or imported by application code.

## External AI opt-in

Local-only and deterministic mock drafting work without a provider. No external provider is implemented. A future provider may send source text only with a command flag, an interactive acknowledgment that the operator has rights and the material is appropriate to transmit, an explicit provider/model, and an audit record of referenced document/chunk IDs. No implicit environment-based send is allowed. API keys stay in local environment/secret storage, never source control, output files, browser code, or prompts saved for review.

## Provenance and human control

Drafts retain document/chunk IDs, hashes, parser/model/prompt/generator versions, validation/critic results, and repairs. Imported personal notes begin as protected author overrides, not evidence-backed global modifiers. A future AI provider may see only allowed catalog IDs and cannot invent predicate types or approve content. A clinician must review and explicitly approve any eventual production medical content. Source deletion/archival and content deprecation remain separate actions so provenance is never silently broken.
