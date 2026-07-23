# PsychSim project state

Last updated: 2026-07-23

## Repository state

- Current branch: `main`.
- Current phase: Milestone 3 complete; pre-Milestone 4 diagnosis/patient-composition engine checkpoint complete.
- Current block: wait for the user’s data-model decisions and additional guidelines before enabling optional comorbidity generation, sourced severity, diagnosis-derived scoring, or new clinical point values.
- Latest relevant implementation commit: `ac47eb7` (`Build diagnosis composition engine foundation`).
- Expected working tree: clean after the current checkpoint commit.
- Remote synchronized: `ac47eb7` is on `origin/main`; GitHub Actions run `30014038038` passed formatting, lint, typecheck, unit/content/browser gates, source boundaries, Developer compilation, and the production build.

## Last completed action

The user redirected work away from hand-tuning point values and toward the reusable clinical engine. The checkpoint now has:

- a read-only exact-rule audit on every Developer ticket plus a five-item, runtime-excluded source-request queue;
- one versioned file per diagnosis family, including medically unreviewed placeholders for MDD, bipolar-spectrum disorder, substance-induced mood disorder, medication-induced akathisia, and borderline personality disorder;
- top-down diagnosis composition across shared rules, selected severity, selected specifiers, and multiple active diagnoses;
- point-free qualitative recommendation stances with constrained patient and treatment predicates;
- deterministic gameplay-critical patient context that binds the same short structured finding to the tags used by treatment-fit logic and saves the resolved choice in the CaseInstance;
- blocking conflicts for missing definitions, disabled severity, mutually exclusive diagnoses/specifiers, and incompatible active guidance;
- a traceable five-dimensional complexity vector without a premature player-level formula;
- semantic validation for all diagnosis, rule, evidence, patient-composition, context-binding, test-profile, source-request, and registry references.

MDD mild/moderate/severe live in one family file but remain `disabled_pending_source` with no invented thresholds or treatment rules. Optional comorbidity authoring is modeled, while random selection is absent from approved patients pending a pool-policy decision. No approved case, treatment point, workup point, settlement value, or reference policy changed.

Format, lint, strict typecheck, 109 TypeScript tests, 10 handoff tests, content/source validation, two Developer-patient compiles, evidence audit, reference runs, three browser tests, and production build/bundle isolation pass. The only build notice is Vite’s existing chunk-size advisory.

## Current work

Proceed in this order:

1. Ask the user to resolve the six focused questions in `docs/DIAGNOSIS_ENGINE.md`: conflict handling, comorbidity pool ownership, objective fit versus discovery credit, complexity aggregation, patient-specific overrides, and typed clinical facts versus free tag strings.
2. Record each answer in `docs/DECISIONS.md` before extending the schema or enabling generation.
3. When the user supplies additional guidelines, process one source and one claim set at a time. Create exact contributions/tickets; do not propagate a publication directly into diagnosis, medication, test, or patient rules.
4. Populate one diagnosis family only after its reusable rules, severity/specifier boundaries, conflicts, and provenance are explicit. Keep its recommendation stance qualitative until a separate balance policy is reviewed.
5. Add a patient-family clinical-context dimension only when every option controls the same structured findings and every clinically relevant random value is replayable.
6. Re-run affected validation/reference policies for every executable rule change. Do not start departments/Milestone 4 while this clinical model is still being settled.

## Exact next action

Receive and record the user’s engine-policy answers. The recommended first implementation after that is a first-class typed clinical-fact/derivation catalog plus a versioned patient-specific override record, followed by deterministic patient-family comorbidity selection if the recommended pool policy is accepted. Do not tune existing point magnitudes or enable MDD severity before its open source request is resolved.

## Blockers and review state

- No technical blocker is known.
- Six architecture choices remain open in `docs/DIAGNOSIS_ENGINE.md`; the implementation intentionally does not guess them.
- Five tracked source requests remain open: ECG monitoring necessity, ECG continuation/switching, TSH indications, MDD severity thresholds, and suicide-risk/disposition mapping.
- Formal-source catalog presence is not medical approval.
- CANMAT is cataloged and ticketed but still has no applied contribution.
- The ECG source contribution is recorded, while its clinical rule weights and decisions remain medically unreviewed.
- Ten tickets contain reviewer instructions. Their internal legacy statuses are not user decisions and must not block interpretation of the prose.
- Current diagnosis files are structural and medically unreviewed; placeholder relationships and treatment rules are intentionally empty.
- Optional-comorbidity probabilities are authoring data only until a selection policy is accepted and implemented.
- The current exact-rule audit is a display/inspection layer only; all values remain medically unreviewed unless their individual review record says otherwise.
- Milestone 4 is intentionally not started.

## Files to read for the current task

- `AGENTS.md`
- `README.md`
- `PROJECT_STATE.md`
- `docs/CODEX_THREAD_HANDOFF.md`
- `docs/ROADMAP.md`
- `docs/DIAGNOSIS_ENGINE.md`
- `docs/CONTENT_MODEL.md`
- `docs/CONTENT_REVIEW.md`
- `docs/DECISIONS.md`
- `content/registry.json`
- `content/catalogs/diagnoses/definitions/`
- `content/cases/review/source-needed.requests.json`
- `packages/schemas/src/index.ts`
- `packages/engine/src/diagnosis.ts`
- `packages/engine/src/case.ts`
- `packages/content-runtime/src/validation.ts`
- `packages/content-runtime/src/review-inspector.ts`
- `packages/content-runtime/src/source-requests.ts`
- `apps/web/src/components/CaseRuleAuditView.tsx`
- `apps/web/src/components/SourceRequestQueue.tsx`
