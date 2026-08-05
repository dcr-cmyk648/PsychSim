import { describe, expect, it } from 'vitest';

import {
  compileInstrumentAdministration,
  verifyInstrumentAdministrationCompilationIntegrity,
} from './instrument-administration-compiler';
import {
  compileTestInstrumentAdministration,
  compileTestInstrumentItemResponses,
  testInstrumentAdministrationDefinition,
  testInstrumentAdministrationRequest,
  testInstrumentFirstItemId,
  testInstrumentNoOptionId,
  testInstrumentOtherOptionId,
  testInstrumentSecondItemId,
} from './instrument-administration-test-fixture';

describe('instrument administration compiler', () => {
  it('binds one complete administration to the exact patient-bound D-220 artifact', () => {
    const itemResponses = compileTestInstrumentItemResponses();
    const request = testInstrumentAdministrationRequest(itemResponses);
    const before = structuredClone(request);
    const artifact = compileTestInstrumentAdministration(request);

    expect(request).toEqual(before);
    expect(artifact.patientStateId).toBe(itemResponses.patientStateId);
    expect(artifact.administration).toMatchObject({
      patientStateId: itemResponses.patientStateId,
      completionStatus: 'complete',
      missingItemIds: [],
      rawTotal: {
        status: 'calculated',
        value: 3,
      },
    });
    expect(artifact.administration).not.toHaveProperty('interpretation');
    expect(artifact.administrationDefinitionRef).not.toHaveProperty('scoreFormula');
    expect(verifyInstrumentAdministrationCompilationIntegrity(artifact).ok).toBe(true);

    const reordered = testInstrumentAdministrationRequest(itemResponses, {
      administrationDefinition: testInstrumentAdministrationDefinition({
        itemIds: [testInstrumentSecondItemId, testInstrumentFirstItemId],
      }),
      includedItemResponseIds: [...itemResponses.responses]
        .reverse()
        .map((response) => response.id),
    });
    expect(compileTestInstrumentAdministration(reordered)).toEqual(artifact);
  });

  it('preserves one-response and zero-response partial administrations without a total', () => {
    const oneResponse = compileTestInstrumentItemResponses({
      respondedItemIds: [testInstrumentFirstItemId],
    });
    const firstResponse = oneResponse.responses[0]!;
    const partial = compileTestInstrumentAdministration(
      testInstrumentAdministrationRequest(oneResponse, {
        includedItemResponseIds: [firstResponse.id],
        missingItemIds: [testInstrumentSecondItemId],
        rawTotal: { status: 'not_calculated' },
      }),
    );
    expect(partial.administration).toMatchObject({
      completionStatus: 'partial',
      includedItemResponseIds: [firstResponse.id],
      missingItemIds: [testInstrumentSecondItemId],
      rawTotal: { status: 'not_calculated' },
    });

    const noResponses = compileTestInstrumentItemResponses({ respondedItemIds: [] });
    const attempted = compileTestInstrumentAdministration(
      testInstrumentAdministrationRequest(noResponses, {
        includedItemResponseIds: [],
        missingItemIds: [testInstrumentFirstItemId, testInstrumentSecondItemId],
        rawTotal: { status: 'not_calculated' },
      }),
    );
    expect(attempted.administration).toMatchObject({
      completionStatus: 'partial',
      includedItemResponseIds: [],
      missingItemIds: [testInstrumentFirstItemId, testInstrumentSecondItemId],
      rawTotal: { status: 'not_calculated' },
    });

    const silentlyZeroed = compileInstrumentAdministration(
      testInstrumentAdministrationRequest(oneResponse, {
        includedItemResponseIds: [firstResponse.id],
        missingItemIds: [testInstrumentSecondItemId],
        rawTotal: { status: 'calculated', value: 1 },
      }),
    );
    expect(silentlyZeroed).toMatchObject({
      ok: false,
      error: { code: 'ITEM_RESPONSE_COVERAGE_INVALID' },
    });
  });

  it('rejects structural D-220 failures, stale definitions, and unapproved administration owners', () => {
    const structurallyIncomplete = compileTestInstrumentItemResponses({
      respondedItemIds: [testInstrumentFirstItemId],
      secondResponseOptionId: testInstrumentOtherOptionId,
      secondHorizonOptionIds: [
        'response-option.test.yes',
        testInstrumentNoOptionId,
        testInstrumentOtherOptionId,
      ],
    });
    const structuralResult = compileInstrumentAdministration(
      testInstrumentAdministrationRequest(structurallyIncomplete, {
        includedItemResponseIds: structurallyIncomplete.responses.map((response) => response.id),
        missingItemIds: [testInstrumentSecondItemId],
        rawTotal: { status: 'not_calculated' },
      }),
    );
    expect(structuralResult).toMatchObject({
      ok: false,
      error: { code: 'ITEM_RESPONSE_COVERAGE_INVALID' },
    });

    const complete = compileTestInstrumentItemResponses();
    expect(
      compileInstrumentAdministration(
        testInstrumentAdministrationRequest(complete, {
          administrationDefinition: testInstrumentAdministrationDefinition({
            instrumentContentVersion: '2.0.0',
          }),
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'INSTRUMENT_DEFINITION_NOT_FOUND' },
    });
    expect(
      compileInstrumentAdministration(
        testInstrumentAdministrationRequest(complete, {
          administrationDefinition: testInstrumentAdministrationDefinition({
            lifecycle: 'review',
            medicalReviewStatus: 'unreviewed',
          }),
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'ADMINISTRATION_DEFINITION_NOT_APPROVED' },
    });
  });

  it('rejects tampered D-220 input, out-of-range totals, and replay changes', () => {
    const complete = compileTestInstrumentItemResponses();
    const tamperedD220 = structuredClone(complete);
    tamperedD220.responses[0]!.responseOptionId = testInstrumentNoOptionId;
    expect(
      compileInstrumentAdministration(testInstrumentAdministrationRequest(tamperedD220)),
    ).toMatchObject({
      ok: false,
      error: { code: 'ITEM_RESPONSE_COMPILATION_INVALID' },
    });

    expect(
      compileInstrumentAdministration(
        testInstrumentAdministrationRequest(complete, {
          rawTotal: { status: 'calculated', value: 7 },
        }),
      ),
    ).toMatchObject({
      ok: false,
      error: { code: 'ITEM_RESPONSE_COVERAGE_INVALID' },
    });

    const artifact = compileTestInstrumentAdministration(
      testInstrumentAdministrationRequest(complete),
    );
    const tamperedArtifact = structuredClone(artifact);
    tamperedArtifact.administration.sourceInstanceId = 'source-instance.test.other';
    expect(verifyInstrumentAdministrationCompilationIntegrity(tamperedArtifact).ok).toBe(false);
  });
});
