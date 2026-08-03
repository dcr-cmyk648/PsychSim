import {
  type DiagnosisDefinition,
  type DiagnosisSelectionHorizon,
  type PlayerDiagnosisSelections,
} from '@psychsim/schemas';
import { describe, expect, it } from 'vitest';

import {
  compileGeneratedDiagnosisSelectionOwners,
  validateGeneratedDiagnosisSelections,
  verifyGeneratedDiagnosisSelectionOwnerSetIntegrity,
} from './generated-diagnosis-selection-owner';

const reviewed = {
  status: 'approved' as const,
  reviewerId: 'reviewer.test',
  reviewedAt: '2026-08-03T00:00:00.000Z',
  sourceUseNoteIds: ['source-use.test.diagnosis-qualifier'],
};

const unreviewed = {
  status: 'unreviewed' as const,
  reviewerId: null,
  reviewedAt: null,
  sourceUseNoteIds: [] as string[],
};

const severityLevel = (
  id: string,
  rank: number,
  generationStatus: 'disabled_pending_source' | 'enabled',
) => ({
  id,
  label: id,
  rank,
  generationStatus,
  constraints: {
    criteriaSetId: generationStatus === 'enabled' ? 'criteria-set.test' : null,
    minimumPositiveCriteria: generationStatus === 'enabled' ? rank : null,
    maximumPositiveCriteria: null,
    requiredCriterionIds: [],
    forbiddenCriterionIds: [],
    minimumFunctionalImpairment: null,
  },
  addedClinicalTagIds: [],
  rules: [],
  complexityContributions: [],
  review: generationStatus === 'enabled' ? reviewed : unreviewed,
});

const definition = (overrides: Partial<DiagnosisDefinition> = {}): DiagnosisDefinition => ({
  schemaVersion: 1,
  contentVersion: '1.0.0',
  id: 'diagnosis.test.mdd',
  label: 'Synthetic MDD',
  searchAliases: [],
  selectableInGameplay: true,
  description: 'Synthetic diagnosis qualifier owner.',
  medicalReviewStatus: 'unreviewed',
  baseClinicalTagIds: [],
  baseRules: [],
  severityAxis: {
    id: 'severity-axis.test.mdd',
    label: 'Synthetic severity',
    playerSelectionMode: 'family_only',
    derivationPolicy: null,
    levels: [
      severityLevel('severity.test.mdd.mild', 1, 'disabled_pending_source'),
      severityLevel('severity.test.mdd.moderate', 2, 'disabled_pending_source'),
    ],
  },
  specifiers: [
    {
      id: 'specifier.test.mdd.psychotic-features',
      label: 'With psychotic features',
      playerSelectable: true,
      exclusiveGroupId: null,
      addedClinicalTagIds: [],
      rules: [],
      complexityContributions: [],
      review: reviewed,
    },
    {
      id: 'specifier.test.mdd.internal',
      label: 'Internal-only',
      playerSelectable: false,
      exclusiveGroupId: null,
      addedClinicalTagIds: [],
      rules: [],
      complexityContributions: [],
      review: reviewed,
    },
  ],
  comorbidityRelationships: [],
  complexityContributions: [],
  classificationBindings: [],
  sourceUseNotes: [],
  ...overrides,
});

const horizon: DiagnosisSelectionHorizon = {
  schemaVersion: 1,
  id: 'diagnosis-selection-horizon.test.generated-owner',
  allowEmptySelection: true,
  options: [
    {
      id: 'diagnosis-option.test.mdd',
      diagnosisDefinitionId: 'diagnosis.test.mdd',
      diagnosisDefinitionContentVersion: '1.0.0',
    },
  ],
};

const horizonFingerprint =
  'fingerprint.catalog-instance.diagnosis-selection-horizon.fnv1a64.2222222222222222';

const compile = (definitions: DiagnosisDefinition[]) =>
  compileGeneratedDiagnosisSelectionOwners({
    diagnosisSelectionHorizon: horizon,
    diagnosisSelectionHorizonFingerprint: horizonFingerprint,
    definitionOwners: { definitions },
  });

const selection = (
  severityId: string | null,
  specifierIds: string[] = [],
): PlayerDiagnosisSelections => [
  {
    diagnosisId: 'diagnosis.test.mdd',
    severityId,
    specifierIds,
  },
];

