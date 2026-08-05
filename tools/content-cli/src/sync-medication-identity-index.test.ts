import { describe, expect, it } from 'vitest';

import {
  renderMedicationIdentityIndex,
  synchronizeMedicationIdentityRegistry,
} from './sync-medication-identity-index';

describe('medication identity static index', () => {
  it('renders explicit deterministic imports from sorted per-medication owners', () => {
    expect(
      renderMedicationIdentityIndex(['alpha.identity.json', 'beta-two.identity.json']),
    ).toContain(
      "import identity002Json from '../../../content/catalogs/medications/identities/beta-two.identity.json';",
    );
    expect(
      renderMedicationIdentityIndex(['alpha.identity.json', 'beta-two.identity.json']),
    ).toContain(
      'export const rawMedicationIdentityJson = [\n  identity001Json,\n  identity002Json,',
    );
  });

  it('updates only exact medication membership and bumps the registry patch version', () => {
    const result = synchronizeMedicationIdentityRegistry(
      {
        schemaVersion: 1,
        contentVersion: '3.70.0',
        entries: [
          {
            id: 'registry.catalog.medication-identities',
            kind: 'medication_identity_catalog',
            path: 'content/catalogs/medications/identities',
            runtimeIncluded: true,
            categoryIds: ['medication.old'],
            dependsOnIds: [],
          },
        ],
      },
      [
        {
          schemaVersion: 1,
          contentVersion: '1.0.0',
          id: 'medication.beta',
          label: 'Beta',
          normalizedIngredientName: 'beta',
          aliases: [],
          authoringStatus: 'identity_only',
          runtimeMedicationDefinitionId: null,
          rxnorm: {
            rxcui: '2',
            termType: 'IN',
            suppress: 'N',
            releaseDate: '2026-08-03',
            evidenceSourceId: 'evidence.test.rxnorm',
            sourceUseDecisionId: 'source-use.test.rxnorm',
            verifiedAt: '2026-08-05T12:00:00.000Z',
          },
          medicalReviewStatus: 'unreviewed',
        },
        {
          schemaVersion: 1,
          contentVersion: '1.0.0',
          id: 'medication.alpha',
          label: 'Alpha',
          normalizedIngredientName: 'alpha',
          aliases: [],
          authoringStatus: 'identity_only',
          runtimeMedicationDefinitionId: null,
          rxnorm: {
            rxcui: '1',
            termType: 'IN',
            suppress: 'N',
            releaseDate: '2026-08-03',
            evidenceSourceId: 'evidence.test.rxnorm',
            sourceUseDecisionId: 'source-use.test.rxnorm',
            verifiedAt: '2026-08-05T12:00:00.000Z',
          },
          medicalReviewStatus: 'unreviewed',
        },
      ],
    );
    expect(result.changed).toBe(true);
    expect(result.registry.contentVersion).toBe('3.70.1');
    expect(result.registry.entries[0]?.categoryIds).toEqual([
      'medication.alpha',
      'medication.beta',
    ]);
  });
});
