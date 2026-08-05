import { describe, expect, it } from 'vitest';

import {
  compileInstrumentAdministrationAttachment,
  verifyInstrumentAdministrationAttachmentIntegrity,
} from './instrument-administration-attachment';
import {
  compileTestSourceValidatedInstrumentAdministration,
  compileTestInstrumentItemResponses,
  testInstrumentActionId,
  testInstrumentFirstItemId,
  testInstrumentSecondItemId,
} from './instrument-administration-test-fixture';

const attachmentRequest = (
  administrationSourceValidation = compileTestSourceValidatedInstrumentAdministration(),
  overrides: Record<string, unknown> = {},
) => {
  const administrationCompilation =
    administrationSourceValidation.compileRequest.administrationCompilation;
  const itemCompilation =
    administrationCompilation.compileRequest.instrumentItemResponseCompilation;
  const instrumentItemResponses = itemCompilation.responses.map((response) => {
    const evaluation = itemCompilation.evaluations.find(
      (candidate) => candidate.status === 'complete' && candidate.responseId === response.id,
    );
    if (!evaluation || evaluation.status !== 'complete') {
      throw new Error(`Missing complete evaluation for ${response.id}`);
    }
    return {
      schemaVersion: response.schemaVersion,
      id: response.id,
      informationActionId: evaluation.informationActionId,
      instrumentDefinitionId: response.instrumentDefinitionId,
      instrumentContentVersion: response.instrumentContentVersion,
      itemId: response.itemId,
      responseScaleId: response.responseScaleId,
      responseOptionId: response.responseOptionId,
      timeScopeId: response.timeScopeId,
      respondentSourceKind: response.respondentSourceKind,
      rightsBoundaryId: response.rightsBoundaryId,
    };
  });
  return {
    schemaVersion: 1,
    id: 'instrument-administration-attachment-request.test.two-item',
    attachmentContext: {
      schemaVersion: 1,
      id: 'instrument-administration-attachment-context.test.patient',
      patientStateId: administrationCompilation.patientStateId,
      informationActionIds: [testInstrumentActionId],
      instrumentItemResponses,
    },
    administrationSourceValidation,
    ...overrides,
  };
};

