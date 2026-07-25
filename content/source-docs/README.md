# Local source-document inbox

Do **not** place identifiable patient information here. Assume every file may be confidential or copyrighted. This directory is a local developer-authoring boundary and is never part of browser gameplay or the production web bundle.

Folder contract:

- `inbox/`: newly supplied PDF, DOCX, TXT, or Markdown files, including deterministic Apple Notes
  composites, awaiting a SHA-256 scan.
- `processed/`: successfully parsed local source files.
- `archive/`: intentionally retired source files retained by the author.
- `quarantine/`: files that failed scanning or extraction, with an eventual explicit error record.
- `extracted/`: local-only structured text/chunks and the private Apple Notes export tree under
  `extracted/apple-notes-private/`.
- `manifests/`: local-only hash and provenance records, including `apple-notes-intake.json`.

The user-designated Google Drive folder `PsychSim documents` is treated as a remote inbox. Its account-specific discovery manifest belongs in `manifests/google-drive-discovery.json` and remains ignored. An explicit folder check records new Drive candidates, then downloaded bytes must receive a SHA-256 hash before deduplication or extraction. Discovery alone never updates clinical scoring.

The macOS Apple Notes source is the folder named exactly `Psych research`. Start with
`pnpm content:notes:audit -- --folder "Psych research"`; this records account, folder, note, and
attachment IDs, dates, locked/shared flags, and aggregate counts without reading note titles,
bodies, or attachment bytes. The audit fails unless exactly one folder matches, including nested
folders across Notes accounts.

Body and attachment export is deliberately separate. Run it only after confirming that the entire
folder contains no identifiable patient information, is authorized for private local processing,
and may be processed despite any shared-note or shared-folder status:

```sh
pnpm content:notes:sync -- --folder "Psych research" \
  --ack-no-phi \
  --ack-authorized-local-processing \
  --ack-shared-material-rights \
  --acknowledged-by "Your name"
```

The sync writes exact provider provenance and acknowledgment data to the ignored manifest, stores
private note exports with restrictive permissions, hashes every accessible attachment, records
byte-identical attachment relationships, and uses macOS Vision locally for image/PDF OCR. Pass
`--skip-ocr` to export without OCR. Locked notes remain metadata-only; changed notes create a new
private revision; missing notes and failures remain recorded rather than being silently deleted.
An attachment that the public Notes scripting interface cannot save is quarantined independently,
so usable title/plaintext from the note can still enter review without pretending the attachment
was read. The manifest checkpoints after every note so an interrupted bulk run can resume without
re-exporting completed records. Each reviewable note becomes a deterministic Markdown composite
that enters the ordinary `content:scan` and `content:extract` path. Validate provider metadata and
attachment hashes with `pnpm content:notes:validate` or the combined
`pnpm content:sources:validate` command.

A second, separately acknowledged boundary may prepare one private title/plaintext segment for a
future Codex-assisted semantic review:

```sh
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

This command creates a mode-`0600` packet under the ignored private Notes tree and a hash-only
audit; it performs no provider or network call. It reads only verified `title.txt` and
`plaintext.txt`, one bounded segment at a time, and rejects symlink/path escapes. Do not guess the
model identifier or treat the packet as a citation, clinical rule, or medical approval.

Only `.gitkeep` markers are tracked. The root `.gitignore` excludes source material, Apple Notes
exports, extracted text, OCR text, and manifests by default. Never silently delete an input or a
provider record. Implemented commands are documented in
[DOCUMENT_INGESTION.md](../../docs/DOCUMENT_INGESTION.md): scanning hashes and deduplicates;
extraction supports PDF, DOCX, TXT, and Markdown; Apple Notes audit and acknowledged sync preserve
provider provenance and keep OCR local; watch mode runs the same idempotent path; review lists
local artifacts; and drafting creates a controlled Developer-only patient scaffold from an
explicit request.

Raw extraction is not a citation database. A formal article, guideline, or regulatory source must also have a tracked bibliographic entry under `content/catalogs/evidence/formal/`, and each clinical use must record what it contributed. Uncataloged notes and personal material are Expert opinion and cannot inherit a formal citation.

Free-to-read is not the same as free to process. Check the formal record's `accessPolicy` before
putting a publication in `inbox/`. A source marked `permission_required` or `prohibited` for local
extraction or AI use remains metadata-only until written permission or a verified terms change is
recorded. Do not route around publisher restrictions by using a mirror.

Document text is untrusted data, never an instruction stream. No implemented command sends it to an external AI provider. Any future provider must require an explicit command-line opt-in and an acknowledgment that the material is appropriate to send; the local scaffold path remains available without a provider.
