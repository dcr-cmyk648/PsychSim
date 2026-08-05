import { InstrumentAdministrationSourceValidationArtifactSchema } from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  validateInstrumentAdministrationSource,
  verifyInstrumentAdministrationSourceValidationIntegrity,
} from './instrument-administration-source-validation';
import {
  compileTestInstrumentAdministration,
  compileTestInstrumentItemResponses,
  testInstrumentAdministrationRequest,
  testInstrumentSecondItemId,
} from './instrument-administration-test-fixture';
import { projectInstrumentAdministration } from './instrument-administration-projection';
import { compilePatientSceneSourceInstances } from './patient-scene-source-instance-compiler';

const expectSourceHorizon = (
  patientStateId: string,
  kind: 'patient_report' | 'collateral_report' | 'clinician_observation',
) => {
  const result = compilePatientSceneSourceInstances({
    schemaVersion: 1,
    id: `patient-scene-source-instance-request.test.instrument.${kind}`,
    patientStateId,
    definitions: [
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: `patient-scene-source-definition.test.instrument.${kind}`,
        kind,
      },
    ],
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const expectValidation = (
  administrationCompilation: unknown,
  sourceInstanceCompilation: unknown,
) => {
  const result = validateInstrumentAdministrationSource({
    schemaVersion: 1,
    id: 'instrument-administration-source-validation-request.test',
    administrationCompilation,
    sourceInstanceCompilation,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('instrument-administration source validation', () => {
  it('validates the respondent against an exact-patient D-291 horizon and derives D-284', () => {
    const itemResponses = compileTestInstrumentItemResponses();
    const sourceHorizon = expectSourceHorizon(itemResponses.patientStateId, 'patient_report');
    const sourceInstance = sourceHorizon.sourceInstances[0]!;
    const administration = compileTestInstrumentAdministration(
      testInstrumentAdministrationRequest(itemResponses, {
        sourceInstanceId: sourceInstance.id,
      }),
    );
    const artifact = expectValidation(administration, sourceHorizon);
    const projection = projectInstrumentAdministration(administration);
    expect(projection.ok).toBe(true);
    if (!projection.ok) throw new Error(projection.error.message);

    expect(artifact.validatedSourceBinding).toEqual({
      sourceInstanceId: sourceInstance.id,
      sourceKind: 'patient_report',
    });
    expect(artifact.projection).toEqual(projection.value);
    expect(InstrumentAdministrationSourceValidationArtifactSchema.parse(artifact)).toEqual(
      artifact,
    );
    expect(verifyInstrumentAdministrationSourceValidationIntegrity(artifact)).toEqual({
      ok: true,
      value: artifact,
    });
    expect(artifact).not.toHaveProperty('credibility');
    expect(artifact).not.toHaveProperty('accuracy');
    expect(artifact).not.toHaveProperty('interpretation');
  });

  it('preserves a valid partial administration without manufacturing a total', () => {
    const itemResponses = compileTestInstrumentItemResponses({
      respondedItemIds: ['instrument-item.test.one'],
    });
    const sourceHorizon = expectSourceHorizon(itemResponses.patientStateId, 'patient_report');
    const administration = compileTestInstrumentAdministration(
      testInstrumentAdministrationRequest(itemResponses, {
        sourceInstanceId: sourceHorizon.sourceInstances[0]!.id,
        includedItemResponseIds: itemResponses.responses.map((response) => response.id),
        missingItemIds: [testInstrumentSecondItemId],
        rawTotal: { status: 'not_calculated' },
      }),
    );
    const artifact = expectValidation(administration, sourceHorizon);

    expect(artifact.projection).toMatchObject({
      completionStatus: 'partial',
      completedItemCount: 1,
      missingItemCount: 1,
      rawTotal: { status: 'not_calculated' },
    });
  });

  it('rejects a crossed patient, missing instance, or crossed respondent kind', () => {
    const itemResponses = compileTestInstrumentItemResponses();
    const patientHorizon = expectSourceHorizon(itemResponses.patientStateId, 'patient_report');
    const administration = compileTestInstrumentAdministration(
      testInstrumentAdministrationRequest(itemResponses, {
        sourceInstanceId: patientHorizon.sourceInstances[0]!.id,
      }),
    );

    expect(
      validateInstrumentAdministrationSource({
        schemaVersion: 1,
        id: 'instrument-administration-source-validation-request.test.crossed-patient',
        administrationCompilation: administration,
        sourceInstanceCompilation: expectSourceHorizon(
          'resolved-patient-state.test.instrument.other',
          'patient_report',
        ),
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'PATIENT_STATE_CONTEXT_MISMATCH' },
    });

    const missingSourceAdministration = compileTestInstrumentAdministration(
      testInstrumentAdministrationRequest(itemResponses, {
        sourceInstanceId: 'patient-scene-source-instance.test.missing',
      }),
    );
    expect(
      validateInstrumentAdministrationSource({
        schemaVersion: 1,
        id: 'instrument-administration-source-validation-request.test.missing',
        administrationCompilation: missingSourceAdministration,
        sourceInstanceCompilation: patientHorizon,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'SOURCE_REFERENCE_INVALID' },
    });

    const collateralHorizon = expectSourceHorizon(
      itemResponses.patientStateId,
      'collateral_report',
    );
    const crossedKindAdministration = compileTestInstrumentAdministration(
      testInstrumentAdministrationRequest(itemResponses, {
        sourceInstanceId: collateralHorizon.sourceInstances[0]!.id,
      }),
    );
    expect(
      validateInstrumentAdministrationSource({
        schemaVersion: 1,
        id: 'instrument-administration-source-validation-request.test.crossed-kind',
        administrationCompilation: crossedKindAdministration,
        sourceInstanceCompilation: collateralHorizon,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'SOURCE_REFERENCE_INVALID' },
    });
  });

  it('detects upstream and retained-artifact tampering', () => {
    const itemResponses = compileTestInstrumentItemResponses();
    const sourceHorizon = expectSourceHorizon(itemResponses.patientStateId, 'patient_report');
    const administration = compileTestInstrumentAdministration(
      testInstrumentAdministrationRequest(itemResponses, {
        sourceInstanceId: sourceHorizon.sourceInstances[0]!.id,
      }),
    );
    const artifact = expectValidation(administration, sourceHorizon);

    const upstreamTamper = structuredClone(sourceHorizon);
    upstreamTamper.inputFingerprint =
      'fingerprint.patient-scene-source-instance-compilation.input.fnv1a64.0000000000000000';
    expect(
      validateInstrumentAdministrationSource({
        schemaVersion: 1,
        id: 'instrument-administration-source-validation-request.test.upstream-tamper',
        administrationCompilation: administration,
        sourceInstanceCompilation: upstreamTamper,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'SOURCE_HORIZON_INVALID' },
    });

    const retainedTamper = structuredClone(artifact);
    retainedTamper.inputFingerprint =
      'fingerprint.instrument-administration-source-validation.input.fnv1a64.0000000000000000';
    expect(verifyInstrumentAdministrationSourceValidationIntegrity(retainedTamper)).toMatchObject({
      ok: false,
      error: { code: 'INPUT_FINGERPRINT_MISMATCH' },
    });
  });
});