describe('generated diagnosis-selection qualifier owners', () => {
  it('freezes only family-level severity and reviewed player-selectable specifiers', () => {
    const result = compile([definition()]);
    expect(result).toMatchObject({
      ok: true,
      value: {
        modelVersion: 'generated-diagnosis-selection-owner-set.v1',
        owners: [
          {
            diagnosisOptionId: 'diagnosis-option.test.mdd',
            diagnosisRef: { id: 'diagnosis.test.mdd', contentVersion: '1.0.0' },
            playerSeverityMode: 'family_only',
            allowedSeverityIds: [],
            allowedSpecifiers: [
              {
                specifierId: 'specifier.test.mdd.psychotic-features',
                exclusiveGroupId: null,
              },
            ],
          },
        ],
      },
    });
    if (!result.ok) throw new Error(result.error.message);
    expect(
      validateGeneratedDiagnosisSelections({
        selections: selection(null, ['specifier.test.mdd.psychotic-features']),
        ownerSnapshot: result.value,
      }),
    ).toMatchObject({ ok: true });
    expect(
      validateGeneratedDiagnosisSelections({
        selections: selection('severity.test.mdd.moderate'),
        ownerSnapshot: result.value,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'DIAGNOSIS_QUALIFIER_OUTSIDE_HORIZON' },
    });
    expect(
      validateGeneratedDiagnosisSelections({
        selections: selection(null, ['specifier.test.mdd.internal']),
        ownerSnapshot: result.value,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'DIAGNOSIS_QUALIFIER_OUTSIDE_HORIZON' },
    });
  });

  it('fails closed for missing, stale, unselectable, or unsupported severity owners', () => {
    expect(compile([])).toMatchObject({
      ok: false,
      error: { code: 'OWNER_HORIZON_MISMATCH' },
    });
    expect(
      compile([
        definition({
          contentVersion: '2.0.0',
        }),
      ]),
    ).toMatchObject({
      ok: false,
      error: { code: 'OWNER_HORIZON_MISMATCH' },
    });
    expect(compile([definition({ selectableInGameplay: false })])).toMatchObject({
      ok: false,
      error: { code: 'UNAVAILABLE_DIAGNOSIS' },
    });
    const unsupported = definition();
    unsupported.severityAxis!.playerSelectionMode = 'severity_selectable';
    expect(compile([unsupported])).toMatchObject({
      ok: false,
      error: { code: 'UNAVAILABLE_SEVERITY_OWNER' },
    });
  });

  it('supports reviewed enabled severity, enforces specifier exclusivity, and detects tampering', () => {
    const selectable = definition();
    selectable.severityAxis = {
      ...selectable.severityAxis!,
      playerSelectionMode: 'severity_selectable',
      levels: [
        severityLevel('severity.test.mdd.mild', 1, 'enabled'),
        severityLevel('severity.test.mdd.moderate', 2, 'enabled'),
      ],
    };
    selectable.specifiers = [
      {
        id: 'specifier.test.first',
        label: 'First',
        playerSelectable: true,
        exclusiveGroupId: 'specifier-group.test.course',
        addedClinicalTagIds: [],
        rules: [],
        complexityContributions: [],
        review: reviewed,
      },
      {
        id: 'specifier.test.second',
        label: 'Second',
        playerSelectable: true,
        exclusiveGroupId: 'specifier-group.test.course',
        addedClinicalTagIds: [],
        rules: [],
        complexityContributions: [],
        review: reviewed,
      },
    ];
    const result = compile([selectable]);
    if (!result.ok) throw new Error(result.error.message);
    expect(
      validateGeneratedDiagnosisSelections({
        selections: selection('severity.test.mdd.moderate', ['specifier.test.first']),
        ownerSnapshot: result.value,
      }),
    ).toMatchObject({ ok: true });
    expect(
      validateGeneratedDiagnosisSelections({
        selections: selection(null, ['specifier.test.first', 'specifier.test.second']),
        ownerSnapshot: result.value,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'DIAGNOSIS_QUALIFIER_OUTSIDE_HORIZON' },
    });

    const tampered = structuredClone(result.value);
    tampered.owners[0]!.allowedSeverityIds = [];
    expect(verifyGeneratedDiagnosisSelectionOwnerSetIntegrity(tampered)).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SCHEMA' },
    });
  });
});
