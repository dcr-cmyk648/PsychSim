import {
  ConditionEpisodeSeverityDerivationArtifactSchema,
  type ConditionEpisodeSeverityDerivationRequest,
  type ConditionFunctionalImpairmentProfile,
  type ConditionSymptomSeverityLevel,
  type FunctionalImpairmentLevel,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  deriveConditionEpisodeSeverity,
  verifyConditionEpisodeSeverityDerivationIntegrity,
} from './condition-episode-severity-derivation';
import { resolveConditionFunctionalImpairment } from './condition-functional-impairment-profile-resolver';
import { compilePatientSceneSourceInstances } from './patient-scene-source-instance-compiler';

const conditionState = {
  schemaVersion: 1 as const,
  id: 'condition-state.test.current-mdd',
  diagnosisDefinitionId: 'diagnosis.test.mdd',
  diagnosisDefinitionContentVersion: '1.0.0',
  clinicalStateId: 'clinical-state.current-episode',
  timeScopeId: 'time-scope.current',
  encounterRelevance: 'focus' as const,
  severityId: null,
  specifierIds: [],
  origin: 'authored' as const,
  resolution: {
    origin: 'authored' as const,
    ownerId: 'patient-template.test.current-mdd',
    ownerContentVersion: '1.0.0',
  },
};

