# PsychSim project state

Last updated: 2026-07-22

## Repository state

- Current branch: `main`.
- Current phase: Milestone 3 complete; clinical adjudication checkpoint before any Milestone 4 work.
- Current block: the user must resolve the proposed CANMAT MDD and ECG rule-level tickets before their claims or point weights change.
- Latest relevant commit: the Milestone 3/ticket checkpoint at `HEAD` after this batch is published.
- Expected working tree: clean after the current checkpoint commit.
- Remote synchronized: push the validated checkpoint normally to `origin/main`, then verify before resuming work.

## Last completed action

The book repository's canonical-thread lease architecture was adapted and published with the formal-evidence checkpoint. CANMAT was then decomposed into five unresolved rule tickets (assessment, modality/severity, antidepressant baseline/fit, psychotherapy, and disposition) without being applied. The ECG prototype already exposes three unresolved tickets for ECG necessity/weight, continuation-versus-switch treatment, and disposition. Milestone 3 now implements threshold-gated facility moves, one/two/three persistent slots, waiting-patient relocation, explicit internal patient pools, broader location/path eligibility validation, visible decor, and a diminishing capped positive-reward satisfaction multiplier. Unit, component, and browser tests cover the new behavior; final all-command validation and publication are the remaining steps in this checkpoint.

## Current work

Hook trust remains an explicit local Codex `/hooks` action. The next work proceeds in this order:

1. Present the five CANMAT and three ECG tickets to the user in a compact decision pass.
2. Apply only the tickets the user explicitly accepts or narrows, creating new clinical content versions and rerunning affected reference policies.
3. Rebalance facility/decor point values only after the user has playtested the completed Milestone 3 loop.
4. Do not start departments/Milestone 4 until the clinical and economy checkpoint is accepted.

## Exact next action

Ask the user to resolve the blocking CANMAT initial-modality and antidepressant-baseline tickets first, followed by psychotherapy, assessment/workup, disposition, and the three ECG tickets. Record the user's exact dispositions before editing executable clinical rules.

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
