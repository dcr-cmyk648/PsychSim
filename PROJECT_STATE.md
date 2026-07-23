# PsychSim project state

Last updated: 2026-07-22

## Repository state

- Current branch: `main`.
- Current phase: Milestone 3 complete; clinical adjudication checkpoint before any Milestone 4 work.
- Current block: the user must resolve the proposed CANMAT MDD and ECG rule-level tickets before their claims or point weights change.
- Latest relevant commit: the instruction-only Developer ticket checkpoint at `HEAD` after this batch is published.
- Expected working tree: clean after the current checkpoint commit.
- Remote synchronized: push the validated checkpoint normally to `origin/main`, verify CI, and adopt the resulting handoff snapshot before resuming work.

## Last completed action

The book repository's canonical-thread lease architecture and Milestone 3 checkpoint are published. The user reviewed ten CANMAT, ECG, and scaffold tickets in the local handoff file. Developer mode now removes the overlapping user-facing lifecycle-status menu and gives every ticket one “What should Codex do?” field. Saving nonempty instructions marks the ticket internally reviewed, persists the prose and timestamp in IndexedDB, and automatically writes the complete version-2 bundle to the fixed gitignored Codex handoff file. Tickets without input stay prominent; reviewed tickets move into a collapsible section. The manual control retries the copy, and Playwright uses a separate `.e2e` file. Local format, lint, typecheck, 93 TypeScript tests, 10 handoff tests, content validation, three browser tests, and production build pass.

## Current work

Hook trust remains an explicit local Codex `/hooks` action. The next work proceeds in this order:

1. Treat the user's saved prose as the authoritative requested outcome; infer implement/preserve/defer/source/clarify and ask only if a consequential ambiguity remains.
2. First improve tickets so they expose exact case rewards, penalties, cannot-miss rules, treatment choices, and current values, and add a source-needed/provenance follow-up path for questions that need an article or authoritative source.
3. Then implement the clear broad-pathway directions: equal base value for acceptable first-line options, separate patient-fit modifiers, per-therapy catalog entries, structured severity variation after sourcing thresholds, and reason-sensitive workup value.
4. Keep current ECG values provisionally where the notes say they are acceptable; defer exact switching and risk/TSH provenance until the requested sources and patient-specific variables exist.
5. Re-run affected validation/reference policies for every executable rule change. Do not start departments/Milestone 4 until the clinical and economy checkpoint is accepted.

## Exact next action

Implement the compact exact-rule ticket presentation and source-needed/provenance follow-up system requested in the saved instructions. The user does not need to choose or confirm lifecycle statuses.

## Blockers and review state

- No technical blocker is known.
- Formal-source catalog presence is not medical approval.
- CANMAT is cataloged and ticketed but still has no applied contribution.
- The ECG source contribution is recorded, while its clinical rule weights and decisions remain medically unreviewed.
- Ten tickets contain reviewer instructions. Their internal legacy statuses are not user decisions and must not block interpretation of the prose.
- Exact depression-severity thresholds, TSH rules, suicide-risk provenance, and detailed ECG switching logic still need sourced specification.
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
