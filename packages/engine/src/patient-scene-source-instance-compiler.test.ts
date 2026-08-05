import {
  PatientSceneSourceInstanceCompilationArtifactSchema,
  type PatientSceneSourceInstanceCompilationRequest,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  compilePatientSceneSourceInstances,
  derivePatientSceneSourceInstanceId,
  validatePatientStateScopedSource,
  verifyPatientSceneSourceInstanceCompilationIntegrity,
} from './patient-scene-source-instance-compiler';

const patientStateId = 'resolved-patient-state.test.source-horizon';

const definitions: PatientSceneSourceInstanceCompilationRequest['definitions'] = [
  {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'patient-scene-source-definition.test.patient-report',
    kind: 'patient_report',
  },
  {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'patient-scene-source-definition.test.collateral-report',
    kind: 'collateral_report',
  },
  {
    schemaVersion: 1,
    contentVersion: '1.0.0',
    id: 'patient-scene-source-definition.test.laboratory-result',
    kind: 'laboratory_result',
  },
];

const request = (
  overrides: Partial<PatientSceneSourceInstanceCompilationRequest> = {},
): PatientSceneSourceInstanceCompilationRequest => ({
  schemaVersion: 1,
  id: 'patient-scene-source-instance-request.test',
  patientStateId,
  definitions,
  ...overrides,
});

const expectCompilation = (input: unknown) => {
  const result = compilePatientSceneSourceInstances(input);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('patient-scene source-instance compiler', () => {
  it('compiles a deterministic exact patient-bound source horizon', () => {
    const artifact = expectCompilation(request({ definitions: [...definitions].reverse() }));

    expect(artifact.patientStateId).toBe(patientStateId);
    expect(artifact.compileRequest.definitions.map((definition) => definition.id)).toEqual(
      [...definitions].map((definition) => definition.id).sort(),
    );
    expect(artifact.sourceInstances).toHaveLength(3);
    expect(
      artifact.sourceInstances.map((instance) => ({
        patientStateId: instance.patientStateId,
        definitionRef: instance.definitionRef,
        kind: instance.kind,
      })),
    ).toEqual(
      artifact.compileRequest.definitions.map((definition) => ({
        patientStateId,
        definitionRef: {
          id: definition.id,
          contentVersion: definition.contentVersion,
        },
        kind: definition.kind,
      })),
    );
    expect(PatientSceneSourceInstanceCompilationArtifactSchema.parse(artifact)).toEqual(artifact);
    expect(verifyPatientSceneSourceInstanceCompilationIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(expectCompilation(request())).toEqual(artifact);
    expect(artifact).not.toHaveProperty('credibility');
    expect(artifact).not.toHaveProperty('accuracy');
    expect(artifact).not.toHaveProperty('reliability');
    expect(artifact).not.toHaveProperty('informationActionIds');
  });

  it('allows an empty structural horizon without inferring that nothing was assessed', () => {
    const artifact = expectCompilation(request({ definitions: [] }));

    expect(artifact.sourceInstances).toEqual([]);
    expect(verifyPatientSceneSourceInstanceCompilationIntegrity(artifact).ok).toBe(true);
  });

  it('keeps source-role identity reusable while patient ownership remains horizon-scoped', () => {
    const first = expectCompilation(request());
    const second = expectCompilation(
      request({ patientStateId: 'resolved-patient-state.test.source-horizon.other' }),
    );

    expect(second.sourceInstances.map((instance) => instance.id)).toEqual(
      first.sourceInstances.map((instance) => instance.id),
    );
    expect(first.sourceInstances.map((instance) => instance.id)).toEqual(
      first.compileRequest.definitions.map(derivePatientSceneSourceInstanceId),
    );
    expect(second.patientStateId).not.toBe(first.patientStateId);
    expect(second.id).not.toBe(first.id);

    const patientReport = first.sourceInstances.find(
      (instance) => instance.kind === 'patient_report',
    )!;
    expect(
      validatePatientStateScopedSource(
        {
          kind: patientReport.kind,
          sourceInstanceId: patientReport.id,
        },
        first.patientStateId,
        second,
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'PATIENT_STATE_MISMATCH' },
    });
  });

  it('validates exact instance existence, patient ownership, and source kind', () => {
    const artifact = expectCompilation(request());
    const patientReport = artifact.sourceInstances.find(
      (instance) => instance.kind === 'patient_report',
    )!;

    expect(
      validatePatientStateScopedSource(
        {
          kind: 'patient_report',
          sourceInstanceId: patientReport.id,
        },
        patientStateId,
        artifact,
      ),
    ).toEqual({
      ok: true,
      value: {
        kind: 'patient_report',
        sourceInstanceId: patientReport.id,
      },
    });
    expect(
      validatePatientStateScopedSource(
        {
          kind: 'collateral_report',
          sourceInstanceId: patientReport.id,
        },
        patientStateId,
        artifact,
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'SOURCE_KIND_MISMATCH' },
    });
    expect(
      validatePatientStateScopedSource(
        {
          kind: 'patient_report',
          sourceInstanceId: 'patient-scene-source-instance.test.missing',
        },
        patientStateId,
        artifact,
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'SOURCE_INSTANCE_NOT_FOUND' },
    });
    expect(
      validatePatientStateScopedSource(
        {
          kind: 'patient_report',
          sourceInstanceId: patientReport.id,
        },
        'resolved-patient-state.test.other',
        artifact,
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'PATIENT_STATE_MISMATCH' },
    });
  });

  it('changes instance identity when its exact definition version changes', () => {
    const original = expectCompilation(request());
    const changedDefinitions = definitions.map((definition) =>
      definition.kind === 'patient_report'
        ? {
            ...definition,
            contentVersion: '2.0.0',
          }
        : definition,
    );
    const changed = expectCompilation(request({ definitions: changedDefinitions }));
    const originalPatientReport = original.sourceInstances.find(
      (instance) => instance.kind === 'patient_report',
    )!;
    const changedPatientReport = changed.sourceInstances.find(
      (instance) => instance.kind === 'patient_report',
    )!;

    expect(changedPatientReport.id).not.toBe(originalPatientReport.id);
    expect(changedPatientReport.definitionRef.contentVersion).toBe('2.0.0');
  });

  it('rejects duplicate definitions and detects request, payload, or replay tampering', () => {
    expect(
      compilePatientSceneSourceInstances(
        request({
          definitions: [definitions[0]!, definitions[0]!],
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const artifact = expectCompilation(request());
    const inputTamper = structuredClone(artifact);
    inputTamper.inputFingerprint =
      'fingerprint.patient-scene-source-instance-compilation.input.fnv1a64.0000000000000000';
    expect(verifyPatientSceneSourceInstanceCompilationIntegrity(inputTamper)).toMatchObject({
      ok: false,
      error: { code: 'INPUT_FINGERPRINT_MISMATCH' },
    });

    const payloadTamper = structuredClone(artifact);
    payloadTamper.sourceInstances[0]!.id = 'patient-scene-source-instance.test.changed';
    expect(verifyPatientSceneSourceInstanceCompilationIntegrity(payloadTamper)).toMatchObject({
      ok: false,
      error: { code: 'PAYLOAD_FINGERPRINT_MISMATCH' },
    });

    const crossedRequest = structuredClone(artifact);
    crossedRequest.compileRequest.definitions[0]!.kind = 'measurement';
    expect(verifyPatientSceneSourceInstanceCompilationIntegrity(crossedRequest)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  });
});