const compileAttachment = (request = attachmentRequest()) => {
  const result = compileInstrumentAdministrationAttachment(request);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe('instrument administration attachment compiler', () => {
  it('admits one exact D-293 source-validated administration into a frozen patient/action context', () => {
    const artifact = compileAttachment();

    expect(artifact.compilerVersion).toBe('2.0.0');
    expect(artifact.status).toBe('complete');
    expect(artifact.patientStateId).toBe(artifact.compileRequest.attachmentContext.patientStateId);
    expect(artifact.informationActionId).toBe(testInstrumentActionId);
    expect(artifact.administration).toMatchObject({
      patientStateId: artifact.patientStateId,
      informationActionId: testInstrumentActionId,
      completionStatus: 'complete',
      itemCount: 2,
      completedItemCount: 2,
      missingItemCount: 0,
      rawTotal: { status: 'calculated', value: 3 },
    });
    expect(artifact.includedInstrumentItemResponseIds).toEqual(
      artifact.compileRequest.administrationSourceValidation.compileRequest
        .administrationCompilation.administration.includedItemResponseIds,
    );
    expect(artifact.administrationSourceValidationRef).toEqual({
      id: artifact.compileRequest.administrationSourceValidation.id,
      payloadFingerprint: artifact.compileRequest.administrationSourceValidation.payloadFingerprint,
    });
    expect(verifyInstrumentAdministrationAttachmentIntegrity(artifact).ok).toBe(true);

    const reordered = attachmentRequest(artifact.compileRequest.administrationSourceValidation, {
      attachmentContext: {
        ...artifact.compileRequest.attachmentContext,
        informationActionIds: [
          ...artifact.compileRequest.attachmentContext.informationActionIds,
        ].reverse(),
        instrumentItemResponses: [
          ...artifact.compileRequest.attachmentContext.instrumentItemResponses,
        ].reverse(),
      },
    });
    expect(compileAttachment(reordered)).toEqual(artifact);
  });

  it('admits partial and zero-response administrations without manufacturing a total', () => {
    const oneResponse = compileTestInstrumentItemResponses({
      respondedItemIds: [testInstrumentFirstItemId],
    });
    const partialAdministration = compileTestSourceValidatedInstrumentAdministration({
      itemResponses: oneResponse,
      administrationOverrides: {
        includedItemResponseIds: [oneResponse.responses[0]!.id],
        missingItemIds: [testInstrumentSecondItemId],
        rawTotal: { status: 'not_calculated' },
      },
    });
    expect(
      compileAttachment(attachmentRequest(partialAdministration)).administration,
    ).toMatchObject({
      completionStatus: 'partial',
      completedItemCount: 1,
      missingItemCount: 1,
      rawTotal: { status: 'not_calculated' },
    });

    const noResponses = compileTestInstrumentItemResponses({ respondedItemIds: [] });
    const attemptedAdministration = compileTestSourceValidatedInstrumentAdministration({
      itemResponses: noResponses,
      administrationOverrides: {
        includedItemResponseIds: [],
        missingItemIds: [testInstrumentFirstItemId, testInstrumentSecondItemId],
        rawTotal: { status: 'not_calculated' },
      },
    });
    const attempted = compileAttachment(attachmentRequest(attemptedAdministration));
    expect(attempted.administration).toMatchObject({
      completionStatus: 'partial',
      completedItemCount: 0,
      missingItemCount: 2,
      rawTotal: { status: 'not_calculated' },
    });
    expect(attempted.includedInstrumentItemResponseIds).toEqual([]);
  });

  it('rejects crossed patient/action contexts and absent or changed frozen item responses', () => {
    const request = attachmentRequest();
    expect(
      compileInstrumentAdministrationAttachment({
        ...request,
        attachmentContext: {
          ...request.attachmentContext,
          patientStateId: 'resolved-patient-state.test.other',
        },
      }),
    ).toMatchObject({ ok: false, error: { code: 'PATIENT_CONTEXT_MISMATCH' } });
    expect(
      compileInstrumentAdministrationAttachment({
        ...request,
        attachmentContext: {
          ...request.attachmentContext,
          informationActionIds: ['info.testing.other'],
          instrumentItemResponses: [],
        },
      }),
    ).toMatchObject({ ok: false, error: { code: 'ACTION_CONTEXT_MISMATCH' } });
    expect(
      compileInstrumentAdministrationAttachment({
        ...request,
        attachmentContext: {
          ...request.attachmentContext,
          instrumentItemResponses: request.attachmentContext.instrumentItemResponses.slice(1),
        },
      }),
    ).toMatchObject({ ok: false, error: { code: 'ITEM_RESPONSE_CONTEXT_MISMATCH' } });

    const changedResponse = structuredClone(request);
    changedResponse.attachmentContext.instrumentItemResponses[0]!.responseOptionId =
      'response-option.test.changed';
    expect(compileInstrumentAdministrationAttachment(changedResponse)).toMatchObject({
      ok: false,
      error: { code: 'ITEM_RESPONSE_CONTEXT_MISMATCH' },
    });
  });

  it('rejects tampered D-283 input and detects output replay changes', () => {
    const request = attachmentRequest();
    expect(
      compileInstrumentAdministrationAttachment({
        schemaVersion: 1,
        id: request.id,
        attachmentContext: request.attachmentContext,
        administrationCompilation:
          request.administrationSourceValidation.compileRequest.administrationCompilation,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const crossed = structuredClone(request);
    crossed.administrationSourceValidation.compileRequest.administrationCompilation.administration.rawTotal =
      {
        status: 'calculated',
        value: 2,
      };
    expect(compileInstrumentAdministrationAttachment(crossed)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_REQUEST' },
    });

    const artifact = compileAttachment(request);
    const tampered = structuredClone(artifact);
    tampered.administration.completedItemCount = 1;
    tampered.administration.missingItemCount = 1;
    tampered.administration.completionStatus = 'partial';
    tampered.administration.rawTotal = { status: 'not_calculated' };
    expect(verifyInstrumentAdministrationAttachmentIntegrity(tampered).ok).toBe(false);
  });
});