const sourceHorizon = (
  patientStateId = 'resolved-patient-state.test.severity',
  sourceKind: 'patient_report' | 'collateral_report' = 'patient_report',
) => {
  const result = compilePatientSceneSourceInstances({
    schemaVersion: 1,
    id: `patient-scene-source-instance-request.test.severity.${sourceKind}.${patientStateId}`,
    patientStateId,
    definitions: [
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: `patient-scene-source-definition.test.severity.${sourceKind}`,
        kind: sourceKind,
      },
    ],
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const impairmentArtifact = (
  level: FunctionalImpairmentLevel,
  sourceInstanceCompilation = sourceHorizon(),
  recordedSourceKind: 'patient_report' | 'collateral_report' = 'patient_report',
) => {
  const profile: ConditionFunctionalImpairmentProfile = {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: `functional-impairment-profile.test.${level}`,
    relatedDiagnosisId: conditionState.diagnosisDefinitionId,
    options: [
      {
        id: `functional-impairment-option.test.${level}`,
        level,
      },
    ],
    developerOpinionIds: ['developer-opinion.test.functional-impairment'],
    review: {
      status: 'approved',
      reviewerId: 'reviewer.test',
      reviewedAt: '2026-08-03T16:00:00.000Z',
      sourceUseNoteIds: [],
    },
  };
  const result = resolveConditionFunctionalImpairment({
    schemaVersion: 1,
    id: `condition-functional-impairment-request.test.${level}`,
    patientStateId: 'resolved-patient-state.test.severity',
    conditionState: structuredClone(conditionState),
    profile,
    source: {
      kind: recordedSourceKind,
      sourceInstanceId: sourceInstanceCompilation.sourceInstances[0]!.id,
    },
    timeScopeId: conditionState.timeScopeId,
    seed: `seed.test.functional-impairment.${level}`,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const request = (
  symptomLevel: ConditionSymptomSeverityLevel = 'mild',
  impairmentLevel: FunctionalImpairmentLevel = 'none',
): ConditionEpisodeSeverityDerivationRequest => {
  const sourceInstanceCompilation = sourceHorizon();
  return {
    schemaVersion: 1,
    id: `condition-episode-severity-request.test.${symptomLevel}.${impairmentLevel}`,
    patientStateId: 'resolved-patient-state.test.severity',
    conditionState: structuredClone(conditionState),
    derivationOwner: {
      schemaVersion: 1,
      diagnosisDefinitionId: conditionState.diagnosisDefinitionId,
      diagnosisDefinitionContentVersion: conditionState.diagnosisDefinitionContentVersion,
      severityAxisId: 'severity-axis.test.mdd-episode',
      derivationPolicy: {
        id: 'severity-policy.test.higher-of',
        strategy: 'highest_qualitative_level',
        inputDimensions: ['symptom_severity', 'condition_attributed_functional_impairment'],
        review: {
          status: 'approved',
          reviewerId: 'reviewer.test',
          reviewedAt: '2026-08-03T16:00:00.000Z',
          sourceUseNoteIds: ['source-use.test.severity-higher-of'],
        },
      },
    },
    symptomSeverity: {
      schemaVersion: 1,
      id: `condition-symptom-severity.test.${symptomLevel}`,
      patientStateId: 'resolved-patient-state.test.severity',
      target: {
        kind: 'condition_state',
        conditionStateId: conditionState.id,
      },
      diagnosisDefinitionId: conditionState.diagnosisDefinitionId,
      diagnosisDefinitionContentVersion: conditionState.diagnosisDefinitionContentVersion,
      clinicalStateId: conditionState.clinicalStateId,
      timeScopeId: conditionState.timeScopeId,
      level: symptomLevel,
      resolutionOwner: {
        id: 'condition-symptom-severity-owner.test',
        contentVersion: '1.0.0',
        payloadFingerprint:
          'fingerprint.condition-symptom-severity.synthetic.fnv1a64.0123456789abcdef',
      },
    },
    functionalImpairmentResolution: impairmentArtifact(impairmentLevel, sourceInstanceCompilation),
    sourceInstanceCompilation,
  };
};

const deriveOrThrow = (input = request()) => {
  const result = deriveConditionEpisodeSeverity(input);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('D-269/D-297 condition episode-severity derivation', () => {
  it.each([
    ['mild', 'none', 'mild'],
    ['mild', 'mild', 'mild'],
    ['mild', 'moderate', 'moderate'],
    ['mild', 'severe', 'severe'],
    ['moderate', 'none', 'moderate'],
    ['moderate', 'mild', 'moderate'],
    ['moderate', 'moderate', 'moderate'],
    ['moderate', 'severe', 'severe'],
    ['severe', 'none', 'severe'],
    ['severe', 'mild', 'severe'],
    ['severe', 'moderate', 'severe'],
    ['severe', 'severe', 'severe'],
  ] as const)(
    'uses the higher qualitative level for symptom %s and impairment %s',
    (symptomLevel, impairmentLevel, expected) => {
      const artifact = deriveOrThrow(request(symptomLevel, impairmentLevel));
      expect(artifact.resolvedEpisodeSeverity).toMatchObject({
        qualitativeLevel: expected,
        inputLevels: {
          symptomSeverity: symptomLevel,
          conditionAttributedFunctionalImpairment: impairmentLevel,
        },
        derivationStrategy: 'highest_qualitative_level',
        attachmentStatus: 'derived_descriptor_only',
      });
      expect(artifact.resolvedEpisodeSeverity).not.toHaveProperty('severityId');
      expect(artifact.resolvedEpisodeSeverity).not.toHaveProperty('points');
      expect(artifact.resolvedEpisodeSeverity).not.toHaveProperty('complexityCost');
    },
  );

  it('freezes the exact same-episode inputs and replays deterministically', () => {
    const input = request('moderate', 'severe');
    const artifact = deriveOrThrow(input);
    const impairment = input.functionalImpairmentResolution.resolvedFunctionalImpairment;

    expect(ConditionEpisodeSeverityDerivationArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(artifact).toMatchObject({
      compilerVersion: '2.0.0',
      patientStateId: input.patientStateId,
      conditionStateId: conditionState.id,
      diagnosisOwnerRef: {
        diagnosisDefinitionId: conditionState.diagnosisDefinitionId,
        diagnosisDefinitionContentVersion: conditionState.diagnosisDefinitionContentVersion,
        severityAxisId: 'severity-axis.test.mdd-episode',
        derivationPolicyId: 'severity-policy.test.higher-of',
      },
      sourceInstanceCompilationRef: {
        id: input.sourceInstanceCompilation.id,
        payloadFingerprint: input.sourceInstanceCompilation.payloadFingerprint,
      },
      validatedFunctionalImpairmentSourceBinding: {
        sourceInstanceId: impairment.source.sourceInstanceId,
        sourceKind: impairment.source.kind,
      },
      resolvedEpisodeSeverity: {
        patientStateId: input.patientStateId,
        target: {
          kind: 'condition_state',
          conditionStateId: conditionState.id,
        },
        clinicalStateId: conditionState.clinicalStateId,
        timeScopeId: conditionState.timeScopeId,
      },
    });
    expect(deriveOrThrow(input)).toEqual(artifact);
    expect(verifyConditionEpisodeSeverityDerivationIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
  });

  it('canonicalizes policy input order without changing the artifact', () => {
    const first = deriveOrThrow();
    const reordered = request();
    reordered.derivationOwner.derivationPolicy.inputDimensions.reverse();

    expect(deriveOrThrow(reordered)).toEqual(first);
  });

  it('rejects crossed patient, condition, diagnosis, clinical-state, and time inputs', () => {
    const crossedPatient = request();
    crossedPatient.symptomSeverity.patientStateId = 'resolved-patient-state.test.other';
    expect(deriveConditionEpisodeSeverity(crossedPatient)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const crossedCondition = request();
    crossedCondition.symptomSeverity.target.conditionStateId = 'condition-state.test.other';
    expect(deriveConditionEpisodeSeverity(crossedCondition)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const crossedDiagnosis = request();
    crossedDiagnosis.symptomSeverity.diagnosisDefinitionId = 'diagnosis.test.other';
    expect(deriveConditionEpisodeSeverity(crossedDiagnosis)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const crossedClinicalState = request();
    crossedClinicalState.symptomSeverity.clinicalStateId = 'clinical-state.historical';
    expect(deriveConditionEpisodeSeverity(crossedClinicalState)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const crossedTime = request();
    crossedTime.symptomSeverity.timeScopeId = 'time-scope.historical';
    expect(deriveConditionEpisodeSeverity(crossedTime)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const crossedImpairmentEpisode = request();
    crossedImpairmentEpisode.functionalImpairmentResolution.compileRequest.conditionState.clinicalStateId =
      'clinical-state.historical';
    expect(deriveConditionEpisodeSeverity(crossedImpairmentEpisode)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });
  });

  it('requires one replay-valid independent source horizon with the exact source kind', () => {
    const rawD267Only = structuredClone(request()) as Record<string, unknown>;
    delete rawD267Only.sourceInstanceCompilation;
    expect(deriveConditionEpisodeSeverity(rawD267Only)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const crossedPatient = request();
    crossedPatient.sourceInstanceCompilation = sourceHorizon('resolved-patient-state.test.other');
    expect(deriveConditionEpisodeSeverity(crossedPatient)).toMatchObject({
      ok: false,
      error: { code: 'FUNCTIONAL_IMPAIRMENT_SOURCE_INVALID' },
    });

    const collateralHorizon = sourceHorizon(
      'resolved-patient-state.test.severity',
      'collateral_report',
    );
    const crossedKind = request();
    crossedKind.sourceInstanceCompilation = collateralHorizon;
    crossedKind.functionalImpairmentResolution = impairmentArtifact(
      'none',
      collateralHorizon,
      'patient_report',
    );
    expect(deriveConditionEpisodeSeverity(crossedKind)).toMatchObject({
      ok: false,
      error: { code: 'FUNCTIONAL_IMPAIRMENT_SOURCE_INVALID' },
    });

    const tamperedHorizon = request();
    tamperedHorizon.sourceInstanceCompilation.inputFingerprint =
      'fingerprint.patient-scene-source-instance-compilation.input.fnv1a64.0000000000000000';
    expect(deriveConditionEpisodeSeverity(tamperedHorizon)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SOURCE_INSTANCE_COMPILATION' },
    });
  });

  it('rejects an unapproved policy and an impairment artifact that fails replay', () => {
    const unapproved = request();
    unapproved.derivationOwner.derivationPolicy.review = {
      status: 'unreviewed',
      reviewerId: null,
      reviewedAt: null,
      sourceUseNoteIds: [],
    };
    expect(deriveConditionEpisodeSeverity(unapproved)).toMatchObject({
      ok: false,
      error: { code: 'UNAPPROVED_POLICY' },
    });

    const tamperedImpairment = request();
    tamperedImpairment.functionalImpairmentResolution.compileRequest.seed =
      'seed.test.functional-impairment.tampered';
    expect(deriveConditionEpisodeSeverity(tamperedImpairment)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_FUNCTIONAL_IMPAIRMENT_ARTIFACT' },
    });
  });

  it('rejects replay tampering in the derived descriptor and retained request', () => {
    const artifact = deriveOrThrow(request('mild', 'moderate'));
    const tamperedLevel = structuredClone(artifact);
    tamperedLevel.resolvedEpisodeSeverity.qualitativeLevel = 'severe';
    expect(verifyConditionEpisodeSeverityDerivationIntegrity(tamperedLevel)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });

    const tamperedInput = structuredClone(artifact);
    tamperedInput.compileRequest.symptomSeverity.resolutionOwner.contentVersion = '1.0.1';
    expect(verifyConditionEpisodeSeverityDerivationIntegrity(tamperedInput)).toMatchObject({
      ok: false,
      error: { code: 'REPLAY_MISMATCH' },
    });
  });
});
