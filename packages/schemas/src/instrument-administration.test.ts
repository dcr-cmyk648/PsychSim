import { describe, expect, it } from 'vitest';

import {
  InstrumentAdministrationResolutionEnvelopeSchema,
  InstrumentDefinitionSchema,
  InstrumentItemResponseSchema,
  type InstrumentAdministrationResolutionEnvelope,
  type InstrumentItemResponse,
} from './index';

const instrumentDefinition = InstrumentDefinitionSchema.parse({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'instrument.test.two-item',
  modelVersion: 'instrument-item-response-only.v1',
  rightsBoundaryId: 'rights-boundary.test.instrument',
  items: [
    {
      id: 'instrument-item.test.one',
      responseScaleId: 'response-scale.test.zero-through-three',
      responseOptionIds: [
        'response-option.test.0',
        'response-option.test.1',
        'response-option.test.2',
        'response-option.test.3',
      ],
      informationActionId: 'info.testing.test-instrument',
      respondentSourceKind: 'patient_report',
      timeScopeId: 'time-scope.current',
    },
    {
      id: 'instrument-item.test.two',
      responseScaleId: 'response-scale.test.zero-through-three',
      responseOptionIds: [
        'response-option.test.0',
        'response-option.test.1',
        'response-option.test.2',
        'response-option.test.3',
      ],
      informationActionId: 'info.testing.test-instrument',
      respondentSourceKind: 'patient_report',
      timeScopeId: 'time-scope.current',
    },
  ],
  lifecycle: 'approved',
  medicalReviewStatus: 'approved',
});

const administrationDefinition = {
  schemaVersion: 1 as const,
  contentVersion: '1.0.0',
  id: 'instrument-administration-definition.test.two-item',
  modelVersion: 'instrument-administration.v1' as const,
  instrumentDefinitionId: instrumentDefinition.id,
  instrumentContentVersion: instrumentDefinition.contentVersion,
  informationActionId: 'info.testing.test-instrument',
  respondentSourceKind: 'patient_report' as const,
  timeScopeId: 'time-scope.current',
  rightsBoundaryId: instrumentDefinition.rightsBoundaryId,
  itemIds: ['instrument-item.test.one', 'instrument-item.test.two'],
  rawTotalRange: {
    minimum: 0,
    maximum: 6,
  },
  lifecycle: 'approved' as const,
  medicalReviewStatus: 'approved' as const,
};

const response = (itemId: string, responseOptionId: string): InstrumentItemResponse =>
  InstrumentItemResponseSchema.parse({
    schemaVersion: 1,
    id: `instrument-item-response.test.${itemId.split('.').at(-1)}`,
    instrumentDefinitionId: instrumentDefinition.id,
    instrumentContentVersion: instrumentDefinition.contentVersion,
    itemId,
    responseScaleId: 'response-scale.test.zero-through-three',
    responseOptionId,
    timeScopeId: 'time-scope.current',
    respondentSourceKind: 'patient_report',
    rightsBoundaryId: instrumentDefinition.rightsBoundaryId,
    interpretationIds: [],
    contributingResolvedFindingIds: [`resolved-finding.test.${itemId.split('.').at(-1)}`],
    propositionIds: [],
    evidenceIds: [],
    projectionId: `finding-projection.test.${itemId.split('.').at(-1)}`,
    projectionContentVersion: '1.0.0',
  });

const firstResponse = response('instrument-item.test.one', 'response-option.test.1');
const secondResponse = response('instrument-item.test.two', 'response-option.test.2');

const completeEnvelope = (): InstrumentAdministrationResolutionEnvelope => ({
  instrumentDefinition,
  administrationDefinition,
  itemResponses: [firstResponse, secondResponse],
  administration: {
    schemaVersion: 1,
    id: 'instrument-administration.test.two-item.current',
    definitionId: administrationDefinition.id,
    definitionContentVersion: administrationDefinition.contentVersion,
    instrumentDefinitionId: instrumentDefinition.id,
    instrumentContentVersion: instrumentDefinition.contentVersion,
    patientStateId: 'resolved-patient-state.test.instrument-administration',
    informationActionId: administrationDefinition.informationActionId,
    respondentSourceKind: administrationDefinition.respondentSourceKind,
    sourceInstanceId: 'source-instance.test.patient',
    timeScopeId: administrationDefinition.timeScopeId,
    rightsBoundaryId: administrationDefinition.rightsBoundaryId,
    completionStatus: 'complete',
    includedItemResponseIds: [firstResponse.id, secondResponse.id],
    missingItemIds: [],
    rawTotal: {
      status: 'calculated',
      value: 3,
    },
  },
});

