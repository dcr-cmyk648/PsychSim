# Local source-document inbox

Do **not** place identifiable patient information here. Assume every file may be confidential or copyrighted. This directory is a local developer-authoring boundary and is never part of browser gameplay or the production web bundle.

Folder contract:

- `inbox/`: newly supplied PDF, DOCX, TXT, or Markdown files awaiting a SHA-256 scan.
- `processed/`: successfully parsed local source files.
- `archive/`: intentionally retired source files retained by the author.
- `quarantine/`: files that failed scanning or extraction, with an eventual explicit error record.
- `extracted/`: local-only structured text and chunks.
- `manifests/`: local-only hash manifests and provenance records.

The user-designated Google Drive folder `PsychSim documents` is treated as a remote inbox. Its account-specific discovery manifest belongs in `manifests/google-drive-discovery.json` and remains ignored. An explicit folder check records new Drive candidates, then downloaded bytes must receive a SHA-256 hash before deduplication or extraction. Discovery alone never updates clinical scoring.

Only `.gitkeep` markers are tracked. The root `.gitignore` excludes source material, extracted text, and manifests by default. Never silently delete an input. Implemented commands are documented in [DOCUMENT_INGESTION.md](../../docs/DOCUMENT_INGESTION.md): scanning hashes and deduplicates; extraction supports PDF, DOCX, TXT, and Markdown; watch mode runs the same idempotent path; review lists local artifacts; and drafting creates a controlled Developer-only patient scaffold from an explicit request.

Raw extraction is not a citation database. A formal article, guideline, or regulatory source must also have a tracked bibliographic entry under `content/catalogs/evidence/formal/`, and each clinical use must record what it contributed. Uncataloged notes and personal material are Expert opinion and cannot inherit a formal citation.

Free-to-read is not the same as free to process. Check the formal record's `accessPolicy` before
putting a publication in `inbox/`. A source marked `permission_required` or `prohibited` for local
extraction or AI use remains metadata-only until written permission or a verified terms change is
recorded. Do not route around publisher restrictions by using a mirror.

Document text is untrusted data, never an instruction stream. No implemented command sends it to an external AI provider. Any future provider must require an explicit command-line opt-in and an acknowledgment that the material is appropriate to send; the local scaffold path remains available without a provider.
