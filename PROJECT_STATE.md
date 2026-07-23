# PsychSim project state

Last updated: 2026-07-22

## Repository state

- Current branch: `main`.
- Current phase: Milestone 3 complete; clinical adjudication checkpoint before any Milestone 4 work.
- Current block: the user must resolve the proposed CANMAT MDD and ECG rule-level tickets before their claims or point weights change.
- Latest relevant commit: the Developer reviewer-notes and local Codex-handoff checkpoint at `HEAD` after this batch is published.
- Expected working tree: clean after the current checkpoint commit.
- Remote synchronized: push the validated checkpoint normally to `origin/main`, verify CI, and adopt the resulting handoff snapshot before resuming work.

## Last completed action

The book repository's canonical-thread lease architecture and Milestone 3 checkpoint are published. CANMAT remains decomposed into five unresolved rule tickets (assessment, modality/severity, antidepressant baseline/fit, psychotherapy, and disposition), and the ECG prototype exposes three unresolved tickets for ECG necessity/weight, continuation-versus-switch treatment, and disposition. Developer mode now gives every ticket editable reviewer notes. Saving a review persists status, notes, and timestamps in IndexedDB and automatically writes the complete version-2 bundle to the fixed gitignored Codex handoff file; the manual control retries that copy, and Playwright uses a separate `.e2e` file. Local format, lint, typecheck, 93 TypeScript tests, 10 handoff tests, content validation, three browser tests, and production build pass.

## Current work

Hook trust remains an explicit local Codex `/hooks` action. The next work proceeds in this order:

1. The user reviews the five CANMAT and three ECG tickets in Developer mode, records reviewer notes, chooses a disposition, and saves each review.
2. The user tells Codex the local review is ready; Codex reads `content/generated/local-review-tickets/tickets.json` and confirms the exact accepted, narrowed, rejected, or deferred instructions before changing executable content.
3. Apply only the tickets the user explicitly accepts or narrows, creating new clinical content versions and rerunning affected reference policies.
4. Rebalance facility/decor point values only after the user has playtested the completed Milestone 3 loop.
5. Do not start departments/Milestone 4 until the clinical and economy checkpoint is accepted.

## Exact next action

Wait for the user to review tickets in the local Developer UI and say the review is ready. Then read the fixed handoff file, summarize the recorded dispositions and reviewer notes for confirmation, and edit only explicitly accepted or narrowed executable clinical rules.

## Blockers and review state

- No technical blocker is known.
- Formal-source catalog presence is not medical approval.
- CANMAT is cataloged and ticketed but still has no applied contribution.
- The ECG source contribution is recorded, while its clinical rule weights and decisions remain medically unreviewed.
- Eight authored source/audit tickets remain proposed until the user supplies the disposition.
- Milestone 4 is intentionally not started.

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
- `content/cases/review/canmat-2023-mdd-source-review.tickets.json`
- `content/cases/approved/medication-check-palpitations.case.json`
- `content/catalogs/locations/facilities.json`
- `content/catalogs/decor/decor.json`
- `packages/engine/src/progression.ts`
- `packages/engine/src/satisfaction.ts`
- `scripts/codex_handoff.py`
- `.codex/hooks.json`