describe('instrument administration boundary', () => {
  it('retains one complete exact administration and bounded authored raw total', () => {
    const parsed = InstrumentAdministrationResolutionEnvelopeSchema.parse(completeEnvelope());

    expect(parsed.administration.rawTotal).toEqual({
      status: 'calculated',
      value: 3,
    });
    expect(parsed.administration.includedItemResponseIds).toEqual([
      firstResponse.id,
      secondResponse.id,
    ]);
    expect(parsed.administrationDefinition).not.toHaveProperty('scoreFormula');
    expect(parsed.administrationDefinition).not.toHaveProperty('thresholds');
    expect(parsed.administration).not.toHaveProperty('interpretation');
  });

  it('preserves a partial administration without silently scoring a missing item as zero', () => {
    const partial = completeEnvelope();
    partial.itemResponses = [firstResponse];
    partial.administration.completionStatus = 'partial';
    partial.administration.includedItemResponseIds = [firstResponse.id];
    partial.administration.missingItemIds = ['instrument-item.test.two'];
    partial.administration.rawTotal = { status: 'not_calculated' };

    expect(InstrumentAdministrationResolutionEnvelopeSchema.safeParse(partial).success).toBe(true);

    const silentlyZeroed = structuredClone(partial);
    silentlyZeroed.administration.rawTotal = { status: 'calculated', value: 1 };
    expect(InstrumentAdministrationResolutionEnvelopeSchema.safeParse(silentlyZeroed).success).toBe(
      false,
    );

    const noResponses = completeEnvelope();
    noResponses.itemResponses = [];
    noResponses.administration.completionStatus = 'partial';
    noResponses.administration.includedItemResponseIds = [];
    noResponses.administration.missingItemIds = [
      'instrument-item.test.one',
      'instrument-item.test.two',
    ];
    noResponses.administration.rawTotal = { status: 'not_calculated' };
    expect(InstrumentAdministrationResolutionEnvelopeSchema.safeParse(noResponses).success).toBe(
      true,
    );
  });

  it('rejects totals outside the authoring-owned range or when no total is authorized', () => {
    const outsideRange = completeEnvelope();
    outsideRange.administration.rawTotal = { status: 'calculated', value: 7 };
    expect(InstrumentAdministrationResolutionEnvelopeSchema.safeParse(outsideRange).success).toBe(
      false,
    );

    const noTotalOwner = completeEnvelope();
    noTotalOwner.administrationDefinition.rawTotalRange = null;
    expect(InstrumentAdministrationResolutionEnvelopeSchema.safeParse(noTotalOwner).success).toBe(
      false,
    );

    noTotalOwner.administration.rawTotal = { status: 'not_calculated' };
    expect(InstrumentAdministrationResolutionEnvelopeSchema.safeParse(noTotalOwner).success).toBe(
      true,
    );
  });

  it('rejects stale coordinates, crossed responses, and incomplete item partitions', () => {
    const staleInstrument = completeEnvelope();
    staleInstrument.administration.instrumentContentVersion = '2.0.0';
    expect(
      InstrumentAdministrationResolutionEnvelopeSchema.safeParse(staleInstrument).success,
    ).toBe(false);

    const crossedResponse = completeEnvelope();
    crossedResponse.itemResponses[0]!.timeScopeId = 'time-scope.historical';
    expect(
      InstrumentAdministrationResolutionEnvelopeSchema.safeParse(crossedResponse).success,
    ).toBe(false);

    const duplicateItem = completeEnvelope();
    duplicateItem.itemResponses[1] = {
      ...duplicateItem.itemResponses[1]!,
      itemId: 'instrument-item.test.one',
    };
    expect(InstrumentAdministrationResolutionEnvelopeSchema.safeParse(duplicateItem).success).toBe(
      false,
    );

    const interpretedResponse = completeEnvelope();
    interpretedResponse.itemResponses[0]!.interpretationIds = ['interpretation.test.severe'];
    expect(
      InstrumentAdministrationResolutionEnvelopeSchema.safeParse(interpretedResponse).success,
    ).toBe(false);

    const missingPartition = completeEnvelope();
    missingPartition.administration.completionStatus = 'partial';
    missingPartition.administration.missingItemIds = ['instrument-item.test.one'];
    missingPartition.administration.rawTotal = { status: 'not_calculated' };
    expect(
      InstrumentAdministrationResolutionEnvelopeSchema.safeParse(missingPartition).success,
    ).toBe(false);
  });
});
