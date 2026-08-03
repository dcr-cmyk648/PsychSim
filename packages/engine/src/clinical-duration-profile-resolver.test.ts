import {
  ConditionClinicalDurationResolutionArtifactSchema,
  type ClinicalDurationProfile,
  type ConditionClinicalDurationResolutionRequest,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  fingerprintClinicalDurationProfile,
  resolveConditionClinicalDuration,
  verifyConditionClinicalDurationResolutionIntegrity,
} from './clinical-duration-profile-resolver';

const profile: ClinicalDurationProfile = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'duration-profile.test.current-episode',
  relatedDiagnosisId: 'diagnosis.test.depressive-disorder',
  interpretation: 'supports_authored_state',
  criterionId: null,
  options: [
    {
      id: 'duration-option.test.two-weeks',
      value: 2,
      unit: 'week',
      displayValueVariants: ['two weeks', 'about two weeks'],
    },
    {
      id: 'duration-option.test.six-weeks',
      value: 6,
      unit: 'week',
      displayValueVariants: ['six weeks', 'about six weeks'],
    },
    {
      id: 'duration-option.test.twelve-weeks',
      value: 12,
      unit: 'week',
      displayValueVariants: ['twelve weeks', 'about three months'],
    },
  ],
  developerOpinionIds: ['developer-opinion.test.duration'],
  review: {
    status: 'approved',
    reviewerId: 'reviewer.test',
    reviewedAt: '2026-08-03T15:00:00.000Z',
    sourceUseNoteIds: [],
  },
};

const request = (
  seed = 'seed.test.condition-duration',
): ConditionClinicalDurationResolutionRequest => ({
  schemaVersion: 1,
  id: 'condition-duration-request.test',
  patientStateId: 'resolved-patient-state.test.condition-duration',
  conditionState: {
    schemaVersion: 1,
    id: 'condition-state.test.depressive-episode',
    diagnosisDefinitionId: 'diagnosis.test.depressive-disorder',
    diagnosisDefinitionContentVersion: '1.0.0',
    clinicalStateId: 'clinical-state.current-episode',
    timeScopeId: 'time-scope.current',
    encounterRelevance: 'focus',
    severityId: null,
    specifierIds: [],
    origin: 'authored',
    resolution: {
      origin: 'authored',
      ownerId: 'patient-template.test.condition-duration',
      ownerContentVersion: '1.0.0',
    },
  },
  profile: structuredClone(profile),
  source: {
    kind: 'patient_report',
    sourceInstanceId: 'source-instance.patient.test.condition-duration',
  },
  timeScopeId: 'time-scope.current',
  seed,
});

const resolveOrThrow = (input = request()) => {
  const result = resolveConditionClinicalDuration(input);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('D-263 condition clinical-duration profile resolver', () => {
  it('selects and freezes one exact option with complete deterministic provenance', () => {
    const artifact = resolveOrThrow();
    const selected = artifact.optionEvaluations.filter((evaluation) => evaluation.selected);

    expect(ConditionClinicalDurationResolutionArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(selected).toHaveLength(1);
    expect(artifact.resolvedDuration).toMatchObject({
      target: {
        kind: 'condition_state',
        conditionStateId: request().conditionState.id,
      },
      durationProfileId: profile.id,
      durationProfileContentVersion: profile.contentVersion,
      durationOptionId: selected[0]!.optionId,
      value: selected[0]!.value,
      unit: selected[0]!.unit,
      relatedDiagnosisId: profile.relatedDiagnosisId,
      interpretation: 'supports_authored_state',
      criterionId: null,
      source: request().source,
      timeScopeId: request().timeScopeId,
      resolution: {
        origin: 'deterministic_generation',
        generationProfileId: profile.id,
        generationProfileContentVersion: profile.contentVersion,
        resolverVersion: '1.0.0',
        stableDrawId: artifact.stableDrawId,
      },
    });
    expect(artifact.profileFingerprint).toBe(fingerprintClinicalDurationProfile(profile));
    expect(verifyConditionClinicalDurationResolutionIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('is stable for the same seed and insensitive to authoring array order', () => {
    const first = resolveOrThrow();
    expect(resolveOrThrow()).toEqual(first);

    const reordered = request();
    reordered.profile.options.reverse();
    reordered.profile.options.forEach((option) => option.displayValueVariants.reverse());
    expect(resolveOrThrow(reordered)).toEqual(first);
  });

  it('varies only among declared options across many seeds', () => {
    const allowed = new Set(profile.options.map((option) => option.id));
    const selected = new Set<string>();
    for (let index = 0; index < 256; index += 1) {
      const artifact = resolveOrThrow(request(`seed.test.condition-duration.${index}`));
      expect(allowed.has(artifact.resolvedDuration.durationOptionId)).toBe(true);
      selected.add(artifact.resolvedDuration.durationOptionId);
    }
    expect(selected).toEqual(allowed);
  });

  it('rejects crossed diagnosis/time targets and unapproved provenance', () => {
    const crossedDiagnosis = request();
    crossedDiagnosis.conditionState.diagnosisDefinitionId = 'diagnosis.test.other';
    expect(resolveConditionClinicalDuration(crossedDiagnosis)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const crossedTime = request();
    crossedTime.timeScopeId = 'time-scope.historical';
    expect(resolveConditionClinicalDuration(crossedTime)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const unapproved = request();
    unapproved.profile.review = {
      status: 'unreviewed',
      reviewerId: null,
      reviewedAt: null,
      sourceUseNoteIds: [],
    };
    expect(resolveConditionClinicalDuration(unapproved)).toMatchObject({
      ok: false,
      error: { code: 'UNAPPROVED_PROFILE' },
    });
  });

  it('rejects replay tampering', () => {
    const artifact = resolveOrThrow();
    const tamperedSeed = structuredClone(artifact);
    tamperedSeed.compileRequest.seed = 'seed.test.condition-duration.tampered';
    expect(verifyConditionClinicalDurationResolutionIntegrity(tamperedSeed)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });

    const malformed = structuredClone(artifact);
    malformed.optionEvaluations[0]!.selected = true;
    malformed.optionEvaluations[1]!.selected = true;
    expect(verifyConditionClinicalDurationResolutionIntegrity(malformed)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  });
});
