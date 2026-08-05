import { describe, expect, it } from 'vitest';

import {
  projectInstrumentAdministration,
  verifyInstrumentAdministrationProjection,
} from './instrument-administration-projection';
import {
  compileTestInstrumentAdministration,
  compileTestInstrumentItemResponses,
  testInstrumentAdministrationRequest,
  testInstrumentFirstItemId,
  testInstrumentSecondItemId,
} from './instrument-administration-test-fixture';

const expectProjection = (artifact: unknown) => {
  const result = projectInstrumentAdministration(artifact);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('instrument administration presentation-safe projection', () => {
  it('projects only the exact complete administration summary and authored raw total', () => {
    const artifact = compileTestInstrumentAdministration();
    const projection = expectProjection(artifact);

    expect(projection).toEqual({
      schemaVersion: 1,
      id: artifact.administration.id,
      patientStateId: artifact.patientStateId,
      informationActionId: artifact.administration.informationActionId,
      administrationDefinitionId: artifact.administration.definitionId,
      administrationDefinitionContentVersion: artifact.administration.definitionContentVersion,
      instrumentDefinitionId: artifact.administration.instrumentDefinitionId,
      instrumentContentVersion: artifact.administration.instrumentContentVersion,
      respondentSourceKind: 'patient_report',
      timeScopeId: 'time-scope.current',
      rightsBoundaryId: artifact.administration.rightsBoundaryId,
      completionStatus: 'complete',
      itemCount: 2,
      completedItemCount: 2,
      missingItemCount: 0,
      rawTotal: {
        status: 'calculated',
        value: 3,
      },
    });
    expect(verifyInstrumentAdministrationProjection(artifact, projection).ok).toBe(true);
    expect(projection).not.toHaveProperty('sourceInstanceId');
    expect(projection).not.toHaveProperty('includedItemResponseIds');
    expect(projection).not.toHaveProperty('missingItemIds');
    expect(projection).not.toHaveProperty('rawTotalRange');
    expect(projection).not.toHaveProperty('compileRequest');
    expect(projection).not.toHaveProperty('payloadFingerprint');
    expect(projection).not.toHaveProperty('interpretation');
  });

  it('projects partial and zero-response attempts without manufacturing a score', () => {
    const oneResponse = compileTestInstrumentItemResponses({
      respondedItemIds: [testInstrumentFirstItemId],
    });
    const partialArtifact = compileTestInstrumentAdministration(
      testInstrumentAdministrationRequest(oneResponse, {
        includedItemResponseIds: [oneResponse.responses[0]!.id],
        missingItemIds: [testInstrumentSecondItemId],
        rawTotal: { status: 'not_calculated' },
      }),
    );
    expect(expectProjection(partialArtifact)).toMatchObject({
      completionStatus: 'partial',
      itemCount: 2,
      completedItemCount: 1,
      missingItemCount: 1,
      rawTotal: { status: 'not_calculated' },
    });

    const noResponses = compileTestInstrumentItemResponses({ respondedItemIds: [] });
    const attemptedArtifact = compileTestInstrumentAdministration(
      testInstrumentAdministrationRequest(noResponses, {
        includedItemResponseIds: [],
        missingItemIds: [testInstrumentFirstItemId, testInstrumentSecondItemId],
        rawTotal: { status: 'not_calculated' },
      }),
    );
    expect(expectProjection(attemptedArtifact)).toMatchObject({
      completionStatus: 'partial',
      itemCount: 2,
      completedItemCount: 0,
      missingItemCount: 2,
      rawTotal: { status: 'not_calculated' },
    });
  });

  it('rejects a tampered authoring artifact or presentation projection', () => {
    const artifact = compileTestInstrumentAdministration();
    const tamperedArtifact = structuredClone(artifact);
    tamperedArtifact.administration.rawTotal = { status: 'calculated', value: 2 };
    expect(projectInstrumentAdministration(tamperedArtifact)).toMatchObject({
      ok: false,
      error: { code: 'ADMINISTRATION_COMPILATION_INVALID' },
    });

    const projection = expectProjection(artifact);
    const impossibleCounts = {
      ...projection,
      completedItemCount: 1,
    };
    expect(verifyInstrumentAdministrationProjection(artifact, impossibleCounts)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_PROJECTION' },
    });

    const crossedTotal = {
      ...projection,
      rawTotal: { status: 'calculated' as const, value: 2 },
    };
    expect(verifyInstrumentAdministrationProjection(artifact, crossedTotal)).toMatchObject({
      ok: false,
      error: { code: 'PROJECTION_MISMATCH' },
    });
  });
});
