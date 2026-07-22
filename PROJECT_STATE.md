# PsychSim project state

Last updated: 2026-07-22

## Repository state

- Current branch: `main`.
- Current phase: formal-evidence review and clinical ticket preparation before Milestone 3.
- Current block: process the CANMAT MDD source one document at a time, then prepare the ECG rule-review checkpoint.
- Latest relevant commit: `HEAD`.
- Local `HEAD` and `origin/main` matched at the start of this block.
- Expected working tree: clean after the current evidence/provenance and handoff checkpoint commit.
- Remote synchronized: the checkpoint is intended to be pushed normally to `origin/main`; verify before resuming work.

## Last completed action

The phone-thread evidence catalog, rule-level contribution snapshots, receipt evidence display, and patient-scaffolding provenance changes were audited. PsychSim now also contains the book repository's tested canonical-thread lease architecture, adapted with a durable project-state owner, gitignored local lease, phone/Mac prepare and resume commands, direct-fork/drift/active-turn guards, lifecycle hooks, and 10 deterministic tests. The full checkpoint passed formatting, lint, strict TypeScript, 83 TypeScript tests, 10 handoff tests, content/source/Developer validation, reference policies, production build safety, and two Playwright tests. CANMAT metadata was verified against PubMed and its 2025 corrigendum; the citalopram source now links to the stable official DailyMed 2023 label.

## Current work

Hook trust remains an explicit local Codex `/hooks` action. After the synchronization checkpoint is committed and pushed, work proceeds in this order:

1. Prepare a one-source-at-a-time CANMAT MDD review packet and unresolved clinical tickets. Do not infer or apply conclusions automatically.
2. Prepare ECG-case tickets for ECG necessity, citalopram continuation/change, disposition, and point weights. The user resolves clinical judgment.
3. Implement the bounded Milestone 3 progression/environment scope from `docs/ROADMAP.md`.

## Exact next action

Create a source-review packet for the cataloged CANMAT MDD guideline. Identify candidate contributions and affected rule IDs, generate unresolved tickets, and stop before applying any clinical conclusion that requires user judgment.

## Blockers and review state

- No technical blocker is known.
- Formal-source catalog presence is not medical approval.
- CANMAT is cataloged but has no applied contribution.
- The ECG source contribution is recorded, while its clinical rule weights and decisions remain medically unreviewed.
- Clinical tickets created in the next steps must remain unresolved until the user supplies the disposition.

## Files to read for the current task

- `AGENTS.md`
- `README.md`
- `PROJECT_STATE.md`
- `docs/CODEX_THREAD_HANDOFF.md`
- `docs/ROADMAP.md`
- `docs/CONTENT_REVIEW.md`
- `docs/DECISIONS.md`
- `content/registry.json`
- `content/catalogs/evidence/formal/`
- `content/cases/approved/medication-check-palpitations.case.json`
- `scripts/codex_handoff.py`
- `.codex/hooks.json`
