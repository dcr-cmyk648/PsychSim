import { describe, expect, it } from 'vitest';

import {
  intakeRxNormMedicationIdentities,
  medicationIdentityFromCandidate,
} from './intake-rxnorm-medication-identities';

describe('RxNorm medication identity intake', () => {
  it('creates identity-only metadata without indications, rules, formulary access, or points', () => {
    const identity = medicationIdentityFromCandidate(
      {
        schemaVersion: 1,
        contentVersion: '1.0.0',
        id: 'authoring.medication-identity-intake.test',
        rxnormVersion: '03-Aug-2026',
        rxnormReleaseDate: '2026-08-03',
        evidenceSourceId: 'evidence.nlm.rxnorm-api.2026-08-03',
        sourceUseDecisionId: 'source-use.nlm.rxnorm-api.2026-08-03',
        verifiedAt: '2026-08-05T12:00:00.000Z',
        sourcePacketIds: ['adjunct-packet.test'],
        scopeNote: 'Fixture.',
        candidates: [],
      },
      {
        id: 'medication.vortioxetine',
        label: 'Vortioxetine',
        normalizedIngredientName: 'vortioxetine',
        aliases: [],
        rxcui: '1455099',
      },
    );
    expect(identity).toEqual({
      schemaVersion: 1,
      contentVersion: '1.0.0',
      id: 'medication.vortioxetine',
      label: 'Vortioxetine',
      normalizedIngredientName: 'vortioxetine',
      aliases: [],
      authoringStatus: 'identity_only',
      runtimeMedicationDefinitionId: null,
      rxnorm: {
        rxcui: '1455099',
        termType: 'IN',
        suppress: 'N',
        releaseDate: '2026-08-03',
        evidenceSourceId: 'evidence.nlm.rxnorm-api.2026-08-03',
        sourceUseDecisionId: 'source-use.nlm.rxnorm-api.2026-08-03',
        verifiedAt: '2026-08-05T12:00:00.000Z',
      },
      medicalReviewStatus: 'unreviewed',
    });
    expect(identity).not.toHaveProperty('indications');
    expect(identity).not.toHaveProperty('points');
    expect(identity).not.toHaveProperty('classes');
  });

  it('keeps every checked-in candidate materialized and the static index synchronized offline', async () => {
    const result = await intakeRxNormMedicationIdentities();
    expect(result).toMatchObject({
      candidateCount: 70,
      createdIds: [],
      existingIds: expect.any(Array),
      rxnormRefreshed: false,
      indexIdentityCount: 125,
      registryContentVersion: '3.70.1',
    });
    expect(result.existingIds).toHaveLength(70);
  });
});
