import {
  ConditionFunctionalImpairmentResolutionArtifactSchema,
  type ConditionFunctionalImpairmentProfile,
  type ConditionFunctionalImpairmentResolutionRequest,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  fingerprintConditionFunctionalImpairmentProfile,
  resolveConditionFunctionalImpairment,
  verifyConditionFunctionalImpairmentResolutionIntegrity,
} from './condition-functional-impairment-profile-resolver';

const profile: ConditionFunctionalImpairmentProfile = {
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'functional-impairment-profile.test.current-episode',
  relatedDiagnosisId: 'diagnosis.test.depressive-disorder',
  options: [
    {
      id: 'functional-impairment-option.test.none',
      level: 'none',
    },
    {
      id: 'functional-impairment-option.test.mild',
      level: 'mild',
    },
    {
      id: 'functional-impairment-option.test.moderate',
      level: 'moderate',
    },
    {
      id: 'functional-impairment-option.test.severe',
      level: 'severe',
    },
  ],
  developerOpinionIds: ['developer-opinion.test.functional-impairment-profile'],
  review: {
    status: 'approved',
    reviewerId: 'reviewer.test',
    reviewedAt: '2026-08-03T16:00:00.000Z',
    sourceUseNoteIds: [],
  },
};

const request = (
  seed = 'seed.test.condition-functional-impairment',
): ConditionFunctionalImpairmentResolutionRequest => ({
  schemaVersion: 1,
  id: 'condition-functional-impairment-request.test',
  patientStateId: 'resolved-patient-state.test.condition-functional-impairment',
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
      ownerId: 'patient-template.test.condition-functional-impairment',
      ownerContentVersion: '1.0.0',
    },
  },
  profile: structuredClone(profile),
  source: {
    kind: 'patient_report',
    sourceInstanceId: 'source-instance.patient.test.condition-functional-impairment',
  },
  timeScopeId: 'time-scope.current',
  seed,
});

const resolveOrThrow = (input = request()) => {
  const result = resolveConditionFunctionalImpairment(input);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('D-267 condition functional-impairment profile resolver', () => {
  it('freezes one condition-attributed level with complete deterministic provenance', () => {
    const artifact = resolveOrThrow();
    const selected = artifact.optionEvaluations.filter((evaluation) => evaluation.selected);

    expect(ConditionFunctionalImpairmentResolutionArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(selected).toHaveLength(1);
    expect(artifact.resolvedFunctionalImpairment).toMatchObject({
      target: {
        kind: 'condition_state',
        conditionStateId: request().conditionState.id,
      },
      attribution: 'condition_attributed',
      level: selected[0]!.level,
      functionalImpairmentProfileId: profile.id,
      functionalImpairmentProfileContentVersion: profile.contentVersion,
      functionalImpairmentOptionId: selected[0]!.optionId,
      relatedDiagnosisId: profile.relatedDiagnosisId,
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
    expect(artifact.resolvedFunctionalImpairment).not.toHaveProperty('ordinalScaleId');
    expect(artifact.resolvedFunctionalImpairment).not.toHaveProperty('canonicalFindingId');
    expect(artifact.profileFingerprint).toBe(
      fingerprintConditionFunctionalImpairmentProfile(profile),
    );
    expect(verifyConditionFunctionalImpairmentResolutionIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('is stable for the same seed and insensitive to authoring array order', () => {
    const first = resolveOrThrow();
    expect(resolveOrThrow()).toEqual(first);

    const reordered = request();
    reordered.profile.options.reverse();
    expect(resolveOrThrow(reordered)).toEqual(first);
  });

  it('varies only among declared levels across many seeds', () => {
    const allowed = new Set(profile.options.map((option) => option.level));
    const selected = new Set<string>();
    for (let index = 0; index < 256; index += 1) {
      const artifact = resolveOrThrow(
        request(`seed.test.condition-functional-impairment.${index}`),
      );
      expect(allowed.has(artifact.resolvedFunctionalImpairment.level)).toBe(true);
      selected.add(artifact.resolvedFunctionalImpairment.level);
    }
    expect(selected).toEqual(allowed);
  });

  it('rejects crossed diagnosis/time targets, duplicate levels, and unapproved provenance', () => {
    const crossedDiagnosis = request();
    crossedDiagnosis.conditionState.diagnosisDefinitionId = 'diagnosis.test.other';
    expect(resolveConditionFunctionalImpairment(crossedDiagnosis)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const crossedTime = request();
    crossedTime.timeScopeId = 'time-scope.historical';
    expect(resolveConditionFunctionalImpairment(crossedTime)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const duplicateLevel = request();
    duplicateLevel.profile.options[1]!.level = duplicateLevel.profile.options[0]!.level;
    expect(resolveConditionFunctionalImpairment(duplicateLevel)).toMatchObject({
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
    expect(resolveConditionFunctionalImpairment(unapproved)).toMatchObject({
      ok: false,
      error: { code: 'UNAPPROVED_PROFILE' },
    });
  });

  it('rejects replay tampering', () => {
    const artifact = resolveOrThrow();
    const tamperedSeed = structuredClone(artifact);
    tamperedSeed.compileRequest.seed = 'seed.test.condition-functional-impairment.tampered';
    expect(verifyConditionFunctionalImpairmentResolutionIntegrity(tamperedSeed)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });

    const malformed = structuredClone(artifact);
    if (malformed.optionEvaluations.length > 1) {
      malformed.optionEvaluations[0]!.selected = true;
      malformed.optionEvaluations[1]!.selected = true;
    }
    expect(verifyConditionFunctionalImpairmentResolutionIntegrity(malformed)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  });
});
